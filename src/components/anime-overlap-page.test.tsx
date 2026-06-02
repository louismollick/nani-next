import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AnimeOverlapPage } from "@/components/anime-overlap-page"
import type { LookupResponse } from "@/lib/types"

function successResponse(): LookupResponse {
  return {
    ok: true,
    username: "mollicl",
    totalAnime: 3,
    matchedCount: 3,
    results: [
      {
        anilistEntry: {
          id: 1,
          status: "CURRENT",
          score: 70,
          progress: 3,
          media: {
            id: 11,
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
              romaji: "Blue Box",
              english: "Blue Box",
              native: "アオのハコ",
            },
          },
        },
        matchedJimaku: {
          id: 101,
          anilistId: 11,
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
      },
      {
        anilistEntry: {
          id: 2,
          status: "PLANNING",
          score: 60,
          progress: 0,
          media: {
            id: 12,
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
              romaji: "Orb",
              english: "Orb",
              native: "チ。",
            },
          },
        },
        matchedJimaku: {
          id: 102,
          anilistId: 12,
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
      },
      {
        anilistEntry: {
          id: 3,
          status: "COMPLETED",
          score: 80,
          progress: 12,
          media: {
            id: 13,
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
              romaji: "Low Confidence Show",
              english: "Low Confidence Show",
              native: "ローコンフィデンス",
            },
          },
        },
        matchedJimaku: {
          id: 103,
          anilistId: null,
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

describe("AnimeOverlapPage", () => {
  it("loads results and supports filtering and sorting", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter AniList username"), {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("3 matches")
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

  it("filters by airing status and genre", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter AniList username"), {
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

  it("filters out incomplete entries when hide incomplete is enabled", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(screen.getByPlaceholderText("Enter AniList username"), {
      target: { value: "mollicl" },
    })
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("3 matches")
    expect((await screen.findAllByText("Orb")).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByLabelText("Hide incomplete"))

    expect(screen.queryByText("Orb")).not.toBeInTheDocument()
    expect(screen.getAllByText("Blue Box").length).toBeGreaterThan(0)
  })

  it("shows upstream errors clearly", async () => {
    const lookup = vi.fn().mockResolvedValue({
      ok: false,
      code: "PRIVATE_OR_UNAVAILABLE",
      message: "That AniList anime list is private or unavailable.",
    } satisfies LookupResponse)

    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(
      screen.getAllByPlaceholderText("Enter AniList username")[0],
      {
        target: { value: "secret-user" },
      }
    )
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    expect(
      await screen.findByText(/private or unavailable/i)
    ).toBeInTheDocument()
  })

  it("shows alternate matches in the detail dialog", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    render(<AnimeOverlapPage lookup={lookup} />)

    fireEvent.change(
      screen.getAllByPlaceholderText("Enter AniList username")[0],
      {
        target: { value: "mollicl" },
      }
    )
    fireEvent.click(screen.getByRole("button", { name: /find overlap/i }))

    await screen.findByText("3 matches")
    fireEvent.click((await screen.findAllByText("Low Confidence Show"))[0])

    expect(
      await screen.findByText("Alternate Jimaku candidates")
    ).toBeInTheDocument()
    expect(screen.getByText("Low Confidence Show Alt")).toBeInTheDocument()
    expect(screen.getByText("Low confidence")).toBeInTheDocument()
  })
})
