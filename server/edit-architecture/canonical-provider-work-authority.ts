import { z } from 'zod'

import type { CanonicalApprovedEditExecutionPackage } from
  './canonical-approved-edit-execution-package'
import type {
  CanonicalPrivatePackageWorkQueueDefinition,
  CanonicalPrivatePackageWorkQueueJobDefinition,
} from './canonical-private-package-work-queue-authority'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_PROVIDER_OPERATION_REGISTRY_VERSION =
  'canonical-provider-operation-registry-v1' as const
export const CANONICAL_PROVIDER_WORK_AUTHORIZATION_VERSION =
  'canonical-provider-work-authorization-v1' as const
export const CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID =
  'provider.lyria.generate_music_candidate.v1' as const
export const CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID =
  'lyria_3_pro_provider_boundary' as const
export const CANONICAL_LYRIA_MODEL_ID = 'lyria-3-pro-preview' as const
export const CANONICAL_LYRIA_SECRET_REFERENCE_ENV_KEY =
  'GOOGLE_SECRET_LYRIA_API_KEY_NAME' as const
export const CANONICAL_LYRIA_EXPECTED_SECRET_ID =
  'reeditpro-prod-lyria-api-key' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeMicros = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

export const canonicalProviderOperationProfileSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVIDER_OPERATION_REGISTRY_VERSION),
  operationId: z.literal(CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID),
  intent: z.literal('generated_music_candidate'),
  providerBoundaryProfileId: z.literal(
    CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID,
  ),
  providerRouteId: z.literal(CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID),
  providerModelId: z.literal(CANONICAL_LYRIA_MODEL_ID),
  expectedWorkItemType: z.literal('generate_music_candidate'),
  expectedWorkerClass: z.literal('audio_processing_worker'),
  expectedOutput: z.object({
    role: z.literal('generated_instrumental_score_candidate'),
    artifactType: z.literal('generated_music_candidate'),
    assetRole: z.literal('generated'),
    contentType: z.literal('audio/wav'),
    maximumByteLength: z.literal(128 * 1024 * 1024),
    privateCreateOnlyRequired: z.literal(true),
    checksumReadbackRequired: z.literal(true),
    automaticSelectionAllowed: z.literal(false),
    timelineMutationAllowed: z.literal(false),
  }).strict(),
  requestPolicy: z.object({
    maximumProviderRequests: z.literal(1),
    maximumRetries: z.literal(0),
    maximumFallbacks: z.literal(0),
    maximumRedirects: z.literal(0),
    maximumRequestBodyBytes: z.literal(16_384),
    maximumCapturedResponseBytes: z.literal(32 * 1024 * 1024),
    maximumElapsedMilliseconds: z.literal(120_000),
    unknownOutcomeRequiresReconciliation: z.literal(true),
    automaticResubmissionAllowed: z.literal(false),
  }).strict(),
  secretLocator: z.object({
    runtime: z.literal('google_secret_manager'),
    configurationKey: z.literal(CANONICAL_LYRIA_SECRET_REFERENCE_ENV_KEY),
    expectedSecretId: z.literal(CANONICAL_LYRIA_EXPECTED_SECRET_ID),
    payloadMayAppearInPackageQueueOrEvidence: z.literal(false),
    metadataReadAuthorizedByProfile: z.literal(false),
    payloadReadAuthorizedByProfile: z.literal(false),
  }).strict(),
  costPolicy: z.object({
    currency: z.literal('USD'),
    providerRate: z.object({
      unit: z.literal('request'),
      unitPriceMicros: z.literal(80_000),
      sourceCode: z.literal('google_gemini_api_pricing_2026_07_18'),
      sourceAuthority: z.literal('accepted_external_readiness_corroboration'),
      sourceEvidenceDigest: z.literal(
        '7bbf2b98af5d04c9dee5c79edab3f43a1884773eea3c0f9106984e9eca01f7d9',
      ),
      capturedAt: z.literal('2026-07-18T18:00:00.000Z'),
      expiresAt: z.literal('2026-07-25T18:00:00.000Z'),
      failedAttemptBilling: z.literal('not_documented'),
    }).strict(),
    infrastructureRate: z.object({
      unit: z.literal('cpu_second'),
      unitPriceMicros: z.literal(1_000),
      minimumChargeMicros: z.literal(1_000),
      maximumAuthorizedCpuSeconds: z.literal(20),
      sourceEvidenceDigest: z.literal(
        'c75cd89746203bbf234a5ce50ea4751bb64cb3542ffe57a2414aeb622f38dcbc',
      ),
      evidenceClass: z.literal(
        'conservative_internal_cpu_policy_pending_observed_runtime_meter',
      ),
    }).strict(),
    maximumAuthorizedProviderCostMicros: z.literal(80_000),
    maximumAuthorizedInfrastructureCostMicros: z.literal(20_000),
    maximumAuthorizedTotalInternalCostMicros: z.literal(100_000),
    failedAndUnknownAttemptCostRetained: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationAllowed: z.literal(false),
    billingMutationAllowed: z.literal(false),
  }).strict(),
  readiness: z.object({
    operationIdentityFrozen: z.literal(true),
    approvedPackageQueueLeaseRequired: z.literal(true),
    oneUseProviderDispatchRequired: z.literal(true),
    privateOutputIngestRequired: z.literal(true),
    providerAndInfrastructureCostEvidenceRequired: z.literal(true),
    qaAndReconciliationRequired: z.literal(true),
    toolDispatchMayExecute: z.literal(false),
    providerTransportActivated: z.literal(false),
    cloudRuntimeQualified: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  profileHash: sha256,
}).strict()

export type CanonicalProviderOperationProfile = z.infer<
  typeof canonicalProviderOperationProfileSchema
>

const canonicalProviderWorkAuthorizationCoreSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVIDER_WORK_AUTHORIZATION_VERSION),
  source: z.literal('canonical_approved_package_provider_work_authority'),
  authorityClass: z.enum([
    'private_injected_nonprovider_test',
    'canonical_backend_verified_runtime',
  ]),
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  snapshotHash: sha256,
  packageRecordId: identity,
  packageHash: sha256,
  workGraphHash: sha256,
  queueDefinitionHash: sha256,
  queueJobId: identity,
  queueJobDefinitionHash: sha256,
  placementHash: sha256,
  approvedWorkItemId: identity,
  workItemKey: identity,
  expectedOutputId: identity,
  expectedOutputKey: identity,
  operationId: z.literal(CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID),
  operationProfileHash: sha256,
  intent: z.literal('generated_music_candidate'),
  providerBoundaryProfileId: z.literal(
    CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID,
  ),
  providerRouteId: z.literal(CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID),
  providerModelId: z.literal(CANONICAL_LYRIA_MODEL_ID),
  providerExecutionMode: z.literal('primary'),
  sourceRequestId: identity,
  sourceRequestDigest: sha256,
  providerRequestPayloadDigest: sha256,
  projectDataPolicyDigest: sha256,
  providerAccountPolicyDigest: sha256,
  idempotencyKeyHash: sha256,
  requestPolicyHash: sha256,
  costPolicyHash: sha256,
  maximumAuthorizedProviderCostMicros: safeMicros,
  maximumAuthorizedInfrastructureCostMicros: safeMicros,
  maximumAuthorizedTotalInternalCostMicros: safeMicros,
  reservation: z.object({
    reservationId: identity,
    reservationStatus: z.literal('reserved'),
    remainingReservedCredits: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  }).strict(),
  authorizedAt: timestamp,
  expiresAt: timestamp,
  boundaries: z.object({
    browserMayAuthorizeOrConsume: z.literal(false),
    callerSelectedRouteAllowed: z.literal(false),
    rawCredentialAllowed: z.literal(false),
    rawRequestBodyPersistedInQueue: z.literal(false),
    providerCallAuthorized: z.boolean(),
    cloudMutationAuthorized: z.literal(false),
    customerBillingAuthorized: z.literal(false),
    walletMutationAuthorized: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
})

export const canonicalProviderWorkAuthorizationSchema =
  canonicalProviderWorkAuthorizationCoreSchema.extend({
    authorityHash: sha256,
  }).strict().superRefine((value, context) => {
    if (
      value.maximumAuthorizedTotalInternalCostMicros !==
        value.maximumAuthorizedProviderCostMicros +
          value.maximumAuthorizedInfrastructureCostMicros ||
      Date.parse(value.expiresAt) <= Date.parse(value.authorizedAt) ||
      (value.authorityClass === 'private_injected_nonprovider_test' &&
        value.boundaries.providerCallAuthorized)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical provider-work authorization policy is inconsistent.',
      })
    }
  })

export type CanonicalProviderWorkAuthorization = z.infer<
  typeof canonicalProviderWorkAuthorizationSchema
>

export interface CreateCanonicalProviderWorkAuthorizationInput {
  ownerUserId: string
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  expectedOutputId: string
  sourceRequestId: string
  sourceRequestDigest: string
  providerRequestPayloadDigest: string
  projectDataPolicyDigest: string
  providerAccountPolicyDigest: string
  idempotencyKey: string
  authorityClass: CanonicalProviderWorkAuthorization['authorityClass']
  authorizedAt: string
  expiresAt: string
}

