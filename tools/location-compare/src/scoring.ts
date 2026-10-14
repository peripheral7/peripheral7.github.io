// 이동 시간과 점수 계산. 공식의 이유와 예시는 README 의 "점수 산정 방식"에 있다.
import { activeModes, weightShares, WEEKS_PER_MONTH, type Candidate, type Hub, type HubMode, type ModeKey, type Preference } from './data'
import routes from './routes.json'
import paths from './paths.json'
import { isDefaultCandidate, livePaths, liveRoute, setStaticCheck } from './live'
import { placeOf } from './places'

// ── 1. 이동 시간 ──────────────────────────────────────────────────────
// 실제 경로가 있으면 그 값, 없으면 직선거리 추정.
// - 도보·자전거: OSM 길을 따라간 거리(scripts/fetch-paths.mjs → src/paths.json, 새 후보지는 계산 서버) ÷ 시속 4.7km·15km
// - 대중교통: 서울시 대중교통환승경로(버스+지하철, 경기도 구간 포함) — 전체 시간·환승·정류장까지 도보. 대기는 추정.
// - 차량: 네이버 Directions 5 실측(출퇴근 = 평일 08시·18시 평균, 낮 = 평일 10시·13시 평균)

export type Trip = {
  km: number // 직선거리
  walk: number // 도보 전체 시간(분)
  walkKm: number // 걷는 거리(OSM 길, 없으면 직선 × 1.25)
  bike: number // 자전거(분)
  pathSource: 'osm' | 'est' // 도보·자전거가 OSM 길 거리인가
  access: number // 대중교통: 정류장·역까지 걷는 시간(분)
  wait: number // 대중교통: 기다리는 시간(분)
  transfers: number // 대중교통: 환승 횟수
  ride: number // 대중교통: 차 안에 있는 시간(분)
  transit: number // 대중교통 전체(분)
  transitSource: 'api' | 'est' // 서울시 환승경로로 찾은 값인가
  routes: string[] // 대중교통 노선(찾았을 때)
  legs: TransitLeg[] // 대중교통 경로 구간(지도 그림, 없으면 빈 목록)
  carFree: number // 차량: 여유 시간대(분)
  carRush: number // 차량: 출퇴근 시간대(분)
  carKm: number // 차량 도로 거리(실측 없으면 직선 × 1.3)
  carSource: { free: CarSlot | null; rush: CarSlot | null } // 네이버로 잰 값이 있으면 그 기록(없으면 추정)
}

/** 한 번 잰 값 */
export type CarSample = { min: number; km: number; at: string }
/** 네이버 Directions 로 잰 한 시간대. samples = 그 시간대 안 두 시각(am = 08시·10시, pm = 18시·13시)의 값 — 있으면 min·km 은 그 평균.
 *  provisional = 등록할 때 그 시각 교통으로 한 번 잰 값(두 기준 시각 중 하나도 아직 없음). */
export type CarSlot = CarSample & { samples?: Partial<Record<'am' | 'pm', CarSample>>; provisional?: boolean }
export type Measured = Partial<Record<'free' | 'rush', CarSlot>>
const MEASURED = (routes as { pairs: Record<string, Measured> }).pairs
/** 두 기준 시각을 다 잰 시간대인가 */
export const slotDone = (s?: CarSlot | null) => !!(s?.samples?.am && s?.samples?.pm)
setStaticCheck((cid, hid) => slotDone(MEASURED[`${cid}:${hid}`]?.free) && slotDone(MEASURED[`${cid}:${hid}`]?.rush))

/** 미리 잰 값(routes.json)과 계산 서버 값을 합친다 — 기준 시각마다 최근 것, 표본이 있으면 평균 */
export function mergeSlot(a?: CarSlot | null, b?: CarSlot | null): CarSlot | undefined {
  if (!a) return b ?? undefined
  if (!b) return a
  const pick = (x?: CarSample, y?: CarSample) => (!x ? y : !y ? x : x.at >= y.at ? x : y)
  const am = pick(a.samples?.am, b.samples?.am), pm = pick(a.samples?.pm, b.samples?.pm)
  if (!am && !pm) return a.at >= b.at ? a : b
  const ss = [am, pm].filter(Boolean) as CarSample[]
  return { min: Math.round(ss.reduce((s, x) => s + x.min, 0) / ss.length), km: Math.round((ss.reduce((s, x) => s + x.km, 0) / ss.length) * 10) / 10, at: ss.map((x) => x.at).sort().pop()!, samples: { ...(am ? { am } : {}), ...(pm ? { pm } : {}) } }
}

