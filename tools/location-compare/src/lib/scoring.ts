// 원본 앱 백엔드(backend/main.py)의 "이동 접근성" 계산을 브라우저용으로 그대로 옮긴 것.
// 블로그(GitHub Pages)에는 서버가 없어서 같은 계산을 여기서 한다. 숫자가 서버 버전과 어긋나지 않도록
// 공식과 순서는 한 줄씩 맞추고, 파이썬의 반올림(round)·합계(sum) 규칙도 똑같이 흉내 낸다.
// 원본 앱을 고친 뒤에는 이 파일의 공식도 같이 맞춰야 한다(README 참고).
import type { Home, Hub, MobilityPreference, RouteSummary } from '../types'

export type HomeRow = Omit<Home, 'overall'> & { created_at?: string }
export type HubRow = Hub & { display_order?: number; created_at?: string }
export type Profile = {
  km: number; walk: number; bike: number; station_access: number; wait: number
  transit: number; car_day: number; car_rush: number; transfers: number; transit_quality: number
}

// 파이썬 round(): 가장 가까운 값으로, 정확히 중간이면 짝수 쪽(예: round(0.5)=0, round(2.5)=2, round(83.25,1)=83.2).
// 자바스크립트의 Math.round 는 중간값을 올려서(83.3) 점수가 0.1씩 어긋날 수 있다.
// toFixed 는 이진수의 정확한 값을 기준으로 반올림(동률만 위로)하므로, 정확한 동률일 때만 따로 처리한다.
export function pyRound(x: number, nd = 0): number {
  if (!Number.isFinite(x)) return x
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  if (nd === 0) {
    const fl = Math.floor(ax)
    const diff = ax - fl // 뺄셈은 오차 없이 정확하다
    const r = diff > 0.5 ? fl + 1 : diff < 0.5 ? fl : fl % 2 === 0 ? fl : fl + 1
    return r === 0 ? 0 : sign * r
  }
  if (nd === 1) {
    const q = ax * 4 // 2의 거듭제곱 곱이라 정확하다
    if (Number.isInteger(q) && q % 2 === 1) {
      // x 가 정확히 n.25 또는 n.75 → 소수 첫째 자리에서 동률. 정확한 k+0.5 라서 floor 도 정확하다.
      const k = Math.floor(ax * 10)
      return sign * ((k % 2 === 0 ? k : k + 1) / 10)
    }
  }
  return Number(x.toFixed(nd))
}

// 파이썬 3.12 이상의 sum() 은 실수를 더할 때 Neumaier 보정 합계를 쓴다(그냥 더한 값과 끝자리가 다를 수 있다).
export function pySum(values: number[]): number {
  let result = 0
  let c = 0
  for (const x of values) {
    const t = result + x
    if (Math.abs(result) >= Math.abs(x)) c += (result - t) + x
    else c += (x - t) + result
    result = t
  }
  if (c && Number.isFinite(c)) result += c
  return result
}

const DEG = Math.PI / 180 // math.radians 와 같은 곱셈 순서

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radius = 6371
  const dLat = (lat2 - lat1) * DEG
  const dLng = (lng2 - lng1) * DEG
  const s1 = Math.sin(dLat / 2)
  const s2 = Math.sin(dLng / 2)
  const a = s1 * s1 + Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * s2 * s2
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 좌표 거리 하나에서 도보·자전거·대중교통·차량 시간을 "가상으로" 추정한다(외부 길찾기 없음).
export function transitProfile(home: { lat: number; lng: number }, hub: { lat: number; lng: number }): Profile {
  const km = distanceKm(home.lat, home.lng, hub.lat, hub.lng)
  const walk = Math.max(3, pyRound(km / 4.7 * 60))
  const bike = Math.max(2, pyRound(km / 14 * 60))
  const stationAccess = Math.max(3, Math.min(18, pyRound(4 + km * 0.7)))
  const wait = 5 + Math.min(7, pyRound(km / 6))
  const subwayMinutes = Math.max(5, pyRound(km / 38 * 60))
  const busMinutes = Math.max(6, pyRound(km / 23 * 60))
  const transfers = km > 6 ? 1 : 0
  const transferMinutes = transfers * 5
  const transit = Math.max(8, stationAccess + subwayMinutes + busMinutes + wait + transferMinutes)
  const carDay = Math.max(5, pyRound(km / 31 * 60 + 3))
  const carRush = Math.max(7, pyRound(carDay * 1.52 + 4))
  const transitQuality = 100 - (transit * 0.72) - (stationAccess * 1.15) - (transfers * 10)
  return { km, walk, bike, station_access: stationAccess, wait, transit, car_day: carDay, car_rush: carRush, transfers, transit_quality: transitQuality }
}

