import { z } from 'zod'

import {
  CANONICAL_ELEVENLABS_SECRET_REFERENCE_ENV_KEY,
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_BOUNDARY_PROFILE_ID,
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_MODEL_ID,
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_ROUTE_ID,
  CANONICAL_FAL_SECRET_REFERENCE_ENV_KEY,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_BOUNDARY_PROFILE_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID,
  CANONICAL_GOOGLE_GEMINI_SECRET_REFERENCE_ENV_KEY,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_BOUNDARY_PROFILE_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_MODEL_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_ROUTE_ID,
  CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
  CANONICAL_LYRIA_MODEL_ID,
  CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID,
  CANONICAL_LYRIA_SECRET_REFERENCE_ENV_KEY,
  CANONICAL_PROVIDER_WORK_AUTHORIZATION_VERSION,
  CANONICAL_PROVIDER_WORK_AUTHORIZATION_V2_VERSION,
  CANONICAL_PROVIDER_WORK_AUTHORIZATION_V3_VERSION,
  CANONICAL_PROVIDER_WORK_AUTHORIZATION_V4_VERSION,
} from '../edit-architecture/canonical-provider-work-authority'

export const CANONICAL_PRIVATE_PROVIDER_DISPATCH_AGGREGATE_VERSION =
  'canonical-private-provider-dispatch-aggregate-v1' as const
export const CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_VERSION =
  'canonical-private-provider-dispatch-grant-v1' as const
export const CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_VERSION =
  'canonical-private-provider-dispatch-terminal-v1' as const
export const CANONICAL_PRIVATE_PROVIDER_DISPATCH_EVENT_VERSION =
  'canonical-private-provider-dispatch-event-v1' as const
export const CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_V2_VERSION =
  'canonical-private-provider-dispatch-grant-v2' as const
export const CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_V2_VERSION =
  'canonical-private-provider-dispatch-terminal-v2' as const
export const CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_V3_VERSION =
  'canonical-private-provider-dispatch-grant-v3' as const
export const CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_V3_VERSION =
  'canonical-private-provider-dispatch-terminal-v3' as const
export const CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_V4_VERSION =
  'canonical-private-provider-dispatch-grant-v4' as const
export const CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_V4_VERSION =
  'canonical-private-provider-dispatch-terminal-v4' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeMicros = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

export const canonicalPrivateProviderOutputSchema = z.object({
  outputId: identity,
  role: z.literal('generated_instrumental_score_candidate'),
  assetId: identity,
  assetVersionId: identity,
  privateObjectIdentityHash: sha256,
  contentSha256: sha256,
  byteLength: z.number().int().positive().max(128 * 1024 * 1024),
  mimeType: z.literal('audio/wav'),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
  artifactEvidenceDigest: sha256,
}).strict()

export const canonicalPrivateProviderOutputV2Schema = z.object({
  outputId: identity,
  role: z.enum([
    'provider_storytelling_speech_audio_mp3',
    'provider_storytelling_speech_alignment_json',
  ]),
  assetId: identity,
  assetVersionId: identity,
  privateObjectIdentityHash: sha256,
  contentSha256: sha256,
  byteLength: z.number().int().positive().max(16_777_216),
  mimeType: z.enum(['audio/mpeg', 'application/json']),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
  browserReadable: z.literal(false),
  artifactEvidenceDigest: sha256,
}).strict().superRefine((value, context) => {
  const audio = value.role === 'provider_storytelling_speech_audio_mp3'
  if (
    (audio && (value.mimeType !== 'audio/mpeg' || value.byteLength > 16_777_216)) ||
    (!audio && (value.mimeType !== 'application/json' || value.byteLength > 1_048_576))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Provider Speech private output role, MIME, and size disagree.',
    })
  }
})

export const canonicalPrivateProviderOutputV3Schema = z.object({
  outputId: identity,
  role: z.literal('provider_synchronized_audio_mp4'),
  assetId: identity,
  assetVersionId: identity,
  privateObjectIdentityHash: sha256,
  contentSha256: sha256,
  byteLength: z.number().int().positive().max(67_108_864),
  mimeType: z.literal('video/mp4'),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
  browserReadable: z.literal(false),
  artifactEvidenceDigest: sha256,
}).strict()

export const canonicalPrivateProviderOutputV4Schema = z.object({
  outputId: identity,
  role: z.literal('provider_visual_calibration_video_mp4'),
  assetId: identity,
  assetVersionId: identity,
  privateObjectIdentityHash: sha256,
  contentSha256: sha256,
  byteLength: z.number().int().positive().max(67_108_864),
  mimeType: z.literal('video/mp4'),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
  browserReadable: z.literal(false),
  artifactEvidenceDigest: sha256,
}).strict()

export const canonicalPrivateProviderDispatchGrantSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_VERSION),
  grantId: identity,
  authorizationVersion: z.literal(CANONICAL_PROVIDER_WORK_AUTHORIZATION_VERSION),
  authorizationHash: sha256,
  authorizationRequestHash: sha256,
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  packageRecordId: identity,
  packageHash: sha256,
  queueDefinitionHash: sha256,
  queueJobId: identity,
  queueJobDefinitionHash: sha256,
  approvedWorkItemId: identity,
  expectedOutputId: identity,
  queueClaimId: identity,
  queueClaimHash: sha256,
  queueClaimDeliveryAttempt: z.number().int().positive().max(10),
  queueClaimExpiresAt: timestamp,
  operationId: z.literal(CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID),
  providerBoundaryProfileId: z.literal(
    CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID,
  ),
  providerRouteId: z.literal(CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID),
  providerModelId: z.literal(CANONICAL_LYRIA_MODEL_ID),
  sourceRequestId: identity,
  sourceRequestDigest: sha256,
  providerRequestPayloadDigest: sha256,
  projectDataPolicyDigest: sha256,
  providerAccountPolicyDigest: sha256,
  idempotencyKeyHash: sha256,
  credentialSha256: sha256,
  secretLocator: z.object({
    configurationKey: z.literal(CANONICAL_LYRIA_SECRET_REFERENCE_ENV_KEY),
    referenceName: identity.nullable(),
    referencePresent: z.boolean(),
    payloadReadCount: z.literal(0),
    payloadPersisted: z.literal(false),
    payloadLogged: z.literal(false),
  }).strict(),
  executionClass: z.enum([
    'private_injected_nonprovider_test',
    'canonical_backend_runtime_unreleased',
  ]),
  providerCallAuthorized: z.boolean(),
  maximumProviderRequests: z.literal(1),
  maximumRetries: z.literal(0),
  maximumFallbacks: z.literal(0),
  maximumAuthorizedProviderCostMicros: z.literal(80_000),
  maximumAuthorizedInfrastructureCostMicros: z.literal(20_000),
  maximumAuthorizedTotalInternalCostMicros: z.literal(100_000),
  issuedAt: timestamp,
  expiresAt: timestamp,
  immutableGrantHash: sha256,
}).strict().superRefine((value, context) => {
  if (
    value.secretLocator.referencePresent !==
      (value.secretLocator.referenceName !== null) ||
    (value.executionClass === 'private_injected_nonprovider_test' &&
      value.providerCallAuthorized) ||
    Date.parse(value.expiresAt) <= Date.parse(value.issuedAt) ||
    Date.parse(value.expiresAt) > Date.parse(value.queueClaimExpiresAt)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical provider dispatch grant policy is inconsistent.',
    })
  }
})

export const canonicalPrivateProviderDispatchGrantV2Schema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_V2_VERSION),
  grantId: identity,
  authorizationVersion: z.literal(
    CANONICAL_PROVIDER_WORK_AUTHORIZATION_V2_VERSION,
  ),
  authorizationHash: sha256,
  authorizationRequestHash: sha256,
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  packageRecordId: identity,
  packageHash: sha256,
  queueDefinitionHash: sha256,
  queueJobId: identity,
  queueJobDefinitionHash: sha256,
  approvedWorkItemId: identity,
  expectedOutputId: identity,
  expectedOutputIds: z.tuple([identity, identity]),
  expectedOutputSetHash: sha256,
  queueClaimId: identity,
  queueClaimHash: sha256,
  queueClaimDeliveryAttempt: z.number().int().positive().max(10),
  queueClaimExpiresAt: timestamp,
  operationId: z.literal(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  ),
  providerBoundaryProfileId: z.literal(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_BOUNDARY_PROFILE_ID,
  ),
  providerRouteId: z.literal(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_ROUTE_ID,
  ),
  providerModelId: z.literal(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_MODEL_ID,
  ),
  sourceRequestId: identity,
  sourceRequestDigest: sha256,
  providerRequestPayloadDigest: sha256,
  projectDataPolicyDigest: sha256,
  providerAccountPolicyDigest: sha256,
  idempotencyKeyHash: sha256,
  credentialSha256: sha256,
  secretLocator: z.object({
    configurationKey: z.literal(CANONICAL_ELEVENLABS_SECRET_REFERENCE_ENV_KEY),
    referenceName: identity.nullable(),
    referencePresent: z.boolean(),
    payloadReadCount: z.literal(0),
    payloadPersisted: z.literal(false),
    payloadLogged: z.literal(false),
  }).strict(),
  executionClass: z.literal('private_injected_nonprovider_test'),
  providerCallAuthorized: z.literal(false),
  maximumProviderRequests: z.literal(1),
  maximumRetries: z.literal(0),
  maximumFallbacks: z.literal(0),
  maximumAuthorizedProviderCostMicros: safeMicros,
  maximumAuthorizedInfrastructureCostMicros: safeMicros,
  maximumAuthorizedTotalInternalCostMicros: safeMicros,
  providerRateCardSnapshotId: identity,
  providerRateCardSnapshotDigest: sha256,
  providerRateEvidenceClass: z.literal('private_local_fixture'),
  issuedAt: timestamp,
  expiresAt: timestamp,
  immutableGrantHash: sha256,
}).strict().superRefine((value, context) => {
  if (
    value.expectedOutputId !== value.expectedOutputIds[0] ||
    value.secretLocator.referencePresent !==
      (value.secretLocator.referenceName !== null) ||
    value.maximumAuthorizedTotalInternalCostMicros !==
      value.maximumAuthorizedProviderCostMicros +
        value.maximumAuthorizedInfrastructureCostMicros ||
    Date.parse(value.expiresAt) <= Date.parse(value.issuedAt) ||
    Date.parse(value.expiresAt) > Date.parse(value.queueClaimExpiresAt)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical provider dispatch V2 grant policy is inconsistent.',
    })
  }
})

