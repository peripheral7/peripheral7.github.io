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
        quality={50}
        sizes="(max-width: 768px) 100vw, 66vw"
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  )
}

function BoardSectionBlock({ section }: { section: BoardSection }) {
  const columns = section.columns ?? 24
  const rows = section.rows ?? 275
  
  const rowHeightPercent = 1.5 
  const totalHeightPercent = rows * rowHeightPercent

  return (
    <section id={section.id} className="mb-12">
      <header className="mb-10 border-b border-border pb-4">
        <h2 className="font-sans text-2xl font-extrabold uppercase tracking-tight text-foreground md:text-3xl">
          {section.title}
        </h2>
        {section.note && (
          <p className="mt-2 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">{section.note}</p>
        )}
      </header>

      <div
        className="relative w-full"
        style={{ paddingBottom: `${totalHeightPercent}%` }}
      >
        {section.items.map((item) => {
          if (item.kind === "label" || item.kind === "palette") return null
          
          const photoItem = item as BoardPhoto
          
          const w = (photoItem.colSpan ?? 6) / columns * 100
          const l = ((photoItem.colStart ?? 1) - 1) / columns * 100
          
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
    /* 최외곽 도화지를 bg-black으로 설정하여 양옆에 완벽한 검은색 여백 생성 */
    <div className="relative min-h-screen bg-black text-foreground overflow-x-hidden">
      
      {/* 좌측 상단 고정 플로팅 버튼 */}
      <Link
        href={backHref}
        className="fixed left-4 top-4 z-50 flex h-10 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/90 px-4 font-mono text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:border-accent hover:text-accent md:left-8 md:top-8"
      >
        ← BACK
      </Link>
      
      {/* 중앙 2/3 레이아웃 핵심 박스:
        - 기본 모바일/웹 반 스크린 (w-full): 여백 없이 화면 100% 꽉 차게 동작
        - 데스크톱 스크린 환경 (md:w-2/3): 화면 중앙 2/3 영역만 차지하며 본문 배경색(bg-background) 유지
      */}
      <main className="mx-auto w-full md:w-2/3 min-h-screen bg-background px-4 pt-24 pb-32 md:px-12 lg:px-16 shadow-2xl transition-all duration-300">
        {sections.map((section) => (
          <BoardSectionBlock key={section.id} section={section} />
        ))}
      </main>
    </div>
  )
}