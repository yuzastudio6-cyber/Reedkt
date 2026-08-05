import type { CaptionIntegrationClass } from './caption-design-composite'

export const CAPTION_DOMAIN_CONTRACT_SCHEMA_VERSION =
  'caption-domain-contract-envelope-v1' as const

export const CAPTION_DOMAIN_CONTRACT_VERSIONS = Object.freeze({
  strategy_plan: 'caption-strategy-plan-v1',
  opportunity_map: 'caption-opportunity-map-v1',
  integration_classification: 'caption-integration-classification-v1',
  reservation_plan: 'caption-reservation-plan-v1',
  approval_envelope: 'caption-approval-envelope-v1',
  style_profile: 'caption-style-profile-v1',
  lifecycle: 'caption-lifecycle-v1',
  dependency_manifest: 'caption-dependency-manifest-v1',
  finish_readiness: 'caption-finish-readiness-v1',
  scene_graph: 'caption-scene-graph-v1',
  motion_lock: 'caption-motion-lock-v1',
  render_spec: 'caption-render-spec-v1',
  qa_report: 'caption-qa-report-v1',
  repair_plan: 'caption-repair-plan-v1',
})

export type CaptionDomainContractKind =
  keyof typeof CAPTION_DOMAIN_CONTRACT_VERSIONS

export interface CaptionDomainRef {
  id: string
  version: string
  contentHash: string
}

export interface CaptionDomainFrameRange {
  startFrame: number
  endFrameExclusive: number
}

export interface CaptionDomainCanonicalScope {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planVersionId: string
  approvedSnapshotRef: CaptionDomainRef | null
  outputId: string
  sceneId: string | null
  authorizedFrameRanges: CaptionDomainFrameRange[]
}

export interface CaptionDomainSourceBindings {
  captionCompositeRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
  canonicalTranscriptRef: CaptionDomainRef | null
  masterTimingRef: CaptionDomainRef | null
  storyTimingRef: CaptionDomainRef | null
  captionApprovalEnvelopeRef: CaptionDomainRef | null
}

