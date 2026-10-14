// 집 모양 네 가지 — 상자·원기둥·원뿔을 조합한다(단위 = 미터, 화면 크기는 House3DView 가 맞춘다).
// 방향: 카메라가 +x·+z 쪽 위에서 내려다본다 → 화면 왼쪽 면 = +z(앞, 현관), 오른쪽 면 = +x(옆, 창).
// 바닥 면적은 정사각형에 가깝게(7m 안팎) — 가로로 긴 집은 원 안에서 납작해 보인다.
import { useMemo } from 'react'
import * as THREE from 'three'

export const WALL = '#f1ece2'
const STUCCO = '#ece5d8' // 평지붕 주택 외벽(드라이비트·페인트)
const BAND = '#ddd5c7' // 층 사이 띠·처마 콘크리트
const DOOR = '#6f5a43'
const GLASS = '#cfe3ee'
const FRAME = '#fbfaf7' // 흰 창틀
const BARS = '#5d6166' // 방범창
const CHIMNEY = '#b9a58a'
const GRASS = '#e2ecdd'

/** 무광 재질 한 줄 */
export const Mat = ({ color, map }: { color: string; map?: THREE.Texture }) => <meshStandardMaterial color={color} map={map} roughness={0.85} />

type V3 = [number, number, number]
/** 상자 하나(그림자 주고받기 포함) */
export function Box({ size, pos, color, rot, map }: { size: V3; pos: V3; color: string; rot?: V3; map?: THREE.Texture }) {
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <boxGeometry args={size} />
      <Mat color={color} map={map} />
    </mesh>
  )
}

