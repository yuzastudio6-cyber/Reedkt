import type {
  SkillCapabilityManifest,
  SkillQualificationSnapshot,
} from '../../../src/types/orchestra-skill-capability'
import {
  ORCHESTRA_SKILL_CAPABILITY_MANIFEST_VERSION,
  ORCHESTRA_SKILL_JOB_RESULT_VERSION,
  ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
} from '../../../src/types/orchestra-skill-capability'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  computeSkillCapabilityDefinitionDigest,
  createSkillCapabilityManifest,
  createSkillQualificationSnapshot,
  orchestraDigest,
  orchestraEvidenceRef,
  parseSkillCapabilityManifest,
  type SkillCapabilityManifestDefinitionInput,
} from '../../orchestra/orchestra-skill-capability-contract'
import {
  CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
  CANONICAL_TRACK_ALL_SAM3_1_PURPOSE_CODE,
} from './canonical-track-all-sam3_1-orchestra-binding'
import {
  CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
} from './canonical-track-all-sam3_1-l4-task-qa-worker-contract'

export const TRACK_ALL_SAM3_1_ORCHESTRA_SKILL_VERSION =
  'track-all-sam3_1-skill-v1' as const
export const TRACK_ALL_SAM3_1_ORCHESTRA_CONTRACT_VERSION =
  'track-all-sam3_1-orchestra-contract-v1' as const
export const TRACK_ALL_SAM3_1_ORCHESTRA_MANIFEST_ID =
  'track-all-sam3_1-orchestra-capability-manifest' as const
export const TRACK_ALL_SAM3_1_ORCHESTRA_QUALIFICATION_SNAPSHOT_ID =
  'track-all-sam3_1-orchestra-source-candidate-qualification' as const

export const TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS = Object.freeze({
  a100Primary: 'sam3_1-a100-80gb-heavy-primary',
  l4Fallback: 'sam3_1-l4-heavy-qualified-fallback',
  l4TaskQa: 'track-all-l4-mask-task-qa',
} as const)

const JOBS = [CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE]
const BLOCKERS = ids(
  'account_effective_a100_and_l4_rate_authorities_not_reread',
  'canonical_track_all_result_and_artifact_repository_not_qualified',
  'sam3_1_a100_80gb_private_internal_release_not_reread',
  'sam3_1_l4_fallback_quality_parity_release_not_reread',
  'track_all_l4_task_qa_release_not_reread',
)

