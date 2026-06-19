import { GripVertical, MoveDown, MoveUp, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  type UpNextQueueItem,
  upNextActiveLimit,
} from "@/features/up-next/domain/up-next-queue-item"
import { cn } from "@/lib/utils"

export function getUpNextQueueItemStatus(item: UpNextQueueItem) {
  if (!item.hasJimaku) {
    return "No Jimaku subtitles"
  }

  if (item.isJimakuIncomplete) {
    return "Jimaku subtitles incomplete"
  }

  if (item.jpdbAverageDifficulty !== null) {
    return `JPDB ${item.jpdbAverageDifficulty}/100`
  }

  if (item.learnNativelyJlpt) {
    return `LearnNatively ${item.learnNativelyJlpt}`
  }

  return "Difficulty data unavailable"
}

export function UpNextQueueList({
  activeId,
  canRemove = false,
  draggingId,
  items,
  onDragStart,
  onDrop,
  onMoveDown,
  onMoveUp,
  onRemove,
}: {
  activeId?: string | null
  canRemove?: boolean
  draggingId?: string | null
  items: UpNextQueueItem[]
  onDragStart?: (itemId: string) => void
  onDrop?: (itemId: string) => void
  onMoveDown?: (itemId: string) => void
  onMoveUp?: (itemId: string) => void
  onRemove?: (itemId: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-background/30 p-4 text-sm text-muted-foreground">
        Add candidates from search results. Top 5 stay emphasized as your active
        shortlist.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {items.map((item, index) => {
          const isOverflowStart = index === upNextActiveLimit
          const isActiveCandidate = activeId === item.id

          return (
            <li key={item.id}>
              {isOverflowStart ? (
                <div className="mb-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  Later in queue. Items after 5 stay saved, but your active
                  shortlist is positions 1-5.
                </div>
              ) : null}
              <article
                className={cn(
                  "flex gap-3 rounded-lg border border-border bg-card/80 p-3 shadow-[0_16px_36px_-28px_rgba(0,0,0,0.9)]",
                  index >= upNextActiveLimit && "opacity-75",
                  isActiveCandidate &&
                    "border-primary/50 ring-2 ring-primary/20",
                  draggingId === item.id && "opacity-60"
                )}
                draggable={Boolean(onDragStart && onDrop)}
                onDragOver={(event) => {
                  if (!onDrop) {
                    return
                  }

                  event.preventDefault()
                }}
                onDragStart={() => onDragStart?.(item.id)}
                onDrop={() => onDrop?.(item.id)}
              >
                <div className="flex items-start gap-3">
                  {onDragStart ? (
                    <div
                      className="pt-0.5 text-muted-foreground"
                      title="Drag to reorder"
                    >
                      <GripVertical className="size-4" />
                    </div>
                  ) : null}
                  <div className="text-xs font-semibold text-muted-foreground">
                    #{index + 1}
                  </div>
                </div>
                <img
                  alt=""
                  aria-hidden="true"
                  className="h-16 w-12 shrink-0 rounded-md object-cover"
                  src={item.coverImageUrl}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="line-clamp-2 text-sm font-medium text-foreground">
                    {item.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getUpNextQueueItemStatus(item)}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    aria-label={`Move ${item.title} up`}
                    disabled={!onMoveUp || index === 0}
                    onClick={() => onMoveUp?.(item.id)}
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                  >
                    <MoveUp />
                  </Button>
                  <Button
                    aria-label={`Move ${item.title} down`}
                    disabled={!onMoveDown || index === items.length - 1}
                    onClick={() => onMoveDown?.(item.id)}
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                  >
                    <MoveDown />
                  </Button>
                  {canRemove ? (
                    <Button
                      aria-label={`Remove ${item.title} from Up Next`}
                      onClick={() => onRemove?.(item.id)}
                      size="icon-xs"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
              </article>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