export interface CaptionDomainClosedAuthorityBoundary {
  canonicalApprovalGranted: false
  snapshotMutationGranted: false
  timelineMutationGranted: false
  workCreationGranted: false
  providerDispatchGranted: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  costAuthorityGranted: false
  billingAuthorityGranted: false
  finalQaApprovalGranted: false
  finalCanvasAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionStrategyPlanPayload {
  projectMode:
    | 'accessibility_first'
    | 'clean_long_form'
    | 'dynamic_short_form'
    | 'cinematic_editorial'
    | 'educational_explainer'
    | 'multi_speaker_dialogue'
    | 'brand_directed'
    | 'minimal_support'
  approximateDensity: 'sparse' | 'balanced' | 'dense'
  primaryLanguage: string
  accessibleProjectionRequired: boolean
  integrationClasses: CaptionIntegrationClass[]
  allowedTypographyRoles: string[]
  likelyHeroMomentCount: number
  likelyMaskOrTrackingNeeded: boolean
  likelyCaptionToVisualHandoffNeeded: boolean
  estimateFactorCodes: string[]
  reasonCodes: string[]
}

export interface CaptionOpportunityMapPayload {
  opportunities: Array<{
    opportunityId: string
    sceneId: string
    frameRange: CaptionDomainFrameRange
    semanticPurposeCode: string
    integrationClass: CaptionIntegrationClass
    confidenceBasisPoints: number
    likelyNeedsVisualEvidence: boolean
    likelyNeedsTracking: boolean
    heroCandidate: boolean
    handoffCandidate: boolean
    sourcePhraseIds: string[]
  }>
}

export interface CaptionIntegrationClassificationPayload {
  sceneClassifications: Array<{
    sceneId: string
    integrationClass: CaptionIntegrationClass
    reasonCodes: string[]
    deliberateNonUse: boolean
  }>
}

export interface CaptionReservationPlanPayload {
  reservations: Array<{
    reservationId: string
    sceneId: string
    frameRange: CaptionDomainFrameRange
    regionBasisPoints: {
      x: number
      y: number
      width: number
      height: number
    }
    priority: 'caption_primary' | 'caption_support' | 'caption_fallback'
    protectedRegionIds: string[]
    fallbackRegionIds: string[]
  }>
  intentOnly: true
  createsLayoutAuthority: false
}

export interface CaptionApprovalEnvelopePayload {
  allowedProjectModes: CaptionStrategyPlanPayload['projectMode'][]
  allowedTypographyRoles: string[]
  maximumMotionLevel: 'none' | 'restrained' | 'moderate' | 'expressive'
  maximumHeroMoments: number
  subjectOverlapAllowed: boolean
  objectAnchoringAllowed: boolean
  captionToVisualAllowed: boolean
  captionSoundAllowed: boolean
  allowedTextTransformations: Array<
    | 'exact'
    | 'punctuation_cleanup'
    | 'filler_omission'
    | 'condensed_without_meaning_change'
    | 'translated'
    | 'paraphrase_requires_approval'
  >
  languages: string[]
  accessibleOutputKinds: Array<'srt' | 'webvtt' | 'stable_burn_in'>
  maximumCaptionCredits: number
  approvedFallbackIds: string[]
  canonicalApprovalStillRequired: true
}

export interface CaptionStyleProfilePayload {
  projectMode: CaptionStrategyPlanPayload['projectMode']
  typographyRoles: Array<{
    roleId: string
    purposeCode: string
    allowedSceneIds: string[]
    maximumFrequency: number
    fontAssetRef: CaptionDomainRef
    weightCodes: string[]
    colorRoleIds: string[]
    motionPresetIds: string[]
    supportedScriptCodes: string[]
    fallbackRoleId: string | null
  }>
  colorRoles: Array<{
    colorRoleId: string
    semanticPurposeCode: string
    colorTokenRef: CaptionDomainRef
    nonColorCounterpartRequired: true
  }>
  legibility: {
    minimumContrastRatioMilli: number
    strokeAllowed: boolean
    shadowAllowed: boolean
    backplateAllowed: boolean
    localScrimAllowed: boolean
    backgroundBlurAllowed: boolean
  }
  motionLanguage: {
    allowedPrimitiveIds: string[]
    repetitionLimit: number
    reducedMotionReplacementIds: string[]
    modelAuthoredCodeAllowed: false
  }
  placementLanguage: {
    preferredZoneIds: string[]
    fallbackZoneIds: string[]
    protectedRoleCodes: string[]
    allowedDepthPlanes: string[]
  }
}

export interface CaptionLifecyclePayload {
  state:
    | 'early_planned'
    | 'reserved'
    | 'waiting_picture_lock'
    | 'finish_ready'
    | 'late_resolved'
    | 'render_ready'
    | 'rendered'
    | 'caption_qa_checked'
    | 'stale'
    | 'blocked'
  affectedSceneIds: string[]
  transitionReasonCodes: string[]
  priorLifecycleRef: CaptionDomainRef | null
  globalWorkflowOwnerChanged: false
}

export interface CaptionDependencyManifestPayload {
  dependencies: Array<{
    dependencyId: string
    ownerKey: string
    artifactType: string
    requiredForJobTypes: string[]
    status: 'ready' | 'missing' | 'stale' | 'not_applicable'
    artifactRef: CaptionDomainRef | null
    affectedSceneIds: string[]
    blockerCode: string | null
  }>
  unrelatedScenesMayContinue: true
}

export interface CaptionFinishReadinessPayload {
  pictureLockRef: CaptionDomainRef | null
  gates: Array<{
    gateCode: string
    status: 'ready' | 'blocked' | 'not_applicable'
    evidenceRef: CaptionDomainRef | null
    affectedSceneIds: string[]
  }>
  readySceneIds: string[]
  blockedSceneIds: string[]
  allFinalCaptionScenesReady: boolean
  staleFinalSceneRenderAllowed: false
}

export interface CaptionSceneGraphPayload {
  nodes: Array<{
    nodeId: string
    sceneId: string
    trackRole:
      | 'verbatim_speech'
      | 'semantic_phrase'
      | 'active_word'
      | 'hero_typography'
      | 'persistent_topic'
      | 'quote'
      | 'speaker_attribution'
      | 'caption_to_visual'
      | 'accessible_sidecar'
    phraseLineageRefs: CaptionDomainRef[]
    typographyRoleId: string
    timingRequirementRef: CaptionDomainRef
    depthPlane: string
    maskOrTrackRef: CaptionDomainRef | null
    objectAnchorRef: CaptionDomainRef | null
    motionIntentRef: CaptionDomainRef | null
    accessibilityCounterpartNodeId: string | null
    fallbackId: string
  }>
  edges: Array<{
    edgeId: string
    fromNodeId: string
    toNodeId: string
    edgeKind: 'sequence' | 'synchronizes_with' | 'accessibility_counterpart'
  }>
  remotionRemainsFinalCanvas: true
}

export interface CaptionMotionLockPayload {
  motions: Array<{
    nodeId: string
    motionPrimitiveId: string
    semanticTimingRequestRef: CaptionDomainRef
    resolvedStoryTimingRef: CaptionDomainRef | null
    reducedMotionPrimitiveId: string
  }>
  storyTimingSoleFrameAuthority: true
  captionAuthoredExecutableFrames: false
  modelAuthoredCodeAllowed: false
}

export interface CaptionRenderSpecPayload {
  renderer: 'remotion' | 'libass' | 'srt' | 'webvtt'
  confirmedFrameRef: CaptionDomainRef
  sceneGraphRef: CaptionDomainRef
  motionLockRef: CaptionDomainRef | null
  fontAssetRefs: CaptionDomainRef[]
  layerOrderRule: 'caption_above_living_frame'
  executableCodeIncluded: false
  arbitraryAssTagsIncluded: false
  arbitraryFfmpegArgumentsIncluded: false
  finalCanvasOwner: 'remotion'
}

export interface CaptionQaReportPayload {
  checks: Array<{
    checkCode: string
    disposition: 'passed' | 'failed' | 'needs_evidence' | 'not_applicable'
    affectedSceneIds: string[]
    evidenceRefs: CaptionDomainRef[]
    proposedRepairCode: string | null
  }>
  captionQaRecommendation: 'accept_caption_scope' | 'repair_caption_scope' | 'block_caption_scope'
  independentFinalQaStillRequired: true
}

export interface CaptionRepairPlanPayload {
  repairs: Array<{
    repairId: string
    issueCode: string
    affectedSceneIds: string[]
    affectedNodeIds: string[]
    repairActionCode: string
    fallbackId: string | null
    requiresNewApproval: boolean
    requiresReinspection: boolean
  }>
  smallestAffectedScopeOnly: true
  hiddenQualityDowngradeAllowed: false
  unrelatedWorkMayContinue: true
}

export interface CaptionDomainPayloadMap {
  strategy_plan: CaptionStrategyPlanPayload
  opportunity_map: CaptionOpportunityMapPayload
  integration_classification: CaptionIntegrationClassificationPayload
  reservation_plan: CaptionReservationPlanPayload
  approval_envelope: CaptionApprovalEnvelopePayload
  style_profile: CaptionStyleProfilePayload
  lifecycle: CaptionLifecyclePayload
  dependency_manifest: CaptionDependencyManifestPayload
  finish_readiness: CaptionFinishReadinessPayload
  scene_graph: CaptionSceneGraphPayload
  motion_lock: CaptionMotionLockPayload
  render_spec: CaptionRenderSpecPayload
  qa_report: CaptionQaReportPayload
  repair_plan: CaptionRepairPlanPayload
}

export type CaptionDomainContract<K extends CaptionDomainContractKind = CaptionDomainContractKind> = {
  schemaVersion: typeof CAPTION_DOMAIN_CONTRACT_SCHEMA_VERSION
  contractId: string
  contractDigestSha256: string
  contractKind: K
  contractVersion: typeof CAPTION_DOMAIN_CONTRACT_VERSIONS[K]
  canonicalScope: CaptionDomainCanonicalScope
  sourceBindings: CaptionDomainSourceBindings
  stalenessTuple: CaptionDomainRef[]
  payload: CaptionDomainPayloadMap[K]
  privateArtifact: true
  byteFree: true
  authorityBoundary: CaptionDomainClosedAuthorityBoundary
}

export type AnyCaptionDomainContract = {
  [K in CaptionDomainContractKind]: CaptionDomainContract<K>
}[CaptionDomainContractKind]
