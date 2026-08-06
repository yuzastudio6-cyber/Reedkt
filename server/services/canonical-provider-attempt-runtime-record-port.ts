import { z } from 'zod'

import {
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
  CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
} from '../edit-architecture/canonical-provider-work-authority'
import {
  resolveCanonicalProviderLifecyclePolicy,
} from '../edit-architecture/canonical-provider-lifecycle-policy'
import { ApiError } from '../errors/api-error'
import {
  canonicalProviderAttemptConsumerReceiptSchema,
  type CanonicalProviderAttemptConsumerReceipt,
} from '../validation/canonical-provider-attempt-consumer-receipt-schemas'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_PORT_VERSION =
  'canonical-provider-attempt-runtime-record-port-v1' as const
export const CANONICAL_PROVIDER_ATTEMPT_RUNTIME_LOCATOR_VERSION =
  'canonical-provider-attempt-runtime-locator-v1' as const
export const CANONICAL_PROVIDER_ATTEMPT_CURRENT_RELEASE_IDENTITY_VERSION =
  'canonical-provider-attempt-current-release-identity-v1' as const
export const CANONICAL_PROVIDER_ATTEMPT_RELEASE_EVIDENCE_VERSION =
  'canonical-provider-attempt-release-evidence-v1' as const
export const CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_VERSION =
  'canonical-provider-attempt-runtime-record-v1' as const
export const CANONICAL_PROVIDER_ATTEMPT_RELEASE_QUALIFICATION_VERSION =
  'canonical-provider-attempt-release-qualification-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const providerIdentity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const gitObjectId = z.string().regex(/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u)
const timestamp = z.string().datetime({ offset: true })
const safeMicros = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

const operationIdSchema = z.enum([
  CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
])

const attemptOutcomeSchema = z.enum([
  'never_submitted',
  'completed',
  'failed',
  'cancelled',
  'unknown_reconciliation_required',
  'unknown_reconciled_completed',
  'unknown_reconciled_failed',
])

export const canonicalProviderAttemptRuntimeLocatorSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVIDER_ATTEMPT_RUNTIME_LOCATOR_VERSION),
  sourceAuthority: z.literal(
    'server_owned_current_provider_attempt_authority',
  ),
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  approvedPlanSnapshotHash: sha256,
  packageRecordId: identity,
  packageHash: sha256,
  workGraphHash: sha256,
  approvedWorkItemId: identity,
  approvedWorkItemHash: sha256,
  queueDefinitionHash: sha256,
  queueJobId: identity,
  queueJobDefinitionHash: sha256,
  authorizationHash: sha256,
  dispatchAttemptId: identity,
  operationId: operationIdSchema,
  sourceRequestId: identity,
  expectedOutputSetDigest: sha256,
  locatorDigest: sha256,
}).strict()

export type CanonicalProviderAttemptRuntimeLocator = z.infer<
  typeof canonicalProviderAttemptRuntimeLocatorSchema
>

/**
 * This identity is read from the server-owned deployment/release authority.
 * It is deliberately separate from attempt release evidence so an all-green
 * packet cannot assert which source, image, or runtime is currently serving.
 */
export const canonicalProviderAttemptCurrentReleaseIdentitySchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROVIDER_ATTEMPT_CURRENT_RELEASE_IDENTITY_VERSION,
  ),
  sourceAuthority: z.literal(
    'server_owned_current_release_identity_repository',
  ),
  releaseId: identity,
  sourceCommit: gitObjectId,
  sourceTree: gitObjectId,
  deploymentRevision: identity,
  runtimeImageDigest: sha256,
  buildProvenanceDigest: sha256,
  queueRuntimeEvidenceDigest: sha256,
  leaseRuntimeEvidenceDigest: sha256,
  outputRepositoryEvidenceDigest: sha256,
  providerRateAuthorityEvidenceDigest: sha256,
  workerCostAuthorityEvidenceDigest: sha256,
  recordedAt: timestamp,
  identityDigest: sha256,
}).strict()

export type CanonicalProviderAttemptCurrentReleaseIdentity = z.infer<
  typeof canonicalProviderAttemptCurrentReleaseIdentitySchema
>

