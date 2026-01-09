'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Square, Circle, ArrowRight, ArrowLeftRight, Database, Cloud, Server, Box, Pencil } from 'lucide-react'
import { useAuthStore } from '@/lib/store'

interface WhiteboardProps {
  interviewId: string
  socket: any
}

interface WhiteboardObject {
  id: string
  type: 'square' | 'rectangle' | 'circle' | 'arrow' | 'double-arrow' | 'database' | 'cloud' | 'server' | 'container'
  x: number
  y: number
  width: number
  height: number
  color: string
}

const SHAPE_PALETTE = [
  { type: 'square' as const, icon: Square, label: 'Square', defaultSize: 80 },
  { type: 'rectangle' as const, icon: Square, label: 'Rectangle', defaultSize: { w: 120, h: 60 } },
  { type: 'circle' as const, icon: Circle, label: 'Circle', defaultSize: 80 },
  { type: 'arrow' as const, icon: ArrowRight, label: 'Arrow', defaultSize: { w: 100, h: 40 } },
  { type: 'double-arrow' as const, icon: ArrowLeftRight, label: 'Double Arrow', defaultSize: { w: 100, h: 40 } },
  { type: 'database' as const, icon: Database, label: 'Database', defaultSize: { w: 60, h: 80 } },
  { type: 'cloud' as const, icon: Cloud, label: 'Cloud/AWS', defaultSize: { w: 100, h: 60 } },
  { type: 'server' as const, icon: Server, label: 'Server', defaultSize: { w: 60, h: 80 } },
  { type: 'container' as const, icon: Box, label: 'Container', defaultSize: { w: 80, h: 80 } },
]

