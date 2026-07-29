import type {
  LivingFrameApprovedLineageBinding,
} from '../../../src/types/living-frame-approved-lineage-binding'
import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../../src/types/living-frame-asset-work-input-binding'
import type {
  CanonicalLivingFrameExecutionRequirements,
} from '../../../src/types/living-frame-execution-requirements'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../../src/types/living-frame-timing-binding'
import {
  compileCanonicalLivingFrameEstimateWorkAssetProjection,
} from '../../living-frame/canonical-living-frame-estimate-work-asset-projection'
import {
  compileCanonicalLivingFrameWorkGraphProjection,
} from '../../living-frame/canonical-living-frame-work-graph-projection'
import {
  createLivingFrameComfyUiOperationAdmissionCandidate,
} from '../../living-frame/living-frame-comfyui-operation-admission-candidate'
import {
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding,
} from '../../living-frame/living-frame-controlled-illustration-cost-work-binding'
import {
  createLivingFrameControlledImageFullFrameRatioExtension,
} from '../../living-frame/living-frame-controlled-image-full-frame-ratio-extension'
import {
  compileLivingFrameControlledImageSelectedScenePrivateConditioningBinding,
} from '../../living-frame/living-frame-controlled-image-selected-scene-private-conditioning-binding'
import {
  createLivingFrameControlledImageSelectedSceneRequest,
} from '../../living-frame/living-frame-controlled-image-selected-scene-request'
import {
  compileLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding,
} from '../../living-frame/living-frame-controlled-image-selected-scene-visual-continuity-pack-binding'
import {
  compileCanonicalCustomerEstimateAuthority,
} from '../../services/canonical-customer-estimate-authority-service'
import {
  sha256AuthorityValue,
} from '../../services/private-edit-authority-store'
import {
  createLivingFrameSelectedSceneVisualContinuityPackBindingSmokeFixture,
  type LivingFrameSelectedSceneConditioningStyleFixtureProfile,
} from './living-frame-selected-scene-visual-continuity-pack-binding-fixture'

let sequence = 0

