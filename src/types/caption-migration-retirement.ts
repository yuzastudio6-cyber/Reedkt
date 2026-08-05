import type {
  CaptionLegacySkillMapping,
} from './caption-design-composite'
import type {
  CaptionDomainRef,
} from './caption-domain-contracts'
import type {
  CaptionLegacyStyleAdapter,
  CaptionLegacyStyleId,
} from './caption-semantic-style'

export const CAPTION_LEGACY_PLAN_ENVELOPE_VERSION =
  'caption-legacy-plan-envelope-v1' as const
export const CAPTION_LEGACY_SNAPSHOT_ENVELOPE_VERSION =
  'caption-legacy-snapshot-envelope-v1' as const
export const CAPTION_LEGACY_MIGRATION_PROJECTION_VERSION =
  'caption-legacy-migration-projection-v1' as const
export const CAPTION_RETIREMENT_REGISTRY_VERSION =
  'caption-retirement-registry-v1' as const
export const CAPTION_ROLLBACK_MANIFEST_VERSION =
  'caption-rollback-manifest-v1' as const
export const CAPTION_MIGRATION_RETIREMENT_RELEASE_VERSION =
  'caption-migration-retirement-release-v1' as const

export const CAPTION_LEGACY_STYLE_IDS = [
  'clean_subtitle',
  'small_premium_subtitle',
  'bold_social_captions',
  'keyword_emphasis_captions',
  'karaoke_word_by_word',
  'sentence_block_captions',
  'documentary_lower_third',
  'education_label_captions',
  'minimal_accessibility_captions',
  'caption_icon_callout',
  'custom',
] as const satisfies readonly CaptionLegacyStyleId[]

export const CAPTION_RETIRED_OWNER_IDS = [
  'flat_captions_primary_owner',
  'direct_qwen_caption_owner',
  'basic_caption_worker_creative_owner',
  'fixed_ass_canvas_authority',
  'mutable_system_font_authority',
  'synthetic_final_word_motion_authority',
  'direct_caption_sam_authority',
] as const

export type CaptionRetiredOwnerId = typeof CAPTION_RETIRED_OWNER_IDS[number]

export interface CaptionLegacyScope {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  legacyPlanVersionId: string
}

export interface CaptionLegacyPlanEnvelope {
  schemaVersion: typeof CAPTION_LEGACY_PLAN_ENVELOPE_VERSION
  envelopeId: string
  envelopeDigestSha256: string
  canonicalScope: CaptionLegacyScope
  sourcePlanRecordRef: CaptionDomainRef
  captionNeeded: boolean
  legacySkillIds: string[]
  legacyStyleId: string | null
  customStyleApprovalRef: CaptionDomainRef | null
  placementClass:
    | 'bottom_safe'
    | 'middle_safe'
    | 'top_safe'
    | 'lower_third'
    | 'side_panel'
    | 'custom'
  maxLines: number
  keywordEmphasis: boolean
  faceSafe: boolean
  animationClass:
    | 'none'
    | 'fade'
    | 'simple_pop'
    | 'word_highlight'
    | 'custom'
  sourcePlanImmutable: true
  rawChatIncluded: false
  rawTranscriptIncluded: false
  mediaBytesIncluded: false
  pathsOrUrlsIncluded: false
}

export interface CaptionLegacySnapshotEnvelope {
  schemaVersion: typeof CAPTION_LEGACY_SNAPSHOT_ENVELOPE_VERSION
  envelopeId: string
  envelopeDigestSha256: string
  canonicalScope: CaptionLegacyScope
  legacyPlanEnvelopeRef: CaptionDomainRef
  legacyApprovedSnapshotRef: CaptionDomainRef
  currentApprovedSnapshotRef: CaptionDomainRef | null
  currentConfirmedOutputFrameRef: CaptionDomainRef | null
  currentMasterTimingRef: CaptionDomainRef | null
  exactTenantScopeRereadVerified: boolean
  exactCurrentSnapshotRereadVerified: boolean
  legacySnapshotImmutable: true
  currentSnapshotMutationAllowed: false
  browserLocalAuthorityAccepted: false
}

export interface CaptionLegacyStableOverlayRoute {
  routeId: 'caption_legacy_simple_stable_overlay_v1'
  rendererOperationId: 'tool.libass.render_approved_caption_track.v1'
  packageOperationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
  outputKinds: ['srt', 'webvtt', 'ass', 'stable_burn_in']
  oneStableTopLayerTrackOnly: true
  intentionalOcclusionDisabled: true
  crossSystemTransformsDisabled: true
  canvasPolicy: 'exact_confirmed_output_frame_only'
  fixed1080x1920CanvasAccepted: false
  approvedFontRegistryRequired: true
  mutableSystemFontAuthorityAccepted: false
  basicWorkerCreativeDecisionsAccepted: false
  finalCanvasOwner: 'remotion'
}

