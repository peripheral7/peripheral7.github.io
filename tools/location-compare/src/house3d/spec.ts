// 후보지 → 3D 집 설계(모양·지붕 색·둘레 장식 + 장식마다 붙은 까닭). three 를 불러오지 않는 가벼운 파일 — 카드(첫 화면 묶음)가 부른다.
// 규칙 표는 HOUSE3D.md 3·3-1절. 시험·구경용: 주소에 ?house=brick&opts=cat,cafe,park 를 붙이면 모든 후보지가 그 모양·장식으로 바뀐다.
import type { Candidate, Preference } from '../data'
import { placeOf } from '../places'
import { ENOUGH, walk5Counts } from '../commercial'
import { t } from '../i18n'
import { roofColor } from './colors'

/** 집 모양: 박공지붕 주택 · 평지붕 주택(양옥·다가구) · 적벽돌 다가구 · 주거용 오피스텔. 방문자가 고르지 않는다(사용자 결정 10-14) — 용도로만 정한다. */
export type HouseKind = 'home' | 'flat' | 'brick' | 'officetel'
export const HOUSE_KINDS: HouseKind[] = ['home', 'flat', 'brick', 'officetel']
/** 둘레 장식 */
export type HouseOption = 'bus' | 'car' | 'bike' | 'walk' | 'tree' | 'park' | 'cafe' | 'cat' | 'library'
export const HOUSE_OPTIONS: HouseOption[] = ['bus', 'car', 'bike', 'walk', 'tree', 'park', 'cafe', 'cat', 'library']
export const OPTION_EMOJI: Record<HouseOption, string> = { bus: '🚏', car: '🚗', bike: '🚲', walk: '🚶', tree: '🌲', park: '🌳', cafe: '☕', cat: '🐈', library: '📚' }
export const OPTION_LABEL: Record<HouseOption, string> = {
  bus: t('버스 정류장', 'Bus stop'), car: t('자동차', 'Car'), bike: t('자전거', 'Bike'), walk: t('횡단보도', 'Crosswalk'), tree: t('나무', 'Tree'),
  park: t('공원 산책길', 'Park path'), cafe: t('카페 테이블', 'Café table'), cat: t('고양이', 'Cat'), library: t('작은 도서관', 'Little library'),
}
const KIND_LABEL: Record<HouseKind, string> = { home: t('박공지붕 주택', 'Gable-roof house'), flat: t('평지붕 주택', 'Flat-roof house'), brick: t('적벽돌 다가구', 'Red-brick multi-family'), officetel: t('오피스텔', 'Officetel') }

export type House3DProps = { kind: HouseKind; roof: string; options: HouseOption[]; animKey: string }
/** 집 크게 보기 창에 쓰는 설명: 모양 이름 + 장식마다 까닭 */
export type HouseNotes = { kindLabel: string; why: { o: HouseOption; text: string }[] }

/** 자동 장식 기준(넘으면 붙는다) */
export const OPTION_RULES = {
  mode: 30, // 라이프스타일 수단 비율 ≥ 30% → 그 수단 장식(대중교통 🚏 · 차량 🚗 · 도보 🚶 · 자전거 🚲)
  park: 7, // 입지 요인 🌳 공원 점수 ≥ 7
  library: 8, // 📚 도서관 점수 ≥ 8
  quiet: 9, // 🕊️ 평화로움 점수 ≥ 9 → 고양이
  cafe: ENOUGH.cafe as number, // 도보 5분 안 카페 수 ≥ 상권 "충분" 기준(50곳)
}
const MODE_OPTION = [['transit', 'bus'], ['car', 'car'], ['walk', 'walk'], ['bike', 'bike']] as const
const MODE_NAME: Record<string, string> = { transit: t('대중교통', 'transit'), car: t('차량', 'car'), walk: t('도보', 'walking'), bike: t('자전거', 'bike') }

// 주소 덮어쓰기(?house= · ?opts=) — 한 번만 읽는다
const q = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search)
const forceKind = HOUSE_KINDS.find((k) => k === q.get('house'))
const forceOpts = q.has('opts') ? (q.get('opts') || '').split(',').filter((o): o is HouseOption => HOUSE_OPTIONS.includes(o as HouseOption)) : null

