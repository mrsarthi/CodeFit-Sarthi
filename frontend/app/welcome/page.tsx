'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store'
import {
  Video,
  Code,
  PenTool,
  Users,
  Zap,
  Calendar,
  Settings,
  BarChart3,
  ArrowRight,
  Sparkles,
  Play,
  UserPlus,
  Briefcase,
  Target,
  Trophy,
  Star
} from 'lucide-react'

export default function WelcomePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  const quickActions = [
    {
      title: 'Start Interview',
      description: 'Begin a new technical interview session',
      icon: Video,
      href: '/dashboard/create-interview',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-950/50 to-cyan-950/30',
      shadowColor: 'shadow-blue-500/25'
    },
    {
      title: 'Join Interview',
      description: 'Enter an existing interview room',
      icon: Play,
      href: '/dashboard',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-950/50 to-emerald-950/30',
      shadowColor: 'shadow-green-500/25'
    },
    {
      title: 'My Interviews',
      description: 'View your scheduled interviews',
      icon: Calendar,
      href: '/dashboard',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-950/50 to-pink-950/30',
      shadowColor: 'shadow-purple-500/25'
    },
    {
      title: 'Find Partners',
      description: 'Connect with other developers',
      icon: UserPlus,
      href: '/dashboard/friends',
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-950/50 to-red-950/30',
      shadowColor: 'shadow-orange-500/25'
    }
  ]

  const features = [
    {
      icon: Code,
      title: 'Real-time Coding',
      description: 'Collaborative code editor with live synchronization',
      stats: '500+ problems solved'
    },
    {
      icon: Video,
      title: 'HD Video Calls',
      description: 'Crystal-clear video with WebRTC technology',
      stats: '10K+ interviews conducted'
    },
    {
      icon: PenTool,
      title: 'Smart Whiteboard',
      description: 'Interactive drawing tools for visual explanations',
      stats: '1000+ diagrams created'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Multi-user sessions with role-based access',
      stats: '500+ active users'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/5 to-cyan-900/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.1),transparent_70%)]" />

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce opacity-60 shadow-lg shadow-blue-400/50" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-40 shadow-lg shadow-purple-400/50" />
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-cyan-400 rounded-full animate-bounce opacity-50 shadow-lg shadow-cyan-400/50" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce opacity-70 shadow-lg shadow-pink-400/50" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  CodeFit
                </span>
                <div className="text-xs text-slate-400">Welcome back!</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Welcome, {user.firstName}!</span>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full mb-8 backdrop-blur-sm">
              <Star className="w-5 h-5 text-yellow-400 mr-3 animate-pulse" />
              <span className="text-slate-300 font-medium">Welcome to your CodeFit dashboard!</span>
              <Sparkles className="w-5 h-5 text-blue-400 ml-3 animate-bounce" />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                Ready to Interview?
              </span>
            </h1>

            <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Choose your next action and dive into the world of collaborative technical interviews.
              Everything you need is just one click away.
            </p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {quickActions.map((action, index) => (
              <Link key={action.title} href={action.href}>
                <Card className={`group relative bg-gradient-to-br ${action.bgColor} border-slate-700/50 backdrop-blur-xl hover:border-slate-600/50 transition-all duration-500 hover:shadow-2xl ${action.shadowColor} hover:shadow-2xl hover:-translate-y-2 overflow-hidden cursor-pointer h-full`}>
                  {/* Animated border */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.color.replace('500', '500/20')} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg`} />

                  {/* Floating particles */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-white/20 rounded-full opacity-0 group-hover:opacity-60 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute bottom-4 left-4 w-1 h-1 bg-white/20 rounded-full opacity-0 group-hover:opacity-40 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />

                  <CardContent className="p-6 relative z-10 flex flex-col items-center text-center h-full">
                    <div className={`w-16 h-16 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg ${action.shadowColor}`}>
                      <action.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors duration-300">{action.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4 group-hover:text-slate-300 transition-colors duration-300">{action.description}</p>
                    <div className="mt-auto flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors duration-300">
                      <span>Get started</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Stats Overview */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-xl mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Your Interview Journey</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-white">12</div>
                <div className="text-sm text-slate-400">Interviews Completed</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-white">8</div>
                <div className="text-sm text-slate-400">Successful Hires</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-white">95%</div>
                <div className="text-sm text-slate-400">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-white">24</div>
                <div className="text-sm text-slate-400">Active Connections</div>
              </div>
            </div>
          </div>

          {/* Feature Showcase */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Why Choose CodeFit?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div key={feature.title} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-600/50 transition-colors duration-300">
                    <feature.icon className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm mb-3">{feature.description}</p>
                  <div className="text-xs text-slate-500 font-medium">{feature.stats}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-12 backdrop-blur-xl">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Your Next Interview?
            </h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who trust CodeFit for their most important technical interviews.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/create-interview">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-xl shadow-blue-500/25 rounded-xl px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-200">
                  <Zap className="w-5 h-5 mr-2" />
                  Create New Interview
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl px-8 py-4 text-lg backdrop-blur-sm">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
