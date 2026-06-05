export const animeSources = ["anilist", "myanimelist"] as const

export const watchStatuses = [
  "CURRENT",
  "PLANNING",
  "COMPLETED",
  "PAUSED",
  "DROPPED",
] as const

export const mediaStatuses = [
  "FINISHED",
  "RELEASING",
  "CANCELLED",
  "HIATUS",
] as const

export const mediaStatusesAll = [...mediaStatuses, "NOT_YET_RELEASED"] as const

export const sortOptions = ["status", "averageScore", "popularity"] as const
export const subtitleAvailabilityOptions = ["all", "some", "none"] as const
export const difficultyFilterModes = [
  "none",
  "jpdbAverageDifficulty",
  "learnNativelyLevel",
  "learnNativelyJlptEquivalent",
] as const
export const learnNativelyJlptEquivalents = [
  "N5",
  "N4",
  "N3",
  "N2",
  "N1",
  "N1+",
] as const

export type AnimeSource = (typeof animeSources)[number]
export type WatchStatus = (typeof watchStatuses)[number]
export type SortOption = (typeof sortOptions)[number]
export type SubtitleAvailabilityOption =
  (typeof subtitleAvailabilityOptions)[number]
export type DifficultyFilterMode = (typeof difficultyFilterModes)[number]
export type LearnNativelyJlptEquivalent =
  (typeof learnNativelyJlptEquivalents)[number]
export type MediaStatus = (typeof mediaStatusesAll)[number] | null

export type AnimeTitle = {
  primary: string | null
  english: string | null
  native: string | null
}

export type AnimeMedia = {
  id: number
  anilistId: number | null
  myanimelistId: number | null
  episodes: number | null
  releasedEpisodes: number | null
  averageScore: number | null
  popularity: number | null
  status: MediaStatus
  genres: string[]
  format: string | null
  siteUrl: string
  synonyms: string[]
  coverImage: {
    large: string
    color: string | null
  }
  title: AnimeTitle
}

export type AnimeEntry = {
  source: AnimeSource
  id: number
  status: WatchStatus
  score: number | null
  progress: number | null
  media: AnimeMedia
}

export type JimakuEntry = {
  id: number
  anilistId: number | null
  myanimelistId: number | null
  url: string
  name: string
  englishName: string | null
  japaneseName: string | null
  fileCount: number
  flags: number
  updatedAt: string | null
  titles: string[]
  normalizedTitles: string[]
}

export type JpdbAnimeDifficultyEntry = {
  name: string
  jpdbUrl: string
  lengthInWords: number
  uniqueWords: number
  uniqueWordsUsedOnce: number
  uniqueWordsUsedOncePercent: number
  uniqueKanji: number
  uniqueKanjiUsedOnce: number
  uniqueKanjiReadings: number
  averageDifficulty: number
  peakDifficulty90thPercentile: number
}

export type LearnNativelyAnimationLevelEntry = {
  learnnativelyUrl: string
  name: string
  level: string
}

export type MatchReason =
  | "anilist-id"
  | "myanimelist-id"
  | "exact-title"
  | "fuzzy"

export type MatchCandidate = {
  jimakuEntry: JimakuEntry
  score: number
  reason: MatchReason
}

export type DatasetMatch<TEntry> = {
  entry: TEntry
  matchScore: number
  matchReason: MatchReason
}

export type LearnNativelyMatch =
  DatasetMatch<LearnNativelyAnimationLevelEntry> & {
    jlptEquivalent: LearnNativelyJlptEquivalent
    levelNumber: number
  }

export type Completeness = "complete" | "incomplete" | "unknown"

export type OverlapResult = {
  entry: AnimeEntry
  matchedJimaku: JimakuEntry
  alternates: MatchCandidate[]
  matchScore: number
  matchReason: MatchReason
  isAmbiguous: boolean
  completeness: Completeness
  matchedJpdb?: DatasetMatch<JpdbAnimeDifficultyEntry>
  matchedLearnNatively?: LearnNativelyMatch
}

export type LookupResponse =
  | {
      ok: true
      source: AnimeSource
      username: string
      fetchedAt: string
      totalAnime: number
      matchedCount: number
      results: OverlapResult[]
    }
  | {
      ok: false
      code:
        | "NOT_FOUND"
        | "PRIVATE_OR_UNAVAILABLE"
        | "RATE_LIMITED"
        | "UPSTREAM_ERROR"
      message: string
    }
