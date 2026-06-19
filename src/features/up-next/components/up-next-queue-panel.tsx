import { ListOrdered } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { UpNextQueueList } from "@/features/up-next/components/up-next-queue-list"
import { useUpNextQueue } from "@/features/up-next/hooks/use-up-next-queue"
import { positionOfQueueItem } from "@/features/up-next/lib/up-next-queue"

function QueuePanelBody() {
  const {
    activeCount,
    clearQueue,
    count,
    items,
    moveItem,
    overflowCount,
    removeItem,
  } = useUpNextQueue()
  const [draggingId, setDraggingId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-medium text-foreground">
              Up Next
            </h2>
            <p className="text-sm text-muted-foreground">
              {count === 0
                ? "No queued picks yet."
                : `${activeCount} active shortlist item${activeCount === 1 ? "" : "s"}${
                    overflowCount > 0 ? `, ${overflowCount} later in queue` : ""
                  }.`}
            </p>
          </div>
          {count > 0 ? (
            <Button
              onClick={clearQueue}
              size="sm"
              type="button"
              variant="ghost"
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>
      <UpNextQueueList
        canRemove
        draggingId={draggingId}
        items={items}
        onDragStart={setDraggingId}
        onDrop={(itemId) => {
          if (!draggingId || draggingId === itemId) {
            return
          }

          const toIndex = positionOfQueueItem(items, itemId)

          if (toIndex === -1) {
            return
          }

          moveItem(draggingId, toIndex)
          setDraggingId(null)
        }}
        onMoveDown={(itemId) => {
          const index = positionOfQueueItem(items, itemId)
          if (index !== -1) {
            moveItem(itemId, index + 1)
          }
        }}
        onMoveUp={(itemId) => {
          const index = positionOfQueueItem(items, itemId)
          if (index !== -1) {
            moveItem(itemId, index - 1)
          }
        }}
        onRemove={removeItem}
      />
    </div>
  )
}

export function UpNextQueueSidebar() {
  return (
    <aside className="hidden lg:block">
      <div className="rounded-2xl border border-border/80 bg-background/55 p-4 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.95)] backdrop-blur-sm">
        <QueuePanelBody />
      </div>
    </aside>
  )
}

export function UpNextQueueMobileTrigger() {
  const { count } = useUpNextQueue()
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        type="button"
        variant="outline"
      >
        <ListOrdered />
        Up Next{count > 0 ? ` (${count})` : ""}
      </Button>
      <Drawer onOpenChange={setOpen} open={open}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Up Next</DrawerTitle>
            <DrawerDescription>
              Reorder your study queue. Positions 1-5 stay emphasized.
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto pb-2">
            <QueuePanelBody />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
