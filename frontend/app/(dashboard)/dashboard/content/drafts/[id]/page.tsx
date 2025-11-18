'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DraftChecklistItem {
  category: string
  label: string
  status: 'pass' | 'warning' | 'fail'
  score: number
  message: string
}

type BriefHeadingNode = { text?: string | null } | string | null | undefined
type BriefEntityNode = { term?: string | null; name?: string | null } | string | null | undefined
type BriefFaqNode = { question?: string | null } | string | null | undefined

interface ExportBundleRecord {
  id: string
  format: 'MD' | 'HTML' | 'DOCX'
  url: string
  checksum?: string | null
  createdAt: string
}

interface LinkSuggestion {
  id: string
  anchorText: string
  relevanceScore: number
  accepted: boolean
  dismissed: boolean
  createdAt: string
  toDraft?: {
    id: string
    title?: string | null
    status?: string | null
  }
}

interface DraftDetail {
  id: string
  title?: string | null
  mdBody?: string | null
  htmlBody?: string | null
  wordCount: number
  version: number
  status: string
  seoScore?: number | null
  onpageChecklist?: {
    checklist?: DraftChecklistItem[]
    summary?: {
      passed: number
      warnings: number
      failed: number
    }
    lastCalculated?: string
  } | null
  createdAt: string
  updatedAt: string
  project: { id: string; name: string }
  brief?: {
    id: string
    targetKeyword?: { term: string | null }
    headings?: BriefHeadingNode[]
    entities?: BriefEntityNode[]
    faq?: BriefFaqNode[]
  } | null
  exports?: ExportBundleRecord[]
}

