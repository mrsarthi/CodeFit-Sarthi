'use client'

import { useEffect, useRef } from 'react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store'

export function useActivityTracker() {
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastActivityRef = useRef<number>(Date.now())
    const isActiveRef = useRef<boolean>(true)
    const user = useAuthStore((state) => state.user)

    useEffect(() => {
        // Only start tracking if user is authenticated
        if (!user) {
            console.log('[ActivityTracker] No user, skipping tracker')
            return
        }

        console.log('[ActivityTracker] Hook mounted for user:', user.id)

        // Track user activity
        const updateActivity = () => {
            lastActivityRef.current = Date.now()
            isActiveRef.current = true
        }

        // Listen to user interactions
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
        events.forEach(event => {
            window.addEventListener(event, updateActivity)
        })

        // Send heartbeat every 30 seconds
        const sendHeartbeat = async () => {
            const now = Date.now()
            const timeSinceLastActivity = now - lastActivityRef.current
            const twoMinutes = 2 * 60 * 1000

            console.log(`[ActivityTracker] Heartbeat check - Time since activity: ${Math.floor(timeSinceLastActivity / 1000)}s`)

            // Only send heartbeat if user was active in last 2 minutes
            if (timeSinceLastActivity < twoMinutes) {
                try {
                    console.log('[ActivityTracker] Sending heartbeat...')
                    await api.post('/user-activity/heartbeat')
                    console.log('[ActivityTracker] ✅ Heartbeat sent successfully')
                } catch (error: any) {
                    if (error.response?.status === 401) {
                        console.error('[ActivityTracker] ❌ Authentication failed - token may be expired. Please log out and log back in.')
                    } else {
                        console.error('[ActivityTracker] ❌ Failed to send heartbeat:', error.message)
                    }
                }
            } else {
                isActiveRef.current = false
                console.log('[ActivityTracker] User inactive, skipping heartbeat')
            }
        }

        // Start heartbeat interval
        console.log('[ActivityTracker] Starting heartbeat interval (30s)')
        heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000) // 30 seconds

        // Send initial heartbeat
        console.log('[ActivityTracker] Sending initial heartbeat')
        sendHeartbeat()

        // Cleanup
        return () => {
            console.log('[ActivityTracker] Hook unmounting, cleaning up')
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current)
            }
            events.forEach(event => {
                window.removeEventListener(event, updateActivity)
            })

            // Send end session on unmount
            api.post('/user-activity/end').catch(() => { })
        }
    }, [user])

    return null
}
