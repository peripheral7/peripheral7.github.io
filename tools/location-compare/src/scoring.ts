// 이동 시간 추정과 점수 계산. 공식의 이유와 예시는 README 의 "점수 산정 방식"에 있다.
import type { Candidate, Hub, Preference } from './data'
import routes from './routes.json'

// ── 1. 이동 시간 추정(가상) ──────────────────────────────────────────
// 두 지점의 직선거리만으로 시간을 추정한다. 단, 차량은 src/routes.json 에 네이버 실측값이 있으면 그것을 쓴다.
// 같은 거리면 같은 시간이 나오는 단순 모델이라, 실제 노선·도로 사정은 반영되지 않는다.

export type Trip = {
  km: number
  walk: number // 도보 전체 시간(분)
  access: number // 대중교통: 정류장·역까지 걷는 시간(분)
  wait: number // 대중교통: 기다리는 시간(분)
  transfers: number // 대중교통: 환승 횟수
  ride: number // 대중교통: 차 안에 있는 시간(분)
  transit: number // 대중교통 전체 = 도보 + 대기 + 탑승 + 환승 1회당 5분
  carFree: number // 차량: 여유 시간대(분)
  carRush: number // 차량: 출퇴근 시간대(분)
  carSource: { free: CarSlot | null; rush: CarSlot | null } // 네이버로 잰 값이 있으면 그 기록(없으면 추정)
}

/** 네이버 Directions 로 잰 한 시간대의 기록(scripts/fetch-routes.mjs 가 src/routes.json 에 남긴다). */
export type CarSlot = { min: number; km: number; at: string }
type Measured = Partial<Record<'free' | 'rush', CarSlot>>
const MEASURED = (routes as { pairs: Record<string, Measured> }).pairs

const R = 6371
const rad = (d: number) => (d * Math.PI) / 180
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

export function estimateTrip(from: Candidate, to: Hub): Trip {
  const km = distanceKm(from, to)
  const walk = Math.max(3, Math.round((km / 4.7) * 60)) // 걷기 시속 4.7km
  const access = clamp(Math.round(4 + km * 0.7), 3, 18) // 멀수록 큰 역·정류장까지 더 걷는다고 본다
  const wait = 5 + Math.min(7, Math.round(km / 6)) // 기본 5분 + 거리에 따라 최대 7분
  const transfers = km <= 3 ? 0 : km <= 12 ? 1 : 2
  const ride = Math.max(4, Math.round((km / 22) * 60)) // 버스·지하철 평균 시속 22km
  const transit = access + wait + ride + transfers * 5
  // 차량: 네이버로 잰 값이 있으면 그 값을, 없으면 추정을 쓴다(시간대마다 따로).
  const m = MEASURED[`${from.id}:${to.id}`] ?? {}
  const estFree = Math.max(5, Math.round((km / 31) * 60 + 3)) // 시속 31km + 주차·출발 3분
  const carFree = m.free ? m.free.min : estFree
  const carRush = m.rush ? m.rush.min : Math.max(7, Math.round(carFree * 1.52 + 4)) // 출퇴근 정체: 1.52배 + 4분
  return { km, walk, access, wait, transfers, ride, transit, carFree, carRush, carSource: { free: m.free ?? null, rush: m.rush ?? null } }
}

// ── 2. 수단별 점수(10점 만점) ─────────────────────────────────────────
// 대중교통·차량은 "같은 거점을 두고 후보지끼리 비교한 상대 점수": 가장 좋은 후보지가 10점,
// 나머지는 가장 좋은 값과의 비율만큼 깎인다. 도보는 비교 없이 시간만 본다.

export const WALK_LIMIT = 30 // 도보 30분 초과는 표시도 계산도 하지 않는다
export const TRANSIT_PARTS = { wait: 0.4, access: 0.4, transfers: 0.2 } // 대중교통 점수 안의 비중

const ratioScore = (best: number, value: number) => (value <= 0 ? 10 : (10 * best) / value)

export type ModeScores = {
  transit: number
  transitParts: { wait: number; access: number; transfers: number }
  car: number
  carRatio: number // 출퇴근 ÷ 여유
  walk: number | null // 30분 초과면 null
}

export function walkScore(minutes: number): number | null {
  if (minutes > WALK_LIMIT) return null
  return clamp((10 * (WALK_LIMIT - minutes)) / (WALK_LIMIT - 5), 0, 10) // 5분 이하 10점 → 30분 0점
}