type PathRow = { walk?: { km: number; min: number }; bike?: { km: number; min: number }; transit?: TransitRow | null; lat?: number; lng?: number }
export type TransitRow = { min: number; ride: number; access: number; egress: number; wait: number; transfers: number; routes: string[]; first?: string; last?: string; legs?: TransitLeg[] }
/** 대중교통 경로의 한 구간(scripts/paths-lib.mjs buildLegs, 자료 출처는 TRANSIT.md) — 지도에 도보는 점선, 버스·지하철은 노선 색 선.
 *  line = [위도, 경도] 점들, approx = 실제 노선이 아닌 근사선(버스 = 도로 길찾기, 지하철 = 역 사이 직선) */
export type TransitLeg =
  | { mode: 'walk'; min: number; m: number; line: [number, number][]; approx?: boolean }
  | { mode: 'bus' | 'subway'; name: string; color: string; from: string; to: string; line: [number, number][]; type?: string; typeName?: string; approx?: boolean }
const PATHS = (paths as unknown as { pairs: Record<string, PathRow> }).pairs ?? {}

const R = 6371
const rad = (d: number) => (d * Math.PI) / 180
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
export const WALK_KMH = 4.7
export const BIKE_KMH = 15
export const ROAD_FACTOR = 1.3 // 도로 거리가 없을 때 직선거리 → 도로 거리

export function estimateTrip(from: Candidate, to: Hub): Trip {
  const km = distanceKm(from, to)
  const def = isDefaultCandidate(from)
  const p: PathRow = (def ? PATHS[`${from.id}:${to.id}`] : null) ?? livePaths(from, to) ?? {}
  // 도보·자전거: OSM 길 거리(없으면 직선 × 1.25)
  const walkKm = p.walk?.km ?? km * 1.25
  const walk = Math.max(1, Math.round((walkKm / WALK_KMH) * 60))
  const bike = p.bike ? p.bike.min : Math.max(1, Math.round(((km * 1.3) / BIKE_KMH) * 60))
  // 대중교통: 서울시 환승경로(없으면 추정 — 정류장까지 도보는 멀수록 큰 역까지, 대기 5분 + 거리, 환승은 거리 구간, 탑승 시속 22km)
  const t = p.transit
  const access = t ? t.access : clamp(Math.round(4 + km * 0.7), 3, 18)
  const wait = t ? t.wait : 5 + Math.min(7, Math.round(km / 6))
  const transfers = t ? t.transfers : km <= 3 ? 0 : km <= 12 ? 1 : 2
  const ride = t ? t.ride : Math.max(4, Math.round((km / 22) * 60))
  const transit = t ? t.min : access + wait + ride + transfers * 5
  // 차량: 네이버로 잰 값이 있으면 그 값을, 없으면 추정을 쓴다(시간대마다 따로). 추정식(직선거리만 봄):
  //   낮 = 직선거리 ÷ 시속 31km + 3분(최소 5분), 출퇴근 = 낮 × 1.52 + 4분(최소 7분)
  const st = (def ? MEASURED[`${from.id}:${to.id}`] : null) ?? {}, lv = liveRoute(from, to) ?? {}
  const m: Measured = { free: mergeSlot(st.free, lv.free), rush: mergeSlot(st.rush, lv.rush) }
  const estFree = Math.max(5, Math.round((km / 31) * 60 + 3)) // 시속 31km + 주차·출발 3분
  const carFree = m.free ? m.free.min : m.rush ? Math.max(5, Math.round((m.rush.min - 4) / 1.52)) : estFree
  const carRush = m.rush ? m.rush.min : Math.max(7, Math.round(carFree * 1.52 + 4)) // 출퇴근 정체: 1.52배 + 4분
  const carKm = m.rush?.km ?? m.free?.km ?? km * ROAD_FACTOR
  return {
    km, walk, walkKm, bike, pathSource: p.walk ? 'osm' : 'est',
    access, wait, transfers, ride, transit, transitSource: t ? 'api' : 'est', routes: t?.routes ?? [], legs: t?.legs ?? [],
    carFree, carRush, carKm, carSource: { free: m.free ?? null, rush: m.rush ?? null },
  }
}

