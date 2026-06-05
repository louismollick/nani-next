import { describe, expect, it } from "vitest"
import {
  matchAnime,
  matchJpdbAnimeDifficulty,
  matchLearnNativelyAnimationLevel,
} from "@/lib/matching"
import type {
  AnimeEntry,
  JimakuEntry,
  JpdbAnimeDifficultyEntry,
  LearnNativelyAnimationLevelEntry,
} from "@/lib/types"

const baseAniListEntry: AnimeEntry = {
  source: "anilist",
  id: 1,
  progress: 3,
  score: 80,
  status: "CURRENT",
  media: {
    id: 101,
    anilistId: 101,
    myanimelistId: 201,
    episodes: 12,
    releasedEpisodes: 12,
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
      primary: "3-gatsu no Lion",
      english: "March comes in like a lion",
      native: "３月のライオン",
    },
  },
}

const byIdMatch: JimakuEntry = {
  id: 10,
  anilistId: 101,
  myanimelistId: 201,
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

const baseJpdbEntry: JpdbAnimeDifficultyEntry = {
  name: "March comes in like a lion",
  jpdbUrl: "https://jpdb.io/anime/101/march-comes-in-like-a-lion",
  lengthInWords: 12345,
  uniqueWords: 2000,
  uniqueWordsUsedOnce: 900,
  uniqueWordsUsedOncePercent: 45,
  uniqueKanji: 700,
  uniqueKanjiUsedOnce: 200,
  uniqueKanjiReadings: 1000,
  averageDifficulty: 25,
  peakDifficulty90thPercentile: 55,
}

const baseLearnNativelyEntry: LearnNativelyAnimationLevelEntry = {
  learnnativelyUrl:
    "https://learnnatively.com/season/march-comes-in-like-a-lion/",
  name: "March comes in like a lion",
  level: "L20",
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
          anilistId: null,
          myanimelistId: null,
          title: {
            primary: "Dandadann",
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
          myanimelistId: null,
          name: "Dandadan",
          titles: ["Dandadan"],
          normalizedTitles: ["dandadan"],
        },
        {
          ...byIdMatch,
          id: 12,
          anilistId: null,
          myanimelistId: null,
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
          anilistId: null,
          myanimelistId: null,
          title: {
            primary: "Canaan",
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
          myanimelistId: null,
          name: "NANA",
          titles: ["NANA"],
          normalizedTitles: ["nana"],
        },
      ]
    )

    expect(result).toBeNull()
  })

  it("accepts strong multi-token fuzzy matches above the cutoff", () => {
    const result = matchAnime(
      {
        ...baseAniListEntry,
        media: {
          ...baseAniListEntry.media,
          id: 999,
          anilistId: null,
          myanimelistId: null,
          title: {
            primary: "March Comes in Like a Lio",
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
          myanimelistId: null,
          name: "March Comes in Like a Lion",
          titles: ["March Comes in Like a Lion"],
          normalizedTitles: ["march comes in like a lion"],
        },
      ]
    )

    expect(result?.matchReason).toBe("fuzzy")
    expect(result?.matchScore).toBeGreaterThanOrEqual(0.9)
  })

  it("rejects fuzzy matches below the cutoff", () => {
    const result = matchAnime(
      {
        ...baseAniListEntry,
        media: {
          ...baseAniListEntry.media,
          id: 999,
          anilistId: null,
          myanimelistId: null,
          title: {
            primary: "March Comes in a Lion",
            english: null,
            native: null,
          },
          synonyms: [],
        },
      },
      [
        {
          ...byIdMatch,
          id: 17,
          anilistId: null,
          myanimelistId: null,
          name: "March Comes in Like a Lion",
          titles: ["March Comes in Like a Lion"],
          normalizedTitles: ["march comes in like a lion"],
        },
      ]
    )

    expect(result).toBeNull()
  })

  it("matches JPDB entries on exact normalized titles", () => {
    const result = matchJpdbAnimeDifficulty(baseAniListEntry, [baseJpdbEntry])

    expect(result?.matchReason).toBe("exact-title")
    expect(result?.entry.averageDifficulty).toBe(25)
  })

  it("matches LearnNatively entries on exact normalized titles", () => {
    const result = matchLearnNativelyAnimationLevel(baseAniListEntry, [
      {
        ...baseLearnNativelyEntry,
        name: "３月のライオン",
      },
    ])

    expect(result?.matchReason).toBe("exact-title")
    expect(result?.entry.level).toBe("L20")
  })

  it("accepts strong LearnNatively fuzzy matches", () => {
    const result = matchLearnNativelyAnimationLevel(
      {
        ...baseAniListEntry,
        media: {
          ...baseAniListEntry.media,
          id: 999,
          anilistId: null,
          myanimelistId: null,
          title: {
            primary: "March Comes in Like a Lio",
            english: null,
            native: null,
          },
          synonyms: [],
        },
      },
      [baseLearnNativelyEntry]
    )

    expect(result?.matchReason).toBe("fuzzy")
    expect(result?.matchScore).toBeGreaterThanOrEqual(0.9)
  })

  it("rejects single-token fuzzy JPDB matches", () => {
    const result = matchJpdbAnimeDifficulty(
      {
        ...baseAniListEntry,
        media: {
          ...baseAniListEntry.media,
          id: 999,
          anilistId: null,
          myanimelistId: null,
          title: {
            primary: "Canaan",
            english: null,
            native: null,
          },
          synonyms: [],
        },
      },
      [
        {
          ...baseJpdbEntry,
          name: "NANA",
          jpdbUrl: "https://jpdb.io/anime/15/nana",
        },
      ]
    )

    expect(result).toBeNull()
  })

  it("rejects ambiguous LearnNatively fuzzy matches", () => {
    const result = matchLearnNativelyAnimationLevel(
      {
        ...baseAniListEntry,
        media: {
          ...baseAniListEntry.media,
          id: 999,
          anilistId: null,
          myanimelistId: null,
          title: {
            primary: "Dandadann",
            english: null,
            native: null,
          },
          synonyms: [],
        },
      },
      [
        {
          ...baseLearnNativelyEntry,
          name: "Dandadan",
          learnnativelyUrl: "https://learnnatively.com/season/dandadan/",
        },
        {
          ...baseLearnNativelyEntry,
          name: "Dandadn",
          learnnativelyUrl: "https://learnnatively.com/season/dandadn/",
        },
      ]
    )

    expect(result).toBeNull()
  })
})
