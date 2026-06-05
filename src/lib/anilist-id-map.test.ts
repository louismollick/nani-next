import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  fetchAniListIdsForMyAnimeListIds,
  fetchMyAnimeListIdsForAniListIds,
  fetchReleasedEpisodesForAniListIds,
} from "@/lib/anilist-id-map"

const originalFetch = global.fetch
const originalSetTimeout = global.setTimeout

beforeEach(() => {
  global.setTimeout = vi.fn((callback: TimerHandler) => {
    if (typeof callback === "function") {
      callback()
    }

    return 0 as unknown as ReturnType<typeof setTimeout>
  }) as unknown as typeof setTimeout
})

afterEach(() => {
  global.fetch = originalFetch
  global.setTimeout = originalSetTimeout
  vi.restoreAllMocks()
})

describe("anilist id map", () => {
  it("retries rate-limited batches and succeeds", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "retry-after": "0" }),
        json: async () => ({
          errors: [{ message: "Too Many Requests." }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          data: {
            entry0: { id: 1, idMal: 2 },
          },
        }),
      }) as typeof fetch

    await expect(fetchMyAnimeListIdsForAniListIds([1])).resolves.toEqual(
      new Map([[1, 2]])
    )
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it("maps MAL ids back to AniList ids", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({
        data: {
          entry0: { id: 1, idMal: 2 },
        },
      }),
    }) as typeof fetch

    await expect(fetchAniListIdsForMyAnimeListIds([2])).resolves.toEqual(
      new Map([[2, 1]])
    )
  })

  it("reports batch progress", async () => {
    const onProgress = vi.fn()

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({
        data: {
          entry0: { id: 1, idMal: 2 },
          entry1: { id: 3, idMal: 4 },
        },
      }),
    }) as typeof fetch

    await fetchMyAnimeListIdsForAniListIds([1, 3], { onProgress })

    expect(onProgress).toHaveBeenCalledWith({ completed: 2, total: 2 })
  })

  it("derives released episode counts from AniList media status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({
        data: {
          entry0: {
            id: 1,
            status: "RELEASING",
            episodes: 12,
            nextAiringEpisode: {
              episode: 9,
            },
          },
          entry1: {
            id: 2,
            status: "FINISHED",
            episodes: 24,
            nextAiringEpisode: null,
          },
        },
      }),
    }) as typeof fetch

    await expect(fetchReleasedEpisodesForAniListIds([1, 2])).resolves.toEqual(
      new Map([
        [1, 8],
        [2, 24],
      ])
    )
  })
})
