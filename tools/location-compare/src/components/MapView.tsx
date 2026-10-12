import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { hubEmoji, type Candidate, type Hub } from '../data'
import type { Insight } from '../scoring'
import { loadNaverMaps, MAP_KEY_ID, onNaverAuthFailure } from '../naver'

// 지도: 네이버 지도 키(VITE_NAVER_MAP_KEY_ID)가 있으면 네이버 지도, 없거나 인증이 실패하면 OSM 밝은 지도.
// - 후보지를 고르면 "그 후보지 + 주요 목적지"가 다 들어오도록 확대·이동한다.
// - 지도 위 "장단점 기준" 단추(또는 목적지 핀)로 고른 목적지에 대해, 후보지 옆에 장점(＋)·단점(－)을 글자로 보여 준다.
//   평소에는 고른 후보지에만, 구역이 확실히 갈릴 만큼 확대하면(DETAIL_ZOOM 이상) 화면에 보이는 모든 후보지에.

type Props = {
  candidates: Candidate[]; hubs: Hub[]; active: number; onSelect: (index: number) => void; focusKey: number
  hubId: string | null; onHub: (id: string) => void; insights: Insight[]
  focusHubIds: string[] // 후보지를 고를 때 함께 화면에 넣을 주 목적지(월 왕복 50% 이상)
  ranks: number[] // 후보지 핀 숫자 = 종합 순위
}

export const DETAIL_ZOOM = 14 // 이 확대 단계부터 모든 후보지에 장단점(동네 단위가 구분되는 정도)
const PAD = 70
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const candHtml = (n: number, on: boolean) => `<span class="pin cand${on ? ' on' : ''}">${n}</span>`
const hubHtml = (h: Hub, on: boolean) => `<span class="pin hub${on ? ' on' : ''}"><b>${hubEmoji(h.category)}</b></span>`

/** 후보지 옆 글자: 이름 + (목적지 기준) 장점·단점 */
function labelHtml(name: string, ins: Insight | undefined, hub: Hub | undefined) {
  const pros = ins?.pros.length ? `<span class="pro">＋ ${ins.pros.map(esc).join(' · ')}</span>` : ''
  const cons = ins?.cons.length ? `<span class="con">－ ${ins.cons.map(esc).join(' · ')}</span>` : ''
  const rank = ins?.rank ? ` ${ins.rank}위/${ins.of}` : ''
  const head = hub ? `<small>${esc(hub.category)} 기준${rank}${pros || cons ? '' : ' · 뚜렷한 장단점 없음'}</small>` : ''
  return `<b>${esc(name)}</b>${head}${pros}${cons}`
}

/** 고른 후보지 + 주 목적지(없으면 모든 목적지)를 감싸는 점들 */
function frame(candidates: Candidate[], hubs: Hub[], active: number, focusHubIds: string[]): [number, number][] {
  const cur = candidates[active]
  const main = hubs.filter((h) => focusHubIds.includes(h.id))
  const targets = main.length ? main : hubs
  const pts = cur ? [cur, ...targets] : [...candidates, ...targets]
  return pts.map((p) => [p.lat, p.lng])
}

export function MapView(props: Props) {
  const [engine, setEngine] = useState<'naver' | 'osm'>(MAP_KEY_ID ? 'naver' : 'osm')
  return (
    <>
      {engine === 'naver' ? <NaverMap {...props} onFail={() => setEngine('osm')} /> : <OsmMap {...props} />}
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
    </>
  )
}

