import { createHash } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import type { CanonicalProviderWorkAuthorization } from
  '../edit-architecture/canonical-provider-work-authority'
import {
  resolveCanonicalProviderOperationV2,
  resolveCanonicalProviderOperationV3,
  type CanonicalProviderWorkAuthorizationV2,
  type CanonicalProviderWorkAuthorizationV3,
} from '../edit-architecture/canonical-provider-work-authority'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import type { CanonicalPrivateProviderDispatchAttempt } from
  '../validation/canonical-private-provider-dispatch-schemas'
import {
  canonicalPrivateProviderOutputSchema,
  canonicalPrivateProviderOutputV2Schema,
  canonicalPrivateProviderOutputV3Schema,
  type CanonicalPrivateProviderOutput,
  type CanonicalPrivateProviderOutputV2,
  type CanonicalPrivateProviderOutputV3,
} from '../validation/canonical-private-provider-dispatch-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

const MAX_CANDIDATE_BYTES = 128 * 1024 * 1024
const METADATA_VERSION = 'private-canonical-provider-candidate-v1' as const
const METADATA_V2_VERSION = 'private-canonical-provider-candidate-v2' as const
const OUTPUT_SET_V2_VERSION =
  'private-canonical-provider-candidate-output-set-v2' as const
const METADATA_V3_VERSION = 'private-canonical-provider-candidate-v3' as const
const OUTPUT_SET_V3_VERSION =
  'private-canonical-provider-candidate-output-set-v3' as const
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

