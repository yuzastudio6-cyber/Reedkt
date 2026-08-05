import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalProfessionalGoogleCloudGpuRelease,
  assertCanonicalTrackAllSam31L4TaskQaPrivateObjectTransport,
  canonicalProfessionalGoogleCloudGpuReleaseSchema,
  canonicalTrackAllSam31L4TaskQaPrivateObjectTransportSchema,
} from './canonical-professional-google-cloud-gpu-job-launch-port'
import type {
  CanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository,
} from './canonical-professional-google-cloud-gpu-runtime-configuration-repository'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  canonicalTrackAllSam31L4TaskQaFixedTaskContractRef,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_QUALIFICATION_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-image-qualification-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPLOYMENT_OBSERVATION_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-deployment-observation-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_RUNTIME_RELEASE_PUBLISHER_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_RUNTIME_RELEASE_RECEIPT_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-runtime-release-receipt-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_RUNTIME_RELEASE_EVIDENCE_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-runtime-release-evidence-repository-v1' as const

const OPERATION_ID = 'tool.kornia.refine_mask.v1' as const
const ROUTE_ID = 'l4_standard_primary' as const
const PRIVATE_BUCKET = 'reeditpro-production-reeditpro-masks' as const
const DEFAULT_PREFIX =
  'private/track-all/sam3_1/v1/l4-task-qa/runtime-release-evidence'
