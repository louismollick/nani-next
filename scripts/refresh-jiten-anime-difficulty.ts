import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

type JitenLink = { linkType?: unknown; url?: unknown }
type JitenDeck = {
  deckId?: unknown
  difficultyRaw?: unknown
  originalTitle?: unknown
  romajiTitle?: unknown
  englishTitle?: unknown
  aliases?: unknown
  links?: unknown
}

export type JitenAnimeDifficultyEntry = {
  deckId: number
  jitenUrl: string
  titles: string[]
  anilistId: number | null
  myanimelistId: number | null
  difficultyRaw: number
}

const rootDirectory = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(
  rootDirectory,
  "../src/data/jiten-anime-difficulty.json"
)
const endpoint =
  "https://api.jiten.moe/api/media-deck/get-media-decks-by-type/1"

function externalId(links: JitenLink[], linkType: number) {
  for (const link of links) {
    if (link.linkType !== linkType || typeof link.url !== "string") continue
    const match = link.url.match(/\/(\d+)\/?$/)
    if (match) return Number.parseInt(match[1], 10)
  }
  return null
}

export function parseJitenAnimeDecks(payload: unknown) {
  if (!Array.isArray(payload)) throw new Error("Expected a Jiten deck array")

  const seenDeckIds = new Set<number>()
  return payload
    .map((value, index): JitenAnimeDifficultyEntry => {
      const deck = value as JitenDeck
      if (!Number.isInteger(deck.deckId) || (deck.deckId as number) <= 0) {
        throw new Error(`Invalid deckId at index ${index}`)
      }
      if (
        typeof deck.difficultyRaw !== "number" ||
        !Number.isFinite(deck.difficultyRaw)
      ) {
        throw new Error(`Invalid difficultyRaw for deck ${deck.deckId}`)
      }
      if (seenDeckIds.has(deck.deckId as number)) {
        throw new Error(`Duplicate deckId: ${deck.deckId}`)
      }
      seenDeckIds.add(deck.deckId as number)

      const links = Array.isArray(deck.links) ? (deck.links as JitenLink[]) : []
      const titles = [
        deck.originalTitle,
        deck.romajiTitle,
        deck.englishTitle,
        ...(Array.isArray(deck.aliases) ? deck.aliases : []),
      ].filter(
        (title, titleIndex, all): title is string =>
          typeof title === "string" &&
          title.trim().length > 0 &&
          all.indexOf(title) === titleIndex
      )

      return {
        deckId: deck.deckId as number,
        jitenUrl: `https://jiten.moe/decks/media/${deck.deckId}/detail`,
        titles,
        anilistId: externalId(links, 4),
        myanimelistId: externalId(links, 5),
        difficultyRaw: deck.difficultyRaw,
      }
    })
    .sort((left, right) => left.deckId - right.deckId)
}

async function main() {
  const response = await fetch(endpoint, {
    headers: {
      "user-agent":
        "nani-next/1.0 (+https://github.com/louismollick/nani-next)",
    },
  })
  if (!response.ok) throw new Error(`Jiten request failed: ${response.status}`)

  const entries = parseJitenAnimeDecks(await response.json())
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8")
  console.log(`Wrote ${entries.length} entries to ${outputPath}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
}
