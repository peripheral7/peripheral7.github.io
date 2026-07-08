import { SiteHero } from "@/components/site-hero"
import { ScrapbookBoard } from "@/components/scrapbook-board"
import { BoardFilterProvider } from "@/components/board-filter-context"

export default function Page() {
  return (
    <BoardFilterProvider>
      <main className="min-h-screen bg-background">
        <SiteHero />
        <ScrapbookBoard />
      </main>
    </BoardFilterProvider>
  )
}
