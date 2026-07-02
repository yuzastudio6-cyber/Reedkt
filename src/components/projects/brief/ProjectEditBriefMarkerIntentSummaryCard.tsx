import { Badge } from '../../Badge'
import type { ProjectEditBriefMarkerIntentRecord } from '../../../types/project-edit-brief'

type ProjectEditBriefMarkerIntentSummaryCardProps = {
  intent?: ProjectEditBriefMarkerIntentRecord
}

function label(value: string | undefined) {
  return value ? value.replace(/_/g, ' ') : 'Not captured yet'
}

export function ProjectEditBriefMarkerIntentSummaryCard({ intent }: ProjectEditBriefMarkerIntentSummaryCardProps) {
  return (
    <div className="project-edit-brief-marker-chat-intent" data-testid="project-edit-brief-marker-chat-intent">
      <div className="project-edit-brief-marker-chat-card-header">
        <h4>Structured intent</h4>
        <Badge>{intent ? label(intent.status) : 'pending'}</Badge>
      </div>
      {intent ? (
        <dl className="project-edit-brief-detail-list">
          <div>
            <dt>Action</dt>
            <dd>{label(intent.action)}</dd>
          </div>
          <div>
            <dt>Visual</dt>
            <dd>{label(intent.visualBehavior)}</dd>
          </div>
          <div>
            <dt>Audio</dt>
            <dd>{label(intent.audioBehavior)}</dd>
          </div>
          <div>
            <dt>Caption</dt>
            <dd>{label(intent.captionBehavior)}</dd>
          </div>
          <div>
            <dt>Confidence</dt>
            <dd>{intent.confidence}</dd>
          </div>
          {intent.assetRequirement ? (
            <div>
              <dt>Asset need</dt>
              <dd>{intent.assetRequirement}</dd>
            </div>
          ) : null}
          {intent.providedAssetIds.length ? (
            <div>
              <dt>Provided metadata</dt>
              <dd>{intent.providedAssetIds.join(', ')}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p>No structured intent is saved for this marker yet.</p>
      )}
    </div>
  )
}
