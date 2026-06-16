import { createServerFn } from "@tanstack/react-start"
import { normalizeAnimeFormat } from "@/features/anime-list/lib/anime-metadata-filters"
import { buildAnimeListOverlapResults } from "@/features/anime-list/server/build-overlap-results"
import {
  loadJpdbAnimeDifficultySnapshot,
  loadLearnNativelyAnimationLevelsSnapshot,
} from "@/features/anime-list/server/load-anime-difficulty-snapshots"
import { loadJimakuSnapshot } from "@/features/anime-list/server/load-jimaku-snapshot"
import { getAniListRateLimitMeta } from "@/lib/anilist-rate-limit"
import type {
  AnimeEntry,
  AnimeSearchSuggestion,
  LookupResponse,
  MediaStatus,
} from "@/lib/types"

const anilistEndpoint = "https://graphql.anilist.co"
const searchPageSize = 50
const suggestionPageSize = 8

type SearchAniListInput = {
  page: number
  query: string
}

type SearchAniListMedia = {
  id: number
  idMal: number | null
  episodes: number | null
  seasonYear: number | null
  duration: number | null
  averageScore: number | null
  popularity: number | null
  status: MediaStatus
  nextAiringEpisode?: { episode: number | null } | null
  genres: string[]
  format: string | null
  siteUrl: string
  synonyms: string[]
  coverImage: {
    large: string
    color: string | null
  }
  title: {
    romaji: string | null
    english: string | null
    native: string | null
  }
}

type SearchAniListPayload = {
  data?: {
    Page: {
      pageInfo: {
        currentPage: number
        hasNextPage: boolean
        total: number | null
      }
      media: SearchAniListMedia[]
    }
  }
  errors?: Array<{ message: string }>
}

const mediaSelection = `
  id
  idMal
  episodes
  seasonYear
  duration
  averageScore
  popularity
  status
  nextAiringEpisode { episode }
  genres
  format
  siteUrl
  synonyms
  coverImage { large color }
  title { romaji english native }
`

const searchQuery = `
  query SearchAnime($page: Int!, $perPage: Int!, $search: String!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage total }
      media(type: ANIME, search: $search, sort: [POPULARITY_DESC]) {
        ${mediaSelection}
      }
    }
  }
`

function getReleasedEpisodes(media: SearchAniListMedia): number | null {
  if (media.status === "FINISHED") {
    return media.episodes
  }

  if (media.status !== "RELEASING") {
    return null
  }

  const nextEpisode = media.nextAiringEpisode?.episode

  if (typeof nextEpisode === "number") {
    return Math.max(nextEpisode - 1, 0)
  }

  return null
}

function toAnimeEntry(media: SearchAniListMedia): AnimeEntry {
  return {
    source: "anilist",
    id: media.id,
    status: null,
    score: null,
    progress: null,
    media: {
      id: media.id,
      anilistId: media.id,
      myanimelistId: media.idMal,
      episodes: media.episodes,
      releasedEpisodes: getReleasedEpisodes(media),
      averageScore: media.averageScore,
      popularity: media.popularity,
      status: media.status,
      genres: media.genres,
      format: normalizeAnimeFormat(media.format),
      year: media.seasonYear,
      duration: media.duration,
      siteUrl: media.siteUrl,
      synonyms: media.synonyms,
      coverImage: media.coverImage,
      title: {
        primary: media.title.romaji,
        english: media.title.english,
        native: media.title.native,
      },
    },
  }
}

function toSuggestion(media: SearchAniListMedia): AnimeSearchSuggestion {
  return {
    id: media.id,
    coverImage: media.coverImage,
    format: normalizeAnimeFormat(media.format),
    title: {
      primary: media.title.romaji,
      english: media.title.english,
      native: media.title.native,
    },
    year: media.seasonYear,
  }
}

