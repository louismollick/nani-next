import { normalizeTitle, titleTokens, uniqStrings } from "@/lib/normalize"
import type {
  AnimeEntry,
  DatasetMatch,
  JimakuEntry,
  JpdbAnimeDifficultyEntry,
  LearnNativelyAnimationLevelEntry,
  MatchCandidate,
  MatchReason,
} from "@/lib/types"

const fuzzyThreshold = 0.82
const lowConfidenceThreshold = 0.9
const ambiguousMargin = 0.12
const minimumTokenOverlap = 0.6

type PreparedTitle = {
  raw: string
  bigrams: Set<string>
  normalized: string
  tokens: Set<string>
}

type PreparedDatasetEntry<TEntry> = {
  entry: TEntry
  preparedTitles: PreparedTitle[]
}

type TitleMatcherCandidate<TEntry> = {
  entry: TEntry
  score: number
  tokenScore: number
  reason: MatchReason
}

type TitleMatcherResult<TEntry> = {
  matchedEntry: TEntry
  alternates: TitleMatcherCandidate<TEntry>[]
  matchScore: number
  matchReason: MatchReason
  isAmbiguous: boolean
  isLowConfidence: boolean
}

type TitleMatcherOptions<TEntry> = {
  entries: TEntry[]
  getTitles: (entry: TEntry) => string[]
}

type AnimeMatcher = (entry: AnimeEntry) => {
  matchedJimaku: JimakuEntry
  alternates: MatchCandidate[]
  matchScore: number
  matchReason: MatchReason
  isAmbiguous: boolean
  isLowConfidence: boolean
} | null

const matcherCache = new WeakMap<JimakuEntry[], AnimeMatcher>()
const datasetMatcherCache = new WeakMap<object, unknown>()

function bigramsFromNormalized(normalized: string) {
  const collapsed = normalized.replace(/\s+/g, "")

  if (collapsed.length < 2) {
    return new Set([collapsed])
  }

  const result = new Set<string>()

  for (let index = 0; index < collapsed.length - 1; index += 1) {
    result.add(collapsed.slice(index, index + 2))
  }

  return result
}

function prepareTitle(value: string): PreparedTitle {
  const normalized = normalizeTitle(value)

  return {
    raw: value,
    normalized,
    bigrams: bigramsFromNormalized(normalized),
    tokens: new Set(titleTokens(value)),
  }
}

function diceCoefficient(leftBigrams: Set<string>, rightBigrams: Set<string>) {
  let overlap = 0

  for (const gram of leftBigrams) {
    if (rightBigrams.has(gram)) {
      overlap += 1
    }
  }

  return (2 * overlap) / (leftBigrams.size + rightBigrams.size || 1)
}

function tokenOverlap(leftTokens: Set<string>, rightTokens: Set<string>) {
  let overlap = 0

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1
    }
  }

  return overlap / Math.max(leftTokens.size, rightTokens.size, 1)
}

function titleSimilarity(left: PreparedTitle, right: PreparedTitle) {
  return (
    diceCoefficient(left.bigrams, right.bigrams) * 0.7 +
    tokenOverlap(left.tokens, right.tokens) * 0.3
  )
}

function strongestTokenOverlap(left: PreparedTitle, right: PreparedTitle) {
  return tokenOverlap(left.tokens, right.tokens)
}

export function getEntryTitles(entry: AnimeEntry) {
  return uniqStrings([
    entry.media.title.primary,
    entry.media.title.english,
    entry.media.title.native,
    ...entry.media.synonyms,
  ])
}

function buildTitleMatch<TEntry>(
  matchedEntry: TEntry,
  alternates: TitleMatcherCandidate<TEntry>[],
  matchScore: number,
  matchReason: MatchReason,
  isAmbiguous: boolean,
  isLowConfidence: boolean
): TitleMatcherResult<TEntry> {
  return {
    matchedEntry,
    alternates,
    matchScore,
    matchReason,
    isAmbiguous,
    isLowConfidence,
  }
}

