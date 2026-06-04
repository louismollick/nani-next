import type * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded border border-slate-800 bg-slate-800/60 px-3.5 py-2 text-[15px] text-slate-100 transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-100 placeholder:text-slate-500 hover:bg-slate-800 focus-visible:border-sky-400/60 focus-visible:ring-3 focus-visible:ring-sky-400/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/70 disabled:text-slate-500 aria-invalid:border-rose-400/70 aria-invalid:ring-3 aria-invalid:ring-rose-400/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