export default function DraftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [draft, setDraft] = useState<DraftDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [editorValue, setEditorValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [scoreMessage, setScoreMessage] = useState<string | null>(null)
  const [exportingFormat, setExportingFormat] = useState<'MD' | 'HTML' | null>(null)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [linksMessage, setLinksMessage] = useState<string | null>(null)
  const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null)

  useEffect(() => {
    const unwrapParams = async () => {
      const resolved = await params
      setResolvedParams(resolved)
    }

    unwrapParams()
  }, [params])

  const loadDraft = useCallback(async (draftId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/drafts/${draftId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setDraft(data.data)
        setEditorValue(data.data.mdBody || '')
      } else {
        const message =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || 'Failed to load draft'
        throw new Error(message)
      }
    } catch (err: unknown) {
      console.error('Failed to load draft', err)
      const message = err instanceof Error ? err.message : 'Failed to load draft'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLinkSuggestions = useCallback(async (draftId: string) => {
    try {
      setLinksLoading(true)
      const response = await fetch(`/api/links?draftId=${draftId}`)
      const data = await response.json()
      if (response.ok && data.success) {
        setLinkSuggestions(data.data.suggestions || [])
      } else {
        const message = data.error?.message || 'Failed to load link suggestions'
        setLinksMessage(message)
      }
    } catch (err) {
      console.error('Failed to fetch suggestions', err)
      setLinksMessage('Unable to load link suggestions')
    } finally {
      setLinksLoading(false)
    }
  }, [])

  useEffect(() => {
    if (resolvedParams?.id) {
      loadDraft(resolvedParams.id)
      fetchLinkSuggestions(resolvedParams.id)
    }
  }, [resolvedParams, loadDraft, fetchLinkSuggestions])

  useEffect(() => {
    if (!draft?.mdBody) return
    setEditorValue(draft.mdBody)
  }, [draft?.mdBody])

  useEffect(() => {
    if (!saveMessage && !scoreMessage && !exportMessage && !linksMessage) return
    const timeout = setTimeout(() => {
      setSaveMessage(null)
      setScoreMessage(null)
      setExportMessage(null)
      setLinksMessage(null)
    }, 5000)
    return () => clearTimeout(timeout)
  }, [saveMessage, scoreMessage, exportMessage, linksMessage])

  const handleSaveEdits = async () => {
    if (!draft?.id) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mdBody: editorValue }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setDraft(data.data)
        setSaveMessage('Draft updated successfully.')
      } else {
        throw new Error(data.error?.message || 'Failed to save draft')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save draft'
      setSaveMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReScore = async () => {
    if (!draft?.id) return
    setIsScoring(true)
    try {
      const response = await fetch(`/api/drafts/${draft.id}/score`, {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setDraft(data.data.draft)
        setScoreMessage(`SEO score recalculated: ${data.data.analysis.score}`)
      } else {
        throw new Error(data.error?.message || 'Failed to score draft')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to score draft'
      setScoreMessage(message)
    } finally {
      setIsScoring(false)
    }
  }

  const triggerDownload = (content: string, mimeType: string, filename: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = async (format: 'MD' | 'HTML') => {
    if (!draft?.id) return
    setExportingFormat(format)
    try {
      const response = await fetch(`/api/drafts/${draft.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        if (data.data?.download) {
          triggerDownload(
            data.data.download.content,
            data.data.download.mimeType,
            data.data.download.filename
          )
        }
        if (data.data?.bundle) {
          setDraft((prev) =>
            prev
              ? {
                  ...prev,
                  exports: [data.data.bundle, ...(prev.exports || [])],
                }
              : prev
          )
        }
        setExportMessage(`Export ready (${format}). Download started.`)
      } else {
        throw new Error(data.error?.message || 'Failed to export draft')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export draft'
      setExportMessage(message)
    } finally {
      setExportingFormat(null)
    }
  }

  const handleDownloadBundle = (bundle: ExportBundleRecord) => {
    const filename = `${draft?.title || 'draft'}-${bundle.id}.${bundle.format.toLowerCase()}`
    if (bundle.url.startsWith('data:')) {
      const link = document.createElement('a')
      link.href = bundle.url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      window.open(bundle.url, '_blank')
    }
  }

  const handleGenerateSuggestions = async () => {
    if (!draft?.id) return
    setLinksLoading(true)
    try {
      const response = await fetch('/api/links/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setLinkSuggestions(data.data.suggestions || [])
        setLinksMessage('Fresh internal link suggestions generated.')
      } else {
        throw new Error(data.error?.message || 'Failed to generate suggestions')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate suggestions'
      setLinksMessage(message)
    } finally {
      setLinksLoading(false)
    }
  }

  const handleAcceptSuggestion = async (suggestionId: string) => {
    setProcessingSuggestionId(suggestionId)
    try {
      const response = await fetch(`/api/links/${suggestionId}/accept`, {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setDraft(data.data.draft)
        setLinksMessage('Link inserted into draft.')
        fetchLinkSuggestions(data.data.draft.id)
      } else {
        throw new Error(data.error?.message || 'Failed to accept link')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept link'
      setLinksMessage(message)
    } finally {
      setProcessingSuggestionId(null)
    }
  }

  const handleDismissSuggestion = async (suggestionId: string) => {
    setProcessingSuggestionId(suggestionId)
    try {
      await fetch(`/api/links/${suggestionId}/dismiss`, { method: 'POST' })
      setLinksMessage('Suggestion dismissed.')
      if (resolvedParams?.id) fetchLinkSuggestions(resolvedParams.id)
    } catch (error) {
      setLinksMessage('Failed to dismiss suggestion')
    } finally {
      setProcessingSuggestionId(null)
    }
  }

  const checklist = draft?.onpageChecklist?.checklist ?? []
  const checklistSummary = draft?.onpageChecklist?.summary

  const normalizeHeading = (node: BriefHeadingNode): string => {
    if (!node) return ''
    return typeof node === 'string' ? node : node.text ?? ''
  }

  const normalizeFaq = (node: BriefFaqNode): string => {
    if (!node) return ''
    return typeof node === 'string' ? node : node.question ?? ''
  }

  const normalizeEntity = (node: BriefEntityNode): string => {
    if (!node) return ''
    if (typeof node === 'string') return node
    return node.term ?? node.name ?? ''
  }

  const headingList = Array.isArray(draft?.brief?.headings)
    ? (draft?.brief?.headings ?? []).map(normalizeHeading).filter((value) => value.length > 0)
    : []

  const entitiesList = Array.isArray(draft?.brief?.entities)
    ? (draft?.brief?.entities ?? []).map(normalizeEntity).filter((value) => value.length > 0)
    : []

  const faqList = Array.isArray(draft?.brief?.faq)
    ? (draft?.brief?.faq ?? []).map(normalizeFaq).filter((value) => value.length > 0)
    : []

  const draftTitle = draft?.title || draft?.brief?.targetKeyword?.term || 'Draft Details'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{draftTitle}</h1>
          {draft?.project && (
            <p className="text-gray-500 mt-1">
              Project: {draft.project.name}
              {draft?.brief?.targetKeyword?.term
                ? ` • Target Keyword: ${draft.brief.targetKeyword.term}`
                : ''}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={() => router.push('/dashboard/content')}>
            Content Overview
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">Loading draft…</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center text-red-600">{error}</CardContent>
        </Card>
      ) : draft ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>
                Created {new Date(draft.createdAt).toLocaleString()} • Updated {new Date(draft.updatedAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Status</p>
                  <p className="text-base font-medium">{draft.status}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Word Count</p>
                  <p className="text-base font-medium">{draft.wordCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">SEO Score</p>
                  <div className="flex items-center gap-3">
                    <p className="text-base font-medium">{draft.seoScore ?? 'Not scored yet'}</p>
                    <Button size="sm" variant="outline" onClick={handleReScore} disabled={isScoring}>
                      {isScoring ? 'Scoring…' : 'Re-run score'}
                    </Button>
                  </div>
                  {scoreMessage && (
                    <p className="mt-1 text-xs text-gray-500">{scoreMessage}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Version</p>
                  <p className="text-base font-medium">v{draft.version}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Inline Editor</CardTitle>
                <CardDescription>Edit markdown directly then save & rescore.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditorValue(draft.mdBody || '')}>
                  Reset
                </Button>
                <Button onClick={handleSaveEdits} disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={editorValue}
                onChange={(event) => setEditorValue(event.target.value)}
                className="h-80 w-full rounded-md border border-gray-200 bg-white p-4 font-mono text-sm focus:border-blue-500 focus:outline-none"
              />
              {saveMessage && <p className="mt-2 text-sm text-gray-500">{saveMessage}</p>}
            </CardContent>
          </Card>

          {checklist.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>SEO Checklist</CardTitle>
                {checklistSummary && (
                  <CardDescription>
                    Passed {checklistSummary.passed} • Warnings {checklistSummary.warnings} • Failed {checklistSummary.failed}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checklist.map((item, index) => (
                    <div
                      key={`${item.category}-${item.label}-${index}`}
                      className="rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.category}</p>
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            item.status === 'pass'
                              ? 'text-green-600'
                              : item.status === 'warning'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {headingList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Outline</CardTitle>
                <CardDescription>Generated headings included in this draft</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {headingList.map((heading, index) => (
                    <li key={`${heading}-${index}`}>{heading}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {entitiesList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Entities</CardTitle>
                <CardDescription>Important topics emphasized within the draft</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {entitiesList.map((entity, index) => (
                    <li key={`${entity}-${index}`}>{entity}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {faqList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>FAQs Covered</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {faqList.map((question, index) => (
                    <li key={`${question}-${index}`}>{question}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Markdown Draft</CardTitle>
              <CardDescription>
                Use this content for editing, scheduling, or exporting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[34rem] overflow-auto whitespace-pre-wrap rounded-md border bg-gray-50 p-4 text-sm">
                {draft.mdBody || 'No content generated yet.'}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Exports</CardTitle>
                <CardDescription>Generate Markdown or HTML bundles for download.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExport('MD')}
                  disabled={exportingFormat !== null}
                >
                  {exportingFormat === 'MD' ? 'Exporting…' : 'Export Markdown'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('HTML')}
                  disabled={exportingFormat !== null}
                >
                  {exportingFormat === 'HTML' ? 'Exporting…' : 'Export HTML'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {exportMessage && <p className="mb-3 text-sm text-gray-500">{exportMessage}</p>}
              {draft.exports && draft.exports.length > 0 ? (
                <div className="space-y-3">
                  {draft.exports.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="flex flex-col gap-2 rounded-md border px-3 py-2 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium">{bundle.format} export</p>
                        <p className="text-xs text-gray-500">
                          {new Date(bundle.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => handleDownloadBundle(bundle)}>
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No exports yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Internal Link Suggestions</CardTitle>
                <CardDescription>Surface related drafts to interlink and boost topical authority.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerateSuggestions} disabled={linksLoading}>
                  {linksLoading ? 'Refreshing…' : 'Generate suggestions'}
                </Button>
                <Button variant="ghost" onClick={() => resolvedParams?.id && fetchLinkSuggestions(resolvedParams.id)}>
                  Reload list
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {linksMessage && <p className="mb-3 text-sm text-gray-500">{linksMessage}</p>}
              {linkSuggestions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {linksLoading ? 'Loading suggestions…' : 'No suggestions yet. Generate to see ideas.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {linkSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="rounded-md border px-3 py-2">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium">{suggestion.anchorText}</p>
                          <p className="text-xs text-gray-500">
                            Target draft: {suggestion.toDraft?.title || suggestion.toDraft?.id}
                          </p>
                          <p className="text-xs text-gray-400">Score {(suggestion.relevanceScore * 100).toFixed(0)}%</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {suggestion.accepted ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Accepted
                            </span>
                          ) : suggestion.dismissed ? (
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                              Dismissed
                            </span>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={processingSuggestionId === suggestion.id}
                                onClick={() => handleAcceptSuggestion(suggestion.id)}
                              >
                                {processingSuggestionId === suggestion.id ? 'Inserting…' : 'Accept & insert'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={processingSuggestionId === suggestion.id}
                                onClick={() => handleDismissSuggestion(suggestion.id)}
                              >
                                Dismiss
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/content/drafts/${suggestion.toDraft?.id}`)}
                          >
                            Open draft
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