// ── 네이버 지도 ──────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function NaverMap({ candidates, hubs, active, onSelect, focusKey, hubId, onHub, insights, focusHubIds, ranks, onFail }: Props & { onFail: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const layers = useRef<any[]>([])
  const [ready, setReady] = useState(false)
  const [zoom, setZoom] = useState(12)
  const detail = zoom >= DETAIL_ZOOM

  // force=false 면, 이미 그 구간이 알맞게 보이고 있을 때는 움직이지 않는다(같은 자리로 다시 맞추며 흔들리는 것 방지)
  const fit = (force = false) => {
    const n = window.naver
    const pts = frame(candidates, hubs, active, focusHubIds)
    if (!n || !map.current || !pts.length) return
    const b = new n.maps.LatLngBounds(new n.maps.LatLng(pts[0][0], pts[0][1]), new n.maps.LatLng(pts[0][0], pts[0][1]))
    pts.forEach(([la, ln]) => b.extend(new n.maps.LatLng(la, ln)))
    if (!force) {
      const view = map.current.getBounds()
      const inView = pts.every(([la, ln]) => view.hasLatLng(new n.maps.LatLng(la, ln)))
      const vs = view.getNE(), vw = view.getSW(), bs = b.getNE(), bw = b.getSW()
      const fill = Math.max((bs.lat() - bw.lat()) / (vs.lat() - vw.lat()), (bs.lng() - bw.lng()) / (vs.lng() - vw.lng()))
      if (inView && fill > 0.35) return // 이미 들어와 있고 너무 작지도 않다
    }
    map.current.fitBounds(b, { top: PAD + 40, right: PAD, bottom: PAD, left: PAD })
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
      setReady(true)
    }).catch(() => alive && onFail())
    return () => { alive = false; try { map.current?.destroy?.() } catch { /* 인증 실패 뒤의 정리 오류는 무시(OSM 으로 바꿀 때) */ } map.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 핀·점선·장단점 글자 다시 그리기
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    layers.current.forEach((l) => l.setMap(null))
    layers.current = []
    const cur = candidates[active]
    const hub = hubs.find((h) => h.id === hubId)
    if (cur) hubs.forEach((h) => layers.current.push(new naver.maps.Polyline({
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
  }, [ready, candidates, hubs, active, onSelect, onHub, hubId, insights, detail, ranks])

  useEffect(() => { if (ready) fit() }, [ready, active, focusKey, focusHubIds.join()]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoomBy = (d: number) => map.current?.setZoom(map.current.getZoom() + d, true)
  return (
    <div className="map naver-map">
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

// flyToBounds 는 가까운 곳도 한 번 축소했다 다시 확대해서 흔들려 보였다 → 목표 확대 단계가 같고 이미 다 보이면 그대로 두고,
// 아니면 fitBounds 로 부드럽게 맞춘다.
function fitSmart(map: L.Map, pts: [number, number][], force = false) {
  if (!pts.length) return
  const b = L.latLngBounds(pts)
  const target = Math.min(16, map.getBoundsZoom(b, false, L.point(PAD * 2, PAD * 2 + 40)))
  const z = map.getZoom()
  if (!force && z === target && map.getBounds().contains(b)) return
  map.fitBounds(b, { ...fitOptions, maxZoom: 16, animate: true }) // 확대 단계가 같으면 옮기기만 한다
}

function Framing({ pts, focusKey, active }: { pts: [number, number][]; focusKey: number; active: number }) {
  const map = useMap()
  useEffect(() => { fitSmart(map, pts) }, [map, active, focusKey, pts.join()]) // eslint-disable-line react-hooks/exhaustive-deps
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

function OsmMap({ candidates, hubs, active, onSelect, focusKey, hubId, onHub, insights, focusHubIds, ranks }: Props) {
  const pts = useMemo(() => frame(candidates, hubs, active, focusHubIds), [candidates, hubs, active, focusHubIds])
  const [zoom, setZoom] = useState(13)
  const cur = candidates[active]
  const hub = hubs.find((h) => h.id === hubId)
  const start = pts[0] ?? [37.27, 127.07]
  const detail = zoom >= DETAIL_ZOOM
  return (
    <MapContainer className="map" center={start} zoom={13} zoomControl={false} attributionControl>
      <TileLayer className="tiles-base" url="https://tiles.osm.kr/hot/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" maxZoom={19} />
      <Framing pts={pts} focusKey={focusKey} active={active} />
      <ZoomWatch onZoom={setZoom} />
      {cur && hubs.map((h) => (
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
      <Controls pts={pts} />
    </MapContainer>
  )
}
