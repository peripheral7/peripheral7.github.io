"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { MoreVertical, Search, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { skillTree, sections, layoutTree } from "@/content/appraiser/skilltree"
import defaultProgress from "@/content/appraiser/progress.default.json"

type ReviewCycle = 1 | 2 | 3

type LogEntry = {
  id: string
  date: string
  type: "study" | "review"
  text: string
  reviewCycle?: ReviewCycle
}

type StarProgress = {
  acquired: boolean
  logs: LogEntry[]
  reinforced?: boolean
  reviewCount?: number
  reviewCompletedAt?: Partial<Record<ReviewCycle, string>>
}

type ProgressMap = Record<string, StarProgress>
type LayoutMode = "mobile" | "narrow" | "wide"
type EdgeSide = "top" | "bottom" | "left" | "right"

const STORAGE_KEY = "appraiser-skilltree-progress-v1"
const DRAFTS_STORAGE_KEY = "appraiser-skilltree-drafts-v1"

const ZOOM_MIN = 0.2
const ZOOM_MAX = 2.0
const FOCUS_ZOOM = ZOOM_MAX
const DEFAULT_ZOOM = 1.0
const PAN_MARGIN = 320
const RESISTANCE = 0.35

const X_SPACING = 220
const Y_SPACING = 220

const WIDE_PANEL_RIGHT = 64
const WIDE_PANEL_TOP_BOTTOM = 64

const MOBILE_BP = 768
const NARROW_BP = 1300
const REINFORCE_GAP_DAYS = 7
const TITLE_WRAP_LEN = 8

const FOCUS_DELAY_MS = 260
const SCROLL_TO_COMMENT_DELAY_MS = 340
const FLASH_FADE_MS = 1000
const FLASH_TRIGGER_DELAY_MS = 100

const BG_OVERSCAN = 100
const BG_PARALLAX = 0.025
const BG_OFFSET_MAX = 70

const STAR_SELECT_ALPHA = 0.98

const EDGE_BRIGHTNESS_SCALE = 0.9
const EDGE_BASE_ALPHA = STAR_SELECT_ALPHA * EDGE_BRIGHTNESS_SCALE

const EDGE_TO_PARENT_ALPHA = EDGE_BASE_ALPHA * 0.7
const EDGE_TO_CHILD_ALPHA = Math.min(1, EDGE_BASE_ALPHA * 1.1)

const EDGE_DEFAULT_ALPHA = 0.17 * EDGE_BRIGHTNESS_SCALE
const EDGE_ACQUIRED_ALPHA = 0.48 * EDGE_BRIGHTNESS_SCALE

const OFFSCREEN_CHECK_MARGIN = 48
const EDGE_LABEL_MARGIN = 16

// 복습 3회 주기: 1회차=3일, 2회차=10일, 3회차=20일. reviewCount(완료 횟수, 0~3)가 다음 목표를 결정
const REVIEW_THRESHOLDS = [3, 10, 20]
const REVIEW_LABELS = ["3일", "10일", "20일"]

let sharedAudioCtx: AudioContext | null = null

function playStarMoveSound() {
  if (typeof window === "undefined") return
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioCtx) return

  if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx()
  const ctx = sharedAudioCtx
  if (ctx.state === "suspended") ctx.resume()

  const now = ctx.currentTime

  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.setValueAtTime(-24, now)
  compressor.knee.setValueAtTime(20, now)
  compressor.ratio.setValueAtTime(10, now)
  compressor.attack.setValueAtTime(0.003, now)
  compressor.release.setValueAtTime(0.25, now)
  compressor.connect(ctx.destination)

  const osc = ctx.createOscillator()
  osc.type = "sine"
  osc.frequency.setValueAtTime(95, now)
  osc.frequency.linearRampToValueAtTime(55, now + 0.55)

  const oscFilter = ctx.createBiquadFilter()
  oscFilter.type = "lowpass"
  oscFilter.frequency.value = 220

  const oscGain = ctx.createGain()
  oscGain.gain.setValueAtTime(0.0001, now)
  oscGain.gain.exponentialRampToValueAtTime(0.95, now + 0.06)
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)

  const subOsc = ctx.createOscillator()
  subOsc.type = "sine"
  subOsc.frequency.setValueAtTime(48, now)
  subOsc.frequency.linearRampToValueAtTime(30, now + 0.55)

  const subGain = ctx.createGain()
  subGain.gain.setValueAtTime(0.0001, now)
  subGain.gain.exponentialRampToValueAtTime(0.6, now + 0.08)
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)

  const bufferSize = ctx.sampleRate * 0.5
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer

  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = "lowpass"
  noiseFilter.frequency.value = 350

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.0001, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.15, now + 0.05)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)

  osc.connect(oscFilter).connect(oscGain).connect(compressor)
  subOsc.connect(subGain).connect(compressor)
  noise.connect(noiseFilter).connect(noiseGain).connect(compressor)

  osc.start(now)
  osc.stop(now + 0.55)
  subOsc.start(now)
  subOsc.stop(now + 0.55)
  noise.start(now)
  noise.stop(now + 0.5)
}

