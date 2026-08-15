import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalProfessionalToolGpuRuntimeRelease,
  canonicalProfessionalToolGpuRuntimeReleaseSchema,
  type CanonicalProfessionalToolGpuRuntimeRelease,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  assertCanonicalSam31GpuRuntimeReleaseObservation,
  canonicalSam31GpuRuntimeReleaseObservationSchema,
  prepareCanonicalSam31GpuRuntimeRelease,
  type CanonicalSam31GpuRuntimeReleaseObservation,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-release'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_REGISTRY_VERSION =
  'canonical-sam3_1-gpu-runtime-release-registry-v1' as const
export const CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_REGISTRY_RECORD_VERSION =
  'canonical-sam3_1-gpu-runtime-release-registry-record-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX = 'private/sam3_1/gpu-runtime-releases/v1'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
])
const recordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_REGISTRY_RECORD_VERSION,
  ),
  source: z.literal('canonical_server_sam3_1_gpu_runtime_release_registry'),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('private_internal_qualified'),
  specializedRelease: canonicalSam31GpuRuntimeReleaseObservationSchema,
  runtimeRelease: canonicalProfessionalToolGpuRuntimeReleaseSchema,
  publishedAt: timestamp,
  exactSpecializedAndGenericReleasePairPersisted: z.literal(true),
  exactQualifiedArtifactRouteAndExpiryBound: z.literal(true),
  runtimeDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((record, context) => {
  if (!sameReleasePair(record.specializedRelease, record.runtimeRelease)
    || Date.parse(record.publishedAt) <
      Date.parse(record.runtimeRelease.qualifiedAt)
    || Date.parse(record.publishedAt) >=
      Date.parse(record.runtimeRelease.expiresAt)) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 release registry pair is inconsistent.',
    })
  }
})
const recordSchema = recordWithoutHashSchema.extend({
  recordHash: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict()
export type CanonicalSam31GpuRuntimeReleaseRegistryRecord = z.infer<
  typeof recordSchema
>
type ReleaseRef = z.infer<typeof refSchema>
type PrepareInput = Parameters<
  typeof prepareCanonicalSam31GpuRuntimeRelease
>[0]

export interface CanonicalSam31GpuRuntimeReleaseRegistry {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_REGISTRY_VERSION
  readonly evidenceClass: 'private_gcs_create_only_exact_reread'
  persistQualifiedReleasePairCreateOnly(input: {
    readonly record: CanonicalSam31GpuRuntimeReleaseRegistryRecord
  }): Promise<ReleaseRef>
  rereadReleasePair(input: {
    readonly runtimeReleaseRef: ReleaseRef
  }): Promise<CanonicalSam31GpuRuntimeReleaseRegistryRecord | null>
  rereadSpecializedRuntimeRelease(input: {
    readonly runtimeReleaseRef: ReleaseRef
  }): Promise<CanonicalSam31GpuRuntimeReleaseObservation | null>
  rereadQualifiedRuntimeRelease(input: {
    readonly toolId: string
    readonly operationId: string
    readonly routeId: z.infer<typeof routeIdSchema>
    readonly exactToolOrModelReleaseRef: ReleaseRef
    readonly at: string
  }): Promise<CanonicalProfessionalToolGpuRuntimeRelease | null>
}

export function createCanonicalSam31GpuRuntimeReleaseRegistry(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31GpuRuntimeReleaseRegistry {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const registry: CanonicalSam31GpuRuntimeReleaseRegistry = {
    schemaVersion: CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_REGISTRY_VERSION,
    evidenceClass: 'private_gcs_create_only_exact_reread',

    async persistQualifiedReleasePairCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_gpu_release_pair_persist')
      const request = z.object({ record: z.unknown() }).strict().parse(
        untrusted,
      )
      const record = assertRecord(request.record)
      const releaseRef = runtimeReleaseRef(record.runtimeRelease)
      const body = recordBody(record)
      await persistExact(input.objectPort,
        recordPath(prefix, releaseRef), body)
      for (const validityBucket of validityBuckets(
        record.runtimeRelease.qualifiedAt,
        record.runtimeRelease.expiresAt,
      )) {
        await persistExact(input.objectPort, lookupPath(prefix, {
          toolId: record.runtimeRelease.toolId,
          operationId: record.runtimeRelease.operationId,
          routeId: routeIdSchema.parse(record.runtimeRelease.routeId),
          exactToolOrModelReleaseRef:
            record.runtimeRelease.toolOrModelArtifactReleaseRef,
          validityBucket,
        }), body)
      }
      return releaseRef
    },

    async rereadReleasePair(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_gpu_release_pair_read')
      const request = z.object({ runtimeReleaseRef: refSchema }).strict()
        .parse(untrusted)
      const record = await readRecord(input.objectPort,
        recordPath(prefix, request.runtimeReleaseRef))
      if (!record) return null
      if (!sameRef(runtimeReleaseRef(record.runtimeRelease),
        request.runtimeReleaseRef)) throw conflict('release_ref_mismatch')
      return record
    },

    async rereadSpecializedRuntimeRelease(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_specialized_release_read')
      const request = z.object({ runtimeReleaseRef: refSchema }).strict()
        .parse(untrusted)
      const record = await registry.rereadReleasePair(request)
      return record ? record.specializedRelease : null
    },

    async rereadQualifiedRuntimeRelease(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_qualified_release_read')
      const request = z.object({
        toolId: safeId,
        operationId: safeId,
        routeId: routeIdSchema,
        exactToolOrModelReleaseRef: refSchema,
        at: timestamp,
      }).strict().parse(untrusted)
      const record = await readRecord(input.objectPort,
        lookupPath(prefix, {
          ...request,
          validityBucket: utcDayBucket(request.at),
        }))
      if (!record) return null
      const release = assertCanonicalProfessionalToolGpuRuntimeRelease(
        record.runtimeRelease,
        request.at,
      )
      if (release.toolId !== request.toolId
        || release.operationId !== request.operationId
        || release.routeId !== request.routeId
        || !sameRef(release.toolOrModelArtifactReleaseRef,
          request.exactToolOrModelReleaseRef)) {
        throw conflict('qualified_release_lookup_mismatch')
      }
      return release
    },
  }
  return Object.freeze(registry)
}

export function createCanonicalSam31GcpGpuRuntimeReleaseRegistry(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31GpuRuntimeReleaseRegistry {
  return createCanonicalSam31GpuRuntimeReleaseRegistry({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId: PROJECT_ID }),
      bucketName: CONTROL_PLANE_STATE_BUCKET,
    }),
  })
}

