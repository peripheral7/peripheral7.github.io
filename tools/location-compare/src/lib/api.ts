// 서버 없는 정적 사이트용 "대신 서버": 원본 앱이 부르던 /api/... 요청을 브라우저 안에서 처리한다.
// - 처음 열면 seed.json(원본 DB에서 뽑은 예시 데이터)으로 시작하고, 이후 입력·수정·삭제는 이 브라우저의 localStorage 에만 저장된다
//   (다른 방문자나 다른 기기에는 보이지 않는다).
// - 컴포넌트는 원본 그대로 api('homes') 처럼 부르고, 돌려받은 Response 의 ok / json() 을 쓴다.
// - 엔드포인트와 검사·정렬 규칙은 원본 백엔드(backend/main.py)를 따른다. 이동 접근성 계산은 lib/scoring.ts.
import seed from '../seed.json'
import type { MobilityPreference } from '../types'
import { computeAccessibility, overallScore, sortHubs, type HomeRow, type HubRow } from './scoring'

type Store = { version: string; seq: { homes: number; hubs: number }; homes: HomeRow[]; hubs: HubRow[]; preferences: MobilityPreference }

const KEY = 'locCompare.v1'
let memory: Store | null = null // 저장소를 못 쓰는 환경(시크릿 모드·차단)에서는 이 탭이 열려 있는 동안만 유지한다
let persistent = true

const fresh = (): Store => JSON.parse(JSON.stringify(seed)) as Store
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ') // SQLite CURRENT_TIMESTAMP 와 같은 모양(UTC)

function write(store: Store) {
  memory = store
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
    persistent = true
  } catch {
    persistent = false
  }
}

function readSaved(raw: string | null): Store | null {
  if (!raw) return null
  try {
    const saved = JSON.parse(raw) as Store
    // 예시 데이터가 새 판으로 바뀌었으면(version 다름) 저장돼 있던 것 대신 새 예시로 시작한다.
    return saved && saved.version === seed.version && Array.isArray(saved.homes) && Array.isArray(saved.hubs) && saved.preferences && saved.seq ? saved : null
  } catch {
    return null // 깨진 내용은 무시하고 예시로 다시 시작한다
  }
}

function load(): Store {
  if (!persistent && memory) return memory
  let raw: string | null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    persistent = false // 저장소를 못 쓰는 환경: 이 탭이 열려 있는 동안만 메모리에 둔다
    memory = memory ?? fresh()
    return memory
  }
  const saved = readSaved(raw)
  if (saved) return saved
  const store = fresh()
  write(store)
  return store
}

