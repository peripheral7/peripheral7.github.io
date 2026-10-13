// data/stores.sqlite(scripts/stores-sync.mjs 가 받은 상가(상권)정보)를 찾아보고, 후보지별 상권을 분석한다.
// API 를 부르지 않는다 — 받아 둔 파일만 읽는다.
//
// 사용(이 폴더에서):
//   node scripts/stores.mjs info                                  기준월·지역·업소 수
//   node scripts/stores.mjs codes [검색어]                        업종 코드(대·중·소). 예: codes 카페
//   node scripts/stores.mjs near 37.2486 127.0556 [--r 500]       반경 안 분류별 개수
//        [--cat cafe | --scls I21201 | --name 다이소] [--list]    고른 것만, --list 면 가까운 순 목록
//   node scripts/stores.mjs near 망포역                           위도·경도 대신 후보지 이름(src/data.ts)이나 받은 상호
//   node scripts/stores.mjs find 다이소 [--near 37.24,127.06] [--r 3000]   상호 검색(이름·지점·건물명)
//   node scripts/stores.mjs analyze                               후보지별 분석 → src/commercial.json · COMMERCIAL.md
//
// 분류(카페·잡화(화장품+생활용품)·마트·의료)는 src/commercial-categories.json 에서 고친다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { CANDIDATES, HUBS } from '../src/data.ts'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const DB_FILE = path.join(ROOT, 'data', 'stores.sqlite')
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'commercial-categories.json'), 'utf8'))
const CATS = CONFIG.categories

const [cmd, ...rest] = process.argv.slice(2)
const opt = (k, d) => (rest.includes(k) ? rest[rest.indexOf(k) + 1] : d)
const flag = (k) => rest.includes(k)
const VALUE_OPTS = ['--r', '--cat', '--scls', '--name', '--limit', '--near']
const positional = rest.filter((a, i) => !a.startsWith('--') && !VALUE_OPTS.includes(rest[i - 1]))

if (!fs.existsSync(DB_FILE)) { console.error('data/stores.sqlite 가 없다 — 먼저 node scripts/stores-sync.mjs'); process.exit(1) }
const db = new DatabaseSync(DB_FILE, { readOnly: true })
const meta = Object.fromEntries(db.prepare('SELECT k, v FROM meta').all().map((x) => [x.k, x.v]))
const upName = Object.fromEntries(db.prepare('SELECT code, name FROM upjong').all().map((x) => [x.code, x.name]))

// ── 분류 맞추기 ──
function matches(rule, s) {
  if (rule.any_of) return rule.any_of.some((r) => matches(r, s)) // 묶음 업종(예: 잡화 = 화장품 + 생활용품)
  if (rule.exclude?.includes(s.scls)) return false
  if (rule.exclude_names?.some((n) => s.name?.includes(n))) return false
  const byName = rule.names?.some((n) => s.name?.includes(n)) && (!rule.names_scls || rule.names_scls.includes(s.scls))
  if (byName) return true
  const byCode = rule.scls?.includes(s.scls) || rule.prefix?.some((p) => s.scls?.startsWith(p))
  // indie_floor_max: 브랜드가 아닌 곳은 그 층 이하(지하·층 미상 포함)만 — 2층 위 "화장품 소매업" 은 대개 관리실
  if (byCode && rule.indie_floor_max != null && floorNum(s.floor) > rule.indie_floor_max) return false
  return Boolean(byCode)
}
const floorNum = (f) => { const n = parseInt(String(f ?? '').replace(/[^0-9-]/g, ''), 10); return /^(B|지하)/i.test(String(f ?? '')) || Number.isNaN(n) ? 0 : n }
const catOf = (s) => CATS.filter((c) => matches(c, s)).map((c) => c.id)

// ── 반경 검색(R-tree 로 네모를 고른 뒤 실제 거리로 자른다) ──
const qBox = db.prepare(`SELECT s.* FROM stores_rtree r JOIN stores s ON s.id = r.id
  WHERE r.max_lon >= ? AND r.min_lon <= ? AND r.max_lat >= ? AND r.min_lat <= ?`)
