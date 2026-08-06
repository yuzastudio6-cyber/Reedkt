import { z } from 'zod'

import {
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_BOUNDARY_PROFILE_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_BOUNDARY_PROFILE_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_MODEL_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_ROUTE_ID,
  CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
  CANONICAL_PROVIDER_WORK_AUTHORIZATION_VERSION,
  resolveCanonicalProviderOperation,
  resolveCanonicalProviderOperationV2,
  resolveCanonicalProviderOperationV4,
} from './canonical-provider-work-authority'
export {
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_BOUNDARY_PROFILE_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_BOUNDARY_PROFILE_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_MODEL_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_ROUTE_ID,
} from './canonical-provider-work-authority'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_PROVIDER_LIFECYCLE_POLICY_VERSION =
  'canonical-provider-lifecycle-policy-v2' as const
export const CANONICAL_FAL_SYNCHRONIZED_FOLEY_NORMALIZATION_OPERATION_ID =
  'tool.ffmpeg.execute_approved_media_recipe.v1' as const
export const CANONICAL_FAL_SYNCHRONIZED_FOLEY_NORMALIZATION_PROFILE_ID =
  'approved_synchronized_foley_candidate_normalization_v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const boundedCount = z.number().int().nonnegative().max(32)

export const canonicalProviderLifecycleRequestCountsSchema = z.object({
  privateInputUploadCount: boundedCount,
  generationSubmissionCount: boundedCount,
  statusReadCount: boundedCount,
  resultReadCount: boundedCount,
  binaryDownloadCount: boundedCount,
  cancellationCount: boundedCount,
  totalLifecycleHttpRequestCount: boundedCount,
}).strict().superRefine((value, context) => {
  const total = value.privateInputUploadCount + value.generationSubmissionCount +
    value.statusReadCount + value.resultReadCount + value.binaryDownloadCount +
    value.cancellationCount
  if (total !== value.totalLifecycleHttpRequestCount) {
    context.addIssue({
      code: 'custom',
      message: 'Provider lifecycle HTTP request counts do not reconcile.',
    })
  }
})

export const canonicalProviderLifecyclePolicySchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVIDER_LIFECYCLE_POLICY_VERSION),
  operationId: identity,
  intent: z.enum([
    'generated_music_candidate',
    'synchronized_foley_candidate',
    'storytelling_speech_candidate',
    'visual_calibration_candidate',
  ]),
  providerBoundaryProfileId: identity,
  providerRouteId: identity,
  providerModelId: identity,
  immutableProviderRevision: identity.nullable(),
  expectedWorkItemType: identity,
  expectedWorkerClass: identity,
  expectedOutput: z.object({
    role: identity,
    artifactType: identity,
    contentType: z.enum([
      'audio/wav',
      'video/mp4',
      'audio/mpeg',
      'application/json',
    ]),
    maximumByteLength: z.number().int().positive().max(256 * 1024 * 1024),
    privateCreateOnlyRequired: z.literal(true),
    checksumReadbackRequired: z.literal(true),
  }).strict(),
  expectedOutputs: z.array(z.object({
    role: identity,
    artifactType: identity,
    contentType: z.enum([
      'audio/wav',
      'video/mp4',
      'audio/mpeg',
      'application/json',
    ]),
    maximumByteLength: z.number().int().positive().max(256 * 1024 * 1024),
    privateCreateOnlyRequired: z.literal(true),
    checksumReadbackRequired: z.literal(true),
  }).strict()).min(1).max(8).optional(),
  requestCeilings: canonicalProviderLifecycleRequestCountsSchema,
  requestRules: z.object({
    legacyMaximumProviderRequestsSemantic: z.literal(
      'generation_submission_count_not_total_http_requests',
    ),
    maximumRetries: z.literal(0),
    maximumFallbacks: z.literal(0),
    maximumRedirects: z.literal(0),
    addressFallbackAllowed: z.literal(false),
    proxyOrPacAllowed: z.literal(false),
    resubmissionWithinAttemptAllowed: z.literal(false),
    statusResultAndCancelContinueSameAttempt: z.literal(true),
    unknownOutcomeRequiresReconciliation: z.literal(true),
    newSubmissionRequiresFreshApprovedPackageAndAttempt: z.literal(true),
  }).strict(),
  legacyCompatibility: z.object({
    legacyAuthorizationVersion: z.literal(
      CANONICAL_PROVIDER_WORK_AUTHORIZATION_VERSION,
    ).nullable(),
    legacyProfileHash: sha256.nullable(),
    legacyHistoryPreserved: z.literal(true),
  }).strict(),
  downstreamNormalization: z.object({
    operationId: identity,
    fixedProfileId: identity,
    separateCanonicalAttemptRequired: z.literal(true),
  }).strict().nullable(),
  qualification: z.object({
    operationIdentityFrozen: z.literal(true),
    immutableProviderRevisionQualified: z.boolean(),
    providerRateAuthorityQualified: z.boolean(),
    canonicalAuthorizationIssuanceAllowed: z.boolean(),
    providerTransportActivated: z.literal(false),
    productionReady: z.literal(false),
    blockingGates: z.array(identity).max(8),
  }).strict(),
  policyHash: sha256,
}).strict().superRefine((value, context) => {
  const foley = value.operationId === CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID
  const visualCalibration = value.operationId ===
    CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID
  if (
    (value.qualification.canonicalAuthorizationIssuanceAllowed &&
      (!value.qualification.immutableProviderRevisionQualified ||
        !value.qualification.providerRateAuthorityQualified)) ||
    ((foley || visualCalibration) && (
      value.immutableProviderRevision !== null ||
      value.qualification.immutableProviderRevisionQualified ||
      value.qualification.providerRateAuthorityQualified ||
      value.qualification.canonicalAuthorizationIssuanceAllowed
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Provider lifecycle qualification state is inconsistent.',
    })
  }
})

