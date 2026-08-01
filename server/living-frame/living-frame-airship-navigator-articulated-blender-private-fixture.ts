import type {
  LivingFrameBlenderFixedAdapterMesh,
} from '../../src/types/living-frame-blender-fixed-adapter-internal-test'
import type {
  LivingFrameCharacterAnimationRouteDecision,
  LivingFrameCharacterAnimationSuitabilityEvidence,
} from '../../src/types/living-frame-character-animation-route'
import type {
  LivingFrameComponentGeometryBundle,
  LivingFrameNormalizedPoint,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameRigActionPlan,
} from '../../src/types/living-frame-rig-action'
import type {
  LivingFrameRiggingAdapterCandidateRequest,
} from '../../src/types/living-frame-rigging-adapter-candidate'
import type {
  LivingFrameRiggingV2Bone,
  LivingFrameRiggingV2Capability,
  LivingFrameRiggingV2Joint,
} from '../../src/types/living-frame-rigging-v2'
import {
  LIVING_FRAME_RIGGING_V2_CAPABILITIES,
} from '../../src/types/living-frame-rigging-v2'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  LIVING_FRAME_AIRSHIP_NAVIGATOR_ARTICULATED_PARTS,
} from './living-frame-airship-navigator-articulated-puppet-sheet-internal-test'
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
  compileLivingFrameCharacterAnimationRouteDecision,
} from './living-frame-character-animation-route'
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

const SCENE_ID =
  'scene.airship-navigator.spyglass-survey' as const
const BACKGROUND_COMPONENT_ID =
  'airship.navigator.background' as const
const CHARACTER_COMPONENT_ID =
  'airship.navigator.character' as const
const CAMERA_COMPONENT_ID =
  'airship.navigator.virtual-camera' as const
const OUTPUT_FRAME_ID =
  'output-frame.airship-navigator.16-9' as const
const MASTER_TIMING_PLAN_ID =
  'master-timing.airship-navigator.spyglass-survey' as const
const CHARACTER_LAYOUT_SCALE = 0.52
const CHARACTER_LAYOUT_CENTER = 0.5
const RENDERED_PROTECTED_FACE_RECT =
  Object.freeze({
    x: 0.405,
    y: 0.04,
    width: 0.13,
    height: 0.24,
  })

const ARM_POINTS = Object.freeze({
  shoulder: point(0.493, 0.315),
  elbow: point(0.521, 0.526),
  wrist: point(0.534, 0.702),
  handTail: point(0.54, 0.86),
})

export interface LivingFrameAirshipNavigatorArticulatedBlenderPrivateFixture {
  readonly sceneId: typeof SCENE_ID
  readonly componentId:
    typeof CHARACTER_COMPONENT_ID
  readonly characterAnimationEvidence:
    LivingFrameCharacterAnimationSuitabilityEvidence
  readonly characterAnimationRouteDecision:
    LivingFrameCharacterAnimationRouteDecision
  readonly candidateRequest:
    LivingFrameRiggingAdapterCandidateRequest
  readonly actionPlan:
    LivingFrameRigActionPlan
  readonly componentGeometryBundle:
    LivingFrameComponentGeometryBundle
  readonly mesh:
    LivingFrameBlenderFixedAdapterMesh
  readonly reviewedTopology: {
    readonly atlasPartCount: 8
    readonly disconnectedMeshIslandCount: 8
    readonly rigidWeightedVertexCount: 32
    readonly triangleCount: 16
    readonly armChainBoneIds: readonly [
      'bone.navigator.upper-arm',
      'bone.navigator.forearm',
      'bone.navigator.hand',
    ]
    readonly protectedFaceRectNormalized: {
      readonly x: number
      readonly y: number
      readonly width: number
      readonly height: number
    }
    readonly genericWholeImageDeformationUsed:
      false
  }
}

