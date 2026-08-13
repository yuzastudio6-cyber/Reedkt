import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalSam31EightMinuteSourcePreparationQualification,
  assertCanonicalSam31EightMinuteSourcePreparationRelease,
  createCanonicalSam31EightMinuteSourcePreparationQualification,
  createCanonicalSam31EightMinuteSourcePreparationRelease,
  getCanonicalSam31EightMinuteSourcePreparationQualificationRef,
  getCanonicalSam31EightMinuteSourcePreparationReleaseRef,
  type CanonicalSam31EightMinuteSourcePreparationAuthorityRepository,
} from './canonical-sam3_1-eight-minute-source-preparation-admission-owner'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_VERSION =
  'canonical-sam3_1-source-preparation-image-build-receipt-v1' as const
export const CANONICAL_SAM3_1_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_VERSION =
  'canonical-sam3_1-source-preparation-image-supply-chain-v1' as const
export const CANONICAL_SAM3_1_SOURCE_PREPARATION_IMAGE_RELEASE_OWNER_VERSION =
  'canonical-sam3_1-source-preparation-image-release-owner-v1' as const

const IMAGE_REPOSITORY =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/'
  + 'reeditpro-sam31-source-preparation-l4'
const DOCKERFILE =
  'docker/prod/gpu-worker/sam3_1-source-preparation/Dockerfile.candidate'
const CLOUD_BUILD =
  'docker/prod/gpu-worker/sam3_1-source-preparation/cloudbuild.candidate.yaml'
const SOURCE_PROVENANCE =
  'docker/prod/gpu-worker/sam3_1-source-preparation/source-provenance.lock'
const FIXED_PROCESS =
  'server/services/canonical-sam3_1-eight-minute-source-preparation-fixed-process-port.ts'
const WORKER_ENTRYPOINT =
  'server/cli/run-weeditpro-sam3_1-eight-minute-source-preparation-worker.ts'

const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const gitSha = z.string().regex(/^[a-f0-9]{40}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof evidenceRefSchema>

const buildReceiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_source_preparation_image_build_owner',
  ),
  evidenceClass: z.literal('canonical_private_cloud_build_reread'),
  receiptId: safeId,
  cloudBuildId: z.string().uuid(),
  cloudBuildResource: safeId,
  sourceCommitSha: gitSha,
  sourceTreeSha: gitSha,
  sourceArchiveRef: evidenceRefSchema,
  sourceArchiveGeneration: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  sourceArchiveSha256: rawSha256,
  dockerfile: z.literal(DOCKERFILE),
  dockerfileSha256: rawSha256,
  cloudBuildDefinition: z.literal(CLOUD_BUILD),
  cloudBuildDefinitionSha256: rawSha256,
  sourceProvenanceLock: z.literal(SOURCE_PROVENANCE),
  sourceProvenanceLockSha256: rawSha256,
  fixedProcessSource: z.literal(FIXED_PROCESS),
  fixedProcessPortSha256: rawSha256,
  workerEntrypointSource: z.literal(WORKER_ENTRYPOINT),
  fixedWorkerEntrypointSha256: rawSha256,
  taggedImageUri: z.string().regex(
    /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-source-preparation-l4:source-prep-[a-f0-9]{16}$/u,
  ),
  immutableImageUri: z.string().regex(
    /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-source-preparation-l4@sha256:[a-f0-9]{64}$/u,
  ),
  immutableImageDigest: prefixedSha256,
  imageBuildRef: evidenceRefSchema,
  exactCloudBuildConfigurationReread: z.literal(true),
  exactSourceGenerationAndSha256Reread: z.literal(true),
  verifiedSlsaProvenanceRequested: z.literal(true),
  warningsAbsent: z.literal(true),
  imageBuiltAndPushed: z.literal(true),
  mutableTagAcceptedAsAuthority: z.literal(false),
  modelOrCheckpointIncluded: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  completedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (value.cloudBuildResource !==
      `projects/reeditpro/locations/us-central1/builds/${value.cloudBuildId}`
    || value.taggedImageUri !==
      `${IMAGE_REPOSITORY}:source-prep-${value.sourceCommitSha.slice(0, 16)}`
    || value.immutableImageUri !==
      `${IMAGE_REPOSITORY}@${value.immutableImageDigest}`
    || value.imageBuildRef.contentHash !== value.immutableImageDigest
    || value.sourceArchiveRef.contentHash !==
      `sha256:${value.sourceArchiveSha256}`) {
    context.addIssue({
      code: 'custom',
      message: 'Source-preparation image build lineage changed.',
    })
  }
})
const buildReceiptSchema = buildReceiptWithoutHashSchema.extend({
  receiptHash: rawSha256,
}).strict()
export type CanonicalSam31SourcePreparationImageBuildReceipt = z.infer<
  typeof buildReceiptSchema
