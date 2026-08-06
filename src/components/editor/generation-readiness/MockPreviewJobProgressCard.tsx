import { FastForward, Sparkles } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { MockPreviewJob } from '../../../types'

type MockPreviewJobProgressCardProps = {
  job: MockPreviewJob | null
  onAdvanceJob?: () => void
  onCompleteJob?: () => void
}

function statusAccent(status: MockPreviewJob['status']) {
  if (status === 'completed') return 'success'
  if (status === 'failed' || status === 'cancelled') return 'danger'
  if (status === 'running' || status === 'queued') return 'cyan'
  return 'muted'
}

export function MockPreviewJobProgressCard({
  job,
  onAdvanceJob,
  onCompleteJob,
}: MockPreviewJobProgressCardProps) {
  if (!job) return null

  const canAdvance = job.status === 'queued' || job.status === 'running'

  return (
    <section className="inline-chat-card mock-preview-job-progress">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Private review progress</span>
          <h3>{job.previewLabel ?? 'Manual private review progress'}</h3>
        </div>
        <Badge accent={statusAccent(job.status)}>{job.status.replace(/_/g, ' ')}</Badge>
      </div>

      <div className="generation-readiness-stat-grid">
        <span>
          <strong>{job.progressPercent}%</strong>
          <small>Progress</small>
        </span>
        <span>
          <strong>{job.steps.filter((step) => step.status === 'completed').length}/{job.steps.length}</strong>
          <small>Steps complete</small>
        </span>
        <span>
          <strong>{job.previewId ?? 'Pending'}</strong>
          <small>Review ID</small>
        </span>
      </div>

      <div className="mock-preview-step-list">
        {job.steps.map((step) => (
          <span className={`mock-preview-step mock-preview-step--${step.status}`} key={step.id}>
            <strong>{step.label}</strong>
            <small>{step.status.replace(/_/g, ' ')} · {step.progressPercent}%</small>
            <small>{step.message}</small>
          </span>
        ))}
      </div>

      {job.failureReason && <p className="inline-helper">{job.failureReason}</p>}

      <div className="generation-readiness-toolbar-actions">
        <Button disabled={!canAdvance} icon={FastForward} onClick={onAdvanceJob} variant="secondary">
          Advance step
        </Button>
        <Button disabled={!canAdvance} icon={Sparkles} onClick={onCompleteJob} variant="primary">
          Complete review
        </Button>
      </div>
    </section>
  )
}
