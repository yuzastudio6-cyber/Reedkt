import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Film,
  Loader2,
  MessageSquareText,
  PlayCircle,
  RefreshCw,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import type {
  ProfessionalLongFormCustomerDeliveryBrowserReview,
  ProfessionalLongFormCustomerDeliveryBrowserWatch,
} from '../../backend/api/professional-long-form-customer-delivery-browser-contracts'
import {
  inspectProfessionalLongFormCustomerDeliveryQualityReview,
  recordProfessionalLongFormCustomerDeliveryQualityDecision,
  recordProfessionalLongFormCustomerDeliveryWatchCheckpoint,
  type ProfessionalLongFormCustomerDeliveryClientInput,
  type ProfessionalLongFormCustomerDeliveryDiscoveryClientResult,
  type ProfessionalLongFormCustomerDeliveryRevisionReasonCode,
} from '../../lib/professional-long-form-customer-delivery-client'
import {
  attachProfessionalLongFormCustomerDeliveryMediaSource,
  type ProfessionalLongFormCustomerDeliveryMediaSourceController,
  type ProfessionalLongFormCustomerDeliveryMediaSourceState,
  type ProfessionalLongFormCustomerDeliveryPlaybackCoverage,
} from '../../lib/professional-long-form-customer-delivery-media-source'

type CanonicalCustomerDeliveryPanelProps = {
  delivery: ProfessionalLongFormCustomerDeliveryDiscoveryClientResult
  onRefresh: () => void
  refreshing: boolean
}

type PanelNotice = {
  message: string
  retryable: boolean
  tone: 'attention' | 'success'
}

type DecisionMode = 'accept' | 'revise' | null

type AcceptanceChecks = {
  video: boolean
  audio: boolean
  qaItems: boolean
  intent: boolean
  privateOnly: boolean
}

const emptyAcceptanceChecks: AcceptanceChecks = {
  video: false,
  audio: false,
  qaItems: false,
  intent: false,
  privateOnly: false,
}

const revisionReasonOptions: Array<{
  value: ProfessionalLongFormCustomerDeliveryRevisionReasonCode
  label: string
}> = [
  { value: 'video_quality', label: 'Picture quality' },
  { value: 'audio_quality', label: 'Audio quality' },
  { value: 'av_sync', label: 'Audio and video sync' },
  { value: 'speech_clarity', label: 'Speech clarity' },
  { value: 'approved_intent_mismatch', label: 'Does not match the approved edit' },
  { value: 'other_quality_issue', label: 'Another quality issue' },
]

