import type { ReeditProChatMessageStatus } from '../types'

export const CANONICAL_EDIT_JOURNEY_STAGES = [
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
] as const

export type CanonicalEditJourneyStage = typeof CANONICAL_EDIT_JOURNEY_STAGES[number]

export type CanonicalEditJourneyIdentity = {
  workspaceId: string
  projectId: string
  editSessionId: string
}

export type CanonicalEditJourneyProgress = {
  state: 'advancing' | 'blocked' | 'complete'
  totalJobCount: number
  completedJobCount: number
  pendingJobCount: number
  blockedJobCount: number
  updatedAt?: string
}

export type CanonicalEditJourney = {
  identity: CanonicalEditJourneyIdentity
  stage: CanonicalEditJourneyStage
  approvedSnapshotIdentity?: {
    snapshotId: string
    expectedSnapshotHash: string
  }
  approvalAuthority?: {
    planId: string
    estimateId: string
    expectedPlanHash: string
    expectedEstimateHash: string
  }
  executionPackageAuthority?: {
    snapshotId: string
    expectedSnapshotHash: string
  }
  privateEditPreparationAuthority?: {
    packageRecordId: string
    expectedPackageHash: string
    snapshotId: string
    expectedSnapshotHash: string
  }
  privateReviewMediaAuthority?: {
    mode: 'current' | 'history'
    reviewAssemblyId: string
    packageRecordId: string
    expectedFinalArtifactSha256: string
    expectedManifestSha256?: string
    expectedDecisionManifestSha256?: string
  }
  privateReviewDecisionAuthority?: {
    reviewAssemblyId: string
    packageRecordId: string
    expectedManifestSha256: string
    expectedFinalArtifactSha256: string
  }
  privateFinalDownloadAuthority?: {
    reviewAssemblyId: string
    packageRecordId: string
    expectedDecisionManifestSha256: string
    expectedFinalArtifactSha256: string
    routeTemplate: string
  }
  plan?: {
    version: number
    status: 'presented' | 'approved' | 'superseded' | 'rejected' | 'cancellation_pending' | 'cancelled'
    estimateStatus: 'presented' | 'approved' | 'superseded' | 'expired' | 'rejected' | 'cancelled'
    maximumCredits: number
    workItemCount: number
  }
  approval?: {
    reservedCredits: number
    reservationStatus: 'reserved' | 'partially_spent' | 'spent' | 'released' | 'refunded' | 'cancelled' | 'expired'
    jobCount: number
  }
  progress?: CanonicalEditJourneyProgress
  review?: {
    decision?: 'accept_private_internal_review' | 'request_revision'
    decisionStatus?: 'private_internal_review_accepted' | 'canonical_revision_requested'
  }
  inspectionOnly: true
  testOnly: true
}

export type CanonicalEditJourneyParseResult =
  | { ok: true; value: CanonicalEditJourney }
  | { ok: false; error: string }

export type CanonicalEditJourneyTone = 'neutral' | 'active' | 'attention' | 'success'

export type CanonicalEditJourneyPresentation = {
  badge: string
  boundary: string
  messageStatus: ReeditProChatMessageStatus
  nextStep: string
  progress?: CanonicalEditJourneyProgress
  requiresUserAction: boolean
  summary: string
  title: string
  tone: CanonicalEditJourneyTone
}

type WirePlanningHandoff = {
  handoffId: string
  handoffHash: string
  canonicalPlanComponentsHash: string
  publicationStatus: 'unpublished' | 'published'
}

type WirePublicationRequest = {
  candidateId: string
  candidateHash: string
  publicationRequestHash: string
  publicationStatus: 'pending_internal_publication' | 'published' | 'superseded_by_competing_candidate'
}

type WirePlan = {
  planId: string
  planVersion: number
  status: 'presented' | 'approved' | 'superseded' | 'rejected' | 'cancellation_pending' | 'cancelled'
  planHash: string
  estimateId: string
  estimateStatus: 'presented' | 'approved' | 'superseded' | 'expired' | 'rejected' | 'cancelled'
  estimateHash: string
  approvedMaximumCredits: number
  workItemCount: number
}

type WireApproval = {
  approvalId: string
  snapshotId: string
  snapshotHash: string
  reservationId: string
  reservationStatus: 'reserved' | 'partially_spent' | 'spent' | 'released' | 'refunded' | 'cancelled' | 'expired'
  reservedCredits: number
  jobCount: number
  readyJobCount: number
  blockedJobCount: number
}

type WireExecution = {
  packageRecordId: string
  packageHash: string
  snapshotId: string
  purpose: 'private_internal_execution_handoff'
}

type WireProgress = {
  packageRecordId: string
  approvedPlanSnapshotId: string
  checkpointHash: string
  checkpointSequence: number
  status: 'advancing_private_test_work_graph' | 'blocked_required_jobs'
  runFinished: boolean
  updatedAt: string
  totalJobCount: number
  completedJobCount: number
  capabilityBlockedJobCount: number
  dependencyBlockedJobCount: number
  pendingJobCount: number
  requiredIncompleteJobCount: number
  allRequiredJobsCompleted: boolean
  nextRequiredGate: 'canonical_private_work_graph_advancement' | 'canonical_job_capability_blockers'
}

type WireCompletedWorkGraph = {
  packageRecordId: string
  approvedPlanSnapshotId: string
  responseHash: string
  status: 'completed_private_test_work_graph' | 'completed_required_jobs_with_optional_blocks'
  completedAt: string
  totalJobCount: number
  completedJobCount: number
  requiredBlockedJobCount: 0
  allRequiredJobsCompleted: true
  nextRequiredGate: 'canonical_terminal_private_review_assembly'
}

