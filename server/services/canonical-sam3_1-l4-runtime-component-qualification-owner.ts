import { createHash } from 'node:crypto'

import { z } from 'zod'

import { Storage } from '@google-cloud/storage'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuJobLaunch,
  assertPlainSerializedData,
  type CanonicalProfessionalGpuJobLaunch,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31CrossAcceleratorMaskComparison,
  createCanonicalSam31CrossAcceleratorMaskComparisonRepository,
  type CanonicalSam31CrossAcceleratorMaskComparison,
} from './canonical-sam3_1-cross-accelerator-mask-comparison-service'
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
  canonicalSam31GpuQualificationRouteForLaunch,
} from './canonical-sam3_1-gpu-runtime-driver-qualification-owner'
import {
  assertCanonicalSam31L4RuntimePrivateRunReceipt,
  createCanonicalSam31L4RuntimePrivateRunReceiptRepository,
  type CanonicalSam31L4RuntimePrivateRunReceipt,
} from './canonical-sam3_1-l4-runtime-qualification-run-receipt-service'
import {
  assertCanonicalSam31L4RuntimeThirtyRunQualification,
  createCanonicalSam31L4RuntimeThirtyRunQualificationRepository,
  type CanonicalSam31L4RuntimeThirtyRunQualification,
} from './canonical-sam3_1-l4-runtime-thirty-run-qualification-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31QualifiedSourceCheckpointRelease,
  createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort,
  projectCanonicalSam31QualifiedSourceCheckpointRelease,
  type CanonicalSam31QualifiedSourceCheckpointRelease,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualified-authority'
