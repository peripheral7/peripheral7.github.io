import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { fmt, type CandidateResult, type HubResult } from '../scoring'
import { hubEmoji, type ModeKey } from '../data'
import { MODE_INFO } from './SettingsPopover'
import { catName, mins, pn, rankText, t } from '../i18n'

// 왼쪽 위 "교통평점" 카드(한 장) — 고른 후보지(이름·3D 집·종합 원형)·주요 교통수단·수단별 교통평점 눈금 막대.
// 라이프스타일은 카드 오른쪽 위 ⚙ 에서 고른다. 후보지 넘기기(Swipe):
//  - 카드 안쪽 왼쪽·오른쪽 가장자리 띠(44px)에 마우스를 올리면 어두운 그라데이션 + ‹ › → 누르면 앞·뒤 순위 후보지(끝에서는 반대 끝으로 돈다)
//  - 카드를 누른 채 옆으로 끌면 카드처럼 따라오고, 충분히 끌고 놓으면 넘어간다(살짝이면 제자리로)
//  - 넘어갈 때 지금 내용이 나간 쪽 반대편에서 새 후보지가 미끄러져 들어온다(번호 단추로 고를 때도 순위 방향대로)

/** 수단 교통평점 = 그 수단을 점수에 넣은 목적지들의 점수를 주 방문 비율로 평균(넣은 목적지가 없으면 null) */
export function modeSummary(r: CandidateResult, mode: ModeKey): number | null {
  const rows = r.hubs.filter((h) => h.used.includes(mode))
  const w = rows.reduce((a, h) => a + h.share, 0)
  if (!rows.length || w === 0) return null
  const v = (h: HubResult) => (mode === 'walk' ? h.scores.walk ?? 0 : mode === 'bike' ? h.scores.bike ?? 0 : h.scores[mode])
  return rows.reduce((a, h) => a + v(h) * h.share, 0) / w
}

const Ticks = ({ value, mode }: { value: number | null; mode: ModeKey }) => (
  <span className={`ticks ${mode}`} aria-hidden>
    <span style={{ width: `${value === null ? 0 : Math.max(0, Math.min(10, value)) * 10}%` }} />
  </span>
)

/** 카드 가운데: 큰 3D 집을 얇은 원이 둘러싸고, 원 테두리를 종합 점수 비율(0~100%)만큼 채운다(12시 방향부터 시계 방향, 숫자 꼬리표 없음).
 *  원 아래에 점수. */
export function HouseRing({ value, rank }: { value: number; rank: number }) {
  const pct = Math.max(0, Math.min(10, value)) * 10
  const R = 47.5
  return (
    <div className="house-ring">
      <div className="hr-circle">
        <svg viewBox="0 0 100 100" className="hr-svg" aria-hidden>
          <circle className="ring-track" cx="50" cy="50" r={R} />
          <circle className="ring-arc" cx="50" cy="50" r={R} pathLength={100} strokeDasharray={`${pct} 100`} transform="rotate(-90 50 50)" />
        </svg>
        <House3D rank={rank} />
      </div>
      <p className="hr-score"><b>{fmt(value)}</b><small>/ 10</small></p>
      <p className="hr-rank">{t('종합', 'Overall')} {rankText(rank)}</p>
    </div>
  )
}

/** 3D 집(아이소메트릭) — 지붕 색은 순위(1위 초록 → 아래로 갈수록 회색빛) */
export function House3D({ rank }: { rank: number }) {
  const roof = ['#3f9a62', '#5e8f9e', '#8a7fa8', '#a08868'][Math.min(3, Math.max(0, rank - 1))]
  return (
    <svg className="house3d" viewBox="0 0 120 110" aria-hidden>
      <defs>
        <linearGradient id="h3-left" x1="0" x2="1"><stop offset="0" stopColor="#f4f1ea" /><stop offset="1" stopColor="#e6e1d6" /></linearGradient>
        <linearGradient id="h3-right" x1="0" x2="1"><stop offset="0" stopColor="#d6d0c3" /><stop offset="1" stopColor="#c8c1b2" /></linearGradient>
      </defs>
      <ellipse cx="60" cy="98" rx="46" ry="9" fill="rgba(24,39,56,.10)" />
      {/* 벽: 왼쪽 앞면 · 오른쪽 옆면 */}
      <path d="M18 56 L56 76 L56 100 L18 80 Z" fill="url(#h3-left)" stroke="#b9b2a3" strokeWidth=".8" />
      <path d="M56 76 L102 52 L102 76 L56 100 Z" fill="url(#h3-right)" stroke="#b9b2a3" strokeWidth=".8" />
      {/* 지붕: 박공 앞 삼각 + 두 지붕면 */}
      <path d="M18 56 L37 30 L56 76 Z" fill="#efe9dc" stroke="#b9b2a3" strokeWidth=".8" />
      <path d="M37 30 L83 6 L102 52 L56 76 Z" fill={roof} />
      <path d="M37 30 L83 6 L86 13 L40 37 Z" fill="rgba(255,255,255,.22)" />
      <path d="M14 58 L37 27 L40 31 L18 61 Z" fill={roof} opacity=".85" />
      {/* 문·창 */}
      <path d="M31 70 L41 75 L41 92 L31 87 Z" fill="#6f5a43" />
      <circle cx="39" cy="83" r=".9" fill="#e9d9b5" />
      <path d="M66 74 L76 69 L76 78 L66 83 Z" fill="#cfe3ee" stroke="#9fb7c4" strokeWidth=".7" />
      <path d="M84 65 L94 60 L94 69 L84 74 Z" fill="#cfe3ee" stroke="#9fb7c4" strokeWidth=".7" />
      <path d="M71 71.5 L71 80.5 M89 62.5 L89 71.5" stroke="#9fb7c4" strokeWidth=".6" />
      {/* 굴뚝 */}
      <path d="M74 14 L80 11 L80 22 L74 25 Z" fill="#b9a58a" />
    </svg>
  )
}

