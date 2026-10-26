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
    const apply = () => {
      raf = 0
      const vh = window.innerHeight
      const rect = el.getBoundingClientRect()
      // 사진 윗변이 화면 아래 끝에 닿을 때 0, 화면 높이의 80%(또는 사진 높이)만큼 올라오면 1
      const span = Math.max(1, Math.min(rect.height, vh * 0.8))
      const p = Math.min(1, Math.max(0, (vh - rect.top) / span))
      if (p >= 1) {
        el.style.maskImage = el.style.webkitMaskImage = "none"
        el.style.transform = "none"
        el.style.opacity = "1"
        return
      }
      const stop = p * 140 - 40
      const mask = `linear-gradient(to bottom, #000 ${stop}%, transparent ${stop + 40}%)`
      el.style.maskImage = el.style.webkitMaskImage = mask
      el.style.transform = `translateY(${(1 - p) * 48}px)`
      el.style.opacity = String(Math.min(1, p * 3))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    apply()
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
    <div ref={ref} style={{ willChange: "transform, opacity" }}>
      {children}
    </div>
  )
}
