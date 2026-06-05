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
      selectedGenres: ["comedy", "mystery"],
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

  it("coerces explicit empty multi-select filters back to defaults", () => {
    expect(
      validateLookupSearch({
        selectedStatuses: [],
        selectedMediaStatuses: [],
        selectedSubtitleAvailability: [],
      })
    ).toEqual({
      ...defaultLookupSearchState,
    })
  })

  it("accepts case-insensitive enum search values", () => {
    expect(
      validateLookupSearch({
        source: "MYANIMELIST",
        selectedStatuses: ["current", "Planning"],
        selectedMediaStatuses: ["releasing"],
        selectedSubtitleAvailability: ["SOME"],
        difficultyFilterMode: "learnnativelylevel",
        sortBy: "STATUS",
      })
    ).toEqual({
      ...defaultLookupSearchState,
      source: "myanimelist",
      selectedStatuses: ["CURRENT", "PLANNING"],
      selectedMediaStatuses: ["RELEASING"],
      selectedSubtitleAvailability: ["some"],
      difficultyFilterMode: "learnNativelyLevel",
      sortBy: "status",
    })
  })

  it("canonicalizes genres to lowercase", () => {
    expect(
      canonicalizeLookupSearch({
        ...defaultLookupSearchState,
        selectedGenres: ["Mystery", " comedy ", "mystery"],
      })
    ).toEqual({
      selectedGenres: ["comedy", "mystery"],
    })
  })
})
