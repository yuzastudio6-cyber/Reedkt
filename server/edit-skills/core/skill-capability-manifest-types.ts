import type { EditSkillKey, SkillQualificationStatus } from './edit-skill-ids'

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
}

export interface SkillCapabilityManifest extends SkillCapabilityManifestCore {
  manifestHash: string
}

