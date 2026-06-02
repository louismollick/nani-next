import { describe, expect, it } from "vitest"
import { normalizeTitle, uniqStrings } from "@/lib/normalize"

describe("normalizeTitle", () => {
  it("normalizes punctuation, spacing, and case", () => {
    expect(normalizeTitle("3-gatsu no Lion: Season 2!")).toBe(
      "3 gatsu no lion 2"
    )
  })

  it("deduplicates title lists", () => {
    expect(uniqStrings(["A", "A", "B", "", null])).toEqual(["A", "B"])
  })
})
