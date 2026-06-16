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

export function SearchSourceSelect({
  searchState,
  updateSearchState,
}: {
  searchState: LookupSearchState
  updateSearchState: (
    updater: (previousState: LookupSearchState) => LookupSearchState
  ) => void
}) {
  return (
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
