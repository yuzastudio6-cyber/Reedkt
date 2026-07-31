import type {
  LivingFrameCharacterAnimationRouteDecision,
} from '../../src/types/living-frame-character-animation-route'
import type {
  LivingFrameCharacterMotionToolPolicy,
} from '../../src/types/living-frame-character-motion-tool-policy'
import {
  LIVING_FRAME_MOTION_SUBJECT_CLASS_GATE_VERSION,
  type LivingFrameMotionSubjectClassGate,
  type LivingFrameMotionSubjectClassGateDraft,
  type LivingFrameMotionSubjectClassification,
} from '../../src/types/living-frame-motion-subject-class-gate'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameCharacterAnimationRouteDecision,
} from './living-frame-character-animation-route'
import {
  verifyLivingFrameCharacterMotionToolPolicy,
} from './living-frame-character-motion-tool-policy'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const MIN_CLASSIFICATION_CONFIDENCE_BASIS_POINTS = 8_000

export interface CreateLivingFrameMotionSubjectClassGateInput {
  readonly gateId: string
  readonly classification:
    LivingFrameMotionSubjectClassification
  readonly motionToolPolicy:
    LivingFrameCharacterMotionToolPolicy
  readonly routeDecision:
    LivingFrameCharacterAnimationRouteDecision
}

