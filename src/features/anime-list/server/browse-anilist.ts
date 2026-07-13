import { createServerFn } from "@tanstack/react-start"
import type { AnimeFormat } from "@/features/anime-list/domain/anime-list-enums"
import {
  durationFilterBounds,
  episodeFilterBounds,
  getYearFilterBounds,
  hasUnboundedUpperBound,
  normalizeAnimeFormat,
} from "@/features/anime-list/lib/anime-metadata-filters"
import type { NumericRange } from "@/features/anime-list/lib/range-utils"
import {
  buildAnimeListOverlapResults,
  sortAnimeListOverlapResults,
} from "@/features/anime-list/server/build-overlap-results"
import {
  loadJitenAnimeDifficultySnapshot,
  loadJpdbAnimeDifficultySnapshot,
  loadLearnNativelyAnimationLevelsSnapshot,
} from "@/features/anime-list/server/load-anime-difficulty-snapshots"
import { loadJimakuSnapshot } from "@/features/anime-list/server/load-jimaku-snapshot"
import { getAniListRateLimitMeta } from "@/lib/anilist-rate-limit"
import { normalizeJitenDifficulty } from "@/lib/jiten"
import type {
  AnimeEntry,
  LookupResponse,
  MediaStatus,
  MyAnimeFilterMode,
  OverlapResult,
  WatchStatus,
} from "@/lib/types"

const anilistEndpoint = "https://graphql.anilist.co"
const pageSize = 50
const maxAniListPages = 100
const userListTtlMs = 60 * 60 * 1000
const browseTtlMs = 6 * 60 * 60 * 1000
const maxFetchLoops = 25

export type BrowseInput = {
  username: string
  page: number
  search: {
    titleQuery: string
    myAnimeFilterMode: MyAnimeFilterMode
    selectedGenres: string[]
    selectedMediaStatuses: Exclude<MediaStatus, null>[]
    selectedFormats: AnimeFormat[]
    selectedSubtitleAvailability: Array<"all" | "some" | "none">
    yearRange: NumericRange | null
    episodeRange: NumericRange | null
    durationRange: NumericRange | null
    sortBy:
      | "averageScore"
      | "popularity"
      | "jpdbAverageDifficulty"
      | "jitenDifficulty"
      | "learnNativelyLevel"
      | "title"
      | "status"
    sortDirection: "asc" | "desc"
  }
}

