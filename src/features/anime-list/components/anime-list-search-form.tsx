import { ArrowRight, LoaderCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type AnimeSource,
  animeSources,
} from "@/features/anime-list/domain/anime-list-enums"
import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import {
  getSourceLabel,
  sourceFavicons,
} from "@/features/anime-list/lib/labels"

export function AnimeListSearchForm({
  handleSubmit,
  isPending,
  searchState,
  updateSearchState,
}: {
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  isPending: boolean
  searchState: LookupSearchState
  updateSearchState: (
    updater: (previousState: LookupSearchState) => LookupSearchState
  ) => void
}) {
  return (
    <form
      className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
      onSubmit={handleSubmit}
    >
      <div className="w-full sm:w-44">
        <Select
          onValueChange={(value) =>
            updateSearchState((previousState) => ({
              ...previousState,
              source: value as AnimeSource,
            }))
          }
          value={searchState.source}
        >
          <SelectTrigger
            aria-label="Source"
            className="h-12 w-full text-base data-[size=default]:h-12"
          >
            <SelectValue>
              <SourceOptionLabel source={searchState.source} />
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
      </div>
      <div className="flex w-full gap-3 sm:contents">
        <div className="relative min-w-0 flex-1">
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
            value={searchState.username}
          />
        </div>
        <Button
          aria-label={isPending ? undefined : "Find overlap"}
          className="h-12 shrink-0 px-6 text-sm font-semibold"
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
      </div>
    </form>
  )
}

function SourceOptionLabel({ source }: { source: AnimeSource }) {
  return (
    <span className="flex items-center gap-2">
      <img
        alt=""
        aria-hidden="true"
        className="size-4 shrink-0 rounded-sm"
        src={sourceFavicons[source] ?? sourceFavicons.anilist}
      />
      <span>{getSourceLabel(source)}</span>
    </span>
  )
}
