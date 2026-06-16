import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AnimeListLookupStatus } from "@/features/anime-list/components/anime-list-lookup-status"
import { AnimeListResults } from "@/features/anime-list/components/anime-list-results"

describe("AnimeList retry UI", () => {
  it("keeps rate-limit messaging out of the hero status area", () => {
    render(
      <AnimeListLookupStatus
        lookupState={{
          ok: false,
          code: "RATE_LIMITED",
          message: "AniList rate limit hit. Wait a moment and try again.",
        }}
      />
    )

    expect(
      screen.queryByText("AniList rate limit hit. Wait a moment and try again.")
    ).not.toBeInTheDocument()
  })

  it("shows retry countdown in the results footer without results", () => {
    render(
      <AnimeListResults
        hasNextPage={false}
        isInfiniteResults={false}
        isPending={false}
        isRetrying
        loadNextPage={vi.fn()}
        lookupStateOk={false}
        retryMessage="Rate limited. Retrying in 18s..."
        results={[]}
      />
    )

    expect(
      screen.getByText("Rate limited. Retrying in 18s...")
    ).toBeInTheDocument()
  })
})
