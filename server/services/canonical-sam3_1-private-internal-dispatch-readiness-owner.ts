import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertCanonicalProfessionalToolGpuRuntimeRelease,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  assertCanonicalProfessionalGoogleCloudGpuRateAuthority,
  isCanonicalVertexA100ServingRateAuthority,
} from '../tool-cost-metering/canonical-professional-google-cloud-gpu-rate-authority'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  assertCanonicalSam31GpuRuntimeReleaseReadinessObservation,
} from './canonical-sam3_1-gpu-runtime-release-readiness-observer'
import {
  assertCanonicalSam31PrivateInternalReleaseReadiness,
} from './canonical-sam3_1-private-internal-release-readiness-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_PRIVATE_INTERNAL_DISPATCH_READINESS_VERSION =
  'canonical-sam3_1-private-internal-dispatch-readiness-v1' as const
export const CANONICAL_SAM3_1_PRIVATE_INTERNAL_DISPATCH_READINESS_OWNER_VERSION =
  'canonical-sam3_1-private-internal-dispatch-readiness-owner-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/private-internal-dispatch-readiness'
const MAXIMUM_RECORD_BYTES = 1024 * 1024

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const requestSchema = z.object({
  readinessId: safeId,
  privateInternalReleaseReadiness: z.unknown(),
  a100RouteReadinessObservation: z.unknown(),
  l4RouteReadinessObservation: z.unknown(),
  a100RuntimeRelease: z.unknown(),
  l4RuntimeRelease: z.unknown(),
  currentA100RateAuthority: z.unknown(),
  currentL4RateAuthority: z.unknown(),
  observedAt: timestamp,
  expiresAt: timestamp,
}).strict()

const readinessWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_INTERNAL_DISPATCH_READINESS_VERSION,
  ),
  ownerVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_INTERNAL_DISPATCH_READINESS_OWNER_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_private_internal_dispatch_readiness_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_exact_release_rate_capacity_and_component_reread',
  ),
  status: z.literal('ready_for_private_internal_sequential_dispatch'),
  readinessId: safeId,
  privateInternalReleaseReadinessRef: refSchema,
  a100RouteQualificationObservationRef: refSchema,
  l4RouteQualificationObservationRef: refSchema,
  a100RuntimeReleaseRef: refSchema,
  l4RuntimeReleaseRef: refSchema,
  currentA100RateAuthorityRef: refSchema,
  currentL4RateAuthorityRef: refSchema,
  a100ImmutableImageDigest: prefixedSha256,
  l4ImmutableImageDigest: prefixedSha256,
  maximumSimultaneousPrivateA100Attempts: z.literal(1),
  maximumSimultaneousPrivateL4Attempts: z.literal(1),
  qualificationAttemptsMustRunSequentially: z.literal(true),
  exactFourComponentA100AndL4QualificationReread: z.literal(true),
  exactPrivateInternalRuntimeReleasePairReread: z.literal(true),
  exactAccountEffectiveA100AndL4RatePairReread: z.literal(true),
  automaticQualityReductionAllowed: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  a100HeavyPrimary: z.literal(true),
  l4SeparatelyQualifiedQualityPreservingFallbackOnly: z.literal(true),
  minimumIdleGpuInstances: z.literal(0),
  userTriggeredScaleFromZeroRequired: z.literal(true),
  privateInternalSequentialDispatchAuthorized: z.literal(true),
  publicConcurrencyCapacityRequired: z.literal(false),
  publicConcurrencyA100Target: z.literal(16),
  publicConcurrencyL4Target: z.literal(16),
  productionConcurrencyIsSeparateFutureReleaseGate: z.literal(true),
  customerOrPublicDispatchAuthorized: z.literal(false),
  callerReleaseRateCapacityOrQualificationClaimsAccepted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expiresAt) <= Date.parse(value.observedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 private dispatch readiness is not current.',
    })
  }
})

