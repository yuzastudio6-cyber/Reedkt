import { z } from 'zod'

export const PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_REVIEW_VERSION =
  'professional-long-form-customer-delivery-browser-review-v1' as const
export const PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_BROWSER_DECISION_VERSION =
  'professional-long-form-customer-delivery-browser-decision-v1' as const

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
}).strict().superRefine((value, context) => {
  const accepted = value.value === 'accept_exact_private_customer_delivery'
  if (
    accepted !== value.privateDownloadReconciliationAuthorized ||
    accepted === value.revisionRequired ||
    accepted === value.requiresFreshPlanEstimateAndApproval ||
    (accepted && value.revisionReasonCodes.length !== 0) ||
    (!accepted && value.revisionReasonCodes.length === 0)
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

type BrowserReviewConsistencyValue = {
  authority: z.infer<typeof browserAuthoritySchema>
  reviewMedia: z.infer<typeof reviewMediaDescriptorSchema>
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
    value.readiness.authenticatedQualityDecisionRecorded !== decisionRecorded ||
    value.readiness.revisionRequiresFreshPlanEstimateAndApproval !== revision ||
    value.readiness.authenticatedPrivateDownloadReady !== accepted ||
    accepted !== Boolean(value.privateDownload) ||
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
export type ProfessionalLongFormCustomerDeliveryBrowserDownloadDescriptor =
  z.infer<
    typeof professionalLongFormCustomerDeliveryBrowserDownloadDescriptorSchema
  >
