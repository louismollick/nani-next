import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { AnimeOverlapPage } from "@/components/anime-overlap-page"
import {
  defaultLookupSearchState,
  type LookupSearchState,
} from "@/lib/search-state"
import type { LookupResponse } from "@/lib/types"

function successResponse(): LookupResponse {
  return {
    ok: true,
    source: "anilist",
    username: "mollicl",
    fetchedAt: "2026-06-02T22:14:00.000Z",
    totalAnime: 4,
    matchedCount: 4,
    results: [
      {
        entry: {
          source: "anilist",
          id: 1,
          status: "CURRENT",
          score: 70,
          progress: 3,
          media: {
            id: 11,
            anilistId: 11,
            myanimelistId: 111,
            episodes: 12,
            releasedEpisodes: 12,
            averageScore: 88,
            popularity: 15000,
            status: "FINISHED",
            genres: ["Romance", "Sports"],
            format: "TV",
            siteUrl: "https://anilist.co/anime/11",
            synonyms: [],
            coverImage: {
              large: "https://example.com/one.jpg",
              color: "#4f8dfc",
            },
            title: {
              primary: "Blue Box",
              english: "Blue Box",
              native: "アオのハコ",
            },
          },
        },
        matchedJimaku: {
          id: 101,
          anilistId: 11,
          myanimelistId: 111,
          url: "https://jimaku.cc/entry/101",
          name: "Blue Box",
          englishName: "Blue Box",
          japaneseName: "アオのハコ",
          fileCount: 12,
          flags: 1,
          updatedAt: null,
          titles: ["Blue Box"],
          normalizedTitles: ["blue box"],
        },
        alternates: [],
        matchScore: 1,
        matchReason: "anilist-id",
        isAmbiguous: false,
        completeness: "complete",
        matchedJpdb: {
          entry: {
            name: "Blue Box",
            jpdbUrl: "https://jpdb.io/anime/11/blue-box",
            lengthInWords: 12000,
            uniqueWords: 1800,
            uniqueWordsUsedOnce: 700,
            uniqueWordsUsedOncePercent: 39,
            uniqueKanji: 650,
            uniqueKanjiUsedOnce: 180,
            uniqueKanjiReadings: 920,
            averageDifficulty: 25,
            peakDifficulty90thPercentile: 32,
          },
          matchScore: 0.98,
          matchReason: "exact-title",
        },
        matchedLearnNatively: {
          entry: {
            learnnativelyUrl: "https://learnnatively.com/season/blue-box/",
            name: "Blue Box",
            level: "L12",
          },
          matchScore: 0.98,
          matchReason: "exact-title",
          jlptEquivalent: "N4",
          levelNumber: 12,
        },
      },
      {
        entry: {
          source: "anilist",
          id: 2,
          status: "PLANNING",
          score: 60,
          progress: 0,
          media: {
            id: 12,
            anilistId: 12,
            myanimelistId: 112,
            episodes: 24,
            releasedEpisodes: 24,
            averageScore: 90,
            popularity: 45000,
            status: "FINISHED",
            genres: ["Drama", "Historical"],
            format: "TV",
            siteUrl: "https://anilist.co/anime/12",
            synonyms: [],
            coverImage: {
              large: "https://example.com/two.jpg",
              color: "#edb63f",
            },
            title: {
              primary: "Orb",
              english: "Orb",
              native: "チ。",
            },
          },
        },
        matchedJimaku: {
          id: 102,
          anilistId: 12,
          myanimelistId: 112,
          url: "https://jimaku.cc/entry/102",
          name: "Orb",
          englishName: "Orb",
          japaneseName: "チ。",
          fileCount: 18,
          flags: 1,
          updatedAt: null,
          titles: ["Orb"],
          normalizedTitles: ["orb"],
        },
        alternates: [],
        matchScore: 1,
        matchReason: "anilist-id",
        isAmbiguous: false,
        completeness: "incomplete",
        matchedJpdb: {
          entry: {
            name: "Orb",
            jpdbUrl: "https://jpdb.io/anime/12/orb",
            lengthInWords: 30000,
            uniqueWords: 4000,
            uniqueWordsUsedOnce: 1600,
            uniqueWordsUsedOncePercent: 40,
            uniqueKanji: 1200,
            uniqueKanjiUsedOnce: 350,
            uniqueKanjiReadings: 1750,
            averageDifficulty: 35,
            peakDifficulty90thPercentile: 96,
          },
          matchScore: 0.98,
          matchReason: "exact-title",
        },
        matchedLearnNatively: {
          entry: {
            learnnativelyUrl: "https://learnnatively.com/season/orb/",
            name: "Orb",
            level: "L18",
          },
          matchScore: 0.98,
          matchReason: "exact-title",
          jlptEquivalent: "N3",
          levelNumber: 18,
        },
      },
      {
        entry: {
          source: "anilist",
          id: 3,
          status: "PLANNING",
          score: 88,
          progress: 0,
          media: {
            id: 13,
            anilistId: 13,
            myanimelistId: 113,
            episodes: 24,
            releasedEpisodes: 24,
            averageScore: 95,
            popularity: 55000,
            status: "FINISHED",
            genres: ["Drama", "Mystery"],
            format: "TV",
            siteUrl: "https://anilist.co/anime/13",
            synonyms: [],
            coverImage: {
              large: "https://example.com/three.jpg",
              color: "#77bc9f",
            },
            title: {
              primary: "The Apothecary Diaries",
              english: "The Apothecary Diaries",
              native: "薬屋のひとりごと",
            },
          },
        },
        matchedJimaku: {
          id: 103,
          anilistId: 13,
          myanimelistId: 113,
          url: "https://jimaku.cc/entry/103",
          name: "The Apothecary Diaries",
          englishName: "The Apothecary Diaries",
          japaneseName: "薬屋のひとりごと",
          fileCount: 24,
          flags: 1,
          updatedAt: null,
          titles: ["The Apothecary Diaries"],
          normalizedTitles: ["the apothecary diaries"],
        },
        alternates: [],
        matchScore: 1,
        matchReason: "anilist-id",
        isAmbiguous: false,
        completeness: "complete",
        matchedJpdb: {
          entry: {
            name: "The Apothecary Diaries",
            jpdbUrl: "https://jpdb.io/anime/13/the-apothecary-diaries",
            lengthInWords: 28000,
            uniqueWords: 3200,
            uniqueWordsUsedOnce: 1300,
            uniqueWordsUsedOncePercent: 41,
            uniqueKanji: 1100,
            uniqueKanjiUsedOnce: 300,
            uniqueKanjiReadings: 1600,
            averageDifficulty: 80,
            peakDifficulty90thPercentile: 95,
          },
          matchScore: 0.98,
          matchReason: "exact-title",
        },
        matchedLearnNatively: {
          entry: {
            learnnativelyUrl:
              "https://learnnatively.com/season/the-apothecary-diaries/",
            name: "The Apothecary Diaries",
            level: "L40",
          },
          matchScore: 0.98,
          matchReason: "exact-title",
          jlptEquivalent: "N1",
          levelNumber: 40,
        },
      },
      {
        entry: {
          source: "anilist",
          id: 4,
          status: "PAUSED",
          score: 82,
          progress: 6,
          media: {
            id: 14,
            anilistId: null,
            myanimelistId: null,
            episodes: 12,
            releasedEpisodes: null,
            averageScore: 84,
            popularity: 70000,
            status: "RELEASING",
            genres: ["Comedy", "Supernatural"],
            format: "TV",
            siteUrl: "https://anilist.co/anime/14",
            synonyms: [],
            coverImage: {
              large: "https://example.com/four.jpg",
              color: "#d15454",
            },
            title: {
              primary: "Dandadan",
              english: "Dandadan",
              native: "ダンダダン",
            },
          },
        },
        matchedJimaku: {
          id: 104,
          anilistId: null,
          myanimelistId: null,
          url: "https://jimaku.cc/entry/104",
          name: "Dandadan",
          englishName: "Dandadan",
          japaneseName: "ダンダダン",
          fileCount: 12,
          flags: 1,
          updatedAt: null,
          titles: ["Dandadan"],
          normalizedTitles: ["dandadan"],
        },
        alternates: [
          {
            jimakuEntry: {
              id: 105,
              anilistId: null,
              myanimelistId: null,
              url: "https://jimaku.cc/entry/105",
              name: "Dandadan TV",
              englishName: null,
              japaneseName: null,
              fileCount: 11,
              flags: 1,
              updatedAt: null,
              titles: ["Dandadan TV"],
              normalizedTitles: ["dandadan tv"],
            },
            score: 0.91,
            reason: "fuzzy",
          },
        ],
        matchScore: 0.93,
        matchReason: "fuzzy",
        isAmbiguous: true,
        completeness: "unknown",
        matchedJpdb: {
          entry: {
            name: "Dandadan",
            jpdbUrl: "https://jpdb.io/anime/14/dandadan",
            lengthInWords: 18000,
            uniqueWords: 2100,
            uniqueWordsUsedOnce: 860,
            uniqueWordsUsedOncePercent: 41,
            uniqueKanji: 720,
            uniqueKanjiUsedOnce: 205,
            uniqueKanjiReadings: 980,
            averageDifficulty: 10,
            peakDifficulty90thPercentile: 30,
          },
          matchScore: 0.93,
          matchReason: "fuzzy",
        },
        matchedLearnNatively: {
          entry: {
            learnnativelyUrl: "https://learnnatively.com/season/dandadan/",
            name: "Dandadan",
            level: "L0",
          },
          matchScore: 0.93,
          matchReason: "fuzzy",
          jlptEquivalent: "N5",
          levelNumber: 0,
        },
      },
      {
        entry: {
          source: "anilist",
          id: 5,
          status: "PLANNING",
          score: null,
          progress: 0,
          media: {
            id: 15,
            anilistId: 15,
            myanimelistId: 115,
            episodes: 12,
            releasedEpisodes: 12,
            averageScore: 65,
            popularity: 5000,
            status: "FINISHED",
            genres: ["Sci-Fi"],
            format: "TV",
            siteUrl: "https://anilist.co/anime/15",
            synonyms: [],
            coverImage: {
              large: "https://example.com/five.jpg",
              color: "#8b8fe6",
            },
            title: {
              primary: "Empty Sub Show",
              english: "Empty Sub Show",
              native: "字幕なし",
            },
          },
        },
        matchedJimaku: {
          id: 106,
          anilistId: 15,
          myanimelistId: 115,
          url: "https://jimaku.cc/entry/106",
          name: "Empty Sub Show",
          englishName: "Empty Sub Show",
          japaneseName: "字幕なし",
          fileCount: 0,
          flags: 1,
          updatedAt: null,
          titles: ["Empty Sub Show"],
          normalizedTitles: ["empty sub show"],
        },
        alternates: [],
        matchScore: 1,
        matchReason: "anilist-id",
        isAmbiguous: false,
        completeness: "incomplete",
      },
    ],
  }
}

