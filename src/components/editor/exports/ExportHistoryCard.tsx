import { Badge } from '../../Badge'
import type {
  MockExportJob,
  MockExportOutput,
} from '../../../types'

type ExportHistoryCardProps = {
  jobs: MockExportJob[]
  outputs: MockExportOutput[]
}

function label(value: string) {
  return value.replace(/_/g, ' ')
}

export function ExportHistoryCard({ jobs, outputs }: ExportHistoryCardProps) {
  const historyJobs = jobs.filter((job) => job.status === 'completed' || job.status === 'failed')

  return (
    <section className="inline-chat-card export-history-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Export history</span>
          <h3>Internal export rehearsals</h3>
        </div>
        <Badge accent={historyJobs.length ? 'info' : 'muted'}>{historyJobs.length} rehearsals</Badge>
      </div>
      {historyJobs.length === 0 ? (
        <p className="inline-helper">No export history yet.</p>
      ) : (
        <div className="export-history-list">
          {historyJobs.map((job) => (
            <article className={`export-history-row export-history-row--${job.status}`} key={job.id}>
              <strong>{label(job.status)} · preview v{job.sourcePreviewVersion ?? 1}</strong>
              <small>{job.outputs.length || outputs.filter((output) => output.sourcePreviewId === job.sourcePreviewId).length} private output records</small>
              {job.failureReason && <p>{job.failureReason}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
