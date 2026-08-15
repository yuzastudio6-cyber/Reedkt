import { z } from 'zod'

import {
  canonicalApprovedWorkGraphResourcePlacementAuthoritySchema,
  type CanonicalApprovedWorkGraphResourcePlacementAuthority,
  type CanonicalFrozenWorkItemResourcePlacement,
} from './canonical-private-resource-placement-authority'
import {
  CANONICAL_QUALITY_FIRST_PROFESSIONAL_TOOL_GPU_PLACEMENT_VERSION,
  assertCanonicalQualityFirstProfessionalToolGpuPlacement,
  createCanonicalQualityFirstProfessionalToolGpuPlacement,
  type CanonicalQualityFirstProfessionalToolGpuPlacementEntry,
} from './canonical-quality-first-professional-tool-gpu-placement'
import {
  CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS,
  CANONICAL_QUALITY_FIRST_USER_TRIGGERED_GPU_POLICY_VERSION,
  assertCanonicalQualityFirstUserTriggeredGpuPolicy,
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from './canonical-quality-first-user-triggered-gpu-policy'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_QUALITY_FIRST_APPROVED_WORK_GRAPH_GPU_PLACEMENT_AUTHORITY_VERSION =
  'canonical-quality-first-approved-work-graph-gpu-placement-authority-v1' as const
export const CANONICAL_QUALITY_FIRST_GPU_PLACEMENT_COMPONENT_KEY =
  'canonicalQualityFirstGpuResourcePlacementAuthority' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)

const targetClassSchema = z.enum([
  'lightweight_control_plane_non_gpu',
  'external_provider_owned',
  'a100_80gb_heavy_primary_l4_fallback',
  'l4_standard_gpu_primary',
  'l4_colocated_gpu_helper',
])
const classificationSchema = z.enum([
  'provider_execution_mode',
  'professional_tool_gpu_policy',
  'sam3_1_exact_pending_operation',
  'exact_tool_free_heavy_work_type',
  'lightweight_worker_class',
  'default_tool_free_substantive_l4',
])