export function createCanonicalProviderOperationRegistry(): readonly [
  CanonicalProviderOperationProfile,
] {
  const withoutHash = {
    schemaVersion: CANONICAL_PROVIDER_OPERATION_REGISTRY_VERSION,
    operationId: CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
    intent: 'generated_music_candidate' as const,
    providerBoundaryProfileId: CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID,
    providerRouteId: CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID,
    providerModelId: CANONICAL_LYRIA_MODEL_ID,
    expectedWorkItemType: 'generate_music_candidate' as const,
    expectedWorkerClass: 'audio_processing_worker' as const,
    expectedOutput: {
      role: 'generated_instrumental_score_candidate' as const,
      artifactType: 'generated_music_candidate' as const,
      assetRole: 'generated' as const,
      contentType: 'audio/wav' as const,
      maximumByteLength: 134_217_728 as const,
      privateCreateOnlyRequired: true as const,
      checksumReadbackRequired: true as const,
      automaticSelectionAllowed: false as const,
      timelineMutationAllowed: false as const,
    },
    requestPolicy: {
      maximumProviderRequests: 1 as const,
      maximumRetries: 0 as const,
      maximumFallbacks: 0 as const,
      maximumRedirects: 0 as const,
      maximumRequestBodyBytes: 16_384 as const,
      maximumCapturedResponseBytes: 33_554_432 as const,
      maximumElapsedMilliseconds: 120_000 as const,
      unknownOutcomeRequiresReconciliation: true as const,
      automaticResubmissionAllowed: false as const,
    },
    secretLocator: {
      runtime: 'google_secret_manager' as const,
      configurationKey: CANONICAL_LYRIA_SECRET_REFERENCE_ENV_KEY,
      expectedSecretId: CANONICAL_LYRIA_EXPECTED_SECRET_ID,
      payloadMayAppearInPackageQueueOrEvidence: false as const,
      metadataReadAuthorizedByProfile: false as const,
      payloadReadAuthorizedByProfile: false as const,
    },
    costPolicy: {
      currency: 'USD' as const,
      providerRate: {
        unit: 'request' as const,
        unitPriceMicros: 80_000 as const,
        sourceCode: 'google_gemini_api_pricing_2026_07_18' as const,
        sourceAuthority: 'accepted_external_readiness_corroboration' as const,
        sourceEvidenceDigest:
          '7bbf2b98af5d04c9dee5c79edab3f43a1884773eea3c0f9106984e9eca01f7d9' as const,
        capturedAt: '2026-07-18T18:00:00.000Z' as const,
        expiresAt: '2026-07-25T18:00:00.000Z' as const,
        failedAttemptBilling: 'not_documented' as const,
      },
      infrastructureRate: {
        unit: 'cpu_second' as const,
        unitPriceMicros: 1_000 as const,
        minimumChargeMicros: 1_000 as const,
        maximumAuthorizedCpuSeconds: 20 as const,
        sourceEvidenceDigest:
          'c75cd89746203bbf234a5ce50ea4751bb64cb3542ffe57a2414aeb622f38dcbc' as const,
        evidenceClass:
          'conservative_internal_cpu_policy_pending_observed_runtime_meter' as const,
      },
      maximumAuthorizedProviderCostMicros: 80_000 as const,
      maximumAuthorizedInfrastructureCostMicros: 20_000 as const,
      maximumAuthorizedTotalInternalCostMicros: 100_000 as const,
      failedAndUnknownAttemptCostRetained: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationAllowed: false as const,
      billingMutationAllowed: false as const,
    },
    readiness: {
      operationIdentityFrozen: true as const,
      approvedPackageQueueLeaseRequired: true as const,
      oneUseProviderDispatchRequired: true as const,
      privateOutputIngestRequired: true as const,
      providerAndInfrastructureCostEvidenceRequired: true as const,
      qaAndReconciliationRequired: true as const,
      toolDispatchMayExecute: false as const,
      providerTransportActivated: false as const,
      cloudRuntimeQualified: false as const,
      productionReady: false as const,
    },
  }
  return Object.freeze([
    Object.freeze(canonicalProviderOperationProfileSchema.parse({
      ...withoutHash,
      profileHash: sha256AuthorityValue(withoutHash),
    })),
  ]) as readonly [CanonicalProviderOperationProfile]
}

export function resolveCanonicalProviderOperation(
  operationId: string,
): CanonicalProviderOperationProfile {
  const profile = createCanonicalProviderOperationRegistry().find((candidate) =>
    candidate.operationId === operationId)
  if (!profile) throw new Error(`Canonical provider operation ${operationId} is not registered.`)
  return profile
}

export function createCanonicalProviderWorkAuthorization(
  input: CreateCanonicalProviderWorkAuthorizationInput,
): CanonicalProviderWorkAuthorization {
  const profile = resolveCanonicalProviderOperation(
    CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
  )
  if (
    input.authorityClass === 'canonical_backend_verified_runtime' &&
    !profile.readiness.providerTransportActivated
  ) {
    throw new Error(
      'Canonical Lyria operation identity is frozen, but real provider transport is not activated.',
    )
  }
  const { executionPackage, queueDefinition } = input
  const queueJob = requiredQueueJob(queueDefinition, input.jobId)
  const packageJob = executionPackage.jobs.find((candidate) => candidate.id === input.jobId)
  const workItem = executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === packageJob?.approvedWorkItemId)
  const expectedOutput = workItem?.expectedOutputs.find((candidate) =>
    candidate.outputKey === input.expectedOutputId ||
    packageJob?.expectedAssetIds.includes(input.expectedOutputId))
  if (
    !packageJob || !workItem || !expectedOutput ||
    executionPackage.workspaceId !== queueDefinition.identity.workspaceId ||
    executionPackage.projectId !== queueDefinition.identity.projectId ||
    executionPackage.editSessionId !== queueDefinition.identity.editSessionId ||
    executionPackage.packageRecordId !== queueDefinition.identity.packageRecordId ||
    executionPackage.approvedPlanSnapshotId !==
      queueDefinition.identity.approvedPlanSnapshotId ||
    executionPackage.packageHash !== queueDefinition.identity.packageHash ||
    executionPackage.snapshotHash !== queueDefinition.identity.snapshotHash ||
    executionPackage.workGraphHash !== queueDefinition.identity.workGraphHash ||
    executionPackage.reservationStatus !== 'reserved' ||
    executionPackage.remainingReservedCredits <= 0 ||
    queueJob.approvedWorkItemId !== workItem.id ||
    queueJob.workItemKey !== workItem.workItemKey ||
    queueJob.providerExecutionMode !== 'primary' ||
    queueJob.privateExecutionReady ||
    workItem.workItemType !== profile.expectedWorkItemType ||
    workItem.workerClass !== profile.expectedWorkerClass ||
    workItem.approvedProviderRoute !== profile.providerRouteId ||
    workItem.providerExecutionMode !== 'primary' ||
    workItem.approvedToolIds.length !== 0 ||
    workItem.approvedToolOperationIds.length !== 0 ||
    packageJob.approvedToolOperationIds.length !== 0 ||
    workItem.maxAttempts !== 1 ||
    packageJob.maxAttempts !== 1 ||
    queueJob.maxAttempts !== 1 ||
    packageJob.expectedAssetIds.length !== 1 ||
    packageJob.expectedAssetIds[0] !== input.expectedOutputId ||
    workItem.expectedOutputs.length !== 1 ||
    expectedOutput.artifactType !== profile.expectedOutput.artifactType ||
    expectedOutput.assetRole !== profile.expectedOutput.assetRole ||
    expectedOutput.contentType !== profile.expectedOutput.contentType ||
    !expectedOutput.required
  ) {
    throw new Error(
      'Canonical provider work requires one exact funded package, blocked provider placement, and private expected output.',
    )
  }
  const authorizedAtMs = Date.parse(input.authorizedAt)
  const expiresAtMs = Date.parse(input.expiresAt)
  if (
    !Number.isFinite(authorizedAtMs) || !Number.isFinite(expiresAtMs) ||
    expiresAtMs <= authorizedAtMs ||
    expiresAtMs > Date.parse(profile.costPolicy.providerRate.expiresAt)
  ) {
    throw new Error('Canonical provider authorization is outside its frozen evidence window.')
  }
  const idempotencyKey = input.idempotencyKey.trim()
  if (idempotencyKey.length < 16 || idempotencyKey.length > 240) {
    throw new Error('Canonical provider work requires a bounded server idempotency key.')
  }
  const payload = {
    schemaVersion: CANONICAL_PROVIDER_WORK_AUTHORIZATION_VERSION,
    source: 'canonical_approved_package_provider_work_authority' as const,
    authorityClass: input.authorityClass,
    ownerUserId: input.ownerUserId,
    workspaceId: executionPackage.workspaceId,
    projectId: executionPackage.projectId,
    editSessionId: executionPackage.editSessionId,
    approvedPlanSnapshotId: executionPackage.approvedPlanSnapshotId,
    snapshotHash: executionPackage.snapshotHash,
    packageRecordId: executionPackage.packageRecordId,
    packageHash: executionPackage.packageHash,
    workGraphHash: executionPackage.workGraphHash,
    queueDefinitionHash: queueDefinition.definitionHash,
    queueJobId: queueJob.jobId,
    queueJobDefinitionHash: queueJob.definitionHash,
    placementHash: queueJob.placementHash,
    approvedWorkItemId: workItem.id,
    workItemKey: workItem.workItemKey,
    expectedOutputId: input.expectedOutputId,
    expectedOutputKey: expectedOutput.outputKey,
    operationId: profile.operationId,
    operationProfileHash: profile.profileHash,
    intent: profile.intent,
    providerBoundaryProfileId: profile.providerBoundaryProfileId,
    providerRouteId: profile.providerRouteId,
    providerModelId: profile.providerModelId,
    providerExecutionMode: 'primary' as const,
    sourceRequestId: input.sourceRequestId,
    sourceRequestDigest: input.sourceRequestDigest,
    providerRequestPayloadDigest: input.providerRequestPayloadDigest,
    projectDataPolicyDigest: input.projectDataPolicyDigest,
    providerAccountPolicyDigest: input.providerAccountPolicyDigest,
    idempotencyKeyHash: sha256AuthorityValue({
      domain: 'reeditpro:canonical-provider-work-idempotency:v1',
      key: idempotencyKey,
    }),
    requestPolicyHash: sha256AuthorityValue(profile.requestPolicy),
    costPolicyHash: sha256AuthorityValue(profile.costPolicy),
    maximumAuthorizedProviderCostMicros:
      profile.costPolicy.maximumAuthorizedProviderCostMicros,
    maximumAuthorizedInfrastructureCostMicros:
      profile.costPolicy.maximumAuthorizedInfrastructureCostMicros,
    maximumAuthorizedTotalInternalCostMicros:
      profile.costPolicy.maximumAuthorizedTotalInternalCostMicros,
    reservation: {
      reservationId: executionPackage.reservationId,
      reservationStatus: 'reserved' as const,
      remainingReservedCredits: executionPackage.remainingReservedCredits,
    },
    authorizedAt: input.authorizedAt,
    expiresAt: input.expiresAt,
    boundaries: {
      browserMayAuthorizeOrConsume: false as const,
      callerSelectedRouteAllowed: false as const,
      rawCredentialAllowed: false as const,
      rawRequestBodyPersistedInQueue: false as const,
      providerCallAuthorized:
        input.authorityClass === 'canonical_backend_verified_runtime',
      cloudMutationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      productionAuthority: false as const,
    },
  }
  return canonicalProviderWorkAuthorizationSchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProviderWorkAuthorization(input: {
  value: unknown
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  now: string
}): CanonicalProviderWorkAuthorization {
  const parsed = canonicalProviderWorkAuthorizationSchema.parse(input.value)
  const { authorityHash, ...payload } = parsed
  const queueJob = requiredQueueJob(input.queueDefinition, parsed.queueJobId)
  if (
    authorityHash !== sha256AuthorityValue(payload) ||
    parsed.queueDefinitionHash !== input.queueDefinition.definitionHash ||
    parsed.workspaceId !== input.queueDefinition.identity.workspaceId ||
    parsed.projectId !== input.queueDefinition.identity.projectId ||
    parsed.editSessionId !== input.queueDefinition.identity.editSessionId ||
    parsed.packageRecordId !== input.queueDefinition.identity.packageRecordId ||
    parsed.approvedPlanSnapshotId !==
      input.queueDefinition.identity.approvedPlanSnapshotId ||
    parsed.packageHash !== input.queueDefinition.identity.packageHash ||
    parsed.snapshotHash !== input.queueDefinition.identity.snapshotHash ||
    parsed.workGraphHash !== input.queueDefinition.identity.workGraphHash ||
    parsed.queueJobDefinitionHash !== queueJob.definitionHash ||
    parsed.placementHash !== queueJob.placementHash ||
    parsed.approvedWorkItemId !== queueJob.approvedWorkItemId ||
    parsed.workItemKey !== queueJob.workItemKey ||
    parsed.providerExecutionMode !== queueJob.providerExecutionMode ||
    Date.parse(parsed.expiresAt) <= Date.parse(input.now)
  ) {
    throw new Error('Canonical provider-work authorization is stale or changed.')
  }
  const profile = resolveCanonicalProviderOperation(parsed.operationId)
  if (
    parsed.operationProfileHash !== profile.profileHash ||
    parsed.providerRouteId !== profile.providerRouteId ||
    parsed.providerModelId !== profile.providerModelId ||
    parsed.requestPolicyHash !== sha256AuthorityValue(profile.requestPolicy) ||
    parsed.costPolicyHash !== sha256AuthorityValue(profile.costPolicy)
  ) {
    throw new Error('Canonical provider-work operation policy changed.')
  }
  return parsed
}