export function CanonicalCustomerDeliveryPanel({
  delivery,
  onRefresh,
  refreshing,
}: CanonicalCustomerDeliveryPanelProps) {
  if (delivery.status !== 'ready') {
    return (
      <section
        aria-label="Customer delivery"
        className="canonical-customer-delivery"
        data-stage={delivery.status}
        data-testid={`canonical-customer-delivery-${delivery.status.replace('_', '-')}`}
      >
        <DeliveryHeading
          badge="Private"
          icon={AlertTriangle}
          title="Delivery review needs attention"
          tone="attention"
        />
        <p className="canonical-customer-delivery-summary">{delivery.message}</p>
        <p className="canonical-customer-delivery-boundary">
          No public delivery, additional charge, or new edit has started.
        </p>
        {delivery.retryable && (
          <Button
            aria-busy={refreshing}
            disabled={refreshing}
            icon={RefreshCw}
            onClick={onRefresh}
            size="sm"
            variant="secondary"
          >
            {refreshing ? 'Refreshing…' : 'Refresh delivery'}
          </Button>
        )}
      </section>
    )
  }

  const { authority, discovery } = delivery

  if (discovery.stage === 'customer_delivery_quality_review_ready' &&
    discovery.review) {
    return (
      <CustomerDeliveryQualityReview
        authority={authority}
        discoveryReview={discovery.review}
        key={[
          discovery.identity.packageRecordId,
          discovery.review.authority.reviewPacketHash,
        ].join(':')}
        onRefresh={onRefresh}
      />
    )
  }

  const isProcessing =
    discovery.stage === 'customer_delivery_processing'
  const isAccepted = discovery.stage === 'customer_delivery_accepted'
  const isRevision =
    discovery.stage === 'customer_delivery_revision_requested'
  const isAttention =
    discovery.stage === 'customer_delivery_attention_required'

  return (
    <section
      aria-label="Customer delivery"
      className="canonical-customer-delivery"
      data-stage={discovery.stage}
      data-testid={`canonical-customer-delivery-${discovery.stage.replaceAll('_', '-')}`}
    >
      <DeliveryHeading
        badge={isAccepted
          ? 'Accepted'
          : isRevision
            ? 'Changes requested'
            : isProcessing
              ? `${discovery.progress.completionPercent}%`
              : 'Attention'}
        icon={isAccepted
          ? CheckCircle2
          : isRevision
            ? MessageSquareText
            : isProcessing
              ? Clock3
              : AlertTriangle}
        title={isAccepted
          ? 'Your exact private delivery is accepted'
          : isRevision
            ? 'Your revision request is saved'
            : isProcessing
              ? 'Preparing your private delivery'
              : 'Delivery processing needs attention'}
        tone={isAccepted ? 'success' : isAttention ? 'attention' : 'active'}
      />

      <p className="canonical-customer-delivery-summary">{delivery.message}</p>

      {isProcessing && (
        <div className="canonical-customer-delivery-progress">
          <div
            aria-label={`${discovery.progress.completedJobCount} of ${discovery.progress.totalJobCount} private delivery steps complete`}
            aria-valuemax={discovery.progress.totalJobCount}
            aria-valuemin={0}
            aria-valuenow={discovery.progress.completedJobCount}
            className="canonical-journey-progress"
            role="progressbar"
          >
            <span style={{
              width: `${discovery.progress.completionPercent}%`,
            }} />
          </div>
          <small>
            {discovery.progress.completedJobCount} of{' '}
            {discovery.progress.totalJobCount} private steps complete
          </small>
        </div>
      )}

      <div className="canonical-customer-delivery-state-copy">
        {isAccepted && (
          <>
            <strong>Authenticated private download ready</strong>
            <p>
              This exact master is covered by the original approved estimate.
              ReEditPro has not created a public link or a second charge.
            </p>
          </>
        )}
        {isRevision && (
          <>
            <strong>A fresh approval is required</strong>
            <p>
              ReEditPro must create a new plan and estimate before doing more
              editing. The prior approval is not reused for the revision.
            </p>
          </>
        )}
        {isAttention && (
          <>
            <strong>No unsafe fallback started</strong>
            <p>
              Refresh the saved delivery state after the private recovery path
              has been reviewed.
            </p>
          </>
        )}
      </div>

      <p className="canonical-customer-delivery-boundary">
        Private, signed-in workspace only · Public delivery remains off
      </p>

      {(isAttention || isRevision || isAccepted) && (
        <Button
          aria-busy={refreshing}
          disabled={refreshing}
          icon={RefreshCw}
          onClick={onRefresh}
          size="sm"
          variant="secondary"
        >
          {refreshing ? 'Refreshing…' : 'Refresh saved delivery'}
        </Button>
      )}
    </section>
  )
}

