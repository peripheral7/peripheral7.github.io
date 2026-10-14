import type { ReactNode } from 'react'
import { fmt, type CandidateResult, type HubResult } from '../scoring'
import { hubEmoji, type ModeKey } from '../data'
import { MODE_INFO } from './SettingsPopover'

// 왼쪽 위 "교통평점" 카드 — 고른 후보지(3D 집 그림·이름·주요 교통수단) + 종합 원형 그래프 + 수단별 교통평점 눈금 막대.
// 카드 안쪽 왼쪽·오른쪽 가장자리에 마우스를 올리면 세로로 긴 은은한 ‹ › 가 나타나 앞·뒤 순위 후보지로 넘긴다(넘길 곳이 있을 때만).

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

/** 카드 가운데: 큰 3D 집을 원이 둘러싸고, 원 테두리를 종합 점수 비율(0~100%)만큼 채운다(12시 방향부터 시계 방향).
 *  채운 끝에 작은 퍼센트 꼬리표, 원 아래에 점수. */
export function HouseRing({ value, rank }: { value: number; rank: number }) {
  const pct = Math.max(0, Math.min(10, value)) * 10
  const a = ((pct / 100) * 360 - 90) * (Math.PI / 180) // 채운 끝 각도
  const R = 46, cx = 50 + R * Math.cos(a), cy = 50 + R * Math.sin(a)
  return (
    <div className="house-ring">
      <div className="hr-circle">
        <svg viewBox="0 0 100 100" className="hr-svg" aria-hidden>
          <circle className="ring-track" cx="50" cy="50" r={R} />
          <circle className="ring-arc" cx="50" cy="50" r={R} pathLength={100} strokeDasharray={`${pct} 100`} transform="rotate(-90 50 50)" />
        </svg>
        <House3D rank={rank} />
        <span className="hr-pct" style={{ left: `${cx}%`, top: `${cy}%` }}>{Math.round(pct)}%</span>
      </div>
      <p className="hr-score"><b>{fmt(value)}</b><small>/ 10</small></p>
      <p className="hr-rank">종합 {rank}위</p>
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

/** 카드 안쪽 가장자리의 세로 ‹ › (넘길 곳이 없으면 그리지 않는다) */
export function EdgeNav({ onPrev, onNext }: { onPrev?: () => void; onNext?: () => void }) {
  return (
    <>
      {onPrev && <button type="button" className="edge-nav prev" aria-label="앞 순위 후보지" onClick={onPrev}><span aria-hidden>‹</span></button>}
      {onNext && <button type="button" className="edge-nav next" aria-label="다음 순위 후보지" onClick={onNext}><span aria-hidden>›</span></button>}
    </>
  )
}

/** 주요 교통수단 한 줄: 주 방문이 가장 많은 목적지에 실제로 가장 크게 반영된 수단 */
export function MainMode({ r }: { r: CandidateResult }) {
  const h = [...r.hubs].sort((a, b) => b.share - a.share)[0]
  if (!h) return null
  const m = h.main, t = h.trip
  const min = m === 'transit' ? t.transit : m === 'car' ? t.carRush : m === 'walk' ? t.walk : t.bike
  const extra = m === 'transit' && t.routes.length ? ` · ${[...new Set(t.routes.map((x) => x.replace(/(수원|용인|오산|성남|예수원|화성)$/, '')))].slice(0, 2).join('→')}` : m === 'car' ? ' (출퇴근)' : ''
  return (
    <p className="main-mode">
      <span className="main-mode-label">주요 교통수단</span>
      <b className={`mm ${m}`}>{MODE_INFO[m].emoji} {MODE_INFO[m].label}</b>
      <small>{hubEmoji(h.hub.category)} {h.hub.category} {min}분{extra}{h.mode !== 'auto' ? ' · 직접 지정' : ''}</small>
    </p>
  )
}

/** 종합 원형 + 수단별 교통평점 눈금 막대 */
export function ScoreBlock({ r, modes, action }: { r: CandidateResult; modes: ModeKey[]; action: ReactNode }) {
  return (
    <div className="score-block">
      <div className="panel-head"><h2>교통평점</h2>{action}</div>
      <HouseRing value={r.total} rank={r.rank} />
      <MainMode r={r} />
      <div className="mode-rows">
        {modes.map((m) => {
          const v = modeSummary(r, m)
          const detail = r.hubs.flatMap((h) => {
            if (m === 'transit') return h.transitPending ? [] : h.transitSkipped ? [] : [`${h.hub.category} ${h.trip.transit}분${h.trip.transitSource === 'est' ? '(추정)' : ''}`]
            if (m === 'car') return [`${h.hub.category} ${h.trip.carRush}/${h.trip.carFree}분`]
            if (m === 'walk') return h.scores.walk !== null ? [`${h.hub.category} ${h.trip.walk}분`] : []
            return h.scores.bike !== null ? [`${h.hub.category} ${h.trip.bike}분`] : []
          }).join(' · ')
          return (
            <div className={'mode-row' + (v === null ? ' off' : '')} key={m}>
              <span className={`dot ${m}`} />
              <div className="mode-text"><b>{MODE_INFO[m].label}</b><small>{m === 'transit' && r.hubs.some((h) => h.transitPending) ? '대중교통 경로 찾는 중' : detail || '이 후보지에서는 안 씀'}</small></div>
              <Ticks value={v} mode={m} />
              <em>{v === null ? '—' : fmt(v)}</em>
            </div>
          )
        })}
      </div>
    </div>
  )
}
