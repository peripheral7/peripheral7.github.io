import Image from "next/image"
import Link from "next/link"

export type PinStyle = "pin" | "tape" | "clip" | "none"
export type Orientation = "horizontal" | "vertical"
export type CaptionPlacement = "below" | "above" | "left" | "right" | "overlay-bottom" | "overlay-top" | "none"
export type CaptionSize = "sm" | "md" | "lg"

export type BoardPhoto = {
  kind?: "photo"
  id: string
  src: string
  alt: string
  aspectRatio?: string
  caption?: string
  captionPlacement?: CaptionPlacement
  captionSize?: CaptionSize
  captionOrientation?: Orientation
  colStart?: number
  colSpan?: number
  rowStart?: number
  rotate?: number
  pin?: PinStyle
  z?: number
}

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

// 흩뿌려진 배치를 위해 CSS Grid의 절대 좌표계를 직접 주입합니다.
function gridVars(cell: { colStart?: number; colSpan?: number; rowStart?: number; z?: number }) {
  return {
    gridColumn: `${cell.colStart ?? "auto"} / span ${cell.colSpan ?? 3}`,
    gridRowStart: cell.rowStart ?? "auto",
    zIndex: cell.z ?? 1,
  }
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

// 캡션 렌더링 컴포넌트 복구
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
  const pin = item.pin ?? "none"
  const isOverlay = placement === "overlay-bottom" || placement === "overlay-top"
  const isSide = placement === "left" || placement === "right"
  const { width, height } = parseAspectRatio(item.aspectRatio ?? "4 / 5")

  const flexDirClass =
    placement === "above" ? "flex-col-reverse" : placement === "left" ? "flex-row-reverse" : "flex-col"

  return (
    <div className="board-item group relative" style={gridVars(item)}>
      <div className={`flex ${flexDirClass} ${isSide ? "items-start gap-3" : "gap-2"}`}>
        <div className="relative w-full overflow-hidden bg-muted ring-1 ring-black/5">
          {pin === "tape" && <Tape />}
          {pin === "pin" && <Pin />}
          {pin === "clip" && <Clip />}

          <Image
            src={item.src}
            alt={item.alt}
            width={width}
            height={height}
            quality={50} /* 화질 50% 축소로 로딩 속도 최적화 */
            sizes="(max-width: 768px) 50vw, 33vw"
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

// (LabelCell, PaletteCell은 불필요한 장식이므로 렌더링 코드만 최소화 보존)
function LabelCell({ item }: { item: BoardLabel }) {
  return null;
}
function PaletteCell({ item }: { item: BoardPalette }) {
  return null;
}

function BoardSectionBlock({ section }: { section: BoardSection }) {
  const columns = section.columns ?? 12
  const gap = section.gap ?? 8

  return (
    <section id={section.id} className="mb-12">
      {/* 반응형 콜라주 핵심 로직: 
        화면 너비에 비례(vw)하는 미세한 가로줄(gridAutoRows)을 무수히 깔아두고, 
        rowStart를 통해 자유로운 Y축 겹침과 계단식 배치를 연출합니다.
      */}
      <div
        className="relative grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: "1.2vw", 
          columnGap: `${gap}px`,
          rowGap: "0",
          paddingBottom: "15vw" 
        }}
      >
        {section.items.map((item) => {
          if (item.kind === "label") return <LabelCell key={item.id} item={item as BoardLabel} />
          if (item.kind === "palette") return <PaletteCell key={item.id} item={item as BoardPalette} />
          return <PhotoCell key={item.id} item={item as BoardPhoto} />
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
    <div className="relative min-h-screen bg-background text-foreground">
      <Link
        href={backHref}
        className="fixed left-4 top-4 z-50 flex h-10 items-center justify-center rounded-full border border-border bg-background/80 px-4 font-mono text-sm font-semibold shadow-sm backdrop-blur-md transition-colors hover:border-accent hover:text-accent md:left-8 md:top-8"
      >
        ← BACK
      </Link>
      <main className="mx-auto max-w-screen-xl px-2 pt-24 md:px-8 lg:px-12">
        {sections.map((section) => (
          <BoardSectionBlock key={section.id} section={section} />
        ))}
      </main>
    </div>
  )
}