export interface CaptionLegacyMigrationProjection {
  schemaVersion: typeof CAPTION_LEGACY_MIGRATION_PROJECTION_VERSION
  projectionId: string
  projectionDigestSha256: string
  canonicalScope: CaptionLegacyScope
  sourcePlanEnvelopeRef: CaptionDomainRef
  sourceSnapshotEnvelopeRef: CaptionDomainRef | null
  disposition:
    | 'decoded_read_only_requires_current_authority'
    | 'decoded_current_simple_overlay_candidate'
    | 'decoded_no_captions_restraint'
    | 'blocked_custom_style_requires_approval'
  canonicalSpecialistKey: 'captions'
  compositeSkillId: 'caption_design' | null
  restraintSkillId: 'no_captions' | null
  appliedLegacySkillIds: string[]
  mappedComponentSkillIds: string[]
  sourceLegacyStyleIdDigestSha256: string | null
  legacyStyleAdapter: CaptionLegacyStyleAdapter | null
  stableOverlayRoute: CaptionLegacyStableOverlayRoute | null
  currentAuthority: {
    currentApprovedSnapshotRef: CaptionDomainRef | null
    currentConfirmedOutputFrameRef: CaptionDomainRef | null
    currentMasterTimingRef: CaptionDomainRef | null
    exactTenantScopeRereadVerified: boolean
    exactCurrentSnapshotRereadVerified: boolean
  }
  syntheticTimingDisposition: 'blocking_preview_only'
  syntheticFinalWordMotionAllowed: false
  directQwenCaptionOwnerAllowed: false
  directCaptionSamAllowed: false
  directPeerExecutionAllowed: false
  requiresFreshPlanEstimateAndApproval: true
  executionReady: false
  operationDispatchAuthority: false
  providerRuntimeAuthority: false
  assetMutationAuthority: false
  creditOrBillingAuthority: false
  finalQaApprovalAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

export interface CaptionRetirementEntry {
  retiredOwnerId: CaptionRetiredOwnerId
  historicalImplementationIds: string[]
  disposition: 'retired_historical_read_only' | 'prohibited'
  replacementOwnerKey:
    | 'captions'
    | 'visual_intelligence'
    | 'track_all'
    | 'story_timing'
    | 'confirmed_frame_owner'
    | 'canonical_font_runtime'
  historicalReadAllowed: true
  freshWorkAllowed: false
  rollbackMayReactivateOwner: false
  evidenceRefs: CaptionDomainRef[]
}

export interface CaptionRetirementRegistry {
  schemaVersion: typeof CAPTION_RETIREMENT_REGISTRY_VERSION
  registryId: string
  registryDigestSha256: string
  entries: CaptionRetirementEntry[]
  exactRetiredOwnerCoverage: true
  captionSpecialistImportsRetiredImplementation: false
  destructiveCodeDeletionPerformed: false
  historicalReadabilityPreserved: true
  productionAuthority: false
}

export interface CaptionRollbackManifest {
  schemaVersion: typeof CAPTION_ROLLBACK_MANIFEST_VERSION
  manifestId: string
  manifestDigestSha256: string
  sourceReleaseRef: CaptionDomainRef
  rollbackTarget: 'legacy_simple_stable_overlay'
  stableOverlayRoute: CaptionLegacyStableOverlayRoute
  permittedLegacyStyleIds: Array<
    'clean_subtitle' | 'minimal_accessibility_captions'
  >
  activationRequirements: [
    'fresh_plan',
    'fresh_estimate',
    'user_approval',
    'immutable_current_snapshot',
    'exact_confirmed_output_frame',
    'current_master_timing',
    'approved_font_pack',
    'deterministic_caption_qa',
    'direct_visual_inspection',
    'private_review'
  ]
  automaticRollbackAllowed: false
  priorApprovedSnapshotMutated: false
  directQwenOrSamReactivated: false
  fixedCanvasOrSystemFontReactivated: false
  syntheticFinalTimingReactivated: false
  operationDispatchAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

export interface CaptionMigrationRetirementRelease {
  schemaVersion: typeof CAPTION_MIGRATION_RETIREMENT_RELEASE_VERSION
  releaseId: string
  releaseDigestSha256: string
  sourceCaptionPrivateQualificationRef: CaptionDomainRef
  captionCompositeRef: CaptionDomainRef
  legacySkillMappings: CaptionLegacySkillMapping[]
  legacyStyleIds: CaptionLegacyStyleId[]
  retirementRegistry: CaptionRetirementRegistry
  rollbackManifest: CaptionRollbackManifest
  oldPlanAndSnapshotDecodersPublished: true
  simpleOverlayCompatibilityPreserved: true
  branchRetirementDocumented: true
  noCentralOrchestraImplemented: true
  providerOrModelRuntimeAuthority: false
  operationDispatchAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}
