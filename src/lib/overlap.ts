import { fetchAniListEntries } from "@/lib/anilist"
import { loadJimakuSnapshot } from "@/lib/jimaku"
import { matchAnime } from "@/lib/matching"
import {
  readCachedLookupResponse,
  writeCachedLookupResponse,
} from "@/lib/runtime-cache"
import { statusOrder } from "@/lib/status"
import type { AniListEntry, LookupResponse, OverlapResult } from "@/lib/types"

export function getCompleteness(entry: AniListEntry, fileCount: number) {
  if (
    entry.media.status !== "FINISHED" ||
    typeof entry.media.episodes !== "number"
  ) {
    return "unknown" as const
  }

  return fileCount >= entry.media.episodes
    ? ("complete" as const)
    : ("incomplete" as const)
}

export function sortResults(results: OverlapResult[]) {
  return [...results].sort((left, right) => {
    const statusDelta =
      statusOrder[left.anilistEntry.status] -
      statusOrder[right.anilistEntry.status]

    if (statusDelta !== 0) {
      return statusDelta
    }

    return (left.anilistEntry.media.title.romaji ?? "").localeCompare(
      right.anilistEntry.media.title.romaji ?? ""
    )
  })
}

export async function findOverlap(username: string): Promise<LookupResponse> {
  const trimmedUsername = username.trim()
  const fetchedAt = new Date().toISOString()

  if (!trimmedUsername) {
    return {
      ok: false,
      code: "UPSTREAM_ERROR",
      message: "Enter an AniList username.",
    }
  }

  const cachedResponse = await readCachedLookupResponse(trimmedUsername)

  if (cachedResponse) {
    return cachedResponse
  }

  const [aniListResult, jimakuEntries] = await Promise.all([
    fetchAniListEntries(trimmedUsername),
    loadJimakuSnapshot(),
  ])

  if (!Array.isArray(aniListResult)) {
    await writeCachedLookupResponse(trimmedUsername, aniListResult)
    return aniListResult
  }

  const results = aniListResult
    .map((anilistEntry) => {
      const matched = matchAnime(anilistEntry, jimakuEntries)

      if (!matched) {
        return null
      }

      return {
        anilistEntry,
        matchedJimaku: matched.matchedJimaku,
        alternates: matched.alternates,
        matchScore: matched.matchScore,
        matchReason: matched.matchReason,
        isAmbiguous: matched.isAmbiguous,
        isLowConfidence: matched.isLowConfidence,
        completeness: getCompleteness(
          anilistEntry,
          matched.matchedJimaku.fileCount
        ),
      } satisfies OverlapResult
    })
    .filter((result): result is OverlapResult => result !== null)

  const response = {
    ok: true,
    username: trimmedUsername,
    fetchedAt,
    totalAnime: aniListResult.length,
    matchedCount: results.length,
    results: sortResults(results),
  } satisfies LookupResponse

  await writeCachedLookupResponse(trimmedUsername, response)

  return response
}
