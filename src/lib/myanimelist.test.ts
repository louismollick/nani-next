import { afterEach, describe, expect, it, vi } from "vitest"

const {
  fetchAniListIdsForMyAnimeListIdsMock,
  fetchReleasedEpisodesForAniListIdsMock,
} = vi.hoisted(() => ({
  fetchAniListIdsForMyAnimeListIdsMock: vi.fn(),
  fetchReleasedEpisodesForAniListIdsMock: vi.fn(),
}))

vi.mock("@/lib/anilist-id-map", () => ({
  fetchAniListIdsForMyAnimeListIds: fetchAniListIdsForMyAnimeListIdsMock,
  fetchReleasedEpisodesForAniListIds: fetchReleasedEpisodesForAniListIdsMock,
}))

import { fetchMyAnimeListEntries } from "@/lib/myanimelist"

const originalFetch = global.fetch
const originalClientId = process.env.MYANIMELIST_CLIENT_ID

afterEach(() => {
  global.fetch = originalFetch
  fetchAniListIdsForMyAnimeListIdsMock.mockReset()
  fetchReleasedEpisodesForAniListIdsMock.mockReset()

  if (originalClientId === undefined) {
    delete process.env.MYANIMELIST_CLIENT_ID
  } else {
    process.env.MYANIMELIST_CLIENT_ID = originalClientId
  }

  vi.restoreAllMocks()
})

describe("fetchMyAnimeListEntries", () => {
  it("maps paginated MAL payloads into normalized entries", async () => {
    process.env.MYANIMELIST_CLIENT_ID = "demo-client-id"
    fetchAniListIdsForMyAnimeListIdsMock.mockResolvedValue(
      new Map([
        [101, 201],
        [102, 202],
      ])
    )
    fetchReleasedEpisodesForAniListIdsMock.mockResolvedValue(
      new Map([
        [201, 8],
        [202, 25],
      ])
    )

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              node: {
                id: 101,
                title: "Blue Box",
                main_picture: {
                  large: "https://example.com/blue-box.jpg",
                },
                num_episodes: 24,
                mean: 8.4,
                num_list_users: 500000,
                status: "finished_airing",
                genres: [{ id: 1, name: "Romance" }],
                media_type: "tv",
                alternative_titles: {
                  synonyms: ["Ao no Hako"],
                  en: "Blue Box",
                  ja: "アオのハコ",
                },
              },
              list_status: {
                status: "watching",
                score: 0,
                num_episodes_watched: 7,
                is_rewatching: false,
              },
            },
          ],
          paging: {
            next: "https://example.com/page-2",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              node: {
                id: 102,
                title: "Orb",
                main_picture: {
                  medium: "https://example.com/orb.jpg",
                },
                num_episodes: 25,
                mean: 9.1,
                num_list_users: 250000,
                status: "finished_airing",
                genres: [{ id: 2, name: "Drama" }],
                media_type: "tv",
                alternative_titles: {
                  synonyms: [],
                  en: "Orb",
                  ja: "チ。",
                },
              },
              list_status: {
                status: "completed",
                score: 9,
                num_episodes_watched: 25,
                is_rewatching: false,
              },
            },
          ],
          paging: {},
        }),
      }) as typeof fetch

    const result = await fetchMyAnimeListEntries("demo-user")

    expect(Array.isArray(result)).toBe(true)
    expect(Array.isArray(result) ? result : []).toHaveLength(2)
    expect(Array.isArray(result) ? result[0].media.anilistId : null).toBe(201)
    expect(Array.isArray(result) ? result[0].media.myanimelistId : null).toBe(
      101
    )
    expect(Array.isArray(result) ? result[0].media.averageScore : null).toBe(84)
    expect(Array.isArray(result) ? result[0].media.popularity : null).toBe(
      500000
    )
    expect(
      Array.isArray(result) ? result[0].media.releasedEpisodes : null
    ).toBe(8)
    expect(Array.isArray(result) ? result[0].status : null).toBe("CURRENT")
  })

  it("returns a config error when MAL client id is missing", async () => {
    delete process.env.MYANIMELIST_CLIENT_ID

    const result = await fetchMyAnimeListEntries("demo-user")

    expect(Array.isArray(result)).toBe(false)
    expect(!Array.isArray(result) && !result.ok ? result.code : null).toBe(
      "UPSTREAM_ERROR"
    )
  })

  it("returns a user-facing error for missing users", async () => {
    process.env.MYANIMELIST_CLIENT_ID = "demo-client-id"
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    }) as typeof fetch

    const result = await fetchMyAnimeListEntries("missing-user")

    expect(Array.isArray(result)).toBe(false)
    expect(!Array.isArray(result) && !result.ok ? result.code : null).toBe(
      "NOT_FOUND"
    )
  })

  it("returns a user-facing error for unavailable lists", async () => {
    process.env.MYANIMELIST_CLIENT_ID = "demo-client-id"
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    }) as typeof fetch

    const result = await fetchMyAnimeListEntries("private-user")

    expect(Array.isArray(result)).toBe(false)
    expect(!Array.isArray(result) && !result.ok ? result.code : null).toBe(
      "PRIVATE_OR_UNAVAILABLE"
    )
  })

  it("returns a user-facing error for rate limiting", async () => {
    process.env.MYANIMELIST_CLIENT_ID = "demo-client-id"
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    }) as typeof fetch

    const result = await fetchMyAnimeListEntries("busy-user")

    expect(Array.isArray(result)).toBe(false)
    expect(!Array.isArray(result) && !result.ok ? result.code : null).toBe(
      "RATE_LIMITED"
    )
  })
})