function buildDatasetMatcher<TEntry>({
  entries,
  getTitles,
}: TitleMatcherOptions<TEntry>) {
  const normalizedTitleMap = new Map<string, TEntry[]>()
  const tokenIndex = new Map<string, Set<number>>()
  const preparedEntries: PreparedDatasetEntry<TEntry>[] = entries.map(
    (entry, index) => {
      const titles = uniqStrings(getTitles(entry))
      const normalizedTitles = titles.map(normalizeTitle).filter(Boolean)

      for (const normalizedTitle of normalizedTitles) {
        const matches = normalizedTitleMap.get(normalizedTitle)

        if (matches) {
          matches.push(entry)
        } else {
          normalizedTitleMap.set(normalizedTitle, [entry])
        }
      }

      for (const token of new Set(titles.flatMap(titleTokens))) {
        const matches = tokenIndex.get(token)

        if (matches) {
          matches.add(index)
        } else {
          tokenIndex.set(token, new Set([index]))
        }
      }

      return {
        entry,
        preparedTitles: titles.map(prepareTitle),
      }
    }
  )

  return (entry: AnimeEntry) => {
    const entryTitles = getEntryTitles(entry)
    const preparedEntryTitles = entryTitles.map(prepareTitle)
    const normalizedTitles = new Set(
      preparedEntryTitles.map((title) => title.normalized)
    )

    for (const normalizedTitle of normalizedTitles) {
      const exactTitleMatches = normalizedTitleMap.get(normalizedTitle)

      if (exactTitleMatches?.[0]) {
        return buildTitleMatch(
          exactTitleMatches[0],
          [],
          0.98,
          "exact-title",
          false,
          false
        )
      }
    }

    const hasMultiTokenTitle = preparedEntryTitles.some(
      (title) => title.tokens.size > 1
    )

    if (!hasMultiTokenTitle) {
      return null
    }

    const candidateIndexes = new Set<number>()

    for (const preparedTitle of preparedEntryTitles) {
      for (const token of preparedTitle.tokens) {
        const matches = tokenIndex.get(token)

        if (!matches) {
          continue
        }

        for (const matchIndex of matches) {
          candidateIndexes.add(matchIndex)
        }
      }
    }

    const candidates = [...candidateIndexes].length
      ? [...candidateIndexes].map((index) => {
          const matchedEntry = preparedEntries[index]
          let score = 0
          let tokenScore = 0

          for (const entryTitle of preparedEntryTitles) {
            for (const candidateTitle of matchedEntry.preparedTitles) {
              score = Math.max(
                score,
                titleSimilarity(entryTitle, candidateTitle)
              )
              tokenScore = Math.max(
                tokenScore,
                strongestTokenOverlap(entryTitle, candidateTitle)
              )
            }
          }

          return {
            entry: matchedEntry.entry,
            score,
            tokenScore,
            reason: "fuzzy" as MatchReason,
          }
        })
      : preparedEntries.map((matchedEntry) => {
          let score = 0
          let tokenScore = 0

          for (const entryTitle of preparedEntryTitles) {
            for (const candidateTitle of matchedEntry.preparedTitles) {
              score = Math.max(
                score,
                titleSimilarity(entryTitle, candidateTitle)
              )
              tokenScore = Math.max(
                tokenScore,
                strongestTokenOverlap(entryTitle, candidateTitle)
              )
            }
          }

          return {
            entry: matchedEntry.entry,
            score,
            tokenScore,
            reason: "fuzzy" as MatchReason,
          }
        })

    const filteredCandidates = candidates
      .filter(
        (candidate) =>
          candidate.score >= fuzzyThreshold &&
          candidate.tokenScore >= minimumTokenOverlap
      )
      .sort((left, right) => right.score - left.score)

    const topCandidate = filteredCandidates[0]

    if (!topCandidate) {
      return null
    }

    const runnerUp = filteredCandidates[1]

    if (runnerUp && topCandidate.score - runnerUp.score < ambiguousMargin) {
      return null
    }

    const alternates = filteredCandidates
      .slice(1, 4)
      .filter(
        (candidate) => candidate.score >= topCandidate.score - ambiguousMargin
      )

    return buildTitleMatch(
      topCandidate.entry,
      alternates,
      topCandidate.score,
      "fuzzy",
      alternates.length > 0,
      topCandidate.score < lowConfidenceThreshold
    )
  }
}

