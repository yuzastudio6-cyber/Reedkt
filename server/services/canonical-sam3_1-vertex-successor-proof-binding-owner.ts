import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31PrivateCompleteSourceQualificationAdmission,
  canonicalSam31PrivateCompleteSourceQualificationAdmissionRef,
} from './canonical-sam3_1-private-complete-source-qualification-admission-owner'
import {
  assertCanonicalSam31VertexCompleteSourceQualificationResult,
} from './canonical-sam3_1-vertex-complete-source-qualification-invocation-service'
import {
  assertCanonicalSam31VertexCompleteSourceQualificationPreparation,
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRef,
} from './canonical-sam3_1-vertex-complete-source-qualification-preparation-service'
import {
  assertCanonicalSam31VertexServingRuntimeComponentEvidence,
  canonicalSam31VertexServingRuntimeComponentRef,
} from './canonical-sam3_1-vertex-serving-runtime-component-qualification-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_SUCCESSOR_PROOF_BINDING_VERSION =
  'canonical-sam3_1-vertex-successor-proof-binding-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SUCCESSOR_PROOF_BINDING_OWNER_VERSION =
  'canonical-sam3_1-vertex-successor-proof-binding-owner-v1' as const

const DEFAULT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v3/vertex-successor-proof-bindings'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const PREDECESSOR_IMAGE_DIGEST =
  'sha256:953a883366f51350933bf4b7911b34e652e4edc30e4e81fdf57e661c675c055f' as const
const PREDECESSOR_THIRTY_RUN_QUALIFICATION_ID =
  'sam31-a100-v6-thirty-qualified-20260815-v1' as const
const PREDECESSOR_THIRTY_RUN_QUALIFICATION_HASH =
  'sha256:c3a0351d3542be81f0dd6e4ac821b82db2196485d64c8253b482632fc01d0552' as const

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/+:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

const requestSchema = z.object({
  proofBindingId: safeId,
  continuityDriverComponentRef: refSchema,
  continuityDeterministicComponentRef: refSchema,
  parentQualificationAdmissionRef: refSchema,
  qualificationPreparationRef: refSchema,
  invocationId: safeId,
  recordedAt: timestamp,
}).strict()

const bindingWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SUCCESSOR_PROOF_BINDING_VERSION,
  ),
  ownerVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SUCCESSOR_PROOF_BINDING_OWNER_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_successor_proof_binding_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_predecessor_thirty_run_continuity_plus_exact_successor_4k_terminal_reread',
  ),
  status: z.literal(
    'successor_private_4k_proof_accepted_not_full_runtime_release',
  ),
  proofBindingId: safeId,
  qualificationId: safeId,
  routeId: z.literal('a100_80gb_heavy_primary'),
  accelerator: z.literal('nvidia_a100_80gb'),
  immutableImageDigest: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
  ),
  predecessorImmutableImageDigest: z.literal(PREDECESSOR_IMAGE_DIGEST),
  predecessorThirtyRunQualificationRef: refSchema,
  continuityDriverComponentRef: refSchema,
  continuityDeterministicComponentRef: refSchema,
  parentQualificationAdmissionRef: refSchema,
  qualificationPreparationRef: refSchema,
  qualificationResultRef: refSchema,
  runtimeResponseRef: refSchema,
  canonicalStartFrameInclusive: z.literal(0),
  canonicalEndFrameInclusive: z.literal(239),
  decodedFrameCount: z.literal(240),
  sourceWidth: z.literal(3_840),
  sourceHeight: z.literal(2_160),
  providerRoundTripDurationMilliseconds:
    z.number().int().positive().max(600_000).safe(),
  uploadedObjectCount: z.number().int().positive().safe(),
  uploadedByteLength: z.number().int().positive().safe(),
  exactContinuityAdmissionPreparationResultAndRuntimeResponseReread:
    z.literal(true),
  exactSuccessorImageAndA100RouteReread: z.literal(true),
  predecessorThirtyRunEvidenceRetained: z.literal(true),
  successorSingle4kChunkGpuExecutionVerified: z.literal(true),
  successorDriverAndCudaProofAccepted: z.literal(true),
  successorDeterministicRunSetClaimed: z.literal(false),
  successorThirtyRunPerformanceClaimed: z.literal(false),
  exactEightMinutePerformanceClaimed: z.literal(false),
  independentTemporalQualityClaimed: z.literal(false),
  l4QualityParityClaimedForSuccessorImage: z.literal(false),
  automaticRetryOrFallbackStarted: z.literal(false),
  customerInvocationAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  trackAllQualificationGranted: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  recordedAt: timestamp,
}).strict()

