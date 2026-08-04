import type {
  MockRevisionJob,
  RevisionRequest,
  WorkflowActivityEvent,
  WorkflowActivityType,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type RevisionActivityInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  revisionRequest?: RevisionRequest | null
  job?: MockRevisionJob | null
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
  revision_request_created: {
    title: 'Revision request created',
    message: 'Post-preview edit operations were grouped into a revision request.',
    severity: 'info',
  },
  revision_estimate_ready: {
    title: 'Revision estimate ready',
    message: 'An internal credit preview was created for the revision.',
    severity: 'info',
  },
  revision_approval_required: {
    title: 'Revision approval required',
    message: 'Approve the local mock revision before starting the job.',
    severity: 'warning',
  },
  revision_approved: {
    title: 'Revision approved',
    message: 'The mock revision job can now start.',
    severity: 'success',
  },
  revision_rejected: {
    title: 'Revision rejected',
    message: 'The local revision request was rejected.',
    severity: 'warning',
  },
  mock_revision_job_queued: {
    title: 'Mock revision queued',
    message: 'The local mock revision job was queued.',
    severity: 'info',
  },
  mock_revision_job_started: {
    title: 'Mock revision started',
    message: 'ReeditPro is simulating the revision job.',
    severity: 'info',
  },
  mock_revision_job_progress: {
    title: 'Mock revision in progress',
    message: 'The revision job advanced to the next stage.',
    severity: 'info',
  },
  mock_revision_preview_ready: {
    title: 'Revised preview ready',
    message: 'A new private review version is ready.',
    severity: 'success',
  },
  mock_revision_failed: {
    title: 'Mock revision failed',
    message: 'The local mock revision job failed.',
    severity: 'error',
  },
  revision_reset: {
    title: 'Revision reset',
    message: 'The active local revision request was reset.',
    severity: 'info',
  },
}

function defaultType(revisionRequest?: RevisionRequest | null, job?: MockRevisionJob | null): WorkflowActivityType {
  if (job?.status === 'completed' || revisionRequest?.status === 'preview_ready') return 'mock_revision_preview_ready'
  if (job?.status === 'failed' || revisionRequest?.status === 'failed') return 'mock_revision_failed'
  if (job?.status === 'queued') return 'mock_revision_job_queued'
  if (job?.status === 'running') return 'mock_revision_job_progress'
  if (revisionRequest?.status === 'approved') return 'revision_approved'
  if (revisionRequest?.status === 'needs_approval') return 'revision_approval_required'
  return 'revision_request_created'
}

export function createRevisionActivityEvent({
  job,
  message,
  progressPercent,
  projectId,
  revisionRequest,
  title,
  type,
  userId,
  workspaceId,
}: RevisionActivityInput): WorkflowActivityEvent {
  const eventType = type ?? defaultType(revisionRequest, job)
  const fallback = MESSAGE_BY_TYPE[eventType] ?? MESSAGE_BY_TYPE.revision_request_created
  const sourceId = job?.id ?? revisionRequest?.id ?? `${projectId}-revision-workflow`

  return {
    id: `${sourceId}-activity-${eventType}`,
    projectId,
    workspaceId,
    userId,
    type: eventType,
    severity: fallback?.severity ?? 'info',
    title: title ?? fallback?.title ?? 'Revision request created',
    message: message ?? fallback?.message ?? 'A local revision workflow event occurred.',
    relatedEditOperationId: revisionRequest?.editOperationIds[0],
    progressPercent: progressPercent ?? job?.progressPercent,
    metadata: {
      revisionRequestId: revisionRequest?.id,
      revisionStatus: revisionRequest?.status,
      executionMode: revisionRequest?.executionMode,
      costPolicy: revisionRequest?.costPolicy,
      jobId: job?.id,
      jobStatus: job?.status,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
