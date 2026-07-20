import type {
  ProfessionalLongFormCustomerDeliveryBrowserReview,
} from '../../../src/backend/api/professional-long-form-customer-delivery-browser-contracts'
import {
  attachProfessionalLongFormCustomerDeliveryMediaSource,
  type ProfessionalLongFormCustomerDeliveryMediaSourceController,
} from '../../../src/lib/professional-long-form-customer-delivery-media-source'
import type {
  ProfessionalLongFormCustomerDeliveryClientInput,
} from '../../../src/lib/professional-long-form-customer-delivery-client'
import {
  recordProfessionalLongFormCustomerDeliveryWatchCheckpoint,
} from '../../../src/lib/professional-long-form-customer-delivery-client'

declare global {
  interface Window {
    __reeditproCustomerDeliveryMediaSourceFixture?: {
      byteSize: number
      frameCount: number
      masterSha256: string
    }
    __reeditproCustomerDeliveryMediaSourceHarness?: {
      controller: ProfessionalLongFormCustomerDeliveryMediaSourceController
      recordWatchStart: () => Promise<{
        sequence: number
        acceptanceGateSatisfied: boolean
      }>
      recordCurrentWatchCoverage: () => Promise<{
        sequence: number
        acceptanceGateSatisfied: boolean
      }>
    }
  }
}

const fixture = window.__reeditproCustomerDeliveryMediaSourceFixture
if (!fixture) throw new Error('Customer-delivery MediaSource fixture missing.')

const identity = {
  workspaceId: 'workspace-media-source-browser',
  projectId: 'project-media-source-browser',
  editSessionId: 'edit-media-source-browser',
  approvedPlanSnapshotId: 'snapshot-media-source-browser',
  packageRecordId: 'delivery-package-media-source-browser',
}
const reviewPacketHash = 'b'.repeat(64)
const authority: ProfessionalLongFormCustomerDeliveryClientInput = {
  scope: {
    authMode: 'local_test',
    userId: 'user-media-source-browser',
    workspaceId: identity.workspaceId,
  },
  projectId: identity.projectId,
  editSessionId: identity.editSessionId,
  approvedPlanSnapshotId: identity.approvedPlanSnapshotId,
  packageRecordId: identity.packageRecordId,
}
let review = reviewFixture()

const root = document.createElement('main')
root.dataset.testid = 'customer-delivery-media-source-harness'
root.style.cssText = 'margin:24px auto;max-width:900px;padding:20px'
const status = document.createElement('p')
status.dataset.testid = 'customer-delivery-media-source-status'
status.textContent = 'Attaching private stream'
const video = document.createElement('video')
video.dataset.testid = 'customer-delivery-media-source-video'
video.controls = true
video.muted = true
video.playsInline = true
video.style.cssText = 'display:block;width:100%;background:#000'
const play = document.createElement('button')
play.dataset.testid = 'customer-delivery-media-source-play'
play.textContent = 'Play private review'
root.append(status, video, play)
document.body.replaceChildren(root)

const attachment = await attachProfessionalLongFormCustomerDeliveryMediaSource({
  authority,
  review,
  mediaElement: video,
  rangeByteSize: 64 * 1024,
  onStateChange: (state) => {
    status.textContent = state.status
    status.dataset.bytesAppended = String(state.bytesAppended)
    status.dataset.rangeRequestCount = String(state.rangeRequestCount)
  },
})
if (attachment.status !== 'attached') {
  status.textContent = attachment.status
  status.dataset.failure = attachment.message
  throw new Error(attachment.message)
}
window.__reeditproCustomerDeliveryMediaSourceHarness = {
  controller: attachment.controller,
  recordWatchStart: () => recordWatchCheckpoint([{
    startFrame: 0,
    endFrameExclusive: 1,
  }]),
  recordCurrentWatchCoverage: () => recordWatchCheckpoint(
    attachment.controller.getCoverage().intervals,
  ),
}
play.addEventListener('click', () => {
  video.playbackRate = 2
  void video.play()
})

async function recordWatchCheckpoint(
  coveredIntervals: Array<{
    startFrame: number
    endFrameExclusive: number
  }>,
) {
  const result =
    await recordProfessionalLongFormCustomerDeliveryWatchCheckpoint({
      ...authority,
      review,
      coveredIntervals,
    })
  if (result.status !== 'recorded') throw new Error(result.message)
  review = {
    ...review,
    watch: result.watch.watch,
    readiness: {
      ...review.readiness,
      durableWholeProgramWatchEvidenceReady:
        result.watch.watch.acceptanceGateSatisfied,
    },
  }
  return {
    sequence: result.watch.watch.sequence,
    acceptanceGateSatisfied:
      result.watch.watch.acceptanceGateSatisfied,
  }
}

