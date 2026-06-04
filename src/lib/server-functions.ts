import { createServerFn } from "@tanstack/react-start"
import { findOverlap } from "@/lib/overlap"
import type { AnimeSource } from "@/lib/types"

export const lookupOverlap = createServerFn({ method: "GET" })
  .inputValidator((data: { source: AnimeSource; username: string }) => data)
  .handler(
    async ({ data }: { data: { source: AnimeSource; username: string } }) =>
      findOverlap(data.source, data.username)
  )