function CustomerDeliveryQualityReview({
  authority,
  discoveryReview,
  onRefresh,
}: {
  authority: ProfessionalLongFormCustomerDeliveryClientInput
  discoveryReview: ProfessionalLongFormCustomerDeliveryBrowserReview
  onRefresh: () => void
}) {
  const [review, setReview] =
    useState<ProfessionalLongFormCustomerDeliveryBrowserReview | null>(null)
  const [loadingReview, setLoadingReview] = useState(false)
  const [reviewNotice, setReviewNotice] = useState<PanelNotice | null>(null)
  const [playback, setPlayback] = useState<{
    message: string
    status: 'idle' | 'attaching' | 'ready' | 'failed'
  }>({
    message: 'Load the exact private master when you are ready to review it.',
    status: 'idle',
  })
  const [streamState, setStreamState] =
    useState<ProfessionalLongFormCustomerDeliveryMediaSourceState | null>(null)
  const [localCoverage, setLocalCoverage] =
    useState<ProfessionalLongFormCustomerDeliveryPlaybackCoverage | null>(null)
  const [savingWatch, setSavingWatch] = useState(false)
  const [watchNotice, setWatchNotice] = useState<PanelNotice | null>(null)
  const [attachmentAttempt, setAttachmentAttempt] = useState(0)
  const [decisionMode, setDecisionMode] = useState<DecisionMode>(null)
  const [acceptanceChecks, setAcceptanceChecks] =
    useState<AcceptanceChecks>(emptyAcceptanceChecks)
  const [speechDisposition, setSpeechDisposition] = useState<
    | 'manual_full_program_speech_review_accepted'
    | 'no_speech_expected_under_approved_snapshot'
    | null
  >(null)
  const [revisionReasons, setRevisionReasons] = useState<
    ProfessionalLongFormCustomerDeliveryRevisionReasonCode[]
  >([])
  const [recordingDecision, setRecordingDecision] = useState(false)
  const [decisionNotice, setDecisionNotice] = useState<PanelNotice | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controllerRef =
    useRef<ProfessionalLongFormCustomerDeliveryMediaSourceController | null>(
      null,
    )
  const reviewRef = useRef(review)
  const mountedRef = useRef(true)
  const savingWatchRef = useRef(false)
  const lastSubmittedCoverageRef = useRef('')

  useEffect(() => () => {
    mountedRef.current = false
  }, [])

  const commitReview = useCallback((
    next: ProfessionalLongFormCustomerDeliveryBrowserReview,
  ) => {
    reviewRef.current = next
    if (mountedRef.current) setReview(next)
  }, [])

  const saveWatchProgress = useCallback(async (
    overrideIntervals?: ProfessionalLongFormCustomerDeliveryPlaybackCoverage[
      'intervals'
    ],
  ): Promise<boolean> => {
    const currentReview = reviewRef.current
    const currentController = controllerRef.current
    if (
      savingWatchRef.current ||
      !currentReview ||
      currentReview.decision ||
      (!currentController && !overrideIntervals)
    ) return false

    const intervals = overrideIntervals ??
      currentController?.getCoverage().intervals ??
      []
    if (intervals.length === 0) {
      if (mountedRef.current) {
        setWatchNotice({
          message: 'Play part of the private master before saving review progress.',
          retryable: false,
          tone: 'attention',
        })
      }
      return false
    }

    const coverageSignature = JSON.stringify(intervals)
    if (coverageSignature === lastSubmittedCoverageRef.current) return true

    savingWatchRef.current = true
    if (mountedRef.current) {
      setSavingWatch(true)
      setWatchNotice(null)
    }
    try {
      const result =
        await recordProfessionalLongFormCustomerDeliveryWatchCheckpoint({
          ...authority,
          review: currentReview,
          coveredIntervals: intervals,
        })
      if (result.status !== 'recorded') {
        if (mountedRef.current) {
          setWatchNotice({
            message: result.message,
            retryable: result.retryable,
            tone: 'attention',
          })
        }
        return false
      }
      lastSubmittedCoverageRef.current = coverageSignature
      const nextReview = applyWatchReceipt(currentReview, result.watch)
      commitReview(nextReview)
      if (mountedRef.current) {
        setWatchNotice({
          message: result.message,
          retryable: false,
          tone: 'success',
        })
      }
      return true
    } catch {
      if (mountedRef.current) {
        setWatchNotice({
          message: 'Playback progress could not be saved to the private review.',
          retryable: true,
          tone: 'attention',
        })
      }
      return false
    } finally {
      savingWatchRef.current = false
      if (mountedRef.current) setSavingWatch(false)
    }
  }, [authority, commitReview])

  const playbackReviewKey = review
    ? [
        review.authority.reviewPacketHash,
        review.authority.masterSha256,
      ].join(':')
    : ''

  useEffect(() => {
    if (!playbackReviewKey) return
    const playbackReview = reviewRef.current
    if (!playbackReview) return
    const mediaElement = videoRef.current
    if (!mediaElement) return

    let active = true
    let attachedController:
      ProfessionalLongFormCustomerDeliveryMediaSourceController | null = null
    setPlayback({
      message: 'Opening authenticated no-store playback…',
      status: 'attaching',
    })
    setStreamState(null)
    setLocalCoverage(null)

    void attachProfessionalLongFormCustomerDeliveryMediaSource({
      authority,
      review: playbackReview,
      mediaElement,
      onStateChange: (state) => {
        if (!active || !mountedRef.current) return
        setStreamState(state)
        if (state.status === 'failed') {
          setPlayback({
            message: state.failureMessage ??
              'Private playback stopped unexpectedly.',
            status: 'failed',
          })
        }
      },
    }).then(async (result) => {
      if (!active) {
        if (result.status === 'attached') result.controller.dispose()
        return
      }
      if (result.status !== 'attached') {
        setPlayback({ message: result.message, status: 'failed' })
        return
      }
      attachedController = result.controller
      controllerRef.current = result.controller
      const currentReview = reviewRef.current
      const initialCheckpointSaved = currentReview?.watch.status ===
        'not_started'
        ? await saveWatchProgress([{
            startFrame: 0,
            endFrameExclusive: 1,
          }])
        : true
      if (!active) return
      if (!initialCheckpointSaved) {
        setPlayback({
          message:
            'Private playback is paused until its initial durable checkpoint can be saved.',
          status: 'failed',
        })
        return
      }
      setPlayback({
        message:
          'Authenticated playback is ready. Watch the complete program, then save progress before deciding.',
        status: 'ready',
      })
    }).catch(() => {
      if (!active) return
      setPlayback({
        message: 'The authenticated private playback session could not open.',
        status: 'failed',
      })
    })

    return () => {
      active = false
      if (controllerRef.current === attachedController) {
        controllerRef.current = null
      }
      attachedController?.dispose()
    }
  }, [
    attachmentAttempt,
    authority,
    playbackReviewKey,
    saveWatchProgress,
  ])

  const loadReview = async () => {
    setLoadingReview(true)
    setReviewNotice(null)
    setDecisionNotice(null)
    try {
      const result =
        await inspectProfessionalLongFormCustomerDeliveryQualityReview(
          authority,
        )
      if (result.status !== 'ready') {
        setReviewNotice({
          message: result.message,
          retryable: result.retryable,
          tone: 'attention',
        })
        return
      }
      commitReview(result.review)
      setReviewNotice({
        message: result.message,
        retryable: false,
        tone: 'success',
      })
    } catch {
      setReviewNotice({
        message: 'The exact private quality review could not be loaded.',
        retryable: true,
        tone: 'attention',
      })
    } finally {
      if (mountedRef.current) setLoadingReview(false)
    }
  }

  const updateLocalCoverage = () => {
    const coverage = controllerRef.current?.getCoverage()
    if (coverage) setLocalCoverage(coverage)
  }

  const saveCurrentProgress = () => {
    updateLocalCoverage()
    void saveWatchProgress()
  }

  const toggleRevisionReason = (
    reason: ProfessionalLongFormCustomerDeliveryRevisionReasonCode,
  ) => {
    setRevisionReasons((current) => current.includes(reason)
      ? current.filter((value) => value !== reason)
      : [...current, reason])
  }

  const acceptanceReady =
    Object.values(acceptanceChecks).every(Boolean) &&
    speechDisposition !== null
  const decisionRecorded = decisionNotice?.tone === 'success'
  const canSubmitDecision = Boolean(
    review &&
    decisionMode &&
    !recordingDecision &&
    !decisionRecorded &&
    (
      decisionMode === 'accept'
        ? review.watch.acceptanceGateSatisfied && acceptanceReady
        : revisionReasons.length > 0
    ),
  )

  const recordDecision = async () => {
    const currentReview = reviewRef.current
    if (!currentReview || !decisionMode || !canSubmitDecision) return
    setRecordingDecision(true)
    setDecisionNotice(null)
    try {
      const result = decisionMode === 'accept'
        ? await recordProfessionalLongFormCustomerDeliveryQualityDecision({
            ...authority,
            review: currentReview,
            decision: 'accept_exact_private_customer_delivery',
            attestation: {
              entirePrivateMasterPlaybackReviewed: true,
              exactVideoQualityAccepted: true,
              exactAudioQualityAndSyncAccepted: true,
              knownQaReviewItemsAccepted: true,
              approvedIntentSatisfied: true,
              speechIntelligibilityDisposition: speechDisposition!,
              noPublicDeliveryRequested: true,
            },
          })
        : await recordProfessionalLongFormCustomerDeliveryQualityDecision({
            ...authority,
            review: currentReview,
            decision: 'request_customer_delivery_revision',
            revisionReasonCodes: revisionReasons,
          })
      if (result.status !== 'recorded') {
        setDecisionNotice({
          message: result.message,
          retryable: result.retryable,
          tone: 'attention',
        })
        return
      }
      setDecisionNotice({
        message: result.message,
        retryable: false,
        tone: 'success',
      })
      onRefresh()
    } catch {
      setDecisionNotice({
        message: 'Your delivery decision could not be saved.',
        retryable: true,
        tone: 'attention',
      })
    } finally {
      if (mountedRef.current) setRecordingDecision(false)
    }
  }

  const durableCoverage = review?.watch.coveragePermille ??
    discoveryReview.watch.coveragePermille
  const observedCoverage = localCoverage?.coveragePermille ?? 0
  const playbackReady = playback.status === 'ready'

  return (
    <section
      aria-label="Customer delivery quality review"
      className="canonical-customer-delivery canonical-customer-delivery-review"
      data-stage="customer_delivery_quality_review_ready"
      data-testid="canonical-customer-delivery-quality-review"
    >
      <DeliveryHeading
        badge="No public link"
        icon={ShieldCheck}
        title="Review your exact private delivery"
        tone="active"
      />
      <p className="canonical-customer-delivery-summary">
        Watch the entire master in this signed-in workspace. Acceptance stays
        locked until ReEditPro saves whole-program playback evidence.
      </p>

      {!review ? (
        <div
          aria-live="polite"
          className="canonical-customer-delivery-load"
          data-status={reviewNotice?.tone ?? 'ready'}
          role={reviewNotice?.tone === 'attention' ? 'alert' : 'status'}
        >
          <div>
            {loadingReview
              ? <Loader2 aria-hidden="true" className="spin-icon" size={18} />
              : <PlayCircle aria-hidden="true" size={18} />}
            <div>
              <strong>
                {loadingReview
                  ? 'Verifying the exact private master'
                  : 'Authenticated playback is ready to load'}
              </strong>
              <p>
                {reviewNotice?.message ??
                  'Media is read in bounded no-store ranges. ReEditPro does not create a public or signed URL.'}
              </p>
            </div>
          </div>
          <Button
            aria-busy={loadingReview}
            data-testid="canonical-customer-delivery-load-review"
            disabled={
              loadingReview ||
              Boolean(reviewNotice && !reviewNotice.retryable)
            }
            icon={PlayCircle}
            onClick={() => void loadReview()}
            size="sm"
            variant="primary"
          >
            {loadingReview
              ? 'Loading review…'
              : reviewNotice?.retryable
                ? 'Try again'
                : 'Load secure review'}
          </Button>
        </div>
      ) : (
        <>
          <div className="canonical-customer-delivery-player">
            <video
              aria-disabled={!playbackReady}
              aria-label="ReeditPro authenticated customer delivery review"
              controls={playbackReady}
              data-testid="canonical-customer-delivery-video"
              onEnded={saveCurrentProgress}
              onPause={saveCurrentProgress}
              onTimeUpdate={updateLocalCoverage}
              playsInline
              preload="metadata"
              ref={videoRef}
            />
            <div
              aria-live="polite"
              className="canonical-customer-delivery-playback-status"
              data-status={playback.status}
              role={playback.status === 'failed' ? 'alert' : 'status'}
            >
              {playback.status === 'attaching'
                ? <Loader2 aria-hidden="true" className="spin-icon" size={16} />
                : playback.status === 'failed'
                  ? <AlertTriangle aria-hidden="true" size={16} />
                  : <ShieldCheck aria-hidden="true" size={16} />}
              <span>{playback.message}</span>
              {playback.status === 'failed' && (
                <Button
                  onClick={() => setAttachmentAttempt((value) => value + 1)}
                  size="sm"
                  variant="secondary"
                >
                  Retry playback
                </Button>
              )}
            </div>
          </div>

          <div className="canonical-customer-delivery-watch">
            <div className="canonical-customer-delivery-watch-heading">
              <div>
                <span className="section-eyebrow">Review progress</span>
                <strong>
                  {review.watch.acceptanceGateSatisfied
                    ? 'Complete program review saved'
                    : `${formatPermille(durableCoverage)} saved`}
                </strong>
              </div>
              <Badge accent={review.watch.acceptanceGateSatisfied
                ? 'success'
                : 'muted'}
              >
                {review.watch.acceptanceGateSatisfied
                  ? 'Decision unlocked'
                  : 'Acceptance locked'}
              </Badge>
            </div>
            <div
              aria-label={`${formatPermille(durableCoverage)} of the private master saved as reviewed`}
              aria-valuemax={1_000}
              aria-valuemin={0}
              aria-valuenow={durableCoverage}
              className="canonical-customer-delivery-watch-progress"
              role="progressbar"
            >
              <span style={{ width: `${durableCoverage / 10}%` }} />
            </div>
            <div className="canonical-customer-delivery-watch-meta">
              <span>Observed in this session: {formatPermille(observedCoverage)}</span>
              <span>
                Stream: {streamLabel(streamState)}
              </span>
              <span>
                Runtime: {formatDuration(review.authority.masterFrameCount / 30)}
              </span>
            </div>
            <Button
              aria-busy={savingWatch}
              data-testid="canonical-customer-delivery-save-progress"
              disabled={!playbackReady || savingWatch}
              icon={Save}
              onClick={saveCurrentProgress}
              size="sm"
              variant="secondary"
            >
              {savingWatch ? 'Saving progress…' : 'Save review progress'}
            </Button>
            {watchNotice && (
              <div
                aria-live="polite"
                className="canonical-customer-delivery-notice"
                data-tone={watchNotice.tone}
                role={watchNotice.tone === 'attention' ? 'alert' : 'status'}
              >
                {watchNotice.tone === 'success'
                  ? <CheckCircle2 aria-hidden="true" size={16} />
                  : <AlertTriangle aria-hidden="true" size={16} />}
                <span>{watchNotice.message}</span>
              </div>
            )}
          </div>

          <div className="canonical-customer-delivery-review-items">
            <span className="section-eyebrow">Review the complete master</span>
            <ul>
              {review.reviewItems.map((item) => (
                <li key={item.itemId}>
                  <CheckCircle2 aria-hidden="true" size={15} />
                  <span>{reviewItemLabel(item.category)}</span>
                </li>
              ))}
            </ul>
          </div>

          <form
            className="canonical-customer-delivery-decision"
            onSubmit={(event) => {
              event.preventDefault()
              void recordDecision()
            }}
          >
            <fieldset disabled={recordingDecision || decisionRecorded}>
              <legend>Your delivery decision</legend>
              <p>
                Choose one outcome. Requesting changes always requires a fresh
                plan, estimate, and approval.
              </p>
              <div className="canonical-customer-delivery-decision-modes">
                <label>
                  <input
                    checked={decisionMode === 'accept'}
                    disabled={!review.watch.acceptanceGateSatisfied}
                    name="customer-delivery-decision"
                    onChange={() => setDecisionMode('accept')}
                    type="radio"
                  />
                  <span>
                    <strong>Accept this exact delivery</strong>
                    <small>
                      {review.watch.acceptanceGateSatisfied
                        ? 'Complete the quality attestations below.'
                        : 'Available after the complete watch is saved.'}
                    </small>
                  </span>
                </label>
                <label>
                  <input
                    checked={decisionMode === 'revise'}
                    name="customer-delivery-decision"
                    onChange={() => setDecisionMode('revise')}
                    type="radio"
                  />
                  <span>
                    <strong>Request changes</strong>
                    <small>Return to a fresh plan and approval.</small>
                  </span>
                </label>
              </div>

              {decisionMode === 'accept' && (
                <div className="canonical-customer-delivery-attestations">
                  <span className="section-eyebrow">Confirm your review</span>
                  <CheckOption
                    checked={acceptanceChecks.video}
                    label="I reviewed the exact video quality."
                    onChange={(checked) => setAcceptanceChecks((current) => ({
                      ...current,
                      video: checked,
                    }))}
                  />
                  <CheckOption
                    checked={acceptanceChecks.audio}
                    label="I reviewed audio quality and audio/video sync."
                    onChange={(checked) => setAcceptanceChecks((current) => ({
                      ...current,
                      audio: checked,
                    }))}
                  />
                  <CheckOption
                    checked={acceptanceChecks.qaItems}
                    label="I accept the known quality-review items shown above."
                    onChange={(checked) => setAcceptanceChecks((current) => ({
                      ...current,
                      qaItems: checked,
                    }))}
                  />
                  <CheckOption
                    checked={acceptanceChecks.intent}
                    label="This delivery satisfies the approved editing intent."
                    onChange={(checked) => setAcceptanceChecks((current) => ({
                      ...current,
                      intent: checked,
                    }))}
                  />
                  <CheckOption
                    checked={acceptanceChecks.privateOnly}
                    label="I am accepting the private master, not requesting public delivery."
                    onChange={(checked) => setAcceptanceChecks((current) => ({
                      ...current,
                      privateOnly: checked,
                    }))}
                  />
                  <fieldset className="canonical-customer-delivery-speech">
                    <legend>Speech review</legend>
                    <label>
                      <input
                        checked={speechDisposition ===
                          'manual_full_program_speech_review_accepted'}
                        name="customer-delivery-speech"
                        onChange={() => setSpeechDisposition(
                          'manual_full_program_speech_review_accepted',
                        )}
                        type="radio"
                      />
                      <span>I reviewed speech intelligibility throughout.</span>
                    </label>
                    <label>
                      <input
                        checked={speechDisposition ===
                          'no_speech_expected_under_approved_snapshot'}
                        name="customer-delivery-speech"
                        onChange={() => setSpeechDisposition(
                          'no_speech_expected_under_approved_snapshot',
                        )}
                        type="radio"
                      />
                      <span>No speech is expected in the approved edit.</span>
                    </label>
                  </fieldset>
                </div>
              )}

              {decisionMode === 'revise' && (
                <div className="canonical-customer-delivery-reasons">
                  <span className="section-eyebrow">
                    What needs attention?
                  </span>
                  {revisionReasonOptions.map((option) => (
                    <CheckOption
                      checked={revisionReasons.includes(option.value)}
                      key={option.value}
                      label={option.label}
                      onChange={() => toggleRevisionReason(option.value)}
                    />
                  ))}
                </div>
              )}
            </fieldset>

            <Button
              aria-busy={recordingDecision}
              data-testid="canonical-customer-delivery-submit-decision"
              disabled={!canSubmitDecision}
              icon={decisionMode === 'revise'
                ? MessageSquareText
                : CheckCircle2}
              size="sm"
              type="submit"
              variant={decisionMode === 'revise' ? 'secondary' : 'primary'}
            >
              {recordingDecision
                ? 'Saving decision…'
                : decisionMode === 'revise'
                  ? 'Request these changes'
                  : decisionMode === 'accept'
                    ? 'Accept exact private delivery'
                    : 'Choose an outcome'}
            </Button>

            {decisionNotice && (
              <div
                aria-live="polite"
                className="canonical-customer-delivery-notice"
                data-tone={decisionNotice.tone}
                role={decisionNotice.tone === 'attention' ? 'alert' : 'status'}
              >
                {decisionNotice.tone === 'success'
                  ? <CheckCircle2 aria-hidden="true" size={16} />
                  : <AlertTriangle aria-hidden="true" size={16} />}
                <span>{decisionNotice.message}</span>
              </div>
            )}
          </form>
        </>
      )}

      <p className="canonical-customer-delivery-boundary">
        Exact approved master · Authenticated no-store ranges · No public URL
      </p>
    </section>
  )
}

