// 여기살까? 계산 서버 — 이 PC 에서 돌리고 Cloudflare 터널로 내보낸다(사용자 테스트 기간용).
//
// 공개 페이지 → place-search Worker(/analyze · /route, 출처·IP 상한) → 터널(trycloudflare) → 이 서버(127.0.0.1)
// 이 서버는 Worker 가 붙이는 X-Relay-Key(= .env.local 의 RELAY_SECRET)가 맞을 때만 답한다. 키는 브라우저에 나가지 않는다.
//
//  GET /analyze?lat=&lng=   새 후보지의 상권·평화로움·공원·도서관(server/runner.mjs = scripts 를 그대로 실행, 약 30초)
//                           → 200 결과 | 202 { pending, position }(계산 중 — 몇 초 뒤 다시) | 4xx/5xx { error }
//  GET /route?from=lat,lng&to=lat,lng   { free?, rush?, paths? }
//                           차량 — 네이버 Directions 5(자동차)는 "지금 교통"만 잰다. 기준 시각(출퇴근 = 평일 08시·18시, 낮 = 평일 10시·13시,
//                           각 ±20분)에 두 번씩 재서 평균(samples.am·pm). 처음 묻는 길은 그 자리에서 한 번 재서 지금이 혼잡 시간대
//                           (평일 07~10시·17~20시)면 출퇴근, 아니면 낮 값으로 임시 저장(provisional)한다 — 두 기준 중 하나만 먼저 생긴다.
//                           물어본 길은 모두 기억해 두고(server/cache/r_*.json), 기준 시각이 오면 10분마다 빠진 값·30일 지난 값을 자동으로 잰다.
//                           paths — 도보·자전거(OSM 길 거리)·대중교통(서울시 환승경로), scripts/paths-lib.mjs. 30일마다 다시.
//  GET /reverse?lat=&lng=  좌표 → 도로명 주소(브이월드 getAddress, 도로명이 없으면 지번으로 주소 검색해 도로명). 지도 우클릭 등록용.
//                           브이월드는 Cloudflare Worker 에서 부르면 막혀서(520) 이 PC 에서 부른다. 같은 좌표(약 1m)는 30일 캐시.
//  GET /health
//
// 실행(이 폴더 tools/location-compare 에서):  node server/analyze-server.mjs --tunnel
//   --tunnel 이면 cloudflared 빠른 터널을 열고 그 주소를 Worker 에 등록한다(10분마다 다시 알림, 끄면 등록 해제).
// 결과 캐시: server/cache/(git 제외) — 같은 좌표는 30일 다시 계산하지 않는다. 길은 시간대마다 30일이 지나면 그 시간대에 다시 잰다.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { analyze } from './runner.mjs'
import { measurePaths, transitPath, transitStale } from '../scripts/paths-lib.mjs'

const TOOL = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CACHE = path.join(TOOL, 'server', 'cache')
const USAGE = path.join(TOOL, 'server', '.usage.json')
fs.mkdirSync(CACHE, { recursive: true })

