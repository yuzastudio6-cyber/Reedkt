import { z } from 'zod'

import {
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_BOUNDARY_PROFILE_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID,
  CANONICAL_PROVIDER_OPERATION_REGISTRY_V3_VERSION,
  resolveCanonicalProviderOperationV3,
} from '../../edit-architecture/canonical-provider-work-authority'
import {
  resolveCanonicalProviderLifecyclePolicy,
} from '../../edit-architecture/canonical-provider-lifecycle-policy'
import {
  projectCanonicalSynchronizedFoleyConsumerReceipt,
} from '../../services/canonical-private-synchronized-foley-consumer-receipt-service'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

export const MOTION_STUDIO_CANONICAL_FOLEY_LIFECYCLE_ADMISSION_VERSION =
  'motion-studio.canonical-foley-lifecycle-admission.v1' as const

export const MOTION_STUDIO_CANONICAL_FOLEY_LIFECYCLE_SOURCE = Object.freeze({
  upstreamCommit: 'c603543b1240eef9b40bd0c6b46e01f65f1c113d',
  upstreamTree: 'c8b5e7bd6f30916c49edc79fd6df3a98035caa21',
  receiptSchemaSha256:
    '20f0e7ddcdbcd09deae39d4f2ea8ed201c6c8926a1c25c8043cf34ade94dd87e',
  receiptServiceSha256:
    '78c69bc9ecb24f2ba881087cfb54e5fddcc9fb13cb29b747b1aa267ec3f99eb1',
  lifecycleServiceSha256:
    '14999199bb812713e103badc05e60d4ce9375232d5a1bdc7e4c03639b82da7b7',
  lifecyclePolicySha256:
    '4a29f73c1f9474b097bed26ab2b783ab44f952701b8077e1de45a58d7e70d36c',
  candidateStoreSha256:
    'f39cfd8828b698cc7b5714c91cf6d24260d152029d3782451f55f434c68084c6',
  providerAttemptCostSha256:
    '8478497a67421cee3792722d604fe1f8befbe17e683486a8ead4c5df54f1296e',
  verificationRecordSha256:
    'e1a4a83bb21d5c6b4bf943c66abd801acaaa469d8c509f4c5c32b9eaf15633e3',
})

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const commit = z.string().regex(/^[a-f0-9]{40}$/u)
const timestamp = z.string().datetime({ offset: true })