export function canonicalProviderWorkAuthorizationRequestHash(
  authorization: CanonicalProviderWorkAuthorization,
): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-work-authorization-request:v1',
    authorizationHash: authorization.authorityHash,
    queueDefinitionHash: authorization.queueDefinitionHash,
    queueJobDefinitionHash: authorization.queueJobDefinitionHash,
    idempotencyKeyHash: authorization.idempotencyKeyHash,
  })
}

function requiredQueueJob(
  definition: CanonicalPrivatePackageWorkQueueDefinition,
  jobId: string,
): CanonicalPrivatePackageWorkQueueJobDefinition {
  const job = definition.jobs.find((candidate) => candidate.jobId === jobId)
  if (!job) throw new Error(`Canonical provider queue job ${jobId} was not found.`)
  return job
}

export function canonicalProviderOperationRegistryHash(): string {
  return sha256AuthorityValue(createCanonicalProviderOperationRegistry())
}

export function canonicalProviderOperationProfilesEqual(
  left: CanonicalProviderOperationProfile,
  right: CanonicalProviderOperationProfile,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

/**
 * Forward-only provider authority for operations whose provider response is
 * intentionally split into more than one private artifact. V1 remains frozen
 * for historical Lyria attempts; V2 is part of the same canonical registry
 * lineage and does not replace or reinterpret V1 hashes.
 */
export const CANONICAL_PROVIDER_OPERATION_REGISTRY_V2_VERSION =
  'canonical-provider-operation-registry-v2' as const
export const CANONICAL_PROVIDER_WORK_AUTHORIZATION_V2_VERSION =
  'canonical-provider-work-authorization-v2' as const
export const CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID =
  'provider.elevenlabs.generate_storytelling_speech_candidate.v1' as const
export const CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_BOUNDARY_PROFILE_ID =
  'elevenlabs_eleven_v3_storytelling_speech_provider_boundary' as const
export const CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_ROUTE_ID =
  'elevenlabs_eleven_v3_storytelling_speech' as const
export const CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_MODEL_ID =
  'eleven_v3' as const
export const CANONICAL_ELEVENLABS_SECRET_REFERENCE_ENV_KEY =
  'GOOGLE_SECRET_ELEVENLABS_API_KEY_NAME' as const
export const CANONICAL_ELEVENLABS_EXPECTED_SECRET_ID =
  'reeditpro-prod-elevenlabs-api-key' as const
export const CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID =
  'provider.fal.generate_synchronized_foley_candidate.v1' as const
export const CANONICAL_FAL_SYNCHRONIZED_FOLEY_BOUNDARY_PROFILE_ID =
  'fal_ai_mmaudio_v2_provider_boundary' as const
export const CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID =
  'fal_ai_mmaudio_v2' as const
export const CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID =
  'fal-ai/mmaudio-v2' as const
export const CANONICAL_FAL_SECRET_REFERENCE_ENV_KEY =
  'GOOGLE_SECRET_MMAUDIO_API_KEY_NAME' as const
export const CANONICAL_FAL_EXPECTED_SECRET_ID =
  'reeditpro-prod-mmaudio-api-key' as const

const canonicalProviderExpectedOutputV2Schema = z.object({
  role: z.enum([
    'provider_storytelling_speech_audio_mp3',
    'provider_storytelling_speech_alignment_json',
  ]),
  artifactType: z.enum([
    'provider_storytelling_speech_audio_mp3',
    'provider_storytelling_speech_alignment_json',
  ]),
  assetRole: z.literal('generated'),
  contentType: z.enum(['audio/mpeg', 'application/json']),
  maximumByteLength: z.union([
    z.literal(16_777_216),
    z.literal(1_048_576),
  ]),
  privateCreateOnlyRequired: z.literal(true),
  checksumReadbackRequired: z.literal(true),
  browserReadable: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
}).strict()

export const canonicalProviderOperationProfileV2Schema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVIDER_OPERATION_REGISTRY_V2_VERSION),
  operationId: z.literal(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  ),
  intent: z.literal('storytelling_speech_candidate'),
  providerBoundaryProfileId: z.literal(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_BOUNDARY_PROFILE_ID,
  ),
  providerRouteId: z.literal(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_ROUTE_ID,
  ),
  providerModelId: z.literal(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_MODEL_ID,
  ),
  immutableProviderRevision: z.null(),
  expectedWorkItemType: z.literal('generate_storytelling_speech_candidate'),
  expectedWorkerClass: z.literal('provider_worker'),
  expectedOutputs: z.tuple([
    canonicalProviderExpectedOutputV2Schema,
    canonicalProviderExpectedOutputV2Schema,
  ]).superRefine((outputs, context) => {
    if (
      outputs[0].role !== 'provider_storytelling_speech_audio_mp3' ||
      outputs[0].artifactType !== 'provider_storytelling_speech_audio_mp3' ||
      outputs[0].contentType !== 'audio/mpeg' ||
      outputs[0].maximumByteLength !== 16_777_216 ||
      outputs[1].role !== 'provider_storytelling_speech_alignment_json' ||
      outputs[1].artifactType !==
        'provider_storytelling_speech_alignment_json' ||
      outputs[1].contentType !== 'application/json' ||
      outputs[1].maximumByteLength !== 1_048_576
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Storytelling Speech output order and bounds are immutable.',
      })
    }
  }),
  requestPolicy: z.object({
    maximumSecretPayloadReads: z.literal(1),
    maximumGenerationSubmissions: z.literal(1),
    maximumResponseReads: z.literal(1),
    maximumNetworkRequests: z.literal(1),
    maximumAddressConnectionAttemptsPerRequest: z.literal(1),
    maximumRetries: z.literal(0),
    maximumFallbacks: z.literal(0),
    maximumRedirects: z.literal(0),
    maximumRequestBodyBytes: z.literal(65_536),
    maximumCapturedResponseBytes: z.literal(17_825_792),
    maximumElapsedMilliseconds: z.literal(60_000),
    addressFallbackAllowed: z.literal(false),
    proxyOrPacAllowed: z.literal(false),
    resubmissionWithinAttemptAllowed: z.literal(false),
    unknownOutcomeRequiresReconciliation: z.literal(true),
    newSubmissionRequiresFreshApprovedPackageAndAttempt: z.literal(true),
  }).strict(),
  secretLocator: z.object({
    runtime: z.literal('google_secret_manager'),
    configurationKey: z.literal(CANONICAL_ELEVENLABS_SECRET_REFERENCE_ENV_KEY),
    expectedSecretId: z.literal(CANONICAL_ELEVENLABS_EXPECTED_SECRET_ID),
    payloadMayAppearInPackageQueueOrEvidence: z.literal(false),
    metadataReadAuthorizedByProfile: z.literal(false),
    payloadReadAuthorizedByProfile: z.literal(false),
  }).strict(),
  costPolicy: z.object({
    currency: z.literal('USD'),
    providerBillingUnit: z.literal('input_character'),
    exactAttemptRateCardRequired: z.literal(true),
    providerUsageReconciliationRequired: z.literal(true),
    failedAndUnknownAttemptCostRetained: z.literal(true),
    providerAndInfrastructureCostSeparated: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationAllowed: z.literal(false),
    billingMutationAllowed: z.literal(false),
  }).strict(),
  downstreamNormalization: z.object({
    operationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
    fixedProfileId: z.literal(
      'approved_storytelling_speech_take_normalization_v1',
    ),
    separateCanonicalAttemptRequired: z.literal(true),
  }).strict(),
  readiness: z.object({
    operationIdentityFrozen: z.literal(true),
    multiOutputPrivateLifecycleAdmitted: z.literal(true),
    privateInjectedAuthorizationAllowed: z.literal(true),
    immutableProviderRevisionQualified: z.literal(false),
    exactProductionRateAuthorityRequired: z.literal(true),
    productionZeroRetentionEntitlementRequired: z.literal(true),
    providerTransportActivated: z.literal(false),
    cloudRuntimeQualified: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  profileHash: sha256,
}).strict()

