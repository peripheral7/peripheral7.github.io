export type StarNode = { id: string; name: string; x: number; y: number }

export type Branch = {
  id: string
  title: string
  /** 0: 루트(허브), 1: 1차, 2: 2차 */
  tier: 0 | 1 | 2
  /** 360도 하늘에서 이 갈래가 위치하는 각도 */
  angle: number
  stars: StarNode[]
  links: [string, string][]
}

export const appraiserSkillTree: { branches: Branch[]; crossLinks: [string, string][] } = {
  branches: [
    {
      id: "root",
      title: "감정평가실무",
      tier: 0,
      angle: 0,
      stars: [{ id: "root", name: "감정평가실무", x: 0, y: -150 }],
      links: [],
    },
    {
      id: "foundation",
      title: "기초이론",
      tier: 1,
      angle: 0,
      stars: [
        { id: "f1", name: "감정평가의 개념과 기능", x: -120, y: -10 },
        { id: "f2", name: "감정평가 3방식의 의의", x: -70, y: -50 },
        { id: "f3", name: "부동산가격 제원칙", x: -20, y: -90 },
        { id: "f4", name: "지역분석", x: 10, y: -20 },
        { id: "f5", name: "개별분석(최유효이용)", x: 60, y: -60 },
        { id: "f6", name: "가치형성요인 분석", x: 100, y: 10 },
        { id: "f7", name: "시점수정과 요인비교", x: 40, y: 40 },
      ],
      links: [["f1", "f2"], ["f2", "f3"], ["f2", "f4"], ["f4", "f5"], ["f5", "f6"], ["f4", "f7"]],
    },
    {
      id: "cost-approach",
      title: "원가방식",
      tier: 1,
      angle: 45,
      stars: [
        { id: "c1", name: "원가법 의의·산식", x: -100, y: 20 },
        { id: "c2", name: "재조달원가 산정", x: -40, y: -40 },
        { id: "c3", name: "감가수정", x: 20, y: -70 },
        { id: "c4", name: "적산법(임대료)", x: 70, y: -20 },
        { id: "c5", name: "건물 내용연수·잔가율", x: 30, y: 50 },
      ],
      links: [["c1", "c2"], ["c2", "c3"], ["c3", "c4"], ["c2", "c5"]],
    },
    {
      id: "comparison-approach",
      title: "비교방식",
      tier: 1,
      angle: 90,
      stars: [
        { id: "s1", name: "거래사례비교법 의의·산식", x: -130, y: 0 },
        { id: "s2", name: "사례선택기준", x: -80, y: -50 },
        { id: "s3", name: "사정보정", x: -20, y: -80 },
        { id: "s4", name: "시점수정", x: 30, y: -50 },
        { id: "s5", name: "지역·개별요인 비교", x: 80, y: -10 },
        { id: "s6", name: "공시지가기준법", x: 60, y: 50 },
        { id: "s7", name: "임대사례비교법", x: 0, y: 80 },
      ],
      links: [["s1", "s2"], ["s2", "s3"], ["s3", "s4"], ["s4", "s5"], ["s5", "s6"], ["s1", "s7"]],
    },
    {
      id: "income-approach",
      title: "수익방식",
      tier: 1,
      angle: 135,
      stars: [
        { id: "i1", name: "수익환원법 의의·산식", x: -110, y: -10 },
        { id: "i2", name: "직접환원법 vs DCF", x: -50, y: -60 },
        { id: "i3", name: "순수익 산정", x: 10, y: -90 },
        { id: "i4", name: "환원율 산정", x: 60, y: -40 },
        { id: "i5", name: "수익분석법(임대료)", x: 90, y: 20 },
        { id: "i6", name: "잔여법(토지·건물)", x: 20, y: 50 },
      ],
      links: [["i1", "i2"], ["i2", "i3"], ["i3", "i4"], ["i4", "i5"], ["i2", "i6"]],
    },
    {
      id: "object-specific",
      title: "물건별평가",
      tier: 1,
      angle: 180,
      stars: [
        { id: "o1", name: "토지평가", x: -130, y: 10 },
        { id: "o2", name: "건물평가", x: -80, y: -40 },
        { id: "o3", name: "구분소유부동산평가", x: -20, y: -80 },
        { id: "o4", name: "기계기구평가", x: 40, y: -60 },
        { id: "o5", name: "무형자산평가", x: 90, y: -10 },
        { id: "o6", name: "유가증권평가", x: 70, y: 50 },
        { id: "o7", name: "동산평가", x: 10, y: 70 },
      ],
      links: [["o1", "o2"], ["o2", "o3"], ["o3", "o4"], ["o4", "o5"], ["o5", "o6"], ["o2", "o7"]],
    },
    {
      id: "rent-rights",
      title: "임대료 및 권리평가",
      tier: 2,
      angle: 225,
      stars: [
        { id: "r1", name: "임대료 평가 개관", x: -100, y: 0 },
        { id: "r2", name: "신규·계속임대료", x: -40, y: -50 },
        { id: "r3", name: "권리금 평가", x: 30, y: -40 },
        { id: "r4", name: "지상권·임차권 평가", x: 80, y: 10 },
        { id: "r5", name: "구분지상권 평가", x: 30, y: 60 },
      ],
      links: [["r1", "r2"], ["r2", "r3"], ["r3", "r4"], ["r3", "r5"]],
    },
    {
      id: "purpose-specific",
      title: "목적별평가",
      tier: 2,
      angle: 270,
      stars: [
        { id: "p1", name: "담보평가", x: -120, y: 0 },
        { id: "p2", name: "경매평가", x: -60, y: -50 },
        { id: "p3", name: "보상평가", x: 0, y: -80 },
        { id: "p4", name: "재무보고목적평가", x: 60, y: -40 },
        { id: "p5", name: "도시정비평가", x: 100, y: 20 },
        { id: "p6", name: "국공유재산평가", x: 40, y: 60 },
      ],
      links: [["p1", "p2"], ["p2", "p3"], ["p3", "p4"], ["p4", "p5"], ["p3", "p6"]],
    },
    {
      id: "special-integrated",
      title: "특수평가 및 실무통합",
      tier: 2,
      angle: 315,
      stars: [
        { id: "x1", name: "조건부평가", x: -110, y: 10 },
        { id: "x2", name: "소송평가", x: -50, y: -50 },
        { id: "x3", name: "특수토지평가", x: 20, y: -70 },
        { id: "x4", name: "오염부동산평가", x: 70, y: -10 },
        { id: "x5", name: "종합사례", x: 30, y: 50 },
      ],
      links: [["x1", "x2"], ["x2", "x3"], ["x3", "x4"], ["x4", "x5"], ["x1", "x5"]],
    },
  ],
  // 갈래 사이를 잇는 연결선 — "하나의 큰 별자리"를 만드는 핵심
  crossLinks: [
    ["root", "f1"],
    ["f4", "c1"],
    ["f4", "s1"],
    ["f4", "i1"],
    ["f4", "o1"],
    ["s6", "r1"],
    ["i5", "r1"],
    ["o1", "p1"],
    ["r5", "x1"],
    ["p3", "x1"],
  ],
}