export function rawMonthlyRoundtrips(preference: MobilityPreference, hubId: number): number {
  const frequencies = preference.hub_monthly_roundtrips || {}
  return Math.max(0, Math.trunc(Number(frequencies[String(hubId)] ?? 0)))
}

export function effectiveMonthlyWeight(preference: MobilityPreference, hubId: number): number {
  const frequencies = preference.hub_monthly_roundtrips || {}
  // 아직 어떤 횟수도 저장하지 않은 초기 상태에서는 모든 거점을 동일 비중 1로 계산한다.
  if (Object.keys(frequencies).length === 0) return 1
  // 입력 후에는 0회는 0으로 제외하고, 2회 이상은 횟수의 1.25제곱으로 선형 비례보다 크게 반영한다.
  const frequency = rawMonthlyRoundtrips(preference, hubId)
  return frequency ? pyRound(Math.pow(frequency, 1.25), 4) : 0
}

// 다른 후보지보다 "압도적으로" 가까운 이동수단을 찾아 ★ 표시용 문구로 만든다.
export function dominantMobilityLabels(current: Profile, profiles: Profile[]): string[] {
  const labels: string[] = []
  const checks: [string, 'walk' | 'car_day' | 'transit', number][] = [['도보', 'walk', 5], ['차량', 'car_day', 4], ['대중교통', 'transit', 6]]
  for (const [label, key, minimumGap] of checks) {
    const values = profiles.map((p) => p[key]).sort((a, b) => a - b)
    if (values.length < 2) continue
    const cur = current[key]
    const best = values[0]
    const runnerUp = values[1]
    if (cur === best && cur < runnerUp * 0.72 && runnerUp - cur >= minimumGap) labels.push(`${label} ${cur}분`)
  }
  return labels
}

const logScore = (minutes: number, baseline: number, spread: number) =>
  Math.max(1.0, Math.min(10.0, 8.0 - spread * Math.log2(Math.max(minutes, 1) / baseline)))

// 원본은 외부 대중교통 API 응답(정류장·노선)이 있으면 상세 문구에 넣지만, 이 앱의 화면은 그 문구를 쓰지 않는다.
// 응답이 없을 때의 문구와 똑같이 맞춰 둔다.
const NO_POI_STATION = '실데이터 정류장 정보 없음'
const NO_POI_LANE = '응답에 정류장 좌표·노선 정보가 없습니다'

export function travelSummary(home: HomeRow, hub: HubRow, preference: MobilityPreference, deviation: number, proximityHighlights: string[]): RouteSummary {
  const profile = transitProfile(home, hub)
  const { km, walk, bike } = profile
  const { wait, transit, car_day: carDay, car_rush: carRush, transfers } = profile
  const rawFrequency = rawMonthlyRoundtrips(preference, hub.id)
  const calculationWeight = effectiveMonthlyWeight(preference, hub.id)
  // 이동 접근성 점수 가이드(원본과 동일)
  // 1) 거리 자체는 점수에 직접 쓰지 않고, 거리로부터 계산된 실제 소요시간만 사용한다.
  // 2) 도보는 15분 기준 log2(도보시간/15) — 짧으면 가점, 길면 보행 부담 감점.
  // 3) 차량 혼잡은 출퇴근/여유시간 비율의 로그값만큼 감점한다.
  // 4) 대중교통/차량 여유시간 비율을 2.5배 기준으로 비교한다(짧으면 가점, 길면 로그형 감점).
  // 5) 모든 항목은 10점 만점으로 제한하며, 월 왕복 횟수는 후보지의 최종 가중평균에만 반영한다.
  const transitTimeScore = logScore(transit, 32, 2.15)
  const carTimeScore = logScore(carDay, 18, 2.35)
  const walkTimeScore = logScore(walk, 15, 2.8)
  const preferenceScores: Record<string, number> = { '대중교통': transitTimeScore, '차량': carTimeScore, '도보·자전거': walkTimeScore }
  const known = (mode: string) => Object.prototype.hasOwnProperty.call(preferenceScores, mode)
  let baseScore: number
  let scoreBasis: string
  if ((preference.transit_priority_hub_ids || []).includes(hub.id)) {
    baseScore = transitTimeScore
    scoreBasis = '대중교통 우선 기준'
  } else {
    const primary = (preference.primary_modes || []).filter(known)
    const secondary = (preference.secondary_modes || []).filter(known)
    const weighted: [number, number][] = []
    if (primary.length) for (const mode of primary) weighted.push([preferenceScores[mode], 0.8 / primary.length])
    if (secondary.length) for (const mode of secondary) weighted.push([preferenceScores[mode], 0.2 / secondary.length])
    const preferenceScore = weighted.length ? weighted.reduce((sum, [value, weight]) => sum + value * weight, 0) : transitTimeScore
    // 30분 이내 도보권은 실제 생활 이동 편의를 우선 반영한다.
    baseScore = Math.max(preferenceScore, walk <= 30 ? walkTimeScore : 0)
    scoreBasis = '선호 이동수단·실제 소요시간 기준'
  }
  const walkAdjustment = Math.max(-2.8, Math.min(3.8, -2.1 * Math.log2(walk / 15)))
  const congestionPenalty = Math.max(0.0, Math.min(2.8, 2.15 * Math.log2(carRush / Math.max(carDay, 1))))
  const transitCarRatio = transit / Math.max(carDay * 2.5, 1)
  const transitGapAdjustment = Math.max(-2.6, Math.min(2.0, -1.45 * Math.log2(transitCarRatio)))
  const accessibilityScore = Math.max(0.0, Math.min(10.0, pyRound(baseScore + walkAdjustment + transitGapAdjustment - congestionPenalty, 1)))
  const transitScore = Math.max(0.0, Math.min(10.0, pyRound(transitTimeScore + transitGapAdjustment, 1)))
  const mode = km > 4 ? '지하철 + 버스' : '버스'
  const detail = `${mode} · ${NO_POI_STATION} · ${NO_POI_LANE} · 대기 약 ${wait}분`
  return {
    hub_id: hub.id, hub_name: hub.name, hub_address: hub.address, hub_lat: hub.lat, hub_lng: hub.lng,
    category: hub.category, monthly_roundtrips: rawFrequency, calculation_weight: calculationWeight, hub_weight_multiplier: 1,
    distance_km: pyRound(km, 1), transit_minutes: transit, transit_score: transitScore,
    accessibility_score: accessibilityScore, score_basis: scoreBasis,
    transit_mode: mode, transit_detail: detail, wait_minutes: wait, transfer_count: transfers,
    station_access_minutes: profile.station_access, score_deviation: pyRound(deviation, 1),
    proximity_highlights: proximityHighlights,
    car_rush_minutes: carRush, car_day_minutes: carDay,
    walk_minutes: walk <= 30 ? walk : null, bike_minutes: bike <= 30 ? bike : null,
  }
}

