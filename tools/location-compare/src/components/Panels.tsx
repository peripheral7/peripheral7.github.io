import { useEffect, useRef, useState, type ReactNode } from 'react'
import { fmt, type CandidateResult } from '../scoring'
import { CAT_RADIUS_M, livePhotos, type CatIndex } from '../cats'
import { LIBRARY_AT, OSM_AT, PLACE_KEYS, PLACE_LABEL, PLACE_NOTE, placeSummary, type PlaceKey, type PlaceOn, type PlaceRow } from '../places'
import { BRAND_PARTS, CATEGORIES, ENOUGH, NEED_WEIGHT, STDR_YM, THIN, WALK5, WANT_WEIGHT, setTier, tierOf, type CommercialIndex, type CommercialPrefs, type Tier } from '../commercial'

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
/** 후보지 중 최고점(이름 옆 작은 글씨) — self = 그 후보지가 지금 고른 후보지, detail = 세부 내역(고른 후보지가 아닐 때만 아래에 보임) */
export type FactorBest = { score: number; name: string; self: boolean; detail?: string }
type FactorsProps = {
  best: Record<string, FactorBest | null>; bike: boolean
  cat: CatIndex | null; catOn: boolean; onToggleCat: () => void; onRegister: () => void; onGallery: (start?: number) => void
  com: CommercialIndex | null; comCounts: Record<string, number> | null; comBrands: Record<string, number> | null; comPrefs: CommercialPrefs; onComPrefs: (p: CommercialPrefs) => void
  place: PlaceRow | null; placeOn: PlaceOn; onPlaceOn: (v: PlaceOn) => void
}

const BestTag = ({ b }: { b: FactorBest | null | undefined }) => (b ? <small className="best-tag" title="후보지 중 가장 높은 점수">최고 {fmt(b.score)} · {b.name}</small> : null)
const BestDetail = ({ b }: { b: FactorBest | null | undefined }) => (b && !b.self && b.detail ? <small className="best-detail">{b.name}: {b.detail}</small> : null)

const SOON: { name: string; note: string }[] = [] // 준비 중인 지수(지금은 없음 — 쾌적함은 삭제)

export function FactorsPanel({ cat, catOn, onToggleCat, onRegister, onGallery, com, comCounts, comBrands, comPrefs, onComPrefs, place, placeOn, onPlaceOn, best, bike }: FactorsProps) {
  const [placeOpen, setPlaceOpen] = useState<PlaceKey | null>(null)
  const [pick, setPick] = useState(false)
  const [comOpen, setComOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false) // 길고양이 이름을 누르면 사진 썸네일
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
              {PLACE_KEYS.map((k) => <label key={k}><input type="checkbox" checked={placeOn[k]} onChange={() => onPlaceOn({ ...placeOn, [k]: !placeOn[k] })} />{PLACE_LABEL[k]}</label>)}
              <label><input type="checkbox" checked={catOn} onChange={onToggleCat} />🐈 길고양이 지수</label>
              {SOON.map((x) => <label key={x.name} className="off"><input type="checkbox" disabled />{x.name}<small>준비 중</small></label>)}
            </div>
          )}
        </div>
      </div>
      {comPrefs.on && (
        <div className="factor com-factor">
          <div>
            <button type="button" className="com-open" aria-expanded={comOpen} onClick={() => setComOpen(!comOpen)}>🏪 {bike ? '자전거 상권(1km)' : '도보 5분 상권'} <i aria-hidden>{comOpen ? '▴' : '▾'}</i></button><BestTag b={best.com} />
            <small>{comPrefs.need.length ? `필수 ${names(comPrefs.need)}` : ''}{comPrefs.need.length && comPrefs.want.length ? ' · ' : ''}{comPrefs.want.length ? `선호 ${names(comPrefs.want)}` : ''}{!comPrefs.need.length && !comPrefs.want.length ? '업종을 골라 주세요' : ''}</small>
          </div>
          <span className="factor-score"><span className="ticks com" aria-hidden><span style={{ width: `${(com?.score ?? 0) * 10}%` }} /></span><em title={com ? undefined : '검색으로 넣은 후보지는 상권 자료가 없습니다'}>{com ? fmt(com.score) : '—'}</em></span>
        </div>
      )}
      {comPrefs.on && comOpen && <CommercialPicker prefs={comPrefs} onChange={onComPrefs} counts={comCounts} brands={comBrands} bike={bike} />}
      {PLACE_KEYS.filter((k) => placeOn[k]).map((k) => {
        const s = place?.[k].score ?? null
        return [
          <div className="factor place-factor" key={k}>
            <div>
              <button type="button" className="com-open" aria-expanded={placeOpen === k} onClick={() => setPlaceOpen(placeOpen === k ? null : k)}>{PLACE_LABEL[k]} <i aria-hidden>{placeOpen === k ? '▴' : '▾'}</i></button><BestTag b={best[k]} />
              <small>{place ? placeSummary(k, place) : PLACE_NOTE[k] + ' — 검색으로 넣은 후보지는 자료 없음'}</small>
              <BestDetail b={best[k]} />
            </div>
            <span className="factor-score"><span className={`ticks ${k}`} aria-hidden><span style={{ width: `${(s ?? 0) * 10}%` }} /></span><em>{s === null ? '—' : fmt(s)}</em></span>
          </div>,
          placeOpen === k && place ? <PlaceDetail key={k + 'd'} k={k} r={place} /> : null,
        ]
      })}
      {catOn && (
        <div className="factor">
          <div>
            <button type="button" className="com-open" aria-expanded={catOpen} onClick={() => setCatOpen(!catOpen)}>🐈 길고양이 지수 <i aria-hidden>{catOpen ? '▴' : '▾'}</i></button><BestTag b={best.cat} />
            <span className="factor-links">
              <button type="button" onClick={() => onGallery(0)} disabled={!cat || cat.photos === 0}>사진{cat && cat.photos ? ` ${cat.photos}` : ''}</button>
              <button type="button" onClick={onRegister}>등록</button>
            </span>
          </div>
          <span className="factor-score"><span className="ticks cat" aria-hidden><span style={{ width: `${(cat?.score ?? 0) * 10}%` }} /></span><em>{cat && cat.n ? fmt(cat.score) : '—'}</em></span>
        </div>
      )}
      {catOn && catOpen && <CatThumbs cat={cat} onOpen={onGallery} onRegister={onRegister} />}
      {SOON.map((x) => (
        <div className="factor soon-row" key={x.name}>
          <div><b>{x.name}</b><small>{x.note}</small></div>
          <span className="factor-score"><span className="ticks empty" aria-hidden /><em className="soon">준비 중</em></span>
        </div>
      ))}
    </div>
  )
}

