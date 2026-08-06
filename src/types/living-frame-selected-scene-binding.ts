import type {
  LivingFrameProfessionalSkillComponent,
  LivingFrameReasonCode,
  LivingFrameSceneDecision,
} from './living-frame'

export const CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_VERSION =
  'canonical-living-frame-selected-scene-binding-v1' as const

export const CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_SOURCE =
  'canonical_living_frame_selected_scene_binding_service' as const

export const CANONICAL_LIVING_FRAME_SELECTED_SCENE_COMPONENT_KEY =
  'livingFrameSelectedSceneBinding' as const

export const CANONICAL_LIVING_FRAME_SELECTED_SCENE_ADMISSION_COMPONENT_KEY =
  'livingFrameSelectedSceneAdmission' as const

export const CANONICAL_LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_COMPONENT_KEY =
  'livingFrameSemanticPlanProjection' as const

export const CANONICAL_LIVING_FRAME_SELECTED_SCENE_DECISIONS = [
  'selected_scenes',
  'deliberate_non_use',
] as const

export type CanonicalLivingFrameSelectedSceneDecision =
  (typeof CANONICAL_LIVING_FRAME_SELECTED_SCENE_DECISIONS)[number]

export const CANONICAL_LIVING_FRAME_SELECTED_SCENE_TREATMENTS = [
  'use_full',
  'use_subtle',
  'use_simpler_treatment',
] as const satisfies readonly LivingFrameSceneDecision[]

export type CanonicalLivingFrameSelectedSceneTreatment =
  (typeof CANONICAL_LIVING_FRAME_SELECTED_SCENE_TREATMENTS)[number]

export interface CanonicalLivingFrameSelectedSceneChoice {
  readonly sceneId: string
  readonly treatment: CanonicalLivingFrameSelectedSceneTreatment
}

export interface CanonicalLivingFrameSelectedSceneSelectorDecision {
  readonly decision: CanonicalLivingFrameSelectedSceneDecision
  readonly selectedScenes: readonly CanonicalLivingFrameSelectedSceneChoice[]
  readonly reasonCode: LivingFrameReasonCode
}

export interface CanonicalLivingFrameSelectedSceneBindingAuthorityBoundary {
  readonly serverDerivedPlanningComponent: true
  readonly selectedSceneAuthority: true
  readonly professionalSkillComponentProjectionAuthority: true
  readonly browserSelectionAuthority: false
  readonly rawChatAuthority: false
  readonly masterTimingMutationAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly customerCommercialAuthority: false
  readonly approvalAuthority: false
  readonly snapshotCreationAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly artifactQaAuthority: false
  readonly rendererAuthority: false
  readonly remotionExecutionAuthority: false
  readonly privateReviewAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface CanonicalLivingFrameSelectedSceneBindingDraft {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_VERSION
  readonly source:
    typeof CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_SOURCE
  readonly evidenceClass:
    'private_internal_server_derived_selected_scene_binding'
  readonly identity: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly handoffId: string
    readonly handoffHash: string
    readonly canonicalPlanComponentsHash: string
  }
  readonly sourceBindings: {
    readonly deferredLivingFrameComponentDigestSha256: string
    readonly semanticPlanProjectionDigestSha256: string
    readonly selectedSceneAdmissionDigestSha256: string
    readonly semanticProposalBindingDigestSha256: string
    readonly semanticRequestDigestSha256: string
    readonly semanticResultDigestSha256: string
    readonly visualContinuityPackDigestSha256: string | null
    readonly confirmedOutputFrameDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly selectorDecisionDigestSha256: string
  }
  readonly decision: CanonicalLivingFrameSelectedSceneSelectorDecision
  readonly rejectedCandidateSceneIds: readonly string[]
  readonly selectedComponent: LivingFrameProfessionalSkillComponent
  readonly selectedSceneCount: number
  readonly selectedComponentCount: number
  readonly deliberateNonUse: boolean
  readonly authorityBoundary:
    CanonicalLivingFrameSelectedSceneBindingAuthorityBoundary
  readonly deferredParentPreserved: true
  readonly existingCanonicalPlanRemainsAuthority: true
  readonly existingMasterTimingRemainsAuthority: true
  readonly existingSoundSyncRemainsAuthority: true
  readonly existingEstimateApprovalSnapshotPipelineRemainsAuthority: true
  readonly existingWorkAssetQaReviewPipelineRemainsAuthority: true
  readonly containsRawChatTranscriptMediaBytesPathsOrUrls: false
  readonly containsProviderToolWorkQueueCostOrCommercialRoute: false
  readonly containsExecutableCodeOrCommands: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface CanonicalLivingFrameSelectedSceneBinding
  extends CanonicalLivingFrameSelectedSceneBindingDraft {
  readonly bindingDigestSha256: string
}

export interface CanonicalLivingFrameSelectedScenePublication {
  readonly binding: CanonicalLivingFrameSelectedSceneBinding
  readonly admission: unknown
  readonly semanticPlanProjection: unknown
}
