import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import type { UploadTarget } from '../storage/storage-types'
import {
  assertCanonicalDurableUploadTargetProductionAuthority,
  canonicalDurableUploadIntentRequestHash,
  createCanonicalDurableUploadIntentCandidate,
  createCanonicalDurableUploadTargetStatePort,
  credentialDigest,
  hashCanonicalUploadTargetValue,
  resolveCanonicalUploadIntentAndTarget,
} from '../upload-target-authority/canonical-durable-upload-target-authority'
import {
  createCanonicalDurableUploadTargetLocalHttpClient,
  assertCanonicalDurableUploadTargetLocalHttpClientIsNotProduction,
} from '../upload-target-authority/canonical-durable-upload-target-local-supabase-http-rpc-client'
import {
  createCanonicalDurableUploadTargetLocalPostgresAdapter,
  createCanonicalDurableUploadTargetLocalPostgresCapability,
} from '../upload-target-authority/canonical-durable-upload-target-state-rpc-adapter'
import {
  createLocalCanonicalUploadTargetCredentialKeyWrapCapability,
} from '../upload-target-authority/canonical-upload-target-credential-envelope'
import {
  createCanonicalUploadTargetCredentialEscrowLocalHttpClient,
  assertCanonicalUploadTargetCredentialEscrowLocalHttpClientIsNotProduction,
} from '../upload-target-authority/canonical-upload-target-credential-escrow-local-supabase-http-rpc-client'
import {
  createCanonicalUploadTargetCredentialEscrowLocalPostgresAdapter,
  createCanonicalUploadTargetCredentialEscrowLocalPostgresCapability,
} from '../upload-target-authority/canonical-upload-target-credential-escrow-rpc-adapter'

const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const anonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
const jwtSecret = requiredEnvironment('REEDITPRO_CANONICAL_V3_JWT_SECRET')
assert.equal(endpointOrigin, 'http://127.0.0.1:57431')

const ownerA = '11111111-1111-4111-8111-111111111111'
const ownerB = '22222222-2222-4222-8222-222222222222'
const workspaceA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const workspaceB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const projectA = 'aaaaaaaa-1000-4000-8000-000000000001'
const createdAt = '2026-07-29T15:00:00.000Z'
const expiresAt = '2026-07-29T15:15:00.000Z'
const authorizationEvidenceHash = hash('authorized-user-a')
const localEscrowKeyMaterial = Buffer.from(
  hashCanonicalUploadTargetValue({ fixture: 'local-envelope-key-v1' }),
  'hex',
)
let escrowClock = createdAt

const clientA = createClient(ownerA, jwtSecret)
const clientB = createClient(ownerB, jwtSecret)
const unsignedClient = createCanonicalDurableUploadTargetLocalHttpClient({
  endpointOrigin,
  anonKey,
  authenticatedAccessToken: createLocalAuthenticatedJwt(ownerA, jwtSecret),
  localInternalSigningSecret: hash('browser-does-not-have-upload-target-signing-secret'),
})

function createPort(client: typeof clientA) {
  const capability = createCanonicalDurableUploadTargetLocalPostgresCapability({
    client,
    endpointOrigin,
  })
  return {
    capability,
    port: createCanonicalDurableUploadTargetStatePort(
      createCanonicalDurableUploadTargetLocalPostgresAdapter({ client, capability }),
    ),
  }
}

function createEscrow(
  ownerUserId: string,
  signingSecret: string,
  keyMaterial = localEscrowKeyMaterial,
) {
  const client = createCanonicalUploadTargetCredentialEscrowLocalHttpClient({
    endpointOrigin,
    anonKey,
    authenticatedAccessToken: createLocalAuthenticatedJwt(ownerUserId, jwtSecret),
    localInternalSigningSecret: signingSecret,
  })
  const capability =
    createCanonicalUploadTargetCredentialEscrowLocalPostgresCapability({
      client,
      endpointOrigin,
    })
  const keyWrapCapability =
    createLocalCanonicalUploadTargetCredentialKeyWrapCapability({
      keyVersionId: 'local_canonical_upload_target_key_v1',
      keyMaterial,
    })
  return {
    client,
    capability,
    keyWrapCapability,
    escrow: createCanonicalUploadTargetCredentialEscrowLocalPostgresAdapter({
      client,
      capability,
      keyWrapCapability,
      now: () => escrowClock,
    }),
  }
}