export const canonicalSam31PrivateInternalDispatchReadinessSchema =
  readinessWithoutHashSchema.extend({ readinessHash: sha256 }).strict()
export type CanonicalSam31PrivateInternalDispatchReadiness = z.infer<
  typeof canonicalSam31PrivateInternalDispatchReadinessSchema
>

export interface CanonicalSam31PrivateInternalDispatchReadinessReadPort {
  readonly schemaVersion:
    'canonical-sam3_1-private-internal-dispatch-readiness-read-port-v1'
  readonly privateInternalOnly: true
  readonly customerOrPublicDispatchAuthorized: false
  rereadCurrent(input: {
    readonly runtimeReleaseRef: z.infer<typeof refSchema>
    readonly rateAuthorityRef: z.infer<typeof refSchema>
    readonly at: string
  }): Promise<unknown | null>
}

export interface CanonicalSam31PrivateInternalDispatchReadinessRepository {
  readonly schemaVersion:
    'canonical-sam3_1-private-internal-dispatch-readiness-repository-v1'
  readonly privateInternalOnly: true
  readonly customerOrPublicDispatchAuthorized: false
  persistCreateOnly(input: {
    readonly readiness: CanonicalSam31PrivateInternalDispatchReadiness
  }): Promise<'created' | 'identical_replay'>
  rereadCurrent(input: {
    readonly runtimeReleaseRef: z.infer<typeof refSchema>
    readonly rateAuthorityRef: z.infer<typeof refSchema>
    readonly at: string
  }): Promise<CanonicalSam31PrivateInternalDispatchReadiness | null>
}