const placementWithoutHashSchema = z.object({
  workItemKey: safeId,
  workItemType: safeId,
  canonicalWorkerClass: safeId,
  sourcePlacementHash: sha256,
  workItemExecutionInputHash: sha256,
  approvedToolIds: z.array(safeId).max(1),
  approvedToolOperationIds: z.array(safeId).max(1),
  providerExecutionMode: z.enum([
    'none',
    'primary',
    'fallback',
    'final_fallback',
  ]),
  classification: classificationSchema,
  targetClass: targetClassSchema,
  primaryProfileId: z.enum([
    CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0],
    CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[2],
  ]).nullable(),
  fallbackProfileId: z.literal(
    CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1],
  ).nullable(),
  primaryRouteId: z.enum([
    'a100_80gb_heavy_primary',
    'l4_standard_primary',
  ]).nullable(),
  fallbackRouteId: z.literal('l4_heavy_fallback').nullable(),
  primaryAccelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4'])
    .nullable(),
  fallbackAccelerator: z.literal('nvidia_l4').nullable(),
  gpuExecutionOwnerToolId: safeId.nullable(),
  toolPlacementEntryHash: sha256.nullable(),
  costProfileId: safeId.nullable(),
  explicitApprovedUserWorkTriggerRequired: z.literal(true),
  fundedReservationRequiredBeforeGpuOrProviderStart: z.boolean(),
  minimumIdleGpuInstances: z.literal(0),
  scaleToZeroAfterTerminalAttemptRequired: z.boolean(),
  currentBillingAccountEffectiveRateAuthorityRequired: z.boolean(),
  exactAttemptUsageAndCostEvidenceRequired: z.boolean(),
  classifiedFallbackRequiresKnownSafePrimaryFailure: z.boolean(),
  qualityReducingFallbackAllowed: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  gpuHostCpuOnlyExecutionMaySatisfyGpuWork: z.literal(false),
  controlPlaneCpuMayExecuteMediaOrModels: z.literal(false),
  gpuAdjacentCpuHelpersLimitedToIoMetadataAndOrchestration: z.boolean(),
  immutableRuntimeReleaseRequiredBeforeDispatch: z.boolean(),
  placementEligibleForRuntimeAdmission: z.boolean(),
  runtimeAdmissionGranted: z.literal(false),
  requiredGates: z.array(safeId).min(1).max(20),
}).strict().superRefine((placement, context) => {
  const heavy = placement.targetClass ===
    'a100_80gb_heavy_primary_l4_fallback'
  const standard = placement.targetClass === 'l4_standard_gpu_primary'
  const helper = placement.targetClass === 'l4_colocated_gpu_helper'
  const control = placement.targetClass ===
    'lightweight_control_plane_non_gpu'
  const external = placement.targetClass === 'external_provider_owned'
  const gpu = heavy || standard || helper

  const exactHeavy = heavy
    && placement.primaryProfileId ===
      CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0]
    && placement.fallbackProfileId ===
      CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1]
    && placement.primaryRouteId === 'a100_80gb_heavy_primary'
    && placement.fallbackRouteId === 'l4_heavy_fallback'
    && placement.primaryAccelerator === 'nvidia_a100_80gb'
    && placement.fallbackAccelerator === 'nvidia_l4'
    && placement.classifiedFallbackRequiresKnownSafePrimaryFailure
  const exactL4 = (standard || helper)
    && placement.primaryProfileId ===
      CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[2]
    && placement.fallbackProfileId === null
    && placement.primaryRouteId === 'l4_standard_primary'
    && placement.fallbackRouteId === null
    && placement.primaryAccelerator === 'nvidia_l4'
    && placement.fallbackAccelerator === null
    && !placement.classifiedFallbackRequiresKnownSafePrimaryFailure
  const exactNonGpu = (control || external)
    && placement.primaryProfileId === null
    && placement.fallbackProfileId === null
    && placement.primaryRouteId === null
    && placement.fallbackRouteId === null
    && placement.primaryAccelerator === null
    && placement.fallbackAccelerator === null
    && placement.gpuExecutionOwnerToolId === null
    && placement.costProfileId === null
    && placement.toolPlacementEntryHash === null
    && !placement.currentBillingAccountEffectiveRateAuthorityRequired
    && !placement.exactAttemptUsageAndCostEvidenceRequired
    && !placement.classifiedFallbackRequiresKnownSafePrimaryFailure
    && !placement.gpuAdjacentCpuHelpersLimitedToIoMetadataAndOrchestration
    && !placement.immutableRuntimeReleaseRequiredBeforeDispatch
  const exactAdmission = gpu
    ? placement.fundedReservationRequiredBeforeGpuOrProviderStart
      && placement.currentBillingAccountEffectiveRateAuthorityRequired
      && placement.exactAttemptUsageAndCostEvidenceRequired
      && placement.scaleToZeroAfterTerminalAttemptRequired
      && placement.immutableRuntimeReleaseRequiredBeforeDispatch
      && placement.placementEligibleForRuntimeAdmission
    : external
      ? placement.fundedReservationRequiredBeforeGpuOrProviderStart
        && !placement.scaleToZeroAfterTerminalAttemptRequired
        && placement.placementEligibleForRuntimeAdmission
      : !placement.fundedReservationRequiredBeforeGpuOrProviderStart
        && !placement.scaleToZeroAfterTerminalAttemptRequired
        && placement.placementEligibleForRuntimeAdmission

  if (
    (!exactHeavy && !exactL4 && !exactNonGpu)
    || !exactAdmission
    || (helper !== placement
      .gpuAdjacentCpuHelpersLimitedToIoMetadataAndOrchestration)
    || (placement.providerExecutionMode !== 'none') !== external
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Fresh-plan GPU placement lost its exact execution boundary.',
    })
  }
})

const placementSchema = placementWithoutHashSchema.extend({
  placementHash: sha256,
}).strict()

const authorityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_QUALITY_FIRST_APPROVED_WORK_GRAPH_GPU_PLACEMENT_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'canonical_server_fresh_plan_quality_first_gpu_placement_compiler',
  ),
  sourcePlacementAuthority: z.object({
    schemaVersion: z.literal(
      'canonical-approved-work-graph-resource-placement-authority-v1',
    ),
    authorityHash: sha256,
    workItemAuthorityHash: sha256,
    toolIdentityAuthorityHash: sha256,
    placementCount: z.number().int().positive().max(256),
    immutableHistoricalReaderRetained: z.literal(true),
    mayAuthorizeFreshPlanExecution: z.literal(false),
  }).strict(),
  qualityFirstGpuPolicy: z.object({
    schemaVersion: z.literal(
      CANONICAL_QUALITY_FIRST_USER_TRIGGERED_GPU_POLICY_VERSION,
    ),
    policyHash: sha256,
  }).strict(),
  professionalToolPlacementPolicy: z.object({
    schemaVersion: z.literal(
      CANONICAL_QUALITY_FIRST_PROFESSIONAL_TOOL_GPU_PLACEMENT_VERSION,
    ),
    policyHash: sha256,
  }).strict(),
  workGraphExecutionInputDigestSha256: sha256,
  placements: z.array(placementSchema).min(1).max(256),
  summary: z.object({
    totalWorkItemCount: z.number().int().positive().max(256),
    lightweightControlPlaneCount: z.number().int().nonnegative().max(256),
    externalProviderCount: z.number().int().nonnegative().max(256),
    a100PrimaryL4FallbackCount: z.number().int().nonnegative().max(256),
    l4StandardPrimaryCount: z.number().int().nonnegative().max(256),
    l4ColocatedHelperCount: z.number().int().nonnegative().max(256),
    cpuOnlySubstantiveWorkItemCount: z.literal(0),
    everyWorkItemCoveredExactlyOnce: z.literal(true),
    allSubstantiveWorkRequiresGpu: z.literal(true),
    callerSelectedPlacement: z.literal(false),
  }).strict(),
  lifecycle: z.object({
    explicitApprovedUserTriggerRequired: z.literal(true),
    noApprovedWorkMeansZeroGpuInstances: z.literal(true),
    minimumIdleA100Instances: z.literal(0),
    minimumIdleL4Instances: z.literal(0),
    coldStartExpectedAndMetered: z.literal(true),
    terminalAttemptMustScaleToZero: z.literal(true),
    speculativeStartupPrewarmingOrKeepaliveAllowed: z.literal(false),
  }).strict(),
  pricing: z.object({
    exactBillingAccountEffectiveRatesRequiredBeforeApproval: z.literal(true),
    exactOperationOrModelCostProfileRequired: z.literal(true),
    coldStartModelLoadAndActiveRuntimeIncluded: z.literal(true),
    exactTerminalUsageRequiredForSettlement: z.literal(true),
    customerCreditsMayBeSettledOnlyFromApprovedPlanAuthority: z.literal(true),
    unapprovedOverageChargedToCustomer: z.literal(false),
    weeditproSystemFailureChargedToCustomer: z.literal(false),
  }).strict(),
  boundaries: z.object({
    freshPlanPlacementAuthority: z.literal(true),
    legacyCpuPlacementMayAuthorizeFreshPlan: z.literal(false),
    approvedSnapshotMutationAllowed: z.literal(false),
    controlPlaneCpuMayAuthenticateValidateHashQueueAndPersist: z.literal(true),
    controlPlaneCpuMayExecuteMediaOrModels: z.literal(false),
    cpuOnlyMediaModelRenderOrQaExecutionAllowed: z.literal(false),
    classifiedHeavyFallbackMayReduceQuality: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    cloudDispatchAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((authority, context) => {
  const placements = authority.placements
  const count = (targetClass: z.infer<typeof targetClassSchema>) =>
    placements.filter((placement) =>
      placement.targetClass === targetClass).length
  const ordered = placements.every((placement, index) => index === 0
    || utf16Compare(placements[index - 1]!.workItemKey,
      placement.workItemKey) < 0)
  const exactHashes = placements.every((placement) => {
    const payload = { ...placement }
    Reflect.deleteProperty(payload, 'placementHash')
    return placement.placementHash === sha256AuthorityValue(payload)
  })
  if (
    !ordered
    || !exactHashes
    || new Set(placements.map((placement) => placement.workItemKey)).size !==
      placements.length
    || authority.sourcePlacementAuthority.placementCount !== placements.length
    || authority.summary.totalWorkItemCount !== placements.length
    || authority.summary.lightweightControlPlaneCount !==
      count('lightweight_control_plane_non_gpu')
    || authority.summary.externalProviderCount !==
      count('external_provider_owned')
    || authority.summary.a100PrimaryL4FallbackCount !==
      count('a100_80gb_heavy_primary_l4_fallback')
    || authority.summary.l4StandardPrimaryCount !==
      count('l4_standard_gpu_primary')
    || authority.summary.l4ColocatedHelperCount !==
      count('l4_colocated_gpu_helper')
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Fresh-plan GPU placement authority lost exact graph coverage.',
    })
  }
})

