import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BASE_DEPOSIT, MAX_HUBS, PROFILES, activeModes, profileOf, lifestyleOf, baseRent, hubEmoji, weeklyText, won, type Place } from './data'
import { evaluate, fmt, hubInsights, shareOf } from './scoring'
import { addCandidate, load, loadUser, removeCandidate, removeHub, save, saveUser, setHub, updateCandidate, type State } from './store'
import { MapView } from './components/MapView'
import type { MapPoint } from './placeNear'
import { SearchBox } from './components/SearchBox'
import { FactorsPanel, type FactorBest, type FactorOpen } from './components/Panels'
import { EdgeNav, ScoreBlock, Swipe, type SwipeApi } from './components/TransportCard'
import { MODE_INFO } from './components/SettingsPopover'
import { CompareCards } from './components/CompareCards'
import { MobileNotice } from './components/MobileNotice'
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
import { loadParks, parkAreaPin, strollNear, PARK_AREAS, PARK_AREA_MIN, STROLL_RADIUS, type Park } from './parks'
import { PEACE, PLACE_KEYS, loadPlaceOn, placeFor, placeSummary, savePlaceOn, type PlaceOn } from './places'
import { liveMajors, liveNote, requestLive } from './live'
import { LANG, addr, catName, isEn, manEn, pn, rankText, setLang, t } from './i18n'
import { MAJORS, commercialIndex, loadCommercial, pickedCats, saveCommercial, walk5Counts, type CommercialPrefs } from './commercial'

// " · 3,000/40 (1,000 기준 월 50)" · " · ₩30M / ₩400K (≈ ₩500K/mo at ₩10M deposit)" — 금액을 안 넣었으면 빈 글자
const rentText = (c: { deposit?: number; rent?: number }) => {
  const b = baseRent(c)
  if (b === null) return ''
  const same = c.deposit === BASE_DEPOSIT
  return isEn
    ? ` · ${won(c.deposit ?? 0)} / ${manEn(c.rent ?? 0)}${same ? '' : ` (≈ ${manEn(b)}/mo at ${won(BASE_DEPOSIT)} deposit)`}`
    : ` · ${won(c.deposit ?? 0)}/${c.rent ?? 0}${same ? '' : ` (${won(BASE_DEPOSIT)} 기준 월 ${b})`}`
}