export interface CanonicalSam31GpuRuntimeReleaseOwner {
  readonly schemaVersion: 'canonical-sam3_1-gpu-runtime-release-owner-v1'
  readonly evidenceClass:
    'canonical_qualification_and_compilation_authority_exact_reread'
  preparePersistAndReread(input: PrepareInput): Promise<
    CanonicalSam31GpuRuntimeReleaseRegistryRecord
  >
}

export function createCanonicalSam31GpuRuntimeReleaseOwner(input: {
  readonly registry: CanonicalSam31GpuRuntimeReleaseRegistry
  readonly now?: () => string
}): CanonicalSam31GpuRuntimeReleaseOwner {
  if (typeof input.registry?.persistQualifiedReleasePairCreateOnly !==
    'function' || typeof input.registry?.rereadReleasePair !== 'function') {
    throw new Error('SAM 3.1 runtime release owner is invalid.')
  }
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: 'canonical-sam3_1-gpu-runtime-release-owner-v1' as const,
    evidenceClass:
      'canonical_qualification_and_compilation_authority_exact_reread' as const,

    async preparePersistAndReread(untrusted: PrepareInput) {
      const prepared = await prepareCanonicalSam31GpuRuntimeRelease(untrusted)
      const payload = recordWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_REGISTRY_RECORD_VERSION,
        source: 'canonical_server_sam3_1_gpu_runtime_release_registry',
        evidenceClass: 'canonical_private_reread',
        status: 'private_internal_qualified',
        specializedRelease: prepared.observation,
        runtimeRelease: prepared.runtimeRelease,
        publishedAt: z.string().datetime({ offset: true }).parse(now()),
        exactSpecializedAndGenericReleasePairPersisted: true,
        exactQualifiedArtifactRouteAndExpiryBound: true,
        runtimeDispatched: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
      })
      const record = assertRecord({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const persistedRef = await input.registry
        .persistQualifiedReleasePairCreateOnly({ record })
      const expectedRef = runtimeReleaseRef(record.runtimeRelease)
      if (!sameRef(persistedRef, expectedRef)) {
        throw conflict('release_persistence_reference_mismatch')
      }
      const reread = await input.registry.rereadReleasePair({
        runtimeReleaseRef: expectedRef,
      })
      if (!reread || reread.recordHash !== record.recordHash) {
        throw conflict('release_pair_exact_reread_failed')
      }
      return reread
    },
  })
}

