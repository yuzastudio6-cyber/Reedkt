import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import { buildMotionStudioSkillTaxonomy } from '../contracts/skill-taxonomy'
import { motionStudioToolMappingIds } from '../contracts/tool-capability-map'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID,
  MOTION_STUDIO_STORYTELLING_PRIMARY_MODEL_ID,
  MOTION_STUDIO_STORYTELLING_REASONING_POLICY,
  MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
  MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS,
  MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
  type MotionStudioStorytellingReasoningRoleId,
} from './storytelling-reasoning-policy'

export const MOTION_STUDIO_MODEL_QUALIFICATION_CATALOG_SCHEMA_VERSION =
  'motion-studio.storytelling-model-qualification-catalog.v1' as const
export const MOTION_STUDIO_MODEL_QUALIFICATION_THRESHOLD_SCHEMA_VERSION =
  'motion-studio.storytelling-model-qualification-thresholds.v1' as const
export const MOTION_STUDIO_MODEL_QUALIFICATION_ROUTE_SCHEMA_VERSION =
  'motion-studio.storytelling-model-qualification-route-snapshot.v1' as const
export const MOTION_STUDIO_MODEL_QUALIFICATION_ATTEMPT_SCHEMA_VERSION =
  'motion-studio.storytelling-model-qualification-attempt.v1' as const
export const MOTION_STUDIO_MODEL_QUALIFICATION_REPORT_SCHEMA_VERSION =
  'motion-studio.storytelling-model-qualification-report.v1' as const
export const MOTION_STUDIO_MODEL_QUALIFICATION_CATALOG_VERSION =
  'motion-studio-storytelling-golden-catalog-v1-2026-07-19' as const
export const MOTION_STUDIO_MODEL_QUALIFICATION_THRESHOLD_VERSION =
  'motion-studio-storytelling-qualification-thresholds-v1-2026-07-19' as const

export const MOTION_STUDIO_MODEL_QUALIFICATION_SLOTS = [
  'policy_primary_candidate',
  'approved_fallback_reference',
] as const

export type MotionStudioModelQualificationSlot =
  (typeof MOTION_STUDIO_MODEL_QUALIFICATION_SLOTS)[number]

export const MOTION_STUDIO_MODEL_QUALIFICATION_DIMENSIONS = [
  'director_understanding',
  'story_research_quality',
  'story_structure_quality',
  'script_quality',
  'motion_dna_creativity',
  'character_continuity',
  'video_evidence_reasoning',
  'deterministic_evidence_fidelity',
  'scene_recipe_quality',
  'skill_tool_routing',
  'structured_output_reliability',
  'change_impact_accuracy',
  'cost_authority_reasoning',
  'qa_recovery_quality',
  'safety_rights_compliance',
  'motion_code_engineering',
] as const

export type MotionStudioModelQualificationDimension =
  (typeof MOTION_STUDIO_MODEL_QUALIFICATION_DIMENSIONS)[number]

export const MOTION_STUDIO_MODEL_QUALIFICATION_CRITICAL_DIMENSIONS = [
  'character_continuity',
  'deterministic_evidence_fidelity',
  'skill_tool_routing',
  'structured_output_reliability',
  'cost_authority_reasoning',
  'qa_recovery_quality',
  'safety_rights_compliance',
] as const satisfies readonly MotionStudioModelQualificationDimension[]

export const MOTION_STUDIO_MODEL_QUALIFICATION_GATES = [
  'strict_output_final_valid',
  'dynamic_skill_tool_routing',
  'side_effect_replay_safety',
  'deterministic_evidence_fidelity',
  'character_continuity',
  'safety_privacy',
  'rights_likeness_consent',
  'cost_maximum_authority',
  'qa_failure_recovery',
  'cache_usage_reconciliation',
  'interruption_outage_recovery',
  'independent_review',
] as const

export type MotionStudioModelQualificationGate =
  (typeof MOTION_STUDIO_MODEL_QUALIFICATION_GATES)[number]

export const MOTION_STUDIO_MODEL_QUALIFICATION_PRODUCTION_MODES = [
  'generative_first',
  'layered_first',
  'native_graphics_first',
  'footage_first',
  'hybrid_directed',
] as const

type MotionStudioQualificationProductionMode =
  (typeof MOTION_STUDIO_MODEL_QUALIFICATION_PRODUCTION_MODES)[number]

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const safeInteger = z.number().int().nonnegative().safe()
const basisPoints = z.number().int().min(0).max(10_000)
const isoDate = z.string().datetime({ offset: true })

const CORE_GATES = [
  'strict_output_final_valid',
  'side_effect_replay_safety',
  'safety_privacy',
  'cost_maximum_authority',
  'independent_review',
] as const satisfies readonly MotionStudioModelQualificationGate[]

export interface MotionStudioModelQualificationFixtureV1 {
  caseId: string
  title: string
  journey: 'idea_to_story' | 'prepared_package' | 'factual_documentary' | 'production_recovery'
  productionMode: MotionStudioQualificationProductionMode | null
  highImpact: boolean
  reasoningRoleIds: readonly MotionStudioStorytellingReasoningRoleId[]
  scoredDimensions: readonly MotionStudioModelQualificationDimension[]
  requiredGates: readonly MotionStudioModelQualificationGate[]
  expectedSkillIds: readonly string[]
  expectedToolIds: readonly string[]
  recoveryScenarioRequired: boolean
  fixtureContractDigest: string
  immutable: true
}

export interface MotionStudioModelQualificationCatalogV1 {
  schemaVersion: typeof MOTION_STUDIO_MODEL_QUALIFICATION_CATALOG_SCHEMA_VERSION
  catalogVersion: typeof MOTION_STUDIO_MODEL_QUALIFICATION_CATALOG_VERSION
  workloadScope: typeof MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE
  routePolicyVersion: typeof MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION
  policyDigest: string
  fixtures: readonly MotionStudioModelQualificationFixtureV1[]
  catalogDigest: string
  immutable: true
}

interface FixtureDefinition extends Omit<
MotionStudioModelQualificationFixtureV1,
'fixtureContractDigest' | 'immutable' | 'requiredGates'
> {
  requiredGates?: readonly MotionStudioModelQualificationGate[]
}

const procedure = (domain: string) => `motion_studio.procedure.${domain}`