export const canonicalQualityFirstApprovedWorkGraphGpuPlacementAuthoritySchema =
  authorityWithoutHashSchema.extend({ authorityHash: sha256 }).strict()

export type CanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority =
  z.infer<
    typeof canonicalQualityFirstApprovedWorkGraphGpuPlacementAuthoritySchema
  >

export interface CanonicalQualityFirstGpuPlacementWorkItem {
  readonly workItemKey: string
  readonly workItemType: string
  readonly workerClass: string
  readonly approvedToolIds: readonly string[]
  readonly providerExecutionMode: string
  readonly executionInput: Record<string, unknown>
}

export function createCanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority(
  input: {
    readonly sourceAuthority:
      CanonicalApprovedWorkGraphResourcePlacementAuthority
    readonly workItems: readonly CanonicalQualityFirstGpuPlacementWorkItem[]
  },
): CanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority {
  const sourceAuthority = verifySourceAuthority(input.sourceAuthority)
  const gpuPolicy = assertCanonicalQualityFirstUserTriggeredGpuPolicy(
    createCanonicalQualityFirstUserTriggeredGpuPolicy(),
  )
  const toolPolicy =
    assertCanonicalQualityFirstProfessionalToolGpuPlacement(
      createCanonicalQualityFirstProfessionalToolGpuPlacement(),
    )
  const workItems = [...input.workItems].sort((left, right) =>
    utf16Compare(left.workItemKey, right.workItemKey))
  if (
    workItems.length !== sourceAuthority.placements.length
    || new Set(workItems.map((workItem) => workItem.workItemKey)).size !==
      workItems.length
  ) {
    throw new Error(
      'Fresh-plan GPU placement requires one unique work item per source placement.',
    )
  }
  const sourceByKey = new Map(sourceAuthority.placements.map((placement) => [
    placement.workItemKey,
    placement,
  ]))
  const placements = workItems.map((workItem) => {
    const source = sourceByKey.get(workItem.workItemKey)
    if (!source || !sourceMatchesWorkItem(source, workItem)) {
      throw new Error(
        'Fresh-plan GPU placement source no longer matches the canonical work graph.',
      )
    }
    return compilePlacement(workItem, source, toolPolicy.entries)
  })
  const count = (targetClass: z.infer<typeof targetClassSchema>) =>
    placements.filter((placement) =>
      placement.targetClass === targetClass).length
  const workGraphExecutionInputDigestSha256 = sha256AuthorityValue(
    workItems.map((workItem) => ({
      workItemKey: workItem.workItemKey,
      workItemType: workItem.workItemType,
      workerClass: workItem.workerClass,
      approvedToolIds: [...workItem.approvedToolIds],
      providerExecutionMode: workItem.providerExecutionMode,
      executionInputHash: sha256AuthorityValue(workItem.executionInput),
    })),
  )
  const payload = authorityWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_QUALITY_FIRST_APPROVED_WORK_GRAPH_GPU_PLACEMENT_AUTHORITY_VERSION,
    source:
      'canonical_server_fresh_plan_quality_first_gpu_placement_compiler',
    sourcePlacementAuthority: {
      schemaVersion: sourceAuthority.schemaVersion,
      authorityHash: sourceAuthority.authorityHash,
      workItemAuthorityHash: sourceAuthority.workItemAuthorityHash,
      toolIdentityAuthorityHash: sourceAuthority.toolIdentityAuthorityHash,
      placementCount: sourceAuthority.placements.length,
      immutableHistoricalReaderRetained: true,
      mayAuthorizeFreshPlanExecution: false,
    },
    qualityFirstGpuPolicy: {
      schemaVersion: gpuPolicy.schemaVersion,
      policyHash: gpuPolicy.policyHash,
    },
    professionalToolPlacementPolicy: {
      schemaVersion: toolPolicy.schemaVersion,
      policyHash: toolPolicy.policyHash,
    },
    workGraphExecutionInputDigestSha256,
    placements,
    summary: {
      totalWorkItemCount: placements.length,
      lightweightControlPlaneCount:
        count('lightweight_control_plane_non_gpu'),
      externalProviderCount: count('external_provider_owned'),
      a100PrimaryL4FallbackCount:
        count('a100_80gb_heavy_primary_l4_fallback'),
      l4StandardPrimaryCount: count('l4_standard_gpu_primary'),
      l4ColocatedHelperCount: count('l4_colocated_gpu_helper'),
      cpuOnlySubstantiveWorkItemCount: 0,
      everyWorkItemCoveredExactlyOnce: true,
      allSubstantiveWorkRequiresGpu: true,
      callerSelectedPlacement: false,
    },
    lifecycle: {
      explicitApprovedUserTriggerRequired: true,
      noApprovedWorkMeansZeroGpuInstances: true,
      minimumIdleA100Instances: 0,
      minimumIdleL4Instances: 0,
      coldStartExpectedAndMetered: true,
      terminalAttemptMustScaleToZero: true,
      speculativeStartupPrewarmingOrKeepaliveAllowed: false,
    },
    pricing: {
      exactBillingAccountEffectiveRatesRequiredBeforeApproval: true,
      exactOperationOrModelCostProfileRequired: true,
      coldStartModelLoadAndActiveRuntimeIncluded: true,
      exactTerminalUsageRequiredForSettlement: true,
      customerCreditsMayBeSettledOnlyFromApprovedPlanAuthority: true,
      unapprovedOverageChargedToCustomer: false,
      weeditproSystemFailureChargedToCustomer: false,
    },
    boundaries: {
      freshPlanPlacementAuthority: true,
      legacyCpuPlacementMayAuthorizeFreshPlan: false,
      approvedSnapshotMutationAllowed: false,
      controlPlaneCpuMayAuthenticateValidateHashQueueAndPersist: true,
      controlPlaneCpuMayExecuteMediaOrModels: false,
      cpuOnlyMediaModelRenderOrQaExecutionAllowed: false,
      classifiedHeavyFallbackMayReduceQuality: false,
      runtimeDownloadAllowed: false,
      cloudDispatchAuthorized: false,
      customerCreditsMutated: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
  return canonicalQualityFirstApprovedWorkGraphGpuPlacementAuthoritySchema
    .parse({
      ...payload,
      authorityHash: sha256AuthorityValue(payload),
    })
}

export function assertCanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority(
  input: {
    readonly value: unknown
    readonly sourceAuthority:
      CanonicalApprovedWorkGraphResourcePlacementAuthority
    readonly workItems: readonly CanonicalQualityFirstGpuPlacementWorkItem[]
  },
): CanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority {
  const parsed =
    canonicalQualityFirstApprovedWorkGraphGpuPlacementAuthoritySchema
      .parse(input.value)
  const { authorityHash, ...payload } = parsed
  if (authorityHash !== sha256AuthorityValue(payload)) {
    throw new Error('Fresh-plan GPU placement authority hash is invalid.')
  }
  const current =
    createCanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority({
      sourceAuthority: input.sourceAuthority,
      workItems: input.workItems,
    })
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(current)) {
    throw new Error(
      'Fresh-plan GPU placement no longer matches current immutable authority.',
    )
  }
  return parsed
}

