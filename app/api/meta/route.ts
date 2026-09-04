import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(){
  try{
    const sb=supabaseAdmin()
    const [v,u,l,p]=await Promise.all([
      sb.from('vehicles').select('id,plate,vehicle_type,model,region').eq('active',true).order('plate'),
      sb.from('app_users').select('id,name').eq('active',true).order('name'),
      sb.from('locations').select('id,name').eq('active',true).order('name'),
      sb.from('purposes').select('id,label').eq('active',true).order('id')
    ])
    const err=v.error||u.error||l.error||p.error
    if(err) throw err
    return NextResponse.json({vehicles:v.data||[],users:u.data||[],locations:l.data||[],purposes:p.data||[]})
  }catch(e:any){return NextResponse.json({error:e.message||'載入失敗'},{status:500})}
}
