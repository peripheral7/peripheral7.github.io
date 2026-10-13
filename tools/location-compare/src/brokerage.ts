// 예상 중개수수료(중개보수) — 법정 "상한"을 계산한다(실제 보수는 이 안에서 중개사와 협의). 부가가치세 별도.
//
// 근거(경기도 부동산 중개보수 요율 안내 https://gris.gg.go.kr/reb/selectRebRateView.do, 2026-10-13 확인)
//  - 주택(부속토지 포함): 「경기도 주택 중개보수 등에 관한 조례」 별표1(2022.3.4. 시행)
//  - 오피스텔: 「공인중개사법 시행규칙」 제20조 제4항·별표2 — 전용 85㎡ 이하 + 전용 부엌·전용 수세식 화장실·목욕시설
//    (주거용 설비)을 갖춘 경우 매매·교환 1천분의 5, 임대차 등 1천분의 4. 그 밖의 오피스텔은 1천분의 9 이내
//  - 그 외(토지·상가 등): 「공인중개사법 시행규칙」 제20조 — 거래금액의 1천분의 9 이내
//  - 거래금액: 보증금 외 차임이 있으면 보증금 + 월차임 × 100, 그 합이 5천만원 미만이면 보증금 + 월차임 × 70(시행규칙 제20조 제5항)
//  - 건축물 중 주택 면적이 1/2 이상이면 주택, 1/2 미만이면 주택 외(제20조 제6항) — 여기서는 "용도"로 고른다
//  - 중개보수 = 거래금액 × 상한요율, 단 한도액을 넘을 수 없다. 의뢰인 쌍방에게서 각각 받는다(아래 값은 한쪽 몫)
// 금액 단위: 입력은 만원, 결과 수수료는 원.

/** 용도: 주택(아파트·빌라·원룸 등) · 주거용 오피스텔(85㎡ 이하·부엌·욕실) · 상가·기타(토지·상가·85㎡ 초과 오피스텔) */
export type PropertyUse = 'home' | 'officetel' | 'other'
export const USE_LABEL: Record<PropertyUse, string> = { home: '주택', officetel: '주거용 오피스텔', other: '상가·기타' }
/** 화면 표시: 주거용 / 상가용 */
export const useGroup = (u: PropertyUse) => (u === 'other' ? '상가용' : '주거용')
/** 거래: 매매·교환 / 임대차(전세·월세) */
export type Deal = 'sale' | 'lease'

type Band = { below: number | null; rate: number; cap: number | null } // below: 이 금액(만원) 미만까지, cap: 한도액(원)
/** 경기도 주택 중개보수 조례 별표1 */
export const HOME_BANDS: Record<Deal, Band[]> = {
  sale: [
    { below: 5000, rate: 0.006, cap: 250_000 },
    { below: 20000, rate: 0.005, cap: 800_000 },
    { below: 90000, rate: 0.004, cap: null },
    { below: 120000, rate: 0.005, cap: null },
    { below: 150000, rate: 0.006, cap: null },
    { below: null, rate: 0.007, cap: null },
  ],
  lease: [
    { below: 5000, rate: 0.005, cap: 200_000 },
    { below: 10000, rate: 0.004, cap: 300_000 },
    { below: 60000, rate: 0.003, cap: null },
    { below: 120000, rate: 0.004, cap: null },
    { below: 150000, rate: 0.005, cap: null },
    { below: null, rate: 0.006, cap: null },
  ],
}
export const OFFICETEL_RATE: Record<Deal, number> = { sale: 0.005, lease: 0.004 }
export const OTHER_RATE = 0.009
export const VAT = 0.1

/** 거래금액(만원). 매매는 매매가, 임대차는 보증금 + 월세 × 100(합이 5천만원 미만이면 × 70). */
export function dealAmount(deal: Deal, o: { price?: number; deposit?: number; rent?: number }): number {
  if (deal === 'sale') return o.price ?? 0
  const dep = o.deposit ?? 0, rent = o.rent ?? 0
  if (!rent) return dep
  const a = dep + rent * 100
  return a < 5000 ? dep + rent * 70 : a
}

export type Fee = {
  amount: number // 거래금액(만원)
  rate: number // 상한요율
  cap: number | null // 한도액(원)
  fee: number // 중개보수 상한(원, 한쪽 몫, 부가세 별도)
  vat: number // 부가세(원, 일반과세자 중개사일 때)
  basis: string // 근거 한 줄
  formula: string // 계산식 한 줄
}

/** 중개보수 상한. 금액은 만원. */
export function brokerageFee(use: PropertyUse, deal: Deal, o: { price?: number; deposit?: number; rent?: number }): Fee {
  const amount = dealAmount(deal, o)
  let rate: number, cap: number | null = null, basis: string
  if (use === 'home') {
    const b = HOME_BANDS[deal].find((x) => x.below === null || amount < x.below)!
    rate = b.rate; cap = b.cap
    basis = '경기도 주택 중개보수 조례 별표1'
  } else if (use === 'officetel') {
    rate = OFFICETEL_RATE[deal]
    basis = '공인중개사법 시행규칙 별표2(주거용 오피스텔)'
  } else {
    rate = OTHER_RATE
    basis = '공인중개사법 시행규칙 제20조(주택 외)'
  }
  const raw = Math.round(amount * 10000 * rate)
  const fee = cap === null ? raw : Math.min(raw, cap)
  const won = (n: number) => n.toLocaleString('ko-KR')
  const amountText = deal === 'lease' && o.rent ? `${won(o.deposit ?? 0)} + ${won(o.rent)} × ${amount === (o.deposit ?? 0) + o.rent * 100 ? 100 : 70} = ${won(amount)}만원` : `${won(amount)}만원`
  const formula = `${amountText} × ${(rate * 1000).toFixed(0)}/1000${cap !== null && raw > cap ? ` → 한도 ${won(cap)}원` : ''}`
  return { amount, rate, cap, fee, vat: Math.round(fee * VAT), basis, formula }
}

/** 18,000원 → "1.8만원", 1,350,000원 → "135만원" */
export const feeText = (won: number) => (won >= 10000 ? `${(Math.round(won / 1000) / 10).toLocaleString('ko-KR')}만원` : `${won.toLocaleString('ko-KR')}원`)