function compilePlacement(
  workItem: CanonicalQualityFirstGpuPlacementWorkItem,
  source: CanonicalFrozenWorkItemResourcePlacement,
  toolEntries: readonly CanonicalQualityFirstProfessionalToolGpuPlacementEntry[],
): z.infer<typeof placementSchema> {
  const toolId = source.approvedToolIds[0]
  const toolEntry = toolId
    ? toolEntries.find((entry) => entry.toolId === toolId)
    : undefined
  if (toolId && !toolEntry) {
    throw new Error(`Fresh-plan GPU placement has no tool policy for ${toolId}.`)
  }
  if (toolEntry?.placementClass === 'historical_read_only') {
    throw new Error(`Historical tool ${toolId} cannot enter a fresh plan.`)
  }
  if (toolEntry?.gpuImplementationDisposition ===
    'gpu_successor_implementation_required') {
    throw new Error(`Tool ${toolId} has no declared GPU execution owner.`)
  }

  const classification = classify(workItem, source, toolEntry)
  const targetClass = targetClassFor(classification, toolEntry)
  const heavy = targetClass ===
    'a100_80gb_heavy_primary_l4_fallback'
  const standard = targetClass === 'l4_standard_gpu_primary'
  const helper = targetClass === 'l4_colocated_gpu_helper'
  const external = targetClass === 'external_provider_owned'
  const control = targetClass === 'lightweight_control_plane_non_gpu'
  const gpu = heavy || standard || helper
  const requiredGates = heavy
    ? [
        'exact_a100_80gb_primary_runtime_release',
        'exact_separately_qualified_l4_heavy_fallback_release',
        'classified_primary_failure_before_fallback',
        'billing_account_effective_primary_and_fallback_rates',
        'approved_plan_estimate_snapshot_and_funded_reservation',
        'terminal_gpu_usage_cost_and_scale_to_zero_evidence',
      ]
    : standard
      ? [
          'exact_l4_standard_runtime_release',
          'billing_account_effective_l4_rate',
          'approved_plan_estimate_snapshot_and_funded_reservation',
          'gpu_kernel_or_hardware_codec_attempt_evidence',
          'terminal_gpu_usage_cost_and_scale_to_zero_evidence',
        ]
      : helper
        ? [
            'exact_parent_l4_work_item_binding',
            'same_attempt_gpu_adjacent_helper_boundary',
            'parent_attempt_rate_usage_and_settlement_authority',
          ]
        : external
          ? [
              'approved_provider_route_and_model_version',
              'provider_usage_cost_authority',
              'approved_plan_estimate_snapshot_and_funded_reservation',
              'canonical_provider_result_persistence_and_reread',
            ]
          : [
              'lightweight_control_plane_image_identity',
              'control_plane_no_media_or_model_execution_attestation',
            ]
  const payload = placementWithoutHashSchema.parse({
    workItemKey: workItem.workItemKey,
    workItemType: workItem.workItemType,
    canonicalWorkerClass: workItem.workerClass,
    sourcePlacementHash: source.placementHash,
    workItemExecutionInputHash: sha256AuthorityValue(workItem.executionInput),
    approvedToolIds: [...source.approvedToolIds],
    approvedToolOperationIds: [...source.approvedToolOperationIds],
    providerExecutionMode: source.providerExecutionMode,
    classification,
    targetClass,
    primaryProfileId: heavy
      ? CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0]
      : gpu
        ? CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[2]
        : null,
    fallbackProfileId: heavy
      ? CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1]
      : null,
    primaryRouteId: heavy
      ? 'a100_80gb_heavy_primary'
      : gpu
        ? 'l4_standard_primary'
        : null,
    fallbackRouteId: heavy ? 'l4_heavy_fallback' : null,
    primaryAccelerator: heavy
      ? 'nvidia_a100_80gb'
      : gpu
        ? 'nvidia_l4'
        : null,
    fallbackAccelerator: heavy ? 'nvidia_l4' : null,
    gpuExecutionOwnerToolId: gpu
      ? toolEntry?.gpuExecutionOwnerToolId ?? toolId ?? null
      : null,
    toolPlacementEntryHash: toolEntry?.entryHash ?? null,
    costProfileId: gpu
      ? toolEntry?.costProfileId ?? toolFreeCostProfile(targetClass)
      : null,
    explicitApprovedUserWorkTriggerRequired: true,
    fundedReservationRequiredBeforeGpuOrProviderStart: gpu || external,
    minimumIdleGpuInstances: 0,
    scaleToZeroAfterTerminalAttemptRequired: gpu,
    currentBillingAccountEffectiveRateAuthorityRequired: gpu,
    exactAttemptUsageAndCostEvidenceRequired: gpu,
    classifiedFallbackRequiresKnownSafePrimaryFailure: heavy,
    qualityReducingFallbackAllowed: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    gpuHostCpuOnlyExecutionMaySatisfyGpuWork: false,
    controlPlaneCpuMayExecuteMediaOrModels: false,
    gpuAdjacentCpuHelpersLimitedToIoMetadataAndOrchestration: helper,
    immutableRuntimeReleaseRequiredBeforeDispatch: gpu,
    placementEligibleForRuntimeAdmission: true,
    runtimeAdmissionGranted: false,
    requiredGates,
  })
  if (control && toolEntry?.placementClass !== 'non_gpu_control_plane_only'
    && toolEntry !== undefined) {
    throw new Error('Only control-plane tools may receive non-GPU placement.')
  }
  return placementSchema.parse({
    ...payload,
    placementHash: sha256AuthorityValue(payload),
  })
}

