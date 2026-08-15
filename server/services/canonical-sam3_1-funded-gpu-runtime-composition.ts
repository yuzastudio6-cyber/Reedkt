import {
  createCanonicalSam31GpuApprovedTaskMaterialPreparationOwner,
  createCanonicalSam31GpuTaskContextOwner,
  type CanonicalSam31GpuApprovedTaskMaterialSourceReadPort,
  type CanonicalSam31GpuReleasePairReadPort,
  type CanonicalSam31GpuTaskContextRepository,
  type CanonicalSam31GpuTaskRateAuthorityReadPort,
} from './canonical-sam3_1-gpu-task-context-owner'
import type {
  CanonicalProfessionalGpuCloudJobLaunchPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  startCanonicalProfessionalGpuPlanFundedJob,
} from './canonical-professional-gpu-plan-funded-job-lifecycle-service'
import {
  startCanonicalProfessionalGpuPlanFundedPrivateInternalJob,
} from './canonical-professional-gpu-private-internal-funded-job-lifecycle-service'
import {
  canonicalSam31GpuFixedTaskContractRef,
  createCanonicalSam31PreparingCloudJobLaunchPort,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import type {
  CanonicalSam31GpuPrivateInputStagingPort,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'

export const CANONICAL_SAM3_1_FUNDED_GPU_RUNTIME_COMPOSITION_VERSION =
  'canonical-sam3_1-funded-gpu-runtime-composition-v1' as const

export interface CanonicalSam31FundedGpuRuntimeComposition {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_FUNDED_GPU_RUNTIME_COMPOSITION_VERSION
  readonly toolId: 'sam3_1'
  readonly operationId: typeof CANONICAL_SAM3_1_OPERATION_ID
  readonly fixedServerTaskContractRef: ReturnType<
    typeof canonicalSam31GpuFixedTaskContractRef
  >
  readonly approvedTaskMaterialOwnerIsCanonicalServer: true
  readonly taskContextOwnerIsCanonicalServer: true
  readonly privateInputStagingRequiredBeforeTaskPersistence: true
  readonly fixedTaskPersistenceRequiredBeforeCloudJobCreation: true
  readonly rawCloudLaunchPortExposed: false
  readonly launchPort: CanonicalProfessionalGpuCloudJobLaunchPort
}

const canonicalCompositions = new WeakSet<
  CanonicalSam31FundedGpuRuntimeComposition
>()

export function createCanonicalSam31FundedGpuRuntimeComposition(input: {
  readonly taskContextRepository: CanonicalSam31GpuTaskContextRepository
  readonly approvedTaskMaterialSourceReadPort:
    CanonicalSam31GpuApprovedTaskMaterialSourceReadPort
  readonly releasePairReadPort: CanonicalSam31GpuReleasePairReadPort
  readonly rateAuthorityReadPort:
    CanonicalSam31GpuTaskRateAuthorityReadPort
  readonly privateInputStagingPort:
    CanonicalSam31GpuPrivateInputStagingPort
  readonly taskStore: CanonicalSam31GpuTaskStore
  readonly rawCloudLaunchPort: CanonicalProfessionalGpuCloudJobLaunchPort
  readonly now?: () => string
}): CanonicalSam31FundedGpuRuntimeComposition {
  if (typeof input.rawCloudLaunchPort?.startOneShotJob !== 'function') {
    throw new Error('SAM 3.1 raw cloud launch delegate is unavailable.')
  }
  const taskMaterialPreparationPort =
    createCanonicalSam31GpuApprovedTaskMaterialPreparationOwner({
      repository: input.taskContextRepository,
      sourceReadPort: input.approvedTaskMaterialSourceReadPort,
      now: input.now,
    })
  const taskContextReadPort = createCanonicalSam31GpuTaskContextOwner({
    repository: input.taskContextRepository,
    releasePairReadPort: input.releasePairReadPort,
    rateAuthorityReadPort: input.rateAuthorityReadPort,
    now: input.now,
  })
  const launchPort = createCanonicalSam31PreparingCloudJobLaunchPort({
    taskMaterialPreparationPort,
    taskContextReadPort,
    privateInputStagingPort: input.privateInputStagingPort,
    taskStore: input.taskStore,
    delegate: input.rawCloudLaunchPort,
    now: input.now,
  })
  const composition: CanonicalSam31FundedGpuRuntimeComposition = Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_FUNDED_GPU_RUNTIME_COMPOSITION_VERSION,
    toolId: 'sam3_1',
    operationId: CANONICAL_SAM3_1_OPERATION_ID,
    fixedServerTaskContractRef: canonicalSam31GpuFixedTaskContractRef(),
    approvedTaskMaterialOwnerIsCanonicalServer: true,
    taskContextOwnerIsCanonicalServer: true,
    privateInputStagingRequiredBeforeTaskPersistence: true,
    fixedTaskPersistenceRequiredBeforeCloudJobCreation: true,
    rawCloudLaunchPortExposed: false,
    launchPort,
  })
  canonicalCompositions.add(composition)
  return composition
}

export function canonicalSam31FundedGpuLaunchPort(
  composition: CanonicalSam31FundedGpuRuntimeComposition,
): CanonicalProfessionalGpuCloudJobLaunchPort {
  if (!canonicalCompositions.has(composition)
    || composition.toolId !== 'sam3_1'
    || composition.operationId !== CANONICAL_SAM3_1_OPERATION_ID
    || !composition.approvedTaskMaterialOwnerIsCanonicalServer
    || !composition.taskContextOwnerIsCanonicalServer
    || !composition.privateInputStagingRequiredBeforeTaskPersistence
    || !composition.fixedTaskPersistenceRequiredBeforeCloudJobCreation
    || composition.rawCloudLaunchPortExposed) {
    throw new Error('SAM 3.1 funded GPU runtime composition is invalid.')
  }
  return composition.launchPort
}

type FundedJobStartInput = Parameters<
  typeof startCanonicalProfessionalGpuPlanFundedJob
>[0]

export function startCanonicalSam31PlanFundedGpuJob(
  input: Omit<FundedJobStartInput, 'launchPort'> & {
    readonly runtimeComposition: CanonicalSam31FundedGpuRuntimeComposition
  },
): ReturnType<typeof startCanonicalProfessionalGpuPlanFundedJob> {
  const { runtimeComposition, ...fundedInput } = input
  return startCanonicalProfessionalGpuPlanFundedJob({
    ...fundedInput,
    launchPort: canonicalSam31FundedGpuLaunchPort(runtimeComposition),
  })
}

type PrivateInternalFundedJobStartInput = Parameters<
  typeof startCanonicalProfessionalGpuPlanFundedPrivateInternalJob
>[0]

export function startCanonicalSam31PlanFundedPrivateInternalGpuJob(
  input: Omit<PrivateInternalFundedJobStartInput, 'launchPort'> & {
    readonly runtimeComposition: CanonicalSam31FundedGpuRuntimeComposition
  },
): ReturnType<
  typeof startCanonicalProfessionalGpuPlanFundedPrivateInternalJob
> {
  const { runtimeComposition, ...fundedInput } = input
  return startCanonicalProfessionalGpuPlanFundedPrivateInternalJob({
    ...fundedInput,
    launchPort: canonicalSam31FundedGpuLaunchPort(runtimeComposition),
  })
}