export type CanonicalProviderOperationProfileV2 = z.infer<
  typeof canonicalProviderOperationProfileV2Schema
>

const canonicalProviderWorkAuthorizationV2CoreSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVIDER_WORK_AUTHORIZATION_V2_VERSION),
  source: z.literal('canonical_approved_package_provider_work_authority'),
  authorityClass: z.literal('private_injected_nonprovider_test'),
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  snapshotHash: sha256,
  packageRecordId: identity,
  packageHash: sha256,
  workGraphHash: sha256,
  queueDefinitionHash: sha256,
  queueJobId: identity,
  queueJobDefinitionHash: sha256,
  placementHash: sha256,
  approvedWorkItemId: identity,
  workItemKey: identity,
  expectedOutputId: identity,
  expectedOutputKey: identity,
  expectedOutputIds: z.tuple([identity, identity]),
  expectedOutputKeys: z.tuple([identity, identity]),
  expectedOutputSetHash: sha256,
  operationId: z.literal(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  ),
  operationProfileHash: sha256,
  intent: z.literal('storytelling_speech_candidate'),
  providerBoundaryProfileId: z.literal(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_BOUNDARY_PROFILE_ID,
  ),
  providerRouteId: z.literal(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_ROUTE_ID,
  ),
  providerModelId: z.literal(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_MODEL_ID,
  ),
  providerExecutionMode: z.literal('primary'),
  sourceRequestId: identity,
  sourceRequestDigest: sha256,
  providerRequestPayloadDigest: sha256,
  projectDataPolicyDigest: sha256,
  providerAccountPolicyDigest: sha256,
  idempotencyKeyHash: sha256,
  requestPolicyHash: sha256,
  costPolicyHash: sha256,
  providerRateAuthority: z.object({
    evidenceClass: z.literal('private_local_fixture'),
    snapshotId: identity,
    snapshotDigest: sha256,
    billingUnit: z.literal('input_character'),
    productionQualified: z.literal(false),
  }).strict(),
  maximumAuthorizedProviderCostMicros: safeMicros,
  maximumAuthorizedInfrastructureCostMicros: safeMicros,
  maximumAuthorizedTotalInternalCostMicros: safeMicros,
  reservation: z.object({
    reservationId: identity,
    reservationStatus: z.literal('reserved'),
    remainingReservedCredits: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  }).strict(),
  authorizedAt: timestamp,
  expiresAt: timestamp,
  boundaries: z.object({
    browserMayAuthorizeOrConsume: z.literal(false),
    callerSelectedRouteAllowed: z.literal(false),
    rawCredentialAllowed: z.literal(false),
    rawProviderVoiceIdAllowed: z.literal(false),
    rawRequestBodyPersistedInQueue: z.literal(false),
    rawAlignmentBrowserReadable: z.literal(false),
    providerCallAuthorized: z.literal(false),
    cloudMutationAuthorized: z.literal(false),
    customerBillingAuthorized: z.literal(false),
    walletMutationAuthorized: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
})

export const canonicalProviderWorkAuthorizationV2Schema =
  canonicalProviderWorkAuthorizationV2CoreSchema.extend({
    authorityHash: sha256,
  }).strict().superRefine((value, context) => {
    if (
      value.expectedOutputId !== value.expectedOutputIds[0] ||
      value.expectedOutputKey !== value.expectedOutputKeys[0] ||
      value.maximumAuthorizedTotalInternalCostMicros !==
        value.maximumAuthorizedProviderCostMicros +
          value.maximumAuthorizedInfrastructureCostMicros ||
      Date.parse(value.expiresAt) <= Date.parse(value.authorizedAt)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical provider-work V2 authorization policy is inconsistent.',
      })
    }
  })

export type CanonicalProviderWorkAuthorizationV2 = z.infer<
  typeof canonicalProviderWorkAuthorizationV2Schema
>

export type CanonicalProviderWorkAuthorizationAny =
  | CanonicalProviderWorkAuthorization
  | CanonicalProviderWorkAuthorizationV2
  | CanonicalProviderWorkAuthorizationV3

export interface CreateCanonicalProviderWorkAuthorizationV2Input {
  ownerUserId: string
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  expectedOutputIds: readonly [string, string]
  sourceRequestId: string
  sourceRequestDigest: string
  providerRequestPayloadDigest: string
  projectDataPolicyDigest: string
  providerAccountPolicyDigest: string
  idempotencyKey: string
  providerRateAuthority: CanonicalProviderWorkAuthorizationV2['providerRateAuthority']
  maximumAuthorizedProviderCostMicros: number
  maximumAuthorizedInfrastructureCostMicros: number
  authorizedAt: string
  expiresAt: string
}