export function createCanonicalSam31PrivateInternalDispatchReadinessOwner() {
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRIVATE_INTERNAL_DISPATCH_READINESS_OWNER_VERSION,
    privateInternalOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    observe(untrusted: unknown):
    CanonicalSam31PrivateInternalDispatchReadiness {
      assertPlainSerializedData(untrusted,
        'sam31_private_internal_dispatch_readiness')
      const request = requestSchema.parse(untrusted)
      const privateReadiness =
        assertCanonicalSam31PrivateInternalReleaseReadiness(
          request.privateInternalReleaseReadiness,
        )
      const a100Observation =
        assertCanonicalSam31GpuRuntimeReleaseReadinessObservation(
          request.a100RouteReadinessObservation,
        )
      const l4Observation =
        assertCanonicalSam31GpuRuntimeReleaseReadinessObservation(
          request.l4RouteReadinessObservation,
        )
      const a100Release = assertCanonicalProfessionalToolGpuRuntimeRelease(
        request.a100RuntimeRelease,
        request.observedAt,
      )
      const l4Release = assertCanonicalProfessionalToolGpuRuntimeRelease(
        request.l4RuntimeRelease,
        request.observedAt,
      )
      const a100Rate = assertCanonicalProfessionalGoogleCloudGpuRateAuthority(
        request.currentA100RateAuthority,
        request.observedAt,
      )
      const l4Rate = assertCanonicalProfessionalGoogleCloudGpuRateAuthority(
        request.currentL4RateAuthority,
        request.observedAt,
      )
      const a100ObservationRef = observationRef(a100Observation)
      const l4ObservationRef = observationRef(l4Observation)
      if (
        !privateReadiness.privateInternalReleasePublicationMayProceed
        || privateReadiness.status !==
          'ready_for_private_internal_runtime_release_publication'
        || Date.parse(request.observedAt) <
          Date.parse(privateReadiness.observedAt)
        || !sameRef(privateReadiness.a100RouteQualificationObservationRef,
          a100ObservationRef)
        || !sameRef(privateReadiness.l4RouteQualificationObservationRef,
          l4ObservationRef)
        || a100Observation.routeId !== 'a100_80gb_heavy_primary'
        || l4Observation.routeId !== 'l4_heavy_fallback'
        || a100Release.toolId !== 'sam3_1'
        || l4Release.toolId !== 'sam3_1'
        || a100Release.operationId !== CANONICAL_SAM3_1_OPERATION_ID
        || l4Release.operationId !== CANONICAL_SAM3_1_OPERATION_ID
        || a100Release.routeId !== 'a100_80gb_heavy_primary'
        || l4Release.routeId !== 'l4_heavy_fallback'
        || a100Release.immutableImageDigest !==
          a100Observation.immutableImageDigest
        || l4Release.immutableImageDigest !== l4Observation.immutableImageDigest
        || !isCanonicalVertexA100ServingRateAuthority(a100Rate)
        || a100Rate.routeId !== 'a100_80gb_heavy_primary'
        || l4Rate.routeId !== 'l4_heavy_fallback'
        || l4Rate.executionTarget !== 'google_cloud_run_l4_job'
        || Date.parse(request.expiresAt) > Date.parse(a100Release.expiresAt)
        || Date.parse(request.expiresAt) > Date.parse(l4Release.expiresAt)
      ) throw new TypeError(
        'SAM 3.1 private dispatch lost exact release, rate, or qualification lineage.',
      )
      const payload = readinessWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_PRIVATE_INTERNAL_DISPATCH_READINESS_VERSION,
        ownerVersion:
          CANONICAL_SAM3_1_PRIVATE_INTERNAL_DISPATCH_READINESS_OWNER_VERSION,
        source:
          'canonical_server_sam3_1_private_internal_dispatch_readiness_owner',
        evidenceClass:
          'canonical_private_exact_release_rate_capacity_and_component_reread',
        status: 'ready_for_private_internal_sequential_dispatch',
        readinessId: request.readinessId,
        privateInternalReleaseReadinessRef: ref(
          privateReadiness.readinessId,
          privateReadiness.readinessHash,
        ),
        a100RouteQualificationObservationRef: a100ObservationRef,
        l4RouteQualificationObservationRef: l4ObservationRef,
        a100RuntimeReleaseRef: runtimeReleaseRef(a100Release),
        l4RuntimeReleaseRef: runtimeReleaseRef(l4Release),
        currentA100RateAuthorityRef: rateRef(a100Rate),
        currentL4RateAuthorityRef: rateRef(l4Rate),
        a100ImmutableImageDigest: a100Release.immutableImageDigest,
        l4ImmutableImageDigest: l4Release.immutableImageDigest,
        maximumSimultaneousPrivateA100Attempts: 1,
        maximumSimultaneousPrivateL4Attempts: 1,
        qualificationAttemptsMustRunSequentially: true,
        exactFourComponentA100AndL4QualificationReread: true,
        exactPrivateInternalRuntimeReleasePairReread: true,
        exactAccountEffectiveA100AndL4RatePairReread: true,
        automaticQualityReductionAllowed: false,
        cpuOnlySubstantiveExecutionAllowed: false,
        a100HeavyPrimary: true,
        l4SeparatelyQualifiedQualityPreservingFallbackOnly: true,
        minimumIdleGpuInstances: 0,
        userTriggeredScaleFromZeroRequired: true,
        privateInternalSequentialDispatchAuthorized: true,
        publicConcurrencyCapacityRequired: false,
        publicConcurrencyA100Target: 16,
        publicConcurrencyL4Target: 16,
        productionConcurrencyIsSeparateFutureReleaseGate: true,
        customerOrPublicDispatchAuthorized: false,
        callerReleaseRateCapacityOrQualificationClaimsAccepted: false,
        gpuJobDispatched: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        observedAt: request.observedAt,
        expiresAt: request.expiresAt,
      })
      return assertCanonicalSam31PrivateInternalDispatchReadiness({
        ...payload,
        readinessHash: sha256AuthorityValue(payload),
      })
    },
  })
}

