import {
  PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_DECISION_VERSION,
  PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_REVIEW_VERSION,
  PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_WATCH_VERSION,
  professionalLongFormCustomerDeliveryBrowserDecisionSchema,
  professionalLongFormCustomerDeliveryBrowserReviewSchema,
  professionalLongFormCustomerDeliveryBrowserWatchSchema,
  type ProfessionalLongFormCustomerDeliveryBrowserDecision,
  type ProfessionalLongFormCustomerDeliveryBrowserDownloadDescriptor,
  type ProfessionalLongFormCustomerDeliveryBrowserReview,
  type ProfessionalLongFormCustomerDeliveryBrowserWatch,
} from '../../src/backend/api/professional-long-form-customer-delivery-browser-contracts'
import type {
  ProfessionalLongFormDeliveryQualityDecision,
  ProfessionalLongFormDeliveryQualityReviewPacket,
  RecordProfessionalLongFormDeliveryQualityDecision,
} from '../edit-architecture/professional-long-form-customer-delivery-download-execution-contract'
import type {
  RecordProfessionalLongFormDeliveryWatchCheckpoint,
} from '../edit-architecture/professional-long-form-customer-delivery-watch-evidence-contract'
import type { ServiceContext } from '../types'
import {
  createCanonicalProfessionalLongFormCustomerDeliveryDownloadService,
  type CanonicalProfessionalLongFormDeliveryQualityDecisionEvidence,
  type CanonicalProfessionalLongFormDeliveryQualityReviewEvidence,
} from './canonical-professional-long-form-customer-delivery-download-service'
import {
  buildProfessionalLongFormDeliveryWatchAuthority,
  createCanonicalProfessionalLongFormCustomerDeliveryWatchService,
  type CanonicalProfessionalLongFormDeliveryWatchState,
} from './canonical-professional-long-form-customer-delivery-watch-service'

type ExactPackageInput = {
  workspaceId: string
  approvedPlanSnapshotId: string
  packageRecordId: string
}

export function createCanonicalProfessionalLongFormCustomerDeliveryBrowserService(
  context: ServiceContext,
) {
  const service =
    createCanonicalProfessionalLongFormCustomerDeliveryDownloadService(context)
  const watchService =
    createCanonicalProfessionalLongFormCustomerDeliveryWatchService(context)

  return {
    async inspect(input: ExactPackageInput): Promise<{
      receipt: ProfessionalLongFormCustomerDeliveryBrowserReview
      warnings: string[]
    }> {
      const result = await service.inspectQualityReview(input)
      const watchState = await watchService.inspect({
        authority:
          buildProfessionalLongFormDeliveryWatchAuthority(result.reviewPacket),
      })
      return {
        receipt: presentReview(result, watchState),
        warnings: browserWarnings(),
      }
    },

    async record(input: ExactPackageInput & {
      idempotencyKey: string
      decisionRequest: RecordProfessionalLongFormDeliveryQualityDecision
    }): Promise<{
      receipt: ProfessionalLongFormCustomerDeliveryBrowserDecision
      warnings: string[]
    }> {
      const result = await service.recordQualityDecision(input)
      const watchState = await watchService.inspect({
        authority: buildProfessionalLongFormDeliveryWatchAuthority(
          result.decisionRecord.reviewPacket,
        ),
      })
      return {
        receipt: presentDecision(result, watchState),
        warnings: browserWarnings(),
      }
    },

    async recordWatchCheckpoint(input: ExactPackageInput & {
      idempotencyKey: string
      checkpoint: RecordProfessionalLongFormDeliveryWatchCheckpoint
    }): Promise<{
      receipt: ProfessionalLongFormCustomerDeliveryBrowserWatch
      warnings: string[]
    }> {
      const recorded = await service.recordQualityReviewWatchCheckpoint({
        workspaceId: input.workspaceId,
        approvedPlanSnapshotId: input.approvedPlanSnapshotId,
        packageRecordId: input.packageRecordId,
        idempotencyKey: input.idempotencyKey,
        checkpoint: input.checkpoint,
      })
      return {
        receipt: presentWatch(
          recorded.reviewPacket,
          recorded.state,
          recorded.disposition,
        ),
        warnings: browserWarnings(),
      }
    },
  }
}

function presentReview(
  result: CanonicalProfessionalLongFormDeliveryQualityReviewEvidence,
  watchState: CanonicalProfessionalLongFormDeliveryWatchState,
): ProfessionalLongFormCustomerDeliveryBrowserReview {
  const base = browserReviewBase({
    packet: result.reviewPacket,
    decision: result.decisionRecord?.decision ?? null,
    privateDownloadReady:
      result.readiness.authenticatedPrivateByteStreamReady,
    watchState,
  })
  return professionalLongFormCustomerDeliveryBrowserReviewSchema.parse({
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_REVIEW_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_browser_service',
    purpose:
      'present_exact_private_customer_delivery_for_authenticated_review',
    status: result.status,
    ...base,
  })
}

