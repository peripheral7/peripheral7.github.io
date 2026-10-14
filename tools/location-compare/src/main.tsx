import React from 'react'
import ReactDOM from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './styles.css'
import App from './App'
import { installNumberGuard } from './numberGuard'

installNumberGuard()

// Pinterest 확장의 "저장" 단추: index.html 의 nopin 메타에 더해, 지도 엔진(네이버·Leaflet)이 만드는 타일·마커 이미지에도 data-pin-nopin 을 붙인다
const nopin = (el: Element) => { if (el instanceof HTMLImageElement) el.setAttribute('data-pin-nopin', 'true'); el.querySelectorAll?.('img:not([data-pin-nopin])').forEach((i) => i.setAttribute('data-pin-nopin', 'true')) }
new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n instanceof Element && nopin(n)))).observe(document.documentElement, { childList: true, subtree: true })

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
