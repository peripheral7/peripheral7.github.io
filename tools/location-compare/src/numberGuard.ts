// 숫자 입력 칸 공통 규칙: 앞자리 0 을 허용하지 않는다(040 → 40, 칸을 벗어날 때도 한 번 더 정리).
// 위아래 버튼(스핀 버튼)은 CSS 로 숨긴다. React 가 제어하는 칸에도 먹도록 입력 이벤트가 React 에 닿기 전(capture)에 값을 고친다.
const setNative = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!

const clean = (v: string) => v.replace(/^(-?)0+(?=\d)/, '$1')

function fix(el: HTMLInputElement) {
  const v = el.value
  const c = clean(v)
  if (c !== v) setNative.call(el, c) // React 의 값 추적을 거치지 않고 바꿔야 React 가 바뀐 값으로 onChange 를 부른다
}

export function installNumberGuard() {
  const isNum = (t: EventTarget | null): t is HTMLInputElement => t instanceof HTMLInputElement && t.type === 'number'
  document.addEventListener('input', (e) => { if (isNum(e.target)) fix(e.target) }, true)
  document.addEventListener('focusout', (e) => {
    if (!isNum(e.target)) return
    const before = e.target.value
    fix(e.target)
    if (e.target.value !== before) e.target.dispatchEvent(new Event('input', { bubbles: true }))
  }, true)
}
