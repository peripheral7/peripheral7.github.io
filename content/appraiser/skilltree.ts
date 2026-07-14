export type SkillNode = {
  id: string
  name: string
  x: number
  y: number
  section: string
}

export type SkillEdge = [string, string]

export const sections: Record<string, { title: string; tier: 0 | 1 | 2 }> = {
  root: { title: "감정평가실무", tier: 0 },
  foundation: { title: "기초이론", tier: 0 },
  "object-base": { title: "토지·건물평가", tier: 0 },
  "object-extra": { title: "물건별평가(기타)", tier: 1 },
  cost: { title: "원가방식", tier: 1 },
  comparison: { title: "비교방식", tier: 1 },
  income: { title: "수익방식", tier: 1 },
  "rent-rights": { title: "임대료 및 권리평가", tier: 2 },
  purpose: { title: "목적별평가", tier: 2 },
  special: { title: "특수평가 및 실무통합", tier: 2 },
}

// 나무 모양: 아래(기초이론+토지·건물평가)에서 시작해 위로 갈라지고,
// 꼭대기에서 다시 하나로 수렴합니다. 기존 저장 데이터와의 호환을 위해
// 별 id는 이전 버전과 동일하게 유지했습니다 (위치·연결만 재구성).
export const nodes: SkillNode[] = [
  // ── 줄기: 뿌리 → 기초이론 → 토지·건물평가 ──────────────────
  { id: "root0", name: "감정평가실무", x: 0, y: 900, section: "root" },
  { id: "f1", name: "감정평가의 개념과 기능", x: 0, y: 820, section: "foundation" },
  { id: "f2", name: "감정평가 3방식의 의의", x: 0, y: 740, section: "foundation" },
  { id: "f3", name: "부동산가격 제원칙", x: -10, y: 660, section: "foundation" },
  { id: "f4", name: "지역분석", x: 10, y: 580, section: "foundation" },
  { id: "f5", name: "개별분석(최유효이용)", x: -10, y: 500, section: "foundation" },
  { id: "f6", name: "가치형성요인 분석", x: 10, y: 420, section: "foundation" },
  { id: "f7", name: "시점수정과 요인비교", x: 0, y: 340, section: "foundation" },
  { id: "o1", name: "토지평가", x: -15, y: 260, section: "object-base" },
  { id: "o2", name: "건물평가", x: 15, y: 180, section: "object-base" },
  { id: "o3", name: "구분소유부동산평가", x: 0, y: 100, section: "object-base" },

  // ── 줄기 옆 잔가지: 나머지 물건별평가 ────────────────────────
  { id: "o4", name: "기계기구평가", x: -140, y: 140, section: "object-extra" },
  { id: "o5", name: "무형자산평가", x: 140, y: 140, section: "object-extra" },
  { id: "o6", name: "유가증권평가", x: -160, y: 60, section: "object-extra" },
  { id: "o7", name: "동산평가", x: 160, y: 60, section: "object-extra" },

  // ── 왼쪽 큰 가지: 원가방식 ────────────────────────────────
  { id: "c1", name: "원가법 의의·산식", x: -160, y: 20, section: "cost" },
  { id: "c2", name: "재조달원가 산정", x: -220, y: -60, section: "cost" },
  { id: "c3", name: "감가수정", x: -260, y: -140, section: "cost" },
  { id: "c4", name: "적산법(임대료)", x: -320, y: -220, section: "cost" },
  { id: "c5", name: "건물 내용연수·잔가율", x: -190, y: -180, section: "cost" },

  // ── 가운데 큰 가지: 비교방식 ──────────────────────────────
  { id: "s1", name: "거래사례비교법 의의·산식", x: 0, y: 10, section: "comparison" },
  { id: "s2", name: "사례선택기준", x: -50, y: -80, section: "comparison" },
  { id: "s3", name: "사정보정", x: -100, y: -160, section: "comparison" },
  { id: "s4", name: "시점수정", x: 30, y: -160, section: "comparison" },
  { id: "s5", name: "지역·개별요인 비교", x: 90, y: -90, section: "comparison" },
  { id: "s6", name: "공시지가기준법", x: 10, y: -240, section: "comparison" },
  { id: "s7", name: "임대사례비교법", x: 110, y: -170, section: "comparison" },

  // ── 오른쪽 큰 가지: 수익방식 ──────────────────────────────
  { id: "i1", name: "수익환원법 의의·산식", x: 160, y: 20, section: "income" },
  { id: "i2", name: "직접환원법 vs DCF", x: 220, y: -60, section: "income" },
  { id: "i3", name: "순수익 산정", x: 280, y: -140, section: "income" },
  { id: "i4", name: "환원율 산정", x: 200, y: -180, section: "income" },
  { id: "i5", name: "수익분석법(임대료)", x: 320, y: -220, section: "income" },
  { id: "i6", name: "잔여법(토지·건물)", x: 150, y: -140, section: "income" },

  // ── 위쪽 왼쪽 갈래: 임대료 및 권리평가 (2차) ──────────────
  { id: "r1", name: "임대료 평가 개관", x: 60, y: -320, section: "rent-rights" },
  { id: "r2", name: "신규·계속임대료", x: 0, y: -400, section: "rent-rights" },
  { id: "r3", name: "권리금 평가", x: 40, y: -480, section: "rent-rights" },
  { id: "r4", name: "지상권·임차권 평가", x: 100, y: -460, section: "rent-rights" },
  { id: "r5", name: "구분지상권 평가", x: -30, y: -460, section: "rent-rights" },

  // ── 위쪽 오른쪽 갈래: 목적별평가 (2차) ─────────────────────
  { id: "p1", name: "담보평가", x: -260, y: -300, section: "purpose" },
  { id: "p2", name: "경매평가", x: -300, y: -380, section: "purpose" },
  { id: "p3", name: "보상평가", x: -240, y: -460, section: "purpose" },
  { id: "p4", name: "재무보고목적평가", x: -180, y: -420, section: "purpose" },
  { id: "p5", name: "도시정비평가", x: -200, y: -500, section: "purpose" },
  { id: "p6", name: "국공유재산평가", x: -320, y: -460, section: "purpose" },

  // ── 꼭대기: 특수평가 및 실무통합 (2차 수렴점) ──────────────
  { id: "x1", name: "조건부평가", x: -100, y: -560, section: "special" },
  { id: "x2", name: "소송평가", x: -140, y: -620, section: "special" },
  { id: "x3", name: "특수토지평가", x: -60, y: -640, section: "special" },
  { id: "x4", name: "오염부동산평가", x: 0, y: -600, section: "special" },
  { id: "x5", name: "종합사례", x: -80, y: -700, section: "special" },
]