function reviewFixture(): ProfessionalLongFormCustomerDeliveryBrowserReview {
  return {
    schemaVersion:
      'professional-long-form-customer-delivery-browser-review-v2',
    source:
      'canonical_professional_long_form_customer_delivery_browser_service',
    purpose:
      'present_exact_private_customer_delivery_for_authenticated_review',
    status: 'quality_review_required_private_download_blocked',
    identity,
    authority: {
      reviewPacketHash,
      masterSha256: fixture!.masterSha256,
      masterByteSize: fixture!.byteSize,
      masterFrameCount: fixture!.frameCount,
      frameRateNumerator: 30,
      frameRateDenominator: 1,
      mimeType: 'video/mp4',
      videoObjectiveEvidenceHash: 'c'.repeat(64),
      audioObjectiveEvidenceHash: 'd'.repeat(64),
    },
    reviewItems: [
      {
        itemId: 'video-review-item',
        category: 'decoded_video_integrity',
        automatedOutcome: 'needs_user_review',
        userDecisionRequired: true,
        automaticAcceptanceAllowed: false,
        safeSummaryCode: 'full_video_decode_requires_human_acceptance',
        evidenceHash: 'e'.repeat(64),
      },
      {
        itemId: 'audio-review-item',
        category: 'decoded_audio_quality_sync',
        automatedOutcome: 'needs_user_review',
        userDecisionRequired: true,
        automaticAcceptanceAllowed: false,
        safeSummaryCode: 'full_audio_quality_sync_requires_human_acceptance',
        evidenceHash: 'f'.repeat(64),
      },
      {
        itemId: 'speech-review-item',
        category: 'speech_intelligibility_attestation',
        automatedOutcome: 'not_automatically_analyzed',
        userDecisionRequired: true,
        automaticAcceptanceAllowed: false,
        safeSummaryCode:
          'speech_intelligibility_requires_manual_or_not_applicable_attestation',
        evidenceHash: '0'.repeat(64),
      },
    ],
    reviewMedia: {
      method: 'GET',
      path:
        `/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-review/media`,
      expectedReviewPacketHash: reviewPacketHash,
      expectedMasterSha256: fixture!.masterSha256,
      byteSize: fixture!.byteSize,
      mimeType: 'video/mp4',
      authenticatedBearerRequired: true,
      byteRangesSupported: true,
      publicOrSignedUrlCreated: false,
      cachePolicy: 'private_no_store',
    },
    watch: {
      status: 'not_started',
      watchEvidenceHash: null,
      sequence: 0,
      nextSequence: 1,
      previousWatchEvidenceHash: null,
      expectedPreviousWatchEvidenceHash: null,
      coveredFrameCount: 0,
      coveragePermille: 0,
      fullProgramPlaybackObserved: false,
      acceptanceGateSatisfied: false,
      serverElapsedMs: 0,
      minimumRequiredElapsedMs: 1_484,
      maximumPlaybackRatePermille: 2_000,
      browserReportedCompletionTrusted: false,
      privateLocalDurable: true,
      distributedDatabaseBacked: false,
      productionDurabilityProven: false,
      checkpoint: {
        method: 'POST',
        path:
          `/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-review/watch-checkpoints`,
        expectedReviewPacketHash: reviewPacketHash,
        expectedMasterSha256: fixture!.masterSha256,
        authenticatedBearerRequired: true,
        idempotencyKeyRequired: true,
        browserReportedCompletionTrusted: false,
      },
    },
    decision: null,
    privateDownload: null,
    readiness: {
      exactDecodedVideoQaReopened: true,
      exactDecodedAudioQaReopened: true,
      qualityReviewMediaReady: true,
      entireProgramPlaybackRequiredBeforeAcceptance: true,
      durableWholeProgramWatchEvidenceReady: false,
      actualSpeechIntelligibilityAnalysisPerformed: false,
      authenticatedQualityDecisionRecorded: false,
      revisionRequiresFreshPlanEstimateAndApproval: false,
      authenticatedPrivateDownloadReady: false,
      publicDeliveryAuthorized: false,
      productReady: false,
      productionReady: false,
    },
    commercialBoundary: {
      approvedFourKEstimateAndReservationReused: true,
      customerDeliveryCoveredByOriginalApprovedEstimate: true,
      secondExportEstimateCreated: false,
      secondExportChargeCreated: false,
      exportTimeEstimatePromptAllowed: false,
      exportTimeCreditPromptAllowed: false,
      customerPriceAuthorityIncluded: false,
      customerCreditAuthorityIncluded: false,
      serviceFeeAuthorityIncluded: false,
      customerCreditsMutated: false,
      walletMutationAuthorized: false,
      settlementAuthorized: false,
      billingAuthorized: false,
    },
    boundaries: {
      rawReviewPacketReturned: false,
      rawDecisionAuthorityReturned: false,
      queueLeaseOrAttemptReturned: false,
      jobOrToolDetailsReturned: false,
      internalCostEvidenceReturned: false,
      filesystemOrStoragePathReturned: false,
      credentialReturned: false,
      providerCallStarted: false,
      additionalRenderStarted: false,
      publicArtifactCreated: false,
      publicDeliveryStarted: false,
      billingStarted: false,
      deploymentStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      databaseBacked: false,
      productionAuthority: false,
    },
    testOnly: true,
  }
}
