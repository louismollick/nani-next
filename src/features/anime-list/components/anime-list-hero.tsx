import { AnimeListLookupStatus } from "@/features/anime-list/components/anime-list-lookup-status"
import { AnimeListSearchForm } from "@/features/anime-list/components/anime-list-search-form"
import type { AnimeListController } from "@/features/anime-list/hooks/use-anime-list-controller"
import type { AnimeSearchController } from "@/features/anime-list/hooks/use-anime-search-controller"
import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import { cn } from "@/lib/utils"

export function AnimeListHero({
  animeSearchController,
  hasResultsState,
  isPending,
  lookupState,
  searchState,
  updateSearchState,
  userListController,
}: {
  animeSearchController: AnimeSearchController
  hasResultsState: boolean
  isPending: boolean
  lookupState: {
    ok: boolean
    code?: string
    fetchedAt?: string
    message?: string
    totalAnime?: number
    userListAnimeCount?: number
    browseMeta?: {
      isGlobalBrowse: boolean
    }
  } | null
  searchState: LookupSearchState
  updateSearchState: (
    updater: (previousState: LookupSearchState) => LookupSearchState
  ) => void
  userListController: AnimeListController
}) {
  const isAnimeSearchMode = searchState.mode === "animeSearch"

  return (
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
          hasResultsState ? "items-center gap-4" : "mb-6 items-center gap-0"
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
        {isAnimeSearchMode
          ? "Search anime by title"
          : "Find your next anime to study Japanese"}
      </p>
      <AnimeListSearchForm
        animeSearchController={animeSearchController}
        isPending={isPending}
        searchState={searchState}
        updateSearchState={updateSearchState}
        userListController={userListController}
      />
      <AnimeListLookupStatus lookupState={lookupState} />
    </div>
  )
}
