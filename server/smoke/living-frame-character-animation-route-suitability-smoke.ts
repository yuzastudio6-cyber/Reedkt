import assert from 'node:assert/strict'

import type {
  LivingFrameCharacterAnimationSuitabilityEvidence,
} from '../../src/types/living-frame-character-animation-route'
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
  'pixijs_rigid_cutout',
)
assert.equal(
  musashiRestrained.decision
    .selectedOperationId,
  'tool.pixijs.render_pixi_scene.v1',
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
  'no_animation',
)
assert.equal(
  unsafeRigidPath.decision.routeState,
  'deliberate_non_use',
)

const articulated =
  compileLivingFrameCharacterAnimationRouteDecision({
    ...musashiEvidence({
      evidenceId:
        'evidence.character.separated-articulated',
      requestedMotionMagnitude:
        'moderate',
      desiredPoseRequiresNewPixels:
        false,
    }),
    sourceArtifactId:
      'artifact.character.separated-parts.v1',
    componentTopology:
      'separated_articulated_limb_parts',
    sourcePoseOccludesProtectedFace:
      false,
    upperArmSeparated: true,
    forearmSeparated: true,
    handSeparated: true,
    propSeparated: true,
    exactJointPivotsReviewed: true,
    hiddenJointArtworkReconstructed:
      true,
    deformableMeshTopologyReviewed:
      true,
    skinWeightMapReviewed: true,
    deterministicRigidPivotAvailable:
      false,
  })
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
  largePoseMusashiRoute:
    musashiLargePose.decision
      .selectedRoute,
  properlySeparatedCharacterRoute:
    articulated.decision
      .selectedRoute,
  flatMeshCharacterRoute:
    flatMesh.decision
      .selectedRoute,
  musashiBlenderAdmissionRejected:
    true,
  unsafePixiFaceCrossingRejected:
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
