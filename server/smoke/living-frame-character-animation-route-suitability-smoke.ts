import assert from 'node:assert/strict'

import type {
  LivingFrameCharacterAnimationSuitabilityEvidence,
} from '../../src/types/living-frame-character-animation-route'
import {
  buildLivingFrameAirshipNavigatorArticulatedBlenderPrivateFixture,
} from '../living-frame/living-frame-airship-navigator-articulated-blender-private-fixture'
import {
  compileLivingFrameBlenderSelectedSceneTextureBindingInternalTest,
} from '../living-frame/living-frame-blender-selected-scene-texture-binding-internal-test'
import {
  compileLivingFrameCharacterAnimationRouteDecision,
  verifyLivingFrameCharacterAnimationRouteDecision,
} from '../living-frame/living-frame-character-animation-route'
import {
  buildLivingFrameBlenderSelectedScenePrivateFixture,
} from '../living-frame/living-frame-blender-selected-scene-private-fixture'
import {
  materializeLivingFrameMusashiBlenderTexturePrivateFixture,
} from '../living-frame/living-frame-musashi-blender-texture-private-fixture'

const musashiRestrained =
  compileLivingFrameCharacterAnimationRouteDecision(
    musashiEvidence({
      evidenceId:
        'evidence.musashi.restrained-cutout',
      requestedMotionMagnitude:
        'restrained',
      desiredPoseRequiresNewPixels:
        false,
    }),
  )
assert.equal(
  musashiRestrained.decision
    .selectedRoute,
  'comfyui_controlled_component_preparation',
)
assert.equal(
  musashiRestrained.decision
    .selectedOperationId,
  'tool.comfyui.generate_controlled_image.v1',
)
assert.equal(
  musashiRestrained.decision
    .controlledComponentPreparationRequired,
  true,
)
assert.equal(
  musashiRestrained.decision
    .downstreamRouteAfterPreparation,
  'pixijs_rigid_cutout',
)
assert.equal(
  musashiRestrained.decision
    .blenderAdmissionAllowed,
  false,
)
assert.equal(
  musashiRestrained.decision
    .generateEveryFrameIndependently,
  false,
)
assert.equal(
  verifyLivingFrameCharacterAnimationRouteDecision(
    musashiRestrained,
  ),
  true,
)
assert.equal(
  verifyLivingFrameCharacterAnimationRouteDecision({
    ...musashiRestrained,
    decision: {
      ...musashiRestrained.decision,
      blenderAdmissionAllowed: true,
    },
  }),
  false,
)

const musashiLargePose =
  compileLivingFrameCharacterAnimationRouteDecision(
    musashiEvidence({
      evidenceId:
        'evidence.musashi.large-controlled-keypose',
      requestedMotionMagnitude:
        'large_pose_change',
      desiredPoseRequiresNewPixels:
        true,
    }),
  )
assert.equal(
  musashiLargePose.decision
    .selectedRoute,
  'comfyui_controlled_keyposes',
)
assert.equal(
  musashiLargePose.decision
    .selectedOperationId,
  'tool.comfyui.generate_controlled_image.v1',
)
assert.equal(
  musashiLargePose.decision
    .controlledKeyposeGenerationRequired,
  true,
)
assert.equal(
  musashiLargePose.decision
    .generateEveryFrameIndependently,
  false,
)
assert.equal(
  musashiLargePose.decision
    .routeState,
  'blocked_pending_controlled_generation_runtime',
)

const unsafeRigidPath =
  compileLivingFrameCharacterAnimationRouteDecision({
    ...musashiRestrained.evidence,
    evidenceId:
      'evidence.musashi.unsafe-face-crossing',
    motionPathClearsProtectedFace:
      false,
  })
assert.equal(
  unsafeRigidPath.decision.selectedRoute,
  'comfyui_controlled_component_preparation',
)
assert.equal(
  unsafeRigidPath.decision.routeState,
  'blocked_pending_controlled_component_preparation_runtime',
)
assert.equal(
  unsafeRigidPath.decision.reasonCodes.includes(
    'current_motion_path_intersects_protected_face_and_requires_redesign',
  ),
  true,
)

const cleanRigidComponent =
  compileLivingFrameCharacterAnimationRouteDecision({
    ...musashiRestrained.evidence,
    evidenceId:
      'evidence.character.clean-rigid-component',
    sourceArtifactId:
      'artifact.character.clean-rigid-component.v1',
    componentTopology:
      'single_rigid_cutout',
    sourcePoseOccludesProtectedFace:
      false,
    componentMotionExposesHiddenSourcePixels:
      false,
    exposedSourcePlateReconstructedAndReviewed:
      true,
    componentBoundaryDecontaminatedAndReviewed:
      true,
  })
assert.equal(
  cleanRigidComponent.decision
    .selectedRoute,
  'pixijs_rigid_cutout',
)
assert.equal(
  cleanRigidComponent.decision
    .selectedOperationId,
  'tool.pixijs.render_pixi_scene.v1',
)
assert.equal(
  cleanRigidComponent.decision
    .controlledComponentPreparationRequired,
  false,
)

