'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'
import { useRouter } from 'next/navigation'
import {
  Link2,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  getStoredActiveProjectId,
  persistActiveProject,
  PROJECT_SELECTION_EVENT,
} from '@/lib/projects/selection'

interface ProjectOption {
  id: string
  name: string
}

interface Suggestion {
  id: string
  relevanceScore: number
  accepted: boolean
  dismissed: boolean
  anchorText: string
  fromDraft: { id: string; title: string | null }
  toDraft: { id: string; title: string | null }
}

interface GraphSnapshotResponse {
  projectId: string
  nodes: number
  stats: {
    totalIncoming: number
    totalOutgoing: number
  }
}

interface PartnerOptIn {
  id: string
  orgId: string
  domainsAllowed: string[]
  rules: any
  active: boolean
}

export default function BacklinksPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [graphStats, setGraphStats] = useState<GraphSnapshotResponse | null>(null)
  const [graphLoading, setGraphLoading] = useState(false)
  const [partnerOptIn, setPartnerOptIn] = useState<PartnerOptIn | null>(null)
  const [partnerSaving, setPartnerSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId: string }>).detail
      if (detail?.projectId) {
        setSelectedProject(detail.projectId)
      }
    }
    window.addEventListener(PROJECT_SELECTION_EVENT, handler as EventListener)
    return () => window.removeEventListener(PROJECT_SELECTION_EVENT, handler as EventListener)
  }, [])

  useEffect(() => {
    if (!selectedProject) return
    fetchSuggestions()
    fetchGraph()
    fetchPartnerOptIn()
  }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      if (response.ok && data.success) {
        setProjects(data.data)
        const stored = getStoredActiveProjectId()
        const first = stored && data.data.some((proj: ProjectOption) => proj.id === stored)
          ? stored
          : data.data[0]?.id
        if (first) {
          setSelectedProject(first)
          if (!stored) persistActiveProject(first, { broadcast: false })
        }
      }
    } catch (error) {
      console.error('Failed to load projects', error)
    }
  }

  const fetchSuggestions = async () => {
    if (!selectedProject) return
    setLoadingSuggestions(true)
    try {
      const response = await fetch(`/api/links/project?projectId=${selectedProject}`)
      const data = await response.json()
      if (response.ok && data.success) {
        setSuggestions(data.data.suggestions)
      }
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const fetchGraph = async () => {
    if (!selectedProject) return
    setGraphLoading(true)
    try {
      const response = await fetch('/api/links/graph/recompute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setGraphStats(data.data)
      } else {
        setStatusMessage(data.error?.message || 'Unable to recompute link graph')
      }
    } catch (error) {
      setStatusMessage('Unable to recompute link graph')
    } finally {
      setGraphLoading(false)
    }
  }

  const fetchPartnerOptIn = async () => {
    try {
      const response = await fetch('/api/partners/optin')
      const data = await response.json()
      if (response.ok && data.success) {
        setPartnerOptIn(data.data.optIn)
      }
    } catch (error) {
      console.error('Failed to load partner settings', error)
    }
  }

  const handleAccept = async (id: string) => {
    await fetch(`/api/links/${id}/accept`, { method: 'POST' })
    fetchSuggestions()
    fetchGraph()
  }

  const handleDismiss = async (id: string) => {
    await fetch(`/api/links/${id}/dismiss`, { method: 'POST' })
    fetchSuggestions()
  }

  const savePartnerOptIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!partnerOptIn) return
    setPartnerSaving(true)
    const formData = new FormData(event.currentTarget)
    const domains = (formData.get('domains') as string)
      .split('\n')
      .map((domain) => domain.trim())
      .filter(Boolean)
    const rules = {
      maxLinksPerArticle: Number(formData.get('maxLinks')) || 3,
      topicalMatchRequired: formData.get('topical') === 'on',
    }
    const payload = {
      orgId: partnerOptIn.orgId,
      domainsAllowed: domains,
      active: formData.get('active') === 'on',
      rules,
    }
    try {
      const response = await fetch('/api/partners/optin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setPartnerOptIn(data.data.optIn)
        setStatusMessage('Partner preferences updated')
      }
    } finally {
      setPartnerSaving(false)
    }
  }

  const toggleActive = async () => {
    if (!partnerOptIn) return
    const response = await fetch('/api/partners/optin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: partnerOptIn.orgId,
        domainsAllowed: partnerOptIn.domainsAllowed,
        rules: partnerOptIn.rules,
        active: !partnerOptIn.active,
      }),
    })
    const data = await response.json()
    if (response.ok && data.success) {
      setPartnerOptIn(data.data.optIn)
    }
  }

  const projectSuggestions = suggestions.filter((suggestion) => !suggestion.accepted && !suggestion.dismissed)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Backlinks & Internal Links</h1>
          <p className="text-sm text-slate-500">Curate internal links and opt into partner exchanges.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-500">Project</label>
          <select
            value={selectedProject}
            onChange={(event) => {
              setSelectedProject(event.target.value)
              persistActiveProject(event.target.value)
            }}
            className="rounded-md border px-3 py-2"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          {statusMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Internal link graph</CardTitle>
              <CardDescription>Incoming vs outgoing links per draft</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchGraph} disabled={graphLoading}>
              <RefreshCw className={cn('mr-2 h-4 w-4', graphLoading && 'animate-spin')} />
              Refresh metrics
            </Button>
          </CardHeader>
          <CardContent>
            {graphStats ? (
              <div className="grid gap-4 md:grid-cols-3">
                <GraphStat
                  label="Tracked drafts"
                  value={graphStats.nodes.toString()}
                  helper="with link data"
                />
                <GraphStat
                  label="Incoming links"
                  value={graphStats.stats.totalIncoming.toString()}
                  helper="Accepted references"
                />
                <GraphStat
                  label="Outgoing links"
                  value={graphStats.stats.totalOutgoing.toString()}
                  helper="Placed in other drafts"
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Run a refresh to generate link metrics.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Partner opt-in</CardTitle>
            <CardDescription>Curate ethical partner domains for future backlink exchanges.</CardDescription>
          </CardHeader>
          <CardContent>
            {partnerOptIn ? (
              <form className="space-y-4" onSubmit={savePartnerOptIn}>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Active program</p>
                    <p className="text-xs text-slate-500">Allow vetted partners to request mentions</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={toggleActive}>
                    {partnerOptIn.active ? 'Disable' : 'Enable'}
                  </Button>
                </div>
                <div>
                  <Label htmlFor="domains">Approved domains (one per line)</Label>
                  <Textarea
                    id="domains"
                    name="domains"
                    className="mt-1"
                    rows={4}
                    defaultValue={partnerOptIn.domainsAllowed?.join('\n') || ''}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <Label htmlFor="maxLinks">Max links per article</Label>
                    <Input
                      id="maxLinks"
                      name="maxLinks"
                      type="number"
                      min={1}
                      defaultValue={partnerOptIn.rules?.maxLinksPerArticle ?? 3}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      name="topical"
                      defaultChecked={partnerOptIn.rules?.topicalMatchRequired ?? true}
                    />
                    Require topical match
                  </label>
                </div>
                <input type="checkbox" hidden name="active" checked={partnerOptIn.active} readOnly value="on" />
                <Button type="submit" disabled={partnerSaving} className="w-full">
                  {partnerSaving ? 'Saving...' : 'Save preferences'}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-slate-500">Loading partner preferences…</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Pending suggestions</CardTitle>
            <CardDescription>Approve or dismiss internal link recommendations across the project.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSuggestions} disabled={loadingSuggestions}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loadingSuggestions && 'animate-spin')} />
            Refresh list
          </Button>
        </CardHeader>
        <CardContent>
          {projectSuggestions.length === 0 ? (
            <p className="text-sm text-slate-500">No pending suggestions. Generate from a draft to see new ideas.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {projectSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="grid gap-2 py-4 md:grid-cols-5 md:items-center">
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-slate-900">{suggestion.anchorText}</p>
                    <p className="text-xs text-slate-500">
                      {suggestion.fromDraft.title || 'Untitled'} → {suggestion.toDraft.title || 'Untitled'}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500">Score {(suggestion.relevanceScore * 100).toFixed(0)}%</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleAccept(suggestion.id)}>
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDismiss(suggestion.id)}>
                      <XCircle className="mr-1 h-4 w-4" /> Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/content/drafts/${suggestion.toDraft.id}`)}
                    >
                      <Link2 className="mr-1 h-3.5 w-3.5" /> View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function GraphStat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
  )
}
