'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getStoredActiveProjectId,
  persistActiveProject,
  PROJECT_SELECTION_EVENT,
  type ProjectSelectionDetail,
} from '@/lib/projects/selection'

type BriefHeadingNode = { text?: string } | string | null
type BriefEntityNode = { term?: string; name?: string } | string | null
type BriefFaqNode = { question?: string } | string | null

interface Brief {
  id: string
  project: { id: string; name: string }
  cluster?: { id: string; label: string }
  targetKeyword?: { id: string; term: string }
  headings?: BriefHeadingNode[]
  entities?: BriefEntityNode[]
  faq?: BriefFaqNode[]
  recommendedWordCount?: number
  createdAt: string
  drafts: Draft[]
}

interface Draft {
  id: string
  title?: string
  status: string
  wordCount: number
  seoScore?: number
  version: number
  createdAt: string
  project: { id: string; name: string }
  brief?: { id: string; targetKeyword?: { term: string } }
}

interface Project {
  id: string
  name: string
}

interface Keyword {
  id: string
  term: string
}

interface BriefSubmitPayload {
  projectId?: string
  targetKeywordId?: string
  headings: { text: string }[]
  entities: { term: string }[]
  faq: { question: string }[]
  internalLinks?: unknown[]
  externalRefs?: unknown[]
  recommendedWordCount: number
  id?: string
}

