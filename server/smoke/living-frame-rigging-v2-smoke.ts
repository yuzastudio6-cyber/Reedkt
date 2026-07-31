import assert from 'node:assert/strict'

import type {
  LivingFrameRiggingDirection,
} from '../../src/types/living-frame-rigging-direction'
import type {
  LivingFrameRiggingAdapterCandidateRequest,
} from '../../src/types/living-frame-rigging-adapter-candidate'
import type {
  LivingFrameRiggingV2Capability,
  LivingFrameRiggingV2Plan,
} from '../../src/types/living-frame-rigging-v2'
import {
  LIVING_FRAME_RIGGING_V2_CAPABILITIES,
} from '../../src/types/living-frame-rigging-v2'
import {
  compileLivingFrameComponentGeometry,
} from '../living-frame/living-frame-component-geometry'
import {
  compileLivingFrameComponentRig,
} from '../living-frame/living-frame-component-rig'
import {
  compileLivingFrameDeterministicMotion,
} from '../living-frame/living-frame-deterministic-motion'
import {
  compileLivingFrameRiggingAdapterCandidate,
  verifyLivingFrameRiggingAdapterCandidate,
} from '../living-frame/living-frame-rigging-adapter-candidate'
import {
  type CompileLivingFrameRiggingDirectionInput,
  compileLivingFrameRiggingDirection,
  verifyLivingFrameRiggingDirection,
} from '../living-frame/living-frame-rigging-direction'
import {
  type CompileLivingFrameRiggingV2Input,
  compileLivingFrameRiggingV2Plan,
  verifyLivingFrameRiggingV2Plan,
} from '../living-frame/living-frame-rigging-v2'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const mechanicalFixture = buildFixture('mechanical')
const mechanicalInput = buildMechanicalInput(mechanicalFixture)
const mechanicalPlan = compileLivingFrameRiggingV2Plan(mechanicalInput)
assert.equal(verifyLivingFrameRiggingV2Plan(mechanicalPlan), true)
assert.equal(mechanicalPlan.rigMode, 'mechanical_linkage')
assert.equal(
  mechanicalPlan.routingRecommendation.recommendedBackend,
  'reeditpro_native_remotion',
)
assert.equal(
  mechanicalPlan.performanceQualification.state,
  'bounded_native_fixture_evidence_only',
)
assert.equal(
  mechanicalPlan.outputContract.outputMode,
  'native_transform_spec_json',
)
assert.equal(mechanicalPlan.outputContract.outputMayClaimFinalCanvas, false)

const flatFixture = buildFixture('flat-2d')
const flatInput = buildFlat2dInput(flatFixture)
const flatPlan = compileLivingFrameRiggingV2Plan(flatInput)
assert.equal(verifyLivingFrameRiggingV2Plan(flatPlan), true)
assert.equal(flatPlan.rigMode, 'deformable_2d_character')
assert.equal(
  flatPlan.routingRecommendation.recommendedBackend,
  'opentoonz_plastic_candidate',
)
assert.equal(flatPlan.routingRecommendation.externalBackendStillEvaluationOnly, true)
assert.equal(
  flatPlan.outputContract.outputMode,
  'transparent_rgba_component_sequence',
)
assert.equal(flatPlan.qaPlan.meshFoldoverQaRequired, true)
assert.equal(flatPlan.qaPlan.performanceBenchmarkQaRequired, true)

const advancedFixture = buildFixture('advanced-2-5d')
const advancedInput = buildAdvancedInput(advancedFixture)
const advancedPlan = compileLivingFrameRiggingV2Plan(advancedInput)
assert.equal(verifyLivingFrameRiggingV2Plan(advancedPlan), true)
assert.equal(advancedPlan.rigMode, 'armature_2_5d_character')
assert.equal(
  advancedPlan.routingRecommendation.recommendedBackend,
  'blender_headless_candidate',
)
assert.equal(
  advancedPlan.outputContract.outputMode,
  'transparent_rgba_component_sequence_with_depth_and_mask',
)
assert.equal(advancedPlan.outputContract.depthPassRequired, true)
assert.equal(advancedPlan.qaPlan.ikConvergenceQaRequired, true)
assert.equal(advancedPlan.qaPlan.skinWeightQaRequired, true)
assert.equal(advancedPlan.authorityBoundary.runtimeSelectionAuthority, false)
assert.equal(advancedPlan.externalRuntimeExecutionAuthorized, false)

