import type {
  LivingFrameBlenderFixedAdapterMesh,
} from '../../src/types/living-frame-blender-fixed-adapter-internal-test'
import type {
  LivingFrameRigActionPlan,
} from '../../src/types/living-frame-rig-action'
import type {
  LivingFrameRiggingAdapterCandidateRequest,
} from '../../src/types/living-frame-rigging-adapter-candidate'
import {
  LIVING_FRAME_RIGGING_V2_CAPABILITIES,
} from '../../src/types/living-frame-rigging-v2'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameComponentGeometry,
} from './living-frame-component-geometry'
import {
  compileLivingFrameComponentRig,
} from './living-frame-component-rig'
import {
  compileLivingFrameDeterministicMotion,
} from './living-frame-deterministic-motion'
import {
  compileLivingFrameRigActionPlan,
} from './living-frame-rig-action'
import {
  compileLivingFrameRiggingAdapterCandidate,
} from './living-frame-rigging-adapter-candidate'
import {
  compileLivingFrameRiggingDirection,
} from './living-frame-rigging-direction'
import {
  compileLivingFrameRiggingV2Plan,
} from './living-frame-rigging-v2'

export interface LivingFrameBlenderFixedAdapterPrivateFixture {
  readonly candidateRequest:
    LivingFrameRiggingAdapterCandidateRequest
  readonly actionPlan: LivingFrameRigActionPlan
  readonly mesh: LivingFrameBlenderFixedAdapterMesh
}

