import { Badge } from '../../Badge'
import type {
  ProjectSourceVideoLocalPreview,
  ProjectSourceVideoMetadataSummary,
} from '../../../types/project-source-video'

type ProjectEditBriefSourceVideoSummaryProps = {
  localPreview?: ProjectSourceVideoLocalPreview
  summary: ProjectSourceVideoMetadataSummary
}

function formatBytes(value: number | undefined): string {
  if (!value || value <= 0) return 'Size pending'
  const megabytes = value / (1024 * 1024)
  return `${megabytes.toFixed(megabytes >= 10 ? 1 : 2)} MB`
}

export function ProjectEditBriefSourceVideoSummary({
  localPreview,
  summary,
}: ProjectEditBriefSourceVideoSummaryProps) {
  return (
    <section className="project-edit-brief-source-video-summary" data-testid="project-source-video-summary">
      <div className="project-edit-brief-source-video-summary__header">
        <div>
          <span className="section-eyebrow">Source summary</span>
          <h3>{summary.label}</h3>
        </div>
        <Badge accent={localPreview ? 'cyan' : 'muted'}>{localPreview ? 'Local only' : 'Mock shell'}</Badge>
      </div>
      <div className="project-edit-brief-source-video-summary__grid">
        <span><strong>Duration</strong>{summary.durationLabel}</span>
        <span><strong>Dimensions</strong>{summary.dimensionLabel}</span>
        <span><strong>Aspect</strong>{summary.aspectRatioLabel}</span>
        <span><strong>Size</strong>{formatBytes(localPreview?.sizeBytes)}</span>
      </div>
      <p className="project-edit-brief-muted" data-testid="project-source-video-summary-boundary">
        {summary.boundarySummary}
      </p>
    </section>
  )
}
