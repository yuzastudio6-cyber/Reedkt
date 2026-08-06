import { useState } from 'react'
import type {
  ProfessionalLongFormCustomerDeliveryBrowserReview,
} from '../../../src/backend/api/professional-long-form-customer-delivery-browser-contracts'
import { CanonicalCustomerDeliveryPanel } from '../../../src/components/editor/CanonicalCustomerDeliveryPanel'
import type {
  ProfessionalLongFormCustomerDeliveryClientInput,
  ProfessionalLongFormCustomerDeliveryDiscoveryClientResult,
} from '../../../src/lib/professional-long-form-customer-delivery-client'

declare global {
  interface Window {
    __reeditproCustomerDeliveryReviewFixture?: {
      byteSize: number
      frameCount: number
      masterSha256: string
      stage?: 'accepted' | 'review'
    }
  }
}

const fixture = window.__reeditproCustomerDeliveryReviewFixture
if (!fixture) throw new Error('Customer-delivery review fixture missing.')

const customerDeliveryReviewIdentity = {
  workspaceId: 'workspace-customer-delivery-review',
  projectId: 'project-customer-delivery-review',
  editSessionId: 'edit-customer-delivery-review',
  approvedPlanSnapshotId: 'snapshot-customer-delivery-review',
  packageRecordId: 'package-customer-delivery-review',
}

const customerDeliveryReviewPacketHash = 'b'.repeat(64)

const authority: ProfessionalLongFormCustomerDeliveryClientInput = {
  scope: {
    authMode: 'local_test',
    userId: 'user-customer-delivery-review',
    workspaceId: customerDeliveryReviewIdentity.workspaceId,
  },
  projectId: customerDeliveryReviewIdentity.projectId,
  editSessionId: customerDeliveryReviewIdentity.editSessionId,
  approvedPlanSnapshotId:
    customerDeliveryReviewIdentity.approvedPlanSnapshotId,
  packageRecordId: customerDeliveryReviewIdentity.packageRecordId,
}

export function CustomerDeliveryReviewBrowserHarness() {
  const [refreshCount, setRefreshCount] = useState(0)
  const accepted = fixture.stage === 'accepted'
  const review = accepted
    ? createAcceptedCustomerDeliveryReviewFixture()
    : createCustomerDeliveryReviewFixture()
  const delivery:
    ProfessionalLongFormCustomerDeliveryDiscoveryClientResult = {
      status: 'ready',
      message: accepted
        ? 'The exact accepted private customer delivery and authenticated download authority were recovered.'
        : 'The exact private customer-delivery master is ready for authenticated playback and quality review.',
      retryable: false,
      authority,
      discovery: {
        schemaVersion:
          'professional-long-form-customer-delivery-discovery-v2',
        source:
          'canonical_professional_long_form_customer_delivery_discovery_service',
        purpose: 'discover_exact_private_customer_delivery_for_named_edit',
        stage: accepted
          ? 'customer_delivery_accepted'
          : 'customer_delivery_quality_review_ready',
        identity: customerDeliveryReviewIdentity,
        progress: {
          totalJobCount: 9,
          completedJobCount: accepted ? 9 : 8,
          activeJobCount: 0,
          pendingJobCount: accepted ? 0 : 1,
          completionPercent: accepted ? 100 : 88,
          attentionRequired: false,
        },
        review,
        readiness: {
          exactPackageDiscovered: true,
          exactSnapshotLineageVerified: true,
          qualityReviewReady: true,
          authenticatedQualityDecisionRecorded: accepted,
          revisionRequiresFreshPlanEstimateAndApproval: false,
          authenticatedPrivateDownloadReady: accepted,
          publicDeliveryAuthorized: false,
          productReady: false,
          productionReady: false,
        },
        commercialBoundary: commercialBoundary(),
        boundaries: {
          discoveryInspectionOnly: true,
          rawPackageReturned: false,
          rawQueueReturned: false,
          jobIdentityReturned: false,
          leaseOrAttemptReturned: false,
          internalCostEvidenceReturned: false,
          filesystemOrStoragePathReturned: false,
          credentialReturned: false,
          providerCallStarted: false,
          renderStarted: false,
          customerCreditsMutated: false,
          publicDeliveryStarted: false,
          billingStarted: false,
          deploymentStarted: false,
        },
        persistence: persistence(),
        testOnly: true,
      },
      warnings: [],
    }

  return (
    <main
      data-refresh-count={refreshCount}
      data-testid="customer-delivery-review-browser-harness"
      style={{ margin: '0 auto', maxWidth: 980, padding: '32px 20px 80px' }}
    >
      <CanonicalCustomerDeliveryPanel
        delivery={delivery}
        onRefresh={() => setRefreshCount((value) => value + 1)}
        refreshing={false}
      />
    </main>
  )
}

