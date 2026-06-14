import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AnimeListResults } from "@/features/anime-list/components/anime-list-results"

type ObserverCallback = ConstructorParameters<typeof IntersectionObserver>[0]

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

describe("AnimeListResults infinite scroll", () => {
  it("auto-loads only once per continuous sentinel intersection", () => {
    const loadNextPage = vi.fn()
    const originalIntersectionObserver = globalThis.IntersectionObserver

    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver

    try {
      render(
        <AnimeListResults
          hasNextPage
          isGlobalAniListBrowse
          isPending={false}
          isRetrying={false}
          loadNextPage={loadNextPage}
          lookupStateOk
          results={[]}
        />
      )

      const observer = MockIntersectionObserver.instances.at(-1)

      if (!observer) {
        throw new Error("expected observer instance")
      }

      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      )
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      )

      expect(loadNextPage).toHaveBeenCalledTimes(1)

      observer.callback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      )
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      )

      expect(loadNextPage).toHaveBeenCalledTimes(2)
    } finally {
      MockIntersectionObserver.instances = []
      globalThis.IntersectionObserver = originalIntersectionObserver
    }
  })
})
