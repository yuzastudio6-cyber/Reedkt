import type {
  CanonicalLivingFrameAssetWorkInputBinding,
  CanonicalLivingFrameNamedWorkOperationClass,
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
  type CanonicalLivingFrameProjectedUnreleasedToolEstimateLineItem,
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
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import {
  resolveCompleteProfessionalToolOperationSpec,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import {
  getCanonicalSam2ModelArtifactRequirementSet,
} from '../model-artifacts/canonical-sam2-model-artifact-requirements'
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
  readonly operationClass:
    CanonicalLivingFrameNamedWorkOperationClass
  readonly toolId: CanonicalLivingFrameProjectedToolId
  readonly operationId: string
  readonly costAdmission:
    | 'registered_production_tool'
    | 'unreleased_canonical_tool_candidate'
  readonly label: string
  readonly executionPlacement:
    CanonicalLivingFrameProjectedExecutionPlacement
  readonly cpuFallbackAllowed: boolean
  readonly expectedOutputs: readonly {
    readonly outputSuffix: string
    readonly artifactType: string
    readonly assetRole: 'processed' | 'qa'
    readonly contentType:
      | 'application/json'
      | 'image/png'
      | 'video/mp4'
      | 'video/x-matroska'
  }[]
}

const WORK_PROJECTION_PROFILES: Readonly<
  Partial<
    Record<
      CanonicalLivingFrameNamedWorkOperationClass,
      WorkProjectionProfile
    >
  >
> = Object.freeze({
  remove_still_image_background: {
    operationClass: 'remove_still_image_background',
    toolId: 'rembg',
    operationId:
      'tool.rembg.remove_image_background.v1',
    costAdmission: 'registered_production_tool',
    label: 'Living Frame alpha mask preparation',
    executionPlacement: 'google_cloud_run_gpu',
    cpuFallbackAllowed: false,
    expectedOutputs: [{
      outputSuffix: 'output',
      artifactType: 'living_frame_alpha_mask_png',
      assetRole: 'processed',
      contentType: 'image/png',
    }],
  },
  prepare_temporal_source_video: {
    operationClass: 'prepare_temporal_source_video',
    toolId: 'ffmpeg',
    operationId:
      'tool.ffmpeg.execute_approved_media_recipe.v1',
    costAdmission: 'registered_production_tool',
    label: 'Living Frame temporal source-video preparation',
    executionPlacement: 'private_cpu_worker',
    cpuFallbackAllowed: true,
    expectedOutputs: [{
      outputSuffix: 'output',
      artifactType:
        'living_frame_temporal_source_video_mp4',
      assetRole: 'processed',
      contentType: 'video/mp4',
    }],
  },
  temporal_video_subject_segmentation_and_tracking: {
    operationClass:
      'temporal_video_subject_segmentation_and_tracking',
    toolId: 'sam2',
    operationId:
      'tool.sam2.segment_and_track_subject.v1',
    costAdmission: 'unreleased_canonical_tool_candidate',
    label: 'Living Frame temporal subject mask tracking',
    executionPlacement: 'google_cloud_run_gpu',
    cpuFallbackAllowed: false,
    expectedOutputs: [{
      outputSuffix: 'mask-sequence',
      artifactType:
        'living_frame_temporal_subject_mask_sequence_ffv1_mkv',
      assetRole: 'processed',
      contentType: 'video/x-matroska',
    }, {
      outputSuffix: 'analysis',
      artifactType:
        'living_frame_temporal_subject_tracking_analysis_json',
      assetRole: 'processed',
      contentType: 'application/json',
    }, {
      outputSuffix: 'qa',
      artifactType:
        'living_frame_temporal_subject_mask_qa_json',
      assetRole: 'qa',
      contentType: 'application/json',
    }],
  },
  prepare_straight_alpha_component: {
    operationClass: 'prepare_straight_alpha_component',
    toolId: 'sharp',
    operationId:
      'tool.sharp.prepare_approved_image_asset.v1',
    costAdmission: 'registered_production_tool',
    label: 'Living Frame component image preparation',
    executionPlacement: 'private_render_worker',
    cpuFallbackAllowed: true,
    expectedOutputs: [{
      outputSuffix: 'output',
      artifactType: 'living_frame_component_rgba_png',
      assetRole: 'processed',
      contentType: 'image/png',
    }],
  },
  reconstruct_background_plate: {
    operationClass: 'reconstruct_background_plate',
    toolId: 'openimageio',
    operationId:
      'tool.openimageio.process_image_sequence.v1',
    costAdmission: 'registered_production_tool',
    label: 'Living Frame background plate reconstruction',
    executionPlacement: 'private_cpu_worker',
    cpuFallbackAllowed: true,
    expectedOutputs: [{
      outputSuffix: 'output',
      artifactType: 'living_frame_background_plate_png',
      assetRole: 'processed',
      contentType: 'image/png',
    }],
  },
  compile_remotion_layer: {
    operationClass: 'compile_remotion_layer',
    toolId: 'remotion',
    operationId:
      'tool.remotion.render_approved_composition.v1',
    costAdmission: 'registered_production_tool',
    label: 'Living Frame Remotion layer preparation',
    executionPlacement: 'private_render_worker',
    cpuFallbackAllowed: true,
    expectedOutputs: [{
      outputSuffix: 'output',
      artifactType: 'living_frame_remotion_layer_manifest',
      assetRole: 'processed',
      contentType: 'application/json',
    }],
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
  const productionToolProfiles = listProductionToolProfiles()
  assertProductionToolRegistrySemanticIntegrity(
    productionToolProfiles,
  )
  const observedProductionToolRegistryCount =
    productionToolProfiles.length
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
      const workKeyByInputKey = new Map(
        assetWorkScene.namedWorkInputs.map((workInput) => [
          workInput.workInputKey,
          `${sceneKey}-${workInput.operationClass.replaceAll('_', '-')}-${sha256AuthorityValue(workInput.workInputKey).slice(0, 8)}`,
        ]),
      )
      const workRequirements =
        assetWorkScene.namedWorkInputs.map((workInput) =>
          compileWorkRequirement({
            scene,
            timingScene,
            workInput,
            workKeyByInputKey,
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
        : projectedEstimateLineItems.some((line) =>
            line.costOwnerClass ===
              'canonical_unreleased_tool_candidate')
          ? 'requirements_projected_unreleased_cost_and_execution_admission_pending'
          : 'requirements_projected_execution_admission_pending',
      scenes,
      metrics: {
        selectedSceneCount: scenes.length,
        projectedEstimateLineItemCount:
          projectedEstimateLineItems.length,
        projectedNamedWorkItemCount:
          projectedWorkRequirements.length,
        projectedExpectedAssetCount:
          projectedWorkRequirements.reduce(
            (total, work) =>
              total + work.expectedOutputs.length,
            0,
          ),
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
        observedProductionToolRegistryCount,
        productionToolRegistryCountIsProductCap: false,
        productionToolRegistrySemanticIntegrityVerified: true,
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
      createsProductionToolIdentity: false,
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
  readonly workKeyByInputKey:
    ReadonlyMap<string, string>
}): CanonicalLivingFrameProjectedWorkRequirement {
  const profile =
    WORK_PROJECTION_PROFILES[
      input.workInput.operationClass
    ]
  if (!profile) {
    throw conflict(
      `Canonical Living Frame operation class ${input.workInput.operationClass} has no admitted canonical cost and asset projection.`,
    )
  }
  assertExactToolOperation(profile)
  const workItemKey =
    input.workKeyByInputKey.get(
      input.workInput.workInputKey,
    )
  if (!workItemKey) {
    throw conflict(
      'Canonical Living Frame named work projection lost its deterministic work-item key.',
    )
  }
  const dependencyWorkItemKeys =
    input.workInput.dependencyNamedWorkInputKeys.flatMap(
      (dependencyInputKey) => {
        const dependency =
          input.workKeyByInputKey.get(
            dependencyInputKey,
          )
        return dependency ? [dependency] : []
      },
    )
  if (
    dependencyWorkItemKeys.length !==
      input.workInput.dependencyNamedWorkInputKeys.length
  ) {
    throw conflict(
      'Canonical Living Frame named work projection lost an exact dependency work-input key.',
    )
  }
  return {
    workInputKey: input.workInput.workInputKey,
    workItemKey,
    sceneId: input.scene.sceneId,
    workItemType: input.workInput.workItemType,
    operationClass: input.workInput.operationClass,
    outputAssetKinds: [
      ...input.workInput.outputAssetKinds,
    ],
    dependencyWorkInputKeys: [
      ...input.workInput.dependencyNamedWorkInputKeys,
    ],
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
    expectedOutputs: compileExpectedOutputs({
      scene: input.scene,
      timingScene: input.timingScene,
      workItemKey,
      profile,
    }),
    currentRuntimeAdmission:
      profile.operationClass ===
          'prepare_temporal_source_video'
        || profile.operationClass ===
          'temporal_video_subject_segmentation_and_tracking'
        ? 'blocked_until_temporal_source_recipe_and_sam2_model_runtime_are_admitted'
        : 'blocked_until_real_dependency_input_operation_is_admitted',
    workGraphMutationAuthorized: false,
    executablePayloadPresent: false,
  }
}

function assertProductionToolRegistrySemanticIntegrity(
  profiles: ReturnType<typeof listProductionToolProfiles>,
): void {
  const declaredToolIds = [...PRODUCTION_TOOL_IDS]
  const profileToolIds = profiles.map((profile) => profile.toolId)
  const declaredToolIdSet = new Set<string>(declaredToolIds)
  const profileToolIdSet = new Set<string>(profileToolIds)
  if (
    declaredToolIds.length === 0
    || declaredToolIdSet.size !== declaredToolIds.length
    || profileToolIdSet.size !== profileToolIds.length
    || profileToolIds.length !== declaredToolIds.length
    || declaredToolIds.some((toolId) => !profileToolIdSet.has(toolId))
    || profileToolIds.some((toolId) => !declaredToolIdSet.has(toolId))
  ) {
    throw conflict(
      'Canonical Living Frame projection refused a production-tool registry with duplicate identities or incomplete profile coverage.',
    )
  }
}

function compileExpectedOutputs(input: {
  readonly scene:
    CanonicalLivingFrameExecutionRequirements['scenes'][number]
  readonly timingScene:
    CanonicalLivingFrameTimingBinding['scenes'][number]
  readonly workItemKey: string
  readonly profile: WorkProjectionProfile
}): CanonicalLivingFrameProjectedExpectedOutput[] {
  const timingIds = uniqueSorted([
    ...input.scene.semanticTimingRequestIds,
    ...input.scene.soundRequestIds,
    ...input.timingScene.semanticPhaseBindings.map(
      (binding) => binding.timingRequestId,
    ),
    ...input.timingScene.soundCueBindings.map(
      (binding) => binding.soundRequestId,
    ),
  ])
  const rendererLayerIds = uniqueSorted(
    input.scene.componentIds,
  )
  return input.profile.expectedOutputs.map((output) => ({
    outputKey:
      `${input.workItemKey}-${output.outputSuffix}`,
    artifactType: output.artifactType,
    assetRole: output.assetRole,
    required: true,
    previewPlaceholderAllowed: false,
    contentType: output.contentType,
    segmentIds: [input.scene.canonicalSegmentId],
    timingIds,
    rendererLayerIds,
    assetManifestEntryRequiredAfterApproval: true,
  }))
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
  const profile =
    WORK_PROJECTION_PROFILES[
      input.workRequirement.operationClass
    ]
  if (!profile) {
    throw conflict(
      'Canonical Living Frame cost projection lost its exact operation-class profile.',
    )
  }
  if (
    profile.costAdmission ===
      'unreleased_canonical_tool_candidate'
  ) {
    return compileUnreleasedToolEstimateLineItem({
      sceneId: input.sceneId,
      workIndex: input.workIndex,
      workRequirement: input.workRequirement,
      profile,
    })
  }
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

function compileUnreleasedToolEstimateLineItem(input: {
  readonly sceneId: string
  readonly workIndex: number
  readonly workRequirement:
    CanonicalLivingFrameProjectedWorkRequirement
  readonly profile: WorkProjectionProfile
}): CanonicalLivingFrameProjectedUnreleasedToolEstimateLineItem {
  if (
    input.profile.toolId !== 'sam2'
    || input.profile.operationId !==
      'tool.sam2.segment_and_track_subject.v1'
    || input.workRequirement.costOwnerToolId !== 'sam2'
    || input.workRequirement.costOwnerOperationId !==
      'tool.sam2.segment_and_track_subject.v1'
  ) {
    throw conflict(
      'Canonical Living Frame unreleased cost admission is limited to the exact SAM2 temporal operation.',
    )
  }
  return {
    lineKey:
      `${input.workRequirement.workItemKey}-estimate-${String(input.workIndex + 1).padStart(2, '0')}`,
    label: input.profile.label,
    category: 'living_frame',
    estimatedCredits: 0,
    removable: false,
    sceneId: input.sceneId,
    costOwnerClass:
      'canonical_unreleased_tool_candidate',
    workItemType: input.workRequirement.workItemType,
    costOwnerToolId: 'sam2',
    costOwnerOperationId:
      'tool.sam2.segment_and_track_subject.v1',
    controlledIllustrationCostComponentId: null,
    activeControlledIllustrationCapabilityIds: [],
    executionPlacement:
      input.workRequirement.executionPlacement,
    cpuFallbackAllowed: false,
    costRange: {
      lowCredits: 0,
      expectedCredits: 0,
      highCredits: 0,
      lowInternalCostMicros: 0,
      expectedInternalCostMicros: 0,
      highInternalCostMicros: 0,
      riskLevel: 'high',
      rateCardVersion:
        'unreleased-sam2-runtime-cost-admission-pending',
      serviceFeeIncluded: false,
    },
    exactFiftyToolRegistryMember: false,
    operationContractObserved: false,
    actualAttemptCostEvidenceRequired: true,
    productionRateAuthority: false,
    runtimeCostAdmissionRequired: true,
    customerEstimateEligibleBeforeCostAdmission: false,
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
  if (
    profile.costAdmission ===
      'unreleased_canonical_tool_candidate'
  ) {
    const requirement =
      getCanonicalSam2ModelArtifactRequirementSet()
    if (
      profile.operationClass !==
        'temporal_video_subject_segmentation_and_tracking'
      || profile.toolId !== requirement.approvedToolId
      || profile.operationId !==
        requirement.approvedOperationId
      || requirement.boundaries.runtimeAuthority
      || requirement.boundaries.productionReady
      || !requirement.summary.googleCloudRunGpuRequired
      || requirement.summary.cpuFallbackAllowed
    ) {
      throw conflict(
        'Canonical Living Frame SAM2 projection lost its exact non-executable model-artifact requirement.',
      )
    }
    return
  }
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
