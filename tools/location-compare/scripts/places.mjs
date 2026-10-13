// 입지 요인 — 평화로움 · 공원 · 도서관을 후보지마다 계산해 src/places.json · PLACES.md 에 쓴다(이 PC 에서만).
// 공개 사이트는 이 결과 파일만 읽는다(외부 API 를 부르지 않는다).
//
// 사용(이 폴더에서):
//   node scripts/places.mjs            계산 → src/places.json · PLACES.md (OSM 은 하루 안에 받은 게 있으면 그것을 씀)
//   node scripts/places.mjs --refresh  OSM 을 새로 받기
//
// 자료(출처는 README 4-5절 "자료 출처"에도 같은 내용)
//   - 공원 경계: 국토교통부 도시계획시설(공간시설) UQ162, 경기도(41), 2026-08 — 저장소 맨 위 「국토계획공간시설(경기)/LSMD_CONT_UQ162_5174_41_202608.shp」
//     (좌표계 EPSG:5174 → proj4 로 WGS84). 공원 유형은 관리번호(MNUM)의 시설 코드 UQTxxxx 로 가른다(PARK_TYPES).
//   - 공원 이름(공간시설에 이름이 없을 때)·공원 안 산책로·물가·숲/풀밭·큰길: OpenStreetMap(Overpass API) — data/osm-places.json 에 저장
//   - 도서관: 공공데이터포털 전국도서관표준데이터(2026-10-13 내려받음) — 저장소 맨 위 「전국도서관표준데이터-20261013.xls」,
//     도서관유형 = 공공도서관만(작은도서관·어린이·학교·대학·전문·장애인 도서관 제외). xls 는 이 PC 의 Excel 로 data/libraries.csv 로 바꿔 읽는다.
//   - 큰길(도로 폭): 브이월드 2D 데이터 API 2.0 「도시계획(교통시설) 도로」 LT_C_UPISUQ151 — 도로 규모(광로·대로·중로·소로)와 1~3류로 법정 폭 구간을 안다.
//     .env.local 의 VWORLD_API_KEY(키에 등록한 서비스 URL 을 domain 으로: https://peripheral7.github.io). data/vworld-roads.json 에 저장. 키가 없으면 OSM 도로 등급으로.
//   - 60m 안 음식점·공원 양 끝 상권: 소상공인시장진흥공단 상가(상권)정보 data/stores.sqlite(scripts/stores-sync.mjs)
//
// 계산 규칙·숫자는 src/places-config.json, 설명은 README 4-5절.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import proj4 from 'proj4'
import { fromFile } from 'geotiff'
import { CANDIDATES } from '../src/data.ts'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const REPO = path.dirname(path.dirname(ROOT))
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'places-config.json'), 'utf8'))
const OSM_FILE = path.join(ROOT, 'data', 'osm-places.json')
const VW_FILE = path.join(ROOT, 'data', 'vworld-roads.json')
const ENV = {}
for (const l of (fs.existsSync(path.join(ROOT, '.env.local')) ? fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8') : '').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if (m && m[2]) ENV[m[1]] = m[2] }
/** 도시·군계획시설 도로 규모별 폭(m) — 「도시·군계획시설의 결정·구조 및 설치기준에 관한 규칙」 제9조 */
const ROAD_WIDTH = { 광로: { 1: '70m 이상', 2: '50~70m', 3: '40~50m' }, 대로: { 1: '35~40m', 2: '30~35m', 3: '25~30m' }, 중로: { 1: '20~25m', 2: '15~20m', 3: '12~15m' }, 소로: { 1: '10~12m', 2: '8~10m', 3: '8m 미만' } }
const DB_FILE = path.join(ROOT, 'data', 'stores.sqlite')
const SHP = path.join(REPO, CFG.sources.parkShp)
const LIB_XLS = path.join(REPO, CFG.sources.libraryXls)
const LIB_CSV = path.join(ROOT, 'data', 'libraries.csv')
const refresh = process.argv.includes('--refresh')
const EPSG5174 = '+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43'
const toWgs = proj4(EPSG5174, 'WGS84')

// 공간시설 시설 코드(MNUM 안 UQT + 4자리) → 공원 유형. 앞자리가 길게 맞는 것부터.
const PARK_TYPES = [
  ['2100', '어린이공원'], ['2101', '어린이공원'], ['2102', '어린이공원'], ['2103', '어린이공원'],
  ['220', '근린공원'], ['221', '문화공원'], ['222', '역사공원'], ['23', '도시농업공원'], ['24', '묘지공원'],
  ['250', '체육공원'], ['251', '수변공원'], ['26', '소공원'], ['29', '기타 공원(수변 등)'], ['20', '공원(유형 미상)'], ['6000', '도시자연공원구역'],
]
const GREEN_TYPES = [['30', '연결녹지'], ['31', '완충녹지'], ['32', '경관녹지'], ['33', '연결녹지'], ['39', '녹지']]
const typeOf = (code, table) => table.filter(([p]) => code.startsWith(p)).sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? null

// ── 좌표: 후보지 둘레 평면(m) ──
const LAT0 = CANDIDATES.reduce((a, c) => a + c.lat, 0) / CANDIDATES.length
const KX = 111320 * Math.cos((LAT0 * Math.PI) / 180), KY = 110540
const xy = (lat, lng) => [lng * KX, lat * KY]
const ring = (g) => g.map((p) => xy(p.lat, p.lon))
const area = (r) => Math.abs(r.reduce((a, p, i) => { const q = r[(i + 1) % r.length]; return a + p[0] * q[1] - q[0] * p[1] }, 0) / 2)
const perim = (r) => r.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - r[i - 1][0], p[1] - r[i - 1][1]) : 0), 0)
const inside = (pt, r) => { let c = false; for (let i = 0, k = r.length - 1; i < r.length; k = i++) { const [xi, yi] = r[i], [xk, yk] = r[k]; if ((yi > pt[1]) !== (yk > pt[1]) && pt[0] < ((xk - xi) * (pt[1] - yi)) / (yk - yi) + xi) c = !c } return c }
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy
  const t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
}
const lineDist = (p, line) => { let d = Infinity; for (let i = 1; i < line.length; i++) d = Math.min(d, segDist(p, line[i - 1], line[i])); return d }
const polyDist = (p, rings) => (rings.some((r) => inside(p, r)) ? 0 : Math.min(...rings.map((r) => lineDist(p, [...r, r[0]]))))
const centroid = (r) => [r.reduce((a, p) => a + p[0], 0) / r.length, r.reduce((a, p) => a + p[1], 0) / r.length]

