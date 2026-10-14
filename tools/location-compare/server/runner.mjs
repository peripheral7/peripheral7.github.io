// 새 좌표 하나의 상권·입지 요인을 계산한다 — scripts/stores.mjs analyze · scripts/places.mjs 를 "그대로" 돌려서.
//
// 왜 그대로 돌리나: 계산 규칙을 서버용으로 한 벌 더 만들면 두 벌이 서로 어긋난다. 대신 작업 폴더(server/.work/)에
// 저장소와 같은 모양의 작은 사본을 만들고, src/data.ts 만 "후보지 = 이 좌표 하나"로 바꿔 끼워 스크립트를 실행한 뒤
// 스크립트가 쓴 src/commercial.json · src/places.json 에서 그 후보지 줄만 꺼낸다.
//
// 스크립트·규칙 파일은 git HEAD(커밋된 판)에서 꺼낸다 — 공개 사이트 번들도 커밋된 판으로 빌드하므로 둘이 같은 규칙을 쓴다
// (다른 세션이 고치는 중인 미커밋 변경이 서버 결과에 섞이지 않는다).
// 큰 원본 자료(상가 DB·공원 경계·도서관·고도)는 하드링크/정션으로 붙이고, OSM·브이월드 캐시는 좌표마다 새로 받는다.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const TOOL = path.dirname(path.dirname(fileURLToPath(import.meta.url))) // tools/location-compare
const REPO = path.dirname(path.dirname(TOOL))
const WORK = path.join(TOOL, 'server', '.work') // = 사본의 "저장소 맨 위"
const WTOOL = path.join(WORK, 'tools', 'location-compare')

const FROM_HEAD = ['scripts/stores.mjs', 'scripts/places.mjs', 'src/commercial-categories.json', 'src/places-config.json']
const DEM = 'copdem30-N37E127.tif' // 위도 37~38 · 경도 127~128 만 덮는다

const OVERPASS_FETCH = `
async function overpassFetch(opts) { // server/runner.mjs 가 붙인 것: 미러를 돌며 JSON 이 올 때까지(두 바퀴)
  const urls = ['https://overpass-api.de/api/interpreter', 'https://z.overpass-api.de/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter']
  let last = ''
  for (let round = 0; round < 2; round++) for (const u of urls) {
    try {
      const r = await fetch(u, { ...opts, signal: AbortSignal.timeout(90000) })
      const t = await r.text()
      if (t.startsWith('{')) return new Response(t, { status: 200 })
      last = r.status + ' ' + t.slice(0, 120)
    } catch (e) { last = String(e) }
  }
  return new Response(last, { status: 502 })
}
`

// 이 폴더의 저장소 안 경로(블로그에서는 tools/location-compare/, 따로 떼어 낸 저장소에서는 빈 글자)
const PREFIX = execFileSync('git', ['rev-parse', '--show-prefix'], { cwd: TOOL }).toString().trim()
const gitShow = (rel) => execFileSync('git', ['show', `HEAD:${PREFIX}${rel}`], { cwd: TOOL, maxBuffer: 64 << 20 })
// 큰 원본 자료(공원 경계 Shapefile 폴더·도서관 xls)가 있는 곳: 블로그에서는 저장소 맨 위, 따로 떼어 낸 곳에서는 raw/ (places.mjs 와 같은 규칙)
const RAW = process.env.WHERETO_RAW_DIR || (fs.existsSync(path.join(TOOL, 'raw')) ? path.join(TOOL, 'raw') : REPO)

function link(src, dst) { // 파일 = 하드링크(같은 드라이브), 폴더 = 정션
  if (fs.existsSync(dst) || !fs.existsSync(src)) return
  if (fs.statSync(src).isDirectory()) fs.symlinkSync(src, dst, 'junction')
  else fs.linkSync(src, dst)
}

