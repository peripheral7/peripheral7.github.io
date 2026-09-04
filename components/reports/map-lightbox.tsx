"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

export type LightboxMap = {
  key: string
  label: string
  sub: string
  src: string
}

export function MapLightbox({ maps }: { maps: LightboxMap[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const lastFocused = useRef<HTMLElement | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((i) => (i === null ? i : (i + delta + maps.length) % maps.length)),
    [maps.length]
  )

  // 모달이 열려 있는 동안 배경 스크롤을 막고, 키보드로 닫기/이동할 수 있게 한다.
  useEffect(() => {
    if (openIndex === null) return

    lastFocused.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowRight") step(1)
      else if (e.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)

    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      lastFocused.current?.focus?.()
    }
  }, [openIndex, close, step])

  const active = openIndex === null ? null : maps[openIndex]

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {maps.map((m, i) => (
          <figure
            key={m.key}
            className="overflow-hidden rounded border border-border bg-card"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`${m.label} 지도 확대해서 보기`}
              className="group relative block aspect-[4/3] w-full cursor-zoom-in bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <Image
                src={m.src}
                alt={`${m.label} 공원 및 상권 클러스터 지도`}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/65 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-wide text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                클릭하여 확대
              </span>
            </button>
            <figcaption className="flex items-baseline justify-between border-t border-border px-3 py-2">
              <strong className="text-[0.82rem]">{m.label}</strong>
              <span className="font-mono text-[0.6rem] uppercase tracking-wide text-muted-foreground">
                {m.sub}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${active.label} 지도 확대 보기`}
          onClick={close}
          className="fixed inset-0 z-[100] flex flex-col bg-black/90 p-3 backdrop-blur-sm md:p-6"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 pb-3 text-white">
            <div className="min-w-0">
              <strong className="text-sm">{active.label}</strong>
              <span className="ml-2 font-mono text-[0.65rem] uppercase tracking-wide text-white/60">
                {active.sub}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  step(-1)
                }}
                aria-label="이전 지도"
                className="rounded border border-white/25 px-2.5 py-1 font-mono text-xs text-white/85 transition-colors hover:border-white/60 hover:text-white"
              >
                ←
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  step(1)
                }}
                aria-label="다음 지도"
                className="rounded border border-white/25 px-2.5 py-1 font-mono text-xs text-white/85 transition-colors hover:border-white/60 hover:text-white"
              >
                →
              </button>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="닫기"
                className="rounded border border-white/25 px-2.5 py-1 font-mono text-xs text-white/85 transition-colors hover:border-white/60 hover:text-white"
              >
                닫기 ✕
              </button>
            </div>
          </div>

          <div
            className="relative min-h-0 flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={active.src}
              alt={`${active.label} 공원 및 상권 클러스터 지도 (확대)`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          <p className="shrink-0 pt-3 text-center font-mono text-[0.65rem] text-white/45">
            Esc 닫기 · ← → 이동 · 배경 클릭 시 닫힘
          </p>
        </div>
      ) : null}
    </>
  )
}
