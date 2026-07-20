import assert from 'node:assert/strict'

import {
  attachProfessionalLongFormCustomerDeliveryMediaSource,
  createProfessionalLongFormCustomerDeliveryCoverageTracker,
  PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MEDIA_SOURCE_MIME,
} from '../../src/lib/professional-long-form-customer-delivery-media-source'
import type {
  ProfessionalLongFormCustomerDeliveryClientInput,
} from '../../src/lib/professional-long-form-customer-delivery-client'

class FakeMediaElement extends EventTarget {
  src = ''
  currentTime = 0
  playbackRate = 1
  paused = true
  ended = false
  load(): void {}
}

class FakeSourceBuffer extends EventTarget {
  updating = false
  mode = 'segments'
  appended: Uint8Array[] = []
  removed: Array<{ start: number; end: number }> = []
  bufferedStart = 0
  bufferedEnd = 121
  buffered = {
    length: 1,
    start: () => this.bufferedStart,
    end: () => this.bufferedEnd,
  }

  appendBuffer(bytes: ArrayBuffer): void {
    this.updating = true
    this.appended.push(new Uint8Array(bytes))
    queueMicrotask(() => {
      this.updating = false
      this.dispatchEvent(new Event('updateend'))
    })
  }

  remove(start: number, end: number): void {
    this.updating = true
    this.removed.push({ start, end })
    this.bufferedStart = end
    queueMicrotask(() => {
      this.updating = false
      this.dispatchEvent(new Event('updateend'))
    })
  }
}

class FakeMediaSource extends EventTarget {
  readyState = 'closed'
  sourceBuffer = new FakeSourceBuffer()

  open(): void {
    this.readyState = 'open'
    this.dispatchEvent(new Event('sourceopen'))
  }

  addSourceBuffer(mimeType: string): FakeSourceBuffer {
    assert.equal(
      mimeType,
      PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MEDIA_SOURCE_MIME,
    )
    return this.sourceBuffer
  }

  endOfStream(): void {
    assert.equal(this.readyState, 'open')
    this.readyState = 'ended'
  }
}

const identity = {
  workspaceId: 'workspace-media-source-smoke',
  projectId: 'project-media-source-smoke',
  editSessionId: 'edit-media-source-smoke',
  approvedPlanSnapshotId: 'snapshot-media-source-smoke',
  packageRecordId: 'delivery-package-media-source-smoke',
}
const masterSha256 = 'a'.repeat(64)
const reviewPacketHash = 'b'.repeat(64)
const mediaBytes = new Uint8Array((8 * 1024 * 1024 * 2) + 123)
mediaBytes.fill(0x5a)
const authority: ProfessionalLongFormCustomerDeliveryClientInput = {
  scope: {
    authMode: 'local_test',
    userId: 'user-media-source-smoke',
    workspaceId: identity.workspaceId,
  },
  projectId: identity.projectId,
  editSessionId: identity.editSessionId,
  approvedPlanSnapshotId: identity.approvedPlanSnapshotId,
  packageRecordId: identity.packageRecordId,
}

let clockMs = 0
let createdSource: FakeMediaSource | undefined
let objectUrlRevoked = false
const runtime = {
  createMediaSource: () => {
    createdSource = new FakeMediaSource()
    return createdSource
  },
  createObjectUrl: (source: EventTarget) => {
    queueMicrotask(() => (source as unknown as FakeMediaSource).open())
    return 'blob:private-customer-delivery-media-source-smoke'
  },
  revokeObjectUrl: (url: string) => {
    assert.equal(url, 'blob:private-customer-delivery-media-source-smoke')
    objectUrlRevoked = true
  },
  isTypeSupported: (mimeType: string) =>
    mimeType === PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MEDIA_SOURCE_MIME,
  now: () => clockMs,
}
const mediaElement = new FakeMediaElement()
mediaElement.currentTime = 31
const rangeRequests: Array<{ start: number; end: number }> = []
const stateHistory: string[] = []

const attached = await
  attachProfessionalLongFormCustomerDeliveryMediaSource({
    authority,
    review: reviewFixture(),
    mediaElement,
    rangeByteSize: 8 * 1024 * 1024,
    runtime,
    rangeReader: async ({ start, end }) => {
      rangeRequests.push({ start, end })
      return {
        status: 'ready' as const,
        message: 'Exact private range ready.',
        retryable: false as const,
        range: {
          bytes: mediaBytes.slice(start, end + 1),
          start,
          end,
          totalByteSize: mediaBytes.byteLength,
          fullArtifactSha256: masterSha256,
          mimeType: 'video/mp4' as const,
        },
        warnings: [],
      }
    },
    onStateChange: (state) => stateHistory.push(state.status),
  })

