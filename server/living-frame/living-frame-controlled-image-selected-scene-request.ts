import { createHash } from 'node:crypto'

import type {
  CanonicalCustomerEstimateAuthority,
} from '../../src/types/canonical-customer-estimate-authority'
import type {
  LivingFrameComponentPlan,
  LivingFrameScenePlan,
} from '../../src/types/living-frame'
import type {
  LivingFrameApprovedLineageBinding,
} from '../../src/types/living-frame-approved-lineage-binding'
import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import type {
  CanonicalLivingFrameWorkGraphProjection,
  CanonicalLivingFrameControlledIllustrationGenerationWorkItem,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import type {
  CanonicalLivingFrameControlledIllustrationCostWorkBinding,
} from '../../src/types/living-frame-controlled-illustration-cost-work-binding'
import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_STATE,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_VERSION,
  type LivingFrameControlledImageSelectedSceneRequest,
  type LivingFrameControlledImageSelectedSceneRequestAuthority,
  type LivingFrameControlledImageSelectedSceneRequestDraft,
  type LivingFrameControlledImageSelectedSceneRequestIssue,
  type LivingFrameControlledImageSelectedSceneRequestIssueCode,
  type LivingFrameControlledImageSelectedSceneRequestOpenGate,
  type LivingFrameControlledImageSelectedSceneRequestUnit,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'
import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import type {
  CanonicalLivingFrameEstimateWorkAssetProjection,
} from '../../src/types/living-frame-estimate-work-asset-projection'
import type {
  CanonicalLivingFrameExecutionRequirements,
} from '../../src/types/living-frame-execution-requirements'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  verifyLivingFrameApprovedLineageBindingDigest,
} from './living-frame-approved-lineage-binding'
import {
  verifyCanonicalLivingFrameWorkGraphProjection,
} from './canonical-living-frame-work-graph-projection'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u

const REFERENCE_CAPABILITIES = new Set([
  'reference_conditioned_illustration',
  'identity_conditioned_illustration',
])

const FULL_FRAME_COMPONENT_ROLES = new Set([
  'source_still',
  'opaque_background_plate',
  'reconstructed_background_plate',
])

const AUTHORITY_BOUNDARY:
  LivingFrameControlledImageSelectedSceneRequestAuthority =
  deepFreeze({
    selectedSceneRequestProjectionAuthority: true,
    selectedSceneAuthority: false,
    promptAuthority: false,
    visualContinuityPackAuthority: false,
    exactFrameAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    approvedWorkItemMutationAuthority: false,
    workGraphMutationAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    modelArtifactAuthority: false,
    artifactMountAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    actualCostAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameControlledImageSelectedSceneRequestInput {
  readonly requestBindingId: string
  readonly sceneId: string
  readonly approvedLineageBinding:
    LivingFrameApprovedLineageBinding
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly timingBinding:
    CanonicalLivingFrameTimingBinding
  readonly assetWorkInputBinding:
    CanonicalLivingFrameAssetWorkInputBinding
  readonly estimateWorkAssetProjection:
    CanonicalLivingFrameEstimateWorkAssetProjection
  readonly customerEstimateAuthority:
    CanonicalCustomerEstimateAuthority
  readonly controlledIllustrationCostWorkBinding:
    CanonicalLivingFrameControlledIllustrationCostWorkBinding
  readonly workGraphProjection:
    CanonicalLivingFrameWorkGraphProjection
  readonly components: CanonicalPlanComponentsInput
}

export class LivingFrameControlledImageSelectedSceneRequestError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledImageSelectedSceneRequestIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledImageSelectedSceneRequestIssue[],
  ) {
    super(
      'Living Frame controlled-image selected-scene request projection failed.',
    )
    this.name =
      'LivingFrameControlledImageSelectedSceneRequestError'
    this.issues = issues
  }
}

