export const SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION =
  'skill-capability-manifest-v1' as const

export type SkillQualificationStatus =
  | 'declared'
  | 'planning_qualified'
  | 'fixture_qualified'
  | 'private_internal_qualified'
  | 'production_qualified'
  | 'blocked'
  | 'deprecated'

export type SkillRequestedMode =
  | 'planning'
  | 'fixture'
  | 'private_internal'
  | 'production'

export interface SkillQualificationByExecutionMode {
  planning: SkillQualificationStatus
  preview_execution: SkillQualificationStatus
  final_execution: SkillQualificationStatus
}

export type SkillScopeLevel =
  | 'clip'
  | 'range'
  | 'multi_range'
  | 'scene'
  | 'boundary'
  | 'sequence'
  | 'video'

export type SkillCallerType =
  | 'head_of_orchestra'
  | 'living_frame'
  | 'three_d'
  | 'motion_design'
  | 'transitions'
  | 'graphic_design'
  | 'typed_peer_skill'

export type SkillPlanningPhase =
  | 'early_study'
  | 'scene_planning'
  | 'boundary_planning'
  | 'post_visual_generation_support'
  | 'post_visual_timing_lock_synchronization'
  | 'pre_final_composition_mixing'
  | 'qa'
  | 'revision'

export type SkillExecutionPhase =
  | 'planning'
  | 'approved_private_execution'
  | 'provider_generation'
  | 'synchronization'
  | 'mixing'
  | 'qa'
  | 'handoff'
  | 'revision'

export type SkillOverlapMode =
  | 'parallel_planning'
  | 'read_only_overlap'
  | 'ordered_execution'
  | 'mutually_exclusive_write'

export interface SkillQualificationEvidenceRef {
  evidenceId: string
  evidenceType:
    | 'test'
    | 'smoke_test'
    | 'fixture'
    | 'provider_canary'
    | 'runtime'
    | 'artifact'
    | 'qa'
    | 'license'
    | 'privacy'
    | 'deployment'
  location: string
  assertion: string
  verifiedAt?: string
}

export interface SkillRouteDefinition {
  routeKey: string
  routeVersion: string
  category:
    | 'project_source'
    | 'internal_library'
    | 'project_extraction'
    | 'local_processing'
    | 'provider'
    | 'no_output'
  displayName: string
  qualificationStatus: SkillQualificationStatus
  qualificationEvidenceRefs: string[]
  serverOwned: true
  paid: boolean
  providerProfileKey?: string
  toolOperationProfileKeys?: string[]
  knownLimitations: string[]
}

export interface SkillAttemptPolicy {
  attemptPolicyKey: string
  attemptPolicyVersion: string
  operationClass: 'deterministic_local' | 'provider_generation' | 'planning'
  defaultCandidateCount: number
  maximumCandidateCount: number
  maximumAttempts: number
  retryEligibility: 'idempotent_only' | 'reconciled_failure_only' | 'not_applicable'
  fallbackEligibility: 'after_reconciled_failure' | 'before_provider_submission_only' | 'not_applicable'
  unknownOutcomeBehavior: 'reconcile_without_resubmission' | 'not_applicable'
  cancellationBehavior: string
  timeoutSeconds: number
  idempotencyRequired: boolean
  failedAttemptsMayRetainCost: boolean
  freshApprovalRequiredAfterExhaustion: boolean
}

export interface SkillEstimatorDeclaration {
  estimatorKey: string
  estimatorVersion: string
  factors: string[]
}

export interface SkillInvalidationRule {
  ruleKey: string
  trigger:
    | 'source_video_hash_changed'
    | 'source_audio_hash_changed'
    | 'visual_artifact_version_changed'
    | 'visual_timing_changed'
    | 'transition_timing_changed'
    | 'tracking_changed'
    | 'motion_path_changed'
    | 'material_metadata_changed'
    | 'speech_timing_changed'
    | 'dialogue_ranges_changed'
    | 'music_context_changed'
    | 'authorized_range_changed'
    | 'locked_layer_state_changed'
    | 'provider_profile_changed'
    | 'tool_profile_changed'
    | 'manifest_version_changed'
    | 'manifest_hash_changed'
    | 'approval_snapshot_changed'
    | 'provenance_status_changed'
  effect: 'invalidate_all' | 'invalidate_affected_ranges' | 'recheck_qa' | 'block_execution'
  appliesToPhases: SkillExecutionPhase[]
}

