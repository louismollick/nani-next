import { useServerFn } from "@tanstack/react-start"
import {
  AlertCircle,
  ExternalLink,
  Info,
  LoaderCircle,
  Search,
  Sparkles,
  TriangleAlert,
} from "lucide-react"
import type { FormEvent, ReactNode } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { successLookupTtlSeconds } from "@/lib/lookup-cache"
import {
  defaultLookupSearchState,
  getLookupIdentity,
  type LookupSearchState,
  type NumericRange,
  serializeGenreValues,
  serializeSelectedValues,
} from "@/lib/search-state"
import {
  mediaStatusLabel,
  statusDotClassName,
  statusLabel,
  statusOrder,
} from "@/lib/status"
import {
  type AnimeEntry,
  type AnimeSource,
  animeSources,
  type DifficultyFilterMode,
  difficultyFilterModes,
  type LearnNativelyJlptEquivalent,
  type LookupResponse,
  learnNativelyJlptEquivalents,
  type MediaStatus,
  mediaStatuses,
  type OverlapResult,
  type SortOption,
  type SubtitleAvailabilityOption,
  subtitleAvailabilityOptions,
  type WatchStatus,
  watchStatuses,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type AnimeOverlapPageProps = {
  autoLookupIdentity?: string | null
  lookup: (input: {
    data: { source: AnimeSource; username: string }
  }) => Promise<LookupResponse>
  onSearchStateChange?: (
    updater: (previousState: LookupSearchState) => LookupSearchState
  ) => void
  searchState?: LookupSearchState
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
})

const absoluteTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

const difficultyFilterModeLabels: Record<DifficultyFilterMode, string> = {
  none: "No difficulty filter",
  jpdbAverageDifficulty: "JPDB Average Difficulty",
  learnNativelyLevel: "LearnNatively Level",
  learnNativelyJlptEquivalent: "LearnNatively JLPT Equivalent",
}

const subtitleAvailabilityLabels: Record<SubtitleAvailabilityOption, string> = {
  all: "All episodes subtitled",
  some: "Some episodes subtitled",
  none: "No episodes subtitled",
}

const learnNativelyJlptDescriptions: Record<
  LearnNativelyJlptEquivalent,
  string
> = {
  "N1+": "~JLPT N1+",
  N1: "~JLPT N1",
  N2: "~JLPT N2",
  N3: "~JLPT N3",
  N4: "~JLPT N4",
  N5: "~JLPT N5",
}

function formatRelativeFetchedAt(value: string, now: number) {
  const fetchedAt = new Date(value).getTime()

  if (Number.isNaN(fetchedAt)) {
    return "fetched recently"
  }

  const elapsedSeconds = Math.round((now - fetchedAt) / 1000)
  const relativeSeconds = elapsedSeconds * -1
  const absoluteElapsedSeconds = Math.abs(elapsedSeconds)

  if (absoluteElapsedSeconds < 60) {
    return "fetched just now"
  }

  if (absoluteElapsedSeconds < 60 * 60) {
    return `fetched ${relativeTimeFormatter.format(
      Math.round(relativeSeconds / 60),
      "minute"
    )}`
  }

  if (absoluteElapsedSeconds < 60 * 60 * 24) {
    return `fetched ${relativeTimeFormatter.format(
      Math.round(relativeSeconds / (60 * 60)),
      "hour"
    )}`
  }

  return `fetched ${relativeTimeFormatter.format(
    Math.round(relativeSeconds / (60 * 60 * 24)),
    "day"
  )}`
}

function formatAbsoluteFetchedAt(value: string) {
  const fetchedAt = new Date(value)

  if (Number.isNaN(fetchedAt.getTime())) {
    return "Fetch time unavailable."
  }

  return `Fetched ${absoluteTimeFormatter.format(fetchedAt)}.`
}

function getNumericBounds(values: number[]) {
  if (values.length === 0) {
    return null
  }

  return [Math.min(...values), Math.max(...values)] as NumericRange
}

function normalizeRange(
  range: NumericRange | null,
  bounds: NumericRange | null
): NumericRange | null {
  if (!bounds) {
    return null
  }

  if (!range) {
    return bounds
  }

  const lowerBound = Math.max(bounds[0], Math.min(range[0], bounds[1]))
  const upperBound = Math.min(bounds[1], Math.max(range[1], bounds[0]))

  return [
    Math.min(lowerBound, upperBound),
    Math.max(lowerBound, upperBound),
  ] as NumericRange
}

