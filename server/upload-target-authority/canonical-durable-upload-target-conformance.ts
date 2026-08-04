import assert from 'node:assert/strict'

import { ApiError } from '../errors/api-error'
import type { UploadTarget } from '../storage/storage-types'
import {
  assertCanonicalDurableUploadTargetProductionAuthority,
  assertCanonicalDurableUploadTargetStatePort,
  assertCanonicalUploadTargetCredentialEscrow,
  canonicalDurableUploadIntentRequestHash,
  createCanonicalDurableUploadIntentCandidate,
  hashCanonicalUploadTargetValue,
  resolveCanonicalUploadIntentAndTarget,
} from './canonical-durable-upload-target-authority'
import {
  createInMemoryCanonicalDurableUploadTargetStatePort,
} from './in-memory-canonical-durable-upload-target-fixture'

const NOW = '2026-07-21T05:30:00.000Z'
const EXPIRES_AT = '2026-07-22T05:30:00.000Z'
const AUTHORIZATION_EVIDENCE_HASH = hashCanonicalUploadTargetValue({
  actor: 'user-upload-authority-conformance',
  workspace: 'workspace-upload-authority-conformance',
  access: 'write',
})

export interface CanonicalDurableUploadTargetConformanceEvidence {
  readonly schemaVersion: 'canonical-durable-upload-target-conformance-evidence-v1'
  readonly checkCount: number
  readonly checks: readonly string[]
  readonly targetCreationCount: number
  readonly exactTargetRecoveryCount: number
  readonly concurrentDuplicateTargetCreationCount: 0
  readonly unknownTargetDuplicateCreationCount: 0
  readonly expiredTargetReturned: false
  readonly canonicalStateContainsRawCredential: false
  readonly intentCommittedBeforeTargetSideEffect: true
  readonly customerCommercialAuthorityIncluded: false
  readonly liveDatabaseUsed: false
  readonly liveGcsSessionCreated: false
  readonly productionAuthority: false
  readonly evidenceHash: string
}

export async function runCanonicalDurableUploadTargetConformance(): Promise<
  CanonicalDurableUploadTargetConformanceEvidence
