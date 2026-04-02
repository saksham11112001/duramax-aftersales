'use client'
export interface SparePart { article_name:string; article_number:string; quantity:number; unit_price:string|number; remarks:string }
const empty = (): SparePart => ({article_name:'',article_number:'',quantity:1,unit_price:'',remarks:''})
const cellS: React.CSSProperties = { width:'100%', fontSize:12, padding:'7px 9px', border:'1px solid #E5E7EB', borderRadius:8, background:'#F9FAFB', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }
export default function SparePartsTable({ parts, onChange }: { parts:SparePart[]; onChange:(p:SparePart[])=>void }) {
  const upd = (i:number, k:keyof SparePart, v:string|number) => onChange(parts.map((p,idx)=>idx===i?{...p,[k]:v}:p))
  return (
    <div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'2px solid #F3F4F6' }}>
              {['#','Article Name','Art. No.','Qty','Unit ₹','Remarks',''].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'0 8px 8px 0', fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parts.map((p,i)=>(
              <tr key={i} style={{ borderBottom:'1px solid #F9FAFB' }}>
                <td style={{ padding:'5px 8px 5px 0', color:'#9CA3AF', fontWeight:700 }}>{i+1}</td>
                <td style={{ padding:'5px 8px 5px 0', minWidth:110 }}><input style={cellS} placeholder="Weather Strip" value={p.article_name} onChange={e=>upd(i,'article_name',e.target.value)}/></td>
                <td style={{ padding:'5px 8px 5px 0', width:80 }}><input style={cellS} placeholder="WS-75" value={p.article_number} onChange={e=>upd(i,'article_number',e.target.value)}/></td>
                <td style={{ padding:'5px 8px 5px 0', width:55 }}><input style={cellS} type="number" min={1} placeholder="1" value={p.quantity} onChange={e=>upd(i,'quantity',Number(e.target.value))}/></td>
                <td style={{ padding:'5px 8px 5px 0', width:75 }}><input style={cellS} type="number" min={0} placeholder="400" value={p.unit_price} onChange={e=>upd(i,'unit_price',e.target.value)}/></td>
                <td style={{ padding:'5px 8px 5px 0', minWidth:90 }}><input style={cellS} placeholder="Optional" value={p.remarks} onChange={e=>upd(i,'remarks',e.target.value)}/></td>
                <td style={{ padding:'5px 0 5px 0' }}><button onClick={()=>onChange(parts.filter((_,idx)=>idx!==i))} style={{ background:'none', border:'none', color:'#CBD5E1', cursor:'pointer', fontSize:18, lineHeight:1, padding:'0 4px', fontWeight:300 }}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={()=>onChange([...parts,empty()])} style={{ marginTop:10, background:'none', border:'none', color:'#0A5C48', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4, padding:0 }}>+ Add Part</button>
    </div>
  )
}