// ── 2. 수단별 점수(10점 만점) ─────────────────────────────────────────
// 대중교통은 "목적지마다 고정된 기준값"에 대한 비율: 점수 = 10 × 기준값 ÷ 내 값(최대 10).
// 차량은 정체·거리 대비 효율·대로 진입 세 가지(아래 carScores). 도보·자전거는 시간만 본다.

export const WALK_LIMIT = 30 // 도보 30분 초과는 표시도 계산도 하지 않는다
export const WALK_ZONE = 10 // 도보 10분까지는 "도보권"(지도·카드에 표시) — 10-14 사용자 지정(20 → 10)
export const WALK_ONLY = 10 // 도보 10분 이내면 걸어가니 그 방문지 점수에서 대중교통을 뺀다(초과하면 대중교통 이용)
export const BIKE_LIMIT = 40 // 자전거 40분 초과는 계산하지 않는다
export const TRANSIT_PARTS = { wait: 0.4, access: 0.4, transfers: 0.2 } // 대중교통 점수 안의 비중
/** 차량 점수 안의 비중 — 정체(출퇴근 ÷ 낮) · 거리 대비 효율 · 대로 진입(후보지마다) */
export const CAR_PARTS = { congestion: 0.4, efficiency: 0.4, access: 0.2 }

const ratioScore = (ref: number, value: number) => (value <= 0 ? 10 : Math.min(10, (10 * ref) / value))

/** 목적지 기준값: 대기(분)·정류장까지 도보(분)·환승(회)·차량 정체 배율(출퇴근 ÷ 여유). 이 값이면 10점. */
export type HubRef = { wait: number; access: number; transfers: number; carRatio: number }
/** 기본값 — 대기 5분·도보 3분은 이동 시간 추정의 최솟값, 환승 0회, 정체 배율 1.5(출퇴근이 한가할 때의 1.5배면 막힘이 적은 편) */
export const DEFAULT_REF: HubRef = { wait: 5, access: 3, transfers: 0, carRatio: 1.5 }
/** 주 목적지 권역별 기준값(나중에 미리 계산해 넣는다. 목적지 id → 기준값 일부) — 비어 있으면 DEFAULT_REF */
export const HUB_REF: Record<string, Partial<HubRef>> = {}
export const refOf = (hubId: string): HubRef => ({ ...DEFAULT_REF, ...HUB_REF[hubId] })

/** 거리 대비 기준 시간(분): 짧은 길은 신호·골목이라 느리고(시속 20km), 길어질수록 간선·고속도로로 빨라진다(시속 60km에 가까워짐).
 *  기준 시간 = 3분(출발·주차) + 도로 거리 ÷ 기준 속도(d) — 기준 속도 = 20 + 40 × (1 − e^(−d/15)) km/h */
export const refCarMin = (roadKm: number) => 3 + (60 * roadKm) / (20 + 40 * (1 - Math.exp(-roadKm / 15)))

export type CarParts = { congestion: number; efficiency: number; access: number | null }
export type ModeScores = {
  transit: number
  transitParts: { wait: number; access: number; transfers: number }
  car: number
  carParts: CarParts
  carRatio: number // 출퇴근 ÷ 여유
  walk: number | null // 30분 초과면 null
  bike: number | null // 40분 초과면 null
}

export function walkScore(minutes: number): number | null {
  if (minutes > WALK_LIMIT) return null
  return clamp((10 * (WALK_LIMIT - minutes)) / (WALK_LIMIT - 5), 0, 10) // 5분 이하 10점 → 30분 0점
}
export function bikeScore(minutes: number): number | null {
  if (minutes > BIKE_LIMIT) return null
  return clamp((10 * (BIKE_LIMIT - minutes)) / (BIKE_LIMIT - 10), 0, 10) // 10분 이하 10점 → 40분 0점
}

