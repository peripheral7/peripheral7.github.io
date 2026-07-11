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
    // 틀의 높이를 강제하지 않고, Image의 고유 비율에 자연스럽게 맞춰지도록 h-full 삭제
    <div className="relative w-full overflow-hidden bg-muted ring-1 ring-black/5 shadow-md">
      {pin === "tape" && <Tape />}
      {pin === "pin" && <Pin />}
      {pin === "clip" && <Clip />}

      <Image
        src={item.src}
        alt={item.alt}
        width={width}
        height={height}
        quality={50} // 50% 화질 최적화
        sizes="(max-width: 1024px) 100vw, 1024px"
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  )
}

function BoardSectionBlock({ section }: { section: BoardSection }) {
  const columns = section.columns ?? 24
  const rows = section.rows ?? 160
  
  const paddingBottomPercent = (rows / columns) * 100

  return (
    <section id={section.id} className="mb-12">
      {/* title이 존재할 때만 헤더 영역 전체를 렌더링하도록 조건부 처리 */}
      {section.title && (
        <header className="mb-10 border-b border-border pb-4">
          <h2 className="font-sans text-2xl font-extrabold uppercase tracking-tight text-foreground md:text-3xl">
            {section.title}
          </h2>
          {section.note && (
            <p className="mt-2 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">{section.note}</p>
          )}
        </header>
      )}

      {/* 자유 배치를 위한 캔버스 영역 */}
      <div
        className="relative w-full"
        style={{ paddingBottom: `${paddingBottomPercent}%` }}
      >
        {section.items.map((item) => {
          if (item.kind === "label" || item.kind === "palette") return null
          
          const photoItem = item as BoardPhoto
          
          // 위치를 퍼센트(%)로 환산
          const wPercent = ((photoItem.colSpan ?? 6) / columns) * 100
          const lPercent = (((photoItem.colStart ?? 1) - 1) / columns) * 100
          const tPercent = (((photoItem.rowStart ?? 1) - 1) / rows) * 100

          return (
            <div
              key={photoItem.id}
              className="absolute"
              style={{
                left: `${lPercent}%`,
                top: `${tPercent}%`,
                width: `${wPercent}%`,
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
    <div className="relative min-h-screen bg-black text-foreground overflow-x-hidden">
      <Link
        href={backHref}
        className="fixed left-4 top-4 z-50 flex h-10 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/90 px-4 font-mono text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:border-accent hover:text-accent md:left-8 md:top-8"
      >
        ← BACK
      </Link>
      
      {/* max-w-5xl (1024px): 
        - 아이패드나 모바일(1024px 이하)에서는 화면을 100% 가득 채움 (검은 여백 없음).
        - 일반 데스크톱 모니터에서는 1024px 폭을 유지하며 중앙 정렬 (양 옆이 검은색 bg-black으로 표시됨).
      */}
      <main className="mx-auto w-full max-w-5xl min-h-screen bg-background px-4 pt-24 pb-32 md:px-12 lg:px-16 shadow-2xl transition-all duration-300">
        {sections.map((section) => (
          <BoardSectionBlock key={section.id} section={section} />
        ))}
      </main>
    </div>
  )
}