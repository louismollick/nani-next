import { describe, expect, it } from "vitest"
import { defaultLookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import { deriveAnimeListFacets } from "@/features/anime-list/lib/derive-anime-list-facets"
import { filterAnimeListResults } from "@/features/anime-list/lib/filter-anime-list-results"
import { sortAnimeListResults } from "@/features/anime-list/lib/sort-anime-list-results"
import { successResponse } from "@/features/anime-list/tests/test-data"

describe("filter-anime-list-results", () => {
  it("filters by title and genre intersection", () => {
    const response = successResponse()
    if (!response.ok) throw new Error("expected success response")
    const facets = deriveAnimeListFacets(response)

    expect(
      filterAnimeListResults(
        response.results,
        {
          ...defaultLookupSearchState,
          selectedGenres: ["drama", "mystery"],
          titleQuery: "apothecary",
        },
        facets
      ).map((result) => result.entry.id)
    ).toEqual([3])
  })

  it("filters by subtitle availability and difficulty", () => {
    const response = successResponse()
    if (!response.ok) throw new Error("expected success response")
    const facets = deriveAnimeListFacets(response)

    expect(
      filterAnimeListResults(
        response.results,
        {
          ...defaultLookupSearchState,
          difficultyFilterMode: "jpdbAverageDifficulty",
          jpdbDifficultyRange: [20, 30],
          selectedStatuses: ["CURRENT", "PLANNING", "PAUSED"],
          selectedSubtitleAvailability: ["all"],
        },
        facets
      ).map((result) => result.entry.id)
    ).toEqual([1])
  })

  it("filters by displayed Jiten difficulty", () => {
    const response = successResponse()
    if (!response.ok) throw new Error("expected success response")
    const facets = deriveAnimeListFacets(response)

    expect(
      filterAnimeListResults(
        response.results,
        {
          ...defaultLookupSearchState,
          difficultyFilterMode: "jitenDifficulty",
          jitenDifficultyRange: [2.7, 2.7],
          selectedStatuses: ["CURRENT"],
        },
        facets
      ).map((result) => result.entry.id)
    ).toEqual([1])
  })

  it("filters list mode by format and metadata ranges", () => {
    const response = successResponse()
    if (!response.ok) throw new Error("expected success response")
    const facets = deriveAnimeListFacets(response)

    expect(
      filterAnimeListResults(
        response.results,
        {
          ...defaultLookupSearchState,
          selectedFormats: ["MOVIE"],
          yearRange: [2024, 2024],
          episodeRange: [0, 150],
          durationRange: [90, 180],
        },
        facets
      ).map((result) => result.entry.id)
    ).toEqual([2])
  })

  it("does not locally re-apply metadata filters in global browse mode", () => {
    const response = successResponse()
    if (!response.ok) throw new Error("expected success response")
    const facets = deriveAnimeListFacets(response)

    expect(
      filterAnimeListResults(
        response.results,
        {
          ...defaultLookupSearchState,
          myAnimeFilterMode: "showAll",
          selectedFormats: ["MOVIE"],
          yearRange: [2024, 2024],
          episodeRange: [0, 150],
          durationRange: [90, 180],
          selectedStatuses: ["CURRENT", "PLANNING", "PAUSED"],
        },
        facets
      ).map((result) => result.entry.id)
    ).toEqual([1, 2, 3])
  })
})

describe("Jiten difficulty sorting", () => {
  it("uses displayed precision and puts missing ratings last", () => {
    const response = successResponse()
    if (!response.ok) throw new Error("expected success response")
    const rated = response.results[0]
    const unrated = response.results[1]
    const harder = {
      ...response.results[2],
      matchedJiten: {
        entry: {
          ...rated.matchedJiten?.entry,
          deckId: 999,
          jitenUrl: "https://jiten.moe/decks/media/999/detail",
          titles: ["Harder"],
          anilistId: 999,
          myanimelistId: null,
          difficultyRaw: 3.14,
        },
        matchScore: 1,
        matchReason: "anilist-id" as const,
      },
    }

    expect(
      sortAnimeListResults(
        [rated, unrated, harder],
        "jitenDifficulty",
        "desc"
      ).map((result) => result.entry.id)
    ).toEqual([harder.entry.id, rated.entry.id, unrated.entry.id])

    expect(
      sortAnimeListResults(
        [unrated, harder, rated],
        "jitenDifficulty",
        "asc"
      ).map((result) => result.entry.id)
    ).toEqual([rated.entry.id, harder.entry.id, unrated.entry.id])
  })
})
