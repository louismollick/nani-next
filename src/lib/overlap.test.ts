import { describe, expect, it } from "vitest"
import { buildOverlapResults, getCompleteness } from "@/lib/overlap"
import type {
  AnimeEntry,
  JimakuEntry,
  JpdbAnimeDifficultyEntry,
  LearnNativelyAnimationLevelEntry,
} from "@/lib/types"

const finishedEntry: AnimeEntry = {
  source: "anilist",
  id: 1,
  progress: 12,
  score: 90,
  status: "COMPLETED",
  media: {
    id: 201,
    anilistId: 201,
    myanimelistId: 301,
    episodes: 12,
    releasedEpisodes: 12,
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
      primary: "Ping Pong",
      english: "Ping Pong",
      native: "ピンポン",
    },
  },
}

const jimakuEntry: JimakuEntry = {
  id: 301,
  anilistId: 201,
  myanimelistId: 301,
  url: "https://jimaku.cc/entry/301",
  name: "Ping Pong",
  englishName: "Ping Pong",
  japaneseName: "ピンポン",
  fileCount: 14,
  flags: 1,
  updatedAt: null,
  titles: ["Ping Pong", "ピンポン"],
  normalizedTitles: ["ping pong", "ピンポン"],
}

const jpdbEntry: JpdbAnimeDifficultyEntry = {
  name: "Ping Pong",
  jpdbUrl: "https://jpdb.io/anime/301/ping-pong",
  lengthInWords: 1000,
  uniqueWords: 500,
  uniqueWordsUsedOnce: 200,
  uniqueWordsUsedOncePercent: 40,
  uniqueKanji: 250,
  uniqueKanjiUsedOnce: 80,
  uniqueKanjiReadings: 320,
  averageDifficulty: 10,
  peakDifficulty90thPercentile: 25,
}

const learnNativelyEntry: LearnNativelyAnimationLevelEntry = {
  learnnativelyUrl: "https://learnnatively.com/season/ping-pong/",
  name: "Ping Pong",
  level: "L10",
}

describe("getCompleteness", () => {
  it("returns complete when jimaku file count covers episodes", () => {
    expect(getCompleteness(finishedEntry, 14)).toBe("complete")
  })

  it("returns incomplete when finished anime has fewer files than episodes", () => {
    expect(getCompleteness(finishedEntry, 8)).toBe("incomplete")
  })

  it("returns complete for releasing anime when files cover aired episodes", () => {
    expect(
      getCompleteness(
        {
          ...finishedEntry,
          media: {
            ...finishedEntry.media,
            releasedEpisodes: 8,
            status: "RELEASING",
          },
        },
        8
      )
    ).toBe("complete")
  })

  it("returns incomplete for releasing anime when files lag aired episodes", () => {
    expect(
      getCompleteness(
        {
          ...finishedEntry,
          media: {
            ...finishedEntry.media,
            releasedEpisodes: 8,
            status: "RELEASING",
          },
        },
        7
      )
    ).toBe("incomplete")
  })

  it("returns unknown when released episode count should not be judged", () => {
    expect(
      getCompleteness(
        {
          ...finishedEntry,
          media: {
            ...finishedEntry.media,
            releasedEpisodes: null,
            status: "RELEASING",
          },
        },
        99
      )
    ).toBe("unknown")
  })
})

describe("buildOverlapResults", () => {
  it("attaches optional JPDB and LearnNatively matches", () => {
    const [result] = buildOverlapResults(
      [finishedEntry],
      [jimakuEntry],
      [jpdbEntry],
      [learnNativelyEntry]
    )

    expect(result?.matchedJpdb?.entry.averageDifficulty).toBe(10)
    expect(result?.matchedLearnNatively?.entry.level).toBe("L10")
    expect(result?.matchedLearnNatively?.jlptEquivalent).toBe("N5")
  })

  it("leaves difficulty matches undefined when datasets do not match", () => {
    const [result] = buildOverlapResults([finishedEntry], [jimakuEntry], [], [])

    expect(result?.matchedJpdb).toBeUndefined()
    expect(result?.matchedLearnNatively).toBeUndefined()
  })
})
