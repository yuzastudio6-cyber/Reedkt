export const ORCHESTRA_SKILL_CAPABILITY_MANIFEST_VERSION =
  'skill-capability-manifest-v1' as const
export const ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION =
  'skill-qualification-snapshot-v1' as const
export const ORCHESTRA_SKILL_SUPPORT_REQUEST_VERSION =
  'skill-support-request-v1' as const
export const ORCHESTRA_SKILL_CALL_VERSION =
  'orchestra-skill-call-v1' as const
export const ORCHESTRA_SKILL_JOB_RESULT_VERSION =
  'orchestra-skill-job-result-v1' as const
export const ORCHESTRA_VISUAL_INTELLIGENCE_JOB_ROUTE_ID =
  'orchestra.visualIntelligence.job.execute' as const
export const ORCHESTRA_VISUAL_INTELLIGENCE_JOB_ROUTE =
  '/internal/v1/workspaces/:workspaceId/orchestra/skill-jobs/visual-intelligence' as const

export interface OrchestraEvidenceRef {
  id: string
  version: number
  contentHash: string
}

export interface OrchestraFrameRate {
  numerator: number
  denominator: number
}

export interface OrchestraFrameRange {
  startFrame: number
  endFrameExclusive: number
  frameRate: OrchestraFrameRate
}

export interface OrchestraVideoScope {
  scopeType: 'video'
  sourceArtifactRef: OrchestraEvidenceRef
  authorizedRanges: OrchestraFrameRange[]
  completeSourceCoverageRequired: boolean
  outputId: string | null
}

export interface OrchestraSceneScope {
  scopeType: 'scene'
  sourceArtifactRef: OrchestraEvidenceRef
  sceneId: string
  outputId: string
  authorizedRange: OrchestraFrameRange
  selectedSceneBindingRef: OrchestraEvidenceRef
  completeSceneCoverageRequired: boolean
}

export interface OrchestraBoundaryScope {
  scopeType: 'boundary'
  sourceArtifactRef: OrchestraEvidenceRef
  leftSceneId: string
  rightSceneId: string
  outputId: string
  boundaryFrame: number
  authorizedRange: OrchestraFrameRange
  boundaryBindingRef: OrchestraEvidenceRef
}

export type OrchestraSkillScope =
  | OrchestraVideoScope
  | OrchestraSceneScope
  | OrchestraBoundaryScope

export type OrchestraExecutionPhase =
  | 'planning'
  | 'preapproval'
  | 'approved_execution'
  | 'postrender_inspection'
  | 'revision_inspection'
  | 'private_review'

export type OrchestraSkillClass =
  | 'creative_owner'
  | 'analysis_support'
  | 'media_utility'
  | 'tracking_support'
  | 'qa_support'

export interface SkillSupportRequest {
  schemaVersion: typeof ORCHESTRA_SKILL_SUPPORT_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  requestingSkillKey: string
  requestingSkillJobId: string
  parentOrchestraJobId: string
  requiredCapability: string
  requestedJobType: string
  phase: OrchestraExecutionPhase
  scope: OrchestraSkillScope
  purposeCode: string
  inputArtifactRefs: OrchestraEvidenceRef[]
  comparisonArtifactRefs: OrchestraEvidenceRef[]
  expectedOutcomeRefs: OrchestraEvidenceRef[]
  requiredEvidenceRefs: OrchestraEvidenceRef[]
  urgency: 'normal' | 'blocking'
  supportRequestOnly: true
  executionAuthorityGranted: false
  providerInvocationAuthorityGranted: false
  timelineMutationAuthorityGranted: false
  scopeExpansionAuthorityGranted: false
}

export interface OrchestraSkillCall {
  schemaVersion: typeof ORCHESTRA_SKILL_CALL_VERSION
  callId: string
  callDigestSha256: string
  orchestraPlanRef: OrchestraEvidenceRef
  orchestraJobRef: OrchestraEvidenceRef
  parentJobRef: OrchestraEvidenceRef | null
  requestedBy:
    | { kind: 'orchestra' }
    | {
        kind: 'skill'
        skillKey: string
        skillJobRef: OrchestraEvidenceRef
        supportRequestRef: OrchestraEvidenceRef
      }
  targetSkillKey: string
  jobType: string
  phase: OrchestraExecutionPhase
  scope: OrchestraSkillScope
  sceneContextSnapshotRef: OrchestraEvidenceRef | null
  sourceArtifactRefs: OrchestraEvidenceRef[]
  comparisonArtifactRefs: OrchestraEvidenceRef[]
  expectedOutcomeRefs: OrchestraEvidenceRef[]
  requiredEvidenceRefs: OrchestraEvidenceRef[]
  manifestRef: OrchestraEvidenceRef
  qualificationSnapshotRef: OrchestraEvidenceRef
  timeBudgetRef: OrchestraEvidenceRef
  creditBudgetRef: OrchestraEvidenceRef
  attemptEnvelopeRef: OrchestraEvidenceRef
  approvedSnapshotRef: OrchestraEvidenceRef | null
  idempotencyKey: string
  orchestraDispatchAuthorized: true
  directProviderCallAllowed: false
  directTimelineMutationAllowed: false
  directArtifactMutationAllowed: false
  scopeExpansionAllowed: false
  peerSkillExecutionAuthorityAccepted: false
}