export const motionStudioCanonicalFoleyLifecycleAdmissionV1Schema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CANONICAL_FOLEY_LIFECYCLE_ADMISSION_VERSION,
  ),
  recordedAt: timestamp,
  state: z.literal(
    'canonical_private_injected_admission_consumed_transport_blocked',
  ),
  source: z.object({
    upstreamCommit: commit,
    upstreamTree: commit,
    receiptSchemaSha256: sha256,
    receiptServiceSha256: sha256,
    lifecycleServiceSha256: sha256,
    lifecyclePolicySha256: sha256,
    candidateStoreSha256: sha256,
    providerAttemptCostSha256: sha256,
    verificationRecordSha256: sha256,
    exactUpstreamSourcesIntegrated: z.literal(true),
  }).strict(),
  operation: z.object({
    registryVersion: z.literal(CANONICAL_PROVIDER_OPERATION_REGISTRY_V3_VERSION),
    operationId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID),
    intent: z.literal('synchronized_foley_candidate'),
    providerBoundaryProfileId: z.literal(
      CANONICAL_FAL_SYNCHRONIZED_FOLEY_BOUNDARY_PROFILE_ID,
    ),
    providerRouteId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID),
    providerModelId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID),
    expectedWorkItemType: z.literal('generate_synchronized_foley_candidate'),
    expectedWorkerClass: z.literal('provider_worker'),
    expectedOutputRole: z.literal('provider_synchronized_audio_mp4'),
    expectedOutputMimeType: z.literal('video/mp4'),
    maximumOutputBytes: z.literal(67_108_864),
    profileHash: sha256,
    lifecyclePolicyHash: sha256,
  }).strict(),
  lifecycle: z.object({
    canonicalPackageQueueClaimLeaseReused: z.literal(true),
    oneUseProviderDispatchReused: z.literal(true),
    createOnlyCandidateStoreReused: z.literal(true),
    providerAndInfrastructureCostStoresReused: z.literal(true),
    failedAndUnknownAttemptCostRetained: z.literal(true),
    exactUnknownOutcomeReconciliationRequired: z.literal(true),
    sourceVerifiedConsumerReceiptProjectorReused: z.literal(true),
    maximumGenerationSubmissions: z.literal(1),
    maximumLifecycleHttpRequests: z.literal(17),
    retriesAllowed: z.literal(false),
    fallbacksAllowed: z.literal(false),
    redirectsAllowed: z.literal(false),
  }).strict(),
  downstreamNormalization: z.object({
    operationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
    profileId: z.literal(
      'approved_synchronized_foley_candidate_normalization_v1',
    ),
    separateCanonicalAttemptRequired: z.literal(true),
  }).strict(),
  closure: z.object({
    backendProviderOperationAdmitted: z.literal(true),
    motionOperationIdentityConsumable: z.literal(true),
    historicalOperationRequirementResolved: z.literal(true),
    duplicateMotionQueueCreated: z.literal(false),
    duplicateMotionRegistryCreated: z.literal(false),
    duplicateMotionLeaseOrDispatchCreated: z.literal(false),
    duplicateMotionCandidateOrCostStoreCreated: z.literal(false),
  }).strict(),
  boundaries: z.object({
    evidenceClass: z.literal('private_injected_nonprovider_test'),
    promotionClass: z.literal('non_promotable_private_injected'),
    immutableProviderRevisionQualified: z.literal(false),
    exactProductionRateAuthorityQualified: z.literal(false),
    providerAccountAndRightsQualified: z.literal(false),
    providerTransportActivated: z.literal(false),
    canonicalBackendVerifiedRuntime: z.literal(false),
    actualProviderCandidatePresent: z.literal(false),
    actualMotionReceiptPresent: z.literal(false),
    normalizationAuthorizedForActualCandidate: z.literal(false),
    semanticAndRightsReviewComplete: z.literal(false),
    automaticSelectionAllowed: z.literal(false),
    finalMixAllowed: z.literal(false),
    timelineMutationAllowed: z.literal(false),
    renderOrExportAllowed: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  commercialBoundary: z.object({
    internalProviderAndInfrastructureCostOnly: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    externalRequestCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    providerCandidateCount: z.literal(0),
    privateArtifactWriteCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  admissionDigest: sha256,
}).strict()

export type MotionStudioCanonicalFoleyLifecycleAdmissionV1 = z.infer<
  typeof motionStudioCanonicalFoleyLifecycleAdmissionV1Schema
>

export function createMotionStudioCanonicalFoleyLifecycleAdmission(input: {
  recordedAt: string
}): MotionStudioCanonicalFoleyLifecycleAdmissionV1 {
  const recordedAt = canonicalTimestamp(input.recordedAt)
  const operation = resolveCanonicalProviderOperationV3(
    CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  )
  const lifecyclePolicy = resolveCanonicalProviderLifecyclePolicy(
    CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  )
  if (typeof projectCanonicalSynchronizedFoleyConsumerReceipt !== 'function') {
    throw blocked('Canonical synchronized-Foley receipt projector is unavailable.')
  }
  const base = {
    schemaVersion: MOTION_STUDIO_CANONICAL_FOLEY_LIFECYCLE_ADMISSION_VERSION,
    recordedAt,
    state:
      'canonical_private_injected_admission_consumed_transport_blocked' as const,
    source: {
      ...MOTION_STUDIO_CANONICAL_FOLEY_LIFECYCLE_SOURCE,
      exactUpstreamSourcesIntegrated: true as const,
    },
    operation: {
      registryVersion: operation.schemaVersion,
      operationId: operation.operationId,
      intent: operation.intent,
      providerBoundaryProfileId: operation.providerBoundaryProfileId,
      providerRouteId: operation.providerRouteId,
      providerModelId: operation.providerModelId,
      expectedWorkItemType: operation.expectedWorkItemType,
      expectedWorkerClass: operation.expectedWorkerClass,
      expectedOutputRole: operation.expectedOutput.role,
      expectedOutputMimeType: operation.expectedOutput.contentType,
      maximumOutputBytes: operation.expectedOutput.maximumByteLength,
      profileHash: operation.profileHash,
      lifecyclePolicyHash: lifecyclePolicy.policyHash,
    },
    lifecycle: {
      canonicalPackageQueueClaimLeaseReused: true as const,
      oneUseProviderDispatchReused: true as const,
      createOnlyCandidateStoreReused: true as const,
      providerAndInfrastructureCostStoresReused: true as const,
      failedAndUnknownAttemptCostRetained: true as const,
      exactUnknownOutcomeReconciliationRequired: true as const,
      sourceVerifiedConsumerReceiptProjectorReused: true as const,
      maximumGenerationSubmissions:
        lifecyclePolicy.requestCeilings.generationSubmissionCount,
      maximumLifecycleHttpRequests:
        lifecyclePolicy.requestCeilings.totalLifecycleHttpRequestCount,
      retriesAllowed: false as const,
      fallbacksAllowed: false as const,
      redirectsAllowed: false as const,
    },
    downstreamNormalization: {
      operationId:
        lifecyclePolicy.downstreamNormalization!.operationId,
      profileId: lifecyclePolicy.downstreamNormalization!.fixedProfileId,
      separateCanonicalAttemptRequired: true as const,
    },
    closure: {
      backendProviderOperationAdmitted: true as const,
      motionOperationIdentityConsumable: true as const,
      historicalOperationRequirementResolved: true as const,
      duplicateMotionQueueCreated: false as const,
      duplicateMotionRegistryCreated: false as const,
      duplicateMotionLeaseOrDispatchCreated: false as const,
      duplicateMotionCandidateOrCostStoreCreated: false as const,
    },
    boundaries: {
      evidenceClass: 'private_injected_nonprovider_test' as const,
      promotionClass: 'non_promotable_private_injected' as const,
      immutableProviderRevisionQualified: false as const,
      exactProductionRateAuthorityQualified: false as const,
      providerAccountAndRightsQualified: false as const,
      providerTransportActivated: false as const,
      canonicalBackendVerifiedRuntime: false as const,
      actualProviderCandidatePresent: false as const,
      actualMotionReceiptPresent: false as const,
      normalizationAuthorizedForActualCandidate: false as const,
      semanticAndRightsReviewComplete: false as const,
      automaticSelectionAllowed: false as const,
      finalMixAllowed: false as const,
      timelineMutationAllowed: false as const,
      renderOrExportAllowed: false as const,
      productReady: false as const,
    },
    commercialBoundary: {
      internalProviderAndInfrastructureCostOnly: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    sideEffects: {
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      providerCandidateCount: 0 as const,
      privateArtifactWriteCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  return deepFreeze(motionStudioCanonicalFoleyLifecycleAdmissionV1Schema.parse({
    ...base,
    admissionDigest: sha256CanonicalJson(base),
  }))
}

export function assertMotionStudioCanonicalFoleyLifecycleAdmission(
  input: MotionStudioCanonicalFoleyLifecycleAdmissionV1,
): MotionStudioCanonicalFoleyLifecycleAdmissionV1 {
  const parsed = motionStudioCanonicalFoleyLifecycleAdmissionV1Schema.parse(input)
  const unsigned = { ...parsed } as Record<string, unknown>
  delete unsigned.admissionDigest
  if (sha256CanonicalJson(unsigned) !== parsed.admissionDigest) {
    throw blocked('Motion synchronized-Foley admission digest changed.')
  }
  return deepFreeze(parsed)
}

function canonicalTimestamp(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) {
    throw new ApiError('VALIDATION_FAILED', 'Admission time must be canonical ISO-8601.', 400)
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_canonical_foley_lifecycle_admission',
  })
}
