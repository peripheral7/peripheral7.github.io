import type { ReactNode } from 'react'
import { fmt, type CandidateResult } from '../scoring'

// ── 고른 후보지의 수단별 점수(게이지 + 눈금 막대) ──────────────────────
// 수단 점수는 목적지별 점수를 "월 왕복 비율"로 평균한 값(종합 점수와 같은 비율). 도보는 걸어갈 수 있는 목적지만.

export type ModeKey = 'transit' | 'car' | 'walk'
export const MODE_LABEL: Record<ModeKey, string> = { transit: '대중교통', car: '차량', walk: '도보' }

export function modeSummary(r: CandidateResult, mode: ModeKey): number | null {
  const rows = r.hubs.filter((h) => mode !== 'walk' || h.walkCounts)
  const w = rows.reduce((a, h) => a + h.share, 0)
  if (!rows.length || w === 0) return null
  return rows.reduce((a, h) => a + (mode === 'walk' ? h.scores.walk ?? 0 : h.scores[mode]) * h.share, 0) / w
}

const Ticks = ({ value, mode }: { value: number | null; mode: ModeKey }) => (
  <span className={`ticks ${mode}`} aria-hidden>
    <span style={{ width: `${value === null ? 0 : Math.max(0, Math.min(10, value)) * 10}%` }} />
  </span>
)

function Gauge({ value }: { value: number }) {
  // 완만한 호 위에 점수 위치(0~10)를 찍는다
  const t = Math.max(0, Math.min(1, value / 10))
  const x = 10 + t * 280
  const y = 62 - Math.sin(t * Math.PI) * 26
  return (
    <svg className="gauge" viewBox="0 0 300 74" aria-hidden>
      <defs>
        <linearGradient id="g-arc" x1="0" x2="1">
          <stop offset="0" stopColor="#d96b4b" /><stop offset="0.5" stopColor="#e3c66b" /><stop offset="1" stopColor="#7fa35a" />
        </linearGradient>
      </defs>
      <path d="M10 62 Q150 10 290 62" fill="none" stroke="url(#g-arc)" strokeWidth="3" strokeLinecap="round" />
      <circle cx={x} cy={y} r="6" fill="#fff" stroke="#1f1f1c" strokeWidth="2.5" />
      <text x="10" y="74" className="gauge-end">0</text>
      <text x="290" y="74" textAnchor="end" className="gauge-end">10</text>
    </svg>
  )
}

export function ModeScorePanel({ r, action }: { r: CandidateResult; action: ReactNode }) {
  const modes: ModeKey[] = ['transit', 'car', 'walk']
  return (
    <div className="panel mode-panel">
      <div className="panel-head"><h2>이동수단별 점수</h2>{action}</div>
      <div className="gauge-wrap">
        <span className="gauge-badge">{fmt(r.total)}</span>
        <Gauge value={r.total} />
        <p className="gauge-caption"><b>{r.candidate.name}</b> · 종합 {r.rank}위</p>
      </div>
      <div className="mode-rows">
        {modes.map((m) => {
          const v = modeSummary(r, m)
          const detail = r.hubs.map((h) => {
            if (m === 'transit') return `${h.hub.category} ${h.trip.transit}분`
            if (m === 'car') return `${h.hub.category} ${h.trip.carRush}/${h.trip.carFree}분`
            return h.scores.walk !== null ? `${h.hub.category} ${h.trip.walk}분` : `${h.hub.category} 30분+`
          }).join(' · ')
          return (
            <div className="mode-row" key={m}>
              <span className={`dot ${m}`} />
              <div className="mode-text"><b>{MODE_LABEL[m]}</b><small>{detail}</small></div>
              <Ticks value={v} mode={m} />
              <em>{v === null ? '—' : fmt(v)}</em>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 오른쪽 위: 앞으로 넣을 입지 요인 자리 ─────────────────────────────
export function FactorsPanel() {
  const items = [
    { name: '도보 5분 상권', note: '편의점·마트·카페·병원 등 걸어서 5분 안의 생활 업종' },
    { name: '산책', note: '공원·하천변·녹지까지의 거리와 넓이' },
    { name: '평화로움', note: '큰길·유흥가·소음원과의 거리' },
    { name: '쾌적함', note: '녹지 비율·혼잡도 등' },
  ]
  return (
    <div className="panel factors">
      <div className="panel-head"><h2>입지 요인</h2><span className="soon">준비 중</span></div>
      <p className="muted">후보지별로 아래 지수를 더할 예정입니다.</p>
      {items.map((x) => (
        <div className="factor" key={x.name}>
          <div><b>{x.name}</b><small>{x.note}</small></div>
          <span className="ticks empty" aria-hidden />
        </div>
      ))}
    </div>
  )
}
