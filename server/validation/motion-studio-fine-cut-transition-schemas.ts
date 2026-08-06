import { z } from 'zod'

import { motionStudioFineCutManifestV1Schema } from '../../src/lib/motion-studio/contracts/fine-cut'

export const CANONICAL_MOTION_STUDIO_FINE_CUT_AUTHORIZATION_VERSION =
  'canonical-motion-studio-fine-cut-authorization-v1' as const
export const CANONICAL_MOTION_STUDIO_FINE_CUT_COMMIT_RECEIPT_VERSION =
  'canonical-motion-studio-fine-cut-commit-receipt-v1' as const
export const CANONICAL_MOTION_STUDIO_FINE_CUT_COMPANION_COMMIT_RECEIPT_VERSION =
  'canonical-motion-studio-fine-cut-companion-commit-receipt-v1' as const

const stableId = z.string().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')
const digest = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveSafeInteger = z.number().int().positive().safe()

const ownershipSchema = z.object({
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
}).strict()

export const canonicalMotionStudioFineCutAuthorizationV1Schema = ownershipSchema.extend({
  schemaVersion: z.literal(CANONICAL_MOTION_STUDIO_FINE_CUT_AUTHORIZATION_VERSION),
  actorUserId: stableId,
  productionRecordVersion: positiveSafeInteger,
  membershipRevision: positiveSafeInteger,
  membershipEvidenceDigest: digest,
  authorizedAt: timestamp,
  authorizationBeforeIdempotency: z.literal(true),
  exactStorytellingProductionReverified: z.literal(true),
  immutable: z.literal(true),
}).strict()

export type CanonicalMotionStudioFineCutAuthorizationV1 = z.infer<
  typeof canonicalMotionStudioFineCutAuthorizationV1Schema
>

export const createCanonicalMotionStudioFineCutRequestV1Schema = z.object({
  expectedCurrentFineCut: z.discriminatedUnion('state', [
    z.object({
      state: z.literal('none'),
      nextFineCutVersion: z.literal(1),
    }).strict(),
    z.object({
      state: z.literal('present'),
      fineCutId: stableId,
      fineCutVersionId: stableId,
      fineCutVersion: positiveSafeInteger,
      fineCutManifestDigest: digest,
      nextFineCutVersion: positiveSafeInteger,
    }).strict().superRefine((value, context) => {
      if (value.nextFineCutVersion !== value.fineCutVersion + 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nextFineCutVersion'],
          message: 'The successor Fine Cut version must increment the exact current version by one.',
        })
      }
    }),
  ]),
}).strict()

export type CreateCanonicalMotionStudioFineCutRequestV1 = z.infer<
  typeof createCanonicalMotionStudioFineCutRequestV1Schema
>

const closedBoundariesSchema = z.object({
  providerCallStarted: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  renderStarted: z.literal(false),
  exportStarted: z.literal(false),
  publicDeliveryStarted: z.literal(false),
  publicLinkCreated: z.literal(false),
  customerPriceMutation: z.literal(false),
  customerCreditMutation: z.literal(false),
  serviceFeeMutation: z.literal(false),
  walletMutation: z.literal(false),
  billingStarted: z.literal(false),
  deploymentStarted: z.literal(false),
}).strict()

export const canonicalMotionStudioFineCutCommitReceiptV1Schema = ownershipSchema.extend({
  schemaVersion: z.literal(CANONICAL_MOTION_STUDIO_FINE_CUT_COMMIT_RECEIPT_VERSION),
  actorUserId: stableId,
  authorizationDigest: digest,
  requestHash: digest,
  sourceAuthorityDigest: digest,
  fineCutManifest: motionStudioFineCutManifestV1Schema,
  fineCutManifestDigest: digest,
  idempotencyStatus: z.enum(['inserted', 'exact_replay']),
  authorizationBeforeIdempotency: z.literal(true),
  compareAndSwapVerified: z.literal(true),
  oneCurrentVersionEnforced: z.literal(true),
  sourceRevalidatedInsideTransaction: z.literal(true),
  createOnly: z.literal(true),
  immutable: z.literal(true),
  canonicalReviewAuthorityReused: z.literal(true),
  canonicalExportAuthorityReused: z.literal(true),
  boundaries: closedBoundariesSchema,
}).strict()

