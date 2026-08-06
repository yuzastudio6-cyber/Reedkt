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

export interface SkillCapabilityManifestCore {
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

export interface SkillCapabilityManifest extends SkillCapabilityManifestCore {
  manifestHash: string
}
