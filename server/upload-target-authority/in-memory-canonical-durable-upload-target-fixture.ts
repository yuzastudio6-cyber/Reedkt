import { randomUUID } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import type { UploadTarget } from '../storage/storage-types'
import {
  canonicalDurableUploadIntentRequestHash,
  createCanonicalUploadTargetCredentialEscrow,
  createCanonicalDurableUploadTargetStatePort,
  createDurableUploadIntentRecord,
  createDurableUploadTargetDescriptor,
  createDurableUploadTargetMutationResult,
  createDurableUploadTargetTransaction,
  createIssuance,
  hashCanonicalUploadTargetValue,
  type CanonicalDurableUploadIntentRecord,
  type CanonicalDurableUploadTargetMutationResult,
  type CanonicalDurableUploadTargetTransactionAdapter,
  type CanonicalUploadTargetCredentialEscrow,
} from './canonical-durable-upload-target-authority'

type ResolveInput = Parameters<CanonicalDurableUploadTargetTransactionAdapter['resolveIntent']>[0]
type ClaimInput = Parameters<CanonicalDurableUploadTargetTransactionAdapter['claimTarget']>[0]
type CommitInput = Parameters<CanonicalDurableUploadTargetTransactionAdapter['commitTarget']>[0]
type UnknownInput = Parameters<CanonicalDurableUploadTargetTransactionAdapter['markTargetUnknown']>[0]
type ReadInput = Parameters<CanonicalDurableUploadTargetTransactionAdapter['readIntent']>[0]

interface IdempotencyRecord {
  readonly operation: CanonicalDurableUploadTargetMutationResult['operation']
  readonly keyHash: string
  readonly requestHash: string
  readonly result: CanonicalDurableUploadTargetMutationResult
}

