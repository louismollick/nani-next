import { describe, expect, it } from "vitest"
import { getCompleteness } from "@/lib/overlap"
import type { AniListEntry } from "@/lib/types"

const finishedEntry: AniListEntry = {
  id: 1,
  progress: 12,
  score: 90,
  status: "COMPLETED",
  media: {
    id: 201,
    episodes: 12,
    averageScore: 87,
    popularity: 55000,
    status: "FINISHED",
    genres: ["Action"],
    format: "TV",
    siteUrl: "https://anilist.co/anime/201",
    synonyms: [],
    coverImage: {
      large: "https://example.com/finished.jpg",
      color: "#4f8dfc",
    },
    title: {
      romaji: "Ping Pong",
      english: "Ping Pong",
      native: "ピンポン",
    },
  },
}

describe("getCompleteness", () => {
  it("returns complete when jimaku file count covers episodes", () => {
    expect(getCompleteness(finishedEntry, 14)).toBe("complete")
  })

  it("returns incomplete when finished anime has fewer files than episodes", () => {
    expect(getCompleteness(finishedEntry, 8)).toBe("incomplete")
  })

  it("returns unknown when AniList episode count should not be judged", () => {
    expect(
      getCompleteness(
        {
          ...finishedEntry,
          media: {
            ...finishedEntry.media,
            episodes: null,
            status: "RELEASING",
          },
        },
        99
      )
    ).toBe("unknown")
  })
})
