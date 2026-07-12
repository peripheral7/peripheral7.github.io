import Image from "next/image"
import Link from "next/link"

export type PinStyle = "pin" | "tape" | "clip" | "none"
export type CaptionPlacement = "below" | "above" | "left" | "right" | "overlay-bottom" | "overlay-top" | "none"
export type CaptionSize = "sm" | "md" | "lg"

export type BoardPhoto = {
  kind?: "photo"
  id: string
  src: string
  alt: string
  /** Designed frame shape, e.g. "4 / 5" (portrait), "3 / 2" (landscape).
   *  This is the SHAPE the design calls for — the photo is cropped
   *  (object-fit: cover) to fill it, matching how the original mood
   *  board actually works (most frames are deliberate crops of
   *  landscape source photos, not their native ratio). */
  aspectRatio?: string
  caption?: string
  captionPlacement?: CaptionPlacement
  captionSize?: CaptionSize
  colStart?: number
  colSpan?: number
  rowStart?: number
  pin?: PinStyle
  z?: number
}

export type BoardLabel = { kind: "label"; id: string; text: string }
export type BoardPalette = { kind: "palette"; id: string; colors: string[] }
export type BoardCell = BoardPhoto | BoardLabel | BoardPalette

export type BoardSection = {
  id: string
  title?: string
  note?: string
  columns?: number
  rows?: number
  items: BoardCell[]
}

function frameHeightPercent(ratio: string): number {
  const [w, h] = ratio.split("/").map((n) => parseFloat(n.trim()))
  return ((h || 5) / (w || 4)) * 100
}

function Tape() {
  return <span aria-hidden className="tape pointer-events-none absolute -top-3 left-1/2 z-20 h-6 w-24 -translate-x-1/2" />
}
function Pin() {
  return (
    <span aria-hidden className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2">
      <span className="block h-3.5 w-3.5 rounded-full bg-accent shadow-sm ring-2 ring-white/80" />
    </span>
  )
}
function Clip() {
  return (
    <span aria-hidden className="pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2">
      <span className="block h-6 w-4 rounded-[2px] border-2 border-neutral-500 bg-neutral-300/90 shadow-sm" />
    </span>
  )
}

// Korean text must never fall back to font-mono (JetBrains Mono has no
// Hangul glyphs) or Archivo (Latin-only) — both would render Korean in
// whatever ugly fallback the OS picks. Captions always use the Noto Sans
// KR variable set up in layout.tsx/globals.css.
function CaptionText({ text, size = "sm", className = "" }: { text: string; size?: CaptionSize; className?: string }) {
  const sizeClass = size === "lg" ? "text-sm md:text-base" : size === "md" ? "text-xs md:text-sm" : "text-[0.7rem] md:text-xs"
  return (
    <p className={`${sizeClass} font-[family-name:var(--font-kr)] tracking-wide ${className}`}>
      {text}
    </p>
  )
}

function PhotoCell({ item }: { item: BoardPhoto }) {
  const pin = item.pin ?? "none"
  const placement: CaptionPlacement = item.captionPlacement ?? (item.caption ? "below" : "none")
  const size = item.captionSize ?? "sm"
  const isOverlay = placement === "overlay-bottom" || placement === "overlay-top"
  const isSide = placement === "left" || placement === "right"
  const paddingBottom = frameHeightPercent(item.aspectRatio ?? "4 / 5")

  const flexDirClass =
    placement === "above" ? "flex-col-reverse" : placement === "left" ? "flex-row-reverse items-center" : placement === "right" ? "flex-row items-center" : "flex-col"

  const frame = (
    <div className="relative w-full overflow-hidden bg-muted ring-1 ring-black/5 shadow-md" style={{ paddingBottom: `${paddingBottom}%` }}>
      {pin === "tape" && <Tape />}
      {pin === "pin" && <Pin />}
      {pin === "clip" && <Clip />}

      {/* fill + object-cover: crops to the designed frame shape above,
          matching the reference mood board (which crops most photos). */}
      <Image src={item.src} alt={item.alt} fill quality={55} sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />

      {isOverlay && item.caption && (
        <div
          className={`pointer-events-none absolute inset-x-0 z-10 p-2 text-white ${
            placement === "overlay-bottom" ? "bottom-0 bg-gradient-to-t from-black/70 to-transparent" : "top-0 bg-gradient-to-b from-black/70 to-transparent"
          }`}
        >
          <CaptionText text={item.caption} size={size} className="text-white" />
        </div>
      )}
    </div>
  )

  if (placement === "none" || isOverlay || !item.caption) return frame

  return (
    <div className={`flex ${flexDirClass} ${isSide ? "gap-3" : "gap-2"}`}>
      {frame}
      <CaptionText text={item.caption} size={size} className={`shrink-0 whitespace-nowrap text-foreground/80 ${isSide ? "" : ""}`} />
    </div>
  )
}

function BoardSectionBlock({ section }: { section: BoardSection }) {
  const columns = section.columns ?? 24
  const rows = section.rows ?? 160
  const paddingBottomPercent = (rows / columns) * 100

  return (
    <section id={section.id} className="mb-12">
      {section.title && (
        <header className="mb-10 border-b border-border pb-4">
          <h2 className="font-sans text-2xl font-extrabold uppercase tracking-tight text-foreground md:text-3xl">{section.title}</h2>
          {section.note && <p className="mt-2 max-w-2xl font-[family-name:var(--font-kr)] text-sm leading-relaxed text-muted-foreground">{section.note}</p>}
        </header>
      )}

      <div className="relative w-full" style={{ paddingBottom: `${paddingBottomPercent}%` }}>
        {section.items.map((item) => {
          if (item.kind === "label" || item.kind === "palette") return null
          const photoItem = item as BoardPhoto

          const wPercent = ((photoItem.colSpan ?? 6) / columns) * 100
          const lPercent = (((photoItem.colStart ?? 1) - 1) / columns) * 100
          const tPercent = (((photoItem.rowStart ?? 1) - 1) / rows) * 100

          return (
            <div key={photoItem.id} className="absolute" style={{ left: `${lPercent}%`, top: `${tPercent}%`, width: `${wPercent}%`, zIndex: photoItem.z ?? 1 }}>
              <PhotoCell item={photoItem} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function PostBoard({
  backHref = "/",
  sections,
}: {
  title: string
  sidebarTitle?: string
  eyebrow?: string
  intro?: string
  backHref?: string
  sections: BoardSection[]
}) {
  return (
    <div className="relative min-h-screen bg-black text-foreground overflow-x-hidden">
      <Link
        href={backHref}
        className="fixed left-4 top-4 z-50 flex h-10 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/90 px-4 font-mono text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:border-accent hover:text-accent md:left-8 md:top-8"
      >
        ← BACK
      </Link>
      <main className="mx-auto w-full max-w-5xl min-h-screen bg-background px-4 pt-24 pb-32 md:px-12 lg:px-16 shadow-2xl transition-all duration-300">
        {sections.map((section) => (
          <BoardSectionBlock key={section.id} section={section} />
        ))}
      </main>
    </div>
  )
}