// 도보 5분 상권: 업종마다 필수 / 선호 / 안 봄. 오른쪽 숫자 = 고른 후보지의 반경 500m 안 개수 / 기준 개수
const TIERS: { t: Tier; label: string }[] = [{ t: 'need', label: '필수' }, { t: 'want', label: '선호' }, { t: 'off', label: '안 봄' }]
function CommercialPicker({ prefs, onChange, counts, brands, bike }: { prefs: CommercialPrefs; onChange: (p: CommercialPrefs) => void; counts: Record<string, number> | null; brands: Record<string, number> | null; bike: boolean }) {
  return (
    <div className="com-picker" role="group" aria-label="상권 업종 고르기">
      {CATEGORIES.map((c) => {
        const t = tierOf(prefs, c.id)
        return (
          <div className="com-cat" key={c.id}>
            <span className="com-name" title={THIN[c.id]}>{c.emoji} {c.label}{THIN[c.id] && <sup aria-label="자료 부족">*</sup>}{BRAND_PARTS[c.id] && brands && <small className="com-brand"> · {BRAND_PARTS[c.id].label} {brands[c.id]}</small>}</span>
            <span className="seg" role="radiogroup" aria-label={`${c.label} 반영`}>
              {TIERS.map((x) => (
                <button key={x.t} type="button" role="radio" aria-checked={t === x.t} className={t === x.t ? `on ${x.t}` : ''} onClick={() => onChange(setTier(prefs, c.id, x.t))}>{x.label}</button>
              ))}
            </span>
            <em className="com-count">{counts ? `${counts[c.id]}/${ENOUGH[c.id]}` : ''}</em>
          </div>
        )
      })}
      <p className="com-note">필수 {NEED_WEIGHT * 100}% · 선호 {WANT_WEIGHT * 100}%, 묶음 안은 똑같이. 반경 {bike ? WALK5 * 2 : WALK5}m{bike ? '(자전거)' : ''} 안 개수가 기준(오른쪽 /뒤 숫자)에 닿으면 9점, 그 위로는 거의 안 오름. 상가정보 {STDR_YM.slice(0, 4)}.{STDR_YM.slice(4)} 기준{Object.keys(THIN).length ? ' · * ' + Object.values(THIN)[0] : ''}.</p>
    </div>
  )
}

