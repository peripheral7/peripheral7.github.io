"use client"

import { BoardItem } from "@/components/board-item"
import { useBoardFilter } from "@/components/board-filter-context"
import type { Post } from "@/lib/posts"

const filterOptions = [
  { label: "All entries", value: "ALL" },
  { label: "Research", value: "RESEARCH" },
  { label: "Photography", value: "PHOTOGRAPHY" },
  { label: "Motorcycles", value: "MOTORCYCLE" },
  { label: "Study", value: "STUDY" }
] as const

export function ScrapbookBoard({ initialPosts }: { initialPosts: Post[] }) {
  const { filter, setFilter } = useBoardFilter()

  const filteredPosts = filter === "ALL" 
    ? initialPosts 
    : initialPosts.filter(post => post.category === filter)

  return (
    <section
      id="board"
      // paper-grain과 bg-background(순백색)가 결합되어 질감 있는 화이트 캔버스 역할
      className="paper-grain relative bg-background px-4 pb-24 pt-14 md:px-10"
    >
      {/* section masthead */}
      <div className="mx-auto mb-10 max-w-7xl border-y-[1.5px] border-border py-6">
        <div className="flex flex-col items-center text-center">
          {/* text-accent가 globals.css의 토마토 레드로 자동 적용됨 */}
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent font-bold">
            The board
          </p>
          <h2 className="mt-3 font-sans text-3xl font-extrabold uppercase leading-none tracking-tight text-foreground md:text-5xl">
            Reports
          </h2>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`font-mono text-[0.7rem] uppercase tracking-[0.15em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                filter === f.value
                  ? "bg-accent px-4 py-2 text-background font-bold shadow-sm" // 선택됨: 빨간 바탕 + 흰 글씨
                  : "border border-border bg-background px-4 py-2 text-muted-foreground hover:border-accent hover:text-accent" // 미선택: 마우스 올리면 빨간 테두리+글씨
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 반응형 그리드 — CSS 다단(columns)은 항목을 위→아래로 열 단위 채우기 때문에
          읽는 순서가 뒤섞이고, 열 높이 추정이 어긋나면 카드가 배경 밖으로 밀려나는
          문제가 있어(특히 태블릿 md:columns-3 구간) grid로 교체해 DOM 순서를 그대로 보존 */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {filteredPosts.map((post, i) => (
          <div
            key={post.id}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(i * 60, 480)}ms` }}
          >
            <BoardItem post={post} />
          </div>
        ))}
      </div>
      
      {/* 검색 결과가 없을 때의 UI 처리 (추가됨) */}
      {filteredPosts.length === 0 && (
        <div className="mt-20 text-center font-mono text-sm uppercase tracking-widest text-muted-foreground">
          No records found in this category.
        </div>
      )}

      {/* 하단 스크랩 섹션 */}
      <div className="mx-auto mt-24 max-w-7xl">
        <div className="relative bg-card p-8 shadow-scrap ring-1 ring-border/50">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent font-bold">
                Add to the file
              </p>
              <h3 className="mt-2 max-w-xl text-balance font-sans text-2xl font-extrabold uppercase leading-tight tracking-tight text-card-foreground">
                Pin a paper, a photograph, or a machine
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Drop a land-evaluation study, a roll of film, or a garage log.
                It goes straight onto the board.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              {["Upload research", "Upload photograph", "Upload ride log"].map(
                (label) => (
                  <button
                    key={label}
                    // hover:bg-accent로 마우스를 올리면 강렬한 레드로 반전
                    className="whitespace-nowrap border border-border bg-background px-5 py-3 font-mono text-xs uppercase tracking-[0.15em] text-foreground transition-colors hover:border-accent hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {label} →
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* colophon */}
      <footer className="mx-auto mt-20 flex max-w-7xl flex-col gap-2 border-t border-border pt-8 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>The Field File — No. 027</span>
        <span>Land · Light · Machines</span>
        <span>Filed {new Date().getFullYear()}</span>
      </footer>
    </section>
  )
}