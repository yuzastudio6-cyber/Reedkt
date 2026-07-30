import { ArrowRight, CheckCircle2, Circle, Film, Layers3, MessageSquareText } from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'
import type {
  ProjectEditSessionHomeCardViewModel,
  ProjectEditSessionHomeDetailViewModel,
} from '../../lib/project-edit-session-project-home-ui-adapter'

type ProjectEditSessionDetailPanelProps = {
  card?: ProjectEditSessionHomeCardViewModel
  detail?: ProjectEditSessionHomeDetailViewModel
  loading?: boolean
}

export function ProjectEditSessionDetailPanel({ card, detail, loading = false }: ProjectEditSessionDetailPanelProps) {
  if (!card) {
    return (
      <Card className="project-edit-session-detail-panel" data-testid="project-edit-session-detail-panel">
        <span className="section-eyebrow">Edit detail</span>
        <h2>Select an edit</h2>
        <p>Choose an edit to inspect setup, source notes, versions, revisions, and preview status.</p>
      </Card>
    )
  }

  return (
    <Card className="project-edit-session-detail-panel" data-testid="project-edit-session-detail-panel">
      <div className="project-edit-session-detail-panel__heading">
        <div>
          <span className="section-eyebrow">Selected edit</span>
          <h2>{card.name}</h2>
          <p>{card.frameLabel}</p>
        </div>
      </div>

      <div className="project-edit-session-detail-panel__badges">
        <Badge accent="violet">{card.dnaBadgeLabel}</Badge>
        <Badge accent="cyan">{card.qaBadgeLabel}</Badge>
        <Badge accent={card.progressAccent}>{card.progressLabel}</Badge>
        <Badge>{card.statusLabel}</Badge>
      </div>

      {loading ? <p>Loading edit summary...</p> : null}

      {detail ? (
        <>
          <div className="project-edit-session-detail-panel__stats">
            <span>
              <MessageSquareText aria-hidden="true" size={16} />
              {card.messageCount} messages
            </span>
            <span>
              <Film aria-hidden="true" size={16} />
              {detail.sourceCount} sources
            </span>
            <span>
              <Layers3 aria-hidden="true" size={16} />
              {card.versionCount} versions
            </span>
          </div>

          <div className="project-edit-session-detail-panel__summary">
            {detail.summaryLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="project-edit-session-detail-panel__progress" data-testid="project-edit-session-progress-summary">
            <strong>Edit progress</strong>
            <div>
              {detail.progressItems.map((item) => (
                <span className={item.complete ? 'is-complete' : ''} key={item.id} title={item.detail}>
                  {item.complete ? <CheckCircle2 aria-hidden="true" size={15} /> : <Circle aria-hidden="true" size={15} />}
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <dl className="project-edit-session-detail-panel__list">
            <div>
              <dt>Latest status</dt>
              <dd>{detail.latestStatus}</dd>
            </div>
            <div>
              <dt>Readiness</dt>
              <dd>{detail.readinessLabel}</dd>
            </div>
            <div>
              <dt>Latest preview</dt>
              <dd>{detail.latestPreviewLabel}</dd>
            </div>
            <div>
              <dt>Preference</dt>
              <dd>{detail.selectedPreferenceSummary}</dd>
            </div>
            <div>
              <dt>Source notes</dt>
              <dd>{detail.sourceNotesSummary}</dd>
            </div>
            <div>
              <dt>Memory</dt>
              <dd>{detail.memorySummary}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{detail.versionSummary}</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{detail.revisionSummary}</dd>
            </div>
            <div>
              <dt>Private artifact</dt>
              <dd>{detail.artifactSummaryLines[0]}</dd>
            </div>
          </dl>

          <div className="project-edit-session-detail-panel__next" data-testid="project-edit-session-open-chat-note">
            <CheckCircle2 aria-hidden="true" size={18} />
            <span>{detail.openChatLabel}</span>
          </div>
        </>
      ) : null}

      <Button disabled={!detail} icon={ArrowRight} to={detail?.openChatRoute} variant="secondary">
        Open edit
      </Button>
    </Card>
  )
}
