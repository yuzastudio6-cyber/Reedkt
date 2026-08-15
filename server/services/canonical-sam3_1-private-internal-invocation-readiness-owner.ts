import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31PrivateInternalDispatchReadiness,
} from './canonical-sam3_1-private-internal-dispatch-readiness-owner'
import {
  assertCanonicalSam31VertexServingDeploymentReady,
} from './canonical-sam3_1-vertex-serving-invocation-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_PRIVATE_INTERNAL_INVOCATION_READINESS_VERSION =
  'canonical-sam3_1-private-internal-invocation-readiness-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/private-internal-invocation-readiness'
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
type Ref = z.infer<typeof refSchema>

const requestSchema = z.object({
  readinessId: safeId,
  privateInternalDispatchReadiness: z.unknown(),
  vertexServingDeploymentReadiness: z.unknown(),
  observedAt: timestamp,
  expiresAt: timestamp,
}).strict()

const readinessWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_INTERNAL_INVOCATION_READINESS_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_private_internal_invocation_readiness_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_dispatch_release_rate_and_endpoint_reread',
  ),
  status: z.literal('ready_for_private_internal_dedicated_endpoint_invocation'),
  readinessId: safeId,
  privateInternalDispatchReadinessRef: refSchema,
  vertexServingDeploymentReadinessRef: refSchema,
  endpointDeploymentRef: refSchema,
  runtimeReleaseRef: refSchema,
  currentRateAuthorityRef: refSchema,
  immutableImageDigest: prefixedSha256,
  routeId: z.literal('a100_80gb_heavy_primary'),
  accelerator: z.literal('nvidia_a100_80gb'),
  maximumConcurrentPrivateInvocations: z.literal(1),
  minimumIdleGpuInstances: z.literal(0),
  exactPrivateDispatchReleaseRateAndEndpointReread: z.literal(true),
  userTriggeredScaleFromZeroRequired: z.literal(true),
  privateInternalInvocationAuthorized: z.literal(true),
  customerOrPublicDispatchAuthorized: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  callerEndpointModelImageCommandOrPriceAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expiresAt) <= Date.parse(value.observedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 private invocation readiness is not current.',
    })
  }
})

export const canonicalSam31PrivateInternalInvocationReadinessSchema =
  readinessWithoutHashSchema.extend({ readinessHash: sha256 }).strict()
export type CanonicalSam31PrivateInternalInvocationReadiness = z.infer<
  typeof canonicalSam31PrivateInternalInvocationReadinessSchema
>

export interface CanonicalSam31PrivateInternalInvocationReadPort {
  readonly schemaVersion:
    'canonical-sam3_1-private-internal-invocation-read-port-v1'
  readonly privateInternalOnly: true
  readonly customerOrPublicDispatchAuthorized: false
  rereadCurrent(input: {
    readonly runtimeReleaseRef: Ref
    readonly rateAuthorityRef: Ref
    readonly at: string
  }): Promise<unknown | null>
}

export interface CanonicalSam31PrivateInternalInvocationReadinessRepository {
  readonly schemaVersion:
    'canonical-sam3_1-private-internal-invocation-readiness-repository-v1'
  readonly privateInternalOnly: true
  readonly customerOrPublicDispatchAuthorized: false
  persistCreateOnly(input: {
    readonly readiness: CanonicalSam31PrivateInternalInvocationReadiness
  }): Promise<'created' | 'already_exists'>
  rereadCurrent(input: {
    readonly runtimeReleaseRef: Ref
    readonly rateAuthorityRef: Ref
    readonly at: string
  }): Promise<unknown | null>
}

export function createCanonicalSam31PrivateInternalInvocationReadinessOwner() {
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-private-internal-invocation-readiness-owner-v1' as const,
    privateInternalOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    observe(untrusted: unknown):
    CanonicalSam31PrivateInternalInvocationReadiness {
      assertPlainSerializedData(untrusted,
        'sam31_private_internal_invocation_readiness')
      const request = requestSchema.parse(untrusted)
      const privateReadiness =
        assertCanonicalSam31PrivateInternalDispatchReadiness(
          request.privateInternalDispatchReadiness,
          request.observedAt,
        )
      const endpointReadiness =
        assertCanonicalSam31VertexServingDeploymentReady(
          request.vertexServingDeploymentReadiness,
          request.observedAt,
        )
      const exact = sameRef(privateReadiness.a100RuntimeReleaseRef,
        endpointReadiness.runtimeReleaseRef)
        && privateReadiness.a100ImmutableImageDigest ===
          endpointReadiness.immutableImageDigest
        && Date.parse(request.expiresAt) <=
          Date.parse(privateReadiness.expiresAt)
        && Date.parse(request.expiresAt) <=
          Date.parse(endpointReadiness.expiresAt)
      if (!exact) throw new TypeError(
        'SAM 3.1 private dispatch and endpoint readiness do not match.',
      )
      const payload = readinessWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_PRIVATE_INTERNAL_INVOCATION_READINESS_VERSION,
        source:
          'canonical_server_sam3_1_private_internal_invocation_readiness_owner',
        evidenceClass:
          'canonical_private_dispatch_release_rate_and_endpoint_reread',
        status:
          'ready_for_private_internal_dedicated_endpoint_invocation',
        readinessId: request.readinessId,
        privateInternalDispatchReadinessRef: ref(
          privateReadiness.readinessId,
          privateReadiness.readinessHash,
        ),
        vertexServingDeploymentReadinessRef: ref(
          endpointReadiness.endpointDeploymentRef.id,
          endpointReadiness.readinessHash,
        ),
        endpointDeploymentRef: endpointReadiness.endpointDeploymentRef,
        runtimeReleaseRef: privateReadiness.a100RuntimeReleaseRef,
        currentRateAuthorityRef:
          privateReadiness.currentA100RateAuthorityRef,
        immutableImageDigest: privateReadiness.a100ImmutableImageDigest,
        routeId: 'a100_80gb_heavy_primary',
        accelerator: 'nvidia_a100_80gb',
        maximumConcurrentPrivateInvocations: 1,
        minimumIdleGpuInstances: 0,
        exactPrivateDispatchReleaseRateAndEndpointReread: true,
        userTriggeredScaleFromZeroRequired: true,
        privateInternalInvocationAuthorized: true,
        customerOrPublicDispatchAuthorized: false,
        automaticRetryAllowed: false,
        callerEndpointModelImageCommandOrPriceAccepted: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        observedAt: request.observedAt,
        expiresAt: request.expiresAt,
      })
      return assertCanonicalSam31PrivateInternalInvocationReadiness({
        ...payload,
        readinessHash: sha256AuthorityValue(payload),
      }, request.observedAt)
    },
  })
}