import {
  assertCanonicalSam31L4QualificationAttemptCostReceipt,
  createCanonicalSam31L4QualificationAttemptCostRepository,
  type CanonicalSam31L4QualificationAttemptCostReceipt,
} from '../tool-cost-metering/canonical-sam3_1-l4-qualification-attempt-cost'
import {
  assertCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
  type CanonicalSam31GpuRuntimeResponse,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31PrivateOutputRereadEvidence,
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
  type CanonicalSam31PrivateOutputRereadEvidence,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuTaskRecord,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
  type CanonicalSam31GpuTaskRecord,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const
CANONICAL_SAM3_1_L4_RUNTIME_COMPONENT_QUALIFICATION_OWNER_VERSION =
  'canonical-sam3_1-l4-runtime-component-qualification-owner-v1' as const

const L4_LAUNCH_PREFIX =
  'private/sam3_1/l4-runtime-qualification/v3/launches' as const
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
  driverComponentId: safeId,
  deterministicComponentId: safeId,
  qualificationSetId: safeId,
  qualificationId: safeId,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

export interface CanonicalSam31L4RuntimeComponentQualificationReadPort {
  rereadThirtyRunQualification(input: {
    readonly qualificationSetId: string
  }): Promise<unknown | null>
  rereadRunReceipt(input: {
    readonly qualificationId: string
    readonly runOrdinal: number
  }): Promise<unknown | null>
  rereadAttemptCostReceipt(input: {
    readonly qualificationId: string
    readonly runOrdinal: number
  }): Promise<unknown | null>
  rereadTask(input: {
    readonly invocationId: string
  }): Promise<unknown | null>
  rereadLaunch(input: {
    readonly launchRef: EvidenceRef
  }): Promise<unknown | null>
  rereadRuntimeResponse(input: {
    readonly invocationId: string
  }): Promise<unknown | null>
  rereadPrivateOutput(input: {
    readonly invocationId: string
    readonly evidenceRef: EvidenceRef
  }): Promise<unknown | null>
  rereadSourceCheckpointRelease(input: {
    readonly sourceCheckpointQualificationRef:
      CanonicalSam31GpuTaskRecord['runtimeRequest']['modelArtifacts']['sourceCheckpointCompatibilityQualificationRef']
  }): Promise<unknown | null>
  rereadCrossAcceleratorComparison(input: {
    readonly comparisonRef: EvidenceRef
  }): Promise<unknown | null>
}

export interface CanonicalSam31L4RuntimeComponentQualificationOwner {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_L4_RUNTIME_COMPONENT_QUALIFICATION_OWNER_VERSION
  readonly evidenceClass:
    'canonical_specialized_l4_run_cost_task_response_output_comparison_reread'
  compileAndPersistComponents(input: unknown): Promise<{
    readonly driverAndCuda:
      CanonicalSam31GpuRuntimeQualificationComponentEvidence
    readonly deterministicRunSet:
      CanonicalSam31GpuRuntimeQualificationComponentEvidence
  }>
}

export function createCanonicalSam31L4RuntimeComponentQualificationOwner(
  input: {
    readonly readPort: CanonicalSam31L4RuntimeComponentQualificationReadPort
    readonly componentRepository:
      CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository
  },
): CanonicalSam31L4RuntimeComponentQualificationOwner {
  assertReadPort(input.readPort)
  assertRepository(input.componentRepository)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_L4_RUNTIME_COMPONENT_QUALIFICATION_OWNER_VERSION,
    evidenceClass:
      'canonical_specialized_l4_run_cost_task_response_output_comparison_reread' as const,

    async compileAndPersistComponents(untrusted: unknown) {
      assertPlainSerializedData(
        untrusted,
        'sam31_l4_runtime_component_qualification_request',
      )
      const request = requestSchema.parse(untrusted)
      const setValue = await input.readPort.rereadThirtyRunQualification({
        qualificationSetId: request.qualificationSetId,
      })
      if (!setValue) throw conflict('thirty_run_qualification_missing')
      const set = assertCanonicalSam31L4RuntimeThirtyRunQualification(setValue)
      assertSetIdentity(request, set)

      const compiled = [] as Array<ReturnType<typeof compileRun>>
      let release: CanonicalSam31QualifiedSourceCheckpointRelease | null = null
      for (let ordinal = 1; ordinal <= 30; ordinal += 1) {
        const setRun = set.runs[ordinal - 1]
        if (!setRun || setRun.runOrdinal !== ordinal) {
          throw conflict(`run_${ordinal}_set_record_missing`)
        }
        const [runValue, costValue] = await Promise.all([
          input.readPort.rereadRunReceipt({
            qualificationId: request.qualificationId,
            runOrdinal: ordinal,
          }),
          input.readPort.rereadAttemptCostReceipt({
            qualificationId: request.qualificationId,
            runOrdinal: ordinal,
          }),
        ])
        if (!runValue || !costValue) {
          throw conflict(`run_${ordinal}_receipt_or_cost_missing`)
        }
        const run = assertCanonicalSam31L4RuntimePrivateRunReceipt(runValue)
        const cost = assertCanonicalSam31L4QualificationAttemptCostReceipt(
          costValue,
        )
        const invocationId = invocationIdFromTaskRef(run.taskRef)
        const [taskValue, launchValue, responseValue, outputValue,
          comparisonValue] = await Promise.all([
          input.readPort.rereadTask({ invocationId }),
          input.readPort.rereadLaunch({ launchRef: run.launchRef }),
          input.readPort.rereadRuntimeResponse({ invocationId }),
          input.readPort.rereadPrivateOutput({
            invocationId,
            evidenceRef: run.privateOutputRereadEvidenceRef,
          }),
          input.readPort.rereadCrossAcceleratorComparison({
            comparisonRef: run.crossAcceleratorMaskComparisonRef,
          }),
        ])
        if (!taskValue || !launchValue || !responseValue || !outputValue
          || !comparisonValue) {
          throw conflict(`run_${ordinal}_canonical_record_missing`)
        }
        const task = assertCanonicalSam31GpuTaskRecord(taskValue)
        const launch = assertCanonicalProfessionalGpuJobLaunch(launchValue)
        const response = assertCanonicalSam31GpuRuntimeResponse({
          request: task.runtimeRequest,
          response: responseValue,
        })
        const output = assertCanonicalSam31PrivateOutputRereadEvidence(
          outputValue,
        )
        const comparison = assertComparison(comparisonValue)
        if (!release) {
          const releaseValue = await input.readPort
            .rereadSourceCheckpointRelease({
              sourceCheckpointQualificationRef: task.runtimeRequest
                .modelArtifacts.sourceCheckpointCompatibilityQualificationRef,
            })
          if (!releaseValue) throw conflict('source_release_missing')
          release = assertCanonicalSam31QualifiedSourceCheckpointRelease(
            releaseValue,
          )
        }
        compiled.push(compileRun({
          set,
          setRun,
          run,
          cost,
          invocationId,
          task,
          launch,
          response,
          output,
          comparison,
          release,
        }))
      }
      assertCompleteSet(compiled)
      const first = compiled[0]!
      const recordedAt = latestRecordedAt(
        compiled.map((item) => item.cost.recordedAt),
      )
      const route = canonicalSam31GpuQualificationRouteForLaunch(first.launch)
      const driverAndCuda =
        buildCanonicalSam31GpuRuntimeQualificationComponentEvidence({
          schemaVersion:
            CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_EVIDENCE_VERSION,
          source:
            'canonical_sam3_1_gpu_runtime_qualification_component_owner',
          evidenceClass: 'canonical_private_reread',
          status: 'component_evidence_ready',
          componentId: request.driverComponentId,
          componentVersion: 1,
          qualificationId: request.qualificationId,
          route,
          immutableImageDigest: first.run.immutableImageDigest,
          recordedAt,
          componentKind: 'driver_and_cuda',
          payload: {
            cudaDriverRuntimeQualificationRef: first.runReceiptRef,
            observedNvidiaDriverVersion:
              first.response.gpuEvidence!.observedNvidiaDriverVersion,
            cudaDriverLibraryMode:
              first.response.gpuEvidence!.cudaDriverLibraryMode,
            loadedCudaDriverLibraryPathDigestSha256:
              first.response.gpuEvidence!
                .observedCudaDriverLibraryPathDigestSha256,
            cudaForwardCompatibilityPackageSha256:
              first.response.gpuEvidence!
                .cudaForwardCompatibilityPackageSha256,
            cudaForwardCompatibilityLibraryLoaded:
              first.response.gpuEvidence!
                .cudaForwardCompatibilityLibraryLoaded,
            hostCudaDriverLibraryLoaded:
              first.response.gpuEvidence!.hostCudaDriverLibraryLoaded,
            exactDriverVersionAndLoadedLibraryPathReread: true,
          },
        })
      const deterministicRunSet =
        buildCanonicalSam31GpuRuntimeQualificationComponentEvidence({
          schemaVersion:
            CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_EVIDENCE_VERSION,
          source:
            'canonical_sam3_1_gpu_runtime_qualification_component_owner',
          evidenceClass: 'canonical_private_reread',
          status: 'component_evidence_ready',
          componentId: request.deterministicComponentId,
          componentVersion: 1,
          qualificationId: request.qualificationId,
          route,
          immutableImageDigest: first.run.immutableImageDigest,
          recordedAt,
          componentKind: 'deterministic_run_set',
          payload: compiled.map((item) => item.payload),
        })
      const [driverRef, deterministicRef] = await Promise.all([
        persistExact(input.componentRepository, driverAndCuda),
        persistExact(input.componentRepository, deterministicRunSet),
      ])
      const [driverReread, deterministicReread] = await Promise.all([
        input.componentRepository.rereadComponentEvidence({
          componentEvidenceRef: driverRef,
        }),
        input.componentRepository.rereadComponentEvidence({
          componentEvidenceRef: deterministicRef,
        }),
      ])
      if (!driverReread || !deterministicReread) {
        throw conflict('component_exact_reread_missing')
      }
      return Object.freeze({
        driverAndCuda: driverReread,
        deterministicRunSet: deterministicReread,
      })
    },
  })
}

