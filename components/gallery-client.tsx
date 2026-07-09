"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

export function GalleryClient({ config }: { config: any }) {
  const [images, setImages] = useState<any[]>([])
  const [error, setError] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // manifest.json 호출 (경로 오류 시 콘솔 및 화면에 에러 표시)
    fetch(`${config.folder}manifest.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Manifest not found at: ${config.folder}manifest.json`)
        return res.json()
      })
      .then((data) => setImages(data))
      .catch((err) => {
        console.error(err)
        setError(true)
      })
  }, [config.folder])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0")
            entry.target.classList.remove("opacity-0", "translate-y-8")
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    )

    const items = containerRef.current.querySelectorAll(".gallery-item")
    items.forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [images])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* 고정 사이드바 */}
      <aside className="sticky top-0 z-10 w-full shrink-0 border-b border-border bg-background p-6 md:h-screen md:w-60 md:overflow-y-auto md:border-b-0 md:border-r md:p-10">
        <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-widest text-accent">
          Field File
        </p>
        <h1 className="mb-8 text-lg font-extrabold tracking-tight">
          {config.sidebar}
        </h1>
        <Link 
          href="/" 
          className="inline-block border-b border-border pb-3 font-semibold text-foreground transition-colors hover:text-accent"
        >
          ← 메인으로
        </Link>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 px-5 py-10 md:px-12 md:py-12 lg:px-20">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <Link href="/" className="text-sm font-bold transition-colors hover:text-accent">
            ← BACK TO BOARD
          </Link>
          <div className="flex gap-3 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            <span className="rounded border border-border px-2 py-1">Research</span>
            <span className="rounded border border-border px-2 py-1">Photography</span>
            <span className="rounded border border-border px-2 py-1">Motorcycle</span>
          </div>
        </div>

        <section className="mb-16 max-w-4xl">
          <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-widest text-accent">
            {config.eyebrow}
          </p>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-4xl">
            {config.title}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {config.desc}
          </p>
        </section>

        {/* 에러 또는 이미지 갤러리 렌더링 */}
        {error ? (
          <div className="rounded border border-dashed border-border bg-neutral-50 p-10 text-center font-mono text-sm text-muted-foreground">
            [에러] 사진 매니페스트를 찾을 수 없습니다.<br/>
            경로 확인: <code>public{config.folder}manifest.json</code>
          </div>
        ) : (
          <div ref={containerRef} className="columns-2 gap-4 md:columns-3 lg:gap-6">
            {images.map((img, i) => {
              const fileName = img.file || img.filename
              return (
                <figure 
                  key={i} 
                  className="gallery-item mb-4 break-inside-avoid opacity-0 translate-y-8 transition-all duration-700 ease-out lg:mb-6"
                >
                  <div className="overflow-hidden rounded-md bg-neutral-100">
                    <img
                      src={`${config.folder}${fileName}`}
                      alt={img.caption || `${config.title} photo ${i + 1}`}
                      loading="lazy"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  {img.caption && (
                    <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}