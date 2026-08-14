import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31GpuRuntimeQualificationComponentEvidence,
  canonicalSam31GpuRuntimeQualificationComponentRef,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidence,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  canonicalSam31GpuRuntimeQualificationComponentEvidenceObjectPath,
} from './canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_READINESS_OBSERVER_VERSION =
  'canonical-sam3_1-gpu-runtime-release-readiness-observer-v2' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const COMPONENT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v2/component-evidence'
const MAXIMUM_COMPONENT_RECORDS = 256
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
])
const requestSchema = z.object({
  routeId: routeIdSchema,
  qualificationId: safeId,
  immutableImageDigest: prefixedSha256,
  componentEvidenceRefs: z.object({
    driverAndCudaRef: refSchema.nullable(),
    deterministicRunSetRef: refSchema.nullable(),
    eightMinutePerformanceRef: refSchema.nullable(),
    independentTemporalQualityRef: refSchema.nullable(),
  }).strict(),
}).strict()
const componentStatusSchema = z.object({
  componentKind: z.enum([
    'driver_and_cuda',
    'deterministic_run_set',
    'eight_minute_performance',
    'independent_temporal_quality',
  ]),
  status: z.enum(['missing', 'ready', 'ambiguous']),
  componentRef: refSchema.nullable(),
  expectedComponentRef: refSchema.nullable(),
  matchingCandidateCount: z.number().int().nonnegative().max(
    MAXIMUM_COMPONENT_RECORDS,
  ),
}).strict()
export const canonicalSam31GpuRuntimeReleaseReadinessObservationSchema =
  z.object({
    schemaVersion: z.literal(
      'canonical-sam3_1-gpu-runtime-release-readiness-observation-v2',
    ),
    source: z.literal(
      'canonical_server_sam3_1_gpu_runtime_release_readiness_observer',
    ),
    evidenceClass: z.literal('canonical_component_index_exact_read'),
    disposition: z.enum([
      'ready_for_release_publication_request',
      'blocked_missing_or_ambiguous_components',
    ]),
    routeId: routeIdSchema,
    qualificationId: safeId,
    immutableImageDigest: prefixedSha256,
    validatedComponentRecordCount: z.number().int().nonnegative().max(
      MAXIMUM_COMPONENT_RECORDS,
    ),
    componentStatuses: z.array(componentStatusSchema).length(4),
    blockers: z.array(safeId).max(16),
    exactCanonicalComponentBodiesAndObjectPathsValidated: z.literal(true),
    everyExpectedComponentRefProvided: z.boolean(),
    exactExpectedComponentRefsAppliedBeforeReadiness: z.boolean(),
    callerQualificationOrReadinessClaimsAccepted: z.literal(false),
    releasePublisherMayBeInvoked: z.boolean(),
    gpuJobDispatched: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApprovalGranted: z.literal(false),
    runtimeReleaseGranted: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionAuthorityGranted: z.literal(false),
  }).strict().superRefine((value, context) => {
    const expectedKinds = [
      'driver_and_cuda',
      'deterministic_run_set',
      'eight_minute_performance',
      'independent_temporal_quality',
    ]
    const exactKinds = value.componentStatuses.every(
      (status, index) => status.componentKind === expectedKinds[index],
    )
    const ready = value.blockers.length === 0
      && value.componentStatuses.every((status) => status.status === 'ready'
        && status.componentRef !== null
        && status.expectedComponentRef !== null)
    const allExpected = value.componentStatuses.every(
      (status) => status.expectedComponentRef !== null,
    )
    if (!exactKinds
      || value.everyExpectedComponentRefProvided !== allExpected
      || value.exactExpectedComponentRefsAppliedBeforeReadiness !== allExpected
      || value.releasePublisherMayBeInvoked !== ready
      || (value.disposition === 'ready_for_release_publication_request') !==
        ready) {
      context.addIssue({
        code: 'custom',
        message: 'SAM 3.1 runtime-release readiness disposition changed.',
      })
    }
  })
