import { JobStatusCard } from '../jobs/JobStatusCard'
import { JobTimeline } from '../jobs/JobTimeline'
import { recentJobs } from '../web-shell-fixtures'

export function JobQueuePage() {
  return (
    <div className="web-shell-page">
      <section className="web-shell-page-heading">
        <div>
          <p className="web-shell-eyebrow">Jobs and progress</p>
          <h2>Worker visibility without browser execution.</h2>
          <p>
            Job states are mock-safe summaries of completed, warning, blocked, and future queued work. No Cloud Run job
            is triggered from this UI.
          </p>
        </div>
      </section>
      <div className="web-shell-grid two">
        <JobTimeline jobs={recentJobs} />
        <div className="web-shell-stack">
          {recentJobs.map((job) => (
            <JobStatusCard key={job.jobId} job={job} />
          ))}
        </div>
      </div>
    </div>
  )
}
