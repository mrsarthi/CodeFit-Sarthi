'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

export default function CreateInterviewPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [mode, setMode] = useState<'schedule' | 'now'>('schedule')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    participantIds: [] as string[],
  })
  const [candidates, setCandidates] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (user?.role !== 'INTERVIEWER') {
      router.push('/dashboard')
    }
  }, [user, router])

  const searchCandidates = async (query: string) => {
    if (query.length < 2) {
      setCandidates([])
      return
    }

    setSearching(true)
    try {
      const response = await api.get(`/users/search?q=${query}`)
      const filtered = response.data.filter(
        (u: any) => u.role === 'JOB_SEEKER' && u.id !== user?.id
      )
      setCandidates(filtered)
    } catch (error) {
      console.error('Failed to search candidates:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleAddParticipant = (candidateId: string) => {
    if (!formData.participantIds.includes(candidateId)) {
      setFormData({
        ...formData,
        participantIds: [...formData.participantIds, candidateId],
      })
    }
  }

  const handleRemoveParticipant = (candidateId: string) => {
    setFormData({
      ...formData,
      participantIds: formData.participantIds.filter((id) => id !== candidateId),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        participantIds: formData.participantIds,
        startNow: mode === 'now',
      }

      // Only include scheduledAt if we are in schedule mode and it has a value
      if (mode === 'schedule' && formData.scheduledAt) {
        payload.scheduledAt = formData.scheduledAt
      }

      const response = await api.post('/interviews', payload)

      if (mode === 'now') {
        router.push(`/interview/${response.data.id}`)
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create interview')
    } finally {
      setLoading(false)
    }
  }

  const selectedCandidates = candidates.filter((c) =>
    formData.participantIds.includes(c.id)
  )

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  if (!mounted) return null

  return (
    <div className="relative">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 dark:from-violet-500/20 dark:via-purple-500/10 dark:to-fuchsia-500/20 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent dark:from-blue-500/20 -z-10" />

      <div className="relative container mx-auto px-4 py-12 max-w-4xl animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="text-center mb-8 space-y-3 animate-in slide-in-from-top duration-500">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 backdrop-blur-sm">
            <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
              Interview Scheduler
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
            Create New Interview
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Schedule a technical interview session with your candidates
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-violet-500/20 shadow-2xl shadow-violet-500/10 backdrop-blur-sm bg-background/95 animate-in slide-in-from-bottom duration-700">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('schedule')}
                  className={cn(
                    "py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
                    mode === 'schedule'
                      ? "bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule for Later
                </button>
                <button
                  type="button"
                  onClick={() => setMode('now')}
                  className={cn(
                    "py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
                    mode === 'now'
                      ? "bg-white dark:bg-slate-700 shadow-sm text-green-600 dark:text-green-400"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Immediately
                </button>
              </div>

              {/* Interview Details Section */}
              <div className="space-y-6 p-6 rounded-xl bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold">Interview Details</h3>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Interview Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Senior Full Stack Developer Interview"
                    className="transition-all duration-300 focus:ring-2 focus:ring-violet-500/50 border-violet-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide details about the interview focus areas, topics to cover, or any special instructions..."
                    className="transition-all duration-300 focus:ring-2 focus:ring-violet-500/50 border-violet-500/20 min-h-[100px] resize-none"
                  />
                </div>

                {mode === 'schedule' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledDate" className="text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Date
                      </Label>
                      <div className="relative">
                        <Input
                          id="scheduledDate"
                          type="date"
                          value={formData.scheduledAt ? formData.scheduledAt.split('T')[0] : ''}
                          onChange={(e) => {
                            const time = formData.scheduledAt ? formData.scheduledAt.split('T')[1] : '09:00'
                            setFormData({ ...formData, scheduledAt: e.target.value ? `${e.target.value}T${time}` : '' })
                          }}
                          className="transition-all duration-300 focus:ring-2 focus:ring-violet-500/50 border-violet-500/20 pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-violet-600 dark:text-violet-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime" className="text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Time
                      </Label>
                      <div className="relative">
                        <Input
                          id="scheduledTime"
                          type="time"
                          value={formData.scheduledAt ? formData.scheduledAt.split('T')[1] || '09:00' : '09:00'}
                          onChange={(e) => {
                            const date = formData.scheduledAt ? formData.scheduledAt.split('T')[0] : new Date().toISOString().split('T')[0]
                            setFormData({ ...formData, scheduledAt: `${date}T${e.target.value}` })
                          }}
                          className="transition-all duration-300 focus:ring-2 focus:ring-violet-500/50 border-violet-500/20 pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-violet-600 dark:text-violet-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Candidate Selection Section */}
              <div className="space-y-6 p-6 rounded-xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold">Select Candidates</h3>
                  {formData.participantIds.length > 0 && (
                    <span className="ml-auto px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                      {formData.participantIds.length} selected
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Candidates
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Type to search candidates by name or email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        searchCandidates(e.target.value)
                      }}
                      className="transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 border-blue-500/20 pl-10"
                    />
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {searchQuery.length > 0 && searchQuery.length < 2 && (
                    <p className="text-xs text-muted-foreground mt-2">Type at least 2 characters to search</p>
                  )}

                  {candidates.length > 0 && (
                    <div className="mt-4 border border-blue-500/20 rounded-lg p-2 space-y-1 max-h-64 overflow-y-auto bg-background/50 backdrop-blur-sm custom-scrollbar">
                      {candidates.map((candidate, index) => (
                        <div
                          key={candidate.id}
                          className="flex items-center justify-between p-3 hover:bg-blue-500/10 rounded-lg transition-all duration-200 animate-in slide-in-from-left"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                              {getInitials(candidate.firstName, candidate.lastName)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {candidate.firstName} {candidate.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{candidate.email}</p>
                            </div>
                          </div>
                          {formData.participantIds.includes(candidate.id) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-green-500/50 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                              onClick={() => handleRemoveParticipant(candidate.id)}
                            >
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Added
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all duration-300"
                              onClick={() => handleAddParticipant(candidate.id)}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 && candidates.length === 0 && !searching && (
                    <div className="mt-4 p-8 text-center border border-dashed border-blue-500/20 rounded-lg">
                      <svg className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm text-muted-foreground">No candidates found</p>
                    </div>
                  )}
                </div>

                {selectedCandidates.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Selected Candidates ({selectedCandidates.length})
                    </Label>
                    <div className="space-y-2">
                      {selectedCandidates.map((candidate, index) => (
                        <div
                          key={candidate.id}
                          className="flex items-center justify-between p-3 border border-green-500/20 bg-green-500/5 rounded-lg transition-all duration-200 hover:border-green-500/30 animate-in slide-in-from-right"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                              {getInitials(candidate.firstName, candidate.lastName)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {candidate.firstName} {candidate.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{candidate.email}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                            onClick={() => handleRemoveParticipant(candidate.id)}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 transition-all duration-300 hover:scale-105 border-violet-500/20 hover:border-violet-500/40"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || formData.participantIds.length === 0}
                  className={cn(
                    "flex-1 bg-gradient-to-r transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                    mode === 'now'
                      ? "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/50"
                      : "from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/50"
                  )}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {mode === 'now' ? 'Starting...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {mode === 'now' ? (
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {mode === 'now' ? 'Start Interview Now' : 'Schedule Interview'}
                    </>
                  )}
                </Button>
              </div>

              {formData.participantIds.length === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Please select at least one candidate to create an interview
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.5);
        }
        
        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-from-bottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-from-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-from-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .slide-in-from-top {
          animation: slide-in-from-top 0.5s ease-out;
        }
        
        .slide-in-from-bottom {
          animation: slide-in-from-bottom 0.5s ease-out;
        }
        
        .slide-in-from-left {
          animation: slide-in-from-left 0.3s ease-out;
        }
        
        .slide-in-from-right {
          animation: slide-in-from-right 0.3s ease-out;
        }
        
        .fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .duration-300 {
          animation-duration: 300ms;
        }
        
        .duration-500 {
          animation-duration: 500ms;
        }
        
        .duration-700 {
          animation-duration: 700ms;
        }
      `}</style>
    </div>
  )
}
