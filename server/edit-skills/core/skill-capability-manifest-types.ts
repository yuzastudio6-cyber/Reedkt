import type { EditSkillKey, SkillQualificationStatus } from './edit-skill-ids'

export type SkillScopeLevel = 'clip' | 'range' | 'multi_range' | 'scene' | 'boundary' | 'sequence' | 'video'

export interface SkillManifestReference {
  schemaVersion: 'edit-skill-manifest-reference-v1'
  skillKey: EditSkillKey
  skillVersion: string
  contractVersion: string
  manifestHash: string
}

export interface SkillInputRequirement {
  key: string
  artifactType: string
  description: string
  minimumCount: number
  maximumCount: number
}

export interface SkillContextRequirement {
  key: string
  required: boolean
  readScope: 'assignment_range' | 'adjacent_scenes' | 'whole_video_read_only'
  description: string
}

export interface SkillQaReference {
  qaKey: string
  severity: 'info' | 'warning' | 'needs_review' | 'blocking' | 'critical'
  description: string
}

export interface SkillRouteDefinition {
  routeKey: string
  routeKind: 'tool' | 'provider' | 'source' | 'no_action'
  operationRef: string
  priority: number
  requiresApproval: boolean
  description: string
  /** Exact route identity for departments that own a versioned route graph. */
  routeVersion?: string
  routeHash?: string
  supportedJobTypes?: readonly string[]
  requiredInputs?: readonly string[]
  producedArtifactTypes?: readonly string[]
  costClass?: 'zero' | 'local' | 'provider' | 'unavailable'
}

export interface SkillCapabilityEntryDefinition {
  capabilityKey: string
  capabilityVersion: string
  displayName: string
  description: string
  qualificationStatus: SkillQualificationStatus
  evidenceLevel: 'declared' | 'planning' | 'fixture' | 'internal_execution' | 'production' | 'blocked' | 'retired'
  supportedJobTypes: readonly string[]
  supportedScopes: readonly SkillScopeLevel[]
  acceptedCallerTypes: readonly string[]
  requiredInputs: readonly string[]
  optionalInputs: readonly string[]
  acceptedArtifactTypes: readonly string[]
  producedArtifactTypes: readonly string[]
  primaryRouteRefs: readonly SkillExactRouteReference[]
  fallbackRouteRefs: readonly SkillExactRouteReference[]
  lowerCostRouteRefs: readonly SkillExactRouteReference[]
  planningQa: readonly string[]
  outputQa: readonly string[]
  integrationQa: readonly string[]
  knownLimitations: readonly string[]
}

export interface SkillExactRouteReference {
  routeKey: string
  routeVersion: string
  routeHash: string
}

export interface SkillInvalidationRule {
  ruleKey: string
  trigger: string
  invalidates: readonly string[]
  requiresNewApproval: boolean
}

export interface SkillRevisionRule {
  ruleKey: string
  changeClass: 'non_material' | 'material' | 'scope_reducing'
  requiresReestimate: boolean
  requiresNewApproval: boolean
  description: string
}

export interface SkillQualificationFixtureDefinition {
  fixtureKey: string
  minimumStatus: SkillQualificationStatus
  description: string
}

export interface SkillCapabilityManifestV1Core {
  schemaVersion: 'skill-capability-manifest-v1'
  skillKey: EditSkillKey
  skillVersion: string
  contractVersion: string
  qualificationStatus: SkillQualificationStatus
  skillClass: string
  coordinationCritical: boolean
  canOwnPrimaryVisual: boolean
  canActAsSupport: boolean
  canOperateAtVideoLevel: 'none' | 'context_read_only'
  canOperateAtSceneLevel: 'none' | 'bounded_plan_only' | 'bounded_plan_and_execution'
  canOperateAtBoundaryLevel: 'none' | 'coordination_only'
  supportedJobTypes: readonly string[]
  unsupportedJobTypes: readonly string[]
  requiredInputs: readonly SkillInputRequirement[]
  optionalInputs: readonly SkillInputRequirement[]
  requiredSceneContext: readonly SkillContextRequirement[]
  requiredSourceEvidence: readonly string[]
  visualIntelligenceRequirements: readonly string[]
  trackingRequirements: readonly string[]
  acceptedArtifactTypes: readonly string[]
  producedArtifactTypes: readonly string[]
  planningPhase: string
  allowedExecutionPhases: readonly string[]
  mustRunBefore: readonly string[]
  mustRunAfter: readonly string[]
  conflictsWith: readonly EditSkillKey[]
  mayOverlapWith: readonly EditSkillKey[]
  ownershipRequirements: readonly string[]
  timeEstimator: string
  creditEstimator: string
  attemptPolicy: {
    maximumInitialAttempts: number
    maximumRefinements: number
    automaticRetryAllowed: boolean
    alternateProviderFallbackAllowed: boolean
    unknownOutcomeRequiresReconciliation: boolean
  }
  toolRoutes: readonly SkillRouteDefinition[]
  fallbackRoutes: readonly SkillRouteDefinition[]
  lowerCostRoutes: readonly SkillRouteDefinition[]
  planningQa: readonly SkillQaReference[]
  outputQa: readonly SkillQaReference[]
  integrationQa: readonly SkillQaReference[]
  invalidationRules: readonly SkillInvalidationRule[]
  revisionRules: readonly SkillRevisionRule[]
  qualificationFixtures: readonly SkillQualificationFixtureDefinition[]
  knownLimitations: readonly string[]
  /** Optional operation-level projection used by coordination-critical skills. */
  capabilityEntries?: readonly SkillCapabilityEntryDefinition[]
}