function classify(
  workItem: CanonicalQualityFirstGpuPlacementWorkItem,
  source: CanonicalFrozenWorkItemResourcePlacement,
  toolEntry: CanonicalQualityFirstProfessionalToolGpuPlacementEntry | undefined,
): z.infer<typeof classificationSchema> {
  if (source.providerExecutionMode !== 'none') {
    return 'provider_execution_mode'
  }
  if (toolEntry) return 'professional_tool_gpu_policy'
  if (isExactSam31PendingOperation(workItem)) {
    return 'sam3_1_exact_pending_operation'
  }
  if (TOOL_FREE_HEAVY_WORK_ITEM_TYPES.has(workItem.workItemType)) {
    return 'exact_tool_free_heavy_work_type'
  }
  if (['api_service', 'tool_readiness_worker'].includes(source.workerType)) {
    return 'lightweight_worker_class'
  }
  return 'default_tool_free_substantive_l4'
}

function targetClassFor(
  classification: z.infer<typeof classificationSchema>,
  toolEntry: CanonicalQualityFirstProfessionalToolGpuPlacementEntry | undefined,
): z.infer<typeof targetClassSchema> {
  if (classification === 'provider_execution_mode') {
    return 'external_provider_owned'
  }
  if (toolEntry) {
    if (toolEntry.placementClass === 'non_gpu_control_plane_only') {
      return 'lightweight_control_plane_non_gpu'
    }
    if (toolEntry.placementClass ===
      'l4_colocated_io_container_metadata_helper') {
      return 'l4_colocated_gpu_helper'
    }
    if (toolEntry.placementClass ===
      'a100_80gb_heavy_primary_l4_fallback') {
      return 'a100_80gb_heavy_primary_l4_fallback'
    }
    return 'l4_standard_gpu_primary'
  }
  if (classification === 'sam3_1_exact_pending_operation'
    || classification === 'exact_tool_free_heavy_work_type') {
    return 'a100_80gb_heavy_primary_l4_fallback'
  }
  if (classification === 'lightweight_worker_class') {
    return 'lightweight_control_plane_non_gpu'
  }
  return 'l4_standard_gpu_primary'
}

