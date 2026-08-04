import { z } from 'zod'

export const PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_REVIEW_VERSION =
  'professional-long-form-customer-delivery-browser-review-v2' as const
export const PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_DECISION_VERSION =
  'professional-long-form-customer-delivery-browser-decision-v2' as const
export const PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DISCOVERY_VERSION =
  'professional-long-form-customer-delivery-discovery-v2' as const
export const PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_WATCH_VERSION =
  'professional-long-form-customer-delivery-browser-watch-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const timestamp = z.string().datetime({ offset: true })

const browserIdentitySchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  packageRecordId: identity,
}).strict()

const browserAuthoritySchema = z.object({
  reviewPacketHash: sha256,
  masterSha256: sha256,
  masterByteSize: positiveInteger,
  masterFrameCount: positiveInteger.max(648_000),
  frameRateNumerator: z.literal(30),
  frameRateDenominator: z.literal(1),
  mimeType: z.literal('video/mp4'),
  videoObjectiveEvidenceHash: sha256,
  audioObjectiveEvidenceHash: sha256,
}).strict()

export const professionalLongFormCustomerDeliveryBrowserReviewItemSchema =
  z.object({
    itemId: identity,
    category: z.enum([
      'decoded_video_integrity',
      'decoded_audio_quality_sync',
      'speech_intelligibility_attestation',
    ]),
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
    evidenceHash: sha256,
  }).strict()

const reviewMediaDescriptorSchema = z.object({
  method: z.literal('GET'),
  path: z.string().min(1).max(512).regex(
    /^\/v1\/edit-executions\/professional-long-form\/customer-delivery-packages\/[A-Za-z0-9%._:-]+\/quality-review\/media$/u,
  ),
  expectedReviewPacketHash: sha256,
  expectedMasterSha256: sha256,
  byteSize: positiveInteger,
  mimeType: z.literal('video/mp4'),
  authenticatedBearerRequired: z.literal(true),
  byteRangesSupported: z.literal(true),
  publicOrSignedUrlCreated: z.literal(false),
  cachePolicy: z.literal('private_no_store'),
}).strict()

const watchCheckpointDescriptorSchema = z.object({
  method: z.literal('POST'),
  path: z.string().min(1).max(512).regex(
    /^\/v1\/edit-executions\/professional-long-form\/customer-delivery-packages\/[A-Za-z0-9%._:-]+\/quality-review\/watch-checkpoints$/u,
  ),
  expectedReviewPacketHash: sha256,
  expectedMasterSha256: sha256,
  authenticatedBearerRequired: z.literal(true),
  idempotencyKeyRequired: z.literal(true),
  browserReportedCompletionTrusted: z.literal(false),
}).strict()

export const professionalLongFormCustomerDeliveryBrowserWatchStateSchema =
  z.object({
    status: z.enum(['not_started', 'in_progress', 'complete']),
    watchEvidenceHash: sha256.nullable(),
    sequence: z.number().int().nonnegative().max(100_000),
    nextSequence: positiveInteger.max(100_001),
    previousWatchEvidenceHash: sha256.nullable(),
    expectedPreviousWatchEvidenceHash: sha256.nullable(),
    coveredFrameCount: z.number().int().nonnegative().max(648_000),
    coveragePermille: z.number().int().min(0).max(1_000),
    fullProgramPlaybackObserved: z.boolean(),
    acceptanceGateSatisfied: z.boolean(),
    serverElapsedMs: z.number().int().nonnegative()
      .max(Number.MAX_SAFE_INTEGER),
    minimumRequiredElapsedMs: z.number().int().nonnegative()
      .max(Number.MAX_SAFE_INTEGER),
    maximumPlaybackRatePermille: z.literal(2_000),
    browserReportedCompletionTrusted: z.literal(false),
    privateLocalDurable: z.literal(true),
    distributedDatabaseBacked: z.literal(false),
    productionDurabilityProven: z.literal(false),
    checkpoint: watchCheckpointDescriptorSchema,
  }).strict().superRefine((value, context) => {
    const started = value.status !== 'not_started'
    const complete = value.status === 'complete'
    if (
      started !== Boolean(value.watchEvidenceHash) ||
      started !== (value.sequence > 0) ||
      (started && (value.sequence === 1) !==
        (value.previousWatchEvidenceHash === null)) ||
      (!started && value.previousWatchEvidenceHash !== null) ||
      value.nextSequence !== value.sequence + 1 ||
      value.expectedPreviousWatchEvidenceHash !== value.watchEvidenceHash ||
      complete !== value.fullProgramPlaybackObserved ||
      complete !== value.acceptanceGateSatisfied ||
      (!started && (
        value.coveredFrameCount !== 0 ||
        value.coveragePermille !== 0 ||
        value.serverElapsedMs !== 0
      )) ||
      (complete && value.coveragePermille !== 1_000)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Browser customer-delivery watch state is inconsistent.',
      })
    }
  })

