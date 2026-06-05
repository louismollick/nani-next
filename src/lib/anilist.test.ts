import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchAniListEntries } from "@/lib/anilist"

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

describe("fetchAniListEntries", () => {
  it("maps successful AniList payloads into entries", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          MediaListCollection: {
            lists: [
              {
                entries: [
                  {
                    id: 2,
                    status: "PLANNING",
                    score: 0,
                    progress: 0,
                    media: {
                      id: 11,
                      episodes: 12,
                      nextAiringEpisode: null,
                      averageScore: 80,
                      popularity: 1000,
                      status: "NOT_YET_RELEASED",
                      genres: ["Action"],
                      format: "TV",
                      siteUrl: "https://anilist.co/anime/11",
                      synonyms: [],
                      coverImage: {
                        large: "https://example.com/b.jpg",
                        color: "#000",
                      },
                      title: {
                        romaji: "Bar",
                        english: "Bar",
                        native: "バー",
                      },
                    },
                  },
                  {
                    id: 1,
                    status: "CURRENT",
                    score: 50,
                    progress: 1,
                    media: {
                      id: 10,
                      episodes: 12,
                      nextAiringEpisode: null,
                      averageScore: 80,
                      popularity: 1000,
                      status: "FINISHED",
                      genres: ["Action", "Drama"],
                      format: "TV",
                      siteUrl: "https://anilist.co/anime/10",
                      synonyms: [],
                      coverImage: {
                        large: "https://example.com/a.jpg",
                        color: "#fff",
                      },
                      title: {
                        romaji: "Foo",
                        english: "Foo",
                        native: "フー",
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      }),
    }) as typeof fetch

    const result = await fetchAniListEntries("demo")

    expect(Array.isArray(result)).toBe(true)
    expect(Array.isArray(result) ? result : []).toHaveLength(1)
    expect(Array.isArray(result) ? result[0].media.id : null).toBe(10)
    expect(Array.isArray(result) ? result[0].media.anilistId : null).toBe(10)
    expect(
      Array.isArray(result) ? result[0].media.releasedEpisodes : null
    ).toBe(12)
    expect(Array.isArray(result) ? result[0].media.genres : []).toEqual([
      "Action",
      "Drama",
    ])
    expect(Array.isArray(result) ? result[0].status : null).toBe("CURRENT")
  })

  it("returns a user-facing error for missing users", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        errors: [{ message: "User not found" }],
      }),
    }) as typeof fetch

    const result = await fetchAniListEntries("missing-user")

    expect(Array.isArray(result)).toBe(false)
    expect(!Array.isArray(result) && !result.ok ? result.code : null).toBe(
      "NOT_FOUND"
    )
  })

  it("folds repeating entries into current", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          MediaListCollection: {
            lists: [
              {
                entries: [
                  {
                    id: 1,
                    status: "REPEATING",
                    score: 50,
                    progress: 1,
                    media: {
                      id: 10,
                      idMal: 20,
                      episodes: 12,
                      nextAiringEpisode: null,
                      averageScore: 80,
                      popularity: 1000,
                      status: "FINISHED",
                      genres: ["Action"],
                      format: "TV",
                      siteUrl: "https://anilist.co/anime/10",
                      synonyms: [],
                      coverImage: {
                        large: "https://example.com/a.jpg",
                        color: "#fff",
                      },
                      title: {
                        romaji: "Foo",
                        english: "Foo",
                        native: "フー",
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      }),
    }) as typeof fetch

    const result = await fetchAniListEntries("demo")

    expect(Array.isArray(result) ? result[0].status : null).toBe("CURRENT")
  })

  it("derives released episodes for airing anime from next airing episode", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          MediaListCollection: {
            lists: [
              {
                entries: [
                  {
                    id: 1,
                    status: "CURRENT",
                    score: 50,
                    progress: 1,
                    media: {
                      id: 10,
                      idMal: 20,
                      episodes: 12,
                      averageScore: 80,
                      popularity: 1000,
                      status: "RELEASING",
                      nextAiringEpisode: {
                        episode: 9,
                      },
                      genres: ["Action"],
                      format: "TV",
                      siteUrl: "https://anilist.co/anime/10",
                      synonyms: [],
                      coverImage: {
                        large: "https://example.com/a.jpg",
                        color: "#fff",
                      },
                      title: {
                        romaji: "Foo",
                        english: "Foo",
                        native: "フー",
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      }),
    }) as typeof fetch

    const result = await fetchAniListEntries("demo")

    expect(
      Array.isArray(result) ? result[0].media.releasedEpisodes : null
    ).toBe(8)
  })
})
