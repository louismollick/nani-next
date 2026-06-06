import {
  animeSources,
  difficultyFilterModes,
  mediaStatuses,
  sortDirections,
  sortOptions,
  subtitleAvailabilityOptions,
  watchStatuses,
} from "@/features/anime-list/domain/anime-list-enums"
import {
  defaultLookupSearchState,
  type LookupSearchState,
} from "@/features/anime-list/lib/anime-list-search-state"
import type { NumericRange } from "@/features/anime-list/lib/range-utils"

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }

  return typeof value === "string" ? [value] : []
}

function toEnum<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  fallback: TValue
) {
  const allowedValueMap = new Map(
    allowedValues.map((allowedValue) => [
      allowedValue.toLowerCase(),
      allowedValue,
    ])
  )

  return typeof value === "string"
    ? (allowedValueMap.get(value.toLowerCase()) ?? fallback)
    : fallback
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

  return nextValues.length > 0 ? [...new Set(nextValues)] : [...fallback]
}

function toNumberRange(value: unknown): NumericRange | null {
  if (!Array.isArray(value) || value.length !== 2) {
    return null
  }

  const [left, right] = value

  if (
    typeof left !== "number" ||
    typeof right !== "number" ||
    !Number.isFinite(left) ||
    !Number.isFinite(right)
  ) {
    return null
  }

  return [Math.min(left, right), Math.max(left, right)]
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