export const canonicalProviderAttemptReleaseEvidenceSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVIDER_ATTEMPT_RELEASE_EVIDENCE_VERSION),
  evidenceClass: z.literal('canonical_same_release_provider_runtime_evidence'),
  sourceAuthority: z.literal(
    'canonical_provider_attempt_release_evidence_repository',
  ),
  releaseId: identity,
  sourceCommit: gitObjectId,
  sourceTree: gitObjectId,
  deploymentRevision: identity,
  runtimeImageDigest: sha256,
  currentReleaseIdentityDigest: sha256,
  sourceReceiptHash: sha256,
  locatorDigest: sha256,
  authorizationHash: sha256,
  dispatchAttemptId: identity,
  operationId: operationIdSchema,
  serviceIdentityEvidenceDigest: sha256,
  pinnedSecretBindingEvidenceDigest: sha256,
  providerTransportQualificationDigest: sha256,
  providerAccountQualificationDigest: sha256,
  immutableProviderRevisionEvidenceDigest: sha256,
  queueRuntimeEvidenceDigest: sha256,
  leaseRuntimeEvidenceDigest: sha256,
  oneUseDispatchEvidenceDigest: sha256,
  outputRepositoryEvidenceDigest: sha256,
  privateOutputReadbackEvidenceDigest: sha256,
  providerRateAuthorityEvidenceDigest: sha256,
  providerUsageAndCostEvidenceDigest: sha256,
  workerResourceUsageEvidenceDigest: sha256,
  workerCostAuthorityEvidenceDigest: sha256,
  workerInfrastructureCostSettlementEvidenceDigest: sha256,
  sameReleaseAcceptanceEvidenceDigest: sha256,
  verifiedAt: timestamp,
  gates: z.object({
    exactSourceAndTreeDeployed: z.literal(true),
    immutableRuntimeImageVerified: z.literal(true),
    workloadIdentityVerified: z.literal(true),
    serviceAccountJsonKeyAbsent: z.literal(true),
    exactPinnedSecretVersionVerified: z.literal(true),
    directEnvironmentSecretFallbackRejected: z.literal(true),
    githubSecretRuntimeAuthorityRejected: z.literal(true),
    canonicalQueueLeaseAndIdempotencyVerified: z.literal(true),
    oneUseProviderDispatchVerified: z.literal(true),
    providerTransportQualified: z.literal(true),
    providerAccountModelAndFundsQualified: z.literal(true),
    immutableProviderRevisionQualified: z.literal(true),
    providerRateAuthorityQualified: z.literal(true),
    privateCreateOnlyOutputReadbackVerified: z.literal(true),
    providerUsageAndCostReconciled: z.literal(true),
    workerResourceUsageObserved: z.literal(true),
    workerInfrastructureRateAuthorityQualified: z.literal(true),
    workerInfrastructureCostReconciled: z.literal(true),
    failedAndUnknownAttemptCostRetained: z.literal(true),
    sameReleaseProtectedAcceptanceVerified: z.literal(true),
  }).strict(),
  commercialBoundary: z.object({
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  deliveryBoundary: z.object({
    privateInternalTestingOnly: z.literal(true),
    browserAuthorityIncluded: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  evidenceDigest: sha256,
}).strict()

export type CanonicalProviderAttemptReleaseEvidence = z.infer<
  typeof canonicalProviderAttemptReleaseEvidenceSchema
>

const blockerSchema = z.enum([
  'private_injected_source_evidence',
  'canonical_backend_runtime_receipt_unreleased',
  'trusted_release_evidence_missing',
  'trusted_release_port_unqualified',
  'current_release_identity_missing',
  'current_release_identity_mismatch',
  'provider_request_not_observed',
  'provider_output_not_provider_generated',
  'provider_usage_or_cost_not_reconciled',
  'worker_infrastructure_rate_is_provisional',
  'worker_infrastructure_cost_not_reconciled',
  'provider_attempt_not_successful',
  'canonical_checkback_permit_required',
  'provider_attempt_cancelled',
  'provider_attempt_never_submitted',
  'canonical_cancellation_receipt_schema_gap',
])

export const canonicalProviderAttemptNonExecutionEvidenceSchema = z.object({
  schemaVersion: z.literal('canonical-provider-attempt-non-execution-evidence-v1'),
  sourceAuthority: z.literal('canonical_provider_attempt_lifecycle_repository'),
  attemptState: z.enum(['never_submitted', 'cancelled']),
  locatorDigest: sha256,
  queueDefinitionHash: sha256,
  queueEntryHash: sha256.nullable(),
  queueState: z.enum(['queued', 'leased']).nullable(),
  queueAttemptId: identity.nullable(),
  leaseId: identity.nullable(),
  leaseHash: sha256.nullable(),
  dispatchGrantId: identity.nullable(),
  dispatchGrantHash: sha256.nullable(),
  dispatchAttemptId: identity.nullable(),
  providerRouteId: identity,
  providerModelId: providerIdentity,
  providerRequestStarted: z.boolean(),
  providerRequestCount: z.union([z.literal(0), z.literal(1)]),
  providerAttemptCostEvidenceHash: sha256.nullable(),
  workerResourceEvidenceHash: sha256.nullable(),
  failedOrUnknownAttemptCostRetained: z.literal(true),
  cancellationReceiptDigest: sha256.nullable(),
  canonicalCheckbackPermitDigest: z.null(),
  fallbackAllowed: z.literal(false),
  rerunAllowed: z.literal(false),
  recordedAt: timestamp,
  evidenceDigest: sha256,
}).strict().superRefine((value, context) => {
  const neverSubmitted = value.attemptState === 'never_submitted'
  if (
    (neverSubmitted && (
      value.queueEntryHash !== null ||
      value.queueState !== null ||
      value.queueAttemptId !== null ||
      value.leaseId !== null ||
      value.leaseHash !== null ||
      value.dispatchGrantId !== null ||
      value.dispatchGrantHash !== null ||
      value.dispatchAttemptId !== null ||
      value.providerRequestStarted ||
      value.providerRequestCount !== 0 ||
      value.providerAttemptCostEvidenceHash !== null ||
      value.workerResourceEvidenceHash !== null ||
      value.cancellationReceiptDigest !== null
    )) ||
    (!neverSubmitted && value.cancellationReceiptDigest === null) ||
    (!neverSubmitted && value.providerRequestStarted && (
      value.providerAttemptCostEvidenceHash === null ||
      value.workerResourceEvidenceHash === null
    )) ||
    (value.providerRequestStarted !== (value.providerRequestCount === 1)) ||
    ((value.leaseId === null) !== (value.leaseHash === null)) ||
    ((value.dispatchGrantId === null) !== (value.dispatchGrantHash === null))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Provider non-execution lifecycle evidence is inconsistent.',
    })
  }
})

export type CanonicalProviderAttemptNonExecutionEvidence = z.infer<
  typeof canonicalProviderAttemptNonExecutionEvidenceSchema
>

const consumerProjectionSchema = z.object({
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  approvedPlanSnapshotHash: sha256,
  packageRecordId: identity,
  packageHash: sha256,
  workGraphHash: sha256,
  approvedWorkItemId: identity,
  approvedWorkItemHash: sha256,
  queueDefinitionHash: sha256,
  queueJobId: identity,
  queueJobDefinitionHash: sha256,
  queueAttemptId: identity,
  leaseId: identity,
  leaseHash: sha256,
  dispatchGrantId: identity,
  dispatchGrantHash: sha256,
  dispatchAttemptId: identity,
  dispatchAttemptHash: sha256,
  operationId: operationIdSchema,
  providerRouteId: identity,
  providerModelId: providerIdentity,
  providerLifecyclePolicyHash: sha256,
  providerRateCardDigest: sha256,
  attemptOutcome: attemptOutcomeSchema.exclude([
    'never_submitted',
    'cancelled',
  ]),
  providerRequestStarted: z.boolean(),
  providerRequestCount: z.union([z.literal(0), z.literal(1)]),
  outputSetDigest: sha256,
  privateOutputs: z.array(z.object({
    outputId: identity,
    role: identity,
    assetVersionId: identity,
    privateObjectIdentityHash: sha256,
    contentSha256: sha256,
    byteLength: z.number().int().positive().max(256 * 1024 * 1024),
    mimeType: z.enum([
      'audio/wav',
      'video/mp4',
      'audio/mpeg',
      'application/json',
    ]),
    providerGenerated: z.boolean(),
  }).strict()).max(8),
  providerAttemptCostEvidenceHash: sha256,
  providerUsageEvidenceDigest: sha256.nullable(),
  providerCostMicros: safeMicros.nullable(),
  providerUsageAndCostReconciled: z.boolean(),
  workerResourceEvidenceHash: sha256,
  workerResourceUsageObserved: z.boolean(),
  workerInfrastructureRateCardDigest: sha256,
  workerInfrastructureCostMicros: safeMicros,
  workerInfrastructureCostProvisional: z.boolean(),
  workerInfrastructureCostReconciled: z.boolean(),
  provisionalTotalInternalCostMicros: safeMicros.nullable(),
  productionInternalCostReconciled: z.boolean(),
  failedOrUnknownAttemptCostRetained: z.literal(true),
  canonicalCheckbackRequired: z.boolean(),
  canonicalCheckbackPermitIncluded: z.literal(false),
  fallbackAllowed: z.literal(false),
  rerunAllowed: z.literal(false),
  rawCredentialIncluded: z.literal(false),
  providerUrlIncluded: z.literal(false),
  customerCommercialAuthorityIncluded: z.literal(false),
}).strict()

