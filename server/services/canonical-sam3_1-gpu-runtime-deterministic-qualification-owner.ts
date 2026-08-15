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
  canonicalSam31GpuQualificationRouteForLaunch,
} from './canonical-sam3_1-gpu-runtime-driver-qualification-owner'
import {
  CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_EVIDENCE_VERSION,
  buildCanonicalSam31GpuRuntimeQualificationComponentEvidence,
  canonicalSam31GpuRuntimeQualificationComponentRef,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidence,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from './canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  assertCanonicalSam31QualifiedSourceCheckpointRelease,
  canonicalSam31SourceCheckpointQualificationReferenceSchema,
  createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort,
  projectCanonicalSam31QualifiedSourceCheckpointRelease,
  type CanonicalSam31QualifiedSourceCheckpointRelease,
  type CanonicalSam31SourceCheckpointQualificationReference,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualified-authority'
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

export const
CANONICAL_SAM3_1_GPU_RUNTIME_DETERMINISTIC_QUALIFICATION_OWNER_VERSION =
  'canonical-sam3_1-gpu-runtime-deterministic-qualification-owner-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const sourceQualificationRefSchema =
  canonicalSam31SourceCheckpointQualificationReferenceSchema
const runRequestSchema = z.object({
  runOrdinal: z.number().int().min(1).max(30),
  invocationId: safeId,
  taskRef: refSchema,
  launchRef: refSchema,
  resultAdmissionRef: refSchema,
  runtimeResponseObjectRef: refSchema,
}).strict()
const requestSchema = z.object({
  componentId: safeId,
  qualificationId: safeId,
  sourceCheckpointQualificationRef: sourceQualificationRefSchema,
  deterministicProbeFixtureRef: refSchema,
  runs: z.array(runRequestSchema).length(30),
}).strict().superRefine((value, context) => {
  if (!value.runs.every((run, index) => run.runOrdinal === index + 1)) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 deterministic runs must use exact ordinal order.',
    })
  }
})
type EvidenceRef = z.infer<typeof refSchema>
type RunRequest = z.infer<typeof runRequestSchema>