export function assertCanonicalSam31PrivateInternalDispatchReadiness(
  value: unknown,
  at?: string,
): CanonicalSam31PrivateInternalDispatchReadiness {
  assertPlainSerializedData(value,
    'sam31_private_internal_dispatch_readiness_result')
  const parsed = canonicalSam31PrivateInternalDispatchReadinessSchema
    .parse(value)
  const { readinessHash, ...payload } = parsed
  if (readinessHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('SAM 3.1 private dispatch readiness digest changed.')
  }
  if (at && (Date.parse(timestamp.parse(at)) < Date.parse(parsed.observedAt)
    || Date.parse(at) >= Date.parse(parsed.expiresAt))) {
    throw new TypeError('SAM 3.1 private dispatch readiness is stale.')
  }
  return Object.freeze(structuredClone(parsed))
}

export function assertCanonicalSam31PrivateInternalDispatchAllowed(input: {
  readonly readiness: unknown
  readonly routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback'
  readonly runtimeReleaseRef: z.infer<typeof refSchema>
  readonly rateAuthorityRef: z.infer<typeof refSchema>
  readonly immutableImageDigest: string
  readonly at: string
}): CanonicalSam31PrivateInternalDispatchReadiness {
  const readiness = assertCanonicalSam31PrivateInternalDispatchReadiness(
    input.readiness,
    input.at,
  )
  const runtimeReleaseRef = input.routeId === 'a100_80gb_heavy_primary'
    ? readiness.a100RuntimeReleaseRef
    : readiness.l4RuntimeReleaseRef
  const rateAuthorityRef = input.routeId === 'a100_80gb_heavy_primary'
    ? readiness.currentA100RateAuthorityRef
    : readiness.currentL4RateAuthorityRef
  const immutableImageDigest = input.routeId === 'a100_80gb_heavy_primary'
    ? readiness.a100ImmutableImageDigest
    : readiness.l4ImmutableImageDigest
  if (!sameRef(runtimeReleaseRef, input.runtimeReleaseRef)
    || !sameRef(rateAuthorityRef, input.rateAuthorityRef)
    || immutableImageDigest !== input.immutableImageDigest
    || !readiness.privateInternalSequentialDispatchAuthorized
    || readiness.customerOrPublicDispatchAuthorized) {
    throw new TypeError(
      'SAM 3.1 private dispatch readiness does not match this attempt.',
    )
  }
  return readiness
}

