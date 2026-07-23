"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { SimplePostHeader } from "@/components/simple-post-header"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

type StockData = {
  name: string
  sector: string
  status: "STRICT" | "RELAXED" | "NONE"
  message: string
  weekly: any
  daily: any
}

type DashboardData = {
  date: string
  strict: string[]
  relaxed: string[]
  stocks: StockData[]
}

export default function VcpDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [timeframe, setTimeframe] = useState<"weekly" | "daily">("weekly")
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/reports/vcp-dashboard.json")
      .then((res) => {
        if (!res.ok) throw new Error("not found")
        return res.json()
      })
      .then(setData)
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono text-sm text-muted-foreground">
        [에러] /reports/vcp-dashboard.json을 찾을 수 없습니다.
      </div>
    )
  }
  if (!data) return null

  const statusColor = { STRICT: "#B71C1C", RELAXED: "#2E7D32", NONE: "#777777" }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-4 py-10 md:px-10">
        <SimplePostHeader
          eyebrow={`RESEARCH / Filed: ${data.date}`}
          title="Mark Minervini VCP 분석"
          tags={["VCP", "Minervini", "Screener"]}
        />

        <div className="mx-auto mt-6 max-w-5xl rounded-lg border border-border bg-white p-6 text-sm leading-relaxed">
          <p>
            <b>매수 종목:</b>{" "}
            <span style={{ color: "#B71C1C", fontWeight: "bold" }}>
              {data.strict.length ? data.strict.join(", ") : "없음"}
            </span>
          </p>
          <p>
            <b>관심 종목:</b>{" "}
            <span style={{ color: "#2E7D32", fontWeight: "bold" }}>
              {data.relaxed.length ? data.relaxed.join(", ") : "없음"}
            </span>
          </p>
        </div>

        <div className="mx-auto mt-6 flex max-w-5xl justify-center gap-2">
          {(["weekly", "daily"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-full border px-6 py-2 font-mono text-xs font-bold uppercase transition-colors ${
                timeframe === tf
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-white text-muted-foreground hover:bg-muted"
              }`}
            >
              {tf === "weekly" ? "주간 차트" : "일간 차트"}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-8 grid max-w-[1800px] grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.stocks.map((stock) => {
            const fig = stock[timeframe]
            return (
              <div
                key={stock.name}
                className="overflow-hidden rounded-lg border border-border bg-white shadow-scrap"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 font-bold text-white"
                  style={{ backgroundColor: statusColor[stock.status] }}
                >
                  <span>{stock.name}</span>
                  <span className="text-xs opacity-90">{stock.sector}</span>
                </div>
                <p className="border-b border-border p-2 text-center text-xs text-muted-foreground">
                  {stock.message}
                </p>
                <Plot
                  data={fig.data}
                  layout={{ ...fig.layout, autosize: true }}
                  useResizeHandler
                  style={{ width: "100%", height: "400px" }}
                  config={{ responsive: true, displayModeBar: false }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}