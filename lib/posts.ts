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
   * used by the /gallery/[id] template. Required when variant is "photo".
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

    return {
      id: slug,
      rotate: autoRotate(slug),
      pin: PIN_CYCLE[i % PIN_CYCLE.length],
      ...meta, // explicit values in the JSON win over the auto-filled defaults

      // id and href are re-asserted AFTER the meta spread on purpose:
      //
      // - id must always be the filename slug. A stray "id" field left
      //   in a JSON payload (old data model leftovers) would otherwise
      //   silently win the spread and override it — this is exactly how
      //   the cbr650f/aqui pages ended up swapped before.
      //
      // - href is derived from variant, not hand-written per post. Every
      //   "photo" post routes through the same /gallery/[id] template;
      //   "interactive"/"map" posts keep an explicit href pointing at a
      //   standalone HTML file (reports, Folium maps, etc).
      id: slug,
      href: meta.variant === "photo" ? `/gallery/${slug}` : meta.href,
    }
  })
}

export const posts: Post[] = loadPosts()