const DEFINITION: SkillCapabilityManifestDefinitionInput = {
  schemaVersion: ORCHESTRA_SKILL_CAPABILITY_MANIFEST_VERSION,
  manifestId: TRACK_ALL_SAM3_1_ORCHESTRA_MANIFEST_ID,
  skillKey: 'track_all',
  skillVersion: TRACK_ALL_SAM3_1_ORCHESTRA_SKILL_VERSION,
  contractVersion: TRACK_ALL_SAM3_1_ORCHESTRA_CONTRACT_VERSION,
  skillClass: 'tracking_support',
  coordinationCritical: true,
  canOwnPrimaryVisual: false,
  canOwnPrimaryAnalysis: false,
  canActAsSupport: true,
  canOperateAtVideoLevel: false,
  canOperateAtSceneLevel: true,
  canOperateAtBoundaryLevel: false,
  supportedJobTypes: [{
    jobType: CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
    purposeCode: CANONICAL_TRACK_ALL_SAM3_1_PURPOSE_CODE,
    supportedScopeTypes: ['scene'],
    internalOperationId: CANONICAL_SAM3_1_OPERATION_ID,
    requiredProfileIds: ['complete_scene_subject_geometry'],
    partialResultAllowed: false,
  }],
  unsupportedJobTypes: ids(
    'approve_final_qa',
    'create_edit_plan',
    'dispatch_peer_skill',
    'generate_primary_visual',
    'mutate_timeline',
    'own_final_canvas',
    'render_final_canvas',
    'run_semantic_visual_analysis',
  ),
  requiredInputs: [
    requirement('approved-sam3_1-prompt', 'approved_tracking_prompt'),
    requirement('confirmed-output-frame', 'confirmed_output_frame'),
    requirement('exact-private-source-scene', 'private_immutable_media'),
    requirement('master-timing', 'master_timing_plan'),
    requirement('selected-scene-binding', 'selected_scene_binding'),
  ].sort(by('requirementId')),
  optionalInputs: [],
  requiredSceneContext: [{
    requirementId: 'exact-track-all-scene-context',
    requiredForJobTypes: JOBS,
    requiredAtScopeTypes: ['scene'],
    exactSnapshotRequired: true,
  }],
  requiredSourceEvidence: [
    evidence('approved-snapshot', 'approved_snapshot'),
    evidence('approved-work-item', 'approved_work_item'),
    evidence('funded-reservation', 'funded_credit_reservation'),
    evidence('gpu-attempt-envelope', 'gpu_attempt_envelope'),
    evidence('private-source-frame-mapping', 'source_frame_range_mapping'),
    evidence('worker-lease', 'worker_lease'),
  ].sort(by('requirementId')),
  visualIntelligenceRequirements: {
    mode: 'dependency',
    requiredJobTypes: [],
    optionalJobTypes: JOBS,
    resultMustReturnThroughOrchestra: true,
  },
  trackingRequirements: [],
  acceptedArtifactTypes: ids(
    'approved_tracking_prompt',
    'confirmed_output_frame',
    'master_timing_plan',
    'private_immutable_media',
    'selected_scene_binding',
  ),
  producedArtifactTypes: ids(
    'exact_subject_mask_sequence',
    'object_track_evidence',
    'occlusion_geometry_evidence',
    'track_all_sam3_1_task_qa_evidence',
  ),
  planningPhase: 'preapproval',
  allowedExecutionPhases: ['approved_execution'],
  mustRunBefore: [
    dependency('track-all-before-caption-depth-composition', 'captions'),
    dependency('track-all-before-living-frame-composition', 'living_frame'),
    dependency('track-all-before-remotion-final-composition', 'remotion'),
  ].sort(by('ruleId')),
  mustRunAfter: [
    dependency('track-all-after-approved-scene-plan', 'head_intelligence'),
  ],
  conflictsWith: [{
    ruleId: 'sam2-fresh-tracking-conflict',
    otherSkillKey: 'legacy_sam2_tracking',
    appliesToJobTypes: JOBS,
    reasonCode: 'sam2_historical_read_only_for_fresh_work',
  }],
  mayOverlapWith: [
    overlap('track-all-overlaps-caption-planning', 'captions'),
    overlap('track-all-overlaps-visual-intelligence', 'visual_intelligence'),
  ].sort(by('ruleId')),
  ownershipRequirements: {
    orchestraOwnsInvocation: true,
    orchestraOwnsWorkGraph: true,
    skillOwnsProducedArtifacts: true,
    skillOwnsPrimaryVisual: false,
    skillOwnsAnalysisReport: false,
    requestingSkillOwnsRepair: false,
    finalQaOwnedElsewhere: true,
  },
  timeEstimator: {
    estimatorId: 'track-all-sam3_1-time-estimator',
    estimatorVersion: 'track-all-sam3_1-time-estimator-v1',
    inputFactors: ids(
      'a100_cold_start',
      'approved_frame_count',
      'l4_fallback_cold_start',
      'scene_resolution',
      'subject_count',
    ),
  },
  creditEstimator: {
    estimatorId: 'track-all-sam3_1-credit-estimator',
    estimatorVersion: 'track-all-sam3_1-credit-estimator-v1',
    inputFactors: ids(
      'account_effective_a100_rate',
      'account_effective_l4_rate',
      'active_gpu_seconds',
      'cold_start_seconds',
      'private_artifact_storage',
      'service_fee_settlement_policy',
    ),
  },
  attemptPolicy: {
    maximumPlannedPasses: 1,
    maximumAttemptsPerPass: 1,
    automaticRetryOnUnknownOutcome: false,
    maximumAutomaticRepairCycles: 0,
    scopeExpansionRequiresNewOrchestraCall: true,
  },
  toolRoutes: [
    tool(TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS.a100Primary,
      CANONICAL_SAM3_1_OPERATION_ID, 'a100_80gb_gpu_heavy', 'sam3_1'),
    tool(TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS.l4Fallback,
      CANONICAL_SAM3_1_OPERATION_ID, 'l4_gpu_standard', 'sam3_1'),
    tool(TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS.l4TaskQa,
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
      'l4_gpu_standard', 'kornia'),
  ].sort(by('routeId')),
  fallbackRoutes: [
    {
      routeId: 'a100-classified-l4-quality-preserving-fallback',
      jobTypes: JOBS,
      triggerCodes: ids(
        'a100_capacity_unavailable',
        'a100_release_classified_failure',
      ),
      routeKind: 'classified_gpu_fallback' as const,
      targetRouteId: TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS.l4Fallback,
      qualityReductionAllowed: false as const,
      newOrchestraAuthorizationRequired: true,
    },
    {
      routeId: 'unresolved-tracking-return-to-orchestra',
      jobTypes: JOBS,
      triggerCodes: ids(
        'gpu_outcome_unknown',
        'qualified_gpu_route_unavailable',
      ),
      routeKind: 'return_to_orchestra' as const,
      targetRouteId: null,
      qualityReductionAllowed: false as const,
      newOrchestraAuthorizationRequired: true,
    },
  ].sort(by('routeId')),
  lowerCostRoutes: [{
    routeId: 'exact-track-artifact-cache-reuse',
    jobTypes: JOBS,
    optimizationCode:
      'reuse_only_exact_snapshot_scene_frame_prompt_and_release_digest',
    qualityReductionAllowed: false,
    newOrchestraAuthorizationRequired: false,
  }],
  planningQa: qa('track-all-sam3_1-planning-qa', ids(
    'approved_prompt_and_subject_scope_exact',
    'confirmed_frame_and_master_timing_exact',
    'scene_scope_is_complete_and_bounded',
  )),
  outputQa: qa('track-all-sam3_1-output-qa', ids(
    'complete_frame_interval_accounted',
    'mask_artifacts_exactly_reread',
    'subject_identity_and_occlusion_preserved',
    'temporal_drift_and_flicker_passed',
  )),
  integrationQa: qa('track-all-sam3_1-integration-qa', ids(
    'account_effective_gpu_cost_reconciled',
    'exact_manifest_and_qualification_reread',
    'orchestra_call_and_attempt_lineage_exact',
    'scale_from_zero_and_terminal_stop_observed',
  )),
  invalidationRules: [
    invalidation('approved-snapshot-changed', 'approved_snapshot'),
    invalidation('confirmed-frame-changed', 'confirmed_output_frame'),
    invalidation('gpu-release-or-price-changed', 'gpu_release_and_pricing'),
    invalidation('orchestra-scope-changed', 'orchestra_skill_call'),
    invalidation('selected-scene-or-prompt-changed', 'tracking_scope'),
  ].sort(by('ruleId')),
  revisionRules: [{
    ruleId: 'track-all-repair-needs-new-approved-call',
    appliesToJobTypes: JOBS,
    revisionOwner: 'orchestra',
    newApprovedSnapshotRequired: false,
    maximumAutomaticCycles: 0,
  }],
  qualificationFixtures: [
    fixture('a100-80gb-complete-scene-quality-and-performance'),
    fixture('account-effective-a100-and-l4-pricing'),
    fixture('l4-fallback-quality-parity'),
    fixture('l4-mask-task-qa'),
    fixture('scale-from-zero-and-terminal-stop'),
  ].sort(by('fixtureId')),
  knownLimitations: [
    'A100 capacity and official gated SAM 3.1 checkpoint access must be available before the primary route can qualify.',
    'L4 is a separately qualified quality-preserving fallback and may never be selected merely because it is cheaper.',
    'Track All owns tracking and mask artifacts but never owns the timeline, final canvas, or final QA approval.',
    'Visual Intelligence may inspect Track All artifacts but cannot create, mutate, dispatch, or approve them.',
  ],
  invocationPolicy: {
    orchestraDispatchRequired: true,
    directUserInvocationAllowed: false,
    directPeerSkillInvocationAllowed: false,
    peerSkillSupportRequestAllowed: true,
    internalProviderInvocationAllowed: false,
  },
  resultContract: {
    resultSchemaVersion: ORCHESTRA_SKILL_JOB_RESULT_VERSION,
    resultArtifactTypes: ids(
      'exact_subject_mask_sequence',
      'object_track_evidence',
      'occlusion_geometry_evidence',
      'track_all_sam3_1_task_qa_evidence',
    ),
    resultReturnsToOrchestra: true,
    directMutationResultAllowed: false,
  },
  failureSemantics: {
    failClosed: true,
    partialResultAllowedForJobTypes: [],
    hiddenFallbackAllowed: false,
    unresolvedResultReturnsToOrchestra: true,
  },
  securityPolicyRef: orchestraEvidenceRef(
    'track-all-sam3_1-private-gpu-security-policy',
    orchestraDigest({
      browserOrCallerMediaAccepted: false,
      cpuOnlySubstantiveExecutionAllowed: false,
      policyVersion: 'track-all-sam3_1-private-gpu-security-policy-v1',
      runtimeNetworkDownloadAllowed: false,
    }),
  ),
}