export function createLivingFrameControlledImageSelectedSceneRequest(
  input: CreateLivingFrameControlledImageSelectedSceneRequestInput,
): LivingFrameControlledImageSelectedSceneRequest {
  assertInput(input)
  if (
    !verifyLivingFrameApprovedLineageBindingDigest(
      input.approvedLineageBinding,
    )
    || input.approvedLineageBinding.bindingState !==
      'blocked_by_canonical_living_frame_component_admission'
    || input.approvedLineageBinding.metrics.projectedLayerCount < 1
    || input.approvedLineageBinding.metrics
      .workOutputCoveredLayerCount !==
        input.approvedLineageBinding.metrics.projectedLayerCount
    || input.approvedLineageBinding.metrics
      .assetManifestCoveredLayerCount !==
        input.approvedLineageBinding.metrics.projectedLayerCount
  ) throw invalid(
    'approved_lineage_invalid',
    '$.approvedLineageBinding',
  )
  if (!verifyCanonicalLivingFrameWorkGraphProjection({
    projection: input.workGraphProjection,
    publication: input.publication,
    requirements: input.requirements,
    timingBinding: input.timingBinding,
    assetWorkInputBinding: input.assetWorkInputBinding,
    estimateWorkAssetProjection:
      input.estimateWorkAssetProjection,
    customerEstimateAuthority:
      input.customerEstimateAuthority,
    controlledIllustrationCostWorkBinding:
      input.controlledIllustrationCostWorkBinding,
    components: input.components,
  })) throw invalid(
    'work_graph_invalid',
    '$.workGraphProjection',
  )
  assertSourceLineage(input)

  const scene = selectedScene(input)
  const workItem = generationWorkItem(input)
  const boundScene = input.assetWorkInputBinding.scenes.find(
    (candidate) => candidate.sceneId === input.sceneId,
  )
  const costScene =
    input.controlledIllustrationCostWorkBinding.scenes.find(
      (candidate) => candidate.sceneId === input.sceneId,
    )
  if (!boundScene || !costScene) {
    throw invalid('asset_intent_missing', '$.sceneId')
  }
  if (
    workItem.workItemKey !== costScene.workRequirementKey
    || workItem.expectedOutputs.length !==
      costScene.expectedOutputs.length
    || workItem.maxAttempts !== costScene.plannedAttemptCount
    || workItem.executionInput.pendingOperationAuthority
      .executableStructuredPayloadPresent !== false
  ) throw invalid(
    'generation_work_item_missing',
    '$.workGraphProjection.workItems',
  )

  const requestUnits =
    costScene.expectedOutputs.map((expectedOutput, order) => {
      const assetIntent = boundScene.assetIntents.find(
        (candidate) =>
          candidate.assetIntentId === expectedOutput.assetIntentId,
      )
      if (
        !assetIntent
        || (
          assetIntent.assetKind !==
            'generated_opaque_still_source'
          && assetIntent.assetKind !==
            'controlled_opaque_still_variation_source'
        )
      ) throw invalid(
        'asset_intent_missing',
        `$.assetWorkInputBinding.scenes.${input.sceneId}`,
      )
      const component = scene.components.find(
        (candidate) =>
          candidate.componentId === assetIntent.componentId,
      )
      if (!component) {
        throw invalid(
          'component_missing',
          `$.publication.binding.selectedComponent.scenePlans.${input.sceneId}`,
        )
      }
      const approvedOutputLineage =
        input.approvedLineageBinding.rendererLayerLineage.filter(
          (entry) =>
            entry.sceneId === input.sceneId
            && entry.projectedComponentId === component.componentId
            && entry.approvedWorkItemKey === workItem.workItemKey
            && entry.outputKey === expectedOutput.outputKey
            && entry.lineageState ===
              'covered_by_exact_approved_work_output_and_planned_asset',
        )
      if (approvedOutputLineage.length !== 1) {
        throw invalid(
          'approved_lineage_invalid',
          `$.approvedLineageBinding.rendererLayerLineage.${component.componentId}`,
        )
      }
      const output = workItem.expectedOutputs.find(
        (candidate) =>
          candidate.outputKey === expectedOutput.outputKey,
      )
      if (
        !output
        || output.artifactType !==
          'living_frame_generated_opaque_still_png'
        || output.contentType !== 'image/png'
      ) throw invalid(
        'generation_work_item_missing',
        '$.workGraphProjection.workItems',
      )
      return compileRequestUnit({
        order,
        scene,
        component,
        assetIntentId: assetIntent.assetIntentId,
        outputKey: output.outputKey,
        approvedWorkItemId:
          approvedOutputLineage[0]!.approvedWorkItemId!,
        workItemKey: workItem.workItemKey,
        approvedPlannedAssetManifestEntryId:
          approvedOutputLineage[0]!
            .plannedAssetManifestEntryId!,
        rendererLayerId:
          approvedOutputLineage[0]!.rendererLayerId,
        maximumSceneAttemptCount: workItem.maxAttempts,
        visualContinuityPackDigestSha256:
          input.publication.binding.sourceBindings
            .visualContinuityPackDigestSha256,
        outputFrameExpectationDigestSha256:
          input.publication.binding.sourceBindings
            .confirmedOutputFrameDigestSha256,
        outputFrame: readOutputFrame(input.components),
      })
    })

  if (requestUnits.length < 1) {
    throw invalid('request_unit_invalid', '$.requestUnits')
  }
  const blockedRequestUnitCount = requestUnits.filter(
    (unit) =>
      unit.requestUnitState ===
        'blocked_by_full_frame_generation_canvas_extension',
  ).length
  const openGateCodes =
    LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_OPEN_GATES
      .filter((gate) =>
        gate !==
          'full_frame_generation_canvas_extension_required_when_projected'
        || blockedRequestUnitCount > 0)

  const draft:
    LivingFrameControlledImageSelectedSceneRequestDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_CLASS,
    projectionState:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_STATE,
    requestBindingId: input.requestBindingId,
    canonicalScope: {
      ...input.workGraphProjection.identity,
      sceneId: input.sceneId,
    },
    sourceBindings: {
      approvedLineageBindingDigestSha256:
        input.approvedLineageBinding.bindingDigestSha256,
      approvedSnapshotId:
        input.approvedLineageBinding.sourceBindings
          .approvedSnapshotId,
      approvedSnapshotHashSha256:
        input.approvedLineageBinding.sourceBindings
          .approvedSnapshotHashSha256,
      selectedSceneBindingDigestSha256:
        input.publication.binding.bindingDigestSha256,
      executionRequirementsDigestSha256:
        input.requirements.requirementsDigestSha256,
      timingBindingDigestSha256:
        input.timingBinding.timingBindingDigestSha256,
      assetWorkInputBindingDigestSha256:
        input.assetWorkInputBinding.bindingDigestSha256,
      estimateWorkAssetProjectionDigestSha256:
        input.estimateWorkAssetProjection.projectionDigestSha256,
      customerEstimateAuthorityDigestSha256:
        input.customerEstimateAuthority.authorityDigestSha256,
      controlledIllustrationCostWorkBindingDigestSha256:
        input.controlledIllustrationCostWorkBinding
          .bindingDigestSha256,
      canonicalWorkGraphProjectionDigestSha256:
        input.workGraphProjection.projectionDigestSha256,
      selectedSceneContractDigestSha256: digest(scene),
      visualContinuityPackDigestSha256:
        input.publication.binding.sourceBindings
          .visualContinuityPackDigestSha256,
      outputFrameExpectationDigestSha256:
        input.publication.binding.sourceBindings
          .confirmedOutputFrameDigestSha256,
      currentMasterTimingDigestSha256:
        input.requirements.sourceBindings
          .currentMasterTimingDigestSha256,
    },
    selectedSceneSummary: {
      mode: scene.mode,
      sourceTruthMode: scene.sourceTruthMode,
      narrativePurposeCode: scene.narrativePurposeCode,
      visualVerb: scene.visualVerb,
      importance: scene.importance,
      generatedComponentCount: requestUnits.length,
    },
    operationExpectation: {
      canonicalToolId: 'comfyui',
      canonicalOperationId:
        'tool.comfyui.generate_controlled_image.v1',
      workItemType: 'generate_image_asset',
      workerType: 'gpu_ai_worker',
      accelerator: 'nvidia_l4',
      gpuCount: 1,
      exactModelManifestRoleCount: 5,
      modelArtifactsTravelInRequestBindings: false,
      oneRequestUnitProducesOneImage: true,
      sixCapabilityToolIdentityFanoutAllowed: false,
      fiveGpuCapabilityChargesAllowed: false,
      auraFaceRunsInsideGpuAttempt: false,
    },
    requestUnits,
    metrics: {
      requestUnitCount: requestUnits.length,
      readyRequestUnitCount:
        requestUnits.length - blockedRequestUnitCount,
      blockedRequestUnitCount,
      structureConditionedUnitCount:
        requestUnits.filter((unit) =>
          unit.controlPolicy.structureConditioningRequired).length,
      referenceConditionedUnitCount:
        requestUnits.filter((unit) =>
          unit.controlPolicy.referenceConditioningRequired).length,
      loraConditionedUnitCount:
        requestUnits.filter((unit) =>
          unit.controlPolicy.loraAdapterRequired).length,
      maximumPrivateInputImageCountPerUnit:
        Math.max(...requestUnits.map((unit) =>
          Number(unit.controlPolicy.structureConditioningRequired)
          + Number(unit.controlPolicy.referenceConditioningRequired))),
    },
    openGateCodes,
    authorityBoundary: AUTHORITY_BOUNDARY,
    currentApprovedSnapshotLineageRevalidated: true,
    currentCanonicalWorkGraphRevalidated: true,
    selectedSceneRequestProjectionImplemented: true,
    benchmarkRequestMaySubstituteForSelectedSceneRequest: false,
    executableComfyUiPromptIncluded: false,
    callerPromptPathUrlCommandCredentialOrModelChoiceAllowed:
      false,
    operationRegistered: false,
    dispatchGranted: false,
    workerLeaseCreated: false,
    actualCostReceiptCreated: false,
    assetCreated: false,
    productionReady: false,
  }
  assertProjectionSemantics(draft)
  assertSafe(draft)
  return deepFreeze({
    ...draft,
    requestBindingDigestSha256: digest(draft),
  })
}

