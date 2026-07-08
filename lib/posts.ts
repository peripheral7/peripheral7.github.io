export type Category = "RESEARCH" | "PHOTOGRAPHY" | "MOTORCYCLE"

export type Post = {
  id: string
  variant: "photo" | "note" | "map" | "clipping" | "interactive"
  category: Category
  title: string
  meta: string
  ref: string
  body?: string
  image?: string
  imageAlt?: string
  rotate: number
  pin?: "pin" | "tape" | "clip"
  /** Path under /public to a standalone HTML file (interactive maps, reports). */
  href?: string
  /** Label shown on the open-link button, e.g. "Open interactive map". */
  linkLabel?: string
}

export const posts: Post[] = [
  {
    id: "r1",
    variant: "interactive",
    category: "RESEARCH",
    // TODO: 정확한 논문 제목으로 교체해주세요
    title: "공간계량경제학적 접근을 통한 신도시 아파트 가격 결정요인 분석",
    meta: "광교 · 동탄 · 운정 비교연구 · 클러스터 지도 3종 + 종합 결과",
    ref: "02_02_03 / 06",
    rotate: -2,
    pin: "pin",
    href: "/reports/research-index.html",
    linkLabel: "Open research",
  },
]
