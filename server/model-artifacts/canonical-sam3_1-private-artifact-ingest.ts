import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_SAM3_1_OPERATION_ID,
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  assertCanonicalSam31SourceRuntimeCandidate,
  type CanonicalSam31SourceRuntimeCandidate,
} from './canonical-sam3_1-source-runtime-candidate'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_AUTHORIZED_TERMS_ACCEPTANCE_VERSION =
  'canonical-sam3_1-authorized-terms-acceptance-v1' as const
export const CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION =
  'canonical-sam3_1-private-artifact-ingest-receipt-v3' as const

const PROJECT_ID = 'reeditpro' as const
const MODEL_ARTIFACT_BUCKET =
  'reeditpro-production-reeditpro-model-artifacts' as const
const SOURCE_PREFIX = 'private/model-artifacts/sam3_1/source/' as const
const CHECKPOINT_PREFIX =
  'private/model-artifacts/sam3_1/checkpoint/' as const
const SOURCE_REPOSITORY =
  'https://github.com/facebookresearch/sam3.git' as const
const CHECKPOINT_REPOSITORY = 'facebook/sam3.1' as const
const CHECKPOINT_FILE = 'sam3.1_multiplex.pt' as const
const LICENSE_LAST_UPDATED = '2025-11-19' as const

const safeId = z.string().trim().min(1).max(240)
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
const objectCoordinateSchema = z.object({
  projectId: z.literal(PROJECT_ID),
  bucketName: z.literal(MODEL_ARTIFACT_BUCKET),
  objectName: z.string().min(1).max(1_024),
  generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  etag: z.string().min(1).max(512),
  byteLength: z.number().int().positive().safe(),
  sha256: rawSha256,
}).strict()

const termsWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_AUTHORIZED_TERMS_ACCEPTANCE_VERSION,
  ),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  acceptanceRecordId: safeId,
  acceptanceRecordVersion: z.number().int().positive().safe(),
  sourceRepository: z.literal(SOURCE_REPOSITORY),
  checkpointRepository: z.literal(CHECKPOINT_REPOSITORY),
  licenseIdentity: z.literal('SAM License'),
  licenseLastUpdated: z.literal(LICENSE_LAST_UPDATED),
  acceptanceSurface: z.literal('official_hugging_face_gated_repository'),
  repositoryGating: z.literal('manual'),
  acceptedAt: timestamp,
  acceptedByAuthorizedOrganizationRepresentative: z.literal(true),
  authorizedRepresentativeAuthorityRereadVerified: z.literal(true),
  contactInformationSharingAcceptedByAuthorizedHuman: z.literal(true),
  officialRepositoryAccessGrantedAndReread: z.literal(true),
  automatedAcceptanceUsed: z.literal(false),
  thirdPartyMirrorUsed: z.literal(false),
  approvedUseCase: z.literal(
    'private_commercial_video_editing_segmentation_and_tracking',
  ),
  militaryWarfareNuclearEspionageOrWeaponsUseAllowed: z.literal(false),
  legalReviewRef: evidenceRefSchema,
  privacyReviewRef: evidenceRefSchema,
  tradeControlsReviewRef: evidenceRefSchema,
  termsEvidenceRef: evidenceRefSchema,
  browserOrWorkerSecretIncluded: z.literal(false),
}).strict()

export const canonicalSam31AuthorizedTermsAcceptanceSchema =
  termsWithoutHashSchema.extend({ acceptanceRecordHash: rawSha256 }).strict()
export type CanonicalSam31AuthorizedTermsAcceptance = z.infer<
  typeof canonicalSam31AuthorizedTermsAcceptanceSchema
>

const ingestWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
  ),
  source: z.literal('canonical_sam3_1_private_artifact_ingest_owner'),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  status: z.enum([
    'contract_validated_only',
    'ready_for_immutable_image_build_review',
  ]),
  ingestReceiptId: safeId,
  ingestReceiptVersion: z.literal(1),
  candidateRef: z.object({
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    ),
    candidateHash: rawSha256,
  }).strict(),
  officialArtifactPublicationRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      'canonical-sam3_1-official-artifact-publication-receipt-v1',
    ),
    contentHash: prefixedSha256,
  }).strict(),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  termsAcceptanceRef: evidenceRefSchema,
  termsAcceptanceRecordHash: rawSha256,
  sourceArchive: z.object({
    repository: z.literal(SOURCE_REPOSITORY),
    revision: z.literal('96914d2425f90a64f45ca977c2b5165418099543'),
    archiveFormat: z.literal('git_archive_tar_uncompressed'),
    coordinate: objectCoordinateSchema,
    artifactRef: evidenceRefSchema,
    licenseRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
    unsignedSourceRevisionAcceptanceRef: evidenceRefSchema,
    exactStreamedByteLengthAndSha256Verified: z.literal(true),
    generationAndEtagStableBeforeAndAfterRead: z.literal(true),
    sourceRevisionSignatureVerified: z.literal(false),
    unsignedSourceRevisionAcceptedBySecurityReview: z.literal(true),
  }).strict(),
  checkpoint: z.object({
    repository: z.literal(CHECKPOINT_REPOSITORY),
    revision: z.literal('daa63191845a41281374e725f4c9e51c7a824460'),
    fileName: z.literal(CHECKPOINT_FILE),
    coordinate: objectCoordinateSchema,
    artifactRef: evidenceRefSchema,
    manifestRef: evidenceRefSchema,
    manifestBindsExactCoordinateShaAndLength: z.literal(true),
    licenseRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
    exactStreamedByteLengthAndSha256Verified: z.literal(true),
    generationAndEtagStableBeforeAndAfterRead: z.literal(true),
    torchWeightsOnlyLoadRequired: z.literal(true),
    executablePickleTrustGranted: z.literal(false),
  }).strict(),
  runtimeClosure: z.object({
    pythonVersion: z.literal('3.12'),
    torchVersion: z.literal('2.10.0'),
    torchvisionVersion: z.literal('0.25.0+cu128'),
    cudaVersion: z.literal('12.8'),
    fixedBuilder: z.literal('build_sam3_multiplex_video_predictor'),
    flashAttention3Enabled: z.literal(false),
    exactWheelNativeLibraryAndBaseImageClosureStillRequired: z.literal(true),
  }).strict(),
  privateBoundary: z.object({
    officialGatedCheckpointOnly: z.literal(true),
    thirdPartyMirrorAccepted: z.literal(false),
    runtimeNetworkDownloadAllowed: z.literal(false),
    callerCheckpointOrSourceBytesAccepted: z.literal(false),
    checkpointRedistributionAuthorized: z.literal(false),
    workerPayloadMayContainBucketObjectPathOrBytes: z.literal(false),
    canonicalImageBuildAuthorityRequiredBeforeImageBuild: z.literal(true),
  }).strict(),
  authority: z.object({
    artifactIngestEvidenceOnly: z.literal(true),
    canonicalTermsAcceptanceObserved: z.boolean(),
    exactSourceAndCheckpointReread: z.literal(true),
    imageBuildReviewEligible: z.boolean(),
    syntheticEvidenceMayAuthorizeBuild: z.literal(false),
    imageBuildStarted: z.literal(false),
    imageBuildAuthorizedByThisReceiptAlone: z.literal(false),
    runtimeExecuted: z.literal(false),
    workDispatched: z.literal(false),
    costOrCreditMutationCreated: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  preparedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    !value.sourceArchive.coordinate.objectName.startsWith(SOURCE_PREFIX)
    || !value.sourceArchive.coordinate.objectName.endsWith('.tar')
    || !value.checkpoint.coordinate.objectName.startsWith(CHECKPOINT_PREFIX)
    || !value.checkpoint.coordinate.objectName.endsWith(`/${CHECKPOINT_FILE}`)
    || value.sourceArchive.coordinate.bucketName !==
      value.checkpoint.coordinate.bucketName
    || value.sourceArchive.coordinate.sha256 !==
      value.sourceArchive.artifactRef.contentHash.slice('sha256:'.length)
    || value.checkpoint.coordinate.sha256 !==
      value.checkpoint.artifactRef.contentHash.slice('sha256:'.length)
    || (value.evidenceClass === 'canonical_private_reread'
      ? value.status !== 'ready_for_immutable_image_build_review'
        || !value.authority.canonicalTermsAcceptanceObserved
        || !value.authority.imageBuildReviewEligible
        || value.sourceArchive.coordinate.byteLength !== 73_605_120
        || value.sourceArchive.coordinate.sha256 !==
          '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a'
        || value.checkpoint.coordinate.byteLength < 3_000_000_000
        || value.checkpoint.coordinate.byteLength > 5_000_000_000
      : value.status !== 'contract_validated_only'
        || value.authority.canonicalTermsAcceptanceObserved
        || value.authority.imageBuildReviewEligible)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 ingest lost exact private source/checkpoint lineage.',
  })
})

