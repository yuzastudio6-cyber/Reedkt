import {
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

import type { UseStorytellingStylePlanReviewResult } from '../../../hooks/useStorytellingStylePlanReview'
import { Button } from '../../Button'
import styles from './StorytellingStylePlanReviewSummary.module.css'

interface StorytellingStylePlanReviewSummaryProps {
  onChooseDirection: () => void
  onRetry: () => void
  stylePlan: UseStorytellingStylePlanReviewResult
}

export function StorytellingStylePlanReviewSummary({
  onChooseDirection,
  onRetry,
  stylePlan,
}: StorytellingStylePlanReviewSummaryProps) {
  if (stylePlan.state === 'inactive' || stylePlan.state === 'loading') {
    return (
      <section aria-live="polite" className={styles.surface} data-state="loading" data-testid="storytelling-style-plan-review" role="status">
        <span aria-hidden="true" className={styles.icon}><LoaderCircle className={styles.spin} size={18} /></span>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>Motion direction</span>
          <strong>Checking the Storytelling style</strong>
          <p>Binding the current Chat direction to this exact plan before approval.</p>
        </div>
      </section>
    )
  }

  if (stylePlan.state === 'ready' && stylePlan.preparation) {
    const decision = stylePlan.preparation.decision
    return (
      <section className={styles.surface} data-state="ready" data-testid="storytelling-style-plan-review">
        <span aria-hidden="true" className={styles.icon}><CheckCircle2 size={18} /></span>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>Motion direction</span>
          <strong>{decision.selectedStyleDisplayName}</strong>
          <p>{decision.summary}</p>
          <span className={styles.note}>
            <Sparkles aria-hidden="true" size={14} />
            The approved plan includes a five-scene calibration proposal. Execution remains unavailable until its production gates pass; exact text and data stay editable.
          </span>
        </div>
        <span className={styles.stateLabel}>Prepared for Plan Review</span>
        <StoryContinuityPlanReviewRow stylePlan={stylePlan} />
      </section>
    )
  }

  if (stylePlan.state === 'needs_selection') {
    return (
      <section aria-labelledby="storytelling-style-plan-selection-heading" className={styles.surface} data-state="attention" data-testid="storytelling-style-plan-review">
        <span aria-hidden="true" className={styles.icon}><MessageCircle size={18} /></span>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>Motion direction</span>
          <strong id="storytelling-style-plan-selection-heading">Choose one direction before approval</strong>
          <p>{stylePlan.message ?? 'Choose the visual motion language in Chat, then create the plan again.'}</p>
        </div>
        <Button icon={MessageCircle} onClick={onChooseDirection} size="sm" variant="secondary">
          Choose direction
        </Button>
      </section>
    )
  }

  return (
    <section aria-live="assertive" className={styles.surface} data-state="blocked" data-testid="storytelling-style-plan-review" role="alert">
      <span aria-hidden="true" className={styles.icon}><AlertTriangle size={18} /></span>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>Motion direction</span>
        <strong>The style could not be verified</strong>
        <p>{stylePlan.message ?? 'No style authority was added to this plan. Retry before approval.'}</p>
      </div>
      <Button icon={RefreshCw} onClick={onRetry} size="sm" variant="secondary">
        Try again
      </Button>
    </section>
  )
}

function StoryContinuityPlanReviewRow({
  stylePlan,
}: {
  stylePlan: UseStorytellingStylePlanReviewResult
}) {
  if (stylePlan.continuityState === 'loading') {
    return (
      <div aria-live="polite" className={styles.continuity} data-state="loading" data-testid="storytelling-continuity-plan-review" role="status">
        <LoaderCircle aria-hidden="true" className={styles.spin} size={16} />
        <div><strong>Checking story flow</strong><p>Reading the continuity bound to this exact story and timed script.</p></div>
      </div>
    )
  }

  if (stylePlan.continuityState !== 'ready' || !stylePlan.storyContinuity) {
    return (
      <div aria-live="polite" className={styles.continuity} data-state="unavailable" data-testid="storytelling-continuity-plan-review" role="status">
        <AlertTriangle aria-hidden="true" size={16} />
        <div><strong>Story flow could not be checked</strong><p>{stylePlan.continuityMessage ?? 'Open Story or continue in Chat before relying on story continuity.'}</p></div>
      </div>
    )
  }

  const continuity = stylePlan.storyContinuity
  const Icon = continuity.state === 'approved_locked'
    ? CheckCircle2
    : continuity.state === 'stale' || continuity.state === 'needs_preparation'
      ? AlertTriangle
      : continuity.state === 'not_ready'
        ? LockKeyhole
        : GitBranch
  const compactSummary = continuity.arcLabel
    ? `${continuity.arcLabel} · ${continuity.throughLineLabel} · ${continuity.revealBeatCount} reveal${continuity.revealBeatCount === 1 ? '' : 's'}`
    : continuity.summary
  return (
    <div
      aria-live={continuity.state === 'stale' ? 'assertive' : 'polite'}
      className={styles.continuity}
      data-state={continuity.state}
      data-testid="storytelling-continuity-plan-review"
      role={continuity.state === 'stale' ? 'alert' : 'status'}
    >
      <Icon aria-hidden="true" size={16} />
      <div><strong>Story flow · {continuity.statusLabel}</strong><p>{compactSummary}</p></div>
      <span className={styles.continuityState}>{continuity.approvedLocked ? 'Locked' : continuity.state === 'stale' ? 'Replan' : continuity.state === 'ready_for_plan_review' ? 'Prepared' : 'Open Story'}</span>
    </div>
  )
}
