import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
  type CanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  assertCanonicalProfessionalGoogleCloudGpuPrivateObjectTransport,
  assertCanonicalProfessionalGoogleCloudGpuRelease,
  canonicalProfessionalGoogleCloudGpuPrivateObjectTransportSchema,
  canonicalProfessionalGoogleCloudGpuReleaseSchema,
} from './canonical-professional-google-cloud-gpu-job-launch-port'
import type {
  CanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository,
} from './canonical-professional-google-cloud-gpu-runtime-configuration-repository'
import {
  assertCanonicalSam31GpuRuntimeReleaseRegistryRecord,
  canonicalSam31GpuRuntimeReleaseRef,
  type CanonicalSam31GpuRuntimeReleaseRegistryRecord,
} from './canonical-sam3_1-gpu-runtime-release-registry'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  canonicalSam31GpuFixedTaskContractRef,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_GOOGLE_CLOUD_DEPLOYMENT_OBSERVATION_VERSION =
  'canonical-sam3_1-google-cloud-deployment-observation-v1' as const
export const CANONICAL_SAM3_1_GOOGLE_CLOUD_RUNTIME_CONFIGURATION_PUBLISHER_VERSION =
  'canonical-sam3_1-google-cloud-runtime-configuration-publisher-v1' as const
export const CANONICAL_SAM3_1_GOOGLE_CLOUD_RUNTIME_CONFIGURATION_PUBLICATION_RECEIPT_VERSION =
  'canonical-sam3_1-google-cloud-runtime-configuration-publication-receipt-v1' as const

const DEPLOYMENT_PREFIX =
  'private/canonical-professional-gpu/v1/deployment-observations'
const PRIVATE_GPU_BUCKET = 'reeditpro-production-reeditpro-masks' as const
const MAXIMUM_RECORD_BYTES = 8 * 1024 * 1024
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
])
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveInteger = z.number().int().positive().safe()
const timestamp = z.string().datetime({ offset: true })
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const apiEvidenceSchema = z.object({
  serviceIdentityObservationRef: refSchema,
  immutableImageMetadataObservationRef: refSchema,
  batchInstanceTemplateObservationRef: refSchema.nullable(),
  cloudRunJobObservationRef: refSchema.nullable(),
  privateBucketMetadataObservationRef: refSchema,
  privateBucketIamPolicyObservationRef: refSchema,
}).strict()
const observationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GOOGLE_CLOUD_DEPLOYMENT_OBSERVATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_google_cloud_gpu_deployment_observer',
  ),
  evidenceClass: z.literal('canonical_private_google_cloud_api_reread'),
  observationId: safeId,
  observationVersion: positiveInteger,
  runtimeReleaseRef: refSchema,
  imageSupplyChainReleaseRef: refSchema,
  release: canonicalProfessionalGoogleCloudGpuReleaseSchema,
  privateObjectTransport:
    canonicalProfessionalGoogleCloudGpuPrivateObjectTransportSchema,
  googleCloudApiEvidence: apiEvidenceSchema,
  observedAt: timestamp,
  exactProjectRegionRouteImageServiceTaskAndResourceReread: z.literal(true),
  exactServiceIdentityIamReread: z.literal(true),
  exactPrivateBucketCmekUniformAccessPublicPreventionAndIamReread:
    z.literal(true),
  exactScaleFromZeroGpuJobDefinitionReread: z.literal(true),
  callerImageCommandModelPathUrlBucketOrCloudResourceAccepted:
    z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  gpuJobStarted: z.literal(false),
  providerOrModelExecuted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryOrProductionAuthorityGranted: z.literal(false),
}).strict().superRefine((observation, context) => {
  const a100 = observation.release.routeId ===
    'a100_80gb_heavy_primary'
  const exactApiEvidence = a100
    ? observation.googleCloudApiEvidence
        .batchInstanceTemplateObservationRef !== null
      && observation.googleCloudApiEvidence.cloudRunJobObservationRef === null
    : observation.googleCloudApiEvidence
        .batchInstanceTemplateObservationRef === null
      && observation.googleCloudApiEvidence.cloudRunJobObservationRef !== null
  if (
    !exactApiEvidence
    || observation.runtimeReleaseRef.id !== observation.release.releaseRef.id
    || observation.runtimeReleaseRef.version !==
      observation.release.releaseRef.version
    || observation.runtimeReleaseRef.contentHash !==
      observation.release.releaseRef.contentHash
    || observation.privateObjectTransport.routeId !==
      observation.release.routeId
    || observation.privateObjectTransport.privateBucketName !==
      PRIVATE_GPU_BUCKET
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 deployment observation lost exact cloud scope.',
  })
})
export const canonicalSam31GoogleCloudDeploymentObservationSchema =
  observationWithoutHashSchema.extend({ observationHash: rawSha256 }).strict()
