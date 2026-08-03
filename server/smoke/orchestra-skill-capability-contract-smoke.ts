import assert from 'node:assert/strict'

import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_SKILL_CAPABILITY_MANIFEST_VERSION,
  ORCHESTRA_SKILL_JOB_RESULT_VERSION,
  ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
  ORCHESTRA_SKILL_SUPPORT_REQUEST_VERSION,
} from '../../src/types/orchestra-skill-capability'
import {
  computeSkillCapabilityDefinitionDigest,
  createOrchestraSkillCall,
  createOrchestraSkillJobResult,
  createSkillCapabilityManifest,
  createSkillQualificationSnapshot,
  createSkillSupportRequest,
  orchestraDigest,
  orchestraEvidenceRef,
  parseOrchestraSkillCall,
  parseOrchestraSkillJobResult,
  parseSkillCapabilityManifest,
  parseSkillQualificationSnapshot,
  parseSkillSupportRequest,
  type SkillCapabilityManifestDefinitionInput,
} from '../orchestra/orchestra-skill-capability-contract'

const sourceRef = ref('source-artifact')
const definition: SkillCapabilityManifestDefinitionInput = {
  schemaVersion: ORCHESTRA_SKILL_CAPABILITY_MANIFEST_VERSION,
  manifestId: 'fixture-analysis-skill-manifest',
  skillKey: 'fixture_analysis_skill',
  skillVersion: 'fixture-analysis-skill-v1',
  contractVersion: 'fixture-analysis-orchestra-contract-v1',
  skillClass: 'analysis_support',
  coordinationCritical: true,
  canOwnPrimaryVisual: false,
  canOwnPrimaryAnalysis: true,
  canActAsSupport: true,
  canOperateAtVideoLevel: true,
  canOperateAtSceneLevel: true,
  canOperateAtBoundaryLevel: false,
  supportedJobTypes: [
    {
      jobType: 'job_alpha',
      purposeCode: 'analyze_alpha',
      supportedScopeTypes: ['video', 'scene'],
      internalOperationId: 'fixture.analyze',
      requiredProfileIds: ['alpha_profile'],
      partialResultAllowed: false,
    },
    {
      jobType: 'job_beta',
      purposeCode: 'analyze_beta',
      supportedScopeTypes: ['video'],
      internalOperationId: 'fixture.query',
      requiredProfileIds: ['beta_profile'],
      partialResultAllowed: true,
    },
  ],
  unsupportedJobTypes: ['mutate_timeline'],
  requiredInputs: [{
    requirementId: 'immutable_source',
    artifactType: 'private_source_video',
    requiredForJobTypes: ['job_alpha', 'job_beta'],
    minimumCount: 1,
    maximumCount: 1,
    immutableRereadRequired: true,
  }],
  optionalInputs: [],
  requiredSceneContext: [{
    requirementId: 'scene_context',
    requiredForJobTypes: ['job_alpha'],
    requiredAtScopeTypes: ['scene'],
    exactSnapshotRequired: true,
  }],
  requiredSourceEvidence: [{
    requirementId: 'media_probe',
    evidenceType: 'media_probe_evidence',
    requiredForJobTypes: ['job_alpha', 'job_beta'],
    exactRereadRequired: true,
  }],
  visualIntelligenceRequirements: {
    mode: 'self',
    providerNeutralConsumerContract: true,
    internalSemanticProviderAllowed: true,
    deterministicEvidenceRequired: true,
    resultMustReturnThroughOrchestra: true,
  },
  trackingRequirements: [],
  acceptedArtifactTypes: ['private_source_video'],
  producedArtifactTypes: ['analysis_report'],
  planningPhase: 'planning',
  allowedExecutionPhases: ['planning', 'postrender_inspection'],
  mustRunBefore: [],
  mustRunAfter: [],
  conflictsWith: [],
  mayOverlapWith: [],
  ownershipRequirements: {
    orchestraOwnsInvocation: true,
    orchestraOwnsWorkGraph: true,
    skillOwnsProducedArtifacts: true,
    skillOwnsPrimaryVisual: false,
    skillOwnsAnalysisReport: true,
    requestingSkillOwnsRepair: true,
    finalQaOwnedElsewhere: true,
  },
  timeEstimator: {
    estimatorId: 'fixture-time-estimator',
    estimatorVersion: 'fixture-time-estimator-v1',
    inputFactors: ['duration_frames', 'job_type'],
  },
  creditEstimator: {
    estimatorId: 'fixture-credit-estimator',
    estimatorVersion: 'fixture-credit-estimator-v1',
    inputFactors: ['account_effective_rate', 'input_tokens'],
  },
  attemptPolicy: {
    maximumPlannedPasses: 2,
    maximumAttemptsPerPass: 1,
    automaticRetryOnUnknownOutcome: false,
    maximumAutomaticRepairCycles: 2,
    scopeExpansionRequiresNewOrchestraCall: true,
  },
  toolRoutes: [{
    routeId: 'managed-provider-route',
    jobTypes: ['job_alpha', 'job_beta'],
    routeKind: 'managed_provider',
    operationId: 'fixture.provider.analyze.v1',
    executionClass: 'managed_provider',
    toolOrProviderId: 'fixture_provider',
    currentQualificationRequired: true,
    accountEffectivePricingRequired: true,
  }],
  fallbackRoutes: [{
    routeId: 'return-to-orchestra',
    jobTypes: ['job_alpha', 'job_beta'],
    triggerCodes: ['route_unavailable'],
    routeKind: 'return_to_orchestra',
    targetRouteId: null,
    qualityReductionAllowed: false,
    newOrchestraAuthorizationRequired: true,
  }],
  lowerCostRoutes: [],
  planningQa: qa('planning'),
  outputQa: qa('output'),
  integrationQa: qa('integration'),
  invalidationRules: [{
    ruleId: 'source_changed',
    changedAuthorityType: 'source_artifact',
    invalidatesJobTypes: ['job_alpha', 'job_beta'],
    newOrchestraCallRequired: true,
  }],
  revisionRules: [{
    ruleId: 'requesting-skill-repairs',
    appliesToJobTypes: ['job_alpha', 'job_beta'],
    revisionOwner: 'requesting_skill',
    newApprovedSnapshotRequired: true,
    maximumAutomaticCycles: 2,
  }],
  qualificationFixtures: [{
    fixtureId: 'fixture-analysis-qualification',
    fixtureVersion: 'fixture-analysis-qualification-v1',
    jobTypes: ['job_alpha', 'job_beta'],
    requiredEvidenceTypes: ['deterministic_evidence', 'provider_evidence'],
    currentEvidenceRef: null,
  }],
  knownLimitations: [
    'The blocked beta route needs a current release qualification.',
  ],
  invocationPolicy: {
    orchestraDispatchRequired: true,
    directUserInvocationAllowed: false,
    directPeerSkillInvocationAllowed: false,
    peerSkillSupportRequestAllowed: true,
    internalProviderInvocationAllowed: true,
  },
  resultContract: {
    resultSchemaVersion: ORCHESTRA_SKILL_JOB_RESULT_VERSION,
    resultArtifactTypes: ['analysis_report'],
    resultReturnsToOrchestra: true,
    directMutationResultAllowed: false,
  },
  failureSemantics: {
    failClosed: true,
    partialResultAllowedForJobTypes: ['job_beta'],
    hiddenFallbackAllowed: false,
    unresolvedResultReturnsToOrchestra: true,
  },
  securityPolicyRef: ref('skill-security-policy'),
}

