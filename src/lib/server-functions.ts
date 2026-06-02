import { createServerFn } from "@tanstack/react-start"
import { findOverlap } from "@/lib/overlap"

export const lookupOverlap = createServerFn({ method: "GET" })
  .inputValidator((data: { username: string }) => data)
  .handler(async ({ data }: { data: { username: string } }) =>
    findOverlap(data.username)
  )
