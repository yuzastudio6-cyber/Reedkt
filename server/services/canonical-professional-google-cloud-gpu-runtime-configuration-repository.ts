import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalProfessionalToolGpuDispatchAdmission,
  type CanonicalProfessionalToolGpuDispatchAdmission,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuRuntimeLaunchTarget,
  assertPlainSerializedData,
  type CanonicalProfessionalGpuRuntimeLaunchTarget,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalProfessionalGoogleCloudGpuPrivateObjectTransport,
  assertCanonicalProfessionalGoogleCloudGpuRelease,
  canonicalProfessionalGoogleCloudGpuPrivateObjectTransportSchema,
  canonicalProfessionalGoogleCloudGpuReleaseSchema,
  type CanonicalProfessionalGoogleCloudGpuPrivateObjectTransport,
  type CanonicalProfessionalGoogleCloudGpuPrivateObjectTransportReadPort,
  type CanonicalProfessionalGoogleCloudGpuRelease,
  type CanonicalProfessionalGoogleCloudGpuReleaseReadPort,
} from './canonical-professional-google-cloud-gpu-job-launch-port'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_RUNTIME_CONFIGURATION_REPOSITORY_VERSION =
  'canonical-professional-google-cloud-gpu-runtime-configuration-repository-v1' as const
export const CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_RUNTIME_CONFIGURATION_RECORD_VERSION =
  'canonical-professional-google-cloud-gpu-runtime-configuration-record-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/runtime-configurations'
const MAXIMUM_RECORD_BYTES = 8 * 1024 * 1024
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const recordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_RUNTIME_CONFIGURATION_RECORD_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_google_cloud_gpu_runtime_configuration_repository',
  ),
  evidenceClass: z.literal('gcs_create_only_exact_reread'),
  release: canonicalProfessionalGoogleCloudGpuReleaseSchema,
  privateObjectTransport:
    canonicalProfessionalGoogleCloudGpuPrivateObjectTransportSchema.nullable(),
  immutableReleaseTransportImageServiceAndTaskContractBound: z.literal(true),
  scaleFromZeroConfigurationPreserved: z.literal(true),
  callerImageCommandModelPathUrlOrEnvironmentAccepted: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  providerOrGpuJobStarted: z.literal(false),
  assetMediaOrModelBytesIncluded: z.literal(false),
  billingWalletOrCreditAuthorityGranted: z.literal(false),
  publicDeliveryOrProductionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict()
const recordSchema = recordWithoutHashSchema.extend({
  recordHash: sha256,
}).strict()
type RuntimeConfigurationRecord = z.infer<typeof recordSchema>