export type CanonicalSam31GoogleCloudDeploymentObservation = z.infer<
  typeof canonicalSam31GoogleCloudDeploymentObservationSchema
>

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GOOGLE_CLOUD_RUNTIME_CONFIGURATION_PUBLICATION_RECEIPT_VERSION,
  ),
  publisherVersion: z.literal(
    CANONICAL_SAM3_1_GOOGLE_CLOUD_RUNTIME_CONFIGURATION_PUBLISHER_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_google_cloud_runtime_configuration_publisher',
  ),
  evidenceClass: z.literal(
    'qualified_release_image_and_deployment_exact_reread_create_only',
  ),
  routeId: routeIdSchema,
  runtimeReleaseRef: refSchema,
  imageSupplyChainReleaseRef: refSchema,
  deploymentObservationRef: refSchema,
  privateObjectTransportRef: refSchema,
  disposition: z.enum(['created', 'identical_replay']),
  publishedAt: timestamp,
  qualifiedReleasePairExactReread: z.literal(true),
  qualifiedImmutableImageSupplyChainExactReread: z.literal(true),
  googleCloudDeploymentAndPrivateTransportExactReread: z.literal(true),
  createOnlyRuntimeConfigurationExactReread: z.literal(true),
  callerReleaseImageCommandBucketOrCloudResourceAccepted: z.literal(false),
  gpuJobStarted: z.literal(false),
  providerOrModelExecuted: z.literal(false),
  billingWalletOrCreditAuthorityGranted: z.literal(false),
  publicDeliveryOrProductionAuthorityGranted: z.literal(false),
}).strict()
const receiptSchema = receiptWithoutHashSchema.extend({
  publicationReceiptHash: rawSha256,
}).strict()
export type CanonicalSam31GoogleCloudRuntimeConfigurationPublicationReceipt =
  z.infer<typeof receiptSchema>

export interface CanonicalSam31GoogleCloudDeploymentObservationRepository {
  readonly schemaVersion:
    'canonical-sam3_1-google-cloud-deployment-observation-repository-v1'
  persistCreateOnly(input: {
    readonly observation: CanonicalSam31GoogleCloudDeploymentObservation
  }): Promise<'created' | 'identical_replay'>
  rereadExact(input: {
    readonly runtimeReleaseRef: z.infer<typeof refSchema>
  }): Promise<CanonicalSam31GoogleCloudDeploymentObservation | null>
}

export interface CanonicalSam31RuntimeReleasePairReadPort {
  rereadReleasePair(input: {
    readonly runtimeReleaseRef: z.infer<typeof refSchema>
  }): Promise<unknown | null>
}

export interface CanonicalSam31ImageSupplyChainReleaseReadPort {
  rereadQualifiedRelease(input: {
    readonly releaseRef: z.infer<typeof refSchema>
  }): Promise<unknown | null>
}

export function createCanonicalSam31GoogleCloudDeploymentObservation(
  input: z.input<typeof observationWithoutHashSchema>,
): CanonicalSam31GoogleCloudDeploymentObservation {
  assertPlainSerializedData(input, 'sam31_google_cloud_deployment_observation')
  const payload = observationWithoutHashSchema.parse(input)
  assertCanonicalProfessionalGoogleCloudGpuRelease(payload.release)
  assertCanonicalProfessionalGoogleCloudGpuPrivateObjectTransport(
    payload.privateObjectTransport,
  )
  return canonicalSam31GoogleCloudDeploymentObservationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31GoogleCloudDeploymentObservation(
  value: unknown,
): CanonicalSam31GoogleCloudDeploymentObservation {
  assertPlainSerializedData(value, 'sam31_google_cloud_deployment_observation')
  const parsed = canonicalSam31GoogleCloudDeploymentObservationSchema
    .parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 deployment observation hash is invalid.')
  }
  assertCanonicalProfessionalGoogleCloudGpuRelease(parsed.release)
  assertCanonicalProfessionalGoogleCloudGpuPrivateObjectTransport(
    parsed.privateObjectTransport,
  )
  return parsed
}