const flatAdapterCandidate = compileLivingFrameRiggingAdapterCandidate({
  approvedSnapshotRef: expectation('approved-snapshot.flat'),
  selectedSceneRef: expectation('selected-scene.flat'),
  plannedWorkItemRef: expectation('planned-work-item.flat'),
  riggingDirection: flatInput.riggingDirection,
  riggingPlan: flatPlan,
})
const advancedAdapterCandidate = compileLivingFrameRiggingAdapterCandidate({
  approvedSnapshotRef: expectation('approved-snapshot.advanced'),
  selectedSceneRef: expectation('selected-scene.advanced'),
  plannedWorkItemRef: expectation('planned-work-item.advanced'),
  riggingDirection: advancedInput.riggingDirection,
  riggingPlan: advancedPlan,
})
assert.equal(
  verifyLivingFrameRiggingAdapterCandidate(flatAdapterCandidate),
  true,
)
assert.equal(
  verifyLivingFrameRiggingAdapterCandidate(advancedAdapterCandidate),
  true,
)
assert.equal(flatAdapterCandidate.adapterBinding.candidateToolId, 'opentoonz')
assert.equal(
  flatAdapterCandidate.adapterBinding.openToonzAdapterMode,
  'fixed_reviewed_scene_and_batch_adapter',
)
assert.equal(
  advancedAdapterCandidate.adapterBinding.candidateToolId,
  'blender',
)
assert.equal(
  advancedAdapterCandidate.adapterBinding.blenderPythonAdapterMode,
  'fixed_reviewed_bpy_adapter',
)
assert.equal(
  advancedAdapterCandidate.adapterBinding.modelGeneratedExecutableCodeAllowed,
  false,
)
assert.deepEqual(
  advancedAdapterCandidate.outputSelection.approvedRiggedComponentIds,
  ['component.primary', 'component.follower'],
)
assert.deepEqual(
  advancedAdapterCandidate.outputSelection.excludedStaticAnchorComponentIds,
  ['component.background'],
)
assert.equal(
  advancedAdapterCandidate.outputSelection.sourceOrBackgroundPlateIncluded,
  false,
)
assert.equal(
  advancedAdapterCandidate.authorityBoundary.runtimeExecutionAuthority,
  false,
)
assert.throws(
  () => compileLivingFrameRiggingAdapterCandidate({
    approvedSnapshotRef: expectation('approved-snapshot.native'),
    selectedSceneRef: expectation('selected-scene.native'),
    plannedWorkItemRef: expectation('planned-work-item.native'),
    riggingDirection: mechanicalInput.riggingDirection,
    riggingPlan: mechanicalPlan,
  }),
  /lineage is invalid/,
)

assert.equal(
  compileLivingFrameRiggingV2Plan(mechanicalInput).planDigestSha256,
  mechanicalPlan.planDigestSha256,
)
assert.equal(
  compileLivingFrameRiggingV2Plan(flatInput).planDigestSha256,
  flatPlan.planDigestSha256,
)
assert.equal(
  compileLivingFrameRiggingV2Plan(advancedInput).planDigestSha256,
  advancedPlan.planDigestSha256,
)

const unsafeDirectionInput = structuredClone(directionInput(
  advancedFixture,
  advancedPlan.requiredCapabilities,
  'armature_2_5d_character',
  'blender_headless_candidate',
  'demonstrate_articulated_action',
  'reach',
)) as Writable<CompileLivingFrameRiggingDirectionInput>
unsafeDirectionInput.narrativeDecision.directedMotionSummary =
  'Run https://unsafe.example and execute code'
assert.throws(
  () => compileLivingFrameRiggingDirection(unsafeDirectionInput),
  /unsafe material/,
)

assert.equal(verifyLivingFrameRiggingDirection({
  ...advancedInput.riggingDirection,
  directionDigestSha256: digest('forged-direction'),
}), false)

const wrongBackendDirection = compileDirection(directionInput(
  mechanicalFixture,
  capabilities([
    'rigid_transform',
    'parent_hierarchy',
    'bone_chain',
    'joint_limits',
    'inverse_kinematics',
    'mesh_deformation',
    'skin_weights',
    'depth_camera',
    'transparent_layer_output',
  ]),
  'armature_2_5d_character',
  'blender_headless_candidate',
  'demonstrate_articulated_action',
  'reach',
))
assert.throws(
  () => compileLivingFrameRiggingV2Plan({
    ...mechanicalInput,
    riggingDirection: wrongBackendDirection,
  }),
  /Head Intelligence direction is inconsistent/,
)

const lowConfidence = structuredClone(mechanicalInput) as Writable<
  CompileLivingFrameRiggingV2Input
>
lowConfidence.partBindings[1]!.partProposalConfidence = 0.5
lowConfidence.partBindings[1]!.manualPartReviewRequired = false
assert.throws(
  () => compileLivingFrameRiggingV2Plan(lowConfidence),
  /uncertain or reconstructed parts require review/,
)

const cyclic = structuredClone(advancedInput) as Writable<
  CompileLivingFrameRiggingV2Input
>
cyclic.bones[0]!.parentBoneId = cyclic.bones[1]!.boneId
assert.throws(
  () => compileLivingFrameRiggingV2Plan(cyclic),
  /bone hierarchy is cyclic/,
)

const wrongLength = structuredClone(advancedInput) as Writable<
  CompileLivingFrameRiggingV2Input
>
wrongLength.bones[0]!.restLengthNormalized = 0.99
assert.throws(
  () => compileLivingFrameRiggingV2Plan(wrongLength),
  /bone rest length is inconsistent/,
)

const wrongIkLength = structuredClone(advancedInput) as Writable<
  CompileLivingFrameRiggingV2Input