// ── 고도: Copernicus DEM GLO-30(30m, 표면 높이 DSM) — data/copdem30-N37E127.tif(없으면 고도 보정 안 함) ──
// 받기: curl -o data/copdem30-N37E127.tif https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N37_00_E127_00_DEM/Copernicus_DSM_COG_10_N37_00_E127_00_DEM.tif
const DEM_FILE = path.join(ROOT, 'data', 'copdem30-N37E127.tif')
async function loadDem() {
  if (!fs.existsSync(DEM_FILE)) { console.warn('data/copdem30-N37E127.tif 없음 — 공원 경사 보정 안 함'); return null }
  const img = await (await fromFile(DEM_FILE)).getImage()
  const [ox, oy] = img.getOrigin(), [rx, ry] = img.getResolution() // ry < 0
  const x0 = Math.floor((BOX.w - ox) / rx), x1 = Math.ceil((BOX.e - ox) / rx), y0 = Math.floor((BOX.n - oy) / ry), y1 = Math.ceil((BOX.s - oy) / ry)
  const [r] = await img.readRasters({ window: [x0, y0, x1, y1] })
  const W = x1 - x0, H = y1 - y0
  const at = (i, j) => r[Math.max(0, Math.min(H - 1, j)) * W + Math.max(0, Math.min(W - 1, i))]
  return (lat, lng) => { // 쌍선형 보간(m)
    const fx = (lng - ox) / rx - x0 - 0.5, fy = (lat - oy) / ry - y0 - 0.5
    const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j
    return at(i, j) * (1 - u) * (1 - v) + at(i + 1, j) * u * (1 - v) + at(i, j + 1) * (1 - u) * v + at(i + 1, j + 1) * u * v
  }
}

// 계산할 네모(후보지 + 여유)
const M = CFG.fetchMargin / 111320
const BOX = {
  s: Math.min(...CANDIDATES.map((c) => c.lat)) - M, n: Math.max(...CANDIDATES.map((c) => c.lat)) + M,
  w: Math.min(...CANDIDATES.map((c) => c.lng)) - M * 1.3, e: Math.max(...CANDIDATES.map((c) => c.lng)) + M * 1.3,
}

