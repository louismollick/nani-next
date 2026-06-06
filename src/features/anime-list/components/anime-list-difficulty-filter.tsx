import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AnimeListDifficultyRange } from "@/features/anime-list/components/anime-list-difficulty-range"
import {
  type DifficultyFilterMode,
  difficultyFilterModes,
} from "@/features/anime-list/domain/anime-list-enums"
import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import { difficultyFilterModeLabels } from "@/features/anime-list/lib/labels"
import type { NumericRange } from "@/features/anime-list/lib/range-utils"

export function AnimeListDifficultyFilter({
  activeDifficultyBounds,
  activeDifficultyRange,
  searchState,
  updateSearchState,
}: {
  activeDifficultyBounds: NumericRange | null
  activeDifficultyRange: NumericRange | null
  searchState: LookupSearchState
  updateSearchState: (
    updater: (previousState: LookupSearchState) => LookupSearchState
  ) => void
}) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-label text-muted-foreground">
          Difficulty filter
        </Label>
        <Select
          onValueChange={(value) =>
            updateSearchState((previousState) => ({
              ...previousState,
              difficultyFilterMode: value as DifficultyFilterMode,
            }))
          }
          value={searchState.difficultyFilterMode}
        >
          <SelectTrigger aria-label="Difficulty filter" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            className="w-(var(--radix-select-trigger-width))"
            position="popper"
          >
            {difficultyFilterModes.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {difficultyFilterModeLabels[mode]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {searchState.difficultyFilterMode !== "none" ? (
        <AnimeListDifficultyRange
          activeDifficultyBounds={activeDifficultyBounds}
          activeDifficultyRange={activeDifficultyRange}
          searchState={searchState}
          updateSearchState={updateSearchState}
        />
      ) : null}
    </>
  )
}
