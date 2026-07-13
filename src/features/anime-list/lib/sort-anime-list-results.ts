import type {
  SortDirection,
  SortOption,
} from "@/features/anime-list/domain/anime-list-enums"
import type { OverlapResult } from "@/features/anime-list/domain/lookup-response"
import { getEntryTitle } from "@/features/anime-list/lib/result-presenters"
import { statusOrder } from "@/lib/status"

function compareTitles(left: OverlapResult, right: OverlapResult) {
  return getEntryTitle(left.entry).localeCompare(getEntryTitle(right.entry))
}

function compareOptionalNumbers(
  leftValue: number | null | undefined,
  rightValue: number | null | undefined,
  direction: SortDirection,
  left: OverlapResult,
  right: OverlapResult
) {
  if (typeof leftValue !== "number" && typeof rightValue !== "number")
    return compareTitles(left, right)
  if (typeof leftValue !== "number") return 1
  if (typeof rightValue !== "number") return -1
  const delta =
    direction === "desc" ? rightValue - leftValue : leftValue - rightValue
  return delta !== 0 ? delta : compareTitles(left, right)
}

export function sortAnimeListResults(
  results: OverlapResult[],
  sortBy: SortOption,
  sortDirection: SortDirection
) {
  return [...results].sort((left, right) => {
    if (sortBy === "averageScore") {
      return compareOptionalNumbers(
        left.entry.media.averageScore,
        right.entry.media.averageScore,
        sortDirection,
        left,
        right
      )
    }
    if (sortBy === "popularity") {
      return compareOptionalNumbers(
        left.entry.media.popularity,
        right.entry.media.popularity,
        sortDirection,
        left,
        right
      )
    }
    if (sortBy === "jpdbAverageDifficulty") {
      return compareOptionalNumbers(
        left.matchedJpdb?.entry.averageDifficulty,
        right.matchedJpdb?.entry.averageDifficulty,
        sortDirection,
        left,
        right
      )
    }
    if (sortBy === "learnNativelyLevel") {
      return compareOptionalNumbers(
        left.matchedLearnNatively?.levelNumber,
        right.matchedLearnNatively?.levelNumber,
        sortDirection,
        left,
        right
      )
    }
    if (sortBy === "jitenDifficulty") {
      return compareOptionalNumbers(
        left.matchedJiten
          ? Math.round(left.matchedJiten.entry.difficultyRaw * 10) / 10
          : undefined,
        right.matchedJiten
          ? Math.round(right.matchedJiten.entry.difficultyRaw * 10) / 10
          : undefined,
        sortDirection,
        left,
        right
      )
    }
    if (sortBy === "title")
      return sortDirection === "desc"
        ? compareTitles(left, right) * -1
        : compareTitles(left, right)
    if (!left.userList.inList && !right.userList.inList) {
      return compareTitles(left, right)
    }
    if (!left.userList.inList) return 1
    if (!right.userList.inList) return -1
    if (!left.userList.status || !right.userList.status) {
      return compareTitles(left, right)
    }
    const statusDelta =
      statusOrder[left.userList.status] - statusOrder[right.userList.status]
    return statusDelta !== 0
      ? sortDirection === "desc"
        ? statusDelta * -1
        : statusDelta
      : compareTitles(left, right)
  })
}
