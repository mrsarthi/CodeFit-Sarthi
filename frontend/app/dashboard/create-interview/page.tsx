'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'

export default function CreateInterviewPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    participantIds: [] as string[],
  })
  const [candidates, setCandidates] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role !== 'INTERVIEWER') {
      router.push('/dashboard')
    }
  }, [user])

  const searchCandidates = async (query: string) => {
    if (query.length < 2) return

    try {
      const response = await api.get(`/users/search?q=${query}`)
      const filtered = response.data.filter(
        (u: any) => u.role === 'JOB_SEEKER' && u.id !== user?.id
      )
      setCandidates(filtered)
    } catch (error) {
      console.error('Failed to search candidates:', error)
    }
  }

  const handleAddParticipant = (candidateId: string) => {
    if (!formData.participantIds.includes(candidateId)) {
      setFormData({
        ...formData,
        participantIds: [...formData.participantIds, candidateId],
      })
    }
  }

  const handleRemoveParticipant = (candidateId: string) => {
    setFormData({
      ...formData,
      participantIds: formData.participantIds.filter((id) => id !== candidateId),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/interviews', formData)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create interview')
    } finally {
      setLoading(false)
    }
  }

  const selectedCandidates = candidates.filter((c) =>
    formData.participantIds.includes(c.id)
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Interview</CardTitle>
          <CardDescription>
            Schedule a new technical interview session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Senior Developer Interview"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Interview description..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Scheduled Date & Time (Optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledAt: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Add Candidates</Label>
              <Input
                placeholder="Search for candidates..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchCandidates(e.target.value)
                }}
              />
              {candidates.length > 0 && (
                <div className="border rounded-md p-2 space-y-1 max-h-40 overflow-y-auto">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between p-2 hover:bg-accent rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {candidate.firstName} {candidate.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                      </div>
                      {formData.participantIds.includes(candidate.id) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveParticipant(candidate.id)}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAddParticipant(candidate.id)}
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedCandidates.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Candidates</Label>
                <div className="space-y-2">
                  {selectedCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {candidate.firstName} {candidate.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveParticipant(candidate.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || formData.participantIds.length === 0}>
                {loading ? 'Creating...' : 'Create Interview'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

