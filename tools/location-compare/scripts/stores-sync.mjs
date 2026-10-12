// 소상공인시장진흥공단 상가(상권)정보를 시도 단위로 통째로 받아 이 PC 의 SQLite(data/stores.sqlite)에 저장한다.
// 한 달에 한 번 돌린다. 공단 자료는 분기마다 바뀌므로(응답의 stdrYm, 예: 202606), 이미 받은 기준월과 같으면
// 아무것도 받지 않고 끝난다(--force 로 강제).
//
// 사용(이 폴더에서):
//   node scripts/stores-sync.mjs                 # 기본 지역(경기 41 · 서울 11) 받기 — 약 1,230회 호출, 수 분
//   node scripts/stores-sync.mjs --regions 41    # 지역 고르기(시도 코드, 쉼표로)
//   node scripts/stores-sync.mjs --force         # 기준월이 같아도 다시 받기
//   node scripts/stores-sync.mjs --dry-run       # 지역별 업소 수·호출 수만 보기
//
// 키: .env.local 의 SDSC_SERVICE_KEY(비면 DATA_GO_KR_SERVICE_KEY) — 공공데이터포털 일반 인증키(Decoding).
//
// 받는 방식: 새 파일 data/stores.next.sqlite 에 받고, 다 받은 뒤에만 data/stores.sqlite 로 바꿔 끼운다.
// 도중에 끊기거나 하루 호출 한도(resultCode 22)에 걸리면 받은 쪽(page)을 기록해 두므로 다시 실행하면 이어 받는다.
// 검색은 scripts/stores.mjs.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const DATA = path.join(ROOT, 'data')
const DB_FILE = path.join(DATA, 'stores.sqlite')
const NEXT_FILE = path.join(DATA, 'stores.next.sqlite')
const BASE = 'https://apis.data.go.kr/B553077/api/open/sdsc2/'
const ROWS = 1000 // 한 번에 받을 수 있는 최대
const PARALLEL = 4

const args = process.argv.slice(2)
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined)
const REGIONS = (opt('--regions') ?? '41,11').split(',').map((s) => s.trim()).filter(Boolean)
const force = args.includes('--force')
const dryRun = args.includes('--dry-run')

const env = { ...readEnv(path.join(ROOT, '.env.local')), ...process.env }
const KEY = env.SDSC_SERVICE_KEY || env.DATA_GO_KR_SERVICE_KEY
if (!KEY) fail('키가 없다: .env.local 에 DATA_GO_KR_SERVICE_KEY(또는 SDSC_SERVICE_KEY)를 넣는다.')

function readEnv(file) {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
    if (m && m[2]) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}
function fail(msg) { console.error(msg); process.exit(1) }

class QuotaError extends Error {}
async function call(op, params, tries = 4) {
  const u = new URL(BASE + op)
  u.search = new URLSearchParams({ serviceKey: KEY, type: 'json', ...params })
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(30000) })
      const t = await r.text()
      let j
      try { j = JSON.parse(t) } catch { throw new Error(`JSON 아님(${r.status}): ${t.slice(0, 160)}`) }
      const code = j.header?.resultCode
      if (code === '22') throw new QuotaError('하루 호출 한도 초과(resultCode 22)')
      if (code === '03') return { header: j.header, body: { items: [], totalCount: 0 } } // 자료 없음
      if (code !== '00') throw new Error(`resultCode ${code} ${j.header?.resultMsg}`)
      return j
    } catch (e) {
      if (e instanceof QuotaError || i >= tries) throw e
      await new Promise((res) => setTimeout(res, 1000 * i))
    }
  }
}

