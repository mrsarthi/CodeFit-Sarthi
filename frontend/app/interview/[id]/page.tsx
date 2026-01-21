'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { Video, VideoOff, Mic, MicOff, Monitor, X, Code, PenTool, Users } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import heavy components
const CodeEditor = dynamic(() => import('@/components/interview/CodeEditor'), { ssr: false })
const Whiteboard = dynamic(() => import('@/components/interview/SimpleWhiteboard'), { ssr: false })

export default function InterviewRoomPage() {
  const params = useParams()
  const router = useRouter()
  const interviewId = params.id as string
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [activeTab, setActiveTab] = useState<'code' | 'whiteboard'>('code')
  const [participants, setParticipants] = useState<any[]>([])
  const [isJoinedRoom, setIsJoinedRoom] = useState(false)
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const socketRef = useRef<any>(null)

  useEffect(() => {
    if (!isHydrated) {
      console.log('Interview: Waiting for store hydration...')
      return
    }

    if (!user || !accessToken) {
      console.log('Interview: No user or access token, redirecting to login')
      router.push('/login')
      return
    }

    console.log('Interview: Store hydrated, user and token available, initializing interview...')

    // Add a small delay to ensure everything is properly loaded
    const timer = setTimeout(() => {
      initializeInterview()
    }, 100)





    // Request wake lock to prevent screen from sleeping
    let wakeLock: WakeLockSentinel | null = null
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen')
        }
      } catch (err) {
        console.log('Wake lock not supported or failed to acquire')
      }
    }

    requestWakeLock()



    // Handle beforeunload to prevent accidental navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Are you sure you want to leave the interview? This will end your session.'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearTimeout(timer)

      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (wakeLock) {
        wakeLock.release()
      }
      cleanup()
    }
  }, [interviewId, user, accessToken, isHydrated])

  const initializeInterview = async () => {
    try {
      // Ensure we have a valid token
      if (!accessToken) {
        throw new Error('No access token available')
      }

      console.log('Interview: Initializing interview for user:', user?.id, 'role:', user?.role, 'interview:', interviewId)

      // Initialize socket connection
      console.log('Interview: Creating socket connection with token present:', !!accessToken)
      const socket = getSocket(accessToken)
      socketRef.current = socket
      console.log('Interview: Socket created, initial connected status:', socket.connected)

      // Handle connection errors
      socket.on('connect', () => {
        console.log('Interview: Socket connected successfully, socket id:', socket.id, 'user:', user?.id, 'role:', user?.role, 'connected status:', socket.connected)
        console.log('Interview: Previous socket ref:', socketRef.current?.id, 'new socket id:', socket.id)

        // Update socket reference in case of reconnection
        socketRef.current = socket
        console.log('Interview: Updated socketRef.current, setting isSocketConnected to true')
        setIsSocketConnected(true)

        // IMPORTANT: Wait a bit for authentication to complete before joining
        // This prevents the race condition where join happens before userId is set
        setTimeout(() => {
          console.log('Interview: Joining interview room after socket connect:', interviewId, 'for user:', user?.id, 'role:', user?.role)
          socket.emit('interview:join', { interviewId })
        }, 100)
      })

      socket.on('disconnect', (reason) => {
        console.log('Interview: Socket disconnected:', reason, 'user:', user?.id, 'role:', user?.role, 'socket id:', socket.id)
        console.log('Interview: Setting isSocketConnected to false')
        setIsSocketConnected(false)
      })

      socket.on('connect_error', (error) => {
        console.error('Interview: Socket connection error:', error, 'user:', user?.id, 'user role:', user?.role)
        if (error instanceof Error && (error.message?.includes('Authentication') || error.message?.includes('token'))) {
          console.log('Interview: Authentication error, redirecting to login')
          router.push('/login')
        }
        setIsSocketConnected(false)
      })

      socket.on('interview:joined', () => {
        console.log('Interview: Successfully joined interview room:', interviewId, 'socket connected:', socket.connected, 'socket id:', socket.id)
        setIsJoinedRoom(true)

        // Test if we can emit to the room
        console.log('Interview: Testing room communication')
        socket.emit('test:message', {
          message: `Room join test from ${user?.firstName} (${user?.role})`,
          interviewId
        })
      })

      socket.on('interview:user-joined', (data: any) => {
        console.log('Interview: User joined room:', data.userId, 'current user:', user?.id, 'user data:', data.user)
        setParticipants((prev) => [...prev, data.user])

        // Create peer connection for new participant
        if (localStream && data.user.id !== user?.id) {
          console.log('Creating peer connection to user:', data.user.id)
          createPeerConnection(data.user.id)
        }
      })

      socket.on('error', (error: any) => {
        console.error('Interview: Received error from server:', error, 'user:', user?.id, 'role:', user?.role)
        alert(`Connection Error: ${error.message || 'Failed to join interview'}`)
        setIsSocketConnected(false)
      })

      // Test event listener
      socket.on('test:message', (data: any) => {
        console.log('Interview: Received test message:', data)
        alert(`Test message from ${data.fromUser}: ${data.message}`)
      })

      socket.on('interview:user-left', (data: any) => {
        console.log('User left interview:', data.userId)
        setParticipants((prev) => prev.filter((p) => p.id !== data.userId))
        // Clean up peer connection
        const pc = peerConnectionsRef.current.get(data.userId)
        if (pc) {
          pc.close()
          peerConnectionsRef.current.delete(data.userId)
        }
      })

      // WebRTC signaling
      socket.on('webrtc:offer', async (data: any) => {
        console.log('Received WebRTC offer:', data)
        if (data.targetUserId === user?.id) {
          console.log('Handling offer from user:', data.fromUserId)
          await handleOffer(data.offer, data.fromUserId)
        }
      })

      socket.on('webrtc:answer', async (data: any) => {
        console.log('Received WebRTC answer:', data)
        if (data.targetUserId === user?.id) {
          const pc = peerConnectionsRef.current.get(data.fromUserId)
          if (pc) {
            console.log('Setting remote description from answer')
            await pc.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            )
          }
        }
      })

      socket.on('webrtc:ice-candidate', async (data: any) => {
        console.log('Received ICE candidate:', data)
        if (data.targetUserId === user?.id) {
          const pc = peerConnectionsRef.current.get(data.fromUserId)
          if (pc) {
            console.log('Adding ICE candidate')
            await pc.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            )
          }
        }
      })

      // Initialize WebRTC
      await initializeWebRTC()
    } catch (error) {
      console.error('Failed to initialize interview:', error)
      // If authentication fails, redirect to login
      if (error instanceof Error && (error.message?.includes('token') || error.message?.includes('auth'))) {
        router.push('/login')
        return
      }
      // Handle other initialization errors
    }
  }

  const createPeerConnection = (targetUserId: string) => {
    if (!localStream || peerConnectionsRef.current.has(targetUserId)) return

    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    }

    const pc = new RTCPeerConnection(configuration)
    peerConnectionsRef.current.set(targetUserId, pc)

    // Add local stream tracks
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream)
    })

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0]
      setRemoteStreams((prev) => {
        const newMap = new Map(prev)
        newMap.set(targetUserId, remoteStream)
        return newMap
      })
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc:ice-candidate', {
          interviewId,
          candidate: event.candidate,
          targetUserId,
        })
      }
    }

    // Send offer to target user
    pc.createOffer().then((offer) => {
      return pc.setLocalDescription(offer)
    }).then(() => {
      if (socketRef.current && pc.localDescription) {
        console.log('Sending WebRTC offer to user:', targetUserId)
        socketRef.current.emit('webrtc:offer', {
          interviewId,
          offer: pc.localDescription,
          targetUserId,
        })
      }
    }).catch((error) => {
      console.error('Error creating offer:', error)
    })

    return pc
  }

  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connections for existing participants
      participants.forEach((participant) => {
        if (participant.id !== user?.id) {
          createPeerConnection(participant.id)
        }
      })
    } catch (error) {
      console.error('WebRTC initialization failed:', error)
    }
  }

  const handleOffer = async (offer: RTCSessionDescriptionInit, fromUserId: string) => {
    console.log('Handling offer from user:', fromUserId)
    let pc = peerConnectionsRef.current.get(fromUserId)

    if (!pc) {
      console.log('Creating new peer connection for offer from:', fromUserId)
      pc = createPeerConnection(fromUserId)
    }

    if (!pc) return

    await pc.setRemoteDescription(new RTCSessionDescription(offer))

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    if (socketRef.current) {
      console.log('Sending WebRTC answer to user:', fromUserId)
      socketRef.current.emit('webrtc:answer', {
        interviewId,
        answer,
        targetUserId: fromUserId,
      })
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn
        setIsVideoOn(!isVideoOn)
      }
    }
  }

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn
        setIsAudioOn(!isAudioOn)
      }
    }
  }

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => {
      pc.close()
    })
    peerConnectionsRef.current.clear()

    if (socketRef.current) {
      socketRef.current.emit('interview:leave', { interviewId })
      disconnectSocket(accessToken || undefined)
    }
  }

  const enterFullscreen = () => {
    try {
      if (document && document.documentElement && typeof document.documentElement.requestFullscreen === 'function' && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((error) => {
          console.warn('Failed to enter fullscreen:', error)
        })
      } else {
        console.log('Fullscreen not supported or already in fullscreen mode')
      }
    } catch (error) {
      console.warn('Error in enterFullscreen:', error)
    }
  }

  const exitFullscreen = () => {
    try {
      // Only try to exit fullscreen if we're actually in fullscreen mode
      if (document && document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        document.exitFullscreen().catch((error) => {
          console.warn('Failed to exit fullscreen:', error)
          // Handle specific error cases
          if (error.message?.includes('Document not active')) {
            console.log('Document not active for fullscreen exit - this is normal if already exited or page is in background')
          } else if (error.name === 'NotAllowedError') {
            console.log('Fullscreen exit not allowed - user interaction required')
          }
        })
      } else {
        console.log('Not in fullscreen mode or exitFullscreen not available')
      }
    } catch (error) {
      console.warn('Error in exitFullscreen:', error)
    }
  }


  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex flex-col">
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/5 via-teal-900/3 to-cyan-900/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.05),transparent_50%)]" />

      {/* Enhanced Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400/20 rounded-full animate-float-slow opacity-40"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-blue-400/30 rounded-full animate-float-medium opacity-50"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-purple-400/25 rounded-full animate-float-fast opacity-35"></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-teal-400/20 rounded-full animate-float-slow opacity-45"></div>
        <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-indigo-400/15 rounded-full animate-float-medium opacity-30"></div>
        <div className="absolute top-3/4 left-1/2 w-0.5 h-0.5 bg-cyan-400/40 rounded-full animate-float-fast opacity-60"></div>
        <div className="absolute bottom-1/2 right-1/4 w-1.5 h-1.5 bg-pink-400/20 rounded-full animate-float-slow opacity-25"></div>
        <div className="absolute top-1/6 right-1/2 w-1 h-1 bg-orange-400/30 rounded-full animate-float-medium opacity-40"></div>
      </div>

      {/* Header with Entrance Animation */}
      <header className="relative z-10 border-b border-slate-800/40 backdrop-blur-md bg-slate-950/80 animate-in slide-in-from-top-4 duration-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/welcome" className="flex items-center space-x-3 text-slate-400 hover:text-white transition-all duration-300 group">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Video className="w-4 h-4 text-white transition-transform group-hover:scale-110" />
                </div>
                <span className="text-lg font-semibold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-teal-300 transition-all duration-300">
                  CodeFit
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-2 backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full animate-pulse shadow-lg ${isSocketConnected ? 'bg-green-400 shadow-green-400/50' : 'bg-red-400 shadow-red-400/50'}`} />
                <span className="text-sm text-slate-300 font-medium">
                  {isSocketConnected ? `Live Session (${user?.role})` : `Connecting... (${user?.role})`}
                </span>
                {document.fullscreenElement && (
                  <div className="flex items-center space-x-1 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    <span>Fullscreen</span>
                  </div>
                )}
                {!isSocketConnected && (
                  <div className="flex items-center space-x-1 text-xs text-red-400">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                    <span>Check console for errors</span>
                  </div>
                )}


              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const confirmed = window.confirm(
                    'Are you sure you want to end this interview? This action cannot be undone and will disconnect all participants.'
                  )
                  if (confirmed) {
                    cleanup()
                    exitFullscreen()
                    router.push('/dashboard')
                  }
                }}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500/70 hover:text-red-300 rounded-lg px-4 py-2 backdrop-blur-sm transition-all duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                End Interview
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Video Sidebar - Enhanced Glassmorphism Design with Entrance Animation */}
        <div className="w-80 border-r border-slate-800/40 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl relative animate-in slide-in-from-left-4 duration-500 delay-200">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />

          <div className="p-6 relative z-10">
            <div className="flex items-center space-x-3 mb-6 group">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 group-hover:scale-110">
                <Users className="w-4 h-4 text-white transition-transform group-hover:scale-110" />
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors duration-300">Participants</h3>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            </div>

            <div className="space-y-4">
              {/* Local Video - Enhanced Design with Animation */}
              <div className="group bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300 animate-in slide-in-from-left-2 duration-500 delay-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10">
                <div className="relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full aspect-video object-cover"
                  />
                  {/* Subtle overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                      <span className="text-white text-sm font-medium">You ({user?.firstName})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isVideoOn ? (
                        <Video className="h-4 w-4 text-green-400 drop-shadow-lg" />
                      ) : (
                        <VideoOff className="h-4 w-4 text-red-400 drop-shadow-lg" />
                      )}
                      {isAudioOn ? (
                        <Mic className="h-4 w-4 text-green-400 drop-shadow-lg" />
                      ) : (
                        <MicOff className="h-4 w-4 text-red-400 drop-shadow-lg" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Remote Videos - Enhanced Design with Stagger Animations */}
              {Array.from(remoteStreams.entries()).map(([userId, stream], index) => {
                const participant = participants.find(p => p.id === userId)
                return (
                  <div key={userId} className={`group bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300 animate-in slide-in-from-left-2 duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10`} style={{ animationDelay: `${(index + 1) * 150}ms` }}>
                    <div className="relative">
                      <video
                        ref={(el) => {
                          if (el) {
                            remoteVideoRefs.current.set(userId, el)
                            el.srcObject = stream
                          }
                        }}
                        autoPlay
                        playsInline
                        className="w-full aspect-video object-cover"
                      />
                      {/* Subtle overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50" />
                        <span className="text-white text-sm font-medium">
                          {participant ? participant.firstName : 'Participant'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Controls - Enhanced Design */}
            <div className="mt-8 pt-6 border-t border-slate-800/40">
              <div className="text-center mb-4">
                <span className="text-slate-400 text-sm font-medium">Session Controls</span>
              </div>
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant={isVideoOn ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleVideo}
                  className={`rounded-lg px-4 py-3 transition-all duration-200 ${isVideoOn
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25'
                    : 'border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500/70'
                    }`}
                >
                  {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant={isAudioOn ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleAudio}
                  className={`rounded-lg px-4 py-3 transition-all duration-200 ${isAudioOn
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25'
                    : 'border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500/70'
                    }`}
                >
                  {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Clean Minimalist Design with Animation */}
        <div className="flex-1 flex flex-col bg-slate-950 animate-in slide-in-from-bottom-4 duration-500 delay-400 min-h-0">
          {/* Enhanced Tabs with Hover Effects */}
          <div className="border-b border-slate-800/40 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex px-4">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-all duration-300 flex items-center space-x-2 group relative overflow-hidden ${activeTab === 'code'
                  ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/30 hover:scale-105'
                  }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Code className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'code' ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="relative z-10">Code Editor</span>
              </button>
              <button
                onClick={() => setActiveTab('whiteboard')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-all duration-300 flex items-center space-x-2 group relative overflow-hidden ${activeTab === 'whiteboard'
                  ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/30 hover:scale-105'
                  }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <PenTool className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'whiteboard' ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="relative z-10">Whiteboard</span>
              </button>
            </div>
          </div>

          {/* Content Area - Clean and Focused with Fade Animation */}
          <div className="flex-1 overflow-hidden bg-slate-950 relative min-h-0">
            {!isSocketConnected && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-300 text-sm">Connecting to interview session...</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 animate-in fade-in-0 duration-300 h-full">
              {isSocketConnected ? (
                <>
                  <div className={`animate-in slide-in-from-right-2 duration-300 h-full ${activeTab === 'code' ? 'block' : 'hidden'}`}>
                    <CodeEditor interviewId={interviewId} socket={socketRef?.current || null} />
                  </div>
                  <div className={`animate-in slide-in-from-left-2 duration-300 h-full ${activeTab === 'whiteboard' ? 'block' : 'hidden'}`}>
                    <Whiteboard interviewId={interviewId} socket={socketRef?.current || null} />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Connecting to interview session...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Please wait while we establish a secure connection
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

