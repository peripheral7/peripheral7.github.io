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

// ── 대중교통 경로 그림(legs) — 지도에 도보는 점선, 버스·지하철은 노선 색 선, 정류장·역은 점 ──
// 자료 출처·한계는 TRANSIT.md. 요약:
//  - 정류장·역 이름과 좌표, 노선 이름 = 서울시 환승경로 응답(pathList 의 fname/fx/fy · tname/tx/ty · routeNm · routeId)
//  - 버스 종류(색) = 경기도 「정류소 경유노선 목록」(busstationservice v2 getBusStationViaRouteListv2 의 routeTypeCd) — 경기 정류장에서 탄 노선.
//    서울 버스(노선 ID 가 1 로 시작)나 조회 실패면 노선 번호 모양으로 짐작(서울 3자리 = 간선, 4자리 = 지선, 9xxx = 광역 …).
//  - 선 모양 = 버스: 경기도 「버스노선 조회」(busrouteservice v2)의 노선 궤적(getBusRouteLineListv2)에서 탄 정류장 ~ 내린 정류장 구간만 잘라 쓴다
//              (정류장 순서 getBusRouteStationListv2 를 궤적 점에 순서대로 맞춰 자름 — sliceRoute). 경기 노선이 아니거나(서울 버스) 실패하면
//              OSM 도로 길찾기(routing.openstreetmap.de car)로 두 정류장을 이은 근사선(approx),
//              지하철: 두 역을 잇는 직선(역 사이 좌표가 응답에 없음), 도보: OSM 보행 길찾기(foot) 선.
//  - 정류장까지·정류장에서 걷는 시간 = OSM 보행 길 거리 ÷ 시속 4.7km(실패하면 직선 × 1.25).
const r5 = (x) => Math.round(x * 1e5) / 1e5
/** 노선 색(지도 표시용 — 버스 차체 색에 맞춘 대표색) */
export const BUS_TYPES = {
  trunk: { label: '간선', color: '#3d5bab' }, // 서울 파랑
  branch: { label: '지선', color: '#3fa535' }, // 서울 초록
  circle: { label: '순환', color: '#f2a900' }, // 서울 노랑
  wide: { label: '광역·직행좌석', color: '#e60012' }, // 빨강(서울 광역, 경기 직행좌석·광역급행)
  seat: { label: '좌석', color: '#0068b7' }, // 경기 좌석 파랑
  city: { label: '일반', color: '#2fa84f' }, // 경기 일반 시내 초록
  village: { label: '마을', color: '#8cc63f' }, // 마을 연두
  night: { label: '심야', color: '#26346b' }, // 서울 N버스 남색
  airport: { label: '공항', color: '#7a5c3e' },
  intercity: { label: '시외', color: '#7b4fa0' },
  other: { label: '버스', color: '#5a6b7a' },
}
/** 경기도 routeTypeCd → 종류(경기도 버스정보 API 코드표) */
const GG_TYPE = { 11: 'wide', 12: 'seat', 13: 'city', 14: 'wide', 15: 'city', 16: 'wide', 21: 'wide', 22: 'seat', 23: 'city', 30: 'village', 41: 'intercity', 42: 'intercity', 43: 'intercity', 51: 'airport', 52: 'airport', 53: 'airport' }
/** 지하철 노선 색(수도권 전철 공식 색) */
const SUBWAY_COLORS = {
  '1호선': '#0052a4', '2호선': '#00a84d', '3호선': '#ef7c1c', '4호선': '#00a5de', '5호선': '#996cac', '6호선': '#cd7c2f', '7호선': '#747f00', '8호선': '#e6186c', '9호선': '#bdb092',
  '경의중앙선': '#77c4a3', '수인분당선': '#fabe00', '분당선': '#fabe00', '수인선': '#fabe00', '신분당선': '#d4003b', '경춘선': '#0c8e72', '공항철도': '#0090d2', '경강선': '#0054a6',
  '우이신설선': '#b0ce18', '신림선': '#6789ca', '서해선': '#81a914', '김포골드라인': '#a17800', '에버라인': '#56ad2d', '용인경전철': '#56ad2d', '의정부경전철': '#fda600', 'GTX-A': '#9a6292',
}
const subwayColor = (name) => SUBWAY_COLORS[name] ?? Object.entries(SUBWAY_COLORS).find(([k]) => name.includes(k.replace('선', '')))?.[1] ?? '#5a6b7a'

