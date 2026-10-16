"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef } from "react"

type Photo = { src: string; alt: string }

// 3:4 세로 사진 3장을 한 화면에: 높이는 (화면 높이 - 여백)과 (화면 너비로 3장이 들어가는 높이) 중 작은 쪽.
const GAP = "clamp(0.75rem, 2.5vw, 2.5rem)"
const SIDE = "clamp(0.75rem, 5vw, 4rem)"
const PHOTO_H = `min(calc(100svh - 7rem), calc((100vw - 2 * ${SIDE} - 2 * ${GAP}) / 3 * 4 / 3))`

const FEATHER = 30 // 번지는 가장자리 폭(%)
const SNAP = 0.8 // 이 진행도부터 사진이 한 번에 전부 나타난다

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

// 스크롤 진행도 p(0→1): 제목은 아래쪽부터 흐려지고, 사진은 윗부분부터 서서히 나타나다가 SNAP 지점에서 한 번에 완전히 나타난다.
export function GoldenStage({ title, date, photos }: { title: string; date: string; photos: Photo[] }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const photosRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const apply = () => {
      raf = 0
      const outer = outerRef.current
      const t = titleRef.current
      const ph = photosRef.current
      if (!outer || !t || !ph) return
      const range = outer.offsetHeight - window.innerHeight
      const p = range > 0 ? clamp01(-outer.getBoundingClientRect().top / range) : 1

      // 제목: 아래부터 사라짐
      const tt = clamp01(p / 0.6)
      const e = (1 - tt) * (100 + FEATHER)
      const tm = `linear-gradient(to bottom, #000 ${e - FEATHER}%, transparent ${e}%)`
      t.style.maskImage = tm
      t.style.webkitMaskImage = tm
      t.style.visibility = tt >= 1 ? "hidden" : "visible"

      // 사진: 위부터 나타남, SNAP 이후엔 한 번에 전부
      if (p >= SNAP) {
        ph.style.maskImage = "none"
        ph.style.webkitMaskImage = "none"
        ph.style.opacity = "1"
      } else {
        const r = clamp01(p / SNAP)
        const edge = r * (100 + FEATHER)
        const pm = `linear-gradient(to bottom, #000 ${edge - FEATHER}%, transparent ${edge}%)`
        ph.style.maskImage = pm
        ph.style.webkitMaskImage = pm
        ph.style.opacity = String(0.35 + 0.5 * r)
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    apply()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={outerRef} className="relative bg-black text-white" style={{ height: "260svh" }}>
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden" style={{ paddingInline: SIDE }}>
        <div className="relative flex flex-col" style={{ gap: "0.75rem" }}>
          <Link href="/" className="self-start font-mono text-xs uppercase tracking-[0.25em] text-white/80 transition-colors hover:text-white">
            ← Back to board
          </Link>

          <div className="relative">
            <div
              ref={photosRef}
              className="flex items-center justify-center"
              style={{ gap: GAP, opacity: 0.35, maskImage: "linear-gradient(to bottom, #000 -30%, transparent 0%)", WebkitMaskImage: "linear-gradient(to bottom, #000 -30%, transparent 0%)" }}
            >
              {photos.map((p) => (
                <div key={p.src} className="relative shrink-0 overflow-hidden" style={{ height: PHOTO_H, aspectRatio: "3 / 4" }}>
                  <Image src={p.src} alt={p.alt} fill quality={80} sizes="(max-width: 1024px) 33vw, 40vh" className="object-cover" priority />
                </div>
              ))}
            </div>

            <div ref={titleRef} className="pointer-events-none absolute inset-0 flex flex-col justify-center">
              <h1 className="font-sans font-extrabold leading-[0.95] tracking-tight" style={{ fontSize: "clamp(2.75rem, 9vw, 9rem)" }}>
                Golden
                <br />
                Smoking Hour
              </h1>
              <p className="mt-4 font-mono text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#ffb700] md:text-xs">{date}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
