import type { AniListEntry, LookupResponse } from "@/lib/types"

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
            episodes
            averageScore
            popularity
            status
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

type AniListGraphQlResponse = {
  data?: {
    MediaListCollection: {
      lists: Array<{
        entries: AniListEntry[]
      }>
    } | null
  }
  errors?: Array<{
    message: string
    status?: number
  }>
}

export async function fetchAniListEntries(
  username: string
): Promise<LookupResponse | AniListEntry[]> {
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
    .filter((entry) => entry.media?.id)
}