/** 카드 안쪽 가장자리 띠: 마우스를 올리면 어두운 그라데이션 + ‹ › (넘길 곳이 없으면 그리지 않는다) */
export function EdgeNav({ onPrev, onNext }: { onPrev?: () => void; onNext?: () => void }) {
  return (
    <>
      {onPrev && <button type="button" className="edge-nav prev" aria-label={t('앞 순위 후보지', 'Previous-ranked candidate')} onClick={onPrev}><span aria-hidden>‹</span></button>}
      {onNext && <button type="button" className="edge-nav next" aria-label={t('다음 순위 후보지', 'Next-ranked candidate')} onClick={onNext}><span aria-hidden>›</span></button>}
    </>
  )
}

const SWIPE_MIN = 60 // 이만큼(px) 끌고 놓으면 넘어간다(빠르게 튕기면 더 짧아도)
const OUT_MS = 170, IN_MS = 260
/** 끌어서 넘기는 카드 내용. pos = 지금 후보지의 순위 자리(0부터), count = 후보지 수.
 *  go(+1|-1) 로 넘기면 나가는 애니메이션 뒤에 onMove 를 부르고, pos 가 바뀌면 그 방향 반대편에서 들어온다. */
export function Swipe({ pos, count, onMove, api, children }: { pos: number; count: number; onMove: (d: 1 | -1) => void; api?: SwipeApi; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [x, setX] = useState(0) // 끄는 중 이동량(px)
  const [anim, setAnim] = useState<'' | 'snap' | 'out' | 'in'>('')
  const dir = useRef<1 | -1 | 0>(0) // 우리가 넘긴 방향(번호 단추로 고르면 0 → 순위 차이로)
  const drag = useRef<{ id: number; x0: number; y0: number; t0: number; on: boolean; moved: boolean } | null>(null)
  const prevPos = useRef(pos)
  const busy = useRef(false)
  const w = () => box.current?.offsetWidth ?? 300
  const go = (d: 1 | -1) => {
    if (busy.current || count < 2) return
    busy.current = true
    dir.current = d
    setAnim('out'); setX(-d * w())
    setTimeout(() => onMove(d), OUT_MS)
  }
  // 새 후보지: 들어올 쪽 바깥에 놓고 → 다음 프레임에 0 으로
  useLayoutEffect(() => {
    if (prevPos.current === pos) return
    const d = dir.current || (pos > prevPos.current ? 1 : -1)
    prevPos.current = pos; dir.current = 0
    setAnim(''); setX(d * w() * 0.6)
    // (rAF 는 창이 가려져 있으면 멈추므로 타이머로)
    const r = setTimeout(() => { setAnim('in'); setX(0) }, 20)
    const t = setTimeout(() => { setAnim(''); setX(0); busy.current = false }, IN_MS + 60)
    return () => { clearTimeout(r); clearTimeout(t); setX(0); busy.current = false }
  }, [pos]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (api) api.current = go })

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || busy.current || count < 2) return
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea, [data-no-swipe]')) return
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), on: false, moved: false }
  }
  const onMoveP = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0
    if (!d.on) {
      if (Math.abs(dx) < 6) return
      if (Math.abs(dy) > Math.abs(dx)) { drag.current = null; return } // 세로로 움직이면 스크롤에 양보
      d.on = true; d.moved = true
      box.current?.setPointerCapture(e.pointerId)
      setAnim('')
    }
    setX(dx)
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d || !d.on) return
    const dx = e.clientX - d.x0, v = dx / Math.max(1, performance.now() - d.t0) // px/ms
    if (Math.abs(dx) > SWIPE_MIN || (Math.abs(v) > 0.5 && Math.abs(dx) > 20)) go(dx < 0 ? 1 : -1)
    else { setAnim('snap'); setX(0) }
    // 끌고 난 뒤의 click 은 버린다(안의 칸이 눌리지 않게)
    const stop = (ev: MouseEvent) => { ev.stopPropagation(); ev.preventDefault() }
    window.addEventListener('click', stop, { capture: true, once: true })
    setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 0)
  }
  const tilt = Math.max(-4, Math.min(4, x / 60))
  const fade = 1 - Math.min(0.55, Math.abs(x) / (w() * 1.4))
  const ms = anim === 'out' ? OUT_MS : anim === 'in' ? IN_MS : anim === 'snap' ? 220 : 0
  return (
    <div ref={box} className={'swipe' + (drag.current?.on ? ' dragging' : '')} onPointerDown={onDown} onPointerMove={onMoveP} onPointerUp={onUp} onPointerCancel={onUp}
      style={{ transform: `translateX(${x}px) rotate(${tilt}deg)`, opacity: fade, transition: ms ? `transform ${ms}ms ${anim === 'out' ? 'ease-in' : 'cubic-bezier(.2,.8,.2,1)'}, opacity ${ms}ms` : 'none' }}>
      {children}
    </div>
  )
}
/** 바깥(가장자리 ‹ ›)에서 Swipe 의 넘기기를 부르기 위한 손잡이 */
export type SwipeApi = React.MutableRefObject<((d: 1 | -1) => void) | null>