export function verifyLivingFrameControlledImageSelectedSceneRequest(
  value: unknown,
  input: CreateLivingFrameControlledImageSelectedSceneRequestInput,
): boolean {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_VERSION
      || value.resultClass !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_CLASS
      || value.projectionState !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_STATE
      || typeof value.requestBindingDigestSha256 !== 'string'
      || !SHA256.test(value.requestBindingDigestSha256)
    ) return false
    const {
      requestBindingDigestSha256,
      ...draft
    } = value
    if (requestBindingDigestSha256 !== digest(draft)) return false
    return canonicalJson(value) === canonicalJson(
      createLivingFrameControlledImageSelectedSceneRequest(input),
    )
  } catch {
    return false
  }
}

function compileRequestUnit(input: {
  readonly order: number
  readonly scene: LivingFrameScenePlan
  readonly component: LivingFrameComponentPlan
  readonly assetIntentId: string
  readonly outputKey: string
  readonly approvedWorkItemId: string
  readonly workItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly rendererLayerId: string
  readonly maximumSceneAttemptCount: number
  readonly visualContinuityPackDigestSha256: string | null
  readonly outputFrameExpectationDigestSha256: string
  readonly outputFrame: {
    readonly widthPixels: number
    readonly heightPixels: number
  }
}): LivingFrameControlledImageSelectedSceneRequestUnit {
  const capabilities = [...new Set(
    input.component.capabilityKeys,
  )].sort()
  if (!capabilities.includes('still_image_generation_or_edit')) {
    throw invalid(
      'request_unit_invalid',
      `$.component.${input.component.componentId}.capabilityKeys`,
    )
  }
  const structureConditioningRequired =
    capabilities.includes('structure_conditioned_illustration')
  const referenceConditioningRequired =
    capabilities.some((capability) =>
      REFERENCE_CAPABILITIES.has(capability))
  const loraAdapterRequired =
    capabilities.includes('low_rank_adapter_training_or_loading')
  if (
    referenceConditioningRequired
    && input.visualContinuityPackDigestSha256 === null
  ) throw invalid(
    'continuity_pack_required',
    `$.component.${input.component.componentId}`,
  )
  const privateSlotKinds =
    compilePrivateSlotKinds({
      structureConditioningRequired,
      referenceConditioningRequired,
      loraAdapterRequired,
    })
  const requestUnitIdentity = {
    sceneId: input.scene.sceneId,
    componentId: input.component.componentId,
    assetIntentId: input.assetIntentId,
    outputKey: input.outputKey,
    approvedWorkItemId: input.approvedWorkItemId,
    workItemKey: input.workItemKey,
    approvedPlannedAssetManifestEntryId:
      input.approvedPlannedAssetManifestEntryId,
    rendererLayerId: input.rendererLayerId,
  }
  const requestUnitId =
    `lf-request-unit.${digest(requestUnitIdentity).slice(0, 40)}`
  const fullFrame =
    FULL_FRAME_COMPONENT_ROLES.has(input.component.role)
  const draft = {
    order: input.order,
    requestUnitId,
    requestUnitState: fullFrame
      ? 'blocked_by_full_frame_generation_canvas_extension'
      : 'ready_for_exact_operation_binding',
    sceneId: input.scene.sceneId,
    componentId: input.component.componentId,
    componentRole: input.component.role,
    assetIntentId: input.assetIntentId,
    outputKey: input.outputKey,
    approvedWorkItemId: input.approvedWorkItemId,
    approvedWorkItemKey: input.workItemKey,
    approvedPlannedAssetManifestEntryId:
      input.approvedPlannedAssetManifestEntryId,
    rendererLayerId: input.rendererLayerId,
    serverOwnedConditioningLocatorId:
      `lf-conditioning.${digest({
        requestUnitIdentity,
        policy:
          'living_frame_animation_aware_component_prompt_v1',
      }).slice(0, 40)}`,
    semanticDirectionDigestSha256: digest({
      mode: input.scene.mode,
      sourceTruthMode: input.scene.sourceTruthMode,
      narrativePurposeCode: input.scene.narrativePurposeCode,
      visualVerb: input.scene.visualVerb,
      importance: input.scene.importance,
      summary: input.scene.summary,
    }),
    componentDirectionDigestSha256: digest({
      componentId: input.component.componentId,
      role: input.component.role,
      focalRole: input.component.focalRole,
      summary: input.component.summary,
      depthBand: input.component.depthBand,
      transparencyExpectation:
        input.component.transparencyExpectation,
      provenanceExpectation:
        input.component.provenanceExpectation,
      capabilityKeys: capabilities,
      continuityRefIds: input.component.continuityRefIds,
    }),
    continuityDirectionDigestSha256:
      input.visualContinuityPackDigestSha256,
    activeCapabilityKeys: capabilities,
    privateSlotKinds,
    controlPolicy: {
      structureConditioningRequired,
      referenceConditioningRequired,
      loraAdapterRequired,
      controlImagePreparedOutsideComfyUi:
        structureConditioningRequired,
      referenceImageMustComeFromApprovedContinuityPack:
        referenceConditioningRequired,
      genericIpAdapterOnly: true,
      faceIdOrUnapprovedIdentityAdapterAllowed: false,
    },
    generationCanvas: {
      canvasClass: fullFrame
        ? 'full_frame_ratio_extension_required'
        : 'isolated_component_square_1024',
      widthPixels: 1024,
      heightPixels: 1024,
      finalOutputFrameExpectationDigestSha256:
        input.outputFrameExpectationDigestSha256,
      finalOutputFrameWidthPixels:
        input.outputFrame.widthPixels,
      finalOutputFrameHeightPixels:
        input.outputFrame.heightPixels,
      finalCanvasCreatedByComfyUi: false,
    },
    attemptPolicy: {
      oneImagePerAttempt: true,
      sharedSceneAttemptBudget: true,
      maximumSceneAttemptCount:
        input.maximumSceneAttemptCount,
      deterministicSeedDerivedServerSide: true,
      callerSeedAllowed: false,
    },
    downstreamPolicy: {
      generatedArtifactType:
        'living_frame_generated_opaque_still_png',
      stillAlphaPipelineRequired:
        input.component.transparencyExpectation !== 'opaque_plate',
      finalRenderMayUseOpaqueRectangle: false,
      aiVideoFallbackAllowed: false,
      remotionOwnsFinalComposition: true,
    },
    rawConditioningTextIncluded: false,
    imageBytesIncluded: false,
    modelBytesPathUrlOrFilenameIncluded: false,
  } as const
  return deepFreeze({
    ...draft,
    requestUnitDigestSha256: digest(draft),
  })
}