export const canonicalProviderAttemptRuntimeRecordSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_VERSION),
  recordKind: z.literal('provider_attempt'),
  recordId: identity,
  attemptOutcome: attemptOutcomeSchema.exclude([
    'never_submitted',
    'cancelled',
  ]),
  state: z.enum([
    'non_promotable_private_injected',
    'validated_unreleased_runtime_blocked',
    'canonical_backend_verified_runtime',
  ]),
  evidenceClass: z.enum([
    'private_injected_nonprovider_test',
    'canonical_backend_runtime_unreleased',
    'canonical_backend_verified_runtime',
  ]),
  promotionClass: z.enum([
    'non_promotable_private_injected',
    'unreleased_runtime_not_production',
    'released_private_provider_runtime',
  ]),
  locator: canonicalProviderAttemptRuntimeLocatorSchema,
  sourceReceiptHash: sha256,
  sourceOutputSetDigest: sha256,
  releaseEvidenceDigest: sha256.nullable(),
  currentReleaseIdentityDigest: sha256.nullable(),
  verification: z.object({
    exactLocatorMatched: z.literal(true),
    sourceReceiptHashVerified: z.literal(true),
    sourceOutputSetDigestVerified: z.literal(true),
    exactReleaseEvidenceDigestVerified: z.boolean(),
    exactCurrentReleaseIdentityDigestVerified: z.boolean(),
    exactReleaseEvidenceLineageMatched: z.boolean(),
    exactCurrentReleaseIdentityMatched: z.boolean(),
    runtimePortQualified: z.boolean(),
    providerRequestObserved: z.boolean(),
    providerGeneratedPrivateOutputObserved: z.boolean(),
    providerUsageAndCostReconciled: z.boolean(),
    workerResourceUsageObserved: z.boolean(),
    workerInfrastructureCostProvisional: z.boolean(),
    workerInfrastructureCostReconciled: z.boolean(),
    productionInternalCostReconciled: z.boolean(),
  }).strict(),
  consumerProjection: consumerProjectionSchema,
  blockers: z.array(blockerSchema).max(16),
  boundaries: z.object({
    serverOnly: z.literal(true),
    callerMaySelectExecutable: z.literal(false),
    callerMaySelectProviderRoute: z.literal(false),
    browserAuthorityIncluded: z.literal(false),
    rawCredentialIncluded: z.literal(false),
    rawPromptOrRequestBodyIncluded: z.literal(false),
    providerUrlIncluded: z.literal(false),
    customerCommercialAuthorityIncluded: z.literal(false),
    sourceReceiptClaimsObservedTransport: z.boolean(),
    providerTransportActivated: z.boolean(),
    canonicalBackendVerifiedRuntime: z.boolean(),
    promotionAuthorized: z.boolean(),
    productionReady: z.literal(false),
  }).strict(),
  projectedAt: timestamp,
  recordDigest: sha256,
}).strict().superRefine((value, context) => {
  const verified = value.state === 'canonical_backend_verified_runtime'
  const injected = value.state === 'non_promotable_private_injected'
  if (
    (verified && (
      !['completed', 'unknown_reconciled_completed'].includes(
        value.attemptOutcome,
      ) ||
      value.evidenceClass !== 'canonical_backend_verified_runtime' ||
      value.promotionClass !== 'released_private_provider_runtime' ||
      value.releaseEvidenceDigest === null ||
      value.currentReleaseIdentityDigest === null ||
      value.blockers.length !== 0 ||
      !value.verification.exactReleaseEvidenceDigestVerified ||
      !value.verification.exactCurrentReleaseIdentityDigestVerified ||
      !value.verification.exactReleaseEvidenceLineageMatched ||
      !value.verification.exactCurrentReleaseIdentityMatched ||
      !value.verification.runtimePortQualified ||
      !value.verification.providerRequestObserved ||
      !value.verification.providerGeneratedPrivateOutputObserved ||
      !value.verification.providerUsageAndCostReconciled ||
      !value.verification.workerResourceUsageObserved ||
      !value.verification.workerInfrastructureCostReconciled ||
      !value.verification.productionInternalCostReconciled ||
      !value.boundaries.providerTransportActivated ||
      !value.boundaries.canonicalBackendVerifiedRuntime ||
      !value.boundaries.promotionAuthorized
    )) ||
    (injected && (
      value.evidenceClass !== 'private_injected_nonprovider_test' ||
      value.promotionClass !== 'non_promotable_private_injected' ||
      !value.blockers.includes('private_injected_source_evidence')
    )) ||
    (!verified && (
      value.boundaries.providerTransportActivated ||
      value.boundaries.canonicalBackendVerifiedRuntime ||
      value.boundaries.promotionAuthorized
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical provider-attempt runtime record is inconsistent.',
    })
  }
})

export type CanonicalProviderAttemptRuntimeRecord = z.infer<
  typeof canonicalProviderAttemptRuntimeRecordSchema
>

export const canonicalProviderAttemptNonExecutionRecordSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_VERSION),
  recordKind: z.literal('provider_non_execution'),
  recordId: identity,
  attemptOutcome: z.enum(['never_submitted', 'cancelled']),
  locator: canonicalProviderAttemptRuntimeLocatorSchema,
  lifecycleEvidenceDigest: sha256,
  consumerProjection: z.object({
    ownerUserId: identity,
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    approvedWorkItemId: identity,
    queueJobId: identity,
    operationId: operationIdSchema,
    providerRouteId: identity,
    providerModelId: providerIdentity,
    attemptOutcome: z.enum(['never_submitted', 'cancelled']),
    queueAttemptId: identity.nullable(),
    leaseId: identity.nullable(),
    leaseHash: sha256.nullable(),
    dispatchGrantId: identity.nullable(),
    dispatchGrantHash: sha256.nullable(),
    dispatchAttemptId: identity.nullable(),
    providerRequestStarted: z.boolean(),
    providerRequestCount: z.union([z.literal(0), z.literal(1)]),
    providerAttemptCostEvidenceHash: sha256.nullable(),
    workerResourceEvidenceHash: sha256.nullable(),
    failedOrUnknownAttemptCostRetained: z.literal(true),
    cancellationReceiptDigest: sha256.nullable(),
    canonicalCheckbackPermitIncluded: z.literal(false),
    fallbackAllowed: z.literal(false),
    rerunAllowed: z.literal(false),
    rawCredentialIncluded: z.literal(false),
    providerUrlIncluded: z.literal(false),
    customerCommercialAuthorityIncluded: z.literal(false),
  }).strict(),
  blockers: z.array(blockerSchema).min(1).max(4),
  boundaries: z.object({
    serverOnly: z.literal(true),
    cancellationPromotionBlockedByReceiptSchemaGap: z.boolean(),
    canonicalBackendVerifiedRuntime: z.literal(false),
    promotionAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  projectedAt: timestamp,
  recordDigest: sha256,
}).strict()