function dist(lat1, lng1, lat2, lng2) {
  const R = 6371000, rad = Math.PI / 180
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
function within(lat, lng, r) {
  const dLat = r / 111320, dLng = r / (111320 * Math.cos((lat * Math.PI) / 180))
  return qBox.all(lng - dLng, lng + dLng, lat - dLat, lat + dLat)
    .map((s) => ({ ...s, d: dist(lat, lng, s.lat, s.lon) }))
    .filter((s) => s.d <= r)
    .sort((a, b) => a.d - b.d)
}

// "37.2,127.0" · "37.2 127.0" · 후보지/목적지 이름 · 상호 이름 → 좌표
function resolvePoint(words) {
  const nums = words.join(' ').split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n))
  if (nums.length >= 2) return { lat: nums[0], lng: nums[1], label: `${nums[0]}, ${nums[1]}` }
  const q = words.join(' ')
  const p = [...CANDIDATES, ...HUBS].find((x) => x.name.includes(q) || x.id === q)
  if (p) return { lat: p.lat, lng: p.lng, label: p.name }
  const s = searchName(q, 1)[0]
  if (s) return { lat: s.lat, lng: s.lon, label: `${s.name}${s.branch ? ' ' + s.branch : ''}` }
  console.error(`위치를 못 찾음: ${q}`); process.exit(1)
}
function searchName(q, limit = 50) {
  if ([...q].length >= 3) {
    return db.prepare(`SELECT s.* FROM stores_fts f JOIN stores s ON s.id = f.rowid WHERE stores_fts MATCH ? LIMIT ?`)
      .all(`"${q.replaceAll('"', '""')}"`, limit)
  }
  const like = `%${q}%` // 트라이그램 색인은 세 글자 이상만 — 짧으면 그냥 훑는다
  return db.prepare('SELECT * FROM stores WHERE name LIKE ? OR branch LIKE ? LIMIT ?').all(like, like, limit)
}

const m = (d) => `${Math.round(d)}m`
const label = (s) => `${s.name}${s.branch ? ' ' + s.branch : ''}`
const line = (s) => `${m(s.d ?? 0).padStart(6)}  ${label(s)}  · ${upName[s.scls] ?? s.scls}  · ${s.road_addr ?? s.lot_addr ?? ''}${s.floor ? ` ${s.floor}층` : ''}`

// ── 분석 ──
// 같은 상호·주소·층이 두 번 등록된 경우(예: 엔프라니 2건)는 한 곳으로
function dedupe(list) {
  const seen = new Set()
  return list.filter((s) => { const k = `${s.name}|${s.road_addr ?? s.lot_addr}|${s.floor ?? ''}`; return seen.has(k) ? false : (seen.add(k), true) })
}
// brand_part(예: 화장품의 올리브영): 상호가 브랜드로 시작하는 매장 수(80m 안 같은 브랜드는 한 곳 — 입점 매장 중복 방지)
function brandCount(rule, list) {
  const got = []
  for (const s of list) if (startsBrand(rule, s) && !got.some((g) => dist(g.lat, g.lon, s.lat, s.lon) < 80)) got.push(s)
  return got
}

function analyzePoint(lat, lng) {
  const radii = CONFIG.radii
  const all = dedupe(within(lat, lng, Math.max(...radii)))
  const out = { total: {}, counts: {}, brand: {}, sub: {}, nearest: {} }
  for (const c of CATS.filter((x) => x.brand_part)) {
    const got = brandCount(c.brand_part, all).map((s) => s.d)
    out.brand[c.id] = Object.fromEntries(radii.map((r) => [r, got.filter((d) => d <= r).length]))
  }
  for (const r of radii) out.total[r] = all.filter((s) => s.d <= r).length
  for (const c of CATS) {
    const hit = all.filter((s) => matches(c, s))
    out.counts[c.id] = Object.fromEntries(radii.map((r) => [r, hit.filter((s) => s.d <= r).length]))
    if (hit[0]) out.nearest[c.id] = { name: label(hit[0]), dist: Math.round(hit[0].d), kind: upName[hit[0].scls] ?? hit[0].scls }
    for (const sub of c.sub ?? []) {
      const sh = all.filter((s) => matches(sub, s))
      out.sub[`${c.id}:${sub.label}`] = { ...Object.fromEntries(radii.map((r) => [r, sh.filter((s) => s.d <= r).length])), nearest: sh[0] ? Math.round(sh[0].d) : null }
    }
  }
  return out
}

