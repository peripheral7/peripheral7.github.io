export type BranchDirection = "left" | "center" | "right"

export type TreeNode = {
  id: string
  name: string
  section: string
  children?: TreeNode[]
  spacingScale?: number
  branchDirection?: BranchDirection
}

export const sections: Record<string, { title: string; tier: number }> = {
  root: { title: "감정평가실무", tier: 0 },
  trunk: { title: "감정평가기초·공시지가기준법·거래사례비교법·유형별 평가", tier: 0 },
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
              name: "공시지가기준법",
              section: "trunk",
              children: [
                {
                  id: "t4",
                  name: "유형별 평가",
                  section: "trunk",
                  children: [
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
                              name: "거래사례비교법",
                              section: "comparison",
                              children: [
                                {
                                  id: "land3",
                                  name: "토지잔여법",
                                  section: "income",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          id: "land4",
                          name: "특수토지평가",
                          section: "special",
                          children: [
                            {
                              id: "land5",
                              name: "둘 이상의 용도지역 토지",
                              section: "special",
                            },
                            {
                              id: "land6",
                              name: "도시계획시설저촉토지",
                              section: "special",
                              children: [
                                { id: "land7", name: "개발법", section: "special" },
                                { id: "land8", name: "골프장 평가", section: "special" },
                              ],
                            },
                          ],
                        },
                        {
                          id: "land9",
                          name: "토지 권리평가",
                          section: "rent-rights",
                          children: [
                            { id: "land10", name: "지상권", section: "rent-rights" },
                            { id: "land11", name: "구분지상권 설정토지", section: "rent-rights" },
                          ],
                        },
                      ],
                    },
                    {
                      id: "bldg0",
                      name: "건물평가",
                      section: "building",
                      branchDirection: "left",
                      children: [
                        {
                          id: "bldg1",
                          name: "건물 단독평가",
                          section: "building",
                          children: [
                            {
                              id: "bldg2",
                              name: "원가방식",
                              section: "cost",
                              children: [
                                { id: "bldg3", name: "재조달원가", section: "cost" },
                                { id: "bldg4", name: "조성원가법", section: "cost" },
                              ],
                            },
                            {
                              id: "bldg5",
                              name: "건물 비교평가",
                              section: "comparison",
                              children: [
                                { id: "bldg6", name: "건물 거래사례비교법", section: "comparison" },
                                { id: "bldg7", name: "회귀분석", section: "comparison" },
                              ],
                            },
                          ],
                        },
                        {
                          id: "bldg8",
                          name: "토지·건물 결합평가",
                          section: "building",
                          children: [
                            { id: "bldg9", name: "토지건물 일괄평가", section: "building" },
                          ],
                        },
                        {
                          id: "bldg10",
                          name: "구분소유 부동산",
                          section: "building",
                          children: [
                            { id: "bldg11", name: "구분건물 감정평가", section: "building" },
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
                                { id: "type3", name: "직접환원법", section: "income" },
                                { id: "type4", name: "할인현금흐름법", section: "income" },
                              ],
                            },
                            {
                              id: "type5",
                              name: "오피스 투자평가",
                              section: "purpose",
                              children: [
                                { id: "type6", name: "오피스 매입 감정평가", section: "purpose" },
                                { id: "type7", name: "타당성분석", section: "purpose" },
                                { id: "type8", name: "매후환대차", section: "purpose" },
                              ],
                            },
                          ],
                        },
                        {
                          id: "type9",
                          name: "임대료평가",
                          section: "rent-rights",
                          children: [
                            {
                              id: "type10",
                              name: "임대사례비교법",
                              section: "rent-rights",
                            },
                            {
                              id: "type11",
                              name: "적산법",
                              section: "rent-rights",
                            },
                            {
                              id: "type12",
                              name: "수익분석법",
                              section: "rent-rights",
                            },
                            {
                              id: "type13",
                              name: "임대차평가",
                              section: "rent-rights",
                            },
                          ],
                        },
                        {
                          id: "type14",
                          name: "기업·무형자산평가",
                          section: "typeEval",
                          children: [
                            { id: "type15", name: "기업가치평가", section: "typeEval" },
                            { id: "type16", name: "기계기구평가", section: "typeEval" },
                            {
                              id: "type17",
                              name: "지식재산권 평가",
                              section: "typeEval",
                              children: [
                                { id: "type18", name: "영업권 감정평가", section: "typeEval" },
                                { id: "type19", name: "비상장주식 감정평가", section: "typeEval" },
                                { id: "type20", name: "총자산가치 산정", section: "typeEval" },
                              ],
                            },
                          ],
                        },
                        {
                          id: "type21",
                          name: "목적별·도시정비평가",
                          section: "purpose",
                          children: [
                            {
                              id: "type22",
                              name: "담보 및 경매평가",
                              section: "purpose",
                              children: [{ id: "type23", name: "최유효이용분석", section: "purpose" }],
                            },
                            {
                              id: "type24",
                              name: "도시정비평가",
                              section: "purpose",
                              children: [
                                { id: "type25", name: "종전자산평가", section: "purpose" },
                                { id: "type26", name: "관리처분계획", section: "purpose" },
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

// ── 런타임 노드 추가/삭제 유틸 (별자리 수정 기능용) ──────────────
export function cloneTree(node: TreeNode): TreeNode {
  return { ...node, children: node.children?.map(cloneTree) }
}

export function addNodeToTree(root: TreeNode, parentId: string, newNode: TreeNode): TreeNode {
  const cloned = cloneTree(root)
  function insert(n: TreeNode): boolean {
    if (n.id === parentId) {
      n.children = [...(n.children ?? []), newNode]
      return true
    }
    return (n.children ?? []).some(insert)
  }
  insert(cloned)
  return cloned
}

export function removeNodeFromTree(root: TreeNode, targetId: string): TreeNode {
  const cloned = cloneTree(root)
  function strip(n: TreeNode) {
    if (!n.children) return
    n.children = n.children.filter((c) => c.id !== targetId)
    n.children.forEach(strip)
  }
  strip(cloned)
  return cloned
}

// layoutTree 함수는 기존과 동일하게 유지 (수정 불필요)
function hashSeed(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000
  return (h / 1000) * Math.PI * 2
}

export function layoutTree(
  root: TreeNode,
  opts: { xSpacing: number; ySpacing: number; rootY?: number },
) {
  const rootY = opts.rootY ?? 920
  const positions = new Map<string, { x: number; y: number; name: string; section: string }>()
  const edges: [string, string][] = []
  const TRUNK_IDS = new Set(["root0", "t1", "t2", "t3", "t4"])

  type Direction = "left" | "center" | "right"

  function childDirection(
    parent: TreeNode,
    child: TreeNode,
    inherited: Direction,
    childIndex: number,
    childCount: number,
  ): Direction {
    if (child.branchDirection) return child.branchDirection
    if (parent.id === "t4") {
      return (["center", "left", "right"] as Direction[])[childIndex] ?? "center"
    }
    if (childCount === 1) return inherited

    // 소분류는 주 가지에서 미세하게 갈라져, 수평으로 길게 뻗지 않게 함
    if (inherited === "left") return childIndex % 2 === 0 ? "left" : "center"
    if (inherited === "right") return childIndex % 2 === 0 ? "right" : "center"
    return childIndex % 2 === 0 ? "left" : "right"
  }

  function walk(
    node: TreeNode,
    depth: number,
    x: number,
    direction: Direction,
    seed: number,
  ) {
    const y = rootY - depth * opts.ySpacing
    positions.set(node.id, { x, y, name: node.name, section: node.section })

    const children = node.children ?? []
    children.forEach((child, index) => {
      edges.push([node.id, child.id])

      const nextDirection = childDirection(node, child, direction, index, children.length)
      const isTrunk = TRUNK_IDS.has(node.id)
      const stepY = opts.ySpacing
      const mainBranchX =
        nextDirection === "left" ? -stepY * 0.58 :
        nextDirection === "right" ? stepY * 0.58 :
        0

      // 같은 부모의 여러 소분류를 작은 부채꼴 형태로 분산
      const siblingOffset = (index - (children.length - 1) / 2) * opts.xSpacing * 0.34
      const sway = isTrunk ? 0 : Math.sin(depth * 0.72 + hashSeed(child.id) + seed) * 18

      walk(
        child,
        depth + 1,
        x + mainBranchX + siblingOffset + sway,
        nextDirection,
        hashSeed(child.id),
      )
    })
  }

  walk(root, 0, 0, "center", 0)
  return { positions, edges }
}