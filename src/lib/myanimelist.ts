import {
  fetchAniListIdsForMyAnimeListIds,
  fetchReleasedEpisodesForAniListIds,
} from "@/lib/anilist-id-map"
import type {
  AnimeEntry,
  LookupResponse,
  MediaStatus,
  WatchStatus,
} from "@/lib/types"

const myAnimeListEndpoint = "https://api.myanimelist.net/v2"
const myAnimeListFields = [
  "list_status",
  "num_episodes",
  "mean",
  "num_list_users",
  "status",
  "genres",
  "media_type",
  "alternative_titles",
].join(",")

type MyAnimeListResponse = {
  data: Array<{
    node: {
      id: number
      title: string
      main_picture?: {
        medium?: string
        large?: string
      } | null
      num_episodes?: number | null
      mean?: number | null
      num_list_users?: number | null
      status?:
        | "currently_airing"
        | "finished_airing"
        | "not_yet_aired"
        | string
        | null
      genres?: Array<{
        id: number
        name: string
      }>
      media_type?: string | null
      alternative_titles?: {
        synonyms?: string[]
        en?: string | null
        ja?: string | null
      } | null
    }
    list_status: {
      status: "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch"
      score: number
      num_episodes_watched: number
      is_rewatching: boolean
    }
  }>
  paging?: {
    next?: string
  }
}

function normalizeMyAnimeListWatchStatus(
  status: MyAnimeListResponse["data"][number]["list_status"]["status"]
): WatchStatus {
  switch (status) {
    case "watching":
      return "CURRENT"
    case "completed":
      return "COMPLETED"
    case "on_hold":
      return "PAUSED"
    case "dropped":
      return "DROPPED"
    default:
      return "PLANNING"
  }
}

function normalizeMyAnimeListMediaStatus(
  status: MyAnimeListResponse["data"][number]["node"]["status"]
): MediaStatus {
  switch (status) {
    case "currently_airing":
      return "RELEASING"
    case "finished_airing":
      return "FINISHED"
    case "not_yet_aired":
      return "NOT_YET_RELEASED"
    default:
      return null
  }
}

function toAverageScore(mean: number | null | undefined) {
  return typeof mean === "number" ? Math.round(mean * 10) : null
}

function toProviderUrl(id: number) {
  return `https://myanimelist.net/anime/${id}`
}

async function fetchAllPages(
  username: string,
  clientId: string
): Promise<MyAnimeListResponse["data"]> {
  const results: MyAnimeListResponse["data"] = []
  let nextUrl: string | null =
    `${myAnimeListEndpoint}/users/${encodeURIComponent(
      username
    )}/animelist?fields=${encodeURIComponent(myAnimeListFields)}&limit=1000`

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        "X-MAL-CLIENT-ID": clientId,
        accept: "application/json",
      },
    })

    if (response.status === 429) {
      throw new Error("RATE_LIMITED")
    }

    if (response.status === 404) {
      throw new Error("NOT_FOUND")
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error("PRIVATE_OR_UNAVAILABLE")
    }

    if (!response.ok) {
      throw new Error("UPSTREAM_ERROR")
    }

    const payload = (await response.json()) as MyAnimeListResponse
    results.push(...payload.data)
    nextUrl = payload.paging?.next ?? null
  }

  return results
}

export async function fetchMyAnimeListEntries(
  username: string
): Promise<LookupResponse | AnimeEntry[]> {
  const clientId = process.env.MYANIMELIST_CLIENT_ID?.trim()

  if (!clientId) {
    return {
      ok: false,
      code: "UPSTREAM_ERROR",
      message: "MyAnimeList is not configured on this server.",
    }
  }

  try {
    const rawEntries = await fetchAllPages(username, clientId)
    const filteredEntries = rawEntries.filter(
      (entry) =>
        entry.node?.id &&
        normalizeMyAnimeListMediaStatus(entry.node.status) !==
          "NOT_YET_RELEASED"
    )

    let aniListIdsByMyAnimeListId = new Map<number, number | null>()
    let releasedEpisodesByAniListId = new Map<number, number | null>()

    try {
      aniListIdsByMyAnimeListId = await fetchAniListIdsForMyAnimeListIds(
        filteredEntries.map((entry) => entry.node.id)
      )

      const aniListIds = [...aniListIdsByMyAnimeListId.values()].filter(
        (id): id is number => typeof id === "number"
      )

      releasedEpisodesByAniListId =
        await fetchReleasedEpisodesForAniListIds(aniListIds)
    } catch {
      aniListIdsByMyAnimeListId = new Map<number, number | null>()
      releasedEpisodesByAniListId = new Map<number, number | null>()
    }

    return filteredEntries.map((entry) => {
      const mediaStatus = normalizeMyAnimeListMediaStatus(entry.node.status)
      const anilistId = aniListIdsByMyAnimeListId.get(entry.node.id) ?? null

      return {
        source: "myanimelist" as const,
        id: entry.node.id,
        status: normalizeMyAnimeListWatchStatus(entry.list_status.status),
        score: entry.list_status.score || null,
        progress: entry.list_status.num_episodes_watched || null,
        media: {
          id: entry.node.id,
          anilistId,
          myanimelistId: entry.node.id,
          episodes: entry.node.num_episodes ?? null,
          releasedEpisodes:
            (anilistId !== null
              ? releasedEpisodesByAniListId.get(anilistId)
              : null) ??
            (mediaStatus === "FINISHED"
              ? (entry.node.num_episodes ?? null)
              : null),
          averageScore: toAverageScore(entry.node.mean),
          popularity: entry.node.num_list_users ?? null,
          status: mediaStatus,
          genres: entry.node.genres?.map((genre) => genre.name) ?? [],
          format: entry.node.media_type?.toUpperCase() ?? null,
          siteUrl: toProviderUrl(entry.node.id),
          synonyms: entry.node.alternative_titles?.synonyms ?? [],
          coverImage: {
            large:
              entry.node.main_picture?.large ??
              entry.node.main_picture?.medium ??
              "",
            color: null,
          },
          title: {
            primary: entry.node.title,
            english: entry.node.alternative_titles?.en || null,
            native: entry.node.alternative_titles?.ja || null,
          },
        },
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "RATE_LIMITED") {
        return {
          ok: false,
          code: "RATE_LIMITED",
          message: "MyAnimeList rate limit hit. Wait a moment and try again.",
        }
      }

      if (error.message === "NOT_FOUND") {
        return {
          ok: false,
          code: "NOT_FOUND",
          message: "MyAnimeList user not found.",
        }
      }

      if (error.message === "PRIVATE_OR_UNAVAILABLE") {
        return {
          ok: false,
          code: "PRIVATE_OR_UNAVAILABLE",
          message: "That MyAnimeList anime list is private or unavailable.",
        }
      }
    }

    return {
      ok: false,
      code: "UPSTREAM_ERROR",
      message: "MyAnimeList request failed.",
    }
  }
}