type WireReview = {
  reviewAssemblyId: string
  manifestSha256: string
  finalArtifactSha256: string
  decision?: 'accept_private_internal_review' | 'request_revision'
  decisionStatus?: 'private_internal_review_accepted' | 'canonical_revision_requested'
  decisionManifestSha256?: string
  privateHistoryDownload?: {
    method: 'GET'
    routeTemplate: string
    query: {
      workspaceId: string
      packageRecordId: string
      expectedDecisionManifestSha256: string
      expectedFinalArtifactSha256: string
      purpose: 'download_canonical_private_review_history_artifact'
    }
  }
  acceptedFinalDownload?: {
    method: 'GET'
    routeTemplate: string
    query: {
      workspaceId: string
      packageRecordId: string
      expectedDecisionManifestSha256: string
      expectedFinalArtifactSha256: string
      purpose: 'download_accepted_canonical_private_final_artifact'
    }
  }
}

type WireJourney = {
  identity: CanonicalEditJourneyIdentity
  stage: CanonicalEditJourneyStage
  nextAction: {
    code: string
    actor: 'authenticated_user' | 'planning_client' | 'internal_service'
    method: 'GET' | 'POST'
    routeTemplate: string
  }
  planningHandoff?: WirePlanningHandoff
  publicationRequest?: WirePublicationRequest
  plan?: WirePlan
  approval?: WireApproval
  execution?: WireExecution
  workGraphProgress?: WireProgress
  workGraph?: WireCompletedWorkGraph
  review?: WireReview
}

const identityPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const shaPattern = /^[a-f0-9]{64}$/
const offsetDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

const rootKeys = new Set([
  'schemaVersion',
  'source',
  'identity',
  'stage',
  'nextAction',
  'planningHandoff',
  'publicationRequest',
  'plan',
  'approval',
  'execution',
  'workGraphProgress',
  'workGraph',
  'review',
  'permissions',
  'testOnly',
])

const actionByStage: Record<CanonicalEditJourneyStage, {
  code: string
  actor: WireJourney['nextAction']['actor']
  method: WireJourney['nextAction']['method']
}> = {
  planning_handoff_required: { code: 'prepare_planning_handoff', actor: 'planning_client', method: 'POST' },
  publication_request_required: { code: 'submit_publication_request', actor: 'planning_client', method: 'POST' },
  internal_publication_pending: { code: 'await_internal_publication', actor: 'internal_service', method: 'POST' },
  plan_approval_required: { code: 'approve_canonical_plan', actor: 'authenticated_user', method: 'POST' },
  approved_snapshot_available: { code: 'request_execution_package', actor: 'authenticated_user', method: 'POST' },
  execution_in_progress: { code: 'prepare_private_edit_review', actor: 'authenticated_user', method: 'POST' },
  private_review_assembly_required: { code: 'prepare_private_edit_review', actor: 'authenticated_user', method: 'POST' },
  private_review_ready: { code: 'record_private_review_decision', actor: 'authenticated_user', method: 'POST' },
  private_review_accepted: { code: 'await_public_delivery_authorization', actor: 'internal_service', method: 'GET' },
  revision_requested: { code: 'prepare_replacement_plan', actor: 'planning_client', method: 'POST' },
  cancellation_pending: { code: 'await_cancellation_reconciliation', actor: 'internal_service', method: 'GET' },
  replanning_required: { code: 'prepare_replacement_plan', actor: 'planning_client', method: 'POST' },
}

const authorityRules: Record<CanonicalEditJourneyStage, {
  required: readonly (keyof Pick<WireJourney, 'planningHandoff' | 'publicationRequest' | 'plan' | 'approval' | 'execution' | 'workGraphProgress' | 'workGraph' | 'review'>)[]
  forbidden: readonly (keyof Pick<WireJourney, 'planningHandoff' | 'publicationRequest' | 'plan' | 'approval' | 'execution' | 'workGraphProgress' | 'workGraph' | 'review'>)[]
}> = {
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
}

