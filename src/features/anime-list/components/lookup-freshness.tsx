import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRelativeTime } from "@/features/anime-list/hooks/use-relative-time"
import { successLookupTtlSeconds } from "@/features/anime-list/server/lookup-cache"

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
})
const absoluteTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatRelativeFetchedAt(value: string, now: number) {
  const fetchedAt = new Date(value).getTime()
  if (Number.isNaN(fetchedAt)) return "fetched recently"
  const elapsedSeconds = Math.round((now - fetchedAt) / 1000)
  if (Math.abs(elapsedSeconds) < 60) return "fetched just now"
  if (Math.abs(elapsedSeconds) < 3600)
    return `fetched ${relativeTimeFormatter.format(Math.round(-elapsedSeconds / 60), "minute")}`
  if (Math.abs(elapsedSeconds) < 86400)
    return `fetched ${relativeTimeFormatter.format(Math.round(-elapsedSeconds / 3600), "hour")}`
  return `fetched ${relativeTimeFormatter.format(Math.round(-elapsedSeconds / 86400), "day")}`
}

function formatAbsoluteFetchedAt(value: string) {
  const fetchedAt = new Date(value)
  return Number.isNaN(fetchedAt.getTime())
    ? "Fetch time unavailable."
    : `Fetched ${absoluteTimeFormatter.format(fetchedAt)}.`
}

function formatCacheTtl(ttlSeconds: number) {
  if (ttlSeconds < 60) {
    return `${ttlSeconds} second${ttlSeconds === 1 ? "" : "s"}`
  }

  if (ttlSeconds < 3600) {
    const minutes = ttlSeconds / 60
    return `${minutes} minute${minutes === 1 ? "" : "s"}`
  }

  const hours = ttlSeconds / 3600
  return `${hours} hour${hours === 1 ? "" : "s"}`
}

export function LookupFreshness({ fetchedAt }: { fetchedAt: string }) {
  const now = useRelativeTime()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label="Fetch details"
          className="inline-flex items-center gap-1.5 text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
          type="button"
        >
          <span>{formatRelativeFetchedAt(fetchedAt, now)}</span>
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-left leading-5">
        <p>{formatAbsoluteFetchedAt(fetchedAt)}</p>
        <p>
          Lookups are cached per user for{" "}
          {formatCacheTtl(successLookupTtlSeconds)}.
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
