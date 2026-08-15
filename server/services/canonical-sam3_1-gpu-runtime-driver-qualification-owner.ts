import { z } from 'zod'

import { Storage } from '@google-cloud/storage'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuDurableLifecycleStore,
} from './canonical-professional-gpu-durable-lifecycle-store'

import {
  assertCanonicalProfessionalGpuJobLaunch,
  assertPlainSerializedData,
  type CanonicalProfessionalGpuJobLaunch,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_EVIDENCE_VERSION,
  buildCanonicalSam31GpuRuntimeQualificationComponentEvidence,
  canonicalSam31GpuRuntimeQualificationComponentRef,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidence,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import type {
  CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from './canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from './canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  assertCanonicalSam31GpuRuntimeResponse,
  type CanonicalSam31GpuRuntimeResponse,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuRuntimeResultAdmission,
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
  type CanonicalSam31GpuRuntimeResultAdmission,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuTaskRecord,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
  type CanonicalSam31GpuTaskRecord,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_GPU_RUNTIME_DRIVER_QUALIFICATION_OWNER_VERSION =
  'canonical-sam3_1-gpu-runtime-driver-qualification-owner-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const requestSchema = z.object({
  componentId: safeId,
  qualificationId: safeId,
  invocationId: safeId,
  taskRef: refSchema,
  launchRef: refSchema,
  resultAdmissionRef: refSchema,
  runtimeResponseObjectRef: refSchema,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

export interface CanonicalSam31GpuRuntimeDriverQualificationReadPort {
  rereadTask(input: {
    readonly invocationId: string
    readonly taskRef: EvidenceRef
  }): Promise<unknown | null>
  rereadLaunch(input: {
    readonly invocationId: string
    readonly launchRef: EvidenceRef
  }): Promise<unknown | null>
  rereadResultAdmission(input: {
    readonly invocationId: string
    readonly resultAdmissionRef: EvidenceRef
  }): Promise<unknown | null>
  rereadRuntimeResponse(input: {
    readonly invocationId: string
    readonly runtimeResponseObjectRef: EvidenceRef
  }): Promise<unknown | null>
}

export interface CanonicalSam31GpuRuntimeDriverQualificationOwner {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GPU_RUNTIME_DRIVER_QUALIFICATION_OWNER_VERSION
  readonly evidenceClass:
    'canonical_task_launch_result_response_reread'
  compileAndPersistDriverQualificationComponent(input: unknown): Promise<
    CanonicalSam31GpuRuntimeQualificationComponentEvidence
  >
}

export function createCanonicalSam31GpuRuntimeDriverQualificationOwner(input: {
  readonly readPort: CanonicalSam31GpuRuntimeDriverQualificationReadPort
  readonly componentRepository:
    CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository
  readonly now?: () => string
}): CanonicalSam31GpuRuntimeDriverQualificationOwner {
  assertReadPort(input.readPort)
  assertRepository(input.componentRepository)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_GPU_RUNTIME_DRIVER_QUALIFICATION_OWNER_VERSION,
    evidenceClass:
      'canonical_task_launch_result_response_reread' as const,

    async compileAndPersistDriverQualificationComponent(untrusted: unknown) {
      assertPlainSerializedData(
        untrusted,
        'sam31_gpu_driver_qualification_request',
      )
      const request = requestSchema.parse(untrusted)
      const [taskValue, launchValue, resultValue, responseValue] =
        await Promise.all([
          input.readPort.rereadTask({
            invocationId: request.invocationId,
            taskRef: request.taskRef,
          }),
          input.readPort.rereadLaunch({
            invocationId: request.invocationId,
            launchRef: request.launchRef,
          }),
          input.readPort.rereadResultAdmission({
            invocationId: request.invocationId,
            resultAdmissionRef: request.resultAdmissionRef,
          }),
          input.readPort.rereadRuntimeResponse({
            invocationId: request.invocationId,
            runtimeResponseObjectRef: request.runtimeResponseObjectRef,
          }),
        ])
      if (!taskValue || !launchValue || !resultValue || !responseValue) {
        throw conflict('required_canonical_record_missing')
      }
      const task = assertCanonicalSam31GpuTaskRecord(taskValue)
      const launch = assertCanonicalProfessionalGpuJobLaunch(launchValue)
      const result = assertCanonicalSam31GpuRuntimeResultAdmission(resultValue)
      const response = assertCanonicalSam31GpuRuntimeResponse({
        request: task.runtimeRequest,
        response: responseValue,
      })
      assertExactLineage({ request, task, launch, result, response })
      const gpu = response.gpuEvidence
      if (response.status !== 'completed' || gpu === null) {
        throw conflict('completed_gpu_evidence_required')
      }
      const component =
        buildCanonicalSam31GpuRuntimeQualificationComponentEvidence({
          schemaVersion:
            CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_EVIDENCE_VERSION,
          source:
            'canonical_sam3_1_gpu_runtime_qualification_component_owner',
          evidenceClass: 'canonical_private_reread',
          status: 'component_evidence_ready',
          componentId: request.componentId,
          componentVersion: 1,
          qualificationId: request.qualificationId,
          route: canonicalSam31GpuQualificationRouteForLaunch(launch),
          immutableImageDigest: launch.immutableImageDigest,
          recordedAt: z.string().datetime({ offset: true }).parse(now()),
          componentKind: 'driver_and_cuda',
          payload: {
            cudaDriverRuntimeQualificationRef: request.resultAdmissionRef,
            observedNvidiaDriverVersion:
              gpu.observedNvidiaDriverVersion,
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
        })
      const persistedRef = await input.componentRepository
        .persistComponentEvidenceCreateOnly({ componentEvidence: component })
      const expectedRef =
        canonicalSam31GpuRuntimeQualificationComponentRef(component)
      if (!sameRef(persistedRef, expectedRef)) {
        throw conflict('component_persistence_reference_mismatch')
      }
      const reread = await input.componentRepository.rereadComponentEvidence({
        componentEvidenceRef: persistedRef,
      })
      if (!reread || !sameRef(
        canonicalSam31GpuRuntimeQualificationComponentRef(reread),
        expectedRef,
      )) throw conflict('component_exact_reread_failed')
      return reread
    },
  })
}

export function createCanonicalSam31GpuRuntimeDriverQualificationOwnerFromObjectPort(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly now?: () => string
  },
): CanonicalSam31GpuRuntimeDriverQualificationOwner {
  return createCanonicalSam31GpuRuntimeDriverQualificationOwnerFromObjectPorts({
    controlPlaneObjectPort: input.objectPort,
    privateGpuObjectPort: input.objectPort,
    now: input.now,
  })
}

