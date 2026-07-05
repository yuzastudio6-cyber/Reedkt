import { Clock, MessageSquareText, GitBranch, Layers3 } from 'lucide-react'
import { Badge } from '../Badge'
import { ProjectEditSessionAspectFrame } from './ProjectEditSessionAspectFrame'
import { ProjectEditSessionStatusBadge } from './ProjectEditSessionStatusBadge'
import type { ProjectEditSessionHomeCardViewModel } from '../../lib/project-edit-session-project-home-ui-adapter'

type ProjectEditSessionCardProps = {
  card: ProjectEditSessionHomeCardViewModel
  selected: boolean
  onSelect: (editSessionId: string) => void
}

export function ProjectEditSessionCard({ card, onSelect, selected }: ProjectEditSessionCardProps) {
  return (
    <button
      aria-pressed={selected}
      className={`project-edit-session-card ${card.shapeClassName} ${selected ? 'is-selected' : ''}`.trim()}
      data-testid={`edit-session-card-${card.id}`}
      onClick={() => onSelect(card.id)}
      type="button"
    >
      <ProjectEditSessionAspectFrame card={card} />
      <div className="project-edit-session-card__body">
        <div className="project-edit-session-card__title-row">
          <div>
            <h3>{card.name}</h3>
            <p>{card.platformLabel}</p>
          </div>
          <ProjectEditSessionStatusBadge label={card.statusLabel} status={card.status} />
        </div>

        <div className="project-edit-session-card__badges">
          <Badge accent={card.dnaBadgeLabel === 'DNA applied' ? 'violet' : 'muted'}>{card.dnaBadgeLabel}</Badge>
          <Badge accent="cyan">{card.qaBadgeLabel}</Badge>
        </div>

        <p className="project-edit-session-card__preference">
          Preference: <strong>{card.selectedEditPreferenceLabel}</strong>
        </p>

        <div className="project-edit-session-card__metrics" aria-label={`${card.name} counts`}>
          <span>
            <MessageSquareText aria-hidden="true" size={14} />
            {card.messageCount} messages
          </span>
          <span>
            <GitBranch aria-hidden="true" size={14} />
            {card.revisionCount} revisions
          </span>
          <span>
            <Layers3 aria-hidden="true" size={14} />
            {card.versionCount} versions
          </span>
        </div>

        <div className="project-edit-session-card__time">
          <Clock aria-hidden="true" size={14} />
          Last edited {card.lastEditedLabel}
        </div>
      </div>
    </button>
  )
}
