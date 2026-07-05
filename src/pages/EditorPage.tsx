import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Card } from '../components/Card'
import { ProjectEditSessionBreadcrumbs } from '../components/projects/ProjectEditSessionBreadcrumbs'
import { ProjectEditSessionChatHeader } from '../components/projects/ProjectEditSessionChatHeader'
import { ProjectEditSessionChatInput } from '../components/projects/ProjectEditSessionChatInput'
import { ProjectEditSessionContextPanel } from '../components/projects/ProjectEditSessionContextPanel'
import { ProjectEditSessionMessageList } from '../components/projects/ProjectEditSessionMessageList'
import { ProjectEditBriefWorkspace } from '../components/projects/brief/ProjectEditBriefWorkspace'
import { ProjectEditSessionRouteSectionHeader } from '../components/projects/ProjectEditSessionRouteSectionHeader'
import { ProjectEditSessionRouteTabs } from '../components/projects/ProjectEditSessionRouteTabs'
import {
  appendProjectEditSessionChatTurnViaApi,
  createProjectEditSessionChatHeaderModelFromRecord,
  loadProjectEditSessionChatBundleForUI,
  type ProjectEditSessionChatBundleForUI,
  type ProjectEditSessionChatHeaderModel,
} from '../lib/project-edit-session-chat-ui-adapter'
import {
  createProjectEditSessionBackendLocalConfig,
  readProjectEditSessionBackendLocal,
  type ProjectEditSessionBackendLocalRecord,
} from '../lib/project-edit-session-backend-local'
import type { ProjectEditSessionMemoryUpdateNoticeModel } from '../lib/project-edit-session-memory-ui-adapter'
import {
  createProjectEditSessionProjectHomeClient,
  MOCK_PROJECT_HOME_PROJECT_ID,
} from '../lib/project-edit-session-project-home-ui-adapter'
import {
  createProjectEditSessionBreadcrumbs,
  createProjectEditSessionRouteSummary,
  createProjectEditSessionRouteTabs,
  getProjectEditSessionRouteSectionFromPath,
} from '../lib/project-edit-session-route-models'

export function EditorPage() {
  const params = useParams<{ projectId: string; editSessionId: string }>()
  const location = useLocation()
  const projectId = params.projectId ?? MOCK_PROJECT_HOME_PROJECT_ID
  const editSessionId = params.editSessionId
  const routeSection = useMemo(() => getProjectEditSessionRouteSectionFromPath(location.pathname), [location.pathname])
  const apiClient = useMemo(() => createProjectEditSessionProjectHomeClient(projectId), [projectId])
  const backendLocalConfig = useMemo(() => createProjectEditSessionBackendLocalConfig(import.meta.env), [])
  const [bundleModel, setBundleModel] = useState<ProjectEditSessionChatBundleForUI | undefined>()
  const [backendLocalHeader, setBackendLocalHeader] = useState<ProjectEditSessionChatHeaderModel | undefined>()
  const [backendLocalEditSession, setBackendLocalEditSession] = useState<ProjectEditSessionBackendLocalRecord | undefined>()
  const [messageText, setMessageText] = useState('')
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Loading edit history.')
  const [memoryUpdateNotice, setMemoryUpdateNotice] = useState<ProjectEditSessionMemoryUpdateNoticeModel | undefined>()

  async function refreshBundle(nextStatus?: string) {
    if (!editSessionId) return
    const nextBundle = await loadProjectEditSessionChatBundleForUI({
      projectId,
      editSessionId,
      client: apiClient,
    })
    setBundleModel(nextBundle)
    setStatusMessage(nextStatus ?? (nextBundle.bundle ? 'Edit loaded.' : 'Edit could not be found.'))
  }

  useEffect(() => {
    let cancelled = false
    if (!editSessionId) {
      return
    }

    async function loadEdit() {
      const nextBundle = await loadProjectEditSessionChatBundleForUI({ projectId, editSessionId: editSessionId ?? '', client: apiClient })
      if (cancelled) return
      setBundleModel(nextBundle)

      if (nextBundle.header) {
        setBackendLocalHeader(undefined)
        setBackendLocalEditSession(undefined)
        setStatusMessage('Edit loaded.')
        return
      }

      if (backendLocalConfig.available && backendLocalConfig.apiBaseUrl) {
        try {
          const readback = await readProjectEditSessionBackendLocal({
            apiBaseUrl: backendLocalConfig.apiBaseUrl,
            editSessionId: editSessionId ?? '',
            workspaceId: backendLocalConfig.workspaceId,
          })
          if (cancelled) return
          setBackendLocalEditSession(readback.editSession)
          setBackendLocalHeader(createProjectEditSessionChatHeaderModelFromRecord(readback.editSession))
          setStatusMessage('Backend-local edit readback verified.')
          return
        } catch {
          // Fall through to the not-found copy below.
        }
      }

      setBackendLocalHeader(undefined)
      setBackendLocalEditSession(undefined)
      setStatusMessage('Edit could not be found.')
    }

    loadEdit()

    return () => {
      cancelled = true
    }
  }, [apiClient, backendLocalConfig.apiBaseUrl, backendLocalConfig.available, backendLocalConfig.workspaceId, editSessionId, projectId])

  async function handleSubmit() {
    const text = messageText.trim()
    if (!text || !editSessionId || busy) return
    setBusy(true)
    setStatusMessage('Saving message...')
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
        ? 'Revision note saved. Approval will refresh before work starts.'
        : 'Message saved.')
    } catch {
      setStatusMessage('Message could not be saved. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const header = bundleModel?.header ?? backendLocalHeader
  const context = bundleModel?.context
  const messages = bundleModel?.messages ?? []
  const displayedStatusMessage = editSessionId ? statusMessage : 'Missing edit id.'
  const isBriefSection = routeSection === 'brief'
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
      description="Upload video, write the brief, chat through the edit plan, review approvals, and preview the result inside this edit."
      eyebrow="Edit"
      primaryAction={false}
      title="Edit workspace"
    >
      <section
        className={`project-edit-session-chat-page project-edit-session-chat-page--${routeSection}`}
        data-route-section={routeSection}
        data-testid="edit-session-chat-page"
      >
        {!isBriefSection ? <ProjectEditSessionBreadcrumbs items={breadcrumbs} /> : null}
        {!isBriefSection ? <ProjectEditSessionRouteTabs tabs={routeTabs} /> : null}
        {!isBriefSection ? <ProjectEditSessionRouteSectionHeader section={routeSection} summary={routeSummary} /> : null}
        {header && !isBriefSection ? <ProjectEditSessionChatHeader header={header} /> : null}
        {!header ? (
          <Card className="project-edit-session-chat-missing" data-testid="edit-session-chat-missing">
            <span className="section-eyebrow">Edit unavailable</span>
            <h1>Edit not found</h1>
            <p>{displayedStatusMessage}</p>
          </Card>
        ) : null}

        {!isBriefSection ? (
          <div className="project-edit-session-chat-page__status project-edit-session-chat-page__status--quiet" data-testid="edit-session-chat-status" role="status">
            {displayedStatusMessage}
          </div>
        ) : null}

        {header && isBriefSection ? (
          <ProjectEditBriefWorkspace
            backendLocalEditSession={backendLocalEditSession}
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
