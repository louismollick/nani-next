import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ResultCard } from "@/features/anime-list/components/result-card"
import type { OverlapResult } from "@/features/anime-list/domain/lookup-response"

export function AnimeListResults({
  browseMeta,
  hasNextPage,
  isInfiniteResults,
  isPending,
  isRetrying,
  loadNextPage,
  lookupStateOk,
  retryMessage,
  results,
}: {
  browseMeta?: {
    isAniListBrowseCap: boolean
    isApproximateWatchStatusSort: boolean
  }
  hasNextPage: boolean
  isInfiniteResults: boolean
  isPending: boolean
  isRetrying: boolean
  loadNextPage: () => void
  lookupStateOk: boolean
  retryMessage?: string | null
  results: OverlapResult[]
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const autoLoadLockedRef = useRef(false)

  useEffect(() => {
    if (!isPending && !isRetrying) {
      autoLoadLockedRef.current = false
    }
  }, [isPending, isRetrying])

  useEffect(() => {
    if (!isInfiniteResults || !hasNextPage || !sentinelRef.current) {
      autoLoadLockedRef.current = false
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting)

        if (!isIntersecting) {
          autoLoadLockedRef.current = false
          return
        }

        if (!autoLoadLockedRef.current && !isPending && !isRetrying) {
          autoLoadLockedRef.current = true
          loadNextPage()
        }
      },
      { rootMargin: "300px 0px 300px 0px" }
    )

    observer.observe(sentinelRef.current)

    return () => observer.disconnect()
  }, [hasNextPage, isInfiniteResults, isPending, isRetrying, loadNextPage])

  return (
    <section className="space-y-4">
      {lookupStateOk ? (
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>
            Showing {results.length} result{results.length === 1 ? "" : "s"}
          </div>
          {browseMeta?.isApproximateWatchStatusSort ? (
            <div>
              Watch Status sort is approximate in global AniList browse.
            </div>
          ) : null}
          {browseMeta?.isAniListBrowseCap ? (
            <div>
              Global AniList browse is limited by AniList&apos;s 5000-item cap.
            </div>
          ) : null}
        </div>
      ) : null}
      {results.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
          {results.map((result) => (
            <ResultCard
              key={`${result.entry.source}-${result.entry.id}-${result.entry.media.id}`}
              result={result}
            />
          ))}
        </div>
      ) : null}
      {isInfiniteResults ? (
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="h-1 w-full" ref={sentinelRef} />
          {hasNextPage ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Button
                disabled={isPending || isRetrying}
                onClick={loadNextPage}
                type="button"
                variant="secondary"
              >
                {isPending ? "Loading..." : "Load more"}
              </Button>
              {isRetrying && retryMessage ? <span>{retryMessage}</span> : null}
            </div>
          ) : isRetrying && retryMessage ? (
            <p className="text-sm text-muted-foreground">{retryMessage}</p>
          ) : (
            <p className="text-sm text-muted-foreground">End of results</p>
          )}
        </div>
      ) : isPending || (isRetrying && retryMessage) ? (
        <div className="pt-2 text-center text-sm text-muted-foreground">
          {isRetrying && retryMessage ? retryMessage : "Loading..."}
        </div>
      ) : null}
    </section>
  )
}
