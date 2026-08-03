import type {
  ReEditProCanonicalEditLevel,
} from './edit-level'

export const CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_ESTIMATE_BASIS_VERSION =
  'canonical-living-frame-controlled-illustration-estimate-basis-v2' as const

export const CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_ESTIMATE_POLICY_VERSION =
  'living-frame-controlled-illustration-gpu-only-shared-host-estimate-policy-v2' as const

export const CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_IDS = [
  'comfyui_execution_host',
  'comfyui_controlnet_aux_preprocessing',
  'controlnet_conditioning',
  'ipadapter_reference_conditioning',
  'peft_lora_adapter_loading',
  'auraface_identity_measurement',
] as const

export type CanonicalLivingFrameControlledIllustrationCapabilityId =
  (typeof CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_IDS)[number]

export type CanonicalLivingFrameControlledIllustrationCostComponentId =
  | 'shared_controlled_illustration_gpu_host'
  | 'auraface_l4_gpu_continuity_measurement'

export interface CanonicalLivingFrameControlledIllustrationCostRange {
  readonly lowInternalCostMicros: number
  readonly expectedInternalCostMicros: number
  readonly highInternalCostMicros: number
  readonly riskLevel: 'high'
  readonly rateCardVersion: string
  readonly serviceFeeIncluded: false
}

export interface CanonicalLivingFrameControlledIllustrationCostComponent {
  readonly componentId:
    CanonicalLivingFrameControlledIllustrationCostComponentId
  readonly label: string
  readonly sourceKind: 'infrastructure_runtime'
  readonly executionPlacement: 'google_cloud_run_gpu'
  readonly cpuFallbackAllowed: false
  readonly activeCapabilityIds:
    readonly CanonicalLivingFrameControlledIllustrationCapabilityId[]
  readonly generatedAssetIntentIds: readonly string[]
  readonly generationUnitCount: number
  readonly attemptOrComparisonCount: number
  readonly billableMilliseconds: number
  readonly allocatedVcpuCount: number
  readonly allocatedMemoryGib: number
  readonly gpuCount: 1
  readonly tempStorageGibHours: number
  readonly outputStorageGibHours: number
  readonly networkEgressMib: 0
  readonly costRange:
    CanonicalLivingFrameControlledIllustrationCostRange
  readonly capabilityIdsAreAttributionNotIndependentCharges: true
  readonly exactFiftyToolRegistryMember: false
  readonly operationContractObserved: false
  readonly actualAttemptCostEvidenceRequired: true
  readonly productionRateAuthority: false
  readonly estimateOnly: true
}

export interface CanonicalLivingFrameControlledIllustrationEstimateBasis {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_ESTIMATE_BASIS_VERSION
  readonly estimatePolicyVersion:
    typeof CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_ESTIMATE_POLICY_VERSION
  readonly sceneId: string
  readonly productEditLevel:
    ReEditProCanonicalEditLevel
  readonly attemptsPerGenerationUnit: 1 | 2 | 3
  readonly generatedAssetIntentIds: readonly string[]
  readonly generationUnitCount: number
  readonly costComponents:
    readonly CanonicalLivingFrameControlledIllustrationCostComponent[]
  readonly totalExpectedInternalCostMicros: number
  readonly totalHighInternalCostMicros: number
  readonly sharedGpuHostChargedOnce: true
  readonly auraFaceUsedOnlyForContinuityMeasurement: true
  readonly sixCapabilityIdsCreateSixToolCharges: false
  readonly serviceFeeIncluded: false
  readonly currentRateAuthority: false
  readonly actualAttemptCostAuthority: false
  readonly customerEstimateAuthority: false
  readonly approvalAuthority: false
  readonly reservationAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}
