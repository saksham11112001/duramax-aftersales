import type { TicketStatus } from '@/lib/types'
const C: Record<TicketStatus, { label: string; bg: string; color: string; border: string }> = {
  new:            { label: 'New',             bg: '#FFFBEB', color: '#92400E', border: '#FCD34D' },
  invoiced:       { label: 'Invoice Sent',    bg: '#EEF2FF', color: '#3730A3', border: '#A5B4FC' },
  paid:           { label: 'Paid',            bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD' },
  scheduled:      { label: 'Scheduled',       bg: '#FFF7ED', color: '#C2410C', border: '#FDC68A' },
  visited:        { label: 'Visit Done',      bg: '#F0F9FF', color: '#0369A1', border: '#7DD3FC' },
  parts_invoiced: { label: 'Parts Invoice',   bg: '#F5F3FF', color: '#5B21B6', border: '#C4B5FD' },
  parts_paid:     { label: 'Parts Paid',      bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
  closed:         { label: 'Closed ✓',        bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
}
export default function StatusBadge({ status }: { status: TicketStatus }) {
  const c = C[status] ?? { label: status, bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' }
  return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>{c.label}</span>
}
