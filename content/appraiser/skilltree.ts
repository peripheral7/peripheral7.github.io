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
  land: { title: "토지평가", tier: 1 },
  cost: { title: "원가방식", tier: 1 },
  building: { title: "건물평가", tier: 1 },
  income: { title: "수익방식", tier: 1 },
  "rent-rights": { title: "임대료 및 권리평가", tier: 1 },
  special: { title: "특수토지평가", tier: 1 },
  typeEval: { title: "기업가치·기타평가", tier: 2 },
  ip: { title: "지식재산권평가", tier: 2 },
  purpose: { title: "목적별평가", tier: 2 },
}

export const skillTree: TreeNode = {
  id: "root0", name: "감정평가실무", section: "root",
  children: [{
    id: "k1", name: "감정평가기초", section: "trunk",
    children: [{
      id: "k2", name: "공시지가기준법", section: "trunk",
      children: [{
        id: "k3", name: "거래사례비교법", section: "trunk",
        children: [{
          id: "k4", name: "유형별 평가", section: "trunk", spacingScale: 0.55,
          children: [
            // ── 토지 갈래 (단일 체인) ──
            { id: "k5", name: "토지잔여법", section: "income",
              children: [{ id: "k6", name: "둘 이상의 용도지역 토지", section: "land",
                children: [{ id: "k7", name: "도시계획시설저촉토지", section: "special",
                  children: [{ id: "k8", name: "골프장 평가", section: "special",
                    children: [{ id: "k9", name: "개발법", section: "special",
                      children: [{ id: "k10", name: "지상권", section: "rent-rights",
                        children: [{ id: "k11", name: "구분지상권 설정토지", section: "rent-rights",
                          children: [{ id: "k12", name: "임대차평가", section: "rent-rights" }],
                        }],
                      }],
                    }],
                  }],
                }],
              }],
            },
            // ── 건물 갈래 (단일 체인) ──
            { id: "k13", name: "재조달원가", section: "cost",
              children: [{ id: "k14", name: "조성원가법", section: "cost",
                children: [{ id: "k15", name: "건물 거래사례비교법", section: "building",
                  children: [{ id: "k16", name: "회귀분석", section: "building",
                    children: [{ id: "k17", name: "구분건물 감정평가", section: "building" }],
                  }],
                }],
              }],
            },
            // ── 기타/특수 갈래 (단일 체인) ──
            { id: "k18", name: "수익환원법", section: "income",
              children: [{ id: "k19", name: "직접환원법", section: "income",
                children: [{ id: "k20", name: "임대사례비교법", section: "rent-rights",
                  children: [{ id: "k21", name: "적산법", section: "rent-rights",
                    children: [{ id: "k22", name: "기업가치평가", section: "typeEval",
                      children: [{ id: "k23", name: "기계기구평가", section: "typeEval",
                        children: [{ id: "k24", name: "영업권 감정평가", section: "ip",
                          children: [{ id: "k25", name: "비상장주식 감정평가", section: "ip",
                            children: [{ id: "k26", name: "총자산가치 산정", section: "ip",
                              children: [{ id: "k27", name: "오피스 매입에 따른 감정평가", section: "purpose",
                                children: [{ id: "k28", name: "타당성분석", section: "purpose",
                                  children: [{ id: "k29", name: "매후환대차", section: "purpose",
                                    children: [{ id: "k30", name: "담보 및 경매평가", section: "purpose",
                                      children: [{ id: "k31", name: "최유효이용분석", section: "purpose",
                                        children: [{ id: "k32", name: "도시정비평가", section: "purpose",
                                          children: [{ id: "k33", name: "종전자산평가", section: "purpose",
                                            children: [{ id: "k34", name: "관리처분계획", section: "purpose" }],
                                          }],
                                        }],
                                      }],
                                    }],
                                  }],
                                }],
                              }],
                            }],
                          }],
                        }],
                      }],
                    }],
                  }],
                }],
              }],
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
  const TRUNK_IDS = new Set(["root0", "k1", "k2", "k3", "k4"])

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

    const nextActive = swayActive || node.id === "k4"

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