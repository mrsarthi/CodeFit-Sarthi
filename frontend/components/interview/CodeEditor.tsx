'use client'

import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useAuthStore } from '@/lib/store'

interface CodeEditorProps {
  interviewId: string
  socket: any
}

export default function CodeEditor({ interviewId, socket }: CodeEditorProps) {
  const user = useAuthStore((state) => state.user)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const isRemoteUpdateRef = useRef(false) // Use ref instead of state for synchronous flag
  const [code, setCode] = useState('// Start coding here...\n')
  const [language, setLanguage] = useState('javascript')
  const [cursors, setCursors] = useState<Map<string, { position: any; user: any }>>(new Map())
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const decorationsRef = useRef<Map<string, string[]>>(new Map())

  useEffect(() => {
    if (!socket || !user) {
      console.log('CodeEditor: No socket or user, skipping setup')
      return
    }

    console.log('CodeEditor: Setting up socket listeners for user:', user.id, 'socket connected:', socket.connected, 'socket id:', socket.id)

    // Remove any existing listeners first to avoid duplicates
    socket.off('code:change')
    socket.off('code:cursor')

    // Listen for code changes from other participants
    socket.on('code:change', (data: any) => {
      console.log('CodeEditor: Received code:change:', data, 'current user:', user.id)

      if (data.userId !== user?.id && data.userId) {
        console.log('CodeEditor: Applying remote code change from user:', data.userId)
        // Apply changes from remote user
        const changes = data.changes
        if (editorRef.current && changes && changes.length > 0) {
          // CRITICAL: Set flag BEFORE setValue to prevent triggering onChange
          isRemoteUpdateRef.current = true

          const model = editorRef.current.getModel()
          if (model) {
            // Save current cursor position and selection
            const position = editorRef.current.getPosition()
            const selection = editorRef.current.getSelection()

            // Set the full content from remote changes
            model.setValue(changes[0].text || '')

            // Restore cursor position and selection
            if (position) {
              editorRef.current.setPosition(position)
            }
            if (selection) {
              editorRef.current.setSelection(selection)
            }
          }

          // Reset the flag after a short delay
          setTimeout(() => { isRemoteUpdateRef.current = false }, 100)
        }
      } else {
        console.log('CodeEditor: Ignoring code change - same user or invalid ID. data.userId:', data.userId, 'user?.id:', user?.id)
      }
    })

    // Listen for cursor positions
    socket.on('code:cursor', (data: any) => {
      console.log('CodeEditor: Received cursor update:', data, 'current user:', user.id)
      if (data.userId !== user?.id && editorRef.current) {
        setCursors((prev) => {
          const newCursors = new Map(prev)
          newCursors.set(data.userId, {
            position: data.cursor,
            user: data.user,
          })

          // Update cursor decorations
          updateCursorDecorations(newCursors)

          return newCursors
        })
      }
    })

    // Listen for initial state
    socket.on('interview:init-state', (data: any) => {
      console.log('CodeEditor: Received init state:', data)
      if (data.code) {
        setCode(data.code)
        if (editorRef.current) {
          editorRef.current.setValue(data.code)
        }
      }
    })

    return () => {
      socket.off('code:change')
      socket.off('code:cursor')
      socket.off('interview:init-state')
      // Clear any pending timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [socket, user])

  // Function to update cursor decorations in Monaco Editor
  const updateCursorDecorations = (cursorsMap: Map<string, { position: any; user: any }>) => {
    const editor = editorRef.current
    if (!editor) return

    // Clear old decorations
    decorationsRef.current.forEach((decorationIds, userId) => {
      editor.deltaDecorations(decorationIds, [])
    })
    decorationsRef.current.clear()

    // Add new decorations for each remote cursor
    cursorsMap.forEach((cursorData, userId) => {
      const { position, user: remoteUser } = cursorData
      if (!position || !remoteUser) return

      const userName = remoteUser.firstName || remoteUser.email || 'User'
      const userColor = getUserColor(userId)

      // Create cursor line decoration with label
      const decorations = editor.deltaDecorations([], [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column + 1, // Make it 1 character wide for visibility
          },
          options: {
            className: `remote-cursor-${userId.replace(/[^a-zA-Z0-9]/g, '')}`,
            afterContentClassName: `remote-cursor-label-${userId.replace(/[^a-zA-Z0-9]/g, '')}`,
            stickiness: 1,
          },
        },
      ])

      decorationsRef.current.set(userId, decorations)

      // Inject custom CSS for this cursor
      injectCursorStyles(userId, userColor, userName)
    })
  }

  // Generate consistent color for each user
  const getUserColor = (userId: string) => {
    const colors = [
      '#3b82f6', // blue
      '#ef4444', // red
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
    ]

    // Simple hash function to get consistent color for user
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Inject CSS styles for cursor decorations
  const injectCursorStyles = (userId: string, color: string, userName: string) => {
    const styleId = `cursor-style-${userId}`
    const safeUserId = userId.replace(/[^a-zA-Z0-9]/g, '')
    let styleEl = document.getElementById(styleId) as HTMLStyleElement

    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }

    styleEl.textContent = `
      .remote-cursor-${safeUserId} {
        background-color: ${color}33 !important;
        border-left: 2px solid ${color} !important;
        position: relative;
      }
      .remote-cursor-label-${safeUserId}::after {
        content: "${userName}";
        position: absolute;
        top: -22px;
        left: 0;
        background: ${color};
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
        z-index: 10000;
        pointer-events: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
    `
  }

  // Handle socket connection changes
  useEffect(() => {
    if (!socket || !user) return

    console.log('CodeEditor: Socket changed, checking connection and listeners')

    // If socket just became connected, make sure listeners are set up
    if (socket.connected && !socket.hasListeners('code:change')) {
      console.log('CodeEditor: Setting up listeners for newly connected socket')

      socket.on('code:change', (data: any) => {
        console.log('CodeEditor: Received code:change:', data)
        console.log('CodeEditor: Comparing data.userId:', data.userId, 'with user?.id:', user?.id, 'types:', typeof data.userId, typeof user?.id)

        if (data.userId !== user?.id && data.userId) {
          console.log('CodeEditor: Applying remote code change from user:', data.userId)
          // Apply changes from remote user
          const changes = data.changes
          if (editorRef.current && changes && changes.length > 0) {
            isRemoteUpdateRef.current = true
            const model = editorRef.current.getModel()
            if (model) {
              // Set the full content from remote changes
              model.setValue(changes[0].text || '')
            }
            // Reset the flag after a short delay
            setTimeout(() => { isRemoteUpdateRef.current = false }, 100)
          }
        } else {
          console.log('CodeEditor: Ignoring code change - same user or invalid ID. data.userId:', data.userId, 'user?.id:', user?.id)
        }
      })

      socket.on('code:cursor', (data: any) => {
        if (data.userId !== user?.id) {
          setCursors((prev) => {
            const newCursors = new Map(prev)
            newCursors.set(data.userId, {
              position: data.cursor,
              user: data.user,
            })
            return newCursors
          })
        }
      })
    }
  }, [socket?.connected, user])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor

    // Track cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (socket && user?.id && !isRemoteUpdateRef.current) {
        const position = editor.getPosition()
        if (position) {
          socket.emit('code:cursor', {
            interviewId,
            cursor: {
              lineNumber: position.lineNumber,
              column: position.column,
            },
            userId: user.id,
            user: {
              id: user.id,
              firstName: user.firstName,
              email: user.email,
            },
          })
        }
      }
    })

    // Listen for local changes with debouncing
    editor.onDidChangeModelContent(() => {
      // Don't emit if this is a remote update
      if (isRemoteUpdateRef.current) return

      const model = editor.getModel()
      if (model) {
        const currentCode = model.getValue()
        setCode(currentCode)

        // Clear existing timeout
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }

        // Debounce the change emission
        debounceTimeoutRef.current = setTimeout(() => {
          console.log('CodeEditor: Attempting to emit, socket status:', {
            socketExists: !!socket,
            socketConnected: socket?.connected,
            socketId: socket?.id,
            userId: user?.id,
            interviewId,
            currentCodeLength: currentCode.length
          })

          if (socket && user?.id) {
            console.log('CodeEditor: Socket and user available, emitting code:change, socket id:', socket.id)
            const eventData = {
              interviewId,
              changes: [{ text: currentCode }],
              userId: user.id,
            }
            console.log('CodeEditor: Event data:', eventData)
            socket.emit('code:change', eventData)
            console.log('CodeEditor: Code change event emitted successfully')
          } else {
            console.log('CodeEditor: Cannot emit - missing socket or user', {
              socket: !!socket,
              socketConnected: socket?.connected,
              socketId: socket?.id,
              userId: user?.id,
            })
          }
        }, 300) // 300ms debounce
      }
    })

    // Listen for cursor position changes (send immediately, no debouncing)
    editor.onDidChangeCursorPosition((e) => {
      if (socket && user?.id) {
        socket.emit('code:cursor', {
          interviewId,
          cursor: {
            lineNumber: e.position.lineNumber,
            column: e.position.column,
          },
          userId: user.id,
          user: user,
        })
      }
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-2 flex items-center gap-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        <div className="text-sm text-muted-foreground">
          {cursors.size} participant{cursors.size !== 1 ? 's' : ''} editing
        </div>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}