const authorityA = createPort(clientA)
const authorityB = createPort(clientB)
const encryptedEscrowA = createEscrow(ownerA, jwtSecret)
assert.equal(authorityA.port.descriptor.databaseBackend, 'postgres')
assert.equal(authorityA.port.descriptor.serializableIntentAndIssuanceTransactionsVerified, true)
assert.equal(authorityA.port.descriptor.durableIdempotencyResponseAssociationVerified, true)
assert.equal(authorityA.port.descriptor.authenticatedTenantIsolationVerified, true)
assert.equal(authorityA.port.descriptor.multiReplicaReadAfterWriteVerified, false)
assert.equal(authorityA.port.descriptor.liveGcsSessionIssuanceVerified, false)
assert.equal(authorityA.port.descriptor.productionAuthority, false)
assert.throws(
  () => assertCanonicalDurableUploadTargetProductionAuthority(authorityA.port),
  isAtomicityError,
)
assert.throws(
  () => assertCanonicalDurableUploadTargetLocalHttpClientIsNotProduction(clientA),
  isAtomicityError,
)
assert.throws(
  () => assertCanonicalUploadTargetCredentialEscrowLocalHttpClientIsNotProduction(
    encryptedEscrowA.client,
  ),
  isAtomicityError,
)
assert.equal(
  encryptedEscrowA.escrow.descriptor.implementationClass,
  'server_envelope_encrypted_ephemeral_store',
)
assert.equal(encryptedEscrowA.escrow.descriptor.envelopeEncryptionVerified, true)
assert.equal(encryptedEscrowA.escrow.descriptor.expiryAndDeletionVerified, true)
assert.equal(encryptedEscrowA.escrow.descriptor.multiReplicaRecoveryVerified, false)
assert.equal(encryptedEscrowA.escrow.descriptor.productionAuthority, false)
assert.throws(
  () => createCanonicalDurableUploadTargetLocalPostgresAdapter({
    client: clientA,
    capability: structuredClone(authorityA.capability),
  }),
  isAtomicityError,
)
assert.throws(
  () => createCanonicalUploadTargetCredentialEscrowLocalPostgresAdapter({
    client: encryptedEscrowA.client,
    capability: structuredClone(encryptedEscrowA.capability),
    keyWrapCapability: encryptedEscrowA.keyWrapCapability,
  }),
  isAtomicityError,
)

const unsignedCandidate = candidateFor('unsigned')
await assert.rejects(
  () => createCanonicalDurableUploadTargetStatePort(
    createCanonicalDurableUploadTargetLocalPostgresAdapter({
      client: unsignedClient,
      capability: createCanonicalDurableUploadTargetLocalPostgresCapability({
        client: unsignedClient,
        endpointOrigin,
      }),
    }),
  ).resolveIntent(resolveRequest(unsignedCandidate, 'upload-target-unsigned-key-0001')),
  isAtomicityError,
)

const concurrencyCandidate = candidateFor('concurrency')
const concurrencyRequest = resolveRequest(
  concurrencyCandidate,
  'upload-target-concurrency-key-0001',
)
const concurrent = await Promise.all([
  authorityA.port.resolveIntent(concurrencyRequest),
  authorityA.port.resolveIntent(concurrencyRequest),
])
assert.deepEqual(
  concurrent.map((result) => result.idempotencyStatus).sort(),
  ['exact_replay', 'inserted'],
)
assert.equal(concurrent[0]?.intent.uploadIntentId, concurrent[1]?.intent.uploadIntentId)
assert.equal(concurrent[0]?.transaction.transactionId, concurrent[1]?.transaction.transactionId)

const successCandidate = candidateFor('success')
const escrow = encryptedEscrowA.escrow
let targetCreationCount = 0
const createTarget = async (): Promise<UploadTarget> => {
  targetCreationCount += 1
  return targetFor(successCandidate)
}
const first = await resolveCanonicalUploadIntentAndTarget({
  port: authorityA.port,
  escrow,
  candidate: successCandidate,
  idempotencyKey: 'upload-target-success-domain-key-0001',
  authorizationEvidenceHash,
  expectedProtocol: 'gcs_resumable',
  now: createdAt,
  createTarget,
})
assert.equal(first.disposition, 'issued')
assert.equal(first.intent.state, 'target_issued')
assert.equal(first.intent.revision, 3)
assert.equal(targetCreationCount, 1)

const restartedAuthorityA = createPort(createClient(ownerA, jwtSecret))
const restartedEncryptedEscrowA = createEscrow(ownerA, jwtSecret)
const replay = await resolveCanonicalUploadIntentAndTarget({
  port: restartedAuthorityA.port,
  escrow: restartedEncryptedEscrowA.escrow,
  candidate: successCandidate,
  idempotencyKey: 'upload-target-success-domain-key-0001',
  authorizationEvidenceHash,
  expectedProtocol: 'gcs_resumable',
  now: createdAt,
  createTarget,
})
assert.equal(replay.disposition, 'recovered_exact_target')
assert.equal(replay.target.uploadUrl, first.target.uploadUrl)
assert.equal(replay.intent.recordHash, first.intent.recordHash)
assert.equal(targetCreationCount, 1)
const successEscrowIdentity = {
  recordId: `upload_target_escrow_${first.issuanceAttemptId}`,
  uploadIntentId: first.intent.uploadIntentId,
  attemptId: first.issuanceAttemptId,
}
await restartedEncryptedEscrowA.escrow.put({
  ...successEscrowIdentity,
  target: first.target,
  credentialDigestSha256: credentialDigest(first.target),
  expiresAt: first.target.expiresAt,
})
const exactEscrowReplay = await restartedEncryptedEscrowA.escrow.read(
  successEscrowIdentity,
)
assert.equal(exactEscrowReplay?.uploadUrl, first.target.uploadUrl)

