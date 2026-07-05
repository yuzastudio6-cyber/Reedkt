import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Card } from '../components/Card'
import { ProjectEditBriefWorkspace } from '../components/projects/brief/ProjectEditBriefWorkspace'
import {
  createProjectEditSessionChatHeaderModelFromRecord,
  loadProjectEditSessionChatBundleForUI,
  type ProjectEditSessionChatHeaderModel,
} from '../lib/project-edit-session-chat-ui-adapter'
import {
  createProjectEditSessionBackendLocalConfig,
  readProjectEditSessionBackendLocal,
  type ProjectEditSessionBackendLocalRecord,
} from '../lib/project-edit-session-backend-local'
import {
  createProjectEditSessionProjectHomeClient,
  MOCK_PROJECT_HOME_PROJECT_ID,
} from '../lib/project-edit-session-project-home-ui-adapter'

export function EditorPage() {
  const params = useParams<{ projectId: string; editSessionId: string }>()
  const projectId = params.projectId ?? MOCK_PROJECT_HOME_PROJECT_ID
  const editSessionId = params.editSessionId
  const apiClient = useMemo(() => createProjectEditSessionProjectHomeClient(projectId), [projectId])
  const backendLocalConfig = useMemo(() => createProjectEditSessionBackendLocalConfig(import.meta.env), [])
  const [backendLocalHeader, setBackendLocalHeader] = useState<ProjectEditSessionChatHeaderModel | undefined>()
  const [backendLocalEditSession, setBackendLocalEditSession] = useState<ProjectEditSessionBackendLocalRecord | undefined>()
  const [statusMessage, setStatusMessage] = useState('Loading edit history.')

  useEffect(() => {
    let cancelled = false
    if (!editSessionId) {
      return
    }

    async function loadEdit() {
      const nextBundle = await loadProjectEditSessionChatBundleForUI({ projectId, editSessionId: editSessionId ?? '', client: apiClient })
      if (cancelled) return

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

      if (nextBundle.header) {
        setBackendLocalHeader(nextBundle.header)
        setBackendLocalEditSession(undefined)
        setStatusMessage('Edit loaded.')
        return
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

  const header = backendLocalHeader
  const displayedStatusMessage = editSessionId ? statusMessage : 'Missing edit id.'

  return (
    <AppShell
      description="Upload video, write the brief, chat through the edit plan, review approvals, and preview the result inside this edit."
      eyebrow="Edit"
      primaryAction={false}
      title="Edit workspace"
    >
      <section
        className="project-edit-session-chat-page project-edit-session-chat-page--workspace"
        data-route-section="workspace"
        data-testid="edit-session-chat-page"
      >
        {!header ? (
          <Card className="project-edit-session-chat-missing" data-testid="edit-session-chat-missing">
            <span className="section-eyebrow">Edit unavailable</span>
            <h1>Edit not found</h1>
            <p>{displayedStatusMessage}</p>
          </Card>
        ) : null}

        {header ? (
          <ProjectEditBriefWorkspace
            backendLocalEditSession={backendLocalEditSession}
            editSessionId={editSessionId ?? ''}
            editSessionTitle={header.title}
            projectId={projectId}
          />
        ) : null}
      </section>
    </AppShell>
  )
}