const privateCanonicalProviderCandidateMetadataV2Schema = z.object({
  schemaVersion: z.literal(METADATA_V2_VERSION),
  objectIdentity: z.object({
    domain: z.literal('reeditpro:private-provider-candidate-object:v2'),
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
    outputOrdinal: z.union([z.literal(0), z.literal(1)]),
    role: z.enum([
      'provider_storytelling_speech_audio_mp3',
      'provider_storytelling_speech_alignment_json',
    ]),
    contentSha256: sha256,
    byteLength: z.number().int().positive().max(16_777_216),
    mimeType: z.enum(['audio/mpeg', 'application/json']),
    providerGenerated: z.literal(false),
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
    rawAlignmentBrowserReadable: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  output: canonicalPrivateProviderOutputV2Schema,
  artifactEvidenceDigest: sha256,
}).strict()

const privateCanonicalProviderCandidateOutputSetV2Schema = z.object({
  schemaVersion: z.literal(OUTPUT_SET_V2_VERSION),
  authorizationHash: sha256,
  dispatchAttemptHash: sha256,
  expectedOutputSetHash: sha256,
  outputIds: z.tuple([identity, identity]),
  outputIdentityHashes: z.tuple([sha256, sha256]),
  outputContentHashes: z.tuple([sha256, sha256]),
  outputSetDigest: sha256,
  createdAt: timestamp,
}).strict()

const privateCanonicalProviderCandidateMetadataV3Schema = z.object({
  schemaVersion: z.literal(METADATA_V3_VERSION),
  objectIdentity: z.object({
    domain: z.literal('reeditpro:private-provider-candidate-object:v3'),
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
    outputOrdinal: z.literal(0),
    role: z.literal('provider_synchronized_audio_mp4'),
    contentSha256: sha256,
    byteLength: z.number().int().positive().max(67_108_864),
    mimeType: z.literal('video/mp4'),
    providerGenerated: z.literal(false),
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
    normalizationPending: z.literal(true),
    selectionAllowed: z.literal(false),
    timelineMutationAllowed: z.literal(false),
    renderOrExportAllowed: z.literal(false),
    publicDeliveryAllowed: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  output: canonicalPrivateProviderOutputV3Schema,
  artifactEvidenceDigest: sha256,
}).strict()

const privateCanonicalProviderCandidateOutputSetV3Schema = z.object({
  schemaVersion: z.literal(OUTPUT_SET_V3_VERSION),
  authorizationHash: sha256,
  dispatchAttemptHash: sha256,
  expectedOutputSetHash: sha256,
  outputIds: z.tuple([identity]),
  outputIdentityHashes: z.tuple([sha256]),
  outputContentHashes: z.tuple([sha256]),
  outputSetDigest: sha256,
  createdAt: timestamp,
}).strict()

export interface VerifiedPrivateCanonicalProviderCandidateReadback {
  output: CanonicalPrivateProviderOutput
  providerGenerated: boolean
  storageEvidenceHash: string
  sourceReadbackEvidenceHash: string
}

export interface VerifiedPrivateCanonicalProviderCandidateReadbackV2 {
  output: CanonicalPrivateProviderOutputV2
  providerGenerated: false
  storageEvidenceHash: string
  sourceReadbackEvidenceHash: string
}

export interface VerifiedPrivateCanonicalProviderCandidateProcessingReadV2 {
  readback: VerifiedPrivateCanonicalProviderCandidateReadbackV2
  bytes: Buffer
}

export interface VerifiedPrivateCanonicalProviderCandidateReadbackV3 {
  output: CanonicalPrivateProviderOutputV3
  providerGenerated: false
  storageEvidenceHash: string
  sourceReadbackEvidenceHash: string
}

export interface VerifiedPrivateCanonicalProviderCandidateProcessingReadV3 {
  readback: VerifiedPrivateCanonicalProviderCandidateReadbackV3
  bytes: Buffer
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

export async function persistPrivateCanonicalProviderCandidateSetV2(input: {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorizationV2
  dispatchAttempt: CanonicalPrivateProviderDispatchAttempt
  outputs: readonly [
    {
      outputId: string
      role: 'provider_storytelling_speech_audio_mp3'
      mimeType: 'audio/mpeg'
      bytes: Buffer | Uint8Array
    },
    {
      outputId: string
      role: 'provider_storytelling_speech_alignment_json'
      mimeType: 'application/json'
      bytes: Buffer | Uint8Array
    },
  ]
  providerGenerated: false
  createdAt: string
}): Promise<{
  outputs: readonly [
    CanonicalPrivateProviderOutputV2,
    CanonicalPrivateProviderOutputV2,
  ]
  outputSetDigest: string
  idempotencyStatus:
    | 'inserted'
    | 'duplicate_returned'
    | 'recovered_partial_exact_replay'
}> {
  const createdAt = canonicalTimestamp(input.createdAt)
  const profile = resolveCanonicalProviderOperationV2(
    input.authorization.operationId,
  )
  if (
    input.dispatchAttempt.authorizationHash !== input.authorization.authorityHash ||
    Date.parse(createdAt) < Date.parse(input.dispatchAttempt.consumedAt) ||
    Date.parse(createdAt) > Date.parse(input.authorization.expiresAt) ||
    input.providerGenerated !== false ||
    input.outputs.some((output, index) =>
      output.outputId !== input.authorization.expectedOutputIds[index] ||
      output.role !== profile.expectedOutputs[index]?.role ||
      output.mimeType !== profile.expectedOutputs[index]?.contentType)
  ) throw invalid('Provider Speech candidate set lost exact V2 attempt authority.')

  const prepared = input.outputs.map((rawOutput, outputOrdinal) => {
    const bytes = Buffer.from(rawOutput.bytes)
    validateV2OutputBytes({
      role: rawOutput.role,
      mimeType: rawOutput.mimeType,
      bytes,
      maximumByteLength:
        profile.expectedOutputs[outputOrdinal]!.maximumByteLength,
    })
    const contentSha256 = sha256Bytes(bytes)
    const objectIdentity = {
      domain: 'reeditpro:private-provider-candidate-object:v2' as const,
      workspaceId: input.authorization.workspaceId,
      projectId: input.authorization.projectId,
      editSessionId: input.authorization.editSessionId,
      approvedPlanSnapshotId: input.authorization.approvedPlanSnapshotId,
      packageRecordId: input.authorization.packageRecordId,
      approvedWorkItemId: input.authorization.approvedWorkItemId,
      jobId: input.authorization.queueJobId,
      claimId: input.dispatchAttempt.queueClaimId,
      dispatchAttemptId: input.dispatchAttempt.dispatchAttemptId,
      expectedOutputId: rawOutput.outputId,
      outputOrdinal: outputOrdinal as 0 | 1,
      role: rawOutput.role,
      contentSha256,
      byteLength: bytes.byteLength,
      mimeType: rawOutput.mimeType,
      providerGenerated: false as const,
    }
    const privateObjectIdentityHash = sha256AuthorityValue(objectIdentity)
    const assetId = `provider_asset_v2_${privateObjectIdentityHash.slice(0, 37)}`
    const assetVersionId =
      `provider_asset_version_v2_${privateObjectIdentityHash.slice(0, 29)}`
    const metadata = {
      schemaVersion: METADATA_V2_VERSION,
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
        rawAlignmentBrowserReadable: false as const,
      },
      createdAt,
    }
    const artifactEvidenceDigest = sha256AuthorityValue(metadata)
    const output = canonicalPrivateProviderOutputV2Schema.parse({
      outputId: rawOutput.outputId,
      role: rawOutput.role,
      assetId,
      assetVersionId,
      privateObjectIdentityHash,
      contentSha256,
      byteLength: bytes.byteLength,
      mimeType: rawOutput.mimeType,
      createOnly: true,
      checksumReadbackVerified: true,
      providerUrlPersisted: false,
      localPathProjected: false,
      browserReadable: false,
      artifactEvidenceDigest,
    })
    const metadataBytes = Buffer.from(`${stableAuthorityStringify({
      ...metadata,
      output,
      artifactEvidenceDigest,
    })}\n`, 'utf8')
    return { bytes, metadataBytes, output }
  }) as [
    {
      bytes: Buffer
      metadataBytes: Buffer
      output: CanonicalPrivateProviderOutputV2
    },
    {
      bytes: Buffer
      metadataBytes: Buffer
      output: CanonicalPrivateProviderOutputV2
    },
  ]
  const outputSetPayload = {
    schemaVersion: OUTPUT_SET_V2_VERSION,
    authorizationHash: input.authorization.authorityHash,
    dispatchAttemptHash: input.dispatchAttempt.attemptHash,
    expectedOutputSetHash: input.authorization.expectedOutputSetHash,
    outputIds: prepared.map((item) => item.output.outputId) as [string, string],
    outputIdentityHashes: prepared.map((item) =>
      item.output.privateObjectIdentityHash) as [string, string],
    outputContentHashes: prepared.map((item) =>
      item.output.contentSha256) as [string, string],
    createdAt,
  }
  const outputSetDigest = sha256AuthorityValue(outputSetPayload)
  const outputSet = privateCanonicalProviderCandidateOutputSetV2Schema.parse({
    ...outputSetPayload,
    outputSetDigest,
  })
  const createStates: boolean[] = []
  for (const item of prepared) {
    const paths = candidatePathsV2(
      input.authorization,
      item.output.privateObjectIdentityHash,
    )
    const objectWrite = await writePrivateFileCreateOnlyWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: paths.object,
      content: item.bytes,
    })
    const metadataWrite = await writePrivateFileCreateOnlyWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: paths.metadata,
      content: item.metadataBytes,
    })
    createStates.push(objectWrite.created, metadataWrite.created)
    if (objectWrite.created !== metadataWrite.created) {
      // An exact retry may safely finish a crash-interrupted pair; the full
      // readback below is the authority and rejects every non-identical file.
      createStates.push(false, true)
    }
  }
  const setBytes = Buffer.from(`${stableAuthorityStringify(outputSet)}\n`, 'utf8')
  const setWrite = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: candidateOutputSetPathV2(
      input.authorization,
      input.dispatchAttempt.attemptHash,
    ),
    content: setBytes,
  })
  createStates.push(setWrite.created)
  const verified = await readVerifiedPrivateCanonicalProviderCandidateSetV2({
    localStorageRoot: input.localStorageRoot,
    authorization: input.authorization,
    dispatchAttempt: input.dispatchAttempt,
    outputs: prepared.map((item) => item.output) as [
      CanonicalPrivateProviderOutputV2,
      CanonicalPrivateProviderOutputV2,
    ],
    outputSetDigest,
  })
  const allCreated = createStates.every(Boolean)
  const noneCreated = createStates.every((value) => !value)
  return {
    outputs: [verified[0].output, verified[1].output],
    outputSetDigest,
    idempotencyStatus: allCreated
      ? 'inserted'
      : noneCreated
        ? 'duplicate_returned'
        : 'recovered_partial_exact_replay',
  }
}