export type CanonicalSam31GpuRuntimeReleaseReadinessObservation = z.infer<
  typeof canonicalSam31GpuRuntimeReleaseReadinessObservationSchema
>
const COMPONENT_KINDS = [
  'driver_and_cuda',
  'deterministic_run_set',
  'eight_minute_performance',
  'independent_temporal_quality',
] as const
const COMPONENT_REF_KEYS = {
  driver_and_cuda: 'driverAndCudaRef',
  deterministic_run_set: 'deterministicRunSetRef',
  eight_minute_performance: 'eightMinutePerformanceRef',
  independent_temporal_quality: 'independentTemporalQualityRef',
} as const
type CandidateRecord = Readonly<{
  objectPath: string
  body: Buffer
}>

export interface CanonicalSam31GpuRuntimeQualificationComponentIndexReadPort {
  listComponentRecords(): Promise<readonly CandidateRecord[]>
}

export function createCanonicalSam31GpuRuntimeReleaseReadinessObserver(input: {
  readonly componentIndexReadPort:
    CanonicalSam31GpuRuntimeQualificationComponentIndexReadPort
}) {
  if (typeof input.componentIndexReadPort?.listComponentRecords !==
    'function') throw conflict('component_index_read_port_missing')
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_READINESS_OBSERVER_VERSION,
    evidenceClass:
      'read_only_canonical_component_index_validation' as const,
    async observe(untrusted: unknown) {
      assertPlainSerializedData(untrusted,
        'sam31_gpu_runtime_release_readiness_observation')
      const request = requestSchema.parse(untrusted)
      const records = await input.componentIndexReadPort.listComponentRecords()
      if (!Array.isArray(records)
        || records.length > MAXIMUM_COMPONENT_RECORDS) {
        throw conflict('component_index_bound_exceeded')
      }
      const components = records.map(parseCandidateRecord)
      const matching = components.filter((component) =>
        component.qualificationId === request.qualificationId
        && component.route.routeId === request.routeId
        && component.immutableImageDigest === request.immutableImageDigest)
      const componentStatuses = COMPONENT_KINDS.map((componentKind) => {
        const expectedComponentRef = request.componentEvidenceRefs[
          COMPONENT_REF_KEYS[componentKind]
        ]
        const candidates = matching.filter((component) =>
          component.componentKind === componentKind
          && (expectedComponentRef === null || sameRef(
            canonicalSam31GpuRuntimeQualificationComponentRef(component),
            expectedComponentRef,
          )))
        return Object.freeze({
          componentKind,
          status: candidates.length === 0
            ? 'missing' as const
            : candidates.length === 1
              ? 'ready' as const
              : 'ambiguous' as const,
          componentRef: candidates.length === 1
            ? canonicalSam31GpuRuntimeQualificationComponentRef(candidates[0])
            : null,
          expectedComponentRef,
          matchingCandidateCount: candidates.length,
        })
      })
      const blockers = componentStatuses.flatMap((status) => [
        ...(status.expectedComponentRef === null
          ? [`missing_expected_ref_${status.componentKind}`] : []),
        ...(status.status === 'ready' ? [] : [
          status.status === 'missing'
            ? `missing_${status.componentKind}`
            : `ambiguous_${status.componentKind}`,
        ]),
      ])
      const everyExpectedComponentRefProvided = componentStatuses.every(
        (status) => status.expectedComponentRef !== null,
      )
      const ready = blockers.length === 0
      return Object.freeze(
        canonicalSam31GpuRuntimeReleaseReadinessObservationSchema.parse({
        schemaVersion:
          'canonical-sam3_1-gpu-runtime-release-readiness-observation-v2',
        source: 'canonical_server_sam3_1_gpu_runtime_release_readiness_observer',
        evidenceClass: 'canonical_component_index_exact_read',
        disposition: ready
          ? 'ready_for_release_publication_request' as const
          : 'blocked_missing_or_ambiguous_components' as const,
        routeId: request.routeId,
        qualificationId: request.qualificationId,
        immutableImageDigest: request.immutableImageDigest,
        validatedComponentRecordCount: components.length,
        componentStatuses,
        blockers,
        exactCanonicalComponentBodiesAndObjectPathsValidated: true as const,
        everyExpectedComponentRefProvided,
        exactExpectedComponentRefsAppliedBeforeReadiness:
          everyExpectedComponentRefProvided,
        callerQualificationOrReadinessClaimsAccepted: false as const,
        releasePublisherMayBeInvoked: ready,
        gpuJobDispatched: false as const,
        customerCreditsMutated: false as const,
        qaApprovalGranted: false as const,
        runtimeReleaseGranted: false as const,
        publicDeliveryAuthorized: false as const,
        productionAuthorityGranted: false as const,
        }),
      )
    },
  })
}

