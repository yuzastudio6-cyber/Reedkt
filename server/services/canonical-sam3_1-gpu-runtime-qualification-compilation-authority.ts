import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31GpuRuntimeQualificationEvidence,
  canonicalSam31GpuRuntimeDeterministicRunSchema,
  canonicalSam31GpuRuntimeDriverEvidenceSchema,
  canonicalSam31GpuRuntimePerformanceEvidenceSchema,
  canonicalSam31GpuRuntimeQualityEvidenceSchema,
  canonicalSam31GpuRuntimeQualificationEvidenceRef,
  type CanonicalSam31GpuRuntimeQualificationEvidence,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-qualification-evidence'

export const
CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_EVIDENCE_VERSION =
  'canonical-sam3_1-gpu-runtime-qualification-component-evidence-v1' as const
export const
CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPILATION_AUTHORITY_VERSION =
  'canonical-sam3_1-gpu-runtime-qualification-compilation-authority-v1' as const

const DEFAULT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v1/compilation-authorities'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
export const
canonicalSam31GpuRuntimeQualificationComponentEvidenceReferenceSchema =
  refSchema
const routeSchema = z.object({
  routeId: z.enum(['a100_80gb_heavy_primary', 'l4_heavy_fallback']),
  gpuProfileId: z.enum([
    'quality_a100_80gb_user_triggered_heavy_job_v1',
    'quality_l4_user_triggered_heavy_fallback_job_v1',
  ]),
  runtimeRegion: z.enum(['us-central1', 'europe-west4']),
  executionTarget: z.enum([
    'google_cloud_batch_a2_ultra_job',
    'google_cloud_run_l4_job',
  ]),
  machineType: z.enum(['a2-ultragpu-1g', 'cloud_run_nvidia_l4']),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
}).strict()

const componentBaseSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_gpu_runtime_qualification_component_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('component_evidence_ready'),
  componentId: safeId,
  componentVersion: z.literal(1),
  qualificationId: safeId,
  route: routeSchema,
  immutableImageDigest: prefixedSha256,
  recordedAt: timestamp,
}).strict()
const driverComponentWithoutHashSchema = componentBaseSchema.extend({
  componentKind: z.literal('driver_and_cuda'),
  payload: canonicalSam31GpuRuntimeDriverEvidenceSchema,
}).strict()
const deterministicComponentWithoutHashSchema = componentBaseSchema.extend({
  componentKind: z.literal('deterministic_run_set'),
  payload: z.array(
    canonicalSam31GpuRuntimeDeterministicRunSchema,
  ).length(30),
}).strict()
const performanceComponentWithoutHashSchema = componentBaseSchema.extend({
  componentKind: z.literal('eight_minute_performance'),
  payload: canonicalSam31GpuRuntimePerformanceEvidenceSchema,
}).strict()
const qualityComponentWithoutHashSchema = componentBaseSchema.extend({
  componentKind: z.literal('independent_temporal_quality'),
  payload: canonicalSam31GpuRuntimeQualityEvidenceSchema,
}).strict()
const componentEvidenceSchema = z.discriminatedUnion('componentKind', [
  driverComponentWithoutHashSchema.extend({ componentHash: sha256 }).strict(),
  deterministicComponentWithoutHashSchema
    .extend({ componentHash: sha256 }).strict(),
  performanceComponentWithoutHashSchema
    .extend({ componentHash: sha256 }).strict(),
  qualityComponentWithoutHashSchema.extend({ componentHash: sha256 }).strict(),
])
export type CanonicalSam31GpuRuntimeQualificationComponentEvidence = z.infer<
  typeof componentEvidenceSchema
>

const authorityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPILATION_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_gpu_runtime_qualification_compilation_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('qualified_evidence_compilation_verified'),
  authorityId: safeId,
  authorityVersion: z.literal(1),
  qualificationEvidenceRef: refSchema,
  qualificationId: safeId,
  candidateRef: z.object({
    schemaVersion: z.literal('canonical-sam3_1-source-runtime-candidate-v3'),
    candidateHash: sha256,
  }).strict(),
  privateArtifactIngestReceiptRef: refSchema,
  sourceCheckpointCompatibilityQualificationRef: refSchema.extend({
    schemaVersion: z.literal(
      'canonical-sam3_1-source-checkpoint-compatibility-qualification-v1',
    ),
  }).strict(),
  imageSupplyChainReleaseRef: refSchema,
  serviceIdentityRef: refSchema,
  immutableImageRef: refSchema,
  immutableImageDigest: prefixedSha256,
  scaleToZeroConfigurationRef: refSchema,
  privateNetworkAndArtifactTransportRef: refSchema,
  route: routeSchema,
  componentEvidenceRefs: z.object({
    driverAndCudaRef: refSchema,
    deterministicRunSetRef: refSchema,
    eightMinutePerformanceRef: refSchema,
    independentTemporalQualityRef: refSchema,
  }).strict(),
  qualifiedAt: timestamp,
  exactQualificationAndFourComponentRecordsReread: z.literal(true),
  exactComponentPayloadsMatchedQualificationEvidence: z.literal(true),
  callerSuppliedQualificationBooleansAccepted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const authoritySchema = authorityWithoutHashSchema.extend({
  authorityHash: sha256,
}).strict()
export type CanonicalSam31GpuRuntimeQualificationCompilationAuthority = z.infer<
  typeof authoritySchema
>

const compileRequestSchema = z.object({
  authorityId: safeId,
  qualificationEvidenceRef: refSchema,
  componentEvidenceRefs: z.object({
    driverAndCudaRef: refSchema,
    deterministicRunSetRef: refSchema,
    eightMinutePerformanceRef: refSchema,
    independentTemporalQualityRef: refSchema,
  }).strict(),
}).strict()

export interface CanonicalSam31GpuRuntimeQualificationCompilationReadPort {
  rereadQualificationEvidence(input: {
    readonly qualificationEvidenceRef: z.infer<typeof refSchema>
  }): Promise<unknown | null>
  rereadComponentEvidence(input: {
    readonly componentEvidenceRef: z.infer<typeof refSchema>
  }): Promise<unknown | null>
}

export interface CanonicalSam31GpuRuntimeQualificationCompilationAuthorityReadPort {
  rereadQualificationCompilationAuthority(input: {
    readonly authorityRef: z.infer<typeof refSchema>
  }): Promise<CanonicalSam31GpuRuntimeQualificationCompilationAuthority | null>
}

export function assertCanonicalSam31GpuRuntimeQualificationComponentEvidence(
  value: unknown,
): CanonicalSam31GpuRuntimeQualificationComponentEvidence {
  assertPlainSerializedData(value, 'sam31_gpu_qualification_component')
  const parsed = componentEvidenceSchema.parse(value)
  const { componentHash, ...payload } = parsed
  if (componentHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification component hash is invalid.')
  }
  return parsed
}

export function canonicalSam31GpuRuntimeQualificationComponentRef(
  value: CanonicalSam31GpuRuntimeQualificationComponentEvidence,
) {
  const component =
    assertCanonicalSam31GpuRuntimeQualificationComponentEvidence(value)
  return refSchema.parse({
    id: component.componentId,
    version: component.componentVersion,
    contentHash: `sha256:${component.componentHash}`,
  })
}

export function assertCanonicalSam31GpuRuntimeQualificationCompilationAuthority(
  value: unknown,
): CanonicalSam31GpuRuntimeQualificationCompilationAuthority {
  assertPlainSerializedData(value, 'sam31_gpu_qualification_compilation')
  const parsed = authoritySchema.parse(value)
  const { authorityHash, ...payload } = parsed
  if (authorityHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification compilation hash is invalid.')
  }
  return parsed
}

