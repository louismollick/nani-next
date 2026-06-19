import type { OverlapResult } from "@/features/anime-list/domain/lookup-response"
import { getResultTitle } from "@/features/anime-list/lib/result-presenters"

export const upNextActiveLimit = 5
export const upNextStorageKey = "nani-next:up-next-queue"

export type UpNextQueueItem = {
  id: string
  source: "anilist" | "myanimelist"
  entryId: number
  mediaId: number
  addedAt: string
  title: string
  coverImageUrl: string
  coverImageColor: string | null
  siteUrl: string
  jimakuUrl: string | null
  jpdbUrl: string | null
  learnNativelyUrl: string | null
  averageScore: number | null
  watchStatus: string | null
  hasJimaku: boolean
  isJimakuIncomplete: boolean
  jpdbAverageDifficulty: number | null
  learnNativelyJlpt: string | null
}

export function getUpNextQueueItemId(input: {
  source: "anilist" | "myanimelist"
  entryId: number
  mediaId: number
}) {
  return `${input.source}:${input.entryId}:${input.mediaId}`
}

export function buildUpNextQueueItem(result: OverlapResult): UpNextQueueItem {
  return {
    id: getUpNextQueueItemId({
      source: result.entry.source,
      entryId: result.entry.id,
      mediaId: result.entry.media.id,
    }),
    source: result.entry.source,
    entryId: result.entry.id,
    mediaId: result.entry.media.id,
    addedAt: new Date().toISOString(),
    title: getResultTitle(result),
    coverImageUrl: result.entry.media.coverImage.large,
    coverImageColor: result.entry.media.coverImage.color,
    siteUrl: result.entry.media.siteUrl,
    jimakuUrl: result.matchedJimaku?.url ?? null,
    jpdbUrl: result.matchedJpdb?.entry.jpdbUrl ?? null,
    learnNativelyUrl:
      result.matchedLearnNatively?.entry.learnnativelyUrl ?? null,
    averageScore: result.entry.media.averageScore,
    watchStatus: result.userList.status,
    hasJimaku: Boolean(result.matchedJimaku),
    isJimakuIncomplete:
      Boolean(result.matchedJimaku) && result.completeness === "incomplete",
    jpdbAverageDifficulty: result.matchedJpdb?.entry.averageDifficulty ?? null,
    learnNativelyJlpt: result.matchedLearnNatively?.jlptEquivalent ?? null,
  }
}
