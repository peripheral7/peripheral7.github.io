import { SiteHero } from "@/components/site-hero"
import { ScrapbookBoard } from "@/components/scrapbook-board"
import { BoardFilterProvider } from "@/components/board-filter-context"
import { posts } from "@/lib/posts" 


export default function Page() {
  return (
    <BoardFilterProvider>
      {/* 화이트 테마 대응을 위해 text-foreground 추가 */}
      <main className="min-h-screen bg-background text-foreground">
        <SiteHero />
        {/* 데이터를 props로 주입합니다 */}
        <ScrapbookBoard initialPosts={posts} />
      </main>
    </BoardFilterProvider>
  )
}