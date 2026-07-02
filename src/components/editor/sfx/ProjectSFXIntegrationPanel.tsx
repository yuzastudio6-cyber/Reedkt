import { Badge } from '../../Badge'

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
          <h3>Mirelo + MMAudio V2 wired into project editing</h3>
        </div>
        <Badge accent="warning">Mock mode</Badge>
      </div>

      <div className="sfx-score-grid">
        <span><strong>Event plans</strong>{eventCount}</span>
        <span><strong>Generation requests</strong>{generationRequestCount}</span>
        <span><strong>Queued jobs</strong>{queuedJobCount}</span>
        <span><strong>QA passed</strong>{qaPassedCount}</span>
      </div>

      <div className="sfx-score-grid">
        <span><strong>Mirelo SFX V1.5</strong>Production SFX</span>
        <span><strong>MMAudio V2</strong>Cheap draft/basic-pro fallback</span>
        <span><strong>Internal library</strong>First choice when available</span>
        <span><strong>No SFX</strong>Valid when sound does not improve the edit</span>
      </div>

      {providerRouteSummary.slice(0, 2).map((summary) => (
        <p className="sfx-muted-note" key={summary}>{summary}</p>
      ))}

      {statusSummary.slice(0, 3).map((summary) => (
        <p className="sfx-muted-note" key={summary}>{summary}</p>
      ))}

      <p className="sfx-muted-note">Mock mode: ReeditPro has not called Mirelo or MMAudio yet.</p>
    </section>
  )
}