export function assertCanonicalSam31GpuRuntimeReleaseReadinessObservation(
  value: unknown,
): CanonicalSam31GpuRuntimeReleaseReadinessObservation {
  assertPlainSerializedData(value, 'sam31_gpu_release_readiness_observation')
  return Object.freeze(
    canonicalSam31GpuRuntimeReleaseReadinessObservationSchema.parse(value),
  )
}

function sameRef(
  left: {
    readonly id: string
    readonly version: number
    readonly contentHash: string
  },
  right: {
    readonly id: string
    readonly version: number
    readonly contentHash: string
  },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

export function createCanonicalSam31GcpGpuRuntimeQualificationComponentIndexReadPort(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31GpuRuntimeQualificationComponentIndexReadPort {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  return Object.freeze({
    async listComponentRecords() {
      const [files] = await storage.bucket(CONTROL_PLANE_STATE_BUCKET).getFiles({
        prefix: `${COMPONENT_PREFIX}/`,
        maxResults: MAXIMUM_COMPONENT_RECORDS + 1,
        autoPaginate: false,
      })
      if (files.length > MAXIMUM_COMPONENT_RECORDS) {
        throw conflict('component_index_bound_exceeded')
      }
      const records: CandidateRecord[] = []
      for (const file of files) {
        if (!file.name.endsWith('.json')) continue
        const [body] = await file.download()
        records.push(Object.freeze({ objectPath: file.name, body }))
      }
      return Object.freeze(records)
    },
  })
}

export function createCanonicalSam31GcpGpuRuntimeReleaseReadinessObserver(
  input: { readonly storage?: Storage } = {},
) {
  return createCanonicalSam31GpuRuntimeReleaseReadinessObserver({
    componentIndexReadPort:
      createCanonicalSam31GcpGpuRuntimeQualificationComponentIndexReadPort(
        input,
      ),
  })
}

function parseCandidateRecord(
  record: CandidateRecord,
): CanonicalSam31GpuRuntimeQualificationComponentEvidence {
  if (typeof record?.objectPath !== 'string'
    || !Buffer.isBuffer(record?.body)
    || record.body.byteLength < 2
    || record.body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('component_record_shape_or_size_invalid')
  }
  let untrusted: unknown
  try {
    untrusted = JSON.parse(record.body.toString('utf8'))
  } catch {
    throw conflict('component_record_json_invalid')
  }
  const component =
    assertCanonicalSam31GpuRuntimeQualificationComponentEvidence(untrusted)
  const canonicalBody = Buffer.from(stableAuthorityStringify(component), 'utf8')
  if (!canonicalBody.equals(record.body)
    || canonicalSam31GpuRuntimeQualificationComponentEvidenceObjectPath({
      componentEvidence: component,
    }) !== record.objectPath) {
    throw conflict('component_record_body_or_object_path_noncanonical')
  }
  return component
}

function conflict(code: string): Error {
  return Object.assign(new Error(
    `SAM 3.1 runtime-release readiness rejected ${code}.`,
  ), { code })
}