export interface CanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository
  extends CanonicalProfessionalGoogleCloudGpuReleaseReadPort,
    CanonicalProfessionalGoogleCloudGpuPrivateObjectTransportReadPort {
  readonly schemaVersion:
    typeof CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_RUNTIME_CONFIGURATION_REPOSITORY_VERSION
  readonly evidenceClass:
    'gcs_create_only_exact_reread_gpu_runtime_configuration'
  persistRuntimeConfigurationCreateOnly(input: {
    readonly release: CanonicalProfessionalGoogleCloudGpuRelease
    readonly privateObjectTransport:
      CanonicalProfessionalGoogleCloudGpuPrivateObjectTransport | null
    readonly publishedAt: string
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly releaseRef: CanonicalProfessionalGoogleCloudGpuRelease['releaseRef']
    readonly privateObjectTransportRef:
      CanonicalProfessionalGoogleCloudGpuPrivateObjectTransport['transportRef'] | null
    readonly providerOrGpuJobStarted: false
    readonly billingWalletOrCreditAuthorityGranted: false
  }>
}

type PersistInput = Parameters<
  CanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository[
    'persistRuntimeConfigurationCreateOnly'
  ]
>[0]
type ReleaseReadInput = Parameters<
  CanonicalProfessionalGoogleCloudGpuReleaseReadPort[
    'rereadPrivateRelease'
  ]
>[0]
type TransportReadInput = Parameters<
  CanonicalProfessionalGoogleCloudGpuPrivateObjectTransportReadPort[
    'rereadPrivateObjectTransport'
  ]
>[0]

/**
 * Immutable one-writer boundary for the exact A100/L4 release and private
 * object-transport configuration admitted before a Google Cloud job starts.
 * Persistence and reread never launch a job or grant cost/credit authority.
 */
export function createCanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_RUNTIME_CONFIGURATION_REPOSITORY_VERSION,
    evidenceClass:
      'gcs_create_only_exact_reread_gpu_runtime_configuration' as const,
    async persistRuntimeConfigurationCreateOnly(untrusted: PersistInput) {
      assertPlainSerializedData(untrusted, 'gpu_runtime_configuration_publish')
      const request = z.object({
        release: z.unknown(),
        privateObjectTransport: z.unknown().nullable(),
        publishedAt: timestamp,
      }).strict().parse(untrusted)
      const release = assertCanonicalProfessionalGoogleCloudGpuRelease(
        request.release,
      )
      const transport = request.privateObjectTransport === null
        ? null
        : assertCanonicalProfessionalGoogleCloudGpuPrivateObjectTransport(
            request.privateObjectTransport,
          )
      assertReleaseAndTransportBinding(release, transport)
      const payload = recordWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_RUNTIME_CONFIGURATION_RECORD_VERSION,
        source:
          'canonical_server_professional_google_cloud_gpu_runtime_configuration_repository',
        evidenceClass: 'gcs_create_only_exact_reread',
        release,
        privateObjectTransport: transport,
        immutableReleaseTransportImageServiceAndTaskContractBound: true,
        scaleFromZeroConfigurationPreserved: true,
        callerImageCommandModelPathUrlOrEnvironmentAccepted: false,
        runtimeDownloadAllowed: false,
        cpuOnlySubstantiveExecutionAllowed: false,
        providerOrGpuJobStarted: false,
        assetMediaOrModelBytesIncluded: false,
        billingWalletOrCreditAuthorityGranted: false,
        publicDeliveryOrProductionAuthorityGranted: false,
        publishedAt: request.publishedAt,
      })
      const record = recordSchema.parse({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const body = serialize(record)
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, release.releaseRef),
        body,
        contentSha256: hashBytes(body),
      })
      const reread = await readRecord(
        input.objectPort,
        prefix,
        release.releaseRef,
      )
      if (!reread || reread.recordHash !== record.recordHash) {
        throw conflict('runtime_configuration_create_only_reread_mismatch')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        releaseRef: structuredClone(release.releaseRef),
        privateObjectTransportRef: transport
          ? structuredClone(transport.transportRef)
          : null,
        providerOrGpuJobStarted: false as const,
        billingWalletOrCreditAuthorityGranted: false as const,
      })
    },
    async rereadPrivateRelease(untrusted: ReleaseReadInput) {
      const { admission, target } = parseReadScope(untrusted)
      const record = await readRecord(
        input.objectPort,
        prefix,
        target.releaseRef,
      )
      if (!record) return null
      assertReleaseMatchesScope(record.release, admission, target)
      return structuredClone(record.release)
    },
    async rereadPrivateObjectTransport(untrusted: TransportReadInput) {
      assertPlainSerializedData(untrusted, 'gpu_private_transport_read')
      const request = z.object({
        admission: z.unknown(),
        target: z.unknown(),
        release: z.unknown(),
      }).strict().parse(untrusted)
      const admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
        request.admission,
      )
      const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget(
        request.target,
      )
      const release = assertCanonicalProfessionalGoogleCloudGpuRelease(
        request.release,
      )
      const record = await readRecord(
        input.objectPort,
        prefix,
        target.releaseRef,
      )
      if (!record) return null
      assertReleaseMatchesScope(record.release, admission, target)
      if (!same(record.release, release)) {
        throw conflict('runtime_release_argument_mismatch')
      }
      if (!record.privateObjectTransport) {
        throw conflict('private_object_transport_absent')
      }
      assertReleaseAndTransportBinding(
        record.release,
        record.privateObjectTransport,
      )
      return structuredClone(record.privateObjectTransport)
    },
  })
}

export function createCanonicalGcsProfessionalGoogleCloudGpuRuntimeConfigurationRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository {
  const projectId = input.projectId ?? PROJECT_ID
  if (projectId !== PROJECT_ID) {
    throw new Error('GPU runtime configuration requires project reeditpro.')
  }
  const storage = input.storage ?? new Storage({ projectId })
  return createCanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: input.bucketName ?? CONTROL_PLANE_STATE_BUCKET,
    }),
    prefix: input.prefix,
  })
}

