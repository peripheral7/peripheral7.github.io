// 기본 후보지 → 목적지의 도보·자전거(OSM 길 거리)와 대중교통(서울시 환승경로)을 재서 src/paths.json 에 적는다(이 PC 에서만).
// 공개 사이트는 이 결과 파일만 읽는다. 함수는 scripts/paths-lib.mjs(계산 서버도 같은 것을 쓴다).
//
// 사용(이 폴더에서):  node scripts/fetch-paths.mjs   → npm run build → 커밋
//   --transit  대중교통만 다시(도보·자전거는 그대로) — 지도 경로 그림(legs)을 새로 받을 때
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CANDIDATES, HUBS } from '../src/data.ts'
import { measurePaths, transitPath } from './paths-lib.mjs'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(ROOT, 'src', 'paths.json')
const data = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
data._안내 = 'scripts/fetch-paths.mjs 가 잰 값. walk·bike = OSM 길 거리(시간은 거리 ÷ 시속 4.7·15km), transit = 서울시 대중교통환승경로(탑승·환승 시간 + 정류장까지 도보 + 첫 대기 추정), transit.legs = 지도 경로 그림(TRANSIT.md). 없으면 앱은 직선거리 추정.'
data.pairs ??= {}
for (const c of CANDIDATES) for (const h of HUBS) {
  const old = data.pairs[`${c.id}:${h.id}`]
  const r = process.argv.includes('--transit') && old
    ? { ...old, transit: await transitPath([c.lat, c.lng], [h.lat, h.lng], old.walk?.min), at: new Date().toLocaleString('sv-SE').slice(0, 16) }
    : await measurePaths([c.lat, c.lng], [h.lat, h.lng])
  data.pairs[`${c.id}:${h.id}`] = { ...r, lat: c.lat, lng: c.lng }
  const t = r.transit
  console.log(`${c.name} → ${h.name}: 도보 ${r.walk ? `${r.walk.km}km ${r.walk.min}분` : '실패'} · 자전거 ${r.bike ? `${r.bike.min}분` : '실패'} · 대중교통 ${t ? `${t.min}분(탑승 ${t.ride} · 환승 ${t.transfers} · ${t.routes.join('→')})` : '경로 없음'}`)
}
fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n')
console.log('저장: src/paths.json')
