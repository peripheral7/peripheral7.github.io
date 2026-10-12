import { useEffect, useRef } from 'react'
import { fmt, WALK_LIMIT, type CandidateResult, type HubResult } from '../scoring'

type Props = { results: CandidateResult[]; active: number; onChange: (index: number) => void }

const Bar = ({ value }: { value: number }) => (
  <span className="bar" aria-hidden><span style={{ width: `${Math.max(0, Math.min(10, value)) * 10}%` }} /></span>
)

function HubBlock({ r, index }: { r: HubResult; index: number }) {
  const { trip, scores } = r
  return (
    <div className="hub-block">
      <div className="hub-head">
        <span className="hub-mark">{index + 1}</span>
        <div><small>{r.hub.category} · {trip.km.toFixed(1)}km · 반영 {Math.round(r.share * 100)}%</small><b>{r.hub.name}</b></div>
        <strong>{fmt(r.hubScore)}</strong>
      </div>
      <div className="mode">
        <span className="mode-name">대중교통</span>
        <div className="mode-main"><b>{trip.transit}분</b><small>대기 {trip.wait}분 · 도보 {trip.access}분 · 환승 {trip.transfers}회</small></div>
        <Bar value={scores.transit} /><em>{fmt(scores.transit)}</em>
      </div>
      <div className="mode">
        <span className="mode-name">차량</span>
        <div className="mode-main"><b>{trip.carRush}분 / {trip.carFree}분</b><small>출퇴근 / 여유 · 정체 {scores.carRatio.toFixed(2)}배</small></div>
        <Bar value={scores.car} /><em>{fmt(scores.car)}</em>
      </div>
      {scores.walk === null && r.walkCounts && (
        <p className="walk-note">도보 {WALK_LIMIT}분 초과 — 다른 후보지는 걸어갈 수 있어 도보 0점으로 계산</p>
      )}
      {scores.walk !== null && (
        <div className="mode">
          <span className="mode-name">도보</span>
          <div className="mode-main"><b>{trip.walk}분</b><small>{WALK_LIMIT}분 이내만 표시</small></div>
          <Bar value={scores.walk} /><em>{fmt(scores.walk)}</em>
        </div>
      )}
    </div>
  )
}

export function CandidateCarousel({ results, active, onChange }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const settle = useRef<number | undefined>(undefined)

  // 바깥(지도 핀)에서 후보가 바뀌면 그 장으로 넘긴다
  useEffect(() => {
    const el = track.current
    if (!el) return
    const cur = Math.round(el.scrollLeft / el.clientWidth)
    if (cur !== active) el.scrollTo({ left: active * el.clientWidth, behavior: 'smooth' })
  }, [active])

  // 손으로 넘기면 멈춘 자리의 후보로 맞춘다
  const onScroll = () => {
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      const el = track.current
      if (!el) return
      const i = Math.round(el.scrollLeft / el.clientWidth)
      if (i !== active && i >= 0 && i < results.length) onChange(i)
    }, 120)
  }
  const go = (d: number) => onChange((active + d + results.length) % results.length)

  return (
    <div className="glass carousel">
      <div className="carousel-head">
        <div><h2>후보지별 점수</h2><small>좌우로 넘겨 후보지를 비교합니다</small></div>
        <div className="arrows">
          <button aria-label="이전 후보지" onClick={() => go(-1)}>‹</button>
          <span className="count">{active + 1} / {results.length}</span>
          <button aria-label="다음 후보지" onClick={() => go(1)}>›</button>
        </div>
      </div>
      <div className="track" ref={track} onScroll={onScroll}>
        {results.map((r, i) => (
          <article className="slide" key={r.candidate.id} aria-hidden={i !== active}>
            <div className="slide-head">
              <div>
                <span className="tag">후보 {String(i + 1).padStart(2, '0')} · 종합 {r.rank}위</span>
                <h3>{r.candidate.name}</h3>
                <p>{r.candidate.address}</p>
              </div>
              <div className="total"><b>{fmt(r.total)}</b><span>/10</span></div>
            </div>
            <div className="hub-grid">
              {r.hubs.map((h, hi) => <HubBlock key={h.hub.id} r={h} index={hi} />)}
            </div>
          </article>
        ))}
      </div>
      <div className="dots">
        {results.map((r, i) => (
          <button key={r.candidate.id} className={i === active ? 'on' : ''} aria-label={`${r.candidate.name} 보기`} onClick={() => onChange(i)} />
        ))}
      </div>
    </div>
  )
}
