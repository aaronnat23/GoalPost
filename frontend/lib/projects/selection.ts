'use client'

const STORAGE_KEY = 'activeProjectId'
const EVENT_NAME = 'project-changed'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export type ProjectSelectionDetail = {
  projectId: string
}

export function getStoredActiveProjectId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Unable to read stored project selection', error)
    return null
  }
}

export function persistActiveProject(
  projectId: string,
  { broadcast = true }: { broadcast?: boolean } = {}
) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, projectId)
    document.cookie = `activeProjectId=${projectId}; path=/; max-age=${ONE_YEAR_SECONDS}`
  } catch (error) {
    console.warn('Unable to persist active project', error)
  }

  if (broadcast) {
    window.dispatchEvent(
      new CustomEvent<ProjectSelectionDetail>(EVENT_NAME, {
        detail: { projectId },
      })
    )
  }
}

export const PROJECT_SELECTION_EVENT = EVENT_NAME
