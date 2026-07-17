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

const FOCUS_ZOOM = 0.92
const DEFAULT_ZOOM = 0.22
const ZOOM_MIN = 0.16
const ZOOM_MAX = 1.8
const PAN_MARGIN = 680
const RESISTANCE = 0.35

// 라벨(약 154px)과 별이 겹치지 않도록 충분히 확장
const X_SPACING = 520
const Y_SPACING = 390

const MOBILE_BP = 768
const NARROW_BP = 1300
const REINFORCE_GAP_DAYS = 7
const TITLE_WRAP_LEN = 8

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
): Tier {
  if (isRoot) {
    return {
      rgb: "255,255,255",
      fillAlpha: 1,
      shadow: "drop-shadow(0 0 4px rgba(255,255,255,0.72))",
    }
  }

  if (reinforced) {
    return {
      rgb: "255,214,140",
      fillAlpha: 0.96,
      shadow: "drop-shadow(0 0 3px rgba(255,214,140,0.50))",
    }
  }

  if (acquired) {
    return {
      rgb: "225,205,175",
      fillAlpha: 0.67,
      shadow: "drop-shadow(0 0 2px rgba(225,205,175,0.30))",
    }
  }

  return {
    rgb: "150,160,180",
    fillAlpha: 0.38,
    shadow: "drop-shadow(0 0 1px rgba(150,160,180,0.18))",
  }
}

