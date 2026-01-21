'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import { Calendar, Users, Video, Plus, UserPlus, Sparkles, Target, TrendingUp, Clock, CheckCircle, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { FriendList } from '@/components/friends/FriendList'

interface Interview {
  id: string
  title: string
  description?: string
  status: string
  scheduledAt?: string
  createdAt: string
  updatedAt: string
  participants: Array<{
    candidate?: { id: string; firstName: string; lastName: string }
    interviewer?: { id: string; firstName: string; lastName: string }
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  // Use a selector that returns both user and updateUser to avoid unnecessary re-renders
  const { user, updateUser } = useAuthStore((state) => ({
    user: state.user,
    updateUser: state.updateUser
  }))
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        // Always fetch latest user data to ensure role and other details are in sync
        const { data } = await api.get('/users/me')
        if (updateUser) {
          updateUser(data)
        }
      } catch (err) {
        console.error('Failed to sync user data:', err)
      }

      fetchInterviews()
    }

    init()
  }, [])

  const fetchInterviews = async () => {
    try {
      const response = await api.get('/interviews')
      setInterviews(response.data)
    } catch (error) {
      console.error('Failed to fetch interviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinInterview = (interviewId: string) => {
    router.push(`/interview/${interviewId}`)
  }

  const handleCompleteInterview = async (interviewId: string) => {
    try {
      await api.patch(`/interviews/${interviewId}/end`)
      fetchInterviews()
    } catch (error) {
      console.error('Failed to complete interview:', error)
    }
  }

  const handleDeleteInterview = async (interviewId: string) => {
    if (!confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      return
    }
    try {
      await api.delete(`/interviews/${interviewId}`)
      fetchInterviews()
    } catch (error) {
      console.error('Failed to delete interview:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-blue-900/5 to-cyan-900/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_70%)]" />

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-bounce opacity-60 shadow-lg shadow-indigo-400/50" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-bounce opacity-40 shadow-lg shadow-blue-400/50" />
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-cyan-400 rounded-full animate-bounce opacity-50 shadow-lg shadow-cyan-400/50" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce opacity-70 shadow-lg shadow-violet-400/50" />

        {/* Additional particle effects */}
        <div className="absolute top-1/6 right-1/6 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-30" style={{ animationDuration: '2s' }} />
        <div className="absolute bottom-1/3 right-1/6 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse opacity-40" style={{ animationDuration: '4s' }} />
        <div className="absolute top-2/3 left-1/6 w-1.5 h-1.5 bg-amber-400 rounded-full animate-spin opacity-50" style={{ animationDuration: '6s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <div className="text-slate-400 text-sm">Welcome back, {user?.firstName}! 👋</div>
                </div>
              </div>
              <p className="text-slate-400 mt-2">Manage your interviews and track your progress</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-300">All systems operational</span>
              </div>
              <div className="flex items-center space-x-3">
                {user?.role === 'INTERVIEWER' && (
                  <Link href="/dashboard/create-interview">
                    <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-xl shadow-indigo-500/25 rounded-xl px-6 py-3 font-semibold transform hover:scale-105 transition-all duration-200">
                      <Plus className="w-5 h-5 mr-2" />
                      New Interview
                    </Button>
                  </Link>
                )}
                {user?.role === 'JOB_SEEKER' && (
                  <Link href="/dashboard/friends">
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl px-6 py-3 backdrop-blur-sm transform hover:scale-105 transition-all duration-200">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Find Friends
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-indigo-950/50 to-indigo-900/30 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-xl hover:border-indigo-500/40 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300">
                  {interviews.filter(i => i.status === 'ACTIVE').length}
                </span>
              </div>
              <h3 className="text-white font-semibold mb-1">Active Interviews</h3>
              <p className="text-slate-400 text-sm">Currently in progress</p>
            </div>

            <div className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-xl hover:border-blue-500/40 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                  {interviews.filter(i => i.status === 'SCHEDULED').length}
                </span>
              </div>
              <h3 className="text-white font-semibold mb-1">Scheduled</h3>
              <p className="text-slate-400 text-sm">Upcoming interviews</p>
            </div>

            <div className="bg-gradient-to-br from-green-950/50 to-green-900/30 border border-green-500/20 rounded-2xl p-6 backdrop-blur-xl hover:border-green-500/40 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors duration-300">
                  {interviews.length}
                </span>
              </div>
              <h3 className="text-white font-semibold mb-1">Total Interviews</h3>
              <p className="text-slate-400 text-sm">All time interviews</p>
            </div>

            <div className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-purple-400 group-hover:text-purple-300 transition-colors duration-300">
                  98%
                </span>
              </div>
              <h3 className="text-white font-semibold mb-1">Success Rate</h3>
              <p className="text-slate-400 text-sm">Interview completions</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Video className="w-6 h-6 mr-3 text-indigo-400" />
                  Your Interviews
                </h2>
                {user?.role === 'INTERVIEWER' && interviews.length > 0 && (
                  <div className="text-sm text-slate-400">
                    {interviews.length} interview{interviews.length !== 1 ? 's' : ''} total
                  </div>
                )}
              </div>

              {interviews.length === 0 ? (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-16 text-center backdrop-blur-xl">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-slate-600/25">
                    <Calendar className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">No interviews yet</h3>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                    {user?.role === 'INTERVIEWER'
                      ? 'Create your first interview to start connecting with talented developers.'
                      : 'You don\'t have any scheduled interviews yet. Check back later!'
                    }
                  </p>
                  {user?.role === 'INTERVIEWER' && (
                    <Link href="/dashboard/create-interview">
                      <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-xl shadow-indigo-500/25 rounded-xl px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-200">
                        <Plus className="w-5 h-5 mr-3" />
                        Create Your First Interview
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {interviews.map((interview, index) => {
                    const otherParticipant = interview.participants.find(
                      (p) => p.candidate?.id !== user?.id && p.interviewer?.id !== user?.id
                    )?.candidate || interview.participants.find(
                      (p) => p.candidate?.id !== user?.id && p.interviewer?.id !== user?.id
                    )?.interviewer

                    return (
                      <div
                        key={interview.id}
                        className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-xl hover:border-slate-600/50 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-600/10 hover:-translate-y-1"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Animated border */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                        <div className="flex items-start justify-between relative z-10">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300">
                                <Video className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-indigo-100 transition-colors duration-300 mb-1">
                                  {interview.title}
                                </h3>
                                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${interview.status === 'ACTIVE'
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : interview.status === 'SCHEDULED'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                  }`}>
                                  {interview.status.toLowerCase()}
                                </span>
                              </div>
                            </div>

                            {interview.description && (
                              <p className="text-slate-400 leading-relaxed mb-4 group-hover:text-slate-300 transition-colors duration-300">
                                {interview.description}
                              </p>
                            )}

                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              {interview.scheduledAt && (
                                <div className="flex items-center space-x-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                                  <Calendar className="w-5 h-5 text-indigo-400" />
                                  <div>
                                    <div className="text-slate-300 font-medium">Scheduled</div>
                                    <div className="text-slate-400 text-xs">
                                      {format(new Date(interview.scheduledAt), 'MMM d, yyyy \'at\' h:mm a')}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {otherParticipant && (
                                <div className="flex items-center space-x-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                                  <Users className="w-5 h-5 text-blue-400" />
                                  <div>
                                    <div className="text-slate-300 font-medium">Participant</div>
                                    <div className="text-slate-400 text-xs">
                                      {otherParticipant.firstName} {otherParticipant.lastName}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ml-8">
                            {(interview.status === 'SCHEDULED' || interview.status === 'ACTIVE') && (
                              <Button
                                onClick={() => handleJoinInterview(interview.id)}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-xl shadow-green-500/25 rounded-xl px-6 py-4 font-semibold w-full transform hover:scale-105 transition-all duration-200 group-hover:shadow-green-500/40"
                              >
                                <Video className="w-5 h-5 mr-2" />
                                Join
                              </Button>
                            )}

                            <div className="flex flex-col gap-3 mt-3 w-full">
                              {interview.status === 'ACTIVE' && (
                                <Button
                                  onClick={() => handleCompleteInterview(interview.id)}
                                  className="bg-slate-700 hover:bg-slate-600 text-white border-0 rounded-xl px-6 py-4 font-semibold w-full transition-all duration-200"
                                >
                                  <CheckCircle className="w-5 h-5 mr-2" />
                                  Mark Completed
                                </Button>
                              )}

                              {user?.role === 'INTERVIEWER' && (
                                <Button
                                  onClick={() => handleDeleteInterview(interview.id)}
                                  variant="outline"
                                  className="border-red-900/50 text-red-400 hover:bg-red-950/50 hover:text-red-300 hover:border-red-800 rounded-xl px-6 py-4 font-semibold w-full transition-all duration-200"
                                >
                                  <Trash2 className="w-5 h-5 mr-2" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Completed Interviews Section */}
              {interviews.filter(i => i.status === 'COMPLETED').length > 0 && (
                <div className="mt-12 space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <CheckCircle className="w-6 h-6 mr-3 text-green-400" />
                    Completed Interviews
                  </h2>
                  <div className="grid gap-6">
                    {interviews.filter(i => i.status === 'COMPLETED').map((interview, index) => {
                      const otherParticipant = interview.participants.find(
                        (p) => p.candidate?.id !== user?.id && p.interviewer?.id !== user?.id
                      )?.candidate || interview.participants.find(
                        (p) => p.candidate?.id !== user?.id && p.interviewer?.id !== user?.id
                      )?.interviewer

                      return (
                        <div
                          key={interview.id}
                          className="group bg-gradient-to-br from-slate-900/50 to-slate-950/50 border border-slate-800/50 rounded-xl p-6 backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-slate-300 group-hover:text-white transition-colors">
                                {interview.title}
                              </h3>
                              <p className="text-slate-500 text-sm mb-3">
                                {format(new Date(interview.updatedAt || interview.createdAt), 'MMM d, yyyy')}
                              </p>
                              {otherParticipant && (
                                <div className="text-sm text-slate-400 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  with {otherParticipant.firstName} {otherParticipant.lastName}
                                </div>
                              )}
                            </div>

                            {user?.role === 'INTERVIEWER' && (
                              <Button
                                onClick={() => handleDeleteInterview(interview.id)}
                                variant="ghost"
                                size="sm"
                                className="text-slate-500 hover:text-red-400 hover:bg-red-950/30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {user?.role === 'INTERVIEWER' && (
              <div className="space-y-8">
                {/* Quick Actions for Interviewer */}
                <div className="bg-gradient-to-br from-indigo-950/50 to-indigo-900/30 border border-indigo-500/20 rounded-2xl p-8 backdrop-blur-xl">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Target className="w-6 h-6 mr-3 text-indigo-400" />
                    Quick Actions
                  </h3>
                  <div className="space-y-4">
                    <Link href="/dashboard/create-interview">
                      <div className="flex items-center space-x-3 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 cursor-pointer group">
                        <Plus className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-slate-300 group-hover:text-white transition-colors duration-200">Create New Interview</span>
                      </div>
                    </Link>
                    <Link href="/welcome">
                      <div className="flex items-center space-x-3 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 cursor-pointer group">
                        <Sparkles className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-slate-300 group-hover:text-white transition-colors duration-200">View Dashboard Home</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {user?.role === 'JOB_SEEKER' && (
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <Users className="w-6 h-6 mr-3 text-blue-400" />
                      Friends
                    </h3>
                    <Link href="/dashboard/friends">
                      <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg">
                        Manage
                      </Button>
                    </Link>
                  </div>
                  <FriendList />
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-xl">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Target className="w-6 h-6 mr-3 text-purple-400" />
                    Quick Actions
                  </h3>
                  <div className="space-y-4">
                    <Link href="/dashboard/friends">
                      <div className="flex items-center space-x-3 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 cursor-pointer group">
                        <UserPlus className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-slate-300 group-hover:text-white transition-colors duration-200">Find New Friends</span>
                      </div>
                    </Link>
                    <Link href="/welcome">
                      <div className="flex items-center space-x-3 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 cursor-pointer group">
                        <Sparkles className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-slate-300 group-hover:text-white transition-colors duration-200">View Dashboard Home</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
