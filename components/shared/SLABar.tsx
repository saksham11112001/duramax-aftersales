interface Props { allocatedAt: string; deadline: string; label?: string }
export default function SLABar({ allocatedAt, deadline, label = 'SLA' }: Props) {
  const pct   = Math.min(100, Math.max(0, ((Date.now() - new Date(allocatedAt).getTime()) / (new Date(deadline).getTime() - new Date(allocatedAt).getTime())) * 100))
  const left  = Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60)))
  const color = pct < 50 ? 'var(--teal-m)' : pct < 80 ? 'var(--gold-m)' : 'var(--coral)'
  const text  = pct >= 100 ? '⚠️ Breached' : `${left}h remaining`
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '9px 12px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 5 }}>
        <span>{label}</span><span style={{ color: pct >= 80 ? 'var(--coral)' : 'var(--muted)' }}>{text}</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 10, transition: 'width .3s' }}/>
      </div>
    </div>
  )
}
