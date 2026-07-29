import { z } from 'zod'

const identity = z.string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

export const prepareCanonicalPrivateEditSchema = z.object({
  workspaceId: identity,
  expectedProjectId: identity,
  expectedEditSessionId: identity,
  expectedSnapshotId: identity,
  expectedSnapshotHash: sha256,
  expectedPackageHash: sha256,
  purpose: z.literal('prepare_canonical_private_edit_review'),
}).strict()

const progressSummarySchema = z.object({
  totalJobCount: z.number().int().positive().max(256),
  completedJobCount: z.number().int().nonnegative().max(256),
  blockedJobCount: z.number().int().nonnegative().max(256),
  allRequiredJobsCompleted: z.boolean(),
  retryAvailable: z.boolean(),
  userReviewRequired: z.boolean(),
}).strict().superRefine((summary, context) => {
  if (summary.completedJobCount + summary.blockedJobCount > summary.totalJobCount) {
    context.addIssue({ code: 'custom', message: 'Private edit progress counts are inconsistent.' })
  }
})

const privateReviewSummarySchema = z.object({
  reviewAssemblyId: identity,
  manifestSha256: sha256,
  finalArtifactSha256: sha256,
  finalArtifactByteLength: z.number().int().positive().max(32 * 1024 * 1024),
  readyForPrivateReview: z.literal(true),
}).strict()

export const canonicalPrivateEditPreparationReceiptSchema = z.object({
  schemaVersion: z.literal('canonical-private-edit-preparation-receipt-v1'),
  source: z.literal('canonical_private_edit_preparation_coordinator_service'),
  purpose: z.literal('prepare_canonical_private_edit_review'),
  disposition: z.enum(['private_review_ready', 'in_progress', 'blocked']),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
  }).strict(),
  authority: z.object({
    packageHash: sha256,
    snapshotHash: sha256,
    exactApprovedAuthorityRevalidated: z.literal(true),
    serverDerivedWorkGraphOnly: z.literal(true),
  }).strict(),
  progress: progressSummarySchema,
  review: privateReviewSummarySchema.nullable(),
  readiness: z.object({
    privateReviewReady: z.boolean(),
    nextRequiredGate: z.enum([
      'canonical_private_work_graph_advancement',
      'canonical_job_capability_blockers',
      'canonical_private_review_user_decision_or_revision',
    ]),
    productReady: z.literal(false),
    externalBetaReady: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  boundaries: z.object({
    approvedPrivateExecutionRequested: z.literal(true),
    browserSuppliedJobsAccepted: z.literal(false),
    browserSuppliedToolsAccepted: z.literal(false),
    rawExecutionAuthorityReturned: z.literal(false),
    jobOrToolDetailsReturned: z.literal(false),
    filesystemPathReturned: z.literal(false),
    credentialReturned: z.literal(false),
    providerCallStarted: z.literal(false),
    publicArtifactCreated: z.literal(false),
    publicDeliveryStarted: z.literal(false),
    productionRenderStarted: z.literal(false),
    customerPriceMutation: z.literal(false),
    customerCreditMutation: z.literal(false),
    walletMutation: z.literal(false),
    settlementStarted: z.literal(false),
    billingStarted: z.literal(false),
    deploymentStarted: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocal: z.literal(true),
    tenantScoped: z.literal(true),
    distributed: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  completedAt: z.string().datetime({ offset: true }),
  testOnly: z.literal(true),
}).strict().superRefine((receipt, context) => {
  const ready = receipt.disposition === 'private_review_ready'
  const inProgress = receipt.disposition === 'in_progress'
  const expectedGate = ready
    ? 'canonical_private_review_user_decision_or_revision'
    : inProgress
      ? 'canonical_private_work_graph_advancement'
      : 'canonical_job_capability_blockers'
  if (
    ready !== receipt.readiness.privateReviewReady ||
    ready !== (receipt.review !== null) ||
    ready !== receipt.progress.allRequiredJobsCompleted ||
    receipt.readiness.nextRequiredGate !== expectedGate ||
    (
      inProgress &&
      (receipt.progress.retryAvailable || receipt.progress.userReviewRequired)
    )
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Private edit preparation readiness is inconsistent.',
    })
  }
})

export type PrepareCanonicalPrivateEditBody = z.infer<
  typeof prepareCanonicalPrivateEditSchema
>
export type CanonicalPrivateEditPreparationReceipt = z.infer<
  typeof canonicalPrivateEditPreparationReceiptSchema
>
