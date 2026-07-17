export type BranchDirection = "left" | "center" | "right"

export type TreeNode = {
  id: string
  name: string
  section: string
  children?: TreeNode[]
  branchDirection?: BranchDirection
  spacingScale?: number
}

export const sections: Record<string, { title: string; tier: number }> = {
  root: { title: "감정평가실무", tier: 0 },
  trunk: { title: "기초·평가방식·유형별 평가", tier: 0 },
  land: { title: "토지평가", tier: 1 },
  building: { title: "건물평가", tier: 1 },
  comparison: { title: "비교방식", tier: 1 },
  cost: { title: "원가방식", tier: 1 },
  income: { title: "수익방식", tier: 1 },
  rent: { title: "임대료·권리평가", tier: 2 },
  typeEval: { title: "유형별·기타평가", tier: 2 },
  purpose: { title: "목적별·도시정비평가", tier: 2 },
  special: { title: "특수토지평가", tier: 2 },
}

export const skillTree: TreeNode = {
  id: "root0",
  name: "감정평가실무",
  section: "root",
  children: [
    {
      id: "t1",
      name: "감정평가기초",
      section: "trunk",
      children: [
        {
          id: "t2",
          name: "감정평가 3방식",
          section: "trunk",
          children: [
            {
              id: "t3",
              name: "관련법령·실무기준",
              section: "trunk",
              children: [
                {
                  id: "t4",
                  name: "유형별 평가",
                  section: "trunk",
                  children: [
                    {
                      id: "bldg0",
                      name: "건물평가",
                      section: "building",
                      branchDirection: "left",
                      children: [
                        {
                          id: "bldg1",
                          name: "건물평가 개관",
                          section: "building",
                          children: [
                            {
                              id: "bldg2",
                              name: "원가방식",
                              section: "cost",
                              children: [
                                {
                                  id: "bldg3",
                                  name: "재조달원가",
                                  section: "cost",
                                },
                                {
                                  id: "bldg4",
                                  name: "감가수정",
                                  section: "cost",
                                  children: [
                                    {
                                      id: "bldg5",
                                      name: "내용연수·잔가율",
                                      section: "cost",
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              id: "bldg6",
                              name: "건물 거래사례비교법",
                              section: "comparison",
                              children: [
                                {
                                  id: "bldg7",
                                  name: "회귀분석",
                                  section: "comparison",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          id: "bldg8",
                          name: "토지·건물 결합평가",
                          section: "building",
                          children: [
                            {
                              id: "bldg9",
                              name: "토지건물 일괄평가",
                              section: "building",
                            },
                          ],
                        },
                        {
                          id: "bldg10",
                          name: "구분소유 부동산",
                          section: "building",
                          children: [
                            {
                              id: "bldg11",
                              name: "구분건물 감정평가",
                              section: "building",
                            },
                          ],
                        },
                      ],
                    },

                    {
                      id: "land0",
                      name: "토지평가",
                      section: "land",
                      branchDirection: "center",
                      children: [
                        {
                          id: "land1",
                          name: "토지평가 개관",
                          section: "land",
                          children: [
                            {
                              id: "land2",
                              name: "공시지가기준법",
                              section: "land",
                              children: [
                                {
                                  id: "land3",
                                  name: "지역·개별요인 분석",
                                  section: "land",
                                },
                                {
                                  id: "land4",
                                  name: "나지상정평가",
                                  section: "land",
                                },
                              ],
                            },
                            {
                              id: "land5",
                              name: "거래사례비교법",
                              section: "comparison",
                              children: [
                                {
                                  id: "land6",
                                  name: "사례선택·사정보정",
                                  section: "comparison",
                                },
                                {
                                  id: "land7",
                                  name: "시점수정",
                                  section: "comparison",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          id: "land8",
                          name: "특수토지평가",
                          section: "special",
                          children: [
                            {
                              id: "land9",
                              name: "둘 이상의 용도지역 토지",
                              section: "special",
                            },
                            {
                              id: "land10",
                              name: "도시계획시설저촉토지",
                              section: "special",
                            },
                            {
                              id: "land11",
                              name: "개발법",
                              section: "special",
                            },
                            {
                              id: "land12",
                              name: "골프장 평가",
                              section: "special",
                            },
                          ],
                        },
                        {
                          id: "land13",
                          name: "토지 권리평가",
                          section: "rent",
                          children: [
                            {
                              id: "land14",
                              name: "지상권 평가",
                              section: "rent",
                            },
                            {
                              id: "land15",
                              name: "구분지상권 설정토지",
                              section: "rent",
                            },
                          ],
                        },
                      ],
                    },

                    {
                      id: "type0",
                      name: "유형별·기타평가",
                      section: "typeEval",
                      branchDirection: "right",
                      children: [
                        {
                          id: "type1",
                          name: "수익성 부동산 평가",
                          section: "income",
                          children: [
                            {
                              id: "type2",
                              name: "수익환원법",
                              section: "income",
                              children: [
                                {
                                  id: "type3",
                                  name: "직접환원법",
                                  section: "income",
                                },
                                {
                                  id: "type4",
                                  name: "할인현금흐름법",
                                  section: "income",
                                },
                                {
                                  id: "type5",
                                  name: "환원율·순수익 산정",
                                  section: "income",
                                },
                              ],
                            },
                            {
                              id: "type6",
                              name: "오피스 투자평가",
                              section: "purpose",
                              children: [
                                {
                                  id: "type7",
                                  name: "오피스 매입 감정평가",
                                  section: "purpose",
                                },
                                {
                                  id: "type8",
                                  name: "타당성분석",
                                  section: "purpose",
                                },
                                {
                                  id: "type9",
                                  name: "매후환대차",
                                  section: "purpose",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          id: "type10",
                          name: "임대료평가",
                          section: "rent",
                          children: [
                            {
                              id: "type11",
                              name: "임대사례비교법",
                              section: "rent",
                            },
                            {
                              id: "type12",
                              name: "적산법",
                              section: "rent",
                            },
                            {
                              id: "type13",
                              name: "수익분석법",
                              section: "rent",
                            },
                            {
                              id: "type14",
                              name: "신규·계속임대료",
                              section: "rent",
                            },
                          ],
                        },
                        {
                          id: "type15",
                          name: "기업·무형자산평가",
                          section: "typeEval",
                          children: [
                            {
                              id: "type16",
                              name: "기업가치평가",
                              section: "typeEval",
                            },
                            {
                              id: "type17",
                              name: "기계기구평가",
                              section: "typeEval",
                            },
                            {
                              id: "type18",
                              name: "지식재산권 평가",
                              section: "typeEval",
                              children: [
                                {
                                  id: "type19",
                                  name: "영업권 감정평가",
                                  section: "typeEval",
                                },
                                {
                                  id: "type20",
                                  name: "비상장주식 감정평가",
                                  section: "typeEval",
                                },
                                {
                                  id: "type21",
                                  name: "총자산가치 산정",
                                  section: "typeEval",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          id: "type22",
                          name: "목적별·도시정비평가",
                          section: "purpose",
                          children: [
                            {
                              id: "type23",
                              name: "담보 및 경매평가",
                              section: "purpose",
                            },
                            {
                              id: "type24",
                              name: "최유효이용분석",
                              section: "purpose",
                            },
                            {
                              id: "type25",
                              name: "도시정비평가",
                              section: "purpose",
                              children: [
                                {
                                  id: "type26",
                                  name: "종전자산평가",
                                  section: "purpose",
                                },
                                {
                                  id: "type27",
                                  name: "관리처분계획",
                                  section: "purpose",
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
}

function hashSeed(id: string): number {
  let hash = 0

  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1000
  }

  return (hash / 1000) * Math.PI * 2
}

export function layoutTree(
  root: TreeNode,
  opts: {
    xSpacing: number
    ySpacing: number
    rootY?: number
  },
) {
  const edges: [string, string][] = []
  const weightById = new Map<string, number>()
  const angleById = new Map<string, number>()
  const depthById = new Map<string, number>()
  const SIBLING_ARC_COMPRESSION = 0.82

  const positions = new Map<
    string,
    {
      x: number
      y: number
      name: string
      section: string
    }
  >()

  // 화면 좌표계에서 위쪽은 y가 감소합니다.
  // 215도~325도 부채꼴은 루트에서 위쪽으로만 펼쳐집니다.
  const FAN_START = (215 * Math.PI) / 180
  const FAN_END = (325 * Math.PI) / 180

  function calculateWeight(node: TreeNode, inheritedScale: number): number {
    const scale = node.spacingScale ?? inheritedScale
    const children = node.children ?? []

    if (children.length === 0) {
      const weight = scale
      weightById.set(node.id, weight)
      return weight
    }

    const weight = children.reduce(
      (total, child) => total + calculateWeight(child, scale),
      0,
    )

    weightById.set(node.id, weight)
    return weight
  }

  function assignLayout(
    node: TreeNode,
    depth: number,
    start: number,
    end: number,
  ) {
    const angle = (start + end) / 2

    angleById.set(node.id, angle)
    depthById.set(node.id, depth)

    const children = node.children ?? []
    if (children.length === 0) return

    const totalWeight = children.reduce(
      (total, child) => total + (weightById.get(child.id) ?? 1),
      0,
    )

    const center = (start + end) / 2
    const compactSpan = (end - start) * SIBLING_ARC_COMPRESSION
    const compactStart = center - compactSpan / 2

    let cursor = compactStart

    for (const child of children) {
      const childWeight = weightById.get(child.id) ?? 1
      const childArc = ((end - start) * childWeight) / totalWeight
      const childEnd = cursor + childArc

      edges.push([node.id, child.id])
      assignLayout(child, depth + 1, cursor, childEnd)

      cursor = childEnd
    }
  }

  function createPositions(node: TreeNode) {
    const depth = depthById.get(node.id) ?? 0
    const angle = angleById.get(node.id) ?? -Math.PI / 2

    // 이전 150px보다 줄인 128px 간격.
    // 컴포넌트의 X_SPACING 값과 함께 사용되어 전체 간격도 조밀해집니다.
    const radius = depth * opts.xSpacing

    positions.set(node.id, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      name: node.name,
      section: node.section,
    })

    for (const child of node.children ?? []) {
      createPositions(child)
    }
  }

  calculateWeight(root, 1)
  assignLayout(root, 0, FAN_START, FAN_END)
  createPositions(root)

  return {
    positions,
    edges,
  }
}