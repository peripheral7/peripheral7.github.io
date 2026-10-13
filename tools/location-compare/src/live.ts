// 새 후보지(검색·지도로 넣은 곳) 계산 — place-search Worker 를 거쳐 사용자 PC 의 계산 서버(server/analyze-server.mjs)가 낸다.
// 상권·평화로움·공원·도서관 = /analyze(scripts 를 그대로 실행, 약 30초), 차량 시간 = /route(네이버 Directions, 지금 교통).
// 대중교통은 아직 개발 중 — 새 후보지는 대중교통을 비워 두고 점수에서도 뺀다(scoring.ts transitPending).
// 받은 결과는 이 브라우저에 저장해 다시 열어도 그대로 쓴다. 계산 서버가 꺼져 있으면 "계산 서버 꺼짐"으로 보인다.
import { CANDIDATES, type Candidate, type Hub } from './data'
import { SEARCH_URL } from './naver'

export type LiveStatus = 'loading' | 'ok' | 'offline' | 'outside' | 'error'
export type LiveAnalysis = {
  commercial: { lat: number; lng: number; counts: Record<string, Record<string, number>>; brand?: Record<string, Record<string, number>> }
  majors: { brand: string; cat: string; name: string; lat: number; lng: number; addr: string; inferred?: boolean }[]
  places: Record<string, unknown> & { lat: number; lng: number }
  stdrYm?: string; osmAt?: string; at: string
}
type Slot = { min: number; km: number; at: string }
export type LiveRoute = Partial<Record<'free' | 'rush', Slot>>

const KEY = 'locCompare.live.v1'
const r5 = (x: number) => (Math.round(x * 1e5) / 1e5).toFixed(5)
const pkey = (p: { lat: number; lng: number }) => `${r5(p.lat)},${r5(p.lng)}`
const store: { a: Record<string, LiveAnalysis>; r: Record<string, LiveRoute> } = (() => {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s?.a && s?.r) return s } catch { /* 새로 */ }
  return { a: {}, r: {} }
})()
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(store)) } catch { /* 저장 못 해도 화면은 동작 */ } }

/** 기본 후보지(미리 계산된 자료가 있는 곳)인가 — 같은 id 이고 좌표가 30m 안 */
export function isDefaultCandidate(c: Pick<Candidate, 'id' | 'lat' | 'lng'>): boolean {
  const d = CANDIDATES.find((x) => x.id === c.id)
  if (!d) return false
  const dy = (d.lat - c.lat) * 111320, dx = (d.lng - c.lng) * 111320 * Math.cos((c.lat * Math.PI) / 180)
  return Math.hypot(dx, dy) <= 30
}

export const liveAnalysis = (c: { lat: number; lng: number }): LiveAnalysis | null => store.a[pkey(c)] ?? null
export const liveRoute = (from: { lat: number; lng: number }, to: { lat: number; lng: number }): LiveRoute | null => store.r[`${pkey(from)}>${pkey(to)}`] ?? null
/** 지도에 보일 새 후보지 주변 주요 매장 */
export function liveMajors(cands: Candidate[]) {
  return cands.flatMap((c) => (isDefaultCandidate(c) ? [] : (liveAnalysis(c)?.majors ?? []).map((m) => ({ ...m, near: { [c.id]: 0 } }))))
}

// ── 요청 ──
const status: Record<string, LiveStatus> = {} // 좌표 → 상태(이 화면에서만)
const inflight = new Set<string>()
let notify: () => void = () => {}
export const statusOf = (c: { lat: number; lng: number }): LiveStatus | null => (liveAnalysis(c) ? 'ok' : status[pkey(c)] ?? null)

async function get(path: string): Promise<{ status: number; body: any }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const r = await fetch(SEARCH_URL.replace(/\/+$/, '') + path)
  return { status: r.status, body: await r.json().catch(() => ({})) }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchAnalysis(c: Candidate) {
  const k = pkey(c)
  if (inflight.has('a' + k) || store.a[k]) return
  inflight.add('a' + k)
  status[k] = 'loading'; notify()
  try {
    for (let i = 0; i < 90; i++) { // 4초 간격 최대 6분(앞에 다른 계산이 줄 서 있을 수 있다)
      const { status: s, body } = await get(`/analyze?lat=${c.lat}&lng=${c.lng}`)
      if (s === 200 && body.commercial) { store.a[k] = body; persist(); status[k] = 'ok'; return }
      if (s === 202) { await sleep(4000); continue }
      status[k] = s === 422 ? 'outside' : body.error === 'offline' ? 'offline' : 'error'
      return
    }
    status[k] = 'error'
  } catch { status[k] = 'offline' } finally { inflight.delete('a' + k); notify() }
}

async function fetchRoute(c: Candidate, h: Hub) {
  const k = `${pkey(c)}>${pkey(h)}`
  if (inflight.has('r' + k) || store.r[k]) return
  inflight.add('r' + k)
  try {
    const { status: s, body } = await get(`/route?from=${c.lat},${c.lng}&to=${h.lat},${h.lng}`)
    if (s === 200 && (body.free || body.rush)) { store.r[k] = body; persist(); notify() }
  } catch { /* 꺼져 있으면 추정으로 */ } finally { inflight.delete('r' + k) }
}

/** 새 후보지마다 분석·길찾기를 요청한다(없는 것만). onChange 는 결과가 들어올 때마다 불린다. */
export function requestLive(cands: Candidate[], hubs: Hub[], onChange: () => void) {
  if (!SEARCH_URL) return
  notify = onChange
  for (const c of cands) {
    if (isDefaultCandidate(c)) continue
    if (!store.a[pkey(c)] && status[pkey(c)] !== 'outside') void fetchAnalysis(c)
    for (const h of hubs) void fetchRoute(c, h)
  }
}

/** 꺼져 있었던 것 다시 시도 */
export function retryLive(cands: Candidate[], hubs: Hub[]) {
  for (const c of cands) if (status[pkey(c)] === 'offline' || status[pkey(c)] === 'error') delete status[pkey(c)]
  requestLive(cands, hubs, notify)
}

/** 상태 문구(자료가 없을 때 화면에 보일 말) */
export function liveNote(c: { lat: number; lng: number } | undefined): string {
  const s = c ? statusOf(c) : null
  return s === 'loading' ? '계산 중… (약 30초)' : s === 'offline' ? '계산 서버 꺼짐 — 나중에 다시' : s === 'outside' ? '서울·경기 밖이라 자료 없음' : s === 'error' ? '계산 실패' : '자료 없음'
}
