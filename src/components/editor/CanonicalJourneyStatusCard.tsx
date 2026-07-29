import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Download,
  Film,
  Loader2,
  MessageSquareText,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '../Badge'
import { Button, IconButton } from '../Button'
import {
  createCanonicalEditJourneyPresentation,
  type CanonicalEditJourneyTone,
} from '../../lib/canonical-edit-journey'
import type { CanonicalEditJourneyHookResult } from '../../hooks/useCanonicalEditJourney'
import type { CanonicalExecutionPackageRequestHookResult } from '../../hooks/useCanonicalExecutionPackageRequest'
import type { CanonicalPrivateEditPreparationHookResult } from '../../hooks/useCanonicalPrivateEditPreparation'
import type { CanonicalPrivateFinalDownloadHookResult } from '../../hooks/useCanonicalPrivateFinalDownload'
import type { CanonicalPrivateReviewHookResult } from '../../hooks/useCanonicalPrivateReview'
import type { CanonicalSourceLedCaptionRevisionHookResult } from '../../hooks/useCanonicalSourceLedCaptionRevision'
import { CanonicalCustomerDeliveryPanel } from './CanonicalCustomerDeliveryPanel'
import { CanonicalPrivateReviewPanel } from './CanonicalPrivateReviewPanel'

const toneIcon = {
  neutral: CircleDot,
  active: Loader2,
  attention: AlertTriangle,
  success: CheckCircle2,
} as const

type CanonicalJourneyStatusCardProps = CanonicalEditJourneyHookResult & {
  executionPackageRequest?: CanonicalExecutionPackageRequestHookResult
  privateEditPreparation?: CanonicalPrivateEditPreparationHookResult
  privateFinalDownload?: CanonicalPrivateFinalDownloadHookResult
  privateReview?: CanonicalPrivateReviewHookResult
  sourceLedCaptionRevision?: CanonicalSourceLedCaptionRevisionHookResult
  onAcceptPrivateReview?: () => void
  onDownloadAcceptedFinal?: () => void
  onLoadPrivateReview?: () => void
  onPresentSourceLedCaptionRevision?: () => void
  onRequestExecutionPackage?: () => void
  onPreparePrivateEdit?: () => void
  onRequestPrivateReviewRevision?: (
    summary: string,
    captionReplacementText?: string,
  ) => void
}

