"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

type Photo = { src: string; alt: string }

// 3:4 세로 사진 3장을 한 화면에: 높이는 (화면 높이 - 여백)과 (화면 너비로 3장이 들어가는 높이) 중 작은 쪽.
const GAP = "clamp(0.75rem, 2.5vw, 2.5rem)"
const SIDE = "clamp(0.75rem, 5vw, 4rem)"
const PHOTO_H = `min(calc(100svh - 11.5rem), calc((100vw - 2 * ${SIDE} - 2 * ${GAP}) / 3 * 4 / 3))`
// 좁은 화면(1400px 미만): 한 장씩 보이고 좌우로 넘긴다(터치 스와이프 / 마우스 클릭 후 드래그) — 아래에 점·알약 표시.
const PHOTO_H_MOBILE = `min(calc(100svh - 13.5rem), calc((100vw - 2 * ${SIDE}) * 4 / 3))`
// 넘기는 창은 사진 한 장 너비로만 — 배경(검정 여백)은 끌리지도, 옆 사진이 비치지도 않는다.
const PHOTO_W_MOBILE = `calc(${PHOTO_H_MOBILE} * 3 / 4)`

export function GoldenStage({ title, date, photos }: { title: string; date: string; photos: Photo[] }) {
  const scroller = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const [active, setActive] = useState(0)
  const [dragging, setDragging] = useState(false)

  const indexNow = useCallback(() => {
    const el = scroller.current
    if (!el || el.clientWidth === 0) return 0
    return Math.max(0, Math.min(photos.length - 1, Math.round(el.scrollLeft / el.clientWidth)))
  }, [photos.length])

  const goTo = useCallback((i: number) => {
    const el = scroller.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" })
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const onScroll = () => setActive(indexNow())
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [indexNow])

  // 마우스 드래그(터치는 브라우저 기본 스와이프가 처리)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !scroller.current) return
    drag.current = { x: e.clientX, left: scroller.current.scrollLeft, moved: false }
    scroller.current.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || !scroller.current) return
    d.moved = true
    scroller.current.scrollLeft = d.left - (e.clientX - d.x)
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const el = scroller.current
    if (!d || !el) return
    drag.current = null
    setDragging(false)
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    // 조금만 끌어도 다음/이전 장으로 넘어가도록 방향 기준으로 목표 결정
    const delta = e.clientX - d.x
    const start = Math.round(d.left / el.clientWidth)
    const threshold = el.clientWidth * 0.12
    const target = delta < -threshold ? start + 1 : delta > threshold ? start - 1 : start
    goTo(Math.max(0, Math.min(photos.length - 1, target)))
  }

  return (
    <div className="relative bg-black text-white">
      <div className="flex h-svh items-start justify-center overflow-hidden pt-5" style={{ paddingInline: SIDE }}>
        <div className="flex w-full flex-col max-[1399px]:items-center min-[1400px]:w-auto" style={{ gap: "0.75rem" }}>
          <Link href="/" className="self-start font-mono text-xs uppercase tracking-[0.25em] text-white/80 transition-colors hover:text-white">
            ← Back to board
          </Link>

          <div className="flex flex-wrap items-baseline gap-x-4 max-[1399px]:justify-center">
            <h1 className="font-sans font-extrabold leading-none tracking-tight" style={{ fontSize: "clamp(2rem, 5vw, 4.25rem)" }}>
              {title}
            </h1>
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#ffb700] md:text-xs">{date}</p>
          </div>

          <div
            ref={scroller}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={`mt-2 flex w-[var(--pw-m)] overflow-x-auto [scrollbar-width:none] min-[1400px]:w-auto min-[1400px]:cursor-auto min-[1400px]:snap-none min-[1400px]:items-center min-[1400px]:justify-center min-[1400px]:gap-[var(--gap)] min-[1400px]:overflow-visible [&::-webkit-scrollbar]:hidden ${
              dragging ? "cursor-grabbing select-none" : "cursor-grab snap-x snap-mandatory"
            }`}
            style={{ "--gap": GAP, "--pw-m": PHOTO_W_MOBILE } as React.CSSProperties}
          >
            {photos.map((p, i) => (
              <div key={p.src} className="flex w-full shrink-0 snap-start justify-start min-[1400px]:w-auto min-[1400px]:justify-center">
                <div
                  className="group relative shrink-0 overflow-hidden h-[var(--ph-m)] min-[1400px]:h-[var(--ph)]"
                  style={{ "--ph": PHOTO_H, "--ph-m": PHOTO_H_MOBILE, aspectRatio: "3 / 4" } as React.CSSProperties}
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    quality={80}
                    sizes="(max-width: 1400px) 100vw, 40vh"
                    className="pointer-events-none select-none object-cover"
                    draggable={false}
                    priority
                  />
                  {i > 0 && (
                    <button
                      type="button"
                      aria-label="이전 사진"
                      onClick={() => goTo(i - 1)}
                      className="absolute inset-y-0 left-0 z-10 w-1/4 bg-gradient-to-r from-black/60 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100 min-[1400px]:hidden"
                    />
                  )}
                  {i < photos.length - 1 && (
                    <button
                      type="button"
                      aria-label="다음 사진"
                      onClick={() => goTo(i + 1)}
                      className="absolute inset-y-0 right-0 z-10 w-1/4 bg-gradient-to-l from-black/60 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100 min-[1400px]:hidden"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 min-[1400px]:hidden" role="tablist" aria-label="사진 선택">
            {photos.map((p, i) => (
              <button
                key={p.src}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`${i + 1}번째 사진`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-[#ffb700]" : "w-2 bg-white/35 hover:bg-white/60"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