export type CanonicalProviderLifecyclePolicy = z.infer<
  typeof canonicalProviderLifecyclePolicySchema
>

export function createCanonicalProviderLifecyclePolicyCatalog(): readonly [
  CanonicalProviderLifecyclePolicy,
  CanonicalProviderLifecyclePolicy,
  CanonicalProviderLifecyclePolicy,
  CanonicalProviderLifecyclePolicy,
] {
  const legacy = resolveCanonicalProviderOperation(
    CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
  )
  const lyria = finalizePolicy({
    schemaVersion: CANONICAL_PROVIDER_LIFECYCLE_POLICY_VERSION,
    operationId: legacy.operationId,
    intent: legacy.intent,
    providerBoundaryProfileId: legacy.providerBoundaryProfileId,
    providerRouteId: legacy.providerRouteId,
    providerModelId: legacy.providerModelId,
    immutableProviderRevision: legacy.providerModelId,
    expectedWorkItemType: legacy.expectedWorkItemType,
    expectedWorkerClass: legacy.expectedWorkerClass,
    expectedOutput: {
      role: legacy.expectedOutput.role,
      artifactType: legacy.expectedOutput.artifactType,
      contentType: legacy.expectedOutput.contentType,
      maximumByteLength: legacy.expectedOutput.maximumByteLength,
      privateCreateOnlyRequired: true as const,
      checksumReadbackRequired: true as const,
    },
    requestCeilings: requestCounts({ generationSubmissionCount: 1 }),
    requestRules: requestRules(),
    legacyCompatibility: {
      legacyAuthorizationVersion: CANONICAL_PROVIDER_WORK_AUTHORIZATION_VERSION,
      legacyProfileHash: legacy.profileHash,
      legacyHistoryPreserved: true as const,
    },
    downstreamNormalization: null,
    qualification: {
      operationIdentityFrozen: true as const,
      immutableProviderRevisionQualified: true,
      providerRateAuthorityQualified: true,
      canonicalAuthorizationIssuanceAllowed: true,
      providerTransportActivated: false as const,
      productionReady: false as const,
      blockingGates: [
        'provider_transport_qualification',
        'canonical_backend_runtime_release',
      ],
    },
  })
  const foley = finalizePolicy({
    schemaVersion: CANONICAL_PROVIDER_LIFECYCLE_POLICY_VERSION,
    operationId: CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
    intent: 'synchronized_foley_candidate' as const,
    providerBoundaryProfileId:
      CANONICAL_FAL_SYNCHRONIZED_FOLEY_BOUNDARY_PROFILE_ID,
    providerRouteId: CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID,
    providerModelId: CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID,
    immutableProviderRevision: null,
    expectedWorkItemType: 'generate_synchronized_foley_candidate',
    expectedWorkerClass: 'provider_worker',
    expectedOutput: {
      role: 'provider_synchronized_audio_mp4',
      artifactType: 'provider_synchronized_audio_mp4',
      contentType: 'video/mp4' as const,
      maximumByteLength: 67_108_864,
      privateCreateOnlyRequired: true as const,
      checksumReadbackRequired: true as const,
    },
    requestCeilings: requestCounts({
      privateInputUploadCount: 1,
      generationSubmissionCount: 1,
      statusReadCount: 12,
      resultReadCount: 1,
      binaryDownloadCount: 1,
      cancellationCount: 1,
    }),
    requestRules: requestRules(),
    legacyCompatibility: {
      legacyAuthorizationVersion: null,
      legacyProfileHash: null,
      legacyHistoryPreserved: true as const,
    },
    downstreamNormalization: {
      operationId: CANONICAL_FAL_SYNCHRONIZED_FOLEY_NORMALIZATION_OPERATION_ID,
      fixedProfileId: CANONICAL_FAL_SYNCHRONIZED_FOLEY_NORMALIZATION_PROFILE_ID,
      separateCanonicalAttemptRequired: true as const,
    },
    qualification: {
      operationIdentityFrozen: true as const,
      immutableProviderRevisionQualified: false,
      providerRateAuthorityQualified: false,
      canonicalAuthorizationIssuanceAllowed: false,
      providerTransportActivated: false as const,
      productionReady: false as const,
      blockingGates: [
        'immutable_provider_revision_qualification',
        'immutable_provider_rate_authority',
        'canonical_provider_authorization_v3_production_qualification',
        'provider_transport_qualification',
      ],
    },
  })
  const speechProfile = resolveCanonicalProviderOperationV2(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  )
  const speech = finalizePolicy({
    schemaVersion: CANONICAL_PROVIDER_LIFECYCLE_POLICY_VERSION,
    operationId: speechProfile.operationId,
    intent: speechProfile.intent,
    providerBoundaryProfileId: speechProfile.providerBoundaryProfileId,
    providerRouteId: speechProfile.providerRouteId,
    providerModelId: speechProfile.providerModelId,
    immutableProviderRevision: speechProfile.immutableProviderRevision,
    expectedWorkItemType: speechProfile.expectedWorkItemType,
    expectedWorkerClass: speechProfile.expectedWorkerClass,
    expectedOutput: {
      role: speechProfile.expectedOutputs[0].role,
      artifactType: speechProfile.expectedOutputs[0].artifactType,
      contentType: speechProfile.expectedOutputs[0].contentType,
      maximumByteLength: speechProfile.expectedOutputs[0].maximumByteLength,
      privateCreateOnlyRequired: true as const,
      checksumReadbackRequired: true as const,
    },
    expectedOutputs: speechProfile.expectedOutputs.map((output) => ({
      role: output.role,
      artifactType: output.artifactType,
      contentType: output.contentType,
      maximumByteLength: output.maximumByteLength,
      privateCreateOnlyRequired: true as const,
      checksumReadbackRequired: true as const,
    })),
    requestCeilings: requestCounts({ generationSubmissionCount: 1 }),
    requestRules: requestRules(),
    legacyCompatibility: {
      legacyAuthorizationVersion: null,
      legacyProfileHash: null,
      legacyHistoryPreserved: true as const,
    },
    downstreamNormalization: speechProfile.downstreamNormalization,
    qualification: {
      operationIdentityFrozen: true as const,
      immutableProviderRevisionQualified: false,
      providerRateAuthorityQualified: false,
      canonicalAuthorizationIssuanceAllowed: false,
      providerTransportActivated: false as const,
      productionReady: false as const,
      blockingGates: [
        'immutable_provider_revision_qualification',
        'exact_account_rate_authority',
        'production_zero_retention_entitlement',
        'canonical_backend_runtime_release',
        'provider_transport_qualification',
      ],
    },
  })
  const visualProfile = resolveCanonicalProviderOperationV4(
    CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
  )
  const visualCalibration = finalizePolicy({
    schemaVersion: CANONICAL_PROVIDER_LIFECYCLE_POLICY_VERSION,
    operationId: visualProfile.operationId,
    intent: visualProfile.intent,
    providerBoundaryProfileId:
      CANONICAL_GOOGLE_VISUAL_CALIBRATION_BOUNDARY_PROFILE_ID,
    providerRouteId: CANONICAL_GOOGLE_VISUAL_CALIBRATION_ROUTE_ID,
    providerModelId: CANONICAL_GOOGLE_VISUAL_CALIBRATION_MODEL_ID,
    immutableProviderRevision: null,
    expectedWorkItemType: visualProfile.expectedWorkItemType,
    expectedWorkerClass: visualProfile.expectedWorkerClass,
    expectedOutput: {
      role: visualProfile.expectedOutput.role,
      artifactType: visualProfile.expectedOutput.artifactType,
      contentType: visualProfile.expectedOutput.contentType,
      maximumByteLength: visualProfile.expectedOutput.maximumByteLength,
      privateCreateOnlyRequired: true as const,
      checksumReadbackRequired: true as const,
    },
    requestCeilings: requestCounts({
      generationSubmissionCount: 1,
      statusReadCount: 12,
      resultReadCount: 1,
      binaryDownloadCount: 1,
    }),
    requestRules: requestRules(),
    legacyCompatibility: {
      legacyAuthorizationVersion: null,
      legacyProfileHash: null,
      legacyHistoryPreserved: true as const,
    },
    downstreamNormalization: null,
    qualification: {
      operationIdentityFrozen: true as const,
      immutableProviderRevisionQualified: false,
      providerRateAuthorityQualified: false,
      canonicalAuthorizationIssuanceAllowed: false,
      providerTransportActivated: false as const,
      productionReady: false as const,
      blockingGates: [
        'immutable_provider_revision_qualification',
        'expiring_rate_snapshot_requalification',
        'canonical_provider_authorization_v4_production_qualification',
        'visual_calibration_provider_transport_qualification',
      ],
    },
  })
  return Object.freeze([
    Object.freeze(lyria),
    Object.freeze(foley),
    Object.freeze(speech),
    Object.freeze(visualCalibration),
  ])
}