>
wrongIkLength.ikChains[0]!.chainLength = 1
assert.throws(
  () => compileLivingFrameRiggingV2Plan(wrongIkLength),
  /IK chain is invalid/,
)

const missingWeightMap = structuredClone(advancedInput) as Writable<
  CompileLivingFrameRiggingV2Input
>
missingWeightMap.meshBindings[0]!.weightMapArtifactRef = null
assert.throws(
  () => compileLivingFrameRiggingV2Plan(missingWeightMap),
  /mesh binding is invalid/,
)

const missingPart = structuredClone(advancedInput) as Writable<
  CompileLivingFrameRiggingV2Input
>
missingPart.partBindings.pop()
assert.throws(
  () => compileLivingFrameRiggingV2Plan(missingPart),
  /parts must cover each visual component once/,
)

const zeroMechanicalRatio = structuredClone(mechanicalInput) as Writable<
  CompileLivingFrameRiggingV2Input
>
zeroMechanicalRatio.mechanicalLinkages[0]!.ratio = 0
assert.throws(
  () => compileLivingFrameRiggingV2Plan(zeroMechanicalRatio),
  /mechanical linkage is invalid/,
)

const finalCanvasClaim = mutablePlan(advancedPlan)
finalCanvasClaim.outputContract.outputMayClaimFinalCanvas = true
assert.equal(verifyLivingFrameRiggingV2Plan(signPlan(finalCanvasClaim)), false)

const promotedAuthority = mutablePlan(advancedPlan)
promotedAuthority.authorityBoundary.runtimeSelectionAuthority = true
promotedAuthority.authorityBoundary.productionAuthority = true
assert.equal(verifyLivingFrameRiggingV2Plan(signPlan(promotedAuthority)), false)

const promotedCandidate = mutablePlan(advancedPlan)
promotedCandidate.backendCandidates[1]!.runtimeExecutionAuthority = true
assert.equal(verifyLivingFrameRiggingV2Plan(signPlan(promotedCandidate)), false)

const routeSubstitution = mutablePlan(flatPlan)
routeSubstitution.routingRecommendation.recommendedBackend =
  'blender_headless_candidate'
assert.equal(verifyLivingFrameRiggingV2Plan(signPlan(routeSubstitution)), false)

const capabilitySubstitution = mutablePlan(flatPlan)
capabilitySubstitution.requiredCapabilities.pop()
assert.equal(
  verifyLivingFrameRiggingV2Plan(signPlan(capabilitySubstitution)),
  false,
)

const directionLineageVersionSubstitution = mutablePlan(advancedPlan)
directionLineageVersionSubstitution.sourceBindings.riggingDirectionVersion =
  'living-frame-rigging-direction-v0'
assert.equal(
  verifyLivingFrameRiggingV2Plan(
    signPlan(directionLineageVersionSubstitution),
  ),
  false,
)

const unknownCommand = mutablePlan(advancedPlan) as Record<string, unknown>
unknownCommand.command = 'blender --background --python arbitrary.py'
assert.equal(verifyLivingFrameRiggingV2Plan(signUnknown(unknownCommand)), false)

const resignedBoneCycle = mutablePlan(advancedPlan)
resignedBoneCycle.bones[0]!.parentBoneId = resignedBoneCycle.bones[1]!.boneId
assert.equal(
  verifyLivingFrameRiggingV2Plan(signPlan(resignedBoneCycle)),
  false,
)

const resignedIkSubstitution = mutablePlan(advancedPlan)
resignedIkSubstitution.ikChains[0]!.targetControlId = 'control.root'
assert.equal(
  verifyLivingFrameRiggingV2Plan(signPlan(resignedIkSubstitution)),
  false,
)

const resignedLowConfidence = mutablePlan(flatPlan)
resignedLowConfidence.partBindings[1]!.partProposalConfidence = 0.2
resignedLowConfidence.partBindings[1]!.manualPartReviewRequired = false
assert.equal(
  verifyLivingFrameRiggingV2Plan(signPlan(resignedLowConfidence)),
  false,
)

const resignedEmptyParts = mutablePlan(mechanicalPlan)
resignedEmptyParts.partBindings.length = 0
assert.equal(
  verifyLivingFrameRiggingV2Plan(signPlan(resignedEmptyParts)),
  false,
)

const callerToolSubstitution = mutableAdapter(advancedAdapterCandidate)
callerToolSubstitution.adapterBinding.candidateToolId = 'opentoonz'
assert.equal(
  verifyLivingFrameRiggingAdapterCandidate(
    signAdapter(callerToolSubstitution),
  ),
  false,
)

const adapterAuthorityPromotion = mutableAdapter(advancedAdapterCandidate)
adapterAuthorityPromotion.authorityBoundary.runtimeExecutionAuthority = true
adapterAuthorityPromotion.authorityBoundary.finalCanvasAuthority = true
assert.equal(
  verifyLivingFrameRiggingAdapterCandidate(
    signAdapter(adapterAuthorityPromotion),
  ),
  false,
)