/** 캔버스에 그린 그림을 무늬(texture)로 — 벽돌·라탄처럼 반복되는 겉면. tile = 무늬 한 장이 덮는 크기(m) */
export function useCanvasTexture(draw: (g: CanvasRenderingContext2D, n: number) => void, repeat: [number, number]) {
  const tex = useMemo(() => {
    const n = 256
    const c = document.createElement('canvas')
    c.width = c.height = n
    draw(c.getContext('2d')!, n)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 4
    return t
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  tex.repeat.set(repeat[0], repeat[1])
  return tex
}
/** 늘 같은 무늬가 나오게 하는 간단한 난수(새로 그릴 때마다 벽돌 색이 바뀌지 않게) */
export const seeded = (s = 7) => () => ((s = (s * 16807) % 2147483647) / 2147483647)

/** 적벽돌: 한 장(256px) = 2m × 2m, 8켜(켜당 25cm) · 벽돌 길이 50cm, 켜마다 반 장 엇갈림, 줄눈 밝은 회백색 */
const drawBrick = (g: CanvasRenderingContext2D, n: number) => {
  const rnd = seeded(11)
  g.fillStyle = '#e4d8c6'
  g.fillRect(0, 0, n, n)
  const rows = 8, cols = 4, bh = n / rows, bw = n / cols, m = 3
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? bw / 2 : 0
    for (let k = -1; k < cols + 1; k++) {
      const v = rnd()
      g.fillStyle = `rgb(${172 + v * 28}, ${78 + v * 20}, ${58 + v * 14})`
      g.fillRect(k * bw + off + m / 2, r * bh + m / 2, bw - m, bh - m)
    }
  }
}

/** 둥근 잔디 판 — 장식이 있으면 반지름을 키운다(House3DView) */
export function Ground({ r }: { r: number }) {
  return (
    <mesh position={[0, -0.15, 0]} receiveShadow>
      <cylinderGeometry args={[r, r, 0.3, 64]} />
      <Mat color={GRASS} />
    </mesh>
  )
}

/** 창 하나: 흰 틀 + 유리(+ 방범창 살). face = 붙는 벽('z' 앞 / 'x' 옆), at = 벽 밖 좌표 */
function Win({ face, at, u, y, w = 1.3, h = 1.1, bars }: { face: 'z' | 'x'; at: number; u: number; y: number; w?: number; h?: number; bars?: boolean }) {
  const p = (d: number, uu = u): V3 => (face === 'z' ? [uu, y, at + d] : [at + d, y, -uu])
  const s = (a: number, b: number, t: number): V3 => (face === 'z' ? [a, b, t] : [t, b, a])
  return (
    <group>
      <Box size={s(w + 0.2, h + 0.2, 0.06)} pos={p(0.03)} color={FRAME} />
      <Box size={s(w, h, 0.06)} pos={p(0.05)} color={GLASS} />
      {bars && [-0.3, 0, 0.3].map((k) => <Box key={k} size={s(0.05, h + 0.1, 0.05)} pos={p(0.12, u + k * w)} color={BARS} />)}
    </group>
  )
}

/** 옥상 난간: 네 벽(두께 0.2) + 위 덮개(지붕 색) + 옥상 바닥(지붕 색) */
function Parapet({ w, y, roof }: { w: number; y: number; roof: string }) {
  const h = 0.7, t = 0.2, e = w / 2 - t / 2
  return (
    <group>
      <Box size={[w - 0.2, 0.06, w - 0.2]} pos={[0, y + 0.03, 0]} color={roof} />
      {([[0, e, w, t], [0, -e, w, t], [e, 0, t, w], [-e, 0, t, w]] as const).map(([x, z, sx, sz], i) => (
        <group key={i}>
          <Box size={[sx, h, sz]} pos={[x, y + h / 2, z]} color={STUCCO} />
          <Box size={[sx + 0.1, 0.14, sz + 0.1]} pos={[x, y + h + 0.07, z]} color={roof} />
        </group>
      ))}
    </group>
  )
}

/** 박공지붕 주택: 벽 상자 7×3.2×7.4 + 박공(삼각 기둥) + 지붕 두 장 + 문·창·굴뚝. 용마루는 앞뒤(z) 방향. */
export function Home({ roof }: { roof: string }) {
  const H = 3.2, RISE = 2.6, HALF = 3.5, D = 7.4, OVER = 0.45, T = 0.22
  // 박공: 삼각형(x-y)을 z 로 D 만큼 밀어낸 기둥
  const gable = useMemo(() => {
    const s = new THREE.Shape([new THREE.Vector2(-HALF, 0), new THREE.Vector2(HALF, 0), new THREE.Vector2(0, RISE)])
    const g = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false })
    g.translate(0, 0, -D / 2)
    return g
  }, [])
  const a = Math.atan2(RISE, HALF) // 지붕 기울기
  const L = (HALF + OVER) / Math.cos(a) // 지붕 한 장 길이(처마 포함)
  // 지붕 한 장의 가운데: 용마루에서 경사를 따라 L/2 내려간 뒤 두께 반만큼 바깥으로
  const cx = (L / 2) * Math.cos(a) + (T / 2) * Math.sin(a)
  const cy = H + RISE - (L / 2) * Math.sin(a) + (T / 2) * Math.cos(a)
  return (
    <group>
      <Box size={[2 * HALF, H, D]} pos={[0, H / 2, 0]} color={WALL} />
      <mesh geometry={gable} position={[0, H, 0]} castShadow receiveShadow>
        <Mat color={WALL} />
      </mesh>
      <Box size={[L, T, D + 0.8]} pos={[cx, cy, 0]} rot={[0, 0, -a]} color={roof} />
      <Box size={[L, T, D + 0.8]} pos={[-cx, cy, 0]} rot={[0, 0, a]} color={roof} />
      {/* 앞: 현관문 + 창 / 옆: 창 두 개 */}
      <Box size={[1.1, 2, 0.08]} pos={[-1.5, 1, D / 2 + 0.04]} color={DOOR} />
      <Win face="z" at={D / 2} u={1.5} y={1.9} />
      <Win face="x" at={HALF} u={-1.7} y={1.9} />
      <Win face="x" at={HALF} u={1.7} y={1.9} />
      {/* 굴뚝: 오른쪽 지붕면을 뚫고 올라온다(x=1.8 에서 지붕 높이 ≈ 4.46) */}
      <Box size={[0.7, 1.8, 0.7]} pos={[1.8, 5, -1.8]} color={CHIMNEY} />
    </group>
  )
}

