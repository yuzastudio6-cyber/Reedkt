import { FolderPlus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProjectCard } from '../components/ProjectCard'
import type { Project } from '../data/mockData'
import {
  createProjectBackendLocalConfig,
  listProjectsBackendLocal,
  type ProjectBackendLocalRecord,
} from '../lib/project-backend-local'
import { createProjectHomePath } from '../lib/project-edit-session-navigation'

function formatProjectUpdated(project: ProjectBackendLocalRecord): string {
  const value = project.updatedAt ?? project.createdAt
  if (!value) return 'Created in this test session'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Created in this test session'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function projectCardFromBackendLocal(project: ProjectBackendLocalRecord): Project {
  return {
    id: project.id,
    openPath: createProjectHomePath(project.id),
    title: project.name,
    format: 'Project workspace',
    status: 'Ready for edits',
    progress: 0,
    updated: formatProjectUpdated(project),
    owner: project.createdByUserId ? 'Signed-in tester' : 'Workspace',
    summary: project.description ?? 'Create an edit inside this project, then upload video and write the edit brief.',
    tags: ['Project', 'Edit setup', 'Internal test'],
    accent: 'cyan',
  }
}

export function ProjectsPage() {
  const projectConfig = useMemo(() => createProjectBackendLocalConfig(import.meta.env), [])
  const [backendProjects, setBackendProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(projectConfig.available)
  const [projectListStatus, setProjectListStatus] = useState(projectConfig.available
    ? 'Loading backend-local projects.'
    : 'Backend API URL is not configured. Project readback is waiting for the local backend.')

  useEffect(() => {
    if (!projectConfig.available || !projectConfig.apiBaseUrl) {
      return
    }

    let cancelled = false
    listProjectsBackendLocal({
      apiBaseUrl: projectConfig.apiBaseUrl,
      workspaceId: projectConfig.workspaceId,
    }).then((result) => {
      if (cancelled) return
      setBackendProjects(result.projects.map(projectCardFromBackendLocal))
      setProjectListStatus(result.projects.length > 0
        ? 'Backend-local projects loaded.'
        : 'No backend-local projects yet. Create a project to start.')
    }).catch((error) => {
      if (cancelled) return
      setBackendProjects([])
      setProjectListStatus(error instanceof Error ? error.message : 'Project list readback failed.')
    }).finally(() => {
      if (!cancelled) setLoadingProjects(false)
    })

    return () => {
      cancelled = true
    }
  }, [projectConfig.apiBaseUrl, projectConfig.available, projectConfig.workspaceId])

  const projectCards = backendProjects

  return (
    <AppShell
      description="Projects are the top-level container. Create a project first, then create edits inside it."
      eyebrow="Projects"
      title="Projects"
    >
      <section className="projects-clean-header" data-testid="projects-clean-header">
        <div>
          <Badge accent="cyan">Clean workspace</Badge>
          <h2>Create or open a project</h2>
          <p>
            Keep source clips, edit briefs, upload state, approvals, previews, and versions attached to one project instead of scattering them across the app.
          </p>
        </div>
        <Button icon={FolderPlus} to="/projects/new" variant="primary">
          Create project
        </Button>
      </section>

      <section className="projects-clean-list" data-testid="projects-clean-list">
        <div className="projects-clean-toolbar">
          <span>
            <Search aria-hidden="true" size={17} />
            {projectListStatus}
          </span>
          <Badge>{loadingProjects ? 'Loading' : `${projectCards.length} projects`}</Badge>
        </div>
        {projectCards.length > 0 ? (
          <div className="project-grid">
            {projectCards.map((project) => (
              <ProjectCard key={project.id ?? project.title} project={project} />
            ))}
          </div>
        ) : (
          <Card className="projects-clean-current" data-testid="projects-empty-state">
            <h3>No projects yet</h3>
            <p>
              {projectConfig.available
                ? 'Create a project first. Then ReEditPro will open that project so you can create an edit, upload video, write the brief, and approve the plan.'
                : 'Start the backend-local API to create and read projects here. No sample project is shown as a real workspace.'}
            </p>
            <Button icon={FolderPlus} to="/projects/new" variant="primary">
              Create project
            </Button>
          </Card>
        )}
      </section>
    </AppShell>
  )
}
