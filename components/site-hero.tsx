"use client"

import Image from "next/image"
import { useBoardFilter, type Filter } from "@/components/board-filter-context"
import { SubjectProgressPanel } from "@/components/subject-progress-panel"

const nav: { label: string; value: Filter }[] = [
  { label: "Research", value: "RESEARCH" },
  { label: "Photography", value: "PHOTOGRAPHY" },
  { label: "Motorcycles", value: "MOTORCYCLE" },
  { label: "Index", value: "ALL" },
]

export function SiteHero() {
  const { setFilter } = useBoardFilter()

  return (
    <header className="relative w-full bg-background text-foreground">
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-5 md:px-10">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            2026
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Field File
          </span>
        </div>
        <nav className="hidden gap-7 md:flex">
          {nav.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground underline-offset-8 transition-colors hover:text-foreground hover:underline"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <span className="bg-accent px-2 py-1 font-mono text-xs uppercase tracking-[0.2em] text-accent-foreground">
          Classified · Open
        </span>
      </div>

      {/* photograph on white, centered, with the title anchored to its bottom edge */}
      <div className="relative flex min-h-[calc(100svh-72px)] flex-col items-center justify-center px-5 pb-16 md:px-10">
        {/* wide viewports leave empty margin beside the centered figure — use it for the study-progress widget */}
        <div className="absolute bottom-16 left-8 hidden xl:block">
          <SubjectProgressPanel />
        </div>

        <figure className="relative w-full max-w-md">
          <Image
            src="/images/hero-tree.jpg"
            alt="A bare-branched tree reaching across a pale evening sky above dense forest"
            width={1200}
            height={1800}
            priority
            sizes="(max-width: 768px) 92vw, 28rem"
            className="h-auto w-full object-fill"
          />

          {/* caption line above the title, sitting on the photo edge */}
          <figcaption className="mt-3 flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
            <span>20231009 · 17:55</span>
            <span>Fig. 01 — Field Study</span>
          </figcaption>

          {/* title, right at the bottom of the photograph */}
          <h1 className="mt-1 text-center font-sans text-[13vw] font-black uppercase leading-[1] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            MoooooN
          </h1>
        </figure>

        <p className="mt-8 max-w-md text-pretty text-center text-sm leading-relaxed text-muted-foreground">
          Land evaluation research, photographs, and motorcycle.
        </p>
        <span className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Scroll to the board ↓
        </span>
      </div>
    </header>
  )
}