const ENV = {}
for (const l of fs.readFileSync(path.join(TOOL, '.env.local'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if (m && m[2] && !(m[1] in ENV)) ENV[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const RELAY_SECRET = ENV.RELAY_SECRET
if (!RELAY_SECRET) { console.error('.env.local 에 RELAY_SECRET 이 없습니다'); process.exit(1) }
const WORKER = ENV.VITE_PLACE_SEARCH_URL?.replace(/\/+$/, '') || 'https://place-search.mooncg0916.workers.dev'
const PORT = Number(ENV.ANALYZE_PORT) || 8790
const LIMITS = { analyze: Number(ENV.LIVE_ANALYZE_LIMIT) || 150, route: Number(ENV.LIVE_ROUTE_LIMIT) || 300 } // 하루(이 PC 날짜) 새 계산 상한
const A_TTL = 30 * 86400_000, SLOT_TTL = 30 * 86400_000, MAX_PAIRS = 5000
// 서비스 범위: 상가 DB = 서울·경기, 공원 경계 = 경기. 대략의 네모(인천 일부 포함)
const inArea = (lat, lng) => lat > 36.85 && lat < 38.35 && lng > 126.35 && lng < 127.9

// ── 하루 사용량 ──
const today = () => new Date().toLocaleDateString('sv-SE')
function bump(kind) {
  let u = {}
  try { u = JSON.parse(fs.readFileSync(USAGE, 'utf8')) } catch { /* 처음 */ }
  if (u.date !== today()) u = { date: today() }
  if ((u[kind] ?? 0) >= LIMITS[kind]) return false
  u[kind] = (u[kind] ?? 0) + 1
  fs.writeFileSync(USAGE, JSON.stringify(u))
  return true
}

// ── 캐시 ──
const r5 = (x) => Math.round(x * 1e5) / 1e5
const cfile = (key) => path.join(CACHE, key.replace(/[^\w.,-]/g, '_') + '.json')
function cget(key, ttl) {
  try { const f = cfile(key); if (Date.now() - fs.statSync(f).mtimeMs < ttl) return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { /* 없음 */ }
  return null
}
const cput = (key, v) => fs.writeFileSync(cfile(key), JSON.stringify(v))

// ── 분석 대기열(한 번에 하나 — 스크립트가 같은 작업 폴더를 쓴다) ──
const queue = [] // { key, lat, lng }
const failed = new Map() // key → { error, at }
let running = null
async function pump() {
  if (running || !queue.length) return
  running = queue.shift()
  const { key, lat, lng } = running
  const t0 = Date.now()
  try {
    cput(key, await analyze(lat, lng))
    console.log(`분석 ${key} ${((Date.now() - t0) / 1000).toFixed(0)}초`)
  } catch (e) {
    failed.set(key, { error: String(e.message || e).slice(0, 300), at: Date.now() })
    console.error(`분석 실패 ${key}: ${e.message}`)
  }
  running = null
  pump()
}

function handleAnalyze(q) {
  const lat = r5(Number(q.get('lat'))), lng = r5(Number(q.get('lng')))
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [400, { error: 'query' }]
  if (!inArea(lat, lng)) return [422, { error: 'outside' }]
  const key = `a_${lat},${lng}`
  const hit = cget(key, A_TTL)
  if (hit) return [200, hit]
  const f = failed.get(key)
  if (f && Date.now() - f.at < 10 * 60_000) return [500, { error: 'failed' }]
  if (running?.key === key) return [202, { pending: true, position: 0 }]
  const i = queue.findIndex((x) => x.key === key)
  if (i >= 0) return [202, { pending: true, position: i + 1 }]
  if (queue.length >= 20) return [503, { error: 'busy' }]
  if (!bump('analyze')) return [503, { error: 'daily' }]
  failed.delete(key)
  queue.push({ key, lat, lng })
  setImmediate(pump)
  return [202, { pending: true, position: queue.length - (running ? 0 : 1) }]
}

// 기준 시각(이 PC 시간대 = 한국, 평일만): 출퇴근 = 08:00(am)·18:00(pm), 낮 = 10:00(am)·13:00(pm), 각 앞뒤 20분 창에서 잰다.
// 두 값의 평균을 그 시간대 값으로 쓴다(사용자 지정 2026-10-14). scripts/scheduled-routes.ps1 과 같은 창.
export const SLOT_WINDOWS = [
  { slot: 'rush', sub: 'am', at: 8 * 60 }, { slot: 'rush', sub: 'pm', at: 18 * 60 },
  { slot: 'free', sub: 'am', at: 10 * 60 }, { slot: 'free', sub: 'pm', at: 13 * 60 },
]
const WINDOW_MIN = 20
function slotNow(d = new Date()) {
  const wd = d.getDay(), m = d.getHours() * 60 + d.getMinutes()
  if (wd < 1 || wd > 5) return null
  return SLOT_WINDOWS.find((w) => Math.abs(m - w.at) <= WINDOW_MIN) ?? null
}
/** 지금이 막히는 시간대인가(처음 등록할 때 한 번 잰 값을 어느 쪽에 둘지): 평일 07~10시·17~20시 */
function congestedNow(d = new Date()) {
  const wd = d.getDay(), h = d.getHours()
  return wd >= 1 && wd <= 5 && ((h >= 7 && h < 10) || (h >= 17 && h < 20))
}
const pt = (s) => { const [a, b] = String(s ?? '').split(',').map(Number); return Number.isFinite(a) && Number.isFinite(b) ? [r5(a), r5(b)] : null }
const fresh = (v) => !!v && Date.now() - (v.ts ?? Date.parse(v.at.replace(' ', 'T'))) < SLOT_TTL
const pairOf = (key) => { const m = key.match(/^r_([\d.]+),([\d.]+)_([\d.]+),([\d.]+)$/); return m ? [[+m[1], +m[2]], [+m[3], +m[4]]] : null }
const readPair = (key) => { try { return JSON.parse(fs.readFileSync(cfile(key), 'utf8')) } catch { return null } }
const slotsOnly = (p) => ({ ...(p.free ? { free: p.free } : {}), ...(p.rush ? { rush: p.rush } : {}), ...(p.paths ? { paths: p.paths } : {}) })
const avgSlot = (samples) => {
  const ss = Object.values(samples)
  return { min: Math.round(ss.reduce((a, x) => a + x.min, 0) / ss.length), km: Math.round((ss.reduce((a, x) => a + x.km, 0) / ss.length) * 10) / 10, at: ss.map((x) => x.at).sort().pop(), ts: Math.max(...ss.map((x) => x.ts ?? 0)), samples }
}

// 1회 재서 그 길 파일에 저장. sub = 'am'|'pm' 이면 기준 시각 표본(평균), null 이면 등록 시각 임시값(provisional). 성공하면 true
async function measure(key, from, to, slot, sub = null) {
  if (!ENV.NAVER_CLIENT_ID || !ENV.NAVER_CLIENT_SECRET || !bump('route')) return false
  const url = `https://maps.apigw.ntruss.com/map-direction/v1/driving?start=${from[1]},${from[0]}&goal=${to[1]},${to[0]}&option=trafast`
  const res = await fetch(url, { headers: { 'x-ncp-apigw-api-key-id': ENV.NAVER_CLIENT_ID, 'x-ncp-apigw-api-key': ENV.NAVER_CLIENT_SECRET }, signal: AbortSignal.timeout(15000) })
  const body = await res.json().catch(() => ({}))
  const s = body?.route?.trafast?.[0]?.summary
  if (!res.ok || body.code !== 0 || !s) { console.error(`길찾기 실패 ${key}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 160)}`); return false }
  const p = readPair(key) ?? { asked: Date.now() }
  const sample = { min: Math.round(s.duration / 60000), km: Math.round(s.distance / 100) / 10, at: new Date().toLocaleString('sv-SE').slice(0, 16), ts: Date.now() }
  if (sub) p[slot] = avgSlot({ ...(p[slot]?.samples ?? {}), [sub]: sample })
  else p[slot] = { ...sample, provisional: true }
  cput(key, p)
  return true
}

async function handleRoute(q) {
  const from = pt(q.get('from')), to = pt(q.get('to'))
  if (!from || !to) return [400, { error: 'query' }]
  if (!inArea(...from) || !inArea(...to)) return [422, { error: 'outside' }]
  const key = `r_${from.join(',')}_${to.join(',')}`
  let p = readPair(key)
  if (!p) { // 처음 묻는 길: 기억해 두면 시간대가 올 때 자동으로 잰다
    if (fs.readdirSync(CACHE).filter((f) => f.startsWith('r_')).length >= MAX_PAIRS) return [503, { error: 'busy' }]
    p = { asked: Date.now() }
    cput(key, p)
  } else if (Date.now() - (p.asked ?? 0) > 86400_000) { p.asked = Date.now(); cput(key, p) }
  const w = slotNow()
  if (w && !fresh(p[w.slot]?.samples?.[w.sub]) && (await measure(key, from, to, w.slot, w.sub))) p = readPair(key)
  else if (!p.free && !p.rush && (await measure(key, from, to, congestedNow() ? 'rush' : 'free'))) p = readPair(key) // 처음: 지금 교통으로 한 번
  // 도보·자전거·대중교통 길(30일마다 다시)
  if (!p.paths || Date.now() - (p.paths.ts ?? 0) > SLOT_TTL) {
    try { p = { ...readPair(key), paths: { ...(await measurePaths(from, to)), ts: Date.now() } }; cput(key, p) } catch (e) { console.error(`길(도보·대중교통) 실패 ${key}: ${e.message}`) }
  } else if (transitStale(p.paths.transit)) { // 지도 경로 그림이 없거나 옛 방식(버스 = 도로 근사선)으로 잰 길 — 대중교통만 다시
    try { const t = await transitPath(from, to, p.paths.walk?.min); if (t) { p = { ...readPair(key) }; p.paths = { ...p.paths, transit: t }; cput(key, p) } } catch (e) { console.error(`대중교통 경로 그림 실패 ${key}: ${e.message}`) }
  }
  return [200, slotsOnly(p)]
}

// 기준 시각 자동 측정: 10분마다, 기준 시각 창(±20분) 안이면 그 표본이 없거나 30일 지난 길을 차례로 잰다(최근 60일 안에 물어본 길만)
let sweeping = false
async function sweep() {
  const w = slotNow()
  if (!w || sweeping) return
  sweeping = true
  let n = 0
  try {
    for (const f of fs.readdirSync(CACHE).filter((x) => x.startsWith('r_'))) {
      const key = f.slice(0, -5), p = readPair(key), pair = pairOf(key)
      if (!p || !pair || fresh(p[w.slot]?.samples?.[w.sub]) || Date.now() - (p.asked ?? 0) > 60 * 86400_000) continue
      if (slotNow() !== w) break // 창이 끝났으면 멈춤
      if (!(await measure(key, pair[0], pair[1], w.slot, w.sub))) break // 한도·인증 문제면 다음 차례에
      n++
      await new Promise((r) => setTimeout(r, 400))
    }
  } catch (e) { console.error('자동 측정 오류:', e.message) }
  sweeping = false
  if (n) console.log(`자동 측정 ${w.slot}.${w.sub} ${n}건`)
}
setInterval(sweep, 10 * 60_000)
setTimeout(sweep, 20_000)

// ── 좌표 → 도로명 주소(브이월드) ──
const VW_DOMAIN = ENV.VWORLD_DOMAIN || 'https://peripheral7.github.io' // 키에 등록한 서비스 URL
async function vworld(kind, params) {
  const u = new URL(`https://api.vworld.kr/req/${kind}`)
  u.search = new URLSearchParams({ ...params, version: '2.0', crs: 'epsg:4326', format: 'json', key: ENV.VWORLD_API_KEY, domain: VW_DOMAIN })
  const r = await fetch(u, { signal: AbortSignal.timeout(6000) })
  const j = await r.json()
  return j?.response?.status === 'OK' ? j.response.result : null
}
async function handleReverse(q) {
  const lat = Number(q.get('lat')), lng = Number(q.get('lng'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [400, { error: 'query' }]
  if (!ENV.VWORLD_API_KEY) return [503, { error: 'no_key' }]
  const key = `v_${r5(lat)},${r5(lng)}`
  const hit = cget(key, A_TTL)
  if (hit) return [200, hit]
  const res = await vworld('address', { service: 'address', request: 'getAddress', point: `${lng},${lat}`, type: 'both', zipcode: 'false', simple: 'false' })
  if (!res?.length) return [404, { error: 'none' }]
  const road = res.find((x) => x.type === 'road'), parcel = res.find((x) => x.type === 'parcel')
  const bld = road?.structure?.detail || undefined // 건물 이름(있으면)
  let out = road ? { address: road.text.replace(/\s*\([^)]*\)\s*$/, ''), parcel: parcel?.text, building: bld } : null // 끝의 "(서천동)" 같은 참고 글자는 뺀다
  // 도로·빈 땅처럼 도로명이 없는 곳: 지번 주소로 주소 검색 → 그 필지의 도로명(건물이 있으면)
  if (!out && parcel) {
    const s = await vworld('search', { service: 'search', request: 'search', type: 'address', category: 'parcel', query: parcel.text, size: '1', page: '1' }).catch(() => null)
    const it = s?.items?.[0]?.address
    const lvl1 = parcel.structure?.level1 ?? '', lvl2 = parcel.structure?.level2 ?? ''
    out = it?.road ? { address: `${lvl1} ${lvl2} ${it.road}`.replace(/\s+/g, ' ').trim(), parcel: parcel.text, building: it.bldnm || undefined } : { address: parcel.text, parcel: parcel.text, jibun: true }
  }
  if (!out) return [404, { error: 'none' }]
  cput(key, out)
  return [200, out]
}

const keyOk = (got) => { const a = Buffer.from(String(got ?? '')), b = Buffer.from(RELAY_SECRET); return a.length === b.length && crypto.timingSafeEqual(a, b) }

const server = http.createServer(async (req, res) => {
  const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)) }
  try {
    const u = new URL(req.url, 'http://x')
    if (req.method !== 'GET') return send(405, { error: 'method' })
    if (!keyOk(req.headers['x-relay-key'])) return send(403, { error: 'key' })
    if (u.pathname === '/health') return send(200, { ok: true, queue: queue.length, running: !!running })
    if (u.pathname === '/analyze') return send(...handleAnalyze(u.searchParams))
    if (u.pathname === '/route') return send(...(await handleRoute(u.searchParams)))
    if (u.pathname === '/reverse') return send(...(await handleReverse(u.searchParams)))
    send(404, { error: 'not_found' })
  } catch (e) {
    console.error(e)
    send(500, { error: 'server' })
  }
})
server.listen(PORT, '127.0.0.1', () => console.log(`계산 서버 http://127.0.0.1:${PORT} (하루 상한: 분석 ${LIMITS.analyze} · 길찾기 ${LIMITS.route})`))

// ── 터널 + Worker 등록 ──
async function register(url) {
  try {
    const r = await fetch(`${WORKER}/relay/register`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Relay-Key': RELAY_SECRET }, body: JSON.stringify({ url }), signal: AbortSignal.timeout(15000) })
    if (!r.ok) console.error(`Worker 등록 실패 HTTP ${r.status}`)
    return r.ok
  } catch (e) { console.error('Worker 등록 실패:', e.message); return false }
}

if (process.argv.includes('--tunnel')) {
  const exe = ['C:/Program Files (x86)/cloudflared/cloudflared.exe', 'C:/Program Files/cloudflared/cloudflared.exe'].find((p) => fs.existsSync(p)) ?? 'cloudflared'
  const cf = spawn(exe, ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'] })
  let tunnel = null, beat = null
  const scan = async (d) => {
    const m = String(d).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
    if (!m || tunnel) return
    tunnel = m[0]
    console.log(`터널 ${tunnel}`)
    // 새 주소가 DNS 에 퍼질 때까지 잠깐 기다렸다가 등록
    setTimeout(async () => { if (await register(tunnel)) console.log('Worker 에 등록 완료 — 공개 페이지에서 새 후보지 계산이 켜졌습니다') }, 5000)
    beat = setInterval(() => register(tunnel), 10 * 60_000)
  }
  cf.stdout.on('data', scan)
  cf.stderr.on('data', scan)
  cf.on('close', (code) => { console.error(`cloudflared 종료(${code})`); clearInterval(beat); register(null).finally(() => process.exit(1)) })
  const stop = () => { clearInterval(beat); cf.kill(); register(null).finally(() => process.exit(0)) }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}
