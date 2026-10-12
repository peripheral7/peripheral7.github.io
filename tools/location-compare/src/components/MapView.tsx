import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Candidate, Hub } from '../data'
import { loadNaverMaps, MAP_KEY_ID, onNaverAuthFailure } from '../naver'

// 지도: 네이버 지도 키(VITE_NAVER_MAP_KEY_ID)가 있으면 네이버 지도, 없거나 인증이 실패하면 OSM 밝은 지도.
// 후보지를 고르면 "그 후보지 + 주요 목적지"가 다 들어오도록 확대·이동한다.

type Props = { candidates: Candidate[]; hubs: Hub[]; active: number; onSelect: (index: number) => void; focusKey: number }

const PAD = 70
const candHtml = (n: number, on: boolean) => `<span class="pin cand${on ? ' on' : ''}">${n}</span>`
const hubHtml = (n: number) => `<span class="pin hub"><b>${n}</b></span>`
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** 고른 후보지와 목적지(없으면 후보지 전체)를 감싸는 점들 */
function frame(candidates: Candidate[], hubs: Hub[], active: number): [number, number][] {
  const cur = candidates[active]
  const pts = cur ? [cur, ...hubs] : [...candidates, ...hubs]
  return pts.map((p) => [p.lat, p.lng])
}

export function MapView(props: Props) {
  const [engine, setEngine] = useState<'naver' | 'osm'>(MAP_KEY_ID ? 'naver' : 'osm')
  return engine === 'naver' ? <NaverMap {...props} onFail={() => setEngine('osm')} /> : <OsmMap {...props} />
}