export async function readVerifiedPrivateCanonicalProviderCandidateSetV2(input: {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorizationV2
  dispatchAttempt: CanonicalPrivateProviderDispatchAttempt
  outputs: readonly [
    CanonicalPrivateProviderOutputV2,
    CanonicalPrivateProviderOutputV2,
  ]
  outputSetDigest: string
}): Promise<readonly [
  VerifiedPrivateCanonicalProviderCandidateReadbackV2,
  VerifiedPrivateCanonicalProviderCandidateReadbackV2,
]> {
  if (
    input.dispatchAttempt.authorizationHash !== input.authorization.authorityHash ||
    input.outputs.some((output, index) =>
      output.outputId !== input.authorization.expectedOutputIds[index])
  ) throw invalid('Provider Speech candidate readback lost exact V2 lineage.')
  const setBytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: candidateOutputSetPathV2(
      input.authorization,
      input.dispatchAttempt.attemptHash,
    ),
  })
  if (!setBytes || setBytes.byteLength > 64 * 1024) {
    throw invalid('Private provider candidate V2 output-set manifest is missing.')
  }
  let decodedSet: unknown
  try {
    decodedSet = JSON.parse(setBytes.toString('utf8'))
  } catch {
    throw invalid('Private provider candidate V2 output-set manifest is invalid JSON.')
  }
  const outputSet = privateCanonicalProviderCandidateOutputSetV2Schema.parse(
    decodedSet,
  )
  const { outputSetDigest, ...outputSetPayload } = outputSet
  if (
    outputSetDigest !== sha256AuthorityValue(outputSetPayload) ||
    outputSetDigest !== input.outputSetDigest ||
    outputSet.authorizationHash !== input.authorization.authorityHash ||
    outputSet.dispatchAttemptHash !== input.dispatchAttempt.attemptHash ||
    outputSet.expectedOutputSetHash !== input.authorization.expectedOutputSetHash
  ) throw invalid('Private provider candidate V2 output-set integrity changed.')

  const verified: VerifiedPrivateCanonicalProviderCandidateReadbackV2[] = []
  for (const [index, rawOutput] of input.outputs.entries()) {
    const output = canonicalPrivateProviderOutputV2Schema.parse(rawOutput)
    const paths = candidatePathsV2(
      input.authorization,
      output.privateObjectIdentityHash,
    )
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
    if (!bytes || !metadataBytes || metadataBytes.byteLength > 64 * 1024) {
      throw invalid('Private provider candidate V2 readback is missing or oversized.')
    }
    validateV2OutputBytes({
      role: output.role,
      mimeType: output.mimeType,
      bytes,
      maximumByteLength: output.role ===
        'provider_storytelling_speech_audio_mp3'
        ? 16_777_216
        : 1_048_576,
    })
    let decodedMetadata: unknown
    try {
      decodedMetadata = JSON.parse(metadataBytes.toString('utf8'))
    } catch {
      throw invalid('Private provider candidate V2 metadata is invalid JSON.')
    }
    const metadata = privateCanonicalProviderCandidateMetadataV2Schema.parse(
      decodedMetadata,
    )
    const { output: storedOutput, artifactEvidenceDigest, ...evidenceMetadata } =
      metadata
    const expectedObjectHash = sha256AuthorityValue(metadata.objectIdentity)
    const contentSha256 = sha256Bytes(bytes)
    if (
      stableAuthorityStringify(storedOutput) !== stableAuthorityStringify(output) ||
      artifactEvidenceDigest !== sha256AuthorityValue(evidenceMetadata) ||
      artifactEvidenceDigest !== output.artifactEvidenceDigest ||
      expectedObjectHash !== output.privateObjectIdentityHash ||
      metadata.privateObjectIdentityHash !== output.privateObjectIdentityHash ||
      metadata.assetId !== output.assetId ||
      metadata.assetVersionId !== output.assetVersionId ||
      metadata.objectIdentity.workspaceId !== input.authorization.workspaceId ||
      metadata.objectIdentity.projectId !== input.authorization.projectId ||
      metadata.objectIdentity.editSessionId !== input.authorization.editSessionId ||
      metadata.objectIdentity.approvedPlanSnapshotId !==
        input.authorization.approvedPlanSnapshotId ||
      metadata.objectIdentity.packageRecordId !==
        input.authorization.packageRecordId ||
      metadata.objectIdentity.approvedWorkItemId !==
        input.authorization.approvedWorkItemId ||
      metadata.objectIdentity.jobId !== input.authorization.queueJobId ||
      metadata.objectIdentity.claimId !== input.dispatchAttempt.queueClaimId ||
      metadata.objectIdentity.dispatchAttemptId !==
        input.dispatchAttempt.dispatchAttemptId ||
      metadata.objectIdentity.expectedOutputId !==
        input.authorization.expectedOutputIds[index] ||
      metadata.objectIdentity.outputOrdinal !== index ||
      metadata.objectIdentity.contentSha256 !== contentSha256 ||
      contentSha256 !== output.contentSha256 ||
      bytes.byteLength !== output.byteLength ||
      outputSet.outputIds[index] !== output.outputId ||
      outputSet.outputIdentityHashes[index] !== output.privateObjectIdentityHash ||
      outputSet.outputContentHashes[index] !== output.contentSha256 ||
      Date.parse(metadata.createdAt) < Date.parse(input.dispatchAttempt.consumedAt) ||
      Date.parse(metadata.createdAt) > Date.parse(input.authorization.expiresAt)
    ) throw invalid('Private provider candidate V2 readback integrity changed.')
    const storageEvidenceHash = sha256AuthorityValue({
      objectContentSha256: contentSha256,
      metadataContentSha256: sha256Bytes(metadataBytes),
      artifactEvidenceDigest,
      outputSetDigest,
    })
    verified.push({
      output,
      providerGenerated: false,
      storageEvidenceHash,
      sourceReadbackEvidenceHash: sha256AuthorityValue({
        domain: 'reeditpro:private-provider-candidate-source-readback:v2',
        authorizationHash: input.authorization.authorityHash,
        dispatchAttemptHash: input.dispatchAttempt.attemptHash,
        output,
        storageEvidenceHash,
        outputSetDigest,
      }),
    })
  }
  return [verified[0]!, verified[1]!]
}

