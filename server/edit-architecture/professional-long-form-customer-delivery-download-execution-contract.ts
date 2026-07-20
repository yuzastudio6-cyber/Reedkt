import { z } from 'zod'

import {
  professionalLongFormDeliveryMuxArtifactRefSchema,
} from './professional-long-form-customer-delivery-mux-execution-contract'

export const PROFESSIONAL_LONG_FORM_DELIVERY_QUALITY_REVIEW_PACKET_VERSION =
  'professional-long-form-customer-delivery-quality-review-packet-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_QUALITY_DECISION_VERSION =
  'professional-long-form-customer-delivery-quality-decision-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_QUALITY_DECISION_RECORD_VERSION =
  'professional-long-form-customer-delivery-quality-decision-record-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_AUTHORITY_VERSION =
  'professional-long-form-customer-delivery-download-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_AUTHORIZATION_VERSION =
  'professional-long-form-customer-delivery-download-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_ATTEMPT_VERSION =
  'professional-long-form-customer-delivery-download-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_ARTIFACT_VERSION =
  'professional-long-form-customer-delivery-download-artifact-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_RECONCILIATION_VERSION =
  'professional-long-form-customer-delivery-download-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_TERMINAL_VERSION =
  'professional-long-form-customer-delivery-download-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COMPLETION_VERSION =
  'professional-long-form-customer-delivery-download-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_KIND =
  'reconcile_private_customer_delivery_download' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_OPERATION_ID =
  'reeditpro.internal.reconcile_private_customer_delivery_download.v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_RUNNER_CLASS =
  'canonical_private_customer_delivery_download_reconciliation_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COST_PROFILE_ID =
  'long_form_private_download_reconciliation_cpu_1vcpu_1gib_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_RECIPE_ID =
  'approved_private_customer_delivery_download_v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const jsonBlobRef = z.object({
  sha256,
  byteLength: positiveInteger.max(4 * 1024 * 1024),
}).strict()
const qaOutcome = z.enum(['passed', 'needs_user_review'])

const commercialBoundarySchema = z.object({
  internalProductionCostOnly: z.literal(true),
  customerPriceAuthorityIncluded: z.literal(false),
  customerCreditAuthorityIncluded: z.literal(false),
  serviceFeeAuthorityIncluded: z.literal(false),
  approvedFourKEstimateAndReservationReused: z.literal(true),
  customerDeliveryCoveredByOriginalApprovedEstimate: z.literal(true),
  secondExportEstimateCreated: z.literal(false),
  secondExportChargeCreated: z.literal(false),
  exportTimeEstimatePromptAllowed: z.literal(false),
  exportTimeCreditPromptAllowed: z.literal(false),
  walletMutationAuthorized: z.literal(false),
  settlementAuthorized: z.literal(false),
  billingAuthorized: z.literal(false),
}).strict()

const persistenceSchema = z.object({
  privateLocalContentAddressed: z.literal(true),
  privateDecisionCreateOnly: z.literal(true),
  queueReceiptRequiredBeforeLease: z.literal(true),
  queueAttemptRequiredBeforeOperation: z.literal(true),
  queueCompletionIsAuthorityCommit: z.literal(true),
  orphanBlobsGrantExecutionAuthority: z.literal(false),
  distributedDatabaseBacked: z.literal(false),
  productionDurabilityProven: z.literal(false),
}).strict()

const operationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_OPERATION_ID),
  runnerClass: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_RUNNER_CLASS),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COST_PROFILE_ID,
  ),
  fixedRecipeProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_RECIPE_ID,
  ),
}).strict()

const qaEvidenceBindingSchema = z.object({
  jobId: identity,
  approvedWorkItemId: identity,
  queueCompletionHash: sha256,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  validationArtifactRef: jsonBlobRef,
  validationArtifactHash: sha256,
  objectiveEvidenceRef: jsonBlobRef,
  objectiveEvidenceHash: sha256,
  outcome: qaOutcome,
}).strict()

