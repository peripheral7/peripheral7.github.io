"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import type { Category, Post } from "@/lib/posts"
import { CATEGORY_LABELS, CATEGORY_ORDER, normalizePath as normalize } from "@/lib/site-nav"

// 폭 1440px 이상(nav 브레이크포인트, app/globals.css)에서만 보이는 왼쪽 플로팅 목차. 그보다 좁은 창에서는 상단바(SiteTopbar)가 대신한다.
export function SiteSidebar({ posts }: { posts: Post[] }) {
  const pathname = usePathname()
  const current = normalize(pathname ?? "/")
  const currentPost = posts.find((p) => p.href && normalize(p.href) === current)
  const currentCategory = currentPost?.category

  // Which category's post list is expanded. Defaults to (and re-syncs with)
  // whatever category the current page belongs to, but a click can open a
  // different category, or collapse the current one, without navigating.
  const [openCategory, setOpenCategory] = useState<Category | null>(currentCategory ?? null)
  useEffect(() => {
    setOpenCategory(currentCategory ?? null)
  }, [currentCategory])

  if (current === "/") return null

  // Photography 글에서는 평소 숨겨 두고, 화면 왼쪽 끝에 마우스를 올리면 Photography 목차만 배경 없이 위아래 가는 선과 함께 나타난다.
  // 검은 배경을 가정해 흰 글자를 쓰되, mix-blend-difference 로 밝은 배경 페이지에서도 읽히게 한다.
  if (currentCategory === "PHOTOGRAPHY") {
    const photoPosts = posts.filter((p) => p.category === "PHOTOGRAPHY")
    return (
      <aside className="group fixed inset-y-0 left-0 z-40 hidden w-5 hover:w-72 focus-within:w-72 md:block">
        <nav
          aria-label="Photography"
          className="absolute left-4 top-1/2 w-60 -translate-x-3 -translate-y-1/2 border-y border-white/30 py-5 text-white opacity-0 mix-blend-difference transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100"
        >
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-white/60">{CATEGORY_LABELS.PHOTOGRAPHY}</p>
          <ul className="mt-3 flex max-h-[65vh] flex-col gap-1.5 overflow-y-auto">
            {photoPosts.map((post) => {
              const isCurrent = post.id === currentPost?.id
              return (
                <li key={post.id}>
                  <Link
                    href={post.href ?? "/"}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`block text-sm leading-snug transition-colors ${isCurrent ? "font-semibold text-white" : "text-white/60 hover:text-white"}`}
                  >
                    {post.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    )
  }

  return (
    <aside className="pointer-events-none fixed left-4 top-1/2 z-40 hidden max-h-[75vh] w-60 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border/60 bg-background/95 shadow-xl backdrop-blur-sm nav:block">
      {/* the floating card overlaps page content instead of reserving space
          for itself, so only the links themselves catch clicks (pointer-events-auto) —
          empty padding/gaps stay click-through to whatever's underneath */}
      <div className="flex flex-col px-5 py-6">
        <Link
          href="/"
          className="pointer-events-auto font-mono text-xs font-semibold uppercase tracking-[0.25em] text-foreground transition-colors hover:text-accent"
        >
          ← THE FIELD FILE
        </Link>

        <nav className="mt-8 flex flex-col gap-5">
          {CATEGORY_ORDER.map((category) => {
            const categoryPosts = posts.filter((p) => p.category === category)
            if (categoryPosts.length === 0) return null
            const isOpen = category === openCategory

            return (
              <div key={category}>
                <button
                  type="button"
                  onClick={() => setOpenCategory((prev) => (prev === category ? null : category))}
                  aria-expanded={isOpen}
                  className={`pointer-events-auto block w-full bg-transparent p-0 text-left font-mono text-[0.7rem] uppercase tracking-[0.2em] transition-colors hover:text-accent ${
                    isOpen ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </button>

                {isOpen && (
                  <ul className="mt-2 flex flex-col gap-1.5 border-l border-border pl-3">
                    {categoryPosts.map((post) => {
                      const isCurrent = post.id === currentPost?.id
                      return (
                        <li key={post.id}>
                          <Link
                            href={post.href ?? "/"}
                            aria-current={isCurrent ? "page" : undefined}
                            className={`pointer-events-auto block text-sm leading-snug transition-colors ${
                              isCurrent
                                ? "font-semibold text-accent"
                                : "text-foreground/80 hover:text-accent"
                            }`}
                          >
                            {post.title}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