export function CanonicalJourneyStatusCard({
  executionPackageRequest,
  loading,
  onAcceptPrivateReview,
  onDownloadAcceptedFinal,
  onLoadPrivateReview,
  onPresentSourceLedCaptionRevision,
  onPreparePrivateEdit,
  onRequestExecutionPackage,
  onRequestPrivateReviewRevision,
  privateEditPreparation,
  privateFinalDownload,
  privateReview,
  refresh,
  refreshing,
  result,
  sourceLedCaptionRevision,
  updatedAt,
}: CanonicalJourneyStatusCardProps) {
  if (result?.status === 'not_configured') return null

  if (loading || (!result && refreshing)) {
    return (
      <section
        aria-label="Saved workflow status"
        className="canonical-journey-status canonical-journey-status-active"
        data-testid="canonical-journey-status-loading"
      >
        <Loader2 aria-hidden="true" className="spin-icon" size={18} />
        <div className="canonical-journey-status-copy">
          <strong>Checking the saved workflow</strong>
          <p>Recovering the latest safe planning, approval, preparation, and review state.</p>
        </div>
      </section>
    )
  }

  if (!result) return null

  if (result.status !== 'ready') {
    const tone: CanonicalEditJourneyTone = result.status === 'access_denied' || result.status === 'invalid_response'
      ? 'attention'
      : 'neutral'
    const Icon = toneIcon[tone]
    return (
      <section
        aria-label="Saved workflow status"
        className={`canonical-journey-status canonical-journey-status-${tone}`}
        data-testid={`canonical-journey-status-${result.status.replace('_', '-')}`}
      >
        <Icon aria-hidden="true" size={18} />
        <div className="canonical-journey-status-copy">
          <span className="section-eyebrow">Saved workflow</span>
          <strong>{failureTitle(result.status)}</strong>
          <p>{result.message}</p>
          <small>No editing, credit, or publishing action started.</small>
        </div>
        {result.retryable && (
          <IconButton
            disabled={refreshing}
            icon={RefreshCw}
            label="Retry saved workflow status"
            onClick={refresh}
          />
        )}
      </section>
    )
  }

  const presentation = createCanonicalEditJourneyPresentation(result.journey)
  const Icon = toneIcon[presentation.tone]
  const progress = presentation.progress
  const accent = badgeAccent(presentation.tone)
  const packageAuthority = result.journey.executionPackageAuthority
  const packageRequestIsCurrent = Boolean(
    packageAuthority &&
    executionPackageRequest?.requestedSnapshotId === packageAuthority.snapshotId,
  )
  const packageRequestResult = packageRequestIsCurrent
    ? executionPackageRequest?.result ?? null
    : null
  const packageRequesting = packageRequestIsCurrent && Boolean(
    executionPackageRequest?.requesting,
  )
  const canRequestPackage = Boolean(
    result.journey.stage === 'approved_snapshot_available' &&
    packageAuthority &&
    executionPackageRequest &&
    onRequestExecutionPackage,
  )
  const preparationAuthority = result.journey.privateEditPreparationAuthority
  const preparationIsCurrent = Boolean(
    preparationAuthority &&
    privateEditPreparation?.requestedPackageRecordId === preparationAuthority.packageRecordId,
  )
  const preparationResult = preparationIsCurrent
    ? privateEditPreparation?.result ?? null
    : null
  const preparing = preparationIsCurrent && Boolean(privateEditPreparation?.preparing)
  const canPreparePrivateEdit = Boolean(
    (
      result.journey.stage === 'execution_in_progress' ||
      result.journey.stage === 'private_review_assembly_required'
    ) &&
    preparationAuthority &&
    privateEditPreparation &&
    onPreparePrivateEdit,
  )
  const canUsePrivateReview = Boolean(
    result.journey.privateReviewMediaAuthority &&
    privateReview &&
    onLoadPrivateReview &&
    onAcceptPrivateReview &&
    onRequestPrivateReviewRevision,
  )
  const canPresentSourceLedCaptionRevision = Boolean(
    result.journey.stage === 'revision_requested' &&
    result.journey.privateReviewMediaAuthority?.mode === 'history' &&
    sourceLedCaptionRevision &&
    onPresentSourceLedCaptionRevision,
  )
  const finalDownloadAuthority = result.journey.privateFinalDownloadAuthority
  const finalDownloadIsCurrent = Boolean(
    finalDownloadAuthority &&
    privateFinalDownload?.requestedReviewAssemblyId ===
      finalDownloadAuthority.reviewAssemblyId,
  )
  const finalDownloadResult = finalDownloadIsCurrent
    ? privateFinalDownload?.result ?? null
    : null
  const downloadingFinal =
    finalDownloadIsCurrent && Boolean(privateFinalDownload?.downloading)
  const canDownloadAcceptedFinal = Boolean(
    result.journey.stage === 'private_review_accepted' &&
    finalDownloadAuthority &&
    privateFinalDownload &&
    onDownloadAcceptedFinal,
  )
  const refreshSavedWorkflow = () => {
    executionPackageRequest?.reset()
    privateEditPreparation?.reset()
    privateFinalDownload?.reset()
    privateReview?.reset()
    sourceLedCaptionRevision?.reset()
    refresh()
  }

  return (
    <section
      aria-label="Saved workflow status"
      className={`canonical-journey-status canonical-journey-status-${presentation.tone}`}
      data-journey-stage={result.journey.stage}
      data-testid="canonical-journey-status"
    >
      <div className="canonical-journey-status-icon" data-tone={presentation.tone}>
        <Icon
          aria-hidden="true"
          className={presentation.tone === 'active' && refreshing ? 'spin-icon' : undefined}
          size={18}
        />
      </div>

      <div className="canonical-journey-status-copy">
        <div className="canonical-journey-status-heading">
          <div>
            <span className="section-eyebrow">Saved workflow</span>
            <strong>{presentation.title}</strong>
          </div>
          <Badge accent={accent}>{presentation.badge}</Badge>
        </div>
        <p>{presentation.summary}</p>
        <small>{presentation.nextStep}</small>

        {progress && (
          <div
            aria-label={`${progress.completedJobCount} of ${progress.totalJobCount} preparation steps complete`}
            aria-valuemax={progress.totalJobCount}
            aria-valuemin={0}
            aria-valuenow={progress.completedJobCount}
            className="canonical-journey-progress"
            role="progressbar"
          >
            <span
              style={{ width: `${Math.min(100, Math.round((progress.completedJobCount / progress.totalJobCount) * 100))}%` }}
            />
          </div>
        )}

        <div className="canonical-journey-boundary">
          <ShieldCheck aria-hidden="true" size={14} />
          <span>{presentation.boundary}</span>
          {updatedAt && <time dateTime={updatedAt}>{formatCheckedAt(updatedAt)}</time>}
        </div>

        {canRequestPackage && (
          <div
            aria-live="polite"
            className="canonical-journey-package-action"
            data-status={packageRequesting ? 'requesting' : packageRequestResult?.status ?? 'ready'}
            data-testid={`canonical-execution-package-request-${
              packageRequesting ? 'requesting' : packageRequestResult?.status ?? 'ready'
            }`}
            role={packageRequestResult && packageRequestResult.status !== 'ready' ? 'alert' : 'status'}
          >
            <div className="canonical-journey-package-action-copy">
              <PackageCheck aria-hidden="true" size={16} />
              <div>
                <strong>{packageActionTitle(packageRequesting, packageRequestResult)}</strong>
                <p>{packageActionMessage(packageRequesting, packageRequestResult)}</p>
              </div>
            </div>
            <Button
              aria-busy={packageRequesting}
              data-testid="canonical-execution-package-request-submit"
              disabled={
                packageRequesting ||
                packageRequestResult?.status === 'ready' ||
                Boolean(packageRequestResult && !packageRequestResult.retryable)
              }
              onClick={onRequestExecutionPackage}
              size="sm"
              variant="primary"
            >
              {packageActionButtonLabel(packageRequesting, packageRequestResult)}
            </Button>
          </div>
        )}

        {canPreparePrivateEdit && (
          <div
            aria-live="polite"
            className="canonical-journey-package-action"
            data-status={preparing ? 'preparing' : preparationResult?.status ?? 'ready'}
            data-testid={`canonical-private-edit-preparation-${
              preparing ? 'preparing' : preparationResult?.status ?? 'ready'
            }`}
            role={
              preparationResult &&
              !['ready', 'in_progress'].includes(preparationResult.status)
                ? 'alert'
                : 'status'
            }
          >
            <div className="canonical-journey-package-action-copy">
              <Film aria-hidden="true" size={16} />
              <div>
                <strong>{preparationActionTitle(preparing, preparationResult)}</strong>
                <p>{preparationActionMessage(
                  preparing,
                  preparationResult,
                  result.journey.stage === 'private_review_assembly_required',
                )}</p>
              </div>
            </div>
            <Button
              aria-busy={preparing}
              data-testid="canonical-private-edit-preparation-submit"
              disabled={
                preparing ||
                preparationResult?.status === 'ready' ||
                Boolean(preparationResult && !preparationResult.retryable)
              }
              onClick={onPreparePrivateEdit}
              size="sm"
              variant="primary"
            >
              {preparationActionButtonLabel(
                preparing,
                preparationResult,
                result.journey.stage === 'private_review_assembly_required',
              )}
            </Button>
          </div>
        )}

        {canPresentSourceLedCaptionRevision &&
          sourceLedCaptionRevision &&
          onPresentSourceLedCaptionRevision && (
          <div
            aria-live="polite"
            className="canonical-journey-package-action"
            data-status={
              sourceLedCaptionRevision.presenting
                ? 'preparing'
                : sourceLedCaptionRevision.result?.status ?? 'ready'
            }
            data-testid={`canonical-source-led-caption-revision-${
              sourceLedCaptionRevision.presenting
                ? 'preparing'
                : sourceLedCaptionRevision.result?.status ?? 'ready'
            }`}
            role={
              sourceLedCaptionRevision.result &&
              sourceLedCaptionRevision.result.status !== 'ready'
                ? 'alert'
                : 'status'
            }
          >
            <div className="canonical-journey-package-action-copy">
              <MessageSquareText aria-hidden="true" size={16} />
              <div>
                <strong>
                  {sourceLedRevisionTitle(
                    sourceLedCaptionRevision.presenting,
                    sourceLedCaptionRevision.result,
                  )}
                </strong>
                <p>
                  {sourceLedRevisionMessage(
                    sourceLedCaptionRevision.presenting,
                    sourceLedCaptionRevision.result,
                  )}
                </p>
              </div>
            </div>
            <Button
              aria-busy={sourceLedCaptionRevision.presenting}
              data-testid="canonical-source-led-caption-revision-submit"
              disabled={
                sourceLedCaptionRevision.presenting ||
                sourceLedCaptionRevision.result?.status === 'ready' ||
                Boolean(
                  sourceLedCaptionRevision.result &&
                  !sourceLedCaptionRevision.result.retryable,
                )
              }
              onClick={onPresentSourceLedCaptionRevision}
              size="sm"
              variant="primary"
            >
              {sourceLedCaptionRevision.presenting
                ? 'Preparing revised plan…'
                : sourceLedCaptionRevision.result?.retryable
                  ? 'Try again'
                  : sourceLedCaptionRevision.result?.status === 'ready'
                    ? 'Revised plan ready'
                    : 'Prepare revised plan'}
            </Button>
          </div>
        )}

        {canDownloadAcceptedFinal &&
          privateFinalDownload &&
          onDownloadAcceptedFinal && (
          <div
            aria-live="polite"
            className="canonical-journey-package-action canonical-final-download-action"
            data-status={
              downloadingFinal
                ? 'downloading'
                : finalDownloadResult?.status ?? 'ready'
            }
            data-testid={`canonical-private-final-download-${
              downloadingFinal
                ? 'downloading'
                : finalDownloadResult?.status ?? 'ready'
            }`}
            role={
              finalDownloadResult &&
              finalDownloadResult.status !== 'ready'
                ? 'alert'
                : 'status'
            }
          >
            <div className="canonical-journey-package-action-copy">
              <Download aria-hidden="true" size={16} />
              <div>
                <strong>
                  {finalDownloadTitle(
                    downloadingFinal,
                    finalDownloadResult,
                  )}
                </strong>
                <p>
                  {finalDownloadMessage(
                    downloadingFinal,
                    finalDownloadResult,
                  )}
                </p>
              </div>
            </div>
            <Button
              aria-busy={downloadingFinal}
              data-testid="canonical-private-final-download-submit"
              disabled={downloadingFinal}
              icon={Download}
              onClick={onDownloadAcceptedFinal}
              size="sm"
              variant="primary"
            >
              {downloadingFinal
                ? 'Verifying final…'
                : finalDownloadResult?.retryable
                  ? 'Try download again'
                  : 'Download final MP4'}
            </Button>
          </div>
        )}

        {result.customerDelivery && (
          <CanonicalCustomerDeliveryPanel
            delivery={result.customerDelivery}
            onRefresh={refreshSavedWorkflow}
            refreshing={refreshing}
          />
        )}

        {canUsePrivateReview && privateReview && onLoadPrivateReview &&
          onAcceptPrivateReview && onRequestPrivateReviewRevision && (
          <CanonicalPrivateReviewPanel
            journey={result.journey}
            onAccept={onAcceptPrivateReview}
            onLoad={onLoadPrivateReview}
            onRequestRevision={onRequestPrivateReviewRevision}
            revisionMode="source_led_caption"
            revisionPresentationBusy={
              sourceLedCaptionRevision?.presenting ?? false
            }
            review={privateReview}
          />
        )}
      </div>

      <IconButton
        disabled={refreshing}
        icon={RefreshCw}
        label="Refresh saved workflow status"
        onClick={refreshSavedWorkflow}
      />
    </section>
  )
}

