import assert from 'node:assert/strict'

import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import type {
  LivingFrameCharacterAnimationSuitabilityEvidence,
} from '../../src/types/living-frame-character-animation-route'
import type {
  LivingFrameCompleteCharacterKeyposeControlledImageBinding,
} from '../../src/types/living-frame-complete-character-keypose-controlled-image-binding'
import type {
  LivingFrameCompleteCharacterKeyposeInput,
} from '../../src/types/living-frame-complete-character-keypose-plan'
import {
  compileCanonicalLivingFrameEstimateWorkAssetProjection,
} from '../living-frame/canonical-living-frame-estimate-work-asset-projection'
import {
  compileCanonicalLivingFrameWorkGraphProjection,
} from '../living-frame/canonical-living-frame-work-graph-projection'
import {
  compileLivingFrameAi2dCharacterMotionStrategy,
} from '../living-frame/living-frame-ai-2d-character-motion'
import {
  compileLivingFrameCharacterAnimationRouteDecision,
} from '../living-frame/living-frame-character-animation-route'
import {
  compileLivingFrameCharacterControlledPreparation,
} from '../living-frame/living-frame-character-controlled-preparation'
import {
  compileLivingFrameCompleteCharacterKeyposeControlledImageBinding,
  type CreateLivingFrameCompleteCharacterKeyposeControlledImageBindingInput,
  LivingFrameCompleteCharacterKeyposeControlledImageBindingError,
  verifyLivingFrameCompleteCharacterKeyposeControlledImageBinding,
} from '../living-frame/living-frame-complete-character-keypose-controlled-image-binding'
import {
  compileLivingFrameCompleteCharacterKeyposePlan,
  type CreateLivingFrameCompleteCharacterKeyposePlanInput,
} from '../living-frame/living-frame-complete-character-keypose-plan'
import {
  createLivingFrameComfyUiOperationAdmissionCandidate,
} from '../living-frame/living-frame-comfyui-operation-admission-candidate'
import {
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding,
} from '../living-frame/living-frame-controlled-illustration-cost-work-binding'
import {
  createLivingFrameControlledImageFullFrameRatioExtension,
} from '../living-frame/living-frame-controlled-image-full-frame-ratio-extension'
import {
  createLivingFrameControlledImageSelectedSceneRequest,
} from '../living-frame/living-frame-controlled-image-selected-scene-request'
import {
  compileCanonicalCustomerEstimateAuthority,
} from '../services/canonical-customer-estimate-authority-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  actionChoreographyTestInput,
} from './living-frame-character-action-choreography-test-fixture'
import {
  livingFrameControlledImageSelectedSceneSmokeInput,
} from './living-frame-controlled-image-selected-scene-request-smoke'

const source =
  livingFrameControlledImageSelectedSceneSmokeInput
const primaryComponent = source.publication.binding
  .selectedComponent.scenePlans[0]!.components.find(
    (component) => component.role === 'primary_subject',
  )!
const baseAssetScene =
  source.assetWorkInputBinding.scenes[0]!
const keyposeRoles = [
  'start',
  'anticipation',
  'contact',
  'settle',
] as const
const keyposeAssetIntents = keyposeRoles.map(
  (role) => ({
    assetIntentId: `asset-lf-keypose-${role}`,
    componentId: primaryComponent.componentId,
    assetKind:
      'generated_opaque_still_source' as const,
  }),
)
const plateIntent = baseAssetScene.assetIntents.find(
  (intent) => intent.componentId !== primaryComponent.componentId,
)!
const assetWorkInputBinding = {
  ...source.assetWorkInputBinding,
  bindingDigestSha256: 'b'.repeat(64),
  scenes: [{
    ...baseAssetScene,
    assetIntents: [
      ...keyposeAssetIntents,
      plateIntent,
    ],
  }],
} as unknown as CanonicalLivingFrameAssetWorkInputBinding

const estimateWorkAssetProjection =
  compileCanonicalLivingFrameEstimateWorkAssetProjection({
    publication: source.publication,
    requirements: source.requirements,
    timingBinding: source.timingBinding,
    assetWorkInputBinding,
    components: source.components,
  })
