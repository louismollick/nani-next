import {
  type AnimeSource,
  animeSources,
  type DifficultyFilterMode,
  difficultyFilterModes,
  learnNativelyJlptEquivalents,
  type MediaStatus,
  mediaStatuses,
  type SortOption,
  sortOptions,
  type WatchStatus,
  watchStatuses,
} from "@/lib/types"

export type NumericRange = [number, number]

export type LookupSearchState = {
  source: AnimeSource
  username: string
  selectedStatuses: WatchStatus[]
  selectedMediaStatuses: Exclude<MediaStatus, null>[]
  selectedGenres: string[]
  hideIncomplete: boolean
  hideLowConfidence: boolean
  difficultyFilterMode: DifficultyFilterMode
  jpdbDifficultyRange: NumericRange | null
  learnNativelyLevelRange: NumericRange | null
  learnNativelyJlptRange: NumericRange | null
  sortBy: SortOption
}

export const defaultLookupSearchState: LookupSearchState = {
  source: "anilist",
  username: "",
  selectedStatuses: [...watchStatuses],
  selectedMediaStatuses: [...mediaStatuses],
  selectedGenres: [],
  hideIncomplete: false,
  hideLowConfidence: false,
  difficultyFilterMode: "none",
  jpdbDifficultyRange: null,
  learnNativelyLevelRange: null,
  learnNativelyJlptRange: null,
  sortBy: "status",
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
  const allowedSet = new Set<string>(allowedValues)
  const nextValues = toStringArray(value).filter((item): item is TValue =>
    allowedSet.has(item)
  )

  return nextValues.length > 0 ? nextValues : [...fallback]
}

function toBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback
}

function toEnum<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  fallback: TValue
) {
  return typeof value === "string" && allowedValues.includes(value as TValue)
    ? (value as TValue)
    : fallback
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
    hideIncomplete: toBoolean(
      search.hideIncomplete,
      defaultLookupSearchState.hideIncomplete
    ),
    hideLowConfidence: toBoolean(
      search.hideLowConfidence,
      defaultLookupSearchState.hideLowConfidence
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
  return [...new Set(values)]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
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
