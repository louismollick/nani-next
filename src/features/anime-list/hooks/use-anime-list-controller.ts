import { useCallback, useEffect, useMemo, useState } from "react"
import type { LookupResponse } from "@/features/anime-list/domain/lookup-response"
import { useAnimeListLookup } from "@/features/anime-list/hooks/use-anime-list-lookup"
import { useAnimeListSearchState } from "@/features/anime-list/hooks/use-anime-list-search-state"
import { useDebouncedValue } from "@/features/anime-list/hooks/use-debounced-value"
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

const browseDebounceMs = 350

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
  const [browsePage, setBrowsePage] = useState(1)
  const {
    cancelAniListRetry,
    isPending,
    lookupState,
    lookupStatus,
    runBrowse,
    runLookup,
  } = useAnimeListLookup(lookup)
  const facets = useMemo(
    () => deriveAnimeListFacets(lookupState),
    [lookupState]
  )
  const isUserListMode = activeSearchState.mode === "userList"
  const activeLookupIdentity = getLookupIdentity(activeSearchState)
  const isGlobalAniListBrowse =
    isUserListMode &&
    activeSearchState.source === "anilist" &&
    activeSearchState.myAnimeFilterMode !== "onlyMine"
  const browseQueryKey = useMemo(
    () =>
      JSON.stringify({
        titleQuery: activeSearchState.titleQuery.trim(),
        myAnimeFilterMode: activeSearchState.myAnimeFilterMode,
        selectedGenres: activeSearchState.selectedGenres,
        selectedMediaStatuses: activeSearchState.selectedMediaStatuses,
        selectedFormats: activeSearchState.selectedFormats,
        selectedSubtitleAvailability:
          activeSearchState.selectedSubtitleAvailability,
        yearRange: activeSearchState.yearRange,
        episodeRange: activeSearchState.episodeRange,
        durationRange: activeSearchState.durationRange,
        sortBy: activeSearchState.sortBy,
        sortDirection: activeSearchState.sortDirection,
        source: activeSearchState.source,
        username: activeSearchState.username.trim().toLowerCase(),
      }),
    [activeSearchState]
  )
  const debouncedBrowseSearchState = useDebouncedValue(
    activeSearchState,
    browseDebounceMs
  )
  const browseSearchStateForRequest =
    browsePage === 1 ? debouncedBrowseSearchState : activeSearchState
  const browseRequestKey = useMemo(
    () =>
      JSON.stringify({
        page: browsePage,
        searchState: browseSearchStateForRequest,
      }),
    [browsePage, browseSearchStateForRequest]
  )

  useEffect(() => {
    updateSearchState((previousState) =>
      syncRangeFilters(previousState, facets)
    )
  }, [facets, updateSearchState])

  useEffect(() => {
    if (
      activeSearchState.myAnimeFilterMode === "hideMine" &&
      activeSearchState.sortBy === "status"
    ) {
      updateSearchState((previousState) => ({
        ...previousState,
        sortBy: "averageScore",
      }))
    }
  }, [
    activeSearchState.myAnimeFilterMode,
    activeSearchState.sortBy,
    updateSearchState,
  ])

  useEffect(() => {
    void browseQueryKey

    if (!isGlobalAniListBrowse) {
      setBrowsePage(1)
      return
    }

    setBrowsePage(1)
  }, [browseQueryKey, isGlobalAniListBrowse])

  useEffect(() => {
    if (!isUserListMode || !autoLookupIdentity || isGlobalAniListBrowse) {
      return
    }

    if (activeLookupIdentity === autoLookupIdentity) {
      void runLookup(activeSearchState.source, activeSearchState.username)
    }
  }, [
    activeLookupIdentity,
    activeSearchState.source,
    activeSearchState.username,
    autoLookupIdentity,
    isGlobalAniListBrowse,
    isUserListMode,
    runLookup,
  ])

  useEffect(() => {
    if (!isUserListMode || activeSearchState.source === "anilist") {
      return
    }

    cancelAniListRetry()
  }, [activeSearchState.source, cancelAniListRetry, isUserListMode])

  useEffect(() => {
    void browseRequestKey

    if (
      !isUserListMode ||
      !isGlobalAniListBrowse ||
      !browseSearchStateForRequest.username.trim()
    ) {
      return
    }

    void runBrowse({
      page: browsePage,
      reset: browsePage === 1,
      searchState: browseSearchStateForRequest,
    })
  }, [
    browsePage,
    browseRequestKey,
    browseSearchStateForRequest,
    isUserListMode,
    isGlobalAniListBrowse,
    runBrowse,
  ])

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
      if (
        activeSearchState.source === "anilist" &&
        activeSearchState.myAnimeFilterMode !== "onlyMine"
      ) {
        setBrowsePage(1)
        await runBrowse({
          page: 1,
          reset: true,
          searchState: activeSearchState,
        })
        return
      }

      await runLookup(activeSearchState.source, activeSearchState.username)
    },
    [activeSearchState, runBrowse, runLookup]
  )

  const loadNextPage = useCallback(async () => {
    if (
      !isGlobalAniListBrowse ||
      !lookupState?.ok ||
      !lookupState.pageInfo?.hasNextPage
    ) {
      return
    }

    setBrowsePage((previousPage) => previousPage + 1)
  }, [isGlobalAniListBrowse, lookupState])

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
    isGlobalAniListBrowse,
    lookupStatus,
    loadNextPage,
    lookupState,
    searchState: activeSearchState,
    updateSearchState,
    visibleResults,
  }
}
