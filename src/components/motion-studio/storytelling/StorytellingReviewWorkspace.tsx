import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MessageCircle,
  RefreshCw,
} from 'lucide-react'

import { useCanonicalEditJourney } from '../../../hooks/useCanonicalEditJourney'
import { useCanonicalPrivateReview } from '../../../hooks/useCanonicalPrivateReview'
import { useProjectPersistenceScope } from '../../../hooks/useProjectPersistenceScope'
import type { StorytellingReviewContext } from '../../../lib/motion-studio/storytelling-review-context'
import type { MotionStudioProductionDto, MotionStudioWorkGraphDto } from '../../../types/motion-studio'
import { Button } from '../../Button'
import { CanonicalPrivateReviewPanel } from '../../editor/CanonicalPrivateReviewPanel'
import styles from './StorytellingReviewWorkspace.module.css'

interface StorytellingReviewWorkspaceProps {
  editSessionId: string
  onRevisionRecorded: () => void
  onReturnToChat: () => void
  production: MotionStudioProductionDto
  projectId: string
  reviewContext: StorytellingReviewContext
  workGraph?: MotionStudioWorkGraphDto
}

type ReviewSurfaceState =
  | 'empty'
  | 'preparing'
  | 'blocked'
  | 'ready'
  | 'changes_requested'
  | 'approved'
  | 'stale'

type ReviewPresentation = {
  state: ReviewSurfaceState
  eyebrow: string
  title: string
  description: string
  action?: string
  actionVariant: 'primary' | 'secondary'
}

export function StorytellingReviewWorkspace({
  editSessionId,
  onRevisionRecorded,
  onReturnToChat,
  production,
  projectId,
  reviewContext,
  workGraph,
}: StorytellingReviewWorkspaceProps) {
  const scope = useProjectPersistenceScope()
  const canonicalJourney = useCanonicalEditJourney({
    editSessionId,
    enabled: true,
    projectId,
    scope,
  })
  const journey = canonicalJourney.result?.status === 'ready'
    ? canonicalJourney.result.journey
    : undefined
  const canonicalReview = useCanonicalPrivateReview({
    editSessionId,
    enabled: Boolean(journey),
    projectId,
    scope,
  })
  const presentation = resolvePresentation(production, reviewContext, workGraph)
  const preparation = preparationStatus(reviewContext, workGraph)
  const reviewFile = reviewFileStatus(reviewContext)
  const decision = decisionStatus(reviewContext)
  const Icon = presentation.state === 'approved'
    ? CheckCircle2
    : presentation.state === 'blocked' || presentation.state === 'stale'
      ? AlertTriangle
      : presentation.state === 'preparing'
        ? RefreshCw
        : Clock3

  return (
    <div
      className={styles.workspace}
      data-state={presentation.state}
      data-testid={`storytelling-review-state-${presentation.state}`}
    >
      <section className={styles.focal}>
        <span aria-hidden="true" className={styles.icon}><Icon size={22} /></span>
        <div aria-live="polite" className={styles.copy} role="status">
          <span className={styles.eyebrow}>{presentation.eyebrow}</span>
          <h3>{presentation.title}</h3>
          <p>{presentation.description}</p>
        </div>
        {presentation.action ? (
          <Button
            icon={MessageCircle}
            onClick={onReturnToChat}
            variant={presentation.actionVariant}
          >
            {presentation.action}
          </Button>
        ) : null}
      </section>

      <section aria-label="Canonical private review controls" className={styles.canonicalReview}>
        {journey?.privateReviewMediaAuthority ? (
          <CanonicalPrivateReviewPanel
            journey={journey}
            onAccept={() => {
              void canonicalReview.recordDecision(journey, 'accept_private_internal_review')
                .then((result) => {
                  if (result.status === 'recorded') canonicalJourney.refresh()
                })
            }}
            onLoad={() => { void canonicalReview.loadMedia(journey) }}
            onRequestRevision={(summary) => {
              void canonicalReview.recordDecision(journey, 'request_revision', summary)
                .then((result) => {
                  if (result.status !== 'recorded') return
                  canonicalReview.reset()
                  canonicalJourney.refresh()
                  onRevisionRecorded()
                })
            }}
            review={canonicalReview}
          />
        ) : (
          <CanonicalReviewAvailability
            loading={canonicalJourney.loading}
            message={canonicalJourney.result?.status === 'ready'
              ? 'No exact private review is attached to this Storytelling version yet.'
              : canonicalJourney.result?.message}
            onRetry={canonicalJourney.refresh}
            retryable={Boolean(
              canonicalJourney.result &&
              canonicalJourney.result.status !== 'ready' &&
              canonicalJourney.result.retryable
            )}
          />
        )}
      </section>

      <dl aria-label="Current Storytelling review readiness" className={styles.readiness}>
        <StatusRow
          label="Approved direction"
          tone={reviewContext.approvedPlanAttached ? 'current' : 'muted'}
          value={reviewContext.approvedPlanAttached ? 'Attached' : 'Waiting for approval'}
        />
        <StatusRow label="Preparation" tone={preparation.tone} value={preparation.label} />
        <StatusRow label="Review file" tone={reviewFile.tone} value={reviewFile.label} />
        <StatusRow label="Decision" tone={decision.tone} value={decision.label} />
      </dl>

      {reviewContext.review.decision === 'changes_requested' && reviewContext.review.note ? (
        <section className={styles.note} data-testid="storytelling-review-note">
          <span>Latest review note</span>
          <p>{reviewContext.review.note}</p>
        </section>
      ) : null}

      <details className={styles.boundary}>
        <summary>How review works</summary>
        <div>
          <p>Playback, approval, and change requests use the canonical private review controls for this exact named edit.</p>
          <p>This view never approves a plan, spends credits, starts generation, renders, exports, or delivers media.</p>
          <p>A changed source or requested revision requires a fresh plan and private review before a new result can be accepted.</p>
        </div>
      </details>
    </div>
  )
}

