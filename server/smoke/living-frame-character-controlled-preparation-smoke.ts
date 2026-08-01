import assert from 'node:assert/strict'

import type {
  LivingFrameCharacterControlledPreparation,
} from '../../src/types/living-frame-character-controlled-preparation'
import type {
  LivingFrameCharacterAnimationSuitabilityEvidence,
} from '../../src/types/living-frame-character-animation-route'
import {
  compileLivingFrameCharacterControlledPreparation,
  LivingFrameCharacterControlledPreparationError,
  type CreateLivingFrameCharacterControlledPreparationInput,
  verifyLivingFrameCharacterControlledPreparation,
} from '../living-frame/living-frame-character-controlled-preparation'
import {
  compileLivingFrameCharacterAnimationRouteDecision,
} from '../living-frame/living-frame-character-animation-route'
import {
  createLivingFrameComfyUiOperationAdmissionCandidate,
} from '../living-frame/living-frame-comfyui-operation-admission-candidate'
import {
  createLivingFrameControlledImageFullFrameRatioExtension,
} from '../living-frame/living-frame-controlled-image-full-frame-ratio-extension'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  livingFrameControlledImageSelectedSceneSmokeInput,
  livingFrameControlledImageSelectedSceneSmokeRequest,
} from './living-frame-controlled-image-selected-scene-request-smoke'

const selectedSceneRequest =
  livingFrameControlledImageSelectedSceneSmokeRequest
const selectedSceneRequestInput =
  livingFrameControlledImageSelectedSceneSmokeInput
const primaryUnit =
  selectedSceneRequest.requestUnits.find((unit) =>
    unit.componentRole === 'primary_subject')!
const admissionCandidate =
  await createLivingFrameComfyUiOperationAdmissionCandidate({
    candidateId:
      'living-frame.comfyui.character-preparation.001',
  })
const fullFrameRatioExtensionInput = {
  extensionId:
    'living-frame.full-frame-ratio.character-preparation.001',
  selectedSceneRequest,
  selectedSceneRequestInput,
  admissionCandidate,
} as const
const fullFrameRatioExtension =
  await createLivingFrameControlledImageFullFrameRatioExtension(
    fullFrameRatioExtensionInput,
  )
const routeDecision =
  compileLivingFrameCharacterAnimationRouteDecision(
    componentPreparationEvidence(),
  )
const input = {
  candidateId:
    'living-frame.character-controlled-preparation.001',
  routeDecision,
  selectedSceneRequest,
  selectedSceneRequestInput,
  fullFrameRatioExtension,
  fullFrameRatioExtensionInput,
} as const

const result =
  await compileLivingFrameCharacterControlledPreparation(
    input,
  )

export {
  input as livingFrameCharacterControlledPreparationSmokeInput,
  result as livingFrameCharacterControlledPreparationSmokeResult,
}

assert.equal(
  await verifyLivingFrameCharacterControlledPreparation(
    result,
    input,
  ),
  true,
)
assert.equal(
  result.selectedRoute,
  'comfyui_controlled_component_preparation',
)
assert.equal(result.preparationUnits.length, 2)
assert.equal(result.metrics.maskedInpaintUnitCount, 1)
assert.equal(result.metrics.isolatedComponentUnitCount, 1)
assert.equal(result.metrics.anchorKeyposeUnitCount, 0)
assert.equal(
  result.graphBoundary
    .existingSelectedSceneGraphSupportsMaskedInpaint,
  false,
)
assert.equal(
  result.graphBoundary
    .existingSelectedSceneGraphMaySubstituteForMaskedInpaint,
  false,
)
assert.deepEqual(
  result.graphBoundary.maskedInpaintRequiredNodes,
  ['LoadImageMask', 'VAEEncodeForInpaint'],
)
assert.equal(
  result.graphBoundary.sourcePlateMaskEncodingProfile,
  'gray8_mask_png_v1',
)
assert.equal(
  result.graphBoundary.sourcePlateMaskChannel,
  'red',
)
assert.equal(
  result.graphBoundary.sourcePlateMaskPolarity,
  'white_one_means_inpaint',
)
assert.equal(
  result.graphBoundary.plainLoadImageMaskOutputAllowed,
  false,
)

const plate = result.preparationUnits.find((unit) =>
  unit.purpose ===
    'reconstruct_exposed_source_plate')!
const component = result.preparationUnits.find((unit) =>
  unit.purpose ===
    'prepare_clean_isolated_component')!