/** 차량 점수: 정체(출퇴근 ÷ 낮, 기준 배율이면 10점) · 거리 대비 효율(기준 시간 ÷ 평균 시간) · 대로 진입(후보지 자료, 없으면 빼고 나눔) */
export function carScores(t: Trip, ref: HubRef, accessScore: number | null): { car: number; carParts: CarParts; carRatio: number } {
  const carRatio = t.carRush / t.carFree
  const congestion = ratioScore(ref.carRatio, carRatio)
  const efficiency = Math.min(10, (10 * refCarMin(t.carKm)) / ((t.carRush + t.carFree) / 2))
  const parts: [number, number][] = [[congestion, CAR_PARTS.congestion], [efficiency, CAR_PARTS.efficiency]]
  if (accessScore !== null) parts.push([accessScore, CAR_PARTS.access])
  const sw = parts.reduce((a, [, w]) => a + w, 0)
  return { car: parts.reduce((a, [v, w]) => a + v * w, 0) / sw, carParts: { congestion, efficiency, access: accessScore }, carRatio }
}

/** 한 거점에 대해 모든 후보지의 수단별 점수(후보지 순서대로). */
export function modeScoresForHub(trips: Trip[], ref: HubRef = DEFAULT_REF, access: (number | null)[] = []): ModeScores[] {
  return trips.map((t, i) => {
    const parts = {
      wait: ratioScore(ref.wait, t.wait),
      access: ratioScore(ref.access, t.access),
      transfers: ratioScore(ref.transfers + 1, t.transfers + 1), // 0회도 나눌 수 있게 +1 (0회 10 · 1회 5 · 2회 3.3)
    }
    const transit = parts.wait * TRANSIT_PARTS.wait + parts.access * TRANSIT_PARTS.access + parts.transfers * TRANSIT_PARTS.transfers
    return { transit, transitParts: parts, ...carScores(t, ref, access[i] ?? null), walk: walkScore(t.walk), bike: bikeScore(t.bike) }
  })
}

/** 후보지의 대로 진입 점수(입지 요인 자료 places.json / 계산 서버) — 없으면 null */
export const accessOf = (c: Candidate): number | null => placeOf(c)?.access?.score ?? null // placeOf = 기본 후보지 places.json, 새 후보지는 계산 서버 결과

// ── 3. 가중치 → 거점 점수 → 후보지 종합 점수 ──────────────────────────
// 거점 점수 = 수단별 점수의 가중 평균(교통 선호도의 수단 가중치) — 목적지 이동수단을 정했으면 그 수단만.
// 종합 점수 = 거점 점수를 주 방문 횟수로 가중 평균. 모든 횟수가 0이면 거점을 똑같이 본다.

// transitPending = 대중교통 자료를 계산 서버에 묻는 중(검색으로 넣은 후보지) — 비워 두고 점수에서도 뺀다(걸어가는 transitSkipped 와 같은 계산)
// mode = 이 목적지 이동수단(auto = 섞음), used = 점수에 넣은 수단, main = 그중 가장 크게 반영된 수단(주요 교통수단)
export type HubResult = {
  hub: Hub; trip: Trip; scores: ModeScores; hubScore: number; share: number; weekly: number
  walkCounts: boolean; bikeCounts: boolean; transitSkipped: boolean; transitPending: boolean
  mode: HubMode; used: ModeKey[]; main: ModeKey
}
export type CandidateResult = { candidate: Candidate; hubs: HubResult[]; total: number; rank: number }

const modeValue = (s: ModeScores, k: ModeKey) => (k === 'walk' ? s.walk ?? 0 : k === 'bike' ? s.bike ?? 0 : s[k])

/**
 * 방문지 점수. walkCounts = 이 방문지에 30분 안에 걸어갈 수 있는 후보지가 하나라도 있는가(자전거도 같음, 40분).
 * - 있으면: 도보를 비교에 넣고, 30분을 넘는 후보지는 도보 0점(빼 버리면 못 걷는 후보지가 오히려 유리해진다).
 * - 없으면: 아무도 걸어갈 수 없으니 도보를 빼고 나머지 가중치만으로 다시 나눈다.
 * skipTransit = 이 후보지에서 도보 10분 이내(WALK_ONLY) — 걸어가니 대중교통을 빼고 나머지 가중치만으로 다시 나눈다.
 * mode 를 정했으면(auto 아님) 그 수단 점수가 곧 방문지 점수.
 */