export const canonicalPrivateProviderDispatchGrantV3Schema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_V3_VERSION),
  grantId: identity,
  authorizationVersion: z.literal(
    CANONICAL_PROVIDER_WORK_AUTHORIZATION_V3_VERSION,
  ),
  authorizationHash: sha256,
  authorizationRequestHash: sha256,
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  packageRecordId: identity,
  packageHash: sha256,
  queueDefinitionHash: sha256,
  queueJobId: identity,
  queueJobDefinitionHash: sha256,
  approvedWorkItemId: identity,
  expectedOutputId: identity,
  expectedOutputIds: z.tuple([identity]),
  expectedOutputSetHash: sha256,
  queueClaimId: identity,
  queueClaimHash: sha256,
  queueClaimDeliveryAttempt: z.number().int().positive().max(10),
  queueClaimExpiresAt: timestamp,
  operationId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID),
  providerBoundaryProfileId: z.literal(
    CANONICAL_FAL_SYNCHRONIZED_FOLEY_BOUNDARY_PROFILE_ID,
  ),
  providerRouteId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID),
  providerModelId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID),
  sourceRequestId: identity,
  sourceRequestDigest: sha256,
  providerRequestPayloadDigest: sha256,
  projectDataPolicyDigest: sha256,
  providerAccountPolicyDigest: sha256,
  idempotencyKeyHash: sha256,
  credentialSha256: sha256,
  secretLocator: z.object({
    configurationKey: z.literal(CANONICAL_FAL_SECRET_REFERENCE_ENV_KEY),
    referenceName: z.null(),
    referencePresent: z.literal(false),
    payloadReadCount: z.literal(0),
    payloadPersisted: z.literal(false),
    payloadLogged: z.literal(false),
  }).strict(),
  executionClass: z.literal('private_injected_nonprovider_test'),
  providerCallAuthorized: z.literal(false),
  maximumProviderRequests: z.literal(1),
  maximumLifecycleHttpRequests: z.literal(17),
  maximumRetries: z.literal(0),
  maximumFallbacks: z.literal(0),
  maximumAuthorizedProviderCostMicros: safeMicros,
  maximumAuthorizedInfrastructureCostMicros: safeMicros,
  maximumAuthorizedTotalInternalCostMicros: safeMicros,
  providerRateCardSnapshotId: identity,
  providerRateCardSnapshotDigest: sha256,
  providerRateEvidenceClass: z.literal('private_local_fixture'),
  issuedAt: timestamp,
  expiresAt: timestamp,
  immutableGrantHash: sha256,
}).strict().superRefine((value, context) => {
  if (
    value.expectedOutputId !== value.expectedOutputIds[0] ||
    value.maximumAuthorizedTotalInternalCostMicros !==
      value.maximumAuthorizedProviderCostMicros +
        value.maximumAuthorizedInfrastructureCostMicros ||
    Date.parse(value.expiresAt) <= Date.parse(value.issuedAt) ||
    Date.parse(value.expiresAt) > Date.parse(value.queueClaimExpiresAt)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical provider dispatch V3 grant policy is inconsistent.',
    })
  }
})

