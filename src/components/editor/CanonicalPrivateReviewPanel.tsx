import { useState } from 'react'
import {
  CheckCircle2,
  Download,
  History,
  Loader2,
  MessageSquareText,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import type { CanonicalEditJourney } from '../../lib/canonical-edit-journey'
import type { CanonicalPrivateReviewHookResult } from '../../hooks/useCanonicalPrivateReview'

type CanonicalPrivateReviewPanelProps = {
  journey: CanonicalEditJourney
  review: CanonicalPrivateReviewHookResult
  onLoad: () => void
  onAccept: () => void
  onRequestRevision: (
    summary: string,
    captionReplacementText?: string,
  ) => void
  revisionMode?: 'generic' | 'source_led_caption'
  revisionPresentationBusy?: boolean
}

export function CanonicalPrivateReviewPanel({
  journey,
  onAccept,
  onLoad,
  onRequestRevision,
  review,
  revisionMode = 'generic',
  revisionPresentationBusy = false,
}: CanonicalPrivateReviewPanelProps) {
  const authority = journey.privateReviewMediaAuthority
  const reviewAssemblyId = authority?.reviewAssemblyId ?? ''
  const isCurrentRequest = Boolean(
    authority && review.requestedReviewAssemblyId === reviewAssemblyId,
  )
  const media = isCurrentRequest ? review.media : null
  const mediaResult = isCurrentRequest ? review.mediaResult : null
  const loading = isCurrentRequest && review.loadingMedia
  const decisionResult = isCurrentRequest ? review.decisionResult : null
  const recordingDecision =
    (isCurrentRequest && review.recordingDecision) ||
    revisionPresentationBusy
  const decisionAvailable = journey.stage === 'private_review_ready' && Boolean(
    journey.privateReviewDecisionAuthority,
  )
  const [revisionDraft, setRevisionDraft] = useState({
    reviewAssemblyId,
    summary: '',
  })
  const revisionSummary = revisionDraft.reviewAssemblyId === reviewAssemblyId
    ? revisionDraft.summary
    : ''
  const exactCaptionRevision = revisionMode === 'source_led_caption'
  const captionValidationMessage = exactCaptionRevision
    ? validateCaptionReplacement(revisionSummary)
    : ''
  const revisionReady = exactCaptionRevision
    ? captionValidationMessage === '' && revisionSummary.trim().length > 0
    : revisionSummary.trim().length >= 8

  if (!authority) return null

  const handleDownload = () => {
    if (!media) return
    const anchor = document.createElement('a')
    anchor.href = media.objectUrl
    anchor.download = media.fileName
    anchor.rel = 'noreferrer'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  }

  return (
    <section
      aria-label="Private review"
      className="canonical-private-review"
      data-mode={authority.mode}
      data-testid="canonical-private-review"
    >
      <div className="canonical-private-review-heading">
        <div>
          <span className="section-eyebrow">
            {authority.mode === 'history' ? 'Saved review' : 'Private playback'}
          </span>
          <strong>
            {authority.mode === 'history'
              ? 'Reopen this review version'
              : 'Watch before you decide'}
          </strong>
        </div>
        <Badge accent={authority.mode === 'history' ? 'muted' : 'cyan'}>
          {authority.mode === 'history' ? 'History' : 'No public link'}
        </Badge>
      </div>

      {media ? (
        <div className="canonical-private-review-player" data-testid="canonical-private-review-player">
          <video
            aria-label="WeEditPro private review video"
            controls
            playsInline
            preload="metadata"
            src={media.objectUrl}
          />
          <div className="canonical-private-review-file-row">
            <span>
              {media.mode === 'history' ? <History aria-hidden="true" size={15} /> : <ShieldCheck aria-hidden="true" size={15} />}
              Verified private review · {formatBytes(media.byteSize)}
            </span>
            <Button icon={Download} onClick={handleDownload} size="sm" variant="secondary">
              Download review
            </Button>
          </div>
        </div>
      ) : (
        <div
          aria-live="polite"
          className="canonical-private-review-load"
          data-status={loading ? 'loading' : mediaResult?.status ?? 'ready'}
          data-testid={`canonical-private-review-media-${loading ? 'loading' : mediaResult?.status ?? 'ready'}`}
          role={mediaResult && mediaResult.status !== 'ready' ? 'alert' : 'status'}
        >
          <div>
            {loading
              ? <Loader2 aria-hidden="true" className="spin-icon" size={18} />
              : authority.mode === 'history'
                ? <History aria-hidden="true" size={18} />
                : <PlayCircle aria-hidden="true" size={18} />}
            <div>
              <strong>{mediaLoadTitle(loading, mediaResult, authority.mode)}</strong>
              <p>{mediaLoadMessage(loading, mediaResult, authority.mode)}</p>
            </div>
          </div>
          <Button
            aria-busy={loading}
            data-testid="canonical-private-review-load"
            disabled={loading || Boolean(mediaResult && !mediaResult.retryable)}
            icon={authority.mode === 'history' ? History : PlayCircle}
            onClick={onLoad}
            size="sm"
            variant="primary"
          >
            {loading ? 'Loading review…' : mediaResult?.retryable ? 'Try again' : 'Load private review'}
          </Button>
        </div>
      )}

      {decisionAvailable && (
        <div className="canonical-private-review-decision" data-testid="canonical-private-review-decision">
          <div className="canonical-private-review-decision-copy">
            <strong>Your decision</strong>
            <p>
              Approve this exact review or describe the change you want. A revision always returns to a fresh plan, estimate, and approval.
            </p>
          </div>
          <label htmlFor="canonical-private-review-revision-summary">
            {exactCaptionRevision ? 'Replacement caption' : 'Revision direction'}
            <span>Required only for changes</span>
          </label>
          <textarea
            disabled={recordingDecision || decisionResult?.status === 'recorded'}
            id="canonical-private-review-revision-summary"
            aria-describedby={exactCaptionRevision
              ? 'canonical-private-review-revision-help'
              : undefined}
            aria-invalid={Boolean(captionValidationMessage)}
            maxLength={exactCaptionRevision ? 120 : 4000}
            onChange={(event) => setRevisionDraft({
              reviewAssemblyId,
              summary: event.target.value,
            })}
            placeholder={exactCaptionRevision
              ? 'Type the exact caption you want in the revised edit.'
              : 'Example: Tighten the opening pace, keep the original clip order, and make the captions smaller.'}
            rows={exactCaptionRevision ? 2 : 3}
            value={revisionSummary}
          />
          {exactCaptionRevision && (
            <p
              className="canonical-private-review-revision-help"
              data-status={captionValidationMessage ? 'invalid' : 'ready'}
              id="canonical-private-review-revision-help"
              role={captionValidationMessage ? 'alert' : undefined}
            >
              {captionValidationMessage ||
                'This pass changes one caption only. Source order, meaning, output frame, Edit Preferences, and Edit Brief stay locked.'}
            </p>
          )}
          <div className="canonical-private-review-decision-actions">
            <Button
              aria-busy={recordingDecision}
              data-testid="canonical-private-review-accept"
              disabled={!media || recordingDecision || decisionResult?.status === 'recorded'}
              icon={CheckCircle2}
              onClick={onAccept}
              size="sm"
              variant="primary"
            >
              {recordingDecision ? 'Saving decision…' : 'Approve private review'}
            </Button>
            <Button
              aria-busy={recordingDecision}
              data-testid="canonical-private-review-request-revision"
              disabled={
                !media ||
                !revisionReady ||
                recordingDecision ||
                decisionResult?.status === 'recorded'
              }
              icon={MessageSquareText}
              onClick={() => onRequestRevision(
                exactCaptionRevision
                  ? `Replace the approved caption with: ${revisionSummary.trim()}`
                  : revisionSummary,
                exactCaptionRevision ? revisionSummary.trim() : undefined,
              )}
              size="sm"
              variant="secondary"
            >
              {revisionPresentationBusy
                ? 'Preparing revised plan…'
                : exactCaptionRevision
                  ? 'Revise caption'
                  : 'Request changes'}
            </Button>
          </div>
          {decisionResult && (
            <div
              aria-live="polite"
              className="canonical-private-review-decision-result"
              data-status={decisionResult.status}
              data-testid={`canonical-private-review-decision-${decisionResult.status}`}
              role={decisionResult.status === 'recorded' ? 'status' : 'alert'}
            >
              {decisionResult.status === 'recorded'
                ? <CheckCircle2 aria-hidden="true" size={16} />
                : <MessageSquareText aria-hidden="true" size={16} />}
              <span>{decisionResult.message}</span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function mediaLoadTitle(
  loading: boolean,
  result: CanonicalPrivateReviewHookResult['mediaResult'],
  mode: 'current' | 'history',
): string {
  if (loading) return 'Loading the verified review'
  if (result?.status === 'blocked') return 'Review needs a refresh'
  if (result) return 'Review could not load'
  return mode === 'history' ? 'Saved review is available' : 'Private review is ready to load'
}

function mediaLoadMessage(
  loading: boolean,
  result: CanonicalPrivateReviewHookResult['mediaResult'],
  mode: 'current' | 'history',
): string {
  if (loading) return 'Checking the exact saved review and its private media before playback.'
  if (result) return result.message
  if (mode === 'history') {
    return 'Reopen the verified review attached to this saved decision. No execution authority is restored.'
  }
  return 'Load the no-store review video through your signed-in workspace. No public or signed link is created.'
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function validateCaptionReplacement(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.length > 120) return 'Keep the replacement caption to 120 characters or fewer.'
  if (!/^[\x20-\x7e]+$/.test(trimmed)) {
    return 'Use plain keyboard characters for this bounded caption revision.'
  }
  if (/[{}\\[\]]/.test(trimmed)) {
    return 'Remove braces, brackets, or backslashes from the replacement caption.'
  }
  return ''
}
