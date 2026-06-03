import { getCache } from "@vercel/functions"
import {
  errorLookupTtlSeconds,
  successLookupTtlSeconds,
} from "@/lib/lookup-cache"
import type { LookupResponse } from "@/lib/types"

export function shouldUseVercelRuntimeCache() {
  return process.env.VERCEL === "1"
}

export function getLookupCacheKey(username: string) {
  return `overlap:${username.trim().toLowerCase()}`
}

export function getLookupCacheTtlSeconds(result: LookupResponse) {
  return result.ok ? successLookupTtlSeconds : errorLookupTtlSeconds
}

function getLookupCache() {
  return getCache({ namespace: "jimaku-watch-list" })
}

export async function readCachedLookupResponse(username: string) {
  if (!shouldUseVercelRuntimeCache()) {
    return null
  }

  return (await getLookupCache().get(
    getLookupCacheKey(username)
  )) as LookupResponse | null
}

export async function writeCachedLookupResponse(
  username: string,
  result: LookupResponse
) {
  if (!shouldUseVercelRuntimeCache()) {
    return
  }

  await getLookupCache().set(getLookupCacheKey(username), result, {
    ttl: getLookupCacheTtlSeconds(result),
    tags: [`anilist-user:${username.trim().toLowerCase()}`],
  })
}
