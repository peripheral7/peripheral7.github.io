// place-search — "여기살까?"(/WhereTo/) 검색창이 부르는 네이버 지역 검색 중계.
//
// 왜 중계하나: 네이버 검색 API 는 Client ID + Client Secret 이 필요하고 브라우저(CORS)에서 직접 부를 수 없다.
// Secret 은 이 Worker 의 시크릿에만 있고(wrangler secret put), GitHub·브라우저에는 나가지 않는다.
//
// 막는 장치(겹겹이):
//  1) 하루 전체 상한(DAILY_LIMIT): 네이버를 실제로 부른 횟수가 넘으면 503 — 무슨 일이 있어도 사용량이 이 선을 못 넘는다.
//  2) IP 당 상한(시간당 IP_HOURLY, 하루 IP_DAILY): 넘으면 429. IP 는 소금(SALT)을 쳐서 해시로만 센다.
//  3) Turnstile(TURNSTILE_SECRET 이 있으면 필수): 사람 확인 토큰이 없거나 틀리면 403 — 스크립트로 긁어 가는 것을 거른다.
//  4) 허용한 출처(Origin)만: 다른 웹사이트가 방문자 브라우저로 이 주소를 부르는 것을 막는다(서버에서 꾸민 요청은 1~3 이 막는다).
//  5) 같은 검색어는 7일 캐시 — 캐시에서 나가면 네이버를 부르지 않아 전체 상한도 쓰지 않는다.
//  6) 요청 검사: GET /search?q= 만, 검색어 2~40자.
//
//  GET /search?q=검색어   → { items: [{ name, address, category, lat, lng }] }
//
// 계산 중계(10-14): 새 후보지의 상권·입지 요인·차량 시간은 사용자 PC 의 계산 서버(tools/location-compare/server)가 낸다.
//  그 서버가 cloudflared 빠른 터널 주소를 POST /relay/register 로 알려 오면(X-Relay-Key = 시크릿 RELAY_SECRET) D1 relay 표에 둔다.
//  GET /analyze?lat=&lng=  · GET /reverse?lat=&lng=(좌표 → 도로명 주소) · GET /route?from=lat,lng&to=lat,lng → 출처·IP 상한을 거쳐 그 주소로 넘긴다(키는 Worker 가 붙임).
//  등록이 없거나 25분 넘게 소식이 없거나 연결이 안 되면 503 { error: 'offline' } — 화면은 "계산 서버 꺼짐"으로 보인다.

const ALLOWED_ORIGINS = new Set(['https://peripheral7.github.io', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3001', 'http://127.0.0.1:3001'])
// 네이버 개발자센터 검색 API(openapi.naver.com)는 2026-06-29 종료 → NAVER API HUB(네이버 클라우드) 지역 검색으로 이관.
// 키도 API HUB 에서 새로 받은 Client ID/Secret 이어야 하고, 헤더 이름이 X-NCP-APIGW-API-KEY-ID / X-NCP-APIGW-API-KEY 로 바뀌었다.
const NAVER_LOCAL = 'https://naverapihub.apigw.ntruss.com/search/v1/local'
const CACHE_TTL = 7 * 24 * 3600

const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d)

function cors(origin) {
  const h = { 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Expose-Headers': 'Retry-After', 'Access-Control-Allow-Headers': 'X-Turnstile-Token', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
  if (origin && ALLOWED_ORIGINS.has(origin)) h['Access-Control-Allow-Origin'] = origin
  return h
}
const json = (body, status, headers) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } })

async function sha256(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

// 카운터 하나를 1 올리고 올린 뒤 값을 돌려준다(D1 한 문장이라 동시에 와도 안전).
async function bump(env, key, ttlSec) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec
  const row = await env.DB.prepare('INSERT INTO usage (k, n, exp) VALUES (?1, 1, ?2) ON CONFLICT(k) DO UPDATE SET n = n + 1 RETURNING n').bind(key, exp).first()
  return row.n
}

async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true
  if (!token) return false
  const form = new FormData()
  form.append('secret', env.TURNSTILE_SECRET)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  const body = await r.json().catch(() => ({}))
  return body.success === true
}

// 네이버 결과 → 화면에서 쓰는 모양. mapx·mapy 는 경도·위도 × 10^7.
const strip = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
function toPlaces(body) {
  return (body.items || []).map((it) => ({
    name: strip(it.title), address: strip(it.roadAddress || it.address), category: strip(it.category),
    lng: Number(it.mapx) / 1e7, lat: Number(it.mapy) / 1e7,
  })).filter((p) => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat > 33 && p.lat < 39 && p.lng > 124 && p.lng < 132)
}

