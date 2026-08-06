import { randomUUID } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import type { UploadPurpose, UploadTarget } from '../storage/storage-types'

export const CANONICAL_DURABLE_UPLOAD_TARGET_PORT_VERSION =
  'canonical-durable-upload-target-authority-port-v1' as const
export const CANONICAL_DURABLE_UPLOAD_TARGET_AUTHORITY_CLASS =
  'pre_media_upload_intent_and_temporary_target' as const
export const CANONICAL_UPLOAD_TARGET_CLAIM_LEASE_MS = 2 * 60 * 1_000

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const idempotencyKey = z.string().trim().min(16).max(240)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveSafeInteger = z.number().int().positive().refine(Number.isSafeInteger)
const uploadPurpose = z.enum(['source_media', 'reference_media'])
const targetProtocol = z.enum([
  'single_put',
  'gcs_resumable',
  'resumable_content_range_v1',
])

export const canonicalDurableUploadIntentCandidateSchema = z.object({
  schemaVersion: z.literal('canonical-durable-upload-intent-candidate-v1'),
  uploadIntentId: identity,
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editReferenceId: identity.nullable(),
  chatSessionId: identity.nullable(),
  uploadPurpose,
  targetBucket: identity,
  targetPath: z.string().trim().min(1).max(2_048)
    .refine((value) => !value.startsWith('/') && !value.includes('\\') && !value.includes('\0'))
    .refine((value) => value.split('/').every((part) => Boolean(part) && part !== '.' && part !== '..')),
  originalFileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(160),
  expectedSizeBytes: positiveSafeInteger.max(1024 ** 4),
  checksumSha256: sha256.nullable(),
  requestHash: sha256,
  createdAt: timestamp,
  expiresAt: timestamp,
  candidateHash: sha256,
}).strict()

export const canonicalDurableUploadTargetIssuanceSchema = z.object({
  schemaVersion: z.literal('canonical-durable-upload-target-issuance-v1'),
  state: z.enum(['not_started', 'issuing', 'issued', 'unknown']),
  attemptId: identity.nullable(),
  leaseHash: sha256.nullable(),
  claimLeaseExpiresAt: timestamp.nullable(),
  targetProtocol: targetProtocol.nullable(),
  uploadMethod: z.enum(['PUT', 'POST']).nullable(),
  supportsResume: z.boolean().nullable(),
  recommendedChunkSizeBytes: positiveSafeInteger.nullable(),
  expiresAt: timestamp.nullable(),
  credentialDigestSha256: sha256.nullable(),
  escrowRecordIdHash: sha256.nullable(),
  targetMetadataHash: sha256.nullable(),
  claimedAt: timestamp.nullable(),
  issuedAt: timestamp.nullable(),
  unknownAt: timestamp.nullable(),
  unknownReasonCode: z.enum([
    'TARGET_CREATION_OUTCOME_UNKNOWN',
    'TARGET_ESCROW_WRITE_FAILED',
    'TARGET_COMMIT_OUTCOME_UNKNOWN',
    'TARGET_ESCROW_RECOVERY_FAILED',
  ]).nullable(),
  issuanceHash: sha256,
}).strict().superRefine((issuance, context) => {
  const claimFields = [
    issuance.attemptId,
    issuance.leaseHash,
    issuance.claimLeaseExpiresAt,
    issuance.targetProtocol,
    issuance.expiresAt,
    issuance.claimedAt,
  ]
  const issuedFields = [
    issuance.uploadMethod,
    issuance.supportsResume,
    issuance.credentialDigestSha256,
    issuance.escrowRecordIdHash,
    issuance.targetMetadataHash,
    issuance.issuedAt,
  ]
  const unknownFields = [issuance.unknownAt, issuance.unknownReasonCode]
  const hasAnyClaim = claimFields.some((value) => value !== null)
  const hasClaim = claimFields.every((value) => value !== null)
  const hasAnyIssued = issuedFields.some((value) => value !== null) ||
    issuance.recommendedChunkSizeBytes !== null
  const hasIssued = issuedFields.every((value) => value !== null)
  const hasAnyUnknown = unknownFields.some((value) => value !== null)
  const hasUnknown = unknownFields.every((value) => value !== null)
  if (
    (issuance.state === 'not_started' && (hasAnyClaim || hasAnyIssued || hasAnyUnknown)) ||
    (issuance.state === 'issuing' && (!hasClaim || hasAnyIssued || hasAnyUnknown)) ||
    (issuance.state === 'issued' && (!hasClaim || !hasIssued || hasAnyUnknown)) ||
    (issuance.state === 'unknown' && (!hasClaim || hasAnyIssued || !hasUnknown)) ||
    (issuance.targetProtocol !== null &&
      issuance.targetProtocol !== 'single_put' &&
      issuance.supportsResume === false) ||
    (issuance.targetProtocol === 'single_put' && issuance.supportsResume === true)
  ) {
    context.addIssue({ code: 'custom', message: 'Temporary upload-target issuance state is inconsistent.' })
  }
  if (
    issuance.claimedAt && issuance.claimLeaseExpiresAt &&
    Date.parse(issuance.claimLeaseExpiresAt) <= Date.parse(issuance.claimedAt)
  ) context.addIssue({ code: 'custom', message: 'Temporary upload-target claim lease is invalid.' })
})

export const canonicalDurableUploadIntentRecordSchema = z.object({
  schemaVersion: z.literal('canonical-durable-upload-intent-record-v1'),
  authorityClass: z.literal(CANONICAL_DURABLE_UPLOAD_TARGET_AUTHORITY_CLASS),
  uploadIntentId: identity,
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editReferenceId: identity.nullable(),
  chatSessionId: identity.nullable(),
  uploadPurpose,
  targetBucket: identity,
  targetPath: z.string().trim().min(1).max(2_048),
  originalFileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(160),
  expectedSizeBytes: positiveSafeInteger.max(1024 ** 4),
  checksumSha256: sha256.nullable(),
  requestHash: sha256,
  idempotencyKeyHash: sha256,
  revision: positiveSafeInteger,
  state: z.enum(['ready_for_target', 'target_issuing', 'target_issued', 'target_issue_unknown']),
  issuance: canonicalDurableUploadTargetIssuanceSchema,
  createdAt: timestamp,
  updatedAt: timestamp,
  expiresAt: timestamp,
  recordHash: sha256,
}).strict().superRefine((record, context) => {
  const expectedState = {
    not_started: 'ready_for_target',
    issuing: 'target_issuing',
    issued: 'target_issued',
    unknown: 'target_issue_unknown',
  }[record.issuance.state]
  if (record.state !== expectedState) {
    context.addIssue({ code: 'custom', message: 'Upload-intent and target-issuance states diverge.' })
  }
})

