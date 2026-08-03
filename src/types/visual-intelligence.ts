export const VISUAL_INTELLIGENCE_CONTRACT_VERSION =
  'visual-intelligence-contract-v1' as const
export const VISUAL_INTELLIGENCE_REQUEST_VERSION =
  'visual-intelligence-request-v1' as const
export const VISUAL_INTELLIGENCE_REPORT_VERSION =
  'visual-intelligence-report-v1' as const
export const VISUAL_INTELLIGENCE_PROVIDER_RESULT_VERSION =
  'visual-intelligence-provider-result-v1' as const
export const VISUAL_INSPECTION_REQUIREMENT_VERSION =
  'visual-inspection-requirement-v1' as const
export const VISUAL_INSPECTION_RESULT_VERSION =
  'visual-inspection-result-v1' as const
export const VISUAL_INTELLIGENCE_AUTHENTICATED_READ_REQUEST_VERSION =
  'visual-intelligence-authenticated-read-request-v1' as const
export const VISUAL_INTELLIGENCE_AUTHENTICATED_READ_RESULT_VERSION =
  'visual-intelligence-authenticated-read-result-v1' as const
export const VISUAL_INTELLIGENCE_PLANNING_OPERATION_VERSION =
  'visual-intelligence-planning-operation-v1' as const

export const VISUAL_INTELLIGENCE_EXECUTION_ROUTE_ID =
  'visualIntelligence.execution.create' as const
export const VISUAL_INTELLIGENCE_EXECUTION_ROUTE =
  '/v1/workspaces/:workspaceId/visual-intelligence/executions' as const
export const VISUAL_INTELLIGENCE_INSPECTION_ROUTE_ID =
  'visualIntelligence.inspection.execute' as const
export const VISUAL_INTELLIGENCE_INSPECTION_ROUTE =
  '/v1/workspaces/:workspaceId/visual-intelligence/inspections' as const
export const VISUAL_INTELLIGENCE_AUTHENTICATED_READ_ROUTE_ID =
  'visualIntelligence.report.authenticatedRead' as const
export const VISUAL_INTELLIGENCE_AUTHENTICATED_READ_ROUTE =
  '/v1/workspaces/:workspaceId/visual-intelligence/reports/authenticated-read' as const
export const VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE_ID =
  'visualIntelligence.planningOperation.execute' as const
export const VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE =
  '/v1/workspaces/:workspaceId/visual-intelligence/planning-operations' as const

export const VISUAL_INTELLIGENCE_CAPABILITY_ID =
  'visual_intelligence' as const

export const VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS = [
  'visual_intelligence.analyze_media',
  'visual_intelligence.inspect_edit',
  'visual_intelligence.query_range',
  'visual_intelligence.compare_media',
] as const

/** @deprecated These are internal operations, not top-level skill IDs. */
export const VISUAL_INTELLIGENCE_SKILL_IDS =
  VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS

export type VisualIntelligenceInternalOperationId =
  typeof VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS[number]

/** @deprecated Use VisualIntelligenceInternalOperationId. */
export type VisualIntelligenceSkillId =
  VisualIntelligenceInternalOperationId

export const VISUAL_INTELLIGENCE_OPERATIONS = [
  'analyze_media',
  'inspect_edit',
  'query_range',
  'compare_media',
] as const

export type VisualIntelligenceOperation =
  typeof VISUAL_INTELLIGENCE_OPERATIONS[number]

export const VISUAL_INTELLIGENCE_ANALYZE_PROFILES = [
  'source_edit_planning',
  'reference_preference_dna',
  'story_structure',
  'visual_style',
  'subject_object_action_index',
  'composition_safe_zones',
  'screen_content_analysis',
] as const

export const VISUAL_INTELLIGENCE_INSPECTION_PROFILES = [
  'caption_layout_qa',
  'graphics_layout_qa',
  'motion_graphics_qa',
  'living_frame_qa',
  'smart_cut_qa',
  'continuity_qa',
  'compositing_qa',
  'color_context_qa',
  'aspect_ratio_adaptation_qa',
  'final_render_visual_qa',
] as const