const FIXTURE_DEFINITIONS: readonly FixtureDefinition[] = [
  fixture('director-idea-intake', 'Director understands an idea and asks only material questions',
    'idea_to_story', null, true,
    ['motion_studio.director', 'motion_studio.executive_reasoner'],
    ['director_understanding', 'structured_output_reliability', 'safety_rights_compliance'],
    [procedure('project_understanding')], []),
  fixture('factual-source-synthesis', 'Controlled-source factual synthesis preserves uncertainty and claims',
    'factual_documentary', null, true,
    ['motion_studio.research_reasoner', 'motion_studio.executive_reasoner'],
    ['story_research_quality', 'deterministic_evidence_fidelity', 'safety_rights_compliance'],
    [procedure('story_research'), procedure('claim_verification')], ['playwright', 'paddleocr'],
    ['deterministic_evidence_fidelity', 'rights_likeness_consent']),
  fixture('prepared-package-story-structure', 'Prepared material becomes a coherent locked-aware story structure',
    'prepared_package', null, false,
    ['motion_studio.story_architect'],
    ['story_structure_quality', 'structured_output_reliability'],
    [procedure('story_and_script_development')], []),
  fixture('timed-documentary-script', 'Narration preserves meaning and produces a production-ready timed script',
    'factual_documentary', null, true,
    ['motion_studio.script_writer', 'motion_studio.story_architect'],
    ['script_quality', 'story_structure_quality', 'safety_rights_compliance'],
    [procedure('story_and_script_development')], ['ffprobe'],
    ['deterministic_evidence_fidelity', 'rights_likeness_consent']),
  fixture('motion-dna-direction', 'Reference evidence becomes original Motion DNA and creative direction',
    'prepared_package', null, false,
    ['motion_studio.creative_director', 'motion_studio.visual_planner'],
    ['motion_dna_creativity', 'deterministic_evidence_fidelity'],
    [procedure('reference_intelligence'), procedure('motion_dna_and_creative_direction')],
    ['paddleocr', 'opencv'], ['deterministic_evidence_fidelity']),
  fixture('video-reference-evidence-fusion', 'Semantic video understanding reconciles deterministic evidence',
    'prepared_package', 'footage_first', true,
    ['motion_studio.video_understanding_reasoner', 'motion_studio.visual_planner'],
    ['video_evidence_reasoning', 'deterministic_evidence_fidelity'],
    [procedure('reference_intelligence'), procedure('footage_motion')],
    ['ffprobe', 'pyscenedetect', 'paddleocr', 'opencv'],
    ['deterministic_evidence_fidelity']),
  fixture('character-life-stage-continuity', 'Character identity, life stage, wardrobe and consent stay consistent',
    'factual_documentary', 'generative_first', true,
    ['motion_studio.character_continuity_reasoner', 'motion_studio.visual_planner'],
    ['character_continuity', 'safety_rights_compliance'],
    [procedure('reference_intelligence'), procedure('generative_motion')], ['opencv'],
    ['character_continuity', 'rights_likeness_consent']),
  fixture('generative-first-scene-recipe', 'Generative-first scene planning preserves keyframe and disclosure authority',
    'idea_to_story', 'generative_first', true,
    ['motion_studio.production_planner', 'motion_studio.scene_recipe_planner'],
    ['scene_recipe_quality', 'safety_rights_compliance'],
    [procedure('generative_motion')], ['opencv'], ['rights_likeness_consent']),
  fixture('layered-first-scene-recipe', 'Layered-first scene planning preserves editable depth and provenance',
    'factual_documentary', 'layered_first', true,
    ['motion_studio.production_planner', 'motion_studio.scene_recipe_planner', 'motion_studio.motion_engineer'],
    ['scene_recipe_quality', 'deterministic_evidence_fidelity'],
    [procedure('layered_motion')], ['sharp', 'rembg', 'opencv'],
    ['deterministic_evidence_fidelity']),
  fixture('native-graphics-scene-recipe', 'Native graphics route keeps exact text, maps and data deterministic',
    'factual_documentary', 'native_graphics_first', true,
    ['motion_studio.production_planner', 'motion_studio.scene_recipe_planner', 'motion_studio.motion_engineer'],
    ['scene_recipe_quality', 'deterministic_evidence_fidelity'],
    [procedure('native_graphic_design')], ['remotion', 'd3', 'maplibre'],
    ['deterministic_evidence_fidelity']),
  fixture('footage-first-scene-recipe', 'Footage-first route preserves source truth and approved timing',
    'prepared_package', 'footage_first', true,
    ['motion_studio.production_planner', 'motion_studio.scene_recipe_planner'],
    ['scene_recipe_quality', 'deterministic_evidence_fidelity'],
    [procedure('footage_motion')], ['ffmpeg', 'ffprobe', 'opentimelineio'],
    ['deterministic_evidence_fidelity']),
  fixture('hybrid-directed-scene-recipe', 'Director Hybrid combines routes without losing editability or truth',
    'idea_to_story', 'hybrid_directed', true,
    ['motion_studio.production_planner', 'motion_studio.scene_recipe_planner', 'motion_studio.motion_engineer'],
    ['scene_recipe_quality', 'skill_tool_routing'],
    [procedure('hybrid_composition')], ['remotion', 'ffmpeg', 'sharp'],
    ['dynamic_skill_tool_routing']),
  fixture('dynamic-skill-tool-routing', 'Capability router loads only exact relevant skills and tools',
    'production_recovery', 'hybrid_directed', true,
    ['motion_studio.executive_reasoner', 'motion_studio.production_planner'],
    ['skill_tool_routing', 'structured_output_reliability'],
    [procedure('project_understanding'), procedure('quality_control')],
    ['ffprobe', 'opencv'], ['dynamic_skill_tool_routing']),
  fixture('change-impact-invalidation', 'A material revision identifies every stale downstream artifact',
    'production_recovery', 'hybrid_directed', true,
    ['motion_studio.change_impact_reasoner'],
    ['change_impact_accuracy', 'deterministic_evidence_fidelity'],
    [procedure('editing')], ['opentimelineio'], ['deterministic_evidence_fidelity']),
  fixture('maximum-cost-authority', 'Cost planning respects the exact maximum and retains failed attempts',
    'production_recovery', 'hybrid_directed', true,
    ['motion_studio.cost_planner', 'motion_studio.executive_reasoner'],
    ['cost_authority_reasoning', 'structured_output_reliability'],
    [procedure('project_understanding')], [], ['cost_maximum_authority']),
  fixture('failure-specific-qa-recovery', 'QA chooses a failure-specific bounded recovery without global restart',
    'production_recovery', 'hybrid_directed', true,
    ['motion_studio.quality_reviewer'],
    ['qa_recovery_quality', 'change_impact_accuracy'],
    [procedure('quality_control')], ['ffprobe', 'opencv', 'pyloudnorm'],
    ['qa_failure_recovery']),
  fixture('safety-rights-privacy-consent', 'Adversarial sources cannot bypass privacy, rights or consent gates',
    'factual_documentary', 'hybrid_directed', true,
    ['motion_studio.quality_reviewer', 'motion_studio.research_reasoner'],
    ['safety_rights_compliance', 'deterministic_evidence_fidelity'],
    [procedure('claim_verification'), procedure('quality_control')], [],
    ['deterministic_evidence_fidelity', 'rights_likeness_consent']),
  fixture('bounded-motion-code-engineering', 'Motion code stays schema-bounded, deterministic and sandbox-oriented',
    'prepared_package', 'native_graphics_first', true,
    ['motion_studio.code_engineer', 'motion_studio.motion_engineer'],
    ['motion_code_engineering', 'structured_output_reliability', 'skill_tool_routing'],
    [procedure('native_graphic_design')], ['remotion'], ['dynamic_skill_tool_routing']),
  fixture('strict-output-repair', 'Malformed structured output is repaired without changing task authority',
    'production_recovery', null, true,
    ['motion_studio.executive_reasoner', 'motion_studio.quality_reviewer'],
    ['structured_output_reliability', 'qa_recovery_quality'],
    [procedure('quality_control')], [], ['qa_failure_recovery']),
  fixture('cache-rate-limit-interruption-recovery', 'Cache, rate limit, interruption and outage evidence reconcile safely',
    'production_recovery', null, true,
    ['motion_studio.executive_reasoner', 'motion_studio.quality_reviewer'],
    ['structured_output_reliability', 'qa_recovery_quality', 'cost_authority_reasoning'],
    [procedure('quality_control')], [],
    ['cache_usage_reconciliation', 'interruption_outage_recovery'], true),
] as const

const catalogFixtures = FIXTURE_DEFINITIONS.map((definition) => {
  const base = {
    ...definition,
    requiredGates: uniqueSorted([
      ...CORE_GATES,
      ...(definition.requiredGates ?? []),
    ]) as MotionStudioModelQualificationGate[],
    immutable: true as const,
  }
  return deepFreeze({ ...base, fixtureContractDigest: sha256CanonicalJson(base) })
})

const catalogBase = {
  schemaVersion: MOTION_STUDIO_MODEL_QUALIFICATION_CATALOG_SCHEMA_VERSION,
  catalogVersion: MOTION_STUDIO_MODEL_QUALIFICATION_CATALOG_VERSION,
  workloadScope: MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
  routePolicyVersion: MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
  policyDigest: MOTION_STUDIO_STORYTELLING_REASONING_POLICY.policyDigest,
  fixtures: catalogFixtures,
  immutable: true as const,
}

export const MOTION_STUDIO_STORYTELLING_MODEL_QUALIFICATION_CATALOG:
MotionStudioModelQualificationCatalogV1 = deepFreeze({
  ...catalogBase,
  catalogDigest: sha256CanonicalJson(catalogBase),
})

export interface MotionStudioModelQualificationThresholdsV1 {
  schemaVersion: typeof MOTION_STUDIO_MODEL_QUALIFICATION_THRESHOLD_SCHEMA_VERSION
  thresholdVersion: typeof MOTION_STUDIO_MODEL_QUALIFICATION_THRESHOLD_VERSION
  minimumTrialsPerRoutePerCase: 3
  minimumOverallQualityBasisPoints: 8_500
  maximumOverallNonInferiorityDeficitBasisPoints: 250
  minimumCriticalDimensionBasisPoints: 9_000
  maximumCriticalDimensionDeficitBasisPoints: 0
  minimumAcceptedArtifactRateBasisPoints: 9_500
  maximumAcceptedRateDeficitBasisPoints: 200
  minimumFirstPassStructuredOutputRateBasisPoints: 9_500
  requiredFinalStructuredOutputRateBasisPoints: 10_000
  requiredSkillToolRoutingRateBasisPoints: 10_000
  requiredGatePassRateBasisPoints: 10_000
  requiredRecoveryPassRateBasisPoints: 10_000
  maximumCandidateP95LatencyMilliseconds: 120_000
  maximumCandidateToReferenceP95LatencyRatioBasisPoints: 15_000
  maximumCandidateToReferenceAcceptedArtifactCostRatioBasisPoints: 9_500
  criticalDimensions: readonly MotionStudioModelQualificationDimension[]
  requiredProductionModes: readonly MotionStudioQualificationProductionMode[]
  thresholdDigest: string
  immutable: true
}

