import {
  PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_DECISION_VERSION,
  PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_REVIEW_VERSION,
  professionalLongFormCustomerDeliveryBrowserDecisionSchema,
  professionalLongFormCustomerDeliveryBrowserReviewSchema,
  type ProfessionalLongFormCustomerDeliveryBrowserDecision,
  type ProfessionalLongFormCustomerDeliveryBrowserDownloadDescriptor,
  type ProfessionalLongFormCustomerDeliveryBrowserReview,
} from '../../src/backend/api/professional-long-form-customer-delivery-browser-contracts'
import type {
  ProfessionalLongFormDeliveryQualityDecision,
  ProfessionalLongFormDeliveryQualityReviewPacket,
  RecordProfessionalLongFormDeliveryQualityDecision,
} from '../edit-architecture/professional-long-form-customer-delivery-download-execution-contract'
import type { ServiceContext } from '../types'
import {
  createCanonicalProfessionalLongFormCustomerDeliveryDownloadService,
  type CanonicalProfessionalLongFormDeliveryQualityDecisionEvidence,
  type CanonicalProfessionalLongFormDeliveryQualityReviewEvidence,
} from './canonical-professional-long-form-customer-delivery-download-service'

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

  return {
    async inspect(input: ExactPackageInput): Promise<{
      receipt: ProfessionalLongFormCustomerDeliveryBrowserReview
      warnings: string[]
    }> {
      const result = await service.inspectQualityReview(input)
      return {
        receipt: presentReview(result),
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
      return {
        receipt: presentDecision(result),
        warnings: browserWarnings(),
      }
    },
  }
}

function presentReview(
  result: CanonicalProfessionalLongFormDeliveryQualityReviewEvidence,
): ProfessionalLongFormCustomerDeliveryBrowserReview {
  const base = browserReviewBase({
    packet: result.reviewPacket,
    decision: result.decisionRecord?.decision ?? null,
    privateDownloadReady:
      result.readiness.authenticatedPrivateByteStreamReady,
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
): ProfessionalLongFormCustomerDeliveryBrowserDecision {
  const base = browserReviewBase({
    packet: result.decisionRecord.reviewPacket,
    decision: result.decisionRecord.decision,
    privateDownloadReady: result.download !== null,
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
    decision: input.decision ? decisionSummary(input.decision) : null,
    privateDownload: accepted
      ? downloadDescriptor(input.packet, input.decision!)
      : null,
    readiness: {
      exactDecodedVideoQaReopened: true as const,
      exactDecodedAudioQaReopened: true as const,
      qualityReviewMediaReady: true as const,
      entireProgramPlaybackRequiredBeforeAcceptance: true as const,
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
