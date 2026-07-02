import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { createMockId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'

const EXECUTION_JOB_TYPES = new Set(['generation', 'render_preview', 'render_export', 'export', 'provider_request'])

export function createJobService(context: ServiceContext) {
  return {
    async createJobBatch(input: { workspaceId: string; projectId: string; approvedPlanSnapshotId?: string; name?: string }) {
      if (!context.clients.admin || context.env.mockOnly) {
        return {
          jobBatch: {
            id: createMockId('job_batch'),
            workspaceId: input.workspaceId,
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
          workspace_id: input.workspaceId,
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
      creditEstimateId?: string
      creditReservationId?: string
      payloadJson?: Record<string, unknown>
    }) {
      if (EXECUTION_JOB_TYPES.has(input.jobType) && (!input.approvedPlanSnapshotId || !input.creditEstimateId || !input.creditReservationId)) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Execution jobs require approved snapshot, credit estimate, and credit reservation IDs.', 409)
      }

      if (!context.clients.admin || context.env.mockOnly) {
        return {
          job: {
            id: createMockId('job'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            jobType: input.jobType,
            jobBatchId: input.jobBatchId,
            approvedPlanSnapshotId: input.approvedPlanSnapshotId,
            creditEstimateId: input.creditEstimateId,
            creditReservationId: input.creditReservationId,
            status: 'queued',
            payloadJson: input.payloadJson ?? {},
            createdAt: nowIso(),
            mockOnly: true,
          },
          warnings: [mockWarning('Job creation')],
        }
      }

      // TODO: use transactional job creation with dependency and credit checks.
      const { data, error } = await context.clients.admin
        .from('jobs')
        .insert({
          workspace_id: input.workspaceId,
          project_id: input.projectId,
          job_batch_id: input.jobBatchId ?? null,
          job_type: input.jobType,
          approved_plan_snapshot_id: input.approvedPlanSnapshotId ?? null,
          credit_estimate_id: input.creditEstimateId ?? null,
          credit_reservation_id: input.creditReservationId ?? null,
          status: 'queued',
          payload_json: input.payloadJson ?? {},
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return { job: data, warnings: [] }
    },

    async getJob(jobId: string) {
      if (!context.clients.admin || context.env.mockOnly) {
        return { job: { id: jobId, status: 'queued', mockOnly: true }, warnings: [mockWarning('Job read')] }
      }

      const { data, error } = await context.clients.admin.from('jobs').select('*').eq('id', jobId).maybeSingle()
      throwOnSupabaseError(error, 'JOB_NOT_FOUND')
      if (!data) throw new ApiError('JOB_NOT_FOUND', 'Job was not found.', 404)
      return { job: data, warnings: [] }
    },

    async getJobEvents(jobId: string) {
      if (!context.clients.admin || context.env.mockOnly) {
        return { events: [], warnings: [mockWarning('Job events read')] }
      }

      const { data, error } = await context.clients.admin
        .from('job_events')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })

      throwOnSupabaseError(error)
      return { events: data ?? [], warnings: [] }
    },
  }
}
