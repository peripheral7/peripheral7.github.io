"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Category, Post } from "@/lib/posts"
import { CATEGORY_LABELS, CATEGORY_ORDER, normalizePath as normalize } from "@/lib/site-nav"

// 평소엔 숨겨 두고, 화면 왼쪽 끝에 마우스를 올리면(또는 키보드 포커스) 목차가 배경 없이 위아래 가는 선과 함께 나타난다.
// 현재 글의 카테고리 목록만 보여 주고, 카테고리를 알 수 없는 페이지는 전체 목록을 보여 준다. 폭 768px 이상에서만 쓴다(그보다 좁으면 상단바).
// 글자색: Photography 는 검은 배경을 가정해 흰 글자 + mix-blend-difference(밝은 배경 글에서도 읽힘),
// 그 밖의 카테고리는 밝은 배경 페이지라 본문색(text-foreground)을 쓴다.
export function SiteSidebar({ posts }: { posts: Post[] }) {
  const pathname = usePathname()
  const current = normalize(pathname ?? "/")
  const currentPost = posts.find((p) => p.href && normalize(p.href) === current)
  const currentCategory = currentPost?.category

  if (current === "/") return null

  const dark = currentCategory === "PHOTOGRAPHY"
  const categories: Category[] = currentCategory ? [currentCategory] : CATEGORY_ORDER

  const text = dark ? "text-white" : "text-foreground"
  const dim = dark ? "text-white/60" : "text-foreground/60"
  const hover = dark ? "hover:text-white" : "hover:text-foreground"
  const line = dark ? "border-white/30" : "border-foreground/25"

  return (
    <aside className="group fixed inset-y-0 left-0 z-40 hidden w-5 hover:w-72 focus-within:w-72 md:block">
      <nav
        aria-label="목차"
        className={`absolute left-4 top-1/2 w-60 -translate-x-3 -translate-y-1/2 border-y ${line} ${text} py-5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 ${
          dark ? "mix-blend-difference" : ""
        }`}
      >
        <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto">
          {categories.map((category) => {
            const categoryPosts = posts.filter((p) => p.category === category)
            if (categoryPosts.length === 0) return null
            return (
              <div key={category}>
                <p className={`font-mono text-[0.7rem] uppercase tracking-[0.2em] ${dim}`}>{CATEGORY_LABELS[category]}</p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {categoryPosts.map((post) => {
                    const isCurrent = post.id === currentPost?.id
                    return (
                      <li key={post.id}>
                        <Link
                          href={post.href ?? "/"}
                          aria-current={isCurrent ? "page" : undefined}
                          className={`block text-sm leading-snug transition-colors ${isCurrent ? `font-semibold ${text}` : `${dim} ${hover}`}`}
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
    </aside>
  )
}
