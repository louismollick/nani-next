import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AnimeOverlapPage } from "@/components/anime-overlap-page"
import type { LookupResponse } from "@/lib/types"

function successResponse(): LookupResponse {
  return {
    ok: true,
    source: "anilist",
    username: "mollicl",
    fetchedAt: "2026-06-02T22:14:00.000Z",
    totalAnime: 3,
    matchedCount: 3,
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
        isLowConfidence: false,
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
            averageDifficulty: 10,
            peakDifficulty90thPercentile: 32,
          },
          matchScore: 0.98,
          matchReason: "exact-title",
          isLowConfidence: false,
        },
        matchedLearnNatively: {
          entry: {
            learnnativelyUrl: "https://learnnatively.com/season/blue-box/",
            name: "Blue Box",
            level: "L0",
          },
          matchScore: 0.98,
          matchReason: "exact-title",
          isLowConfidence: false,
          jlptEquivalent: "N5",
          levelNumber: 0,
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
            averageScore: 92,
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
        isLowConfidence: false,
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
            averageDifficulty: 80,
            peakDifficulty90thPercentile: 96,
          },
          matchScore: 0.98,
          matchReason: "exact-title",
          isLowConfidence: false,
        },
        matchedLearnNatively: {
          entry: {
            learnnativelyUrl: "https://learnnatively.com/season/orb/",
            name: "Orb",
            level: "L40",
          },
          matchScore: 0.98,
          matchReason: "exact-title",
          isLowConfidence: false,
          jlptEquivalent: "N1",
          levelNumber: 40,
        },
      },
      {
        entry: {
          source: "anilist",
          id: 3,
          status: "COMPLETED",
          score: 80,
          progress: 12,
          media: {
            id: 13,
            anilistId: 13,
            myanimelistId: 113,
            episodes: 12,
            averageScore: 75,
            popularity: 9000,
            status: "RELEASING",
            genres: ["Comedy"],
            format: "TV",
            siteUrl: "https://anilist.co/anime/13",
            synonyms: [],
            coverImage: {
              large: "https://example.com/three.jpg",
              color: "#77bc9f",
            },
            title: {
              primary: "Low Confidence Show",
              english: "Low Confidence Show",
              native: "ローコンフィデンス",
            },
          },
        },
        matchedJimaku: {
          id: 103,
          anilistId: null,
          myanimelistId: null,
          url: "https://jimaku.cc/entry/103",
          name: "Low Confidence Show",
          englishName: null,
          japaneseName: null,
          fileCount: 12,
          flags: 1,
          updatedAt: null,
          titles: ["Low Confidence Show"],
          normalizedTitles: ["low confidence show"],
        },
        alternates: [
          {
            jimakuEntry: {
              id: 104,
              anilistId: null,
              myanimelistId: null,
              url: "https://jimaku.cc/entry/104",
              name: "Low Confidence Show Alt",
              englishName: null,
              japaneseName: null,
              fileCount: 11,
              flags: 1,
              updatedAt: null,
              titles: ["Low Confidence Show Alt"],
              normalizedTitles: ["low confidence show alt"],
            },
            score: 0.66,
            reason: "fuzzy",
          },
        ],
        matchScore: 0.68,
        matchReason: "fuzzy",
        isAmbiguous: true,
        isLowConfidence: true,
        completeness: "complete",
      },
    ],
  }
}

async function selectComboboxOption(comboboxName: string, optionLabel: string) {
  fireEvent.click(await screen.findByRole("combobox", { name: comboboxName }))
  fireEvent.click(await screen.findByText(optionLabel))
}

function nudgeSlider(slider: HTMLElement, key: string, count = 1) {
  slider.focus()

  for (let index = 0; index < count; index += 1) {
    fireEvent.keyDown(slider, { key })
  }
}

