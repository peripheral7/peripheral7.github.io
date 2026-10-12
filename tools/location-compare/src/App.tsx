import { useCallback, useEffect, useState } from 'react'
import { api, canPersist, resetData } from './lib/api'
import type { Home, Hub } from './types'
import { CompareView } from './components/CompareView'
import { DetailView } from './components/DetailView'
import { ManageView } from './components/ManageView'
import { AccessView } from './components/AccessView'
import { HubManageView } from './components/HubManageView'
import './app.css'
type Page = 'compare'|'detail'|'manage'|'access'|'hubManage'
type HubRole = '본가'|'학교'|'직장'|'기타'|'교통·상업'
type HomeDraft = Omit<Home, 'id'|'overall'>
type HubDraft = Omit<Hub, 'id'>
export default function App(){
 const [homes,setHomes]=useState<Home[]>([]); const [hubs,setHubs]=useState<Hub[]>([]); const [page,setPage]=useState<Page>('compare'); const [hubRole,setHubRole]=useState<HubRole>('학교'); const [selected,setSelected]=useState<number|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState('')
 const loadHomes=useCallback(async()=>{try{const r=await api('homes');if(!r.ok)throw Error();setHomes(await r.json());setError('')}catch{setError('후보 주택 정보를 불러오지 못했습니다.')}},[])
 const loadHubs=useCallback(async()=>{try{const r=await api('hubs');if(!r.ok)throw Error();setHubs(await r.json())}catch{setError('주요 거점 정보를 불러오지 못했습니다.')}},[])
 const load=useCallback(async()=>{setLoading(true);await Promise.all([loadHomes(),loadHubs()]);setLoading(false)},[loadHomes,loadHubs])
 useEffect(()=>{load()},[load]); const chosen=homes.find(h=>h.id===selected)||homes.find(h=>h.selected)||homes[0]; const comparedHomes=homes.filter(h=>h.selected)
 const [persist]=useState(canPersist)
 const reset=()=>{if(!confirm('직접 입력한 후보·거점·선호도를 모두 지우고 예시 데이터로 되돌릴까요?'))return;resetData();setSelected(null);setPage('compare');load()}
 const open=(id:number)=>{setSelected(id);setPage('detail')}
 const save=async(data:HomeDraft,id?:number)=>{const r=await api(id?`homes/${id}`:'homes',{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw Error();await loadHomes()}
 const remove=async(id:number)=>{const r=await api(`homes/${id}`,{method:'DELETE'});if(!r.ok)throw Error();if(selected===id)setSelected(null);await loadHomes()}
 const saveHub=async(data:HubDraft,id?:number)=>{const r=await api(id?`hubs/${id}`:'hubs',{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw Error();await loadHubs()}
 const removeHub=async(id:number)=>{const r=await api(`hubs/${id}`,{method:'DELETE'});if(!r.ok)throw Error();await loadHubs()}
 return <div className="app-shell"><a className="back-bar" href="/">← BACK TO BOARD</a><header className="topbar"><div className="brand"><span className="brand-mark">L</span><div><h1>입지 비교 리포트</h1><span>RESIDENTIAL LOCATION INTELLIGENCE</span></div></div><nav><button className={page==='compare'||page==='detail'?'active':''} onClick={()=>setPage('compare')}>비교 목록</button><button className={page==='access'?'active':''} onClick={()=>setPage('access')}>교통 접근성</button><button className={page==='manage'||page==='hubManage'?'active':''} onClick={()=>setPage('manage')}>관리 설정</button></nav><div className="status"><i/> {persist?'이 브라우저에 저장됨':'저장 안 됨 (이 탭을 닫으면 사라집니다)'}</div></header><div className="content"><div className="notice"><span>ⓘ</span><b>분석 기준 안내</b><span>교통 시간은 외부 길찾기 없이 좌표 거리와 평균 속도를 반영한 가상 계산 결과입니다. 후보와 거점은 직접 추가·수정해 볼 수 있고, 입력한 내용은 이 브라우저에만 저장됩니다.</span></div>{loading?<div className="loading-state">분석 데이터를 불러오는 중입니다…</div>:error&&!homes.length?<div className="error-state">{error}<button onClick={load}>다시 시도</button></div>:page==='compare'?<CompareView homes={comparedHomes} hubs={hubs} selectedId={selected} onSelect={open} onManage={()=>setPage('manage')} onManageHubs={(role:HubRole='학교')=>{setHubRole(role);setPage('hubManage')}} onRefresh={load}/>:page==='detail'&&chosen?<DetailView home={chosen} onBack={()=>setPage('compare')} onOpen={open}/>:page==='access'?<AccessView homes={comparedHomes} hubs={hubs} onManageHubs={()=>{setHubRole('학교');setPage('hubManage')}} onManageHomes={()=>setPage('manage')} onPreferencesSaved={load}/>:page==='hubManage'?<HubManageView key={hubRole} hubs={hubs} onBack={()=>setPage('access')} onSave={saveHub} onDelete={removeHub} initialRole={hubRole}/>:<ManageView homes={homes} onBack={()=>setPage('compare')} onSave={save} onDelete={remove}/>}</div><footer><span>입지 비교 리포트</span><span>객관적 데이터 기반 주거 입지 분석</span><button className="reset-link" onClick={reset}>예시 데이터로 되돌리기</button></footer></div>
}
