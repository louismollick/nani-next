import { Slider } from "@/components/ui/slider"
import type { LookupSearchState } from "@/features/anime-list/lib/anime-list-search-state"
import { difficultyFilterModeLabels } from "@/features/anime-list/lib/labels"
import {
  type NumericRange,
  normalizeStoredRange,
} from "@/features/anime-list/lib/range-utils"
import { formatDifficultyRangeValue } from "@/features/anime-list/lib/result-presenters"

export function AnimeListDifficultyRange({
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
  if (!activeDifficultyBounds || !activeDifficultyRange) {
    return (
      <p className="text-sm text-muted-foreground">
        No results currently have data for this filter.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>Allowed range</span>
        <span className="font-medium text-foreground">
          {formatDifficultyRangeValue(
            searchState.difficultyFilterMode,
            activeDifficultyRange[0]
          )}{" "}
          -{" "}
          {formatDifficultyRangeValue(
            searchState.difficultyFilterMode,
            activeDifficultyRange[1]
          )}
        </span>
      </div>
      <Slider
        aria-label={`${difficultyFilterModeLabels[searchState.difficultyFilterMode]} range`}
        className="py-1"
        max={activeDifficultyBounds[1]}
        min={activeDifficultyBounds[0]}
        onValueChange={(nextRange) =>
          updateSearchState((previousState) =>
            applyDifficultyRange(
              previousState,
              nextRange,
              activeDifficultyBounds
            )
          )
        }
        step={searchState.difficultyFilterMode === "jitenDifficulty" ? 0.1 : 1}
        value={activeDifficultyRange}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatDifficultyRangeValue(
            searchState.difficultyFilterMode,
            activeDifficultyBounds[0]
          )}
        </span>
        <span>
          {formatDifficultyRangeValue(
            searchState.difficultyFilterMode,
            activeDifficultyBounds[1]
          )}
        </span>
      </div>
    </div>
  )
}

function applyDifficultyRange(
  previousState: LookupSearchState,
  nextRange: number[],
  bounds: NumericRange
) {
  if (nextRange.length !== 2) {
    return previousState
  }

  const normalizedNextRange = [
    Math.min(nextRange[0], nextRange[1]),
    Math.max(nextRange[0], nextRange[1]),
  ] as NumericRange

  return {
    ...previousState,
    jpdbDifficultyRange:
      previousState.difficultyFilterMode === "jpdbAverageDifficulty"
        ? normalizeStoredRange(normalizedNextRange, bounds)
        : previousState.jpdbDifficultyRange,
    jitenDifficultyRange:
      previousState.difficultyFilterMode === "jitenDifficulty"
        ? normalizeStoredRange(normalizedNextRange, bounds)
        : previousState.jitenDifficultyRange,
    learnNativelyLevelRange:
      previousState.difficultyFilterMode === "learnNativelyLevel"
        ? normalizeStoredRange(normalizedNextRange, bounds)
        : previousState.learnNativelyLevelRange,
    learnNativelyJlptRange:
      previousState.difficultyFilterMode === "learnNativelyJlptEquivalent"
        ? normalizeStoredRange(normalizedNextRange, bounds)
        : previousState.learnNativelyJlptRange,
  }
}
