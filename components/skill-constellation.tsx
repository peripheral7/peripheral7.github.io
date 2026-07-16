"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { MoreVertical } from "lucide-react"
import { skillTree, sections, layoutTree } from "@/content/appraiser/skilltree"
import defaultProgress from "@/content/appraiser/progress.default.json"

type LogEntry = { date: string; type: "study" | "review"; text: string }
type StarProgress = { acquired: boolean; logs: LogEntry[]; reinforced?: boolean }
type ProgressMap = Record<string, StarProgress>

const STORAGE_KEY = "appraiser-skilltree-progress-v1"
const FOCUS_ZOOM = 1.6
const DEFAULT_ZOOM = 0.5
const ZOOM_MIN = 0.4
const ZOOM_MAX = 2.4
const PAN_MARGIN = 260
const RESISTANCE = 0.35
const X_SPACING = 190
const Y_SPACING = 190
const MOBILE_BP = 768
const NARROW_BP = 1300
const REINFORCE_GAP_DAYS = 7
const TITLE_WRAP_LEN = 7

function formatDateYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}/${m}/${day}`
}
function parseYMD(s: string) {
  const [y, m, d] = s.split("/").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}
function rubberBand(value: number, min: number, max: number, resistance = RESISTANCE) {
  if (value < min) return min - (min - value) * resistance
  if (value > max) return max + (value - max) * resistance
  return value
}

// 스페이스 포함 7자 초과 시 공백 근처에서 두 줄로 분리
function wrapLabel(name: string): [string, string?] {
  if (name.length <= TITLE_WRAP_LEN) return [name]
  const mid = Math.ceil(name.length / 2)
  let breakIdx = -1
  for (let offset = 0; offset < name.length; offset++) {
    const left = mid - offset
    const right = mid + offset
    if (name[left] === " ") { breakIdx = left; break }
    if (name[right] === " ") { breakIdx = right; break }
  }
  if (breakIdx === -1) breakIdx = mid
  return [name.slice(0, breakIdx).trim(), name.slice(breakIdx).trim()]
}

// 얇고 날카로운 4각 별(스파클) — 직선으로만 이루어져 각이 예리함
function StarGlyph({
  size,
  fill,
  className,
  style,
}: {
  size: number
  fill: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style}>
      <path d="M12 0 L13.6 10.4 L24 12 L13.6 13.6 L12 24 L10.4 13.6 L0 12 L10.4 10.4 Z" fill={fill} />
    </svg>
  )
}

type Tier = { rgb: string; fillAlpha: number; ambientAlpha: number; glowClass: string; shadow: string }

function getTier(isRoot: boolean, acquired: boolean, reinforced: boolean): Tier {
  if (isRoot) {
    return {
      rgb: "255,255,255",
      fillAlpha: 1,
      ambientAlpha: 0.6,
      glowClass: "star-pulse",
      shadow: "drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 10px rgba(255,255,255,0.6))",
    }
  }
  if (reinforced) {
    return {
      rgb: "255,214,140",
      fillAlpha: 1,
      ambientAlpha: 0.55,
      glowClass: "star-pulse",
      shadow: "drop-shadow(0 0 3px rgba(255,214,140,0.9)) drop-shadow(0 0 10px rgba(255,214,140,0.6))",
    }
  }
  if (acquired) {
    return {
      rgb: "225,205,175",
      fillAlpha: 0.55,
      ambientAlpha: 0.3,
      glowClass: "star-twinkle",
      shadow: "drop-shadow(0 0 2px rgba(225,205,175,0.5))",
    }
  }
  return {
    rgb: "150,160,180",
    fillAlpha: 0.3,
    ambientAlpha: 0.18,
    glowClass: "star-twinkle",
    shadow: "drop-shadow(0 0 1px rgba(150,160,180,0.25))",
  }
}

type LayoutMode = "mobile" | "narrow" | "wide"

function getFocal(mode: LayoutMode, hasSelection: boolean, width: number, height: number) {
  if (!hasSelection) return { x: width / 2, y: height / 2 }
  if (mode === "mobile") return { x: width / 2, y: height * 0.75 }
  if (mode === "narrow") return { x: width * 0.25, y: height / 2 }
  return { x: width / 2, y: height / 2 }
}

export function SkillConstellation() {
  const { positions, edges } = useMemo(
    () => layoutTree(skillTree, { xSpacing: X_SPACING, ySpacing: Y_SPACING }),
    [],
  )
  const nodeList = useMemo(() => [...positions.entries()].map(([id, p]) => ({ id, ...p })), [positions])

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

  // edges는 [부모id, 자식id] 방향쌍이므로 그대로 부모/자식 맵을 만들 수 있습니다
  const childrenOf = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const [p, c] of edges) {
      if (!map.has(p)) map.set(p, [])
      map.get(p)!.push(c)
    }
    return map
  }, [edges])
  const parentOf = useMemo(() => new Map(edges.map(([p, c]) => [c, p])), [edges])

  // 각 노드 아래 하위트리가 뻗어나간 최대 깊이 (아래 방향키 우선순위 계산용)
  const subtreeDepth = useMemo(() => {
    const map = new Map<string, number>()
    function compute(id: string): number {
      if (map.has(id)) return map.get(id)!
      const kids = childrenOf.get(id) ?? []
      const d = kids.length === 0 ? 0 : 1 + Math.max(...kids.map(compute))
      map.set(id, d)
      return d
    }
    compute("root0")
    return map
  }, [childrenOf])

  // 루트로부터의 실제 깊이 (3D 기울임 효과 계산용)
  const depthOf = useMemo(() => {
    const map = new Map<string, number>([["root0", 0]])
    const queue = ["root0"]
    while (queue.length) {
      const id = queue.shift()!
      const d = map.get(id)!
      for (const child of childrenOf.get(id) ?? []) {
        map.set(child, d + 1)
        queue.push(child)
      }
    }
    return map
  }, [childrenOf])

  const [camera, setCamera] = useState({ x: bounds.centerX, y: bounds.centerY, zoom: DEFAULT_ZOOM })
  const [smooth, setSmooth] = useState(true)
  const [stage, setStage] = useState({ width: 1200, height: 800 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressMap>({})
  const [loaded, setLoaded] = useState(false)
  const [reviewInput, setReviewInput] = useState("")
  const [toolsOpen, setToolsOpen] = useState(false)

  const dragRef = useRef({ active: false, startX: 0, startY: 0, startCamX: 0, startCamY: 0, moved: false })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ active: boolean; startDist: number; startZoom: number } | null>(null)
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

  const layoutMode: LayoutMode =
    stage.width < MOBILE_BP ? "mobile" : stage.width < NARROW_BP ? "narrow" : "wide"

  function selectStar(id: string) {
    setSelectedId(id)
    setReviewInput("")
  }

  useEffect(() => {
    if (!selectedId) return
    const n = positions.get(selectedId)
    if (!n) return
    setSmooth(true)
    setCamera({ x: n.x, y: n.y, zoom: FOCUS_ZOOM })
  }, [selectedId, positions])

  // 방향키 트리 이동
  // ↑ : 부모로 (트리 구조상 유일하므로 모호함 없음)
  // ↓ : 자식 중 하위트리가 가장 길게 뻗은 방향 (동률이면 좌측)
  // ←/→ : 같은 부모를 공유하는 형제 사이에서만 이동 (깊이가 항상 같아 상하 이동 없음)
  useEffect(() => {
    function isTypingTarget(el: EventTarget | null) {
      const tag = (el as HTMLElement)?.tagName
      return tag === "INPUT" || tag === "TEXTAREA"
    }
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return
      const key = e.key
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) return
      e.preventDefault()

      const current = selectedId ?? "root0"
      if (!selectedId) {
        selectStar("root0")
        return
      }

      if (key === "ArrowUp") {
        const parent = parentOf.get(current)
        if (parent) selectStar(parent)
        return
      }

      if (key === "ArrowDown") {
        const kids = childrenOf.get(current) ?? []
        if (kids.length === 0) return
        let best = kids[0]
        let bestDepth = subtreeDepth.get(best) ?? 0
        let bestX = positions.get(best)?.x ?? 0
        for (const c of kids.slice(1)) {
          const d = subtreeDepth.get(c) ?? 0
          const x = positions.get(c)?.x ?? 0
          if (d > bestDepth || (d === bestDepth && x < bestX)) {
            best = c
            bestDepth = d
            bestX = x
          }
        }
        selectStar(best)
        return
      }

      // ArrowLeft / ArrowRight
      const parent = parentOf.get(current)
      if (!parent) return
      const siblings = (childrenOf.get(parent) ?? [])
        .slice()
        .sort((a, b) => (positions.get(a)?.x ?? 0) - (positions.get(b)?.x ?? 0))
      const idx = siblings.indexOf(current)
      if (key === "ArrowLeft" && idx > 0) selectStar(siblings[idx - 1])
      if (key === "ArrowRight" && idx < siblings.length - 1) selectStar(siblings[idx + 1])
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedId, positions, parentOf, childrenOf, subtreeDepth])

  function toggleAcquired(starId: string) {
    setProgress((prev) => {
      const cur = prev[starId] ?? { acquired: false, logs: [] }
      return { ...prev, [starId]: { ...cur, acquired: !cur.acquired } }
    })
  }

  // 복습 기록만 저장. 직전 기록과 7일 이상 간격이면 이후 영구적으로 진하게 빛남(reinforced)
  function addLog(starId: string, text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setProgress((prev) => {
      const cur = prev[starId] ?? { acquired: false, logs: [], reinforced: false }
      const now = new Date()
      let reinforced = cur.reinforced ?? false
      if (cur.logs.length > 0) {
        const lastDate = parseYMD(cur.logs[cur.logs.length - 1].date)
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / 86400000)
        if (diffDays >= REINFORCE_GAP_DAYS) reinforced = true
      }
      const entry: LogEntry = { date: formatDateYMD(now), type: "review", text: trimmed }
      return { ...prev, [starId]: { acquired: true, logs: [...cur.logs, entry], reinforced } }
    })
  }

  function onPointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setSmooth(false)
    if (pointers.current.size === 1) {
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startCamX: camera.x,
        startCamY: camera.y,
        moved: false,
      }
    } else if (pointers.current.size === 2) {
      dragRef.current.active = false
      const [p1, p2] = [...pointers.current.values()]
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1
      pinchRef.current = { active: true, startDist: dist, startZoom: camera.zoom }
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pinchRef.current?.active && pointers.current.size >= 2) {
      const [p1, p2] = [...pointers.current.values()]
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1
      const ratio = dist / pinchRef.current.startDist
      setCamera((c) => ({ ...c, zoom: rubberBand(pinchRef.current!.startZoom * ratio, ZOOM_MIN, ZOOM_MAX, 0.4) }))
      return
    }
    if (!dragRef.current.active || pointers.current.size !== 1) return
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
  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2 && pinchRef.current?.active) {
      pinchRef.current = null
      setSmooth(true)
      setCamera((c) => ({ ...c, zoom: clamp(c.zoom, ZOOM_MIN, ZOOM_MAX) }))
    }
    if (pointers.current.size === 1) {
      const [remaining] = [...pointers.current.values()]
      dragRef.current = {
        active: true,
        startX: remaining.x,
        startY: remaining.y,
        startCamX: camera.x,
        startCamY: camera.y,
        moved: false,
      }
    } else if (pointers.current.size === 0) {
      dragRef.current.active = false
      setSmooth(true)
      setCamera((c) => ({
        ...c,
        x: clamp(c.x, bounds.minX, bounds.maxX),
        y: clamp(c.y, bounds.minY, bounds.maxY),
      }))
    }
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

  const focal = getFocal(layoutMode, Boolean(selectedId), stage.width, stage.height)
  const worldTransform = {
    left: focal.x - camera.x * camera.zoom,
    top: focal.y - camera.y * camera.zoom,
  }

  // 별자리 선택 시 "타고 올라가는" 느낌의 입체 기울임 — 깊이가 깊을수록 더 크게 기울어짐
  const tiltDeg = selectedId ? Math.min((depthOf.get(selectedId) ?? 0) * 1.1, 14) : 0

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

  let panelClass = ""
  let panelStyle: React.CSSProperties = {}
  if (layoutMode === "mobile") {
    panelClass = "fixed inset-x-0 top-0 h-[50vh] w-full rounded-b-2xl"
  } else if (layoutMode === "narrow") {
    panelClass = "fixed inset-y-0 right-0 h-full w-1/2 rounded-l-2xl"
  } else {
    panelClass = "fixed h-[70vh] w-[92vw] max-w-sm rounded-2xl"
    panelStyle = { top: "50%", right: "4rem", transform: "translateY(-50%)" }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060c] text-white font-[family-name:var(--font-hahmlet)]">
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

      <Link
        href="/"
        className="fixed left-4 top-4 z-50 flex h-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/80 px-4 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:border-accent hover:text-accent md:left-8 md:top-8"
      >
        ← BACK
      </Link>

      <div className="fixed left-1/2 top-4 z-40 -translate-x-1/2 rounded-full border border-neutral-700 bg-neutral-900/80 px-4 py-2 text-xs uppercase tracking-widest text-white/80 backdrop-blur-md md:top-8">
        습득 {Object.values(progress).filter((p) => p?.acquired).length} / {nodeList.length}
      </div>

      <div className="fixed right-4 top-4 z-50 md:right-8 md:top-8">
        <button
          onClick={() => setToolsOpen((o) => !o)}
          aria-label="메뉴 열기"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/80 text-white/80 backdrop-blur-md transition-colors hover:border-accent hover:text-accent"
        >
          <MoreVertical size={18} />
        </button>

        {toolsOpen && (
          <div className="absolute right-0 top-12 flex w-40 flex-col gap-1 rounded-2xl border border-neutral-700 bg-neutral-900/95 p-2 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => {
                handleExport()
                setToolsOpen(false)
              }}
              className="rounded-lg px-3 py-2 text-left text-xs text-white/80 transition-colors hover:bg-neutral-800 hover:text-accent"
            >
              내보내기
            </button>
            <button
              onClick={() => {
                fileInputRef.current?.click()
                setToolsOpen(false)
              }}
              className="rounded-lg px-3 py-2 text-left text-xs text-white/80 transition-colors hover:bg-neutral-800 hover:text-accent"
            >
              불러오기
            </button>
            <button
              onClick={() => {
                handleReset()
                setToolsOpen(false)
              }}
              className="rounded-lg px-3 py-2 text-left text-xs text-white/50 transition-colors hover:bg-neutral-800 hover:text-red-400"
            >
              초기화
            </button>
          </div>
        )}

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
      </div>

      <div
        className="relative z-10 h-screen w-full touch-none select-none"
        style={{ perspective: "1400px" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            transform: `translate(${worldTransform.left}px, ${worldTransform.top}px) scale(${camera.zoom}) rotateX(${-tiltDeg}deg)`,
            transformOrigin: "center bottom",
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
            const st = progress[n.id]
            const isRoot = n.id === "root0"
            const isSelected = selectedId === n.id
            const acquired = Boolean(st?.acquired)
            const reinforced = Boolean(st?.reinforced)
            const tier = getTier(isRoot, acquired, reinforced)
            const delay = (n.id.charCodeAt(0) + n.id.charCodeAt(n.id.length - 1)) % 30
            const size = isRoot ? 26 : 18
            const hitSize = size + 14
            const [line1, line2] = wrapLabel(n.name)

            return (
              <div key={n.id} className="absolute" style={{ left: n.x, top: n.y }}>
                {isSelected && (
                  <span
                    aria-hidden
                    className="select-glow pointer-events-none absolute rounded-full"
                    style={{
                      left: 0,
                      top: 0,
                      width: size * 2.6,
                      height: size * 2.6,
                      marginLeft: -(size * 2.6) / 2,
                      marginTop: -(size * 2.6) / 2,
                      background: `radial-gradient(circle, rgba(255,255,255,0.85), rgba(${tier.rgb},0.5) 55%, transparent 75%)`,
                    }}
                  />
                )}

                <span
                  aria-hidden
                  className={`pointer-events-none absolute rounded-full ${
                    tier.glowClass === "star-pulse" ? "ambient-pulse" : "ambient-twinkle"
                  }`}
                  style={{
                    left: 0,
                    top: 0,
                    width: size * 1.8,
                    height: size * 1.8,
                    marginLeft: -(size * 1.8) / 2,
                    marginTop: -(size * 1.8) / 2,
                    background: `radial-gradient(circle, rgba(${tier.rgb},${tier.ambientAlpha}), transparent 70%)`,
                    filter: "blur(1px)",
                  }}
                />

                <button
                  onClick={() => selectStar(n.id)}
                  aria-label={n.name}
                  className="absolute flex items-center justify-center rounded-full transition-transform hover:scale-110"
                  style={{
                    left: 0,
                    top: 0,
                    width: hitSize,
                    height: hitSize,
                    marginLeft: -hitSize / 2,
                    marginTop: -hitSize / 2,
                  }}
                >
                  <StarGlyph
                    size={size}
                    fill={`rgba(${tier.rgb},${tier.fillAlpha})`}
                    className={tier.glowClass}
                    style={{
                      filter: tier.shadow,
                      animationDelay: `${delay * 0.1}s`,
                      ["--twinkle-duration" as string]: `${3 + (delay % 3)}s`,
                    }}
                  />
                </button>

                <p
                  className="pointer-events-none absolute text-center text-[11px] leading-tight text-white/80"
                  style={{
                    left: 0,
                    top: size,
                    transform: "translateX(-50%)",
                    whiteSpace: line2 ? "normal" : "nowrap",
                    maxWidth: line2 ? 88 : undefined,
                  }}
                >
                  {line1}
                  {line2 && (
                    <>
                      <br />
                      {line2}
                    </>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {selectedNode && (
        <div
          className={`z-50 overflow-y-auto border border-neutral-700 bg-neutral-950/90 p-6 shadow-2xl backdrop-blur-md ${panelClass}`}
          style={panelStyle}
        >
          <button onClick={() => setSelectedId(null)} className="absolute right-4 top-4 text-white/50 transition-colors hover:text-white">
            ✕
          </button>

          <p className="text-[0.7rem] uppercase tracking-widest text-accent">{selectedSection?.title}</p>
          <h2 className="mt-1 text-xl font-bold leading-snug">{selectedNode.name}</h2>

          <button
            onClick={() => selectedId && toggleAcquired(selectedId)}
            className={`mt-4 rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
              selectedId && progress[selectedId]?.acquired
                ? "border-amber-300 bg-amber-300/10 text-amber-300"
                : "border-neutral-700 text-white/60 hover:border-white/40"
            }`}
          >
            {selectedId && progress[selectedId]?.acquired ? "습득 완료" : "미습득"}
          </button>

          <div className="mt-8">
            <p className="mb-2 text-[0.65rem] uppercase tracking-widest text-white/50">복습</p>
            <div className="flex gap-2">
              <input
                value={reviewInput}
                onChange={(e) => setReviewInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedId) {
                    addLog(selectedId, reviewInput)
                    setReviewInput("")
                  }
                }}
                placeholder="오늘 배운 것 중 잊지 않고 싶은 것"
                className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
              />
              <button
                onClick={() => {
                  if (selectedId) {
                    addLog(selectedId, reviewInput)
                    setReviewInput("")
                  }
                }}
                className="shrink-0 rounded border border-neutral-700 px-3 text-xs text-white/70 transition-colors hover:border-accent hover:text-accent"
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
                      <span className="rounded bg-emerald-400/20 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-widest text-emerald-300">
                        복습
                      </span>
                      <span className="text-[0.65rem] text-white/40">{log.date}</span>
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