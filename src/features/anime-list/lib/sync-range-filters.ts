import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import type { AnimeListFacets } from "@/features/anime-list/lib/derive-anime-list-facets"
import {
  normalizeStoredRange,
  rangesEqual,
} from "@/features/anime-list/lib/range-utils"

export function syncRangeFilters(
  previousState: LookupSearchState,
  facets: AnimeListFacets
) {
  const nextJpdb = normalizeStoredRange(
    previousState.jpdbDifficultyRange,
    facets.availableJpdbDifficultyBounds
  )
  const nextJiten = normalizeStoredRange(
    previousState.jitenDifficultyRange,
    facets.availableJitenDifficultyBounds
  )
  const nextYear = normalizeStoredRange(
    previousState.yearRange,
    facets.availableYearBounds
  )
  const nextEpisode = normalizeStoredRange(
    previousState.episodeRange,
    facets.availableEpisodeBounds
  )
  const nextDuration = normalizeStoredRange(
    previousState.durationRange,
    facets.availableDurationBounds
  )
  const nextLevel = normalizeStoredRange(
    previousState.learnNativelyLevelRange,
    facets.availableLearnNativelyLevelBounds
  )
  const nextJlpt = normalizeStoredRange(
    previousState.learnNativelyJlptRange,
    facets.availableLearnNativelyJlptBounds
  )

  return rangesEqual(previousState.yearRange, nextYear) &&
    rangesEqual(previousState.episodeRange, nextEpisode) &&
    rangesEqual(previousState.durationRange, nextDuration) &&
    rangesEqual(previousState.jpdbDifficultyRange, nextJpdb) &&
    rangesEqual(previousState.jitenDifficultyRange, nextJiten) &&
    rangesEqual(previousState.learnNativelyLevelRange, nextLevel) &&
    rangesEqual(previousState.learnNativelyJlptRange, nextJlpt)
    ? previousState
    : {
        ...previousState,
        yearRange: nextYear,
        episodeRange: nextEpisode,
        durationRange: nextDuration,
        jpdbDifficultyRange: nextJpdb,
        jitenDifficultyRange: nextJiten,
        learnNativelyLevelRange: nextLevel,
        learnNativelyJlptRange: nextJlpt,
      }
}