const RELAY_STALE = 25 * 60 // 계산 서버는 10분마다 다시 알린다 — 25분 소식이 없으면 꺼진 것으로 본다
const sameKey = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && a.length > 0 && [...a].reduce((x, c, i) => x | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0

async function relayRegister(request, env) {
  if (!sameKey(request.headers.get('X-Relay-Key'), env.RELAY_SECRET)) return json({ error: 'key' }, 403, {})
  const body = await request.json().catch(() => ({}))
  const u = body.url === null ? null : String(body.url || '')
  if (u !== null && !/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(u)) return json({ error: 'url' }, 400, {})
  if (u === null) await env.DB.prepare("DELETE FROM relay WHERE k = 'compute'").run()
  else await env.DB.prepare("INSERT OR REPLACE INTO relay (k, url, at) VALUES ('compute', ?1, ?2)").bind(u, Math.floor(Date.now() / 1000)).run()
  return json({ ok: true }, 200, {})
}

// /analyze · /reverse · /route → 계산 서버. 매개변수는 숫자 좌표만 다시 만들어 넘긴다(다른 글자는 안 넘김).
async function relay(env, h, url, who, hour) {
  const coord = (s) => { const [a, b] = String(s || '').split(',').map(Number); return Number.isFinite(a) && Number.isFinite(b) && a > 33 && a < 39 && b > 124 && b < 132 ? `${a.toFixed(5)},${b.toFixed(5)}` : null }
  let path
  if (url.pathname === '/analyze' || url.pathname === '/reverse') {
    const c = coord(`${url.searchParams.get('lat')},${url.searchParams.get('lng')}`)
    if (!c) return json({ error: 'query' }, 400, h)
    const [lat, lng] = c.split(',')
    path = `${url.pathname}?lat=${lat}&lng=${lng}`
  } else {
    const f = coord(url.searchParams.get('from')), t = coord(url.searchParams.get('to'))
    if (!f || !t) return json({ error: 'query' }, 400, h)
    path = `/route?from=${f}&to=${t}`
  }
  // IP 당 상한(분석은 결과가 나올 때까지 몇 초마다 다시 묻기 때문에 넉넉히)
  const n = await bump(env, `rl:${who}:${hour}`, 7200)
  if (n > num(env.RELAY_IP_HOURLY, 600)) return json({ error: 'rate' }, 429, { ...h, 'Retry-After': '3600' })
  const row = await env.DB.prepare("SELECT url, at FROM relay WHERE k = 'compute'").first()
  if (!row || Math.floor(Date.now() / 1000) - row.at > RELAY_STALE) return json({ error: 'offline' }, 503, h)
  try {
    const r = await fetch(row.url + path, { headers: { 'X-Relay-Key': env.RELAY_SECRET }, signal: AbortSignal.timeout(25000) })
    const text = await r.text()
    if (!text.startsWith('{')) return json({ error: 'offline' }, 503, h) // 터널은 살아 있는데 서버가 꺼진 경우 등
    return new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...h } })
  } catch {
    return json({ error: 'offline' }, 503, h)
  }
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin')
    const h = cors(origin)
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h })
    if (request.method === 'POST' && url.pathname === '/relay/register') return relayRegister(request, env)
    if (request.method === 'GET' && (url.pathname === '/analyze' || url.pathname === '/route' || url.pathname === '/reverse')) {
      if (!origin || !ALLOWED_ORIGINS.has(origin)) return json({ error: 'origin' }, 403, h)
      const now = new Date()
      const who = await sha256((env.SALT || 'place-search') + (request.headers.get('CF-Connecting-IP') || ''))
      try { return await relay(env, h, url, who, now.toISOString().slice(0, 13)) } catch { return json({ error: 'server' }, 500, h) }
    }
    if (request.method !== 'GET' || url.pathname !== '/search') return json({ error: 'not_found' }, 404, h)
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return json({ error: 'origin' }, 403, h)

    const q = (url.searchParams.get('q') || '').trim().replace(/\s+/g, ' ')
    if (q.length < 2 || q.length > 40) return json({ error: 'query' }, 400, h)

    const ip = request.headers.get('CF-Connecting-IP') || ''
    const now = new Date()
    const day = now.toISOString().slice(0, 10)
    const hour = now.toISOString().slice(0, 13)
    const who = await sha256((env.SALT || 'place-search') + ip)

    try {
      // IP 당 상한(검색 시도마다 센다 — 캐시에서 나가도 센다)
      const [perHour, perDay] = await Promise.all([bump(env, `ip:${who}:${hour}`, 7200), bump(env, `ipd:${who}:${day}`, 172800)])
      if (perHour > num(env.IP_HOURLY, 30) || perDay > num(env.IP_DAILY, 100)) return json({ error: 'rate' }, 429, { ...h, 'Retry-After': '3600' })

      if (!(await verifyTurnstile(env, request.headers.get('X-Turnstile-Token'), ip))) return json({ error: 'turnstile' }, 403, h)

      // 캐시(같은 검색어 7일). Cache API(caches.default)는 *.workers.dev 주소에서는 저장되지 않아 D1 에 둔다.
      const now = Math.floor(Date.now() / 1000)
      const key = q.toLowerCase()
      const hit = await env.DB.prepare('SELECT body FROM cache WHERE q = ?1 AND exp > ?2').bind(key, now).first()
      if (hit) return json(JSON.parse(hit.body), 200, { ...h, 'X-Cache': 'HIT' })

      // 하루 전체 상한: 네이버를 부르기 직전에 센다
      const total = await bump(env, `g:${day}`, 172800)
      if (total > num(env.DAILY_LIMIT, 1000)) return json({ error: 'daily' }, 503, h)

      if (Math.random() < 0.02) ctx.waitUntil(env.DB.batch([env.DB.prepare('DELETE FROM usage WHERE exp < ?1').bind(now), env.DB.prepare('DELETE FROM cache WHERE exp < ?1').bind(now)]))

      const upstream = `${env.NAVER_LOCAL_URL || NAVER_LOCAL}?query=${encodeURIComponent(q)}&display=5&sort=random`
      const r = await fetch(upstream, { headers: { 'X-NCP-APIGW-API-KEY-ID': env.NAVER_CLIENT_ID || '', 'X-NCP-APIGW-API-KEY': env.NAVER_CLIENT_SECRET || '' } })
      if (!r.ok) return json({ error: 'upstream', status: r.status }, 502, h)
      const body = { items: toPlaces(await r.json()) }
      ctx.waitUntil(env.DB.prepare('INSERT OR REPLACE INTO cache (q, body, exp) VALUES (?1, ?2, ?3)').bind(key, JSON.stringify(body), now + CACHE_TTL).run())
      return json(body, 200, { ...h, 'X-Cache': 'MISS' })
    } catch (e) {
      return json({ error: 'server' }, 500, h)
    }
  },
}
