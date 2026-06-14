import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"

export function AnimeListTitleFilter({
  searchState,
  updateSearchState,
}: {
  searchState: LookupSearchState
  updateSearchState: (
    updater: (previousState: LookupSearchState) => LookupSearchState
  ) => void
}) {
  return (
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
          onChange={(event) => {
            const titleQuery = event.target.value

            updateSearchState((previousState) => ({
              ...previousState,
              titleQuery,
            }))
          }}
          placeholder="Search titles..."
          value={searchState.titleQuery}
        />
      </div>
    </div>
  )
}
