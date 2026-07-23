import type { ID, ISODateString } from '../shared'
import type {
  MotionStudioDigest,
  MotionStudioOwnership,
  MotionStudioVersionReference,
} from './shared'

export const MOTION_STUDIO_MS_010B_OWNER_AUTHORIZATION_VERSION =
  'motion-studio-ms-010b-owner-authorization-v1' as const
export const MOTION_STUDIO_MS_010B_RETENTION_POLICY_VERSION =
  'motion-studio-ms-010b-retention-policy-v1' as const
export const MOTION_STUDIO_MS_010B_STOP_POLICY_VERSION =
  'motion-studio-ms-010b-stop-policy-v1' as const
export const MOTION_STUDIO_MS_010B_EXECUTION_AUTHORITY_VERSION =
  'motion-studio-ms-010b-execution-authority-v1' as const
export const MOTION_STUDIO_MS_010B_FALLBACK_ELIGIBILITY_VERSION =
  'motion-studio-ms-010b-fallback-eligibility-v1' as const
export const MOTION_STUDIO_DETERMINISTIC_ROUTE_ACCEPTANCE_VERSION =
  'motion-studio-deterministic-route-acceptance-v1' as const
export const MOTION_STUDIO_DETERMINISTIC_ROUTE_REVIEW_VERSION =
  'motion-studio-deterministic-route-review-v1' as const

export const MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID =
  'openai_gpt_image_2_live_v1' as const
export const MOTION_STUDIO_WAN_LIVE_ADAPTER_ID =
  'alibaba_wan_2_7_i2v_live_v1' as const
export const MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID =
  'minimax_hailuo_2_3_fast_i2v_live_v1' as const

export const MOTION_STUDIO_WAN_MODEL_ID = 'wan2.7-i2v-2026-04-25' as const
export const MOTION_STUDIO_HAILUO_MODEL_ID = 'MiniMax-Hailuo-2.3-Fast' as const

export type MotionStudioMs010BOperationKind =
  | 'gpt_image_generation'
  | 'gpt_image_edit'
  | 'wan_image_to_video'
  | 'hailuo_image_to_video_fallback'

export interface MotionStudioMs010BProviderAllocation {
  operationKind: MotionStudioMs010BOperationKind
  providerRoute: 'gpt_image_2' | 'wan' | 'hailuo'
  maximumCallCount: 1
  maximumAuthorizedUsdMicros: number
  retryAllowanceCount: 0
  unusedAuthorityReassignable: false
  dependencyOperationKind?: Exclude<MotionStudioMs010BOperationKind, 'hailuo_image_to_video_fallback'>
  conditionalOnPersistedWanQaRejection: boolean
}

/** The exact owner consent grant. It never unlocks transport by itself. */
export interface MotionStudioMs010BOwnerAuthorizationV1 {
  schemaVersion: typeof MOTION_STUDIO_MS_010B_OWNER_AUTHORIZATION_VERSION
  authorizationId: ID
  productionId: ID
  approvedSnapshotId: ID
  authorizationDigest: MotionStudioDigest
  authorizedAt: ISODateString
  allocations: readonly MotionStudioMs010BProviderAllocation[]
  combinedMaximumAuthorizedUsdMicros: 3_000_000
  automaticRetriesAllowed: false
  automaticProviderSubmissionAllowed: false
  automaticPurchasesAllowed: false
  customerBillingAuthorized: false
  cnyToUsdPlanningAuthorized: true
  transportUnlocked: false
}

export interface MotionStudioMs010BRetentionPolicyV1 {
  schemaVersion: typeof MOTION_STUDIO_MS_010B_RETENTION_POLICY_VERSION
  id: ID
  contentDigest: MotionStudioDigest
  syntheticNonPersonalEvidenceOnly: true
  approvedEvidenceRetainedWithPrivateProject: true
  rejectedRawCandidateRetentionDays: 30
  temporaryFilesRemovedAfterVerifiedIngestAndQa: true
  providerUrlsAuthoritative: false
  providerUrlsBrowserVisible: false
  credentialsPersisted: false
  providerAccountRetentionRecordedBeforeSubmission: true
  ownerConfirmedAt: ISODateString
  immutable: true
}

