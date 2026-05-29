import type { WebShellJob } from '../web-shell-types'
import { StatusBadge } from '../components/StatusBadge'

interface JobTimelineProps {
  jobs: WebShellJob[]
}

export function JobTimeline({ jobs }: JobTimelineProps) {
  return (
    <ol className="web-shell-job-timeline">
      {jobs.map((job) => (
        <li key={job.jobId}>
          <span className={`web-shell-timeline-dot ${job.status}`} />
          <div>
            <strong>{job.label}</strong>
            <p>{job.summary}</p>
          </div>
          <StatusBadge tone={job.status === 'completed' ? 'ready' : job.status === 'blocked' ? 'blocked' : 'warning'}>
            {job.status.replace('_', ' ')}
          </StatusBadge>
        </li>
      ))}
    </ol>
  )
}