describe("AnimeOverlapPage", () => {
  it("loads results and supports filtering and sorting", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("3 matches")
    expect(screen.getByText(/entries scanned/i)).toBeInTheDocument()
    expect(screen.getByText(/fetched/i)).toBeInTheDocument()
    expect((await screen.findAllByText("Blue Box")).length).toBeGreaterThan(0)
    expect(
      screen.queryByText(/your anilist watch list, filtered down/i)
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/what v1 shows/i)).not.toBeInTheDocument()

    await selectComboboxOption("Watch status", "Planning")
    await waitFor(() => {
      expect(screen.queryByText("Orb")).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("combobox", { name: "Sort by" }))
    fireEvent.click(screen.getByText("Average Score"))

    await waitFor(() => {
      expect(screen.getAllByText("Blue Box").length).toBeGreaterThan(0)
    })
  })

  it("shows AniList cache details in a tooltip", async () => {
    const dateNowSpy = vi
      .spyOn(Date, "now")
      .mockReturnValue(new Date("2026-06-02T22:26:00.000Z").getTime())

    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

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

  it("filters by airing status and genre", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("3 matches")
    await screen.findByText("Airing status")

    await selectComboboxOption("Airing status", "Releasing")
    await waitFor(() => {
      expect(screen.queryByText("Low Confidence Show")).not.toBeInTheDocument()
    })
    expect(screen.getAllByText("Blue Box").length).toBeGreaterThan(0)

    await selectComboboxOption("Genres", "Sports")
    await waitFor(() => {
      expect(screen.queryByText("Orb")).not.toBeInTheDocument()
    })
    expect(screen.getAllByText("Blue Box").length).toBeGreaterThan(0)
  })

  it("does not expose not yet released as an airing status filter", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("Airing status")

    fireEvent.click(screen.getByRole("combobox", { name: "Airing status" }))

    expect(screen.queryByText("Not Yet Released")).not.toBeInTheDocument()
  })

  it("filters out incomplete entries when hide incomplete Jimaku subtitles is enabled", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("3 matches")
    expect((await screen.findAllByText("Orb")).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByLabelText("Hide incomplete Jimaku subtitles"))

    expect(screen.queryByText("Orb")).not.toBeInTheDocument()
    expect(screen.getAllByText("Blue Box").length).toBeGreaterThan(0)
  })

  it("filters out low confidence entries when hide low confidence matches is enabled", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("3 matches")
    expect(
      (await screen.findAllByText("Low Confidence Show")).length
    ).toBeGreaterThan(0)

    fireEvent.click(screen.getByLabelText("Hide low confidence matches"))

    expect(screen.queryByText("Low Confidence Show")).not.toBeInTheDocument()
    expect(screen.getAllByText("Blue Box").length).toBeGreaterThan(0)
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

  it("shows alternate matches in the detail dialog", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getAllByPlaceholderText("Enter username")[0], {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("3 matches")
    fireEvent.click((await screen.findAllByText("Low Confidence Show"))[0])

    expect(
      await screen.findByText("Alternate Jimaku candidates")
    ).toBeInTheDocument()
    expect(screen.getByText("Low Confidence Show Alt")).toBeInTheDocument()
    expect(screen.getByText("Low confidence")).toBeInTheDocument()
  })

  it("renders difficulty badges and modal metadata", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("3 matches")
    expect(screen.getAllByText("10/100").length).toBeGreaterThan(0)
    expect(screen.getAllByText("N5").length).toBeGreaterThan(0)

    fireEvent.click((await screen.findAllByText("Blue Box"))[0])

    expect(
      await screen.findByText(/average difficulty 10\/100/i)
    ).toBeInTheDocument()
    expect(screen.getByText("Peak difficulty")).toBeInTheDocument()
    expect(screen.getByText("Exact level")).toBeInTheDocument()
    expect(screen.getByText("L0")).toBeInTheDocument()
  })

  it("filters by JPDB difficulty range and excludes unmatched difficulty entries", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("3 matches")
    await selectComboboxOption("Difficulty filter", "JPDB Average Difficulty")

    await waitFor(() => {
      expect(screen.queryByText("Low Confidence Show")).not.toBeInTheDocument()
    })

    const sliders = screen.getAllByRole("slider")
    nudgeSlider(sliders[1], "ArrowLeft")

    await waitFor(() => {
      expect(screen.queryByText("Orb")).not.toBeInTheDocument()
    })
    expect(screen.getAllByText("Blue Box").length).toBeGreaterThan(0)
  })

  it("filters by LearnNatively level range", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("3 matches")
    await selectComboboxOption("Difficulty filter", "LearnNatively Level")

    const sliders = screen.getAllByRole("slider")
    nudgeSlider(sliders[0], "ArrowRight")

    await waitFor(() => {
      expect(screen.queryByText("Blue Box")).not.toBeInTheDocument()
    })
    expect(screen.getAllByText("Orb").length).toBeGreaterThan(0)
  })

  it("filters by LearnNatively JLPT equivalent range", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("3 matches")
    await selectComboboxOption(
      "Difficulty filter",
      "LearnNatively JLPT Equivalent"
    )

    const sliders = screen.getAllByRole("slider")
    nudgeSlider(sliders[0], "ArrowRight")

    await waitFor(() => {
      expect(screen.queryByText("Blue Box")).not.toBeInTheDocument()
    })
    expect(screen.getAllByText("Orb").length).toBeGreaterThan(0)
  })
})
