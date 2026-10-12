import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Candidate, Hub } from '../data'

type Props = { candidates: Candidate[]; hubs: Hub[]; active: number; onSelect: (index: number) => void }

const candidateIcon = (n: number, on: boolean) =>
  L.divIcon({ className: 'pin-shell', html: `<span class="pin cand${on ? ' on' : ''}">${n}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] })
const hubIcon = (n: number) =>
  L.divIcon({ className: 'pin-shell', html: `<span class="pin hub"><b>${n}</b></span>`, iconSize: [30, 30], iconAnchor: [15, 15] })

// 처음에는 후보지·거점이 모두 보이게 맞추고, 후보를 바꾸면 그 후보로 부드럽게 옮긴다.
function Framing({ points, focus }: { points: [number, number][]; focus: [number, number] }) {
  const map = useMap()
  useEffect(() => { map.fitBounds(L.latLngBounds(points), { padding: [60, 60] }) }, [map]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!map.getBounds().pad(-0.15).contains(focus)) map.panTo(focus, { animate: true, duration: 0.5 })
  }, [map, focus[0], focus[1]]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function Controls({ points }: { points: [number, number][] }) {
  const map = useMap()
  return (
    <div className="map-controls" ref={(el) => { if (el) { L.DomEvent.disableClickPropagation(el); L.DomEvent.disableScrollPropagation(el) } }}>
      <button aria-label="확대" onClick={() => map.zoomIn()}>+</button>
      <button aria-label="전체 보기" onClick={() => map.fitBounds(L.latLngBounds(points), { padding: [60, 60] })}>◎</button>
      <button aria-label="축소" onClick={() => map.zoomOut()}>−</button>
    </div>
  )
}

export function MapView({ candidates, hubs, active, onSelect }: Props) {
  const points = useMemo(() => [...candidates, ...hubs].map((p) => [p.lat, p.lng] as [number, number]), [candidates, hubs])
  const cur = candidates[active] ?? candidates[0]
  return (
    <MapContainer className="map" center={[cur.lat, cur.lng]} zoom={12} zoomControl={false} attributionControl>
      {/* 도로·건물이 나오는 OSM 한국 타일을 CSS 로 흑백 반전해 어둡고 단순하게 보이게 한다(키 필요 없음). */}
      <TileLayer className="tiles-base" url="https://tiles.osm.kr/hot/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" maxZoom={19} />
      <Framing points={points} focus={[cur.lat, cur.lng]} />
      {hubs.map((h) => (
        <Polyline key={h.id} className="route" positions={[[cur.lat, cur.lng], [h.lat, h.lng]]} pathOptions={{ color: '#f2f2ee', weight: 2, dashArray: '6 7', opacity: 0.9 }} />
      ))}
      {hubs.map((h, i) => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={hubIcon(i + 1)}>
          <Tooltip permanent direction="right" offset={[14, 0]} className="map-label hub-label">{h.category} · {h.name}</Tooltip>
        </Marker>
      ))}
      {candidates.map((c, i) => (
        <Marker key={c.id} position={[c.lat, c.lng]} icon={candidateIcon(i + 1, i === active)} zIndexOffset={i === active ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(i) }}>
          {i === active && <Tooltip permanent direction="top" offset={[0, -18]} className="map-label">{c.name}</Tooltip>}
        </Marker>
      ))}
      <Controls points={points} />
    </MapContainer>
  )
}
