// 네이버 Directions 5(자동차)로 후보지 → 방문지 소요 시간을 재서 src/routes.json 에 적는다.
//
// 왜 미리 재 두나: 블로그(GitHub Pages)는 정적 파일이라, 방문자 브라우저가 네이버 API 를 직접 부르게 하면
// 키가 공개되고 누구나(다른 서버·스크래퍼 포함) 내 사용량을 쓸 수 있다. 후보지·방문지가 고정이므로
// 이 PC 에서 한 번 재서 결과만 올리면, 공개 사이트에는 네이버 API 를 부르는 길 자체가 없다.
//
// 사용(이 폴더에서):
//   node scripts/fetch-routes.mjs --slot rush        # 평일 08시·18시(앞뒤 20분)에 실행 — 오전이면 am, 오후면 pm 표본
//   node scripts/fetch-routes.mjs --slot free        # 평일 10시·13시(앞뒤 20분)에 실행
//   두 표본이 모이면 그 평균이 그 시간대 값(min·km)이 된다.
//   node scripts/fetch-routes.mjs --slot free --dry-run   # 부를 목록과 남은 한도만 보여 주고 부르지 않음
//   그다음 npm run build → 커밋.
//
// 키: 이 폴더의 .env.local(.gitignore 의 `.env*.local` 로 git 에 안 올라감) 또는 환경변수
//   NAVER_CLIENT_ID=...          (콘솔의 Client ID — 요청 헤더 x-ncp-apigw-api-key-id)
//   NAVER_CLIENT_SECRET=...      (콘솔의 Client Secret — 요청 헤더 x-ncp-apigw-api-key)
//   NAVER_DAILY_LIMIT=100        (선택: 하루 호출 상한, 기본 100, 최대 1000)
//
// 사용량 제한: 하루 호출 수를 .naver-usage.json(git 에 안 올라감)에 세고, 상한에 닿으면 부르기 전에 멈춘다.
// 한 번 실행에서 부르는 수 = 후보지 수 × 방문지 수(지금 4 × 2 = 8회).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CANDIDATES, HUBS } from '../src/data.ts' // Node 23.6+ 는 타입만 지우고 .ts 를 바로 읽는다

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const ROUTES = path.join(ROOT, 'src', 'routes.json')
const USAGE = path.join(ROOT, '.naver-usage.json')
const ENDPOINT = 'https://maps.apigw.ntruss.com/map-direction/v1/driving'

const args = process.argv.slice(2)
const slot = args[args.indexOf('--slot') + 1]
const dryRun = args.includes('--dry-run')
if (!['free', 'rush'].includes(slot)) {
  console.error('사용: node scripts/fetch-routes.mjs --slot free|rush [--dry-run]')
  process.exit(1)
}

// .env.local 읽기(있으면). 이미 있는 환경변수가 우선.
const envFile = path.join(ROOT, '.env.local')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const ID = process.env.NAVER_CLIENT_ID
const SECRET = process.env.NAVER_CLIENT_SECRET
const LIMIT = Math.min(1000, Math.max(1, Number(process.env.NAVER_DAILY_LIMIT) || 100))

const today = new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD (이 PC 시간대)
let usage = { date: today, count: 0 }
try {
  const saved = JSON.parse(fs.readFileSync(USAGE, 'utf8'))
  if (saved.date === today) usage = saved
} catch { /* 처음이거나 날짜가 바뀜 */ }

const pairs = CANDIDATES.flatMap((c) => HUBS.map((h) => ({ c, h })))
console.log(`시간대 ${slot} · 호출 예정 ${pairs.length}회 · 오늘 사용 ${usage.count}/${LIMIT}`)
if (usage.count + pairs.length > LIMIT) {
  console.error(`하루 상한(${LIMIT})을 넘게 됩니다 — 부르지 않고 멈춥니다. 내일 다시 하거나 NAVER_DAILY_LIMIT 를 올리세요.`)
  process.exit(2)
}
if (dryRun) {
  for (const { c, h } of pairs) console.log(`  ${c.id}:${h.id}  ${c.name} → ${h.name}`)
  process.exit(0)
}
if (!ID || !SECRET) {
  console.error('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 가 없습니다. 이 폴더의 .env.local 에 적어 주세요(git 에 안 올라감).')
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(ROUTES, 'utf8'))
data.pairs ??= {}
const at = new Date().toLocaleString('sv-SE').slice(0, 16) // YYYY-MM-DD HH:MM
const sub = new Date().getHours() < 12 ? 'am' : 'pm' // 출퇴근 08시 = am · 18시 = pm, 낮 10시 = am · 13시 = pm
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

for (const { c, h } of pairs) {
  usage.count++
  fs.writeFileSync(USAGE, JSON.stringify(usage)) // 부르기 전에 먼저 센다(중간에 죽어도 사용량은 남음)
  const url = `${ENDPOINT}?start=${c.lng},${c.lat}&goal=${h.lng},${h.lat}&option=trafast`
  const res = await fetch(url, { headers: { 'x-ncp-apigw-api-key-id': ID, 'x-ncp-apigw-api-key': SECRET } })
  const body = await res.json().catch(() => ({}))
  const route = body?.route?.trafast?.[0]?.summary
  if (!res.ok || body.code !== 0 || !route) {
    console.error(`  실패 ${c.id}:${h.id} — HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`)
    if (res.status === 401 || res.status === 429) { console.error('  인증·한도 오류라 나머지는 부르지 않습니다.'); break }
    continue
  }
  const min = Math.round(route.duration / 60000)
  const km = Math.round(route.distance / 100) / 10
  const pair = data.pairs[`${c.id}:${h.id}`] ?? {}
  const samples = { ...(pair[slot]?.samples ?? {}), [sub]: { min, km, at } }
  const ss = Object.values(samples)
  pair[slot] = { min: Math.round(ss.reduce((a, x) => a + x.min, 0) / ss.length), km: Math.round((ss.reduce((a, x) => a + x.km, 0) / ss.length) * 10) / 10, at, samples }
  data.pairs[`${c.id}:${h.id}`] = pair
  console.log(`  ${c.name} → ${h.name}: ${min}분 · ${km}km`)
  await sleep(300) // 짧은 간격으로 몰아 부르지 않는다
}

fs.writeFileSync(ROUTES, JSON.stringify(data, null, 2) + '\n')
console.log(`저장: src/routes.json · 오늘 사용 ${usage.count}/${LIMIT}. 다음: npm run build 후 커밋`)