export const canonicalSam31VertexSuccessorProofBindingSchema =
  bindingWithoutHashSchema.extend({ bindingHash: sha256 }).strict()
export type CanonicalSam31VertexSuccessorProofBinding = z.infer<
  typeof canonicalSam31VertexSuccessorProofBindingSchema
>

export interface CanonicalSam31VertexSuccessorProofBindingReadPort {
  rereadContinuityComponent(input: {
    readonly componentRef: EvidenceRef
  }): Promise<unknown | null>
  rereadParentAdmission(input: {
    readonly admissionRef: EvidenceRef
  }): Promise<unknown | null>
  rereadPreparation(input: {
    readonly invocationId: string
  }): Promise<unknown | null>
  rereadTerminalResult(input: {
    readonly invocationId: string
  }): Promise<unknown | null>
}

export interface CanonicalSam31VertexSuccessorProofBindingRepository {
  persistCreateOnly(input: {
    readonly binding: CanonicalSam31VertexSuccessorProofBinding
  }): Promise<'created' | 'identical_replay'>
  reread(input: {
    readonly bindingRef: EvidenceRef
  }): Promise<CanonicalSam31VertexSuccessorProofBinding | null>
}

export function createCanonicalSam31VertexSuccessorProofBindingOwner(input: {
  readonly readPort: CanonicalSam31VertexSuccessorProofBindingReadPort
  readonly repository: CanonicalSam31VertexSuccessorProofBindingRepository
}) {
  assertDependencies(input)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SUCCESSOR_PROOF_BINDING_OWNER_VERSION,
    fullRuntimeReleaseClaimed: false as const,
    automaticRetryOrFallbackAllowed: false as const,
    async bindAndPersist(untrusted: unknown): Promise<
      CanonicalSam31VertexSuccessorProofBinding
    > {
      assertPlainSerializedData(untrusted, 'sam31_vertex_successor_proof')
      const request = requestSchema.parse(untrusted)
      const [rawDriver, rawDeterministic, rawParent, rawPreparation,
        rawResult] = await Promise.all([
        input.readPort.rereadContinuityComponent({
          componentRef: request.continuityDriverComponentRef,
        }),
        input.readPort.rereadContinuityComponent({
          componentRef: request.continuityDeterministicComponentRef,
        }),
        input.readPort.rereadParentAdmission({
          admissionRef: request.parentQualificationAdmissionRef,
        }),
        input.readPort.rereadPreparation({ invocationId: request.invocationId }),
        input.readPort.rereadTerminalResult({
          invocationId: request.invocationId,
        }),
      ])
      if (!rawDriver || !rawDeterministic || !rawParent || !rawPreparation
        || !rawResult) throw conflict('exact_proof_lineage_missing')

      const driver = assertCanonicalSam31VertexServingRuntimeComponentEvidence(
        rawDriver,
      )
      const deterministic =
        assertCanonicalSam31VertexServingRuntimeComponentEvidence(
          rawDeterministic,
        )
      const parent =
        assertCanonicalSam31PrivateCompleteSourceQualificationAdmission(
          rawParent,
        )
      const preparation =
        assertCanonicalSam31VertexCompleteSourceQualificationPreparation(
          rawPreparation,
        )
      const result =
        assertCanonicalSam31VertexCompleteSourceQualificationResult(rawResult)

      const driverRef = canonicalSam31VertexServingRuntimeComponentRef(driver)
      const deterministicRef =
        canonicalSam31VertexServingRuntimeComponentRef(deterministic)
      const parentRef =
        canonicalSam31PrivateCompleteSourceQualificationAdmissionRef(parent)
      const preparationRef =
        createCanonicalSam31VertexCompleteSourceQualificationPreparationRef(
          preparation,
        )
      const sourceRef = driver.sourceThirtyRunQualificationRef
      const currentContinuity = driver.schemaVersion ===
          'canonical-sam3_1-vertex-serving-runtime-component-continuity-evidence-v1'
        && deterministic.schemaVersion ===
          'canonical-sam3_1-vertex-serving-runtime-component-continuity-evidence-v1'

      if (!currentContinuity
        || driver.componentKind !== 'driver_and_cuda'
        || deterministic.componentKind !== 'deterministic_run_set'
        || driver.qualificationId !== deterministic.qualificationId
        || driver.qualificationId !== parent.qualificationId
        || parent.qualificationId !== preparation.qualificationId
        || preparation.qualificationId !== result.qualificationId
        || driver.immutableImageDigest !==
          CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST
        || deterministic.immutableImageDigest !==
          CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST
        || parent.immutableImageDigest !==
          CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST
        || driver.predecessorImmutableImageDigest !== PREDECESSOR_IMAGE_DIGEST
        || deterministic.predecessorImmutableImageDigest !==
          PREDECESSOR_IMAGE_DIGEST
        || sourceRef.id !== PREDECESSOR_THIRTY_RUN_QUALIFICATION_ID
        || sourceRef.contentHash !==
          PREDECESSOR_THIRTY_RUN_QUALIFICATION_HASH
        || !sameRef(sourceRef,
          deterministic.sourceThirtyRunQualificationRef)
        || !sameRef(driverRef, request.continuityDriverComponentRef)
        || !sameRef(deterministicRef,
          request.continuityDeterministicComponentRef)
        || !sameRef(parent.driverAndCudaComponentRef, driverRef)
        || !sameRef(parent.deterministicRunSetComponentRef, deterministicRef)
        || !sameRef(parentRef, request.parentQualificationAdmissionRef)
        || !sameRef(preparation.parentQualificationAdmissionRef, parentRef)
        || !sameRef(preparationRef, request.qualificationPreparationRef)
        || !sameRef(result.qualificationPreparationRef, preparationRef)
        || !sameRef(result.parentQualificationAdmissionRef, parentRef)
        || preparation.invocationId !== request.invocationId
        || result.invocationId !== request.invocationId
        || parent.routeId !== 'a100_80gb_heavy_primary'
        || parent.executionTarget !==
          'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra'
        || parent.completeSourcePerformanceEvidencePending !== true
        || parent.independentTemporalQualityEvidencePending !== true
        || preparation.chunkOrdinal !== 1
        || preparation.canonicalStartFrameInclusive !== 0
        || preparation.canonicalEndFrameInclusive !== 239
        || preparation.decodedFrameCount !== 240
        || result.chunkOrdinal !== 1
        || result.canonicalStartFrameInclusive !== 0
        || result.canonicalEndFrameInclusive !== 239
        || result.disposition !== 'completed'
        || result.runtimeStatus !== 'completed'
        || result.providerOutcome !== 'executed'
        || result.terminalEvidenceMode !==
          'provider_prediction_and_private_response'
        || !result.exactPrivateRuntimeResponseReread
        || !result.exactVertexPredictionWrapperReread
        || result.runtimeResponseRef === null
        || result.providerRoundTripDurationMilliseconds === null
        || result.uploadedObjectCount === null
        || result.uploadedByteLength === null
        || result.unresolvedOutcomeBlocksRetry
        || Date.parse(request.recordedAt) < Date.parse(result.observedAt)
      ) throw conflict('successor_proof_lineage_changed')

      const payload = bindingWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_SUCCESSOR_PROOF_BINDING_VERSION,
        ownerVersion:
          CANONICAL_SAM3_1_VERTEX_SUCCESSOR_PROOF_BINDING_OWNER_VERSION,
        source:
          'canonical_server_sam3_1_vertex_successor_proof_binding_owner',
        evidenceClass:
          'canonical_private_predecessor_thirty_run_continuity_plus_exact_successor_4k_terminal_reread',
        status:
          'successor_private_4k_proof_accepted_not_full_runtime_release',
        proofBindingId: request.proofBindingId,
        qualificationId: driver.qualificationId,
        routeId: 'a100_80gb_heavy_primary',
        accelerator: 'nvidia_a100_80gb',
        immutableImageDigest: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
        predecessorImmutableImageDigest: PREDECESSOR_IMAGE_DIGEST,
        predecessorThirtyRunQualificationRef: sourceRef,
        continuityDriverComponentRef: driverRef,
        continuityDeterministicComponentRef: deterministicRef,
        parentQualificationAdmissionRef: parentRef,
        qualificationPreparationRef: preparationRef,
        qualificationResultRef: ref(
          `${request.invocationId}:complete-source-terminal`,
          result.resultHash,
        ),
        runtimeResponseRef: result.runtimeResponseRef,
        canonicalStartFrameInclusive: 0,
        canonicalEndFrameInclusive: 239,
        decodedFrameCount: 240,
        sourceWidth: 3_840,
        sourceHeight: 2_160,
        providerRoundTripDurationMilliseconds:
          result.providerRoundTripDurationMilliseconds,
        uploadedObjectCount: result.uploadedObjectCount,
        uploadedByteLength: result.uploadedByteLength,
        exactContinuityAdmissionPreparationResultAndRuntimeResponseReread:
          true,
        exactSuccessorImageAndA100RouteReread: true,
        predecessorThirtyRunEvidenceRetained: true,
        successorSingle4kChunkGpuExecutionVerified: true,
        successorDriverAndCudaProofAccepted: true,
        successorDeterministicRunSetClaimed: false,
        successorThirtyRunPerformanceClaimed: false,
        exactEightMinutePerformanceClaimed: false,
        independentTemporalQualityClaimed: false,
        l4QualityParityClaimedForSuccessorImage: false,
        automaticRetryOrFallbackStarted: false,
        customerInvocationAuthorized: false,
        customerCreditsMutated: false,
        runtimeReleaseGranted: false,
        trackAllQualificationGranted: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        recordedAt: request.recordedAt,
      })
      const binding = assertCanonicalSam31VertexSuccessorProofBinding({
        ...payload,
        bindingHash: sha256AuthorityValue(payload),
      })
      await input.repository.persistCreateOnly({ binding })
      const reread = await input.repository.reread({
        bindingRef: canonicalSam31VertexSuccessorProofBindingRef(binding),
      })
      if (!reread || reread.bindingHash !== binding.bindingHash) {
        throw conflict('successor_proof_binding_reread_failed')
      }
      return reread
    },
  })
}

