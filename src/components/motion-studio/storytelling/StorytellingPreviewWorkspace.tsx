import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Film,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Play,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

import { fetchMotionStudioPrivateAnimaticMedia } from '../../../backend/api/motion-studio-api-client'
import type { UseMotionStudioAnimaticWorkspaceResult } from '../../../hooks/useMotionStudioAnimaticWorkspace'
import type {
  MotionStudioAnimaticArtifactDto,
  MotionStudioAnimaticAssemblyReceiptDto,
  MotionStudioAnimaticBindingDto,
} from '../../../types/motion-studio'
import { Button } from '../../Button'
import styles from './StorytellingPreviewWorkspace.module.css'

interface StorytellingPreviewWorkspaceProps {
  animatic: UseMotionStudioAnimaticWorkspaceResult
  onReturnToChat: () => void
}

export function StorytellingPreviewWorkspace({
  animatic,
  onReturnToChat,
}: StorytellingPreviewWorkspaceProps) {
  const { operation, refresh, requestableAssemblyVersionIds, state, warnings, workspace } = animatic
  const assemblies = useMemo(
    () => [...(workspace?.assemblies ?? [])].sort((left, right) => right.animatic.versionNumber - left.animatic.versionNumber),
    [workspace?.assemblies],
  )
  const currentAssembly = assemblies[0]
  const currentBinding = currentAssembly
    ? workspace?.bindings.find((binding) => binding.animatic.versionId === currentAssembly.animatic.versionId)
    : undefined
  const requestable = Boolean(
    currentAssembly && requestableAssemblyVersionIds.includes(currentAssembly.animatic.versionId),
  )
  const busy = operation !== 'idle'

  if (state === 'inactive') return null
  if (!workspace || ['loading', 'failure', 'permission_denied', 'conflict'].includes(state)) {
    return <PreviewResourceState onRetry={() => { void refresh() }} preview={animatic} />
  }

  const decision = previewDecision({
    binding: currentBinding,
    hasAssembly: Boolean(currentAssembly),
    requestable,
  })

  return (
    <div className={styles.workspace} data-testid="storytelling-preview-workspace">
      <PreviewDecision
        action={decisionAction({
          animatic,
          assembly: currentAssembly,
          binding: currentBinding,
          busy,
          onReturnToChat,
          requestable,
        })}
        body={decision.body}
        icon={decision.icon}
        status={decision.status}
        title={decision.title}
        tone={decision.tone}
      />

      {operation !== 'idle' ? (
        <p aria-live="polite" className={styles.operation} role="status">
          {operationLabel(operation)}
        </p>
      ) : null}

      {currentBinding?.status === 'ready' && currentBinding.artifact ? (
        <PrivatePreviewPlayer artifact={currentBinding.artifact} binding={currentBinding} />
      ) : null}

      {currentAssembly ? (
        <>
          <section className={styles.placeholderNote} role="note">
            <Film aria-hidden="true" size={18} />
            <p><strong>Storyboard visuals are temporary.</strong> Use this preview to judge the story, voice, scene order, and pacing before final visual production.</p>
          </section>

          <details className={styles.details}>
            <summary>Preview version details</summary>
            <dl>
              <div><dt>Preview plan</dt><dd>Version {currentAssembly.animatic.versionNumber}</dd></div>
              <div><dt>Story and script</dt><dd>Version {currentAssembly.preparedScript.versionNumber}</dd></div>
              <div><dt>Narration direction</dt><dd>Version {currentAssembly.voiceBible.versionNumber}</dd></div>
              <div><dt>Storyboard</dt><dd>Version {currentAssembly.storyboard.versionNumber}</dd></div>
            </dl>
            <p><ShieldCheck aria-hidden="true" size={15} /> These versions stay linked to the same approved story plan.</p>
          </details>
        </>
      ) : (
        <ol aria-label="Preview preparation sequence" className={styles.sequence}>
          <li><span>1</span><div><strong>Lock the story</strong><p>Confirm the script and the scene order.</p></div></li>
          <li><span>2</span><div><strong>Set narration</strong><p>Use approved or uploaded narration for accurate pacing.</p></div></li>
          <li><span>3</span><div><strong>Review the animatic</strong><p>Watch the complete low-cost timing preview here.</p></div></li>
        </ol>
      )}

      {assemblies.length > 1 ? (
        <details className={styles.history}>
          <summary>{assemblies.length - 1} earlier preview {assemblies.length === 2 ? 'version' : 'versions'}</summary>
          <ol>
            {assemblies.slice(1).map((assembly) => {
              const binding = workspace.bindings.find((candidate) => candidate.animatic.versionId === assembly.animatic.versionId)
              return (
                <li key={assembly.animatic.versionId}>
                  <span>Preview v{assembly.animatic.versionNumber}</span>
                  <small>{friendlyStatus(binding?.status)}</small>
                </li>
              )
            })}
          </ol>
        </details>
      ) : null}

      {warnings.length > 0 ? (
        <details className={styles.notes}>
          <summary>{countLabel(warnings.length, 'preview note')}</summary>
          <p>Some preview evidence needs attention. Refresh this view or continue in Chat before relying on the current version.</p>
        </details>
      ) : null}

      <p className={styles.boundary}>
        <LockKeyhole aria-hidden="true" size={15} />
        Preview checks story flow with private timing-review media. It does not approve final assets, change the Timeline, or publish the video.
      </p>
    </div>
  )
}

