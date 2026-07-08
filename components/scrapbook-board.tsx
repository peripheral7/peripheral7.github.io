"use client"

import { BoardItem } from "@/components/board-item"
import { useBoardFilter } from "@/components/board-filter-context"
import type { Post } from "@/lib/posts"

const filterOptions = [
  { label: "All entries", value: "ALL" },
  { label: "Research", value: "RESEARCH" },
  { label: "Photography", value: "PHOTOGRAPHY" },
  { label: "Motorcycles", value: "MOTORCYCLE" }
] as const

export function ScrapbookBoard({ initialPosts }: { initialPosts: Post[] }) {
  const { filter, setFilter } = useBoardFilter()

  const filteredPosts = filter === "ALL" 
    ? initialPosts 
    : initialPosts.filter(post => post.category === filter)

  return (
    <section
      id="board"
      className="paper-grain relative bg-background px-4 pb-24 pt-14 md:px-10"
    >
      {/* section masthead */}
      <div className="mx-auto mb-10 max-w-7xl border-y-2 border-foreground py-5">
        <div className="flex flex-col items-center text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            The board
          </p>
          <h2 className="mt-2 font-sans text-3xl font-extrabold uppercase leading-none tracking-tight text-foreground md:text-5xl">
            Reports
          </h2>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`font-mono text-[0.7rem] uppercase tracking-[0.15em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                filter === f.value
                  ? "bg-accent px-3 py-1.5 text-background font-bold"
                  : "border border-border px-3 py-1.5 text-muted-foreground hover:border-accent hover:text-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 반응형 Masonry 그리드 수정:
        - 기본(Mobile): columns-1
        - sm (아이패드 미니 수준의 작은 창): columns-2
        - md, lg (아이패드 및 일반 브라우저 반 스크린): columns-3
        - xl 이상 (큰 모니터 전체화면): columns-4
        - 카드 바깥 테이프 유실 방지를 위한 overflow-visible 설정 보장
      */}
      <div className="mx-auto max-w-7xl columns-1 gap-6 overflow-visible sm:columns-2 md:columns-3 xl:columns-4 [&>*:nth-child(3n)]:mt-8 [&>*:nth-child(4n)]:mt-4">
        {filteredPosts.map((post) => (
          <BoardItem key={post.id} post={post} />
        ))}
      </div>

      {/* 하단 스크랩 섹션 — 불필요한 배경 테이프 장식 제거 및 디자인 고도화 */}
      <div className="mx-auto mt-20 max-w-7xl">
        <div className="relative bg-card p-8 shadow-scrap ring-1 ring-black/5">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
                Add to the file
              </p>
              <h3 className="mt-2 max-w-xl text-balance font-sans text-2xl font-extrabold uppercase leading-tight tracking-tight text-card-foreground">
                Pin a paper, a photograph, or a machine
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Drop a land-evaluation study, a roll of film, or a garage log.
                It goes straight onto the board.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              {["Upload research", "Upload photograph", "Upload ride log"].map(
                (label) => (
                  <button
                    key={label}
                    className="whitespace-nowrap border border-foreground bg-transparent px-5 py-3 font-mono text-xs uppercase tracking-[0.15em] text-foreground transition-colors hover:bg-accent hover:text-background hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
      <footer className="mx-auto mt-16 flex max-w-7xl flex-col gap-2 border-t border-border pt-6 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>The Field File — No. 037</span>
        <span>Land · Light · Machines</span>
        <span>Filed {new Date().getFullYear()}</span>
      </footer>
    </section>
  )
}