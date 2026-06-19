"use client"

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { UpNextQueueDialog } from "@/features/up-next/components/up-next-queue-dialog"
import {
  buildUpNextQueueItem,
  getUpNextQueueItemId,
  type UpNextQueueItem,
  upNextActiveLimit,
  upNextStorageKey,
} from "@/features/up-next/domain/up-next-queue-item"
import {
  addQueueItemAtPosition,
  moveQueueItem,
  parseStoredQueue,
  positionOfQueueItem,
  removeQueueItem,
} from "@/features/up-next/lib/up-next-queue"
import type { OverlapResult } from "@/lib/types"

type UpNextQueueDialogState = {
  candidateId: string
  draftItems: UpNextQueueItem[]
  isMove: boolean
  open: boolean
}

type UpNextQueueContextValue = {
  activeCount: number
  count: number
  items: UpNextQueueItem[]
  overflowCount: number
  addAtPosition: (result: OverlapResult, index: number) => void
  clearQueue: () => void
  isQueued: (result: OverlapResult) => boolean
  moveItem: (itemId: string, index: number) => void
  openAddModal: (result: OverlapResult) => void
  positionOf: (result: OverlapResult) => number
  removeItem: (itemId: string) => void
}

const UpNextQueueContext = createContext<UpNextQueueContextValue | null>(null)

function buildQueueId(result: OverlapResult) {
  return getUpNextQueueItemId({
    source: result.entry.source,
    entryId: result.entry.id,
    mediaId: result.entry.media.id,
  })
}

export function UpNextQueueProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<UpNextQueueItem[]>([])
  const [dialogState, setDialogState] = useState<UpNextQueueDialogState | null>(
    null
  )
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    setItems(parseStoredQueue(window.localStorage.getItem(upNextStorageKey)))
    hasHydratedRef.current = true
  }, [])

  useEffect(() => {
    if (!hasHydratedRef.current || typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(upNextStorageKey, JSON.stringify(items))
  }, [items])

  const addAtPosition = (result: OverlapResult, index: number) => {
    const nextItem = buildUpNextQueueItem(result)
    setItems((currentItems) =>
      addQueueItemAtPosition(currentItems, nextItem, index)
    )
  }

  const moveItem = (itemId: string, index: number) => {
    setItems((currentItems) => moveQueueItem(currentItems, itemId, index))
  }

  const removeItem = (itemId: string) => {
    setItems((currentItems) => removeQueueItem(currentItems, itemId))
  }

  const clearQueue = () => setItems([])

  const positionOf = (result: OverlapResult) =>
    positionOfQueueItem(items, buildQueueId(result))

  const isQueued = (result: OverlapResult) => positionOf(result) !== -1

  const openAddModal = (result: OverlapResult) => {
    const nextItem = buildUpNextQueueItem(result)
    const existingIndex = positionOfQueueItem(items, nextItem.id)

    setDialogState({
      candidateId: nextItem.id,
      draftItems:
        existingIndex === -1
          ? addQueueItemAtPosition(items, nextItem, items.length)
          : items,
      isMove: existingIndex !== -1,
      open: true,
    })
  }

  const closeDialog = () => setDialogState(null)

  const confirmDialog = (draftItems: UpNextQueueItem[]) => {
    setItems(draftItems)
    closeDialog()
  }

  const value: UpNextQueueContextValue = {
    activeCount: Math.min(items.length, upNextActiveLimit),
    count: items.length,
    items,
    overflowCount: Math.max(items.length - upNextActiveLimit, 0),
    addAtPosition,
    clearQueue,
    isQueued,
    moveItem,
    openAddModal,
    positionOf,
    removeItem,
  }

  return (
    <UpNextQueueContext.Provider value={value}>
      {children}
      {dialogState ? (
        <UpNextQueueDialog
          candidateId={dialogState.candidateId}
          draftItems={dialogState.draftItems}
          isMove={dialogState.isMove}
          onConfirm={confirmDialog}
          onOpenChange={(open) => {
            if (!open) {
              closeDialog()
            }
          }}
          open={dialogState.open}
        />
      ) : null}
    </UpNextQueueContext.Provider>
  )
}

export function useUpNextQueue() {
  const context = useContext(UpNextQueueContext)

  if (!context) {
    throw new Error("useUpNextQueue must be used within UpNextQueueProvider")
  }

  return context
}
