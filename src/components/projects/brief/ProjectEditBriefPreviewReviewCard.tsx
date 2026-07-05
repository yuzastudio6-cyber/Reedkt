import { CheckCircle2, LoaderCircle, MessageSquareWarning } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { Card } from '../../Card'
import { createProjectSourceVideoPreviewReview } from '../../../lib/project-source-video-preview-review'
import type {
  ProjectSourceVideoLocalEditPreviewConfig,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoPreviewReviewResult,
  ProjectSourceVideoPreviewReviewStatus,
} from '../../../types/project-source-video'

type ProjectEditBriefPreviewReviewCardProps = {
  config: ProjectSourceVideoLocalEditPreviewConfig
  onReviewRecorded?: (result: ProjectSourceVideoPreviewReviewResult) => void
  previewResult?: ProjectSourceVideoLocalEditPreviewResult
}

function reviewStatusLabel(status: ProjectSourceVideoPreviewReviewStatus): string {
  return status.replace(/_/g, ' ')
}

export function ProjectEditBriefPreviewReviewCard({
  config,
  onReviewRecorded,
  previewResult,
}: ProjectEditBriefPreviewReviewCardProps) {
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<ProjectSourceVideoPreviewReviewStatus>('not_reviewed')
  const [reviewResult, setReviewResult] = useState<ProjectSourceVideoPreviewReviewResult | undefined>()
  const [error, setError] = useState<string | undefined>()

  async function recordReview(reviewStatus: 'approved' | 'changes_requested') {
    if (!config.available || !config.apiBaseUrl || !previewResult) return
    setStatus('approving')
    setError(undefined)
    try {
      const result = await createProjectSourceVideoPreviewReview({
        apiBaseUrl: config.apiBaseUrl,
        notes,
        previewResult,
        reviewStatus,
        workspaceId: config.workspaceId,
      })
      setReviewResult(result)
      setStatus(result.reviewStatus === 'approved' ? 'approved' : 'changes_requested')
      onReviewRecorded?.(result)
    } catch (caught) {
      setStatus('failed')
      setError(caught instanceof Error ? caught.message : 'Preview review failed safely.')
    }
  }

  const disabled = !config.available || !previewResult || status === 'approving'
  const visibleStatus = reviewResult ? reviewResult.reviewStatus : status

  return (
    <Card className="project-edit-brief-preview-review" data-testid="project-edit-preview-review">
      <div className="project-edit-brief-local-preview-smoke__header">
        <div>
          <span className="section-eyebrow">Preview review</span>
          <h3>Review the test preview</h3>
          <p>Record whether the internal preview is approved for the next implementation gate or needs changes.</p>
        </div>
        <Badge accent={visibleStatus === 'approved' ? 'success' : visibleStatus === 'failed' ? 'danger' : 'cyan'}>
          {reviewStatusLabel(visibleStatus)}
        </Badge>
      </div>
      <label htmlFor="project-edit-preview-review-notes">Review notes</label>
      <textarea
        disabled={!previewResult || status === 'approving'}
        id="project-edit-preview-review-notes"
        onChange={(event) => setNotes(event.currentTarget.value)}
        placeholder="What looked right? What needs revision?"
        rows={4}
        value={notes}
      />
      <div className="new-edit-session-create-panel__actions">
        <Button
          disabled={disabled}
          icon={status === 'approving' ? LoaderCircle : CheckCircle2}
          onClick={() => recordReview('approved')}
          size="sm"
          type="button"
          variant="primary"
        >
          Approve preview
        </Button>
        <Button
          disabled={disabled}
          icon={MessageSquareWarning}
          onClick={() => recordReview('changes_requested')}
          size="sm"
          type="button"
          variant="secondary"
        >
          Request changes
        </Button>
      </div>
      {reviewResult ? (
        <div className="project-edit-brief-local-preview-smoke__status" data-testid="project-edit-preview-review-status">
          <span><strong>Review record</strong>{reviewResult.id}</span>
          <span><strong>Render</strong>{reviewResult.renderId}</span>
          <span><strong>Decision</strong>{reviewStatusLabel(reviewResult.reviewStatus)}</span>
        </div>
      ) : (
        <p className="project-edit-brief-muted">
          {previewResult
            ? 'Review is available for the preview-only internal result. Final export stays blocked.'
            : 'Run the local edit preview before recording review.'}
        </p>
      )}
      {error ? <p className="project-edit-brief-source-video-picker__error">{error}</p> : null}
    </Card>
  )
}
