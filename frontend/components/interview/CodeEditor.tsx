'use client'

import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import { Play, Loader2, Terminal, X } from 'lucide-react'

interface CodeEditorProps {
  interviewId: string
  socket: any
}

// Language mapping for Judge0 with comment syntax
const LANGUAGES = [
  { id: 63, name: 'JavaScript', monaco: 'javascript', comment: '//' },
  { id: 71, name: 'Python', monaco: 'python', comment: '#' },
  { id: 62, name: 'Java', monaco: 'java', comment: '//' },
  { id: 54, name: 'C++', monaco: 'cpp', comment: '//' },
  { id: 50, name: 'C', monaco: 'c', comment: '//' },
  { id: 74, name: 'TypeScript', monaco: 'typescript', comment: '//' },
]

// Generate initial code template based on language
const getInitialCode = (lang: typeof LANGUAGES[0]) => {
  return `${lang.comment} Start coding here...\n`
}

export default function CodeEditor({ interviewId, socket }: CodeEditorProps) {
  const user = useAuthStore((state) => state.user)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const isRemoteUpdateRef = useRef(false)
  const [code, setCode] = useState('// Start coding here...\n')
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [cursors, setCursors] = useState<Map<string, { position: any; user: any }>>(new Map())
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const decorationsRef = useRef<Map<string, string[]>>(new Map())

  // Code execution state
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stdin, setStdin] = useState('')
  const [showOutput, setShowOutput] = useState(false)
  const [executionTime, setExecutionTime] = useState<string | null>(null)
  const [executionMemory, setExecutionMemory] = useState<number | null>(null)

  useEffect(() => {
    if (!socket || !user) {
      console.log('CodeEditor: No socket or user, skipping setup')
      return
    }

    console.log('CodeEditor: Setting up socket listeners for user:', user.id, 'socket connected:', socket.connected, 'socket id:', socket.id)

    socket.off('code:change')
    socket.off('code:cursor')
    socket.off('code:language-change')

    socket.on('code:change', (data: any) => {
      console.log('CodeEditor: Received code:change:', data, 'current user:', user.id)

      if (data.userId !== user?.id && data.userId) {
        console.log('CodeEditor: Applying remote code change from user:', data.userId)
        const changes = data.changes
        if (editorRef.current && changes && changes.length > 0) {
          isRemoteUpdateRef.current = true

          const model = editorRef.current.getModel()
          if (model) {
            const position = editorRef.current.getPosition()
            const selection = editorRef.current.getSelection()

            model.setValue(changes[0].text || '')

            if (position) {
              editorRef.current.setPosition(position)
            }
            if (selection) {
              editorRef.current.setSelection(selection)
            }
          }

          setTimeout(() => { isRemoteUpdateRef.current = false }, 100)
        }
      }
    })

    socket.on('code:cursor', (data: any) => {
      if (data.userId !== user?.id && editorRef.current) {
        setCursors((prev) => {
          const newCursors = new Map(prev)
          newCursors.set(data.userId, {
            position: data.cursor,
            user: data.user,
          })
          updateCursorDecorations(newCursors)
          return newCursors
        })
      }
    })

    // Listen for language changes from other participants
    socket.on('code:language-change', (data: { language: typeof LANGUAGES[0]; userId: string; newCode?: string }) => {
      console.log('CodeEditor: Received code:language-change from user:', data.userId, 'language:', data.language.name)
      if (data.userId !== user?.id) {
        setLanguage(data.language)
        // Update code with new template if provided
        if (data.newCode) {
          setCode(data.newCode)
          if (editorRef.current) {
            isRemoteUpdateRef.current = true
            editorRef.current.setValue(data.newCode)
            setTimeout(() => { isRemoteUpdateRef.current = false }, 100)
          }
        }
      }
    })

    // Listen for output/execution results from other participants
    socket.on('code:output', (data: { output: string | null; error: string | null; isRunning: boolean; executionTime: string | null; executionMemory: number | null; userId: string }) => {
      console.log('CodeEditor: Received code:output from user:', data.userId)
      if (data.userId !== user?.id) {
        setShowOutput(true)
        setIsRunning(data.isRunning)
        setOutput(data.output)
        setError(data.error)
        setExecutionTime(data.executionTime)
        setExecutionMemory(data.executionMemory)
      }
    })

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
      socket.off('code:language-change')
      socket.off('code:output')
      socket.off('interview:init-state')
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [socket, user])

  const updateCursorDecorations = (cursorsMap: Map<string, { position: any; user: any }>) => {
    const editor = editorRef.current
    if (!editor) return

    decorationsRef.current.forEach((decorationIds) => {
      editor.deltaDecorations(decorationIds, [])
    })
    decorationsRef.current.clear()

    cursorsMap.forEach((cursorData, oduserId) => {
      const { position, user: remoteUser } = cursorData
      if (!position || !remoteUser) return

      const userName = remoteUser.firstName || remoteUser.email || 'User'
      const userColor = getUserColor(oduserId)

      const decorations = editor.deltaDecorations([], [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column + 1,
          },
          options: {
            className: `remote-cursor-${oduserId.replace(/[^a-zA-Z0-9]/g, '')}`,
            afterContentClassName: `remote-cursor-label-${oduserId.replace(/[^a-zA-Z0-9]/g, '')}`,
            stickiness: 1,
          },
        },
      ])

      decorationsRef.current.set(oduserId, decorations)
      injectCursorStyles(oduserId, userColor, userName)
    })
  }

  const getUserColor = (oduserId: string) => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']
    let hash = 0
    for (let i = 0; i < oduserId.length; i++) {
      hash = oduserId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const injectCursorStyles = (oduserId: string, color: string, userName: string) => {
    const styleId = `cursor-style-${oduserId}`
    const safeUserId = oduserId.replace(/[^a-zA-Z0-9]/g, '')
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

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor

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

    editor.onDidChangeModelContent(() => {
      if (isRemoteUpdateRef.current) return

      const model = editor.getModel()
      if (model) {
        const currentCode = model.getValue()
        setCode(currentCode)

        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }

        debounceTimeoutRef.current = setTimeout(() => {
          if (socket && user?.id) {
            socket.emit('code:change', {
              interviewId,
              changes: [{ text: currentCode }],
              userId: user.id,
            })
          }
        }, 300)
      }
    })
  }

  // Run code function
  const runCode = async () => {
    setIsRunning(true)
    setOutput(null)
    setError(null)
    setShowOutput(true)
    setExecutionTime(null)
    setExecutionMemory(null)

    // Broadcast that execution started to other participants
    if (socket && user?.id) {
      socket.emit('code:output', {
        interviewId,
        output: null,
        error: null,
        isRunning: true,
        executionTime: null,
        executionMemory: null,
      })
    }

    let finalOutput: string | null = null
    let finalError: string | null = null
    let finalTime: string | null = null
    let finalMemory: number | null = null

    try {
      const response = await api.post('/code/execute', {
        sourceCode: code,
        languageId: language.id,
        stdin: stdin || undefined,
      })

      const result = response.data
      console.log('Code execution result:', result)

      // Handle successful execution (status 3 = Accepted)
      if (result.status?.id === 3 || (result.stdout && !result.stderr && !result.compile_output)) {
        // Accepted - successful execution
        finalOutput = result.stdout || '(No output)'
        finalTime = result.time
        finalMemory = result.memory
        setOutput(finalOutput)
        setExecutionTime(finalTime)
        setExecutionMemory(finalMemory)
      } else if (result.status?.id === 6) {
        // Compilation error
        finalError = `Compilation Error:\n${result.compileOutput || result.compile_output || result.message}`
        setError(finalError)
      } else if (result.status?.id === 11) {
        // Runtime error
        finalError = `Runtime Error:\n${result.stderr || result.message}`
        setError(finalError)
      } else if (result.status?.id === 5) {
        // Time limit exceeded
        finalError = 'Time Limit Exceeded'
        setError(finalError)
      } else if (result.stdout) {
        // Fallback: if we have stdout, show it
        finalOutput = result.stdout
        finalTime = result.time
        finalMemory = result.memory
        setOutput(finalOutput)
        setExecutionTime(finalTime)
        setExecutionMemory(finalMemory)
      } else {
        // Other error
        finalError = result.stderr || result.compileOutput || result.compile_output || result.message || `Error: ${result.status?.description || 'Unknown error'}`
        setError(finalError)
      }
    } catch (err: any) {
      console.error('Code execution error:', err)
      finalError = err.response?.data?.message || 'Failed to execute code. Please try again.'
      setError(finalError)
    } finally {
      setIsRunning(false)

      // Broadcast final output to all participants
      if (socket && user?.id) {
        socket.emit('code:output', {
          interviewId,
          output: finalOutput,
          error: finalError,
          isRunning: false,
          executionTime: finalTime,
          executionMemory: finalMemory,
        })
      }
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-slate-700 bg-slate-900/50 p-2 flex items-center gap-3">
        <select
          value={language.id}
          onChange={(e) => {
            const lang = LANGUAGES.find(l => l.id === Number(e.target.value))
            if (lang) {
              setLanguage(lang)

              // Update code template with correct comment syntax for the new language
              const newCode = getInitialCode(lang)
              setCode(newCode)
              if (editorRef.current) {
                editorRef.current.setValue(newCode)
              }

              // Emit language change to other participants with the new code
              if (socket && user?.id) {
                socket.emit('code:language-change', {
                  interviewId,
                  language: lang,
                  newCode: newCode,
                })
              }
            }
          }}
          className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>{lang.name}</option>
          ))}
        </select>

        <button
          onClick={runCode}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Code
            </>
          )}
        </button>

        <div className="flex-1" />

        <div className="text-sm text-slate-400">
          {cursors.size} participant{cursors.size !== 1 ? 's' : ''} editing
        </div>
      </div>

      {/* Editor and Output Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Code Editor */}
        <div className={`${showOutput ? 'h-1/2' : 'flex-1'} min-h-0`}>
          <Editor
            height="100%"
            language={language.monaco}
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

        {/* Output Panel */}
        {showOutput && (
          <div className="h-1/2 border-t border-slate-700 bg-slate-950 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/50 border-b border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Terminal className="w-4 h-4" />
                <span>Output</span>
                {executionTime && (
                  <span className="text-xs text-slate-500">
                    Time: {executionTime}s | Memory: {executionMemory ? `${(executionMemory / 1024).toFixed(2)} MB` : 'N/A'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowOutput(false)}
                className="p-1 hover:bg-slate-800 rounded transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Stdin Input */}
            <div className="px-3 py-2 bg-slate-900/30 border-b border-slate-800">
              <input
                type="text"
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Standard Input (stdin) - optional"
                className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Output Content */}
            <div className="flex-1 p-3 overflow-auto font-mono text-sm">
              {isRunning ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing code...
                </div>
              ) : error ? (
                <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>
              ) : output ? (
                <pre className="text-emerald-400 whitespace-pre-wrap">{output}</pre>
              ) : (
                <span className="text-slate-500">Click "Run Code" to execute</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
