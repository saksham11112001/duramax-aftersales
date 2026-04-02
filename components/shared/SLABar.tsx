interface Props { allocatedAt: string; deadline: string; label?: string }
export default function SLABar({ allocatedAt, deadline, label = 'SLA' }: Props) {
  const start = new Date(allocatedAt).getTime()
  const end   = new Date(deadline).getTime()
  const now   = Date.now()
  const pct   = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
  const left  = Math.max(0, Math.round((end - now) / (1000 * 60 * 60)))
  const color = pct < 50 ? '#10B981' : pct < 80 ? '#F59E0B' : '#EF4444'
  const text  = pct >= 100 ? '⚠️ SLA Breached' : `${left}h remaining`
  return (
    <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 14px', border: '1px solid #E2E8F0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 6, color: '#64748B' }}>
        <span>{label}</span>
        <span style={{ color: pct >= 80 ? '#EF4444' : '#64748B' }}>{text}</span>
      </div>
      <div style={{ height: 5, background: '#E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 10, transition: 'width 0.3s' }}/>
      </div>
    </div>
  )
}