const requestBase = {
  idempotencyKey,
  requestHash: sha256,
  requestedAt: timestamp,
}

export const canonicalDurableUploadIntentResolveRequestSchema = z.object({
  ...requestBase,
  candidate: canonicalDurableUploadIntentCandidateSchema,
  authorizationEvidenceHash: sha256,
}).strict()

export const canonicalDurableUploadTargetClaimRequestSchema = z.object({
  ...requestBase,
  uploadIntentId: identity,
  expectedRevision: positiveSafeInteger,
  attemptId: identity,
  leaseHash: sha256,
  claimLeaseExpiresAt: timestamp,
  targetProtocol,
  expiresAt: timestamp,
}).strict()

const issuedTargetMetadataSchema = z.object({
  uploadMethod: z.enum(['PUT', 'POST']),
  targetProtocol,
  supportsResume: z.boolean(),
  recommendedChunkSizeBytes: positiveSafeInteger.nullable(),
  expiresAt: timestamp,
  credentialDigestSha256: sha256,
  escrowRecordIdHash: sha256,
  targetMetadataHash: sha256,
}).strict().superRefine((metadata, context) => {
  if (
    (metadata.targetProtocol !== 'single_put' && !metadata.supportsResume) ||
    (metadata.targetProtocol === 'single_put' && metadata.supportsResume)
  ) context.addIssue({ code: 'custom', message: 'Issued upload-target protocol metadata is invalid.' })
})

export const canonicalDurableUploadTargetCommitRequestSchema = z.object({
  ...requestBase,
  uploadIntentId: identity,
  expectedRevision: positiveSafeInteger,
  attemptId: identity,
  leaseHash: sha256,
  issuedTarget: issuedTargetMetadataSchema,
}).strict()

export const canonicalDurableUploadTargetUnknownRequestSchema = z.object({
  ...requestBase,
  uploadIntentId: identity,
  expectedRevision: positiveSafeInteger,
  attemptId: identity,
  leaseHash: sha256,
  reasonCode: z.enum([
    'TARGET_CREATION_OUTCOME_UNKNOWN',
    'TARGET_ESCROW_WRITE_FAILED',
    'TARGET_COMMIT_OUTCOME_UNKNOWN',
    'TARGET_ESCROW_RECOVERY_FAILED',
  ]),
}).strict()

export const canonicalDurableUploadTargetReadRequestSchema = z.object({
  ownerUserId: identity,
  workspaceId: identity,
  uploadIntentId: identity,
  authorizationEvidenceHash: sha256,
}).strict()

const transactionSchema = z.object({
  schemaVersion: z.literal('canonical-durable-upload-target-transaction-v1'),
  transactionId: identity,
  operation: z.enum(['resolve_intent', 'claim_target', 'commit_target', 'mark_target_unknown']),
  uploadIntentId: identity,
  revisionBefore: z.number().int().nonnegative(),
  revisionAfter: positiveSafeInteger,
  requestHash: sha256,
  idempotencyKeyHash: sha256,
  auditEventHash: sha256,
  committedAt: timestamp,
  transactionHash: sha256,
}).strict().superRefine((transaction, context) => {
  if (transaction.revisionAfter !== transaction.revisionBefore + 1) {
    context.addIssue({ code: 'custom', message: 'Upload-target transaction revision is invalid.' })
  }
})

export const canonicalDurableUploadTargetMutationResultSchema = z.object({
  schemaVersion: z.literal('canonical-durable-upload-target-mutation-result-v1'),
  operation: transactionSchema.shape.operation,
  idempotencyStatus: z.enum(['inserted', 'exact_replay']),
  intent: canonicalDurableUploadIntentRecordSchema,
  transaction: transactionSchema,
  resultHash: sha256,
}).strict().superRefine((result, context) => {
  if (
    result.operation !== result.transaction.operation ||
    result.intent.uploadIntentId !== result.transaction.uploadIntentId ||
    result.intent.revision !== result.transaction.revisionAfter
  ) context.addIssue({ code: 'custom', message: 'Upload-target mutation result lineage is invalid.' })
})

export const canonicalDurableUploadTargetPortDescriptorSchema = z.object({
  schemaVersion: z.literal(CANONICAL_DURABLE_UPLOAD_TARGET_PORT_VERSION),
  adapterId: identity,
  implementationClass: z.enum(['in_memory_contract_fixture', 'database_transaction_adapter']),
  databaseBackend: z.enum(['none', 'postgres']),
  serializableIntentAndIssuanceTransactionsVerified: z.boolean(),
  durableIdempotencyResponseAssociationVerified: z.boolean(),
  multiReplicaReadAfterWriteVerified: z.boolean(),
  targetSideEffectOccursOnlyAfterIntentCommitVerified: z.boolean(),
  unknownTargetOutcomeBlocksDuplicateIssuanceVerified: z.boolean(),
  canonicalUploadLifecycleProjectionVerified: z.boolean(),
  rawCredentialExcludedFromCanonicalPersistenceVerified: z.boolean(),
  authenticatedTenantIsolationVerified: z.boolean(),
  liveGcsSessionIssuanceVerified: z.boolean(),
  liveReleaseEvidenceHash: sha256.nullable(),
  productionAuthority: z.boolean(),
  descriptorHash: sha256,
}).strict().superRefine((descriptor, context) => {
  const productionReady = descriptor.implementationClass === 'database_transaction_adapter' &&
    descriptor.databaseBackend === 'postgres' &&
    descriptor.serializableIntentAndIssuanceTransactionsVerified &&
    descriptor.durableIdempotencyResponseAssociationVerified &&
    descriptor.multiReplicaReadAfterWriteVerified &&
    descriptor.targetSideEffectOccursOnlyAfterIntentCommitVerified &&
    descriptor.unknownTargetOutcomeBlocksDuplicateIssuanceVerified &&
    descriptor.canonicalUploadLifecycleProjectionVerified &&
    descriptor.rawCredentialExcludedFromCanonicalPersistenceVerified &&
    descriptor.authenticatedTenantIsolationVerified &&
    descriptor.liveGcsSessionIssuanceVerified &&
    descriptor.liveReleaseEvidenceHash !== null
  if (descriptor.productionAuthority !== productionReady) {
    context.addIssue({ code: 'custom', message: 'Durable upload-target production authority is inconsistent.' })
  }
  if (descriptor.implementationClass === 'in_memory_contract_fixture' && descriptor.databaseBackend !== 'none') {
    context.addIssue({ code: 'custom', message: 'The in-memory upload-target fixture cannot claim a database backend.' })
  }
})

