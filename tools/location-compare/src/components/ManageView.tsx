import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import type { Home } from '../types'
type Draft = Omit<Home, 'id'|'overall'>
type Props = { homes:Home[]; onBack:()=>void; onSave:(home:Draft,id?:number)=>Promise<void>; onDelete:(id:number)=>Promise<void>; compact?:boolean }
type Place = { name:string; address:string; lat:number; lng:number; note:string }
type PostcodeData = { address:string; roadAddress:string; jibunAddress:string; zonecode:string }
declare global { interface Window { daum?: { Postcode: new (options:{ oncomplete:(data:PostcodeData)=>void }) => { open:()=>void } } } }
// 주소 검색(카카오 우편번호 서비스)은 "주소 검색" 단추를 눌렀을 때만 불러온다 — 페이지를 열기만 해서는 외부 스크립트를 부르지 않는다.
const POSTCODE_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
let postcodeLoading: Promise<void> | null = null
const loadPostcode = (): Promise<void> => window.daum?.Postcode ? Promise.resolve() : (postcodeLoading ??= new Promise<void>((resolve, reject) => {
  const script = document.createElement('script')
  script.src = POSTCODE_SRC
  script.async = true
  script.onload = () => resolve()
  script.onerror = () => { postcodeLoading = null; script.remove(); reject(new Error('postcode')) }
  document.head.appendChild(script)
}))
const places:Place[] = [
  { name:'망포역 인근', address:'경기도 수원시 영통구 영통로 195', lat:37.2457, lng:127.0569, note:'망포역 생활권 중심' },
  { name:'영통역 인근', address:'경기도 수원시 영통구 봉영로 1569', lat:37.2519, lng:127.0710, note:'분당선 영통역 생활권' },
  { name:'경희대학교 국제캠퍼스', address:'경기도 용인시 기흥구 덕영대로 1732', lat:37.2421, lng:127.0804, note:'학교 거점' },
  { name:'성남 주거권', address:'경기도 성남시 분당구 성남대로', lat:37.3850, lng:127.1230, note:'본가 위치 참고용' },
]
const blank:Draft={name:'망포역 인근 주거 후보',address:'경기도 수원시 영통구 영통로 195',lat:37.2457,lng:127.0569,transport:89,commerce:86,park:78,public:84,transport_reason:'망포역 생활권을 중심으로 분당선과 광역버스 접근성을 반영했습니다.',commerce_reason:'2km 이내 영통 중심 상권과 생활 편의시설 접근성을 반영했습니다.',park_reason:'망포공원 및 인근 산책 공간 접근성을 반영했습니다.',public_reason:'병원·주민센터·도서관 등 생활 기반 시설 접근성을 반영했습니다.',selected:true}
function MapClick({ onPick }:{onPick:(lat:number,lng:number)=>void}){useMapEvents({click(event){onPick(event.latlng.lat,event.latlng.lng)}});return null}
const scoreLine=(home:Home)=>`교통 ${home.transport} · 상권 ${home.commerce} · 공원 ${home.park} · 공공 ${home.public}`
export function ManageView({homes,onBack,onSave,onDelete,compact=false}:Props){
 const [edit,setEdit]=useState<Draft & {id?:number}>(blank);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [query,setQuery]=useState('망포역');const [center,setCenter]=useState<LatLngExpression>([blank.lat,blank.lng])
 const results=useMemo(()=>places.filter(place=>`${place.name} ${place.address}`.includes(query.trim())),[query])
 useEffect(()=>{if(edit.id)setCenter([edit.lat,edit.lng])},[edit.id])
 const applyPlace=(place:Place)=>{setEdit(current=>({...current,name:current.id?current.name:`${place.name} 주거 후보`,address:place.address,lat:place.lat,lng:place.lng}));setCenter([place.lat,place.lng]);setError('')}
 const pick=(lat:number,lng:number)=>{setEdit(current=>({...current,lat:Number(lat.toFixed(5)),lng:Number(lng.toFixed(5)),address:current.address.includes('지도에서')?`지도에서 선택한 위치 (${lat.toFixed(4)}, ${lng.toFixed(4)})`:current.address}));setCenter([lat,lng])}
 const openPostcode=()=>{new window.daum!.Postcode({oncomplete:data=>{const address=data.roadAddress||data.jibunAddress||data.address;setEdit(current=>({...current,address,name:current.id?current.name:(current.name||'주소 검색 후보지')}));setQuery(address);setError('주소가 반영되었습니다. 지도에서 위치를 클릭해 좌표를 정확히 지정해 주세요.')}}).open()}
 // 이미 불러와 있으면 클릭 즉시(팝업이 막히지 않게) 열고, 아니면 불러온 뒤 연다. 단추에 마우스를 올리거나 포커스를 주면 미리 불러 둔다.
 const searchAddress=()=>{if(window.daum?.Postcode){openPostcode();return}loadPostcode().then(openPostcode).catch(()=>setError('주소 검색 도구를 불러오지 못했습니다. 인터넷 연결을 확인하거나, 지도를 클릭해 위치를 지정해 주세요.'))}
 const preloadPostcode=()=>{loadPostcode().catch(()=>{})}
 const submit=async(event:React.FormEvent)=>{event.preventDefault();if(!edit.name.trim()||!edit.address.trim()){setError('지도에서 위치를 고른 뒤 후보명과 주소를 확인해 주세요.');return}setBusy(true);setError('');try{await onSave(edit,edit.id);setEdit(blank);setCenter([blank.lat,blank.lng])}catch{setError('저장 중 문제가 발생했습니다. 다시 시도해 주세요.')}finally{setBusy(false)}}
 const editHome=(home:Home)=>{setEdit(home);setCenter([home.lat,home.lng])}
 const reset=()=>{setEdit(blank);setCenter([blank.lat,blank.lng]);setError('')}
 const workspace=<section className="candidate-workspace"><section className="candidate-map-panel"><div className="map-search"><label><span className="visually-hidden">추천 위치 검색</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="망포역, 영통역 등 위치 검색" /></label><button type="button" className="address-search-button" onClick={searchAddress} onMouseEnter={preloadPostcode} onFocus={preloadPostcode} onTouchStart={preloadPostcode}>주소 검색</button></div><div className="place-results">{results.length?results.map(place=><button key={place.name} onClick={()=>applyPlace(place)}><b>{place.name}</b><small>{place.address} · {place.note}</small></button>):<span>일치하는 추천 위치가 없습니다. 주소 검색 또는 지도 클릭으로 위치를 지정하세요.</span>}</div><MapContainer center={center} zoom={14} className="candidate-map" scrollWheelZoom={true} key={`${(center as number[])[0]}-${(center as number[])[1]}`}><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tiles.osm.kr/hot/{z}/{x}/{y}.png"/><MapClick onPick={pick}/><Marker position={[edit.lat,edit.lng] as LatLngExpression}><Popup><b>{edit.name||'새 후보지'}</b><br/>지도를 클릭해 위치를 바꿀 수 있습니다.</Popup></Marker>{homes.map(home=><Marker key={home.id} position={[home.lat,home.lng] as LatLngExpression}><Popup><b>{home.name}</b><br/>종합 {home.overall}점</Popup></Marker>)}</MapContainer><p className="map-help">주소 검색으로 도로명 주소를 입력한 뒤, 마우스 휠 확대·축소와 지도 클릭으로 후보지 위치를 지정하세요.</p></section><aside className="candidate-list-panel"><div className="section-head"><div><p className="eyebrow">SAVED CANDIDATES</p><h3>저장된 후보 <small>{homes.length}건</small></h3></div></div><div className="candidate-list">{homes.length===0?<div className="empty-state">저장된 후보가 없습니다.</div>:homes.map(home=><article key={home.id} className={edit.id===home.id?'active':''}><button className="candidate-card" onClick={()=>editHome(home)}><b>{home.name}</b><span>{home.address}</span><small>{scoreLine(home)}</small><strong className="tabular">종합 {home.overall}점</strong></button><button className="delete-button" onClick={()=>{if(confirm(`${home.name} 후보지를 삭제할까요?`))onDelete(home.id)}} aria-label={`${home.name} 삭제`}>×</button></article>)}</div></aside></section>
 const editor=<section className="map-editor-card"><form onSubmit={submit}><div className="section-head"><div><p className="eyebrow">{edit.id?'EDIT CANDIDATE':'NEW CANDIDATE'}</p><h3>{edit.id?'선택한 후보지 수정':'지도에서 선택한 후보지 저장'}</h3></div>{edit.id&&<button type="button" className="text-button" onClick={reset}>새 후보 입력</button>}</div>{error&&<p className="form-error">{error}</p>}<div className="editor-fields"><label>후보명<input value={edit.name} onChange={event=>setEdit({...edit,name:event.target.value})}/></label><label>주소<input value={edit.address} onChange={event=>setEdit({...edit,address:event.target.value})}/></label><label>위도<input type="number" step="0.00001" value={edit.lat} onChange={event=>setEdit({...edit,lat:Number(event.target.value)})}/></label><label>경도<input type="number" step="0.00001" value={edit.lng} onChange={event=>setEdit({...edit,lng:Number(event.target.value)})}/></label></div><div className="score-inputs">{(['transport','commerce','park','public'] as const).map(key=><label key={key}>{({transport:'교통',commerce:'상권',park:'공원',public:'공공·편의'}[key])}<input type="number" min="0" max="100" value={edit[key]} onChange={event=>setEdit({...edit,[key]:Number(event.target.value)})}/><small>점</small></label>)}</div><label className="check"><input type="checkbox" checked={edit.selected} onChange={event=>setEdit({...edit,selected:event.target.checked})}/> 비교 목록에 포함</label><button className="primary-button" disabled={busy}>{busy?'저장 중…':edit.id?'수정 내용 저장':'후보지 저장'}</button></form></section>
 if(compact)return <section className="candidate-map-section compact-candidate">{workspace}{editor}</section>
 return <main className="page manage-page"><div className="crumb"><button onClick={onBack}>‹ 비교 목록</button><span>/</span><span>후보지 지도 관리</span></div><section className="page-intro"><div><p className="eyebrow">CANDIDATE MAP / 03</p><h2>후보지 지도 관리</h2><p>주소 검색 또는 지도 클릭으로 후보지를 빠르게 저장합니다.</p></div><button className="primary-button" type="button" onClick={reset}>＋ 망포역 후보 추가</button></section>{workspace}{editor}</main>
}