export interface MotionStudioMs010BStopPolicyV1 {
  schemaVersion: typeof MOTION_STUDIO_MS_010B_STOP_POLICY_VERSION
  id: ID
  contentDigest: MotionStudioDigest
  stopOnCostCeilingRisk: true
  stopOnStaleOrAmbiguousPricingOrFx: true
  stopOnPurchaseOrRechargeRequired: true
  stopOnCredentialOrModelAccessFailure: true
  stopOnAuthorityOrDependencyMismatch: true
  stopOnPrivateOrUnlicensedInput: true
  stopOnUnknownProviderOutcome: true
  stopOnUnrecognizedProviderSchema: true
  stopOnUnsafeRedirectOrOversizedBody: true
  stopWhenResultCannotBeIngestedBeforeExpiry: true
  providerFailureDoesNotUnlockFallback: true
  timeoutDoesNotUnlockFallback: true
  unknownOutcomeDoesNotUnlockFallback: true
  onlyPersistedTechnicalCompleteWanQaRejectionUnlocksFallback: true
  reconcileOriginalOperationWithoutRetry: true
  ownerConfirmedAt: ISODateString
  immutable: true
}

export type MotionStudioLiveCredentialBinding =
  | {
      provider: 'openai'
      credentialReferenceId: ID
      channel: 'one_shot_server_environment' | 'approved_secret_manager'
      accountFundedWithoutPurchase: true
      modelAccessVerified: true
      browserExposureAllowed: false
      persistedInProject: false
      loggingAllowed: false
      verifiedAt: ISODateString
    }
  | {
      provider: 'alibaba_cloud'
      credentialReferenceId: ID
      workspaceBindingId: ID
      region: 'singapore' | 'beijing'
      channel: 'one_shot_server_environment' | 'approved_secret_manager'
      accountFundedWithoutPurchase: true
      modelAccessVerified: true
      browserExposureAllowed: false
      persistedInProject: false
      loggingAllowed: false
      verifiedAt: ISODateString
    }
  | {
      provider: 'minimax'
      credentialReferenceId: ID
      channel: 'one_shot_server_environment' | 'approved_secret_manager'
      accountFundedWithoutPurchase: true
      modelAccessVerified: true
      browserExposureAllowed: false
      persistedInProject: false
      loggingAllowed: false
      verifiedAt: ISODateString
    }

/**
 * Backend-only execution authority assembled after every non-spending gate has
 * been frozen. No raw credential, workspace identifier, URL or provider
 * response belongs in this record.
 */
export interface MotionStudioMs010BExecutionAuthorityV1 {
  schemaVersion: typeof MOTION_STUDIO_MS_010B_EXECUTION_AUTHORITY_VERSION
  id: ID
  productionId: ID
  approvedSnapshotId: ID
  ownerAuthorization: MotionStudioVersionReference
  retentionPolicy: MotionStudioVersionReference
  stopPolicy: MotionStudioVersionReference
  credentialBindings: readonly MotionStudioLiveCredentialBinding[]
  wanProviderNativeRateSnapshotId: ID
  wanCurrencyExchangeRateSnapshotId: ID | null
  combinedMaximumAuthorizedUsdMicros: 3_000_000
  unresolvedGateCount: 0
  submissionUnlocked: true
  authorityDigest: MotionStudioDigest
  createdAt: ISODateString
  expiresAt: ISODateString
  immutable: true
}