export function createCanonicalSam31L4RuntimeComponentQualificationOwnerFromObjectPorts(
  input: {
    readonly controlPlaneObjectPort: CanonicalCreateOnlyJsonObjectPort
    readonly privateGpuObjectPort: CanonicalCreateOnlyJsonObjectPort
  },
): CanonicalSam31L4RuntimeComponentQualificationOwner {
  const runRepository =
    createCanonicalSam31L4RuntimePrivateRunReceiptRepository({
      objectPort: input.controlPlaneObjectPort,
    })
  const setRepository =
    createCanonicalSam31L4RuntimeThirtyRunQualificationRepository({
      objectPort: input.controlPlaneObjectPort,
    })
  const costRepository =
    createCanonicalSam31L4QualificationAttemptCostRepository({
      objectPort: input.controlPlaneObjectPort,
    })
  const comparisonRepository =
    createCanonicalSam31CrossAcceleratorMaskComparisonRepository({
      objectPort: input.controlPlaneObjectPort,
    })
  const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
    objectPort: input.privateGpuObjectPort,
  })
  const resultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
    objectPort: input.privateGpuObjectPort,
  })
  const releasePort =
    createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort({
      objectPort: input.controlPlaneObjectPort,
    })
  return createCanonicalSam31L4RuntimeComponentQualificationOwner({
    readPort: {
      rereadThirtyRunQualification({ qualificationSetId }) {
        return setRepository.reread({ qualificationSetId })
      },
      rereadRunReceipt(request) {
        return runRepository.reread(request)
      },
      rereadAttemptCostReceipt(request) {
        return costRepository.reread(request)
      },
      rereadTask({ invocationId }) {
        return taskStore.rereadTask(invocationId)
      },
      rereadRuntimeResponse({ invocationId }) {
        return taskStore.rereadRuntimeResponse(invocationId)
      },
      rereadPrivateOutput({ invocationId, evidenceRef }) {
        return resultStore.rereadPrivateOutputRereadEvidence(
          invocationId,
          evidenceRef,
        )
      },
      rereadSourceCheckpointRelease({ sourceCheckpointQualificationRef }) {
        return releasePort.rereadQualificationRelease({
          sourceCheckpointQualificationRef,
        })
      },
      rereadCrossAcceleratorComparison({ comparisonRef }) {
        return comparisonRepository.reread({ comparisonRef })
      },
      async rereadLaunch({ launchRef }) {
        const body = await input.controlPlaneObjectPort.readExact(
          `${L4_LAUNCH_PREFIX}/${launchRef.contentHash.slice(7)}.json`,
        )
        if (!body) return null
        const launch = assertCanonicalProfessionalGpuJobLaunch(
          JSON.parse(body.toString('utf8')) as unknown,
        )
        if (!sameRef(launchRef, ref(launch.launchRecordId, launch.launchHash))
          || stableAuthorityStringify(launch) !== body.toString('utf8')) {
          throw conflict('l4_launch_exact_reread_changed')
        }
        return launch
      },
    },
    componentRepository:
      createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
        objectPort: input.controlPlaneObjectPort,
      }),
  })
}

