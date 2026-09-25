import type { Category } from "@/lib/posts"

// 사이트 목차(왼쪽 플로팅 카드 SiteSidebar · 좁은 창의 상단바 SiteTopbar)가 함께 쓰는 값.
// lib/posts는 파일 시스템을 읽는 서버 전용 모듈이라 여기서는 타입만 가져온다(클라이언트 번들에 들어가지 않음).

export const CATEGORY_LABELS: Record<Category, string> = {
  STUDY: "Study",
  RESEARCH: "Research",
  PHOTOGRAPHY: "Photography",
}

export const CATEGORY_ORDER: Category[] = ["STUDY", "RESEARCH", "PHOTOGRAPHY"]

// 끝의 "/"를 뗀 경로(루트는 "/" 그대로) — 현재 주소와 글의 href를 견줄 때 쓴다.
export function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1)
  return path || "/"
}