function sourceMatchesWorkItem(
  source: CanonicalFrozenWorkItemResourcePlacement,
  workItem: CanonicalQualityFirstGpuPlacementWorkItem,
): boolean {
  const operationIds = workItem.executionInput.approvedToolOperationIds
  const exactOperationIds = operationIds === undefined
    && workItem.approvedToolIds.length === 0
    ? []
    : Array.isArray(operationIds)
      && operationIds.every((value) => typeof value === 'string')
      ? operationIds
      : null
  return exactOperationIds !== null
    && source.workItemType === workItem.workItemType
    && source.canonicalWorkerClass === workItem.workerClass
    && stableAuthorityStringify(source.approvedToolIds) ===
      stableAuthorityStringify(workItem.approvedToolIds)
    && stableAuthorityStringify(source.approvedToolOperationIds) ===
      stableAuthorityStringify(exactOperationIds)
    && source.providerExecutionMode === workItem.providerExecutionMode
}

function verifySourceAuthority(
  value: CanonicalApprovedWorkGraphResourcePlacementAuthority,
): CanonicalApprovedWorkGraphResourcePlacementAuthority {
  const parsed = canonicalApprovedWorkGraphResourcePlacementAuthoritySchema
    .parse(value)
  const { authorityHash, ...payload } = parsed
  if (authorityHash !== sha256AuthorityValue(payload)) {
    throw new Error('Historical source placement authority hash is invalid.')
  }
  return parsed
}