export function parseCanonicalEditJourney(
  input: unknown,
  expectedIdentity: CanonicalEditJourneyIdentity,
): CanonicalEditJourneyParseResult {
  try {
    const root = strictRecord(input, 'journey', rootKeys)
    literalString(root, 'schemaVersion', 'canonical-edit-journey-recovery-v1')
    literalString(root, 'source', 'canonical_edit_journey_service')
    literalBoolean(root, 'testOnly', true)

    const identityRecord = strictRecord(root.identity, 'journey identity', new Set(['workspaceId', 'projectId', 'editSessionId']))
    const identity: CanonicalEditJourneyIdentity = {
      workspaceId: identityValue(identityRecord, 'workspaceId'),
      projectId: identityValue(identityRecord, 'projectId'),
      editSessionId: identityValue(identityRecord, 'editSessionId'),
    }
    if (
      identity.workspaceId !== expectedIdentity.workspaceId ||
      identity.projectId !== expectedIdentity.projectId ||
      identity.editSessionId !== expectedIdentity.editSessionId
    ) {
      throw new Error('journey identity does not match the signed-in edit route')
    }

    const stage = enumValue(root, 'stage', CANONICAL_EDIT_JOURNEY_STAGES)
    const nextAction = parseNextAction(root.nextAction)
    const planningHandoff = optionalRecord(root, 'planningHandoff', parsePlanningHandoff)
    const publicationRequest = optionalRecord(root, 'publicationRequest', parsePublicationRequest)
    const plan = optionalRecord(root, 'plan', parsePlan)
    const approval = optionalRecord(root, 'approval', parseApproval)
    const execution = optionalRecord(root, 'execution', parseExecution)
    const workGraphProgress = optionalRecord(root, 'workGraphProgress', parseProgress)
    const workGraph = optionalRecord(root, 'workGraph', parseCompletedWorkGraph)
    const review = optionalRecord(root, 'review', parseReview)

    const journey: WireJourney = {
      identity,
      stage,
      nextAction,
      planningHandoff,
      publicationRequest,
      plan,
      approval,
      execution,
      workGraphProgress,
      workGraph,
      review,
    }

    validatePermissions(root.permissions)
    validateStageAuthority(journey)
    validateLineage(journey)

    return {
      ok: true,
      value: {
        identity,
        stage,
        approvedSnapshotIdentity: approval
          ? {
              snapshotId: approval.snapshotId,
              expectedSnapshotHash: approval.snapshotHash,
            }
          : undefined,
        approvalAuthority: stage === 'plan_approval_required' && plan
          ? {
              planId: plan.planId,
              estimateId: plan.estimateId,
              expectedPlanHash: plan.planHash,
              expectedEstimateHash: plan.estimateHash,
            }
          : undefined,
        executionPackageAuthority: stage === 'approved_snapshot_available' && approval
          ? {
              snapshotId: approval.snapshotId,
              expectedSnapshotHash: approval.snapshotHash,
            }
          : undefined,
        privateEditPreparationAuthority: (
          stage === 'execution_in_progress' ||
          stage === 'private_review_assembly_required'
        ) && approval && execution
          ? {
              packageRecordId: execution.packageRecordId,
              expectedPackageHash: execution.packageHash,
              snapshotId: approval.snapshotId,
              expectedSnapshotHash: approval.snapshotHash,
            }
          : undefined,
        privateReviewMediaAuthority: review && execution
          ? stage === 'private_review_ready'
            ? {
                mode: 'current',
                reviewAssemblyId: review.reviewAssemblyId,
                packageRecordId: execution.packageRecordId,
                expectedManifestSha256: review.manifestSha256,
                expectedFinalArtifactSha256: review.finalArtifactSha256,
              }
            : (
                stage === 'private_review_accepted' ||
                stage === 'revision_requested'
              ) && review.privateHistoryDownload
              ? {
                  mode: 'history',
                  reviewAssemblyId: review.reviewAssemblyId,
                  packageRecordId: execution.packageRecordId,
                  expectedDecisionManifestSha256:
                    review.privateHistoryDownload.query.expectedDecisionManifestSha256,
                  expectedFinalArtifactSha256: review.finalArtifactSha256,
                }
              : undefined
          : undefined,
        privateReviewDecisionAuthority:
          stage === 'private_review_ready' && review && execution
            ? {
                reviewAssemblyId: review.reviewAssemblyId,
                packageRecordId: execution.packageRecordId,
                expectedManifestSha256: review.manifestSha256,
                expectedFinalArtifactSha256: review.finalArtifactSha256,
              }
            : undefined,
        privateFinalDownloadAuthority:
          stage === 'private_review_accepted' &&
          review?.acceptedFinalDownload &&
          execution
            ? {
                reviewAssemblyId: review.reviewAssemblyId,
                packageRecordId: execution.packageRecordId,
                expectedDecisionManifestSha256:
                  review.acceptedFinalDownload.query
                    .expectedDecisionManifestSha256,
                expectedFinalArtifactSha256:
                  review.acceptedFinalDownload.query
                    .expectedFinalArtifactSha256,
                routeTemplate:
                  review.acceptedFinalDownload.routeTemplate,
              }
            : undefined,
        plan: plan && {
          version: plan.planVersion,
          status: plan.status,
          estimateStatus: plan.estimateStatus,
          maximumCredits: plan.approvedMaximumCredits,
          workItemCount: plan.workItemCount,
        },
        approval: approval && {
          reservedCredits: approval.reservedCredits,
          reservationStatus: approval.reservationStatus,
          jobCount: approval.jobCount,
        },
        progress: projectProgress(workGraphProgress, workGraph),
        review: review && {
          decision: review.decision,
          decisionStatus: review.decisionStatus,
        },
        inspectionOnly: true,
        testOnly: true,
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error
        ? `Canonical edit journey response was rejected: ${error.message}.`
        : 'Canonical edit journey response was rejected.',
    }
  }
}

export function createCanonicalEditJourneyPresentation(
  journey: CanonicalEditJourney,
): CanonicalEditJourneyPresentation {
  const boundary = 'This status is read-only. It does not start editing, spend credits, or publish the video.'
  const planVersion = journey.plan?.version
  const creditLimit = journey.plan?.maximumCredits
  const planAndCredits = planVersion && creditLimit !== undefined
    ? `Plan v${planVersion} is set to use up to ${creditLimit} credits.`
    : planVersion
      ? `Plan v${planVersion} is the current saved version.`
      : ''

  switch (journey.stage) {
    case 'planning_handoff_required':
      return presentation({
        badge: 'Planning setup',
        title: 'Ready to prepare the plan',
        summary: 'Your saved source and edit choices still need to become one reviewable plan.',
        nextStep: 'Continue the setup below. ReeditPro will show the plan and exact credit estimate before anything runs.',
        tone: 'neutral',
        messageStatus: 'pending',
        boundary,
      })
    case 'publication_request_required':
      return presentation({
        badge: 'Plan preparation',
        title: 'Edit direction is ready',
        summary: 'The saved planning context is ready to become the exact plan you will review.',
        nextStep: 'Keep working in this edit. Approval remains unavailable until that plan and estimate are ready.',
        tone: 'active',
        messageStatus: 'loading',
        boundary,
      })
    case 'internal_publication_pending':
      return presentation({
        badge: 'Preparing plan',
        title: 'Preparing your edit plan',
        summary: 'ReeditPro is validating the saved direction before presenting a plan version.',
        nextStep: 'No action is needed yet. The plan review will appear when validation finishes.',
        tone: 'active',
        messageStatus: 'loading',
        boundary,
      })
    case 'plan_approval_required':
      return presentation({
        badge: 'Your review',
        title: 'Plan and estimate ready',
        summary: planAndCredits || 'The exact plan and credit estimate are ready for review.',
        nextStep: 'Review the creative direction and credit limit below, then approve it or request a change.',
        tone: 'attention',
        messageStatus: 'pending',
        requiresUserAction: true,
        boundary,
      })
    case 'approved_snapshot_available':
      return presentation({
        badge: 'Approved',
        title: 'Approval is safely recorded',
        summary: planAndCredits || 'The approved plan is locked to the version you reviewed.',
        nextStep: 'ReeditPro can now prepare the private review from that exact approved version.',
        tone: 'active',
        messageStatus: 'approved',
        boundary,
      })
    case 'execution_in_progress': {
      const progress = journey.progress
      if (!progress) {
        return presentation({
          badge: 'Handoff ready',
          title: 'Private preparation handoff is ready',
          summary: 'The exact approved version is packaged for the private editing pipeline.',
          nextStep: 'Backend preparation has not reported progress yet. Refresh later to recover the latest saved state.',
          tone: 'neutral',
          messageStatus: 'pending',
          boundary,
        })
      }
      const isBlocked = progress?.state === 'blocked'
      const summary = `${progress.completedJobCount} of ${progress.totalJobCount} preparation steps are complete.`
      return presentation({
        badge: isBlocked ? 'Needs attention' : 'Preparing',
        title: isBlocked ? 'Private review preparation is paused' : 'Preparing private review',
        summary,
        nextStep: isBlocked
          ? 'ReeditPro is holding the edit until the required preparation checks can pass.'
          : 'You can leave this page and return later. The saved workflow will recover the latest progress.',
        tone: isBlocked ? 'attention' : 'active',
        messageStatus: isBlocked ? 'warning' : 'generating',
        progress,
        boundary,
      })
    }
    case 'private_review_assembly_required':
      return presentation({
        badge: 'Final checks',
        title: 'Assembling the private review',
        summary: journey.progress
          ? `All ${journey.progress.totalJobCount} required preparation steps are complete.`
          : 'Required preparation is complete for the approved plan.',
        nextStep: 'ReeditPro is assembling the exact review version. Public sharing remains off.',
        tone: 'active',
        messageStatus: 'generating',
        progress: journey.progress,
        boundary,
      })
    case 'private_review_ready':
      return presentation({
        badge: 'Your review',
        title: 'Private review ready',
        summary: 'The review version is ready to play against the approved plan.',
        nextStep: 'Watch the review, then approve the edit or request specific changes.',
        tone: 'attention',
        messageStatus: 'preview_ready',
        requiresUserAction: true,
        boundary,
      })
    case 'revision_requested':
      return presentation({
        badge: 'Revision',
        title: 'Changes are saved',
        summary: 'The previous review remains attached as context, but it cannot authorize a revised edit.',
        nextStep: 'Describe or confirm the changes below. A fresh plan, estimate, approval, and private review are required.',
        tone: 'attention',
        messageStatus: 'warning',
        requiresUserAction: true,
        boundary,
      })
    case 'private_review_accepted':
      return presentation({
        badge: 'Approved',
        title: 'Private review approved',
        summary: 'Your review decision is saved against the exact approved edit version.',
        nextStep: 'Public delivery is still a separate release step and has not started.',
        tone: 'success',
        messageStatus: 'success',
        boundary,
      })
    case 'cancellation_pending':
      return presentation({
        badge: 'Reconciling',
        title: 'Cancellation is being reconciled',
        summary: 'The saved plan remains closed while ReeditPro resolves its approval and credit state.',
        nextStep: 'No new edit work can start from this plan. Return later or refresh the saved status.',
        tone: 'attention',
        messageStatus: 'warning',
        boundary,
      })
    case 'replanning_required':
      return presentation({
        badge: 'New plan needed',
        title: 'This edit needs a fresh plan',
        summary: 'The previous plan is no longer eligible to run or approve.',
        nextStep: 'Continue below to prepare a replacement plan and credit estimate from the current source and direction.',
        tone: 'attention',
        messageStatus: 'warning',
        requiresUserAction: true,
        boundary,
      })
  }
}

export function canonicalJourneyShouldAutoRefresh(stage: CanonicalEditJourneyStage): boolean {
  return [
    'internal_publication_pending',
    'execution_in_progress',
    'private_review_assembly_required',
    'cancellation_pending',
  ].includes(stage)
}

function presentation(
  value: Omit<CanonicalEditJourneyPresentation, 'requiresUserAction'> & { requiresUserAction?: boolean },
): CanonicalEditJourneyPresentation {
  return {
    requiresUserAction: false,
    ...value,
  }
}

function strictRecord(value: unknown, label: string, allowedKeys: Set<string>): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  const record = value as Record<string, unknown>
  const unexpected = Object.keys(record).filter((key) => !allowedKeys.has(key))
  if (unexpected.length > 0) {
    throw new Error(`${label} contains unsupported fields`)
  }
  return record
}

