import {
  AlertTriangle,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
} from 'lucide-react'
import { useMotionStudioAnimaticWorkspace } from '../../../hooks/useMotionStudioAnimaticWorkspace'
import { useMotionStudioAudioWorkspace } from '../../../hooks/useMotionStudioAudioWorkspace'
import { useMotionStudioVoiceCastingWorkspace } from '../../../hooks/useMotionStudioVoiceCastingWorkspace'
import { useMotionStudioGenerationWorkspace } from '../../../hooks/useMotionStudioGenerationWorkspace'
import { useMotionStudioLayeredWorkspace } from '../../../hooks/useMotionStudioLayeredWorkspace'
import { useMotionStudioProduction } from '../../../hooks/useMotionStudioProduction'
import { useMotionStudioResearchWorkspace } from '../../../hooks/useMotionStudioResearchWorkspace'
import { useMotionStudioSceneWorkspace } from '../../../hooks/useMotionStudioSceneWorkspace'
import { useMotionStudioStoryWorkspace } from '../../../hooks/useMotionStudioStoryWorkspace'
import type { StorytellingReviewContext } from '../../../lib/motion-studio/storytelling-review-context'
import { storytellingWorkspaceLabel, type StorytellingWorkspace } from '../../../lib/motion-studio/storytelling-workspace-model'
import type { MotionStudioProductionDto } from '../../../types/motion-studio'
import { MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE } from '../../../types/motion-studio/storytelling-workflow'
import { Button } from '../../Button'
import { StorytellingAssetsWorkspace } from './StorytellingAssetsWorkspace'
import { StorytellingAudioWorkspace } from './StorytellingAudioWorkspace'
import { StorytellingPreviewWorkspace } from './StorytellingPreviewWorkspace'
import { StorytellingReviewWorkspace } from './StorytellingReviewWorkspace'
import { StorytellingScenesWorkspace } from './StorytellingScenesWorkspace'
import { StorytellingSourcesWorkspace } from './StorytellingSourcesWorkspace'
import { StorytellingStoryWorkspace } from './StorytellingStoryWorkspace'
import { StorytellingTimelineWorkspace } from './StorytellingTimelineWorkspace'
import styles from './StorytellingWorkspaceSurface.module.css'

interface StorytellingWorkspaceSurfaceProps {
  activeWorkspace: Exclude<StorytellingWorkspace, 'chat'>
  editPath: string
  editSessionId: string
  onDiscussStyle: (displayName: string) => void
  onRevisionRecorded?: () => void
  onReturnToChat: () => void
  projectId: string
  reviewContext: StorytellingReviewContext
  sourceCount: number
}

export function StorytellingWorkspaceSurface({
  activeWorkspace,
  editPath,
  editSessionId,
  onDiscussStyle,
  onRevisionRecorded,
  onReturnToChat,
  projectId,
  reviewContext,
  sourceCount,
}: StorytellingWorkspaceSurfaceProps) {
  const productionState = useMotionStudioProduction(projectId, editSessionId)
  const production = productionState.production
  const usableProduction = Boolean(production && !['loading', 'failure', 'permission_denied', 'stale', 'version_conflict'].includes(productionState.resourceState))
  const research = useMotionStudioResearchWorkspace(
    production?.id,
    Boolean(usableProduction && activeWorkspace === 'sources'),
  )
  const storyWorkspace = useMotionStudioStoryWorkspace(
    production?.id,
    projectId,
    editSessionId,
    Boolean(usableProduction && activeWorkspace === 'story'),
  )
  const sceneWorkspace = useMotionStudioSceneWorkspace(
    production?.id,
    Boolean(usableProduction && ['scenes', 'timeline', 'assets'].includes(activeWorkspace)),
    productionState.workGraph,
  )
  const layeredWorkspace = useMotionStudioLayeredWorkspace(
    production?.id,
    Boolean(usableProduction && activeWorkspace === 'assets'),
    sceneWorkspace.workspace,
    productionState.workGraph,
  )
  const generationWorkspace = useMotionStudioGenerationWorkspace(
    production?.id,
    Boolean(usableProduction && activeWorkspace === 'assets'),
    sceneWorkspace.workspace,
    productionState.workGraph,
  )
  const animaticWorkspace = useMotionStudioAnimaticWorkspace(
    production?.id,
    Boolean(usableProduction && activeWorkspace === 'preview'),
    productionState.workGraph,
  )
  const audioWorkspace = useMotionStudioAudioWorkspace(
    production?.id,
    projectId,
    editSessionId,
    Boolean(usableProduction && activeWorkspace === 'audio'),
  )
  const voiceCastingWorkspace = useMotionStudioVoiceCastingWorkspace(
    production?.id,
    projectId,
    editSessionId,
    Boolean(usableProduction && activeWorkspace === 'audio'),
  )

  const titleId = `storytelling-${activeWorkspace}-heading`

  return (
    <section
      aria-labelledby={titleId}
      className={styles.surface}
      data-testid="storytelling-workspace-panel"
      id="storytelling-workspace-panel"
      role="tabpanel"
    >
      <header className={styles.header}>
        <div>
          <h2 id={titleId}>{workspaceHeading(activeWorkspace)}</h2>
          <p>{workspaceDescription(activeWorkspace)}</p>
        </div>
      </header>

      {renderWorkspace({
        activeWorkspace,
        animaticWorkspace,
        audioWorkspace,
        voiceCastingWorkspace,
        editPath,
        generationWorkspace,
        layeredWorkspace,
        onDiscussStyle,
        onRevisionRecorded: onRevisionRecorded ?? onReturnToChat,
        onReturnToChat,
        production,
        productionState,
        research,
        reviewContext,
        sceneWorkspace,
        sourceCount,
        storyWorkspace,
      })}
    </section>
  )
}

