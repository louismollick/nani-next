import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import type { AnimeListFacets } from "@/features/anime-list/lib/derive-anime-list-facets"
import { normalizeRange } from "@/features/anime-list/lib/range-utils"

export function getActiveDifficultyBounds(
  searchState: LookupSearchState,
  facets: AnimeListFacets
) {
  if (searchState.difficultyFilterMode === "jpdbAverageDifficulty") {
    return facets.availableJpdbDifficultyBounds
  }

  if (searchState.difficultyFilterMode === "learnNativelyLevel") {
    return facets.availableLearnNativelyLevelBounds
  }

  if (searchState.difficultyFilterMode === "jitenDifficulty") {
    return facets.availableJitenDifficultyBounds
  }

  return searchState.difficultyFilterMode === "learnNativelyJlptEquivalent"
    ? facets.availableLearnNativelyJlptBounds
    : null
}

export function getActiveDifficultyRange(
  searchState: LookupSearchState,
  facets: AnimeListFacets
) {
  if (searchState.difficultyFilterMode === "jpdbAverageDifficulty") {
    return (
      normalizeRange(
        searchState.jpdbDifficultyRange,
        facets.availableJpdbDifficultyBounds
      ) ?? facets.availableJpdbDifficultyBounds
    )
  }

  if (searchState.difficultyFilterMode === "learnNativelyLevel") {
    return (
      normalizeRange(
        searchState.learnNativelyLevelRange,
        facets.availableLearnNativelyLevelBounds
      ) ?? facets.availableLearnNativelyLevelBounds
    )
  }

  if (searchState.difficultyFilterMode === "jitenDifficulty") {
    return (
      normalizeRange(
        searchState.jitenDifficultyRange,
        facets.availableJitenDifficultyBounds
      ) ?? facets.availableJitenDifficultyBounds
    )
  }

  return searchState.difficultyFilterMode === "learnNativelyJlptEquivalent"
    ? (normalizeRange(
        searchState.learnNativelyJlptRange,
        facets.availableLearnNativelyJlptBounds
      ) ?? facets.availableLearnNativelyJlptBounds)
    : null
}