const wrongKeyEscrow = createEscrow(
  ownerA,
  jwtSecret,
  Buffer.from(hashCanonicalUploadTargetValue({ fixture: 'wrong-local-key' }), 'hex'),
)
await assert.rejects(
  () => wrongKeyEscrow.escrow.read(successEscrowIdentity),
  isAtomicityError,
)
const crossTenantEscrow = createEscrow(ownerB, jwtSecret)
await assert.rejects(
  () => crossTenantEscrow.escrow.read(successEscrowIdentity),
  isAtomicityError,
)
const readback = await restartedAuthorityA.port.readIntent({
  ownerUserId: ownerA,
  workspaceId: workspaceA,
  uploadIntentId: successCandidate.uploadIntentId,
  authorizationEvidenceHash,
})
assert.equal(readback?.recordHash, first.intent.recordHash)
await assert.rejects(
  () => authorityB.port.readIntent({
    ownerUserId: ownerB,
    workspaceId: workspaceB,
    uploadIntentId: successCandidate.uploadIntentId,
    authorizationEvidenceHash: hash('authorized-user-b'),
  }),
  isAtomicityError,
)

const unknownCandidate = candidateFor('unknown')
let unknownCreationCount = 0
const createUnknownTarget = async (): Promise<UploadTarget> => {
  unknownCreationCount += 1
  throw new Error('controlled_unknown_external_outcome')
}
const unknownInput = {
  port: authorityA.port,
  escrow,
  candidate: unknownCandidate,
  idempotencyKey: 'upload-target-unknown-domain-key-0001',
  authorizationEvidenceHash,
  expectedProtocol: 'gcs_resumable' as const,
  now: createdAt,
  createTarget: createUnknownTarget,
}
await assert.rejects(
  () => resolveCanonicalUploadIntentAndTarget(unknownInput),
  isAtomicityError,
)
await assert.rejects(
  () => resolveCanonicalUploadIntentAndTarget({
    ...unknownInput,
    port: restartedAuthorityA.port,
  }),
  isAtomicityError,
)
assert.equal(unknownCreationCount, 1)
const unknownReadback = await restartedAuthorityA.port.readIntent({
  ownerUserId: ownerA,
  workspaceId: workspaceA,
  uploadIntentId: unknownCandidate.uploadIntentId,
  authorizationEvidenceHash,
})
assert.equal(unknownReadback?.state, 'target_issue_unknown')
assert.equal(
  unknownReadback?.issuance.unknownReasonCode,
  'TARGET_CREATION_OUTCOME_UNKNOWN',
)

const expiringCandidate = candidateFor(
  'expiring',
  '2026-07-29T15:01:00.000Z',
)
const expiringResult = await resolveCanonicalUploadIntentAndTarget({
  port: authorityA.port,
  escrow,
  candidate: expiringCandidate,
  idempotencyKey: 'upload-target-expiring-domain-key-0001',
  authorizationEvidenceHash,
  expectedProtocol: 'gcs_resumable',
  now: createdAt,
  createTarget: async () => targetFor(expiringCandidate),
})
const expiringEscrowIdentity = {
  recordId: `upload_target_escrow_${expiringResult.issuanceAttemptId}`,
  uploadIntentId: expiringResult.intent.uploadIntentId,
  attemptId: expiringResult.issuanceAttemptId,
}
escrowClock = '2026-07-29T15:02:00.000Z'
const expiryRecoveryEscrow = createEscrow(ownerA, jwtSecret)
assert.equal(await expiryRecoveryEscrow.escrow.read(expiringEscrowIdentity), undefined)
assert.equal(await expiryRecoveryEscrow.escrow.read(expiringEscrowIdentity), undefined)

escrowClock = createdAt
const deletedCandidate = candidateFor('deleted')
const deletedResult = await resolveCanonicalUploadIntentAndTarget({
  port: authorityA.port,
  escrow,
  candidate: deletedCandidate,
  idempotencyKey: 'upload-target-deleted-domain-key-0001',
  authorizationEvidenceHash,
  expectedProtocol: 'gcs_resumable',
  now: createdAt,
  createTarget: async () => targetFor(deletedCandidate),
})
const deletedEscrowIdentity = {
  recordId: `upload_target_escrow_${deletedResult.issuanceAttemptId}`,
  uploadIntentId: deletedResult.intent.uploadIntentId,
  attemptId: deletedResult.issuanceAttemptId,
}
await restartedEncryptedEscrowA.escrow.delete(deletedEscrowIdentity)
await restartedEncryptedEscrowA.escrow.delete(deletedEscrowIdentity)
assert.equal(
  await restartedEncryptedEscrowA.escrow.read(deletedEscrowIdentity),
  undefined,
)

