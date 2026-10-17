import Image from "next/image"
import Link from "next/link"

type Photo = { src: string; alt: string }

// 3:4 세로 사진 3장을 한 화면에: 높이는 (화면 높이 - 여백)과 (화면 너비로 3장이 들어가는 높이) 중 작은 쪽.
const GAP = "clamp(0.75rem, 2.5vw, 2.5rem)"
const SIDE = "clamp(0.75rem, 5vw, 4rem)"
const PHOTO_H = `min(calc(100svh - 11.5rem), calc((100vw - 2 * ${SIDE} - 2 * ${GAP}) / 3 * 4 / 3))`
// 모바일(768px 미만): 한 장씩 보이고 좌우로 넘긴다 — 사진 한 장이 화면 폭을 채우는 높이.
const PHOTO_H_MOBILE = `min(calc(100svh - 11.5rem), calc((100vw - 2 * ${SIDE}) * 4 / 3))`

// 제목은 위에, 사진 세 장은 그 아래 한 화면에 가로로 배치(스크롤 효과 없음).
export function GoldenStage({ title, date, photos }: { title: string; date: string; photos: Photo[] }) {
  return (
    <div className="relative bg-black text-white">
      <div className="flex h-svh items-start justify-center overflow-hidden pt-5" style={{ paddingInline: SIDE }}>
        <div className="flex w-full flex-col md:w-auto" style={{ gap: "0.75rem" }}>
          <Link href="/" className="self-start font-mono text-xs uppercase tracking-[0.25em] text-white/80 transition-colors hover:text-white">
            ← Back to board
          </Link>

          <div className="flex flex-wrap items-baseline gap-x-4">
            <h1 className="font-sans font-extrabold leading-none tracking-tight" style={{ fontSize: "clamp(2rem, 5vw, 4.25rem)" }}>
              {title}
            </h1>
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#ffb700] md:text-xs">{date}</p>
          </div>

          <div
            className="mt-2 flex w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:w-auto md:snap-none md:items-center md:justify-center md:gap-[var(--gap)] md:overflow-visible [&::-webkit-scrollbar]:hidden"
            style={{ "--gap": GAP } as React.CSSProperties}
          >
            {photos.map((p) => (
              <div key={p.src} className="flex w-full shrink-0 snap-center justify-center md:w-auto">
                <div
                  className="relative shrink-0 overflow-hidden h-[var(--ph-m)] md:h-[var(--ph)]"
                  style={{ "--ph": PHOTO_H, "--ph-m": PHOTO_H_MOBILE, aspectRatio: "3 / 4" } as React.CSSProperties}
                >
                  <Image src={p.src} alt={p.alt} fill quality={80} sizes="(max-width: 1024px) 100vw, 40vh" className="object-cover" priority />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
