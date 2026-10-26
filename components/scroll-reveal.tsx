"use client"

import { useEffect, useLayoutEffect, useRef } from "react"

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

/**
 * 스크롤 위치에 따라 스크롤하면서 서서히 나타나는 래퍼.
 * 사진을 가로 띠 STEPS 개로 나눠, 스크롤할수록 아래 띠부터 한 칸씩 끊어서 나타난다.
 * 시간 애니메이션 없이 스크롤 위치에 바로 묶여 있어, 스크롤한 만큼 지금 띠가 차오른다.
 */
const STEPS = 6
const EDGE = 2 // 띠 경계의 흐림 폭(%) — 작을수록 또렷하게 끊긴다
export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let raf = 0
    let target = 0

    const paint = (p: number) => {
      if (p >= 0.999) {
        el.style.maskImage = el.style.webkitMaskImage = "none"
        el.style.transform = "none"
        el.style.opacity = "1"
        return
      }
      // 다 찬 띠는 또렷하게, 지금 차오르는 띠 하나는 통째로 페이드
      const done = Math.floor(p * STEPS + 1e-6)
      const f = p * STEPS - done
      const a = (done / STEPS) * 100
      const b = ((done + 1) / STEPS) * 100
      const mask = `linear-gradient(to top, #000 ${a}%, rgba(0,0,0,${f.toFixed(3)}) ${a + EDGE / 2}%, rgba(0,0,0,${f.toFixed(3)}) ${b - EDGE / 2}%, transparent ${b + EDGE / 2}%)`
      el.style.maskImage = el.style.webkitMaskImage = mask
      el.style.transform = "none"
      el.style.opacity = "1"
    }
    const measure = () => {
      const vh = window.innerHeight
      const rect = el.getBoundingClientRect()
      // 사진 윗변이 화면 아래에서 15% 위로 올라온 뒤부터 시작(아래 여백), 화면 높이의 90%(또는 사진 높이)만큼 올라오면 1
      const span = Math.max(1, Math.min(rect.height, vh * 0.9))
      const byPos = (vh * 0.85 - rect.top) / span
      // 처음 화면(스크롤 0)에서는 아무것도 보이지 않고, 조금 내려가야 나타난다
      const byScroll = window.scrollY / (vh * 0.35)
      target = Math.min(1, Math.max(0, Math.min(byPos, byScroll)))
    }
    const tick = () => {
      raf = 0
      measure()
      paint(target)
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
    <div ref={ref} style={{ willChange: "transform, opacity", opacity: 0 }}>
      {children}
    </div>
  )
}