/** 한 거점에 대해 모든 후보지의 수단별 점수(후보지 순서대로). */
export function modeScoresForHub(trips: Trip[]): ModeScores[] {
  const bestWait = Math.min(...trips.map((t) => t.wait))
  const bestAccess = Math.min(...trips.map((t) => t.access))
  const bestTransfers = Math.min(...trips.map((t) => t.transfers))
  const ratios = trips.map((t) => t.carRush / t.carFree)
  const bestRatio = Math.min(...ratios)
  return trips.map((t, i) => {
    const parts = {
      wait: ratioScore(bestWait, t.wait),
      access: ratioScore(bestAccess, t.access),
      transfers: ratioScore(bestTransfers + 1, t.transfers + 1), // 0회가 있어도 나눌 수 있게 +1
    }
    const transit = parts.wait * TRANSIT_PARTS.wait + parts.access * TRANSIT_PARTS.access + parts.transfers * TRANSIT_PARTS.transfers
    return { transit, transitParts: parts, car: ratioScore(bestRatio, ratios[i]), carRatio: ratios[i], walk: walkScore(t.walk) }
  })
}

// ── 3. 가중치 → 거점 점수 → 후보지 종합 점수 ──────────────────────────
// 거점 점수 = 수단별 점수의 가중 평균(교통 선호도의 수단 가중치). 도보는 아래 hubScore 설명 참고.
// 종합 점수 = 거점 점수를 월 왕복 횟수로 가중 평균. 모든 횟수가 0이면 거점을 똑같이 본다.

export type HubResult = { hub: Hub; trip: Trip; scores: ModeScores; hubScore: number; share: number; walkCounts: boolean }
export type CandidateResult = { candidate: Candidate; hubs: HubResult[]; total: number; rank: number }

/**
 * 방문지 점수. walkCounts = 이 방문지에 30분 안에 걸어갈 수 있는 후보지가 하나라도 있는가.
 * - 있으면: 도보를 비교에 넣고, 30분을 넘는 후보지는 도보 0점(빼 버리면 못 걷는 후보지가 오히려 유리해진다).
 * - 없으면: 아무도 걸어갈 수 없으니 도보를 빼고 대중교통·차량 가중치만으로 다시 나눈다.
 */
export function hubScore(s: ModeScores, w: Preference['weights'], walkCounts: boolean): number {
  const parts: [number, number][] = [[s.transit, w.transit], [s.car, w.car]]
  if (walkCounts) parts.push([s.walk ?? 0, w.walk])
  const sumW = parts.reduce((a, [, x]) => a + Math.max(0, x), 0)
  if (sumW === 0) return parts.reduce((a, [v]) => a + v, 0) / parts.length // 가중치가 모두 0이면 단순 평균
  return parts.reduce((a, [v, x]) => a + v * Math.max(0, x), 0) / sumW
}

export function evaluate(candidates: Candidate[], hubs: Hub[], pref: Preference): CandidateResult[] {
  const tripsByHub = hubs.map((hub) => candidates.map((c) => estimateTrip(c, hub)))
  const scoresByHub = tripsByHub.map(modeScoresForHub)
  const walkCountsByHub = scoresByHub.map((list) => list.some((x) => x.walk !== null))
  const rawTrips = hubs.map((h) => Math.max(0, pref.trips[h.id] ?? 0))
  const tripSum = rawTrips.reduce((a, b) => a + b, 0)
  const shares = rawTrips.map((t) => (tripSum > 0 ? t / tripSum : 1 / hubs.length))
  const results = candidates.map((candidate, ci) => {
    const hubResults = hubs.map((hub, hi) => {
      const scores = scoresByHub[hi][ci]
      const walkCounts = walkCountsByHub[hi]
      return { hub, trip: tripsByHub[hi][ci], scores, hubScore: hubScore(scores, pref.weights, walkCounts), share: shares[hi], walkCounts }
    })
    const total = hubResults.reduce((a, r) => a + r.hubScore * r.share, 0)
    return { candidate, hubs: hubResults, total, rank: 0 }
  })
  const order = [...results].sort((a, b) => b.total - a.total)
  order.forEach((r, i) => { r.rank = i + 1 })
  return results
}

export const fmt = (x: number) => (Math.round(x * 10) / 10).toFixed(1)
