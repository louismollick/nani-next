import { learnNativelyJlptEquivalents } from "@/features/anime-list/domain/anime-list-enums"
import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import type { NumericRange } from "@/features/anime-list/lib/range-utils"

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
    range[0] < learnNativelyJlptEquivalents.length &&
    range[1] >= 0 &&
    range[0] <= range[1] &&
    range[1] < learnNativelyJlptEquivalents.length
  )
}
