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
      {/* 위성 사진(Esri) 위에 지명(Esri 참조 레이어)을 얹는다. 위성 사진은 CSS 로 어둡게 바꾼다 */}
      <TileLayer className="tiles-imagery" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Imagery &copy; Esri" maxZoom={18} />
      <TileLayer className="tiles-labels" url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" attribution="Labels &copy; Esri" maxZoom={18} />
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