export type CanonicalDurableUploadIntentCandidate = z.infer<
  typeof canonicalDurableUploadIntentCandidateSchema
>
export type CanonicalDurableUploadIntentRecord = z.infer<
  typeof canonicalDurableUploadIntentRecordSchema
>
export type CanonicalDurableUploadTargetMutationResult = z.infer<
  typeof canonicalDurableUploadTargetMutationResultSchema
>
export type CanonicalDurableUploadTargetPortDescriptor = z.infer<
  typeof canonicalDurableUploadTargetPortDescriptorSchema
>

export interface CanonicalDurableUploadTargetTransactionAdapter {
  readonly descriptor: CanonicalDurableUploadTargetPortDescriptor
  resolveIntent(input: z.infer<typeof canonicalDurableUploadIntentResolveRequestSchema>):
    Promise<CanonicalDurableUploadTargetMutationResult>
  claimTarget(input: z.infer<typeof canonicalDurableUploadTargetClaimRequestSchema>):
    Promise<CanonicalDurableUploadTargetMutationResult>
  commitTarget(input: z.infer<typeof canonicalDurableUploadTargetCommitRequestSchema>):
    Promise<CanonicalDurableUploadTargetMutationResult>
  markTargetUnknown(input: z.infer<typeof canonicalDurableUploadTargetUnknownRequestSchema>):
    Promise<CanonicalDurableUploadTargetMutationResult>
  readIntent(input: z.infer<typeof canonicalDurableUploadTargetReadRequestSchema>):
    Promise<CanonicalDurableUploadIntentRecord | undefined>
}

export const canonicalUploadTargetCredentialEscrowDescriptorSchema = z.object({
  schemaVersion: z.literal('canonical-upload-target-credential-escrow-v1'),
  implementationClass: z.enum([
    'process_memory_fixture',
    'server_envelope_encrypted_ephemeral_store',
  ]),
  multiReplicaRecoveryVerified: z.boolean(),
  envelopeEncryptionVerified: z.boolean(),
  expiryAndDeletionVerified: z.boolean(),
  rawCredentialLoggedOrStoredInCanonicalDatabase: z.literal(false),
  productionAuthority: z.boolean(),
}).strict().superRefine((descriptor, context) => {
  const productionReady =
    descriptor.implementationClass === 'server_envelope_encrypted_ephemeral_store' &&
    descriptor.multiReplicaRecoveryVerified &&
    descriptor.envelopeEncryptionVerified &&
    descriptor.expiryAndDeletionVerified
  if (descriptor.productionAuthority !== productionReady) {
    context.addIssue({ code: 'custom', message: 'Upload-target credential escrow authority is inconsistent.' })
  }
  if (
    descriptor.implementationClass === 'process_memory_fixture' &&
    (descriptor.multiReplicaRecoveryVerified || descriptor.envelopeEncryptionVerified)
  ) context.addIssue({ code: 'custom', message: 'Process-memory escrow cannot claim distributed security evidence.' })
})

export type CanonicalUploadTargetCredentialEscrowDescriptor = z.infer<
  typeof canonicalUploadTargetCredentialEscrowDescriptorSchema
>

export interface CanonicalUploadTargetCredentialEscrow {
  readonly descriptor: CanonicalUploadTargetCredentialEscrowDescriptor
  put(input: {
    readonly recordId: string
    readonly uploadIntentId: string
    readonly attemptId: string
    readonly target: UploadTarget
    readonly credentialDigestSha256: string
    readonly expiresAt: string
  }): Promise<void>
  read(input: {
    readonly recordId: string
    readonly uploadIntentId: string
    readonly attemptId: string
  }): Promise<UploadTarget | undefined>
  delete(input: {
    readonly recordId: string
    readonly uploadIntentId: string
    readonly attemptId: string
  }): Promise<void>
}

const brandedPorts = new WeakSet<object>()
const brandedEscrows = new WeakSet<object>()

export function createCanonicalDurableUploadTargetStatePort(
  adapter: CanonicalDurableUploadTargetTransactionAdapter,
): CanonicalDurableUploadTargetTransactionAdapter {
  const descriptor = parseOrAtomicityError(
    canonicalDurableUploadTargetPortDescriptorSchema,
    adapter.descriptor,
    'Durable upload-target port descriptor',
  )
  assertHash(descriptor, 'descriptorHash', 'Durable upload-target port descriptor')
  const port: CanonicalDurableUploadTargetTransactionAdapter = {
    descriptor,
    resolveIntent: (input) => invokeMutation(
      'resolve_intent',
      canonicalDurableUploadIntentResolveRequestSchema,
      adapter.resolveIntent.bind(adapter),
      input,
    ),
    claimTarget: (input) => invokeMutation(
      'claim_target',
      canonicalDurableUploadTargetClaimRequestSchema,
      adapter.claimTarget.bind(adapter),
      input,
    ),
    commitTarget: (input) => invokeMutation(
      'commit_target',
      canonicalDurableUploadTargetCommitRequestSchema,
      adapter.commitTarget.bind(adapter),
      input,
    ),
    markTargetUnknown: (input) => invokeMutation(
      'mark_target_unknown',
      canonicalDurableUploadTargetUnknownRequestSchema,
      adapter.markTargetUnknown.bind(adapter),
      input,
    ),
    async readIntent(input) {
      const parsed = parseOrAtomicityError(
        canonicalDurableUploadTargetReadRequestSchema,
        input,
        'Durable upload-target read request',
      )
      const result = await adapter.readIntent(parsed)
      if (!result) return undefined
      const intent = validateIntent(result)
      if (
        intent.ownerUserId !== parsed.ownerUserId ||
        intent.workspaceId !== parsed.workspaceId ||
        intent.uploadIntentId !== parsed.uploadIntentId
      ) throw atomicityError('durable_upload_target_read_scope_lineage_mismatch')
      return intent
    },
  }
  Object.freeze(port)
  brandedPorts.add(port)
  return port
}

