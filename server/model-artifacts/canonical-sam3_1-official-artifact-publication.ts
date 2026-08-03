import { z } from 'zod'

import {
  CANONICAL_SAM3_1_OPERATION_ID,
  assertCanonicalSam31SourceRuntimeCandidate,
  type CanonicalSam31SourceRuntimeCandidate,
} from './canonical-sam3_1-source-runtime-candidate'
import {
  assertCanonicalSam31AuthorizedTermsAcceptance,
  type CanonicalSam31AuthorizedTermsAcceptance,
} from './canonical-sam3_1-private-artifact-ingest'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_VERSION =
  'canonical-sam3_1-official-artifact-publication-receipt-v1' as const

const PROJECT_ID = 'reeditpro' as const
const MODEL_ARTIFACT_BUCKET =
  'reeditpro-production-reeditpro-model-artifacts' as const
const SOURCE_REPOSITORY =
  'https://github.com/facebookresearch/sam3.git' as const
const SOURCE_REVISION =
  '96914d2425f90a64f45ca977c2b5165418099543' as const
const SOURCE_BYTE_LENGTH = 73_605_120 as const
const SOURCE_SHA256 =
  '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a' as const
const CHECKPOINT_REPOSITORY = 'facebook/sam3.1' as const
const CHECKPOINT_REVISION =
  'daa63191845a41281374e725f4c9e51c7a824460' as const
const CHECKPOINT_FILE = 'sam3.1_multiplex.pt' as const
const SOURCE_PREFIX = 'private/model-artifacts/sam3_1/source/' as const
const CHECKPOINT_PREFIX =
  'private/model-artifacts/sam3_1/checkpoint/' as const

const safeId = z.string().trim().min(1).max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

export const canonicalSam31PrivateArtifactObjectCoordinateSchema = z.object({
  projectId: z.literal(PROJECT_ID),
  bucketName: z.literal(MODEL_ARTIFACT_BUCKET),
  objectName: z.string().min(1).max(1_024),
  generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  etag: z.string().min(1).max(512),
  byteLength: z.number().int().positive().safe(),
  sha256: rawSha256,
}).strict()

export type CanonicalSam31PrivateArtifactObjectCoordinate = z.infer<
  typeof canonicalSam31PrivateArtifactObjectCoordinateSchema
>

const publicationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_VERSION,
  ),
  source: z.literal(
    'canonical_weeditpro_sam3_1_official_artifact_publisher',
  ),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_publication',
  ]),
  status: z.enum([
    'contract_validated_only',
    'published_pending_security_license_and_compatibility_review',
  ]),
  publicationAttemptId: safeId,
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  candidateRef: evidenceRefSchema,
  termsAcceptanceRef: evidenceRefSchema,
  sourceArchive: z.object({
    repository: z.literal(SOURCE_REPOSITORY),
    revision: z.literal(SOURCE_REVISION),
    archiveFormat: z.literal('git_archive_tar_uncompressed'),
    coordinate: canonicalSam31PrivateArtifactObjectCoordinateSchema,
    officialPinnedSourceOnly: z.literal(true),
    expectedByteLengthAndSha256Enforced: z.boolean(),
    createOnlyWriteAndExactGenerationReread: z.literal(true),
  }).strict(),
  checkpoint: z.object({
    repository: z.literal(CHECKPOINT_REPOSITORY),
    revision: z.literal(CHECKPOINT_REVISION),
    fileName: z.literal(CHECKPOINT_FILE),
    coordinate: canonicalSam31PrivateArtifactObjectCoordinateSchema,
    officialGatedRepositoryOnly: z.literal(true),
    authorizedHumanTermsAcceptanceReread: z.boolean(),
    accessTokenReadFromPinnedSecretVersion: z.boolean(),
    accessTokenOrSignedRedirectPersistedOrReturned: z.literal(false),
    createOnlyWriteAndExactGenerationReread: z.literal(true),
  }).strict(),
  retryPolicy: z.object({
    automaticRetryAllowed: z.literal(false),
    uncertainNetworkOrStorageOutcomeRequiresReconciliation: z.literal(true),
    sameAttemptObjectReplacementAllowed: z.literal(false),
  }).strict(),
  runtimeBinding: z.object({
    officialArtifactStreamPortVersion: safeId,
    privateArtifactPublicationPortVersion: safeId,
  }).strict(),
  privateBoundary: z.object({
    developerMachineExecutionAllowed: z.literal(false),
    callerUrlPathOrBytesAccepted: z.literal(false),
    thirdPartyMirrorAccepted: z.literal(false),
    runtimeWorkerDownloadAllowed: z.literal(false),
    checkpointRedistributionAuthorized: z.literal(false),
    sourceOrCheckpointBytesIncludedInReceipt: z.literal(false),
  }).strict(),
  authority: z.object({
    artifactPublicationEvidenceOnly: z.literal(true),
    securityScanPassed: z.literal(false),
    licenseReviewApproved: z.literal(false),
    sourceCheckpointCompatibilityQualified: z.literal(false),
    imageBuildAuthorized: z.literal(false),
    gpuRuntimeAuthorized: z.literal(false),
    providerOrModelExecuted: z.literal(false),
    customerCreditsMutated: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  publishedAt: timestamp,
}).strict().superRefine((value, context) => {
  const canonical = value.evidenceClass === 'canonical_private_publication'
  const sourceObject = value.sourceArchive.coordinate.objectName
  const checkpointObject = value.checkpoint.coordinate.objectName
  if (
    !sourceObject.startsWith(SOURCE_PREFIX)
    || !sourceObject.endsWith(`sam3-${SOURCE_REVISION}.tar`)
    || !checkpointObject.startsWith(CHECKPOINT_PREFIX)
    || !checkpointObject.endsWith(`/${CHECKPOINT_FILE}`)
    || sourceObject.includes('..')
    || checkpointObject.includes('..')
    || sourceObject.includes('\\')
    || checkpointObject.includes('\\')
    || value.sourceArchive.coordinate.bucketName
      !== value.checkpoint.coordinate.bucketName
    || (canonical
      ? value.status
          !== 'published_pending_security_license_and_compatibility_review'
        || value.sourceArchive.coordinate.byteLength !== SOURCE_BYTE_LENGTH
        || value.sourceArchive.coordinate.sha256 !== SOURCE_SHA256
        || !value.sourceArchive.expectedByteLengthAndSha256Enforced
        || value.checkpoint.coordinate.byteLength < 3_000_000_000
        || value.checkpoint.coordinate.byteLength > 5_000_000_000
        || !value.checkpoint.authorizedHumanTermsAcceptanceReread
        || !value.checkpoint.accessTokenReadFromPinnedSecretVersion
        || value.runtimeBinding.officialArtifactStreamPortVersion
          !== 'canonical-sam3_1-official-artifact-stream-runtime-v1'
        || value.runtimeBinding.privateArtifactPublicationPortVersion
          !== 'canonical-sam3_1-gcs-official-artifact-publication-port-v1'
      : value.status !== 'contract_validated_only'
        || value.sourceArchive.expectedByteLengthAndSha256Enforced
        || value.checkpoint.authorizedHumanTermsAcceptanceReread
        || value.checkpoint.accessTokenReadFromPinnedSecretVersion)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 official artifact publication lineage is invalid.',
  })
})

export const canonicalSam31OfficialArtifactPublicationReceiptSchema =
  publicationWithoutHashSchema.extend({ publicationReceiptHash: rawSha256 })
    .strict()

export type CanonicalSam31OfficialArtifactPublicationReceipt = z.infer<
  typeof canonicalSam31OfficialArtifactPublicationReceiptSchema
>

export interface CanonicalSam31OfficialArtifactStreamPort {
  readonly schemaVersion: string
  openPinnedSourceArchive(input: {
    readonly repository: typeof SOURCE_REPOSITORY
    readonly revision: typeof SOURCE_REVISION
    readonly archiveFormat: 'git_archive_tar_uncompressed'
  }): Promise<{
    readonly contentType: 'application/x-tar'
    readonly body: AsyncIterable<Uint8Array>
  }>
  openPinnedCheckpoint(input: {
    readonly repository: typeof CHECKPOINT_REPOSITORY
    readonly revision: typeof CHECKPOINT_REVISION
    readonly fileName: typeof CHECKPOINT_FILE
    readonly termsAcceptanceRef: z.infer<typeof evidenceRefSchema>
  }): Promise<{
    readonly contentType: 'application/octet-stream'
    readonly body: AsyncIterable<Uint8Array>
    readonly accessTokenReadFromPinnedSecretVersion: boolean
  }>
}