export const edges: SkillEdge[] = [
  // 줄기
  ["root0", "f1"], ["f1", "f2"], ["f2", "f3"], ["f3", "f4"], ["f4", "f5"],
  ["f5", "f6"], ["f6", "f7"], ["f7", "o1"], ["o1", "o2"], ["o2", "o3"],
  // 잔가지
  ["o2", "o4"], ["o2", "o5"], ["o3", "o6"], ["o3", "o7"],
  // 세 갈래로 분기
  ["o3", "c1"], ["o3", "s1"], ["o3", "i1"],
  // 원가방식
  ["c1", "c2"], ["c2", "c3"], ["c3", "c4"], ["c2", "c5"],
  // 비교방식
  ["s1", "s2"], ["s2", "s3"], ["s2", "s4"], ["s1", "s5"], ["s4", "s6"], ["s5", "s7"],
  // 수익방식
  ["i1", "i2"], ["i2", "i3"], ["i3", "i4"], ["i3", "i5"], ["i2", "i6"],
  // 임대료·권리평가로 합류
  ["s6", "r1"], ["i5", "r1"], ["r1", "r2"], ["r2", "r3"], ["r3", "r4"], ["r3", "r5"],
  // 목적별평가로 합류
  ["c4", "p1"], ["o1", "p1"], ["p1", "p2"], ["p2", "p3"], ["p3", "p4"], ["p3", "p5"], ["p2", "p6"],
  // 꼭대기(특수평가)로 최종 수렴
  ["r5", "x1"], ["p3", "x1"], ["x1", "x2"], ["x2", "x3"], ["x2", "x4"], ["x1", "x5"],
]

export const appraiserSkillTree = { nodes, edges, sections }