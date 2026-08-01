import assert from 'node:assert/strict'

import type {
  LivingFrameCharacterAnimationSuitabilityEvidence,
} from '../../src/types/living-frame-character-animation-route'
import type {
  LivingFrameMotionSubjectClassification,
} from '../../src/types/living-frame-motion-subject-class-gate'
import {
  compileLivingFrameCharacterAnimationRouteDecision,
} from '../living-frame/living-frame-character-animation-route'
import {
  compileLivingFrameCharacterMotionToolPolicy,
} from '../living-frame/living-frame-character-motion-tool-policy'
import {
  compileLivingFrameMotionSubjectClassGate,
  verifyLivingFrameMotionSubjectClassGate,
} from '../living-frame/living-frame-motion-subject-class-gate'

const motionToolPolicy =
  compileLivingFrameCharacterMotionToolPolicy()

const legacyLivingRigDecision =
  compileLivingFrameCharacterAnimationRouteDecision(
    evidence({
      evidenceId: 'evidence.living-articulated-legacy',
      componentTopology:
        'separated_articulated_limb_parts',
    }),
  )
assert.equal(
  legacyLivingRigDecision.decision.selectedRoute,
  'blender_articulated_2_5d',
)
const blockedLivingRig =
  compileLivingFrameMotionSubjectClassGate({
    gateId: 'gate.living-articulated-legacy',
    classification: classification({
      classificationId:
        'classification.living-articulated-legacy',
      subjectClass: 'living_or_organic_subject',
      humanAnimalPlantOrOtherLivingIndicatorsPresent:
        true,
    }),
    motionToolPolicy,
    routeDecision: legacyLivingRigDecision,
  })
assert.equal(
  blockedLivingRig.routeEvaluation.disposition,
  'blocked_living_subject_rigging',
)
assert.equal(
  blockedLivingRig.routeEvaluation.selectedRouteAdmitted,
  false,
)
assert.equal(
  blockedLivingRig.routeEvaluation.headIntelligenceReplanRequired,
  true,
)
assert.equal(
  blockedLivingRig.hardRules
    .legacyRigEvidenceCanAuthorizeLivingSubjectRuntime,
  false,
)

const completeFrameDecision =
  compileLivingFrameCharacterAnimationRouteDecision(
    evidence({
      evidenceId: 'evidence.living-complete-frame',
      componentTopology:
        'merged_limb_hand_clothing_and_prop_cutout',
      requestedMotionMagnitude: 'large_pose_change',
      desiredPoseRequiresNewPixels: true,
    }),
  )
assert.equal(
  completeFrameDecision.decision.selectedRoute,
  'comfyui_controlled_keyposes',
)
const acceptedCompleteFrame =
  compileLivingFrameMotionSubjectClassGate({
    gateId: 'gate.living-complete-frame',
    classification: classification({
      classificationId:
        'classification.living-complete-frame',
      subjectClass: 'living_or_organic_subject',
      humanAnimalPlantOrOtherLivingIndicatorsPresent:
        true,
    }),
    motionToolPolicy,
    routeDecision: completeFrameDecision,
  })
assert.equal(
  acceptedCompleteFrame.routeEvaluation.disposition,
  'accepted_complete_frame_living_motion',
)
assert.equal(
  acceptedCompleteFrame.routeAdmissionGranted,
  true,
)
assert.equal(
  acceptedCompleteFrame.hardRules
    .acceptedInbetweenFramesMayBeGeneratedOnlyBetweenAcceptedCompletePoses,
  true,
)

const mechanicalRigBlocked =
  compileLivingFrameMotionSubjectClassGate({
    gateId: 'gate.mechanical-owner-spec-pending',
    classification: classification({
      classificationId:
        'classification.mechanical-owner-spec-pending',
      subjectClass: 'rigid_mechanical_object',
      vehicleMachineToolOrRigidMechanismIndicatorsPresent:
        true,
    }),
    motionToolPolicy,
    routeDecision: legacyLivingRigDecision,
  })
assert.equal(
  mechanicalRigBlocked.routeEvaluation.disposition,
  'blocked_pending_owner_mechanical_rig_specification',
)
assert.equal(
  mechanicalRigBlocked.mechanicalRigSpecificationAttached,
  false,
)
assert.equal(
  mechanicalRigBlocked.routeAdmissionGranted,
  false,
)

const nonlivingSupportDecision =
  compileLivingFrameCharacterAnimationRouteDecision(
    evidence({
      evidenceId: 'evidence.nonliving-rigid-support',
      componentTopology: 'single_rigid_cutout',
    }),
  )
assert.equal(
  nonlivingSupportDecision.decision.selectedRoute,
  'pixijs_rigid_cutout',
)
const acceptedNonlivingSupport =
  compileLivingFrameMotionSubjectClassGate({
    gateId: 'gate.nonliving-rigid-support',
    classification: classification({
      classificationId:
        'classification.nonliving-rigid-support',
      subjectClass:
        'environmental_or_editorial_nonliving',
    }),
    motionToolPolicy,
    routeDecision: nonlivingSupportDecision,
  })