export function hubScore(s: ModeScores, w: Preference['weights'], modes: ModeKey[], o: { walkCounts: boolean; bikeCounts: boolean; skipTransit: boolean; mode: HubMode }): { score: number; used: ModeKey[]; main: ModeKey } {
  if (o.mode !== 'auto') return { score: modeValue(s, o.mode), used: [o.mode], main: o.mode }
  const used = modes.filter((k) => !(k === 'transit' && o.skipTransit) && !(k === 'walk' && !o.walkCounts) && !(k === 'bike' && !o.bikeCounts))
  const sumW = used.reduce((a, k) => a + Math.max(0, w[k] ?? 0), 0)
  const score = sumW === 0 ? used.reduce((a, k) => a + modeValue(s, k), 0) / Math.max(1, used.length) : used.reduce((a, k) => a + modeValue(s, k) * Math.max(0, w[k] ?? 0), 0) / sumW
  // 주요 교통수단 = 점수에 가장 크게 반영된 수단(가중치 × 점수), 걸어서 10분 이내면 도보
  const main = o.skipTransit && used.includes('walk') ? 'walk' : [...used].sort((a, b) => modeValue(s, b) * (w[b] ?? 0) - modeValue(s, a) * (w[a] ?? 0))[0] ?? 'car'
  return { score, used, main }
}

export function evaluate(candidates: Candidate[], hubs: Hub[], pref: Preference): CandidateResult[] {
  const modes = activeModes(pref)
  const access = candidates.map(accessOf)
  const tripsByHub = hubs.map((hub) => candidates.map((c) => estimateTrip(c, hub)))
  const scoresByHub = tripsByHub.map((trips, hi) => modeScoresForHub(trips, refOf(hubs[hi].id), access))
  const walkCountsByHub = scoresByHub.map((list) => list.some((x) => x.walk !== null))
  const bikeCountsByHub = scoresByHub.map((list) => list.some((x) => x.bike !== null))
  const raw = hubs.map((h) => Math.max(0, pref.weekly[h.id] ?? 0))
  const sum = raw.reduce((a, b) => a + b, 0)
  const shares = raw.map((t) => (sum > 0 ? t / sum : 1 / hubs.length))
  const results = candidates.map((candidate, ci) => {
    const hubResults = hubs.map((hub, hi): HubResult => {
      const scores = scoresByHub[hi][ci]
      const trip = tripsByHub[hi][ci]
      // 새 후보지는 계산 서버가 길을 답하기 전까지 대중교통을 비운다(답했는데 경로가 없으면 추정으로)
      const transitPending = !isDefaultCandidate(candidate) && !livePaths(candidate, hub)
      const mode = (pref.hubMode?.[hub.id] ?? 'auto') as HubMode
      const usable: HubMode = mode === 'bike' && !pref.bike ? 'auto' : mode
      const transitSkipped = usable === 'auto' && trip.walk <= WALK_ONLY
      const h = hubScore(scores, pref.weights, modes, { walkCounts: walkCountsByHub[hi], bikeCounts: bikeCountsByHub[hi], skipTransit: transitSkipped || transitPending, mode: usable === 'transit' && transitPending ? 'auto' : usable })
      return { hub, trip, scores, hubScore: h.score, share: shares[hi], weekly: raw[hi], walkCounts: walkCountsByHub[hi], bikeCounts: bikeCountsByHub[hi], transitSkipped, transitPending, mode: usable, used: h.used, main: h.main }
    })
    const total = hubResults.reduce((a, r) => a + r.hubScore * r.share, 0)
    return { candidate, hubs: hubResults, total, rank: 0 }
  })
  const order = [...results].sort((a, b) => b.total - a.total)
  order.forEach((r, i) => { r.rank = i + 1 })
  return results
}

