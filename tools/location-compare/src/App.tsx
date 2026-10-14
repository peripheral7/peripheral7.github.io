import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BASE_DEPOSIT, MAX_HUBS, activeModes, lifestyleOf, baseRent, hubEmoji, weeklyText, won, type Place } from './data'
import { evaluate, hubInsights, shareOf } from './scoring'
import { addCandidate, load, money, removeCandidate, removeHub, save, setHub, updateCandidate, type State } from './store'
import { MapView } from './components/MapView'
import type { MapPoint } from './placeNear'
import { SearchBox } from './components/SearchBox'
import { FactorsPanel, type FactorBest, type FactorOpen } from './components/Panels'
import { EdgeNav, ScoreBlock } from './components/TransportCard'
import { MODE_INFO } from './components/SettingsPopover'
import { CompareCards } from './components/CompareCards'
import { SettingsPopover } from './components/SettingsPopover'
import { GuidePanel } from './components/GuidePanel'
import { CatGallery, CatRegister } from './components/CatPanel'
import { catIndex, livePhotos, loadCats, pruneCats, removeMyPhoto, saveCats, type CatState } from './cats'
import type { CatPin } from './mapOverlays'
import { CommutePanel } from './components/CommutePanel'
import { ListingCards, SpotCards } from './components/Recommend'
import { SPOTS } from './recommend'
import { DEFAULT_FUEL, loadCommute, saveCommute, type CommuteSaved } from './commute'
import { fuelPriceFor } from './fuel'
import { USE_LABEL, type PropertyUse } from './brokerage'
import { loadParks, parkAreaPin, strollNear, PARK_AREAS, PARK_AREA_MIN, STROLL_RADIUS, type Park } from './parks'
import { PLACE_KEYS, loadPlaceOn, placeFor, placeSummary, savePlaceOn, type PlaceOn } from './places'
import { liveMajors, liveNote, requestLive } from './live'
import { MAJORS, commercialIndex, loadCommercial, pickedCats, saveCommercial, walk5Counts, type CommercialPrefs } from './commercial'

// " · 3,000/40 (1,000 기준 월 50)" — 금액을 안 넣었으면 빈 글자
const rentText = (c: { deposit?: number; rent?: number }) => {
  const b = baseRent(c)
  return b === null ? '' : ` · ${won(c.deposit ?? 0)}/${c.rent ?? 0}${c.deposit === BASE_DEPOSIT ? '' : ` (${won(BASE_DEPOSIT)} 기준 월 ${b})`}`
}

