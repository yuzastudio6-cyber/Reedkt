import { z } from 'zod'
import { exactEditPreferenceScopeIdSchema, exactEditPreferenceValuesSchema } from './exact-edit-preference-schemas'
import { preferenceContextAudienceSchema } from './preference-intelligence-schemas'

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const safeIdSchema = exactEditPreferenceScopeIdSchema

export const exactEditPreferenceAuthorityExpectationSchema = z.object({
  recordRevision: z.number().int().nonnegative(),
  preferenceRevision: z.number().int().nonnegative(),
  preferenceFingerprintSha256: sha256Schema,
}).strict()

export const preferenceApplicationAuthorityExpectationSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('not_selected'),
    applicationVersion: z.literal(0),
  }).strict(),
  z.object({
    status: z.literal('cleared'),
    applicationId: safeIdSchema,
    applicationVersion: z.number().int().positive(),
    applicationHash: sha256Schema,
  }).strict(),
  z.object({
    status: z.literal('applied'),
    applicationId: safeIdSchema,
    applicationVersion: z.number().int().positive(),
    preferenceId: safeIdSchema,
    dnaVersionId: safeIdSchema,
    dnaVersion: z.number().int().positive(),
    applicationHash: sha256Schema,
  }).strict(),
])

export const editBriefAuthorityExpectationSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('not_used') }).strict(),
  z.object({
    status: z.literal('bound'),
    aggregateRevision: z.number().int().nonnegative(),
    deterministicHash: sha256Schema,
  }).strict(),
])

export const planningInputAuthorityExpectationSchema = z.object({
  exactEditPreference: exactEditPreferenceAuthorityExpectationSchema,
  preferenceApplication: preferenceApplicationAuthorityExpectationSchema,
  editBrief: editBriefAuthorityExpectationSchema,
}).strict()

const exactEditPlanningBindingSchema = z.object({
  recordRevision: z.number().int().nonnegative(),
  preferenceRevision: z.number().int().nonnegative(),
  preferenceFingerprintSha256: sha256Schema,
  values: exactEditPreferenceValuesSchema,
  baseline: z.object({
    preferenceSnapshotId: safeIdSchema,
    persistenceSource: z.enum(['server_defaults', 'authenticated_private_internal_backend']),
    provenance: z.enum(['server_default_preferences', 'saved_edit_preferences']),
  }).strict(),
  sourcePreparationEvidenceHash: sha256Schema,
  frameConfirmationId: safeIdSchema,
  confirmedAspectRatio: z.enum(['9:16', '16:9', '1:1', '4:5', '4:3']),
}).strict()

const preferenceContextBindingSchema = z.object({
  compact: z.literal(true),
  audience: preferenceContextAudienceSchema,
  preferenceId: safeIdSchema,
  preferenceName: z.string().trim().min(1).max(120),
  preferenceDNAId: safeIdSchema,
  preferenceDNAVersion: z.number().int().positive(),
  runtimeState: z.string().trim().min(1).max(80),
  qaStatus: z.enum(['not_run', 'passed', 'warning', 'blocked']),
  confidence: z.number().min(0).max(1),
  relevantRules: z.record(z.string(), z.array(z.string().trim().min(1).max(1_000)).max(64)),
  doNotCopyRules: z.array(z.string().trim().min(1).max(1_000)).max(128),
  nonTransferableElements: z.array(z.string().trim().min(1).max(1_000)).max(128),
  qaWarnings: z.array(z.string().trim().min(1).max(1_000)).max(128),
  instructionPriority: z.array(z.string().trim().min(1).max(160)).length(7),
}).strict()

const resolvedPreferenceApplicationBindingSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('not_selected'),
    applicationVersion: z.literal(0),
    applicationHash: sha256Schema,
  }).strict(),
  z.object({
    status: z.literal('cleared'),
    applicationId: safeIdSchema,
    applicationVersion: z.number().int().positive(),
    applicationHash: sha256Schema,
  }).strict(),
  z.object({
    status: z.literal('applied'),
    applicationId: safeIdSchema,
    applicationVersion: z.number().int().positive(),
    preferenceId: safeIdSchema,
    dnaVersionId: safeIdSchema,
    dnaVersion: z.number().int().positive(),
    applicationHash: sha256Schema,
    plannerContext: preferenceContextBindingSchema,
  }).strict(),
])

const editBriefPublicationBindingSchema = z.object({
  schemaVersion: z.literal('edit-brief-authority-publication-binding-v1'),
  workspaceId: safeIdSchema,
  projectId: safeIdSchema,
  editSessionId: safeIdSchema,
  aggregateRevision: z.number().int().nonnegative(),
  authorityWorkspaceRevision: z.number().int().nonnegative(),
  workspaceFingerprint: sha256Schema,
  authorityInputHash: sha256Schema,
  markerFingerprint: sha256Schema,
  confirmedMarkerFingerprint: sha256Schema,
  activeMarkerCount: z.number().int().nonnegative(),
  confirmedMarkerCount: z.number().int().nonnegative(),
  allActiveMarkersConfirmed: z.boolean(),
  outputFrameConfirmed: z.boolean(),
  qaReportId: safeIdSchema.optional(),
  qaStatus: z.enum(['passed', 'warning', 'needs_user_review', 'blocked', 'not_run']),
  qaIsCurrent: z.boolean(),
  openConflictCount: z.number().int().nonnegative(),
  conflictFingerprint: sha256Schema,
  planHintPackageId: safeIdSchema.optional(),
  planHintFingerprint: sha256Schema.optional(),
  planHintReadiness: z.enum(['ready_for_planning', 'needs_user_review', 'blocked', 'not_created']),
  planInputQaStatus: z.enum(['passed', 'blocked', 'not_run']),
  preferenceId: safeIdSchema.optional(),
  preferenceDNAId: safeIdSchema.optional(),
  preferenceDNAVersion: z.number().int().positive().optional(),
  preferenceFingerprint: sha256Schema.optional(),
  planHintsAreCurrent: z.boolean(),
  hasApprovalBlockers: z.boolean(),
  deterministicHash: sha256Schema,
}).strict()

const resolvedEditBriefBindingSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('not_used'),
    deterministicHash: sha256Schema,
  }).strict(),
  z.object({
    status: z.literal('bound'),
    publicationBinding: editBriefPublicationBindingSchema,
    briefFields: z.record(z.string(), z.unknown()).optional(),
    exportSettings: z.record(z.string(), z.unknown()),
    confirmedMarkerHints: z.array(z.record(z.string(), z.unknown())).max(500),
    planHintPackageId: safeIdSchema,
    planHintAuthorityInputHash: sha256Schema,
    deterministicHash: sha256Schema,
  }).strict(),
])

export const resolvedPlanningInputAuthorityBindingSchema = z.object({
  schemaVersion: z.literal('canonical-planning-input-authority-binding-v1'),
  workspaceId: safeIdSchema,
  projectId: safeIdSchema,
  editSessionId: safeIdSchema,
  exactEditPreference: exactEditPlanningBindingSchema,
  preferenceApplication: resolvedPreferenceApplicationBindingSchema,
  editBrief: resolvedEditBriefBindingSchema,
  instructionPriority: z.array(z.string().trim().min(1).max(160)).length(7),
  noRuntimeSideEffects: z.literal(true),
  bindingHash: sha256Schema,
}).strict()

export type PlanningInputAuthorityExpectation = z.infer<typeof planningInputAuthorityExpectationSchema>
export type ResolvedPlanningInputAuthorityBinding = z.infer<typeof resolvedPlanningInputAuthorityBindingSchema>