function normalizeStoredRange(
  range: NumericRange | null,
  bounds: NumericRange | null
): NumericRange | null {
  if (!range) {
    return null
  }

  const normalizedRange = normalizeRange(range, bounds)

  if (!normalizedRange || (bounds && rangesEqual(normalizedRange, bounds))) {
    return null
  }

  return normalizedRange
}

function rangesEqual(left: NumericRange | null, right: NumericRange | null) {
  if (!left && !right) {
    return true
  }

  if (!left || !right) {
    return false
  }

  return left[0] === right[0] && left[1] === right[1]
}

function getLearnNativelyJlptEquivalentIndex(
  equivalent: LearnNativelyJlptEquivalent
) {
  return learnNativelyJlptEquivalents.indexOf(equivalent)
}

function formatDifficultyRangeValue(mode: DifficultyFilterMode, value: number) {
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

function getSubtitleAvailability(
  result: OverlapResult
): SubtitleAvailabilityOption {
  if (result.matchedJimaku.fileCount === 0) {
    return "none"
  }

  if (result.completeness === "complete") {
    return "all"
  }

  return "some"
}

function getMediaStatusLabel(status: MediaStatus) {
  return status ? mediaStatusLabel[status] : "Unknown"
}

function LookupFreshness({ fetchedAt }: { fetchedAt: string }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now())
    }, 60 * 1000)

    return () => window.clearInterval(timerId)
  }, [])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label="Fetch details"
          className="inline-flex items-center gap-1.5 text-slate-400 underline decoration-slate-700 underline-offset-4 hover:text-slate-300"
          type="button"
        >
          <span>{formatRelativeFetchedAt(fetchedAt, now)}</span>
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-left leading-5">
        <p>{formatAbsoluteFetchedAt(fetchedAt)}</p>
        <p>
          Lookups are cached per user for {successLookupTtlSeconds / 60 / 60}{" "}
          hour.
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

function getSourceLabel(source: AnimeSource) {
  return source === "myanimelist" ? "MyAnimeList" : "AniList"
}

function getEntryTitle(entry: AnimeEntry) {
  return entry.media.title.primary ?? entry.media.title.english ?? "Unknown"
}

const sortSelectOptions: SortOption[] = ["averageScore", "status", "popularity"]

function sortResults(results: OverlapResult[], sortBy: SortOption) {
  const nextResults = [...results]

  nextResults.sort((left, right) => {
    if (sortBy === "averageScore") {
      return (
        (right.entry.media.averageScore ?? -1) -
        (left.entry.media.averageScore ?? -1)
      )
    }

    if (sortBy === "popularity") {
      return (
        (right.entry.media.popularity ?? -1) -
        (left.entry.media.popularity ?? -1)
      )
    }

    const statusDelta =
      statusOrder[left.entry.status] - statusOrder[right.entry.status]

    if (statusDelta !== 0) {
      return statusDelta
    }

    return getEntryTitle(left.entry).localeCompare(getEntryTitle(right.entry))
  })

  return nextResults
}

function StatusDot({ result }: { result: OverlapResult }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={statusLabel[result.entry.status]}
          className={cn(
            "mt-1 size-2.5 shrink-0 self-start rounded-full shadow-[0_0_0_3px_rgba(7,15,28,0.55)]",
            statusDotClassName[result.entry.status]
          )}
          role="img"
        />
      </TooltipTrigger>
      <TooltipContent>{statusLabel[result.entry.status]}</TooltipContent>
    </Tooltip>
  )
}

function WarningDot({ label, tone }: { label: string; tone: "amber" | "red" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={label}
          className={cn(
            "mt-0.5 inline-flex size-5 items-center justify-center rounded-full text-[11px] font-bold",
            tone === "amber"
              ? "bg-amber-400 text-slate-950"
              : "bg-rose-500 text-white"
          )}
          role="img"
        >
          !
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function JpdbLogo({ className }: { className?: string }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      src="/jpdb-favicon-32x32.png"
    />
  )
}

function LearnNativelyLogo({ className }: { className?: string }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      src="/learnnatively-favicon-32x32.png"
    />
  )
}

function DifficultyPosterBadge({ children }: { children: ReactNode }) {
  return (
    <Badge
      className="h-auto min-w-[108px] rounded-l-none rounded-r-md border border-slate-700/80 bg-slate-950/92 px-2.5 py-2 text-[11px] font-semibold text-slate-100 shadow-[0_12px_24px_-16px_rgba(0,0,0,0.9)] backdrop-blur-sm"
      variant="outline"
    >
      {children}
    </Badge>
  )
}