export default function SimpleWhiteboard({ interviewId, socket }: WhiteboardProps) {
  const user = useAuthStore((state) => state.user)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#3b82f6')
  const [brushSize, setBrushSize] = useState(3)
  const [objects, setObjects] = useState<WhiteboardObject[]>([])
  const [tool, setTool] = useState<'pen' | 'shape'>('pen')
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [remoteCursors, setRemoteCursors] = useState<Map<string, { x: number; y: number; user: any; isDrawing: boolean; lastUpdate: number }>>(new Map())
  const animationFrameRef = useRef<number | null>(null)
  const cursorTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const resizeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const container = canvas.parentElement
    if (container) {
      const rect = container.getBoundingClientRect()
      const newWidth = Math.max(rect.width - 16, 800)
      const newHeight = Math.max(rect.height - 16, 600)

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        const ctx = canvas.getContext('2d')
        let imageData: ImageData | null = null
        if (ctx) {
          try {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          } catch (e) {
            console.warn('Could not save canvas content:', e)
          }
        }

        canvas.width = newWidth
        canvas.height = newHeight

        if (ctx && imageData) {
          ctx.putImageData(imageData, 0, 0)
        }

        redrawShapes()
      }
    }
  }

  const redrawShapes = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Don't clear - freehand drawings are on canvas
    // Just redraw shapes on top
    objects.forEach(obj => drawObject(ctx, obj))
  }

  const drawRemoteCursors = (ctx: CanvasRenderingContext2D) => {
    remoteCursors.forEach((cursorData, userId) => {
      const { x, y, user: remoteUser, isDrawing } = cursorData
      if (!remoteUser || !isDrawing) return // Only show cursor if actively drawing

      const userName = remoteUser.firstName || remoteUser.email || 'User'
      const userColor = getUserColor(userId)

      // Draw cursor circle
      ctx.save()
      ctx.fillStyle = userColor
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Draw user name label
      ctx.font = '12px Inter, sans-serif'
      ctx.fillStyle = userColor
      const textWidth = ctx.measureText(userName).width

      // Background for label
      ctx.fillStyle = userColor
      ctx.fillRect(x + 12, y - 18, textWidth + 12, 20)

      // Text
      ctx.fillStyle = 'white'
      ctx.fillText(userName, x + 18, y - 4)

      ctx.restore()
    })
  }

  const getUserColor = (userId: string) => {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
      '#8b5cf6', '#ec4899', '#14b8a6'
    ]
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const drawObject = (ctx: CanvasRenderingContext2D, obj: WhiteboardObject) => {
    ctx.save()
    ctx.fillStyle = obj.color
    ctx.strokeStyle = obj.color
    ctx.lineWidth = 2

    switch (obj.type) {
      case 'square':
      case 'rectangle':
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)
        break

      case 'circle':
        ctx.beginPath()
        ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        break

      case 'arrow':
        drawArrow(ctx, obj.x, obj.y + obj.height / 2, obj.x + obj.width, obj.y + obj.height / 2, false)
        break

      case 'double-arrow':
        drawArrow(ctx, obj.x, obj.y + obj.height / 2, obj.x + obj.width, obj.y + obj.height / 2, true)
        break

      case 'database':
        drawDatabase(ctx, obj.x, obj.y, obj.width, obj.height)
        break

      case 'cloud':
        drawCloud(ctx, obj.x, obj.y, obj.width, obj.height)
        break

      case 'server':
        drawServer(ctx, obj.x, obj.y, obj.width, obj.height)
        break

      case 'container':
        drawContainer(ctx, obj.x, obj.y, obj.width, obj.height)
        break
    }

    ctx.restore()
  }

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, doubleEnded: boolean) => {
    const headLength = 15
    const angle = Math.atan2(y2 - y1, x2 - x1)

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6))
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6))
    ctx.stroke()

    if (doubleEnded) {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x1 + headLength * Math.cos(angle - Math.PI / 6), y1 + headLength * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(x1, y1)
      ctx.lineTo(x1 + headLength * Math.cos(angle + Math.PI / 6), y1 + headLength * Math.sin(angle + Math.PI / 6))
      ctx.stroke()
    }
  }

  const drawDatabase = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const ellipseHeight = h * 0.15

    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + ellipseHeight, w / 2, ellipseHeight, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.fillRect(x, y + ellipseHeight, w, h - ellipseHeight * 2)
    ctx.beginPath()
    ctx.moveTo(x, y + ellipseHeight)
    ctx.lineTo(x, y + h - ellipseHeight)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + w, y + ellipseHeight)
    ctx.lineTo(x + w, y + h - ellipseHeight)
    ctx.stroke()

    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + h - ellipseHeight, w / 2, ellipseHeight, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.beginPath()
    ctx.arc(x + w * 0.25, y + h * 0.6, h * 0.3, 0, Math.PI * 2)
    ctx.arc(x + w * 0.5, y + h * 0.4, h * 0.4, 0, Math.PI * 2)
    ctx.arc(x + w * 0.75, y + h * 0.6, h * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  const drawServer = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const layers = 3
    const layerHeight = h / layers
    const currentFillStyle = ctx.fillStyle

    for (let i = 0; i < layers; i++) {
      const layerY = y + i * layerHeight
      ctx.fillRect(x, layerY, w, layerHeight - 4)
      ctx.strokeRect(x, layerY, w, layerHeight - 4)

      ctx.fillStyle = '#00ff00'
      ctx.fillRect(x + w - 15, layerY + 5, 8, 8)
      ctx.fillStyle = currentFillStyle
    }
  }

  const drawContainer = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.strokeRect(x, y, w, h)

    ctx.beginPath()
    ctx.moveTo(x, y + h * 0.3)
    ctx.lineTo(x + w, y + h * 0.3)
    ctx.moveTo(x, y + h * 0.6)
    ctx.lineTo(x + w, y + h * 0.6)
    ctx.stroke()
  }

  const getCanvasCoordinates = (e: MouseEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const handleDragStart = (e: React.DragEvent, shapeType: typeof SHAPE_PALETTE[0]) => {
    e.dataTransfer.setData('shapeType', shapeType.type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const shapeType = e.dataTransfer.getData('shapeType') as WhiteboardObject['type']
    const shape = SHAPE_PALETTE.find(s => s.type === shapeType)
    if (!shape) return

    const coords = getCanvasCoordinates(e as any)
    const size = typeof shape.defaultSize === 'number'
      ? { w: shape.defaultSize, h: shape.defaultSize }
      : shape.defaultSize

    const newObject: WhiteboardObject = {
      id: `${Date.now()}-${Math.random()}`,
      type: shapeType,
      x: coords.x - size.w / 2,
      y: coords.y - size.h / 2,
      width: size.w,
      height: size.h,
      color: color
    }

    setObjects(prev => [...prev, newObject])

    // Draw immediately
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        drawObject(ctx, newObject)
      }
    }

    // Emit to other users
    if (socket && user?.id) {
      socket.emit('whiteboard:shape-add', {
        interviewId,
        object: newObject,
        userId: user.id
      })
    }
  }

  // Freehand drawing handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'pen') return

    setIsDrawing(true)
    const coords = getCanvasCoordinates(e)
    lastPointRef.current = coords

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool !== 'pen') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const coords = getCanvasCoordinates(e)
    const lastPoint = lastPointRef.current || coords

    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()

    // Emit drawing to other users
    if (socket && user?.id) {
      socket.emit('whiteboard:draw', {
        interviewId,
        drawing: {
          fromX: lastPoint.x,
          fromY: lastPoint.y,
          toX: coords.x,
          toY: coords.y,
          color,
          brushSize,
        },
        userId: user.id,
      })
    }

    lastPointRef.current = coords

    // Emit cursor position ONLY while drawing
    if (socket && user?.id) {
      socket.emit('whiteboard:cursor', {
        interviewId,
        cursor: { x: coords.x, y: coords.y },
        userId: user.id,
        isDrawing: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          email: user.email,
        },
      })
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    lastPointRef.current = null

    // Emit cursor stop drawing
    if (socket && user?.id) {
      socket.emit('whiteboard:cursor', {
        interviewId,
        cursor: { x: 0, y: 0 },
        userId: user.id,
        isDrawing: false,
        user: {
          id: user.id,
          firstName: user.firstName,
          email: user.email,
        },
      })
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setObjects([])

    if (socket) {
      socket.emit('whiteboard:clear', { interviewId })
    }
  }

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  useEffect(() => {
    redrawShapes()
  }, [objects, remoteCursors])

  useEffect(() => {
    if (!socket || !user) return

    socket.off('whiteboard:draw')
    socket.off('whiteboard:shape-add')
    socket.off('whiteboard:clear')

    socket.on('whiteboard:draw', (data: any) => {
      if (data.userId !== user?.id) {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.save()
        ctx.strokeStyle = data.drawing.color
        ctx.lineWidth = data.drawing.brushSize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.beginPath()
        ctx.moveTo(data.drawing.fromX, data.drawing.fromY)
        ctx.lineTo(data.drawing.toX, data.drawing.toY)
        ctx.stroke()

        ctx.restore()
      }
    })

    socket.on('whiteboard:shape-add', (data: any) => {
      if (data.userId !== user?.id) {
        setObjects(prev => [...prev, data.object])

        // Draw immediately
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            drawObject(ctx, data.object)
          }
        }
      }
    })

    socket.on('whiteboard:clear', () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setObjects([])
    })

    socket.on('whiteboard:cursor', (data: any) => {
      if (data.userId !== user?.id) {
        setRemoteCursors(prev => {
          const newCursors = new Map(prev)
          newCursors.set(data.userId, {
            x: data.cursor.x,
            y: data.cursor.y,
            user: data.user,
            isDrawing: data.isDrawing || false,
            lastUpdate: Date.now(),
          })
          return newCursors
        })
      }
    })

    return () => {
      socket.off('whiteboard:draw')
      socket.off('whiteboard:shape-add')
      socket.off('whiteboard:clear')
      socket.off('whiteboard:cursor')
    }
  }, [socket, user?.id])

  return (
    <div className="h-full flex bg-slate-950">
      {/* Left Sidebar - Tools & Shapes */}
      <div className="w-48 bg-slate-900/50 border-r border-slate-800/40 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Tools</h3>

        {/* Tool Selection */}
        <div className="mb-6 space-y-2">
          <button
            onClick={() => setTool('pen')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${tool === 'pen'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
              }`}
          >
            <Pencil className="w-4 h-4" />
            <span className="text-sm">Pen</span>
          </button>
        </div>

        <h3 className="text-sm font-semibold text-slate-300 mb-4 mt-6">Shapes & Icons</h3>
        <div className="grid grid-cols-2 gap-2">
          {SHAPE_PALETTE.map((shape) => (
            <div
              key={shape.type}
              draggable
              onDragStart={(e) => handleDragStart(e, shape)}
              className="aspect-square bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-emerald-500/50 rounded-lg flex flex-col items-center justify-center cursor-move transition-all duration-200 group"
              title={shape.label}
            >
              <shape.icon className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 mt-1 text-center">{shape.label}</span>
            </div>
          ))}
        </div>

        {/* Color Picker */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-slate-400 mb-2">Color</h4>
          <div className="grid grid-cols-4 gap-2">
            {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-slate-700 hover:scale-105'
                  }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Brush Size */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-slate-400 mb-2">Brush Size</h4>
          <input
            type="range"
            min="1"
            max="10"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-slate-500 text-center mt-1">{brushSize}px</div>
        </div>

        {/* Clear Button */}
        <Button
          onClick={clearCanvas}
          variant="outline"
          className="w-full mt-6 border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-4 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="w-full h-full bg-white rounded-lg shadow-2xl cursor-crosshair"
        />

        {/* Remote Cursor Overlays */}
        {Array.from(remoteCursors.entries()).map(([userId, cursorData]) => {
          if (!cursorData.isDrawing) return null

          const userName = cursorData.user?.firstName || cursorData.user?.email || 'User'
          const userColor = getUserColor(userId)

          return (
            <div
              key={userId}
              className="absolute pointer-events-none"
              style={{
                left: `${cursorData.x}px`,
                top: `${cursorData.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Cursor Circle */}
              <div
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: userColor }}
              />
              {/* User Name Label */}
              <div
                className="absolute left-4 -top-2 px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap shadow-lg"
                style={{ backgroundColor: userColor }}
              >
                {userName}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
