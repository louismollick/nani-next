import { fireEvent, render, screen } from "@testing-library/react"
import { useRef } from "react"
import { describe, expect, it, vi } from "vitest"
import { useResultCardOverlay } from "@/features/anime-list/hooks/use-result-card-overlay"

function OverlayHarness() {
  const ref = useRef<HTMLDivElement | null>(null)
  const overlay = useResultCardOverlay(ref)

  return (
    <div onPointerLeave={overlay.handlePointerLeave} ref={ref}>
      <button onPointerMove={overlay.handlePointerUpdate} type="button">
        trigger
      </button>
      <a href="/" onPointerEnter={overlay.handlePointerUpdate}>
        link
      </a>
      <span>{overlay.isTooltipOpen ? "open" : "closed"}</span>
    </div>
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

  it("keeps tooltip open while moving within the card container", () => {
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

    const button = screen.getByRole("button", { name: "trigger" })
    const link = screen.getByRole("link", { name: "link" })
    const container = button.parentElement

    if (!container) throw new Error("expected overlay container")

    fireEvent.pointerMove(button, { pointerType: "mouse" })
    fireEvent.pointerLeave(container, {
      pointerType: "mouse",
      relatedTarget: link,
    })

    expect(screen.getByText("open")).toBeInTheDocument()

    fireEvent.pointerLeave(container, {
      pointerType: "mouse",
      relatedTarget: null,
    })

    expect(screen.getByText("closed")).toBeInTheDocument()
    matchMediaSpy.mockRestore()
  })
})
