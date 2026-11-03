"use client"

import { useEffect, useLayoutEffect, useRef } from "react"

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

/** 진행도를 몇 단계로 끊어 보여 줄지 */
const STEPS = 4
/** 흐려지는 띠의 폭(사진 높이 대비 %) */
const FADE = 80
/** 앞 사진보다 이만큼(진행도) 늦게 따라온다 — 같은 높이에 있어도 하나씩 나타나게 */
const LAG = 0.5

type Item = { el: HTMLDivElement; shown: number }
const items = new Set<Item>()
let raf = 0
let ro: ResizeObserver | null = null

const paint = (item: Item, step: number) => {
  if (step === item.shown) return
  item.shown = step
  const { el } = item
  if (step >= STEPS) {
    el.style.maskImage = el.style.webkitMaskImage = "none"
    el.style.opacity = "1"
    return
  }
  const p = step / STEPS
  const stop = p * (100 + FADE) - FADE
  const mask = `linear-gradient(to bottom, #000 ${stop}%, transparent ${stop + FADE}%)`
  el.style.maskImage = el.style.webkitMaskImage = mask
  el.style.opacity = String(Math.min(1, p * 3))
}

const tick = () => {
  raf = 0
  const vh = window.innerHeight
  const atBottom = window.scrollY + vh >= document.documentElement.scrollHeight - 2
  // 처음 화면(스크롤 0)에서는 아무것도 보이지 않고, 조금 내려가야 나타난다
  const byScroll = window.scrollY / (vh * 0.35)
  const list = [...items].map((item) => ({ item, rect: item.el.getBoundingClientRect() }))
  // 위→아래, 같은 높이면 왼쪽→오른쪽 순서로 하나씩
  list.sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left)
  let prev = Infinity
  for (const { item, rect } of list) {
    // 사진 윗변이 화면 아래에서 15% 위로 올라온 뒤부터 시작, 화면 높이의 90%(또는 사진 높이)만큼 올라오면 1
    const span = Math.max(1, Math.min(rect.height, vh * 0.9))
    const byPos = (vh * 0.85 - rect.top) / span
    // 앞 사진을 기다리다 화면 위로 빠져나가지 않게, 윗변이 화면 위쪽 25% 안으로 들어오면 기다리지 않는다
    const wait = rect.top < vh * 0.25 ? Infinity : prev - LAG
    const raw = Math.min(byPos, byScroll, wait)
    prev = raw
    const p = atBottom ? 1 : Math.min(1, Math.max(0, raw))
    paint(item, Math.floor(p * STEPS + 0.001))
  }
}

const schedule = () => {
  if (!raf) raf = requestAnimationFrame(tick)
}

/**
 * 스크롤 위치에 따라 단계별로 나타나는 래퍼.
 * 사진 위쪽부터 또렷하고 아래쪽이 넓은 그라데이션으로 흐려져 있다가, 스크롤할 때마다 한 칸씩 아래까지 드러난다.
 * 진행도는 스크롤 위치로만 정해지므로 스크롤을 멈추면 그 단계에서 멈추고,
 * 여러 장은 앞 사진을 조금씩 뒤따라 하나씩 나타난다.
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

    const item: Item = { el, shown: -1 }
    if (items.size === 0) {
      window.addEventListener("scroll", schedule, { passive: true })
      window.addEventListener("resize", schedule)
      // 이미지가 늦게 로드되어 높이가 바뀌는 경우 대비
      ro = new ResizeObserver(schedule)
    }
    items.add(item)
    ro?.observe(el)
    schedule()
    return () => {
      items.delete(item)
      ro?.unobserve(el)
      if (items.size === 0) {
        window.removeEventListener("scroll", schedule)
        window.removeEventListener("resize", schedule)
        ro?.disconnect()
        ro = null
        if (raf) cancelAnimationFrame(raf)
        raf = 0
      }
    }
  }, [])

  return (
    <div ref={ref} style={{ willChange: "opacity", opacity: 0 }}>
      {children}
    </div>
  )
}