function getFocal(
  mode: LayoutMode,
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

  // 선택 중에는 별자리 영역을 좌측 1/3에 고정.
  if (mode === "mobile" || mode === "narrow") {
    return {
      x: width * 0.18,
      y: height * 0.5,
    }
  }

  return {
    x: width * 0.32,
    y: height * 0.5,
  }
}

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

  const childrenOf = useMemo(() => {
    const map = new Map<string, string[]>()

    for (const [parent, child] of edges) {
      const children = map.get(parent) ?? []
      children.push(child)
      map.set(parent, children)
    }

    return map
  }, [edges])

  const parentOf = useMemo(
    () => new Map<string, string>(edges.map(([parent, child]) => [child, parent])),
    [edges],
  )

  const subtreeDepth = useMemo(() => {
    const cache = new Map<string, number>()

    function getDepth(id: string): number {
      const cached = cache.get(id)
      if (cached !== undefined) return cached

      const children = childrenOf.get(id) ?? []
      const depth =
        children.length === 0
          ? 0
          : 1 + Math.max(...children.map((child) => getDepth(child)))

      cache.set(id, depth)
      return depth
    }

    getDepth("root0")
    return cache
  }, [childrenOf])

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

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      const tagName = (target as HTMLElement | null)?.tagName
      return tagName === "INPUT" || tagName === "TEXTAREA"
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        return
      }

      event.preventDefault()

      if (!selectedId) {
        selectStar("root0")
        return
      }

      if (event.key === "ArrowUp") {
        const parent = parentOf.get(selectedId)
        if (parent) selectStar(parent)
        return
      }

      if (event.key === "ArrowDown") {
        const children = childrenOf.get(selectedId) ?? []
        if (children.length === 0) return

        let bestChild = children[0]
        let bestDepth = subtreeDepth.get(bestChild) ?? 0
        let bestX = positions.get(bestChild)?.x ?? 0

        for (const child of children.slice(1)) {
          const childDepth = subtreeDepth.get(child) ?? 0
          const childX = positions.get(child)?.x ?? 0

          if (
            childDepth > bestDepth ||
            (childDepth === bestDepth && childX < bestX)
          ) {
            bestChild = child
            bestDepth = childDepth
            bestX = childX
          }
        }

        selectStar(bestChild)
        return
      }

      const parent = parentOf.get(selectedId)
      if (!parent) return

      const siblings = (childrenOf.get(parent) ?? [])
        .slice()
        .sort((a, b) => (positions.get(a)?.x ?? 0) - (positions.get(b)?.x ?? 0))

      const currentIndex = siblings.indexOf(selectedId)

      if (event.key === "ArrowLeft" && currentIndex > 0) {
        selectStar(siblings[currentIndex - 1])
      }

      if (event.key === "ArrowRight" && currentIndex < siblings.length - 1) {
        selectStar(siblings[currentIndex + 1])
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [childrenOf, parentOf, positions, selectedId, subtreeDepth])

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

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    const isInteractive = target.closest("[data-overlay-interactive]")

    // 배경 클릭 또는 드래그 시작 시 패널을 즉시 닫음
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

    const rect = event.currentTarget.getBoundingClientRect()
    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top
    const focal = getFocal(
      layoutMode,
      Boolean(selectedId),
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

      // 확대 전, 커서 아래에 있던 월드 좌표
      const worldX = current.x + (pointerX - focal.x) / current.zoom
      const worldY = current.y + (pointerY - focal.y) / current.zoom

      // 확대 후에도 같은 월드 좌표가 커서 아래에 남도록 카메라 이동
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

  let panelStyle: React.CSSProperties

  if (layoutMode === "mobile") {
    panelStyle = {
      top: "12vh",
      right: "5vw",
      width: "61vw",
      maxHeight: "72vh",
    }
  } else if (layoutMode === "narrow") {
    panelStyle = {
      top: "12vh",
      right: "5vw",
      width: "59vw",
      maxWidth: "600px",
      maxHeight: "72vh",
    }
  } else {
    panelStyle = {
      top: "10vh",
      right: "5vw",
      width: "30vw",
      maxWidth: "460px",
      maxHeight: "62vh",
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060c] text-white">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, #1d2742 0%, #0a0d18 42%, #03040a 100%)",
        }}
      />

      <div
        className="pointer-events-none fixed inset-0 opacity-30"
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

      <div className="fixed left-1/2 top-5 z-40 -translate-x-1/2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[11px] tracking-wider text-white/75 backdrop-blur-md">
        습득 {Object.values(progress).filter((item) => item?.acquired).length} /{" "}
        {nodeList.length}
      </div>

      <div
        data-overlay-interactive
        className="fixed right-5 top-5 z-50"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="메뉴 열기"
          onClick={() => setToolsOpen((open) => !open)}
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

              return (
                <line
                  key={`${from}-${to}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={
                    bothAcquired
                      ? "rgba(255,213,142,0.48)"
                      : "rgba(220,230,255,0.17)"
                  }
                  strokeWidth="1.2"
                />
              )
            })}
          </svg>

          {nodeList.map((node) => {
            const status = progress[node.id]
            const isRoot = node.id === "root0"
            const isSelected = selectedId === node.id
            const tier = getTier(
              isRoot,
              Boolean(status?.acquired),
              Boolean(status?.reinforced),
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
                    className={isSelected ? "selected-star-glow" : undefined}
                    style={{
                      filter: isSelected
                        ? `drop-shadow(0 0 3px rgba(${tier.rgb}, 0.7)) drop-shadow(0 0 10px rgba(${tier.rgb}, 0.38))`
                        : tier.shadow,
                    }}
                  />
                </button>

                <p
                  className="pointer-events-none absolute m-0 text-center text-[12px] font-medium text-white/85"
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
        <aside
          data-overlay-interactive
          className="fixed z-50 overflow-y-auto rounded-2xl border border-white/15 bg-neutral-950/30 p-5 shadow-2xl backdrop-blur-xl md:p-6"
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

          <p className="pr-8 text-[10px] tracking-[0.16em] text-amber-200/80">
            {selectedSection?.title}
          </p>

          <h2 className="mt-2 pr-8 text-lg font-bold leading-snug text-white md:text-xl">
            {selectedNode.name}
          </h2>

          <button
            type="button"
            onClick={() => {
              if (selectedId) toggleAcquired(selectedId)
            }}
            className={`mt-4 rounded-full border px-4 py-2 text-[11px] tracking-widest transition-colors ${
              selectedProgress?.acquired
                ? "border-amber-200/70 bg-amber-200/10 text-amber-100"
                : "border-white/25 text-white/65 hover:border-white/60"
            }`}
          >
            {selectedProgress?.acquired ? "습득 완료" : "미습득"}
          </button>

          <section className="mt-6">
            <p className="mb-2 text-[10px] tracking-[0.14em] text-white/45">
              복습
            </p>

            <div className="flex gap-2">
              <input
                value={reviewInput}
                onChange={(event) => setReviewInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && selectedId) {
                    addLog(selectedId, reviewInput)
                    setReviewInput("")
                  }
                }}
                placeholder="오늘 배운 것 중 잊지 않고 싶은 것"
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-[11px] placeholder:text-white/30 outline-none focus:border-amber-100/60"
              />

              <button
                type="button"
                onClick={() => {
                  if (!selectedId) return

                  addLog(selectedId, reviewInput)
                  setReviewInput("")
                }}
                className="rounded-lg border border-white/20 px-3 text-[11px] text-white/75 transition-colors hover:border-white/60 hover:text-white"
              >
                확인
              </button>
            </div>
          </section>

          <section className="mt-5 flex flex-col gap-2">
            {(selectedProgress?.logs ?? [])
              .slice()
              .reverse()
              .map((log, index) => (
                <div
                  key={`${log.date}-${index}`}
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <p className="mb-1 text-[10px] tracking-wider text-white/40">
                    {log.date}
                  </p>
                  <p className="text-xs leading-relaxed text-white/85">
                    {log.text}
                  </p>
                </div>
              ))}

            {(selectedProgress?.logs.length ?? 0) === 0 && (
              <p className="text-xs text-white/35">아직 기록이 없습니다.</p>
            )}
          </section>
        </aside>
      )}
    </main>
  )
}