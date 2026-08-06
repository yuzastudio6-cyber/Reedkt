import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import {
  assertMotionStudioSynchronizedFoleyRouteReassessment,
  motionStudioSynchronizedFoleyRouteReassessmentV1Schema,
  type MotionStudioSynchronizedFoleyRouteReassessmentV1,
} from '../audio/synchronized-foley-route-reassessment'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSynchronizedFoleyD4Preflight,
  motionStudioSynchronizedFoleyD4PreflightV1Schema,
  type MotionStudioSynchronizedFoleyD4PreflightV1,
} from '../foley-production/synchronized-foley-d4-preflight'

export const MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_OPERATION_REQUIREMENT_VERSION =
  'motion-studio.canonical-backend-foley-operation-requirement.v1' as const

export const MOTION_STUDIO_REQUESTED_FOLEY_PROVIDER_OPERATION_ID =
  'provider.fal.generate_synchronized_foley_candidate.v1' as const
export const MOTION_STUDIO_REQUESTED_FOLEY_PROVIDER_BOUNDARY_PROFILE_ID =
  'fal_ai_mmaudio_v2_provider_boundary' as const
export const MOTION_STUDIO_REQUESTED_FOLEY_WORK_ITEM_TYPE =
  'generate_synchronized_foley_candidate' as const
export const MOTION_STUDIO_REQUESTED_FOLEY_WORKER_CLASS = 'provider_worker' as const
export const MOTION_STUDIO_REQUESTED_FOLEY_OUTPUT_ROLE =
  'provider_synchronized_audio_mp4' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const identitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestampSchema = z.string().datetime({ offset: true })

export const MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_ROUTE_BLOCKERS = [
  'immutable_model_revision_not_published',
  'exact_output_audio_codec_sample_rate_and_channels_require_private_probe',
  'enterprise_ready_or_excluded_model_designation_not_published',
  'commercial_rights_conflict_requires_provider_or_legal_attestation',
  'account_access_prepaid_funds_quota_and_rate_card_not_verified',
  'canonical_provider_dispatch_lease_single_use_and_cost_runtime_absent',
  'private_acl_expiration_ingest_and_cleanup_runtime_not_proven',
  'no_retry_no_fallback_and_unknown_outcome_runtime_not_proven',
  'actual_candidate_semantic_rights_and_human_reviews_absent',
] as const

