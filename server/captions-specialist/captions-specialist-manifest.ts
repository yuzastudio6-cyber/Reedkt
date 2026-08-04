import { createHash } from 'node:crypto'
import {
  CAPTIONS_ADVANCED_VISUAL_JOB_TYPES,
  CAPTIONS_BOUNDARY_JOB_TYPES,
  CAPTIONS_LIVING_FRAME_JOB_TYPES,
  CAPTIONS_SCENE_JOB_TYPES,
  CAPTIONS_SPECIALIST_CONTRACT_VERSION,
  CAPTIONS_SPECIALIST_SECURITY_POLICY_VERSION,
  CAPTIONS_SPECIALIST_SKILL_KEY,
  CAPTIONS_SPECIALIST_VERSION,
  CAPTIONS_SUPPORTED_JOB_TYPES,
  CAPTIONS_SUPPORT_JOB_TYPES,
  CAPTIONS_TRACKING_JOB_TYPES,
  CAPTIONS_UNSUPPORTED_JOB_TYPES,
  CAPTIONS_VIDEO_JOB_TYPES,
  type CaptionsSupportedJobType,
} from '../../src/types/captions-specialist'
import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_SKILL_JOB_RESULT_VERSION,
  SKILL_SUPPORT_REQUEST_VERSION,
} from '../../src/types/orchestra-skill-contracts'
import {
  SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION_V2,
  type SkillCapabilityEntry,
  type SkillScopeLevel,
  type UnpublishedSkillCapabilityManifestV2,
} from '../../src/types/skill-capability-manifest'
import {
  publishSkillCapabilityManifestV2,
} from '../orchestra/skill-capability-manifest'

const PLANNING_EVIDENCE_ID = 'captions.cap01.contract-routing'
const PLANNING_ROUTE_ID = 'captions.planning.no-output'
const PLANNING_ATTEMPT_ID = 'captions.planning.single-pass'
const INVALIDATION_RULE_ID = 'captions.invalidate.approved-snapshot'
const REVISION_RULE_ID = 'captions.revision.lineage'

function scopeForJob(jobType: CaptionsSupportedJobType): SkillScopeLevel[] {
  if ((CAPTIONS_VIDEO_JOB_TYPES as readonly string[]).includes(jobType)) return ['video']
  if ((CAPTIONS_BOUNDARY_JOB_TYPES as readonly string[]).includes(jobType)) return ['boundary']
  if ((CAPTIONS_SCENE_JOB_TYPES as readonly string[]).includes(jobType)) return ['scene']
  if ((CAPTIONS_SUPPORT_JOB_TYPES as readonly string[]).includes(jobType)) {
    return ['scene', 'boundary', 'video']
  }
  return ['scene']
}

function requiredEvidenceForJob(jobType: CaptionsSupportedJobType): string[] {
  const evidence = [
    'canonical_transcript',
    'confirmed_output_frame',
    'master_timing_or_planning_timing',
  ]
  if ((CAPTIONS_ADVANCED_VISUAL_JOB_TYPES as readonly string[]).includes(jobType)) {
    evidence.push('visual_intelligence_report')
  }
  if ((CAPTIONS_TRACKING_JOB_TYPES as readonly string[]).includes(jobType)) {
    evidence.push('track_all_mask_binding')
  }
  if ((CAPTIONS_LIVING_FRAME_JOB_TYPES as readonly string[]).includes(jobType)) {
    evidence.push('caption_living_frame_handoff_binding')
  }
  return evidence
}