export function assertCanonicalDurableUploadTargetStatePort(
  value: unknown,
): asserts value is CanonicalDurableUploadTargetTransactionAdapter {
  if (!value || typeof value !== 'object' || !brandedPorts.has(value)) {
    throw atomicityError('canonical_durable_upload_target_port_not_process_branded')
  }
}

export function assertCanonicalDurableUploadTargetProductionAuthority(
  value: unknown,
): asserts value is CanonicalDurableUploadTargetTransactionAdapter {
  assertCanonicalDurableUploadTargetStatePort(value)
  const descriptor = value.descriptor
  if (!descriptor.productionAuthority) {
    throw atomicityError('canonical_durable_upload_target_production_authority_missing')
  }
}

export function createCanonicalUploadTargetCredentialEscrow(
  adapter: CanonicalUploadTargetCredentialEscrow,
): CanonicalUploadTargetCredentialEscrow {
  const descriptor = parseOrAtomicityError(
    canonicalUploadTargetCredentialEscrowDescriptorSchema,
    adapter.descriptor,
    'Canonical upload-target credential escrow descriptor',
  )
  const escrow: CanonicalUploadTargetCredentialEscrow = {
    descriptor: Object.freeze(descriptor),
    put: (input) => adapter.put(input),
    read: (input) => adapter.read(input),
    delete: (input) => adapter.delete(input),
  }
  Object.freeze(escrow)
  brandedEscrows.add(escrow)
  return escrow
}

export function assertCanonicalUploadTargetCredentialEscrow(
  escrow: CanonicalUploadTargetCredentialEscrow,
  requireProduction: boolean,
): void {
  if (!escrow || typeof escrow !== 'object' || !brandedEscrows.has(escrow)) {
    throw atomicityError('canonical_upload_target_credential_escrow_not_process_branded')
  }
  const descriptor = escrow.descriptor
  if (
    descriptor.schemaVersion !== 'canonical-upload-target-credential-escrow-v1' ||
    descriptor.rawCredentialLoggedOrStoredInCanonicalDatabase !== false ||
    typeof escrow.put !== 'function' ||
    typeof escrow.read !== 'function' ||
    typeof escrow.delete !== 'function'
  ) throw atomicityError('canonical_upload_target_credential_escrow_invalid')
  if (
    requireProduction &&
    (!descriptor.productionAuthority ||
      descriptor.implementationClass !== 'server_envelope_encrypted_ephemeral_store' ||
      !descriptor.multiReplicaRecoveryVerified ||
      !descriptor.envelopeEncryptionVerified ||
      !descriptor.expiryAndDeletionVerified)
  ) throw atomicityError('canonical_upload_target_credential_escrow_not_production_qualified')
}

export interface ResolveCanonicalUploadTargetInput {
  readonly port: CanonicalDurableUploadTargetTransactionAdapter
  readonly escrow: CanonicalUploadTargetCredentialEscrow
  readonly candidate: CanonicalDurableUploadIntentCandidate
  readonly idempotencyKey: string
  readonly authorizationEvidenceHash: string
  readonly expectedProtocol: z.infer<typeof targetProtocol>
  readonly now: string
  readonly createTarget: (intent: CanonicalDurableUploadIntentRecord) => Promise<UploadTarget>
}

export interface ResolvedCanonicalUploadTarget {
  readonly intent: CanonicalDurableUploadIntentRecord
  readonly target: UploadTarget
  readonly disposition: 'issued' | 'recovered_exact_target'
  readonly issuanceAttemptId: string
  readonly safeRecovery: {
    readonly uploadIntentId: string
    readonly issuanceAttemptId: string
    readonly targetProtocol: z.infer<typeof targetProtocol>
    readonly expiresAt: string
    readonly credentialPersistedInCanonicalAuthority: false
    readonly rawTargetLogged: false
  }
}