export function createCanonicalSam31GcpL4RuntimeComponentQualificationOwner(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31L4RuntimeComponentQualificationOwner {
  const storage = input.storage ?? new Storage({ projectId: 'reeditpro' })
  return createCanonicalSam31L4RuntimeComponentQualificationOwnerFromObjectPorts({
    controlPlaneObjectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: 'reeditpro-production-reeditpro-control-plane-state',
    }),
    privateGpuObjectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: 'reeditpro-production-reeditpro-masks',
    }),
  })
}

function compileRun(input: {
  set: CanonicalSam31L4RuntimeThirtyRunQualification
  setRun: CanonicalSam31L4RuntimeThirtyRunQualification['runs'][number]
  run: CanonicalSam31L4RuntimePrivateRunReceipt
  cost: CanonicalSam31L4QualificationAttemptCostReceipt
  invocationId: string
  task: CanonicalSam31GpuTaskRecord
  launch: CanonicalProfessionalGpuJobLaunch
  response: CanonicalSam31GpuRuntimeResponse
  output: CanonicalSam31PrivateOutputRereadEvidence
  comparison: CanonicalSam31CrossAcceleratorMaskComparison
  release: CanonicalSam31QualifiedSourceCheckpointRelease
}) {
  const { set, setRun, run, cost, invocationId, task, launch, response,
    output, comparison, release } = input
  const source = projectCanonicalSam31QualifiedSourceCheckpointRelease(release)
  const probe = source.compatibilityProbe
  const gpu = response.gpuEvidence
  const runReceiptRef = ref(
    `sam31-l4-run-receipt:${run.qualificationId}:`
      + String(run.runOrdinal).padStart(2, '0'),
    run.receiptHash,
  )
  const costRef = ref(cost.receiptId, cost.receiptHash)
  const launchRef = ref(launch.launchRecordId, launch.launchHash)
  const taskRef = ref(task.taskId, task.taskRecordHash)
  const outputRef = ref(
    `sam31-private-output-reread:${output.runtimeResponseObjectRef.id}`,
    output.evidenceHash,
  )
  const responseObjectRef = ref(
    `sam31-runtime-response:${invocationId}`,
    createHash('sha256')
      .update(canonicalSam31GpuWireStringify(response), 'utf8')
      .digest('hex'),
  )
  const specializedResponseRef = ref(
    `sam31-l4-runtime-response:${invocationId}`,
    sha256AuthorityValue(response),
  )
  const exact = run.qualificationId === set.qualificationId
    && run.runOrdinal === setRun.runOrdinal
    && sameRef(setRun.runReceiptRef, runReceiptRef)
    && sameRef(setRun.launchRef, run.launchRef)
    && sameRef(setRun.runtimeResponseRef, run.runtimeResponseRef)
    && sameRef(setRun.privateOutputRereadEvidenceRef,
      run.privateOutputRereadEvidenceRef)
    && sameRef(setRun.semanticManifestRef, run.semanticManifestRef)
    && sameRef(setRun.crossAcceleratorMaskComparisonRef,
      run.crossAcceleratorMaskComparisonRef)
    && setRun.semanticMaskSetDigestSha256 === run.semanticMaskSetDigestSha256
    && setRun.wallTimeMilliseconds === run.wallTimeMilliseconds
    && setRun.cudaEventInferenceMilliseconds ===
      run.cudaEventInferenceMilliseconds
    && cost.qualificationId === run.qualificationId
    && cost.runOrdinal === run.runOrdinal
    && sameRef(cost.runReceiptRef, runReceiptRef)
    && sameRef(cost.launchRef, run.launchRef)
    && sameRef(cost.currentAccountEffectiveRateAuthorityRef,
      run.currentL4FallbackRateAuthorityRef)
    && cost.exactCloudRunOperationExecutionAndWorkerOutputReread
    && cost.exactCurrentBillingAccountPriceReread
    && cost.accountEffectiveCostRecorded
    && cost.platformFundedQualification
    && cost.customerEligibleInfrastructureCostUsdNanos === 0
    && cost.customerEligibleToolCostCredits === 0
    && !cost.customerWalletOrLedgerMutated
    && cost.terminalWorkerStopped
    && cost.activeGpuInstancesAfterTerminal === 0
    && cost.scaleBackToZeroVerified
    && invocationId === task.invocationId
    && sameRef(run.taskRef, taskRef)
    && sameRef(run.launchRef, launchRef)
    && sameRef(run.executionEnvelopeRef, task.executionEnvelopeRef)
    && sameRef(run.admissionRef, task.dispatchAdmissionRef)
    && sameRef(run.admissionConsumptionRef, task.admissionConsumptionRef)
    && sameRef(run.runtimeResponseRef, specializedResponseRef)
    && task.runtimeRequest.operationId ===
      'tool.sam3_1.segment_and_track_subject.v1'
    && task.runtimeRequest.dispatch.routeRole === 'l4_heavy_fallback'
    && task.runtimeRequest.dispatch.gpuProfileId ===
      'quality_l4_user_triggered_heavy_fallback_job_v1'
    && task.runtimeRequest.dispatch.accelerator === 'nvidia_l4'
    && task.runtimeRequest.dispatch.userTriggeredAfterApproval
    && task.runtimeRequest.dispatch.scaleFromZeroRequired
    && task.runtimeRequest.dispatch.scaleBackToZeroAfterTerminalAttemptRequired
    && !task.runtimeRequest.dispatch.cpuOnlyInferenceAllowed
    && task.runtimeRequest.settings.predictorVersion === 'sam3.1'
    && task.runtimeRequest.settings.strictCheckpointLoadRequired
    && task.runtimeRequest.settings.sourceResolutionPreserved
    && task.runtimeRequest.settings.sourceFrameRangePreserved
    && !task.runtimeRequest.settings.quantizationAllowed
    && task.runtimeRequest.settings.videoDecodeBackend ===
      'torchcodec_0_10_cuda_nvdec'
    && task.runtimeRequest.settings.gpuAcceleratedDecode
    && !task.runtimeRequest.settings.cpuOpenCvOrPillowDecodeAllowed
    && !task.runtimeRequest.settings.offloadVideoToCpu
    && !task.runtimeRequest.settings.offloadStateToCpu
    && task.runtimeRequest.modelArtifacts.immutableImageDigest ===
      run.immutableImageDigest
    && sameRef(
      task.runtimeRequest.modelArtifacts
        .sourceCheckpointCompatibilityQualificationRef,
      release.sourceCheckpointQualificationRef,
    )
    && response.status === 'completed'
    && gpu !== null
    && gpu.requestedAccelerator === 'nvidia_l4'
    && gpu.observedNvidiaDriverVersion === run.observedDriverVersion
    && gpu.observedCudaRuntimeVersion === run.observedCudaRuntimeVersion
    && gpu.cudaAvailable
    && gpu.cudaKernelExecutionMeasured
    && gpu.nvdecHardwareDecodeMeasured
    && gpu.decodedFramesResidentOnCuda
    && gpu.bfloat16AutocastUsed
    && !gpu.cpuOnlyInferenceUsed
    && response.runtimeMeasurement?.wallTimeMilliseconds ===
      run.wallTimeMilliseconds
    && response.runtimeMeasurement?.cudaEventInferenceMilliseconds ===
      run.cudaEventInferenceMilliseconds
    && response.outputSummary?.propagatedFrameCount === run.propagatedFrameCount
    && response.outputSummary?.losslessMaskPngCount === run.losslessMaskPngCount
    && sameRef(outputRef, run.privateOutputRereadEvidenceRef)
    && sameRef(output.runtimeResponseObjectRef, responseObjectRef)
    && sameRef(output.taskRef, run.taskRef)
    && sameRef(output.manifestRef, run.semanticManifestRef)
    && output.runtimeResponseBindingSha256 === response.responseBindingSha256
    && output.propagatedFrameCount === run.propagatedFrameCount
    && output.maskFileCount === run.losslessMaskPngCount
    && output.exactResponseBytesReread
    && output.exactManifestBytesRereadAndParsed
    && output.everyMaskPngByteHashReread
    && output.everyMaskPngDecodedDimensionsMatchSource
    && output.completeApprovedFrameIntervalCoverageVerified
    && output.noUnexpectedFilesOrCrossInvocationArtifacts
    && !output.sourceCheckpointOrTaskBytesMutated
    && sameRef(run.crossAcceleratorMaskComparisonRef, ref(
      comparison.comparisonId,
      comparison.comparisonHash,
    ))
    && sameRef(comparison.a100ServingQualificationRef,
      run.qualifiedA100ServingQualificationRef)
    && sameRef(comparison.l4SemanticManifestRef, run.semanticManifestRef)
    && comparison.l4ImmutableImageDigest === run.immutableImageDigest
    && comparison.l4SemanticMaskSetDigestSha256 ===
      run.semanticMaskSetDigestSha256
    && comparison.crossAcceleratorProbeCompatibilityPassed
    && comparison.everyMaskPairByteRereadDecodedAndCompared
    && source.exactCanonicalReread
    && source.sourceCheckpointQualificationGranted
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
    && run.scaleFromZeroObserved
    && run.terminalWorkerStoppedAndScaleBackToZeroVerified
    && run.exactTaskResponseAndEveryOutputMaskReread
    && run.exactFrameObjectAndMaskDimensionsMatchA100ServingQualification
    && run.crossAcceleratorBoxGeometryCompatibilityPassed
    && run.crossAcceleratorPixelComparisonPassed
    && run.accountEffectiveRateRereadBeforeDispatch
    && !run.customerCreditsMutated
    && !run.qaApproved
    && !run.publicDeliveryAuthorized
    && !run.productionAuthorityGranted
    && launch.launchDisposition === 'job_created'
    && sameRef(launch.admissionRef, run.admissionRef)
    && sameRef(launch.admissionConsumptionRef,
      run.admissionConsumptionRef)
    && sameRef(launch.executionEnvelopeRef, run.executionEnvelopeRef)
    && launch.toolId === 'sam3_1'
    && launch.operationId === task.runtimeRequest.operationId
    && launch.routeId === 'l4_heavy_fallback'
    && launch.runtimeRegion === 'us-central1'
    && launch.executionTarget === 'google_cloud_run_l4_job'
    && launch.accelerator === 'nvidia_l4'
    && launch.immutableImageDigest === run.immutableImageDigest
    && launch.minimumIdleInstances === 0
    && !launch.cpuOnlySubstantiveExecutionAllowed
    && !launch.customerCreditsMutated
    && !launch.qaApproved
    && !launch.publicDeliveryAuthorized
    && !launch.productionAuthorityGranted
  if (!exact) throw conflict(`run_${run.runOrdinal}_lineage_mismatch`)
  return Object.freeze({
    run,
    cost,
    launch,
    response,
    runReceiptRef,
    payload: {
      runOrdinal: run.runOrdinal,
      qualificationAttemptRef: run.executionEnvelopeRef,
      resultAdmissionRef: runReceiptRef,
      runtimeRequestRef: task.runtimeRequestRef,
      runtimeResponseObjectRef: output.runtimeResponseObjectRef,
      privateOutputRereadEvidenceRef: run.privateOutputRereadEvidenceRef,
      attemptCostReceiptRef: costRef,
      immutableImageDigest: run.immutableImageDigest,
      routeId: 'l4_heavy_fallback' as const,
      accelerator: 'nvidia_l4' as const,
      deterministicProbeFixtureRef:
        task.runtimeRequest.sourceMedia.gpuPreparedMaskProxyArtifactRef,
      outputMaskSetDigestSha256: run.semanticMaskSetDigestSha256,
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
    },
  })
}