function compilePrivateSlotKinds(input: {
  readonly structureConditioningRequired: boolean
  readonly referenceConditioningRequired: boolean
  readonly loraAdapterRequired: boolean
}): readonly LivingFrameControlledSdxlBenchmarkRequestSlotKind[] {
  return [
    'base_checkpoint_artifact',
    ...(input.structureConditioningRequired
      ? ['controlnet_checkpoint_artifact'] as const
      : []),
    ...(input.loraAdapterRequired
      ? ['lora_adapter_artifact'] as const
      : []),
    ...(input.referenceConditioningRequired
      ? [
          'generic_ipadapter_checkpoint_artifact',
          'clip_vision_checkpoint_artifact',
        ] as const
      : []),
    'positive_conditioning_text',
    'negative_conditioning_text',
    ...(input.structureConditioningRequired
      ? ['control_image_artifact'] as const
      : []),
    ...(input.referenceConditioningRequired
      ? ['reference_image_artifact'] as const
      : []),
  ]
}

function selectedScene(
  input: CreateLivingFrameControlledImageSelectedSceneRequestInput,
): LivingFrameScenePlan {
  const scene =
    input.publication.binding.selectedComponent.scenePlans.find(
      (candidate) => candidate.sceneId === input.sceneId,
    )
  if (!scene) {
    throw invalid(
      'selected_scene_missing',
      '$.publication.binding.selectedComponent.scenePlans',
    )
  }
  return scene
}

