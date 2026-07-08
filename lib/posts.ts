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
    title: "Gwanggyo — 200m cluster map",
    meta: "OSM integrated · gravity index clusters",
    ref: "02_02_03 / Gwanggyo",
    rotate: -2,
    pin: "pin",
    href: "/reports/gwanggyo-cluster-map.html",
    linkLabel: "Open interactive map",
  },
  {
    id: "r2",
    variant: "interactive",
    category: "RESEARCH",
    title: "Dongtan — 200m cluster map",
    meta: "OSM integrated · polycentric structure",
    ref: "02_02_03 / Dongtan",
    rotate: 2,
    pin: "tape",
    href: "/reports/dongtan-cluster-map.html",
    linkLabel: "Open interactive map",
  },
  {
    id: "r3",
    variant: "interactive",
    category: "RESEARCH",
    title: "Unjeong — 200m cluster map",
    meta: "OSM integrated · fragmented village-type",
    ref: "02_02_03 / Unjeong",
    rotate: -1,
    pin: "clip",
    href: "/reports/unjeong-cluster-map.html",
    linkLabel: "Open interactive map",
  },
  {
    id: "r4",
    variant: "interactive",
    category: "RESEARCH",
    title: "Cross-city structural heterogeneity",
    meta: "Dashboard report · SAR / SEM / SDM",
    ref: "06 / Interactive report",
    rotate: 3,
    pin: "pin",
    href: "/reports/interactive-report.html",
    linkLabel: "Open full report",
  },
]
