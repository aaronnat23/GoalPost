'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'

interface Keyword {
  id: string
  term: string
  source: string
  searchVolume?: number
  difficulty?: number
  tags: string[]
  createdAt: string
}

interface Project {
  id: string
  name: string
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState({
    term: '',
    searchVolume: '',
    difficulty: '',
    tags: '',
  })

  const [bulkText, setBulkText] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchKeywords()
    }
  }, [selectedProject, search])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      if (data.success && data.data.length > 0) {
        setProjects(data.data)
        setSelectedProject(data.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchKeywords = async () => {
    if (!selectedProject) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        projectId: selectedProject,
        ...(search && { search }),
      })

      const response = await fetch(`/api/keywords?${params}`)
      const data = await response.json()

      if (data.success) {
        setKeywords(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch keywords:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          term: formData.term,
          searchVolume: formData.searchVolume ? parseInt(formData.searchVolume) : undefined,
          difficulty: formData.difficulty ? parseInt(formData.difficulty) : undefined,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setFormData({ term: '', searchVolume: '', difficulty: '', tags: '' })
        setShowAddForm(false)
        fetchKeywords()
      } else {
        alert(data.error?.message || 'Failed to add keyword')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault()

    const lines = bulkText.split('\n').filter(line => line.trim())
    const keywords = lines.map(line => {
      const parts = line.split(',').map(p => p.trim())

      const term = parts[0] || ''
      const searchVolume = parts[1] ? parseInt(parts[1], 10) : undefined
      const difficulty = parts[2] ? parseInt(parts[2], 10) : undefined

      const tagString = parts.length > 3 ? parts.slice(3).join(',') : ''
      const tags = tagString
        ? tagString
            .split(/[|;,]/)
            .map(tag => tag.trim())
            .filter(Boolean)
        : []

      return {
        term,
        searchVolume: Number.isNaN(searchVolume) ? undefined : searchVolume,
        difficulty: Number.isNaN(difficulty) ? undefined : difficulty,
        tags,
      }
    }).filter(kw => kw.term)

    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          keywords,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setBulkText('')
        setShowBulkImport(false)
        fetchKeywords()
        alert(`Imported ${data.data.imported} keywords!`)
      } else {
        alert(data.error?.message || 'Failed to import keywords')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this keyword?')) return

    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchKeywords()
      }
    } catch (error) {
      alert('Failed to delete keyword')
    }
  }

  if (loading && projects.length === 0) {
    return <div className="p-6">Loading...</div>
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Keywords</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              No projects yet. Create a project first to start managing keywords.
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => window.location.href = '/dashboard/settings/projects'}>
                Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Keywords</h1>
          <p className="text-gray-500 mt-1">
            Manage keywords for your content strategy
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkImport(!showBulkImport)} className="gap-2">
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            + Add Keyword
          </Button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="flex gap-4 items-center">
        <Label>Project:</Label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <Input
          placeholder="Search keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Add Single Keyword Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Keyword</CardTitle>
            <CardDescription>Add a single keyword manually</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddKeyword} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="term">Keyword *</Label>
                  <Input
                    id="term"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    placeholder="best seo tools"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="searchVolume">Search Volume</Label>
                  <Input
                    id="searchVolume"
                    type="number"
                    value={formData.searchVolume}
                    onChange={(e) => setFormData({ ...formData, searchVolume: e.target.value })}
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty (0-100)</Label>
                  <Input
                    id="difficulty"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    placeholder="45"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tools, seo, review"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Keyword</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bulk Import Form */}
      {showBulkImport && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import Keywords</CardTitle>
            <CardDescription>
              Import multiple keywords at once. Format: keyword, search_volume, difficulty, tags
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBulkImport} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk">Keywords (one per line)</Label>
                <textarea
                  id="bulk"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full h-48 border rounded-md p-2 font-mono text-sm"
                  placeholder={`best seo tools, 5000, 45, tools|seo
content marketing tips, 3000, 30, marketing
keyword research guide, 2000, 35, seo|guide`}
                />
                <p className="text-xs text-gray-500">
                  Format: keyword, volume, difficulty, tags. Use comma, |, or ; between tags (volume, difficulty, and tags are optional).
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Import Keywords</Button>
                <Button type="button" variant="outline" onClick={() => setShowBulkImport(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Keywords List */}
      <Card>
        <CardHeader>
          <CardTitle>Keywords ({keywords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : keywords.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No keywords yet. Add your first keyword to get started!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">Keyword</th>
                    <th className="pb-3 font-medium">Search Volume</th>
                    <th className="pb-3 font-medium">Difficulty</th>
                    <th className="pb-3 font-medium">Tags</th>
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {keywords.map((keyword) => (
                    <tr key={keyword.id} className="text-sm">
                      <td className="py-3 font-medium">{keyword.term}</td>
                      <td className="py-3">
                        {keyword.searchVolume?.toLocaleString() || '-'}
                      </td>
                      <td className="py-3">
                        {keyword.difficulty ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            keyword.difficulty < 30 ? 'bg-green-100 text-green-800' :
                            keyword.difficulty < 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {keyword.difficulty}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1 flex-wrap">
                          {keyword.tags.length > 0 ? (
                            keyword.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {tag}
                              </span>
                            ))
                          ) : '-'}
                        </div>
                      </td>
                      <td className="py-3 text-gray-500">{keyword.source}</td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(keyword.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
