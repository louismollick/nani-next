import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { fetchMyAnimeListIdsForAniListIds } from "../src/lib/anilist-id-map.ts"
import type { JimakuEntry } from "../src/lib/types.ts"

type JimakuPayload = {
  anilist_id?: number | null
  english_name?: string | null
  flags?: number
  japanese_name?: string | null
  last_modified?: number | null
  myanimelist_id?: number | null
  name: string
}

type JimakuEntryDraft = Omit<JimakuEntry, "fileCount">

const rootDirectory = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(
  rootDirectory,
  "../src/data/jimaku-snapshot.json"
)
const jimakuHomePage = "https://jimaku.cc/"

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&#34;", '"')
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
}

function normalizeTitle(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/["'`´’‘“”.,!?()[\]{}:_*+~]/g, " ")
    .replace(/[\s/\\|&-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function uniqStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const trimmed = value?.trim()

    if (!trimmed || seen.has(trimmed)) {
      continue
    }

    seen.add(trimmed)
    result.push(trimmed)
  }

  return result
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "jimaku-watch-list/1.0 (+https://github.com/mollicl/jimaku-watch-list)",
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`)
  }

  return response.text()
}

function parseHomepageEntries(html: string): JimakuEntryDraft[] {
  const entries: JimakuEntryDraft[] = []
  const regex =
    /<div class="entry" data-extra="([^"]+)">\s*<a href="(\/entry\/(\d+))" class="table-data file-name">/g

  for (const match of html.matchAll(regex)) {
    const payload = JSON.parse(decodeHtmlEntities(match[1])) as JimakuPayload
    const entryId = Number.parseInt(match[3], 10)
    const titles = uniqStrings([
      payload.name,
      payload.english_name,
      payload.japanese_name,
    ])

    entries.push({
      id: entryId,
      anilistId: payload.anilist_id ?? null,
      myanimelistId: payload.myanimelist_id ?? null,
      url: `https://jimaku.cc${match[2]}`,
      name: payload.name,
      englishName: payload.english_name ?? null,
      japaneseName: payload.japanese_name ?? null,
      flags: payload.flags ?? 0,
      updatedAt: payload.last_modified
        ? new Date(payload.last_modified * 1000).toISOString()
        : null,
      titles,
      normalizedTitles: titles
        .map((title) => normalizeTitle(title))
        .filter(Boolean),
    })
  }

  return entries
}

function parseFileCount(entryHtml: string, entryId: number) {
  const match = entryHtml.match(
    /<span id="total-file-count">(\d+) file(?:s)?<\/span>/
  )

  if (!match) {
    throw new Error(`Could not parse file count for entry ${entryId}`)
  }

  return Number.parseInt(match[1], 10)
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>
) {
  const result = new Array<TOutput>(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      result[currentIndex] = await mapper(items[currentIndex], currentIndex)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  return result
}

async function main() {
  const homepageHtml = await fetchText(jimakuHomePage)
  const parsedEntries = parseHomepageEntries(homepageHtml)
  console.log(`Collected ${parsedEntries.length} homepage entries`)

  const aniListIds = [
    ...new Set(
      parsedEntries.flatMap((entry) =>
        entry.anilistId !== null ? [entry.anilistId] : []
      )
    ),
  ]

  console.log(`Resolving MyAnimeList ids for ${aniListIds.length} AniList ids`)
  const myAnimeListIdsByAniListId = await fetchMyAnimeListIdsForAniListIds(
    aniListIds,
    {
      onProgress: ({ completed, total }) => {
        console.log(`Resolved ${completed}/${total} AniList ids`)
      },
    }
  )

  const baseEntries = parsedEntries.map((entry) => ({
    ...entry,
    myanimelistId:
      entry.myanimelistId ??
      (entry.anilistId !== null
        ? (myAnimeListIdsByAniListId.get(entry.anilistId) ?? null)
        : null),
  }))

  console.log(`Fetching file counts for ${baseEntries.length} Jimaku entries`)

  const completeEntries: JimakuEntry[] = await mapWithConcurrency(
    baseEntries,
    12,
    async (entry, index) => {
      if ((index + 1) % 250 === 0 || index === baseEntries.length - 1) {
        console.log(`Processed ${index + 1}/${baseEntries.length}`)
      }

      const entryHtml = await fetchText(entry.url)

      return {
        ...entry,
        fileCount: parseFileCount(entryHtml, entry.id),
      }
    }
  )

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(
    outputPath,
    `${JSON.stringify(completeEntries, null, 2)}\n`,
    "utf8"
  )
  console.log(`Wrote ${completeEntries.length} entries to ${outputPath}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
