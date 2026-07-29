import type {
  LivingFrameCapabilityKey,
} from '../../src/types/living-frame'
import {
  CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_ESTIMATE_BASIS_VERSION,
  CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_ESTIMATE_POLICY_VERSION,
  type CanonicalLivingFrameControlledIllustrationCapabilityId,
  type CanonicalLivingFrameControlledIllustrationCostComponent,
  type CanonicalLivingFrameControlledIllustrationEstimateBasis,
} from '../../src/types/living-frame-controlled-illustration-estimate-basis'
import type {
  ReEditProCanonicalEditLevel,
} from '../../src/types/edit-level'
import { ApiError } from '../errors/api-error'
import {
  calculateEstimateRangeFromExpectedCost,
  calculateInfrastructureRuntimeCostMicros,
} from '../tool-cost-metering/cost-math'
import {
  COST_MICROS_PER_CENT,
} from '../tool-cost-metering/rate-card'
import {
  calculateLivingFrameCloudRunL4PublicListEstimate,
} from './living-frame-cloud-run-l4-rate-observation'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,255}$/u
const GPU_ATTEMPT_DURATION_MILLISECONDS = 90_000
const AURAFACE_COMPARISON_DURATION_MILLISECONDS = 250
const MAX_GENERATION_UNITS_PER_SCENE = 128
const GIB_PER_GENERATED_OUTPUT = 100 / 1_024
const OUTPUT_RETENTION_HOURS = 24
const TEMP_STORAGE_GIB = 2

const ATTEMPTS_BY_EDIT_LEVEL = Object.freeze({
  normal: 1,
  premium: 2,
  ultra_premium: 3,
} as const satisfies Readonly<
  Record<ReEditProCanonicalEditLevel, 1 | 2 | 3>
>)

export function compileCanonicalLivingFrameControlledIllustrationEstimateBasis(
  input: {
    readonly sceneId: string
    readonly productEditLevel:
      ReEditProCanonicalEditLevel
    readonly generatedAssetIntentIds: readonly string[]
    readonly capabilityKeys:
      readonly LivingFrameCapabilityKey[]
  },
): CanonicalLivingFrameControlledIllustrationEstimateBasis {
  assertInput(input)
  const generatedAssetIntentIds = uniqueSorted(
    input.generatedAssetIntentIds,
  )
  const attemptsPerGenerationUnit =
    ATTEMPTS_BY_EDIT_LEVEL[input.productEditLevel]
  const costComponents:
    CanonicalLivingFrameControlledIllustrationCostComponent[] =
      []

  if (generatedAssetIntentIds.length > 0) {
    const activeGpuCapabilityIds =
      resolveGpuCapabilityIds(input.capabilityKeys)
    const plannedGpuAttemptCount =
      generatedAssetIntentIds.length
      * attemptsPerGenerationUnit
    costComponents.push(compileCostComponent({
      componentId:
        'shared_controlled_illustration_gpu_host',
      label:
        'Living Frame controlled illustration generation',
      executionPlacement: 'google_cloud_run_gpu',
      cpuFallbackAllowed: false,
      activeCapabilityIds:
        activeGpuCapabilityIds,
      generatedAssetIntentIds,
      generationUnitCount:
        generatedAssetIntentIds.length,
      attemptOrComparisonCount:
        plannedGpuAttemptCount,
      perAttemptWallTimeMilliseconds:
        GPU_ATTEMPT_DURATION_MILLISECONDS,
      allocatedVcpuCount: 8,
      allocatedMemoryGib: 32,
      gpuCount: 1,
      tempStorageGibHours:
        TEMP_STORAGE_GIB
        * (
          plannedGpuAttemptCount
          * GPU_ATTEMPT_DURATION_MILLISECONDS
          / 3_600_000
        ),
      outputStorageGibHours:
        generatedAssetIntentIds.length
        * GIB_PER_GENERATED_OUTPUT
        * OUTPUT_RETENTION_HOURS,
    }))

    if (
      input.capabilityKeys.includes(
        'identity_conditioned_illustration',
      )
    ) {
      costComponents.push(compileCostComponent({
        componentId:
          'auraface_cpu_continuity_measurement',
        label:
          'Living Frame identity continuity measurement',
        executionPlacement: 'private_cpu_worker',
        cpuFallbackAllowed: true,
        activeCapabilityIds: [
          'auraface_identity_measurement',
        ],
        generatedAssetIntentIds,
        generationUnitCount:
          generatedAssetIntentIds.length,
        attemptOrComparisonCount:
          plannedGpuAttemptCount,
        perAttemptWallTimeMilliseconds:
          AURAFACE_COMPARISON_DURATION_MILLISECONDS,
        allocatedVcpuCount: 2,
        allocatedMemoryGib: 4,
        gpuCount: 0,
        tempStorageGibHours: 0,
        outputStorageGibHours: 0,
      }))
    }
  }

  return Object.freeze({
    schemaVersion:
      CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_ESTIMATE_BASIS_VERSION,
    estimatePolicyVersion:
      CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_ESTIMATE_POLICY_VERSION,
    sceneId: input.sceneId,
    productEditLevel: input.productEditLevel,
    attemptsPerGenerationUnit,
    generatedAssetIntentIds,
    generationUnitCount:
      generatedAssetIntentIds.length,
    costComponents: Object.freeze(costComponents),
    totalExpectedInternalCostMicros:
      sumSafe(costComponents.map(
        (component) =>
          component.costRange
            .expectedInternalCostMicros,
      )),
    totalHighInternalCostMicros:
      sumSafe(costComponents.map(
        (component) =>
          component.costRange
            .highInternalCostMicros,
      )),
    sharedGpuHostChargedOnce: true,
    auraFaceUsedOnlyForContinuityMeasurement: true,
    sixCapabilityIdsCreateSixToolCharges: false,
    serviceFeeIncluded: false,
    currentRateAuthority: false,
    actualAttemptCostAuthority: false,
    customerEstimateAuthority: false,
    approvalAuthority: false,
    reservationAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })
}

