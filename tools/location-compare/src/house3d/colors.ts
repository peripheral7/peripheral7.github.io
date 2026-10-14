// 3D 집과 SVG 집이 함께 쓰는 값 — three 를 불러오지 않는 가벼운 파일이라 카드(첫 화면 묶음)에서 써도 3D 코드가 딸려오지 않는다.
import type { PropertyUse } from '../brokerage'

/** 지붕 색 = 순위(1위 초록 → 아래로 갈수록 회색빛) */
export const roofColor = (rank: number) => ['#3f9a62', '#5e8f9e', '#8a7fa8', '#a08868'][Math.min(3, Math.max(0, rank - 1))]

export type HouseKind = 'home' | 'officetel' | 'shop'
/** 용도 → 집 모양(용도가 없으면 주택) */
export const houseKind = (use?: PropertyUse): HouseKind => (use === 'officetel' ? 'officetel' : use === 'other' ? 'shop' : 'home')

export type House3DProps = { kind: HouseKind; roof: string; tree: boolean; animKey: string }