function isExactSam31PendingOperation(
  workItem: CanonicalQualityFirstGpuPlacementWorkItem,
): boolean {
  const authority = workItem.executionInput.pendingOperationAuthority
  if (!authority || typeof authority !== 'object' || Array.isArray(authority)) {
    return false
  }
  const value = authority as Record<string, unknown>
  return value.operationClass ===
      'temporal_video_subject_segmentation_and_tracking'
    && value.requestedToolId === 'sam3_1'
    && value.requestedToolOperationId ===
      'tool.sam3_1.segment_and_track_subject.v1'
}

function toolFreeCostProfile(
  targetClass: z.infer<typeof targetClassSchema>,
): string | null {
  return targetClass === 'a100_80gb_heavy_primary_l4_fallback'
    ? 'canonical-tool-free-heavy-gpu-work-v1'
    : targetClass === 'l4_standard_gpu_primary'
      ? 'canonical-tool-free-standard-l4-work-v1'
      : targetClass === 'l4_colocated_gpu_helper'
        ? 'canonical-tool-free-l4-helper-work-v1'
        : null
}

const TOOL_FREE_HEAVY_WORK_ITEM_TYPES = new Set([
  'transcribe_complete_source_audio',
  'generate_stable_audio_3_small_sfx',
  'generate_comfyui_controlled_image',
])

function utf16Compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

export function canonicalQualityFirstApprovedWorkGraphGpuPlacementFor(
  authority: CanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority,
  workItemKey: string,
) {
  const placement = authority.placements.find((candidate) =>
    candidate.workItemKey === workItemKey)
  if (!placement) {
    throw new Error(`Fresh-plan GPU placement is missing for ${workItemKey}.`)
  }
  return placement
}

export function canonicalQualityFirstGpuRouteIdsForPlacement(
  placement: CanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority[
    'placements'
  ][number],
): Array<
  | 'a100_80gb_heavy_primary'
  | 'l4_heavy_fallback'
  | 'l4_standard_primary'
> {
  return [placement.primaryRouteId, placement.fallbackRouteId]
    .filter((value): value is
      | 'a100_80gb_heavy_primary'
      | 'l4_heavy_fallback'
      | 'l4_standard_primary' => value !== null)
}
