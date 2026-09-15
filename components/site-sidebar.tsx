"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Category, Post } from "@/lib/posts"

const CATEGORY_LABELS: Record<Category, string> = {
  STUDY: "Study",
  RESEARCH: "Research",
  PHOTOGRAPHY: "Photography",
  MOTORCYCLE: "Motorcycle",
}

const CATEGORY_ORDER: Category[] = ["STUDY", "RESEARCH", "PHOTOGRAPHY", "MOTORCYCLE"]

function normalize(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1)
  return path || "/"
}

export function SiteSidebar({ posts }: { posts: Post[] }) {
  const pathname = usePathname()
  const current = normalize(pathname ?? "/")
  const currentPost = posts.find((p) => p.href && normalize(p.href) === current)
  const currentCategory = currentPost?.category

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-border bg-background md:block">
      <div className="flex h-full flex-col px-5 py-6">
        <Link
          href="/"
          className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-foreground transition-colors hover:text-accent"
        >
          ← THE FIELD FILE
        </Link>

        <nav className="mt-8 flex flex-col gap-5">
          {CATEGORY_ORDER.map((category) => {
            const categoryPosts = posts.filter((p) => p.category === category)
            if (categoryPosts.length === 0) return null
            const isOpen = category === currentCategory

            return (
              <div key={category}>
                <Link
                  href="/"
                  className={`font-mono text-[0.7rem] uppercase tracking-[0.2em] transition-colors hover:text-accent ${
                    isOpen ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </Link>

                {isOpen && (
                  <ul className="mt-2 flex flex-col gap-1.5 border-l border-border pl-3">
                    {categoryPosts.map((post) => {
                      const isCurrent = post.id === currentPost?.id
                      return (
                        <li key={post.id}>
                          <Link
                            href={post.href ?? "/"}
                            aria-current={isCurrent ? "page" : undefined}
                            className={`block text-sm leading-snug transition-colors ${
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
