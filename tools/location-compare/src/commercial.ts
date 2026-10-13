// 도보 5분 상권 지수 — 이 PC 에서 만든 src/commercial.json(scripts/stores.mjs analyze)만 읽는다. 공개 사이트는 API 를 부르지 않는다.
//
// 방문자가 업종마다 "필수 / 선호 / 안 봄"을 고른다(이 브라우저에 저장).
// 업종 점수 = 10 × (1 − 10^(−개수 ÷ 기준 개수)) — 반경 500m. 기준 개수("이만하면 됐다", ENOUGH)에서 9점, 2배에서 9.9점.
//   한계효용 체감: 처음 몇 곳이 점수를 크게 올리고, 기준을 넘으면 아무리 많아도 거의 안 오른다(10점을 넘지 않음). 다른 후보지와 상관없는 절대 점수.
// 상권 지수 = 필수 업종 점수 평균 × 0.8 + 선호 업종 점수 평균 × 0.2 (한쪽이 비면 다른 쪽이 100%, 묶음 안은 균등)
// 자료: 기본 후보지 = 이 파일(commercial.json), 검색으로 넣은 후보지 = 계산 서버가 같은 스크립트로 낸 결과(live.ts).
import data from './commercial.json'
import type { Candidate } from './data'
import { isDefaultCandidate, liveAnalysis } from './live'

export type Tier = 'need' | 'want' | 'off'
export type CommercialPrefs = { on: boolean; need: string[]; want: string[] }
export type CatInfo = { id: string; label: string; emoji: string }
export type Major = { brand: string; cat: string; name: string; lat: number; lng: number; addr: string; inferred?: boolean; near: Record<string, number> }
export type CatPart = { id: string; tier: Exclude<Tier, 'off'>; count: number; brand: number; score: number }
export type CommercialIndex = { score: number; parts: CatPart[] } | null

export const NEED_WEIGHT = 0.8
export const WANT_WEIGHT = 0.2
export const WALK5 = data.walk5 // m(상권 지수 반경, 500)
/** 자전거를 고르면 반경 2배(commercial.json 에 1,000m 개수가 같이 들어 있다) */
export const radiusOf = (bike?: boolean) => (bike ? WALK5 * 2 : WALK5)
/** 업종별 기준 개수(이만하면 됐다) — commercial-categories.json 의 enough */
export const ENOUGH = data.enough as Record<string, number>
/** 개수 → 업종 점수(0~10) */
const sat = (n: number, t: number) => 10 * (1 - Math.pow(10, -n / (t || 1)))
/** 브랜드 몫(잡화 = 개수 50% + 올리브영·다이소 50%) — commercial-categories.json 의 brand_part */
export const BRAND_PARTS = (data.brandParts ?? {}) as Record<string, { label: string; enough: number; weight: number }>
/** 개수(·브랜드 매장 수) → 업종 점수(0~10) */
export const catScore = (id: string, n: number, brand = 0) => {
  const bp = BRAND_PARTS[id]
  return bp ? sat(n, ENOUGH[id]) * (1 - bp.weight) + sat(brand, bp.enough) * bp.weight : sat(n, ENOUGH[id])
}
export const STDR_YM = data.stdrYm
export const CATEGORIES: CatInfo[] = data.categories.map(({ id, label, emoji }) => ({ id, label, emoji }))
export const MAJORS = data.majors as Major[]
/** 자료가 얇아 믿기 어려운 업종(설명 문구) */
export const THIN: Record<string, string> = { goods: '다이소·생활용품점은 상가정보에 등록이 매우 적어 실제보다 적게 셀 수 있습니다' }

type Row = { lat: number; lng: number; counts: Record<string, Record<string, number>>; brand?: Record<string, Record<string, number>> }
const ROWS = data.candidates as Record<string, Row>

/** 그 후보지의 자료(같은 id 이고 좌표가 30m 안일 때만 — 이름만 같은 다른 곳을 막는다) */
function rowOf(c: Candidate): Row | null {
  const r = ROWS[c.id]
  if (!r || !isDefaultCandidate(c)) return (liveAnalysis(c)?.commercial as Row | undefined) ?? null
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
export function walk5Counts(c: Candidate | undefined, bike?: boolean): Record<string, number> | null {
  const r = c ? rowOf(c) : null
  return r ? Object.fromEntries(CATEGORIES.map((k) => [k.id, r.counts[k.id]?.[radiusOf(bike)] ?? 0])) : null
}
/** 브랜드 몫 매장 수(예: 잡화의 올리브영·다이소) */
export function walk5Brand(c: Candidate | undefined, bike?: boolean): Record<string, number> | null {
  const r = c ? rowOf(c) : null
  return r ? Object.fromEntries(Object.keys(BRAND_PARTS).map((id) => [id, r.brand?.[id]?.[radiusOf(bike)] ?? 0])) : null
}

export function commercialIndex(candidates: Candidate[], p: CommercialPrefs, bike?: boolean): CommercialIndex[] {
  const R = radiusOf(bike)
  const rows = candidates.map(rowOf)
  const ids = [...p.need, ...p.want]
  return rows.map((r) => {
    if (!r || !ids.length) return null
    const parts: CatPart[] = ids.map((id) => {
      const count = r.counts[id]?.[R] ?? 0
      const brand = r.brand?.[id]?.[R] ?? 0
      return { id, tier: p.need.includes(id) ? 'need' : 'want', count, brand, score: catScore(id, count, brand) }
    })
    const avg = (t: CatPart['tier']) => { const x = parts.filter((q) => q.tier === t); return x.length ? x.reduce((a, q) => a + q.score, 0) / x.length : null }
    const need = avg('need'), want = avg('want')
    const score = need !== null && want !== null ? need * NEED_WEIGHT + want * WANT_WEIGHT : (need ?? want)!
    return { score, parts }
  })
}

const KEY = 'locCompare.commercial.v2' // v2(10-13): 업종 정리(잡화 묶음·음식점 삭제)로 기본 선택을 새로 — 옛 v1 은 무시
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
