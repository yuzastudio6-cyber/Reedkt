import {
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  LockKeyhole,
} from 'lucide-react'

import type { StorytellingStoryContinuityReviewDto } from '../../../types/motion-studio'
import styles from './StorytellingStoryContinuityReview.module.css'

interface StorytellingStoryContinuityReviewProps {
  review: StorytellingStoryContinuityReviewDto
}

export function StorytellingStoryContinuityReview({ review }: StorytellingStoryContinuityReviewProps) {
  const prepared = ['ready_for_plan_review', 'approved_locked', 'stale'].includes(review.state)
  const Icon = review.state === 'approved_locked'
    ? CheckCircle2
    : review.state === 'stale' || review.state === 'needs_preparation'
      ? AlertTriangle
      : review.state === 'not_ready'
        ? LockKeyhole
        : GitBranch
  const liveRole = review.state === 'stale' ? 'alert' : 'status'

  return (
    <section
      aria-labelledby="storytelling-story-continuity-heading"
      className={styles.surface}
      data-state={review.state}
      data-testid="storytelling-story-continuity-review"
    >
      <span aria-hidden="true" className={styles.icon}><Icon size={21} /></span>
      <div aria-live={liveRole === 'alert' ? 'assertive' : 'polite'} className={styles.copy} role={liveRole}>
        <span className={styles.eyebrow}>Story flow · {review.statusLabel}</span>
        <h3 id="storytelling-story-continuity-heading">{review.title}</h3>
        <p>{review.summary}</p>
      </div>

      {prepared ? (
        <details className={styles.disclosure}>
          <summary>Story flow details</summary>
          <dl>
            <div><dt>Arc</dt><dd>{review.arcLabel}</dd></div>
            <div><dt>Through-line</dt><dd>{review.throughLineLabel}</dd></div>
            <div><dt>Reveals</dt><dd>{countLabel(review.revealBeatCount, 'beat')}</dd></div>
            <div><dt>Scene bridges</dt><dd>{countLabel(review.transitionCount, 'transition')}</dd></div>
            <div><dt>Rhythm</dt><dd>{countLabel(review.rhythmBeatCount, 'beat')}</dd></div>
            <div><dt>Open questions</dt><dd>{formatNumber(review.unresolvedUncertaintyCount)}</dd></div>
          </dl>
          <p>{review.notice}</p>
        </details>
      ) : null}
    </section>
  )
}

function countLabel(count: number, noun: string): string {
  return `${formatNumber(count)} ${noun}${count === 1 ? '' : 's'}`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