const DEFINITION_DIGEST = computeSkillCapabilityDefinitionDigest(DEFINITION)

export function createTrackAllSam31OrchestraQualificationSnapshot():
SkillQualificationSnapshot {
  return createSkillQualificationSnapshot({
    schemaVersion: ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
    snapshotId: TRACK_ALL_SAM3_1_ORCHESTRA_QUALIFICATION_SNAPSHOT_ID,
    skillKey: 'track_all',
    skillVersion: TRACK_ALL_SAM3_1_ORCHESTRA_SKILL_VERSION,
    contractVersion: TRACK_ALL_SAM3_1_ORCHESTRA_CONTRACT_VERSION,
    capabilityDefinitionDigestSha256: DEFINITION_DIGEST,
    observedReleaseRef: orchestraEvidenceRef(
      'track-all-sam3_1-orchestra-source-candidate-v1',
      orchestraDigest({
        a100PrivateInternalReleaseReread: false,
        l4FallbackPrivateInternalReleaseReread: false,
        l4TaskQaRuntimeReleaseReread: false,
        sourceCandidateVersion:
          'track-all-sam3_1-orchestra-source-candidate-v1',
      }),
    ),
    observedAt: '2026-08-06T00:00:00.000Z',
    overall: 'blocked',
    jobQualifications: [{
      jobType: CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
      status: 'blocked',
      blockerCodes: BLOCKERS,
      qualifiedRouteIds: [],
      qualificationEvidenceRefs: [],
    }],
    callerCanSelfQualify: false,
    qualificationOwner: 'canonical_skill_qualification_registry',
    dispatchAuthorityGranted: false,
    providerAuthorityGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

export function createTrackAllSam31OrchestraCapabilityManifest():
SkillCapabilityManifest {
  return createTrackAllSam31OrchestraCapabilityManifestForQualification(
    createTrackAllSam31OrchestraQualificationSnapshot(),
  )
}

export function createTrackAllSam31OrchestraCapabilityManifestForQualification(
  qualificationSnapshot: SkillQualificationSnapshot,
): SkillCapabilityManifest {
  return parseSkillCapabilityManifest({
    value: createSkillCapabilityManifest({
      definition: DEFINITION,
      qualificationSnapshot,
    }),
    qualificationSnapshot,
  })
}

function requirement(requirementId: string, artifactType: string) {
  return {
    requirementId,
    artifactType,
    requiredForJobTypes: JOBS,
    minimumCount: 1,
    maximumCount: 1,
    immutableRereadRequired: true,
  }
}

function evidence(requirementId: string, evidenceType: string) {
  return {
    requirementId,
    evidenceType,
    requiredForJobTypes: JOBS,
    exactRereadRequired: true,
  }
}

function dependency(ruleId: string, otherSkillKey: string) {
  return {
    ruleId,
    otherSkillKey,
    appliesToJobTypes: JOBS,
    conditionCode: 'orchestra_scene_graph_requires_dependency',
  }
}

function overlap(ruleId: string, otherSkillKey: string) {
  return {
    ruleId,
    otherSkillKey,
    appliesToJobTypes: JOBS,
    ownershipBoundaryCode:
      'track_all_owns_geometry_other_skill_retains_creative_ownership',
  }
}

function tool(
  routeId: string,
  operationId: string,
  executionClass: 'l4_gpu_standard' | 'a100_80gb_gpu_heavy',
  toolOrProviderId: string,
) {
  return {
    routeId,
    jobTypes: JOBS,
    routeKind: 'gpu_model' as const,
    operationId,
    executionClass,
    toolOrProviderId,
    currentQualificationRequired: true as const,
    accountEffectivePricingRequired: true,
  }
}

function qa(policyId: string, checks: string[]) {
  return {
    policyId,
    policyVersion: `${policyId}-v1`,
    requiredCheckIds: checks,
    blockingFailureCodes: ids(...checks.map((check) => `${check}_failed`)),
    independentQaOwnerRequired: true,
  }
}

function invalidation(ruleId: string, changedAuthorityType: string) {
  return {
    ruleId,
    changedAuthorityType,
    invalidatesJobTypes: JOBS,
    newOrchestraCallRequired: true as const,
  }
}

function fixture(fixtureId: string) {
  return {
    fixtureId,
    fixtureVersion: `${fixtureId}-v1`,
    jobTypes: JOBS,
    requiredEvidenceTypes: ids(
      'account_effective_cost_evidence',
      'canonical_result_reread',
      'exact_orchestra_call',
      'gpu_runtime_release_evidence',
      'private_complete_scene_quality_evidence',
    ),
    currentEvidenceRef: null,
  }
}

function ids(...values: string[]): string[] {
  return [...new Set(values)].sort(compare)
}

function by(key: string) {
  return (left: Record<string, unknown>, right: Record<string, unknown>) =>
    compare(String(left[key]), String(right[key]))
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
