import { describe, expect, it } from "vitest"
import { defaultLookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import {
  buildAniListBrowseQueryInput,
  matchesDifficultyFilter,
  sortGlobalResults,
} from "@/features/anime-list/server/browse-anilist"
import { successResponse } from "@/features/anime-list/tests/test-data"

describe("buildAniListBrowseQueryInput", () => {
  it("maps bounded metadata filters to AniList query variables", () => {
    expect(
      buildAniListBrowseQueryInput({
        hiddenIds: [1, 2],
        page: 3,
        search: {
          ...defaultLookupSearchState,
          myAnimeFilterMode: "hideMine",
          selectedFormats: ["TV", "MOVIE"],
          yearRange: [1980, 2024],
          episodeRange: [12, 24],
          durationRange: [24, 90],
        },
      })
    ).toMatchObject({
      page: 3,
      perPage: 50,
      formatIn: ["TV", "MOVIE"],
      startDateGreater: 19800000,
      startDateLesser: 20250000,
      episodesGreater: 11,
      episodesLesser: 25,
      durationGreater: 23,
      durationLesser: 91,
      idNotIn: [1, 2],
    })
  })

  it("omits upper bounds for 150+ and 3h+", () => {
    const variables = buildAniListBrowseQueryInput({
      hiddenIds: [],
      page: 1,
      search: {
        ...defaultLookupSearchState,
        myAnimeFilterMode: "showAll",
        episodeRange: [0, 150],
        durationRange: [30, 180],
      },
    })

    expect(variables.durationGreater).toBe(29)
    expect(variables.episodesLesser).toBeUndefined()
    expect(variables.durationLesser).toBeUndefined()
  })
})

describe("Jiten browse sorting", () => {
  it("keeps missing ratings eligible and sorts them last", () => {
    const response = successResponse()
    if (!response.ok) throw new Error("expected success response")
    const rated = response.results[0]
    const unrated = response.results[1]
    const search = {
      ...defaultLookupSearchState,
      sortBy: "jitenDifficulty" as const,
      sortDirection: "desc" as const,
    }

    expect(matchesDifficultyFilter(unrated, search.sortBy)).toBe(true)
    expect(sortGlobalResults([unrated, rated], search)).toEqual([
      rated,
      unrated,
    ])
  })
})
