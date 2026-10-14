// 후보지 → 3D 집 설계(모양·지붕 색·둘레 장식). three 를 불러오지 않는 가벼운 파일 — 카드(첫 화면 묶음)가 부른다.
// 규칙 표는 HOUSE3D.md 3·3-1절. 시험·구경용: 주소에 ?house=brick&opts=cat,cafe,park 를 붙이면 모든 후보지가 그 모양·장식으로 바뀐다.
import type { Candidate } from '../data'
import { placeOf } from '../places'
import { ENOUGH, walk5Counts } from '../commercial'
import { roofColor } from './colors'

/** 집 모양: 박공지붕 주택 · 평지붕 주택(양옥·다가구) · 적벽돌 다가구 · 주거용 오피스텔 */
export type HouseKind = 'home' | 'flat' | 'brick' | 'officetel'
export const HOUSE_KINDS: HouseKind[] = ['home', 'flat', 'brick', 'officetel']
/** 둘레 장식 */
export type HouseOption = 'tree' | 'park' | 'cafe' | 'cat' | 'library' | 'bike' | 'car' | 'bus'
export const HOUSE_OPTIONS: HouseOption[] = ['tree', 'park', 'cafe', 'cat', 'library', 'bike', 'car', 'bus']

export type House3DProps = { kind: HouseKind; roof: string; options: HouseOption[]; animKey: string }

/** 자동 장식 기준(넘으면 붙는다) */
export const OPTION_RULES = {
  park: 7, // 입지 요인 🌳 공원 점수 ≥ 7
  library: 8, // 📚 도서관 점수 ≥ 8
  quiet: 9, // 🕊️ 평화로움 점수 ≥ 9 → 고양이
  cafe: ENOUGH.cafe as number, // 도보 5분 안 카페 수 ≥ 상권 "충분" 기준(50곳)
}

// 주소 덮어쓰기(?house= · ?opts=) — 한 번만 읽는다
const q = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search)
const forceKind = HOUSE_KINDS.find((k) => k === q.get('house'))
const forceOpts = q.has('opts') ? (q.get('opts') || '').split(',').filter((o): o is HouseOption => HOUSE_OPTIONS.includes(o as HouseOption)) : null

export function houseSpec(c: Candidate, rank: number): House3DProps {
  // 모양: 용도로(오피스텔 → 오피스텔, 상가·기타 → 평지붕 건물, 그 밖 → 박공지붕 주택). 후보지별 고르기는 다음 단계(HOUSE3D.md 10절).
  const kind: HouseKind = forceKind ?? (c.use === 'officetel' ? 'officetel' : c.use === 'other' ? 'flat' : 'home')
  let options: HouseOption[]
  if (forceOpts) options = forceOpts
  else {
    // 앞에 있을수록 좋은 칸을 먼저 차지한다(options.tsx placeOptions)
    const p = placeOf(c), cafes = walk5Counts(c)?.cafe ?? 0
    options = []
    if (p && p.park.score >= OPTION_RULES.park) options.push('park')
    if (cafes >= OPTION_RULES.cafe) options.push('cafe')
    if (p && p.peace.score >= OPTION_RULES.quiet) options.push('cat')
    if (p && p.library.score >= OPTION_RULES.library) options.push('library')
    if (rank === 1) options.push('tree')
  }
  return { kind, roof: roofColor(rank), options, animKey: c.id }
}