// 주요 매장(올리브영·다이소·이마트 등) — 규칙은 commercial-categories.json 의 _majors
const PREFIX = /^(씨제이|CJ|\(주\)|주식회사|롯데쇼핑|이마트_|\s)+/i
const startsBrand = (m, s) => m.names.some((n) => (s.name ?? '').replace(PREFIX, '').startsWith(n)) &&
  !m.exclude_names?.some((n) => s.name?.includes(n)) && (!m.names_scls || m.names_scls.includes(s.scls))
function majorsNear() {
  const out = []
  const add = (b, c, x) => {
    const d = Math.round(dist(c.lat, c.lng, x.lat, x.lng))
    const dup = out.find((o) => o.brand === b.brand && dist(o.lat, o.lng, x.lat, x.lng) < 80)
    if (dup) { if (!dup.near[c.id] || d < dup.near[c.id]) dup.near[c.id] = d; return }
    out.push({ brand: b.brand, cat: b.cat, ...x, lat: +x.lat.toFixed(6), lng: +x.lng.toFixed(6), near: { [c.id]: d } })
  }
  for (const c of CANDIDATES) {
    const list = within(c.lat, c.lng, CONFIG.majorsRadius)
    for (const s of list) {
      const b = CONFIG.majors.find((m) => startsBrand(m, s))
      if (b) add(b, c, { name: label(s), lat: s.lat, lng: s.lon, addr: s.road_addr ?? s.lot_addr ?? '' })
    }
    for (const b of CONFIG.majors.filter((m) => m.infer)) { // 대형마트: 입점 매장으로 추정
      const groups = {}
      for (const s of list) {
        if (!s.road_addr || !b.names.some((n) => s.name?.includes(n)) || b.infer_exclude?.some((n) => s.name?.includes(n))) continue
        ;(groups[s.road_addr] ??= []).push(s)
      }
      for (const [addr, g] of Object.entries(groups)) {
        if (g.length < b.infer) continue
        add(b, c, { name: `${b.brand}(입점 매장 ${g.length}곳으로 추정)`, lat: g.reduce((a, s) => a + s.lat, 0) / g.length, lng: g.reduce((a, s) => a + s.lon, 0) / g.length, addr, inferred: true })
      }
    }
  }
  return out.sort((a, b) => a.brand.localeCompare(b.brand, 'ko') || a.name.localeCompare(b.name, 'ko'))
}

/** 값이 기준 이상인 비율(%) */
const reach = (a, t) => (a?.length ? Math.round((a.filter((x) => x >= t).length / a.length) * 100) : null)

// ── 평균 비교(기준 개수를 정할 근거) ──
// 경기·서울 전체에 약 1.1km 간격 격자점을 찍고, 500m 안 업소가 BASE_MIN 곳 이상인 점(= 사람이 사는 생활권)만 골라
// 업종별 개수의 분포(중앙값·상위 25%·상위 10%)를 낸다. 기준월마다 data/baseline-<기준월>.json 에 저장해 두고 다시 쓴다.
const BASE_MIN = 100
function baseline() {
  const file = path.join(ROOT, 'data', `baseline-${meta.stdr_ym}-${CONFIG.walk5}.json`)
  if (fs.existsSync(file)) {
    const old = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (CATS.every((c) => old.cats[c.id] && (!c.brand_part || old.brand[c.id]))) return old // 업종이 바뀌었으면 다시 계산
  }
  console.log('생활권 평균 비교 계산 중(약 20초, 기준월마다 한 번)…')
  const W = CONFIG.walk5
  const b = db.prepare('SELECT MIN(lat) a, MAX(lat) b, MIN(lon) c, MAX(lon) d FROM stores WHERE lat > 33 AND lon > 124').get()
  const vals = Object.fromEntries(CATS.map((c) => [c.id, []]))
  const brand = Object.fromEntries(CATS.filter((c) => c.brand_part).map((c) => [c.id, []]))
  let n = 0
  for (let lat = b.a; lat <= b.b; lat += 0.01) for (let lng = b.c; lng <= b.d; lng += 0.0125) {
    const list = dedupe(within(lat, lng, W))
    if (list.length < BASE_MIN) continue
    n++
    for (const c of CATS) vals[c.id].push(list.filter((s) => matches(c, s)).length)
    for (const id of Object.keys(brand)) brand[id].push(brandCount(CATS.find((c) => c.id === id).brand_part, list).length)
  }
  const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))] }
  const sum = (a) => ({ p50: q(a, 0.5), p75: q(a, 0.75), p90: q(a, 0.9), mean: Math.round(a.reduce((x, y) => x + y, 0) / a.length * 10) / 10, zero: Math.round(a.filter((x) => x === 0).length / a.length * 100) })
  const out = { points: n, min: BASE_MIN, radius: W, cats: Object.fromEntries(Object.entries(vals).map(([k, a]) => [k, sum(a)])), brand: Object.fromEntries(Object.entries(brand).map(([k, a]) => [k, sum(a)])) }
  fs.writeFileSync(file, JSON.stringify({ ...out, raw: vals, rawBrand: brand }))
  return { ...out, raw: vals, rawBrand: brand }
}

