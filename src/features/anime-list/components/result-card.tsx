import { ListOrdered } from "lucide-react"
import { useRef } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ResultCardDetails } from "@/features/anime-list/components/result-card-details"
import { ResultCardLinks } from "@/features/anime-list/components/result-card-links"
import { ResultCardSummary } from "@/features/anime-list/components/result-card-summary"
import { ResultCardTooltip } from "@/features/anime-list/components/result-card-tooltip"
import { useResultCardOverlay } from "@/features/anime-list/hooks/use-result-card-overlay"
import { getResultTitle } from "@/features/anime-list/lib/result-presenters"
import { useUpNextQueue } from "@/features/up-next/hooks/use-up-next-queue"
import type { OverlapResult } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ResultCard({ result }: { result: OverlapResult }) {
  const hoverTargetRef = useRef<HTMLDivElement | null>(null)
  const overlay = useResultCardOverlay(hoverTargetRef)
  const upNextQueue = useUpNextQueue()
  const queuePosition = upNextQueue.positionOf(result)
  const queueActionLabel = getQueueActionLabel({
    isQueued: queuePosition !== -1,
    position: queuePosition,
    result,
  })
  const links = ResultCardLinks({
    extraActions: [
      {
        icon: <ListOrdered className="size-4 shrink-0" />,
        label: queueActionLabel,
        onClick: () => upNextQueue.openAddModal(result),
        variant: queuePosition === -1 ? "default" : "secondary",
      },
    ],
    onBlur: overlay.handleLinkBlur,
    onFocus: () => overlay.setIsTooltipOpen(true),
    onPointerEnter: () => overlay.setIsTooltipOpen(true),
    result,
  })

  return (
    <Drawer onOpenChange={overlay.setIsDrawerOpen} open={overlay.isDrawerOpen}>
      <div
        className={cn(
          "group relative h-full w-full",
          overlay.isTooltipOpen ? "z-30" : "z-0"
        )}
        data-result-card
        onPointerLeave={overlay.handlePointerLeave}
        ref={hoverTargetRef}
      >
        <button
          aria-describedby={
            overlay.isMobileViewport
              ? undefined
              : `result-card-tooltip-${result.entry.source}-${result.entry.id}`
          }
          className="h-full w-full text-left select-text"
          onBlur={() => overlay.setIsTooltipOpen(false)}
          onClick={() =>
            overlay.isMobileViewport && overlay.setIsDrawerOpen(true)
          }
          onFocus={() => {
            if (!overlay.isMobileViewport) {
              overlay.syncTooltipSide()
              overlay.setIsTooltipOpen(true)
            }
          }}
          type="button"
        >
          <div
            className="space-y-3"
            onPointerEnter={overlay.handlePointerUpdate}
            onPointerMove={overlay.handlePointerUpdate}
          >
            <ResultCardSummary result={result} />
          </div>
        </button>
        {overlay.isTooltipOpen && !overlay.isMobileViewport ? (
          <ResultCardTooltip
            result={result}
            side={overlay.tooltipSide}
            gap={overlay.tooltipGap}
          />
        ) : null}
        {links.overlay}
      </div>
      <DrawerContent className="lg:hidden">
        <DrawerHeader>
          <DrawerTitle>{getResultTitle(result)}</DrawerTitle>
          <DrawerDescription className="sr-only">
            External links and detailed anime metadata.
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-2">{links.actions}</div>
        <div className="overflow-y-auto pb-1">
          <ResultCardDetails result={result} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function getQueueActionLabel({
  isQueued,
  position,
  result,
}: {
  isQueued: boolean
  position: number
  result: OverlapResult
}) {
  const warning = !result.matchedJimaku
    ? "No subtitles"
    : result.completeness === "incomplete"
      ? "Subtitles incomplete"
      : !result.matchedJpdb && !result.matchedLearnNatively
        ? "Difficulty unknown"
        : null

  const prefix = isQueued ? `Queued #${position + 1}` : "Add to Up Next"

  return warning ? `${prefix} · ${warning}` : prefix
}