const definitionDigest = computeSkillCapabilityDefinitionDigest(definition)
const qualification = createSkillQualificationSnapshot({
  schemaVersion: ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
  snapshotId: 'fixture-analysis-qualification-snapshot',
  skillKey: definition.skillKey,
  skillVersion: definition.skillVersion,
  contractVersion: definition.contractVersion,
  capabilityDefinitionDigestSha256: definitionDigest,
  observedReleaseRef: ref('fixture-analysis-release'),
  observedAt: '2026-08-03T12:00:00.000Z',
  overall: 'partially_qualified',
  jobQualifications: [
    {
      jobType: 'job_alpha',
      status: 'qualified',
      blockerCodes: [],
      qualifiedRouteIds: ['managed-provider-route'],
      qualificationEvidenceRefs: [ref('alpha-qualification-evidence')],
    },
    {
      jobType: 'job_beta',
      status: 'blocked',
      blockerCodes: ['beta_release_not_qualified'],
      qualifiedRouteIds: [],
      qualificationEvidenceRefs: [],
    },
  ],
  callerCanSelfQualify: false,
  qualificationOwner: 'canonical_skill_qualification_registry',
  dispatchAuthorityGranted: false,
  providerAuthorityGranted: false,
  billingAuthorityGranted: false,
  publicDeliveryAuthorityGranted: false,
  productionAuthorityGranted: false,
})
const manifest = createSkillCapabilityManifest({
  definition,
  qualificationSnapshot: qualification,
})