export type CanonicalProviderAttemptNonExecutionRecord = z.infer<
  typeof canonicalProviderAttemptNonExecutionRecordSchema
>

export type CanonicalProviderAttemptRuntimeRead =
  | CanonicalProviderAttemptRuntimeRecord
  | CanonicalProviderAttemptNonExecutionRecord

export type CanonicalProviderAttemptRuntimeSourceRead =
  | {
      state: 'attempt_record'
      receipt: CanonicalProviderAttemptConsumerReceipt
      releaseEvidence: CanonicalProviderAttemptReleaseEvidence | null
    }
  | {
      state: 'never_submitted' | 'cancelled'
      lifecycleEvidence: CanonicalProviderAttemptNonExecutionEvidence
    }

export interface CanonicalProviderAttemptRuntimeRecordSourcePort {
  readonly contractVersion:
    typeof CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_PORT_VERSION
  readonly sourceAuthority:
    | 'controlled_provider_attempt_record_fixture'
    | 'canonical_provider_attempt_release_evidence_repository'
  readonly evidenceClass:
    | 'controlled_unreleased_contract'
    | 'canonical_same_release_live_runtime'
  readonly productionAuthority: boolean
  readExactAttempt(
    locator: CanonicalProviderAttemptRuntimeLocator,
  ): Promise<CanonicalProviderAttemptRuntimeSourceRead | null>
  readCurrentReleaseIdentity(): Promise<
    CanonicalProviderAttemptCurrentReleaseIdentity | null
  >
}

/** A future released adapter must satisfy this exact repository shape. */
export interface CanonicalProviderAttemptReleasedRepositoryAdapter {
  readonly contractVersion:
    typeof CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_PORT_VERSION
  readonly sourceAuthority:
    'canonical_provider_attempt_release_evidence_repository'
  readExactAttempt(
    locator: CanonicalProviderAttemptRuntimeLocator,
  ): Promise<CanonicalProviderAttemptRuntimeSourceRead | null>
}

/**
 * This is an opaque process capability, not JSON configuration. This source
 * exposes no issuer. A later reviewed same-release adapter must add the issuer
 * here and bind the exact repository plus current-release identity authority.
 */
export interface CanonicalProviderAttemptReleaseQualificationCapability {
  readonly contractVersion:
    typeof CANONICAL_PROVIDER_ATTEMPT_RELEASE_QUALIFICATION_VERSION
  readonly capabilityClass:
    'server_owned_provider_attempt_release_qualification'
  readCurrentReleaseIdentity(): Promise<
    CanonicalProviderAttemptCurrentReleaseIdentity | null
  >
}

const controlledPorts = new WeakSet<object>()
const qualifiedReleasePorts = new WeakSet<object>()
const reviewedReleaseQualifications = new WeakMap<
  CanonicalProviderAttemptReleaseQualificationCapability,
  CanonicalProviderAttemptReleasedRepositoryAdapter
>()

/**
 * Internal/test-only adapter. Even a structurally complete release packet and
 * current-release identity remain non-promotable through this port.
 */
export function createControlledCanonicalProviderAttemptRuntimeRecordPort(input: {
  readExactAttempt:
    CanonicalProviderAttemptRuntimeRecordSourcePort['readExactAttempt']
  readCurrentReleaseIdentity?:
    CanonicalProviderAttemptRuntimeRecordSourcePort['readCurrentReleaseIdentity']
}): CanonicalProviderAttemptRuntimeRecordSourcePort {
  const port: CanonicalProviderAttemptRuntimeRecordSourcePort = Object.freeze({
    contractVersion: CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_PORT_VERSION,
    sourceAuthority: 'controlled_provider_attempt_record_fixture' as const,
    evidenceClass: 'controlled_unreleased_contract' as const,
    productionAuthority: false,
    readExactAttempt: input.readExactAttempt,
    readCurrentReleaseIdentity: input.readCurrentReleaseIdentity ??
      (async () => null),
  })
  controlledPorts.add(port)
  return port
}

/**
 * Reviewable future construction boundary. It cannot succeed in this source
 * version because there is intentionally no public or caller-driven way to
 * enter reviewedReleaseQualifications.
 */
export function createQualifiedCanonicalProviderAttemptRuntimeRecordPort(input: {
  qualification: CanonicalProviderAttemptReleaseQualificationCapability
  repository: CanonicalProviderAttemptReleasedRepositoryAdapter
}): CanonicalProviderAttemptRuntimeRecordSourcePort {
  if (reviewedReleaseQualifications.get(input.qualification) !== input.repository) {
    throw notReady(
      'Provider-attempt release qualification is not admitted by this source version.',
      'canonical_provider_attempt_release_qualification_missing',
    )
  }
  const port: CanonicalProviderAttemptRuntimeRecordSourcePort = Object.freeze({
    contractVersion: CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_PORT_VERSION,
    sourceAuthority: 'canonical_provider_attempt_release_evidence_repository',
    evidenceClass: 'canonical_same_release_live_runtime',
    productionAuthority: true,
    readExactAttempt: input.repository.readExactAttempt.bind(input.repository),
    readCurrentReleaseIdentity:
      input.qualification.readCurrentReleaseIdentity.bind(input.qualification),
  })
  qualifiedReleasePorts.add(port)
  return port
}

export function createCanonicalProviderAttemptRuntimeLocator(input: Omit<
  CanonicalProviderAttemptRuntimeLocator,
  'schemaVersion' | 'sourceAuthority' | 'locatorDigest'
>): CanonicalProviderAttemptRuntimeLocator {
  const payload = {
    schemaVersion: CANONICAL_PROVIDER_ATTEMPT_RUNTIME_LOCATOR_VERSION,
    sourceAuthority: 'server_owned_current_provider_attempt_authority' as const,
    ...input,
  }
  return canonicalProviderAttemptRuntimeLocatorSchema.parse({
    ...payload,
    locatorDigest: sha256AuthorityValue(payload),
  })
}