/**
 * Server-only bounded processing read. It first runs the complete immutable
 * output-set/readback verification above, then reopens the exact content-
 * addressed objects and verifies their commitments again. This API is never
 * mounted in a route and must not be projected to a browser.
 */
export async function readVerifiedPrivateCanonicalProviderCandidateSetForProcessingV2(
  input: Parameters<typeof readVerifiedPrivateCanonicalProviderCandidateSetV2>[0],
): Promise<readonly [
  VerifiedPrivateCanonicalProviderCandidateProcessingReadV2,
  VerifiedPrivateCanonicalProviderCandidateProcessingReadV2,
]> {
  const readbacks = await readVerifiedPrivateCanonicalProviderCandidateSetV2(input)
  const processed: VerifiedPrivateCanonicalProviderCandidateProcessingReadV2[] = []
  for (const readback of readbacks) {
    const paths = candidatePathsV2(
      input.authorization,
      readback.output.privateObjectIdentityHash,
    )
    const bytes = await readPrivateFileIfExistsWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: paths.object,
    })
    if (
      !bytes || bytes.byteLength !== readback.output.byteLength ||
      sha256Bytes(bytes) !== readback.output.contentSha256
    ) throw invalid('Provider Speech processing bytes changed after verified readback.')
    validateV2OutputBytes({
      role: readback.output.role,
      mimeType: readback.output.mimeType,
      bytes,
      maximumByteLength: readback.output.role ===
        'provider_storytelling_speech_audio_mp3'
        ? 16_777_216
        : 1_048_576,
    })
    processed.push({ readback, bytes })
  }
  return [processed[0]!, processed[1]!]
}

