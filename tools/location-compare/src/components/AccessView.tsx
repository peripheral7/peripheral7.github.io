import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { LatLngExpression } from 'leaflet'
import { api } from '../lib/api'
import type { Home, Hub, MobilityPreference, RouteSummary, TransitPoi } from '../types'
import { PreferencePanel } from './PreferencePanel'
type Props = { homes: Home[]; hubs: Hub[]; onManageHubs: (role?: '본가'|'학교'|'직장'|'기타'|'교통·상업') => void; onManageHomes: () => void; onPreferencesSaved: () => void; embedded?: boolean }
type PoiResponse = { items: TransitPoi[]; total: number; source_status: string; source_note: string; usable_count: number; response_code?: string; response_message?: string }
type AccessResponse = { routes: RouteSummary[]; mobility_score: number | null }
const scoreClass = (score: number) => score >= 8 ? 'score-good' : score >= 5 ? 'score-mid' : 'score-low'
const homeIcon = (index: number) => L.divIcon({ className: 'map-pin-shell', html: `<span class="map-pin map-pin-home">${index + 1}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] })
const hubIcon = () => L.divIcon({ className: 'map-pin-shell', html: '<span class="map-pin map-pin-hub">◆</span>', iconSize: [30, 30], iconAnchor: [15, 15] })
function MapFocus({ lat, lng, focusKey }: { lat: number; lng: number; focusKey: number }) {
  const map = useMap()
  useEffect(() => {
    const target = L.latLng(lat, lng)
    const targetZoom = Math.max(map.getZoom(), 14)
    const isSameCenter = map.getCenter().equals(target, 0.00001)
    if (map.getZoom() === targetZoom) {
      if (!isSameCenter) map.panTo(target, { animate: true, duration: .55 })
      return
    }
    map.flyTo(target, targetZoom, { duration: .55 })
  }, [map, lat, lng, focusKey])
  return null
}
export function AccessView({ homes, hubs, onManageHubs, onManageHomes, onPreferencesSaved, embedded = false }: Props) {
  const [homeId, setHomeId] = useState<number>(homes[0]?.id ?? 0)
  const [routesByHome, setRoutesByHome] = useState<Record<number, RouteSummary[]>>({})
  const [mobilityScores, setMobilityScores] = useState<Record<number, number | null>>({})
  const [preference, setPreference] = useState<MobilityPreference>({ primary_modes: ['대중교통'], secondary_modes: ['차량'], transit_weight: 50, car_weight: 30, active_weight: 20, transit_priority_hub_ids: [], hub_monthly_roundtrips: {}, hub_weight_multipliers: {} })
  const [activeHub, setActiveHub] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const carouselDragRef = useRef({ pointerId: 0, startX: 0, startScroll: 0, moved: false })
  const home = useMemo(() => homes.find(item => item.id === homeId) ?? homes[0], [homes, homeId])
  const orderedHomes = useMemo(() => [...homes].sort((a, b) => (mobilityScores[b.id] ?? -1) - (mobilityScores[a.id] ?? -1) || b.overall - a.overall), [homes, mobilityScores])
  const routes = useMemo(() => home ? [...(routesByHome[home.id] ?? [])].sort((a, b) => b.monthly_roundtrips - a.monthly_roundtrips || b.accessibility_score - a.accessibility_score || a.hub_name.localeCompare(b.hub_name)) : [], [home, routesByHome])
  const load = async () => {
    if (!homes.length) { setRoutesByHome({}); return }
    setLoading(true); setError('')
    try {
      const [routeResponses, preferenceResponse] = await Promise.all([
        Promise.all(homes.map(async item => {
          const response = await api(`accessibility/${item.id}`)
          if (!response.ok) throw Error()
          return [item.id, await response.json() as AccessResponse] as const
        })),
        api('preferences'),
      ])
      setRoutesByHome(Object.fromEntries(routeResponses.map(([id, data]) => [id, data.routes])))
      setMobilityScores(Object.fromEntries(routeResponses.map(([id, data]) => [id, data.mobility_score])))
      if (preferenceResponse.ok) setPreference(await preferenceResponse.json() as MobilityPreference)
    } catch { setError('교통 접근성 정보를 불러오지 못했습니다.') } finally { setLoading(false) }
  }
  useEffect(() => { if (!homes.some(item => item.id === homeId)) setHomeId(homes[0]?.id ?? 0) }, [homes, homeId])
  useEffect(() => { load() }, [homes])
  useEffect(() => { setActiveHub(routes[0]?.hub_id ?? null) }, [home?.id, routes])
  const moveCards = (direction: -1 | 1) => carouselRef.current?.scrollBy({ left: carouselRef.current.clientWidth * direction * .78, behavior: 'smooth' })
  const startCarouselDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    const carousel = carouselRef.current
    if (!carousel) return
    carouselDragRef.current = { pointerId: event.pointerId, startX: event.clientX, startScroll: carousel.scrollLeft, moved: false }
  }
  const dragCarousel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const carousel = carouselRef.current
    const drag = carouselDragRef.current
    if (!carousel || drag.pointerId !== event.pointerId || event.buttons !== 1) return
    const distance = event.clientX - drag.startX
    if (!drag.moved && Math.abs(distance) < 14) return
    if (!drag.moved) {
      drag.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    event.preventDefault()
    carousel.scrollLeft = drag.startScroll - distance
  }
  const stopCarouselDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = carouselDragRef.current
    if (drag.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const selectHomeCard = (id: number, target: HTMLElement) => {
    if (carouselDragRef.current.moved) {
      carouselDragRef.current.moved = false
      return
    }
    setHomeId(id)
    target.closest('.home-toggle-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }
  if (!home) return <section className={embedded ? 'access-embed' : 'page access-page'}><div className="empty-state">비교 대상으로 선택된 후보 주택이 없습니다.</div></section>
  const selectedRoute = routes.find(item => item.hub_id === activeHub) ?? routes[0]
  const homePosition: LatLngExpression = [home.lat, home.lng]
  const selectedPositions: LatLngExpression[] | undefined = selectedRoute ? [[home.lat, home.lng], [selectedRoute.hub_lat, selectedRoute.hub_lng]] : undefined
  const modePriority = (route: RouteSummary, mode: string) => {
    if (preference.transit_priority_hub_ids.includes(route.hub_id)) return mode === '대중교통' ? 'is-primary-mode' : ''
    return preference.primary_modes.includes(mode) ? 'is-primary-mode' : ''
  }
  const routeCard = (route: RouteSummary, item: Home) => (
    <button key={route.hub_id} className={`destination-row ${item.id === home.id && route.hub_id === activeHub ? 'selected' : ''}`} onClick={() => { setHomeId(item.id); setActiveHub(route.hub_id) }}>
      <div className="destination-main"><div><span>{route.category}</span><b>{route.hub_name}</b><small>{route.distance_km}km</small>{route.proximity_highlights.length > 0 && <p className="proximity-highlight" aria-label="다른 후보지보다 압도적으로 가까운 이동수단">★ {route.proximity_highlights.join(' · ')}</p>}</div></div>
      <div className="destination-score"><span>접근성 지수</span><strong className={`tabular ${scoreClass(route.accessibility_score)}`}>{route.accessibility_score.toFixed(1)}<i>/10</i></strong></div>
      <div className="destination-times"><div className={modePriority(route, '대중교통')}><span>대중교통</span><b className="tabular">{route.transit_minutes}분</b><small>도보 {route.station_access_minutes}분 · 대기 {route.wait_minutes}분 · 환승 {route.transfer_count}회</small></div><div className={modePriority(route, '차량')}><span>차량(출퇴근/여유)</span><b className="tabular">{route.car_rush_minutes}분/{route.car_day_minutes}분</b></div>{(route.walk_minutes !== null || route.bike_minutes !== null) && <div className={modePriority(route, '도보·자전거')}><span>도보/자전거</span><b className="tabular">{route.walk_minutes !== null ? `${route.walk_minutes}분` : '—'} / {route.bike_minutes !== null ? `${route.bike_minutes}분` : '—'}</b></div>}</div>
    </button>
  )
  const relationshipMap = <section className="access-map-card relationship-map-card"><div className="section-head"><div><p className="eyebrow">LOCATION RELATIONSHIP</p><h3>후보지와 주요 거점 위치 관계</h3></div><span className="map-note">원형 번호는 후보지, 사각 표식은 주요 거점입니다.</span></div><MapContainer center={homePosition} zoom={10} className="access-map" scrollWheelZoom={true}><MapFocus lat={home.lat} lng={home.lng} focusKey={home.id}/><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tiles.osm.kr/hot/{z}/{x}/{y}.png"/>{orderedHomes.map((item, index) => <Marker key={item.id} icon={homeIcon(index)} position={[item.lat, item.lng] as LatLngExpression} eventHandlers={{ click: () => setHomeId(item.id) }}><Popup><b>후보 {index + 1} · {item.name}</b><br/>{item.address}<br/><strong>종합 {item.overall}점</strong><br/><small>교통 {item.transport} · 상권 {item.commerce} · 공원 {item.park} · 공공 {item.public}</small></Popup></Marker>)}{routes.map(route => <Marker key={route.hub_id} icon={hubIcon()} position={[route.hub_lat, route.hub_lng] as LatLngExpression} eventHandlers={{ click: () => setActiveHub(route.hub_id) }}><Popup><b>주요 거점 · {route.hub_name}</b><br/>{route.hub_address}<br/><strong>접근성 {route.accessibility_score.toFixed(1)}/10</strong></Popup></Marker>)}{selectedPositions && <Polyline positions={selectedPositions} pathOptions={{ color: 'var(--color-primary)', weight: 4, opacity: .8 }} />}</MapContainer><div className="map-key"><span><i className="map-key-home">1</i> 후보지</span><span><i className="map-key-hub">◆</i> 주요 거점</span></div></section>
  const cards = <section className="home-carousel-section" aria-label="거주 후보지별 주요 거점 이동 정보"><div className="home-carousel-head"><div><p className="eyebrow">CANDIDATE ROUTE COMPARISON</p><h3>후보지별 주요 거점 이동 정보</h3></div><div className="carousel-controls"><button onClick={() => moveCards(-1)} aria-label="이전 후보지 보기">‹</button><button onClick={() => moveCards(1)} aria-label="다음 후보지 보기">›</button></div></div><p className="destination-order-help">카드를 선택하면 해당 후보지 위치와 경로가 지도에 표시됩니다. 거점은 월 왕복 횟수가 높은 순으로 자동 정렬됩니다.</p><div className="home-toggle-list" ref={carouselRef}>{orderedHomes.map(item => <article key={item.id} className={`home-toggle-card ${item.id === home.id ? 'active' : ''}`}><button className="home-toggle-heading" onPointerDown={startCarouselDrag} onPointerMove={dragCarousel} onPointerUp={stopCarouselDrag} onPointerCancel={stopCarouselDrag} onClick={(event) => selectHomeCard(item.id, event.currentTarget)}><span>거주 후보지</span><b>{item.name}</b><small>{item.address}</small><strong className="tabular">{(mobilityScores[item.id] ?? 0).toFixed(1)}<i>/10</i></strong></button><div className="destination-stack">{(routesByHome[item.id] ?? []).map(route => routeCard(route, item))}</div></article>)}</div></section>
  const view = <>
    <section className="page-intro mobility-intro"><div><p className="eyebrow">LOCATION & MOBILITY INTELLIGENCE / 01</p><h2>후보 주택 비교 · 주요 거점 교통 접근성</h2><p>주택 외부 입지 점수와 주요 거점까지의 이동 편의성을 함께 비교합니다.</p></div><div className="intro-actions"><PreferencePanel hubs={hubs} onSaved={() => { load(); onPreferencesSaved() }} /><button className="primary-button" onClick={() => onManageHubs()}>⚙ 주요 거점 관리</button></div></section>
    <section className="mobility-dashboard-layout">{relationshipMap}<div className="mobility-card-column"><div className="quick-hub-tabs" aria-label="자주 찾는 거점 추가"><span>자주 찾는 거점 추가</span><button onClick={() => onManageHubs('본가')}>＋ 본가 주소 검색</button><button onClick={() => onManageHubs('학교')}>＋ 학교 주소 검색</button><button onClick={() => onManageHubs('직장')}>＋ 직장 주소 추가</button><button onClick={() => onManageHubs('기타')}>＋ 기타 주소 추가</button><button onClick={() => onManageHubs('교통·상업')}>＋ 교통·상업 추가</button></div>{cards}</div></section>
    {loading ? <div className="loading-state">이동 시간을 계산하는 중입니다…</div> : error ? <div className="error-state">{error}</div> : routes.length === 0 ? <section className="empty-state">등록된 주요 거점이 없습니다.<button onClick={() => onManageHubs()}>주요 거점 추가하기</button></section> : null}
  </>
  return embedded ? <section className="access-embed">{view}</section> : <main className="page access-page">{view}</main>
}
