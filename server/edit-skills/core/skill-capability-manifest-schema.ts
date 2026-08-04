import { z } from 'zod'

import {
  EDIT_SKILL_KEYS,
  SKILL_MANIFEST_REFERENCE_VERSION,
  SKILL_QUALIFICATION_STATUSES,
} from './edit-skill-ids'

export const skillIdentitySchema = z.string().trim().min(1).max(180)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
export const skillSha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)
export const skillSemverSchema = z.string()
  .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u)

export const skillManifestReferenceSchema = z.object({
  schemaVersion: z.literal(SKILL_MANIFEST_REFERENCE_VERSION),
  skillKey: z.enum(EDIT_SKILL_KEYS),
  skillVersion: skillSemverSchema,
  contractVersion: skillIdentitySchema,
  manifestHash: skillSha256Schema,
}).strict()

const inputRequirementSchema = z.object({
  key: skillIdentitySchema,
  artifactType: skillIdentitySchema,
  description: z.string().trim().min(1).max(1_000),
  minimumCount: z.number().int().nonnegative().max(1_000),
  maximumCount: z.number().int().positive().max(1_000),
}).strict().superRefine((value, context) => {
  if (value.maximumCount < value.minimumCount) {
    context.addIssue({ code: 'custom', message: 'Maximum input count must be at least the minimum count.' })
  }
})

const contextRequirementSchema = z.object({
  key: skillIdentitySchema,
  required: z.boolean(),
  readScope: z.enum(['assignment_range', 'adjacent_scenes', 'whole_video_read_only']),
  description: z.string().trim().min(1).max(1_000),
}).strict()

const qaReferenceSchema = z.object({
  qaKey: skillIdentitySchema,
  severity: z.enum(['info', 'warning', 'needs_review', 'blocking', 'critical']),
  description: z.string().trim().min(1).max(1_000),
}).strict()

const routeDefinitionSchema = z.object({
  routeKey: skillIdentitySchema,
  routeKind: z.enum(['tool', 'provider', 'source', 'no_action']),
  operationRef: skillIdentitySchema,
  priority: z.number().int().nonnegative().max(10_000),
  requiresApproval: z.boolean(),
  description: z.string().trim().min(1).max(1_000),
}).strict()

const invalidationRuleSchema = z.object({
  ruleKey: skillIdentitySchema,
  trigger: skillIdentitySchema,
  invalidates: z.array(skillIdentitySchema).min(1).max(50),
  requiresNewApproval: z.boolean(),
}).strict()

const revisionRuleSchema = z.object({
  ruleKey: skillIdentitySchema,
  changeClass: z.enum(['non_material', 'material', 'scope_reducing']),
  requiresReestimate: z.boolean(),
  requiresNewApproval: z.boolean(),
  description: z.string().trim().min(1).max(1_000),
}).strict()

const qualificationFixtureSchema = z.object({
  fixtureKey: skillIdentitySchema,
  minimumStatus: z.enum(SKILL_QUALIFICATION_STATUSES),
  description: z.string().trim().min(1).max(1_000),
}).strict()