export function createCanonicalProviderOperationRegistryV2(): readonly [
  CanonicalProviderOperationProfileV2,
] {
  const withoutHash = {
    schemaVersion: CANONICAL_PROVIDER_OPERATION_REGISTRY_V2_VERSION,
    operationId: CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
    intent: 'storytelling_speech_candidate' as const,
    providerBoundaryProfileId:
      CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_BOUNDARY_PROFILE_ID,
    providerRouteId: CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_ROUTE_ID,
    providerModelId: CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_MODEL_ID,
    immutableProviderRevision: null,
    expectedWorkItemType: 'generate_storytelling_speech_candidate' as const,
    expectedWorkerClass: 'provider_worker' as const,
    expectedOutputs: [
      {
        role: 'provider_storytelling_speech_audio_mp3' as const,
        artifactType: 'provider_storytelling_speech_audio_mp3' as const,
        assetRole: 'generated' as const,
        contentType: 'audio/mpeg' as const,
        maximumByteLength: 16_777_216 as const,
        privateCreateOnlyRequired: true as const,
        checksumReadbackRequired: true as const,
        browserReadable: false as const,
        automaticSelectionAllowed: false as const,
        timelineMutationAllowed: false as const,
      },
      {
        role: 'provider_storytelling_speech_alignment_json' as const,
        artifactType: 'provider_storytelling_speech_alignment_json' as const,
        assetRole: 'generated' as const,
        contentType: 'application/json' as const,
        maximumByteLength: 1_048_576 as const,
        privateCreateOnlyRequired: true as const,
        checksumReadbackRequired: true as const,
        browserReadable: false as const,
        automaticSelectionAllowed: false as const,
        timelineMutationAllowed: false as const,
      },
    ] as const,
    requestPolicy: {
      maximumSecretPayloadReads: 1 as const,
      maximumGenerationSubmissions: 1 as const,
      maximumResponseReads: 1 as const,
      maximumNetworkRequests: 1 as const,
      maximumAddressConnectionAttemptsPerRequest: 1 as const,
      maximumRetries: 0 as const,
      maximumFallbacks: 0 as const,
      maximumRedirects: 0 as const,
      maximumRequestBodyBytes: 65_536 as const,
      maximumCapturedResponseBytes: 17_825_792 as const,
      maximumElapsedMilliseconds: 60_000 as const,
      addressFallbackAllowed: false as const,
      proxyOrPacAllowed: false as const,
      resubmissionWithinAttemptAllowed: false as const,
      unknownOutcomeRequiresReconciliation: true as const,
      newSubmissionRequiresFreshApprovedPackageAndAttempt: true as const,
    },
    secretLocator: {
      runtime: 'google_secret_manager' as const,
      configurationKey: CANONICAL_ELEVENLABS_SECRET_REFERENCE_ENV_KEY,
      expectedSecretId: CANONICAL_ELEVENLABS_EXPECTED_SECRET_ID,
      payloadMayAppearInPackageQueueOrEvidence: false as const,
      metadataReadAuthorizedByProfile: false as const,
      payloadReadAuthorizedByProfile: false as const,
    },
    costPolicy: {
      currency: 'USD' as const,
      providerBillingUnit: 'input_character' as const,
      exactAttemptRateCardRequired: true as const,
      providerUsageReconciliationRequired: true as const,
      failedAndUnknownAttemptCostRetained: true as const,
      providerAndInfrastructureCostSeparated: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationAllowed: false as const,
      billingMutationAllowed: false as const,
    },
    downstreamNormalization: {
      operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1' as const,
      fixedProfileId:
        'approved_storytelling_speech_take_normalization_v1' as const,
      separateCanonicalAttemptRequired: true as const,
    },
    readiness: {
      operationIdentityFrozen: true as const,
      multiOutputPrivateLifecycleAdmitted: true as const,
      privateInjectedAuthorizationAllowed: true as const,
      immutableProviderRevisionQualified: false as const,
      exactProductionRateAuthorityRequired: true as const,
      productionZeroRetentionEntitlementRequired: true as const,
      providerTransportActivated: false as const,
      cloudRuntimeQualified: false as const,
      productionReady: false as const,
    },
  }
  return Object.freeze([
    Object.freeze(canonicalProviderOperationProfileV2Schema.parse({
      ...withoutHash,
      profileHash: sha256AuthorityValue(withoutHash),
    })),
  ]) as readonly [CanonicalProviderOperationProfileV2]
}

export function resolveCanonicalProviderOperationV2(
  operationId: string,
): CanonicalProviderOperationProfileV2 {
  const profile = createCanonicalProviderOperationRegistryV2().find((candidate) =>
    candidate.operationId === operationId)
  if (!profile) {
    throw new Error(`Canonical provider operation V2 ${operationId} is not registered.`)
  }
  return profile
}

export function createCanonicalProviderWorkAuthorizationV2(
  input: CreateCanonicalProviderWorkAuthorizationV2Input,
): CanonicalProviderWorkAuthorizationV2 {
  const profile = resolveCanonicalProviderOperationV2(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  )
  const { executionPackage, queueDefinition } = input
  const queueJob = requiredQueueJob(queueDefinition, input.jobId)
  const packageJob = executionPackage.jobs.find((candidate) =>
    candidate.id === input.jobId)
  const workItem = executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === packageJob?.approvedWorkItemId)
  const expectedOutputs = input.expectedOutputIds.map((outputId) =>
    workItem?.expectedOutputs.find((candidate) =>
      candidate.outputKey === outputId))
  const outputContractsMatch = expectedOutputs.every((output, index) => {
    const expected = profile.expectedOutputs[index]
    return output !== undefined && expected !== undefined &&
      output.outputKey === input.expectedOutputIds[index] &&
      output.artifactType === expected.artifactType &&
      output.assetRole === expected.assetRole &&
      output.contentType === expected.contentType &&
      output.required
  })
  if (
    !packageJob || !workItem || expectedOutputs.some((value) => !value) ||
    executionPackage.workspaceId !== queueDefinition.identity.workspaceId ||
    executionPackage.projectId !== queueDefinition.identity.projectId ||
    executionPackage.editSessionId !== queueDefinition.identity.editSessionId ||
    executionPackage.packageRecordId !== queueDefinition.identity.packageRecordId ||
    executionPackage.approvedPlanSnapshotId !==
      queueDefinition.identity.approvedPlanSnapshotId ||
    executionPackage.packageHash !== queueDefinition.identity.packageHash ||
    executionPackage.snapshotHash !== queueDefinition.identity.snapshotHash ||
    executionPackage.workGraphHash !== queueDefinition.identity.workGraphHash ||
    executionPackage.reservationStatus !== 'reserved' ||
    executionPackage.remainingReservedCredits <= 0 ||
    queueJob.approvedWorkItemId !== workItem.id ||
    queueJob.workItemKey !== workItem.workItemKey ||
    queueJob.providerExecutionMode !== 'primary' ||
    queueJob.privateExecutionReady ||
    workItem.workItemType !== profile.expectedWorkItemType ||
    workItem.workerClass !== profile.expectedWorkerClass ||
    workItem.approvedProviderRoute !== profile.providerRouteId ||
    workItem.providerExecutionMode !== 'primary' ||
    workItem.approvedToolIds.length !== 0 ||
    workItem.approvedToolOperationIds.length !== 0 ||
    packageJob.approvedToolOperationIds.length !== 0 ||
    workItem.maxAttempts !== 1 || packageJob.maxAttempts !== 1 ||
    queueJob.maxAttempts !== 1 ||
    workItem.expectedOutputs.length !== 2 ||
    packageJob.expectedAssetIds.length !== 2 ||
    packageJob.expectedAssetIds.some((value, index) =>
      value !== input.expectedOutputIds[index]) ||
    !outputContractsMatch
  ) {
    throw new Error(
      'Canonical Speech provider work requires one exact funded package and two ordered private expected outputs.',
    )
  }
  const authorizedAtMs = Date.parse(input.authorizedAt)
  const expiresAtMs = Date.parse(input.expiresAt)
  if (
    !Number.isFinite(authorizedAtMs) || !Number.isFinite(expiresAtMs) ||
    expiresAtMs <= authorizedAtMs ||
    expiresAtMs - authorizedAtMs > 60 * 60 * 1_000
  ) throw new Error('Canonical Speech provider authorization window is invalid.')
  const idempotencyKey = input.idempotencyKey.trim()
  if (idempotencyKey.length < 16 || idempotencyKey.length > 240) {
    throw new Error('Canonical Speech provider work requires a bounded idempotency key.')
  }
  for (const value of [
    input.maximumAuthorizedProviderCostMicros,
    input.maximumAuthorizedInfrastructureCostMicros,
  ]) {
    if (!Number.isSafeInteger(value) || value <= 0 || value > 250_000) {
      throw new Error('Canonical Speech provider cost ceiling is invalid.')
    }
  }
  const expectedOutputIds = [...input.expectedOutputIds] as [string, string]
  const expectedOutputKeys = expectedOutputs.map((output) => output!.outputKey) as
    [string, string]
  const payload = {
    schemaVersion: CANONICAL_PROVIDER_WORK_AUTHORIZATION_V2_VERSION,
    source: 'canonical_approved_package_provider_work_authority' as const,
    authorityClass: 'private_injected_nonprovider_test' as const,
    ownerUserId: input.ownerUserId,
    workspaceId: executionPackage.workspaceId,
    projectId: executionPackage.projectId,
    editSessionId: executionPackage.editSessionId,
    approvedPlanSnapshotId: executionPackage.approvedPlanSnapshotId,
    snapshotHash: executionPackage.snapshotHash,
    packageRecordId: executionPackage.packageRecordId,
    packageHash: executionPackage.packageHash,
    workGraphHash: executionPackage.workGraphHash,
    queueDefinitionHash: queueDefinition.definitionHash,
    queueJobId: queueJob.jobId,
    queueJobDefinitionHash: queueJob.definitionHash,
    placementHash: queueJob.placementHash,
    approvedWorkItemId: workItem.id,
    workItemKey: workItem.workItemKey,
    expectedOutputId: expectedOutputIds[0],
    expectedOutputKey: expectedOutputKeys[0],
    expectedOutputIds,
    expectedOutputKeys,
    expectedOutputSetHash: sha256AuthorityValue({
      domain: 'reeditpro:canonical-provider-expected-output-set:v2',
      operationProfileHash: profile.profileHash,
      outputs: expectedOutputs,
    }),
    operationId: profile.operationId,
    operationProfileHash: profile.profileHash,
    intent: profile.intent,
    providerBoundaryProfileId: profile.providerBoundaryProfileId,
    providerRouteId: profile.providerRouteId,
    providerModelId: profile.providerModelId,
    providerExecutionMode: 'primary' as const,
    sourceRequestId: input.sourceRequestId,
    sourceRequestDigest: input.sourceRequestDigest,
    providerRequestPayloadDigest: input.providerRequestPayloadDigest,
    projectDataPolicyDigest: input.projectDataPolicyDigest,
    providerAccountPolicyDigest: input.providerAccountPolicyDigest,
    idempotencyKeyHash: sha256AuthorityValue({
      domain: 'reeditpro:canonical-provider-work-idempotency:v2',
      key: idempotencyKey,
    }),
    requestPolicyHash: sha256AuthorityValue(profile.requestPolicy),
    costPolicyHash: sha256AuthorityValue(profile.costPolicy),
    providerRateAuthority: input.providerRateAuthority,
    maximumAuthorizedProviderCostMicros:
      input.maximumAuthorizedProviderCostMicros,
    maximumAuthorizedInfrastructureCostMicros:
      input.maximumAuthorizedInfrastructureCostMicros,
    maximumAuthorizedTotalInternalCostMicros:
      input.maximumAuthorizedProviderCostMicros +
        input.maximumAuthorizedInfrastructureCostMicros,
    reservation: {
      reservationId: executionPackage.reservationId,
      reservationStatus: 'reserved' as const,
      remainingReservedCredits: executionPackage.remainingReservedCredits,
    },
    authorizedAt: input.authorizedAt,
    expiresAt: input.expiresAt,
    boundaries: {
      browserMayAuthorizeOrConsume: false as const,
      callerSelectedRouteAllowed: false as const,
      rawCredentialAllowed: false as const,
      rawProviderVoiceIdAllowed: false as const,
      rawRequestBodyPersistedInQueue: false as const,
      rawAlignmentBrowserReadable: false as const,
      providerCallAuthorized: false as const,
      cloudMutationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      productionAuthority: false as const,
    },
  }
  return canonicalProviderWorkAuthorizationV2Schema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProviderWorkAuthorizationV2(input: {
  value: unknown
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  now: string
}): CanonicalProviderWorkAuthorizationV2 {
  const parsed = canonicalProviderWorkAuthorizationV2Schema.parse(input.value)
  const { authorityHash, ...payload } = parsed
  const queueJob = requiredQueueJob(input.queueDefinition, parsed.queueJobId)
  const profile = resolveCanonicalProviderOperationV2(parsed.operationId)
  if (
    authorityHash !== sha256AuthorityValue(payload) ||
    parsed.queueDefinitionHash !== input.queueDefinition.definitionHash ||
    parsed.workspaceId !== input.queueDefinition.identity.workspaceId ||
    parsed.projectId !== input.queueDefinition.identity.projectId ||
    parsed.editSessionId !== input.queueDefinition.identity.editSessionId ||
    parsed.packageRecordId !== input.queueDefinition.identity.packageRecordId ||
    parsed.approvedPlanSnapshotId !==
      input.queueDefinition.identity.approvedPlanSnapshotId ||
    parsed.packageHash !== input.queueDefinition.identity.packageHash ||
    parsed.snapshotHash !== input.queueDefinition.identity.snapshotHash ||
    parsed.workGraphHash !== input.queueDefinition.identity.workGraphHash ||
    parsed.queueJobDefinitionHash !== queueJob.definitionHash ||
    parsed.placementHash !== queueJob.placementHash ||
    parsed.approvedWorkItemId !== queueJob.approvedWorkItemId ||
    parsed.workItemKey !== queueJob.workItemKey ||
    parsed.providerExecutionMode !== queueJob.providerExecutionMode ||
    parsed.operationProfileHash !== profile.profileHash ||
    parsed.providerRouteId !== profile.providerRouteId ||
    parsed.providerModelId !== profile.providerModelId ||
    parsed.requestPolicyHash !== sha256AuthorityValue(profile.requestPolicy) ||
    parsed.costPolicyHash !== sha256AuthorityValue(profile.costPolicy) ||
    Date.parse(parsed.expiresAt) <= Date.parse(input.now)
  ) throw new Error('Canonical provider-work V2 authorization is stale or changed.')
  return parsed
}