>

const supplyChainWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_source_preparation_image_supply_chain_owner',
  ),
  evidenceClass: z.literal('canonical_private_exact_reread'),
  evidenceId: safeId,
  imageBuildReceiptRef: evidenceRefSchema,
  immutableImageUri: z.string().regex(
    /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-source-preparation-l4@sha256:[a-f0-9]{64}$/u,
  ),
  immutableImageDigest: prefixedSha256,
  spdx23SbomRef: evidenceRefSchema,
  vulnerabilityScanRef: evidenceRefSchema,
  independentSecurityReviewRef: evidenceRefSchema,
  signatureVerificationRef: evidenceRefSchema,
  slsaProvenanceRef: evidenceRefSchema,
  criticalCount: z.literal(0),
  highCount: z.literal(0),
  unknownSeverityCount: z.literal(0),
  completeOsAndApplicationPackageInventoryReread: z.literal(true),
  exactArtifactAnalysisOccurrencesReread: z.literal(true),
  independentSecurityReviewApprovedForPrivateGpuQualification:
    z.literal(true),
  exactKmsSignatureVerificationPassed: z.literal(true),
  exactSlsaV1ProvenanceReread: z.literal(true),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  reviewedAt: timestamp,
}).strict()
const supplyChainSchema = supplyChainWithoutHashSchema.extend({
  evidenceHash: rawSha256,
}).strict()
export type CanonicalSam31SourcePreparationImageSupplyChain = z.infer<
  typeof supplyChainSchema
>

export function createCanonicalSam31SourcePreparationImageBuildReceipt(
  input: Omit<z.input<typeof buildReceiptWithoutHashSchema>,
    'schemaVersion' | 'source' | 'evidenceClass'
      | 'exactCloudBuildConfigurationReread'
      | 'exactSourceGenerationAndSha256Reread'
      | 'verifiedSlsaProvenanceRequested' | 'warningsAbsent'
      | 'imageBuiltAndPushed' | 'mutableTagAcceptedAsAuthority'
      | 'modelOrCheckpointIncluded' | 'gpuJobDispatched'
      | 'customerCreditsMutated' | 'productionAuthorityGranted'>,
): CanonicalSam31SourcePreparationImageBuildReceipt {
  assertPlainSerializedData(input, 'sam31_source_prep_image_build_receipt')
  const payload = buildReceiptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_VERSION,
    source: 'canonical_server_sam3_1_source_preparation_image_build_owner',
    evidenceClass: 'canonical_private_cloud_build_reread',
    ...structuredClone(input),
    exactCloudBuildConfigurationReread: true,
    exactSourceGenerationAndSha256Reread: true,
    verifiedSlsaProvenanceRequested: true,
    warningsAbsent: true,
    imageBuiltAndPushed: true,
    mutableTagAcceptedAsAuthority: false,
    modelOrCheckpointIncluded: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
  })
  return buildReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31SourcePreparationImageBuildReceipt(
  value: unknown,
): CanonicalSam31SourcePreparationImageBuildReceipt {
  assertPlainSerializedData(value, 'sam31_source_prep_image_build_receipt')
  const parsed = buildReceiptSchema.parse(value)
  const { receiptHash, ...payload } = parsed
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw conflict('sam31_source_preparation_image_build_receipt_changed')
  }
  return freeze(structuredClone(parsed))
}

