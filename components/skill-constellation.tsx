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
const FLASH_DURATION_MS = 900

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
  hasLogs: boolean,
): Tier {
  if (isRoot) {
    return {
      rgb: "255,255,255",
      fillAlpha: 1,
      shadow:
        "drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 10px rgba(255,255,255,0.6))",
    }
  }
  if (reinforced) {
    return {
      rgb: "255,214,140",
      fillAlpha: 1,
      shadow:
        "drop-shadow(0 0 3px rgba(255,214,140,0.9)) drop-shadow(0 0 10px rgba(255,214,140,0.6))",
    }
  }
  if (hasLogs) {
    return {
      rgb: "255,224,168",
      fillAlpha: 0.97,
      shadow: "drop-shadow(0 0 2px rgba(255,224,168,0.6))",
    }
  }
  if (acquired) {
    return {
      rgb: "225,205,175",
      fillAlpha: 0.88,
      shadow: "drop-shadow(0 0 2px rgba(225,205,175,0.5))",
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
  borderClass: string
  boxShadow: string
} {
  switch (cycle) {
    case 1:
      return {
        borderClass: "border-amber-900/60",
        boxShadow: "0 0 4px rgba(180,140,40,0.35)",
      }
    case 2:
      return {
        borderClass: "border-amber-500/70",
        boxShadow: "0 0 6px rgba(255,190,60,0.55)",
      }
    case 3:
      return {
        borderClass: "border-amber-300/85",
        boxShadow: "0 0 8px rgba(255,225,120,0.75)",
      }
    default:
      return { borderClass: "border-white/10", boxShadow: "none" }
  }
}

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
  nameToId,
  setCardRef,
}: {
  log: LogEntry
  isLatest: boolean
  isDue: boolean
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
  nameToId: Map<string, string>
  setCardRef: (el: HTMLDivElement | null) => void
}) {
  const cardStyle = getReviewCardStyle(log.reviewCycle)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: log.id })

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const flashShadow = isFlashing
    ? "0 0 0 2px rgba(255,235,150,0.95), 0 0 18px rgba(255,225,120,0.9)"
    : cardStyle.boxShadow

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        setCardRef(el)
      }}
      style={{ ...dragStyle, boxShadow: flashShadow, transitionProperty: isFlashing ? "none" : "box-shadow, transform" }}
      className={`overflow-hidden rounded-md border bg-black/24 transition-shadow duration-[900ms] ease-out ${cardStyle.borderClass}`}
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-black/20 px-2 py-1.5">
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

        {log.reviewCycle && (
          <span className="rounded-full border border-amber-200/40 px-1.5 py-0 text-[9px] text-amber-200/80">
            복습 {log.reviewCycle}회차
          </span>
        )}

        <span className="flex-1" />

        {isLatest && (
          <span
            aria-label={isDue ? "복습 필요" : "복습 대기"}
            className={`h-2 w-2 rounded-full ${
              isDue ? "bg-red-500" : "border border-white/40 bg-transparent"
            }`}
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
              ✎
            </button>

            <button
              type="button"
              aria-label="이 복습 기록 삭제"
              onClick={onDelete}
              className="rounded-full px-1 py-0.5 text-[10px] text-white/45 transition-colors hover:bg-red-500/30 hover:text-red-100"
            >
              ✕
            </button>
          </>
        )}
      </div>

      <div className="px-2.5 py-2">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editingText}
              onChange={(event) => {
                onEditingTextChange(event.target.value)
                const el = event.currentTarget
                requestAnimationFrame(() => {
                  scrollCaretIntoView(el)
                })
              }}
              onKeyDown={onEditKeyDown}
              rows={isCompact ? 3 : 5}
              className={`w-full resize-none rounded-md border border-white/18 bg-black/35 px-2.5 py-2 ${
                isCompact ? compactTextScale : "text-[13px]"
              } text-white outline-none focus:border-amber-100/70`}
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
            className={`${
              isCompact ? compactTextScale : "text-[13px]"
            } leading-relaxed text-white/85`}
            onClick={onLogAreaClick}
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(log.text, nameToId),
            }}
          />
        )}
      </div>
    </div>
  )
}