function latestRecordedAt(values: readonly string[]): string {
  const parsed = values.map((value) => ({
    value: z.string().datetime({ offset: true }).parse(value),
    milliseconds: Date.parse(value),
  }))
  if (parsed.length !== 30
    || parsed.some((entry) => !Number.isFinite(entry.milliseconds))) {
    throw conflict('terminal_cost_recorded_at_set_invalid')
  }
  return parsed.sort((left, right) =>
    right.milliseconds - left.milliseconds)[0]!.value
}

function assertSetIdentity(
  request: z.infer<typeof requestSchema>,
  set: CanonicalSam31L4RuntimeThirtyRunQualification,
): void {
  if (set.qualificationSetId !== request.qualificationSetId
    || set.qualificationId !== request.qualificationId
    || set.routeId !== 'l4_heavy_fallback'
    || set.accelerator !== 'nvidia_l4'
    || set.runs.length !== 30
    || set.deterministicOutputRunCount !== 30
    || set.measuredPerformanceRunCount !== 30
    || !set.allThirtyL4OutputsByteIdenticalToOneAnother
    || !set.everyRunCrossAcceleratorPixelComparisonPassed
    || !set.everyRunUsedDistinctLaunchResponseOutputAndManifestLineage
    || !set.everyRunStartedFromAndReturnedToScaleZero
    || !set.exactThirtyIndexedRunReceiptsReread
    || set.runtimeReleaseGranted
    || set.customerCreditsMutated
    || set.qaApproved
    || set.publicDeliveryAuthorized
    || set.productionAuthorityGranted) {
    throw conflict('thirty_run_qualification_identity_mismatch')
  }
}