export class InMemoryCanonicalDurableUploadTargetFixture
implements CanonicalDurableUploadTargetTransactionAdapter {
  readonly descriptor = createDurableUploadTargetDescriptor({
    schemaVersion: 'canonical-durable-upload-target-authority-port-v1',
    adapterId: 'in_memory_canonical_durable_upload_target_fixture_v1',
    implementationClass: 'in_memory_contract_fixture',
    databaseBackend: 'none',
    serializableIntentAndIssuanceTransactionsVerified: true,
    durableIdempotencyResponseAssociationVerified: true,
    multiReplicaReadAfterWriteVerified: false,
    targetSideEffectOccursOnlyAfterIntentCommitVerified: true,
    unknownTargetOutcomeBlocksDuplicateIssuanceVerified: true,
    canonicalUploadLifecycleProjectionVerified: false,
    rawCredentialExcludedFromCanonicalPersistenceVerified: true,
    authenticatedTenantIsolationVerified: false,
    liveGcsSessionIssuanceVerified: false,
    liveReleaseEvidenceHash: null,
    productionAuthority: false,
  })

  private readonly intents = new Map<string, CanonicalDurableUploadIntentRecord>()
  private readonly idempotency = new Map<string, IdempotencyRecord>()
  private readonly operationLog: CanonicalDurableUploadTargetMutationResult['operation'][] = []

  async resolveIntent(input: ResolveInput): Promise<CanonicalDurableUploadTargetMutationResult> {
    const replay = this.replay('resolve_intent', input.idempotencyKey, input.requestHash)
    if (replay) return replay
    if (input.candidate.requestHash !== input.requestHash) {
      throw atomicityError('upload_intent_candidate_request_hash_mismatch')
    }
    const expectedRequestHash = canonicalDurableUploadIntentRequestHash({
      ownerUserId: input.candidate.ownerUserId,
      workspaceId: input.candidate.workspaceId,
      projectId: input.candidate.projectId,
      ...(input.candidate.editReferenceId ? { editReferenceId: input.candidate.editReferenceId } : {}),
      ...(input.candidate.chatSessionId ? { chatSessionId: input.candidate.chatSessionId } : {}),
      uploadPurpose: input.candidate.uploadPurpose,
      targetBucket: input.candidate.targetBucket,
      originalFileName: input.candidate.originalFileName,
      mimeType: input.candidate.mimeType,
      expectedSizeBytes: input.candidate.expectedSizeBytes,
      ...(input.candidate.checksumSha256 ? { checksumSha256: input.candidate.checksumSha256 } : {}),
    })
    if (expectedRequestHash !== input.requestHash) {
      throw atomicityError('upload_intent_domain_request_hash_invalid')
    }
    const duplicate = this.intents.get(input.candidate.uploadIntentId)
    if (duplicate) throw conflict('Upload-intent identity already exists with different authority.')

    const issuance = createIssuance({
      schemaVersion: 'canonical-durable-upload-target-issuance-v1',
      state: 'not_started',
      attemptId: null,
      leaseHash: null,
      claimLeaseExpiresAt: null,
      targetProtocol: null,
      uploadMethod: null,
      supportsResume: null,
      recommendedChunkSizeBytes: null,
      expiresAt: null,
      credentialDigestSha256: null,
      escrowRecordIdHash: null,
      targetMetadataHash: null,
      claimedAt: null,
      issuedAt: null,
      unknownAt: null,
      unknownReasonCode: null,
    })
    const intent = createDurableUploadIntentRecord({
      schemaVersion: 'canonical-durable-upload-intent-record-v1',
      authorityClass: 'pre_media_upload_intent_and_temporary_target',
      uploadIntentId: input.candidate.uploadIntentId,
      ownerUserId: input.candidate.ownerUserId,
      workspaceId: input.candidate.workspaceId,
      projectId: input.candidate.projectId,
      editReferenceId: input.candidate.editReferenceId,
      chatSessionId: input.candidate.chatSessionId,
      uploadPurpose: input.candidate.uploadPurpose,
      targetBucket: input.candidate.targetBucket,
      targetPath: input.candidate.targetPath,
      originalFileName: input.candidate.originalFileName,
      mimeType: input.candidate.mimeType,
      expectedSizeBytes: input.candidate.expectedSizeBytes,
      checksumSha256: input.candidate.checksumSha256,
      requestHash: input.requestHash,
      idempotencyKeyHash: hashCanonicalUploadTargetValue(input.idempotencyKey),
      revision: 1,
      state: 'ready_for_target',
      issuance,
      createdAt: input.candidate.createdAt,
      updatedAt: input.requestedAt,
      expiresAt: input.candidate.expiresAt,
    })
    return this.commitMutation('resolve_intent', input.idempotencyKey, input.requestHash, intent, 0)
  }

  async claimTarget(input: ClaimInput): Promise<CanonicalDurableUploadTargetMutationResult> {
    const replay = this.replay('claim_target', input.idempotencyKey, input.requestHash)
    if (replay) return replay
    const current = this.requireIntent(input.uploadIntentId)
    this.assertRevision(current, input.expectedRevision)
    if (current.state !== 'ready_for_target') {
      throw atomicityError(`target_claim_disallowed_from_${current.state}`)
    }
    const issuance = createIssuance({
      schemaVersion: 'canonical-durable-upload-target-issuance-v1',
      state: 'issuing',
      attemptId: input.attemptId,
      leaseHash: input.leaseHash,
      claimLeaseExpiresAt: input.claimLeaseExpiresAt,
      targetProtocol: input.targetProtocol,
      uploadMethod: null,
      supportsResume: null,
      recommendedChunkSizeBytes: null,
      expiresAt: input.expiresAt,
      credentialDigestSha256: null,
      escrowRecordIdHash: null,
      targetMetadataHash: null,
      claimedAt: input.requestedAt,
      issuedAt: null,
      unknownAt: null,
      unknownReasonCode: null,
    })
    const next = createDurableUploadIntentRecord({
      ...withoutRecordHash(current),
      revision: current.revision + 1,
      state: 'target_issuing',
      issuance,
      updatedAt: input.requestedAt,
    })
    return this.commitMutation(
      'claim_target',
      input.idempotencyKey,
      input.requestHash,
      next,
      current.revision,
    )
  }

  async commitTarget(input: CommitInput): Promise<CanonicalDurableUploadTargetMutationResult> {
    const replay = this.replay('commit_target', input.idempotencyKey, input.requestHash)
    if (replay) return replay
    const current = this.requireIntent(input.uploadIntentId)
    this.assertRevision(current, input.expectedRevision)
    this.assertClaim(current, input.attemptId, input.leaseHash)
    if (
      current.issuance.targetProtocol !== input.issuedTarget.targetProtocol ||
      current.issuance.expiresAt !== input.issuedTarget.expiresAt
    ) throw atomicityError('issued_target_does_not_match_claim')

    const issuance = createIssuance({
      schemaVersion: 'canonical-durable-upload-target-issuance-v1',
      state: 'issued',
      attemptId: input.attemptId,
      leaseHash: input.leaseHash,
      claimLeaseExpiresAt: current.issuance.claimLeaseExpiresAt,
      targetProtocol: input.issuedTarget.targetProtocol,
      uploadMethod: input.issuedTarget.uploadMethod,
      supportsResume: input.issuedTarget.supportsResume,
      recommendedChunkSizeBytes: input.issuedTarget.recommendedChunkSizeBytes,
      expiresAt: input.issuedTarget.expiresAt,
      credentialDigestSha256: input.issuedTarget.credentialDigestSha256,
      escrowRecordIdHash: input.issuedTarget.escrowRecordIdHash,
      targetMetadataHash: input.issuedTarget.targetMetadataHash,
      claimedAt: current.issuance.claimedAt,
      issuedAt: input.requestedAt,
      unknownAt: null,
      unknownReasonCode: null,
    })
    const next = createDurableUploadIntentRecord({
      ...withoutRecordHash(current),
      revision: current.revision + 1,
      state: 'target_issued',
      issuance,
      updatedAt: input.requestedAt,
    })
    return this.commitMutation(
      'commit_target',
      input.idempotencyKey,
      input.requestHash,
      next,
      current.revision,
    )
  }

  async markTargetUnknown(input: UnknownInput): Promise<CanonicalDurableUploadTargetMutationResult> {
    const replay = this.replay('mark_target_unknown', input.idempotencyKey, input.requestHash)
    if (replay) return replay
    const current = this.requireIntent(input.uploadIntentId)
    this.assertRevision(current, input.expectedRevision)
    this.assertClaim(current, input.attemptId, input.leaseHash)
    const issuance = createIssuance({
      schemaVersion: 'canonical-durable-upload-target-issuance-v1',
      state: 'unknown',
      attemptId: input.attemptId,
      leaseHash: input.leaseHash,
      claimLeaseExpiresAt: current.issuance.claimLeaseExpiresAt,
      targetProtocol: current.issuance.targetProtocol,
      uploadMethod: null,
      supportsResume: null,
      recommendedChunkSizeBytes: null,
      expiresAt: current.issuance.expiresAt,
      credentialDigestSha256: null,
      escrowRecordIdHash: null,
      targetMetadataHash: null,
      claimedAt: current.issuance.claimedAt,
      issuedAt: null,
      unknownAt: input.requestedAt,
      unknownReasonCode: input.reasonCode,
    })
    const next = createDurableUploadIntentRecord({
      ...withoutRecordHash(current),
      revision: current.revision + 1,
      state: 'target_issue_unknown',
      issuance,
      updatedAt: input.requestedAt,
    })
    return this.commitMutation(
      'mark_target_unknown',
      input.idempotencyKey,
      input.requestHash,
      next,
      current.revision,
    )
  }

  async readIntent(input: ReadInput): Promise<CanonicalDurableUploadIntentRecord | undefined> {
    const current = this.intents.get(input.uploadIntentId)
    if (!current) return undefined
    if (current.ownerUserId !== input.ownerUserId || current.workspaceId !== input.workspaceId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Upload intent does not belong to this actor and workspace.', 403)
    }
    return structuredClone(current)
  }

  snapshot(): {
    readonly intents: readonly CanonicalDurableUploadIntentRecord[]
    readonly operationLog: readonly CanonicalDurableUploadTargetMutationResult['operation'][]
  } {
    return {
      intents: [...this.intents.values()].map((intent) => structuredClone(intent)),
      operationLog: [...this.operationLog],
    }
  }

  private commitMutation(
    operation: CanonicalDurableUploadTargetMutationResult['operation'],
    rawIdempotencyKey: string,
    requestHash: string,
    intent: CanonicalDurableUploadIntentRecord,
    revisionBefore: number,
  ): CanonicalDurableUploadTargetMutationResult {
    const transaction = createDurableUploadTargetTransaction({
      schemaVersion: 'canonical-durable-upload-target-transaction-v1',
      transactionId: `upload_target_transaction_${randomUUID()}`,
      operation,
      uploadIntentId: intent.uploadIntentId,
      revisionBefore,
      revisionAfter: intent.revision,
      requestHash,
      idempotencyKeyHash: hashCanonicalUploadTargetValue(rawIdempotencyKey),
      auditEventHash: hashCanonicalUploadTargetValue({
        operation,
        uploadIntentId: intent.uploadIntentId,
        revision: intent.revision,
        state: intent.state,
        committedAt: intent.updatedAt,
      }),
      committedAt: intent.updatedAt,
    })
    const result = createDurableUploadTargetMutationResult({
      schemaVersion: 'canonical-durable-upload-target-mutation-result-v1',
      operation,
      idempotencyStatus: 'inserted',
      intent,
      transaction,
    })
    this.intents.set(intent.uploadIntentId, structuredClone(intent))
    const keyHash = hashCanonicalUploadTargetValue(rawIdempotencyKey)
    this.idempotency.set(`${operation}:${keyHash}`, {
      operation,
      keyHash,
      requestHash,
      result: structuredClone(result),
    })
    this.operationLog.push(operation)
    return structuredClone(result)
  }

  private replay(
    operation: CanonicalDurableUploadTargetMutationResult['operation'],
    rawIdempotencyKey: string,
    requestHash: string,
  ): CanonicalDurableUploadTargetMutationResult | undefined {
    const keyHash = hashCanonicalUploadTargetValue(rawIdempotencyKey)
    const existing = this.idempotency.get(`${operation}:${keyHash}`)
    if (!existing) return undefined
    if (existing.requestHash !== requestHash) throw conflict('Idempotency key was reused with another request.')
    return createDurableUploadTargetMutationResult({
      ...withoutResultHash(existing.result),
      idempotencyStatus: 'exact_replay',
    })
  }

  private requireIntent(uploadIntentId: string): CanonicalDurableUploadIntentRecord {
    const current = this.intents.get(uploadIntentId)
    if (!current) throw new ApiError('UPLOAD_INTENT_NOT_FOUND', 'Durable upload intent was not found.', 404)
    return current
  }

  private assertRevision(current: CanonicalDurableUploadIntentRecord, expectedRevision: number): void {
    if (current.revision !== expectedRevision) {
      throw new ApiError('VERSION_CONFLICT', 'Durable upload-intent revision changed.', 409, {
        expectedRevision,
        actualRevision: current.revision,
      })
    }
  }

  private assertClaim(
    current: CanonicalDurableUploadIntentRecord,
    attemptId: string,
    leaseHash: string,
  ): void {
    if (
      current.state !== 'target_issuing' ||
      current.issuance.attemptId !== attemptId ||
      current.issuance.leaseHash !== leaseHash
    ) throw atomicityError('temporary_target_claim_mismatch')
  }
}

