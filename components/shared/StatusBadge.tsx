import type { TicketStatus } from '@/lib/types'
const C: Record<string, { label: string; bg: string; color: string; border: string }> = {
  new:            { label: 'Invoice Pending',  bg: 'var(--gold-l)',   color: 'var(--gold)',   border: '#F0D090' },
  invoiced:       { label: 'Invoice Sent',     bg: '#EEF2FF',         color: '#3730A3',       border: '#A5B4FC' },
  paid:           { label: 'Assign Supervisor',bg: 'var(--teal-l)',   color: 'var(--teal)',   border: '#9FD8C4' },
  scheduled:      { label: 'Supervisor Assigned',bg:'var(--coral-l)', color: 'var(--coral)',  border: '#F0B4A0' },
  visited:        { label: 'Quote Pending',    bg: 'var(--blue-l)',   color: 'var(--blue)',   border: '#90B8E8' },
  parts_invoiced: { label: 'Parts Invoice',    bg: '#F0EFFE',         color: 'var(--purple)', border: '#C4B5FD' },
  parts_paid:     { label: 'Assign Installer', bg: 'var(--teal-l)',   color: 'var(--teal)',   border: '#9FD8C4' },
  closed:         { label: 'Closed ✓',         bg: '#F0FAF6',         color: '#15803D',       border: '#86EFAC' },
}
export default function StatusBadge({ status }: { status: TicketStatus }) {
  const c = C[status] ?? { label: status, bg: 'var(--bg)', color: 'var(--muted)', border: 'var(--border)' }
  return (
    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '.02em' }}>
      {c.label}
    </span>
  )
}