function assertCompleteSet(
  compiled: ReadonlyArray<ReturnType<typeof compileRun>>,
): void {
  const first = compiled[0]
  const refs = compiled.flatMap((run) => [
    run.payload.qualificationAttemptRef,
    run.payload.resultAdmissionRef,
    run.payload.runtimeRequestRef,
    run.payload.runtimeResponseObjectRef,
    run.payload.privateOutputRereadEvidenceRef,
    run.payload.attemptCostReceiptRef,
  ])
  if (!first || compiled.length !== 30
    || !compiled.every((run, index) => run.payload.runOrdinal === index + 1)
    || new Set(refs.map(refKey)).size !== 180
    || !compiled.every((run) =>
      run.run.immutableImageDigest === first.run.immutableImageDigest
      && run.run.observedDriverVersion === first.run.observedDriverVersion
      && run.run.observedCudaRuntimeVersion === first.run.observedCudaRuntimeVersion
      && sameRef(run.payload.deterministicProbeFixtureRef,
        first.payload.deterministicProbeFixtureRef)
      && run.payload.outputMaskSetDigestSha256 ===
        first.payload.outputMaskSetDigestSha256)) {
    throw conflict('terminalized_thirty_run_set_not_exact')
  }
}

async function persistExact(
  repository: CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
  component: CanonicalSam31GpuRuntimeQualificationComponentEvidence,
): Promise<EvidenceRef> {
  const persisted = await repository.persistComponentEvidenceCreateOnly({
    componentEvidence: component,
  })
  const expected = canonicalSam31GpuRuntimeQualificationComponentRef(component)
  if (!sameRef(persisted, expected)) {
    throw conflict('component_persistence_reference_mismatch')
  }
  return persisted
}