function sourceLedRevisionTitle(
  presenting: boolean,
  result: CanonicalSourceLedCaptionRevisionHookResult['result'],
): string {
  if (presenting) return 'Building the revised plan'
  if (result?.status === 'ready') return 'Revised plan ready'
  if (result) return 'Revised plan needs attention'
  return 'Prepare the exact caption revision'
}

function sourceLedRevisionMessage(
  presenting: boolean,
  result: CanonicalSourceLedCaptionRevisionHookResult['result'],
): string {
  if (presenting) {
    return 'The backend is rereading the saved caption decision, immutable prior edit, source media, Edit Preferences, and Edit Brief.'
  }
  if (result) return result.message
  return 'Build the next plan and fresh estimate from the saved caption replacement. The browser cannot submit a plan, timing map, or estimate.'
}

function finalDownloadTitle(
  downloading: boolean,
  result: CanonicalPrivateFinalDownloadHookResult['result'],
): string {
  if (downloading) return 'Verifying the accepted final'
  if (result?.status === 'ready') return 'Verified final downloaded'
  if (result) return 'Final download needs attention'
  return 'Accepted final is ready'
}

function finalDownloadMessage(
  downloading: boolean,
  result: CanonicalPrivateFinalDownloadHookResult['result'],
): string {
  if (downloading) {
    return 'WeEditPro is matching the accepted decision, QA-backed artifact, MP4 bytes, and exact SHA-256 before download.'
  }
  if (result?.status === 'ready') {
    return `${result.message} ${formatBytes(result.download.byteSize)} verified.`
  }
  if (result) return result.message
  return 'Download the exact accepted private MP4. No public or signed link is created.'
}