export interface MotionStudioMs010BFallbackEligibilityV1 {
  schemaVersion: typeof MOTION_STUDIO_MS_010B_FALLBACK_ELIGIBILITY_VERSION
  id: ID
  productionId: ID
  approvedSnapshotId: ID
  ownerAuthorization: MotionStudioVersionReference
  primaryProviderRoute: 'wan'
  primaryProviderOperationId: ID
  primaryCandidateId: ID
  primaryAssetVersion: MotionStudioVersionReference
  technicallyComplete: true
  qaDecision: 'rejected'
  qaEvidence: MotionStudioVersionReference
  rejectionCategory: 'reference_adherence' | 'continuity' | 'visual_artifact' | 'intent_alignment'
  fallbackProviderRoute: 'hailuo'
  automaticSubmissionAllowed: false
  manualInvocationRequired: true
  manualInvocationId: ID
  eligibilityDigest: MotionStudioDigest
  createdAt: ISODateString
  immutable: true
}

export type MotionStudioLiveCandidateRejectionCategory =
  | 'reference_adherence'
  | 'continuity'
  | 'visual_artifact'
  | 'intent_alignment'
  | 'safety'

export type MotionStudioLiveHumanAssessment = 'passed' | 'failed'

/**
 * The only QA judgment accepted from the browser. Technical completion,
 * checksums, media facts, safety evidence, provider usage and fallback
 * authority are always derived and persisted by the backend.
 */
export interface ReviewMotionStudioLiveCandidateRequest {
  decision: 'approved' | 'rejected'
  rejectionCategory?: MotionStudioLiveCandidateRejectionCategory
  assessments: {
    intentAlignment: MotionStudioLiveHumanAssessment
    referenceAdherence: MotionStudioLiveHumanAssessment
    continuity: MotionStudioLiveHumanAssessment
    visibleArtifacts: MotionStudioLiveHumanAssessment
    safety: MotionStudioLiveHumanAssessment
  }
  notes: readonly string[]
}

/** Immutable quality-report payload authored by the server from exact evidence. */
export interface MotionStudioLiveCandidateQualityReportV1 extends MotionStudioOwnership {
  id: ID
  productionId: ID
  artifactType: 'quality_report'
  reportType: 'live_generation_candidate_review'
  approvedSnapshotId: ID
  candidateId: ID
  operationKind: MotionStudioMs010BOperationKind
  jobId: ID
  jobAttemptId: ID
  mediaAssetId: ID
  mediaAssetVersionId: ID
  mediaSha256: MotionStudioDigest
  technicalQaEvidenceDigest: MotionStudioDigest
  technicallyComplete: true
  automatedSafetyStatus: 'passed' | 'review_required'
  humanReview: ReviewMotionStudioLiveCandidateRequest
  reviewedBy: ID
  reviewedAt: ISODateString
  sourceArtifactVersions: readonly MotionStudioVersionReference[]
  assetReferences: readonly ID[]
  status: 'approved' | 'blocked'
  notes: readonly string[]
  extensions: readonly []
}

export interface MotionStudioLiveCandidateReviewDto {
  decision: 'approved' | 'rejected'
  rejectionCategory?: MotionStudioLiveCandidateRejectionCategory
  reviewedAt: ISODateString
}

export interface MotionStudioLiveCandidateMediaDto {
  candidateId: ID
  assetVersionId: ID
  mediaKind: 'still_image' | 'video_clip'
  mimeType: 'image/png' | 'video/mp4'
  sha256: MotionStudioDigest
  byteLength: number
  width: number
  height: number
  durationFrames?: number
  fpsNumerator?: number
  fpsDenominator?: number
  technicalQaStatus: 'passed'
  technicalQaEvidenceDigest: MotionStudioDigest
  automatedSafetyStatus: 'passed' | 'review_required'
  review?: MotionStudioLiveCandidateReviewDto
  finalAssetEligible: boolean
  privateProjectAsset: true
}

export type MotionStudioLiveFallbackState =
  | 'not_applicable'
  | 'locked'
  | 'eligible_manual'
  | 'invoked'
  | 'not_used'