export function createCanonicalSam31GoogleCloudDeploymentObservationRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort },
): CanonicalSam31GoogleCloudDeploymentObservationRepository {
  if (!input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function') {
    throw new Error('SAM 3.1 deployment observation repository is absent.')
  }
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-google-cloud-deployment-observation-repository-v1' as const,
    async persistCreateOnly(untrusted: unknown) {
      assertPlainSerializedData(untrusted,
        'sam31_google_cloud_deployment_observation_persist')
      const request = z.object({ observation: z.unknown() }).strict()
        .parse(untrusted)
      const observation =
        assertCanonicalSam31GoogleCloudDeploymentObservation(
          request.observation,
        )
      const body = serialize(observation)
      const disposition = await input.objectPort.createOnly({
        objectPath: observationPath(observation.runtimeReleaseRef),
        body,
        contentSha256: hashBytes(body),
      })
      const reread = await readObservation(
        input.objectPort,
        observation.runtimeReleaseRef,
      )
      if (!reread || reread.observationHash !== observation.observationHash) {
        throw new Error('SAM 3.1 deployment observation reread failed.')
      }
      return disposition === 'created'
        ? 'created' as const
        : 'identical_replay' as const
    },
    async rereadExact(untrusted: unknown) {
      assertPlainSerializedData(untrusted,
        'sam31_google_cloud_deployment_observation_read')
      const request = z.object({ runtimeReleaseRef: refSchema }).strict()
        .parse(untrusted)
      return readObservation(input.objectPort, request.runtimeReleaseRef)
    },
  })
}

/**
 * Bridges an already-qualified SAM 3.1 release into the immutable deployment
 * configuration consumed by the authenticated Track All start route. The
 * publisher accepts no cloud resource, image, command, bucket, or rate from a
 * caller; all such fields arrive through exact backend-owned rereads.
 */
