import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AnimeListTitleFilter } from "@/features/anime-list/components/anime-list-title-filter"
import { defaultLookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"

describe("AnimeListTitleFilter", () => {
  it("snapshots the changed value before deferred state updates run", () => {
    const updateSearchState = vi.fn()

    render(
      <AnimeListTitleFilter
        searchState={defaultLookupSearchState}
        updateSearchState={updateSearchState}
      />
    )

    const input = screen.getByPlaceholderText(/search titles/i)

    fireEvent.change(input, {
      target: { value: "Fullmetal Alchemist" },
    })

    input.setAttribute("value", "Bleach")

    const updater = updateSearchState.mock.calls[0]?.[0]
    expect(updater).toBeTypeOf("function")
    expect(
      updater(defaultLookupSearchState).titleQuery
    ).toBe("Fullmetal Alchemist")
  })
})
