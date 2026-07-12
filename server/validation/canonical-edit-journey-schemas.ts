import { z } from 'zod'
import { canonicalPrivateReviewHistoryDownloadQuerySchema } from './canonical-private-review-history-schemas'

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
  'execution_in_progress',
  'private_review_assembly_required',
  'private_review_ready',
  'private_review_accepted',
  'revision_requested',
  'cancellation_pending',
  'replanning_required',
])

export type CanonicalEditJourneyStage = z.infer<typeof canonicalEditJourneyStageSchema>

type JourneyAuthorityField =
  | 'planningHandoff'
  | 'publicationRequest'
  | 'plan'
  | 'approval'
  | 'execution'
  | 'workGraphProgress'
  | 'workGraph'
  | 'review'

const actionByStage = {
  planning_handoff_required: {
    code: 'prepare_planning_handoff', actor: 'planning_client', method: 'POST',
  },
  publication_request_required: {
    code: 'submit_publication_request', actor: 'planning_client', method: 'POST',
  },
  internal_publication_pending: {
    code: 'await_internal_publication', actor: 'internal_service', method: 'POST',
  },
  plan_approval_required: {
    code: 'approve_canonical_plan', actor: 'authenticated_user', method: 'POST',
  },
  approved_snapshot_available: {
    code: 'request_execution_package', actor: 'authenticated_user', method: 'POST',
  },
  execution_in_progress: {
    code: 'run_private_work_graph', actor: 'internal_service', method: 'POST',
  },
  private_review_assembly_required: {
    code: 'assemble_private_review', actor: 'internal_service', method: 'POST',
  },
  private_review_ready: {
    code: 'record_private_review_decision', actor: 'authenticated_user', method: 'POST',
  },
  private_review_accepted: {
    code: 'await_public_delivery_authorization', actor: 'internal_service', method: 'GET',
  },
  revision_requested: {
    code: 'prepare_replacement_plan', actor: 'planning_client', method: 'POST',
  },
  cancellation_pending: {
    code: 'await_cancellation_reconciliation', actor: 'internal_service', method: 'GET',
  },
  replanning_required: {
    code: 'prepare_replacement_plan', actor: 'planning_client', method: 'POST',
  },
} as const satisfies Record<CanonicalEditJourneyStage, {
  code: string
  actor: string
  method: string
}>

const authorityFieldsByStage = {
  planning_handoff_required: {
    required: [],
    forbidden: ['planningHandoff', 'publicationRequest', 'plan', 'approval', 'execution', 'workGraphProgress', 'workGraph', 'review'],
  },
  publication_request_required: {
    required: ['planningHandoff'],
    forbidden: ['publicationRequest', 'plan', 'approval', 'execution', 'workGraphProgress', 'workGraph', 'review'],
  },
  internal_publication_pending: {
    required: ['planningHandoff', 'publicationRequest'],
    forbidden: ['plan', 'approval', 'execution', 'workGraphProgress', 'workGraph', 'review'],
  },
  plan_approval_required: {
    required: ['planningHandoff', 'plan'],
    forbidden: ['approval', 'execution', 'workGraphProgress', 'workGraph', 'review'],
  },
  approved_snapshot_available: {
    required: ['planningHandoff', 'plan', 'approval'],
    forbidden: ['execution', 'workGraphProgress', 'workGraph', 'review'],
  },
  execution_in_progress: {
    required: ['planningHandoff', 'plan', 'approval', 'execution'],
    forbidden: ['workGraph', 'review'],
  },
  private_review_assembly_required: {
    required: ['planningHandoff', 'plan', 'approval', 'execution', 'workGraph'],
    forbidden: ['workGraphProgress', 'review'],
  },
  private_review_ready: {
    required: ['planningHandoff', 'plan', 'approval', 'execution', 'review'],
    forbidden: ['workGraphProgress'],
  },
  private_review_accepted: {
    required: ['planningHandoff', 'plan', 'approval', 'execution', 'review'],
    forbidden: ['workGraphProgress'],
  },
  revision_requested: {
    required: ['planningHandoff', 'plan', 'approval', 'execution', 'review'],
    forbidden: ['workGraphProgress'],
  },
  cancellation_pending: {
    required: ['planningHandoff', 'plan'],
    forbidden: ['execution', 'workGraphProgress', 'workGraph', 'review'],
  },
  replanning_required: {
    required: ['planningHandoff', 'plan'],
    forbidden: ['execution', 'workGraphProgress', 'workGraph', 'review'],
  },
} as const satisfies Record<CanonicalEditJourneyStage, {
  required: readonly JourneyAuthorityField[]
  forbidden: readonly JourneyAuthorityField[]
}>

