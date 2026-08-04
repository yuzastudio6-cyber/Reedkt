import { z } from 'zod'
import {
  CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_VERSION,
  CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_REQUEST_VERSION,
} from '../../src/types/canonical-exact-edit-planning-authority'
import { exactEditPreferenceValuesSchema } from './exact-edit-preference-schemas'

const safeIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const timestampSchema = z.string().datetime({ offset: true })
const aspectRatioSchema = z.enum(['9:16', '16:9', '1:1', '4:5', '4:3'])

export const canonicalExactEditPreferenceBaselineAuthoritySchema = z.object({
  preferenceSnapshotId: safeIdSchema,
  values: exactEditPreferenceValuesSchema,
  preferenceFingerprintSha256: sha256Schema,
  capturedAt: timestampSchema,
  persistenceSource: z.enum([
    'server_defaults',
    'authenticated_private_internal_backend',
  ]),
  provenance: z.enum([
    'server_default_preferences',
    'saved_edit_preferences',
  ]),
}).strict()

export const canonicalExactEditSourcePreparationAuthoritySchema =
  z.discriminatedUnion('status', [
    z.object({
      status: z.enum(['not_ready', 'requires_repreparation']),
      sourceCandidateHashSha256: z.null(),
      evidenceHashSha256: z.null(),
      confirmedAt: z.null(),
    }).strict(),
    z.object({
      status: z.literal('ready'),
      sourceCandidateHashSha256: sha256Schema.nullable(),
      evidenceHashSha256: sha256Schema,
      confirmedAt: timestampSchema,
    }).strict(),
  ])

export const canonicalExactEditFrameConfirmationAuthoritySchema =
  z.discriminatedUnion('status', [
    z.object({
      status: z.literal('not_confirmed'),
      confirmationId: z.null(),
      aspectRatio: z.null(),
      confirmedAt: z.null(),
      authorityDigestSha256: z.null(),
    }).strict(),
    z.object({
      status: z.literal('confirmed'),
      confirmationId: safeIdSchema,
      aspectRatio: aspectRatioSchema,
      confirmedAt: timestampSchema,
      authorityDigestSha256: sha256Schema,
    }).strict(),
  ])

export const canonicalExactEditPlanningAuthorityReadSchema = z.object({
  schemaVersion: z.literal(CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_VERSION),
  sourceAuthority: z.enum([
    'canonical_exact_edit_preference_repository',
    'private_exact_edit_preference_compatibility',
  ]),
  runtimeSource: z.enum(['verified_live', 'private_internal']),
  authorityReadReceiptId: safeIdSchema,
  workspaceId: safeIdSchema,
  projectId: safeIdSchema,
  editSessionId: safeIdSchema,
  recordRevision: z.number().int().nonnegative(),
  preferenceRevision: z.number().int().nonnegative(),
  planningInputRevision: z.number().int().nonnegative(),
  preferenceFingerprintSha256: sha256Schema,
  values: exactEditPreferenceValuesSchema,
  baseline: canonicalExactEditPreferenceBaselineAuthoritySchema,
  sourcePreparation: canonicalExactEditSourcePreparationAuthoritySchema,
  frameConfirmation: canonicalExactEditFrameConfirmationAuthoritySchema,
  lifecyclePhase: z.enum([
    'planning', 'approved_snapshot', 'credit_reserved', 'executing',
    'private_review', 'completed_internal', 'revision_handoff',
  ]),
  locked: z.boolean(),
  currentApplicationState: z.enum(['not_selected', 'connected', 'cleared']),
  currentApplicationId: safeIdSchema.nullable(),
  readAt: timestampSchema,
  browserMutationAuthorityGranted: z.literal(false),
  productionReleaseReadinessEvaluatedSeparately: z.literal(true),
}).strict().superRefine((authority, context) => {
  if (
    authority.currentApplicationState === 'connected'
      ? authority.currentApplicationId === null
      : authority.currentApplicationId !== null
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['currentApplicationId'],
      message: 'Connected application identity is inconsistent.',
    })
  }
})

export const canonicalExactEditPlanningEvidenceRequestSchema = z.object({
  schemaVersion: z.literal(CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_REQUEST_VERSION),
  actorUserId: safeIdSchema,
  workspaceId: safeIdSchema,
  projectId: safeIdSchema,
  editSessionId: safeIdSchema,
  expectedPreferenceRevision: z.number().int().nonnegative(),
  expectedPlanningInputRevision: z.number().int().nonnegative(),
  expectedPreferenceFingerprintSha256: sha256Schema,
  expectedBaselinePreferenceSnapshotId: safeIdSchema,
  sourceCandidateHashSha256: sha256Schema,
  sourcePreparationEvidenceHashSha256: sha256Schema,
  confirmedAspectRatio: aspectRatioSchema,
}).strict()

export type CanonicalExactEditPlanningAuthorityReadInput = z.infer<
  typeof canonicalExactEditPlanningAuthorityReadSchema
>
export type CanonicalExactEditPlanningEvidenceRequestInput = z.infer<
  typeof canonicalExactEditPlanningEvidenceRequestSchema
>
