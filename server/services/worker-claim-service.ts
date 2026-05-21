import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { createMockId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'

const mockActiveClaimsByJobId = new Map<string, Record<string, unknown>>()

export function createWorkerClaimService(context: ServiceContext) {
  return {
    async claimJob(input: {
      workspaceId: string
      projectId?: string
      jobId: string
      workerType: string
      workerInstanceId: string
      leaseExpiresAt: string
      idempotencyKey: string
    }) {
      if (!context.clients.admin || context.env.mockOnly) {
        if (mockActiveClaimsByJobId.has(input.jobId)) {
          throw new ApiError('WORKER_CLAIM_CONFLICT', 'Mock job already has an active worker claim.', 409)
        }
        const claim = {
          id: createMockId('worker_claim'),
          ...input,
          claimStatus: 'active',
          claimedAt: nowIso(),
          attemptNumber: 1,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          mockOnly: true,
        }
        mockActiveClaimsByJobId.set(input.jobId, claim)
        return {
          claim,
          warnings: [mockWarning('Worker job claim')],
        }
      }

      const { data: canClaim, error: rpcError } = await context.clients.admin.rpc('can_claim_worker_job', {
        target_job_id: input.jobId,
      })
      throwOnSupabaseError(rpcError)
      if (!canClaim) throw new ApiError('WORKER_CLAIM_CONFLICT', 'Job is not claimable or already has an active claim.', 409)

      // TODO: replace with transaction/RPC to avoid claim race windows.
      const { data, error } = await context.clients.admin
        .from('worker_job_claims')
        .insert({
          workspace_id: input.workspaceId,
          project_id: input.projectId ?? null,
          job_id: input.jobId,
          worker_type: input.workerType,
          worker_instance_id: input.workerInstanceId,
          lease_expires_at: input.leaseExpiresAt,
          idempotency_key: input.idempotencyKey,
        })
        .select('*')
        .single()

      throwOnSupabaseError(error, 'WORKER_CLAIM_CONFLICT')
      return { claim: data, warnings: [] }
    },

    async heartbeat(input: { jobId: string; claimId?: string }) {
      if (!context.clients.admin || context.env.mockOnly) {
        return { heartbeat: { jobId: input.jobId, claimId: input.claimId, heartbeatAt: nowIso(), mockOnly: true }, warnings: [mockWarning('Worker heartbeat')] }
      }

      const { data, error } = await context.clients.admin
        .from('worker_job_claims')
        .update({ heartbeat_at: nowIso() })
        .eq('job_id', input.jobId)
        .eq('claim_status', 'active')
        .select('*')
        .single()

      throwOnSupabaseError(error, 'WORKER_LEASE_EXPIRED')
      return { heartbeat: data, warnings: [] }
    },

    async release(input: { jobId: string; claimStatus: string }) {
      if (!context.clients.admin || context.env.mockOnly) {
        mockActiveClaimsByJobId.delete(input.jobId)
        return { claim: { jobId: input.jobId, claimStatus: input.claimStatus, releasedAt: nowIso(), mockOnly: true }, warnings: [mockWarning('Worker claim release')] }
      }

      const { data, error } = await context.clients.admin
        .from('worker_job_claims')
        .update({ claim_status: input.claimStatus, released_at: nowIso() })
        .eq('job_id', input.jobId)
        .eq('claim_status', 'active')
        .select('*')
        .single()

      throwOnSupabaseError(error, 'WORKER_LEASE_EXPIRED')
      return { claim: data, warnings: [] }
    },

    async recordToolRuntimeCheck(input: {
      workspaceId: string
      workerType: string
      runtimeRegion?: string
      toolName: string
      toolVersion?: string
      checkStatus: string
      checkSummary: string
      binaryPath?: string
      capabilitiesJson?: Record<string, unknown>
    }) {
      if (!context.clients.admin || context.env.mockOnly) {
        return {
          toolRuntimeCheck: {
            id: createMockId('tool_check'),
            ...input,
            capabilitiesJson: input.capabilitiesJson ?? {},
            checkedAt: nowIso(),
            createdAt: nowIso(),
            updatedAt: nowIso(),
            mockOnly: true,
          },
          warnings: [mockWarning('Tool runtime check recording')],
        }
      }

      const { data, error } = await context.clients.admin
        .from('tool_runtime_checks')
        .insert({
          workspace_id: input.workspaceId,
          worker_type: input.workerType,
          runtime_region: input.runtimeRegion ?? 'us-east1',
          tool_name: input.toolName,
          tool_version: input.toolVersion ?? null,
          check_status: input.checkStatus,
          check_summary: input.checkSummary,
          binary_path: input.binaryPath ?? null,
          capabilities_json: input.capabilitiesJson ?? {},
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return { toolRuntimeCheck: data, warnings: [] }
    },
  }
}
