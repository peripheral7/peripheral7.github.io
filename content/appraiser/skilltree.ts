export type TreeNode = {
  id: string
  name: string
  section: string
  children?: TreeNode[]
  spacingScale?: number
}

export const sections: Record<string, { title: string; tier: number }> = {
  root: { title: "감정평가 실무", tier: 0 },
  fundamentals: { title: "기초 및 기본 원리", tier: 1 },
  approaches: { title: "감정평가 3방식", tier: 1 },
  purpose: { title: "목적별 감정평가", tier: 1 },
  property: { title: "물건별 감정평가", tier: 1 },
  compensation: { title: "보상 감정평가", tier: 1 },
}

export const skillTree: TreeNode = {
  id: "root0",
  name: "감정평가 실무",
  section: "root",
  // 시계방향 배치: 기초 → 3방식 → 물건별 → 목적별 → 보상
  children: [
    {
      id: "f0",
      name: "기초 및 기본 원리",
      section: "fundamentals",
      children: [
        { id: "f1", name: "감정평가기초", section: "fundamentals" },
        { id: "f2", name: "화폐의 시간가치", section: "fundamentals" },
      ],
    },
    {
      id: "a0",
      name: "감정평가 3방식",
      section: "approaches",
      children: [
        {
          id: "a1",
          name: "비교방식",
          section: "approaches",
          children: [
            { id: "a1a", name: "공시지가기준법", section: "approaches" },
            { id: "a1b", name: "거래사례비교법", section: "approaches" },
          ],
        },
        {
          id: "a2",
          name: "원가방식",
          section: "approaches",
          children: [
            { id: "a2a", name: "건물의 감정평가", section: "approaches" },
          ],
        },
        {
          id: "a3",
          name: "수익방식 및 임대료 평가",
          section: "approaches",
          children: [
            { id: "a3a", name: "수익환원법", section: "approaches" },
            { id: "a3b", name: "임대사례비교법", section: "approaches" },
            { id: "a3c", name: "타당성분석(환원이율·IRR)", section: "approaches" },
            { id: "a3d", name: "적산법(임대료, 원가방식)", section: "approaches" },
            { id: "a3e", name: "임대차평가", section: "approaches" },
          ],
        },
      ],
    },
    {
      id: "t0",
      name: "물건별 감정평가",
      section: "property",
      children: [
        {
          id: "t1",
          name: "복합부동산 및 집합건물",
          section: "property",
          children: [
            { id: "t1a", name: "토지건물 일괄평가", section: "property" },
            { id: "t1b", name: "구분건물감정평가", section: "property" },
          ],
        },
        {
          id: "t2",
          name: "특수토지 및 권리",
          section: "property",
          spacingScale: 1.3,
          children: [
            { id: "t2a", name: "지상권", section: "property" },
            { id: "t2b", name: "도시계획시설 저촉토지 평가", section: "property" },
            { id: "t2c", name: "구분지상권 설정토지", section: "property" },
            { id: "t2d", name: "둘 이상의 용도지역에 걸치는 토지평가", section: "property" },
          ],
        },
        {
          id: "t3",
          name: "기업가치 및 동산·무형자산",
          section: "property",
          spacingScale: 1.3,
          children: [
            { id: "t3a", name: "기업가치평가", section: "property" },
            { id: "t3b", name: "지식재산권", section: "property" },
            { id: "t3c", name: "기계기구평가", section: "property" },
            { id: "t3d", name: "영업권", section: "property" },
          ],
        },
      ],
    },
    {
      id: "p0",
      name: "목적별 감정평가",
      section: "purpose",
      children: [
        {
          id: "p1",
          name: "일반 및 특수 목적",
          section: "purpose",
          children: [
            {
              id: "p1a",
              name: "오피스 매입에 따른 감정평가",
              section: "purpose",
              children: [
                { id: "p1a1", name: "매후환대차평가", section: "purpose" },
                { id: "p1a2", name: "최유효이용 분석", section: "purpose" },
              ],
            },
            { id: "p1bc", name: "담보·경매평가", section: "purpose" },
            // 권리금평가 → 오염부동산평가(스티그마) → 개발부담금 순차 체인(짧은 외갈래 연결)
            {
              id: "p1d",
              name: "권리금감정평가",
              section: "purpose",
              children: [
                {
                  id: "p1e",
                  name: "오염부동산평가(스티그마)",
                  section: "purpose",
                  children: [
                    { id: "p1f", name: "개발부담금 산정평가", section: "purpose" },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "p2",
          name: "도시정비평가",
          section: "purpose",
          children: [
            { id: "p2a", name: "종전자산평가", section: "purpose" },
            { id: "p2b", name: "관리처분계획", section: "purpose" },
          ],
        },
      ],
    },
    {
      id: "c0",
      name: "보상 감정평가",
      section: "compensation",
      children: [
        {
          id: "c1",
          name: "토지 보상",
          section: "compensation",
          children: [
            { id: "c1a", name: "토지보상평가", section: "compensation" },
            { id: "c1b", name: "미지급용지 평가", section: "compensation" },
            { id: "c1c", name: "잔여지 보상평가", section: "compensation" },
          ],
        },
        {
          id: "c2",
          name: "지장물 및 권리 보상",
          section: "compensation",
          children: [
            { id: "c2a", name: "지장물보상감정평가", section: "compensation" },
            { id: "c2b", name: "영업손실보상", section: "compensation" },
          ],
        },
      ],
    },
  ],
}

type Metrics = {
  leafCount: number
  maxDepth: number
  childCount: number
  scale: number
  spanDemand: number
}

type PlacementResult = {
  angle: number
  minAngle: number
  maxAngle: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function computeMetrics(
  node: TreeNode,
  map: Map<string, Metrics>,
  inheritedScale: number,
): Metrics {
  const scale = node.spacingScale ?? inheritedScale
  const children = node.children ?? []

  if (children.length === 0) {
    const metrics: Metrics = {
      leafCount: 1,
      maxDepth: 0,
      childCount: 0,
      scale,
      spanDemand: 1 * scale,
    }
    map.set(node.id, metrics)
    return metrics
  }

  const childMetrics = children.map((child) =>
    computeMetrics(child, map, scale),
  )

  const leafCount = childMetrics.reduce((sum, child) => sum + child.leafCount, 0)
  const maxDepth = 1 + Math.max(...childMetrics.map((child) => child.maxDepth))
  const childCount = children.length

  const rawDemand =
    leafCount * 1 +
    childCount * 0.55 +
    maxDepth * 0.95

  const metrics: Metrics = {
    leafCount,
    maxDepth,
    childCount,
    scale,
    spanDemand: Math.max(1.2, rawDemand) * scale,
  }

  map.set(node.id, metrics)
  return metrics
}

function gapFor(depth: number, childCount: number) {
  const baseDeg =
    depth <= 1 ? 8 :
    depth === 2 ? 7 :
    depth === 3 ? 6 :
    5

  const compactAdjust = childCount >= 6 ? -1 : 0
  return ((baseDeg + compactAdjust) * Math.PI) / 180
}

function occupancyFor(childCount: number, maxDepth: number) {
  if (childCount <= 1) return 0.18
  return clamp(
    0.66 + Math.min(childCount, 6) * 0.05 + Math.min(maxDepth, 4) * 0.04,
    0.72,
    0.96,
  )
}

// ── 부모-자식 연결선 길이 배율 (자식 개수별 세분화) ─────────────
// 0(리프) < 2 < 1 < 3(기본) < 4 < 5 < 6+ 순으로 길어지도록 구성.
// - 자식 2개는 리프(0개)보다도 짧게
// - 자식 4개는 기존보다 축소
// - 자식 5개는 4개보다 길게
const EDGE_MULTIPLIER_BY_CHILD_COUNT: Record<number, number> = {
  0: 0.8,  // 리프 노드
  1: 0.7,  // 외갈래(체인) — 짧게
  2: 0.6,  // 자식 2개: 리프보다 더 짧게
  3: 1.0,  // 기본
  4: 1.2,  // 기존(1.4)보다 축소
  5: 1.5,  // 4개보다 길게
}
const MANY_CHILDREN_MULTIPLIER = 1.6 // 6개 이상

function edgeLengthMultiplier(childCount: number): number {
  if (childCount in EDGE_MULTIPLIER_BY_CHILD_COUNT) {
    return EDGE_MULTIPLIER_BY_CHILD_COUNT[childCount]
  }
  return MANY_CHILDREN_MULTIPLIER
}

function edgeLengthFor(
  node: TreeNode,
  metrics: Metrics,
  step: number,
  scale: number,
) {
  const childCount = node.children?.length ?? 0
  const multiplier = edgeLengthMultiplier(childCount)

  const complexityBoost =
    Math.min(metrics.maxDepth, 4) * 0.035 +
    Math.min(metrics.childCount, 6) * 0.015

  return step * (1 + complexityBoost) * multiplier * scale
}

export function layoutTree(
  root: TreeNode,
  opts: { xSpacing: number; ySpacing: number; rootY?: number },
) {
  const positions = new Map<
    string,
    { x: number; y: number; name: string; section: string }
  >()
  const edges: [string, string][] = []
  const metricsById = new Map<string, Metrics>()
  const radialStep = (opts.xSpacing + opts.ySpacing) / 2
  const originY = opts.rootY ?? 0

  computeMetrics(root, metricsById, 1)

  function setPosition(
    node: TreeNode,
    angle: number,
    radius: number,
  ) {
    positions.set(node.id, {
      x: Math.cos(angle) * radius,
      y: originY + Math.sin(angle) * radius,
      name: node.name,
      section: node.section,
    })
  }

  function placeNode(
    node: TreeNode,
    depth: number,
    sectorStart: number,
    sectorEnd: number,
    inheritedScale: number,
    parentRadius: number,
  ): PlacementResult {
    const scale = node.spacingScale ?? inheritedScale
    const children = node.children ?? []
    const metrics = metricsById.get(node.id)!
    const radius = parentRadius + edgeLengthFor(node, metrics, radialStep, scale)

    if (children.length === 0) {
      const angle = (sectorStart + sectorEnd) / 2
      setPosition(node, angle, radius)
      return { angle, minAngle: angle, maxAngle: angle }
    }

    if (children.length === 1) {
      const onlyChild = children[0]
      edges.push([node.id, onlyChild.id])
      const childPlacement = placeNode(
        onlyChild,
        depth + 1,
        sectorStart,
        sectorEnd,
        scale,
        radius,
      )
      setPosition(node, childPlacement.angle, radius)
      return {
        angle: childPlacement.angle,
        minAngle: childPlacement.minAngle,
        maxAngle: childPlacement.maxAngle,
      }
    }

    const gap = gapFor(depth, children.length)
    const totalGap = gap * (children.length - 1)
    const fullWidth = sectorEnd - sectorStart
    const occupancy = occupancyFor(children.length, metrics.maxDepth)
    const usableWidth = Math.max(fullWidth * occupancy, totalGap + fullWidth * 0.34)
    const innerStart = sectorStart + (fullWidth - usableWidth) / 2
    const innerEnd = sectorEnd - (fullWidth - usableWidth) / 2
    const distributableWidth = Math.max(innerEnd - innerStart - totalGap, fullWidth * 0.18)

    const weights = children.map(
      (child) => metricsById.get(child.id)?.spanDemand ?? 1,
    )
    const weightSum = weights.reduce((sum, value) => sum + value, 0)

    let cursor = innerStart
    const childPlacements: PlacementResult[] = []

    children.forEach((child, index) => {
      const width =
        index === children.length - 1
          ? innerEnd - cursor
          : distributableWidth * (weights[index] / weightSum)

      const childStart = cursor
      const childEnd = index === children.length - 1 ? innerEnd : childStart + width

      edges.push([node.id, child.id])

      const placed = placeNode(
        child,
        depth + 1,
        childStart,
        childEnd,
        scale,
        radius,
      )

      childPlacements.push(placed)
      cursor = childEnd + gap
    })

    const minAngle = Math.min(...childPlacements.map((child) => child.minAngle))
    const maxAngle = Math.max(...childPlacements.map((child) => child.maxAngle))
    const angle = (minAngle + maxAngle) / 2

    setPosition(node, angle, radius)

    return { angle, minAngle, maxAngle }
  }

  positions.set(root.id, {
    x: 0,
    y: originY,
    name: root.name,
    section: root.section,
  })

  const rootChildren = root.children ?? []
  const fullTurn = Math.PI * 2
  const rootSlice = rootChildren.length > 0 ? fullTurn / rootChildren.length : fullTurn
  const firstCenterAngle = -Math.PI / 2

  rootChildren.forEach((child, index) => {
    const sectorStart =
      firstCenterAngle - rootSlice / 2 + index * rootSlice
    const sectorEnd = sectorStart + rootSlice

    edges.push([root.id, child.id])
    placeNode(child, 1, sectorStart, sectorEnd, 1, 0)
  })

  return { positions, edges }
}