function makeCapabilityEntry(
  jobType: CaptionsSupportedJobType,
): SkillCapabilityEntry {
  const evidence = requiredEvidenceForJob(jobType)
  const advancedVisual = evidence.includes('visual_intelligence_report')
  const tracking = evidence.includes('track_all_mask_binding')
  return {
    capabilityKey: `captions.${jobType}`,
    capabilityVersion: 'captions-capability-v1',
    displayName: jobType.replaceAll('_', ' '),
    description: `Bounded Caption specialist capability for ${jobType}.`,
    supportedJobType: jobType,
    qualificationStatus: 'planning_qualified',
    qualificationByExecutionMode: {
      planning: 'planning_qualified',
      preview_execution: 'blocked',
      final_execution: 'blocked',
    },
    qualificationEvidenceRefs: [PLANNING_EVIDENCE_ID],
    supportedScopeLevels: scopeForJob(jobType),
    acceptedCallerTypes: ['head_of_orchestra'],
    requiredInputs: ['compiled_caption_intent', 'canonical_scope'],
    optionalInputs: ['approved_snapshot', 'dependency_artifacts'],
    requiredEvidence: evidence,
    acceptedArtifactTypes: evidence,
    producedArtifactTypes: ['caption_specialist_job_receipt'],
    requiredContext: ['authorized_scope', 'confirmed_output_frame'],
    visualIntelligenceRequirements: advancedVisual
      ? ['visual_intelligence_report_required_for_advanced_visual_decision']
      : ['optional_for_simple_stable_caption_planning'],
    trackingRequirements: tracking
      ? ['track_all_binding_required', 'sam3_1_may_only_be_used_behind_track_all']
      : [],
    planningPhase: (CAPTIONS_BOUNDARY_JOB_TYPES as readonly string[]).includes(jobType)
      ? 'boundary_planning'
      : 'scene_planning',
    allowedExecutionPhases: ['planning'],
    mustRunBefore: [],
    mustRunAfter: [],
    conflictsWith: ['global_timeline_writer', 'direct_peer_dispatch'],
    mayOverlapWith: [{
      skillKey: 'visual_intelligence',
      mode: 'read_only_overlap',
    }],
    ownershipRequirements: [
      'speech_derived_typography_only',
      'caption_linguistic_and_typographic_analysis_only',
      'remotion_remains_final_canvas_owner',
    ],
    timeEstimatorKey: 'captions.time-estimator-v1',
    creditEstimatorKey: 'captions.credit-estimator-v1',
    attemptPolicyKey: PLANNING_ATTEMPT_ID,
    primaryToolRoutes: [PLANNING_ROUTE_ID],
    fallbackRoutes: [],
    lowerCostRoutes: [],
    planningQa: ['exact_scope', 'exact_evidence', 'no_owner_expansion'],
    outputQa: ['no_execution_claim', 'byte_free_artifact_refs'],
    integrationQa: ['future_hq_mediated_support_only'],
    invalidationRules: [INVALIDATION_RULE_ID],
    revisionRules: [REVISION_RULE_ID],
    qualificationFixtures: [],
    knownLimitations: [
      'CAP-01 qualifies contract routing only; media execution requires later milestone evidence.',
    ],
  }
}

const capabilityEntries = CAPTIONS_SUPPORTED_JOB_TYPES.map(makeCapabilityEntry)

const securityPolicyHash = createHash('sha256')
  .update(CAPTIONS_SPECIALIST_SECURITY_POLICY_VERSION, 'utf8')
  .digest('hex')

