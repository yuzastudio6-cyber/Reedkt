import {
  AlertTriangle,
  FolderSearch2,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
} from 'lucide-react'
import { lazy, Suspense, useCallback, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { StorytellingDirectorWorkspace } from '../components/motion-studio/storytelling/StorytellingDirectorWorkspace'
import { StorytellingWorkspaceHeader } from '../components/motion-studio/storytelling/StorytellingWorkspaceHeader'
import { useMotionStudioStorytellingWorkspaceHandoff } from '../hooks/useMotionStudioStorytellingWorkspaceHandoff'
import { createStorytellingReviewContext } from '../lib/motion-studio/storytelling-review-context'
import {
  resolveStorytellingWorkspace,
  type StorytellingWorkspace,
} from '../lib/motion-studio/storytelling-workspace-model'
import {
  motionStudioStorytellingWorkspaceRoute,
  reeditproParentProjectRoute,
} from '../lib/motion-studio/contracts/storytelling-workflow'
import { MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE } from '../types/motion-studio/storytelling-workflow'
import styles from './MotionStudioStorytellingWorkspacePage.module.css'

const StorytellingWorkspaceSurface = lazy(() =>
  import('../components/motion-studio/storytelling/StorytellingWorkspaceSurface').then((module) => ({
    default: module.StorytellingWorkspaceSurface,
  })),
)

/**
 * Dedicated Motion Studio Storytelling workspace. It shares ReEditPro's
 * AppShell and exact Project/Edit authorities without mounting the ordinary
 * Edit Chat or inferring Motion access from category/query state.
 */
export function MotionStudioStorytellingWorkspacePage() {
  const { editSessionId = '', projectId = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const workspace = useMotionStudioStorytellingWorkspaceHandoff(projectId, editSessionId)
  const [directorPrompt, setDirectorPrompt] = useState<string>()
  const activeWorkspace = resolveStorytellingWorkspace(searchParams.get('surface'))
  const workspacePath = safeWorkspacePath(projectId, editSessionId)

  const selectWorkspace = useCallback((nextWorkspace: StorytellingWorkspace) => {
    const next = new URLSearchParams()
    if (nextWorkspace !== 'chat') next.set('surface', nextWorkspace)
    setSearchParams(next)
  }, [setSearchParams])

  const consumeDirectorPrompt = useCallback(() => setDirectorPrompt(undefined), [])

  function discussStyle(displayName: string) {
    setDirectorPrompt(`I want to explore the ${displayName} direction for this story. `)
    selectWorkspace('chat')
  }

  function continueRecordedRevision() {
    workspace.retry()
    selectWorkspace('chat')
  }

  return (
    <AppShell
      chrome="editor"
      description="Direct and review one exact Storytelling production."
      primaryAction={false}
      title="Storytelling"
    >
      <div className={styles.page} data-testid="motion-studio-storytelling-workspace-page">
        {workspace.state === 'ready' && workspace.handoff ? (
          <>
            <StorytellingWorkspaceHeader
              activeWorkspace={activeWorkspace}
              backLabel="Back to Storytelling library"
              backPath={MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE}
              editName={workspace.handoff.editName ?? workspace.handoff.projectName}
              onSelectWorkspace={selectWorkspace}
              parentProjectName={workspace.handoff.projectName}
              projectPath={reeditproParentProjectRoute(workspace.handoff.projectId)}
            />
            <section aria-label="Current Storytelling workspace" className={styles.content}>
              {activeWorkspace === 'chat' ? (
                <StorytellingDirectorWorkspace
                  handoff={workspace.handoff}
                  initialPrompt={directorPrompt}
                  onOpenReview={() => selectWorkspace('review')}
                  onOpenSources={() => selectWorkspace('sources')}
                  onPromptConsumed={consumeDirectorPrompt}
                  persistenceStatus={workspace.persistenceStatus}
                  retryPersistence={workspace.retryPersistence}
                  updateHandoff={workspace.updateHandoff}
                />
              ) : (
                <Suspense fallback={<WorkspaceLoading inWorkspace label="Opening Storytelling workspace" />}>
                  <StorytellingWorkspaceSurface
                    activeWorkspace={activeWorkspace}
                    editPath={workspacePath}
                    editSessionId={workspace.handoff.editSessionId}
                    onDiscussStyle={discussStyle}
                    onRevisionRecorded={continueRecordedRevision}
                    onReturnToChat={() => selectWorkspace('chat')}
                    projectId={workspace.handoff.projectId}
                    reviewContext={createStorytellingReviewContext(workspace.handoff)}
                    sourceCount={workspace.handoff.sourceFileCount}
                  />
                </Suspense>
              )}
            </section>
          </>
        ) : (
          <WorkspaceEntryState
            message={workspace.message}
            onBack={() => navigate(MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE)}
            onRetry={workspace.retry}
            state={workspace.state}
          />
        )}
      </div>
    </AppShell>
  )
}

function WorkspaceEntryState({
  message,
  onBack,
  onRetry,
  state,
}: {
  message?: string
  onBack: () => void
  onRetry: () => void
  state: ReturnType<typeof useMotionStudioStorytellingWorkspaceHandoff>['state']
}) {
  if (state === 'loading') return <WorkspaceLoading label="Verifying Storytelling workspace" />

  const denied = state === 'access_denied'
  const unavailable = state === 'unavailable'
  const invalid = state === 'invalid_response' || state === 'not_storytelling'
  const Icon = denied ? LockKeyhole : invalid ? AlertTriangle : FolderSearch2
  return (
    <section
      className={styles.entryState}
      data-testid={`storytelling-workspace-entry-${state.replace('_', '-')}`}
      role={denied || invalid ? 'alert' : 'status'}
    >
      <span aria-hidden="true" className={styles.entryIcon}><Icon size={24} /></span>
      <div>
        <h1>{denied
          ? 'Storytelling access is unavailable'
          : invalid
            ? 'This is not a Storytelling workspace'
            : state === 'not_found'
              ? 'Storytelling project not found'
              : 'Storytelling could not be opened'}</h1>
        <p>{message ?? 'The exact Project and Named Edit could not be verified.'}</p>
      </div>
      <div className={styles.entryActions}>
        {unavailable ? <Button icon={RefreshCw} onClick={onRetry} variant="primary">Try again</Button> : null}
        <Button onClick={onBack} variant={unavailable ? 'ghost' : 'primary'}>Back to Storytelling</Button>
      </div>
    </section>
  )
}

function WorkspaceLoading({
  inWorkspace = false,
  label,
}: {
  inWorkspace?: boolean
  label: string
}) {
  const Heading = inWorkspace ? 'h2' : 'h1'
  return (
    <section aria-live="polite" className={styles.entryState} role="status">
      <LoaderCircle aria-hidden="true" className={styles.spin} size={24} />
      <div><Heading>{label}</Heading><p>Checking the exact workspace, project, named edit, and production authority.</p></div>
    </section>
  )
}

function safeWorkspacePath(projectId: string, editSessionId: string): string {
  try {
    return motionStudioStorytellingWorkspaceRoute(projectId, editSessionId)
  } catch {
    return MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE
  }
}
