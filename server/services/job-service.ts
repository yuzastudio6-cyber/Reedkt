import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { createMockId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'
import { createProjectService } from './project-service'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const EXECUTION_JOB_TYPES = new Set(['generation', 'render_preview', 'render_export', 'export', 'provider_request'])
const USER_JOB_COLUMNS = 'id, workspace_id, project_id, job_batch_id, job_type, status, priority, job_name, job_description, attempt_count, max_attempts, scheduled_for, started_at, completed_at, failed_at, cancelled_at, progress_percent, progress_message, created_at, updated_at'
const USER_JOB_EVENT_COLUMNS = 'id, job_id, job_batch_id, workspace_id, project_id, event_type, message, progress_percent, created_at'

export function createJobService(context: ServiceContext) {
  return {
    async createJobBatch(input: { workspaceId: string; projectId: string; approvedPlanSnapshotId?: string; name?: string }) {
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      blockLegacyFreeFormJobMutation()
      if (context.clients.admin && !context.env.mockOnly) {
        await createProjectService(context).getProject(input.projectId, access.workspaceId)
      }
      if (!context.clients.admin || context.env.mockOnly) {
        return {
          jobBatch: {
            id: createMockId('job_batch'),
            workspaceId: access.workspaceId,
            projectId: input.projectId,
            approvedPlanSnapshotId: input.approvedPlanSnapshotId,
            name: input.name ?? 'Mock job batch',
            createdAt: nowIso(),
            mockOnly: true,
          },
          warnings: [mockWarning('Job batch creation')],
        }
      }

      const { data, error } = await context.clients.admin
        .from('job_batches')
        .insert({
          workspace_id: access.workspaceId,
          project_id: input.projectId,
          name: input.name ?? 'Job batch',
          approved_plan_snapshot_id: input.approvedPlanSnapshotId ?? null,
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return { jobBatch: data, warnings: [] }
    },

    async createJob(input: {
      workspaceId: string
      projectId: string
      jobType: string
      jobBatchId?: string
      approvedPlanSnapshotId?: string
      creditReservationId?: string
      payloadJson?: Record<string, unknown>
    }) {
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      blockLegacyFreeFormJobMutation()
      if (EXECUTION_JOB_TYPES.has(input.jobType) && (!input.approvedPlanSnapshotId || !input.creditReservationId)) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Execution jobs require approved snapshot and credit reservation IDs.', 409)
      }

      if (!context.clients.admin || context.env.mockOnly) {
        return {
          job: {
            id: createMockId('job'),
            workspaceId: access.workspaceId,
            projectId: input.projectId,
            jobType: input.jobType,
            jobBatchId: input.jobBatchId,
            approvedPlanSnapshotId: input.approvedPlanSnapshotId,
            creditReservationId: input.creditReservationId,
            status: 'queued',
            payloadJson: input.payloadJson ?? {},
            createdAt: nowIso(),
            mockOnly: true,
          },
          warnings: [mockWarning('Job creation')],
        }
      }

      await createProjectService(context).getProject(input.projectId, access.workspaceId)
      if (EXECUTION_JOB_TYPES.has(input.jobType)) {
        throw new ApiError(
          'MOCK_ONLY',
          'Execution job creation is blocked until the canonical transactional snapshot and credit-reservation gate is deployed.',
          503,
          { requiredGate: 'canonical_execution_job_creation_rpc' },
        )
      }

      const { data, error } = await context.clients.admin
        .from('jobs')
        .insert({
          workspace_id: access.workspaceId,
          project_id: input.projectId,
          job_batch_id: input.jobBatchId ?? null,
          job_type: input.jobType,
          approved_plan_snapshot_id: input.approvedPlanSnapshotId ?? null,
          credit_reservation_id: input.creditReservationId ?? null,
          status: 'queued',
          payload_json: input.payloadJson ?? {},
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return { job: data, warnings: [] }
    },

    async getJob(jobId: string, workspaceId: string) {
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      if (!context.clients.admin || context.env.mockOnly) {
        return { job: { id: jobId, workspaceId: access.workspaceId, status: 'queued', mockOnly: true }, warnings: [mockWarning('Job read')] }
      }

      const { data, error } = await context.clients.admin
        .from('jobs')
        .select(USER_JOB_COLUMNS)
        .eq('id', jobId)
        .eq('workspace_id', access.workspaceId)
        .maybeSingle()
      throwOnSupabaseError(error, 'JOB_NOT_FOUND')
      if (!data) throw new ApiError('JOB_NOT_FOUND', 'Job was not found.', 404)
      if (typeof data.project_id !== 'string') throw new ApiError('JOB_NOT_FOUND', 'Job project scope is invalid.', 404)
      await createProjectService(context).getProject(data.project_id, access.workspaceId)
      return { job: data, warnings: [] }
    },

    async getJobEvents(jobId: string, workspaceId: string) {
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      if (!context.clients.admin || context.env.mockOnly) {
        return { events: [], warnings: [mockWarning('Job events read')] }
      }

      const { data: job, error: jobError } = await context.clients.admin
        .from('jobs')
        .select('id, project_id')
        .eq('id', jobId)
        .eq('workspace_id', access.workspaceId)
        .maybeSingle()
      throwOnSupabaseError(jobError, 'JOB_NOT_FOUND')
      if (!job || typeof job.project_id !== 'string') throw new ApiError('JOB_NOT_FOUND', 'Job was not found.', 404)
      await createProjectService(context).getProject(job.project_id, access.workspaceId)

      const { data, error } = await context.clients.admin
        .from('job_events')
        .select(USER_JOB_EVENT_COLUMNS)
        .eq('job_id', jobId)
        .eq('workspace_id', access.workspaceId)
        .order('created_at', { ascending: true })

      throwOnSupabaseError(error)
      return { events: data ?? [], warnings: [] }
    },
  }
}

function blockLegacyFreeFormJobMutation(): void {
  throw new ApiError(
    'TOOL_NOT_READY',
    'Free-form job mutations are disabled; canonical approval derives jobs from immutable approved work items.',
    503,
    { requiredGate: 'canonical_approved_work_item_job_derivation' },
  )
}
