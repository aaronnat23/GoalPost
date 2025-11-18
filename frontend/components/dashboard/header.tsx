'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/supabase-client'
import { Button } from '@/components/ui/button'
import { persistActiveProject } from '@/lib/projects/selection'
import { CreditCard, ChevronDown, ChevronRight } from 'lucide-react'

interface ProjectOption {
  id: string
  name: string
}

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
  }
  creditBalance?: number
  currentProject?: {
    id: string
    name: string
  } | null
  projects?: ProjectOption[]
}

export function Header({
  user,
  creditBalance = 0,
  currentProject,
  projects = [],
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [activeProject, setActiveProject] = useState(currentProject || null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (currentProject?.id && currentProject.id !== activeProject?.id) {
      setActiveProject(currentProject)
    }
    if (!currentProject && !activeProject && projects.length > 0) {
      setActiveProject(projects[0])
    }
  }, [currentProject?.id, projects])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleProjectSwitch = (project: ProjectOption) => {
    setActiveProject(project)
    persistActiveProject(project.id)
    setShowProjects(false)
    router.refresh()
  }

  return (
    <header className="h-16 border-b bg-white/80 px-6 flex items-center justify-between backdrop-blur">
      {/* Left: Project selector */}
      <div>
        {activeProject ? (
          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => setShowProjects(!showProjects)}
            >
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs uppercase tracking-wide text-slate-400">Project</span>
                <span className="text-slate-900">{activeProject.name}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
            </button>

            {showProjects && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProjects(false)}
                />
                <div className="absolute z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="max-h-64 overflow-auto">
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSwitch(project)}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                            project.id === activeProject.id ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          <span>{project.name}</span>
                          {project.id === activeProject.id && <span className="text-xs">Current</span>}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">No projects available.</div>
                    )}
                  </div>
                  <div className="border-t border-slate-100 p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setShowProjects(false)
                        router.push('/dashboard/settings/projects')
                      }}
                    >
                      + Manage Projects
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push('/dashboard/settings/projects')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Create Project
          </button>
        )}
      </div>

      {/* Right: Credits + User menu */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
          <CreditCard className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <span>{creditBalance.toLocaleString()} credits</span>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium hidden md:block">{user?.name || user?.email}</span>
            <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white shadow-xl z-20">
                <div className="p-4 border-b border-slate-100">
                  <div className="text-sm font-semibold text-slate-900">{user?.name || 'Member'}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
                <div className="p-2 space-y-1 text-sm text-slate-600">
                  <button
                    onClick={() => window.location.href = '/dashboard/settings'}
                    className="w-full text-left rounded-md px-3 py-2 hover:bg-slate-50"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => window.location.href = '/dashboard/settings/org'}
                    className="w-full text-left rounded-md px-3 py-2 hover:bg-slate-50"
                  >
                    Organization
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left rounded-md px-3 py-2 font-medium text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
