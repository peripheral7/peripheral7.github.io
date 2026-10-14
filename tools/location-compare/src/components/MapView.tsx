import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, Polygon, Polyline, Rectangle, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { hubEmoji, type Candidate, type Hub, type Place } from '../data'
import type { Insight, TransitLeg } from '../scoring'
import { WALK_STYLE, stopHtml, transitStops, transitSummary } from '../transitMap'
import { loadNaverMaps, MAP_KEY_ID, onNaverAuthFailure, reverseGeocode, type RevAddr } from '../naver'
import { CATEGORIES, type Major } from '../commercial'
import type { Spot } from '../recommend'
import { parkAreaAlpha, type Park, type ParkArea } from '../parks'
import { placeNear, type MapPoint } from '../placeNear'
import { ZONE_STYLE, catCalloutHtml, catCallouts, startCatSlides, zoneRects, type CatPin, type Zones } from '../mapOverlays'

// 지도: 네이버 지도 키(VITE_NAVER_MAP_KEY_ID)가 있으면 네이버 지도, 없거나 인증이 실패하면 OSM 밝은 지도.
// - 후보지를 고르면 "그 후보지 + 주요 목적지"가 다 들어오도록 확대·이동한다.
// - 지도 위 "장단점 기준" 단추(또는 목적지 핀)로 고른 목적지에 대해, 후보지 옆에 장점(＋)·단점(－)을 글자로 보여 준다.
//   평소에는 고른 후보지에만, 구역이 확실히 갈릴 만큼 확대하면(DETAIL_ZOOM 이상) 화면에 보이는 모든 후보지에.
// - 주요 매장(올리브영·이마트·홈플러스 등, 상권 지수에서 필수·선호로 고른 업종만)은 작은 이모지 원으로, 확대하면 브랜드 이름도.
// - "장단점 기준" 오른쪽 "후보지 한눈에"는 모든 후보지가 고르게 들어오도록 확대·이동한다(목적지는 빼고).
// - 지도를 우클릭(휴대폰은 길게 누르기)하면 그 자리를 "후보지로 / 목적지로" 추가하는 작은 메뉴 → 검색창의 등록 창으로 이어진다.
// - 추천 카페·식당(광고) 핀을 누르면 오른쪽 광고 칸의 그 카드 배경이 잠깐 강조된다(휴대폰은 그 카드까지 부드럽게 내려간다).
// - 입지 요인을 펼치면 그 요인을 지도에도: 도서관 = 📚 위치, 평화로움 = 반경 50m 소음 구분도 + 30m(계산 반경) 선, 길고양이 = 사진 말풍선.
// - 맞춤 이동은 언제나 부드럽게(네이버 panToBounds · Leaflet flyTo 짧게) — 이미 다 보여도 가운데로 옮긴다(예전엔 그대로 둬서 "눌러도 안 움직인다"로 보였다).
// - 고른 후보지 → "장단점 기준" 목적지의 대중교통 경로(있으면 점선 직선 대신): 도보 = 점선, 버스·지하철 = 노선 색 선, 정류장 = 점 + 이름표(도보 N분).
//   자료는 서울시 환승경로 + 경기 정류소 경유노선(버스 종류 색) + 경기 버스노선 궤적(실제 노선 선, 서울 버스·지하철은 근사) — TRANSIT.md.
// - "산책"을 켜면 공원 점수가 일정 이상인 공원 경계(parkAreas)를 점수만큼 진한 초록으로 칠한다.
//   효용이 높은 공원(칠한 공원)만 이름 핀을 항상 보이고, 낮은 공원은 색도 이름도 그리지 않는다(테두리 없이 칠만 한다).

type Props = {
  candidates: Candidate[]; hubs: Hub[]; active: number; onSelect: (index: number) => void; focusKey: number
  hubId: string | null; onHub: (id: string) => void; insights: Insight[]
  focusHubIds: string[] // 후보지를 고를 때 함께 화면에 넣을 주 목적지(월 왕복 50% 이상)
  ranks: number[] // 후보지 핀 숫자 = 종합 순위
  preview?: Place | null // 검색 결과를 누르면 그 위치로 옮기고 임시 표시
  results?: Place[] // 검색 결과 전부 — 지도에 작은 점으로
  centerRef?: { current: { lat: number; lng: number } | null } // 지금 지도 가운데(검색 결과를 가까운 순으로 정렬할 때 씀)
  majors?: Major[] // 지도에 따로 표시할 주요 매장
  spots?: Spot[] // 추천 카페·식당(오른쪽 카드와 같은 목록) — ☕ 핀, 확대하면 이름
  parks?: Park[] // 산책 레이어: 공원·하천
  parkAreas?: ParkArea[] // 산책 레이어: 점수 높은 공원 경계(색칠)
  layers?: { com: boolean; walk: boolean }; onLayer?: (k: 'com' | 'walk') => void // 지도 위 상권·산책 단추
  onMapPick?: (p: Place, kind: 'candidate' | 'hub', at: MapPoint) => void // 우클릭 메뉴로 고른 곳(at = 누른 점, 등록 창을 그 옆에)
  previewFly?: boolean // false 면 임시 핀만 찍고 지도는 움직이지 않는다(우클릭으로 고른 곳)
  onSpot?: (id: string) => void // 광고 카페·식당 핀을 누름
  libraries?: { name: string; lat: number; lng: number; dist: number }[] // 도서관을 펼쳤을 때
  zones?: Zones | null // 평화로움을 펼쳤을 때
  catPins?: CatPin[] // 길고양이를 펼쳤을 때
  onCatOpen?: (start: number) => void // 말풍선을 누르면 그 사진부터 크게
  overlayFit?: { key: string; pts: [number, number][] } | null // 입지 요인을 펼치면 그 범위로 맞춤(key 가 바뀔 때마다)
  transit?: { hubId: string; legs: TransitLeg[]; min: number; label: string } | null // 고른 후보지 → 그 목적지 대중교통 경로
}
/** 우클릭 메뉴 자리: 지도 안 위치(px)·지도 크기·좌표 */
type Ctx = { x: number; y: number; w: number; h: number; lat: number; lng: number }
type Inner = Props & { allKey: number; onContext: (c: Ctx | null) => void }