function DeliveryHeading({
  badge,
  icon: Icon,
  title,
  tone,
}: {
  badge: string
  icon: typeof Film
  title: string
  tone: 'active' | 'attention' | 'success'
}) {
  return (
    <div className="canonical-customer-delivery-heading">
      <div className="canonical-customer-delivery-title">
        <span className="canonical-customer-delivery-icon" data-tone={tone}>
          <Icon aria-hidden="true" size={18} />
        </span>
        <div>
          <span className="section-eyebrow">Customer delivery</span>
          <strong>{title}</strong>
        </div>
      </div>
      <Badge accent={tone === 'success'
        ? 'success'
        : tone === 'attention'
          ? 'warning'
          : 'cyan'}
      >
        {badge}
      </Badge>
    </div>
  )
}

function CheckOption({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="canonical-customer-delivery-check">
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  )
}

function applyWatchReceipt(
  review: ProfessionalLongFormCustomerDeliveryBrowserReview,
  receipt: ProfessionalLongFormCustomerDeliveryBrowserWatch,
): ProfessionalLongFormCustomerDeliveryBrowserReview {
  return {
    ...review,
    watch: receipt.watch,
    readiness: {
      ...review.readiness,
      durableWholeProgramWatchEvidenceReady:
        receipt.watch.acceptanceGateSatisfied,
    },
  }
}

