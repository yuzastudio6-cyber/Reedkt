import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYMENT_PROFILE_HASH,
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYMENT_PROFILE_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_SUPPLY_CHAIN_RELEASE_HASH,
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_SUPPLY_CHAIN_RELEASE_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ROLLOUT_HASH,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ROLLOUT_ID,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import {
  assertCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31VertexServingThirtyRunQualification,
  createCanonicalSam31VertexServingThirtyRunQualificationRepository,
} from './canonical-sam3_1-vertex-serving-thirty-run-qualification-service'
import {
  assertCanonicalSam31VertexModelVersionRollout,
} from './canonical-sam3_1-vertex-model-version-rollout-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  canonicalSam31GpuRuntimeDriverEvidenceSchema,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-qualification-evidence'
import {
  assertCanonicalSam31GpuTaskRecord,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const
CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_EVIDENCE_VERSION =
  'canonical-sam3_1-vertex-serving-runtime-component-evidence-v1' as const
export const
CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_OWNER_VERSION =
  'canonical-sam3_1-vertex-serving-runtime-component-owner-v1' as const
export const
CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_CONTINUITY_EVIDENCE_VERSION =
  'canonical-sam3_1-vertex-serving-runtime-component-continuity-evidence-v1' as const
export const
CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_CONTINUITY_OWNER_VERSION =
  'canonical-sam3_1-vertex-serving-runtime-component-continuity-owner-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PRIVATE_GPU_BUCKET = 'reeditpro-production-reeditpro-masks' as const
const TASK_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const DEFAULT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v3/vertex-serving-components'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const PREDECESSOR_IMAGE_DIGEST =
  'sha256:953a883366f51350933bf4b7911b34e652e4edc30e4e81fdf57e661c675c055f' as const
const PREDECESSOR_THIRTY_RUN_QUALIFICATION_HASH =
  'sha256:c3a0351d3542be81f0dd6e4ac821b82db2196485d64c8253b482632fc01d0552' as const
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

const routeSchema = z.object({
  routeId: z.literal('a100_80gb_heavy_primary'),
  gpuProfileId: z.literal(
    'quality_a100_80gb_user_triggered_heavy_job_v1',
  ),
  runtimeRegion: z.literal('us-central1'),
  executionTarget: z.literal(
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
  ),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
}).strict()

const deterministicRunSchema = z.object({
  runOrdinal: z.number().int().min(1).max(30).safe(),
  invocationId: safeId,
  qualificationResultRef: refSchema,
  qualificationOutputRef: refSchema,
  taskRef: refSchema,
  runtimeResponseRef: refSchema,
  manifestRef: refSchema,
  privateOutputRereadEvidenceRef: refSchema,
  providerRoundTripDurationMilliseconds: z.number().int().positive().safe(),
  semanticMaskSetDigestSha256: sha256,
}).strict()

const componentBaseSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_EVIDENCE_VERSION,
  ),
  ownerVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_OWNER_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_runtime_component_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_thirty_run_receipt_and_first_runtime_exact_reread',
  ),
  status: z.literal('component_evidence_ready'),
  componentId: safeId,
  componentVersion: z.literal(1),
  qualificationId: safeId,
  sourceThirtyRunQualificationRef: refSchema,
  route: routeSchema,
  immutableImageDigest: prefixedSha256,
  recordedAt: timestamp,
}).strict()

const driverWithoutHashSchema = componentBaseSchema.extend({
  componentKind: z.literal('driver_and_cuda'),
  payload: z.object({
    sourceRunOrdinal: z.literal(1),
    sourceTaskRef: refSchema,
    sourceRuntimeResponseRef: refSchema,
    driverEvidence: canonicalSam31GpuRuntimeDriverEvidenceSchema,
    exactFirstRunTaskAndRuntimeResponseReread: z.literal(true),
    callerDriverOrCudaClaimAccepted: z.literal(false),
  }).strict(),
}).strict()