export function resolveCanonicalProviderLifecyclePolicy(
  operationId: string,
): CanonicalProviderLifecyclePolicy {
  const policy = createCanonicalProviderLifecyclePolicyCatalog().find((candidate) =>
    candidate.operationId === operationId)
  if (!policy) {
    throw new Error(`Canonical provider lifecycle policy ${operationId} is not frozen.`)
  }
  return policy
}

export function canonicalProviderLifecyclePolicyCatalogHash(): string {
  return sha256AuthorityValue(createCanonicalProviderLifecyclePolicyCatalog())
}

function requestCounts(
  overrides: Partial<z.input<typeof canonicalProviderLifecycleRequestCountsSchema>>,
): z.output<typeof canonicalProviderLifecycleRequestCountsSchema> {
  const counts = {
    privateInputUploadCount: 0,
    generationSubmissionCount: 0,
    statusReadCount: 0,
    resultReadCount: 0,
    binaryDownloadCount: 0,
    cancellationCount: 0,
    totalLifecycleHttpRequestCount: 0,
    ...overrides,
  }
  counts.totalLifecycleHttpRequestCount = counts.privateInputUploadCount +
    counts.generationSubmissionCount + counts.statusReadCount +
    counts.resultReadCount + counts.binaryDownloadCount + counts.cancellationCount
  return canonicalProviderLifecycleRequestCountsSchema.parse(counts)
}

function requestRules() {
  return {
    legacyMaximumProviderRequestsSemantic:
      'generation_submission_count_not_total_http_requests' as const,
    maximumRetries: 0 as const,
    maximumFallbacks: 0 as const,
    maximumRedirects: 0 as const,
    addressFallbackAllowed: false as const,
    proxyOrPacAllowed: false as const,
    resubmissionWithinAttemptAllowed: false as const,
    statusResultAndCancelContinueSameAttempt: true as const,
    unknownOutcomeRequiresReconciliation: true as const,
    newSubmissionRequiresFreshApprovedPackageAndAttempt: true as const,
  }
}

function finalizePolicy(
  input: Omit<CanonicalProviderLifecyclePolicy, 'policyHash'>,
): CanonicalProviderLifecyclePolicy {
  return canonicalProviderLifecyclePolicySchema.parse({
    ...input,
    policyHash: sha256AuthorityValue(input),
  })
}
