import {
  getLearnNativelyJlptEquivalent,
  getLearnNativelyLevelNumber,
} from "@/features/anime-list/server/load-anime-difficulty-snapshots"
import {
  matchAnime,
  matchJitenAnimeDifficulty,
  matchJpdbAnimeDifficulty,
  matchLearnNativelyAnimationLevel,
} from "@/features/anime-list/server/matching"
import { statusOrder } from "@/lib/status"
import type {
  AnimeEntry,
  Completeness,
  JimakuEntry,
  JitenAnimeDifficultyEntry,
  JpdbAnimeDifficultyEntry,
  LearnNativelyAnimationLevelEntry,
  OverlapResult,
} from "@/lib/types"

export function getAnimeListCompleteness(
  entry: AnimeEntry,
  fileCount: number
): Completeness {
  if (entry.media.status === "FINISHED") {
    return typeof entry.media.episodes === "number"
      ? fileCount >= entry.media.episodes
        ? "complete"
        : "incomplete"
      : "unknown"
  }

  if (entry.media.status === "RELEASING") {
    return typeof entry.media.releasedEpisodes === "number"
      ? fileCount >= entry.media.releasedEpisodes
        ? "complete"
        : "incomplete"
      : "unknown"
  }

  return "unknown"
}

export function sortAnimeListOverlapResults(results: OverlapResult[]) {
  return [...results].sort((left, right) => {
    const leftStatusOrder =
      left.userList.status === null
        ? Number.MAX_SAFE_INTEGER
        : statusOrder[left.userList.status]
    const rightStatusOrder =
      right.userList.status === null
        ? Number.MAX_SAFE_INTEGER
        : statusOrder[right.userList.status]
    const statusDelta = leftStatusOrder - rightStatusOrder

    if (statusDelta !== 0) {
      return statusDelta
    }

    return (left.entry.media.title.primary ?? "").localeCompare(
      right.entry.media.title.primary ?? ""
    )
  })
}

export function buildAnimeListOverlapResults(
  entries: AnimeEntry[],
  jimakuEntries: JimakuEntry[],
  jpdbEntries: JpdbAnimeDifficultyEntry[],
  jitenEntries: JitenAnimeDifficultyEntry[],
  learnNativelyEntries: LearnNativelyAnimationLevelEntry[]
) {
  return entries.map((entry) => {
    const matched = matchAnime(entry, jimakuEntries)
    const matchedLearnNativelyBase = matchLearnNativelyAnimationLevel(
      entry,
      learnNativelyEntries
    )
    const jlptEquivalent = matchedLearnNativelyBase
      ? getLearnNativelyJlptEquivalent(matchedLearnNativelyBase.entry.level)
      : null
    const levelNumber = matchedLearnNativelyBase
      ? getLearnNativelyLevelNumber(matchedLearnNativelyBase.entry.level)
      : null

    return {
      entry,
      userList: {
        inList: entry.status !== null,
        status: entry.status,
        score: entry.score,
        progress: entry.progress,
      },
      matchedJimaku: matched?.matchedJimaku ?? null,
      alternates: matched?.alternates ?? [],
      matchScore: matched?.matchScore ?? null,
      matchReason: matched?.matchReason ?? null,
      isAmbiguous: matched?.isAmbiguous ?? false,
      completeness: matched
        ? getAnimeListCompleteness(entry, matched.matchedJimaku.fileCount)
        : "unknown",
      matchedJpdb: matchJpdbAnimeDifficulty(entry, jpdbEntries) ?? undefined,
      matchedJiten: matchJitenAnimeDifficulty(entry, jitenEntries) ?? undefined,
      matchedLearnNatively:
        matchedLearnNativelyBase && jlptEquivalent && levelNumber !== null
          ? { ...matchedLearnNativelyBase, jlptEquivalent, levelNumber }
          : undefined,
    }
  })
}