const deterministicWithoutHashSchema = componentBaseSchema.extend({
  componentKind: z.literal('deterministic_run_set'),
  payload: z.object({
    deterministicRuns: z.array(deterministicRunSchema).length(30),
    deterministicOutputRunCount: z.literal(30),
    measuredPerformanceRunCount: z.literal(30),
    exactMaskFileCountRereadAcrossDeterministicRuns: z.literal(12_000),
    propagatedFrameCountPerRun: z.literal(200),
    maskFileCountPerRun: z.literal(400),
    allThirtyDeterministicOutputsSemanticallyIdentical: z.literal(true),
    allThirtyPerformanceMeasurementsUseExactPredictionReceipts:
      z.literal(true),
    everyPerformanceRunUsesItsOwnPredictionReceipt: z.literal(true),
    exactTaskResponseOutputManifestAndMaskEvidenceReread: z.literal(true),
    dedicatedEndpointMinimumReplicaCount: z.literal(0),
    perRunScaleToZeroClaimed: z.literal(false),
    separateFreshScaleFromZeroReadinessRequiredBeforeDispatch: z.literal(true),
    automaticRetryOrFallbackAllowed: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionAuthorityGranted: z.literal(false),
  }).strict().superRefine((value, context) => {
    const ordered = value.deterministicRuns.every((run, index) =>
      run.runOrdinal === index + 1)
    const uniqueInvocations = new Set(
      value.deterministicRuns.map((run) => run.invocationId),
    ).size === 30
    const uniqueRefs = new Set(value.deterministicRuns.flatMap((run) => [
      refKey(run.qualificationResultRef),
      refKey(run.qualificationOutputRef),
      refKey(run.taskRef),
      refKey(run.runtimeResponseRef),
      refKey(run.manifestRef),
      refKey(run.privateOutputRereadEvidenceRef),
    ])).size === 180
    const oneDigest = new Set(value.deterministicRuns.map((run) =>
      run.semanticMaskSetDigestSha256)).size === 1
    if (!ordered || !uniqueInvocations || !uniqueRefs || !oneDigest) {
      context.addIssue({
        code: 'custom',
        message: 'Vertex serving deterministic component set changed.',
      })
    }
  }),
}).strict()

const componentWithoutHashSchema = z.discriminatedUnion('componentKind', [
  driverWithoutHashSchema,
  deterministicWithoutHashSchema,
])
const directComponentSchema = z.discriminatedUnion('componentKind', [
  driverWithoutHashSchema.extend({ componentHash: sha256 }).strict(),
  deterministicWithoutHashSchema.extend({ componentHash: sha256 }).strict(),
])

const continuityBaseSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_CONTINUITY_EVIDENCE_VERSION,
  ),
  ownerVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_CONTINUITY_OWNER_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_runtime_component_continuity_owner',
  ),
  evidenceClass: z.literal(
    'predecessor_thirty_run_exact_reread_plus_qualified_successor_supply_chain_pending_one_complete_source_proof',
  ),
  status: z.literal(
    'successor_component_continuity_ready_for_one_private_proof',
  ),
  componentId: safeId,
  componentVersion: z.literal(2),
  qualificationId: safeId,
  sourceThirtyRunQualificationRef: refSchema,
  route: routeSchema,
  immutableImageDigest: z.literal(CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST),
  predecessorImmutableImageDigest: z.literal(PREDECESSOR_IMAGE_DIGEST),
  successorImageSupplyChainReleaseRef: refSchema,
  successorDeploymentProfileRef: refSchema,
  successorModelVersionRolloutRef: refSchema,
  sourceAndDependencyClosureRef: refSchema,
  predecessorThirtyRunEvidenceExactReread: z.literal(true),
  successorSourceAndDependencyClosureExactReread: z.literal(true),
  successorThirtyRunPerformanceClaimed: z.literal(false),
  oneSuccessorCompleteSourceProofRequired: z.literal(true),
  automaticRetryOrFallbackAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  recordedAt: timestamp,
}).strict()

const continuityDriverWithoutHashSchema = continuityBaseSchema.extend({
  componentKind: z.literal('driver_and_cuda'),
  payload: z.object({
    predecessorComponentRef: refSchema,
    predecessorDriverAndCudaEvidenceRetained: z.literal(true),
    successorDriverAndCudaEvidencePendingOneProof: z.literal(true),
  }).strict(),
}).strict()

