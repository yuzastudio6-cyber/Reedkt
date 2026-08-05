import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type { CaptionSemanticRole } from './caption-semantic-style'

export const CAPTION_MULTI_TRACK_SCENE_GRAPH_VERSION =
  'caption-multi-track-scene-graph-v1' as const
export const CAPTION_BROLL_OWNER_READ_BINDING_VERSION =
  'caption-broll-owner-read-binding-v1' as const

export type CaptionSceneTrackRole =
  | 'verbatim_speech'
  | 'semantic_phrase'
  | 'active_word'
  | 'hero_typography'
  | 'persistent_topic_list'
  | 'quote'
  | 'speaker_attribution'
  | 'caption_to_visual'
  | 'accessible_sidecar'
  | 'localized_accessible'

export type CaptionSceneDepthPlane =
  | 'far_background'
  | 'environmental_background'
  | 'behind_subject'
  | 'subject_plane'
  | 'speaker_adjacent'
  | 'object_attached'
  | 'in_front_of_subject'
  | 'foreground_hero'
  | 'full_screen'
  | 'safe_accessible'

export type CaptionSceneMode =
  | 'clean_verbatim'
  | 'spatial_sentence'
  | 'hero_typography'
  | 'minimal_emotional'
  | 'persistent_list'
  | 'caption_to_visual'

export type CaptionSceneCompositionRole =
  | 'caption_only'
  | 'subject_occlusion'
  | 'object_anchor'
  | 'environmental_surface'
  | 'broll_shared_frame'
  | 'full_screen_hero'

