import { useServerFn } from "@tanstack/react-start"
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Info,
  LoaderCircle,
  Search,
} from "lucide-react"
import type {
  FormEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
} from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FieldLabel } from "@/components/ui/field-label"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { successLookupTtlSeconds } from "@/lib/lookup-cache"
import { getEntryTitles } from "@/lib/matching"
import { normalizeTitle } from "@/lib/normalize"
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
  type SortDirection,
  type SortOption,
  type SubtitleAvailabilityOption,
  sortDirections,
  sortOptions,
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

const resultCardTooltipGap = 14
const resultCardTooltipWidth = 320
const viewportTooltipPadding = 16

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

function normalizeGenreValue(value: string) {
  return value.trim().toLowerCase()
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
  if (!result.matchedJimaku || result.matchedJimaku.fileCount === 0) {
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

function getResultTitle(result: OverlapResult) {
  return getEntryTitle(result.entry) ?? result.matchedJimaku?.name ?? "Unknown"
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

const sortSelectOptions: SortOption[] = [...sortOptions]

const sortOptionLabels: Record<SortOption, string> = {
  averageScore: "Average Score",
  popularity: "Popularity",
  jpdbAverageDifficulty: "JPDB Average Difficulty",
  learnNativelyLevel: "LearnNatively Level",
  title: "Title",
  status: "Watch Status",
}

const sortDirectionLabels: Record<SortDirection, string> = {
  desc: "Desc",
  asc: "Asc",
}

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
  const leftHasValue = typeof leftValue === "number"
  const rightHasValue = typeof rightValue === "number"

  if (!leftHasValue && !rightHasValue) {
    return compareTitles(left, right)
  }

  if (!leftHasValue) {
    return 1
  }

  if (!rightHasValue) {
    return -1
  }

  const delta =
    direction === "desc" ? rightValue - leftValue : leftValue - rightValue

  if (delta !== 0) {
    return delta
  }

  return compareTitles(left, right)
}

function sortResults(
  results: OverlapResult[],
  sortBy: SortOption,
  sortDirection: SortDirection
) {
  const nextResults = [...results]

  nextResults.sort((left, right) => {
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

    if (sortBy === "title") {
      const titleDelta = compareTitles(left, right)
      return sortDirection === "desc" ? titleDelta * -1 : titleDelta
    }

    const statusDelta =
      statusOrder[left.entry.status] - statusOrder[right.entry.status]

    if (statusDelta !== 0) {
      return sortDirection === "desc" ? statusDelta : statusDelta * -1
    }

    return compareTitles(left, right)
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

function JimakuLogo({ className }: { className?: string }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      src="/jimaku-favicon.ico"
    />
  )
}

function SourceLogo({
  source,
  className,
}: {
  source: AnimeSource
  className?: string
}) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      src={
        source === "myanimelist"
          ? "/myanimelist-favicon.svg"
          : "/anilist-favicon-32x32.png"
      }
    />
  )
}

function SourceOptionLabel({ source }: { source: AnimeSource }) {
  return (
    <span className="flex items-center gap-2">
      <SourceLogo className="size-4 shrink-0 rounded-sm" source={source} />
      <span>{getSourceLabel(source)}</span>
    </span>
  )
}

function DifficultyPosterBadge({ children }: { children: ReactNode }) {
  return (
    <Badge
      className="h-auto min-w-[90px] rounded-l-none rounded-r-md border border-border bg-background/90 px-2.5 py-2 text-xs font-semibold text-foreground shadow-[0_12px_24px_-16px_rgba(0,0,0,0.9)] backdrop-blur-sm"
      variant="outline"
    >
      {children}
    </Badge>
  )
}

type PlatformLinkDescriptor = {
  href: string
  label: string
  icon: ReactNode
}

function PlatformLinks({
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  result,
}: {
  onBlur: (event: React.FocusEvent<HTMLAnchorElement>) => void
  onFocus: () => void
  onPointerEnter: () => void
  onPointerLeave: () => void
  result: OverlapResult
}) {
  const links: PlatformLinkDescriptor[] = [
    {
      href: result.entry.media.siteUrl,
      label: getSourceLabel(result.entry.source),
      icon: (
        <SourceLogo
          className="size-4 shrink-0 rounded-sm"
          source={result.entry.source}
        />
      ),
    },
  ]

  if (result.matchedJimaku) {
    links.push({
      href: result.matchedJimaku.url,
      label: "Jimaku",
      icon: <JimakuLogo className="size-4 shrink-0" />,
    })
  }

  if (result.matchedJpdb) {
    links.push({
      href: result.matchedJpdb.entry.jpdbUrl,
      label: "JPDB",
      icon: <JpdbLogo className="size-4 shrink-0 rounded-sm" />,
    })
  }

  if (result.matchedLearnNatively) {
    links.push({
      href: result.matchedLearnNatively.entry.learnnativelyUrl,
      label: "LearnNatively",
      icon: <LearnNativelyLogo className="size-4 shrink-0 rounded-sm" />,
    })
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-2.5">
      <div className="flex flex-col gap-1.5 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        {links.map((link) => (
          <a
            className="pointer-events-auto flex h-9 items-center gap-2 rounded-md border border-border/80 bg-card/86 px-2.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-accent/92 focus-visible:bg-accent/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
            href={link.href}
            key={link.label}
            onBlur={onBlur}
            onFocus={onFocus}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            rel="noreferrer"
            target="_blank"
          >
            {link.icon}
            <span className="min-w-0 flex-1 truncate">{link.label}</span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
          </a>
        ))}
      </div>
    </div>
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
          <span className="text-xs font-bold text-foreground">Difficulty</span>
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

function ResultCard({ result }: { result: OverlapResult }) {
  const hoverTargetRef = useRef<HTMLButtonElement | null>(null)
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const [tooltipSide, setTooltipSide] = useState<"left" | "right">("right")

  const syncTooltipSide = useCallback(() => {
    const hoverTarget = hoverTargetRef.current

    if (!hoverTarget) {
      return
    }

    const rect = hoverTarget.getBoundingClientRect()
    const availableRight =
      window.innerWidth - rect.right - viewportTooltipPadding
    const availableLeft = rect.left - viewportTooltipPadding

    if (availableRight >= resultCardTooltipWidth + resultCardTooltipGap) {
      setTooltipSide("right")
      return
    }

    if (availableLeft >= resultCardTooltipWidth + resultCardTooltipGap) {
      setTooltipSide("left")
      return
    }

    setTooltipSide(availableRight >= availableLeft ? "right" : "left")
  }, [])

  const syncTooltipHoverState = useCallback(() => {
    const hoverTarget = hoverTargetRef.current

    if (!hoverTarget) {
      return
    }

    const isHovered =
      hoverTarget.matches(":hover") ||
      Array.from(hoverTarget.querySelectorAll("*")).some((element) =>
        element.matches(":hover")
      )

    if (isHovered) {
      syncTooltipSide()
    }

    setIsTooltipOpen(isHovered)
  }, [syncTooltipSide])

  useEffect(() => {
    const handleViewportChange = () => {
      syncTooltipHoverState()
    }

    window.addEventListener("scroll", handleViewportChange, {
      capture: true,
      passive: true,
    })
    window.addEventListener("resize", handleViewportChange, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleViewportChange, true)
      window.removeEventListener("resize", handleViewportChange)
    }
  }, [syncTooltipHoverState])

  const handlePointerUpdate = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") {
      return
    }

    syncTooltipSide()
    setIsTooltipOpen(true)
  }

  const handleLinkBlur = (event: React.FocusEvent<HTMLAnchorElement>) => {
    if (event.currentTarget.parentElement?.contains(event.relatedTarget)) {
      return
    }

    setIsTooltipOpen(false)
  }

  return (
    <div
      className={cn(
        "group relative h-full w-full",
        isTooltipOpen ? "z-30" : "z-0"
      )}
      data-result-card
    >
      <button
        aria-describedby={`result-card-tooltip-${result.entry.source}-${result.entry.id}`}
        className="h-full w-full text-left select-text"
        onBlur={() => setIsTooltipOpen(false)}
        onFocus={() => {
          syncTooltipSide()
          setIsTooltipOpen(true)
        }}
        onPointerLeave={() => setIsTooltipOpen(false)}
        ref={hoverTargetRef}
        type="button"
      >
        <div
          className="space-y-3"
          onPointerEnter={handlePointerUpdate}
          onPointerLeave={() => setIsTooltipOpen(false)}
          onPointerMove={handlePointerUpdate}
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-background shadow-[0_18px_40px_-30px_rgba(0,0,0,0.95)]">
            <img
              alt={getResultTitle(result)}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              src={result.entry.media.coverImage.large}
            />
            <DifficultyBadges result={result} />
          </div>
          <div className="space-y-3 px-0.5">
            <div className="flex items-start gap-2.5">
              <StatusDot result={result} />
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="line-clamp-2 h-10 text-sm font-medium leading-5 text-muted-foreground">
                  {getResultTitle(result)}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {result.matchedJimaku &&
                result.completeness === "incomplete" ? (
                  <WarningDot label="Incomplete Jimaku subtitles" tone="red" />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </button>
      {isTooltipOpen ? (
        <div
          className="pointer-events-none absolute top-0 hidden w-80 animate-in zoom-in-[0.98] rounded-lg border border-border bg-popover px-4 py-3.5 text-sm text-popover-foreground shadow-[0_20px_60px_-32px_rgba(0,0,0,0.95)] duration-400 lg:block"
          id={`result-card-tooltip-${result.entry.source}-${result.entry.id}`}
          role="tooltip"
          style={
            tooltipSide === "right"
              ? { left: `calc(100% + ${resultCardTooltipGap}px)` }
              : { right: `calc(100% + ${resultCardTooltipGap}px)` }
          }
        >
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <FieldLabel>Episodes</FieldLabel>
                <p className="mt-1 font-medium text-foreground">
                  {result.entry.media.episodes ?? "Unknown"}
                </p>
              </div>
              <div>
                <FieldLabel>Jimaku Files</FieldLabel>
                <p className="mt-1 font-medium text-foreground">
                  {result.matchedJimaku?.fileCount ?? 0}
                </p>
              </div>
              {result.matchedJpdb ? (
                <>
                  <div>
                    <FieldLabel>Average difficulty</FieldLabel>
                    <p className="mt-1 font-medium text-foreground">
                      {result.matchedJpdb.entry.averageDifficulty}/100
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Peak difficulty</FieldLabel>
                    <p className="mt-1 font-medium text-foreground">
                      {result.matchedJpdb.entry.peakDifficulty90thPercentile}
                      /100
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Length</FieldLabel>
                    <p className="mt-1 font-medium text-foreground">
                      {result.matchedJpdb.entry.lengthInWords.toLocaleString()}{" "}
                      words
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Unique words</FieldLabel>
                    <p className="mt-1 font-medium text-foreground">
                      {result.matchedJpdb.entry.uniqueWords.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Unique kanji</FieldLabel>
                    <p className="mt-1 font-medium text-foreground">
                      {result.matchedJpdb.entry.uniqueKanji.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Words used once</FieldLabel>
                    <p className="mt-1 font-medium text-foreground">
                      {result.matchedJpdb.entry.uniqueWordsUsedOnce.toLocaleString()}{" "}
                      ({result.matchedJpdb.entry.uniqueWordsUsedOncePercent}%)
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Unique readings</FieldLabel>
                    <p className="mt-1 font-medium text-foreground">
                      {result.matchedJpdb.entry.uniqueKanjiReadings.toLocaleString()}
                    </p>
                  </div>
                </>
              ) : null}
              {result.matchedLearnNatively ? (
                <div>
                  <FieldLabel>LearnNatively</FieldLabel>
                  <p className="mt-1 font-medium text-foreground">
                    {result.matchedLearnNatively.entry.level} •{" "}
                    {result.matchedLearnNatively.jlptEquivalent}
                  </p>
                </div>
              ) : null}
              <div>
                <FieldLabel>Airing Status</FieldLabel>
                <p className="mt-1 font-medium text-foreground">
                  {getMediaStatusLabel(result.entry.media.status)}
                </p>
              </div>
            </div>
            <div className="border-t border-border pt-3.5">
              <FieldLabel>Genres</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.entry.media.genres.length > 0 ? (
                  result.entry.media.genres.map((genre) => (
                    <Badge className="px-2.5" key={genre} variant="neutral">
                      {genre}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <PlatformLinks
        onBlur={handleLinkBlur}
        onFocus={() => setIsTooltipOpen(true)}
        onPointerEnter={() => setIsTooltipOpen(true)}
        onPointerLeave={() => setIsTooltipOpen(false)}
        result={result}
      />
    </div>
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
  const autoLookupPerformedRef = useRef(false)

  const activeSearchState = searchState ?? localSearchState
  const normalizedTitleQuery = normalizeTitle(activeSearchState.titleQuery)
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
        ...new Map(
          lookupState.results
            .flatMap((result) => result.entry.media.genres)
            .map((genre) => [normalizeGenreValue(genre), genre] as const)
        ).entries(),
      ]
        .map(([value, label]) => ({
          label,
          value,
        }))
        .sort((left, right) => left.label.localeCompare(right.label))
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
          if (
            selectedStatuses.size > 0 &&
            !selectedStatuses.has(result.entry.status)
          ) {
            return false
          }

          if (
            normalizedTitleQuery &&
            !getEntryTitles(result.entry).some((title) =>
              normalizeTitle(title).includes(normalizedTitleQuery)
            )
          ) {
            return false
          }

          if (
            selectedMediaStatuses.size > 0 &&
            result.entry.media.status &&
            !selectedMediaStatuses.has(result.entry.media.status)
          ) {
            return false
          }

          if (
            selectedGenres.size > 0 &&
            ![...selectedGenres].every((genre) =>
              result.entry.media.genres
                .map((resultGenre) => normalizeGenreValue(resultGenre))
                .includes(genre)
            )
          ) {
            return false
          }

          if (
            selectedSubtitleAvailability.size > 0 &&
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
        activeSearchState.sortBy,
        activeSearchState.sortDirection
      )
    : []

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await runLookup(activeSearchState.source, activeSearchState.username)
  }

  return (
    <TooltipProvider>
      <main className="min-h-svh overflow-x-clip bg-[linear-gradient(180deg,_var(--background)_0%,_#0b1622_30%,_#0b1622_100%)] bg-fixed text-foreground">
        <section
          className={cn(
            "mx-auto flex min-h-svh w-full max-w-[1520px] flex-col px-4 py-8 sm:px-6 lg:px-8",
            hasResultsState ? "gap-8" : "justify-center"
          )}
        >
          <div
            className={cn(
              "mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center transition-all duration-700 ease-out",
              hasResultsState ? "space-y-5" : "space-y-0"
            )}
          >
            <div
              className={cn(
                "mx-auto overflow-hidden transition-[max-height,opacity,margin] ease-out",
                hasResultsState
                  ? "mb-0 max-h-0 opacity-0 duration-300"
                  : "mb-6 text-4xl opacity-100 duration-300 sm:text-5xl"
              )}
            >
              <img
                alt=""
                aria-hidden="true"
                className="mx-auto h-auto w-[7.35ch] max-w-[78vw] object-contain"
                src="/nani-next-mark.png"
              />
            </div>
            <h1
              className={cn(
                "inline-flex justify-center font-semibold tracking-tight text-foreground text-5xl sm:text-6xl",
                hasResultsState
                  ? "items-center gap-4"
                  : "mb-6 items-center gap-0"
              )}
            >
              <img
                alt=""
                aria-hidden="true"
                className={cn(
                  "object-contain transition-opacity duration-700 ease-out",
                  hasResultsState
                    ? "mr-0 size-24 opacity-100 sm:size-28"
                    : "mr-[-0.5rem] size-0 opacity-0"
                )}
                src="/nani-next-mark.png"
              />
              <span>Nani next?</span>
            </h1>
            <p
              className={cn(
                "text-base text-muted-foreground sm:text-lg",
                hasResultsState ? "" : "mb-6"
              )}
            >
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
                  <SelectValue>
                    <SourceOptionLabel source={activeSearchState.source} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {animeSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      <SourceOptionLabel source={source} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
                aria-label={isPending ? "Searching" : "Find overlap"}
                className="h-12 px-6 text-sm font-semibold"
                disabled={isPending}
                type="submit"
              >
                {isPending ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    Searching
                  </>
                ) : (
                  <ArrowRight />
                )}
              </Button>
            </form>
            {lookupState && !lookupState.ok ? (
              <div className="mx-auto flex max-w-2xl items-start gap-3 rounded-lg border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{lookupState.message}</p>
              </div>
            ) : null}
            {lookupState?.ok ? (
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
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
                <p className="text-sm font-semibold text-foreground">Filters</p>

                <div className="space-y-2">
                  <Label
                    className="text-label text-muted-foreground"
                    htmlFor="title-filter"
                  >
                    Anime title
                  </Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-11"
                      id="title-filter"
                      onChange={(event) =>
                        updateSearchState((previousState) => ({
                          ...previousState,
                          titleQuery: event.target.value,
                        }))
                      }
                      placeholder="Search titles..."
                      value={activeSearchState.titleQuery}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-label text-muted-foreground">
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
                  <Label className="text-label text-muted-foreground">
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
                    searchPlaceholder="Search watch status..."
                    selectedValues={selectedStatuses}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-label text-muted-foreground">
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
                    searchPlaceholder="Search airing status..."
                    selectedValues={selectedMediaStatuses}
                  />
                </div>

                {availableGenres.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-label text-muted-foreground">
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
                        label: genre.label,
                        value: genre.value,
                      }))}
                      placeholder="Any"
                      searchPlaceholder="Search genres..."
                      selectionMode="intersection"
                      selectedValues={selectedGenres}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label className="text-label text-muted-foreground">
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
                    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                      <span>Allowed range</span>
                      {activeDifficultyBounds && activeDifficultyRange ? (
                        <span className="font-medium text-foreground">
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
                        <span className="text-muted-foreground">
                          No matched data
                        </span>
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
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                      <p className="text-sm text-muted-foreground">
                        No results currently have data for this filter.
                      </p>
                    )}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-label text-muted-foreground">
                      Sort by
                    </Label>
                    <Tabs
                      aria-label="Sort direction"
                      className="gap-0"
                      onValueChange={(value) =>
                        updateSearchState((previousState) => ({
                          ...previousState,
                          sortDirection: value as SortDirection,
                        }))
                      }
                      value={activeSearchState.sortDirection}
                    >
                      <TabsList aria-label="Sort direction">
                        {sortDirections.map((direction) => {
                          return (
                            <TabsTrigger
                              aria-label={sortDirectionLabels[direction]}
                              key={direction}
                              onClick={() =>
                                updateSearchState((previousState) => ({
                                  ...previousState,
                                  sortDirection: direction,
                                }))
                              }
                              value={direction}
                            >
                              {sortDirectionLabels[direction]}
                            </TabsTrigger>
                          )
                        })}
                      </TabsList>
                    </Tabs>
                  </div>
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
                          {sortOptionLabels[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </aside>

              <section className="space-y-4">
                {lookupState?.ok ? (
                  <div className="text-sm text-muted-foreground">
                    Showing {visibleResults.length} results
                  </div>
                ) : null}

                {visibleResults.length > 0 ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
                    {visibleResults.map((result) => (
                      <ResultCard
                        key={`${result.entry.source}-${result.entry.id}`}
                        result={result}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            </div>
          ) : null}
        </section>
      </main>
    </TooltipProvider>
  )
}
