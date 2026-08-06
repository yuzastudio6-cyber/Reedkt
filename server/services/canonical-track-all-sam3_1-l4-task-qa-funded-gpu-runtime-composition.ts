import type {
  CanonicalProfessionalGpuCloudJobLaunchPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  startCanonicalProfessionalGpuPlanFundedJob,
} from './canonical-professional-gpu-plan-funded-job-lifecycle-service'
import {
  canonicalTrackAllSam31L4TaskQaFixedTaskContractRef,
  CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'
import {
  createCanonicalTrackAllSam31L4TaskQaPreparingLaunchPort,
  type CanonicalTrackAllSam31L4TaskQaMaterialRepository,
  type CanonicalTrackAllSam31L4TaskQaTaskStore,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-owner-service'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_FUNDED_RUNTIME_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-funded-runtime-v1' as const

export interface CanonicalTrackAllSam31L4TaskQaFundedRuntimeComposition {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_FUNDED_RUNTIME_VERSION
  readonly toolId: 'kornia'
  readonly operationId:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID
  readonly fixedServerTaskContractRef: ReturnType<
    typeof canonicalTrackAllSam31L4TaskQaFixedTaskContractRef
  >
  readonly materialOwnerIsCanonicalServer: true
  readonly fixedTaskPersistenceRequiredBeforeCloudJobCreation: true
  readonly separateSam31InputAndL4InvocationRootsRequired: true
  readonly rawCloudLaunchPortExposed: false
  readonly launchPort: CanonicalProfessionalGpuCloudJobLaunchPort
}

const compositions = new WeakSet<
  CanonicalTrackAllSam31L4TaskQaFundedRuntimeComposition
>()

export function createCanonicalTrackAllSam31L4TaskQaFundedRuntimeComposition(
  input: {
    readonly materialRepository:
      CanonicalTrackAllSam31L4TaskQaMaterialRepository
    readonly taskStore: CanonicalTrackAllSam31L4TaskQaTaskStore
    readonly rawCloudLaunchPort: CanonicalProfessionalGpuCloudJobLaunchPort
    readonly now?: () => string
  },
): CanonicalTrackAllSam31L4TaskQaFundedRuntimeComposition {
  const launchPort =
    createCanonicalTrackAllSam31L4TaskQaPreparingLaunchPort({
      materialReadPort: {
        rereadCanonicalL4TaskQaMaterial({ admission }) {
          return input.materialRepository.rereadMaterial({
            executionAttemptRef: admission.scope.executionAttemptRef,
          })
        },
      },
      taskStore: input.taskStore,
      delegate: input.rawCloudLaunchPort,
      now: input.now,
    })
  const composition: CanonicalTrackAllSam31L4TaskQaFundedRuntimeComposition =
    Object.freeze({
      schemaVersion:
        CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_FUNDED_RUNTIME_VERSION,
      toolId: 'kornia',
      operationId: CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
      fixedServerTaskContractRef:
        canonicalTrackAllSam31L4TaskQaFixedTaskContractRef(),
      materialOwnerIsCanonicalServer: true,
      fixedTaskPersistenceRequiredBeforeCloudJobCreation: true,
      separateSam31InputAndL4InvocationRootsRequired: true,
      rawCloudLaunchPortExposed: false,
      launchPort,
    })
  compositions.add(composition)
  return composition
}

type FundedJobStartInput = Parameters<
  typeof startCanonicalProfessionalGpuPlanFundedJob
>[0]

export function startCanonicalTrackAllSam31L4TaskQaPlanFundedGpuJob(
  input: Omit<FundedJobStartInput, 'launchPort'> & {
    readonly runtimeComposition:
      CanonicalTrackAllSam31L4TaskQaFundedRuntimeComposition
  },
): ReturnType<typeof startCanonicalProfessionalGpuPlanFundedJob> {
  const { runtimeComposition, ...fundedInput } = input
  if (!compositions.has(runtimeComposition)
    || runtimeComposition.toolId !== 'kornia'
    || runtimeComposition.operationId !==
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID
    || !runtimeComposition.materialOwnerIsCanonicalServer
    || !runtimeComposition.fixedTaskPersistenceRequiredBeforeCloudJobCreation
    || !runtimeComposition.separateSam31InputAndL4InvocationRootsRequired
    || runtimeComposition.rawCloudLaunchPortExposed) {
    throw new Error('Track All L4 task-QA funded runtime is invalid.')
  }
  return startCanonicalProfessionalGpuPlanFundedJob({
    ...fundedInput,
    launchPort: runtimeComposition.launchPort,
  })
}