function DifficultyBadges({ result }: { result: OverlapResult }) {
  if (!result.matchedJpdb && !result.matchedLearnNatively) {
    return null
  }

  return (
    <div className="absolute bottom-2 left-0">
      <DifficultyPosterBadge>
        <div className="flex flex-col items-start gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
            Difficulty
          </span>
          {result.matchedJpdb ? (
            <div className="flex items-center gap-1.5">
              <JpdbLogo className="size-3.5" />
              <span>{result.matchedJpdb.entry.averageDifficulty}/100</span>
            </div>
          ) : null}
          {result.matchedLearnNatively ? (
            <div className="flex items-center gap-1.5">
              <LearnNativelyLogo className="size-3.5" />
              <span>{result.matchedLearnNatively.jlptEquivalent}</span>
            </div>
          ) : null}
        </div>
      </DifficultyPosterBadge>
    </div>
  )
}

function ResultCard({
  result,
  onOpen,
}: {
  result: OverlapResult
  onOpen: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="group h-full w-full text-left"
          onClick={onOpen}
          type="button"
        >
          <div className="space-y-3 transition duration-200 group-hover:-translate-y-1">
            <div className="relative aspect-[3/4] overflow-hidden rounded bg-slate-950 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.95)]">
              <img
                alt={getEntryTitle(result.entry) ?? result.matchedJimaku.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                src={result.entry.media.coverImage.large}
              />
              <DifficultyBadges result={result} />
            </div>
            <div className="space-y-3 px-0.5">
              <div className="flex items-start gap-2.5">
                <StatusDot result={result} />
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="line-clamp-2 h-10 text-sm font-medium leading-5 text-slate-400">
                    {getEntryTitle(result.entry) ?? result.matchedJimaku.name}
                  </h3>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {result.completeness === "incomplete" ? (
                    <WarningDot
                      label="Incomplete Jimaku subtitles"
                      tone="red"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent
        align="start"
        className="max-w-72 rounded-xl border-slate-700 bg-slate-900/96 px-4 py-3 text-sm shadow-[0_20px_60px_-32px_rgba(0,0,0,0.95)]"
        side="right"
        sideOffset={14}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-slate-200">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Episodes
              </p>
              <p className="mt-1 font-medium">
                {result.entry.media.episodes ?? "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Jimaku Files
              </p>
              <p className="mt-1 font-medium">
                {result.matchedJimaku.fileCount}
              </p>
            </div>
          </div>
          {result.matchedJpdb || result.matchedLearnNatively ? (
            <div className="grid gap-2 text-slate-200">
              {result.matchedJpdb ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    JPDB
                  </span>
                  <span className="font-medium">
                    {result.matchedJpdb.entry.averageDifficulty}/100
                  </span>
                </div>
              ) : null}
              {result.matchedLearnNatively ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    LearnNatively
                  </span>
                  <span className="font-medium">
                    {result.matchedLearnNatively.entry.level} •{" "}
                    {result.matchedLearnNatively.jlptEquivalent}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Airing Status
            </p>
            <p className="mt-1 font-medium text-slate-200">
              {getMediaStatusLabel(result.entry.media.status)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Genres
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.entry.media.genres.length > 0 ? (
                result.entry.media.genres.map((genre) => (
                  <span
                    className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-200"
                    key={genre}
                  >
                    {genre}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">Unknown</span>
              )}
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function ResultDialog({
  open,
  onOpenChange,
  result,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: OverlapResult | null
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="border-slate-800 bg-slate-950 text-slate-100 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.85)] sm:max-w-3xl">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8 text-2xl text-slate-100">
                {getEntryTitle(result.entry) ?? result.matchedJimaku.name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <img
                  alt={getEntryTitle(result.entry) ?? result.matchedJimaku.name}
                  className="aspect-[3/4] w-full rounded-2xl object-cover shadow-lg"
                  src={result.entry.media.coverImage.large}
                />
              </div>
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-sm text-slate-200">
                    <StatusDot result={result} />
                    <span>{statusLabel[result.entry.status]}</span>
                  </div>
                  {result.completeness === "incomplete" ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-sm text-rose-200">
                      <WarningDot
                        label="Incomplete Jimaku subtitles"
                        tone="red"
                      />
                      <span>Incomplete Jimaku subtitles</span>
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {getSourceLabel(result.entry.source)}
                      </p>
                      <p className="text-sm font-medium text-slate-100">
                        {getEntryTitle(result.entry)}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a
                        className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
                        href={result.entry.media.siteUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open
                        <ExternalLink />
                      </a>
                    </Button>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Jimaku
                      </p>
                      <p className="text-sm font-medium text-slate-100">
                        {result.matchedJimaku.name}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a
                        className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
                        href={result.matchedJimaku.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open
                        <ExternalLink />
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="grid gap-5 text-sm text-slate-300 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Episodes
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-100">
                      {result.entry.media.episodes ?? "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Jimaku Files
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-100">
                      {result.matchedJimaku.fileCount}
                    </p>
                  </div>
                </div>
                {result.matchedJpdb ? (
                  <div className="grid gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          JPDB
                        </p>
                        <p className="text-sm font-medium text-slate-100">
                          Average difficulty{" "}
                          {result.matchedJpdb.entry.averageDifficulty}
                          /100
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <a
                          className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
                          href={result.matchedJpdb.entry.jpdbUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open
                          <ExternalLink />
                        </a>
                      </Button>
                    </div>
                    <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Peak difficulty
                        </p>
                        <p className="mt-1 font-medium text-slate-100">
                          {
                            result.matchedJpdb.entry
                              .peakDifficulty90thPercentile
                          }
                          /100
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Length
                        </p>
                        <p className="mt-1 font-medium text-slate-100">
                          {result.matchedJpdb.entry.lengthInWords.toLocaleString()}{" "}
                          words
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Unique words
                        </p>
                        <p className="mt-1 font-medium text-slate-100">
                          {result.matchedJpdb.entry.uniqueWords.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Unique kanji
                        </p>
                        <p className="mt-1 font-medium text-slate-100">
                          {result.matchedJpdb.entry.uniqueKanji.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Words used once
                        </p>
                        <p className="mt-1 font-medium text-slate-100">
                          {result.matchedJpdb.entry.uniqueWordsUsedOnce.toLocaleString()}{" "}
                          ({result.matchedJpdb.entry.uniqueWordsUsedOncePercent}
                          %)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Unique readings
                        </p>
                        <p className="mt-1 font-medium text-slate-100">
                          {result.matchedJpdb.entry.uniqueKanjiReadings.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {result.matchedLearnNatively ? (
                  <div className="grid gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          LearnNatively
                        </p>
                        <p className="text-sm font-medium text-slate-100">
                          {result.matchedLearnNatively.entry.level} •{" "}
                          {result.matchedLearnNatively.jlptEquivalent}{" "}
                          <span className="text-slate-400">
                            {
                              learnNativelyJlptDescriptions[
                                result.matchedLearnNatively.jlptEquivalent
                              ]
                            }
                          </span>
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <a
                          className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
                          href={
                            result.matchedLearnNatively.entry.learnnativelyUrl
                          }
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open
                          <ExternalLink />
                        </a>
                      </Button>
                    </div>
                    <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Exact level
                        </p>
                        <p className="mt-1 font-medium text-slate-100">
                          {result.matchedLearnNatively.entry.level}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          JLPT equivalent
                        </p>
                        <p className="mt-1 font-medium text-slate-100">
                          {result.matchedLearnNatively.jlptEquivalent}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {result.isAmbiguous && result.alternates.length > 0 ? (
                  <div className="space-y-3 rounded-2xl border border-amber-500/20 bg-amber-400/10 p-4">
                    <div className="flex items-center gap-2 text-amber-100">
                      <TriangleAlert className="size-4" />
                      <p className="text-sm font-semibold">
                        Alternate Jimaku candidates
                      </p>
                    </div>
                    <div className="space-y-2">
                      {result.alternates.map((candidate) => (
                        <div
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3"
                          key={candidate.jimakuEntry.id}
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-100">
                              {candidate.jimakuEntry.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              Match {Math.round(candidate.score * 100)}%
                            </p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <a
                              className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
                              href={candidate.jimakuEntry.url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Open
                              <ExternalLink />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function AnimeOverlapPage({
  autoLookupIdentity = null,
  lookup,
  onSearchStateChange,
  searchState,
}: AnimeOverlapPageProps) {
  const lookupFn = useServerFn(lookup)
  const [localSearchState, setLocalSearchState] = useState(
    defaultLookupSearchState
  )
  const [lookupState, setLookupState] = useState<LookupResponse | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [selectedResult, setSelectedResult] = useState<OverlapResult | null>(
    null
  )
  const autoLookupPerformedRef = useRef(false)

  const activeSearchState = searchState ?? localSearchState
  const selectedStatuses = new Set(activeSearchState.selectedStatuses)
  const selectedMediaStatuses = new Set(activeSearchState.selectedMediaStatuses)
  const selectedGenres = new Set(activeSearchState.selectedGenres)
  const selectedSubtitleAvailability = new Set(
    activeSearchState.selectedSubtitleAvailability
  )

  const updateSearchState = useCallback(
    (updater: (previousState: LookupSearchState) => LookupSearchState) => {
      if (onSearchStateChange) {
        onSearchStateChange(updater)
        return
      }

      setLocalSearchState(updater)
    },
    [onSearchStateChange]
  )

  const runLookup = useCallback(
    async (source: AnimeSource, username: string) => {
      const nextUsername = username.trim()

      if (!nextUsername) {
        setLookupState({
          ok: false,
          code: "UPSTREAM_ERROR",
          message: "Enter a username.",
        })
        return
      }

      setIsPending(true)

      try {
        setLookupState(
          await lookupFn({ data: { source, username: nextUsername } })
        )
      } finally {
        setIsPending(false)
      }
    },
    [lookupFn]
  )

  const hasResultsState = lookupState?.ok === true
  const availableGenres = lookupState?.ok
    ? [
        ...new Set(
          lookupState.results.flatMap((result) => result.entry.media.genres)
        ),
      ].sort((left, right) => left.localeCompare(right))
    : []
  const availableJpdbDifficultyBounds = lookupState?.ok
    ? getNumericBounds(
        lookupState.results
          .map((result) => result.matchedJpdb?.entry.averageDifficulty)
          .filter((value): value is number => typeof value === "number")
      )
    : null
  const availableLearnNativelyLevelBounds = lookupState?.ok
    ? getNumericBounds(
        lookupState.results
          .map((result) => result.matchedLearnNatively?.levelNumber)
          .filter((value): value is number => typeof value === "number")
      )
    : null
  const hasLearnNativelyMatches = Boolean(
    lookupState?.ok &&
      lookupState.results.some((result) => result.matchedLearnNatively)
  )
  const availableLearnNativelyJlptBounds = hasLearnNativelyMatches
    ? ([0, learnNativelyJlptEquivalents.length - 1] as NumericRange)
    : null

  useEffect(() => {
    updateSearchState((previousState) => {
      const nextJpdbDifficultyRange = normalizeStoredRange(
        previousState.jpdbDifficultyRange,
        availableJpdbDifficultyBounds
      )
      const nextLearnNativelyLevelRange = normalizeStoredRange(
        previousState.learnNativelyLevelRange,
        availableLearnNativelyLevelBounds
      )
      const nextLearnNativelyJlptRange = normalizeStoredRange(
        previousState.learnNativelyJlptRange,
        availableLearnNativelyJlptBounds
      )

      if (
        rangesEqual(
          previousState.jpdbDifficultyRange,
          nextJpdbDifficultyRange
        ) &&
        rangesEqual(
          previousState.learnNativelyLevelRange,
          nextLearnNativelyLevelRange
        ) &&
        rangesEqual(
          previousState.learnNativelyJlptRange,
          nextLearnNativelyJlptRange
        )
      ) {
        return previousState
      }

      return {
        ...previousState,
        jpdbDifficultyRange: nextJpdbDifficultyRange,
        learnNativelyLevelRange: nextLearnNativelyLevelRange,
        learnNativelyJlptRange: nextLearnNativelyJlptRange,
      }
    })
  }, [
    availableJpdbDifficultyBounds?.[0],
    availableJpdbDifficultyBounds?.[1],
    availableLearnNativelyLevelBounds?.[0],
    availableLearnNativelyLevelBounds?.[1],
    availableLearnNativelyJlptBounds?.[0],
    availableLearnNativelyJlptBounds?.[1],
    updateSearchState,
  ])

  const activeDifficultyBounds =
    activeSearchState.difficultyFilterMode === "jpdbAverageDifficulty"
      ? availableJpdbDifficultyBounds
      : activeSearchState.difficultyFilterMode === "learnNativelyLevel"
        ? availableLearnNativelyLevelBounds
        : activeSearchState.difficultyFilterMode ===
            "learnNativelyJlptEquivalent"
          ? availableLearnNativelyJlptBounds
          : null
  const activeDifficultyRange =
    activeSearchState.difficultyFilterMode === "jpdbAverageDifficulty"
      ? (normalizeRange(
          activeSearchState.jpdbDifficultyRange,
          availableJpdbDifficultyBounds
        ) ?? availableJpdbDifficultyBounds)
      : activeSearchState.difficultyFilterMode === "learnNativelyLevel"
        ? (normalizeRange(
            activeSearchState.learnNativelyLevelRange,
            availableLearnNativelyLevelBounds
          ) ?? availableLearnNativelyLevelBounds)
        : activeSearchState.difficultyFilterMode ===
            "learnNativelyJlptEquivalent"
          ? (normalizeRange(
              activeSearchState.learnNativelyJlptRange,
              availableLearnNativelyJlptBounds
            ) ?? availableLearnNativelyJlptBounds)
          : null
  const activeLookupIdentity = getLookupIdentity(activeSearchState)

  useEffect(() => {
    if (autoLookupPerformedRef.current || !autoLookupIdentity) {
      return
    }

    if (activeLookupIdentity !== autoLookupIdentity) {
      return
    }

    autoLookupPerformedRef.current = true
    void runLookup(activeSearchState.source, activeSearchState.username)
  }, [
    activeLookupIdentity,
    activeSearchState.source,
    activeSearchState.username,
    autoLookupIdentity,
    runLookup,
  ])

  const visibleResults = lookupState?.ok
    ? sortResults(
        lookupState.results.filter((result) => {
          if (!selectedStatuses.has(result.entry.status)) {
            return false
          }

          if (
            result.entry.media.status &&
            !selectedMediaStatuses.has(result.entry.media.status)
          ) {
            return false
          }

          if (
            selectedGenres.size > 0 &&
            !result.entry.media.genres.some((genre) =>
              selectedGenres.has(genre)
            )
          ) {
            return false
          }

          if (
            !selectedSubtitleAvailability.has(getSubtitleAvailability(result))
          ) {
            return false
          }

          if (
            activeSearchState.difficultyFilterMode === "jpdbAverageDifficulty"
          ) {
            const effectiveRange =
              normalizeRange(
                activeSearchState.jpdbDifficultyRange,
                availableJpdbDifficultyBounds
              ) ?? availableJpdbDifficultyBounds

            if (!result.matchedJpdb || !effectiveRange) {
              return false
            }

            return (
              result.matchedJpdb.entry.averageDifficulty >= effectiveRange[0] &&
              result.matchedJpdb.entry.averageDifficulty <= effectiveRange[1]
            )
          }

          if (activeSearchState.difficultyFilterMode === "learnNativelyLevel") {
            const effectiveRange =
              normalizeRange(
                activeSearchState.learnNativelyLevelRange,
                availableLearnNativelyLevelBounds
              ) ?? availableLearnNativelyLevelBounds

            if (!result.matchedLearnNatively || !effectiveRange) {
              return false
            }

            return (
              result.matchedLearnNatively.levelNumber >= effectiveRange[0] &&
              result.matchedLearnNatively.levelNumber <= effectiveRange[1]
            )
          }

          if (
            activeSearchState.difficultyFilterMode ===
            "learnNativelyJlptEquivalent"
          ) {
            const effectiveRange =
              normalizeRange(
                activeSearchState.learnNativelyJlptRange,
                availableLearnNativelyJlptBounds
              ) ?? availableLearnNativelyJlptBounds

            if (!result.matchedLearnNatively || !effectiveRange) {
              return false
            }

            const equivalentIndex = getLearnNativelyJlptEquivalentIndex(
              result.matchedLearnNatively.jlptEquivalent
            )

            return (
              equivalentIndex >= effectiveRange[0] &&
              equivalentIndex <= effectiveRange[1]
            )
          }

          return true
        }),
        activeSearchState.sortBy
      )
    : []

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await runLookup(activeSearchState.source, activeSearchState.username)
  }

  return (
    <TooltipProvider>
      <main className="min-h-svh bg-[linear-gradient(180deg,_#08111d_0%,_#0b1622_30%,_#0b1622_100%)] bg-fixed text-slate-100">
        <section
          className={cn(
            "mx-auto flex min-h-svh w-full max-w-[1520px] flex-col px-4 py-8 sm:px-6 lg:px-8",
            hasResultsState ? "gap-8" : ""
          )}
        >
          <div
            className={cn(
              "space-y-5 text-center transition-transform duration-500 ease-out",
              hasResultsState ? "translate-y-0" : "translate-y-[38vh]"
            )}
          >
            <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
              Nani next?
            </h1>
            <p className="text-base text-slate-300 sm:text-lg">
              Find your next anime to study japanese
            </p>
            <form
              className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row"
              onSubmit={handleSubmit}
            >
              <Select
                onValueChange={(value) =>
                  updateSearchState((previousState) => ({
                    ...previousState,
                    source: value as AnimeSource,
                  }))
                }
                value={activeSearchState.source}
              >
                <SelectTrigger
                  aria-label="Source"
                  className="h-12 w-full text-base data-[size=default]:h-12 sm:w-44"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {animeSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {getSourceLabel(source)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input
                  className="h-12 pl-11 text-base"
                  onChange={(event) =>
                    updateSearchState((previousState) => ({
                      ...previousState,
                      username: event.target.value,
                    }))
                  }
                  placeholder="Enter username"
                  value={activeSearchState.username}
                />
              </div>
              <Button
                className="h-12 rounded bg-sky-500 px-6 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                disabled={isPending}
                type="submit"
              >
                {isPending ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    Searching
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Find overlap
                  </>
                )}
              </Button>
            </form>
            {lookupState && !lookupState.ok ? (
              <div className="mx-auto flex max-w-2xl items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{lookupState.message}</p>
              </div>
            ) : null}
            {lookupState?.ok ? (
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-400">
                <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1">
                  {lookupState.username}
                </span>
                <span>{lookupState.matchedCount} matches</span>
                <span className="flex flex-wrap items-center justify-center gap-1.5">
                  <span>{lookupState.totalAnime} entries scanned</span>
                  <span aria-hidden="true">•</span>
                  <LookupFreshness fetchedAt={lookupState.fetchedAt} />
                </span>
              </div>
            ) : null}
          </div>

          {hasResultsState ? (
            <div className="grid gap-6 animate-in fade-in fill-mode-both duration-500 ease-out lg:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="h-fit space-y-6 pt-1">
                <p className="text-[15px] font-semibold text-slate-200">
                  Filters
                </p>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-400">
                    Japanese subtitle availability
                  </Label>
                  <MultiSelectCombobox
                    ariaLabel="Japanese subtitle availability"
                    onSelectedValuesChange={(nextSelectedValues) =>
                      updateSearchState((previousState) => ({
                        ...previousState,
                        selectedSubtitleAvailability: serializeSelectedValues(
                          nextSelectedValues as Set<SubtitleAvailabilityOption>,
                          subtitleAvailabilityOptions
                        ),
                      }))
                    }
                    options={subtitleAvailabilityOptions.map((option) => ({
                      label: subtitleAvailabilityLabels[option],
                      value: option,
                    }))}
                    placeholder="Any"
                    searchPlaceholder="Search subtitle availability..."
                    selectedValues={selectedSubtitleAvailability}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-400">
                    Watch status
                  </Label>
                  <MultiSelectCombobox
                    ariaLabel="Watch status"
                    onSelectedValuesChange={(nextSelectedValues) =>
                      updateSearchState((previousState) => ({
                        ...previousState,
                        selectedStatuses: serializeSelectedValues(
                          nextSelectedValues as Set<WatchStatus>,
                          watchStatuses
                        ),
                      }))
                    }
                    options={watchStatuses.map((status) => ({
                      label: statusLabel[status],
                      value: status,
                    }))}
                    placeholder="Any"
                    placeholderWhenAllSelected
                    searchPlaceholder="Search watch status..."
                    selectedValues={selectedStatuses}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-400">
                    Airing status
                  </Label>
                  <MultiSelectCombobox
                    ariaLabel="Airing status"
                    onSelectedValuesChange={(nextSelectedValues) =>
                      updateSearchState((previousState) => ({
                        ...previousState,
                        selectedMediaStatuses: serializeSelectedValues(
                          nextSelectedValues as Set<Exclude<MediaStatus, null>>,
                          mediaStatuses
                        ),
                      }))
                    }
                    options={mediaStatuses.map((status) => ({
                      label: mediaStatusLabel[status],
                      value: status,
                    }))}
                    placeholder="Any"
                    placeholderWhenAllSelected
                    searchPlaceholder="Search airing status..."
                    selectedValues={selectedMediaStatuses}
                  />
                </div>

                {availableGenres.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-slate-400">
                      Genres
                    </Label>
                    <MultiSelectCombobox
                      ariaLabel="Genres"
                      onSelectedValuesChange={(nextSelectedValues) =>
                        updateSearchState((previousState) => ({
                          ...previousState,
                          selectedGenres:
                            serializeGenreValues(nextSelectedValues),
                        }))
                      }
                      options={availableGenres.map((genre) => ({
                        label: genre,
                        value: genre,
                      }))}
                      placeholder="Any"
                      searchPlaceholder="Search genres..."
                      selectedValues={selectedGenres}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-400">
                    Difficulty filter
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      updateSearchState((previousState) => ({
                        ...previousState,
                        difficultyFilterMode: value as DifficultyFilterMode,
                      }))
                    }
                    value={activeSearchState.difficultyFilterMode}
                  >
                    <SelectTrigger
                      aria-label="Difficulty filter"
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className="w-[var(--radix-select-trigger-width)]"
                      position="popper"
                    >
                      {difficultyFilterModes.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {difficultyFilterModeLabels[mode]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeSearchState.difficultyFilterMode !== "none" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                      <span>Allowed range</span>
                      {activeDifficultyBounds && activeDifficultyRange ? (
                        <span className="font-medium text-slate-100">
                          {formatDifficultyRangeValue(
                            activeSearchState.difficultyFilterMode,
                            activeDifficultyRange[0]
                          )}{" "}
                          -{" "}
                          {formatDifficultyRangeValue(
                            activeSearchState.difficultyFilterMode,
                            activeDifficultyRange[1]
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-500">No matched data</span>
                      )}
                    </div>
                    {activeDifficultyBounds && activeDifficultyRange ? (
                      <>
                        <Slider
                          aria-label={`${difficultyFilterModeLabels[activeSearchState.difficultyFilterMode]} range`}
                          className="py-1"
                          max={activeDifficultyBounds[1]}
                          min={activeDifficultyBounds[0]}
                          onValueChange={(nextRange: number[]) => {
                            if (nextRange.length !== 2) {
                              return
                            }

                            const normalizedNextRange = [
                              Math.min(nextRange[0], nextRange[1]),
                              Math.max(nextRange[0], nextRange[1]),
                            ] as NumericRange

                            updateSearchState((previousState) => ({
                              ...previousState,
                              jpdbDifficultyRange:
                                previousState.difficultyFilterMode ===
                                "jpdbAverageDifficulty"
                                  ? normalizeStoredRange(
                                      normalizedNextRange,
                                      availableJpdbDifficultyBounds
                                    )
                                  : previousState.jpdbDifficultyRange,
                              learnNativelyLevelRange:
                                previousState.difficultyFilterMode ===
                                "learnNativelyLevel"
                                  ? normalizeStoredRange(
                                      normalizedNextRange,
                                      availableLearnNativelyLevelBounds
                                    )
                                  : previousState.learnNativelyLevelRange,
                              learnNativelyJlptRange:
                                previousState.difficultyFilterMode ===
                                "learnNativelyJlptEquivalent"
                                  ? normalizeStoredRange(
                                      normalizedNextRange,
                                      availableLearnNativelyJlptBounds
                                    )
                                  : previousState.learnNativelyJlptRange,
                            }))
                          }}
                          step={1}
                          value={activeDifficultyRange}
                        />
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
                          <span>
                            {formatDifficultyRangeValue(
                              activeSearchState.difficultyFilterMode,
                              activeDifficultyBounds[0]
                            )}
                          </span>
                          <span>
                            {formatDifficultyRangeValue(
                              activeSearchState.difficultyFilterMode,
                              activeDifficultyBounds[1]
                            )}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No results currently have data for this filter.
                      </p>
                    )}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-400">
                    Sort by
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      updateSearchState((previousState) => ({
                        ...previousState,
                        sortBy: value as SortOption,
                      }))
                    }
                    value={activeSearchState.sortBy}
                  >
                    <SelectTrigger aria-label="Sort by" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className="w-[var(--radix-select-trigger-width)]"
                      position="popper"
                    >
                      {sortSelectOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option === "status"
                            ? "Watch Status then Title"
                            : option === "averageScore"
                              ? "Average Score"
                              : "Popularity"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </aside>

              <section className="space-y-4">
                {lookupState?.ok ? (
                  <div className="text-sm text-slate-400">
                    Showing {visibleResults.length} results
                  </div>
                ) : null}

                {visibleResults.length > 0 ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
                    {visibleResults.map((result) => (
                      <ResultCard
                        key={`${result.entry.source}-${result.entry.id}-${result.matchedJimaku.id}`}
                        onOpen={() => setSelectedResult(result)}
                        result={result}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/45 p-8 text-center text-slate-500">
                    No results match the active filters.
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </section>

        <ResultDialog
          onOpenChange={(open) => {
            if (!open) {
              setSelectedResult(null)
            }
          }}
          open={selectedResult !== null}
          result={selectedResult}
        />
      </main>
    </TooltipProvider>
  )
}
