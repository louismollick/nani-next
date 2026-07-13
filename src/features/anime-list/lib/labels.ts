import type {
  AnimeSource,
  DifficultyFilterMode,
  MediaStatus,
  MyAnimeFilterMode,
  SortDirection,
  SortOption,
  SubtitleAvailabilityOption,
} from "@/features/anime-list/domain/anime-list-enums"
import { mediaStatusLabel } from "@/lib/status"

export const difficultyFilterModeLabels: Record<DifficultyFilterMode, string> =
  {
    none: "No difficulty filter",
    jpdbAverageDifficulty: "JPDB Average Difficulty",
    jitenDifficulty: "Jiten Difficulty",
    learnNativelyLevel: "LearnNatively Level",
    learnNativelyJlptEquivalent: "LearnNatively JLPT Equivalent",
  }

export const subtitleAvailabilityLabels: Record<
  SubtitleAvailabilityOption,
  string
> = {
  all: "All episodes subtitled",
  some: "Some episodes subtitled",
  none: "No episodes subtitled",
}

export const sortOptionLabels: Record<SortOption, string> = {
  averageScore: "Average Score",
  popularity: "Popularity",
  jpdbAverageDifficulty: "JPDB Average Difficulty",
  jitenDifficulty: "Jiten Difficulty",
  learnNativelyLevel: "LearnNatively Level",
  title: "Title",
  status: "Watch Status",
}

export const sortDirectionLabels: Record<SortDirection, string> = {
  desc: "Desc",
  asc: "Asc",
}

export const myAnimeFilterModeLabels: Record<MyAnimeFilterMode, string> = {
  onlyMine: "Only show my anime",
  showAll: "Show all anime",
  hideMine: "Hide my anime",
}

export const sourceFavicons: Record<AnimeSource, string> = {
  anilist: "/anilist-favicon-32x32.png",
  myanimelist: "/myanimelist-favicon.svg",
}

export function getSourceLabel(source: AnimeSource) {
  return source === "myanimelist" ? "MyAnimeList" : "AniList"
}

export function getMediaStatusLabel(status: MediaStatus) {
  return status ? (mediaStatusLabel[status] ?? "Unknown") : "Unknown"
}
