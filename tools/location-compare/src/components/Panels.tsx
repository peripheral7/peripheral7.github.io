import { useEffect, useRef, useState } from 'react'
import { fmt } from '../scoring'
import { CAT_RADIUS_M, livePhotos, type CatIndex } from '../cats'
import { PEACE, PLACE_KEYS, PLACE_LABEL, PLACE_NOTE, placeSummary, type PlaceKey, type PlaceOn, type PlaceRow } from '../places'
import { CATEGORIES, ENOUGH, NEED_WEIGHT, STDR_YM, WALK5, WANT_WEIGHT, setTier, tierOf, type CommercialIndex, type CommercialPrefs, type Tier } from '../commercial'

// ── 오른쪽 위: 입지 요인(지수) ────────────────────────────────────────
// 모든 지수를 같은 모양(이름 · 짧은 설명 · 눈금 · 점수)의 한 줄로 보여 준다. 어떤 지수를 쓸지는 카드 오른쪽 위 ⚙ 에서 고른다.
// 이름을 누르면 아래에 내역이 펼쳐지고(한 번에 하나) 지도에도 그 요인이 보인다 — 도서관 위치, 평화로움 소음 구분도, 길고양이 사진.
// 펼친 요인(open)은 App 이 들고 있다(지도와 같이 쓰려고).
/** 후보지 중 최고점(이름 옆 작은 글씨) — self = 그 후보지가 지금 고른 후보지, detail = 세부 내역(고른 후보지가 아닐 때만 아래에 보임) */
export type FactorBest = { score: number; name: string; self: boolean; detail?: string }
type FactorsProps = {
  best: Record<string, FactorBest | null>; bike: boolean
  cat: CatIndex | null; catOn: boolean; onToggleCat: () => void; onRegister: () => void; onGallery: (start?: number) => void
  com: CommercialIndex | null; comCounts: Record<string, number> | null; comPrefs: CommercialPrefs; onComPrefs: (p: CommercialPrefs) => void
  place: PlaceRow | null; placeOn: PlaceOn; onPlaceOn: (v: PlaceOn) => void
  missing: string // 자료가 없을 때 보일 말(계산 중·계산 서버 꺼짐 등 — live.ts liveNote)
  open: FactorOpen; onOpen: (k: FactorOpen) => void
}
/** 펼친 요인(한 번에 하나) */
export type FactorOpen = 'com' | PlaceKey | 'cat' | null

const BestTag = ({ b }: { b: FactorBest | null | undefined }) => (b ? <small className="best-tag" title="후보지 중 가장 높은 점수">최고 {fmt(b.score)} · {b.name}</small> : null)
const BestDetail = ({ b }: { b: FactorBest | null | undefined }) => (b && !b.self && b.detail ? <small className="best-detail">{b.name}: {b.detail}</small> : null)

const SOON: { name: string; note: string }[] = [] // 준비 중인 지수(지금은 없음 — 쾌적함은 삭제)