export default function App() {
  const [state, setState] = useState<State>(load)
  const [active, setActive] = useState(0)
  const [focusKey, setFocusKey] = useState(0) // 목록이 바뀌면 지도를 다시 맞춘다
  const [pop, setPop] = useState<'none' | 'weekly' | 'weights'>('none')
  const [factorOpen, setFactorOpen] = useState<FactorOpen>(null) // 펼친 입지 요인(지도에도 표시)
  const [spotFlash, setSpotFlash] = useState<{ id: string; n: number } | null>(null) // 지도 카페 핀 → 광고 카드 강조
  const [guide, setGuide] = useState(false)
  const [hubPick, setHubPick] = useState<string | null>(null) // 지도 장단점 기준 목적지
  const [preview, setPreview] = useState<Place | null>(null) // 검색 결과를 누르면 지도가 그 위치로
  const [previewFly, setPreviewFly] = useState(true) // 우클릭으로 고른 곳은 지도를 움직이지 않고 임시 핀만
  const [mapPick, setMapPick] = useState<{ place: Place; kind: 'candidate' | 'hub'; at: MapPoint; n: number } | null>(null) // 지도 우클릭 → 검색창 등록 창
  const [found, setFound] = useState<Place[]>([]) // 검색 결과 전부(지도에 작은 점)
  const mapCenter = useRef<{ lat: number; lng: number } | null>(null) // 지금 지도 가운데(검색 결과 정렬)
  const [editing, setEditing] = useState<{ id: string; name: string; deposit: string; rent: string; maint: string; use: PropertyUse } | null>(null) // 수정 중인 후보지(금액은 입력 글자 그대로)
  const [catState, setCatState] = useState<CatState>(() => pruneCats(loadCats())) // 길고양이 지수(선택 요인) — 사진은 이 브라우저에만 저장
  const [commute, setCommute] = useState<CommuteSaved>(loadCommute) // 출퇴근 인사이트의 연비·기름값(null = 자동)
  // 넓은 화면의 오른쪽 열(.right-col, contain: size)이 왼쪽·가운데보다 길면 넘친 만큼 .stage 아래 여백(--right-extra)으로 자리를 만든다
  const stageRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const stage = stageRef.current, col = stage?.querySelector<HTMLElement>('.right-col')
    if (!stage || !col) return
    const fit = () => {
      if (getComputedStyle(col).display !== 'flex') { stage.style.removeProperty('--right-extra'); return }
      const need = [...col.children].reduce((a, el) => a + (el as HTMLElement).offsetHeight, 0) + 12 * Math.max(0, col.children.length - 1)
      stage.style.setProperty('--right-extra', `${Math.max(0, Math.ceil(need - col.offsetHeight))}px`)
    }
    const ro = new ResizeObserver(fit)
    ro.observe(col); for (const el of col.children) ro.observe(el)
    window.addEventListener('resize', fit)
    fit()
    return () => { ro.disconnect(); window.removeEventListener('resize', fit) }
  }, [])
  const [placeOn, setPlaceOn] = useState<PlaceOn>(loadPlaceOn) // 평화로움·공원·공공시설 켜고 끄기
  const [comPrefs, setComPrefs] = useState<CommercialPrefs>(loadCommercial) // 도보 5분 상권: 필수·선호 업종(이 브라우저에 저장)
  const [catDlg, setCatDlg] = useState<'none' | 'register' | 'gallery'>('none')
  const [galleryIdx, setGalleryIdx] = useState<number | null>(null) // 카드에서 "사진 보기"를 누른 후보지(없으면 선택한 후보지)
  const [galleryStart, setGalleryStart] = useState(0) // 입지 요인 썸네일에서 누른 사진부터
  const { candidates, hubs, pref } = state
  // 검색으로 넣은 후보지: 계산 서버(live.ts)에 상권·입지 요인·차량 시간을 요청하고, 결과가 들어올 때마다 liveVer 를 올려 다시 계산
  const [liveVer, setLiveVer] = useState(0)
  useEffect(() => { requestLive(candidates, hubs, () => setLiveVer((v) => v + 1)) }, [candidates, hubs])
  const results = useMemo(() => (candidates.length ? evaluate(candidates, hubs, pref) : []), [candidates, hubs, pref, liveVer]) // eslint-disable-line react-hooks/exhaustive-deps
  const cur = results[Math.min(active, results.length - 1)]
  const hubId = hubs.some((h) => h.id === hubPick) ? hubPick : hubs[0]?.id ?? null
  const hubIndex = hubs.findIndex((h) => h.id === hubId)
  // 기름값 자동 = 1순위 후보지가 있는 시군구의 오피넷 평균(후보지가 여러 지역에 걸쳐도 1순위 기준 하나로 모두 계산)
  const topAddress = results.find((r) => r.rank === 1)?.candidate.address ?? ''
  const fuelAuto = useMemo(() => (topAddress ? fuelPriceFor(topAddress) : null), [topAddress])
  const saveC = (s: CommuteSaved) => { setCommute(s); saveCommute(s) }
  const insights = useMemo(() => (hubIndex >= 0 ? hubInsights(results, hubIndex) : results.map(() => ({ pros: [], cons: [] }))), [results, hubIndex])

  useEffect(() => { save(state) }, [state])
  useEffect(() => { saveCats(catState) }, [catState])
  useEffect(() => { saveCommercial(comPrefs) }, [comPrefs])
  useEffect(() => { savePlaceOn(placeOn) }, [placeOn])
  const comIdx = useMemo(() => commercialIndex(candidates, comPrefs, !!pref.bike), [candidates, comPrefs, pref.bike, liveVer]) // eslint-disable-line react-hooks/exhaustive-deps
  // 지도에 따로 표시할 주요 매장: 필수·선호로 고른 업종의 것만(상권 지수를 껐으면 없음)
  // 지도 위 지표 단추: 상권(주요 매장 표시)·산책(공원·하천 표시). 이 브라우저에 기억한다.
  const [layers, setLayers] = useState<{ com: boolean; walk: boolean }>(() => {
    try { const l = JSON.parse(localStorage.getItem('locCompare.layers.v1') || 'null'); if (l) return { com: l.com !== false, walk: !!l.walk } } catch { /* 기본값 */ }
    return { com: true, walk: false }
  })
  const toggleLayer = (k: 'com' | 'walk') => setLayers((l) => { const n = { ...l, [k]: !l[k] }; try { localStorage.setItem('locCompare.layers.v1', JSON.stringify(n)) } catch { /* 저장 못 해도 동작 */ } return n })
  const majors = useMemo(() => { const all = [...MAJORS, ...liveMajors(candidates)], on = pickedCats(comPrefs); return layers.com ? (comPrefs.on ? all.filter((m) => on.has(m.cat)) : all) : [] }, [comPrefs, layers.com, candidates, liveVer]) // eslint-disable-line react-hooks/exhaustive-deps
  const [parks, setParks] = useState<Park[]>([])
  const [parkState, setParkState] = useState<'idle' | 'loading' | 'error'>('idle')
  const parkKey = candidates.map((c) => `${c.lat},${c.lng}`).join(';')
  useEffect(() => {
    if (!layers.walk || !candidates.length) { setParks([]); setParkState('idle'); return }
    let alive = true
    setParkState('loading')
    loadParks(candidates).then((p) => { if (alive) { setParks(p); setParkState('idle') } }).catch(() => { if (alive) setParkState('error') })
    return () => { alive = false }
  }, [layers.walk, parkKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const areaPins = useMemo(() => PARK_AREAS.filter((a) => !a.name.startsWith('이름 없는')).map(parkAreaPin), []) // 이름이 없는 공원은 칠만 하고 핀은 없다
  const stroll = layers.walk && candidates[active] ? strollNear(candidates[active], parks) : null
  const catIdx = useMemo(() => (catState.on ? candidates.map((c) => catIndex(c, catState.cats)) : null), [catState, candidates])
  // 입지 요인마다 후보지 중 최고점(이름 옆 작은 글씨). 세부 내역은 최고점 후보지가 고른 후보지와 다를 때만 그 아래에 보인다
  const best = useMemo(() => {
    const top = (vals: (number | null)[], detail?: (i: number) => string | undefined): FactorBest | null => {
      let bi = -1
      vals.forEach((v, i) => { if (v !== null && (bi < 0 || v > vals[bi]!)) bi = i })
      return bi < 0 ? null : { score: vals[bi]!, name: candidates[bi].name, self: bi === Math.min(active, candidates.length - 1), detail: detail?.(bi) }
    }
    const rows = candidates.map((c) => placeFor(c, !!pref.bike))
    const out: Record<string, FactorBest | null> = {
      com: top(comIdx.map((x) => x?.score ?? null)),
      cat: catIdx ? top(catIdx.map((x) => (x.n ? x.score : null))) : null,
    }
    for (const k of PLACE_KEYS) out[k] = top(rows.map((r) => r?.[k].score ?? null), (i) => placeSummary(k, rows[i]!))
    return out
  }, [candidates, comIdx, catIdx, pref.bike, active])
  const setCats = (next: CatState) => { const ok = saveCats(next); if (ok) setCatState(next); return ok }
  useEffect(() => { if (active > candidates.length - 1) setActive(Math.max(0, candidates.length - 1)) }, [candidates.length, active])

  // 처음 열 때 선택 = 종합 1순위 후보지(그 뒤로는 사용자가 고른 대로)
  const firstPick = useRef(false)
  useEffect(() => {
    if (firstPick.current || !results.length) return
    firstPick.current = true
    const top = results.findIndex((r) => r.rank === 1)
    if (top > 0) setActive(top)
  }, [results])
  const select = useCallback((i: number) => setActive(i), [])
  const onSpot = useCallback((id: string) => setSpotFlash({ id, n: Date.now() }), [])
  const update = (next: State, nextActive?: number) => { setState(next); if (nextActive !== undefined) setActive(nextActive); setFocusKey((k) => k + 1) }
  const onCandidate = (p: Place, name: string, deposit?: number, rent?: number, maint?: number) => update(addCandidate(state, p, name, deposit, rent, maint), candidates.length)
  const onHub = (p: Place, replaceId: string | undefined, name: string, category: string, weekly: number) => update(setHub(state, p, replaceId, name, category, weekly))
  const toggle = (k: 'weekly' | 'weights') => setPop((p) => (p === k ? 'none' : k))
  // 카드를 누르면(또는 Enter·Space) 설정 창이 열리게 하는 속성
  const tap = (k: 'weekly' | 'weights', label: string) => ({
    role: 'button', tabIndex: 0, 'aria-expanded': pop === k, 'aria-label': label, 'data-pop-trigger': k,
    onClick: (e: React.MouseEvent) => { if (!(e.target as HTMLElement).closest('.no-pop')) toggle(k) },
    onKeyDown: (e: React.KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); toggle(k) } },
  })
  const modes = activeModes(pref)
  const w = shareOf(pref) // 카드에는 합 100 기준 비율로
  const life = lifestyleOf(pref)
  // 번호 = 종합 순위(지도 핀·번호 단추 모두), 단추는 순위 순서로
  const ranks = useMemo(() => results.map((r) => r.rank), [results])
  const byRank = candidates.map((c, i) => ({ c, i, rank: ranks[i] ?? i + 1 })).sort((a, b) => a.rank - b.rank)
  // 선택한 후보지 박스 위쪽 ‹ › : 순위 순서로 앞·뒤 후보지(끝에서는 처음으로 돈다)
  // 교통평점 카드 가장자리 ‹ › : 순위 순서로 앞·뒤 후보지(끝에서는 돌지 않는다 — 넘길 곳이 없으면 단추도 없음)
  const k = byRank.findIndex((x) => x.i === active)
  const prev = k > 0 ? () => select(byRank[k - 1].i) : undefined
  const next = k >= 0 && k < byRank.length - 1 ? () => select(byRank[k + 1].i) : undefined
  const rename = (id: string, name: string) => setState(updateCandidate(state, id, { name }))
  const saveEdit = () => { if (editing) setState(updateCandidate(state, editing.id, { name: editing.name, deposit: money(editing.deposit), rent: money(editing.rent), maint: money(editing.maint), use: editing.use })); setEditing(null) }
  const deleteEdit = () => { if (editing && confirm('이 후보지를 삭제할까요?')) { update(removeCandidate(state, editing.id)); setEditing(null) } }
  const close = () => setPop('none')
  const weekSum = hubs.reduce((a, h) => a + (pref.weekly[h.id] ?? 0), 0)
  // 주 목적지(지도 맞춤) = 주 방문이 가장 많은 곳 하나 — 같으면 학교·직장을 먼저. 후보지를 고르면 후보지와 이곳이 지도 가운데에 균형 있게.
  const mainHubIds = useMemo(() => {
    if (!hubs.length) return []
    const rank = (h: (typeof hubs)[number]) => (pref.weekly[h.id] ?? 0) * 10 + (h.category === '학교' || h.category === '직장' ? 1 : 0)
    return [[...hubs].sort((a, b) => rank(b) - rank(a))[0].id]
  }, [hubs, pref.weekly])
  // 펼친 입지 요인을 지도에: 도서관 위치 · 평화로움 구분도 · 길고양이 사진
  const curPlace = placeFor(candidates[active], !!pref.bike)
  const mapLibraries = useMemo(() => (factorOpen === 'library' && curPlace ? curPlace.library.near.filter((l) => l.lat && l.lng).map((l) => ({ name: l.name, lat: l.lat!, lng: l.lng!, dist: l.dist })) : undefined), [factorOpen, curPlace])
  const mapZones = useMemo(() => (factorOpen === 'peace' && curPlace?.peace.zones && candidates[active] ? { lat: candidates[active].lat, lng: candidates[active].lng, ...curPlace.peace.zones } : null), [factorOpen, curPlace, candidates, active])
  // 펼친 요인 범위로 지도 맞춤: 평화로움 = 반경 150m, 도서관 = 후보지 + 도서관, 길고양이 = 후보지 + 고양이
  const overlayFit = useMemo(() => {
    const c = candidates[active]
    if (!c || !factorOpen) return null
    const d = 150 / 110540, e = 150 / (111320 * Math.cos((c.lat * Math.PI) / 180))
    const pts: [number, number][] = factorOpen === 'peace' ? [[c.lat - d, c.lng - e], [c.lat + d, c.lng + e]]
      : factorOpen === 'library' ? [[c.lat, c.lng], ...(curPlace?.library.near ?? []).filter((l) => l.lat).slice(0, 2).map((l): [number, number] => [l.lat!, l.lng!])]
      : factorOpen === 'cat' ? [[c.lat - d, c.lng - e], [c.lat + d, c.lng + e], ...(catIdx?.[active]?.cats ?? []).map((x): [number, number] => [x.lat, x.lng])]
      : []
    return pts.length ? { key: `${factorOpen}:${c.id}`, pts } : null
  }, [factorOpen, candidates, active, curPlace, catIdx])
  const catIdxCur = catIdx ? catIdx[Math.min(active, catIdx.length - 1)] ?? null : null
  const catPins = useMemo((): CatPin[] | undefined => {
    if (factorOpen !== 'cat' || !catIdxCur) return undefined
    let start = 0
    return catIdxCur.cats.map((c) => { const photos = livePhotos(c).map((p) => p.data); const pin = { lat: c.lat, lng: c.lng, name: c.name, photos, start }; start += photos.length; return pin })
  }, [factorOpen, catIdxCur])

  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand"><span className="logo"><span /><span /><span /></span>여기살까?</span>
        <nav className="pills">
          <span className="pill active">입지 지도</span>
          <button className="pill" onClick={() => setGuide(true)}>계산 방식</button>
        </nav>
      </header>

      <main className="stage" ref={stageRef}>
        {/* 왼쪽 위: 교통평점 카드 = 고른 후보지(3D 집·이름·주요 교통수단) + 종합·수단별 교통평점. 가장자리에 마우스를 올리면 ‹ › */}
        <div className="modes-area anchor">
          <div className="panel transport-card">
            <EdgeNav onPrev={prev} onNext={next} />
            <div className="tc-body">
            {cur ? (
              editing?.id === cur.candidate.id ? (
                <form className="cand-edit" onSubmit={(e) => { e.preventDefault(); saveEdit() }} onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null) }}>
                  <span className="tag">후보지 수정</span>
                  <label>이름<input spellCheck={false} autoComplete="off" value={editing.name} maxLength={40} autoFocus onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
                  <label>보증금<span className="unit-input"><input type="number" min={0} step={100} inputMode="numeric" placeholder="예: 1000" value={editing.deposit} onChange={(e) => setEditing({ ...editing, deposit: e.target.value })} /><i>만원</i></span></label>
                  <label>월세<span className="unit-input"><input type="number" min={0} step={1} inputMode="numeric" placeholder="예: 50" value={editing.rent} onChange={(e) => setEditing({ ...editing, rent: e.target.value })} /><i>만원</i></span></label>
                  <label>관리비<span className="unit-input"><input type="number" min={0} step={1} inputMode="numeric" placeholder="예: 7" value={editing.maint} onChange={(e) => setEditing({ ...editing, maint: e.target.value })} /><i>만원</i></span></label>
                  <label>용도<select value={editing.use} onChange={(e) => setEditing({ ...editing, use: e.target.value as PropertyUse })}>{(Object.keys(USE_LABEL) as PropertyUse[]).map((u) => <option key={u} value={u}>{USE_LABEL[u]}{u === 'officetel' ? '(85㎡ 이하·부엌·욕실)' : ''}</option>)}</select></label>
                  <p className="muted">{cur.candidate.address}</p>
                  <div className="edit-actions">
                    <button type="button" className="danger" onClick={deleteEdit}>삭제</button>
                    <span />
                    <button type="button" className="ghost" onClick={() => setEditing(null)}>취소</button>
                    <button type="submit" className="solid">저장</button>
                  </div>
                </form>
              ) : (
                <div className="sel-head house-head">
                  <div className="sel-text">
                    <span className="tag">종합 {cur.rank}위{rentText(cur.candidate)}</span>
                    <h3>{cur.candidate.name}</h3>
                    <p>{cur.candidate.address}</p>
                  </div>
                  <button className="edit-btn" aria-label={`${cur.candidate.name} 수정`} onClick={() => setEditing({ id: cur.candidate.id, name: cur.candidate.name, deposit: cur.candidate.deposit?.toString() ?? '', rent: cur.candidate.rent?.toString() ?? '', maint: cur.candidate.maint?.toString() ?? '', use: cur.candidate.use ?? 'home' })}>수정</button>
                </div>
              )
            ) : <p className="empty">검색해서 후보지를 넣어 주세요.</p>}
            {cur && (
              <div className={'tappable score-tap' + (pop === 'weights' ? ' on' : '')} {...tap('weights', '라이프스타일 고르기 열기')}>
                <ScoreBlock r={cur} modes={modes} action={<span className="tap-hint">{life ? `${life.emoji} ${life.label}` : `직접 정한 비율 ${modes.map((m) => w[m]).join('·')}`} ↗</span>} />
              </div>
            )}
            <div className="pick" role="tablist" aria-label="후보지 선택">
              {byRank.map(({ c, i, rank }) => <button key={c.id} role="tab" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => select(i)} title={c.name} aria-label={`${rank}위 ${c.name}`}>{rank}</button>)}
            </div>
            </div>
          </div>
          {pop === 'weights' && <SettingsPopover kind="weights" hubs={hubs} value={pref} onChange={(p) => setState({ ...state, pref: p })} onClose={close} />}
        </div>

        {/* 왼쪽 아래: 주요 목적지(따로) — 누르면 주 방문 횟수·이동수단 창 */}
        <div className="selected-area anchor">
          <div className={'panel hubs-panel tappable' + (pop === 'weekly' ? ' on' : '')} {...tap('weekly', '목적지별 주 방문 횟수·이동수단 조정 열기')}>
            <div className="panel-head"><h2>주요 목적지</h2><span className="tap-hint">주 방문 횟수 ↗</span></div>
            {hubs.map((h) => {
              const t = pref.weekly[h.id] ?? 0
              const m = pref.hubMode?.[h.id] ?? 'auto'
              return (
                <div className="hub-line" key={h.id}>
                  <span className="hub-mark" aria-hidden>{hubEmoji(h.category)}</span>
                  <div><b>{h.name}</b><small>{h.category} · {weeklyText(t)}{t >= 1 && t !== 1 ? '' : t === 1 ? '(월 4회)' : ''} · {m === 'auto' ? '수단 자동' : `${MODE_INFO[m].emoji} ${MODE_INFO[m].label}`} · 반영 {weekSum > 0 ? Math.round((t / weekSum) * 100) : Math.round(100 / hubs.length)}%</small></div>
                  <button className="x no-pop" title="이 목적지 빼기" aria-label={`${h.name} 빼기`} onClick={() => update(removeHub(state, h.id))}>×</button>
                </div>
              )
            })}
            {hubs.length === 0 && <p className="muted">검색해서 목적지를 넣어 주세요(최대 {MAX_HUBS}곳).</p>}
          </div>
          {pop === 'weekly' && <SettingsPopover kind="weekly" hubs={hubs} value={pref} onChange={(p) => setState({ ...state, pref: p })} onClose={close} />}
        </div>

        <section className="map-area">
          <MapView candidates={candidates} hubs={hubs} active={active} onSelect={select} focusKey={focusKey} hubId={hubId} onHub={setHubPick} insights={insights} focusHubIds={mainHubIds} ranks={ranks} preview={preview} results={found} centerRef={mapCenter} majors={majors} spots={SPOTS} parks={layers.walk ? areaPins : []} layers={layers} onLayer={toggleLayer}
            parkAreas={layers.walk ? PARK_AREAS : undefined} previewFly={previewFly} onMapPick={(place, kind, at) => setMapPick({ place, kind, at, n: Date.now() })}
            onSpot={onSpot} libraries={mapLibraries} zones={mapZones} catPins={catPins} overlayFit={overlayFit} onCatOpen={(start) => { setGalleryIdx(null); setGalleryStart(start); setCatDlg('gallery') }} />
          {layers.walk && (
            <p className="layer-note" role="status">
              {parkState === 'loading' ? '🌳 산책 — 공원·하천 찾는 중…' : parkState === 'error' ? '🌳 산책 — 공원 자료를 받지 못했어요(잠시 뒤 다시 켜 보세요)'
                : stroll?.nearest ? `🌳 산책 — 가장 가까운 ${stroll.nearest.p.kind} ${stroll.nearest.p.name} ${Math.round(stroll.nearest.m / 10) * 10}m · 도보 10분(${STROLL_RADIUS}m) 안 ${stroll.count}곳`
                : '🌳 산책 — 도보 10분(800m) 안에 등록된 공원·하천이 없어요'}
              {parkState !== 'loading' && <span className="layer-legend"><i aria-hidden />공원 점수 {PARK_AREA_MIN}점 이상(진할수록 높음)</span>}
            </p>
          )}
          <SearchBox hubs={hubs} tripsOf={(id) => pref.weekly[id] ?? 0} onCandidate={onCandidate} onHub={onHub} onPreview={(p, fly = true) => { setPreview(p); setPreviewFly(fly) }} onResults={setFound} centerRef={mapCenter} external={mapPick} />
        </section>

        {/* 오른쪽 열(넓은 화면): 입지 요인 → 카페·식당 → 출퇴근 인사이트를 위에서부터 빈틈없이 쌓는다. 좁은 화면에서는 이 묶음이 없는 것처럼(display: contents) 각자 칸에 */}
        <div className="right-col">
        <aside className="factors-area">
          <FactorsPanel cat={catIdx && cur ? catIdx[Math.min(active, catIdx.length - 1)] ?? null : null} catOn={catState.on}
            onToggleCat={() => setCats({ ...catState, on: !catState.on })} onRegister={() => setCatDlg('register')} onGallery={(start = 0) => { setGalleryIdx(null); setGalleryStart(start); setCatDlg('gallery') }}
            com={cur ? comIdx[Math.min(active, comIdx.length - 1)] ?? null : null} comCounts={walk5Counts(candidates[active], !!pref.bike)} bike={!!pref.bike} open={factorOpen} onOpen={setFactorOpen} best={best} comPrefs={comPrefs} onComPrefs={setComPrefs}
            place={placeFor(candidates[active], !!pref.bike)} placeOn={placeOn} onPlaceOn={setPlaceOn} missing={liveNote(candidates[active])} />
        </aside>

        {/* 카페·식당 광고 → 출퇴근 인사이트: 지도 높이에 맞춘 입지 요인 아래(후보지별 비교 오른쪽 옆)에 내용만큼 쌓는다(입지 요인이 길어져도 서로 가리지 않음) */}
        <aside className="side-right commute-area">
          <SpotCards candidates={candidates} flash={spotFlash} />
            {cur && <CommutePanel r={cur} weekly={pref.weekly} settings={{ kmpl: commute.kmpl, fuel: commute.fuel ?? fuelAuto?.price ?? DEFAULT_FUEL }}
      fuelAuto={fuelAuto} fuelManual={commute.fuel !== null} onKmpl={(n) => saveC({ ...commute, kmpl: n })} onFuel={(n) => saveC({ ...commute, fuel: n })} />}
        </aside>
        </div>

        {/* 후보지별 비교 양옆: 추천 카드 자리(추후 광고) — 왼쪽 부동산 매물(카페·식당은 오른쪽 입지 요인 아래) */}
        <ListingCards candidates={candidates} />

        <section className="cards-area">
          {results.length > 0 && <CompareCards results={results} com={comPrefs.on ? comIdx : null} hubs={hubs} active={active} bike={!!pref.bike} onSelect={select} onRename={rename} />}
        </section>
      </main>

      <p className="foot">도보·자전거는 OSM 길 거리, 대중교통은 서울시 환승경로, 차량은 네이버 실측(없으면 "추정") · 바꾼 후보지·목적지·선호도는 이 브라우저에만 저장됩니다</p>
      {guide && <GuidePanel onClose={() => setGuide(false)} />}
      {catDlg === 'register' && <CatRegister state={catState} onChange={setCats} onClose={() => setCatDlg('none')} />}
      {catDlg === 'gallery' && catIdx && (() => {
        const i = Math.min(galleryIdx ?? active, catIdx.length - 1)
        return <CatGallery title={candidates[i]?.name ?? ''} cats={catIdx[i]?.cats ?? []} user={catState.user} start={galleryStart} onRemoveMine={(id) => setCats(removeMyPhoto(catState, id))} onClose={() => setCatDlg('none')} />
      })()}
    </div>
  )
}