export function assertCanonicalProviderWorkAuthorizationAny(input: {
  value: unknown
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  now: string
}): CanonicalProviderWorkAuthorizationAny {
  const version = input.value && typeof input.value === 'object'
    ? (input.value as { schemaVersion?: unknown }).schemaVersion
    : undefined
  if (version === CANONICAL_PROVIDER_WORK_AUTHORIZATION_V3_VERSION) {
    return assertCanonicalProviderWorkAuthorizationV3(input)
  }
  return version === CANONICAL_PROVIDER_WORK_AUTHORIZATION_V2_VERSION
    ? assertCanonicalProviderWorkAuthorizationV2(input)
    : assertCanonicalProviderWorkAuthorization(input)
}

export function canonicalProviderWorkAuthorizationRequestHashV2(
  authorization: CanonicalProviderWorkAuthorizationV2,
): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-work-authorization-request:v2',
    authorizationHash: authorization.authorityHash,
    queueDefinitionHash: authorization.queueDefinitionHash,
    queueJobDefinitionHash: authorization.queueJobDefinitionHash,
    idempotencyKeyHash: authorization.idempotencyKeyHash,
    expectedOutputSetHash: authorization.expectedOutputSetHash,
  })
}

export function canonicalProviderOperationRegistryV2Hash(): string {
  return sha256AuthorityValue(createCanonicalProviderOperationRegistryV2())
}

/**
 * Forward-only single-output async provider authority for synchronized Foley.
 * V1 Lyria and V2 Storytelling Speech records remain byte-for-byte historical;
 * this V3 profile can issue only private injected, non-provider proof until the
 * immutable Fal revision, account rate, transport, and release gates pass.
 */
export const CANONICAL_PROVIDER_OPERATION_REGISTRY_V3_VERSION =
  'canonical-provider-operation-registry-v3' as const
export const CANONICAL_PROVIDER_WORK_AUTHORIZATION_V3_VERSION =
  'canonical-provider-work-authorization-v3' as const

export const canonicalProviderOperationProfileV3Schema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVIDER_OPERATION_REGISTRY_V3_VERSION),
  operationId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID),
  intent: z.literal('synchronized_foley_candidate'),
  providerBoundaryProfileId: z.literal(
    CANONICAL_FAL_SYNCHRONIZED_FOLEY_BOUNDARY_PROFILE_ID,
  ),
  providerRouteId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID),
  providerModelId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID),
  immutableProviderRevision: z.null(),
  expectedWorkItemType: z.literal('generate_synchronized_foley_candidate'),
  expectedWorkerClass: z.literal('provider_worker'),
  expectedOutput: z.object({
    role: z.literal('provider_synchronized_audio_mp4'),
    artifactType: z.literal('provider_synchronized_audio_mp4'),
    assetRole: z.literal('generated'),
    contentType: z.literal('video/mp4'),
    maximumByteLength: z.literal(67_108_864),
    privateCreateOnlyRequired: z.literal(true),
    checksumReadbackRequired: z.literal(true),
    browserReadable: z.literal(false),
    automaticSelectionAllowed: z.literal(false),
    timelineMutationAllowed: z.literal(false),
  }).strict(),
  requestPolicy: z.object({
    maximumSecretPayloadReads: z.literal(1),
    maximumPrivateInputUploads: z.literal(1),
    maximumGenerationSubmissions: z.literal(1),
    maximumStatusReads: z.literal(12),
    maximumResultReads: z.literal(1),
    maximumBinaryDownloads: z.literal(1),
    maximumCancellations: z.literal(1),
    maximumNetworkRequests: z.literal(17),
    maximumAddressConnectionAttemptsPerRequest: z.literal(1),
    maximumRetries: z.literal(0),
    maximumFallbacks: z.literal(0),
    maximumRedirects: z.literal(0),
    maximumRequestBodyBytes: z.literal(65_536),
    maximumCapturedResponseBytes: z.literal(67_174_400),
    maximumElapsedMilliseconds: z.literal(900_000),
    addressFallbackAllowed: z.literal(false),
    proxyOrPacAllowed: z.literal(false),
    resubmissionWithinAttemptAllowed: z.literal(false),
    statusResultAndCancelContinueSameAttempt: z.literal(true),
    unknownOutcomeRequiresReconciliation: z.literal(true),
    newSubmissionRequiresFreshApprovedPackageAndAttempt: z.literal(true),
  }).strict(),
  secretLocator: z.object({
    runtime: z.literal('google_secret_manager'),
    configurationKey: z.literal(CANONICAL_FAL_SECRET_REFERENCE_ENV_KEY),
    expectedSecretId: z.literal(CANONICAL_FAL_EXPECTED_SECRET_ID),
    payloadMayAppearInPackageQueueOrEvidence: z.literal(false),
    metadataReadAuthorizedByProfile: z.literal(false),
    payloadReadAuthorizedByProfile: z.literal(false),
  }).strict(),
  costPolicy: z.object({
    currency: z.literal('USD'),
    providerBillingUnit: z.literal('generation_submission'),
    exactAttemptRateCardRequired: z.literal(true),
    providerUsageReconciliationRequired: z.literal(true),
    failedAndUnknownAttemptCostRetained: z.literal(true),
    providerAndInfrastructureCostSeparated: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationAllowed: z.literal(false),
    billingMutationAllowed: z.literal(false),
  }).strict(),
  downstreamNormalization: z.object({
    operationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
    fixedProfileId: z.literal(
      'approved_synchronized_foley_candidate_normalization_v1',
    ),
    separateCanonicalAttemptRequired: z.literal(true),
  }).strict(),
  readiness: z.object({
    operationIdentityFrozen: z.literal(true),
    asyncLifecycleRequestAccountingFrozen: z.literal(true),
    privateInjectedAuthorizationAllowed: z.literal(true),
    immutableProviderRevisionQualified: z.literal(false),
    exactProductionRateAuthorityRequired: z.literal(true),
    providerTransportActivated: z.literal(false),
    cloudRuntimeQualified: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  profileHash: sha256,
}).strict()

export type CanonicalProviderOperationProfileV3 = z.infer<
  typeof canonicalProviderOperationProfileV3Schema
>

