'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'

export default function AuthCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const setAuth = useAuthStore((state) => state.setAuth)
    const [error, setError] = useState('')

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get tokens from URL
                const accessToken = searchParams.get('accessToken')
                const refreshToken = searchParams.get('refreshToken')

                if (!accessToken || !refreshToken) {
                    setError('Authentication failed. Missing tokens.')
                    return
                }

                // Fetch user profile
                const response = await api.get('/users/me', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })

                const user = response.data

                // Debug logging
                console.log('🔍 OAuth Callback - User data:', {
                    email: user.email,
                    role: user.role,
                    onboardingCompleted: user.onboardingCompleted,
                })

                // Store auth data
                setAuth(user, accessToken, refreshToken)

                // Redirect to welcome page or onboarding
                if (user.onboardingCompleted) {
                    console.log('✅ Redirecting to /welcome (onboarding completed)')
                    router.push('/welcome')
                } else {
                    console.log('⚠️ Redirecting to /onboarding (onboarding NOT completed)')
                    router.push('/onboarding')
                }
            } catch (err: any) {
                console.error('OAuth callback error:', err)
                setError(err.response?.data?.message || 'Authentication failed')
            }
        }

        handleCallback()
    }, [searchParams, setAuth, router])

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-slate-800/50 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Authentication Failed</h2>
                    <p className="text-slate-300 mb-8">{error}</p>
                    <a
                        href="/login"
                        className="inline-block w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        Back to Sign in
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">Completing sign in...</h2>
                <p className="text-slate-400">Please wait while we set up your account</p>
            </div>
        </div>
    )
}
