import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { JimakuEntry } from "@/lib/types"

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const snapshotPath = path.resolve(
  currentDirectory,
  "../data/jimaku-snapshot.json"
)

let cachedSnapshot: JimakuEntry[] | null = null

export async function loadJimakuSnapshot() {
  if (cachedSnapshot) {
    return cachedSnapshot
  }

  const raw = await readFile(snapshotPath, "utf8")
  cachedSnapshot = JSON.parse(raw) as JimakuEntry[]

  return cachedSnapshot
}