export const VISUAL_INTELLIGENCE_QUERY_PROFILES = [
  'identify_primary_subject',
  'explain_visible_action',
  'find_available_graphic_space',
  'inspect_transition_window',
  'verify_screen_text',
  'check_subject_occlusion',
  'verify_safe_zone',
  'inspect_visual_defect',
] as const

export const VISUAL_INTELLIGENCE_COMPARISON_PROFILES = [
  'source_vs_preview',
  'preview_vs_revised_preview',
  'expected_vs_rendered_motion',
  'before_vs_after_composite',
  'before_vs_after_color',
  'aspect_ratio_source_vs_adaptation',
  'reference_principles_vs_target_adaptation',
] as const

export type VisualIntelligenceAnalyzeProfile =
  typeof VISUAL_INTELLIGENCE_ANALYZE_PROFILES[number]
export type VisualIntelligenceInspectionProfile =
  typeof VISUAL_INTELLIGENCE_INSPECTION_PROFILES[number]
export type VisualIntelligenceQueryProfile =
  typeof VISUAL_INTELLIGENCE_QUERY_PROFILES[number]
export type VisualIntelligenceComparisonProfile =
  typeof VISUAL_INTELLIGENCE_COMPARISON_PROFILES[number]
export type VisualIntelligenceProfile =
  | VisualIntelligenceAnalyzeProfile
  | VisualIntelligenceInspectionProfile
  | VisualIntelligenceQueryProfile
  | VisualIntelligenceComparisonProfile

export const VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID =
  'vertex_gemini_pro' as const
export const VISUAL_INTELLIGENCE_PROVIDER_ID = 'google_vertex_ai' as const
export const VISUAL_INTELLIGENCE_MODEL_ID =
  'gemini-3.1-pro-preview' as const
export const VISUAL_INTELLIGENCE_QUALITY_PROFILE =
  'professional_high' as const
export const VISUAL_INTELLIGENCE_THINKING_LEVEL = 'high' as const
export const VISUAL_INTELLIGENCE_MEDIA_RESOLUTION = 'high' as const

export interface VisualIntelligenceEvidenceRef {
  id: string
  version: number
  contentHash: string
}

export interface VisualIntelligenceFrameRate {
  numerator: number
  denominator: number
}

export interface VisualIntelligenceFrameRange {
  startFrame: number
  endFrameExclusive: number
  frameRate: VisualIntelligenceFrameRate
}

export interface VisualIntelligenceArtifactBinding {
  artifactId: string
  mediaKind: 'video' | 'image'
  contentType: string
  checksumSha256: string
  byteLength: number
  width: number
  height: number
  durationFrames: number
  frameRate: VisualIntelligenceFrameRate
  finalizedMediaAuthorityRef: VisualIntelligenceEvidenceRef
  immutableStorageObjectAuthorityRef: VisualIntelligenceEvidenceRef
  mediaProbeEvidenceRef: VisualIntelligenceEvidenceRef
  privateArtifact: true
  exactGenerationRereadRequiredAtDispatch: true
}

export interface VisualIntelligenceOutputFrame {
  outputId: string
  aspectRatioLabel: string
  aspectRatioNumerator: number
  aspectRatioDenominator: number
  width: number
  height: number
  frameRate: VisualIntelligenceFrameRate
  confirmedOutputFrameRef: VisualIntelligenceEvidenceRef
  confirmedByUser: true
}

/**
 * Immutable canonical output identity shared by Planning, render, and Visual
 * Intelligence. This provider-neutral binding replaces the former
 * post-render-provider-specific output binding for all new work.
 */
export interface VisualIntelligenceConfirmedOutputBinding {
  outputId: string
  aspectRatioLabel: 'original' | 'custom' | `${number}:${number}`
  aspectRatioNumerator: number
  aspectRatioDenominator: number
  width: number
  height: number
  fpsNumerator: number
  fpsDenominator: number
  confirmedOutputFrameRef: VisualIntelligenceEvidenceRef
  confirmedOutputFrameBindingDigestSha256: string
  confirmedByUser: true
  confirmationRecordId: string
}

export interface VisualIntelligenceProtectedZone {
  zoneId: string
  role:
    | 'face'
    | 'speaker'
    | 'product'
    | 'caption'
    | 'graphic'
    | 'map_label'
    | 'chart_label'
    | 'source_label'
    | 'fact_safety_note'
    | 'custom'
  xBasisPoints: number
  yBasisPoints: number
  widthBasisPoints: number
  heightBasisPoints: number
  protectedZoneRef: VisualIntelligenceEvidenceRef
}

