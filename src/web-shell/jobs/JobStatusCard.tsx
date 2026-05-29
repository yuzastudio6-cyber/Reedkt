import { ComputeRouteBadge } from '../components/ComputeRouteBadge'
import { StatusBadge } from '../components/StatusBadge'
import type { WebShellJob, WebShellSafetyTone } from '../web-shell-types'

const jobTone: Record<WebShellJob['status'], WebShellSafetyTone> = {
  completed: 'ready',
  warning: 'warning',
  blocked: 'blocked',
  queued_future: 'future',
}

const jobStatusLabel: Record<WebShellJob['status'], string> = {
  completed: 'Completed',
  warning: 'Warning',
  blocked: 'Blocked',
  queued_future: 'Queued future',
}

interface JobStatusCardProps {
  job: WebShellJob
}

export function JobStatusCard({ job }: JobStatusCardProps) {
  return (
    <article className="web-shell-panel web-shell-job-card">
      <div className="web-shell-panel-heading compact">
        <h3>{job.label}</h3>
        <StatusBadge tone={jobTone[job.status]}>{jobStatusLabel[job.status]}</StatusBadge>
      </div>
      <ComputeRouteBadge category={job.routeCategory} />
      <p>{job.summary}</p>
      <ul className="web-shell-compact-list">
        {job.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </article>
  )
}
