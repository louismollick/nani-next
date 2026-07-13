import { fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import {
  mockViewport,
  renderAnimeList,
} from "@/features/anime-list/tests/render-anime-list"
import { successResponse } from "@/features/anime-list/tests/test-data"

function expectAverageScoreMetadata(container: Element) {
  expect(container).toHaveTextContent("Average Score")
  expect(container).toHaveTextContent("88%")
}

describe("AnimeListResults", () => {
  it("filters visible cards by title and preserves sort direction changes", async () => {
    renderAnimeList({
      lookup: vi.fn().mockResolvedValue(successResponse()),
      searchState: { username: "mollicl" },
    })

    fireEvent.change(await screen.findByLabelText(/anime title/i), {
      target: { value: "orb" },
    })
    expect(await screen.findByText("Showing 1 result")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: /asc/i }))
    fireEvent.change(screen.getByLabelText(/anime title/i), {
      target: { value: "" },
    })

    await waitFor(() =>
      expect(screen.getByText("Showing 2 results")).toBeInTheDocument()
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

  it("renders metadata filters for format, year, episodes, and duration", async () => {
    renderAnimeList({
      lookup: vi.fn().mockResolvedValue(successResponse()),
      searchState: { username: "mollicl" },
    })

    expect(await screen.findByText("Format")).toBeInTheDocument()
    expect(screen.getByText("Year")).toBeInTheDocument()
    expect(screen.getByText("Episodes")).toBeInTheDocument()
    expect(screen.getByText("Duration")).toBeInTheDocument()
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
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toBeInTheDocument()
    expectAverageScoreMetadata(dialog)
    viewportSpy.mockRestore()
  })
})

describe("AnimeListResults desktop cards", () => {
  it("keeps desktop platform links interactive and restores full metadata", async () => {
    renderAnimeList({
      lookup: vi.fn().mockResolvedValue(successResponse()),
      searchState: {
        username: "mollicl",
        selectedStatuses: ["CURRENT"],
      },
    })

    const title = await screen.findByText("Blue Box")
    const card = title.closest("[data-result-card]")

    if (!card) throw new Error("expected result card")

    fireEvent.pointerEnter(card.querySelector("button > div") ?? card)

    expect(await screen.findByRole("link", { name: /jpdb/i })).toHaveAttribute(
      "href",
      "https://jpdb.io/anime/11/blue-box"
    )
    expect(
      document.querySelector('img[src="/jpdb-favicon-32x32.png"]')
    ).toBeTruthy()
    expect(
      document.querySelector('img[src="/learnnatively-favicon-32x32.png"]')
    ).toBeTruthy()
    expect(await screen.findByRole("link", { name: /jiten/i })).toHaveAttribute(
      "href",
      "https://jiten.moe/decks/media/101/detail"
    )
    expect(document.querySelector('img[src="/jiten-favicon.ico"]')).toBeTruthy()
    expect(card).toHaveTextContent("2.7/5")

    const tooltip = await screen.findByText("Unique kanji")
    const tooltipPanel =
      tooltip.closest('[role="tooltip"]') ?? tooltip.parentElement

    expect(
      screen.getAllByLabelText("Average Score 88% Great").length
    ).toBeGreaterThanOrEqual(1)
    if (!tooltipPanel) throw new Error("expected tooltip panel")
    expectAverageScoreMetadata(tooltipPanel)
    expect(tooltipPanel).toHaveTextContent("Unique kanji")
    expect(tooltipPanel).toHaveTextContent("Unique readings")
    expect(tooltipPanel).toHaveTextContent("Words used once")
  })
})
