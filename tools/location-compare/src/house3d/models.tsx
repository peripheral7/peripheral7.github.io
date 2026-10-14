// 집 모양 세 가지 — 상자·원기둥·원뿔을 조합한다(단위 = 미터, 화면 크기는 House3DView 가 맞춘다).
// 방향: 카메라가 +x·+z 쪽 위에서 내려다본다 → 화면 왼쪽 면 = +z(앞, 현관), 오른쪽 면 = +x(옆, 창).
import { useMemo } from 'react'
import * as THREE from 'three'

const WALL = '#f1ece2'
const DOOR = '#6f5a43'
const GLASS = '#cfe3ee'
const CHIMNEY = '#b9a58a'
const GRASS = '#e2ecdd'

/** 무광 재질 한 줄 */
const Mat = ({ color }: { color: string }) => <meshStandardMaterial color={color} roughness={0.85} />

/** 상자 하나(그림자 주고받기 포함) */
function Box({ size, pos, color, rot }: { size: [number, number, number]; pos: [number, number, number]; color: string; rot?: [number, number, number] }) {
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <boxGeometry args={size} />
      <Mat color={color} />
    </mesh>
  )
}

/** 둥근 잔디 판 — 세 모양 모두 같은 크기(반지름 6.6m) */
export function Ground() {
  return (
    <mesh position={[0, -0.15, 0]} receiveShadow>
      <cylinderGeometry args={[6.6, 6.6, 0.3, 48]} />
      <Mat color={GRASS} />
    </mesh>
  )
}

/** 1위 장식: 나무 한 그루(앞 왼쪽) */
export function Tree() {
  return (
    <group position={[-4.6, 0, 3.4]}>
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

/** 주택: 벽 상자 6×3.2×8 + 박공(삼각 기둥) + 지붕 두 장 + 문·창·굴뚝. 용마루는 앞뒤(z) 방향. */
export function Home({ roof }: { roof: string }) {
  const H = 3.2, RISE = 2.4, HALF = 3, OVER = 0.45, T = 0.22
  // 박공: 삼각형(x-y)을 z 로 8m 밀어낸 기둥
  const gable = useMemo(() => {
    const s = new THREE.Shape([new THREE.Vector2(-HALF, 0), new THREE.Vector2(HALF, 0), new THREE.Vector2(0, RISE)])
    const g = new THREE.ExtrudeGeometry(s, { depth: 8, bevelEnabled: false })
    g.translate(0, 0, -4)
    return g
  }, [])
  const a = Math.atan2(RISE, HALF) // 지붕 기울기
  const L = (HALF + OVER) / Math.cos(a) // 지붕 한 장 길이(처마 포함)
  // 지붕 한 장의 가운데: 용마루에서 경사를 따라 L/2 내려간 뒤 두께 반만큼 바깥으로
  const cx = (L / 2) * Math.cos(a) + (T / 2) * Math.sin(a)
  const cy = H + RISE - (L / 2) * Math.sin(a) + (T / 2) * Math.cos(a)
  return (
    <group>
      <Box size={[6, H, 8]} pos={[0, H / 2, 0]} color={WALL} />
      <mesh geometry={gable} position={[0, H, 0]} castShadow receiveShadow>
        <Mat color={WALL} />
      </mesh>
      <Box size={[L, T, 8.8]} pos={[cx, cy, 0]} rot={[0, 0, -a]} color={roof} />
      <Box size={[L, T, 8.8]} pos={[-cx, cy, 0]} rot={[0, 0, a]} color={roof} />
      {/* 현관문(앞) · 창 두 개(옆) */}
      <Box size={[1.1, 2, 0.08]} pos={[-1.4, 1, 4.04]} color={DOOR} />
      <Box size={[0.08, 1.1, 1.3]} pos={[3.04, 1.9, 1.7]} color={GLASS} />
      <Box size={[0.08, 1.1, 1.3]} pos={[3.04, 1.9, -1.8]} color={GLASS} />
      {/* 굴뚝: 오른쪽 지붕면을 뚫고 올라온다 */}
      <Box size={[0.7, 1.8, 0.7]} pos={[1.6, 4.9, -2]} color={CHIMNEY} />
    </group>
  )
}

/** 주거용 오피스텔: 7×15×7 평지붕, 층마다 창 띠, 옥상 난간(지붕 색)·기계실 */
export function Officetel({ roof }: { roof: string }) {
  const FLOORS = 5, FH = 3
  return (
    <group>
      <Box size={[7, FLOORS * FH, 7]} pos={[0, (FLOORS * FH) / 2, 0]} color={WALL} />
      {Array.from({ length: FLOORS - 1 }, (_, i) => (
        <Box key={i} size={[7.06, 1.1, 7.06]} pos={[0, (i + 1) * FH + 1.6, 0]} color={GLASS} />
      ))}
      {/* 1층: 유리 출입구(앞) */}
      <Box size={[2.4, 2.3, 0.08]} pos={[0, 1.15, 3.54]} color={GLASS} />
      <Box size={[7.4, 0.5, 7.4]} pos={[0, FLOORS * FH + 0.25, 0]} color={roof} />
      <Box size={[2.2, 1.4, 2.2]} pos={[-1.3, FLOORS * FH + 1.2, -1.3]} color={WALL} />
    </group>
  )
}

/** 상가: 9×3.8×6 낮은 상자 + 앞면 통유리 + 기울어진 차양·옥상 테두리(지붕 색) */
export function Shop({ roof }: { roof: string }) {
  return (
    <group>
      <Box size={[9, 3.8, 6]} pos={[0, 1.9, 0]} color={WALL} />
      <Box size={[7.6, 2.2, 0.08]} pos={[0, 1.35, 3.04]} color={GLASS} />
      <Box size={[0.08, 2.2, 0.12]} pos={[1.2, 1.35, 3.08]} color={WALL} />
      <Box size={[8.2, 0.16, 1.5]} pos={[0, 2.85, 3.62]} rot={[0.35, 0, 0]} color={roof} />
      <Box size={[9.3, 0.4, 6.3]} pos={[0, 4, 0]} color={roof} />
      {/* 옆면 작은 창 */}
      <Box size={[0.08, 1, 1.6]} pos={[4.54, 2, -1]} color={GLASS} />
    </group>
  )
}
