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
  opts: { xSpacing: number; ySpacing: number; rootY?: number },
) {
  const rootY = opts.rootY ?? 1180
  const positions = new Map<
    string,
    { x: number; y: number; name: string; section: string }
  >()
  const edges: [string, string][] = []

  const trunkIds = new Set(["root0", "t1", "t2", "t3", "t4"])

  const directionVector: Record<BranchDirection, number> = {
    left: -1,
    center: 0,
    right: 1,
  }

  function getDirection(
    parent: TreeNode,
    child: TreeNode,
    inherited: BranchDirection,
    index: number,
    count: number,
  ): BranchDirection {
    if (child.branchDirection) return child.branchDirection
    if (count === 1) return inherited

    if (inherited === "left") {
      return index % 2 === 0 ? "left" : "center"
    }

    if (inherited === "right") {
      return index % 2 === 0 ? "right" : "center"
    }

    return index % 2 === 0 ? "left" : "right"
  }

  function walk(
    node: TreeNode,
    depth: number,
    x: number,
    direction: BranchDirection,
    seed: number,
  ) {
    const y = rootY - depth * opts.ySpacing

    positions.set(node.id, {
      x,
      y,
      name: node.name,
      section: node.section,
    })

    const children = node.children ?? []
    const isTrunk = trunkIds.has(node.id)

    children.forEach((child, index) => {
      edges.push([node.id, child.id])

      const nextDirection = getDirection(
        node,
        child,
        direction,
        index,
        children.length,
      )

      const directionX = directionVector[nextDirection]
      const siblingCenter = index - (children.length - 1) / 2

      // 대분류는 명확한 60도 사선, 소분류는 넓은 부채꼴로 퍼짐
      const branchStep =
        nextDirection === "center"
          ? 0
          : directionX * opts.ySpacing * 0.58

      const siblingSpread =
        siblingCenter * opts.xSpacing * (isTrunk ? 0.08 : 0.62)

      const organicOffset = isTrunk
        ? 0
        : Math.sin(depth * 0.58 + hashSeed(child.id) + seed) * 20

      walk(
        child,
        depth + 1,
        x + branchStep + siblingSpread + organicOffset,
        nextDirection,
        hashSeed(child.id),
      )
    })
  }

  walk(root, 0, 0, "center", 0)

  return { positions, edges }
}