assert.equal(
  parseSkillQualificationSnapshot(qualification).snapshotDigestSha256,
  qualification.snapshotDigestSha256,
)
assert.equal(
  parseSkillCapabilityManifest({
    value: manifest,
    qualificationSnapshot: qualification,
  }).manifestDigestSha256,
  manifest.manifestDigestSha256,
)
assert.deepEqual(manifest.qualificationStatus.qualifiedJobTypes, ['job_alpha'])
assert.deepEqual(manifest.qualificationStatus.blockedJobTypes, [{
  jobType: 'job_beta',
  blockerCodes: ['beta_release_not_qualified'],
}])

const supportRequest = createSkillSupportRequest({
  schemaVersion: ORCHESTRA_SKILL_SUPPORT_REQUEST_VERSION,
  requestId: 'support-request-1',
  requestingSkillKey: 'captions',
  requestingSkillJobId: 'caption-job-1',
  parentOrchestraJobId: 'orchestra-job-1',
  requiredCapability: definition.skillKey,
  requestedJobType: 'job_alpha',
  phase: 'planning',
  scope: videoScope(),
  purposeCode: 'validate_visual_hierarchy',
  inputArtifactRefs: [sourceRef],
  comparisonArtifactRefs: [],
  expectedOutcomeRefs: [ref('caption-layout-outcome')],
  requiredEvidenceRefs: [ref('caption-layout-evidence')],
  urgency: 'blocking',
  supportRequestOnly: true,
  executionAuthorityGranted: false,
  providerInvocationAuthorityGranted: false,
  timelineMutationAuthorityGranted: false,
  scopeExpansionAuthorityGranted: false,
})
assert.equal(
  parseSkillSupportRequest(supportRequest).requestDigestSha256,
  supportRequest.requestDigestSha256,
)

const call = createOrchestraSkillCall({
  schemaVersion: ORCHESTRA_SKILL_CALL_VERSION,
  callId: 'orchestra-call-1',
  orchestraPlanRef: ref('orchestra-plan'),
  orchestraJobRef: ref('orchestra-job-1'),
  parentJobRef: ref('caption-job-1'),
  requestedBy: {
    kind: 'skill',
    skillKey: 'captions',
    skillJobRef: ref('caption-job-1'),
    supportRequestRef: orchestraEvidenceRef(
      supportRequest.requestId,
      supportRequest.requestDigestSha256,
    ),
  },
  targetSkillKey: definition.skillKey,
  jobType: 'job_alpha',
  phase: 'planning',
  scope: videoScope(),
  sceneContextSnapshotRef: null,
  sourceArtifactRefs: [sourceRef],
  comparisonArtifactRefs: [],
  expectedOutcomeRefs: [ref('caption-layout-outcome')],
  requiredEvidenceRefs: [ref('caption-layout-evidence')],
  manifestRef: orchestraEvidenceRef(
    manifest.manifestId,
    manifest.manifestDigestSha256,
  ),
  qualificationSnapshotRef: orchestraEvidenceRef(
    qualification.snapshotId,
    qualification.snapshotDigestSha256,
  ),
  timeBudgetRef: ref('time-budget'),
  creditBudgetRef: ref('credit-budget'),
  attemptEnvelopeRef: ref('attempt-envelope'),
  approvedSnapshotRef: null,
  idempotencyKey: 'orchestra-call-1-idempotency',
  orchestraDispatchAuthorized: true,
  directProviderCallAllowed: false,
  directTimelineMutationAllowed: false,
  directArtifactMutationAllowed: false,
  scopeExpansionAllowed: false,
  peerSkillExecutionAuthorityAccepted: false,
})
assert.equal(parseOrchestraSkillCall(call).callId, call.callId)

const result = createOrchestraSkillJobResult({
  schemaVersion: ORCHESTRA_SKILL_JOB_RESULT_VERSION,
  resultId: 'orchestra-result-1',
  callRef: orchestraEvidenceRef(call.callId, call.callDigestSha256),
  manifestRef: call.manifestRef,
  qualificationSnapshotRef: call.qualificationSnapshotRef,
  targetSkillKey: call.targetSkillKey,
  jobType: call.jobType,
  phase: call.phase,
  scope: call.scope,
  disposition: 'needs_followup',
  producedArtifactRefs: [],
  evidenceRefs: [ref('partial-analysis-evidence')],
  proposedFollowupRanges: [{
    startFrame: 40,
    endFrameExclusive: 80,
    frameRate: { numerator: 24, denominator: 1 },
  }],
  followupReasonCode: 'insufficient_scene_detail',
  estimatedAdditionalTimeRef: ref('additional-time-estimate'),
  estimatedAdditionalCreditsRef: ref('additional-credit-estimate'),
  resultReturnsToOrchestra: true,
  directTimelineMutationPerformed: false,
  directArtifactMutationPerformed: false,
  scopeExpandedWithoutOrchestra: false,
  providerAuthorityGrantedToCaller: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})
