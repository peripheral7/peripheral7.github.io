import { useEffect, useState } from 'react'
import { t } from '../i18n'
import { isNarrow } from '../mobile'

// 휴대폰으로 처음 열면 "PC 화면에 맞춘 페이지" 안내를 잠깐 띄운다 — 4초 뒤 저절로 사라지고 ×로 바로 닫을 수 있다.
// 같은 탭(브라우저 세션)에서는 한 번만(sessionStorage).
const KEY = 'locCompare.mobileNotice'
const SHOW_MS = 4000

// 페이지를 열 때 한 번만 정한다(StrictMode 가 useState 초기화를 두 번 불러도 결과가 같게)
const FIRST = (() => {
  if (!isNarrow()) return false
  try { if (sessionStorage.getItem(KEY)) return false; sessionStorage.setItem(KEY, '1') } catch { /* 저장 못 하면 매번 보임 */ }
  return true
})()

export function MobileNotice() {
  const [on, setOn] = useState(FIRST)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (!on) return
    const a = window.setTimeout(() => setLeaving(true), SHOW_MS)
    const b = window.setTimeout(() => setOn(false), SHOW_MS + 400)
    return () => { window.clearTimeout(a); window.clearTimeout(b) }
  }, [on])
  if (!on) return null
  return (
    <div className={'mobile-notice' + (leaving ? ' leaving' : '')} role="status">
      <span aria-hidden>🖥️</span>
      <p>{t('PC 웹 화면에 맞춰 만든 페이지예요. 큰 화면에서 더 보기 편해요.', 'This page is designed for desktop. It is easier to use on a larger screen.')}</p>
      <button type="button" aria-label={t('닫기', 'Close')} onClick={() => setOn(false)}>×</button>
    </div>
  )
}