export function createCanonicalSam31GpuRuntimeDriverQualificationOwnerFromObjectPorts(
  input: {
    readonly controlPlaneObjectPort: CanonicalCreateOnlyJsonObjectPort
    readonly privateGpuObjectPort: CanonicalCreateOnlyJsonObjectPort
    readonly now?: () => string
  },
): CanonicalSam31GpuRuntimeDriverQualificationOwner {
  const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
    objectPort: input.privateGpuObjectPort,
  })
  const resultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
    objectPort: input.privateGpuObjectPort,
  })
  const lifecycleStore = createCanonicalProfessionalGpuDurableLifecycleStore({
    objectPort: input.controlPlaneObjectPort,
  })
  return createCanonicalSam31GpuRuntimeDriverQualificationOwner({
    readPort: {
      rereadTask({ invocationId }) {
        return taskStore.rereadTask(invocationId)
      },
      rereadLaunch({ launchRef }) {
        return lifecycleStore.rereadLaunchRecord({
          launchRecordId: launchRef.id,
        })
      },
      rereadResultAdmission({ invocationId }) {
        return resultStore.rereadResultAdmission(invocationId)
      },
      rereadRuntimeResponse({ invocationId }) {
        return taskStore.rereadRuntimeResponse(invocationId)
      },
    },
    componentRepository:
      createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
        objectPort: input.controlPlaneObjectPort,
      }),
    now: input.now,
  })
}

export function createCanonicalSam31GcpGpuRuntimeDriverQualificationOwner(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
): CanonicalSam31GpuRuntimeDriverQualificationOwner {
  // These immutable cloud resource IDs intentionally retain their established
  // identity after the WeEditPro product rename.
  const storage = input.storage ?? new Storage({ projectId: 'reeditpro' })
  return createCanonicalSam31GpuRuntimeDriverQualificationOwnerFromObjectPorts({
    controlPlaneObjectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: 'reeditpro-production-reeditpro-control-plane-state',
    }),
    privateGpuObjectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: 'reeditpro-production-reeditpro-masks',
    }),
    now: input.now,
  })
}

