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
  /** Display date shown on the card, e.g. "2026.07.08" */
  date?: string
  /** Short tag labels shown next to the date, e.g. ["GIS", "Hedonic"] */
  tags?: string[]
}

export const posts: Post[] = [
  {
    id: "m1",
    variant: "photo",
    category: "MOTORCYCLE",
    title: "CBR650F (2016)",
    meta: "Garage log",
    ref: "MOTO-2016",
    // TODO: 실제 파일을 public/images/202604-05.JPEG 경로에 넣어주세요.
    // (윈도우는 대소문자를 구분 안 하지만, GitHub Pages는 대소문자를 구분합니다 —
    //  실제 파일명의 대소문자까지 이 경로와 정확히 일치해야 합니다.)
    image: "/images/202604-05.JPEG",
    imageAlt: "Honda CBR650F 2016",
    rotate: 2,
    pin: "tape",
    date: "2026.04.05",
  },
  {
    id: "r1",
    variant: "interactive",
    category: "RESEARCH",
    // TODO: 정확한 논문 제목으로 교체해주세요
    title: "도시경제학적 접근을 통한 신도시 아파트 가격 결정요인 분석",
    meta: "광교 · 동탄 · 운정 비교연구 · 클러스터 지도 3종 + 종합 결과",
    ref: "02_02_03 / 06",
    // TODO: 실제 PNG 파일을 이 경로(public/images/)에 넣어주세요.
    // 파일명이 다르면 이 경로를 실제 파일명으로 맞춰주세요.
    image: "/images/02_02_03_map_integrated_Dongtan_200_cluster.png",
    imageAlt: "동탄 200m 공원 및 상권 클러스터 지도",
    rotate: -2,
    pin: "pin",
    href: "/reports/research-index.html",
    linkLabel: "Open research",
    date: "2026.07.08",
    tags: ["Urban Economics", "GIS", "Hedonic Regression"],
  },
]
