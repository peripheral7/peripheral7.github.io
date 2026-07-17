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

type TreeMetrics = {
  leafWeight: number
  maxDepth: number
  branchCount: number
  scale: number
}

function hashSeed(id: string) {
  let hash = 2166136261

  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return ((hash >>> 0) % 1000) / 1000
}

function normalizeAngle(angle: number) {
  const fullTurn = Math.PI * 2
  return ((angle % fullTurn) + fullTurn) % fullTurn
}

export function layoutTree(
  root: TreeNode,
  opts: {
    xSpacing: number
    ySpacing: number
    rootY?: number
  },
) {
  const positions = new Map<
    string,
    {
      x: number
      y: number
      name: string
      section: string
    }
  >()

  const edges: [string, string][] = []
  const metricsById = new Map<string, TreeMetrics>()

  /*
   * 300deg만 사용합니다.
   * 아래쪽 60deg(60deg~120deg)는 비워 두어,
   * 줄기 시작점과 패널 영역에 과도한 노드 밀집을 피합니다.
   *
   * 화면 좌표는 y가 아래로 증가하므로 -90deg가 화면 위쪽입니다.
   */
  const OPENING_ANGLE = (60 * Math.PI) / 180
  const USABLE_ANGLE = Math.PI * 2 - OPENING_ANGLE
  const START_ANGLE = Math.PI / 2 + OPENING_ANGLE / 2
  const ROOT_AXIS_ANGLE = -Math.PI / 2

  /*
   * 노드 라벨과 글로우를 고려한 최소 각 간격입니다.
   * X_SPACING 155 기준, 이 값이면 가까운 형제도 읽기 어렵지 않습니다.
   */
  const MIN_CHILD_GAP = (6 * Math.PI) / 180

  /*
   * 직선 트렁크의 끝입니다.
   * root0 -> t1 -> t2 -> t3 -> t4는 아래에서 위로 유지되고,
   * t4의 자식부터 사방으로 퍼집니다.
   */
  const TRUNK_IDS = new Set(["root0", "t1", "t2", "t3", "t4"])

  function calculateMetrics(
    node: TreeNode,
    inheritedScale: number,
  ): TreeMetrics {
    const scale = node.spacingScale ?? inheritedScale
    const children = node.children ?? []

    if (children.length === 0) {
      const result: TreeMetrics = {
        leafWeight: scale,
        maxDepth: 0,
        branchCount: 0,
        scale,
      }

      metricsById.set(node.id, result)
      return result
    }

    const childMetrics = children.map((child) =>
      calculateMetrics(child, scale),
    )

    const result: TreeMetrics = {
      leafWeight: childMetrics.reduce(
        (total, child) => total + child.leafWeight,
        0,
      ),
      maxDepth:
        1 + Math.max(...childMetrics.map((child) => child.maxDepth)),
      branchCount: children.length,
      scale,
    }

    metricsById.set(node.id, result)
    return result
  }

  /*
   * 각도 배분 가중치:
   * - leafWeight: 실제 말단 수가 많을수록 더 넓은 면적
   * - maxDepth: 긴 가지는 바깥 원에서 충돌할 가능성이 높으므로 추가 여유
   * - branchCount: 당장 여러 갈래로 나뉘는 부모도 추가 여유
   */
  function getAngularWeight(node: TreeNode) {
    const metrics = metricsById.get(node.id)!

    return (
      metrics.leafWeight * 1 +
      metrics.maxDepth * 0.8 +
      metrics.branchCount * 0.45
    )
  }

  function getRadius(depth: number, scale: number) {
    /*
     * 첫 단계는 줄기와 분기점의 인지성을 위해 약간 짧게,
     * 깊어질수록 소폭 넓혀 라벨·선 겹침을 줄입니다.
     */
    const depthExpansion = 1 + Math.min(depth, 8) * 0.035

    return depth * opts.xSpacing * depthExpansion * scale
  }

  function getChildSectors(
    children: TreeNode[],
    startAngle: number,
    endAngle: number,
  ) {
    const availableAngle = endAngle - startAngle
    const totalGap = Math.max(0, children.length - 1) * MIN_CHILD_GAP
    const distributableAngle = Math.max(
      availableAngle - totalGap,
      availableAngle * 0.55,
    )

    const weights = children.map(getAngularWeight)
    const totalWeight = weights.reduce((total, weight) => total + weight, 0)

    let cursor = startAngle

    return children.map((child, index) => {
      const share = distributableAngle * (weights[index] / totalWeight)
      const sector = {
        child,
        startAngle: cursor,
        endAngle: cursor + share,
      }

      cursor += share + MIN_CHILD_GAP
      return sector
    })
  }

  function placeNode(
    node: TreeNode,
    depth: number,
    angle: number,
    sectorStart: number,
    sectorEnd: number,
    inheritedScale: number,
  ) {
    const metrics = metricsById.get(node.id)!
    const children = node.children ?? []
    const isTrunk = TRUNK_IDS.has(node.id)

    const radius = getRadius(depth, metrics.scale)
    const positionAngle = isTrunk ? ROOT_AXIS_ANGLE : angle

    positions.set(node.id, {
      x: Math.cos(positionAngle) * radius,
      y: Math.sin(positionAngle) * radius,
      name: node.name,
      section: node.section,
    })

    if (children.length === 0) return

    /*
     * 단일 자식은 부모 방향을 유지해 불필요한 꺾임을 만들지 않습니다.
     * t4부터 최초로 나뉘는 노드만 전체 300도 부채꼴을 배정받습니다.
     */
    if (children.length === 1) {
      const child = children[0]

      edges.push([node.id, child.id])

      placeNode(
        child,
        depth + 1,
        positionAngle,
        sectorStart,
        sectorEnd,
        metrics.scale,
      )

      return
    }

    const childStart = isTrunk ? START_ANGLE : sectorStart
    const childEnd = isTrunk
      ? START_ANGLE + USABLE_ANGLE
      : sectorEnd

    const sectors = getChildSectors(children, childStart, childEnd)

    for (const sector of sectors) {
      const childAngle = (sector.startAngle + sector.endAngle) / 2

      edges.push([node.id, sector.child.id])

      placeNode(
        sector.child,
        depth + 1,
        childAngle,
        sector.startAngle,
        sector.endAngle,
        metrics.scale,
      )
    }
  }

  calculateMetrics(root, 1)

  placeNode(
    root,
    0,
    ROOT_AXIS_ANGLE,
    START_ANGLE,
    START_ANGLE + USABLE_ANGLE,
    1,
  )

  return {
    positions,
    edges,
  }
}