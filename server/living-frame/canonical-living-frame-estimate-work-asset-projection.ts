import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import type {
  CanonicalLivingFrameExecutionRequirements,
} from '../../src/types/living-frame-execution-requirements'
import {
  CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_SOURCE,
  CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_VERSION,
  type CanonicalLivingFrameEstimateWorkAssetProjection,
  type CanonicalLivingFrameEstimateWorkAssetProjectionAuthorityBoundary,
  type CanonicalLivingFrameEstimateWorkAssetProjectionDraft,
  type CanonicalLivingFrameProjectedEstimateLineItem,
  type CanonicalLivingFrameProjectedExecutionPlacement,
  type CanonicalLivingFrameProjectedExpectedOutput,
  type CanonicalLivingFrameProjectedInfrastructureEstimateLineItem,
  type CanonicalLivingFrameProjectedToolId,
  type CanonicalLivingFrameProjectedWorkItemType,
  type CanonicalLivingFrameProjectedWorkRequirement,
} from '../../src/types/living-frame-estimate-work-asset-projection'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import type {
  ReEditProCanonicalEditLevel,
  ReEditProLegacyEditLevel,
} from '../../src/types/edit-level'
import {
  mapLegacyEditLevelToCanonical,
} from '../../src/lib/edit-level-compatibility-mappers'
import {
  estimateProductionToolCost,
} from '../tool-cost-metering'
import {
  COST_MICROS_PER_CENT,
} from '../tool-cost-metering/rate-card'
import {
  CREDIT_RETAIL_VALUE_CENTS,
} from '../../src/types/credit-policy'
import {
  listProductionToolProfiles,
} from '../tool-registry'
import {
  resolveCompleteProfessionalToolOperationSpec,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  compileCanonicalLivingFrameControlledIllustrationEstimateBasis,
} from './canonical-living-frame-controlled-illustration-estimate-basis'

const COST_MICROS_PER_CREDIT =
  COST_MICROS_PER_CENT * CREDIT_RETAIL_VALUE_CENTS

interface WorkProjectionProfile {
  readonly toolId: CanonicalLivingFrameProjectedToolId
  readonly operationId: string
  readonly label: string
  readonly executionPlacement:
    CanonicalLivingFrameProjectedExecutionPlacement
  readonly cpuFallbackAllowed: boolean
  readonly artifactType: string
  readonly contentType: 'application/json' | 'image/png'
}

const WORK_PROJECTION_PROFILES: Readonly<
  Partial<
    Record<
      CanonicalLivingFrameProjectedWorkItemType,
      WorkProjectionProfile
    >
  >
> = Object.freeze({
  generate_mask_asset: {
    toolId: 'rembg',
    operationId:
      'tool.rembg.remove_image_background.v1',
    label: 'Living Frame alpha mask preparation',
    executionPlacement: 'google_cloud_run_gpu',
    cpuFallbackAllowed: false,
    artifactType: 'living_frame_alpha_mask_png',
    contentType: 'image/png',
  },
  process_image_asset: {
    toolId: 'sharp',
    operationId:
      'tool.sharp.prepare_approved_image_asset.v1',
    label: 'Living Frame component image preparation',
    executionPlacement: 'private_render_worker',
    cpuFallbackAllowed: true,
    artifactType: 'living_frame_component_rgba_png',
    contentType: 'image/png',
  },
  reconstruct_background_plate: {
    toolId: 'openimageio',
    operationId:
      'tool.openimageio.process_image_sequence.v1',
    label: 'Living Frame background plate reconstruction',
    executionPlacement: 'private_cpu_worker',
    cpuFallbackAllowed: true,
    artifactType: 'living_frame_background_plate_png',
    contentType: 'image/png',
  },
  prepare_remotion_layer: {
    toolId: 'remotion',
    operationId:
      'tool.remotion.render_approved_composition.v1',
    label: 'Living Frame Remotion layer preparation',
    executionPlacement: 'private_render_worker',
    cpuFallbackAllowed: true,
    artifactType: 'living_frame_remotion_layer_manifest',
    contentType: 'application/json',
  },
})