export interface SkillJobCapability {
  jobType: string
  purposeCode: string
  supportedScopeTypes: readonly OrchestraSkillScope['scopeType'][]
  internalOperationId: string
  requiredProfileIds: readonly string[]
  partialResultAllowed: boolean
}

export interface SkillInputRequirement {
  requirementId: string
  artifactType: string
  requiredForJobTypes: string[]
  minimumCount: number
  maximumCount: number
  immutableRereadRequired: boolean
}

export interface SceneContextRequirement {
  requirementId: string
  requiredForJobTypes: string[]
  requiredAtScopeTypes: Array<OrchestraSkillScope['scopeType']>
  exactSnapshotRequired: boolean
}

export interface EvidenceRequirement {
  requirementId: string
  evidenceType: string
  requiredForJobTypes: string[]
  exactRereadRequired: boolean
}

export type VisualIntelligenceDependencyPolicy = {
  mode: 'dependency'
  requiredJobTypes: string[]
  optionalJobTypes: string[]
  resultMustReturnThroughOrchestra: true
}

export type VisualIntelligenceSelfPolicy = {
  mode: 'self'
  providerNeutralConsumerContract: true
  internalSemanticProviderAllowed: true
  deterministicEvidenceRequired: true
  resultMustReturnThroughOrchestra: true
}

export interface TrackingDependencyPolicy {
  requirementId: string
  requiredForJobTypes: string[]
  trackingSkillKey: string
  trackingArtifactTypes: string[]
  optional: boolean
}

export interface SkillDependencyRule {
  ruleId: string
  otherSkillKey: string
  appliesToJobTypes: string[]
  conditionCode: string
}

export interface SkillConflictRule {
  ruleId: string
  otherSkillKey: string
  appliesToJobTypes: string[]
  reasonCode: string
}

export interface SkillOverlapRule {
  ruleId: string
  otherSkillKey: string
  appliesToJobTypes: string[]
  ownershipBoundaryCode: string
}

export interface SkillToolRoute {
  routeId: string
  jobTypes: string[]
  routeKind: 'deterministic_tool' | 'managed_provider' | 'gpu_model'
  operationId: string
  executionClass:
    | 'managed_provider'
    | 'l4_gpu_standard'
    | 'a100_80gb_gpu_heavy'
  toolOrProviderId: string
  currentQualificationRequired: true
  accountEffectivePricingRequired: boolean
}

export interface SkillFallbackRoute {
  routeId: string
  jobTypes: string[]
  triggerCodes: string[]
  routeKind:
    | 'classified_gpu_fallback'
    | 'deterministic_only'
    | 'human_review'
    | 'return_to_orchestra'
  targetRouteId: string | null
  qualityReductionAllowed: false
  newOrchestraAuthorizationRequired: boolean
}

export interface SkillCostOptimizationRoute {
  routeId: string
  jobTypes: string[]
  optimizationCode: string
  qualityReductionAllowed: false
  newOrchestraAuthorizationRequired: boolean
}

export interface SkillQaPolicy {
  policyId: string
  policyVersion: string
  requiredCheckIds: string[]
  blockingFailureCodes: string[]
  independentQaOwnerRequired: boolean
}

export interface SkillInvalidationRule {
  ruleId: string
  changedAuthorityType: string
  invalidatesJobTypes: string[]
  newOrchestraCallRequired: true
}

export interface SkillRevisionRule {
  ruleId: string
  appliesToJobTypes: string[]
  revisionOwner: 'requesting_skill' | 'orchestra' | 'human_review'
  newApprovedSnapshotRequired: boolean
  maximumAutomaticCycles: number
}

export interface SkillQualificationFixture {
  fixtureId: string
  fixtureVersion: string
  jobTypes: string[]
  requiredEvidenceTypes: string[]
  currentEvidenceRef: OrchestraEvidenceRef | null
}

export interface SkillJobQualification {
  jobType: string
  status: 'qualified' | 'blocked' | 'disabled'
  blockerCodes: string[]
  qualifiedRouteIds: string[]
  qualificationEvidenceRefs: OrchestraEvidenceRef[]
}

export interface SkillQualificationSnapshot {
  schemaVersion: typeof ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION
  snapshotId: string
  snapshotDigestSha256: string
  skillKey: string
  skillVersion: string
  contractVersion: string
  capabilityDefinitionDigestSha256: string
  observedReleaseRef: OrchestraEvidenceRef
  observedAt: string
  overall: 'qualified' | 'partially_qualified' | 'blocked' | 'disabled'
  jobQualifications: SkillJobQualification[]
  callerCanSelfQualify: false
  qualificationOwner: 'canonical_skill_qualification_registry'
  dispatchAuthorityGranted: false
  providerAuthorityGranted: false
  billingAuthorityGranted: false
  publicDeliveryAuthorityGranted: false
  productionAuthorityGranted: false
}