function optionalRecord<T>(
  record: Record<string, unknown>,
  key: string,
  parser: (value: unknown) => T,
): T | undefined {
  return record[key] === undefined ? undefined : parser(record[key])
}

function requiredString(record: Record<string, unknown>, key: string, maximumLength = 500): string {
  const value = record[key]
  if (typeof value !== 'string' || value.length < 1 || value.length > maximumLength) {
    throw new Error(`${key} is invalid`)
  }
  return value
}

function literalString(record: Record<string, unknown>, key: string, expected: string): string {
  const value = requiredString(record, key, Math.max(500, expected.length))
  if (value !== expected) throw new Error(`${key} is unsupported`)
  return value
}

function literalBoolean(record: Record<string, unknown>, key: string, expected: boolean): boolean {
  const value = record[key]
  if (value !== expected) throw new Error(`${key} is invalid`)
  return value
}

function identityValue(record: Record<string, unknown>, key: string): string {
  const value = requiredString(record, key, 200)
  if (value !== value.trim() || value.includes('..') || !identityPattern.test(value)) {
    throw new Error(`${key} identity is invalid`)
  }
  return value
}

function shaValue(record: Record<string, unknown>, key: string): string {
  const value = requiredString(record, key, 64)
  if (!shaPattern.test(value)) throw new Error(`${key} hash is invalid`)
  return value
}

