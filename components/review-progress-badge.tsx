"use client"

import { useEffect, useState } from "react"

// Reads a same-origin localStorage summary ({correct, total}) written by an
// interactive page (e.g. a quiz) and shows how far along the viewer's own
// browser is. Per-browser only — there is no server-side tracking here.
export function ReviewProgressBadge({ storageKey }: { storageKey: string }) {
  const [pct, setPct] = useState<number | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return
      const { correct, total } = JSON.parse(raw) as { correct?: number; total?: number }
      if (typeof correct === "number" && typeof total === "number" && total > 0) {
        setPct(Math.round((correct / total) * 100))
      }
    } catch {
      // localStorage unavailable or malformed summary — just skip the badge
    }
  }, [storageKey])

  if (pct === null) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[0.6rem] font-medium tracking-wide text-muted-foreground">
      복습 {pct}%
    </span>
  )
}