/** 경기 노선 궤적 + 정류장 순서(노선마다 한 번만 묻는다): { line: [[위도, 경도]…], stations: [{ id, lat, lng }…](순서대로) } 또는 null */
const ggRouteCache = new Map()
async function ggRouteGeom(routeId) {
  const key = ENV.GG_BUS_ROUTE_SERVICE_KEY || ENV.DATA_GO_KR_SERVICE_KEY
  if (!key || !routeId) return null
  if (!ggRouteCache.has(routeId)) {
    let geom = null
    try {
      const get = async (op) => {
        const u = `https://apis.data.go.kr/6410000/busrouteservice/v2/${op}?serviceKey=${encodeURIComponent(key)}&routeId=${routeId}&format=json`
        return (await (await fetch(u, { signal: AbortSignal.timeout(20000) })).json())?.response?.msgBody
      }
      const l = (await get('getBusRouteLineListv2'))?.busRouteLineList
      const s = (await get('getBusRouteStationListv2'))?.busRouteStationList
      const arr = (x) => (Array.isArray(x) ? x : x ? [x] : [])
      const line = arr(l).sort((p, q) => p.lineSeq - q.lineSeq).map((p) => [+p.y, +p.x])
      const stations = arr(s).sort((p, q) => p.stationSeq - q.stationSeq).map((p) => ({ id: String(p.stationId), lat: +p.y, lng: +p.x }))
      if (line.length >= 2 && stations.length >= 2) geom = { line, stations }
    } catch { geom = null }
    ggRouteCache.set(routeId, geom)
  }
  return ggRouteCache.get(routeId)
}
/** 정류장(순서대로)을 궤적 점에 하나씩, 순서를 지키며 거리 합이 가장 작게 맞춘다(동적 계획법) → 정류장마다 궤적 점 번호 */
function matchStations(stations, line) {
  const N = stations.length, M = line.length, c = Math.cos(rad(line[0][0]))
  const d2 = (s, p) => { const dy = (s.lat - p[0]) * 110540, dx = (s.lng - p[1]) * 111320 * c; return dy * dy + dx * dx }
  const back = Array.from({ length: N }, () => new Int32Array(M))
  let prev = new Float64Array(M)
  for (let j = 0; j < M; j++) prev[j] = Math.sqrt(d2(stations[0], line[j]))
  for (let k = 1; k < N; k++) {
    const cur = new Float64Array(M)
    let best = Infinity, bi = 0
    for (let j = 0; j < M; j++) {
      if (prev[j] < best) { best = prev[j]; bi = j } // 앞 정류장은 j 이하 어디든(같은 점도 허용)
      cur[j] = best + Math.sqrt(d2(stations[k], line[j]))
      back[k][j] = bi
    }
    prev = cur
  }
  let j = 0
  for (let x = 1; x < M; x++) if (prev[x] < prev[j]) j = x
  const idx = new Array(N)
  for (let k = N - 1; k >= 0; k--) { idx[k] = j; if (k) j = back[k][j] }
  return idx
}
/** 탄 정류장(fid) ~ 내린 정류장(tid) 구간의 실제 노선 선 — 못 자르면 null */
function sliceRoute(geom, fid, tid, a, b) {
  const st = geom.stations
  const bi = st.findIndex((s) => s.id === String(fid))
  const ai = bi < 0 ? -1 : st.findIndex((s, k) => k > bi && s.id === String(tid))
  if (ai < 0) return null
  geom.idx ??= matchStations(st, geom.line)
  const i0 = geom.idx[bi], i1 = geom.idx[ai]
  if (i1 < i0) return null
  const pts = [a, ...geom.line.slice(i0, i1 + 1), b]
  // 이상하게 잘렸는지(직선의 5배 + 2km 보다 길면 버린다)
  let len = 0
  for (let i = 1; i < pts.length; i++) len += km(pts[i - 1], pts[i])
  if (len > km(a, b) * 5 + 2) return null
  return simplify(pts, 5)
}

