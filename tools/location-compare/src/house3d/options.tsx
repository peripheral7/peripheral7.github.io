// 집 둘레 장식(옵션 오브젝트) — 후보지 특성에 따라 붙는다(어떤 특성 → 어떤 장식인지는 spec.ts, 목록은 HOUSE3D.md 3-1절).
// 장식은 실제보다 1.3~1.5배 크게(장난감 디오라마) — 실제 크기면 원 안에서 몇 픽셀이라 알아볼 수 없다.
// 자리: 집(±3.7m) 둘레 다섯 칸(SLOTS) 중 카메라에서 보이는 앞·옆쪽. 공원만 칸 대신 판 가장자리 전체(산책길 + 나무).
import { useMemo } from 'react'
import * as THREE from 'three'
import type { HouseOption } from './spec'
import { Box, Mat, seeded, useCanvasTexture } from './models'

type V3 = [number, number, number]
const FACE = Math.PI / 4 // 장식의 앞(+z)이 카메라 쪽을 보게

/** 두 점을 잇는 막대(원기둥) — 원기둥은 원래 y 축으로 서 있으므로, y 축을 a→b 방향으로 돌리는 회전(쿼터니언)을 구한다 */
function Rod({ a, b, r = 0.05, color }: { a: V3; b: V3; r?: number; color: string }) {
  const { pos, q, len } = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b)
    const d = B.clone().sub(A)
    return { pos: A.clone().add(B).multiplyScalar(0.5), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()), len: d.length() }
  }, [a.join(), b.join()]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <mesh position={pos} quaternion={q} castShadow>
      <cylinderGeometry args={[r, r, len, 8]} />
      <Mat color={color} />
    </mesh>
  )
}

/** 1위 장식 · 공원: 뾰족한 나무(원뿔 두 단) */
export function Conifer({ pos = [0, 0, 0], s = 1 }: { pos?: V3; s?: number }) {
  return (
    <group position={pos} scale={s}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 1, 8]} />
        <Mat color="#8a6a4a" />
      </mesh>
      <mesh position={[0, 1.9, 0]} castShadow>
        <coneGeometry args={[1.1, 2.2, 7]} />
        <meshStandardMaterial color="#5f9e6e" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[0.8, 1.6, 7]} />
        <meshStandardMaterial color="#6aa978" roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

/** 공원: 둥근 나무(울퉁불퉁한 20면체 수관) */
function RoundTree({ pos, s = 1, color = '#79b07f' }: { pos: V3; s?: number; color?: string }) {
  return (
    <group position={pos} scale={s}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 1.2, 8]} />
        <Mat color="#8a6a4a" />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

/** 고양이(앉은 모습, 치즈 태비) — 조용한 동네 */
function Cat() {
  const fur = '#e39a4f', white = '#fbf3e6'
  return (
    <group scale={1.35}>
      <mesh position={[0, 0.5, 0]} scale={[0.55, 0.72, 0.6]} castShadow>
        <sphereGeometry args={[0.6, 16, 12]} />
        <Mat color={fur} />
      </mesh>
      <mesh position={[0, 0.55, 0.22]} scale={[0.32, 0.45, 0.25]}>
        <sphereGeometry args={[0.6, 12, 10]} />
        <Mat color={white} />
      </mesh>
      <mesh position={[0, 1.08, 0.12]} castShadow>
        <sphereGeometry args={[0.3, 16, 12]} />
        <Mat color={fur} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 0.16, 1.36, 0.1]} rotation={[0, 0, -k * 0.25]} castShadow>
          <coneGeometry args={[0.1, 0.22, 4]} />
          <Mat color={fur} />
        </mesh>
      ))}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 0.11, 1.12, 0.39]}>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshStandardMaterial color="#2b2b2b" roughness={0.3} />
        </mesh>
      ))}
      {/* 꼬리: 몸을 감싸는 반원(토러스 일부) */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, -0.3]} castShadow>
        <torusGeometry args={[0.42, 0.07, 6, 16, Math.PI * 1.1]} />
        <Mat color={fur} />
      </mesh>
    </group>
  )
}

