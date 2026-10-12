// 도보 5분 상권 지수 — 이 PC 에서 만든 src/commercial.json(scripts/stores.mjs analyze)만 읽는다. 공개 사이트는 API 를 부르지 않는다.
//
// 방문자가 업종마다 "필수 / 선호 / 안 봄"을 고른다(이 브라우저에 저장).
// 업종 점수 = 도보 5분(400m) 안 개수 ÷ 후보지 중 가장 많은 개수 × 10 (1등 10점, 상대 점수 — 다른 점수와 같은 방식)
// 상권 지수 = 필수 업종 점수 평균 × 0.8 + 선호 업종 점수 평균 × 0.2 (한쪽이 비면 다른 쪽이 100%, 묶음 안은 균등)
// 자료는 기본 후보지만 있다 — 검색으로 넣은 후보지는 "자료 없음"(PC 에서 data.ts 에 넣고 analyze 를 다시 돌려야 한다).
import data from './commercial.json'
import type { Candidate } from './data'

export type Tier = 'need' | 'want' | 'off'
export type CommercialPrefs = { on: boolean; need: string[]; want: string[] }
export type CatInfo = { id: string; label: string; emoji: string }
export type Major = { brand: string; cat: string; name: string; lat: number; lng: number; addr: string; inferred?: boolean; near: Record<string, number> }
export type CatPart = { id: string; tier: Exclude<Tier, 'off'>; count: number; score: number }
export type CommercialIndex = { score: number; parts: CatPart[] } | null

export const NEED_WEIGHT = 0.8
export const WANT_WEIGHT = 0.2
export const WALK5 = data.walk5 // m
export const STDR_YM = data.stdrYm
export const CATEGORIES: CatInfo[] = data.categories.map(({ id, label, emoji }) => ({ id, label, emoji }))
export const MAJORS = data.majors as Major[]
/** 자료가 얇아 믿기 어려운 업종(설명 문구) */
export const THIN: Record<string, string> = { variety: '상가정보에 다이소·생활용품점 등록이 매우 적어 개수를 믿기 어렵습니다' }

type Row = { lat: number; lng: number; counts: Record<string, Record<string, number>> }
const ROWS = data.candidates as Record<string, Row>

/** 그 후보지의 자료(같은 id 이고 좌표가 30m 안일 때만 — 이름만 같은 다른 곳을 막는다) */
function rowOf(c: Candidate): Row | null {
  const r = ROWS[c.id]
  if (!r) return null
  const dy = (r.lat - c.lat) * 111320, dx = (r.lng - c.lng) * 111320 * Math.cos((c.lat * Math.PI) / 180)
  return Math.hypot(dx, dy) <= 30 ? r : null
}

export const tierOf = (p: CommercialPrefs, id: string): Tier => (p.need.includes(id) ? 'need' : p.want.includes(id) ? 'want' : 'off')
export function setTier(p: CommercialPrefs, id: string, t: Tier): CommercialPrefs {
  const need = p.need.filter((x) => x !== id), want = p.want.filter((x) => x !== id)
  if (t === 'need') need.push(id)
  if (t === 'want') want.push(id)
  return { ...p, need, want }
}
/** 지금 고른(필수·선호) 업종 */
export const pickedCats = (p: CommercialPrefs) => new Set([...p.need, ...p.want])

/** 업종별 도보 5분 안 개수(자료 없는 후보지는 null) */
export function walk5Counts(c: Candidate | undefined): Record<string, number> | null {
  const r = c ? rowOf(c) : null
  return r ? Object.fromEntries(CATEGORIES.map((k) => [k.id, r.counts[k.id]?.[WALK5] ?? 0])) : null
}

export function commercialIndex(candidates: Candidate[], p: CommercialPrefs): CommercialIndex[] {
  const rows = candidates.map(rowOf)
  const ids = [...p.need, ...p.want]
  const max = Object.fromEntries(ids.map((id) => [id, Math.max(0, ...rows.map((r) => r?.counts[id]?.[WALK5] ?? 0))]))
  return rows.map((r) => {
    if (!r || !ids.length) return null
    const parts: CatPart[] = ids.map((id) => {
      const count = r.counts[id]?.[WALK5] ?? 0
      return { id, tier: p.need.includes(id) ? 'need' : 'want', count, score: max[id] > 0 ? (10 * count) / max[id] : 0 }
    })
    const avg = (t: CatPart['tier']) => { const x = parts.filter((q) => q.tier === t); return x.length ? x.reduce((a, q) => a + q.score, 0) / x.length : null }
    const need = avg('need'), want = avg('want')
    const score = need !== null && want !== null ? need * NEED_WEIGHT + want * WANT_WEIGHT : (need ?? want)!
    return { score, parts }
  })
}

const KEY = 'locCompare.commercial.v1'
export function loadCommercial(): CommercialPrefs {
  const d = data.defaultPrefs
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    const known = (a: unknown) => (Array.isArray(a) ? a.filter((x): x is string => CATEGORIES.some((c) => c.id === x)) : null)
    if (s) return { on: s.on !== false, need: known(s.need) ?? d.need, want: known(s.want) ?? d.want }
  } catch { /* 망가진 저장값은 기본값으로 */ }
  return { on: true, need: [...d.need], want: [...d.want] }
}
export function saveCommercial(p: CommercialPrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* 저장 못 해도 화면은 동작 */ }
}