/** 경기 정류장에 서는 노선 → 종류(정류장마다 한 번만 묻는다) */
const ggStationCache = new Map()
async function ggRouteType(stationId, routeId) {
  const key = ENV.GG_BUS_STATION_SERVICE_KEY || ENV.DATA_GO_KR_SERVICE_KEY
  if (!key || !stationId || !routeId) return null
  if (!ggStationCache.has(stationId)) {
    let list = null
    try {
      const u = `https://apis.data.go.kr/6410000/busstationservice/v2/getBusStationViaRouteListv2?serviceKey=${encodeURIComponent(key)}&stationId=${stationId}&format=json`
      const j = await (await fetch(u, { signal: AbortSignal.timeout(15000) })).json()
      const l = j?.response?.msgBody?.busRouteList
      list = Array.isArray(l) ? l : l ? [l] : []
    } catch { list = null }
    ggStationCache.set(stationId, list)
  }
  const hit = ggStationCache.get(stationId)?.find((r) => String(r.routeId) === String(routeId))
  return hit ? { type: GG_TYPE[hit.routeTypeCd] ?? 'other', typeName: hit.routeTypeName, name: String(hit.routeName) } : null
}
/** 번호 모양으로 짐작(서울 기준; 경기는 응답에 지역 이름이 붙어 온다 — "1550-1오산") */
function guessBusType(name, seoul) {
  const n = cleanName(name)
  if (/^N/i.test(n)) return 'night'
  if (/^[MG]\d/i.test(n)) return 'wide'
  if (/^[가-힣]+\d/.test(n)) return 'village' // 마포08 · 강남01
  if (/^6\d{3}/.test(n)) return 'airport'
  if (seoul) {
    if (/^9\d{3}/.test(n)) return 'wide'
    if (/^\d{4}/.test(n)) return 'branch'
    if (/^\d{3}/.test(n)) return 'trunk'
    if (/^\d{2}$/.test(n)) return 'circle'
    return 'other'
  }
  if (/^[1-9]\d{3}/.test(n)) return 'wide' // 경기 4자리(1xxx·3xxx·5xxx·7xxx·8xxx) = 대부분 직행좌석·광역
  return 'city'
}
const cleanName = (name) => name.replace(/(수원|용인|오산|성남|예수원|화성|안양|부천|고양|김포|광주|하남|남양주|의정부|파주|시흥|안산|군포|의왕|과천|평택|이천|여주|양주|구리|광명|인천)$/, '')

