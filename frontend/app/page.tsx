'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Video, Code, PenTool, Users, Zap, Shield, Star, ArrowRight, Github, Sparkles, MousePointer } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => setIsHovering(false)

    // Add event listeners to interactive elements
    const interactiveElements = document.querySelectorAll('button, a, [role="button"]')
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    })

    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Custom Cursor */}
      <div
        className={`fixed w-6 h-6 pointer-events-none z-50 transition-all duration-200 ${
          isHovering ? 'scale-150 bg-blue-400' : 'scale-100 bg-white/20'
        }`}
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
          borderRadius: isHovering ? '50%' : '25%',
          backdropFilter: 'blur(4px)',
        }}
      />
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-cyan-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.1),transparent_70%)]" />

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce opacity-60 shadow-lg shadow-blue-400/50" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-40 shadow-lg shadow-purple-400/50" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-cyan-400 rounded-full animate-bounce opacity-50 shadow-lg shadow-cyan-400/50" style={{ animationDelay: '2s', animationDuration: '5s' }} />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce opacity-70 shadow-lg shadow-pink-400/50" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }} />

        {/* Additional particle effects */}
        <div className="absolute top-1/6 right-1/6 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-30" style={{ animationDuration: '2s' }} />
        <div className="absolute bottom-1/3 right-1/6 w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse opacity-40" style={{ animationDuration: '4s' }} />
        <div className="absolute top-2/3 left-1/6 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-spin opacity-50" style={{ animationDuration: '6s' }} />

        {/* Morphing shapes */}
        <div className="absolute top-16 right-16 w-16 h-16 border border-blue-400/30 rounded-full animate-morph opacity-20 shadow-lg shadow-blue-400/20" />
        <div className="absolute bottom-16 left-16 w-12 h-12 border border-purple-400/30 rounded-lg animate-morph opacity-15 shadow-lg shadow-purple-400/20" />
        <div className="absolute top-1/2 left-8 w-8 h-8 border border-cyan-400/40 rounded-full animate-ping opacity-30 shadow-lg shadow-cyan-400/30" style={{ animationDuration: '4s' }} />

        {/* Additional geometric shapes */}
        <div className="absolute bottom-1/4 right-1/4 w-10 h-10 border-2 border-pink-400/20 rotate-45 animate-pulse opacity-25" style={{ animationDuration: '5s' }} />
        <div className="absolute top-3/4 left-1/2 w-6 h-6 border border-emerald-400/30 rounded-lg animate-spin opacity-20" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/5 left-1/3 w-4 h-4 bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 animate-float opacity-40" />

        {/* Floating geometric shapes */}
        <div className="absolute top-32 left-1/2 w-6 h-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 transform rotate-45 animate-float opacity-60" />
        <div className="absolute bottom-32 right-1/2 w-4 h-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full animate-float opacity-50" style={{ animationDelay: '2s' }} />
        <div className="absolute top-3/4 right-16 w-5 h-5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 transform rotate-12 animate-float opacity-40" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  CodeFit
                </span>
                <div className="text-xs text-slate-400">Interview Platform</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25 rounded-lg px-6 py-2">
                  <span className="flex items-center space-x-2">
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            {/* Hero Content */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full mb-8 backdrop-blur-sm hover:bg-slate-700/50 transition-all duration-300 hover:scale-105 cursor-pointer group">
                <Star className="w-4 h-4 text-yellow-400 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors duration-300">Trusted by 1000+ developers worldwide</span>
                <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent animate-text-shimmer">
                  Where Great
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                  Interviews Happen
                </span>
              </h1>

              <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                Experience the future of technical interviews with real-time collaboration,
                crystal-clear video, and interactive coding environments that feel like magic.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/register">
                  <Button size="lg" className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-xl shadow-blue-500/25 rounded-xl px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-200 overflow-hidden">
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                    {/* Sparkle effects */}
                    <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-ping" style={{ animationDuration: '1s' }} />
                    <div className="absolute bottom-2 left-2 w-0.5 h-0.5 bg-white rounded-full opacity-0 group-hover:opacity-80 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }} />

                    <span className="relative z-10 flex items-center space-x-2">
                      <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
                      <span>Start Interviewing</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="group border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl px-8 py-4 text-lg backdrop-blur-sm hover:border-slate-600 transition-all duration-200">
                    <Github className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    <span className="group-hover:text-white transition-colors duration-200">Sign In</span>
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
                <div className="text-center group cursor-pointer">
                  <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300 group-hover:scale-110 transform transition-transform duration-300">10K+</div>
                  <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">Interviews</div>
                  <div className="w-8 h-0.5 bg-blue-400 mx-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors duration-300 group-hover:scale-110 transform transition-transform duration-300">500+</div>
                  <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">Companies</div>
                  <div className="w-8 h-0.5 bg-purple-400 mx-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300 group-hover:scale-110 transform transition-transform duration-300">99%</div>
                  <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">Satisfaction</div>
                  <div className="w-8 h-0.5 bg-green-400 mx-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-20">
              <Card className="group relative bg-gradient-to-br from-blue-950/50 to-blue-900/30 border-slate-700/50 backdrop-blur-xl hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 overflow-hidden">
                {/* Animated border */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />

                {/* Floating particles in card */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-60 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute bottom-4 left-4 w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-40 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />

                <CardContent className="p-8 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40">
                    <Video className="w-7 h-7 text-white group-hover:animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-100 transition-colors duration-300">Crystal Video</h3>
                  <p className="text-slate-400 leading-relaxed mb-4 group-hover:text-slate-300 transition-colors duration-300">
                    HD video conferencing with WebRTC technology, screen sharing, and crystal-clear audio quality.
                  </p>
                  <div className="flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors duration-300">
                    <span className="group-hover:underline">Learn more</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 border-slate-700/50 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25">
                    <Code className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Live Coding</h3>
                  <p className="text-slate-400 leading-relaxed mb-4">
                    Collaborative code editor with syntax highlighting, real-time sync, and multiple cursors for pair programming.
                  </p>
                  <div className="flex items-center text-purple-400 text-sm font-medium">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-950/50 to-cyan-900/30 border-slate-700/50 backdrop-blur-xl hover:border-cyan-500/50 transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/25">
                    <PenTool className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Smart Whiteboard</h3>
                  <p className="text-slate-400 leading-relaxed mb-4">
                    Interactive drawing tools, shape recognition, and real-time collaboration for visual explanations.
                  </p>
                  <div className="flex items-center text-cyan-400 text-sm font-medium">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Features */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
                <Shield className="w-8 h-8 text-green-400 mb-4" />
                <h4 className="text-white font-semibold mb-2">Secure & Private</h4>
                <p className="text-slate-400 text-sm">End-to-end encryption and secure connections</p>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
                <Users className="w-8 h-8 text-blue-400 mb-4" />
                <h4 className="text-white font-semibold mb-2">Team Collaboration</h4>
                <p className="text-slate-400 text-sm">Multi-user sessions with role-based access</p>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
                <Zap className="w-8 h-8 text-yellow-400 mb-4" />
                <h4 className="text-white font-semibold mb-2">Lightning Fast</h4>
                <p className="text-slate-400 text-sm">Optimized performance with global CDN</p>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
                <Star className="w-8 h-8 text-purple-400 mb-4" />
                <h4 className="text-white font-semibold mb-2">AI-Powered</h4>
                <p className="text-slate-400 text-sm">Smart features for better interview experiences</p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-12 backdrop-blur-xl">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Transform Your Interviews?
              </h2>
              <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                Join thousands of developers and companies who trust CodeFit for their most important interviews.
              </p>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-xl shadow-blue-500/25 rounded-xl px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-200">
                  <span className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Start Your Free Trial</span>
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 bg-slate-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center space-x-6 text-slate-400">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">CodeFit</span>
            </div>
            <span>•</span>
            <span>© 2025 CodeFit. Built for better interviews.</span>
            <span>•</span>
            <span>Made with ❤️ for developers</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

