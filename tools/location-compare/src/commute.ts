// 출퇴근 인사이트: 고른 후보지에서 목적지까지의 하루·한 달 이동 시간과 교통비(대중교통·차량 나란히).
// 이동 시간은 scoring.ts 의 추정(차량은 네이버 실측이 있으면 그 값)을 그대로 쓴다. 공식 설명은 README 4-3절.
import { WALK_ONLY, type CandidateResult, type HubResult } from './scoring'

export const TRANSIT_FARE = 1500 // 대중교통 1회(편도) 기본요금(원)
export const FARE_BASE_KM = 10 // 이 거리까지는 기본요금
export const FARE_STEP_KM = 5 // 넘으면 이 거리마다
export const FARE_STEP = 100 // 이만큼 더한다(원)
export const ROAD_FACTOR = 1.3 // 네이버 실측 거리가 없을 때 직선거리 → 도로 거리
export const DEFAULT_KMPL = 12 // 연비 기본값(km/L)
export const DEFAULT_FUEL = 1700 // 기름값 기본값(원/L) — 추후 실제 유가 데이터로 바꿀 자리

export type CommuteSettings = { kmpl: number; fuel: number }
const KEY = 'locCompare.commute.v1'

export function loadCommute(): CommuteSettings {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s && s.kmpl > 0 && s.fuel > 0) return { kmpl: s.kmpl, fuel: s.fuel }
  } catch { /* 기본값 */ }
  return { kmpl: DEFAULT_KMPL, fuel: DEFAULT_FUEL }
}
export function saveCommute(s: CommuteSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* 저장 못 해도 화면은 동작 */ }
}

/** 대중교통 편도 요금: 기본 1,500원, 10km 넘으면 5km마다 +100원(직선거리 기준 추정) */
export const transitFare = (km: number) => TRANSIT_FARE + (km > FARE_BASE_KM ? Math.ceil((km - FARE_BASE_KM) / FARE_STEP_KM) * FARE_STEP : 0)

/** 한 목적지 왕복(출근+퇴근) — 분·원. 도보 10분 이내면 대중교통 대신 걸어간다(0원). 차량은 출퇴근 시간대. */
export type RoundTrip = { transitMin: number; transitWon: number; walked: boolean; carMin: number; carWon: number; carKm: number }

export function roundTrip(h: HubResult, s: CommuteSettings): RoundTrip {
  const t = h.trip
  const walked = t.walk <= WALK_ONLY
  const carKm = t.carSource.rush?.km ?? t.carSource.free?.km ?? t.km * ROAD_FACTOR
  return {
    transitMin: 2 * (walked ? t.walk : t.transit),
    transitWon: walked ? 0 : 2 * transitFare(t.km),
    walked,
    carMin: 2 * t.carRush,
    carKm: 2 * carKm,
    carWon: Math.round((2 * carKm / s.kmpl) * s.fuel),
  }
}

export type Insight = {
  main: HubResult // 하루 기준 목적지 = 월 왕복이 가장 많은 곳
  day: RoundTrip
  month: { trips: number; transitMin: number; transitWon: number; carMin: number; carWon: number }
}

export function commuteInsight(r: CandidateResult, trips: Record<string, number>, s: CommuteSettings): Insight | null {
  if (!r.hubs.length) return null
  const main = [...r.hubs].sort((a, b) => (trips[b.hub.id] ?? 0) - (trips[a.hub.id] ?? 0))[0]
  const month = { trips: 0, transitMin: 0, transitWon: 0, carMin: 0, carWon: 0 }
  r.hubs.forEach((h) => {
    const n = Math.max(0, trips[h.hub.id] ?? 0), rt = roundTrip(h, s)
    month.trips += n
    month.transitMin += n * rt.transitMin; month.transitWon += n * rt.transitWon
    month.carMin += n * rt.carMin; month.carWon += n * rt.carWon
  })
  return { main, day: roundTrip(main, s), month }
}

/** 95 → "1시간 35분", 40 → "40분" */
export function hm(min: number): string {
  const h = Math.floor(min / 60), m = Math.round(min % 60)
  return h ? `${h}시간${m ? ` ${m}분` : ''}` : `${m}분`
}
/** 원 → "93,000원"(10원 단위 반올림) */
export const wonText = (v: number) => `${(Math.round(v / 10) * 10).toLocaleString('ko-KR')}원`