const articulatedFixture =
  buildLivingFrameAirshipNavigatorArticulatedBlenderPrivateFixture()
const articulated =
  articulatedFixture
    .characterAnimationRouteDecision
assert.equal(
  articulated.decision
    .selectedRoute,
  'blender_articulated_2_5d',
)
assert.equal(
  articulated.decision
    .blenderAdmissionAllowed,
  true,
)

const flatMesh =
  compileLivingFrameCharacterAnimationRouteDecision({
    ...articulated.evidence,
    evidenceId:
      'evidence.character.flat-mesh',
    componentTopology:
      'separated_flat_mesh_parts',
    upperArmSeparated: false,
    forearmSeparated: false,
    handSeparated: false,
    propSeparated: false,
    skinWeightMapReviewed: false,
    flatMeshDeformationSufficient:
      true,
  })
assert.equal(
  flatMesh.decision
    .selectedRoute,
  'opentoonz_flat_mesh',
)
assert.equal(
  flatMesh.decision
    .openToonzAdmissionAllowed,
  true,
)

const selected =
  await buildLivingFrameBlenderSelectedScenePrivateFixture()
const textureFixture =
  await materializeLivingFrameMusashiBlenderTexturePrivateFixture()
try {
  await assert.rejects(
    () =>
      compileLivingFrameBlenderSelectedSceneTextureBindingInternalTest({
        admission:
          selected.admission,
        admissionInput:
          selected.admissionInput,
        textureFixture,
        fullFrameUvMesh:
          selected.fixture.mesh,
        characterAnimationRouteDecision:
          musashiRestrained,
      }),
    /requires a qualified articulated Blender route/,
  )
} finally {
  await textureFixture.cleanup()
}

console.log(JSON.stringify({
  smoke:
    'living_frame_character_animation_route_suitability',
  status: 'passed',
  screenshotFailureClass:
    'merged_painted_limb_hand_clothing_prop_cutout_generic_mesh_deformation',
  restrainedMusashiRoute:
    musashiRestrained.decision
      .selectedRoute,
  cleanRigidComponentRoute:
    cleanRigidComponent.decision
      .selectedRoute,
  largePoseMusashiRoute:
    musashiLargePose.decision
      .selectedRoute,
  properlySeparatedCharacterRoute:
    articulated.decision
      .selectedRoute,
  properlySeparatedCharacterPartCount:
    articulatedFixture
      .reviewedTopology
      .atlasPartCount,
  properlySeparatedCharacterMeshIslands:
    articulatedFixture
      .reviewedTopology
      .disconnectedMeshIslandCount,
  flatMeshCharacterRoute:
    flatMesh.decision
      .selectedRoute,
  musashiBlenderAdmissionRejected:
    true,
  unsafePixiFaceCrossingRejected:
    true,
  unreconstructedMusashiPlateRejectedFromPixi:
    true,
  generatedKeyposePolicy:
    'controlled_anchor_keyposes_not_every_frame',
  remotionOwnsFinalCanvas: true,
  operationRegistered: false,
  dispatchGranted: false,
  runtimeGranted: false,
  assetCreated: false,
  canonicalQaApproved: false,
  customerCharged: false,
  publicDeliveryReady: false,
  productionReady: false,
}))

function musashiEvidence(input: {
  readonly evidenceId: string
  readonly requestedMotionMagnitude:
    'restrained'
    | 'moderate'
    | 'large_pose_change'
  readonly desiredPoseRequiresNewPixels:
    boolean
}):
LivingFrameCharacterAnimationSuitabilityEvidence {
  return {
    evidenceId: input.evidenceId,
    sceneId: 'scene.musashi-strike',
    componentId: 'musashi.body',
    sourceArtifactId:
      'lf.animation-aware-illustration.musashi.sword-arm.v1',
    illustrativeNotArchivalEvidence:
      true,
    componentTopology:
      'merged_limb_hand_clothing_and_prop_cutout',
    requestedMotionMagnitude:
      input.requestedMotionMagnitude,
    desiredPoseRequiresNewPixels:
      input.desiredPoseRequiresNewPixels,
    sourcePoseOccludesProtectedFace:
      true,
    upperArmSeparated: false,
    forearmSeparated: false,
    handSeparated: false,
    propSeparated: false,
    exactJointPivotsReviewed: true,
    hiddenJointArtworkReconstructed:
      false,
    deformableMeshTopologyReviewed:
      false,
    skinWeightMapReviewed: false,
    referenceIdentityAvailable: true,
    poseControlAvailable: true,
    deterministicRigidPivotAvailable:
      true,
    componentMotionExposesHiddenSourcePixels:
      true,
    exposedSourcePlateReconstructedAndReviewed:
      false,
    componentBoundaryDecontaminatedAndReviewed:
      false,
    protectedFaceMotionPathReviewed:
      true,
    motionPathClearsProtectedFace:
      true,
    componentAttachmentContinuityReviewed:
      true,
    flatMeshDeformationSufficient:
      false,
    continuousNaturalMotionRequired:
      false,
    rawChatPromptPathUrlModelCodeOrBytesIncluded:
      false,
  }
}
