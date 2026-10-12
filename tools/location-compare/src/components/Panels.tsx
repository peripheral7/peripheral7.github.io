import { useEffect, useRef, useState, type ReactNode } from 'react'
import { fmt, type CandidateResult } from '../scoring'
import { CAT_RADIUS_M, type CatIndex } from '../cats'
import { CATEGORIES, NEED_WEIGHT, STDR_YM, THIN, WALK5, WANT_WEIGHT, setTier, tierOf, type CommercialIndex, type CommercialPrefs, type Tier } from '../commercial'

// ── 고른 후보지: 종합 점수(원형 그래프) + 수단별 점수(눈금 막대) ──────────
// 수단 점수는 목적지별 점수를 "월 왕복 비율"로 평균한 값(종합 점수와 같은 비율). 도보는 걸어갈 수 있는 목적지만,
// 대중교통은 도보 10분 이내(transitSkipped)인 목적지를 뺀다.

export type ModeKey = 'transit' | 'car' | 'walk'
export const MODE_LABEL: Record<ModeKey, string> = { transit: '대중교통', car: '차량', walk: '도보' }

export function modeSummary(r: CandidateResult, mode: ModeKey): number | null {
  const rows = r.hubs.filter((h) => (mode === 'walk' ? h.walkCounts : mode === 'transit' ? !h.transitSkipped : true))
  const w = rows.reduce((a, h) => a + h.share, 0)
  if (!rows.length || w === 0) return null
  return rows.reduce((a, h) => a + (mode === 'walk' ? h.scores.walk ?? 0 : h.scores[mode]) * h.share, 0) / w
}

const Ticks = ({ value, mode }: { value: number | null; mode: ModeKey }) => (
  <span className={`ticks ${mode}`} aria-hidden>
    <span style={{ width: `${value === null ? 0 : Math.max(0, Math.min(10, value)) * 10}%` }} />
  </span>
)

// 종합 점수: 원 테두리만 점수(0~10)만큼 채운다(12시 방향에서 시계 방향). 가운데에 점수.
const TotalRing = ({ value }: { value: number }) => (
  <span className="total-ring">
    <svg viewBox="0 0 100 100" aria-hidden>
      <circle className="ring-track" cx="50" cy="50" r="44" />
      <circle className="ring-arc" cx="50" cy="50" r="44" pathLength={100} strokeDasharray={`${Math.max(0, Math.min(10, value)) * 10} 100`} transform="rotate(-90 50 50)" />
    </svg>
    <em>{fmt(value)}<small>/ 10</small></em>
  </span>
)

