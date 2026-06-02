import type { AniListMediaStatus, AniListWatchStatus } from "@/lib/types"

export const statusOrder: Record<AniListWatchStatus, number> = {
  CURRENT: 0,
  PLANNING: 1,
  COMPLETED: 2,
  REPEATING: 3,
  PAUSED: 4,
  DROPPED: 5,
}

export const statusLabel: Record<AniListWatchStatus, string> = {
  CURRENT: "Current",
  PLANNING: "Planning",
  COMPLETED: "Completed",
  PAUSED: "On Hold",
  DROPPED: "Dropped",
  REPEATING: "Repeating",
}

export const statusDotClassName: Record<AniListWatchStatus, string> = {
  CURRENT: "bg-sky-400",
  PLANNING: "bg-orange-400",
  COMPLETED: "bg-emerald-400",
  PAUSED: "bg-yellow-400",
  DROPPED: "bg-rose-500",
  REPEATING: "bg-violet-400",
}

export const mediaStatusLabel: Record<
  Exclude<AniListMediaStatus, null>,
  string
> = {
  FINISHED: "Finished",
  RELEASING: "Releasing",
  NOT_YET_RELEASED: "Not Yet Released",
  CANCELLED: "Cancelled",
  HIATUS: "Hiatus",
}