export interface VisualIntelligenceQualityPolicy {
  profile: typeof VISUAL_INTELLIGENCE_QUALITY_PROFILE
  providerAdapterId: typeof VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID
  exactModelId: typeof VISUAL_INTELLIGENCE_MODEL_ID
  thinkingLevel: typeof VISUAL_INTELLIGENCE_THINKING_LEVEL
  mediaResolution: typeof VISUAL_INTELLIGENCE_MEDIA_RESOLUTION
  proClassModelRequired: true
  flashFallbackAllowed: false
  cheaperModelFallbackAllowed: false
  lowerQualityFallbackAllowed: false
  silentModelSubstitutionAllowed: false
  providerToolsAllowed: false
  functionCallingAllowed: false
  searchGroundingAllowed: false
  urlContextAllowed: false
  codeExecutionAllowed: false
}

export interface VisualIntelligenceCostPreflight {
  pricingSnapshotRef: VisualIntelligenceEvidenceRef
  accountEffectiveRateAuthorityRef: VisualIntelligenceEvidenceRef
  currency: string
  maximumAuthorizedCostMicros: number
  estimatedMinimumCostMicros: number
  estimatedMaximumCostMicros: number
  serviceFeeIncluded: false
  publicListPriceUsedAsSettlementAuthority: false
  preflightPassed: true
}

export interface VisualIntelligencePlanningEvidenceAdmission {
  mode: 'planning_evidence'
  authenticatedPrincipalRef: VisualIntelligenceEvidenceRef
  workspaceAuthorizationRef: VisualIntelligenceEvidenceRef
  finalizedSourceAuthorityRefs: VisualIntelligenceEvidenceRef[]
  sourceChecksumSetRef: VisualIntelligenceEvidenceRef
  analysisAllowanceRef: VisualIntelligenceEvidenceRef
  costPreflight: VisualIntelligenceCostPreflight
  retentionPolicyRef: VisualIntelligenceEvidenceRef
  privacyPolicyRef: VisualIntelligenceEvidenceRef
  providerReleaseRef: VisualIntelligenceEvidenceRef
  globalKillSwitchOpen: false
  providerKillSwitchOpen: false
  reportPersistenceAllowed: true
  timelineMutationAllowed: false
  editingWorkerExecutionAllowed: false
  generationAllowed: false
  renderAllowed: false
  exportAllowed: false
  deliveryAllowed: false
}

export interface VisualIntelligenceApprovedEditInspectionAdmission {
  mode: 'approved_edit_inspection'
  authenticatedPrincipalRef: VisualIntelligenceEvidenceRef
  workspaceAuthorizationRef: VisualIntelligenceEvidenceRef
  approvedPlanSnapshotRef: VisualIntelligenceEvidenceRef
  approvedEstimateRef: VisualIntelligenceEvidenceRef
  creditReservationRef: VisualIntelligenceEvidenceRef
  privatePreviewArtifactRef: VisualIntelligenceEvidenceRef
  expectedOutcomeRefs: VisualIntelligenceEvidenceRef[]
  workNodeRefs: VisualIntelligenceEvidenceRef[]
  timelineRefs: VisualIntelligenceEvidenceRef[]
  qaPolicyRef: VisualIntelligenceEvidenceRef
  costPreflight: VisualIntelligenceCostPreflight
  retentionPolicyRef: VisualIntelligenceEvidenceRef
  privacyPolicyRef: VisualIntelligenceEvidenceRef
  providerReleaseRef: VisualIntelligenceEvidenceRef
  globalKillSwitchOpen: false
  providerKillSwitchOpen: false
  reportPersistenceAllowed: true
  timelineMutationAllowed: false
  owningSkillRepairAllowed: true
  directRepairAllowed: false
  finalQaApprovalAllowed: false
  exportReleaseAllowed: false
  deliveryAllowed: false
}

export type VisualIntelligenceAdmission =
  | VisualIntelligencePlanningEvidenceAdmission
  | VisualIntelligenceApprovedEditInspectionAdmission

