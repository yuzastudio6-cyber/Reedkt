import { CheckCircle2 } from 'lucide-react'
import { Badge } from '../Badge'
import type { EditLevelUICardModel, ReEditProCanonicalEditLevel } from '../../types'

type EditLevelCardProps = {
  card: EditLevelUICardModel
  selected?: boolean
  disabled?: boolean
  onSelect?: (level: ReEditProCanonicalEditLevel) => void
}

export function EditLevelCard({
  card,
  disabled = false,
  onSelect,
  selected = false,
}: EditLevelCardProps) {
  return (
    <button
      aria-pressed={selected}
      className={`edit-level-public-card ${selected ? 'is-selected' : ''} ${card.recommended ? 'is-recommended' : ''}`.trim()}
      data-testid={`edit-level-card-${card.level}`}
      disabled={disabled || Boolean(card.disabledReason)}
      onClick={() => onSelect?.(card.level)}
      type="button"
    >
      <span className="edit-level-card-topline">
        <strong>{card.displayName}</strong>
        <span className="edit-level-card-badges">
          {card.recommended && <Badge accent="cyan">Recommended</Badge>}
          {selected && <Badge accent="success">Selected</Badge>}
        </span>
      </span>

      <span className="edit-level-card-promise">
        {selected && <CheckCircle2 aria-hidden="true" size={17} />}
        {card.tagline}
      </span>

      <span className="edit-level-card-copy">{card.bestFor.join(' / ')}</span>

      <span className="edit-level-card-section">
        <small>Included</small>
        <ul>
          {card.includedHighlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </span>

      <span className="edit-level-card-footer">
        <small>{card.editBriefGuidance}</small>
        <small>{card.estimateSummary}</small>
        <small>Mock/local beta boundary.</small>
      </span>
    </button>
  )
}