const canonicalProviderWorkAuthorizationV3CoreSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVIDER_WORK_AUTHORIZATION_V3_VERSION),
  source: z.literal('canonical_approved_package_provider_work_authority'),
  authorityClass: z.literal('private_injected_nonprovider_test'),
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  snapshotHash: sha256,
  packageRecordId: identity,
  packageHash: sha256,
  workGraphHash: sha256,
  queueDefinitionHash: sha256,
  queueJobId: identity,
  queueJobDefinitionHash: sha256,
  placementHash: sha256,
  approvedWorkItemId: identity,
  workItemKey: identity,
  expectedOutputId: identity,
  expectedOutputKey: identity,
  expectedOutputIds: z.tuple([identity]),
  expectedOutputKeys: z.tuple([identity]),
  expectedOutputSetHash: sha256,
  operationId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID),
  operationProfileHash: sha256,
  intent: z.literal('synchronized_foley_candidate'),
  providerBoundaryProfileId: z.literal(
    CANONICAL_FAL_SYNCHRONIZED_FOLEY_BOUNDARY_PROFILE_ID,
  ),
  providerRouteId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID),
  providerModelId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID),
  providerExecutionMode: z.literal('primary'),
  sourceRequestId: identity,
  sourceRequestDigest: sha256,
  providerRequestPayloadDigest: sha256,
  projectDataPolicyDigest: sha256,
  providerAccountPolicyDigest: sha256,
  idempotencyKeyHash: sha256,
  requestPolicyHash: sha256,
  costPolicyHash: sha256,
  providerRateAuthority: z.object({
    evidenceClass: z.literal('private_local_fixture'),
    snapshotId: identity,
    snapshotDigest: sha256,
    billingUnit: z.literal('generation_submission'),
    productionQualified: z.literal(false),
  }).strict(),
  maximumAuthorizedProviderCostMicros: safeMicros,
  maximumAuthorizedInfrastructureCostMicros: safeMicros,
  maximumAuthorizedTotalInternalCostMicros: safeMicros,
  reservation: z.object({
    reservationId: identity,
    reservationStatus: z.literal('reserved'),
    remainingReservedCredits: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  }).strict(),
  authorizedAt: timestamp,
  expiresAt: timestamp,
  boundaries: z.object({
    browserMayAuthorizeOrConsume: z.literal(false),
    callerSelectedRouteAllowed: z.literal(false),
    rawCredentialAllowed: z.literal(false),
    rawRequestBodyPersistedInQueue: z.literal(false),
    providerUrlPersisted: z.literal(false),
    providerCallAuthorized: z.literal(false),
    cloudMutationAuthorized: z.literal(false),
    customerBillingAuthorized: z.literal(false),
    walletMutationAuthorized: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
})

export const canonicalProviderWorkAuthorizationV3Schema =
  canonicalProviderWorkAuthorizationV3CoreSchema.extend({
    authorityHash: sha256,
  }).strict().superRefine((value, context) => {
    if (
      value.expectedOutputId !== value.expectedOutputIds[0] ||
      value.expectedOutputKey !== value.expectedOutputKeys[0] ||
      value.maximumAuthorizedTotalInternalCostMicros !==
        value.maximumAuthorizedProviderCostMicros +
          value.maximumAuthorizedInfrastructureCostMicros ||
      Date.parse(value.expiresAt) <= Date.parse(value.authorizedAt)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical provider-work V3 authorization policy is inconsistent.',
      })
    }
  })

export type CanonicalProviderWorkAuthorizationV3 = z.infer<
  typeof canonicalProviderWorkAuthorizationV3Schema
>

export interface CreateCanonicalProviderWorkAuthorizationV3Input {
  ownerUserId: string
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  expectedOutputId: string
  sourceRequestId: string
  sourceRequestDigest: string
  providerRequestPayloadDigest: string
  projectDataPolicyDigest: string
  providerAccountPolicyDigest: string
  idempotencyKey: string
  providerRateAuthority: CanonicalProviderWorkAuthorizationV3['providerRateAuthority']
  maximumAuthorizedProviderCostMicros: number
  maximumAuthorizedInfrastructureCostMicros: number
  authorizedAt: string
  expiresAt: string
}

export function createCanonicalProviderOperationRegistryV3(): readonly [
  CanonicalProviderOperationProfileV3,
] {
  const withoutHash = {
    schemaVersion: CANONICAL_PROVIDER_OPERATION_REGISTRY_V3_VERSION,
    operationId: CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
    intent: 'synchronized_foley_candidate' as const,
    providerBoundaryProfileId:
      CANONICAL_FAL_SYNCHRONIZED_FOLEY_BOUNDARY_PROFILE_ID,
    providerRouteId: CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID,
    providerModelId: CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID,
    immutableProviderRevision: null,
    expectedWorkItemType: 'generate_synchronized_foley_candidate' as const,
    expectedWorkerClass: 'provider_worker' as const,
    expectedOutput: {
      role: 'provider_synchronized_audio_mp4' as const,
      artifactType: 'provider_synchronized_audio_mp4' as const,
      assetRole: 'generated' as const,
      contentType: 'video/mp4' as const,
      maximumByteLength: 67_108_864 as const,
      privateCreateOnlyRequired: true as const,
      checksumReadbackRequired: true as const,
      browserReadable: false as const,
      automaticSelectionAllowed: false as const,
      timelineMutationAllowed: false as const,
    },
    requestPolicy: {
      maximumSecretPayloadReads: 1 as const,
      maximumPrivateInputUploads: 1 as const,
      maximumGenerationSubmissions: 1 as const,
      maximumStatusReads: 12 as const,
      maximumResultReads: 1 as const,
      maximumBinaryDownloads: 1 as const,
      maximumCancellations: 1 as const,
      maximumNetworkRequests: 17 as const,
      maximumAddressConnectionAttemptsPerRequest: 1 as const,
      maximumRetries: 0 as const,
      maximumFallbacks: 0 as const,
      maximumRedirects: 0 as const,
      maximumRequestBodyBytes: 65_536 as const,
      maximumCapturedResponseBytes: 67_174_400 as const,
      maximumElapsedMilliseconds: 900_000 as const,
      addressFallbackAllowed: false as const,
      proxyOrPacAllowed: false as const,
      resubmissionWithinAttemptAllowed: false as const,
      statusResultAndCancelContinueSameAttempt: true as const,
      unknownOutcomeRequiresReconciliation: true as const,
      newSubmissionRequiresFreshApprovedPackageAndAttempt: true as const,
    },
    secretLocator: {
      runtime: 'google_secret_manager' as const,
      configurationKey: CANONICAL_FAL_SECRET_REFERENCE_ENV_KEY,
      expectedSecretId: CANONICAL_FAL_EXPECTED_SECRET_ID,
      payloadMayAppearInPackageQueueOrEvidence: false as const,
      metadataReadAuthorizedByProfile: false as const,
      payloadReadAuthorizedByProfile: false as const,
    },
    costPolicy: {
      currency: 'USD' as const,
      providerBillingUnit: 'generation_submission' as const,
      exactAttemptRateCardRequired: true as const,
      providerUsageReconciliationRequired: true as const,
      failedAndUnknownAttemptCostRetained: true as const,
      providerAndInfrastructureCostSeparated: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationAllowed: false as const,
      billingMutationAllowed: false as const,
    },
    downstreamNormalization: {
      operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1' as const,
      fixedProfileId:
        'approved_synchronized_foley_candidate_normalization_v1' as const,
      separateCanonicalAttemptRequired: true as const,
    },
    readiness: {
      operationIdentityFrozen: true as const,
      asyncLifecycleRequestAccountingFrozen: true as const,
      privateInjectedAuthorizationAllowed: true as const,
      immutableProviderRevisionQualified: false as const,
      exactProductionRateAuthorityRequired: true as const,
      providerTransportActivated: false as const,
      cloudRuntimeQualified: false as const,
      productionReady: false as const,
    },
  }
  return Object.freeze([
    Object.freeze(canonicalProviderOperationProfileV3Schema.parse({
      ...withoutHash,
      profileHash: sha256AuthorityValue(withoutHash),
    })),
  ]) as readonly [CanonicalProviderOperationProfileV3]
}

export function resolveCanonicalProviderOperationV3(
  operationId: string,
): CanonicalProviderOperationProfileV3 {
  const profile = createCanonicalProviderOperationRegistryV3().find((candidate) =>
    candidate.operationId === operationId)
  if (!profile) {
    throw new Error(`Canonical provider operation V3 ${operationId} is not registered.`)
  }
  return profile
}