export async function publishCanonicalSam31GoogleCloudRuntimeConfiguration(
  input: {
    readonly routeId: z.infer<typeof routeIdSchema>
    readonly runtimeReleaseRef: z.infer<typeof refSchema>
    readonly releasePairReadPort: CanonicalSam31RuntimeReleasePairReadPort
    readonly imageSupplyChainReleaseReadPort:
      CanonicalSam31ImageSupplyChainReleaseReadPort
    readonly deploymentObservationRepository:
      CanonicalSam31GoogleCloudDeploymentObservationRepository
    readonly runtimeConfigurationRepository:
      CanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository
    readonly now?: () => Date
  },
): Promise<CanonicalSam31GoogleCloudRuntimeConfigurationPublicationReceipt> {
  const routeId = routeIdSchema.parse(input.routeId)
  const runtimeReleaseRef = refSchema.parse(input.runtimeReleaseRef)
  assertPorts(input)
  const pair = assertCanonicalSam31GpuRuntimeReleaseRegistryRecord(
    await input.releasePairReadPort.rereadReleasePair({ runtimeReleaseRef }),
  )
  const genericRelease = pair.runtimeRelease
  const specializedRelease = pair.specializedRelease
  if (!sameRef(canonicalSam31GpuRuntimeReleaseRef(genericRelease),
    runtimeReleaseRef)
    || genericRelease.routeId !== routeId
    || specializedRelease.route.routeId !== routeId
    || specializedRelease.imageSupplyChainReleaseRef === null) {
    throw new Error('SAM 3.1 qualified runtime release scope changed.')
  }
  const imageSupplyChainReleaseRef = refSchema.parse(
    specializedRelease.imageSupplyChainReleaseRef,
  )
  const imageRelease = assertCanonicalSam31CloudImageSupplyChainRelease(
    await input.imageSupplyChainReleaseReadPort.rereadQualifiedRelease({
      releaseRef: imageSupplyChainReleaseRef,
    }),
  )
  if (!sameRef(imageReleaseRef(imageRelease), imageSupplyChainReleaseRef)
    || imageRelease.status !== 'image_supply_chain_qualified') {
    throw new Error('SAM 3.1 qualified immutable image is unavailable.')
  }
  const observation =
    assertCanonicalSam31GoogleCloudDeploymentObservation(
      await input.deploymentObservationRepository.rereadExact({
        runtimeReleaseRef,
      }),
    )
  assertObservationLineage({
    observation,
    pair,
    imageRelease,
    routeId,
    runtimeReleaseRef,
  })
  const publishedAt = timestamp.parse(
    (input.now ?? (() => new Date()))().toISOString(),
  )
  if (Date.parse(publishedAt) < Date.parse(observation.observedAt)
    || Date.parse(publishedAt) < Date.parse(genericRelease.qualifiedAt)
    || Date.parse(publishedAt) >= Date.parse(genericRelease.expiresAt)) {
    throw new Error('SAM 3.1 runtime configuration publication is stale.')
  }
  const persisted = await input.runtimeConfigurationRepository
    .persistRuntimeConfigurationCreateOnly({
      release: observation.release,
      privateObjectTransport: observation.privateObjectTransport,
      publishedAt,
    })
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_GOOGLE_CLOUD_RUNTIME_CONFIGURATION_PUBLICATION_RECEIPT_VERSION,
    publisherVersion:
      CANONICAL_SAM3_1_GOOGLE_CLOUD_RUNTIME_CONFIGURATION_PUBLISHER_VERSION,
    source:
      'canonical_server_sam3_1_google_cloud_runtime_configuration_publisher',
    evidenceClass:
      'qualified_release_image_and_deployment_exact_reread_create_only',
    routeId,
    runtimeReleaseRef,
    imageSupplyChainReleaseRef,
    deploymentObservationRef: observationRef(observation),
    privateObjectTransportRef: persisted.privateObjectTransportRef,
    disposition: persisted.disposition,
    publishedAt,
    qualifiedReleasePairExactReread: true,
    qualifiedImmutableImageSupplyChainExactReread: true,
    googleCloudDeploymentAndPrivateTransportExactReread: true,
    createOnlyRuntimeConfigurationExactReread: true,
    callerReleaseImageCommandBucketOrCloudResourceAccepted: false,
    gpuJobStarted: false,
    providerOrModelExecuted: false,
    billingWalletOrCreditAuthorityGranted: false,
    publicDeliveryOrProductionAuthorityGranted: false,
  })
  return Object.freeze(receiptSchema.parse({
    ...payload,
    publicationReceiptHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalSam31GoogleCloudRuntimeConfigurationPublicationReceipt(
  value: unknown,
): CanonicalSam31GoogleCloudRuntimeConfigurationPublicationReceipt {
  assertPlainSerializedData(value,
    'sam31_google_cloud_runtime_configuration_publication_receipt')
  const parsed = receiptSchema.parse(value)
  const { publicationReceiptHash, ...payload } = parsed
  if (publicationReceiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 runtime configuration receipt is invalid.')
  }
  return Object.freeze(parsed)
}

function assertObservationLineage(input: {
  observation: CanonicalSam31GoogleCloudDeploymentObservation
  pair: CanonicalSam31GpuRuntimeReleaseRegistryRecord
  imageRelease: CanonicalSam31CloudImageSupplyChainRelease
  routeId: z.infer<typeof routeIdSchema>
  runtimeReleaseRef: z.infer<typeof refSchema>
}): void {
  const { observation, pair, imageRelease, routeId, runtimeReleaseRef } = input
  const generic = pair.runtimeRelease
  const release = assertCanonicalProfessionalGoogleCloudGpuRelease(
    observation.release,
  )
  const transport =
    assertCanonicalProfessionalGoogleCloudGpuPrivateObjectTransport(
      observation.privateObjectTransport,
    )
  if (!sameRef(observation.runtimeReleaseRef, runtimeReleaseRef)
    || !sameRef(observation.imageSupplyChainReleaseRef,
      imageReleaseRef(imageRelease))
    || !sameRef(release.releaseRef, runtimeReleaseRef)
    || !sameRef(release.fixedServerTaskContractRef,
      canonicalSam31GpuFixedTaskContractRef())
    || !sameRef(release.serviceIdentityRef, generic.serviceIdentityRef)
    || !sameRef(release.privateNetworkAndArtifactTransportRef,
      generic.privateNetworkAndArtifactTransportRef)
    || !sameRef(release.immutableImageRef, generic.immutableImageRef)
    || !sameRef(release.immutableImageRef, imageRelease.immutableImageRef)
    || release.immutableImageDigest !== generic.immutableImageDigest
    || release.immutableImageDigest !== imageRelease.immutableImageDigest
    || release.immutableImageUri !== imageRelease.immutableImageUri
    || release.toolId !== generic.toolId
    || release.operationId !== generic.operationId
    || release.routeId !== routeId
    || release.runtimeRegion !== generic.runtimeRegion
    || release.executionTarget !== generic.executionTarget
    || release.machineType !== generic.machineType
    || release.accelerator !== generic.accelerator
    || !sameRef(transport.transportRef,
      generic.privateNetworkAndArtifactTransportRef)
    || !sameRef(transport.serviceIdentityRef, generic.serviceIdentityRef)
    || transport.routeId !== routeId
    || transport.privateBucketName !== PRIVATE_GPU_BUCKET) {
    throw new Error('SAM 3.1 deployment crossed qualified release lineage.')
  }
}

function assertPorts(input: {
  releasePairReadPort: CanonicalSam31RuntimeReleasePairReadPort
  imageSupplyChainReleaseReadPort:
    CanonicalSam31ImageSupplyChainReleaseReadPort
  deploymentObservationRepository:
    CanonicalSam31GoogleCloudDeploymentObservationRepository
  runtimeConfigurationRepository:
    CanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository
}): void {
  if (typeof input.releasePairReadPort?.rereadReleasePair !== 'function'
    || typeof input.imageSupplyChainReleaseReadPort?.rereadQualifiedRelease
      !== 'function'
    || typeof input.deploymentObservationRepository?.rereadExact !== 'function'
    || typeof input.runtimeConfigurationRepository
      ?.persistRuntimeConfigurationCreateOnly !== 'function') {
    throw new Error('SAM 3.1 runtime configuration publisher is incomplete.')
  }
}

function imageReleaseRef(
  release: CanonicalSam31CloudImageSupplyChainRelease,
): z.infer<typeof refSchema> {
  return refSchema.parse({
    id: release.releaseId,
    version: release.releaseVersion,
    contentHash: `sha256:${release.releaseHash}`,
  })
}

function observationRef(
  observation: CanonicalSam31GoogleCloudDeploymentObservation,
): z.infer<typeof refSchema> {
  return refSchema.parse({
    id: observation.observationId,
    version: observation.observationVersion,
    contentHash: `sha256:${observation.observationHash}`,
  })
}

function sameRef(
  left: z.infer<typeof refSchema>,
  right: z.infer<typeof refSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function observationPath(ref: z.infer<typeof refSchema>): string {
  return `${DEPLOYMENT_PREFIX}/${hashText(stableAuthorityStringify(ref))}.json`
}

async function readObservation(
  port: CanonicalCreateOnlyJsonObjectPort,
  runtimeReleaseRef: z.infer<typeof refSchema>,
): Promise<CanonicalSam31GoogleCloudDeploymentObservation | null> {
  const bytes = await port.readExact(observationPath(runtimeReleaseRef))
  if (!bytes) return null
  if (!Buffer.isBuffer(bytes) || bytes.byteLength < 2
    || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 deployment observation bytes are invalid.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 deployment observation JSON is invalid.')
  }
  const observation =
    assertCanonicalSam31GoogleCloudDeploymentObservation(decoded)
  if (!sameRef(observation.runtimeReleaseRef, runtimeReleaseRef)
    || stableAuthorityStringify(observation) !== bytes.toString('utf8')) {
    throw new Error('SAM 3.1 deployment observation scope is invalid.')
  }
  return observation
}

function serialize(value: unknown): Buffer {
  const bytes = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (bytes.byteLength < 2 || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 deployment observation size is invalid.')
  }
  return bytes
}

function hashText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
