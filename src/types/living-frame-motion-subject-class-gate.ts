import type {
  LivingFrameCharacterAnimationRoute,
  LivingFrameCharacterAnimationRouteDecision,
} from './living-frame-character-animation-route'

export const LIVING_FRAME_MOTION_SUBJECT_CLASS_GATE_VERSION =
  'living-frame-motion-subject-class-gate-v1' as const

export type LivingFrameMotionSubjectClass =
  | 'living_or_organic_subject'
  | 'rigid_mechanical_object'
  | 'environmental_or_editorial_nonliving'
  | 'unknown'

export interface LivingFrameMotionSubjectClassification {
  readonly classificationId: string
  readonly sceneId: string
  readonly componentId: string
  readonly subjectClass: LivingFrameMotionSubjectClass
  readonly evidenceSource:
    | 'video_understanding_structured_visual_evidence'
    | 'approved_asset_metadata'
    | 'owner_confirmed'
  readonly evidenceDigestSha256: string
  readonly confidenceBasisPoints: number
  readonly humanAnimalPlantOrOtherLivingIndicatorsPresent:
    boolean
  readonly vehicleMachineToolOrRigidMechanismIndicatorsPresent:
    boolean
  readonly ownerMechanicalRigSpecificationVersion: null
  readonly rawChatPromptPathUrlModelCodeOrBytesIncluded: false
}

export type LivingFrameMotionSubjectClassGateDisposition =
  | 'accepted_complete_frame_living_motion'
  | 'blocked_living_subject_rigging'
  | 'blocked_pending_owner_mechanical_rig_specification'
  | 'accepted_nonliving_support_motion'
  | 'blocked_nonliving_support_route_mismatch'
  | 'blocked_unknown_subject_classification'
  | 'deliberate_no_animation'

export interface LivingFrameMotionSubjectClassGateDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_MOTION_SUBJECT_CLASS_GATE_VERSION
  readonly resultClass:
    'server_derived_non_executable_motion_subject_class_gate'
  readonly gateState:
    'subject_classified_route_checked_no_rig_runtime_authority'
  readonly gateId: string
  readonly classification:
    LivingFrameMotionSubjectClassification
  readonly sourceBindings: {
    readonly motionToolPolicyVersion:
      'living-frame-character-motion-tool-policy-v2'
    readonly motionToolPolicyDigestSha256: string
    readonly routeDecisionVersion:
      LivingFrameCharacterAnimationRouteDecision['contractVersion']
    readonly routeDecisionDigestSha256: string
  }
  readonly routeEvaluation: {
    readonly selectedRoute:
      LivingFrameCharacterAnimationRoute
    readonly selectedRouteAdmitted: boolean
    readonly disposition:
      LivingFrameMotionSubjectClassGateDisposition
    readonly blockingReasonCodes: readonly string[]
    readonly permittedNextRoutes:
      readonly LivingFrameCharacterAnimationRoute[]
    readonly headIntelligenceReplanRequired: boolean
  }
  readonly hardRules: {
    readonly livingOrOrganicSubjectRiggingAllowed: false
    readonly livingOrOrganicPartBasedPuppetDeformationAllowed: false
    readonly livingOrOrganicCompleteFramePoseAnimationRequired:
      true
    readonly acceptedInbetweenFramesMayBeGeneratedOnlyBetweenAcceptedCompletePoses:
      true
    readonly unrelatedIndependentFrameGenerationAllowed: false
    readonly mechanicalObjectRiggingAllowedBeforeOwnerSpecification:
      false
    readonly unknownSubjectMayDefaultToMechanical: false
    readonly legacyRigEvidenceCanAuthorizeLivingSubjectRuntime:
      false
    readonly remotionOwnsFinalCanvas: true
  }
  readonly mechanicalRigSpecificationAttached: false
  readonly routeAdmissionGranted: boolean
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly actualCostReceiptCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameMotionSubjectClassGate
  extends LivingFrameMotionSubjectClassGateDraft {
  readonly gateDigestSha256: string
}