export const professionalLongFormDeliveryQualityReviewItemSchema = z.object({
  itemId: identity,
  category: z.enum([
    'decoded_video_integrity',
    'decoded_audio_quality_sync',
    'speech_intelligibility_attestation',
  ]),
  gateId: z.enum([
    'decoded_video_integrity',
    'decoded_audio_quality_sync',
    'manual_speech_intelligibility_review',
  ]),
  evidenceHash: sha256,
  automatedOutcome: z.enum([
    'passed',
    'needs_user_review',
    'not_automatically_analyzed',
  ]),
  userDecisionRequired: z.boolean(),
  automaticAcceptanceAllowed: z.boolean(),
  safeSummaryCode: z.enum([
    'full_video_decode_requires_human_acceptance',
    'full_audio_quality_sync_requires_human_acceptance',
    'speech_intelligibility_requires_manual_or_not_applicable_attestation',
    'full_video_decode_passed',
    'full_audio_quality_sync_passed',
  ]),
  itemHash: sha256,
}).strict()

export const professionalLongFormDeliveryQualityReviewPacketSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_QUALITY_REVIEW_PACKET_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_quality_review_service',
  ),
  purpose: z.literal(
    'present_exact_customer_delivery_decoded_qa_for_authenticated_quality_decision',
  ),
  status: z.literal(
    'exact_customer_delivery_quality_review_required_before_private_download',
  ),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
  }).strict(),
  deliveryPackageHash: sha256,
  deliveryPackageRef: jsonBlobRef,
  placementManifestHash: sha256,
  queueDefinitionHash: sha256,
  reviewedQueueAggregateHash: sha256,
  master: professionalLongFormDeliveryMuxArtifactRefSchema,
  decodedQa: z.object({
    video: qaEvidenceBindingSchema,
    audio: qaEvidenceBindingSchema.extend({
      actualSpeechIntelligibilityAnalysisPerformed: z.literal(false),
    }).strict(),
  }).strict(),
  reviewItems: z.array(
    professionalLongFormDeliveryQualityReviewItemSchema,
  ).length(3),
  reviewItemSetHash: sha256,
  userReviewRequired: z.literal(true),
  actualSpeechIntelligibilityAnalysisPerformed: z.literal(false),
  privateDownloadExecutionAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  commercialBoundary: commercialBoundarySchema,
  packetHash: sha256,
}).strict()

const decisionExpectationShape = {
  workspaceId: identity,
  approvedPlanSnapshotId: identity,
  expectedReviewPacketHash: sha256,
  expectedMasterSha256: sha256,
  expectedVideoObjectiveEvidenceHash: sha256,
  expectedAudioObjectiveEvidenceHash: sha256,
}

export const professionalLongFormDeliveryQualityReviewQuerySchema = z.object({
  workspaceId: identity,
  approvedPlanSnapshotId: identity,
}).strict()

export const professionalLongFormDeliveryPrivateDownloadQuerySchema =
  professionalLongFormDeliveryQualityReviewQuerySchema.extend({
    expectedQualityDecisionHash: sha256,
    expectedMasterSha256: sha256,
  }).strict()

export const recordProfessionalLongFormDeliveryQualityDecisionSchema =
  z.discriminatedUnion('decision', [
    z.object({
      ...decisionExpectationShape,
      decision: z.literal('accept_exact_private_customer_delivery'),
      attestation: z.object({
        entirePrivateMasterPlaybackReviewed: z.literal(true),
        exactVideoQualityAccepted: z.literal(true),
        exactAudioQualityAndSyncAccepted: z.literal(true),
        knownQaReviewItemsAccepted: z.literal(true),
        approvedIntentSatisfied: z.literal(true),
        speechIntelligibilityDisposition: z.enum([
          'manual_full_program_speech_review_accepted',
          'no_speech_expected_under_approved_snapshot',
        ]),
        noPublicDeliveryRequested: z.literal(true),
      }).strict(),
    }).strict(),
    z.object({
      ...decisionExpectationShape,
      decision: z.literal('request_customer_delivery_revision'),
      revisionReasonCodes: z.array(z.enum([
        'video_quality',
        'audio_quality',
        'av_sync',
        'speech_clarity',
        'approved_intent_mismatch',
        'other_quality_issue',
      ])).min(1).max(6).refine((values) =>
        new Set(values).size === values.length),
      requiresFreshPlanEstimateAndApproval: z.literal(true),
    }).strict(),
  ])

