import { fireEvent, render, screen } from "@testing-library/react"
import { useRef } from "react"
import { describe, expect, it, vi } from "vitest"
import { useResultCardOverlay } from "@/features/anime-list/hooks/use-result-card-overlay"

function OverlayHarness() {
  const ref = useRef<HTMLButtonElement | null>(null)
  const overlay = useResultCardOverlay(ref)

  return (
    <>
      <button
        onPointerMove={overlay.handlePointerUpdate}
        ref={ref}
        type="button"
      >
        trigger
      </button>
      <span>{overlay.isTooltipOpen ? "open" : "closed"}</span>
    </>
  )
}

describe("use-result-card-overlay", () => {
  it("opens tooltip on pointer move in desktop viewport", () => {
    const matchMediaSpy = vi
      .spyOn(window, "matchMedia")
      .mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
          return false
        },
      }))
    render(<OverlayHarness />)

    fireEvent.pointerMove(screen.getByRole("button", { name: "trigger" }), {
      pointerType: "mouse",
    })

    expect(screen.getByText("open")).toBeInTheDocument()
    matchMediaSpy.mockRestore()
  })
})
