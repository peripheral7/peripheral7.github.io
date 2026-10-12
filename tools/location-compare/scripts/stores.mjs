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
// 분류(카페·음식점·화장품·마트·잡화점·필수의료·약국)는 src/commercial-categories.json 에서 고친다.
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
  if (rule.exclude?.includes(s.scls)) return false
  if (rule.exclude_names?.some((n) => s.name?.includes(n))) return false
  const byName = rule.names?.some((n) => s.name?.includes(n)) && (!rule.names_scls || rule.names_scls.includes(s.scls))
  return Boolean(rule.scls?.includes(s.scls) || rule.prefix?.some((p) => s.scls?.startsWith(p)) || byName)
}
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
function analyzePoint(lat, lng) {
  const radii = CONFIG.radii
  const all = within(lat, lng, Math.max(...radii))
  const out = { total: {}, counts: {}, sub: {}, nearest: {} }
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

function analyze() {
  const radii = CONFIG.radii
  const res = {}
  for (const c of CANDIDATES) res[c.id] = { name: c.name, address: c.address, lat: c.lat, lng: c.lng, ...analyzePoint(c.lat, c.lng) }
  const json = {
    source: '소상공인시장진흥공단 상가(상권)정보', stdrYm: meta.stdr_ym, generatedAt: new Date().toISOString().slice(0, 10), radii,
    categories: CATS.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji, sub: (c.sub ?? []).map((s) => s.label) })), candidates: res,
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
  L.push(`## 가장 가까운 곳(직선거리)`, '', head(ids.map((id) => res[id].name)))
  for (const c of CATS) L.push(`| ${c.emoji} ${c.label} | ${ids.map((id) => { const n = res[id].nearest[c.id]; return n ? `${n.dist}m ${n.name}` : '—' }).join(' | ')} |`)
  for (const c of CATS) for (const s of c.sub ?? []) {
    L.push(`| &nbsp;&nbsp;└ ${s.label} | ${ids.map((id) => { const d = res[id].sub[`${c.id}:${s.label}`].nearest; return d == null ? `${Math.max(...radii)}m 밖` : `${d}m` }).join(' | ')} |`)
  }
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
  default:
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).slice(0, 13).map((l) => l.slice(3)).join('\n'))
}
