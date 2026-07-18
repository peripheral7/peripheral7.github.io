export type TreeNode = {
  id: string
  name: string
  section: string
  children?: TreeNode[]
  /** 이 노드 아래 하위 잎(leaf)들의 간격 배율. 1이면 기본 간격, 0.5면 절반 */
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
  children: [
    {
      id: "f0",
      name: "기초 및 기본 원리",
      section: "fundamentals",
      children: [
        {
          id: "f1",
          name: "기초 및 기본 규정",
          section: "fundamentals",
          children: [
            { id: "f1a", name: "감평법 개요 및 핵심 조항", section: "fundamentals" },
            { id: "f1b", name: "감정평가에 관한 규칙 구조", section: "fundamentals" },
          ],
        },
        {
          id: "f2",
          name: "가치의 다원론과 경제적 원칙",
          section: "fundamentals",
          children: [
            { id: "f2a", name: "시장가치", section: "fundamentals" },
            { id: "f2b", name: "시장가치 외의 가치", section: "fundamentals" },
            { id: "f2c", name: "최유효이용의 원칙", section: "fundamentals" },
            { id: "f2d", name: "13가지 경제적 원칙", section: "fundamentals" },
          ],
        },
        {
          id: "f3",
          name: "기초 금융 수학",
          section: "fundamentals",
          children: [
            { id: "f3a", name: "화폐의 시간가치", section: "fundamentals" },
            { id: "f3b", name: "6단 계수 활용", section: "fundamentals" },
            { id: "f3c", name: "자본환원율과 할인율의 관계", section: "fundamentals" },
          ],
        },
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
            { id: "a1c", name: "임대사례비교법", section: "approaches" },
          ],
        },
        {
          id: "a2",
          name: "원가방식",
          section: "approaches",
          children: [
            { id: "a2a", name: "원가법", section: "approaches" },
            { id: "a2b", name: "재조달원가", section: "approaches" },
            { id: "a2c", name: "감가수정", section: "approaches" },
            { id: "a2d", name: "정액법", section: "approaches" },
            { id: "a2e", name: "정률법", section: "approaches" },
            { id: "a2f", name: "상환기금법", section: "approaches" },
            { id: "a2g", name: "관찰감가법", section: "approaches" },
            { id: "a2h", name: "적산법", section: "approaches" },
            { id: "a2i", name: "기대이율", section: "approaches" },
            { id: "a2j", name: "필요제경비", section: "approaches" },
          ],
        },
        {
          id: "a3",
          name: "수익방식",
          section: "approaches",
          children: [
            { id: "a3a", name: "수익환원법", section: "approaches" },
            { id: "a3b", name: "직접환원법", section: "approaches" },
            { id: "a3c", name: "DCF", section: "approaches" },
            { id: "a3d", name: "자본환원율 산정", section: "approaches" },
            { id: "a3e", name: "시장추출법", section: "approaches" },
            { id: "a3f", name: "조성법", section: "approaches" },
            { id: "a3g", name: "투자결합법", section: "approaches" },
            { id: "a3h", name: "에르우드법", section: "approaches" },
            { id: "a3i", name: "수익분석법", section: "approaches" },
            { id: "a3j", name: "기업용 임대료", section: "approaches" },
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
          name: "담보 및 경매",
          section: "purpose",
          children: [
            { id: "p1a", name: "은행 담보평가", section: "purpose" },
            { id: "p1b", name: "회수전망액", section: "purpose" },
            { id: "p1c", name: "법원 경매평가", section: "purpose" },
            { id: "p1d", name: "권리분석", section: "purpose" },
          ],
        },
        {
          id: "p2",
          name: "국공유재산",
          section: "purpose",
          children: [
            { id: "p2a", name: "국유재산법 기준 처분·매입", section: "purpose" },
            { id: "p2b", name: "공유재산법 기준 처분·매입", section: "purpose" },
          ],
        },
        {
          id: "p3",
          name: "도시정비사업",
          section: "purpose",
          children: [
            { id: "p3a", name: "종전자산 평가", section: "purpose" },
            { id: "p3b", name: "종후자산 평가", section: "purpose" },
            { id: "p3c", name: "국공유지 무상양도", section: "purpose" },
            { id: "p3d", name: "국공유지 무상양수", section: "purpose" },
          ],
        },
        {
          id: "p4",
          name: "재무보고",
          section: "purpose",
          children: [
            { id: "p4a", name: "K-IFRS 유형자산 공정가치 평가", section: "purpose" },
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
          name: "복합부동산",
          section: "property",
          children: [
            { id: "t1a", name: "구분소유권 및 집합건물 일괄평가", section: "property" },
            { id: "t1b", name: "적산가치와 비준가치의 조정", section: "property" },
          ],
        },
        {
          id: "t2",
          name: "특수토지 및 권리",
          section: "property",
          children: [
            { id: "t2a", name: "맹지", section: "property" },
            { id: "t2b", name: "선하지", section: "property" },
            { id: "t2c", name: "대규모 조성지", section: "property" },
            { id: "t2d", name: "지상권", section: "property" },
            { id: "t2e", name: "임차권", section: "property" },
            { id: "t2f", name: "소유권 외의 권리", section: "property" },
          ],
        },
        {
          id: "t3",
          name: "무형자산 및 기타",
          section: "property",
          children: [
            { id: "t3a", name: "영업권", section: "property" },
            { id: "t3b", name: "특허권", section: "property" },
            { id: "t3c", name: "지식재산권", section: "property" },
            { id: "t3d", name: "공장재단", section: "property" },
            { id: "t3e", name: "광업재단", section: "property" },
            { id: "t3f", name: "자동차", section: "property" },
            { id: "t3g", name: "선박", section: "property" },
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
          name: "손실보상 기본 원칙",
          section: "compensation",
          children: [
            { id: "c1a", name: "공시지가 선택 기준", section: "compensation" },
            { id: "c1b", name: "사업인정 전후", section: "compensation" },
            { id: "c1c", name: "개발이익 배제", section: "compensation" },
            { id: "c1d", name: "현황평가 원칙", section: "compensation" },
          ],
        },
        {
          id: "c2",
          name: "토지 보상",
          section: "compensation",
          children: [
            { id: "c2a", name: "공법상 제한을 받는 토지 평가", section: "compensation" },
            { id: "c2b", name: "무허가 건축물 부지", section: "compensation" },
            { id: "c2c", name: "불법형질변경 토지", section: "compensation" },
            { id: "c2d", name: "잔여지 가치하락", section: "compensation" },
            { id: "c2e", name: "수용 청구", section: "compensation" },
          ],
        },
        {
          id: "c3",
          name: "지상물 및 지장물 보상",
          section: "compensation",
          children: [
            { id: "c3a", name: "이전비 원칙", section: "compensation" },
            { id: "c3b", name: "취득가격 기준", section: "compensation" },
            { id: "c3c", name: "건축물 평가", section: "compensation" },
            { id: "c3d", name: "농작물 평가", section: "compensation" },
            { id: "c3e", name: "수목 평가", section: "compensation" },
            { id: "c3f", name: "분묘 평가", section: "compensation" },
          ],
        },
        {
          id: "c4",
          name: "권리 및 영업손실 보상",
          section: "compensation",
          children: [
            { id: "c4a", name: "영업보상", section: "compensation" },
            { id: "c4b", name: "폐업", section: "compensation" },
            { id: "c4c", name: "휴업", section: "compensation" },
            { id: "c4d", name: "광업권", section: "compensation" },
            { id: "c4e", name: "어업권", section: "compensation" },
            { id: "c4f", name: "농업손실 보상", section: "compensation" },
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
    }
    map.set(node.id, metrics)
    return metrics
  }

  const childMetrics = children.map((child) =>
    computeMetrics(child, map, scale),
  )

  const metrics: Metrics = {
    leafCount: childMetrics.reduce((sum, child) => sum + child.leafCount, 0),
    maxDepth: 1 + Math.max(...childMetrics.map((child) => child.maxDepth)),
    childCount: children.length,
    scale,
  }

  map.set(node.id, metrics)
  return metrics
}

function getWeight(metrics: Metrics) {
  return (
    metrics.leafCount * 1 +
    metrics.maxDepth * 0.9 +
    metrics.childCount * 0.55
  )
}

// ── 혼잡도 보정 튜닝 지점 ──────────────────────────────
// CROWD_NODE_DEPTH: "3단계" 그룹 노드(원가방식, 수익방식 등)의 depth.
// root=0, 5개 핵심갈래=1, 3단계 그룹=2, 4단계 리프=3 이므로 2가 정확한 값.
const CROWD_NODE_DEPTH = 2

// childCount(자신의 4단계 자식 수)에 따라 "2→3단계 edge" 길이를 조정하는 배율.
// 2개 이하: 살짝 축소, 4개 기준 1.0, 이후 자식이 많아질수록 점점 확대.
// 값을 바꿔서 강도를 조절할 수 있습니다.
function crowdingMultiplier(childCount: number) {
  const raw = 0.85 + (childCount - 2) * 0.11
  return Math.min(Math.max(raw, 0.75), 1.7)
}
// 참고: childCount=2→0.85, 3→0.96, 4→1.07, 5→1.18, 6→1.29, 7→1.40, 8→1.51, 10→1.70
// ─────────────────────────────────────────────────────

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

  computeMetrics(root, metricsById, 1)

  const fullTurn = Math.PI * 2
  const rootChildren = root.children ?? []
  const rootSlice = rootChildren.length > 0 ? fullTurn / rootChildren.length : fullTurn
  const siblingGap = (6 * Math.PI) / 180

  // 부모의 실제 반지름에 자신의 edge 길이를 더하는 누적 방식.
  // depth === CROWD_NODE_DEPTH일 때만 자신의 childCount로 edge 길이를 보정한다.
  function edgeLength(depth: number, scale: number, ownChildCount: number) {
    const depthFactor = 1 + Math.min(depth, 8) * 0.04
    const base = opts.xSpacing * depthFactor * scale

    if (depth === CROWD_NODE_DEPTH) {
      return base * crowdingMultiplier(ownChildCount)
    }

    return base
  }

  function placeNode(
    node: TreeNode,
    depth: number,
    angle: number,
    startAngle: number,
    endAngle: number,
    inheritedScale: number,
    parentRadius: number,
  ) {
    const metrics = metricsById.get(node.id)!
    const scale = node.spacingScale ?? inheritedScale
    const step = depth === 0 ? 0 : edgeLength(depth, scale, metrics.childCount)
    const radius = parentRadius + step

    positions.set(node.id, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      name: node.name,
      section: node.section,
    })

    const children = node.children ?? []
    if (children.length === 0) return

    if (depth === 0) {
      children.forEach((child, index) => {
        const sectorStart = -Math.PI / 2 + index * rootSlice
        const sectorEnd = sectorStart + rootSlice
        const childAngle = (sectorStart + sectorEnd) / 2

        edges.push([node.id, child.id])

        placeNode(
          child,
          depth + 1,
          childAngle,
          sectorStart,
          sectorEnd,
          scale,
          radius,
        )
      })
      return
    }

    if (children.length === 1) {
      const child = children[0]
      edges.push([node.id, child.id])

      placeNode(
        child,
        depth + 1,
        angle,
        startAngle,
        endAngle,
        scale,
        radius,
      )
      return
    }

    const totalGap = siblingGap * Math.max(0, children.length - 1)
    const rawSpan = endAngle - startAngle
    const usableAngle = Math.max(rawSpan - totalGap, rawSpan * 0.6)

    const weights = children.map((child) => getWeight(metricsById.get(child.id)!))
    const weightSum = weights.reduce((sum, value) => sum + value, 0)

    let cursor = startAngle + (rawSpan - usableAngle) / 2

    children.forEach((child, index) => {
      const angleShare = usableAngle * (weights[index] / weightSum)
      const sectorStart = cursor
      const sectorEnd = cursor + angleShare
      const childAngle = (sectorStart + sectorEnd) / 2

      edges.push([node.id, child.id])

      placeNode(
        child,
        depth + 1,
        childAngle,
        sectorStart,
        sectorEnd,
        scale,
        radius,
      )

      cursor = sectorEnd + siblingGap
    })
  }

  placeNode(root, 0, -Math.PI / 2, -Math.PI, Math.PI, 1, 0)

  return { positions, edges }
}