export const canonicalPrivateProviderDispatchGrantV4Schema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_V4_VERSION),
  grantId: identity,
  authorizationVersion: z.literal(
    CANONICAL_PROVIDER_WORK_AUTHORIZATION_V4_VERSION,
  ),
  authorizationHash: sha256,
  authorizationRequestHash: sha256,
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  packageRecordId: identity,
  packageHash: sha256,
  queueDefinitionHash: sha256,
  queueJobId: identity,
  queueJobDefinitionHash: sha256,
  approvedWorkItemId: identity,
  expectedOutputId: identity,
  expectedOutputIds: z.tuple([identity]),
  expectedOutputSetHash: sha256,
  queueClaimId: identity,
  queueClaimHash: sha256,
  queueClaimDeliveryAttempt: z.number().int().positive().max(10),
  queueClaimExpiresAt: timestamp,
  operationId: z.literal(CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID),
  providerBoundaryProfileId: z.literal(
    CANONICAL_GOOGLE_VISUAL_CALIBRATION_BOUNDARY_PROFILE_ID,
  ),
  providerRouteId: z.literal(CANONICAL_GOOGLE_VISUAL_CALIBRATION_ROUTE_ID),
  providerModelId: z.literal(CANONICAL_GOOGLE_VISUAL_CALIBRATION_MODEL_ID),
  visualCalibrationContextDigest: sha256,
  sourceRequestId: identity,
  sourceRequestDigest: sha256,
  providerRequestPayloadDigest: sha256,
  projectDataPolicyDigest: sha256,
  providerAccountPolicyDigest: sha256,
  idempotencyKeyHash: sha256,
  credentialSha256: sha256,
  secretLocator: z.object({
    configurationKey: z.literal(
      CANONICAL_GOOGLE_GEMINI_SECRET_REFERENCE_ENV_KEY,
    ),
    referenceName: z.null(),
    referencePresent: z.literal(false),
    payloadReadCount: z.literal(0),
    payloadPersisted: z.literal(false),
    payloadLogged: z.literal(false),
  }).strict(),
  executionClass: z.literal('private_injected_nonprovider_test'),
  providerCallAuthorized: z.literal(false),
  maximumProviderRequests: z.literal(1),
  maximumLifecycleHttpRequests: z.literal(15),
  maximumRetries: z.literal(0),
  maximumFallbacks: z.literal(0),
  maximumAuthorizedProviderCostMicros: safeMicros,
  maximumAuthorizedInfrastructureCostMicros: safeMicros,
  maximumAuthorizedTotalInternalCostMicros: safeMicros,
  providerRateCardSnapshotId: identity,
  providerRateCardSnapshotDigest: sha256,
  providerRateEvidenceClass: z.literal(
    'official_public_pricing_snapshot_unreleased',
  ),
  issuedAt: timestamp,
  expiresAt: timestamp,
  immutableGrantHash: sha256,
}).strict().superRefine((value, context) => {
  if (
    value.expectedOutputId !== value.expectedOutputIds[0] ||
    value.maximumAuthorizedTotalInternalCostMicros !==
      value.maximumAuthorizedProviderCostMicros +
        value.maximumAuthorizedInfrastructureCostMicros ||
    Date.parse(value.expiresAt) <= Date.parse(value.issuedAt) ||
    Date.parse(value.expiresAt) > Date.parse(value.queueClaimExpiresAt)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical provider dispatch V4 grant policy is inconsistent.',
    })
  }
})

export const canonicalPrivateProviderDispatchGrantAnySchema = z.union([
  canonicalPrivateProviderDispatchGrantSchema,
  canonicalPrivateProviderDispatchGrantV2Schema,
  canonicalPrivateProviderDispatchGrantV3Schema,
  canonicalPrivateProviderDispatchGrantV4Schema,
])

export const canonicalPrivateProviderDispatchAttemptSchema = z.object({
  dispatchAttemptId: identity,
  grantId: identity,
  authorizationHash: sha256,
  queueClaimId: identity,
  queueClaimHash: sha256,
  queueClaimDeliveryAttempt: z.number().int().positive().max(10),
  workerIdentityHash: sha256,
  consumedAt: timestamp,
  consumptionCount: z.literal(1),
  providerRequestStarted: z.boolean(),
  plaintextDispatchCredentialPersisted: z.literal(false),
  attemptHash: sha256,
}).strict()

