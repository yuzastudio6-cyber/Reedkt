import type { ProjectEditBriefSkippedMarker } from '../../../types/project-edit-brief-plan'

type ProjectEditBriefSkippedMarkerListProps = {
  skippedMarkers: ProjectEditBriefSkippedMarker[]
}

export function ProjectEditBriefSkippedMarkerList({ skippedMarkers }: ProjectEditBriefSkippedMarkerListProps) {
  if (!skippedMarkers.length) {
    return <p className="project-edit-brief-muted">No markers skipped by the mock plan-hint bridge.</p>
  }
  return (
    <ul className="project-edit-brief-plan-skipped-list" data-testid="project-edit-brief-plan-skipped-list">
      {skippedMarkers.map((marker) => (
        <li key={marker.markerId}>
          <strong>{marker.markerTitle}</strong>
          <span>{marker.eligibility.replaceAll('_', ' ')}</span>
          <p>{marker.reason}</p>
          <em>{marker.recommendedFix}</em>
        </li>
      ))}
    </ul>
  )
}
