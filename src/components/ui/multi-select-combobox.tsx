"use client"

import { Check, ChevronDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Option = {
  label: string
  value: string
}

type MultiSelectComboboxProps = {
  ariaLabel?: string
  emptyText?: string
  onSelectedValuesChange: (selectedValues: Set<string>) => void
  options: Option[]
  placeholderWhenAllSelected?: boolean
  placeholder?: string
  searchPlaceholder?: string
  selectedValues: Set<string>
}

export function MultiSelectCombobox({
  ariaLabel,
  emptyText = "No options found.",
  onSelectedValuesChange,
  options,
  placeholderWhenAllSelected = false,
  placeholder = "Any",
  searchPlaceholder = "Search...",
  selectedValues,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const selectedOptions = options.filter((option) =>
    selectedValues.has(option.value)
  )
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase())
  )

  let triggerLabel = placeholder
  if (
    placeholderWhenAllSelected &&
    selectedOptions.length === options.length &&
    options.length > 0
  ) {
    triggerLabel = placeholder
  } else if (selectedOptions.length === 1) {
    triggerLabel = selectedOptions[0]?.label ?? placeholder
  } else if (selectedOptions.length > 1) {
    triggerLabel = `${selectedOptions.length} selected`
  }

  return (
    <Popover
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setQuery("")
        }
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <Button
          aria-label={ariaLabel}
          aria-expanded={open}
          className="h-10 w-full justify-between rounded border-slate-800 bg-slate-800/60 px-3.5 text-left text-[15px] font-normal text-slate-100 shadow-none hover:bg-slate-800 hover:text-slate-100 aria-expanded:bg-slate-800 aria-expanded:text-slate-100"
          role="combobox"
          variant="outline"
        >
          <span
            className={cn(
              "truncate",
              (selectedOptions.length === 0 ||
                (placeholderWhenAllSelected &&
                  selectedOptions.length === options.length &&
                  options.length > 0)) &&
                "text-slate-500"
            )}
          >
            {triggerLabel}
          </span>
          <ChevronDown className="size-4 shrink-0 text-slate-500 opacity-90" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] rounded p-0">
        <div className="border-b border-slate-800 p-3">
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            value={query}
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = selectedValues.has(option.value)

              return (
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                  key={option.value}
                  onClick={() => {
                    const nextSelectedValues = new Set(selectedValues)

                    if (isSelected) {
                      nextSelectedValues.delete(option.value)
                    } else {
                      nextSelectedValues.add(option.value)
                    }

                    onSelectedValuesChange(nextSelectedValues)
                  }}
                  type="button"
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-sm border border-slate-700",
                      isSelected
                        ? "bg-sky-500 text-slate-950"
                        : "bg-transparent text-transparent"
                    )}
                  >
                    <Check className="size-3" />
                  </span>
                  <span>{option.label}</span>
                </button>
              )
            })
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">
              {emptyText}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
