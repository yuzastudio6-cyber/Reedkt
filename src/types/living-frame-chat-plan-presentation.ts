import type {
  LivingFrameDecision,
  LivingFrameMode,
} from './living-frame'

export const LIVING_FRAME_CHAT_PLAN_PRESENTATION_VERSION =
  'living-frame-chat-plan-presentation-v1' as const

export const LIVING_FRAME_CHAT_PLAN_PRESENTATION_CLASS =
  'byte_free_non_executable_supplemental_plan_presentation' as const

export const LIVING_FRAME_CHAT_PLAN_PRESENTATION_CHANGE_KINDS = [
  'professional_skill_plan_changed',
  'living_frame_component_changed',
  'selection_decision_changed',
  'confirmed_frame_changed',
  'master_timing_changed',
  'owner_scope_changed',
  'professional_skill_policy_changed',
  'plan_version_changed',
  'approved_snapshot_changed',
] as const

export type LivingFrameChatPlanPresentationChangeKind =
  typeof LIVING_FRAME_CHAT_PLAN_PRESENTATION_CHANGE_KINDS[number]

export type LivingFrameChatPlanPresentationDecision =
  | 'selected'
  | 'deferred'
  | 'non_use'
  | 'restraint'
  | 'blocked'

export type LivingFrameChatPlanPresentationReloadState =
  | 'initial_projection'
  | 'exact_canonical_reload'
  | 'approved_snapshot_attached_to_exact_plan'
  | 'previous_presentation_invalidated_by_revision'

export interface LivingFrameChatPlanPresentationOpaqueRef {
  readonly role:
    | 'professional_skill_plan'
    | 'living_frame_component'
    | 'selection_policy_decision'
    | 'owner_scope_amendment'
    | 'active_professional_skill_policy'
    | 'confirmed_output_frame'
    | 'master_timing'
    | 'edit_plan_version'
    | 'approved_snapshot_or_pending'
  readonly refId: string
  readonly version: string
  readonly digestSha256: string
}

export interface LivingFrameChatPlanPresentationReloadRef {
  readonly contractVersion:
    typeof LIVING_FRAME_CHAT_PLAN_PRESENTATION_VERSION
  readonly completePresentationDigestInputSha256: string
  readonly sourceFingerprintDigestSha256: string
  readonly professionalSkillPlanDigestSha256: string
  readonly livingFrameComponentDigestSha256: string
  readonly selectionDecisionDigestSha256: string
  readonly confirmedFrameDigestSha256: string
  readonly masterTimingDigestSha256: string
  readonly ownerScopeAmendmentDigestSha256: string
  readonly professionalSkillPolicyDigestSha256: string
  readonly planVersionId: string
  readonly planVersion: number
  readonly planVersionStatus:
    | 'draft'
    | 'awaiting_approval'
    | 'approved'
  readonly planVersionDigestSha256: string
  readonly approvedSnapshotState: 'pending' | 'approved'
  readonly approvedSnapshotDigestSha256: string
  readonly reloadRefDigestSha256: string
}

export interface LivingFrameChatPlanPresentationAuthorityBoundary {
  readonly supplementalPresentationOnly: true
  readonly canonicalPlanPresentationAuthority: false
  readonly chatCardRegistryAuthority: false
  readonly browserRehydrationAuthority: false
  readonly approvalAuthority: false
  readonly toolAuthority: false
  readonly providerAuthority: false
  readonly runtimeAuthority: false
  readonly dispatchAuthority: false
  readonly costAuthority: false
  readonly qaApprovalAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameChatPlanPresentationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CHAT_PLAN_PRESENTATION_VERSION
  readonly presentationClass:
    typeof LIVING_FRAME_CHAT_PLAN_PRESENTATION_CLASS
  readonly presentationState:
    'source_projection_complete_canonical_presentation_consumption_pending'
  readonly cardDescriptor: {
    readonly descriptorId: 'living_frame_plan'
    readonly phase: 'plan'
    readonly priority: 'user_summary' | 'safety_detail'
    readonly status: 'ready' | 'blocking'
    readonly defaultExpanded: true
    readonly advancedDetailsDefaultExpanded: false
    readonly requiredBeforeApproval: false
    readonly separateApprovalCtaProvided: false
  }
  readonly guided: {
    readonly decision: LivingFrameChatPlanPresentationDecision
    readonly selectedMode: LivingFrameMode | null
    readonly sourceDecision: LivingFrameDecision | 'not_selected'
    readonly explicitRestraintApplied: boolean
    readonly summary: string
    readonly planningOnlyNotice:
      'Nothing starts until the complete edit plan and credit estimate are approved.'
  }
  readonly detailed: {
    readonly sceneCount: number
    readonly modes: readonly LivingFrameMode[]
    readonly attentionEventCount: number
    readonly semanticScaleRequestCount: number
    readonly depthAwareComponentCount: number
    readonly captionProtectedSceneCount: number
    readonly fallbackStepCount: number
    readonly qaExpectationCount: number
    readonly closedGateCount: number
    readonly activeScopeCount: 12
    readonly pausedScopeCount: 7
    readonly modeAndSceneSummary: string
    readonly attentionScaleDepthCaptionSummary: string
    readonly fallbackSummary: string
    readonly qaAndReinspectionSummary: string
    readonly pausedRouteSummary:
      'Living and illustrated character animation, living-subject rigging, and mechanical rigging remain paused.'
  }
  readonly developer: {
    readonly opaqueRefsOnly: true
    readonly refs: readonly LivingFrameChatPlanPresentationOpaqueRef[]
    readonly sourceFingerprintDigestSha256: string
  }
  readonly reloadAndRevision: {
    readonly state: LivingFrameChatPlanPresentationReloadState
    readonly changedBindings:
      readonly LivingFrameChatPlanPresentationChangeKind[]
    readonly previousPresentationStale: boolean
    readonly currentPresentationFresh: true
    readonly previousPresentationMayBeReused: boolean
    readonly newPlanVersionRequired: boolean
    readonly approvalResetRequired: boolean
    readonly previewResetRequired: boolean
    readonly newApprovedSnapshotRequired: boolean
    readonly aspectTimingScopeOrPolicyChangeInvalidatesApproval: true
    readonly persistedCanonicalReloadRequired: true
    readonly browserLocalStateMayAuthorizeReload: false
  }
  readonly reloadRef: LivingFrameChatPlanPresentationReloadRef
  readonly completePresentationDigestInputSha256: string
  readonly sharedUiMutated: false
  readonly canonicalConsumptionPending: true
  readonly containsRawChatInternalToolOrProviderNamesMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
    false
  readonly authorityBoundary:
    LivingFrameChatPlanPresentationAuthorityBoundary
  readonly approvalGranted: false
  readonly toolSelected: false
  readonly providerSelected: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly costAdmitted: false
  readonly canonicalQaApproved: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameChatPlanPresentation
  extends LivingFrameChatPlanPresentationDraft {
  readonly presentationDigestSha256: string
}
