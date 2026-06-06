import { Badge } from "@/components/ui/badge"
import { FieldLabel } from "@/components/ui/field-label"
import type { OverlapResult } from "@/features/anime-list/domain/lookup-response"
import { getMediaStatusLabel } from "@/features/anime-list/lib/labels"

export function ResultCardDetails({ result }: { result: OverlapResult }) {
  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <InfoItem
          label="Episodes"
          value={result.entry.media.episodes ?? "Unknown"}
        />
        <InfoItem
          label="Jimaku Files"
          value={result.matchedJimaku?.fileCount ?? 0}
        />
        {result.matchedJpdb ? (
          <>
            <InfoItem
              label="Average difficulty"
              value={`${result.matchedJpdb.entry.averageDifficulty}/100`}
            />
            <InfoItem
              label="Peak difficulty"
              value={`${result.matchedJpdb.entry.peakDifficulty90thPercentile}/100`}
            />
            <InfoItem
              label="Length"
              value={`${result.matchedJpdb.entry.lengthInWords.toLocaleString()} words`}
            />
            <InfoItem
              label="Unique words"
              value={result.matchedJpdb.entry.uniqueWords.toLocaleString()}
            />
            <InfoItem
              label="Unique kanji"
              value={result.matchedJpdb.entry.uniqueKanji.toLocaleString()}
            />
            <InfoItem
              label="Words used once"
              value={`${result.matchedJpdb.entry.uniqueWordsUsedOnce.toLocaleString()} (${result.matchedJpdb.entry.uniqueWordsUsedOncePercent}%)`}
            />
            <InfoItem
              label="Unique readings"
              value={result.matchedJpdb.entry.uniqueKanjiReadings.toLocaleString()}
            />
          </>
        ) : null}
        {result.matchedLearnNatively ? (
          <InfoItem
            label="LearnNatively"
            value={`${result.matchedLearnNatively.entry.level} • ${result.matchedLearnNatively.jlptEquivalent}`}
          />
        ) : null}
        <InfoItem
          label="Airing Status"
          value={getMediaStatusLabel(result.entry.media.status)}
        />
      </div>
      <div className="border-t border-border pt-3.5">
        <FieldLabel>Genres</FieldLabel>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {result.entry.media.genres.length > 0 ? (
            result.entry.media.genres.map((genre) => (
              <Badge className="px-2.5" key={genre} variant="neutral">
                {genre}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">Unknown</span>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  )
}