const customerEstimateAuthority =
  compileCanonicalCustomerEstimateAuthority({
    sourceEstimate: {
      lineItems: [],
      fallbackAllowanceCredits: 4,
      validForSeconds: 900,
    },
    components: source.components,
    livingFrameProjection:
      estimateWorkAssetProjection,
  }).authority
const costWorkBinding =
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding({
    assetWorkInputBinding,
    estimateWorkAssetProjection,
    customerEstimateAuthority,
  })
const workGraphProjection =
  compileCanonicalLivingFrameWorkGraphProjection({
    publication: source.publication,
    requirements: source.requirements,
    timingBinding: source.timingBinding,
    assetWorkInputBinding,
    estimateWorkAssetProjection,
    customerEstimateAuthority,
    controlledIllustrationCostWorkBinding:
      costWorkBinding,
    components: source.components,
  })
const costScene = costWorkBinding.scenes[0]!
const approvedLineageSource =
  source.approvedLineageBinding
const rendererLayerLineage =
  costScene.expectedOutputs.map((output, order) => {
    const intent = assetWorkInputBinding.scenes[0]!
      .assetIntents.find((candidate) =>
        candidate.assetIntentId === output.assetIntentId)!
    return {
      order,
      sceneId: source.sceneId,
      projectedComponentId: intent.componentId,
      rendererLayerId:
        `renderer-layer-${output.assetIntentId}`,
      approvedWorkItemId:
        'approved-work-lf-keypose-sequence',
      approvedWorkItemKey:
        costScene.workRequirementKey,
      outputKey: output.outputKey,
      plannedAssetManifestEntryId:
        `manifest-${output.assetIntentId}`,
      required: true,
      previewPlaceholderAllowed: false,
      lineageState:
        'covered_by_exact_approved_work_output_and_planned_asset' as const,
    }
  })
const approvedLineageDraft = {
  ...approvedLineageSource,
  rendererLayerLineage,
  metrics: {
    projectedLayerCount: rendererLayerLineage.length,
    workOutputCoveredLayerCount:
      rendererLayerLineage.length,
    assetManifestCoveredLayerCount:
      rendererLayerLineage.length,
    requiredAssetCount: rendererLayerLineage.length,
    placeholderAllowedAssetCount: 0,
  },
}
delete (approvedLineageDraft as {
  bindingDigestSha256?: string
}).bindingDigestSha256
const approvedLineageBinding = {
  ...approvedLineageDraft,
  bindingDigestSha256:
    sha256AuthorityValue(approvedLineageDraft),
}
const selectedSceneRequestInput = {
  ...source,
  requestBindingId:
    'living-frame.selected-scene-keyposes.001',
  approvedLineageBinding,
  assetWorkInputBinding,
  estimateWorkAssetProjection,
  customerEstimateAuthority,
  controlledIllustrationCostWorkBinding:
    costWorkBinding,
  workGraphProjection,
}
const selectedSceneRequest =
  createLivingFrameControlledImageSelectedSceneRequest(
    selectedSceneRequestInput,
  )
const primaryRequestUnits =
  selectedSceneRequest.requestUnits.filter((unit) =>
    unit.componentId === primaryComponent.componentId)
assert.equal(primaryRequestUnits.length, 4)

const admissionCandidate =
  await createLivingFrameComfyUiOperationAdmissionCandidate({
    candidateId:
      'living-frame.comfyui.action-keyposes.001',
  })
const fullFrameRatioExtensionInput = {
  extensionId:
    'living-frame.full-frame-ratio.action-keyposes.001',
  selectedSceneRequest,
  selectedSceneRequestInput,
  admissionCandidate,
} as const
const fullFrameRatioExtension =
  await createLivingFrameControlledImageFullFrameRatioExtension(
    fullFrameRatioExtensionInput,
  )
const sourceArtifactId =
  'artifact.character.complete-action-source.v1'
const routeDecision =
  compileLivingFrameCharacterAnimationRouteDecision(
    routeEvidence(sourceArtifactId),
  )
assert.equal(
  routeDecision.decision.selectedRoute,
  'comfyui_controlled_keyposes',
)
const controlledPreparationInput = {
  candidateId:
    'living-frame.character-action-keyposes.001',
  routeDecision,
  selectedSceneRequest,
  selectedSceneRequestInput,
  fullFrameRatioExtension,
  fullFrameRatioExtensionInput,
} as const
const controlledPreparation =
  await compileLivingFrameCharacterControlledPreparation(
    controlledPreparationInput,
  )