export function buildLivingFrameBlenderFixedAdapterPrivateFixture():
LivingFrameBlenderFixedAdapterPrivateFixture {
  const sceneId = 'scene.rigging.blender.private-fixture'
  const outputFrameId = 'output-frame.rigging.blender.private-fixture'
  const outputFrameDigestSha256 = digest(outputFrameId)
  const masterTimingPlanId = 'master-timing.rigging.blender.private-fixture'
  const masterTimingPlanDigestSha256 = digest(masterTimingPlanId)
  const motionBundle = compileLivingFrameDeterministicMotion({
    timingExpectation: {
      masterTimingPlanId,
      masterTimingPlanDigestSha256,
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
        restorationExpectation: 'required_return_to_initial',
        keyframes: [
          { frame: 12, value: 0, easingToNext: 'ease_in_out_cubic' },
          { frame: 42, value: 45, easingToNext: 'settle_out' },
          { frame: 71, value: 0, easingToNext: 'hold' },
        ],
      },
      {
        trackId: 'track.camera.scale',
        order: 1,
        motionGroupId: 'motion.camera',
        componentId: 'component.virtual-camera',
        property: 'scale_uniform',
        role: 'camera',
        restorationExpectation: 'not_applicable',
        keyframes: [
          { frame: 12, value: 1, easingToNext: 'ease_in_out_cubic' },
          { frame: 71, value: 1.02, easingToNext: 'hold' },
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
        rect: { x: 0, y: 0, width: 1, height: 1 },
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
        rect: { x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
        pivot: { x: 0.35, y: 0.5 },
        parentComponentId: 'component.background',
        anchorComponentId: 'component.background',
        anchorPoint: { x: 0.5, y: 0.5 },
        collisionPolicy: 'avoid_all_protected_regions',
        transparencyExpectation: 'still_alpha_required',
        alphaSourceExpectation: 'postprocessed_still_mask_requires_qa',
        maskExpectation: 'still_alpha_artifact_required',
      },
      {
        componentId: 'component.virtual-camera',
        order: 2,
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
    occlusionExpectations: [{
      relationId: 'occlusion.primary-over-background',
      order: 0,
      kind: 'in_front_of',
      foregroundComponentId: 'component.primary',
      backgroundComponentId: 'component.background',
      downstreamDepthTransitionCompilationRequired: false,
    }],
  })
  const componentRig = compileLivingFrameComponentRig({
    geometryBundle,
    motionBundle,
  })
  const requiredCapabilities = LIVING_FRAME_RIGGING_V2_CAPABILITIES.filter(
    (capability) => [
      'rigid_transform',
      'parent_hierarchy',
      'bone_chain',
      'joint_limits',
      'inverse_kinematics',
      'mesh_deformation',
      'skin_weights',
      'depth_camera',
      'transparent_layer_output',
    ].includes(capability),
  )
  const direction = compileLivingFrameRiggingDirection({
    geometryBundle,
    motionBundle,
    componentRig,
    compiledIntentRef: expectation('compiled-intent.rigging.blender'),
    semanticScenePlanRef: expectation('semantic-scene.rigging.blender'),
    headIntelligenceEvidence: {
      reasoningRole: 'kimi_k3_main_edit_agent',
      reasoningAttemptRef: expectation('reasoning.rigging.blender'),
      structuredOutputRef: expectation('structured.rigging.blender'),
      visualUnderstandingEvidenceRefs: [
        expectation('visual.parts.rigging.blender'),
        expectation('visual.pivots.rigging.blender'),
      ],
      rawChatPassedToRigWorker: false,
      rawModelCodeExecutionAllowed: false,
    },
    narrativeDecision: {
      purpose: 'demonstrate_articulated_action',
      visualVerb: 'reach',
      directedMotionSummary:
        'Direct one articulated reach and restore the component to its approved initial pose',
      importance: 'important',
      attentionPriority: 'shared',
      primaryFocalComponentId: 'component.primary',
      animateMeaningNotVocabulary: true,
      onePrimaryMotionAtATime: true,
    },
    motionArc: [
      phase(0, 'prepare', 'prepare_space_and_attention'),
      phase(1, 'activate', 'begin_primary_action'),
      phase(2, 'demonstrate', 'communicate_narrative_relationship'),
      phase(3, 'resolve', 'complete_primary_action'),
      phase(4, 'settle', 'restore_or_hold_stable_state'),
    ],
    designDecision: {
      rigMode: 'armature_2_5d_character',
      requiredCapabilities,
      recommendedBackend: 'blender_headless_candidate',
      simplerNativeRouteConsidered: true,
      simplerNativeRouteSufficient: false,
      externalRuntimeJustification:
        'armature_ik_skinning_or_2_5d_required',
      partDecompositionRequired: true,
      skeletalDeformationRequired: true,
      inverseKinematicsRequired: true,
      depthCameraRequired: true,
      transparentComponentOutputRequired: true,
      finalCanvasDelegatedToRigTool: false,
    },
    riskDecision: {
      thinStructureRisk: 'medium',
      occludedPartRisk: 'low',
      deformationRisk: 'medium',
      identityOrSilhouetteRisk: 'medium',
      manualRigReviewRequired: false,
      lowConfidenceMayAutoExecute: false,
    },
  })
  const riggingPlan = compileLivingFrameRiggingV2Plan({
    geometryBundle,
    motionBundle,
    componentRig,
    riggingDirection: direction,
    rigMode: 'armature_2_5d_character',
    partBindings: [
      part(0, 'part.background', 'component.background', 'static_anchor', false),
      part(1, 'part.primary', 'component.primary', 'deformable_part', true),
    ],
    bones: [
      {
        order: 0,
        boneId: 'bone.upper',
        componentId: 'component.primary',
        parentBoneId: null,
        head: { x: 0.28, y: 0.5 },
        tail: { x: 0.5, y: 0.5 },
        restLengthNormalized: 0.22,
        restAngleDegrees: 0,
        deformComponent: true,
      },
      {
        order: 1,
        boneId: 'bone.lower',
        componentId: 'component.primary',
        parentBoneId: 'bone.upper',
        head: { x: 0.5, y: 0.5 },
        tail: { x: 0.72, y: 0.5 },
        restLengthNormalized: 0.22,
        restAngleDegrees: 0,
        deformComponent: true,
      },
    ],
    joints: [
      {
        order: 0,
        jointId: 'joint.upper',
        boneId: 'bone.upper',
        pivot: { x: 0.28, y: 0.5 },
        minimumAngleDegrees: -70,
        maximumAngleDegrees: 70,
        restAngleDegrees: 0,
        allowStretching: false,
        stiffnessNormalized: 0.9,
      },
      {
        order: 1,
        jointId: 'joint.lower',
        boneId: 'bone.lower',
        pivot: { x: 0.5, y: 0.5 },
        minimumAngleDegrees: -145,
        maximumAngleDegrees: 20,
        restAngleDegrees: 0,
        allowStretching: false,
        stiffnessNormalized: 0.7,
      },
    ],
    controls: [
      {
        order: 0,
        controlId: 'control.root',
        kind: 'root',
        targetBoneId: 'bone.upper',
        position: { x: 0.28, y: 0.5 },
      },
      {
        order: 1,
        controlId: 'control.ik',
        kind: 'ik_target',
        targetBoneId: 'bone.lower',
        position: { x: 0.72, y: 0.5 },
      },
    ],
    constraints: [
      {
        order: 0,
        constraintId: 'constraint.upper.limit',
        kind: 'limit_rotation',
        sourceRefId: 'bone.upper',
        targetRefId: 'control.root',
        influenceNormalized: 1,
        minimumValue: -70,
        maximumValue: 70,
      },
      {
        order: 1,
        constraintId: 'constraint.lower.ik',
        kind: 'ik_target',
        sourceRefId: 'bone.lower',
        targetRefId: 'control.ik',
        influenceNormalized: 1,
        minimumValue: null,
        maximumValue: null,
      },
    ],
    ikChains: [{
      order: 0,
      chainId: 'ik.primary',
      rootBoneId: 'bone.upper',
      effectorBoneId: 'bone.lower',
      targetControlId: 'control.ik',
      poleControlId: null,
      chainLength: 2,
      solverIterationLimit: 64,
      toleranceNormalized: 0.001,
    }],
    meshBindings: [{
      order: 0,
      meshId: 'mesh.primary.blender-private',
      componentId: 'component.primary',
      topology: 'skinned_plane_2_5d',
      topologyArtifactRef: artifact('mesh.primary.blender-private.topology'),
      vertexCount: 256,
      triangleCount: 450,
      weightMapArtifactRef: artifact('mesh.primary.blender-private.weights'),
      rigidityMapArtifactRef: null,
      animatedStackingOrderRequired: false,
    }],
    mechanicalLinkages: [],
    secondaryMotionGroups: [],
  })
  const candidateRequest = compileLivingFrameRiggingAdapterCandidate({
    approvedSnapshotRef: expectation('approved-snapshot.rigging.blender'),
    selectedSceneRef: expectation('selected-scene.rigging.blender'),
    plannedWorkItemRef: expectation('planned-work.rigging.blender'),
    riggingDirection: direction,
    riggingPlan,
  })
  const actionPlan = compileLivingFrameRigActionPlan({
    riggingPlan,
    narrativeActionId: 'action.reach-and-restore',
    narrativeActionSummary:
      'Move the approved IK control through one readable reach and restore the initial pose',
    finalPosePolicy: 'restore_initial',
    tracks: [{
      order: 0,
      trackId: 'rig-action.control.ik',
      property: 'control_position_normalized',
      targetRefId: 'control.ik',
      role: 'primary',
      keyframes: [
        {
          order: 0,
          frame: 12,
          scalarValue: null,
          pointValue: { x: 0.72, y: 0.5, z: 0 },
          interpolationToNext: 'ease_in_out_cubic',
        },
        {
          order: 1,
          frame: 42,
          scalarValue: null,
          pointValue: { x: 0.56, y: 0.24, z: 0 },
          interpolationToNext: 'bezier_settle',
        },
        {
          order: 2,
          frame: 71,
          scalarValue: null,
          pointValue: { x: 0.72, y: 0.5, z: 0 },
          interpolationToNext: 'linear',
        },
      ],
    }],
  })
  return {
    candidateRequest,
    actionPlan,
    mesh: buildSkinnedGridMesh(),
  }
}

function buildSkinnedGridMesh(): LivingFrameBlenderFixedAdapterMesh {
  const columns = 16
  const rows = 16
  const vertices: LivingFrameBlenderFixedAdapterMesh['vertices'][number][] = []
  const weights: LivingFrameBlenderFixedAdapterMesh['weights'][number][] = []
  for (let row = 0; row < rows; row += 1) {
    const v = row / (rows - 1)
    for (let column = 0; column < columns; column += 1) {
      const u = column / (columns - 1)
      const x = 0.25 + u * 0.5
      const y = 0.44 + v * 0.12
      vertices.push({
        position: { x, y, z: 0 },
        uv: { x: u, y: v },
      })
      const transition = Math.min(1, Math.max(0, (x - 0.44) / 0.12))
      weights.push(transition <= 0
        ? [{ boneId: 'bone.upper', weight: 1 }]
        : transition >= 1
          ? [{ boneId: 'bone.lower', weight: 1 }]
          : [
              { boneId: 'bone.upper', weight: 1 - transition },
              { boneId: 'bone.lower', weight: transition },
            ])
    }
  }
  const triangles: [number, number, number][] = []
  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      const topLeft = row * columns + column
      const topRight = topLeft + 1
      const bottomLeft = topLeft + columns
      const bottomRight = bottomLeft + 1
      triangles.push(
        [topLeft, bottomLeft, topRight],
        [topRight, bottomLeft, bottomRight],
      )
    }
  }
  return {
    meshId: 'mesh.primary.blender-private',
    vertices,
    triangles,
    weights,
  }
}

function phase(
  order: number,
  value:
    | 'prepare'
    | 'activate'
    | 'demonstrate'
    | 'resolve'
    | 'settle',
  phasePurpose:
    | 'prepare_space_and_attention'
    | 'begin_primary_action'
    | 'communicate_narrative_relationship'
    | 'complete_primary_action'
    | 'restore_or_hold_stable_state',
) {
  return {
    order,
    phase: value,
    phasePurpose,
    masterTimingOwnsExactFrames: true as const,
  }
}

function part(
  order: number,
  partId: string,
  componentId: string,
  partRole: 'static_anchor' | 'deformable_part',
  deformable: boolean,
) {
  return {
    order,
    partId,
    componentId,
    partRole,
    deformable,
    partProposalConfidence: 0.99,
    manualPartReviewRequired: false,
    occludedAreaReconstructionRequired: false,
    decompositionEvidenceRef: expectation(`part-evidence.${order}`),
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

function artifact(id: string) {
  return {
    artifactId: id,
    artifactVersion: 'v1',
    artifactDigestSha256: digest(id),
    contentType: 'application/json' as const,
    currentArtifactRevalidationRequired: true as const,
  }
}

function digest(value: string): string {
  return sha256AuthorityValue(value)
}
