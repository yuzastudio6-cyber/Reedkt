import type {
  LivingFrameAi2dInterpolationCandidate,
} from './living-frame-ai-2d-interpolation-qualification'

export const LIVING_FRAME_AI_2D_INTERPOLATION_READINESS_VERSION =
  'living-frame-ai-2d-interpolation-readiness-v1' as const

export const LIVING_FRAME_AI_2D_INTERPOLATION_READINESS_CLASS =
  'source_only_gate_reconciliation_for_accepted_keypose_interpolation' as const

export type LivingFrameAi2dInterpolationReleaseEvidenceId =
  LivingFrameAi2dInterpolationCandidate['requiredReleaseEvidence'][number]

export interface LivingFrameAi2dInterpolationReadinessDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_AI_2D_INTERPOLATION_READINESS_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_AI_2D_INTERPOLATION_READINESS_CLASS
  readonly readinessState:
    'source_only_source_pin_resolved_runtime_hardware_model_and_visual_gates_open'
  readonly readinessId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly interpolationAdmissionVersion:
      'living-frame-complete-character-interpolation-admission-v2'
    readonly interpolationAdmissionDigestSha256:
      string
    readonly interpolationQualificationVersion:
      'living-frame-ai-2d-interpolation-qualification-v1'
    readonly interpolationQualificationDigestSha256:
      string
    readonly sourceAuditVersion:
      'living-frame-ai-2d-interpolation-source-audit-v1'
    readonly sourceAuditDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256:
      string
    readonly actionChoreographyDigestSha256:
      string
    readonly authoritativeActionTimingDigestSha256:
      string
    readonly authoritativeKeyposeTimingDigestSha256:
      string
  }
  readonly toonCrafterReadiness: {
    readonly candidateId:
      'tooncrafter_official_candidate'
    readonly proposedToolId: 'tooncrafter'
    readonly proposedOperationId:
      'tool.tooncrafter.interpolate_accepted_character_keyposes.v1'
    readonly sourcePinGateResolved: true
    readonly resolvedEvidence: readonly [
      'exact_source_commit_and_source_archive_digest',
    ]
    readonly openEvidence:
      readonly LivingFrameAi2dInterpolationReleaseEvidenceId[]
    readonly openGateCount: 13
    readonly acceptedKeyposeAdmissionPresent:
      true
    readonly runtimeSelectionReleased: false
    readonly qualificationState:
      'blocked_pending_model_runtime_hardware_cost_private_output_and_professional_visual_evidence'
  }
  readonly rifeReadiness: {
    readonly candidateId:
      'rife_official_candidate'
    readonly proposedToolId: 'rife'
    readonly proposedOperationId:
      'tool.rife.smooth_accepted_character_motion.v1'
    readonly sourcePinGateResolved: true
    readonly resolvedEvidence: readonly [
      'exact_source_commit_and_source_archive_digest',
    ]
    readonly openEvidence:
      readonly LivingFrameAi2dInterpolationReleaseEvidenceId[]
    readonly openGateCount: 13
    readonly blockedUntilUnderlyingMotionProfessionallyAccepted:
      true
    readonly runtimeSelectionReleased: false
    readonly qualificationState:
      'blocked_pending_underlying_motion_and_model_runtime_cost_private_output_and_professional_visual_evidence'
  }
  readonly toonCrafterHardwarePolicy: {
    readonly singleL4RouteAssumedAdequate:
      false
    readonly blockingRiskCode:
      'official_memory_profile_not_safely_within_l4_capacity'
    readonly upstreamObservationOnlyMemoryRange:
      'approximately_24G_to_27G'
    readonly selectedRuntimeRoute: 'none'
    readonly allowedNextQualificationRoutes: readonly [
      'memory_reduced_route_only_if_same_professional_visual_bar_passes',
      'owner_approved_larger_gpu_route',
    ]
    readonly automaticQualityReducingOptimizationAllowed:
      false
    readonly ownerDecisionRequiredBeforeRuntimeQualification:
      true
  }
  readonly sequencingPolicy: {
    readonly sourcePinningDoesNotReleaseRuntime:
      true
    readonly acceptedKeyposesDoNotProveInterpolationQuality:
      true
    readonly interpolationCannotBeginUntilEveryOpenToonCrafterGateIsReleased:
      true
    readonly rifeCannotBeginUntilUnderlyingMotionIsProfessionallyAccepted:
      true
    readonly eachRuntimeOutputRequiresTechnicalQaAndActualVisualInspection:
      true
    readonly failureReturnsToAcceptedStillOrRestrainedMotion:
      true
  }
  readonly currentInterpolationDisposition:
    'disabled_pending_qualification_and_private_visual_evidence'
  readonly containsPromptChatTranscriptPathUrlModelBytesCredentialCommandOrEnvironment:
    false
  readonly authorityBoundary: {
    readonly registryAuthority: false
    readonly operationAuthority: false
    readonly providerAuthority: false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly assetAuthority: false
    readonly qaApprovalAuthority: false
    readonly renderAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameAi2dInterpolationReadiness
  extends LivingFrameAi2dInterpolationReadinessDraft {
  readonly readinessDigestSha256: string
}
