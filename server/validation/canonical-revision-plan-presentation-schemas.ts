import { z } from 'zod'

import { createCanonicalPlanningHandoffSchema } from './canonical-planning-handoff-schemas'
import { publishCanonicalEditPlanSchema } from './edit-planning-authority-schemas'

const identity = z.string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

const serverOwnedRevisionIntentKeys = new Set([
  'revisionIntentHash',
  'priorApprovedSnapshotId',
  'reviewDecisionId',
])

export const presentCanonicalRevisionPlanSchema = z.object({
  workspaceId: identity,
  expectedPackageRecordId: identity,
  expectedReviewAssemblyId: identity,
  expectedDecisionManifestSha256: sha256,
  expectedFinalArtifactSha256: sha256,
  purpose: z.literal('present_canonical_revision_plan'),
  orderedSourceItems: createCanonicalPlanningHandoffSchema.shape.orderedSourceItems,
  canonicalPlan: publishCanonicalEditPlanSchema.shape.canonicalPlan,
}).strict().superRefine((value, context) => {
  const compiledIntent = value.canonicalPlan.components.compiledIntent
  const injectedKeys = Object.keys(compiledIntent).filter((key) =>
    serverOwnedRevisionIntentKeys.has(key),
  )
  if (injectedKeys.length > 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['canonicalPlan', 'components', 'compiledIntent'],
      message: 'Revision decision authority is server-owned and cannot be supplied by the browser.',
    })
  }
})

export const canonicalRevisionPlanPresentationReceiptSchema = z.object({
  schemaVersion: z.literal('canonical-revision-plan-presentation-receipt-v1'),
  source: z.literal('canonical_revision_plan_presentation_coordinator_service'),
  purpose: z.literal('present_canonical_revision_plan'),
  disposition: z.literal('replacement_plan_presented'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    reviewAssemblyId: identity,
  }).strict(),
  replacementPlan: z.object({
    planId: identity,
    planVersion: z.number().int().positive(),
    planHash: sha256,
    priorPlanVersion: z.number().int().positive(),
    freshEstimatePresented: z.literal(true),
    freshApprovalRequired: z.literal(true),
  }).strict(),
  authority: z.object({
    exactRevisionDecisionRevalidated: z.literal(true),
    immutablePriorSnapshotPreserved: z.literal(true),
    immutablePriorReviewPreserved: z.literal(true),
    lockedPreferenceEvidenceReusedWithoutMutation: z.literal(true),
  }).strict(),
  boundaries: z.object({
    approvalRecorded: z.literal(false),
    snapshotCreated: z.literal(false),
    creditReservationMutated: z.literal(false),
    customerWalletMutated: z.literal(false),
    workGraphStarted: z.literal(false),
    toolExecutionStarted: z.literal(false),
    providerCallStarted: z.literal(false),
    renderStarted: z.literal(false),
    billingStarted: z.literal(false),
    publicDeliveryStarted: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocal: z.literal(true),
    tenantScoped: z.literal(true),
    distributed: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  rawRevisionAuthorityReturned: z.literal(false),
  jobOrToolDetailsReturned: z.literal(false),
  pathOrCredentialReturned: z.literal(false),
  replayed: z.boolean(),
  testOnly: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.replacementPlan.planVersion !== value.replacementPlan.priorPlanVersion + 1) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['replacementPlan', 'planVersion'],
      message: 'The replacement plan must be the next immutable plan version.',
    })
  }
})

export type PresentCanonicalRevisionPlanBody = z.infer<
  typeof presentCanonicalRevisionPlanSchema
>

export type CanonicalRevisionPlanPresentationReceipt = z.infer<
  typeof canonicalRevisionPlanPresentationReceiptSchema
>