export interface SkillRevisionRule {
  ruleKey: string
  behavior:
    | 'preserve_unaffected_cues'
    | 'preserve_valid_asset_versions'
    | 'reprocess_invalidated_ranges_only'
    | 'update_cue_manifest'
    | 'update_mix_manifest'
    | 'rerun_affected_qa'
    | 'update_caller_receipt'
    | 'maintain_revision_lineage'
}

export interface SkillOverlapDeclaration {
  skillKey: string
  mode: SkillOverlapMode
}

export interface SkillCapabilityEntry {
  capabilityKey: string
  capabilityVersion: string
  displayName: string
  description: string
  supportedJobType: string
  qualificationStatus: SkillQualificationStatus
  qualificationByExecutionMode: SkillQualificationByExecutionMode
  qualificationEvidenceRefs: string[]
  supportedScopeLevels: SkillScopeLevel[]
  acceptedCallerTypes: SkillCallerType[]
  requiredInputs: string[]
  optionalInputs: string[]
  requiredEvidence: string[]
  acceptedArtifactTypes: string[]
  producedArtifactTypes: string[]
  requiredContext: string[]
  visualIntelligenceRequirements: string[]
  trackingRequirements: string[]
  planningPhase: SkillPlanningPhase
  allowedExecutionPhases: SkillExecutionPhase[]
  mustRunBefore: string[]
  mustRunAfter: string[]
  conflictsWith: string[]
  mayOverlapWith: SkillOverlapDeclaration[]
  ownershipRequirements: string[]
  timeEstimatorKey: string
  creditEstimatorKey: string
  attemptPolicyKey: string
  primaryToolRoutes: string[]
  fallbackRoutes: string[]
  lowerCostRoutes: string[]
  planningQa: string[]
  outputQa: string[]
  integrationQa: string[]
  invalidationRules: string[]
  revisionRules: string[]
  qualificationFixtures: string[]
  knownLimitations: string[]
}

export interface SkillCapabilityManifest {
  manifestSchemaVersion: typeof SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION
  manifestId: string
  manifestHash: string
  skillKey: string
  skillVersion: string
  contractVersion: string
  qualificationStatus: SkillQualificationStatus
  qualificationByExecutionMode: SkillQualificationByExecutionMode
  qualificationEvidenceRefs: SkillQualificationEvidenceRef[]
  skillClass: string
  coordinationCritical: boolean
  canOwnPrimaryVisual: boolean
  canActAsSupport: boolean
  canOperateAtVideoLevel: boolean
  canOperateAtSceneLevel: boolean
  canOperateAtBoundaryLevel: boolean
  supportedJobTypes: string[]
  unsupportedJobTypes: string[]
  requiredInputs: string[]
  optionalInputs: string[]
  requiredSceneContext: string[]
  requiredSourceEvidence: string[]
  visualIntelligenceRequirements: string[]
  trackingRequirements: string[]
  acceptedArtifactTypes: string[]
  producedArtifactTypes: string[]
  planningPhase: SkillPlanningPhase
  allowedExecutionPhases: SkillExecutionPhase[]
  mustRunBefore: string[]
  mustRunAfter: string[]
  conflictsWith: string[]
  mayOverlapWith: SkillOverlapDeclaration[]
  ownershipRequirements: string[]
  timeEstimator: SkillEstimatorDeclaration
  creditEstimator: SkillEstimatorDeclaration
  attemptPolicies: SkillAttemptPolicy[]
  toolRoutes: SkillRouteDefinition[]
  fallbackRoutes: string[]
  lowerCostRoutes: string[]
  planningQa: string[]
  outputQa: string[]
  integrationQa: string[]
  invalidationRules: SkillInvalidationRule[]
  revisionRules: SkillRevisionRule[]
  qualificationFixtures: string[]
  knownLimitations: string[]
  capabilityEntries: SkillCapabilityEntry[]
}