export const motionStudioCanonicalBackendFoleyOperationRequirementV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_OPERATION_REQUIREMENT_VERSION),
  requirementId: identitySchema,
  createdAt: timestampSchema,
  intent: z.literal('synchronized_foley_candidate'),
  exactScope: z.object({
    workspaceId: identitySchema,
    projectId: identitySchema,
    editSessionId: identitySchema,
    productionId: identitySchema,
    approvedSnapshotId: identitySchema,
    approvedSnapshotDigest: digestSchema,
    approvedPlanReviewId: identitySchema,
    approvedCreditEstimateId: identitySchema,
    reservationId: identitySchema,
    soundEventId: identitySchema,
    sourceVideoAssetVersionId: identitySchema,
    sourceVideoContentDigest: digestSchema,
    pictureLockContentDigest: digestSchema,
    timingAuthorityDigest: digestSchema,
  }).strict(),
  sourceAuthority: z.object({
    routeReassessmentId: identitySchema,
    routeReassessmentDigest: digestSchema,
    capabilitySnapshotId: identitySchema,
    capabilitySnapshotDigest: digestSchema,
    routeEvidenceCapturedAt: timestampSchema,
    routeEvidenceExpiresAt: timestampSchema,
    preflightId: identitySchema,
    preflightDigest: digestSchema,
    requestTemplateId: identitySchema,
    requestTemplateDigest: digestSchema,
    routeBlockers: z.tuple([
      z.literal(MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_ROUTE_BLOCKERS[0]),
      z.literal(MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_ROUTE_BLOCKERS[1]),
      z.literal(MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_ROUTE_BLOCKERS[2]),
      z.literal(MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_ROUTE_BLOCKERS[3]),
      z.literal(MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_ROUTE_BLOCKERS[4]),
      z.literal(MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_ROUTE_BLOCKERS[5]),
      z.literal(MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_ROUTE_BLOCKERS[6]),
      z.literal(MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_ROUTE_BLOCKERS[7]),
      z.literal(MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_ROUTE_BLOCKERS[8]),
    ]).readonly(),
  }).strict(),
  requestedOperation: z.object({
    state: z.literal('motion_requirement_frozen_backend_admission_pending'),
    registryOwner: z.literal('canonical_backend'),
    providerOperationId: z.literal(MOTION_STUDIO_REQUESTED_FOLEY_PROVIDER_OPERATION_ID),
    providerBoundaryProfileId: z.literal(MOTION_STUDIO_REQUESTED_FOLEY_PROVIDER_BOUNDARY_PROFILE_ID),
    configuredCapabilityId: z.literal('mmaudio'),
    providerOwnerCode: z.literal('fal_ai'),
    providerServiceCode: z.literal('fal_model_apis'),
    providerRouteId: z.literal('fal_ai_mmaudio_v2'),
    providerModelId: z.literal('fal-ai/mmaudio-v2'),
    immutableModelRevision: z.null(),
    immutableModelRevisionRequiredBeforeAdmission: z.literal(true),
    endpoint: z.literal('https://queue.fal.run/fal-ai/mmaudio-v2'),
    method: z.literal('POST'),
    workItemType: z.literal(MOTION_STUDIO_REQUESTED_FOLEY_WORK_ITEM_TYPE),
    workerClass: z.literal(MOTION_STUDIO_REQUESTED_FOLEY_WORKER_CLASS),
    requestLifecycle: z.literal('asynchronous_queue_submit_status_result'),
    expectedOutputRole: z.literal(MOTION_STUDIO_REQUESTED_FOLEY_OUTPUT_ROLE),
    expectedArtifactKind: z.literal('private_provider_mmaudio_mp4_with_synchronized_audio_v1'),
    expectedMimeType: z.literal('video/mp4'),
    maximumOutputBytes: z.literal(67_108_864),
    providerRegistryEntryPresent: z.literal(false),
    currentReceiptAuthority: z.literal(false),
  }).strict(),
  asyncAttemptPolicy: z.object({
    oneCanonicalAttemptSpansAllLifecycleRequests: z.literal(true),
    maximumSecretPayloadReads: z.literal(1),
    maximumInputUploadRequests: z.literal(1),
    maximumGenerationSubmissions: z.literal(1),
    maximumStatusRequests: z.literal(12),
    maximumResultRequests: z.literal(1),
    maximumBinaryDownloadRequests: z.literal(1),
    maximumCancellationRequests: z.literal(1),
    maximumNetworkRequestsIncludingCancellation: z.literal(17),
    maximumAddressConnectionAttemptsPerRequest: z.literal(1),
    statusAndResultRequestsCreateNewGenerationAttempts: z.literal(false),
    cancellationCreatesNewGenerationAttempt: z.literal(false),
    resubmissionAfterPollOrResultFailureAllowed: z.literal(false),
    automaticRetriesAllowed: z.literal(false),
    automaticFallbacksAllowed: z.literal(false),
    addressFallbackAllowed: z.literal(false),
    proxyOrPacExecutionAllowed: z.literal(false),
    maximumRedirects: z.literal(0),
    maximumRequestBodyBytes: z.literal(16_384),
    maximumCapturedJsonResponseBytes: z.literal(1_048_576),
    maximumBinaryDownloadBytes: z.literal(67_108_864),
    maximumInputUploadBytes: z.null(),
    maximumElapsedMilliseconds: z.literal(180_000),
    statusPollIntervalMilliseconds: z.literal(10_000),
    unknownOutcomeMustReconcileBeforeAnyNewSubmission: z.literal(true),
    anyNewSubmissionRequiresFreshApprovedPackageAndAttempt: z.literal(true),
  }).strict(),
  dataPolicy: z.object({
    backendOnlyCredentialResolutionRequired: z.literal(true),
    credentialMayEnterQueueTaskOrBrowser: z.literal(false),
    rawPromptOrMediaMayEnterQueueTask: z.literal(false),
    exactOwnerOnlyBoundedSourceClipRequired: z.literal(true),
    inputUploadOwnerOnlyAclRequired: z.literal(true),
    outputOwnerOnlyAclRequired: z.literal(true),
    inputAndOutputExpirationSeconds: z.literal(3_600),
    requestPayloadStorageAllowed: z.literal(false),
    restrictedCustomerDataAllowed: z.literal(false),
    providerUrlMayBecomeDurableProjectReference: z.literal(false),
    immediatePrivateIngestAndChecksumReadbackRequired: z.literal(true),
  }).strict(),
  costBoundary: z.object({
    currency: z.literal('USD'),
    providerBillingUnit: z.literal('successful_output_second'),
    publicListRateMicrosPerSecond: z.literal(1_000),
    maximumAuthorizedProviderCostMicros: z.literal(30_000),
    immutableExecutionRateCardPresent: z.literal(false),
    maximumAuthorizedInfrastructureCostMicros: z.null(),
    maximumAuthorizedTotalInternalCostMicros: z.null(),
    providerAndInfrastructureCostMustRemainSeparate: z.literal(true),
    failedAndUnknownAttemptCostMustBeRetained: z.literal(true),
    providerUsageMustBeReconciledBeforeCompletion: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationAllowed: z.literal(false),
    billingAllowed: z.literal(false),
  }).strict(),
  downstreamNormalization: z.object({
    separateDependentAttemptRequired: z.literal(true),
    operationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
    recipeProfileId: z.literal('approved_synchronized_foley_candidate_normalization_v1'),
    expectedOutputRole: z.literal('extracted_normalized_foley_candidate'),
    expectedMimeType: z.literal('audio/wav'),
    expectedCodec: z.literal('pcm_s16le'),
    expectedSampleRateHertz: z.literal(48_000),
    expectedChannelCount: z.literal(2),
    providerAndNormalizationAttemptCostMayBeCollapsed: z.literal(false),
    providerContainerMayEnterReviewOrTimelineDirectly: z.literal(false),
  }).strict(),
  backendAdmission: z.object({
    motionRequirementFrozen: z.literal(true),
    canonicalProviderOperationAdmitted: z.literal(false),
    canonicalAsyncProviderLifecycleImplemented: z.literal(false),
    canonicalQueueClaimAndLeaseReady: z.literal(false),
    canonicalOneUseProviderDispatchReady: z.literal(false),
    canonicalRuntimeReceiptVerifierIntegrated: z.literal(false),
    installedWorkerResourceObserverProven: z.literal(false),
    providerTransportActivated: z.literal(false),
    actualProviderCandidatePresent: z.literal(false),
    executionAllowed: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  ownershipBoundary: z.object({
    motionOwnsRequestPolicyAndCandidateSemantics: z.literal(true),
    canonicalBackendOwnsRegistryQueueLeaseDispatchAndAttemptCost: z.literal(true),
    motionQueueCreated: z.literal(false),
    motionProviderRegistryCreated: z.literal(false),
    motionLeaseStoreCreated: z.literal(false),
    motionWorkerMeterCreated: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    credentialReadCount: z.literal(0),
    inputUploadCount: z.literal(0),
    externalRequestCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    statusRequestCount: z.literal(0),
    resultRequestCount: z.literal(0),
    binaryDownloadCount: z.literal(0),
    providerCandidateCount: z.literal(0),
    privateArtifactWriteCount: z.literal(0),
    providerCostMicros: z.literal(0),
    infrastructureCostMicros: z.literal(0),
    timelineMutationCount: z.literal(0),
    finalMixMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  requirementDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const requestCount =
    value.asyncAttemptPolicy.maximumInputUploadRequests +
    value.asyncAttemptPolicy.maximumGenerationSubmissions +
    value.asyncAttemptPolicy.maximumStatusRequests +
    value.asyncAttemptPolicy.maximumResultRequests +
    value.asyncAttemptPolicy.maximumBinaryDownloadRequests +
    value.asyncAttemptPolicy.maximumCancellationRequests
  if (requestCount !== value.asyncAttemptPolicy.maximumNetworkRequestsIncludingCancellation) {
    context.addIssue({
      code: 'custom',
      path: ['asyncAttemptPolicy', 'maximumNetworkRequestsIncludingCancellation'],
      message: 'The synchronized-Foley async network budget must equal its exact bounded lifecycle requests.',
    })
  }
  if (
    value.requestedOperation.providerOperationId.startsWith('tool.') ||
    value.downstreamNormalization.operationId.startsWith('provider.')
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Provider submission and deterministic normalization must remain separate operation families.',
    })
  }
})

