import { describe, expect, it } from "vitest"
import { normalizeJitenDifficulty } from "../src/lib/jiten"
import {
  endpoint,
  parseJitenAnimeDecks,
} from "./refresh-jiten-anime-difficulty"

describe("parseJitenAnimeDecks", () => {
  it("extracts IDs, ignores malformed links, and sorts by deck ID", () => {
    expect(
      parseJitenAnimeDecks([
        {
          deckId: 2,
          difficultyRaw: 2.74,
          originalTitle: "Two",
          links: [{ linkType: 5, url: "https://myanimelist.net/anime/22" }],
        },
        {
          deckId: 1,
          difficultyRaw: 1.26,
          originalTitle: "One",
          aliases: ["First"],
          links: [
            { linkType: 4, url: "https://anilist.co/anime/11/" },
            { linkType: 5, url: "https://myanimelist.net/anime/" },
          ],
        },
      ])
    ).toEqual([
      {
        deckId: 1,
        jitenUrl: "https://jiten.moe/decks/media/1/detail",
        titles: ["One", "First"],
        anilistId: 11,
        myanimelistId: null,
        difficultyRaw: 1.26,
      },
      expect.objectContaining({ deckId: 2, myanimelistId: 22 }),
    ])
  })

  it("uses the anime-only endpoint and rejects foreign external links", () => {
    expect(endpoint).toBe(
      "https://api.jiten.moe/api/media-deck/get-media-decks-by-type/1"
    )
    const [entry] = parseJitenAnimeDecks([
      {
        deckId: 1,
        difficultyRaw: 2.74,
        links: [{ linkType: 4, url: "https://example.com/anime/11" }],
      },
    ])
    expect(entry.anilistId).toBeNull()
    expect(normalizeJitenDifficulty(entry.difficultyRaw)).toBe(2.7)
  })

  it("rejects invalid ratings and duplicate deck IDs", () => {
    expect(() =>
      parseJitenAnimeDecks([{ deckId: 1, difficultyRaw: Number.NaN }])
    ).toThrow("Invalid difficultyRaw")
    expect(() =>
      parseJitenAnimeDecks([
        { deckId: 1, difficultyRaw: 1, links: [] },
        { deckId: 1, difficultyRaw: 2, links: [] },
      ])
    ).toThrow("Duplicate deckId")
    expect(() =>
      parseJitenAnimeDecks([{ deckId: 1, difficultyRaw: 5.1, links: [] }])
    ).toThrow("Out-of-range difficultyRaw")
    expect(() =>
      parseJitenAnimeDecks([{ deckId: 1, difficultyRaw: 1, links: null }])
    ).toThrow("Invalid links")
  })
})
