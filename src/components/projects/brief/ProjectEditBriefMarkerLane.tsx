import type { ProjectEditBriefTimelineUIModel } from '../../../lib/project-edit-brief-ui-adapter'
import { ProjectEditBriefMarkerPill } from './ProjectEditBriefMarkerPill'
import { ProjectEditBriefPlayhead } from './ProjectEditBriefPlayhead'

type ProjectEditBriefMarkerLaneProps = {
  timeline: ProjectEditBriefTimelineUIModel
  onMovePlayhead: (seconds: number) => void
  onSelectMarker: (markerId: string) => void
}

export function ProjectEditBriefMarkerLane({ onMovePlayhead, onSelectMarker, timeline }: ProjectEditBriefMarkerLaneProps) {
  return (
    <div
      className="project-edit-brief-marker-lane"
      data-testid="project-edit-brief-marker-lane"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0
        onMovePlayhead(Math.max(0, Math.min(timeline.durationSeconds, Math.round(timeline.durationSeconds * ratio))))
      }}
      role="presentation"
    >
      <ProjectEditBriefPlayhead leftPercent={timeline.playheadPercent} />
      {timeline.markers.map((marker) => (
        <ProjectEditBriefMarkerPill
          key={marker.markerId}
          marker={marker}
          onSelect={onSelectMarker}
          selected={timeline.selectedMarkerId === marker.markerId}
        />
      ))}
    </div>
  )
}