// 거점 정렬: 학교 → 직장 → 본가 → 환승역 → 그 밖, 같은 종류 안에서는 표시 순서·번호 순.
export const hubRank = (category: string) => ({ '학교': 10, '직장': 20, '본가': 30, '환승역': 40 } as Record<string, number>)[category] ?? 50
export const sortHubs = (hubs: HubRow[]) =>
  [...hubs].sort((a, b) => hubRank(a.category) - hubRank(b.category) || (a.display_order ?? 999) - (b.display_order ?? 999) || a.id - b.id)

const codePointCompare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export function overallScore(row: { transport: number; commerce: number; park: number; public: number }): number {
  return pyRound((row.transport + row.commerce + row.park + row.public) / 4, 1)
}

export type AccessibilityResult = {
  home: Home
  routes: RouteSummary[]
  mobility_score: number | null
  preferences: MobilityPreference
  calculation_note: string
}

// GET /api/accessibility/{home_id} 와 같은 결과.
// homes = 비교 대상으로 선택된 후보 전체(번호순), hubs = 정렬된 거점 전체.
export function computeAccessibility(home: HomeRow, homes: HomeRow[], hubs: HubRow[], preference: MobilityPreference): AccessibilityResult {
  const routes: RouteSummary[] = []
  for (const hub of hubs) {
    const profiles = homes.map((candidate) => transitProfile(candidate, hub))
    const qualities = profiles.map((p) => p.transit_quality)
    const meanQuality = qualities.length ? pySum(qualities) / qualities.length : 0
    const deviation = qualities.length ? Math.sqrt(pySum(qualities.map((q) => (q - meanQuality) * (q - meanQuality))) / qualities.length) : 0
    const currentProfile = transitProfile(home, hub)
    const proximityHighlights = dominantMobilityLabels(currentProfile, profiles)
    routes.push(travelSummary(home, hub, preference, deviation, proximityHighlights))
  }
  routes.sort((a, b) => (b.monthly_roundtrips - a.monthly_roundtrips) || (b.accessibility_score - a.accessibility_score) || codePointCompare(a.hub_name, b.hub_name))
  // 횟수 입력 전에는 모든 거점의 기본 비중을 1로, 입력 후에는 월 왕복 횟수 그대로 반영한다.
  const routeWeights = routes.map((route) => route.calculation_weight)
  const totalWeight = pySum(routeWeights)
  const mobilityScore = totalWeight
    ? pyRound(pySum(routes.map((route, i) => route.accessibility_score * routeWeights[i])) / totalWeight, 1)
    : routes.length ? 0 : null
  return {
    home: { ...home, overall: overallScore(home), selected: Boolean(home.selected) },
    routes,
    mobility_score: mobilityScore,
    preferences: preference,
    calculation_note: '외부 길찾기 없이 좌표 거리와 고정 평균속도를 반영한 가상 추정 결과입니다.',
  }
}
