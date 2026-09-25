"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { Post } from "@/lib/posts"
import { CATEGORY_LABELS, CATEGORY_ORDER, normalizePath } from "@/lib/site-nav"

// 창이 좁을 때(폭 1440px 미만 — 풀HD·QHD 모니터의 절반 창, 노트북 창, 폰 포함)는 왼쪽 플로팅 목차(SiteSidebar)가 본문을 가리므로
// 그 자리에 화면 맨 위에 붙는 상단바를 쓴다. 왼쪽은 홈 링크, 오른쪽 INDEX 버튼을 누르면 카테고리별 글 목록이 펼쳐진다.
// 전환 폭(nav 브레이크포인트)은 app/globals.css의 --breakpoint-nav 한 곳에서 정한다.
export function SiteTopbar({ posts }: { posts: Post[] }) {
  const pathname = usePathname()
  const current = normalizePath(pathname ?? "/")
  const currentPost = posts.find((p) => p.href && normalizePath(p.href) === current)

  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLElement>(null)

  // 다른 페이지로 옮겨 가면 목록을 닫는다.
  useEffect(() => {
    setOpen(false)
  }, [current])

  // 열려 있을 때: 바 바깥을 누르거나 Esc를 누르면 닫는다. pointerdown을 캡처 단계에서 받아
  // 다른 요소가 이벤트를 막아도 닫히고, 누른 곳의 원래 동작은 막지 않는다.
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

  // 메인 페이지는 자체 머리말이 있어 목차(플로팅 카드·상단바)를 쓰지 않는다.
  if (current === "/") return null

  return (
    <header
      ref={rootRef}
      className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-sm nav:hidden"
    >
      <div className="flex h-12 items-center justify-between gap-3 px-4 md:px-8">
        <Link
          href="/"
          className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-foreground transition-colors hover:text-accent"
        >
          ← THE FIELD FILE
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="site-index-panel"
          className={`flex items-center gap-1.5 py-2 pl-2 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            open ? "text-accent" : "text-muted-foreground"
          }`}
        >
          Index
          <svg
            aria-hidden
            viewBox="0 0 12 12"
            className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 4.5 6 8l3.5-3.5" />
          </svg>
        </button>
      </div>

      {open && (
        <nav
          id="site-index-panel"
          aria-label="글 목록"
          className="absolute right-3 top-full mt-1 max-h-[calc(100dvh-4.25rem)] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-border/60 bg-background px-5 py-5 shadow-xl md:right-6"
        >
          <div className="flex flex-col gap-5">
            {CATEGORY_ORDER.map((category) => {
              const categoryPosts = posts.filter((p) => p.category === category)
              if (categoryPosts.length === 0) return null

              return (
                <div key={category}>
                  <p
                    className={`font-mono text-[0.7rem] uppercase tracking-[0.2em] ${
                      category === currentPost?.category ? "text-accent" : "text-muted-foreground"
                    }`}
                  >
                    {CATEGORY_LABELS[category]}
                  </p>
                  <ul className="mt-2 flex flex-col border-l border-border pl-3">
                    {categoryPosts.map((post) => {
                      const isCurrent = post.id === currentPost?.id
                      return (
                        <li key={post.id}>
                          <Link
                            href={post.href ?? "/"}
                            aria-current={isCurrent ? "page" : undefined}
                            className={`block py-1 text-sm leading-snug transition-colors ${
                              isCurrent ? "font-semibold text-accent" : "text-foreground/80 hover:text-accent"
                            }`}
                          >
                            {post.title}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}
