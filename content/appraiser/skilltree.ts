export type TreeNode = {
  id: string
  name: string
  section: string
  children?: TreeNode[]
  spacingScale?: number
}

export type Metrics = {
  leafCount: number
  maxDepth: number
  childCount: number
  scale: number
  spanDemand: number
}

export type PlacementResult = {
  angle: number
  minAngle: number
  maxAngle: number
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function computeMetrics(
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

export function gapFor(depth: number, childCount: number) {
  const baseDeg =
    depth <= 1 ? 8 :
    depth === 2 ? 7 :
    depth === 3 ? 6 :
    5

  const compactAdjust = childCount >= 6 ? -1 : 0
  return ((baseDeg + compactAdjust) * Math.PI) / 180
}

export function siblingGapFor(depth: number, left: TreeNode, right: TreeNode): number {
  const base = gapFor(depth, 2)

  const leftBranch = left.children?.length ?? 0
  const rightBranch = right.children?.length ?? 0

  const branchPenaltyDeg =
    Math.min(leftBranch, 4) * 0.8 + Math.min(rightBranch, 4) * 0.8

  return base + (branchPenaltyDeg * Math.PI) / 180
}

export function occupancyFor(childCount: number, maxDepth: number) {
  if (childCount <= 1) return 0.18
  const cap = childCount >= 5 ? 0.88 : 0.96
  return clamp(
    0.66 + Math.min(childCount, 6) * 0.05 + Math.min(maxDepth, 4) * 0.04,
    0.72,
    cap,
  )
}

export const EDGE_MULTIPLIER_BY_CHILD_COUNT: Record<number, number> = {
  0: 0.45,
  1: 0.45,
  2: 0.6,
  3: 0.8,
  4: 1.2,
  5: 1.5,
}

export const MANY_CHILDREN_MULTIPLIER = 1.6

export function edgeLengthMultiplier(childCount: number): number {
  if (childCount in EDGE_MULTIPLIER_BY_CHILD_COUNT) {
    return EDGE_MULTIPLIER_BY_CHILD_COUNT[childCount]
  }
  return MANY_CHILDREN_MULTIPLIER
}

export function edgeLengthFor(
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

export const CHAIN_JITTER_RAD = (2 * Math.PI) / 180

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
    chainSign: number,
  ): PlacementResult {
    const scale = node.spacingScale ?? inheritedScale
    const children = node.children ?? []
    const metrics = metricsById.get(node.id)!

    const radius =
      depth === 1
        ? parentRadius + radialStep
        : parentRadius + edgeLengthFor(node, metrics, radialStep, scale)

    if (children.length === 0) {
      const angle = (sectorStart + sectorEnd) / 2
      setPosition(node, angle, radius)
      return { angle, minAngle: angle, maxAngle: angle }
    }

    if (children.length === 1) {
      const onlyChild = children[0]
      edges.push([node.id, onlyChild.id])

      const ownAngle = (sectorStart + sectorEnd) / 2
      setPosition(node, ownAngle, radius)

      const jitter = CHAIN_JITTER_RAD * chainSign
      const rotatedStart = sectorStart + jitter
      const rotatedEnd = sectorEnd + jitter

      const childPlacement = placeNode(
        onlyChild,
        depth + 1,
        rotatedStart,
        rotatedEnd,
        scale,
        radius,
        -chainSign,
      )

      return {
        angle: ownAngle,
        minAngle: Math.min(ownAngle, childPlacement.minAngle),
        maxAngle: Math.max(ownAngle, childPlacement.maxAngle),
      }
    }

    const gaps: number[] = []
    for (let i = 0; i < children.length - 1; i++) {
      gaps.push(siblingGapFor(depth, children[i], children[i + 1]))
    }
    const totalGap = gaps.reduce((sum, g) => sum + g, 0)

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
        1,
      )

      childPlacements.push(placed)
      cursor = childEnd + (gaps[index] ?? 0)
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
    placeNode(child, 1, sectorStart, sectorEnd, 1, 0, 1)
  })

  return { positions, edges }
}