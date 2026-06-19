import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UpNextQueueList } from "@/features/up-next/components/up-next-queue-list"
import type { UpNextQueueItem } from "@/features/up-next/domain/up-next-queue-item"
import {
  moveQueueItem,
  positionOfQueueItem,
  removeQueueItem,
} from "@/features/up-next/lib/up-next-queue"

export function UpNextQueueDialog({
  candidateId,
  draftItems,
  isMove,
  onConfirm,
  onOpenChange,
  open,
}: {
  candidateId: string
  draftItems: UpNextQueueItem[]
  isMove: boolean
  onConfirm: (items: UpNextQueueItem[]) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const [items, setItems] = useState(draftItems)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  useEffect(() => {
    setItems(draftItems)
    setDraggingId(null)
  }, [draftItems])

  const candidateIndex = positionOfQueueItem(items, candidateId)
  const candidateTitle =
    candidateIndex === -1
      ? "this anime"
      : (items[candidateIndex]?.title ?? "this anime")

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-xl p-0 sm:max-w-xl">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>
            {isMove ? "Move in Up Next" : "Place in Up Next"}
          </DialogTitle>
          <DialogDescription>
            Drag to reorder, or use the arrow controls. Confirm to save{" "}
            {candidateTitle}&apos;s position.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto px-4 pb-1">
          <UpNextQueueList
            activeId={candidateId}
            canRemove={false}
            draggingId={draggingId}
            items={items}
            onDragStart={setDraggingId}
            onDrop={(itemId) => {
              if (!draggingId || draggingId === itemId) {
                return
              }

              const fromIndex = positionOfQueueItem(items, draggingId)
              const toIndex = positionOfQueueItem(items, itemId)

              if (fromIndex === -1 || toIndex === -1) {
                return
              }

              setItems(moveQueueItem(items, draggingId, toIndex))
              setDraggingId(null)
            }}
            onMoveDown={(itemId) => {
              const index = positionOfQueueItem(items, itemId)
              if (index === -1) {
                return
              }

              setItems(moveQueueItem(items, itemId, index + 1))
            }}
            onMoveUp={(itemId) => {
              const index = positionOfQueueItem(items, itemId)
              if (index === -1) {
                return
              }

              setItems(moveQueueItem(items, itemId, index - 1))
            }}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => onConfirm(items)} type="button">
            Confirm position
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          {isMove ? (
            <Button
              onClick={() => onConfirm(removeQueueItem(items, candidateId))}
              type="button"
              variant="destructive"
            >
              Remove from Up Next
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
