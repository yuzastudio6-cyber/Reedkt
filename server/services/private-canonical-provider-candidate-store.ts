import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import type { CanonicalProviderWorkAuthorization } from
  '../edit-architecture/canonical-provider-work-authority'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import type { CanonicalPrivateProviderDispatchAttempt } from
  '../validation/canonical-private-provider-dispatch-schemas'
import {
  canonicalPrivateProviderOutputSchema,
  type CanonicalPrivateProviderOutput,
} from '../validation/canonical-private-provider-dispatch-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

const MAX_CANDIDATE_BYTES = 128 * 1024 * 1024
const METADATA_VERSION = 'private-canonical-provider-candidate-v1' as const

export async function persistPrivateCanonicalProviderCandidate(input: {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorization
  dispatchAttempt: CanonicalPrivateProviderDispatchAttempt
  bytes: Buffer | Uint8Array
  mimeType: 'audio/wav'
  providerGenerated: boolean
  createdAt: string
}): Promise<{
  output: CanonicalPrivateProviderOutput
  idempotencyStatus: 'inserted' | 'duplicate_returned'
  providerGenerated: boolean
  storageEvidenceHash: string
}> {
  const bytes = Buffer.from(input.bytes)
  if (
    bytes.byteLength < 44 || bytes.byteLength > MAX_CANDIDATE_BYTES ||
    bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    bytes.subarray(8, 12).toString('ascii') !== 'WAVE'
  ) throw invalid('Provider music candidate must be one bounded RIFF/WAVE object.')
  const createdAt = canonicalTimestamp(input.createdAt)
  const { authorization, dispatchAttempt } = input
  if (
    dispatchAttempt.authorizationHash !== authorization.authorityHash ||
    dispatchAttempt.queueClaimId.length < 1 ||
    dispatchAttempt.queueClaimDeliveryAttempt < 1 ||
    Date.parse(createdAt) < Date.parse(dispatchAttempt.consumedAt) ||
    (authorization.authorityClass === 'private_injected_nonprovider_test' &&
      input.providerGenerated)
  ) throw invalid('Provider candidate lost exact dispatch or evidence-class authority.')
  const contentSha256 = sha256Bytes(bytes)
  const objectIdentity = {
    domain: 'reeditpro:private-provider-candidate-object:v1',
    workspaceId: authorization.workspaceId,
    projectId: authorization.projectId,
    editSessionId: authorization.editSessionId,
    approvedPlanSnapshotId: authorization.approvedPlanSnapshotId,
    packageRecordId: authorization.packageRecordId,
    approvedWorkItemId: authorization.approvedWorkItemId,
    jobId: authorization.queueJobId,
    claimId: dispatchAttempt.queueClaimId,
    dispatchAttemptId: dispatchAttempt.dispatchAttemptId,
    expectedOutputId: authorization.expectedOutputId,
    contentSha256,
    byteLength: bytes.byteLength,
    mimeType: input.mimeType,
    providerGenerated: input.providerGenerated,
  }
  const privateObjectIdentityHash = sha256AuthorityValue(objectIdentity)
  const assetId = `provider_asset_${privateObjectIdentityHash.slice(0, 40)}`
  const assetVersionId = `provider_asset_version_${privateObjectIdentityHash.slice(0, 40)}`
  const metadata = {
    schemaVersion: METADATA_VERSION,
    objectIdentity,
    privateObjectIdentityHash,
    assetId,
    assetVersionId,
    storage: {
      privateLocalCreateOnly: true as const,
      checksumReadbackRequired: true as const,
      providerUrlPersisted: false as const,
      localPathProjected: false as const,
      databaseBacked: false as const,
      productionDurability: false as const,
    },
    lifecycle: {
      privateReviewOnly: true as const,
      objectiveQaPending: true as const,
      humanReviewPending: true as const,
      selectionAllowed: false as const,
      timelineMutationAllowed: false as const,
      renderOrExportAllowed: false as const,
      publicDeliveryAllowed: false as const,
    },
    createdAt,
  }
  const artifactEvidenceDigest = sha256AuthorityValue(metadata)
  const output = canonicalPrivateProviderOutputSchema.parse({
    outputId: authorization.expectedOutputId,
    role: 'generated_instrumental_score_candidate',
    assetId,
    assetVersionId,
    privateObjectIdentityHash,
    contentSha256,
    byteLength: bytes.byteLength,
    mimeType: input.mimeType,
    createOnly: true,
    checksumReadbackVerified: true,
    providerUrlPersisted: false,
    localPathProjected: false,
    artifactEvidenceDigest,
  })
  const paths = candidatePaths(authorization, privateObjectIdentityHash)
  const metadataBytes = Buffer.from(`${stableAuthorityStringify({
    ...metadata,
    output,
    artifactEvidenceDigest,
  })}\n`, 'utf8')
  const createdObject = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: paths.object,
    content: bytes,
  })
  const createdMetadata = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: paths.metadata,
    content: metadataBytes,
  })
  const [persistedBytes, persistedMetadata] = await Promise.all([
    readPrivateFileIfExistsWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: paths.object,
    }),
    readPrivateFileIfExistsWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: paths.metadata,
    }),
  ])
  if (
    !persistedBytes || !persistedMetadata ||
    !persistedBytes.equals(bytes) ||
    !persistedMetadata.equals(metadataBytes) ||
    sha256Bytes(persistedBytes) !== contentSha256
  ) throw invalid('Private provider candidate failed exact create-only readback.')
  if (createdObject.created !== createdMetadata.created) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Private provider candidate object and metadata creation diverged.',
      503,
      { requiredGate: 'canonical_provider_candidate_storage_recovery' },
    )
  }
  return {
    output,
    idempotencyStatus: createdObject.created ? 'inserted' : 'duplicate_returned',
    providerGenerated: input.providerGenerated,
    storageEvidenceHash: sha256AuthorityValue({
      objectContentSha256: contentSha256,
      metadataContentSha256: sha256Bytes(metadataBytes),
      artifactEvidenceDigest,
    }),
  }
}

function candidatePaths(
  authorization: CanonicalProviderWorkAuthorization,
  privateObjectIdentityHash: string,
): { object: string; metadata: string } {
  const tenantHash = sha256Text(
    `${authorization.ownerUserId}\u0000${authorization.workspaceId}`,
  ).slice(0, 32)
  const prefix = `private-internal/provider-candidates/v1/${tenantHash}/${authorization.projectId}/${authorization.editSessionId}`
  return {
    object: `${prefix}/${privateObjectIdentityHash}.wav`,
    metadata: `${prefix}/${privateObjectIdentityHash}.json`,
  }
}

function canonicalTimestamp(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) {
    throw invalid('Provider candidate time is invalid.')
  }
  return value
}

function sha256Bytes(value: Buffer | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'canonical_private_provider_candidate_integrity',
  })
}