export const DETAIL_ZOOM = 14 // 이 확대 단계부터 모든 후보지에 장단점(동네 단위가 구분되는 정도)
const PAD = 70
const PAD_ALL = 28 // 후보지 한눈에: 가장자리 여백만 살짝
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const candHtml = (n: number, on: boolean) => `<span class="pin cand${on ? ' on' : ''}">${n}</span>`
const previewHtml = (name: string) => `<div class="nv-pin"><span class="pin preview"></span><span class="map-label preview-label">${esc(name)}</span></div>`
const RESULT_DOT = '<span class="pin result-dot"></span>'
const same = (a: Place, b: Place | null | undefined) => !!b && Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lng - b.lng) < 1e-7
export const PREVIEW_ZOOM = 16
const majorTitle = (m: Major) => `${m.brand} — ${m.name}${m.addr ? ` · ${m.addr}` : ''}`
const catEmoji = (id: string) => CATEGORIES.find((c) => c.id === id)?.emoji ?? '🏬'
/** 주요 매장: 이모지 원 + (확대했을 때) 브랜드 이름 */
/** 추천 카페·식당: ☕/🍽️ 원 + 이름(확대했을 때). 주요 매장 핀과 같은 모양, 테두리 색만 다르다. */
const spotHtml = (s: Spot, named: boolean) => `<span class="major-pin spot-pin" title="${esc(s.name)} — ${esc(s.address)} (누르면 네이버지도)"><i>${s.kind === '카페' ? '☕' : '🍽️'}</i>${named ? `<b>${esc(s.name)}</b>` : ''}</span>`
const majorHtml = (m: Major, named: boolean) => `<span class="major-pin${m.inferred ? ' inferred' : ''}" title="${esc(majorTitle(m))}"><i>${catEmoji(m.cat)}</i>${named ? `<b>${esc(m.brand)}</b>` : ''}</span>`
/** 산책: 공원·하천 이모지 원 + (확대했을 때) 이름 */
const parkHtml = (p: Park, named: boolean) => `<span class="major-pin park-pin" title="${esc(p.kind)} — ${esc(p.name)}"><i>${p.kind === '하천' ? '🌊' : '🌳'}</i>${named ? `<b>${esc(p.name)}</b>` : ''}</span>`
const libHtml = (l: { name: string; dist: number }) => `<span class="major-pin lib-pin" title="${esc(l.name)} · ${l.dist}m"><i>📚</i><b>${esc(l.name)}</b></span>`
const parkAreaTitle = (a: ParkArea) => `${a.name} · 공원 점수 ${a.value}`
const hubHtml = (h: Hub, on: boolean) => `<span class="pin hub${on ? ' on' : ''}"><b>${hubEmoji(h.category)}</b></span>`

/** 후보지 옆 글자: 이름 + (목적지 기준) 장점·단점 */
function labelHtml(name: string, ins: Insight | undefined, hub: Hub | undefined) {
  const pros = ins?.pros.length ? `<span class="pro">＋ ${ins.pros.map(esc).join(' · ')}</span>` : ''
  const cons = ins?.cons.length ? `<span class="con">－ ${ins.cons.map(esc).join(' · ')}</span>` : ''
  const rank = ins?.rank ? ` ${ins.rank}위/${ins.of}` : ''
  const head = hub ? `<small>${esc(hub.category)} 기준${rank}</small>` : ''
  return `<b>${esc(name)}</b>${head}${pros}${cons}`
}

/** 모든 후보지(한번에 보기) */
const allCands = (candidates: Candidate[]): [number, number][] => candidates.map((c) => [c.lat, c.lng])

/** 고른 후보지 + 주 목적지(없으면 모든 목적지)를 감싸는 점들 */
function frame(candidates: Candidate[], hubs: Hub[], active: number, focusHubIds: string[]): [number, number][] {
  const cur = candidates[active]
  const main = hubs.filter((h) => focusHubIds.includes(h.id))
  const targets = main.length ? main : hubs
  const pts: [number, number][] = (cur ? [cur, ...targets] : [...candidates, ...targets]).map((p) => [p.lat, p.lng])
  return withMinSpan(pts)
}

/** 후보지와 주 목적지가 아주 가까우면(수백 m) 지나치게 확대되지 않게, 가운데는 그대로 두고 최소 범위(약 700m)로 넓힌다 */
const MIN_SPAN = 0.0065
function withMinSpan(pts: [number, number][]): [number, number][] {
  if (!pts.length) return pts
  const la = pts.map((p) => p[0]), ln = pts.map((p) => p[1])
  const cy = (Math.min(...la) + Math.max(...la)) / 2, cx = (Math.min(...ln) + Math.max(...ln)) / 2
  const hy = Math.max(MIN_SPAN / 2, (Math.max(...la) - Math.min(...la)) / 2), hx = Math.max(MIN_SPAN * 0.65, (Math.max(...ln) - Math.min(...ln)) / 2)
  return [...pts, [cy - hy, cx - hx], [cy + hy, cx + hx]]
}

