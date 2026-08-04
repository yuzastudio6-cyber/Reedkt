import { FastForward, Flag, XCircle } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { hideInternalToolNamesInCopy } from '../../../lib/tool-display-labels'
import type { MockRevisionJob } from '../../../types'

type RevisionJobProgressCardProps = {
  job: MockRevisionJob | null
  onAdvance?: () => void
  onComplete?: () => void
  onFail?: () => void
}

function label(value: string) {
  return value.replace(/_/g, ' ')
}

const STEP_LABELS: Partial<Record<MockRevisionJob['steps'][number]['key'], string>> = {
  read_edit_operations: 'Reading requested changes',
  classify_revision: 'Checking change impact',
  validate_revision_scope: 'Checking revision boundaries',
  reserve_mock_revision_credits: 'Confirming internal test estimate',
  apply_edit_map_operations: 'Applying local review changes',
  rerender_preview_segments: 'Preparing revised review sections',
  run_revision_qa: 'Checking revised review',
  create_preview_version: 'Saving revised review version',
  create_edit_map_version: 'Saving editable review state',
}

const STEP_MESSAGES: Partial<Record<MockRevisionJob['steps'][number]['key'], string>> = {
  read_edit_operations: 'Gather the requested review changes for this revision.',
  classify_revision: 'Confirm whether the changes stay local or need a new private review pass.',
  validate_revision_scope: 'Check the affected edit areas before preparing a new review version.',
  reserve_mock_revision_credits: 'Record internal test approval without charging real credits.',
  apply_edit_map_operations: 'Apply the approved local changes to the revised review plan.',
  rerender_preview_segments: 'Prepare the updated review sections for internal testing only.',
  run_revision_qa: 'Check the revised review handoff before it is shown again.',
  create_preview_version: 'Record the new private review version.',
  create_edit_map_version: 'Save the editable review state for follow-up changes.',
}

export function RevisionJobProgressCard({ job, onAdvance, onComplete, onFail }: RevisionJobProgressCardProps) {
  if (!job) return null
  const finished = job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled'

  return (
    <section className={`inline-chat-card revision-job-progress-card revision-job--${job.status}`} data-testid="revision-job-progress-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Revision preparation</span>
          <h3>{label(job.status)}</h3>
        </div>
        <Badge accent={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'danger' : 'info'}>
          {job.progressPercent}%
        </Badge>
      </div>
      <p className="inline-helper">
        Preparing a revised private review from the approved change request. Public sharing and billing remain off.
      </p>
      {job.previewLabel && <p className="inline-helper">{hideInternalToolNamesInCopy(job.previewLabel)}</p>}
      {job.failureReason && <p className="inline-helper">{hideInternalToolNamesInCopy(job.failureReason)}</p>}
      <div className="revision-job-step-list">
        {job.steps.map((step) => (
          <article className={`revision-job-step revision-job-step--${step.status}`} key={step.id}>
            <strong>{STEP_LABELS[step.key] ?? hideInternalToolNamesInCopy(step.label)}</strong>
            <small>{label(step.status)} · {step.progressPercent}%</small>
            <p>{STEP_MESSAGES[step.key] ?? hideInternalToolNamesInCopy(step.message)}</p>
          </article>
        ))}
      </div>
      <div className="inline-card-actions">
        <Button disabled={finished} icon={FastForward} onClick={onAdvance} variant="secondary">Advance step</Button>
        <Button disabled={finished} icon={Flag} onClick={onComplete} variant="primary">Mark review ready</Button>
        <Button disabled={finished} icon={XCircle} onClick={onFail} variant="danger">Mark blocked</Button>
      </div>
    </section>
  )
}