export async function createLivingFrameControlledImageSelectedScenePrivateConditioningBindingSmokeFixture(
  options?: {
    readonly conditioningStyleProfile?:
      LivingFrameSelectedSceneConditioningStyleFixtureProfile
  },
) {
  const suffix = nextId()
  const continuityFixture =
    await createLivingFrameSelectedSceneVisualContinuityPackBindingSmokeFixture({
      includeGeneratedBackgroundPlate: true,
      conditioningStyleProfile:
        options?.conditioningStyleProfile,
    })
  const visualContinuityPackBindingInput =
    continuityFixture.input
  const visualContinuityPackBinding =
    await compileLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding(
      visualContinuityPackBindingInput,
    )
  const publication:
    CanonicalLivingFrameSelectedScenePublication = {
      binding:
        visualContinuityPackBindingInput.selectedSceneBinding,
      admission:
        visualContinuityPackBindingInput.selectedSceneAdmission,
      semanticPlanProjection:
        visualContinuityPackBindingInput.semanticPlanProjection,
    }
  const components = visualContinuityPackBindingInput.components
  const scene =
    publication.binding.selectedComponent.scenePlans[0]!
  const requirementsDigestSha256 = hash({
    kind: 'conditioning-requirements',
    suffix,
  })
  const timingBindingDigestSha256 = hash({
    kind: 'conditioning-timing',
    suffix,
  })
  const requirements = {
    requirementsDigestSha256,
    sourceBindings: {
      selectedSceneBindingDigestSha256:
        publication.binding.bindingDigestSha256,
      currentMasterTimingDigestSha256:
        publication.binding.sourceBindings
          .currentMasterTimingDigestSha256,
      currentSoundSyncDigestSha256: hash(
        components.soundSyncTransitionTimingPlan,
      ),
    },
    scenes: [{
      sceneId: scene.sceneId,
      canonicalSegmentId:
        components.segments[0]!.segmentId,
      startFrame:
        components.segments[0]!.startFrame,
      endFrameExclusive:
        components.segments[0]!.endFrameExclusive,
      componentIds:
        scene.components.map((component) =>
          component.componentId),
      semanticTimingRequestIds: [],
      soundRequestIds: [],
      capabilityKeys:
        [...new Set(scene.components.flatMap((component) =>
          component.capabilityKeys))],
      miniSkillKeys: ['narrative_illustration'],
      requiredNamedWorkItemTypes: [],
      missingOperationCodes: [],
      requiredExternalGateCodes: [],
      qaExpectationCodes: [],
    }],
  } as unknown as
    CanonicalLivingFrameExecutionRequirements
  const timingBinding = {
    timingBindingDigestSha256,
    sourceBindings: {
      selectedSceneBindingDigestSha256:
        publication.binding.bindingDigestSha256,
      executionRequirementsDigestSha256:
        requirementsDigestSha256,
      currentMasterTimingDigestSha256:
        publication.binding.sourceBindings
          .currentMasterTimingDigestSha256,
    },
    scenes: [{
      sceneId: scene.sceneId,
      semanticPhaseBindings: [],
      soundCueBindings: [],
    }],
  } as unknown as CanonicalLivingFrameTimingBinding
  const generatedComponents = scene.components.filter(
    (component) =>
      component.capabilityKeys.includes(
        'still_image_generation_or_edit',
      ),
  )
  const assetWorkInputDraft = {
    identity: {
      workspaceId: publication.binding.identity.workspaceId,
      projectId: publication.binding.identity.projectId,
      editSessionId: publication.binding.identity.editSessionId,
    },
    readiness:
      'source_inputs_bound_operation_admission_pending' as const,
    sourceBindings: {
      selectedSceneBindingDigestSha256:
        publication.binding.bindingDigestSha256,
      executionRequirementsDigestSha256:
        requirementsDigestSha256,
      timingBindingDigestSha256,
    },
    scenes: [{
      sceneId: scene.sceneId,
      refinedRequiredNamedWorkItemTypes: [],
      assetIntents: generatedComponents.map(
        (component, order) => ({
          assetIntentId:
            `asset-intent.conditioning.${order}.${suffix}`,
          componentId: component.componentId,
          assetKind: component.role ===
            'opaque_background_plate'
            ? 'controlled_opaque_still_variation_source'
            : 'generated_opaque_still_source',
        }),
      ),
      namedWorkInputs: [],
    }],
    unresolvedPrimaryAssetIntentIds: [],
  }
  const assetWorkInputBinding = {
    ...assetWorkInputDraft,
    bindingDigestSha256: hash(assetWorkInputDraft),
  } as unknown as CanonicalLivingFrameAssetWorkInputBinding
  const estimateWorkAssetProjection =
    compileCanonicalLivingFrameEstimateWorkAssetProjection({
      publication,
      requirements,
      timingBinding,
      assetWorkInputBinding,
      components,
    })
  const customerEstimateAuthority =
    compileCanonicalCustomerEstimateAuthority({
      sourceEstimate: {
        lineItems: [],
        fallbackAllowanceCredits: 2,
        validForSeconds: 900,
      },
      components,
      livingFrameProjection:
        estimateWorkAssetProjection,
    }).authority
  const controlledIllustrationCostWorkBinding =
    compileCanonicalLivingFrameControlledIllustrationCostWorkBinding({
      assetWorkInputBinding,
      estimateWorkAssetProjection,
      customerEstimateAuthority,
    })
  const workGraphProjection =
    compileCanonicalLivingFrameWorkGraphProjection({
      publication,
      requirements,
      timingBinding,
      assetWorkInputBinding,
      estimateWorkAssetProjection,
      customerEstimateAuthority,
      controlledIllustrationCostWorkBinding,
      components,
    })
  const sceneId =
    publication.binding.selectedComponent.scenePlans[0]!.sceneId
  const approvedLineageBinding =
    createApprovedLineageBinding({
      suffix,
      sceneId,
      workGraphProjection,
      controlledIllustrationCostWorkBinding,
      assetWorkInputBinding,
      canonicalScope: {
        workspaceId: publication.binding.identity.workspaceId,
        projectId: publication.binding.identity.projectId,
        editSessionId: publication.binding.identity.editSessionId,
      },
    })
  const selectedSceneRequestInput = {
    requestBindingId:
      `living-frame.conditioning.selected-scene.${suffix}`,
    sceneId,
    approvedLineageBinding,
    publication,
    requirements,
    timingBinding,
    assetWorkInputBinding,
    estimateWorkAssetProjection,
    customerEstimateAuthority,
    controlledIllustrationCostWorkBinding,
    workGraphProjection,
    components,
  } as const
  const selectedSceneRequest =
    createLivingFrameControlledImageSelectedSceneRequest(
      selectedSceneRequestInput,
    )
  const admissionCandidate =
    await createLivingFrameComfyUiOperationAdmissionCandidate({
      candidateId:
        `living-frame.conditioning.comfyui.${suffix}`,
    })
  const fullFrameRatioExtensionInput = {
    extensionId:
      `living-frame.conditioning.full-frame.${suffix}`,
    selectedSceneRequest,
    selectedSceneRequestInput,
    admissionCandidate,
  } as const
  const fullFrameRatioExtension =
    await createLivingFrameControlledImageFullFrameRatioExtension(
      fullFrameRatioExtensionInput,
    )
  const input = {
    bindingId:
      `living-frame.private-conditioning.${suffix}`,
    selectedSceneRequest,
    selectedSceneRequestInput,
    fullFrameRatioExtension,
    fullFrameRatioExtensionInput,
    visualContinuityPackBinding,
    visualContinuityPackBindingInput,
  } as const
  const result =
    await compileLivingFrameControlledImageSelectedScenePrivateConditioningBinding(
      input,
    )
  return {
    input,
    result,
  }
}