> {
  const checks: string[] = []
  const { fixture, port, escrow, escrowFixture } =
    createInMemoryCanonicalDurableUploadTargetStatePort()
  const candidate = candidateFor('successful', 'professional-source.mov')
  let targetCreationCount = 0
  let intentCommittedBeforeTargetSideEffect = false
  const createTarget = async (): Promise<UploadTarget> => {
    targetCreationCount += 1
    const snapshot = fixture.snapshot()
    intentCommittedBeforeTargetSideEffect = snapshot.operationLog.join(',') ===
      'resolve_intent,claim_target' && snapshot.intents[0]?.state === 'target_issuing'
    return targetFor(candidate, 'https://storage.invalid/upload/session-sensitive-successful')
  }
  const first = await resolveCanonicalUploadIntentAndTarget({
    port,
    escrow,
    candidate,
    idempotencyKey: 'upload-authority-successful-domain-key',
    authorizationEvidenceHash: AUTHORIZATION_EVIDENCE_HASH,
    expectedProtocol: 'gcs_resumable',
    now: NOW,
    createTarget,
  })
  assert.equal(first.disposition, 'issued')
  assert.equal(first.intent.state, 'target_issued')
  assert.equal(first.intent.revision, 3)
  assert.equal(intentCommittedBeforeTargetSideEffect, true)
  assert.equal(first.safeRecovery.credentialPersistedInCanonicalAuthority, false)
  checks.push('intent_committed_before_external_target_side_effect')
  checks.push('one_claim_one_target_one_atomic_issuance_commit')

  const replay = await resolveCanonicalUploadIntentAndTarget({
    port,
    escrow,
    candidate,
    idempotencyKey: 'upload-authority-successful-domain-key',
    authorizationEvidenceHash: AUTHORIZATION_EVIDENCE_HASH,
    expectedProtocol: 'gcs_resumable',
    now: NOW,
    createTarget,
  })
  assert.equal(replay.disposition, 'recovered_exact_target')
  assert.equal(replay.target.uploadUrl, first.target.uploadUrl)
  assert.equal(targetCreationCount, 1)
  assert.equal(escrowFixture.putCount, 1)
  checks.push('lost_http_response_recovers_exact_escrowed_target_without_new_session')

  const concurrent = createInMemoryCanonicalDurableUploadTargetStatePort()
  const concurrentCandidate = candidateFor('concurrent', 'concurrent-source.mov')
  let concurrentCreationCount = 0
  let releaseTargetCreation: (() => void) | undefined
  let signalTargetCreationStarted: (() => void) | undefined
  const targetCreationStarted = new Promise<void>((resolve) => {
    signalTargetCreationStarted = resolve
  })
  const targetCreationRelease = new Promise<void>((resolve) => {
    releaseTargetCreation = resolve
  })
  const concurrentCreateTarget = async (): Promise<UploadTarget> => {
    concurrentCreationCount += 1
    signalTargetCreationStarted?.()
    await targetCreationRelease
    return targetFor(
      concurrentCandidate,
      'https://storage.invalid/upload/session-sensitive-concurrent',
    )
  }
  const concurrentFirstPromise = resolveCanonicalUploadIntentAndTarget({
    port: concurrent.port,
    escrow: concurrent.escrow,
    candidate: concurrentCandidate,
    idempotencyKey: 'upload-authority-concurrent-domain-key',
    authorizationEvidenceHash: AUTHORIZATION_EVIDENCE_HASH,
    expectedProtocol: 'gcs_resumable',
    now: NOW,
    createTarget: concurrentCreateTarget,
  })
  await targetCreationStarted
  await assert.rejects(
    () => resolveCanonicalUploadIntentAndTarget({
      port: concurrent.port,
      escrow: concurrent.escrow,
      candidate: concurrentCandidate,
      idempotencyKey: 'upload-authority-concurrent-domain-key',
      authorizationEvidenceHash: AUTHORIZATION_EVIDENCE_HASH,
      expectedProtocol: 'gcs_resumable',
      now: NOW,
      createTarget: concurrentCreateTarget,
    }),
    isIssuanceInProgressGate,
  )
  assert.equal(concurrent.fixture.snapshot().intents[0]?.state, 'target_issuing')
  assert.equal(concurrentCreationCount, 1)
  releaseTargetCreation?.()
  const concurrentFirst = await concurrentFirstPromise
  const concurrentReplay = await resolveCanonicalUploadIntentAndTarget({
    port: concurrent.port,
    escrow: concurrent.escrow,
    candidate: concurrentCandidate,
    idempotencyKey: 'upload-authority-concurrent-domain-key',
    authorizationEvidenceHash: AUTHORIZATION_EVIDENCE_HASH,
    expectedProtocol: 'gcs_resumable',
    now: NOW,
    createTarget: concurrentCreateTarget,
  })
  assert.equal(concurrentReplay.target.uploadUrl, concurrentFirst.target.uploadUrl)
  assert.equal(concurrentCreationCount, 1)
  checks.push('concurrent_same_key_request_observes_active_claim_without_corrupting_it')

  await assert.rejects(
    () => resolveCanonicalUploadIntentAndTarget({
      port,
      escrow,
      candidate,
      idempotencyKey: 'upload-authority-successful-domain-key',
      authorizationEvidenceHash: AUTHORIZATION_EVIDENCE_HASH,
      expectedProtocol: 'gcs_resumable',
      now: '2026-07-23T05:30:00.000Z',
      createTarget,
    }),
    isRecoveryGate,
  )
  assert.equal(targetCreationCount, 1)
  checks.push('expired_credential_is_not_returned_or_silently_reissued')

  await assert.rejects(
    () => resolveCanonicalUploadIntentAndTarget({
      port,
      escrow,
      candidate: candidateFor('changed', 'different-source.mov'),
      idempotencyKey: 'upload-authority-successful-domain-key',
      authorizationEvidenceHash: AUTHORIZATION_EVIDENCE_HASH,
      expectedProtocol: 'gcs_resumable',
      now: NOW,
      createTarget,
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'IDEMPOTENCY_CONFLICT',
  )
  checks.push('same_key_changed_upload_request_conflicts')

  const canonicalSnapshot = fixture.snapshot()
  const serializedState = JSON.stringify(canonicalSnapshot)
  assert.equal(serializedState.includes('session-sensitive-successful'), false)
  assert.equal(serializedState.toLowerCase().includes('authorization'), false)
  assert.equal(serializedState.includes('uploadUrl'), false)
  checks.push('canonical_state_excludes_url_headers_and_bearer_material')

  await assert.rejects(
    () => port.readIntent({
      ownerUserId: 'other-user',
      workspaceId: candidate.workspaceId,
      uploadIntentId: first.intent.uploadIntentId,
      authorizationEvidenceHash: AUTHORIZATION_EVIDENCE_HASH,
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'WORKSPACE_ACCESS_DENIED',
  )
  checks.push('cross_actor_read_fails_closed')

  const unknown = createInMemoryCanonicalDurableUploadTargetStatePort()
  const unknownCandidate = candidateFor('unknown', 'unknown-outcome.mxf')
  let unknownCreationCount = 0
  const createUnknownTarget = async (): Promise<UploadTarget> => {
    unknownCreationCount += 1
    throw new Error('Synthetic connection loss after provider request submission.')
  }
  await assert.rejects(
    () => resolveCanonicalUploadIntentAndTarget({
      port: unknown.port,
      escrow: unknown.escrow,
      candidate: unknownCandidate,
      idempotencyKey: 'upload-authority-unknown-domain-key',
      authorizationEvidenceHash: AUTHORIZATION_EVIDENCE_HASH,
      expectedProtocol: 'gcs_resumable',
      now: NOW,
      createTarget: createUnknownTarget,
    }),
    isRecoveryGate,
  )
  const unknownAfterFirst = unknown.fixture.snapshot().intents[0]
  assert.equal(unknownAfterFirst?.state, 'target_issue_unknown')
  await assert.rejects(
    () => resolveCanonicalUploadIntentAndTarget({
      port: unknown.port,
      escrow: unknown.escrow,
      candidate: unknownCandidate,
      idempotencyKey: 'upload-authority-unknown-domain-key',
      authorizationEvidenceHash: AUTHORIZATION_EVIDENCE_HASH,
      expectedProtocol: 'gcs_resumable',
      now: NOW,
      createTarget: createUnknownTarget,
    }),
    isRecoveryGate,
  )
  assert.equal(unknownCreationCount, 1)
  checks.push('unknown_provider_outcome_blocks_duplicate_session_creation')

  escrowFixture.clearForRestartSimulation()
  await assert.rejects(
    () => resolveCanonicalUploadIntentAndTarget({
      port,
      escrow,
      candidate,
      idempotencyKey: 'upload-authority-successful-domain-key',
      authorizationEvidenceHash: AUTHORIZATION_EVIDENCE_HASH,
      expectedProtocol: 'gcs_resumable',
      now: NOW,
      createTarget,
    }),
    isRecoveryGate,
  )
  assert.equal(targetCreationCount, 1)
  checks.push('process_restart_without_qualified_credential_escrow_fails_closed')

  const mismatch = createInMemoryCanonicalDurableUploadTargetStatePort()
  const mismatchCandidate = candidateFor('mismatch', 'mismatched-target.mp4')
  await assert.rejects(
    () => resolveCanonicalUploadIntentAndTarget({
      port: mismatch.port,
      escrow: mismatch.escrow,
      candidate: mismatchCandidate,
      idempotencyKey: 'upload-authority-mismatch-domain-key',
      authorizationEvidenceHash: AUTHORIZATION_EVIDENCE_HASH,
      expectedProtocol: 'gcs_resumable',
      now: NOW,
      createTarget: async () => ({
        ...targetFor(mismatchCandidate, 'https://storage.invalid/upload/session-sensitive-mismatch'),
        objectPath: 'wrong/object/path.mp4',
      }),
    }),
    isRecoveryGate,
  )
  assert.equal(mismatch.fixture.snapshot().intents[0]?.state, 'target_issue_unknown')
  checks.push('target_identity_mismatch_becomes_unknown_and_non_retryable')

  assert.throws(() => assertCanonicalDurableUploadTargetStatePort(fixture), isAtomicityGate)
  assert.throws(() => assertCanonicalDurableUploadTargetStatePort({ ...port }), isAtomicityGate)
  assert.throws(() => assertCanonicalDurableUploadTargetProductionAuthority(port), isAtomicityGate)
  assert.throws(
    () => assertCanonicalUploadTargetCredentialEscrow(escrowFixture, false),
    isAtomicityGate,
  )
  assert.throws(
    () => assertCanonicalUploadTargetCredentialEscrow({ ...escrow }, false),
    isAtomicityGate,
  )
  checks.push('raw_or_cloned_adapter_cannot_cross_process_brand')
  checks.push('raw_or_cloned_credential_escrow_cannot_cross_process_brand')
  checks.push('in_memory_fixture_cannot_self_promote_to_production')

  const evidenceWithoutHash = {
    schemaVersion: 'canonical-durable-upload-target-conformance-evidence-v1' as const,
    checkCount: checks.length,
    checks,
    targetCreationCount,
    exactTargetRecoveryCount: 1,
    concurrentDuplicateTargetCreationCount: 0 as const,
    unknownTargetDuplicateCreationCount: 0 as const,
    expiredTargetReturned: false as const,
    canonicalStateContainsRawCredential: false as const,
    intentCommittedBeforeTargetSideEffect: true as const,
    customerCommercialAuthorityIncluded: false as const,
    liveDatabaseUsed: false as const,
    liveGcsSessionCreated: false as const,
    productionAuthority: false as const,
  }
  return {
    ...evidenceWithoutHash,
    evidenceHash: hashCanonicalUploadTargetValue(evidenceWithoutHash),
  }
}

export function assertCanonicalDurableUploadTargetConformanceEvidence(
  evidence: CanonicalDurableUploadTargetConformanceEvidence,
): void {
  const { evidenceHash, ...value } = evidence
  if (
    evidence.schemaVersion !== 'canonical-durable-upload-target-conformance-evidence-v1' ||
    evidence.checkCount !== evidence.checks.length ||
    evidence.checkCount < 10 ||
    evidence.concurrentDuplicateTargetCreationCount !== 0 ||
    evidence.unknownTargetDuplicateCreationCount !== 0 ||
    evidence.expiredTargetReturned !== false ||
    evidence.canonicalStateContainsRawCredential !== false ||
    evidence.intentCommittedBeforeTargetSideEffect !== true ||
    evidence.customerCommercialAuthorityIncluded !== false ||
    evidence.liveDatabaseUsed !== false ||
    evidence.liveGcsSessionCreated !== false ||
    evidence.productionAuthority !== false ||
    evidenceHash !== hashCanonicalUploadTargetValue(value)
  ) throw new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'Durable upload-target conformance evidence is invalid.',
    503,
    { requiredGate: 'canonical_durable_upload_target_authority' },
  )
}

function candidateFor(suffix: string, originalFileName: string) {
  const input = {
    uploadIntentId: `upload-intent-${suffix}`,
    ownerUserId: 'user-upload-authority-conformance',
    workspaceId: 'workspace-upload-authority-conformance',
    projectId: 'project-upload-authority-conformance',
    uploadPurpose: 'source_media' as const,
    targetBucket: 'source-media-conformance',
    originalFileName,
    mimeType: originalFileName.endsWith('.mxf') ? 'application/mxf' : 'video/quicktime',
    expectedSizeBytes: 64 * 1024 * 1024,
  }
  const requestHash = canonicalDurableUploadIntentRequestHash(input)
  return createCanonicalDurableUploadIntentCandidate({
    ...input,
    targetPath: `workspaces/${input.workspaceId}/projects/${input.projectId}/source/${suffix}/${originalFileName}`,
    requestHash,
    createdAt: NOW,
    expiresAt: EXPIRES_AT,
  })
}

function targetFor(
  candidate: ReturnType<typeof candidateFor>,
  uploadUrl: string,
): UploadTarget {
  return {
    uploadMethod: 'PUT',
    uploadUrl,
    uploadHeaders: { 'content-type': candidate.mimeType },
    expiresAt: candidate.expiresAt,
    bucketName: candidate.targetBucket,
    objectPath: candidate.targetPath,
    temporary: true,
    createOnly: true,
    uploadProtocol: 'gcs_resumable',
    supportsResume: true,
    recommendedChunkSizeBytes: 32 * 1024 * 1024,
    sessionUriIsCredential: true,
  }
}

function isRecoveryGate(error: unknown): boolean {
  return error instanceof ApiError &&
    error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED' &&
    Boolean(error.details && typeof error.details === 'object' &&
      (error.details as Record<string, unknown>).requiredGate ===
        'canonical_durable_upload_target_recovery')
}

function isIssuanceInProgressGate(error: unknown): boolean {
  return error instanceof ApiError &&
    error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED' &&
    Boolean(error.details && typeof error.details === 'object' &&
      (error.details as Record<string, unknown>).requiredGate ===
        'canonical_durable_upload_target_claim_completion')
}

function isAtomicityGate(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED'
}