export const professionalLongFormDeliveryQualityDecisionSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_QUALITY_DECISION_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_quality_review_service',
  ),
  purpose: z.literal(
    'record_one_authenticated_exact_customer_delivery_quality_decision',
  ),
  identity: z.object({
    ownerUserId: identity,
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    qualityDecisionId: identity,
  }).strict(),
  decision: z.enum([
    'accept_exact_private_customer_delivery',
    'request_customer_delivery_revision',
  ]),
  reviewPacketHash: sha256,
  masterSha256: sha256,
  videoObjectiveEvidenceHash: sha256,
  audioObjectiveEvidenceHash: sha256,
  attestation: z.union([
    z.object({
      entirePrivateMasterPlaybackReviewed: z.literal(true),
      exactVideoQualityAccepted: z.literal(true),
      exactAudioQualityAndSyncAccepted: z.literal(true),
      knownQaReviewItemsAccepted: z.literal(true),
      approvedIntentSatisfied: z.literal(true),
      speechIntelligibilityDisposition: z.enum([
        'manual_full_program_speech_review_accepted',
        'no_speech_expected_under_approved_snapshot',
      ]),
      noPublicDeliveryRequested: z.literal(true),
    }).strict(),
    z.null(),
  ]),
  revisionReasonCodes: z.array(z.enum([
    'video_quality',
    'audio_quality',
    'av_sync',
    'speech_clarity',
    'approved_intent_mismatch',
    'other_quality_issue',
  ])).max(6),
  outcome: z.object({
    privateDownloadReconciliationAuthorized: z.boolean(),
    revisionRequired: z.boolean(),
    requiresFreshPlanEstimateAndApproval: z.boolean(),
    approvedSnapshotMutated: z.literal(false),
    approvedEstimateMutated: z.literal(false),
    creditReservationMutated: z.literal(false),
  }).strict(),
  permissions: z.object({
    privateDownloadReconciliation: z.boolean(),
    publicDelivery: z.literal(false),
    providerCall: z.literal(false),
    additionalRender: z.literal(false),
    customerCharge: z.literal(false),
    walletMutation: z.literal(false),
    billing: z.literal(false),
    deployment: z.literal(false),
  }).strict(),
  decidedAt: timestamp,
  decisionHash: sha256,
}).strict().superRefine((value, context) => {
  const accepted = value.decision === 'accept_exact_private_customer_delivery'
  if (
    accepted !== Boolean(value.attestation) ||
    accepted !== value.outcome.privateDownloadReconciliationAuthorized ||
    accepted !== value.permissions.privateDownloadReconciliation ||
    accepted === value.outcome.revisionRequired ||
    accepted === value.outcome.requiresFreshPlanEstimateAndApproval ||
    (accepted && value.revisionReasonCodes.length !== 0) ||
    (!accepted && value.revisionReasonCodes.length === 0)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Customer-delivery quality decision authority is inconsistent.',
    })
  }
})

export const professionalLongFormDeliveryQualityDecisionRecordSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_DELIVERY_QUALITY_DECISION_RECORD_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_customer_delivery_download_service',
    ),
    identity: z.object({
      ownerUserId: identity,
      workspaceId: identity,
      approvedPlanSnapshotId: identity,
      packageRecordId: identity,
    }).strict(),
    idempotencyKeyHash: sha256,
    decisionRequestHash: sha256,
    reviewPacket: professionalLongFormDeliveryQualityReviewPacketSchema,
    decision: professionalLongFormDeliveryQualityDecisionSchema,
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    productionDurabilityProven: z.literal(false),
    recordHash: sha256,
  }).strict()

const authorityIdentityShape = {
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanId: identity,
  approvedPlanSnapshotId: identity,
  approvedPlanSnapshotHash: sha256,
  packageRecordId: identity,
  jobId: identity,
  approvedWorkItemId: identity,
  expectedOutputIdentity: z.string().trim().min(1).max(512),
}

