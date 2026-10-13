// 여기살까? 계산 서버 — 이 PC 에서 돌리고 Cloudflare 터널로 내보낸다(사용자 테스트 기간용).
//
// 공개 페이지 → place-search Worker(/analyze · /route, 출처·IP 상한) → 터널(trycloudflare) → 이 서버(127.0.0.1)
// 이 서버는 Worker 가 붙이는 X-Relay-Key(= .env.local 의 RELAY_SECRET)가 맞을 때만 답한다. 키는 브라우저에 나가지 않는다.
//
//  GET /analyze?lat=&lng=   새 후보지의 상권·평화로움·공원·도서관(server/runner.mjs = scripts 를 그대로 실행, 약 30초)
//                           → 200 결과 | 202 { pending, position }(계산 중 — 몇 초 뒤 다시) | 4xx/5xx { error }
//  GET /route?from=lat,lng&to=lat,lng   네이버 Directions 5(자동차) 지금 교통으로 1회 → { free?, rush? }(시간대는 지금 시각으로 정함)
//  GET /health
//
// 실행(이 폴더 tools/location-compare 에서):  node server/analyze-server.mjs --tunnel
//   --tunnel 이면 cloudflared 빠른 터널을 열고 그 주소를 Worker 에 등록한다(10분마다 다시 알림, 끄면 등록 해제).
// 결과 캐시: server/cache/(git 제외) — 같은 좌표는 30일, 같은 길·시간대는 7일 다시 계산하지 않는다.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { analyze } from './runner.mjs'

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
const A_TTL = 30 * 86400_000, R_TTL = 7 * 86400_000
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

// 시간대: 평일 07~10시·17~20시 = 출퇴근(rush), 그 밖 = 여유(free). 이 PC 시간대(한국) 기준.
function slotNow() {
  const d = new Date(), wd = d.getDay(), h = d.getHours()
  return wd >= 1 && wd <= 5 && ((h >= 7 && h < 10) || (h >= 17 && h < 20)) ? 'rush' : 'free'
}
const pt = (s) => { const [a, b] = String(s ?? '').split(',').map(Number); return Number.isFinite(a) && Number.isFinite(b) ? [r5(a), r5(b)] : null }
async function handleRoute(q) {
  const from = pt(q.get('from')), to = pt(q.get('to'))
  if (!from || !to) return [400, { error: 'query' }]
  if (!inArea(...from) || !inArea(...to)) return [422, { error: 'outside' }]
  const key = `r_${from.join(',')}_${to.join(',')}`
  const slot = slotNow()
  const saved = cget(key, R_TTL) ?? {}
  if (saved[slot]) return [200, saved]
  if (!ENV.NAVER_CLIENT_ID || !ENV.NAVER_CLIENT_SECRET) return [503, { error: 'nokey' }]
  if (!bump('route')) return Object.keys(saved).length ? [200, saved] : [503, { error: 'daily' }]
  const url = `https://maps.apigw.ntruss.com/map-direction/v1/driving?start=${from[1]},${from[0]}&goal=${to[1]},${to[0]}&option=trafast`
  const res = await fetch(url, { headers: { 'x-ncp-apigw-api-key-id': ENV.NAVER_CLIENT_ID, 'x-ncp-apigw-api-key': ENV.NAVER_CLIENT_SECRET }, signal: AbortSignal.timeout(15000) })
  const body = await res.json().catch(() => ({}))
  const s = body?.route?.trafast?.[0]?.summary
  if (!res.ok || body.code !== 0 || !s) {
    console.error(`길찾기 실패 ${key}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 160)}`)
    return Object.keys(saved).length ? [200, saved] : [502, { error: 'upstream' }]
  }
  const out = { ...saved, [slot]: { min: Math.round(s.duration / 60000), km: Math.round(s.distance / 100) / 10, at: new Date().toLocaleString('sv-SE').slice(0, 16) } }
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
