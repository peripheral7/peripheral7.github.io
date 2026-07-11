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
export type Orientation = "horizontal" | "vertical"

/** A pinned photo cell. */
export type BoardPhoto = {
  kind?: "photo" // omit for photos — only labels need to declare kind
  id: string
  src: string
  alt: string
  caption?: string
  captionPlacement?: CaptionPlacement
  captionSize?: CaptionSize
  captionOrientation?: Orientation
  /** Starting column line (1-based). Omit to auto-place in reading order. */
  colStart?: number
  /** Width in grid columns. Default: 3 (→ 4 per row on a 12-col board). */
  colSpan?: number
  /** Starting row line (1-based). Omit to auto-place. */
  rowStart?: number
  /** Height in grid rows. Default: 6. */
  rowSpan?: number
  rotate?: number
  pin?: PinStyle
  z?: number
}

/** A standalone text/word chip (title cards, single-word tags, vertical labels). */
export type BoardLabel = {
  kind: "label"
  id: string
  text: string
  size?: CaptionSize | "xl"
  tone?: "dark" | "light"
  orientation?: Orientation
  colStart?: number
  colSpan?: number
  rowStart?: number
  rowSpan?: number
  rotate?: number
  z?: number
}

export type BoardCell = BoardPhoto | BoardLabel

export type BoardSection = {
  id: string
  title: string
  note?: string
  /** Grid column count, desktop only. Default: 12. */
  columns?: number
  /** Pixel height of ONE grid row, desktop only. Default: 32. */
  rowHeight?: number
  gap?: number
  items: BoardCell[]
}

function gridVars(cell: {
  colStart?: number
  colSpan?: number
  rowStart?: number
  rowSpan?: number
  z?: number
}) {
  const style: Record<string, string | number> = { zIndex: cell.z ?? 1 }
  if (cell.colStart !== undefined) style["--col-start"] = cell.colStart
  if (cell.colSpan !== undefined) style["--col-span"] = cell.colSpan
  if (cell.rowStart !== undefined) style["--row-start"] = cell.rowStart
  if (cell.rowSpan !== undefined) style["--row-span"] = cell.rowSpan
  return style as React.CSSProperties
}

function Tape() {
  return (
    <span
      aria-hidden
      className="tape pointer-events-none absolute -top-4 left-1/2 z-20 h-7 w-28 -translate-x-1/2 -rotate-2"
    />
  )
}
function Pin() {
  return (
    <span aria-hidden className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2">
      <span className="block h-3.5 w-3.5 rounded-full bg-accent shadow-[0_2px_5px_rgba(0,0,0,0.45)] ring-2 ring-white/80" />
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

function CaptionText({
  text,
  size = "sm",
  orientation = "horizontal",
  className = "",
}: {
  text: string
  size?: CaptionSize
  orientation?: Orientation
  className?: string
}) {
  const sizeClass = size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-[0.7rem]"
  const orientationStyle: React.CSSProperties =
    orientation === "vertical" ? { writingMode: "vertical-rl" } : {}
  return (
    <p
      className={`${sizeClass} font-mono leading-snug ${className}`}
      style={orientationStyle}
    >
      {text}
    </p>
  )
}

function PhotoCell({ item }: { item: BoardPhoto }) {
  const placement = item.captionPlacement ?? "below"
  const size = item.captionSize ?? "sm"
  const orientation = item.captionOrientation ?? "horizontal"
  const rotate = item.rotate ?? 0
  const pin = item.pin ?? "tape"
  const isOverlay = placement === "overlay-bottom" || placement === "overlay-top"
  const isSide = placement === "left" || placement === "right"

  const flexDirClass =
    placement === "above" ? "flex-col-reverse" : placement === "left" ? "flex-row-reverse" : "flex-col"

  return (
    <div className="board-item group relative" style={gridVars(item)}>
      <div
        className={`scrap flex h-full ${flexDirClass} ${isSide ? "items-start gap-3" : "gap-2"}`}
        style={{ ["--r" as string]: `${rotate}deg` }}
      >
        <div className="relative h-full min-h-0 flex-1 overflow-hidden bg-muted shadow-scrap ring-1 ring-black/5">
          {pin === "tape" && <Tape />}
          {pin === "pin" && <Pin />}
          {pin === "clip" && <Clip />}

          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="(max-width: 768px) 45vw, 25vw"
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
              <CaptionText text={item.caption} size={size} orientation={orientation} className="text-white" />
            </div>
          )}
        </div>

        {!isOverlay && item.caption && placement !== "none" && (
          <CaptionText
            text={item.caption}
            size={size}
            orientation={orientation}
            className={`text-card-foreground/80 ${isSide ? "w-8 shrink-0 text-center" : ""}`}
          />
        )}
      </div>
    </div>
  )
}

function LabelCell({ item }: { item: BoardLabel }) {
  const tone = item.tone ?? "dark"
  const orientation = item.orientation ?? "horizontal"
  const rotate = item.rotate ?? 0
  const sizeClass =
    item.size === "xl"
      ? "text-2xl md:text-4xl"
      : item.size === "lg"
        ? "text-lg md:text-2xl"
        : item.size === "md"
          ? "text-sm md:text-base"
          : "text-xs md:text-sm"

  return (
    <div className="board-item relative" style={gridVars(item)}>
      <div
        className={`scrap flex h-full items-center justify-center p-2 text-center font-sans font-extrabold uppercase tracking-tight shadow-scrap ring-1 ring-black/5 ${
          tone === "dark" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900"
        } ${sizeClass}`}
        style={{
          ["--r" as string]: `${rotate}deg`,
          writingMode: orientation === "vertical" ? "vertical-rl" : undefined,
        }}
      >
        {item.text}
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
          <p className="mt-2 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">{section.note}</p>
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
        {section.items.map((item) =>
          item.kind === "label" ? <LabelCell key={item.id} item={item} /> : <PhotoCell key={item.id} item={item} />,
        )}
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
        <Link href={backHref} className="mb-8 inline-block text-sm font-bold transition-colors hover:text-accent">
          ← BACK TO BOARD
        </Link>
        {eyebrow && (
          <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-widest text-accent">{eyebrow}</p>
        )}
        <h1 className="text-balance text-3xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{intro}</p>}
      </div>

      {sections.map((section) => (
        <BoardSectionBlock key={section.id} section={section} />
      ))}
    </div>
  )
}