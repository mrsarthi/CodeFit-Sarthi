'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'

interface WhiteboardProps {
  interviewId: string
  socket: any
}

export default function SimpleWhiteboard({ interviewId, socket }: WhiteboardProps) {
  const user = useAuthStore((state) => state.user)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#3b82f6')
  const [brushSize, setBrushSize] = useState(3)

  const resizeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const container = canvas.parentElement?.parentElement
    if (container) {
      const rect = container.getBoundingClientRect()
      const padding = 48 // Account for padding
      const newWidth = Math.max(rect.width - padding, 800)
      const newHeight = Math.max(rect.height - padding, 600)

      // Only resize if dimensions actually changed
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        console.log('Whiteboard: Resizing canvas from', canvas.width, 'x', canvas.height, 'to', newWidth, 'x', newHeight)

        // Save existing canvas content
        const ctx = canvas.getContext('2d')
        let imageData: ImageData | null = null
        if (ctx) {
          try {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          } catch (e) {
            console.warn('Whiteboard: Could not save canvas content:', e)
          }
        }

        canvas.width = newWidth
        canvas.height = newHeight

        // Restore canvas content
        if (ctx && imageData) {
          ctx.putImageData(imageData, 0, 0)
        }
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to fill container
    resizeCanvas()

    // Set initial canvas properties
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize

    const onResize = () => {
      resizeCanvas()
      // Reapply context properties after resize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
    }

    window.addEventListener('resize', onResize)

    // Handle drawing
    let lastX = 0
    let lastY = 0

    const getCanvasCoordinates = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    }

    const startDrawing = (e: MouseEvent) => {
      setIsDrawing(true)
      const coords = getCanvasCoordinates(e)
      lastX = coords.x
      lastY = coords.y
      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
    }

    const draw = (e: MouseEvent) => {
      if (!isDrawing) return

      const coords = getCanvasCoordinates(e)
      const currentX = coords.x
      const currentY = coords.y

      // Draw locally
      ctx.lineTo(currentX, currentY)
      ctx.stroke()

      // Broadcast drawing to other participants
      if (socket && user?.id) {
        if (socket.connected) {
          console.log('Whiteboard: Emitting draw event for user:', user.id, 'socket id:', socket.id)
          const eventData = {
            interviewId,
            drawing: {
              fromX: lastX,
              fromY: lastY,
              toX: currentX,
              toY: currentY,
              color,
              brushSize,
            },
            userId: user.id,
          }
          console.log('Whiteboard: Event data:', eventData)
          socket.emit('whiteboard:draw', eventData)
          console.log('Whiteboard: Draw event emitted successfully')
        } else {
          console.log('Whiteboard: Cannot emit - socket not connected, socket id:', socket.id)
        }
      } else {
        console.log('Whiteboard: Cannot emit - missing socket or user', {
          socket: !!socket,
          socketConnected: socket?.connected,
          socketId: socket?.id,
          userId: user?.id,
        })
      }

      lastX = currentX
      lastY = currentY
    }

    const stopDrawing = () => {
      setIsDrawing(false)
      ctx.beginPath() // Reset path for next drawing
    }

    // Add event listeners
    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('mouseout', stopDrawing)

    // Helper to (re)attach socket listeners safely
    const setupSocketListeners = () => {
      if (!socket) return
      try {
        socket.off('whiteboard:draw')
        socket.off('whiteboard:clear')

        socket.on('whiteboard:draw', (data: any) => {
          console.log('Whiteboard: Received draw event:', data, 'current user:', user?.id)

          // Only draw if it's from another user
          if (data.userId !== user?.id) {
            console.log('Whiteboard: Drawing remote stroke from user:', data.userId)
            const remoteCtx = canvas.getContext('2d')
            if (remoteCtx) {
              remoteCtx.save() // Save current state (color, etc.)

              // Set remote drawing properties
              remoteCtx.strokeStyle = data.drawing.color
              remoteCtx.lineWidth = data.drawing.brushSize
              remoteCtx.lineCap = 'round'
              remoteCtx.lineJoin = 'round'

              // Draw the line segment
              remoteCtx.beginPath()
              remoteCtx.moveTo(data.drawing.fromX, data.drawing.fromY)
              remoteCtx.lineTo(data.drawing.toX, data.drawing.toY)
              remoteCtx.stroke()

              remoteCtx.restore() // Restore previous state
            }
          } else {
            console.log('Whiteboard: Ignoring own drawing from user:', data.userId)
          }
        })

        socket.on('whiteboard:clear', (data: any) => {
          console.log('Whiteboard: Received clear event:', data, 'current user:', user?.id)

          // Only clear if it's from another user (not ourselves)
          if (data.userId && data.userId !== user?.id) {
            console.log('Whiteboard: Clearing canvas for remote clear from user:', data.userId)
            ctx.clearRect(0, 0, canvas.width, canvas.height)
          } else {
            console.log('Whiteboard: Ignoring clear event from self or invalid user')
          }
        })

        socket.on('interview:init-state', (data: any) => {
          console.log('Whiteboard: Received init state', data)
          if (data.whiteboard && Array.isArray(data.whiteboard)) {
            const ctx = canvasRef.current?.getContext('2d')
            if (ctx) {
              data.whiteboard.forEach((drawing: any) => {
                ctx.save()
                ctx.strokeStyle = drawing.color
                ctx.lineWidth = drawing.brushSize
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                ctx.beginPath()
                ctx.moveTo(drawing.fromX, drawing.fromY)
                ctx.lineTo(drawing.toX, drawing.toY)
                ctx.stroke()
                ctx.restore()
              })
            }
          }
        })

        console.log('Whiteboard: Socket listeners set up successfully')
      } catch (err) {
        console.warn('Whiteboard: Error setting up socket listeners', err)
      }
    }

    // Initial attach if already connected
    if (socket) {
      if (socket.connected) setupSocketListeners()
      socket.on('connect', setupSocketListeners)
    }

    return () => {
      canvas.removeEventListener('mousedown', startDrawing)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stopDrawing)
      canvas.removeEventListener('mouseout', stopDrawing)
      window.removeEventListener('resize', onResize)
      if (socket) {
        socket.off('connect', setupSocketListeners)
        socket.off('whiteboard:draw')
        socket.off('whiteboard:clear')
        socket.off('interview:init-state')
      }
    }
  }, [isDrawing, color, brushSize, socket, interviewId])

  const clearCanvas = () => {
    console.log('Whiteboard: Clear button clicked by user:', user?.id)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (socket && user?.id && socket.connected) {
          console.log('Whiteboard: Emitting clear event for user:', user.id)
          socket.emit('whiteboard:clear', { interviewId, userId: user.id })
        } else {
          console.log('Whiteboard: Cannot emit clear - socket not connected or missing user')
        }
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Enhanced Toolbar */}
      <div className="border-b border-slate-800/40 bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Color Picker */}
            <div className="flex items-center gap-3 group">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 shadow-lg shadow-blue-500/30 animate-pulse"></div>
              <label className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                Color
              </label>
              <div className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-2 border-slate-600 hover:border-slate-500 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl"
                  style={{ background: 'transparent' }}
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-800/50 pointer-events-none"></div>
              </div>
            </div>

            {/* Brush Size */}
            <div className="flex items-center gap-3 group">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30 animate-pulse"></div>
              <label className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                Size
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{ background: 'transparent' }}
                />
                <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center border border-slate-500/50">
                  <span className="text-xs font-bold text-white">{brushSize}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300 transition-all duration-200 shadow-lg hover:shadow-red-500/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Board
          </Button>
        </div>

        {/* Status Indicator */}
        <div className="mt-3 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isDrawing ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-slate-600'}`}></div>
          <span className="text-xs text-slate-400">
            {isDrawing ? 'Drawing...' : 'Ready to draw'}
          </span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 relative overflow-hidden min-h-0">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:20px_20px]"></div>
        </div>

        {/* Canvas Container */}
        <div className="relative flex items-center justify-center h-full w-full min-h-0 min-w-0">
          <div className="relative group w-full h-full max-w-full max-h-full">
            {/* Canvas Shadow/Glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <canvas
              ref={canvasRef}
              className="border border-slate-700/50 bg-white rounded-xl shadow-2xl hover:shadow-slate-500/10 transition-all duration-300 relative z-10 w-full h-full"
              style={{
                cursor: isDrawing ? 'crosshair' : 'grab',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />

            {/* Canvas Hover Effect */}
            <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-slate-600/30 transition-all duration-300 pointer-events-none"></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-6 left-6 right-6 text-center">
          <div className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-full px-4 py-2 shadow-lg">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-300">
              Use your mouse to draw • Changes sync in real-time • Collaborate with your interviewer
            </span>
          </div>
        </div>

        {/* Drawing Animation Indicator */}
        {isDrawing && (
          <div className="absolute top-6 right-6 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-lg px-3 py-2 shadow-lg animate-in slide-in-from-right-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
              <span className="text-sm text-emerald-300 font-medium">Drawing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
