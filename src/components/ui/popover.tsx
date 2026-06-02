"use client"

import * as PopoverPrimitive from "@radix-ui/react-popover"
import type * as React from "react"
import { cn } from "@/lib/utils"

function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger(
  props: React.ComponentProps<typeof PopoverPrimitive.Trigger>
) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "start",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        className={cn(
          "z-50 w-72 rounded-md border border-slate-800 bg-slate-950 p-0 text-slate-100 shadow-[0_18px_50px_-34px_rgba(0,0,0,0.9)] outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        data-slot="popover-content"
        sideOffset={sideOffset}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverContent, PopoverTrigger }
