import { useId } from 'react'
import {
  createEditReferenceTargetStudyUiView,
  type EditReferenceTargetStudyLifecycle,
} from '../../../lib/edit-reference-target-study-ui'
import '../../../styles/edit-reference-target-study.css'
import { Button } from '../../Button'

export type EditReferenceTargetStudyStatusProps = {
  disabled?: boolean
  lifecycle: EditReferenceTargetStudyLifecycle
  onRetry?: () => void
  onStart?: () => void
  referenceName: string
}

export function EditReferenceTargetStudyStatus({
  disabled = false,
  lifecycle,
  onRetry,
  onStart,
  referenceName,
}: EditReferenceTargetStudyStatusProps) {
  const titleId = useId()
  const view = createEditReferenceTargetStudyUiView(lifecycle)

  return (
    <section
      aria-busy={['checking', 'starting', 'studying'].includes(view.state) ? true : undefined}
      aria-labelledby={titleId}
      className="edit-reference-target-study"
      data-state={view.state}
      data-testid="edit-reference-target-study"
    >
      <header className="edit-reference-target-study__heading">
        <div>
          <span className="section-eyebrow">Video understanding</span>
          <h3 id={titleId}>{view.title}</h3>
          <p
            aria-live={view.announcementAriaLive}
            className="edit-reference-target-study__description"
            role={view.announcementRole}
          >
            {view.description}
          </p>
        </div>
        <div className="edit-reference-target-study__summary">
          <span className={`edit-reference-target-study__status is-${view.tone}`}>
            <span aria-hidden="true" />
            {view.statusLabel}
          </span>
          <small title={referenceName}>{referenceName}</small>
        </div>
      </header>

      {view.progressPercent !== undefined ? (
        <div className="edit-reference-target-study__progress">
          <div>
            <strong>{view.progressLabel}</strong>
            <span>{view.coverageLabel}</span>
          </div>
          <progress
            aria-label={`Target video study ${view.progressPercent}% complete`}
            max="100"
            value={view.progressPercent}
          />
        </div>
      ) : null}

      {view.sourceLabel || view.sectionLabel || view.etaLabel ? (
        <p className="edit-reference-target-study__facts">
          {view.sourceLabel ? <span>{view.sourceLabel}</span> : null}
          {view.sectionLabel ? <span>{view.sectionLabel}</span> : null}
          {view.etaLabel ? <strong>{view.etaLabel}</strong> : null}
        </p>
      ) : null}

      {view.recoveryLabel || view.safetyLabel ? (
        <details className="edit-reference-target-study__details">
          <summary>How long-video study works</summary>
          <div>
            {view.recoveryLabel ? (
              <p>{view.recoveryLabel}</p>
            ) : null}
            {view.safetyLabel ? (
              <p>{view.safetyLabel}</p>
            ) : null}
          </div>
        </details>
      ) : null}

      {view.primaryAction ? (
        <div className="edit-reference-target-study__actions">
          {view.primaryAction === 'start' && onStart ? (
            <Button disabled={disabled} onClick={onStart} variant="primary">
              Study this video
            </Button>
          ) : null}
          {view.primaryAction === 'retry' && onRetry ? (
            <Button disabled={disabled} onClick={onRetry} variant="secondary">
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