export function ModeScorePanel({ r, action }: { r: CandidateResult; action: ReactNode }) {
  const modes: ModeKey[] = ['transit', 'car', 'walk']
  return (
    <div className="panel mode-panel">
      <div className="panel-head"><h2>이동수단별 점수</h2>{action}</div>
      <div className="total-wrap">
        <TotalRing value={r.total} />
        <p className="gauge-caption"><b>{r.candidate.name}</b><br />종합 {r.rank}위</p>
      </div>
      <div className="mode-rows">
        {modes.map((m) => {
          const v = modeSummary(r, m)
          // 도보는 30분 안에 걸어갈 수 있는 목적지만 적는다(30분+ 문구 없음)
          const detail = r.hubs.flatMap((h) => {
            if (m === 'transit') return h.transitSkipped ? [] : [`${h.hub.category} ${h.trip.transit}분`]
            if (m === 'car') return [`${h.hub.category} ${h.trip.carRush}/${h.trip.carFree}분`]
            return h.scores.walk !== null ? [`${h.hub.category} ${h.trip.walk}분`] : []
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

// ── 오른쪽 위: 입지 요인(지수) ────────────────────────────────────────
// 모든 지수를 같은 모양(이름 · 짧은 설명 · 눈금 · 점수)의 한 줄로 보여 준다. 어떤 지수를 쓸지는 카드 오른쪽 위 ⚙ 에서 고른다.
// 지금 동작하는 지수는 도보 5분 상권(이름을 누르면 필수·선호 업종 고르기)과 길고양이, 나머지는 준비 중이라 고를 수 없다.
type FactorsProps = {
  cat: CatIndex | null; catOn: boolean; onToggleCat: () => void; onRegister: () => void; onGallery: () => void
  com: CommercialIndex | null; comCounts: Record<string, number> | null; comPrefs: CommercialPrefs; onComPrefs: (p: CommercialPrefs) => void
}

const SOON = [
  { name: '🌳 산책', note: '공원·하천변·녹지' },
  { name: '🕊️ 평화로움', note: '큰길·유흥가·소음원과의 거리' },
  { name: '🌿 쾌적함', note: '녹지 비율·혼잡도' },
]

export function FactorsPanel({ cat, catOn, onToggleCat, onRegister, onGallery, com, comCounts, comPrefs, onComPrefs }: FactorsProps) {
  const [pick, setPick] = useState(false)
  const [comOpen, setComOpen] = useState(false)
  const names = (ids: string[]) => ids.map((id) => CATEGORIES.find((c) => c.id === id)?.label ?? id).join('·')
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!pick) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPick(false) }
    const onDown = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setPick(false) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown) }
  }, [pick])
  return (
    <div className="panel factors">
      <div className="panel-head">
        <h2>입지 요인</h2>
        <div className="factor-gear" ref={box}>
          <button type="button" className="gear" aria-label="입지 요인 고르기" aria-expanded={pick} onClick={() => setPick(!pick)}>⚙️</button>
          {pick && (
            <div className="factor-menu" role="dialog" aria-label="입지 요인 고르기">
              <label><input type="checkbox" checked={comPrefs.on} onChange={() => onComPrefs({ ...comPrefs, on: !comPrefs.on })} />🏪 도보 5분 상권</label>
              <label><input type="checkbox" checked={catOn} onChange={onToggleCat} />🐈 길고양이 지수</label>
              {SOON.map((x) => <label key={x.name} className="off"><input type="checkbox" disabled />{x.name}<small>준비 중</small></label>)}
            </div>
          )}
        </div>
      </div>
      {comPrefs.on && (
        <div className="factor com-factor">
          <div>
            <button type="button" className="com-open" aria-expanded={comOpen} onClick={() => setComOpen(!comOpen)}>🏪 도보 5분 상권 <i aria-hidden>{comOpen ? '▴' : '▾'}</i></button>
            <small>{comPrefs.need.length ? `필수 ${names(comPrefs.need)}` : ''}{comPrefs.need.length && comPrefs.want.length ? ' · ' : ''}{comPrefs.want.length ? `선호 ${names(comPrefs.want)}` : ''}{!comPrefs.need.length && !comPrefs.want.length ? '업종을 골라 주세요' : ''}</small>
          </div>
          <span className="factor-score"><span className="ticks com" aria-hidden><span style={{ width: `${(com?.score ?? 0) * 10}%` }} /></span><em title={com ? undefined : '검색으로 넣은 후보지는 상권 자료가 없습니다'}>{com ? fmt(com.score) : '—'}</em></span>
        </div>
      )}
      {comPrefs.on && comOpen && <CommercialPicker prefs={comPrefs} onChange={onComPrefs} counts={comCounts} />}
      {catOn && (
        <div className="factor">
          <div>
            <b>🐈 길고양이 지수</b>
            <span className="factor-links">
              <button type="button" onClick={onGallery} disabled={!cat || cat.photos === 0}>사진{cat && cat.photos ? ` ${cat.photos}` : ''}</button>
              <button type="button" onClick={onRegister}>등록</button>
            </span>
          </div>
          <span className="factor-score"><span className="ticks cat" aria-hidden><span style={{ width: `${(cat?.score ?? 0) * 10}%` }} /></span><em>{cat && cat.n ? fmt(cat.score) : '—'}</em></span>
        </div>
      )}
      {SOON.map((x) => (
        <div className="factor soon-row" key={x.name}>
          <div><b>{x.name}</b><small>{x.note}</small></div>
          <span className="factor-score"><span className="ticks empty" aria-hidden /><em className="soon">준비 중</em></span>
        </div>
      ))}
    </div>
  )
}

// 도보 5분 상권: 업종마다 필수 / 선호 / 안 봄. 오른쪽 숫자 = 고른 후보지의 도보 5분 안 개수
const TIERS: { t: Tier; label: string }[] = [{ t: 'need', label: '필수' }, { t: 'want', label: '선호' }, { t: 'off', label: '안 봄' }]
function CommercialPicker({ prefs, onChange, counts }: { prefs: CommercialPrefs; onChange: (p: CommercialPrefs) => void; counts: Record<string, number> | null }) {
  return (
    <div className="com-picker" role="group" aria-label="상권 업종 고르기">
      {CATEGORIES.map((c) => {
        const t = tierOf(prefs, c.id)
        return (
          <div className="com-cat" key={c.id}>
            <span className="com-name" title={THIN[c.id]}>{c.emoji} {c.label}{THIN[c.id] && <sup aria-label="자료 부족">*</sup>}</span>
            <span className="seg" role="radiogroup" aria-label={`${c.label} 반영`}>
              {TIERS.map((x) => (
                <button key={x.t} type="button" role="radio" aria-checked={t === x.t} className={t === x.t ? `on ${x.t}` : ''} onClick={() => onChange(setTier(prefs, c.id, x.t))}>{x.label}</button>
              ))}
            </span>
            <em className="com-count">{counts ? `${counts[c.id]}곳` : ''}</em>
          </div>
        )
      })}
      <p className="com-note">필수 {NEED_WEIGHT * 100}% · 선호 {WANT_WEIGHT * 100}%, 묶음 안은 똑같이. 업종 점수 = 걸어서 5분({WALK5}m) 안 개수 ÷ 후보지 중 최다 × 10. 상가정보 {STDR_YM.slice(0, 4)}.{STDR_YM.slice(4)} 기준{Object.keys(THIN).length ? ' · * ' + Object.values(THIN)[0] : ''}.</p>
    </div>
  )
}