export interface VisualIntelligenceRequest {
  schemaVersion: typeof VISUAL_INTELLIGENCE_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  idempotencyKey: string
  scope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string | null
  }
  operation: VisualIntelligenceOperation
  profile: VisualIntelligenceProfile
  sourceArtifacts: VisualIntelligenceArtifactBinding[]
  comparisonArtifacts: VisualIntelligenceArtifactBinding[]
  requestedRanges: VisualIntelligenceFrameRange[]
  requiredEvidenceRefs: VisualIntelligenceEvidenceRef[]
  expectedOutcomeRefs: VisualIntelligenceEvidenceRef[]
  outputFrame: VisualIntelligenceOutputFrame | null
  protectedZones: VisualIntelligenceProtectedZone[]
  qualityPolicy: VisualIntelligenceQualityPolicy
  admission: VisualIntelligenceAdmission
  callerQuestion: string | null
  byteFreeRequest: true
  callerPromptAccepted: false
  providerCredentialIncluded: false
  publicMediaUrlIncluded: false
  signedUrlIsSourceTruth: false
  shellCommandIncluded: false
  providerToolDefinitionIncluded: false
}

/**
 * Byte-free server-owned request to derive a bounded planning-time Visual
 * Intelligence operation from already admitted immutable media evidence. The
 * canonical owner independently rereads every upstream request and creates the
 * new admission; callers cannot supply an admission, model, prompt, media
 * locator, or cost assertion.
 */
export interface VisualIntelligencePlanningOperationInput {
  schemaVersion: typeof VISUAL_INTELLIGENCE_PLANNING_OPERATION_VERSION
  inputDigestSha256: string
  requestId: string
  idempotencyKey: string
  scope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: null
  }
  operation: Exclude<VisualIntelligenceOperation, 'inspect_edit'>
  profile: Exclude<VisualIntelligenceProfile, VisualIntelligenceInspectionProfile>
  sourceEvidenceRequests: VisualIntelligenceRequest[]
  comparisonEvidenceRequests: VisualIntelligenceRequest[]
  requestedRanges: VisualIntelligenceFrameRange[]
  expectedOutcomeRefs: VisualIntelligenceEvidenceRef[]
  outputFrame: VisualIntelligenceOutputFrame | null
  protectedZones: VisualIntelligenceProtectedZone[]
  callerQuestion: string | null
  byteFreeRequest: true
  callerPromptAccepted: false
  callerAdmissionAccepted: false
  callerCostAssertionAccepted: false
  mediaLocatorIncluded: false
  providerCredentialIncluded: false
}

export type VisualIntelligenceDeterministicTool =
  | 'ffprobe'
  | 'ffmpeg'
  | 'pyscenedetect'
  | 'opencv'
  | 'faster_whisper'
  | 'ocr'

export interface VisualIntelligenceEvidence {
  evidenceId: string
  evidenceRef: VisualIntelligenceEvidenceRef
  artifactId: string
  range: VisualIntelligenceFrameRange | null
  authority:
    | 'media_probe'
    | 'media_transform'
    | 'scene_detection'
    | 'pixel_measurement'
    | 'canonical_transcript'
    | 'exact_ocr'
    | 'semantic_visual_judgment'
  producingTool: VisualIntelligenceDeterministicTool | 'gemini_pro_high'
  toolVersion: string
  summary: string
  privateEvidence: true
  providerInstructionAccepted: false
}

export interface VisualIntelligenceToolExecutionEvidence {
  tool: VisualIntelligenceDeterministicTool
  requirement: 'required' | 'conditional'
  executionClass: 'l4_gpu_standard' | 'a100_80gb_gpu_heavy'
  releaseRef: VisualIntelligenceEvidenceRef
  executionRef: VisualIntelligenceEvidenceRef
  substantiveCpuExecutionUsed: false
  sourceArtifactChecksumBound: true
}

export interface VisualIntelligenceSamplingPolicy {
  policyId: string
  policyVersion: string
  mode:
    | 'native_complete_video'
    | 'scene_aware_complete_coverage'
    | 'general_overview'
    | 'moderate_visual_change'
    | 'fast_motion'
    | 'transition_detail'
    | 'high_frequency_defect'
  targetFramesPerSecondNumerator: number
  targetFramesPerSecondDenominator: number
  sceneAware: boolean
  highDetail: boolean
  requestedRange: VisualIntelligenceFrameRange
  analyzedRange: VisualIntelligenceFrameRange
  samplingPolicyRef: VisualIntelligenceEvidenceRef
}