/** 카드 비율 표시용(합 100) */
export const shareOf = (pref: Preference) => weightShares(pref.weights, activeModes(pref))
/** 주 방문 → 월 왕복 */
export const monthlyOf = (weekly: number) => weekly * WEEKS_PER_MONTH

export const fmt = (x: number) => (Math.round(x * 10) / 10).toFixed(1)

// ── 4. 지도에 쓰는 장단점 문구 ─────────────────────────────────────────
// 같은 목적지를 두고 후보지끼리 비교해, 눈에 띄게 좋은 점(최고)과 나쁜 점(최하·불가)을 짧게 뽑는다.
// 모든 후보지가 같은 값이면 그 항목은 말하지 않는다(차이가 없으니 장점도 단점도 아님).

export type Insight = { pros: string[]; cons: string[]; rank?: number; of?: number } // rank = 이 목적지 기준 순위
const GAP = 1.0 // 최하를 단점으로 말하려면 최고와 이만큼(점) 이상 차이 나야 한다

export function hubInsights(results: CandidateResult[], hubIndex: number): Insight[] {
  const out: Insight[] = results.map(() => ({ pros: [], cons: [] }))
  if (results.length < 2) return out
  const rows = results.map((r) => r.hubs[hubIndex])
  if (rows.some((x) => !x)) return out
  const order = rows.map((h, i) => ({ s: h.hubScore, i })).sort((a, b) => b.s - a.s)
  order.forEach((x, k) => { out[x.i].rank = k + 1; out[x.i].of = rows.length })
  const pick = (f: (h: HubResult) => number | null) => rows.map(f)
  const extremes = (vals: (number | null)[]) => {
    const v = vals.filter((x): x is number => x !== null)
    return { max: Math.max(...v), min: Math.min(...v), same: v.length < 2 || Math.max(...v) - Math.min(...v) < 1e-9 }
  }
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-9

  // 도보: 10분 안이면 "도보권" / 남들은 걸어가는데 30분을 넘는 곳
  const walkable = pick((h) => (h.scores.walk !== null ? h.trip.walk : null)).filter((x) => x !== null)
  // 대중교통·차량 점수
  const transit = extremes(pick((h) => (h.transitPending ? null : h.scores.transit)))
  const car = extremes(pick((h) => h.scores.car))
  const transfers = extremes(pick((h) => (h.transitPending ? null : h.trip.transfers)))
  const waits = extremes(pick((h) => (h.transitPending ? null : h.trip.wait)))

  rows.forEach((h, i) => {
    const o = out[i]
    if (h.trip.walk <= WALK_ZONE) o.pros.push(`도보권 ${h.trip.walk}분`)
    // 도보 10분 이내면 대중교통은 따지지 않는다(점수에서도 뺌)
    if (!(h.transitSkipped || h.transitPending) && !transit.same && near(h.scores.transit, transit.max)) o.pros.push('대중교통 최적')
    if (!car.same && near(h.scores.car, car.max)) o.pros.push('차량 이동 최적')
    if (!(h.transitSkipped || h.transitPending) && !transfers.same && h.trip.transfers === 0) o.pros.push('환승 없음')
    if (!(h.transitSkipped || h.transitPending) && !waits.same && near(h.trip.wait, waits.min) && o.pros.length < 2) o.pros.push(`대기 최소 ${h.trip.wait}분`)

    if (h.scores.walk === null && walkable.length > 0) o.cons.push(`도보 ${WALK_LIMIT}분 초과`)
    if (!(h.transitSkipped || h.transitPending) && !transit.same && near(h.scores.transit, transit.min) && transit.max - transit.min >= GAP) o.cons.push('대중교통 불리')
    if (!car.same && near(h.scores.car, car.min) && car.max - car.min >= GAP) o.cons.push(`출퇴근 정체 ${(h.trip.carRush / h.trip.carFree).toFixed(1)}배`)
    if (!(h.transitSkipped || h.transitPending) && !transfers.same && h.trip.transfers === transfers.max && h.trip.transfers > 0) o.cons.push(`환승 ${h.trip.transfers}회`)
    o.pros = o.pros.slice(0, 3)
    o.cons = o.cons.slice(0, 2)
  })
  return out
}
