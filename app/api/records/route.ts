import {NextRequest,NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase-admin'

async function locationName(sb:any,id:string|null,custom:string|undefined){if(custom?.trim())return custom.trim();if(!id)return '';const {data}=await sb.from('locations').select('name').eq('id',id).maybeSingle();return data?.name||''}

export async function POST(req:NextRequest){
  try{
    const b=await req.json();const sb=supabaseAdmin()
    const {data:v,error:ve}=await sb.from('vehicles').select('id').eq('plate',b.plate).eq('active',true).single();if(ve||!v)return NextResponse.json({error:'找不到車牌'},{status:400})
    let appUserId=b.user_id
    if(b.user_id==='__custom'){
      const name=String(b.custom_user_name||'').trim();if(!name)return NextResponse.json({error:'請輸入使用人姓名'},{status:400})
      const existing=await sb.from('app_users').select('id').eq('name',name).maybeSingle();if(existing.data?.id) appUserId=existing.data.id; else {const ins=await sb.from('app_users').insert({name,active:true}).select('id').single();if(ins.error)throw ins.error;appUserId=ins.data.id}
    }
    const startMileage=b.start_mileage===''||b.start_mileage==null?null:Number(b.start_mileage)
    const {data:record,error}=await sb.from('usage_records').insert({vehicle_id:v.id,app_user_id:appUserId,usage_date:b.usage_date,start_time:b.start_time,end_time:b.end_time,start_mileage:startMileage,end_mileage:Number(b.end_mileage),remarks:b.remarks||null,created_by:null}).select('id').single();if(error)throw error
    const stops:any[]=[]
    const add=async(seq:number,id:string,custom:string)=>{const name=await locationName(sb,id==='__custom'?null:id,custom);if(!name)throw new Error('行程地點不可空白');let locId=id&&id!=='__custom'?id:null;stops.push({usage_record_id:record.id,seq,location_id:locId,custom_location:locId?null:name})}
    await add(0,b.start_location_id,b.start_location_custom)
    for(let i=0;i<(b.stops||[]).length;i++){const s=b.stops[i];if(s.location_id||s.custom)await add(i+1,s.location_id,s.custom)}
    await add((b.stops||[]).filter((s:any)=>s.location_id||s.custom).length+1,b.end_location_id,b.end_location_custom)
    const st=await sb.from('trip_stops').insert(stops);if(st.error)throw st.error
    if(b.purpose_ids?.length){const pr=await sb.from('usage_record_purposes').insert(b.purpose_ids.map((id:number)=>({usage_record_id:record.id,purpose_id:id})));if(pr.error)throw pr.error}
    if(b.fuel_mileage!==''||b.fuel_cost!==''){const fr=await sb.from('fuel_records').insert({usage_record_id:record.id,fuel_mileage:b.fuel_mileage===''?null:Number(b.fuel_mileage),fuel_cost:b.fuel_cost===''?null:Number(b.fuel_cost)});if(fr.error)throw fr.error}
    return NextResponse.json({ok:true,id:record.id})
  }catch(e:any){return NextResponse.json({error:e.message||'儲存失敗'},{status:500})}
}

export async function GET(req:NextRequest){
  try{
    const sb=supabaseAdmin();const url=new URL(req.url);const plate=url.searchParams.get('plate')||'';const from=url.searchParams.get('from')||'';const to=url.searchParams.get('to')||''
    let q=sb.from('usage_records').select('id,vehicle_id,app_user_id,usage_date,start_time,end_time,start_mileage,end_mileage,remarks,vehicles!inner(plate),app_users(name),trip_stops(seq,location_id,custom_location,locations(name)),usage_record_purposes(purpose_id,purposes(label)),fuel_records(fuel_mileage,fuel_cost)').order('usage_date').order('start_time')
    if(plate)q=q.eq('vehicles.plate',plate);if(from)q=q.gte('usage_date',from);if(to)q=q.lte('usage_date',to)
    const {data,error}=await q;if(error)throw error
    const groups=new Map<string,any>()
    for(const x of data||[]){const key=`${x.vehicle_id}|${x.usage_date}`;let g=groups.get(key);if(!g){g={usage_date:x.usage_date,plate:(x.vehicles as any)?.plate||'',users:[],segments:[],start_time:x.start_time,end_time:x.end_time,start_mileage:x.start_mileage,end_mileage:x.end_mileage,purposes:new Set<string>(),fuel_mileages:[],fuel_cost:0,remarks:[]};groups.set(key,g)}
      g.users.push((x.app_users as any)?.name||'')
      if(x.start_time<g.start_time){g.start_time=x.start_time;g.start_mileage=x.start_mileage}else if(x.start_time===g.start_time&&g.start_mileage==null&&x.start_mileage!=null){g.start_mileage=x.start_mileage}
      if(x.end_time>g.end_time){g.end_time=x.end_time;g.end_mileage=x.end_mileage}else if(x.end_time===g.end_time){g.end_mileage=Math.max(Number(g.end_mileage||0),Number(x.end_mileage||0))}
      for(const p of (x.usage_record_purposes as any[])||[]){const label=(p.purposes as any)?.label;if(label)g.purposes.add(label)}
      for(const f of (x.fuel_records as any[])||[]){if(f.fuel_mileage!=null)g.fuel_mileages.push(f.fuel_mileage);g.fuel_cost+=Number(f.fuel_cost||0)}
      if(x.remarks)g.remarks.push(x.remarks)
      const route=((x.trip_stops as any[])||[]).sort((a,b)=>a.seq-b.seq).map(s=>s.custom_location||s.locations?.name||'').filter(Boolean)
      g.segments.push({time:x.start_time,route})
    }
    const rows=[...groups.values()].map(g=>({usage_date:g.usage_date,plate:g.plate,users:[...new Set(g.users.filter(Boolean))].join('、'),route:g.segments.sort((a:any,b:any)=>a.time.localeCompare(b.time)).flatMap((s:any,i:number)=>i===0?s.route:s.route.slice(s.route[0]===g.segments[i-1]?.route?.at(-1)?1:0)).filter(Boolean).join('→'),start_time:String(g.start_time).slice(0,5),end_time:String(g.end_time).slice(0,5),start_mileage:g.start_mileage??'',end_mileage:g.end_mileage??'',purposes:[...g.purposes].join('、'),fuel_mileages:g.fuel_mileages.join(' / '),fuel_cost:g.fuel_cost||'',remarks:g.remarks.join('；')}))
    return NextResponse.json({rows})
  }catch(e:any){return NextResponse.json({error:e.message||'查詢失敗'},{status:500})}
}