export const professionalLongFormCustomerDeliveryBrowserDownloadDescriptorSchema =
  z.object({
    method: z.literal('GET'),
    path: z.string().min(1).max(512).regex(
      /^\/v1\/edit-executions\/professional-long-form\/customer-delivery-packages\/[A-Za-z0-9%._:-]+\/private-download\/file$/u,
    ),
    expectedQualityDecisionHash: sha256,
    expectedMasterSha256: sha256,
    byteSize: positiveInteger,
    mimeType: z.literal('video/mp4'),
    authenticatedBearerRequired: z.literal(true),
    byteRangesSupported: z.literal(true),
    publicOrSignedUrlCreated: z.literal(false),
    cachePolicy: z.literal('private_no_store'),
  }).strict()

const qualityDecisionSummarySchema = z.object({
  value: z.enum([
    'accept_exact_private_customer_delivery',
    'request_customer_delivery_revision',
  ]),
  decisionHash: sha256,
  decidedAt: timestamp,
  revisionReasonCodes: z.array(z.enum([
    'video_quality',
    'audio_quality',
    'av_sync',
    'speech_clarity',
    'approved_intent_mismatch',
    'other_quality_issue',
  ])).max(6),
  privateDownloadReconciliationAuthorized: z.boolean(),
  revisionRequired: z.boolean(),
  requiresFreshPlanEstimateAndApproval: z.boolean(),
  watchEvidenceHash: sha256.nullable(),
}).strict().superRefine((value, context) => {
  const accepted = value.value === 'accept_exact_private_customer_delivery'
  if (
    accepted !== value.privateDownloadReconciliationAuthorized ||
    accepted === value.revisionRequired ||
    accepted === value.requiresFreshPlanEstimateAndApproval ||
    (accepted && value.revisionReasonCodes.length !== 0) ||
    (!accepted && value.revisionReasonCodes.length === 0) ||
    accepted !== Boolean(value.watchEvidenceHash)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Browser quality-decision summary is inconsistent.',
    })
  }
})

const commercialBoundarySchema = z.object({
  approvedFourKEstimateAndReservationReused: z.literal(true),
  customerDeliveryCoveredByOriginalApprovedEstimate: z.literal(true),
  secondExportEstimateCreated: z.literal(false),
  secondExportChargeCreated: z.literal(false),
  exportTimeEstimatePromptAllowed: z.literal(false),
  exportTimeCreditPromptAllowed: z.literal(false),
  customerPriceAuthorityIncluded: z.literal(false),
  customerCreditAuthorityIncluded: z.literal(false),
  serviceFeeAuthorityIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  walletMutationAuthorized: z.literal(false),
  settlementAuthorized: z.literal(false),
  billingAuthorized: z.literal(false),
}).strict()

