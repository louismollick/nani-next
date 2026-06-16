import { TooltipProvider } from "@/components/ui/tooltip"
import { AnimeListFilters } from "@/features/anime-list/components/anime-list-filters"
import { AnimeListHero } from "@/features/anime-list/components/anime-list-hero"
import { AnimeListResults } from "@/features/anime-list/components/anime-list-results"
import type { AnimeListController } from "@/features/anime-list/hooks/use-anime-list-controller"
import type { AnimeSearchController } from "@/features/anime-list/hooks/use-anime-search-controller"
import { cn } from "@/lib/utils"

export function AnimeListPage({
  animeSearchController,
  userListController,
}: {
  animeSearchController: AnimeSearchController
  userListController: AnimeListController
}) {
  const activeController =
    userListController.searchState.mode === "animeSearch"
      ? animeSearchController
      : userListController
  const isAnimeSearchMode = activeController.searchState.mode === "animeSearch"
  const showAniListRetryStatus =
    !isAnimeSearchMode &&
    userListController.searchState.source === "anilist" &&
    userListController.lookupStatus.isRetrying

  return (
    <TooltipProvider>
      <main className="min-h-svh overflow-x-clip bg-[linear-gradient(180deg,_var(--background)_0%,_#0b1622_30%,_#0b1622_100%)] bg-fixed text-foreground">
        <section
          className={cn(
            "mx-auto flex min-h-svh w-full max-w-[1520px] flex-col px-4 py-8 sm:px-6 lg:px-8",
            activeController.hasResultsState ? "gap-8" : "justify-center"
          )}
        >
          <AnimeListHero
            animeSearchController={animeSearchController}
            hasResultsState={activeController.hasResultsState}
            isPending={activeController.isPending}
            lookupState={activeController.lookupState}
            searchState={activeController.searchState}
            updateSearchState={activeController.updateSearchState}
            userListController={userListController}
          />
          {activeController.hasResultsState || showAniListRetryStatus ? (
            <div
              className={cn(
                "animate-in fade-in fill-mode-both duration-500 ease-out",
                isAnimeSearchMode
                  ? "grid gap-6"
                  : "grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]"
              )}
            >
              {!isAnimeSearchMode && userListController.hasResultsState ? (
                <AnimeListFilters
                  activeDifficultyBounds={
                    userListController.activeDifficultyBounds
                  }
                  activeDifficultyRange={
                    userListController.activeDifficultyRange
                  }
                  availableGenres={userListController.facets.availableGenres}
                  searchState={userListController.searchState}
                  updateSearchState={userListController.updateSearchState}
                />
              ) : !isAnimeSearchMode ? (
                <div className="hidden lg:block" />
              ) : null}
              <AnimeListResults
                browseMeta={
                  activeController.lookupState?.ok
                    ? activeController.lookupState.browseMeta
                    : undefined
                }
                hasNextPage={
                  activeController.lookupState?.ok
                    ? activeController.lookupState.pageInfo?.hasNextPage ===
                      true
                    : false
                }
                isInfiniteResults={
                  isAnimeSearchMode || userListController.isGlobalAniListBrowse
                }
                isPending={activeController.isPending}
                isRetrying={showAniListRetryStatus}
                loadNextPage={activeController.loadNextPage}
                lookupStateOk={activeController.lookupState?.ok === true}
                retryMessage={
                  showAniListRetryStatus
                    ? userListController.lookupStatus.retryMessage
                    : null
                }
                results={activeController.visibleResults}
              />
            </div>
          ) : null}
        </section>
      </main>
    </TooltipProvider>
  )
}
