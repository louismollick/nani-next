import { useCallback, useEffect, useMemo } from "react"
import type { LookupResponse } from "@/features/anime-list/domain/lookup-response"
import { useAnimeListLookup } from "@/features/anime-list/hooks/use-anime-list-lookup"
import { useAnimeListSearchState } from "@/features/anime-list/hooks/use-anime-list-search-state"
import { useAutoLookup } from "@/features/anime-list/hooks/use-auto-lookup"
import {
  getActiveDifficultyBounds,
  getActiveDifficultyRange,
} from "@/features/anime-list/lib/active-difficulty"
import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import { getLookupIdentity } from "@/features/anime-list/lib/anime-list-search-state-identity"
import { deriveAnimeListFacets } from "@/features/anime-list/lib/derive-anime-list-facets"
import { filterAnimeListResults } from "@/features/anime-list/lib/filter-anime-list-results"
import { sortAnimeListResults } from "@/features/anime-list/lib/sort-anime-list-results"
import { syncRangeFilters } from "@/features/anime-list/lib/sync-range-filters"

export type AnimeListLookup = (input: {
  data: { source: "anilist" | "myanimelist"; username: string }
}) => Promise<LookupResponse>

export type AnimeListController = ReturnType<typeof useAnimeListController>

export function useAnimeListController({
  autoLookupIdentity = null,
  lookup,
  onSearchStateChange,
  searchState,
}: {
  autoLookupIdentity?: string | null
  lookup: AnimeListLookup
  onSearchStateChange?: (
    updater: (previousState: LookupSearchState) => LookupSearchState
  ) => void
  searchState?: LookupSearchState
}) {
  const { activeSearchState, updateSearchState } = useAnimeListSearchState({
    onSearchStateChange,
    searchState,
  })
  const { isPending, lookupState, runLookup } = useAnimeListLookup(lookup)
  const facets = useMemo(
    () => deriveAnimeListFacets(lookupState),
    [lookupState]
  )
  const activeLookupIdentity = getLookupIdentity(activeSearchState)

  useEffect(() => {
    updateSearchState((previousState) =>
      syncRangeFilters(previousState, facets)
    )
  }, [facets, updateSearchState])

  useAutoLookup({
    activeLookupIdentity,
    autoLookupIdentity,
    runLookup,
    source: activeSearchState.source,
    username: activeSearchState.username,
  })

  const visibleResults = useMemo(
    () =>
      lookupState?.ok
        ? sortAnimeListResults(
            filterAnimeListResults(
              lookupState.results,
              activeSearchState,
              facets
            ),
            activeSearchState.sortBy,
            activeSearchState.sortDirection
          )
        : [],
    [activeSearchState, facets, lookupState]
  )

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      await runLookup(activeSearchState.source, activeSearchState.username)
    },
    [activeSearchState.source, activeSearchState.username, runLookup]
  )

  return {
    activeDifficultyBounds: getActiveDifficultyBounds(
      activeSearchState,
      facets
    ),
    activeDifficultyRange: getActiveDifficultyRange(activeSearchState, facets),
    facets,
    handleSubmit,
    hasResultsState: lookupState?.ok === true,
    isPending,
    lookupState,
    searchState: activeSearchState,
    updateSearchState,
    visibleResults,
  }
}