export async function resolveCanonicalUploadIntentAndTarget(
  input: ResolveCanonicalUploadTargetInput,
): Promise<ResolvedCanonicalUploadTarget> {
  assertCanonicalDurableUploadTargetStatePort(input.port)
  assertCanonicalUploadTargetCredentialEscrow(input.escrow, input.port.descriptor.productionAuthority)
  const candidate = parseOrAtomicityError(
    canonicalDurableUploadIntentCandidateSchema,
    input.candidate,
    'Durable upload-intent candidate',
  )
  assertHash(candidate, 'candidateHash', 'Durable upload-intent candidate')
  const resolved = await input.port.resolveIntent({
    candidate,
    idempotencyKey: input.idempotencyKey,
    requestHash: candidate.requestHash,
    authorizationEvidenceHash: input.authorizationEvidenceHash,
    requestedAt: input.now,
  })
  let intent = resolved.intent
  if (resolved.idempotencyStatus === 'exact_replay') {
    const current = await input.port.readIntent({
      ownerUserId: candidate.ownerUserId,
      workspaceId: candidate.workspaceId,
      uploadIntentId: resolved.intent.uploadIntentId,
      authorizationEvidenceHash: input.authorizationEvidenceHash,
    })
    if (!current) throw atomicityError('replayed_upload_intent_missing_from_canonical_readback')
    intent = current
  }
  assertResolvedIntentMatchesCandidate(
    intent,
    candidate,
    input.idempotencyKey,
    resolved.idempotencyStatus,
  )

  if (intent.state === 'target_issue_unknown') {
    throw targetRecoveryRequired(intent, 'temporary_target_issue_outcome_unknown')
  }
  if (intent.state === 'target_issued') {
    return recoverIssuedTarget(input, intent)
  }
  if (intent.state === 'target_issuing') {
    return recoverClaimedTarget(input, intent)
  }

  const attemptId = `upload_target_attempt_${randomUUID()}`
  const leaseHash = hashCanonicalUploadTargetValue({
    operation: 'claim_upload_target',
    uploadIntentId: intent.uploadIntentId,
    attemptId,
    nonce: randomUUID(),
  })
  const claimLeaseExpiresAt = new Date(
    Date.parse(input.now) + CANONICAL_UPLOAD_TARGET_CLAIM_LEASE_MS,
  ).toISOString()
  const claimRequestHash = hashCanonicalUploadTargetValue({
    operation: 'claim_target',
    uploadIntentId: intent.uploadIntentId,
    expectedRevision: intent.revision,
    attemptId,
    leaseHash,
    claimLeaseExpiresAt,
    targetProtocol: input.expectedProtocol,
    expiresAt: intent.expiresAt,
  })
  const claim = await input.port.claimTarget({
    uploadIntentId: intent.uploadIntentId,
    expectedRevision: intent.revision,
    attemptId,
    leaseHash,
    claimLeaseExpiresAt,
    targetProtocol: input.expectedProtocol,
    expiresAt: intent.expiresAt,
    idempotencyKey: suffixIdempotencyKey(input.idempotencyKey, 'claim'),
    requestHash: claimRequestHash,
    requestedAt: input.now,
  })
  intent = claim.intent
  if (claim.idempotencyStatus === 'exact_replay') return recoverClaimedTarget(input, intent)
  return issueClaimedTarget(input, intent)
}

async function recoverIssuedTarget(
  input: ResolveCanonicalUploadTargetInput,
  intent: CanonicalDurableUploadIntentRecord,
): Promise<ResolvedCanonicalUploadTarget> {
  const issuance = intent.issuance
  if (!issuance.attemptId || !issuance.credentialDigestSha256 || !issuance.targetProtocol || !issuance.expiresAt) {
    throw targetRecoveryRequired(intent, 'issued_target_identity_incomplete')
  }
  const recordId = escrowRecordId(issuance.attemptId)
  if (hashCanonicalUploadTargetValue(recordId) !== issuance.escrowRecordIdHash) {
    throw targetRecoveryRequired(intent, 'issued_target_escrow_identity_mismatch')
  }
  const target = await input.escrow.read({
    recordId,
    uploadIntentId: intent.uploadIntentId,
    attemptId: issuance.attemptId,
  })
  if (!target || credentialDigest(target) !== issuance.credentialDigestSha256) {
    throw targetRecoveryRequired(intent, 'issued_target_credential_unavailable')
  }
  if (isAtOrAfter(input.now, target.expiresAt)) {
    throw targetRecoveryRequired(intent, 'issued_target_credential_expired')
  }
  assertTargetMatchesIntent(target, intent, issuance.targetProtocol)
  return resolvedTarget(intent, target, 'recovered_exact_target')
}

async function recoverClaimedTarget(
  input: ResolveCanonicalUploadTargetInput,
  intent: CanonicalDurableUploadIntentRecord,
): Promise<ResolvedCanonicalUploadTarget> {
  const issuance = intent.issuance
  if (!issuance.attemptId || !issuance.leaseHash || !issuance.targetProtocol) {
    throw targetRecoveryRequired(intent, 'claimed_target_identity_incomplete')
  }
  const recordId = escrowRecordId(issuance.attemptId)
  const target = await input.escrow.read({
    recordId,
    uploadIntentId: intent.uploadIntentId,
    attemptId: issuance.attemptId,
  })
  if (!target) {
    if (issuance.claimLeaseExpiresAt && !isAtOrAfter(input.now, issuance.claimLeaseExpiresAt)) {
      throw targetIssuanceInProgress(intent)
    }
    await markUnknown(input, intent, 'TARGET_ESCROW_RECOVERY_FAILED')
    throw targetRecoveryRequired(intent, 'claimed_target_credential_unavailable')
  }
  if (isAtOrAfter(input.now, target.expiresAt)) {
    await markUnknown(input, intent, 'TARGET_ESCROW_RECOVERY_FAILED')
    throw targetRecoveryRequired(intent, 'claimed_target_credential_expired')
  }
  try {
    assertTargetMatchesIntent(target, intent, issuance.targetProtocol)
  } catch {
    await markUnknown(input, intent, 'TARGET_ESCROW_RECOVERY_FAILED')
    throw targetRecoveryRequired(intent, 'claimed_target_credential_mismatch')
  }
  return commitEscrowedTarget(input, intent, target, 'recovered_exact_target')
}

async function issueClaimedTarget(
  input: ResolveCanonicalUploadTargetInput,
  intent: CanonicalDurableUploadIntentRecord,
): Promise<ResolvedCanonicalUploadTarget> {
  let target: UploadTarget
  try {
    target = await input.createTarget(intent)
  } catch {
    await markUnknown(input, intent, 'TARGET_CREATION_OUTCOME_UNKNOWN')
    throw targetRecoveryRequired(intent, 'temporary_target_creation_outcome_unknown')
  }
  const protocol = intent.issuance.targetProtocol
  if (!protocol) throw targetRecoveryRequired(intent, 'target_protocol_missing_after_claim')
  try {
    assertTargetMatchesIntent(target, intent, protocol)
  } catch {
    await markUnknown(input, intent, 'TARGET_CREATION_OUTCOME_UNKNOWN')
    throw targetRecoveryRequired(intent, 'temporary_target_identity_mismatch')
  }
  const recordId = escrowRecordId(intent.issuance.attemptId ?? '')
  try {
    await input.escrow.put({
      recordId,
      uploadIntentId: intent.uploadIntentId,
      attemptId: intent.issuance.attemptId ?? '',
      target,
      credentialDigestSha256: credentialDigest(target),
      expiresAt: target.expiresAt,
    })
  } catch {
    await markUnknown(input, intent, 'TARGET_ESCROW_WRITE_FAILED')
    throw targetRecoveryRequired(intent, 'temporary_target_escrow_write_failed')
  }
  return commitEscrowedTarget(input, intent, target, 'issued')
}