/** 점 줄이기(Douglas–Peucker, 허용 오차 m) — 저장 크기를 줄인다 */
function simplify(pts, tolM = 8) {
  if (pts.length <= 2) return pts
  const toXY = (p) => [p[1] * 111320 * Math.cos(rad(pts[0][0])), p[0] * 110540]
  const xy = pts.map(toXY)
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    let best = -1, bi = -1
    const [ax, ay] = xy[a], [bx, by] = xy[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * xy[i][0] - dx * xy[i][1] + bx * ay - by * ax) / L; if (d > best) { best = d; bi = i } }
    if (best > tolM) { keep[bi] = 1; stack.push([a, bi], [bi, b]) }
  }
  return pts.filter((_, i) => keep[i]).map((p) => [r5(p[0]), r5(p[1])])
}
/** OSM 길찾기 선: { km, line } — 실패하면 null */
async function osrmLine(profile, a, b) {
  const base = { foot: OSRM.foot, car: 'https://routing.openstreetmap.de/routed-car' }[profile]
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(`${base}/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`, { headers: { 'User-Agent': 'peripheral7-location-compare/1.0' }, signal: AbortSignal.timeout(20000) })
      const j = await r.json()
      const g = j.code === 'Ok' && j.routes?.[0]
      if (g) return { km: g.distance / 1000, line: simplify([a, ...g.geometry.coordinates.map(([x, y]) => [y, x]), b]) }
    } catch { /* 한 번 더 */ }
    await sleep(800)
  }
  return null
}
/** 걷는 구간: 시간(분)·거리(m)·선 */
async function walkLeg(a, b) {
  const o = await osrmLine('foot', a, b)
  await sleep(250)
  const kmv = o ? o.km : km(a, b) * 1.25
  return { mode: 'walk', min: Math.max(1, Math.round((kmv / WALK_KMH) * 60)), m: Math.round(kmv * 1000), line: o ? o.line : [[r5(a[0]), r5(a[1])], [r5(b[0]), r5(b[1])]], ...(o ? {} : { approx: true }) }
}
/** 경로 한 개(pathList)를 구간으로: 도보 → 버스/지하철 → (환승 도보) → … → 도보 */
async function buildLegs(from, to, segs) {
  const legs = []
  let here = from
  for (const s of segs) {
    const a = [+s.fy, +s.fx], b = [+s.ty, +s.tx]
    if (km(here, a) > 0.03 || here === from) legs.push(await walkLeg(here, a))
    const rail = Array.isArray(s.railLinkList) && s.railLinkList.length > 0
    if (rail) {
      legs.push({ mode: 'subway', name: s.routeNm, color: subwayColor(s.routeNm), from: s.fname, to: s.tname, line: [[r5(a[0]), r5(a[1])], [r5(b[0]), r5(b[1])]], approx: true })
    } else {
      const seoul = String(s.routeId ?? '').startsWith('1')
      const gg = seoul ? null : await ggRouteType(s.fid, s.routeId)
      const type = gg?.type ?? guessBusType(s.routeNm, seoul)
      const real = seoul ? null : await ggRouteGeom(s.routeId).then((g) => (g ? sliceRoute(g, s.fid, s.tid, a, b) : null))
      const road = real ? null : await osrmLine('car', a, b)
      if (!real) await sleep(250)
      legs.push({
        mode: 'bus', name: cleanName(s.routeNm), routeId: s.routeId ?? null, type, typeName: gg?.typeName ?? BUS_TYPES[type].label, typeFrom: gg ? 'gg-api' : 'guess',
        color: BUS_TYPES[type].color, from: s.fname, to: s.tname, line: real ?? (road ? road.line : [[r5(a[0]), r5(a[1])], [r5(b[0]), r5(b[1])]]), lineFrom: real ? 'gg-route' : road ? 'osm-car' : 'straight', ...(real ? {} : { approx: true }),
      })
    }
    here = b
  }
  legs.push(await walkLeg(here, to))
  return legs
}

/** 대중교통 한 경로: { min(전체), ride, access, egress, wait, transfers, routes[], first, last, legs[] } 또는 null */
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
    return { min: Math.max(total, access + wait + ride + egress), ride, access, egress, wait, transfers, routes: segs.map((s) => s.routeNm), first: first.fname, last: last.tname, total, segs }
  }).filter(Boolean).sort((a, b) => a.min - b.min)[0]
  if (!best) return null
  // 고른 경로만 구간을 그린다. 정류장까지·정류장에서 걷는 시간은 OSM 보행 길 거리로 다시 잰다(직선 추정보다 정확).
  const { segs, total, ...row } = best
  try {
    const legs = await buildLegs(from, to, segs)
    const walks = legs.filter((l) => l.mode === 'walk')
    row.access = walks[0].min
    row.egress = walks[walks.length - 1].min
    row.ride = Math.max(2, total - row.access - row.egress - row.wait)
    row.min = Math.max(total, row.access + row.wait + row.ride + row.egress)
    row.legs = legs
  } catch (e) { console.error(`대중교통 구간 그리기 실패: ${e.message}`) }
  return row
}

/** 예전 방식으로 그린 대중교통(경로 그림 없음 · 버스 선 출처 기록 없음)이라 다시 재야 하나 */
export const transitStale = (t) => !!t && (!t.legs || t.legs.some((l) => l.mode === 'bus' && !l.lineFrom))

/** 한 쌍 전부(도보·자전거·대중교통) + 잰 시각 */
export async function measurePaths(from, to) {
  const wb = await walkBike(from, to)
  const transit = await transitPath(from, to)
  return { ...wb, transit, at: new Date().toLocaleString('sv-SE').slice(0, 16) }
}
