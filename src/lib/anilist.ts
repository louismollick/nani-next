import type {
  AnimeEntry,
  LookupResponse,
  MediaStatus,
  WatchStatus,
} from "@/lib/types"

const anilistEndpoint = "https://graphql.anilist.co"

const mediaListCollectionQuery = `
  query WatchList($userName: String!) {
    MediaListCollection(userName: $userName, type: ANIME) {
      lists {
        entries {
          id
          status
          score
          progress
          media {
            id
            idMal
            episodes
            averageScore
            popularity
            status
            nextAiringEpisode {
              episode
            }
            genres
            format
            siteUrl
            synonyms
            coverImage {
              large
              color
            }
            title {
              romaji
              english
              native
            }
          }
        }
      }
    }
  }
`

type AniListGraphQlEntry = {
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
  media: {
    id: number
    idMal: number | null
    episodes: number | null
    averageScore: number | null
    popularity: number | null
    status: MediaStatus
    nextAiringEpisode?: {
      episode: number | null
    } | null
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
}

type AniListGraphQlResponse = {
  data?: {
    MediaListCollection: {
      lists: Array<{
        entries: AniListGraphQlEntry[]
      }>
    } | null
  }
  errors?: Array<{
    message: string
    status?: number
  }>
}

function normalizeAniListWatchStatus(
  status: AniListGraphQlEntry["status"]
): WatchStatus {
  return status === "REPEATING" ? "CURRENT" : status
}

function getReleasedEpisodes(
  media: AniListGraphQlEntry["media"]
): number | null {
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

export async function fetchAniListEntries(
  username: string
): Promise<LookupResponse | AnimeEntry[]> {
  const response = await fetch(anilistEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      query: mediaListCollectionQuery,
      variables: {
        userName: username,
      },
    }),
  })

  if (response.status === 429) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      message: "AniList rate limit hit. Wait a moment and try again.",
    }
  }

  const payload = (await response.json()) as AniListGraphQlResponse

  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.[0]?.message ?? "AniList request failed."

    if (
      message.toLowerCase().includes("private") ||
      message.toLowerCase().includes("access")
    ) {
      return {
        ok: false,
        code: "PRIVATE_OR_UNAVAILABLE",
        message: "That AniList anime list is private or unavailable.",
      }
    }

    if (message.toLowerCase().includes("not found")) {
      return {
        ok: false,
        code: "NOT_FOUND",
        message: "AniList user not found.",
      }
    }

    return {
      ok: false,
      code: "UPSTREAM_ERROR",
      message,
    }
  }

  const lists = payload.data?.MediaListCollection?.lists

  if (!lists) {
    return {
      ok: false,
      code: "PRIVATE_OR_UNAVAILABLE",
      message: "That AniList anime list is private or unavailable.",
    }
  }

  return lists
    .flatMap((list) => list.entries)
    .filter(
      (entry) => entry.media?.id && entry.media.status !== "NOT_YET_RELEASED"
    )
    .map((entry) => ({
      source: "anilist" as const,
      id: entry.id,
      status: normalizeAniListWatchStatus(entry.status),
      score: entry.score,
      progress: entry.progress,
      media: {
        id: entry.media.id,
        anilistId: entry.media.id,
        myanimelistId: entry.media.idMal,
        episodes: entry.media.episodes,
        releasedEpisodes: getReleasedEpisodes(entry.media),
        averageScore: entry.media.averageScore,
        popularity: entry.media.popularity,
        status: entry.media.status,
        genres: entry.media.genres,
        format: entry.media.format,
        siteUrl: entry.media.siteUrl,
        synonyms: entry.media.synonyms,
        coverImage: entry.media.coverImage,
        title: {
          primary: entry.media.title.romaji,
          english: entry.media.title.english,
          native: entry.media.title.native,
        },
      },
    }))
}