export interface VisualIntelligenceCoverage {
  requestedRanges: VisualIntelligenceFrameRange[]
  analyzedRanges: VisualIntelligenceFrameRange[]
  incompleteRanges: VisualIntelligenceFrameRange[]
  sceneBoundaryRefs: VisualIntelligenceEvidenceRef[]
  samplingPolicies: VisualIntelligenceSamplingPolicy[]
  targetedFollowupRanges: VisualIntelligenceFrameRange[]
  completeRequestedRangeCoverage: boolean
  everyTimelineFrameInspected: false
  completeTimePixelInspectionClaimAllowed: false
}

/**
 * Server-owned deterministic evidence package prepared before a semantic
 * provider call. GCS coordinates remain private control-plane data and never
 * appear in Orchestra jobs, browser requests, or persisted public reports.
 */
export interface VisualIntelligencePreparedEvidence {
  readonly deterministicEvidence: VisualIntelligenceEvidence[]
  readonly coveragePlan: VisualIntelligenceCoverage
  readonly privateMediaInputs: Array<{
    artifactId: string
    gcsUri: string
    contentType: string
    checksumSha256: string
    exactGenerationRereadVerified: true
  }>
  readonly transcriptVersion: string | null
  readonly ocrVersion: string | null
  readonly toolExecutionEvidence:
    readonly VisualIntelligenceToolExecutionEvidence[]
  readonly preparedEvidenceRef: VisualIntelligenceEvidenceRef
}

/**
 * Source-cleanup classifications emitted only by the source-edit-planning
 * profile. Keeping these fields separate from generic action labels prevents
 * downstream planning from guessing that a descriptive label is a cut.
 */
export interface VisualIntelligenceSourcePlanningObservation {
  sourceFunction:
    | 'hook'
    | 'active_action'
    | 'setup'
    | 'dialogue'
    | 'reaction'
    | 'detail'
    | 'transition'
    | 'idle'
    | 'unusable'
    | 'uncertain'
  actionIntensity: 'none' | 'low' | 'medium' | 'high'
  editUsability: 'strong' | 'usable' | 'weak' | 'reject'
  cameraStability: 'stable' | 'usable_motion' | 'unstable' | 'uncertain'
  continuity: 'continuous' | 'discontinuous' | 'uncertain'
}

export interface VisualIntelligenceSegment {
  segmentId: string
  artifactId: string
  range: VisualIntelligenceFrameRange
  sceneId: string | null
  summary: string
  subjectIds: string[]
  objectIds: string[]
  actionLabels: string[]
  visibleTextEvidenceRefs: VisualIntelligenceEvidenceRef[]
  transcriptEvidenceRefs: VisualIntelligenceEvidenceRef[]
  evidenceRefs: VisualIntelligenceEvidenceRef[]
  confidenceBasisPoints: number
  uncertainty: string | null
  sourcePlanning: VisualIntelligenceSourcePlanningObservation | null
}

export type VisualIntelligenceFindingSeverity =
  | 'info'
  | 'warning'
  | 'revision_required'
  | 'blocking'

export type VisualIntelligenceFindingOwner =
  | 'planning'
  | 'caption'
  | 'graphics'
  | 'motion_graphics'
  | 'living_frame'
  | 'smart_cut'
  | 'compositing'
  | 'color'
  | 'aspect_ratio'
  | 'render'
  | 'private_review'
  | 'human_review'

export interface VisualIntelligenceFinding {
  findingId: string
  artifactId: string
  range: VisualIntelligenceFrameRange
  category: string
  severity: VisualIntelligenceFindingSeverity
  summary: string
  evidenceRefs: VisualIntelligenceEvidenceRef[]
  expectedOutcomeRefs: VisualIntelligenceEvidenceRef[]
  confidenceBasisPoints: number
  uncertainty: string | null
  recommendedOwner: VisualIntelligenceFindingOwner
  reinspectionRequired: boolean
  directTimelineMutationAllowed: false
  providerInstructionAccepted: false
}

