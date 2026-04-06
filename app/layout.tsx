import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'Duromax — After-Sales Portal',
  description: 'Service management for Duromax UPVC',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
