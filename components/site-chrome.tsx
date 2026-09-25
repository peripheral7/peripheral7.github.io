"use client"

import { usePathname } from "next/navigation"
import { SiteSidebar } from "@/components/site-sidebar"
import { SiteTopbar } from "@/components/site-topbar"
import type { Post } from "@/lib/posts"

// The appraiser skill-tree is a full-viewport canvas that measures
// window.innerWidth and positions its overlay UI with `fixed` (viewport-
// relative, not container-relative). Reserving sidebar width there would
// misalign its canvas without a deeper refactor of that page, so it opts
// out of the global sidebar/back-link chrome and renders full-bleed as before.
function usesOwnChrome(pathname: string) {
  return pathname.startsWith("/appraiser")
}

export function SiteChrome({
  children,
  posts,
}: {
  children: React.ReactNode
  posts: Post[]
}) {
  const pathname = usePathname() ?? "/"

  if (usesOwnChrome(pathname)) {
    return <>{children}</>
  }

  return (
    <>
      {/* 넓은 창(nav 브레이크포인트 이상)은 왼쪽 플로팅 목차, 좁은 창은 상단바 — CSS로만 바뀌어 깜빡임이 없다 */}
      <SiteSidebar posts={posts} />
      <SiteTopbar posts={posts} />
      {children}
    </>
  )
}