function assertComparison(value: unknown) {
  return assertCanonicalSam31CrossAcceleratorMaskComparison(value)
}

function invocationIdFromTaskRef(value: EvidenceRef): string {
  const prefix = 'sam31-task:'
  if (!value.id.startsWith(prefix) || value.id.length <= prefix.length) {
    throw conflict('run_task_ref_invocation_missing')
  }
  return safeId.parse(value.id.slice(prefix.length))
}

function ref(id: string, hash: string): EvidenceRef {
  return refSchema.parse({ id, version: 1, contentHash: `sha256:${hash}` })
}

function sameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
): boolean {
  return refKey(left) === refKey(right)
}

function refKey(value: {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function assertReadPort(
  port: CanonicalSam31L4RuntimeComponentQualificationReadPort,
): void {
  const functions = [
    'rereadThirtyRunQualification',
    'rereadRunReceipt',
    'rereadAttemptCostReceipt',
    'rereadTask',
    'rereadLaunch',
    'rereadRuntimeResponse',
    'rereadPrivateOutput',
    'rereadSourceCheckpointRelease',
    'rereadCrossAcceleratorComparison',
  ] as const
  if (!port || functions.some((name) => typeof port[name] !== 'function')) {
    throw new Error('SAM 3.1 L4 component read port is unavailable.')
  }
}

function assertRepository(
  repository: CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
): void {
  if (!repository
    || typeof repository.persistComponentEvidenceCreateOnly !== 'function'
    || typeof repository.rereadComponentEvidence !== 'function') {
    throw new Error('SAM 3.1 component evidence repository is unavailable.')
  }
}

function conflict(reason: string): Error {
  return new Error(`SAM 3.1 L4 component qualification conflict: ${reason}.`)
}
