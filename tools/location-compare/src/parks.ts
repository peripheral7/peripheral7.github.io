// 산책 지표: 후보지 근처 공원·하천(OpenStreetMap). 지도에서 "산책"을 켤 때만 브라우저가 Overpass API 를 한 번 부르고,
// 결과는 이 브라우저에 7일간 저장한다(후보지 좌표가 바뀌면 다시 받는다). 자료가 없는 곳은 비어 있을 수 있다.
import { distanceKm } from './scoring'
import type { Candidate } from './data'
import areas from './park-areas.json'

export type Park = { id: string; name: string; kind: '공원' | '하천'; lat: number; lng: number }
export const STROLL_RADIUS = 800 // m — 도보 약 10분
const KEY = 'locCompare.parks.v1'
const WEEK = 7 * 86_400_000
const ENDPOINT = 'https://overpass-api.de/api/interpreter'

const sig = (cs: Candidate[]) => cs.map((c) => `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`).sort().join(';')

export async function loadParks(cs: Candidate[]): Promise<Park[]> {
  const s = sig(cs)
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (c && c.sig === s && Date.now() - c.at < WEEK) return c.parks
  } catch { /* 저장소를 못 쓰면 새로 받는다 */ }
  const around = cs.map((c) => `(around:${STROLL_RADIUS},${c.lat},${c.lng})`)
  const q = `[out:json][timeout:25];(${around.map((a) => `nwr["leisure"="park"]["name"]${a};way["waterway"~"^(river|stream)$"]["name"]${a};`).join('')});out center tags;`
  const res = await fetch(ENDPOINT, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  if (!res.ok) throw new Error('공원 자료를 받지 못했습니다.')
  const j = await res.json() as { elements: { id: number; type: string; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] }
  const seen = new Set<string>()
  const parks: Park[] = []
  for (const e of j.elements) {
    const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon, name = e.tags?.name
    if (lat === undefined || lng === undefined || !name) continue
    const kind = e.tags?.waterway ? '하천' : '공원'
    const k = kind + name // 같은 이름의 하천 조각은 하나로
    if (seen.has(k)) continue
    seen.add(k)
    parks.push({ id: `${e.type}${e.id}`, name, kind, lat, lng })
  }
  try { localStorage.setItem(KEY, JSON.stringify({ sig: s, at: Date.now(), parks })) } catch { /* 저장 못 해도 동작 */ }
  return parks
}

/** 후보지에서 가장 가까운 것(없으면 null)과 반경 안 개수 */
export function strollNear(c: Candidate, parks: Park[]) {
  const list = parks.map((p) => ({ p, m: distanceKm(c, p) * 1000 })).filter((x) => x.m <= STROLL_RADIUS).sort((a, b) => a.m - b.m)
  return { nearest: list[0] ?? null, count: list.length }
}

// 지도 "산책" 색칠: 공원 점수(README 4-5절 공원마다 점수)가 일정 이상인 공원 경계. 이 PC 에서 scripts/places.mjs 가 만든다(공간시설 UQ162 경계).
export type ParkArea = { name: string; type: string; value: number; rings: [number, number][][] }
export const PARK_AREAS = areas.parks as unknown as ParkArea[]
export const PARK_AREA_MIN = areas.minValue
/** 점수가 높을수록 진하게(최소 점수 → 옅게, 10점 → 진하게) */
export const parkAreaAlpha = (v: number) => 0.18 + (0.3 * Math.max(0, v - PARK_AREA_MIN)) / Math.max(1, 10 - PARK_AREA_MIN)