export async function readCanonicalProviderAttemptRuntimeRecord(input: {
  hosted: boolean
  port?: CanonicalProviderAttemptRuntimeRecordSourcePort
  locator: CanonicalProviderAttemptRuntimeLocator
  projectedAt: string
}): Promise<CanonicalProviderAttemptRuntimeRead> {
  const locator = assertLocator(input.locator)
  const projectedAt = canonicalTimestamp(input.projectedAt)
  const port = resolvePort(input.hosted, input.port)
  const located = await port.readExactAttempt(locator)
  if (!located) throw notReady(
    'The exact canonical provider-attempt runtime record is unavailable.',
    'canonical_provider_attempt_runtime_record_missing',
  )
  if (located.state !== 'attempt_record') {
    return projectNonExecutionRecord(locator, located, projectedAt)
  }

  const receipt = assertSourceReceipt(located.receipt)
  assertLocatorMatchesReceipt(locator, receipt)
  if (Date.parse(projectedAt) < Date.parse(receipt.projectedAt)) {
    throw invalid('Provider-attempt runtime projection predates its source receipt.')
  }

  const releaseEvidence = located.releaseEvidence === null
    ? null
    : assertReleaseEvidence(located.releaseEvidence)
  const currentReleaseIdentity = releaseEvidence === null
    ? null
    : await readAndVerifyCurrentReleaseIdentity(port)
  const releaseLineageMatched = releaseEvidence !== null &&
    releaseEvidence.sourceReceiptHash === receipt.receiptHash &&
    releaseEvidence.locatorDigest === locator.locatorDigest &&
    releaseEvidence.authorizationHash === locator.authorizationHash &&
    releaseEvidence.dispatchAttemptId === locator.dispatchAttemptId &&
    releaseEvidence.operationId === locator.operationId
  const currentReleaseIdentityMatched = releaseEvidence !== null &&
    currentReleaseIdentity !== null &&
    releaseEvidence.releaseId === currentReleaseIdentity.releaseId &&
    releaseEvidence.sourceCommit === currentReleaseIdentity.sourceCommit &&
    releaseEvidence.sourceTree === currentReleaseIdentity.sourceTree &&
    releaseEvidence.deploymentRevision ===
      currentReleaseIdentity.deploymentRevision &&
    releaseEvidence.runtimeImageDigest ===
      currentReleaseIdentity.runtimeImageDigest &&
    releaseEvidence.currentReleaseIdentityDigest ===
      currentReleaseIdentity.identityDigest &&
    releaseEvidence.queueRuntimeEvidenceDigest ===
      currentReleaseIdentity.queueRuntimeEvidenceDigest &&
    releaseEvidence.leaseRuntimeEvidenceDigest ===
      currentReleaseIdentity.leaseRuntimeEvidenceDigest &&
    releaseEvidence.outputRepositoryEvidenceDigest ===
      currentReleaseIdentity.outputRepositoryEvidenceDigest &&
    releaseEvidence.providerRateAuthorityEvidenceDigest ===
      currentReleaseIdentity.providerRateAuthorityEvidenceDigest &&
    releaseEvidence.workerCostAuthorityEvidenceDigest ===
      currentReleaseIdentity.workerCostAuthorityEvidenceDigest
  const runtimePortQualified = qualifiedReleasePorts.has(port)
  const providerRequestObserved =
    receipt.dispatch.providerRequestStarted &&
    receipt.requestAccounting.observedTransport.generationSubmissionCount === 1 &&
    receipt.requestAccounting.injectedSimulationGenerationSubmissionCount === 0
  const attemptOutcome = projectAttemptOutcome(receipt.dispatch.terminalState)
  const successful = attemptOutcome === 'completed' ||
    attemptOutcome === 'unknown_reconciled_completed'
  const providerGeneratedPrivateOutputObserved = successful &&
    receipt.privateOutputs.length > 0 &&
    receipt.privateOutputs.every((output) => output.providerGenerated)
  const providerUsageAndCostReconciled =
    receipt.internalCost.providerCostReconciled &&
    receipt.internalCost.providerCostMicros !== null &&
    receipt.internalCost.providerUsageEvidenceDigest !== null
  const workerResourceUsageObserved =
    receipt.workerResourceUsage.evidenceClass ===
      'canonical_backend_observed_usage_unreleased' &&
    receipt.internalCost.workerResourceEvidenceHash.length === 64 &&
    receipt.internalCost.workerInfrastructureEvidenceDigest.length === 64
  const workerInfrastructureCostProvisional =
    receipt.internalCost.placeholderInfrastructureRate ||
    !receipt.internalCost.infrastructureInvoiceReconciled
  const workerInfrastructureCostReconciled =
    !receipt.internalCost.placeholderInfrastructureRate &&
    receipt.internalCost.infrastructureInvoiceReconciled
  const productionInternalCostReconciled =
    providerUsageAndCostReconciled &&
    workerResourceUsageObserved &&
    workerInfrastructureCostReconciled
  const releaseVerified = releaseEvidence !== null &&
    currentReleaseIdentity !== null &&
    releaseLineageMatched &&
    currentReleaseIdentityMatched &&
    runtimePortQualified &&
    providerRequestObserved &&
    providerGeneratedPrivateOutputObserved &&
    productionInternalCostReconciled &&
    successful &&
    receipt.evidenceClass === 'canonical_backend_runtime_unreleased'

  const blockers: z.infer<typeof blockerSchema>[] = []
  if (receipt.evidenceClass === 'private_injected_nonprovider_test') {
    blockers.push('private_injected_source_evidence')
  } else if (!releaseVerified) {
    blockers.push('canonical_backend_runtime_receipt_unreleased')
  }
  if (!releaseEvidence) blockers.push('trusted_release_evidence_missing')
  if (!runtimePortQualified) blockers.push('trusted_release_port_unqualified')
  if (releaseEvidence && !currentReleaseIdentity) {
    blockers.push('current_release_identity_missing')
  } else if (releaseEvidence && !currentReleaseIdentityMatched) {
    blockers.push('current_release_identity_mismatch')
  }
  if (!providerRequestObserved) blockers.push('provider_request_not_observed')
  if (successful && !providerGeneratedPrivateOutputObserved) {
    blockers.push('provider_output_not_provider_generated')
  }
  if (providerRequestObserved && !providerUsageAndCostReconciled) {
    blockers.push('provider_usage_or_cost_not_reconciled')
  }
  if (workerInfrastructureCostProvisional) {
    blockers.push('worker_infrastructure_rate_is_provisional')
  }
  if (!workerInfrastructureCostReconciled) {
    blockers.push('worker_infrastructure_cost_not_reconciled')
  }
  if (!successful) {
    blockers.push('provider_attempt_not_successful')
    blockers.push('canonical_checkback_permit_required')
  }

  const state = releaseVerified
    ? 'canonical_backend_verified_runtime' as const
    : receipt.evidenceClass === 'private_injected_nonprovider_test'
      ? 'non_promotable_private_injected' as const
      : 'validated_unreleased_runtime_blocked' as const
  const evidenceClass = releaseVerified
    ? 'canonical_backend_verified_runtime' as const
    : receipt.evidenceClass
  const promotionClass = releaseVerified
    ? 'released_private_provider_runtime' as const
    : receipt.promotionClass
  const payload = {
    schemaVersion: CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_VERSION,
    recordKind: 'provider_attempt' as const,
    recordId: `provider_runtime_${sha256AuthorityValue({
      locatorDigest: locator.locatorDigest,
      receiptHash: receipt.receiptHash,
      releaseEvidenceDigest: releaseEvidence?.evidenceDigest ?? null,
      currentReleaseIdentityDigest:
        currentReleaseIdentity?.identityDigest ?? null,
    }).slice(0, 48)}`,
    attemptOutcome,
    state,
    evidenceClass,
    promotionClass,
    locator,
    sourceReceiptHash: receipt.receiptHash,
    sourceOutputSetDigest: receipt.outputSet.outputSetDigest,
    releaseEvidenceDigest: releaseEvidence?.evidenceDigest ?? null,
    currentReleaseIdentityDigest:
      currentReleaseIdentity?.identityDigest ?? null,
    verification: {
      exactLocatorMatched: true as const,
      sourceReceiptHashVerified: true as const,
      sourceOutputSetDigestVerified: true as const,
      exactReleaseEvidenceDigestVerified: releaseEvidence !== null,
      exactCurrentReleaseIdentityDigestVerified:
        currentReleaseIdentity !== null,
      exactReleaseEvidenceLineageMatched: releaseLineageMatched,
      exactCurrentReleaseIdentityMatched: currentReleaseIdentityMatched,
      runtimePortQualified,
      providerRequestObserved,
      providerGeneratedPrivateOutputObserved,
      providerUsageAndCostReconciled,
      workerResourceUsageObserved,
      workerInfrastructureCostProvisional,
      workerInfrastructureCostReconciled,
      productionInternalCostReconciled,
    },
    consumerProjection: projectConsumerReceipt({
      receipt,
      attemptOutcome,
      providerRequestObserved,
      providerUsageAndCostReconciled,
      workerResourceUsageObserved,
      workerInfrastructureCostProvisional,
      workerInfrastructureCostReconciled,
      productionInternalCostReconciled,
    }),
    blockers: [...new Set(blockers)],
    boundaries: {
      serverOnly: true as const,
      callerMaySelectExecutable: false as const,
      callerMaySelectProviderRoute: false as const,
      browserAuthorityIncluded: false as const,
      rawCredentialIncluded: false as const,
      rawPromptOrRequestBodyIncluded: false as const,
      providerUrlIncluded: false as const,
      customerCommercialAuthorityIncluded: false as const,
      sourceReceiptClaimsObservedTransport: providerRequestObserved,
      providerTransportActivated: releaseVerified,
      canonicalBackendVerifiedRuntime: releaseVerified,
      promotionAuthorized: releaseVerified,
      productionReady: false as const,
    },
    projectedAt,
  }
  return deepFreeze(canonicalProviderAttemptRuntimeRecordSchema.parse({
    ...payload,
    recordDigest: sha256AuthorityValue(payload),
  }))
}

