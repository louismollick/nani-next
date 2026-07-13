import type {
  AnimeFormat,
  AnimeSource,
  DifficultyFilterMode,
  MediaStatus,
  MyAnimeFilterMode,
  SearchMode,
  SortDirection,
  SortOption,
  SubtitleAvailabilityOption,
  WatchStatus,
} from "@/features/anime-list/domain/anime-list-enums"
import { mediaStatuses } from "@/features/anime-list/domain/anime-list-enums"
import { serializeAnimeFormatValues } from "@/features/anime-list/lib/anime-metadata-filters"
import type { NumericRange } from "@/features/anime-list/lib/range-utils"

export type LookupSearchState = {
  mode: SearchMode
  source: AnimeSource
  username: string
  animeSearchQuery: string
  myAnimeFilterMode: MyAnimeFilterMode
  titleQuery: string
  selectedStatuses: WatchStatus[]
  selectedMediaStatuses: Exclude<MediaStatus, null>[]
  selectedFormats: AnimeFormat[]
  selectedGenres: string[]
  selectedSubtitleAvailability: SubtitleAvailabilityOption[]
  yearRange: NumericRange | null
  episodeRange: NumericRange | null
  durationRange: NumericRange | null
  difficultyFilterMode: DifficultyFilterMode
  jpdbDifficultyRange: NumericRange | null
  jitenDifficultyRange: NumericRange | null
  learnNativelyLevelRange: NumericRange | null
  learnNativelyJlptRange: NumericRange | null
  sortBy: SortOption
  sortDirection: SortDirection
}

export const defaultLookupSearchState: LookupSearchState = {
  mode: "userList",
  source: "anilist",
  username: "",
  animeSearchQuery: "",
  myAnimeFilterMode: "onlyMine",
  titleQuery: "",
  selectedStatuses: ["PLANNING", "PAUSED"],
  selectedMediaStatuses: [...mediaStatuses],
  selectedFormats: [],
  selectedGenres: [],
  selectedSubtitleAvailability: ["all"],
  yearRange: null,
  episodeRange: null,
  durationRange: null,
  difficultyFilterMode: "none",
  jpdbDifficultyRange: null,
  jitenDifficultyRange: null,
  learnNativelyLevelRange: null,
  learnNativelyJlptRange: null,
  sortBy: "averageScore",
  sortDirection: "desc",
}

export function serializeSelectedValues<TValue extends string>(
  values: Iterable<TValue>,
  allowedValues: readonly TValue[]
) {
  const allowedSet = new Set<string>(allowedValues)

  return [...new Set(values)]
    .filter((value): value is TValue => allowedSet.has(value))
    .sort(
      (left, right) =>
        allowedValues.indexOf(left) - allowedValues.indexOf(right)
    )
}

export function serializeGenreValues(values: Iterable<string>) {
  return [
    ...new Set(
      [...values].map((value) => value.trim().toLowerCase()).filter(Boolean)
    ),
  ].sort((left, right) => left.localeCompare(right))
}

export { serializeAnimeFormatValues }