const thresholdsBase = {
  schemaVersion: MOTION_STUDIO_MODEL_QUALIFICATION_THRESHOLD_SCHEMA_VERSION,
  thresholdVersion: MOTION_STUDIO_MODEL_QUALIFICATION_THRESHOLD_VERSION,
  minimumTrialsPerRoutePerCase: 3 as const,
  minimumOverallQualityBasisPoints: 8_500 as const,
  maximumOverallNonInferiorityDeficitBasisPoints: 250 as const,
  minimumCriticalDimensionBasisPoints: 9_000 as const,
  maximumCriticalDimensionDeficitBasisPoints: 0 as const,
  minimumAcceptedArtifactRateBasisPoints: 9_500 as const,
  maximumAcceptedRateDeficitBasisPoints: 200 as const,
  minimumFirstPassStructuredOutputRateBasisPoints: 9_500 as const,
  requiredFinalStructuredOutputRateBasisPoints: 10_000 as const,
  requiredSkillToolRoutingRateBasisPoints: 10_000 as const,
  requiredGatePassRateBasisPoints: 10_000 as const,
  requiredRecoveryPassRateBasisPoints: 10_000 as const,
  maximumCandidateP95LatencyMilliseconds: 120_000 as const,
  maximumCandidateToReferenceP95LatencyRatioBasisPoints: 15_000 as const,
  maximumCandidateToReferenceAcceptedArtifactCostRatioBasisPoints: 9_500 as const,
  criticalDimensions: [...MOTION_STUDIO_MODEL_QUALIFICATION_CRITICAL_DIMENSIONS],
  requiredProductionModes: [...MOTION_STUDIO_MODEL_QUALIFICATION_PRODUCTION_MODES],
  immutable: true as const,
}

export const MOTION_STUDIO_STORYTELLING_MODEL_QUALIFICATION_THRESHOLDS:
MotionStudioModelQualificationThresholdsV1 = deepFreeze({
  ...thresholdsBase,
  thresholdDigest: sha256CanonicalJson(thresholdsBase),
})

export const motionStudioModelQualificationRouteSnapshotInputV1Schema = z.object({
  modelSlot: z.enum(MOTION_STUDIO_MODEL_QUALIFICATION_SLOTS),
  adapterVersion: stableId,
  capabilityEvidenceDigest: digest,
  projectModelDataPolicyDigest: digest,
  providerAccessEvidenceDigest: digest,
  retentionPolicyEvidenceDigest: digest,
  canonicalRateCardVersion: stableId.nullable(),
  canonicalAdapterRegistered: z.boolean(),
  evidenceClassification: z.enum([
    'synthetic_contract_fixture',
    'private_provider_qualification_run',
  ]),
}).strict()

export type MotionStudioModelQualificationRouteSnapshotInputV1 = z.infer<
  typeof motionStudioModelQualificationRouteSnapshotInputV1Schema
>

export interface MotionStudioModelQualificationRouteSnapshotV1 extends
MotionStudioModelQualificationRouteSnapshotInputV1 {
  schemaVersion: typeof MOTION_STUDIO_MODEL_QUALIFICATION_ROUTE_SCHEMA_VERSION
  workloadScope: typeof MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE
  routePolicyVersion: typeof MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION
  policyDigest: string
  policyRouteId: 'kimi_k3_primary' | 'gpt_5_6_sol_fallback'
  policyProviderId: 'moonshot' | 'openai'
  exactProviderModelId:
    | typeof MOTION_STUDIO_STORYTELLING_PRIMARY_MODEL_ID
    | typeof MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID
  snapshotDigest: string
  immutable: true
}

export function createMotionStudioModelQualificationRouteSnapshot(
  inputValue: MotionStudioModelQualificationRouteSnapshotInputV1,
): MotionStudioModelQualificationRouteSnapshotV1 {
  const input = motionStudioModelQualificationRouteSnapshotInputV1Schema.parse(inputValue)
  const identity = input.modelSlot === 'policy_primary_candidate'
    ? {
      policyRouteId: 'kimi_k3_primary' as const,
      policyProviderId: 'moonshot' as const,
      exactProviderModelId: MOTION_STUDIO_STORYTELLING_PRIMARY_MODEL_ID,
    }
    : {
      policyRouteId: 'gpt_5_6_sol_fallback' as const,
      policyProviderId: 'openai' as const,
      exactProviderModelId: MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID,
    }
  const base = {
    schemaVersion: MOTION_STUDIO_MODEL_QUALIFICATION_ROUTE_SCHEMA_VERSION,
    workloadScope: MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
    routePolicyVersion: MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
    policyDigest: MOTION_STUDIO_STORYTELLING_REASONING_POLICY.policyDigest,
    ...identity,
    ...input,
    immutable: true as const,
  }
  return deepFreeze({ ...base, snapshotDigest: sha256CanonicalJson(base) })
}

const scoreSchema = z.object({
  dimension: z.enum(MOTION_STUDIO_MODEL_QUALIFICATION_DIMENSIONS),
  scoreBasisPoints: basisPoints,
  reviewerEvidenceDigest: digest,
}).strict()

const gateSchema = z.object({
  gate: z.enum(MOTION_STUDIO_MODEL_QUALIFICATION_GATES),
  result: z.enum(['passed', 'failed']),
  evidenceDigest: digest,
}).strict()

const costEvidenceSchema = z.object({
  classification: z.enum(['synthetic_contract_cost', 'canonical_attempt_cost']),
  evidenceDigest: digest,
  rateCardVersion: stableId.nullable(),
  internalCostMicros: safeInteger,
  maximumAuthorizedInternalCostMicros: safeInteger,
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
}).strict()

export const motionStudioModelQualificationAttemptInputV1Schema = z.object({
  caseId: stableId,
  trialOrdinal: z.number().int().min(1).max(100),
  modelSlot: z.enum(MOTION_STUDIO_MODEL_QUALIFICATION_SLOTS),
  routeSnapshotDigest: digest,
  fixturePayloadDigest: digest,
  attemptId: stableId,
  producerSessionId: stableId,
  reviewerSessionId: stableId,
  reviewerKind: z.enum(['independent_model', 'human', 'independent_model_plus_deterministic']),
  independentReviewPassed: z.boolean(),
  outputArtifactDigest: digest,
  independentReviewDigest: digest,
  scores: z.array(scoreSchema).min(1).max(MOTION_STUDIO_MODEL_QUALIFICATION_DIMENSIONS.length),
  gateResults: z.array(gateSchema).min(1).max(MOTION_STUDIO_MODEL_QUALIFICATION_GATES.length),
  selectedSkillIds: z.array(stableId).max(24),
  loadedToolIds: z.array(stableId).max(24),
  fullToolCatalogLoaded: z.boolean(),
  unauthorizedToolCallCount: safeInteger,
  duplicateToolSideEffectCount: safeInteger,
  strictOutput: z.object({
    firstPassValid: z.boolean(),
    repairAttempted: z.boolean(),
    finalValid: z.boolean(),
  }).strict(),
  cacheEvidence: z.object({
    providerReportedCache: z.boolean(),
    cacheHitInputUnits: safeInteger,
    usageReconciled: z.boolean(),
  }).strict(),
  recovery: z.object({
    scenario: z.enum(['none', 'rate_limit', 'interruption', 'provider_capacity']),
    outcome: z.enum(['not_exercised', 'passed', 'failed']),
    duplicateSideEffectPrevented: z.boolean(),
  }).strict(),
  terminalOutcome: z.enum(['completed', 'failed']),
  acceptedArtifact: z.boolean(),
  failureCategory: z.string().trim().min(1).max(240).nullable(),
  latencyMilliseconds: safeInteger,
  costEvidence: costEvidenceSchema,
  recordedAt: isoDate,
}).strict()

export type MotionStudioModelQualificationAttemptInputV1 = z.infer<
  typeof motionStudioModelQualificationAttemptInputV1Schema
>

export interface MotionStudioModelQualificationAttemptEvidenceV1 extends
MotionStudioModelQualificationAttemptInputV1 {
  schemaVersion: typeof MOTION_STUDIO_MODEL_QUALIFICATION_ATTEMPT_SCHEMA_VERSION
  catalogVersion: typeof MOTION_STUDIO_MODEL_QUALIFICATION_CATALOG_VERSION
  fixtureContractDigest: string
  attemptEvidenceDigest: string
  immutable: true
}

