// 입지 요인 — 평화로움 · 공원 · 공공시설. 이 PC 에서 만든 src/places.json(scripts/places.mjs)만 읽는다.
// 계산 규칙은 src/places-config.json, 설명은 README 4-5절. 자료는 기본 후보지만(검색으로 넣은 후보지는 "자료 없음").
import data from './places.json'
import type { Candidate } from './data'

export type PlaceKey = 'peace' | 'park' | 'public'
export type ParkRow = { name: string; dist: number; value: number; eff: number; areaHa: number; walkM: number; waterside: boolean; linked: boolean }
export type Facility = { id: string; label: string; emoji: string; count: number; nearest: { name: string; dist: number } | null; score: number }
export type PlaceRow = {
  peace: { score: number; food: number; foodScore: number; road: { name: string; dist: number } | null; roadScore: number }
  park: { score: number; green: number; greenBonus: number; parks: ParkRow[] }
  public: { score: number; facilities: Facility[] }
}
export const PLACE_LABEL: Record<PlaceKey, string> = { peace: '🕊️ 평화로움', park: '🌳 공원', public: '🏛️ 공공시설' }
export const PLACE_NOTE: Record<PlaceKey, string> = { peace: '60m 안 음식점 · 큰길과의 거리', park: '1km 안 공원 · 녹지 비율', public: '1km 안 도서관 · 운동 시설' }
export const PLACE_KEYS: PlaceKey[] = ['peace', 'park', 'public']
export const OSM_AT = data.osmAt

type Raw = PlaceRow & { lat: number; lng: number }
const ROWS = data.candidates as unknown as Record<string, Raw>

/** 그 후보지의 자료(같은 id 이고 좌표가 30m 안일 때만) */
export function placeOf(c: Candidate | undefined): PlaceRow | null {
  const r = c ? ROWS[c.id] : null
  if (!r || !c) return null
  const dy = (r.lat - c.lat) * 111320, dx = (r.lng - c.lng) * 111320 * Math.cos((c.lat * Math.PI) / 180)
  return Math.hypot(dx, dy) <= 30 ? r : null
}

/** 켜고 끄기(이 브라우저에 저장) */
export type PlaceOn = Record<PlaceKey, boolean>
const KEY = 'locCompare.places.v1'
export function loadPlaceOn(): PlaceOn {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) return { peace: s.peace !== false, park: s.park !== false, public: s.public !== false } } catch { /* 기본값 */ }
  return { peace: true, park: true, public: true }
}
export function savePlaceOn(v: PlaceOn) { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* 저장 못 해도 동작 */ } }

/** 이름 아래 한 줄 요약 */
export function placeSummary(k: PlaceKey, r: PlaceRow): string {
  if (k === 'peace') return `60m 안 음식점 ${r.peace.food}곳 · ${r.peace.road ? `큰길(${r.peace.road.name}) ${r.peace.road.dist}m` : '가까운 큰길 없음'}`
  if (k === 'park') { const p = r.park.parks[0]; return p ? `${p.name} ${p.dist}m${p.linked ? ' · 길게 연결' : ''} · 녹지 ${r.park.green}%` : `1km 안 공원 없음 · 녹지 ${r.park.green}%` }
  const got = r.public.facilities.filter((f) => f.count > 0)
  return got.length ? got.map((f) => `${f.emoji}${f.nearest ? ` ${f.nearest.dist}m` : ''}`).join(' · ') : '1km 안 시설 없음'
}