const AUTHORITY_BOUNDARY:
  CanonicalLivingFrameEstimateWorkAssetProjectionAuthorityBoundary =
    Object.freeze({
      serverDerivedEstimateRequirementAuthority: true,
      serverDerivedNamedWorkRequirementAuthority: true,
      serverDerivedExpectedAssetRequirementAuthority: true,
      customerEstimateAuthority: false,
      customerServiceFeeAuthority: false,
      customerCommercialAuthority: false,
      approvalAuthority: false,
      snapshotAuthority: false,
      workGraphMutationAuthority: false,
      queueAuthority: false,
      assetManifestAuthority: false,
      providerAuthority: false,
      toolRouteAuthority: false,
      qaApprovalAuthority: false,
      privateReviewAuthority: false,
      rendererAuthority: false,
      runtimeAuthority: false,
      productionAuthority: false,
    })

export function compileCanonicalLivingFrameEstimateWorkAssetProjection(
  input: {
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements
    readonly timingBinding:
      CanonicalLivingFrameTimingBinding
    readonly assetWorkInputBinding:
      CanonicalLivingFrameAssetWorkInputBinding
    readonly components: CanonicalPlanComponentsInput
  },
): CanonicalLivingFrameEstimateWorkAssetProjection {
  assertSourceLineage(input)
  const exactToolCount = listProductionToolProfiles().length
  if (exactToolCount !== 50) {
    throw conflict(
      'Canonical Living Frame projection refused drift from the exact 50-tool registry.',
    )
  }
  const productEditLevel = resolveProductEditLevel(
    input.components.confirmedSettings.editLevel,
  )
  const unallocatedScenes = input.requirements.scenes.map(
    (scene, sceneIndex) => {
      const assetWorkScene =
        input.assetWorkInputBinding.scenes.find(
          (candidate) =>
            candidate.sceneId === scene.sceneId,
        )
      const timingScene = input.timingBinding.scenes.find(
        (candidate) => candidate.sceneId === scene.sceneId,
      )
      if (!timingScene || !assetWorkScene) {
        throw conflict(
          'Canonical Living Frame work projection cannot find the exact scene timing and asset/work input binding.',
        )
      }
      const sceneKey = `lf-${String(sceneIndex + 1).padStart(3, '0')}-${sha256AuthorityValue(scene.sceneId).slice(0, 12)}`
      const workKeyByType = new Map(
        assetWorkScene.refinedRequiredNamedWorkItemTypes.map((workItemType) => [
          workItemType,
          `${sceneKey}-${workItemType.replaceAll('_', '-')}`,
        ]),
      )
      const workRequirements =
        assetWorkScene.namedWorkInputs
        .filter((workInput) =>
          workInput.workItemType !==
            'generate_image_asset')
        .map((workInput) =>
          compileWorkRequirement({
            scene,
            timingScene,
            workInput,
            workKeyByType,
          }))
      const registeredToolEstimateLineItems = workRequirements.map(
        (workRequirement, workIndex) =>
          compileEstimateLineItem({
            identity: input.publication.binding.identity,
            productEditLevel,
            sceneId: scene.sceneId,
            workIndex,
            workRequirement,
          }),
      )
      const generatedAssetIntentIds =
        assetWorkScene.assetIntents
          .filter((assetIntent) =>
            assetIntent.assetKind ===
              'generated_opaque_still_source'
            || assetIntent.assetKind ===
              'controlled_opaque_still_variation_source')
          .map((assetIntent) =>
            assetIntent.assetIntentId)
      const controlledIllustrationEstimateBasis =
        compileCanonicalLivingFrameControlledIllustrationEstimateBasis({
          sceneId: scene.sceneId,
          productEditLevel,
          generatedAssetIntentIds,
          capabilityKeys: scene.capabilityKeys,
        })
      const controlledIllustrationEstimateLineItems =
        controlledIllustrationEstimateBasis.costComponents.map(
          (costComponent, componentIndex) =>
            compileInfrastructureEstimateLineItem({
              sceneKey,
              sceneId: scene.sceneId,
              componentIndex,
              costComponent,
            }),
        )
      return {
        sceneId: scene.sceneId,
        canonicalSegmentId: scene.canonicalSegmentId,
        startFrame: scene.startFrame,
        endFrameExclusive: scene.endFrameExclusive,
        timingSceneDigestSha256:
          sha256AuthorityValue(timingScene),
        estimateLineItems: [
          ...controlledIllustrationEstimateLineItems,
          ...registeredToolEstimateLineItems,
        ],
        workRequirements,
      }
    },
  )
  const scenes =
    allocateCreditsOnceAcrossLivingFrameBundle(
      unallocatedScenes,
    )
  const projectedEstimateLineItems = scenes.flatMap(
    (scene) => scene.estimateLineItems,
  )
  const projectedWorkRequirements = scenes.flatMap(
    (scene) => scene.workRequirements,
  )
  const draft:
    CanonicalLivingFrameEstimateWorkAssetProjectionDraft = {
      schemaVersion:
        CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_VERSION,
      source:
        CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_SOURCE,
      evidenceClass:
        'private_internal_server_derived_estimate_work_asset_requirements',
      identity: {
        workspaceId: input.publication.binding.identity.workspaceId,
        projectId: input.publication.binding.identity.projectId,
        editSessionId:
          input.publication.binding.identity.editSessionId,
      },
      sourceBindings: {
        selectedSceneBindingDigestSha256:
          input.publication.binding.bindingDigestSha256,
        executionRequirementsDigestSha256:
          input.requirements.requirementsDigestSha256,
        timingBindingDigestSha256:
          input.timingBinding.timingBindingDigestSha256,
        assetWorkInputBindingDigestSha256:
          input.assetWorkInputBinding.bindingDigestSha256,
        currentMasterTimingDigestSha256:
          sha256AuthorityValue(
            input.components.masterTimingPlan,
          ),
        currentSoundSyncDigestSha256:
          sha256AuthorityValue(
            input.components.soundSyncTransitionTimingPlan,
          ),
        confirmedSettingsDigestSha256:
          sha256AuthorityValue(
            input.components.confirmedSettings,
          ),
      },
      productEditLevel,
      readiness: scenes.length === 0
        ? 'ready_without_living_frame_projection'
        : 'requirements_projected_execution_admission_pending',
      scenes,
      metrics: {
        selectedSceneCount: scenes.length,
        projectedEstimateLineItemCount:
          projectedEstimateLineItems.length,
        projectedNamedWorkItemCount:
          projectedWorkRequirements.length,
        projectedExpectedAssetCount:
          projectedWorkRequirements.length,
        projectedGpuWorkItemCount:
          projectedWorkRequirements.filter(
            (work) =>
              work.executionPlacement ===
              'google_cloud_run_gpu',
          ).length,
        projectedControlledIllustrationGenerationUnitCount:
          projectedEstimateLineItems.reduce(
            (total, item) =>
              total
              + (
                item.costOwnerClass ===
                  'shared_controlled_illustration_runtime'
                && item
                  .controlledIllustrationCostComponentId ===
                  'shared_controlled_illustration_gpu_host'
                  ? item.generationUnitCount
                  : 0
              ),
            0,
          ),
        projectedControlledIllustrationCostComponentCount:
          projectedEstimateLineItems.filter(
            (item) =>
              item.costOwnerClass ===
                'shared_controlled_illustration_runtime',
          ).length,
        projectedMaximumInternalToolCostCredits:
          projectedEstimateLineItems.reduce(
            (total, item) =>
              total + item.estimatedCredits,
            0,
          ),
        projectedMaximumInternalToolCostMicros:
          projectedEstimateLineItems.reduce(
            (total, item) =>
              total
              + item.costRange
                .highInternalCostMicros,
            0,
          ),
        controlledIllustrationCreditRoundingAppliedOnceAcrossLivingFrameBundle:
          true,
        exactProductionToolRegistryCount: 50,
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      existingCustomerEstimateAndServiceFeePipelineRemainsAuthority:
        true,
      existingApprovedWorkGraphRemainsAuthority: true,
      existingApprovedAssetManifestRemainsAuthority: true,
      customerEstimateRecalculationRequired:
        scenes.length > 0,
      containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
        false,
      containsProviderPromptOrExecutablePayload: false,
      createsCanonicalWorkItems: false,
      createsAssetManifestEntries: false,
      expandsExactFiftyToolRegistry: false,
      subjectSpecificRouting: false,
      productionReady: false,
    }
  return {
    ...draft,
    projectionDigestSha256: sha256AuthorityValue(draft),
  }
}

function compileInfrastructureEstimateLineItem(input: {
  readonly sceneKey: string
  readonly sceneId: string
  readonly componentIndex: number
  readonly costComponent:
    ReturnType<
      typeof compileCanonicalLivingFrameControlledIllustrationEstimateBasis
    >['costComponents'][number]
}): CanonicalLivingFrameProjectedInfrastructureEstimateLineItem {
  return {
    lineKey:
      `${input.sceneKey}-${input.costComponent.componentId}-estimate-${String(input.componentIndex + 1).padStart(2, '0')}`,
    label: input.costComponent.label,
    category: 'living_frame',
    estimatedCredits: 0,
    removable: false,
    sceneId: input.sceneId,
    costOwnerClass:
      'shared_controlled_illustration_runtime',
    workItemType: null,
    costOwnerToolId: null,
    costOwnerOperationId: null,
    controlledIllustrationCostComponentId:
      input.costComponent.componentId,
    activeControlledIllustrationCapabilityIds:
      input.costComponent.activeCapabilityIds,
    generatedAssetIntentIds:
      input.costComponent.generatedAssetIntentIds,
    generationUnitCount:
      input.costComponent.generationUnitCount,
    attemptOrComparisonCount:
      input.costComponent.attemptOrComparisonCount,
    billableMilliseconds:
      input.costComponent.billableMilliseconds,
    executionPlacement:
      input.costComponent.executionPlacement,
    cpuFallbackAllowed:
      input.costComponent.cpuFallbackAllowed,
    costRange: {
      lowCredits: 0,
      expectedCredits: 0,
      highCredits: 0,
      lowInternalCostMicros:
        input.costComponent.costRange
          .lowInternalCostMicros,
      expectedInternalCostMicros:
        input.costComponent.costRange
          .expectedInternalCostMicros,
      highInternalCostMicros:
        input.costComponent.costRange
          .highInternalCostMicros,
      riskLevel:
        input.costComponent.costRange.riskLevel,
      rateCardVersion:
        input.costComponent.costRange
          .rateCardVersion,
      serviceFeeIncluded: false,
    },
    exactFiftyToolRegistryMember: false,
    operationContractObserved: false,
    actualAttemptCostEvidenceRequired: true,
    productionRateAuthority: false,
    estimateOnly: true,
  }
}

export function verifyCanonicalLivingFrameEstimateWorkAssetProjection(
  input: {
    readonly projection: unknown
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements
    readonly timingBinding:
      CanonicalLivingFrameTimingBinding
    readonly assetWorkInputBinding:
      CanonicalLivingFrameAssetWorkInputBinding
    readonly components: CanonicalPlanComponentsInput
  },
): input is {
  readonly projection:
    CanonicalLivingFrameEstimateWorkAssetProjection
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly timingBinding:
    CanonicalLivingFrameTimingBinding
  readonly assetWorkInputBinding:
    CanonicalLivingFrameAssetWorkInputBinding
  readonly components: CanonicalPlanComponentsInput
} {
  try {
    const expected =
      compileCanonicalLivingFrameEstimateWorkAssetProjection({
        publication: input.publication,
        requirements: input.requirements,
        timingBinding: input.timingBinding,
        assetWorkInputBinding:
          input.assetWorkInputBinding,
        components: input.components,
      })
    return (
      isRecord(input.projection)
      && input.projection.schemaVersion ===
        CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_VERSION
      && input.projection.source ===
        CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_SOURCE
      && input.projection.projectionDigestSha256 ===
        sha256AuthorityValue(
          withoutDigest(input.projection),
        )
      && stableAuthorityStringify(input.projection) ===
        stableAuthorityStringify(expected)
    )
  } catch {
    return false
  }
}

function compileWorkRequirement(input: {
  readonly scene:
    CanonicalLivingFrameExecutionRequirements['scenes'][number]
  readonly timingScene:
    CanonicalLivingFrameTimingBinding['scenes'][number]
  readonly workInput:
    CanonicalLivingFrameAssetWorkInputBinding[
      'scenes'
    ][number]['namedWorkInputs'][number]
  readonly workKeyByType: ReadonlyMap<
    CanonicalLivingFrameProjectedWorkItemType,
    string
  >
}): CanonicalLivingFrameProjectedWorkRequirement {
  const profile =
    WORK_PROJECTION_PROFILES[
      input.workInput.workItemType
    ]
  if (!profile) {
    throw conflict(
      `Canonical Living Frame named work type ${input.workInput.workItemType} has no admitted exact-50 cost and asset projection.`,
    )
  }
  assertExactToolOperation(profile)
  const workItemKey =
    input.workKeyByType.get(
      input.workInput.workItemType,
    )
  if (!workItemKey) {
    throw conflict(
      'Canonical Living Frame named work projection lost its deterministic work-item key.',
    )
  }
  const dependencyWorkItemKeys =
    input.workInput.dependencyNamedWorkItemTypes.flatMap(
      (dependencyType) => {
        const dependency =
          input.workKeyByType.get(dependencyType)
        return dependency ? [dependency] : []
      },
    )
  return {
    workItemKey,
    sceneId: input.scene.sceneId,
    workItemType: input.workInput.workItemType,
    dependencyWorkItemKeys,
    inputAssetIntentIds: [
      ...input.workInput.inputAssetIntentIds,
    ],
    outputAssetIntentIds: [
      ...input.workInput.outputAssetIntentIds,
    ],
    sourceFrameInputs:
      input.workInput.sourceFrameInputs.map(
        (sourceFrameInput) => ({
          ...sourceFrameInput,
        }),
      ),
    costOwnerToolId: profile.toolId,
    costOwnerOperationId: profile.operationId,
    executionPlacement: profile.executionPlacement,
    cpuFallbackAllowed: profile.cpuFallbackAllowed,
    expectedOutput: compileExpectedOutput({
      scene: input.scene,
      timingScene: input.timingScene,
      workItemKey,
      profile,
    }),
    currentRuntimeAdmission:
      'blocked_until_real_dependency_input_operation_is_admitted',
    workGraphMutationAuthorized: false,
    executablePayloadPresent: false,
  }
}

function compileExpectedOutput(input: {
  readonly scene:
    CanonicalLivingFrameExecutionRequirements['scenes'][number]
  readonly timingScene:
    CanonicalLivingFrameTimingBinding['scenes'][number]
  readonly workItemKey: string
  readonly profile: WorkProjectionProfile
}): CanonicalLivingFrameProjectedExpectedOutput {
  return {
    outputKey: `${input.workItemKey}-output`,
    artifactType: input.profile.artifactType,
    assetRole: 'processed',
    required: true,
    previewPlaceholderAllowed: false,
    contentType: input.profile.contentType,
    segmentIds: [input.scene.canonicalSegmentId],
    timingIds: uniqueSorted([
      ...input.scene.semanticTimingRequestIds,
      ...input.scene.soundRequestIds,
      ...input.timingScene.semanticPhaseBindings.map(
        (binding) => binding.timingRequestId,
      ),
      ...input.timingScene.soundCueBindings.map(
        (binding) => binding.soundRequestId,
      ),
    ]),
    rendererLayerIds: uniqueSorted(
      input.scene.componentIds,
    ),
    assetManifestEntryRequiredAfterApproval: true,
  }
}

function compileEstimateLineItem(input: {
  readonly identity:
    CanonicalLivingFrameSelectedScenePublication[
      'binding'
    ]['identity']
  readonly productEditLevel:
    ReEditProCanonicalEditLevel
  readonly sceneId: string
  readonly workIndex: number
  readonly workRequirement:
    CanonicalLivingFrameProjectedWorkRequirement
}): CanonicalLivingFrameProjectedEstimateLineItem {
  const cost = estimateProductionToolCost({
    toolId: input.workRequirement.costOwnerToolId,
    workspaceId: input.identity.workspaceId,
    projectId: input.identity.projectId,
    productEditLevel: input.productEditLevel,
    estimateOnlyWhenBlocked: true,
  })
  if (!cost.ok || cost.data.serviceFeeIncluded) {
    throw conflict(
      `Canonical Living Frame could not derive a mock-safe cost-owner estimate for ${input.workRequirement.costOwnerToolId}.`,
    )
  }
  const profile =
    WORK_PROJECTION_PROFILES[input.workRequirement.workItemType]
  if (!profile) {
    throw conflict(
      'Canonical Living Frame cost projection lost its named-work profile.',
    )
  }
  return {
    lineKey:
      `${input.workRequirement.workItemKey}-estimate-${String(input.workIndex + 1).padStart(2, '0')}`,
    label: profile.label,
    category: 'living_frame',
    estimatedCredits: cost.data.range.highCredits,
    removable: false,
    sceneId: input.sceneId,
    costOwnerClass: 'canonical_production_tool',
    workItemType: input.workRequirement.workItemType,
    costOwnerToolId:
      input.workRequirement.costOwnerToolId,
    costOwnerOperationId:
      input.workRequirement.costOwnerOperationId,
    controlledIllustrationCostComponentId: null,
    activeControlledIllustrationCapabilityIds: [],
    executionPlacement:
      input.workRequirement.executionPlacement,
    cpuFallbackAllowed:
      input.workRequirement.cpuFallbackAllowed,
    costRange: {
      lowCredits: cost.data.range.lowCredits,
      expectedCredits:
        cost.data.range.expectedCredits,
      highCredits: cost.data.range.highCredits,
      lowInternalCostMicros:
        cost.data.lowInternalCostMicros,
      expectedInternalCostMicros:
        cost.data.expectedInternalCostMicros,
      highInternalCostMicros:
        cost.data.highInternalCostMicros,
      riskLevel: cost.data.riskLevel,
      rateCardVersion: cost.data.rateCardVersion,
      serviceFeeIncluded: false,
    },
    exactFiftyToolRegistryMember: true,
    operationContractObserved: true,
    actualAttemptCostEvidenceRequired: true,
    productionRateAuthority: false,
    estimateOnly: true,
  }
}

export function allocateCreditsOnceAcrossLivingFrameBundle<
  TScene extends {
    readonly estimateLineItems:
      readonly CanonicalLivingFrameProjectedEstimateLineItem[]
  },
>(
  scenes: readonly TScene[],
): TScene[] {
  const lineItems = scenes.flatMap(
    (scene) => scene.estimateLineItems,
  ).filter((lineItem) =>
    lineItem.costOwnerClass ===
      'shared_controlled_illustration_runtime')
  if (lineItems.length === 0) {
    return scenes.map((scene) => ({
      ...scene,
      estimateLineItems: [
        ...scene.estimateLineItems,
      ],
    }))
  }
  const lowCreditsByLineKey =
    allocateCreditsByExactMicros(
      lineItems,
      'lowInternalCostMicros',
    )
  const expectedCreditsByLineKey =
    allocateCreditsByExactMicros(
      lineItems,
      'expectedInternalCostMicros',
    )
  const highCreditsByLineKey =
    allocateCreditsByExactMicros(
      lineItems,
      'highInternalCostMicros',
    )
  const allocatedByLineKey = new Map(
    lineItems.map((lineItem) => {
      const lowCredits =
        lowCreditsByLineKey.get(lineItem.lineKey) ?? 0
      const expectedCredits =
        expectedCreditsByLineKey.get(
          lineItem.lineKey,
        ) ?? 0
      const highCredits =
        highCreditsByLineKey.get(
          lineItem.lineKey,
        ) ?? 0
      return [
        lineItem.lineKey,
        {
          ...lineItem,
          estimatedCredits: highCredits,
          costRange: {
            ...lineItem.costRange,
            lowCredits,
            expectedCredits,
            highCredits,
          },
        },
      ]
    }),
  )
  return scenes.map((scene) => ({
    ...scene,
    estimateLineItems:
      scene.estimateLineItems.map(
        (lineItem) =>
          allocatedByLineKey.get(lineItem.lineKey)
          ?? lineItem,
      ),
  }))
}

function allocateCreditsByExactMicros(
  lineItems:
    readonly CanonicalLivingFrameProjectedEstimateLineItem[],
  microsField:
    | 'lowInternalCostMicros'
    | 'expectedInternalCostMicros'
    | 'highInternalCostMicros',
): Map<string, number> {
  const totalMicros = lineItems.reduce(
    (total, lineItem) =>
      total + lineItem.costRange[microsField],
    0,
  )
  if (
    !Number.isSafeInteger(totalMicros)
    || totalMicros < 0
  ) {
    throw conflict(
      'Canonical Living Frame estimate cost exceeds safe integer bounds.',
    )
  }
  const totalCredits = Math.ceil(
    totalMicros / COST_MICROS_PER_CREDIT,
  )
  const allocations = new Map<string, number>()
  const remainders = lineItems.map((lineItem) => {
    const micros = lineItem.costRange[microsField]
    const wholeCredits = Math.floor(
      micros / COST_MICROS_PER_CREDIT,
    )
    allocations.set(lineItem.lineKey, wholeCredits)
    return {
      lineKey: lineItem.lineKey,
      remainder:
        micros % COST_MICROS_PER_CREDIT,
    }
  }).sort((left, right) =>
    right.remainder - left.remainder
    || left.lineKey.localeCompare(right.lineKey))
  let remainingCredits =
    totalCredits
    - [...allocations.values()].reduce(
      (total, value) => total + value,
      0,
    )
  for (
    let index = 0;
    remainingCredits > 0;
    index += 1
  ) {
    const target = remainders[index]
    if (!target) {
      throw conflict(
        'Canonical Living Frame estimate credit allocation could not reconcile its total.',
      )
    }
    allocations.set(
      target.lineKey,
      (allocations.get(target.lineKey) ?? 0) + 1,
    )
    remainingCredits -= 1
  }
  return allocations
}

function assertExactToolOperation(
  profile: WorkProjectionProfile,
): void {
  const operation =
    resolveCompleteProfessionalToolOperationSpec(
      profile.toolId,
    )
  if (
    !operation
    || operation.canonicalToolId !== profile.toolId
    || !operation.allowedOperationIds.includes(
      profile.operationId,
    )
  ) {
    throw conflict(
      `Canonical Living Frame cost owner ${profile.toolId} does not resolve to its exact operation contract.`,
    )
  }
}

function assertSourceLineage(input: {
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly timingBinding:
    CanonicalLivingFrameTimingBinding
  readonly assetWorkInputBinding:
    CanonicalLivingFrameAssetWorkInputBinding
  readonly components: CanonicalPlanComponentsInput
}): void {
  const binding = input.publication.binding
  if (
    input.requirements.sourceBindings
      .selectedSceneBindingDigestSha256 !==
      binding.bindingDigestSha256
    || input.timingBinding.sourceBindings
      .selectedSceneBindingDigestSha256 !==
      binding.bindingDigestSha256
    || input.timingBinding.sourceBindings
      .executionRequirementsDigestSha256 !==
      input.requirements.requirementsDigestSha256
    || input.assetWorkInputBinding.sourceBindings
      .selectedSceneBindingDigestSha256 !==
      binding.bindingDigestSha256
    || input.assetWorkInputBinding.sourceBindings
      .executionRequirementsDigestSha256 !==
      input.requirements.requirementsDigestSha256
    || input.assetWorkInputBinding.sourceBindings
      .timingBindingDigestSha256 !==
      input.timingBinding.timingBindingDigestSha256
    || input.requirements.sourceBindings
      .currentMasterTimingDigestSha256 !==
      sha256AuthorityValue(
        input.components.masterTimingPlan,
      )
    || input.timingBinding.sourceBindings
      .currentMasterTimingDigestSha256 !==
      sha256AuthorityValue(
        input.components.masterTimingPlan,
      )
    || input.requirements.sourceBindings
      .currentSoundSyncDigestSha256 !==
      sha256AuthorityValue(
        input.components.soundSyncTransitionTimingPlan,
      )
    || binding.selectedSceneCount !==
      input.requirements.scenes.length
    || binding.selectedSceneCount !==
      input.timingBinding.scenes.length
    || binding.selectedSceneCount !==
      input.assetWorkInputBinding.scenes.length
    || binding.deliberateNonUse !==
      (input.requirements.scenes.length === 0)
  ) {
    throw conflict(
      'Canonical Living Frame estimate, work, and asset projection source lineage is stale or inconsistent.',
    )
  }
}

function resolveProductEditLevel(
  editLevel:
    CanonicalPlanComponentsInput[
      'confirmedSettings'
    ]['editLevel'],
): ReEditProCanonicalEditLevel {
  if (
    editLevel === 'normal'
    || editLevel === 'ultra_premium'
  ) {
    return editLevel
  }
  return mapLegacyEditLevelToCanonical(
    editLevel as ReEditProLegacyEditLevel,
  )
}

function uniqueSorted<T extends string>(
  values: readonly T[],
): T[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right))
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const draft = { ...value }
  delete draft.projectionDigestSha256
  return draft
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value),
  )
}

function conflict(message: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    message,
    409,
    {
      requiredGate:
        'canonical_living_frame_estimate_work_asset_projection',
    },
  )
}