function analyze() {
  const radii = CONFIG.radii
  const res = {}
  for (const c of CANDIDATES) res[c.id] = { name: c.name, address: c.address, lat: c.lat, lng: c.lng, ...analyzePoint(c.lat, c.lng) }
  const majors = majorsNear()
  // 본점이 자료에 없어 입점 매장으로 추정한 대형마트는 마트 개수에 더한다
  for (const id of Object.keys(res)) for (const r of radii) {
    res[id].counts.mart[r] += majors.filter((x) => x.inferred && x.cat === 'mart' && x.near[id] != null && x.near[id] <= r).length
  }
  const base = baseline()
  const json = {
    source: '소상공인시장진흥공단 상가(상권)정보', stdrYm: meta.stdr_ym, generatedAt: new Date().toISOString().slice(0, 10), radii, walk5: CONFIG.walk5, enough: CONFIG.enough, baseline: base,
    brandParts: Object.fromEntries(CATS.filter((c) => c.brand_part).map((c) => [c.id, { label: c.brand_part.label, enough: c.brand_part.enough, weight: c.brand_part.weight }])),
    categories: CATS.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji, sub: (c.sub ?? []).map((s) => s.label) })),
    defaultPrefs: CONFIG.defaultPrefs, candidates: res, majorsRadius: CONFIG.majorsRadius, majors,
  }
  fs.writeFileSync(path.join(ROOT, 'src', 'commercial.json'), JSON.stringify(json, null, 2) + '\n')

  // 보고서(마크다운)
  const ids = CANDIDATES.map((c) => c.id)
  const head = (cols) => `| | ${cols.join(' | ')} |\n|---|${cols.map(() => '---:').join('|')}|`
  const L = []
  L.push(`# 후보지별 상권 분석`, '', `자료: 소상공인시장진흥공단 상가(상권)정보 기준월 **${meta.stdr_ym}** · 만든 날 ${json.generatedAt} · \`node scripts/stores.mjs analyze\` 가 만든다(손으로 고치지 말 것).`,
    `분류 정의는 \`src/commercial-categories.json\`. 거리는 직선거리(도보 시간 아님). 업소 등록 자료라 폐업 반영이 늦을 수 있다.`, '')
  for (const r of radii) {
    L.push(`## 반경 ${r.toLocaleString()}m`, '', head(ids.map((id) => res[id].name)))
    L.push(`| 전체 업소 | ${ids.map((id) => res[id].total[r].toLocaleString()).join(' | ')} |`)
    for (const c of CATS) {
      L.push(`| ${c.emoji} ${c.label} | ${ids.map((id) => res[id].counts[c.id][r]).join(' | ')} |`)
      for (const s of c.sub ?? []) L.push(`| &nbsp;&nbsp;└ ${s.label} | ${ids.map((id) => res[id].sub[`${c.id}:${s.label}`][r]).join(' | ')} |`)
    }
    L.push('')
  }
  // 상권 지수(기본 선택) — 화면(src/commercial.ts)과 같은 식
  const W = CONFIG.walk5, E = CONFIG.enough, P = CONFIG.defaultPrefs
  const f = (n, t) => 10 * (1 - Math.pow(10, -n / t))
  const sc = (id, k) => { // brand_part 가 있으면(화장품) 개수 점수 × (1−w) + 브랜드 점수 × w
    const bp = CATS.find((c) => c.id === k).brand_part
    const base = f(res[id].counts[k][W], E[k])
    return bp ? base * (1 - bp.weight) + f(res[id].brand[k][W], bp.enough) * bp.weight : base
  }
  const cell = (id, k) => { const bp = CATS.find((c) => c.id === k).brand_part; return `${res[id].counts[k][W]}${bp ? ` · ${bp.label} ${res[id].brand[k][W]}` : ''} → ${sc(id, k).toFixed(1)}` }
  const avg = (id, ks) => ks.reduce((a, k) => a + sc(id, k), 0) / ks.length
  L.push(`## 상권 지수(기본 선택, 반경 ${W}m)`, '', `필수 ${P.need.map((k) => CATS.find((c) => c.id === k).label).join('·')} × 0.8 + 선호 ${P.want.map((k) => CATS.find((c) => c.id === k).label).join('·')} × 0.2. 업종 점수 = 10 × (1 − 10^(−개수/기준)), 기준에서 9점. 화장품 = 개수 점수 50% + 올리브영 점수 50%(기준 1곳).`, '', head(ids.map((id) => res[id].name)))
  for (const c of CATS) L.push(`| ${c.emoji} ${c.label} (기준 ${E[c.id]}) | ${ids.map((id) => cell(id, c.id)).join(' | ')} |`)
  L.push(`| **지수** | ${ids.map((id) => `**${(avg(id, P.need) * 0.8 + avg(id, P.want) * 0.2).toFixed(1)}**`).join(' | ')} |`, '')
  // 생활권 평균 비교 — 기준 개수의 근거
  L.push(`## 생활권 평균 비교(기준 개수의 근거)`, '', `경기·서울에 약 1.1km 간격 격자점을 찍고, 반경 ${base.radius}m 안 업소가 ${base.min}곳 이상인 점(사람이 사는 생활권) **${base.points}곳**의 분포. "기준 이상"은 기준 개수를 채운(9점 이상) 생활권 비율.`, '',
    '| 업종 | 중앙값 | 평균 | 상위 25% | 상위 10% | 0곳인 비율 | 기준 | 기준 이상 |', '|---|---:|---:|---:|---:|---:|---:|---:|')
  for (const c of CATS) { const x = base.cats[c.id]; L.push(`| ${c.emoji} ${c.label} | ${x.p50} | ${x.mean} | ${x.p75} | ${x.p90} | ${x.zero}% | ${E[c.id]} | ${reach(base.raw[c.id], E[c.id])}% |`) }
  for (const c of CATS.filter((x) => x.brand_part)) { const x = base.brand[c.id]; L.push(`| &nbsp;&nbsp;└ ${c.brand_part.label} | ${x.p50} | ${x.mean} | ${x.p75} | ${x.p90} | ${x.zero}% | ${c.brand_part.enough} | ${reach(base.rawBrand[c.id], c.brand_part.enough)}% |`) }
  L.push('')
  L.push(`## 가장 가까운 곳(직선거리)`, '', head(ids.map((id) => res[id].name)))
  for (const c of CATS) L.push(`| ${c.emoji} ${c.label} | ${ids.map((id) => { const n = res[id].nearest[c.id]; return n ? `${n.dist}m ${n.name}` : '—' }).join(' | ')} |`)
  for (const c of CATS) for (const s of c.sub ?? []) {
    L.push(`| &nbsp;&nbsp;└ ${s.label} | ${ids.map((id) => { const d = res[id].sub[`${c.id}:${s.label}`].nearest; return d == null ? `${Math.max(...radii)}m 밖` : `${d}m` }).join(' | ')} |`)
  }
  L.push('', `## 주요 매장(후보지 ${CONFIG.majorsRadius.toLocaleString()}m 안, 지도에 따로 표시)`, '', '| 브랜드 | 매장 | 가까운 후보지(직선) |', '|---|---|---|')
  for (const x of majors) L.push(`| ${x.brand} | ${x.name} | ${Object.entries(x.near).sort((a, b) => a[1] - b[1]).map(([id, d]) => `${res[id].name} ${d}m`).join(' · ')} |`)
  if (!majors.some((x) => x.brand === '다이소')) L.push('', '다이소는 상가(상권)정보에 거의 등록돼 있지 않아(경기·서울 131곳, 영통구 0곳) 실제로 있어도 안 나올 수 있다.')
  L.push('')
  fs.writeFileSync(path.join(ROOT, 'COMMERCIAL.md'), L.join('\n'))
  console.log(L.join('\n'))
  console.log('\n→ src/commercial.json · COMMERCIAL.md')
}