const browserBoundarySchema = z.object({
  rawReviewPacketReturned: z.literal(false),
  rawDecisionAuthorityReturned: z.literal(false),
  queueLeaseOrAttemptReturned: z.literal(false),
  jobOrToolDetailsReturned: z.literal(false),
  internalCostEvidenceReturned: z.literal(false),
  filesystemOrStoragePathReturned: z.literal(false),
  credentialReturned: z.literal(false),
  providerCallStarted: z.literal(false),
  additionalRenderStarted: z.literal(false),
  publicArtifactCreated: z.literal(false),
  publicDeliveryStarted: z.literal(false),
  billingStarted: z.literal(false),
  deploymentStarted: z.literal(false),
}).strict()

const browserPersistenceSchema = z.object({
  privateLocal: z.literal(true),
  tenantScoped: z.literal(true),
  distributed: z.literal(false),
  databaseBacked: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const browserReadinessSchema = z.object({
  exactDecodedVideoQaReopened: z.literal(true),
  exactDecodedAudioQaReopened: z.literal(true),
  qualityReviewMediaReady: z.literal(true),
  entireProgramPlaybackRequiredBeforeAcceptance: z.literal(true),
  durableWholeProgramWatchEvidenceReady: z.boolean(),
  actualSpeechIntelligibilityAnalysisPerformed: z.literal(false),
  authenticatedQualityDecisionRecorded: z.boolean(),
  revisionRequiresFreshPlanEstimateAndApproval: z.boolean(),
  authenticatedPrivateDownloadReady: z.boolean(),
  publicDeliveryAuthorized: z.literal(false),
  productReady: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const browserReviewBaseShape = {
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_browser_service',
  ),
  identity: browserIdentitySchema,
  authority: browserAuthoritySchema,
  reviewItems: z.array(
    professionalLongFormCustomerDeliveryBrowserReviewItemSchema,
  ).length(3),
  reviewMedia: reviewMediaDescriptorSchema,
  watch: professionalLongFormCustomerDeliveryBrowserWatchStateSchema,
  decision: qualityDecisionSummarySchema.nullable(),
  privateDownload:
    professionalLongFormCustomerDeliveryBrowserDownloadDescriptorSchema
      .nullable(),
  readiness: browserReadinessSchema,
  commercialBoundary: commercialBoundarySchema,
  boundaries: browserBoundarySchema,
  persistence: browserPersistenceSchema,
  testOnly: z.literal(true),
}

export const professionalLongFormCustomerDeliveryBrowserReviewSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_REVIEW_VERSION,
    ),
    purpose: z.literal(
      'present_exact_private_customer_delivery_for_authenticated_review',
    ),
    status: z.enum([
      'quality_review_required_private_download_blocked',
      'quality_decision_already_recorded',
    ]),
    ...browserReviewBaseShape,
  }).strict().superRefine(assertBrowserReviewConsistency)

export const professionalLongFormCustomerDeliveryBrowserDecisionSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_DECISION_VERSION,
    ),
    purpose: z.literal(
      'record_exact_authenticated_private_customer_delivery_quality_decision',
    ),
    disposition: z.enum(['recorded', 'exact_replay']),
    status: z.enum([
      'revision_requested_private_download_closed',
      'quality_accepted_private_download_reconciled',
    ]),
    ...browserReviewBaseShape,
    decision: qualityDecisionSummarySchema,
  }).strict().superRefine(assertBrowserReviewConsistency)

export const professionalLongFormCustomerDeliveryBrowserWatchSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_WATCH_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_customer_delivery_browser_service',
    ),
    purpose: z.literal(
      'record_server_validated_private_customer_delivery_watch_checkpoint',
    ),
    disposition: z.enum(['recorded', 'exact_replay']),
    identity: browserIdentitySchema,
    authority: browserAuthoritySchema,
    watch: professionalLongFormCustomerDeliveryBrowserWatchStateSchema,
    boundaries: browserBoundarySchema,
    persistence: browserPersistenceSchema,
    testOnly: z.literal(true),
  }).strict().superRefine((value, context) => {
    if (
      value.watch.checkpoint.expectedReviewPacketHash !==
        value.authority.reviewPacketHash ||
      value.watch.checkpoint.expectedMasterSha256 !==
        value.authority.masterSha256 ||
      value.watch.coveredFrameCount > value.authority.masterFrameCount
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Browser watch receipt lost exact review authority.',
      })
    }
  })

