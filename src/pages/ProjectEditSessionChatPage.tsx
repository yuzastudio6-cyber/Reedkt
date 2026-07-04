import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Card } from '../components/Card'
import { ProjectEditSessionBoundaryNotice } from '../components/projects/ProjectEditSessionBoundaryNotice'
import { ProjectEditSessionBreadcrumbs } from '../components/projects/ProjectEditSessionBreadcrumbs'
import { ProjectEditSessionChatHeader } from '../components/projects/ProjectEditSessionChatHeader'
import { ProjectEditSessionChatInput } from '../components/projects/ProjectEditSessionChatInput'
import { ProjectEditSessionContextPanel } from '../components/projects/ProjectEditSessionContextPanel'
import { ProjectEditSessionMessageList } from '../components/projects/ProjectEditSessionMessageList'
import { ProjectEditBriefWorkspace } from '../components/projects/brief/ProjectEditBriefWorkspace'
import { ProjectEditSessionRouteBoundaryNotice } from '../components/projects/ProjectEditSessionRouteBoundaryNotice'
import { ProjectEditSessionRouteSectionHeader } from '../components/projects/ProjectEditSessionRouteSectionHeader'
import { ProjectEditSessionRouteTabs } from '../components/projects/ProjectEditSessionRouteTabs'
import {
  appendProjectEditSessionChatTurnViaApi,
  createProjectEditSessionChatBoundarySummary,
  loadProjectEditSessionChatBundleForUI,
  type ProjectEditSessionChatBundleForUI,
} from '../lib/project-edit-session-chat-ui-adapter'
import type { ProjectEditSessionMemoryUpdateNoticeModel } from '../lib/project-edit-session-memory-ui-adapter'
import {
  createProjectEditSessionProjectHomeClient,
  MOCK_PROJECT_HOME_PROJECT_ID,
} from '../lib/project-edit-session-project-home-ui-adapter'
import { createProjectEditSessionNavigationBoundary } from '../lib/project-edit-session-navigation'
import {
  createProjectEditSessionBreadcrumbs,
  createProjectEditSessionRouteSummary,
  createProjectEditSessionRouteTabs,
  getProjectEditSessionRouteSectionFromPath,
} from '../lib/project-edit-session-route-models'

