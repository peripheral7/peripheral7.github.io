import { useEffect, useRef, useState } from 'react'
import { fmt, WALK_LIMIT, type CandidateResult, type HubResult } from '../scoring'

// 선택한 후보지 한 곳의 카드. 좌우로 넘기는 것은 "이 후보지에서 각 방문지(학교·본가 등)까지"의 내용이다.
// 후보지를 바꾸는 것은 위쪽 번호 단추·지도 핀·아래 비교표에서 한다.

type Props = { results: CandidateResult[]; active: number; onSelect: (index: number) => void }

const Bar = ({ value }: { value: number }) => (
  <span className="bar" aria-hidden><span style={{ width: `${Math.max(0, Math.min(10, value)) * 10}%` }} /></span>
)

function carNote(r: HubResult) {
  const { free, rush } = r.trip.carSource
  if (free && rush) return `네이버 실측 · 출퇴근 ${rush.at.slice(5)} / 여유 ${free.at.slice(5)}`
  if (free || rush) return `네이버 실측 일부(${free ? '여유' : '출퇴근'}) · 나머지 추정`
  return '거리 기반 추정'
}

function HubSlide({ r, index }: { r: HubResult; index: number }) {
  const { trip, scores } = r
  return (
    <article className="slide">
      <div className="hub-head">
        <span className="hub-mark">{index + 1}</span>
        <div><small>{r.hub.category} · {trip.km.toFixed(1)}km · 반영 {Math.round(r.share * 100)}%</small><b>{r.hub.name}</b></div>
        <strong>{fmt(r.hubScore)}</strong>
      </div>
      <div className="mode transit">
        <span className="mode-name">대중교통</span>
        <div className="mode-main"><b>{trip.transit}분</b><small>대기 {trip.wait}분 · 도보 {trip.access}분 · 환승 {trip.transfers}회</small></div>
        <Bar value={scores.transit} /><em>{fmt(scores.transit)}</em>
      </div>
      <div className="mode car">
        <span className="mode-name">차량</span>
        <div className="mode-main"><b>{trip.carRush}분 / {trip.carFree}분</b><small>출퇴근 / 여유 · 정체 {scores.carRatio.toFixed(2)}배 · {carNote(r)}</small></div>
        <Bar value={scores.car} /><em>{fmt(scores.car)}</em>
      </div>
      {scores.walk !== null ? (
        <div className="mode walk">
          <span className="mode-name">도보</span>
          <div className="mode-main"><b>{trip.walk}분</b><small>{WALK_LIMIT}분 이내만 표시</small></div>
          <Bar value={scores.walk} /><em>{fmt(scores.walk)}</em>
        </div>
      ) : r.walkCounts ? (
        <p className="walk-note">도보 {WALK_LIMIT}분 초과 — 다른 후보지는 걸어갈 수 있어 도보 0점으로 계산</p>
      ) : null}
    </article>
  )
}

export function CandidateCard({ results, active, onSelect }: Props) {
  const r = results[active]
  const [slide, setSlide] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const settle = useRef<number | undefined>(undefined)
  const n = r.hubs.length

  // 단추·점으로 바꾸면 그 장으로 넘긴다
  useEffect(() => {
    const el = track.current
    if (el && Math.round(el.scrollLeft / el.clientWidth) !== slide) el.scrollTo({ left: slide * el.clientWidth, behavior: 'smooth' })
  }, [slide])
  // 후보지를 바꿔도 보고 있던 방문지는 그대로 둔다(같은 방문지끼리 바로 비교)
  useEffect(() => {
    const el = track.current
    if (el) el.scrollTo({ left: slide * el.clientWidth })
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      const el = track.current
      if (!el) return
      const i = Math.round(el.scrollLeft / el.clientWidth)
      if (i !== slide && i >= 0 && i < n) setSlide(i)
    }, 120)
  }

  return (
    <div className="glass candidate-card">
      <div className="pick" role="tablist" aria-label="후보지 선택">
        {results.map((x, i) => (
          <button key={x.candidate.id} role="tab" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => onSelect(i)} title={x.candidate.name}>{i + 1}</button>
        ))}
      </div>
      <div className="cand-head">
        <div>
          <span className="tag">후보 {String(active + 1).padStart(2, '0')} · 종합 {r.rank}위</span>
          <h3>{r.candidate.name}</h3>
          <p>{r.candidate.address}</p>
        </div>
        <div className="total"><b>{fmt(r.total)}</b><span>/10</span></div>
      </div>
      <div className="slide-nav">
        <button aria-label="이전 방문지" onClick={() => setSlide((slide - 1 + n) % n)} disabled={n < 2}>‹</button>
        <div className="hub-tabs">
          {r.hubs.map((h, i) => (
            <button key={h.hub.id} className={i === slide ? 'on' : ''} onClick={() => setSlide(i)}>{h.hub.category}</button>
          ))}
        </div>
        <button aria-label="다음 방문지" onClick={() => setSlide((slide + 1) % n)} disabled={n < 2}>›</button>
      </div>
      <div className="track" ref={track} onScroll={onScroll}>
        {r.hubs.map((h, i) => <HubSlide key={h.hub.id} r={h} index={i} />)}
      </div>
    </div>
  )
}
