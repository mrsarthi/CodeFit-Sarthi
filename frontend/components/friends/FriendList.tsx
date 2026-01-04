'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { UserPlus, Check, X, Circle, Users } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { getSocket } from '@/lib/socket'

interface Friend {
  id: string
  email: string
  firstName: string
  lastName: string
}

interface FriendRequest {
  id: string
  sender: Friend
  receiver: Friend
  status: string
}

export function FriendList() {
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'JOB_SEEKER') return

    fetchFriends()
    fetchRequests()

    // Setup socket for presence
    if (accessToken) {
      const socket = getSocket(accessToken)

      socket.on('friend:online', (data: any) => {
        setOnlineFriends((prev) => new Set(prev).add(data.userId))
      })

      socket.on('friend:offline', (data: any) => {
        setOnlineFriends((prev) => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      })

      return () => {
        socket.off('friend:online')
        socket.off('friend:offline')
      }
    }
  }, [user, accessToken])

  const fetchFriends = async () => {
    try {
      const response = await api.get('/friends')
      setFriends(response.data)
    } catch (error) {
      console.error('Failed to fetch friends:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    try {
      const response = await api.get('/friends/requests')
      setRequests(response.data)
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.patch(`/friends/request/${requestId}/accept`)
      fetchFriends()
      fetchRequests()
    } catch (error) {
      console.error('Failed to accept request:', error)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.patch(`/friends/request/${requestId}/reject`)
      fetchRequests()
    } catch (error) {
      console.error('Failed to reject request:', error)
    }
  }

  if (user?.role !== 'JOB_SEEKER') {
    return null
  }

  const pendingRequests = requests.filter(
    (req) => req.status === 'PENDING' && req.receiver.id === user.id
  )

  return (
    <div className="space-y-8">
      {/* Friend Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-yellow-500/25">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            Friend Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="group bg-gradient-to-r from-yellow-950/30 to-orange-950/30 border border-yellow-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-yellow-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/25">
                      <span className="text-white font-bold text-lg">
                        {request.sender.firstName.charAt(0)}{request.sender.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white group-hover:text-yellow-100 transition-colors duration-300">
                        {request.sender.firstName} {request.sender.lastName}
                      </h4>
                      <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">{request.sender.email}</p>
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
                        <span className="text-xs text-yellow-400">Friend Request</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg shadow-green-500/25 rounded-lg px-6 py-2 transform hover:scale-105 transition-all duration-200"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 rounded-lg px-6 py-2 transform hover:scale-105 transition-all duration-200"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-500/25">
            <Users className="w-4 h-4 text-white" />
          </div>
          Your Friends ({friends.length})
        </h3>

        {loading ? (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-300">Loading your network...</p>
          </div>
        ) : friends.length === 0 ? (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center backdrop-blur-sm">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No friends yet</h3>
            <p className="text-slate-400">Start connecting with developers above!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="group bg-gradient-to-br from-blue-950/30 to-cyan-950/30 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-lg">
                        {friend.firstName.charAt(0)}{friend.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${
                      onlineFriends.has(friend.id)
                        ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse'
                        : 'bg-slate-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white group-hover:text-blue-100 transition-colors duration-300">
                      {friend.firstName} {friend.lastName}
                    </h4>
                    <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300 text-sm">{friend.email}</p>
                    <div className="flex items-center mt-1">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        onlineFriends.has(friend.id) ? 'bg-green-400 animate-pulse' : 'bg-slate-500'
                      }`} />
                      <span className={`text-xs ${
                        onlineFriends.has(friend.id) ? 'text-green-400' : 'text-slate-500'
                      }`}>
                        {onlineFriends.has(friend.id) ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