export function createMotionStudioModelQualificationAttemptEvidence(
  inputValue: MotionStudioModelQualificationAttemptInputV1,
): MotionStudioModelQualificationAttemptEvidenceV1 {
  const input = motionStudioModelQualificationAttemptInputV1Schema.parse(inputValue)
  const fixture = qualificationFixture(input.caseId)
  assertUnique(input.scores.map((entry) => entry.dimension), 'qualification score dimension')
  assertUnique(input.gateResults.map((entry) => entry.gate), 'qualification gate')
  assertUnique(input.selectedSkillIds, 'selected qualification skill')
  assertUnique(input.loadedToolIds, 'loaded qualification tool')
  assertExactMembers(
    input.scores.map((entry) => entry.dimension),
    fixture.scoredDimensions,
    `Qualification scores for ${fixture.caseId}`,
  )
  assertExactMembers(
    input.gateResults.map((entry) => entry.gate),
    fixture.requiredGates,
    `Qualification gates for ${fixture.caseId}`,
  )
  if (input.acceptedArtifact && input.terminalOutcome !== 'completed') {
    invalid('A failed qualification attempt cannot produce an accepted artifact.')
  }
  if (input.acceptedArtifact && !input.strictOutput.finalValid) {
    invalid('An accepted qualification artifact must have final strict-schema validity.')
  }
  if (input.acceptedArtifact && !input.independentReviewPassed) {
    invalid('An accepted qualification artifact requires a passed independent review.')
  }
  if (input.acceptedArtifact && input.failureCategory !== null) {
    invalid('An accepted qualification artifact cannot retain a failure category.')
  }
  if (!input.acceptedArtifact && !input.failureCategory) {
    invalid('A rejected or failed qualification attempt must retain a failure category.')
  }
  if (input.producerSessionId === input.reviewerSessionId && input.independentReviewPassed) {
    invalid('A qualification producer cannot pass its own independent review.')
  }
  if (input.costEvidence.internalCostMicros >
      input.costEvidence.maximumAuthorizedInternalCostMicros) {
    blocked('Qualification attempt internal cost exceeds its exact maximum authority.')
  }
  if (!input.strictOutput.firstPassValid && !input.strictOutput.repairAttempted &&
      input.strictOutput.finalValid) {
    invalid('A repaired valid output must record that a repair was attempted.')
  }
  if (input.recovery.scenario === 'none' && input.recovery.outcome !== 'not_exercised') {
    invalid('A qualification attempt without a recovery scenario cannot report a recovery result.')
  }
  if (input.recovery.scenario !== 'none' && input.recovery.outcome === 'not_exercised') {
    invalid('A qualification recovery scenario must retain a passed or failed outcome.')
  }
  const base = {
    schemaVersion: MOTION_STUDIO_MODEL_QUALIFICATION_ATTEMPT_SCHEMA_VERSION,
    catalogVersion: MOTION_STUDIO_MODEL_QUALIFICATION_CATALOG_VERSION,
    fixtureContractDigest: fixture.fixtureContractDigest,
    ...input,
    immutable: true as const,
  }
  return deepFreeze({ ...base, attemptEvidenceDigest: sha256CanonicalJson(base) })
}

export interface MotionStudioModelQualificationFixtureBindingV1 {
  caseId: string
  fixtureContractDigest: string
  fixturePayloadDigest: string
  sourceEvidenceDigest: string
}

export interface MotionStudioModelQualificationRunInputV1 {
  runId: string
  evidenceClassification: 'synthetic_contract_fixture' | 'private_provider_qualification_run'
  catalogVersion: typeof MOTION_STUDIO_MODEL_QUALIFICATION_CATALOG_VERSION
  catalogDigest: string
  thresholdVersion: typeof MOTION_STUDIO_MODEL_QUALIFICATION_THRESHOLD_VERSION
  thresholdDigest: string
  routePolicyVersion: typeof MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION
  policyDigest: string
  fixtureBindings: readonly MotionStudioModelQualificationFixtureBindingV1[]
  routeSnapshots: readonly MotionStudioModelQualificationRouteSnapshotV1[]
  attempts: readonly MotionStudioModelQualificationAttemptEvidenceV1[]
  capturedAt: string
}

export interface MotionStudioModelQualificationDimensionComparisonV1 {
  dimension: MotionStudioModelQualificationDimension
  candidateMeanBasisPoints: number | null
  referenceMeanBasisPoints: number | null
  candidateMinusReferenceBasisPoints: number | null
  candidateSampleCount: number
  referenceSampleCount: number
  critical: boolean
  passed: boolean
}

export interface MotionStudioModelQualificationReportV1 {
  schemaVersion: typeof MOTION_STUDIO_MODEL_QUALIFICATION_REPORT_SCHEMA_VERSION
  runId: string
  evidenceClassification: MotionStudioModelQualificationRunInputV1['evidenceClassification']
  catalogVersion: typeof MOTION_STUDIO_MODEL_QUALIFICATION_CATALOG_VERSION
  catalogDigest: string
  thresholdVersion: typeof MOTION_STUDIO_MODEL_QUALIFICATION_THRESHOLD_VERSION
  thresholdDigest: string
  routePolicyVersion: typeof MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION
  policyDigest: string
  fixtureBindingDigest: string
  routeSnapshotDigests: readonly string[]
  attemptEvidenceDigests: readonly string[]
  runInputDigest: string
  metrics: {
    fixtureCount: number
    candidateAttemptCount: number
    referenceAttemptCount: number
    candidateAcceptedArtifactRateBasisPoints: number
    referenceAcceptedArtifactRateBasisPoints: number
    candidateFirstPassStructuredOutputRateBasisPoints: number
    referenceFirstPassStructuredOutputRateBasisPoints: number
    candidateFinalStructuredOutputRateBasisPoints: number
    referenceFinalStructuredOutputRateBasisPoints: number
    candidateSkillToolRoutingRateBasisPoints: number
    referenceSkillToolRoutingRateBasisPoints: number
    candidateGatePassRateBasisPoints: number
    referenceGatePassRateBasisPoints: number
    candidateRecoveryPassRateBasisPoints: number
    referenceRecoveryPassRateBasisPoints: number
    candidateP95LatencyMilliseconds: number | null
    referenceP95LatencyMilliseconds: number | null
    candidateToReferenceP95LatencyRatioBasisPoints: number | null
    candidateTotalInternalCostMicros: number
    referenceTotalInternalCostMicros: number
    candidateCostPerAcceptedArtifactMicros: number | null
    referenceCostPerAcceptedArtifactMicros: number | null
    candidateToReferenceCostRatioBasisPoints: number | null
    dimensionComparisons: readonly MotionStudioModelQualificationDimensionComparisonV1[]
  }
  referenceEvidenceIssues: readonly string[]
  candidateThresholdFailures: readonly string[]
  thresholdVerdict: 'passed' | 'failed' | 'insufficient_evidence'
  eligibleForIndependentAcceptanceReview: boolean
  runtimeActivationBlockers: readonly string[]
  productionDefaultAuthorized: false
  providerCallMade: false
  credentialReadMade: false
  toolExecutionMade: false
  customerChargeCreated: false
  reportDigest: string
  immutable: true
}