export function assertCanonicalSam31GpuRuntimeReleaseRegistryRecord(
  value: unknown,
): CanonicalSam31GpuRuntimeReleaseRegistryRecord {
  return assertRecord(value)
}

export function canonicalSam31GpuRuntimeReleaseRef(
  value: CanonicalProfessionalToolGpuRuntimeRelease,
): ReleaseRef {
  return runtimeReleaseRef(value)
}

function assertRecord(
  value: unknown,
): CanonicalSam31GpuRuntimeReleaseRegistryRecord {
  assertPlainSerializedData(value, 'sam31_gpu_release_registry_record')
  const record = recordSchema.parse(value)
  const { recordHash, ...payload } = record
  if (recordHash !== sha256AuthorityValue(payload)) {
    throw conflict('release_registry_record_hash_mismatch')
  }
  assertCanonicalSam31GpuRuntimeReleaseObservation(record.specializedRelease)
  assertCanonicalProfessionalToolGpuRuntimeRelease(record.runtimeRelease)
  return record
}

function sameReleasePair(
  specialized: CanonicalSam31GpuRuntimeReleaseObservation,
  generic: CanonicalProfessionalToolGpuRuntimeRelease,
): boolean {
  return specialized.evidenceClass === 'canonical_private_reread'
    && specialized.status === 'private_internal_qualified'
    && specialized.authority.privateInternalQualified
    && generic.evidenceClass === 'canonical_private_reread'
    && generic.status === 'private_internal_qualified'
    && generic.privateInternalQualified
    && specialized.releaseId === generic.releaseId
    && specialized.releaseVersion === generic.releaseVersion
    && specialized.toolId === generic.toolId
    && specialized.operationId === generic.operationId
    && specialized.route.routeId === generic.routeId
    && specialized.route.runtimeRegion === generic.runtimeRegion
    && specialized.route.executionTarget === generic.executionTarget
    && specialized.route.machineType === generic.machineType
    && specialized.route.accelerator === generic.accelerator
    && sameRef(specialized.serviceIdentityRef, generic.serviceIdentityRef)
    && sameRef(specialized.immutableImageRef, generic.immutableImageRef)
    && specialized.immutableImageDigest === generic.immutableImageDigest
    && sameRef(specialized.sourceAndDependencyClosureRef,
      generic.sourceAndDependencyClosureRef)
    && sameRef(specialized.privateArtifactIngestReceiptRef,
      generic.toolOrModelArtifactReleaseRef)
    && sameRef(specialized.sbomRef, generic.sbomRef)
    && specialized.imageSupplyChainReleaseRef !== null
    && sameRef(specialized.imageSupplyChainReleaseRef,
      generic.imageScanAndSignatureRef)
    && sameRef(
      specialized.qualification.cudaDriverRuntimeQualificationRef,
      generic.cudaDriverRuntimeQualificationRef,
    )
    && sameRef(
      specialized.qualification.substantiveGpuExecutionQualificationRef,
      generic.substantiveGpuExecutionQualificationRef,
    )
    && sameRef(specialized.scaleToZeroConfigurationRef,
      generic.scaleToZeroConfigurationRef)
    && sameRef(specialized.privateNetworkAndArtifactTransportRef,
      generic.privateNetworkAndArtifactTransportRef)
    && specialized.qualifiedAt === generic.qualifiedAt
    && specialized.expiresAt === generic.expiresAt
}

