import { createFileRoute } from "@tanstack/react-router"
import { AnimeOverlapPage } from "@/components/anime-overlap-page"
import { lookupOverlap } from "@/lib/server-functions"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return <AnimeOverlapPage lookup={lookupOverlap} />
}