assert.equal(
  acceptedNonlivingSupport.routeEvaluation.disposition,
  'accepted_nonliving_support_motion',
)
assert.equal(
  acceptedNonlivingSupport.routeAdmissionGranted,
  true,
)
assert.equal(
  verifyLivingFrameMotionSubjectClassGate(
    acceptedNonlivingSupport,
    {
      gateId: 'gate.nonliving-rigid-support',
      classification: classification({
        classificationId:
          'classification.nonliving-rigid-support',
        subjectClass:
          'environmental_or_editorial_nonliving',
      }),
      motionToolPolicy,
      routeDecision: nonlivingSupportDecision,
    },
  ),
  true,
)

assert.equal(
  verifyLivingFrameMotionSubjectClassGate({
    ...acceptedCompleteFrame,
    routeAdmissionGranted: false,
  }, {
    gateId: 'gate.living-complete-frame',
    classification: classification({
      classificationId:
        'classification.living-complete-frame',
      subjectClass: 'living_or_organic_subject',
      humanAnimalPlantOrOtherLivingIndicatorsPresent:
        true,
    }),
    motionToolPolicy,
    routeDecision: completeFrameDecision,
  }),
  false,
)

console.log(JSON.stringify({
  smoke: 'living_frame_motion_subject_class_gate',
  status: 'passed_source_only',
  livingLegacyRigDisposition:
    blockedLivingRig.routeEvaluation.disposition,
  livingCompleteFrameDisposition:
    acceptedCompleteFrame.routeEvaluation.disposition,
  mechanicalRigDisposition:
    mechanicalRigBlocked.routeEvaluation.disposition,
  mechanicalRigSpecificationAttached: false,
  nonlivingSupportDisposition:
    acceptedNonlivingSupport.routeEvaluation.disposition,
  livingOrOrganicSubjectRiggingAllowed: false,
  independentUnrelatedFrameGenerationAllowed: false,
  remotionOwnsFinalCanvas: true,
  operationRegistered: false,
  dispatchGranted: false,
  runtimeExecuted: false,
  assetCreated: false,
  canonicalQaApproved: false,
  productionReady: false,
}))

function classification(
  input: {
    readonly classificationId: string
    readonly subjectClass:
      LivingFrameMotionSubjectClassification['subjectClass']
    readonly humanAnimalPlantOrOtherLivingIndicatorsPresent?:
      boolean
    readonly vehicleMachineToolOrRigidMechanismIndicatorsPresent?:
      boolean
  },
): LivingFrameMotionSubjectClassification {
  return {
    classificationId: input.classificationId,
    sceneId: 'scene.subject-motion-gate',
    componentId: 'component.subject-motion-gate',
    subjectClass: input.subjectClass,
    evidenceSource:
      'video_understanding_structured_visual_evidence',
    evidenceDigestSha256: 'a'.repeat(64),
    confidenceBasisPoints: 9_500,
    humanAnimalPlantOrOtherLivingIndicatorsPresent:
      input.humanAnimalPlantOrOtherLivingIndicatorsPresent ?? false,
    vehicleMachineToolOrRigidMechanismIndicatorsPresent:
      input.vehicleMachineToolOrRigidMechanismIndicatorsPresent ?? false,
    ownerMechanicalRigSpecificationVersion: null,
    rawChatPromptPathUrlModelCodeOrBytesIncluded: false,
  }
}

function evidence(
  overrides: Partial<
    LivingFrameCharacterAnimationSuitabilityEvidence
  > & Pick<
    LivingFrameCharacterAnimationSuitabilityEvidence,
    'evidenceId' | 'componentTopology'
  >,
): LivingFrameCharacterAnimationSuitabilityEvidence {
  return {
    evidenceId: overrides.evidenceId,
    sceneId: 'scene.subject-motion-gate',
    componentId: 'component.subject-motion-gate',
    sourceArtifactId: 'artifact.subject-motion-gate',
    illustrativeNotArchivalEvidence: true,
    componentTopology: overrides.componentTopology,
    requestedMotionMagnitude:
      overrides.requestedMotionMagnitude ?? 'restrained',
    desiredPoseRequiresNewPixels:
      overrides.desiredPoseRequiresNewPixels ?? false,
    sourcePoseOccludesProtectedFace: false,
    upperArmSeparated: true,
    forearmSeparated: true,
    handSeparated: true,
    propSeparated: true,
    exactJointPivotsReviewed: true,
    hiddenJointArtworkReconstructed: true,
    deformableMeshTopologyReviewed: true,
    skinWeightMapReviewed: true,
    referenceIdentityAvailable: true,
    poseControlAvailable: true,
    deterministicRigidPivotAvailable: true,
    componentMotionExposesHiddenSourcePixels: false,
    exposedSourcePlateReconstructedAndReviewed: true,
    componentBoundaryDecontaminatedAndReviewed: true,
    protectedFaceMotionPathReviewed: true,
    motionPathClearsProtectedFace: true,
    componentAttachmentContinuityReviewed: true,
    flatMeshDeformationSufficient: true,
    continuousNaturalMotionRequired: false,
    rawChatPromptPathUrlModelCodeOrBytesIncluded: false,
    ...overrides,
  }
}