export function MapView(props: Props) {
  const [engine, setEngine] = useState<'naver' | 'osm'>(MAP_KEY_ID ? 'naver' : 'osm')
  const [allKey, setAllKey] = useState(0) // "후보지 한눈에"를 누를 때마다 1씩
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const closeCtx = useCallback(() => setCtx(null), [])
  const p = { ...props, allKey, onContext: props.onMapPick ? setCtx : () => {} }
  return (
    <>
      {engine === 'naver' ? <NaverMap {...p} onFail={() => setEngine('osm')} /> : <OsmMap {...p} />}
      {ctx && props.onMapPick && <MapMenu ctx={ctx} onPick={props.onMapPick} onClose={closeCtx} />}
      <div className="map-top">
        {props.hubs.length > 0 && (
          <div className="hub-switch" role="tablist" aria-label="장단점을 볼 목적지">
            <span>장단점 기준</span>
            {props.hubs.map((h) => (
              <button key={h.id} role="tab" aria-selected={h.id === props.hubId} className={h.id === props.hubId ? 'on' : ''} onClick={() => props.onHub(h.id)}>
                <i aria-hidden>{hubEmoji(h.category)}</i>{h.category}
              </button>
            ))}
          </div>
        )}
        {props.layers && props.onLayer && (
          <div className="layer-switch" role="group" aria-label="지도에 보일 지표">
            <button type="button" aria-pressed={props.layers.com} className={props.layers.com ? 'on' : ''} onClick={() => props.onLayer!('com')}>🏪 상권</button>
            <button type="button" aria-pressed={props.layers.walk} className={props.layers.walk ? 'on' : ''} onClick={() => props.onLayer!('walk')}>🌳 산책</button>
          </div>
        )}
        {props.candidates.length > 1 && <button type="button" className="fit-all" onClick={() => setAllKey((k) => k + 1)}>후보지 한눈에</button>}
      </div>
      {props.transit && props.transit.legs.length > 0 && (
        <p className="layer-note route-note" role="status" title={props.transit.legs.some((l) => l.mode !== 'walk' && l.approx) ? '일부 선은 근사선이에요(서울 버스 = 도로 길찾기, 지하철 = 역 사이 직선)' : '경기 버스 실제 노선'}>
          🚌 {props.transit.label}까지 대중교통 <b>{props.transit.min}분</b> · {transitSummary(props.transit.legs)}
        </p>
      )}
    </>
  )
}

/** 우클릭 메뉴: 주소를 (되면) 찾아 보여 주고, 후보지로 / 목적지로 */
function MapMenu({ ctx, onPick, onClose }: { ctx: Ctx; onPick: NonNullable<Props['onMapPick']>; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [addr, setAddr] = useState<RevAddr | null | undefined>(undefined) // undefined = 찾는 중
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  useEffect(() => {
    let alive = true
    setAddr(undefined)
    reverseGeocode(ctx.lat, ctx.lng).then((a) => alive && setAddr(a))
    return () => { alive = false }
  }, [ctx.lat, ctx.lng])
  useEffect(() => {
    const down = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('pointerdown', down, true); window.addEventListener('keydown', key)
    return () => { window.removeEventListener('pointerdown', down, true); window.removeEventListener('keydown', key) }
  }, [onClose])
  // 자리: 누른 곳의 오른쪽 아래 → 넘치면 오른쪽 위 → 왼쪽 위 → 왼쪽 아래(placeNear)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setPos(placeNear(ctx, el.offsetWidth, el.offsetHeight))
  }, [ctx, addr])
  const coord = `${ctx.lat.toFixed(5)}, ${ctx.lng.toFixed(5)}`
  // 주소는 등록 창이 다시 받아 채운다(같은 좌표는 한 번만 물음) — 여기서는 좌표와 누른 점만 넘긴다(등록 창도 누른 점 옆에)
  const pick = (kind: 'candidate' | 'hub') => { onPick({ name: '', address: '', lat: ctx.lat, lng: ctx.lng, category: '지도' }, kind, { x: ctx.x, y: ctx.y, w: ctx.w, h: ctx.h }); onClose() }
  return (
    <div ref={ref} className="map-ctx" role="menu" aria-label="이 위치 추가" onContextMenu={(e) => e.preventDefault()}
      style={pos ?? { left: ctx.x, top: ctx.y, visibility: 'hidden' }}>
      <small>{addr === undefined ? '주소 찾는 중…' : addr ? (addr.building ? `${addr.building} · ${addr.address}` : addr.address) : coord}</small>
      <button type="button" role="menuitem" autoFocus onClick={() => pick('candidate')}>📍 후보지로 추가</button>
      <button type="button" role="menuitem" onClick={() => pick('hub')}>🎯 목적지로 추가</button>
    </div>
  )
}

