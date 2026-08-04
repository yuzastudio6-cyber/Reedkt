import { FastForward, Flag, XCircle } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { MockExportJob } from '../../../types'

type MockExportJobProgressCardProps = {
  job: MockExportJob | null
  onAdvanceExportJob?: () => void
  onCompleteExportJob?: () => void
  onFailExportJob?: () => void
}

function label(value: string) {
  return value.replace(/_/g, ' ')
}

export function MockExportJobProgressCard({
  job,
  onAdvanceExportJob,
  onCompleteExportJob,
  onFailExportJob,
}: MockExportJobProgressCardProps) {
  if (!job) return null
  const finished = job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled'

  return (
    <section className={`inline-chat-card mock-export-job-progress export-job--${job.status}`}>
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Export rehearsal</span>
          <h3>{label(job.status)}</h3>
        </div>
        <Badge accent={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'danger' : 'info'}>
          {job.progressPercent}% · {job.outputs.length} records
        </Badge>
      </div>
      {job.failureReason && <p className="inline-helper">{job.failureReason}</p>}
      <div className="mock-export-step-list">
        {job.steps.map((step) => (
          <article className={`mock-export-step mock-export-step--${step.status}`} key={step.id}>
            <strong>{step.label}</strong>
            <small>{label(step.status)} · {step.progressPercent}%</small>
            <p>{step.message}</p>
          </article>
        ))}
      </div>
      <div className="inline-card-actions">
        <Button disabled={finished} icon={FastForward} onClick={onAdvanceExportJob} variant="secondary">Advance step</Button>
        <Button disabled={finished} icon={Flag} onClick={onCompleteExportJob} variant="primary">Complete rehearsal</Button>
        <Button disabled={finished} icon={XCircle} onClick={onFailExportJob} variant="danger">Fail rehearsal</Button>
      </div>
    </section>
  )
}