export interface SkillSupportedJobCapability {
  jobType: string
  planningAllowed: boolean
  executionAllowed: boolean
  allowedPhases: readonly string[]
  requiredArtifactTypes: readonly string[]
  producedArtifactTypes: readonly string[]
  primaryVisualOwnershipPossible: boolean
  runtimeBindingRequired: boolean
  minimumQualificationStatus: SkillQualificationStatus
}

export interface SkillUnsupportedJobCapability {
  jobType: string
  reason: string
  resolution: 'reject' | 'delegate' | 'needs_user_confirmation' | 'use_no_action'
  alternateOwnerSkillKey?: EditSkillKey
}

export interface SkillSourceEvidenceRequirement {
  requirementKey: string
  acceptedArtifactTypes: readonly string[]
  condition: string
  missingBehavior: 'block' | 'needs_user_confirmation' | 'use_no_action'
}

export interface SkillVisualIntelligenceRequirement {
  requirementKey: string
  requiredArtifactType: string
  requiredForPhase: string
  condition: string
  semanticQaRequirement: 'not_required' | 'required_for_generated_or_provider_edited'
  wholeVideoEvidencePermission: 'forbidden' | 'read_only'
  productionAcceptanceRequirement: 'not_required' | 'production_qualified_producer'
  injectedTestOnlyBehavior: 'not_applicable' | 'reject_for_production'
}

export interface SkillTrackingRequirement {
  requirementKey: string
  condition: string
  acceptedArtifactType: string
  ownerSkill: EditSkillKey
  missingDependencyBehavior: 'needs_other_skill' | 'block'
  modelSpecificDependencyAllowed: false
  requiredForPhase: string
}

export interface SkillPhaseCapability {
  phase: string
  condition: string
  blockingBehavior: 'block' | 'defer' | 'return_dependency'
  approvedPlanRequired: boolean
}

export interface SkillPhaseDependencyRule {
  ruleKey: string
  targetKind: 'skill' | 'phase'
  target: string
  condition: string
  blockingBehavior: 'block' | 'defer' | 'return_dependency'
}

export interface SkillConflictRule {
  ruleKey: string
  targetKind: 'skill' | 'assignment' | 'preference' | 'artifact' | 'ownership_window'
  target: string
  condition: string
  resolution: 'reject_assignment' | 'preserve_existing_owner' | 'use_no_action' | 'return_dependency'
  ownershipBehavior: 'deny_primary_ownership' | 'preserve_existing_owner' | 'reserve_target_area'
  blockingBehavior: 'block' | 'needs_user_confirmation' | 'return_dependency'
}

export interface SkillOverlapRule {
  ruleKey: string
  targetSkill: EditSkillKey
  condition: string
  requiredLayerOrder: string
  visualDensityBehavior: 'enforce_budget' | 'reserve_target_area' | 'support_only'
  ownershipBehavior: 'b_roll_primary' | 'b_roll_support' | 'target_primary' | 'disjoint_primary_windows'
}

export interface SkillOwnershipRule {
  ruleKey: string
  condition: string
  requiredBehavior: string
  violationBehavior: 'block' | 'use_no_action' | 'return_dependency'
}

export interface SkillRouteCapability {
  routeKey: string
  routeKind: 'tool' | 'provider' | 'source' | 'no_action'
  supportedJobTypes: readonly string[]
  operationIds: readonly string[]
  requiredArtifactTypes: readonly string[]
  minimumQualificationStatus: SkillQualificationStatus
  callerSelectable: false
  automaticRetry: false
  automaticAlternateProviderFallback: false
  priority: number
  requiresApproval: boolean
  description: string
}

export interface SkillKnownLimitation {
  limitationKey: string
  affectedJobTypes: readonly string[]
  reason: string
  behavior: 'fail_closed' | 'requires_production_qualification' | 'delegate' | 'bounded_support'
}

export interface SkillCapabilityManifestV2Core extends Omit<
  SkillCapabilityManifestV1Core,
  | 'schemaVersion'
  | 'supportedJobTypes'
  | 'unsupportedJobTypes'
  | 'requiredSourceEvidence'
  | 'visualIntelligenceRequirements'
  | 'trackingRequirements'
  | 'planningPhase'
  | 'allowedExecutionPhases'
  | 'mustRunBefore'
  | 'mustRunAfter'
  | 'conflictsWith'
  | 'mayOverlapWith'
  | 'ownershipRequirements'
  | 'toolRoutes'
  | 'fallbackRoutes'
  | 'lowerCostRoutes'
  | 'knownLimitations'
> {
  schemaVersion: 'skill-capability-manifest-v2'
  supportedJobTypes: readonly SkillSupportedJobCapability[]
  unsupportedJobTypes: readonly SkillUnsupportedJobCapability[]
  requiredSourceEvidence: readonly SkillSourceEvidenceRequirement[]
  visualIntelligenceRequirements: readonly SkillVisualIntelligenceRequirement[]
  trackingRequirements: readonly SkillTrackingRequirement[]
  planningPhase: SkillPhaseCapability
  allowedExecutionPhases: readonly SkillPhaseCapability[]
  mustRunBefore: readonly SkillPhaseDependencyRule[]
  mustRunAfter: readonly SkillPhaseDependencyRule[]
  conflictsWith: readonly SkillConflictRule[]
  mayOverlapWith: readonly SkillOverlapRule[]
  ownershipRequirements: readonly SkillOwnershipRule[]
  toolRoutes: readonly SkillRouteCapability[]
  fallbackRoutes: readonly SkillRouteCapability[]
  lowerCostRoutes: readonly SkillRouteCapability[]
  knownLimitations: readonly SkillKnownLimitation[]
}

export type SkillCapabilityManifestCore =
  | SkillCapabilityManifestV1Core
  | SkillCapabilityManifestV2Core

export type SkillCapabilityManifest = SkillCapabilityManifestCore & {
  manifestHash: string
}
