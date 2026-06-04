import { createFileRoute } from "@tanstack/react-router"
import { useRef } from "react"
import { AnimeOverlapPage } from "@/components/anime-overlap-page"
import {
  getLookupIdentity,
  hasLookupIdentity,
  type LookupSearchState,
  validateLookupSearch,
} from "@/lib/search-state"
import { lookupOverlap } from "@/lib/server-functions"

export const Route = createFileRoute("/")({
  validateSearch: validateLookupSearch,
  component: App,
})

function App() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const initialAutoLookupIdentity = useRef(
    hasLookupIdentity(search) ? getLookupIdentity(search) : null
  )

  return (
    <AnimeOverlapPage
      autoLookupIdentity={initialAutoLookupIdentity.current}
      lookup={lookupOverlap}
      onSearchStateChange={(updater) =>
        navigate({
          replace: true,
          search: (previousSearch) =>
            updater(previousSearch as LookupSearchState),
        })
      }
      searchState={search}
    />
  )
}
