import { AlertTriangle, Database, ListChecks } from 'lucide-react'
import { Badge } from '../Badge'
import type { ProjectEditSessionMemoryLayerCardModel } from '../../lib/project-edit-session-memory-ui-adapter'

type ProjectEditSessionMemoryLayerCardProps = {
  card: ProjectEditSessionMemoryLayerCardModel
}

export function ProjectEditSessionMemoryLayerCard({ card }: ProjectEditSessionMemoryLayerCardProps) {
  return (
    <article
      className={[
        'project-edit-session-memory-layer-card',
        card.isRevisionLayer ? 'project-edit-session-memory-layer-card--revision' : '',
        card.isSourceLayer ? 'project-edit-session-memory-layer-card--source' : '',
        card.isDnaLayer ? 'project-edit-session-memory-layer-card--dna' : '',
      ].filter(Boolean).join(' ')}
      data-testid={`edit-session-memory-layer-${card.layer}`}
    >
      <div className="project-edit-session-memory-layer-card__header">
        <strong>{card.title}</strong>
        <Badge accent={card.warningsCount ? 'warning' : 'cyan'}>Mock memory</Badge>
      </div>
      <p>{card.summary}</p>
      <div className="project-edit-session-memory-layer-card__counts">
        <span>
          <Database aria-hidden="true" size={13} />
          {card.factsCount} facts
        </span>
        <span>
          <ListChecks aria-hidden="true" size={13} />
          {card.preferencesCount} prefs
        </span>
        <span>
          <AlertTriangle aria-hidden="true" size={13} />
          {card.warningsCount} warnings
        </span>
      </div>
      <span className="project-edit-session-memory-layer-card__updated">{card.updatedLabel}</span>
    </article>
  )
}