export interface VisualIntelligenceUsage {
  promptTokenCount: number
  candidateTokenCount: number
  thinkingTokenCount: number
  cachedTokenCount: number
  totalTokenCount: number
  providerResponseId: string
  providerModelVersion: string
  estimatedCostMicros: number
  settledCostMicros: number | null
  costEvidenceRef: VisualIntelligenceEvidenceRef | null
  billingAccountEffectiveRateUsed: true
  publicListPriceUsed: false
  duplicateSettlementPerformed: false
  replayedFromCache: boolean
  providerCallMade: boolean
}

export interface VisualIntelligenceProvenance {
  providerAdapterId: typeof VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID
  providerId: typeof VISUAL_INTELLIGENCE_PROVIDER_ID
  exactModelId: typeof VISUAL_INTELLIGENCE_MODEL_ID
  thinkingLevel: typeof VISUAL_INTELLIGENCE_THINKING_LEVEL
  mediaResolution: typeof VISUAL_INTELLIGENCE_MEDIA_RESOLUTION
  promptVersion: string
  responseSchemaVersion: string
  deterministicEvidenceVersion: string
  transcriptVersion: string | null
  ocrVersion: string | null
  cacheIdentitySha256: string
  requestDigestSha256: string
  admissionRef: VisualIntelligenceEvidenceRef
  providerReleaseRef: VisualIntelligenceEvidenceRef
  applicationDefaultCredentialsUsed: true
  providerToolsUsed: false
  searchGroundingUsed: false
  urlContextUsed: false
  codeExecutionUsed: false
  rawProviderPayloadPersisted: false
}

export interface VisualIntelligenceReport {
  schemaVersion: typeof VISUAL_INTELLIGENCE_REPORT_VERSION
  reportId: string
  reportDigestSha256: string
  requestRef: VisualIntelligenceEvidenceRef
  scope: VisualIntelligenceRequest['scope']
  operation: VisualIntelligenceOperation
  profile: VisualIntelligenceProfile
  sourceArtifacts: Array<{
    artifactId: string
    checksumSha256: string
    mediaKind: 'video' | 'image'
    durationFrames: number
  }>
  comparisonArtifacts: Array<{
    artifactId: string
    checksumSha256: string
    mediaKind: 'video' | 'image'
    durationFrames: number
  }>
  coverage: VisualIntelligenceCoverage
  semanticSummary: string
  segments: VisualIntelligenceSegment[]
  findings: VisualIntelligenceFinding[]
  evidence: VisualIntelligenceEvidence[]
  deterministicToolExecutions: VisualIntelligenceToolExecutionEvidence[]
  expectedOutcomeRefs: VisualIntelligenceEvidenceRef[]
  disposition: 'pass' | 'pass_with_warnings' | 'needs_revision' | 'blocked'
  reinspectionRequired: boolean
  usage: VisualIntelligenceUsage
  provenance: VisualIntelligenceProvenance
  blockers: string[]
  warnings: string[]
  immutableReport: true
  planningMayConsumeValidatedEvidence: boolean
  directTimelineMutationAllowed: false
  renderPerformedByVisualIntelligence: false
  exportAuthorized: false
  deliveryAuthorized: false
}

/**
 * Byte-free authenticated reread of one immutable Visual Intelligence report.
 * The caller supplies only opaque canonical identity; media locations, provider
 * payloads, credentials, and browser-local completion are never accepted.
 */
export interface VisualIntelligenceAuthenticatedReadRequest {
  schemaVersion:
    typeof VISUAL_INTELLIGENCE_AUTHENTICATED_READ_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  scope: VisualIntelligenceRequest['scope']
  reportRef: VisualIntelligenceEvidenceRef
  byteFreeRequest: true
  browserLocalCompletionAccepted: false
}

