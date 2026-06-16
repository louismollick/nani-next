import { ArrowRight, LoaderCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimeSearchSuggestions } from "@/features/anime-list/components/anime-search-suggestions"
import { SearchSourceSelect } from "@/features/anime-list/components/search-source-select"
import type { AnimeListController } from "@/features/anime-list/hooks/use-anime-list-controller"
import type { AnimeSearchController } from "@/features/anime-list/hooks/use-anime-search-controller"
import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"

export function AnimeListSearchForm({
  animeSearchController,
  isPending,
  searchState,
  updateSearchState,
  userListController,
}: {
  animeSearchController: AnimeSearchController
  isPending: boolean
  searchState: LookupSearchState
  updateSearchState: (
    updater: (previousState: LookupSearchState) => LookupSearchState
  ) => void
  userListController: AnimeListController
}) {
  const isAnimeSearchMode = searchState.mode === "animeSearch"

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      <Tabs
        onValueChange={(value) =>
          updateSearchState((previousState) => ({
            ...previousState,
            mode: value === "animeSearch" ? "animeSearch" : "userList",
          }))
        }
        value={searchState.mode}
      >
        <TabsList aria-label="Search mode" className="grid w-full grid-cols-2">
          <TabsTrigger value="userList">User list</TabsTrigger>
          <TabsTrigger value="animeSearch">Anime search</TabsTrigger>
        </TabsList>
      </Tabs>
      <form
        className="flex w-full flex-col gap-3 sm:flex-row"
        onSubmit={(event) =>
          isAnimeSearchMode
            ? animeSearchController.handleSubmit(event)
            : userListController.handleSubmit(event)
        }
      >
        {!isAnimeSearchMode ? (
          <SearchSourceSelect
            searchState={searchState}
            updateSearchState={updateSearchState}
          />
        ) : null}
        <div className="flex w-full gap-3 sm:contents">
          <SearchInput
            animeSearchController={animeSearchController}
            isAnimeSearchMode={isAnimeSearchMode}
            isPending={isPending}
            searchState={searchState}
            updateSearchState={updateSearchState}
          />
          <SubmitButton
            isAnimeSearchMode={isAnimeSearchMode}
            isPending={isPending}
          />
        </div>
      </form>
    </div>
  )
}

function SearchInput({
  animeSearchController,
  isAnimeSearchMode,
  isPending,
  searchState,
  updateSearchState,
}: {
  animeSearchController: AnimeSearchController
  isAnimeSearchMode: boolean
  isPending: boolean
  searchState: LookupSearchState
  updateSearchState: (
    updater: (previousState: LookupSearchState) => LookupSearchState
  ) => void
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-12 pl-11 text-base"
        onBlur={() => {
          window.setTimeout(
            () => animeSearchController.setIsSuggestionsOpen(false),
            120
          )
        }}
        onChange={(event) => {
          if (isAnimeSearchMode) {
            animeSearchController.setInputValue(event.target.value)
            return
          }

          updateSearchState((previousState) => ({
            ...previousState,
            username: event.target.value,
          }))
        }}
        onFocus={() => {
          if (
            isAnimeSearchMode &&
            animeSearchController.suggestions.length > 0
          ) {
            animeSearchController.setIsSuggestionsOpen(true)
          }
        }}
        placeholder={
          isAnimeSearchMode ? "Search anime title" : "Enter username"
        }
        value={
          isAnimeSearchMode
            ? animeSearchController.inputValue
            : searchState.username
        }
      />
      <AnimeSearchSuggestions
        isOpen={isAnimeSearchMode && animeSearchController.isSuggestionsOpen}
        isPending={isPending}
        onSelect={animeSearchController.handleSuggestionSelect}
        suggestions={animeSearchController.suggestions}
      />
    </div>
  )
}

function SubmitButton({
  isAnimeSearchMode,
  isPending,
}: {
  isAnimeSearchMode: boolean
  isPending: boolean
}) {
  return (
    <Button
      aria-label={
        isPending
          ? undefined
          : isAnimeSearchMode
            ? "Search anime"
            : "Find overlap"
      }
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
  )
}
