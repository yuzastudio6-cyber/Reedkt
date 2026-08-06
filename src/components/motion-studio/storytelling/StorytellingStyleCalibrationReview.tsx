import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  FlaskConical,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  PauseCircle,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react'

import type {
  StorytellingStyleCalibrationReviewDto,
  StorytellingStyleCalibrationScenarioDto,
} from '../../../types/motion-studio'
import { Button } from '../../Button'
import styles from './StorytellingStyleCalibrationReview.module.css'

interface StorytellingStyleCalibrationReviewProps {
  onReturnToChat: () => void
  review: StorytellingStyleCalibrationReviewDto
}

const scenarioIcons: Record<StorytellingStyleCalibrationScenarioDto['status'], LucideIcon> = {
  not_started: Circle,
  preparing: LoaderCircle,
  ready_for_review: Clock3,
  accepted: CheckCircle2,
  needs_attention: AlertTriangle,
  stale: RotateCcw,
}

export function StorytellingStyleCalibrationReview({
  onReturnToChat,
  review,
}: StorytellingStyleCalibrationReviewProps) {
  const alert = review.state === 'blocked' || review.state === 'stale'
  const resumable = review.state === 'resumable'
  const showAction = [
    'approved_not_started',
    'preparing',
    'resumable',
    'needs_review',
    'blocked',
  ].includes(review.state)
  const expandScenarios = [
    'preparing',
    'resumable',
    'needs_review',
    'blocked',
    'stale',
  ].includes(review.state)

  return (
    <section
      aria-labelledby="storytelling-style-calibration-heading"
      className={styles.surface}
      data-state={review.state}
      data-testid="storytelling-style-calibration-review"
    >
      <header className={styles.header}>
        <span aria-hidden="true" className={styles.leadIcon}>
          {resumable ? <PauseCircle size={22} /> : <FlaskConical size={22} />}
        </span>
        <div
          aria-live={alert ? 'assertive' : 'polite'}
          className={styles.copy}
          data-testid={`storytelling-style-calibration-state-${review.state.replaceAll('_', '-')}`}
          role={alert ? 'alert' : 'status'}
        >
          <span className={styles.eyebrow}>Style calibration</span>
          <h3 id="storytelling-style-calibration-heading">{review.title}</h3>
          <p>{review.summary}</p>
        </div>
        <span className={styles.stateLabel}>{review.statusLabel}</span>
      </header>

      {review.scenarios.length > 0 ? (
        <details className={styles.reel} open={expandScenarios}>
          <summary className={styles.reelSummary}>
            <div>
              <strong>Five-scene comparison</strong>
              <span>One bounded check for each production risk</span>
            </div>
            <span>{review.completedScenarioCount} reviewable · {review.acceptedScenarioCount} accepted</span>
            <ChevronDown aria-hidden="true" className={styles.chevron} size={17} />
          </summary>

          <ol aria-label="Style calibration scenarios" className={styles.scenarios}>
            {review.scenarios.map((scenario) => (
              <CalibrationScenario
                current={scenario.kind === review.currentScenarioKind}
                key={scenario.kind}
                scenario={scenario}
              />
            ))}
          </ol>
        </details>
      ) : null}

      <footer className={styles.footer}>
        {showAction ? (
          <Button
            icon={review.state === 'resumable' || review.state === 'blocked' ? RotateCcw : MessageCircle}
            onClick={onReturnToChat}
            variant="secondary"
          >
            {review.nextAction.label}
          </Button>
        ) : null}
        <p><LockKeyhole aria-hidden="true" size={14} />{review.notice}</p>
      </footer>
    </section>
  )
}

function CalibrationScenario({
  current,
  scenario,
}: {
  current: boolean
  scenario: StorytellingStyleCalibrationScenarioDto
}) {
  const Icon = scenarioIcons[scenario.status]
  return (
    <li className={styles.scenario} data-current={current ? 'true' : 'false'} data-status={scenario.status}>
      <span aria-hidden="true" className={styles.scenarioIcon}>
        <Icon className={scenario.status === 'preparing' ? styles.spin : undefined} size={17} />
      </span>
      <span className={styles.scenarioCopy}>
        <strong>{scenario.label}</strong>
        <small>{scenario.purpose}</small>
      </span>
      <span className={styles.scenarioStatus}>{scenario.statusLabel}</span>
    </li>
  )
}