export function createCanonicalSam31SourcePreparationImageSupplyChain(
  input: Omit<z.input<typeof supplyChainWithoutHashSchema>,
    'schemaVersion' | 'source' | 'evidenceClass'
      | 'criticalCount' | 'highCount' | 'unknownSeverityCount'
      | 'completeOsAndApplicationPackageInventoryReread'
      | 'exactArtifactAnalysisOccurrencesReread'
      | 'independentSecurityReviewApprovedForPrivateGpuQualification'
      | 'exactKmsSignatureVerificationPassed'
      | 'exactSlsaV1ProvenanceReread' | 'runtimeReleaseGranted'
      | 'gpuJobDispatched' | 'customerCreditsMutated'
      | 'productionAuthorityGranted'>,
): CanonicalSam31SourcePreparationImageSupplyChain {
  assertPlainSerializedData(input, 'sam31_source_prep_image_supply_chain')
  const payload = supplyChainWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_VERSION,
    source:
      'canonical_server_sam3_1_source_preparation_image_supply_chain_owner',
    evidenceClass: 'canonical_private_exact_reread',
    ...structuredClone(input),
    criticalCount: 0,
    highCount: 0,
    unknownSeverityCount: 0,
    completeOsAndApplicationPackageInventoryReread: true,
    exactArtifactAnalysisOccurrencesReread: true,
    independentSecurityReviewApprovedForPrivateGpuQualification: true,
    exactKmsSignatureVerificationPassed: true,
    exactSlsaV1ProvenanceReread: true,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
  })
  return supplyChainSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31SourcePreparationImageSupplyChain(
  value: unknown,
): CanonicalSam31SourcePreparationImageSupplyChain {
  assertPlainSerializedData(value, 'sam31_source_prep_image_supply_chain')
  const parsed = supplyChainSchema.parse(value)
  const { evidenceHash, ...payload } = parsed
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw conflict('sam31_source_preparation_image_supply_chain_changed')
  }
  return freeze(structuredClone(parsed))
}

