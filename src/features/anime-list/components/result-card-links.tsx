import { ResultCardActions } from "@/features/anime-list/components/result-card-actions"
import type { AnimeSource } from "@/features/anime-list/domain/anime-list-enums"
import type { OverlapResult } from "@/features/anime-list/domain/lookup-response"
import { getSourceLabel } from "@/features/anime-list/lib/labels"

function SourceLogo({
  className,
  source,
}: {
  className?: string
  source: AnimeSource
}) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      src={
        source === "myanimelist"
          ? "/myanimelist-favicon.svg"
          : "/anilist-favicon-32x32.png"
      }
    />
  )
}

export function ResultCardLinks({
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  result,
}: {
  onBlur?: (event: React.FocusEvent<HTMLAnchorElement>) => void
  onFocus?: () => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  result: OverlapResult
}) {
  const links = [
    {
      href: result.entry.media.siteUrl,
      label: getSourceLabel(result.entry.source),
      icon: (
        <SourceLogo
          className="size-4 shrink-0 rounded-sm"
          source={result.entry.source}
        />
      ),
    },
  ]
  if (result.matchedJimaku) {
    links.push({
      href: result.matchedJimaku.url,
      label: "Jimaku",
      icon: (
        <img
          alt=""
          aria-hidden="true"
          className="size-4 shrink-0"
          src="/jimaku-favicon.ico"
        />
      ),
    })
  }
  if (result.matchedJpdb) {
    links.push({
      href: result.matchedJpdb.entry.jpdbUrl,
      label: "JPDB",
      icon: (
        <img
          alt=""
          aria-hidden="true"
          className="size-4 shrink-0 rounded-sm"
          src="/jpdb-favicon-32x32.png"
        />
      ),
    })
  }
  if (result.matchedLearnNatively) {
    links.push({
      href: result.matchedLearnNatively.entry.learnnativelyUrl,
      label: "LearnNatively",
      icon: (
        <img
          alt=""
          aria-hidden="true"
          className="size-4 shrink-0 rounded-sm"
          src="/learnnatively-favicon-32x32.png"
        />
      ),
    })
  }

  return {
    actions: (
      <ResultCardActions
        links={links}
        onBlur={onBlur}
        onFocus={onFocus}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      />
    ),
    overlay: (
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden p-2.5 lg:block">
        <div className="pointer-events-auto flex origin-top transform-gpu flex-col gap-1.5 opacity-0 scale-[0.95] transition-[opacity,transform] duration-200 ease-out group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100">
          <ResultCardActions
            links={links}
            onBlur={onBlur}
            onFocus={onFocus}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
          />
        </div>
      </div>
    ),
  }
}
