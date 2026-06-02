"use client"

import { Check, ChevronsUpDown } from "lucide-react"
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
          className="h-16 w-full justify-between rounded-md border-0 bg-slate-900 px-5 text-left text-[18px] font-normal text-slate-200 shadow-none hover:bg-slate-900"
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
                "text-slate-400"
            )}
          >
            {triggerLabel}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-slate-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="border-b border-slate-800 p-3">
          <Input
            className="border-slate-800 bg-slate-900 text-sm text-slate-100 placeholder:text-slate-500"
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
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-slate-100 hover:bg-slate-900"
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