function preparationActionTitle(
  preparing: boolean,
  result: CanonicalPrivateEditPreparationHookResult['result'],
): string {
  if (preparing) return 'Preparing the private review'
  if (result?.status === 'ready') return 'Private review ready'
  if (result?.status === 'in_progress') return 'Private edit is running'
  if (result?.status === 'blocked') return 'Private preparation is paused'
  if (result) return 'Private preparation needs attention'
  return 'Approved edit ready to prepare'
}

function preparationActionMessage(
  preparing: boolean,
  result: CanonicalPrivateEditPreparationHookResult['result'],
  assembling: boolean,
): string {
  if (preparing) {
    return 'Running only the approved private steps from the exact approved plan. Saved progress can be recovered if you leave and return.'
  }
  if (result) return result.message
  if (assembling) {
    return 'Required private steps passed. Finish assembling the exact review version while publishing and billing stay off.'
  }
  return 'Start the approved private edit process. External generation, public delivery, production rendering, and customer charges stay off.'
}

function preparationActionButtonLabel(
  preparing: boolean,
  result: CanonicalPrivateEditPreparationHookResult['result'],
  assembling: boolean,
): string {
  if (preparing) return 'Preparing review…'
  if (result?.status === 'ready') return 'Review ready'
  if (result?.status === 'in_progress') return 'Check progress'
  if (result?.retryable) return 'Try again'
  if (result) return 'Refresh required'
  return assembling ? 'Assemble private review' : 'Start private edit'
}

