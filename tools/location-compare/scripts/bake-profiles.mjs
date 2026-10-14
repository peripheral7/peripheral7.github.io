// 시험용 사용자(src/data.ts PROFILES 의 'me' 밖)의 후보지 자료를 미리 계산해 src/profiles-live.json 에 싣는다.
// 검색으로 넣은 후보지와 같은 계산(server/runner.mjs analyze = scripts/stores.mjs·places.mjs 그대로, scripts/paths-lib.mjs 길,
// 네이버 Directions 5 차량)을 이 PC 에서 돌리고, 결과를 live.ts 의 저장 모양 그대로 둔다 — 공개 페이지는 계산 서버가 꺼져 있어도 바로 보인다.
// 같은 결과를 server/cache 에도 넣어 두므로, 계산 서버를 켜면 빠진 시간대(출퇴근·낮)를 기준 시각에 자동으로 잰다.
//
// 사용(이 폴더에서):  node scripts/bake-profiles.mjs [사용자 id ...] [--routes-only]
//   이미 실린 좌표는 건너뛴다(다시 계산하려면 src/profiles-live.json 에서 그 줄을 지운다).
//   --transit  대중교통만 다시(지도 경로 그림 legs 가 없는 길) — 분석·차량은 건드리지 않는다
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROFILES } from '../src/data.ts'
import { analyze } from '../server/runner.mjs'
import { ENV, measurePaths, transitPath } from './paths-lib.mjs'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(ROOT, 'src', 'profiles-live.json')
const CACHE = path.join(ROOT, 'server', 'cache')
fs.mkdirSync(CACHE, { recursive: true })
const args = process.argv.slice(2)
const only = args.filter((a) => !a.startsWith('--'))
const transitOnly = args.includes('--transit')
const routesOnly = args.includes('--routes-only') || transitOnly

// live.ts 와 같은 열쇠(소수 5자리)
const r5 = (x) => (Math.round(x * 1e5) / 1e5).toFixed(5)
const pkey = (p) => `${r5(p.lat)},${r5(p.lng)}`
const ckey = (s) => s.replace(/[^\w.,-]/g, '_')
const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
out._안내 = 'scripts/bake-profiles.mjs 가 만든 시험용 사용자 후보지 자료(live.ts 저장 모양: a = 좌표별 상권·입지 요인, r = "후보지>목적지" 길). 브라우저 저장값이 없을 때 쓴다.'
out.a ??= {}; out.r ??= {}
const write = () => fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n')

// 차량: 네이버 Directions 5 는 "지금 교통"만 — 지금이 기준 시각 창(평일 08·18시 = 출퇴근, 10·13시 = 낮, ±20분)이면 그 표본으로,
// 아니면 혼잡 시간대(평일 07~10·17~20시) 여부로 임시값(provisional). server/analyze-server.mjs 와 같은 규칙.
const WINDOWS = [{ slot: 'rush', sub: 'am', at: 480 }, { slot: 'rush', sub: 'pm', at: 1080 }, { slot: 'free', sub: 'am', at: 600 }, { slot: 'free', sub: 'pm', at: 780 }]
const now = new Date(), wd = now.getDay(), mins = now.getHours() * 60 + now.getMinutes(), h = now.getHours()
const win = wd >= 1 && wd <= 5 ? WINDOWS.find((w) => Math.abs(mins - w.at) <= 20) : null
const congested = wd >= 1 && wd <= 5 && ((h >= 7 && h < 10) || (h >= 17 && h < 20))
async function drive(from, to) {
  if (!ENV.NAVER_CLIENT_ID || !ENV.NAVER_CLIENT_SECRET) return null
  const url = `https://maps.apigw.ntruss.com/map-direction/v1/driving?start=${from.lng},${from.lat}&goal=${to.lng},${to.lat}&option=trafast`
  const res = await fetch(url, { headers: { 'x-ncp-apigw-api-key-id': ENV.NAVER_CLIENT_ID, 'x-ncp-apigw-api-key': ENV.NAVER_CLIENT_SECRET }, signal: AbortSignal.timeout(15000) })
  const body = await res.json().catch(() => ({}))
  const s = body?.route?.trafast?.[0]?.summary
  if (!res.ok || body.code !== 0 || !s) { console.error(`  차량 실패: HTTP ${res.status} ${JSON.stringify(body).slice(0, 120)}`); return null }
  return { min: Math.round(s.duration / 60000), km: Math.round(s.distance / 100) / 10, at: now.toLocaleString('sv-SE').slice(0, 16), ts: Date.now() }
}

for (const p of PROFILES.filter((x) => x.id !== 'me' && (!only.length || only.includes(x.id)))) {
  console.log(`\n## ${p.label}`)
  for (const c of p.candidates) {
    const k = pkey(c)
    if (!routesOnly && !out.a[k]) {
      const t0 = Date.now()
      try {
        out.a[k] = await analyze(+r5(c.lat), +r5(c.lng))
        write()
        fs.writeFileSync(path.join(CACHE, ckey(`a_${+r5(c.lat)},${+r5(c.lng)}`) + '.json'), JSON.stringify(out.a[k]))
        console.log(`${c.name}: 분석 ${((Date.now() - t0) / 1000).toFixed(0)}초`)
      } catch (e) { console.error(`${c.name}: 분석 실패 ${e.message}`) }
    }
    for (const hub of p.hubs) {
      const rk = `${k}>${pkey(hub)}`
      const row = out.r[rk] ?? {}
      if (transitOnly && row.paths && !row.paths.transit?.legs) {
        try { row.paths = { ...row.paths, transit: await transitPath([c.lat, c.lng], [hub.lat, hub.lng]) } } catch (e) { console.error(`  대중교통 실패 ${e.message}`) }
      }
      if (!row.paths) {
        try { row.paths = { ...(await measurePaths([c.lat, c.lng], [hub.lat, hub.lng])), ts: Date.now() } } catch (e) { console.error(`  길 실패 ${e.message}`) }
      }
      if (!row.free && !row.rush && !transitOnly) {
        const s = await drive(c, hub)
        if (s) row[win ? win.slot : congested ? 'rush' : 'free'] = win ? { ...s, samples: { [win.sub]: s } } : { ...s, provisional: true }
      }
      out.r[rk] = row
      write()
      // 계산 서버 캐시(r_ 파일) — 서버를 켜면 이 길도 기준 시각에 자동 측정
      const sk = ckey(`r_${+r5(c.lat)},${+r5(c.lng)}_${+r5(hub.lat)},${+r5(hub.lng)}`)
      const f = path.join(CACHE, sk + '.json')
      const prev = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}
      fs.writeFileSync(f, JSON.stringify({ asked: Date.now(), ...prev, ...row }))
      const t = row.paths?.transit
      console.log(`${c.name} → ${hub.name}: 도보 ${row.paths?.walk?.min ?? '-'}분 · 대중교통 ${t ? (t.total ?? t.min ?? JSON.stringify(t).slice(0, 40)) : '없음'} · 차량 ${(row.free ?? row.rush)?.min ?? '-'}분`)
    }
  }
}
console.log(`\n→ ${path.relative(ROOT, OUT)}`)