const canonicalEditJourneyResponseBaseSchema = z.object({
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
      'run_private_work_graph',
      'assemble_private_review',
      'record_private_review_decision',
      'await_public_delivery_authorization',
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
  execution: z.object({
    packageRecordId: identity,
    packageHash: sha,
    snapshotId: identity,
    purpose: z.literal('private_internal_execution_handoff'),
  }).strict().optional(),
  workGraphProgress: z.object({
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
    checkpointHash: sha,
    checkpointSequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    status: z.enum([
      'advancing_private_test_work_graph',
      'blocked_required_jobs',
    ]),
    runFinished: z.boolean(),
    updatedAt: z.string().datetime({ offset: true }),
    totalJobCount: z.number().int().positive().max(256),
    completedJobCount: z.number().int().nonnegative().max(256),
    capabilityBlockedJobCount: z.number().int().nonnegative().max(256),
    dependencyBlockedJobCount: z.number().int().nonnegative().max(256),
    pendingJobCount: z.number().int().nonnegative().max(256),
    requiredIncompleteJobCount: z.number().int().nonnegative().max(256),
    allRequiredJobsCompleted: z.boolean(),
    nextRequiredGate: z.enum([
      'canonical_private_work_graph_advancement',
      'canonical_job_capability_blockers',
    ]),
  }).strict().optional(),
  workGraph: z.object({
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
    responseHash: sha,
    status: z.enum([
      'completed_private_test_work_graph',
      'completed_required_jobs_with_optional_blocks',
    ]),
    completedAt: z.string().datetime({ offset: true }),
    totalJobCount: z.number().int().positive().max(256),
    completedJobCount: z.number().int().positive().max(256),
    requiredBlockedJobCount: z.literal(0),
    allRequiredJobsCompleted: z.literal(true),
    nextRequiredGate: z.literal('canonical_terminal_private_review_assembly'),
  }).strict().optional(),
  review: z.object({
    reviewAssemblyId: identity,
    manifestSha256: sha,
    finalArtifactSha256: sha,
    decision: z.enum(['accept_private_internal_review', 'request_revision']).optional(),
    decisionStatus: z.enum([
      'private_internal_review_accepted',
      'canonical_revision_requested',
    ]).optional(),
    decisionManifestSha256: sha.optional(),
    privateHistoryDownload: z.object({
      method: z.literal('GET'),
      routeTemplate: z.string().min(1).max(500),
      query: canonicalPrivateReviewHistoryDownloadQuerySchema,
    }).strict().optional(),
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

type CanonicalEditJourneyResponseValue = z.infer<typeof canonicalEditJourneyResponseBaseSchema>

export const canonicalEditJourneyResponseSchema = canonicalEditJourneyResponseBaseSchema
  .superRefine((value, context) => {
    const expectedAction = actionByStage[value.stage]
    for (const field of ['code', 'actor', 'method'] as const) {
      if (value.nextAction[field] !== expectedAction[field]) {
        invalid(context, ['nextAction', field], `Canonical journey ${field} does not match stage ${value.stage}.`)
      }
    }

    const fieldRules = authorityFieldsByStage[value.stage]
    for (const field of fieldRules.required) {
      if (value[field] === undefined) {
        invalid(context, [field], `Canonical journey ${field} is required for stage ${value.stage}.`)
      }
    }
    for (const field of fieldRules.forbidden) {
      if (value[field] !== undefined) {
        invalid(context, [field], `Canonical journey ${field} is forbidden for stage ${value.stage}.`)
      }
    }

    const expectedRoute = expectedRouteFor(value)
    if (expectedRoute !== undefined && value.nextAction.routeTemplate !== expectedRoute) {
      invalid(context, ['nextAction', 'routeTemplate'], 'Canonical journey next-action route does not match current authority.')
    }

    if (value.execution && value.approval && value.execution.snapshotId !== value.approval.snapshotId) {
      invalid(context, ['execution', 'snapshotId'], 'Canonical journey execution package is not bound to the approved snapshot.')
    }
    if (value.workGraphProgress) {
      const progress = value.workGraphProgress
      const resolvedJobCount = progress.completedJobCount +
        progress.capabilityBlockedJobCount +
        progress.dependencyBlockedJobCount
      if (
        progress.packageRecordId !== value.execution?.packageRecordId ||
        progress.approvedPlanSnapshotId !== value.approval?.snapshotId ||
        resolvedJobCount + progress.pendingJobCount !== progress.totalJobCount ||
        progress.requiredIncompleteJobCount > progress.totalJobCount - progress.completedJobCount ||
        progress.allRequiredJobsCompleted !== (progress.requiredIncompleteJobCount === 0)
      ) {
        invalid(context, ['workGraphProgress'], 'Canonical journey work-graph progress is inconsistent or has invalid lineage.')
      }
      if (
        progress.status === 'advancing_private_test_work_graph' &&
        (
          progress.runFinished ||
          progress.pendingJobCount === 0 ||
          progress.nextRequiredGate !== 'canonical_private_work_graph_advancement'
        )
      ) {
        invalid(context, ['workGraphProgress'], 'Advancing canonical journey progress is invalid.')
      }
      if (
        progress.status === 'blocked_required_jobs' &&
        (
          !progress.runFinished ||
          progress.pendingJobCount !== 0 ||
          progress.requiredIncompleteJobCount === 0 ||
          progress.allRequiredJobsCompleted ||
          progress.nextRequiredGate !== 'canonical_job_capability_blockers'
        )
      ) {
        invalid(context, ['workGraphProgress'], 'Blocked canonical journey progress is invalid.')
      }
    }
    if (
      value.workGraph &&
      (
        value.workGraph.packageRecordId !== value.execution?.packageRecordId ||
        value.workGraph.approvedPlanSnapshotId !== value.approval?.snapshotId
      )
    ) {
      invalid(context, ['workGraph'], 'Canonical journey work-graph completion is not bound to its package and snapshot.')
    }

    const unpublishedStages: CanonicalEditJourneyStage[] = [
      'publication_request_required',
      'internal_publication_pending',
    ]
    if (
      value.planningHandoff &&
      value.planningHandoff.publicationStatus !==
        (unpublishedStages.includes(value.stage) ? 'unpublished' : 'published')
    ) {
      invalid(context, ['planningHandoff', 'publicationStatus'], 'Canonical journey handoff publication status conflicts with its stage.')
    }

    if (value.stage === 'plan_approval_required') {
      if (value.plan?.status !== 'presented' || value.plan.estimateStatus !== 'presented') {
        invalid(context, ['plan'], 'Canonical journey plan approval requires a presented plan and estimate.')
      }
    }
    if ([
      'approved_snapshot_available',
      'execution_in_progress',
      'private_review_assembly_required',
      'private_review_ready',
      'private_review_accepted',
      'revision_requested',
    ].includes(value.stage)) {
      if (value.plan?.status !== 'approved' || value.plan.estimateStatus !== 'approved') {
        invalid(context, ['plan'], 'Canonical journey post-approval stage requires an approved plan and estimate.')
      }
    }
    if (value.stage === 'cancellation_pending' && value.plan?.status !== 'cancellation_pending') {
      invalid(context, ['plan', 'status'], 'Canonical journey cancellation stage requires cancellation-pending plan authority.')
    }
    if (
      value.stage === 'replanning_required' &&
      value.plan &&
      !['superseded', 'rejected', 'cancelled'].includes(value.plan.status)
    ) {
      invalid(context, ['plan', 'status'], 'Canonical journey replanning stage requires terminal prior-plan authority.')
    }

    if (value.stage === 'private_review_ready' && value.review) {
      if (
        value.review.decision !== undefined ||
        value.review.decisionStatus !== undefined ||
        value.review.decisionManifestSha256 !== undefined ||
        value.review.privateHistoryDownload !== undefined
      ) {
        invalid(context, ['review'], 'Review-ready journey state must not contain a completed decision.')
      }
    }
    if (value.stage === 'revision_requested' && value.review) {
      if (
        value.review.decision !== 'request_revision' ||
        value.review.decisionStatus !== 'canonical_revision_requested' ||
        value.review.decisionManifestSha256 === undefined ||
        value.review.privateHistoryDownload === undefined
      ) {
        invalid(context, ['review'], 'Revision journey state requires the exact persisted revision decision.')
      }
    }
    if (value.stage === 'private_review_accepted' && value.review) {
      if (
        value.review.decision !== 'accept_private_internal_review' ||
        value.review.decisionStatus !== 'private_internal_review_accepted' ||
        value.review.decisionManifestSha256 === undefined ||
        value.review.privateHistoryDownload === undefined
      ) {
        invalid(context, ['review'], 'Accepted journey state requires the exact persisted acceptance decision.')
      }
    }
    if (value.review?.privateHistoryDownload) {
      const descriptor = value.review.privateHistoryDownload
      if (
        descriptor.routeTemplate !==
          `/v1/edit-executions/private-review-history/${value.review.reviewAssemblyId}/file` ||
        descriptor.query.workspaceId !== value.identity.workspaceId ||
        descriptor.query.packageRecordId !== value.execution?.packageRecordId ||
        descriptor.query.expectedDecisionManifestSha256 !== value.review.decisionManifestSha256 ||
        descriptor.query.expectedFinalArtifactSha256 !== value.review.finalArtifactSha256
      ) {
        invalid(context, ['review', 'privateHistoryDownload'], 'Private-review history descriptor lineage is invalid.')
      }
    }
  })

export type CanonicalEditJourneyResponse = z.infer<typeof canonicalEditJourneyResponseSchema>

function expectedRouteFor(value: CanonicalEditJourneyResponseValue): string | undefined {
  const projectRoute = (suffix: string) =>
    `/v1/projects/${value.identity.projectId}/edit-sessions/${value.identity.editSessionId}/${suffix}`
  switch (value.stage) {
    case 'planning_handoff_required':
    case 'revision_requested':
    case 'replanning_required':
      return projectRoute('canonical-planning-handoff')
    case 'publication_request_required':
      return value.planningHandoff
        ? projectRoute(`canonical-planning-handoffs/${value.planningHandoff.handoffId}/publication-requests`)
        : undefined
    case 'internal_publication_pending':
      return value.planningHandoff && value.publicationRequest
        ? projectRoute(
            `canonical-planning-handoffs/${value.planningHandoff.handoffId}/` +
            `publication-requests/${value.publicationRequest.candidateId}/publish`,
          )
        : undefined
    case 'plan_approval_required':
      return value.plan ? `/v1/edit-plans/${value.plan.planId}/approve` : undefined
    case 'approved_snapshot_available':
      return '/v1/edit-executions/packages'
    case 'execution_in_progress':
      return value.execution
        ? `/v1/edit-executions/packages/${value.execution.packageRecordId}/private-internal-work-graph-runs`
        : undefined
    case 'private_review_assembly_required':
      return value.execution
        ? `/v1/edit-executions/packages/${value.execution.packageRecordId}/private-review-assemblies`
        : undefined
    case 'private_review_ready':
      return value.review
        ? `/v1/edit-executions/private-review-assemblies/${value.review.reviewAssemblyId}/decisions`
        : undefined
    case 'private_review_accepted':
      return projectRoute('canonical-journey')
    case 'cancellation_pending':
      if (value.approval) return `/v1/approved-snapshots/${value.approval.snapshotId}/authority`
      return value.plan ? `/v1/edit-plans/${value.plan.planId}/authority` : undefined
  }
}

function invalid(context: z.RefinementCtx, path: (string | number)[], message: string): void {
  context.addIssue({ code: z.ZodIssueCode.custom, path, message })
}
