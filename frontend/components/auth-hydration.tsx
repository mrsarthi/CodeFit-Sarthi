'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'

interface AuthHydrationProps {
  children: React.ReactNode
}

export function AuthHydration({ children }: AuthHydrationProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const authStore = useAuthStore()

  useEffect(() => {
    // Wait for the auth store to be hydrated
    const checkHydration = () => {
      if (authStore.isHydrated) {
        setIsHydrated(true)
      } else {
        // Check again after a short delay
        setTimeout(checkHydration, 50)
      }
    }

    checkHydration()
  }, [authStore.isHydrated])

  // Show loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
