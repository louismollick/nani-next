import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { JitenAnimeDifficultyEntry } from "../src/lib/types"

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

const rootDirectory = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(
  rootDirectory,
  "../src/data/jiten-anime-difficulty.json"
)
export const endpoint =
  "https://api.jiten.moe/api/media-deck/get-media-decks-by-type/1"

function externalId(links: JitenLink[], linkType: 4 | 5) {
  const expectedHost = linkType === 4 ? "anilist.co" : "myanimelist.net"
  for (const link of links) {
    if (link.linkType !== linkType || typeof link.url !== "string") continue
    try {
      const url = new URL(link.url)
      const match = url.pathname.match(/^\/anime\/(\d+)\/?$/)
      if (url.hostname === expectedHost && match) {
        return Number.parseInt(match[1], 10)
      }
    } catch {}
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
      if (deck.difficultyRaw < 0 || deck.difficultyRaw > 5) {
        throw new Error(`Out-of-range difficultyRaw for deck ${deck.deckId}`)
      }
      if (seenDeckIds.has(deck.deckId as number)) {
        throw new Error(`Duplicate deckId: ${deck.deckId}`)
      }
      seenDeckIds.add(deck.deckId as number)

      if (!Array.isArray(deck.links)) {
        throw new Error(`Invalid links for deck ${deck.deckId}`)
      }
      const links = deck.links as JitenLink[]
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
