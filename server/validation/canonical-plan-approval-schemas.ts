import { z } from 'zod'

const identity = z.string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

export const approvePresentedCanonicalPlanSchema = z.object({
  workspaceId: identity,
  expectedProjectId: identity,
  expectedEditSessionId: identity,
  expectedPlanVersion: z.number().int().positive(),
  expectedPlanHash: sha256,
  expectedEstimateId: identity,
  expectedEstimateHash: sha256,
  expectedMaximumCredits: z.number().int().nonnegative(),
}).strict()

export const canonicalPlanApprovalReceiptSchema = z.object({
  schemaVersion: z.literal('canonical-plan-approval-receipt-v1'),
  source: z.literal('canonical_plan_approval_coordinator_service'),
  disposition: z.enum(['approved_now', 'exact_replay']),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
  }).strict(),
  plan: z.object({
    planId: identity,
    planVersion: z.number().int().positive(),
    status: z.literal('approved'),
    planHash: sha256,
    estimateId: identity,
    estimateStatus: z.literal('approved'),
    estimateHash: sha256,
    approvedMaximumCredits: z.number().int().nonnegative(),
  }).strict(),
  approval: z.object({
    approvalId: identity,
    snapshotId: identity,
    snapshotHash: sha256,
    reservationId: identity,
    reservationStatus: z.enum([
      'reserved',
      'partially_spent',
      'spent',
      'released',
      'refunded',
      'cancelled',
      'expired',
    ]),
    reservedCredits: z.number().int().nonnegative(),
    jobCount: z.number().int().nonnegative(),
    readyJobCount: z.number().int().nonnegative(),
    blockedJobCount: z.number().int().nonnegative(),
  }).strict(),
  boundaries: z.object({
    approvedSnapshotAvailable: z.literal(true),
    syntheticPrivateCreditReservation: z.literal(true),
    jobRecordsDerived: z.literal(true),
    paidBillingExecuted: z.literal(false),
    customerWalletMutation: z.literal(false),
    jobExecutionStarted: z.literal(false),
    toolExecutionStarted: z.literal(false),
    providerCallStarted: z.literal(false),
    renderStarted: z.literal(false),
    publicDeliveryStarted: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocal: z.literal(true),
    tenantScoped: z.literal(true),
    distributed: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  rawAuthorityReturned: z.literal(false),
  pathOrCredentialReturned: z.literal(false),
  testOnly: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.plan.approvedMaximumCredits !== value.approval.reservedCredits) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['approval', 'reservedCredits'],
      message: 'Canonical approval receipt reservation must match the approved maximum.',
    })
  }
  if (value.approval.readyJobCount + value.approval.blockedJobCount !== value.approval.jobCount) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['approval', 'jobCount'],
      message: 'Canonical approval receipt job counts are inconsistent.',
    })
  }
})

export type ApprovePresentedCanonicalPlanBody = z.infer<typeof approvePresentedCanonicalPlanSchema>
export type CanonicalPlanApprovalReceipt = z.infer<typeof canonicalPlanApprovalReceiptSchema>
