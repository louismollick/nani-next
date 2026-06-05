import { describe, expect, it } from "vitest"
import {
  canonicalizeLookupSearch,
  defaultLookupSearchState,
  validateLookupSearch,
} from "@/lib/search-state"

describe("search-state", () => {
  it("uses the new defaults when search params are omitted", () => {
    expect(validateLookupSearch({})).toEqual(defaultLookupSearchState)
  })

  it("omits default-valued fields from canonical search output", () => {
    expect(canonicalizeLookupSearch(defaultLookupSearchState)).toEqual({})
  })

  it("keeps only non-default values in canonical search output", () => {
    expect(
      canonicalizeLookupSearch({
        ...defaultLookupSearchState,
        source: "myanimelist",
        username: "  Mollicl  ",
        titleQuery: "  apothecary!! ",
        selectedStatuses: ["CURRENT", "PLANNING"],
        selectedMediaStatuses: ["RELEASING"],
        selectedGenres: ["Mystery", "Comedy", "Mystery"],
        selectedSubtitleAvailability: ["all", "some"],
        difficultyFilterMode: "learnNativelyLevel",
        learnNativelyLevelRange: [3, 12],
        sortBy: "status",
      })
    ).toEqual({
      source: "myanimelist",
      username: "Mollicl",
      titleQuery: "apothecary!!",
      selectedStatuses: ["CURRENT", "PLANNING"],
      selectedMediaStatuses: ["RELEASING"],
      selectedGenres: ["Comedy", "Mystery"],
      selectedSubtitleAvailability: ["all", "some"],
      difficultyFilterMode: "learnNativelyLevel",
      learnNativelyLevelRange: [3, 12],
      sortBy: "status",
    })
  })

  it("sanitizes invalid subtitle availability search values", () => {
    expect(
      validateLookupSearch({
        selectedSubtitleAvailability: ["nope", "some"],
      })
    ).toEqual({
      ...defaultLookupSearchState,
      selectedSubtitleAvailability: ["some"],
    })
  })
})