export const skillCapabilityManifestV1CoreSchema = z.object({
  schemaVersion: z.literal('skill-capability-manifest-v1'),
  skillKey: z.enum(EDIT_SKILL_KEYS),
  skillVersion: skillSemverSchema,
  contractVersion: skillIdentitySchema,
  qualificationStatus: z.enum(SKILL_QUALIFICATION_STATUSES),
  skillClass: skillIdentitySchema,
  coordinationCritical: z.boolean(),
  canOwnPrimaryVisual: z.boolean(),
  canActAsSupport: z.boolean(),
  canOperateAtVideoLevel: z.enum(['none', 'context_read_only']),
  canOperateAtSceneLevel: z.enum(['none', 'bounded_plan_only', 'bounded_plan_and_execution']),
  canOperateAtBoundaryLevel: z.enum(['none', 'coordination_only']),
  supportedJobTypes: z.array(skillIdentitySchema).min(1).max(100),
  unsupportedJobTypes: z.array(skillIdentitySchema).max(100),
  requiredInputs: z.array(inputRequirementSchema).max(100),
  optionalInputs: z.array(inputRequirementSchema).max(100),
  requiredSceneContext: z.array(contextRequirementSchema).min(1).max(100),
  requiredSourceEvidence: z.array(skillIdentitySchema).min(1).max(100),
  visualIntelligenceRequirements: z.array(skillIdentitySchema).max(100),
  trackingRequirements: z.array(skillIdentitySchema).max(100),
  acceptedArtifactTypes: z.array(skillIdentitySchema).min(1).max(200),
  producedArtifactTypes: z.array(skillIdentitySchema).min(1).max(200),
  planningPhase: skillIdentitySchema,
  allowedExecutionPhases: z.array(skillIdentitySchema).min(1).max(100),
  mustRunBefore: z.array(skillIdentitySchema).max(100),
  mustRunAfter: z.array(skillIdentitySchema).max(100),
  conflictsWith: z.array(z.enum(EDIT_SKILL_KEYS)).max(50),
  mayOverlapWith: z.array(z.enum(EDIT_SKILL_KEYS)).max(50),
  ownershipRequirements: z.array(skillIdentitySchema).min(1).max(100),
  timeEstimator: skillIdentitySchema,
  creditEstimator: skillIdentitySchema,
  attemptPolicy: z.object({
    maximumInitialAttempts: z.number().int().positive().max(10),
    maximumRefinements: z.number().int().nonnegative().max(10),
    automaticRetryAllowed: z.boolean(),
    alternateProviderFallbackAllowed: z.boolean(),
    unknownOutcomeRequiresReconciliation: z.boolean(),
  }).strict(),
  toolRoutes: z.array(routeDefinitionSchema).max(100),
  fallbackRoutes: z.array(routeDefinitionSchema).max(100),
  lowerCostRoutes: z.array(routeDefinitionSchema).max(100),
  planningQa: z.array(qaReferenceSchema).min(1).max(100),
  outputQa: z.array(qaReferenceSchema).min(1).max(100),
  integrationQa: z.array(qaReferenceSchema).min(1).max(100),
  invalidationRules: z.array(invalidationRuleSchema).min(1).max(100),
  revisionRules: z.array(revisionRuleSchema).min(1).max(100),
  qualificationFixtures: z.array(qualificationFixtureSchema).min(1).max(200),
  knownLimitations: z.array(z.string().trim().min(1).max(2_000)).min(1).max(100),
}).strict()

const supportedJobCapabilitySchema = z.object({
  jobType: skillIdentitySchema,
  planningAllowed: z.boolean(),
  executionAllowed: z.boolean(),
  allowedPhases: z.array(skillIdentitySchema).min(1).max(100),
  requiredArtifactTypes: z.array(skillIdentitySchema).max(200),
  producedArtifactTypes: z.array(skillIdentitySchema).min(1).max(200),
  primaryVisualOwnershipPossible: z.boolean(),
  runtimeBindingRequired: z.boolean(),
  minimumQualificationStatus: z.enum(SKILL_QUALIFICATION_STATUSES),
}).strict().superRefine((value, context) => {
  if (!value.planningAllowed && !value.executionAllowed) {
    context.addIssue({ code: 'custom', message: 'A supported job must be allowed in planning or execution.' })
  }
  if (value.executionAllowed !== value.runtimeBindingRequired) {
    context.addIssue({ code: 'custom', message: 'Executable supported jobs must require runtime bindings.' })
  }
})

const unsupportedJobCapabilitySchema = z.object({
  jobType: skillIdentitySchema,
  reason: z.string().trim().min(1).max(2_000),
  resolution: z.enum(['reject', 'delegate', 'needs_user_confirmation', 'use_no_action']),
  alternateOwnerSkillKey: z.enum(EDIT_SKILL_KEYS).optional(),
}).strict().superRefine((value, context) => {
  if ((value.resolution === 'delegate') !== Boolean(value.alternateOwnerSkillKey)) {
    context.addIssue({ code: 'custom', message: 'Only delegated unsupported jobs identify an alternate owner.' })
  }
})

const sourceEvidenceRequirementSchema = z.object({
  requirementKey: skillIdentitySchema,
  acceptedArtifactTypes: z.array(skillIdentitySchema).min(1).max(100),
  condition: skillIdentitySchema,
  missingBehavior: z.enum(['block', 'needs_user_confirmation', 'use_no_action']),
}).strict()

const visualIntelligenceRequirementSchema = z.object({
  requirementKey: skillIdentitySchema,
  requiredArtifactType: skillIdentitySchema,
  requiredForPhase: skillIdentitySchema,
  condition: skillIdentitySchema,
  semanticQaRequirement: z.enum(['not_required', 'required_for_generated_or_provider_edited']),
  wholeVideoEvidencePermission: z.enum(['forbidden', 'read_only']),
  productionAcceptanceRequirement: z.enum(['not_required', 'production_qualified_producer']),
  injectedTestOnlyBehavior: z.enum(['not_applicable', 'reject_for_production']),
}).strict()

const trackingRequirementSchema = z.object({
  requirementKey: skillIdentitySchema,
  condition: skillIdentitySchema,
  acceptedArtifactType: skillIdentitySchema,
  ownerSkill: z.enum(EDIT_SKILL_KEYS),
  missingDependencyBehavior: z.enum(['needs_other_skill', 'block']),
  modelSpecificDependencyAllowed: z.literal(false),
  requiredForPhase: skillIdentitySchema,
}).strict()