/** 라탄 무늬: 엇갈려 짠 등나무 줄 */
const drawRattan = (g: CanvasRenderingContext2D, n: number) => {
  const rnd = seeded(5)
  g.fillStyle = '#b58a52'
  g.fillRect(0, 0, n, n)
  const k = 16, cell = n / k
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
    const v = rnd() * 18
    g.fillStyle = (i + j) % 2 ? `rgb(${214 + v},${178 + v},${120 + v})` : `rgb(${196 + v},${158 + v},${102 + v})`
    if ((i + j) % 2) g.fillRect(i * cell + 1, j * cell + 3, cell - 2, cell - 6)
    else g.fillRect(i * cell + 3, j * cell + 1, cell - 6, cell - 2)
  }
}

/** 라탄 의자: 둥근 좌판 + 뒤를 감싸는 반원 등받이(열린 원기둥 반쪽) + 다리 넷 */
function RattanChair({ pos, rotY }: { pos: V3; rotY: number }) {
  const rattan = useCanvasTexture(drawRattan, [2, 1])
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.38, 0.14, 18]} />
        <Mat color="#ffffff" map={rattan} />
      </mesh>
      <mesh position={[0, 0.98, 0]} castShadow>
        <cylinderGeometry args={[0.44, 0.42, 0.62, 18, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#ffffff" map={rattan} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => <Rod key={i} a={[x * 0.26, 0, z * 0.26]} b={[x * 0.24, 0.56, z * 0.24]} r={0.035} color="#8f6a3e" />)}
    </group>
  )
}

/** 카페: 작은 원형 테이블 + 라탄 의자 둘 + 에스프레소 한 잔(받침·잔·크레마) — 도보 5분 안 카페가 넉넉한 곳 */
function CafeSet() {
  return (
    <group scale={1.4}>
      <mesh position={[0, 1.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.06, 24]} />
        <Mat color="#f7f5f0" />
      </mesh>
      <Rod a={[0, 0.05, 0]} b={[0, 1.05, 0]} r={0.045} color="#3c3c3c" />
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.28, 0.3, 0.05, 18]} />
        <Mat color="#3c3c3c" />
      </mesh>
      <RattanChair pos={[-0.85, 0, 0.2]} rotY={-Math.PI / 2 + 0.25} />
      <RattanChair pos={[0.75, 0, -0.45]} rotY={Math.PI / 2 + 0.6} />
      {/* 에스프레소: 잔은 실제보다 크게(1.8배) 그려야 보인다 */}
      <group position={[0.12, 1.11, 0.1]} scale={1.8}>
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.13, 0.11, 0.02, 18]} />
          <Mat color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.06, 0.1, 16]} />
          <Mat color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.121, 0]}>
          <cylinderGeometry args={[0.066, 0.066, 0.004, 16]} />
          <meshStandardMaterial color="#a8703c" roughness={0.5} />
        </mesh>
        <mesh position={[0.085, 0.075, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.025, 0.008, 6, 10]} />
          <Mat color="#ffffff" />
        </mesh>
      </group>
    </group>
  )
}

/** 공원: 판 가장자리를 도는 산책길(고리) + 나무 여러 그루 + 벤치 — 공원 점수가 높은 곳 */
function Park({ r }: { r: number }) {
  const path = r - 1.5 // 산책길 가운데 반지름
  const trees: [number, number, string][] = [[15, 0.9, '#79b07f'], [75, 0.8, '#86b98a'], [125, 1, '#6ea777'], [180, 1.1, '#79b07f'], [230, 1.2, '#86b98a'], [280, 1.1, '#6ea777'], [330, 0.9, '#79b07f']]
  const at = (deg: number, rr: number): V3 => [rr * Math.cos((deg * Math.PI) / 180), 0, rr * Math.sin((deg * Math.PI) / 180)]
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <ringGeometry args={[path - 0.45, path + 0.45, 72]} />
        <Mat color="#e8d9b5" />
      </mesh>
      {trees.map(([d, s, c], i) => <RoundTree key={i} pos={at(d, path + 1.0)} s={s} color={c} />)}
      <Conifer pos={at(200, path + 0.9)} s={0.8} />
      {/* 벤치: 길 바깥쪽, 앞 오른쪽 */}
      <group position={at(30, path + 0.85)} rotation={[0, -(30 * Math.PI) / 180 - Math.PI / 2, 0]}>
        <Box size={[1.6, 0.08, 0.5]} pos={[0, 0.48, 0]} color="#a0784f" />
        <Box size={[1.6, 0.4, 0.07]} pos={[0, 0.75, -0.24]} color="#a0784f" />
        <Box size={[0.08, 0.45, 0.45]} pos={[-0.7, 0.22, 0]} color="#4a4a4a" />
        <Box size={[0.08, 0.45, 0.45]} pos={[0.7, 0.22, 0]} color="#4a4a4a" />
      </group>
    </group>
  )
}

