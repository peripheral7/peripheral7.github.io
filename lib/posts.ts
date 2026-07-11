import fs from "fs"
import path from "path"

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
  /**
   * Folder under /public holding the full-res photo set + manifest.json,
   * used by the /gallery/[id] template. Required when variant is "photo"
   * AND the post is not listed in BOARD_ROUTES below.
   */
  imageFolder?: string
}

// Everything except id/rotate/pin must come from the post's JSON file.
// rotate/pin are optional there — auto-filled below if omitted, so most
// posts don't need to specify them at all.
type PostMeta = Omit<Post, "id" | "rotate" | "pin"> & {
  rotate?: number
  pin?: "pin" | "tape" | "clip"
}

const POSTS_DIR = path.join(process.cwd(), "content/posts")
const PIN_CYCLE: Array<"pin" | "tape" | "clip"> = ["pin", "tape", "clip"]

/**
 * Posts that use the standalone /board/<slug> mood-board layout
 * (components/post-board.tsx) instead of the default /gallery/[id]
 * masonry template. Keyed by the post's id — which is always its
 * content/posts/<id>.json filename (without extension).
 *
 * To move a post from the default gallery to a custom board page:
 *   1. Build app/board/<name>/page.tsx + content/boards/<name>.ts
 *   2. Add an entry here: "<post-id>": "/board/<name>"
 * That's the only change needed — no other file has to know about it.
 */
const BOARD_ROUTES: Record<string, string> = {
  "03_aqui": "/board/aqui",
  "02-cbr650f-2016": "/board/cbr650f",
}

// Deterministic pseudo-random "crooked pin" tilt derived from the filename,
// so the scrapbook look doesn't require hand-picking a rotate value per post.
function autoRotate(slug: string): number {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) % 1000
  }
  return (hash % 7) - 3 // -3..3 degrees
}

function loadPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return []

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort() // filename controls board order, e.g. 01-*.json, 02-*.json, ...

  return files.map((file, i) => {
    const slug = file.replace(/\.json$/, "")
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8")
    const meta = JSON.parse(raw) as PostMeta

    // Resolution order for href:
    //   1. BOARD_ROUTES  — explicit override, wins over everything
    //   2. variant "photo" → /gallery/[id] (default masonry template)
    //   3. otherwise       → whatever href the JSON itself specifies
    //      (used by "interactive"/"map" posts pointing at static reports)
    const resolvedHref =
      BOARD_ROUTES[slug] ?? (meta.variant === "photo" ? `/gallery/${slug}` : meta.href)

    const post: Post = {
      rotate: autoRotate(slug),
      pin: PIN_CYCLE[i % PIN_CYCLE.length],
      ...meta, // explicit values in the JSON win over the auto-filled defaults

      // id and href are re-asserted AFTER the meta spread, and each key
      // appears only once here — an object literal can't repeat a key.
      // This still means: id/href below always win over anything the
      // spread may have set, which is what prevents id/href drift
      // (this is exactly how the cbr650f/aqui pages ended up swapped,
      // and later pointed at the wrong route, before).
      id: slug,
      href: resolvedHref,
    }

    return post
  })
}

export const posts: Post[] = loadPosts()