import { learnNativelyJlptEquivalents } from "@/features/anime-list/domain/anime-list-enums"
import type { LookupResponse } from "@/features/anime-list/domain/lookup-response"
import {
  durationFilterBounds,
  episodeFilterBounds,
  getAnimeFormatOptions,
  getYearFilterBounds,
} from "@/features/anime-list/lib/anime-metadata-filters"
import {
  getNumericBounds,
  type NumericRange,
} from "@/features/anime-list/lib/range-utils"
import { normalizeGenreValue } from "@/features/anime-list/lib/result-presenters"
import { normalizeJitenDifficulty } from "@/lib/jiten"

export type AnimeListFacets = {
  availableGenres: Array<{ label: string; value: string }>
  availableFormats: Array<{ label: string; value: string }>
  availableYearBounds: NumericRange
  availableEpisodeBounds: NumericRange
  availableDurationBounds: NumericRange
  availableJpdbDifficultyBounds: NumericRange | null
  availableJitenDifficultyBounds: NumericRange | null
  availableLearnNativelyLevelBounds: NumericRange | null
  availableLearnNativelyJlptBounds: NumericRange | null
}

export function deriveAnimeListFacets(
  lookupState: LookupResponse | null
): AnimeListFacets {
  if (!lookupState?.ok) {
    return {
      availableGenres: [],
      availableFormats: getAnimeFormatOptions(),
      availableYearBounds: getYearFilterBounds(),
      availableEpisodeBounds: episodeFilterBounds,
      availableDurationBounds: durationFilterBounds,
      availableJpdbDifficultyBounds: null,
      availableJitenDifficultyBounds: null,
      availableLearnNativelyLevelBounds: null,
      availableLearnNativelyJlptBounds: null,
    }
  }

  const availableGenres = [
    ...new Map(
      lookupState.results
        .flatMap((result) => result.entry.media.genres)
        .map((genre) => [normalizeGenreValue(genre), genre] as const)
    ).entries(),
  ]
    .map(([value, label]) => ({ label, value }))
    .sort((left, right) => left.label.localeCompare(right.label))

  const availableLearnNativelyLevelBounds = getNumericBounds(
    lookupState.results
      .map((result) => result.matchedLearnNatively?.levelNumber)
      .filter((value): value is number => typeof value === "number")
  )

  return {
    availableGenres,
    availableFormats: getAnimeFormatOptions(),
    availableYearBounds: getYearFilterBounds(),
    availableEpisodeBounds: episodeFilterBounds,
    availableDurationBounds: durationFilterBounds,
    availableJpdbDifficultyBounds: getNumericBounds(
      lookupState.results
        .map((result) => result.matchedJpdb?.entry.averageDifficulty)
        .filter((value): value is number => typeof value === "number")
    ),
    availableJitenDifficultyBounds: getNumericBounds(
      lookupState.results
        .map((result) => result.matchedJiten?.entry.difficultyRaw)
        .filter((value): value is number => typeof value === "number")
        .map(normalizeJitenDifficulty)
    ),
    availableLearnNativelyLevelBounds,
    availableLearnNativelyJlptBounds: availableLearnNativelyLevelBounds
      ? [0, learnNativelyJlptEquivalents.length - 1]
      : null,
  }
}