export class InMemoryCanonicalUploadTargetCredentialEscrow
implements CanonicalUploadTargetCredentialEscrow {
  readonly descriptor = Object.freeze({
    schemaVersion: 'canonical-upload-target-credential-escrow-v1' as const,
    implementationClass: 'process_memory_fixture' as const,
    multiReplicaRecoveryVerified: false,
    envelopeEncryptionVerified: false,
    expiryAndDeletionVerified: true,
    rawCredentialLoggedOrStoredInCanonicalDatabase: false as const,
    productionAuthority: false,
  })

  private readonly targets = new Map<string, {
    readonly uploadIntentId: string
    readonly attemptId: string
    readonly target: UploadTarget
    readonly credentialDigestSha256: string
    readonly expiresAt: string
  }>()
  putCount = 0
  readCount = 0

  async put(input: Parameters<CanonicalUploadTargetCredentialEscrow['put']>[0]): Promise<void> {
    const existing = this.targets.get(input.recordId)
    if (existing) {
      if (
        existing.uploadIntentId !== input.uploadIntentId ||
        existing.attemptId !== input.attemptId ||
        existing.credentialDigestSha256 !== input.credentialDigestSha256
      ) throw conflict('Credential escrow identity already exists with different authority.')
      return
    }
    this.targets.set(input.recordId, structuredClone(input))
    this.putCount += 1
  }

  async read(input: Parameters<CanonicalUploadTargetCredentialEscrow['read']>[0]): Promise<UploadTarget | undefined> {
    this.readCount += 1
    const existing = this.targets.get(input.recordId)
    if (!existing) return undefined
    if (existing.uploadIntentId !== input.uploadIntentId || existing.attemptId !== input.attemptId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Credential escrow scope does not match.', 403)
    }
    return structuredClone(existing.target)
  }

  async delete(input: Parameters<CanonicalUploadTargetCredentialEscrow['delete']>[0]): Promise<void> {
    const existing = this.targets.get(input.recordId)
    if (!existing) return
    if (existing.uploadIntentId !== input.uploadIntentId || existing.attemptId !== input.attemptId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Credential escrow scope does not match.', 403)
    }
    this.targets.delete(input.recordId)
  }

  clearForRestartSimulation(): void {
    this.targets.clear()
  }
}