type AniListBrowseMedia = {
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

type AniListBrowsePayload = {
  data?: {
    Page: {
      pageInfo: {
        currentPage: number
        hasNextPage: boolean
        total: number | null
      }
      media: AniListBrowseMedia[]
    }
  }
  errors?: Array<{ message: string }>
}

type AniListMembershipPayload = {
  data?: {
    MediaListCollection: {
      lists: Array<{
        entries: Array<{
          id: number
          status:
            | "CURRENT"
            | "PLANNING"
            | "COMPLETED"
            | "PAUSED"
            | "DROPPED"
            | "REPEATING"
          score: number | null
          progress: number | null
          media: AniListBrowseMedia
        }>
      }>
    } | null
  }
  errors?: Array<{ message: string }>
}

type CachedValue<TValue> = {
  expiresAt: number
  value: TValue
}

type LookupError = Extract<LookupResponse, { ok: false }>
type BrowsePageResponse = Extract<LookupResponse, { ok: true }>
type BrowseSearch = BrowseInput["search"]

type BrowseQueryState = {
  collectedEntries: AnimeEntry[]
  enrichedResults: OverlapResult[]
  hasNextAniListPage: boolean
  hiddenIds: number[]
  hitCap: boolean
  jimakuEntries: Awaited<ReturnType<typeof loadJimakuSnapshot>>
  jpdbEntries: Awaited<ReturnType<typeof loadJpdbAnimeDifficultySnapshot>>
  jitenEntries: Awaited<ReturnType<typeof loadJitenAnimeDifficultySnapshot>>
  learnNativelyEntries: Awaited<
    ReturnType<typeof loadLearnNativelyAnimationLevelsSnapshot>
  >
  loops: number
  membershipEntries: AnimeEntry[]
  membershipMap: Map<number, AnimeEntry>
  nextAniListPage: number
  search: BrowseSearch
  seenMediaIds: Set<number>
  total: number | null
  trimmedUsername: string
}

const userListCache = new Map<string, CachedValue<AnimeEntry[]>>()
const browsePageCache = new Map<string, CachedValue<LookupResponse>>()
const rawAniListPageCache = new Map<
  string,
  CachedValue<NonNullable<AniListBrowsePayload["data"]>["Page"]>
>()
const browseQueryCache = new Map<string, CachedValue<BrowseQueryState>>()
const membershipInFlight = new Map<string, Promise<AnimeEntry[]>>()
const browsePageInFlight = new Map<string, Promise<LookupResponse>>()
const browseQueryLocks = new Map<string, Promise<void>>()

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

const membershipQuery = `
  query Membership($userName: String!) {
    MediaListCollection(userName: $userName, type: ANIME) {
      lists {
        entries {
          id
          status
          score
          progress
          media { ${mediaSelection} }
        }
      }
    }
  }
`

const browseQuery = `
  query Browse(
    $page: Int!
    $perPage: Int!
    $search: String
    $statusIn: [MediaStatus]
    $formatIn: [MediaFormat]
    $startDateGreater: FuzzyDateInt
    $startDateLesser: FuzzyDateInt
    $episodesGreater: Int
    $episodesLesser: Int
    $durationGreater: Int
    $durationLesser: Int
    $genreIn: [String]
    $idIn: [Int]
    $idNotIn: [Int]
    $sort: [MediaSort]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage total }
      media(
        type: ANIME
        search: $search
        status_in: $statusIn
        format_in: $formatIn
        startDate_greater: $startDateGreater
        startDate_lesser: $startDateLesser
        episodes_greater: $episodesGreater
        episodes_lesser: $episodesLesser
        duration_greater: $durationGreater
        duration_lesser: $durationLesser
        genre_in: $genreIn
        id_in: $idIn
        id_not_in: $idNotIn
        sort: $sort
      ) { ${mediaSelection} }
    }
  }
`

function readCached<TValue>(
  cache: Map<string, CachedValue<TValue>>,
  key: string
) {
  const cached = cache.get(key)

  if (!cached || cached.expiresAt <= Date.now()) {
    cache.delete(key)
    return null
  }

  return cached.value
}

function writeCached<TValue>(
  cache: Map<string, CachedValue<TValue>>,
  key: string,
  value: TValue,
  ttlMs: number
) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

async function runWithQueryLock<TValue>(
  key: string,
  task: () => Promise<TValue>
) {
  const previousTask = browseQueryLocks.get(key) ?? Promise.resolve()
  let releaseLock!: () => void
  const nextTask = new Promise<void>((resolve) => {
    releaseLock = resolve
  })
  const chainedTask = previousTask.then(() => nextTask)

  browseQueryLocks.set(key, chainedTask)
  await previousTask

  try {
    return await task()
  } finally {
    releaseLock()

    if (browseQueryLocks.get(key) === chainedTask) {
      browseQueryLocks.delete(key)
    }
  }
}

function normalizeAniListStatus(status: string): WatchStatus {
  return status === "REPEATING" ? "CURRENT" : (status as WatchStatus)
}

function getReleasedEpisodes(media: AniListBrowseMedia) {
  if (media.status === "FINISHED") {
    return media.episodes
  }

  if (
    media.status === "RELEASING" &&
    typeof media.nextAiringEpisode?.episode === "number"
  ) {
    return Math.max(media.nextAiringEpisode.episode - 1, 0)
  }

  return null
}

function toAnimeEntry(
  media: AniListBrowseMedia,
  userList?: {
    id: number
    status: string
    score: number | null
    progress: number | null
  }
): AnimeEntry {
  return {
    source: "anilist",
    id: userList?.id ?? media.id,
    status: userList ? normalizeAniListStatus(userList.status) : null,
    score: userList?.score ?? null,
    progress: userList?.progress ?? null,
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

async function requestAniList<TPayload>(
  query: string,
  variables: Record<string, unknown>
) {
  const response = await fetch(anilistEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  })

  if (response.status === 429) {
    const rateLimit = getAniListRateLimitMeta(response.headers)

    return {
      ok: false as const,
      error: {
        ok: false,
        code: "RATE_LIMITED" as const,
        message: "AniList rate limit hit. Wait a moment and try again.",
        retryAfterMs: rateLimit.retryAfterMs,
        resetAtMs: rateLimit.resetAtMs,
        cooldownUntilMs: rateLimit.cooldownUntilMs,
        rateLimitLimit: rateLimit.rateLimitLimit,
        rateLimitRemaining: rateLimit.rateLimitRemaining,
      } satisfies LookupError,
    }
  }

  const payload = (await response.json()) as TPayload & {
    errors?: Array<{ message: string }>
  }

  if (!response.ok || payload.errors?.length) {
    return {
      ok: false as const,
      error: {
        ok: false,
        code: "UPSTREAM_ERROR" as const,
        message: payload.errors?.[0]?.message ?? "AniList request failed.",
      } satisfies LookupError,
    }
  }

  return { ok: true as const, payload }
}

async function fetchMembership(username: string) {
  const cacheKey = username.trim().toLowerCase()
  const cached = readCached(userListCache, cacheKey)

  if (cached) {
    return cached
  }

  const inFlightRequest = membershipInFlight.get(cacheKey)

  if (inFlightRequest) {
    return inFlightRequest
  }

  const request = (async () => {
    const response = await requestAniList<AniListMembershipPayload>(
      membershipQuery,
      {
        userName: username,
      }
    )

    if (!response.ok) {
      throw response.error
    }

    const lists = response.payload.data?.MediaListCollection?.lists

    if (!lists) {
      throw {
        ok: false,
        code: "PRIVATE_OR_UNAVAILABLE" as const,
        message: "That AniList anime list is private or unavailable.",
      }
    }

    const entries = lists
      .flatMap((list) => list.entries)
      .filter(
        (entry) => entry.media?.id && entry.media.status !== "NOT_YET_RELEASED"
      )
      .map((entry) =>
        toAnimeEntry(entry.media, {
          id: entry.id,
          status: entry.status,
          score: entry.score,
          progress: entry.progress,
        })
      )

    writeCached(userListCache, cacheKey, entries, userListTtlMs)
    return entries
  })()

  membershipInFlight.set(cacheKey, request)

  try {
    return await request
  } finally {
    membershipInFlight.delete(cacheKey)
  }
}

function getBrowseSort(input: BrowseSearch) {
  if (input.sortBy === "averageScore") {
    return [input.sortDirection === "desc" ? "SCORE_DESC" : "SCORE"]
  }

  if (input.sortBy === "popularity" || input.sortBy === "status") {
    return [input.sortDirection === "desc" ? "POPULARITY_DESC" : "POPULARITY"]
  }

  if (input.sortBy === "title") {
    return [
      input.sortDirection === "desc" ? "TITLE_ROMAJI_DESC" : "TITLE_ROMAJI",
    ]
  }

  return [input.sortDirection === "desc" ? "POPULARITY_DESC" : "POPULARITY"]
}

function matchesSubtitleFilter(
  result: OverlapResult,
  selectedSubtitleAvailability: BrowseSearch["selectedSubtitleAvailability"]
) {
  if (selectedSubtitleAvailability.length === 0) {
    return true
  }

  const availability = !result.matchedJimaku
    ? "none"
    : result.completeness === "complete"
      ? "all"
      : "some"

  return selectedSubtitleAvailability.includes(availability)
}

export function matchesDifficultyFilter(
  result: OverlapResult,
  sortBy: BrowseSearch["sortBy"]
) {
  if (sortBy === "jpdbAverageDifficulty") {
    return Boolean(result.matchedJpdb)
  }

  if (sortBy === "learnNativelyLevel") {
    return Boolean(result.matchedLearnNatively)
  }

  return true
}

function matchesGenres(result: OverlapResult, selectedGenres: string[]) {
  if (selectedGenres.length === 0) {
    return true
  }

  const normalizedGenres = result.entry.media.genres.map((genre) =>
    genre.trim().toLowerCase()
  )

  return selectedGenres.every((genre) => normalizedGenres.includes(genre))
}

export function buildAniListBrowseQueryInput({
  hiddenIds,
  page,
  search,
}: {
  hiddenIds: number[]
  page: number
  search: BrowseSearch
}) {
  const yearRange = normalizeMetadataRange(
    search.yearRange,
    getYearFilterBounds()
  )
  const episodeRange = normalizeMetadataRange(
    search.episodeRange,
    episodeFilterBounds
  )
  const durationRange = normalizeMetadataRange(
    search.durationRange,
    durationFilterBounds
  )

  return {
    page,
    perPage: pageSize,
    search: search.titleQuery.trim() || undefined,
    statusIn:
      search.selectedMediaStatuses.length > 0
        ? search.selectedMediaStatuses
        : undefined,
    formatIn:
      search.selectedFormats.length > 0 ? search.selectedFormats : undefined,
    startDateGreater: yearRange ? yearRange[0] * 10_000 : undefined,
    startDateLesser: yearRange ? (yearRange[1] + 1) * 10_000 : undefined,
    episodesGreater:
      episodeRange && episodeRange[0] > episodeFilterBounds[0]
        ? episodeRange[0] - 1
        : undefined,
    episodesLesser:
      episodeRange &&
      !hasUnboundedUpperBound(episodeRange, episodeFilterBounds[1])
        ? episodeRange[1] + 1
        : undefined,
    durationGreater:
      durationRange && durationRange[0] > durationFilterBounds[0]
        ? durationRange[0] - 1
        : undefined,
    durationLesser:
      durationRange &&
      !hasUnboundedUpperBound(durationRange, durationFilterBounds[1])
        ? durationRange[1] + 1
        : undefined,
    genreIn:
      search.selectedGenres.length === 1 ? search.selectedGenres : undefined,
    idNotIn: hiddenIds.length > 0 ? hiddenIds : undefined,
    sort: getBrowseSort(search),
  }
}

function normalizeMetadataRange(
  range: NumericRange | null,
  bounds: NumericRange
) {
  if (!range) {
    return null
  }

  return [
    Math.max(bounds[0], Math.min(range[0], bounds[1])),
    Math.min(bounds[1], Math.max(range[1], bounds[0])),
  ] as NumericRange
}

export function sortGlobalResults(
  results: OverlapResult[],
  search: BrowseSearch
) {
  if (search.sortBy === "status") {
    return [...results].sort((left, right) => {
      if (!left.userList.inList && !right.userList.inList) {
        return 0
      }

      if (!left.userList.inList) {
        return 1
      }

      if (!right.userList.inList) {
        return -1
      }

      return sortAnimeListOverlapResults([left, right])[0] === left ? -1 : 1
    })
  }

  if (search.sortBy === "jpdbAverageDifficulty") {
    return [...results].sort((left, right) => {
      const leftValue =
        left.matchedJpdb?.entry.averageDifficulty ?? Number.MAX_SAFE_INTEGER
      const rightValue =
        right.matchedJpdb?.entry.averageDifficulty ?? Number.MAX_SAFE_INTEGER
      return search.sortDirection === "desc"
        ? rightValue - leftValue
        : leftValue - rightValue
    })
  }

  if (search.sortBy === "jitenDifficulty") {
    return [...results].sort((left, right) => {
      const leftValue = left.matchedJiten
        ? normalizeJitenDifficulty(left.matchedJiten.entry.difficultyRaw)
        : undefined
      const rightValue = right.matchedJiten
        ? normalizeJitenDifficulty(right.matchedJiten.entry.difficultyRaw)
        : undefined
      const titleDelta = (left.entry.media.title.primary ?? "").localeCompare(
        right.entry.media.title.primary ?? ""
      )
      if (leftValue === undefined && rightValue === undefined) return titleDelta
      if (leftValue === undefined) return 1
      if (rightValue === undefined) return -1
      const difficultyDelta =
        search.sortDirection === "desc"
          ? rightValue - leftValue
          : leftValue - rightValue
      return difficultyDelta || titleDelta
    })
  }

  if (search.sortBy === "learnNativelyLevel") {
    return [...results].sort((left, right) => {
      const leftValue =
        left.matchedLearnNatively?.levelNumber ?? Number.MAX_SAFE_INTEGER
      const rightValue =
        right.matchedLearnNatively?.levelNumber ?? Number.MAX_SAFE_INTEGER
      return search.sortDirection === "desc"
        ? rightValue - leftValue
        : leftValue - rightValue
    })
  }

  return results
}

function buildFilteredGlobalResults({
  collectedEntries,
  jimakuEntries,
  jpdbEntries,
  jitenEntries,
  learnNativelyEntries,
  search,
}: {
  collectedEntries: AnimeEntry[]
  jimakuEntries: Parameters<typeof buildAnimeListOverlapResults>[1]
  jpdbEntries: Parameters<typeof buildAnimeListOverlapResults>[2]
  jitenEntries: Parameters<typeof buildAnimeListOverlapResults>[3]
  learnNativelyEntries: Parameters<typeof buildAnimeListOverlapResults>[4]
  search: BrowseSearch
}) {
  return sortGlobalResults(
    buildAnimeListOverlapResults(
      collectedEntries,
      jimakuEntries,
      jpdbEntries,
      jitenEntries,
      learnNativelyEntries
    ).filter(
      (result) =>
        matchesGenres(result, search.selectedGenres) &&
        matchesSubtitleFilter(result, search.selectedSubtitleAvailability) &&
        matchesDifficultyFilter(result, search.sortBy)
    ),
    search
  )
}

function getBrowsePageCacheKey(
  input: Pick<BrowseInput, "page" | "search" | "username">
) {
  return JSON.stringify({
    page: input.page,
    search: input.search,
    username: input.username.trim().toLowerCase(),
  })
}

function getRawAniListPageCacheKey(variables: Record<string, unknown>) {
  return JSON.stringify(variables)
}

function getBrowseQueryCacheKey(
  input: Pick<BrowseInput, "search" | "username">
) {
  return JSON.stringify({
    search: input.search,
    username: input.username.trim().toLowerCase(),
  })
}

async function fetchAniListBrowsePage(
  variables: ReturnType<typeof buildAniListBrowseQueryInput>
) {
  const cacheKey = getRawAniListPageCacheKey(variables)
  const cached = readCached(rawAniListPageCache, cacheKey)

  if (cached) {
    return { ok: true as const, pageData: cached }
  }

  const browseResponse = await requestAniList<AniListBrowsePayload>(
    browseQuery,
    variables
  )

  if (!browseResponse.ok) {
    return browseResponse
  }

  const pageData = browseResponse.payload.data?.Page

  if (!pageData) {
    return {
      ok: false as const,
      error: {
        ok: false,
        code: "UPSTREAM_ERROR" as const,
        message: "AniList browse request failed.",
      } satisfies LookupError,
    }
  }

  writeCached(rawAniListPageCache, cacheKey, pageData, browseTtlMs)

  return { ok: true as const, pageData }
}

function createBrowsePageResponse({
  page,
  queryState,
}: {
  page: number
  queryState: BrowseQueryState
}): BrowsePageResponse {
  const slicedResults = queryState.enrichedResults.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  return {
    ok: true,
    source: "anilist",
    username: queryState.trimmedUsername,
    fetchedAt: new Date().toISOString(),
    totalAnime: queryState.total ?? queryState.collectedEntries.length,
    userListAnimeCount: queryState.membershipEntries.length,
    matchedCount: slicedResults.filter((result) => result.matchedJimaku).length,
    results: slicedResults,
    pageInfo: {
      currentPage: page,
      hasNextPage:
        queryState.enrichedResults.length > page * pageSize ||
        (queryState.hasNextAniListPage && !queryState.hitCap),
      total: queryState.total,
    },
    browseMeta: {
      mode: queryState.search.myAnimeFilterMode,
      isGlobalBrowse: true,
      isApproximateWatchStatusSort: queryState.search.sortBy === "status",
      isAniListBrowseCap: queryState.hitCap,
    },
  }
}

async function getOrCreateBrowseQueryState(
  trimmedUsername: string,
  search: BrowseSearch
) {
  const queryKey = getBrowseQueryCacheKey({
    search,
    username: trimmedUsername,
  })
  const cached = readCached(browseQueryCache, queryKey)

  if (cached) {
    return { queryKey, queryState: cached }
  }

  const [
    membershipEntries,
    jimakuEntries,
    jpdbEntries,
    jitenEntries,
    learnNativelyEntries,
  ] = await Promise.all([
    fetchMembership(trimmedUsername),
    loadJimakuSnapshot(),
    loadJpdbAnimeDifficultySnapshot(),
    loadJitenAnimeDifficultySnapshot(),
    loadLearnNativelyAnimationLevelsSnapshot(),
  ])

  const queryState: BrowseQueryState = {
    collectedEntries: [],
    enrichedResults: [],
    hasNextAniListPage: true,
    hiddenIds:
      search.myAnimeFilterMode === "hideMine"
        ? membershipEntries.map((entry) => entry.media.id)
        : [],
    hitCap: false,
    jimakuEntries,
    jpdbEntries,
    jitenEntries,
    learnNativelyEntries,
    loops: 0,
    membershipEntries,
    membershipMap: new Map(
      membershipEntries.map((entry) => [entry.media.id, entry] as const)
    ),
    nextAniListPage: 1,
    search,
    seenMediaIds: new Set<number>(),
    total: null,
    trimmedUsername,
  }

  writeCached(browseQueryCache, queryKey, queryState, browseTtlMs)
  return { queryKey, queryState }
}

async function ensureBrowseQueryPage(
  queryKey: string,
  queryState: BrowseQueryState,
  page: number
) {
  const targetCount = page * pageSize

  while (
    queryState.enrichedResults.length < targetCount &&
    queryState.hasNextAniListPage &&
    queryState.nextAniListPage <= maxAniListPages &&
    queryState.loops < maxFetchLoops
  ) {
    const browseResponse = await fetchAniListBrowsePage(
      buildAniListBrowseQueryInput({
        hiddenIds: queryState.hiddenIds,
        page: queryState.nextAniListPage,
        search: queryState.search,
      })
    )

    if (!browseResponse.ok) {
      throw browseResponse.error
    }

    const pageData = browseResponse.pageData
    queryState.total = pageData.pageInfo.total
    queryState.hasNextAniListPage = pageData.pageInfo.hasNextPage

    for (const media of pageData.media) {
      if (
        media.status === "NOT_YET_RELEASED" ||
        queryState.seenMediaIds.has(media.id)
      ) {
        continue
      }

      queryState.seenMediaIds.add(media.id)
      const membership = queryState.membershipMap.get(media.id)

      queryState.collectedEntries.push(
        membership ? membership : toAnimeEntry(media, undefined)
      )
    }

    queryState.enrichedResults = buildFilteredGlobalResults({
      collectedEntries: queryState.collectedEntries,
      jimakuEntries: queryState.jimakuEntries,
      jpdbEntries: queryState.jpdbEntries,
      jitenEntries: queryState.jitenEntries,
      learnNativelyEntries: queryState.learnNativelyEntries,
      search: queryState.search,
    })
    queryState.nextAniListPage += 1
    queryState.loops += 1
  }

  if (
    queryState.nextAniListPage > maxAniListPages &&
    queryState.hasNextAniListPage
  ) {
    queryState.hitCap = true
  }

  writeCached(browseQueryCache, queryKey, queryState, browseTtlMs)
}

export function resetBrowseAniListStateForTests() {
  userListCache.clear()
  browsePageCache.clear()
  rawAniListPageCache.clear()
  browseQueryCache.clear()
  membershipInFlight.clear()
  browsePageInFlight.clear()
  browseQueryLocks.clear()
}

export async function browseAniList({
  page,
  search,
  username,
}: BrowseInput): Promise<LookupResponse> {
  const trimmedUsername = username.trim()

  if (!trimmedUsername) {
    return { ok: false, code: "UPSTREAM_ERROR", message: "Enter a username." }
  }

  if (search.myAnimeFilterMode === "onlyMine") {
    return {
      ok: false,
      code: "UPSTREAM_ERROR",
      message: "Invalid browse mode.",
    }
  }

  const pageCacheKey = getBrowsePageCacheKey({
    page,
    search,
    username: trimmedUsername,
  })
  const cached = readCached(browsePageCache, pageCacheKey)

  if (cached) {
    return cached
  }

  const inFlightPageRequest = browsePageInFlight.get(pageCacheKey)

  if (inFlightPageRequest) {
    return inFlightPageRequest
  }

  const request = runWithQueryLock(
    getBrowseQueryCacheKey({ search, username: trimmedUsername }),
    async () => {
      try {
        const { queryKey, queryState } = await getOrCreateBrowseQueryState(
          trimmedUsername,
          search
        )

        await ensureBrowseQueryPage(queryKey, queryState, page)

        const response = createBrowsePageResponse({
          page,
          queryState,
        }) satisfies LookupResponse

        writeCached(browsePageCache, pageCacheKey, response, browseTtlMs)
        return response
      } catch (error) {
        const response = (error as LookupResponse & { ok: false }) ?? {
          ok: false,
          code: "UPSTREAM_ERROR",
          message: "AniList browse request failed.",
        }

        writeCached(browsePageCache, pageCacheKey, response, userListTtlMs)
        return response
      }
    }
  )

  browsePageInFlight.set(pageCacheKey, request)

  try {
    return await request
  } finally {
    browsePageInFlight.delete(pageCacheKey)
  }
}

function validateBrowseInput(data: unknown): BrowseInput {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid browse input.")
  }

  const input = data as Partial<BrowseInput>

  if (
    typeof input.username !== "string" ||
    input.username.trim().length === 0
  ) {
    throw new Error("Username is required.")
  }

  if (typeof input.page !== "number" || input.page < 1) {
    throw new Error("Page is required.")
  }

  if (!input.search || typeof input.search !== "object") {
    throw new Error("Browse search is required.")
  }

  return input as BrowseInput
}

export const browseAniListPage = createServerFn({ method: "POST" })
  .inputValidator(validateBrowseInput)
  .handler(async ({ data }) => browseAniList(data))