export interface CaptionBrollOwnerReadBinding {
  schemaVersion: typeof CAPTION_BROLL_OWNER_READ_BINDING_VERSION
  bindingId: string
  bindingDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  requestedSceneId: string
  planningConstraintRef: CaptionDomainRef
  ownerRequestRef: CaptionDomainRef | null
  ownerResultRef: CaptionDomainRef | null
  selectedMediaManifestRef: CaptionDomainRef | null
  layoutOccupancyRef: CaptionDomainRef | null
  cropTimingRef: CaptionDomainRef | null
  visibleTextEvidenceRef: CaptionDomainRef | null
  bindingState:
    | 'not_applicable'
    | 'planning_constraints_only'
    | 'authenticated_owner_ready'
  evidenceMode: 'contract_fixture' | 'authenticated_private_runtime'
  exactOwnerResultRereadVerified: boolean
  exactScopeFrameAndTimingVerified: boolean
  mediaBytesIncluded: false
  mediaLocatorIncluded: false
  sourceSelectionPerformedByCaption: false
  cropOrTimingPerformedByCaption: false
  runtimeOrDispatchAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionSceneTrack {
  trackId: string
  role: CaptionSceneTrackRole
  priority: 'mandatory_accessibility' | 'primary' | 'supporting' | 'accent'
  rendererPreference: 'remotion' | 'libass' | 'sidecar_only'
  phraseIds: string[]
  persistence: 'phrase_bound' | 'scene_bound' | 'accumulates_until_clear'
  conflictPolicy:
    | 'accessible_wins'
    | 'higher_semantic_priority_wins'
    | 'coexist_only_in_separate_regions'
  accessibleCompletenessRequired: boolean
  reducedMotionCounterpartRequired: boolean
  deliberateRestraintReasonCode: string | null
}

export interface CaptionSceneNode {
  nodeId: string
  trackId: string
  phraseId: string
  semanticRole: CaptionSemanticRole
  exactSourceWordIds: string[]
  typographyRoleId: string
  colorRoleId: string
  fontResolutionRef: CaptionDomainRef
  selectedLineCandidateId: string
  timingRequirementRef: CaptionDomainRef
  compositionRole: CaptionSceneCompositionRole
  requestedRegionId: string
  resolvedRegionId: string
  requestedDepthPlane: CaptionSceneDepthPlane
  resolvedDepthPlane: CaptionSceneDepthPlane
  depthDisposition:
    | 'admitted'
    | 'fallback_safe_top_plane'
    | 'fallback_speaker_adjacent'
    | 'fallback_caption_only'
  trackAllAdmissionRef: CaptionDomainRef | null
  maskSequenceRef: CaptionDomainRef | null
  trackManifestRef: CaptionDomainRef | null
  objectAnchorRef: CaptionDomainRef | null
  brollOwnerBindingRef: CaptionDomainRef | null
  occlusionPolicy: {
    intentional: boolean
    maximumHiddenAreaBasisPoints: number
    maximumHiddenDurationFrames: number
    criticalTokenOcclusionAllowed: false
    accessibleCounterpartVisibleThroughout: true
  }
  motionIntentRef: null
  soundEligibility: 'required' | 'optional' | 'forbidden'
  accessibilityCounterpartNodeId: string | null
  qaRequirementCodes: string[]
  fallbackCode: string
  storyTimingFramesResolved: false
  renderExecutionReady: false
}

export interface CaptionPersistentList {
  listId: string
  trackId: string
  titlePhraseId: string | null
  entries: Array<{
    entryId: string
    phraseId: string
    accumulationOrder: number
    retainAfterReveal: true
    accessibleCounterpartNodeId: string
  }>
  clearCondition: 'scene_end' | 'explicit_handoff' | 'explicit_clear_event'
  maximumVisibleEntries: number
  priorEntriesRemainStable: true
  oneAtATimeSubtitleBehavior: false
}

export interface CaptionSceneEdge {
  edgeId: string
  fromNodeId: string
  toNodeId: string
  edgeKind:
    | 'sequence'
    | 'simultaneous'
    | 'accessibility_counterpart'
    | 'accumulates'
    | 'handoff'
}

export interface CaptionSceneModePhase {
  phaseId: string
  mode: CaptionSceneMode
  activeTrackIds: string[]
  activeNodeIds: string[]
  storyTimingRequirementRef: CaptionDomainRef
  switchReasonCode: string
  transitionOwnerRequestRef: CaptionDomainRef | null
  executableFramesResolved: false
  randomPhraseLevelSwitchingAllowed: false
}

export interface CaptionMultiTrackSceneGraph {
  schemaVersion: typeof CAPTION_MULTI_TRACK_SCENE_GRAPH_VERSION
  graphId: string
  graphDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  semanticStylePlanRef: CaptionDomainRef
  phraseLineageProjectionRef: CaptionDomainRef
  styleProfileRef: CaptionDomainRef
  approvalEnvelopeRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
  pictureLockRef: CaptionDomainRef
  finishReadinessRef: CaptionDomainRef
  occupancyManifestRef: CaptionDomainRef
  visualHierarchyRef: CaptionDomainRef
  trackAllAdmissionRefs: CaptionDomainRef[]
  brollOwnerBindingRef: CaptionDomainRef
  tracks: CaptionSceneTrack[]
  nodes: CaptionSceneNode[]
  persistentLists: CaptionPersistentList[]
  edges: CaptionSceneEdge[]
  modePhases: CaptionSceneModePhase[]
  maximumConcurrentTrackCount: number
  maximumHeroMomentCount: number
  selectedHeroMomentCount: number
  selectedCreativeTrackCount: number
  accessibleTrackCount: number
  structuralDisposition:
    | 'ready_for_storytiming_resolution'
    | 'ready_with_declared_fallbacks'
    | 'blocked_structural_validation'
  blockerCodes: string[]
  fallbackCodesApplied: string[]
  accessibleCompleteWordingRetained: true
  fewestUsefulTracksPolicyApplied: true
  captionAboveLivingFrameByDefault: true
  accessibleCaptionAboveAllVisuals: true
  brollOwnerRetained: true
  trackAllOwnerRetained: true
  storyTimingSoleFrameAuthority: true
  remotionRemainsFinalCanvas: true
  modelAuthoredCodeIncluded: false
  mediaBytesIncluded: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionSceneTrackProposal {
  trackId: string
  role: CaptionSceneTrackRole
  priority: CaptionSceneTrack['priority']
  rendererPreference: CaptionSceneTrack['rendererPreference']
  phraseIds: string[]
  persistence: CaptionSceneTrack['persistence']
  conflictPolicy: CaptionSceneTrack['conflictPolicy']
  reducedMotionCounterpartRequired: boolean
  deliberateRestraintReasonCode: string | null
}

export interface CaptionSceneNodeProposal {
  nodeId: string
  trackId: string
  phraseId: string
  timingRequirementRef: CaptionDomainRef
  compositionRole: CaptionSceneCompositionRole
  requestedRegionId: string
  requestedDepthPlane: CaptionSceneDepthPlane
  trackAllAdmissionId: string | null
  accessibilityCounterpartNodeId: string | null
  maximumHiddenAreaBasisPoints: number
  maximumHiddenDurationFrames: number
  soundEligibility: CaptionSceneNode['soundEligibility']
  qaRequirementCodes: string[]
  fallbackCode: string
}

export interface CaptionSceneGraphProposal {
  tracks: CaptionSceneTrackProposal[]
  nodes: CaptionSceneNodeProposal[]
  persistentLists: CaptionPersistentList[]
  edges: CaptionSceneEdge[]
  modePhases: CaptionSceneModePhase[]
}
