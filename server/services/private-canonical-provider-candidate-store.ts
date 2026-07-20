import { createHash } from 'node:crypto'

import { z } from 'zod'

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
const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })

const privateCanonicalProviderCandidateMetadataSchema = z.object({
  schemaVersion: z.literal(METADATA_VERSION),
  objectIdentity: z.object({
    domain: z.literal('reeditpro:private-provider-candidate-object:v1'),
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    approvedWorkItemId: identity,
    jobId: identity,
    claimId: identity,
    dispatchAttemptId: identity,
    expectedOutputId: identity,
    contentSha256: sha256,
    byteLength: z.number().int().positive().max(MAX_CANDIDATE_BYTES),
    mimeType: z.literal('audio/wav'),
    providerGenerated: z.boolean(),
  }).strict(),
  privateObjectIdentityHash: sha256,
  assetId: identity,
  assetVersionId: identity,
  storage: z.object({
    privateLocalCreateOnly: z.literal(true),
    checksumReadbackRequired: z.literal(true),
    providerUrlPersisted: z.literal(false),
    localPathProjected: z.literal(false),
    databaseBacked: z.literal(false),
    productionDurability: z.literal(false),
  }).strict(),
  lifecycle: z.object({
    privateReviewOnly: z.literal(true),
    objectiveQaPending: z.literal(true),
    humanReviewPending: z.literal(true),
    selectionAllowed: z.literal(false),
    timelineMutationAllowed: z.literal(false),
    renderOrExportAllowed: z.literal(false),
    publicDeliveryAllowed: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  output: canonicalPrivateProviderOutputSchema,
  artifactEvidenceDigest: sha256,
}).strict()

export interface VerifiedPrivateCanonicalProviderCandidateReadback {
  output: CanonicalPrivateProviderOutput
  providerGenerated: boolean
  storageEvidenceHash: string
  sourceReadbackEvidenceHash: string
}

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

/**
 * Re-reads the exact private object and metadata under the same tenant and
 * attempt identity used at creation. It projects hashes only and never leaks a
 * local path or provider URL.
 */
export async function readVerifiedPrivateCanonicalProviderCandidate(input: {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorization
  dispatchAttempt: CanonicalPrivateProviderDispatchAttempt
  output: CanonicalPrivateProviderOutput
}): Promise<VerifiedPrivateCanonicalProviderCandidateReadback> {
  const output = canonicalPrivateProviderOutputSchema.parse(input.output)
  if (
    input.dispatchAttempt.authorizationHash !== input.authorization.authorityHash ||
    input.dispatchAttempt.dispatchAttemptId.length < 1 ||
    output.outputId !== input.authorization.expectedOutputId
  ) throw invalid('Provider candidate readback lost exact authorization lineage.')
  const paths = candidatePaths(input.authorization, output.privateObjectIdentityHash)
  const [bytes, metadataBytes] = await Promise.all([
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
    !bytes || !metadataBytes || bytes.byteLength < 44 ||
    bytes.byteLength > MAX_CANDIDATE_BYTES || metadataBytes.byteLength > 64 * 1024
  ) throw invalid('Private provider candidate readback is missing or oversized.')
  let decoded: unknown
  try {
    decoded = JSON.parse(metadataBytes.toString('utf8'))
  } catch {
    throw invalid('Private provider candidate metadata is not valid JSON.')
  }
  const metadata = privateCanonicalProviderCandidateMetadataSchema.parse(decoded)
  const { output: storedOutput, artifactEvidenceDigest, ...evidenceMetadata } = metadata
  const objectIdentity = metadata.objectIdentity
  const contentSha256 = sha256Bytes(bytes)
  const expectedObjectIdentityHash = sha256AuthorityValue(objectIdentity)
  const expectedAssetId = `provider_asset_${expectedObjectIdentityHash.slice(0, 40)}`
  const expectedAssetVersionId =
    `provider_asset_version_${expectedObjectIdentityHash.slice(0, 40)}`
  if (
    contentSha256 !== output.contentSha256 ||
    bytes.byteLength !== output.byteLength ||
    bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    bytes.subarray(8, 12).toString('ascii') !== 'WAVE' ||
    metadata.privateObjectIdentityHash !== expectedObjectIdentityHash ||
    metadata.privateObjectIdentityHash !== output.privateObjectIdentityHash ||
    metadata.assetId !== expectedAssetId || metadata.assetId !== output.assetId ||
    metadata.assetVersionId !== expectedAssetVersionId ||
    metadata.assetVersionId !== output.assetVersionId ||
    artifactEvidenceDigest !== sha256AuthorityValue(evidenceMetadata) ||
    artifactEvidenceDigest !== output.artifactEvidenceDigest ||
    stableAuthorityStringify(storedOutput) !== stableAuthorityStringify(output) ||
    objectIdentity.workspaceId !== input.authorization.workspaceId ||
    objectIdentity.projectId !== input.authorization.projectId ||
    objectIdentity.editSessionId !== input.authorization.editSessionId ||
    objectIdentity.approvedPlanSnapshotId !==
      input.authorization.approvedPlanSnapshotId ||
    objectIdentity.packageRecordId !== input.authorization.packageRecordId ||
    objectIdentity.approvedWorkItemId !== input.authorization.approvedWorkItemId ||
    objectIdentity.jobId !== input.authorization.queueJobId ||
    objectIdentity.claimId !== input.dispatchAttempt.queueClaimId ||
    objectIdentity.dispatchAttemptId !== input.dispatchAttempt.dispatchAttemptId ||
    objectIdentity.expectedOutputId !== input.authorization.expectedOutputId ||
    objectIdentity.contentSha256 !== contentSha256 ||
    objectIdentity.byteLength !== bytes.byteLength ||
    Date.parse(metadata.createdAt) < Date.parse(input.dispatchAttempt.consumedAt) ||
    Date.parse(metadata.createdAt) > Date.parse(input.authorization.expiresAt) ||
    (input.authorization.authorityClass === 'private_injected_nonprovider_test' &&
      objectIdentity.providerGenerated)
  ) throw invalid('Private provider candidate readback integrity changed.')
  const storageEvidenceHash = sha256AuthorityValue({
    objectContentSha256: contentSha256,
    metadataContentSha256: sha256Bytes(metadataBytes),
    artifactEvidenceDigest,
  })
  return {
    output,
    providerGenerated: objectIdentity.providerGenerated,
    storageEvidenceHash,
    sourceReadbackEvidenceHash: sha256AuthorityValue({
      domain: 'reeditpro:private-provider-candidate-source-readback:v1',
      authorizationHash: input.authorization.authorityHash,
      dispatchAttemptHash: input.dispatchAttempt.attemptHash,
      output,
      storageEvidenceHash,
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
