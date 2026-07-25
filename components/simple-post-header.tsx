"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export function FloatingBackButton({
  href = "/",
}: {
  href?: string
}) {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY

    function onScroll() {
      const currentY = window.scrollY
      const goingDown = currentY > lastY.current
      const pastThreshold = currentY > 80

      if (goingDown && pastThreshold) {
        setVisible(false)
      } else {
        setVisible(true)
      }

      lastY.current = currentY
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className={`fixed left-4 top-4 z-50 transition-all duration-300 md:left-8 md:top-8 ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <Link
        href={href}
        className="flex h-10 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/90 px-4 font-mono text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:border-accent hover:text-accent"
      >
        ← BACK TO BOARD
      </Link>
    </div>
  )
}

export function SimplePostHeader({
  eyebrow,
  title,
  subtitle,
  tags,
  backHref = "/",
}: {
  eyebrow: string
  title: string
  subtitle?: string
  tags?: string[]
  backHref?: string
}) {
  return (
    <>
      <FloatingBackButton href={backHref} />

      <div className="mx-auto max-w-4xl px-4 pt-24">
        <div className="mt-6 flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            {eyebrow}
          </span>
          <h1 className="font-sans text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              {subtitle}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 h-px w-full bg-border" />
      </div>
    </>
  )
}