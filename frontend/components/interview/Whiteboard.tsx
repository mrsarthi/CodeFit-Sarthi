'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'

// Dynamically import Konva components to avoid SSR issues
const Stage = dynamic(() => import('react-konva').then((mod) => mod.Stage), { ssr: false })
const Layer = dynamic(() => import('react-konva').then((mod) => mod.Layer), { ssr: false })
const Line = dynamic(() => import('react-konva').then((mod) => mod.Line), { ssr: false })
const Rect = dynamic(() => import('react-konva').then((mod) => mod.Rect), { ssr: false })
const Circle = dynamic(() => import('react-konva').then((mod) => mod.Circle), { ssr: false })

interface WhiteboardProps {
  interviewId: string
  socket: any
}

interface Drawing {
  tool: 'pen' | 'rectangle' | 'circle'
  points: number[]
  color: string
  strokeWidth: number
}

export default function Whiteboard({ interviewId, socket }: WhiteboardProps) {
  const user = useAuthStore((state) => state.user)
  const stageRef = useRef<any>(null)
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [tool, setTool] = useState<'pen' | 'rectangle' | 'circle'>('pen')
  const [color, setColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateDimensions = () => {
        setDimensions({
          width: window.innerWidth * 0.67,
          height: window.innerHeight - 200,
        })
      }
      updateDimensions()
      window.addEventListener('resize', updateDimensions)
      return () => window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  useEffect(() => {
    if (!socket || !user) return

    const setup = () => {
      try {
        socket.off('whiteboard:draw')
        socket.off('whiteboard:clear')

        socket.on('whiteboard:draw', (data: any) => {
          if (data.userId !== user.id) {
            setDrawings((prev) => [...prev, data.drawing])
          }
        })

        socket.on('whiteboard:clear', () => {
          setDrawings([])
        })

        console.log('Whiteboard(Konva): Socket listeners attached')
      } catch (err) {
        console.warn('Whiteboard(Konva): Error attaching socket listeners', err)
      }
    }

    // Attach now if connected
    if (socket.connected) setup()
    socket.on('connect', setup)

    return () => {
      socket.off('connect', setup)
      socket.off('whiteboard:draw')
      socket.off('whiteboard:clear')
    }
  }, [socket, user])

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage()
    const point = stage.getPointerPosition()

    setIsDrawing(true)
    setStartPos(point)

    if (tool === 'pen') {
      const newDrawing: Drawing = {
        tool: 'pen',
        points: [point.x, point.y],
        color,
        strokeWidth,
      }
      setCurrentDrawing(newDrawing)
    } else {
      const newDrawing: Drawing = {
        tool,
        points: [point.x, point.y, point.x, point.y],
        color,
        strokeWidth,
      }
      setCurrentDrawing(newDrawing)
    }
  }

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return

    const stage = e.target.getStage()
    const point = stage.getPointerPosition()

    if (tool === 'pen' && currentDrawing) {
      const newPoints = [...currentDrawing.points, point.x, point.y]
      setCurrentDrawing({ ...currentDrawing, points: newPoints })
    } else if (currentDrawing) {
      const newPoints = [...currentDrawing.points]
      newPoints[2] = point.x
      newPoints[3] = point.y
      setCurrentDrawing({ ...currentDrawing, points: newPoints })
    }
  }

  const handleMouseUp = () => {
    if (currentDrawing) {
      setDrawings((prev) => [...prev, currentDrawing])

      // Broadcast drawing to other participants
      if (socket) {
        socket.emit('whiteboard:draw', {
          interviewId,
          drawing: currentDrawing,
        })
      }
    }

    setIsDrawing(false)
    setCurrentDrawing(null)
  }

  const handleClear = () => {
    setDrawings([])
    if (socket) {
      socket.emit('whiteboard:clear', { interviewId })
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-2 flex items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={tool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('pen')}
          >
            Pen
          </Button>
          <Button
            variant={tool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('rectangle')}
          >
            Rectangle
          </Button>
          <Button
            variant={tool === 'circle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('circle')}
          >
            Circle
          </Button>
        </div>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-16 border rounded"
        />
        <input
          type="range"
          min="1"
          max="10"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-24"
        />
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
      <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          ref={stageRef}
        >
          <Layer>
            {drawings.map((drawing, index) => {
              if (drawing.tool === 'pen') {
                return (
                  <Line
                    key={index}
                    points={drawing.points}
                    stroke={drawing.color}
                    strokeWidth={drawing.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                  />
                )
              } else if (drawing.tool === 'rectangle') {
                const [x1, y1, x2, y2] = drawing.points
                return (
                  <Rect
                    key={index}
                    x={Math.min(x1, x2)}
                    y={Math.min(y1, y2)}
                    width={Math.abs(x2 - x1)}
                    height={Math.abs(y2 - y1)}
                    stroke={drawing.color}
                    strokeWidth={drawing.strokeWidth}
                  />
                )
              } else if (drawing.tool === 'circle') {
                const [x1, y1, x2, y2] = drawing.points
                const radius = Math.sqrt(
                  Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
                )
                return (
                  <Circle
                    key={index}
                    x={x1}
                    y={y1}
                    radius={radius}
                    stroke={drawing.color}
                    strokeWidth={drawing.strokeWidth}
                  />
                )
              }
              return null
            })}
            {currentDrawing && (
              <>
                {currentDrawing.tool === 'pen' && (
                  <Line
                    points={currentDrawing.points}
                    stroke={currentDrawing.color}
                    strokeWidth={currentDrawing.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                  />
                )}
                {currentDrawing.tool === 'rectangle' && (
                  <Rect
                    x={Math.min(currentDrawing.points[0], currentDrawing.points[2])}
                    y={Math.min(currentDrawing.points[1], currentDrawing.points[3])}
                    width={Math.abs(currentDrawing.points[2] - currentDrawing.points[0])}
                    height={Math.abs(currentDrawing.points[3] - currentDrawing.points[1])}
                    stroke={currentDrawing.color}
                    strokeWidth={currentDrawing.strokeWidth}
                  />
                )}
                {currentDrawing.tool === 'circle' && (
                  <Circle
                    x={currentDrawing.points[0]}
                    y={currentDrawing.points[1]}
                    radius={Math.sqrt(
                      Math.pow(currentDrawing.points[2] - currentDrawing.points[0], 2) +
                      Math.pow(currentDrawing.points[3] - currentDrawing.points[1], 2)
                    )}
                    stroke={currentDrawing.color}
                    strokeWidth={currentDrawing.strokeWidth}
                  />
                )}
              </>
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