function generationWorkItem(
  input: CreateLivingFrameControlledImageSelectedSceneRequestInput,
): CanonicalLivingFrameControlledIllustrationGenerationWorkItem {
  const candidates =
    input.workGraphProjection.workItems.filter(
      isControlledImageGenerationWorkItem,
    ).filter((item) =>
      item.executionInput.pendingOperationAuthority.sceneId ===
        input.sceneId)
  if (candidates.length !== 1) {
    throw invalid(
      'generation_work_item_missing',
      '$.workGraphProjection.workItems',
    )
  }
  return candidates[0]!
}

function isControlledImageGenerationWorkItem(
  item:
    CanonicalLivingFrameWorkGraphProjection['workItems'][number],
): item is CanonicalLivingFrameControlledIllustrationGenerationWorkItem {
  return item.workItemType === 'generate_image_asset'
    && item.workerClass ===
      'living_frame_operation_admission_pending_worker'
    && 'pendingOperationAuthority' in item.executionInput
}

function assertSourceLineage(
  input: CreateLivingFrameControlledImageSelectedSceneRequestInput,
): void {
  const scope = input.workGraphProjection.identity
  const approved = input.approvedLineageBinding
  const publication = input.publication.binding
  if (
    approved.sceneId !== input.sceneId
    || approved.canonicalScope.workspaceId !== scope.workspaceId
    || approved.canonicalScope.projectId !== scope.projectId
    || approved.canonicalScope.editSessionId !== scope.editSessionId
    || publication.identity.workspaceId !== scope.workspaceId
    || publication.identity.projectId !== scope.projectId
    || publication.identity.editSessionId !== scope.editSessionId
    || input.workGraphProjection.sourceBindings
      .selectedSceneBindingDigestSha256 !==
        publication.bindingDigestSha256
    || input.workGraphProjection.sourceBindings
      .executionRequirementsDigestSha256 !==
        input.requirements.requirementsDigestSha256
    || input.workGraphProjection.sourceBindings
      .timingBindingDigestSha256 !==
        input.timingBinding.timingBindingDigestSha256
    || input.workGraphProjection.sourceBindings
      .assetWorkInputBindingDigestSha256 !==
        input.assetWorkInputBinding.bindingDigestSha256
    || input.workGraphProjection.sourceBindings
      .estimateWorkAssetProjectionDigestSha256 !==
        input.estimateWorkAssetProjection.projectionDigestSha256
    || input.workGraphProjection.sourceBindings
      .customerEstimateAuthorityDigestSha256 !==
        input.customerEstimateAuthority.authorityDigestSha256
    || input.workGraphProjection.sourceBindings
      .controlledIllustrationCostWorkBindingDigestSha256 !==
        input.controlledIllustrationCostWorkBinding.bindingDigestSha256
    || input.workGraphProjection.sourceBindings
      .currentMasterTimingDigestSha256 !==
        input.requirements.sourceBindings
          .currentMasterTimingDigestSha256
  ) throw invalid('source_lineage_mismatch', '$')
}