const continuityDeterministicWithoutHashSchema = continuityBaseSchema.extend({
  componentKind: z.literal('deterministic_run_set'),
  payload: z.object({
    predecessorComponentRef: refSchema,
    predecessorDeterministicOutputRunCount: z.literal(30),
    predecessorMeasuredPerformanceRunCount: z.literal(30),
    predecessorSemanticMaskSetDigestSha256: sha256,
    successorDeterministicAndPerformanceEvidencePendingOneProof:
      z.literal(true),
  }).strict(),
}).strict()

const continuityComponentWithoutHashSchema = z.discriminatedUnion(
  'componentKind',
  [continuityDriverWithoutHashSchema,
    continuityDeterministicWithoutHashSchema],
)
const continuityComponentSchema = z.discriminatedUnion('componentKind', [
  continuityDriverWithoutHashSchema.extend({ componentHash: sha256 }).strict(),
  continuityDeterministicWithoutHashSchema.extend({
    componentHash: sha256,
  }).strict(),
])
const anyComponentWithoutHashSchema = z.union([
  componentWithoutHashSchema,
  continuityComponentWithoutHashSchema,
])
const componentSchema = z.union([
  directComponentSchema,
  continuityComponentSchema,
])

export type CanonicalSam31VertexServingRuntimeComponentEvidence = z.infer<
  typeof componentSchema
>

const requestSchema = z.object({
  targetQualificationId: safeId,
  sourceThirtyRunQualificationRef: refSchema,
  driverComponentId: safeId,
  deterministicComponentId: safeId,
}).strict()

const continuityRequestSchema = z.object({
  targetQualificationId: safeId,
  driverComponentId: safeId,
  deterministicComponentId: safeId,
  predecessorDriverAndCudaComponent: z.unknown(),
  predecessorDeterministicRunSetComponent: z.unknown(),
  successorImageSupplyChainRelease: z.unknown(),
  successorDeploymentProfile: z.unknown(),
  successorModelVersionRollout: z.unknown(),
  recordedAt: timestamp,
}).strict()

export interface CanonicalSam31VertexServingRuntimeComponentReadPort {
  rereadThirtyRunQualification(input: {
    readonly qualificationSetId: string
  }): Promise<unknown | null>
  rereadFirstRunTask(input: {
    readonly invocationId: string
  }): Promise<unknown | null>
  rereadFirstRunResponse(input: {
    readonly invocationId: string
  }): Promise<unknown | null>
}

export interface CanonicalSam31VertexServingRuntimeComponentRepository {
  persistCreateOnly(input: {
    readonly component: CanonicalSam31VertexServingRuntimeComponentEvidence
  }): Promise<'created' | 'identical_replay'>
  reread(input: {
    readonly componentRef: EvidenceRef
  }): Promise<CanonicalSam31VertexServingRuntimeComponentEvidence | null>
}