/** 이 브라우저가 입력 내용을 저장할 수 있는지(화면 위쪽 표시용). */
export function canPersist(): boolean {
  try {
    const probe = 'locCompare.probe'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

/** 입력한 후보·거점·선호도를 모두 지우고 예시 데이터로 되돌린다. */
export function resetData() {
  write(fresh())
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const fail = (status: number, detail: string) => json({ detail }, status)
const invalid = () => fail(422, '입력값이 올바르지 않습니다.')

const asHome = (row: HomeRow) => ({ ...row, overall: overallScore(row), selected: Boolean(row.selected) })
const isInt = (value: unknown, lo: number, hi: number) => typeof value === 'number' && Number.isInteger(value) && value >= lo && value <= hi
const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0
const isCoord = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

function parseHome(b: any): Omit<HomeRow, 'id' | 'created_at'> | null {
  if (!b || !isText(b.name) || !isText(b.address) || !isCoord(b.lat) || !isCoord(b.lng)) return null
  for (const key of ['transport', 'commerce', 'park', 'public']) if (!isInt(b[key], 0, 100)) return null
  return {
    name: b.name, address: b.address, lat: b.lat, lng: b.lng,
    transport: b.transport, commerce: b.commerce, park: b.park, public: b.public,
    transport_reason: String(b.transport_reason ?? ''), commerce_reason: String(b.commerce_reason ?? ''),
    park_reason: String(b.park_reason ?? ''), public_reason: String(b.public_reason ?? ''),
    selected: b.selected === undefined ? true : Boolean(b.selected),
  }
}

function parseHub(b: any): Omit<HubRow, 'id' | 'created_at' | 'display_order'> | null {
  if (!b || !isText(b.name) || !isText(b.address) || !isCoord(b.lat) || !isCoord(b.lng)) return null
  const category = b.category === undefined ? '주요 거점' : b.category
  if (!isText(category)) return null
  return { name: b.name, address: b.address, lat: b.lat, lng: b.lng, category }
}

const intList = (value: unknown): number[] | null =>
  value === undefined ? [] : Array.isArray(value) && value.every((v) => typeof v === 'number' && Number.isInteger(v)) ? value : null
const textList = (value: unknown): string[] | null =>
  value === undefined ? [] : Array.isArray(value) && value.every((v) => typeof v === 'string') ? value : null
const intMap = (value: unknown): Record<string, number> | null => {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const entries = Object.entries(value as Record<string, unknown>)
  return entries.every(([, v]) => typeof v === 'number' && Number.isInteger(v)) ? (value as Record<string, number>) : null
}

function parsePreference(b: any): MobilityPreference | null {
  if (!b || typeof b !== 'object') return null
  const weight = (value: unknown, fallback: number) => (value === undefined ? fallback : isInt(value, 0, 100) ? (value as number) : null)
  const primary = textList(b.primary_modes), secondary = textList(b.secondary_modes), priority = intList(b.transit_priority_hub_ids)
  const trips = intMap(b.hub_monthly_roundtrips), multipliers = intMap(b.hub_weight_multipliers)
  const transit = weight(b.transit_weight, 50), car = weight(b.car_weight, 30), active = weight(b.active_weight, 20)
  if (!primary || !secondary || !priority || !trips || !multipliers || transit === null || car === null || active === null) return null
  return { primary_modes: primary, secondary_modes: secondary, transit_weight: transit, car_weight: car, active_weight: active, transit_priority_hub_ids: priority, hub_monthly_roundtrips: trips, hub_weight_multipliers: multipliers }
}

function handle(method: string, parts: string[], query: URLSearchParams, body: any): Response {
  const [head, second, third] = parts
  const id = second !== undefined && /^\d+$/.test(second) ? Number(second) : NaN

  if (head === 'health' && method === 'GET') return json({ ok: true })

  if (head === 'homes' && !third) {
    const store = load()
    if (second === undefined) {
      if (method === 'GET') {
        let rows = store.homes
        if (query.has('selected')) {
          const want = ['true', '1', 'yes', 'on'].includes(String(query.get('selected')).toLowerCase())
          rows = rows.filter((h) => Boolean(h.selected) === want)
        }
        return json([...rows].sort((a, b) => a.id - b.id).map(asHome))
      }
      if (method === 'POST') {
        const data = parseHome(body)
        if (!data) return invalid()
        const row: HomeRow = { id: ++store.seq.homes, ...data, created_at: now() }
        store.homes.push(row)
        write(store)
        return json(asHome(row))
      }
    } else if (!Number.isNaN(id)) {
      const index = store.homes.findIndex((h) => h.id === id)
      if (method === 'GET') return index < 0 ? fail(404, '후보 주택을 찾을 수 없습니다.') : json(asHome(store.homes[index]))
      if (method === 'PUT') {
        const data = parseHome(body)
        if (!data) return invalid()
        if (index < 0) return fail(404, '후보 주택을 찾을 수 없습니다.')
        store.homes[index] = { ...store.homes[index], ...data }
        write(store)
        return json(asHome(store.homes[index]))
      }
      if (method === 'DELETE') {
        if (index < 0) return fail(404, '후보 주택을 찾을 수 없습니다.')
        store.homes.splice(index, 1)
        write(store)
        return json({ ok: true })
      }
    }
  }

  if (head === 'hubs' && !third) {
    const store = load()
    if (second === undefined) {
      if (method === 'GET') return json(sortHubs(store.hubs))
      if (method === 'POST') {
        const data = parseHub(body)
        if (!data) return invalid()
        const row: HubRow = { id: ++store.seq.hubs, ...data, created_at: now(), display_order: 999 }
        store.hubs.push(row)
        write(store)
        return json(row)
      }
    } else if (second === 'order' && method === 'PUT') {
      const ids = body && Array.isArray(body.hub_ids) && body.hub_ids.every((v: unknown) => Number.isInteger(v)) ? (body.hub_ids as number[]) : null
      if (!ids) return invalid()
      const existing = new Set(store.hubs.map((h) => h.id))
      if (new Set(ids).size !== existing.size || ids.length !== existing.size || ids.some((v) => !existing.has(v))) return fail(400, '저장된 거점 목록과 순서 정보가 일치하지 않습니다.')
      ids.forEach((hubId, position) => { store.hubs.find((h) => h.id === hubId)!.display_order = position })
      write(store)
      return json({ ok: true })
    } else if (!Number.isNaN(id)) {
      const index = store.hubs.findIndex((h) => h.id === id)
      if (method === 'PUT') {
        const data = parseHub(body)
        if (!data) return invalid()
        if (index < 0) return fail(404, '주요 거점을 찾을 수 없습니다.')
        store.hubs[index] = { ...store.hubs[index], ...data }
        write(store)
        return json(store.hubs[index])
      }
      if (method === 'DELETE') {
        if (index < 0) return fail(404, '주요 거점을 찾을 수 없습니다.')
        store.hubs.splice(index, 1)
        write(store)
        return json({ ok: true })
      }
    }
  }

  if (head === 'preferences' && second === undefined) {
    const store = load()
    if (method === 'GET') return json(store.preferences)
    if (method === 'PUT') {
      const data = parsePreference(body)
      if (!data) return invalid()
      store.preferences = data
      write(store)
      return json(store.preferences)
    }
  }

  if (head === 'accessibility' && !Number.isNaN(id) && !third && method === 'GET') {
    const store = load()
    const home = store.homes.find((h) => h.id === id)
    if (!home) return fail(404, '후보 주택을 찾을 수 없습니다.')
    const selected = [...store.homes].filter((h) => h.selected).sort((a, b) => a.id - b.id)
    return json(computeAccessibility(home, selected, sortHubs(store.hubs), store.preferences))
  }

  return fail(404, 'Not Found')
}

/** 원본 앱의 api(path, init) 와 같은 모양: 경로(예: 'homes', 'accessibility/3')와 fetch 옵션을 받아 Response 를 돌려준다. */
export const api = (path: string, init?: RequestInit): Promise<Response> => {
  const method = (init?.method ?? 'GET').toUpperCase()
  const [pathname, queryString = ''] = path.replace(/^\/+/, '').split('?')
  const parts = pathname.split('/').filter(Boolean)
  let body: unknown
  if (init?.body) {
    try {
      body = JSON.parse(String(init.body))
    } catch {
      return Promise.resolve(invalid())
    }
  }
  try {
    return Promise.resolve(handle(method, parts, new URLSearchParams(queryString), body))
  } catch (error) {
    return Promise.resolve(fail(500, String(error)))
  }
}
