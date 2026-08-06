import { z } from 'zod'
import {
  exactEditPreferenceFieldKeySchema,
  exactEditPreferenceScopeIdSchema,
  exactEditPreferenceValuesSchema,
} from './exact-edit-preference-schemas'
import {
  preferenceRuleCategorySchema,
  preferenceRuntimeStateSchema,
} from './preference-intelligence-schemas'

export const PLANNING_PREFERENCE_BINDING_SCHEMA_VERSION = 'planning-preference-binding-v1' as const

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

export const preferenceInstructionPrioritySchema = z.tuple([
  z.literal('safety_legal_and_do_not_copy'),
  z.literal('latest_explicit_user_instruction'),
  z.literal('confirmed_edit_brief_marker'),
  z.literal('approved_project_override'),
  z.literal('selected_preference_dna'),
  z.literal('general_defaults'),
  z.literal('deterministic_fallback'),
])

export const planningPreferenceCanonicalSettingsSchema = z.object({
  editLevel: exactEditPreferenceValuesSchema.shape.editLevel,
  targetPlatform: exactEditPreferenceValuesSchema.shape.targetPlatform,
  cleanupPreference: exactEditPreferenceValuesSchema.shape.cleanupPreference,
}).strict()

export const planningPreferenceBindingExpectationSchema = z.object({
  exactEdit: z.object({
    expectedRecordRevision: z.number().int().nonnegative(),
    expectedPreferenceRevision: z.number().int().nonnegative(),
    expectedPlanningInputRevision: z.number().int().nonnegative(),
    expectedPreferenceFingerprintSha256: sha256Schema,
    expectedBaselinePreferenceSnapshotId: exactEditPreferenceScopeIdSchema,
  }).strict(),
  application: z.discriminatedUnion('status', [
    z.object({
      status: z.literal('not_selected'),
      expectedApplicationVersion: z.literal(0),
    }).strict(),
    z.object({
      status: z.literal('cleared'),
      expectedApplicationId: exactEditPreferenceScopeIdSchema,
      expectedApplicationVersion: z.number().int().positive(),
    }).strict(),
    z.object({
      status: z.literal('applied'),
      expectedApplicationId: exactEditPreferenceScopeIdSchema,
      expectedApplicationVersion: z.number().int().positive(),
      expectedPreferenceId: exactEditPreferenceScopeIdSchema,
      expectedDnaVersionId: exactEditPreferenceScopeIdSchema,
      expectedDnaVersion: z.number().int().positive(),
    }).strict(),
  ]),
}).strict()

export const resolvePlanningPreferenceBindingSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  projectId: exactEditPreferenceScopeIdSchema,
  editSessionId: exactEditPreferenceScopeIdSchema,
  canonicalSettings: planningPreferenceCanonicalSettingsSchema,
  expectations: planningPreferenceBindingExpectationSchema,
}).strict()

export const revalidatePlanningPreferenceBindingSchema = resolvePlanningPreferenceBindingSchema.extend({
  expectedBindingHashSha256: sha256Schema,
})

const exactEditBindingSchema = z.object({
  recordRevision: z.number().int().nonnegative(),
  preferenceRevision: z.number().int().nonnegative(),
  planningInputRevision: z.number().int().nonnegative(),
  preferenceFingerprintSha256: sha256Schema,
  values: exactEditPreferenceValuesSchema,
  overrideKeys: z.array(exactEditPreferenceFieldKeySchema).max(7),
  baseline: z.object({
    preferenceSnapshotId: exactEditPreferenceScopeIdSchema,
    provenance: z.enum(['saved_edit_preferences', 'server_default_preferences']),
    persistenceSource: z.enum(['authenticated_private_internal_backend', 'server_defaults']),
    capturedAt: z.string().datetime({ offset: true }),
  }).strict(),
}).strict()

const plannerContextSchema = z.object({
  compact: z.literal(true),
  audience: z.literal('planner'),
  preferenceId: exactEditPreferenceScopeIdSchema,
  preferenceName: z.string().min(1).max(120),
  preferenceDNAId: exactEditPreferenceScopeIdSchema,
  preferenceDNAVersion: z.number().int().positive(),
  runtimeState: preferenceRuntimeStateSchema,
  qaStatus: z.enum(['not_run', 'passed', 'warning', 'blocked']),
  confidence: z.number().min(0).max(1),
  relevantRules: z.record(
    preferenceRuleCategorySchema,
    z.array(z.string().min(1).max(1_000)).max(8),
  ),
  doNotCopyRules: z.array(z.string().min(1).max(1_000)).min(1).max(128),
  nonTransferableElements: z.array(z.string().min(1).max(1_000)).max(128),
  qaWarnings: z.array(z.string().min(1).max(1_000)).max(128),
  instructionPriority: preferenceInstructionPrioritySchema,
}).strict()

const resolvedApplicationBindingSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('not_selected'),
    applicationVersion: z.literal(0),
  }).strict(),
  z.object({
    status: z.literal('cleared'),
    applicationId: exactEditPreferenceScopeIdSchema,
    applicationVersion: z.number().int().positive(),
    source: z.enum(['selector', 'main_chat_tag']),
    runtimeState: z.literal('mock_local'),
  }).strict(),
  z.object({
    status: z.literal('applied'),
    applicationId: exactEditPreferenceScopeIdSchema,
    applicationVersion: z.number().int().positive(),
    preferenceId: exactEditPreferenceScopeIdSchema,
    dnaVersionId: exactEditPreferenceScopeIdSchema,
    dnaVersion: z.number().int().positive(),
    dnaRuntimeState: preferenceRuntimeStateSchema,
    qaStatus: z.enum(['passed', 'warning']),
    confidence: z.number().min(0).max(1),
    source: z.enum(['selector', 'main_chat_tag']),
    runtimeState: z.literal('mock_local'),
    preferenceWarnings: z.array(z.string().min(1).max(1_000)).max(128),
    doNotCopyRules: z.array(z.string().min(1).max(1_000)).min(1).max(128),
    instructionPriority: preferenceInstructionPrioritySchema,
    plannerContext: plannerContextSchema,
  }).strict(),
])

export const resolvedPlanningPreferenceBindingSchema = z.object({
  schemaVersion: z.literal(PLANNING_PREFERENCE_BINDING_SCHEMA_VERSION),
  source: z.literal('server_private_preference_authorities'),
  scope: z.object({
    ownerUserId: exactEditPreferenceScopeIdSchema,
    workspaceId: exactEditPreferenceScopeIdSchema,
    projectId: exactEditPreferenceScopeIdSchema,
    editSessionId: exactEditPreferenceScopeIdSchema,
  }).strict(),
  exactEdit: exactEditBindingSchema,
  application: resolvedApplicationBindingSchema,
  editBriefBinding: z.object({
    status: z.literal('separate_authority_not_included'),
    futureHookVersion: z.literal(1),
  }).strict(),
}).strict()

export type PlanningPreferenceCanonicalSettings = z.infer<typeof planningPreferenceCanonicalSettingsSchema>
export type PlanningPreferenceBindingExpectation = z.infer<typeof planningPreferenceBindingExpectationSchema>
export type ResolvePlanningPreferenceBindingInput = z.infer<typeof resolvePlanningPreferenceBindingSchema>
export type RevalidatePlanningPreferenceBindingInput = z.infer<typeof revalidatePlanningPreferenceBindingSchema>
export type ResolvedPlanningPreferenceBinding = z.infer<typeof resolvedPlanningPreferenceBindingSchema>