export function createCanonicalSam31VertexServingRuntimeComponentOwner(input: {
  readonly readPort: CanonicalSam31VertexServingRuntimeComponentReadPort
  readonly repository: CanonicalSam31VertexServingRuntimeComponentRepository
  readonly now?: () => string
}) {
  assertOwnerDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_OWNER_VERSION,
    evidenceClass:
      'canonical_private_thirty_run_receipt_and_first_runtime_exact_reread' as const,
    async compileAndPersist(untrusted: unknown) {
      assertPlainSerializedData(untrusted,
        'sam31_vertex_serving_runtime_component_request')
      const request = requestSchema.parse(untrusted)
      const rawReceipt = await input.readPort.rereadThirtyRunQualification({
        qualificationSetId: request.sourceThirtyRunQualificationRef.id,
      })
      if (!rawReceipt) throw conflict('thirty_run_receipt_missing')
      const receipt =
        assertCanonicalSam31VertexServingThirtyRunQualification(rawReceipt)
      const receiptRef = ref(receipt.qualificationSetId, receipt.receiptHash)
      if (!sameRef(receiptRef, request.sourceThirtyRunQualificationRef)
        || receipt.schemaVersion !==
          'canonical-sam3_1-vertex-serving-thirty-run-qualification-v2'
        || receipt.routeId !== 'a100_80gb_heavy_primary'
        || receipt.accelerator !== 'nvidia_a100_80gb'
        || receipt.deterministicOutputRunCount !== 30
        || receipt.measuredPerformanceRunCount !== 30
        || receipt.recoveredOutputRunCount !== 0
        || !receipt.allThirtyDeterministicOutputsSemanticallyIdentical
        || !receipt.allThirtyPerformanceMeasurementsUseExactPredictionReceipts
        || !receipt.everyPerformanceRunUsesItsOwnPredictionReceipt
        || !receipt.exactTaskResponseOutputManifestAndMaskEvidenceReread) {
        throw conflict('thirty_run_receipt_not_current_direct_set')
      }
      const first = receipt.deterministicRuns[0]!
      const [rawTask, rawResponse] = await Promise.all([
        input.readPort.rereadFirstRunTask({ invocationId: first.invocationId }),
        input.readPort.rereadFirstRunResponse({
          invocationId: first.invocationId,
        }),
      ])
      if (!rawTask || !rawResponse) {
        throw conflict('first_run_task_or_response_missing')
      }
      const task = assertCanonicalSam31GpuTaskRecord(rawTask)
      const response = assertCanonicalSam31GpuRuntimeResponse({
        request: task.runtimeRequest,
        response: rawResponse,
      })
      const gpu = response.gpuEvidence
      const responseRef = ref(
        `sam31-gpu-response:${first.invocationId}`,
        createHash('sha256')
          .update(canonicalSam31GpuWireStringify(response), 'utf8')
          .digest('hex'),
      )
      const taskRef = ref(task.taskId, task.taskRecordHash)
      const firstRunBlockers = [
        task.invocationId !== first.invocationId ? 'invocation' : null,
        !sameRef(taskRef, first.taskRef) ? 'task_ref' : null,
        !sameRef(responseRef, first.runtimeResponseRef)
          ? 'runtime_response_ref' : null,
        task.runtimeRequest.dispatch.routeRole !==
          'a100_80gb_heavy_primary' ? 'route' : null,
        task.runtimeRequest.dispatch.accelerator !== 'nvidia_a100_80gb'
          ? 'accelerator' : null,
        !task.runtimeRequest.dispatch.scaleFromZeroRequired
          ? 'scale_from_zero_policy' : null,
        task.runtimeRequest.dispatch.cpuOnlyInferenceAllowed
          ? 'cpu_policy' : null,
        task.runtimeRequest.modelArtifacts.immutableImageDigest !==
          receipt.immutableImageDigest ? 'image' : null,
        response.status !== 'completed' ? 'response_status' : null,
        !gpu ? 'gpu_evidence' : null,
        gpu?.requestedAccelerator !== 'nvidia_a100_80gb'
          ? 'gpu_accelerator' : null,
        !gpu?.cudaAvailable ? 'cuda_available' : null,
        !gpu?.cudaKernelExecutionMeasured ? 'cuda_inference' : null,
        !gpu?.nvdecHardwareDecodeMeasured ? 'nvdec' : null,
        !gpu?.decodedFramesResidentOnCuda ? 'cuda_residency' : null,
        !gpu?.bfloat16AutocastUsed ? 'bfloat16' : null,
        gpu?.cpuOnlyInferenceUsed !== false ? 'cpu_inference' : null,
      ].filter((value): value is string => value !== null)
      if (firstRunBlockers.length > 0) {
        throw conflict(`first_run_${firstRunBlockers.join('_')}`)
      }
      if (!gpu) throw conflict('first_run_gpu_evidence_missing')

      const recordedAt = timestamp.parse(now())
      if (Date.parse(recordedAt) < Date.parse(receipt.compiledAt)) {
        throw conflict('component_recorded_before_source_receipt')
      }
      const base = {
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_EVIDENCE_VERSION,
        ownerVersion:
          CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_OWNER_VERSION,
        source:
          'canonical_server_sam3_1_vertex_serving_runtime_component_owner' as const,
        evidenceClass:
          'canonical_private_thirty_run_receipt_and_first_runtime_exact_reread' as const,
        status: 'component_evidence_ready' as const,
        componentVersion: 1 as const,
        qualificationId: request.targetQualificationId,
        sourceThirtyRunQualificationRef: receiptRef,
        route: {
          routeId: 'a100_80gb_heavy_primary' as const,
          gpuProfileId:
            'quality_a100_80gb_user_triggered_heavy_job_v1' as const,
          runtimeRegion: 'us-central1' as const,
          executionTarget:
            'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra' as const,
          machineType: 'a2-ultragpu-1g' as const,
          accelerator: 'nvidia_a100_80gb' as const,
        },
        immutableImageDigest: receipt.immutableImageDigest,
        recordedAt,
      }
      const driver = directComponentSchema.parse(
        buildCanonicalSam31VertexServingRuntimeComponentEvidence({
        ...base,
        componentId: request.driverComponentId,
        componentKind: 'driver_and_cuda',
        payload: {
          sourceRunOrdinal: 1,
          sourceTaskRef: taskRef,
          sourceRuntimeResponseRef: responseRef,
          driverEvidence: {
            cudaDriverRuntimeQualificationRef: first.qualificationResultRef,
            observedNvidiaDriverVersion: gpu.observedNvidiaDriverVersion,
            cudaDriverLibraryMode: gpu.cudaDriverLibraryMode,
            loadedCudaDriverLibraryPathDigestSha256:
              gpu.observedCudaDriverLibraryPathDigestSha256,
            cudaForwardCompatibilityPackageSha256:
              gpu.cudaForwardCompatibilityPackageSha256,
            cudaForwardCompatibilityLibraryLoaded:
              gpu.cudaForwardCompatibilityLibraryLoaded,
            hostCudaDriverLibraryLoaded: gpu.hostCudaDriverLibraryLoaded,
            exactDriverVersionAndLoadedLibraryPathReread: true,
          },
          exactFirstRunTaskAndRuntimeResponseReread: true,
          callerDriverOrCudaClaimAccepted: false,
        },
        }),
      )
      const deterministic =
        directComponentSchema.parse(
          buildCanonicalSam31VertexServingRuntimeComponentEvidence({
          ...base,
          componentId: request.deterministicComponentId,
          componentKind: 'deterministic_run_set',
          payload: {
            deterministicRuns: receipt.deterministicRuns.map((run) => ({
              runOrdinal: run.runOrdinal,
              invocationId: run.invocationId,
              qualificationResultRef: run.qualificationResultRef,
              qualificationOutputRef: run.qualificationOutputRef,
              taskRef: run.taskRef,
              runtimeResponseRef: run.runtimeResponseRef,
              manifestRef: run.manifestRef,
              privateOutputRereadEvidenceRef:
                run.privateOutputRereadEvidenceRef,
              providerRoundTripDurationMilliseconds:
                run.providerRoundTripDurationMilliseconds!,
              semanticMaskSetDigestSha256:
                run.semanticMaskSetDigestSha256,
            })),
            deterministicOutputRunCount: 30,
            measuredPerformanceRunCount: 30,
            exactMaskFileCountRereadAcrossDeterministicRuns: 12_000,
            propagatedFrameCountPerRun: 200,
            maskFileCountPerRun: 400,
            allThirtyDeterministicOutputsSemanticallyIdentical: true,
            allThirtyPerformanceMeasurementsUseExactPredictionReceipts: true,
            everyPerformanceRunUsesItsOwnPredictionReceipt: true,
            exactTaskResponseOutputManifestAndMaskEvidenceReread: true,
            dedicatedEndpointMinimumReplicaCount: 0,
            perRunScaleToZeroClaimed: false,
            separateFreshScaleFromZeroReadinessRequiredBeforeDispatch: true,
            automaticRetryOrFallbackAllowed: false,
            customerCreditsMutated: false,
            qaApproved: false,
            publicDeliveryAuthorized: false,
            productionAuthorityGranted: false,
          },
          }),
        )
      const persisted = await Promise.all([
        persistAndReread(input.repository, driver),
        persistAndReread(input.repository, deterministic),
      ])
      return Object.freeze({
        driverAndCuda: persisted[0],
        deterministicRunSet: persisted[1],
      })
    },
  })
}