export interface VisualIntelligenceAuthenticatedReadResult {
  schemaVersion:
    typeof VISUAL_INTELLIGENCE_AUTHENTICATED_READ_RESULT_VERSION
  resultDigestSha256: string
  disposition: 'not_found' | 'completed'
  requestRef: VisualIntelligenceEvidenceRef
  scope: VisualIntelligenceRequest['scope']
  requestedReportRef: VisualIntelligenceEvidenceRef
  report: VisualIntelligenceReport | null
  authenticatedPrincipalVerified: true
  exactCanonicalScopeReread: true
  immutableReportReread: boolean
  browserLocalStateUsed: false
  rawProviderPayloadIncluded: false
  mediaBytesIncluded: false
  pathsOrUrlsIncluded: false
  authorityBoundary: {
    operationDispatchAuthority: false
    providerRuntimeAuthority: false
    qaApprovalAuthority: false
    repairExecutionAuthority: false
    timelineMutationAuthority: false
    assetMutationAuthority: false
    creditOrBillingMutationAuthority: false
    exportAuthority: false
    publicDeliveryAuthority: false
    productionAuthority: false
  }
}

export interface VisualIntelligenceProviderRequest {
  request: VisualIntelligenceRequest
  deterministicEvidence: VisualIntelligenceEvidence[]
  coveragePlan: VisualIntelligenceCoverage
  privateMediaInputs: Array<{
    artifactId: string
    gcsUri: string
    contentType: string
    checksumSha256: string
    exactGenerationRereadVerified: true
  }>
  promptVersion: string
  responseSchemaVersion: string
}

export interface VisualIntelligenceProviderPreflight {
  requestConfigurationDigestSha256: string
  exactModelId: typeof VISUAL_INTELLIGENCE_MODEL_ID
  professionalHighEnforced: true
  automaticProviderRetryAllowed: false
  providerToolsAllowed: false
  callerPromptAccepted: false
}

export interface VisualIntelligenceProviderNormalizedResult {
  schemaVersion: typeof VISUAL_INTELLIGENCE_PROVIDER_RESULT_VERSION
  requestId: string
  semanticSummary: string
  segments: VisualIntelligenceSegment[]
  findings: VisualIntelligenceFinding[]
  targetedFollowupRanges: VisualIntelligenceFrameRange[]
  warnings: string[]
  mediaContentTreatedAsUntrusted: true
  providerInstructionsFollowedFromMedia: false
  editingOrRenderingClaimed: false
}

export interface VisualIntelligenceProviderExecutionResult {
  normalizedResult: VisualIntelligenceProviderNormalizedResult
  usage: VisualIntelligenceUsage
  provenance: Omit<VisualIntelligenceProvenance,
    'cacheIdentitySha256' | 'requestDigestSha256' | 'admissionRef' |
    'providerReleaseRef' | 'deterministicEvidenceVersion' |
    'transcriptVersion' | 'ocrVersion'>
  sanitizedDiagnostics: string[]
}

export interface VisualIntelligenceProvider {
  adapterId: typeof VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID
  preflight(
    input: VisualIntelligenceProviderRequest,
  ): VisualIntelligenceProviderPreflight
  execute(
    input: VisualIntelligenceProviderRequest,
  ): Promise<VisualIntelligenceProviderExecutionResult>
}

export interface VisualInspectionRequirement {
  schemaVersion: typeof VISUAL_INSPECTION_REQUIREMENT_VERSION
  inspectionId: string
  inspectionDigestSha256: string
  owningWorkNodeId: string
  owningSkillId: string
  profile: VisualIntelligenceInspectionProfile
  expectedOutcomeRefs: VisualIntelligenceEvidenceRef[]
  requestedRanges: VisualIntelligenceFrameRange[]
  required: boolean
  blocksNextWorkNode: boolean
  blocksPreview: boolean
  blocksFinalExport: boolean
  maximumRepairCycles: 2
  currentRepairCycle: 0 | 1 | 2
}

export interface VisualInspectionResult {
  schemaVersion: typeof VISUAL_INSPECTION_RESULT_VERSION
  inspectionRef: VisualIntelligenceEvidenceRef
  reportRef: VisualIntelligenceEvidenceRef
  disposition: VisualIntelligenceReport['disposition']
  owningSkillId: string
  findingIds: string[]
  repairCycle: 0 | 1 | 2
  routeToOwningSkill: boolean
  automaticRepairAllowed: boolean
  automaticSpendStopped: boolean
  blocksNextWorkNode: boolean
  blocksPreview: boolean
  blocksFinalExport: boolean
  planningOrHumanReviewRequired: boolean
  visualIntelligenceMutatedEdit: false
}