export function assertCanonicalSam31VertexSuccessorProofBinding(
  value: unknown,
): CanonicalSam31VertexSuccessorProofBinding {
  assertPlainSerializedData(value, 'sam31_vertex_successor_proof_binding')
  const parsed = canonicalSam31VertexSuccessorProofBindingSchema.parse(value)
  const { bindingHash, ...payload } = parsed
  if (bindingHash !== sha256AuthorityValue(payload)) {
    throw conflict('successor_proof_binding_hash_changed')
  }
  return Object.freeze(structuredClone(parsed))
}

export function canonicalSam31VertexSuccessorProofBindingRef(
  value: unknown,
): EvidenceRef {
  const binding = assertCanonicalSam31VertexSuccessorProofBinding(value)
  return ref(binding.proofBindingId, binding.bindingHash)
}

export function createCanonicalSam31VertexSuccessorProofBindingRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31VertexSuccessorProofBindingRepository {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (bindingRef: EvidenceRef) => {
    const exactRef = refSchema.parse(bindingRef)
    const body = await input.objectPort.readExact(
      `${prefix}/${exactRef.id}.json`,
    )
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw conflict('successor_proof_binding_bytes_changed')
    }
    const binding = assertCanonicalSam31VertexSuccessorProofBinding(
      JSON.parse(body.toString('utf8')) as unknown,
    )
    if (!sameRef(canonicalSam31VertexSuccessorProofBindingRef(binding),
      exactRef)
      || stableAuthorityStringify(binding) !== body.toString('utf8')) {
      throw conflict('successor_proof_binding_exact_reread_changed')
    }
    return binding
  }
  return Object.freeze({
    async persistCreateOnly({ binding: raw }: {
      readonly binding: CanonicalSam31VertexSuccessorProofBinding
    }) {
      const binding = assertCanonicalSam31VertexSuccessorProofBinding(raw)
      const body = Buffer.from(stableAuthorityStringify(binding), 'utf8')
      const disposition = await input.objectPort.createOnly({
        objectPath: `${prefix}/${binding.proofBindingId}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const exact = await reread(
        canonicalSam31VertexSuccessorProofBindingRef(binding),
      )
      if (!exact || exact.bindingHash !== binding.bindingHash) {
        throw conflict('successor_proof_binding_persistence_failed')
      }
      return disposition === 'created'
        ? 'created' as const : 'identical_replay' as const
    },
    reread({ bindingRef }: { readonly bindingRef: EvidenceRef }) {
      return reread(bindingRef)
    },
  })
}

function assertDependencies(input: {
  readPort: CanonicalSam31VertexSuccessorProofBindingReadPort
  repository: CanonicalSam31VertexSuccessorProofBindingRepository
}): void {
  if (typeof input.readPort?.rereadContinuityComponent !== 'function'
    || typeof input.readPort?.rereadParentAdmission !== 'function'
    || typeof input.readPort?.rereadPreparation !== 'function'
    || typeof input.readPort?.rereadTerminalResult !== 'function'
    || typeof input.repository?.persistCreateOnly !== 'function'
    || typeof input.repository?.reread !== 'function') {
    throw conflict('successor_proof_dependency_missing')
  }
}

function ref(id: string, hash: string): EvidenceRef {
  return refSchema.parse({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameRef(
  left: Readonly<{ id: string; version: number; contentHash: string }>,
  right: Readonly<{ id: string; version: number; contentHash: string }>,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function conflict(code: string): TypeError {
  return new TypeError(`SAM31_VERTEX_SUCCESSOR_PROOF_CONFLICT:${code}`)
}
