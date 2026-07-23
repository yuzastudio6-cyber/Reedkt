import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { ChatNativeEditor } from '../components/editor/ChatNativeEditor'
import { useProjectPersistenceScope } from '../hooks/useProjectPersistenceScope'
import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import {
  readLocalInternalProjectHandoffFromBackend,
  type InternalEditStateBackendReadResult,
} from '../lib/internal-edit-state-backend-sync'
import {
  getLocalInternalEditHandoff,
  saveLocalInternalProjectHandoff,
  type LocalInternalProjectHandoff,
} from '../lib/local-project-handoff'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'
import {
  isMotionStudioStorytellingHandoff,
  isVerifiedMotionStudioStorytellingProductionAssociation,
  motionStudioStorytellingWorkspaceRoute,
} from '../lib/motion-studio/contracts/storytelling-workflow'
import { projectMotionStudioProduction } from '../lib/motion-studio/shell/shell-model'

type NamedEditResolution =
  | { status: 'loading' }
  | { status: 'ready'; handoff: LocalInternalProjectHandoff }
  | {
      status: 'not_found' | 'access_denied' | 'unavailable' | 'invalid_response'
      message: string
      retryable: boolean
    }

export function EditorPage() {
  const projectPersistenceScope = useProjectPersistenceScope()
  const { editSessionId, projectId } = useParams()

  if (projectId && editSessionId) {
    const resolutionKey = JSON.stringify([
      projectPersistenceScope.authMode,
      projectPersistenceScope.userId,
      projectPersistenceScope.workspaceId,
      projectId,
      editSessionId,
    ])

    return (
      <NamedEditWorkspaceBoundary
        editSessionId={editSessionId}
        key={resolutionKey}
        projectId={projectId}
        scope={projectPersistenceScope}
      />
    )
  }

  return <EditorWorkspace scope={projectPersistenceScope} />
}

function NamedEditWorkspaceBoundary({
  editSessionId,
  projectId,
  scope,
}: {
  editSessionId: string
  projectId: string
  scope: ProjectPersistenceScope
}) {
  const localHandoff = getLocalInternalEditHandoff(scope, projectId, editSessionId)
  const [attempt, setAttempt] = useState(0)
  const [resolution, setResolution] = useState<NamedEditResolution>(() =>
    localHandoff
      ? { status: 'ready', handoff: localHandoff }
      : { status: 'loading' },
  )

  useEffect(() => {
    if (localHandoff) return

    let active = true
    void readLocalInternalProjectHandoffFromBackend(scope, projectId, editSessionId)
      .then((result) => {
        if (!active) return

        if (result.status === 'found') {
          // Persist before mounting the editor so every setup-backed useState initializer
          // receives the exact recovered handoff on its first render.
          const recovered = saveLocalInternalProjectHandoff(scope, result.handoff, { syncBackend: false })
          setResolution({ status: 'ready', handoff: recovered })
          return
        }

        setResolution(resolutionFromBackendRead(result, scope))
      })
      .catch(() => {
        if (!active) return
        setResolution({
          status: 'unavailable',
          message: 'Private edit state could not be loaded from the backend.',
          retryable: true,
        })
      })

    return () => {
      active = false
    }
  }, [attempt, editSessionId, localHandoff, projectId, scope])

  if (resolution.status === 'ready') {
    if (isMotionStudioStorytellingHandoff(resolution.handoff)) {
      return <VerifiedStorytellingRedirect handoff={resolution.handoff} />
    }

    const editorKey = JSON.stringify([
      scope.authMode,
      scope.userId,
      scope.workspaceId,
      resolution.handoff.projectId,
      resolution.handoff.editSessionId,
      resolution.handoff.updatedAt,
    ])
    return <EditorWorkspace editorKey={editorKey} scope={scope} />
  }

  if (resolution.status === 'loading') {
    return (
      <EditorShell>
        <section
          aria-label="Loading named edit"
          aria-live="polite"
          className="clean-empty-state"
          data-testid="named-edit-route-loading"
          role="status"
        >
          <span aria-hidden="true" className="route-loading-mark" />
          <h2>Loading this edit</h2>
          <p>Checking the exact signed-in workspace, project, and saved edit state before opening the editor.</p>
        </section>
      </EditorShell>
    )
  }

  const copy = namedEditFailureCopy(resolution.status)
  return (
    <EditorShell>
      <section
        aria-live="assertive"
        className="clean-empty-state"
        data-testid={`named-edit-route-${resolution.status.replace('_', '-')}`}
        role="alert"
      >
        <h2>{copy.title}</h2>
        <p>{resolution.message}</p>
        <p>{copy.guidance}</p>
        <div className="clean-hero-actions">
          {resolution.retryable && (
            <Button
              data-testid="named-edit-route-retry"
              onClick={() => {
                setResolution({ status: 'loading' })
                setAttempt((current) => current + 1)
              }}
              variant="primary"
            >
              Retry
            </Button>
          )}
          <Button
            to={resolution.status === 'not_found'
              ? `/projects/${encodeURIComponent(projectId)}`
              : '/edit-videos'}
            variant="secondary"
          >
            {resolution.status === 'not_found' ? 'Back to project' : 'Back to video edits'}
          </Button>
        </div>
      </section>
    </EditorShell>
  )
}

