"use client"

import { posts } from "@/lib/posts"
import { BoardItem } from "@/components/board-item"
import { useBoardFilter, type Filter } from "@/components/board-filter-context"

const filters: { label: string; value: Filter }[] = [
  { label: "All entries", value: "ALL" },
  { label: "Research", value: "RESEARCH" },
  { label: "Photography", value: "PHOTOGRAPHY" },
  { label: "Motorcycles", value: "MOTORCYCLE" },
]

export function ScrapbookBoard() {
  const { filter, setFilter } = useBoardFilter()
  const visiblePosts =
    filter === "ALL" ? posts : posts.filter((post) => post.category === filter)

  return (
    <section
      id="board"
      className="paper-grain relative bg-background px-4 pb-24 pt-14 md:px-10"
    >
      {/* section masthead */}
      <div className="mx-auto mb-10 max-w-6xl border-y-2 border-foreground py-5">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              The board
            </p>
            <h2 className="mt-2 font-sans text-3xl font-extrabold uppercase leading-none tracking-tight text-foreground md:text-5xl">
              Everything, unfiled
            </h2>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {filters.map((f) => {
            const active = filter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={active}
                className={`font-mono text-[0.7rem] uppercase tracking-[0.15em] transition-colors ${
                  active
                    ? "bg-foreground px-3 py-1.5 text-background"
                    : "border border-border px-3 py-1.5 text-muted-foreground hover:border-accent hover:text-accent"
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* the scrapbook — deliberately unstructured masonry */}
      <div className="mx-auto max-w-6xl columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*:nth-child(3n)]:mt-8 [&>*:nth-child(4n)]:mt-4">
        {visiblePosts.map((post) => (
          <BoardItem key={post.id} post={post} />
        ))}
      </div>

      {/* contribute / upload strip */}
      <div className="mx-auto mt-16 max-w-6xl">
        <div className="scrap relative bg-card p-8 shadow-scrap ring-1 ring-black/5" style={{ ["--r" as string]: "-1deg" }}>
          <span aria-hidden className="tape absolute -top-3 left-10 h-6 w-24 rotate-3" />
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
                It goes straight onto the board — crooked, like everything else.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              {["Upload research", "Upload photograph", "Upload ride log"].map(
                (label) => (
                  <button
                    key={label}
                    className="whitespace-nowrap border border-foreground bg-transparent px-5 py-3 font-mono text-xs uppercase tracking-[0.15em] text-foreground transition-colors hover:bg-foreground hover:text-background"
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
      <footer className="mx-auto mt-16 flex max-w-6xl flex-col gap-2 border-t border-border pt-6 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>The Field File — No. 037</span>
        <span>Land · Light · Machines</span>
        <span>Filed {new Date().getFullYear()}</span>
      </footer>
    </section>
  )
}