// ── 명령 ──
switch (cmd) {
  case 'info': {
    console.log(`기준월 ${meta.stdr_ym} · 지역 ${meta.regions} · 받은 시각 ${meta.fetched_at}`)
    console.log(`업소 ${db.prepare('SELECT COUNT(*) n FROM stores').get().n.toLocaleString()}곳 · 파일 ${(fs.statSync(DB_FILE).size / 1048576).toFixed(0)}MB`)
    break
  }
  case 'codes': {
    const q = positional[0]
    const rows = db.prepare('SELECT * FROM upjong WHERE level = ? ORDER BY code').all('S')
    for (const r of rows) {
      const mid = upName[r.parent], big = upName[r.parent?.slice(0, 2)]
      const s = `${r.code}  ${big} > ${mid} > ${r.name}`
      if (!q || s.includes(q)) console.log(s)
    }
    break
  }
  case 'near': {
    const r = Number(opt('--r', 500))
    const p = resolvePoint(positional)
    let list = within(p.lat, p.lng, r)
    const cat = opt('--cat'), scls = opt('--scls'), name = opt('--name')
    if (cat) { const c = CATS.find((x) => x.id === cat || x.label === cat); if (!c) { console.error(`분류 없음: ${cat} (${CATS.map((x) => x.id + '/' + x.label).join(', ')})`); process.exit(1) } list = list.filter((s) => matches(c, s)) }
    if (scls) list = list.filter((s) => s.scls?.startsWith(scls))
    if (name) list = list.filter((s) => label(s).includes(name))
    console.log(`${p.label} 반경 ${r}m · 기준월 ${meta.stdr_ym} · ${list.length}곳`)
    if (flag('--list') || cat || scls || name) { for (const s of list.slice(0, Number(opt('--limit', 50)))) console.log(line(s)) }
    else {
      for (const c of CATS) console.log(`  ${c.emoji} ${c.label.padEnd(5)} ${String(list.filter((s) => matches(c, s)).length).padStart(4)}`)
      const byL = {}
      for (const s of list) byL[s.lcls] = (byL[s.lcls] ?? 0) + 1
      console.log('  대분류: ' + Object.entries(byL).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${upName[k] ?? k} ${v}`).join(' · '))
    }
    break
  }
  case 'find': {
    const q = positional.join(' ')
    let list = searchName(q, 5000)
    const near = opt('--near')
    if (near) {
      const p = resolvePoint([near]), r = Number(opt('--r', 3000))
      list = list.map((s) => ({ ...s, d: dist(p.lat, p.lng, s.lat, s.lon) })).filter((s) => s.d <= r).sort((a, b) => a.d - b.d)
    }
    console.log(`"${q}" ${list.length}곳${near ? ` (${near} 반경 ${opt('--r', 3000)}m)` : ''}`)
    for (const s of list.slice(0, Number(opt('--limit', 50)))) console.log(line(s))
    break
  }
  case 'analyze': analyze(); break
  case 'baseline': { // 생활권 평균 비교만 보기
    const b = baseline()
    console.log(`생활권 격자점 ${b.points}곳(500m 안 업소 ${b.min}곳 이상) · 반경 ${b.radius}m · 기준월 ${meta.stdr_ym}`)
    for (const c of CATS) { const x = b.cats[c.id]; console.log(`  ${c.label.padEnd(4)} 중앙값 ${x.p50} · 상위25% ${x.p75} · 상위10% ${x.p90} · 평균 ${x.mean} · 0곳 ${x.zero}% · 기준 ${CONFIG.enough[c.id]} 이상인 생활권 ${reach(b.raw[c.id], CONFIG.enough[c.id])}%`) }
    for (const [id, x] of Object.entries(b.brand)) console.log(`  ${CATS.find((c) => c.id === id).brand_part.label} 중앙값 ${x.p50} · 상위25% ${x.p75} · 상위10% ${x.p90} · 평균 ${x.mean} · 0곳 ${x.zero}%`)
    break
  }
  default:
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).slice(0, 13).map((l) => l.slice(3)).join('\n'))
}