/** 평지붕 주택(한국 양옥·다가구): 2층 7.2×6.2×7.2, 층 사이 띠, 1층 방범창, 옥상 = 난간 + 계단실(옥탑) + 물탱크 + 장독대 */
export function FlatHouse({ roof }: { roof: string }) {
  const W = 7.2, FH = 3.1, H = FH * 2, e = W / 2
  return (
    <group>
      <Box size={[W, H, W]} pos={[0, H / 2, 0]} color={STUCCO} />
      <Box size={[W + 0.14, 0.2, W + 0.14]} pos={[0, FH, 0]} color={BAND} />
      <Box size={[1.1, 2.1, 0.08]} pos={[-1.8, 1.05, e + 0.04]} color={DOOR} />
      <Box size={[1.7, 0.12, 1]} pos={[-1.8, 2.4, e + 0.5]} color={BAND} />
      {[0, 1].map((f) => (
        <group key={f}>
          {f === 1 && <Win face="z" at={e} u={-1.6} y={f * FH + 1.6} bars={false} />}
          <Win face="z" at={e} u={1.5} y={f * FH + 1.6} bars={f === 0} />
          <Win face="x" at={e} u={-1.6} y={f * FH + 1.6} bars={f === 0} />
          <Win face="x" at={e} u={1.6} y={f * FH + 1.6} bars={f === 0} />
        </group>
      ))}
      <Parapet w={W} y={H} roof={roof} />
      {/* 옥탑 계단실 */}
      <Box size={[2.3, 2.3, 2.3]} pos={[-2.1, H + 1.15, -2.1]} color={STUCCO} />
      <Box size={[2.5, 0.14, 2.5]} pos={[-2.1, H + 2.37, -2.1]} color={roof} />
      <Box size={[0.9, 1.8, 0.06]} pos={[-1.6, H + 0.9, -0.93]} color={DOOR} />
      <WaterTank pos={[2.1, H, -2.0]} />
      {/* 장독대: 옥상 앞 오른쪽 */}
      {([[1.6, 1.7, 1], [2.45, 1.4, 0.85], [2.3, 2.45, 0.75]] as const).map(([x, z, s], i) => <Jar key={i} pos={[x, H + 0.06, z]} s={s} />)}
    </group>
  )
}

/** 적벽돌 다가구(한국 80·90년대 빨간 벽돌집): 3층 7.4×8.7×7.4, 벽돌 무늬, 층 사이 흰 띠, 흰 창틀, 1층 방범창, 현관 차양, 옥상 물탱크 */
export function BrickHouse({ roof }: { roof: string }) {
  const W = 7.4, FH = 2.9, F = 3, H = FH * F, e = W / 2
  const brick = useCanvasTexture(drawBrick, [W / 2, H / 2])
  return (
    <group>
      <Box size={[W, H, W]} pos={[0, H / 2, 0]} color="#ffffff" map={brick} />
      {[1, 2].map((f) => <Box key={f} size={[W + 0.12, 0.18, W + 0.12]} pos={[0, f * FH, 0]} color={BAND} />)}
      <Box size={[1.2, 2.1, 0.08]} pos={[-2.2, 1.05, e + 0.04]} color={DOOR} />
      <Box size={[1.9, 0.14, 1.1]} pos={[-2.2, 2.35, e + 0.55]} color={BAND} />
      {Array.from({ length: F }, (_, f) => (
        <group key={f}>
          {f > 0 && <Win face="z" at={e} u={-2} y={f * FH + 1.5} />}
          <Win face="z" at={e} u={1.6} y={f * FH + 1.5} bars={f === 0} />
          <Win face="x" at={e} u={-1.7} y={f * FH + 1.5} bars={f === 0} />
          <Win face="x" at={e} u={1.7} y={f * FH + 1.5} bars={f === 0} />
        </group>
      ))}
      <Parapet w={W} y={H} roof={roof} />
      <WaterTank pos={[-1.8, H, -1.8]} />
    </group>
  )
}

/** 옥상 물탱크(스테인리스 원통 + 받침) */
function WaterTank({ pos }: { pos: V3 }) {
  return (
    <group position={pos}>
      <Box size={[1.5, 0.3, 1.5]} pos={[0, 0.15, 0]} color={BAND} />
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.65, 0.65, 1.3, 20]} />
        <meshStandardMaterial color="#d6dbe0" roughness={0.45} metalness={0.3} />
      </mesh>
    </group>
  )
}

/** 장독(항아리): 납작한 공 + 뚜껑 */
function Jar({ pos, s }: { pos: V3; s: number }) {
  return (
    <group position={pos} scale={s}>
      <mesh position={[0, 0.42, 0]} scale={[1, 1.15, 1]} castShadow>
        <sphereGeometry args={[0.4, 14, 10]} />
        <meshStandardMaterial color="#6b4a32" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.88, 0]}>
        <cylinderGeometry args={[0.24, 0.27, 0.1, 14]} />
        <meshStandardMaterial color="#5a3d29" roughness={0.4} />
      </mesh>
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
