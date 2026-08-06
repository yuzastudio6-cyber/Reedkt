import { z } from 'zod'

import { canonicalPrivateRevisionIntentSchema } from './canonical-private-review-decision-schemas'

const identity = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)

const exactReviewAuthorityShape = {
  workspaceId: identity,
  expectedProjectId: identity,
  expectedEditSessionId: identity,
  packageRecordId: identity,
  expectedManifestSha256: sha,
  expectedFinalArtifactSha256: sha,
}

export const canonicalPrivateReviewMediaQuerySchema = z.object({
  ...exactReviewAuthorityShape,
  purpose: z.literal('read_canonical_private_review_media'),
}).strict()

export const recordCanonicalPrivateReviewDecisionCoordinatorSchema = z.discriminatedUnion(
  'decision',
  [
    z.object({
      ...exactReviewAuthorityShape,
      purpose: z.literal('record_canonical_private_review_decision'),
      decision: z.literal('accept_private_internal_review'),
    }).strict(),
    z.object({
      ...exactReviewAuthorityShape,
      purpose: z.literal('record_canonical_private_review_decision'),
      decision: z.literal('request_revision'),
      revisionIntent: canonicalPrivateRevisionIntentSchema,
    }).strict(),
  ],
)

const deniedBoundariesSchema = z.object({
  rawDecisionAuthorityReturned: z.literal(false),
  artifactIdentityReturned: z.literal(false),
  jobOrToolDetailsReturned: z.literal(false),
  filesystemPathReturned: z.literal(false),
  credentialReturned: z.literal(false),
  providerCallStarted: z.literal(false),
  publicArtifactCreated: z.literal(false),
  publicDeliveryStarted: z.literal(false),
  productionRenderStarted: z.literal(false),
  revisionExecutionStarted: z.literal(false),
  replacementPlanPublished: z.literal(false),
  customerPriceMutation: z.literal(false),
  customerCreditMutation: z.literal(false),
  walletMutation: z.literal(false),
  reservationMutation: z.literal(false),
  settlementStarted: z.literal(false),
  billingStarted: z.literal(false),
  deploymentStarted: z.literal(false),
}).strict()

export const canonicalPrivateReviewDecisionCoordinatorReceiptSchema = z.object({
  schemaVersion: z.literal('canonical-private-review-decision-coordinator-receipt-v1'),
  source: z.literal('canonical_private_review_decision_coordinator_service'),
  purpose: z.literal('record_canonical_private_review_decision'),
  disposition: z.literal('decision_recorded'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    reviewAssemblyId: identity,
  }).strict(),
  authority: z.object({
    reviewManifestSha256: sha,
    finalArtifactSha256: sha,
    exactReviewAuthorityRevalidated: z.literal(true),
    immutableApprovedSnapshotPreserved: z.literal(true),
    immutableReviewManifestPreserved: z.literal(true),
  }).strict(),
  decision: z.object({
    value: z.enum(['accept_private_internal_review', 'request_revision']),
    status: z.enum(['private_internal_review_accepted', 'canonical_revision_requested']),
    revisionRequested: z.boolean(),
    requiresReplanning: z.boolean(),
    requiresFreshEstimateAndApproval: z.boolean(),
  }).strict(),
  readiness: z.object({
    privateReviewDecisionRecorded: z.literal(true),
    publicExportReady: z.literal(false),
    productReady: z.literal(false),
    externalBetaReady: z.literal(false),
    productionReady: z.literal(false),
    nextRequiredGate: z.enum([
      'private_internal_acceptance_recorded_public_delivery_blocked',
      'canonical_revision_plan_compilation_and_fresh_approval',
    ]),
  }).strict(),
  boundaries: deniedBoundariesSchema,
  persistence: z.object({
    privateLocal: z.literal(true),
    tenantScoped: z.literal(true),
    distributed: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  decidedAt: z.string().datetime({ offset: true }),
  testOnly: z.literal(true),
}).strict()

export type CanonicalPrivateReviewMediaQuery = z.infer<
  typeof canonicalPrivateReviewMediaQuerySchema
>
export type RecordCanonicalPrivateReviewDecisionCoordinatorBody = z.infer<
  typeof recordCanonicalPrivateReviewDecisionCoordinatorSchema
>
export type CanonicalPrivateReviewDecisionCoordinatorReceipt = z.infer<
  typeof canonicalPrivateReviewDecisionCoordinatorReceiptSchema
>
