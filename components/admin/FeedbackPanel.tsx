import type { Ticket } from '@/lib/types'
function Stars({ n }: { n:number|null }) {
  if (!n) return <span style={{ color:'#E5E7EB', fontSize:13 }}>Not rated</span>
  return <span style={{ fontSize:16 }}>{'★'.repeat(n)}<span style={{ color:'#E5E7EB' }}>{'★'.repeat(5-n)}</span></span>
}
export default function FeedbackPanel({ tickets }: { tickets: Ticket[] }) {
  const withFb = tickets.filter(t=>t.feedback?.submitted_at)
  if (!withFb.length) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:48, color:'#D1D5DB', textAlign:'center' }}>
      <div style={{ fontSize:40, marginBottom:10 }}>⭐</div>
      <div style={{ fontSize:14, fontWeight:600, color:'#9CA3AF' }}>No feedback yet</div>
    </div>
  )
  const avg = (withFb.reduce((s,t)=>s+(t.feedback?.overall_rating??0),0)/withFb.length).toFixed(1)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ background:'linear-gradient(135deg,#0A5C48,#0D7A60)', borderRadius:14, padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', color:'white' }}>
        <div><div style={{ fontSize:32, fontWeight:800 }}>{avg} <span style={{ color:'#FCD34D', fontSize:24 }}>★</span></div><div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:2 }}>Average Rating</div></div>
        <div style={{ textAlign:'right' }}><div style={{ fontSize:28, fontWeight:800 }}>{withFb.length}</div><div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:2 }}>Responses</div></div>
      </div>
      {withFb.map(t => { const fb=t.feedback!; return (
        <div key={t.id} style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div><div style={{ fontSize:13.5, fontWeight:700, color:'#111827' }}>{t.client_name}</div><div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{t.ticket_number} · {new Date(fb.submitted_at!).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div></div>
            <div style={{ textAlign:'right' }}><div style={{ color:'#FBBF24', fontSize:16 }}>{'★'.repeat(fb.overall_rating??0)}<span style={{ color:'#F3F4F6' }}>{'★'.repeat(5-(fb.overall_rating??0))}</span></div><div style={{ fontSize:11, color:'#9CA3AF' }}>{fb.overall_rating}/5</div></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
            {[{l:'Service',v:fb.quality_rating},{l:'Technician',v:fb.supervisor_rating},{l:'Timeliness',v:fb.timeliness_rating}].map(item=>(
              <div key={item.l} style={{ background:'#F9FAFB', border:'1px solid #F3F4F6', borderRadius:9, padding:'7px 10px', textAlign:'center' }}>
                <div style={{ fontSize:10, color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{item.l}</div>
                <Stars n={item.v??null}/>
              </div>
            ))}
          </div>
          {fb.comment && <div style={{ background:'#F9FAFB', border:'1px solid #F3F4F6', borderRadius:9, padding:'10px 13px', fontSize:13, color:'#374151', fontStyle:'italic', lineHeight:1.55 }}>"{fb.comment}"</div>}
        </div>
      )})}
    </div>
  )
}
