import type { ProjectEditBriefTimelineMarkerUIModel } from '../../../lib/project-edit-brief-ui-adapter'
import { ProjectEditBriefQABadge } from './ProjectEditBriefQABadge'

type ProjectEditBriefMarkerPillProps = {
  marker: ProjectEditBriefTimelineMarkerUIModel
  selected: boolean
  onSelect: (markerId: string) => void
}

export function ProjectEditBriefMarkerPill({ marker, onSelect, selected }: ProjectEditBriefMarkerPillProps) {
  return (
    <button
      aria-pressed={selected}
      className={`project-edit-brief-marker-pill project-edit-brief-marker-pill--${marker.colorToken} ${selected ? 'is-selected' : ''}`.trim()}
      data-testid={`project-edit-brief-marker-pill-${marker.markerId}`}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(marker.markerId)
      }}
      style={{ left: `${marker.leftPercent}%`, width: `${marker.widthPercent}%` }}
      type="button"
    >
      <span className="project-edit-brief-marker-pill__icon">{marker.iconLabel}</span>
      <span className="project-edit-brief-marker-pill__label">{marker.label}</span>
      <ProjectEditBriefQABadge status={marker.qaStatus} />
      <span className="project-edit-brief-marker-pill__time">{marker.timeLabel}</span>
    </button>
  )
}