/** 장식이 서는 칸(집 둘레, 카메라에서 보이는 쪽) — A 화면 왼쪽 · B 왼쪽 아래(현관 앞) · C 아래 · D 오른쪽 아래 · E 오른쪽 */
export const SLOTS = { A: [-5.8, 2.6], B: [-1.2, 6.0], C: [4.8, 4.8], D: [6.0, -1.2], E: [2.6, -5.8] } as const
type Slot = keyof typeof SLOTS
/** 장식마다 좋아하는 칸(앞쪽부터). 칸이 차 있으면 다음 칸, 다 차면 그 장식은 빠진다(최대 5개) */
const PREFER: Record<Exclude<HouseOption, 'park'>, Slot[]> = {
  cafe: ['C', 'B', 'D'],
  cat: ['B', 'C', 'A'],
  tree: ['A', 'E', 'D'],
  library: ['D', 'A', 'E'],
  bike: ['D', 'E', 'C'],
  car: ['E', 'D', 'A'],
  bus: ['A', 'E', 'D'],
  walk: ['C', 'B', 'D'],
}

/** 칸 배정: 앞 순서(spec.ts 가 정한 순서) 장식부터 좋아하는 칸을 차지한다 */
export function placeOptions(options: HouseOption[]) {
  const used = new Set<Slot>()
  const out: { o: Exclude<HouseOption, 'park'>; slot: Slot }[] = []
  for (const o of options) {
    if (o === 'park') continue
    const slot = PREFER[o].find((s) => !used.has(s)) ?? (Object.keys(SLOTS) as Slot[]).find((s) => !used.has(s))
    if (!slot) continue
    used.add(slot)
    out.push({ o, slot })
  }
  return out
}

export function houseSpec(c: Candidate, rank: number, pref?: Pick<Preference, 'weights' | 'bike'>): House3DProps & { notes: HouseNotes } {
  // 모양: 용도로(오피스텔 → 오피스텔, 상가·기타 → 평지붕 건물, 그 밖 → 박공지붕 주택)
  const kind: HouseKind = forceKind ?? (c.use === 'officetel' ? 'officetel' : c.use === 'other' ? 'flat' : 'home')
  const why: HouseNotes['why'] = []
  const add = (o: HouseOption, text: string) => why.push({ o, text })
  if (forceOpts) forceOpts.forEach((o) => add(o, t('시험 주소(?opts=)', 'Test URL (?opts=)')))
  else {
    // 앞에 있을수록 좋은 칸을 먼저 차지한다(options.tsx placeOptions) — 방문자가 고른 라이프스타일이 먼저
    const w = pref?.weights
    const sum = w ? Object.values(w).reduce((a, v) => a + (v || 0), 0) : 0
    for (const [m, o] of MODE_OPTION) {
      const pct = sum ? Math.round((100 * ((w as Record<string, number>)[m] || 0)) / sum) : 0
      if (pct >= OPTION_RULES.mode) add(o, t(`라이프스타일 ${MODE_NAME[m]} ${pct}%`, `Lifestyle: ${MODE_NAME[m]} ${pct}%`))
      else if (o === 'bike' && pref?.bike) add(o, t('자전거 사용 켬', 'Bike enabled'))
    }
    const p = placeOf(c), cafes = walk5Counts(c)?.cafe ?? 0
    if (p && p.park.score >= OPTION_RULES.park) add('park', t(`공원 점수 ${p.park.score}`, `Park score ${p.park.score}`))
    if (cafes >= OPTION_RULES.cafe) add('cafe', t(`도보 5분 안 카페 ${cafes}곳`, `${cafes} cafés within a 5-min walk`))
    if (p && p.peace.score >= OPTION_RULES.quiet) add('cat', t(`평화로움 점수 ${p.peace.score}`, `Quietness score ${p.peace.score}`))
    if (p && p.library.score >= OPTION_RULES.library) add('library', t(`도서관 점수 ${p.library.score}`, `Library score ${p.library.score}`))
    if (rank === 1) add('tree', t('종합 1위', 'Ranked #1 overall'))
  }
  // 칸이 모자라 빠지는 장식은 설명에서도 뺀다(공원은 칸을 안 씀)
  const placed = new Set<HouseOption>(['park', ...placeOptions(why.map((x) => x.o)).map((x) => x.o)])
  const shown = why.filter((x) => placed.has(x.o))
  return { kind, roof: roofColor(rank), options: shown.map((x) => x.o), animKey: c.id, notes: { kindLabel: KIND_LABEL[kind], why: shown } }
}
