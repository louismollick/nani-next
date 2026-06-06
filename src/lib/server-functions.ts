import { createServerFn } from "@tanstack/react-start"
import { animeSources } from "@/features/anime-list/domain/anime-list-enums"
import { findAnimeListOverlap } from "@/features/anime-list/server/lookup-anime-list"
import type { AnimeSource } from "@/lib/types"

function validateLookupInput(data: unknown): {
  source: AnimeSource
  username: string
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid lookup input.")
  }

  const { source, username } = data as {
    source?: unknown
    username?: unknown
  }

  if (
    typeof source !== "string" ||
    !animeSources.includes(source as AnimeSource)
  ) {
    throw new Error("Invalid anime source.")
  }

  if (typeof username !== "string" || username.trim().length === 0) {
    throw new Error("Username is required.")
  }

  return { source: source as AnimeSource, username }
}

export const lookupOverlap = createServerFn({ method: "GET" })
  .inputValidator(validateLookupInput)
  .handler(async ({ data }) => findAnimeListOverlap(data.source, data.username))