function packageActionTitle(
  requesting: boolean,
  result: CanonicalExecutionPackageRequestHookResult['result'],
): string {
  if (requesting) return 'Preparing the approved handoff'
  if (result?.status === 'ready') return 'Private handoff ready'
  if (result) return 'Private handoff needs attention'
  return 'Ready for private preparation'
}

function packageActionMessage(
  requesting: boolean,
  result: CanonicalExecutionPackageRequestHookResult['result'],
): string {
  if (requesting) {
    return 'Matching the exact approved version. Editing tools and rendering remain stopped.'
  }
  if (result) return result.message
  return 'Create the immutable private handoff first. This does not run editing tools, render, bill, or publish.'
}

function packageActionButtonLabel(
  requesting: boolean,
  result: CanonicalExecutionPackageRequestHookResult['result'],
): string {
  if (requesting) return 'Preparing handoff…'
  if (result?.status === 'ready') return 'Handoff ready'
  if (result?.retryable) return 'Try again'
  if (result) return 'Refresh required'
  return 'Prepare private handoff'
}

function badgeAccent(tone: CanonicalEditJourneyTone): 'muted' | 'cyan' | 'warning' | 'success' {
  if (tone === 'active') return 'cyan'
  if (tone === 'attention') return 'warning'
  if (tone === 'success') return 'success'
  return 'muted'
}

function failureTitle(status: Exclude<CanonicalEditJourneyHookResult['result'], null>['status']): string {
  if (status === 'not_found') return 'Saved workflow not found'
  if (status === 'access_denied') return 'Saved workflow unavailable'
  if (status === 'invalid_response') return 'Saved workflow needs verification'
  return 'Saved workflow could not refresh'
}

function formatCheckedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Status checked'
  return `Checked ${new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)}`
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}