function parseReadScope(untrusted: ReleaseReadInput): {
  admission: CanonicalProfessionalToolGpuDispatchAdmission
  target: CanonicalProfessionalGpuRuntimeLaunchTarget
} {
  assertPlainSerializedData(untrusted, 'gpu_runtime_configuration_read')
  const request = z.object({
    admission: z.unknown(),
    target: z.unknown(),
  }).strict().parse(untrusted)
  return {
    admission: assertCanonicalProfessionalToolGpuDispatchAdmission(
      request.admission,
    ),
    target: assertCanonicalProfessionalGpuRuntimeLaunchTarget(request.target),
  }
}

function assertReleaseMatchesScope(
  release: CanonicalProfessionalGoogleCloudGpuRelease,
  admission: CanonicalProfessionalToolGpuDispatchAdmission,
  target: CanonicalProfessionalGpuRuntimeLaunchTarget,
): void {
  if (!same(release.releaseRef, target.releaseRef)
    || !same(release.fixedServerTaskContractRef,
      target.fixedServerTaskContractRef)
    || !same(release.serviceIdentityRef, target.serviceIdentityRef)
    || !same(release.privateNetworkAndArtifactTransportRef,
      target.privateNetworkAndArtifactTransportRef)
    || !same(release.immutableImageRef, target.immutableImageRef)
    || release.toolId !== admission.toolId
    || release.operationId !== admission.operationId
    || release.routeId !== admission.routeId
    || release.routeId !== target.routeId
    || release.runtimeRegion !== target.runtimeRegion
    || release.executionTarget !== target.executionTarget
    || release.machineType !== target.machineType
    || release.accelerator !== target.accelerator
    || release.immutableImageDigest !== target.immutableImageDigest) {
    throw conflict('runtime_release_scope_mismatch')
  }
}

function assertReleaseAndTransportBinding(
  release: CanonicalProfessionalGoogleCloudGpuRelease,
  transport: CanonicalProfessionalGoogleCloudGpuPrivateObjectTransport | null,
): void {
  if (release.toolId === 'sam3_1' && !transport) {
    throw conflict('sam3_1_private_object_transport_required')
  }
  if (!transport) return
  const cloudRunJobResource = release.executionTarget ===
    'google_cloud_run_l4_job'
    ? release.cloudRunJobResource
    : null
  if (!same(transport.transportRef,
    release.privateNetworkAndArtifactTransportRef)
    || !same(transport.serviceIdentityRef, release.serviceIdentityRef)
    || transport.routeId !== release.routeId
    || transport.projectId !== release.projectId
    || transport.cloudRunJobResource !== cloudRunJobResource) {
    throw conflict('runtime_release_private_transport_mismatch')
  }
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
  releaseRef: CanonicalProfessionalGoogleCloudGpuRelease['releaseRef'],
): Promise<RuntimeConfigurationRecord | null> {
  const bytes = await port.readExact(recordPath(prefix, releaseRef))
  if (!bytes) return null
  if (!Buffer.isBuffer(bytes) || bytes.byteLength < 2
    || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('runtime_configuration_record_bytes_invalid')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw conflict('runtime_configuration_record_json_invalid')
  }
  assertPlainSerializedData(decoded, 'gpu_runtime_configuration_record')
  const record = recordSchema.parse(decoded)
  const { recordHash, ...payload } = record
  if (recordHash !== sha256AuthorityValue(payload)
    || stableAuthorityStringify(record) !== bytes.toString('utf8')
    || !same(record.release.releaseRef, releaseRef)) {
    throw conflict('runtime_configuration_record_exact_reread_invalid')
  }
  assertCanonicalProfessionalGoogleCloudGpuRelease(record.release)
  if (record.privateObjectTransport) {
    assertCanonicalProfessionalGoogleCloudGpuPrivateObjectTransport(
      record.privateObjectTransport,
    )
  }
  assertReleaseAndTransportBinding(
    record.release,
    record.privateObjectTransport,
  )
  return record
}

function recordPath(
  prefix: string,
  releaseRef: CanonicalProfessionalGoogleCloudGpuRelease['releaseRef'],
): string {
  return `${prefix}/${hashText(stableAuthorityStringify(releaseRef))}.json`
}

function serialize(value: unknown): Buffer {
  const bytes = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (bytes.byteLength < 2 || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('runtime_configuration_record_size_invalid')
  }
  return bytes
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('GPU runtime configuration object port is absent.')
  }
}

function same(left: unknown, right: unknown): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function hashText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(reason: string): Error {
  return new Error(`GPU runtime configuration repository: ${reason}.`)
}