export type UnpublishedSkillCapabilityManifest = Omit<
  SkillCapabilityManifest,
  'manifestHash'
>

export interface SkillEstimateCategory {
  category: string
  minimum: number
  expected: number
  maximum: number
  unit: 'minutes' | 'credits'
}

export interface SkillEstimate {
  estimateVersion: string
  minimum: number
  expected: number
  maximum: number
  confidence: 'low' | 'medium' | 'high'
  assumptions: string[]
  costCategories: SkillEstimateCategory[]
  approvalRequired: boolean
  reservationRequired: boolean
  lowerCostAlternatives: string[]
}

export interface SkillActiveAssignment {
  assignmentId: string
  skillKey: string
  capabilityKey: string
  audioWriteRanges: SkillTimeRange[]
  visualWriteRanges: SkillTimeRange[]
  readOnly: boolean
}

export interface SkillTimeRange {
  startFrame: number
  endFrameExclusive: number
}

export interface SkillJobDescriptor {
  jobId: string
  jobType: string
  requestedMode: SkillRequestedMode
  scopeLevel: SkillScopeLevel
  callerType: SkillCallerType
  primaryVisualOwnershipRequested: boolean
  inputArtifactTypes: string[]
  evidenceKeys: string[]
  planningPhase: SkillPlanningPhase
  durationSeconds: number
  rangeCount: number
  visualEventCount: number
  sourceAudioComplexity: 'low' | 'medium' | 'high'
  speechDensity: 'none' | 'low' | 'medium' | 'high'
  candidateCount: number
  providerDurationSeconds: number
  localOperationCount: number
  qaDepth: 'standard' | 'strong' | 'studio'
  revisionCount: number
  expectedFallbacks: number
  audioWriteRanges: SkillTimeRange[]
  visualWriteRanges: SkillTimeRange[]
  activeAssignments: SkillActiveAssignment[]
  maximumExpectedMinutes?: number
  maximumExpectedCredits?: number
}

export interface SkillManifestBinding {
  skillKey: string
  skillVersion: string
  manifestSchemaVersion: string
  manifestId: string
  manifestHash: string
  capabilityKey: string
  capabilityVersion: string
  qualificationStatus: SkillQualificationStatus
}

export type SkillAssignmentBlockCode =
  | 'unknown_skill'
  | 'unsupported_capability'
  | 'unmet_requirements'
  | 'qualification_blocked'
  | 'scope_not_supported'
  | 'caller_not_supported'
  | 'phase_not_supported'
  | 'ownership_not_supported'
  | 'conflict_detected'
  | 'time_limit_exceeded'
  | 'credit_limit_exceeded'

export interface SkillAssignmentEvaluation {
  ok: boolean
  status: 'eligible' | 'blocked'
  blockCode?: SkillAssignmentBlockCode
  reasons: string[]
  binding?: SkillManifestBinding
  dependencies: string[]
  ordering: {
    mustRunBefore: string[]
    mustRunAfter: string[]
    planningPhase: SkillPlanningPhase
    allowedExecutionPhases: SkillExecutionPhase[]
  }
  conflicts: string[]
  timeEstimate?: SkillEstimate
  creditEstimate?: SkillEstimate
  primaryToolRoutes: SkillRouteDefinition[]
  fallbackRoutes: SkillRouteDefinition[]
  lowerCostRoutes: SkillRouteDefinition[]
  attemptPolicy?: SkillAttemptPolicy
  requiredQa: {
    planning: string[]
    output: string[]
    integration: string[]
  }
  invalidationRules: SkillInvalidationRule[]
  revisionRules: SkillRevisionRule[]
}

export interface SkillPlanInvalidationResult {
  stale: boolean
  incompatible: boolean
  reasons: string[]
  rules: SkillInvalidationRule[]
}
