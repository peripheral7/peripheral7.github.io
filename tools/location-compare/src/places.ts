// 입지 요인 — 평화로움 · 공원 · 도서관. 이 PC 에서 만든 src/places.json(scripts/places.mjs)만 읽는다.
// 계산 규칙은 src/places-config.json, 설명은 README 4-5절. 자료: 기본 후보지 = places.json, 검색으로 넣은 후보지 = 계산 서버(live.ts).
import data from './places.json'
import config from './places-config.json'
import type { Candidate } from './data'
import { isDefaultCandidate, liveAnalysis } from './live'

export type PlaceKey = 'peace' | 'park' | 'library'
export type ParkRow = { name: string; type: string; dist: number; value: number; eff: number; areaHa: number; walkM: number; waterside: boolean; linked: boolean; relief?: number; steep?: number }
export type LibraryRow = { name: string; dist: number; seats: number; books: number }
export type PlaceRow = {
  peace: { score: number; food: number; foodScore: number; road: { name: string; dist: number } | null; roadScore: number; green: number; greenScore: number }
  park: { score: number; green: number; greenBonus: number; parks: ParkRow[] }
  library: { score: number; near: LibraryRow[] }
}
export const PLACE_LABEL: Record<PlaceKey, string> = { peace: '🕊️ 평화로움', park: '🌳 공원', library: '📚 도서관' }
export const PLACE_NOTE: Record<PlaceKey, string> = { peace: '음식점 · 큰길', park: '공원 · 녹지 비율', library: '가까운 공공도서관' }
export const PLACE_KEYS: PlaceKey[] = ['peace', 'park', 'library']
export const OSM_AT = data.osmAt
export const LIBRARY_AT = data.libraryAt
/** 자료 출처(계산 방식 창에 그대로) */
export const PLACE_SOURCES = data.sources as string[]

type Raw = PlaceRow & { lat: number; lng: number }
const ROWS = data.candidates as unknown as Record<string, Raw>

/** 그 후보지의 자료(같은 id 이고 좌표가 30m 안일 때만) */
export function placeOf(c: Candidate | undefined): PlaceRow | null {
  if (!c) return null
  const r = ROWS[c.id]
  if (!r || !isDefaultCandidate(c)) return (liveAnalysis(c)?.places as unknown as PlaceRow | undefined) ?? null // 검색으로 넣은 후보지 = 계산 서버(live.ts)
  const dy = (r.lat - c.lat) * 111320, dx = (r.lng - c.lng) * 111320 * Math.cos((c.lat * Math.PI) / 180)
  return Math.hypot(dx, dy) <= 30 ? r : null
}

/** 자전거를 고르면 공공시설(도서관)의 거리 기준표를 2배로 — 가장 가까운 도서관까지 거리 d 를 d÷2 로 본다 */
const libScore = (d: number) => { const L = config.library; return d <= L.fullM ? 10 : d <= L.halfM ? 10 - (5 * (d - L.fullM)) / (L.halfM - L.fullM) : d <= L.zeroM ? 5 - (5 * (d - L.halfM)) / (L.zeroM - L.halfM) : 0 }
export function placeFor(c: Candidate | undefined, bike?: boolean): PlaceRow | null {
  const r = placeOf(c)
  if (!r || !bike) return r
  const d = r.library.near[0]?.dist
  return d === undefined ? r : { ...r, library: { ...r.library, score: Math.round(libScore(d / 2) * 10) / 10 } }
}

/** 켜고 끄기(이 브라우저에 저장) */
export type PlaceOn = Record<PlaceKey, boolean>
const KEY = 'locCompare.places.v1'
export function loadPlaceOn(): PlaceOn {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) return { peace: s.peace !== false, park: s.park !== false, library: s.library !== false } } catch { /* 기본값 */ }
  return { peace: true, park: true, library: true }
}
export function savePlaceOn(v: PlaceOn) { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* 저장 못 해도 동작 */ } }

/** 이름 아래 한 줄 요약 */
export function placeSummary(k: PlaceKey, r: PlaceRow): string {
  // 거리(m)·음식점 수 같은 규칙 숫자는 적지 않는다 — 이름만(계산 내역은 이름을 눌렀을 때)
  if (k === 'peace') return ''
  if (k === 'park') { const p = r.park.parks[0]; return p ? `${p.name}${p.linked ? ' · 길게 연결' : ''} · 녹지 ${r.park.green}%` : `가까운 공원 없음 · 녹지 ${r.park.green}%` }
  const l = r.library.near[0]
  return l ? l.name : '공공도서관 자료 없음'
}
