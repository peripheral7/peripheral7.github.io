// 좁은 화면(휴대폰) 판단 — styles.css 의 @media (max-width: 760px) 와 같은 기준.
// 휴대폰에서는 3D 집을 아예 그리지 않는다(three 묶음도 안 받음), 지도에는 고른 후보지 설명 카드만, 상권 핀은 이모지만.
import { useEffect, useState } from 'react'

export const NARROW_QUERY = '(max-width: 760px)'
export const isNarrow = () => typeof matchMedia === 'function' && matchMedia(NARROW_QUERY).matches

/** 화면 폭이 바뀌면(회전 등) 다시 그린다 */
export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(isNarrow)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia(NARROW_QUERY)
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}