function openDb(file) {
  const db = new DatabaseSync(file)
  db.exec(`
    PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
    CREATE TABLE IF NOT EXISTS pages (region TEXT, page INTEGER, PRIMARY KEY (region, page));
    CREATE TABLE IF NOT EXISTS upjong (code TEXT PRIMARY KEY, level TEXT, name TEXT, parent TEXT);
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY,            -- R-tree·FTS 와 잇는 정수 번호
      bizes_id TEXT UNIQUE NOT NULL,     -- 상가업소번호
      name TEXT, branch TEXT,
      lcls TEXT, mcls TEXT, scls TEXT, ksic TEXT,
      ctprvn TEXT, signgu TEXT, signgu_nm TEXT, adong TEXT, adong_nm TEXT, ldong_nm TEXT,
      road_addr TEXT, lot_addr TEXT, bld_nm TEXT, floor TEXT,
      lon REAL, lat REAL
    );`)
  return db
}

function finishIndexes(db) {
  console.log('색인 만드는 중(공간·이름·업종)…')
  db.exec(`
    CREATE INDEX IF NOT EXISTS stores_scls ON stores (scls);
    CREATE INDEX IF NOT EXISTS stores_signgu ON stores (signgu);
    DROP TABLE IF EXISTS stores_rtree;
    CREATE VIRTUAL TABLE stores_rtree USING rtree (id, min_lon, max_lon, min_lat, max_lat);
    INSERT INTO stores_rtree SELECT id, lon, lon, lat, lat FROM stores WHERE lon IS NOT NULL AND lat IS NOT NULL;
    DROP TABLE IF EXISTS stores_fts;
    CREATE VIRTUAL TABLE stores_fts USING fts5 (name, branch, bld_nm, content = 'stores', content_rowid = 'id', tokenize = 'trigram');
    INSERT INTO stores_fts (stores_fts) VALUES ('rebuild');
    ANALYZE;`)
}