function renderWorkspace(input: {
  activeWorkspace: Exclude<StorytellingWorkspace, 'chat'>
  animaticWorkspace: ReturnType<typeof useMotionStudioAnimaticWorkspace>
  audioWorkspace: ReturnType<typeof useMotionStudioAudioWorkspace>
  voiceCastingWorkspace: ReturnType<typeof useMotionStudioVoiceCastingWorkspace>
  editPath: string
  generationWorkspace: ReturnType<typeof useMotionStudioGenerationWorkspace>
  layeredWorkspace: ReturnType<typeof useMotionStudioLayeredWorkspace>
  onDiscussStyle: (displayName: string) => void
  onRevisionRecorded: () => void
  onReturnToChat: () => void
  production?: MotionStudioProductionDto
  productionState: ReturnType<typeof useMotionStudioProduction>
  research: ReturnType<typeof useMotionStudioResearchWorkspace>
  reviewContext: StorytellingReviewContext
  sceneWorkspace: ReturnType<typeof useMotionStudioSceneWorkspace>
  sourceCount: number
  storyWorkspace: ReturnType<typeof useMotionStudioStoryWorkspace>
}) {
  const {
    activeWorkspace,
    animaticWorkspace,
    audioWorkspace,
    voiceCastingWorkspace,
    editPath,
    generationWorkspace,
    layeredWorkspace,
    onDiscussStyle,
    onRevisionRecorded,
    onReturnToChat,
    production,
    productionState,
    research,
    reviewContext,
    sceneWorkspace,
    sourceCount,
    storyWorkspace,
  } = input

  if (!production) {
    return (
      <ProductionEntryState
        activeWorkspace={activeWorkspace}
        resourceState={productionState.resourceState}
        retry={() => { void productionState.retry() }}
      />
    )
  }

  if (['failure', 'permission_denied', 'stale', 'version_conflict'].includes(productionState.resourceState)) {
    return (
      <UnavailableState
        denied={productionState.resourceState === 'permission_denied'}
        message={safeResourceMessage(productionState.resourceState)}
        onRetry={() => { void productionState.retry() }}
        retryable={productionState.resourceState !== 'permission_denied'}
      />
    )
  }

  if (activeWorkspace === 'story') {
    return (
      <StorytellingStoryWorkspace
        onDiscussStyle={onDiscussStyle}
        onReturnToChat={onReturnToChat}
        story={storyWorkspace}
      />
    )
  }

  if (activeWorkspace === 'scenes') {
    return (
      <StorytellingScenesWorkspace
        defaultProductionMode={production.defaultProductionMode}
        onReturnToChat={onReturnToChat}
        scenes={sceneWorkspace}
      />
    )
  }

  if (activeWorkspace === 'preview') {
    return (
      <StorytellingPreviewWorkspace
        animatic={animaticWorkspace}
        onReturnToChat={onReturnToChat}
      />
    )
  }

  if (activeWorkspace === 'audio') {
    return (
      <StorytellingAudioWorkspace
        audio={audioWorkspace}
        onReturnToChat={onReturnToChat}
        voiceCasting={voiceCastingWorkspace}
      />
    )
  }

  if (activeWorkspace === 'timeline') {
    return <StorytellingTimelineWorkspace onReturnToChat={onReturnToChat} sceneWorkspace={sceneWorkspace} />
  }

  if (activeWorkspace === 'assets') {
    return (
      <StorytellingAssetsWorkspace
        generationWorkspace={generationWorkspace}
        layeredWorkspace={layeredWorkspace}
        onReturnToChat={onReturnToChat}
        sceneWorkspace={sceneWorkspace}
      />
    )
  }

  if (activeWorkspace === 'sources') {
    return <StorytellingSourcesWorkspace editPath={editPath} research={research} sourceCount={sourceCount} />
  }

  if (activeWorkspace === 'review') {
    return (
      <StorytellingReviewWorkspace
        editSessionId={production.editSessionId}
        onRevisionRecorded={onRevisionRecorded}
        onReturnToChat={onReturnToChat}
        production={production}
        projectId={production.projectId}
        reviewContext={reviewContext}
        workGraph={productionState.workGraph}
      />
    )
  }

  return null
}

