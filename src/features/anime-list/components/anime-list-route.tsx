import { useRef } from "react"
import { AnimeListPage } from "@/features/anime-list/components/anime-list-page"
import {
  type AnimeListLookup,
  useAnimeListController,
} from "@/features/anime-list/hooks/use-anime-list-controller"
import { useAnimeSearchController } from "@/features/anime-list/hooks/use-anime-search-controller"
import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import { getLookupIdentity } from "@/features/anime-list/lib/anime-list-search-state-identity"
import { UpNextQueueProvider } from "@/features/up-next/hooks/use-up-next-queue"

export function AnimeListRoute({
  lookup,
  onSearchStateChange,
  searchState,
}: {
  lookup: AnimeListLookup
  onSearchStateChange: (
    updater: (previousState: LookupSearchState) => LookupSearchState
  ) => void
  searchState: LookupSearchState
}) {
  const initialAutoLookupIdentity = useRef(
    searchState.mode === "userList" && searchState.username.trim()
      ? getLookupIdentity(searchState)
      : null
  )
  const userListController = useAnimeListController({
    autoLookupIdentity: initialAutoLookupIdentity.current,
    lookup,
    onSearchStateChange,
    searchState,
  })
  const animeSearchController = useAnimeSearchController({
    onSearchStateChange,
    searchState,
  })

  return (
    <UpNextQueueProvider>
      <AnimeListPage
        animeSearchController={animeSearchController}
        userListController={userListController}
      />
    </UpNextQueueProvider>
  )
}