export const canonicalPrivateProviderDispatchTerminalSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_VERSION),
  sequence: z.union([z.literal(1), z.literal(2)]),
  terminalId: identity,
  dispatchAttemptId: identity,
  state: z.enum([
    'succeeded',
    'failed',
    'unknown_reconciliation_required',
    'unknown_reconciled_succeeded',
    'unknown_reconciled_failed',
  ]),
  providerRequestCount: z.union([z.literal(0), z.literal(1)]),
  retryCount: z.literal(0),
  fallbackCount: z.literal(0),
  dispatchConsumptionCount: z.literal(1),
  unknownOutcomeReconciled: z.boolean(),
  providerResponseUsageDigest: sha256.nullable(),
  sanitizedFailureCode: identity.nullable(),
  privateOutput: canonicalPrivateProviderOutputSchema.nullable(),
  costEvidenceHash: sha256,
  providerCostMicros: safeMicros.nullable(),
  infrastructureCostMicros: safeMicros,
  totalInternalProductionCostMicros: safeMicros.nullable(),
  priorTerminalHash: sha256.nullable(),
  completedAt: timestamp,
  terminalHash: sha256,
}).strict().superRefine((value, context) => {
  const succeeded = value.state === 'succeeded' ||
    value.state === 'unknown_reconciled_succeeded'
  const unknown = value.state === 'unknown_reconciliation_required'
  const reconciled = value.state.startsWith('unknown_reconciled_')
  if (
    (succeeded !== (value.privateOutput !== null)) ||
    (succeeded && value.sanitizedFailureCode !== null) ||
    (!succeeded && value.sanitizedFailureCode === null) ||
    unknown !== !value.unknownOutcomeReconciled ||
    reconciled !== (value.sequence === 2 && value.priorTerminalHash !== null) ||
    (!reconciled && (value.sequence !== 1 || value.priorTerminalHash !== null)) ||
    ((unknown || reconciled) && value.providerRequestCount !== 1) ||
    (reconciled && value.providerResponseUsageDigest === null) ||
    (unknown && (
      value.providerCostMicros !== null ||
      value.totalInternalProductionCostMicros !== null
    )) ||
    (!unknown && (
      value.providerCostMicros === null ||
      value.totalInternalProductionCostMicros !==
        value.providerCostMicros + value.infrastructureCostMicros
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical provider dispatch terminal state is inconsistent.',
    })
  }
})

export const canonicalPrivateProviderDispatchTerminalV2Schema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_V2_VERSION,
  ),
  sequence: z.union([z.literal(1), z.literal(2)]),
  terminalId: identity,
  dispatchAttemptId: identity,
  state: z.enum([
    'succeeded',
    'failed',
    'unknown_reconciliation_required',
    'unknown_reconciled_succeeded',
    'unknown_reconciled_failed',
  ]),
  providerRequestCount: z.union([z.literal(0), z.literal(1)]),
  retryCount: z.literal(0),
  fallbackCount: z.literal(0),
  dispatchConsumptionCount: z.literal(1),
  unknownOutcomeReconciled: z.boolean(),
  providerResponseUsageDigest: sha256.nullable(),
  sanitizedFailureCode: identity.nullable(),
  privateOutput: canonicalPrivateProviderOutputV2Schema.nullable(),
  privateOutputs: z.array(canonicalPrivateProviderOutputV2Schema).max(2),
  outputSetDigest: sha256,
  costEvidenceHash: sha256,
  providerCostMicros: safeMicros.nullable(),
  infrastructureCostMicros: safeMicros,
  totalInternalProductionCostMicros: safeMicros.nullable(),
  priorTerminalHash: sha256.nullable(),
  completedAt: timestamp,
  terminalHash: sha256,
}).strict().superRefine((value, context) => {
  const succeeded = value.state === 'succeeded' ||
    value.state === 'unknown_reconciled_succeeded'
  const unknown = value.state === 'unknown_reconciliation_required'
  const reconciled = value.state.startsWith('unknown_reconciled_')
  const outputRoles = value.privateOutputs.map((output) => output.role)
  if (
    (succeeded !== (value.privateOutput !== null)) ||
    (succeeded !== (value.privateOutputs.length === 2)) ||
    (succeeded && (
      value.privateOutput?.outputId !== value.privateOutputs[0]?.outputId ||
      outputRoles[0] !== 'provider_storytelling_speech_audio_mp3' ||
      outputRoles[1] !== 'provider_storytelling_speech_alignment_json'
    )) ||
    (!succeeded && value.privateOutputs.length !== 0) ||
    (succeeded && value.sanitizedFailureCode !== null) ||
    (!succeeded && value.sanitizedFailureCode === null) ||
    unknown !== !value.unknownOutcomeReconciled ||
    reconciled !== (value.sequence === 2 && value.priorTerminalHash !== null) ||
    (!reconciled && (value.sequence !== 1 || value.priorTerminalHash !== null)) ||
    ((unknown || reconciled) && value.providerRequestCount !== 1) ||
    (reconciled && value.providerResponseUsageDigest === null) ||
    (unknown && (
      value.providerCostMicros !== null ||
      value.totalInternalProductionCostMicros !== null
    )) ||
    (!unknown && (
      value.providerCostMicros === null ||
      value.totalInternalProductionCostMicros !==
        value.providerCostMicros + value.infrastructureCostMicros
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical provider dispatch V2 terminal state is inconsistent.',
    })
  }
})