function projectConsumerReceipt(input: {
  receipt: CanonicalProviderAttemptConsumerReceipt
  attemptOutcome: Exclude<
    z.infer<typeof attemptOutcomeSchema>,
    'never_submitted' | 'cancelled'
  >
  providerRequestObserved: boolean
  providerUsageAndCostReconciled: boolean
  workerResourceUsageObserved: boolean
  workerInfrastructureCostProvisional: boolean
  workerInfrastructureCostReconciled: boolean
  productionInternalCostReconciled: boolean
}): z.infer<typeof consumerProjectionSchema> {
  const receipt = input.receipt
  const checkbackRequired = input.attemptOutcome !== 'completed' &&
    input.attemptOutcome !== 'unknown_reconciled_completed'
  return consumerProjectionSchema.parse({
    ownerUserId: receipt.identity.ownerUserId,
    workspaceId: receipt.identity.workspaceId,
    projectId: receipt.identity.projectId,
    editSessionId: receipt.identity.editSessionId,
    approvedPlanSnapshotId: receipt.identity.approvedPlanSnapshotId,
    approvedPlanSnapshotHash: receipt.identity.approvedPlanSnapshotHash,
    packageRecordId: receipt.identity.packageRecordId,
    packageHash: receipt.identity.packageHash,
    workGraphHash: receipt.identity.workGraphHash,
    approvedWorkItemId: receipt.identity.approvedWorkItemId,
    approvedWorkItemHash: receipt.identity.approvedWorkItemHash,
    queueDefinitionHash: receipt.identity.queueDefinitionHash,
    queueJobId: receipt.identity.queueJobId,
    queueJobDefinitionHash: receipt.identity.queueJobDefinitionHash,
    queueAttemptId: receipt.queue.queueAttemptId,
    leaseId: receipt.queue.leaseId,
    leaseHash: receipt.queue.leaseHash,
    dispatchGrantId: receipt.dispatch.grantId,
    dispatchGrantHash: receipt.dispatch.immutableGrantHash,
    dispatchAttemptId: receipt.dispatch.dispatchAttemptId,
    dispatchAttemptHash: receipt.dispatch.dispatchAttemptHash,
    operationId: receipt.provider.operationId,
    providerRouteId: receipt.provider.providerRouteId,
    providerModelId: receipt.provider.providerModelId,
    providerLifecyclePolicyHash: receipt.provider.lifecyclePolicyHash,
    providerRateCardDigest: receipt.internalCost.providerRateCardDigest,
    attemptOutcome: input.attemptOutcome,
    providerRequestStarted: receipt.dispatch.providerRequestStarted,
    providerRequestCount:
      receipt.requestAccounting.accountedGenerationSubmissionCount,
    outputSetDigest: receipt.outputSet.outputSetDigest,
    privateOutputs: receipt.privateOutputs.map((output) => ({
      outputId: output.outputId,
      role: output.role,
      assetVersionId: output.assetVersionId,
      privateObjectIdentityHash: output.privateObjectIdentityHash,
      contentSha256: output.contentSha256,
      byteLength: output.byteLength,
      mimeType: output.mimeType,
      providerGenerated: output.providerGenerated,
    })),
    providerAttemptCostEvidenceHash:
      receipt.internalCost.providerAttemptEvidenceHash,
    providerUsageEvidenceDigest:
      receipt.internalCost.providerUsageEvidenceDigest,
    providerCostMicros: receipt.internalCost.providerCostMicros,
    providerUsageAndCostReconciled:
      input.providerUsageAndCostReconciled,
    workerResourceEvidenceHash:
      receipt.internalCost.workerResourceEvidenceHash,
    workerResourceUsageObserved: input.workerResourceUsageObserved,
    workerInfrastructureRateCardDigest:
      receipt.internalCost.workerInfrastructureRateCardDigest,
    workerInfrastructureCostMicros:
      receipt.internalCost.selectedInfrastructureCostMicros,
    workerInfrastructureCostProvisional:
      input.workerInfrastructureCostProvisional,
    workerInfrastructureCostReconciled:
      input.workerInfrastructureCostReconciled,
    provisionalTotalInternalCostMicros:
      receipt.internalCost.selectedTotalInternalCostMicros,
    productionInternalCostReconciled:
      input.productionInternalCostReconciled,
    failedOrUnknownAttemptCostRetained:
      receipt.internalCost.failedOrUnknownAttemptCostRetained,
    canonicalCheckbackRequired: checkbackRequired,
    canonicalCheckbackPermitIncluded: false,
    fallbackAllowed: false,
    rerunAllowed: false,
    rawCredentialIncluded: false,
    providerUrlIncluded: false,
    customerCommercialAuthorityIncluded: false,
  })
}

