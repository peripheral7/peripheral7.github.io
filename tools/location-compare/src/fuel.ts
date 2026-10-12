// 기름값 기본값: 오피넷 평균 휘발유 가격(scripts/fetch-fuel.mjs 가 이 PC 에서 받아 src/fuel.json 에 남긴다).
// 후보지 주소의 "시도 시군구"로 찾는다: 시군구 평균 → 없으면 시도 평균 → 없으면 null(commute.ts 의 DEFAULT_FUEL).
import fuel from './fuel.json'

type FuelFile = { at: string | null; sido: Record<string, number>; sigun: Record<string, number> }
const DATA = fuel as FuelFile

// "경기도"·"서울특별시"·"전북특별자치도"·"충청북도" → "경기"·"서울"·"전북"·"충북"(오피넷 이름도 같은 방법으로 맞춘다)
export function shortSido(s: string): string {
  const t = s.trim()
  const two = [['충청북', '충북'], ['충청남', '충남'], ['전라북', '전북'], ['전라남', '전남'], ['경상북', '경북'], ['경상남', '경남']]
  for (const [a, b] of two) if (t.startsWith(a)) return b
  return t.slice(0, 2)
}
// "수원시"·"수원" 모두 "수원"으로(끝의 시·군·구를 뗀다, 한 글자 이름은 그대로)
const stem = (s: string) => (s.length > 2 ? s.replace(/[시군구]$/, '') : s)

const SIDO = new Map(Object.entries(DATA.sido).map(([k, v]) => [shortSido(k), v]))
const SIGUN = new Map(Object.entries(DATA.sigun).map(([k, v]) => {
  const [sd, ...rest] = k.split(' ')
  return [`${shortSido(sd)} ${stem(rest.join(' '))}`, v]
}))

export type FuelPrice = { price: number; area: string; at: string | null }

/** 주소 → 그 지역 평균 휘발유 가격(원/L). 자료가 없으면 null. */
export function fuelPriceFor(address: string): FuelPrice | null {
  const [sd, sg] = address.trim().split(/\s+/)
  if (!sd) return null
  const sido = shortSido(sd)
  if (sg) {
    const p = SIGUN.get(`${sido} ${stem(sg)}`)
    if (p) return { price: Math.round(p), area: sg, at: DATA.at }
  }
  const p = SIDO.get(sido)
  return p ? { price: Math.round(p), area: sido, at: DATA.at } : null
}