export default function App() {
  // 사용자(위쪽 탭): 후보지·목적지·선호도를 사용자마다 따로 저장한다(data.ts PROFILES — '나' + 시험용 대학교 4곳)
  const [user, setUser] = useState(loadUser)
  const [state, setState] = useState<State>(() => load(user))
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
  // 지도의 대중교통 경로: 고른 후보지 → "장단점 기준" 목적지(걸어가는 거리라 대중교통을 빼는 곳·아직 찾는 중인 곳은 없음)
  const curHub = hubIndex >= 0 ? cur?.hubs[hubIndex] : undefined
  const transitRoute = useMemo(() => (curHub && !curHub.transitSkipped && !curHub.transitPending && curHub.trip.legs.length
    ? { hubId: curHub.hub.id, legs: curHub.trip.legs, min: curHub.trip.transit, label: curHub.hub.category || curHub.hub.name } : null), [curHub])
  const insights = useMemo(() => (hubIndex >= 0 ? hubInsights(results, hubIndex) : results.map(() => ({ pros: [], cons: [] }))), [results, hubIndex])

  useEffect(() => { save(state, user) }, [state]) // eslint-disable-line react-hooks/exhaustive-deps -- 사용자를 바꾸면 state 도 같이 바뀐다
  useEffect(() => { saveCats(catState) }, [catState])
  useEffect(() => { saveCommercial(comPrefs) }, [comPrefs])
  useEffect(() => { savePlaceOn(placeOn) }, [placeOn])
  const comIdx = useMemo(() => commercialIndex(candidates, comPrefs, !!pref.bike), [candidates, comPrefs, pref.bike, liveVer]) // eslint-disable-line react-hooks/exhaustive-deps
  // 지도에 따로 표시할 주요 매장: 필수 업종의 것만(선호로 옮긴 업종은 지도에 안 보임 — 사용자 지정 10-14)(상권 지수를 껐으면 없음)
  // 지도 위 지표 단추: 상권(주요 매장 표시)·산책(공원·하천 표시). 이 브라우저에 기억한다.
  const [layers, setLayers] = useState<{ com: boolean; walk: boolean }>(() => {
    try { const l = JSON.parse(localStorage.getItem('locCompare.layers.v1') || 'null'); if (l) return { com: l.com !== false, walk: !!l.walk } } catch { /* 기본값 */ }
    return { com: true, walk: false }
  })
  const toggleLayer = (k: 'com' | 'walk') => setLayers((l) => { const n = { ...l, [k]: !l[k] }; try { localStorage.setItem('locCompare.layers.v1', JSON.stringify(n)) } catch { /* 저장 못 해도 동작 */ } return n })
  const majors = useMemo(() => { const all = [...MAJORS, ...liveMajors(candidates)], on = new Set(comPrefs.need); return layers.com ? (comPrefs.on ? all.filter((m) => on.has(m.cat)) : all) : [] }, [comPrefs, layers.com, candidates, liveVer]) // eslint-disable-line react-hooks/exhaustive-deps
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
  const switchUser = (id: string) => {
    if (id === user) return
    saveUser(id); setUser(id); setState(load(id))
    firstPick.current = false // 새 사용자도 처음엔 종합 1순위 후보지
    setActive(0); setHubPick(null); setPop('none'); setFactorOpen(null); setPreview(null); setFound([]); setFocusKey((k) => k + 1)
  }
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
  // 교통평점 카드 넘기기: 순위 순서로 앞·뒤 후보지(끝에서는 반대 끝으로 돈다)
  const k = byRank.findIndex((x) => x.i === active)
  const swipe: SwipeApi = useRef(null)
  // 후보지 수정(후보지별 비교 카드 ✎): 이름·보증금·월세·관리비·용도, 삭제
  const editCandidate = (id: string, patch: Parameters<typeof updateCandidate>[2]) => setState(updateCandidate(state, id, patch))
  const deleteCandidate = (id: string) => update(removeCandidate(state, id))
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
  const mapZones = useMemo(() => (factorOpen === 'peace' && curPlace?.peace.zones && candidates[active] ? { lat: candidates[active].lat, lng: candidates[active].lng, ...curPlace.peace.zones, radiusM: PEACE.zones.radiusM, calcM: PEACE.foodRadiusM } : null), [factorOpen, curPlace, candidates, active])
  // 펼친 요인 범위로 지도 맞춤: 평화로움 = 반경 75m(구분도 50m + 여유), 도서관 = 후보지 + 도서관, 길고양이 = 후보지 + 고양이
  const overlayFit = useMemo(() => {
    const c = candidates[active]
    if (!c || !factorOpen) return null
    const d = 150 / 110540, e = 150 / (111320 * Math.cos((c.lat * Math.PI) / 180))
    const pd = 75 / 110540, pe = 75 / (111320 * Math.cos((c.lat * Math.PI) / 180))
    const pts: [number, number][] = factorOpen === 'peace' ? [[c.lat - pd, c.lng - pe], [c.lat + pd, c.lng + pe]]
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
        <span className="brand"><span className="logo"><span /><span /><span /></span>{t('여기살까?', 'WhereTo?')}</span>
        <nav className="users" role="tablist" aria-label={t('사용자 바꾸기', 'Switch user')}>
          {PROFILES.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={p.id === user} className={'user-tab' + (p.id === user ? ' on' : '') + (p.id === 'me' ? '' : ' test')} title={p.note} onClick={() => switchUser(p.id)}>
              <span aria-hidden>{p.emoji}</span>{p.label}{p.id !== 'me' && <small>{t('시험', 'test')}</small>}
            </button>
          ))}
        </nav>
        <nav className="pills">
          <span className="pill active">{t('입지 지도', 'Location map')}</span>
          <button className="pill" onClick={() => setGuide(true)}>{t('계산 방식', 'How it works')}</button>
        </nav>
        {/* 화면 언어: 바꾸면 저장하고 다시 연다(i18n.ts) */}
        <div className="lang-switch" role="group" aria-label="Language / 언어">
          {(['ko', 'en'] as const).map((l) => (
            <button key={l} type="button" lang={l} aria-pressed={LANG === l} className={LANG === l ? 'on' : ''} title={l === 'ko' ? '한국어' : 'English'} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </div>
      </header>

      <main className="stage" ref={stageRef}>
        {/* 왼쪽 위: 교통평점 카드(한 장) = 고른 후보지(이름·3D 집·종합 원형)·주요 교통수단·수단별 교통평점. ⚙ = 라이프스타일.
            가장자리 띠에 마우스를 올리면 어두운 그라데이션 + ‹ ›, 카드를 끌어서 넘기기(끝에서는 반대 끝으로) */}
        <div className="modes-area anchor">
          <div className="panel transport-card">
            {byRank.length > 1 && <EdgeNav onPrev={() => swipe.current?.(-1)} onNext={() => swipe.current?.(1)} />}
            <div className="panel-head tc-head">
              <h2>{t('교통평점', 'Transport score')}</h2>
              <span className="tc-life">{life ? `${life.emoji} ${life.label}` : `${t('직접 정한 비율', 'Custom mix')} ${modes.map((m) => w[m]).join('·')}`}</span>
              <button type="button" className={'gear' + (pop === 'weights' ? ' on' : '')} data-pop-trigger="weights" aria-expanded={pop === 'weights'} aria-label={t('라이프스타일 설정', 'Lifestyle settings')} title={t('라이프스타일 설정', 'Lifestyle settings')} onClick={() => toggle('weights')}>⚙️</button>
            </div>
            <div className="tc-body">
            {cur ? (
              <Swipe pos={Math.max(0, k)} count={byRank.length} api={swipe} onMove={(d) => select(byRank[(k + d + byRank.length) % byRank.length].i)}>
                <div className="sel-head house-head">
                  <div className="sel-text">
                    <span className="tag">{t('종합', 'Overall')} {rankText(cur.rank)}{rentText(cur.candidate)}</span>
                    <h3>{pn(cur.candidate.name)}<b className="sel-score">{fmt(cur.total)}<small>/ 10</small></b></h3>
                    <p>{addr(cur.candidate.address)}</p>
                  </div>
                </div>
                <ScoreBlock r={cur} modes={modes} pref={pref} />
              </Swipe>
            ) : <p className="empty">{t('검색해서 후보지를 넣어 주세요.', 'Search to add a candidate home.')}</p>}
            <div className="pick" role="tablist" aria-label={t('후보지 선택', 'Pick a candidate')}>
              {byRank.map(({ c, i, rank }) => <button key={c.id} role="tab" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => select(i)} title={pn(c.name)} aria-label={`${rankText(rank)} ${pn(c.name)}`}>{rank}</button>)}
            </div>
            </div>
          </div>
          {pop === 'weights' && <SettingsPopover kind="weights" hubs={hubs} value={pref} onChange={(p) => setState({ ...state, pref: p })} onClose={close} />}
        </div>

        {/* 왼쪽 아래: 주요 목적지(따로) — 누르면 주 방문 횟수·이동수단 창 */}
        <div className="selected-area anchor">
          <div className={'panel hubs-panel tappable' + (pop === 'weekly' ? ' on' : '')} {...tap('weekly', t('목적지별 주 방문 횟수·이동수단 조정 열기', 'Open visits-per-week and travel mode settings'))}>
            <div className="panel-head"><h2>{t('주요 목적지', 'Destinations')}</h2><span className="tap-hint">{t('주 방문 횟수 ↗', 'Visits per week ↗')}</span></div>
            {hubs.map((h) => {
              const n = pref.weekly[h.id] ?? 0
              const m = pref.hubMode?.[h.id] ?? 'auto'
              return (
                <div className="hub-line" key={h.id}>
                  <span className="hub-mark" aria-hidden>{hubEmoji(h.category)}</span>
                  <div><b>{pn(h.name)}</b><small>{catName(h.category)} · {weeklyText(n)}{n === 1 ? t('(월 4회)', ' (4×/month)') : ''} · {m === 'auto' ? t('수단 자동', 'auto mode') : `${MODE_INFO[m].emoji} ${MODE_INFO[m].label}`} · {t('반영', 'weight')} {weekSum > 0 ? Math.round((n / weekSum) * 100) : Math.round(100 / hubs.length)}%</small></div>
                  <button className="x no-pop" title={t('이 목적지 빼기', 'Remove this destination')} aria-label={t(`${h.name} 빼기`, `Remove ${pn(h.name)}`)} onClick={() => update(removeHub(state, h.id))}>×</button>
                </div>
              )
            })}
            {hubs.length === 0 && <p className="muted">{t(`검색해서 목적지를 넣어 주세요(최대 ${MAX_HUBS}곳).`, `Search to add destinations (up to ${MAX_HUBS}).`)}</p>}
          </div>
          {pop === 'weekly' && <SettingsPopover kind="weekly" hubs={hubs} value={pref} onChange={(p) => setState({ ...state, pref: p })} onClose={close} />}
        </div>

        <section className="map-area">
          <MapView candidates={candidates} hubs={hubs} active={active} onSelect={select} focusKey={focusKey} hubId={hubId} onHub={setHubPick} insights={insights} focusHubIds={mainHubIds} ranks={ranks} preview={preview} results={found} centerRef={mapCenter} majors={majors} spots={SPOTS} parks={layers.walk ? areaPins : []} layers={layers} onLayer={toggleLayer}
            parkAreas={layers.walk ? PARK_AREAS : undefined} previewFly={previewFly} onMapPick={(place, kind, at) => setMapPick({ place, kind, at, n: Date.now() })}
            onSpot={onSpot} libraries={mapLibraries} zones={mapZones} catPins={catPins} overlayFit={overlayFit} transit={transitRoute} onCatOpen={(start) => { setGalleryIdx(null); setGalleryStart(start); setCatDlg('gallery') }} />
          {layers.walk && (
            <p className="layer-note" role="status">
              {parkState === 'loading' ? t('🌳 산책 — 공원·하천 찾는 중…', '🌳 Walks — finding parks and streams…') : parkState === 'error' ? t('🌳 산책 — 공원 자료를 받지 못했어요(잠시 뒤 다시 켜 보세요)', '🌳 Walks — could not load park data (try again shortly)')
                : stroll?.nearest ? t(`🌳 산책 — 가장 가까운 ${stroll.nearest.p.kind} ${stroll.nearest.p.name} ${Math.round(stroll.nearest.m / 10) * 10}m · 도보 10분(${STROLL_RADIUS}m) 안 ${stroll.count}곳`,
                  `🌳 Walks — nearest ${stroll.nearest.p.kind === '하천' ? 'stream' : 'park'}: ${pn(stroll.nearest.p.name)} ${Math.round(stroll.nearest.m / 10) * 10}m · ${stroll.count} within a 10-min walk (${STROLL_RADIUS}m)`)
                : t(`🌳 산책 — 도보 10분(${STROLL_RADIUS}m) 안에 등록된 공원·하천이 없어요`, `🌳 Walks — no parks or streams within a 10-min walk (${STROLL_RADIUS}m)`)}
              {parkState !== 'loading' && <span className="layer-legend"><i aria-hidden />{t(`공원 점수 ${PARK_AREA_MIN}점 이상(진할수록 높음)`, `Parks scoring ${PARK_AREA_MIN}+ (darker = higher)`)}</span>}
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
          {results.length > 0 && <CompareCards results={results} com={comPrefs.on ? comIdx : null} hubs={hubs} active={active} bike={!!pref.bike} onSelect={select} onEdit={editCandidate} onDelete={deleteCandidate} />}
        </section>
      </main>

      <p className="foot">{user !== 'me' && t(`시험용 사용자 「${profileOf(user).label}」(${profileOf(user).note}) · `, `Test user "${profileOf(user).label}" (${profileOf(user).note}) · `)}{t('도보·자전거는 OSM 길 거리, 대중교통은 서울시 환승경로, 차량은 네이버 실측(없으면 "추정") · 바꾼 후보지·목적지·선호도는 이 브라우저에만 저장됩니다',
        'Walking and cycling use OpenStreetMap path distances, transit uses the Seoul transfer-route API, driving uses Naver measurements ("est." when missing) · Your candidates, destinations and preferences are saved only in this browser')}</p>
      <MobileNotice />
      {guide && <GuidePanel onClose={() => setGuide(false)} />}
      {catDlg === 'register' && <CatRegister state={catState} onChange={setCats} onClose={() => setCatDlg('none')} />}
      {catDlg === 'gallery' && catIdx && (() => {
        const i = Math.min(galleryIdx ?? active, catIdx.length - 1)
        return <CatGallery title={pn(candidates[i]?.name ?? '')} cats={catIdx[i]?.cats ?? []} user={catState.user} start={galleryStart} onRemoveMine={(id) => setCats(removeMyPhoto(catState, id))} onClose={() => setCatDlg('none')} />
      })()}
    </div>
  )
}