export interface CanonicalSam31GpuRuntimeDeterministicQualificationReadPort {
  rereadQualificationRelease(input: {
    readonly sourceCheckpointQualificationRef:
      CanonicalSam31SourceCheckpointQualificationReference
  }): Promise<unknown | null>
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

export interface CanonicalSam31GpuRuntimeDeterministicQualificationOwner {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GPU_RUNTIME_DETERMINISTIC_QUALIFICATION_OWNER_VERSION
  readonly evidenceClass:
    'canonical_thirty_run_task_launch_result_response_reread'
  compileAndPersistDeterministicQualificationComponent(input: unknown): Promise<
    CanonicalSam31GpuRuntimeQualificationComponentEvidence
  >
}

export function createCanonicalSam31GpuRuntimeDeterministicQualificationOwner(
  input: {
    readonly readPort:
      CanonicalSam31GpuRuntimeDeterministicQualificationReadPort
    readonly componentRepository:
      CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository
    readonly now?: () => string
  },
): CanonicalSam31GpuRuntimeDeterministicQualificationOwner {
  assertReadPort(input.readPort)
  assertRepository(input.componentRepository)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_GPU_RUNTIME_DETERMINISTIC_QUALIFICATION_OWNER_VERSION,
    evidenceClass:
      'canonical_thirty_run_task_launch_result_response_reread' as const,

    async compileAndPersistDeterministicQualificationComponent(
      untrusted: unknown,
    ) {
      assertPlainSerializedData(
        untrusted,
        'sam31_gpu_deterministic_qualification_request',
      )
      const request = requestSchema.parse(untrusted)
      const releaseValue = await input.readPort.rereadQualificationRelease({
        sourceCheckpointQualificationRef:
          request.sourceCheckpointQualificationRef,
      })
      if (!releaseValue) throw conflict('qualification_release_missing')
      const release =
        assertCanonicalSam31QualifiedSourceCheckpointRelease(releaseValue)
      assertQualificationRelease(request, release)
      const runs = await Promise.all(request.runs.map(async (runRequest) => {
        const [taskValue, launchValue, resultValue, responseValue] =
          await Promise.all([
            input.readPort.rereadTask({
              invocationId: runRequest.invocationId,
              taskRef: runRequest.taskRef,
            }),
            input.readPort.rereadLaunch({
              invocationId: runRequest.invocationId,
              launchRef: runRequest.launchRef,
            }),
            input.readPort.rereadResultAdmission({
              invocationId: runRequest.invocationId,
              resultAdmissionRef: runRequest.resultAdmissionRef,
            }),
            input.readPort.rereadRuntimeResponse({
              invocationId: runRequest.invocationId,
              runtimeResponseObjectRef:
                runRequest.runtimeResponseObjectRef,
            }),
          ])
        if (!taskValue || !launchValue || !resultValue || !responseValue) {
          throw conflict(`run_${runRequest.runOrdinal}_record_missing`)
        }
        const task = assertCanonicalSam31GpuTaskRecord(taskValue)
        const launch = assertCanonicalProfessionalGpuJobLaunch(launchValue)
        const result = assertCanonicalSam31GpuRuntimeResultAdmission(
          resultValue,
        )
        const response = assertCanonicalSam31GpuRuntimeResponse({
          request: task.runtimeRequest,
          response: responseValue,
        })
        return compileRun({
          request,
          runRequest,
          release,
          task,
          launch,
          result,
          response,
        })
      }))
      assertCompleteDeterministicSet(runs)
      const firstLaunchValue = await input.readPort.rereadLaunch({
        invocationId: request.runs[0].invocationId,
        launchRef: request.runs[0].launchRef,
      })
      if (!firstLaunchValue) throw conflict('first_launch_reread_missing')
      const firstLaunch = assertCanonicalProfessionalGpuJobLaunch(
        firstLaunchValue,
      )
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
          route: canonicalSam31GpuQualificationRouteForLaunch(firstLaunch),
          immutableImageDigest: firstLaunch.immutableImageDigest,
          recordedAt: z.string().datetime({ offset: true }).parse(now()),
          componentKind: 'deterministic_run_set',
          payload: runs,
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

export function createCanonicalSam31GpuRuntimeDeterministicQualificationOwnerFromObjectPort(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly now?: () => string
  },
): CanonicalSam31GpuRuntimeDeterministicQualificationOwner {
  return createCanonicalSam31GpuRuntimeDeterministicQualificationOwnerFromObjectPorts({
    controlPlaneObjectPort: input.objectPort,
    privateGpuObjectPort: input.objectPort,
    now: input.now,
  })
}

export function createCanonicalSam31GpuRuntimeDeterministicQualificationOwnerFromObjectPorts(
  input: {
    readonly controlPlaneObjectPort: CanonicalCreateOnlyJsonObjectPort
    readonly privateGpuObjectPort: CanonicalCreateOnlyJsonObjectPort
    readonly now?: () => string
  },
): CanonicalSam31GpuRuntimeDeterministicQualificationOwner {
  const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
    objectPort: input.privateGpuObjectPort,
  })
  const resultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
    objectPort: input.privateGpuObjectPort,
  })
  const lifecycleStore = createCanonicalProfessionalGpuDurableLifecycleStore({
    objectPort: input.controlPlaneObjectPort,
  })
  const releaseReadPort =
    createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort({
      objectPort: input.controlPlaneObjectPort,
    })
  return createCanonicalSam31GpuRuntimeDeterministicQualificationOwner({
    readPort: {
      rereadQualificationRelease({ sourceCheckpointQualificationRef }) {
        return releaseReadPort.rereadQualificationRelease({
          sourceCheckpointQualificationRef,
        })
      },
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

export function createCanonicalSam31GcpGpuRuntimeDeterministicQualificationOwner(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
): CanonicalSam31GpuRuntimeDeterministicQualificationOwner {
  const storage = input.storage ?? new Storage({ projectId: 'reeditpro' })
  return createCanonicalSam31GpuRuntimeDeterministicQualificationOwnerFromObjectPorts({
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

function compileRun(input: {
  request: z.infer<typeof requestSchema>
  runRequest: RunRequest
  release: CanonicalSam31QualifiedSourceCheckpointRelease
  task: CanonicalSam31GpuTaskRecord
  launch: CanonicalProfessionalGpuJobLaunch
  result: CanonicalSam31GpuRuntimeResultAdmission
  response: CanonicalSam31GpuRuntimeResponse
}) {
  const { request, runRequest, release, task, launch, result, response } = input
  const source = projectCanonicalSam31QualifiedSourceCheckpointRelease(release)
  const probe = source.compatibilityProbe
  const gpu = response.gpuEvidence
  const exact = runRequest.invocationId === task.invocationId
    && sameRef(runRequest.taskRef, ref(task.taskId, task.taskRecordHash))
    && sameRef(
      runRequest.launchRef,
      ref(launch.launchRecordId, launch.launchHash),
    )
    && sameRef(
      runRequest.resultAdmissionRef,
      ref(result.resultAdmissionId, result.resultAdmissionHash),
    )
    && sameRef(runRequest.runtimeResponseObjectRef,
      result.runtimeResponseObjectRef)
    && sameRef(result.taskRef, runRequest.taskRef)
    && sameRef(result.launchRef, runRequest.launchRef)
    && sameRef(result.runtimeRequestRef, task.runtimeRequestRef)
    && result.runtimeResponseBindingSha256 === response.responseBindingSha256
    && sameRef(
      task.runtimeRequest.modelArtifacts
        .sourceCheckpointCompatibilityQualificationRef,
      request.sourceCheckpointQualificationRef,
    )
    && sameRef(
      task.runtimeRequest.sourceMedia.gpuPreparedMaskProxyArtifactRef,
      request.deterministicProbeFixtureRef,
    )
    && task.privateInputStagingEvidence.invocationId === task.invocationId
    && sameRef(task.privateInputStagingEvidence.executionEnvelopeRef,
      task.executionEnvelopeRef)
    && sameRef(task.privateInputStagingEvidence.dispatchAdmissionRef,
      task.dispatchAdmissionRef)
    && sameRef(
      task.privateInputStagingEvidence.scope.approvedWorkItemRef,
      task.runtimeRequest.scope.approvedWorkItemRef,
    )
    && sameRef(
      task.privateInputStagingEvidence.scope.workerLeaseRef,
      task.runtimeRequest.scope.workerLeaseRef,
    )
    && sameRef(
      task.privateInputStagingEvidence.scope.executionAttemptRef,
      task.runtimeRequest.scope.executionAttemptRef,
    )
    && sameRef(
      task.privateInputStagingEvidence.gpuPreparedMaskProxyArtifactRef,
      request.deterministicProbeFixtureRef,
    )
    && task.runtimeRequest.modelArtifacts.sourceCandidateRef.candidateHash ===
      source.qualification.candidateRef.candidateHash
    && task.runtimeRequest.modelArtifacts.privateArtifactIngestReceiptRef
      .contentHash === source.qualification.ingestReceiptRef.contentHash
    && task.runtimeRequest.modelArtifacts.sourceRevision ===
      source.sourceArchive.revision
    && task.runtimeRequest.modelArtifacts.sourceArchiveRef.contentHash ===
      source.sourceArchive.artifactRef.contentHash
    && task.runtimeRequest.modelArtifacts.sourceArchiveByteLength ===
      source.sourceArchive.byteLength
    && task.runtimeRequest.modelArtifacts.sourceArchiveSha256 ===
      source.sourceArchive.sha256
    && task.runtimeRequest.modelArtifacts.checkpointRef.contentHash ===
      source.checkpoint.artifactRef.contentHash
    && task.runtimeRequest.modelArtifacts.checkpointRepositoryRevision ===
      source.checkpoint.repositoryRevision
    && task.runtimeRequest.modelArtifacts.checkpointFileName ===
      source.checkpoint.fileName
    && task.runtimeRequest.modelArtifacts.checkpointByteLength ===
      source.checkpoint.byteLength
    && task.runtimeRequest.modelArtifacts.checkpointSha256 ===
      source.checkpoint.sha256
    && task.runtimeRequest.modelArtifacts.immutableImageDigest ===
      launch.immutableImageDigest
    && result.status === 'ready_for_independent_mask_artifact_qa'
    && result.routeId === launch.routeId
    && result.accelerator === launch.accelerator
    && result.exactTaskResponseLaunchTerminalAndOutputReread
    && result.exactGpuAndApprovedFrameRangeVerified
    && result.actualNvdecCudaBfloat16ExecutionVerified
    && result.terminalWorkerStoppedAndScaleBackToZeroVerified
    && result.accountEffectiveAttemptCostReceiptPersisted
    && response.status === 'completed'
    && gpu !== null
    && gpu.requestedAccelerator === launch.accelerator
    && gpu.cudaAvailable
    && gpu.cudaKernelExecutionMeasured
    && gpu.nvdecHardwareDecodeMeasured
    && gpu.decodedFramesResidentOnCuda
    && gpu.bfloat16AutocastUsed
    && !gpu.cpuOnlyInferenceUsed
    && launch.launchDisposition === 'job_created'
    && launch.toolId === 'sam3_1'
    && launch.operationId === task.runtimeRequest.operationId
    && launch.routeId === task.runtimeRequest.dispatch.routeRole
    && launch.accelerator === task.runtimeRequest.dispatch.accelerator
    && release.status === 'qualified_for_private_image_build'
    && release.sourceCheckpointQualificationGranted
    && source.deterministicA100CompatibilityProbeVerified
    && probe.exactDependencyWheelAndNativeClosureReread
    && probe.strictCheckpointLoadRequested
    && probe.missingCheckpointKeyCount === 0
    && probe.unexpectedCheckpointKeyCount === 0
    && probe.checkpointAndModelKeySetsExact
    && probe.actualCudaModelInferenceExecuted
    && probe.bfloat16AutocastExecuted
    && probe.outputMasksWereCudaTensorsBeforeSerialization
    && !probe.cpuOnlyModelExecutionObserved
    && !probe.quantizationOrResolutionReductionUsed
    && task.runtimeRequest.settings.strictCheckpointLoadRequired
    && task.runtimeRequest.settings.sourceResolutionPreserved
    && task.runtimeRequest.settings.sourceFrameRangePreserved
    && !task.runtimeRequest.settings.quantizationAllowed
  if (!exact) throw conflict(`run_${runRequest.runOrdinal}_lineage_mismatch`)
  return {
    runOrdinal: runRequest.runOrdinal,
    qualificationAttemptRef: task.executionEnvelopeRef,
    resultAdmissionRef: runRequest.resultAdmissionRef,
    runtimeRequestRef: task.runtimeRequestRef,
    runtimeResponseObjectRef: runRequest.runtimeResponseObjectRef,
    privateOutputRereadEvidenceRef: result.privateOutputRereadEvidenceRef,
    attemptCostReceiptRef: result.attemptCostReceiptRef,
    immutableImageDigest: launch.immutableImageDigest,
    routeId: launch.routeId,
    accelerator: launch.accelerator,
    deterministicProbeFixtureRef: request.deterministicProbeFixtureRef,
    outputMaskSetDigestSha256: result.manifestRef.contentHash.slice(7),
    exactResultRequestResponseOutputAndCostReread: true as const,
    exactToolModelAndCheckpointReread: true as const,
    exactPythonTorchCudaWheelAndNativeClosureReread: true as const,
    strictCheckpointLoadWithNoMissingOrUnexpectedKeys: true as const,
    actualCudaModelInferenceMeasured: true as const,
    actualNvdecDecodeMeasured: true as const,
    decodedFramesRemainedCudaResident: true as const,
    bfloat16AutocastMeasured: true as const,
    cpuOnlyInferenceObserved: false as const,
    quantizationOrResolutionReductionUsed: false as const,
    sourceResolutionAndFrameRangePreserved: true as const,
    terminalWorkerStoppedAndScaleBackToZeroVerified: true as const,
    customerCreditsMutated: false as const,
    qaApprovalGranted: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
}

function assertQualificationRelease(
  request: z.infer<typeof requestSchema>,
  release: CanonicalSam31QualifiedSourceCheckpointRelease,
): void {
  const source = projectCanonicalSam31QualifiedSourceCheckpointRelease(release)
  if (
    !sameRef(
      request.sourceCheckpointQualificationRef,
      release.sourceCheckpointQualificationRef,
    )
    || release.evidenceClass !== 'canonical_private_reread'
    || release.status !== 'qualified_for_private_image_build'
    || !source.exactCanonicalReread
    || !source.sourceCheckpointQualificationGranted
  ) throw conflict('source_checkpoint_qualification_release_mismatch')
}

function assertCompleteDeterministicSet(
  runs: ReadonlyArray<ReturnType<typeof compileRun>>,
): void {
  const first = runs[0]
  const exact = runs.length === 30
    && runs.every((run, index) => run.runOrdinal === index + 1)
    && new Set(runs.map((run) => refKey(run.qualificationAttemptRef))).size
      === 30
    && new Set(runs.map((run) => refKey(run.resultAdmissionRef))).size === 30
    && new Set(runs.map((run) => refKey(run.runtimeRequestRef))).size === 30
    && new Set(runs.map((run) =>
      refKey(run.runtimeResponseObjectRef))).size === 30
    && new Set(runs.map((run) =>
      refKey(run.privateOutputRereadEvidenceRef))).size === 30
    && new Set(runs.map((run) => refKey(run.attemptCostReceiptRef))).size
      === 30
    && runs.every((run) =>
      run.routeId === first.routeId
      && run.accelerator === first.accelerator
      && run.immutableImageDigest === first.immutableImageDigest
      && refKey(run.deterministicProbeFixtureRef) ===
        refKey(first.deterministicProbeFixtureRef)
      && run.outputMaskSetDigestSha256 ===
        first.outputMaskSetDigestSha256)
  if (!exact) throw conflict('thirty_run_set_not_deterministic')
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

function refKey(value: {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function assertReadPort(
  port: CanonicalSam31GpuRuntimeDeterministicQualificationReadPort,
): void {
  if (
    !port
    || typeof port.rereadQualificationRelease !== 'function'
    || typeof port.rereadTask !== 'function'
    || typeof port.rereadLaunch !== 'function'
    || typeof port.rereadResultAdmission !== 'function'
    || typeof port.rereadRuntimeResponse !== 'function'
  ) throw new Error(
    'SAM 3.1 deterministic qualification read port is unavailable.',
  )
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
  return new Error(`SAM31_GPU_DETERMINISTIC_QUALIFICATION_CONFLICT:${reason}`)
}
