export type TreeNode = {
  id: string
  name: string
  section: string
  children?: TreeNode[]
  spacingScale?: number
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
  children: [{
    id: "t1",
    name: "감정평가기초",
    section: "trunk",
    children: [{
      id: "t2",
      name: "공시지가기준법",
      section: "trunk",
      children: [{
        id: "t3",
        name: "거래사례비교법",
        section: "trunk",
        children: [{
          id: "t4",
          name: "유형별 평가",
          section: "trunk",
          spacingScale: 0.8,
          children: [
            // 토지 갈래
            {
              id: "land0",
              name: "토지평가",
              section: "land",
              spacingScale: 0.9,
              children: [
                { id: "land1", name: "토지감정평가기초", section: "land" },
                { id: "land2", name: "공시지가기준법", section: "land" },
                { id: "land3", name: "토지잔여법", section: "income" },
                { id: "land4", name: "둘 이상의 용도지역 토지", section: "land" },
                { id: "land5", name: "도시계획시설저촉토지", section: "special" },
              ],
            },
            // 건물 갈래
            {
              id: "bldg0",
              name: "건물평가",
              section: "building",
              spacingScale: 0.9,
              children: [
                { id: "bldg1", name: "재조달원가", section: "cost" },
                { id: "bldg2", name: "조성원가법", section: "cost" },
                { id: "bldg3", name: "건물 거래사례비교법", section: "building" },
                { id: "bldg4", name: "회귀분석", section: "building" },
                { id: "bldg5", name: "구분건물 감정평가", section: "building" },
              ],
            },
            // 기타 갈래
            {
              id: "type0",
              name: "기타평가",
              section: "typeEval",
              spacingScale: 0.9,
              children: [
                { id: "type1", name: "수익환원법", section: "income" },
                { id: "type2", name: "직접환원법", section: "income" },
                { id: "type3", name: "임대사례비교법", section: "rent-rights" },
                { id: "type4", name: "적산법", section: "rent-rights" },
                { id: "type5", name: "기업가치평가", section: "typeEval" },
                { id: "type6", name: "기계기구평가", section: "typeEval" },
                { id: "type7", name: "영업권 감정평가", section: "typeEval" },
                { id: "type8", name: "비상장주식 감정평가", section: "typeEval" },
                { id: "type9", name: "총자산가치 산정", section: "typeEval" },
                { id: "type10", name: "오피스 매입 감정평가", section: "purpose" },
                { id: "type11", name: "타당성분석", section: "purpose" },
                { id: "type12", name: "매후환대차", section: "purpose" },
                { id: "type13", name: "담보 및 경매평가", section: "purpose" },
                { id: "type14", name: "최유효이용분석", section: "purpose" },
                { id: "type15", name: "도시정비평가", section: "purpose" },
                { id: "type16", name: "종전자산평가", section: "purpose" },
                { id: "type17", name: "관리처분계획", section: "purpose" },
              ],
            },
          ],
        }],
      }],
    }],
  }],
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

    let base = baseX.get(node.id)! - centerX

    // 깊이에 따라 x축을 사선으로 살짝 시프트 (나무처럼 위로 갈수록 좌우로 퍼지게)
    const tiltFactor = (depth - startDepth) * opts.xSpacing * 0.18
    const direction =
      node.id.startsWith("land") ? -1 :
      node.id.startsWith("bldg") ? 0.4 :
      node.id.startsWith("type") ? 1 :
      0

    let x = base + tiltFactor * direction

    if (swayActive && !isTrunk) {
      const amplitude = opts.xSpacing * scale * 0.35
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