/** 작은 도서관(동네 책장 상자): 기둥 + 지붕 얹은 상자 + 유리 + 책등 — 가까운 도서관이 있는 곳 */
function Library() {
  const books = ['#c0564b', '#4f86c6', '#e5b84f', '#3f9a62', '#8a63b8']
  return (
    <group scale={1.4}>
      <Box size={[0.14, 1.1, 0.14]} pos={[0, 0.55, 0]} color="#7a5a3c" />
      <Box size={[0.9, 0.75, 0.55]} pos={[0, 1.45, 0]} color="#a0784f" />
      <Box size={[1.05, 0.08, 0.7]} pos={[0, 1.86, 0]} color="#7a5a3c" />
      {books.map((c, i) => <Box key={i} size={[0.1, 0.42 + (i % 2) * 0.08, 0.3]} pos={[-0.3 + i * 0.14, 1.32 + (i % 2) * 0.04, 0.08]} color={c} />)}
      <mesh position={[0, 1.45, 0.28]}>
        <boxGeometry args={[0.8, 0.65, 0.02]} />
        <meshStandardMaterial color="#dceef7" transparent opacity={0.35} roughness={0.2} />
      </mesh>
    </group>
  )
}

/** 자전거(보라 = 자전거 수단 색): 바퀴 둘(토러스) + 막대로 이은 뼈대 */
function Bike() {
  const c = '#8a63b8', dark = '#3a3a3a'
  const R: V3 = [-0.62, 0.45, 0], F: V3 = [0.62, 0.45, 0], crank: V3 = [0, 0.42, 0], seat: V3 = [-0.18, 1.05, 0], head: V3 = [0.45, 1.05, 0]
  return (
    <group scale={1.3}>
      {[R, F].map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <torusGeometry args={[0.42, 0.05, 8, 24]} />
          <Mat color={dark} />
        </mesh>
      ))}
      <Rod a={R} b={crank} color={c} />
      <Rod a={R} b={seat} color={c} />
      <Rod a={crank} b={seat} color={c} />
      <Rod a={crank} b={head} color={c} />
      <Rod a={seat} b={head} color={c} />
      <Rod a={head} b={F} color={c} />
      <Rod a={head} b={[0.4, 1.25, 0]} color={c} />
      <Rod a={[0.4, 1.25, -0.28]} b={[0.4, 1.25, 0.28]} r={0.035} color={dark} />
      <Box size={[0.32, 0.07, 0.16]} pos={[-0.22, 1.12, 0]} color={dark} />
    </group>
  )
}

/** 자동차(주황 = 차량 수단 색): 차체 + 유리 지붕칸 + 바퀴 넷 */
function Car() {
  const body = '#e5853f'
  return (
    <group>
      <Box size={[3.4, 0.75, 1.6]} pos={[0, 0.62, 0]} color={body} />
      <Box size={[1.9, 0.6, 1.4]} pos={[-0.25, 1.28, 0]} color="#cfe3ee" />
      <Box size={[1.95, 0.08, 1.45]} pos={[-0.25, 1.6, 0]} color={body} />
      {[[-1.1, 0.8], [1.1, 0.8], [-1.1, -0.8], [1.1, -0.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.33, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 14]} />
          <Mat color="#2f2f2f" />
        </mesh>
      ))}
      <Box size={[0.06, 0.16, 0.3]} pos={[1.71, 0.72, 0.5]} color="#fff6d6" />
      <Box size={[0.06, 0.16, 0.3]} pos={[1.71, 0.72, -0.5]} color="#fff6d6" />
    </group>
  )
}

