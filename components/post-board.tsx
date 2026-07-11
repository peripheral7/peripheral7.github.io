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
    <div className="relative w-full h-full overflow-hidden bg-muted ring-1 ring-black/5">
      {pin === "tape" && <Tape />}
      {pin === "pin" && <Pin />}
      {pin === "clip" && <Clip />}

      <Image
        src={item.src}
        alt={item.alt}
        width={width}
        height={height}
        quality={50}
        sizes="(max-width: 1280px) 100vw, 66vw"
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  )
}

function BoardSectionBlock({ section }: { section: BoardSection }) {
  const columns = section.columns ?? 24

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

      {/* 확대 시 배치가 깨지거나 이미지가 작아지지 않도록 
        픽셀(px) 기반의 고정 행 높이(`grid-auto-rows-[12px]`)를 사용하는 CSS Grid 시스템으로 전면 수정했습니다.
      */}
      <div
        className="relative grid gap-x-4 items-start"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: "12px",
        }}
      >
        {section.items.map((item) => {
          if (item.kind === "label" || item.kind === "palette") return null
          
          const photoItem = item as BoardPhoto
          const { width, height } = parseAspectRatio(photoItem.aspectRatio ?? "4 / 5")
          
          // 각 이미지의 가로 span 크기와 고유 종횡비를 연산하여, 
          // 고정 픽셀 그리드 안에서 차지할 수직 row span 개수를 완벽히 매칭합니다. (이미지 찌그러짐 방지)
          const approxRowSpan = Math.ceil(((photoItem.colSpan ?? 6) * (height / width) * 2.85))

          return (
            <div
              key={photoItem.id}
              style={{
                gridColumn: `${photoItem.colStart ?? "auto"} / span ${photoItem.colSpan ?? 6}`,
                gridRowStart: photoItem.rowStart ?? "auto",
                gridRowEnd: photoItem.rowStart ? `span ${approxRowSpan}` : "auto",
                zIndex: photoItem.z ?? 1
              }}
              className="w-full h-full"
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
      
      {/* - 표준 아이패드 해상도 가로/세로 영역(1024px 이하)까지는 w-full로 채워 검은색 여백을 제거합니다.
        - 모니터 스크린 크기인 xl(1280px) 이상 환경에서만 2/3 레이아웃과 양옆 검은색 여백이 나타나도록 상향 조정했습니다.
      */}
      <main className="mx-auto w-full xl:w-2/3 min-h-screen bg-background px-4 pt-24 pb-32 md:px-12 lg:px-16 shadow-2xl transition-all duration-300">
        {sections.map((section) => (
          <BoardSectionBlock key={section.id} section={section} />
        ))}
      </main>
    </div>
  )
}