// ── OSM 받기 ──
async function osm() {
  if (!refresh && fs.existsSync(OSM_FILE) && Date.now() - fs.statSync(OSM_FILE).mtimeMs < 86_400_000) return JSON.parse(fs.readFileSync(OSM_FILE, 'utf8'))
  const b = `(${BOX.s},${BOX.w},${BOX.n},${BOX.e})`
  const q = `[out:json][timeout:120];
(way["leisure"="park"]${b};relation["leisure"="park"]${b};)->.parks; .parks out geom tags;
(way["highway"~"^(footway|path|pedestrian|cycleway|track|steps)$"]${b};)->.paths; .paths out geom tags;
(way["natural"="water"]${b};relation["natural"="water"]${b};way["waterway"~"^(river|stream|canal)$"]${b};)->.water; .water out geom tags;
(way["landuse"~"^(forest|grass|meadow|recreation_ground|village_green)$"]${b};way["natural"~"^(wood|scrub|grassland)$"]${b};relation["landuse"="forest"]${b};relation["natural"="wood"]${b};)->.green; .green out geom tags;
(way["highway"~"^(motorway|trunk|primary|secondary)$"]${b};way["highway"]["name"~"대로$"]${b};)->.roads; .roads out geom tags;`
  console.log('OSM 받는 중…')
  const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'peripheral7-location-compare/1.0' } })
  const t = await r.text()
  if (!t.startsWith('{')) throw new Error(`Overpass 실패(${r.status}): ${t.slice(0, 200)}`)
  fs.mkdirSync(path.dirname(OSM_FILE), { recursive: true })
  fs.writeFileSync(OSM_FILE, t)
  return JSON.parse(t)
}

// ── 브이월드: 도시계획(교통시설) 도로 면 ──
async function vworldRoads() {
  const key = process.env.VWORLD_API_KEY || ENV.VWORLD_API_KEY
  if (!key) return null
  if (!refresh && fs.existsSync(VW_FILE) && Date.now() - fs.statSync(VW_FILE).mtimeMs < 86_400_000) return JSON.parse(fs.readFileSync(VW_FILE, 'utf8'))
  console.log('브이월드 도시계획 도로 받는 중…')
  const feats = []
  for (let page = 1; page < 50; page++) {
    const u = new URL('https://api.vworld.kr/req/data')
    u.search = new URLSearchParams({ service: 'data', request: 'GetFeature', data: 'LT_C_UPISUQ151', key, domain: process.env.VWORLD_DOMAIN || ENV.VWORLD_DOMAIN || 'https://peripheral7.github.io',
      geomFilter: `BOX(${BOX.w},${BOX.s},${BOX.e},${BOX.n})`, crs: 'EPSG:4326', format: 'json', size: '1000', page: String(page), geometry: 'true', attribute: 'true' })
    const j = await (await fetch(u)).json()
    if (j.response?.status === 'NOT_FOUND') break
    if (j.response?.status !== 'OK') throw new Error('브이월드 실패: ' + JSON.stringify(j.response?.error ?? j.response))
    feats.push(...j.response.result.featureCollection.features)
    if (page >= Number(j.response.page?.total ?? 1)) break
  }
  const out = feats.map((f) => ({ name: f.properties.dgm_nm, grade: f.properties.grad_se, ty: Number(f.properties.road_ty), exec: f.properties.exc_nam,
    polys: (f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]).map((poly) => poly[0]) }))
  fs.mkdirSync(path.dirname(VW_FILE), { recursive: true })
  fs.writeFileSync(VW_FILE, JSON.stringify(out))
  return out
}

// ── 공간시설 Shapefile(폴리곤) + DBF ──
function readShp(shpFile) {
  const shp = fs.readFileSync(shpFile), dbf = fs.readFileSync(shpFile.replace(/\.shp$/i, '.dbf'))
  // DBF 필드
  const n = dbf.readUInt32LE(4), hlen = dbf.readUInt16LE(8), rlen = dbf.readUInt16LE(10)
  const fields = []
  for (let o = 32; dbf[o] !== 0x0d; o += 32) fields.push({ name: dbf.slice(o, o + 11).toString('latin1').replace(/\0.*$/, ''), len: dbf[o + 16] })
  const dec = new TextDecoder('euc-kr')
  const rec = (i) => { let o = hlen + i * rlen + 1; const r = {}; for (const f of fields) { r[f.name] = dec.decode(dbf.slice(o, o + f.len)).trim(); o += f.len } return r }
  // 네모 안에 드는 것만(레코드 bbox 를 5174 로 비교 — 네모 네 귀를 5174 로 바꿔 둔다)
  const from = proj4('WGS84', EPSG5174)
  const corners = [[BOX.w, BOX.s], [BOX.e, BOX.s], [BOX.w, BOX.n], [BOX.e, BOX.n]].map((p) => from.forward(p))
  const bx = { x1: Math.min(...corners.map((p) => p[0])), x2: Math.max(...corners.map((p) => p[0])), y1: Math.min(...corners.map((p) => p[1])), y2: Math.max(...corners.map((p) => p[1])) }
  const out = []
  let off = 100, i = 0
  while (off < shp.length) {
    const len = shp.readInt32BE(off + 4) * 2, c = off + 8
    const type = shp.readInt32LE(c)
    if (type === 5) {
      const x1 = shp.readDoubleLE(c + 4), y1 = shp.readDoubleLE(c + 12), x2 = shp.readDoubleLE(c + 20), y2 = shp.readDoubleLE(c + 28)
      if (x2 >= bx.x1 && x1 <= bx.x2 && y2 >= bx.y1 && y1 <= bx.y2) {
        const np = shp.readInt32LE(c + 36), npt = shp.readInt32LE(c + 40)
        const parts = Array.from({ length: np }, (_, k) => shp.readInt32LE(c + 44 + k * 4))
        const p0 = c + 44 + np * 4
        const rings = parts.map((s, k) => {
          const e = k + 1 < np ? parts[k + 1] : npt
          const r = []
          for (let j = s; j < e; j++) { const [lng, lat] = toWgs.forward([shp.readDoubleLE(p0 + j * 16), shp.readDoubleLE(p0 + j * 16 + 8)]); r.push(xy(lat, lng)) }
          return r
        })
        const d = rec(i)
        out.push({ code: d.MNUM.match(/UQT(\d{4})/)?.[1] ?? '', alias: d.ALIAS, mnum: d.MNUM, rings })
      }
    }
    off = c + len; i++
  }
  return out
}

