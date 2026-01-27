'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Navbar } from '@/components/layout/navbar'
import api from '@/lib/api'
import { Sparkles, Briefcase, Users, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OnboardingPage() {
    const router = useRouter()
    const user = useAuthStore((state) => state.user)
    const [selectedRole, setSelectedRole] = useState<'JOB_SEEKER' | 'INTERVIEWER' | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!user) {
            router.push('/login')
        } else if (user.onboardingCompleted) {
            router.push('/dashboard')
        }
    }, [user, router])

    const handleContinue = async () => {
        if (!selectedRole) return

        setLoading(true)
        setError('')
        try {
            await api.patch('/users/onboarding', { role: selectedRole })

            // Update local user state
            // Accessing store directly to get the actions
            const { updateUser } = useAuthStore.getState()
            if (updateUser) {
                updateUser({
                    role: selectedRole,
                    onboardingCompleted: true
                })
            } else {
                console.warn('updateUser action not available in store')
            }

            router.push('/dashboard')
        } catch (err: any) {
            console.error('Failed to update role:', err)
            setError(err.response?.data?.message || 'Failed to update profile. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
            <Navbar />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/5 to-cyan-900/10" />

            <div className="max-w-4xl w-full relative z-10 mx-auto py-12 px-6">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Welcome, {user.firstName}!</h1>
                    <p className="text-slate-400 text-lg">How do you plan to use CodeFit?</p>
                </div>

                {error && (
                    <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400">
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {/* Job Seeker Card */}
                    <div
                        onClick={() => setSelectedRole('JOB_SEEKER')}
                        className={cn(
                            "relative group cursor-pointer rounded-3xl p-8 border transition-all duration-300",
                            selectedRole === 'JOB_SEEKER'
                                ? "bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/30"
                                : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600"
                        )}
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                                selectedRole === 'JOB_SEEKER' ? "bg-blue-500 text-white" : "bg-slate-700/50 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
                            )}>
                                <Briefcase className="w-7 h-7" />
                            </div>
                            {selectedRole === 'JOB_SEEKER' && (
                                <div className="bg-blue-500 text-white p-1 rounded-full">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Find a Job</h3>
                        <p className="text-slate-400 leading-relaxed">
                            I want to practice coding interviews, solve problems, and get hired by top companies.
                        </p>
                    </div>

                    {/* Interviewer Card */}
                    <div
                        onClick={() => setSelectedRole('INTERVIEWER')}
                        className={cn(
                            "relative group cursor-pointer rounded-3xl p-8 border transition-all duration-300",
                            selectedRole === 'INTERVIEWER'
                                ? "bg-purple-600/10 border-purple-500 ring-2 ring-purple-500/30"
                                : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600"
                        )}
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                                selectedRole === 'INTERVIEWER' ? "bg-purple-500 text-white" : "bg-slate-700/50 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
                            )}>
                                <Users className="w-7 h-7" />
                            </div>
                            {selectedRole === 'INTERVIEWER' && (
                                <div className="bg-purple-500 text-white p-1 rounded-full">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Interview Candidates</h3>
                        <p className="text-slate-400 leading-relaxed">
                            I want to conduct technical interviews, evaluate candidates, and build my team.
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        onClick={handleContinue}
                        disabled={!selectedRole || loading}
                        className={cn(
                            "group relative px-8 py-4 bg-gradient-to-r rounded-xl font-semibold text-white shadow-lg transition-all duration-300",
                            !selectedRole
                                ? "from-slate-700 to-slate-800 cursor-not-allowed opacity-50"
                                : "from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-105 shadow-blue-500/25",
                            loading && "cursor-wait opacity-80"
                        )}
                    >
                        {loading ? 'Setting up your profile...' : 'Continue to Dashboard'}
                    </button>
                </div>
            </div>
        </div>
    )
}
