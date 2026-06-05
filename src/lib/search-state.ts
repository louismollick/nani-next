import {
  type AnimeSource,
  animeSources,
  type DifficultyFilterMode,
  difficultyFilterModes,
  learnNativelyJlptEquivalents,
  type MediaStatus,
  mediaStatuses,
  type SortDirection,
  type SortOption,
  type SubtitleAvailabilityOption,
  sortDirections,
  sortOptions,
  subtitleAvailabilityOptions,
  type WatchStatus,
  watchStatuses,
} from "@/lib/types"

export type NumericRange = [number, number]

export type LookupSearchState = {
  source: AnimeSource
  username: string
  titleQuery: string
  selectedStatuses: WatchStatus[]
  selectedMediaStatuses: Exclude<MediaStatus, null>[]
  selectedGenres: string[]
  selectedSubtitleAvailability: SubtitleAvailabilityOption[]
  difficultyFilterMode: DifficultyFilterMode
  jpdbDifficultyRange: NumericRange | null
  learnNativelyLevelRange: NumericRange | null
  learnNativelyJlptRange: NumericRange | null
  sortBy: SortOption
  sortDirection: SortDirection
}

export const defaultLookupSearchState: LookupSearchState = {
  source: "anilist",
  username: "",
  titleQuery: "",
  selectedStatuses: ["PLANNING", "PAUSED"],
  selectedMediaStatuses: [...mediaStatuses],
  selectedGenres: [],
  selectedSubtitleAvailability: ["all"],
  difficultyFilterMode: "none",
  jpdbDifficultyRange: null,
  learnNativelyLevelRange: null,
  learnNativelyJlptRange: null,
  sortBy: "averageScore",
  sortDirection: "desc",
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }

  if (typeof value === "string") {
    return [value]
  }

  return []
}

function sanitizeEnumArray<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  fallback: readonly TValue[]
) {
  const allowedValueMap = new Map(
    allowedValues.map((allowedValue) => [
      allowedValue.toLowerCase(),
      allowedValue,
    ])
  )
  const nextValues = toStringArray(value)
    .map((item) => allowedValueMap.get(item.toLowerCase()))
    .filter((item): item is TValue => typeof item === "string")

  return nextValues.length > 0 ? nextValues : [...fallback]
}

function toEnum<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  fallback: TValue
) {
  if (typeof value !== "string") {
    return fallback
  }

  const allowedValueMap = new Map(
    allowedValues.map((allowedValue) => [
      allowedValue.toLowerCase(),
      allowedValue,
    ])
  )

  return allowedValueMap.get(value.toLowerCase()) ?? fallback
}

function toNumberRange(value: unknown) {
  if (!Array.isArray(value) || value.length !== 2) {
    return null
  }

  const [left, right] = value

  if (typeof left !== "number" || typeof right !== "number") {
    return null
  }

  return [Math.min(left, right), Math.max(left, right)] as NumericRange
}

export function validateLookupSearch(
  search: Record<string, unknown>
): LookupSearchState {
  return {
    source: toEnum(
      search.source,
      animeSources,
      defaultLookupSearchState.source
    ),
    username: typeof search.username === "string" ? search.username : "",
    titleQuery: typeof search.titleQuery === "string" ? search.titleQuery : "",
    selectedStatuses: sanitizeEnumArray(
      search.selectedStatuses,
      watchStatuses,
      defaultLookupSearchState.selectedStatuses
    ),
    selectedMediaStatuses: sanitizeEnumArray(
      search.selectedMediaStatuses,
      mediaStatuses,
      defaultLookupSearchState.selectedMediaStatuses
    ),
    selectedGenres: toStringArray(search.selectedGenres),
    selectedSubtitleAvailability: sanitizeEnumArray(
      search.selectedSubtitleAvailability,
      subtitleAvailabilityOptions,
      defaultLookupSearchState.selectedSubtitleAvailability
    ),
    difficultyFilterMode: toEnum(
      search.difficultyFilterMode,
      difficultyFilterModes,
      defaultLookupSearchState.difficultyFilterMode
    ),
    jpdbDifficultyRange: toNumberRange(search.jpdbDifficultyRange),
    learnNativelyLevelRange: toNumberRange(search.learnNativelyLevelRange),
    learnNativelyJlptRange: toNumberRange(search.learnNativelyJlptRange),
    sortBy: toEnum(search.sortBy, sortOptions, defaultLookupSearchState.sortBy),
    sortDirection: toEnum(
      search.sortDirection,
      sortDirections,
      defaultLookupSearchState.sortDirection
    ),
  }
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
  return [...values]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .filter((value, index, items) => items.indexOf(value) === index)
    .sort((left, right) => left.localeCompare(right))
}

