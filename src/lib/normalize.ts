const punctuationRegex = /["'`´’‘“”.,!?()[\]{}:_*+~]/g
const separatorRegex = /[\s/\\|&-]+/g

export function normalizeTitle(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/×/g, " x ")
    .replace(punctuationRegex, " ")
    .replace(separatorRegex, " ")
    .replace(/\b(ova|ona|tv|the animation|movie|season)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function uniqStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const trimmed = value?.trim()

    if (!trimmed || seen.has(trimmed)) {
      continue
    }

    seen.add(trimmed)
    result.push(trimmed)
  }

  return result
}

export function titleTokens(value: string) {
  return normalizeTitle(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
}
