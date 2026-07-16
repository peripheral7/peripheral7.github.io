export type TreeNode = {
  id: string
  name: string
  section: string
  children?: TreeNode[]
  spacingScale?: number
}

export const sections: Record<string, { title: string; tier: number }> = {
  root: { title: "감정평가실무", tier: 0 },
  trunk: { title: "감정평가기초·공시지가기준법·거래사례비교법", tier: 0 },
  cost: { title: "원가방식(건물평가)", tier: 1 },
  building: { title: "건물평가", tier: 1 },
  income: { title: "수익방식", tier: 1 },
  "rent-rights": { title: "임대료 및 권리평가", tier: 1 },
  land: { title: "토지평가", tier: 1 },
  special: { title: "특수토지평가", tier: 1 },
  typeEval: { title: "기업가치·기타평가", tier: 2 },
  ip: { title: "지식재산권평가", tier: 2 },
  purpose: { title: "목적별평가", tier: 2 },
}

export const skillTree: TreeNode = {
  id: "root0",
  name: "감정평가실무",
  section: "root",
  children: [
    {
      id: "c1", name: "감정평가기초", section: "trunk",
      children: [
        {
          id: "c2", name: "공시지가기준법", section: "trunk",
          children: [
            {
              id: "c3", name: "거래사례비교법", section: "trunk",
              spacingScale: 0.6,
              children: [
                { id: "c4a", name: "재조달원가", section: "cost",
                  children: [{ id: "c4b", name: "조성원가법", section: "cost" }] },
                { id: "c5a", name: "건물 거래사례비교법", section: "building",
                  children: [{ id: "c5b", name: "회귀분석", section: "building" }] },
                { id: "c6a", name: "수익환원법", section: "income",
                  children: [{ id: "c6b", name: "직접환원법", section: "income" }] },
                { id: "c7a", name: "토지잔여법", section: "income" },
                { id: "c7b", name: "구분건물 감정평가", section: "building" },
                { id: "c8a", name: "임대사례비교법", section: "rent-rights" },
                { id: "c8b", name: "적산법", section: "rent-rights" },
                { id: "c9a", name: "지상권", section: "rent-rights" },
                { id: "c9b", name: "도시계획시설저촉토지", section: "special",
                  children: [
                    { id: "c10a", name: "골프장 평가", section: "special" },
                    { id: "c10b", name: "개발법", section: "special" },
                  ] },
                { id: "c9c", name: "둘 이상의 용도지역 토지", section: "land" },
                { id: "c9d", name: "임대차평가", section: "rent-rights" },
                { id: "c11a", name: "기업가치평가", section: "typeEval" },
                { id: "c11b", name: "기계기구평가", section: "typeEval" },
                { id: "c12", name: "지식재산권", section: "ip",
                  children: [
                    { id: "c12a", name: "영업권 감정평가", section: "ip" },
                    { id: "c12b", name: "비상장주식 감정평가", section: "ip" },
                    { id: "c12c", name: "총자산가치 산정", section: "ip" },
                  ] },
                { id: "c13", name: "구분지상권 설정토지", section: "rent-rights" },
                { id: "c14", name: "오피스 매입에 따른 감정평가", section: "purpose",
                  children: [
                    { id: "c14a", name: "타당성분석", section: "purpose" },
                    { id: "c14b", name: "매후환대차", section: "purpose" },
                  ] },
                { id: "c15a", name: "담보 및 경매평가", section: "purpose" },
                { id: "c15b", name: "최유효이용분석", section: "purpose" },
                { id: "c16", name: "도시정비평가", section: "purpose",
                  children: [
                    { id: "c16a", name: "종전자산평가", section: "purpose" },
                    { id: "c16b", name: "관리처분계획", section: "purpose" },
                  ] },
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

  const xs = [...baseX.values()]
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2

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

    const nextActive = swayActive || node.id === "t4"

    if (node.children.length > 1) {
      for (const child of node.children) {
        applySway(child, nextActive, hashSeed(child.id), depth + 1)
      }
    } else {
      for (const child of node.children) {
        applySway(child, nextActive, seed, startDepth)
      }
    }
  }

  applySway(root, false, 0, 0)

  return { positions, edges }
}