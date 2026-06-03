import { useServerFn } from "@tanstack/react-start"
import {
  AlertCircle,
  ExternalLink,
  LoaderCircle,
  Search,
  Sparkles,
  TriangleAlert,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  mediaStatusLabel,
  statusDotClassName,
  statusLabel,
  statusOrder,
} from "@/lib/status"
import {
  type AniListMediaStatus,
  anilistMediaStatuses,
  anilistWatchStatuses,
  type LookupResponse,
  type OverlapResult,
  type SortOption,
  sortOptions,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type AnimeOverlapPageProps = {
  initialUsername?: string
  lookup: (input: { data: { username: string } }) => Promise<LookupResponse>
}

function sortResults(results: OverlapResult[], sortBy: SortOption) {
  const nextResults = [...results]

  nextResults.sort((left, right) => {
    if (sortBy === "averageScore") {
      return (
        (right.anilistEntry.media.averageScore ?? -1) -
        (left.anilistEntry.media.averageScore ?? -1)
      )
    }

    if (sortBy === "popularity") {
      return (
        (right.anilistEntry.media.popularity ?? -1) -
        (left.anilistEntry.media.popularity ?? -1)
      )
    }

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

  return nextResults
}

function StatusDot({ result }: { result: OverlapResult }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={statusLabel[result.anilistEntry.status]}
          className={cn(
            "mt-1 size-2.5 shrink-0 self-start rounded-full shadow-[0_0_0_3px_rgba(7,15,28,0.55)]",
            statusDotClassName[result.anilistEntry.status]
          )}
          role="img"
        />
      </TooltipTrigger>
      <TooltipContent>{statusLabel[result.anilistEntry.status]}</TooltipContent>
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

function getMediaStatusLabel(status: AniListMediaStatus) {
  return status ? mediaStatusLabel[status] : "Unknown"
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
            <div className="aspect-[3/4] overflow-hidden rounded bg-slate-950 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.95)]">
              <img
                alt={
                  result.anilistEntry.media.title.romaji ??
                  result.matchedJimaku.name
                }
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                src={result.anilistEntry.media.coverImage.large}
              />
            </div>
            <div className="space-y-3 px-0.5">
              <div className="flex items-start gap-2.5">
                <StatusDot result={result} />
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="line-clamp-2 h-10 text-sm font-medium leading-5 text-slate-400">
                    {result.anilistEntry.media.title.romaji ??
                      result.matchedJimaku.name}
                  </h3>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {result.isLowConfidence ? (
                    <WarningDot label="Low confidence match" tone="amber" />
                  ) : null}
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
                {result.anilistEntry.media.episodes ?? "Unknown"}
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
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Airing Status
            </p>
            <p className="mt-1 font-medium text-slate-200">
              {getMediaStatusLabel(result.anilistEntry.media.status)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Genres
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.anilistEntry.media.genres.length > 0 ? (
                result.anilistEntry.media.genres.map((genre) => (
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
      <DialogContent className="border-slate-800 bg-slate-950 text-slate-100 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.85)] sm:max-w-2xl">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8 text-2xl text-slate-100">
                {result.anilistEntry.media.title.romaji ??
                  result.matchedJimaku.name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
              <img
                alt={
                  result.anilistEntry.media.title.romaji ??
                  result.matchedJimaku.name
                }
                className="aspect-[3/4] w-full rounded-2xl object-cover shadow-lg"
                src={result.anilistEntry.media.coverImage.large}
              />
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-sm text-slate-200">
                    <StatusDot result={result} />
                    <span>{statusLabel[result.anilistEntry.status]}</span>
                  </div>
                  {result.isLowConfidence ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">
                      <WarningDot label="Low confidence match" tone="amber" />
                      <span>Low confidence</span>
                    </div>
                  ) : null}
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
                        AniList
                      </p>
                      <p className="text-sm font-medium text-slate-100">
                        {result.anilistEntry.media.title.romaji ?? "Unknown"}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a
                        className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
                        href={result.anilistEntry.media.siteUrl}
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
                      {result.anilistEntry.media.episodes ?? "Unknown"}
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
  initialUsername = "",
  lookup,
}: AnimeOverlapPageProps) {
  const lookupFn = useServerFn(lookup)
  const [username, setUsername] = useState(initialUsername)
  const [selectedStatuses, setSelectedStatuses] = useState(
    new Set(anilistWatchStatuses)
  )
  const [selectedMediaStatuses, setSelectedMediaStatuses] = useState(
    new Set(anilistMediaStatuses)
  )
  const [selectedGenres, setSelectedGenres] = useState(new Set<string>())
  const [hideIncomplete, setHideIncomplete] = useState(false)
  const [hideLowConfidence, setHideLowConfidence] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>("status")
  const [lookupState, setLookupState] = useState<LookupResponse | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [selectedResult, setSelectedResult] = useState<OverlapResult | null>(
    null
  )
  const hasResultsState = lookupState?.ok === true
  const availableGenres = lookupState?.ok
    ? [
        ...new Set(
          lookupState.results.flatMap(
            (result) => result.anilistEntry.media.genres
          )
        ),
      ].sort((left, right) => left.localeCompare(right))
    : []

  const visibleResults = lookupState?.ok
    ? sortResults(
        lookupState.results.filter((result) => {
          if (!selectedStatuses.has(result.anilistEntry.status)) {
            return false
          }

          if (
            result.anilistEntry.media.status &&
            !selectedMediaStatuses.has(result.anilistEntry.media.status)
          ) {
            return false
          }

          if (
            selectedGenres.size > 0 &&
            !result.anilistEntry.media.genres.some((genre) =>
              selectedGenres.has(genre)
            )
          ) {
            return false
          }

          if (hideIncomplete && result.completeness === "incomplete") {
            return false
          }

          if (hideLowConfidence && result.isLowConfidence) {
            return false
          }

          return true
        }),
        sortBy
      )
    : []

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextUsername = username.trim()

    if (!nextUsername) {
      setLookupState({
        ok: false,
        code: "UPSTREAM_ERROR",
        message: "Enter an AniList username.",
      })
      return
    }

    setIsPending(true)

    try {
      setLookupState(await lookupFn({ data: { username: nextUsername } }))
    } finally {
      setIsPending(false)
    }
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
              AniList x Jimaku overlap finder
            </h1>
            <form
              className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row"
              onSubmit={handleSubmit}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input
                  className="h-12 rounded border-slate-800 bg-slate-900 pl-11 text-base text-slate-100 shadow-[0_18px_50px_-34px_rgba(0,0,0,0.9)] placeholder:text-slate-500"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter AniList username"
                  value={username}
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
                <span>{lookupState.totalAnime} AniList entries scanned</span>
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
                    Watch status
                  </Label>
                  <MultiSelectCombobox
                    ariaLabel="Watch status"
                    onSelectedValuesChange={(nextSelectedValues) =>
                      setSelectedStatuses(
                        nextSelectedValues as Set<
                          (typeof anilistWatchStatuses)[number]
                        >
                      )
                    }
                    options={anilistWatchStatuses.map((status) => ({
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
                      setSelectedMediaStatuses(
                        nextSelectedValues as Set<
                          (typeof anilistMediaStatuses)[number]
                        >
                      )
                    }
                    options={anilistMediaStatuses.map((status) => ({
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
                      onSelectedValuesChange={setSelectedGenres}
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
                    Jimaku subtitle completeness
                  </Label>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Checkbox
                      checked={hideIncomplete}
                      id="hide-incomplete"
                      onCheckedChange={(checked) =>
                        setHideIncomplete(Boolean(checked))
                      }
                    />
                    <Label
                      className="text-sm font-normal text-slate-300"
                      htmlFor="hide-incomplete"
                    >
                      Hide incomplete Jimaku subtitles
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-400">
                    Match confidence
                  </Label>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Checkbox
                      checked={hideLowConfidence}
                      id="hide-low-confidence"
                      onCheckedChange={(checked) =>
                        setHideLowConfidence(Boolean(checked))
                      }
                    />
                    <Label
                      className="text-sm font-normal text-slate-300"
                      htmlFor="hide-low-confidence"
                    >
                      Hide low confidence matches
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-400">
                    Sort by
                  </Label>
                  <Select
                    onValueChange={(value) => setSortBy(value as SortOption)}
                    value={sortBy}
                  >
                    <SelectTrigger
                      aria-label="Sort by"
                      className="w-full justify-between rounded border-0 bg-slate-800/60 px-3.5 text-left text-[15px] font-normal text-slate-400 shadow-none hover:bg-slate-800 data-[size=default]:h-10 [&>svg]:text-slate-400 [&>svg]:opacity-90"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className="w-[var(--radix-select-trigger-width)] overflow-hidden rounded border-slate-800 bg-slate-950 p-0 text-slate-400"
                      position="popper"
                    >
                      {sortOptions.map((option) => (
                        <SelectItem
                          className="rounded-none py-2 text-[15px] text-slate-400 focus:bg-slate-800 focus:text-slate-100 hover:text-slate-100"
                          key={option}
                          value={option}
                        >
                          {option === "status"
                            ? "AniList Status then Title"
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
                        key={`${result.anilistEntry.id}-${result.matchedJimaku.id}`}
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
