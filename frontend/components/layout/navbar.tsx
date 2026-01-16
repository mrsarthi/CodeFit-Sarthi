'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store'
import { LogOut, User, Home } from 'lucide-react'

export function Navbar() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  return (
    <header className="border-b border-border/40 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/welcome" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CF</span>
              </div>
              <span className="text-xl font-semibold text-foreground">CodeFit</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/welcome">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-2"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href={`/dashboard/employee/${user?.id}`}>
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-muted rounded-md px-3 py-2 transition-colors">
                <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-foreground">{user?.firstName} {user?.lastName}</span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-2"
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

