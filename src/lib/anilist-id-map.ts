const anilistEndpoint = "https://graphql.anilist.co"
const batchSize = 50
const batchDelayMs = 250
const maxRetries = 5
const retryBaseDelayMs = 1000

type FetchMappingsOptions = {
  onProgress?: (progress: { completed: number; total: number }) => void
}

type MappingResponse = {
  data?: Record<
    string,
    {
      id: number | null
      idMal: number | null
    } | null
  >
  errors?: Array<{
    message: string
  }>
}

function wait(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs)
  })
}

function getRetryDelayMs(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after")
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000
  }

  return retryBaseDelayMs * 2 ** attempt
}

async function fetchMappings(
  ids: number[],
  key: "id" | "idMal",
  options: FetchMappingsOptions = {}
) {
  if (ids.length === 0) {
    return new Map<
      number,
      { anilistId: number | null; myanimelistId: number | null }
    >()
  }

  const result = new Map<
    number,
    { anilistId: number | null; myanimelistId: number | null }
  >()

  for (let index = 0; index < ids.length; index += batchSize) {
    const batch = ids.slice(index, index + batchSize)
    const variables = Object.fromEntries(
      batch.map((id, batchIndex) => [`value${batchIndex}`, id])
    )

    const variableDefinitions = batch
      .map((_, batchIndex) => `$value${batchIndex}: Int`)
      .join(", ")
    const fields = batch
      .map(
        (_, batchIndex) =>
          `entry${batchIndex}: Media(${key}: $value${batchIndex}, type: ANIME) { id idMal }`
      )
      .join("\n")

    let payload: MappingResponse | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const response = await fetch(anilistEndpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          query: `query AniListIdMap(${variableDefinitions}) { ${fields} }`,
          variables,
        }),
      })

      payload = (await response.json()) as MappingResponse

      if (response.status === 429 && attempt < maxRetries) {
        await wait(getRetryDelayMs(response, attempt))
        continue
      }

      if (!response.ok || payload.errors?.length) {
        throw new Error(
          payload.errors?.[0]?.message ?? "AniList mapping request failed."
        )
      }

      break
    }

    if (!payload) {
      throw new Error("AniList mapping request failed.")
    }

    for (const [batchIndex, id] of batch.entries()) {
      const mapping = payload.data?.[`entry${batchIndex}`] ?? null

      result.set(id, {
        anilistId: mapping?.id ?? null,
        myanimelistId: mapping?.idMal ?? null,
      })
    }

    options.onProgress?.({
      completed: Math.min(index + batch.length, ids.length),
      total: ids.length,
    })

    if (index + batchSize < ids.length) {
      await wait(batchDelayMs)
    }
  }

  return result
}

export async function fetchMyAnimeListIdsForAniListIds(
  ids: number[],
  options?: FetchMappingsOptions
) {
  const result = await fetchMappings(ids, "id", options)
  return new Map(
    [...result.entries()].map(([anilistId, mapping]) => [
      anilistId,
      mapping.myanimelistId,
    ])
  )
}

export async function fetchAniListIdsForMyAnimeListIds(
  ids: number[],
  options?: FetchMappingsOptions
) {
  const result = await fetchMappings(ids, "idMal", options)
  return new Map(
    [...result.entries()].map(([myanimelistId, mapping]) => [
      myanimelistId,
      mapping.anilistId,
    ])
  )
}