const arbitraryAdapterScript = mutableAdapter(
  advancedAdapterCandidate,
) as Record<string, unknown>
arbitraryAdapterScript.pythonScript = 'import bpy'
assert.equal(
  verifyLivingFrameRiggingAdapterCandidate(
    signUnknownRequest(arbitraryAdapterScript),
  ),
  false,
)

const nestedPlanSubstitution = mutableAdapter(advancedAdapterCandidate)
nestedPlanSubstitution.riggingPlan.routingRecommendation.recommendedBackend =
  'opentoonz_plastic_candidate'
assert.equal(
  verifyLivingFrameRiggingAdapterCandidate(
    signAdapter(nestedPlanSubstitution),
  ),
  false,
)

const opaqueBackgroundSubstitution = mutableAdapter(
  advancedAdapterCandidate,
)
opaqueBackgroundSubstitution.outputSelection.sourceOrBackgroundPlateIncluded =
  true
assert.equal(
  verifyLivingFrameRiggingAdapterCandidate(
    signAdapter(opaqueBackgroundSubstitution),
  ),
  false,
)

assert.equal(
  compileLivingFrameRiggingAdapterCandidate({
    approvedSnapshotRef: expectation('approved-snapshot.advanced'),
    selectedSceneRef: expectation('selected-scene.advanced'),
    plannedWorkItemRef: expectation('planned-work-item.advanced'),
    riggingDirection: advancedInput.riggingDirection,
    riggingPlan: advancedPlan,
  }).requestDigestSha256,
  advancedAdapterCandidate.requestDigestSha256,
)

console.log(JSON.stringify({
  suite: 'living-frame-rigging-v2',
  professionalDirectionVersion:
    advancedInput.riggingDirection.contractVersion,
  routeFixtures: {
    nativeMechanical:
      mechanicalPlan.routingRecommendation.recommendedBackend,
    flat2d:
      flatPlan.routingRecommendation.recommendedBackend,
    advanced2_5d:
      advancedPlan.routingRecommendation.recommendedBackend,
  },
  exactHeadIntelligenceDecisionBinding: true,
  structuredNonExecutableDirection: true,
  fixedReviewedAdapterBoundary: true,
  callerOrModelGeneratedCodeAllowed: false,
  deepResignedArtifactValidation: true,
  deterministicReplay: true,
  adversarialAssertions: 25,
  externalRuntimeExecutionAuthorized:
    flatPlan.externalRuntimeExecutionAuthorized
    || advancedPlan.externalRuntimeExecutionAuthorized,
  remotionOwnsFinalCanvas:
    mechanicalPlan.outputContract.remotionOwnsFinalComposition
    && flatPlan.outputContract.remotionOwnsFinalComposition
    && advancedPlan.outputContract.remotionOwnsFinalComposition,
}))

interface Fixture {
  readonly geometryBundle: ReturnType<
    typeof compileLivingFrameComponentGeometry
  >
  readonly motionBundle: ReturnType<
    typeof compileLivingFrameDeterministicMotion
  >
  readonly componentRig: ReturnType<typeof compileLivingFrameComponentRig>
}

