'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import { UserPlus, Search, Users, Heart, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { FriendList } from '@/components/friends/FriendList'

export default function FriendsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.role !== 'JOB_SEEKER') {
      router.push('/dashboard')
    }
  }, [user])

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/users/search?q=${query}`)
      const filtered = response.data.filter(
        (u: any) => u.role === 'JOB_SEEKER' && u.id !== user?.id
      )
      setSearchResults(filtered)
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async (receiverId: string) => {
    try {
      await api.post(`/friends/request/${receiverId}`)
      setSearchResults((prev) => prev.filter((u) => u.id !== receiverId))
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send friend request')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-900/10 via-purple-900/5 to-cyan-900/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.1),transparent_70%)]" />

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-pink-400 rounded-full animate-bounce opacity-60 shadow-lg shadow-pink-400/50" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-40 shadow-lg shadow-purple-400/50" />
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-cyan-400 rounded-full animate-bounce opacity-50 shadow-lg shadow-cyan-400/50" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce opacity-70 shadow-lg shadow-fuchsia-400/50" />

        {/* Additional particle effects */}
        <div className="absolute top-1/6 right-1/6 w-1 h-1 bg-rose-400 rounded-full animate-ping opacity-30" style={{ animationDuration: '2s' }} />
        <div className="absolute bottom-1/3 right-1/6 w-2.5 h-2.5 bg-violet-400 rounded-full animate-pulse opacity-40" style={{ animationDuration: '4s' }} />
        <div className="absolute top-2/3 left-1/6 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-spin opacity-50" style={{ animationDuration: '6s' }} />
      </div>

      {/* Breadcrumb Header */}
      <div className="bg-slate-900/50 border-b border-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <Link href="/welcome" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-300">Find Friends</span>
          </div>
        </div>
      </div>

      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-full mb-8 backdrop-blur-sm">
              <Heart className="w-5 h-5 text-pink-400 mr-3 animate-pulse" />
              <span className="text-slate-300 font-medium">Connect with fellow developers</span>
              <Users className="w-5 h-5 text-purple-400 ml-3 animate-bounce" />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-pink-100 to-purple-200 bg-clip-text text-transparent">
                Find Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                Coding Community
              </span>
            </h1>

            <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect with talented developers, build lasting friendships, and collaborate on amazing projects together.
            </p>
          </div>

          {/* Search Section */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-xl shadow-2xl mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-3">Discover New Connections</h2>
              <p className="text-slate-400">Search for job seekers and expand your network</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div className="space-y-3">
                <Label htmlFor="search" className="text-sm font-medium text-white">
                  Search for developers
                </Label>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      searchUsers(e.target.value)
                    }}
                    className="w-full px-6 py-4 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-lg"
                  />
                  <Button
                    type="button"
                    onClick={() => searchUsers(searchQuery)}
                    className="absolute right-2 top-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/25 rounded-lg px-6 py-2 transform hover:scale-105 transition-all duration-200"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-3 text-slate-400">
                    <div className="w-6 h-6 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
                    <span>Finding amazing developers...</span>
                  </div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white text-center">Search Results</h3>
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="group bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:bg-slate-800/50 hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/25">
                            <span className="text-white font-bold text-lg">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-white group-hover:text-pink-100 transition-colors duration-300">
                              {user.firstName} {user.lastName}
                            </h4>
                            <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">{user.email}</p>
                            <div className="flex items-center mt-1">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                              <span className="text-xs text-green-400">Job Seeker</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(user.id)}
                          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/25 rounded-lg px-6 py-2 transform hover:scale-105 transition-all duration-200"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
                <div className="text-center py-12 bg-slate-800/20 border border-slate-700/30 rounded-xl">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300 mb-2">No developers found</h3>
                  <p className="text-slate-400">Try searching with a different name or email</p>
                </div>
              )}
            </div>
          </div>

          {/* Friend List Section */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-3">Your Network</h2>
              <p className="text-slate-400">Manage your connections and friend requests</p>
            </div>
            <FriendList />
          </div>
        </div>
      </main>
    </div>
  )
}