assert.equal(
  plate.graphProfile.graphFamily,
  'controlled_sdxl_masked_inpaint_v1',
)
assert.equal(
  plate.graphProfile.nodeClasses.includes(
    'VAEEncodeForInpaint',
  ),
  true,
)
assert.equal(
  plate.graphProfile.nodeClasses.includes(
    'LoadImageMask',
  ),
  true,
)
assert.equal(
  plate.graphProfile.nodeClasses.includes(
    'EmptyLatentImage',
  ),
  false,
)
assert.equal(
  plate.graphProfile.requiredPrivateSlotKinds.includes(
    'source_plate_image_artifact',
  ),
  true,
)
assert.equal(
  plate.graphProfile.requiredPrivateSlotKinds.includes(
    'source_plate_inpaint_mask_artifact',
  ),
  true,
)
assert.equal(
  plate.generationCanvas.canvasClass,
  'confirmed_full_frame_ratio',
)
assert.deepEqual([
  plate.generationCanvas.widthPixels,
  plate.generationCanvas.heightPixels,
], [1920, 1080])
assert.equal(
  component.graphProfile.graphFamily,
  'controlled_sdxl_selected_scene_v1',
)
assert.deepEqual([
  component.generationCanvas.widthPixels,
  component.generationCanvas.heightPixels,
], [1024, 1024])
assert.equal(
  plate.downstreamPolicy.stillAlphaPipelineRequired,
  false,
)
assert.equal(
  component.downstreamPolicy.stillAlphaPipelineRequired,
  true,
)
assert.equal(
  component.downstreamPolicy
    .opaqueRectangleMayReplaceRequiredAlpha,
  false,
)
assert.equal(
  result.preparationUnits.every((unit) =>
    unit.graphProfile.nodeClasses.at(-1) ===
      'SaveImageWebsocket'
    && unit.downstreamPolicy
      .generateEveryAnimationFrameIndependently ===
      false
    && unit.generationCanvas
      .finalCanvasCreatedByComfyUi === false),
  true,
)
assert.equal(
  result.professionalRules
    .reconstructPlateBeforeMovingOccludingComponent,
  true,
)
assert.equal(
  result.professionalRules
    .recompileRouteAfterPreparationQa,
  true,
)
assert.equal(result.operationRegistered, false)
assert.equal(result.dispatchGranted, false)
assert.equal(result.runtimeExecuted, false)
assert.equal(result.assetCreated, false)
assert.equal(result.qaApproved, false)
assert.equal(result.productionReady, false)

const genericGraphSubstitution =
  resign(result, (draft) => {
    const units =
      draft.preparationUnits as
        Array<Record<string, unknown>>
    const unit = units.find((candidate) =>
      candidate.purpose ===
        'reconstruct_exposed_source_plate')!
    const profile =
      unit.graphProfile as Record<string, unknown>
    profile.graphFamily =
      'controlled_sdxl_selected_scene_v1'
    profile.nodeClasses = [
      'CheckpointLoaderSimple',
      'CLIPTextEncode',
      'CLIPTextEncode',
      'EmptyLatentImage',
      'KSampler',
      'VAEDecode',
      'SaveImageWebsocket',
    ]
  })
assert.equal(
  await verifyLivingFrameCharacterControlledPreparation(
    genericGraphSubstitution,
    input,
  ),
  false,
)

const finalCanvasForgery =
  resign(result, (draft) => {
    const units =
      draft.preparationUnits as
        Array<Record<string, unknown>>
    const generationCanvas =
      units[0]!.generationCanvas as
        Record<string, unknown>
    generationCanvas.finalCanvasCreatedByComfyUi =
      true
  })
assert.equal(
  await verifyLivingFrameCharacterControlledPreparation(
    finalCanvasForgery,
    input,
  ),
  false,
)

const everyFrameForgery =
  resign(result, (draft) => {
    const units =
      draft.preparationUnits as
        Array<Record<string, unknown>>
    const downstreamPolicy =
      units[1]!.downstreamPolicy as
        Record<string, unknown>
    downstreamPolicy
      .generateEveryAnimationFrameIndependently =
      true
  })
assert.equal(
  await verifyLivingFrameCharacterControlledPreparation(
    everyFrameForgery,
    input,
  ),
  false,
)

await assertRejectsWith(
  {
    ...input,
    prompt: 'caller prompt is forbidden',
  } as unknown as
    CreateLivingFrameCharacterControlledPreparationInput,
  'input_invalid',
)

