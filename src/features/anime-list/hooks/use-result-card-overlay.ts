import type {
  FocusEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react"
import { useCallback, useEffect, useState } from "react"

const resultCardTooltipGap = 14
const resultCardTooltipWidth = 320
const viewportTooltipPadding = 16

export function useResultCardOverlay(
  hoverTargetRef: RefObject<HTMLElement | null>
) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const [tooltipSide, setTooltipSide] = useState<"left" | "right">("right")
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const syncTooltipSide = useCallback(() => {
    const rect = hoverTargetRef.current?.getBoundingClientRect()

    if (!rect) {
      return
    }

    const availableRight =
      window.innerWidth - rect.right - viewportTooltipPadding
    const availableLeft = rect.left - viewportTooltipPadding

    if (availableRight >= resultCardTooltipWidth + resultCardTooltipGap) {
      setTooltipSide("right")
      return
    }

    if (availableLeft >= resultCardTooltipWidth + resultCardTooltipGap) {
      setTooltipSide("left")
      return
    }

    setTooltipSide(availableRight >= availableLeft ? "right" : "left")
  }, [hoverTargetRef])

  const syncTooltipHoverState = useCallback(() => {
    const hoverTarget = hoverTargetRef.current

    if (!hoverTarget) {
      return
    }

    const isHovered =
      hoverTarget.matches(":hover") ||
      Array.from(hoverTarget.querySelectorAll("*")).some((element) =>
        element.matches(":hover")
      )

    if (isHovered) {
      syncTooltipSide()
    }

    setIsTooltipOpen(isHovered)
  }, [hoverTargetRef, syncTooltipSide])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)")
    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches)
      if (mediaQuery.matches) setIsTooltipOpen(false)
      else setIsDrawerOpen(false)
    }

    syncViewport()
    mediaQuery.addEventListener("change", syncViewport)
    return () => mediaQuery.removeEventListener("change", syncViewport)
  }, [])

  useEffect(() => {
    if (!isTooltipOpen) {
      return
    }

    const handleViewportChange = () => syncTooltipHoverState()

    window.addEventListener("scroll", handleViewportChange, {
      capture: true,
      passive: true,
    })
    window.addEventListener("resize", handleViewportChange, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleViewportChange, true)
      window.removeEventListener("resize", handleViewportChange)
    }
  }, [isTooltipOpen, syncTooltipHoverState])

  const handlePointerUpdate = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch" || isMobileViewport) {
      return
    }

    syncTooltipSide()
    setIsTooltipOpen(true)
  }

  const handlePointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch" || isMobileViewport) {
      return
    }

    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return
    }

    setIsTooltipOpen(false)
  }

  const handleLinkBlur = (event: FocusEvent<HTMLAnchorElement>) => {
    if (event.currentTarget.parentElement?.contains(event.relatedTarget)) {
      return
    }

    setIsTooltipOpen(false)
  }

  return {
    handleLinkBlur,
    handlePointerLeave,
    handlePointerUpdate,
    isDrawerOpen,
    isMobileViewport,
    isTooltipOpen,
    setIsDrawerOpen,
    setIsTooltipOpen,
    syncTooltipSide,
    tooltipGap: resultCardTooltipGap,
    tooltipSide,
  }
}
