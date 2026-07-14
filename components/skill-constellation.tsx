"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { appraiserSkillTree, sections } from "@/content/appraiser/skilltree"
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

function formatDateYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}/${m}/${day}`
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

// 범위를 벗어나면 저항이 걸려 조금만 밀리는 "고무줄" 효과
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
  const { nodes, edges } = appraiserSkillTree

  const bounds = useMemo(() => {
    const xs = nodes.map((n) => n.x)
    const ys = nodes.map((n) => n.y)
    return {
      minX: Math.min(...xs) - PAN_MARGIN,
      maxX: Math.max(...xs) + PAN_MARGIN,
      minY: Math.min(...ys) - PAN_MARGIN,
      maxY: Math.max(...ys) + PAN_MARGIN,
      centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
      centerY: (Math.min(...ys) + Math.max(...ys)) / 2,
    }
  }, [nodes])

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
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

  // 진행상황 로드/저장
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

  // 선택된 별로 카메라 자동 이동+확대
  useEffect(() => {
    if (!selectedId) return
    const n = nodeById.get(selectedId)
    if (!n) return
    setSmooth(true)
    setCamera({ x: n.x, y: n.y, zoom: FOCUS_ZOOM })
  }, [selectedId, nodeById])

  // WASD: 연결된 이웃 중 방향이 가장 잘 맞는 별로 이동
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
      const current = nodeById.get(currentId)
      if (!current) return
      const dir = DIR_VECTORS[key]
      const neighborIds = adjacency.get(currentId) ?? []
      let best: { id: string; score: number } | null = null
      for (const nid of neighborIds) {
        const n = nodeById.get(nid)
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
  }, [selectedId, nodeById, adjacency])

  function toggleAcquired(starId: string) {
    setProgress((prev) => {
      const cur = prev[starId] ?? { acquired: false, logs: [] }
      return { ...prev, [starId]: { ...cur, acquired: !cur.acquired } }
    })
  }

  // 내용을 저장하면 자동으로 습득 처리
  function addLog(starId: string, type: "study" | "review", text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setProgress((prev) => {
      const cur = prev[starId] ?? { acquired: false, logs: [] }
      const entry: LogEntry = { date: formatDateYMD(new Date()), type, text: trimmed }
      return { ...prev, [starId]: { acquired: true, logs: [...cur.logs, entry] } }
    })
  }

  // ── 드래그 팬 (고무줄 클램프) ────────────────────────────────
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

  // ── 휠 확대/축소 (고무줄 + 멈추면 튕겨 복귀) ──────────────────
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

  const selectedNode = selectedId ? nodeById.get(selectedId) : null
  const selectedSection = selectedNode ? sections[selectedNode.section] : null
  const isDesktop = stage.width >= 768

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-[#05060c] text-white font-[family-name:var(--font-orbit)]"
    >
      {/* 배경: 카메라 이동량의 3~5%만 따라가 "아주 조금만" 움직임 */}
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
        습득 {Object.values(progress).filter((p) => p?.acquired).length} / {nodes.length}
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

      {/* 드래그·휠 캡처 스테이지 */}
      <div
        className="relative z-10 h-screen w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        {/* 월드 컨테이너: 카메라값 하나로 전체를 이동/확대 (개별 좌표 재계산 불필요) */}
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
              const na = nodeById.get(a)
              const nb = nodeById.get(b)
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

          {nodes.map((n) => {
            const acquired = Boolean(progress[n.id]?.acquired)
            const isRoot = n.id === "root0"
            const isSelected = selectedId === n.id
            const delay = (n.id.charCodeAt(0) + n.id.charCodeAt(n.id.length - 1)) % 30
            return (
              <div key={n.id} className="absolute" style={{ left: n.x, top: n.y }}>
                {isSelected && (
                  <span
                    aria-hidden
                    className="select-ring pointer-events-none absolute left-0 top-0 h-5 w-5 rounded-full border-2 border-amber-300"
                  />
                )}
                <button
                  onClick={() => selectStar(n.id)}
                  aria-label={n.name}
                  className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
                    isRoot
                      ? "star-pulse bg-white shadow-[0_0_16px_6px_rgba(255,255,255,0.5)]"
                      : acquired
                        ? "star-pulse bg-amber-300 shadow-[0_0_12px_4px_rgba(255,212,121,0.55)]"
                        : "star-twinkle bg-slate-300/70"
                  }`}
                  style={{
                    width: isRoot ? 20 : 14,
                    height: isRoot ? 20 : 14,
                    ["--twinkle-duration" as string]: `${3 + (delay % 3)}s`,
                    animationDelay: `${delay * 0.1}s`,
                  }}
                />
                <p className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-[11px] leading-none text-white/80">
                  {n.name}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 플로팅 학습/복습 패널 — 중앙 근처, 위아래 안 붙음, 높이 70% */}
      {selectedNode && (
        <div
          className="fixed z-50 h-[70vh] w-[92vw] max-w-sm overflow-y-auto rounded-2xl border border-neutral-700 bg-neutral-950/90 p-6 shadow-2xl backdrop-blur-md"
          style={{
            left: "50%",
            top: "50%",
            transform: isDesktop ? "translate(calc(-50% + 260px), -50%)" : "translate(-50%, -50%)",
          }}
        >
          <button onClick={() => setSelectedId(null)} className="absolute right-4 top-4 text-white/50 transition-colors hover:text-white">
            ✕
          </button>

          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-accent">{selectedSection?.title}</p>
          <h2 className="mt-1 text-xl font-bold leading-snug">{selectedNode.name}</h2>

          <button
            onClick={() => toggleAcquired(selectedNode.id)}
            className={`mt-4 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              progress[selectedNode.id]?.acquired
                ? "border-amber-300 bg-amber-300/10 text-amber-300"
                : "border-neutral-700 text-white/60 hover:border-white/40"
            }`}
          >
            {progress[selectedNode.id]?.acquired ? "습득 완료" : "미습득"}
          </button>

          <div className="mt-8">
            <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-white/50">학습 내용</p>
            <div className="flex gap-2">
              <input
                value={studyInput}
                onChange={(e) => setStudyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addLog(selectedNode.id, "study", studyInput)
                    setStudyInput("")
                  }
                }}
                placeholder="오늘의 학습 내용을 적어주세요"
                className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
              />
              <button
                onClick={() => {
                  addLog(selectedNode.id, "study", studyInput)
                  setStudyInput("")
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
                  if (e.key === "Enter") {
                    addLog(selectedNode.id, "review", reviewInput)
                    setReviewInput("")
                  }
                }}
                placeholder="오늘의 복습 내용을 적어주세요"
                className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
              />
              <button
                onClick={() => {
                  addLog(selectedNode.id, "review", reviewInput)
                  setReviewInput("")
                }}
                className="shrink-0 rounded border border-neutral-700 px-3 font-mono text-xs text-white/70 transition-colors hover:border-accent hover:text-accent"
              >
                확인
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {(progress[selectedNode.id]?.logs ?? [])
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
            {(progress[selectedNode.id]?.logs?.length ?? 0) === 0 && (
              <p className="text-sm text-white/30">아직 기록이 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}