function projectNonExecutionRecord(
  locator: CanonicalProviderAttemptRuntimeLocator,
  located: Extract<CanonicalProviderAttemptRuntimeSourceRead, {
    state: 'never_submitted' | 'cancelled'
  }>,
  projectedAt: string,
): CanonicalProviderAttemptNonExecutionRecord {
  const lifecycleEvidence = assertNonExecutionEvidence(
    located.lifecycleEvidence,
    locator,
  )
  if (lifecycleEvidence.attemptState !== located.state) {
    throw invalid('Provider non-execution state changed during lookup.')
  }
  if (Date.parse(projectedAt) < Date.parse(lifecycleEvidence.recordedAt)) {
    throw invalid('Provider non-execution projection predates source evidence.')
  }
  const cancelled = located.state === 'cancelled'
  const payload = {
    schemaVersion: CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_VERSION,
    recordKind: 'provider_non_execution' as const,
    recordId: `provider_non_execution_${sha256AuthorityValue({
      locatorDigest: locator.locatorDigest,
      lifecycleEvidenceDigest: lifecycleEvidence.evidenceDigest,
    }).slice(0, 48)}`,
    attemptOutcome: located.state,
    locator,
    lifecycleEvidenceDigest: lifecycleEvidence.evidenceDigest,
    consumerProjection: {
      ownerUserId: locator.ownerUserId,
      workspaceId: locator.workspaceId,
      projectId: locator.projectId,
      editSessionId: locator.editSessionId,
      approvedPlanSnapshotId: locator.approvedPlanSnapshotId,
      packageRecordId: locator.packageRecordId,
      approvedWorkItemId: locator.approvedWorkItemId,
      queueJobId: locator.queueJobId,
      operationId: locator.operationId,
      providerRouteId: lifecycleEvidence.providerRouteId,
      providerModelId: lifecycleEvidence.providerModelId,
      attemptOutcome: located.state,
      queueAttemptId: lifecycleEvidence.queueAttemptId,
      leaseId: lifecycleEvidence.leaseId,
      leaseHash: lifecycleEvidence.leaseHash,
      dispatchGrantId: lifecycleEvidence.dispatchGrantId,
      dispatchGrantHash: lifecycleEvidence.dispatchGrantHash,
      dispatchAttemptId: lifecycleEvidence.dispatchAttemptId,
      providerRequestStarted: lifecycleEvidence.providerRequestStarted,
      providerRequestCount: lifecycleEvidence.providerRequestCount,
      providerAttemptCostEvidenceHash:
        lifecycleEvidence.providerAttemptCostEvidenceHash,
      workerResourceEvidenceHash: lifecycleEvidence.workerResourceEvidenceHash,
      failedOrUnknownAttemptCostRetained:
        lifecycleEvidence.failedOrUnknownAttemptCostRetained,
      cancellationReceiptDigest: lifecycleEvidence.cancellationReceiptDigest,
      canonicalCheckbackPermitIncluded: false as const,
      fallbackAllowed: false as const,
      rerunAllowed: false as const,
      rawCredentialIncluded: false as const,
      providerUrlIncluded: false as const,
      customerCommercialAuthorityIncluded: false as const,
    },
    blockers: cancelled
      ? [
          'provider_attempt_cancelled' as const,
          'canonical_cancellation_receipt_schema_gap' as const,
        ]
      : ['provider_attempt_never_submitted' as const],
    boundaries: {
      serverOnly: true as const,
      cancellationPromotionBlockedByReceiptSchemaGap: cancelled,
      canonicalBackendVerifiedRuntime: false as const,
      promotionAuthorized: false as const,
      productionReady: false as const,
    },
    projectedAt,
  }
  return deepFreeze(canonicalProviderAttemptNonExecutionRecordSchema.parse({
    ...payload,
    recordDigest: sha256AuthorityValue(payload),
  }))
}

function resolvePort(
  hosted: boolean,
  port: CanonicalProviderAttemptRuntimeRecordSourcePort | undefined,
): CanonicalProviderAttemptRuntimeRecordSourcePort {
  if (!port) throw notReady(
    'Canonical provider-attempt runtime lookup has no server-owned source port.',
    'canonical_provider_attempt_runtime_record_port_missing',
  )
  assertPortShape(port)
  if (controlledPorts.has(port)) {
    if (hosted) throw notReady(
      'Controlled provider-attempt record fixtures cannot run in hosted mode.',
      'canonical_provider_attempt_runtime_record_port_unqualified',
    )
    return port
  }
  if (
    !qualifiedReleasePorts.has(port) ||
    port.sourceAuthority !==
      'canonical_provider_attempt_release_evidence_repository' ||
    port.evidenceClass !== 'canonical_same_release_live_runtime' ||
    !port.productionAuthority
  ) throw notReady(
    'Canonical provider-attempt runtime source is not same-release qualified.',
    'canonical_provider_attempt_runtime_record_port_unqualified',
  )
  return port
}

function assertPortShape(port: CanonicalProviderAttemptRuntimeRecordSourcePort): void {
  if (
    port.contractVersion !== CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_PORT_VERSION ||
    typeof port.readExactAttempt !== 'function' ||
    typeof port.readCurrentReleaseIdentity !== 'function' ||
    typeof port.productionAuthority !== 'boolean'
  ) throw invalid('Provider-attempt runtime source port is malformed.')
}

function assertLocator(
  input: CanonicalProviderAttemptRuntimeLocator,
): CanonicalProviderAttemptRuntimeLocator {
  const parsed = canonicalProviderAttemptRuntimeLocatorSchema.safeParse(input)
  if (!parsed.success) {
    throw invalid('Provider-attempt runtime locator failed schema verification.')
  }
  const locator = parsed.data
  const { locatorDigest, ...payload } = locator
  if (locatorDigest !== sha256AuthorityValue(payload)) {
    throw invalid('Provider-attempt runtime locator failed digest verification.')
  }
  return locator
}

