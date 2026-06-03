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
    expect(getLookupCacheKey("  MolLiCl  ")).toBe("overlap:mollicl")
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
        username: "mollicl",
        totalAnime: 1,
        matchedCount: 1,
        results: [],
      })
    ).toBe(3600)
  })

  it("skips cache access off Vercel", async () => {
    delete process.env.VERCEL

    await expect(readCachedLookupResponse("mollicl")).resolves.toBeNull()
    await writeCachedLookupResponse("mollicl", {
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
      username: "mollicl",
      totalAnime: 1,
      matchedCount: 1,
      results: [],
    }

    getMock.mockResolvedValueOnce(cachedResponse)
    setMock.mockResolvedValueOnce(undefined)

    await expect(readCachedLookupResponse("MolLiCl")).resolves.toEqual(
      cachedResponse
    )

    await writeCachedLookupResponse("MolLiCl", cachedResponse)

    expect(getCacheMock).toHaveBeenCalledTimes(2)
    expect(getMock).toHaveBeenCalledWith("overlap:mollicl")
    expect(setMock).toHaveBeenCalledWith("overlap:mollicl", cachedResponse, {
      ttl: 3600,
      tags: ["anilist-user:mollicl"],
    })
  })
})
