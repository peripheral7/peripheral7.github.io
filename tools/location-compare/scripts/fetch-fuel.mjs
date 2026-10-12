// 오피넷(한국석유공사) 무료 API 로 시도·시군구별 평균 휘발유 가격을 받아 src/fuel.json 에 적는다.
// 출퇴근 인사이트의 기름값 기본값 = 1순위 후보지가 있는 시군구 평균(없으면 시도 평균, 그것도 없으면 1,700원/L).
//
// 왜 미리 받아 두나: 공개 사이트(GitHub Pages)에서 방문자 브라우저가 오피넷을 부르면 인증키가 드러난다.
// 이 PC 에서 받아 결과만 올리면 공개 사이트에는 오피넷을 부르는 길이 없다(fetch-routes.mjs 와 같은 방식).
//
// 사용(이 폴더에서):
//   node scripts/fetch-fuel.mjs            # 받기 → src/fuel.json
//   node scripts/fetch-fuel.mjs --dry-run  # 부를 주소만 보여 주고 부르지 않음
//   그다음 npm run build → 커밋.
//
// 키: 이 폴더의 .env.local(git 제외) 또는 환경변수 OPINET_API_KEY(오피넷 무료 API 인증키, 요청 주소의 certkey= 값)
// 호출 수: 시도 목록 1 + 시도 평균 1 + 시도마다 시군구 평균 1(17개) ≈ 19회(무료 API 하루 한도 1,500회 안쪽).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(ROOT, 'src', 'fuel.json')
const BASE = 'https://www.opinet.co.kr/api'
const PRODCD = 'B027' // 보통휘발유
const dryRun = process.argv.includes('--dry-run')

const envFile = path.join(ROOT, '.env.local')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const KEY = process.env.OPINET_API_KEY
if (!KEY && !dryRun) {
  console.error('OPINET_API_KEY 가 비어 있습니다 — tools/location-compare/.env.local 에 넣고 저장한 뒤 다시 실행하세요.')
  process.exit(1) // 아직 아무 연결도 없으니 바로 끝내도 된다
}

const url = (api, q = {}) => `${BASE}/${api}?${new URLSearchParams({ out: 'json', certkey: KEY ?? '<키>', ...q })}`
const hide = (u) => u.replace(/certkey=[^&]+/, 'certkey=***')

async function call(api, q) {
  const u = url(api, q)
  if (dryRun) { console.log('  ', hide(u)); return [] }
  const res = await fetch(u)
  const text = await res.text()
  if (!res.ok) throw new Error(`${api} HTTP ${res.status}: ${text.slice(0, 200)}`)
  let json
  try { json = JSON.parse(text) } catch { throw new Error(`${api} 응답이 JSON 이 아닙니다(인증키 확인): ${text.slice(0, 200)}`) }
  const list = json?.RESULT?.OIL
  if (!Array.isArray(list)) throw new Error(`${api} 응답 모양이 예상과 다릅니다: ${text.slice(0, 300)}`)
  return list
}

// 필드 이름이 API 마다 조금씩 달라 후보 이름을 차례로 본다
const pick = (o, ...keys) => keys.map((k) => o[k]).find((v) => v !== undefined && v !== '')
const price = (o) => Math.round(Number(pick(o, 'PRICE')) * 10) / 10

const areas = await call('areaCode.do') // 시도 목록
const sidoAvg = await call('avgSidoPrice.do', { prodcd: PRODCD })
if (dryRun) console.log('   + 시도마다 avgSigunPrice.do?sido=XX&prodcd=B027')
else process.exitCode = await main()

// process.exit() 는 Windows 에서 fetch 연결이 닫히는 중이면 libuv 단언 오류를 낸다 → exitCode 만 정하고 자연스럽게 끝낸다
async function main() {
  console.log('시도 목록 예:', JSON.stringify(areas[0]), '· 시도 평균 예:', JSON.stringify(sidoAvg[0]))
  if (!areas.length && !sidoAvg.length) {
    // 오피넷은 키가 틀리거나 아직 승인 전이어도 HTTP 200 + 빈 목록({"RESULT":{"OIL":[]}})을 돌려준다
    console.error('오피넷이 빈 목록만 돌려줍니다 — 인증키가 받아들여지지 않았습니다(키 값·무료 API 승인 여부 확인). 파일은 바꾸지 않습니다.')
    return 1
  }
  const out = { at: new Date().toISOString(), source: 'opinet', prodcd: PRODCD, sido: {}, sigun: {} }
  for (const o of sidoAvg) {
    if (o.PRODCD && o.PRODCD !== PRODCD) continue
    const name = pick(o, 'SIDONM', 'AREA_NM'), p = price(o)
    if (name && p > 0 && name !== '전국') out.sido[name] = p
  }
  for (const a of areas) {
    const cd = pick(a, 'AREA_CD', 'SIDOCD'), sidoName = pick(a, 'AREA_NM', 'SIDONM')
    if (!cd || !sidoName) continue
    const list = await call('avgSigunPrice.do', { sido: cd, prodcd: PRODCD })
    for (const o of list) {
      if (o.PRODCD && o.PRODCD !== PRODCD) continue
      const name = String(pick(o, 'SIGUNNM', 'AREA_NM') ?? '').trim(), p = price(o)
      // 오피넷 시군구 이름은 "경기 수원시"처럼 시도가 앞에 붙어 온다(안 붙어 오면 붙인다)
      if (name && p > 0) out.sigun[name.startsWith(`${sidoName} `) ? name : `${sidoName} ${name}`] = p
    }
  }
  console.log(`시도 ${Object.keys(out.sido).length}곳 · 시군구 ${Object.keys(out.sigun).length}곳`)
  const sample = Object.entries(out.sigun).filter(([k]) => /수원|용인|성남/.test(k))
  console.log('예:', sample.map(([k, v]) => `${k} ${v}원`).join(' · ') || '(수원·용인·성남 없음 — 이름 확인 필요)')
  if (!Object.keys(out.sigun).length) { console.error('시군구 가격을 하나도 못 받았습니다 — 파일을 바꾸지 않습니다.'); return 1 }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log('→', path.relative(ROOT, OUT))
  return 0
}
