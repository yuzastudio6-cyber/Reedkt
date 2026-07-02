import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { throwOnSupabaseError } from '../services/service-helpers'

export interface WorkerJobRecord {
  id: string
  workspaceId: string
  projectId?: string
  jobType: string
  status: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  inputPayload: Record<string, unknown>
  outputPayload?: Record<string, unknown>
  jobBatchId?: string
  mockOnly?: boolean
}

export interface WorkerJobLoaderInput {
  jobId: string
  workspaceId?: string
  projectId?: string
  jobType?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  payloadJson?: Record<string, unknown>
}

export async function loadWorkerJob(context: ServiceContext, input: WorkerJobLoaderInput): Promise<WorkerJobRecord> {
  if (!context.clients.admin || context.env.mockOnly) {
    return {
      id: input.jobId,
      workspaceId: input.workspaceId ?? 'workspace-mock',
      projectId: input.projectId ?? 'project-mock',
      jobType: input.jobType ?? 'other',
      status: 'queued',
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      inputPayload: input.payloadJson ?? {},
      mockOnly: true,
    }
  }

  const { data, error } = await context.clients.admin
    .from('jobs')
    .select('*')
    .eq('id', input.jobId)
    .maybeSingle()

  throwOnSupabaseError(error, 'JOB_NOT_FOUND')
  if (!data) throw new ApiError('JOB_NOT_FOUND', 'Job was not found.', 404)

  return {
    id: String(data.id),
    workspaceId: String(data.workspace_id),
    projectId: typeof data.project_id === 'string' ? data.project_id : undefined,
    jobType: String(data.job_type),
    status: String(data.status),
    approvedPlanSnapshotId: typeof data.approved_plan_snapshot_id === 'string' ? data.approved_plan_snapshot_id : undefined,
    creditReservationId: typeof data.credit_reservation_id === 'string' ? data.credit_reservation_id : undefined,
    inputPayload: isRecord(data.input_payload) ? data.input_payload : {},
    outputPayload: isRecord(data.output_payload) ? data.output_payload : undefined,
    jobBatchId: typeof data.job_batch_id === 'string' ? data.job_batch_id : undefined,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