function prepare(lat, lng) {
  for (const d of ['scripts', 'src', 'data']) fs.mkdirSync(path.join(WTOOL, d), { recursive: true })
  for (const rel of FROM_HEAD) fs.writeFileSync(path.join(WTOOL, rel), gitShow(rel))
  // Overpass 주 서버는 자주 "too busy" — 사본에서만 미러를 차례로 시도하게 바꾼다(계산 규칙은 그대로)
  const pf = path.join(WTOOL, 'scripts', 'places.mjs')
  const src = fs.readFileSync(pf, 'utf8')
  const call = "await fetch('https://overpass-api.de/api/interpreter', "
  if (src.includes(call)) fs.writeFileSync(pf, src.replace(call, 'await overpassFetch(') + OVERPASS_FETCH)
  link(path.join(TOOL, 'node_modules'), path.join(WTOOL, 'node_modules'))
  fs.copyFileSync(path.join(TOOL, '.env.local'), path.join(WTOOL, '.env.local'))
  // 원본 자료(경로는 places-config.json 의 sources 기준, 저장소 맨 위)
  const cfg = JSON.parse(fs.readFileSync(path.join(WTOOL, 'src', 'places-config.json'), 'utf8'))
  for (const rel of [cfg.sources.parkShp, cfg.sources.libraryXls]) link(path.join(RAW, path.dirname(rel) === '.' ? rel : path.dirname(rel)), path.join(WORK, path.dirname(rel) === '.' ? rel : path.dirname(rel)))
  const data = path.join(TOOL, 'data'), wdata = path.join(WTOOL, 'data')
  for (const f of fs.readdirSync(data)) if (f === 'stores.sqlite' || f === 'libraries.csv' || /^baseline-.*\.json$/.test(f)) link(path.join(data, f), path.join(wdata, f))
  // 고도: 덮는 범위 안(여유 2km)일 때만 — 밖이면 경사 보정 없이
  const inDem = lat > 37.02 && lat < 37.98 && lng > 127.03 && lng < 127.97
  const wdem = path.join(wdata, DEM)
  if (inDem) link(path.join(data, DEM), wdem)
  else if (fs.existsSync(wdem)) fs.unlinkSync(wdem)
  // 좌표마다 새로 받아야 하는 캐시는 지운다
  for (const f of ['osm-places.json', 'vworld-roads.json']) fs.rmSync(path.join(wdata, f), { force: true })
  // 후보지 = 이 좌표 하나
  fs.writeFileSync(path.join(WTOOL, 'src', 'data.ts'),
    `export const CANDIDATES = [{ id: 'x', name: '새 후보지', address: '', lat: ${lat}, lng: ${lng} }]\nexport const HUBS = []\n`)
}

function run(script, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [path.join('scripts', script), ...args], { cwd: WTOOL, stdio: ['ignore', 'pipe', 'pipe'] })
    let err = ''
    p.stdout.resume()
    p.stderr.on('data', (d) => { err += d })
    const t = setTimeout(() => { p.kill(); reject(new Error(`${script} 시간 초과`)) }, timeoutMs)
    p.on('close', (code) => { clearTimeout(t); code === 0 ? resolve() : reject(new Error(`${script} 실패(${code}): ${err.slice(-500)}`)) })
  })
}

/** 좌표 하나 → { commercial: 줄(counts·brand·…) + majors, places: 줄, stdrYm, osmAt, at } */
export async function analyze(lat, lng) {
  prepare(lat, lng)
  await run('stores.mjs', ['analyze'], 120_000)
  await run('places.mjs', ['--refresh'], 240_000)
  const com = JSON.parse(fs.readFileSync(path.join(WTOOL, 'src', 'commercial.json'), 'utf8'))
  const pl = JSON.parse(fs.readFileSync(path.join(WTOOL, 'src', 'places.json'), 'utf8'))
  const majors = (com.majors ?? []).map(({ near, ...m }) => ({ ...m, near: { x: near.x } }))
  return { commercial: com.candidates.x, majors, places: pl.candidates.x, stdrYm: com.stdrYm, osmAt: pl.osmAt, at: new Date().toISOString() }
}

// 직접 실행: node server/runner.mjs 37.32 127.09
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const t0 = Date.now()
  const r = await analyze(Number(process.argv[2]), Number(process.argv[3]))
  console.log(JSON.stringify(r, null, 1).slice(0, 3000))
  console.log(`${((Date.now() - t0) / 1000).toFixed(1)}초`)
}
