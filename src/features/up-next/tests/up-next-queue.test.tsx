import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AnimeListResults } from "@/features/anime-list/components/anime-list-results"
import { mockViewport } from "@/features/anime-list/tests/render-anime-list"
import { successResponse } from "@/features/anime-list/tests/test-data"
import {
  UpNextQueueMobileTrigger,
  UpNextQueueSidebar,
} from "@/features/up-next/components/up-next-queue-panel"
import {
  buildUpNextQueueItem,
  upNextStorageKey,
} from "@/features/up-next/domain/up-next-queue-item"
import { UpNextQueueProvider } from "@/features/up-next/hooks/use-up-next-queue"
import {
  addQueueItemAtPosition,
  moveQueueItem,
  parseStoredQueue,
  removeQueueItem,
} from "@/features/up-next/lib/up-next-queue"

function getSuccessResults() {
  const response = successResponse()

  if (!response.ok) {
    throw new Error("expected success response")
  }

  return response.results
}

function createStoredQueue(count: number) {
  const baseResults = getSuccessResults()

  return Array.from({ length: count }, (_, index) => {
    const source = baseResults[index % baseResults.length]
    const item = buildUpNextQueueItem({
      ...source,
      entry: {
        ...source.entry,
        id: source.entry.id + index * 1000,
        media: {
          ...source.entry.media,
          id: source.entry.media.id + index * 1000,
          title: {
            ...source.entry.media.title,
            english: `${source.entry.media.title.english ?? source.entry.media.title.primary} ${index + 1}`,
          },
        },
      },
    })

    return item
  })
}

function getQueueButtonForCardAt(index: number) {
  const cards = Array.from(document.querySelectorAll("[data-result-card]"))
  const buttons = within(cards[index] as HTMLElement).getAllByRole("button")
  const queueButton = buttons.find((button) =>
    button.textContent?.includes("Up Next")
  )

  if (!queueButton) {
    throw new Error(`expected Up Next action for card index ${index}`)
  }

  return queueButton
}

function renderUpNextHarness({
  includeMobileTrigger = false,
  includeSidebar = true,
}: {
  includeMobileTrigger?: boolean
  includeSidebar?: boolean
} = {}) {
  const response = successResponse()

  if (!response.ok) {
    throw new Error("expected success response")
  }

  return render(
    <UpNextQueueProvider>
      <TooltipProvider>
        <div className="space-y-4">
          {includeMobileTrigger ? <UpNextQueueMobileTrigger /> : null}
          {includeSidebar ? <UpNextQueueSidebar /> : null}
          <AnimeListResults
            hasNextPage={false}
            isInfiniteResults={false}
            isPending={false}
            isRetrying={false}
            loadNextPage={() => {}}
            lookupStateOk
            results={response.results}
          />
        </div>
      </TooltipProvider>
    </UpNextQueueProvider>
  )
}

describe("up-next queue helpers", () => {
  it("adds to empty queue and inserts at head, middle, and end", () => {
    const [blueBox, orb, apothecary] =
      getSuccessResults().map(buildUpNextQueueItem)

    const first = addQueueItemAtPosition([], blueBox, 0)
    const second = addQueueItemAtPosition(first, orb, 0)
    const third = addQueueItemAtPosition(second, apothecary, 1)

    expect(third.map((item) => item.title)).toEqual([
      "Orb",
      "The Apothecary Diaries",
      "Blue Box",
    ])
  })

  it("re-adding existing item moves without duplicating", () => {
    const [blueBox, orb] = getSuccessResults().map(buildUpNextQueueItem)
    const queue = addQueueItemAtPosition([blueBox, orb], blueBox, 1)

    expect(queue).toHaveLength(2)
    expect(queue.map((item) => item.title)).toEqual(["Orb", "Blue Box"])
  })

  it("remove closes gaps and move reorders correctly", () => {
    const [blueBox, orb, apothecary] =
      getSuccessResults().map(buildUpNextQueueItem)
    const moved = moveQueueItem([blueBox, orb, apothecary], blueBox.id, 2)
    const removed = removeQueueItem(moved, orb.id)

    expect(moved.map((item) => item.title)).toEqual([
      "Orb",
      "The Apothecary Diaries",
      "Blue Box",
    ])
    expect(removed.map((item) => item.title)).toEqual([
      "The Apothecary Diaries",
      "Blue Box",
    ])
  })

  it("handles malformed persisted storage safely", () => {
    expect(parseStoredQueue("not json")).toEqual([])
    expect(parseStoredQueue(JSON.stringify({ nope: true }))).toEqual([])
  })
})

describe("Up Next queue UI", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("opens add modal, confirms position, and persists across remount", async () => {
    const rendered = renderUpNextHarness()

    await screen.findByText(/showing 4 results/i)
    fireEvent.click(getQueueButtonForCardAt(0))

    expect(await screen.findByText("Place in Up Next")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /confirm position/i }))

    expect(
      await screen.findByText(/1 active shortlist item/i)
    ).toBeInTheDocument()
    expect(screen.getAllByText("Blue Box").length).toBeGreaterThan(0)

    rendered.unmount()
    renderUpNextHarness()

    await waitFor(() =>
      expect(screen.getByText(/1 active shortlist item/i)).toBeInTheDocument()
    )
    expect(screen.getAllByText("Blue Box").length).toBeGreaterThan(0)
  })

  it("renders overflow messaging after the fifth queued item", async () => {
    window.localStorage.setItem(
      upNextStorageKey,
      JSON.stringify(createStoredQueue(6))
    )

    renderUpNextHarness()

    expect(
      await screen.findByText(/later in queue\. items after 5 stay saved/i)
    ).toBeInTheDocument()
  })

  it("opens the queue in mobile drawer", async () => {
    const viewportSpy = mockViewport({ isMobile: true })
    window.localStorage.setItem(
      upNextStorageKey,
      JSON.stringify(createStoredQueue(1))
    )

    renderUpNextHarness({ includeMobileTrigger: true, includeSidebar: false })

    fireEvent.click(
      await screen.findByRole("button", { name: /up next \(1\)/i })
    )
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(
      await screen.findByText(
        /reorder your study queue\. positions 1-5 stay emphasized/i
      )
    ).toBeInTheDocument()
    viewportSpy.mockRestore()
  })

  it("shows weak-fit warnings in action copy and queued summary", async () => {
    renderUpNextHarness()

    await screen.findByText(/showing 4 results/i)
    const queueButton = getQueueButtonForCardAt(3)

    expect(queueButton.textContent).toMatch(/no subtitles/i)
    fireEvent.click(queueButton)
    fireEvent.click(
      await screen.findByRole("button", { name: /confirm position/i })
    )

    expect(await screen.findByText("No Jimaku subtitles")).toBeInTheDocument()
  })
})
