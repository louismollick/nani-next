import { afterEach, describe, expect, it, vi } from "vitest"

const { getMock, setMock, getCacheMock } = vi.hoisted(() => {
  const getMock = vi.fn()
  const setMock = vi.fn()
  const getCacheMock = vi.fn(() => ({
    get: getMock,
    set: setMock,
  }))

  return { getMock, setMock, getCacheMock }
})

vi.mock("@vercel/functions", () => ({
  getCache: getCacheMock,
}))

import {
  getLookupCacheKey,
  getLookupCacheTtlSeconds,
  readCachedLookupResponse,
  shouldUseVercelRuntimeCache,
  writeCachedLookupResponse,
} from "@/lib/runtime-cache"
import type { LookupResponse } from "@/lib/types"

describe("runtime cache", () => {
  const originalVercel = process.env.VERCEL

  afterEach(() => {
    getMock.mockReset()
    setMock.mockReset()

    if (originalVercel === undefined) {
      delete process.env.VERCEL
      return
    }

    process.env.VERCEL = originalVercel
  })

  it("uses Vercel cache only when the VERCEL env var is present", () => {
    delete process.env.VERCEL
    expect(shouldUseVercelRuntimeCache()).toBe(false)

    process.env.VERCEL = "1"
    expect(shouldUseVercelRuntimeCache()).toBe(true)
  })

  it("normalizes lookup cache keys", () => {
    expect(getLookupCacheKey("anilist", "  MolLiCl  ")).toBe(
      "overlap:v3:anilist:mollicl"
    )
  })

  it("uses shorter ttl for upstream errors", () => {
    expect(
      getLookupCacheTtlSeconds({
        ok: false,
        code: "UPSTREAM_ERROR",
        message: "boom",
      })
    ).toBe(600)

    expect(
      getLookupCacheTtlSeconds({
        ok: true,
        source: "anilist",
        username: "mollicl",
        fetchedAt: "2026-06-02T22:14:00.000Z",
        totalAnime: 1,
        matchedCount: 1,
        results: [],
      })
    ).toBe(3600)
  })

  it("skips cache access off Vercel", async () => {
    delete process.env.VERCEL

    await expect(
      readCachedLookupResponse("anilist", "mollicl")
    ).resolves.toBeNull()
    await writeCachedLookupResponse("anilist", "mollicl", {
      ok: false,
      code: "NOT_FOUND",
      message: "missing",
    })

    expect(getCacheMock).not.toHaveBeenCalled()
    expect(getMock).not.toHaveBeenCalled()
    expect(setMock).not.toHaveBeenCalled()
  })

  it("reads and writes cache on Vercel", async () => {
    process.env.VERCEL = "1"

    const cachedResponse: LookupResponse = {
      ok: true,
      source: "anilist",
      username: "mollicl",
      fetchedAt: "2026-06-02T22:14:00.000Z",
      totalAnime: 1,
      matchedCount: 1,
      results: [],
    }

    getMock.mockResolvedValueOnce(cachedResponse)
    setMock.mockResolvedValueOnce(undefined)

    await expect(
      readCachedLookupResponse("anilist", "MolLiCl")
    ).resolves.toEqual(cachedResponse)

    await writeCachedLookupResponse("anilist", "MolLiCl", cachedResponse)

    expect(getCacheMock).toHaveBeenCalledTimes(2)
    expect(getMock).toHaveBeenCalledWith("overlap:v3:anilist:mollicl")
    expect(setMock).toHaveBeenCalledWith(
      "overlap:v3:anilist:mollicl",
      cachedResponse,
      {
        ttl: 3600,
        tags: ["lookup-user:anilist:mollicl"],
      }
    )
  })
})