assert.equal(attached.status, 'attached')
if (attached.status !== 'attached') assert.fail('MediaSource must attach.')
const complete = await attached.controller.completion
assert.equal(complete.status, 'stream_complete')
assert.equal(complete.fullyAppended, true)
assert.equal(complete.bytesAppended, mediaBytes.byteLength)
assert.equal(complete.rangeRequestCount, 3)
assert.deepEqual(rangeRequests, [
  { start: 0, end: (8 * 1024 * 1024) - 1 },
  { start: 8 * 1024 * 1024, end: (16 * 1024 * 1024) - 1 },
  { start: 16 * 1024 * 1024, end: mediaBytes.byteLength - 1 },
])
assert.equal(createdSource?.readyState, 'ended')
assert.equal(
  createdSource?.sourceBuffer.appended.every((chunk) =>
    chunk.byteLength <= 8 * 1024 * 1024),
  true,
)
assert.deepEqual(
  Buffer.concat(createdSource?.sourceBuffer.appended.map((chunk) =>
    Buffer.from(chunk)) ?? []),
  Buffer.from(mediaBytes),
)
assert.deepEqual(stateHistory, [
  'streaming',
  'streaming',
  'streaming',
  'stream_complete',
])
assert.deepEqual(createdSource?.sourceBuffer.removed, [
  { start: 0, end: 1 },
])

mediaElement.paused = false
mediaElement.currentTime = 0
mediaElement.dispatchEvent(new Event('playing'))
for (let second = 1; second <= 10; second += 1) {
  clockMs = second * 1_000
  mediaElement.currentTime = second
  mediaElement.dispatchEvent(new Event('timeupdate'))
}
const fullCoverage = attached.controller.getCoverage()
assert.equal(fullCoverage.totalFrameCount, 300)
assert.equal(fullCoverage.coveredFrameCount, 300)
assert.equal(fullCoverage.coveragePermille, 1_000)
assert.equal(fullCoverage.fullProgramPlaybackObserved, true)
assert.deepEqual(fullCoverage.intervals, [
  { startFrame: 0, endFrameExclusive: 300 },
])

attached.controller.dispose()
assert.equal(attached.controller.getState().status, 'disposed')
assert.equal(objectUrlRevoked, true)
assert.equal(mediaElement.src, '')

const gappedCoverage =
  createProfessionalLongFormCustomerDeliveryCoverageTracker({
    totalFrameCount: 300,
    frameRateNumerator: 30,
    frameRateDenominator: 1,
  })
gappedCoverage.begin(0, 1, 0)
gappedCoverage.advance(4, 1, 4_000)
gappedCoverage.interrupt()
gappedCoverage.begin(6, 1, 6_000)
gappedCoverage.advance(10, 1, 10_000)
assert.equal(gappedCoverage.snapshot().fullProgramPlaybackObserved, false)
assert.deepEqual(gappedCoverage.snapshot().intervals, [
  { startFrame: 0, endFrameExclusive: 121 },
  { startFrame: 180, endFrameExclusive: 300 },
])

const implausibleCoverage =
  createProfessionalLongFormCustomerDeliveryCoverageTracker({
    totalFrameCount: 300,
    frameRateNumerator: 30,
    frameRateDenominator: 1,
  })
implausibleCoverage.begin(0, 1, 0)
implausibleCoverage.advance(9, 1, 100)
assert.equal(implausibleCoverage.snapshot().coveredFrameCount, 0)

const foreign = await attachProfessionalLongFormCustomerDeliveryMediaSource({
  authority: { ...authority, projectId: 'project-foreign' },
  review: reviewFixture(),
  mediaElement: new FakeMediaElement(),
  runtime,
})
assert.equal(foreign.status, 'blocked')

const unsupported = await
  attachProfessionalLongFormCustomerDeliveryMediaSource({
    authority,
    review: reviewFixture(),
    mediaElement: new FakeMediaElement(),
    runtime: {
      ...runtime,
      isTypeSupported: () => false,
    },
  })
assert.equal(unsupported.status, 'unsupported')

const failedRangeMediaElement = new FakeMediaElement()
failedRangeMediaElement.currentTime = 31
const failedRange = await
  attachProfessionalLongFormCustomerDeliveryMediaSource({
    authority,
    review: reviewFixture(),
    mediaElement: failedRangeMediaElement,
    rangeByteSize: 1024 * 1024,
    runtime,
    rangeReader: async () => ({
      status: 'invalid_response' as const,
      message: 'Injected range authority mismatch.',
      retryable: false,
      warnings: [],
    }),
  })
assert.equal(failedRange.status, 'attached')
if (failedRange.status !== 'attached') assert.fail('Failure fixture must attach.')
const failedState = await failedRange.controller.completion
assert.equal(failedState.status, 'failed')
assert.equal(failedState.failureMessage, 'Injected range authority mismatch.')
failedRange.controller.dispose()

console.log(JSON.stringify({
  ok: true,
  schemaVersion:
    'professional-long-form-customer-delivery-media-source-smoke-v1',
  authenticatedSequentialRangeCount: rangeRequests.length,
  maximumRangeBytes: 8 * 1024 * 1024,
  wholeArtifactBufferCreatedByAdapter: false,
  rollingBufferEvictionConfigured: true,
  exactFullProgramCoverageObserved: true,
  seekGapRejectedAsFullCoverage: true,
  implausiblePlaybackJumpRejected: true,
  foreignReviewRejected: true,
  unsupportedCodecRejected: true,
  durableServerWatchEvidenceVerified: false,
  visibleNamedEditPlayerMounted: false,
  retainedReviewArtifactVerified: false,
  publicDeliveryAuthorized: false,
  productionReady: false,
}, null, 2))

