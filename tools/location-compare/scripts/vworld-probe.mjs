// 브이월드 2D 데이터 API 2.0 확인용 — 키를 넣은 뒤 한 번 돌려 두 레이어의 실제 속성 이름을 본다(이 PC 에서만).
//   (1) 도로명주소 도로구간 — 도로 폭 필드(큰길 판정을 OSM 도로 등급에서 실제 폭으로 바꿀 때)
//   (2) 도시계획(공간시설) — 공원 경계·도형 소분류명(경기 밖 후보지, 또는 Shapefile 대신 API 로 받을 때)
//
// 사용(이 폴더에서): node scripts/vworld-probe.mjs        — 첫 후보지 둘레 300m 네모로 두 레이어를 몇 건씩 받아 속성을 출력
// 키: .env.local 의 VWORLD_API_KEY (브이월드 오픈API 인증키) — 키에 등록한 서비스 URL 을 domain 으로 보내야 한다(지금 https://peripheral7.github.io, 다르면 VWORLD_DOMAIN)
// 요청: https://api.vworld.kr/req/data?service=data&request=GetFeature&data=<서비스ID>&key=…&geomFilter=BOX(…)&crs=EPSG:4326&format=json
// 서비스 ID 는 레퍼런스 주소(…s003.do?svcIde=upisuq153 등)에서 짐작한 값이라, 틀리면 아래 LAYERS 만 고친다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CANDIDATES } from '../src/data.ts'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const env = {}
for (const l of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if (m && m[2]) env[m[1]] = m[2] }
const KEY = process.env.VWORLD_API_KEY || env.VWORLD_API_KEY
if (!KEY) { console.error('.env.local 의 VWORLD_API_KEY 가 비어 있다.'); process.exit(1) }

const LAYERS = [
  { id: 'LT_L_SPRD', label: '도로명주소 도로(구간)' },
  { id: 'LT_C_UPISUQ153', label: '도시계획(공간시설)' },
]
const c = CANDIDATES[0], d = 300 / 111320
const box = `BOX(${c.lng - d * 1.3},${c.lat - d},${c.lng + d * 1.3},${c.lat + d})`

for (const L of LAYERS) {
  const u = new URL('https://api.vworld.kr/req/data')
  u.search = new URLSearchParams({ service: 'data', request: 'GetFeature', data: L.id, key: KEY, domain: process.env.VWORLD_DOMAIN || env.VWORLD_DOMAIN || 'https://peripheral7.github.io', geomFilter: box, crs: 'EPSG:4326', format: 'json', size: '5', page: '1', geometry: 'false', attribute: 'true' })
  const r = await fetch(u)
  const t = await r.text()
  let j; try { j = JSON.parse(t) } catch { console.log(L.label, r.status, t.slice(0, 300)); continue }
  const st = j.response?.status, feats = j.response?.result?.featureCollection?.features ?? []
  console.log(`\n■ ${L.label} (${L.id}) — ${st}${j.response?.error ? ' ' + JSON.stringify(j.response.error) : ''} · ${feats.length}건`)
  for (const f of feats.slice(0, 5)) console.log('  ', JSON.stringify(f.properties))
}