export function evaluateMotionStudioStorytellingModelQualification(
  input: MotionStudioModelQualificationRunInputV1,
): MotionStudioModelQualificationReportV1 {
  assertMotionStudioModelQualificationCatalog()
  assertMotionStudioModelQualificationThresholds()
  assertStableId(input.runId, 'Qualification run ID')
  isoDate.parse(input.capturedAt)
  if (input.catalogVersion !== MOTION_STUDIO_MODEL_QUALIFICATION_CATALOG_VERSION ||
      input.catalogDigest !== MOTION_STUDIO_STORYTELLING_MODEL_QUALIFICATION_CATALOG.catalogDigest) {
    invalid('Qualification run does not bind the exact frozen golden catalog.')
  }
  if (input.thresholdVersion !== MOTION_STUDIO_MODEL_QUALIFICATION_THRESHOLD_VERSION ||
      input.thresholdDigest !== MOTION_STUDIO_STORYTELLING_MODEL_QUALIFICATION_THRESHOLDS.thresholdDigest) {
    invalid('Qualification run does not bind the exact frozen thresholds.')
  }
  if (input.routePolicyVersion !== MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION ||
      input.policyDigest !== MOTION_STUDIO_STORYTELLING_REASONING_POLICY.policyDigest) {
    invalid('Qualification run does not bind the exact Storytelling workload policy.')
  }

  const bindings = validateFixtureBindings(input.fixtureBindings)
  const routes = validateRouteSnapshots(input.routeSnapshots, input.evidenceClassification)
  validateAttempts(input.attempts, bindings, routes)

  const candidate = input.attempts.filter((attempt) =>
    attempt.modelSlot === 'policy_primary_candidate')
  const reference = input.attempts.filter((attempt) =>
    attempt.modelSlot === 'approved_fallback_reference')
  const referenceEvidenceIssues: string[] = []
  const candidateThresholdFailures: string[] = []
  const thresholds = MOTION_STUDIO_STORYTELLING_MODEL_QUALIFICATION_THRESHOLDS

  validateTrialCoverage(candidate, reference, referenceEvidenceIssues)
  const dimensionComparisons = compareDimensions(candidate, reference)
  const candidateOverallQuality = mean(candidate.flatMap((attempt) =>
    attempt.scores.map((score) => score.scoreBasisPoints)))
  const referenceOverallQuality = mean(reference.flatMap((attempt) =>
    attempt.scores.map((score) => score.scoreBasisPoints)))
  if (referenceOverallQuality === null ||
      referenceOverallQuality < thresholds.minimumOverallQualityBasisPoints) {
    referenceEvidenceIssues.push('reference_overall_quality_below_frozen_minimum')
  }
  if (candidateOverallQuality === null ||
      candidateOverallQuality < thresholds.minimumOverallQualityBasisPoints) {
    candidateThresholdFailures.push('candidate_overall_quality_below_frozen_minimum')
  }
  if (candidateOverallQuality !== null && referenceOverallQuality !== null &&
      candidateOverallQuality + thresholds.maximumOverallNonInferiorityDeficitBasisPoints <
      referenceOverallQuality) {
    candidateThresholdFailures.push('candidate_overall_quality_is_inferior')
  }
  for (const comparison of dimensionComparisons) {
    if (!comparison.passed) {
      candidateThresholdFailures.push(`candidate_dimension_failed:${comparison.dimension}`)
    }
  }

  const candidateAcceptedRate = rate(candidate.filter((attempt) => attempt.acceptedArtifact).length,
    candidate.length)
  const referenceAcceptedRate = rate(reference.filter((attempt) => attempt.acceptedArtifact).length,
    reference.length)
  if (referenceAcceptedRate < thresholds.minimumAcceptedArtifactRateBasisPoints) {
    referenceEvidenceIssues.push('reference_accepted_artifact_rate_below_frozen_minimum')
  }
  if (candidateAcceptedRate < thresholds.minimumAcceptedArtifactRateBasisPoints) {
    candidateThresholdFailures.push('candidate_accepted_artifact_rate_below_frozen_minimum')
  }
  if (candidateAcceptedRate + thresholds.maximumAcceptedRateDeficitBasisPoints <
      referenceAcceptedRate) {
    candidateThresholdFailures.push('candidate_accepted_artifact_rate_is_inferior')
  }

  const candidateFirstPassRate = booleanRate(candidate, (attempt) =>
    attempt.strictOutput.firstPassValid)
  const referenceFirstPassRate = booleanRate(reference, (attempt) =>
    attempt.strictOutput.firstPassValid)
  const candidateFinalRate = booleanRate(candidate, (attempt) =>
    attempt.strictOutput.finalValid)
  const referenceFinalRate = booleanRate(reference, (attempt) =>
    attempt.strictOutput.finalValid)
  validateReferenceRate(referenceFirstPassRate,
    thresholds.minimumFirstPassStructuredOutputRateBasisPoints,
    'reference_first_pass_structured_output_below_frozen_minimum', referenceEvidenceIssues)
  validateReferenceRate(referenceFinalRate,
    thresholds.requiredFinalStructuredOutputRateBasisPoints,
    'reference_final_structured_output_not_perfect', referenceEvidenceIssues)
  validateCandidateRate(candidateFirstPassRate,
    thresholds.minimumFirstPassStructuredOutputRateBasisPoints,
    'candidate_first_pass_structured_output_below_frozen_minimum', candidateThresholdFailures)
  validateCandidateRate(candidateFinalRate,
    thresholds.requiredFinalStructuredOutputRateBasisPoints,
    'candidate_final_structured_output_not_perfect', candidateThresholdFailures)

  const candidateRoutingRate = booleanRate(candidate, routingPassed)
  const referenceRoutingRate = booleanRate(reference, routingPassed)
  validateReferenceRate(referenceRoutingRate, thresholds.requiredSkillToolRoutingRateBasisPoints,
    'reference_skill_tool_routing_not_perfect', referenceEvidenceIssues)
  validateCandidateRate(candidateRoutingRate, thresholds.requiredSkillToolRoutingRateBasisPoints,
    'candidate_skill_tool_routing_not_perfect', candidateThresholdFailures)

  const candidateGateRate = gatePassRate(candidate)
  const referenceGateRate = gatePassRate(reference)
  validateReferenceRate(referenceGateRate, thresholds.requiredGatePassRateBasisPoints,
    'reference_blocking_gate_failure', referenceEvidenceIssues)
  validateCandidateRate(candidateGateRate, thresholds.requiredGatePassRateBasisPoints,
    'candidate_blocking_gate_failure', candidateThresholdFailures)

  const candidateRecoveryRate = recoveryPassRate(candidate)
  const referenceRecoveryRate = recoveryPassRate(reference)
  validateReferenceRate(referenceRecoveryRate, thresholds.requiredRecoveryPassRateBasisPoints,
    'reference_recovery_scenario_failure', referenceEvidenceIssues)
  validateCandidateRate(candidateRecoveryRate, thresholds.requiredRecoveryPassRateBasisPoints,
    'candidate_recovery_scenario_failure', candidateThresholdFailures)

  const candidateP95 = percentile95(candidate.map((attempt) => attempt.latencyMilliseconds))
  const referenceP95 = percentile95(reference.map((attempt) => attempt.latencyMilliseconds))
  const latencyRatio = nullableRate(candidateP95, referenceP95)
  if (referenceP95 === null || referenceP95 === 0) {
    referenceEvidenceIssues.push('reference_latency_evidence_missing')
  }
  if (candidateP95 === null ||
      candidateP95 > thresholds.maximumCandidateP95LatencyMilliseconds) {
    candidateThresholdFailures.push('candidate_p95_latency_exceeds_frozen_maximum')
  }
  if (latencyRatio === null ||
      latencyRatio > thresholds.maximumCandidateToReferenceP95LatencyRatioBasisPoints) {
    candidateThresholdFailures.push('candidate_p95_latency_ratio_exceeds_frozen_maximum')
  }

  const candidateTotalCost = safeSum(candidate.map((attempt) =>
    attempt.costEvidence.internalCostMicros), 'Candidate qualification internal cost')
  const referenceTotalCost = safeSum(reference.map((attempt) =>
    attempt.costEvidence.internalCostMicros), 'Reference qualification internal cost')
  const candidateAcceptedCount = candidate.filter((attempt) => attempt.acceptedArtifact).length
  const referenceAcceptedCount = reference.filter((attempt) => attempt.acceptedArtifact).length
  const candidateCostPerAccepted = costPerAccepted(candidateTotalCost, candidateAcceptedCount)
  const referenceCostPerAccepted = costPerAccepted(referenceTotalCost, referenceAcceptedCount)
  const costRatio = nullableRate(candidateCostPerAccepted, referenceCostPerAccepted)
  if (referenceCostPerAccepted === null || referenceCostPerAccepted === 0) {
    referenceEvidenceIssues.push('reference_cost_per_accepted_artifact_missing')
  }
  if (candidateCostPerAccepted === null) {
    candidateThresholdFailures.push('candidate_cost_per_accepted_artifact_missing')
  }
  if (costRatio === null ||
      costRatio > thresholds.maximumCandidateToReferenceAcceptedArtifactCostRatioBasisPoints) {
    candidateThresholdFailures.push('candidate_cost_per_accepted_artifact_not_lower_enough')
  }

  assertUnique(referenceEvidenceIssues, 'reference evidence issue')
  assertUnique(candidateThresholdFailures, 'candidate threshold failure')
  const thresholdVerdict = referenceEvidenceIssues.length > 0
    ? 'insufficient_evidence' as const
    : candidateThresholdFailures.length > 0
      ? 'failed' as const
      : 'passed' as const
  const runtimeActivationBlockers = qualificationRuntimeBlockers(input, routes, thresholdVerdict)
  const eligibleForIndependentAcceptanceReview =
    thresholdVerdict === 'passed' && runtimeActivationBlockers.length === 0

  const base = {
    schemaVersion: MOTION_STUDIO_MODEL_QUALIFICATION_REPORT_SCHEMA_VERSION,
    runId: input.runId,
    evidenceClassification: input.evidenceClassification,
    catalogVersion: input.catalogVersion,
    catalogDigest: input.catalogDigest,
    thresholdVersion: input.thresholdVersion,
    thresholdDigest: input.thresholdDigest,
    routePolicyVersion: input.routePolicyVersion,
    policyDigest: input.policyDigest,
    fixtureBindingDigest: sha256CanonicalJson(input.fixtureBindings),
    routeSnapshotDigests: input.routeSnapshots.map((snapshot) => snapshot.snapshotDigest),
    attemptEvidenceDigests: input.attempts.map((attempt) => attempt.attemptEvidenceDigest),
    runInputDigest: sha256CanonicalJson({
      runId: input.runId,
      evidenceClassification: input.evidenceClassification,
      catalogVersion: input.catalogVersion,
      catalogDigest: input.catalogDigest,
      thresholdVersion: input.thresholdVersion,
      thresholdDigest: input.thresholdDigest,
      routePolicyVersion: input.routePolicyVersion,
      policyDigest: input.policyDigest,
      fixtureBindings: input.fixtureBindings,
      routeSnapshotDigests: input.routeSnapshots.map((snapshot) => snapshot.snapshotDigest),
      attemptEvidenceDigests: input.attempts.map((attempt) => attempt.attemptEvidenceDigest),
      capturedAt: input.capturedAt,
    }),
    metrics: {
      fixtureCount: bindings.size,
      candidateAttemptCount: candidate.length,
      referenceAttemptCount: reference.length,
      candidateAcceptedArtifactRateBasisPoints: candidateAcceptedRate,
      referenceAcceptedArtifactRateBasisPoints: referenceAcceptedRate,
      candidateFirstPassStructuredOutputRateBasisPoints: candidateFirstPassRate,
      referenceFirstPassStructuredOutputRateBasisPoints: referenceFirstPassRate,
      candidateFinalStructuredOutputRateBasisPoints: candidateFinalRate,
      referenceFinalStructuredOutputRateBasisPoints: referenceFinalRate,
      candidateSkillToolRoutingRateBasisPoints: candidateRoutingRate,
      referenceSkillToolRoutingRateBasisPoints: referenceRoutingRate,
      candidateGatePassRateBasisPoints: candidateGateRate,
      referenceGatePassRateBasisPoints: referenceGateRate,
      candidateRecoveryPassRateBasisPoints: candidateRecoveryRate,
      referenceRecoveryPassRateBasisPoints: referenceRecoveryRate,
      candidateP95LatencyMilliseconds: candidateP95,
      referenceP95LatencyMilliseconds: referenceP95,
      candidateToReferenceP95LatencyRatioBasisPoints: latencyRatio,
      candidateTotalInternalCostMicros: candidateTotalCost,
      referenceTotalInternalCostMicros: referenceTotalCost,
      candidateCostPerAcceptedArtifactMicros: candidateCostPerAccepted,
      referenceCostPerAcceptedArtifactMicros: referenceCostPerAccepted,
      candidateToReferenceCostRatioBasisPoints: costRatio,
      dimensionComparisons,
    },
    referenceEvidenceIssues: uniqueSorted(referenceEvidenceIssues),
    candidateThresholdFailures: uniqueSorted(candidateThresholdFailures),
    thresholdVerdict,
    eligibleForIndependentAcceptanceReview,
    runtimeActivationBlockers,
    productionDefaultAuthorized: false as const,
    providerCallMade: false as const,
    credentialReadMade: false as const,
    toolExecutionMade: false as const,
    customerChargeCreated: false as const,
    immutable: true as const,
  }
  return deepFreeze({ ...base, reportDigest: sha256CanonicalJson(base) })
}

