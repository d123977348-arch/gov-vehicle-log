'use client'
import {useEffect,useState} from 'react'
import {useRouter} from 'next/navigation'
export default function Dashboard(){
  const [vehicles,setVehicles]=useState<any[]>([]);const [err,setErr]=useState('');const r=useRouter()
  useEffect(()=>{fetch('/api/meta').then(x=>x.json()).then(j=>{if(j.error)setErr(j.error);else setVehicles(j.vehicles||[])}).catch(()=>setErr('資料載入失敗'))},[])
  return <main className="container"><div className="toolbar"><div><h1>公務車使用紀錄</h1><p className="muted">免登入版｜選擇車牌開始填寫</p></div><div><button className="btn" onClick={()=>r.push('/dashboard/records')}>紀錄管理</button></div></div>{err&&<div className="notice error">{err}</div>}<div className="grid cards">{vehicles.map(v=><button key={v.id} className="card" style={{textAlign:'left',cursor:'pointer'}} onClick={()=>r.push(`/dashboard/vehicle/${encodeURIComponent(v.plate)}`)}><div className="plate">{v.plate}</div><div className="muted" style={{marginTop:8}}>{[v.model,v.region].filter(Boolean).join('｜')||'點擊進入'}</div></button>)}</div></main>
}
