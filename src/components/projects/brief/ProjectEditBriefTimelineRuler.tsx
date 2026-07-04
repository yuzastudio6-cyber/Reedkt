import type { ProjectEditBriefTimelineUIModel } from '../../../lib/project-edit-brief-ui-adapter'

type ProjectEditBriefTimelineRulerProps = {
  timeline: ProjectEditBriefTimelineUIModel
}

export function ProjectEditBriefTimelineRuler({ timeline }: ProjectEditBriefTimelineRulerProps) {
  return (
    <div className="project-edit-brief-timeline-ruler" data-testid="project-edit-brief-timeline-ruler">
      {timeline.rulerTicks.map((tick) => (
        <span
          className="project-edit-brief-timeline-ruler__tick"
          key={tick.second}
          style={{ left: `${tick.leftPercent}%` }}
        >
          {tick.label}
        </span>
      ))}
    </div>
  )
}
