'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  getStoredActiveProjectId,
  persistActiveProject,
  PROJECT_SELECTION_EVENT,
} from '@/lib/projects/selection'
import { cn } from '@/lib/utils/cn'
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface Project {
  id: string
  name: string
}

interface DraftOption {
  id: string
  title?: string | null
  status: string
  scheduledFor?: string | null
}

interface CalendarDraftLink {
  id: string
  title?: string | null
  status?: string | null
  scheduledFor?: string | null
}

interface CalendarItem {
  id: string
  projectId: string
  title: string
  type: string
  status: string
  startAt: string
  endAt?: string | null
  refId?: string | null
  draft?: CalendarDraftLink | null
}

const typeOptions = [
  { label: 'Article', value: 'ARTICLE' },
  { label: 'Social Snippet', value: 'SOCIAL_SNIPPET' },
  { label: 'Task', value: 'TASK' },
  { label: 'Note', value: 'NOTE' },
]

const viewLabels: Record<'month' | 'week' | 'list', string> = {
  month: 'Month',
  week: 'Week',
  list: 'List',
}

function toInputValue(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

export default function CalendarPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [view, setView] = useState<'month' | 'week' | 'list'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [items, setItems] = useState<CalendarItem[]>([])
  const [drafts, setDrafts] = useState<DraftOption[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formSaving, setFormSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [updateSaving, setUpdateSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    type: 'ARTICLE',
    startAt: '',
    endAt: '',
    refId: '',
    status: 'scheduled',
  })
  const [focusedDate, setFocusedDate] = useState(new Date())
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    })
  )

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      if (response.ok && data.success && Array.isArray(data.data)) {
        setProjects(data.data)
        const stored = getStoredActiveProjectId()
        const nextProject = stored && data.data.some((p: Project) => p.id === stored)
          ? stored
          : data.data[0]?.id || ''
        if (nextProject) {
          setSelectedProject(nextProject)
          if (!stored) {
            persistActiveProject(nextProject, { broadcast: false })
          }
        }
      }
    } catch (error) {
      console.error('Failed to load projects', error)
    }
  }, [])

  const loadDrafts = useCallback(async () => {
    if (!selectedProject) return
    try {
      const params = new URLSearchParams({ projectId: selectedProject, limit: '100' })
      const response = await fetch(`/api/drafts?${params}`)
      const data = await response.json()
      if (response.ok && data.success) {
        setDrafts(data.data.drafts || data.data || [])
      }
    } catch (error) {
      console.error('Failed to load drafts', error)
    }
  }, [selectedProject])

  const loadCalendarItems = useCallback(async () => {
    if (!selectedProject) return
    try {
      setLoadingItems(true)
      const start = startOfWeek(startOfMonth(currentDate))
      const end = endOfWeek(endOfMonth(currentDate))
      const params = new URLSearchParams({
        projectId: selectedProject,
        start: start.toISOString(),
        end: end.toISOString(),
      })
      const response = await fetch(`/api/calendar?${params}`)
      const data = await response.json()
      if (response.ok && data.success) {
        setItems(data.data.items)
      } else {
        throw new Error(data.error?.message || 'Unable to load calendar')
      }
    } catch (error) {
      console.error('Failed to load calendar', error)
      setStatusMessage('Unable to load calendar items')
    } finally {
      setLoadingItems(false)
    }
  }, [selectedProject, currentDate])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    if (!selectedProject) return
    loadDrafts()
    loadCalendarItems()
  }, [selectedProject, currentDate, loadDrafts, loadCalendarItems])

  useEffect(() => {
    setFocusedDate(currentDate)
  }, [currentDate])

  useEffect(() => {
    if (!statusMessage) return
    const timeout = setTimeout(() => setStatusMessage(null), 4000)
    return () => clearTimeout(timeout)
  }, [statusMessage])

  useEffect(() => {
    setBulkSelectMode(false)
    setSelectedItemIds(new Set())
  }, [view, selectedProject])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId: string }>).detail
      if (detail?.projectId) {
        setSelectedProject(detail.projectId)
      }
    }
    window.addEventListener(PROJECT_SELECTION_EVENT, handler as EventListener)
    return () => window.removeEventListener(PROJECT_SELECTION_EVENT, handler as EventListener)
  }, [])

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId)
    persistActiveProject(projectId)
  }

  const handleDaySelect = (day: Date) => {
    setFormOpen(true)
    const startSlot = new Date(day)
    startSlot.setHours(9, 0, 0, 0)
    const endSlot = new Date(day)
    endSlot.setHours(11, 0, 0, 0)
    setFormData((prev) => ({ ...prev, startAt: toInputValue(startSlot), endAt: toInputValue(endSlot) }))
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !formData.title || !formData.startAt) return
    setFormSaving(true)
    try {
      const payload = {
        projectId: selectedProject,
        title: formData.title,
        type: formData.type,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : undefined,
        status: formData.status,
        refId: formData.refId || undefined,
      }
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setFormOpen(false)
        setFormData({ title: '', type: 'ARTICLE', startAt: '', endAt: '', refId: '', status: 'scheduled' })
        setStatusMessage('Calendar item created')
        loadCalendarItems()
      } else {
        throw new Error(data.error?.message || 'Failed to create item')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create item'
      setStatusMessage(message)
    } finally {
      setFormSaving(false)
    }
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!active || !over) return
    const targetDate = over.data?.current?.date
    if (!targetDate) return

    const dragged = items.find((item) => item.id === active.id)
    if (!dragged) return

    const currentKey = format(new Date(dragged.startAt), 'yyyy-MM-dd')
    if (currentKey === targetDate) return

    const sourceStart = new Date(dragged.startAt)
    const destinationStart = new Date(targetDate)
    destinationStart.setHours(sourceStart.getHours(), sourceStart.getMinutes(), 0, 0)
    const duration = dragged.endAt
      ? new Date(dragged.endAt).getTime() - sourceStart.getTime()
      : 0
    const destinationEnd = duration > 0 ? new Date(destinationStart.getTime() + duration) : undefined

    setItems((prev) =>
      prev.map((item) =>
        item.id === dragged.id
          ? {
              ...item,
              startAt: destinationStart.toISOString(),
              endAt: destinationEnd ? destinationEnd.toISOString() : item.endAt,
            }
          : item
      )
    )

    try {
      await fetch(`/api/calendar/${dragged.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAt: destinationStart.toISOString(),
          endAt: destinationEnd?.toISOString(),
        }),
      })
      setStatusMessage('Calendar item rescheduled')
    } catch (error) {
      console.error('Failed to reschedule item', error)
      setStatusMessage('Unable to reschedule item')
      loadCalendarItems()
    }
  }, [items, loadCalendarItems])

  const handleUpdateItem = async () => {
    if (!selectedItem) return
    setUpdateSaving(true)
    try {
      const response = await fetch(`/api/calendar/${selectedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAt: selectedItem.startAt,
          endAt: selectedItem.endAt,
          status: selectedItem.status,
          title: selectedItem.title,
        }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setStatusMessage('Calendar item updated')
        setSelectedItem(null)
        loadCalendarItems()
      } else {
        throw new Error(data.error?.message || 'Failed to update item')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update item'
      setStatusMessage(message)
    } finally {
      setUpdateSaving(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!selectedItem) return
    try {
      const response = await fetch(`/api/calendar/${selectedItem.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setStatusMessage('Calendar item removed')
        setSelectedItem(null)
        loadCalendarItems()
      } else {
        throw new Error(data.error?.message || 'Failed to delete item')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete item'
      setStatusMessage(message)
    }
  }

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const handleCalendarKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (view === 'list') return
    const key = event.key
    let nextDate = new Date(focusedDate)
    if (key === 'ArrowRight') {
      nextDate = addDays(focusedDate, 1)
    } else if (key === 'ArrowLeft') {
      nextDate = subDays(focusedDate, 1)
    } else if (key === 'ArrowUp') {
      nextDate = subDays(focusedDate, 7)
    } else if (key === 'ArrowDown') {
      nextDate = addDays(focusedDate, 7)
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      handleDaySelect(new Date(focusedDate))
      return
    } else {
      return
    }
    event.preventDefault()
    setFocusedDate(nextDate)
  }

  const toggleBulkSelectMode = () => {
    setBulkSelectMode((prev) => {
      if (prev) setSelectedItemIds(new Set())
      return !prev
    })
  }

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBulkDelete = async () => {
    if (selectedItemIds.size === 0) return
    setStatusMessage('Deleting selected items...')
    await Promise.all(
      Array.from(selectedItemIds).map((id) =>
        fetch(`/api/calendar/${id}`, { method: 'DELETE' })
      )
    )
    setSelectedItemIds(new Set())
    loadCalendarItems()
    setStatusMessage('Selected items removed')
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedItemIds.size === 0) return
    setStatusMessage('Updating selected items...')
    await Promise.all(
      Array.from(selectedItemIds).map((id) =>
        fetch(`/api/calendar/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      )
    )
    setSelectedItemIds(new Set())
    loadCalendarItems()
    setStatusMessage('Selected items updated')
  }

  const eventsByDate = useMemo(() => {
    const groups: Record<string, CalendarItem[]> = {}
    for (const item of items) {
      const key = format(new Date(item.startAt), 'yyyy-MM-dd')
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    }
    return groups
  }, [items])

  const currentWeekDays = useMemo(() => {
    const start = startOfWeek(currentDate)
    const end = endOfWeek(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const filteredItems = useMemo(() => {
    if (view === 'list') {
      return [...items].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    }
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate)
      const weekEnd = endOfWeek(currentDate)
      return items.filter((item) => {
        const start = new Date(item.startAt)
        return start >= weekStart && start <= weekEnd
      })
    }
    return items
  }, [items, view, currentDate])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-gray-500 mt-1">Schedule and manage internal content launches.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['month', 'week', 'list'] as const).map((mode) => (
            <Button
              key={mode}
              variant={view === mode ? 'default' : 'outline'}
              onClick={() => setView(mode)}
            >
              {viewLabels[mode]}
            </Button>
          ))}
        </div>
      </div>

      {projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-gray-600">Project</label>
          <select
            value={selectedProject}
            onChange={(event) => handleProjectChange(event.target.value)}
            className="rounded-md border px-3 py-2"
          >
            {projects.map((project) => (
              <option value={project.id} key={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
            <CardDescription>Drag cards between days to reschedule or open an event for fine-grained edits.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              Prev
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              Next
            </Button>
            <Button onClick={() => setFormOpen(true)}>+ Schedule Content</Button>
          </div>
        </CardHeader>
        <CardContent>
          {statusMessage && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              {statusMessage}
            </div>
          )}
          {view === 'list' && (
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <Button variant="ghost" size="sm" onClick={toggleBulkSelectMode}>
                {bulkSelectMode ? 'Exit bulk mode' : 'Bulk select'}
              </Button>
              {bulkSelectMode && selectedItemIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span>{selectedItemIds.size} selected</span>
                  <Button size="sm" variant="outline" onClick={handleBulkDelete}>
                    Delete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('READY')}>
                    Mark ready
                  </Button>
                </div>
              )}
            </div>
          )}
          <div tabIndex={view === 'list' ? -1 : 0} onKeyDown={handleCalendarKeyDown} className="focus:outline-none">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              {view === 'month' && (
                <div className="grid grid-cols-7 gap-3 text-sm">
                  {monthDays.map((day) => {
                    const key = format(day, 'yyyy-MM-dd')
                    const dayEvents = eventsByDate[key] || []
                    return (
                      <MonthDayCell
                        key={key}
                        date={day}
                        isCurrentMonth={isSameMonth(day, currentDate)}
                        isFocused={isSameDay(day, focusedDate)}
                        onSelect={handleDaySelect}
                      >
                        {dayEvents.length === 0 && (
                          <p className="text-xs text-slate-400">No items</p>
                        )}
                        {dayEvents.slice(0, 3).map((event) => (
                          <DraggableEventCard
                            key={event.id}
                            event={event}
                            compact
                            onSelect={() => setSelectedItem(event)}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-[11px] text-slate-400">+{dayEvents.length - 3} more</p>
                        )}
                      </MonthDayCell>
                    )
                  })}
                </div>
              )}

              {view === 'week' && (
                <div className="grid grid-cols-7 gap-3 text-sm">
                  {currentWeekDays.map((day) => {
                    const key = format(day, 'yyyy-MM-dd')
                    const dayEvents = (eventsByDate[key] || []).filter((event) => isSameDay(new Date(event.startAt), day))
                    return (
                      <WeekDayColumn key={key} date={day} isFocused={isSameDay(day, focusedDate)} onSelect={handleDaySelect}>
                        {dayEvents.length === 0 && (
                          <p className="text-xs text-slate-400">No items scheduled</p>
                        )}
                        {dayEvents.map((event) => (
                          <DraggableEventCard
                            key={event.id}
                            event={event}
                            onSelect={() => setSelectedItem(event)}
                          />
                        ))}
                      </WeekDayColumn>
                    )
                  })}
                </div>
              )}

              {view === 'list' && (
                <div className="space-y-3 text-sm">
                  {filteredItems.length === 0 && <p className="text-slate-500">No scheduled items for this range.</p>}
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {bulkSelectMode && (
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={selectedItemIds.has(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                          />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(item.startAt), 'MMM d, yyyy HH:mm')} • {item.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedItem(item)}>
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DndContext>
          </div>
        </CardContent>
      </Card>

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule new item</CardTitle>
            <CardDescription>Link a draft or create a planning placeholder.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateItem}>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">Title</label>
                <Input
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Type</label>
                <select
                  value={formData.type}
                  onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))}
                  className="w-full rounded-md border px-3 py-2"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Start</label>
                <Input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(event) => setFormData((prev) => ({ ...prev, startAt: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">End</label>
                <Input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(event) => setFormData((prev) => ({ ...prev, endAt: event.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Link draft</label>
                <select
                  value={formData.refId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, refId: event.target.value }))}
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option value="">(Optional)</option>
                  {drafts.map((draft) => (
                    <option key={draft.id} value={draft.id}>
                      {draft.title || 'Untitled'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formSaving}>
                  {formSaving ? 'Saving…' : 'Schedule'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle>Update scheduled item</CardTitle>
            <CardDescription>Adjust timing or status, or delete entirely.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Title</label>
              <Input
                value={selectedItem.title}
                onChange={(event) =>
                  setSelectedItem((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <select
                value={selectedItem.status}
                onChange={(event) =>
                  setSelectedItem((prev) => (prev ? { ...prev, status: event.target.value } : prev))
                }
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-600">Start</label>
                <Input
                  type="datetime-local"
                  value={toInputValue(selectedItem.startAt)}
                  onChange={(event) =>
                    setSelectedItem((prev) =>
                      prev
                        ? {
                            ...prev,
                            startAt: new Date(event.target.value).toISOString(),
                          }
                        : prev
                    )
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">End</label>
                <Input
                  type="datetime-local"
                  value={toInputValue(selectedItem.endAt || selectedItem.startAt)}
                  onChange={(event) =>
                    setSelectedItem((prev) =>
                      prev
                        ? {
                            ...prev,
                            endAt: new Date(event.target.value).toISOString(),
                          }
                        : prev
                    )
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
              <Button variant="outline" onClick={handleDeleteItem}>
                Delete
              </Button>
              <Button onClick={handleUpdateItem} disabled={updateSaving}>
                {updateSaving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingItems && <p className="text-sm text-gray-500">Loading calendar…</p>}
    </div>
  )
}

interface MonthDayCellProps {
  date: Date
  isCurrentMonth: boolean
  isFocused: boolean
  onSelect: (date: Date) => void
  children: React.ReactNode
}

function MonthDayCell({ date, isCurrentMonth, isFocused, onSelect, children }: MonthDayCellProps) {
  const dayKey = format(date, 'yyyy-MM-dd')
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dayKey}`,
    data: { date: dayKey },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[140px] flex-col rounded-xl border border-slate-200 p-3 transition focus:outline-none',
        isCurrentMonth ? 'bg-white' : 'bg-slate-50 text-slate-400',
        isOver && 'ring-2 ring-slate-300',
        isFocused && 'ring-2 ring-slate-400'
      )}
    >
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>{format(date, 'EEE')}</span>
        <button
          type="button"
          className={cn(
            'rounded-full px-2 py-1 text-slate-700 hover:bg-slate-100',
            isSameDay(date, new Date()) && 'bg-slate-900 text-white hover:bg-slate-900'
          )}
          onClick={() => onSelect(new Date(date))}
        >
          {format(date, 'd')}
        </button>
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  )
}

interface WeekDayColumnProps {
  date: Date
  isFocused: boolean
  onSelect: (date: Date) => void
  children: React.ReactNode
}

function WeekDayColumn({ date, isFocused, onSelect, children }: WeekDayColumnProps) {
  const dayKey = format(date, 'yyyy-MM-dd')
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dayKey}`,
    data: { date: dayKey },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-3 transition',
        isOver && 'ring-2 ring-slate-300',
        isFocused && 'ring-2 ring-slate-400'
      )}
    >
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>{format(date, 'EEE')}</span>
        <button
          type="button"
          className="rounded-full px-2 py-1 text-slate-600 hover:bg-slate-100"
          onClick={() => onSelect(new Date(date))}
        >
          {format(date, 'MMM d')}
        </button>
      </div>
      <div className="mt-3 space-y-2 text-xs">{children}</div>
    </div>
  )
}

interface EventCardProps {
  event: CalendarItem
  onSelect: () => void
  compact?: boolean
  variant?: 'chip' | 'list'
  draggable?: boolean
}

function DraggableEventCard({ event, onSelect, compact = false, variant = 'chip', draggable = true }: EventCardProps) {
  const content = (
    <div className="flex flex-col gap-1">
      <p className={cn('font-medium text-slate-900', compact ? 'text-xs' : 'text-sm')}>
        {event.title || 'Untitled'}
      </p>
      <p className="text-xs text-slate-500">
        {format(new Date(event.startAt), compact ? 'h:mm a' : 'MMM d · h:mm a')}
      </p>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {event.status}
      </span>
    </div>
  )

  if (!draggable) {
    return (
      <button
        type="button"
        onClick={() => onSelect()}
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-slate-300',
          variant === 'chip' ? 'text-xs' : 'text-sm'
        )}
      >
        {content}
      </button>
    )
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { date: format(new Date(event.startAt), 'yyyy-MM-dd') },
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className={cn(
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs shadow-sm transition hover:border-slate-300',
        compact ? 'text-xs' : 'text-sm',
        isDragging && 'ring-2 ring-slate-300'
      )}
    >
      {content}
    </button>
  )
}
