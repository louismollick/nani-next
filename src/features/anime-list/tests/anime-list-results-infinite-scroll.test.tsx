import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AnimeListResults } from "@/features/anime-list/components/anime-list-results"

type ObserverCallback = ConstructorParameters<typeof IntersectionObserver>[0]
type RenderState = {
  isPending: boolean
  isRetrying: boolean
}

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  callback: ObserverCallback

  constructor(callback: ObserverCallback) {
    this.callback = callback
    MockIntersectionObserver.instances.push(this)
  }

  disconnect() {}

  observe() {}

  unobserve() {}
}

function renderResults(
  loadNextPage: () => void,
  state: RenderState = { isPending: false, isRetrying: false }
) {
  return render(
    <AnimeListResults
      hasNextPage
      isInfiniteResults
      isPending={state.isPending}
      isRetrying={state.isRetrying}
      loadNextPage={loadNextPage}
      lookupStateOk
      results={[]}
    />
  )
}

function getLatestObserver() {
  const observer = MockIntersectionObserver.instances.at(-1)

  if (!observer) {
    throw new Error("expected observer instance")
  }

  return observer
}

function triggerIntersection(
  observer: MockIntersectionObserver,
  value: boolean
) {
  observer.callback(
    [{ isIntersecting: value } as IntersectionObserverEntry],
    observer as unknown as IntersectionObserver
  )
}

function withMockedObserver(run: () => void) {
  const originalIntersectionObserver = globalThis.IntersectionObserver

  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver

  try {
    run()
  } finally {
    MockIntersectionObserver.instances = []
    globalThis.IntersectionObserver = originalIntersectionObserver
  }
}

describe("AnimeListResults infinite scroll", () => {
  it("auto-loads only once per continuous sentinel intersection", () => {
    const loadNextPage = vi.fn()
    withMockedObserver(() => {
      renderResults(loadNextPage)
      const observer = getLatestObserver()

      triggerIntersection(observer, true)
      triggerIntersection(observer, true)

      expect(loadNextPage).toHaveBeenCalledTimes(1)

      triggerIntersection(observer, false)
      triggerIntersection(observer, true)

      expect(loadNextPage).toHaveBeenCalledTimes(2)
    })
  })

  it("re-arms auto-load after loading completes while sentinel stays in view", () => {
    const loadNextPage = vi.fn()
    withMockedObserver(() => {
      const { rerender } = renderResults(loadNextPage)
      const initialObserver = getLatestObserver()

      triggerIntersection(initialObserver, true)

      expect(loadNextPage).toHaveBeenCalledTimes(1)

      rerender(
        <AnimeListResults
          hasNextPage
          isInfiniteResults
          isPending
          isRetrying={false}
          loadNextPage={loadNextPage}
          lookupStateOk
          results={[]}
        />
      )
      rerender(
        <AnimeListResults
          hasNextPage
          isInfiniteResults
          isPending={false}
          isRetrying={false}
          loadNextPage={loadNextPage}
          lookupStateOk
          results={[]}
        />
      )

      triggerIntersection(getLatestObserver(), true)

      expect(loadNextPage).toHaveBeenCalledTimes(2)
    })
  })
})
