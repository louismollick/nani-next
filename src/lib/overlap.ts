import { fetchAniListEntries } from "@/lib/anilist"
import {
  getLearnNativelyJlptEquivalent,
  getLearnNativelyLevelNumber,
  loadJpdbAnimeDifficultySnapshot,
  loadLearnNativelyAnimationLevelsSnapshot,
} from "@/lib/anime-difficulty"
import { loadJimakuSnapshot } from "@/lib/jimaku"
import {
  matchAnime,
  matchJpdbAnimeDifficulty,
  matchLearnNativelyAnimationLevel,
} from "@/lib/matching"
import { fetchMyAnimeListEntries } from "@/lib/myanimelist"
import {
  readCachedLookupResponse,
  writeCachedLookupResponse,
} from "@/lib/runtime-cache"
import { statusOrder } from "@/lib/status"
import type {
  AnimeEntry,
  AnimeSource,
  JimakuEntry,
  JpdbAnimeDifficultyEntry,
  LearnNativelyAnimationLevelEntry,
  LookupResponse,
  OverlapResult,
} from "@/lib/types"

export function getCompleteness(entry: AnimeEntry, fileCount: number) {
  if (entry.media.status === "FINISHED") {
    if (typeof entry.media.episodes !== "number") {
      return "unknown" as const
    }

    return fileCount >= entry.media.episodes
      ? ("complete" as const)
      : ("incomplete" as const)
  }

  if (entry.media.status === "RELEASING") {
    if (typeof entry.media.releasedEpisodes !== "number") {
      return "unknown" as const
    }

    return fileCount >= entry.media.releasedEpisodes
      ? ("complete" as const)
      : ("incomplete" as const)
  }

  return "unknown" as const
}

export function sortResults(results: OverlapResult[]) {
  return [...results].sort((left, right) => {
    const statusDelta =
      statusOrder[left.entry.status] - statusOrder[right.entry.status]

    if (statusDelta !== 0) {
      return statusDelta
    }

    return (left.entry.media.title.primary ?? "").localeCompare(
      right.entry.media.title.primary ?? ""
    )
  })
}

export function buildOverlapResults(
  entries: AnimeEntry[],
  jimakuEntries: JimakuEntry[],
  jpdbEntries: JpdbAnimeDifficultyEntry[],
  learnNativelyEntries: LearnNativelyAnimationLevelEntry[]
) {
  const results: OverlapResult[] = []

  for (const entry of entries) {
    const matched = matchAnime(entry, jimakuEntries)

    if (!matched) {
      continue
    }

    const matchedJpdb = matchJpdbAnimeDifficulty(entry, jpdbEntries)
    const matchedLearnNativelyBase = matchLearnNativelyAnimationLevel(
      entry,
      learnNativelyEntries
    )
    const learnNativelyJlptEquivalent = matchedLearnNativelyBase
      ? getLearnNativelyJlptEquivalent(matchedLearnNativelyBase.entry.level)
      : null
    const learnNativelyLevelNumber = matchedLearnNativelyBase
      ? getLearnNativelyLevelNumber(matchedLearnNativelyBase.entry.level)
      : null
    const matchedLearnNatively =
      matchedLearnNativelyBase &&
      learnNativelyJlptEquivalent &&
      learnNativelyLevelNumber !== null
        ? {
            ...matchedLearnNativelyBase,
            jlptEquivalent: learnNativelyJlptEquivalent,
            levelNumber: learnNativelyLevelNumber,
          }
        : undefined

    results.push({
      entry,
      matchedJimaku: matched.matchedJimaku,
      alternates: matched.alternates,
      matchScore: matched.matchScore,
      matchReason: matched.matchReason,
      isAmbiguous: matched.isAmbiguous,
      completeness: getCompleteness(entry, matched.matchedJimaku.fileCount),
      matchedJpdb: matchedJpdb ?? undefined,
      matchedLearnNatively,
    })
  }

  return results
}

async function fetchSourceEntries(source: AnimeSource, username: string) {
  return source === "myanimelist"
    ? fetchMyAnimeListEntries(username)
    : fetchAniListEntries(username)
}

export async function findOverlap(
  source: AnimeSource,
  username: string
): Promise<LookupResponse> {
  const trimmedUsername = username.trim()
  const fetchedAt = new Date().toISOString()

  if (!trimmedUsername) {
    return {
      ok: false,
      code: "UPSTREAM_ERROR",
      message: "Enter a username.",
    }
  }

  const cachedResponse = await readCachedLookupResponse(source, trimmedUsername)

  if (cachedResponse) {
    return cachedResponse
  }

  const [entryResult, jimakuEntries, jpdbEntries, learnNativelyEntries] =
    await Promise.all([
      fetchSourceEntries(source, trimmedUsername),
      loadJimakuSnapshot(),
      loadJpdbAnimeDifficultySnapshot(),
      loadLearnNativelyAnimationLevelsSnapshot(),
    ])

  if (!Array.isArray(entryResult)) {
    await writeCachedLookupResponse(source, trimmedUsername, entryResult)
    return entryResult
  }

  const results = buildOverlapResults(
    entryResult,
    jimakuEntries,
    jpdbEntries,
    learnNativelyEntries
  )

  const response = {
    ok: true,
    source,
    username: trimmedUsername,
    fetchedAt,
    totalAnime: entryResult.length,
    matchedCount: results.length,
    results: sortResults(results),
  } satisfies LookupResponse

  await writeCachedLookupResponse(source, trimmedUsername, response)

  return response
}
