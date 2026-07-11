import { Badge } from '../../Badge'
import { hideInternalToolNamesInCopy } from '../../../lib/tool-display-labels'

type ProjectSFXIntegrationPanelProps = {
  statusSummary: string[]
  providerRouteSummary: string[]
  eventCount: number
  generationRequestCount: number
  queuedJobCount: number
  qaPassedCount: number
}

export function ProjectSFXIntegrationPanel({
  statusSummary,
  providerRouteSummary,
  eventCount,
  generationRequestCount,
  queuedJobCount,
  qaPassedCount,
}: ProjectSFXIntegrationPanelProps) {
  return (
    <section className="inline-chat-card sfx-inline-card sfx-project-integration-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Project SFX workflow</span>
          <h3>SFX route options</h3>
        </div>
        <Badge accent="warning">Internal plan</Badge>
      </div>

      <div className="sfx-score-grid">
        <span><strong>Event plans</strong>{eventCount}</span>
        <span><strong>Requests</strong>{generationRequestCount}</span>
        <span><strong>Queued jobs</strong>{queuedJobCount}</span>
        <span><strong>QA passed</strong>{qaPassedCount}</span>
      </div>

      <div className="sfx-score-grid">
        <span><strong>Production route</strong>High-polish SFX</span>
        <span><strong>Draft route</strong>Basic/pro fallback</span>
        <span><strong>Internal library</strong>First choice when available</span>
        <span><strong>No SFX</strong>Valid when sound does not improve the edit</span>
      </div>

      {providerRouteSummary.slice(0, 2).map((summary) => (
        <p className="sfx-muted-note" key={summary}>{hideInternalToolNamesInCopy(summary)}</p>
      ))}

      {statusSummary.slice(0, 3).map((summary) => (
        <p className="sfx-muted-note" key={summary}>{hideInternalToolNamesInCopy(summary)}</p>
      ))}

      <p className="sfx-muted-note">Audio asset preparation remains approval-gated.</p>
    </section>
  )
}