export function buildLivingFrameAirshipNavigatorArticulatedBlenderPrivateFixture():
LivingFrameAirshipNavigatorArticulatedBlenderPrivateFixture {
  if (arguments.length !== 0) {
    throw new Error(
      'Airship navigator articulated Blender fixture accepts no caller input.',
    )
  }
  const outputFrameDigestSha256 =
    digest(OUTPUT_FRAME_ID)
  const masterTimingPlanDigestSha256 =
    digest(MASTER_TIMING_PLAN_ID)
  const motionBundle =
    compileLivingFrameDeterministicMotion({
      timingExpectation: {
        masterTimingPlanId:
          MASTER_TIMING_PLAN_ID,
        masterTimingPlanDigestSha256,
        outputFrameId: OUTPUT_FRAME_ID,
        outputFrameDigestSha256,
        sceneId: SCENE_ID,
        sceneStartFrame: 12,
        sceneEndFrame: 71,
        fpsNumerator: 30,
        fpsDenominator: 1,
        timingAuthorityRevalidationRequired:
          true,
      },
      tracks: [
        {
          trackId:
            'track.airship.navigator.character-settle',
          order: 0,
          motionGroupId:
            'motion.airship.navigator.primary',
          componentId:
            CHARACTER_COMPONENT_ID,
          property:
            'rotation_degrees',
          role: 'primary',
          restorationExpectation:
            'required_return_to_initial',
          keyframes: [
            {
              frame: 12,
              value: 0,
              easingToNext:
                'ease_in_out_cubic',
            },
            {
              frame: 42,
              value: 0.35,
              easingToNext:
                'settle_out',
            },
            {
              frame: 71,
              value: 0,
              easingToNext: 'hold',
            },
          ],
        },
        {
          trackId:
            'track.airship.navigator.camera-scale',
          order: 1,
          motionGroupId:
            'motion.airship.navigator.camera',
          componentId:
            CAMERA_COMPONENT_ID,
          property: 'scale_uniform',
          role: 'camera',
          restorationExpectation:
            'not_applicable',
          keyframes: [
            {
              frame: 12,
              value: 1,
              easingToNext:
                'ease_in_out_cubic',
            },
            {
              frame: 71,
              value: 1.015,
              easingToNext: 'hold',
            },
          ],
        },
      ],
    })
  const geometryBundle =
    compileLivingFrameComponentGeometry({
      outputFrameExpectation: {
        outputFrameId:
          OUTPUT_FRAME_ID,
        outputFrameDigestSha256,
        widthPixels: 1_920,
        heightPixels: 1_080,
        pixelAspectRatioNumerator: 1,
        pixelAspectRatioDenominator: 1,
        confirmedOutputFrameRevalidationRequired:
          true,
      },
      motionBundle,
      safeRegions: [],
      components: [
        {
          componentId:
            BACKGROUND_COMPONENT_ID,
          order: 0,
          kind: 'visual_component',
          role: 'opaque_background_plate',
          focalRole: 'static_anchor',
          depthBand: 'background',
          rect: {
            x: 0,
            y: 0,
            width: 1,
            height: 1,
          },
          pivot: {
            x: 0.5,
            y: 0.5,
          },
          parentComponentId: null,
          anchorComponentId: null,
          anchorPoint: {
            x: 0.5,
            y: 0.5,
          },
          collisionPolicy:
            'base_layer_coverage',
          transparencyExpectation:
            'opaque_plate',
          alphaSourceExpectation:
            'opaque_plate',
          maskExpectation: 'opaque',
        },
        {
          componentId:
            CHARACTER_COMPONENT_ID,
          order: 1,
          kind: 'visual_component',
          role: 'primary_subject',
          focalRole: 'primary',
          depthBand: 'subject_plane',
          rect: layoutRect(
            0.3,
            0.02,
            0.4,
            0.94,
          ),
          pivot: point(
            0.455,
            0.29,
          ),
          parentComponentId:
            BACKGROUND_COMPONENT_ID,
          anchorComponentId:
            BACKGROUND_COMPONENT_ID,
          anchorPoint: {
            x: 0.5,
            y: 0.5,
          },
          collisionPolicy:
            'avoid_all_protected_regions',
          transparencyExpectation:
            'still_alpha_required',
          alphaSourceExpectation:
            'postprocessed_still_mask_requires_qa',
          maskExpectation:
            'still_alpha_artifact_required',
        },
        {
          componentId:
            CAMERA_COMPONENT_ID,
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
        relationId:
          'occlusion.airship-navigator-over-background',
        order: 0,
        kind: 'in_front_of',
        foregroundComponentId:
          CHARACTER_COMPONENT_ID,
        backgroundComponentId:
          BACKGROUND_COMPONENT_ID,
        downstreamDepthTransitionCompilationRequired:
          false,
      }],
    })
  const componentRig =
    compileLivingFrameComponentRig({
      geometryBundle,
      motionBundle,
    })
  const bones = buildBones()
  const joints = buildJoints(bones)
  const requiredCapabilities =
    LIVING_FRAME_RIGGING_V2_CAPABILITIES
      .filter((capability) =>
        AIRSHIP_NAVIGATOR_REQUIRED_CAPABILITIES
          .includes(capability))
  const direction =
    compileLivingFrameRiggingDirection({
      geometryBundle,
      motionBundle,
      componentRig,
      compiledIntentRef:
        expectation(
          'compiled-intent.airship-navigator.spyglass-survey',
        ),
      semanticScenePlanRef:
        expectation(
          'semantic-scene.airship-navigator.spyglass-survey',
        ),
      headIntelligenceEvidence: {
        reasoningRole:
          'kimi_k3_main_edit_agent',
        reasoningAttemptRef:
          expectation(
            'reasoning.airship-navigator.rig-direction',
          ),
        structuredOutputRef:
          expectation(
            'structured.airship-navigator.rig-direction',
          ),
        visualUnderstandingEvidenceRefs: [
          expectation(
            'visual.airship-navigator.eight-separated-parts',
          ),
          expectation(
            'visual.airship-navigator.reviewed-joint-sockets',
          ),
          expectation(
            'visual.airship-navigator.face-safe-path',
          ),
        ],
        rawChatPassedToRigWorker:
          false,
        rawModelCodeExecutionAllowed:
          false,
      },
      narrativeDecision: {
        purpose:
          'demonstrate_articulated_action',
        visualVerb: 'reach',
        directedMotionSummary:
          'Extend the separated spyglass arm toward the right horizon while the face and body remain stable',
        importance: 'important',
        attentionPriority: 'shared',
        primaryFocalComponentId:
          CHARACTER_COMPONENT_ID,
        animateMeaningNotVocabulary:
          true,
        onePrimaryMotionAtATime:
          true,
      },
      motionArc: [
        phase(
          0,
          'prepare',
          'prepare_space_and_attention',
        ),
        phase(
          1,
          'activate',
          'begin_primary_action',
        ),
        phase(
          2,
          'demonstrate',
          'communicate_narrative_relationship',
        ),
        phase(
          3,
          'resolve',
          'complete_primary_action',
        ),
        phase(
          4,
          'settle',
          'restore_or_hold_stable_state',
        ),
      ],
      designDecision: {
        rigMode:
          'armature_2_5d_character',
        requiredCapabilities,
        recommendedBackend:
          'blender_headless_candidate',
        simplerNativeRouteConsidered:
          true,
        simplerNativeRouteSufficient:
          false,
        externalRuntimeJustification:
          'armature_ik_skinning_or_2_5d_required',
        partDecompositionRequired:
          true,
        skeletalDeformationRequired:
          true,
        inverseKinematicsRequired:
          true,
        depthCameraRequired: true,
        transparentComponentOutputRequired:
          true,
        finalCanvasDelegatedToRigTool:
          false,
      },
      riskDecision: {
        thinStructureRisk: 'medium',
        occludedPartRisk: 'low',
        deformationRisk: 'low',
        identityOrSilhouetteRisk:
          'medium',
        manualRigReviewRequired:
          false,
        lowConfidenceMayAutoExecute:
          false,
      },
    })
  const riggingPlan =
    compileLivingFrameRiggingV2Plan({
      geometryBundle,
      motionBundle,
      componentRig,
      riggingDirection: direction,
      rigMode:
        'armature_2_5d_character',
      partBindings: [
        rigPart(
          0,
          'part.airship-navigator.background',
          BACKGROUND_COMPONENT_ID,
          'static_anchor',
          false,
        ),
        rigPart(
          1,
          'part.airship-navigator.character',
          CHARACTER_COMPONENT_ID,
          'deformable_part',
          true,
        ),
      ],
      bones,
      joints,
      controls: [
        {
          order: 0,
          controlId:
            'control.airship-navigator.root',
          kind: 'root',
          targetBoneId:
            'bone.navigator.root',
          position: point(
            0.455,
            0.29,
          ),
        },
        {
          order: 1,
          controlId:
            'control.airship-navigator.hand-ik',
          kind: 'ik_target',
          targetBoneId:
            'bone.navigator.hand',
          position:
            ARM_POINTS.handTail,
        },
      ],
      constraints: [
        {
          order: 0,
          constraintId:
            'constraint.airship-navigator.upper-arm-limit',
          kind: 'limit_rotation',
          sourceRefId:
            'bone.navigator.upper-arm',
          targetRefId:
            'control.airship-navigator.root',
          influenceNormalized: 1,
          minimumValue: -95,
          maximumValue: 65,
        },
        {
          order: 1,
          constraintId:
            'constraint.airship-navigator.hand-ik',
          kind: 'ik_target',
          sourceRefId:
            'bone.navigator.hand',
          targetRefId:
            'control.airship-navigator.hand-ik',
          influenceNormalized: 1,
          minimumValue: null,
          maximumValue: null,
        },
      ],
      ikChains: [{
        order: 0,
        chainId:
          'ik.airship-navigator.spyglass-arm',
        rootBoneId:
          'bone.navigator.upper-arm',
        effectorBoneId:
          'bone.navigator.hand',
        targetControlId:
          'control.airship-navigator.hand-ik',
        poleControlId: null,
        chainLength: 3,
        solverIterationLimit: 96,
        toleranceNormalized:
          0.0005,
      }],
      meshBindings: [{
        order: 0,
        meshId:
          'mesh.airship-navigator.eight-part-atlas',
        componentId:
          CHARACTER_COMPONENT_ID,
        topology:
          'skinned_plane_2_5d',
        topologyArtifactRef:
          artifact(
            'mesh.airship-navigator.eight-part-atlas.topology',
          ),
        vertexCount: 32,
        triangleCount: 16,
        weightMapArtifactRef:
          artifact(
            'mesh.airship-navigator.eight-part-atlas.rigid-weights',
          ),
        rigidityMapArtifactRef:
          null,
        animatedStackingOrderRequired:
          false,
      }],
      mechanicalLinkages: [],
      secondaryMotionGroups: [],
    })
  const candidateRequest =
    compileLivingFrameRiggingAdapterCandidate({
      approvedSnapshotRef:
        expectation(
          'approved-snapshot.airship-navigator.private-rig',
        ),
      selectedSceneRef:
        expectation(
          'selected-scene.airship-navigator.spyglass-survey',
        ),
      plannedWorkItemRef:
        expectation(
          'planned-work.airship-navigator.blender-rig',
        ),
      riggingDirection: direction,
      riggingPlan,
    })
  const actionPlan =
    compileLivingFrameRigActionPlan({
      riggingPlan,
      narrativeActionId:
        'action.airship-navigator.extend-spyglass-and-restore',
      narrativeActionSummary:
        'Extend the approved hand IK control to the right horizon and restore the reviewed initial pose',
      finalPosePolicy:
        'restore_initial',
      tracks: [{
        order: 0,
        trackId:
          'rig-action.airship-navigator.hand-ik',
        property:
          'control_position_normalized',
        targetRefId:
          'control.airship-navigator.hand-ik',
        role: 'primary',
        keyframes: [
          actionPoint(
            0,
            12,
            0.54,
            0.86,
            'ease_in_out_cubic',
          ),
          actionPoint(
            1,
            20,
            0.57,
            0.76,
            'ease_in_out_cubic',
          ),
          actionPoint(
            2,
            42,
            0.66,
            0.5,
            'bezier_settle',
          ),
          actionPoint(
            3,
            64,
            0.66,
            0.5,
            'ease_in_out_cubic',
          ),
          actionPoint(
            4,
            68,
            0.59,
            0.7,
            'ease_in_out_cubic',
          ),
          actionPoint(
            5,
            71,
            0.54,
            0.86,
            'linear',
          ),
        ],
      }],
    })
  const characterAnimationEvidence =
    buildCharacterAnimationEvidence()
  const characterAnimationRouteDecision =
    compileLivingFrameCharacterAnimationRouteDecision(
      characterAnimationEvidence,
    )
  if (
    characterAnimationRouteDecision
      .decision.selectedRoute
      !== 'blender_articulated_2_5d'
    || !characterAnimationRouteDecision
      .decision.blenderAdmissionAllowed
  ) {
    throw new Error(
      'Airship navigator articulated fixture did not qualify for Blender.',
    )
  }
  return {
    sceneId: SCENE_ID,
    componentId:
      CHARACTER_COMPONENT_ID,
    characterAnimationEvidence,
    characterAnimationRouteDecision,
    candidateRequest,
    actionPlan,
    componentGeometryBundle:
      geometryBundle,
    mesh: buildEightPartAtlasMesh(),
    reviewedTopology: {
      atlasPartCount: 8,
      disconnectedMeshIslandCount: 8,
      rigidWeightedVertexCount: 32,
      triangleCount: 16,
      armChainBoneIds: [
        'bone.navigator.upper-arm',
        'bone.navigator.forearm',
        'bone.navigator.hand',
      ],
      protectedFaceRectNormalized:
        RENDERED_PROTECTED_FACE_RECT,
      genericWholeImageDeformationUsed:
        false,
    },
  }
}