function ProductionEntryState({
  activeWorkspace,
  resourceState,
  retry,
}: {
  activeWorkspace: Exclude<StorytellingWorkspace, 'chat'>
  resourceState: ReturnType<typeof useMotionStudioProduction>['resourceState']
  retry: () => void
}) {
  if (resourceState === 'loading') {
    return (
      <div aria-live="polite" className={styles.focalState} role="status">
        <LoaderCircle aria-hidden="true" className={styles.spin} size={24} />
        <div><h3>Checking this story</h3><p>Loading the exact Storytelling workspace for this named edit.</p></div>
      </div>
    )
  }

  if (resourceState !== 'first_use') {
    return (
      <UnavailableState
        message={safeResourceMessage(resourceState)}
        onRetry={retry}
        retryable={resourceState !== 'permission_denied'}
      />
    )
  }

  return (
    <div className={styles.focalState} data-testid="storytelling-workspace-production-missing" role="alert">
      <span aria-hidden="true" className={styles.focalIcon}><AlertTriangle size={22} /></span>
      <div className={styles.focalCopy}>
        <span className={styles.eyebrow}>{storytellingWorkspaceLabel(activeWorkspace)}</span>
        <h3>Open this story from the Storytelling library</h3>
        <p>The exact Storytelling production is missing. This route cannot create a replacement production.</p>
      </div>
      <div className={styles.actions}>
        <Button onClick={retry} variant="ghost">Check again</Button>
        <Button to={MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE} variant="primary">Back to Storytelling library</Button>
      </div>
    </div>
  )
}

function UnavailableState({
  denied = false,
  message,
  onRetry,
  retryable,
}: {
  denied?: boolean
  message: string
  onRetry: () => void
  retryable: boolean
}) {
  const Icon = denied ? LockKeyhole : AlertTriangle
  return (
    <div
      aria-live="assertive"
      className={styles.focalState}
      data-testid="storytelling-workspace-unavailable"
      role="alert"
    >
      <span aria-hidden="true" className={styles.focalIcon}><Icon size={22} /></span>
      <div className={styles.focalCopy}>
        <h3>{denied ? 'This story workspace is not available' : 'The story workspace could not be loaded'}</h3>
        <p>{message}</p>
      </div>
      {retryable ? <Button icon={RefreshCw} onClick={onRetry} variant="primary">Try again</Button> : null}
    </div>
  )
}

function workspaceHeading(workspace: Exclude<StorytellingWorkspace, 'chat'>): string {
  const labels: Record<Exclude<StorytellingWorkspace, 'chat'>, string> = {
    story: 'Story',
    scenes: 'Scenes & storyboard',
    preview: 'Preview',
    review: 'Review',
    timeline: 'Timeline',
    assets: 'Assets',
    audio: 'Audio',
    sources: 'Sources',
  }
  return labels[workspace]
}

function workspaceDescription(workspace: Exclude<StorytellingWorkspace, 'chat'>): string {
  const descriptions: Record<Exclude<StorytellingWorkspace, 'chat'>, string> = {
    story: 'Review the current story, motion direction, outline, and timed script.',
    scenes: 'Shape scene purpose, shots, storyboards, keyframes, and controlled motion.',
    preview: 'Watch the low-cost animatic and judge pacing, voice, and story flow before final production.',
    review: 'Resolve the exact decisions and quality issues that need your attention.',
    timeline: 'Inspect frame-accurate timing only when the approved story needs it.',
    assets: 'See the approved visual material attached to this exact story.',
    audio: 'Review narration, music, ambience, Foley, and mix readiness.',
    sources: 'See the story material and evidence attached to this named edit.',
  }
  return descriptions[workspace]
}

function safeResourceMessage(state: ReturnType<typeof useMotionStudioProduction>['resourceState']): string {
  const messages: Record<ReturnType<typeof useMotionStudioProduction>['resourceState'], string> = {
    first_use: 'This exact story has not created its private production workspace yet.',
    empty: 'The story workspace is ready for Director-led planning.',
    loading: 'The current story workspace is still loading.',
    partial_result: 'The current story is available, but its latest status could not be confirmed.',
    success: 'The current story workspace is available.',
    review_needed: 'A Storytelling decision needs review.',
    blocked: 'A required story decision is blocking the next step.',
    stale: 'A newer Storytelling version may exist. Reload before continuing.',
    version_conflict: 'This Storytelling version changed. Reload the accepted version before continuing.',
    failure: 'The private Storytelling state could not be loaded. No empty result was assumed.',
    permission_denied: 'Your current workspace cannot access this named edit.',
    recovery: 'The current Storytelling state was recovered.',
  }
  return messages[state]
}
