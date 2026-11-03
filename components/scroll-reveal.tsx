"use client"

import { useEffect, useLayoutEffect, useRef } from "react"

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

/** 진행도를 몇 단계로 끊어 보여 줄지 */
const STEPS = 4

/**
 * 스크롤 위치에 따라 단계별로 나타나는 래퍼.
 * 사진 위쪽부터 또렷하고 아래쪽이 그라데이션으로 흐려져 있다가, 스크롤할 때마다 한 칸씩 아래까지 드러난다.
 * 진행도는 스크롤 위치로만 정해지므로 스크롤을 멈추면 그 단계에서 멈춘다.
 */
export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1"
      return
    }

    let raf = 0
    let shown = -1 // 화면에 그려진 단계

    const paint = (step: number) => {
      if (step >= STEPS) {
        el.style.maskImage = el.style.webkitMaskImage = "none"
        el.style.opacity = "1"
        return
      }
      const p = step / STEPS
      const stop = p * 140 - 40
      const mask = `linear-gradient(to bottom, #000 ${stop}%, transparent ${stop + 40}%)`
      el.style.maskImage = el.style.webkitMaskImage = mask
      el.style.opacity = String(Math.min(1, p * 3))
    }
    const measure = () => {
      const vh = window.innerHeight
      const rect = el.getBoundingClientRect()
      // 사진 윗변이 화면 아래에서 15% 위로 올라온 뒤부터 시작(아래 여백), 화면 높이의 90%(또는 사진 높이)만큼 올라오면 1
      const span = Math.max(1, Math.min(rect.height, vh * 0.9))
      const byPos = (vh * 0.85 - rect.top) / span
      // 처음 화면(스크롤 0)에서는 아무것도 보이지 않고, 조금 내려가야 나타난다
      const byScroll = window.scrollY / (vh * 0.35)
      const p = Math.min(1, Math.max(0, Math.min(byPos, byScroll)))
      return Math.floor(p * STEPS + 0.001)
    }
    const tick = () => {
      raf = 0
      const step = measure()
      if (step !== shown) {
        shown = step
        paint(step)
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    // 이미지가 늦게 로드되어 높이가 바뀌는 경우 대비
    const ro = new ResizeObserver(onScroll)
    ro.observe(el)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} style={{ willChange: "opacity", opacity: 0 }}>
      {children}
    </div>
  )
}