function generateLogId() {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function migrateProgress(raw: ProgressMap): ProgressMap {
  const migrated: ProgressMap = {}

  for (const [starId, status] of Object.entries(raw)) {
    if (!status) continue

    const migratedLogs = (status.logs ?? []).map((log) =>
      log.id ? log : { ...log, id: generateLogId() },
    )

    migrated[starId] = { ...status, logs: migratedLogs }
  }

  return migrated
}

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

// caret(커서) 위치를 계산해 textarea의 scrollTop을 강제로 맞춰 caret이 항상 보이게 함
function scrollCaretIntoView(el: HTMLTextAreaElement) {
  const style = window.getComputedStyle(el)
  const mirror = document.createElement("div")

  const properties = [
    "boxSizing",
    "width",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "letterSpacing",
  ] as const

  properties.forEach((prop) => {
    ;(mirror.style as any)[prop] = style[prop as any]
  })

  mirror.style.position = "absolute"
  mirror.style.visibility = "hidden"
  mirror.style.height = "auto"
  mirror.style.left = "-9999px"
  mirror.style.top = "0"
  mirror.style.whiteSpace = "pre-wrap"
  mirror.style.wordBreak = "break-word"

  const caretIndex = el.selectionStart
  const beforeCaret = el.value.slice(0, caretIndex)
  const marker = document.createElement("span")
  marker.textContent = "\u200b"

  mirror.textContent = beforeCaret
  mirror.appendChild(marker)
  document.body.appendChild(mirror)

  const markerTop = marker.offsetTop
  const markerHeight = marker.offsetHeight || parseFloat(style.lineHeight || "16")

  document.body.removeChild(mirror)

  const visibleTop = el.scrollTop
  const visibleBottom = visibleTop + el.clientHeight

  if (markerTop < visibleTop) {
    el.scrollTop = markerTop
  } else if (markerTop + markerHeight > visibleBottom) {
    el.scrollTop = markerTop + markerHeight - el.clientHeight
  }
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

  return [name.slice(0, breakIndex).trim(), name.slice(breakIndex).trim()]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function renderInline(text: string, nameToId: Map<string, string>) {
  let out = escapeHtml(text)

  out = out.replace(/-&gt;/g, "→")

  out = out.replace(/\[\[(.+?)\]\]/g, (_match, title: string) => {
    const trimmedTitle = title.trim()
    const targetId = nameToId.get(trimmedTitle)
    if (!targetId) {
      return `<span class="text-red-300/70">[[${trimmedTitle}]]</span>`
    }
    return `<button type="button" data-star-link="${targetId}" class="text-amber-200 underline underline-offset-2 hover:text-amber-100">${trimmedTitle}</button>`
  })

  out = out.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.9em]">$1</code>',
  )
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>")

  return out
}

function preserveLeadingWhitespace(line: string): { indentHtml: string; rest: string } {
  const match = line.match(/^( +)/)
  if (!match) return { indentHtml: "", rest: line }

  return {
    indentHtml: "&nbsp;".repeat(match[1].length),
    rest: line.slice(match[1].length),
  }
}

function renderMarkdown(text: string, nameToId: Map<string, string>) {
  const lines = text.split("\n")
  const htmlLines: string[] = []
  const ulIndentStack: number[] = []

  function closeLists() {
    while (ulIndentStack.length) {
      htmlLines.push("</ul>")
      ulIndentStack.pop()
    }
  }

  for (const rawLine of lines) {
    const headerMatch = rawLine.match(/^(#{2,3})\s+(.*)$/)
    const listMatch = rawLine.match(/^(\s*)-\s+(.*)$/)

    if (headerMatch) {
      closeLists()
      const level = headerMatch[1].length
      const sizeClass =
        level === 2
          ? "text-[calc(1em+2px)] font-bold"
          : "text-[calc(1em+1px)] font-bold"
      htmlLines.push(
        `<div class="${sizeClass} mt-1 mb-0.5">${renderInline(headerMatch[2], nameToId)}</div>`,
      )
      continue
    }

    if (listMatch) {
      const indent = Math.floor(listMatch[1].length / 2)

      while (
        ulIndentStack.length &&
        ulIndentStack[ulIndentStack.length - 1] > indent
      ) {
        htmlLines.push("</ul>")
        ulIndentStack.pop()
      }

      if (
        !ulIndentStack.length ||
        ulIndentStack[ulIndentStack.length - 1] < indent
      ) {
        htmlLines.push('<ul class="list-disc pl-5 my-0.5">')
        ulIndentStack.push(indent)
      }

      htmlLines.push(`<li>${renderInline(listMatch[2], nameToId)}</li>`)
      continue
    }

    closeLists()

    if (rawLine.trim() === "") {
      htmlLines.push("<br/>")
    } else {
      const { indentHtml, rest } = preserveLeadingWhitespace(rawLine)
      htmlLines.push(`<div>${indentHtml}${renderInline(rest, nameToId)}</div>`)
    }
  }

  closeLists()
  return htmlLines.join("")
}

function clipSegmentToRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rect: { left: number; top: number; right: number; bottom: number },
) {
  const dx = x1 - x0
  const dy = y1 - y0
  const p = [-dx, dx, -dy, dy]
  const q = [x0 - rect.left, rect.right - x0, y0 - rect.top, rect.bottom - y0]

  let u1 = 0
  let u2 = 1

  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return null
    } else {
      const r = q[i] / p[i]
      if (p[i] < 0) {
        if (r > u2) return null
        if (r > u1) u1 = r
      } else {
        if (r < u1) return null
        if (r < u2) u2 = r
      }
    }
  }

  return { x: x0 + u2 * dx, y: y0 + u2 * dy }
}

function sideOfPoint(
  x: number,
  y: number,
  rect: { left: number; top: number; right: number; bottom: number },
): EdgeSide {
  const EPS = 0.75
  if (Math.abs(x - rect.left) < EPS) return "left"
  if (Math.abs(x - rect.right) < EPS) return "right"
  if (Math.abs(y - rect.top) < EPS) return "top"
  if (Math.abs(y - rect.bottom) < EPS) return "bottom"
  return "top"
}

function labelTransformForSide(side: EdgeSide) {
  switch (side) {
    case "top":
      return "translate(-50%, 0%)"
    case "bottom":
      return "translate(-50%, -100%)"
    case "left":
      return "translate(0%, -50%)"
    case "right":
      return "translate(-100%, -50%)"
  }
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
  logCount: number,
  reviewCount: number,
): Tier {
  if (isRoot) {
    return {
      rgb: "255,255,255",
      fillAlpha: 1,
      shadow:
        "drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 10px rgba(255,255,255,0.6))",
    }
  }

  const logs = Math.min(logCount, 3)
  const reviews = Math.min(reviewCount, 3)

  if (reviews >= 3) {
    return {
      rgb: "255,255,255",
      fillAlpha: 1,
      shadow:
        "drop-shadow(0 0 4px rgba(255,255,255,1)) drop-shadow(0 0 12px rgba(255,210,120,0.85)) drop-shadow(0 0 26px rgba(255,190,90,0.6)) drop-shadow(0 0 42px rgba(255,170,60,0.35))",
    }
  }
  if (reviews === 2) {
    return {
      rgb: "255,222,150",
      fillAlpha: 1,
      shadow:
        "drop-shadow(0 0 3px rgba(255,222,150,0.95)) drop-shadow(0 0 14px rgba(255,200,110,0.6)) drop-shadow(0 0 24px rgba(255,180,90,0.3))",
    }
  }
  if (reviews === 1 || (reviews === 0 && reinforced)) {
    return {
      rgb: "255,214,140",
      fillAlpha: 1,
      shadow:
        "drop-shadow(0 0 3px rgba(255,214,140,0.9)) drop-shadow(0 0 10px rgba(255,214,140,0.6))",
    }
  }

  if (logs >= 3) {
    return {
      rgb: "255,224,168",
      fillAlpha: 0.97,
      shadow:
        "drop-shadow(0 0 2px rgba(255,224,168,0.65)) drop-shadow(0 0 6px rgba(255,224,168,0.3))",
    }
  }
  if (logs === 2) {
    return {
      rgb: "240,213,178",
      fillAlpha: 0.92,
      shadow: "drop-shadow(0 0 2px rgba(240,213,178,0.5))",
    }
  }
  if (logs === 1) {
    return {
      rgb: "225,205,175",
      fillAlpha: 0.88,
      shadow: "drop-shadow(0 0 2px rgba(225,205,175,0.5))",
    }
  }
  if (acquired) {
    return {
      rgb: "205,195,180",
      fillAlpha: 0.82,
      shadow: "drop-shadow(0 0 1px rgba(205,195,180,0.35))",
    }
  }
  return {
    rgb: "150,160,180",
    fillAlpha: 0.78,
    shadow: "drop-shadow(0 0 1px rgba(150,160,180,0.25))",
  }
}


