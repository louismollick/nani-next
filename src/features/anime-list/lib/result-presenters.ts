import type { AnimeEntry } from "@/features/anime-list/domain/anime-entry"
import {
  type DifficultyFilterMode,
  type LearnNativelyJlptEquivalent,
  learnNativelyJlptEquivalents,
  type SubtitleAvailabilityOption,
} from "@/features/anime-list/domain/anime-list-enums"
import type { OverlapResult } from "@/features/anime-list/domain/lookup-response"
import { getEntryTitles } from "@/lib/matching"

export function getEntryTitle(entry: AnimeEntry) {
  return entry.media.title.primary ?? entry.media.title.english ?? "Unknown"
}

export function getResultTitle(result: OverlapResult) {
  const entryTitle = getEntryTitle(result.entry)

  return entryTitle !== "Unknown"
    ? entryTitle
    : (result.matchedJimaku?.name ?? "Unknown")
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