export const professionalLongFormDeliveryDownloadAuthoritySchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'server_reopened_professional_long_form_customer_delivery_download_authority',
  ),
  purpose: z.literal(
    'authorize_one_exact_private_customer_delivery_download_reconciliation',
  ),
  status: z.literal(
    'authenticated_quality_acceptance_authorizes_private_download_reconciliation_only',
  ),
  identity: z.object({
    ...authorityIdentityShape,
    kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_KIND),
  }).strict(),
  approval: z.object({
    approvedByUserId: identity,
    approvalRecordId: identity,
    approvedEstimateId: identity,
    creditReservationId: identity,
    reservationStatus: z.literal('reserved'),
    remainingReservedCredits: positiveInteger,
    reservationExpiresAt: timestamp,
    snapshotApprovedAt: timestamp,
  }).strict(),
  qualityDecision: z.object({
    qualityDecisionId: identity,
    qualityDecisionHash: sha256,
    reviewPacketHash: sha256,
    decidedByUserId: identity,
    decision: z.literal('accept_exact_private_customer_delivery'),
  }).strict(),
  master: professionalLongFormDeliveryMuxArtifactRefSchema,
  decodedQa: z.object({
    video: qaEvidenceBindingSchema,
    audio: qaEvidenceBindingSchema.extend({
      actualSpeechIntelligibilityAnalysisPerformed: z.literal(false),
    }).strict(),
  }).strict(),
  lineage: z.object({
    deliveryPackageHash: sha256,
    deliveryPackageRef: jsonBlobRef,
    deliveryPlacementManifestHash: sha256,
    queueDefinitionHash: sha256,
    downloadJobDefinitionHash: sha256,
    downloadPlacementHash: sha256,
    sourceEvidenceHash: sha256,
  }).strict(),
  operation: operationSchema.extend({
    workerType: z.literal('api_service'),
    resourceClassId: z.literal('control_plane_cpu_v1'),
    maximumAttempts: z.literal(1),
    attemptTimeoutSeconds: z.literal(300),
    leaseDurationMilliseconds: z.literal(300_000),
    heartbeatIntervalMilliseconds: z.literal(30_000),
    vcpuCount: z.literal(1),
    memoryGib: z.literal(1),
    gpuCount: z.literal(0),
  }).strict(),
  permissions: z.object({
    immutableQualityAcceptanceRequired: z.literal(true),
    exactPrivateMasterChecksumRequired: z.literal(true),
    exactDecodedQaEvidenceRequired: z.literal(true),
    authenticatedPrivateByteStreamAllowedAfterCompletion: z.literal(true),
    publicUrlCreationAllowed: z.literal(false),
    externalDownloadLinkCreationAllowed: z.literal(false),
    mediaMutationAllowed: z.literal(false),
    providerCallAllowed: z.literal(false),
    googleCloudDispatchAllowed: z.literal(false),
    publicDeliveryAllowed: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  persistence: persistenceSchema,
  authorizedAt: timestamp,
  authorityHash: sha256,
}).strict()

export const professionalLongFormDeliveryDownloadAuthorizationSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_AUTHORIZATION_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_customer_delivery_download_service',
    ),
    authorizationId: identity,
    authorityRef: jsonBlobRef,
    authorityHash: sha256,
    queueDefinitionHash: sha256,
    jobId: identity,
    approvedWorkItemId: identity,
    jobDefinitionHash: sha256,
    placementHash: sha256,
    expectedOutputIdentity: z.string().trim().min(1).max(512),
    operation: operationSchema,
    qualityDecisionHash: sha256,
    authorizedAt: timestamp,
    reservationExpiresAt: timestamp,
    singleUseDispatchRequired: z.literal(true),
    receiptHash: sha256,
  }).strict()

export const professionalLongFormDeliveryDownloadAttemptSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_ATTEMPT_VERSION,
  ),
  source: z.literal('private_canonical_package_work_queue_store'),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  jobId: identity,
  approvedWorkItemId: identity,
  claimId: identity,
  claimHash: sha256,
  workerIdentityHash: sha256,
  deliveryAttempt: z.literal(1),
  operation: operationSchema,
  startedAt: timestamp,
  dispatchConsumed: z.literal(true),
  plaintextClaimCredentialPersisted: z.literal(false),
  attemptHash: sha256,
}).strict()

