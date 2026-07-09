import Image from "next/image"
import Link from "next/link"

export type PinStyle = "pin" | "tape" | "clip" | "none"
export type CaptionPlacement =
  | "below"
  | "above"
  | "left"
  | "right"
  | "overlay-bottom"
  | "overlay-top"
  | "none"
export type CaptionSize = "sm" | "md" | "lg"

export type BoardItem = {
  id: string
  src: string
  alt: string
  caption?: string
  /** Where the caption sits relative to the photo. Default: "below". */
  captionPlacement?: CaptionPlacement
  /** Caption text size. Default: "sm". */
  captionSize?: CaptionSize
  /** Starting point, left→right (1-based grid column). */
  colStart: number
  /** Size, horizontally (how many columns wide). */
  colSpan: number
  /** Starting point, top→bottom (1-based grid row). */
  rowStart: number
  /** Size, vertically (how many rows tall). */
  rowSpan: number
  /** Tilt in degrees. Default: 0. */
  rotate?: number
  /** How it's "attached" to the board. Default: "tape". */
  pin?: PinStyle
  /** Stacking order — set higher on items meant to sit on top when overlapping. Default: 1. */
  z?: number
}

export type BoardSection = {
  id: string
  title: string
  note?: string
  /** Grid column count for this section. Default: 12. */
  columns?: number
  /** Pixel height of ONE grid row. Combine with rowSpan for exact photo height. Default: 32. */
  rowHeight?: number
  /** Gap between items, px. Default: 20. */
  gap?: number
  items: BoardItem[]
}

function Tape() {
  return (
    <span
      aria-hidden
      className="tape pointer-events-none absolute -top-3 left-1/2 z-20 h-6 w-20 -translate-x-1/2 -rotate-2"
    />
  )
}

function Pin() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2"
    >
      <span className="block h-3.5 w-3.5 rounded-full bg-accent shadow-[0_2px_5px_rgba(0,0,0,0.45)] ring-2 ring-white/80" />
    </span>
  )
}

function Clip() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2"
    >
      <span className="block h-6 w-4 rounded-[2px] border-2 border-neutral-500 bg-neutral-300/90 shadow-sm" />
    </span>
  )
}

function BoardItemCard({ item }: { item: BoardItem }) {
  const placement = item.captionPlacement ?? "below"
  const size = item.captionSize ?? "sm"
  const rotate = item.rotate ?? 0
  const pin = item.pin ?? "tape"
  const isOverlay = placement === "overlay-bottom" || placement === "overlay-top"
  const isSide = placement === "left" || placement === "right"

  const flexDirClass =
    placement === "above"
      ? "flex-col-reverse"
      : placement === "left"
        ? "flex-row-reverse"
        : placement === "right"
          ? "flex-row"
          : "flex-col"

  const captionSizeClass =
    size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-[0.7rem]"

  return (
    <div
      className="board-item group relative"
      style={{
        ["--col-start" as string]: item.colStart,
        ["--col-span" as string]: item.colSpan,
        ["--row-start" as string]: item.rowStart,
        ["--row-span" as string]: item.rowSpan,
        zIndex: item.z ?? 1,
      }}
    >
      <div
        className={`scrap flex h-full ${flexDirClass} ${isSide ? "items-start gap-3" : "gap-2"}`}
        style={{ ["--r" as string]: `${rotate}deg` }}
      >
        <div className="relative aspect-[4/5] min-h-0 flex-1 overflow-hidden bg-muted shadow-scrap ring-1 ring-black/5">
          {pin === "tape" && <Tape />}
          {pin === "pin" && <Pin />}
          {pin === "clip" && <Clip />}

          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="(max-width: 768px) 90vw, 40vw"
            className="object-cover"
          />

          {isOverlay && item.caption && (
            <div
              className={`pointer-events-none absolute inset-x-0 z-10 p-3 text-white ${
                placement === "overlay-bottom"
                  ? "bottom-0 bg-gradient-to-t from-black/75 to-transparent"
                  : "top-0 bg-gradient-to-b from-black/75 to-transparent"
              }`}
            >
              <p className={`${captionSizeClass} font-mono leading-snug`}>{item.caption}</p>
            </div>
          )}
        </div>

        {!isOverlay && item.caption && placement !== "none" && (
          <p
            className={`${captionSizeClass} ${isSide ? "w-32 shrink-0" : ""} font-mono leading-snug text-card-foreground/80`}
          >
            {item.caption}
          </p>
        )}
      </div>
    </div>
  )
}

function BoardSectionBlock({ section }: { section: BoardSection }) {
  const columns = section.columns ?? 12
  const rowHeight = section.rowHeight ?? 32
  const gap = section.gap ?? 20

  return (
    <section className="mx-auto mb-20 max-w-6xl px-4 md:px-8">
      <header className="mb-6 border-b border-border pb-4">
        <h2 className="font-sans text-2xl font-extrabold uppercase tracking-tight text-foreground md:text-3xl">
          {section.title}
        </h2>
        {section.note && (
          <p className="mt-2 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">
            {section.note}
          </p>
        )}
      </header>

      <div
        className="board-grid cork relative rounded-sm p-4 md:p-8"
        style={{
          ["--board-cols" as string]: columns,
          ["--board-row-h" as string]: `${rowHeight}px`,
          ["--board-gap" as string]: `${gap}px`,
        }}
      >
        {section.items.map((item) => (
          <BoardItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

export function PostBoard({
  title,
  eyebrow,
  intro,
  backHref = "/",
  sections,
}: {
  title: string
  eyebrow?: string
  intro?: string
  backHref?: string
  sections: BoardSection[]
}) {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:px-8 md:pt-16">
        <Link
          href={backHref}
          className="mb-8 inline-block text-sm font-bold transition-colors hover:text-accent"
        >
          ← BACK TO BOARD
        </Link>

        {eyebrow && (
          <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-widest text-accent">
            {eyebrow}
          </p>
        )}
        <h1 className="text-balance text-3xl font-extrabold tracking-tight md:text-5xl">
          {title}
        </h1>
        {intro && (
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{intro}</p>
        )}
      </div>

      {sections.map((section) => (
        <BoardSectionBlock key={section.id} section={section} />
      ))}
    </div>
  )
}