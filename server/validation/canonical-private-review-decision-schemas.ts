import { z } from 'zod'

const identity = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)

const commonShape = {
  workspaceId: identity,
  packageRecordId: identity,
  purpose: z.literal('record_canonical_private_review_decision'),
  expectedManifestSha256: sha,
  expectedFinalArtifactSha256: sha,
}

export const canonicalPrivateRevisionChangeCategorySchema = z.enum([
  'pacing',
  'timing',
  'source_cleanup',
  'caption',
  'audio',
  'color',
  'visual_asset',
  'layout',
  'source_order',
  'aspect_ratio',
  'edit_level',
  'custom_instruction',
])

export const canonicalPrivateRevisionPreservationRuleSchema = z.enum([
  'source_order',
  'source_meaning',
  'important_clips',
  'approved_aspect_ratio',
  'edit_preferences',
  'edit_brief',
])

export const canonicalPrivateRevisionIntentSchema = z.object({
  summary: z.string().trim().min(8).max(4_000),
  changeCategories: z.array(canonicalPrivateRevisionChangeCategorySchema).min(1).max(12)
    .refine((values) => new Set(values).size === values.length),
  mustPreserve: z.array(canonicalPrivateRevisionPreservationRuleSchema).max(6)
    .refine((values) => new Set(values).size === values.length),
  captionReplacementText: z.string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[\x20-\x7e]+$/)
    .refine((value) => !/[{}\\[\]]/.test(value))
    .optional(),
  requiresReplanning: z.literal(true),
  requiresFreshEstimateAndApproval: z.literal(true),
}).strict().superRefine((value, context) => {
  if (
    value.captionReplacementText !== undefined &&
    !value.changeCategories.includes('caption')
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['captionReplacementText'],
      message: 'Exact caption replacement text requires the caption revision category.',
    })
  }
})

export const recordCanonicalPrivateReviewDecisionSchema = z.discriminatedUnion('decision', [
  z.object({
    ...commonShape,
    decision: z.literal('accept_private_internal_review'),
  }).strict(),
  z.object({
    ...commonShape,
    decision: z.literal('request_revision'),
    revisionIntent: canonicalPrivateRevisionIntentSchema,
  }).strict(),
])

const deniedPermissionsSchema = z.object({
  providerCall: z.literal(false),
  publicArtifact: z.literal(false),
  publicDelivery: z.literal(false),
  productionRender: z.literal(false),
  furtherRender: z.literal(false),
  revisionExecution: z.literal(false),
  replacementPlanPublication: z.literal(false),
  customerPriceMutation: z.literal(false),
  customerCreditMutation: z.literal(false),
  walletMutation: z.literal(false),
  reservationMutation: z.literal(false),
  settlement: z.literal(false),
  billing: z.literal(false),
  deployment: z.literal(false),
}).strict()

export const canonicalPrivateReviewDecisionResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-review-decision-response-v1'),
  source: z.literal('canonical_private_review_decision_service'),
  purpose: z.literal('record_canonical_private_review_decision'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
    reviewAssemblyId: identity,
    reviewDecisionId: identity,
  }).strict(),
  decision: z.enum(['accept_private_internal_review', 'request_revision']),
  status: z.enum(['private_internal_review_accepted', 'canonical_revision_requested']),
  authority: z.object({
    approvedPlanId: identity,
    approvedPlanVersion: z.number().int().positive(),
    approvedSnapshotHash: sha,
    approvedPlanHash: sha,
    approvedEstimateHash: sha,
    reviewManifestSha256: sha,
    finalArtifactSha256: sha,
    immutableApprovedSnapshotPreserved: z.literal(true),
    immutableReviewManifestPreserved: z.literal(true),
  }).strict(),
  revisionHandoff: z.union([
    z.object({
      revisionRequestId: identity,
      priorApprovedPlanId: identity,
      priorApprovedPlanVersion: z.number().int().positive(),
      minimumNextPlanVersion: z.number().int().positive(),
      revisionIntentHash: sha,
      requiresReplanning: z.literal(true),
      requiresFreshEstimateAndApproval: z.literal(true),
      replacementPlanPublished: z.literal(false),
      revisionExecutionStarted: z.literal(false),
    }).strict(),
    z.null(),
  ]),
  manifest: z.object({
    schemaVersion: z.literal('canonical-private-review-decision-manifest-v1'),
    manifestId: identity,
    manifestSha256: sha,
    privateCreateOnlyPersistence: z.literal(true),
    credentialFree: z.literal(true),
  }).strict(),
  replay: z.object({
    idempotentReplay: z.boolean(),
    sameDecisionOnly: z.literal(true),
  }).strict(),
  readiness: z.object({
    privateReviewDecisionRecorded: z.literal(true),
    revisionRequested: z.boolean(),
    publicExportReady: z.literal(false),
    productReady: z.literal(false),
    externalBetaReady: z.literal(false),
    productionReady: z.literal(false),
    nextRequiredGate: z.enum([
      'private_internal_acceptance_recorded_public_delivery_blocked',
      'canonical_revision_plan_compilation_and_fresh_approval',
    ]),
  }).strict(),
  permissions: deniedPermissionsSchema,
  decidedAt: z.string().datetime({ offset: true }),
  responseHash: sha,
  testOnly: z.literal(true),
}).strict()

export const canonicalPrivateReviewDecisionManifestSchema = z.object({
  schemaVersion: z.literal('canonical-private-review-decision-manifest-v1'),
  manifestId: identity,
  identity: canonicalPrivateReviewDecisionResponseSchema.shape.identity,
  decision: canonicalPrivateReviewDecisionResponseSchema.shape.decision,
  authority: canonicalPrivateReviewDecisionResponseSchema.shape.authority,
  revisionIntent: z.union([
    canonicalPrivateRevisionIntentSchema,
    z.null(),
  ]),
  revisionHandoff:
    canonicalPrivateReviewDecisionResponseSchema.shape.revisionHandoff,
  decidedAt: z.string().datetime({ offset: true }),
  privateInternalOnly: z.literal(true),
  publicDeliveryAuthorized: z.literal(false),
  replacementPlanPublicationAuthorized: z.literal(false),
  revisionExecutionAuthorized: z.literal(false),
  manifestSha256: sha,
}).strict().superRefine((value, context) => {
  const revision = value.decision === 'request_revision'
  if (
    revision !== (value.revisionIntent !== null) ||
    revision !== (value.revisionHandoff !== null)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['revisionIntent'],
      message: 'Revision intent and handoff must match the recorded decision.',
    })
  }
})

export type RecordCanonicalPrivateReviewDecisionBody = z.infer<
  typeof recordCanonicalPrivateReviewDecisionSchema
>
export type CanonicalPrivateReviewDecisionResponse = z.infer<
  typeof canonicalPrivateReviewDecisionResponseSchema
>
export type CanonicalPrivateReviewDecisionManifest = z.infer<
  typeof canonicalPrivateReviewDecisionManifestSchema
>
export type CanonicalPrivateRevisionIntent = z.infer<
  typeof canonicalPrivateRevisionIntentSchema
>