function buildFixture(label: string): Fixture {
  const sceneId = `scene.rigging-v2.${label}`
  const outputFrameId = `output-frame.${label}`
  const outputFrameDigestSha256 = digest(`output-frame:${label}`)
  const motionBundle = compileLivingFrameDeterministicMotion({
    timingExpectation: {
      masterTimingPlanId: `master-timing.${label}`,
      masterTimingPlanDigestSha256: digest(`master-timing:${label}`),
      outputFrameId,
      outputFrameDigestSha256,
      sceneId,
      sceneStartFrame: 12,
      sceneEndFrame: 71,
      fpsNumerator: 30,
      fpsDenominator: 1,
      timingAuthorityRevalidationRequired: true,
    },
    tracks: [
      {
        trackId: 'track.primary.rotation',
        order: 0,
        motionGroupId: 'motion.primary',
        componentId: 'component.primary',
        property: 'rotation_degrees',
        role: 'primary',
        restorationExpectation: 'not_applicable',
        keyframes: [
          { frame: 12, value: 0, easingToNext: 'ease_in_out_cubic' },
          { frame: 42, value: 45, easingToNext: 'settle_out' },
          { frame: 71, value: 0, easingToNext: 'hold' },
        ],
      },
      {
        trackId: 'track.follower.position',
        order: 1,
        motionGroupId: 'motion.secondary',
        componentId: 'component.follower',
        property: 'position_x_normalized',
        role: 'secondary',
        restorationExpectation: 'required_return_to_initial',
        keyframes: [
          { frame: 12, value: 0, easingToNext: 'ease_in_out_cubic' },
          { frame: 42, value: 0.04, easingToNext: 'settle_out' },
          { frame: 71, value: 0, easingToNext: 'hold' },
        ],
      },
      {
        trackId: 'track.camera.scale',
        order: 2,
        motionGroupId: 'motion.camera',
        componentId: 'component.virtual-camera',
        property: 'scale_uniform',
        role: 'camera',
        restorationExpectation: 'not_applicable',
        keyframes: [
          { frame: 12, value: 1, easingToNext: 'ease_in_out_cubic' },
          { frame: 71, value: 1.05, easingToNext: 'hold' },
        ],
      },
    ],
  })
  const geometryBundle = compileLivingFrameComponentGeometry({
    outputFrameExpectation: {
      outputFrameId,
      outputFrameDigestSha256,
      widthPixels: 1_920,
      heightPixels: 1_080,
      pixelAspectRatioNumerator: 1,
      pixelAspectRatioDenominator: 1,
      confirmedOutputFrameRevalidationRequired: true,
    },
    motionBundle,
    safeRegions: [],
    components: [
      {
        componentId: 'component.background',
        order: 0,
        kind: 'visual_component',
        role: 'opaque_background_plate',
        focalRole: 'static_anchor',
        depthBand: 'background',
        rect: fullFrame(),
        pivot: { x: 0.5, y: 0.5 },
        parentComponentId: null,
        anchorComponentId: null,
        anchorPoint: { x: 0.5, y: 0.5 },
        collisionPolicy: 'base_layer_coverage',
        transparencyExpectation: 'opaque_plate',
        alphaSourceExpectation: 'opaque_plate',
        maskExpectation: 'opaque',
      },
      {
        componentId: 'component.primary',
        order: 1,
        kind: 'visual_component',
        role: 'primary_subject',
        focalRole: 'primary',
        depthBand: 'subject_plane',
        rect: { x: 0.25, y: 0.2, width: 0.45, height: 0.6 },
        pivot: { x: 0.5, y: 0.75 },
        parentComponentId: 'component.background',
        anchorComponentId: 'component.background',
        anchorPoint: { x: 0.5, y: 0.5 },
        collisionPolicy: 'avoid_all_protected_regions',
        transparencyExpectation: 'still_alpha_required',
        alphaSourceExpectation: 'postprocessed_still_mask_requires_qa',
        maskExpectation: 'still_alpha_artifact_required',
      },
      {
        componentId: 'component.follower',
        order: 2,
        kind: 'visual_component',
        role: 'foreground_occluder',
        focalRole: 'secondary',
        depthBand: 'in_front_of_subject',
        rect: { x: 0.48, y: 0.18, width: 0.18, height: 0.22 },
        pivot: { x: 0.2, y: 0.8 },
        parentComponentId: 'component.primary',
        anchorComponentId: 'component.primary',
        anchorPoint: { x: 0.62, y: 0.3 },
        collisionPolicy: 'avoid_all_protected_regions',
        transparencyExpectation: 'still_alpha_required',
        alphaSourceExpectation: 'postprocessed_still_mask_requires_qa',
        maskExpectation: 'still_alpha_artifact_required',
      },
      {
        componentId: 'component.virtual-camera',
        order: 3,
        kind: 'virtual_camera',
        role: 'virtual_camera',
        focalRole: 'none',
        depthBand: null,
        rect: null,
        pivot: null,
        parentComponentId: null,
        anchorComponentId: null,
        anchorPoint: null,
        collisionPolicy: 'no_surface',
        transparencyExpectation: null,
        alphaSourceExpectation: null,
        maskExpectation: null,
      },
    ],
    occlusionExpectations: [
      {
        relationId: 'occlusion.primary-over-background',
        order: 0,
        kind: 'in_front_of',
        foregroundComponentId: 'component.primary',
        backgroundComponentId: 'component.background',
        downstreamDepthTransitionCompilationRequired: false,
      },
      {
        relationId: 'occlusion.follower-over-primary',
        order: 1,
        kind: 'in_front_of',
        foregroundComponentId: 'component.follower',
        backgroundComponentId: 'component.primary',
        downstreamDepthTransitionCompilationRequired: false,
      },
    ],
  })
  return {
    geometryBundle,
    motionBundle,
    componentRig: compileLivingFrameComponentRig({
      geometryBundle,
      motionBundle,
    }),
  }
}

function buildMechanicalInput(
  fixture: Fixture,
): CompileLivingFrameRiggingV2Input {
  const required = capabilities([
    'rigid_transform',
    'parent_hierarchy',
    'mechanical_linkage',
    'transparent_layer_output',
  ])
  return {
    ...fixture,
    riggingDirection: compileDirection(directionInput(
      fixture,
      required,
      'mechanical_linkage',
      'reeditpro_native_remotion',
      'activate_mechanical_life',
      'rotate',
    )),
    rigMode: 'mechanical_linkage',
    partBindings: [
      part(0, 'part.background', 'component.background', 'static_anchor', false),
      part(1, 'part.primary', 'component.primary', 'mechanical_driver', false),
      part(2, 'part.follower', 'component.follower', 'mechanical_follower', false),
    ],
    bones: [],
    joints: [],
    controls: [],
    constraints: [],
    ikChains: [],
    meshBindings: [],
    mechanicalLinkages: [{
      order: 0,
      linkageId: 'linkage.primary-to-follower',
      driverComponentId: 'component.primary',
      driverMotionTrackId: 'track.primary.rotation',
      drivenComponentIds: ['component.follower'],
      relationship: 'rotation_ratio',
      ratio: 0.5,
      phaseOffsetDegrees: 15,
      exactPivotVerificationRequired: true,
    }],
    secondaryMotionGroups: [],
  }
}