function compileCostComponent(input: {
  readonly componentId:
    CanonicalLivingFrameControlledIllustrationCostComponent[
      'componentId'
    ]
  readonly label: string
  readonly executionPlacement:
    CanonicalLivingFrameControlledIllustrationCostComponent[
      'executionPlacement'
    ]
  readonly cpuFallbackAllowed: boolean
  readonly activeCapabilityIds:
    readonly CanonicalLivingFrameControlledIllustrationCapabilityId[]
  readonly generatedAssetIntentIds: readonly string[]
  readonly generationUnitCount: number
  readonly attemptOrComparisonCount: number
  readonly perAttemptWallTimeMilliseconds: number
  readonly allocatedVcpuCount: number
  readonly allocatedMemoryGib: number
  readonly gpuCount: 0 | 1
  readonly tempStorageGibHours: number
  readonly outputStorageGibHours: number
}): CanonicalLivingFrameControlledIllustrationCostComponent {
  const calculation =
    compileInfrastructureCalculation(input)
  const range = calculateEstimateRangeFromExpectedCost({
    expectedInternalCostMicros:
      calculation.expectedInternalCostMicros,
    riskLevel: 'high',
    sourceKind: 'infrastructure_runtime',
    computeLevel: 'standard',
  })
  if (!range.ok || range.data.serviceFeeIncluded) {
    throw invalid(
      'Living Frame could not calculate the controlled-illustration estimate range.',
    )
  }
  return Object.freeze({
    componentId: input.componentId,
    label: input.label,
    sourceKind: 'infrastructure_runtime',
    executionPlacement: input.executionPlacement,
    cpuFallbackAllowed: input.cpuFallbackAllowed,
    activeCapabilityIds:
      Object.freeze([...input.activeCapabilityIds]),
    generatedAssetIntentIds:
      Object.freeze([...input.generatedAssetIntentIds]),
    generationUnitCount: input.generationUnitCount,
    attemptOrComparisonCount:
      input.attemptOrComparisonCount,
    billableMilliseconds:
      calculation.billableMilliseconds,
    allocatedVcpuCount: input.allocatedVcpuCount,
    allocatedMemoryGib: input.allocatedMemoryGib,
    gpuCount: input.gpuCount,
    tempStorageGibHours:
      input.tempStorageGibHours,
    outputStorageGibHours:
      input.outputStorageGibHours,
    networkEgressMib: 0,
    costRange: Object.freeze({
      lowInternalCostMicros:
        range.data.lowInternalCostCents
        * COST_MICROS_PER_CENT,
      expectedInternalCostMicros:
        calculation.expectedInternalCostMicros,
      highInternalCostMicros:
        range.data.highInternalCostCents
        * COST_MICROS_PER_CENT,
      riskLevel: 'high',
      rateCardVersion: calculation.rateCardVersion,
      serviceFeeIncluded: false,
    }),
    capabilityIdsAreAttributionNotIndependentCharges: true,
    exactFiftyToolRegistryMember: false,
    operationContractObserved: false,
    actualAttemptCostEvidenceRequired: true,
    productionRateAuthority: false,
    estimateOnly: true,
  })
}