// 복습 회차(reviewCycle)에 따른 코멘트 카드 테두리/발광 스타일. 0(없음)=기존 그대로, 1→2→3 순으로 노란빛이 점점 밝아짐. 얇게 유지
function getReviewCardStyle(cycle: ReviewCycle | undefined): {
  borderColor: string
  boxShadow: string
} {
  switch (cycle) {
    case 1:
      return {
        borderColor: "rgba(180, 125, 35, 0.42)",
        boxShadow: "inset 0 0 0 1px rgba(180, 125, 35, 0.05)",
      }

    case 2:
      return {
        borderColor: "rgba(235, 175, 55, 0.58)",
        boxShadow: "inset 0 0 0 1px rgba(235, 175, 55, 0.07)",
      }

    case 3:
      return {
        borderColor: "rgba(255, 239, 130, 0.82)",
        boxShadow: "inset 0 0 0 1px rgba(255, 239, 130, 0.10)",
      }

    default:
      return {
        borderColor: "rgba(255, 255, 255, 0.10)",
        boxShadow: "none",
      }
  }
}


const FLASH_OUTLINE_COLOR = "rgba(255,224,170,0.9)"
const FLASH_GLOW_SHADOW =
  "0 0 3px 0px rgba(255,214,150,0.55), 0 0 6px 1px rgba(255,200,120,0.28)"

function getFocal(
  mode: LayoutMode,
  hasSelection: boolean,
  width: number,
  height: number,
) {
  if (!hasSelection) {
    return { x: width / 2, y: height / 2 }
  }

  if (mode === "mobile" || mode === "narrow") {
    const topZoneEnd = 0.4
    const bottomZoneStart = topZoneEnd
    const bottomZoneEnd = 1 - 0.025
    const centerY = (bottomZoneStart + bottomZoneEnd) / 2
    return { x: width / 2, y: height * centerY }
  }

  return { x: width / 2, y: height / 2 }
}

// 별의 코멘트들 중 "날짜상 가장 최근"인 코멘트를 찾음. 드래그로 표시 순서를 바꿔도 복습 스케줄링에는 영향 없음
function getLatestLogByDate(logs: LogEntry[]): LogEntry | null {
  if (logs.length === 0) return null
  return logs.reduce((latest, log) =>
    parseYMD(log.date).getTime() > parseYMD(latest.date).getTime() ? log : latest,
  )
}

function getDueCycle(status: StarProgress | undefined): ReviewCycle | null {
  if (!status || status.logs.length === 0) return null
  const reviewCount = status.reviewCount ?? 0
  if (reviewCount >= 3) return null

  const latest = getLatestLogByDate(status.logs)
  if (!latest) return null

  const elapsedDays = Math.floor(
    (Date.now() - parseYMD(latest.date).getTime()) / 86400000,
  )
  const threshold = REVIEW_THRESHOLDS[reviewCount]
  if (elapsedDays < threshold) return null

  return (reviewCount + 1) as ReviewCycle
}

const SELECTED_GLOW_FILTER =
  "drop-shadow(0 0 6px rgba(255,255,255,0.98)) drop-shadow(0 0 20px rgba(255,255,255,0.72)) drop-shadow(0 0 34px rgba(255,255,255,0.34))"

// 복습 코멘트 카드를 하나의 개체(컴포넌트)로 분리. dnd-kit useSortable로 드래그 정렬 지원