export function createCanonicalSam31SourcePreparationImageReleaseOwner(input: {
  readonly repository:
    CanonicalSam31EightMinuteSourcePreparationAuthorityRepository
}) {
  if (!input.repository
    || typeof input.repository.persistQualificationCreateOnly !== 'function'
    || typeof input.repository.rereadQualification !== 'function'
    || typeof input.repository.persistReleaseCreateOnly !== 'function'
    || typeof input.repository.rereadRelease !== 'function') {
    throw new TypeError('Source-preparation image authority repository absent.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_SOURCE_PREPARATION_IMAGE_RELEASE_OWNER_VERSION,
    async publishPrivateQualification(inputValue: {
      readonly qualificationId: string
      readonly releaseId: string
      readonly imageBuildReceipt:
        CanonicalSam31SourcePreparationImageBuildReceipt
      readonly supplyChain:
        CanonicalSam31SourcePreparationImageSupplyChain
      readonly fourKPreparationQualificationRunRef: EvidenceRef
      readonly qualifiedAt: string
    }) {
      const build = assertCanonicalSam31SourcePreparationImageBuildReceipt(
        inputValue.imageBuildReceipt,
      )
      const supply = assertCanonicalSam31SourcePreparationImageSupplyChain(
        inputValue.supplyChain,
      )
      const buildRef = imageBuildReceiptRef(build)
      if (!sameRef(supply.imageBuildReceiptRef, buildRef)
        || supply.immutableImageUri !== build.immutableImageUri
        || supply.immutableImageDigest !== build.immutableImageDigest) {
        throw conflict('sam31_source_preparation_supply_chain_crossed_image')
      }
      const fourKRunRef = evidenceRefSchema.parse(
        inputValue.fourKPreparationQualificationRunRef,
      )
      const qualification =
        createCanonicalSam31EightMinuteSourcePreparationQualification({
          qualificationId: safeId.parse(inputValue.qualificationId),
          projectId: 'reeditpro',
          region: 'us-central1',
          routeId: 'l4_standard_primary',
          routeProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
          operationId:
            'tool.ffmpeg.prepare_sam3_1_qualification_source_chunks.v1',
          cloudRunJobName: 'weeditpro-sam31-source-prep-l4',
          cloudRunJobResource:
            'projects/reeditpro/locations/us-central1/jobs/'
            + 'weeditpro-sam31-source-prep-l4',
          immutableImageRef: build.imageBuildRef,
          immutableImageDigest: build.immutableImageDigest,
          sourceCommitSha: build.sourceCommitSha,
          sourceTreeSha: build.sourceTreeSha,
          dockerfileSha256: build.dockerfileSha256,
          sourceProvenanceLockSha256: build.sourceProvenanceLockSha256,
          fixedProcessPortSha256: build.fixedProcessPortSha256,
          fixedWorkerEntrypointSha256: build.fixedWorkerEntrypointSha256,
          imageBuildRef: buildRef,
          spdx23SbomRef: supply.spdx23SbomRef,
          vulnerabilityScanRef: supply.vulnerabilityScanRef,
          signatureVerificationRef: supply.signatureVerificationRef,
          slsaProvenanceRef: supply.slsaProvenanceRef,
          fourKPreparationQualificationRunRef: fourKRunRef,
          actualNvidiaL4Observed: true,
          exactlyOneL4Allocated: true,
          ffmpegCudaNvdecDecodeVerified: true,
          ffmpegNvencH264EncodeVerified: true,
          ffprobeMetadataOnlyVerified: true,
          exact3840x2160At24FpsPreserved: true,
          exact49ChunkFrameAccountingVerified: true,
          exactOneFrameOverlapVerified: true,
          sourceAudioRemovalVerified: true,
          immutableImageDigestRereadVerified: true,
          spdx23SbomRereadVerified: true,
          criticalHighOrUnknownVulnerabilitiesAbsent: true,
          kmsSignatureVerified: true,
          slsaProvenanceVerified: true,
          substantiveCpuMediaProcessingUsed: false,
          runtimeModelOrToolDownloadPerformed: false,
          callerPathUrlBytesCommandModelOrEnvironmentAccepted: false,
          customerCreditsMutated: false,
          qaApproved: false,
          publicDeliveryAuthorized: false,
          productionAuthorityGranted: false,
          qualifiedAt: timestamp.parse(inputValue.qualifiedAt),
        })
      const qualificationRef =
        getCanonicalSam31EightMinuteSourcePreparationQualificationRef(
          qualification,
        )
      const qualificationDisposition = await input.repository
        .persistQualificationCreateOnly({ qualification })
      const qualificationReread =
        await input.repository.rereadQualification({ qualificationRef })
      if (!qualificationReread || stableAuthorityStringify(
        assertCanonicalSam31EightMinuteSourcePreparationQualification(
          qualificationReread,
        ),
      ) !== stableAuthorityStringify(qualification)) {
        throw conflict('sam31_source_preparation_qualification_reread_changed')
      }
      const releasedAt = qualification.qualifiedAt
      const release = createCanonicalSam31EightMinuteSourcePreparationRelease({
        releaseId: safeId.parse(inputValue.releaseId),
        qualification,
        releasedAt,
        expiresAt: new Date(
          Date.parse(releasedAt) + 30 * 24 * 60 * 60 * 1_000,
        ).toISOString(),
      })
      const releaseRef =
        getCanonicalSam31EightMinuteSourcePreparationReleaseRef(release)
      const releaseDisposition = await input.repository
        .persistReleaseCreateOnly({ release })
      const releaseReread = await input.repository.rereadRelease({ releaseRef })
      if (!releaseReread || stableAuthorityStringify(
        assertCanonicalSam31EightMinuteSourcePreparationRelease(
          releaseReread,
          releasedAt,
        ),
      ) !== stableAuthorityStringify(release)) {
        throw conflict('sam31_source_preparation_release_reread_changed')
      }
      return freeze({
        status: 'qualified_private_l4_source_preparation' as const,
        qualification,
        qualificationRef,
        qualificationDisposition,
        release,
        releaseRef,
        releaseDisposition,
        exactBuildSupplyChainL4RunQualificationAndReleaseReread: true as const,
        gpuJobDispatchedByPublication: false as const,
        customerCreditsMutated: false as const,
        qaApproved: false as const,
        publicDeliveryAuthorized: false as const,
        productionAuthorityGranted: false as const,
      })
    },
  })
}

export function imageBuildReceiptRef(
  value: unknown,
): EvidenceRef {
  const receipt = assertCanonicalSam31SourcePreparationImageBuildReceipt(value)
  return evidenceRefSchema.parse({
    id: receipt.receiptId,
    version: 1,
    contentHash: `sha256:${receipt.receiptHash}`,
  })
}

export function imageSupplyChainRef(value: unknown): EvidenceRef {
  const evidence = assertCanonicalSam31SourcePreparationImageSupplyChain(value)
  return evidenceRefSchema.parse({
    id: evidence.evidenceId,
    version: 1,
    contentHash: `sha256:${evidence.evidenceHash}`,
  })
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'SAM 3.1 source-preparation image release evidence conflicts.',
    409,
    { requiredGate },
  )
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      freeze(child)
    }
  }
  return value
}