function assertExactLineage(input: {
  request: z.infer<typeof requestSchema>
  task: CanonicalSam31GpuTaskRecord
  launch: CanonicalProfessionalGpuJobLaunch
  result: CanonicalSam31GpuRuntimeResultAdmission
  response: CanonicalSam31GpuRuntimeResponse
}): void {
  const { request, task, launch, result, response } = input
  const exact = request.invocationId === task.invocationId
    && sameRef(request.taskRef, ref(task.taskId, task.taskRecordHash))
    && sameRef(request.launchRef, ref(launch.launchRecordId, launch.launchHash))
    && sameRef(
      request.resultAdmissionRef,
      ref(result.resultAdmissionId, result.resultAdmissionHash),
    )
    && sameRef(request.runtimeResponseObjectRef,
      result.runtimeResponseObjectRef)
    && sameRef(result.taskRef, request.taskRef)
    && sameRef(result.launchRef, request.launchRef)
    && sameRef(result.runtimeRequestRef, task.runtimeRequestRef)
    && result.runtimeResponseBindingSha256 === response.responseBindingSha256
    && result.status === 'ready_for_independent_mask_artifact_qa'
    && result.exactTaskResponseLaunchTerminalAndOutputReread
    && result.actualNvdecCudaBfloat16ExecutionVerified
    && result.terminalWorkerStoppedAndScaleBackToZeroVerified
    && result.accountEffectiveAttemptCostReceiptPersisted
    && launch.launchDisposition === 'job_created'
    && launch.toolId === 'sam3_1'
    && launch.operationId === task.runtimeRequest.operationId
    && launch.routeId === task.runtimeRequest.dispatch.routeRole
    && launch.accelerator === task.runtimeRequest.dispatch.accelerator
    && response.gpuEvidence?.requestedAccelerator === launch.accelerator
  if (!exact) throw conflict('canonical_lineage_mismatch')
}

export function canonicalSam31GpuQualificationRouteForLaunch(
  launch: CanonicalProfessionalGpuJobLaunch,
) {
  const primary = launch.routeId === 'a100_80gb_heavy_primary'
  const expected = primary
    ? {
        runtimeRegion: 'us-central1',
        executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
        accelerator: 'nvidia_a100_80gb',
      } as const
    : {
        runtimeRegion: 'us-central1',
        executionTarget: 'google_cloud_run_l4_job',
        accelerator: 'nvidia_l4',
      } as const
  if (
    launch.runtimeRegion !== expected.runtimeRegion
    || launch.executionTarget !== expected.executionTarget
    || launch.accelerator !== expected.accelerator
  ) throw conflict('route_launch_mismatch')
  return primary
    ? {
        routeId: launch.routeId,
        gpuProfileId: 'quality_a100_80gb_user_triggered_heavy_job_v1' as const,
        runtimeRegion: launch.runtimeRegion,
        executionTarget: launch.executionTarget,
        machineType: 'a2-ultragpu-1g' as const,
        accelerator: launch.accelerator,
      }
    : {
        routeId: launch.routeId,
        gpuProfileId:
          'quality_l4_user_triggered_heavy_fallback_job_v1' as const,
        runtimeRegion: launch.runtimeRegion,
        executionTarget: launch.executionTarget,
        machineType: 'cloud_run_nvidia_l4' as const,
        accelerator: launch.accelerator,
      }
}

function ref(id: string, hash: string): EvidenceRef {
  return { id, version: 1, contentHash: `sha256:${hash}` }
}

function sameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertReadPort(
  port: CanonicalSam31GpuRuntimeDriverQualificationReadPort,
): void {
  if (
    !port
    || typeof port.rereadTask !== 'function'
    || typeof port.rereadLaunch !== 'function'
    || typeof port.rereadResultAdmission !== 'function'
    || typeof port.rereadRuntimeResponse !== 'function'
  ) throw new Error('SAM 3.1 driver qualification read port is unavailable.')
}

function assertRepository(
  repository: CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
): void {
  if (
    !repository
    || typeof repository.persistComponentEvidenceCreateOnly !== 'function'
    || typeof repository.rereadComponentEvidence !== 'function'
  ) throw new Error('SAM 3.1 component evidence repository is unavailable.')
}

function conflict(reason: string): Error {
  return new Error(`SAM31_GPU_DRIVER_QUALIFICATION_CONFLICT:${reason}`)
}