function createApprovedLineageBinding(input: {
  readonly suffix: string
  readonly sceneId: string
  readonly workGraphProjection:
    ReturnType<
      typeof compileCanonicalLivingFrameWorkGraphProjection
    >
  readonly controlledIllustrationCostWorkBinding:
    ReturnType<
      typeof compileCanonicalLivingFrameControlledIllustrationCostWorkBinding
    >
  readonly assetWorkInputBinding:
    CanonicalLivingFrameAssetWorkInputBinding
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  }
}): LivingFrameApprovedLineageBinding {
  const costScene =
    input.controlledIllustrationCostWorkBinding.scenes.find(
      (scene) => scene.sceneId === input.sceneId,
    )
  const assetScene =
    input.assetWorkInputBinding.scenes.find(
      (scene) => scene.sceneId === input.sceneId,
    )
  const generationWorkItem =
    input.workGraphProjection.workItems.find(
      (workItem) =>
        workItem.workItemType === 'generate_image_asset',
    )
  if (!costScene || !assetScene || !generationWorkItem) {
    throw new Error(
      'Missing generated Living Frame work fixture lineage.',
    )
  }
  const rendererLayerLineage =
    costScene.expectedOutputs.map((output, order) => {
      const intent = assetScene.assetIntents.find(
        (candidate) =>
          candidate.assetIntentId === output.assetIntentId,
      )
      if (!intent) {
        throw new Error('Missing generated asset intent fixture.')
      }
      return {
        order,
        sceneId: input.sceneId,
        projectedComponentId: intent.componentId,
        rendererLayerId:
          `renderer-layer.${intent.componentId}.${input.suffix}`,
        approvedWorkItemId:
          `approved-work.${input.sceneId}.${input.suffix}`,
        approvedWorkItemKey:
          generationWorkItem.workItemKey,
        outputKey: output.outputKey,
        plannedAssetManifestEntryId:
          `asset-manifest.${intent.componentId}.${input.suffix}`,
        required: true,
        previewPlaceholderAllowed: false,
        lineageState:
          'covered_by_exact_approved_work_output_and_planned_asset' as const,
      }
    })
  const digestCharacter = input.suffix.padEnd(64, '0').slice(0, 64)
  const sourceDigest = (name: string) => hash({
    name,
    suffix: digestCharacter,
  })
  const draft = {
    contractVersion:
      'living-frame-approved-lineage-binding-v1' as const,
    bindingClass:
      'controlled_non_executable_approved_snapshot_lineage_binding' as const,
    sceneId: input.sceneId,
    canonicalScope: input.canonicalScope,
    sourceBindings: {
      approvedSnapshotId:
        `snapshot-lf-conditioning-${input.suffix}`,
      approvedSnapshotHashSha256:
        sourceDigest('approved-snapshot'),
      approvedPlanId:
        `plan-lf-conditioning-${input.suffix}`,
      approvedPlanVersion: 1,
      approvedPlanHashSha256:
        sourceDigest('approved-plan'),
      approvedWorkGraphHashSha256:
        sourceDigest('approved-work-graph'),
      approvedTimingHashSha256:
        sourceDigest('approved-timing'),
      approvedAssetManifestHashSha256:
        sourceDigest('approved-asset-manifest'),
      canonicalRendererPlanRefSha256:
        sourceDigest('canonical-renderer-ref'),
      canonicalRendererPlanDigestSha256:
        sourceDigest('canonical-renderer'),
      rendererPlanBindingDigestSha256:
        sourceDigest('renderer-binding'),
      choreographyBindingDigestSha256:
        sourceDigest('choreography-binding'),
    },
    rendererLayerLineage,
    bindingState:
      'blocked_by_canonical_living_frame_component_admission' as const,
    openGateCodes: [
      'canonical_artifact_qa_required',
      'canonical_living_frame_choreography_binding_component_ref_required',
      'canonical_living_frame_renderer_binding_component_ref_required',
      'canonical_private_remotion_review_required',
      'canonical_renderer_layer_extension_required',
      'canonical_selected_living_frame_scene_component_ref_required',
    ] as const,
    metrics: {
      projectedLayerCount: rendererLayerLineage.length,
      workOutputCoveredLayerCount: rendererLayerLineage.length,
      assetManifestCoveredLayerCount: rendererLayerLineage.length,
      requiredAssetCount: rendererLayerLineage.length,
      placeholderAllowedAssetCount: 0,
    },
    authorityBoundary: {
      controlledLineageObservationOnly: true as const,
      selectedSceneAuthority: false as const,
      masterTimingAuthority: false as const,
      exactFrameAuthority: false as const,
      soundSyncAuthority: false as const,
      estimateAuthority: false as const,
      costAuthority: false as const,
      approvalAuthority: false as const,
      snapshotAuthority: false as const,
      assetManifestMutationAuthority: false as const,
      qaApprovalAuthority: false as const,
      providerAuthority: false as const,
      toolRouteAuthority: false as const,
      workGraphMutationAuthority: false as const,
      queueAuthority: false as const,
      remotionExecutionAuthority: false as const,
      privateReviewAuthority: false as const,
      runtimePromotionAuthority: false as const,
      productionAuthority: false as const,
    },
    canonicalApprovedSnapshotWasReadByRegisteredServerPort:
      true as const,
    existingCanonicalSnapshotRemainsImmutable: true as const,
    existingCanonicalWorkGraphRemainsAuthority: true as const,
    existingCanonicalAssetManifestRemainsAuthority: true as const,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
      false as const,
    containsProviderToolJobQueueCostOrCommercialRoute:
      false as const,
    containsExecutableCodeOrCommands: false as const,
    subjectSpecificRouting: false as const,
  }
  return {
    ...draft,
    bindingDigestSha256: hash(draft),
  }
}

function hash(value: unknown): string {
  return sha256AuthorityValue(value)
}

function nextId(): string {
  sequence += 1
  return String(sequence).padStart(3, '0')
}