const phaseCapabilitySchema = z.object({
  phase: skillIdentitySchema,
  condition: skillIdentitySchema,
  blockingBehavior: z.enum(['block', 'defer', 'return_dependency']),
  approvedPlanRequired: z.boolean(),
}).strict()

const phaseDependencyRuleSchema = z.object({
  ruleKey: skillIdentitySchema,
  targetKind: z.enum(['skill', 'phase']),
  target: skillIdentitySchema,
  condition: skillIdentitySchema,
  blockingBehavior: z.enum(['block', 'defer', 'return_dependency']),
}).strict()

const conflictRuleSchema = z.object({
  ruleKey: skillIdentitySchema,
  targetKind: z.enum(['skill', 'assignment', 'preference', 'artifact', 'ownership_window']),
  target: skillIdentitySchema,
  condition: skillIdentitySchema,
  resolution: z.enum(['reject_assignment', 'preserve_existing_owner', 'use_no_action', 'return_dependency']),
  ownershipBehavior: z.enum(['deny_primary_ownership', 'preserve_existing_owner', 'reserve_target_area']),
  blockingBehavior: z.enum(['block', 'needs_user_confirmation', 'return_dependency']),
}).strict()

const overlapRuleSchema = z.object({
  ruleKey: skillIdentitySchema,
  targetSkill: z.enum(EDIT_SKILL_KEYS),
  condition: skillIdentitySchema,
  requiredLayerOrder: skillIdentitySchema,
  visualDensityBehavior: z.enum(['enforce_budget', 'reserve_target_area', 'support_only']),
  ownershipBehavior: z.enum(['b_roll_primary', 'b_roll_support', 'target_primary', 'disjoint_primary_windows']),
}).strict()

const ownershipRuleSchema = z.object({
  ruleKey: skillIdentitySchema,
  condition: skillIdentitySchema,
  requiredBehavior: skillIdentitySchema,
  violationBehavior: z.enum(['block', 'use_no_action', 'return_dependency']),
}).strict()

const routeCapabilitySchema = z.object({
  routeKey: skillIdentitySchema,
  routeKind: z.enum(['tool', 'provider', 'source', 'no_action']),
  supportedJobTypes: z.array(skillIdentitySchema).min(1).max(100),
  operationIds: z.array(skillIdentitySchema).min(1).max(100),
  requiredArtifactTypes: z.array(skillIdentitySchema).max(200),
  minimumQualificationStatus: z.enum(SKILL_QUALIFICATION_STATUSES),
  callerSelectable: z.literal(false),
  automaticRetry: z.literal(false),
  automaticAlternateProviderFallback: z.literal(false),
  priority: z.number().int().nonnegative().max(10_000),
  requiresApproval: z.boolean(),
  description: z.string().trim().min(1).max(1_000),
}).strict()

const knownLimitationSchema = z.object({
  limitationKey: skillIdentitySchema,
  affectedJobTypes: z.array(skillIdentitySchema).max(100),
  reason: z.string().trim().min(1).max(2_000),
  behavior: z.enum(['fail_closed', 'requires_production_qualification', 'delegate', 'bounded_support']),
}).strict()

