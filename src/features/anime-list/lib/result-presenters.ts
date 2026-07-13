import type { AnimeEntry } from "@/features/anime-list/domain/anime-entry"
import {
  type AnimeFormat,
  type DifficultyFilterMode,
  type LearnNativelyJlptEquivalent,
  learnNativelyJlptEquivalents,
  type SubtitleAvailabilityOption,
} from "@/features/anime-list/domain/anime-list-enums"
import type { OverlapResult } from "@/features/anime-list/domain/lookup-response"
import {
  animeFormatLabels,
  maxDurationFilterValue,
  maxEpisodeFilterValue,
} from "@/features/anime-list/lib/anime-metadata-filters"
import { getEntryTitles } from "@/lib/matching"

export type AverageScorePresentation = {
  face: ":)" | ":|" | ":("
  label: "Great" | "Mixed" | "Poor"
  percentage: string
  toneClassName: string
}

export function getEntryTitle(entry: AnimeEntry) {
  return entry.media.title.primary ?? entry.media.title.english ?? "Unknown"
}

export function getResultTitle(result: OverlapResult) {
  const entryTitle = getEntryTitle(result.entry)

  return entryTitle !== "Unknown"
    ? entryTitle
    : (result.matchedJimaku?.name ?? "Unknown")
}

export function getAverageScorePresentation(
  score: number | null
): AverageScorePresentation | null {
  if (score === null) {
    return null
  }

  if (score >= 75) {
    return {
      face: ":)",
      label: "Great",
      percentage: `${score}%`,
      toneClassName: "text-emerald-400",
    }
  }

  if (score >= 60) {
    return {
      face: ":|",
      label: "Mixed",
      percentage: `${score}%`,
      toneClassName: "text-amber-400",
    }
  }

  return {
    face: ":(",
    label: "Poor",
    percentage: `${score}%`,
    toneClassName: "text-rose-400",
  }
}

export function getSubtitleAvailability(
  result: OverlapResult
): SubtitleAvailabilityOption {
  if (!result.matchedJimaku || result.matchedJimaku.fileCount === 0) {
    return "none"
  }

  if (result.completeness === "complete") {
    return "all"
  }

  return "some"
}

export function getLearnNativelyJlptEquivalentIndex(
  equivalent: LearnNativelyJlptEquivalent
) {
  return learnNativelyJlptEquivalents.indexOf(equivalent)
}

export function formatDifficultyRangeValue(
  mode: DifficultyFilterMode,
  value: number
) {
  if (mode === "jpdbAverageDifficulty") {
    return `${value}/100`
  }

  if (mode === "learnNativelyLevel") {
    return `L${value}`
  }

  if (mode === "jitenDifficulty") {
    return `${value.toFixed(1)}/5`
  }

  if (mode === "learnNativelyJlptEquivalent") {
    return (
      learnNativelyJlptEquivalents[value] ?? learnNativelyJlptEquivalents[0]
    )
  }

  return String(value)
}

export function normalizeGenreValue(value: string) {
  return value.trim().toLowerCase()
}

export function getSearchableTitles(entry: AnimeEntry) {
  return getEntryTitles(entry)
}

export function getAnimeFormatLabel(format: AnimeFormat) {
  return animeFormatLabels[format]
}

export function formatYearRangeValue(value: number) {
  return String(value)
}

export function formatEpisodeRangeValue(value: number, isUpperBound = false) {
  return isUpperBound && value >= maxEpisodeFilterValue
    ? `${value}+`
    : `${value}`
}

export function formatDurationMinutes(value: number) {
  if (value >= 60) {
    const hours = Math.floor(value / 60)
    const minutes = value % 60

    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
  }

  return `${value}m`
}

export function formatDurationRangeValue(value: number, isUpperBound = false) {
  return isUpperBound && value >= maxDurationFilterValue
    ? `${formatDurationMinutes(value)}+`
    : formatDurationMinutes(value)
}