async function commitEscrowedTarget(
  input: ResolveCanonicalUploadTargetInput,
  intent: CanonicalDurableUploadIntentRecord,
  target: UploadTarget,
  disposition: ResolvedCanonicalUploadTarget['disposition'],
): Promise<ResolvedCanonicalUploadTarget> {
  const issuance = intent.issuance
  if (!issuance.attemptId || !issuance.leaseHash || !issuance.targetProtocol) {
    throw targetRecoveryRequired(intent, 'target_commit_claim_identity_missing')
  }
  const issuedTarget = {
    uploadMethod: target.uploadMethod,
    targetProtocol: issuance.targetProtocol,
    supportsResume: target.supportsResume ?? false,
    recommendedChunkSizeBytes: target.recommendedChunkSizeBytes ?? null,
    expiresAt: target.expiresAt,
    credentialDigestSha256: credentialDigest(target),
    escrowRecordIdHash: hashCanonicalUploadTargetValue(escrowRecordId(issuance.attemptId)),
    targetMetadataHash: targetMetadataHash(target),
  }
  const requestHash = hashCanonicalUploadTargetValue({
    operation: 'commit_target',
    uploadIntentId: intent.uploadIntentId,
    expectedRevision: intent.revision,
    attemptId: issuance.attemptId,
    issuedTarget,
  })
  try {
    const committed = await input.port.commitTarget({
      uploadIntentId: intent.uploadIntentId,
      expectedRevision: intent.revision,
      attemptId: issuance.attemptId,
      leaseHash: issuance.leaseHash,
      issuedTarget,
      idempotencyKey: suffixIdempotencyKey(input.idempotencyKey, 'commit'),
      requestHash,
      requestedAt: input.now,
    })
    return resolvedTarget(committed.intent, target, disposition)
  } catch {
    const readback = await input.port.readIntent({
      ownerUserId: intent.ownerUserId,
      workspaceId: intent.workspaceId,
      uploadIntentId: intent.uploadIntentId,
      authorizationEvidenceHash: input.authorizationEvidenceHash,
    })
    if (
      readback?.state === 'target_issued' &&
      readback.issuance.attemptId === issuance.attemptId &&
      readback.issuance.credentialDigestSha256 === issuedTarget.credentialDigestSha256
    ) return resolvedTarget(readback, target, 'recovered_exact_target')
    await markUnknown(input, readback ?? intent, 'TARGET_COMMIT_OUTCOME_UNKNOWN')
    throw targetRecoveryRequired(readback ?? intent, 'temporary_target_commit_outcome_unknown')
  }
}

async function markUnknown(
  input: ResolveCanonicalUploadTargetInput,
  intent: CanonicalDurableUploadIntentRecord,
  reasonCode: z.infer<typeof canonicalDurableUploadTargetUnknownRequestSchema>['reasonCode'],
): Promise<void> {
  const issuance = intent.issuance
  if (!issuance.attemptId || !issuance.leaseHash || intent.state === 'target_issue_unknown') return
  const requestHash = hashCanonicalUploadTargetValue({
    operation: 'mark_target_unknown',
    uploadIntentId: intent.uploadIntentId,
    expectedRevision: intent.revision,
    attemptId: issuance.attemptId,
    reasonCode,
  })
  try {
    await input.port.markTargetUnknown({
      uploadIntentId: intent.uploadIntentId,
      expectedRevision: intent.revision,
      attemptId: issuance.attemptId,
      leaseHash: issuance.leaseHash,
      reasonCode,
      idempotencyKey: suffixIdempotencyKey(input.idempotencyKey, `unknown-${reasonCode}`),
      requestHash,
      requestedAt: input.now,
    })
  } catch {
    // The original target outcome remains unknown. Never create another target.
  }
}

function resolvedTarget(
  intent: CanonicalDurableUploadIntentRecord,
  target: UploadTarget,
  disposition: ResolvedCanonicalUploadTarget['disposition'],
): ResolvedCanonicalUploadTarget {
  const issuanceAttemptId = intent.issuance.attemptId
  const protocol = intent.issuance.targetProtocol
  if (!issuanceAttemptId || !protocol) throw targetRecoveryRequired(intent, 'resolved_target_identity_missing')
  return {
    intent,
    target,
    disposition,
    issuanceAttemptId,
    safeRecovery: {
      uploadIntentId: intent.uploadIntentId,
      issuanceAttemptId,
      targetProtocol: protocol,
      expiresAt: target.expiresAt,
      credentialPersistedInCanonicalAuthority: false,
      rawTargetLogged: false,
    },
  }
}

function assertTargetMatchesIntent(
  target: UploadTarget,
  intent: CanonicalDurableUploadIntentRecord,
  protocol: z.infer<typeof targetProtocol>,
): void {
  const actualProtocol = target.uploadProtocol ?? 'single_put'
  const supportsResume = target.supportsResume ?? false
  const retryFromVerifiedOffset = target.retryFromVerifiedOffset ?? false
  const protocolMetadataMismatch =
    (actualProtocol === 'single_put' &&
      (supportsResume || Boolean(target.uploadStatusUrl) || retryFromVerifiedOffset)) ||
    (actualProtocol === 'gcs_resumable' &&
      (!supportsResume || Boolean(target.uploadStatusUrl) || retryFromVerifiedOffset)) ||
    (actualProtocol === 'resumable_content_range_v1' &&
      (!supportsResume || !target.uploadStatusUrl || !retryFromVerifiedOffset))
  if (
    target.bucketName !== intent.targetBucket ||
    target.objectPath !== intent.targetPath ||
    target.expiresAt !== intent.expiresAt ||
    actualProtocol !== protocol ||
    target.createOnly !== true ||
    target.temporary !== true ||
    target.sessionUriIsCredential !== true ||
    protocolMetadataMismatch ||
    !target.uploadUrl ||
    Object.keys(target.uploadHeaders).some((header) => header.toLowerCase() === 'authorization')
  ) throw atomicityError('temporary_upload_target_does_not_match_committed_intent')
}