export function createCanonicalSam31VertexServingRuntimeComponentContinuityOwner() {
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_CONTINUITY_OWNER_VERSION,
    predecessorThirtyRunEvidenceInherited: true as const,
    successorThirtyRunPerformanceClaimed: false as const,
    oneSuccessorCompleteSourceProofRequired: true as const,
    compile(untrusted: unknown) {
      assertPlainSerializedData(
        untrusted,
        'sam31_vertex_serving_runtime_component_continuity_request',
      )
      const request = continuityRequestSchema.parse(untrusted)
      const driver = assertCanonicalSam31VertexServingRuntimeComponentEvidence(
        request.predecessorDriverAndCudaComponent,
      )
      const deterministic =
        assertCanonicalSam31VertexServingRuntimeComponentEvidence(
          request.predecessorDeterministicRunSetComponent,
        )
      const image = assertCanonicalSam31CloudImageSupplyChainRelease(
        request.successorImageSupplyChainRelease,
      )
      const profile = assertCanonicalSam31VertexScaleZeroDeploymentProfile(
        request.successorDeploymentProfile,
      )
      const rollout = assertCanonicalSam31VertexModelVersionRollout(
        request.successorModelVersionRollout,
      )
      if (
        driver.schemaVersion !==
          CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_EVIDENCE_VERSION
        || deterministic.schemaVersion !==
          CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_EVIDENCE_VERSION
        || driver.componentKind !== 'driver_and_cuda'
        || deterministic.componentKind !== 'deterministic_run_set'
        || driver.qualificationId !== deterministic.qualificationId
        || driver.immutableImageDigest !== PREDECESSOR_IMAGE_DIGEST
        || deterministic.immutableImageDigest !== PREDECESSOR_IMAGE_DIGEST
        || !sameRef(driver.sourceThirtyRunQualificationRef,
          deterministic.sourceThirtyRunQualificationRef)
        || driver.sourceThirtyRunQualificationRef.id !==
          'sam31-a100-v6-thirty-qualified-20260815-v1'
        || driver.sourceThirtyRunQualificationRef.contentHash !==
          PREDECESSOR_THIRTY_RUN_QUALIFICATION_HASH
        || image.releaseId !==
          CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_SUPPLY_CHAIN_RELEASE_ID
        || `sha256:${image.releaseHash}` !==
          CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_SUPPLY_CHAIN_RELEASE_HASH
        || image.immutableImageDigest !==
          CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST
        || !image.authority.imageSupplyChainQualified
        || image.authority.runtimeReleaseGranted
        || profile.profileHash !==
          CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYMENT_PROFILE_HASH.slice(7)
        || profile.immutableImageDigest !== image.immutableImageDigest
        || rollout.rolloutId !==
          CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ROLLOUT_ID
        || `sha256:${rollout.rolloutHash}` !==
          CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ROLLOUT_HASH
        || rollout.immutableImageDigest !== image.immutableImageDigest
        || Date.parse(request.recordedAt) < Date.parse(image.qualifiedAt)
        || Date.parse(request.recordedAt) < Date.parse(profile.recordedAt)
        || Date.parse(request.recordedAt) < Date.parse(rollout.observedAt)
      ) throw conflict('successor_continuity_lineage_changed')

      const base = {
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_CONTINUITY_EVIDENCE_VERSION,
        ownerVersion:
          CANONICAL_SAM3_1_VERTEX_SERVING_RUNTIME_COMPONENT_CONTINUITY_OWNER_VERSION,
        source:
          'canonical_server_sam3_1_vertex_serving_runtime_component_continuity_owner' as const,
        evidenceClass:
          'predecessor_thirty_run_exact_reread_plus_qualified_successor_supply_chain_pending_one_complete_source_proof' as const,
        status:
          'successor_component_continuity_ready_for_one_private_proof' as const,
        componentVersion: 2 as const,
        qualificationId: request.targetQualificationId,
        sourceThirtyRunQualificationRef:
          driver.sourceThirtyRunQualificationRef,
        route: driver.route,
        immutableImageDigest: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
        predecessorImmutableImageDigest: PREDECESSOR_IMAGE_DIGEST,
        successorImageSupplyChainReleaseRef: ref(
          image.releaseId,
          image.releaseHash,
        ),
        successorDeploymentProfileRef: ref(
          CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYMENT_PROFILE_ID,
          profile.profileHash,
        ),
        successorModelVersionRolloutRef: ref(
          rollout.rolloutId,
          rollout.rolloutHash,
        ),
        sourceAndDependencyClosureRef: image.sourceAndDependencyClosureRef,
        predecessorThirtyRunEvidenceExactReread: true as const,
        successorSourceAndDependencyClosureExactReread: true as const,
        successorThirtyRunPerformanceClaimed: false as const,
        oneSuccessorCompleteSourceProofRequired: true as const,
        automaticRetryOrFallbackAllowed: false as const,
        customerCreditsMutated: false as const,
        qaApproved: false as const,
        publicDeliveryAuthorized: false as const,
        productionAuthorityGranted: false as const,
        recordedAt: request.recordedAt,
      }
      return Object.freeze({
        driverAndCuda: continuityComponentSchema.parse(
          buildCanonicalSam31VertexServingRuntimeComponentEvidence({
            ...base,
            componentId: request.driverComponentId,
            componentKind: 'driver_and_cuda',
            payload: {
              predecessorComponentRef:
                canonicalSam31VertexServingRuntimeComponentRef(driver),
              predecessorDriverAndCudaEvidenceRetained: true,
              successorDriverAndCudaEvidencePendingOneProof: true,
            },
          }),
        ),
        deterministicRunSet: continuityComponentSchema.parse(
          buildCanonicalSam31VertexServingRuntimeComponentEvidence({
            ...base,
            componentId: request.deterministicComponentId,
            componentKind: 'deterministic_run_set',
            payload: {
              predecessorComponentRef:
                canonicalSam31VertexServingRuntimeComponentRef(deterministic),
              predecessorDeterministicOutputRunCount: 30,
              predecessorMeasuredPerformanceRunCount: 30,
              predecessorSemanticMaskSetDigestSha256:
                deterministic.payload.deterministicRuns[0]!
                  .semanticMaskSetDigestSha256,
              successorDeterministicAndPerformanceEvidencePendingOneProof:
                true,
            },
          }),
        ),
      })
    },
  })
}

