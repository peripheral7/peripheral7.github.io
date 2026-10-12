// 입지 요인 — 평화로움 · 공원 · 공공시설을 후보지마다 계산해 src/places.json · PLACES.md 에 쓴다(이 PC 에서만).
// 공개 사이트는 이 결과 파일만 읽는다(외부 API 를 부르지 않는다).
//
// 사용(이 폴더에서):
//   node scripts/places.mjs            OSM 을 받아(하루 안에 받은 게 있으면 그것을 씀) 계산 → src/places.json · PLACES.md
//   node scripts/places.mjs --refresh  OSM 을 새로 받기
//
// 자료
//   - OpenStreetMap(Overpass API): 공원 경계·산책로·물가·녹지·큰길·도서관·운동장 — 후보지 주변 네모 한 번에 받아 data/osm-places.json 에 저장
//   - 상가(상권)정보 data/stores.sqlite(scripts/stores-sync.mjs): 60m 안 음식점, 공원 양 끝의 상권
//   공원 경계는 나중에 국토교통부 도시계획(공간시설) — 브이월드 키가 생기면 — 로 바꿀 수 있게 parkSource 한 곳에서만 읽는다.
//
// 계산 규칙·숫자는 src/places-config.json(사람이 고치는 곳), 설명은 README 4-5절.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { CANDIDATES } from '../src/data.ts'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'places-config.json'), 'utf8'))
const OSM_FILE = path.join(ROOT, 'data', 'osm-places.json')
const DB_FILE = path.join(ROOT, 'data', 'stores.sqlite')
const refresh = process.argv.includes('--refresh')

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
/** 점에서 면까지(안이면 0) */
const polyDist = (p, rings) => (rings.some((r) => inside(p, r)) ? 0 : Math.min(...rings.map((r) => lineDist(p, [...r, r[0]]))))

// ── OSM 받기 ──
async function osm() {
  if (!refresh && fs.existsSync(OSM_FILE) && Date.now() - fs.statSync(OSM_FILE).mtimeMs < 86_400_000) return JSON.parse(fs.readFileSync(OSM_FILE, 'utf8'))
  const m = CFG.fetchMargin / 111320
  const s = Math.min(...CANDIDATES.map((c) => c.lat)) - m, n = Math.max(...CANDIDATES.map((c) => c.lat)) + m
  const w = Math.min(...CANDIDATES.map((c) => c.lng)) - m * 1.3, e = Math.max(...CANDIDATES.map((c) => c.lng)) + m * 1.3
  const b = `(${s},${w},${n},${e})`
  const q = `[out:json][timeout:120];
(way["leisure"="park"]${b};relation["leisure"="park"]${b};)->.parks; .parks out geom tags;
(way["highway"~"^(footway|path|pedestrian|cycleway|track|steps)$"]${b};)->.paths; .paths out geom tags;
(way["natural"="water"]${b};relation["natural"="water"]${b};way["waterway"~"^(river|stream|canal)$"]${b};)->.water; .water out geom tags;
(way["landuse"~"^(forest|grass|meadow|recreation_ground|village_green)$"]${b};way["natural"~"^(wood|scrub|grassland)$"]${b};relation["landuse"="forest"]${b};relation["natural"="wood"]${b};)->.green; .green out geom tags;
(way["highway"~"^(motorway|trunk|primary|secondary)$"]${b};way["highway"]["name"~"대로$"]${b};)->.roads; .roads out geom tags;
(nwr["amenity"="library"]${b};nwr["leisure"="pitch"]${b};nwr["leisure"="sports_centre"]${b};nwr["amenity"="community_centre"]${b};nwr["leisure"="swimming_pool"]["access"!="private"]${b};)->.pub; .pub out center tags;`
  console.log('OSM 받는 중…')
  const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'peripheral7-location-compare/1.0' } })
  const t = await r.text()
  if (!t.startsWith('{')) throw new Error(`Overpass 실패(${r.status}): ${t.slice(0, 200)}`)
  fs.mkdirSync(path.dirname(OSM_FILE), { recursive: true })
  fs.writeFileSync(OSM_FILE, t)
  return JSON.parse(t)
}