function assertResolvedIntentMatchesCandidate(
  intent: CanonicalDurableUploadIntentRecord,
  candidate: CanonicalDurableUploadIntentCandidate,
  idempotencyKeyValue: string,
  idempotencyStatus: CanonicalDurableUploadTargetMutationResult['idempotencyStatus'],
): void {
  const immutableDomainMatches =
    intent.ownerUserId === candidate.ownerUserId &&
    intent.workspaceId === candidate.workspaceId &&
    intent.projectId === candidate.projectId &&
    intent.editReferenceId === candidate.editReferenceId &&
    intent.chatSessionId === candidate.chatSessionId &&
    intent.uploadPurpose === candidate.uploadPurpose &&
    intent.targetBucket === candidate.targetBucket &&
    intent.originalFileName === candidate.originalFileName &&
    intent.mimeType === candidate.mimeType &&
    intent.expectedSizeBytes === candidate.expectedSizeBytes &&
    intent.checksumSha256 === candidate.checksumSha256 &&
    intent.requestHash === candidate.requestHash &&
    intent.idempotencyKeyHash === hashCanonicalUploadTargetValue(idempotencyKeyValue)
  const insertedIdentityMatches = idempotencyStatus === 'exact_replay' || (
    intent.uploadIntentId === candidate.uploadIntentId &&
    intent.targetPath === candidate.targetPath &&
    intent.createdAt === candidate.createdAt &&
    intent.expiresAt === candidate.expiresAt
  )
  if (!immutableDomainMatches || !insertedIdentityMatches) {
    throw atomicityError('resolved_upload_intent_candidate_lineage_mismatch')
  }
}

export function createCanonicalDurableUploadIntentCandidate(input: {
  readonly uploadIntentId: string
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editReferenceId?: string
  readonly chatSessionId?: string
  readonly uploadPurpose: Extract<UploadPurpose, 'source_media' | 'reference_media'>
  readonly targetBucket: string
  readonly targetPath: string
  readonly originalFileName: string
  readonly mimeType: string
  readonly expectedSizeBytes: number
  readonly checksumSha256?: string
  readonly requestHash: string
  readonly createdAt: string
  readonly expiresAt: string
}): CanonicalDurableUploadIntentCandidate {
  const candidate = {
    schemaVersion: 'canonical-durable-upload-intent-candidate-v1' as const,
    uploadIntentId: input.uploadIntentId,
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editReferenceId: input.editReferenceId ?? null,
    chatSessionId: input.chatSessionId ?? null,
    uploadPurpose: input.uploadPurpose,
    targetBucket: input.targetBucket,
    targetPath: input.targetPath,
    originalFileName: input.originalFileName,
    mimeType: input.mimeType,
    expectedSizeBytes: input.expectedSizeBytes,
    checksumSha256: input.checksumSha256 ?? null,
    requestHash: input.requestHash,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
  }
  return parseOrAtomicityError(
    canonicalDurableUploadIntentCandidateSchema,
    { ...candidate, candidateHash: hashCanonicalUploadTargetValue(candidate) },
    'Durable upload-intent candidate',
  )
}

export function canonicalDurableUploadIntentRequestHash(input: {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editReferenceId?: string
  readonly chatSessionId?: string
  readonly uploadPurpose: Extract<UploadPurpose, 'source_media' | 'reference_media'>
  readonly targetBucket: string
  readonly originalFileName: string
  readonly mimeType: string
  readonly expectedSizeBytes: number
  readonly checksumSha256?: string
}): string {
  return hashCanonicalUploadTargetValue({
    schemaVersion: 'canonical-durable-upload-intent-domain-request-v1',
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editReferenceId: input.editReferenceId ?? null,
    chatSessionId: input.chatSessionId ?? null,
    uploadPurpose: input.uploadPurpose,
    targetBucket: input.targetBucket,
    originalFileName: input.originalFileName,
    mimeType: input.mimeType,
    expectedSizeBytes: input.expectedSizeBytes,
    checksumSha256: input.checksumSha256 ?? null,
  })
}

export function credentialDigest(target: UploadTarget): string {
  return hashCanonicalUploadTargetValue({
    uploadUrl: target.uploadUrl,
    uploadStatusUrl: target.uploadStatusUrl ?? null,
    uploadHeaders: target.uploadHeaders,
    retryFromVerifiedOffset: target.retryFromVerifiedOffset ?? false,
    expiresAt: target.expiresAt,
  })
}

export function targetMetadataHash(target: UploadTarget): string {
  return hashCanonicalUploadTargetValue({
    uploadMethod: target.uploadMethod,
    bucketName: target.bucketName,
    objectPath: target.objectPath,
    expiresAt: target.expiresAt,
    createOnly: target.createOnly,
    temporary: target.temporary,
    uploadProtocol: target.uploadProtocol ?? 'single_put',
    supportsResume: target.supportsResume ?? false,
    recommendedChunkSizeBytes: target.recommendedChunkSizeBytes ?? null,
    uploadStatusUrl: target.uploadStatusUrl ?? null,
    retryFromVerifiedOffset: target.retryFromVerifiedOffset ?? false,
    sessionUriIsCredential: target.sessionUriIsCredential ?? true,
  })
}

export function hashCanonicalUploadTargetValue(value: unknown): string {
  return sha256AuthorityValue(value)
}

export function createDurableUploadTargetDescriptor(
  input: Omit<CanonicalDurableUploadTargetPortDescriptor, 'descriptorHash'>,
): CanonicalDurableUploadTargetPortDescriptor {
  const { descriptorHash: untrustedDescriptorHash, ...value } = input as typeof input & {
    descriptorHash?: unknown
  }
  void untrustedDescriptorHash
  return parseOrAtomicityError(
    canonicalDurableUploadTargetPortDescriptorSchema,
    { ...value, descriptorHash: hashCanonicalUploadTargetValue(value) },
    'Durable upload-target port descriptor',
  )
}