function PreviewDecision({
  action,
  body,
  icon: Icon,
  status,
  title,
  tone,
}: {
  action?: ReactNode
  body: string
  icon: LucideIcon
  status: string
  title: string
  tone: 'neutral' | 'attention' | 'success' | 'danger'
}) {
  return (
    <section className={`${styles.decision} ${styles[tone]}`} data-testid="storytelling-preview-decision">
      <span aria-hidden="true" className={styles.decisionIcon}><Icon size={22} /></span>
      <div className={styles.decisionCopy}>
        <span className={styles.status}>{status}</span>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      {action ? <div className={styles.decisionAction}>{action}</div> : null}
    </section>
  )
}

function decisionAction(input: {
  animatic: UseMotionStudioAnimaticWorkspaceResult
  assembly?: MotionStudioAnimaticAssemblyReceiptDto
  binding?: MotionStudioAnimaticBindingDto
  busy: boolean
  onReturnToChat: () => void
  requestable: boolean
}): ReactNode {
  const { animatic, assembly, binding, busy, onReturnToChat, requestable } = input
  if (!assembly) {
    return <Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">Continue in Chat</Button>
  }
  if (!binding && requestable) {
    return (
      <Button
        data-testid="storytelling-prepare-preview"
        disabled={busy}
        icon={Play}
        onClick={() => { void animatic.requestRender(assembly) }}
        variant="primary"
      >
        Prepare preview
      </Button>
    )
  }
  if (!binding || binding.status === 'cancelled') {
    return <Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">Continue in Chat</Button>
  }
  if (binding.status === 'ready') return undefined
  return (
    <Button
      disabled={busy}
      icon={RefreshCw}
      onClick={() => { void animatic.refresh() }}
      variant={binding.status === 'failed' || binding.status === 'reconciliation_required' ? 'primary' : 'secondary'}
    >
      {binding.status === 'failed' || binding.status === 'reconciliation_required' ? 'Check recovery' : 'Refresh status'}
    </Button>
  )
}

function previewDecision(input: {
  binding?: MotionStudioAnimaticBindingDto
  hasAssembly: boolean
  requestable: boolean
}): { body: string; icon: LucideIcon; status: string; title: string; tone: 'neutral' | 'attention' | 'success' | 'danger' } {
  const { binding, hasAssembly, requestable } = input
  if (!hasAssembly) {
    return {
      body: 'Finish the current story, scene order, and narration decisions first. The complete timing preview will appear here.',
      icon: Film,
      status: 'Not started',
      title: 'Preview comes after the story is timed',
      tone: 'neutral',
    }
  }
  if (!binding) {
    return requestable
      ? {
          body: 'The approved story plan is ready for a private, low-cost timing preview with temporary storyboard visuals.',
          icon: Play,
          status: 'Ready to prepare',
          title: 'Build the timing preview',
          tone: 'neutral',
        }
      : {
          body: 'The latest story plan still needs its existing review and approval step before preview work can begin.',
          icon: LockKeyhole,
          status: 'Approval needed',
          title: 'Preview is waiting on the story plan',
          tone: 'attention',
        }
  }
  if (binding.status === 'ready') {
    return {
      body: 'Watch the complete story flow and decide whether the pacing, narration, and scene order feel right.',
      icon: CheckCircle2,
      status: 'Ready to review',
      title: 'Your timing preview is ready',
      tone: 'success',
    }
  }
  if (binding.status === 'queued') {
    return {
      body: 'The approved preview is waiting for private processing. No estimated percentage is shown.',
      icon: Clock3,
      status: 'Queued',
      title: 'Your timing preview is in line',
      tone: 'neutral',
    }
  }
  if (binding.status === 'rendering') {
    return {
      body: 'ReEditPro is assembling the frozen narration and storyboard timing. Your approved story version remains unchanged.',
      icon: LoaderCircle,
      status: 'Preparing',
      title: 'Building your timing preview',
      tone: 'neutral',
    }
  }
  if (binding.status === 'failed') {
    return {
      body: 'The latest attempt did not finish. Your story and approved plan are safe; check whether recovery is available.',
      icon: AlertTriangle,
      status: 'Needs attention',
      title: 'The preview needs another try',
      tone: 'danger',
    }
  }
  if (binding.status === 'reconciliation_required') {
    return {
      body: 'ReEditPro must confirm the last private attempt before it can safely continue or try again.',
      icon: AlertTriangle,
      status: 'Needs review',
      title: 'The preview result needs confirmation',
      tone: 'attention',
    }
  }
  return {
    body: 'No preview is running. Continue in Chat to decide whether to prepare a new approved version.',
    icon: AlertTriangle,
    status: 'Stopped',
    title: 'The timing preview was stopped',
    tone: 'attention',
  }
}