function VerifiedStorytellingRedirect({
  handoff,
}: {
  handoff: LocalInternalProjectHandoff
}) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'ready' }
    | { status: 'not_found' | 'access_denied' | 'unavailable' | 'invalid_response'; message: string; retryable: boolean }
  >({ status: 'loading' })

  useEffect(() => {
    let active = true
    void motionStudioApiClient.getProduction(handoff.projectId, handoff.editSessionId)
      .then((response) => {
        if (!active) return
        if (!response.ok) {
          setState({
            status: response.statusCode === 401 || response.statusCode === 403
              ? 'access_denied'
              : response.statusCode === 404
                ? 'not_found'
                : 'unavailable',
            message: response.error?.message ?? 'The exact Storytelling production could not be verified.',
            retryable: response.statusCode >= 500,
          })
          return
        }
        const production = projectMotionStudioProduction(response.data?.production)
        if (
          !production ||
          !isVerifiedMotionStudioStorytellingProductionAssociation(handoff, production)
        ) {
          setState({
            status: 'invalid_response',
            message: 'The saved Motion workflow and current Storytelling production did not identify one exact Project and Named Edit.',
            retryable: false,
          })
          return
        }
        setState({ status: 'ready' })
      })
      .catch(() => {
        if (!active) return
        setState({
          status: 'unavailable',
          message: 'The current Storytelling production could not be reverified.',
          retryable: true,
        })
      })
    return () => {
      active = false
    }
  }, [attempt, handoff])

  if (state.status === 'ready') {
    return <Navigate replace to={motionStudioStorytellingWorkspaceRoute(handoff.projectId, handoff.editSessionId)} />
  }
  if (state.status === 'loading') {
    return (
      <EditorShell>
        <section
          aria-label="Verifying Storytelling workspace"
          aria-live="polite"
          className="clean-empty-state"
          data-testid="storytelling-route-verification-loading"
          role="status"
        >
          <span aria-hidden="true" className="route-loading-mark" />
          <h2>Verifying Storytelling workspace</h2>
          <p>Checking the exact current Motion Studio production before leaving normal Edit Chat.</p>
        </section>
      </EditorShell>
    )
  }
  return (
    <EditorShell>
      <section
        aria-live="assertive"
        className="clean-empty-state"
        data-testid={`storytelling-route-verification-${state.status.replace('_', '-')}`}
        role="alert"
      >
        <h2>Storytelling workspace could not open</h2>
        <p>{state.message}</p>
        <p>No normal Edit Chat, replacement production, planning, generation, or credit action was started.</p>
        <div className="clean-hero-actions">
          {state.retryable && (
            <Button
              onClick={() => {
                setState({ status: 'loading' })
                setAttempt((current) => current + 1)
              }}
              variant="primary"
            >
              Retry verification
            </Button>
          )}
          <Button to="/motion-studio/storytelling" variant="secondary">
            Back to Storytelling library
          </Button>
        </div>
      </section>
    </EditorShell>
  )
}

function resolutionFromBackendRead(
  result: Exclude<InternalEditStateBackendReadResult, { status: 'found' }>,
  scope: ProjectPersistenceScope,
): NamedEditResolution {
  if (result.status === 'unavailable' && result.backendConfigured === false && scope.authMode === 'local_test') {
    return {
      status: 'not_found',
      message: 'No saved edit matches this project and edit address in the current local test workspace.',
      retryable: false,
    }
  }

  return {
    status: result.status,
    message: result.errorMessage,
    retryable: result.retryable,
  }
}

function namedEditFailureCopy(status: Exclude<NamedEditResolution['status'], 'loading' | 'ready'>) {
  if (status === 'not_found') {
    return {
      title: 'Edit not found',
      guidance: 'Open the project and choose one of its saved edits. No upload, planning, approval, or generation started.',
    }
  }
  if (status === 'access_denied') {
    return {
      title: 'Edit access denied',
      guidance: 'Use a workspace that owns this edit or ask a workspace administrator to restore access.',
    }
  }
  if (status === 'invalid_response') {
    return {
      title: 'Edit state rejected',
      guidance: 'The recovered record did not match this signed-in route, so ReeditPro kept the editor closed.',
    }
  }
  return {
    title: 'Edit could not be loaded',
    guidance: 'Check the private backend connection, then retry. No edit work or credit action started.',
  }
}

function EditorWorkspace({
  editorKey,
  scope,
}: {
  editorKey?: string
  scope: ProjectPersistenceScope
}) {
  return (
    <EditorShell>
      <ChatNativeEditor key={editorKey} projectPersistenceScope={scope} />
    </EditorShell>
  )
}

function EditorShell({ children }: { children: ReactNode }) {
  return (
    <AppShell
      chrome="editor"
      description="Upload source video, direct the edit in Chat, approve its plan and estimate, and review the private result."
      eyebrow="Video editing"
      primaryAction={false}
      title="Video Edit Chat"
    >
      {children}
    </AppShell>
  )
}