export interface SkillCapabilityManifest {
  schemaVersion: typeof ORCHESTRA_SKILL_CAPABILITY_MANIFEST_VERSION
  manifestId: string
  manifestDigestSha256: string
  capabilityDefinitionDigestSha256: string
  skillKey: string
  skillVersion: string
  contractVersion: string
  qualificationStatus: {
    overall: SkillQualificationSnapshot['overall']
    qualificationSnapshotRef: OrchestraEvidenceRef
    qualifiedJobTypes: string[]
    blockedJobTypes: Array<{
      jobType: string
      blockerCodes: string[]
    }>
  }
  skillClass: OrchestraSkillClass
  coordinationCritical: boolean
  canOwnPrimaryVisual: boolean
  canOwnPrimaryAnalysis: boolean
  canActAsSupport: boolean
  canOperateAtVideoLevel: boolean
  canOperateAtSceneLevel: boolean
  canOperateAtBoundaryLevel: boolean
  supportedJobTypes: SkillJobCapability[]
  unsupportedJobTypes: string[]
  requiredInputs: SkillInputRequirement[]
  optionalInputs: SkillInputRequirement[]
  requiredSceneContext: SceneContextRequirement[]
  requiredSourceEvidence: EvidenceRequirement[]
  visualIntelligenceRequirements:
    | VisualIntelligenceDependencyPolicy
    | VisualIntelligenceSelfPolicy
  trackingRequirements: TrackingDependencyPolicy[]
  acceptedArtifactTypes: string[]
  producedArtifactTypes: string[]
  planningPhase: OrchestraExecutionPhase
  allowedExecutionPhases: OrchestraExecutionPhase[]
  mustRunBefore: SkillDependencyRule[]
  mustRunAfter: SkillDependencyRule[]
  conflictsWith: SkillConflictRule[]
  mayOverlapWith: SkillOverlapRule[]
  ownershipRequirements: {
    orchestraOwnsInvocation: true
    orchestraOwnsWorkGraph: true
    skillOwnsProducedArtifacts: boolean
    skillOwnsPrimaryVisual: boolean
    skillOwnsAnalysisReport: boolean
    requestingSkillOwnsRepair: boolean
    finalQaOwnedElsewhere: true
  }
  timeEstimator: {
    estimatorId: string
    estimatorVersion: string
    inputFactors: string[]
  }
  creditEstimator: {
    estimatorId: string
    estimatorVersion: string
    inputFactors: string[]
  }
  attemptPolicy: {
    maximumPlannedPasses: number
    maximumAttemptsPerPass: number
    automaticRetryOnUnknownOutcome: boolean
    maximumAutomaticRepairCycles: number
    scopeExpansionRequiresNewOrchestraCall: true
  }
  toolRoutes: SkillToolRoute[]
  fallbackRoutes: SkillFallbackRoute[]
  lowerCostRoutes: SkillCostOptimizationRoute[]
  planningQa: SkillQaPolicy
  outputQa: SkillQaPolicy
  integrationQa: SkillQaPolicy
  invalidationRules: SkillInvalidationRule[]
  revisionRules: SkillRevisionRule[]
  qualificationFixtures: SkillQualificationFixture[]
  knownLimitations: string[]
  invocationPolicy: {
    orchestraDispatchRequired: true
    directUserInvocationAllowed: false
    directPeerSkillInvocationAllowed: false
    peerSkillSupportRequestAllowed: boolean
    internalProviderInvocationAllowed: boolean
  }
  resultContract: {
    resultSchemaVersion: string
    resultArtifactTypes: string[]
    resultReturnsToOrchestra: true
    directMutationResultAllowed: false
  }
  failureSemantics: {
    failClosed: true
    partialResultAllowedForJobTypes: string[]
    hiddenFallbackAllowed: false
    unresolvedResultReturnsToOrchestra: true
  }
  securityPolicyRef: OrchestraEvidenceRef
}

export interface OrchestraSkillJobResult {
  schemaVersion: typeof ORCHESTRA_SKILL_JOB_RESULT_VERSION
  resultId: string
  resultDigestSha256: string
  callRef: OrchestraEvidenceRef
  manifestRef: OrchestraEvidenceRef
  qualificationSnapshotRef: OrchestraEvidenceRef
  targetSkillKey: string
  jobType: string
  phase: OrchestraExecutionPhase
  scope: OrchestraSkillScope
  disposition: 'completed' | 'needs_followup' | 'blocked' | 'failed'
  producedArtifactRefs: OrchestraEvidenceRef[]
  evidenceRefs: OrchestraEvidenceRef[]
  proposedFollowupRanges: OrchestraFrameRange[]
  followupReasonCode: string | null
  estimatedAdditionalTimeRef: OrchestraEvidenceRef | null
  estimatedAdditionalCreditsRef: OrchestraEvidenceRef | null
  resultReturnsToOrchestra: true
  directTimelineMutationPerformed: false
  directArtifactMutationPerformed: false
  scopeExpandedWithoutOrchestra: false
  providerAuthorityGrantedToCaller: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