// ── 네이버 지도 ──────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function NaverMap({ candidates, hubs, active, onSelect, focusKey, onFail }: Props & { onFail: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const layers = useRef<any[]>([])
  const [ready, setReady] = useState(false)

  const fit = () => {
    const n = window.naver
    const pts = frame(candidates, hubs, active)
    if (!n || !map.current || !pts.length) return
    const b = new n.maps.LatLngBounds(new n.maps.LatLng(pts[0][0], pts[0][1]), new n.maps.LatLng(pts[0][0], pts[0][1]))
    pts.forEach(([la, ln]) => b.extend(new n.maps.LatLng(la, ln)))
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
      setReady(true)
    }).catch(() => alive && onFail())
    return () => { alive = false; try { map.current?.destroy?.() } catch { /* 인증 실패 뒤의 정리 오류는 무시(OSM 으로 바꿀 때) */ } map.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 핀·점선 다시 그리기
  useEffect(() => {
    const naver = window.naver
    if (!ready || !naver) return
    layers.current.forEach((l) => l.setMap(null))
    layers.current = []
    const cur = candidates[active]
    if (cur) hubs.forEach((h) => layers.current.push(new naver.maps.Polyline({
      map: map.current, path: [new naver.maps.LatLng(cur.lat, cur.lng), new naver.maps.LatLng(h.lat, h.lng)],
      strokeColor: '#2b2b26', strokeOpacity: 0.85, strokeWeight: 2, strokeStyle: 'shortdash',
    })))
    hubs.forEach((h, i) => layers.current.push(new naver.maps.Marker({
      map: map.current, position: new naver.maps.LatLng(h.lat, h.lng), title: h.name,
      icon: { content: `<div class="nv-pin">${hubHtml(i + 1)}<span class="map-label">${esc(h.category)} · ${esc(h.name)}</span></div>`, anchor: new naver.maps.Point(15, 15) },
    })))
    candidates.forEach((c, i) => {
      const m = new naver.maps.Marker({
        map: map.current, position: new naver.maps.LatLng(c.lat, c.lng), title: c.name, zIndex: i === active ? 100 : 10,
        icon: { content: `<div class="nv-pin">${candHtml(i + 1, i === active)}${i === active ? `<span class="map-label">${esc(c.name)}</span>` : ''}</div>`, anchor: new naver.maps.Point(17, 17) },
      })
      naver.maps.Event.addListener(m, 'click', () => onSelect(i))
      layers.current.push(m)
    })
  }, [ready, candidates, hubs, active, onSelect])

  // 후보지를 고르면 그 후보지 + 목적지 구간으로
  useEffect(() => { if (ready) fit() }, [ready, active, focusKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoom = (d: number) => map.current?.setZoom(map.current.getZoom() + d, true)
  return (
    <div className="map naver-map">
      <div ref={box} className="naver-box" />
      <div className="map-controls">
        <button aria-label="확대" onClick={() => zoom(1)}>+</button>
        <button aria-label="고른 후보지와 목적지 보기" onClick={fit}>◎</button>
        <button aria-label="축소" onClick={() => zoom(-1)}>−</button>
      </div>
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── OSM(네이버 키가 없을 때) ─────────────────────────────────────────
const fitOptions = { paddingTopLeft: [PAD, PAD + 40] as [number, number], paddingBottomRight: [PAD, PAD] as [number, number] }

function Framing({ pts, focusKey, active }: { pts: [number, number][]; focusKey: number; active: number }) {
  const map = useMap()
  useEffect(() => {
    if (pts.length) map.flyToBounds(L.latLngBounds(pts), { ...fitOptions, duration: 0.6, maxZoom: 16 })
  }, [map, active, focusKey]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function Controls({ pts }: { pts: [number, number][] }) {
  const map = useMap()
  return (
    <div className="map-controls" ref={(el) => { if (el) { L.DomEvent.disableClickPropagation(el); L.DomEvent.disableScrollPropagation(el) } }}>
      <button aria-label="확대" onClick={() => map.zoomIn()}>+</button>
      <button aria-label="고른 후보지와 목적지 보기" onClick={() => { if (pts.length) map.fitBounds(L.latLngBounds(pts), { ...fitOptions, maxZoom: 16 }) }}>◎</button>
      <button aria-label="축소" onClick={() => map.zoomOut()}>−</button>
    </div>
  )
}

function OsmMap({ candidates, hubs, active, onSelect, focusKey }: Props) {
  const pts = useMemo(() => frame(candidates, hubs, active), [candidates, hubs, active])
  const cur = candidates[active]
  const start = pts[0] ?? [37.27, 127.07]
  return (
    <MapContainer className="map" center={start} zoom={13} zoomControl={false} attributionControl>
      <TileLayer className="tiles-base" url="https://tiles.osm.kr/hot/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" maxZoom={19} />
      <Framing pts={pts} focusKey={focusKey} active={active} />
      {cur && hubs.map((h) => (
        <Polyline key={h.id + cur.id} className="route" positions={[[cur.lat, cur.lng], [h.lat, h.lng]]} pathOptions={{ color: '#2b2b26', weight: 2, dashArray: '6 7', opacity: 0.85 }} />
      ))}
      {hubs.map((h, i) => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={L.divIcon({ className: 'pin-shell', html: hubHtml(i + 1), iconSize: [30, 30], iconAnchor: [15, 15] })}>
          <Tooltip permanent direction="right" offset={[14, 0]} className="map-label">{h.category} · {h.name}</Tooltip>
        </Marker>
      ))}
      {candidates.map((c, i) => (
        <Marker key={c.id} position={[c.lat, c.lng]} icon={L.divIcon({ className: 'pin-shell', html: candHtml(i + 1, i === active), iconSize: [34, 34], iconAnchor: [17, 17] })}
          zIndexOffset={i === active ? 1000 : 0} eventHandlers={{ click: () => onSelect(i) }}>
          {i === active && <Tooltip permanent direction="top" offset={[0, -18]} className="map-label">{c.name}</Tooltip>}
        </Marker>
      ))}
      <Controls pts={pts} />
    </MapContainer>
  )
}