function reviewFixture() {
  return {
    schemaVersion:
      'professional-long-form-customer-delivery-browser-review-v1' as const,
    source:
      'canonical_professional_long_form_customer_delivery_browser_service' as const,
    purpose:
      'present_exact_private_customer_delivery_for_authenticated_review' as const,
    status: 'quality_review_required_private_download_blocked' as const,
    identity,
    authority: {
      reviewPacketHash,
      masterSha256,
      masterByteSize: mediaBytes.byteLength,
      masterFrameCount: 300,
      frameRateNumerator: 30 as const,
      frameRateDenominator: 1 as const,
      mimeType: 'video/mp4' as const,
      videoObjectiveEvidenceHash: 'c'.repeat(64),
      audioObjectiveEvidenceHash: 'd'.repeat(64),
    },
    reviewItems: [
      reviewItem(
        'video-review-item',
        'decoded_video_integrity',
        'needs_user_review',
        'full_video_decode_requires_human_acceptance',
        'e',
      ),
      reviewItem(
        'audio-review-item',
        'decoded_audio_quality_sync',
        'needs_user_review',
        'full_audio_quality_sync_requires_human_acceptance',
        'f',
      ),
      reviewItem(
        'speech-review-item',
        'speech_intelligibility_attestation',
        'not_automatically_analyzed',
        'speech_intelligibility_requires_manual_or_not_applicable_attestation',
        '0',
      ),
    ],
    reviewMedia: {
      method: 'GET' as const,
      path:
        `/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-review/media`,
      expectedReviewPacketHash: reviewPacketHash,
      expectedMasterSha256: masterSha256,
      byteSize: mediaBytes.byteLength,
      mimeType: 'video/mp4' as const,
      authenticatedBearerRequired: true as const,
      byteRangesSupported: true as const,
      publicOrSignedUrlCreated: false as const,
      cachePolicy: 'private_no_store' as const,
    },
    decision: null,
    privateDownload: null,
    readiness: {
      exactDecodedVideoQaReopened: true as const,
      exactDecodedAudioQaReopened: true as const,
      qualityReviewMediaReady: true as const,
      entireProgramPlaybackRequiredBeforeAcceptance: true as const,
      actualSpeechIntelligibilityAnalysisPerformed: false as const,
      authenticatedQualityDecisionRecorded: false,
      revisionRequiresFreshPlanEstimateAndApproval: false,
      authenticatedPrivateDownloadReady: false,
      publicDeliveryAuthorized: false as const,
      productReady: false as const,
      productionReady: false as const,
    },
    commercialBoundary: {
      approvedFourKEstimateAndReservationReused: true as const,
      customerDeliveryCoveredByOriginalApprovedEstimate: true as const,
      secondExportEstimateCreated: false as const,
      secondExportChargeCreated: false as const,
      exportTimeEstimatePromptAllowed: false as const,
      exportTimeCreditPromptAllowed: false as const,
      customerPriceAuthorityIncluded: false as const,
      customerCreditAuthorityIncluded: false as const,
      serviceFeeAuthorityIncluded: false as const,
      customerCreditsMutated: false as const,
      walletMutationAuthorized: false as const,
      settlementAuthorized: false as const,
      billingAuthorized: false as const,
    },
    boundaries: {
      rawReviewPacketReturned: false as const,
      rawDecisionAuthorityReturned: false as const,
      queueLeaseOrAttemptReturned: false as const,
      jobOrToolDetailsReturned: false as const,
      internalCostEvidenceReturned: false as const,
      filesystemOrStoragePathReturned: false as const,
      credentialReturned: false as const,
      providerCallStarted: false as const,
      additionalRenderStarted: false as const,
      publicArtifactCreated: false as const,
      publicDeliveryStarted: false as const,
      billingStarted: false as const,
      deploymentStarted: false as const,
    },
    persistence: {
      privateLocal: true as const,
      tenantScoped: true as const,
      distributed: false as const,
      databaseBacked: false as const,
      productionAuthority: false as const,
    },
    testOnly: true as const,
  }
}

function reviewItem(
  itemId: string,
  category:
    | 'decoded_video_integrity'
    | 'decoded_audio_quality_sync'
    | 'speech_intelligibility_attestation',
  automatedOutcome:
    | 'needs_user_review'
    | 'not_automatically_analyzed',
  safeSummaryCode:
    | 'full_video_decode_requires_human_acceptance'
    | 'full_audio_quality_sync_requires_human_acceptance'
    | 'speech_intelligibility_requires_manual_or_not_applicable_attestation',
  hashCharacter: string,
) {
  return {
    itemId,
    category,
    automatedOutcome,
    userDecisionRequired: true,
    automaticAcceptanceAllowed: false,
    safeSummaryCode,
    evidenceHash: hashCharacter.repeat(64),
  }
}
