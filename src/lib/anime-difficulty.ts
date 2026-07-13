import jitenAnimeDifficultySnapshot from "@/data/jiten-anime-difficulty.json"
import jpdbAnimeDifficultySnapshot from "@/data/jpdb-anime-difficulty.json"
import learnNativelyAnimationLevelsSnapshot from "@/data/learnnatively-animation-levels.json"
import type {
  JitenAnimeDifficultyEntry,
  JpdbAnimeDifficultyEntry,
  LearnNativelyAnimationLevelEntry,
  LearnNativelyJlptEquivalent,
} from "@/lib/types"

let cachedJpdbAnimeDifficultySnapshot: JpdbAnimeDifficultyEntry[] | null = null
let cachedJitenAnimeDifficultySnapshot: JitenAnimeDifficultyEntry[] | null =
  null
let cachedLearnNativelyAnimationLevelsSnapshot:
  | LearnNativelyAnimationLevelEntry[]
  | null = null

export function loadJpdbAnimeDifficultySnapshot() {
  if (cachedJpdbAnimeDifficultySnapshot) {
    return cachedJpdbAnimeDifficultySnapshot
  }

  cachedJpdbAnimeDifficultySnapshot =
    jpdbAnimeDifficultySnapshot as JpdbAnimeDifficultyEntry[]

  return cachedJpdbAnimeDifficultySnapshot
}

export function loadJitenAnimeDifficultySnapshot() {
  if (!cachedJitenAnimeDifficultySnapshot) {
    cachedJitenAnimeDifficultySnapshot =
      jitenAnimeDifficultySnapshot as JitenAnimeDifficultyEntry[]
  }
  return cachedJitenAnimeDifficultySnapshot
}

export function getJitenDifficulty(entry: JitenAnimeDifficultyEntry) {
  return Math.round(entry.difficultyRaw * 10) / 10
}

export function loadLearnNativelyAnimationLevelsSnapshot() {
  if (cachedLearnNativelyAnimationLevelsSnapshot) {
    return cachedLearnNativelyAnimationLevelsSnapshot
  }

  cachedLearnNativelyAnimationLevelsSnapshot =
    learnNativelyAnimationLevelsSnapshot as LearnNativelyAnimationLevelEntry[]

  return cachedLearnNativelyAnimationLevelsSnapshot
}

export function getLearnNativelyLevelNumber(level: string) {
  const match = level.match(/^L(\d+)$/i)

  if (!match) {
    return null
  }

  return Number.parseInt(match[1], 10)
}

export function getLearnNativelyJlptEquivalentFromLevelNumber(
  levelNumber: number
): LearnNativelyJlptEquivalent {
  if (levelNumber <= 12) {
    return "N5"
  }

  if (levelNumber <= 19) {
    return "N4"
  }

  if (levelNumber <= 26) {
    return "N3"
  }

  if (levelNumber <= 33) {
    return "N2"
  }

  if (levelNumber <= 40) {
    return "N1"
  }

  return "N1+"
}

export function getLearnNativelyJlptEquivalent(level: string) {
  const levelNumber = getLearnNativelyLevelNumber(level)

  if (levelNumber === null) {
    return null
  }

  return getLearnNativelyJlptEquivalentFromLevelNumber(levelNumber)
}