assert.equal(
  controlledPreparation.metrics.anchorKeyposeUnitCount,
  4,
)

const strategy =
  compileLivingFrameAi2dCharacterMotionStrategy({
    evidenceId: 'evidence.action-keyposes.v1',
    sceneId: source.sceneId,
    componentId: primaryComponent.componentId,
    sourceArtifactId,
    illustrativeNotArchivalEvidence: true,
    requestedMotionMagnitude: 'large_pose_change',
    requestedActionSummary:
      'The character anticipates, grips the prop, makes contact, and settles.',
    completeCharacterReferenceAvailable: true,
    styleReferenceAvailable: true,
    poseControlAvailable: true,
    requiresNewPixelsOrHiddenAnatomy: true,
    continuousNaturalMotionRequired: false,
    restrainedRigidMotionPreservesSilhouette: false,
    professionallyAuthoredOpenToonzRigAvailable: false,
    professionallyAuthoredBlenderRigAvailable: false,
    visibleJointHardwarePresent: false,
    jointSeamsConcealedAcrossPoseRange: false,
    anatomicalProportionsReviewedAcrossPoseRange: false,
    handPropAttachmentReviewedAcrossPoseRange: false,
    secondaryPartsAnchoredAcrossPoseRange: false,
    protectedFaceAndIdentityRegionsDefined: true,
    priorRejectedVisualProofRefs: [
      'proof.generic-blender-character.visual-rejected.v1',
    ],
    rawChatPromptPathUrlModelCodeOrBytesIncluded: false,
  })
const keyposeInputs:
  readonly LivingFrameCompleteCharacterKeyposeInput[] =
  primaryRequestUnits.map((requestUnit, order) => ({
    order,
    role: keyposeRoles[order]!,
    poseControlArtifactId:
      `artifact.pose-control.${keyposeRoles[order]}.v1`,
    poseControlDigestSha256:
      String(order + 2).repeat(64),
    approvedWorkItemId:
      requestUnit.approvedWorkItemId,
    plannedAssetManifestEntryId:
      requestUnit.approvedPlannedAssetManifestEntryId,
    outputKey: requestUnit.outputKey,
  }))
const keyposePlanInput = {
  planId: 'plan.character-action-keyposes.v2',
  strategy,
  canonicalScope: {
    workspaceId:
      selectedSceneRequest.canonicalScope.workspaceId,
    projectId:
      selectedSceneRequest.canonicalScope.projectId,
    editSessionId:
      selectedSceneRequest.canonicalScope.editSessionId,
    sceneId: selectedSceneRequest.canonicalScope.sceneId,
    componentId: primaryComponent.componentId,
  },
  sourceBindings: {
    approvedSnapshotId:
      selectedSceneRequest.sourceBindings.approvedSnapshotId,
    approvedSnapshotHashSha256:
      selectedSceneRequest.sourceBindings
        .approvedSnapshotHashSha256,
    selectedSceneBindingDigestSha256:
      selectedSceneRequest.sourceBindings
        .selectedSceneBindingDigestSha256,
    currentMasterTimingDigestSha256:
      selectedSceneRequest.sourceBindings
        .currentMasterTimingDigestSha256,
    confirmedOutputFrameExpectationDigestSha256:
      selectedSceneRequest.sourceBindings
        .outputFrameExpectationDigestSha256,
    completeCharacterSourceArtifactId:
      sourceArtifactId,
    completeCharacterSourceDigestSha256:
      'c'.repeat(64),
    styleReferenceArtifactId:
      'artifact.character-action-style.v1',
    styleReferenceDigestSha256:
      'd'.repeat(64),
  },
  actionChoreographyInput:
    actionChoreographyTestInput({
      slug: 'character-action-controlled-image',
      strategy,
      canonicalScope: {
        workspaceId:
          selectedSceneRequest.canonicalScope.workspaceId,
        projectId:
          selectedSceneRequest.canonicalScope.projectId,
        editSessionId:
          selectedSceneRequest.canonicalScope.editSessionId,
        sceneId:
          selectedSceneRequest.canonicalScope.sceneId,
        componentId: primaryComponent.componentId,
      },
      masterTimingDigestSha256:
        selectedSceneRequest.sourceBindings
          .currentMasterTimingDigestSha256,
      masterTimingPlanId:
        'timing.character-action-controlled-image.v1',
      segmentId:
        'segment.character-action-controlled-image.v1',
      actionStartFrame: 12,
      actionKind: 'prop_interaction',
      relativeFrames: [0, 5, 12, 26],
    }),
  keyposes: keyposeInputs,
} as const
const keyposePlan =
  compileLivingFrameCompleteCharacterKeyposePlan(
    keyposePlanInput,
  )
