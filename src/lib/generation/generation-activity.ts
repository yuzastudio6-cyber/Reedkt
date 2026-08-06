import type {
  GenerationReadinessState,
  MockPreviewJob,
  WorkflowActivityEvent,
  WorkflowActivityType,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type GenerationActivityInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  state?: GenerationReadinessState | null
  job?: MockPreviewJob | null
  type?: WorkflowActivityType
  title?: string
  message?: string
  progressPercent?: number
}

const MESSAGE_BY_TYPE: Partial<Record<WorkflowActivityType, {
  title: string
  message: string
  severity: WorkflowActivityEvent['severity']
}>> = {
  generation_readiness_created: {
    title: 'Review readiness checked',
    message: 'ReeditPro checked whether the project is ready for private review preparation.',
    severity: 'info',
  },
  mock_credit_estimate_ready: {
    title: 'Credit preview ready',
    message: 'An internal credit preview was created for review planning.',
    severity: 'info',
  },
  generation_approval_required: {
    title: 'Approval required',
    message: 'Approve the credit preview before preparing the private review.',
    severity: 'warning',
  },
  generation_approved: {
    title: 'Private review approved',
    message: 'The internal private review can now start.',
    severity: 'success',
  },
  mock_preview_job_queued: {
    title: 'Private review queued',
    message: 'The local private review was queued.',
    severity: 'info',
  },
  mock_preview_job_started: {
    title: 'Private review started',
    message: 'ReeditPro is preparing the internal review.',
    severity: 'info',
  },
  mock_preview_job_progress: {
    title: 'Private review in progress',
    message: 'The review moved to the next stage.',
    severity: 'info',
  },
  mock_preview_ready: {
    title: 'Private review ready',
    message: 'The context-aware private review is ready.',
    severity: 'success',
  },
  mock_preview_blocked: {
    title: 'Private review blocked',
    message: 'Resolve blocking readiness or QA issues before private review preparation.',
    severity: 'error',
  },
  mock_preview_failed: {
    title: 'Private review failed',
    message: 'The local private review failed.',
    severity: 'error',
  },
}

function defaultTypeForState(state?: GenerationReadinessState | null, job?: MockPreviewJob | null): WorkflowActivityType {
  if (job?.status === 'completed' || state?.status === 'preview_ready') return 'mock_preview_ready'
  if (job?.status === 'failed' || state?.status === 'failed') return 'mock_preview_failed'
  if (job?.status === 'queued') return 'mock_preview_job_queued'
  if (job?.status === 'running') return 'mock_preview_job_progress'
  if (state?.status === 'blocked') return 'mock_preview_blocked'
  if (state?.approval?.status === 'approved') return 'generation_approved'
  if (state?.creditEstimate) return 'mock_credit_estimate_ready'
  return 'generation_readiness_created'
}

export function createGenerationActivityEvent({
  job,
  message,
  progressPercent,
  projectId,
  state,
  title,
  type,
  userId,
  workspaceId,
}: GenerationActivityInput): WorkflowActivityEvent {
  const eventType = type ?? defaultTypeForState(state, job)
  const fallback = MESSAGE_BY_TYPE[eventType] ?? MESSAGE_BY_TYPE.generation_readiness_created
  const sourceId = job?.id ?? state?.id ?? `${projectId}-generation-readiness`

  return {
    id: `${sourceId}-activity-${eventType}`,
    projectId,
    workspaceId,
    userId,
    type: eventType,
    severity: fallback?.severity ?? 'info',
    title: title ?? fallback?.title ?? 'Review readiness checked',
    message: message ?? fallback?.message ?? 'ReeditPro checked local review readiness.',
    progressPercent: progressPercent ?? job?.progressPercent,
    metadata: {
      generationReadinessStatus: state?.status,
      creditEstimateId: state?.creditEstimate?.id,
      mockCreditTotal: state?.creditEstimate?.totalCredits,
      approvalId: state?.approval?.id,
      previewJobId: job?.id ?? state?.previewJob?.id,
      blockingIssueCount: state?.issues.filter((issue) => issue.severity === 'blocking').length ?? 0,
      warningIssueCount: state?.issues.filter((issue) => issue.severity === 'warning').length ?? 0,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