function buildFlat2dInput(
  fixture: Fixture,
): CompileLivingFrameRiggingV2Input {
  const required = capabilities([
    'rigid_transform',
    'parent_hierarchy',
    'bone_chain',
    'joint_limits',
    'mesh_deformation',
    'rigidity_map',
    'stacking_order',
    'secondary_motion',
    'transparent_layer_output',
  ])
  return {
    ...fixture,
    riggingDirection: compileDirection(directionInput(
      fixture,
      required,
      'deformable_2d_character',
      'opentoonz_plastic_candidate',
      'support_character_gesture',
      'bend',
    )),
    rigMode: 'deformable_2d_character',
    partBindings: [
      part(0, 'part.background', 'component.background', 'static_anchor', false),
      part(1, 'part.primary', 'component.primary', 'deformable_part', true),
      part(2, 'part.follower', 'component.follower', 'secondary_motion_part', true),
    ],
    bones: [{
      order: 0,
      boneId: 'bone.primary',
      componentId: 'component.primary',
      parentBoneId: null,
      head: { x: 0.5, y: 0.75 },
      tail: { x: 0.5, y: 0.35 },
      restLengthNormalized: 0.4,
      restAngleDegrees: -90,
      deformComponent: true,
    }],
    joints: [{
      order: 0,
      jointId: 'joint.primary',
      boneId: 'bone.primary',
      pivot: { x: 0.5, y: 0.75 },
      minimumAngleDegrees: -35,
      maximumAngleDegrees: 35,
      restAngleDegrees: 0,
      allowStretching: false,
      stiffnessNormalized: 0.8,
    }],
    controls: [],
    constraints: [],
    ikChains: [],
    meshBindings: [{
      order: 0,
      meshId: 'mesh.primary.flat',
      componentId: 'component.primary',
      topology: 'triangulated_2d',
      topologyArtifactRef: artifact('mesh.primary.flat.topology'),
      vertexCount: 128,
      triangleCount: 214,
      weightMapArtifactRef: null,
      rigidityMapArtifactRef: artifact('mesh.primary.flat.rigidity'),
      animatedStackingOrderRequired: true,
    }],
    mechanicalLinkages: [],
    secondaryMotionGroups: [{
      order: 0,
      groupId: 'secondary.primary-follower',
      profile: 'hair_follow',
      driverPartId: 'part.primary',
      followerPartIds: ['part.follower'],
      stiffnessNormalized: 0.6,
      dampingNormalized: 0.75,
      maximumDisplacementNormalized: 0.08,
      deterministicBakeRequired: true,
    }],
  }
}