export async function persistPrivateCanonicalProviderCandidateV3(input: {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorizationV3
  dispatchAttempt: CanonicalPrivateProviderDispatchAttempt
  output: {
    outputId: string
    role: 'provider_synchronized_audio_mp4'
    mimeType: 'video/mp4'
    bytes: Buffer | Uint8Array
  }
  providerGenerated: false
  createdAt: string
}): Promise<{
  output: CanonicalPrivateProviderOutputV3
  outputSetDigest: string
  idempotencyStatus:
    | 'inserted'
    | 'duplicate_returned'
    | 'recovered_partial_exact_replay'
}> {
  const createdAt = canonicalTimestamp(input.createdAt)
  const profile = resolveCanonicalProviderOperationV3(
    input.authorization.operationId,
  )
  const bytes = Buffer.from(input.output.bytes)
  validateV3OutputBytes(bytes, profile.expectedOutput.maximumByteLength)
  if (
    input.dispatchAttempt.authorizationHash !== input.authorization.authorityHash ||
    Date.parse(createdAt) < Date.parse(input.dispatchAttempt.consumedAt) ||
    Date.parse(createdAt) > Date.parse(input.authorization.expiresAt) ||
    input.providerGenerated !== false ||
    input.output.outputId !== input.authorization.expectedOutputId ||
    input.output.role !== profile.expectedOutput.role ||
    input.output.mimeType !== profile.expectedOutput.contentType
  ) throw invalid('Synchronized-Foley candidate lost exact V3 attempt authority.')
  const contentSha256 = sha256Bytes(bytes)
  const objectIdentity = {
    domain: 'reeditpro:private-provider-candidate-object:v3' as const,
    workspaceId: input.authorization.workspaceId,
    projectId: input.authorization.projectId,
    editSessionId: input.authorization.editSessionId,
    approvedPlanSnapshotId: input.authorization.approvedPlanSnapshotId,
    packageRecordId: input.authorization.packageRecordId,
    approvedWorkItemId: input.authorization.approvedWorkItemId,
    jobId: input.authorization.queueJobId,
    claimId: input.dispatchAttempt.queueClaimId,
    dispatchAttemptId: input.dispatchAttempt.dispatchAttemptId,
    expectedOutputId: input.output.outputId,
    outputOrdinal: 0 as const,
    role: input.output.role,
    contentSha256,
    byteLength: bytes.byteLength,
    mimeType: input.output.mimeType,
    providerGenerated: false as const,
  }
  const privateObjectIdentityHash = sha256AuthorityValue(objectIdentity)
  const assetId = `provider_asset_v3_${privateObjectIdentityHash.slice(0, 37)}`
  const assetVersionId =
    `provider_asset_version_v3_${privateObjectIdentityHash.slice(0, 29)}`
  const metadata = {
    schemaVersion: METADATA_V3_VERSION,
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
      normalizationPending: true as const,
      selectionAllowed: false as const,
      timelineMutationAllowed: false as const,
      renderOrExportAllowed: false as const,
      publicDeliveryAllowed: false as const,
    },
    createdAt,
  }
  const artifactEvidenceDigest = sha256AuthorityValue(metadata)
  const output = canonicalPrivateProviderOutputV3Schema.parse({
    outputId: input.output.outputId,
    role: input.output.role,
    assetId,
    assetVersionId,
    privateObjectIdentityHash,
    contentSha256,
    byteLength: bytes.byteLength,
    mimeType: input.output.mimeType,
    createOnly: true,
    checksumReadbackVerified: true,
    providerUrlPersisted: false,
    localPathProjected: false,
    browserReadable: false,
    artifactEvidenceDigest,
  })
  const metadataBytes = Buffer.from(`${stableAuthorityStringify({
    ...metadata,
    output,
    artifactEvidenceDigest,
  })}\n`, 'utf8')
  const outputSetPayload = {
    schemaVersion: OUTPUT_SET_V3_VERSION,
    authorizationHash: input.authorization.authorityHash,
    dispatchAttemptHash: input.dispatchAttempt.attemptHash,
    expectedOutputSetHash: input.authorization.expectedOutputSetHash,
    outputIds: [output.outputId] as [string],
    outputIdentityHashes: [output.privateObjectIdentityHash] as [string],
    outputContentHashes: [output.contentSha256] as [string],
    createdAt,
  }
  const outputSetDigest = sha256AuthorityValue(outputSetPayload)
  const outputSet = privateCanonicalProviderCandidateOutputSetV3Schema.parse({
    ...outputSetPayload,
    outputSetDigest,
  })
  const paths = candidatePathsV3(
    input.authorization,
    output.privateObjectIdentityHash,
  )
  const [objectWrite, metadataWrite, setWrite] = await Promise.all([
    writePrivateFileCreateOnlyWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: paths.object,
      content: bytes,
    }),
    writePrivateFileCreateOnlyWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: paths.metadata,
      content: metadataBytes,
    }),
    writePrivateFileCreateOnlyWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: candidateOutputSetPathV3(
        input.authorization,
        input.dispatchAttempt.attemptHash,
      ),
      content: Buffer.from(`${stableAuthorityStringify(outputSet)}\n`, 'utf8'),
    }),
  ])
  const verified = await readVerifiedPrivateCanonicalProviderCandidateV3({
    localStorageRoot: input.localStorageRoot,
    authorization: input.authorization,
    dispatchAttempt: input.dispatchAttempt,
    output,
    outputSetDigest,
  })
  const createStates = [objectWrite.created, metadataWrite.created, setWrite.created]
  return {
    output: verified.output,
    outputSetDigest,
    idempotencyStatus: createStates.every(Boolean)
      ? 'inserted'
      : createStates.every((value) => !value)
        ? 'duplicate_returned'
        : 'recovered_partial_exact_replay',
  }
}