function reviewItemLabel(
  category:
    ProfessionalLongFormCustomerDeliveryBrowserReview['reviewItems'][number][
      'category'
    ],
): string {
  if (category === 'decoded_video_integrity') {
    return 'Watch picture quality from beginning to end.'
  }
  if (category === 'decoded_audio_quality_sync') {
    return 'Listen for audio quality and audio/video sync.'
  }
  return 'Confirm speech is intelligible, or that no speech is expected.'
}

function streamLabel(
  state: ProfessionalLongFormCustomerDeliveryMediaSourceState | null,
): string {
  if (!state) return 'Not started'
  if (state.status === 'stream_complete') return 'Buffered securely'
  if (state.status === 'streaming') {
    const percent = state.totalByteSize > 0
      ? Math.floor((state.bytesAppended * 100) / state.totalByteSize)
      : 0
    return `${percent}% buffered`
  }
  if (state.status === 'buffering') return 'Opening'
  if (state.status === 'failed') return 'Needs attention'
  return 'Closed'
}

function formatPermille(value: number): string {
  return `${(value / 10).toFixed(value % 10 === 0 ? 0 : 1)}%`
}

function formatDuration(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds))
  const hours = Math.floor(rounded / 3_600)
  const minutes = Math.floor((rounded % 3_600) / 60)
  const remainder = rounded % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}