function assertInput(
  input: CreateLivingFrameControlledImageSelectedSceneRequestInput,
): void {
  if (
    !isRecord(input)
    || !SAFE_ID.test(String(input.requestBindingId))
    || !SAFE_ID.test(String(input.sceneId))
  ) throw invalid('input_invalid', '$')
}

function readOutputFrame(
  components: CanonicalPlanComponentsInput,
): {
  readonly widthPixels: number
  readonly heightPixels: number
} {
  const outputFrame = components.confirmedSettings.outputFrame
  const widthPixels = Number(outputFrame.width)
  const heightPixels = Number(outputFrame.height)
  if (
    !Number.isInteger(widthPixels)
    || !Number.isInteger(heightPixels)
    || widthPixels < 64
    || heightPixels < 64
    || widthPixels > 16_384
    || heightPixels > 16_384
  ) throw invalid('input_invalid', '$.components.outputFrame')
  return { widthPixels, heightPixels }
}

function assertProjectionSemantics(
  draft: LivingFrameControlledImageSelectedSceneRequestDraft,
): void {
  const {
    selectedSceneRequestProjectionAuthority,
    ...delegatedAuthorities
  } = draft.authorityBoundary
  const blocked = draft.requestUnits.filter(
    (unit) =>
      unit.requestUnitState ===
        'blocked_by_full_frame_generation_canvas_extension',
  ).length
  const expectedOpenGates:
    LivingFrameControlledImageSelectedSceneRequestOpenGate[] =
    LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_OPEN_GATES
      .filter((gate) =>
        gate !==
          'full_frame_generation_canvas_extension_required_when_projected'
        || blocked > 0)
  if (
    draft.requestUnits.length < 1
    || new Set(
      draft.requestUnits.map((unit) => unit.requestUnitId),
    ).size !== draft.requestUnits.length
    || new Set(
      draft.requestUnits.map((unit) => unit.outputKey),
    ).size !== draft.requestUnits.length
    || draft.requestUnits.some((unit, order) =>
      unit.order !== order
      || unit.privateSlotKinds.length < 3
      || new Set(unit.privateSlotKinds).size !==
        unit.privateSlotKinds.length
      || unit.requestUnitDigestSha256 !==
        digest(withoutUnitDigest(unit)))
    || draft.metrics.requestUnitCount !== draft.requestUnits.length
    || draft.metrics.blockedRequestUnitCount !== blocked
    || draft.metrics.readyRequestUnitCount !==
      draft.requestUnits.length - blocked
    || draft.metrics.maximumPrivateInputImageCountPerUnit > 2
    || canonicalJson(draft.openGateCodes) !==
      canonicalJson(expectedOpenGates)
    || selectedSceneRequestProjectionAuthority !== true
    || Object.values(delegatedAuthorities).some(
      (value) => value !== false,
    )
    || draft.selectedSceneRequestProjectionImplemented !== true
    || draft.benchmarkRequestMaySubstituteForSelectedSceneRequest
      !== false
    || draft.executableComfyUiPromptIncluded !== false
    || draft.operationRegistered !== false
    || draft.dispatchGranted !== false
    || draft.workerLeaseCreated !== false
    || draft.actualCostReceiptCreated !== false
    || draft.assetCreated !== false
    || draft.productionReady !== false
  ) throw invalid('request_unit_invalid', '$')
}