export const professionalLongFormDeliveryDownloadArtifactSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_ARTIFACT_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_download_service',
  ),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    jobId: identity,
    approvedWorkItemId: identity,
    executionAttemptId: identity,
    privateDownloadDeliveryId: identity,
  }).strict(),
  authorityHash: sha256,
  executionAttemptHash: sha256,
  qualityDecisionId: identity,
  qualityDecisionHash: sha256,
  reviewPacketHash: sha256,
  master: professionalLongFormDeliveryMuxArtifactRefSchema,
  decodedQa: z.object({
    videoObjectiveEvidenceHash: sha256,
    videoOutcome: qaOutcome,
    audioObjectiveEvidenceHash: sha256,
    audioOutcome: qaOutcome,
    actualSpeechIntelligibilityAnalysisPerformed: z.literal(false),
  }).strict(),
  verification: z.object({
    exactPrivateMasterReopened: z.literal(true),
    exactMasterChecksumVerified: z.literal(true),
    exactMasterByteLengthVerified: z.literal(true),
    exactQualityDecisionReopened: z.literal(true),
    exactDecodedQaLineageVerified: z.literal(true),
    currentWorkspaceReadAccessRequiredPerDownload: z.literal(true),
    mediaMutated: z.literal(false),
  }).strict(),
  delivery: z.object({
    mimeType: z.literal('video/mp4'),
    fileName: z.string().trim().min(1).max(240)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*\.mp4$/u),
    byteSize: positiveInteger,
    sha256,
    byteRangeSupported: z.literal(true),
    publicUrlCreated: z.literal(false),
    externalDownloadLinkCreated: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  reconciledAt: timestamp,
  artifactHash: sha256,
}).strict()

export const professionalLongFormDeliveryDownloadReconciliationSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_RECONCILIATION_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_customer_delivery_download_service',
    ),
    jobId: identity,
    approvedWorkItemId: identity,
    executionAttemptId: identity,
    authorityHash: sha256,
    qualityDecisionHash: sha256,
    downloadArtifactRef: jsonBlobRef,
    downloadArtifactHash: sha256,
    decision: z.literal(
      'exact_quality_accepted_private_customer_delivery_ready_for_authenticated_stream',
    ),
    privateDownloadReconciled: z.literal(true),
    publicDeliveryAuthorized: z.literal(false),
    reconciledAt: timestamp,
    reconciliationHash: sha256,
  }).strict()

export const professionalLongFormDeliveryDownloadTerminalSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_TERMINAL_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_download_service',
  ),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  queueReceiptId: identity,
  authorityHash: sha256,
  validationArtifactRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  operation: operationSchema,
  outcome: z.literal('completed_private_test'),
  privateDownloadReconciled: z.literal(true),
  authenticatedPrivateStreamReady: z.literal(true),
  publicDeliveryAuthorized: z.literal(false),
  commercialBoundary: commercialBoundarySchema,
  completedAt: timestamp,
  terminalHash: sha256,
}).strict()

export const professionalLongFormDeliveryDownloadCompletionSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COMPLETION_VERSION,
  ),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  validationArtifactRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  terminalEvidenceRef: jsonBlobRef,
  operation: operationSchema,
  qualityDecisionHash: sha256,
  privateDownloadDeliveryId: identity,
}).strict()

export type RecordProfessionalLongFormDeliveryQualityDecision = z.infer<
  typeof recordProfessionalLongFormDeliveryQualityDecisionSchema
>
export type ProfessionalLongFormDeliveryQualityReviewPacket = z.infer<
  typeof professionalLongFormDeliveryQualityReviewPacketSchema
>
export type ProfessionalLongFormDeliveryQualityDecision = z.infer<
  typeof professionalLongFormDeliveryQualityDecisionSchema
>
export type ProfessionalLongFormDeliveryQualityDecisionRecord = z.infer<
  typeof professionalLongFormDeliveryQualityDecisionRecordSchema
>
export type ProfessionalLongFormDeliveryDownloadAuthority = z.infer<
  typeof professionalLongFormDeliveryDownloadAuthoritySchema
>
export type ProfessionalLongFormDeliveryDownloadAuthorization = z.infer<
  typeof professionalLongFormDeliveryDownloadAuthorizationSchema
>
export type ProfessionalLongFormDeliveryDownloadAttempt = z.infer<
  typeof professionalLongFormDeliveryDownloadAttemptSchema
>
export type ProfessionalLongFormDeliveryDownloadArtifact = z.infer<
  typeof professionalLongFormDeliveryDownloadArtifactSchema
>
export type ProfessionalLongFormDeliveryDownloadReconciliation = z.infer<
  typeof professionalLongFormDeliveryDownloadReconciliationSchema
>
export type ProfessionalLongFormDeliveryDownloadTerminal = z.infer<
  typeof professionalLongFormDeliveryDownloadTerminalSchema
>
export type ProfessionalLongFormDeliveryDownloadCompletion = z.infer<
  typeof professionalLongFormDeliveryDownloadCompletionSchema
>
