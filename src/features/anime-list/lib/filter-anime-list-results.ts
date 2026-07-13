import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import {
  durationFilterBounds,
  episodeFilterBounds,
  hasUnboundedUpperBound,
  normalizeAnimeFormat,
} from "@/features/anime-list/lib/anime-metadata-filters"
import type { AnimeListFacets } from "@/features/anime-list/lib/derive-anime-list-facets"
import { normalizeRange } from "@/features/anime-list/lib/range-utils"
import {
  getLearnNativelyJlptEquivalentIndex,
  getSearchableTitles,
  getSubtitleAvailability,
  normalizeGenreValue,
} from "@/features/anime-list/lib/result-presenters"
import { normalizeJitenDifficulty } from "@/lib/jiten"
import { normalizeTitle } from "@/lib/normalize"
import type { OverlapResult } from "@/lib/types"

export function filterAnimeListResults(
  results: OverlapResult[],
  searchState: LookupSearchState,
  facets: AnimeListFacets
) {
  const normalizedTitleQuery = normalizeTitle(searchState.titleQuery)
  const selectedStatuses = new Set(searchState.selectedStatuses)
  const selectedMediaStatuses = new Set(searchState.selectedMediaStatuses)
  const selectedFormats = new Set(searchState.selectedFormats)
  const selectedGenres = new Set(searchState.selectedGenres)
  const selectedSubtitleAvailability = new Set(
    searchState.selectedSubtitleAvailability
  )
  const yearRange = normalizeRange(
    searchState.yearRange,
    facets.availableYearBounds
  )
  const episodeRange = normalizeRange(
    searchState.episodeRange,
    facets.availableEpisodeBounds
  )
  const durationRange = normalizeRange(
    searchState.durationRange,
    facets.availableDurationBounds
  )
  const shouldApplyMetadataLocally =
    searchState.myAnimeFilterMode === "onlyMine"

  return results.filter((result) => {
    if (
      searchState.myAnimeFilterMode !== "hideMine" &&
      selectedStatuses.size > 0
    ) {
      if (searchState.myAnimeFilterMode === "showAll") {
        if (
          result.userList.inList &&
          result.userList.status &&
          !selectedStatuses.has(result.userList.status)
        ) {
          return false
        }
      } else if (
        !result.userList.status ||
        !selectedStatuses.has(result.userList.status)
      ) {
        return false
      }
    }
    if (
      normalizedTitleQuery &&
      !getSearchableTitles(result.entry).some((title) =>
        normalizeTitle(title).includes(normalizedTitleQuery)
      )
    )
      return false
    if (
      selectedMediaStatuses.size > 0 &&
      result.entry.media.status &&
      !selectedMediaStatuses.has(result.entry.media.status)
    )
      return false
    if (shouldApplyMetadataLocally) {
      const normalizedFormat = normalizeAnimeFormat(result.entry.media.format)

      if (
        selectedFormats.size > 0 &&
        (!normalizedFormat || !selectedFormats.has(normalizedFormat))
      ) {
        return false
      }

      if (
        searchState.yearRange &&
        !matchesClosedRange(result.entry.media.year, yearRange)
      ) {
        return false
      }

      if (
        searchState.episodeRange &&
        !matchesCappedUpperRange(
          result.entry.media.episodes,
          episodeRange,
          episodeFilterBounds[1]
        )
      ) {
        return false
      }

      if (
        searchState.durationRange &&
        !matchesCappedUpperRange(
          result.entry.media.duration,
          durationRange,
          durationFilterBounds[1]
        )
      ) {
        return false
      }
    }
    if (
      selectedGenres.size > 0 &&
      ![...selectedGenres].every((genre) =>
        result.entry.media.genres.map(normalizeGenreValue).includes(genre)
      )
    )
      return false
    if (
      selectedSubtitleAvailability.size > 0 &&
      !selectedSubtitleAvailability.has(getSubtitleAvailability(result))
    )
      return false
    if (searchState.difficultyFilterMode === "jpdbAverageDifficulty") {
      const range =
        normalizeRange(
          searchState.jpdbDifficultyRange,
          facets.availableJpdbDifficultyBounds
        ) ?? facets.availableJpdbDifficultyBounds
      return Boolean(
        result.matchedJpdb &&
          range &&
          result.matchedJpdb.entry.averageDifficulty >= range[0] &&
          result.matchedJpdb.entry.averageDifficulty <= range[1]
      )
    }
    if (searchState.difficultyFilterMode === "learnNativelyLevel") {
      const range =
        normalizeRange(
          searchState.learnNativelyLevelRange,
          facets.availableLearnNativelyLevelBounds
        ) ?? facets.availableLearnNativelyLevelBounds
      return Boolean(
        result.matchedLearnNatively &&
          range &&
          result.matchedLearnNatively.levelNumber >= range[0] &&
          result.matchedLearnNatively.levelNumber <= range[1]
      )
    }
    if (searchState.difficultyFilterMode === "jitenDifficulty") {
      const range =
        normalizeRange(
          searchState.jitenDifficultyRange,
          facets.availableJitenDifficultyBounds
        ) ?? facets.availableJitenDifficultyBounds
      const difficulty = result.matchedJiten
        ? normalizeJitenDifficulty(result.matchedJiten.entry.difficultyRaw)
        : null
      return Boolean(
        difficulty !== null &&
          range &&
          difficulty >= range[0] &&
          difficulty <= range[1]
      )
    }
    if (searchState.difficultyFilterMode !== "learnNativelyJlptEquivalent")
      return true
    const range =
      normalizeRange(
        searchState.learnNativelyJlptRange,
        facets.availableLearnNativelyJlptBounds
      ) ?? facets.availableLearnNativelyJlptBounds
    const equivalentIndex = result.matchedLearnNatively
      ? getLearnNativelyJlptEquivalentIndex(
          result.matchedLearnNatively.jlptEquivalent
        )
      : -1

    return Boolean(
      result.matchedLearnNatively &&
        range &&
        equivalentIndex >= range[0] &&
        equivalentIndex <= range[1]
    )
  })
}

function matchesClosedRange(
  value: number | null,
  range: [number, number] | null
) {
  return (
    typeof value === "number" &&
    !!range &&
    value >= range[0] &&
    value <= range[1]
  )
}

function matchesCappedUpperRange(
  value: number | null,
  range: [number, number] | null,
  maxValue: number
) {
  if (typeof value !== "number" || !range) {
    return false
  }

  if (value < range[0]) {
    return false
  }

  return hasUnboundedUpperBound(range, maxValue) || value <= range[1]
}