function CanonicalReviewAvailability({
  loading,
  message,
  onRetry,
  retryable,
}: {
  loading: boolean
  message?: string
  onRetry: () => void
  retryable: boolean
}) {
  return (
    <div
      aria-live="polite"
      className={styles.canonicalAvailability}
      data-state={loading ? 'loading' : retryable ? 'retry' : 'waiting'}
      role={retryable ? 'alert' : 'status'}
    >
      {loading ? <RefreshCw aria-hidden="true" className={styles.spin} size={18} /> : <Clock3 aria-hidden="true" size={18} />}
      <div>
        <strong>{loading ? 'Loading private review authority' : 'Private review controls are not ready'}</strong>
        <p>{loading
          ? 'Checking the exact saved review and decision authority.'
          : message ?? 'The exact private review could not be verified.'}</p>
      </div>
      {retryable ? <Button icon={RefreshCw} onClick={onRetry} size="sm" variant="secondary">Try again</Button> : null}
    </div>
  )
}

function StatusRow({
  label,
  tone,
  value,
}: {
  label: string
  tone: 'muted' | 'current' | 'attention' | 'blocked' | 'success'
  value: string
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={styles[tone]}>{value}</dd>
    </div>
  )
}

function resolvePresentation(
  production: MotionStudioProductionDto,
  context: StorytellingReviewContext,
  workGraph?: MotionStudioWorkGraphDto,
): ReviewPresentation {
  const review = context.review
  const requiredFailure = Boolean(workGraph?.jobs.some((job) =>
    job.required && ['blocked', 'failed', 'reconciliation_required'].includes(job.status)))
  const activePreparation = Boolean(workGraph?.jobs.some((job) =>
    ['queued', 'claimed', 'running', 'cancel_requested'].includes(job.status)))

  if (review.exists && !review.sourceMatchesCurrentEdit) {
    return {
      state: 'stale',
      eyebrow: 'Review is out of date',
      title: 'The story changed after this review',
      description: 'The previous review no longer matches the current source set. Return to Director to create a fresh plan before reviewing again.',
      action: 'Return to Director',
      actionVariant: 'primary',
    }
  }

  if (review.decision === 'changes_requested' || context.stage === 'revision_requested') {
    return {
      state: 'changes_requested',
      eyebrow: 'Changes requested',
      title: 'The next pass needs a fresh plan',
      description: 'Your review direction is preserved. Continue with Director to revise the story and approve a new exact version before more work begins.',
      action: 'Continue with Director',
      actionVariant: 'primary',
    }
  }

  if (review.decision === 'accepted_for_internal_testing' && review.manifestVerified && review.playable) {
    return {
      state: 'approved',
      eyebrow: 'Approved review',
      title: 'This private review is locked',
      description: 'The accepted decision remains attached to this exact version. Sharing, export, delivery, and billing are still closed.',
      actionVariant: 'secondary',
    }
  }

  if (
    context.stage === 'revision_preview_ready' ||
    context.stage === 'private_review_verified' ||
    (review.manifestVerified && review.playable) ||
    context.stage === 'private_review_ready' ||
    production.status === 'awaiting_review' ||
    production.status === 'reviewing'
  ) {
    return {
      state: 'ready',
      eyebrow: 'Current decision',
      title: context.stage === 'revision_preview_ready'
        ? 'A revised review pass is ready'
        : 'A Storytelling decision needs your review',
      description: review.manifestVerified && review.playable
        ? 'The private review file is verified for this exact story version. Use the canonical controls below to approve it or request changes.'
        : 'Load the exact private review below and complete its required verification before deciding.',
      actionVariant: 'primary',
    }
  }

  if (requiredFailure || production.status === 'blocked' || workGraph?.status === 'exhausted') {
    return {
      state: 'blocked',
      eyebrow: 'Review is blocked',
      title: 'Preparation needs attention',
      description: 'A required preparation step did not complete safely. The exact recovery state remains visible here; nothing was approved automatically.',
      actionVariant: 'primary',
    }
  }

  if (activePreparation || context.approvedPlanAttached || production.status === 'producing') {
    return {
      state: 'preparing',
      eyebrow: 'Preparing review',
      title: 'No decision is ready yet',
      description: 'Approved private work is still being prepared or reconciled. This page shows durable state only and does not invent progress.',
      actionVariant: 'secondary',
    }
  }

  return {
    state: 'empty',
    eyebrow: 'Review',
    title: 'Nothing is waiting for review',
    description: 'Keep developing the story with Director. Review will appear here only after an exact version and its required approval context exist.',
    action: 'Continue with Director',
    actionVariant: 'primary',
  }
}

