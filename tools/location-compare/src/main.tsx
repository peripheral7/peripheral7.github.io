import React from 'react'
import ReactDOM from 'react-dom/client'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import './vibe-design/index.css'
import 'leaflet/dist/leaflet.css'
import App from './App'
// 번들러(Vite)로 묶으면 Leaflet 이 기본 핀 그림의 경로를 못 찾아 깨진 그림이 뜬다 → 묶인 그림 파일을 직접 알려 준다.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow })
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
