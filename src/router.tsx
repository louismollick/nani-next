import {
  createRouter as createTanStackRouter,
  defaultStringifySearch,
} from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

function lowercaseSearchParamValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.toLowerCase()
  }

  if (Array.isArray(value)) {
    return value.map((item) => lowercaseSearchParamValue(item))
  }

  return value
}

function stringifySearch(search: Record<string, unknown>) {
  return defaultStringifySearch({
    ...search,
    selectedStatuses: lowercaseSearchParamValue(search.selectedStatuses),
    selectedMediaStatuses: lowercaseSearchParamValue(
      search.selectedMediaStatuses
    ),
    selectedSubtitleAvailability: lowercaseSearchParamValue(
      search.selectedSubtitleAvailability
    ),
    selectedGenres: lowercaseSearchParamValue(search.selectedGenres),
    difficultyFilterMode: lowercaseSearchParamValue(
      search.difficultyFilterMode
    ),
    sortBy: lowercaseSearchParamValue(search.sortBy),
    sortDirection: lowercaseSearchParamValue(search.sortDirection),
  })
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,

    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    stringifySearch,
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