// ── 공원 경계(지금은 OSM leisure=park) ──
function parkSource(els) {
  return els.filter((e) => e.tags?.leisure === 'park').map((e) => {
    const rings = e.type === 'way' ? [ring(e.geometry)] : (e.members ?? []).filter((m) => m.role === 'outer' && m.geometry?.length > 3).map((m) => ring(m.geometry))
    return { id: `${e.type}${e.id}`, name: e.tags.name ?? '', rings: rings.filter((r) => r.length > 3) }
  }).filter((p) => p.rings.length)
}

async function main() {
  const j = await osm()
  const els = j.elements
  const db = fs.existsSync(DB_FILE) ? new DatabaseSync(DB_FILE, { readOnly: true }) : null
  if (!db) console.warn('data/stores.sqlite 없음 — 60m 음식점·공원 연결성은 0 으로 본다(먼저 stores-sync.mjs)')
  const qBox = db?.prepare(`SELECT s.name, s.scls, s.lat, s.lon FROM stores_rtree r JOIN stores s ON s.id = r.id WHERE r.max_lon >= ? AND r.min_lon <= ? AND r.max_lat >= ? AND r.min_lat <= ?`)
  const storesNear = (lat, lng, rad) => {
    if (!qBox) return []
    const dLat = rad / 110540, dLng = rad / KX
    const p = xy(lat, lng)
    return qBox.all(lng - dLng, lng + dLng, lat - dLat, lat + dLat).filter((s) => { const q = xy(s.lat, s.lon); return Math.hypot(q[0] - p[0], q[1] - p[1]) <= rad })
  }
  const isFood = (s) => CFG.peace.foodPrefix.some((p) => s.scls?.startsWith(p))

  // 공원 지표(공원마다 한 번)
  const paths = els.filter((e) => e.tags?.highway && /^(footway|path|pedestrian|cycleway|track|steps)$/.test(e.tags.highway)).map((e) => ring(e.geometry))
  const waters = els.filter((e) => e.tags?.natural === 'water' || e.tags?.waterway).flatMap((e) => (e.geometry ? [ring(e.geometry)] : (e.members ?? []).filter((m) => m.geometry).map((m) => ring(m.geometry))))
  const PK = CFG.park
  const parks = parkSource(els).map((p) => {
    const a = p.rings.reduce((s, r) => s + area(r), 0)
    if (a < PK.minAreaM2 || PK.excludeNames?.some((n) => p.name.includes(n))) return null
    const per = p.rings.reduce((s, r) => s + perim(r), 0)
    const pts = p.rings.flat()
    // 산책로: 공원 안을 지나는 보행로 길이(조각 가운데가 공원 안이면 셈). 없으면 둘레의 절반으로 본다
    let walk = 0
    for (const w of paths) for (let i = 1; i < w.length; i++) {
      const mid = [(w[i][0] + w[i - 1][0]) / 2, (w[i][1] + w[i - 1][1]) / 2]
      if (p.rings.some((r) => inside(mid, r))) walk += Math.hypot(w[i][0] - w[i - 1][0], w[i][1] - w[i - 1][1])
    }
    const walkUsed = walk > 0 ? walk : per * 0.5
    // 가장 먼 두 점(공원의 양 끝)
    let ends = [pts[0], pts[0]], span = 0
    const step = Math.max(1, Math.floor(pts.length / 200))
    for (let i = 0; i < pts.length; i += step) for (let k = i + step; k < pts.length; k += step) {
      const d = Math.hypot(pts[i][0] - pts[k][0], pts[i][1] - pts[k][1]); if (d > span) { span = d; ends = [pts[i], pts[k]] }
    }
    const compact = (per * per) / (4 * Math.PI * a) // 1 = 원, 클수록 길쭉
    const waterside = waters.some((w) => w.some((q) => p.rings.some((r) => inside(q, r))) || p.rings.some((r) => r.some((q) => lineDist(q, w) < PK.watersideM))) || /수변|호수|천변|강변/.test(p.name)
    // 연결성: 길게 이어진 공원이 양 끝에서 각각 상권에 닿으면 1.8배
    const toLL = (q) => [q[1] / KY, q[0] / KX]
    const endShops = ends.map((q) => { const [la, ln] = toLL(q); return storesNear(la, ln, PK.link.endRadiusM).length })
    const linked = span >= PK.link.minSpanM && compact >= PK.link.minCompact && endShops.every((n) => n >= PK.link.minShops)
    const base = Math.max(PK.minPoints, Math.min(10, PK.logA * Math.log10(walkUsed / PK.logL0)))
    const value = Math.min(10, (base + (waterside ? PK.watersideBonus : 0)) * (linked ? PK.link.mult : 1))
    return { id: p.id, name: p.name || '이름 없는 공원', rings: p.rings, areaHa: +(a / 10000).toFixed(2), walkM: Math.round(walk), spanM: Math.round(span), compact: +compact.toFixed(1), waterside, endShops, linked, base: +base.toFixed(1), value: +value.toFixed(1) }
  }).filter(Boolean)

  // 녹지(비율 계산용 면): 공원 + 숲·풀밭
  const greens = [...parks.flatMap((p) => p.rings), ...els.filter((e) => (e.tags?.landuse || e.tags?.natural) && !e.tags?.waterway && e.tags?.natural !== 'water')
    .flatMap((e) => (e.geometry ? [ring(e.geometry)] : (e.members ?? []).filter((m) => m.role === 'outer' && m.geometry?.length > 3).map((m) => ring(m.geometry))))].filter((r) => r.length > 3)
  const roads = els.filter((e) => e.tags?.highway && (/^(motorway|trunk|primary|secondary)$/.test(e.tags.highway) || /대로$/.test(e.tags.name ?? '')))
    .filter((e) => CFG.peace.roadClasses.includes(e.tags.highway) || /대로$/.test(e.tags.name ?? '') || Number(e.tags.lanes) >= CFG.peace.roadMinLanes)
    .map((e) => ({ name: e.tags.name ?? e.tags.ref ?? e.tags.highway, line: ring(e.geometry) }))
  const pubs = els.filter((e) => e.tags && (e.tags.amenity === 'library' || e.tags.leisure === 'pitch' || e.tags.leisure === 'sports_centre' || e.tags.amenity === 'community_centre' || e.tags.leisure === 'swimming_pool'))
    .map((e) => ({ tags: e.tags, p: xy(e.lat ?? e.center?.lat, e.lon ?? e.center?.lon) })).filter((x) => !Number.isNaN(x.p[0]))

  const out = {}
  for (const c of CANDIDATES) {
    const p = xy(c.lat, c.lng)
    // 평화로움
    const PC = CFG.peace
    const food = storesNear(c.lat, c.lng, PC.foodRadiusM).filter(isFood).length
    const road = roads.map((r) => ({ name: r.name, d: lineDist(p, r.line) })).sort((a, b) => a.d - b.d)[0] ?? null
    const foodScore = food <= PC.foodFree ? 10 - PC.foodSmallPenalty * food : (10 - PC.foodSmallPenalty * PC.foodFree) * Math.pow(10, -(food - PC.foodFree) / PC.foodDecay)
    const roadScore = !road || road.d > PC.roadFarM ? 10 : road.d > PC.roadNearM ? PC.roadMidScore : 0
    const peace = foodScore * PC.wFood + roadScore * PC.wRoad
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
    // 공공시설
    const PB = CFG.public
    const facil = PB.types.map((t) => {
      const nm = (x) => x.tags.name ?? ''
      const hits = pubs.filter((x) => Object.entries(t.match).every(([k, v]) => (Array.isArray(v) ? v.some((vv) => (x.tags[k] ?? '').split(';').includes(vv)) : x.tags[k] === v)))
        .filter((x) => !PB.excludeAccess?.includes(x.tags.access) && (!t.nameMust || nm(x).includes(t.nameMust)) && !t.nameExclude?.some((n) => nm(x).includes(n)) && !t.nameExcludeExact?.includes(nm(x)))
        .map((x) => ({ name: x.tags.name ?? '', d: Math.hypot(x.p[0] - p[0], x.p[1] - p[1]) })).filter((x) => x.d <= PB.radiusM).sort((a, b) => a.d - b.d)
      const score = 10 * (1 - Math.pow(10, -hits.length / t.enough))
      return { id: t.id, label: t.label, emoji: t.emoji, count: hits.length, nearest: hits[0] ? { name: hits[0].name, dist: Math.round(hits[0].d) } : null, score: +score.toFixed(1) }
    })
    const pubScore = facil.reduce((a, f) => a + f.score, 0) / facil.length

    out[c.id] = {
      name: c.name, lat: c.lat, lng: c.lng,
      peace: { score: +peace.toFixed(1), food, foodScore: +foodScore.toFixed(1), road: road ? { name: road.name, dist: Math.round(road.d) } : null, roadScore },
      park: {
        score: +parkScore.toFixed(1), green: +(green * 100).toFixed(0), greenBonus,
        parks: near.slice(0, 5).map((x) => ({ name: x.k.name, dist: Math.round(x.d), value: x.k.value, eff: +x.eff.toFixed(1), areaHa: x.k.areaHa, walkM: x.k.walkM, waterside: x.k.waterside, linked: x.k.linked })),
      },
      public: { score: +pubScore.toFixed(1), facilities: facil },
    }
  }
  const json = { source: 'OpenStreetMap(Overpass) · 소상공인시장진흥공단 상가(상권)정보', osmAt: new Date(fs.statSync(OSM_FILE).mtimeMs).toISOString().slice(0, 10), generatedAt: new Date().toISOString().slice(0, 10), candidates: out }
  fs.writeFileSync(path.join(ROOT, 'src', 'places.json'), JSON.stringify(json, null, 2) + '\n')

  // 보고서
  const ids = CANDIDATES.map((c) => c.id)
  const head = `| | ${ids.map((id) => out[id].name).join(' | ')} |\n|---|${ids.map(() => '---:').join('|')}|`
  const L = [`# 입지 요인 — 평화로움 · 공원 · 공공시설`, '', `\`node scripts/places.mjs\` 가 만든다(손으로 고치지 말 것). OSM ${json.osmAt} · 만든 날 ${json.generatedAt}. 규칙은 \`src/places-config.json\`, 설명은 README 4-5절.`, '',
    '## 🕊️ 평화로움', '', head,
    `| 60m 안 음식점·주점 | ${ids.map((id) => `${out[id].peace.food} → ${out[id].peace.foodScore}`).join(' | ')} |`,
    `| 가장 가까운 큰길 | ${ids.map((id) => { const r = out[id].peace.road; return r ? `${r.dist}m ${r.name} → ${out[id].peace.roadScore}` : '없음 → 10' }).join(' | ')} |`,
    `| **평화로움** | ${ids.map((id) => `**${out[id].peace.score}**`).join(' | ')} |`, '',
    '## 🌳 공원', '', head,
    `| 가장 좋은 공원(거리 반영) | ${ids.map((id) => { const k = out[id].park.parks[0]; return k ? `${k.name} ${k.dist}m · ${k.value}점${k.linked ? '(연결 ×1.8)' : ''} → ${k.eff}` : '1km 안 없음' }).join(' | ')} |`,
    `| 두 번째 공원 | ${ids.map((id) => { const k = out[id].park.parks[1]; return k ? `${k.name} ${k.dist}m → ${k.eff}` : '—' }).join(' | ')} |`,
    `| 1km 안 녹지 비율 | ${ids.map((id) => `${out[id].park.green}% → +${out[id].park.greenBonus}`).join(' | ')} |`,
    `| **공원** | ${ids.map((id) => `**${out[id].park.score}**`).join(' | ')} |`, '',
    '### 공원별 점수(후보지 1km 안)', '', '| 공원 | 면적 | 산책로 | 길이 | 물가 | 양 끝 상권 | 연결 | 점수 |', '|---|---:|---:|---:|:---:|---:|:---:|---:|',
    ...parks.filter((k) => CANDIDATES.some((c) => polyDist(xy(c.lat, c.lng), k.rings) <= PK.radiusM)).sort((a, b) => b.value - a.value)
      .map((k) => `| ${k.name} | ${k.areaHa}ha | ${k.walkM}m | ${k.spanM}m | ${k.waterside ? '○' : ''} | ${k.endShops.join('·')} | ${k.linked ? '×1.8' : ''} | ${k.value} |`), '',
    '## 🏛️ 공공시설(1km 안)', '', head,
    ...CFG.public.types.map((t) => `| ${t.emoji} ${t.label} | ${ids.map((id) => { const f = out[id].public.facilities.find((x) => x.id === t.id); return f.count ? `${f.count}곳 · ${f.nearest.dist}m${f.nearest.name ? ' ' + f.nearest.name : ''} → ${f.score}` : '없음 → 0' }).join(' | ')} |`),
    `| **공공시설** | ${ids.map((id) => `**${out[id].public.score}**`).join(' | ')} |`, '',
  ]
  fs.writeFileSync(path.join(ROOT, 'PLACES.md'), L.join('\n'))
  console.log(L.join('\n'))
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(1) })