function integerValue(record: Record<string, unknown>, key: string, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): number {
  const value = record[key]
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new Error(`${key} count is invalid`)
  }
  return value as number
}

function booleanValue(record: Record<string, unknown>, key: string): boolean {
  const value = record[key]
  if (typeof value !== 'boolean') throw new Error(`${key} must be a boolean`)
  return value
}

function dateValue(record: Record<string, unknown>, key: string): string {
  const value = requiredString(record, key, 100)
  if (!offsetDatePattern.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${key} timestamp is invalid`)
  }
  return value
}

function enumValue<const T extends readonly string[]>(
  record: Record<string, unknown>,
  key: string,
  values: T,
): T[number] {
  const value = record[key]
  if (typeof value !== 'string' || !values.includes(value)) {
    throw new Error(`${key} is unsupported`)
  }
  return value as T[number]
}

function parseNextAction(value: unknown): WireJourney['nextAction'] {
  const record = strictRecord(value, 'next action', new Set(['code', 'actor', 'method', 'routeTemplate']))
  return {
    code: requiredString(record, 'code', 100),
    actor: enumValue(record, 'actor', ['authenticated_user', 'planning_client', 'internal_service'] as const),
    method: enumValue(record, 'method', ['GET', 'POST'] as const),
    routeTemplate: requiredString(record, 'routeTemplate', 500),
  }
}

function parsePlanningHandoff(value: unknown): WirePlanningHandoff {
  const record = strictRecord(value, 'planning handoff', new Set([
    'handoffId', 'handoffHash', 'canonicalPlanComponentsHash', 'publicationStatus',
  ]))
  return {
    handoffId: identityValue(record, 'handoffId'),
    handoffHash: shaValue(record, 'handoffHash'),
    canonicalPlanComponentsHash: shaValue(record, 'canonicalPlanComponentsHash'),
    publicationStatus: enumValue(record, 'publicationStatus', ['unpublished', 'published'] as const),
  }
}

function parsePublicationRequest(value: unknown): WirePublicationRequest {
  const record = strictRecord(value, 'publication request', new Set([
    'candidateId', 'candidateHash', 'publicationRequestHash', 'publicationStatus',
  ]))
  return {
    candidateId: identityValue(record, 'candidateId'),
    candidateHash: shaValue(record, 'candidateHash'),
    publicationRequestHash: shaValue(record, 'publicationRequestHash'),
    publicationStatus: enumValue(record, 'publicationStatus', [
      'pending_internal_publication', 'published', 'superseded_by_competing_candidate',
    ] as const),
  }
}

function parsePlan(value: unknown): WirePlan {
  const record = strictRecord(value, 'plan', new Set([
    'planId', 'planVersion', 'status', 'planHash', 'estimateId', 'estimateStatus', 'estimateHash',
    'approvedMaximumCredits', 'workItemCount',
  ]))
  return {
    planId: identityValue(record, 'planId'),
    planVersion: integerValue(record, 'planVersion', 1),
    status: enumValue(record, 'status', [
      'presented', 'approved', 'superseded', 'rejected', 'cancellation_pending', 'cancelled',
    ] as const),
    planHash: shaValue(record, 'planHash'),
    estimateId: identityValue(record, 'estimateId'),
    estimateStatus: enumValue(record, 'estimateStatus', [
      'presented', 'approved', 'superseded', 'expired', 'rejected', 'cancelled',
    ] as const),
    estimateHash: shaValue(record, 'estimateHash'),
    approvedMaximumCredits: integerValue(record, 'approvedMaximumCredits'),
    workItemCount: integerValue(record, 'workItemCount'),
  }
}

function parseApproval(value: unknown): WireApproval {
  const record = strictRecord(value, 'approval', new Set([
    'approvalId', 'snapshotId', 'snapshotHash', 'reservationId', 'reservationStatus',
    'reservedCredits', 'jobCount', 'readyJobCount', 'blockedJobCount',
  ]))
  return {
    approvalId: identityValue(record, 'approvalId'),
    snapshotId: identityValue(record, 'snapshotId'),
    snapshotHash: shaValue(record, 'snapshotHash'),
    reservationId: identityValue(record, 'reservationId'),
    reservationStatus: enumValue(record, 'reservationStatus', [
      'reserved', 'partially_spent', 'spent', 'released', 'refunded', 'cancelled', 'expired',
    ] as const),
    reservedCredits: integerValue(record, 'reservedCredits'),
    jobCount: integerValue(record, 'jobCount'),
    readyJobCount: integerValue(record, 'readyJobCount'),
    blockedJobCount: integerValue(record, 'blockedJobCount'),
  }
}

function parseExecution(value: unknown): WireExecution {
  const record = strictRecord(value, 'execution', new Set(['packageRecordId', 'packageHash', 'snapshotId', 'purpose']))
  return {
    packageRecordId: identityValue(record, 'packageRecordId'),
    packageHash: shaValue(record, 'packageHash'),
    snapshotId: identityValue(record, 'snapshotId'),
    purpose: literalString(record, 'purpose', 'private_internal_execution_handoff') as WireExecution['purpose'],
  }
}

function parseProgress(value: unknown): WireProgress {
  const record = strictRecord(value, 'work graph progress', new Set([
    'packageRecordId', 'approvedPlanSnapshotId', 'checkpointHash', 'checkpointSequence', 'status',
    'runFinished', 'updatedAt', 'totalJobCount', 'completedJobCount', 'capabilityBlockedJobCount',
    'dependencyBlockedJobCount', 'pendingJobCount', 'requiredIncompleteJobCount',
    'allRequiredJobsCompleted', 'nextRequiredGate',
  ]))
  return {
    packageRecordId: identityValue(record, 'packageRecordId'),
    approvedPlanSnapshotId: identityValue(record, 'approvedPlanSnapshotId'),
    checkpointHash: shaValue(record, 'checkpointHash'),
    checkpointSequence: integerValue(record, 'checkpointSequence', 1),
    status: enumValue(record, 'status', ['advancing_private_test_work_graph', 'blocked_required_jobs'] as const),
    runFinished: booleanValue(record, 'runFinished'),
    updatedAt: dateValue(record, 'updatedAt'),
    totalJobCount: integerValue(record, 'totalJobCount', 1, 256),
    completedJobCount: integerValue(record, 'completedJobCount', 0, 256),
    capabilityBlockedJobCount: integerValue(record, 'capabilityBlockedJobCount', 0, 256),
    dependencyBlockedJobCount: integerValue(record, 'dependencyBlockedJobCount', 0, 256),
    pendingJobCount: integerValue(record, 'pendingJobCount', 0, 256),
    requiredIncompleteJobCount: integerValue(record, 'requiredIncompleteJobCount', 0, 256),
    allRequiredJobsCompleted: booleanValue(record, 'allRequiredJobsCompleted'),
    nextRequiredGate: enumValue(record, 'nextRequiredGate', [
      'canonical_private_work_graph_advancement', 'canonical_job_capability_blockers',
    ] as const),
  }
}

function parseCompletedWorkGraph(value: unknown): WireCompletedWorkGraph {
  const record = strictRecord(value, 'completed work graph', new Set([
    'packageRecordId', 'approvedPlanSnapshotId', 'responseHash', 'status', 'completedAt',
    'totalJobCount', 'completedJobCount', 'requiredBlockedJobCount', 'allRequiredJobsCompleted',
    'nextRequiredGate',
  ]))
  literalBoolean(record, 'allRequiredJobsCompleted', true)
  literalString(record, 'nextRequiredGate', 'canonical_terminal_private_review_assembly')
  if (integerValue(record, 'requiredBlockedJobCount') !== 0) {
    throw new Error('completed work graph contains required blockers')
  }
  return {
    packageRecordId: identityValue(record, 'packageRecordId'),
    approvedPlanSnapshotId: identityValue(record, 'approvedPlanSnapshotId'),
    responseHash: shaValue(record, 'responseHash'),
    status: enumValue(record, 'status', [
      'completed_private_test_work_graph', 'completed_required_jobs_with_optional_blocks',
    ] as const),
    completedAt: dateValue(record, 'completedAt'),
    totalJobCount: integerValue(record, 'totalJobCount', 1, 256),
    completedJobCount: integerValue(record, 'completedJobCount', 1, 256),
    requiredBlockedJobCount: 0,
    allRequiredJobsCompleted: true,
    nextRequiredGate: 'canonical_terminal_private_review_assembly',
  }
}

function parseReview(value: unknown): WireReview {
  const record = strictRecord(value, 'review', new Set([
    'reviewAssemblyId', 'manifestSha256', 'finalArtifactSha256', 'decision', 'decisionStatus',
    'decisionManifestSha256', 'privateHistoryDownload',
    'acceptedFinalDownload',
  ]))
  const decision = record.decision === undefined
    ? undefined
    : enumValue(record, 'decision', ['accept_private_internal_review', 'request_revision'] as const)
  const decisionStatus = record.decisionStatus === undefined
    ? undefined
    : enumValue(record, 'decisionStatus', ['private_internal_review_accepted', 'canonical_revision_requested'] as const)
  const decisionManifestSha256 = record.decisionManifestSha256 === undefined
    ? undefined
    : shaValue(record, 'decisionManifestSha256')
  const privateHistoryDownload = record.privateHistoryDownload === undefined
    ? undefined
    : parsePrivateHistoryDownload(record.privateHistoryDownload)
  const acceptedFinalDownload = record.acceptedFinalDownload === undefined
    ? undefined
    : parseAcceptedFinalDownload(record.acceptedFinalDownload)
  return {
    reviewAssemblyId: identityValue(record, 'reviewAssemblyId'),
    manifestSha256: shaValue(record, 'manifestSha256'),
    finalArtifactSha256: shaValue(record, 'finalArtifactSha256'),
    decision,
    decisionStatus,
    decisionManifestSha256,
    privateHistoryDownload,
    acceptedFinalDownload,
  }
}

function parsePrivateHistoryDownload(value: unknown): NonNullable<WireReview['privateHistoryDownload']> {
  const record = strictRecord(value, 'private history descriptor', new Set(['method', 'routeTemplate', 'query']))
  const query = strictRecord(record.query, 'private history query', new Set([
    'workspaceId', 'packageRecordId', 'expectedDecisionManifestSha256', 'expectedFinalArtifactSha256', 'purpose',
  ]))
  return {
    method: literalString(record, 'method', 'GET') as 'GET',
    routeTemplate: requiredString(record, 'routeTemplate', 500),
    query: {
      workspaceId: identityValue(query, 'workspaceId'),
      packageRecordId: identityValue(query, 'packageRecordId'),
      expectedDecisionManifestSha256: shaValue(query, 'expectedDecisionManifestSha256'),
      expectedFinalArtifactSha256: shaValue(query, 'expectedFinalArtifactSha256'),
      purpose: literalString(
        query,
        'purpose',
        'download_canonical_private_review_history_artifact',
      ) as 'download_canonical_private_review_history_artifact',
    },
  }
}

function parseAcceptedFinalDownload(
  value: unknown,
): NonNullable<WireReview['acceptedFinalDownload']> {
  const record = strictRecord(
    value,
    'accepted final-download descriptor',
    new Set(['method', 'routeTemplate', 'query']),
  )
  const query = strictRecord(
    record.query,
    'accepted final-download query',
    new Set([
      'workspaceId',
      'packageRecordId',
      'expectedDecisionManifestSha256',
      'expectedFinalArtifactSha256',
      'purpose',
    ]),
  )
  return {
    method: literalString(record, 'method', 'GET') as 'GET',
    routeTemplate: requiredString(record, 'routeTemplate', 500),
    query: {
      workspaceId: identityValue(query, 'workspaceId'),
      packageRecordId: identityValue(query, 'packageRecordId'),
      expectedDecisionManifestSha256:
        shaValue(query, 'expectedDecisionManifestSha256'),
      expectedFinalArtifactSha256:
        shaValue(query, 'expectedFinalArtifactSha256'),
      purpose: literalString(
        query,
        'purpose',
        'download_accepted_canonical_private_final_artifact',
      ) as 'download_accepted_canonical_private_final_artifact',
    },
  }
}

function validatePermissions(value: unknown): void {
  const record = strictRecord(value, 'permissions', new Set([
    'inspectionOnly', 'rawPlanInputsReturned', 'filesystemPathReturned', 'credentialReturned',
    'snapshotMutation', 'creditMutation', 'toolExecution', 'providerCall', 'render',
  ]))
  literalBoolean(record, 'inspectionOnly', true)
  for (const key of [
    'rawPlanInputsReturned',
    'filesystemPathReturned',
    'credentialReturned',
    'snapshotMutation',
    'creditMutation',
    'toolExecution',
    'providerCall',
    'render',
  ]) {
    literalBoolean(record, key, false)
  }
}

function validateStageAuthority(journey: WireJourney): void {
  const action = actionByStage[journey.stage]
  if (
    journey.nextAction.code !== action.code ||
    journey.nextAction.actor !== action.actor ||
    journey.nextAction.method !== action.method
  ) {
    throw new Error('next action does not match the recovered stage')
  }

  const rules = authorityRules[journey.stage]
  for (const field of rules.required) {
    if (journey[field] === undefined) throw new Error(`${field} is missing for ${journey.stage}`)
  }
  for (const field of rules.forbidden) {
    if (journey[field] !== undefined) throw new Error(`${field} is not allowed for ${journey.stage}`)
  }

  const expectedRoute = expectedRouteFor(journey)
  if (!expectedRoute || journey.nextAction.routeTemplate !== expectedRoute) {
    throw new Error('next action route does not match the recovered stage')
  }

  const unpublished = journey.stage === 'publication_request_required' || journey.stage === 'internal_publication_pending'
  if (
    journey.planningHandoff &&
    journey.planningHandoff.publicationStatus !== (unpublished ? 'unpublished' : 'published')
  ) {
    throw new Error('planning handoff publication state is inconsistent')
  }

  if (
    journey.stage === 'plan_approval_required' &&
    (journey.plan?.status !== 'presented' || journey.plan.estimateStatus !== 'presented')
  ) {
    throw new Error('plan approval stage requires a presented plan and estimate')
  }
  if ([
    'approved_snapshot_available',
    'execution_in_progress',
    'private_review_assembly_required',
    'private_review_ready',
    'private_review_accepted',
    'revision_requested',
  ].includes(journey.stage) && (
    journey.plan?.status !== 'approved' || journey.plan.estimateStatus !== 'approved'
  )) {
    throw new Error('post-approval stage requires an approved plan and estimate')
  }
  if (journey.stage === 'cancellation_pending' && journey.plan?.status !== 'cancellation_pending') {
    throw new Error('cancellation stage requires a cancellation-pending plan')
  }
  if (
    journey.stage === 'replanning_required' &&
    journey.plan &&
    !['superseded', 'rejected', 'cancelled'].includes(journey.plan.status)
  ) {
    throw new Error('replanning stage requires a terminal prior plan')
  }

  validateReviewStage(journey)
}

function validateLineage(journey: WireJourney): void {
  if (journey.execution && journey.approval && journey.execution.snapshotId !== journey.approval.snapshotId) {
    throw new Error('execution package is not bound to the approved snapshot')
  }

  if (journey.workGraphProgress) {
    const progress = journey.workGraphProgress
    const blocked = progress.capabilityBlockedJobCount + progress.dependencyBlockedJobCount
    const resolved = progress.completedJobCount + blocked
    if (
      progress.packageRecordId !== journey.execution?.packageRecordId ||
      progress.approvedPlanSnapshotId !== journey.approval?.snapshotId ||
      resolved + progress.pendingJobCount !== progress.totalJobCount ||
      progress.requiredIncompleteJobCount > progress.totalJobCount - progress.completedJobCount ||
      progress.allRequiredJobsCompleted !== (progress.requiredIncompleteJobCount === 0)
    ) {
      throw new Error('work graph progress is inconsistent')
    }
    if (
      progress.status === 'advancing_private_test_work_graph' &&
      (progress.runFinished || progress.pendingJobCount === 0 || progress.nextRequiredGate !== 'canonical_private_work_graph_advancement')
    ) {
      throw new Error('advancing work graph progress is invalid')
    }
    if (
      progress.status === 'blocked_required_jobs' &&
      (!progress.runFinished || progress.pendingJobCount !== 0 || progress.requiredIncompleteJobCount === 0 ||
        progress.allRequiredJobsCompleted || progress.nextRequiredGate !== 'canonical_job_capability_blockers')
    ) {
      throw new Error('blocked work graph progress is invalid')
    }
  }

  if (journey.workGraph && (
    journey.workGraph.packageRecordId !== journey.execution?.packageRecordId ||
    journey.workGraph.approvedPlanSnapshotId !== journey.approval?.snapshotId ||
    journey.workGraph.completedJobCount > journey.workGraph.totalJobCount
  )) {
    throw new Error('completed work graph lineage is invalid')
  }

  const descriptor = journey.review?.privateHistoryDownload
  if (descriptor && journey.review) {
    if (
      descriptor.routeTemplate !== `/v1/edit-executions/private-review-history/${journey.review.reviewAssemblyId}/file` ||
      descriptor.query.workspaceId !== journey.identity.workspaceId ||
      descriptor.query.packageRecordId !== journey.execution?.packageRecordId ||
      descriptor.query.expectedDecisionManifestSha256 !== journey.review.decisionManifestSha256 ||
      descriptor.query.expectedFinalArtifactSha256 !== journey.review.finalArtifactSha256
    ) {
      throw new Error('private review history descriptor lineage is invalid')
    }
  }
  const acceptedDownload = journey.review?.acceptedFinalDownload
  if (acceptedDownload && journey.review) {
    if (
      journey.stage !== 'private_review_accepted' ||
      acceptedDownload.routeTemplate !==
        `/v1/edit-executions/private-review-assemblies/${journey.review.reviewAssemblyId}/accepted-final-artifact` ||
      acceptedDownload.query.workspaceId !== journey.identity.workspaceId ||
      acceptedDownload.query.packageRecordId !==
        journey.execution?.packageRecordId ||
      acceptedDownload.query.expectedDecisionManifestSha256 !==
        journey.review.decisionManifestSha256 ||
      acceptedDownload.query.expectedFinalArtifactSha256 !==
        journey.review.finalArtifactSha256
    ) {
      throw new Error('accepted final-download descriptor lineage is invalid')
    }
  }
}

function validateReviewStage(journey: WireJourney): void {
  const review = journey.review
  if (!review) return
  if (
    journey.stage === 'private_review_ready' &&
    (review.decision !== undefined || review.decisionStatus !== undefined ||
      review.decisionManifestSha256 !== undefined ||
      review.privateHistoryDownload !== undefined ||
      review.acceptedFinalDownload !== undefined)
  ) {
    throw new Error('review-ready stage cannot contain a completed decision')
  }
  if (
    journey.stage === 'revision_requested' &&
    (review.decision !== 'request_revision' || review.decisionStatus !== 'canonical_revision_requested' ||
      !review.decisionManifestSha256 || !review.privateHistoryDownload ||
      review.acceptedFinalDownload !== undefined)
  ) {
    throw new Error('revision stage is missing its exact review decision')
  }
  if (
    journey.stage === 'private_review_accepted' &&
    (review.decision !== 'accept_private_internal_review' ||
      review.decisionStatus !== 'private_internal_review_accepted' ||
      !review.decisionManifestSha256 || !review.privateHistoryDownload ||
      !review.acceptedFinalDownload)
  ) {
    throw new Error('accepted stage is missing its exact review decision')
  }
}

function expectedRouteFor(journey: WireJourney): string | undefined {
  const projectRoute = (suffix: string) =>
    `/v1/projects/${journey.identity.projectId}/edit-sessions/${journey.identity.editSessionId}/${suffix}`
  switch (journey.stage) {
    case 'planning_handoff_required':
    case 'revision_requested':
    case 'replanning_required':
      return projectRoute('canonical-planning-handoff')
    case 'publication_request_required':
      return journey.planningHandoff
        ? projectRoute(`canonical-planning-handoffs/${journey.planningHandoff.handoffId}/publication-requests`)
        : undefined
    case 'internal_publication_pending':
      return journey.planningHandoff && journey.publicationRequest
        ? projectRoute(
            `canonical-planning-handoffs/${journey.planningHandoff.handoffId}/publication-requests/` +
            `${journey.publicationRequest.candidateId}/publish`,
          )
        : undefined
    case 'plan_approval_required':
      return journey.plan ? `/v1/edit-plans/${journey.plan.planId}/canonical-approval` : undefined
    case 'approved_snapshot_available':
      return journey.approval
        ? `/v1/approved-snapshots/${journey.approval.snapshotId}/canonical-execution-package`
        : undefined
    case 'execution_in_progress':
    case 'private_review_assembly_required':
      return journey.execution
        ? `/v1/edit-executions/packages/${journey.execution.packageRecordId}/canonical-private-edit-preparation`
        : undefined
    case 'private_review_ready':
      return journey.review
        ? `/v1/edit-executions/private-review-assemblies/${journey.review.reviewAssemblyId}/canonical-decision`
        : undefined
    case 'private_review_accepted':
      return projectRoute('canonical-journey')
    case 'cancellation_pending':
      if (journey.approval) return `/v1/approved-snapshots/${journey.approval.snapshotId}/authority`
      return journey.plan ? `/v1/edit-plans/${journey.plan.planId}/authority` : undefined
  }
}

function projectProgress(
  progress: WireProgress | undefined,
  completed: WireCompletedWorkGraph | undefined,
): CanonicalEditJourneyProgress | undefined {
  if (progress) {
    return {
      state: progress.status === 'blocked_required_jobs' ? 'blocked' : 'advancing',
      totalJobCount: progress.totalJobCount,
      completedJobCount: progress.completedJobCount,
      pendingJobCount: progress.pendingJobCount,
      blockedJobCount: progress.capabilityBlockedJobCount + progress.dependencyBlockedJobCount,
      updatedAt: progress.updatedAt,
    }
  }
  if (completed) {
    return {
      state: 'complete',
      totalJobCount: completed.totalJobCount,
      completedJobCount: completed.completedJobCount,
      pendingJobCount: 0,
      blockedJobCount: Math.max(0, completed.totalJobCount - completed.completedJobCount),
      updatedAt: completed.completedAt,
    }
  }
  return undefined
}
