import { SiteHero } from "@/components/site-hero"
import { ScrapbookBoard } from "@/components/scrapbook-board"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHero />
      <ScrapbookBoard />
    </main>
  )
}