export type CanonicalMotionStudioFineCutCommitReceiptV1 = z.infer<
  typeof canonicalMotionStudioFineCutCommitReceiptV1Schema
>

const companionBaseSchema = ownershipSchema.extend({
  schemaVersion: z.literal(CANONICAL_MOTION_STUDIO_FINE_CUT_COMPANION_COMMIT_RECEIPT_VERSION),
  actorUserId: stableId,
  authorizationDigest: digest,
  requestHash: digest,
  fineCutVersionId: stableId,
  recordId: stableId,
  recordDigest: digest,
  idempotencyStatus: z.enum(['inserted', 'exact_replay']),
  authorizationBeforeIdempotency: z.literal(true),
  exactCurrentAuthorityReverified: z.literal(true),
  createOnly: z.literal(true),
  immutable: z.literal(true),
  boundaries: closedBoundariesSchema,
})

export const canonicalMotionStudioFineCutCompanionCommitReceiptV1Schema =
  z.discriminatedUnion('recordKind', [
    companionBaseSchema.extend({
      recordKind: z.literal('private_review_binding'),
      canonicalPackageRecordId: stableId,
      canonicalReviewAssemblyId: stableId,
      canonicalReviewManifestSha256: digest,
      canonicalFinalArtifactSha256: digest,
      sharedPrivateReviewAuthorityReused: z.literal(true),
    }).strict(),
    companionBaseSchema.extend({
      recordKind: z.literal('review_comment'),
      reviewBindingId: stableId,
      appendOnlyCommentAuthority: z.literal(true),
      untrustedTextRemainedInert: z.literal(true),
    }).strict(),
    companionBaseSchema.extend({
      recordKind: z.literal('review_comment_event'),
      commentId: stableId,
      sequence: positiveSafeInteger,
      expectedPreviousState: z.enum(['open', 'resolved', 'reopened', 'dismissed']),
      resultingState: z.enum(['resolved', 'reopened', 'dismissed']),
      originalCommentMutated: z.literal(false),
      appendOnlyEventAuthority: z.literal(true),
    }).strict(),
    companionBaseSchema.extend({
      recordKind: z.literal('fine_cut_review_decision'),
      canonicalReviewAssemblyId: stableId,
      canonicalReviewDecisionId: stableId,
      expectedReviewRecordVersion: positiveSafeInteger,
      canonicalDecision: z.enum(['accept_private_internal_review', 'request_revision']),
      canonicalRevisionRequestId: stableId.optional(),
      sharedReviewDecisionAuthorityReused: z.literal(true),
    }).strict().superRefine((value, context) => {
      if (
        value.canonicalDecision === 'request_revision' &&
        !value.canonicalRevisionRequestId
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['canonicalRevisionRequestId'],
          message: 'A canonical revision request is required for a non-approval Fine Cut decision.',
        })
      }
      if (
        value.canonicalDecision === 'accept_private_internal_review' &&
        value.canonicalRevisionRequestId
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['canonicalRevisionRequestId'],
          message: 'An accepted private review cannot carry a revision request.',
        })
      }
    }),
    companionBaseSchema.extend({
      recordKind: z.literal('revision_impact'),
      sourceDecisionId: stableId,
      chatRevisionProposalId: stableId,
      approvedFineCutMutated: z.literal(false),
      existingChatRevisionAuthorityReused: z.literal(true),
    }).strict(),
    companionBaseSchema.extend({
      recordKind: z.literal('quality_control_report'),
      reviewDecisionId: stableId,
      allRequiredGatesPersistedExactlyOnce: z.literal(true),
      sharedQaAuthorityReused: z.literal(true),
    }).strict(),
    companionBaseSchema.extend({
      recordKind: z.literal('delivery_handoff'),
      qualityControlReportId: stableId,
      existingExportRecordId: stableId,
      exportManifestId: stableId,
      existingExportRecordRevalidated: z.literal(true),
      existingExportAuthorityReused: z.literal(true),
    }).strict(),
  ])

export type CanonicalMotionStudioFineCutCompanionCommitReceiptV1 = z.infer<
  typeof canonicalMotionStudioFineCutCompanionCommitReceiptV1Schema
>