const input = {
  bindingId:
    'binding.character-action-keyposes.controlled-image.v1',
  keyposePlan,
  keyposePlanInput,
  controlledPreparation,
  controlledPreparationInput,
} as const
const binding =
  await compileLivingFrameCompleteCharacterKeyposeControlledImageBinding(
    input,
  )

assert.equal(
  await verifyLivingFrameCompleteCharacterKeyposeControlledImageBinding(
    binding,
    input,
  ),
  true,
)
assert.equal(binding.bindingUnits.length, 4)
assert.deepEqual(
  binding.bindingUnits.map((unit) => unit.role),
  keyposeRoles,
)
assert.deepEqual(
  binding.bindingUnits.map((unit) =>
    unit.storyTimingFrame),
  [12, 17, 24, 38],
)
assert.equal(
  binding.bindingUnits.every((unit) =>
    unit.controlledGraphPolicy.controlNetRequired
    && unit.controlledGraphPolicy
      .genericIpAdapterAndClipVisionRequired
    && unit.poseControlArtifactRef
      .exactPoseForActionPhaseRequired
    && unit.privateActionConditioningRequirement
      .serverDerivedActionConditioningRequired
    && !unit.privateActionConditioningRequirement
      .selectedSceneConditioningAloneSufficient
    && !unit.privateActionConditioningRequirement
      .privatePromptMaterializationMayProceedBeforeActionConditioningReconciled
    && unit.outputPolicy
      .professionalVisualAcceptanceRequiredBeforeInterpolation
    && !unit.outputPolicy
      .independentAnimationFrameGenerationAllowed
    && unit.outputPolicy.remotionOwnsFinalCanvas),
  true,
)
assert.equal(
  binding.privateActionConditioningReconciled,
  false,
)
assert.equal(binding.privatePromptMaterialized, false)
assert.equal(binding.operationRegistered, false)
assert.equal(binding.dispatchGranted, false)
assert.equal(binding.runtimeExecuted, false)
assert.equal(binding.assetCreated, false)
assert.equal(binding.productionReady, false)

const swappedKeyposes = [
  keyposeInputs[0]!,
  {
    ...keyposeInputs[1]!,
    outputKey: keyposeInputs[2]!.outputKey,
  },
  {
    ...keyposeInputs[2]!,
    outputKey: keyposeInputs[1]!.outputKey,
  },
  keyposeInputs[3]!,
] as const
const swappedPlanInput:
  CreateLivingFrameCompleteCharacterKeyposePlanInput = {
  ...keyposePlanInput,
  planId: 'plan.character-action-keyposes.swapped.v2',
  keyposes: swappedKeyposes,
}
const swappedPlan =
  compileLivingFrameCompleteCharacterKeyposePlan(
    swappedPlanInput,
  )
await assertRejectsWith({
  ...input,
  bindingId:
    'binding.character-action-keyposes.swapped.v1',
  keyposePlan: swappedPlan,
  keyposePlanInput: swappedPlanInput,
}, 'cross_keypose_work_item_or_output_substitution')

await assertRejectsWith({
  ...input,
  prompt: 'caller action prompt is forbidden',
} as unknown as typeof input, 'input_invalid')

const authorityForgery = resign(binding, (draft) => {
  draft.privateActionConditioningReconciled = true
  draft.privatePromptMaterialized = true
  draft.operationRegistered = true
  draft.dispatchGranted = true
  draft.runtimeExecuted = true
  draft.assetCreated = true
  draft.canonicalQaApproved = true
  draft.productionReady = true
})
assert.equal(
  await verifyLivingFrameCompleteCharacterKeyposeControlledImageBinding(
    authorityForgery,
    input,
  ),
  false,
)

