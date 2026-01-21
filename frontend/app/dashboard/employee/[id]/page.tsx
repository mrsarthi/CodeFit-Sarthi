'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface UserData {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    organizationId: string | null
    createdAt: string
}

interface Statistics {
    totalInterviews: number
    completedInterviews: number
    upcomingInterviews: number
    cancelledInterviews: number
    totalFriends: number
    pendingRequests: number
    memberSince: string
}

interface ActivityData {
    date: string
    interviews: number
    timeSpent: number // in minutes
}

export default function EmployeeDetailPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.id as string

    const [user, setUser] = useState<UserData | null>(null)
    const [statistics, setStatistics] = useState<Statistics | null>(null)
    const [activityData, setActivityData] = useState<ActivityData[]>([])
    const [recentActivity, setRecentActivity] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [dateRange, setDateRange] = useState('30') // 7, 30, 90, custom
    const [customStartDate, setCustomStartDate] = useState('')
    const [customEndDate, setCustomEndDate] = useState('')
    const [activeMetric, setActiveMetric] = useState<'interviews' | 'timeSpent'>('timeSpent')

    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
    })

    // Initial data load - only runs once when userId changes
    useEffect(() => {
        if (userId) {
            fetchInitialData()
        }
    }, [userId])

    // Activity data load - runs when date filters change
    useEffect(() => {
        if (userId && user) {
            fetchActivityData()
        }
    }, [dateRange, customStartDate, customEndDate])

    // Auto-refresh activity data every 60 seconds to show live time
    useEffect(() => {
        if (!userId || !user) return

        const interval = setInterval(() => {
            fetchActivityData()
        }, 60000) // Refresh every 60 seconds

        return () => clearInterval(interval)
    }, [userId, user, dateRange, customStartDate, customEndDate])

    const fetchInitialData = async () => {
        try {
            setLoading(true)

            // Fetch user profile
            const userRes = await api.get(`/users/${userId}`)
            setUser(userRes.data)
            setEditForm({
                firstName: userRes.data.firstName,
                lastName: userRes.data.lastName,
                email: userRes.data.email,
            })

            // Fetch statistics
            const statsRes = await api.get(`/users/${userId}/statistics`)
            setStatistics(statsRes.data)

            // Fetch recent activity
            const recentRes = await api.get(`/users/${userId}/recent-activity`)
            setRecentActivity(recentRes.data)

            // Fetch initial activity data (last 30 days)
            await fetchActivityData()
        } catch (error) {
            console.error('Error fetching user data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchActivityData = async () => {
        try {
            let startDate, endDate
            const now = new Date()
            endDate = now.toISOString()

            if (dateRange === 'custom' && customStartDate && customEndDate) {
                startDate = new Date(customStartDate).toISOString()
                endDate = new Date(customEndDate).toISOString()
            } else {
                const days = parseInt(dateRange)
                startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
            }

            const activityRes = await api.get(`/users/${userId}/activity`, {
                params: { startDate, endDate },
            })
            setActivityData(activityRes.data)
        } catch (error) {
            console.error('Error fetching activity data:', error)
        }
    }

    const handleSaveProfile = async () => {
        try {
            await api.patch(`/users/${userId}`, editForm)
            setUser({ ...user!, ...editForm })
            setIsEditing(false)
        } catch (error) {
            console.error('Error updating profile:', error)
        }
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const formatTimeSpent = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    if (loading || !user || !statistics) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="relative">
            {/* Animated Gradient Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 dark:from-violet-500/20 dark:via-purple-500/10 dark:to-fuchsia-500/20 -z-10" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent dark:from-blue-500/20 -z-10" />

            <div className="relative container mx-auto px-4 py-8 max-w-7xl">
                {/* Header with Profile */}
                <Card className="border-violet-500/20 shadow-2xl shadow-violet-500/10 backdrop-blur-sm bg-background/95 mb-6 animate-in fade-in duration-700">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                                {getInitials(user.firstName, user.lastName)}
                            </div>

                            {/* Profile Info */}
                            <div className="flex-1">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>First Name</Label>
                                                <Input
                                                    value={editForm.firstName}
                                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label>Last Name</Label>
                                                <Input
                                                    value={editForm.lastName}
                                                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Email</Label>
                                            <Input
                                                value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-violet-600 to-purple-600">
                                                Save Changes
                                            </Button>
                                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                                            {user.firstName} {user.lastName}
                                        </h1>
                                        <p className="text-muted-foreground mt-1">{user.email}</p>
                                        <div className="flex gap-2 mt-3">
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                                {user.role}
                                            </span>
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                Member since {formatDate(statistics.memberSince)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {!isEditing && (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    variant="outline"
                                    className="border-violet-500/20"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="border-violet-500/20 backdrop-blur-sm bg-background/95 animate-in slide-in-from-bottom duration-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Interviews</p>
                                    <p className="text-3xl font-bold mt-1">{statistics.totalInterviews}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-500/20 backdrop-blur-sm bg-background/95 animate-in slide-in-from-bottom duration-500 delay-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Completed</p>
                                    <p className="text-3xl font-bold mt-1">{statistics.completedInterviews}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-500/20 backdrop-blur-sm bg-background/95 animate-in slide-in-from-bottom duration-500 delay-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Upcoming</p>
                                    <p className="text-3xl font-bold mt-1">{statistics.upcomingInterviews}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-500/20 backdrop-blur-sm bg-background/95 animate-in slide-in-from-bottom duration-500 delay-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Friends</p>
                                    <p className="text-3xl font-bold mt-1">{statistics.totalFriends}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Graphs */}
                <Card className="border-border/40 bg-background mb-6">
                    <CardHeader className="border-b border-border/40 pb-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-semibold">Activity Metrics</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Track your platform engagement</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant={dateRange === '7' ? 'default' : 'ghost'}
                                    onClick={() => setDateRange('7')}
                                    className="h-8 text-xs"
                                >
                                    7D
                                </Button>
                                <Button
                                    size="sm"
                                    variant={dateRange === '30' ? 'default' : 'ghost'}
                                    onClick={() => setDateRange('30')}
                                    className="h-8 text-xs"
                                >
                                    30D
                                </Button>
                                <Button
                                    size="sm"
                                    variant={dateRange === '90' ? 'default' : 'ghost'}
                                    onClick={() => setDateRange('90')}
                                    className="h-8 text-xs"
                                >
                                    90D
                                </Button>
                                <Button
                                    size="sm"
                                    variant={dateRange === 'custom' ? 'default' : 'ghost'}
                                    onClick={() => setDateRange('custom')}
                                    className="h-8 text-xs"
                                >
                                    Custom
                                </Button>
                            </div>
                        </div>
                        {dateRange === 'custom' && (
                            <div className="flex gap-4 mt-4">
                                <div className="flex-1">
                                    <Label className="text-xs">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="mt-1 h-8 text-xs"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs">End Date</Label>
                                    <Input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="mt-1 h-8 text-xs"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Metric Tabs */}
                        <div className="flex gap-1 mt-4 p-1 bg-muted/50 rounded-lg w-fit">
                            <button
                                onClick={() => setActiveMetric('timeSpent')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeMetric === 'timeSpent'
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Time Spent
                            </button>
                            <button
                                onClick={() => setActiveMetric('interviews')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeMetric === 'interviews'
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Interview Count
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        stroke="hsl(var(--border))"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                        stroke="hsl(var(--border))"
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                        }}
                                        labelFormatter={(value) => formatDate(value)}
                                        formatter={(value: number | undefined) => [
                                            activeMetric === 'timeSpent' ? formatTimeSpent(value ?? 0) : (value ?? 0),
                                            activeMetric === 'timeSpent' ? 'Time Spent' : 'Interviews'
                                        ]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={activeMetric}
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={1.5}
                                        dot={false}
                                        activeDot={{ r: 3, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-violet-500/20 shadow-2xl shadow-violet-500/10 backdrop-blur-sm bg-background/95 animate-in slide-in-from-bottom duration-700">
                    <CardHeader>
                        <CardTitle className="text-2xl">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentActivity.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No recent activity</p>
                            ) : (
                                recentActivity.map((activity, index) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-violet-500/10 hover:border-violet-500/30 transition-all duration-200 animate-in slide-in-from-left"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.status === 'COMPLETED' ? 'bg-green-500/10' :
                                                activity.status === 'SCHEDULED' ? 'bg-blue-500/10' :
                                                    activity.status === 'ACTIVE' ? 'bg-purple-500/10' :
                                                        'bg-gray-500/10'
                                                }`}>
                                                <svg className={`w-5 h-5 ${activity.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' :
                                                    activity.status === 'SCHEDULED' ? 'text-blue-600 dark:text-blue-400' :
                                                        activity.status === 'ACTIVE' ? 'text-purple-600 dark:text-purple-400' :
                                                            'text-gray-600 dark:text-gray-400'
                                                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium">{activity.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {activity.role === 'candidate' ? 'As Candidate' : 'As Interviewer'} • {formatDate(activity.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activity.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                                            activity.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                activity.status === 'ACTIVE' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                                    'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {activity.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style jsx global>{`
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
        
        .slide-in-from-bottom {
          animation: slide-in-from-bottom 0.5s ease-out;
        }
        
        .slide-in-from-left {
          animation: slide-in-from-left 0.3s ease-out;
        }
        
        .fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .duration-500 {
          animation-duration: 500ms;
        }
        
        .duration-700 {
          animation-duration: 700ms;
        }
        
        .delay-100 {
          animation-delay: 100ms;
        }
        
        .delay-200 {
          animation-delay: 200ms;
        }
        
        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
        </div>
    )
}
