import type { MediaStatus, WatchStatus } from "@/lib/types"

export const statusOrder: Record<WatchStatus, number> = {
  CURRENT: 0,
  PLANNING: 1,
  COMPLETED: 2,
  PAUSED: 3,
  DROPPED: 4,
}

export const statusLabel: Record<WatchStatus, string> = {
  CURRENT: "Current",
  PLANNING: "Planning",
  COMPLETED: "Completed",
  PAUSED: "On Hold",
  DROPPED: "Dropped",
}

export const statusDotClassName: Record<WatchStatus, string> = {
  CURRENT: "bg-sky-400",
  PLANNING: "bg-orange-400",
  COMPLETED: "bg-emerald-400",
  PAUSED: "bg-yellow-400",
  DROPPED: "bg-rose-500",
}

export const mediaStatusLabel: Record<Exclude<MediaStatus, null>, string> = {
  FINISHED: "Finished",
  RELEASING: "Releasing",
  NOT_YET_RELEASED: "Not Yet Released",
  CANCELLED: "Cancelled",
  HIATUS: "Hiatus",
}