async function requestAniListPage({
  page,
  perPage,
  query,
}: {
  page: number
  perPage: number
  query: string
}) {
  const response = await fetch(anilistEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      query: searchQuery,
      variables: {
        page,
        perPage,
        search: query,
      },
    }),
  })

  if (response.status === 429) {
    const rateLimit = getAniListRateLimitMeta(response.headers)

    return {
      ok: false,
      code: "RATE_LIMITED",
      message: "AniList rate limit hit. Wait a moment and try again.",
      retryAfterMs: rateLimit.retryAfterMs,
      resetAtMs: rateLimit.resetAtMs,
      cooldownUntilMs: rateLimit.cooldownUntilMs,
      rateLimitLimit: rateLimit.rateLimitLimit,
      rateLimitRemaining: rateLimit.rateLimitRemaining,
    } satisfies Exclude<LookupResponse, { ok: true }>
  }

  const payload = (await response.json()) as SearchAniListPayload

  if (!response.ok || payload.errors?.length) {
    return {
      ok: false,
      code: "UPSTREAM_ERROR",
      message: payload.errors?.[0]?.message ?? "AniList request failed.",
    } satisfies Exclude<LookupResponse, { ok: true }>
  }

  return payload.data?.Page ?? null
}

export async function searchAniListByTitle(
  input: SearchAniListInput
): Promise<LookupResponse> {
  const query = input.query.trim()

  if (!query) {
    return {
      ok: false,
      code: "UPSTREAM_ERROR",
      message: "Enter an anime title.",
    }
  }

  const pageData = await requestAniListPage({
    page: input.page,
    perPage: searchPageSize,
    query,
  })

  if (!pageData || "ok" in pageData) {
    return (
      pageData ?? {
        ok: false,
        code: "UPSTREAM_ERROR",
        message: "AniList request failed.",
      }
    )
  }

  const entries = pageData.media
    .filter((media) => media.status !== "NOT_YET_RELEASED")
    .map(toAnimeEntry)
  const [jimakuEntries, jpdbEntries, learnNativelyEntries] = await Promise.all([
    loadJimakuSnapshot(),
    loadJpdbAnimeDifficultySnapshot(),
    loadLearnNativelyAnimationLevelsSnapshot(),
  ])
  const results = buildAnimeListOverlapResults(
    entries,
    jimakuEntries,
    jpdbEntries,
    learnNativelyEntries
  )

  return {
    ok: true,
    source: "anilist",
    username: query,
    fetchedAt: new Date().toISOString(),
    totalAnime: pageData.pageInfo.total ?? results.length,
    matchedCount: results.filter((result) => result.matchedJimaku).length,
    pageInfo: pageData.pageInfo,
    results,
  }
}

export async function getAniListTitleSuggestions(query: string) {
  const trimmedQuery = query.trim()

  if (trimmedQuery.length < 2) {
    return []
  }

  const pageData = await requestAniListPage({
    page: 1,
    perPage: suggestionPageSize,
    query: trimmedQuery,
  })

  if (!pageData || "ok" in pageData) {
    return []
  }

  return pageData.media
    .filter((media) => media.status !== "NOT_YET_RELEASED")
    .map(toSuggestion)
}

function validateSearchInput(data: unknown): SearchAniListInput {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid search input.")
  }

  const input = data as Partial<SearchAniListInput>

  if (typeof input.query !== "string") {
    throw new Error("Query is required.")
  }

  if (typeof input.page !== "number" || input.page < 1) {
    throw new Error("Page is required.")
  }

  return {
    page: input.page,
    query: input.query,
  }
}

function validateSuggestionsInput(data: unknown) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid suggestions input.")
  }

  const input = data as { query?: unknown }

  if (typeof input.query !== "string") {
    throw new Error("Query is required.")
  }

  return { query: input.query }
}

export const searchAniListTitles = createServerFn({ method: "POST" })
  .inputValidator(validateSearchInput)
  .handler(async ({ data }) => searchAniListByTitle(data))

export const suggestAniListTitles = createServerFn({ method: "GET" })
  .inputValidator(validateSuggestionsInput)
  .handler(async ({ data }) => getAniListTitleSuggestions(data.query))