export interface MotionStudioLiveOperationBrowserDto {
  operationKind: MotionStudioMs010BOperationKind
  state:
    | 'waiting'
    | 'blocked'
    | 'created'
    | 'permit_issued'
    | 'transport_consumed'
    | 'submitted'
    | 'processing'
    | 'outcome_unknown'
    | 'completed'
    | 'failed'
    | 'qa_rejected'
    | 'approved'
    | 'cancelled'
  callCount: 0 | 1
  reconciliationRequired: boolean
  manualActionRequired: boolean
  updatedAt: ISODateString
  candidate?: MotionStudioLiveCandidateMediaDto
  fallbackState: MotionStudioLiveFallbackState
}

/** Browser-safe read model. It deliberately excludes provider and cost fields. */
export interface MotionStudioLiveGenerationWorkspaceDto {
  productionId: ID
  evidenceClass: 'real_provider'
  persistenceClass: 'local_canonical_evidence'
  operations: readonly MotionStudioLiveOperationBrowserDto[]
  realProviderEvidence: true
  simulatorOnly: false
  browserProviderTransportAllowed: false
  internalCostExposed: false
  deterministicReplacement?: MotionStudioDeterministicRouteAcceptanceDto
}

/**
 * Exact, zero-provider-call candidate produced by the registered private
 * Remotion route-draw profile from the already approved GPT Image 2 keyframe.
 */
export interface MotionStudioDeterministicRouteCandidateV1 {
  schemaVersion: typeof MOTION_STUDIO_DETERMINISTIC_ROUTE_ACCEPTANCE_VERSION
  productionId: ID
  approvedSnapshotId: ID
  moduleId: 'storytelling'
  moduleCatalogVersion: 'motion-studio-module-catalog-v1'
  stageProfileId: 'motion-studio-storytelling-stage-profile-v1'
  candidateId: ID
  sourceKeyframe: {
    mediaAssetVersionId: ID
    sha256: MotionStudioDigest
  }
  output: {
    mediaAssetId: ID
    mediaAssetVersionId: ID
    mimeType: 'video/mp4'
    sha256: MotionStudioDigest
    byteLength: number
    privateObjectIdentityHash: MotionStudioDigest
    width: 1280
    height: 720
    durationFrames: 180
    fpsNumerator: 30
    fpsDenominator: 1
  }
  route: {
    profileId: 'motion_studio_deterministic_route_draw_v1'
    routePresetId: 'abstract_three_district_route_v1'
    revealStartFrame: 18
    revealEndFrame: 140
    waypointFrames: readonly [18, 82, 140]
  }
  runtime: { attestationDigest: MotionStudioDigest }
  qa: { evidenceDigest: MotionStudioDigest }
  cost: {
    providerSubmissionCount: 0
    providerCostIncurredMicros: 0
    customerPriceCalculated: false
    customerCreditsMutated: false
  }
}

export interface MotionStudioDeterministicRouteReviewV1 {
  schemaVersion: typeof MOTION_STUDIO_DETERMINISTIC_ROUTE_REVIEW_VERSION
  reviewId: ID
  snapshotAmendmentId: ID
  decision: 'approved'
  assessments: {
    intentAlignment: 'passed'
    referenceAdherence: 'passed'
    continuity: 'passed'
    visibleArtifacts: 'passed'
    safety: 'passed'
  }
  ownerApprovalStatementDigest: MotionStudioDigest
  qualityReport: { artifactId: ID; versionId: ID }
  notes: readonly string[]
}

/** Browser-safe approved replacement; provider IDs, costs and storage paths stay server-only. */
export interface MotionStudioDeterministicRouteAcceptanceDto extends MotionStudioLiveCandidateMediaDto {
  routeProfileId: 'motion_studio_deterministic_route_draw_v1'
  routePresetId: 'abstract_three_district_route_v1'
  replacementKind: 'gpt_image_then_remotion'
  replacedWorkItemKeys: readonly ID[]
  providerSubmissionMade: false
  newProviderCostIncurred: false
  baseSnapshotMutated: false
  baseWorkItemsMutated: false
  acceptedAt: ISODateString
}
