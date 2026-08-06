import { RotateCcw } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { hideInternalToolNamesInCopy } from '../../../lib/tool-display-labels'
import type { RevisionRequest } from '../../../types'

type RevisionRequestCardProps = {
  revisionRequest: RevisionRequest
  manifestVerified?: boolean
  onResetActiveRevision?: () => void
  reviewNote?: string | null
}

function label(value: string) {
  return value.replace(/_/g, ' ')
}

export function RevisionRequestCard({
  manifestVerified = false,
  onResetActiveRevision,
  revisionRequest,
  reviewNote,
}: RevisionRequestCardProps) {
  const cleanedReviewNote = reviewNote?.trim()

  return (
    <section
      className={`inline-chat-card revision-request-card revision-status--${revisionRequest.status}`}
      data-testid="revision-request-card"
    >
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Active revision request</span>
          <h3>{label(revisionRequest.executionMode)}</h3>
        </div>
        <Badge accent={revisionRequest.costPolicy === 'free' ? 'success' : 'warning'}>
          {label(revisionRequest.status)}
        </Badge>
      </div>
      <p className="inline-helper">{revisionRequest.summary}</p>
      {cleanedReviewNote && (
        <blockquote className="revision-direction-note">
          {hideInternalToolNamesInCopy(cleanedReviewNote)}
        </blockquote>
      )}
      <div className="revision-request-meta">
        <span>
          <strong>{revisionRequest.editOperationIds.length}</strong>
          <small>Included operations</small>
        </span>
        <span>
          <strong>{label(revisionRequest.costPolicy)}</strong>
          <small>Cost policy</small>
        </span>
        <span>
          <strong>{revisionRequest.sourcePreviewVersion ?? 1} → {revisionRequest.targetPreviewVersion ?? 'next'}</strong>
          <small>Preview version</small>
        </span>
        <span>
          <strong>{manifestVerified ? 'Attached' : 'Pending'}</strong>
          <small>Review record</small>
        </span>
      </div>
      <p className="inline-helper">
        The source video, approved edit direction, and private review record stay attached. This request needs fresh approval before a revised private review can be accepted.
      </p>
      <div className="revision-classification-list">
        {revisionRequest.classifications.map((classification) => (
          <article className="revision-classification-row" key={classification.editOperationId}>
            <strong>{label(classification.operationType)}</strong>
            <small>{label(classification.impact)} · {label(classification.executionMode)} · {label(classification.costPolicy)}</small>
            <p>{classification.explanation}</p>
          </article>
        ))}
      </div>
      <div className="inline-card-actions">
        <Button icon={RotateCcw} onClick={onResetActiveRevision} variant="ghost">Reset active revision</Button>
      </div>
    </section>
  )
}