export type MotionStudioCanonicalBackendFoleyOperationRequirementV1 =
  z.infer<typeof motionStudioCanonicalBackendFoleyOperationRequirementV1Schema>

export function createMotionStudioCanonicalBackendFoleyOperationRequirement(input: {
  routeReassessment: MotionStudioSynchronizedFoleyRouteReassessmentV1
  preflight: MotionStudioSynchronizedFoleyD4PreflightV1
  createdAt: string
}): MotionStudioCanonicalBackendFoleyOperationRequirementV1 {
  const route = motionStudioSynchronizedFoleyRouteReassessmentV1Schema.parse(input.routeReassessment)
  const preflight = motionStudioSynchronizedFoleyD4PreflightV1Schema.parse(input.preflight)
  assertMotionStudioSynchronizedFoleyRouteReassessment(route)
  assertMotionStudioSynchronizedFoleyD4Preflight(preflight)
  const createdAt = canonicalIso(input.createdAt)
  assertSourceLineage({ route, preflight, createdAt })

  const base = {
    schemaVersion: MOTION_STUDIO_CANONICAL_BACKEND_FOLEY_OPERATION_REQUIREMENT_VERSION,
    requirementId: `ms012d-canonical-backend-foley-operation-${preflight.preflightDigest.slice(0, 16)}`,
    createdAt,
    intent: 'synchronized_foley_candidate' as const,
    exactScope: {
      workspaceId: preflight.workspaceId,
      projectId: preflight.projectId,
      editSessionId: preflight.editSessionId,
      productionId: preflight.productionId,
      approvedSnapshotId: preflight.approvedSnapshotId,
      approvedSnapshotDigest: preflight.approvedSnapshotDigest,
      approvedPlanReviewId: preflight.approvedPlanReviewId,
      approvedCreditEstimateId: preflight.approvedCreditEstimateId,
      reservationId: preflight.activeNoncommercialTestReservationId,
      soundEventId: preflight.soundEventId,
      sourceVideoAssetVersionId: preflight.sourceVideoAssetVersionId,
      sourceVideoContentDigest: preflight.sourceVideoContentDigest,
      pictureLockContentDigest: preflight.pictureLockContentDigest,
      timingAuthorityDigest: preflight.timingAuthorityDigest,
    },
    sourceAuthority: {
      routeReassessmentId: route.reassessmentId,
      routeReassessmentDigest: route.evidenceDigest,
      capabilitySnapshotId: route.capabilitySnapshot.capabilitySnapshotId,
      capabilitySnapshotDigest: route.capabilitySnapshot.evidenceDigest,
      routeEvidenceCapturedAt: route.capturedAt,
      routeEvidenceExpiresAt: route.expiresAt,
      preflightId: preflight.preflightId,
      preflightDigest: preflight.preflightDigest,
      requestTemplateId: preflight.requestTemplate.requestTemplateId,
      requestTemplateDigest: preflight.requestTemplate.requestTemplateDigest,
      routeBlockers: [...route.blockingGates],
    },
    requestedOperation: {
      state: 'motion_requirement_frozen_backend_admission_pending' as const,
      registryOwner: 'canonical_backend' as const,
      providerOperationId: MOTION_STUDIO_REQUESTED_FOLEY_PROVIDER_OPERATION_ID,
      providerBoundaryProfileId: MOTION_STUDIO_REQUESTED_FOLEY_PROVIDER_BOUNDARY_PROFILE_ID,
      configuredCapabilityId: 'mmaudio' as const,
      providerOwnerCode: route.candidateRoute.providerOwnerCode,
      providerServiceCode: route.candidateRoute.serviceCode,
      providerRouteId: route.candidateRoute.providerRouteId,
      providerModelId: route.candidateRoute.modelId,
      immutableModelRevision: route.candidateRoute.immutableModelRevision,
      immutableModelRevisionRequiredBeforeAdmission: true as const,
      endpoint: route.candidateRoute.endpoint,
      method: route.candidateRoute.method,
      workItemType: MOTION_STUDIO_REQUESTED_FOLEY_WORK_ITEM_TYPE,
      workerClass: MOTION_STUDIO_REQUESTED_FOLEY_WORKER_CLASS,
      requestLifecycle: route.behavior.requestLifecycle,
      expectedOutputRole: MOTION_STUDIO_REQUESTED_FOLEY_OUTPUT_ROLE,
      expectedArtifactKind: 'private_provider_mmaudio_mp4_with_synchronized_audio_v1' as const,
      expectedMimeType: 'video/mp4' as const,
      maximumOutputBytes: preflight.transportBudgetProposal.maximumBinaryDownloadBytes,
      providerRegistryEntryPresent: false as const,
      currentReceiptAuthority: false as const,
    },
    asyncAttemptPolicy: {
      oneCanonicalAttemptSpansAllLifecycleRequests: true as const,
      maximumSecretPayloadReads: preflight.transportBudgetProposal.maximumSecretPayloadReads,
      maximumInputUploadRequests: preflight.transportBudgetProposal.maximumInputUploadRequests,
      maximumGenerationSubmissions: preflight.transportBudgetProposal.maximumProviderSubmissions,
      maximumStatusRequests: preflight.transportBudgetProposal.maximumStatusRequests,
      maximumResultRequests: preflight.transportBudgetProposal.maximumResultRequests,
      maximumBinaryDownloadRequests: preflight.transportBudgetProposal.maximumBinaryDownloadRequests,
      maximumCancellationRequests: preflight.transportBudgetProposal.maximumCancellationRequests,
      maximumNetworkRequestsIncludingCancellation:
        preflight.transportBudgetProposal.maximumNetworkRequestsIncludingCancellation,
      maximumAddressConnectionAttemptsPerRequest:
        preflight.transportBudgetProposal.maximumAddressConnectionAttemptsPerRequest,
      statusAndResultRequestsCreateNewGenerationAttempts: false as const,
      cancellationCreatesNewGenerationAttempt: false as const,
      resubmissionAfterPollOrResultFailureAllowed: false as const,
      automaticRetriesAllowed: false as const,
      automaticFallbacksAllowed: false as const,
      addressFallbackAllowed: preflight.transportBudgetProposal.addressFallbackAllowed,
      proxyOrPacExecutionAllowed: preflight.transportBudgetProposal.proxyOrPacExecutionAllowed,
      maximumRedirects: preflight.transportBudgetProposal.maximumRedirects,
      maximumRequestBodyBytes: preflight.transportBudgetProposal.maximumRequestBodyBytes,
      maximumCapturedJsonResponseBytes:
        preflight.transportBudgetProposal.maximumCapturedJsonResponseBytes,
      maximumBinaryDownloadBytes: preflight.transportBudgetProposal.maximumBinaryDownloadBytes,
      maximumInputUploadBytes: preflight.transportBudgetProposal.maximumInputUploadBytes,
      maximumElapsedMilliseconds: preflight.transportBudgetProposal.maximumElapsedMilliseconds,
      statusPollIntervalMilliseconds: preflight.transportBudgetProposal.statusPollIntervalMilliseconds,
      unknownOutcomeMustReconcileBeforeAnyNewSubmission: true as const,
      anyNewSubmissionRequiresFreshApprovedPackageAndAttempt: true as const,
    },
    dataPolicy: {
      backendOnlyCredentialResolutionRequired: true as const,
      credentialMayEnterQueueTaskOrBrowser: false as const,
      rawPromptOrMediaMayEnterQueueTask: false as const,
      exactOwnerOnlyBoundedSourceClipRequired: true as const,
      inputUploadOwnerOnlyAclRequired: true as const,
      outputOwnerOnlyAclRequired: true as const,
      inputAndOutputExpirationSeconds: route.dataPolicy.requiredObjectExpirationSeconds,
      requestPayloadStorageAllowed: false as const,
      restrictedCustomerDataAllowed: route.dataPolicy.restrictedCustomerDataAllowed,
      providerUrlMayBecomeDurableProjectReference:
        route.outputContract.providerUrlMayBecomeDurableProjectReference,
      immediatePrivateIngestAndChecksumReadbackRequired: true as const,
    },
    costBoundary: {
      currency: preflight.costBudgetProposal.currency,
      providerBillingUnit: preflight.costBudgetProposal.providerBillingUnit,
      publicListRateMicrosPerSecond: preflight.costBudgetProposal.publicListRateMicrosPerSecond,
      maximumAuthorizedProviderCostMicros:
        preflight.costBudgetProposal.maximumAuthorizedProviderCostMicros,
      immutableExecutionRateCardPresent: false as const,
      maximumAuthorizedInfrastructureCostMicros: null,
      maximumAuthorizedTotalInternalCostMicros: null,
      providerAndInfrastructureCostMustRemainSeparate: true as const,
      failedAndUnknownAttemptCostMustBeRetained: true as const,
      providerUsageMustBeReconciledBeforeCompletion: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationAllowed: false as const,
      billingAllowed: false as const,
    },
    downstreamNormalization: {
      separateDependentAttemptRequired: true as const,
      operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1' as const,
      recipeProfileId: 'approved_synchronized_foley_candidate_normalization_v1' as const,
      expectedOutputRole: 'extracted_normalized_foley_candidate' as const,
      expectedMimeType: 'audio/wav' as const,
      expectedCodec: 'pcm_s16le' as const,
      expectedSampleRateHertz: 48_000 as const,
      expectedChannelCount: 2 as const,
      providerAndNormalizationAttemptCostMayBeCollapsed: false as const,
      providerContainerMayEnterReviewOrTimelineDirectly: false as const,
    },
    backendAdmission: {
      motionRequirementFrozen: true as const,
      canonicalProviderOperationAdmitted: false as const,
      canonicalAsyncProviderLifecycleImplemented: false as const,
      canonicalQueueClaimAndLeaseReady: false as const,
      canonicalOneUseProviderDispatchReady: false as const,
      canonicalRuntimeReceiptVerifierIntegrated: false as const,
      installedWorkerResourceObserverProven: false as const,
      providerTransportActivated: false as const,
      actualProviderCandidatePresent: false as const,
      executionAllowed: false as const,
      productReady: false as const,
    },
    ownershipBoundary: {
      motionOwnsRequestPolicyAndCandidateSemantics: true as const,
      canonicalBackendOwnsRegistryQueueLeaseDispatchAndAttemptCost: true as const,
      motionQueueCreated: false as const,
      motionProviderRegistryCreated: false as const,
      motionLeaseStoreCreated: false as const,
      motionWorkerMeterCreated: false as const,
    },
    sideEffects: {
      credentialReadCount: 0 as const,
      inputUploadCount: 0 as const,
      externalRequestCount: 0 as const,
      providerSubmissionCount: 0 as const,
      statusRequestCount: 0 as const,
      resultRequestCount: 0 as const,
      binaryDownloadCount: 0 as const,
      providerCandidateCount: 0 as const,
      privateArtifactWriteCount: 0 as const,
      providerCostMicros: 0 as const,
      infrastructureCostMicros: 0 as const,
      timelineMutationCount: 0 as const,
      finalMixMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  return deepFreeze(motionStudioCanonicalBackendFoleyOperationRequirementV1Schema.parse({
    ...base,
    requirementDigest: sha256CanonicalJson(base),
  }))
}

export function assertMotionStudioCanonicalBackendFoleyOperationRequirement(
  input: MotionStudioCanonicalBackendFoleyOperationRequirementV1,
): MotionStudioCanonicalBackendFoleyOperationRequirementV1 {
  const parsed = motionStudioCanonicalBackendFoleyOperationRequirementV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.requirementDigest
  if (sha256CanonicalJson(base) !== parsed.requirementDigest) {
    blocked('Canonical backend Foley operation requirement failed immutable digest verification.')
  }
  return deepFreeze(parsed)
}

function assertSourceLineage(input: {
  route: MotionStudioSynchronizedFoleyRouteReassessmentV1
  preflight: MotionStudioSynchronizedFoleyD4PreflightV1
  createdAt: string
}): void {
  const { route, preflight, createdAt } = input
  if (createdAt < preflight.createdAt || createdAt >= route.expiresAt) {
    blocked('Canonical backend Foley operation requirement must use current route and preflight evidence.')
  }
  if (
    route.workspaceId !== preflight.workspaceId ||
    route.projectId !== preflight.projectId ||
    route.editSessionId !== preflight.editSessionId ||
    route.productionId !== preflight.productionId ||
    preflight.routeReassessmentId !== route.reassessmentId ||
    preflight.routeReassessmentDigest !== route.evidenceDigest ||
    preflight.capabilitySnapshotId !== route.capabilitySnapshot.capabilitySnapshotId ||
    preflight.capabilitySnapshotDigest !== route.capabilitySnapshot.evidenceDigest
  ) {
    blocked('Canonical backend Foley operation requirement lost exact route, preflight, or production lineage.')
  }
  if (
    route.candidateRoute.immutableModelRevision !== null ||
    route.canonicalExecutionDisposition !== 'route_closed' ||
    route.blockingGates.length !== 9 ||
    preflight.providerExecutionAllowed
  ) {
    blocked('Canonical backend Foley operation requirement may not promote the closed Fal route.')
  }
}

function canonicalIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Canonical backend Foley operation requirement time must be canonical ISO-8601.')
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_canonical_backend_foley_operation_requirement',
  })
}
