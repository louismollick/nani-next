import { fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import {
  mockViewport,
  renderAnimeList,
} from "@/features/anime-list/tests/render-anime-list"
import { successResponse } from "@/features/anime-list/tests/test-data"

describe("AnimeListResults", () => {
  it("filters visible cards by title and preserves sort direction changes", async () => {
    renderAnimeList({
      lookup: vi.fn().mockResolvedValue(successResponse()),
      searchState: { username: "mollicl" },
    })

    fireEvent.change(await screen.findByLabelText(/anime title/i), {
      target: { value: "orb" },
    })
    expect(await screen.findByText("Showing 0 results")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: /asc/i }))
    fireEvent.change(screen.getByLabelText(/anime title/i), {
      target: { value: "" },
    })

    await waitFor(() =>
      expect(screen.getByText("Showing 1 results")).toBeInTheDocument()
    )
  })

  it("shows upstream errors clearly", async () => {
    renderAnimeList({
      lookup: vi.fn().mockResolvedValue({
        ok: false,
        code: "UPSTREAM_ERROR",
        message: "Nope",
      }),
      searchState: { username: "mollicl" },
    })

    expect(await screen.findByText("Nope")).toBeInTheDocument()
  })

  it("opens mobile drawer with metadata on card tap", async () => {
    const viewportSpy = mockViewport({ isMobile: true })
    renderAnimeList({
      lookup: vi.fn().mockResolvedValue(successResponse()),
      searchState: {
        username: "mollicl",
        selectedStatuses: ["CURRENT"],
      },
    })

    const title = await screen.findByText("Blue Box")
    const card = title.closest("button")

    if (!card) throw new Error("expected result card")
    fireEvent.click(card)
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    viewportSpy.mockRestore()
  })
})