export function createCanonicalSam31PrivateInternalInvocationReadinessRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31PrivateInternalInvocationReadinessRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw new TypeError('SAM 3.1 private invocation readiness store is absent.')
  }
  const prefix = z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
    .refine((value) => !value.includes('..')
      && !value.includes('//') && !value.endsWith('/'))
    .parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (request: {
    readonly runtimeReleaseRef: Ref
    readonly rateAuthorityRef: Ref
    readonly at: string
  }) => {
    const query = z.object({
      runtimeReleaseRef: refSchema,
      rateAuthorityRef: refSchema,
      at: timestamp,
    }).strict().parse(request)
    const body = await input.objectPort.readExact(
      `${prefix}/${indexKey(query)}.json`,
    )
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw new TypeError('SAM 3.1 private invocation readiness bytes changed.')
    }
    const readiness = assertCanonicalSam31PrivateInternalInvocationReadiness(
      JSON.parse(body.toString('utf8')) as unknown,
      query.at,
    )
    if (!sameRef(readiness.runtimeReleaseRef, query.runtimeReleaseRef)
      || !sameRef(readiness.currentRateAuthorityRef, query.rateAuthorityRef)
      || stableAuthorityStringify(readiness) !== body.toString('utf8')) {
      throw new TypeError('SAM 3.1 private invocation readiness index changed.')
    }
    return readiness
  }
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-private-internal-invocation-readiness-repository-v1' as const,
    privateInternalOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    async persistCreateOnly({ readiness: untrusted }: {
      readonly readiness: CanonicalSam31PrivateInternalInvocationReadiness
    }) {
      const readiness =
        assertCanonicalSam31PrivateInternalInvocationReadiness(untrusted)
      const body = Buffer.from(stableAuthorityStringify(readiness), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw new TypeError('SAM 3.1 private invocation readiness is too large.')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: `${prefix}/${indexKey({
          runtimeReleaseRef: readiness.runtimeReleaseRef,
          rateAuthorityRef: readiness.currentRateAuthorityRef,
        })}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const exact = await reread({
        runtimeReleaseRef: readiness.runtimeReleaseRef,
        rateAuthorityRef: readiness.currentRateAuthorityRef,
        at: readiness.observedAt,
      })
      if (!exact || exact.readinessHash !== readiness.readinessHash) {
        throw new TypeError('SAM 3.1 private invocation readiness reread changed.')
      }
      return disposition
    },
    rereadCurrent: reread,
  })
}

export function createCanonicalSam31PrivateInternalInvocationReadPort(
  repository: Pick<
    CanonicalSam31PrivateInternalInvocationReadinessRepository,
    'rereadCurrent'
  >,
): CanonicalSam31PrivateInternalInvocationReadPort {
  if (typeof repository?.rereadCurrent !== 'function') {
    throw new TypeError('SAM 3.1 private invocation readiness read is absent.')
  }
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-private-internal-invocation-read-port-v1' as const,
    privateInternalOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    rereadCurrent: repository.rereadCurrent.bind(repository),
  })
}

export function assertCanonicalSam31PrivateInternalInvocationReadiness(
  value: unknown,
  at?: string,
): CanonicalSam31PrivateInternalInvocationReadiness {
  assertPlainSerializedData(value,
    'sam31_private_internal_invocation_readiness_record')
  const readiness =
    canonicalSam31PrivateInternalInvocationReadinessSchema.parse(value)
  const { readinessHash, ...payload } = readiness
  if (readinessHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(readiness.observedAt)
      || Date.parse(at) >= Date.parse(readiness.expiresAt)
    ))) {
    throw new TypeError('SAM 3.1 private invocation readiness is invalid.')
  }
  return Object.freeze(structuredClone(readiness))
}

function indexKey(value: {
  readonly runtimeReleaseRef: Ref
  readonly rateAuthorityRef: Ref
}) {
  return createHash('sha256').update(stableAuthorityStringify({
    runtimeReleaseRef: value.runtimeReleaseRef,
    rateAuthorityRef: value.rateAuthorityRef,
  })).digest('hex')
}

function ref(id: string, hash: string, version = 1): Ref {
  return refSchema.parse({
    id,
    version,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameRef(left: Ref, right: Ref) {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}