export function createInMemoryCanonicalDurableUploadTargetStatePort(): {
  readonly fixture: InMemoryCanonicalDurableUploadTargetFixture
  readonly port: CanonicalDurableUploadTargetTransactionAdapter
  readonly escrowFixture: InMemoryCanonicalUploadTargetCredentialEscrow
  readonly escrow: CanonicalUploadTargetCredentialEscrow
} {
  const fixture = new InMemoryCanonicalDurableUploadTargetFixture()
  const escrowFixture = new InMemoryCanonicalUploadTargetCredentialEscrow()
  return {
    fixture,
    port: createCanonicalDurableUploadTargetStatePort(fixture),
    escrowFixture,
    escrow: createCanonicalUploadTargetCredentialEscrow(escrowFixture),
  }
}

function withoutRecordHash(record: CanonicalDurableUploadIntentRecord): Omit<
  CanonicalDurableUploadIntentRecord,
  'recordHash'
> {
  const { recordHash, ...value } = record
  void recordHash
  return value
}

function withoutResultHash(result: CanonicalDurableUploadTargetMutationResult): Omit<
  CanonicalDurableUploadTargetMutationResult,
  'resultHash'
> {
  const { resultHash, ...value } = result
  void resultHash
  return value
}

function atomicityError(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The in-memory durable upload-target fixture rejected an unsafe transition.',
    503,
    { requiredGate: 'canonical_durable_upload_target_authority', reason },
  )
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}
