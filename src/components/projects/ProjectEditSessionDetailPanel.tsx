import { ArrowRight, CheckCircle2, Film, Layers3, MessageSquareText } from 'lucide-react'
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
        <span className="section-eyebrow">Edit Chat detail</span>
        <h2>Select an Edit Chat</h2>
        <p>Choose a card to inspect mock setup, memory, versions, sources, revisions, and preview status.</p>
      </Card>
    )
  }

  return (
    <Card className="project-edit-session-detail-panel" data-testid="project-edit-session-detail-panel">
      <div className="project-edit-session-detail-panel__heading">
        <div>
          <span className="section-eyebrow">Selected Edit Chat</span>
          <h2>{card.name}</h2>
          <p>{card.frameLabel}</p>
        </div>
        <Badge accent="cyan">Mock only</Badge>
      </div>

      <div className="project-edit-session-detail-panel__badges">
        <Badge accent="violet">{card.dnaBadgeLabel}</Badge>
        <Badge accent="cyan">{card.qaBadgeLabel}</Badge>
        <Badge>{card.statusLabel}</Badge>
      </div>

      {loading ? <p>Loading mock Edit Chat summary...</p> : null}

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

          <dl className="project-edit-session-detail-panel__list">
            <div>
              <dt>Latest status</dt>
              <dd>{detail.latestStatus}</dd>
            </div>
            <div>
              <dt>Latest preview</dt>
              <dd>{detail.latestPreviewLabel}</dd>
            </div>
            <div>
              <dt>Edit level</dt>
              <dd>{detail.selectedEditLevelLabel}</dd>
            </div>
            <div>
              <dt>Edit Preference</dt>
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
          </dl>

          <div className="project-edit-session-detail-panel__next" data-testid="project-edit-session-open-chat-note">
            <CheckCircle2 aria-hidden="true" size={18} />
            <span>{detail.openChatLabel}</span>
          </div>
        </>
      ) : null}

      <Button disabled={!detail} icon={ArrowRight} to={detail?.openChatRoute} variant="secondary">
        Open Edit Chat
      </Button>
    </Card>
  )
}