export function createCanonicalProviderWorkAuthorizationV3(
  input: CreateCanonicalProviderWorkAuthorizationV3Input,
): CanonicalProviderWorkAuthorizationV3 {
  const profile = resolveCanonicalProviderOperationV3(
    CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  )
  const { executionPackage, queueDefinition } = input
  const queueJob = requiredQueueJob(queueDefinition, input.jobId)
  const packageJob = executionPackage.jobs.find((candidate) =>
    candidate.id === input.jobId)
  const workItem = executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === packageJob?.approvedWorkItemId)
  const expectedOutput = workItem?.expectedOutputs.find((candidate) =>
    candidate.outputKey === input.expectedOutputId)
  if (
    !packageJob || !workItem || !expectedOutput ||
    executionPackage.workspaceId !== queueDefinition.identity.workspaceId ||
    executionPackage.projectId !== queueDefinition.identity.projectId ||
    executionPackage.editSessionId !== queueDefinition.identity.editSessionId ||
    executionPackage.packageRecordId !== queueDefinition.identity.packageRecordId ||
    executionPackage.approvedPlanSnapshotId !==
      queueDefinition.identity.approvedPlanSnapshotId ||
    executionPackage.packageHash !== queueDefinition.identity.packageHash ||
    executionPackage.snapshotHash !== queueDefinition.identity.snapshotHash ||
    executionPackage.workGraphHash !== queueDefinition.identity.workGraphHash ||
    executionPackage.reservationStatus !== 'reserved' ||
    executionPackage.remainingReservedCredits <= 0 ||
    queueJob.approvedWorkItemId !== workItem.id ||
    queueJob.workItemKey !== workItem.workItemKey ||
    queueJob.providerExecutionMode !== 'primary' ||
    queueJob.privateExecutionReady ||
    workItem.workItemType !== profile.expectedWorkItemType ||
    workItem.workerClass !== profile.expectedWorkerClass ||
    workItem.approvedProviderRoute !== profile.providerRouteId ||
    workItem.providerExecutionMode !== 'primary' ||
    workItem.approvedToolIds.length !== 0 ||
    workItem.approvedToolOperationIds.length !== 0 ||
    packageJob.approvedToolOperationIds.length !== 0 ||
    workItem.maxAttempts !== 1 || packageJob.maxAttempts !== 1 ||
    queueJob.maxAttempts !== 1 ||
    workItem.expectedOutputs.length !== 1 ||
    packageJob.expectedAssetIds.length !== 1 ||
    packageJob.expectedAssetIds[0] !== input.expectedOutputId ||
    expectedOutput.artifactType !== profile.expectedOutput.artifactType ||
    expectedOutput.assetRole !== profile.expectedOutput.assetRole ||
    expectedOutput.contentType !== profile.expectedOutput.contentType ||
    !expectedOutput.required
  ) {
    throw new Error(
      'Canonical synchronized-Foley provider work requires one exact funded package and one private MP4 output.',
    )
  }
  const authorizedAtMs = Date.parse(input.authorizedAt)
  const expiresAtMs = Date.parse(input.expiresAt)
  if (
    !Number.isFinite(authorizedAtMs) || !Number.isFinite(expiresAtMs) ||
    expiresAtMs <= authorizedAtMs ||
    expiresAtMs - authorizedAtMs > 60 * 60 * 1_000
  ) throw new Error('Canonical synchronized-Foley authorization window is invalid.')
  const idempotencyKey = input.idempotencyKey.trim()
  if (idempotencyKey.length < 16 || idempotencyKey.length > 240) {
    throw new Error('Canonical synchronized-Foley work requires a bounded idempotency key.')
  }
  for (const value of [
    input.maximumAuthorizedProviderCostMicros,
    input.maximumAuthorizedInfrastructureCostMicros,
  ]) {
    if (!Number.isSafeInteger(value) || value <= 0 || value > 1_000_000) {
      throw new Error('Canonical synchronized-Foley cost ceiling is invalid.')
    }
  }
  const expectedOutputIds = [input.expectedOutputId] as [string]
  const expectedOutputKeys = [expectedOutput.outputKey] as [string]
  const payload = {
    schemaVersion: CANONICAL_PROVIDER_WORK_AUTHORIZATION_V3_VERSION,
    source: 'canonical_approved_package_provider_work_authority' as const,
    authorityClass: 'private_injected_nonprovider_test' as const,
    ownerUserId: input.ownerUserId,
    workspaceId: executionPackage.workspaceId,
    projectId: executionPackage.projectId,
    editSessionId: executionPackage.editSessionId,
    approvedPlanSnapshotId: executionPackage.approvedPlanSnapshotId,
    snapshotHash: executionPackage.snapshotHash,
    packageRecordId: executionPackage.packageRecordId,
    packageHash: executionPackage.packageHash,
    workGraphHash: executionPackage.workGraphHash,
    queueDefinitionHash: queueDefinition.definitionHash,
    queueJobId: queueJob.jobId,
    queueJobDefinitionHash: queueJob.definitionHash,
    placementHash: queueJob.placementHash,
    approvedWorkItemId: workItem.id,
    workItemKey: workItem.workItemKey,
    expectedOutputId: input.expectedOutputId,
    expectedOutputKey: expectedOutput.outputKey,
    expectedOutputIds,
    expectedOutputKeys,
    expectedOutputSetHash: sha256AuthorityValue({
      domain: 'reeditpro:canonical-provider-expected-output-set:v3',
      operationProfileHash: profile.profileHash,
      outputs: [expectedOutput],
    }),
    operationId: profile.operationId,
    operationProfileHash: profile.profileHash,
    intent: profile.intent,
    providerBoundaryProfileId: profile.providerBoundaryProfileId,
    providerRouteId: profile.providerRouteId,
    providerModelId: profile.providerModelId,
    providerExecutionMode: 'primary' as const,
    sourceRequestId: input.sourceRequestId,
    sourceRequestDigest: input.sourceRequestDigest,
    providerRequestPayloadDigest: input.providerRequestPayloadDigest,
    projectDataPolicyDigest: input.projectDataPolicyDigest,
    providerAccountPolicyDigest: input.providerAccountPolicyDigest,
    idempotencyKeyHash: sha256AuthorityValue({
      domain: 'reeditpro:canonical-provider-work-idempotency:v3',
      key: idempotencyKey,
    }),
    requestPolicyHash: sha256AuthorityValue(profile.requestPolicy),
    costPolicyHash: sha256AuthorityValue(profile.costPolicy),
    providerRateAuthority: input.providerRateAuthority,
    maximumAuthorizedProviderCostMicros:
      input.maximumAuthorizedProviderCostMicros,
    maximumAuthorizedInfrastructureCostMicros:
      input.maximumAuthorizedInfrastructureCostMicros,
    maximumAuthorizedTotalInternalCostMicros:
      input.maximumAuthorizedProviderCostMicros +
        input.maximumAuthorizedInfrastructureCostMicros,
    reservation: {
      reservationId: executionPackage.reservationId,
      reservationStatus: 'reserved' as const,
      remainingReservedCredits: executionPackage.remainingReservedCredits,
    },
    authorizedAt: input.authorizedAt,
    expiresAt: input.expiresAt,
    boundaries: {
      browserMayAuthorizeOrConsume: false as const,
      callerSelectedRouteAllowed: false as const,
      rawCredentialAllowed: false as const,
      rawRequestBodyPersistedInQueue: false as const,
      providerUrlPersisted: false as const,
      providerCallAuthorized: false as const,
      cloudMutationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      productionAuthority: false as const,
    },
  }
  return canonicalProviderWorkAuthorizationV3Schema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProviderWorkAuthorizationV3(input: {
  value: unknown
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  now: string
}): CanonicalProviderWorkAuthorizationV3 {
  const parsed = canonicalProviderWorkAuthorizationV3Schema.parse(input.value)
  const { authorityHash, ...payload } = parsed
  const queueJob = requiredQueueJob(input.queueDefinition, parsed.queueJobId)
  const profile = resolveCanonicalProviderOperationV3(parsed.operationId)
  if (
    authorityHash !== sha256AuthorityValue(payload) ||
    parsed.queueDefinitionHash !== input.queueDefinition.definitionHash ||
    parsed.workspaceId !== input.queueDefinition.identity.workspaceId ||
    parsed.projectId !== input.queueDefinition.identity.projectId ||
    parsed.editSessionId !== input.queueDefinition.identity.editSessionId ||
    parsed.packageRecordId !== input.queueDefinition.identity.packageRecordId ||
    parsed.approvedPlanSnapshotId !==
      input.queueDefinition.identity.approvedPlanSnapshotId ||
    parsed.packageHash !== input.queueDefinition.identity.packageHash ||
    parsed.snapshotHash !== input.queueDefinition.identity.snapshotHash ||
    parsed.workGraphHash !== input.queueDefinition.identity.workGraphHash ||
    parsed.queueJobDefinitionHash !== queueJob.definitionHash ||
    parsed.placementHash !== queueJob.placementHash ||
    parsed.approvedWorkItemId !== queueJob.approvedWorkItemId ||
    parsed.workItemKey !== queueJob.workItemKey ||
    parsed.providerExecutionMode !== queueJob.providerExecutionMode ||
    parsed.operationProfileHash !== profile.profileHash ||
    parsed.providerRouteId !== profile.providerRouteId ||
    parsed.providerModelId !== profile.providerModelId ||
    parsed.requestPolicyHash !== sha256AuthorityValue(profile.requestPolicy) ||
    parsed.costPolicyHash !== sha256AuthorityValue(profile.costPolicy) ||
    Date.parse(parsed.expiresAt) <= Date.parse(input.now)
  ) throw new Error('Canonical provider-work V3 authorization is stale or changed.')
  return parsed
}

export function canonicalProviderWorkAuthorizationRequestHashV3(
  authorization: CanonicalProviderWorkAuthorizationV3,
): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-work-authorization-request:v3',
    authorizationHash: authorization.authorityHash,
    queueDefinitionHash: authorization.queueDefinitionHash,
    queueJobDefinitionHash: authorization.queueJobDefinitionHash,
    idempotencyKeyHash: authorization.idempotencyKeyHash,
    expectedOutputSetHash: authorization.expectedOutputSetHash,
  })
}

export function canonicalProviderOperationRegistryV3Hash(): string {
  return sha256AuthorityValue(createCanonicalProviderOperationRegistryV3())
}
