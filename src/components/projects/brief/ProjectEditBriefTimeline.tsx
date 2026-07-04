import type { ProjectEditBriefTimelineUIModel } from '../../../lib/project-edit-brief-ui-adapter'
import { ProjectEditBriefAddMarkerButton } from './ProjectEditBriefAddMarkerButton'
import { ProjectEditBriefMarkerLane } from './ProjectEditBriefMarkerLane'
import { ProjectEditBriefTimelineRuler } from './ProjectEditBriefTimelineRuler'

type ProjectEditBriefTimelineProps = {
  canAddMarker: boolean
  addMarkerDisabledReason?: string
  timeline: ProjectEditBriefTimelineUIModel
  onAddMarker: () => void
  onMovePlayhead: (seconds: number) => void
  onSelectMarker: (markerId: string) => void
  timelineEyebrow?: string
}

export function ProjectEditBriefTimeline({
  addMarkerDisabledReason,
  canAddMarker,
  onAddMarker,
  onMovePlayhead,
  onSelectMarker,
  timeline,
  timelineEyebrow = 'Mock timeline',
}: ProjectEditBriefTimelineProps) {
  return (
    <section className="project-edit-brief-timeline" data-testid="project-edit-brief-timeline">
      <div className="project-edit-brief-timeline__header">
        <div>
          <span className="section-eyebrow">{timelineEyebrow}</span>
          <strong>{timeline.durationLabel} duration</strong>
        </div>
        <ProjectEditBriefAddMarkerButton
          disabled={!canAddMarker}
          disabledReason={addMarkerDisabledReason}
          onAddMarker={onAddMarker}
          playheadLabel={timeline.playheadLabel}
        />
      </div>
      <ProjectEditBriefTimelineRuler timeline={timeline} />
      <ProjectEditBriefMarkerLane
        onMovePlayhead={onMovePlayhead}
        onSelectMarker={onSelectMarker}
        timeline={timeline}
      />
    </section>
  )
}
