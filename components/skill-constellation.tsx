"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Sparkle } from "lucide-react"
import { skillTree, sections, layoutTree } from "@/content/appraiser/skilltree"
import defaultProgress from "@/content/appraiser/progress.default.json"

type LogEntry = { date: string; type: "study" | "review"; text: string }
type StarProgress = { acquired: boolean; logs: LogEntry[] }
type ProgressMap = Record<string, StarProgress>

const STORAGE_KEY = "appraiser-skilltree-progress-v1"
const FOCUS_ZOOM = 1.6
const DEFAULT_ZOOM = 0.5
const ZOOM_MIN = 0.4
const ZOOM_MAX = 2.4
const PAN_MARGIN = 260
const RESISTANCE = 0.35

// ── 1.1: 별 사이 간격은 이 두 값만 바꾸면 전체가 재조정됩니다 ──────
const X_SPACING = 190
const Y_SPACING = 190

function formatDateYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}/${m}/${day}`
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

function rubberBand(value: number, min: number, max: number, resistance = RESISTANCE) {
  if (value < min) return min - (min - value) * resistance
  if (value > max) return max + (value - max) * resistance
  return value
}

const DIR_VECTORS: Record<"w" | "a" | "s" | "d", { x: number; y: number }> = {
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
}

function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    type Dot = { x: number; y: number; r: number; phase: number; speed: number }
    let dots: Dot[] = []

    function resize() {
      canvas!.width = window.innerWidth * dpr
      canvas!.height = window.innerHeight * dpr
      canvas!.style.width = `${window.innerWidth}px`
      canvas!.style.height = `${window.innerHeight}px`
      const count = Math.floor((window.innerWidth * window.innerHeight) / 3200)
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.3 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.2,
      }))
    }
    function draw(t: number) {
      if (!ctx || !canvas) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (const d of dots) {
        const alpha = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.0006 * d.speed + d.phase))
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    resize()
    window.addEventListener("resize", resize)
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />
}

export function SkillConstellation() {
  // ── 1.3: 좌표를 손으로 정하지 않고 트리 구조에서 자동 계산 ──────
  const { positions, edges } = useMemo(
    () => layoutTree(skillTree, { xSpacing: X_SPACING, ySpacing: Y_SPACING }),
    [],
  )
  const nodeList = useMemo(
    () => [...positions.entries()].map(([id, p]) => ({ id, ...p })),
    [positions],
  )

  const bounds = useMemo(() => {
    const xs = nodeList.map((n) => n.x)
    const ys = nodeList.map((n) => n.y)
    return {
      minX: Math.min(...xs) - PAN_MARGIN,
      maxX: Math.max(...xs) + PAN_MARGIN,
      minY: Math.min(...ys) - PAN_MARGIN,
      maxY: Math.max(...ys) + PAN_MARGIN,
      centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
      centerY: (Math.min(...ys) + Math.max(...ys)) / 2,
    }
  }, [nodeList])

  const adjacency = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const [a, b] of edges) {
      if (!map.has(a)) map.set(a, [])
      if (!map.has(b)) map.set(b, [])
      map.get(a)!.push(b)
      map.get(b)!.push(a)
    }
    return map
  }, [edges])

  const [camera, setCamera] = useState({ x: bounds.centerX, y: bounds.centerY, zoom: DEFAULT_ZOOM })
  const [smooth, setSmooth] = useState(true)
  const [stage, setStage] = useState({ width: 1200, height: 800 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressMap>({})
  const [loaded, setLoaded] = useState(false)
  const [studyInput, setStudyInput] = useState("")
  const [reviewInput, setReviewInput] = useState("")

  const dragRef = useRef({ active: false, startX: 0, startY: 0, startCamX: 0, startCamY: 0, moved: false })
  const wheelTimeout = useRef<number | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function update() {
      setStage({ width: window.innerWidth, height: window.innerHeight })
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      setProgress(raw ? JSON.parse(raw) : (defaultProgress as ProgressMap))
    } catch {
      setProgress(defaultProgress as ProgressMap)
    } finally {
      setLoaded(true)
    }
  }, [])
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch {
      /* 저장 실패는 조용히 무시 */
    }
  }, [progress, loaded])

  function selectStar(id: string) {
    setSelectedId(id)
    setStudyInput("")
    setReviewInput("")
  }

  useEffect(() => {
    if (!selectedId) return
    const n = positions.get(selectedId)
    if (!n) return
    setSmooth(true)
    setCamera({ x: n.x, y: n.y, zoom: FOCUS_ZOOM })
  }, [selectedId, positions])

  useEffect(() => {
    function isTypingTarget(el: EventTarget | null) {
      const tag = (el as HTMLElement)?.tagName
      return tag === "INPUT" || tag === "TEXTAREA"
    }
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return
      const key = e.key.toLowerCase()
      if (key !== "w" && key !== "a" && key !== "s" && key !== "d") return
      e.preventDefault()

      const currentId = selectedId ?? "root0"
      const current = positions.get(currentId)
      if (!current) return
      const dir = DIR_VECTORS[key as "w" | "a" | "s" | "d"]
      const neighborIds = adjacency.get(currentId) ?? []
      let best: { id: string; score: number } | null = null
      for (const nid of neighborIds) {
        const n = positions.get(nid)
        if (!n) continue
        const dx = n.x - current.x
        const dy = n.y - current.y
        const len = Math.hypot(dx, dy) || 1
        const score = (dx / len) * dir.x + (dy / len) * dir.y
        if (score > 0.3 && (!best || score > best.score)) best = { id: nid, score }
      }
      if (best) selectStar(best.id)
      else if (!selectedId) selectStar("root0")
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedId, positions, adjacency])

  function toggleAcquired(starId: string) {
    setProgress((prev) => {
      const cur = prev[starId] ?? { acquired: false, logs: [] }
      return { ...prev, [starId]: { ...cur, acquired: !cur.acquired } }
    })
  }

  function addLog(starId: string, type: "study" | "review", text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setProgress((prev) => {
      const cur = prev[starId] ?? { acquired: false, logs: [] }
      const entry: LogEntry = { date: formatDateYMD(new Date()), type, text: trimmed }
      return { ...prev, [starId]: { acquired: true, logs: [...cur.logs, entry] } }
    })
  }

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startCamX: camera.x,
      startCamY: camera.y,
      moved: false,
    }
    setSmooth(false)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true
    if (!dragRef.current.moved) return
    const rawX = dragRef.current.startCamX - dx / camera.zoom
    const rawY = dragRef.current.startCamY - dy / camera.zoom
    setCamera((c) => ({
      ...c,
      x: rubberBand(rawX, bounds.minX, bounds.maxX),
      y: rubberBand(rawY, bounds.minY, bounds.maxY),
    }))
  }
  function onPointerUp() {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    setSmooth(true)
    setCamera((c) => ({
      ...c,
      x: clamp(c.x, bounds.minX, bounds.maxX),
      y: clamp(c.y, bounds.minY, bounds.maxY),
    }))
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    setSmooth(false)
    const delta = -e.deltaY * 0.0015
    setCamera((c) => ({ ...c, zoom: rubberBand(c.zoom + delta, ZOOM_MIN, ZOOM_MAX, 0.4) }))
    window.clearTimeout(wheelTimeout.current)
    wheelTimeout.current = window.setTimeout(() => {
      setSmooth(true)
      setCamera((c) => ({ ...c, zoom: clamp(c.zoom, ZOOM_MIN, ZOOM_MAX) }))
    }, 220)
  }

  const worldTransform = {
    left: stage.width / 2 - camera.x * camera.zoom,
    top: stage.height / 2 - camera.y * camera.zoom,
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `appraiser-progress-${formatDateYMD(new Date()).replaceAll("/", "-")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  function handleImportFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (confirm("불러온 파일로 현재 진행상황을 덮어쓸까요?")) setProgress(parsed)
      } catch {
        alert("올바른 JSON 파일이 아닙니다.")
      }
    }
    reader.readAsText(file)
  }
  function handleReset() {
    if (confirm("모든 습득 기록과 학습 로그를 초기화할까요? 되돌릴 수 없습니다.")) {
      setProgress({})
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const selectedNode = selectedId ? positions.get(selectedId) : null
  const selectedSection = selectedNode ? sections[selectedNode.section] : null
  const isDesktop = stage.width >= 768

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060c] text-white font-[family-name:var(--font-orbit)]">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: "url(/images/study/universe-background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: `calc(50% - ${camera.x * 0.03}px) calc(50% - ${camera.y * 0.03}px)`,
          filter: "brightness(0.4)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)" }}
      />
      <StarfieldCanvas />

      <Link
        href="/"
        className="fixed left-4 top-4 z-50 flex h-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/80 px-4 font-mono text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:border-accent hover:text-accent md:left-8 md:top-8"
      >
        ← BACK
      </Link>

      <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-neutral-700 bg-neutral-900/80 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/80 backdrop-blur-md md:top-8">
        습득 {Object.values(progress).filter((p) => p?.acquired).length} / {nodeList.length}
      </div>

      <div className="fixed right-4 top-4 z-50 flex gap-2 md:right-8 md:top-8">
        <button onClick={handleExport} className="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-2 font-mono text-xs text-white/80 backdrop-blur-md transition-colors hover:border-accent hover:text-accent">
          내보내기
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-2 font-mono text-xs text-white/80 backdrop-blur-md transition-colors hover:border-accent hover:text-accent">
          불러오기
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImportFile(file)
            e.target.value = ""
          }}
        />
        <button onClick={handleReset} className="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-2 font-mono text-xs text-white/50 backdrop-blur-md transition-colors hover:border-red-400 hover:text-red-400">
          초기화
        </button>
      </div>

      <div
        className="relative z-10 h-screen w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            transform: `translate(${worldTransform.left}px, ${worldTransform.top}px) scale(${camera.zoom})`,
            transformOrigin: "0 0",
            transition: smooth ? "transform 0.45s cubic-bezier(0.16,1,0.3,1)" : "none",
          }}
        >
          <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
            {edges.map(([a, b], i) => {
              const na = positions.get(a)
              const nb = positions.get(b)
              if (!na || !nb) return null
              const bothAcquired = progress[a]?.acquired && progress[b]?.acquired
              return (
                <line
                  key={i}
                  x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={bothAcquired ? "rgba(255,212,121,0.6)" : "rgba(255,255,255,0.16)"}
                  strokeWidth={1.2}
                />
              )
            })}
          </svg>

          {nodeList.map((n) => {
            const acquired = Boolean(progress[n.id]?.acquired)
            const isRoot = n.id === "root0"
            const isSelected = selectedId === n.id
            const glowing = isRoot || acquired
            const delay = (n.id.charCodeAt(0) + n.id.charCodeAt(n.id.length - 1)) % 30
            const rgb = isRoot ? "255,255,255" : acquired ? "255,214,140" : "170,195,255"
            const size = isRoot ? 20 : 14

            return (
              <div key={n.id} className="absolute" style={{ left: n.x, top: n.y }}>
                {/* 선택 효과: 링 대신, 별보다 먼저 그려서 항상 뒤에 깔리는
                    부드러운 발광 블롭. 커졌다 작아지며 은은하게 빛남 */}
                {isSelected && (
                  <span
                    aria-hidden
                    className="select-glow pointer-events-none absolute left-1/2 top-1/2 rounded-full"
                    style={{
                      width: size * 2.6,
                      height: size * 2.6,
                      background: `radial-gradient(circle, rgba(255,255,255,0.9), rgba(${rgb},0.55) 55%, transparent 75%)`,
                    }}
                  />
                )}

<button
                  onClick={() => selectStar(n.id)}
                  aria-label={n.name}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-shadow ${
                    glowing ? "star-pulse" : "star-twinkle"
                  }`}
                  style={{
                    width: size,
                    height: size,
                    background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(${rgb},0.9) 55%, rgba(${rgb},0.35) 100%)`,
                    boxShadow: glowing
                      ? `0 0 6px 2px rgba(255,255,255,0.9), 0 0 18px 6px rgba(${rgb},0.55), 0 0 34px 14px rgba(${rgb},0.22)`
                      : `0 0 4px 1px rgba(${rgb},0.35)`,
                    ["--twinkle-duration" as string]: `${3 + (delay % 3)}s`,
                    animationDelay: `${delay * 0.1}s`,
                  }}
                />

                {/* 십자선 대신: 안쪽이 오목한 4각 별(표창) 모양 글린트.
                    lucide-react의 Sparkle 아이콘을 채워서(fill) 사용 —
                    static translate를 쓰지 않고 margin으로 중앙정렬해서,
                    애니메이션의 scale/rotate가 위치값을 덮어쓰는 문제를 피함 */}
                {(() => {
                  const glintSize = glowing ? size * 3.2 : size * 2.2
                  return (
                    <Sparkle
                      aria-hidden
                      fill={`rgba(${rgb},1)`}
                      stroke="none"
                      className="sparkle-glint pointer-events-none absolute left-1/2 top-1/2"
                      style={{
                        width: glintSize,
                        height: glintSize,
                        marginLeft: -glintSize / 2,
                        marginTop: -glintSize / 2,
                        filter: `drop-shadow(0 0 3px rgba(${rgb},0.9)) drop-shadow(0 0 8px rgba(${rgb},0.5))`,
                        animationDuration: `${3.4 + (delay % 3)}s`,
                        animationDelay: `${delay * 0.15}s`,
                        opacity: glowing ? undefined : 0.7,
                      }}
                    />
                  )
                })()}
                <p className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-[11px] leading-none text-white/80">
                  {n.name}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {selectedNode && (
        <div
          className="fixed z-50 h-[70vh] w-[92vw] max-w-sm overflow-y-auto rounded-2xl border border-neutral-700 bg-neutral-950/90 p-6 shadow-2xl backdrop-blur-md"
          style={
            isDesktop
              ? { top: "50%", right: "4rem", transform: "translateY(-50%)" }
              : { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
          }
        >
          <button onClick={() => setSelectedId(null)} className="absolute right-4 top-4 text-white/50 transition-colors hover:text-white">
            ✕
          </button>

          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-accent">{selectedSection?.title}</p>
          <h2 className="mt-1 text-xl font-bold leading-snug">{selectedNode.name}</h2>

          <button
            onClick={() => selectedId && toggleAcquired(selectedId)}
            className={`mt-4 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              selectedId && progress[selectedId]?.acquired
                ? "border-amber-300 bg-amber-300/10 text-amber-300"
                : "border-neutral-700 text-white/60 hover:border-white/40"
            }`}
          >
            {selectedId && progress[selectedId]?.acquired ? "습득 완료" : "미습득"}
          </button>

          <div className="mt-8">
            <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-white/50">학습 내용</p>
            <div className="flex gap-2">
              <input
                value={studyInput}
                onChange={(e) => setStudyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedId) {
                    addLog(selectedId, "study", studyInput)
                    setStudyInput("")
                  }
                }}
                placeholder="오늘의 학습 내용을 적어주세요"
                className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
              />
              <button
                onClick={() => {
                  if (selectedId) {
                    addLog(selectedId, "study", studyInput)
                    setStudyInput("")
                  }
                }}
                className="shrink-0 rounded border border-neutral-700 px-3 font-mono text-xs text-white/70 transition-colors hover:border-accent hover:text-accent"
              >
                확인
              </button>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-white/50">복습 내용</p>
            <div className="flex gap-2">
              <input
                value={reviewInput}
                onChange={(e) => setReviewInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedId) {
                    addLog(selectedId, "review", reviewInput)
                    setReviewInput("")
                  }
                }}
                placeholder="오늘의 복습 내용을 적어주세요"
                className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
              />
              <button
                onClick={() => {
                  if (selectedId) {
                    addLog(selectedId, "review", reviewInput)
                    setReviewInput("")
                  }
                }}
                className="shrink-0 rounded border border-neutral-700 px-3 font-mono text-xs text-white/70 transition-colors hover:border-accent hover:text-accent"
              >
                확인
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {selectedId &&
              (progress[selectedId]?.logs ?? [])
                .slice()
                .reverse()
                .map((log, i) => (
                  <div key={i} className="rounded border border-neutral-800 bg-neutral-900/60 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${
                          log.type === "study" ? "bg-sky-400/20 text-sky-300" : "bg-emerald-400/20 text-emerald-300"
                        }`}
                      >
                        {log.type === "study" ? "학습" : "복습"}
                      </span>
                      <span className="font-mono text-[0.65rem] text-white/40">{log.date}</span>
                    </div>
                    <p className="text-sm text-white/85">{log.text}</p>
                  </div>
                ))}
            {selectedId && (progress[selectedId]?.logs?.length ?? 0) === 0 && (
              <p className="text-sm text-white/30">아직 기록이 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}