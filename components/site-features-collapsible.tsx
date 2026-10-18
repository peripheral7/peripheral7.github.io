"use client"

import { useEffect, useRef, useState } from "react"
import type { Feature } from "@/lib/features"

// 메인 화면 "Midterm": 제목 줄만 보이고, 누르면 목록이 제목 줄 아래로 내려오며 열린다(다시 누르면 접힘).
// 목록은 absolute 로 아래 영역 위에 겹쳐 뜨므로 열려도 페이지(레이아웃) 높이는 변하지 않는다. 바깥을 누르거나 Esc 로도 닫는다.
export function SiteFeaturesCollapsible({ title, items }: { title: string; items: Feature[] }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <nav ref={rootRef} aria-label={title} className="relative border-y border-foreground/25">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="midterm-panel"
        className="flex w-full items-center justify-between gap-2 py-4 text-left font-sans text-sm font-extrabold tracking-[0.12em] text-foreground transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
      >
        {title}
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`h-3 w-3 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>

      <div
        id="midterm-panel"
        inert={!open}
        className={`absolute inset-x-0 top-full z-30 overflow-hidden border-b border-foreground/25 bg-background transition-[max-height,opacity] duration-300 ease-out ${
          open ? "max-h-[32rem] opacity-100" : "max-h-0 border-b-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-1 pb-4">
          {items.map((feature) => (
            <li key={feature.href}>
              <a
                href={feature.href}
                className="text-sm leading-snug text-foreground/80 transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
              >
                {feature.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