export const canonicalPrivateProviderDispatchTerminalV3Schema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_V3_VERSION,
  ),
  sequence: z.union([z.literal(1), z.literal(2)]),
  terminalId: identity,
  dispatchAttemptId: identity,
  state: z.enum([
    'succeeded',
    'failed',
    'unknown_reconciliation_required',
    'unknown_reconciled_succeeded',
    'unknown_reconciled_failed',
  ]),
  providerRequestCount: z.union([z.literal(0), z.literal(1)]),
  retryCount: z.literal(0),
  fallbackCount: z.literal(0),
  dispatchConsumptionCount: z.literal(1),
  unknownOutcomeReconciled: z.boolean(),
  providerResponseUsageDigest: sha256.nullable(),
  sanitizedFailureCode: identity.nullable(),
  privateOutput: canonicalPrivateProviderOutputV3Schema.nullable(),
  privateOutputs: z.array(canonicalPrivateProviderOutputV3Schema).max(1),
  outputSetDigest: sha256,
  costEvidenceHash: sha256,
  providerCostMicros: safeMicros.nullable(),
  infrastructureCostMicros: safeMicros,
  totalInternalProductionCostMicros: safeMicros.nullable(),
  priorTerminalHash: sha256.nullable(),
  completedAt: timestamp,
  terminalHash: sha256,
}).strict().superRefine((value, context) => {
  const succeeded = value.state === 'succeeded' ||
    value.state === 'unknown_reconciled_succeeded'
  const unknown = value.state === 'unknown_reconciliation_required'
  const reconciled = value.state.startsWith('unknown_reconciled_')
  if (
    (succeeded !== (value.privateOutput !== null)) ||
    (succeeded !== (value.privateOutputs.length === 1)) ||
    (succeeded && (
      value.privateOutput?.outputId !== value.privateOutputs[0]?.outputId ||
      value.privateOutputs[0]?.role !== 'provider_synchronized_audio_mp4' ||
      value.privateOutputs[0]?.mimeType !== 'video/mp4'
    )) ||
    (!succeeded && value.privateOutputs.length !== 0) ||
    (succeeded && value.sanitizedFailureCode !== null) ||
    (!succeeded && value.sanitizedFailureCode === null) ||
    unknown !== !value.unknownOutcomeReconciled ||
    reconciled !== (value.sequence === 2 && value.priorTerminalHash !== null) ||
    (!reconciled && (value.sequence !== 1 || value.priorTerminalHash !== null)) ||
    ((unknown || reconciled) && value.providerRequestCount !== 1) ||
    (reconciled && value.providerResponseUsageDigest === null) ||
    (unknown && (
      value.providerCostMicros !== null ||
      value.totalInternalProductionCostMicros !== null
    )) ||
    (!unknown && (
      value.providerCostMicros === null ||
      value.totalInternalProductionCostMicros !==
        value.providerCostMicros + value.infrastructureCostMicros
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical provider dispatch V3 terminal state is inconsistent.',
    })
  }
})