function PrivatePreviewPlayer({
  artifact,
  binding,
}: {
  artifact: MotionStudioAnimaticArtifactDto
  binding: MotionStudioAnimaticBindingDto
}) {
  const [reloadKey, setReloadKey] = useState(0)
  const [playback, setPlayback] = useState<
    | { state: 'loading' }
    | { state: 'ready'; url: string }
    | { state: 'failure' }
  >({ state: 'loading' })

  useEffect(() => {
    let active = true
    let objectUrl: string | undefined
    void fetchMotionStudioPrivateAnimaticMedia(artifact.id, artifact.sha256, artifact.byteLength).then((result) => {
      if (!active) return
      if (!result.ok) {
        setPlayback({ state: 'failure' })
        return
      }
      objectUrl = URL.createObjectURL(result.blob)
      setPlayback({ state: 'ready', url: objectUrl })
    })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [artifact.byteLength, artifact.id, artifact.sha256, reloadKey])

  if (playback.state === 'loading') {
    return (
      <section aria-live="polite" className={styles.playerState} data-testid="storytelling-preview-player-loading" role="status">
        <LoaderCircle aria-hidden="true" className={styles.spin} size={22} />
        <div><strong>Opening the private preview</strong><p>Verifying the saved media before playback.</p></div>
      </section>
    )
  }
  if (playback.state === 'failure') {
    return (
      <section className={`${styles.playerState} ${styles.playerFailure}`} data-testid="storytelling-preview-player-failure" role="alert">
        <AlertTriangle aria-hidden="true" size={22} />
        <div><strong>The preview could not be verified</strong><p>Your story is unchanged. Try opening the private preview again.</p></div>
        <Button
          icon={RefreshCw}
          onClick={() => {
            setPlayback({ state: 'loading' })
            setReloadKey((value) => value + 1)
          }}
          variant="secondary"
        >
          Try again
        </Button>
      </section>
    )
  }

  return (
    <section className={styles.player} data-testid="storytelling-preview-player-ready">
      <div className={styles.playerHeading}>
        <div>
          <span className={styles.status}>Timing preview</span>
          <strong>{formatDuration(binding.renderedFrameCount, binding.fpsNumerator)} · {countLabel(binding.sceneCount, 'scene')} · narration included</strong>
        </div>
        <small>{artifact.width}×{artifact.height} · {artifact.fpsNumerator} fps</small>
      </div>
      <video aria-label="Private Storytelling timing preview" controls playsInline preload="metadata" src={playback.url} />
    </section>
  )
}

function PreviewResourceState({
  onRetry,
  preview,
}: {
  onRetry: () => void
  preview: UseMotionStudioAnimaticWorkspaceResult
}) {
  const denied = preview.state === 'permission_denied'
  const conflicted = preview.state === 'conflict'
  const failed = preview.state === 'failure'
  const loading = preview.state === 'loading'
  const Icon = denied ? LockKeyhole : failed || conflicted ? AlertTriangle : LoaderCircle
  const title = loading
    ? 'Loading the timing preview'
    : denied
      ? 'This preview is not available to you'
      : conflicted
        ? 'A newer preview version exists'
        : 'The preview could not be loaded'
  const body = loading
    ? 'Reading the latest private review state for this story.'
    : denied
      ? 'Return to a project and named edit available in your current workspace.'
      : conflicted
        ? 'Reload the current version before reviewing or preparing anything.'
        : 'Your story is unchanged. Try loading the current preview again.'
  return (
    <section
      aria-busy={loading}
      aria-live={failed || denied ? 'assertive' : 'polite'}
      className={`${styles.resourceState} ${failed || denied ? styles.danger : conflicted ? styles.attention : ''}`}
      data-testid={`storytelling-preview-state-${preview.state.replace('_', '-')}`}
      role={failed || denied ? 'alert' : 'status'}
    >
      <span aria-hidden="true"><Icon className={loading ? styles.spin : undefined} size={22} /></span>
      <div><h3>{title}</h3><p>{body}</p></div>
      {!loading && !denied ? <Button icon={RefreshCw} onClick={onRetry} variant="primary">Try again</Button> : null}
    </section>
  )
}

function operationLabel(operation: UseMotionStudioAnimaticWorkspaceResult['operation']): string {
  if (operation === 'refreshing') return 'Checking the latest preview status…'
  if (operation === 'binding') return 'Preparing the approved timing preview…'
  return 'Loading the timing preview…'
}

function friendlyStatus(status: MotionStudioAnimaticBindingDto['status'] | undefined): string {
  if (!status) return 'Not prepared'
  if (status === 'ready') return 'Ready to review'
  if (status === 'rendering') return 'Preparing'
  if (status === 'reconciliation_required') return 'Needs review'
  if (status === 'failed') return 'Needs attention'
  if (status === 'cancelled') return 'Stopped'
  return 'Queued'
}

function formatDuration(frames: number, fps: number): string {
  const totalSeconds = Math.round(frames / fps)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function countLabel(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`
}
