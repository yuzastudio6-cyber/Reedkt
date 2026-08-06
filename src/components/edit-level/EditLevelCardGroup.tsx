import type { EditLevelUICardModel, ReEditProCanonicalEditLevel } from '../../types'
import { EditLevelCard } from './EditLevelCard'

type EditLevelCardGroupProps = {
  cards: EditLevelUICardModel[]
  selectedLevel?: ReEditProCanonicalEditLevel
  recommendedLevel?: ReEditProCanonicalEditLevel
  disabled?: boolean
  onSelect?: (level: ReEditProCanonicalEditLevel) => void
}

export function EditLevelCardGroup({
  cards,
  disabled = false,
  onSelect,
  recommendedLevel,
  selectedLevel,
}: EditLevelCardGroupProps) {
  return (
    <div className="edit-level-card-group" data-testid="edit-level-card-group">
      {cards.map((card) => (
        <EditLevelCard
          card={{
            ...card,
            recommended: card.recommended || card.level === recommendedLevel,
          }}
          disabled={disabled}
          key={card.level}
          onSelect={onSelect}
          selected={card.level === selectedLevel}
        />
      ))}
    </div>
  )
}
