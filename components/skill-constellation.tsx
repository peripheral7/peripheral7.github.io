"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { MoreVertical } from "lucide-react"
import { skillTree, sections, layoutTree } from "@/content/appraiser/skilltree"
import defaultProgress from "@/content/appraiser/progress.default.json"

type LogEntry = {
  date: string
  type: "study" | "review"
  text: string
}

type StarProgress = {
  acquired: boolean
  logs: LogEntry[]
  reinforced?: boolean
}

type ProgressMap = Record<string, StarProgress>
type LayoutMode = "mobile" | "narrow" | "wide"

const STORAGE_KEY = "appraiser-skilltree-progress-v1"

const ZOOM_MIN = 0.2
const ZOOM_MAX = 2.0
const FOCUS_ZOOM = ZOOM_MAX
const DEFAULT_ZOOM = 1.0
const PAN_MARGIN = 320
const RESISTANCE = 0.35

// 방사형 트리의 반지름 단계 간격
const X_SPACING = 220
const Y_SPACING = 220

const WIDE_PANEL_RIGHT = 64
const WIDE_PANEL_TOP_BOTTOM = 64

// 모바일/태블릿 패널의 화면 여백 비율 (10%)
const COMPACT_PANEL_MARGIN = "10%"

const MOBILE_BP = 768
const NARROW_BP = 1300
const REINFORCE_GAP_DAYS = 7
const TITLE_WRAP_LEN = 8

// 선택 후 패널이 자리잡은 뒤 입력창에 포커스를 주기까지의 지연(ms)
const FOCUS_DELAY_MS = 260

// 배경 오버스캔 및 패럴랙스 오프셋 상한 (드래그 시 검은 틈 방지)
const BG_OVERSCAN = 100
const BG_PARALLAX = 0.025
const BG_OFFSET_MAX = 70

