import { normalizeTitle, titleTokens, uniqStrings } from "@/lib/normalize"
import type {
  AniListEntry,
  JimakuEntry,
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

type PreparedJimakuEntry = {
  entry: JimakuEntry
  preparedTitles: PreparedTitle[]
}

const matcherCache = new WeakMap<
  JimakuEntry[],
  (entry: AniListEntry) => ReturnType<typeof buildMatch> | null
>()

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

export function getAniListTitles(entry: AniListEntry) {
  return uniqStrings([
    entry.media.title.romaji,
    entry.media.title.english,
    entry.media.title.native,
    ...entry.media.synonyms,
  ])
}

function buildMatch(
  matchedJimaku: JimakuEntry,
  alternates: MatchCandidate[],
  matchScore: number,
  matchReason: MatchReason,
  isAmbiguous: boolean,
  isLowConfidence: boolean
) {
  return {
    matchedJimaku,
    alternates,
    matchScore,
    matchReason,
    isAmbiguous,
    isLowConfidence,
  }
}

function buildMatcher(jimakuEntries: JimakuEntry[]) {
  const idMap = new Map<number, JimakuEntry>()
  const normalizedTitleMap = new Map<string, JimakuEntry[]>()
  const tokenIndex = new Map<string, Set<number>>()
  const preparedEntries: PreparedJimakuEntry[] = jimakuEntries.map(
    (jimakuEntry, index) => {
      if (jimakuEntry.anilistId) {
        idMap.set(jimakuEntry.anilistId, jimakuEntry)
      }

      for (const normalizedTitle of jimakuEntry.normalizedTitles) {
        const matches = normalizedTitleMap.get(normalizedTitle)

        if (matches) {
          matches.push(jimakuEntry)
        } else {
          normalizedTitleMap.set(normalizedTitle, [jimakuEntry])
        }
      }

      for (const token of new Set(jimakuEntry.titles.flatMap(titleTokens))) {
        const matches = tokenIndex.get(token)

        if (matches) {
          matches.add(index)
        } else {
          tokenIndex.set(token, new Set([index]))
        }
      }

      return {
        entry: jimakuEntry,
        preparedTitles: jimakuEntry.titles.map(prepareTitle),
      }
    }
  )

  return (entry: AniListEntry) => {
    if (entry.media.id) {
      const byId = idMap.get(entry.media.id)

      if (byId) {
        return buildMatch(byId, [], 1, "anilist-id", false, false)
      }
    }

    const aniListTitles = getAniListTitles(entry)
    const preparedAniListTitles = aniListTitles.map(prepareTitle)
    const normalizedTitles = new Set(
      preparedAniListTitles.map((title) => title.normalized)
    )

    for (const normalizedTitle of normalizedTitles) {
      const exactTitleMatches = normalizedTitleMap.get(normalizedTitle)

      if (exactTitleMatches?.[0]) {
        return buildMatch(
          exactTitleMatches[0],
          [],
          0.98,
          "exact-title",
          false,
          false
        )
      }
    }

    const hasMultiTokenAniListTitle = preparedAniListTitles.some(
      (title) => title.tokens.size > 1
    )

    if (!hasMultiTokenAniListTitle) {
      return null
    }

    // Use the AniList title tokens to avoid scoring the full Jimaku catalog.
    const candidateIndexes = new Set<number>()

    for (const preparedTitle of preparedAniListTitles) {
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
          const jimakuEntry = preparedEntries[index]
          let score = 0
          let tokenScore = 0

          for (const aniListTitle of preparedAniListTitles) {
            for (const jimakuTitle of jimakuEntry.preparedTitles) {
              score = Math.max(
                score,
                titleSimilarity(aniListTitle, jimakuTitle)
              )
              tokenScore = Math.max(
                tokenScore,
                strongestTokenOverlap(aniListTitle, jimakuTitle)
              )
            }
          }

          return {
            jimakuEntry: jimakuEntry.entry,
            score,
            tokenScore,
            reason: "fuzzy" as MatchReason,
          }
        })
      : preparedEntries.map((jimakuEntry) => {
          let score = 0
          let tokenScore = 0

          for (const aniListTitle of preparedAniListTitles) {
            for (const jimakuTitle of jimakuEntry.preparedTitles) {
              score = Math.max(
                score,
                titleSimilarity(aniListTitle, jimakuTitle)
              )
              tokenScore = Math.max(
                tokenScore,
                strongestTokenOverlap(aniListTitle, jimakuTitle)
              )
            }
          }

          return {
            jimakuEntry: jimakuEntry.entry,
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

    return buildMatch(
      topCandidate.jimakuEntry,
      alternates,
      topCandidate.score,
      "fuzzy",
      alternates.length > 0,
      topCandidate.score < lowConfidenceThreshold
    )
  }
}

export function matchAnime(entry: AniListEntry, jimakuEntries: JimakuEntry[]) {
  let matcher = matcherCache.get(jimakuEntries)

  if (!matcher) {
    matcher = buildMatcher(jimakuEntries)
    matcherCache.set(jimakuEntries, matcher)
  }

  return matcher(entry)
}