// 길고양이: 고른 후보지 반경 안의 유효한 사진을 작은 썸네일로(갤러리 창과 같은 순서). 누르면 그 사진부터 크게.
function CatThumbs({ cat, onOpen, onRegister }: { cat: CatIndex | null; onOpen: (start: number) => void; onRegister: () => void }) {
  const list = (cat?.cats ?? []).flatMap((c) => livePhotos(c).map((p) => ({ c, p })))
  return (
    <div className="cat-thumbs" role="group" aria-label="길고양이 사진">
      {list.length === 0
        ? <p className="com-note">반경 {CAT_RADIUS_M}m 안에 올라온 사진이 없어요. <button type="button" className="link" onClick={onRegister}>현장에서 등록</button></p>
        : <div className="thumb-grid">{list.map(({ c, p }, i) => (
            <button type="button" key={c.id + p.at} onClick={() => onOpen(i)} title={c.name || '길고양이'} aria-label={`${c.name || '길고양이'} 사진 크게 보기`}>
              <img src={p.data} alt="" loading="lazy" />
            </button>
          ))}</div>}
    </div>
  )
}

// 평화로움·공원·공공시설: 이름을 누르면 나오는 계산 내역
function PlaceDetail({ k, r }: { k: PlaceKey; r: PlaceRow }) {
  if (k === 'peace') {
    const p = r.peace
    return (
      <div className="com-picker place-detail">
        <div className="place-line"><span>🍽️ 60m 안 음식점·주점 {p.food}곳</span><em>{fmt(p.foodScore)}</em></div>
        <div className="place-line"><span>🌿 300m 안 녹지 비율 {p.green}%</span><em>{fmt(p.greenScore)}</em></div>
        <div className="place-line"><span>🛣️ {p.road ? `큰길 ${p.road.name} ${p.road.dist}m` : '가까운 큰길 없음'}</span><em>{fmt(p.roadScore)}</em></div>
        <p className="com-note">평화로움 = 음식점 점수 × 0.4 + 큰길 점수 × 0.4 + 녹지 점수 × 0.2. 녹지는 반경 300m 안 녹지(공원·숲·풀밭) 비율이 30% 이상이면 10점, 그 아래는 비율에 비례. 음식점은 5곳까지 1곳당 0.2점만 깎고, 6곳부터 크게 깎이며 30곳 넘으면 거의 0점에서 큰 차이 없음. 큰길(도시계획 도로 광로·대로 = 폭 25m 이상, 브이월드)의 가장자리가 30m 안이면 0점, 60m 안이면 5점, 그 밖이면 10점.</p>
      </div>
    )
  }
  if (k === 'park') {
    const p = r.park
    return (
      <div className="com-picker place-detail">
        {p.parks.length === 0 && <p className="com-note">1km 안에 공원이 없어요.</p>}
        {p.parks.map((x, i) => (
          <div className="place-line" key={x.name + i}>
            <span>{x.waterside ? '🌊' : '🌳'} {x.name} <small>{x.type} · {x.dist}m · 산책로 {x.walkM ? `${(x.walkM / 1000).toFixed(1)}km` : '자료 없음'} · {x.areaHa}ha{x.linked ? ' · 길게 연결 ×1.8' : ''}</small></span>
            <em title={`공원 점수 ${x.value} → 거리 반영 ${x.eff}`}>{fmt(x.eff)}</em>
          </div>
        ))}
        <div className="place-line"><span>🌿 1km 안 녹지 비율 {p.green}%</span><em>+{p.greenBonus}</em></div>
        <p className="com-note">더하기 방식. 공원마다 점수 = 공원 안 산책로 길이로(반달공원 0.4km ≈ 2점 · 신동수변공원 1.3km ≈ 7.6 · 글빛누리공원 1.5km ≈ 8 · 광교호수공원 32km = 10), 길게 이어져 양 끝이 상권에 닿으면 ×1.8. 후보지 점수 = 가장 좋은 공원(500m 넘으면 1km 에서 절반까지 줄임) + 두 번째 공원 10% + 녹지 15% 이상 +0.5 · 30% 이상 +1, 최대 10. 공원 경계·유형은 국토교통부 도시계획시설(공간시설), 산책로·이름은 OSM {OSM_AT}.</p>
      </div>
    )
  }
  return (
    <div className="com-picker place-detail">
      {r.library.near.map((l, i) => (
        <div className="place-line" key={l.name}>
          <span>📚 {l.name} <small>{l.dist}m{l.seats ? ` · 좌석 ${l.seats.toLocaleString()}` : ''}{l.books ? ` · 책 ${l.books.toLocaleString()}권` : ''}</small></span>
          {i === 0 && <em>{fmt(r.library.score)}</em>}
        </div>
      ))}
      <p className="com-note">가장 가까운 공공도서관까지 직선거리: 500m 안 10점 → 1km 5점 → 2km 0점(사이는 직선). 작은도서관·어린이·학교·대학·전문 도서관은 뺌. 공공데이터포털 전국도서관표준데이터(기준일 {LIBRARY_AT}).</p>
    </div>
  )
}
