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

/** A pinned photo cell. Height is derived from aspectRatio — never cropped. */
export type BoardPhoto = {
  kind?: "photo"
  id: string
  src: string
  alt: string
  /** e.g. "4 / 5", "3 / 4", "1 / 1", "16 / 9". Default: "4 / 5". */
  aspectRatio?: string
  caption?: string
  captionPlacement?: CaptionPlacement
  captionSize?: CaptionSize
  captionOrientation?: Orientation
  /** Starting column line (1-based). Omit to auto-place. */
  colStart?: number
  /** Width in grid columns. Default: 3 (→ 4 per row on a 12-col board). */
  colSpan?: number
  /** Starting row line (1-based) — for manual staggering. Omit to auto-place. */
  rowStart?: number
  rotate?: number
  pin?: PinStyle
  z?: number
}

/** A standalone text/word chip (title cards, single-word tags). */
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
  rotate?: number
  z?: number
}

/** A row of color swatches, like a palette reference chip. */
export type BoardPalette = {
  kind: "palette"
  id: string
  colors: string[]
  label?: string
  colStart?: number
  colSpan?: number
  rowStart?: number
  z?: number
}

export type BoardCell = BoardPhoto | BoardLabel | BoardPalette

export type BoardSection = {
  id: string
  title: string
  note?: string
  /** Grid column count, desktop only. Default: 12. */
  columns?: number
  gap?: number
  items: BoardCell[]
}

function parseAspectRatio(ratio: string): { width: number; height: number } {
  const [w, h] = ratio.split("/").map((n) => parseFloat(n.trim()))
  const width = 1000
  const height = Math.round((width * (h || 5)) / (w || 4))
  return { width, height }
}

function gridVars(cell: { colStart?: number; colSpan?: number; rowStart?: number; z?: number }) {
  const style: Record<string, string | number> = { zIndex: cell.z ?? 1 }
  if (cell.colStart !== undefined) style["--col-start"] = cell.colStart
  if (cell.colSpan !== undefined) style["--col-span"] = cell.colSpan
  if (cell.rowStart !== undefined) style["--row-start"] = cell.rowStart
  return style
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
  const orientationStyle: Record<string, string> =
    orientation === "vertical" ? { writingMode: "vertical-rl" } : {}
  return (
    <p className={`${sizeClass} font-mono leading-snug ${className}`} style={orientationStyle}>
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
  const { width, height } = parseAspectRatio(item.aspectRatio ?? "4 / 5")

  const flexDirClass =
    placement === "above" ? "flex-col-reverse" : placement === "left" ? "flex-row-reverse" : "flex-col"

  return (
    <div className="board-item group relative" style={gridVars(item)}>
      <div
        className={`scrap flex ${flexDirClass} ${isSide ? "items-start gap-3" : "gap-2"}`}
        style={{ ["--r" as string]: `${rotate}deg` }}
      >
        <div className="relative w-full overflow-hidden bg-muted shadow-scrap ring-1 ring-black/5">
          {pin === "tape" && <Tape />}
          {pin === "pin" && <Pin />}
          {pin === "clip" && <Clip />}

          {/* No `fill` + object-cover here on purpose: width/height give Next.js
              the aspect ratio to reserve space, but `height: auto` in style
              means the browser always renders the image's TRUE native ratio
              once loaded — never stretched, never cropped. */}
          <Image
            src={item.src}
            alt={item.alt}
            width={width}
            height={height}
            sizes="(max-width: 768px) 45vw, 25vw"
            style={{ width: "100%", height: "auto", display: "block" }}
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
        className={`scrap flex min-h-20 items-center justify-center p-3 text-center font-sans font-extrabold uppercase tracking-tight shadow-scrap ring-1 ring-black/5 ${
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

function PaletteCell({ item }: { item: BoardPalette }) {
  return (
    <div className="board-item relative" style={gridVars(item)}>
      <div className="flex gap-2">
        {item.colors.map((c, i) => (
          <span
            key={i}
            className="aspect-square flex-1 rounded-[2px] shadow-scrap ring-1 ring-black/10"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      {item.label && (
        <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
          {item.label}
        </p>
      )}
    </div>
  )
}

function BoardSectionBlock({ section }: { section: BoardSection }) {
  const columns = section.columns ?? 12
  const gap = section.gap ?? 20

  return (
    <section id={section.id} className="mb-20">
      <header className="mb-6 border-b border-border pb-4">
        <h2 className="font-sans text-2xl font-extrabold uppercase tracking-tight text-foreground md:text-3xl">
          {section.title}
        </h2>
        {section.note && (
          <p className="mt-2 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">{section.note}</p>
        )}
      </header>

      {/* no background color here — the board sits directly on the page background */}
      <div
        className="board-grid relative"
        style={{
          ["--board-cols" as string]: columns,
          ["--board-gap" as string]: `${gap}px`,
        }}
      >
        {section.items.map((item) => {
          if (item.kind === "label") return <LabelCell key={item.id} item={item} />
          if (item.kind === "palette") return <PaletteCell key={item.id} item={item} />
          return <PhotoCell key={item.id} item={item} />
        })}
      </div>
    </section>
  )
}

export function PostBoard({
  title,
  sidebarTitle,
  eyebrow,
  intro,
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
  const pinLegend: { pin: PinStyle; label: string; note: string }[] = [
    { pin: "tape", label: "테이프", note: "정면으로 고정" },
    { pin: "pin", label: "핀", note: "살짝 들뜬 느낌" },
    { pin: "clip", label: "클립", note: "집게로 고정" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* 사이드바 — gallery-client.tsx와 동일한 톤/구조 */}
      <aside className="sticky top-0 z-10 w-full shrink-0 border-b border-border bg-background p-6 md:h-screen md:w-60 md:overflow-y-auto md:border-b-0 md:border-r md:p-10">
        <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-widest text-accent">Field File</p>
        <h1 className="mb-1 text-lg font-extrabold tracking-tight">{sidebarTitle ?? title}</h1>
        {eyebrow && (
          <p className="mb-6 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
        )}

        <Link
          href={backHref}
          className="mb-8 inline-block border-b border-border pb-3 font-semibold text-foreground transition-colors hover:text-accent"
        >
          ← 메인으로
        </Link>

        {/* 범례 */}
        <div className="border-t border-border pt-6">
          <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-widest text-accent">Sections</p>
          <nav className="mb-6 flex flex-col gap-2">
            {sections.map((s) => (
              
                key={s.id}
                href={`#${s.id}`}
                className="text-sm text-muted-foreground transition-colors hover:text-accent"
              >
                {s.title}
              </a>
            ))}
          </nav>

          <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-widest text-accent">Legend</p>
          <ul className="flex flex-col gap-2">
            {pinLegend.map((p) => (
              <li key={p.pin} className="flex items-baseline gap-2 text-xs text-muted-foreground">
                <span className="font-mono font-bold text-foreground">{p.label}</span>
                <span>— {p.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* 메인 보드 영역 */}
      <main className="flex-1 px-5 py-10 md:px-12 md:py-12 lg:px-20">
        {intro && <p className="mb-12 max-w-2xl leading-relaxed text-muted-foreground">{intro}</p>}
        {sections.map((section) => (
          <BoardSectionBlock key={section.id} section={section} />
        ))}
      </main>
    </div>
  )
}