function runtimeReleaseRef(
  release: CanonicalProfessionalToolGpuRuntimeRelease,
): ReleaseRef {
  const parsed = assertCanonicalProfessionalToolGpuRuntimeRelease(release)
  return refSchema.parse({
    id: parsed.releaseId,
    version: parsed.releaseVersion,
    contentHash: `sha256:${parsed.releaseHash}`,
  })
}

function recordPath(prefix: string, ref: ReleaseRef): string {
  return `${prefix}/records/${hashKey(ref)}.json`
}

function lookupPath(prefix: string, input: {
  toolId: string
  operationId: string
  routeId: z.infer<typeof routeIdSchema>
  exactToolOrModelReleaseRef: ReleaseRef
  validityBucket: string
}): string {
  return `${prefix}/lookup/${hashKey({
    toolId: safeId.parse(input.toolId),
    operationId: safeId.parse(input.operationId),
    routeId: routeIdSchema.parse(input.routeId),
    exactToolOrModelReleaseRef:
      refSchema.parse(input.exactToolOrModelReleaseRef),
    validityBucket: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u)
      .parse(input.validityBucket),
  })}.json`
}

function validityBuckets(qualifiedAt: string, expiresAt: string): string[] {
  const qualified = Date.parse(timestamp.parse(qualifiedAt))
  const expires = Date.parse(timestamp.parse(expiresAt))
  const oneDay = 86_400_000
  if (expires <= qualified || expires - qualified > 93 * oneDay) {
    throw conflict('release_validity_window_invalid')
  }
  const first = Math.floor(qualified / oneDay) * oneDay
  const result: string[] = []
  for (let cursor = first; cursor < expires; cursor += oneDay) {
    result.push(new Date(cursor).toISOString().slice(0, 10))
  }
  return result
}

function utcDayBucket(value: string): string {
  return new Date(Date.parse(timestamp.parse(value))).toISOString().slice(0, 10)
}

function hashKey(value: unknown): string {
  return createHash('sha256')
    .update(stableAuthorityStringify(value), 'utf8').digest('hex')
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  body: Buffer,
): Promise<void> {
  const result = await port.createOnly({
    objectPath: path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  if (result === 'already_exists') {
    const existing = await port.readExact(path)
    if (!existing || !existing.equals(body)) {
      throw conflict('create_only_collision')
    }
  } else if (result !== 'created') {
    throw conflict('create_only_persistence_failed')
  }
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw conflict('create_only_exact_reread_failed')
  }
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
): Promise<CanonicalSam31GpuRuntimeReleaseRegistryRecord | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('release_registry_record_size_invalid')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('release_registry_record_json_invalid')
  }
  const record = assertRecord(value)
  if (!recordBody(record).equals(body)) {
    throw conflict('release_registry_record_not_canonical')
  }
  return record
}

function recordBody(
  record: CanonicalSam31GpuRuntimeReleaseRegistryRecord,
): Buffer {
  const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
  if (body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('release_registry_record_too_large')
  }
  return body
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (typeof port?.createOnly !== 'function'
    || typeof port?.readExact !== 'function') {
    throw new Error('SAM 3.1 runtime release object port is invalid.')
  }
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function conflict(code: string): Error {
  return new Error(`SAM 3.1 runtime release registry conflict: ${code}`)
}
