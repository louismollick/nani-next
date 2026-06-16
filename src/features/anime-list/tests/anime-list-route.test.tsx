import { fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { renderAnimeList } from "@/features/anime-list/tests/render-anime-list"
import { successResponse } from "@/features/anime-list/tests/test-data"

describe("AnimeListRoute", () => {
  it("auto-runs lookup for initial username and shows freshness", async () => {
    const lookup = vi.fn().mockResolvedValue(successResponse())
    renderAnimeList({ lookup, searchState: { username: "mollicl" } })

    await waitFor(() =>
      expect(lookup).toHaveBeenCalledWith({
        data: { source: "anilist", username: "mollicl" },
      })
    )
    expect(await screen.findByText(/anime in user list/i)).toBeInTheDocument()
  })

  it("shows user-list count for global anilist browse modes", async () => {
    const lookup = vi.fn().mockResolvedValue({
      ...successResponse(),
      browseMeta: {
        mode: "showAll",
        isGlobalBrowse: true,
        isApproximateWatchStatusSort: false,
        isAniListBrowseCap: false,
      },
      totalAnime: 5000,
      userListAnimeCount: 123,
    })

    renderAnimeList({ lookup, searchState: { username: "mollicl" } })

    expect(
      await screen.findByText(/123 anime in user list/i)
    ).toBeInTheDocument()
    expect(await screen.findByText(/cached/i)).toBeInTheDocument()
  })

  it("writes search state through the route callback", async () => {
    const states: string[] = []
    renderAnimeList({
      onSearchState: (state) => states.push(state.username),
    })

    fireEvent.change(screen.getByPlaceholderText(/enter username/i), {
      target: { value: "orb" },
    })

    await waitFor(() => expect(states.at(-1)).toBe("orb"))
  })

  it("renders the anime-search form variant", () => {
    renderAnimeList({
      searchState: { mode: "animeSearch" },
    })

    expect(
      screen.getByPlaceholderText(/search anime title/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("combobox", { name: /source/i })
    ).not.toBeInTheDocument()
  })
})