function formatDateYMD(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}/${month}/${day}`
}

function parseYMD(value: string) {
  const [year, month, day] = value.split("/").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function rubberBand(
  value: number,
  min: number,
  max: number,
  resistance = RESISTANCE,
) {
  if (value < min) return min - (min - value) * resistance
  if (value > max) return max + (value - max) * resistance

  return value
}

function wrapLabel(name: string): [string, string?] {
  if (name.length <= TITLE_WRAP_LEN) return [name]

  const center = Math.ceil(name.length / 2)
  let breakIndex = -1

  for (let offset = 0; offset < name.length; offset += 1) {
    const left = center - offset
    const right = center + offset

    if (name[left] === " ") {
      breakIndex = left
      break
    }

    if (name[right] === " ") {
      breakIndex = right
      break
    }
  }

  if (breakIndex === -1) breakIndex = center

  return [
    name.slice(0, breakIndex).trim(),
    name.slice(breakIndex).trim(),
  ]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function renderMarkdown(text: string) {
  let html = escapeHtml(text)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>")
  html = html.replace(
    /`(.+?)`/g,
    '<code class="rounded bg-white/10 px-1 py-0.5 text-[0.9em]">$1</code>',
  )
  html = html.replace(/\n/g, "<br/>")
  return html
}

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
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden
    >
      <path
        d="M12 0 L13.65 10.35 L24 12 L13.65 13.65 L12 24 L10.35 13.65 L0 12 L10.35 10.35 Z"
        fill={fill}
      />
    </svg>
  )
}

type Tier = {
  rgb: string
  fillAlpha: number
  shadow: string
}

function getTier(
  isRoot: boolean,
  acquired: boolean,
  reinforced: boolean,
  hasLogs: boolean,
): Tier {
  if (isRoot) {
    return {
      rgb: "255,255,255",
      fillAlpha: 1,
      shadow:
        "drop-shadow(0 0 4px rgba(255,255,255,0.9)) drop-shadow(0 0 12px rgba(255,255,255,0.55))",
    }
  }

  if (reinforced) {
    return {
      rgb: "255,214,140",
      fillAlpha: 1,
      shadow:
        "drop-shadow(0 0 4px rgba(255,214,140,0.95)) drop-shadow(0 0 14px rgba(255,214,140,0.72))",
    }
  }

  if (hasLogs) {
    return {
      rgb: "255,224,168",
      fillAlpha: 0.92,
      shadow:
        "drop-shadow(0 0 3px rgba(255,224,168,0.82)) drop-shadow(0 0 10px rgba(255,224,168,0.52))",
    }
  }

  if (acquired) {
    return {
      rgb: "225,205,175",
      fillAlpha: 0.65,
      shadow: "drop-shadow(0 0 2px rgba(225,205,175,0.36))",
    }
  }

  return {
    rgb: "150,160,180",
    fillAlpha: 0.38,
    shadow: "drop-shadow(0 0 1px rgba(150,160,180,0.2))",
  }
}

function getFocal(
  _mode: LayoutMode,
  hasSelection: boolean,
  width: number,
  height: number,
) {
  if (!hasSelection) {
    return {
      x: width / 2,
      y: height / 2,
    }
  }

  return {
    x: width / 2,
    y: height * 0.6,
  }
}

// 선택된 별과 동일한 강도의 흰색 발광 필터 (별/엣지 공용, 기존보다 조금 더 진하게)
const SELECTED_GLOW_FILTER =
  "drop-shadow(0 0 6px rgba(255,255,255,0.98)) drop-shadow(0 0 20px rgba(255,255,255,0.72)) drop-shadow(0 0 34px rgba(255,255,255,0.34))"

export function SkillConstellation() {
  const { positions, edges } = useMemo(
    () =>
      layoutTree(skillTree, {
        xSpacing: X_SPACING,
        ySpacing: Y_SPACING,
      }),
    [],
  )

  const nodeList = useMemo(
    () =>
      [...positions.entries()].map(([id, position]) => ({
        id,
        ...position,
      })),
    [positions],
  )

  const bounds = useMemo(() => {
    const xs = nodeList.map((node) => node.x)
    const ys = nodeList.map((node) => node.y)

    return {
      minX: Math.min(...xs) - PAN_MARGIN,
      maxX: Math.max(...xs) + PAN_MARGIN,
      minY: Math.min(...ys) - PAN_MARGIN,
      maxY: Math.max(...ys) + PAN_MARGIN,
      centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
      centerY: (Math.min(...ys) + Math.max(...ys)) / 2,
    }
  }, [nodeList])

  const [camera, setCamera] = useState({
    x: bounds.centerX,
    y: bounds.centerY,
    zoom: DEFAULT_ZOOM,
  })

  const [smooth, setSmooth] = useState(true)
  const [stage, setStage] = useState({ width: 1200, height: 800 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressMap>({})
  const [loaded, setLoaded] = useState(false)
  const [reviewInput, setReviewInput] = useState("")
  const [toolsOpen, setToolsOpen] = useState(false)

  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startCamX: 0,
    startCamY: 0,
    moved: false,
  })

  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{
    active: boolean
    startDistance: number
    startZoom: number
  } | null>(null)

  const wheelTimeout = useRef<number | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const reviewInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    function updateStage() {
      setStage({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateStage()
    window.addEventListener("resize", updateStage)

    return () => window.removeEventListener("resize", updateStage)
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
      // 저장 실패가 화면 동작을 막지 않도록 무시
    }
  }, [loaded, progress])

  const layoutMode: LayoutMode =
    stage.width < MOBILE_BP
      ? "mobile"
      : stage.width < NARROW_BP
        ? "narrow"
        : "wide"

  function selectStar(id: string) {
    setSelectedId(id)
    setReviewInput("")
    setToolsOpen(false)
  }

  function closePanel() {
    setSelectedId(null)
    setReviewInput("")
    setToolsOpen(false)
  }

  function toggleTools() {
    setSelectedId(null)
    setReviewInput("")
    setToolsOpen((open) => !open)
  }

  useEffect(() => {
    if (!selectedId) return

    const node = positions.get(selectedId)
    if (!node) return

    setSmooth(true)
    setCamera({
      x: node.x,
      y: node.y,
      zoom: FOCUS_ZOOM,
    })
  }, [positions, selectedId])

  // 별 클릭(선택) 시 패널이 자리잡은 뒤 복습 입력창에 바로 타이핑할 수 있도록 자동 포커스
  useEffect(() => {
    if (!selectedId) return

    const timer = window.setTimeout(() => {
      reviewInputRef.current?.focus()
    }, FOCUS_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [selectedId])

  function toggleAcquired(starId: string) {
    setProgress((previous) => {
      const current = previous[starId] ?? {
        acquired: false,
        logs: [],
      }

      return {
        ...previous,
        [starId]: {
          ...current,
          acquired: !current.acquired,
        },
      }
    })
  }

  function addLog(starId: string, text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    setProgress((previous) => {
      const current = previous[starId] ?? {
        acquired: false,
        logs: [],
        reinforced: false,
      }

      let reinforced = current.reinforced ?? false
      const now = new Date()

      if (current.logs.length > 0) {
        const lastLog = current.logs[current.logs.length - 1]
        const lastDate = parseYMD(lastLog.date)
        const differenceDays = Math.floor(
          (now.getTime() - lastDate.getTime()) / 86400000,
        )

        if (differenceDays >= REINFORCE_GAP_DAYS) {
          reinforced = true
        }
      }

      const entry: LogEntry = {
        date: formatDateYMD(now),
        type: "review",
        text: trimmed,
      }

      return {
        ...previous,
        [starId]: {
          acquired: true,
          logs: [...current.logs, entry],
          reinforced,
        },
      }
    })
  }

  function removeLog(starId: string, index: number) {
    setProgress((previous) => {
      const current = previous[starId]
      if (!current) return previous

      const nextLogs = current.logs.slice()
      nextLogs.splice(index, 1)

      return {
        ...previous,
        [starId]: {
          ...current,
          logs: nextLogs,
        },
      }
    })
  }

  function handleReviewKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter") return

    if (event.ctrlKey || event.metaKey) {
      // Ctrl(Cmd)+Enter: 줄바꿈 삽입
      event.preventDefault()
      const el = event.currentTarget
      const start = el.selectionStart
      const end = el.selectionEnd
      const next = reviewInput.slice(0, start) + "\n" + reviewInput.slice(end)
      setReviewInput(next)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 1
      })
      return
    }

    // 단독 Enter: 기록 제출
    event.preventDefault()
    if (selectedId) {
      addLog(selectedId, reviewInput)
      setReviewInput("")
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    const isInteractive = target.closest("[data-overlay-interactive]")

    if (!isInteractive) {
      closePanel()
    }

    event.currentTarget.setPointerCapture(event.pointerId)

    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    setSmooth(false)

    if (pointers.current.size === 1) {
      dragRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        startCamX: camera.x,
        startCamY: camera.y,
        moved: false,
      }

      return
    }

    if (pointers.current.size === 2) {
      dragRef.current.active = false
      closePanel()

      const [first, second] = [...pointers.current.values()]
      const distance = Math.hypot(first.x - second.x, first.y - second.y) || 1

      pinchRef.current = {
        active: true,
        startDistance: distance,
        startZoom: camera.zoom,
      }
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return

    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    if (pinchRef.current?.active && pointers.current.size >= 2) {
      const [first, second] = [...pointers.current.values()]
      const distance = Math.hypot(first.x - second.x, first.y - second.y) || 1
      const ratio = distance / pinchRef.current.startDistance

      setCamera((current) => ({
        ...current,
        zoom: rubberBand(
          pinchRef.current!.startZoom * ratio,
          ZOOM_MIN,
          ZOOM_MAX,
          0.4,
        ),
      }))

      return
    }

    if (!dragRef.current.active || pointers.current.size !== 1) return

    const dx = event.clientX - dragRef.current.startX
    const dy = event.clientY - dragRef.current.startY

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true
    }

    if (!dragRef.current.moved) return

    const nextX = dragRef.current.startCamX - dx / camera.zoom
    const nextY = dragRef.current.startCamY - dy / camera.zoom

    setCamera((current) => ({
      ...current,
      x: rubberBand(nextX, bounds.minX, bounds.maxX),
      y: rubberBand(nextY, bounds.minY, bounds.maxY),
    }))
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    pointers.current.delete(event.pointerId)

    if (pointers.current.size < 2 && pinchRef.current?.active) {
      pinchRef.current = null
      setSmooth(true)

      setCamera((current) => ({
        ...current,
        zoom: clamp(current.zoom, ZOOM_MIN, ZOOM_MAX),
      }))
    }

    if (pointers.current.size === 0) {
      dragRef.current.active = false
      setSmooth(true)

      setCamera((current) => ({
        ...current,
        x: clamp(current.x, bounds.minX, bounds.maxX),
        y: clamp(current.y, bounds.minY, bounds.maxY),
      }))
    }
  }

  function onWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    setSmooth(false)

    if (selectedId) closePanel()

    const rect = event.currentTarget.getBoundingClientRect()
    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top
    const focal = getFocal(
      layoutMode,
      false,
      stage.width,
      stage.height,
    )

    const zoomFactor = Math.exp(-event.deltaY * 0.0012)

    setCamera((current) => {
      const nextZoom = rubberBand(
        current.zoom * zoomFactor,
        ZOOM_MIN,
        ZOOM_MAX,
        0.35,
      )

      const worldX = current.x + (pointerX - focal.x) / current.zoom
      const worldY = current.y + (pointerY - focal.y) / current.zoom

      const nextX = worldX - (pointerX - focal.x) / nextZoom
      const nextY = worldY - (pointerY - focal.y) / nextZoom

      return {
        x: rubberBand(nextX, bounds.minX, bounds.maxX),
        y: rubberBand(nextY, bounds.minY, bounds.maxY),
        zoom: nextZoom,
      }
    })

    window.clearTimeout(wheelTimeout.current)

    wheelTimeout.current = window.setTimeout(() => {
      setSmooth(true)

      setCamera((current) => ({
        x: clamp(current.x, bounds.minX, bounds.maxX),
        y: clamp(current.y, bounds.minY, bounds.maxY),
        zoom: clamp(current.zoom, ZOOM_MIN, ZOOM_MAX),
      }))
    }, 180)
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `appraiser-progress-${formatDateYMD(new Date()).replaceAll("/", "-")}.json`
    link.click()

    URL.revokeObjectURL(url)
  }

  function handleImportFile(file: File) {
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))

        if (confirm("불러온 파일로 현재 진행상황을 덮어쓸까요?")) {
          setProgress(parsed)
        }
      } catch {
        alert("올바른 JSON 파일이 아닙니다.")
      }
    }

    reader.readAsText(file)
  }

  function handleReset() {
    if (!confirm("모든 습득 기록과 복습 로그를 초기화할까요?")) return

    setProgress({})
    localStorage.removeItem(STORAGE_KEY)
  }

  const focal = getFocal(
    layoutMode,
    Boolean(selectedId),
    stage.width,
    stage.height,
  )

  const worldTransform = {
    left: focal.x - camera.x * camera.zoom,
    top: focal.y - camera.y * camera.zoom,
  }

  const selectedNode = selectedId ? positions.get(selectedId) : null
  const selectedSection = selectedNode ? sections[selectedNode.section] : null
  const selectedProgress = selectedId ? progress[selectedId] : undefined
  const isSelectedAcquired = Boolean(selectedProgress?.acquired)

  const acquiredCount = Object.values(progress).filter(
    (item) => item?.acquired,
  ).length
  const totalCount = nodeList.length
  const progressPct = totalCount > 0 ? (acquiredCount / totalCount) * 100 : 0

  const bgOffsetX = clamp(-camera.x * BG_PARALLAX, -BG_OFFSET_MAX, BG_OFFSET_MAX)
  const bgOffsetY = clamp(-camera.y * BG_PARALLAX, -BG_OFFSET_MAX, BG_OFFSET_MAX)

  let panelClass = ""
  let panelStyle: React.CSSProperties = {}

  if (layoutMode === "mobile") {
    panelClass = "fixed rounded-2xl"
    panelStyle = {
      top: COMPACT_PANEL_MARGIN,
      left: COMPACT_PANEL_MARGIN,
      right: COMPACT_PANEL_MARGIN,
      height: "80%",
    }
  } else if (layoutMode === "narrow") {
    panelClass = "fixed rounded-2xl"
    panelStyle = {
      top: COMPACT_PANEL_MARGIN,
      bottom: COMPACT_PANEL_MARGIN,
      right: COMPACT_PANEL_MARGIN,
      width: "40%",
    }
  } else {
    panelClass = "fixed rounded-2xl"
    panelStyle = {
      top: `${WIDE_PANEL_TOP_BOTTOM}px`,
      right: `${WIDE_PANEL_RIGHT}px`,
      bottom: `${WIDE_PANEL_TOP_BOTTOM}px`,
      width: `calc(25vw - ${WIDE_PANEL_RIGHT}px)`,
      maxWidth: "24rem",
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060c] text-white">
      <div
        className="pointer-events-none fixed z-0"
        style={{
          top: -BG_OVERSCAN,
          left: -BG_OVERSCAN,
          right: -BG_OVERSCAN,
          bottom: -BG_OVERSCAN,
          backgroundImage:
            "linear-gradient(rgba(3, 5, 12, 0.38), rgba(3, 5, 12, 0.68)), url('/images/study/universe-background.jpg')",
          backgroundPosition: `calc(50% + ${bgOffsetX}px) calc(50% + ${bgOffsetY}px)`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#05060c",
          transition: smooth
            ? "background-position 0.42s cubic-bezier(0.16, 1, 0.3, 1)"
            : "none",
        }}
      />

      <div
        className="pointer-events-none fixed inset-0 opacity-18"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.7) 0.6px, transparent 0.6px)",
          backgroundSize: "42px 42px",
        }}
      />

      <Link
        href="/"
        className="fixed left-5 top-5 z-50 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs text-white/85 backdrop-blur-md transition-colors hover:border-white/60 hover:text-white"
      >
        ← BACK
      </Link>

      <div
        data-overlay-interactive
        className="fixed right-5 top-5 z-50"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="메뉴 열기"
          onClick={toggleTools}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:border-white/60 hover:text-white"
        >
          <MoreVertical size={18} />
        </button>

        {toolsOpen && (
          <div className="absolute right-0 top-12 flex w-36 flex-col gap-1 rounded-xl border border-white/15 bg-neutral-950/90 p-2 shadow-xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                handleExport()
                setToolsOpen(false)
              }}
              className="rounded-lg px-3 py-2 text-left text-xs text-white/75 hover:bg-white/10"
            >
              내보내기
            </button>

            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click()
                setToolsOpen(false)
              }}
              className="rounded-lg px-3 py-2 text-left text-xs text-white/75 hover:bg-white/10"
            >
              불러오기
            </button>

            <button
              type="button"
              onClick={() => {
                handleReset()
                setToolsOpen(false)
              }}
              className="rounded-lg px-3 py-2 text-left text-xs text-red-200/75 hover:bg-red-400/10"
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
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) handleImportFile(file)
            event.target.value = ""
          }}
        />
      </div>

      <div
        className="relative h-screen w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            transform: `translate(${worldTransform.left}px, ${worldTransform.top}px) scale(${camera.zoom})`,
            transformOrigin: "center center",
            transition: smooth
              ? "transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)"
              : "none",
          }}
        >
          <svg
            width="1"
            height="1"
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              overflow: "visible",
            }}
          >
            {edges.map(([from, to]) => {
              const start = positions.get(from)
              const end = positions.get(to)

              if (!start || !end) return null

              const bothAcquired =
                progress[from]?.acquired && progress[to]?.acquired

              const isConnectedToSelection =
                Boolean(selectedId) &&
                (from === selectedId || to === selectedId)
              const otherEnd = from === selectedId ? to : from

              return (
                <g key={`${from}-${to}`}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={
                      isConnectedToSelection
                        ? "rgba(255,255,255,0.98)"
                        : bothAcquired
                          ? "rgba(255,213,142,0.48)"
                          : "rgba(220,230,255,0.17)"
                    }
                    strokeWidth={isConnectedToSelection ? 2.2 : 1.2}
                    style={
                      isConnectedToSelection
                        ? { filter: SELECTED_GLOW_FILTER }
                        : undefined
                    }
                  />
                  {isConnectedToSelection && (
                    <line
                      data-overlay-interactive
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="transparent"
                      strokeWidth={20}
                      style={{ cursor: "pointer", pointerEvents: "stroke" }}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation()
                        selectStar(otherEnd)
                      }}
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {nodeList.map((node) => {
            const status = progress[node.id]
            const isRoot = node.id === "root0"
            const isSelected = selectedId === node.id
            const hasLogs = (status?.logs.length ?? 0) > 0

            const tier = getTier(
              isRoot,
              Boolean(status?.acquired),
              Boolean(status?.reinforced),
              hasLogs,
            )

            const size = isRoot ? 35 : 26
            const hitSize = size + 22
            const [line1, line2] = wrapLabel(node.name)

            return (
              <div
                key={node.id}
                className="absolute"
                style={{
                  left: node.x,
                  top: node.y,
                }}
              >
                <button
                  type="button"
                  data-overlay-interactive
                  aria-label={node.name}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation()
                    selectStar(node.id)
                  }}
                  className="absolute flex items-center justify-center rounded-full outline-none transition-transform hover:scale-110"
                  style={{
                    left: 0,
                    top: 0,
                    width: hitSize,
                    height: hitSize,
                    marginLeft: -hitSize / 2,
                    marginTop: -hitSize / 2,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <StarGlyph
                    size={size}
                    fill={`rgba(${tier.rgb}, ${tier.fillAlpha})`}
                    className={isSelected ? "selected-neutral-glow" : undefined}
                    style={{
                      filter: isSelected ? SELECTED_GLOW_FILTER : tier.shadow,
                    }}
                  />
                </button>

                <p
                  className={`pointer-events-none absolute m-0 text-center text-[12px] font-medium transition-colors ${
                    isSelected ? "text-white" : "text-white/72"
                  }`}
                  style={{
                    left: 0,
                    top: size + 13,
                    width: 164,
                    marginLeft: -82,
                    lineHeight: 1.3,
                    whiteSpace: "normal",
                    wordBreak: "keep-all",
                    overflowWrap: "normal",
                    writingMode: "horizontal-tb",
                    textOrientation: "mixed",
                    textShadow: isSelected
                      ? "0 0 10px rgba(255,255,255,0.18)"
                      : "0 0 8px rgba(255,255,255,0.06)",
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

      {/* 하단 중앙 진행도 바 — "습득" 문구 없이 분수만 표시, 진한 블루 그라데이션 */}
      <div
        data-overlay-interactive
        className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2"
      >
        <div className="relative h-8 w-64 overflow-hidden rounded-md border border-white/15 bg-black/45 backdrop-blur-md md:w-80">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-950 via-blue-700 to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-widest text-white drop-shadow-sm">
            {acquiredCount}/{totalCount}
          </div>
        </div>
      </div>

      {selectedNode && (
        <aside
          data-overlay-interactive
          className={`${panelClass} z-50 overflow-y-auto border border-white/15 bg-neutral-950/40 p-4 text-sm shadow-2xl backdrop-blur-xl md:p-5`}
          style={panelStyle}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="닫기"
            onClick={closePanel}
            className="absolute right-4 top-4 text-white/45 transition-colors hover:text-white"
          >
            ✕
          </button>

          <p className="pr-7 text-[11px] tracking-[0.13em] text-amber-200/80">
            {selectedSection?.title}
          </p>

          <h2
            onClick={() => {
              if (selectedId) toggleAcquired(selectedId)
            }}
            className={`mt-1 cursor-pointer pr-7 text-base font-bold leading-snug transition-colors md:text-lg ${
              isSelectedAcquired ? "text-yellow-500" : "text-white"
            }`}
          >
            {selectedNode.name}
          </h2>

          <section className="mt-5">
            <p className="mb-2 text-[11px] tracking-[0.14em] text-white/45">
              복습
            </p>

            <div className="flex flex-col gap-2">
              <textarea
                ref={reviewInputRef}
                value={reviewInput}
                onChange={(event) => setReviewInput(event.target.value)}
                onKeyDown={handleReviewKeyDown}
                placeholder="오늘 배운 것 (Ctrl+Enter 줄바꿈, **굵게** *기울임* `코드`)"
                rows={3}
                className="w-full resize-none rounded-md border border-white/18 bg-black/35 px-2.5 py-2 text-[12px] text-white placeholder:text-[11px] placeholder:text-white/30 outline-none focus:border-amber-100/70"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedId) return
                    addLog(selectedId, reviewInput)
                    setReviewInput("")
                  }}
                  className="rounded-md border border-white/22 px-3 py-2 text-[11px] text-white/78 transition-colors hover:border-amber-100/80 hover:text-amber-50 md:text-[12px]"
                >
                  기록
                </button>
              </div>
            </div>
          </section>

          <section className="mt-4 flex flex-col gap-2">
            {(selectedProgress?.logs ?? [])
              .slice()
              .reverse()
              .map((log, indexFromTop) => {
                const originalIndex =
                  (selectedProgress?.logs.length ?? 0) - 1 - indexFromTop

                return (
                  <div
                    key={`${log.date}-${indexFromTop}`}
                    className="relative rounded-md border border-white/10 bg-black/24 p-2.5 pr-7"
                  >
                    <p className="mb-1 text-[10px] tracking-wider text-white/40">
                      {log.date}
                    </p>

                    <p
                      className="text-[12px] leading-relaxed text-white/85"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(log.text),
                      }}
                    />

                    <button
                      type="button"
                      aria-label="이 복습 기록 삭제"
                      onClick={() => {
                        if (!selectedId) return
                        removeLog(selectedId, originalIndex)
                      }}
                      className="absolute right-1.5 top-1.5 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] text-white/45 transition-colors hover:bg-red-500/30 hover:text-red-100"
                    >
                      X
                    </button>
                  </div>
                )
              })}

            {(selectedProgress?.logs.length ?? 0) === 0 && (
              <p className="text-[12px] text-white/35">아직 기록이 없습니다.</p>
            )}
          </section>
        </aside>
      )}
    </main>
  )
}