"use client"

import { createContext, useContext, useState } from "react"
import type { Category } from "@/lib/posts"

export type Filter = "ALL" | Category

type FilterContextValue = {
  filter: Filter
  setFilter: (f: Filter) => void
}

const BoardFilterContext = createContext<FilterContextValue | null>(null)

export function BoardFilterProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<Filter>("ALL")

  const handleSetFilter = (f: Filter) => {
    setFilter(f)
    // bring the board into view when a category is chosen from the top nav
    if (typeof document !== "undefined") {
      document.getElementById("board")?.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <BoardFilterContext.Provider value={{ filter, setFilter: handleSetFilter }}>
      {children}
    </BoardFilterContext.Provider>
  )
}

export function useBoardFilter() {
  const ctx = useContext(BoardFilterContext)
  if (!ctx) {
    throw new Error("useBoardFilter must be used within a BoardFilterProvider")
  }
  return ctx
}