export const professionalLongFormCustomerDeliveryDiscoverySchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DISCOVERY_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_discovery_service',
  ),
  purpose: z.literal(
    'discover_exact_private_customer_delivery_for_named_edit',
  ),
  stage: z.enum([
    'customer_delivery_processing',
    'customer_delivery_attention_required',
    'customer_delivery_quality_review_ready',
    'customer_delivery_revision_requested',
    'customer_delivery_accepted',
  ]),
  identity: browserIdentitySchema,
  progress: z.object({
    totalJobCount: z.number().int().min(9).max(253),
    completedJobCount: z.number().int().nonnegative().max(253),
    activeJobCount: z.number().int().nonnegative().max(253),
    pendingJobCount: z.number().int().nonnegative().max(253),
    completionPercent: z.number().int().min(0).max(100),
    attentionRequired: z.boolean(),
  }).strict(),
  review: professionalLongFormCustomerDeliveryBrowserReviewSchema.nullable(),
  readiness: z.object({
    exactPackageDiscovered: z.literal(true),
    exactSnapshotLineageVerified: z.literal(true),
    qualityReviewReady: z.boolean(),
    authenticatedQualityDecisionRecorded: z.boolean(),
    revisionRequiresFreshPlanEstimateAndApproval: z.boolean(),
    authenticatedPrivateDownloadReady: z.boolean(),
    publicDeliveryAuthorized: z.literal(false),
    productReady: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  boundaries: z.object({
    discoveryInspectionOnly: z.literal(true),
    rawPackageReturned: z.literal(false),
    rawQueueReturned: z.literal(false),
    jobIdentityReturned: z.literal(false),
    leaseOrAttemptReturned: z.literal(false),
    internalCostEvidenceReturned: z.literal(false),
    filesystemOrStoragePathReturned: z.literal(false),
    credentialReturned: z.literal(false),
    providerCallStarted: z.literal(false),
    renderStarted: z.literal(false),
    customerCreditsMutated: z.literal(false),
    publicDeliveryStarted: z.literal(false),
    billingStarted: z.literal(false),
    deploymentStarted: z.literal(false),
  }).strict(),
  persistence: browserPersistenceSchema,
  testOnly: z.literal(true),
}).strict().superRefine((value, context) => {
  const { progress, review, readiness } = value
  const reviewReady = review !== null
  const decisionRecorded = review?.decision !== null && review !== null
  const revision = review?.decision?.value ===
    'request_customer_delivery_revision'
  const accepted = review?.decision?.value ===
    'accept_exact_private_customer_delivery' &&
    review.privateDownload !== null
  const expectedCompletionPercent = Math.floor(
    (progress.completedJobCount * 100) / progress.totalJobCount,
  )
  const expectedStage = progress.attentionRequired
    ? 'customer_delivery_attention_required'
    : !reviewReady
      ? 'customer_delivery_processing'
      : revision
        ? 'customer_delivery_revision_requested'
        : accepted
          ? 'customer_delivery_accepted'
          : 'customer_delivery_quality_review_ready'
  if (
    progress.completedJobCount + progress.pendingJobCount !==
      progress.totalJobCount ||
    progress.activeJobCount > progress.pendingJobCount ||
    progress.completionPercent !== expectedCompletionPercent ||
    value.stage !== expectedStage ||
    readiness.qualityReviewReady !== reviewReady ||
    readiness.authenticatedQualityDecisionRecorded !== decisionRecorded ||
    readiness.revisionRequiresFreshPlanEstimateAndApproval !== revision ||
    readiness.authenticatedPrivateDownloadReady !== accepted ||
    (review && JSON.stringify(review.identity) !==
      JSON.stringify(value.identity)) ||
    (
      value.stage === 'customer_delivery_accepted' &&
      progress.completedJobCount !== progress.totalJobCount
    ) ||
    (
      [
        'customer_delivery_quality_review_ready',
        'customer_delivery_revision_requested',
      ].includes(value.stage) &&
      progress.completedJobCount !== progress.totalJobCount - 1
    )
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Customer-delivery discovery state is inconsistent.',
    })
  }
})