// ── 도서관(표준데이터 xls → csv) ──
function libraries() {
  if (!fs.existsSync(LIB_CSV) || fs.statSync(LIB_CSV).mtimeMs < fs.statSync(LIB_XLS).mtimeMs) {
    console.log('도서관 xls → csv(Excel)…')
    const ps = `$x=New-Object -ComObject Excel.Application;$x.DisplayAlerts=$false;$w=$x.Workbooks.Open('${LIB_XLS.replace(/'/g, "''")}',0,$true);$w.SaveAs('${LIB_CSV.replace(/'/g, "''")}',62);$w.Close($false);$x.Quit()`
    execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { stdio: 'inherit' })
  }
  const t = fs.readFileSync(LIB_CSV, 'utf8').replace(/^﻿/, '')
  const rows = []; let row = [], cur = '', q = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += ch }
    else if (ch === '"') q = true
    else if (ch === ',') { row.push(cur); cur = '' }
    else if (ch === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = '' }
    else cur += ch
  }
  const h = rows[0], col = (name) => h.indexOf(name)
  const [iN, iT, iLat, iLng, iA, iSeat, iBook, iDate] = ['도서관명', '도서관유형', '위도', '경도', '소재지도로명주소', '열람좌석수', '자료수(도서)', '데이터기준일자'].map(col)
  return rows.slice(1).filter((r) => CFG.library.types.includes(r[iT])).map((r) => ({ name: r[iN], type: r[iT], lat: +r[iLat], lng: +r[iLng], addr: r[iA], seats: +r[iSeat] || 0, books: +r[iBook] || 0, date: r[iDate] }))
    .filter((l) => l.lat > 33 && l.lng > 124)
}