function buildAdvancedInput(
  fixture: Fixture,
): CompileLivingFrameRiggingV2Input {
  const required = capabilities([
    'rigid_transform',
    'parent_hierarchy',
    'bone_chain',
    'joint_limits',
    'inverse_kinematics',
    'mesh_deformation',
    'skin_weights',
    'secondary_motion',
    'depth_camera',
    'transparent_layer_output',
  ])
  return {
    ...fixture,
    riggingDirection: compileDirection(directionInput(
      fixture,
      required,
      'armature_2_5d_character',
      'blender_headless_candidate',
      'demonstrate_articulated_action',
      'reach',
    )),
    rigMode: 'armature_2_5d_character',
    partBindings: [
      part(0, 'part.background', 'component.background', 'static_anchor', false),
      part(1, 'part.primary', 'component.primary', 'deformable_part', true),
      part(2, 'part.follower', 'component.follower', 'secondary_motion_part', true),
    ],
    bones: [
      {
        order: 0,
        boneId: 'bone.root',
        componentId: 'component.primary',
        parentBoneId: null,
        head: { x: 0.5, y: 0.8 },
        tail: { x: 0.5, y: 0.55 },
        restLengthNormalized: 0.25,
        restAngleDegrees: -90,
        deformComponent: true,
      },
      {
        order: 1,
        boneId: 'bone.effector',
        componentId: 'component.primary',
        parentBoneId: 'bone.root',
        head: { x: 0.5, y: 0.55 },
        tail: { x: 0.7, y: 0.4 },
        restLengthNormalized: 0.25,
        restAngleDegrees: -36.869_897_645_844_02,
        deformComponent: true,
      },
    ],
    joints: [
      {
        order: 0,
        jointId: 'joint.root',
        boneId: 'bone.root',
        pivot: { x: 0.5, y: 0.8 },
        minimumAngleDegrees: -45,
        maximumAngleDegrees: 45,
        restAngleDegrees: 0,
        allowStretching: false,
        stiffnessNormalized: 0.9,
      },
      {
        order: 1,
        jointId: 'joint.effector',
        boneId: 'bone.effector',
        pivot: { x: 0.5, y: 0.55 },
        minimumAngleDegrees: -120,
        maximumAngleDegrees: 10,
        restAngleDegrees: -20,
        allowStretching: false,
        stiffnessNormalized: 0.7,
      },
    ],
    controls: [
      {
        order: 0,
        controlId: 'control.root',
        kind: 'root',
        targetBoneId: 'bone.root',
        position: { x: 0.5, y: 0.8 },
      },
      {
        order: 1,
        controlId: 'control.ik',
        kind: 'ik_target',
        targetBoneId: 'bone.effector',
        position: { x: 0.72, y: 0.38 },
      },
      {
        order: 2,
        controlId: 'control.pole',
        kind: 'pole_target',
        targetBoneId: 'bone.effector',
        position: { x: 0.4, y: 0.5 },
      },
    ],
    constraints: [
      {
        order: 0,
        constraintId: 'constraint.root.limit',
        kind: 'limit_rotation',
        sourceRefId: 'bone.root',
        targetRefId: 'control.root',
        influenceNormalized: 1,
        minimumValue: -45,
        maximumValue: 45,
      },
      {
        order: 1,
        constraintId: 'constraint.effector.ik',
        kind: 'ik_target',
        sourceRefId: 'bone.effector',
        targetRefId: 'control.ik',
        influenceNormalized: 1,
        minimumValue: null,
        maximumValue: null,
      },
    ],
    ikChains: [{
      order: 0,
      chainId: 'ik.primary',
      rootBoneId: 'bone.root',
      effectorBoneId: 'bone.effector',
      targetControlId: 'control.ik',
      poleControlId: 'control.pole',
      chainLength: 2,
      solverIterationLimit: 64,
      toleranceNormalized: 0.001,
    }],
    meshBindings: [{
      order: 0,
      meshId: 'mesh.primary.2-5d',
      componentId: 'component.primary',
      topology: 'skinned_plane_2_5d',
      topologyArtifactRef: artifact('mesh.primary.2-5d.topology'),
      vertexCount: 256,
      triangleCount: 450,
      weightMapArtifactRef: artifact('mesh.primary.2-5d.weights'),
      rigidityMapArtifactRef: null,
      animatedStackingOrderRequired: false,
    }],
    mechanicalLinkages: [],
    secondaryMotionGroups: [{
      order: 0,
      groupId: 'secondary.primary-follower',
      profile: 'fabric_follow',
      driverPartId: 'part.primary',
      followerPartIds: ['part.follower'],
      stiffnessNormalized: 0.55,
      dampingNormalized: 0.8,
      maximumDisplacementNormalized: 0.06,
      deterministicBakeRequired: true,
    }],
  }
}

function directionInput(
  fixture: Fixture,
  requiredCapabilities: readonly LivingFrameRiggingV2Capability[],
  rigMode: CompileLivingFrameRiggingDirectionInput['designDecision']['rigMode'],
  recommendedBackend:
    CompileLivingFrameRiggingDirectionInput['designDecision']['recommendedBackend'],
  purpose:
    CompileLivingFrameRiggingDirectionInput['narrativeDecision']['purpose'],
  visualVerb:
    CompileLivingFrameRiggingDirectionInput['narrativeDecision']['visualVerb'],
): CompileLivingFrameRiggingDirectionInput {
  const external = recommendedBackend !== 'reeditpro_native_remotion'
  const has = (capability: LivingFrameRiggingV2Capability) =>
    requiredCapabilities.includes(capability)
  return {
    ...fixture,
    compiledIntentRef: expectation('compiled-intent'),
    semanticScenePlanRef: expectation('semantic-scene-plan'),
    headIntelligenceEvidence: {
      reasoningRole: 'kimi_k3_main_edit_agent',
      reasoningAttemptRef: expectation('reasoning-attempt'),
      structuredOutputRef: expectation('structured-rig-output'),
      visualUnderstandingEvidenceRefs: [
        expectation('visual-evidence.parts'),
        expectation('visual-evidence.pivots'),
      ],
      rawChatPassedToRigWorker: false,
      rawModelCodeExecutionAllowed: false,
    },
    narrativeDecision: {
      purpose,
      visualVerb,
      directedMotionSummary:
        `Direct ${visualVerb} motion to communicate ${purpose} with one clear focal action`,
      importance: 'important',
      attentionPriority: 'shared',
      primaryFocalComponentId: 'component.primary',
      animateMeaningNotVocabulary: true,
      onePrimaryMotionAtATime: true,
    },
    motionArc: [
      {
        order: 0,
        phase: 'prepare',
        phasePurpose: 'prepare_space_and_attention',
        masterTimingOwnsExactFrames: true,
      },
      {
        order: 1,
        phase: 'activate',
        phasePurpose: 'begin_primary_action',
        masterTimingOwnsExactFrames: true,
      },
      {
        order: 2,
        phase: 'demonstrate',
        phasePurpose: 'communicate_narrative_relationship',
        masterTimingOwnsExactFrames: true,
      },
      {
        order: 3,
        phase: 'resolve',
        phasePurpose: 'complete_primary_action',
        masterTimingOwnsExactFrames: true,
      },
      {
        order: 4,
        phase: 'settle',
        phasePurpose: 'restore_or_hold_stable_state',
        masterTimingOwnsExactFrames: true,
      },
    ],
    designDecision: {
      rigMode,
      requiredCapabilities,
      recommendedBackend,
      simplerNativeRouteConsidered: true,
      simplerNativeRouteSufficient: !external,
      externalRuntimeJustification: !external
        ? 'not_required'
        : recommendedBackend === 'opentoonz_plastic_candidate'
          ? 'flat_2d_mesh_deformation_required'
          : 'armature_ik_skinning_or_2_5d_required',
      partDecompositionRequired: true,
      skeletalDeformationRequired:
        has('bone_chain') || has('mesh_deformation'),
      inverseKinematicsRequired: has('inverse_kinematics'),
      depthCameraRequired: has('depth_camera'),
      transparentComponentOutputRequired: external,
      finalCanvasDelegatedToRigTool: false,
    },
    riskDecision: {
      thinStructureRisk: 'medium',
      occludedPartRisk: 'medium',
      deformationRisk: external ? 'medium' : 'low',
      identityOrSilhouetteRisk: external ? 'medium' : 'low',
      manualRigReviewRequired: false,
      lowConfidenceMayAutoExecute: false,
    },
  }
}