function createAcceptedCustomerDeliveryReviewFixture():
ProfessionalLongFormCustomerDeliveryBrowserReview {
  const decisionHash = 'a'.repeat(64)
  const watchEvidenceHash = '9'.repeat(64)
  return {
    ...createCustomerDeliveryReviewFixture(),
    status: 'quality_decision_already_recorded',
    watch: {
      ...createCustomerDeliveryReviewFixture().watch,
      status: 'complete',
      watchEvidenceHash,
      sequence: 1,
      nextSequence: 2,
      previousWatchEvidenceHash: null,
      expectedPreviousWatchEvidenceHash: watchEvidenceHash,
      coveredFrameCount: fixture!.frameCount,
      coveragePermille: 1_000,
      fullProgramPlaybackObserved: true,
      acceptanceGateSatisfied: true,
      serverElapsedMs: Math.ceil(
        (((fixture!.frameCount - 1) / 30) / 2) * 1_000,
      ) + 250,
    },
    decision: {
      value: 'accept_exact_private_customer_delivery',
      decisionHash,
      decidedAt: '2026-07-27T18:00:00.000Z',
      revisionReasonCodes: [],
      privateDownloadReconciliationAuthorized: true,
      revisionRequired: false,
      requiresFreshPlanEstimateAndApproval: false,
      watchEvidenceHash,
    },
    privateDownload: {
      method: 'GET',
      path:
        '/v1/edit-executions/professional-long-form/' +
        'customer-delivery-packages/' +
        `${customerDeliveryReviewIdentity.packageRecordId}/` +
        'private-download/file',
      expectedQualityDecisionHash: decisionHash,
      expectedMasterSha256: fixture!.masterSha256,
      byteSize: fixture!.byteSize,
      mimeType: 'video/mp4',
      authenticatedBearerRequired: true,
      byteRangesSupported: true,
      publicOrSignedUrlCreated: false,
      cachePolicy: 'private_no_store',
    },
    readiness: {
      ...createCustomerDeliveryReviewFixture().readiness,
      durableWholeProgramWatchEvidenceReady: true,
      authenticatedQualityDecisionRecorded: true,
      authenticatedPrivateDownloadReady: true,
    },
  }
}

function createCustomerDeliveryReviewFixture(): ProfessionalLongFormCustomerDeliveryBrowserReview {
  return {
    schemaVersion:
      'professional-long-form-customer-delivery-browser-review-v2',
    source:
      'canonical_professional_long_form_customer_delivery_browser_service',
    purpose:
      'present_exact_private_customer_delivery_for_authenticated_review',
    status: 'quality_review_required_private_download_blocked',
    identity: customerDeliveryReviewIdentity,
    authority: {
      reviewPacketHash: customerDeliveryReviewPacketHash,
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
        itemId: 'customer-delivery-video-review',
        category: 'decoded_video_integrity',
        automatedOutcome: 'needs_user_review',
        userDecisionRequired: true,
        automaticAcceptanceAllowed: false,
        safeSummaryCode: 'full_video_decode_requires_human_acceptance',
        evidenceHash: 'e'.repeat(64),
      },
      {
        itemId: 'customer-delivery-audio-review',
        category: 'decoded_audio_quality_sync',
        automatedOutcome: 'needs_user_review',
        userDecisionRequired: true,
        automaticAcceptanceAllowed: false,
        safeSummaryCode: 'full_audio_quality_sync_requires_human_acceptance',
        evidenceHash: 'f'.repeat(64),
      },
      {
        itemId: 'customer-delivery-speech-review',
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
        '/v1/edit-executions/professional-long-form/' +
        'customer-delivery-packages/' +
        `${customerDeliveryReviewIdentity.packageRecordId}/quality-review/media`,
      expectedReviewPacketHash: customerDeliveryReviewPacketHash,
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
      minimumRequiredElapsedMs: Math.ceil(
        (((fixture!.frameCount - 1) / 30) / 2) * 1_000,
      ),
      maximumPlaybackRatePermille: 2_000,
      browserReportedCompletionTrusted: false,
      privateLocalDurable: true,
      distributedDatabaseBacked: false,
      productionDurabilityProven: false,
      checkpoint: {
        method: 'POST',
        path:
          '/v1/edit-executions/professional-long-form/' +
          'customer-delivery-packages/' +
          `${customerDeliveryReviewIdentity.packageRecordId}/quality-review/` +
          'watch-checkpoints',
        expectedReviewPacketHash: customerDeliveryReviewPacketHash,
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
    commercialBoundary: commercialBoundary(),
    boundaries: browserBoundaries(),
    persistence: persistence(),
    testOnly: true,
  }
}

function commercialBoundary() {
  return {
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
  }
}

function browserBoundaries() {
  return {
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
  }
}

function persistence() {
  return {
    privateLocal: true as const,
    tenantScoped: true as const,
    distributed: false as const,
    databaseBacked: false as const,
    productionAuthority: false as const,
  }
}