function preparationStatus(
  context: StorytellingReviewContext,
  workGraph?: MotionStudioWorkGraphDto,
): { label: string; tone: 'muted' | 'current' | 'attention' | 'blocked' | 'success' } {
  if (workGraph?.jobs.some((job) => job.required && ['blocked', 'failed', 'reconciliation_required'].includes(job.status))) {
    return { label: 'Needs attention', tone: 'blocked' }
  }
  if (workGraph?.status === 'paused') return { label: 'Paused and resumable', tone: 'attention' }
  if (workGraph?.jobs.some((job) => ['queued', 'claimed', 'running', 'cancel_requested'].includes(job.status))) {
    return { label: 'In progress', tone: 'current' }
  }
  if (workGraph?.jobs.length && workGraph.jobs.every((job) => !job.required || job.status === 'succeeded')) {
    return { label: 'Complete', tone: 'success' }
  }
  if (context.approvedPlanAttached) return { label: 'Waiting for review output', tone: 'current' }
  return { label: 'Not started', tone: 'muted' }
}

function reviewFileStatus(
  context: StorytellingReviewContext,
): { label: string; tone: 'muted' | 'current' | 'attention' | 'blocked' | 'success' } {
  const review = context.review
  if (review.exists && !review.sourceMatchesCurrentEdit) return { label: 'Out of date', tone: 'blocked' }
  if (review.manifestVerified && review.playable) return { label: 'Verified and playable', tone: 'success' }
  if (review.exists && review.manifestVerified) return { label: 'Verified; playback pending', tone: 'attention' }
  if (context.stage === 'private_review_ready' || review.exists) return { label: 'Ready to verify in Chat', tone: 'current' }
  return { label: 'Not ready', tone: 'muted' }
}

function decisionStatus(
  context: StorytellingReviewContext,
): { label: string; tone: 'muted' | 'current' | 'attention' | 'blocked' | 'success' } {
  if (context.review.decision === 'accepted_for_internal_testing') return { label: 'Approved and locked', tone: 'success' }
  if (context.review.decision === 'changes_requested') return { label: 'Changes requested', tone: 'attention' }
  if (context.stage === 'private_review_verified' || context.review.playable) return { label: 'Waiting for your decision', tone: 'current' }
  return { label: 'No decision', tone: 'muted' }
}
