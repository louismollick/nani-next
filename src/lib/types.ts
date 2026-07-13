export const animeSources = ["anilist", "myanimelist"] as const
export const searchModes = ["userList", "animeSearch"] as const

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
export const animeFormats = [
  "TV",
  "TV_SHORT",
  "MOVIE",
  "SPECIAL",
  "OVA",
  "ONA",
  "MUSIC",
] as const

export const sortOptions = [
  "averageScore",
  "popularity",
  "jpdbAverageDifficulty",
  "jitenDifficulty",
  "learnNativelyLevel",
  "title",
  "status",
] as const
export const sortDirections = ["desc", "asc"] as const
export const subtitleAvailabilityOptions = ["all", "some", "none"] as const
export const difficultyFilterModes = [
  "none",
  "jpdbAverageDifficulty",
  "jitenDifficulty",
  "learnNativelyLevel",
  "learnNativelyJlptEquivalent",
] as const
export const myAnimeFilterModes = ["onlyMine", "showAll", "hideMine"] as const
export const learnNativelyJlptEquivalents = [
  "N5",
  "N4",
  "N3",
  "N2",
  "N1",
  "N1+",
] as const

export type AnimeSource = (typeof animeSources)[number]
export type SearchMode = (typeof searchModes)[number]
export type WatchStatus = (typeof watchStatuses)[number]
export type SortOption = (typeof sortOptions)[number]
export type SortDirection = (typeof sortDirections)[number]
export type SubtitleAvailabilityOption =
  (typeof subtitleAvailabilityOptions)[number]
export type DifficultyFilterMode = (typeof difficultyFilterModes)[number]
export type MyAnimeFilterMode = (typeof myAnimeFilterModes)[number]
export type LearnNativelyJlptEquivalent =
  (typeof learnNativelyJlptEquivalents)[number]
export type MediaStatus = (typeof mediaStatusesAll)[number] | null
export type AnimeFormat = (typeof animeFormats)[number]

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
  year: number | null
  duration: number | null
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
  status: WatchStatus | null
  score: number | null
  progress: number | null
  media: AnimeMedia
}

export type UserListState = {
  inList: boolean
  status: WatchStatus | null
  score: number | null
  progress: number | null
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

export type JitenAnimeDifficultyEntry = {
  deckId: number
  jitenUrl: string
  titles: string[]
  anilistId: number | null
  myanimelistId: number | null
  difficultyRaw: number
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
  userList: UserListState
  matchedJimaku: JimakuEntry | null
  alternates: MatchCandidate[]
  matchScore: number | null
  matchReason: MatchReason | null
  isAmbiguous: boolean
  completeness: Completeness
  matchedJpdb?: DatasetMatch<JpdbAnimeDifficultyEntry>
  matchedJiten?: DatasetMatch<JitenAnimeDifficultyEntry>
  matchedLearnNatively?: LearnNativelyMatch
}

export type AnimeSearchSuggestion = {
  id: number
  coverImage: {
    large: string
    color: string | null
  }
  format: AnimeFormat | null
  title: AnimeTitle
  year: number | null
}

export type LookupResponse =
  | {
      ok: true
      source: AnimeSource
      username: string
      fetchedAt: string
      totalAnime: number
      userListAnimeCount?: number
      matchedCount: number
      results: OverlapResult[]
      pageInfo?: {
        currentPage: number
        hasNextPage: boolean
        total: number | null
      }
      browseMeta?: {
        mode: MyAnimeFilterMode
        isGlobalBrowse: boolean
        isApproximateWatchStatusSort: boolean
        isAniListBrowseCap: boolean
      }
    }
  | {
      ok: false
      code:
        | "NOT_FOUND"
        | "PRIVATE_OR_UNAVAILABLE"
        | "RATE_LIMITED"
        | "UPSTREAM_ERROR"
      message: string
      retryAfterMs?: number
      resetAtMs?: number
      cooldownUntilMs?: number
      rateLimitLimit?: number
      rateLimitRemaining?: number
    }