// ── 네이버 지도 ──────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function NaverMap({ candidates, hubs, active, onSelect, focusKey, hubId, onHub, insights, focusHubIds, ranks, preview, previewFly, results, centerRef, majors, parks, parkAreas, spots, allKey, onContext, onFail, onSpot, libraries, zones, catPins, onCatOpen, overlayFit, transit }: Inner & { onFail: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const layers = useRef<any[]>([])
  const [ready, setReady] = useState(false)
  const [zoom, setZoom] = useState(12)
  const detail = zoom >= DETAIL_ZOOM

  // 언제나 부드럽게 맞춘다(panToBounds = 이동·확대를 한 번에 애니메이션). 이미 알맞게 보이면 가운데로 살짝 옮기기만 한다.
  const fitToken = useRef(0) // 가장 최근 맞춤(늦게 온 확인은 버린다)
  const fit = (_force = false, all = false) => {
    const n = window.naver
    const pts = all ? allCands(candidates) : frame(candidates, hubs, active, focusHubIds)
    if (!n?.maps || !map.current || !pts.length) return
    const b = new n.maps.LatLngBounds(new n.maps.LatLng(pts[0][0], pts[0][1]), new n.maps.LatLng(pts[0][0], pts[0][1]))
    pts.forEach(([la, ln]) => b.extend(new n.maps.LatLng(la, ln)))
    const pad = all ? PAD_ALL : PAD
    // 후보지 + 주 목적지가 화면 가운데에 균형 있게: 네 변 여백을 위아래·좌우 같게(검색창 몫만큼 위아래 모두 넉넉히)
    const margin = all ? { top: pad, right: pad, bottom: pad, left: pad } : { top: pad + 40, right: pad + 20, bottom: pad + 40, left: pad + 20 }
    // 목표 가운데 = 점들을 감싸는 네모의 가운데, 목표 확대 = 여백을 뺀 지도 크기에 네모가 들어가는 가장 큰 정수 단계(웹 메르카토르).
    // 확대 단계가 같으면 panTo, 다르면 morph 로 부드럽게. (fitBounds 로 잰 뒤 되돌리는 방식은 연달아 고르면 애니메이션이 취소됐다)
    const m = map.current, size = m.getSize()
    const la = pts.map((p) => p[0]), ln = pts.map((p) => p[1])
    const yOf = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
    const s0 = Math.min(...la), n0 = Math.max(...la), w0 = Math.min(...ln), e0 = Math.max(...ln)
    const cy = (yOf(s0) + yOf(n0)) / 2, center = new n.maps.LatLng((2 * Math.atan(Math.exp(cy)) - Math.PI / 2) * 180 / Math.PI, (w0 + e0) / 2)
    const W = Math.max(50, size.width - margin.left - margin.right), H = Math.max(50, size.height - margin.top - margin.bottom)
    const zx = Math.log2((W * 360) / (256 * Math.max(1e-6, e0 - w0))), zy = Math.log2((H * 2 * Math.PI) / (256 * Math.max(1e-6, yOf(n0) - yOf(s0))))
    const z1 = Math.max(6, Math.min(all ? 17 : 16, Math.floor(Math.min(zx, zy))))
    if (m.getZoom() === z1) m.panTo(center, { duration: 700, easing: 'easeInOutCubic' })
    else m.morph(center, z1, { duration: 800, easing: 'easeInOutCubic' })
    // 애니메이션이 중간에 끊기면(다른 이동·탭 숨김으로 프레임이 멈춤 등) 끝날 시간 뒤 목표 자리로 바로 맞춘다
    const token = ++fitToken.current
    window.setTimeout(() => {
      if (token !== fitToken.current || !map.current) return
      const c = map.current.getCenter()
      if (map.current.getZoom() !== z1 || Math.abs(c.lat() - center.lat()) > 1e-5 || Math.abs(c.lng() - center.lng()) > 1e-5) map.current.morph(center, z1, { duration: 0 })
    }, 1000)
  }

  useEffect(() => onNaverAuthFailure(onFail), []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    let alive = true
    loadNaverMaps().then((naver) => {
      if (!alive || !box.current) return
      map.current = new naver.maps.Map(box.current, {
        center: new naver.maps.LatLng(37.27, 127.07), zoom: 12,
        scaleControl: false, mapDataControl: false, zoomControl: false,
      })
      naver.maps.Event.addListener(map.current, 'zoom_changed', (z: number) => setZoom(z))
      const keepCenter = () => { const c = map.current?.getCenter(); if (c && centerRef) centerRef.current = { lat: c.lat(), lng: c.lng() } }
      naver.maps.Event.addListener(map.current, 'idle', keepCenter)
      keepCenter()
      // 우클릭 → 그 자리 추가 메뉴. 지도를 누르거나 움직이면 닫는다.
      naver.maps.Event.addListener(map.current, 'rightclick', (e: any) => {
        const s = map.current.getSize()
        onContext({ x: e.offset.x, y: e.offset.y, w: s.width, h: s.height, lat: e.coord.lat(), lng: e.coord.lng() })
      })
      for (const ev of ['click', 'dragstart', 'zoom_changed']) naver.maps.Event.addListener(map.current, ev, () => onContext(null))
      setReady(true)
    }).catch(() => alive && onFail())
    return () => { alive = false; try { map.current?.destroy?.() } catch { /* 인증 실패 뒤의 정리 오류는 무시(OSM 으로 바꿀 때) */ } map.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 검색 결과 미리 보기: 그 위치로 옮기고 임시 핀
  const previewMarker = useRef<any>(null)
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    previewMarker.current?.setMap(null)
    previewMarker.current = null
    if (!preview) return
    const at = new naver.maps.LatLng(preview.lat, preview.lng)
    previewMarker.current = new naver.maps.Marker({ map: map.current, position: at, zIndex: 200, icon: { content: previewHtml(preview.name), anchor: new naver.maps.Point(8, 8) } })
    if (previewFly !== false) map.current.morph(at, Math.max(PREVIEW_ZOOM, map.current.getZoom()), { duration: 600, easing: 'easeOutCubic' })
  }, [ready, preview]) // eslint-disable-line react-hooks/exhaustive-deps

  // 검색 결과 전부: 작은 점(누른 결과는 위의 빨간 점이 대신한다)
  const resultMarkers = useRef<any[]>([])
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    resultMarkers.current.forEach((m) => m.setMap(null))
    resultMarkers.current = (results ?? []).filter((r) => !same(r, preview)).map((r) => new naver.maps.Marker({
      map: map.current, position: new naver.maps.LatLng(r.lat, r.lng), title: r.name, zIndex: 150, clickable: false,
      icon: { content: RESULT_DOT, anchor: new naver.maps.Point(6, 6) },
    }))
  }, [ready, results, preview])

  // 주요 매장
  const majorMarkers = useRef<any[]>([])
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    majorMarkers.current.forEach((m) => m.setMap(null))
    majorMarkers.current = (majors ?? []).map((m) => new naver.maps.Marker({
      map: map.current, position: new naver.maps.LatLng(m.lat, m.lng), zIndex: 5,
      icon: { content: majorHtml(m, detail), anchor: new naver.maps.Point(10, 10) },
    }))
  }, [ready, majors, detail])

  // 추천 카페·식당
  const spotMarkers = useRef<any[]>([])
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    spotMarkers.current.forEach((m) => m.setMap(null))
    spotMarkers.current = (spots ?? []).map((s) => {
      const m = new naver.maps.Marker({
        map: map.current, position: new naver.maps.LatLng(s.lat, s.lng), zIndex: 6, cursor: 'pointer',
        icon: { content: spotHtml(s, detail), anchor: new naver.maps.Point(10, 10) },
      })
      naver.maps.Event.addListener(m, 'click', () => onSpot?.(s.id))
      return m
    })
  }, [ready, spots, detail])

  // 산책: 점수 높은 공원 경계 색칠(점수가 높을수록 진하게)
  const areaShapes = useRef<any[]>([])
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    areaShapes.current.forEach((m) => m.setMap(null))
    areaShapes.current = (parkAreas ?? []).map((a) => new naver.maps.Polygon({
      map: map.current, paths: a.rings.map((r) => r.map(([la, ln]) => new naver.maps.LatLng(la, ln))), clickable: false, zIndex: 1,
      fillColor: '#3f9a52', fillOpacity: parkAreaAlpha(a.value), strokeOpacity: 0, strokeWeight: 0, // 테두리 없이 칠만
    }))
  }, [ready, parkAreas])

  // 도서관(펼쳤을 때)
  const libMarkers = useRef<any[]>([])
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    libMarkers.current.forEach((m) => m.setMap(null))
    libMarkers.current = (libraries ?? []).map((l) => new naver.maps.Marker({
      map: map.current, position: new naver.maps.LatLng(l.lat, l.lng), zIndex: 60,
      icon: { content: libHtml(l), anchor: new naver.maps.Point(10, 10) },
    }))
  }, [ready, libraries])

  // 평화로움 소음 구분도(펼쳤을 때)
  const zoneShapes = useRef<any[]>([])
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    zoneShapes.current.forEach((m) => m.setMap(null))
    zoneShapes.current = []
    if (!zones) return
    zoneShapes.current = zoneRects(zones).map((r) => new naver.maps.Rectangle({
      map: map.current, bounds: new naver.maps.LatLngBounds(new naver.maps.LatLng(r.s, r.w), new naver.maps.LatLng(r.n, r.e)), clickable: false, zIndex: 2,
      fillColor: ZONE_STYLE[r.k].color, fillOpacity: ZONE_STYLE[r.k].alpha, strokeOpacity: 0, strokeWeight: 0,
    }))
    zoneShapes.current.push(new naver.maps.Circle({ map: map.current, center: new naver.maps.LatLng(zones.lat, zones.lng), radius: zones.radiusM, clickable: false, zIndex: 3, fillOpacity: 0, strokeColor: '#1c2733', strokeOpacity: 0.55, strokeWeight: 1.5, strokeStyle: 'shortdash' }))
    // 계산 반경(30m) — 음식점·상업시설·도로를 이 안에서 센다
    zoneShapes.current.push(new naver.maps.Circle({ map: map.current, center: new naver.maps.LatLng(zones.lat, zones.lng), radius: zones.calcM, clickable: false, zIndex: 3, fillOpacity: 0, strokeColor: '#1c2733', strokeOpacity: 0.85, strokeWeight: 2 }))
  }, [ready, zones])

  // 길고양이 사진 말풍선(펼쳤을 때) — 확대 단계가 바뀌면 네모 자리를 다시 고른다
  const catMarkers = useRef<any[]>([])
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    catMarkers.current.forEach((m) => m.setMap(null))
    catMarkers.current = catCallouts(catPins ?? [], zoom).map((c) => {
      const m = new naver.maps.Marker({ map: map.current, position: new naver.maps.LatLng(c.lat, c.lng), zIndex: 300, cursor: 'pointer', icon: { content: catCalloutHtml(c), anchor: new naver.maps.Point(0, 0) } })
      naver.maps.Event.addListener(m, 'click', () => onCatOpen?.(c.start))
      return m
    })
  }, [ready, catPins, zoom]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => (box.current ? startCatSlides(box.current) : undefined), [ready])

  // 산책(공원·하천)
  const parkMarkers = useRef<any[]>([])
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    parkMarkers.current.forEach((m) => m.setMap(null))
    parkMarkers.current = (parks ?? []).map((p) => new naver.maps.Marker({
      map: map.current, position: new naver.maps.LatLng(p.lat, p.lng), zIndex: 4,
      icon: { content: parkHtml(p, true), anchor: new naver.maps.Point(10, 10) },
    }))
  }, [ready, parks])

  // 핀·점선·장단점 글자 다시 그리기
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    layers.current.forEach((l) => l.setMap(null))
    layers.current = []
    const cur = candidates[active]
    const hub = hubs.find((h) => h.id === hubId)
    const routed = transit?.legs.length ? transit.hubId : null // 대중교통 경로를 그리는 목적지는 점선 직선을 뺀다
    if (cur) hubs.filter((h) => h.id !== routed).forEach((h) => layers.current.push(new naver.maps.Polyline({
      map: map.current, path: [new naver.maps.LatLng(cur.lat, cur.lng), new naver.maps.LatLng(h.lat, h.lng)],
      strokeColor: '#2b2b26', strokeOpacity: h.id === hubId ? 0.9 : 0.35, strokeWeight: 2, strokeStyle: 'shortdash',
    })))
    hubs.forEach((h) => {
      const m = new naver.maps.Marker({
        map: map.current, position: new naver.maps.LatLng(h.lat, h.lng), title: h.name,
        icon: { content: `<div class="nv-pin">${hubHtml(h, h.id === hubId)}<span class="map-label">${esc(h.category)} · ${esc(h.name)}</span></div>`, anchor: new naver.maps.Point(15, 15) },
      })
      naver.maps.Event.addListener(m, 'click', () => onHub(h.id))
      layers.current.push(m)
    })
    candidates.forEach((c, i) => {
      const on = i === active
      const label = on || detail ? `<span class="map-label ins-label${on ? ' on' : ''}">${labelHtml(c.name, insights[i], hub)}</span>` : ''
      const m = new naver.maps.Marker({
        map: map.current, position: new naver.maps.LatLng(c.lat, c.lng), title: c.name, zIndex: on ? 100 : 10,
        icon: { content: `<div class="nv-pin">${candHtml(ranks[i] ?? i + 1, on)}${label}</div>`, anchor: new naver.maps.Point(17, 17) },
      })
      naver.maps.Event.addListener(m, 'click', () => onSelect(i))
      layers.current.push(m)
    })
  }, [ready, candidates, hubs, active, onSelect, onHub, hubId, insights, detail, ranks, transit])

  // 대중교통 경로: 도보 점선 · 노선 색 선(흰 테두리) · 정류장 점과 이름표
  const routeShapes = useRef<any[]>([])
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    routeShapes.current.forEach((m) => m.setMap(null))
    routeShapes.current = []
    if (!transit?.legs.length) return
    const path = (line: [number, number][]) => line.map(([la, ln]) => new naver.maps.LatLng(la, ln))
    for (const l of transit.legs) {
      if (l.mode === 'walk') {
        routeShapes.current.push(new naver.maps.Polyline({ map: map.current, path: path(l.line), clickable: false, zIndex: 20, strokeColor: WALK_STYLE.color, strokeOpacity: 0.95, strokeWeight: WALK_STYLE.weight, strokeStyle: 'shortdot', strokeLineCap: 'round' }))
      } else {
        routeShapes.current.push(new naver.maps.Polyline({ map: map.current, path: path(l.line), clickable: false, zIndex: 21, strokeColor: '#fff', strokeOpacity: 0.95, strokeWeight: 9, strokeLineCap: 'round', strokeLineJoin: 'round' }))
        routeShapes.current.push(new naver.maps.Polyline({ map: map.current, path: path(l.line), clickable: false, zIndex: 22, strokeColor: l.color, strokeOpacity: 1, strokeWeight: 5, strokeLineCap: 'round', strokeLineJoin: 'round' }))
      }
    }
    for (const s of transitStops(transit.legs)) routeShapes.current.push(new naver.maps.Marker({ map: map.current, position: new naver.maps.LatLng(s.lat, s.lng), zIndex: 90, clickable: false, icon: { content: stopHtml(s), anchor: new naver.maps.Point(7, 7) } }))
  }, [ready, transit])

  useEffect(() => { if (ready) fit() }, [ready, active, focusKey, focusHubIds.join()]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready && allKey) fit(true, true) }, [allKey]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const n = window.naver
    if (!ready || !n || !overlayFit?.pts.length) return
    const p0 = overlayFit.pts[0]
    const b = new n.maps.LatLngBounds(new n.maps.LatLng(p0[0], p0[1]), new n.maps.LatLng(p0[0], p0[1]))
    overlayFit.pts.forEach(([la, ln]) => b.extend(new n.maps.LatLng(la, ln)))
    try { map.current.panToBounds(b, { duration: 650, easing: 'easeOutCubic' }, { top: PAD + 40, right: PAD, bottom: PAD, left: PAD }) } catch { map.current.fitBounds(b) }
  }, [ready, overlayFit?.key]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoomBy = (d: number) => map.current?.setZoom(map.current.getZoom() + d, true)
  return (
    <div className="map naver-map" onContextMenu={(e) => e.preventDefault()}>
      <div ref={box} className="naver-box" />
      <div className="map-controls">
        <button aria-label="확대" onClick={() => zoomBy(1)}>+</button>
        <button aria-label="고른 후보지와 목적지 보기" onClick={() => fit(true)}>◎</button>
        <button aria-label="축소" onClick={() => zoomBy(-1)}>−</button>
      </div>
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── OSM(네이버 키가 없을 때) ─────────────────────────────────────────
const fitOptions = { paddingTopLeft: [PAD, PAD + 40] as [number, number], paddingBottomRight: [PAD, PAD] as [number, number] }

// 맞춤 이동: 목표(가운데·확대)를 계산해, 확대 단계 차이가 작으면 flyTo(짧게 0.6초 — 축소했다 확대하는 흔들림이 거의 없음),
// 같은 단계면 panTo 로 옮기기만, 차이가 크면(3단계 넘게) 한 번에 setView 애니메이션. 이미 다 보여도 가운데로 옮긴다
// (예전엔 그대로 둬서 "후보지를 눌러도 안 움직인다"로 보였다).
function fitSmart(map: L.Map, pts: [number, number][], _force = false, all = false) {
  if (!pts.length) return
  const pad = all ? PAD_ALL : PAD
  const b = L.latLngBounds(pts)
  // 균형: 위아래·좌우 여백을 같게 두어 후보지와 주 목적지의 가운데가 지도 가운데(검색창 몫만큼 위아래 모두 넉넉히)
  const target = Math.min(all ? 17 : 16, map.getBoundsZoom(b, false, all ? L.point(pad * 2, pad * 2) : L.point(pad * 2 + 40, pad * 2 + 80)))
  const c = b.getCenter()
  const z = map.getZoom()
  // 지도 칸 크기가 0(숨긴 창·배치 전)이면 확대 값이 NaN — 그때는 가운데만 옮긴다. 사용자를 바꿔 먼 곳(수원 → 신촌)으로 가면 날아가지 않고 바로
  if (!Number.isFinite(target)) { map.setView(c, Number.isFinite(z) ? z : 14, { animate: false }); return }
  if (!map.getBounds().pad(1).contains(c)) { map.setView(c, target, { animate: false }); return }
  if (Math.abs(z - target) < 0.01) map.panTo(c, { animate: true, duration: 0.6, easeLinearity: 0.25 })
  else if (Math.abs(z - target) <= 3) map.flyTo(c, target, { duration: 0.8, easeLinearity: 0.25 })
  else map.setView(c, target, { animate: true })
}

function Framing({ pts, focusKey, active, all, allKey }: { pts: [number, number][]; focusKey: number; active: number; all: [number, number][]; allKey: number }) {
  const map = useMap()
  useEffect(() => { fitSmart(map, pts) }, [map, active, focusKey, pts.join()]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (allKey) fitSmart(map, all, true, true) }, [allKey]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function ZoomWatch({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) })
  useEffect(() => { onZoom(map.getZoom()) }, [map]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function Controls({ pts }: { pts: [number, number][] }) {
  const map = useMap()
  return (
    <div className="map-controls" ref={(el) => { if (el) { L.DomEvent.disableClickPropagation(el); L.DomEvent.disableScrollPropagation(el) } }}>
      <button aria-label="확대" onClick={() => map.zoomIn()}>+</button>
      <button aria-label="고른 후보지와 목적지 보기" onClick={() => fitSmart(map, pts, true)}>◎</button>
      <button aria-label="축소" onClick={() => map.zoomOut()}>−</button>
    </div>
  )
}

function OsmMap({ candidates, hubs, active, onSelect, focusKey, hubId, onHub, insights, focusHubIds, ranks, preview, previewFly, results, centerRef, majors, parks, parkAreas, spots, allKey, onContext, onSpot, libraries, zones, catPins, onCatOpen, overlayFit, transit }: Inner) {
  const pts = useMemo(() => frame(candidates, hubs, active, focusHubIds), [candidates, hubs, active, focusHubIds])
  const [zoom, setZoom] = useState(13)
  const cur = candidates[active]
  const hub = hubs.find((h) => h.id === hubId)
  const start = pts[0] ?? [37.27, 127.07]
  const detail = zoom >= DETAIL_ZOOM
  return (
    <MapContainer className="map" center={start} zoom={13} zoomSnap={0.25} zoomControl={false} attributionControl>
      <TileLayer className="tiles-base" url="https://tiles.osm.kr/hot/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" maxZoom={19} />
      <Framing pts={pts} focusKey={focusKey} active={active} all={allCands(candidates)} allKey={allKey} />
      <ZoomWatch onZoom={setZoom} />
      <ContextWatch onContext={onContext} />
      {(parkAreas ?? []).map((a, i) => (
        <Polygon key={`pa${i}-${a.name}`} positions={a.rings}
          pathOptions={{ stroke: false, fillColor: '#3f9a52', fillOpacity: parkAreaAlpha(a.value) }}>
          <Tooltip sticky>{parkAreaTitle(a)}</Tooltip>
        </Polygon>
      ))}
      {(majors ?? []).map((m) => (
        <Marker key={`m-${m.brand}-${m.lat}-${m.lng}-${detail}`} position={[m.lat, m.lng]} zIndexOffset={-500}
          icon={L.divIcon({ className: 'pin-shell', html: majorHtml(m, detail), iconSize: [20, 20], iconAnchor: [10, 10] })} />
      ))}
      {(spots ?? []).map((s) => (
        <Marker key={`s-${s.id}-${detail}`} position={[s.lat, s.lng]} zIndexOffset={-400} eventHandlers={{ click: () => onSpot?.(s.id) }}
          icon={L.divIcon({ className: 'pin-shell', html: spotHtml(s, detail), iconSize: [20, 20], iconAnchor: [10, 10] })} />
      ))}
      {zones && zoneRects(zones).map((r, i) => (
        <Rectangle key={`z${i}-${zones.lat}`} bounds={[[r.s, r.w], [r.n, r.e]]} interactive={false} pathOptions={{ stroke: false, fillColor: ZONE_STYLE[r.k].color, fillOpacity: ZONE_STYLE[r.k].alpha }} />
      ))}
      {zones && <Circle center={[zones.lat, zones.lng]} radius={zones.radiusM} interactive={false} pathOptions={{ color: '#1c2733', weight: 1.5, opacity: 0.55, dashArray: '5 5', fill: false }} />}
      {zones && <Circle center={[zones.lat, zones.lng]} radius={zones.calcM} interactive={false} pathOptions={{ color: '#1c2733', weight: 2, opacity: 0.85, fill: false }} />}
      {(libraries ?? []).map((l) => (
        <Marker key={`lib-${l.name}`} position={[l.lat, l.lng]} zIndexOffset={600}
          icon={L.divIcon({ className: 'pin-shell', html: libHtml(l), iconSize: [20, 20], iconAnchor: [10, 10] })} />
      ))}
      <CatLayer pins={catPins} zoom={zoom} onOpen={onCatOpen} />
      <OverlayFit fit={overlayFit} />
      {(parks ?? []).map((p) => (
        <Marker key={`p-${p.id}`} position={[p.lat, p.lng]} zIndexOffset={-500}
          icon={L.divIcon({ className: 'pin-shell', html: parkHtml(p, true), iconSize: [20, 20], iconAnchor: [10, 10] })} />
      ))}
      {transit?.legs.map((l, i) => l.mode === 'walk'
        ? <Polyline key={`tw${i}-${l.line[0].join()}`} positions={l.line} interactive={false} pathOptions={{ color: WALK_STYLE.color, weight: WALK_STYLE.weight, opacity: 0.95, dashArray: '0.1 9', lineCap: 'round' }} />
        : [
          <Polyline key={`tc${i}-${l.line[0].join()}`} positions={l.line} interactive={false} pathOptions={{ color: '#fff', weight: 9, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }} />,
          <Polyline key={`tr${i}-${l.line[0].join()}`} positions={l.line} interactive={false} pathOptions={{ color: l.color, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />,
        ])}
      {transit && transitStops(transit.legs).map((s, i) => (
        <Marker key={`ts${i}-${s.lat}-${s.lng}`} position={[s.lat, s.lng]} zIndexOffset={800} interactive={false}
          icon={L.divIcon({ className: 'pin-shell', html: stopHtml(s), iconSize: [14, 14], iconAnchor: [7, 7] })} />
      ))}
      {cur && hubs.filter((h) => !(transit?.legs.length && transit.hubId === h.id)).map((h) => (
        <Polyline key={h.id + cur.id + (h.id === hubId)} className="route" positions={[[cur.lat, cur.lng], [h.lat, h.lng]]} pathOptions={{ color: '#2b2b26', weight: 2, dashArray: '6 7', opacity: h.id === hubId ? 0.9 : 0.35 }} />
      ))}
      {hubs.map((h) => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={L.divIcon({ className: 'pin-shell', html: hubHtml(h, h.id === hubId), iconSize: [30, 30], iconAnchor: [15, 15] })}
          eventHandlers={{ click: () => onHub(h.id) }}>
          <Tooltip permanent direction="right" offset={[14, 0]} className="map-label">{h.category} · {h.name}</Tooltip>
        </Marker>
      ))}
      {candidates.map((c, i) => {
        const on = i === active
        return (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={L.divIcon({ className: 'pin-shell', html: candHtml(ranks[i] ?? i + 1, on), iconSize: [34, 34], iconAnchor: [17, 17] })}
            zIndexOffset={on ? 1000 : 0} eventHandlers={{ click: () => onSelect(i) }}>
            {(on || detail) && (
              <Tooltip key={`${hubId}-${detail}-${on}`} permanent direction="right" offset={[16, 0]} className={'map-label ins-label' + (on ? ' on' : '')}>
                <span className="ins" dangerouslySetInnerHTML={{ __html: labelHtml(c.name, insights[i], hub) }} />
              </Tooltip>
            )}
          </Marker>
        )
      })}
      {preview && (
        <Marker position={[preview.lat, preview.lng]} zIndexOffset={2000} icon={L.divIcon({ className: 'pin-shell', html: '<span class="pin preview"></span>', iconSize: [16, 16], iconAnchor: [8, 8] })}>
          <Tooltip permanent direction="right" offset={[8, 0]} className="map-label preview-label">{preview.name}</Tooltip>
        </Marker>
      )}
      {(results ?? []).filter((r) => !same(r, preview)).map((r, i) => (
        <Marker key={`r${i}-${r.lat}-${r.lng}`} position={[r.lat, r.lng]} zIndexOffset={1500} interactive={false} title={r.name}
          icon={L.divIcon({ className: 'pin-shell', html: RESULT_DOT, iconSize: [12, 12], iconAnchor: [6, 6] })} />
      ))}
      <PreviewFly preview={previewFly === false ? null : preview ?? null} />
      {centerRef && <CenterWatch centerRef={centerRef} />}
      <Controls pts={pts} />
    </MapContainer>
  )
}

/** OSM: 입지 요인을 펼치면 그 범위로 */
function OverlayFit({ fit }: { fit?: Props['overlayFit'] }) {
  const map = useMap()
  useEffect(() => { if (fit?.pts.length) fitSmart(map, fit.pts) }, [fit?.key]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

/** OSM: 길고양이 사진 말풍선(확대 단계가 바뀌면 자리를 다시 고름) + 슬라이드 */
function CatLayer({ pins, zoom, onOpen }: { pins?: CatPin[]; zoom: number; onOpen?: (start: number) => void }) {
  const map = useMap()
  useEffect(() => startCatSlides(map.getContainer()), [map])
  const list = useMemo(() => catCallouts(pins ?? [], Math.round(zoom)), [pins, zoom])
  return <>{list.map((c, i) => (
    <Marker key={`cat${i}-${c.lat}-${c.dx}-${c.dy}`} position={[c.lat, c.lng]} zIndexOffset={2500} eventHandlers={{ click: () => onOpen?.(c.start) }}
      icon={L.divIcon({ className: 'pin-shell', html: catCalloutHtml(c), iconSize: [0, 0], iconAnchor: [0, 0] })} />
  ))}</>
}

/** OSM: 검색 결과를 누르면 그 위치로 */
function PreviewFly({ preview }: { preview: Place | null }) {
  const map = useMap()
  useEffect(() => { if (preview) map.flyTo([preview.lat, preview.lng], Math.max(PREVIEW_ZOOM, map.getZoom()), { duration: 0.6, easeLinearity: 0.3 }) }, [map, preview])
  return null
}

/** OSM: 우클릭(휴대폰은 길게 누르기) → 추가 메뉴, 지도를 누르거나 움직이면 닫기 */
function ContextWatch({ onContext }: { onContext: Inner['onContext'] }) {
  const map = useMapEvents({
    contextmenu: (e) => { const s = map.getSize(); onContext({ x: e.containerPoint.x, y: e.containerPoint.y, w: s.x, h: s.y, lat: e.latlng.lat, lng: e.latlng.lng }) },
    click: () => onContext(null), movestart: () => onContext(null), zoomstart: () => onContext(null),
  })
  return null
}

/** OSM: 지도 가운데를 기억(검색 결과를 가까운 순으로) */
function CenterWatch({ centerRef }: { centerRef: NonNullable<Props['centerRef']> }) {
  const keep = () => { const c = map.getCenter(); centerRef.current = { lat: c.lat, lng: c.lng } }
  const map = useMapEvents({ moveend: keep })
  useEffect(keep, [map]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
