"use client"

import { useEffect, useLayoutEffect, useRef } from "react"

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

/**
 * 스크롤 위치에 따라 아래에서 올라오듯 서서히 나타나는 래퍼.
 * 화면에 들어온 만큼만 위쪽부터 보이고, 아직 안 나온 아래쪽은 그라데이션으로 흐려진다.
 */
export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let raf = 0
    let current = -1 // 화면에 그려진 진행도(부드럽게 따라가는 값)
    let target = 0

    const paint = (p: number) => {
      if (p >= 0.999) {
        el.style.maskImage = el.style.webkitMaskImage = "none"
        el.style.transform = "none"
        el.style.opacity = "1"
        return
      }
      const stop = p * 140 - 40
      const mask = `linear-gradient(to bottom, #000 ${stop}%, transparent ${stop + 40}%)`
      el.style.maskImage = el.style.webkitMaskImage = mask
      el.style.transform = `translateY(${(1 - p) * 64}px)`
      el.style.opacity = String(Math.min(1, p * 3))
    }
    const measure = () => {
      const vh = window.innerHeight
      const rect = el.getBoundingClientRect()
      // 사진 윗변이 화면 아래에서 15% 위로 올라온 뒤부터 시작(아래 여백), 화면 높이의 70%(또는 사진 높이)만큼 올라오면 1
      const span = Math.max(1, Math.min(rect.height, vh * 0.7))
      const byPos = (vh * 0.85 - rect.top) / span
      // 처음 화면(스크롤 0)에서는 아무것도 보이지 않고, 조금 내려가야 나타난다
      const byScroll = window.scrollY / (vh * 0.35)
      target = Math.min(1, Math.max(0, Math.min(byPos, byScroll)))
    }
    const tick = () => {
      raf = 0
      measure()
      if (current < 0) current = target
      current += (target - current) * 0.1
      if (Math.abs(target - current) < 0.002) current = target
      paint(current)
      if (current !== target) raf = requestAnimationFrame(tick)
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