export function buildCanonicalSam31VertexServingRuntimeComponentEvidence(
  value: unknown,
): CanonicalSam31VertexServingRuntimeComponentEvidence {
  assertPlainSerializedData(value,
    'sam31_vertex_serving_runtime_component_build')
  const payload = anyComponentWithoutHashSchema.parse(value)
  return assertCanonicalSam31VertexServingRuntimeComponentEvidence({
    ...payload,
    componentHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31VertexServingRuntimeComponentEvidence(
  value: unknown,
): CanonicalSam31VertexServingRuntimeComponentEvidence {
  assertPlainSerializedData(value, 'sam31_vertex_serving_runtime_component')
  const component = componentSchema.parse(value)
  const { componentHash, ...payload } = component
  if (componentHash !== sha256AuthorityValue(payload)) {
    throw conflict('component_hash_changed')
  }
  return component
}

export function canonicalSam31VertexServingRuntimeComponentRef(
  value: unknown,
): EvidenceRef {
  const component =
    assertCanonicalSam31VertexServingRuntimeComponentEvidence(value)
  return ref(component.componentId, component.componentHash)
}

export function createCanonicalSam31VertexServingRuntimeComponentRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31VertexServingRuntimeComponentRepository {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (componentRef: EvidenceRef) => {
    const acceptedRef = refSchema.parse(componentRef)
    const body = await input.objectPort.readExact(
      `${prefix}/${acceptedRef.id}.json`,
    )
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw conflict('component_bytes_changed')
    }
    const component =
      assertCanonicalSam31VertexServingRuntimeComponentEvidence(
        JSON.parse(body.toString('utf8')) as unknown,
      )
    if (!sameRef(canonicalSam31VertexServingRuntimeComponentRef(component),
      acceptedRef)
      || stableAuthorityStringify(component) !== body.toString('utf8')) {
      throw conflict('component_exact_reread_changed')
    }
    return Object.freeze(structuredClone(component))
  }
  return Object.freeze({
    async persistCreateOnly({ component: raw }: {
      readonly component: CanonicalSam31VertexServingRuntimeComponentEvidence
    }) {
      const component =
        assertCanonicalSam31VertexServingRuntimeComponentEvidence(raw)
      const body = Buffer.from(stableAuthorityStringify(component), 'utf8')
      const disposition = await input.objectPort.createOnly({
        objectPath: `${prefix}/${component.componentId}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const exact = await reread(
        canonicalSam31VertexServingRuntimeComponentRef(component),
      )
      if (!exact || exact.componentHash !== component.componentHash) {
        throw conflict('component_persistence_reread_failed')
      }
      return disposition === 'created'
        ? 'created' as const : 'identical_replay' as const
    },
    reread({ componentRef }: { readonly componentRef: EvidenceRef }) {
      return reread(componentRef)
    },
  })
}

export function createCanonicalGcpSam31VertexServingRuntimeComponentOwner(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const control = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_PLANE_BUCKET,
  })
  const privateGpu = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: PRIVATE_GPU_BUCKET,
    acceptedReadContentTypes: ['application/json', 'application/octet-stream'],
  })
  const receiptRepository =
    createCanonicalSam31VertexServingThirtyRunQualificationRepository({
      objectPort: control,
    })
  const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
    objectPort: privateGpu,
    prefix: TASK_PREFIX,
  })
  return createCanonicalSam31VertexServingRuntimeComponentOwner({
    readPort: {
      rereadThirtyRunQualification({ qualificationSetId }) {
        return receiptRepository.reread({ qualificationSetId })
      },
      rereadFirstRunTask({ invocationId }) {
        return taskStore.rereadTask(invocationId)
      },
      rereadFirstRunResponse({ invocationId }) {
        return taskStore.rereadRuntimeResponse(invocationId)
      },
    },
    repository:
      createCanonicalSam31VertexServingRuntimeComponentRepository({
        objectPort: control,
      }),
    now: input.now,
  })
}

async function persistAndReread<
  const Component extends CanonicalSam31VertexServingRuntimeComponentEvidence,
>(
  repository: CanonicalSam31VertexServingRuntimeComponentRepository,
  component: Component,
): Promise<Component> {
  await repository.persistCreateOnly({ component })
  const reread = await repository.reread({
    componentRef: canonicalSam31VertexServingRuntimeComponentRef(component),
  })
  if (!reread || reread.componentHash !== component.componentHash) {
    throw conflict('component_reread_missing')
  }
  return reread as Component
}

function assertOwnerDependencies(input: {
  readPort: CanonicalSam31VertexServingRuntimeComponentReadPort
  repository: CanonicalSam31VertexServingRuntimeComponentRepository
}): void {
  if (typeof input.readPort?.rereadThirtyRunQualification !== 'function'
    || typeof input.readPort?.rereadFirstRunTask !== 'function'
    || typeof input.readPort?.rereadFirstRunResponse !== 'function'
    || typeof input.repository?.persistCreateOnly !== 'function'
    || typeof input.repository?.reread !== 'function') {
    throw conflict('owner_dependency_missing')
  }
}

function ref(id: string, hash: string): EvidenceRef {
  return refSchema.parse({ id, version: 1, contentHash: `sha256:${hash}` })
}

function sameRef(
  left: Readonly<{ id: string; version: number; contentHash: string }>,
  right: Readonly<{ id: string; version: number; contentHash: string }>,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function refKey(value: EvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function conflict(code: string): TypeError {
  return new TypeError(`SAM31_VERTEX_SERVING_COMPONENT_CONFLICT:${code}`)
}