type BrowserReviewConsistencyValue = {
  authority: z.infer<typeof browserAuthoritySchema>
  reviewMedia: z.infer<typeof reviewMediaDescriptorSchema>
  watch: z.infer<
    typeof professionalLongFormCustomerDeliveryBrowserWatchStateSchema
  >
  decision: z.infer<typeof qualityDecisionSummarySchema> | null
  privateDownload: z.infer<
    typeof professionalLongFormCustomerDeliveryBrowserDownloadDescriptorSchema
  > | null
  readiness: z.infer<typeof browserReadinessSchema>
}

function assertBrowserReviewConsistency(
  value: BrowserReviewConsistencyValue,
  context: z.RefinementCtx,
): void {
  const decisionRecorded = value.decision !== null
  const accepted = value.decision?.value ===
    'accept_exact_private_customer_delivery'
  const revision = value.decision?.value ===
    'request_customer_delivery_revision'
  if (
    value.reviewMedia.expectedReviewPacketHash !==
      value.authority.reviewPacketHash ||
    value.reviewMedia.expectedMasterSha256 !== value.authority.masterSha256 ||
    value.reviewMedia.byteSize !== value.authority.masterByteSize ||
    value.watch.checkpoint.expectedReviewPacketHash !==
      value.authority.reviewPacketHash ||
    value.watch.checkpoint.expectedMasterSha256 !==
      value.authority.masterSha256 ||
    value.watch.coveredFrameCount > value.authority.masterFrameCount ||
    value.readiness.durableWholeProgramWatchEvidenceReady !==
      value.watch.acceptanceGateSatisfied ||
    value.readiness.authenticatedQualityDecisionRecorded !== decisionRecorded ||
    value.readiness.revisionRequiresFreshPlanEstimateAndApproval !== revision ||
    value.readiness.authenticatedPrivateDownloadReady !== accepted ||
    accepted !== Boolean(value.privateDownload) ||
    (accepted && (
      !value.watch.acceptanceGateSatisfied ||
      value.decision?.watchEvidenceHash !== value.watch.watchEvidenceHash
    )) ||
    (
      value.privateDownload !== null &&
      (
        value.privateDownload.expectedQualityDecisionHash !==
          value.decision?.decisionHash ||
        value.privateDownload.expectedMasterSha256 !==
          value.authority.masterSha256 ||
        value.privateDownload.byteSize !== value.authority.masterByteSize
      )
    )
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Browser review authority is internally inconsistent.',
    })
  }
}

export type ProfessionalLongFormCustomerDeliveryBrowserReview = z.infer<
  typeof professionalLongFormCustomerDeliveryBrowserReviewSchema
>
export type ProfessionalLongFormCustomerDeliveryBrowserDecision = z.infer<
  typeof professionalLongFormCustomerDeliveryBrowserDecisionSchema
>
export type ProfessionalLongFormCustomerDeliveryBrowserWatch = z.infer<
  typeof professionalLongFormCustomerDeliveryBrowserWatchSchema
>
export type ProfessionalLongFormCustomerDeliveryDiscovery = z.infer<
  typeof professionalLongFormCustomerDeliveryDiscoverySchema
>
export type ProfessionalLongFormCustomerDeliveryBrowserDownloadDescriptor =
  z.infer<
    typeof professionalLongFormCustomerDeliveryBrowserDownloadDescriptorSchema
  >
