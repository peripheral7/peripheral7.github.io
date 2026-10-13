// 지도 위에 뜨는 작은 창(우클릭 메뉴·등록 창)의 자리: 누른 점(x, y) 바로 옆, 지도(w × h) 안에.
// 오른쪽 아래가 기본 → 넘치면 오른쪽 위 → 왼쪽 위 → 왼쪽 아래. 넷 다 넘치면(창이 지도보다 크거나 가장자리) 지도 안으로 밀어 넣는다.
export type MapPoint = { x: number; y: number; w: number; h: number }

const M = 6 // 지도 가장자리 여백
const G = 4 // 누른 점과 창 사이

export function placeNear(at: MapPoint, W: number, H: number): { left: number; top: number } {
  const fits = (l: number, t: number) => l >= M && t >= M && l + W <= at.w - M && t + H <= at.h - M
  const tries: [number, number][] = [[at.x + G, at.y + G], [at.x + G, at.y - H - G], [at.x - W - G, at.y - H - G], [at.x - W - G, at.y + G]]
  const [l, t] = tries.find(([a, b]) => fits(a, b)) ?? tries[0]
  return { left: Math.max(M, Math.min(l, at.w - W - M)), top: Math.max(M, Math.min(t, at.h - H - M)) }
}