console.log(JSON.stringify({
  status: 'passed',
  schemaVersion: 'canonical-durable-upload-target-local-postgres-proof-v2',
  concurrentExactReplayVerified: true,
  restartReadAndExactTargetReplayVerified: true,
  restartEncryptedCredentialRecoveryVerified: true,
  envelopeEncryptedCredentialPersistenceVerified: true,
  exactEncryptedEnvelopePutReplayVerified: true,
  wrongKeyDecryptionRejected: true,
  encryptedEscrowTenantIsolationVerified: true,
  expiredCredentialCiphertextScrubVerified: true,
  explicitCredentialCiphertextDeletionVerified: true,
  intentCommittedBeforeExternalTargetSideEffect: true,
  unknownTargetOutcomeBlocksDuplicateIssuance: true,
  authenticatedTenantIsolationVerified: true,
  rawCredentialPersistedInCanonicalDatabase: false,
  localPostgresCallPerformed: true,
  multiReplicaReadAfterWriteVerified: false,
  liveGcsSessionIssuanceVerified: false,
  liveCloudKmsVerified: false,
  productionCredentialEscrowVerified: false,
  remoteDatabaseMutationPerformed: false,
  productionAuthority: false,
}, null, 2))

function createClient(ownerUserId: string, signingSecret: string) {
  return createCanonicalDurableUploadTargetLocalHttpClient({
    endpointOrigin,
    anonKey,
    authenticatedAccessToken: createLocalAuthenticatedJwt(ownerUserId, jwtSecret),
    localInternalSigningSecret: signingSecret,
  })
}

function candidateFor(suffix: string, targetExpiresAt = expiresAt) {
  const requestHash = canonicalDurableUploadIntentRequestHash({
    ownerUserId: ownerA,
    workspaceId: workspaceA,
    projectId: projectA,
    uploadPurpose: 'source_media',
    targetBucket: 'reeditpro-source-staging',
    originalFileName: `${suffix}-professional-source.mp4`,
    mimeType: 'video/mp4',
    expectedSizeBytes: 64 * 1024 * 1024,
    checksumSha256: hash(`checksum:${suffix}`),
  })
  return createCanonicalDurableUploadIntentCandidate({
    uploadIntentId: `upload_local_target_${suffix}`,
    ownerUserId: ownerA,
    workspaceId: workspaceA,
    projectId: projectA,
    uploadPurpose: 'source_media',
    targetBucket: 'reeditpro-source-staging',
    targetPath: `temporary/${workspaceA}/${suffix}/professional-source.mp4`,
    originalFileName: `${suffix}-professional-source.mp4`,
    mimeType: 'video/mp4',
    expectedSizeBytes: 64 * 1024 * 1024,
    checksumSha256: hash(`checksum:${suffix}`),
    requestHash,
    createdAt,
    expiresAt: targetExpiresAt,
  })
}

function resolveRequest(
  candidate: ReturnType<typeof candidateFor>,
  idempotencyKey: string,
) {
  return {
    candidate,
    idempotencyKey,
    requestHash: candidate.requestHash,
    authorizationEvidenceHash,
    requestedAt: createdAt,
  }
}

function targetFor(candidate: ReturnType<typeof candidateFor>): UploadTarget {
  return {
    uploadMethod: 'POST',
    uploadUrl: `https://storage.invalid/resumable/${candidate.uploadIntentId}`,
    uploadHeaders: { 'content-type': candidate.mimeType },
    expiresAt: candidate.expiresAt,
    bucketName: candidate.targetBucket,
    objectPath: candidate.targetPath,
    temporary: true,
    createOnly: true,
    uploadProtocol: 'gcs_resumable',
    supportsResume: true,
    recommendedChunkSizeBytes: 8 * 1024 * 1024,
    sessionUriIsCredential: true,
  }
}

function hash(value: string): string {
  return hashCanonicalUploadTargetValue({ fixture: value })
}

function createLocalAuthenticatedJwt(subject: string, secret: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    aud: 'authenticated',
    exp: now + 900,
    iat: now,
    role: 'authenticated',
    sub: subject,
  })).toString('base64url')
  const unsigned = `${header}.${payload}`
  return `${unsigned}.${createHmac('sha256', secret).update(unsigned).digest('base64url')}`
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`upload_target_local_postgres_environment_missing:${name}`)
  return value
}

function isAtomicityError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED'
}
