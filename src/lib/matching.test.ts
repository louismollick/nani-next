import { describe, expect, it } from "vitest"
import { matchAnime } from "@/lib/matching"
import type { AniListEntry, JimakuEntry } from "@/lib/types"

const baseAniListEntry: AniListEntry = {
  id: 1,
  progress: 3,
  score: 80,
  status: "CURRENT",
  media: {
    id: 101,
    episodes: 12,
    averageScore: 80,
    popularity: 25000,
    status: "FINISHED",
    genres: ["Drama"],
    format: "TV",
    siteUrl: "https://anilist.co/anime/101",
    synonyms: ["March Comes in Like a Lion"],
    coverImage: {
      large: "https://example.com/poster.jpg",
      color: "#4f8dfc",
    },
    title: {
      romaji: "3-gatsu no Lion",
      english: "March comes in like a lion",
      native: "３月のライオン",
    },
  },
}

const byIdMatch: JimakuEntry = {
  id: 10,
  anilistId: 101,
  url: "https://jimaku.cc/entry/10",
  name: "3-gatsu no Lion",
  englishName: "March comes in like a lion",
  japaneseName: "３月のライオン",
  fileCount: 40,
  flags: 1,
  updatedAt: null,
  titles: ["3-gatsu no Lion", "March comes in like a lion", "３月のライオン"],
  normalizedTitles: [
    "3 gatsu no lion",
    "march comes in like a lion",
    "3月のライオン",
  ],
}

describe("matchAnime", () => {
  it("prefers exact AniList ID matches", () => {
    const result = matchAnime(baseAniListEntry, [byIdMatch])

    expect(result?.matchReason).toBe("anilist-id")
    expect(result?.matchScore).toBe(1)
  })

  it("keeps alternates when fuzzy candidates are close", () => {
    const result = matchAnime(
      {
        ...baseAniListEntry,
        media: {
          ...baseAniListEntry.media,
          id: 999,
          title: {
            romaji: "Dandadann",
            english: null,
            native: null,
          },
          synonyms: [],
        },
      },
      [
        {
          ...byIdMatch,
          id: 11,
          anilistId: null,
          name: "Dandadan",
          titles: ["Dandadan"],
          normalizedTitles: ["dandadan"],
        },
        {
          ...byIdMatch,
          id: 12,
          anilistId: null,
          name: "Dandadn",
          titles: ["Dandadn"],
          normalizedTitles: ["dandadn"],
        },
      ]
    )

    expect(result).toBeNull()
  })

  it("rejects fuzzy matching for single-token titles", () => {
    const result = matchAnime(
      {
        ...baseAniListEntry,
        media: {
          ...baseAniListEntry.media,
          id: 999,
          title: {
            romaji: "Canaan",
            english: null,
            native: null,
          },
          synonyms: [],
        },
      },
      [
        {
          ...byIdMatch,
          id: 15,
          anilistId: null,
          name: "NANA",
          titles: ["NANA"],
          normalizedTitles: ["nana"],
        },
      ]
    )

    expect(result).toBeNull()
  })

  it("accepts strong multi-token fuzzy matches", () => {
    const result = matchAnime(
      {
        ...baseAniListEntry,
        media: {
          ...baseAniListEntry.media,
          id: 999,
          title: {
            romaji: "March Comes Like a Lion",
            english: null,
            native: null,
          },
          synonyms: [],
        },
      },
      [
        {
          ...byIdMatch,
          id: 16,
          anilistId: null,
          name: "March Comes in Like a Lion",
          titles: ["March Comes in Like a Lion"],
          normalizedTitles: ["march comes in like a lion"],
        },
      ]
    )

    expect(result?.matchReason).toBe("fuzzy")
    expect(result?.matchScore).toBeGreaterThanOrEqual(0.82)
  })
})
