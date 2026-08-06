import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'

import type { UseMotionStudioSceneWorkspaceResult } from '../../../hooks/useMotionStudioSceneWorkspace'
import type {
  MotionStudioSceneWorkspaceDto,
  MotionStudioTimelineProposalDto,
  TimelineProposalOperation,
} from '../../../types/motion-studio'
import { Button } from '../../Button'
import styles from './StorytellingTimelineWorkspace.module.css'

interface StorytellingTimelineWorkspaceProps {
  onReturnToChat: () => void
  sceneWorkspace: UseMotionStudioSceneWorkspaceResult
}

interface TimelineProposalView {
  proposal: MotionStudioTimelineProposalDto
  documentVersion: number
  frameComplete: boolean
  startFrame?: number
  endFrame?: number
  layerCounts: Readonly<Record<TimelineProposalOperation['targetCollection'], number>>
}

interface TimelineProjection {
  proposals: readonly TimelineProposalView[]
  previousProposalCount: number
  frameRate?: number
  integrityFailure: boolean
  hasApprovedTiming: boolean
}

export function StorytellingTimelineWorkspace({
  onReturnToChat,
  sceneWorkspace,
}: StorytellingTimelineWorkspaceProps) {
  if (sceneWorkspace.state === 'inactive' || sceneWorkspace.state === 'loading') {
    return (
      <TimelineState
        icon={LoaderCircle}
        iconClassName={styles.spin}
        status="Loading timeline"
        testId="storytelling-timeline-state-loading"
        title="Checking approved timing"
        body="Reading the exact SceneDocument proposals attached to this Storytelling edit."
      />
    )
  }

  if (['permission_denied', 'conflict', 'failure'].includes(sceneWorkspace.state)) {
    return <TimelineUnavailable sceneWorkspace={sceneWorkspace} />
  }

  const projection = projectTimeline(sceneWorkspace.workspace)
  if (projection.integrityFailure) {
    return (
      <TimelineState
        action={<Button icon={RefreshCw} onClick={() => { void sceneWorkspace.refresh() }} variant="primary">Try again</Button>}
        icon={AlertTriangle}
        status="Needs attention"
        testId="storytelling-timeline-state-failure"
        title="Timeline proposal could not be verified"
        body="The current timing proposal did not match its approved SceneDocument. Nothing was applied or changed."
        tone="attention"
      />
    )
  }

  if (!projection.hasApprovedTiming || projection.proposals.length === 0) {
    return (
      <div className={styles.workspace} data-testid="storytelling-timeline-state-empty">
        <TimelineState
          action={<Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">Continue in Chat</Button>}
          icon={Clock3}
          status={projection.hasApprovedTiming ? 'Proposal not prepared' : 'Timing not approved'}
          title={projection.hasApprovedTiming ? 'No current timeline proposal yet' : 'Timeline waits for approved timing'}
          body={projection.hasApprovedTiming
            ? 'Scene timing exists, but no exact SceneDocument proposal is attached to the current approved snapshot.'
            : 'Confirm the story, output frame, and Master Timing through the existing planning and approval flow first.'}
        />
        {projection.previousProposalCount > 0 ? (
          <p className={styles.historyNote}>{countLabel(projection.previousProposalCount, 'earlier proposal')} retained outside the current approved snapshot.</p>
        ) : null}
        <ReadOnlyTimelineNotice />
      </div>
    )
  }

  const operationCount = projection.proposals.reduce((total, item) => total + item.proposal.operations.length, 0)
  const allFramesComplete = projection.proposals.every((item) => item.frameComplete)

  return (
    <div className={styles.workspace} data-testid="storytelling-timeline-state-ready">
      <TimelineState
        action={
          <div className={styles.actions}>
            <Button
              disabled={sceneWorkspace.operation === 'refreshing'}
              icon={RefreshCw}
              onClick={() => { void sceneWorkspace.refresh() }}
              variant="ghost"
            >
              {sceneWorkspace.operation === 'refreshing' ? 'Checking…' : 'Refresh'}
            </Button>
            <Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">Review timing in Chat</Button>
          </div>
        }
        icon={allFramesComplete ? CheckCircle2 : AlertTriangle}
        status={allFramesComplete ? 'Current proposal' : 'Frame review needed'}
        title={allFramesComplete ? 'Frame-accurate timing is ready to inspect' : 'Timeline proposal needs frame authority'}
        body={allFramesComplete
          ? 'These layers target the current approved snapshot and remain proposal-only until the existing execution path applies them.'
          : 'One or more layers expose display timing without complete execution frames. They cannot advance from this view.'}
        tone={allFramesComplete ? 'success' : 'attention'}
      />

      <dl aria-label="Current Storytelling timeline summary" className={styles.facts}>
        <div><dt>Frame rate</dt><dd>{projection.frameRate ? `${formatNumber(projection.frameRate)} fps` : 'Needs review'}</dd></div>
        <div><dt>Scene proposals</dt><dd>{projection.proposals.length}</dd></div>
        <div><dt>Planned layers</dt><dd>{operationCount}</dd></div>
      </dl>

      <ol aria-label="Current timeline proposals" className={styles.proposals}>
        {projection.proposals.map((item, index) => (
          <TimelineProposalRow item={item} key={item.proposal.id} number={index + 1} />
        ))}
      </ol>

      {projection.previousProposalCount > 0 ? (
        <p className={styles.historyNote}>{countLabel(projection.previousProposalCount, 'earlier proposal')} retained for traceability.</p>
      ) : null}
      <ReadOnlyTimelineNotice />
    </div>
  )
}

function TimelineProposalRow({ item, number }: { item: TimelineProposalView; number: number }) {
  const range = item.frameComplete && item.startFrame !== undefined && item.endFrame !== undefined
    ? `Frames ${formatNumber(item.startFrame)}–${formatNumber(item.endFrame)}`
    : 'Execution frames need review'

  return (
    <li className={styles.proposal}>
      <div className={styles.proposalHeader}>
        <div>
          <span className={styles.proposalLabel}>Scene proposal {number}</span>
          <h4>SceneDocument version {item.documentVersion}</h4>
        </div>
        <span className={styles.proposalStatus}>Proposal only</span>
      </div>

      <div className={styles.proposalSummary}>
        <span><Clock3 aria-hidden="true" size={16} />{range}</span>
        <span><Layers3 aria-hidden="true" size={16} />{countLabel(item.proposal.operations.length, 'planned layer')}</span>
        {item.proposal.warnings.length > 0 ? (
          <span className={styles.warning}><AlertTriangle aria-hidden="true" size={16} />{countLabel(item.proposal.warnings.length, 'timing note')} needs review</span>
        ) : null}
      </div>

      <dl aria-label={`Scene proposal ${number} layer summary`} className={styles.layerCounts}>
        <div><dt>Visual</dt><dd>{item.layerCounts.overlayLayers}</dd></div>
        <div><dt>Captions</dt><dd>{item.layerCounts.captionLayers}</dd></div>
        <div><dt>Audio</dt><dd>{item.layerCounts.audioLayers}</dd></div>
        <div><dt>Masks</dt><dd>{item.layerCounts.maskLayers}</dd></div>
      </dl>

      <details className={styles.details}>
        <summary>Inspect layer timing</summary>
        <ul>
          {item.proposal.operations.map((operation, index) => (
            <li key={operation.id}>
              <div>
                <strong>{layerLabel(operation.targetCollection)} {index + 1}</strong>
                <span>{operationFrameLabel(operation)}</span>
              </div>
              <span>{countLabel(operation.layer.artifactIds.length, 'linked asset')}</span>
            </li>
          ))}
        </ul>
      </details>
    </li>
  )
}

function TimelineUnavailable({ sceneWorkspace }: { sceneWorkspace: UseMotionStudioSceneWorkspaceResult }) {
  const denied = sceneWorkspace.state === 'permission_denied'
  const conflict = sceneWorkspace.state === 'conflict'
  return (
    <TimelineState
      action={denied ? undefined : (
        <Button icon={RefreshCw} onClick={() => { void sceneWorkspace.refresh() }} variant="primary">Try again</Button>
      )}
      icon={denied ? LockKeyhole : AlertTriangle}
      status={denied ? 'Access denied' : 'Needs attention'}
      testId={`storytelling-timeline-state-${sceneWorkspace.state}`}
      title={denied ? 'This timeline is not available' : conflict ? 'Timeline changed while loading' : 'Timeline could not be loaded'}
      body={denied
        ? 'Your current workspace cannot read the timing proposals attached to this named edit.'
        : conflict
          ? 'Reload the current named edit before reviewing timing so an older proposal is not shown.'
          : 'The current proposal state is temporarily unavailable. Nothing was treated as empty or applied.'}
      tone="attention"
    />
  )
}

function TimelineState({
  action,
  body,
  icon: Icon,
  iconClassName,
  status,
  testId,
  title,
  tone = 'neutral',
}: {
  action?: ReactNode
  body: string
  icon: LucideIcon
  iconClassName?: string
  status: string
  testId?: string
  title: string
  tone?: 'neutral' | 'attention' | 'success'
}) {
  return (
    <section className={`${styles.decision} ${styles[tone]}`} data-testid={testId}>
      <span aria-hidden="true" className={`${styles.decisionIcon} ${iconClassName ?? ''}`}><Icon size={24} /></span>
      <div
        aria-live={tone === 'attention' ? 'assertive' : 'polite'}
        className={styles.decisionCopy}
        role={tone === 'attention' ? 'alert' : 'status'}
      >
        <span className={styles.status}>{status}</span>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </section>
  )
}

function ReadOnlyTimelineNotice() {
  return (
    <p className={styles.readOnlyNotice}>
      <LockKeyhole aria-hidden="true" size={15} />
      Timeline is read-only here. It cannot apply layers, move timing, render, export, or approve this story.
    </p>
  )
}

function projectTimeline(workspace: MotionStudioSceneWorkspaceDto | undefined): TimelineProjection {
  if (!workspace?.latestApprovedSnapshot) {
    return { proposals: [], previousProposalCount: workspace?.proposals.length ?? 0, integrityFailure: false, hasApprovedTiming: false }
  }

  const snapshot = workspace.latestApprovedSnapshot
  const current = workspace.proposals.filter((proposal) =>
    proposal.approvedSnapshotId === snapshot.id &&
    proposal.targetTimelineManifestId === snapshot.targetTimelineManifestId)
  const previousProposalCount = workspace.proposals.length - current.length
  const approvedAnchorFrames = new Set(snapshot.timingAnchors.map((anchor) => anchor.frame))
  const ids = new Set<string>()
  const proposals: TimelineProposalView[] = []

  for (const proposal of current) {
    const document = workspace.artifacts.find((artifact) =>
      artifact.kind === 'scene_document' &&
      ['approved', 'locked'].includes(artifact.state) &&
      artifact.version.versionId === proposal.sourceSceneDocument.versionId &&
      artifact.version.contentDigest === proposal.sourceSceneDocument.contentDigest)
    if (
      !document || proposal.operations.length === 0 || ids.has(proposal.id) ||
      !Number.isFinite(Date.parse(proposal.createdAt)) ||
      new Set(proposal.operations.map((operation) => operation.id)).size !== proposal.operations.length
    ) {
      return { proposals: [], previousProposalCount, frameRate: snapshot.frameRate, integrityFailure: true, hasApprovedTiming: true }
    }
    ids.add(proposal.id)

    const frameRanges = proposal.operations.map(operationFrames)
    if (
      frameRanges.some((range) => range === 'invalid') ||
      frameRanges.some((range) => range !== undefined && range !== 'invalid' &&
        (!approvedAnchorFrames.has(range.start) || !approvedAnchorFrames.has(range.end)))
    ) {
      return { proposals: [], previousProposalCount, frameRate: snapshot.frameRate, integrityFailure: true, hasApprovedTiming: true }
    }
    const completeRanges = frameRanges.filter((range): range is { start: number; end: number } => range !== undefined)
    const frameComplete = completeRanges.length === proposal.operations.length
    const layerCounts = {
      audioLayers: 0,
      captionLayers: 0,
      overlayLayers: 0,
      maskLayers: 0,
    }
    for (const operation of proposal.operations) layerCounts[operation.targetCollection] += 1
    proposals.push({
      proposal,
      documentVersion: document.version.versionNumber,
      frameComplete,
      ...(frameComplete ? {
        startFrame: Math.min(...completeRanges.map((range) => range.start)),
        endFrame: Math.max(...completeRanges.map((range) => range.end)),
      } : {}),
      layerCounts,
    })
  }

  proposals.sort((left, right) => Date.parse(right.proposal.createdAt) - Date.parse(left.proposal.createdAt))
  return {
    proposals,
    previousProposalCount,
    frameRate: snapshot.frameRate,
    integrityFailure: false,
    hasApprovedTiming: true,
  }
}

function operationFrames(operation: TimelineProposalOperation): { start: number; end: number } | 'invalid' | undefined {
  const { startFrame, endFrame } = operation.layer.timelineRange
  if (startFrame === undefined && endFrame === undefined) return undefined
  if (
    !Number.isSafeInteger(startFrame) || !Number.isSafeInteger(endFrame) ||
    Number(startFrame) < 0 || Number(endFrame) <= Number(startFrame)
  ) return 'invalid'
  return { start: Number(startFrame), end: Number(endFrame) }
}

function operationFrameLabel(operation: TimelineProposalOperation): string {
  const frames = operationFrames(operation)
  if (frames && frames !== 'invalid') return `Frames ${formatNumber(frames.start)}–${formatNumber(frames.end)}`
  const { startSeconds, endSeconds } = operation.layer.timelineRange
  return `${formatSeconds(startSeconds)}–${formatSeconds(endSeconds)} display timing; frames pending`
}

function layerLabel(collection: TimelineProposalOperation['targetCollection']): string {
  if (collection === 'overlayLayers') return 'Visual layer'
  if (collection === 'captionLayers') return 'Caption layer'
  if (collection === 'audioLayers') return 'Audio layer'
  return 'Mask layer'
}

function countLabel(value: number, singular: string): string {
  return `${formatNumber(value)} ${singular}${value === 1 ? '' : 's'}`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}

function formatSeconds(value: number): string {
  return `${value.toFixed(2)}s`
}
