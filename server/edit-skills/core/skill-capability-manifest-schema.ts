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
  routeVersion: skillSemverSchema.optional(),
  routeHash: skillSha256Schema.optional(),
  supportedJobTypes: z.array(skillIdentitySchema).min(1).max(100).optional(),
  requiredInputs: z.array(skillIdentitySchema).max(100).optional(),
  producedArtifactTypes: z.array(skillIdentitySchema).max(200).optional(),
  costClass: z.enum(['zero', 'local', 'provider', 'unavailable']).optional(),
}).strict()

const exactRouteReferenceSchema = z.object({
  routeKey: skillIdentitySchema,
  routeVersion: skillSemverSchema,
  routeHash: skillSha256Schema,
}).strict()

const capabilityEntrySchema = z.object({
  capabilityKey: skillIdentitySchema,
  capabilityVersion: skillSemverSchema,
  displayName: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1_000),
  qualificationStatus: z.enum(SKILL_QUALIFICATION_STATUSES),
  evidenceLevel: z.enum(['declared', 'planning', 'fixture', 'internal_execution', 'production', 'blocked', 'retired']),
  supportedJobTypes: z.array(skillIdentitySchema).min(1).max(100),
  supportedScopes: z.array(z.enum(['clip', 'range', 'multi_range', 'scene', 'boundary', 'sequence', 'video'])).min(1).max(7),
  acceptedCallerTypes: z.array(skillIdentitySchema).min(1).max(50),
  requiredInputs: z.array(skillIdentitySchema).max(100),
  optionalInputs: z.array(skillIdentitySchema).max(100),
  acceptedArtifactTypes: z.array(skillIdentitySchema).max(200),
  producedArtifactTypes: z.array(skillIdentitySchema).max(200),
  primaryRouteRefs: z.array(exactRouteReferenceSchema).max(100),
  fallbackRouteRefs: z.array(exactRouteReferenceSchema).max(100),
  lowerCostRouteRefs: z.array(exactRouteReferenceSchema).max(100),
  planningQa: z.array(skillIdentitySchema).min(1).max(100),
  outputQa: z.array(skillIdentitySchema).max(100),
  integrationQa: z.array(skillIdentitySchema).max(100),
  knownLimitations: z.array(z.string().trim().min(1).max(2_000)).max(100),
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

export const skillCapabilityManifestCoreSchema = z.object({
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
  capabilityEntries: z.array(capabilityEntrySchema).min(1).max(200).optional(),
}).strict()

export const skillCapabilityManifestSchema = skillCapabilityManifestCoreSchema.extend({
  manifestHash: skillSha256Schema,
}).strict()