/** 주요 교통수단 한 줄: 주 방문이 가장 많은 목적지에 실제로 가장 크게 반영된 수단 */
export function MainMode({ r }: { r: CandidateResult }) {
  const h = [...r.hubs].sort((a, b) => b.share - a.share)[0]
  if (!h) return null
  const m = h.main, tr = h.trip
  const min = m === 'transit' ? tr.transit : m === 'car' ? tr.carRush : m === 'walk' ? tr.walk : tr.bike
  const extra = m === 'transit' && tr.routes.length ? ` · ${[...new Set(tr.routes.map((x) => pn(x.replace(/(수원|용인|오산|성남|예수원|화성)$/, ''))))].slice(0, 2).join('→')}` : m === 'car' ? t(' (출퇴근)', ' (rush hour)') : ''
  return (
    <p className="main-mode">
      <span className="main-mode-label">{t('주요 교통수단', 'Main mode')}</span>
      <b className={`mm ${m}`}>{MODE_INFO[m].emoji} {MODE_INFO[m].label}</b>
      <small>{hubEmoji(h.hub.category)} {catName(h.hub.category)} {mins(min)}{extra}{h.mode !== 'auto' ? t(' · 직접 지정', ' · set manually') : ''}</small>
    </p>
  )
}

/** 종합 원형 + 수단별 교통평점 눈금 막대(카드 안에 바로 — 따로 묶은 칸 없음) */
export function ScoreBlock({ r, modes }: { r: CandidateResult; modes: ModeKey[] }) {
  return (
    <div className="score-block">
      <HouseRing value={r.total} rank={r.rank} />
      <MainMode r={r} />
      <div className="mode-rows">
        {modes.map((m) => {
          const v = modeSummary(r, m)
          const detail = r.hubs.flatMap((h) => {
            const c = catName(h.hub.category)
            if (m === 'transit') return h.transitPending ? [] : h.transitSkipped ? [] : [`${c} ${mins(h.trip.transit)}${h.trip.transitSource === 'est' ? t('(추정)', ' (est.)') : ''}`]
            if (m === 'car') return [`${c} ${mins(`${h.trip.carRush}/${h.trip.carFree}`)}`]
            if (m === 'walk') return h.scores.walk !== null ? [`${c} ${mins(h.trip.walk)}`] : []
            return h.scores.bike !== null ? [`${c} ${mins(h.trip.bike)}`] : []
          }).join(' · ')
          return (
            <div className={'mode-row' + (v === null ? ' off' : '')} key={m}>
              <span className={`dot ${m}`} />
              <div className="mode-text"><b>{MODE_INFO[m].label}</b><small>{m === 'transit' && r.hubs.some((h) => h.transitPending) ? t('대중교통 경로 찾는 중', 'Finding transit route') : detail || t('이 후보지에서는 안 씀', 'Not used for this candidate')}</small></div>
              <Ticks value={v} mode={m} />
              <em>{v === null ? '—' : fmt(v)}</em>
            </div>
          )
        })}
      </div>
    </div>
  )
}