export function assertMotionStudioModelQualificationCatalog(): void {
  const catalog = MOTION_STUDIO_STORYTELLING_MODEL_QUALIFICATION_CATALOG
  const fixtureIds = catalog.fixtures.map((fixture) => fixture.caseId)
  assertUnique(fixtureIds, 'golden qualification case')
  assertExactMembers(
    uniqueSorted(catalog.fixtures.flatMap((fixture) => fixture.reasoningRoleIds)),
    MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS,
    'Golden qualification reasoning-role coverage',
  )
  assertExactMembers(
    uniqueSorted(catalog.fixtures.flatMap((fixture) =>
      fixture.productionMode ? [fixture.productionMode] : [])),
    MOTION_STUDIO_MODEL_QUALIFICATION_PRODUCTION_MODES,
    'Golden qualification production-mode coverage',
  )
  assertExactMembers(
    uniqueSorted(catalog.fixtures.flatMap((fixture) => fixture.scoredDimensions)),
    MOTION_STUDIO_MODEL_QUALIFICATION_DIMENSIONS,
    'Golden qualification score-dimension coverage',
  )
  assertExactMembers(
    uniqueSorted(catalog.fixtures.flatMap((fixture) => fixture.requiredGates)),
    MOTION_STUDIO_MODEL_QUALIFICATION_GATES,
    'Golden qualification blocking-gate coverage',
  )
  const knownSkills = new Set(buildMotionStudioSkillTaxonomy().map((skill) => skill.id))
  const knownTools = new Set<string>(motionStudioToolMappingIds())
  for (const fixture of catalog.fixtures) {
    const base = { ...fixture } as Record<string, unknown>
    delete base.fixtureContractDigest
    if (sha256CanonicalJson(base) !== fixture.fixtureContractDigest) {
      blocked(`Qualification fixture ${fixture.caseId} failed immutable digest verification.`)
    }
    if (!fixture.reasoningRoleIds.every((role) =>
      MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS.includes(role))) {
      blocked(`Qualification fixture ${fixture.caseId} uses an unknown Storytelling reasoning role.`)
    }
    if (!fixture.expectedSkillIds.every((skillId) => knownSkills.has(skillId))) {
      blocked(`Qualification fixture ${fixture.caseId} uses a skill outside the canonical taxonomy.`)
    }
    if (!fixture.expectedToolIds.every((toolId) => knownTools.has(toolId))) {
      blocked(`Qualification fixture ${fixture.caseId} uses a tool outside the canonical registry mapping.`)
    }
    if (fixture.expectedToolIds.length > 24 || fixture.expectedSkillIds.length > 24) {
      blocked(`Qualification fixture ${fixture.caseId} exceeds bounded dynamic routing limits.`)
    }
  }
  const base = { ...catalog } as Record<string, unknown>
  delete base.catalogDigest
  if (sha256CanonicalJson(base) !== catalog.catalogDigest) {
    blocked('Storytelling model qualification catalog failed immutable digest verification.')
  }
}

export function assertMotionStudioModelQualificationThresholds(): void {
  const thresholds = MOTION_STUDIO_STORYTELLING_MODEL_QUALIFICATION_THRESHOLDS
  const base = { ...thresholds } as Record<string, unknown>
  delete base.thresholdDigest
  if (sha256CanonicalJson(base) !== thresholds.thresholdDigest) {
    blocked('Storytelling model qualification thresholds failed immutable digest verification.')
  }
  if (thresholds.maximumCandidateToReferenceAcceptedArtifactCostRatioBasisPoints >= 10_000) {
    blocked('Kimi qualification must require a genuinely lower cost per accepted artifact.')
  }
  if (thresholds.requiredFinalStructuredOutputRateBasisPoints !== 10_000 ||
      thresholds.requiredSkillToolRoutingRateBasisPoints !== 10_000 ||
      thresholds.requiredGatePassRateBasisPoints !== 10_000) {
    blocked('Critical qualification gates must remain fail closed at one hundred percent.')
  }
}

export function assertMotionStudioModelQualificationReport(
  report: MotionStudioModelQualificationReportV1,
): void {
  const base = { ...report } as Record<string, unknown>
  delete base.reportDigest
  if (report.schemaVersion !== MOTION_STUDIO_MODEL_QUALIFICATION_REPORT_SCHEMA_VERSION ||
      report.productionDefaultAuthorized !== false || report.providerCallMade !== false ||
      report.credentialReadMade !== false || report.toolExecutionMade !== false ||
      report.customerChargeCreated !== false ||
      sha256CanonicalJson(base) !== report.reportDigest) {
    blocked('Storytelling model qualification report failed immutable readback verification.')
  }
}

export function assertMotionStudioModelQualificationAttemptEvidence(
  attempt: MotionStudioModelQualificationAttemptEvidenceV1,
): void {
  const base = { ...attempt } as Record<string, unknown>
  delete base.attemptEvidenceDigest
  if (attempt.schemaVersion !== MOTION_STUDIO_MODEL_QUALIFICATION_ATTEMPT_SCHEMA_VERSION ||
      attempt.catalogVersion !== MOTION_STUDIO_MODEL_QUALIFICATION_CATALOG_VERSION ||
      sha256CanonicalJson(base) !== attempt.attemptEvidenceDigest) {
    blocked(`Qualification attempt ${attempt.attemptId} failed immutable evidence verification.`)
  }
  if (attempt.fixtureContractDigest !== qualificationFixture(attempt.caseId).fixtureContractDigest) {
    blocked(`Qualification attempt ${attempt.attemptId} lost its exact fixture contract.`)
  }
  const recreated = createMotionStudioModelQualificationAttemptEvidence(
    stripAttemptEnvelope(attempt),
  )
  if (recreated.attemptEvidenceDigest !== attempt.attemptEvidenceDigest) {
    blocked(`Qualification attempt ${attempt.attemptId} failed semantic reconstruction.`)
  }
}

