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
                    id: 1,
                    status: "CURRENT",
                    score: 50,
                    progress: 1,
                    media: {
                      id: 10,
                      episodes: 12,
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
    expect(Array.isArray(result) ? result[0].media.id : null).toBe(10)
    expect(Array.isArray(result) ? result[0].media.genres : []).toEqual([
      "Action",
      "Drama",
    ])
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
})