export function compileLivingFrameMotionSubjectClassGate(
  input:
    CreateLivingFrameMotionSubjectClassGateInput,
): LivingFrameMotionSubjectClassGate {
  assertInput(input)
  if (!verifyLivingFrameCharacterMotionToolPolicy(
    input.motionToolPolicy,
  )) throw new Error('Invalid Living Frame motion tool policy.')
  if (!verifyLivingFrameCharacterAnimationRouteDecision(
    input.routeDecision,
  )) throw new Error('Invalid Living Frame character route decision.')
  if (
    input.classification.sceneId !==
      input.routeDecision.evidence.sceneId
    || input.classification.componentId !==
      input.routeDecision.evidence.componentId
  ) throw new Error('Motion subject classification lineage mismatch.')

  const routeEvaluation = evaluateRoute(input)
  const draft: LivingFrameMotionSubjectClassGateDraft = {
    contractVersion:
      LIVING_FRAME_MOTION_SUBJECT_CLASS_GATE_VERSION,
    resultClass:
      'server_derived_non_executable_motion_subject_class_gate',
    gateState:
      'subject_classified_route_checked_no_rig_runtime_authority',
    gateId: input.gateId,
    classification:
      structuredClone(input.classification),
    sourceBindings: {
      motionToolPolicyVersion:
        input.motionToolPolicy.contractVersion,
      motionToolPolicyDigestSha256:
        input.motionToolPolicy.policyDigestSha256,
      routeDecisionVersion:
        input.routeDecision.contractVersion,
      routeDecisionDigestSha256:
        input.routeDecision.decisionDigestSha256,
    },
    routeEvaluation,
    hardRules: {
      livingOrOrganicSubjectRiggingAllowed: false,
      livingOrOrganicPartBasedPuppetDeformationAllowed:
        false,
      livingOrOrganicCompleteFramePoseAnimationRequired:
        true,
      acceptedInbetweenFramesMayBeGeneratedOnlyBetweenAcceptedCompletePoses:
        true,
      unrelatedIndependentFrameGenerationAllowed:
        false,
      mechanicalObjectRiggingAllowedBeforeOwnerSpecification:
        false,
      unknownSubjectMayDefaultToMechanical: false,
      legacyRigEvidenceCanAuthorizeLivingSubjectRuntime:
        false,
      remotionOwnsFinalCanvas: true,
    },
    mechanicalRigSpecificationAttached: false,
    routeAdmissionGranted:
      routeEvaluation.selectedRouteAdmitted,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    assetCreated: false,
    canonicalQaApproved: false,
    actualCostReceiptCreated: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    gateDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameMotionSubjectClassGate(
  value: unknown,
  input:
    CreateLivingFrameMotionSubjectClassGateInput,
): value is LivingFrameMotionSubjectClassGate {
  if (
    !isRecord(value)
    || typeof value.gateDigestSha256 !== 'string'
    || !SHA256.test(value.gateDigestSha256)
  ) return false
  try {
    const expected =
      compileLivingFrameMotionSubjectClassGate(input)
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function evaluateRoute(
  input:
    CreateLivingFrameMotionSubjectClassGateInput,
): LivingFrameMotionSubjectClassGateDraft['routeEvaluation'] {
  const selectedRoute = input.routeDecision.decision.selectedRoute
  if (selectedRoute === 'no_animation') return {
    selectedRoute,
    selectedRouteAdmitted: true,
    disposition: 'deliberate_no_animation',
    blockingReasonCodes: [],
    permittedNextRoutes: ['no_animation'],
    headIntelligenceReplanRequired: false,
  }
  switch (input.classification.subjectClass) {
    case 'living_or_organic_subject': {
      const permittedNextRoutes = [
        'comfyui_controlled_keyposes',
        'real_motion_video_fallback',
        'no_animation',
      ] as const
      const admitted = permittedNextRoutes.includes(
        selectedRoute as (typeof permittedNextRoutes)[number],
      )
      return {
        selectedRoute,
        selectedRouteAdmitted: admitted,
        disposition: admitted
          ? 'accepted_complete_frame_living_motion'
          : 'blocked_living_subject_rigging',
        blockingReasonCodes: admitted ? [] : [
          'living_or_organic_subject_cannot_use_part_based_rigging',
          'legacy_blender_opentoonz_or_pixijs_character_route_cannot_authorize_runtime',
          'complete_frame_pose_animation_or_deliberate_non_use_required',
        ],
        permittedNextRoutes,
        headIntelligenceReplanRequired: !admitted,
      }
    }
    case 'rigid_mechanical_object':
      return {
        selectedRoute,
        selectedRouteAdmitted: false,
        disposition:
          'blocked_pending_owner_mechanical_rig_specification',
        blockingReasonCodes: [
          'mechanical_rigging_reserved_for_owner_specification',
          'no_mechanical_rig_operation_may_be_admitted_yet',
        ],
        permittedNextRoutes: ['no_animation'],
        headIntelligenceReplanRequired: true,
      }
    case 'environmental_or_editorial_nonliving': {
      const admitted = selectedRoute === 'pixijs_rigid_cutout'
      return {
        selectedRoute,
        selectedRouteAdmitted: admitted,
        disposition: admitted
          ? 'accepted_nonliving_support_motion'
          : 'blocked_nonliving_support_route_mismatch',
        blockingReasonCodes: admitted ? [] : [
          'nonliving_support_motion_requires_rigid_pixijs_or_deliberate_non_use',
        ],
        permittedNextRoutes: [
          'pixijs_rigid_cutout',
          'no_animation',
        ],
        headIntelligenceReplanRequired: !admitted,
      }
    }
    case 'unknown':
      return {
        selectedRoute,
        selectedRouteAdmitted: false,
        disposition:
          'blocked_unknown_subject_classification',
        blockingReasonCodes: [
          'unknown_subject_class_cannot_default_to_mechanical_rigging',
          'structured_visual_classification_required',
        ],
        permittedNextRoutes: ['no_animation'],
        headIntelligenceReplanRequired: true,
      }
  }
}

function assertInput(
  input:
    CreateLivingFrameMotionSubjectClassGateInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'gateId',
      'classification',
      'motionToolPolicy',
      'routeDecision',
    ])
    || !SAFE_ID.test(input.gateId)
    || !isRecord(input.classification)
    || !hasExactKeys(input.classification, [
      'classificationId',
      'sceneId',
      'componentId',
      'subjectClass',
      'evidenceSource',
      'evidenceDigestSha256',
      'confidenceBasisPoints',
      'humanAnimalPlantOrOtherLivingIndicatorsPresent',
      'vehicleMachineToolOrRigidMechanismIndicatorsPresent',
      'ownerMechanicalRigSpecificationVersion',
      'rawChatPromptPathUrlModelCodeOrBytesIncluded',
    ])
    || !SAFE_ID.test(input.classification.classificationId)
    || !SAFE_ID.test(input.classification.sceneId)
    || !SAFE_ID.test(input.classification.componentId)
    || !SHA256.test(input.classification.evidenceDigestSha256)
    || ![
      'living_or_organic_subject',
      'rigid_mechanical_object',
      'environmental_or_editorial_nonliving',
      'unknown',
    ].includes(input.classification.subjectClass)
    || ![
      'video_understanding_structured_visual_evidence',
      'approved_asset_metadata',
      'owner_confirmed',
    ].includes(input.classification.evidenceSource)
    || typeof input.classification
      .humanAnimalPlantOrOtherLivingIndicatorsPresent !== 'boolean'
    || typeof input.classification
      .vehicleMachineToolOrRigidMechanismIndicatorsPresent !== 'boolean'
    || !Number.isInteger(
      input.classification.confidenceBasisPoints,
    )
    || input.classification.confidenceBasisPoints < 0
    || input.classification.confidenceBasisPoints > 10_000
    || (
      input.classification.subjectClass !== 'unknown'
      && input.classification.confidenceBasisPoints <
        MIN_CLASSIFICATION_CONFIDENCE_BASIS_POINTS
    )
    || input.classification.ownerMechanicalRigSpecificationVersion !== null
    || input.classification.rawChatPromptPathUrlModelCodeOrBytesIncluded
  ) throw new Error('Invalid Living Frame motion subject classification.')
  if (
    input.classification.subjectClass === 'living_or_organic_subject'
    && !input.classification
      .humanAnimalPlantOrOtherLivingIndicatorsPresent
  ) throw new Error('Living subject classification lacks living evidence.')
  if (
    input.classification.subjectClass === 'rigid_mechanical_object'
    && (
      !input.classification
        .vehicleMachineToolOrRigidMechanismIndicatorsPresent
      || input.classification
        .humanAnimalPlantOrOtherLivingIndicatorsPresent
    )
  ) throw new Error('Mechanical object classification lacks mechanical evidence.')
  if (
    input.classification.subjectClass ===
      'environmental_or_editorial_nonliving'
    && input.classification
      .humanAnimalPlantOrOtherLivingIndicatorsPresent
  ) throw new Error('Nonliving subject classification conflicts with living evidence.')
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, order) => key === expected[order])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value),
  )
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