export function ProjectEditSessionChatPage() {
  const params = useParams<{ projectId: string; editSessionId: string }>()
  const location = useLocation()
  const projectId = params.projectId ?? MOCK_PROJECT_HOME_PROJECT_ID
  const editSessionId = params.editSessionId
  const routeSection = useMemo(() => getProjectEditSessionRouteSectionFromPath(location.pathname), [location.pathname])
  const apiClient = useMemo(() => createProjectEditSessionProjectHomeClient(projectId), [projectId])
  const boundary = useMemo(() => createProjectEditSessionChatBoundarySummary(), [])
  const navigationBoundary = useMemo(() => createProjectEditSessionNavigationBoundary(), [])
  const [bundleModel, setBundleModel] = useState<ProjectEditSessionChatBundleForUI | undefined>()
  const [messageText, setMessageText] = useState('')
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Loading mock Edit Chat history.')
  const [memoryUpdateNotice, setMemoryUpdateNotice] = useState<ProjectEditSessionMemoryUpdateNoticeModel | undefined>()

  async function refreshBundle(nextStatus?: string) {
    if (!editSessionId) return
    const nextBundle = await loadProjectEditSessionChatBundleForUI({
      projectId,
      editSessionId,
      client: apiClient,
    })
    setBundleModel(nextBundle)
    setStatusMessage(nextStatus ?? (nextBundle.bundle ? 'Mock Edit Chat loaded.' : 'Mock Edit Chat could not be found.'))
  }

  useEffect(() => {
    let cancelled = false
    if (!editSessionId) {
      return
    }

    loadProjectEditSessionChatBundleForUI({ projectId, editSessionId, client: apiClient }).then((nextBundle) => {
      if (cancelled) return
      setBundleModel(nextBundle)
      setStatusMessage(nextBundle.bundle ? 'Mock Edit Chat loaded.' : 'Mock Edit Chat could not be found.')
    })

    return () => {
      cancelled = true
    }
  }, [apiClient, editSessionId, projectId])

  async function handleSubmit() {
    const text = messageText.trim()
    if (!text || !editSessionId || busy) return
    setBusy(true)
    setStatusMessage('Saving mock Edit Chat message...')
    try {
      const result = await appendProjectEditSessionChatTurnViaApi({
        projectId,
        editSessionId,
        text,
        client: apiClient,
      })
      setMessageText('')
      setMemoryUpdateNotice(result.memoryUpdateNotice)
      await refreshBundle(result.revisionDetected
        ? 'Mock revision and structured memory captured. Approval remains reset until a future planning milestone.'
        : 'Mock message, assistant response, and structured memory saved.')
    } catch {
      setStatusMessage('Mock message save failed safely without production side effects.')
    } finally {
      setBusy(false)
    }
  }

  const header = bundleModel?.header
  const context = bundleModel?.context
  const messages = bundleModel?.messages ?? []
  const displayedStatusMessage = editSessionId ? statusMessage : 'Missing Edit Chat id.'
  const breadcrumbs = useMemo(() => createProjectEditSessionBreadcrumbs({
    editSessionId,
    editSessionTitle: header?.title,
    projectId,
    section: routeSection,
  }), [editSessionId, header?.title, projectId, routeSection])
  const routeTabs = useMemo(() => createProjectEditSessionRouteTabs({
    activeSection: routeSection,
    editSessionId,
    projectId,
  }), [editSessionId, projectId, routeSection])
  const routeSummary = useMemo(() => createProjectEditSessionRouteSummary(routeSection), [routeSection])

  return (
    <AppShell
      description="Open a mock/local persistent Edit Chat without starting generation, render, workers, providers, Supabase, or credits."
      eyebrow="Project Edit Session"
      title="Edit Chat"
    >
      <section
        className={`project-edit-session-chat-page project-edit-session-chat-page--${routeSection}`}
        data-route-section={routeSection}
        data-testid="edit-session-chat-page"
      >
        <ProjectEditSessionBreadcrumbs items={breadcrumbs} />
        <ProjectEditSessionRouteTabs tabs={routeTabs} />
        <ProjectEditSessionRouteSectionHeader section={routeSection} summary={routeSummary} />
        <ProjectEditSessionRouteBoundaryNotice boundary={navigationBoundary} />
        {header ? <ProjectEditSessionChatHeader header={header} /> : null}
        {!header ? (
          <Card className="project-edit-session-chat-missing" data-testid="edit-session-chat-missing">
            <span className="section-eyebrow">Edit Chat unavailable</span>
            <h1>Mock Edit Chat not found</h1>
            <p>{displayedStatusMessage}</p>
          </Card>
        ) : null}

        <ProjectEditSessionBoundaryNotice boundary={bundleModel?.boundary ?? boundary} />

        <div className="project-edit-session-chat-page__status" data-testid="edit-session-chat-status" role="status">
          {displayedStatusMessage}
        </div>

        {header && routeSection === 'brief' ? (
          <ProjectEditBriefWorkspace
            editSessionId={editSessionId ?? ''}
            editSessionTitle={header.title}
            projectId={projectId}
          />
        ) : null}

        {header && context && routeSection !== 'brief' ? (
          <div className="project-edit-session-chat-page__layout">
            <main className="project-edit-session-chat-main" data-testid="edit-session-chat-main">
              <ProjectEditSessionMessageList messages={messages} />
              <ProjectEditSessionChatInput
                disabled={busy}
                onChange={setMessageText}
                onSubmit={handleSubmit}
                value={messageText}
              />
            </main>
            <ProjectEditSessionContextPanel
              client={apiClient}
              context={context}
              editSessionId={editSessionId ?? ''}
              memoryUpdateNotice={memoryUpdateNotice}
              onHistoryChanged={refreshBundle}
              projectId={projectId}
            />
          </div>
        ) : null}
      </section>
    </AppShell>
  )
}