function compileInfrastructureCalculation(input: {
  readonly componentId:
    CanonicalLivingFrameControlledIllustrationCostComponent[
      'componentId'
    ]
  readonly attemptOrComparisonCount: number
  readonly perAttemptWallTimeMilliseconds: number
  readonly allocatedVcpuCount: number
  readonly allocatedMemoryGib: number
  readonly gpuCount: 0 | 1
  readonly tempStorageGibHours: number
  readonly outputStorageGibHours: number
  readonly generationUnitCount: number
}): {
  readonly expectedInternalCostMicros: number
  readonly billableMilliseconds: number
  readonly rateCardVersion: string
} {
  if (
    input.componentId
    === 'shared_controlled_illustration_gpu_host'
  ) {
    if (input.gpuCount !== 1) {
      throw invalid(
        'Living Frame controlled illustration requires one L4 GPU per shared host attempt.',
      )
    }
    const calculation =
      calculateLivingFrameCloudRunL4PublicListEstimate({
        attemptCount: input.attemptOrComparisonCount,
        perAttemptWallTimeMilliseconds:
          input.perAttemptWallTimeMilliseconds,
        vcpuCount: input.allocatedVcpuCount,
        memoryGib: input.allocatedMemoryGib,
        gpuCount: 1,
        tempStorageGib: TEMP_STORAGE_GIB,
        outputArtifactCount: input.generationUnitCount,
        outputMibPerArtifact:
          GIB_PER_GENERATED_OUTPUT * 1_024,
        outputRetentionHours: OUTPUT_RETENTION_HOURS,
      })
    return {
      expectedInternalCostMicros:
        calculation.expectedInternalCostMicros,
      billableMilliseconds:
        calculation.totalBillableMilliseconds,
      rateCardVersion: calculation.rateBasisVersion,
    }
  }

  const calculation =
    calculateInfrastructureRuntimeCostMicros({
      wallTimeMilliseconds:
        input.attemptOrComparisonCount
        * input.perAttemptWallTimeMilliseconds,
      vcpuCount: input.allocatedVcpuCount,
      memoryGib: input.allocatedMemoryGib,
      gpuCount: input.gpuCount,
      tempStorageGibHours:
        input.tempStorageGibHours,
      outputStorageGibHours:
        input.outputStorageGibHours,
      networkEgressMib: 0,
      computeLevel: 'standard',
    })
  if (!calculation.ok) {
    throw invalid(
      'Living Frame could not calculate the controlled-illustration infrastructure estimate.',
    )
  }
  return {
    expectedInternalCostMicros:
      calculation.data.actualInternalCostMicros,
    billableMilliseconds:
      calculation.data.billableMilliseconds
      ?? (
        input.attemptOrComparisonCount
        * input.perAttemptWallTimeMilliseconds
      ),
    rateCardVersion: calculation.data.rateCardVersion,
  }
}

function resolveGpuCapabilityIds(
  capabilityKeys: readonly LivingFrameCapabilityKey[],
): CanonicalLivingFrameControlledIllustrationCapabilityId[] {
  const capabilityIds:
    CanonicalLivingFrameControlledIllustrationCapabilityId[] =
      ['comfyui_execution_host']
  if (
    capabilityKeys.includes(
      'structure_conditioned_illustration',
    )
  ) {
    capabilityIds.push(
      'comfyui_controlnet_aux_preprocessing',
      'controlnet_conditioning',
    )
  }
  if (
    capabilityKeys.includes(
      'reference_conditioned_illustration',
    )
  ) {
    capabilityIds.push(
      'ipadapter_reference_conditioning',
    )
  }
  if (
    capabilityKeys.includes(
      'low_rank_adapter_training_or_loading',
    )
  ) {
    capabilityIds.push(
      'peft_lora_adapter_loading',
    )
  }
  return capabilityIds
}

function assertInput(input: {
  readonly sceneId: string
  readonly productEditLevel:
    ReEditProCanonicalEditLevel
  readonly generatedAssetIntentIds: readonly string[]
  readonly capabilityKeys:
    readonly LivingFrameCapabilityKey[]
}): void {
  if (
    !SAFE_ID.test(input.sceneId)
    || !Object.hasOwn(
      ATTEMPTS_BY_EDIT_LEVEL,
      input.productEditLevel,
    )
    || input.generatedAssetIntentIds.length
      > MAX_GENERATION_UNITS_PER_SCENE
    || input.generatedAssetIntentIds.some(
      (assetIntentId) => !SAFE_ID.test(assetIntentId),
    )
    || new Set(input.generatedAssetIntentIds).size
      !== input.generatedAssetIntentIds.length
  ) {
    throw invalid(
      'Living Frame controlled-illustration estimate input is invalid.',
    )
  }
}

function uniqueSorted(
  values: readonly string[],
): readonly string[] {
  return Object.freeze(
    [...new Set(values)].sort((left, right) =>
      left.localeCompare(right)),
  )
}

function sumSafe(values: readonly number[]): number {
  const total = values.reduce(
    (sum, value) => sum + value,
    0,
  )
  if (!Number.isSafeInteger(total) || total < 0) {
    throw invalid(
      'Living Frame controlled-illustration estimate exceeds safe integer bounds.',
    )
  }
  return total
}

function invalid(message: string): ApiError {
  return new ApiError(
    'CREDIT_ESTIMATE_NOT_APPROVED',
    message,
    409,
  )
}
