import type { AnimeSearchSuggestion } from "@/features/anime-list/domain/lookup-response"
import { getAnimeFormatLabel } from "@/features/anime-list/lib/result-presenters"
import { cn } from "@/lib/utils"

export function AnimeSearchSuggestions({
  isOpen,
  isPending,
  onSelect,
  suggestions,
}: {
  isOpen: boolean
  isPending: boolean
  onSelect: (suggestion: AnimeSearchSuggestion) => Promise<void>
  suggestions: AnimeSearchSuggestion[]
}) {
  if (!isOpen || suggestions.length === 0) {
    return null
  }

  return (
    <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-lg border border-border bg-popover shadow-[0_18px_50px_-34px_rgba(0,0,0,0.9)]">
      <div className="max-h-96 overflow-y-auto p-1.5">
        {suggestions.map((suggestion) => (
          <SuggestionButton
            isPending={isPending}
            key={suggestion.id}
            onSelect={() => onSelect(suggestion)}
            suggestion={suggestion}
          />
        ))}
      </div>
    </div>
  )
}

function SuggestionButton({
  isPending,
  onSelect,
  suggestion,
}: {
  isPending: boolean
  onSelect: () => Promise<void>
  suggestion: AnimeSearchSuggestion
}) {
  const title =
    suggestion.title.primary ??
    suggestion.title.english ??
    suggestion.title.native ??
    "Unknown"

  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-accent hover:text-accent-foreground",
        isPending && "pointer-events-none opacity-60"
      )}
      onClick={() => void onSelect()}
      onMouseDown={(event) => event.preventDefault()}
      type="button"
    >
      <img
        alt=""
        aria-hidden="true"
        className="h-12 w-8 shrink-0 rounded-sm object-cover"
        src={suggestion.coverImage.large}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {title}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {suggestion.year ? <span>{suggestion.year}</span> : null}
          {suggestion.year && suggestion.format ? (
            <span aria-hidden="true">•</span>
          ) : null}
          {suggestion.format ? (
            <span>{getAnimeFormatLabel(suggestion.format)}</span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
