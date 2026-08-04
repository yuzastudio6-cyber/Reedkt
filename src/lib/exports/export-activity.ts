import type {
  ExportWorkflowState,
  MockExportJob,
  WorkflowActivityEvent,
  WorkflowActivityType,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type ExportActivityInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  state?: ExportWorkflowState | null
  job?: MockExportJob | null
  type?: WorkflowActivityType
  title?: string
  message?: string
  progressPercent?: number
}

const messageByType: Partial<Record<WorkflowActivityType, {
  title: string
  message: string
  severity: WorkflowActivityEvent['severity']
}>> = {
  export_readiness_created: {
    title: 'Export readiness checked',
    message: 'ReeditPro checked whether the latest preview is ready for export.',
    severity: 'info',
  },
  mock_export_estimate_ready: {
    title: 'Export credit preview ready',
    message: 'An internal export credit preview was created.',
    severity: 'info',
  },
  export_approval_required: {
    title: 'Export approval required',
    message: 'Approve the internal export rehearsal before starting the local job.',
    severity: 'warning',
  },
  export_approved: {
    title: 'Export rehearsal approved',
    message: 'The local export rehearsal can now start.',
    severity: 'success',
  },
  export_rejected: {
    title: 'Export rehearsal rejected',
    message: 'The local export rehearsal approval was rejected.',
    severity: 'warning',
  },
  mock_export_job_queued: {
    title: 'Export rehearsal queued',
    message: 'The local export rehearsal was queued.',
    severity: 'info',
  },
  mock_export_job_started: {
    title: 'Export rehearsal started',
    message: 'ReeditPro is preparing internal export packaging records locally.',
    severity: 'info',
  },
  mock_export_job_progress: {
    title: 'Export rehearsal in progress',
    message: 'The export job advanced to the next stage.',
    severity: 'info',
  },
  mock_export_ready: {
    title: 'Export rehearsal ready',
    message: 'The private output records are ready.',
    severity: 'success',
  },
  mock_export_failed: {
    title: 'Export rehearsal failed',
    message: 'The local export rehearsal failed.',
    severity: 'error',
  },
  export_reset: {
    title: 'Export reset',
    message: 'The local export workflow was reset.',
    severity: 'info',
  },
}

function defaultType(state?: ExportWorkflowState | null, job?: MockExportJob | null): WorkflowActivityType {
  if (job?.status === 'completed' || state?.status === 'export_ready') return 'mock_export_ready'
  if (job?.status === 'failed' || state?.status === 'failed') return 'mock_export_failed'
  if (job?.status === 'queued') return 'mock_export_job_queued'
  if (job?.status === 'running') return 'mock_export_job_progress'
  if (state?.approval?.status === 'approved') return 'export_approved'
  if (state?.exportEstimate) return 'mock_export_estimate_ready'
  return 'export_readiness_created'
}

export function createExportActivityEvent({
  job,
  message,
  progressPercent,
  projectId,
  state,
  title,
  type,
  userId,
  workspaceId,
}: ExportActivityInput): WorkflowActivityEvent {
  const eventType = type ?? defaultType(state, job)
  const fallback = messageByType[eventType] ?? messageByType.export_readiness_created
  const sourceId = job?.id ?? state?.id ?? `${projectId}-export-workflow`

  return {
    id: `${sourceId}-activity-${eventType}`,
    projectId,
    workspaceId,
    userId,
    type: eventType,
    severity: fallback?.severity ?? 'info',
    title: title ?? fallback?.title ?? 'Export readiness checked',
    message: message ?? fallback?.message ?? 'ReeditPro checked local export readiness.',
    progressPercent: progressPercent ?? job?.progressPercent,
    metadata: {
      exportWorkflowStatus: state?.status,
      exportSettingsId: state?.exportSettings.id,
      exportEstimateId: state?.exportEstimate?.id,
      mockExportTotal: state?.exportEstimate?.totalCredits,
      approvalId: state?.approval?.id,
      exportJobId: job?.id ?? state?.activeJob?.id,
      outputCount: state?.exportOutputs.length ?? job?.outputs.length ?? 0,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
