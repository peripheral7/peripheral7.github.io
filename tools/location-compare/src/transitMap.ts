// 지도 위 대중교통 경로(고른 후보지 → "장단점 기준" 목적지). 네이버 지도·OSM 지도가 같이 쓴다.
// - 도보 구간 = 회색 점선(점), 버스·지하철 = 노선 색 실선(흰 테두리), 정류장·역 = 노선 색 테두리의 흰 점 + 이름표.
// - 이름표: 타는 곳 = 노선 번호(색) + 정류장 이름 + "도보 N분"(앞 지점에서 걸어오는 시간), 마지막 내리는 곳 = "하차" + 목적지까지 도보.
// 자료(정류장 좌표·노선·버스 종류 색)와 한계는 TRANSIT.md.
import type { TransitLeg } from './scoring'
import { pn, t } from './i18n'

export const WALK_STYLE = { color: '#4a5563', weight: 5 } // 점선(둥근 끝 + 짧은 대시 = 점)
export type RideLeg = Extract<TransitLeg, { mode: 'bus' | 'subway' }>
export type StopMark = { lat: number; lng: number; color: string; html: string; title: string }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
/** 정류장 이름 줄이기: "망포역1번출구.디지털엠파이어1" → "망포역1번출구" */
const short = (s: string) => pn(s.split('.')[0])
const chip = (l: RideLeg) => `<i class="tr-chip" style="background:${l.color}">${l.mode === 'subway' ? '🚇' : '🚌'} ${esc(pn(l.name))}</i>`

/** 정류장·역 표시(타는 곳마다 하나, 마지막 내리는 곳 하나, 환승하며 걸어가는 곳은 내리는 곳도) */
export function transitStops(legs: TransitLeg[]): StopMark[] {
  const out: StopMark[] = []
  legs.forEach((l, i) => {
    if (l.mode === 'walk') return
    const prev = legs[i - 1], next = legs[i + 1]
    const [bLat, bLng] = l.line[0], [aLat, aLng] = l.line[l.line.length - 1]
    const walkIn = prev?.mode === 'walk' ? ` <small>${t(`도보 ${prev.min}분`, `walk ${prev.min} min`)}</small>` : ''
    const transfer = legs.slice(0, i).some((x) => x.mode !== 'walk')
    out.push({ lat: bLat, lng: bLng, color: l.color, title: t(`${l.from} 승차 · ${l.name}`, `Board at ${short(l.from)} · ${pn(l.name)}`), html: `${chip(l)}${transfer ? `<em>${t('환승', 'transfer')}</em> ` : ''}${esc(short(l.from))}${walkIn}` })
    const last = !legs.slice(i + 1).some((x) => x.mode !== 'walk')
    const off = `<em>${t('하차', 'get off')}</em>`
    if (last) out.push({ lat: aLat, lng: aLng, color: l.color, title: t(`${l.to} 하차`, `Get off at ${short(l.to)}`), html: `${off} ${esc(short(l.to))}${next?.mode === 'walk' ? ` <small>${t(`목적지까지 도보 ${next.min}분`, `walk ${next.min} min to destination`)}</small>` : ''}` })
    else if (next?.mode === 'walk') out.push({ lat: aLat, lng: aLng, color: l.color, title: t(`${l.to} 하차(환승)`, `Get off at ${short(l.to)} (transfer)`), html: `${off} ${esc(short(l.to))}` })
  })
  return out
}
/** 정류장 점 + 이름표(네이버 지도 마커 내용·OSM divIcon 같이) */
export const stopHtml = (s: StopMark) => `<div class="nv-pin tr-pin" title="${esc(s.title)}"><span class="tr-stop" style="border-color:${s.color}"></span><span class="map-label tr-label">${s.html}</span></div>`
/** 지도 아래 한 줄 요약: "🚌 학교까지 대중교통 25분 · 도보 10분 → 1550-1 → 1112 → 도보 1분" */
export function transitSummary(legs: TransitLeg[]): string {
  return legs.map((l) => (l.mode === 'walk' ? t(`도보 ${l.min}분`, `walk ${l.min} min`) : pn(l.name))).join(' → ')
}
