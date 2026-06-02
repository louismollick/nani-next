export const anilistWatchStatuses = [
  "CURRENT",
  "PLANNING",
  "COMPLETED",
  "PAUSED",
  "DROPPED",
  "REPEATING",
] as const

export const anilistMediaStatuses = [
  "FINISHED",
  "RELEASING",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS",
] as const

export const sortOptions = ["status", "averageScore", "popularity"] as const

export type AniListWatchStatus = (typeof anilistWatchStatuses)[number]
export type SortOption = (typeof sortOptions)[number]

export type AniListMediaStatus = (typeof anilistMediaStatuses)[number] | null

export type AniListMedia = {
  id: number
  episodes: number | null
  averageScore: number | null
  popularity: number | null
  status: AniListMediaStatus
  genres: string[]
  format: string | null
  siteUrl: string
  synonyms: string[]
  coverImage: {
    large: string
    color: string | null
  }
  title: {
    romaji: string | null
    english: string | null
    native: string | null
  }
}

export type AniListEntry = {
  id: number
  status: AniListWatchStatus
  score: number | null
  progress: number | null
  media: AniListMedia
}

export type JimakuEntry = {
  id: number
  anilistId: number | null
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

export type MatchReason = "anilist-id" | "exact-title" | "fuzzy"

export type MatchCandidate = {
  jimakuEntry: JimakuEntry
  score: number
  reason: MatchReason
}

export type Completeness = "complete" | "incomplete" | "unknown"

export type OverlapResult = {
  anilistEntry: AniListEntry
  matchedJimaku: JimakuEntry
  alternates: MatchCandidate[]
  matchScore: number
  matchReason: MatchReason
  isAmbiguous: boolean
  isLowConfidence: boolean
  completeness: Completeness
}

export type LookupResponse =
  | {
      ok: true
      username: string
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