function assertSourceReceipt(
  input: CanonicalProviderAttemptConsumerReceipt,
): CanonicalProviderAttemptConsumerReceipt {
  const parsed = canonicalProviderAttemptConsumerReceiptSchema.safeParse(input)
  if (!parsed.success) {
    throw invalid('Provider-attempt source receipt failed schema verification.')
  }
  const receipt = parsed.data
  const { receiptHash, ...payload } = receipt
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw invalid('Provider-attempt source receipt failed digest verification.')
  }
  const outputSetDigest = sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-private-output-set:v1',
    dispatchAttemptHash: receipt.dispatch.dispatchAttemptHash,
    terminalHash: receipt.dispatch.terminalHash,
    outputs: receipt.privateOutputs,
  })
  if (outputSetDigest !== receipt.outputSet.outputSetDigest) {
    throw invalid('Provider-attempt source output set failed digest verification.')
  }
  const policy = resolveCanonicalProviderLifecyclePolicy(
    receipt.provider.operationId,
  )
  if (
    receipt.provider.intent !== policy.intent ||
    receipt.provider.providerBoundaryProfileId !==
      policy.providerBoundaryProfileId ||
    receipt.provider.providerRouteId !== policy.providerRouteId ||
    receipt.provider.providerModelId !== policy.providerModelId ||
    receipt.provider.lifecyclePolicyVersion !== policy.schemaVersion ||
    receipt.provider.lifecyclePolicyHash !== policy.policyHash ||
    JSON.stringify(receipt.requestAccounting.ceilings) !==
      JSON.stringify(policy.requestCeilings)
  ) throw invalid(
    'Provider-attempt source receipt does not match the canonical lifecycle policy.',
  )
  return receipt
}

function assertLocatorMatchesReceipt(
  locator: CanonicalProviderAttemptRuntimeLocator,
  receipt: CanonicalProviderAttemptConsumerReceipt,
): void {
  if (
    locator.ownerUserId !== receipt.identity.ownerUserId ||
    locator.workspaceId !== receipt.identity.workspaceId ||
    locator.projectId !== receipt.identity.projectId ||
    locator.editSessionId !== receipt.identity.editSessionId ||
    locator.approvedPlanSnapshotId !== receipt.identity.approvedPlanSnapshotId ||
    locator.approvedPlanSnapshotHash !==
      receipt.identity.approvedPlanSnapshotHash ||
    locator.packageRecordId !== receipt.identity.packageRecordId ||
    locator.packageHash !== receipt.identity.packageHash ||
    locator.workGraphHash !== receipt.identity.workGraphHash ||
    locator.approvedWorkItemId !== receipt.identity.approvedWorkItemId ||
    locator.approvedWorkItemHash !== receipt.identity.approvedWorkItemHash ||
    locator.queueDefinitionHash !== receipt.identity.queueDefinitionHash ||
    locator.queueJobId !== receipt.identity.queueJobId ||
    locator.queueJobDefinitionHash !==
      receipt.identity.queueJobDefinitionHash ||
    locator.authorizationHash !== receipt.identity.authorizationHash ||
    locator.dispatchAttemptId !== receipt.dispatch.dispatchAttemptId ||
    locator.operationId !== receipt.provider.operationId ||
    locator.sourceRequestId !== receipt.identity.sourceRequestId ||
    locator.expectedOutputSetDigest !== receipt.outputSet.outputSetDigest
  ) throw new ApiError(
    'WORKSPACE_ACCESS_DENIED',
    'Provider-attempt runtime locator does not match exact source authority.',
    403,
  )
}

function assertReleaseEvidence(
  input: CanonicalProviderAttemptReleaseEvidence,
): CanonicalProviderAttemptReleaseEvidence {
  const parsed = canonicalProviderAttemptReleaseEvidenceSchema.safeParse(input)
  if (!parsed.success) {
    throw invalid('Provider-attempt release evidence failed schema verification.')
  }
  const evidence = parsed.data
  const { evidenceDigest, ...payload } = evidence
  if (evidenceDigest !== sha256AuthorityValue(payload)) {
    throw invalid('Provider-attempt release evidence failed digest verification.')
  }
  return evidence
}

async function readAndVerifyCurrentReleaseIdentity(
  port: CanonicalProviderAttemptRuntimeRecordSourcePort,
): Promise<CanonicalProviderAttemptCurrentReleaseIdentity | null> {
  const input = await port.readCurrentReleaseIdentity()
  if (!input) return null
  const parsed = canonicalProviderAttemptCurrentReleaseIdentitySchema.safeParse(input)
  if (!parsed.success) {
    throw invalid('Current release identity failed schema verification.')
  }
  const identityRecord = parsed.data
  const { identityDigest, ...payload } = identityRecord
  if (identityDigest !== sha256AuthorityValue(payload)) {
    throw invalid('Current release identity failed digest verification.')
  }
  return identityRecord
}

function assertNonExecutionEvidence(
  input: CanonicalProviderAttemptNonExecutionEvidence,
  locator: CanonicalProviderAttemptRuntimeLocator,
): CanonicalProviderAttemptNonExecutionEvidence {
  const parsed = canonicalProviderAttemptNonExecutionEvidenceSchema.safeParse(input)
  if (!parsed.success) {
    throw invalid('Provider non-execution evidence failed schema verification.')
  }
  const evidence = parsed.data
  const { evidenceDigest, ...payload } = evidence
  if (evidenceDigest !== sha256AuthorityValue(payload)) {
    throw invalid('Provider non-execution evidence failed digest verification.')
  }
  const policy = resolveCanonicalProviderLifecyclePolicy(locator.operationId)
  if (
    evidence.locatorDigest !== locator.locatorDigest ||
    evidence.providerRouteId !== policy.providerRouteId ||
    evidence.providerModelId !== policy.providerModelId ||
    (evidence.dispatchAttemptId !== null &&
      evidence.dispatchAttemptId !== locator.dispatchAttemptId)
  ) throw invalid(
    'Provider non-execution evidence does not match exact lifecycle authority.',
  )
  return evidence
}

function projectAttemptOutcome(
  terminalState: CanonicalProviderAttemptConsumerReceipt['dispatch']['terminalState'],
): Exclude<
  z.infer<typeof attemptOutcomeSchema>,
  'never_submitted' | 'cancelled'
> {
  if (terminalState === 'succeeded') return 'completed'
  if (terminalState === 'unknown_reconciled_succeeded') {
    return 'unknown_reconciled_completed'
  }
  return terminalState
}

function canonicalTimestamp(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw invalid('Provider-attempt runtime projection timestamp is invalid.')
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

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'canonical_provider_attempt_runtime_record_integrity',
  })
}

function notReady(message: string, requiredGate: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, { requiredGate })
}