async function main() {
  fs.mkdirSync(DATA, { recursive: true })

  // 지금 공단 기준월과 지역별 업소 수
  const heads = {}
  for (const r of REGIONS) {
    const j = await call('storeListInDong', { divId: 'ctprvnCd', key: r, numOfRows: '1', pageNo: '1' })
    heads[r] = { total: j.body.totalCount, pages: Math.ceil(j.body.totalCount / ROWS), stdrYm: j.header.stdrYm }
  }
  const stdrYm = heads[REGIONS[0]].stdrYm
  console.log(`공단 기준월 ${stdrYm}`)
  for (const r of REGIONS) console.log(`  시도 ${r}: ${heads[r].total.toLocaleString()}곳 → ${heads[r].pages}회 호출`)
  if (dryRun) return

  if (fs.existsSync(DB_FILE) && !force) {
    const cur = new DatabaseSync(DB_FILE, { readOnly: true })
    const have = Object.fromEntries(cur.prepare('SELECT k, v FROM meta').all().map((x) => [x.k, x.v]))
    cur.close()
    if (have.stdr_ym === stdrYm && have.regions === REGIONS.join(',')) {
      console.log(`이미 같은 기준월(${stdrYm})·지역을 받아 두었다 — 할 일 없음(다시 받으려면 --force).`)
      return
    }
  }

  // 받다 만 파일이 다른 기준월·지역이면 새로 시작
  if (fs.existsSync(NEXT_FILE)) {
    const t = openDb(NEXT_FILE)
    const m = Object.fromEntries(t.prepare('SELECT k, v FROM meta').all().map((x) => [x.k, x.v]))
    t.close()
    if (m.stdr_ym !== stdrYm || m.regions !== REGIONS.join(',')) for (const s of ['', '-wal', '-shm']) fs.rmSync(NEXT_FILE + s, { force: true })
  }
  const db = openDb(NEXT_FILE)
  const setMeta = db.prepare('INSERT OR REPLACE INTO meta (k, v) VALUES (?, ?)')
  setMeta.run('stdr_ym', stdrYm)
  setMeta.run('regions', REGIONS.join(','))

  // 업종 분류표(대·중·소)
  const up = db.prepare('INSERT OR REPLACE INTO upjong (code, level, name, parent) VALUES (?, ?, ?, ?)')
  for (const x of (await call('largeUpjongList', {})).body.items) up.run(x.indsLclsCd, 'L', x.indsLclsNm, null)
  for (const x of (await call('middleUpjongList', {})).body.items) up.run(x.indsMclsCd, 'M', x.indsMclsNm, x.indsLclsCd)
  for (const x of (await call('smallUpjongList', {})).body.items) up.run(x.indsSclsCd, 'S', x.indsSclsNm, x.indsMclsCd)

  const ins = db.prepare(`INSERT OR REPLACE INTO stores (bizes_id, name, branch, lcls, mcls, scls, ksic, ctprvn, signgu, signgu_nm,
    adong, adong_nm, ldong_nm, road_addr, lot_addr, bld_nm, floor, lon, lat) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
  const markPage = db.prepare('INSERT OR IGNORE INTO pages (region, page) VALUES (?, ?)')
  const donePages = new Set(db.prepare('SELECT region || \':\' || page AS k FROM pages').all().map((x) => x.k))

  const todo = []
  for (const r of REGIONS) for (let p = 1; p <= heads[r].pages; p++) if (!donePages.has(`${r}:${p}`)) todo.push([r, p])
  console.log(`받을 쪽 ${todo.length}개(이미 받은 쪽 ${donePages.size}개)`)

  let done = 0, quota = null
  const started = Date.now()
  async function worker() {
    while (todo.length && !quota) {
      const [r, p] = todo.shift()
      try {
        const j = await call('storeListInDong', { divId: 'ctprvnCd', key: r, numOfRows: String(ROWS), pageNo: String(p) })
        db.exec('BEGIN')
        for (const x of j.body.items ?? []) {
          ins.run(x.bizesId, x.bizesNm, x.brchNm || null, x.indsLclsCd, x.indsMclsCd, x.indsSclsCd, x.ksicCd, x.ctprvnCd, x.signguCd,
            x.signguNm, x.adongCd, x.adongNm, x.ldongNm, x.rdnmAdr || null, x.lnoAdr || null, x.bldNm || null, x.flrNo || null,
            Number(x.lon) || null, Number(x.lat) || null)
        }
        markPage.run(r, p)
        db.exec('COMMIT')
        if (++done % 50 === 0) console.log(`  ${done}쪽 · ${Math.round((Date.now() - started) / 1000)}초`)
      } catch (e) {
        if (db.isTransaction) db.exec('ROLLBACK')
        if (e instanceof QuotaError) { quota = e; break }
        console.warn(`  시도 ${r} ${p}쪽 실패(다음 실행 때 다시): ${e.message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker))

  const left = REGIONS.reduce((a, r) => a + heads[r].pages, 0) - db.prepare('SELECT COUNT(*) n FROM pages').get().n
  if (quota || left > 0) {
    db.close()
    console.log(`${quota ? quota.message + ' — ' : ''}남은 쪽 ${left}개. 내일(또는 잠시 뒤) 같은 명령을 다시 실행하면 이어 받는다.`)
    process.exit(2)
  }

  // 개수 맞추기(쪽을 넘기는 동안 순서가 흔들리면 빠지는 업소가 생길 수 있다)
  for (const r of REGIONS) {
    const n = db.prepare('SELECT COUNT(*) n FROM stores WHERE ctprvn = ?').get(r).n
    const diff = heads[r].total - n
    console.log(`  시도 ${r}: ${n.toLocaleString()} / ${heads[r].total.toLocaleString()}${diff ? ` (빠짐 ${diff})` : ''}`)
    setMeta.run(`count_${r}`, String(n))
  }
  setMeta.run('fetched_at', new Date().toISOString())
  finishIndexes(db)
  db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
  db.close()

  for (const s of ['-wal', '-shm']) fs.rmSync(DB_FILE + s, { force: true })
  fs.renameSync(NEXT_FILE, DB_FILE)
  for (const s of ['-wal', '-shm']) fs.rmSync(NEXT_FILE + s, { force: true })
  const mb = (fs.statSync(DB_FILE).size / 1048576).toFixed(0)
  console.log(`완료: data/stores.sqlite (${mb}MB, ${Math.round((Date.now() - started) / 1000)}초). 이어서 node scripts/stores.mjs analyze`)
}

main().catch((e) => fail(e.stack || e.message))