function arraysEqual<TValue>(
  left: readonly TValue[],
  right: readonly TValue[]
) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
}

function rangesEqual(left: NumericRange | null, right: NumericRange | null) {
  if (!left && !right) {
    return true
  }

  if (!left || !right) {
    return false
  }

  return left[0] === right[0] && left[1] === right[1]
}

export function canonicalizeLookupSearch(
  search: LookupSearchState
): Partial<LookupSearchState> {
  const normalizedStatuses = serializeSelectedValues(
    search.selectedStatuses,
    watchStatuses
  )
  const normalizedMediaStatuses = serializeSelectedValues(
    search.selectedMediaStatuses,
    mediaStatuses
  )
  const normalizedSubtitleAvailability = serializeSelectedValues(
    search.selectedSubtitleAvailability,
    subtitleAvailabilityOptions
  )
  const normalizedGenres = serializeGenreValues(search.selectedGenres)
  const trimmedUsername = search.username.trim()
  const trimmedTitleQuery = search.titleQuery.trim()
  const canonicalSearch: Partial<LookupSearchState> = {}

  if (search.source !== defaultLookupSearchState.source) {
    canonicalSearch.source = search.source
  }

  if (trimmedUsername) {
    canonicalSearch.username = trimmedUsername
  }

  if (trimmedTitleQuery) {
    canonicalSearch.titleQuery = trimmedTitleQuery
  }

  if (
    !arraysEqual(normalizedStatuses, defaultLookupSearchState.selectedStatuses)
  ) {
    canonicalSearch.selectedStatuses = normalizedStatuses
  }

  if (
    !arraysEqual(
      normalizedMediaStatuses,
      defaultLookupSearchState.selectedMediaStatuses
    )
  ) {
    canonicalSearch.selectedMediaStatuses = normalizedMediaStatuses
  }

  if (normalizedGenres.length > 0) {
    canonicalSearch.selectedGenres = normalizedGenres
  }

  if (
    !arraysEqual(
      normalizedSubtitleAvailability,
      defaultLookupSearchState.selectedSubtitleAvailability
    )
  ) {
    canonicalSearch.selectedSubtitleAvailability =
      normalizedSubtitleAvailability
  }

  if (
    search.difficultyFilterMode !==
    defaultLookupSearchState.difficultyFilterMode
  ) {
    canonicalSearch.difficultyFilterMode = search.difficultyFilterMode
  }

  if (
    !rangesEqual(
      search.jpdbDifficultyRange,
      defaultLookupSearchState.jpdbDifficultyRange
    )
  ) {
    canonicalSearch.jpdbDifficultyRange = search.jpdbDifficultyRange
  }

  if (
    !rangesEqual(
      search.learnNativelyLevelRange,
      defaultLookupSearchState.learnNativelyLevelRange
    )
  ) {
    canonicalSearch.learnNativelyLevelRange = search.learnNativelyLevelRange
  }

  if (
    !rangesEqual(
      search.learnNativelyJlptRange,
      defaultLookupSearchState.learnNativelyJlptRange
    )
  ) {
    canonicalSearch.learnNativelyJlptRange = search.learnNativelyJlptRange
  }

  if (search.sortBy !== defaultLookupSearchState.sortBy) {
    canonicalSearch.sortBy = search.sortBy
  }

  if (search.sortDirection !== defaultLookupSearchState.sortDirection) {
    canonicalSearch.sortDirection = search.sortDirection
  }

  return canonicalSearch
}

export function hasLookupIdentity(search: LookupSearchState) {
  return search.username.trim().length > 0
}

export function getLookupIdentity(
  search: Pick<LookupSearchState, "source" | "username">
) {
  return `${search.source}:${search.username.trim().toLowerCase()}`
}

export function isLearnNativelyJlptRangeValue(range: NumericRange | null) {
  if (!range) {
    return false
  }

  return (
    Number.isInteger(range[0]) &&
    Number.isInteger(range[1]) &&
    range[0] >= 0 &&
    range[1] < learnNativelyJlptEquivalents.length
  )
}