export function createDurableUploadIntentRecord(input: Omit<
  CanonicalDurableUploadIntentRecord,
  'recordHash'
>): CanonicalDurableUploadIntentRecord {
  const { recordHash: untrustedRecordHash, ...recordInput } = input as typeof input & {
    recordHash?: unknown
  }
  void untrustedRecordHash
  const issuance = createIssuance(recordInput.issuance)
  const record = { ...recordInput, issuance }
  return validateIntent({ ...record, recordHash: hashCanonicalUploadTargetValue(record) })
}

export function createDurableUploadTargetMutationResult(input: Omit<
  CanonicalDurableUploadTargetMutationResult,
  'resultHash'
>): CanonicalDurableUploadTargetMutationResult {
  const { resultHash: untrustedResultHash, ...resultInput } = input as typeof input & {
    resultHash?: unknown
  }
  void untrustedResultHash
  const value = { ...resultInput, intent: validateIntent(resultInput.intent) }
  const result = { ...value, resultHash: hashCanonicalUploadTargetValue(value) }
  return validateMutationResult(result)
}

export function createDurableUploadTargetTransaction(input: Omit<
  z.infer<typeof transactionSchema>,
  'transactionHash'
>): z.infer<typeof transactionSchema> {
  const { transactionHash: untrustedTransactionHash, ...value } = input as typeof input & {
    transactionHash?: unknown
  }
  void untrustedTransactionHash
  return parseOrAtomicityError(
    transactionSchema,
    { ...value, transactionHash: hashCanonicalUploadTargetValue(value) },
    'Durable upload-target transaction',
  )
}

export function createIssuance(input: Omit<
  z.infer<typeof canonicalDurableUploadTargetIssuanceSchema>,
  'issuanceHash'
>): z.infer<typeof canonicalDurableUploadTargetIssuanceSchema> {
  const { issuanceHash: untrustedIssuanceHash, ...value } = input as typeof input & {
    issuanceHash?: unknown
  }
  void untrustedIssuanceHash
  return parseOrAtomicityError(
    canonicalDurableUploadTargetIssuanceSchema,
    { ...value, issuanceHash: hashCanonicalUploadTargetValue(value) },
    'Temporary upload-target issuance',
  )
}

function escrowRecordId(attemptId: string): string {
  return `upload_target_escrow_${attemptId}`
}

function suffixIdempotencyKey(value: string, suffix: string): string {
  return `ut_${hashCanonicalUploadTargetValue({ value, suffix })}`
}

async function invokeMutation<TInput extends {
  idempotencyKey: string
  requestHash: string
}>(
  expectedOperation: CanonicalDurableUploadTargetMutationResult['operation'],
  schema: z.ZodType<TInput>,
  operation: (input: TInput) => Promise<CanonicalDurableUploadTargetMutationResult>,
  input: TInput,
): Promise<CanonicalDurableUploadTargetMutationResult> {
  const parsed = parseOrAtomicityError(schema, input, 'Durable upload-target mutation request')
  const result = validateMutationResult(await operation(parsed))
  if (
    result.operation !== expectedOperation ||
    result.transaction.requestHash !== parsed.requestHash ||
    result.transaction.idempotencyKeyHash !==
      hashCanonicalUploadTargetValue(parsed.idempotencyKey)
  ) throw atomicityError('durable_upload_target_mutation_result_request_lineage_mismatch')
  return result
}

function validateMutationResult(value: unknown): CanonicalDurableUploadTargetMutationResult {
  const result = parseOrAtomicityError(
    canonicalDurableUploadTargetMutationResultSchema,
    value,
    'Durable upload-target mutation result',
  )
  assertHash(result, 'resultHash', 'Durable upload-target mutation result')
  assertHash(result.transaction, 'transactionHash', 'Durable upload-target transaction')
  validateIntent(result.intent)
  return result
}

function validateIntent(value: unknown): CanonicalDurableUploadIntentRecord {
  const record = parseOrAtomicityError(
    canonicalDurableUploadIntentRecordSchema,
    value,
    'Durable upload-intent record',
  )
  assertHash(record, 'recordHash', 'Durable upload-intent record')
  assertHash(record.issuance, 'issuanceHash', 'Temporary upload-target issuance')
  return record
}

function assertHash<T extends Record<string, unknown>, K extends keyof T>(
  value: T,
  field: K,
  label: string,
): void {
  const copy = { ...value }
  delete copy[field]
  if (value[field] !== hashCanonicalUploadTargetValue(copy)) {
    throw atomicityError(`${label.toLowerCase().replaceAll(' ', '_')}_hash_invalid`)
  }
}

function parseOrAtomicityError<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      `${label} is invalid.`,
      503,
      { requiredGate: 'canonical_durable_upload_target_authority', issues: parsed.error.flatten() },
    )
  }
  return parsed.data
}

function targetRecoveryRequired(
  intent: CanonicalDurableUploadIntentRecord,
  reason: string,
): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The temporary upload target cannot be issued again until its prior outcome is reconciled safely.',
    503,
    {
      requiredGate: 'canonical_durable_upload_target_recovery',
      reason,
      uploadIntentId: intent.uploadIntentId,
      targetIssuanceState: intent.state,
      retryCreatesAnotherExternalSession: false,
      rawCredentialPersistedInCanonicalAuthority: false,
    },
  )
}

function targetIssuanceInProgress(intent: CanonicalDurableUploadIntentRecord): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The same temporary upload target is still being issued; no second storage session was created.',
    503,
    {
      requiredGate: 'canonical_durable_upload_target_claim_completion',
      uploadIntentId: intent.uploadIntentId,
      targetIssuanceState: intent.state,
      claimLeaseExpiresAt: intent.issuance.claimLeaseExpiresAt,
      retryableAfterLeaseOrExactReadback: true,
      retryCreatesAnotherExternalSession: false,
    },
  )
}

function isAtOrAfter(value: string, boundary: string): boolean {
  return Date.parse(value) >= Date.parse(boundary)
}

function atomicityError(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The canonical durable upload-target authority is unavailable or invalid.',
    503,
    { requiredGate: 'canonical_durable_upload_target_authority', reason },
  )
}
