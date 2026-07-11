import Image from "next/image"
import Link from "next/link"

export type PinStyle = "pin" | "tape" | "clip" | "none"
export type Orientation = "horizontal" | "vertical"

export type BoardPhoto = {
  kind?: "photo"
  id: string
  src: string
  alt: string
  aspectRatio?: string
  colStart?: number
  colSpan?: number
  rowStart?: number
  pin?: PinStyle
  z?: number
}

export type BoardLabel = {
  kind: "label"
  id: string
  text: string
}

export type BoardPalette = {
  kind: "palette"
  id: string
  colors: string[]
}

export type BoardCell = BoardPhoto | BoardLabel | BoardPalette

export type BoardSection = {
  id: string
  title?: string
  note?: string
  columns?: number
  rows?: number
  items: BoardCell[]
}

function parseAspectRatio(ratio: string): { width: number; height: number } {
  const [w, h] = ratio.split("/").map((n) => parseFloat(n.trim()))
  const width = 1000
  const height = Math.round((width * (h || 5)) / (w || 4))
  return { width, height }
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

function PhotoCell({ item }: { item: BoardPhoto }) {
  const pin = item.pin ?? "none"
  const { width, height } = parseAspectRatio(item.aspectRatio ?? "4 / 5")

  return (
    <div className="relative w-full overflow-hidden bg-muted ring-1 ring-black/5">
      {pin === "tape" && <Tape />}
      {pin === "pin" && <Pin />}
      {pin === "clip" && <Clip />}

      <Image
        src={item.src}
        alt={item.alt}
        width={width}
        height={height}
        quality={50} /* 50% 화질 최적화 */
        sizes="(max-width: 768px) 80vw, 50vw"
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  )
}

function BoardSectionBlock({ section }: { section: BoardSection }) {
  const columns = section.columns ?? 24
  const rows = section.rows ?? 275
  
  // 1 row = 1.5% of container width
  const rowHeightPercent = 1.5 
  const totalHeightPercent = rows * rowHeightPercent

  return (
    <section id={section.id} className="mb-12">
      {/* 기존 양식 헤더 복구 */}
      <header className="mb-10 border-b border-border pb-4">
        <h2 className="font-sans text-2xl font-extrabold uppercase tracking-tight text-foreground md:text-3xl">
          {section.title}
        </h2>
        {section.note && (
          <p className="mt-2 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">{section.note}</p>
        )}
      </header>

      {/* CSS Grid 대신 완벽한 비율 유지를 위한 Absolute Percentage 컨테이너 */}
      <div
        className="relative w-full"
        style={{ paddingBottom: `${totalHeightPercent}%` }}
      >
        {section.items.map((item) => {
          // PhotoCell 렌더링 (Label과 Palette는 현재 생략)
          if (item.kind === "label" || item.kind === "palette") return null
          
          const photoItem = item as BoardPhoto
          
          // Width & Left (가로 축)
          const w = (photoItem.colSpan ?? 6) / columns * 100
          const l = ((photoItem.colStart ?? 1) - 1) / columns * 100
          
          // Top (세로 축): 부모의 Height(%) 대비 자신의 Top(%) 위치를 계산
          const t_vw = ((photoItem.rowStart ?? 1) - 1) * rowHeightPercent
          const topPercentOfHeight = (t_vw / totalHeightPercent) * 100

          return (
            <div
              key={photoItem.id}
              className="absolute"
              style={{
                left: `${l}%`,
                top: `${topPercentOfHeight}%`,
                width: `${w}%`,
                zIndex: photoItem.z ?? 1
              }}
            >
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
    <div className="relative min-h-screen bg-background text-foreground">
      <Link
        href={backHref}
        className="fixed left-4 top-4 z-50 flex h-10 items-center justify-center rounded-full border border-border bg-background/80 px-4 font-mono text-sm font-semibold shadow-sm backdrop-blur-md transition-colors hover:border-accent hover:text-accent md:left-8 md:top-8"
      >
        ← BACK
      </Link>
      
      {/* 최대 폭 설정 (max-w-2xl) 및 중앙 정렬 */}
      <main className="mx-auto max-w-2xl px-4 pt-24 pb-32 md:px-8">
        {sections.map((section) => (
          <BoardSectionBlock key={section.id} section={section} />
        ))}
      </main>
    </div>
  )
}