async function main() {
  const els = (await osm()).elements
  const db = fs.existsSync(DB_FILE) ? new DatabaseSync(DB_FILE, { readOnly: true }) : null
  if (!db) console.warn('data/stores.sqlite 없음 — 60m 음식점·공원 연결성은 0 으로 본다(먼저 stores-sync.mjs)')
  const qBox = db?.prepare(`SELECT s.name, s.scls, s.lat, s.lon FROM stores_rtree r JOIN stores s ON s.id = r.id WHERE r.max_lon >= ? AND r.min_lon <= ? AND r.max_lat >= ? AND r.min_lat <= ?`)
  const storesNear = (lat, lng, rad) => {
    if (!qBox) return []
    const dLat = rad / KY, dLng = rad / KX, p = xy(lat, lng)
    return qBox.all(lng - dLng, lng + dLng, lat - dLat, lat + dLat).filter((s) => { const q = xy(s.lat, s.lon); return Math.hypot(q[0] - p[0], q[1] - p[1]) <= rad })
  }
  const isFood = (s) => CFG.peace.foodPrefix.some((p) => s.scls?.startsWith(p))

  // 공원 경계(공간시설) + OSM 이름
  const PK = CFG.park
  const elev = await loadDem()
  // 산길 감점: 공원 안 고저차(30m 격자 고도 상위 10% − 하위 10%)가 slope.flatM 이하면 그대로, slope.steepM 이상이면 slope.minMult 배(사이는 직선)
  // 산책로 경사(오르내림 합 ÷ 길이)도 재지만 숲 높이·30m 격자 잡음이 커서(평지 공원도 6~10%) 보고서에만 적는다
  const slopeMult = (h) => (!elev || h <= PK.slope.flatM ? 1 : Math.max(PK.slope.minMult, 1 - ((h - PK.slope.flatM) / (PK.slope.steepM - PK.slope.flatM)) * (1 - PK.slope.minMult)))
  const uq = readShp(SHP)
  const osmParks = els.filter((e) => e.tags?.leisure === 'park' && e.tags.name).map((e) => ({
    name: e.tags.name, rings: e.type === 'way' ? [ring(e.geometry)] : (e.members ?? []).filter((m) => m.role === 'outer' && m.geometry?.length > 3).map((m) => ring(m.geometry)),
  })).filter((p) => p.rings.length)
  const paths = els.filter((e) => e.tags?.highway && /^(footway|path|pedestrian|cycleway|track|steps)$/.test(e.tags.highway)).map((e) => ring(e.geometry))
  const waters = els.filter((e) => e.tags?.natural === 'water' || e.tags?.waterway).flatMap((e) => (e.geometry ? [ring(e.geometry)] : (e.members ?? []).filter((m) => m.geometry).map((m) => ring(m.geometry))))
  const toLL = (q) => [q[1] / KY, q[0] / KX]
  const parks = uq.map((u) => ({ ...u, type: typeOf(u.code, PARK_TYPES) })).filter((u) => u.type && !PK.excludeTypes.includes(u.type)).map((p) => {
    const a = p.rings.reduce((s, r) => s + area(r), 0)
    if (a < PK.minAreaM2) return null
    // 이름: 공간시설 별칭(ALIAS)이 "근린공원1"처럼 번호뿐이면 OSM 공원 이름(가운데가 이 경계 안에 드는 것 중 가장 큰 것)
    // OSM 공원의 가운데가 이 경계 안이거나, 꼭짓점 절반 이상이 이 경계 안이면 같은 공원으로 본다
    const share = (o) => { const v = o.rings.flat(); return v.filter((q) => p.rings.some((pr) => inside(q, pr))).length / v.length }
    const osmIn = osmParks.filter((o) => o.rings.some((r) => p.rings.some((pr) => inside(centroid(r), pr))) || share(o) >= 0.5).sort((x, y) => area(y.rings[0]) - area(x.rings[0]))
    const generic = !p.alias || /^(제?\d+호?\s*)?(근린|어린이|소|문화|수변|체육|역사|도시농업)?공원[\s\d\-()호]*$/.test(p.alias) || /^[A-Za-z0-9\-\s]+$/.test(p.alias)
    const name = (generic && osmIn[0]?.name) || p.alias || osmIn[0]?.name || `이름 없는 ${p.type}`
    const per = p.rings.reduce((s, r) => s + perim(r), 0)
    const pts = p.rings.flat()
    let walk = 0, rise = 0, run = 0 // rise·run: 공원 안 산책로를 slopeStepM 마다 잰 오르내림 합·길이
    const st = PK.slope.stepM
    for (const w of paths) {
      let h0 = null
      for (let i = 1; i < w.length; i++) {
        const mid = [(w[i][0] + w[i - 1][0]) / 2, (w[i][1] + w[i - 1][1]) / 2]
        const len = Math.hypot(w[i][0] - w[i - 1][0], w[i][1] - w[i - 1][1])
        if (!p.rings.some((r) => inside(mid, r))) { h0 = null; continue }
        walk += len
        if (!elev) continue
        const n = Math.max(1, Math.round(len / st))
        for (let k = h0 === null ? 0 : 1; k <= n; k++) {
          const q = [w[i - 1][0] + ((w[i][0] - w[i - 1][0]) * k) / n, w[i - 1][1] + ((w[i][1] - w[i - 1][1]) * k) / n]
          const h = elev(...toLL(q))
          if (h0 !== null) { rise += Math.abs(h - h0); run += len / n }
          h0 = h
        }
      }
    }
    // 고저차: 공원 안 격자(30m)의 고도 상위 10% − 하위 10%
    let relief = 0
    if (elev) {
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]), hs = []
      for (let x = Math.min(...xs); x <= Math.max(...xs); x += 30) for (let y = Math.min(...ys); y <= Math.max(...ys); y += 30) if (p.rings.some((r) => inside([x, y], r))) hs.push(elev(...toLL([x, y])))
      hs.sort((a, b) => a - b)
      if (hs.length >= 3) relief = hs[Math.floor(hs.length * 0.9)] - hs[Math.floor(hs.length * 0.1)]
    }
    const grade = run > 0 ? (rise / run) * 100 : 0 // 산책로 평균 경사(%)
    const walkUsed = walk > 0 ? walk : per * 0.5
    let ends = [pts[0], pts[0]], span = 0
    const step = Math.max(1, Math.floor(pts.length / 200))
    for (let i = 0; i < pts.length; i += step) for (let k = i + step; k < pts.length; k += step) {
      const d = Math.hypot(pts[i][0] - pts[k][0], pts[i][1] - pts[k][1]); if (d > span) { span = d; ends = [pts[i], pts[k]] }
    }
    const compact = (per * per) / (4 * Math.PI * a)
    const waterside = p.type === '수변공원' || waters.some((w) => w.some((q) => p.rings.some((r) => inside(q, r)))) || /수변|호수|천변|강변/.test(name)
    const endShops = ends.map((q) => { const [la, ln] = toLL(q); return storesNear(la, ln, PK.link.endRadiusM).length })
    const linked = span >= PK.link.minSpanM && compact >= PK.link.minCompact && endShops.every((n) => n >= PK.link.minShops)
    const base = Math.max(PK.minPoints, Math.min(10, PK.logA * Math.log10(walkUsed / PK.logL0)))
    const steep = slopeMult(relief)
    const value = Math.min(10, (base + (waterside ? PK.watersideBonus : 0)) * (linked ? PK.link.mult : 1)) * steep
    return { name, type: p.type, code: p.code, mnum: p.mnum, rings: p.rings, areaHa: +(a / 10000).toFixed(2), walkM: Math.round(walk), spanM: Math.round(span), compact: +compact.toFixed(1), waterside, endShops, linked, base: +base.toFixed(1), grade: +grade.toFixed(1), relief: Math.round(relief), steep: +steep.toFixed(2), value: +value.toFixed(1) }
  }).filter(Boolean)

  // 녹지(비율 계산용 면): 공간시설 공원·녹지 + OSM 숲·풀밭
  const greens = [
    ...parks.flatMap((p) => p.rings),
    ...uq.filter((u) => typeOf(u.code, GREEN_TYPES)).flatMap((u) => u.rings),
    ...els.filter((e) => (e.tags?.landuse || e.tags?.natural) && !e.tags?.waterway && e.tags?.natural !== 'water')
      .flatMap((e) => (e.geometry ? [ring(e.geometry)] : (e.members ?? []).filter((m) => m.role === 'outer' && m.geometry?.length > 3).map((m) => ring(m.geometry)))),
  ].filter((r) => r.length > 3)
  const PC = CFG.peace
  // 큰길: 브이월드 도시계획 도로(대로 이상 = 폭 25m 이상)가 있으면 그것, 없으면 OSM 도로 등급
  const vw = await vworldRoads()
  const osmRoads = els.filter((e) => e.tags?.highway && /^(motorway|trunk|primary|secondary|tertiary)$/.test(e.tags.highway) && e.tags.name).map((e) => ({ name: e.tags.name, line: ring(e.geometry) }))
  const roadSource = vw ? 'vworld' : 'osm'
  const roads = vw
    ? vw.filter((r) => PC.bigRoadGrades.includes(r.grade)).map((r) => {
        const rings = r.polys.map((poly) => poly.map(([lng, lat]) => xy(lat, lng)))
        // 도로 이름: 이 도로 면 안을 지나는 OSM 길 이름(없으면 도시계획 도로 번호)
        const nm = osmRoads.find((o) => o.line.some((q) => rings.some((rr) => inside(q, rr))))?.name
        return { name: `${nm ?? r.name.split('/').pop().replace(/[()]/g, '')} · ${r.grade}${r.ty}류(폭 ${ROAD_WIDTH[r.grade]?.[r.ty] ?? '?'})`, rings }
      })
    : els.filter((e) => e.tags?.highway && (PC.roadClasses.includes(e.tags.highway) || /대로$/.test(e.tags.name ?? '') || Number(e.tags.lanes) >= PC.roadMinLanes))
      .map((e) => ({ name: e.tags.name ?? e.tags.ref ?? e.tags.highway, line: ring(e.geometry) }))
  const libs = libraries()

  const out = {}
  for (const c of CANDIDATES) {
    const p = xy(c.lat, c.lng)
    // 평화로움
    const food = storesNear(c.lat, c.lng, PC.foodRadiusM).filter(isFood).length
    const road = roads.map((r) => ({ name: r.name, d: r.rings ? polyDist(p, r.rings) : lineDist(p, r.line) })).sort((a, b) => a.d - b.d)[0] ?? null
    const foodScore = food <= PC.foodFree ? 10 - PC.foodSmallPenalty * food : (10 - PC.foodSmallPenalty * PC.foodFree) * Math.pow(10, -(food - PC.foodFree) / PC.foodDecay)
    const roadScore = !road || road.d > PC.roadFarM ? 10 : road.d > PC.roadNearM ? PC.roadMidScore : 0
    // 반경 greenRadiusM 안 녹지 비율(공원 쪽 녹지 비율과 같은 격자 방식)
    let gIn = 0, gAll = 0
    for (let dx = -PC.greenRadiusM; dx <= PC.greenRadiusM; dx += PK.greenGridM) for (let dy = -PC.greenRadiusM; dy <= PC.greenRadiusM; dy += PK.greenGridM) {
      if (dx * dx + dy * dy > PC.greenRadiusM ** 2) continue
      gAll++; const q = [p[0] + dx, p[1] + dy]
      if (greens.some((r) => inside(q, r))) gIn++
    }
    const green300 = gIn / gAll
    const greenScore300 = Math.min(10, (10 * green300) / PC.greenFullRatio)
    const peace = foodScore * PC.wFood + roadScore * PC.wRoad + greenScore300 * PC.wGreen
    // 공원
    const near = parks.map((k) => ({ k, d: polyDist(p, k.rings) })).filter((x) => x.d <= PK.radiusM)
      .map((x) => ({ ...x, eff: x.k.value * (x.d <= PK.fullM ? 1 : 1 - (1 - PK.farFactor) * (x.d - PK.fullM) / (PK.radiusM - PK.fullM)) }))
      .sort((a, b) => b.eff - a.eff)
    let inG = 0, all = 0
    for (let dx = -PK.radiusM; dx <= PK.radiusM; dx += PK.greenGridM) for (let dy = -PK.radiusM; dy <= PK.radiusM; dy += PK.greenGridM) {
      if (dx * dx + dy * dy > PK.radiusM ** 2) continue
      all++; const q = [p[0] + dx, p[1] + dy]
      if (greens.some((r) => inside(q, r))) inG++
    }
    const green = inG / all
    const greenBonus = PK.greenBonus.find((g) => green >= g.min)?.add ?? 0
    const second = near[1] ? near[1].eff * PK.secondShare : 0
    const parkScore = Math.min(10, (near[0]?.eff ?? 0) + second + greenBonus)
    // 도서관(공공도서관): 가장 가까운 곳까지 거리
    const LB = CFG.library
    const libNear = libs.map((l) => ({ ...l, d: Math.hypot(...((q) => [q[0] - p[0], q[1] - p[1]])(xy(l.lat, l.lng))) })).sort((a, b) => a.d - b.d).slice(0, 3)
    const d0 = libNear[0]?.d ?? Infinity
    const libScore = d0 <= LB.fullM ? 10 : d0 <= LB.halfM ? 10 - 5 * (d0 - LB.fullM) / (LB.halfM - LB.fullM) : d0 <= LB.zeroM ? 5 - 5 * (d0 - LB.halfM) / (LB.zeroM - LB.halfM) : 0

    out[c.id] = {
      name: c.name, lat: c.lat, lng: c.lng,
      peace: { score: +peace.toFixed(1), food, foodScore: +foodScore.toFixed(1), road: road ? { name: road.name, dist: Math.round(road.d) } : null, roadScore, green: +(green300 * 100).toFixed(0), greenScore: +greenScore300.toFixed(1) },
      park: {
        score: +parkScore.toFixed(1), green: +(green * 100).toFixed(0), greenBonus,
        parks: near.slice(0, 5).map((x) => ({ name: x.k.name, type: x.k.type, dist: Math.round(x.d), value: x.k.value, eff: +x.eff.toFixed(1), areaHa: x.k.areaHa, walkM: x.k.walkM, waterside: x.k.waterside, linked: x.k.linked, relief: x.k.relief, steep: x.k.steep })),
      },
      library: { score: +libScore.toFixed(1), near: libNear.map((l) => ({ name: l.name, dist: Math.round(l.d), seats: l.seats, books: l.books })) },
    }
  }
  const json = {
    sources: CFG.sources.list, osmAt: new Date(fs.statSync(OSM_FILE).mtimeMs).toISOString().slice(0, 10), libraryAt: libs[0]?.date ?? '', generatedAt: new Date().toISOString().slice(0, 10), candidates: out,
  }
  fs.writeFileSync(path.join(ROOT, 'src', 'places.json'), JSON.stringify(json, null, 2) + '\n')

  // 지도 "산책" 레이어: 공원 점수가 mapMinValue 이상인 공원 경계(단순화한 위경도) → src/park-areas.json
  const simplify = (r, tol) => { // Douglas–Peucker(평면 m)
    if (r.length < 4) return r
    const keep = new Uint8Array(r.length); keep[0] = keep[r.length - 1] = 1
    const st = [[0, r.length - 1]]
    while (st.length) {
      const [a, b] = st.pop(); let md = 0, mi = -1
      for (let i = a + 1; i < b; i++) { const d = segDist(r[i], r[a], r[b]); if (d > md) { md = d; mi = i } }
      if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]) }
    }
    return r.filter((_, i) => keep[i])
  }
  const areas = parks.filter((k) => k.value >= PK.mapMinValue).sort((a, b) => b.value - a.value).map((k) => ({
    name: k.name, type: k.type, value: k.value,
    rings: k.rings.map((r) => simplify(r, PK.mapSimplifyM)).filter((r) => r.length >= 3).map((r) => r.map((q) => { const [la, ln] = toLL(q); return [+la.toFixed(5), +ln.toFixed(5)] })),
  })).filter((k) => k.rings.length)
  fs.writeFileSync(path.join(ROOT, 'src', 'park-areas.json'), JSON.stringify({ minValue: PK.mapMinValue, parks: areas }) + '\n')
  console.log(`park-areas.json: 공원 ${areas.length}곳(점수 ${PK.mapMinValue} 이상), 꼭짓점 ${areas.reduce((a, k) => a + k.rings.flat().length, 0)}`)

  // 보고서
  const ids = CANDIDATES.map((c) => c.id)
  const head = `| | ${ids.map((id) => out[id].name).join(' | ')} |\n|---|${ids.map(() => '---:').join('|')}|`
  const typeCount = {}
  for (const k of parks) typeCount[k.type] = (typeCount[k.type] ?? 0) + 1
  const L = [`# 입지 요인 — 평화로움 · 공원 · 도서관`, '', `\`node scripts/places.mjs\` 가 만든다(손으로 고치지 말 것). 만든 날 ${json.generatedAt}. 규칙은 \`src/places-config.json\`, 설명은 README 4-5절.`, '',
    '## 자료 출처', '', ...CFG.sources.list.map((s) => `- ${s}`), `- OSM 받은 날 ${json.osmAt} · 도서관 데이터기준일자 ${json.libraryAt}`, '',
    '## 🕊️ 평화로움', '', head,
    `| 60m 안 음식점·주점 | ${ids.map((id) => `${out[id].peace.food} → ${out[id].peace.foodScore}`).join(' | ')} |`,
    `| ${PC.greenRadiusM}m 안 녹지 비율 | ${ids.map((id) => `${out[id].peace.green}% → ${out[id].peace.greenScore}`).join(' | ')} |`,
    `| 가장 가까운 큰길 | ${ids.map((id) => { const r = out[id].peace.road; return r ? `${r.dist}m ${r.name} → ${out[id].peace.roadScore}` : '없음 → 10' }).join(' | ')} |`,
    `| **평화로움** | ${ids.map((id) => `**${out[id].peace.score}**`).join(' | ')} |`, '',
    '## 🌳 공원', '', head,
    `| 가장 좋은 공원(거리 반영) | ${ids.map((id) => { const k = out[id].park.parks[0]; return k ? `${k.name}(${k.type}) ${k.dist}m · ${k.value}점${k.linked ? '(연결 ×1.8)' : ''}${k.steep < 1 ? `(산길 ×${k.steep})` : ''} → ${k.eff}` : `${PK.radiusM}m 안 없음` }).join(' | ')} |`,
    `| 두 번째 공원 | ${ids.map((id) => { const k = out[id].park.parks[1]; return k ? `${k.name} ${k.dist}m → ${k.eff}` : '—' }).join(' | ')} |`,
    `| ${PK.radiusM}m 안 녹지 비율 | ${ids.map((id) => `${out[id].park.green}% → +${out[id].park.greenBonus}`).join(' | ')} |`,
    `| **공원** | ${ids.map((id) => `**${out[id].park.score}**`).join(' | ')} |`, '',
    `### 계산 범위 안 공원 유형(공간시설, ${PK.minAreaM2 / 10000}ha 이상, 제외 유형: ${PK.excludeTypes.join('·') || '없음'})`, '', Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '), '',
    `### 공원별 점수(후보지 ${PK.radiusM}m 안)`, '', '| 공원 | 유형 | 면적 | 산책로 | 길이 | 물가 | 양 끝 상권 | 연결 | 산책로 경사 | 고저차 | 경사 배율 | 점수 |', '|---|---|---:|---:|---:|:---:|---:|:---:|---:|---:|---:|---:|',
    ...parks.filter((k) => CANDIDATES.some((c) => polyDist(xy(c.lat, c.lng), k.rings) <= PK.radiusM)).sort((a, b) => b.value - a.value)
      .map((k) => `| ${k.name} | ${k.type} | ${k.areaHa}ha | ${k.walkM}m | ${k.spanM}m | ${k.waterside ? '○' : ''} | ${k.endShops.join('·')} | ${k.linked ? '×1.8' : ''} | ${k.grade}% | ${k.relief}m | ×${k.steep} | ${k.value} |`), '',
    '## 📚 도서관(공공도서관)', '', head,
    ...[0, 1, 2].map((i) => `| ${i + 1}번째로 가까운 곳 | ${ids.map((id) => { const l = out[id].library.near[i]; return l ? `${l.name} ${l.dist}m` : '—' }).join(' | ')} |`),
    `| **도서관** | ${ids.map((id) => `**${out[id].library.score}**`).join(' | ')} |`, '',
  ]
  fs.writeFileSync(path.join(ROOT, 'PLACES.md'), L.join('\n'))
  console.log(L.join('\n'))
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(1) })
