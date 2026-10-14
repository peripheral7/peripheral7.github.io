// 영어 화면용 고유명사·주소 바꾸기(i18n.ts 의 pn·addr·catName 이 쓴다).
// 1) 사전(대학·브랜드·노선·공원 유형 등 공식 영문 이름) → 2) 규칙(○○역 → Station, ○○로·○○번길 → -ro·beon-gil,
//    ○○시·구·동 → -si·-gu·-dong, ○○공원·도서관 → Park·Library …) → 3) 나머지 한글은 국어의 로마자 표기법(연음·ㄹㄹ·비음화 일부).
// 새 자료(새 대학·브랜드)가 영어 화면에서 어색하면 아래 사전에 한 줄 더한다.

// ── 국어의 로마자 표기법 ──
const INI = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h']
const VOW = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i']
// 받침(뒤에 자음이 오거나 끝날 때) · 뒤에 ㅇ 이 오면 넘어가는 소리(연음)
const FIN = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't']
const LIA = ['', 'g', 'kk', 'ks', 'n', 'nj', 'n', 'd', 'r', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'r', 'm', 'b', 'bs', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', '']

/** 한글 → 로마자(소문자). 한글이 아닌 글자는 그대로. */
export function rr(s: string): string {
  const syl = [...s].map((ch) => {
    const c = ch.charCodeAt(0) - 0xac00
    return c >= 0 && c < 11172 ? { i: Math.floor(c / 588), v: Math.floor((c % 588) / 28), f: c % 28 } : ch
  })
  let out = ''
  for (let k = 0; k < syl.length; k++) {
    const x = syl[k]
    if (typeof x === 'string') { out += x; continue }
    const prev = k > 0 ? syl[k - 1] : null
    const next = k + 1 < syl.length ? syl[k + 1] : null
    let ini = INI[x.i]
    // 앞 받침과의 소리 이음: ㄹㄹ·ㄴㄹ → l, ㅁ·ㅇ 뒤 ㄹ → n, ㄱ·ㅂ 뒤 ㄹ → n
    if (prev && typeof prev !== 'string' && x.i === 5) {
      if (prev.f === 8 || prev.f === 4) ini = 'l'
      else if ([16, 21, 1, 17].includes(prev.f)) ini = 'n'
    }
    if (prev && typeof prev !== 'string' && x.i === 2 && prev.f === 8) ini = 'l' // ㄹㄴ → ll
    if (prev && typeof prev !== 'string' && x.i === 11 && prev.f !== 0 && prev.f !== 21) ini = '' // 연음은 앞 받침 쪽에서 처리
    let fin = FIN[x.f]
    if (next && typeof next !== 'string') {
      if (next.i === 11 && x.f !== 0) fin = LIA[x.f] // 연음
      else if (next.i === 5 && x.f === 4) fin = 'l' // ㄴㄹ → ll
      else if ((next.i === 2 || next.i === 6 || next.i === 5) && fin === 'k') fin = 'ng' // 비음화
      else if ((next.i === 2 || next.i === 6 || next.i === 5) && fin === 'p') fin = 'm'
      else if ((next.i === 2 || next.i === 6) && fin === 't') fin = 'n'
    }
    out += ini + VOW[x.v] + fin
  }
  return out
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const roman = (s: string) => cap(rr(s))

// ── 사전 ──
/** 목적지 분류 */
export const CATEGORY_EN: Record<string, string> = {
  학교: 'School', 본가: 'Family home', 직장: 'Work', 기타: 'Other', 교통센터: 'Transit hub', 상업시설: 'Shopping', 병원: 'Hospital',
  목적지: 'Destination', 지도: 'Map', 주소: 'Address', 대학교: 'University', 회사: 'Office',
}
/** 문장 전체가 이 이름이면 */
const NAME_EN: Record<string, string> = {
  '성남 분당 본가': 'Family home (Bundang, Seongnam)',
  '지도에서 고른 곳': 'Picked on map',
  '이름 없는 공원': 'Unnamed park',
}
/** 낱말(띄어쓰기 단위)이 이 이름이면 */
const WORD_EN: Record<string, string> = {
  // 대학·캠퍼스
  경희대: 'Kyung Hee Univ.', 경희대학교: 'Kyung Hee University', 국제캠퍼스: 'Global Campus',
  성균관대: 'SKKU', 성균관대학교: 'Sungkyunkwan University', 성균관대역: 'Sungkyunkwan Univ. Station', 광교중앙역: 'Gwanggyo Jungang Station', 자연과학캠퍼스: 'Natural Sciences Campus',
  아주대: 'Ajou Univ.', 아주대학교: 'Ajou University', 경기대: 'Kyonggi Univ.', 경기대학교: 'Kyonggi University', 수원캠퍼스: 'Suwon Campus',
  연세대: 'Yonsei Univ.', 연세대학교: 'Yonsei University', 연대: 'Yonsei', 신촌캠퍼스: 'Sinchon Campus',
  정문: 'Main Gate', 후문: 'Back Gate', 동문: 'East Gate', 서문: 'West Gate', 본가: 'Family Home', 부근: '(vicinity)',
  // 시도
  서울특별시: 'Seoul', 서울: 'Seoul', 경기도: 'Gyeonggi-do', 경기: 'Gyeonggi', 인천광역시: 'Incheon',
  // 브랜드·가게
  올리브영: 'Olive Young', 다이소: 'Daiso', 이마트: 'E-Mart', 이마트에브리데이: 'E-Mart Everyday', 홈플러스: 'Homeplus', 홈플러스익스프레스: 'Homeplus Express',
  스타벅스: 'Starbucks', 노브랜드: 'No Brand', 롯데슈퍼: 'Lotte Super', 롯데마트: 'Lotte Mart', 트레이더스: 'Traders', 코스트코: 'Costco',
  메가커피: 'Mega Coffee', 메가엠지씨커피: 'Mega MGC Coffee', 투썸플레이스: 'A Twosome Place', 이디야커피: 'Ediya Coffee', 이디야: 'Ediya', 빽다방: "Paik's Coffee", 컴포즈커피: 'Compose Coffee',
  GS더프레시: 'GS The Fresh', 하나로마트: 'Hanaro Mart', 농협하나로마트: 'Nonghyup Hanaro Mart',
  온커피로스터스: 'On Coffee Roasters', 슬로우제이커피공장: 'Slow J Coffee Factory', 눜커피: 'Nuk Coffee',
  예시: 'Sample', 공인중개사사무소: 'Real Estate Agency', 매물: 'Listing', 원룸: 'Studio', 분리형: 'Separated', 오피스텔: 'Officetel', 상가: 'Shop',
  // 철도 노선
  수인분당선: 'Suin-Bundang Line', 분당선: 'Bundang Line', 신분당선: 'Shinbundang Line', 경강선: 'Gyeonggang Line', 경의중앙선: 'Gyeongui-Jungang Line',
  공항철도: 'AREX', 에버라인: 'EverLine', 용인경전철: 'Yongin EverLine', 경부선: 'Gyeongbu Line', 수인선: 'Suin Line',
  // 공원 유형(도시공원법)
  근린공원: 'Neighborhood park', 어린이공원: "Children's park", 소공원: 'Mini park', 수변공원: 'Waterside park', 체육공원: 'Sports park',
  문화공원: 'Culture park', 역사공원: 'Heritage park', 도시자연공원: 'Urban nature park', 도시자연공원구역: 'Urban nature park', 묘지공원: 'Cemetery park', 주제공원: 'Theme park',
  공원: 'Park', 하천: 'Stream', 녹지: 'Green space',
}
/** 길 이름 앞부분(로마자로 바꾸면 어색한 외래어) */
const STEM_EN: Record<string, string> = { 센트럴타운: 'Central Town', 월드컵: 'World Cup', 디지털엠파이어: 'Digital Empire' }
/** 낱말 끝(앞부분은 다시 바꾼다) — 긴 것부터 */
const SUFFIX_EN: [string, string][] = ([
  ['수변공원', 'Waterside Park'], ['호수공원', 'Lake Park'], ['근린공원', 'Park'], ['어린이공원', "Children's Park"], ['체육공원', 'Sports Park'],
  ['문화공원', 'Culture Park'], ['역사공원', 'Heritage Park'], ['소공원', 'Mini Park'], ['공원', 'Park'],
  ['작은도서관', 'Small Library'], ['어린이도서관', "Children's Library"], ['도서관', 'Library'],
  ['대학교', 'University'], ['캠퍼스', 'Campus'], ['초등학교', 'Elementary School'], ['중학교', 'Middle School'], ['고등학교', 'High School'], ['학교', 'School'],
  ['아파트', 'Apartments'], ['오피스텔', 'Officetel'], ['시장', 'Market'], ['병원', 'Hospital'], ['의원', 'Clinic'], ['약국', 'Pharmacy'],
  ['센터', 'Center'], ['광장', 'Plaza'], ['정류장', 'Stop'], ['터미널', 'Terminal'], ['사거리', 'Junction'], ['삼거리', 'Junction'], ['입구', 'Entrance'],
  ['점', 'branch'], ['선', 'Line'],
] as [string, string][]).sort((a, b) => b[0].length - a[0].length)

const ROAD = /^([가-힣]+?)(대로|로|길)(\d+)?(번길|길)?$/
const ADMIN = /^([가-힣]+?)(\d+)?(특별시|광역시|특별자치시|특별자치도|시|군|구|읍|면|동|리)$/
const ADMIN_EN: Record<string, string> = { 특별시: '', 광역시: '', 특별자치시: '', 특별자치도: '', 시: '-si', 군: '-gun', 구: '-gu', 읍: '-eup', 면: '-myeon', 동: '-dong', 리: '-ri' }

/** 한 덩어리(한글로 시작하는, 띄어쓰기 없는 낱말) */
function word(w: string, bare = false): string {
  if (WORD_EN[w]) return WORD_EN[w]
  if (bare) return roman(w) // 공원·도서관 이름의 앞부분("신동"수변공원)은 동·로 규칙 없이
  let m: RegExpMatchArray | null
  if ((m = w.match(/^(\d+)층$/))) return `${m[1]}F`
  if ((m = w.match(/^지하(\d+)층$/))) return `B${m[1]}`
  if ((m = w.match(/^(\d+)호$/))) return `#${m[1]}`
  if ((m = w.match(/^(\d+)호선$/))) return `Line ${m[1]}`
  if ((m = w.match(/^([가-힣]+?)역(?:(\d+)번\s?출구)?$/)) && m[1].length >= 1) return `${word(m[1])} Station${m[2] ? ` Exit ${m[2]}` : ''}`
  if ((m = w.match(ROAD)) && m[1].length >= 1) {
    const stem = STEM_EN[m[1]] ?? roman(m[1])
    const base = `${stem}-${m[2] === '대로' ? 'daero' : m[2] === '로' ? 'ro' : 'gil'}`
    return m[3] ? `${base} ${m[3]}${m[4] === '번길' ? 'beon-gil' : '-gil'}` : base
  }
  if ((m = w.match(ADMIN)) && m[1].length >= 1 && w.length >= 2) return `${roman(m[1])}${m[2] ? ` ${m[2]}` : ''}${ADMIN_EN[m[3]]}`
  for (const [k, v] of SUFFIX_EN) {
    if (w.length > k.length && w.endsWith(k)) {
      const head = w.slice(0, -k.length)
      if (k === '점' && head.length < 2) break // "○점" 한 글자는 가게 지점이 아님
      if (k === '선' && head.length < 2) break
      return `${word(head, true)} ${v}`
    }
  }
  // 나머지: 한글 덩어리마다 로마자(첫 글자 대문자), 숫자 등은 그대로
  return w.replace(/[가-힣]+/g, (h) => roman(h))
}

/** 이름(후보지·목적지·매장·공원·정류장 …) → 영어 */
export function romanName(s: string): string {
  const k = s.trim()
  if (NAME_EN[k]) return NAME_EN[k]
  if (!/[가-힣]/.test(k)) return s
  if (k.startsWith('이름 없는 ')) return `Unnamed ${romanName(k.slice(6)).replace(/^\w/, (c) => c.toLowerCase())}`
  // 버스 노선 "5100수원" · "1560B용인" → "5100 (Suwon)"
  const bus = k.match(/^([0-9][0-9A-Za-z-]*)([가-힣]+)$/)
  if (bus) return `${bus[1]} (${romanName(bus[2])})`
  return k.replace(/[0-9]*[가-힣][가-힣0-9]*/g, (w) => word(w)).replace(/\s+/g, ' ').trim()
}

/** 주소 → 영어 순서(작은 단위 → 큰 단위): "16 Sinwon-ro 136beon-gil, Yeongtong-gu, Suwon-si, Gyeonggi-do" */
export function romanAddress(s: string): string {
  if (!/[가-힣]/.test(s)) return s
  const toks = s.trim().split(/\s+/)
  const near = toks[toks.length - 1] === '부근' ? (toks.pop(), ' (vicinity)') : ''
  return romanToks(toks) + near
}
function romanToks(toks: string[]): string {
  const one = (x: string) => romanName(x)
  const num = /^\d+(?:-\d+)?$/
  const ri = toks.findIndex((x) => ROAD.test(x))
  if (ri < 0) {
    // 지번·대략 주소: "영통동 123-4" → "123-4 Yeongtong-dong", 그다음 큰 단위 순서로
    const out: string[] = []
    for (const x of toks) {
      if (num.test(x) && out.length) out[out.length - 1] = `${x} ${out[out.length - 1]}`
      else out.push(one(x))
    }
    return out.reverse().join(', ')
  }
  const head = toks.slice(0, ri).map(one).reverse()
  let road = one(toks[ri])
  let rest = toks.slice(ri + 1)
  if (rest[0] && num.test(rest[0])) { road = `${rest[0]} ${road}`; rest = rest.slice(1) }
  return [...rest.map(one).reverse(), road, ...head].join(', ')
}
