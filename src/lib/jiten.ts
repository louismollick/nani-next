export function normalizeJitenDifficulty(difficultyRaw: number) {
  return Math.round(difficultyRaw * 10) / 10
}