const unpublishedManifest: UnpublishedSkillCapabilityManifestV2 = {
  manifestSchemaVersion: SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION_V2,
  manifestId: 'captions.specialist.manifest',
  skillKey: CAPTIONS_SPECIALIST_SKILL_KEY,
  skillVersion: CAPTIONS_SPECIALIST_VERSION,
  contractVersion: CAPTIONS_SPECIALIST_CONTRACT_VERSION,
  qualificationStatus: 'planning_qualified',
  qualificationByExecutionMode: {
    planning: 'planning_qualified',
    preview_execution: 'blocked',
    final_execution: 'blocked',
  },
  qualificationEvidenceRefs: [{
    evidenceId: PLANNING_EVIDENCE_ID,
    evidenceType: 'smoke_test',
    location: 'server/smoke/captions-specialist-cap-01-smoke.ts',
    assertion: 'Strict manifest, qualification, support, resume, and result contract routing.',
  }],
  skillClass: 'creative_owner',
  coordinationCritical: true,
  canOwnPrimaryVisual: true,
  canOwnPrimaryAnalysis: true,
  canActAsSupport: true,
  canOperateAtVideoLevel: true,
  canOperateAtSceneLevel: true,
  canOperateAtBoundaryLevel: true,
  supportedJobTypes: [...CAPTIONS_SUPPORTED_JOB_TYPES],
  unsupportedJobTypes: [...CAPTIONS_UNSUPPORTED_JOB_TYPES],
  requiredInputs: ['compiled_caption_intent', 'canonical_scope'],
  optionalInputs: ['approved_snapshot', 'dependency_artifacts'],
  requiredSceneContext: ['confirmed_output_frame', 'timing_authority'],
  requiredSourceEvidence: ['canonical_transcript'],
  visualIntelligenceRequirements: [
    'optional_for_simple_srt_vtt_and_stable_captions',
    'required_for_advanced_visual_caption_decisions',
  ],
  trackingRequirements: [
    'track_all_owns_tracking',
    'sam3_1_may_only_execute_behind_track_all',
  ],
  acceptedArtifactTypes: [
    'canonical_transcript', 'confirmed_output_frame',
    'master_timing_or_planning_timing', 'visual_intelligence_report',
    'track_all_mask_binding', 'caption_living_frame_handoff_binding',
  ],
  producedArtifactTypes: ['caption_specialist_job_receipt'],
  planningPhase: 'scene_planning',
  allowedExecutionPhases: ['planning'],
  mustRunBefore: ['final_caption_execution'],
  mustRunAfter: ['compiled_caption_intent'],
  conflictsWith: ['global_timeline_writer', 'direct_peer_dispatch'],
  mayOverlapWith: [{
    skillKey: 'visual_intelligence',
    mode: 'read_only_overlap',
  }],
  ownershipRequirements: [
    'primary_visual_ownership_is_limited_to_speech_derived_typography',
    'primary_analysis_is_limited_to_caption_linguistic_and_typographic_analysis',
    'no_visual_intelligence_tracking_timeline_canvas_qa_billing_or_delivery_ownership',
  ],
  timeEstimator: {
    estimatorKey: 'captions.time-estimator-v1',
    estimatorVersion: 'captions-time-estimator-v1',
    factors: ['duration', 'speech_density', 'caption_complexity'],
  },
  creditEstimator: {
    estimatorKey: 'captions.credit-estimator-v1',
    estimatorVersion: 'captions-credit-estimator-v1',
    factors: ['render_complexity', 'dependency_cost_inputs'],
  },
  attemptPolicies: [{
    attemptPolicyKey: PLANNING_ATTEMPT_ID,
    attemptPolicyVersion: 'captions-planning-attempt-v1',
    operationClass: 'planning',
    defaultCandidateCount: 1,
    maximumCandidateCount: 1,
    maximumAttempts: 1,
    retryEligibility: 'not_applicable',
    fallbackEligibility: 'not_applicable',
    unknownOutcomeBehavior: 'not_applicable',
    cancellationBehavior: 'Return a closed non-executing receipt.',
    timeoutSeconds: 30,
    idempotencyRequired: true,
    failedAttemptsMayRetainCost: false,
    freshApprovalRequiredAfterExhaustion: false,
  }],
  toolRoutes: [{
    routeKey: PLANNING_ROUTE_ID,
    routeVersion: 'captions-planning-route-v1',
    category: 'no_output',
    displayName: 'Caption contract planning route',
    qualificationStatus: 'planning_qualified',
    qualificationEvidenceRefs: [PLANNING_EVIDENCE_ID],
    serverOwned: true,
    paid: false,
    knownLimitations: ['Produces no media or customer artifact.'],
  }],
  fallbackRoutes: [],
  lowerCostRoutes: [],
  planningQa: ['exact_scope', 'exact_evidence', 'no_owner_expansion'],
  outputQa: ['no_execution_claim', 'byte_free_artifact_refs'],
  integrationQa: ['future_hq_mediated_support_only'],
  invalidationRules: [{
    ruleKey: INVALIDATION_RULE_ID,
    trigger: 'approval_snapshot_changed',
    effect: 'invalidate_all',
    appliesToPhases: ['planning', 'revision'],
  }],
  revisionRules: [{
    ruleKey: REVISION_RULE_ID,
    behavior: 'maintain_revision_lineage',
  }],
  qualificationFixtures: ['captions.cap01.contract-routing'],
  knownLimitations: [
    'The future HQ Orchestra is not implemented by this manifest.',
    'Preview, final execution, provider, asset, cost, QA approval, public, and production authority remain blocked.',
  ],
  capabilityEntries,
  invocationPolicy: {
    acceptedCallContractVersions: [ORCHESTRA_SKILL_CALL_VERSION],
    hqMediated: true,
    directPeerDispatchAllowed: false,
    missingDependencyDisposition: 'needs_followup',
    resumeRequiresExactRequestBinding: true,
    resumeRequiresApprovedArtifactInjection: true,
  },
  resultContract: {
    jobResultSchemaVersion: ORCHESTRA_SKILL_JOB_RESULT_VERSION,
    supportRequestSchemaVersion: SKILL_SUPPORT_REQUEST_VERSION,
    byteFreeCoordinationPayloads: true,
    closedSerializedDataRequired: true,
    exactScopeEchoRequired: true,
    exactQualificationBindingRequired: true,
  },
  failureSemantics: {
    unsupportedJobDisposition: 'unsupported',
    missingEvidenceDisposition: 'needs_followup',
    staleAuthorityDisposition: 'blocked',
    invalidInputDisposition: 'blocked',
    maskFailureScope: 'mask_dependent_work_only',
    unrelatedWorkMayContinue: true,
    noImplicitFallback: true,
  },
  securityPolicyRef: {
    policyId: 'captions.specialist.private-security',
    policyVersion: CAPTIONS_SPECIALIST_SECURITY_POLICY_VERSION,
    contentHash: securityPolicyHash,
  },
}

export const CAPTIONS_SPECIALIST_MANIFEST =
  publishSkillCapabilityManifestV2(unpublishedManifest)
