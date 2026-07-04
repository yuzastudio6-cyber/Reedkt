import { Plus } from 'lucide-react'
import { Button } from '../../Button'

type ProjectEditBriefAddMarkerButtonProps = {
  disabled?: boolean
  disabledReason?: string
  onAddMarker: () => void
  playheadLabel: string
}

export function ProjectEditBriefAddMarkerButton({
  disabled = false,
  disabledReason,
  onAddMarker,
  playheadLabel,
}: ProjectEditBriefAddMarkerButtonProps) {
  return (
    <div className="project-edit-brief-add-marker">
      <Button
        data-testid="project-edit-brief-add-marker-button"
        disabled={disabled}
        icon={Plus}
        onClick={onAddMarker}
        size="sm"
        variant="primary"
      >
        Add Marker
      </Button>
      <span data-testid="project-edit-brief-add-marker-playhead">
        At {playheadLabel}
      </span>
      {disabled && disabledReason ? (
        <small data-testid="project-edit-brief-add-marker-disabled">{disabledReason}</small>
      ) : null}
    </div>
  )
}
