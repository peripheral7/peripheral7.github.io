// 교통평점 카드 원 안의 3D 집(R3F). TransportCard 가 React.lazy 로 불러온다 → three 는 이 묶음에만 들어가 첫 화면이 무거워지지 않는다.
// 정지 화면이라 frameloop="demand": 바뀔 때(후보지 넘김·크기 변화)만 다시 그린다.
import { useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { House3DProps } from './colors'
import { Ground, Home, Officetel, Shop, Tree } from './models'

/** 카메라가 바라보는 방향(집 쪽에서 본 카메라 위치) — 왼쪽 앞 위, SVG 집과 같은 아이소메트릭 느낌 */
const VIEW = new THREE.Vector3(1, 0.8, 1).normalize()
const POP_S = 0.3 // 후보지 바뀔 때 커지는 시간(초)
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** 장면 전체: 모양을 그리고, 카메라를 모양에 맞추고, 후보지가 바뀌면 살짝 작았다 커진다 */
function Scene({ kind, roof, tree, animKey }: House3DProps) {
  const outer = useRef<THREE.Group>(null) // 커지기 애니메이션용(크기만 바꾼다)
  const inner = useRef<THREE.Group>(null) // 화면 맞춤 기준
  const { camera, size, invalidate } = useThree()
  const pop = useRef(1) // 0 → 1 진행도

  // 화면 맞춤: 모든 꼭짓점을 카메라 좌표로 옮겨 가로·세로 범위를 재고, 그 가운데로 카메라를 옮긴 뒤 확대 배율을 정한다.
  // (상자 경계(Box3)로 재면 둥근 잔디 판의 네모 모서리까지 들어가 집이 작아진다 → 꼭짓점으로 정확히)
  useLayoutEffect(() => {
    const o = outer.current, g = inner.current
    if (!o || !g || !size.width) return
    const keep = o.scale.x
    o.scale.setScalar(1)
    o.updateMatrixWorld(true)
    camera.position.copy(VIEW).multiplyScalar(60)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    const inv = camera.matrixWorldInverse, v = new THREE.Vector3()
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    g.traverse((m) => {
      if (!(m instanceof THREE.Mesh)) return
      const p = m.geometry.attributes.position
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv)
        x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y)
      }
    })
    // 가운데로 옮기기: 카메라의 오른쪽·위쪽 축으로 이동(정사영이라 옮겨도 크기는 그대로)
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
    camera.position.addScaledVector(right, (x0 + x1) / 2).addScaledVector(up, (y0 + y1) / 2)
    camera.zoom = Math.min(size.width / (x1 - x0), size.height / (y1 - y0)) * 0.96
    camera.updateProjectionMatrix()
    o.scale.setScalar(keep)
    invalidate()
  }, [kind, tree, size.width, size.height, camera, invalidate])

  // 후보지가 바뀌면 0.9 → 1 로 커진다(움직임 줄이기 설정이면 생략)
  useLayoutEffect(() => {
    if (reduced()) return
    pop.current = 0
    invalidate()
  }, [animKey, invalidate])
  useFrame((_, dt) => {
    const o = outer.current
    if (!o || pop.current >= 1) return
    pop.current = Math.min(1, pop.current + dt / POP_S)
    const e = 1 - (1 - pop.current) ** 3 // easeOutCubic
    o.scale.setScalar(0.9 + 0.1 * e)
    invalidate() // 다 커질 때까지 다음 장면을 요청
  })

  return (
    <group ref={outer}>
      <group ref={inner}>
        <Ground />
        {kind === 'officetel' ? <Officetel roof={roof} /> : kind === 'shop' ? <Shop roof={roof} /> : <Home roof={roof} />}
        {tree && <Tree />}
      </group>
    </group>
  )
}

export default function House3DView(props: House3DProps) {
  return (
    <Canvas
      className="house3d-gl"
      orthographic
      frameloop="demand"
      resize={{ offsetSize: true }} // 카드가 기울며 들어오는 중(Swipe)에도 기울기 전 크기로 잰다
      dpr={[1, 2]}
      flat // 색 보정(톤 매핑) 없이 — 지붕 색이 SVG·나머지 화면과 같은 값으로 보이게
      shadows="soft"
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ near: 0.1, far: 200 }}
      style={{ pointerEvents: 'none' }} // 카드 넘기기(끌기)를 막지 않게
    >
      <hemisphereLight args={['#ffffff', '#e6e0d4', 2.3]} />
      {/* 해: 앞(+z) 왼쪽 위 → 앞면이 밝고 옆면이 어둡다(SVG 와 같은 음영). 그림자는 뒤쪽으로. */}
      <directionalLight
        position={[-5, 12, 9]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={12}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
      />
      <Scene {...props} />
    </Canvas>
  )
}
