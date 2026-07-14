"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { appraiserSkillTree, type Branch } from "@/content/appraiser/skilltree"
import defaultProgress from "@/content/appraiser/progress.default.json"

type LogEntry = { date: string; type: "study" | "review"; text: string }
type StarProgress = { acquired: boolean; logs: LogEntry[] }
type ProgressMap = Record<string, StarProgress>

const STORAGE_KEY = "appraiser-skilltree-progress-v1"
const WORLD_WIDTH = 6000 // 배경 이미지가 360도를 표현하는 가상 폭(px)

function formatDateYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}/${m}/${day}`
}

function normalizeAngle(deg: number) {
  let a = deg % 360
  if (a > 180) a -= 360
  if (a < -180) a += 360
  return a
}

// ── 배경 반짝임 캔버스 ────────────────────────────────────────
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
  const [viewAngle, setViewAngle] = useState(0)
  const [stage, setStage] = useState({ width: 1200, height: 800, radius: 700 })
  const [selectedStarId, setSelectedStarId] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressMap>({})
  const [loaded, setLoaded] = useState(false)
  const [studyInput, setStudyInput] = useState("")
  const [reviewInput, setReviewInput] = useState("")

  const dragState = useRef({ active: false, startX: 0, startAngle: 0, moved: false })
  const keysDown = useRef({ a: false, d: false })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 화면 크기 추적
  useEffect(() => {
    function update() {
      setStage({
        width: window.innerWidth,
        height: window.innerHeight,
        radius: Math.min(window.innerWidth * 0.55, 900),
      })
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // A/D 키 회전 (입력창에 포커스가 없을 때만)
  useEffect(() => {
    function isTypingTarget(el: EventTarget | null) {
      const tag = (el as HTMLElement)?.tagName
      return tag === "INPUT" || tag === "TEXTAREA"
    }
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return
      if (e.key === "a" || e.key === "A") keysDown.current.a = true
      if (e.key === "d" || e.key === "D") keysDown.current.d = true
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "a" || e.key === "A") keysDown.current.a = false
      if (e.key === "d" || e.key === "D") keysDown.current.d = false
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)

    let raf = 0
    function loop() {
      if (keysDown.current.a) setViewAngle((v) => v - 1.6)
      if (keysDown.current.d) setViewAngle((v) => v + 1.6)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      cancelAnimationFrame(raf)
    }
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

  const starIndex = useMemo(() => {
    const map = new Map<string, { name: string; branch: Branch }>()
    for (const b of appraiserSkillTree.branches) {
      for (const s of b.stars) map.set(s.id, { name: s.name, branch: b })
    }
    return map
  }, [])

  const totalStars = useMemo(
    () => appraiserSkillTree.branches.reduce((n, b) => n + b.stars.length, 0),
    [],
  )
  const acquiredCount = useMemo(
    () => Object.values(progress).filter((p) => p?.acquired).length,
    [progress],
  )

  function toggleAcquired(starId: string) {
    setProgress((prev) => {
      const cur = prev[starId] ?? { acquired: false, logs: [] }
      return { ...prev, [starId]: { ...cur, acquired: !cur.acquired } }
    })
  }

  // 내용을 적어 저장하면 자동으로 습득 처리됩니다
  function addLog(starId: string, type: "study" | "review", text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setProgress((prev) => {
      const cur = prev[starId] ?? { acquired: false, logs: [] }
      const entry: LogEntry = { date: formatDateYMD(new Date()), type, text: trimmed }
      return { ...prev, [starId]: { acquired: true, logs: [...cur.logs, entry] } }
    })
  }

  function openStar(starId: string) {
    setSelectedStarId(starId)
    setStudyInput("")
    setReviewInput("")
  }

  // ── 드래그 (일정 거리 이상 움직여야 회전으로 인정 → 클릭과 명확히 분리) ──
  function onPointerDown(e: React.PointerEvent) {
    dragState.current = { active: true, startX: e.clientX, startAngle: viewAngle, moved: false }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current.active) return
    const delta = e.clientX - dragState.current.startX
    if (Math.abs(delta) > 4) dragState.current.moved = true
    if (dragState.current.moved) {
      setViewAngle(dragState.current.startAngle - delta * 0.15)
    }
  }
  function onPointerUp() {
    dragState.current.active = false
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    setViewAngle((prev) => prev + delta * 0.15)
  }

  // ── 하나의 큰 별자리: 모든 별을 하나의 좌표계로 배치 ──────────
  const layout = useMemo(() => {
    const starPositions = new Map<string, { x: number; y: number; opacity: number; scale: number }>()
    const branchMeta: {
      branch: Branch
      opacity: number
      centroid: { x: number; y: number }
    }[] = []

    for (const branch of appraiserSkillTree.branches) {
      const rel = normalizeAngle(branch.angle - viewAngle)
      const absRel = Math.abs(rel)
      if (absRel > 130) continue
      const rad = (rel * Math.PI) / 180
      const t = Math.min(absRel / 130, 1)
      const scale = 1 - 0.55 * t
      const opacity = 1 - 0.75 * t
      const screenX = Math.sin(rad) * stage.radius
      const screenY = t * 40

      let cx = 0
      let cy = 0
      for (const s of branch.stars) {
        const absX = stage.width / 2 + screenX + s.x * scale
        const absY = stage.height / 2 + screenY + s.y * scale
        starPositions.set(s.id, { x: absX, y: absY, opacity, scale })
        cx += absX
        cy += absY
      }
      branchMeta.push({ branch, opacity, centroid: { x: cx / branch.stars.length, y: cy / branch.stars.length } })
    }
    return { starPositions, branchMeta }
  }, [viewAngle, stage])

  const selected = selectedStarId ? starIndex.get(selectedStarId) : null

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

  const bgX = -(((viewAngle % 360) + 360) % 360 / 360) * WORLD_WIDTH

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060c] text-white">
      {/* 배경 이미지: 360도 전체를 이 이미지로 감쌈, 밝기 낮춤 */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: "url(/images/study/universe-background.jpg)",
          backgroundRepeat: "repeat-x",
          backgroundSize: `${WORLD_WIDTH}px 100%`,
          backgroundPositionX: `${bgX}px`,
          filter: "brightness(0.42)",
        }}
      />
      {/* 가독성용 비네트 */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)" }}
      />
      <StarfieldCanvas />

      <Link
        href="/"
        className="fixed left-4 top-4 z-50 flex h-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/80 px-4 font-mono text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:border-accent hover:text-accent md:left-8 md:top-8"
      >
        ← BACK
      </Link>

      <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-neutral-700 bg-neutral-900/80 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/80 backdrop-blur-md md:top-8">
        습득 {acquiredCount} / {totalStars}
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
        {/* 연결선: 갈래 내부 + 갈래 사이 크로스링크, 전부 하나의 SVG */}
        <svg className="pointer-events-none fixed inset-0 z-10" width={stage.width} height={stage.height}>
          {layout.branchMeta.flatMap(({ branch, opacity }) =>
            branch.links.map(([a, b], i) => {
              const pa = layout.starPositions.get(a)
              const pb = layout.starPositions.get(b)
              if (!pa || !pb) return null
              const bothAcquired = progress[a]?.acquired && progress[b]?.acquired
              return (
                <line
                  key={`${branch.id}-${i}`}
                  x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke={bothAcquired ? `rgba(255,212,121,${opacity * 0.7})` : `rgba(255,255,255,${opacity * 0.18})`}
                  strokeWidth={1}
                />
              )
            }),
          )}
          {appraiserSkillTree.crossLinks.map(([a, b], i) => {
            const pa = layout.starPositions.get(a)
            const pb = layout.starPositions.get(b)
            if (!pa || !pb) return null
            const bothAcquired = progress[a]?.acquired && progress[b]?.acquired
            const op = Math.min(pa.opacity, pb.opacity)
            return (
              <line
                key={`cross-${i}`}
                x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke={bothAcquired ? `rgba(255,212,121,${op * 0.6})` : `rgba(140,170,255,${op * 0.25})`}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )
          })}
        </svg>

        {/* 갈래 이름표 */}
        {layout.branchMeta.map(({ branch, opacity, centroid }) => (
          <p
            key={branch.id}
            className={`pointer-events-none fixed z-10 -translate-x-1/2 whitespace-nowrap font-mono text-[0.7rem] uppercase tracking-[0.2em] font-[family-name:var(--font-kr)] ${
              branch.tier === 2 ? "text-accent" : "text-white/90"
            }`}
            style={{ left: centroid.x, top: centroid.y - 100, opacity }}
          >
            {branch.title} · {branch.stars.filter((s) => progress[s.id]?.acquired).length}/{branch.stars.length}
          </p>
        ))}

        {/* 별 */}
        {layout.branchMeta.flatMap(({ branch }) =>
          branch.stars.map((s) => {
            const pos = layout.starPositions.get(s.id)
            if (!pos) return null
            const acquired = Boolean(progress[s.id]?.acquired)
            const isRoot = branch.tier === 0
            const delay = (s.id.charCodeAt(0) + s.id.charCodeAt(s.id.length - 1)) % 30
            return (
              <button
                key={s.id}
                onClick={() => openStar(s.id)}
                aria-label={s.name}
                className={`fixed -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
                  isRoot
                    ? "star-pulse bg-white shadow-[0_0_16px_6px_rgba(255,255,255,0.5)]"
                    : acquired
                      ? "star-pulse bg-amber-300 shadow-[0_0_12px_4px_rgba(255,212,121,0.55)]"
                      : "star-twinkle bg-slate-300/70"
                }`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: isRoot ? 20 : 14,
                  height: isRoot ? 20 : 14,
                  transform: `translate(-50%, -50%) scale(${pos.scale})`,
                  opacity: pos.opacity,
                  ["--twinkle-duration" as string]: `${3 + (delay % 3)}s`,
                  animationDelay: `${delay * 0.1}s`,
                  zIndex: 20,
                }}
              />
            )
          }),
        )}
      </div>

      {/* 별 상세 패널 */}
      {selected && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-neutral-800 bg-neutral-950/95 p-6 backdrop-blur-md md:p-8">
          <button onClick={() => setSelectedStarId(null)} className="absolute right-4 top-4 text-white/50 transition-colors hover:text-white">
            ✕
          </button>

          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-accent">{selected.branch.title}</p>
          <h2 className="mt-1 font-[family-name:var(--font-kr)] text-xl font-bold leading-snug">{selected.name}</h2>

          <button
            onClick={() => selectedStarId && toggleAcquired(selectedStarId)}
            className={`mt-4 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              selectedStarId && progress[selectedStarId]?.acquired
                ? "border-amber-300 bg-amber-300/10 text-amber-300"
                : "border-neutral-700 text-white/60 hover:border-white/40"
            }`}
          >
            {selectedStarId && progress[selectedStarId]?.acquired ? "습득 완료" : "미습득"}
          </button>

          {/* 학습 입력 */}
          <div className="mt-8">
            <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-white/50">학습 내용</p>
            <div className="flex gap-2">
              <input
                value={studyInput}
                onChange={(e) => setStudyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedStarId) {
                    addLog(selectedStarId, "study", studyInput)
                    setStudyInput("")
                  }
                }}
                placeholder="오늘의 학습 내용을 적어주세요"
                className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 font-[family-name:var(--font-kr)] text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
              />
              <button
                onClick={() => {
                  if (selectedStarId) {
                    addLog(selectedStarId, "study", studyInput)
                    setStudyInput("")
                  }
                }}
                className="shrink-0 rounded border border-neutral-700 px-3 font-mono text-xs text-white/70 transition-colors hover:border-accent hover:text-accent"
              >
                확인
              </button>
            </div>
          </div>

          {/* 복습 입력 */}
          <div className="mt-4">
            <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-white/50">복습 내용</p>
            <div className="flex gap-2">
              <input
                value={reviewInput}
                onChange={(e) => setReviewInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedStarId) {
                    addLog(selectedStarId, "review", reviewInput)
                    setReviewInput("")
                  }
                }}
                placeholder="오늘의 복습 내용을 적어주세요"
                className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 font-[family-name:var(--font-kr)] text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
              />
              <button
                onClick={() => {
                  if (selectedStarId) {
                    addLog(selectedStarId, "review", reviewInput)
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
            {selectedStarId &&
              (progress[selectedStarId]?.logs ?? [])
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
                    <p className="font-[family-name:var(--font-kr)] text-sm text-white/85">{log.text}</p>
                  </div>
                ))}
            {selectedStarId && (progress[selectedStarId]?.logs?.length ?? 0) === 0 && (
              <p className="font-[family-name:var(--font-kr)] text-sm text-white/30">아직 기록이 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}