export async function readVerifiedPrivateCanonicalProviderCandidateV3(input: {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorizationV3
  dispatchAttempt: CanonicalPrivateProviderDispatchAttempt
  output: CanonicalPrivateProviderOutputV3
  outputSetDigest: string
}): Promise<VerifiedPrivateCanonicalProviderCandidateReadbackV3> {
  const output = canonicalPrivateProviderOutputV3Schema.parse(input.output)
  if (
    input.dispatchAttempt.authorizationHash !== input.authorization.authorityHash ||
    output.outputId !== input.authorization.expectedOutputId
  ) throw invalid('Synchronized-Foley readback lost exact V3 lineage.')
  const setBytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: candidateOutputSetPathV3(
      input.authorization,
      input.dispatchAttempt.attemptHash,
    ),
  })
  if (!setBytes || setBytes.byteLength > 64 * 1024) {
    throw invalid('Synchronized-Foley output-set manifest is missing.')
  }
  let decodedSet: unknown
  try {
    decodedSet = JSON.parse(setBytes.toString('utf8'))
  } catch {
    throw invalid('Synchronized-Foley output-set manifest is invalid JSON.')
  }
  const outputSet = privateCanonicalProviderCandidateOutputSetV3Schema.parse(
    decodedSet,
  )
  const { outputSetDigest, ...outputSetPayload } = outputSet
  if (
    outputSetDigest !== sha256AuthorityValue(outputSetPayload) ||
    outputSetDigest !== input.outputSetDigest ||
    outputSet.authorizationHash !== input.authorization.authorityHash ||
    outputSet.dispatchAttemptHash !== input.dispatchAttempt.attemptHash ||
    outputSet.expectedOutputSetHash !== input.authorization.expectedOutputSetHash ||
    outputSet.outputIds[0] !== output.outputId ||
    outputSet.outputIdentityHashes[0] !== output.privateObjectIdentityHash ||
    outputSet.outputContentHashes[0] !== output.contentSha256
  ) throw invalid('Synchronized-Foley output-set integrity changed.')
  const paths = candidatePathsV3(
    input.authorization,
    output.privateObjectIdentityHash,
  )
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
  if (!bytes || !metadataBytes || metadataBytes.byteLength > 64 * 1024) {
    throw invalid('Synchronized-Foley private output readback is missing or oversized.')
  }
  validateV3OutputBytes(bytes, 67_108_864)
  let decodedMetadata: unknown
  try {
    decodedMetadata = JSON.parse(metadataBytes.toString('utf8'))
  } catch {
    throw invalid('Synchronized-Foley private metadata is invalid JSON.')
  }
  const metadata = privateCanonicalProviderCandidateMetadataV3Schema.parse(
    decodedMetadata,
  )
  const { output: storedOutput, artifactEvidenceDigest, ...evidenceMetadata } =
    metadata
  const contentSha256 = sha256Bytes(bytes)
  if (
    stableAuthorityStringify(storedOutput) !== stableAuthorityStringify(output) ||
    artifactEvidenceDigest !== sha256AuthorityValue(evidenceMetadata) ||
    artifactEvidenceDigest !== output.artifactEvidenceDigest ||
    sha256AuthorityValue(metadata.objectIdentity) !==
      output.privateObjectIdentityHash ||
    metadata.privateObjectIdentityHash !== output.privateObjectIdentityHash ||
    metadata.assetId !== output.assetId ||
    metadata.assetVersionId !== output.assetVersionId ||
    metadata.objectIdentity.workspaceId !== input.authorization.workspaceId ||
    metadata.objectIdentity.projectId !== input.authorization.projectId ||
    metadata.objectIdentity.editSessionId !== input.authorization.editSessionId ||
    metadata.objectIdentity.approvedPlanSnapshotId !==
      input.authorization.approvedPlanSnapshotId ||
    metadata.objectIdentity.packageRecordId !== input.authorization.packageRecordId ||
    metadata.objectIdentity.approvedWorkItemId !==
      input.authorization.approvedWorkItemId ||
    metadata.objectIdentity.jobId !== input.authorization.queueJobId ||
    metadata.objectIdentity.claimId !== input.dispatchAttempt.queueClaimId ||
    metadata.objectIdentity.dispatchAttemptId !==
      input.dispatchAttempt.dispatchAttemptId ||
    metadata.objectIdentity.expectedOutputId !==
      input.authorization.expectedOutputId ||
    metadata.objectIdentity.contentSha256 !== contentSha256 ||
    contentSha256 !== output.contentSha256 ||
    bytes.byteLength !== output.byteLength ||
    Date.parse(metadata.createdAt) < Date.parse(input.dispatchAttempt.consumedAt) ||
    Date.parse(metadata.createdAt) > Date.parse(input.authorization.expiresAt)
  ) throw invalid('Synchronized-Foley private output readback integrity changed.')
  const storageEvidenceHash = sha256AuthorityValue({
    objectContentSha256: contentSha256,
    metadataContentSha256: sha256Bytes(metadataBytes),
    artifactEvidenceDigest,
    outputSetDigest,
  })
  return {
    output,
    providerGenerated: false,
    storageEvidenceHash,
    sourceReadbackEvidenceHash: sha256AuthorityValue({
      domain: 'reeditpro:private-provider-candidate-source-readback:v3',
      authorizationHash: input.authorization.authorityHash,
      dispatchAttemptHash: input.dispatchAttempt.attemptHash,
      output,
      storageEvidenceHash,
      outputSetDigest,
    }),
  }
}