assert.equal(
  parseOrchestraSkillJobResult(result).disposition,
  'needs_followup',
)

const adversarial: Array<() => unknown> = [
  () => parseSkillSupportRequest({
    ...supportRequest,
    executionAuthorityGranted: true,
  }),
  () => parseSkillSupportRequest({
    ...supportRequest,
    requestDigestSha256: ref('tamper').contentHash,
  }),
  () => parseOrchestraSkillCall({
    ...call,
    directProviderCallAllowed: true,
  }),
  () => parseOrchestraSkillCall({
    ...call,
    phase: 'approved_execution',
  }),
  () => parseSkillQualificationSnapshot({
    ...qualification,
    callerCanSelfQualify: true,
  }),
  () => parseSkillCapabilityManifest({
    value: { ...manifest, manifestDigestSha256: ref('tamper').contentHash },
    qualificationSnapshot: qualification,
  }),
  () => parseSkillCapabilityManifest({
    value: {
      ...manifest,
      qualificationStatus: {
        ...manifest.qualificationStatus,
        qualifiedJobTypes: ['job_alpha', 'job_beta'],
      },
      manifestDigestSha256: orchestraDigest({ tampered: true }),
    },
    qualificationSnapshot: qualification,
  }),
  () => parseSkillCapabilityManifest({
    value: { ...manifest, unknownAuthority: true },
    qualificationSnapshot: qualification,
  }),
  () => parseOrchestraSkillJobResult({
    ...result,
    proposedFollowupRanges: [],
  }),
  () => parseOrchestraSkillJobResult({
    ...result,
    directTimelineMutationPerformed: true,
  }),
  () => {
    const cyclic = structuredClone(manifest) as typeof manifest & {
      self?: unknown
    }
    cyclic.self = cyclic
    return parseSkillCapabilityManifest({
      value: cyclic,
      qualificationSnapshot: qualification,
    })
  },
  () => parseSkillCapabilityManifest({
    value: new Proxy(manifest, {
      ownKeys() { throw new Error('hostile') },
    }),
    qualificationSnapshot: qualification,
  }),
  () => {
    let invoked = false
    const accessor = structuredClone(call) as Record<string, unknown>
    Object.defineProperty(accessor, 'targetSkillKey', {
      enumerable: true,
      get() {
        invoked = true
        return definition.skillKey
      },
    })
    try {
      return parseOrchestraSkillCall(accessor)
    } finally {
      assert.equal(invoked, false)
    }
  },
]

for (const refuse of adversarial) assert.throws(refuse)

console.log(JSON.stringify({
  smoke: 'orchestra-skill-capability-contract',
  checks: 36,
  manifest: {
    skillKey: manifest.skillKey,
    supportedJobTypes: manifest.supportedJobTypes.length,
    qualification: manifest.qualificationStatus.overall,
    directUserInvocationAllowed:
      manifest.invocationPolicy.directUserInvocationAllowed,
    directPeerSkillInvocationAllowed:
      manifest.invocationPolicy.directPeerSkillInvocationAllowed,
  },
  supportRequestOnly: supportRequest.supportRequestOnly,
  orchestraDispatchAuthorized: call.orchestraDispatchAuthorized,
  resultReturnsToOrchestra: result.resultReturnsToOrchestra,
  adversarialCases: adversarial.length,
  productionReady: qualification.productionAuthorityGranted,
}))

function ref(name: string) {
  return orchestraEvidenceRef(
    name,
    orchestraDigest({ fixture: name }),
  )
}

function videoScope() {
  return {
    scopeType: 'video' as const,
    sourceArtifactRef: sourceRef,
    authorizedRanges: [{
      startFrame: 0,
      endFrameExclusive: 240,
      frameRate: { numerator: 24, denominator: 1 },
    }],
    completeSourceCoverageRequired: true,
    outputId: null,
  }
}

function qa(prefix: string) {
  return {
    policyId: `${prefix}-qa-policy`,
    policyVersion: `${prefix}-qa-policy-v1`,
    requiredCheckIds: [`${prefix}_contract`, `${prefix}_evidence`],
    blockingFailureCodes: [
      `${prefix}_contract_failed`,
      `${prefix}_evidence_missing`,
    ],
    independentQaOwnerRequired: prefix !== 'planning',
  }
}
