import { getCache } from "@vercel/functions"
import {
  errorLookupTtlSeconds,
  successLookupTtlSeconds,
} from "@/lib/lookup-cache"
import type { AnimeSource, LookupResponse } from "@/lib/types"

export function shouldUseVercelRuntimeCache() {
  return process.env.VERCEL === "1"
}

export function getLookupCacheKey(source: AnimeSource, username: string) {
  return `overlap:v3:${source}:${username.trim().toLowerCase()}`
}

export function getLookupCacheTtlSeconds(result: LookupResponse) {
  return result.ok ? successLookupTtlSeconds : errorLookupTtlSeconds
}

function getLookupCache() {
  return getCache({ namespace: "jimaku-watch-list" })
}

export async function readCachedLookupResponse(
  source: AnimeSource,
  username: string
) {
  if (!shouldUseVercelRuntimeCache()) {
    return null
  }

  return (await getLookupCache().get(
    getLookupCacheKey(source, username)
  )) as LookupResponse | null
}

export async function writeCachedLookupResponse(
  source: AnimeSource,
  username: string,
  result: LookupResponse
) {
  if (!shouldUseVercelRuntimeCache()) {
    return
  }

  const normalizedUsername = username.trim().toLowerCase()

  await getLookupCache().set(getLookupCacheKey(source, username), result, {
    ttl: getLookupCacheTtlSeconds(result),
    tags: [`lookup-user:${source}:${normalizedUsername}`],
  })
}
