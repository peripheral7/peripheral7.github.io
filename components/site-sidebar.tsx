"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import type { Category, Post } from "@/lib/posts"

const CATEGORY_LABELS: Record<Category, string> = {
  STUDY: "Study",
  RESEARCH: "Research",
  PHOTOGRAPHY: "Photography",
}

const CATEGORY_ORDER: Category[] = ["STUDY", "RESEARCH", "PHOTOGRAPHY"]

function normalize(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1)
  return path || "/"
}

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

  return (
    <aside className="pointer-events-none fixed left-4 top-1/2 z-40 hidden max-h-[75vh] w-60 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border/60 bg-background/95 shadow-xl backdrop-blur-sm md:block">
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
