'use client'

import { Navbar } from '@/components/layout/navbar'
import { useActivityTracker } from '@/hooks/useActivityTracker'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useActivityTracker()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