export const canonicalPrivateProviderDispatchTerminalV4Schema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_V4_VERSION,
  ),
  sequence: z.union([z.literal(1), z.literal(2)]),
  terminalId: identity,
  dispatchAttemptId: identity,
  state: z.enum([
    'succeeded',
    'failed',
    'unknown_reconciliation_required',
    'unknown_reconciled_succeeded',
    'unknown_reconciled_failed',
  ]),
  providerRequestCount: z.union([z.literal(0), z.literal(1)]),
  retryCount: z.literal(0),
  fallbackCount: z.literal(0),
  dispatchConsumptionCount: z.literal(1),
  unknownOutcomeReconciled: z.boolean(),
  providerResponseUsageDigest: sha256.nullable(),
  sanitizedFailureCode: identity.nullable(),
  privateOutput: canonicalPrivateProviderOutputV4Schema.nullable(),
  privateOutputs: z.array(canonicalPrivateProviderOutputV4Schema).max(1),
  outputSetDigest: sha256,
  costEvidenceHash: sha256,
  providerCostMicros: safeMicros.nullable(),
  infrastructureCostMicros: safeMicros,
  totalInternalProductionCostMicros: safeMicros.nullable(),
  priorTerminalHash: sha256.nullable(),
  completedAt: timestamp,
  terminalHash: sha256,
}).strict().superRefine((value, context) => {
  const succeeded = value.state === 'succeeded' ||
    value.state === 'unknown_reconciled_succeeded'
  const unknown = value.state === 'unknown_reconciliation_required'
  const reconciled = value.state.startsWith('unknown_reconciled_')
  if (
    (succeeded !== (value.privateOutput !== null)) ||
    (succeeded !== (value.privateOutputs.length === 1)) ||
    (succeeded && (
      value.privateOutput?.outputId !== value.privateOutputs[0]?.outputId ||
      value.privateOutputs[0]?.role !==
        'provider_visual_calibration_video_mp4' ||
      value.privateOutputs[0]?.mimeType !== 'video/mp4'
    )) ||
    (!succeeded && value.privateOutputs.length !== 0) ||
    (succeeded && value.sanitizedFailureCode !== null) ||
    (!succeeded && value.sanitizedFailureCode === null) ||
    unknown !== !value.unknownOutcomeReconciled ||
    reconciled !== (value.sequence === 2 && value.priorTerminalHash !== null) ||
    (!reconciled && (value.sequence !== 1 || value.priorTerminalHash !== null)) ||
    ((unknown || reconciled) && value.providerRequestCount !== 1) ||
    (reconciled && value.providerResponseUsageDigest === null) ||
    (unknown && (
      value.providerCostMicros !== null ||
      value.totalInternalProductionCostMicros !== null
    )) ||
    (!unknown && (
      value.providerCostMicros === null ||
      value.totalInternalProductionCostMicros !==
        value.providerCostMicros + value.infrastructureCostMicros
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical provider dispatch V4 terminal state is inconsistent.',
    })
  }
})

export const canonicalPrivateProviderDispatchTerminalAnySchema = z.union([
  canonicalPrivateProviderDispatchTerminalSchema,
  canonicalPrivateProviderDispatchTerminalV2Schema,
  canonicalPrivateProviderDispatchTerminalV3Schema,
  canonicalPrivateProviderDispatchTerminalV4Schema,
])

export const canonicalPrivateProviderDispatchEventSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PROVIDER_DISPATCH_EVENT_VERSION),
  sequence: z.number().int().positive().max(100),
  eventType: z.enum([
    'grant_issued',
    'dispatch_consumed',
    'attempt_terminal',
    'unknown_outcome_reconciled',
  ]),
  grantId: identity,
  dispatchAttemptId: identity.optional(),
  terminalId: identity.optional(),
  at: timestamp,
  previousEventHash: sha256.nullable(),
  eventHash: sha256,
}).strict()

export const canonicalPrivateProviderDispatchEntrySchema = z.object({
  grant: canonicalPrivateProviderDispatchGrantAnySchema,
  state: z.enum([
    'issued',
    'consumed',
    'succeeded',
    'failed',
    'unknown_reconciliation_required',
    'unknown_reconciled_succeeded',
    'unknown_reconciled_failed',
  ]),
  attempt: canonicalPrivateProviderDispatchAttemptSchema.optional(),
  terminalHistory: z.array(canonicalPrivateProviderDispatchTerminalAnySchema).max(2),
  updatedAt: timestamp,
  entryHash: sha256,
}).strict().superRefine((value, context) => {
  const hasAttempt = value.attempt !== undefined
  const latestTerminal = value.terminalHistory.at(-1)
  const firstTerminal = value.terminalHistory[0]
  const secondTerminal = value.terminalHistory[1]
  const expectedTerminalSchemaVersion = value.grant.schemaVersion ===
    CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_V4_VERSION
    ? CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_V4_VERSION
    : value.grant.schemaVersion === CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_V3_VERSION
      ? CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_V3_VERSION
      : value.grant.schemaVersion === CANONICAL_PRIVATE_PROVIDER_DISPATCH_GRANT_V2_VERSION
      ? CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_V2_VERSION
      : CANONICAL_PRIVATE_PROVIDER_DISPATCH_TERMINAL_VERSION
  if (
    (value.state === 'issued' && (hasAttempt || value.terminalHistory.length !== 0)) ||
    (value.state === 'consumed' && (!hasAttempt || value.terminalHistory.length !== 0)) ||
    (!['issued', 'consumed'].includes(value.state) &&
      (!hasAttempt || !latestTerminal || latestTerminal.state !== value.state)) ||
    value.terminalHistory.some((terminal) =>
      terminal.schemaVersion !== expectedTerminalSchemaVersion) ||
    (value.terminalHistory.length === 2 && (
      firstTerminal?.state !== 'unknown_reconciliation_required' ||
      secondTerminal?.priorTerminalHash !== firstTerminal.terminalHash ||
      secondTerminal.dispatchAttemptId !== firstTerminal.dispatchAttemptId
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical provider dispatch entry state is inconsistent.',
    })
  }
})