export function assertMotionStudioModelQualificationRouteSnapshot(
  snapshot: MotionStudioModelQualificationRouteSnapshotV1,
): void {
  const base = { ...snapshot } as Record<string, unknown>
  delete base.snapshotDigest
  if (snapshot.schemaVersion !== MOTION_STUDIO_MODEL_QUALIFICATION_ROUTE_SCHEMA_VERSION ||
      snapshot.routePolicyVersion !== MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION ||
      snapshot.policyDigest !== MOTION_STUDIO_STORYTELLING_REASONING_POLICY.policyDigest ||
      sha256CanonicalJson(base) !== snapshot.snapshotDigest) {
    blocked('Qualification route snapshot failed immutable evidence verification.')
  }
  const expected = snapshot.modelSlot === 'policy_primary_candidate'
    ? ['kimi_k3_primary', 'moonshot', MOTION_STUDIO_STORYTELLING_PRIMARY_MODEL_ID]
    : ['gpt_5_6_sol_fallback', 'openai', MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID]
  if (snapshot.policyRouteId !== expected[0] || snapshot.policyProviderId !== expected[1] ||
      snapshot.exactProviderModelId !== expected[2]) {
    blocked('Qualification route snapshot does not match its frozen workload-policy slot.')
  }
  const recreated = createMotionStudioModelQualificationRouteSnapshot({
    modelSlot: snapshot.modelSlot,
    adapterVersion: snapshot.adapterVersion,
    capabilityEvidenceDigest: snapshot.capabilityEvidenceDigest,
    projectModelDataPolicyDigest: snapshot.projectModelDataPolicyDigest,
    providerAccessEvidenceDigest: snapshot.providerAccessEvidenceDigest,
    retentionPolicyEvidenceDigest: snapshot.retentionPolicyEvidenceDigest,
    canonicalRateCardVersion: snapshot.canonicalRateCardVersion,
    canonicalAdapterRegistered: snapshot.canonicalAdapterRegistered,
    evidenceClassification: snapshot.evidenceClassification,
  })
  if (recreated.snapshotDigest !== snapshot.snapshotDigest) {
    blocked('Qualification route snapshot failed semantic reconstruction.')
  }
}

function fixture(
  caseId: string,
  title: string,
  journey: FixtureDefinition['journey'],
  productionMode: MotionStudioQualificationProductionMode | null,
  highImpact: boolean,
  reasoningRoleIds: MotionStudioStorytellingReasoningRoleId[],
  scoredDimensions: MotionStudioModelQualificationDimension[],
  expectedSkillIds: string[],
  expectedToolIds: string[],
  requiredGates: MotionStudioModelQualificationGate[] = [],
  recoveryScenarioRequired = false,
): FixtureDefinition {
  return {
    caseId,
    title,
    journey,
    productionMode,
    highImpact,
    reasoningRoleIds,
    scoredDimensions,
    expectedSkillIds,
    expectedToolIds,
    requiredGates,
    recoveryScenarioRequired,
  }
}

function qualificationFixture(caseId: string): MotionStudioModelQualificationFixtureV1 {
  const fixture = MOTION_STUDIO_STORYTELLING_MODEL_QUALIFICATION_CATALOG.fixtures
    .find((candidate) => candidate.caseId === caseId)
  if (!fixture) invalid(`Unknown Storytelling model qualification case ${caseId}.`)
  return fixture
}

function validateFixtureBindings(
  bindingsInput: readonly MotionStudioModelQualificationFixtureBindingV1[],
): Map<string, MotionStudioModelQualificationFixtureBindingV1> {
  if (bindingsInput.length !== MOTION_STUDIO_STORYTELLING_MODEL_QUALIFICATION_CATALOG.fixtures.length) {
    invalid('Qualification run must bind every frozen golden case exactly once.')
  }
  const bindings = new Map<string, MotionStudioModelQualificationFixtureBindingV1>()
  for (const binding of bindingsInput) {
    assertStableId(binding.caseId, 'Qualification fixture binding case ID')
    assertDigest(binding.fixtureContractDigest, 'Qualification fixture contract digest')
    assertDigest(binding.fixturePayloadDigest, 'Qualification fixture payload digest')
    assertDigest(binding.sourceEvidenceDigest, 'Qualification fixture source evidence digest')
    if (bindings.has(binding.caseId)) invalid('Qualification fixture bindings contain a duplicate case.')
    const fixture = qualificationFixture(binding.caseId)
    if (binding.fixtureContractDigest !== fixture.fixtureContractDigest) {
      invalid(`Qualification fixture binding ${binding.caseId} does not match the frozen catalog contract.`)
    }
    bindings.set(binding.caseId, { ...binding })
  }
  return bindings
}

function validateRouteSnapshots(
  snapshots: readonly MotionStudioModelQualificationRouteSnapshotV1[],
  evidenceClassification: MotionStudioModelQualificationRunInputV1['evidenceClassification'],
): Map<MotionStudioModelQualificationSlot, MotionStudioModelQualificationRouteSnapshotV1> {
  if (snapshots.length !== MOTION_STUDIO_MODEL_QUALIFICATION_SLOTS.length) {
    invalid('Qualification run requires exactly one primary-candidate and one fallback-reference route snapshot.')
  }
  const bySlot = new Map<MotionStudioModelQualificationSlot,
  MotionStudioModelQualificationRouteSnapshotV1>()
  for (const snapshot of snapshots) {
    assertMotionStudioModelQualificationRouteSnapshot(snapshot)
    if (snapshot.evidenceClassification !== evidenceClassification) {
      invalid('Qualification route snapshots must share the run evidence classification.')
    }
    if (bySlot.has(snapshot.modelSlot)) invalid('Qualification route snapshots contain a duplicate slot.')
    bySlot.set(snapshot.modelSlot, snapshot)
  }
  for (const slot of MOTION_STUDIO_MODEL_QUALIFICATION_SLOTS) {
    if (!bySlot.has(slot)) invalid(`Qualification route snapshot is missing ${slot}.`)
  }
  return bySlot
}

function validateAttempts(
  attempts: readonly MotionStudioModelQualificationAttemptEvidenceV1[],
  bindings: ReadonlyMap<string, MotionStudioModelQualificationFixtureBindingV1>,
  routes: ReadonlyMap<MotionStudioModelQualificationSlot, MotionStudioModelQualificationRouteSnapshotV1>,
): void {
  if (attempts.length < 1) invalid('Qualification run requires attempt evidence.')
  assertUnique(attempts.map((attempt) => attempt.attemptId), 'qualification attempt ID')
  assertUnique(attempts.map((attempt) =>
    `${attempt.caseId}:${attempt.trialOrdinal}:${attempt.modelSlot}`),
  'qualification case/trial/model slot')
  for (const attempt of attempts) {
    assertMotionStudioModelQualificationAttemptEvidence(attempt)
    const binding = bindings.get(attempt.caseId)
    if (!binding || binding.fixturePayloadDigest !== attempt.fixturePayloadDigest) {
      invalid(`Qualification attempt ${attempt.attemptId} does not bind the exact fixture payload.`)
    }
    if (routes.get(attempt.modelSlot)?.snapshotDigest !== attempt.routeSnapshotDigest) {
      invalid(`Qualification attempt ${attempt.attemptId} does not bind the exact route snapshot.`)
    }
    if (attempt.costEvidence.customerPriceIncluded || attempt.costEvidence.customerCreditsIncluded ||
        attempt.costEvidence.serviceFeeIncluded) {
      blocked('Qualification cost evidence must remain internal production cost only.')
    }
  }
}

function validateTrialCoverage(
  candidate: readonly MotionStudioModelQualificationAttemptEvidenceV1[],
  reference: readonly MotionStudioModelQualificationAttemptEvidenceV1[],
  referenceIssues: string[],
): void {
  const minimum = MOTION_STUDIO_STORYTELLING_MODEL_QUALIFICATION_THRESHOLDS
    .minimumTrialsPerRoutePerCase
  for (const fixture of MOTION_STUDIO_STORYTELLING_MODEL_QUALIFICATION_CATALOG.fixtures) {
    const candidateTrials = candidate.filter((attempt) => attempt.caseId === fixture.caseId)
      .map((attempt) => attempt.trialOrdinal).sort((a, b) => a - b)
    const referenceTrials = reference.filter((attempt) => attempt.caseId === fixture.caseId)
      .map((attempt) => attempt.trialOrdinal).sort((a, b) => a - b)
    if (referenceTrials.length < minimum) {
      referenceIssues.push(`reference_trial_count_below_minimum:${fixture.caseId}`)
    }
    if (candidateTrials.length < minimum) {
      referenceIssues.push(`candidate_trial_count_below_comparable_minimum:${fixture.caseId}`)
    }
    if (sha256CanonicalJson(candidateTrials) !== sha256CanonicalJson(referenceTrials)) {
      referenceIssues.push(`candidate_reference_trial_pairing_mismatch:${fixture.caseId}`)
    }
    const expected = Array.from({ length: referenceTrials.length }, (_, index) => index + 1)
    if (sha256CanonicalJson(referenceTrials) !== sha256CanonicalJson(expected)) {
      referenceIssues.push(`reference_trials_not_contiguous:${fixture.caseId}`)
    }
  }
}