async function selectComboboxOption(comboboxName: string, optionLabel: string) {
  const combobox = await screen.findByRole("combobox", { name: comboboxName })
  fireEvent.click(combobox)
  fireEvent.click(await screen.findByText(optionLabel))
  fireEvent.click(combobox)
}

async function selectDropdownOption(selectName: string, optionLabel: string) {
  fireEvent.click(await screen.findByRole("combobox", { name: selectName }))
  fireEvent.click(await screen.findByRole("option", { name: optionLabel }))
}

function nudgeSlider(slider: HTMLElement, key: string, count = 1) {
  slider.focus()

  for (let index = 0; index < count; index += 1) {
    fireEvent.keyDown(slider, { key })
  }
}

async function loadResults() {
  const lookup = vi.fn().mockResolvedValue(successResponse())
  render(<AnimeOverlapPage lookup={lookup} />)

  fireEvent.change(screen.getByPlaceholderText("Enter username"), {
    target: { value: "mollicl" },
  })
  fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

  await screen.findByText("Filters")
  return lookup
}

describe("AnimeOverlapPage", () => {
  it("uses the new default filters and default sort order", async () => {
    await loadResults()

    expect(screen.queryByText("Blue Box")).not.toBeInTheDocument()
    expect(screen.queryByText("Orb")).not.toBeInTheDocument()
    expect(screen.queryByText("Empty Sub Show")).not.toBeInTheDocument()
    expect(
      screen
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent?.trim())
    ).toEqual(["The Apothecary Diaries"])

    await selectDropdownOption("Sort by", "Popularity")

    await waitFor(() => {
      expect(
        screen
          .getAllByRole("heading", { level: 3 })
          .map((heading) => heading.textContent?.trim())
      ).toEqual(["The Apothecary Diaries"])
    })
  })

  it("renders japanese subtitle availability before watch status", async () => {
    await loadResults()

    const subtitleLabel = screen.getByText("Japanese subtitle availability")
    const watchStatusLabel = screen.getByText("Watch status")

    expect(
      subtitleLabel.compareDocumentPosition(watchStatusLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("shows AniList cache details in a tooltip", async () => {
    const dateNowSpy = vi
      .spyOn(Date, "now")
      .mockReturnValue(new Date("2026-06-02T22:26:00.000Z").getTime())

    await loadResults()

    const freshnessTrigger = await screen.findByRole("button", {
      name: "Fetch details",
    })

    expect(screen.getByText("fetched 12 minutes ago")).toBeInTheDocument()

    fireEvent.focus(freshnessTrigger)

    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip.textContent).toContain("Fetched ")
    expect(tooltip.textContent).toContain(
      "Lookups are cached per user for 1 hour."
    )

    dateNowSpy.mockRestore()
  })

  it("does not write full difficulty bounds back into search state after lookup", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    const searchStateUpdates: LookupSearchState[] = []

    function ControlledPage() {
      const [searchState, setSearchState] = useState<LookupSearchState>({
        ...defaultLookupSearchState,
        username: "mollicl",
      })

      return (
        <AnimeOverlapPage
          lookup={lookup}
          onSearchStateChange={(updater) =>
            setSearchState((previousState) => {
              const nextState = updater(previousState)
              searchStateUpdates.push(nextState)
              return nextState
            })
          }
          searchState={searchState}
        />
      )
    }

    render(<ControlledPage />)
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("4 matches")

    expect(searchStateUpdates.length).toBeGreaterThan(0)
    expect(
      searchStateUpdates.every(
        (state) =>
          state.jpdbDifficultyRange === null &&
          state.learnNativelyLevelRange === null &&
          state.learnNativelyJlptRange === null
      )
    ).toBe(true)
  })

  it("filters by airing status and genre", async () => {
    await loadResults()

    await screen.findByText("Airing status")
    await selectComboboxOption(
      "Japanese subtitle availability",
      "Some episodes subtitled"
    )

    await selectComboboxOption("Airing status", "Finished")
    await waitFor(() => {
      expect(
        screen.queryByText("The Apothecary Diaries")
      ).not.toBeInTheDocument()
    })
    expect(screen.getAllByText("Dandadan").length).toBeGreaterThan(0)

    await selectComboboxOption("Genres", "Comedy")
    await waitFor(() => {
      expect(screen.queryByText("Blue Box")).not.toBeInTheDocument()
    })
    expect(screen.getAllByText("Dandadan").length).toBeGreaterThan(0)
  })

  it("does not expose not yet released as an airing status filter", async () => {
    await loadResults()

    await screen.findByText("Airing status")

    fireEvent.click(screen.getByRole("combobox", { name: "Airing status" }))

    expect(screen.queryByText("Not Yet Released")).not.toBeInTheDocument()
  })

  it("filters by japanese subtitle availability", async () => {
    await loadResults()

    expect(screen.queryByText("Orb")).not.toBeInTheDocument()
    expect(screen.queryByText("Dandadan")).not.toBeInTheDocument()
    expect(screen.queryByText("Empty Sub Show")).not.toBeInTheDocument()

    await selectComboboxOption(
      "Japanese subtitle availability",
      "Some episodes subtitled"
    )

    await waitFor(() => {
      expect(screen.getAllByText("Orb").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Dandadan").length).toBeGreaterThan(0)
    })

    await selectComboboxOption(
      "Japanese subtitle availability",
      "No episodes subtitled"
    )

    await waitFor(() => {
      expect(screen.getAllByText("Empty Sub Show").length).toBeGreaterThan(0)
    })
  })

  it("shows upstream errors clearly", async () => {
    const lookup = vi.fn().mockResolvedValue({
      ok: false,
      code: "PRIVATE_OR_UNAVAILABLE",
      message: "That AniList anime list is private or unavailable.",
    } satisfies LookupResponse)

    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getAllByPlaceholderText("Enter username")[0], {
      target: { value: "secret-user" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    expect(
      await screen.findByText(/private or unavailable/i)
    ).toBeInTheDocument()
  })

  it("shows alternate matches in the detail dialog without low-confidence UI", async () => {
    await loadResults()
    await selectComboboxOption(
      "Japanese subtitle availability",
      "Some episodes subtitled"
    )

    fireEvent.click((await screen.findAllByText("Dandadan"))[0])

    expect(
      await screen.findByText("Alternate Jimaku candidates")
    ).toBeInTheDocument()
    expect(screen.getByText("Dandadan TV")).toBeInTheDocument()
    expect(screen.queryByText("Low confidence")).not.toBeInTheDocument()
  })

  it("renders difficulty badges and modal metadata", async () => {
    await loadResults()

    expect(screen.getAllByText("80/100").length).toBeGreaterThan(0)
    expect(screen.getAllByText("N1").length).toBeGreaterThan(0)

    fireEvent.click((await screen.findAllByText("The Apothecary Diaries"))[0])

    expect(
      await screen.findByText(/average difficulty 80\/100/i)
    ).toBeInTheDocument()
    expect(screen.getByText("Peak difficulty")).toBeInTheDocument()
    expect(screen.getByText("Exact level")).toBeInTheDocument()
    expect(screen.getByText("L40")).toBeInTheDocument()
  })

  it("filters by JPDB difficulty range and excludes higher-difficulty results", async () => {
    await loadResults()
    await selectComboboxOption(
      "Japanese subtitle availability",
      "Some episodes subtitled"
    )

    await selectDropdownOption("Difficulty filter", "JPDB Average Difficulty")

    const sliders = await screen.findAllByRole("slider")
    nudgeSlider(sliders[1], "ArrowLeft")

    await waitFor(() => {
      expect(
        screen.queryByText("The Apothecary Diaries")
      ).not.toBeInTheDocument()
    })
    expect(screen.getAllByText("Dandadan").length).toBeGreaterThan(0)
  })

  it("filters by LearnNatively level range", async () => {
    await loadResults()

    await selectDropdownOption("Difficulty filter", "LearnNatively Level")

    const sliders = await screen.findAllByRole("slider")
    nudgeSlider(sliders[0], "ArrowRight")

    await waitFor(() => {
      expect(screen.queryByText("Dandadan")).not.toBeInTheDocument()
    })
    expect(
      screen.getAllByText("The Apothecary Diaries").length
    ).toBeGreaterThan(0)
  })

  it("filters by LearnNatively JLPT equivalent range", async () => {
    await loadResults()

    await selectDropdownOption(
      "Difficulty filter",
      "LearnNatively JLPT Equivalent"
    )

    const sliders = await screen.findAllByRole("slider")
    nudgeSlider(sliders[0], "ArrowRight")

    await waitFor(() => {
      expect(screen.queryByText("Dandadan")).not.toBeInTheDocument()
    })
    expect(
      screen.getAllByText("The Apothecary Diaries").length
    ).toBeGreaterThan(0)
  })
})
