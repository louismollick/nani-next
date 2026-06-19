import {
  getUpNextQueueItemId,
  type UpNextQueueItem,
} from "@/features/up-next/domain/up-next-queue-item"

function clampIndex(index: number, length: number) {
  if (length <= 0) {
    return 0
  }

  return Math.min(Math.max(index, 0), length - 1)
}

export function positionOfQueueItem(
  items: UpNextQueueItem[],
  itemId: string
): number {
  return items.findIndex((item) => item.id === itemId)
}

export function removeQueueItem(
  items: UpNextQueueItem[],
  itemId: string
): UpNextQueueItem[] {
  return items.filter((item) => item.id !== itemId)
}

export function addQueueItemAtPosition(
  items: UpNextQueueItem[],
  item: UpNextQueueItem,
  index: number
): UpNextQueueItem[] {
  const deduped = removeQueueItem(items, item.id)
  const next = [...deduped]
  const boundedIndex = Math.min(Math.max(index, 0), next.length)

  next.splice(boundedIndex, 0, item)
  return next
}

export function moveQueueItem(
  items: UpNextQueueItem[],
  itemId: string,
  index: number
): UpNextQueueItem[] {
  const currentIndex = positionOfQueueItem(items, itemId)

  if (currentIndex === -1) {
    return items
  }

  const next = [...items]
  const [item] = next.splice(currentIndex, 1)
  const boundedIndex = Math.min(Math.max(index, 0), next.length)

  next.splice(boundedIndex, 0, item)
  return next
}

export function reorderQueueItems(
  items: UpNextQueueItem[],
  fromIndex: number,
  toIndex: number
): UpNextQueueItem[] {
  if (items.length <= 1) {
    return items
  }

  const safeFromIndex = clampIndex(fromIndex, items.length)
  const safeToIndex = clampIndex(toIndex, items.length)

  if (safeFromIndex === safeToIndex) {
    return items
  }

  const next = [...items]
  const [item] = next.splice(safeFromIndex, 1)

  next.splice(safeToIndex, 0, item)
  return next
}

export function parseStoredQueueItem(value: unknown): UpNextQueueItem | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const item = value as Record<string, unknown>
  const source = item.source === "myanimelist" ? "myanimelist" : item.source

  if (
    (source !== "anilist" && source !== "myanimelist") ||
    typeof item.entryId !== "number" ||
    typeof item.mediaId !== "number" ||
    typeof item.title !== "string" ||
    typeof item.coverImageUrl !== "string" ||
    typeof item.siteUrl !== "string" ||
    typeof item.addedAt !== "string"
  ) {
    return null
  }

  return {
    id:
      typeof item.id === "string"
        ? item.id
        : getUpNextQueueItemId({
            source,
            entryId: item.entryId,
            mediaId: item.mediaId,
          }),
    source,
    entryId: item.entryId,
    mediaId: item.mediaId,
    addedAt: item.addedAt,
    title: item.title,
    coverImageUrl: item.coverImageUrl,
    coverImageColor:
      typeof item.coverImageColor === "string" ? item.coverImageColor : null,
    siteUrl: item.siteUrl,
    jimakuUrl: typeof item.jimakuUrl === "string" ? item.jimakuUrl : null,
    jpdbUrl: typeof item.jpdbUrl === "string" ? item.jpdbUrl : null,
    learnNativelyUrl:
      typeof item.learnNativelyUrl === "string" ? item.learnNativelyUrl : null,
    averageScore:
      typeof item.averageScore === "number" ? item.averageScore : null,
    watchStatus: typeof item.watchStatus === "string" ? item.watchStatus : null,
    hasJimaku: item.hasJimaku === true,
    isJimakuIncomplete: item.isJimakuIncomplete === true,
    jpdbAverageDifficulty:
      typeof item.jpdbAverageDifficulty === "number"
        ? item.jpdbAverageDifficulty
        : null,
    learnNativelyJlpt:
      typeof item.learnNativelyJlpt === "string"
        ? item.learnNativelyJlpt
        : null,
  }
}

export function parseStoredQueue(value: string | null): UpNextQueueItem[] {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)

    if (!Array.isArray(parsed)) {
      return []
    }

    const items = parsed
      .map((item) => parseStoredQueueItem(item))
      .filter((item): item is UpNextQueueItem => item !== null)

    const seen = new Set<string>()

    return items.filter((item) => {
      if (seen.has(item.id)) {
        return false
      }

      seen.add(item.id)
      return true
    })
  } catch {
    return []
  }
}