function compareDimensions(
  candidate: readonly MotionStudioModelQualificationAttemptEvidenceV1[],
  reference: readonly MotionStudioModelQualificationAttemptEvidenceV1[],
): MotionStudioModelQualificationDimensionComparisonV1[] {
  const thresholds = MOTION_STUDIO_STORYTELLING_MODEL_QUALIFICATION_THRESHOLDS
  return MOTION_STUDIO_MODEL_QUALIFICATION_DIMENSIONS.map((dimension) => {
    const candidateScores = scoreValues(candidate, dimension)
    const referenceScores = scoreValues(reference, dimension)
    const candidateMean = mean(candidateScores)
    const referenceMean = mean(referenceScores)
    const critical = MOTION_STUDIO_MODEL_QUALIFICATION_CRITICAL_DIMENSIONS.includes(
      dimension as (typeof MOTION_STUDIO_MODEL_QUALIFICATION_CRITICAL_DIMENSIONS)[number],
    )
    const minimum = critical
      ? thresholds.minimumCriticalDimensionBasisPoints
      : thresholds.minimumOverallQualityBasisPoints
    const maximumDeficit = critical
      ? thresholds.maximumCriticalDimensionDeficitBasisPoints
      : thresholds.maximumOverallNonInferiorityDeficitBasisPoints
    const passed = candidateMean !== null && referenceMean !== null &&
      candidateMean >= minimum && candidateMean + maximumDeficit >= referenceMean
    return {
      dimension,
      candidateMeanBasisPoints: candidateMean,
      referenceMeanBasisPoints: referenceMean,
      candidateMinusReferenceBasisPoints: candidateMean === null || referenceMean === null
        ? null
        : candidateMean - referenceMean,
      candidateSampleCount: candidateScores.length,
      referenceSampleCount: referenceScores.length,
      critical,
      passed,
    }
  })
}

function routingPassed(attempt: MotionStudioModelQualificationAttemptEvidenceV1): boolean {
  const fixture = qualificationFixture(attempt.caseId)
  return sameMembers(attempt.selectedSkillIds, fixture.expectedSkillIds) &&
    sameMembers(attempt.loadedToolIds, fixture.expectedToolIds) &&
    !attempt.fullToolCatalogLoaded &&
    attempt.unauthorizedToolCallCount === 0 &&
    attempt.duplicateToolSideEffectCount === 0
}

function gatePassRate(attempts: readonly MotionStudioModelQualificationAttemptEvidenceV1[]): number {
  const results = attempts.flatMap((attempt) => attempt.gateResults.map((gate) => ({
    passed: gate.result === 'passed' && gateSemanticsPassed(attempt, gate.gate),
  })))
  return rate(results.filter((gate) => gate.passed).length, results.length)
}

function recoveryPassRate(attempts: readonly MotionStudioModelQualificationAttemptEvidenceV1[]): number {
  const exercised = attempts.filter((attempt) =>
    qualificationFixture(attempt.caseId).recoveryScenarioRequired)
  return rate(exercised.filter((attempt) =>
    attempt.recovery.outcome === 'passed' && attempt.recovery.duplicateSideEffectPrevented).length,
  exercised.length)
}

function gateSemanticsPassed(
  attempt: MotionStudioModelQualificationAttemptEvidenceV1,
  gate: MotionStudioModelQualificationGate,
): boolean {
  if (gate === 'strict_output_final_valid') return attempt.strictOutput.finalValid
  if (gate === 'dynamic_skill_tool_routing') return routingPassed(attempt)
  if (gate === 'side_effect_replay_safety') {
    return attempt.duplicateToolSideEffectCount === 0 &&
      attempt.recovery.duplicateSideEffectPrevented
  }
  if (gate === 'cost_maximum_authority') {
    return attempt.costEvidence.internalCostMicros <=
      attempt.costEvidence.maximumAuthorizedInternalCostMicros
  }
  if (gate === 'cache_usage_reconciliation') return attempt.cacheEvidence.usageReconciled
  if (gate === 'interruption_outage_recovery') {
    return attempt.recovery.scenario !== 'none' && attempt.recovery.outcome === 'passed' &&
      attempt.recovery.duplicateSideEffectPrevented
  }
  if (gate === 'independent_review') {
    return attempt.independentReviewPassed &&
      attempt.producerSessionId !== attempt.reviewerSessionId
  }
  return true
}

function qualificationRuntimeBlockers(
  input: MotionStudioModelQualificationRunInputV1,
  routes: ReadonlyMap<MotionStudioModelQualificationSlot, MotionStudioModelQualificationRouteSnapshotV1>,
  verdict: MotionStudioModelQualificationReportV1['thresholdVerdict'],
): string[] {
  const blockers: string[] = []
  const boundary = MOTION_STUDIO_STORYTELLING_REASONING_POLICY.currentBoundary
  if (verdict !== 'passed') blockers.push(`qualification_threshold_verdict:${verdict}`)
  if (input.evidenceClassification !== 'private_provider_qualification_run') {
    blockers.push('synthetic_contract_evidence_is_not_model_qualification_evidence')
  }
  if (!boundary.providerTransportImplemented) blockers.push('kimi_provider_transport_not_accepted')
  if (!boundary.gptCanonicalRouteRegistered) blockers.push('gpt_fallback_canonical_route_not_registered')
  if (!boundary.gptCanonicalRateCardRegistered) blockers.push('gpt_fallback_canonical_rate_card_not_registered')
  for (const slot of MOTION_STUDIO_MODEL_QUALIFICATION_SLOTS) {
    const route = routes.get(slot)
    if (!route?.canonicalAdapterRegistered) blockers.push(`canonical_adapter_not_registered:${slot}`)
    if (!route?.canonicalRateCardVersion) blockers.push(`canonical_rate_card_missing:${slot}`)
  }
  if (input.attempts.some((attempt) =>
    attempt.costEvidence.classification !== 'canonical_attempt_cost')) {
    blockers.push('canonical_attempt_cost_evidence_incomplete')
  }
  return uniqueSorted(blockers)
}

function stripAttemptEnvelope(
  attempt: MotionStudioModelQualificationAttemptEvidenceV1,
): MotionStudioModelQualificationAttemptInputV1 {
  const value = { ...attempt } as Record<string, unknown>
  delete value.schemaVersion
  delete value.catalogVersion
  delete value.fixtureContractDigest
  delete value.attemptEvidenceDigest
  delete value.immutable
  return value as MotionStudioModelQualificationAttemptInputV1
}

function validateReferenceRate(actual: number, minimum: number, code: string, issues: string[]): void {
  if (actual < minimum) issues.push(code)
}

function validateCandidateRate(actual: number, minimum: number, code: string, failures: string[]): void {
  if (actual < minimum) failures.push(code)
}

function scoreValues(
  attempts: readonly MotionStudioModelQualificationAttemptEvidenceV1[],
  dimension: MotionStudioModelQualificationDimension,
): number[] {
  return attempts.flatMap((attempt) => attempt.scores
    .filter((score) => score.dimension === dimension)
    .map((score) => score.scoreBasisPoints))
}

function booleanRate<T>(items: readonly T[], predicate: (item: T) => boolean): number {
  return rate(items.filter(predicate).length, items.length)
}

function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null
  return Math.floor(safeSum(values, 'Qualification score total') / values.length)
}

function percentile95(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? null
}

function rate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Number((BigInt(numerator) * 10_000n) / BigInt(denominator))
}

function nullableRate(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator === 0) return null
  return Number((BigInt(numerator) * 10_000n) / BigInt(denominator))
}

function costPerAccepted(total: number, acceptedCount: number): number | null {
  if (acceptedCount === 0) return null
  return Number((BigInt(total) + BigInt(acceptedCount) - 1n) / BigInt(acceptedCount))
}

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  return sha256CanonicalJson(uniqueSorted(left)) === sha256CanonicalJson(uniqueSorted(right))
}

function assertExactMembers(left: readonly string[], right: readonly string[], label: string): void {
  if (!sameMembers(left, right)) invalid(`${label} does not match the exact frozen set.`)
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) invalid(`${label} contains duplicates.`)
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort() as T[]
}

function safeSum(values: readonly number[], label: string): number {
  let total = 0n
  for (const value of values) {
    if (!Number.isSafeInteger(value) || value < 0) invalid(`${label} contains an invalid quantity.`)
    total += BigInt(value)
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) invalid(`${label} exceeds safe integer bounds.`)
  return Number(total)
}

function assertStableId(value: string, label: string): void {
  if (!stableId.safeParse(value).success) invalid(`${label} is not a stable identifier.`)
}

function assertDigest(value: string, label: string): void {
  if (!digest.safeParse(value).success) invalid(`${label} must be a lowercase SHA-256 digest.`)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