function compileDirection(
  input: CompileLivingFrameRiggingDirectionInput,
): LivingFrameRiggingDirection {
  const direction = compileLivingFrameRiggingDirection(input)
  assert.equal(verifyLivingFrameRiggingDirection(direction), true)
  return direction
}

function part(
  order: number,
  partId: string,
  componentId: string,
  partRole:
    CompileLivingFrameRiggingV2Input['partBindings'][number]['partRole'],
  deformable: boolean,
): CompileLivingFrameRiggingV2Input['partBindings'][number] {
  return {
    order,
    partId,
    componentId,
    partRole,
    deformable,
    partProposalConfidence: 0.97,
    manualPartReviewRequired: false,
    occludedAreaReconstructionRequired: false,
    decompositionEvidenceRef: expectation(`part-evidence.${order}`),
  }
}

function artifact(id: string) {
  return {
    artifactId: id,
    artifactVersion: 'v1',
    artifactDigestSha256: digest(id),
    contentType: 'application/json' as const,
    currentArtifactRevalidationRequired: true as const,
  }
}

function expectation(id: string) {
  return {
    refId: id,
    version: 'v1',
    digestSha256: digest(id),
    currentAuthorityRevalidationRequired: true as const,
  }
}

function capabilities(
  requested: readonly LivingFrameRiggingV2Capability[],
): readonly LivingFrameRiggingV2Capability[] {
  return LIVING_FRAME_RIGGING_V2_CAPABILITIES.filter((capability) =>
    requested.includes(capability))
}

function fullFrame() {
  return { x: 0, y: 0, width: 1, height: 1 }
}

function digest(value: string): string {
  return sha256AuthorityValue(value)
}

type Mutable<T> =
  T extends boolean ? boolean
    : T extends string ? string
      : T extends number ? number
        : T extends readonly (infer Item)[] ? Mutable<Item>[]
          : T extends object
            ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
            : T

type Writable<T> =
  T extends readonly (infer Item)[] ? Writable<Item>[]
    : T extends object
      ? { -readonly [Key in keyof T]: Writable<T[Key]> }
      : T

function mutablePlan(
  value: LivingFrameRiggingV2Plan,
): Mutable<Omit<LivingFrameRiggingV2Plan, 'planDigestSha256'>> {
  const { planDigestSha256: _ignored, ...draft } = structuredClone(value)
  void _ignored
  return draft as unknown as Mutable<Omit<
    LivingFrameRiggingV2Plan,
    'planDigestSha256'
  >>
}

function signPlan(
  draft: Mutable<Omit<LivingFrameRiggingV2Plan, 'planDigestSha256'>>,
): LivingFrameRiggingV2Plan {
  return {
    ...draft,
    planDigestSha256: sha256AuthorityValue(draft),
  } as unknown as LivingFrameRiggingV2Plan
}

function signUnknown(draft: Record<string, unknown>): Record<string, unknown> {
  return {
    ...draft,
    planDigestSha256: sha256AuthorityValue(draft),
  }
}

function mutableAdapter(
  value: LivingFrameRiggingAdapterCandidateRequest,
): Mutable<Omit<
  LivingFrameRiggingAdapterCandidateRequest,
  'requestDigestSha256'
>> {
  const { requestDigestSha256: _ignored, ...draft } = structuredClone(value)
  void _ignored
  return draft as unknown as Mutable<Omit<
    LivingFrameRiggingAdapterCandidateRequest,
    'requestDigestSha256'
  >>
}

function signAdapter(
  draft: Mutable<Omit<
    LivingFrameRiggingAdapterCandidateRequest,
    'requestDigestSha256'
  >>,
): LivingFrameRiggingAdapterCandidateRequest {
  return {
    ...draft,
    requestDigestSha256: sha256AuthorityValue(draft),
  } as unknown as LivingFrameRiggingAdapterCandidateRequest
}

function signUnknownRequest(
  draft: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...draft,
    requestDigestSha256: sha256AuthorityValue(draft),
  }
}
