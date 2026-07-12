import { z } from 'zod'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)

export const canonicalEditJourneyQuerySchema = z.object({
  workspaceId: identity,
}).strict()

export const canonicalEditJourneyStageSchema = z.enum([
  'planning_handoff_required',
  'publication_request_required',
  'internal_publication_pending',
  'plan_approval_required',
  'approved_snapshot_available',
  'cancellation_pending',
  'replanning_required',
])

export const canonicalEditJourneyResponseSchema = z.object({
  schemaVersion: z.literal('canonical-edit-journey-recovery-v1'),
  source: z.literal('canonical_edit_journey_service'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
  }).strict(),
  stage: canonicalEditJourneyStageSchema,
  nextAction: z.object({
    code: z.enum([
      'prepare_planning_handoff',
      'submit_publication_request',
      'await_internal_publication',
      'approve_canonical_plan',
      'request_execution_package',
      'await_cancellation_reconciliation',
      'prepare_replacement_plan',
    ]),
    actor: z.enum(['authenticated_user', 'planning_client', 'internal_service']),
    method: z.enum(['GET', 'POST']),
    routeTemplate: z.string().min(1).max(500),
  }).strict(),
  planningHandoff: z.object({
    handoffId: identity,
    handoffHash: sha,
    canonicalPlanComponentsHash: sha,
    publicationStatus: z.enum(['unpublished', 'published']),
  }).strict().optional(),
  publicationRequest: z.object({
    candidateId: identity,
    candidateHash: sha,
    publicationRequestHash: sha,
    publicationStatus: z.enum([
      'pending_internal_publication',
      'published',
      'superseded_by_competing_candidate',
    ]),
  }).strict().optional(),
  plan: z.object({
    planId: identity,
    planVersion: z.number().int().positive(),
    status: z.enum(['presented', 'approved', 'superseded', 'rejected', 'cancellation_pending', 'cancelled']),
    planHash: sha,
    estimateId: identity,
    estimateStatus: z.enum(['presented', 'approved', 'superseded', 'expired', 'rejected', 'cancelled']),
    estimateHash: sha,
    approvedMaximumCredits: z.number().int().nonnegative(),
    workItemCount: z.number().int().nonnegative(),
  }).strict().optional(),
  approval: z.object({
    approvalId: identity,
    snapshotId: identity,
    snapshotHash: sha,
    reservationId: identity,
    reservationStatus: z.enum(['reserved', 'partially_spent', 'spent', 'released', 'refunded', 'cancelled', 'expired']),
    reservedCredits: z.number().int().nonnegative(),
    jobCount: z.number().int().nonnegative(),
    readyJobCount: z.number().int().nonnegative(),
    blockedJobCount: z.number().int().nonnegative(),
  }).strict().optional(),
  permissions: z.object({
    inspectionOnly: z.literal(true),
    rawPlanInputsReturned: z.literal(false),
    filesystemPathReturned: z.literal(false),
    credentialReturned: z.literal(false),
    snapshotMutation: z.literal(false),
    creditMutation: z.literal(false),
    toolExecution: z.literal(false),
    providerCall: z.literal(false),
    render: z.literal(false),
  }).strict(),
  testOnly: z.literal(true),
}).strict()

export type CanonicalEditJourneyResponse = z.infer<typeof canonicalEditJourneyResponseSchema>