function presentDecision(
  result: CanonicalProfessionalLongFormDeliveryQualityDecisionEvidence,
  watchState: CanonicalProfessionalLongFormDeliveryWatchState,
): ProfessionalLongFormCustomerDeliveryBrowserDecision {
  const base = browserReviewBase({
    packet: result.decisionRecord.reviewPacket,
    decision: result.decisionRecord.decision,
    privateDownloadReady: result.download !== null,
    watchState,
  })
  return professionalLongFormCustomerDeliveryBrowserDecisionSchema.parse({
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_DECISION_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_browser_service',
    purpose:
      'record_exact_authenticated_private_customer_delivery_quality_decision',
    disposition: result.disposition,
    status: result.status,
    ...base,
    decision: decisionSummary(result.decisionRecord.decision),
  })
}

function browserReviewBase(input: {
  packet: ProfessionalLongFormDeliveryQualityReviewPacket
  decision: ProfessionalLongFormDeliveryQualityDecision | null
  privateDownloadReady: boolean
  watchState: CanonicalProfessionalLongFormDeliveryWatchState
}) {
  const revision = input.decision?.decision ===
    'request_customer_delivery_revision'
  const accepted = input.decision?.decision ===
    'accept_exact_private_customer_delivery' && input.privateDownloadReady
  const packageRecordId = encodeURIComponent(
    input.packet.identity.packageRecordId,
  )
  const reviewPath =
    '/v1/edit-executions/professional-long-form/' +
    `customer-delivery-packages/${packageRecordId}/quality-review/media`
  return {
    identity: {
      workspaceId: input.packet.identity.workspaceId,
      projectId: input.packet.identity.projectId,
      editSessionId: input.packet.identity.editSessionId,
      approvedPlanSnapshotId:
        input.packet.identity.approvedPlanSnapshotId,
      packageRecordId: input.packet.identity.packageRecordId,
    },
    authority: {
      reviewPacketHash: input.packet.packetHash,
      masterSha256: input.packet.master.sha256,
      masterByteSize: input.packet.master.byteLength,
      masterFrameCount: input.packet.master.frameCount,
      frameRateNumerator: input.packet.master.frameRateNumerator,
      frameRateDenominator: input.packet.master.frameRateDenominator,
      mimeType: 'video/mp4' as const,
      videoObjectiveEvidenceHash:
        input.packet.decodedQa.video.objectiveEvidenceHash,
      audioObjectiveEvidenceHash:
        input.packet.decodedQa.audio.objectiveEvidenceHash,
    },
    reviewItems: input.packet.reviewItems.map((item) => ({
      itemId: item.itemId,
      category: item.category,
      automatedOutcome: item.automatedOutcome,
      userDecisionRequired: item.userDecisionRequired,
      automaticAcceptanceAllowed: item.automaticAcceptanceAllowed,
      safeSummaryCode: item.safeSummaryCode,
      evidenceHash: item.evidenceHash,
    })),
    reviewMedia: {
      method: 'GET' as const,
      path: reviewPath,
      expectedReviewPacketHash: input.packet.packetHash,
      expectedMasterSha256: input.packet.master.sha256,
      byteSize: input.packet.master.byteLength,
      mimeType: 'video/mp4' as const,
      authenticatedBearerRequired: true as const,
      byteRangesSupported: true as const,
      publicOrSignedUrlCreated: false as const,
      cachePolicy: 'private_no_store' as const,
    },
    watch: watchSummary(input.packet, input.watchState),
    decision: input.decision ? decisionSummary(input.decision) : null,
    privateDownload: accepted
      ? downloadDescriptor(input.packet, input.decision!)
      : null,
    readiness: {
      exactDecodedVideoQaReopened: true as const,
      exactDecodedAudioQaReopened: true as const,
      qualityReviewMediaReady: true as const,
      entireProgramPlaybackRequiredBeforeAcceptance: true as const,
      durableWholeProgramWatchEvidenceReady:
        input.watchState.acceptanceGateSatisfied,
      actualSpeechIntelligibilityAnalysisPerformed: false as const,
      authenticatedQualityDecisionRecorded: input.decision !== null,
      revisionRequiresFreshPlanEstimateAndApproval: revision,
      authenticatedPrivateDownloadReady: accepted,
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

function presentWatch(
  packet: ProfessionalLongFormDeliveryQualityReviewPacket,
  watchState: CanonicalProfessionalLongFormDeliveryWatchState,
  disposition: 'recorded' | 'exact_replay',
): ProfessionalLongFormCustomerDeliveryBrowserWatch {
  const base = browserReviewBase({
    packet,
    decision: null,
    privateDownloadReady: false,
    watchState,
  })
  return professionalLongFormCustomerDeliveryBrowserWatchSchema.parse({
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_WATCH_VERSION,
    source:
      'canonical_professional_long_form_customer_delivery_browser_service',
    purpose:
      'record_server_validated_private_customer_delivery_watch_checkpoint',
    disposition,
    identity: base.identity,
    authority: base.authority,
    watch: base.watch,
    boundaries: base.boundaries,
    persistence: base.persistence,
    testOnly: true,
  })
}

function watchSummary(
  packet: ProfessionalLongFormDeliveryQualityReviewPacket,
  state: CanonicalProfessionalLongFormDeliveryWatchState,
) {
  const evidence = state.evidence
  const packageRecordId = encodeURIComponent(
    packet.identity.packageRecordId,
  )
  const minimumRequiredElapsedMs = evidence?.minimumRequiredElapsedMs ??
    Math.ceil(
      ((packet.master.frameCount - 1) * 1_000) /
        (packet.master.frameRateNumerator * 2),
    )
  return {
    status: state.status,
    watchEvidenceHash: evidence?.evidenceHash ?? null,
    sequence: evidence?.sequence ?? 0,
    nextSequence: state.nextSequence,
    previousWatchEvidenceHash:
      evidence?.previousWatchEvidenceHash ?? null,
    expectedPreviousWatchEvidenceHash:
      state.expectedPreviousWatchEvidenceHash,
    coveredFrameCount: evidence?.coveredFrameCount ?? 0,
    coveragePermille: evidence?.coveragePermille ?? 0,
    fullProgramPlaybackObserved:
      evidence?.fullProgramPlaybackObserved ?? false,
    acceptanceGateSatisfied: state.acceptanceGateSatisfied,
    serverElapsedMs: evidence?.serverElapsedMs ?? 0,
    minimumRequiredElapsedMs,
    maximumPlaybackRatePermille: 2_000 as const,
    browserReportedCompletionTrusted: false as const,
    privateLocalDurable: true as const,
    distributedDatabaseBacked: false as const,
    productionDurabilityProven: false as const,
    checkpoint: {
      method: 'POST' as const,
      path:
        '/v1/edit-executions/professional-long-form/' +
        `customer-delivery-packages/${packageRecordId}/quality-review/` +
        'watch-checkpoints',
      expectedReviewPacketHash: packet.packetHash,
      expectedMasterSha256: packet.master.sha256,
      authenticatedBearerRequired: true as const,
      idempotencyKeyRequired: true as const,
      browserReportedCompletionTrusted: false as const,
    },
  }
}

function decisionSummary(
  decision: ProfessionalLongFormDeliveryQualityDecision,
) {
  return {
    value: decision.decision,
    decisionHash: decision.decisionHash,
    decidedAt: decision.decidedAt,
    revisionReasonCodes: decision.revisionReasonCodes,
    privateDownloadReconciliationAuthorized:
      decision.outcome.privateDownloadReconciliationAuthorized,
    revisionRequired: decision.outcome.revisionRequired,
    requiresFreshPlanEstimateAndApproval:
      decision.outcome.requiresFreshPlanEstimateAndApproval,
    watchEvidenceHash: decision.watchEvidenceHash,
  }
}

function downloadDescriptor(
  packet: ProfessionalLongFormDeliveryQualityReviewPacket,
  decision: ProfessionalLongFormDeliveryQualityDecision,
): ProfessionalLongFormCustomerDeliveryBrowserDownloadDescriptor {
  return {
    method: 'GET',
    path:
      '/v1/edit-executions/professional-long-form/' +
      `customer-delivery-packages/${
        encodeURIComponent(packet.identity.packageRecordId)
      }/private-download/file`,
    expectedQualityDecisionHash: decision.decisionHash,
    expectedMasterSha256: packet.master.sha256,
    byteSize: packet.master.byteLength,
    mimeType: 'video/mp4',
    authenticatedBearerRequired: true,
    byteRangesSupported: true,
    publicOrSignedUrlCreated: false,
    cachePolicy: 'private_no_store',
  }
}

function browserWarnings(): string[] {
  return [
    'This is authenticated private/local review evidence; distributed production durability and public delivery remain blocked.',
    'The original approved 4K estimate and reservation cover customer delivery. No second estimate, charge, credit prompt, wallet mutation, settlement, or billing action occurred.',
  ]
}