const AIRSHIP_NAVIGATOR_REQUIRED_CAPABILITIES:
  readonly LivingFrameRiggingV2Capability[] =
  [
    'rigid_transform',
    'parent_hierarchy',
    'bone_chain',
    'joint_limits',
    'inverse_kinematics',
    'mesh_deformation',
    'skin_weights',
    'depth_camera',
    'transparent_layer_output',
  ] as const satisfies
    readonly LivingFrameRiggingV2Capability[]

function buildCharacterAnimationEvidence():
LivingFrameCharacterAnimationSuitabilityEvidence {
  return {
    evidenceId:
      'evidence.airship-navigator.reviewed-articulated-parts',
    sceneId: SCENE_ID,
    componentId:
      CHARACTER_COMPONENT_ID,
    sourceArtifactId:
      'lf.airship-navigator.articulated-puppet-sheet.v1',
    illustrativeNotArchivalEvidence:
      true,
    componentTopology:
      'separated_articulated_limb_parts',
    requestedMotionMagnitude:
      'moderate',
    desiredPoseRequiresNewPixels:
      false,
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
    referenceIdentityAvailable: true,
    poseControlAvailable: true,
    deterministicRigidPivotAvailable:
      true,
    componentMotionExposesHiddenSourcePixels:
      false,
    exposedSourcePlateReconstructedAndReviewed:
      true,
    componentBoundaryDecontaminatedAndReviewed:
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

function buildBones():
LivingFrameRiggingV2Bone[] {
  return [
    bone(
      0,
      'bone.navigator.root',
      null,
      point(0.455, 0.29),
      point(0.455, 0.82),
    ),
    bone(
      1,
      'bone.navigator.head',
      'bone.navigator.root',
      point(0.455, 0.29),
      point(0.455, 0.1),
    ),
    bone(
      2,
      'bone.navigator.hair',
      'bone.navigator.head',
      point(0.417, 0.163),
      point(0.42, 0.28),
    ),
    bone(
      3,
      'bone.navigator.coat',
      'bone.navigator.root',
      point(0.344, 0.483),
      point(0.36, 0.75),
    ),
    bone(
      4,
      'bone.navigator.upper-arm',
      'bone.navigator.root',
      ARM_POINTS.shoulder,
      ARM_POINTS.elbow,
    ),
    bone(
      5,
      'bone.navigator.forearm',
      'bone.navigator.upper-arm',
      ARM_POINTS.elbow,
      ARM_POINTS.wrist,
    ),
    bone(
      6,
      'bone.navigator.hand',
      'bone.navigator.forearm',
      ARM_POINTS.wrist,
      ARM_POINTS.handTail,
    ),
    bone(
      7,
      'bone.navigator.prop',
      'bone.navigator.hand',
      point(0.535, 0.78),
      point(0.58, 0.68),
    ),
  ]
}

function buildJoints(
  bones: readonly LivingFrameRiggingV2Bone[],
): LivingFrameRiggingV2Joint[] {
  const limits = new Map<string, readonly [
    number,
    number,
    number,
    number,
  ]>([
    [
      'bone.navigator.root',
      [-1, 1, 0, 1],
    ],
    [
      'bone.navigator.head',
      [-8, 8, 0, 0.92],
    ],
    [
      'bone.navigator.hair',
      [-12, 12, 0, 0.55],
    ],
    [
      'bone.navigator.coat',
      [-10, 10, 0, 0.6],
    ],
    [
      'bone.navigator.upper-arm',
      [-95, 65, 0, 0.88],
    ],
    [
      'bone.navigator.forearm',
      [-155, 20, 0, 0.74],
    ],
    [
      'bone.navigator.hand',
      [-35, 35, 0, 0.82],
    ],
    [
      'bone.navigator.prop',
      [-12, 12, 0, 0.9],
    ],
  ])
  return bones.map((item, order) => {
    const values =
      limits.get(item.boneId)
    if (!values) {
      throw new Error(
        'Airship navigator joint limits are unavailable.',
      )
    }
    return {
      order,
      jointId:
        `joint.${item.boneId.slice('bone.'.length)}`,
      boneId: item.boneId,
      pivot: {
        ...item.head,
      },
      minimumAngleDegrees:
        values[0],
      maximumAngleDegrees:
        values[1],
      restAngleDegrees:
        values[2],
      allowStretching: false,
      stiffnessNormalized:
        values[3],
    }
  })
}

function buildEightPartAtlasMesh():
LivingFrameBlenderFixedAdapterMesh {
  const vertices:
    LivingFrameBlenderFixedAdapterMesh['vertices'][number][] = []
  const triangles:
    [number, number, number][] = []
  const weights:
    LivingFrameBlenderFixedAdapterMesh['weights'][number][] = []
  for (
    const item
    of LIVING_FRAME_AIRSHIP_NAVIGATOR_ARTICULATED_PARTS
  ) {
    const source =
      item.sourceRectPixels
    const destination =
      item.destinationRectNormalized
    const u0 =
      source.x / 1_536
    const v0 =
      source.y / 1_024
    const u1 =
      (source.x + source.width)
      / 1_536
    const v1 =
      (source.y + source.height)
      / 1_024
    const x0 =
      destination.x
    const y0 =
      destination.y
    const x1 =
      destination.x
      + destination.width
    const y1 =
      destination.y
      + destination.height
    const offset =
      vertices.length
    vertices.push(
      vertex(
        x0,
        y0,
        destination.depth,
        u0,
        v0,
      ),
      vertex(
        x1,
        y0,
        destination.depth,
        u1,
        v0,
      ),
      vertex(
        x0,
        y1,
        destination.depth,
        u0,
        v1,
      ),
      vertex(
        x1,
        y1,
        destination.depth,
        u1,
        v1,
      ),
    )
    triangles.push(
      [
        offset,
        offset + 2,
        offset + 1,
      ],
      [
        offset + 1,
        offset + 2,
        offset + 3,
      ],
    )
    for (
      let index = 0;
      index < 4;
      index += 1
    ) {
      weights.push([{
        boneId:
          item.assignedBoneId,
        weight: 1,
      }])
    }
  }
  return {
    meshId:
      'mesh.airship-navigator.eight-part-atlas',
    vertices,
    triangles,
    weights,
  }
}

function bone(
  order: number,
  boneId: string,
  parentBoneId: string | null,
  head: LivingFrameNormalizedPoint,
  tail: LivingFrameNormalizedPoint,
): LivingFrameRiggingV2Bone {
  return {
    order,
    boneId,
    componentId:
      CHARACTER_COMPONENT_ID,
    parentBoneId,
    head,
    tail,
    restLengthNormalized:
      Math.hypot(
        tail.x - head.x,
        tail.y - head.y,
      ),
    restAngleDegrees: 0,
    deformComponent: true,
  }
}

function rigPart(
  order: number,
  partId: string,
  componentId: string,
  partRole:
    'static_anchor'
    | 'deformable_part',
  deformable: boolean,
) {
  return {
    order,
    partId,
    componentId,
    partRole,
    deformable,
    partProposalConfidence: 1,
    manualPartReviewRequired:
      false,
    occludedAreaReconstructionRequired:
      false,
    decompositionEvidenceRef:
      expectation(
        `part-evidence.airship-navigator.${order}`,
      ),
  }
}

function actionPoint(
  order: number,
  frame: number,
  x: number,
  y: number,
  interpolationToNext:
    | 'linear'
    | 'ease_in_out_cubic'
    | 'bezier_settle',
) {
  return {
    order,
    frame,
    scalarValue: null,
    pointValue: {
      ...point(x, y),
      z: 0,
    },
    interpolationToNext,
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
    masterTimingOwnsExactFrames:
      true as const,
  }
}

function vertex(
  x: number,
  y: number,
  z: number,
  u: number,
  v: number,
) {
  return {
    position: { x, y, z },
    uv: { x: u, y: v },
  }
}

function point(
  x: number,
  y: number,
): LivingFrameNormalizedPoint {
  return {
    x: scaleLayoutCoordinate(x),
    y: scaleLayoutCoordinate(y),
  }
}

function layoutRect(
  x: number,
  y: number,
  width: number,
  height: number,
): {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
} {
  return {
    x: scaleLayoutCoordinate(x),
    y: scaleLayoutCoordinate(y),
    width: roundNormalized(
      width * CHARACTER_LAYOUT_SCALE,
    ),
    height: roundNormalized(
      height * CHARACTER_LAYOUT_SCALE,
    ),
  }
}

function scaleLayoutCoordinate(
  value: number,
): number {
  return roundNormalized(
    CHARACTER_LAYOUT_CENTER
      + (
        value
        - CHARACTER_LAYOUT_CENTER
      ) * CHARACTER_LAYOUT_SCALE,
  )
}

function roundNormalized(
  value: number,
): number {
  return Math.round(
    value * 1_000_000,
  ) / 1_000_000
}

function expectation(
  id: string,
) {
  return {
    refId: id,
    version: 'v1',
    digestSha256:
      digest(id),
    currentAuthorityRevalidationRequired:
      true as const,
  }
}

function artifact(
  id: string,
) {
  return {
    artifactId: id,
    artifactVersion: 'v1',
    artifactDigestSha256:
      digest(id),
    contentType:
      'application/json' as const,
    currentArtifactRevalidationRequired:
      true as const,
  }
}

function digest(
  value: string,
): string {
  return sha256AuthorityValue(value)
}
