// 교통평점 카드 원 안의 3D 집(R3F). TransportCard 가 React.lazy 로 불러온다 → three 는 이 묶음에만 들어가 첫 화면이 무거워지지 않는다.
// 정지 화면이라 frameloop="demand": 바뀔 때(후보지 넘김·크기 변화)만 다시 그린다.
// interactive = 집 크게 보기 창(HouseDetail): 끌어서 돌리기·휠로 확대(drei OrbitControls — 움직일 때만 다시 그리도록 알아서 invalidate 한다).
import { useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitImpl } from 'three-stdlib'
import * as THREE from 'three'
import type { House3DProps } from './spec'
import { BrickHouse, FlatHouse, Ground, Home, Officetel } from './models'
import { groundRadius, Options } from './options'

/** 카메라가 바라보는 방향(집 쪽에서 본 카메라 위치) — 왼쪽 앞 위, SVG 집과 같은 아이소메트릭 느낌 */
const VIEW = new THREE.Vector3(1, 0.8, 1).normalize()
const POP_S = 0.3 // 후보지 바뀔 때 커지는 시간(초)
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** 장면 전체: 모양을 그리고, 카메라를 모양에 맞추고, 후보지가 바뀌면 살짝 작았다 커진다 */
type ViewProps = House3DProps & { interactive?: boolean }

function Scene({ kind, roof, options, animKey, interactive }: ViewProps) {
  const r = groundRadius(options)
  const optKey = options.join()
  const outer = useRef<THREE.Group>(null) // 커지기 애니메이션용(크기만 바꾼다)
  const inner = useRef<THREE.Group>(null) // 화면 맞춤 기준
  const { camera, size, invalidate } = useThree()
  const controls = useThree((s) => s.controls) as OrbitImpl | null
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
    const center = new THREE.Vector3().addScaledVector(right, (x0 + x1) / 2).addScaledVector(up, (y0 + y1) / 2)
    camera.position.add(center)
    camera.zoom = Math.min(size.width / (x1 - x0), size.height / (y1 - y0)) * (interactive ? 0.86 : 0.96)
    camera.updateProjectionMatrix()
    // 돌리기 중심 = 화면 가운데 점, 확대는 맞춘 크기의 0.8~3배
    if (controls) {
      controls.target.copy(center)
      controls.minZoom = camera.zoom * 0.8
      controls.maxZoom = camera.zoom * 3
      controls.update()
    }
    o.scale.setScalar(keep)
    invalidate()
  }, [kind, optKey, size.width, size.height, camera, invalidate, controls, interactive])

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
        <Ground r={r} />
        {kind === 'officetel' ? <Officetel roof={roof} /> : kind === 'brick' ? <BrickHouse roof={roof} /> : kind === 'flat' ? <FlatHouse roof={roof} /> : <Home roof={roof} />}
        <Options options={options} r={r} />
      </group>
    </group>
  )
}

export default function House3DView(props: ViewProps) {
  const big = !!props.interactive
  return (
    <Canvas
      className="house3d-gl"
      orthographic
      frameloop="demand"
      resize={{ offsetSize: true }} // 카드가 기울며 들어오는 중(Swipe)에도 기울기 전 크기로 잰다
      dpr={[1, 2]}
      flat // 색 보정(톤 매핑) 없이 — 지붕 색이 SVG·나머지 화면과 같은 값으로 보이게
      shadows="soft"
      gl={{ alpha: true, antialias: true, powerPreference: big ? 'default' : 'low-power' }}
      camera={{ near: 0.1, far: 200 }}
      style={big ? { touchAction: 'none', cursor: 'grab' } : { pointerEvents: 'none' }} // 카드 안에서는 넘기기(끌기)를 막지 않게
    >
      <hemisphereLight args={['#ffffff', '#e6e0d4', 2.3]} />
      {/* 해: 앞(+z) 왼쪽 위 → 앞면이 밝고 옆면이 어둡다(SVG 와 같은 음영). 그림자는 뒤쪽으로. */}
      <directionalLight
        position={[-5, 12, 9]}
        intensity={2.2}
        castShadow
        shadow-mapSize={big ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={14}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      {/* 땅 밑·바로 위로는 못 돌게(0.2~1.35 rad), 옆으로 끌기(이동)는 끔, 휠은 마우스가 가리킨 곳으로 확대(고양이·카페 같은 작은 장식 보기) */}
      {big && <OrbitControls makeDefault zoomToCursor enablePan={false} enableDamping dampingFactor={0.12} minPolarAngle={0.2} maxPolarAngle={1.35} />}
      <Scene {...props} />
    </Canvas>
  )
}