export function canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef(
  value: CanonicalSam31GpuRuntimeQualificationCompilationAuthority,
) {
  const authority =
    assertCanonicalSam31GpuRuntimeQualificationCompilationAuthority(value)
  return refSchema.parse({
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}`,
  })
}

export function createCanonicalSam31GpuRuntimeQualificationCompilationOwner(
  input: {
    readonly readPort:
      CanonicalSam31GpuRuntimeQualificationCompilationReadPort
    readonly authorityObjectPort: CanonicalCreateOnlyJsonObjectPort
  },
) {
  assertDependencies(input)
  const authorityReadPort =
    createCanonicalSam31GpuRuntimeQualificationCompilationAuthorityObjectReadPort({
      objectPort: input.authorityObjectPort,
    })
  return Object.freeze({
    ...authorityReadPort,
    async compileAndPersist(untrustedRequest: unknown) {
      assertPlainSerializedData(untrustedRequest, 'sam31_gpu_qualification_compile')
      const request = compileRequestSchema.parse(untrustedRequest)
      const rawEvidence = await input.readPort.rereadQualificationEvidence({
        qualificationEvidenceRef: request.qualificationEvidenceRef,
      })
      if (!rawEvidence) {
        throw new Error('SAM 3.1 qualification evidence is unavailable.')
      }
      const evidence = assertCanonicalSam31GpuRuntimeQualificationEvidence(
        rawEvidence,
      )
      if (!sameRef(
        canonicalSam31GpuRuntimeQualificationEvidenceRef(evidence),
        request.qualificationEvidenceRef,
      )) throw new Error('SAM 3.1 qualification evidence ref crossed.')

      const components = await Promise.all([
        rereadComponent(input.readPort, request.componentEvidenceRefs
          .driverAndCudaRef, 'driver_and_cuda'),
        rereadComponent(input.readPort, request.componentEvidenceRefs
          .deterministicRunSetRef, 'deterministic_run_set'),
        rereadComponent(input.readPort, request.componentEvidenceRefs
          .eightMinutePerformanceRef, 'eight_minute_performance'),
        rereadComponent(input.readPort, request.componentEvidenceRefs
          .independentTemporalQualityRef, 'independent_temporal_quality'),
      ])
      const [driver, deterministic, performance, quality] = components
      assertComponentsMatchEvidence(evidence, {
        driver,
        deterministic,
        performance,
        quality,
      })
      const payload = authorityWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPILATION_AUTHORITY_VERSION,
        source:
          'canonical_sam3_1_gpu_runtime_qualification_compilation_owner',
        evidenceClass: 'canonical_private_reread',
        status: 'qualified_evidence_compilation_verified',
        authorityId: request.authorityId,
        authorityVersion: 1,
        qualificationEvidenceRef: request.qualificationEvidenceRef,
        qualificationId: evidence.qualificationId,
        candidateRef: evidence.candidateRef,
        privateArtifactIngestReceiptRef:
          evidence.privateArtifactIngestReceiptRef,
        sourceCheckpointCompatibilityQualificationRef:
          evidence.sourceCheckpointCompatibilityQualificationRef,
        imageSupplyChainReleaseRef: evidence.imageSupplyChainReleaseRef,
        serviceIdentityRef: evidence.serviceIdentityRef,
        immutableImageRef: evidence.immutableImageRef,
        immutableImageDigest: evidence.immutableImageDigest,
        scaleToZeroConfigurationRef: evidence.scaleToZeroConfigurationRef,
        privateNetworkAndArtifactTransportRef:
          evidence.privateNetworkAndArtifactTransportRef,
        route: evidence.route,
        componentEvidenceRefs: request.componentEvidenceRefs,
        qualifiedAt: evidence.qualifiedAt,
        exactQualificationAndFourComponentRecordsReread: true,
        exactComponentPayloadsMatchedQualificationEvidence: true,
        callerSuppliedQualificationBooleansAccepted: false,
        runtimeReleaseGranted: false,
        gpuJobDispatched: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
      })
      const authority =
        assertCanonicalSam31GpuRuntimeQualificationCompilationAuthority({
          ...payload,
          authorityHash: sha256AuthorityValue(payload),
        })
      await persistAuthority(input.authorityObjectPort, authority)
      const authorityRef =
        canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef(authority)
      const reread = await authorityReadPort
        .rereadQualificationCompilationAuthority({ authorityRef })
      if (!reread || reread.authorityHash !== authority.authorityHash) {
        throw new Error('SAM 3.1 qualification authority reread failed.')
      }
      return authority
    },
  })
}

export function createCanonicalSam31GpuRuntimeQualificationCompilationAuthorityObjectReadPort(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort },
): CanonicalSam31GpuRuntimeQualificationCompilationAuthorityReadPort {
  if (typeof input.objectPort?.readExact !== 'function') {
    throw new Error('SAM 3.1 qualification authority object port is invalid.')
  }
  const port:
  CanonicalSam31GpuRuntimeQualificationCompilationAuthorityReadPort = {
    async rereadQualificationCompilationAuthority(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_gpu_qualification_authority_read')
      const request = z.object({ authorityRef: refSchema }).strict()
        .parse(untrusted)
      const body = await input.objectPort.readExact(
        authorityPath(request.authorityRef.id),
      )
      if (!body) return null
      if (!Buffer.isBuffer(body) || body.byteLength < 2
        || body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw new Error('SAM 3.1 qualification authority bytes are invalid.')
      }
      const authority =
        assertCanonicalSam31GpuRuntimeQualificationCompilationAuthority(
          JSON.parse(body.toString('utf8')),
        )
      if (!sameRef(
        canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef(authority),
        request.authorityRef,
      ) || body.toString('utf8') !== stableAuthorityStringify(authority)) {
        throw new Error('SAM 3.1 qualification authority ref crossed.')
      }
      return authority
    },
  }
  return Object.freeze(port)
}

function assertDependencies(input: {
  readPort: CanonicalSam31GpuRuntimeQualificationCompilationReadPort
  authorityObjectPort: CanonicalCreateOnlyJsonObjectPort
}): void {
  if (
    typeof input.readPort?.rereadQualificationEvidence !== 'function'
    || typeof input.readPort?.rereadComponentEvidence !== 'function'
    || typeof input.authorityObjectPort?.createOnly !== 'function'
    || typeof input.authorityObjectPort?.readExact !== 'function'
  ) throw new Error('SAM 3.1 qualification compilation owner is invalid.')
}

async function rereadComponent(
  port: CanonicalSam31GpuRuntimeQualificationCompilationReadPort,
  ref: z.infer<typeof refSchema>,
  expectedKind: CanonicalSam31GpuRuntimeQualificationComponentEvidence[
    'componentKind'
  ],
): Promise<CanonicalSam31GpuRuntimeQualificationComponentEvidence> {
  const raw = await port.rereadComponentEvidence({ componentEvidenceRef: ref })
  if (!raw) throw new Error('SAM 3.1 qualification component is unavailable.')
  const component =
    assertCanonicalSam31GpuRuntimeQualificationComponentEvidence(raw)
  if (component.componentKind !== expectedKind
    || !sameRef(canonicalSam31GpuRuntimeQualificationComponentRef(component),
      ref)) throw new Error('SAM 3.1 qualification component crossed ref.')
  return component
}

function assertComponentsMatchEvidence(
  evidence: CanonicalSam31GpuRuntimeQualificationEvidence,
  components: {
    driver: CanonicalSam31GpuRuntimeQualificationComponentEvidence
    deterministic: CanonicalSam31GpuRuntimeQualificationComponentEvidence
    performance: CanonicalSam31GpuRuntimeQualificationComponentEvidence
    quality: CanonicalSam31GpuRuntimeQualificationComponentEvidence
  },
): void {
  for (const component of Object.values(components)) {
    if (component.qualificationId !== evidence.qualificationId
      || component.immutableImageDigest !== evidence.immutableImageDigest
      || Date.parse(component.recordedAt) > Date.parse(evidence.qualifiedAt)
      || stableAuthorityStringify(component.route) !==
        stableAuthorityStringify(evidence.route)) {
      throw new Error('SAM 3.1 qualification component crossed lineage.')
    }
  }
  if (
    components.driver.componentKind !== 'driver_and_cuda'
    || stableAuthorityStringify(components.driver.payload) !==
      stableAuthorityStringify(evidence.driverEvidence)
    || components.deterministic.componentKind !== 'deterministic_run_set'
    || stableAuthorityStringify(components.deterministic.payload) !==
      stableAuthorityStringify(evidence.deterministicRuns)
    || components.performance.componentKind !== 'eight_minute_performance'
    || stableAuthorityStringify(components.performance.payload) !==
      stableAuthorityStringify(evidence.performanceEvidence)
    || components.quality.componentKind !== 'independent_temporal_quality'
    || stableAuthorityStringify(components.quality.payload) !==
      stableAuthorityStringify(evidence.qualityEvidence)
  ) throw new Error('SAM 3.1 qualification component payload changed.')
}

async function persistAuthority(
  port: CanonicalCreateOnlyJsonObjectPort,
  authority: CanonicalSam31GpuRuntimeQualificationCompilationAuthority,
): Promise<void> {
  const body = Buffer.from(stableAuthorityStringify(authority), 'utf8')
  const result = await port.createOnly({
    objectPath: authorityPath(authority.authorityId),
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  if (result !== 'created' && result !== 'already_exists') {
    throw new Error('SAM 3.1 qualification authority persistence failed.')
  }
}

function authorityPath(authorityId: string): string {
  return `${DEFAULT_PREFIX}/${sha256AuthorityValue(safeId.parse(authorityId))}.json`
}

function sameRef(
  left: z.infer<typeof refSchema>,
  right: z.infer<typeof refSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}