export async function readVerifiedPrivateCanonicalProviderCandidateForProcessingV3(
  input: Parameters<typeof readVerifiedPrivateCanonicalProviderCandidateV3>[0],
): Promise<VerifiedPrivateCanonicalProviderCandidateProcessingReadV3> {
  const readback = await readVerifiedPrivateCanonicalProviderCandidateV3(input)
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: candidatePathsV3(
      input.authorization,
      readback.output.privateObjectIdentityHash,
    ).object,
  })
  if (
    !bytes || bytes.byteLength !== readback.output.byteLength ||
    sha256Bytes(bytes) !== readback.output.contentSha256
  ) throw invalid('Synchronized-Foley processing bytes changed after readback.')
  validateV3OutputBytes(bytes, 67_108_864)
  return { readback, bytes }
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

function candidatePathsV2(
  authorization: CanonicalProviderWorkAuthorizationV2,
  privateObjectIdentityHash: string,
): { object: string; metadata: string } {
  const tenantHash = sha256Text(
    `${authorization.ownerUserId}\u0000${authorization.workspaceId}`,
  ).slice(0, 32)
  const prefix = `private-internal/provider-candidates/v2/${tenantHash}/${authorization.projectId}/${authorization.editSessionId}`
  return {
    object: `${prefix}/${privateObjectIdentityHash}.bin`,
    metadata: `${prefix}/${privateObjectIdentityHash}.json`,
  }
}