function ReviewLogCard({
  log,
  isLatest,
  isDue,
  fullyReviewed,
  isCompact,
  compactTextScale,
  isEditing,
  isFlashing,
  editingText,
  onEditingTextChange,
  onEditKeyDown,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onLogAreaClick,
  onToggleReview,
  nameToId,
  setCardRef,
}: {
  log: LogEntry
  isLatest: boolean
  isDue: boolean
  fullyReviewed: boolean
  isCompact: boolean
  compactTextScale: string
  isEditing: boolean
  isFlashing: boolean
  editingText: string
  onEditingTextChange: (value: string) => void
  onEditKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  onLogAreaClick: (event: React.MouseEvent<HTMLDivElement>) => void
  onToggleReview: () => void
  nameToId: Map<string, string>
  setCardRef: (el: HTMLDivElement | null) => void
}) {
  const cardStyle = getReviewCardStyle(log.reviewCycle)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: log.id,
  })

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // 복습 배지("복습n회차")는 완전히 제거하고,
  // 대신 카드 테두리 색(cardStyle.borderClass)만으로 회차를 구분합니다.
  // 실처럼 흐르는 효과(.review-card-thread)는 이 별의 3회차 복습이
  // 모두 끝났을 때(fullyReviewed)만, 그리고 복습 로그(reviewCycle 존재)에만 붙습니다.
  const showThread = fullyReviewed && Boolean(log.reviewCycle)

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        setCardRef(el)
      }}
      style={{
        ...dragStyle,
        borderColor: cardStyle.borderColor,
        outline: isFlashing ? `1px solid ${FLASH_OUTLINE_COLOR}` : "1px solid transparent",
        outlineOffset: "0px",
        boxShadow: isFlashing ? FLASH_GLOW_SHADOW : "none",
        transition: isFlashing
          ? "outline-color 220ms ease-out, box-shadow 220ms ease-out"
          : `outline-color ${FLASH_FADE_MS}ms ease-out, box-shadow ${FLASH_FADE_MS}ms ease-out`,
      }}
      className={`relative rounded-md border bg-black/24 ${showThread ? "review-card-thread" : ""}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-md"
        style={{ boxShadow: cardStyle.boxShadow }}
      />

      <div className="relative flex items-center gap-1.5 border-b border-white/10 bg-black/20 px-2 py-1.5">
        <button
          type="button"
          aria-label="드래그하여 순서 변경"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-0.5 text-white/30 active:cursor-grabbing hover:text-white/60"
        >
          <GripVertical size={13} />
        </button>

        <span className="text-[10px] tracking-wider text-white/40">{log.date}</span>

        <span className="flex-1" />

        {/*
          핵심 수정: isLatest만으로는 렌더링하지 않고,
          isLatest && isDue일 때만 동그라미를 그립니다.
          -> 복습 시점이 아니면 아예 안 보이고,
          -> 최상단 코멘트를 삭제하면 다음 코멘트를 기준으로
            isLatest/isDue가 매번 새로 계산되므로 잔상이 남지 않습니다.
        */}
        {isLatest && isDue && (
          <button
            type="button"
            aria-label="복습 완료 처리"
            onClick={(event) => {
              event.stopPropagation()
              onToggleReview()
            }}
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 transition-colors hover:bg-red-700"
          />
        )}

        {!isEditing && (
          <>
            <button
              type="button"
              aria-label="수정"
              onClick={onStartEdit}
              className="rounded-full px-1 py-0.5 text-[10px] text-white/45 transition-colors hover:text-amber-200"
            >
              수정
            </button>
            <button
              type="button"
              aria-label="삭제"
              onClick={onDelete}
              className="rounded-full px-1 py-0.5 text-[10px] text-white/45 transition-colors hover:bg-red-500/30 hover:text-red-100"
            >
              삭제
            </button>
          </>
        )}
      </div>

      <div className="relative px-2.5 py-2">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editingText}
              onChange={(event) => {
                onEditingTextChange(event.target.value)
                const el = event.currentTarget
                requestAnimationFrame(() => scrollCaretIntoView(el))
              }}
              onKeyDown={onEditKeyDown}
              rows={isCompact ? 3 : 5}
              className={`w-full resize-none rounded-md border border-white/18 bg-black/35 px-2.5 py-2 ${
                isCompact ? compactTextScale : "text-[13px]"
              } text-white shadow-none outline-none ring-0 focus:border-amber-100/50 focus:shadow-none focus:outline-none focus:ring-0`}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded border border-white/20 px-2 py-1 text-[10px] text-white/60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                className="rounded border border-amber-200/40 px-2 py-1 text-[10px] text-amber-200"
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <div
            className={isCompact ? compactTextScale : "text-[13px] leading-relaxed text-white/85"}
            onClick={onLogAreaClick}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(log.text, nameToId) }}
          />
        )}
      </div>
    </div>
  )
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

  const nameToId = useMemo(
    () => new Map(nodeList.map((node) => [node.name, node.id])),
    [nodeList],
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
  const [toolsOpen, setToolsOpen] = useState(false)
  const [reviewQueueOpen, setReviewQueueOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [pendingScrollLogId, setPendingScrollLogId] = useState<string | null>(null)
  const [flashLogId, setFlashLogId] = useState<string | null>(null)

  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({})
  const reviewInput = selectedId ? reviewDrafts[selectedId] ?? "" : ""

  function setReviewInput(value: string) {
    if (!selectedId) return
    setReviewDrafts((previous) => ({ ...previous, [selectedId]: value }))
  }

  const [editingLog, setEditingLog] = useState<{
    starId: string
    logId: string
    text: string
  } | null>(null)

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
  const searchInputRef = useRef<HTMLInputElement>(null)
  const logCardRefs = useRef(new Map<string, HTMLDivElement>())

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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
      const parsed = raw ? JSON.parse(raw) : (defaultProgress as ProgressMap)
      setProgress(migrateProgress(parsed))
    } catch {
      setProgress(migrateProgress(defaultProgress as ProgressMap))
    } finally {
      setLoaded(true)
    }

    try {
      const rawDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY)
      if (rawDrafts) setReviewDrafts(JSON.parse(rawDrafts))
    } catch {
      // 초안 복원 실패는 무시
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

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(reviewDrafts))
    } catch {
      // 저장 실패 무시
    }
  }, [loaded, reviewDrafts])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isFindShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f"
      if (!isFindShortcut) return

      event.preventDefault()
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const layoutMode: LayoutMode =
    stage.width < MOBILE_BP
      ? "mobile"
      : stage.width < NARROW_BP
        ? "narrow"
        : "wide"

  function selectStar(id: string) {
    setSelectedId(id)
    setToolsOpen(false)
    setReviewQueueOpen(false)
    playStarMoveSound()
  }

  // 복습알림 큐에서 코멘트를 클릭했을 때: 해당 별로 이동 + 해당 코멘트로 스크롤 + 테두리 반짝임
  function goToComment(starId: string, logId: string) {
    setSelectedId(starId)
    setToolsOpen(false)
    setReviewQueueOpen(false)
    setPendingScrollLogId(logId)
    playStarMoveSound()
  }

  function closePanel() {
    setSelectedId(null)
    setToolsOpen(false)
    setReviewQueueOpen(false)
    setEditingLog(null)
  }

  // 화면 이동(클릭/드래그/스크롤) 시 검색창, 두 토글 패널, 복습입력탭을 모두 닫음
  function closeAllOverlays() {
    setSelectedId(null)
    setToolsOpen(false)
    setReviewQueueOpen(false)
    setSearchQuery("")
    setEditingLog(null)
  }

  function toggleTools() {
    setSelectedId(null)
    setReviewQueueOpen(false)
    setToolsOpen((open) => !open)
  }

  function toggleReviewQueue() {
    setSelectedId(null)
    setToolsOpen(false)
    setReviewQueueOpen((open) => !open)
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
    if (!selectedId) return

    if (pendingScrollLogId) {
      const targetLogId = pendingScrollLogId
      const timer = window.setTimeout(() => {
        const el = logCardRefs.current.get(targetLogId)
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
        setFlashLogId(targetLogId)
        setPendingScrollLogId(null)

        window.setTimeout(() => {
          setFlashLogId((current) => (current === targetLogId ? null : current))
        }, FLASH_TRIGGER_DELAY_MS)
      }, SCROLL_TO_COMMENT_DELAY_MS)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      reviewInputRef.current?.focus()
    }, FOCUS_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [selectedId, pendingScrollLogId])

  

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
        reviewCount: 0,
      }

      let reinforced = current.reinforced ?? false
      const now = new Date()
      const latestExisting = getLatestLogByDate(current.logs)

      if (latestExisting) {
        const differenceDays = Math.floor(
          (now.getTime() - parseYMD(latestExisting.date).getTime()) / 86400000,
        )

        if (differenceDays >= REINFORCE_GAP_DAYS) {
          reinforced = true
        }
      }

      const entry: LogEntry = {
        id: generateLogId(),
        date: formatDateYMD(now),
        type: "study",
        text: trimmed,
      }

      return {
        ...previous,
        [starId]: {
          ...current,
          acquired: true,
          logs: [entry, ...current.logs],
          reinforced,
          reviewCount: current.reviewCount ?? 0,
          reviewCompletedAt: current.reviewCompletedAt,
        },
      }
    })
  }
  

  function updateLog(starId: string, logId: string, text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    setProgress((previous) => {
      const current = previous[starId]
      if (!current) return previous

      const nextLogs = current.logs.map((log) =>
        log.id === logId ? { ...log, text: trimmed } : log,
      )

      return {
        ...previous,
        [starId]: { ...current, logs: nextLogs },
      }
    })
    setEditingLog(null)
  }

  function removeLog(starId: string, logId: string) {
    setProgress((previous) => {
      const current = previous[starId]
      if (!current) return previous

      return {
        ...previous,
        [starId]: {
          ...current,
          logs: current.logs.filter((log) => log.id !== logId),
        },
      }
    })
  }

  // 복습알림 패널 체크박스: 코멘트 없이 해당 회차 복습을 완료 처리
  function completeReviewCycle(starId: string, cycle: ReviewCycle) {
    setProgress((previous) => {
      const current = previous[starId]
      if (!current) return previous

      const latestLog = getLatestLogByDate(current.logs)
      const logs = latestLog
        ? current.logs.map((log) =>
            log.id === latestLog.id
              ? { ...log, reviewCycle: cycle }
              : log,
          )
        : current.logs

      return {
        ...previous,
        [starId]: {
          ...current,
          logs,
          reviewCount: cycle,
          reviewCompletedAt: {
            ...current.reviewCompletedAt,
            [cycle]: formatDateYMD(new Date()),
          },
        },
      }
    })
  }
  

  // 복습완료 취소: 완료 표시를 되돌려 다시 "복습 필요" 상태로 복귀
  function cancelReviewCycle(starId: string, cycle: ReviewCycle) {
    setProgress((previous) => {
      const current = previous[starId]
      if (!current || (current.reviewCount ?? 0) !== cycle) return previous

      const nextCompletedAt = { ...current.reviewCompletedAt }
      delete nextCompletedAt[cycle]

      return {
        ...previous,
        [starId]: {
          ...current,
          logs: current.logs.map((log) =>
            log.reviewCycle === cycle
              ? { ...log, reviewCycle: undefined }
              : log,
          ),
          reviewCount: cycle - 1,
          reviewCompletedAt: nextCompletedAt,
        },
      }
    })
  }

  function toggleReviewForStar(starId: string) {
    const status = progress[starId]
    const dueCycle = getDueCycle(status)

    if (dueCycle) {
      completeReviewCycle(starId, dueCycle)
      return
    }

    const currentCount = status?.reviewCount ?? 0
    if (currentCount > 0) {
      cancelReviewCycle(starId, currentCount as ReviewCycle)
    }
  }

  function handleDragEndLogs(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !selectedId) return

    setProgress((previous) => {
      const current = previous[selectedId]
      if (!current) return previous

      const oldIndex = current.logs.findIndex((log) => log.id === active.id)
      const newIndex = current.logs.findIndex((log) => log.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return previous

      return {
        ...previous,
        [selectedId]: {
          ...current,
          logs: arrayMove(current.logs, oldIndex, newIndex),
        },
      }
    })
  }

  function handleStructuredKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    value: string,
    setValue: (next: string) => void,
    onSubmit: () => void,
  ) {
    if (event.key === "Tab") {
      event.preventDefault()
      const el = event.currentTarget
      const start = el.selectionStart
      const end = el.selectionEnd
      const next = value.slice(0, start) + "    " + value.slice(end)
      setValue(next)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 4
        scrollCaretIntoView(el)
      })
      return
    }

    if (event.key !== "Enter") return

    const el = event.currentTarget
    const start = el.selectionStart
    const end = el.selectionEnd

    if (event.shiftKey || event.metaKey) {
      event.preventDefault()
      const next = value.slice(0, start) + "\n" + value.slice(end)
      setValue(next)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 1
        scrollCaretIntoView(el)
      })
      return
    }

    const lineStart = value.lastIndexOf("\n", start - 1) + 1
    const currentLine = value.slice(lineStart, start)
    const indentMatch = currentLine.match(/^ +/)

    if (indentMatch) {
      event.preventDefault()
      const indent = indentMatch[0]
      const next = value.slice(0, start) + "\n" + indent + value.slice(end)
      setValue(next)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 1 + indent.length
        scrollCaretIntoView(el)
      })
      return
    }

    event.preventDefault()
    onSubmit()
  }

  function handleReviewKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    handleStructuredKeyDown(event, reviewInput, setReviewInput, () => {
      if (!selectedId) return
      addLog(selectedId, reviewInput)
      setReviewDrafts((previous) => ({ ...previous, [selectedId]: "" }))
    })
  }

  function handleEditKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!editingLog) return
    handleStructuredKeyDown(
      event,
      editingLog.text,
      (next) => setEditingLog({ ...editingLog, text: next }),
      () => updateLog(editingLog.starId, editingLog.logId, editingLog.text),
    )
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    const isInteractive = target.closest("[data-overlay-interactive]")

    if (!isInteractive) {
      closeAllOverlays()
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
      closeAllOverlays()

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
      if (!dragRef.current.moved) closeAllOverlays()
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

    closeAllOverlays()

    const rect = event.currentTarget.getBoundingClientRect()
    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top
    const focal = getFocal(layoutMode, false, stage.width, stage.height)

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
          setProgress(migrateProgress(parsed))
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
  const selectedLatestLog = selectedProgress
    ? getLatestLogByDate(selectedProgress.logs)
    : null
  const selectedDueCycle = getDueCycle(selectedProgress)

  const acquiredCount = Object.values(progress).filter(
    (item) => item?.acquired,
  ).length
  const totalCount = nodeList.length
  const progressPct = totalCount > 0 ? (acquiredCount / totalCount) * 100 : 0

  const bgOffsetX = clamp(-camera.x * BG_PARALLAX, -BG_OFFSET_MAX, BG_OFFSET_MAX)
  const bgOffsetY = clamp(-camera.y * BG_PARALLAX, -BG_OFFSET_MAX, BG_OFFSET_MAX)

  function toScreen(worldX: number, worldY: number) {
    return {
      x: worldTransform.left + worldX * camera.zoom,
      y: worldTransform.top + worldY * camera.zoom,
    }
  }

  const offscreenLabels = useMemo(() => {
    if (!selectedId) return []

    const selNode = positions.get(selectedId)
    if (!selNode) return []

    const rect = {
      left: EDGE_LABEL_MARGIN,
      top: EDGE_LABEL_MARGIN,
      right: stage.width - EDGE_LABEL_MARGIN,
      bottom: stage.height - EDGE_LABEL_MARGIN,
    }

    const selScreen = toScreen(selNode.x, selNode.y)

    return edges
      .filter(([from, to]) => from === selectedId || to === selectedId)
      .map(([from, to]) => {
        const otherId = from === selectedId ? to : from
        const otherNode = positions.get(otherId)
        if (!otherNode) return null

        const otherScreen = toScreen(otherNode.x, otherNode.y)

        const visible =
          otherScreen.x >= OFFSCREEN_CHECK_MARGIN &&
          otherScreen.x <= stage.width - OFFSCREEN_CHECK_MARGIN &&
          otherScreen.y >= OFFSCREEN_CHECK_MARGIN &&
          otherScreen.y <= stage.height - OFFSCREEN_CHECK_MARGIN

        if (visible) return null

        const clipped = clipSegmentToRect(
          selScreen.x,
          selScreen.y,
          otherScreen.x,
          otherScreen.y,
          rect,
        )
        if (!clipped) return null

        const side = sideOfPoint(clipped.x, clipped.y, rect)

        return {
          id: otherId,
          name: otherNode.name,
          x: clipped.x,
          y: clipped.y,
          side,
        }
      })
      .filter((label): label is NonNullable<typeof label> => label !== null)
  }, [selectedId, edges, positions, stage.width, stage.height, camera, worldTransform.left, worldTransform.top])

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []

    const results: { id: string; name: string; snippet: string }[] = []

    for (const node of nodeList) {
      if (node.name.toLowerCase().includes(q)) {
        results.push({ id: node.id, name: node.name, snippet: node.name })
        continue
      }

      const logs = progress[node.id]?.logs ?? []
      for (const log of logs) {
        const idx = log.text.toLowerCase().indexOf(q)
        if (idx !== -1) {
          const start = Math.max(0, idx - 15)
          const end = Math.min(log.text.length, idx + q.length + 25)
          const snippet = `${start > 0 ? "…" : ""}${log.text.slice(start, end)}${
            end < log.text.length ? "…" : ""
          }`
          results.push({ id: node.id, name: node.name, snippet })
          break
        }
      }
    }

    return results.slice(0, 8)
  }, [searchQuery, nodeList, progress])

  function commentPreview(text: string) {
    return text.trim()
  }

  // 복습 필요 큐: reviewCount가 결정하는 회차별 목표(3/10/20일) 도달 여부만 판정. 코멘트 단위로 표시
  const dueReviewQueue = useMemo(() => {
    const items = nodeList
      .map((node) => {
        const status = progress[node.id]
        const cycle = getDueCycle(status)
        if (!cycle || !status) return null

        const latest = getLatestLogByDate(status.logs)
        if (!latest) return null

        const elapsedDays = Math.floor(
          (Date.now() - parseYMD(latest.date).getTime()) / 86400000,
        )

        return {
          id: node.id,
          name: node.name,
          cycle,
          elapsedDays,
          label: REVIEW_LABELS[cycle - 1],
          logId: latest.id,
          preview: commentPreview(latest.text),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.elapsedDays - a.elapsedDays)

    return items
  }, [nodeList, progress])

  const completedTodayList = useMemo(() => {
    const today = formatDateYMD(new Date())
    const items: {
      id: string
      name: string
      cycle: ReviewCycle
      label: string
      logId: string
      preview: string
    }[] = []

    for (const node of nodeList) {
      const status = progress[node.id]
      const completedAt = status?.reviewCompletedAt
      if (!completedAt || !status) continue

      const latest = getLatestLogByDate(status.logs)

      for (const cycleKey of [1, 2, 3] as ReviewCycle[]) {
        if (completedAt[cycleKey] === today) {
          items.push({
            id: node.id,
            name: node.name,
            cycle: cycleKey,
            label: REVIEW_LABELS[cycleKey - 1],
            logId: latest?.id ?? "",
            preview: latest ? commentPreview(latest.text) : "",
          })
        }
      }
    }

    return items
  }, [nodeList, progress])

  let panelClass = ""
  let panelStyle: React.CSSProperties = {}
  let dueQueuePanelStyle: React.CSSProperties = {}

  if (layoutMode === "mobile" || layoutMode === "narrow") {
    panelClass = "fixed rounded-2xl overflow-y-auto skill-panel-scroll"
    panelStyle = {
      top: "2.5%",
      left: "2.5%",
      right: "2.5%",
      height: "37.5%",
      backgroundColor: "rgba(10, 10, 15, 0.3)",
    }
    dueQueuePanelStyle = {
      top: "2.5%",
      left: "2.5%",
      right: "2.5%",
      height: "37.5%",
      backgroundColor: "rgba(10, 10, 15, 0.3)",
    }
  } else {
    panelClass = "fixed rounded-2xl overflow-y-auto skill-panel-scroll"
    panelStyle = {
      top: `${WIDE_PANEL_TOP_BOTTOM}px`,
      right: `${WIDE_PANEL_RIGHT}px`,
      bottom: `${WIDE_PANEL_TOP_BOTTOM}px`,
      width: "33.33vw",
      maxWidth: "28rem",
      backgroundColor: "rgba(10, 10, 15, 0.3)",
    }
    dueQueuePanelStyle = {
      top: `${WIDE_PANEL_TOP_BOTTOM}px`,
      right: `${WIDE_PANEL_RIGHT}px`,
      bottom: `${WIDE_PANEL_TOP_BOTTOM}px`,
      width: "33.33vw",
      maxWidth: "28rem",
      backgroundColor: "rgba(10, 10, 15, 0.3)",
    }
  }

  const isCompact = layoutMode === "mobile" || layoutMode === "narrow"
  const compactTextScale = layoutMode === "mobile" ? "text-[14px]" : "text-[15px]"
  const compactTitleScale = layoutMode === "mobile" ? "text-lg" : "text-xl"
  const compactPadding = layoutMode === "mobile" ? "p-4" : "p-5"

  function handleLogAreaClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest("[data-star-link]")
    const targetId = target?.getAttribute("data-star-link")
    if (targetId) selectStar(targetId)
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
            "linear-gradient(rgba(3, 5, 12, 0.52), rgba(3, 5, 12, 0.8)), url('/images/study/universe-background.jpg')",
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

      {layoutMode === "wide" && (
        <Link
          href="/"
          className="fixed left-5 top-5 z-50 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs text-white/85 backdrop-blur-md transition-colors hover:border-white/60 hover:text-white"
        >
          ← BACK
        </Link>
      )}

      <div
        data-overlay-interactive
        className="fixed left-1/2 top-4 z-50 w-[min(90vw,420px)] -translate-x-1/2"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="제목 또는 복습 내용 검색 (Ctrl+F)"
            className="w-full rounded-full border border-white/20 bg-black/50 py-2 pl-8 pr-4 text-sm text-white placeholder:text-white/35 backdrop-blur-md outline-none focus:border-amber-100/60"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="skill-panel-scroll mt-2 max-h-[50vh] overflow-y-auto rounded-xl border border-white/15 bg-black/60 backdrop-blur-md">
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => {
                  selectStar(result.id)
                  setSearchQuery("")
                }}
                className="block w-full border-b border-white/10 px-4 py-2 text-left text-sm text-white/85 last:border-b-0 hover:bg-white/10"
              >
                <span className="font-semibold text-amber-200">{result.name}</span>
                <span className="ml-2 text-white/55">{result.snippet}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        data-overlay-interactive
        className="fixed right-5 top-5 z-50 flex items-center gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="복습 알림"
          onClick={toggleReviewQueue}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md transition-colors hover:border-white/60"
        >
          <span
            className={`h-3 w-3 rounded-full transition-colors ${
              dueReviewQueue.length > 0 ? "bg-red-500" : "bg-white/25"
            }`}
          />
          {dueReviewQueue.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {dueReviewQueue.length}
            </span>
          )}
        </button>

        <div className="relative">
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
        </div>

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
              zIndex: 1,
            }}
          >
            {edges.map(([from, to]) => {
              const start = positions.get(from)
              const end = positions.get(to)
              if (!start || !end) return null

              const bothAcquired = Boolean(progress[from]?.acquired && progress[to]?.acquired)
              const baseColor = bothAcquired
                ? `rgba(255,213,142,${EDGE_ACQUIRED_ALPHA})`
                : `rgba(220,230,255,${EDGE_DEFAULT_ALPHA})`

              const isConnected = Boolean(selectedId && (from === selectedId || to === selectedId))

              if (!isConnected) {
                return (
                  <line
                    key={`${from}-${to}`}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={baseColor}
                    strokeWidth={1.2}
                  />
                )
              }

              const isToChild = from === selectedId
              const highlightAlpha = isToChild ? EDGE_TO_CHILD_ALPHA : EDGE_TO_PARENT_ALPHA
              const selNode = positions.get(selectedId!)!
              const otherId = isToChild ? to : from
              const otherNode = positions.get(otherId)!
              const gradientId = `edge-glow-${from}-${to}`

              return (
                <g key={`${from}-${to}`}>
                  <linearGradient
                    id={gradientId}
                    gradientUnits="userSpaceOnUse"
                    x1={selNode.x}
                    y1={selNode.y}
                    x2={otherNode.x}
                    y2={otherNode.y}
                  >
                    <stop offset="0%" stopColor={baseColor} />
                    <stop offset="14%" stopColor={`rgba(255,255,255,${highlightAlpha})`} />
                    <stop offset="86%" stopColor={`rgba(255,255,255,${highlightAlpha})`} />
                    <stop offset="100%" stopColor={baseColor} />
                  </linearGradient>

                  {/* 두께는 비선택 라인과 동일하게 1.2로 고정 — 색상/glow만 하이라이트 */}
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={1.2}
                    style={{ filter: SELECTED_GLOW_FILTER }}
                  />

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
                      selectStar(otherId)
                    }}
                  />
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
              status?.logs.length ?? 0,
              status?.reviewCount ?? 0,
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
                  zIndex: 2,
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
                    fill={`rgba(${tier.rgb}, ${
                      isSelected ? Math.min(1, tier.fillAlpha * 1.15) : tier.fillAlpha
                    })`}
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

        {offscreenLabels.map((label) => (
          <div
            key={`offscreen-${label.id}`}
            className="pointer-events-none fixed z-40 whitespace-nowrap rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white/90"
            style={{
              left: label.x,
              top: label.y,
              transform: labelTransformForSide(label.side),
              textShadow: "0 0 6px rgba(0,0,0,0.8)",
            }}
          >
            {label.name}
          </div>
        ))}
      </div>

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

      {reviewQueueOpen && (
        <aside
          data-overlay-interactive
          className={`${panelClass} z-50 border border-white/15 p-4 text-sm shadow-2xl backdrop-blur-xl ${
            isCompact ? compactPadding : "md:p-5"
          }`}
          style={dueQueuePanelStyle}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setReviewQueueOpen(false)}
            className="absolute right-4 top-4 text-white/45 transition-colors hover:text-white"
          >
            ✕
          </button>

          <p className="pr-7 text-[11px] tracking-[0.13em] text-amber-200/80">
            복습 리마인더 (3일 · 10일 · 20일 주기)
          </p>

          <h2
            className={`mt-1 pr-7 font-bold leading-snug text-white ${
              isCompact ? compactTitleScale : "text-base md:text-lg"
            }`}
          >
            Review List ({dueReviewQueue.length})
          </h2>

          <section className="mt-4 flex flex-col gap-2">
            {dueReviewQueue.length === 0 && (
              <p className={`${isCompact ? compactTextScale : "text-[13px]"} text-white/35`}>
                복습이 필요한 항목이 없습니다.
              </p>
            )}

            {dueReviewQueue.map((item) => (
              <label
                key={`${item.id}-${item.cycle}`}
                className="flex cursor-pointer items-start gap-2.5 rounded-md border border-white/10 bg-black/24 p-2.5 transition-colors hover:border-amber-100/40"
              >
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => completeReviewCycle(item.id, item.cycle)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-amber-300"
                />

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    goToComment(item.id, item.logId)
                  }}
                  className="flex-1 text-left"
                >
                  <span
                    className={`${
                      isCompact ? compactTextScale : "text-[13px]"
                    } font-semibold text-amber-200 hover:underline`}
                  >
                    {item.name}
                  </span>
                  <span className="ml-2 text-[11px] text-white/55">
                    {item.cycle}회차 · {item.label} 목표 (D+{item.elapsedDays})
                  </span>
                  <p className="mt-0.5 whitespace-pre-wrap text-[11px] text-white/50">{item.preview}</p>
                </button>
              </label>
            ))}
          </section>

          <div className="mt-6 w-full border-t border-white/12" />

          <section className="mt-4 flex flex-col gap-2">
            <h3 className="text-[11px] tracking-[0.13em] text-white/45">
              복습완료 ({completedTodayList.length})
            </h3>

            {completedTodayList.length === 0 && (
              <p className="text-[12px] text-white/30">오늘 완료한 항목이 없습니다.</p>
            )}

            {completedTodayList.map((item) => (
              <label
                key={`${item.id}-${item.cycle}`}
                className="flex cursor-pointer items-start gap-2.5 rounded-md border border-white/8 bg-black/15 p-2.5 opacity-75 transition-opacity hover:opacity-100"
              >
                <input
                  type="checkbox"
                  checked
                  onChange={() => cancelReviewCycle(item.id, item.cycle)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-amber-300"
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    goToComment(item.id, item.logId)
                  }}
                  className="flex-1 text-left"
                >
                  <span className={`${isCompact ? compactTextScale : "text-[13px]"} text-white/60`}>
                    {item.name}
                  </span>
                  <span className="ml-2 text-[11px] text-white/35">
                    {item.cycle}회차 · {item.label} 완료
                  </span>
                  {item.preview && (
                    <p className="mt-0.5 text-[11px] text-white/30">{item.preview}</p>
                  )}
                </button>
              </label>
            ))}
          </section>
        </aside>
      )}

      {selectedNode && (
        <aside
          data-overlay-interactive
          className={`${panelClass} z-50 border border-white/15 p-4 text-sm shadow-2xl backdrop-blur-xl ${
            isCompact ? compactPadding : "md:p-5"
          }`}
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
            className={`mt-1 cursor-pointer pr-7 font-bold leading-snug transition-colors ${
              isCompact ? compactTitleScale : "text-base md:text-lg"
            } ${isSelectedAcquired ? "text-yellow-500" : "text-white"}`}
          >
            {selectedNode.name}
          </h2>

          <section className="mt-5">
            <div className="flex flex-col gap-2">
              <textarea
                ref={reviewInputRef}
                value={reviewInput}
                onChange={(event) => {
                  setReviewInput(event.target.value)
                  const el = event.currentTarget
                  requestAnimationFrame(() => {
                    scrollCaretIntoView(el)
                  })
                }}
                onKeyDown={handleReviewKeyDown}
                rows={isCompact ? 3 : 5}
                className={`w-full resize-none rounded-md border border-white/18 bg-black/35 px-2.5 py-2 ${
                  isCompact ? compactTextScale : "text-[13px]"
                } text-white shadow-none outline-none ring-0 focus:border-amber-100/50 focus:shadow-none focus:outline-none focus:ring-0`}
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedId) return
                    addLog(selectedId, reviewInput)
                    setReviewDrafts((previous) => ({ ...previous, [selectedId]: "" }))
                  }}
                  className="rounded-md border border-white/22 px-3 py-2 text-[11px] text-white/78 transition-colors hover:border-amber-100/80 hover:text-amber-50 md:text-[12px]"
                >
                  기록
                </button>
              </div>
            </div>
          </section>

          <div className="mt-6 w-full border-t border-white/12" />

          <section className="mt-6 flex flex-col gap-2">
            <DndContext
              sensors={dndSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndLogs}
            >
              <SortableContext
                items={(selectedProgress?.logs ?? []).map((log) => log.id)}
                strategy={verticalListSortingStrategy}
              >

              {(selectedProgress?.logs ?? []).map((log) => {
                const isEditingThis = editingLog?.starId === selectedId && editingLog.logId === log.id
                const isLatest = selectedLatestLog?.id === log.id
                const isDue = isLatest && Boolean(selectedDueCycle)
                const fullyReviewed = (selectedProgress?.reviewCount ?? 0) >= 3

                return (
                  <ReviewLogCard
                    key={log.id}
                    log={log}
                    isLatest={isLatest}
                    isDue={isDue}
                    fullyReviewed={fullyReviewed}
                    isCompact={isCompact}
                    compactTextScale={compactTextScale}
                    isEditing={isEditingThis}
                    isFlashing={flashLogId === log.id}
                    editingText={isEditingThis ? editingLog.text : log.text}
                    onEditingTextChange={(text) => {
                      if (isEditingThis) setEditingLog({ ...editingLog, text })
                    }}
                    onEditKeyDown={handleEditKeyDown}
                    onStartEdit={() =>
                      selectedId && setEditingLog({ starId: selectedId, logId: log.id, text: log.text })
                    }
                    onCancelEdit={() => setEditingLog(null)}
                    onSaveEdit={() =>
                      selectedId && updateLog(selectedId, log.id, editingLog?.text ?? log.text)
                    }
                    onDelete={() => selectedId && removeLog(selectedId, log.id)}
                    onLogAreaClick={handleLogAreaClick}
                    onToggleReview={() => selectedId && toggleReviewForStar(selectedId)}
                    nameToId={nameToId}
                    setCardRef={(el) => {
                      if (el) logCardRefs.current.set(log.id, el)
                      else logCardRefs.current.delete(log.id)
                    }}
                  />
                )
              })}

              </SortableContext>
            </DndContext>

            {(selectedProgress?.logs.length ?? 0) === 0 && (
              <p
                className={`${isCompact ? compactTextScale : "text-[13px]"} text-white/35`}
              >
                아직 기록이 없습니다.
              </p>
            )}
          </section>
        </aside>
      )}
    </main>
  )
}