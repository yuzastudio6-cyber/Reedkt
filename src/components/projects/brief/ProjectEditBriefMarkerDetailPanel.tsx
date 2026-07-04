import { Badge } from '../../Badge'
import { Card } from '../../Card'
import type { ProjectEditBriefMarkerDetailModel } from '../../../lib/project-edit-brief-ui-adapter'
import { ProjectEditBriefAttachmentChips } from './ProjectEditBriefAttachmentChips'
import { ProjectEditBriefQABadge } from './ProjectEditBriefQABadge'

type ProjectEditBriefMarkerDetailPanelProps = {
  marker?: ProjectEditBriefMarkerDetailModel
}

export function ProjectEditBriefMarkerDetailPanel({ marker }: ProjectEditBriefMarkerDetailPanelProps) {
  if (!marker) {
    return (
      <Card className="project-edit-brief-marker-detail" data-testid="project-edit-brief-marker-detail">
        <span className="section-eyebrow">Marker detail</span>
        <h3>Select a marker</h3>
        <p>Select an existing marker to edit it, or use Add Marker on the timeline to create mock/local marker metadata.</p>
      </Card>
    )
  }

  return (
    <Card className="project-edit-brief-marker-detail" data-testid="project-edit-brief-marker-detail">
      <div className="project-edit-brief-marker-detail__header">
        <div>
          <span className="section-eyebrow">Selected marker</span>
          <h3>{marker.title}</h3>
        </div>
        <Badge accent="cyan">{marker.statusLabel}</Badge>
      </div>
      <div className="project-edit-brief-marker-detail__badges">
        <Badge>{marker.markerTypeLabel}</Badge>
        <Badge>{marker.priorityLabel}</Badge>
        <ProjectEditBriefQABadge label={marker.qaStatusLabel} status={marker.qaStatus} />
        <Badge>{marker.timeLabel}</Badge>
      </div>
      <p>{marker.userNote}</p>
      <dl className="project-edit-brief-detail-list">
        <div>
          <dt>Structured intent</dt>
          <dd>{marker.intentSummary}</dd>
        </div>
        <div>
          <dt>Marker Chat messages</dt>
          <dd>{marker.messageCount} scoped message(s)</dd>
        </div>
        <div>
          <dt>QA/conflict status</dt>
          <dd>{marker.conflictCount ? `${marker.conflictCount} conflict(s) need review` : 'No blocking conflict in this marker drawer'}</dd>
        </div>
      </dl>
      <ProjectEditBriefAttachmentChips attachments={marker.attachmentChips} />
      {marker.plannerHints.length ? (
        <ul className="project-edit-brief-note-list" aria-label="Planner hints">
          {marker.plannerHints.map((hint, index) => <li key={`${hint}-${index}`}>{hint}</li>)}
        </ul>
      ) : null}
      {marker.doNotCopyNotes.length ? (
        <ul className="project-edit-brief-note-list project-edit-brief-note-list--safety" aria-label="Do not copy notes">
          {marker.doNotCopyNotes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}
        </ul>
      ) : null}
      <p className="project-edit-brief-muted">{marker.boundary}</p>
    </Card>
  )
}