function withoutUnitDigest(
  unit: LivingFrameControlledImageSelectedSceneRequestUnit,
): Omit<
  LivingFrameControlledImageSelectedSceneRequestUnit,
  'requestUnitDigestSha256'
> {
  return Object.fromEntries(
    Object.entries(unit).filter(
      ([key]) => key !== 'requestUnitDigestSha256',
    ),
  ) as Omit<
    LivingFrameControlledImageSelectedSceneRequestUnit,
    'requestUnitDigestSha256'
  >
}

function assertSafe(value: unknown): void {
  const serialized = canonicalJson(value)
  if (
    URL_LIKE.test(serialized)
    || SECRET_LIKE.test(serialized)
    || serialized.includes('/Users/')
    || serialized.includes('/Volumes/')
    || serialized.includes('/private/tmp/')
  ) throw invalid('unsafe_projection_forbidden', '$')
}

function invalid(
  code: LivingFrameControlledImageSelectedSceneRequestIssueCode,
  path: string,
): LivingFrameControlledImageSelectedSceneRequestError {
  if (
    !(LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_ISSUE_CODES as
      readonly string[]).includes(code)
  ) throw new Error('Unknown selected-scene request issue.')
  return new LivingFrameControlledImageSelectedSceneRequestError([
    { code, path },
  ])
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    )
  }
  return value
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  )
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    Object.values(value).forEach((child) => deepFreeze(child))
  }
  return value
}
