import { ProjectEditSessionCard } from './ProjectEditSessionCard'
import { ProjectEditSessionEmptyState } from './ProjectEditSessionEmptyState'
import type { ProjectEditSessionHomeCardViewModel } from '../../lib/project-edit-session-project-home-ui-adapter'

type ProjectEditSessionCardGridProps = {
  cards: ProjectEditSessionHomeCardViewModel[]
  selectedId?: string
  onSelect: (editSessionId: string) => void
}

export function ProjectEditSessionCardGrid({ cards, onSelect, selectedId }: ProjectEditSessionCardGridProps) {
  if (cards.length === 0) return <ProjectEditSessionEmptyState />

  return (
    <div className="project-edit-session-card-grid" data-testid="project-edit-session-card-grid">
      {cards.map((card) => (
        <ProjectEditSessionCard
          card={card}
          key={card.id}
          onSelect={onSelect}
          selected={card.id === selectedId}
        />
      ))}
    </div>
  )
}