export default function ContentPage() {
  const router = useRouter()
  const [view, setView] = useState<'briefs' | 'drafts'>('briefs')
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showCreateBrief, setShowCreateBrief] = useState(false)
  const [projectKeywords, setProjectKeywords] = useState<Keyword[]>([])
  const [editingBriefId, setEditingBriefId] = useState<string | null>(null)
  const [generatingDraftId, setGeneratingDraftId] = useState<string | null>(null)
  const [generationState, setGenerationState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [generationMessage, setGenerationMessage] = useState<string | null>(null)
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null)

  const [briefForm, setBriefForm] = useState({
    targetKeywordId: '',
    recommendedWordCount: '1500',
    headings: '',
    entities: '',
    faq: '',
  })

  const isEditing = Boolean(editingBriefId)

  const resetBriefForm = useCallback(
    (preserveKeyword = true) => {
      setBriefForm({
        targetKeywordId: preserveKeyword ? projectKeywords[0]?.id || '' : '',
        recommendedWordCount: '1500',
        headings: '',
        entities: '',
        faq: '',
      })
    },
    [projectKeywords]
  )

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      if (data.success && data.data.length > 0) {
        setProjects(data.data)
        const storedProjectId = getStoredActiveProjectId()
        const hasStoredProject = storedProjectId && data.data.some((project: Project) => project.id === storedProjectId)
        const nextProjectId = hasStoredProject ? storedProjectId! : data.data[0].id
        setSelectedProject(nextProjectId)
        if (!hasStoredProject) {
          persistActiveProject(nextProjectId, { broadcast: false })
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProjectKeywords = useCallback(async () => {
    if (!selectedProject) return

    try {
      const params = new URLSearchParams({
        projectId: selectedProject,
        pageSize: '100',
      })

      const response = await fetch(`/api/keywords?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        if (Array.isArray(data.data)) {
          const keywordList = data.data
            .filter(
              (keyword: unknown): keyword is { id: string; term: string } =>
                typeof keyword === 'object' &&
                keyword !== null &&
                'id' in keyword &&
                'term' in keyword &&
                typeof (keyword as { id: unknown }).id === 'string' &&
                typeof (keyword as { term: unknown }).term === 'string'
            )
            .map((keyword) => ({ id: keyword.id, term: keyword.term }))

          setProjectKeywords(keywordList)

          if (!isEditing && !briefForm.targetKeywordId && keywordList.length > 0) {
            setBriefForm((prev) => ({ ...prev, targetKeywordId: keywordList[0].id }))
          }
        } else {
          setProjectKeywords([])
        }
      }
    } catch (error) {
      console.error('Failed to fetch project keywords:', error)
    }
  }, [selectedProject, isEditing, briefForm.targetKeywordId])

  const fetchBriefs = useCallback(async () => {
    if (!selectedProject) return

    setLoading(true)
    try {
      const params = new URLSearchParams({ projectId: selectedProject })
      const response = await fetch(`/api/briefs?${params}`)
      const data = await response.json()

      if (data.success) {
        setBriefs(data.data.briefs)
        if (editingBriefId) {
          const updatedBrief = data.data.briefs.find((b: Brief) => b.id === editingBriefId)
          if (!updatedBrief) {
            setEditingBriefId(null)
            setShowCreateBrief(false)
            resetBriefForm(true)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch briefs:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedProject, editingBriefId, resetBriefForm])

  const fetchDrafts = useCallback(async () => {
    if (!selectedProject) return

    setLoading(true)
    try {
      const params = new URLSearchParams({ projectId: selectedProject })
      const response = await fetch(`/api/drafts?${params}`)
      const data = await response.json()

      if (data.success) {
        setDrafts(data.data.drafts)
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedProject])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (selectedProject) {
      fetchBriefs()
      fetchDrafts()
    }
  }, [selectedProject, fetchBriefs, fetchDrafts])

  useEffect(() => {
    if (selectedProject) {
      fetchProjectKeywords()
    }
  }, [selectedProject, fetchProjectKeywords])

  useEffect(() => {
    if (generationState === 'success' || generationState === 'error') {
      const timeout = setTimeout(() => {
        setGenerationState('idle')
        setGenerationMessage(null)
      }, 6000)

      return () => clearTimeout(timeout)
    }
  }, [generationState])

  const handleSubmitBrief = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Parse headings, entities, and FAQ from text input
      const headings = briefForm.headings
        .split('\n')
        .filter(h => h.trim())
        .map(h => ({ text: h.trim() }))

      const entities = briefForm.entities
        .split(',')
        .filter(e => e.trim())
        .map(e => ({ term: e.trim() }))

      const faq = briefForm.faq
        .split('\n')
        .filter(f => f.trim())
        .map(f => ({ question: f.trim() }))

      const trimmedBriefId = editingBriefId ? editingBriefId.trim() : ''
      const isUpdate = isEditing && Boolean(trimmedBriefId)

      const endpoint = isUpdate ? `/api/briefs/${trimmedBriefId}` : '/api/briefs'
      const method = isUpdate ? 'PATCH' : 'POST'

      if (isEditing && !isUpdate) {
        alert('Missing brief identifier; please retry from the briefs list.')
        return
      }

      const trimmedKeywordId = briefForm.targetKeywordId?.trim()

      const payload: BriefSubmitPayload = {
        targetKeywordId: trimmedKeywordId || undefined,
        headings,
        entities,
        faq,
        recommendedWordCount: parseInt(briefForm.recommendedWordCount) || 1500,
      }

      if (!isUpdate) {
        payload.projectId = selectedProject
        payload.internalLinks = [] as unknown[]
        payload.externalRefs = [] as unknown[]
      } else {
        payload.id = trimmedBriefId
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        setShowCreateBrief(false)
        setEditingBriefId(null)
        resetBriefForm(true)
        fetchBriefs()
      } else {
        alert('Failed to save brief: ' + (data.error?.message || data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving brief:', error)
      alert('Failed to save brief')
    }
  }

  const handleGenerateDraft = async (briefId: string) => {
    if (generatingDraftId) {
      return
    }

    if (!confirm('This will use credits to generate a draft. Continue?')) {
      return
    }

    setGeneratingDraftId(briefId)
    setGenerationState('loading')
    setGenerationMessage('Generating draft… this can take up to a minute. You can continue working while we process it.')

    try {
      const response = await fetch(`/api/briefs/${briefId}/generate-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoScore: true }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setGenerationState('success')
        setGenerationMessage(
          `Draft generated! ${data.data.cost} credits used. SEO Score: ${data.data.draft.seoScore ?? 'N/A'}.`
        )
        fetchBriefs()
        fetchDrafts()
      } else {
        setGenerationState('error')
        setGenerationMessage(data.error?.message || data.error || 'Failed to generate draft')
      }
    } catch (error: unknown) {
      console.error('Error generating draft:', error)
      const message = error instanceof Error ? error.message : 'Failed to generate draft'
      setGenerationState('error')
      setGenerationMessage(message)
    } finally {
      setGeneratingDraftId(null)
    }
  }

  const handleEditBrief = (brief: Brief) => {
    setEditingBriefId(brief.id)

    const headingLines = Array.isArray(brief.headings)
      ? brief.headings
          .map((heading) => {
            if (!heading) return ''
            if (typeof heading === 'string') return heading
            return heading.text || ''
          })
          .filter(Boolean)
          .join('\n')
      : ''

    const entityList = Array.isArray(brief.entities)
      ? brief.entities
          .map((entity) => {
            if (!entity) return ''
            if (typeof entity === 'string') return entity
            return entity.term || ''
          })
          .filter(Boolean)
          .join(', ')
      : ''

    const faqLines = Array.isArray(brief.faq)
      ? brief.faq
          .map((item) => {
            if (!item) return ''
            if (typeof item === 'string') return item
            return item.question || ''
          })
          .filter(Boolean)
          .join('\n')
      : ''

    setBriefForm({
      targetKeywordId: brief.targetKeyword?.id || '',
      recommendedWordCount: String(brief.recommendedWordCount || 1500),
      headings: headingLines,
      entities: entityList,
      faq: faqLines,
    })

    setShowCreateBrief(true)
  }

  const handleViewDraft = (id?: string) => {
    if (!id) {
      setGenerationState('error')
      setGenerationMessage('Unable to open this draft. Please refresh and try again.')
      return
    }

    router.push(`/dashboard/content/drafts/${id}`)
  }

  const handleDeleteBrief = async (id: string) => {
    if (!id) {
      alert('Invalid brief identifier')
      return
    }

    if (!confirm('Delete this brief?')) return

    try {
      const response = await fetch(`/api/briefs/${id}`, { method: 'DELETE' })
      const data = await response.json()

      if (data.success) {
        if (editingBriefId === id) {
          setEditingBriefId(null)
          setShowCreateBrief(false)
          resetBriefForm(true)
        }
        fetchBriefs()
      } else {
        alert('Failed to delete brief')
      }
    } catch (error) {
      console.error('Error deleting brief:', error)
    }
  }

  const handleDeleteDraft = async (id: string) => {
    if (!confirm('Delete this draft?')) return

    setDeletingDraftId(id)
    setGenerationState('loading')
    setGenerationMessage('Deleting draft…')

    try {
      const response = await fetch(`/api/drafts/${id}`, { method: 'DELETE' })
      const data = await response.json()

      if (response.ok && data.success) {
        setGenerationState('success')
        setGenerationMessage('Draft deleted successfully.')
        fetchDrafts()
        fetchBriefs()
      } else {
        setGenerationState('error')
        setGenerationMessage(data.error?.message || data.error || 'Failed to delete draft')
      }
    } catch (error: unknown) {
      console.error('Error deleting draft:', error)
      const message = error instanceof Error ? error.message : 'Failed to delete draft'
      setGenerationState('error')
      setGenerationMessage(message)
    } finally {
      setDeletingDraftId(null)
    }
  }

  const getDifficultyColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      READY: 'bg-blue-100 text-blue-800',
      SCHEDULED: 'bg-purple-100 text-purple-800',
      EXPORTED: 'bg-green-100 text-green-800',
      PUBLISHED: 'bg-green-600 text-white',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading && !selectedProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content</h1>
          <p className="text-gray-500 mt-1">
            Create AI-powered content briefs and drafts
          </p>
        </div>
        {view === 'briefs' && (
          <Button
            onClick={() => {
              setEditingBriefId(null)
              resetBriefForm(true)
              setShowCreateBrief(true)
            }}
          >
            + New Brief
          </Button>
        )}
      </div>

      {/* Project Selector */}
      {projects.length > 0 && (
        <div className="flex gap-4 items-center">
          <Label>Project:</Label>
          <select
            value={selectedProject}
            onChange={(e) => handleProjectSelect(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setView('briefs')}
          className={`px-4 py-2 -mb-px ${
            view === 'briefs'
              ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
              : 'text-gray-600'
          }`}
        >
          Briefs ({briefs.length})
        </button>
        <button
          onClick={() => setView('drafts')}
          className={`px-4 py-2 -mb-px ${
            view === 'drafts'
              ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
              : 'text-gray-600'
          }`}
        >
          Drafts ({drafts.length})
        </button>
      </div>

      {generationMessage && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            generationState === 'loading'
              ? 'border-blue-200 bg-blue-50 text-blue-800'
              : generationState === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {generationMessage}
        </div>
      )}

      {/* Create Brief Form */}
      {showCreateBrief && (
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Content Brief' : 'Create Content Brief'}</CardTitle>
            <CardDescription>
              {isEditing
                ? 'Update the structure and metadata for this brief.'
                : 'Manually create a content brief (AI generation coming soon)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitBrief} className="space-y-4">
              <div>
                <Label htmlFor="targetKeyword">Target Keyword</Label>
                <select
                  id="targetKeyword"
                  value={briefForm.targetKeywordId}
                  onChange={(e) =>
                    setBriefForm({ ...briefForm, targetKeywordId: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  required={projectKeywords.length > 0}
                  disabled={projectKeywords.length === 0}
                >
                  {projectKeywords.length === 0 ? (
                    <option value="">No keywords available</option>
                  ) : (
                    projectKeywords.map((keyword) => (
                      <option key={keyword.id} value={keyword.id}>
                        {keyword.term}
                      </option>
                    ))
                  )}
                </select>
                {projectKeywords.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Add keywords to this project to select a target for the brief.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="wordCount">Recommended Word Count</Label>
                <Input
                  id="wordCount"
                  type="number"
                  value={briefForm.recommendedWordCount}
                  onChange={(e) =>
                    setBriefForm({ ...briefForm, recommendedWordCount: e.target.value })
                  }
                  placeholder="1500"
                />
              </div>

              <div>
                <Label htmlFor="headings">Headings (one per line)</Label>
                <textarea
                  id="headings"
                  value={briefForm.headings}
                  onChange={(e) =>
                    setBriefForm({ ...briefForm, headings: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 min-h-[100px]"
                  placeholder="Introduction&#10;Main Topic 1&#10;Main Topic 2&#10;Conclusion"
                />
              </div>

              <div>
                <Label htmlFor="entities">Key Entities/Topics (comma-separated)</Label>
                <Input
                  id="entities"
                  value={briefForm.entities}
                  onChange={(e) =>
                    setBriefForm({ ...briefForm, entities: e.target.value })
                  }
                  placeholder="SEO, content marketing, keyword research"
                />
              </div>

              <div>
                <Label htmlFor="faq">FAQ Questions (one per line)</Label>
                <textarea
                  id="faq"
                  value={briefForm.faq}
                  onChange={(e) =>
                    setBriefForm({ ...briefForm, faq: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 min-h-[80px]"
                  placeholder="What is SEO?&#10;How does keyword research work?"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">{isEditing ? 'Update Brief' : 'Create Brief'}</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateBrief(false)
                    setEditingBriefId(null)
                    resetBriefForm(true)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Briefs View */}
      {view === 'briefs' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading briefs...</div>
          ) : briefs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No briefs yet. Create your first brief to get started!
              </CardContent>
            </Card>
          ) : (
            briefs.map((brief) => {
              const draftsForBrief = drafts.filter(
                (draft) => draft.brief?.id === brief.id
              )

              return (
                <Card key={brief.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          {(
                            brief.targetKeyword?.term ||
                            brief.cluster?.label ||
                            (Array.isArray(brief.headings) && brief.headings[0]?.text) ||
                            'Untitled Brief'
                          ) as string}
                        </CardTitle>
                        <CardDescription>
                          Created {new Date(brief.createdAt).toLocaleDateString()} •
                          {brief.recommendedWordCount || 1500} words •
                          {draftsForBrief.length} draft(s)
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditBrief(brief)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleGenerateDraft(brief.id)}
                          disabled={Boolean(generatingDraftId)}
                        >
                          {generatingDraftId === brief.id ? 'Generating…' : 'Generate Draft'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBrief(brief.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {draftsForBrief.length > 0 ? (
                      <div className="space-y-3">
                        {draftsForBrief.map((draft) => (
                          <div
                            key={draft.id}
                            className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <p className="font-medium">
                                {draft.title || draft.brief?.targetKeyword?.term || 'Untitled Draft'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {draft.wordCount} words • v{draft.version} • Created {new Date(draft.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-400">
                                Status: {draft.status} • SEO Score: {draft.seoScore ?? 'N/A'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                             <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleViewDraft(draft.id)}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteDraft(draft.id)}
                                disabled={deletingDraftId === draft.id}
                              >
                                {deletingDraftId === draft.id ? 'Deleting…' : 'Delete'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No drafts yet. Generate a draft to get started.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Drafts View */}
      {view === 'drafts' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading drafts...</div>
          ) : drafts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No drafts yet. Generate a draft from a brief!
              </CardContent>
            </Card>
          ) : (
            drafts.map((draft) => (
              <Card key={draft.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle>
                        {draft.title || draft.brief?.targetKeyword?.term || 'Untitled Draft'}
                      </CardTitle>
                      <CardDescription>
                        {draft.wordCount} words •
                        v{draft.version} •
                        Created {new Date(draft.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-3 items-center">
                      {draft.seoScore !== null && (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getDifficultyColor(draft.seoScore)}`}>
                            {draft.seoScore}
                          </div>
                          <div className="text-xs text-gray-500">SEO Score</div>
                        </div>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(draft.status)}`}
                      >
                        {draft.status}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewDraft(draft.id)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDraft(draft.id)}
                        disabled={deletingDraftId === draft.id}
                      >
                        {deletingDraftId === draft.id ? 'Deleting…' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleProjectEvent = (event: Event) => {
      const detail = (event as CustomEvent<ProjectSelectionDetail>).detail
      if (!detail?.projectId) return

      setSelectedProject((current) => {
        if (current === detail.projectId) {
          return current
        }

        const exists = projects.some((project) => project.id === detail.projectId)
        return exists ? detail.projectId : current
      })
    }

    window.addEventListener(PROJECT_SELECTION_EVENT, handleProjectEvent as EventListener)
    return () => window.removeEventListener(PROJECT_SELECTION_EVENT, handleProjectEvent as EventListener)
  }, [projects])

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId)
    persistActiveProject(projectId)
  }
