import { useServerFn } from "@tanstack/react-start"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { AnimeSearchSuggestion } from "@/features/anime-list/domain/lookup-response"
import { useAnimeListSearchState } from "@/features/anime-list/hooks/use-anime-list-search-state"
import { useDebouncedValue } from "@/features/anime-list/hooks/use-debounced-value"
import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import {
  searchAniListTitles,
  suggestAniListTitles,
} from "@/features/anime-list/server/search-anilist"
import type { LookupResponse } from "@/lib/types"

const suggestionsDebounceMs = 250

export type AnimeSearchController = ReturnType<typeof useAnimeSearchController>

export function useAnimeSearchController({
  onSearchStateChange,
  searchState,
}: {
  onSearchStateChange?: (
    updater: (previousState: LookupSearchState) => LookupSearchState
  ) => void
  searchState?: LookupSearchState
}) {
  const { activeSearchState, updateSearchState } = useAnimeListSearchState({
    onSearchStateChange,
    searchState,
  })
  const searchFn = useServerFn(searchAniListTitles)
  const suggestFn = useServerFn(suggestAniListTitles)
  const [inputValue, setInputValue] = useState(
    () => activeSearchState.animeSearchQuery
  )
  const [lookupState, setLookupState] = useState<LookupResponse | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [suggestions, setSuggestions] = useState<AnimeSearchSuggestion[]>([])
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const lastCommittedQueryRef = useRef(activeSearchState.animeSearchQuery)
  const searchRequestIdRef = useRef(0)
  const suggestionRequestIdRef = useRef(0)
  const initialAutoSearchDoneRef = useRef(false)
  const debouncedInputValue = useDebouncedValue(
    inputValue,
    suggestionsDebounceMs
  )

  useEffect(() => {
    if (activeSearchState.mode !== "animeSearch") {
      return
    }

    if (activeSearchState.animeSearchQuery === lastCommittedQueryRef.current) {
      return
    }

    lastCommittedQueryRef.current = activeSearchState.animeSearchQuery
    setInputValue(activeSearchState.animeSearchQuery)
  }, [activeSearchState.animeSearchQuery, activeSearchState.mode])

  const runSearch = useCallback(
    async ({
      page,
      query,
      reset,
    }: {
      page: number
      query: string
      reset: boolean
    }) => {
      const trimmedQuery = query.trim()

      if (!trimmedQuery) {
        setLookupState(null)
        return
      }

      const requestId = searchRequestIdRef.current + 1
      searchRequestIdRef.current = requestId
      setIsPending(true)

      try {
        const response = await searchFn({
          data: {
            page,
            query: trimmedQuery,
          },
        })

        if (searchRequestIdRef.current !== requestId) {
          return
        }

        setLookupState((previousState) => {
          if (!response.ok || reset || !previousState?.ok) {
            return response
          }

          return {
            ...response,
            results: [...previousState.results, ...response.results],
          }
        })
      } catch (error) {
        console.error("Anime title search failed", error)

        if (searchRequestIdRef.current !== requestId) {
          return
        }

        setLookupState({
          ok: false,
          code: "UPSTREAM_ERROR",
          message: "Anime title search failed.",
        })
      } finally {
        if (searchRequestIdRef.current === requestId) {
          setIsPending(false)
        }
      }
    },
    [searchFn]
  )

  useEffect(() => {
    if (initialAutoSearchDoneRef.current) {
      return
    }

    initialAutoSearchDoneRef.current = true

    if (
      activeSearchState.mode === "animeSearch" &&
      activeSearchState.animeSearchQuery.trim()
    ) {
      void runSearch({
        page: 1,
        query: activeSearchState.animeSearchQuery,
        reset: true,
      })
    }
  }, [activeSearchState.animeSearchQuery, activeSearchState.mode, runSearch])

  useEffect(() => {
    if (
      activeSearchState.mode !== "animeSearch" ||
      debouncedInputValue.trim().length < 2
    ) {
      setSuggestions([])
      setIsSuggestionsOpen(false)
      return
    }

    const requestId = suggestionRequestIdRef.current + 1
    suggestionRequestIdRef.current = requestId

    void suggestFn({
      data: {
        query: debouncedInputValue,
      },
    })
      .then((nextSuggestions) => {
        if (suggestionRequestIdRef.current !== requestId) {
          return
        }

        setSuggestions(nextSuggestions)
        setIsSuggestionsOpen(nextSuggestions.length > 0)
      })
      .catch((error) => {
        console.error("Anime title suggestions failed", error)

        if (suggestionRequestIdRef.current !== requestId) {
          return
        }

        setSuggestions([])
        setIsSuggestionsOpen(false)
      })
  }, [activeSearchState.mode, debouncedInputValue, suggestFn])

  const handleSubmit = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault()
      const trimmedQuery = inputValue.trim()

      if (!trimmedQuery) {
        return
      }

      lastCommittedQueryRef.current = trimmedQuery
      updateSearchState((previousState) => ({
        ...previousState,
        animeSearchQuery: trimmedQuery,
        mode: "animeSearch",
      }))
      setSuggestions([])
      setIsSuggestionsOpen(false)

      await runSearch({
        page: 1,
        query: trimmedQuery,
        reset: true,
      })
    },
    [inputValue, runSearch, updateSearchState]
  )

  const handleSuggestionSelect = useCallback(
    async (suggestion: AnimeSearchSuggestion) => {
      const title =
        suggestion.title.primary ??
        suggestion.title.english ??
        suggestion.title.native ??
        ""

      setInputValue(title)
      lastCommittedQueryRef.current = title
      updateSearchState((previousState) => ({
        ...previousState,
        animeSearchQuery: title,
        mode: "animeSearch",
      }))
      setSuggestions([])
      setIsSuggestionsOpen(false)

      await runSearch({
        page: 1,
        query: title,
        reset: true,
      })
    },
    [runSearch, updateSearchState]
  )

  const loadNextPage = useCallback(async () => {
    if (!lookupState?.ok || !lookupState.pageInfo?.hasNextPage || isPending) {
      return
    }

    await runSearch({
      page: lookupState.pageInfo.currentPage + 1,
      query: activeSearchState.animeSearchQuery || inputValue,
      reset: false,
    })
  }, [
    activeSearchState.animeSearchQuery,
    inputValue,
    isPending,
    lookupState,
    runSearch,
  ])

  const visibleResults = useMemo(
    () => (lookupState?.ok ? lookupState.results : []),
    [lookupState]
  )

  return {
    handleSubmit,
    handleSuggestionSelect,
    hasResultsState: lookupState?.ok === true,
    inputValue,
    isPending,
    isSuggestionsOpen,
    loadNextPage,
    lookupState,
    searchState: activeSearchState,
    setInputValue,
    setIsSuggestionsOpen,
    suggestions,
    updateSearchState,
    visibleResults,
  }
}
