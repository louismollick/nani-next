import { ExternalLink } from "lucide-react"
import type { FocusEvent, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ResultCardActions({
  actions,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
}: {
  actions: Array<
    | { href: string; icon: ReactNode; label: string }
    | {
        icon: ReactNode
        label: string
        onClick: () => void
        variant?: "default" | "outline" | "secondary"
      }
  >
  onBlur?: (event: FocusEvent<HTMLAnchorElement | HTMLButtonElement>) => void
  onFocus?: () => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}) {
  return actions.map((action) =>
    "href" in action ? (
      <a
        className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
        href={action.href}
        key={action.label}
        onBlur={onBlur}
        onFocus={onFocus}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        rel="noreferrer"
        target="_blank"
      >
        {action.icon}
        <span className="min-w-0 flex-1 truncate">{action.label}</span>
        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
      </a>
    ) : (
      <Button
        className={cn(
          "h-9 justify-start gap-2 border-border bg-card px-2.5",
          action.variant === "default" &&
            "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        key={action.label}
        onBlur={onBlur}
        onClick={action.onClick}
        onFocus={onFocus}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        type="button"
        variant={action.variant ?? "outline"}
      >
        {action.icon}
        <span className="min-w-0 flex-1 truncate text-left">
          {action.label}
        </span>
      </Button>
    )
  )
}
