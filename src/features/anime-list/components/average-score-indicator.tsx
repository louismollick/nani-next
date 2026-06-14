import type { AverageScorePresentation } from "@/features/anime-list/lib/result-presenters"
import { cn } from "@/lib/utils"

export function AverageScoreIndicator({
  className,
  presentation,
}: {
  className?: string
  presentation: AverageScorePresentation
}) {
  return (
    <span
      aria-label={`Average Score ${presentation.percentage} ${presentation.label}`}
      className={cn("inline-flex items-center gap-1.5 align-middle", className)}
      role="img"
    >
      <AverageScoreFace presentation={presentation} />
      <span className="self-center font-semibold leading-none text-foreground/85">
        {presentation.percentage}
      </span>
    </span>
  )
}

function AverageScoreFace({
  presentation,
}: {
  presentation: AverageScorePresentation
}) {
  const isGreat = presentation.label === "Great"
  const isMixed = presentation.label === "Mixed"

  return (
    <svg
      aria-hidden="true"
      className={cn("size-4 shrink-0 self-center", presentation.toneClassName)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="8.5" cy="9" r="1.15" fill="currentColor" />
      <circle cx="15.5" cy="9" r="1.15" fill="currentColor" />
      {isGreat ? (
        <path
          d="M8 14.1c1 1.35 2.35 2.05 4 2.05s3-.7 4-2.05"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.75"
        />
      ) : null}
      {isMixed ? (
        <path
          d="M8.25 14.75h7.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.75"
        />
      ) : null}
      {!isGreat && !isMixed ? (
        <path
          d="M8 16.1c1-1.35 2.35-2.05 4-2.05s3 .7 4 2.05"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.75"
        />
      ) : null}
    </svg>
  )
}