export function createCanonicalSam31PrivateInternalDispatchReadinessRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31PrivateInternalDispatchReadinessRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw new TypeError('SAM 3.1 private dispatch readiness store is absent.')
  }
  const prefix = z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
    .refine((value) => !value.includes('..')
      && !value.includes('//') && !value.endsWith('/'))
    .parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (request: {
    readonly runtimeReleaseRef: z.infer<typeof refSchema>
    readonly rateAuthorityRef: z.infer<typeof refSchema>
    readonly at: string
  }) => {
    const runtimeReleaseRef = refSchema.parse(request.runtimeReleaseRef)
    const rateAuthorityRef = refSchema.parse(request.rateAuthorityRef)
    const at = timestamp.parse(request.at)
    const index = indexKey(runtimeReleaseRef, rateAuthorityRef)
    const body = await input.objectPort.readExact(`${prefix}/${index}.json`)
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw new TypeError('SAM 3.1 private dispatch readiness bytes changed.')
    }
    const readiness = assertCanonicalSam31PrivateInternalDispatchReadiness(
      JSON.parse(body.toString('utf8')) as unknown,
      at,
    )
    const matchesA100 = sameRef(runtimeReleaseRef,
      readiness.a100RuntimeReleaseRef)
      && sameRef(rateAuthorityRef, readiness.currentA100RateAuthorityRef)
    const matchesL4 = sameRef(runtimeReleaseRef, readiness.l4RuntimeReleaseRef)
      && sameRef(rateAuthorityRef, readiness.currentL4RateAuthorityRef)
    if ((!matchesA100 && !matchesL4)
      || stableAuthorityStringify(readiness) !== body.toString('utf8')) {
      throw new TypeError('SAM 3.1 private dispatch readiness index changed.')
    }
    return readiness
  }
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-private-internal-dispatch-readiness-repository-v1' as const,
    privateInternalOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    async persistCreateOnly({ readiness: untrusted }: {
      readonly readiness: CanonicalSam31PrivateInternalDispatchReadiness
    }) {
      const readiness = assertCanonicalSam31PrivateInternalDispatchReadiness(
        untrusted,
      )
      const body = Buffer.from(stableAuthorityStringify(readiness), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw new TypeError('SAM 3.1 private dispatch readiness is too large.')
      }
      const indexes = [
        indexKey(readiness.a100RuntimeReleaseRef,
          readiness.currentA100RateAuthorityRef),
        indexKey(readiness.l4RuntimeReleaseRef,
          readiness.currentL4RateAuthorityRef),
      ]
      let created = false
      for (const index of indexes) {
        const disposition = await input.objectPort.createOnly({
          objectPath: `${prefix}/${index}.json`,
          body,
          contentSha256: createHash('sha256').update(body).digest('hex'),
        })
        created ||= disposition === 'created'
      }
      const [a100, l4] = await Promise.all([
        reread({ runtimeReleaseRef: readiness.a100RuntimeReleaseRef,
          rateAuthorityRef: readiness.currentA100RateAuthorityRef,
          at: readiness.observedAt }),
        reread({ runtimeReleaseRef: readiness.l4RuntimeReleaseRef,
          rateAuthorityRef: readiness.currentL4RateAuthorityRef,
          at: readiness.observedAt }),
      ])
      if (!a100 || !l4 || a100.readinessHash !== readiness.readinessHash
        || l4.readinessHash !== readiness.readinessHash) {
        throw new TypeError('SAM 3.1 private dispatch readiness reread changed.')
      }
      return created ? 'created' as const : 'identical_replay' as const
    },
    rereadCurrent: reread,
  })
}

export function createCanonicalSam31PrivateInternalDispatchReadPort(
  repository: Pick<
    CanonicalSam31PrivateInternalDispatchReadinessRepository,
    'rereadCurrent'
  >,
): CanonicalSam31PrivateInternalDispatchReadinessReadPort {
  if (typeof repository?.rereadCurrent !== 'function') {
    throw new TypeError('SAM 3.1 private dispatch readiness read is absent.')
  }
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-private-internal-dispatch-readiness-read-port-v1' as const,
    privateInternalOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    rereadCurrent: repository.rereadCurrent.bind(repository),
  })
}

function observationRef(value: ReturnType<
  typeof assertCanonicalSam31GpuRuntimeReleaseReadinessObservation
>) {
  return ref(
    `${value.qualificationId}:${value.routeId}:component-readiness`,
    sha256AuthorityValue(value),
  )
}

function runtimeReleaseRef(value: ReturnType<
  typeof assertCanonicalProfessionalToolGpuRuntimeRelease
>) {
  return ref(value.releaseId, value.releaseHash, value.releaseVersion)
}

function rateRef(value: ReturnType<
  typeof assertCanonicalProfessionalGoogleCloudGpuRateAuthority
>) {
  return ref(
    value.rateAuthorityId,
    value.rateAuthorityHash,
    value.rateAuthorityVersion,
  )
}

function ref(id: string, hash: string, version = 1) {
  return refSchema.parse({
    id,
    version,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameRef(
  left: z.infer<typeof refSchema>,
  right: z.infer<typeof refSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function indexKey(
  runtimeReleaseRef: z.infer<typeof refSchema>,
  rateAuthorityRef: z.infer<typeof refSchema>,
) {
  return createHash('sha256').update(stableAuthorityStringify({
    runtimeReleaseRef,
    rateAuthorityRef,
  })).digest('hex')
}