export interface CanonicalSam31PrivateArtifactPublicationPort {
  readonly schemaVersion: string
  publishCreateOnlyAndReread(input: {
    readonly projectId: typeof PROJECT_ID
    readonly bucketName: typeof MODEL_ARTIFACT_BUCKET
    readonly objectName: string
    readonly contentType: 'application/x-tar' | 'application/octet-stream'
    readonly body: AsyncIterable<Uint8Array>
    readonly minimumByteLength: number
    readonly maximumByteLength: number
    readonly expectedByteLength?: number
    readonly expectedSha256?: string
  }): Promise<CanonicalSam31PrivateArtifactObjectCoordinate>
}

/**
 * Streams the exact official source archive and manually gated checkpoint into
 * private, create-only GCS objects. The publisher deliberately stops before
 * security, license, source/checkpoint compatibility, image-build, or runtime
 * authority. It is a cloud control-plane operator, never a developer install.
 */
export async function publishCanonicalSam31OfficialPrivateArtifacts(input: {
  readonly publicationAttemptId: string
  readonly evidenceClass:
    | 'synthetic_contract_fixture'
    | 'canonical_private_publication'
  readonly candidate: CanonicalSam31SourceRuntimeCandidate
  readonly termsAcceptance: CanonicalSam31AuthorizedTermsAcceptance
  readonly officialArtifactStreamPort:
    CanonicalSam31OfficialArtifactStreamPort
  readonly privateArtifactPublicationPort:
    CanonicalSam31PrivateArtifactPublicationPort
  readonly publishedAt: string
}): Promise<CanonicalSam31OfficialArtifactPublicationReceipt> {
  if (
    !input.officialArtifactStreamPort
    || typeof input.officialArtifactStreamPort.openPinnedSourceArchive
      !== 'function'
    || typeof input.officialArtifactStreamPort.openPinnedCheckpoint
      !== 'function'
    || !input.privateArtifactPublicationPort
    || typeof input.privateArtifactPublicationPort
      .publishCreateOnlyAndReread !== 'function'
  ) throw new Error('SAM 3.1 official artifact publisher is not configured.')
  const publicationAttemptId = safeId.parse(input.publicationAttemptId)
  const publishedAt = timestamp.parse(input.publishedAt)
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(input.candidate)
  const terms = assertCanonicalSam31AuthorizedTermsAcceptance(
    input.termsAcceptance,
  )
  const canonical = input.evidenceClass === 'canonical_private_publication'
  if (
    (canonical && terms.evidenceClass !== 'canonical_private_reread')
    || (!canonical && terms.evidenceClass !== 'synthetic_contract_fixture')
  ) throw new Error('SAM 3.1 publication and terms evidence classes differ.')
  const termsAcceptanceRef = evidenceRefSchema.parse({
    id: terms.acceptanceRecordId,
    version: terms.acceptanceRecordVersion,
    contentHash: `sha256:${terms.acceptanceRecordHash}`,
  })
  const attemptPath = `${publicationAttemptId}-${
    terms.acceptanceRecordHash.slice(0, 16)
  }`
  const sourceObjectName = `${SOURCE_PREFIX}${SOURCE_REVISION}/${
    attemptPath
  }/sam3-${SOURCE_REVISION}.tar`
  const checkpointObjectName = `${CHECKPOINT_PREFIX}${CHECKPOINT_REVISION}/${
    attemptPath
  }/${CHECKPOINT_FILE}`
  const source = await input.officialArtifactStreamPort
    .openPinnedSourceArchive({
      repository: SOURCE_REPOSITORY,
      revision: SOURCE_REVISION,
      archiveFormat: 'git_archive_tar_uncompressed',
    })
  const sourceCoordinate = await input.privateArtifactPublicationPort
    .publishCreateOnlyAndReread({
      projectId: PROJECT_ID,
      bucketName: MODEL_ARTIFACT_BUCKET,
      objectName: sourceObjectName,
      contentType: source.contentType,
      body: source.body,
      minimumByteLength: canonical ? SOURCE_BYTE_LENGTH : 1,
      maximumByteLength: canonical ? SOURCE_BYTE_LENGTH : 1024 * 1024,
      expectedByteLength: canonical ? SOURCE_BYTE_LENGTH : undefined,
      expectedSha256: canonical ? SOURCE_SHA256 : undefined,
    })
  const checkpoint = await input.officialArtifactStreamPort
    .openPinnedCheckpoint({
      repository: CHECKPOINT_REPOSITORY,
      revision: CHECKPOINT_REVISION,
      fileName: CHECKPOINT_FILE,
      termsAcceptanceRef,
    })
  if (canonical && !checkpoint.accessTokenReadFromPinnedSecretVersion) {
    throw new Error('SAM 3.1 checkpoint secret provenance is not canonical.')
  }
  const checkpointCoordinate = await input.privateArtifactPublicationPort
    .publishCreateOnlyAndReread({
      projectId: PROJECT_ID,
      bucketName: MODEL_ARTIFACT_BUCKET,
      objectName: checkpointObjectName,
      contentType: checkpoint.contentType,
      body: checkpoint.body,
      minimumByteLength: canonical ? 3_000_000_000 : 1,
      maximumByteLength: canonical ? 5_000_000_000 : 1024 * 1024,
    })
  const candidateRef = evidenceRefSchema.parse({
    id: `sam31-source-runtime-candidate-${candidate.candidateHash.slice(0, 24)}`,
    version: 1,
    contentHash: `sha256:${candidate.candidateHash}`,
  })
  const payload = publicationWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_VERSION,
    source: 'canonical_weeditpro_sam3_1_official_artifact_publisher',
    evidenceClass: input.evidenceClass,
    status: canonical
      ? 'published_pending_security_license_and_compatibility_review'
      : 'contract_validated_only',
    publicationAttemptId,
    operationId: candidate.operationId,
    candidateRef,
    termsAcceptanceRef,
    sourceArchive: {
      repository: SOURCE_REPOSITORY,
      revision: SOURCE_REVISION,
      archiveFormat: 'git_archive_tar_uncompressed',
      coordinate: sourceCoordinate,
      officialPinnedSourceOnly: true,
      expectedByteLengthAndSha256Enforced: canonical,
      createOnlyWriteAndExactGenerationReread: true,
    },
    checkpoint: {
      repository: CHECKPOINT_REPOSITORY,
      revision: CHECKPOINT_REVISION,
      fileName: CHECKPOINT_FILE,
      coordinate: checkpointCoordinate,
      officialGatedRepositoryOnly: true,
      authorizedHumanTermsAcceptanceReread: canonical,
      accessTokenReadFromPinnedSecretVersion: canonical,
      accessTokenOrSignedRedirectPersistedOrReturned: false,
      createOnlyWriteAndExactGenerationReread: true,
    },
    retryPolicy: {
      automaticRetryAllowed: false,
      uncertainNetworkOrStorageOutcomeRequiresReconciliation: true,
      sameAttemptObjectReplacementAllowed: false,
    },
    runtimeBinding: {
      officialArtifactStreamPortVersion:
        input.officialArtifactStreamPort.schemaVersion,
      privateArtifactPublicationPortVersion:
        input.privateArtifactPublicationPort.schemaVersion,
    },
    privateBoundary: {
      developerMachineExecutionAllowed: false,
      callerUrlPathOrBytesAccepted: false,
      thirdPartyMirrorAccepted: false,
      runtimeWorkerDownloadAllowed: false,
      checkpointRedistributionAuthorized: false,
      sourceOrCheckpointBytesIncludedInReceipt: false,
    },
    authority: {
      artifactPublicationEvidenceOnly: true,
      securityScanPassed: false,
      licenseReviewApproved: false,
      sourceCheckpointCompatibilityQualified: false,
      imageBuildAuthorized: false,
      gpuRuntimeAuthorized: false,
      providerOrModelExecuted: false,
      customerCreditsMutated: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
    publishedAt,
  })
  return Object.freeze(
    canonicalSam31OfficialArtifactPublicationReceiptSchema.parse({
      ...payload,
      publicationReceiptHash: sha256AuthorityValue(payload),
    }),
  )
}

export function assertCanonicalSam31OfficialArtifactPublicationReceipt(
  value: unknown,
): CanonicalSam31OfficialArtifactPublicationReceipt {
  const parsed = canonicalSam31OfficialArtifactPublicationReceiptSchema
    .parse(value)
  const { publicationReceiptHash, ...payload } = parsed
  if (publicationReceiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 official artifact publication hash is invalid.')
  }
  return parsed
}

export function canonicalSam31OfficialArtifactPublicationRef(
  value: unknown,
): {
  readonly id: string
  readonly version: 1
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_VERSION
  readonly contentHash: `sha256:${string}`
} {
  const receipt = assertCanonicalSam31OfficialArtifactPublicationReceipt(value)
  return Object.freeze({
    id: receipt.publicationAttemptId,
    version: 1,
    schemaVersion: receipt.schemaVersion,
    contentHash: `sha256:${receipt.publicationReceiptHash}`,
  })
}