const MAXIMUM_RECORD_BYTES = 8 * 1024 * 1024
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const gitHash = z.string().regex(/^[a-f0-9]{40}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const immutableImageUriSchema = z.string().regex(
  /^us-central1-docker\.pkg\.dev\/reeditpro\/[a-z0-9._-]+\/[a-z0-9._/-]+@sha256:[a-f0-9]{64}$/u,
)

const imageQualificationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_QUALIFICATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_l4_task_qa_image_qualification_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  qualificationId: safeId,
  qualificationVersion: z.literal(1),
  operationId: z.literal(OPERATION_ID),
  routeId: z.literal(ROUTE_ID),
  runtimeCandidateRef: evidenceRefSchema,
  sourceRevision: gitHash,
  sourceTreeHash: gitHash,
  sourceWorktreeClean: z.literal(true),
  immutableImageRef: evidenceRefSchema,
  immutableImageUri: immutableImageUriSchema,
  immutableImageDigest: prefixedSha256,
  baseImageRef: evidenceRefSchema,
  privateBuildCapsuleManifestRef: evidenceRefSchema,
  requirementsLockRef: evidenceRefSchema,
  opencvCudaBuildReceiptRef: evidenceRefSchema,
  cudaForwardCompatibilityReceiptRef: evidenceRefSchema,
  sbomRef: evidenceRefSchema,
  vulnerabilityScanRef: evidenceRefSchema,
  signatureVerificationRef: evidenceRefSchema,
  slsaProvenanceRef: evidenceRefSchema,
  l4DriverCudaKorniaAndOpenCvQualificationRef: evidenceRefSchema,
  completeFrameAndSubjectQualityQualificationRef: evidenceRefSchema,
  scaleFromZeroAndTerminalStopQualificationRef: evidenceRefSchema,
  accountEffectiveL4RateCompatibilityRef: evidenceRefSchema,
  observedTorchVersion: z.literal('2.10.0+cu128'),
  observedCudaRuntimeVersion: z.literal('12.8'),
  observedKorniaVersion: z.literal('0.8.3'),
  observedOpenCvCudaBuild: z.literal(true),
  criticalVulnerabilityCount: z.literal(0),
  highVulnerabilityCount: z.literal(0),
  unknownSeverityVulnerabilityCount: z.literal(0),
  exactImmutableImageSbomScanSignatureAndProvenanceReread: z.literal(true),
  exactL4CudaRuntimeAndCompleteQualityEvidenceReread: z.literal(true),
  runtimeDownloadAllowed: z.literal(false),
  samCheckpointOrModelWeightsIncluded: z.literal(false),
  cpuOnlySubstantiveMaskQaAllowed: z.literal(false),
  gpuJobStartedByQualificationOwner: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  qualifiedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((record, context) => {
  const digest = record.immutableImageUri.match(/@sha256:([a-f0-9]{64})$/u)
    ?.[1]
  if (
    record.immutableImageDigest !== `sha256:${digest ?? ''}`
    || record.immutableImageRef.contentHash !== record.immutableImageDigest
    || Date.parse(record.expiresAt) <= Date.parse(record.qualifiedAt)
  ) context.addIssue({
    code: 'custom',
    message: 'Track All L4 task-QA image qualification lost identity.',
  })
})
const imageQualificationSchema = imageQualificationWithoutHashSchema.extend({
  qualificationHash: sha256,
}).strict()
export type CanonicalTrackAllSam31L4TaskQaImageQualification = z.infer<
  typeof imageQualificationSchema
>

const deploymentObservationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPLOYMENT_OBSERVATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_l4_task_qa_deployment_observer',
  ),
  evidenceClass: z.literal('canonical_private_google_cloud_api_reread'),
  observationId: safeId,
  observationVersion: z.literal(1),
  imageQualificationRef: evidenceRefSchema,
  release: canonicalProfessionalGoogleCloudGpuReleaseSchema,
  privateObjectTransport:
    canonicalTrackAllSam31L4TaskQaPrivateObjectTransportSchema,
  serviceIdentityObservationRef: evidenceRefSchema,
  immutableImageMetadataObservationRef: evidenceRefSchema,
  cloudRunJobObservationRef: evidenceRefSchema,
  privateBucketMetadataObservationRef: evidenceRefSchema,
  privateBucketIamPolicyObservationRef: evidenceRefSchema,
  cloudRunJobIamPolicyObservationRef: evidenceRefSchema,
  observedAt: timestamp,
  exactProjectRegionImageServiceTaskJobGpuAndScaleZeroReread: z.literal(true),
  exactSeparateSamReadAndL4TaskQaWriteRootReread: z.literal(true),
  exactPrivateBucketCmekUniformAccessPublicPreventionAndIamReread:
    z.literal(true),
  callerImageCommandBucketPathObjectNameOrCloudResourceAccepted:
    z.literal(false),
  gpuJobStarted: z.literal(false),
  providerOrModelExecuted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryOrProductionAuthorityGranted: z.literal(false),
}).strict().superRefine((record, context) => {
  const release = record.release
  const transport = record.privateObjectTransport
  const fixedTask = canonicalTrackAllSam31L4TaskQaFixedTaskContractRef()
  if (
    release.toolId !== 'kornia'
    || release.operationId !== OPERATION_ID
    || release.routeId !== ROUTE_ID
    || release.runtimeRegion !== 'us-central1'
    || release.executionTarget !== 'google_cloud_run_l4_job'
    || release.accelerator !== 'nvidia_l4'
    || release.minimumIdleInstances !== 0
    || stableAuthorityStringify(release.fixedServerTaskContractRef)
      !== stableAuthorityStringify(fixedTask)
    || transport.privateBucketName !== PRIVATE_BUCKET
    || transport.routeId !== release.routeId
    || transport.cloudRunJobResource !== release.cloudRunJobResource
    || stableAuthorityStringify(transport.transportRef)
      !== stableAuthorityStringify(
        release.privateNetworkAndArtifactTransportRef,
      )
    || stableAuthorityStringify(transport.serviceIdentityRef)
      !== stableAuthorityStringify(release.serviceIdentityRef)
  ) context.addIssue({
    code: 'custom',
    message: 'Track All L4 task-QA deployment lost exact release scope.',
  })
})
const deploymentObservationSchema =
  deploymentObservationWithoutHashSchema.extend({
    observationHash: sha256,
  }).strict()
export type CanonicalTrackAllSam31L4TaskQaDeploymentObservation = z.infer<
  typeof deploymentObservationSchema
