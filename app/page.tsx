import { SiteHero } from "@/components/site-hero"
import { ScrapbookBoard } from "@/components/scrapbook-board"
import { BoardFilterProvider } from "@/components/board-filter-context"

// 데이터 페칭(fs 읽기)은 서버 컴포넌트인 app/page.tsx에서 수행하고, 필터링과 렌더링을 담당하는 클라이언트 컴포넌트로 데이터를 props로 넘겨주는 방식으로 분리해야 합니다.
import { posts } from "@/lib/posts" // 여기서 데이터를 불러옵니다.

export default function Page() {
  return (
    <BoardFilterProvider>
      <main className="min-h-screen bg-background">
        <SiteHero />
        {/* 데이터를 props로 주입합니다 */}
        <ScrapbookBoard initialPosts={posts} />
      </main>
    </BoardFilterProvider>
  )
}