export const skillCapabilityManifestV2CoreSchema = z.object({
  schemaVersion: z.literal('skill-capability-manifest-v2'),
  skillKey: z.enum(EDIT_SKILL_KEYS),
  skillVersion: skillSemverSchema,
  contractVersion: skillIdentitySchema,
  qualificationStatus: z.enum(SKILL_QUALIFICATION_STATUSES),
  skillClass: skillIdentitySchema,
  coordinationCritical: z.boolean(),
  canOwnPrimaryVisual: z.boolean(),
  canActAsSupport: z.boolean(),
  canOperateAtVideoLevel: z.enum(['none', 'context_read_only']),
  canOperateAtSceneLevel: z.enum(['none', 'bounded_plan_only', 'bounded_plan_and_execution']),
  canOperateAtBoundaryLevel: z.enum(['none', 'coordination_only']),
  supportedJobTypes: z.array(supportedJobCapabilitySchema).min(1).max(100),
  unsupportedJobTypes: z.array(unsupportedJobCapabilitySchema).max(100),
  requiredInputs: z.array(inputRequirementSchema).max(100),
  optionalInputs: z.array(inputRequirementSchema).max(100),
  requiredSceneContext: z.array(contextRequirementSchema).min(1).max(100),
  requiredSourceEvidence: z.array(sourceEvidenceRequirementSchema).min(1).max(100),
  visualIntelligenceRequirements: z.array(visualIntelligenceRequirementSchema).max(100),
  trackingRequirements: z.array(trackingRequirementSchema).max(100),
  acceptedArtifactTypes: z.array(skillIdentitySchema).min(1).max(200),
  producedArtifactTypes: z.array(skillIdentitySchema).min(1).max(200),
  planningPhase: phaseCapabilitySchema,
  allowedExecutionPhases: z.array(phaseCapabilitySchema).min(1).max(100),
  mustRunBefore: z.array(phaseDependencyRuleSchema).max(100),
  mustRunAfter: z.array(phaseDependencyRuleSchema).max(100),
  conflictsWith: z.array(conflictRuleSchema).max(100),
  mayOverlapWith: z.array(overlapRuleSchema).max(100),
  ownershipRequirements: z.array(ownershipRuleSchema).min(1).max(100),
  timeEstimator: skillIdentitySchema,
  creditEstimator: skillIdentitySchema,
  attemptPolicy: z.object({
    maximumInitialAttempts: z.number().int().positive().max(10),
    maximumRefinements: z.number().int().nonnegative().max(10),
    automaticRetryAllowed: z.boolean(),
    alternateProviderFallbackAllowed: z.boolean(),
    unknownOutcomeRequiresReconciliation: z.boolean(),
  }).strict(),
  toolRoutes: z.array(routeCapabilitySchema).max(100),
  fallbackRoutes: z.array(routeCapabilitySchema).max(100),
  lowerCostRoutes: z.array(routeCapabilitySchema).max(100),
  planningQa: z.array(qaReferenceSchema).min(1).max(100),
  outputQa: z.array(qaReferenceSchema).min(1).max(100),
  integrationQa: z.array(qaReferenceSchema).min(1).max(100),
  invalidationRules: z.array(invalidationRuleSchema).min(1).max(100),
  revisionRules: z.array(revisionRuleSchema).min(1).max(100),
  qualificationFixtures: z.array(qualificationFixtureSchema).min(1).max(200),
  knownLimitations: z.array(knownLimitationSchema).min(1).max(100),
}).strict().superRefine((value, context) => {
  const jobTypes = value.supportedJobTypes.map((job) => job.jobType)
  const unsupportedJobTypes = value.unsupportedJobTypes.map((job) => job.jobType)
  const phases = value.allowedExecutionPhases.map((phase) => phase.phase)
  const keyedCollections = [
    value.requiredSourceEvidence.map((rule) => rule.requirementKey),
    value.visualIntelligenceRequirements.map((rule) => rule.requirementKey),
    value.trackingRequirements.map((rule) => rule.requirementKey),
    value.mustRunBefore.map((rule) => rule.ruleKey),
    value.mustRunAfter.map((rule) => rule.ruleKey),
    value.conflictsWith.map((rule) => rule.ruleKey),
    value.mayOverlapWith.map((rule) => rule.ruleKey),
    value.ownershipRequirements.map((rule) => rule.ruleKey),
  ]
  if (
    new Set(jobTypes).size !== jobTypes.length ||
    new Set(unsupportedJobTypes).size !== unsupportedJobTypes.length ||
    jobTypes.some((jobType) => unsupportedJobTypes.includes(jobType)) ||
    new Set(phases).size !== phases.length ||
    keyedCollections.some((keys) => new Set(keys).size !== keys.length)
  ) context.addIssue({ code: 'custom', message: 'Manifest v2 jobs, phases, and rules must be unique and disjoint.' })
  for (const job of value.supportedJobTypes) {
    if (job.allowedPhases.some((phase) => !phases.includes(phase))) {
      context.addIssue({ code: 'custom', message: `Supported job ${job.jobType} references an unknown execution phase.` })
    }
  }
  const routes = [...value.toolRoutes, ...value.fallbackRoutes, ...value.lowerCostRoutes]
  const routeKeys = routes.map((route) => route.routeKey)
  if (new Set(routeKeys).size !== routeKeys.length) {
    context.addIssue({ code: 'custom', message: 'Manifest v2 route keys must be globally unique.' })
  }
  for (const route of routes) {
    if (route.supportedJobTypes.some((jobType) => !jobTypes.includes(jobType))) {
      context.addIssue({ code: 'custom', message: `Route ${route.routeKey} references an unsupported job.` })
    }
  }
})

export const skillCapabilityManifestCoreSchema = z.union([
  skillCapabilityManifestV1CoreSchema,
  skillCapabilityManifestV2CoreSchema,
])

export const skillCapabilityManifestSchema = z.union([
  skillCapabilityManifestV1CoreSchema.extend({ manifestHash: skillSha256Schema }).strict(),
  skillCapabilityManifestV2CoreSchema.extend({ manifestHash: skillSha256Schema }).strict(),
])