const actionBypassForgery = resign(binding, (draft) => {
  const units = draft.bindingUnits as
    Array<Record<string, unknown>>
  const requirement = units[0]!
    .privateActionConditioningRequirement as
      Record<string, unknown>
  requirement.selectedSceneConditioningAloneSufficient =
    true
  requirement.privatePromptMaterializationMayProceedBeforeActionConditioningReconciled =
    true
})
assert.equal(
  await verifyLivingFrameCompleteCharacterKeyposeControlledImageBinding(
    actionBypassForgery,
    input,
  ),
  false,
)

console.log(JSON.stringify({
  smoke:
    'living_frame_complete_character_keypose_controlled_image_binding',
  status: 'passed',
  keyposeCount: binding.metrics.keyposeUnitCount,
  keyposeRoles:
    binding.bindingUnits.map((unit) => unit.role),
  keyposeFrames:
    binding.bindingUnits.map((unit) =>
      unit.storyTimingFrame),
  controlNetRequired: true,
  genericIpAdapterRequired: true,
  exactModelRoleCount: 5,
  actionConditioningReconciled:
    binding.privateActionConditioningReconciled,
  privatePromptMaterialized:
    binding.privatePromptMaterialized,
  professionalVisualAcceptanceRequired:
    true,
  operationRegistered: binding.operationRegistered,
  dispatchGranted: binding.dispatchGranted,
  runtimeExecuted: binding.runtimeExecuted,
  assetCreated: binding.assetCreated,
  productionReady: binding.productionReady,
  adversarialAssertions: 4,
}))

function routeEvidence(
  sourceArtifactIdValue: string,
): LivingFrameCharacterAnimationSuitabilityEvidence {
  return {
    evidenceId:
      'evidence.character-action-controlled-keyposes.v1',
    sceneId: source.sceneId,
    componentId: primaryComponent.componentId,
    sourceArtifactId: sourceArtifactIdValue,
    illustrativeNotArchivalEvidence: true,
    componentTopology:
      'merged_limb_hand_clothing_and_prop_cutout',
    requestedMotionMagnitude:
      'large_pose_change',
    desiredPoseRequiresNewPixels: true,
    sourcePoseOccludesProtectedFace: false,
    upperArmSeparated: false,
    forearmSeparated: false,
    handSeparated: false,
    propSeparated: false,
    exactJointPivotsReviewed: false,
    hiddenJointArtworkReconstructed: false,
    deformableMeshTopologyReviewed: false,
    skinWeightMapReviewed: false,
    referenceIdentityAvailable: true,
    poseControlAvailable: true,
    deterministicRigidPivotAvailable: false,
    componentMotionExposesHiddenSourcePixels: true,
    exposedSourcePlateReconstructedAndReviewed:
      false,
    componentBoundaryDecontaminatedAndReviewed:
      false,
    protectedFaceMotionPathReviewed: true,
    motionPathClearsProtectedFace: true,
    componentAttachmentContinuityReviewed: true,
    flatMeshDeformationSufficient: false,
    continuousNaturalMotionRequired: false,
    rawChatPromptPathUrlModelCodeOrBytesIncluded:
      false,
  }
}

async function assertRejectsWith(
  candidate:
    CreateLivingFrameCompleteCharacterKeyposeControlledImageBindingInput,
  code: string,
): Promise<void> {
  let caught: unknown
  try {
    await compileLivingFrameCompleteCharacterKeyposeControlledImageBinding(
      candidate,
    )
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof
      LivingFrameCompleteCharacterKeyposeControlledImageBindingError,
  )
  assert.equal(caught.issues[0]?.code, code)
}

function resign(
  value:
    LivingFrameCompleteCharacterKeyposeControlledImageBinding,
  mutate: (draft: Record<string, unknown>) => void,
): Record<string, unknown> {
  const draft = structuredClone(value) as unknown as
    Record<string, unknown>
  delete draft.bindingDigestSha256
  mutate(draft)
  return {
    ...draft,
    bindingDigestSha256:
      sha256AuthorityValue(draft),
  }
}