function buildAnimeMatcher(jimakuEntries: JimakuEntry[]): AnimeMatcher {
  const byAniListId = new Map<number, JimakuEntry>()
  const byMyAnimeListId = new Map<number, JimakuEntry>()

  for (const jimakuEntry of jimakuEntries) {
    if (jimakuEntry.anilistId !== null) {
      byAniListId.set(jimakuEntry.anilistId, jimakuEntry)
    }

    if (jimakuEntry.myanimelistId !== null) {
      byMyAnimeListId.set(jimakuEntry.myanimelistId, jimakuEntry)
    }
  }

  const titleMatcher = buildDatasetMatcher({
    entries: jimakuEntries,
    getTitles: (entry) => entry.titles,
  })

  return (entry) => {
    if (entry.media.anilistId !== null) {
      const matchedJimaku = byAniListId.get(entry.media.anilistId)

      if (matchedJimaku) {
        return {
          matchedJimaku,
          alternates: [],
          matchScore: 1,
          matchReason: "anilist-id",
          isAmbiguous: false,
          isLowConfidence: false,
        }
      }
    }

    if (entry.media.myanimelistId !== null) {
      const matchedJimaku = byMyAnimeListId.get(entry.media.myanimelistId)

      if (matchedJimaku) {
        return {
          matchedJimaku,
          alternates: [],
          matchScore: 1,
          matchReason: "myanimelist-id",
          isAmbiguous: false,
          isLowConfidence: false,
        }
      }
    }

    const matched = titleMatcher(entry)

    if (!matched) {
      return null
    }

    return {
      matchedJimaku: matched.matchedEntry as JimakuEntry,
      alternates: matched.alternates.map((candidate) => ({
        jimakuEntry: candidate.entry as JimakuEntry,
        score: candidate.score,
        reason: candidate.reason,
      })),
      matchScore: matched.matchScore,
      matchReason: matched.matchReason,
      isAmbiguous: matched.isAmbiguous,
      isLowConfidence: matched.isLowConfidence,
    }
  }
}

function getCachedDatasetMatcher<TEntry>(
  entries: TEntry[],
  getTitles: (entry: TEntry) => string[]
) {
  let matcher = datasetMatcherCache.get(entries) as
    | ((entry: AnimeEntry) => TitleMatcherResult<TEntry> | null)
    | undefined

  if (!matcher) {
    matcher = buildDatasetMatcher({
      entries,
      getTitles,
    })
    datasetMatcherCache.set(entries, matcher)
  }

  return matcher
}

function toDatasetMatch<TEntry>(
  matched: TitleMatcherResult<TEntry> | null
): DatasetMatch<TEntry> | null {
  if (!matched) {
    return null
  }

  return {
    entry: matched.matchedEntry,
    matchScore: matched.matchScore,
    matchReason: matched.matchReason,
    isLowConfidence: matched.isLowConfidence,
  }
}

export function matchAnime(entry: AnimeEntry, jimakuEntries: JimakuEntry[]) {
  let matcher = matcherCache.get(jimakuEntries)

  if (!matcher) {
    matcher = buildAnimeMatcher(jimakuEntries)
    matcherCache.set(jimakuEntries, matcher)
  }

  return matcher(entry)
}

export function matchJpdbAnimeDifficulty(
  entry: AnimeEntry,
  jpdbEntries: JpdbAnimeDifficultyEntry[]
) {
  return toDatasetMatch(
    getCachedDatasetMatcher(jpdbEntries, (jpdbEntry) => [jpdbEntry.name])(entry)
  )
}

export function matchLearnNativelyAnimationLevel(
  entry: AnimeEntry,
  learnNativelyEntries: LearnNativelyAnimationLevelEntry[]
) {
  return toDatasetMatch(
    getCachedDatasetMatcher(learnNativelyEntries, (learnNativelyEntry) => [
      learnNativelyEntry.name,
    ])(entry)
  )
}