const pixiRoute =
  compileLivingFrameCharacterAnimationRouteDecision({
    ...routeDecision.evidence,
    evidenceId:
      'evidence.character-preparation.already-clean',
    componentTopology: 'single_rigid_cutout',
    componentMotionExposesHiddenSourcePixels:
      false,
    exposedSourcePlateReconstructedAndReviewed:
      true,
    componentBoundaryDecontaminatedAndReviewed:
      true,
  })
await assertRejectsWith({
  ...input,
  routeDecision: pixiRoute,
}, 'route_not_controlled_generation')

const crossSceneRoute =
  compileLivingFrameCharacterAnimationRouteDecision({
    ...routeDecision.evidence,
    evidenceId:
      'evidence.character-preparation.cross-scene',
    sceneId: 'scene.cross-substituted',
  })
await assertRejectsWith({
  ...input,
  routeDecision: crossSceneRoute,
}, 'source_lineage_mismatch')

const authorityForgery =
  resign(result, (draft) => {
    draft.operationRegistered = true
    draft.dispatchGranted = true
    draft.runtimeExecuted = true
    draft.assetCreated = true
    draft.qaApproved = true
    draft.productionReady = true
  })
assert.equal(
  await verifyLivingFrameCharacterControlledPreparation(
    authorityForgery,
    input,
  ),
  false,
)

console.log(JSON.stringify({
  smoke:
    'living_frame_character_controlled_preparation',
  status: 'passed',
  selectedRoute: result.selectedRoute,
  preparationUnitCount:
    result.metrics.preparationUnitCount,
  maskedInpaintUnitCount:
    result.metrics.maskedInpaintUnitCount,
  isolatedComponentUnitCount:
    result.metrics.isolatedComponentUnitCount,
  plateDimensions: [
    plate.generationCanvas.widthPixels,
    plate.generationCanvas.heightPixels,
  ],
  componentDimensions: [
    component.generationCanvas.widthPixels,
    component.generationCanvas.heightPixels,
  ],
  existingGenericGraphMaySubstituteForMaskedInpaint:
    result.graphBoundary
      .existingSelectedSceneGraphMaySubstituteForMaskedInpaint,
  independentPerFrameGeneration:
    false,
  remotionOwnsFinalCanvas:
    result.professionalRules.finalCanvasOwnedByRemotion,
  adversarialAssertions: 7,
  operationRegistered: result.operationRegistered,
  dispatchGranted: result.dispatchGranted,
  runtimeExecuted: result.runtimeExecuted,
  assetCreated: result.assetCreated,
  qaApproved: result.qaApproved,
  productionReady: result.productionReady,
}))

function componentPreparationEvidence():
LivingFrameCharacterAnimationSuitabilityEvidence {
  return {
    evidenceId:
      'evidence.character-preparation.merged-cutout',
    sceneId:
      selectedSceneRequest.canonicalScope.sceneId,
    componentId: primaryUnit.componentId,
    sourceArtifactId:
      'artifact.character.merged-sword-arm-cutout.v1',
    illustrativeNotArchivalEvidence: true,
    componentTopology:
      'merged_limb_hand_clothing_and_prop_cutout',
    requestedMotionMagnitude: 'restrained',
    desiredPoseRequiresNewPixels: false,
    sourcePoseOccludesProtectedFace: true,
    upperArmSeparated: false,
    forearmSeparated: false,
    handSeparated: false,
    propSeparated: false,
    exactJointPivotsReviewed: true,
    hiddenJointArtworkReconstructed: false,
    deformableMeshTopologyReviewed: false,
    skinWeightMapReviewed: false,
    referenceIdentityAvailable: true,
    poseControlAvailable: true,
    deterministicRigidPivotAvailable: true,
    componentMotionExposesHiddenSourcePixels:
      true,
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
    CreateLivingFrameCharacterControlledPreparationInput,
  code: string,
): Promise<void> {
  let caught: unknown
  try {
    await compileLivingFrameCharacterControlledPreparation(
      candidate,
    )
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof
      LivingFrameCharacterControlledPreparationError,
  )
  assert.equal(caught.issues[0]?.code, code)
}

function resign(
  value:
    LivingFrameCharacterControlledPreparation,
  mutate:
    (draft: Record<string, unknown>) => void,
): Record<string, unknown> {
  const draft =
    structuredClone(value) as unknown as
      Record<string, unknown>
  delete draft.preparationDigestSha256
  mutate(draft)
  return {
    ...draft,
    preparationDigestSha256:
      sha256AuthorityValue(draft),
  }
}
