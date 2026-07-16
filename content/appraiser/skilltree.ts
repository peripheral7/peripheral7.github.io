export type TreeNode = {
  id: string
  name: string
  section: string
  children?: TreeNode[]
  /** 이 노드 아래 하위 잎(leaf)들의 간격 배율. 1이면 기본 간격, 0.5면 절반 */
  spacingScale?: number
}

export const sections: Record<string, { title: string; tier: 0 | 1 | 2 }> = {
  root: { title: "감정평가실무", tier: 0 },
  trunk: { title: "감정평가 3방식·관련법령·화폐의 시간가치·유형별 평가", tier: 0 },
  land: { title: "토지평가", tier: 1 },
  building: { title: "건물평가", tier: 1 },
  typeEval: { title: "기타평가", tier: 1 },
  comparison: { title: "비교방식 심화", tier: 1 },
  cost: { title: "원가방식 심화", tier: 1 },
  income: { title: "수익방식 심화", tier: 1 },
  "rent-rights": { title: "임대료 및 권리평가", tier: 2 },
  purpose: { title: "목적별평가", tier: 2 },
  special: { title: "특수평가 및 실무통합", tier: 2 },
}

// 트리 구조만 정의하면 좌표는 layoutTree()가 자동 계산합니다.
// 형제 가지는 항상 서로 겹치지 않는 폭으로 나뉘어 배치되므로,
// 별자리 선은 구조적으로 교차하지 않습니다.
export const skillTree: TreeNode = {
  id: "root0",
  name: "감정평가실무",
  section: "root",
  children: [
    {
      id: "t1",
      name: "감정평가 3방식(개관)",
      section: "trunk",
      children: [
        {
          id: "t2",
          name: "관련법령",
          section: "trunk",
          children: [
            {
              id: "t3",
              name: "화폐의 시간가치",
              section: "trunk",
              children: [
                {
                  id: "t4",
                  name: "유형별 평가",
                  section: "trunk",
                  spacingScale: 0.5,
                  children: [
                    // ── 첫 번째 대갈래: 토지 / 건물 / 기타 ──────────
                    {
                      id: "land0",
                      name: "토지평가",
                      section: "land",
                      children: [
                        { id: "a1", name: "토지평가 개관(공시지가기준법 원칙)", section: "land" },
                        { id: "a2", name: "지역분석·개별분석(토지)", section: "land" },
                        { id: "a3", name: "나지상정평가", section: "land" },
                        {
                          id: "s1",
                          name: "거래사례비교법 의의·산식",
                          section: "comparison",
                          children: [
                            {
                              id: "s2",
                              name: "사례선택기준",
                              section: "comparison",
                              children: [
                                {
                                  id: "s3",
                                  name: "사정보정",
                                  section: "comparison",
                                  children: [
                                    {
                                      id: "s4",
                                      name: "시점수정",
                                      section: "comparison",
                                      children: [
                                        {
                                          id: "s5",
                                          name: "지역·개별요인 비교",
                                          section: "comparison",
                                          children: [
                                            { id: "s6", name: "공시지가기준법 세부", section: "comparison" },
                                            {
                                              id: "s7",
                                              name: "임대사례비교법",
                                              section: "comparison",
                                              children: [
                                                {
                                                  id: "p1",
                                                  name: "담보평가",
                                                  section: "purpose",
                                                  children: [
                                                    { id: "p2", name: "경매평가", section: "purpose" },
                                                    {
                                                      id: "p3",
                                                      name: "보상평가",
                                                      section: "purpose",
                                                      children: [{ id: "p5", name: "도시정비평가", section: "purpose" }],
                                                    },
                                                    { id: "p4", name: "재무보고목적평가", section: "purpose" },
                                                    {
                                                      id: "p6",
                                                      name: "국공유재산평가",
                                                      section: "purpose",
                                                      children: [
                                                        {
                                                          id: "x1",
                                                          name: "조건부평가",
                                                          section: "special",
                                                          children: [
                                                            {
                                                              id: "x2",
                                                              name: "소송평가",
                                                              section: "special",
                                                              children: [
                                                                {
                                                                  id: "x3",
                                                                  name: "특수토지평가",
                                                                  section: "special",
                                                                  children: [
                                                                    { id: "x4", name: "오염부동산평가", section: "special" },
                                                                  ],
                                                                },
                                                              ],
                                                            },
                                                            { id: "x5", name: "종합사례", section: "special" },
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  ],
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      id: "bldg0",
                      name: "건물평가",
                      section: "building",
                      children: [
                        { id: "b1", name: "건물평가 개관(원가법 원칙)", section: "building" },
                        { id: "o3", name: "구분소유부동산평가", section: "building" },
                        {
                          id: "c1",
                          name: "원가법 의의·산식",
                          section: "cost",
                          children: [
                            {
                              id: "c2",
                              name: "재조달원가 산정",
                              section: "cost",
                              children: [
                                {
                                  id: "c3",
                                  name: "감가수정",
                                  section: "cost",
                                  children: [{ id: "c5", name: "건물 내용연수·잔가율", section: "cost" }],
                                },
                              ],
                            },
                            { id: "c4", name: "적산법(임대료)", section: "cost" },
                          ],
                        },
                        {
                          id: "i1",
                          name: "수익환원법 의의·산식",
                          section: "income",
                          children: [
                            {
                              id: "i2",
                              name: "직접환원법 vs DCF",
                              section: "income",
                              children: [
                                {
                                  id: "i3",
                                  name: "순수익 산정",
                                  section: "income",
                                  children: [{ id: "i4", name: "환원율 산정", section: "income" }],
                                },
                              ],
                            },
                            { id: "i5", name: "수익분석법(임대료)", section: "income" },
                            {
                              id: "i6",
                              name: "잔여법(토지·건물)",
                              section: "income",
                              children: [
                                {
                                  id: "r1",
                                  name: "임대료 평가 개관",
                                  section: "rent-rights",
                                  children: [
                                    { id: "r2", name: "신규·계속임대료", section: "rent-rights" },
                                    {
                                      id: "r3",
                                      name: "권리금 평가",
                                      section: "rent-rights",
                                      children: [
                                        { id: "r4", name: "지상권·임차권 평가", section: "rent-rights" },
                                        { id: "r5", name: "구분지상권 평가", section: "rent-rights" },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      id: "type0",
                      name: "기타평가",
                      section: "typeEval",
                      spacingScale: 0.5,
                      children: [
                        { id: "o4", name: "기계기구평가", section: "typeEval" },
                        { id: "o5", name: "무형자산평가", section: "typeEval" },
                        { id: "o6", name: "유가증권평가", section: "typeEval" },
                        { id: "o7", name: "동산평가", section: "typeEval" },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

function hashSeed(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000
  return (h / 1000) * Math.PI * 2
}

// ── 좌표 자동 계산 ─────────────────────────────────────────────
// 1단계: 기존과 동일한 방식(잎은 커서 누적, 부모는 자식 평균)으로
//        절대 겹치지 않는 "기본 x(baseX)"를 계산합니다.
// 2단계: 트렁크(root0~t4)는 그대로 직선 유지, 그 아래 가지들은
//        갈래마다 고유한 흔들림(사인파)을 더해 나무처럼 휘어 보이게 합니다.
//        흔들림은 baseX 위에 "더하기"만 하므로, 기본 골격의 비교차 특성은
//        그대로 유지되고 시각적으로만 자연스럽게 휩니다.
export function layoutTree(
  root: TreeNode,
  opts: { xSpacing: number; ySpacing: number; rootY?: number },
) {
  const rootY = opts.rootY ?? 700
  const baseX = new Map<string, number>()
  const depthOf = new Map<string, number>()
  const scaleOf = new Map<string, number>()
  const edges: [string, string][] = []
  let cursorX = 0

  function computeBase(node: TreeNode, depth: number, inheritedScale: number): number {
    const scale = node.spacingScale ?? inheritedScale
    scaleOf.set(node.id, scale)
    depthOf.set(node.id, depth)

    let x: number
    if (!node.children || node.children.length === 0) {
      x = cursorX
      cursorX += opts.xSpacing * scale
    } else {
      const childXs = node.children.map((child) => {
        edges.push([node.id, child.id])
        return computeBase(child, depth + 1, scale)
      })
      x = childXs.reduce((a, b) => a + b, 0) / childXs.length
    }
    baseX.set(node.id, x)
    return x
  }

  computeBase(root, 0, 1)

  // 전체 x를 가운데 정렬
  const xs = [...baseX.values()]
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2

  // 2단계: 흔들림 적용 (트렁크는 흔들리지 않고, t4의 자식부터 시작)
  const positions = new Map<string, { x: number; y: number; name: string; section: string }>()
  const TRUNK_IDS = new Set(["root0", "t1", "t2", "t3", "t4"])

  function applySway(
    node: TreeNode,
    swayActive: boolean,
    seed: number,
    startDepth: number,
  ) {
    const depth = depthOf.get(node.id)!
    const scale = scaleOf.get(node.id)!
    const isTrunk = TRUNK_IDS.has(node.id)

    let x = baseX.get(node.id)! - centerX
    if (swayActive && !isTrunk) {
      const amplitude = opts.xSpacing * scale * 0.4
      x += Math.sin((depth - startDepth) * 0.55 + seed) * amplitude
    }
    const y = rootY - depth * opts.ySpacing
    positions.set(node.id, { x, y, name: node.name, section: node.section })

    if (!node.children) return

    // t4 자식부터 흔들림 시작
    const nextActive = swayActive || node.id === "t4"

    if (node.children.length > 1) {
      // 갈래가 갈라지는 지점: 각 자식마다 새로운 흔들림 방향 부여
      for (const child of node.children) {
        applySway(child, nextActive, hashSeed(child.id), depth + 1)
      }
    } else {
      // 외갈래 이어짐: 같은 흔들림을 이어받아 부드럽게 연속
      for (const child of node.children) {
        applySway(child, nextActive, seed, startDepth)
      }
    }
  }

  applySway(root, false, 0, 0)

  return { positions, edges }
}