export const canonicalPrivateProviderDispatchAggregateSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PROVIDER_DISPATCH_AGGREGATE_VERSION),
  source: z.literal('private_canonical_provider_dispatch_store'),
  ownerUserId: identity,
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
    packageHash: sha256,
    queueDefinitionHash: sha256,
  }).strict(),
  entries: z.array(canonicalPrivateProviderDispatchEntrySchema).max(10),
  events: z.array(canonicalPrivateProviderDispatchEventSchema).max(100),
  boundaries: z.object({
    privateLocalPersistence: z.literal(true),
    tenantPackageAndClaimScoped: z.literal(true),
    checksumProtected: z.literal(true),
    oneUseDispatch: z.literal(true),
    toolDispatchUsed: z.literal(false),
    rawCredentialPersisted: z.literal(false),
    rawProviderRequestPersisted: z.literal(false),
    secretPayloadReadCount: z.literal(0),
    providerTransportActivated: z.literal(false),
    cloudMutationAuthorized: z.literal(false),
    customerCommercialAuthority: z.literal(false),
    distributedTransactionProven: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  updatedAt: timestamp,
  aggregateHash: sha256,
}).strict().superRefine((value, context) => {
  if (new Set(value.entries.map((entry) => entry.grant.grantId)).size !==
    value.entries.length) {
    context.addIssue({ code: 'custom', message: 'Provider dispatch grants are duplicated.' })
  }
  for (let index = 0; index < value.events.length; index += 1) {
    const event = value.events[index]!
    if (
      event.sequence !== index + 1 ||
      event.previousEventHash !== (value.events[index - 1]?.eventHash ?? null)
    ) {
      context.addIssue({ code: 'custom', message: 'Provider dispatch event chain is invalid.' })
      break
    }
  }
})

export type CanonicalPrivateProviderOutput = z.infer<
  typeof canonicalPrivateProviderOutputSchema
>
export type CanonicalPrivateProviderOutputV2 = z.infer<
  typeof canonicalPrivateProviderOutputV2Schema
>
export type CanonicalPrivateProviderOutputV3 = z.infer<
  typeof canonicalPrivateProviderOutputV3Schema
>
export type CanonicalPrivateProviderOutputV4 = z.infer<
  typeof canonicalPrivateProviderOutputV4Schema
>
export type CanonicalPrivateProviderDispatchGrant = z.infer<
  typeof canonicalPrivateProviderDispatchGrantSchema
>
export type CanonicalPrivateProviderDispatchAttempt = z.infer<
  typeof canonicalPrivateProviderDispatchAttemptSchema
>
export type CanonicalPrivateProviderDispatchTerminal = z.infer<
  typeof canonicalPrivateProviderDispatchTerminalSchema
>
export type CanonicalPrivateProviderDispatchGrantV2 = z.infer<
  typeof canonicalPrivateProviderDispatchGrantV2Schema
>
export type CanonicalPrivateProviderDispatchGrantAny = z.infer<
  typeof canonicalPrivateProviderDispatchGrantAnySchema
>
export type CanonicalPrivateProviderDispatchTerminalV2 = z.infer<
  typeof canonicalPrivateProviderDispatchTerminalV2Schema
>
export type CanonicalPrivateProviderDispatchGrantV3 = z.infer<
  typeof canonicalPrivateProviderDispatchGrantV3Schema
>
export type CanonicalPrivateProviderDispatchTerminalV3 = z.infer<
  typeof canonicalPrivateProviderDispatchTerminalV3Schema
>
export type CanonicalPrivateProviderDispatchGrantV4 = z.infer<
  typeof canonicalPrivateProviderDispatchGrantV4Schema
>
export type CanonicalPrivateProviderDispatchTerminalV4 = z.infer<
  typeof canonicalPrivateProviderDispatchTerminalV4Schema
>
export type CanonicalPrivateProviderDispatchTerminalAny = z.infer<
  typeof canonicalPrivateProviderDispatchTerminalAnySchema
>
export type CanonicalPrivateProviderDispatchEvent = z.infer<
  typeof canonicalPrivateProviderDispatchEventSchema
>
export type CanonicalPrivateProviderDispatchEntry = z.infer<
  typeof canonicalPrivateProviderDispatchEntrySchema
>
export type CanonicalPrivateProviderDispatchAggregate = z.infer<
  typeof canonicalPrivateProviderDispatchAggregateSchema
>
