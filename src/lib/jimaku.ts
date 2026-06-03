import snapshot from "@/data/jimaku-snapshot.json"
import type { JimakuEntry } from "@/lib/types"

let cachedSnapshot: JimakuEntry[] | null = null

export async function loadJimakuSnapshot() {
  if (cachedSnapshot) {
    return cachedSnapshot
  }

  cachedSnapshot = snapshot as JimakuEntry[]

  return cachedSnapshot
}