>

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_RUNTIME_RELEASE_RECEIPT_VERSION,
  ),
  publisherVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_RUNTIME_RELEASE_PUBLISHER_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_l4_task_qa_runtime_release_publisher',
  ),
  evidenceClass: z.literal(
    'qualified_image_l4_runtime_deployment_exact_reread_create_only',
  ),
  imageQualificationRef: evidenceRefSchema,
  deploymentObservationRef: evidenceRefSchema,
  runtimeReleaseRef: evidenceRefSchema,
  privateObjectTransportRef: evidenceRefSchema,
  disposition: z.enum(['created', 'identical_replay']),
  exactImageSupplyChainL4QualityScaleZeroAndRateCompatibilityReread:
    z.literal(true),
  exactCloudRunJobIdentityGpuPrivateTransportAndIamReread: z.literal(true),
  createOnlyRuntimeConfigurationExactReread: z.literal(true),
  gpuJobStarted: z.literal(false),
  providerOrModelExecuted: z.literal(false),
  billingWalletOrCreditAuthorityGranted: z.literal(false),
  publicDeliveryOrProductionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict()
const receiptSchema = receiptWithoutHashSchema.extend({
  receiptHash: sha256,
}).strict()
export type CanonicalTrackAllSam31L4TaskQaRuntimeReleaseReceipt = z.infer<
  typeof receiptSchema
>