export function FactorsPanel({ cat, catOn, onToggleCat, onRegister, onGallery, com, comCounts, comPrefs, onComPrefs, place, placeOn, onPlaceOn, best, bike, missing, open, onOpen }: FactorsProps) {
  const [pick, setPick] = useState(false)
  const toggle = (k: Exclude<FactorOpen, null>) => onOpen(open === k ? null : k)
  const comOpen = open === 'com', catOpen = open === 'cat', placeOpen = PLACE_KEYS.includes(open as PlaceKey) ? (open as PlaceKey) : null
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
            <button type="button" className="com-open" aria-expanded={comOpen} onClick={() => toggle('com')}>🏪 {bike ? '자전거 상권(1km)' : '도보 5분 상권'} <i aria-hidden>{comOpen ? '▴' : '▾'}</i></button><BestTag b={best.com} />
            <small>{!com && (comPrefs.need.length + comPrefs.want.length) > 0 ? `${missing} · ` : ''}{comPrefs.need.length ? `필수 ${names(comPrefs.need)}` : ''}{comPrefs.need.length && comPrefs.want.length ? ' · ' : ''}{comPrefs.want.length ? `선호 ${names(comPrefs.want)}` : ''}{!comPrefs.need.length && !comPrefs.want.length ? '업종을 골라 주세요' : ''}</small>
          </div>
          <span className="factor-score"><span className="ticks com" aria-hidden><span style={{ width: `${(com?.score ?? 0) * 10}%` }} /></span><em title={com ? undefined : missing}>{com ? fmt(com.score) : '—'}</em></span>
        </div>
      )}
      {comPrefs.on && comOpen && <CommercialPicker prefs={comPrefs} onChange={onComPrefs} counts={comCounts} bike={bike} />}
      {PLACE_KEYS.filter((k) => placeOn[k]).map((k) => {
        const s = place?.[k].score ?? null
        return [
          <div className="factor place-factor" key={k}>
            <div>
              <button type="button" className="com-open" aria-expanded={placeOpen === k} onClick={() => toggle(k)}>{PLACE_LABEL[k]} <i aria-hidden>{placeOpen === k ? '▴' : '▾'}</i></button><BestTag b={best[k]} />
              {(!place || placeSummary(k, place)) && <small>{place ? placeSummary(k, place) : `${PLACE_NOTE[k]} — ${missing}`}</small>}
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
            <button type="button" className="com-open" aria-expanded={catOpen} onClick={() => toggle('cat')}>🐈 길고양이 지수 <i aria-hidden>{catOpen ? '▴' : '▾'}</i></button><BestTag b={best.cat} />
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

// 도보 5분 상권: 업종 칩을 필수(초록) · 선호(노랑) · 생략(회색) 세 칸 사이로 끌어다 놓는다(마우스·손가락 모두 — 포인터 이벤트로 직접 구현).
// 칩을 눌렀다 떼기만 하면(끌지 않고) 다음 칸으로 넘어가고, 키보드는 ← → 로 옮긴다. 칩 오른쪽 숫자 = 고른 후보지의 반경 안 개수 / 기준 개수
const TIERS: { t: Tier; label: string }[] = [{ t: 'need', label: '필수' }, { t: 'want', label: '선호' }, { t: 'off', label: '생략' }]
function CommercialPicker({ prefs, onChange, counts, bike }: { prefs: CommercialPrefs; onChange: (p: CommercialPrefs) => void; counts: Record<string, number> | null; bike: boolean }) {
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; dx: number; dy: number; moved: boolean; over: Tier | null } | null>(null)
  const zoneAt = (x: number, y: number): Tier | null => (document.elementFromPoint(x, y)?.closest('[data-tier]') as HTMLElement | null)?.dataset.tier as Tier ?? null
  const move = (id: string, t: Tier) => onChange(setTier(prefs, id, t))
  const next = (id: string, d = 1) => { const i = TIERS.findIndex((x) => x.t === tierOf(prefs, id)); move(id, TIERS[(i + d + TIERS.length) % TIERS.length].t) }
  useEffect(() => {
    if (!drag) return
    const onMove = (e: PointerEvent) => setDrag((d) => d && { ...d, dx: e.clientX - d.x, dy: e.clientY - d.y, moved: d.moved || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5, over: zoneAt(e.clientX, e.clientY) })
    const onUp = (e: PointerEvent) => {
      setDrag((d) => {
        if (!d) return null
        if (!d.moved) next(d.id)
        else { const t = zoneAt(e.clientX, e.clientY); if (t) move(d.id, t) }
        return null
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp) }
  }, [drag?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="com-picker tier-board" role="group" aria-label="상권 업종 고르기 — 칩을 필수·선호·생략 칸으로 끌어다 놓기">
      {TIERS.map(({ t, label }) => {
        const items = CATEGORIES.filter((c) => tierOf(prefs, c.id) === t)
        return (
          <div key={t} className={`tier-zone ${t}${drag?.moved && drag.over === t ? ' over' : ''}`} data-tier={t}>
            <span className="tier-name">{label}</span>
            <div className="tier-chips">
              {items.map((c) => {
                const dragging = drag?.id === c.id && drag.moved
                return (
                  <button key={c.id} type="button" className={`tier-chip ${t}${dragging ? ' dragging' : ''}`} style={dragging ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}
                    title={`${c.label} — 끌어서 칸을 옮기거나 눌러서 다음 칸으로`}
                    aria-label={`${c.label} (${label}) — 눌러서 다음 칸으로, ← → 로 옮기기`}
                    onPointerDown={(e) => { if (e.button !== 0) return; e.preventDefault(); setDrag({ id: c.id, x: e.clientX, y: e.clientY, dx: 0, dy: 0, moved: false, over: t }) }}
                    onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(c.id, 1) } else if (e.key === 'ArrowLeft') { e.preventDefault(); next(c.id, -1) } }}>
                    {c.emoji} {c.label}{counts && <em>{counts[c.id]}/{ENOUGH[c.id]}</em>}
                  </button>
                )
              })}
              {!items.length && <span className="tier-empty">여기로 끌어다 놓기</span>}
            </div>
          </div>
        )
      })}
      <p className="com-note">필수 {NEED_WEIGHT * 100}% · 선호 {WANT_WEIGHT * 100}%. 반경 {bike ? WALK5 * 2 : WALK5}m{bike ? '(자전거)' : ''} 안 개수가 기준(/뒤 숫자)에 닿으면 9점. 상가정보 {STDR_YM.slice(0, 4)}.{STDR_YM.slice(4)} 기준.</p>
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
              <img data-pin-nopin="true" src={p.data} alt="" loading="lazy" />
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
        <div className="place-line"><span>🍽️ {PEACE.foodRadiusM}m 안 음식점 {p.food}곳 <small>냄새</small></span><em>{fmt(p.foodScore)}</em></div>
        <div className="place-line"><span>🛍️ {PEACE.shopRadiusM}m 안 업소 {p.shops}곳 <small>사람</small></span><em>{fmt(p.shopScore)}</em></div>
        <div className="place-line"><span>🛣️ {p.road ? `${p.road.name.split(' · ')[0]}${p.road.lanes ? ` ${p.road.lanes}차선` : ''} ${p.road.dist}m` : '가까운 도로 없음'} <small>소음</small></span><em>{fmt(p.roadScore)}</em></div>
        <p className="com-note">냄새 : 사람 : 소음 = {PEACE.wFood * 10} : {PEACE.wShop * 10} : {PEACE.wRoad * 10}. 지도에 반경 {PEACE.zones.radiusM}m 소음 구분도(빨강 8차선+ · 주황 6차선 · 노랑 4차선 · 보라 상가).</p>
      </div>
    )
  }
  if (k === 'park') {
    const p = r.park
    return (
      <div className="com-picker place-detail">
        {p.parks.length === 0 && <p className="com-note">500m 안에 공원이 없어요.</p>}
        {p.parks.map((x, i) => (
          <div className="place-line" key={x.name + i}>
            <span>{x.waterside ? '🌊' : '🌳'} {x.name} <small>{x.type} · {x.dist}m</small></span>
            <em>{fmt(x.eff)}</em>
          </div>
        ))}
        <div className="place-line"><span>🌿 녹지 {p.green}%</span><em>+{p.greenBonus}</em></div>
      </div>
    )
  }
  return (
    <div className="com-picker place-detail">
      {r.library.near.map((l, i) => (
        <div className="place-line" key={l.name}>
          <span>📚 {l.name} <small>{l.dist}m</small></span>
          {i === 0 && <em>{fmt(r.library.score)}</em>}
        </div>
      ))}
    </div>
  )
}