/** 버스 정류장(초록 = 대중교통 수단 색): 기둥 + 둥근 표지 + 지붕 있는 벤치 */
function BusStop() {
  const g = '#3f9a62'
  return (
    <group scale={1.2}>
      <Rod a={[0.9, 0, 0]} b={[0.9, 2.3, 0]} r={0.05} color="#6b6f74" />
      <mesh position={[0.9, 2.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.06, 20]} />
        <Mat color={g} />
      </mesh>
      <mesh position={[0.9, 2.45, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.01, 20]} />
        <Mat color="#ffffff" />
      </mesh>
      <Box size={[1.5, 0.08, 0.7]} pos={[-0.5, 2, 0]} color={g} />
      <Box size={[1.5, 1.4, 0.05]} pos={[-0.5, 1.25, -0.33]} color="#dceef7" />
      <Rod a={[-1.22, 0, -0.3]} b={[-1.22, 2, -0.3]} r={0.04} color="#6b6f74" />
      <Rod a={[0.22, 0, -0.3]} b={[0.22, 2, -0.3]} r={0.04} color="#6b6f74" />
      <Box size={[1.3, 0.07, 0.38]} pos={[-0.5, 0.5, -0.1]} color="#a0784f" />
    </group>
  )
}

/** 장식이 서는 칸(집 둘레, 카메라에서 보이는 쪽) — A 화면 왼쪽 · B 왼쪽 아래(현관 앞) · C 아래 · D 오른쪽 아래 · E 오른쪽 */
const SLOTS = { A: [-5.8, 2.6], B: [-1.2, 6.0], C: [4.8, 4.8], D: [6.0, -1.2], E: [2.6, -5.8] } as const
type Slot = keyof typeof SLOTS
/** 장식마다 좋아하는 칸(앞쪽부터). 칸이 차 있으면 다음 칸, 다 차면 그 장식은 빠진다(최대 5개) */
const PREFER: Record<Exclude<HouseOption, 'park'>, Slot[]> = {
  cafe: ['C', 'B', 'D'],
  cat: ['B', 'C', 'A'],
  tree: ['A', 'E', 'D'],
  library: ['D', 'A', 'E'],
  bike: ['D', 'E', 'C'],
  car: ['E', 'D', 'A'],
  bus: ['A', 'E', 'D'],
}
const PIECE: Record<Exclude<HouseOption, 'park'>, () => JSX.Element> = { cafe: CafeSet, cat: Cat, tree: () => <Conifer />, library: Library, bike: Bike, car: Car, bus: BusStop }

/** 칸 배정: 앞 순서(spec.ts 가 정한 순서) 장식부터 좋아하는 칸을 차지한다 */
export function placeOptions(options: HouseOption[]) {
  const used = new Set<Slot>()
  const out: { o: Exclude<HouseOption, 'park'>; slot: Slot }[] = []
  for (const o of options) {
    if (o === 'park') continue
    const slot = PREFER[o].find((s) => !used.has(s)) ?? (Object.keys(SLOTS) as Slot[]).find((s) => !used.has(s))
    if (!slot) continue
    used.add(slot)
    out.push({ o, slot })
  }
  return out
}

/** 판 반지름: 장식 없음 6.6 · 칸 장식 8.2 · 공원(산책길 + 나무 둘레) 9.4 */
export const groundRadius = (options: HouseOption[]) => (options.includes('park') ? 9.4 : options.length ? 8.2 : 6.6)

export function Options({ options, r }: { options: HouseOption[]; r: number }) {
  return (
    <group>
      {options.includes('park') && <Park r={r} />}
      {placeOptions(options).map(({ o, slot }) => {
        const P = PIECE[o]
        const [x, z] = SLOTS[slot]
        return (
          <group key={o} position={[x, 0, z]} rotation={[0, FACE, 0]}>
            <P />
          </group>
        )
      })}
    </group>
  )
}