function candidateOutputSetPathV2(
  authorization: CanonicalProviderWorkAuthorizationV2,
  dispatchAttemptHash: string,
): string {
  const tenantHash = sha256Text(
    `${authorization.ownerUserId}\u0000${authorization.workspaceId}`,
  ).slice(0, 32)
  return `private-internal/provider-candidates/v2/${tenantHash}/${authorization.projectId}/${authorization.editSessionId}/set-${dispatchAttemptHash}.json`
}

function candidatePathsV3(
  authorization: CanonicalProviderWorkAuthorizationV3,
  privateObjectIdentityHash: string,
): { object: string; metadata: string } {
  const tenantHash = sha256Text(
    `${authorization.ownerUserId}\u0000${authorization.workspaceId}`,
  ).slice(0, 32)
  const prefix = `private-internal/provider-candidates/v3/${tenantHash}/${authorization.projectId}/${authorization.editSessionId}`
  return {
    object: `${prefix}/${privateObjectIdentityHash}.mp4`,
    metadata: `${prefix}/${privateObjectIdentityHash}.json`,
  }
}

function candidateOutputSetPathV3(
  authorization: CanonicalProviderWorkAuthorizationV3,
  dispatchAttemptHash: string,
): string {
  const tenantHash = sha256Text(
    `${authorization.ownerUserId}\u0000${authorization.workspaceId}`,
  ).slice(0, 32)
  return `private-internal/provider-candidates/v3/${tenantHash}/${authorization.projectId}/${authorization.editSessionId}/set-${dispatchAttemptHash}.json`
}

function validateV2OutputBytes(input: {
  role: CanonicalPrivateProviderOutputV2['role']
  mimeType: CanonicalPrivateProviderOutputV2['mimeType']
  bytes: Buffer
  maximumByteLength: number
}): void {
  if (
    input.bytes.byteLength < 2 ||
    input.bytes.byteLength > input.maximumByteLength
  ) throw invalid('Provider Speech output exceeds its immutable byte boundary.')
  if (input.role === 'provider_storytelling_speech_audio_mp3') {
    const id3 = input.bytes.byteLength >= 3 &&
      input.bytes.subarray(0, 3).toString('ascii') === 'ID3'
    const frameSync = input.bytes[0] === 0xff &&
      ((input.bytes[1] ?? 0) & 0xe0) === 0xe0
    if (input.mimeType !== 'audio/mpeg' || (!id3 && !frameSync)) {
      throw invalid('Provider Speech audio is not a bounded MP3 object.')
    }
    return
  }
  if (input.mimeType !== 'application/json') {
    throw invalid('Provider Speech alignment must be private JSON.')
  }
  try {
    const decoded = JSON.parse(input.bytes.toString('utf8'))
    if (!decoded || typeof decoded !== 'object') {
      throw new Error('alignment is not an object')
    }
  } catch {
    throw invalid('Provider Speech alignment is not valid bounded JSON.')
  }
}

function validateV3OutputBytes(bytes: Buffer, maximumByteLength: number): void {
  if (
    bytes.byteLength < 12 || bytes.byteLength > maximumByteLength ||
    bytes.subarray(4, 8).toString('ascii') !== 'ftyp'
  ) throw invalid('Synchronized-Foley output is not a bounded MP4 object.')
  const declaredFirstBoxSize = bytes.readUInt32BE(0)
  if (declaredFirstBoxSize < 8 || declaredFirstBoxSize > bytes.byteLength) {
    throw invalid('Synchronized-Foley MP4 first-box boundary is invalid.')
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
