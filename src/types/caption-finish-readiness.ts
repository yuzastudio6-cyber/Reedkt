import type { CaptionDomainCanonicalScope, CaptionDomainRef } from './caption-domain-contracts'

export const CAPTION_DEPENDENCY_MANIFEST_VERSION =
  'caption-dependency-manifest-v2' as const
export const CAPTION_FINISH_READINESS_VERSION =
  'caption-finish-readiness-v2' as const
export const CAPTION_INVALIDATION_RESULT_VERSION =
  'caption-invalidation-result-v1' as const
export const CAPTION_LIFECYCLE_RECORD_VERSION =
  'caption-lifecycle-record-v2' as const

export type CaptionFinishDependencyKind =
  | 'approved_snapshot'
  | 'picture_lock'
  | 'confirmed_output_frame'
  | 'canonical_transcript'
  | 'word_timing'
  | 'timeline'
  | 'source_ranges'
  | 'shot_order'
  | 'shot_durations'
  | 'speed_changes'
  | 'crop_reframe'
  | 'broll_layout'
  | 'living_frame_layout'
  | 'graphics_maps_charts'
  | 'lower_thirds'
  | 'occupancy'
  | 'near_final_visual_proxy'
  | 'mask'
  | 'tracking'
  | 'object_anchor'
  | 'transition'
  | 'master_timing'
  | 'story_timing'
  | 'font_registry'
  | 'caption_style'
  | 'color_proxy'
  | 'sound_plan'
  | 'renderer_runtime'
  | 'approval_envelope'
  | 'qa_policy'
  | 'source_asset_manifest'
  | 'reservation_honored'

export type CaptionDependencyStatus =
  | 'ready'
  | 'missing'
  | 'stale'
  | 'approved_exception'
  | 'fallback_ready'
  | 'not_applicable'

export interface CaptionDependencyObservation {
  dependencyId: string
  dependencyKind: CaptionFinishDependencyKind
  ownerKey: string
  requiredForSceneIds: string[]
  requirement: 'required' | 'conditional' | 'not_applicable'
  lockedRef: CaptionDomainRef | null
  currentRef: CaptionDomainRef | null
  approvedExceptionRef: CaptionDomainRef | null
  fallbackAuthorizationRef: CaptionDomainRef | null
  selectedFallbackId: string | null
}

export interface CaptionDependencyRecord extends CaptionDependencyObservation {
  status: CaptionDependencyStatus
  blockerCode: string | null
  originalTreatmentReady: boolean
}

export interface CaptionDependencyManifestV2 {
  schemaVersion: typeof CAPTION_DEPENDENCY_MANIFEST_VERSION
  manifestId: string
  manifestDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  pictureLockRef: CaptionDomainRef
  earlyPlanningBundleRef: CaptionDomainRef
  sceneIds: string[]
  dependencies: CaptionDependencyRecord[]
  completeDependencyMapping: true
  unrelatedScenesMayContinue: true
  finalRenderAuthorityClaimed: false
  workCreationAuthorityClaimed: false
  productionAuthorityClaimed: false
}

export interface CaptionSceneFinishReadiness {
  sceneId: string
  disposition: 'ready' | 'ready_with_fallback' | 'blocked'
  originalTreatmentReady: boolean
  gateResults: Array<{
    dependencyId: string
    dependencyKind: CaptionFinishDependencyKind
    status: CaptionDependencyStatus
    evidenceRef: CaptionDomainRef | null
    blockerCode: string | null
    selectedFallbackId: string | null
  }>
  blockerCodes: string[]
  selectedFallbackIds: string[]
}

export interface CaptionFinishReadinessV2 {
  schemaVersion: typeof CAPTION_FINISH_READINESS_VERSION
  readinessId: string
  readinessDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  pictureLockRef: CaptionDomainRef
  dependencyManifestRef: CaptionDomainRef
  sceneReadiness: CaptionSceneFinishReadiness[]
  readySceneIds: string[]
  readyWithFallbackSceneIds: string[]
  blockedSceneIds: string[]
  allFinalCaptionScenesReady: boolean
  lateCaptionResolutionAllowed: boolean
  staleFinalSceneRenderAllowed: false
  finalRenderAllowed: false
  finalQaApprovalClaimed: false
  productionReady: false
}

export interface CaptionInvalidationResult {
  schemaVersion: typeof CAPTION_INVALIDATION_RESULT_VERSION
  invalidationId: string
  invalidationDigestSha256: string
  priorDependencyManifestRef: CaptionDomainRef
  currentDependencyManifestRef: CaptionDomainRef
  allSceneIds: string[]
  changedDependencies: Array<{
    dependencyId: string
    dependencyKind: CaptionFinishDependencyKind
    priorRef: CaptionDomainRef | null
    currentRef: CaptionDomainRef | null
    affectedSceneIds: string[]
    reasonCode: string
  }>
  invalidatedSceneIds: string[]
  unchangedSceneIds: string[]
  requiresCanonicalReapproval: boolean
  unrelatedScenesMayContinue: true
  automaticRenderAllowed: false
  productionAuthorityClaimed: false
}

export type CaptionLifecycleStateV2 =
  | 'strategy_draft'
  | 'strategy_reviewable'
  | 'strategy_approved'
  | 'opportunities_mapped'
  | 'space_reserved'
  | 'blocking_ready'
  | 'awaiting_picture_lock'
  | 'finish_readiness_blocked'
  | 'finish_ready'
  | 'choreography_resolving'
  | 'choreography_resolved'
  | 'storytiming_locked'
  | 'sound_handoff_ready'
  | 'render_ready'
  | 'rendered'
  | 'qa_warning'
  | 'qa_failed'
  | 'qa_passed'
  | 'delivery_ready'
  | 'stale'
  | 'revision_required'
  | 'superseded'

export interface CaptionLifecycleRecordV2 {
  schemaVersion: typeof CAPTION_LIFECYCLE_RECORD_VERSION
  lifecycleRecordId: string
  lifecycleRecordDigestSha256: string
  priorLifecycleRef: CaptionDomainRef | null
  fromState: CaptionLifecycleStateV2 | null
  toState: CaptionLifecycleStateV2
  affectedSceneIds: string[]
  reasonCodes: string[]
  createdAt: string
  appendOnly: true
  approvedVersionOverwritten: false
  globalWorkflowOwnerChanged: false
  runtimeExecutionAuthorityClaimed: false
  productionAuthorityClaimed: false
}
