import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthHydration } from '@/components/auth-hydration'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CodeFit - Technical Interview Platform',
  description: 'Professional technical interview platform with real-time collaboration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthHydration>
          {children}
        </AuthHydration>
      </body>
    </html>
  )
}

