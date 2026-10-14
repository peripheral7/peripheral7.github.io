// 길 찾기 공용 함수 — scripts/fetch-paths.mjs(기본 후보지)와 server/analyze-server.mjs(검색으로 넣은 후보지)가 같이 쓴다.
//
// 1) 도보·자전거: OSM 길(보행로·자전거 길)을 따라간 거리 — FOSSGIS 의 공개 OSRM(routing.openstreetmap.de, foot·bike 프로필).
//    시간은 거리로만 계산한다(도보 시속 4.7km · 자전거 시속 15km — scoring.ts 와 같은 값). OSRM 이 주는 시간은 쓰지 않는다
//    (도보 프로필은 계단·횡단보도 가중이 들어가 시간이 들쭉날쭉하다).
// 2) 대중교통: 서울특별시 「대중교통환승경로 조회」(ws.bus.go.kr pathinfo getPathInfoByBusNSub = 버스+지하철) — 경기도 구간도 나온다.
//    응답의 time = 문 앞에서 문 앞까지 전체 시간(분)으로 본다(1.5km 버스 구간 + 정류장 도보 400m 에 21분 — 탑승만으로는 너무 길다).
//    그 안을 나눠 보이려고 정류장까지·정류장에서 걷는 시간(직선 × 1.25 ÷ 시속 4.7km)과 첫 대기(추정)를 빼고 남은 것을 탑승·환승으로 둔다.
//    일부 구간(예: 수원 → 분당)은 서버가 "XML Parsing Error"를 돌려준다 — 그때는 null(앱은 거리 추정으로 "추정" 표시).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
export const ENV = {}
for (const l of (fs.existsSync(path.join(ROOT, '.env.local')) ? fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8') : '').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
  if (m && m[2] && !(m[1] in ENV)) ENV[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

export const WALK_KMH = 4.7
export const BIKE_KMH = 15
const OSRM = { foot: 'https://routing.openstreetmap.de/routed-foot', bike: 'https://routing.openstreetmap.de/routed-bike' }
const R = 6371
const rad = (d) => (d * Math.PI) / 180
export const km = (a, b) => { const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]); const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** OSM 길 거리(km) — 실패하면 null */
async function osrmKm(profile, from, to) {
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(`${OSRM[profile]}/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=false`, { headers: { 'User-Agent': 'peripheral7-location-compare/1.0' }, signal: AbortSignal.timeout(20000) })
      const j = await r.json()
      if (j.code === 'Ok' && j.routes?.[0]) return Math.round(j.routes[0].distance / 10) / 100
    } catch { /* 한 번 더 */ }
    await sleep(800)
  }
  return null
}

/** 도보·자전거: { walk: { km, min }, bike: { km, min } } (OSM 길 거리, 못 받으면 그 칸 없음) */
export async function walkBike(from, to) {
  const out = {}
  const w = await osrmKm('foot', from, to)
  if (w !== null) out.walk = { km: w, min: Math.max(1, Math.round((w / WALK_KMH) * 60)) }
  await sleep(300)
  const b = await osrmKm('bike', from, to)
  if (b !== null) out.bike = { km: b, min: Math.max(1, Math.round((b / BIKE_KMH) * 60)) }
  return out
}

/** 첫 대기(분) 추정 — scoring.ts estimateTrip 과 같은 식(기본 5분 + 거리 6km마다 1분, 최대 +7) */
const waitOf = (d) => 5 + Math.min(7, Math.round(d / 6))

/** 대중교통 한 경로: { min(전체), ride, access, egress, wait, transfers, routes[], first, last } 또는 null */
export async function transitPath(from, to) {
  const key = ENV.SEOUL_PATHINFO_SERVICE_KEY || ENV.DATA_GO_KR_SERVICE_KEY
  if (!key) return null
  const u = `http://ws.bus.go.kr/api/rest/pathinfo/getPathInfoByBusNSub?serviceKey=${encodeURIComponent(key)}&startX=${from[1]}&startY=${from[0]}&endX=${to[1]}&endY=${to[0]}&resultType=json`
  let j = null
  for (let i = 0; i < 2 && !j; i++) {
    try { j = await (await fetch(u, { signal: AbortSignal.timeout(20000) })).json() } catch { await sleep(800) }
  }
  const items = j?.msgBody?.itemList
  if (!Array.isArray(items) || !items.length) return null
  const d = km(from, to)
  const best = items.map((it) => {
    const segs = it.pathList ?? []
    if (!segs.length) return null
    const first = segs[0], last = segs[segs.length - 1]
    const walkMin = (a, b) => Math.max(1, Math.round(((km(a, b) * 1.25) / WALK_KMH) * 60))
    const access = walkMin(from, [+first.fy, +first.fx])
    const egress = walkMin([+last.ty, +last.tx], to)
    const total = Number(it.time) || 0
    const wait = waitOf(d)
    const ride = Math.max(2, total - access - egress - wait)
    const transfers = Math.max(0, segs.length - 1)
    return { min: Math.max(total, access + wait + ride + egress), ride, access, egress, wait, transfers, routes: segs.map((s) => s.routeNm), first: first.fname, last: last.tname }
  }).filter(Boolean).sort((a, b) => a.min - b.min)[0]
  return best ?? null
}

/** 한 쌍 전부(도보·자전거·대중교통) + 잰 시각 */
export async function measurePaths(from, to) {
  const wb = await walkBike(from, to)
  const transit = await transitPath(from, to)
  return { ...wb, transit, at: new Date().toLocaleString('sv-SE').slice(0, 16) }
}