export const canonicalSam31PrivateArtifactIngestReceiptSchema =
  ingestWithoutHashSchema.extend({ ingestReceiptHash: rawSha256 }).strict()
export type CanonicalSam31PrivateArtifactIngestReceipt = z.infer<
  typeof canonicalSam31PrivateArtifactIngestReceiptSchema
>

export interface CanonicalSam31PrivateObjectReadPort {
  readExact(input: z.infer<typeof objectCoordinateSchema>): Promise<{
    readonly generationBeforeRead: string
    readonly etagBeforeRead: string
    readonly contentType: string
    readonly body: Buffer | Uint8Array | AsyncIterable<Uint8Array>
    readonly generationAfterRead: string
    readonly etagAfterRead: string
    readonly rereadMetadataAfterBodyConsumed?: () => Promise<{
      readonly generationAfterRead: string
      readonly etagAfterRead: string
    }>
  } | null>
}

export function createCanonicalSam31AuthorizedTermsAcceptance(
  input: Omit<z.input<typeof termsWithoutHashSchema>, 'schemaVersion'>,
): CanonicalSam31AuthorizedTermsAcceptance {
  assertClosedPlainData(input, 'sam3_1_terms_acceptance')
  const payload = termsWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_AUTHORIZED_TERMS_ACCEPTANCE_VERSION,
    ...input,
  })
  return canonicalSam31AuthorizedTermsAcceptanceSchema.parse({
    ...payload,
    acceptanceRecordHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31AuthorizedTermsAcceptance(
  value: unknown,
): CanonicalSam31AuthorizedTermsAcceptance {
  const parsed = canonicalSam31AuthorizedTermsAcceptanceSchema.parse(value)
  const { acceptanceRecordHash, ...payload } = parsed
  if (acceptanceRecordHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 terms acceptance record hash is invalid.')
  }
  return parsed
}

export async function prepareCanonicalSam31PrivateArtifactIngestReceipt(
  input: {
    readonly ingestReceiptId: string
    readonly evidenceClass:
      | 'synthetic_contract_fixture'
      | 'canonical_private_reread'
    readonly candidate: CanonicalSam31SourceRuntimeCandidate
    readonly termsAcceptance: CanonicalSam31AuthorizedTermsAcceptance
    readonly officialArtifactPublicationRef: {
      readonly id: string
      readonly version: 1
      readonly schemaVersion:
        'canonical-sam3_1-official-artifact-publication-receipt-v1'
      readonly contentHash: string
    }
    readonly sourceArchiveCoordinate: z.infer<typeof objectCoordinateSchema>
    readonly sourceArchiveArtifactRef: z.input<typeof evidenceRefSchema>
    readonly sourceLicenseRef: z.input<typeof evidenceRefSchema>
    readonly sourceSecurityReviewRef: z.input<typeof evidenceRefSchema>
    readonly sourceMalwareScanRef: z.input<typeof evidenceRefSchema>
    readonly sourceUnsignedRevisionAcceptanceRef:
      z.input<typeof evidenceRefSchema>
    readonly checkpointCoordinate: z.infer<typeof objectCoordinateSchema>
    readonly checkpointArtifactRef: z.input<typeof evidenceRefSchema>
    readonly checkpointManifestRef: z.input<typeof evidenceRefSchema>
    readonly checkpointLicenseRef: z.input<typeof evidenceRefSchema>
    readonly checkpointSecurityReviewRef: z.input<typeof evidenceRefSchema>
    readonly checkpointMalwareScanRef: z.input<typeof evidenceRefSchema>
    readonly privateObjectReadPort: CanonicalSam31PrivateObjectReadPort
    readonly preparedAt: string
  },
): Promise<CanonicalSam31PrivateArtifactIngestReceipt> {
  assertClosedPlainData({ ...input, privateObjectReadPort: undefined },
    'sam3_1_artifact_ingest')
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(input.candidate)
  const terms = assertCanonicalSam31AuthorizedTermsAcceptance(
    input.termsAcceptance,
  )
  if (terms.evidenceClass !== input.evidenceClass) {
    throw new Error('SAM 3.1 terms and ingest evidence classes differ.')
  }
  const sourceCoordinate = objectCoordinateSchema.parse(
    input.sourceArchiveCoordinate,
  )
  const checkpointCoordinate = objectCoordinateSchema.parse(
    input.checkpointCoordinate,
  )
  const sourceRead = await verifyExactPrivateObject(
    sourceCoordinate,
    input.privateObjectReadPort,
    ['application/x-tar', 'application/octet-stream'],
    input.evidenceClass === 'canonical_private_reread',
  )
  const checkpointRead = await verifyExactPrivateObject(
    checkpointCoordinate,
    input.privateObjectReadPort,
    ['application/octet-stream'],
    input.evidenceClass === 'canonical_private_reread',
  )
  const payload = ingestWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
    source: 'canonical_sam3_1_private_artifact_ingest_owner',
    evidenceClass: input.evidenceClass,
    status: input.evidenceClass === 'canonical_private_reread'
      ? 'ready_for_immutable_image_build_review'
      : 'contract_validated_only',
    ingestReceiptId: input.ingestReceiptId,
    ingestReceiptVersion: 1,
    candidateRef: {
      schemaVersion: candidate.schemaVersion,
      candidateHash: candidate.candidateHash,
    },
    officialArtifactPublicationRef: input.officialArtifactPublicationRef,
    operationId: candidate.operationId,
    termsAcceptanceRef: {
      id: terms.acceptanceRecordId,
      version: terms.acceptanceRecordVersion,
      contentHash: `sha256:${terms.acceptanceRecordHash}`,
    },
    termsAcceptanceRecordHash: terms.acceptanceRecordHash,
    sourceArchive: {
      repository: SOURCE_REPOSITORY,
      revision: candidate.officialSource.sourceRevision,
      archiveFormat: candidate.officialSource.deterministicGitArchiveFormat,
      coordinate: sourceCoordinate,
      artifactRef: input.sourceArchiveArtifactRef,
      licenseRef: input.sourceLicenseRef,
      securityReviewRef: input.sourceSecurityReviewRef,
      malwareScanRef: input.sourceMalwareScanRef,
      unsignedSourceRevisionAcceptanceRef:
        input.sourceUnsignedRevisionAcceptanceRef,
      exactStreamedByteLengthAndSha256Verified: true,
      generationAndEtagStableBeforeAndAfterRead: sourceRead.stable,
      sourceRevisionSignatureVerified: false,
      unsignedSourceRevisionAcceptedBySecurityReview:
        Boolean(input.sourceUnsignedRevisionAcceptanceRef),
    },
    checkpoint: {
      repository: CHECKPOINT_REPOSITORY,
      revision: candidate.officialCheckpoint.repositoryRevision,
      fileName: CHECKPOINT_FILE,
      coordinate: checkpointCoordinate,
      artifactRef: input.checkpointArtifactRef,
      manifestRef: input.checkpointManifestRef,
      manifestBindsExactCoordinateShaAndLength: true,
      licenseRef: input.checkpointLicenseRef,
      securityReviewRef: input.checkpointSecurityReviewRef,
      malwareScanRef: input.checkpointMalwareScanRef,
      exactStreamedByteLengthAndSha256Verified: true,
      generationAndEtagStableBeforeAndAfterRead: checkpointRead.stable,
      torchWeightsOnlyLoadRequired: true,
      executablePickleTrustGranted: false,
    },
    runtimeClosure: {
      pythonVersion: candidate.runtimeClosure.candidatePythonVersion,
      torchVersion: candidate.runtimeClosure.candidateTorchVersion,
      torchvisionVersion:
        candidate.runtimeClosure.candidateTorchvisionVersion,
      cudaVersion: candidate.runtimeClosure.candidateCudaVersion,
      fixedBuilder: candidate.fixedApi.builder,
      flashAttention3Enabled: candidate.fixedApi.useFlashAttention3,
      exactWheelNativeLibraryAndBaseImageClosureStillRequired: true,
    },
    privateBoundary: {
      officialGatedCheckpointOnly: true,
      thirdPartyMirrorAccepted: false,
      runtimeNetworkDownloadAllowed: false,
      callerCheckpointOrSourceBytesAccepted: false,
      checkpointRedistributionAuthorized: false,
      workerPayloadMayContainBucketObjectPathOrBytes: false,
      canonicalImageBuildAuthorityRequiredBeforeImageBuild: true,
    },
    authority: {
      artifactIngestEvidenceOnly: true,
      canonicalTermsAcceptanceObserved:
        input.evidenceClass === 'canonical_private_reread',
      exactSourceAndCheckpointReread: true,
      imageBuildReviewEligible:
        input.evidenceClass === 'canonical_private_reread',
      syntheticEvidenceMayAuthorizeBuild: false,
      imageBuildStarted: false,
      imageBuildAuthorizedByThisReceiptAlone: false,
      runtimeExecuted: false,
      workDispatched: false,
      costOrCreditMutationCreated: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
    preparedAt: input.preparedAt,
  })
  return canonicalSam31PrivateArtifactIngestReceiptSchema.parse({
    ...payload,
    ingestReceiptHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31PrivateArtifactIngestReceipt(
  value: unknown,
): CanonicalSam31PrivateArtifactIngestReceipt {
  const parsed = canonicalSam31PrivateArtifactIngestReceiptSchema.parse(value)
  const { ingestReceiptHash, ...payload } = parsed
  if (ingestReceiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 private artifact ingest receipt hash is invalid.')
  }
  return parsed
}

async function verifyExactPrivateObject(
  coordinate: z.infer<typeof objectCoordinateSchema>,
  port: CanonicalSam31PrivateObjectReadPort,
  allowedContentTypes: readonly string[],
  requirePostBodyMetadataReread: boolean,
): Promise<{ readonly stable: true }> {
  const object = await port.readExact(coordinate)
  if (!object) throw new Error('SAM 3.1 private artifact is missing.')
  if (
    object.generationBeforeRead !== coordinate.generation
    || object.etagBeforeRead !== coordinate.etag
    || object.generationAfterRead !== coordinate.generation
    || object.etagAfterRead !== coordinate.etag
    || !allowedContentTypes.includes(object.contentType)
  ) throw new Error('SAM 3.1 private artifact metadata changed or is invalid.')
  const digest = createHash('sha256')
  let byteLength = 0
  if (Buffer.isBuffer(object.body) || object.body instanceof Uint8Array) {
    digest.update(object.body)
    byteLength = object.body.byteLength
  } else {
    for await (const chunk of object.body) {
      if (!(chunk instanceof Uint8Array) || chunk.byteLength === 0) {
        throw new Error('SAM 3.1 private artifact stream is invalid.')
      }
      byteLength += chunk.byteLength
      if (!Number.isSafeInteger(byteLength)) {
        throw new Error('SAM 3.1 private artifact byte length overflowed.')
      }
      digest.update(chunk)
    }
  }
  if (
    byteLength !== coordinate.byteLength
    || digest.digest('hex') !== coordinate.sha256
  ) throw new Error('SAM 3.1 private artifact bytes changed.')
  const after = requirePostBodyMetadataReread
    ? await object.rereadMetadataAfterBodyConsumed?.()
    : undefined
  if (requirePostBodyMetadataReread && !after) {
    throw new Error('SAM 3.1 canonical artifact post-read metadata is absent.')
  }
  const generationAfterRead = after?.generationAfterRead
    ?? object.generationAfterRead
  const etagAfterRead = after?.etagAfterRead ?? object.etagAfterRead
  if (
    generationAfterRead !== coordinate.generation
    || etagAfterRead !== coordinate.etag
  ) throw new Error('SAM 3.1 private artifact changed after streaming read.')
  return { stable: true }
}

function assertClosedPlainData(value: unknown, label: string): void {
  const seen = new Set<object>()
  const visit = (item: unknown): void => {
    if (!item || typeof item !== 'object') return
    if (seen.has(item)) throw new Error(`${label} contains a cycle.`)
    const prototype = Object.getPrototypeOf(item)
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      throw new Error(`${label} must contain plain data only.`)
    }
    seen.add(item)
    for (const key of Reflect.ownKeys(item)) {
      if (typeof key !== 'string') {
        throw new Error(`${label} contains a symbol key.`)
      }
      const descriptor = Object.getOwnPropertyDescriptor(item, key)
      if (!descriptor || !('value' in descriptor)) {
        throw new Error(`${label} contains an accessor.`)
      }
      visit(descriptor.value)
    }
    seen.delete(item)
  }
  visit(value)
}
