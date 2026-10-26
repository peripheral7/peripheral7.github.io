"use client"

import { usePathname } from "next/navigation"
import { SiteSidebar } from "@/components/site-sidebar"
import { SiteTopbar } from "@/components/site-topbar"
import type { Post } from "@/lib/posts"

export function SiteChrome({
  children,
  posts,
}: {
  children: React.ReactNode
  posts: Post[]
}) {
  const pathname = usePathname() ?? "/"

  // 검은 배경 전용 페이지: 흰 상단바가 화면을 가르지 않도록 상단바는 숨긴다(왼쪽 가장자리 호버 목차는 그대로).
  const hideTopbar = pathname.startsWith("/board/golden-smoking-hour")

  return (
    <>
      {/* 넓은 창(nav 브레이크포인트 이상)은 왼쪽 플로팅 목차, 좁은 창은 상단바 — CSS로만 바뀌어 깜빡임이 없다 */}
      <SiteSidebar posts={posts} />
      {!hideTopbar && <SiteTopbar posts={posts} />}
      {children}
    </>
  )
}