export interface CanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_RUNTIME_RELEASE_EVIDENCE_REPOSITORY_VERSION
  persistImageQualificationCreateOnly(input: {
    readonly qualification: CanonicalTrackAllSam31L4TaskQaImageQualification
  }): Promise<'created' | 'identical_replay'>
  persistDeploymentObservationCreateOnly(input: {
    readonly observation: CanonicalTrackAllSam31L4TaskQaDeploymentObservation
  }): Promise<'created' | 'identical_replay'>
  rereadImageQualification(input: {
    readonly imageQualificationRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalTrackAllSam31L4TaskQaImageQualification | null>
  rereadDeploymentObservation(input: {
    readonly runtimeReleaseRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalTrackAllSam31L4TaskQaDeploymentObservation | null>
}

export function createCanonicalTrackAllSam31L4TaskQaImageQualification(
  input: z.input<typeof imageQualificationWithoutHashSchema>,
): CanonicalTrackAllSam31L4TaskQaImageQualification {
  assertPlainSerializedData(input, 'track_all_l4_image_qualification_input')
  const payload = imageQualificationWithoutHashSchema.parse(input)
  return imageQualificationSchema.parse({
    ...payload,
    qualificationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaImageQualification(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaImageQualification {
  assertPlainSerializedData(value, 'track_all_l4_image_qualification')
  const record = imageQualificationSchema.parse(value)
  const { qualificationHash, ...payload } = record
  if (qualificationHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 image qualification hash is invalid.')
  }
  return structuredClone(record)
}

export function createCanonicalTrackAllSam31L4TaskQaDeploymentObservation(
  input: z.input<typeof deploymentObservationWithoutHashSchema>,
): CanonicalTrackAllSam31L4TaskQaDeploymentObservation {
  assertPlainSerializedData(input, 'track_all_l4_deployment_observation_input')
  const payload = deploymentObservationWithoutHashSchema.parse(input)
  assertCanonicalProfessionalGoogleCloudGpuRelease(payload.release)
  assertCanonicalTrackAllSam31L4TaskQaPrivateObjectTransport(
    payload.privateObjectTransport,
  )
  return deploymentObservationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaDeploymentObservation(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaDeploymentObservation {
  assertPlainSerializedData(value, 'track_all_l4_deployment_observation')
  const record = deploymentObservationSchema.parse(value)
  const { observationHash, ...payload } = record
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 deployment observation hash is invalid.')
  }
  assertCanonicalProfessionalGoogleCloudGpuRelease(record.release)
  assertCanonicalTrackAllSam31L4TaskQaPrivateObjectTransport(
    record.privateObjectTransport,
  )
  return structuredClone(record)
}

export function createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_RUNTIME_RELEASE_EVIDENCE_REPOSITORY_VERSION,
    persistImageQualificationCreateOnly: ({ qualification }: {
      readonly qualification:
        CanonicalTrackAllSam31L4TaskQaImageQualification
    }) =>
      persistRecord({
        port: input.objectPort,
        path: imagePath(prefix, imageQualificationRef(qualification)),
        value: assertCanonicalTrackAllSam31L4TaskQaImageQualification(
          qualification,
        ),
      }),
    persistDeploymentObservationCreateOnly: ({ observation }: {
      readonly observation:
        CanonicalTrackAllSam31L4TaskQaDeploymentObservation
    }) =>
      persistRecord({
        port: input.objectPort,
        path: deploymentPath(prefix, observation.release.releaseRef),
        value: assertCanonicalTrackAllSam31L4TaskQaDeploymentObservation(
          observation,
        ),
      }),
    rereadImageQualification: ({ imageQualificationRef: ref }: {
      readonly imageQualificationRef: z.infer<typeof evidenceRefSchema>
    }) =>
      readRecord({
        port: input.objectPort,
        path: imagePath(prefix, evidenceRefSchema.parse(ref)),
        parse: assertCanonicalTrackAllSam31L4TaskQaImageQualification,
      }),
    rereadDeploymentObservation: ({ runtimeReleaseRef }: {
      readonly runtimeReleaseRef: z.infer<typeof evidenceRefSchema>
    }) =>
      readRecord({
        port: input.objectPort,
        path: deploymentPath(
          prefix,
          evidenceRefSchema.parse(runtimeReleaseRef),
        ),
        parse: assertCanonicalTrackAllSam31L4TaskQaDeploymentObservation,
      }),
  })
}

export async function publishCanonicalTrackAllSam31L4TaskQaRuntimeRelease(
  input: {
    readonly imageQualificationRef: z.infer<typeof evidenceRefSchema>
    readonly runtimeReleaseRef: z.infer<typeof evidenceRefSchema>
    readonly evidenceRepository:
      CanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository
    readonly runtimeConfigurationRepository:
      CanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository
    readonly now?: () => string
  },
): Promise<CanonicalTrackAllSam31L4TaskQaRuntimeReleaseReceipt> {
  const imageRef = evidenceRefSchema.parse(input.imageQualificationRef)
  const runtimeRef = evidenceRefSchema.parse(input.runtimeReleaseRef)
  const image = assertCanonicalTrackAllSam31L4TaskQaImageQualification(
    await input.evidenceRepository.rereadImageQualification({
      imageQualificationRef: imageRef,
    }),
  )
  const observation =
    assertCanonicalTrackAllSam31L4TaskQaDeploymentObservation(
      await input.evidenceRepository.rereadDeploymentObservation({
        runtimeReleaseRef: runtimeRef,
      }),
    )
  const release = observation.release
  if (
    stableAuthorityStringify(imageQualificationRef(image))
      !== stableAuthorityStringify(imageRef)
    || stableAuthorityStringify(observation.imageQualificationRef)
      !== stableAuthorityStringify(imageRef)
    || stableAuthorityStringify(release.releaseRef)
      !== stableAuthorityStringify(runtimeRef)
    || stableAuthorityStringify(release.immutableImageRef)
      !== stableAuthorityStringify(image.immutableImageRef)
    || release.immutableImageUri !== image.immutableImageUri
    || release.immutableImageDigest !== image.immutableImageDigest
  ) throw new Error('Track All L4 release evidence lineage changed.')
  const publishedAt = timestamp.parse(
    (input.now ?? (() => new Date().toISOString()))(),
  )
  if (Date.parse(publishedAt) < Date.parse(image.qualifiedAt)
    || Date.parse(publishedAt) < Date.parse(observation.observedAt)
    || Date.parse(publishedAt) >= Date.parse(image.expiresAt)) {
    throw new Error('Track All L4 release evidence is stale.')
  }
  const persisted = await input.runtimeConfigurationRepository
    .persistRuntimeConfigurationCreateOnly({
      release,
      privateObjectTransport: observation.privateObjectTransport,
      publishedAt,
    })
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_RUNTIME_RELEASE_RECEIPT_VERSION,
    publisherVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_RUNTIME_RELEASE_PUBLISHER_VERSION,
    source:
      'canonical_server_track_all_sam3_1_l4_task_qa_runtime_release_publisher',
    evidenceClass:
      'qualified_image_l4_runtime_deployment_exact_reread_create_only',
    imageQualificationRef: imageRef,
    deploymentObservationRef: deploymentObservationRef(observation),
    runtimeReleaseRef: persisted.releaseRef,
    privateObjectTransportRef: persisted.privateObjectTransportRef,
    disposition: persisted.disposition,
    exactImageSupplyChainL4QualityScaleZeroAndRateCompatibilityReread: true,
    exactCloudRunJobIdentityGpuPrivateTransportAndIamReread: true,
    createOnlyRuntimeConfigurationExactReread: true,
    gpuJobStarted: false,
    providerOrModelExecuted: false,
    billingWalletOrCreditAuthorityGranted: false,
    publicDeliveryOrProductionAuthorityGranted: false,
    publishedAt,
  })
  return Object.freeze(receiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalTrackAllSam31L4TaskQaRuntimeReleaseReceipt(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaRuntimeReleaseReceipt {
  assertPlainSerializedData(value, 'track_all_l4_release_receipt')
  const receipt = receiptSchema.parse(value)
  const { receiptHash, ...payload } = receipt
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 release receipt hash is invalid.')
  }
  return structuredClone(receipt)
}

function imageQualificationRef(
  record: CanonicalTrackAllSam31L4TaskQaImageQualification,
) {
  return evidenceRefSchema.parse({
    id: record.qualificationId,
    version: record.qualificationVersion,
    contentHash: `sha256:${record.qualificationHash}`,
  })
}

function deploymentObservationRef(
  record: CanonicalTrackAllSam31L4TaskQaDeploymentObservation,
) {
  return evidenceRefSchema.parse({
    id: record.observationId,
    version: record.observationVersion,
    contentHash: `sha256:${record.observationHash}`,
  })
}

async function persistRecord(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  value: unknown
}): Promise<'created' | 'identical_replay'> {
  const body = serialize(input.value)
  const result = await input.port.createOnly({
    objectPath: input.path,
    body,
    contentSha256: bytesHash(body),
  })
  const reread = await input.port.readExact(input.path)
  if (!reread || !Buffer.isBuffer(reread) || !reread.equals(body)) {
    throw new Error('Track All L4 release evidence exact reread changed.')
  }
  return result === 'created' ? 'created' : 'identical_replay'
}

async function readRecord<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  parse: (value: unknown) => T
}): Promise<T | null> {
  const body = await input.port.readExact(input.path)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Track All L4 release evidence bytes are invalid.')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw new Error('Track All L4 release evidence JSON is invalid.')
  }
  const parsed = input.parse(value)
  if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
    throw new Error('Track All L4 release evidence is not canonical.')
  }
  return parsed
}

function imagePath(prefix: string, ref: z.infer<typeof evidenceRefSchema>) {
  return `${prefix}/images/${refHash(ref)}.json`
}

function deploymentPath(
  prefix: string,
  ref: z.infer<typeof evidenceRefSchema>,
) {
  return `${prefix}/deployments/${refHash(ref)}.json`
}

function refHash(ref: z.infer<typeof evidenceRefSchema>): string {
  return createHash('sha256')
    .update(stableAuthorityStringify(ref), 'utf8').digest('hex')
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Track All L4 release evidence exceeded its byte bound.')
  }
  return body
}

function bytesHash(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Track All L4 release evidence repository is unavailable.')
  }
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.length > 512 || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) =>
      !/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(part))) {
    throw new Error('Track All L4 release evidence prefix is invalid.')
  }
  return normalized
}
