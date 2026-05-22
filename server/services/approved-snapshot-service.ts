import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { createMockId, mockWarning, nowIso, sanitizeJson, throwOnSupabaseError } from './service-helpers'

interface CreateApprovedSnapshotInput {
  workspaceId: string
  projectId: string
  chatSessionId?: string
  editPlanId: string
  creditEstimateId: string
  creditApprovalId: string
  creditReservationId: string
  approvedByUserId?: string
  snapshotVersion: number
  snapshotJson: Record<string, unknown>
  planHash: string
  creditHash: string
  sourceSequenceHash: string
  timingHash: string
}

export function createApprovedSnapshotService(context: ServiceContext) {
  return {
    async createApprovedSnapshot(input: CreateApprovedSnapshotInput) {
      const approvedByUserId = context.auth?.userId ?? input.approvedByUserId
      if (!approvedByUserId) throw new ApiError('AUTH_REQUIRED', 'Approved snapshot requires an authenticated approver.', 401)
      assertSnapshotJsonIsSafe(input.snapshotJson)

      if (!context.clients.admin || context.env.mockOnly) {
        return {
          approvedPlanSnapshot: {
            id: createMockId('approved_snapshot'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            chatSessionId: input.chatSessionId,
            editPlanId: input.editPlanId,
            creditEstimateId: input.creditEstimateId,
            creditApprovalId: input.creditApprovalId,
            creditReservationId: input.creditReservationId,
            approvedByUserId,
            snapshotVersion: input.snapshotVersion,
            snapshotStatus: 'approved',
            snapshotJson: sanitizeJson(input.snapshotJson),
            planHash: input.planHash,
            creditHash: input.creditHash,
            sourceSequenceHash: input.sourceSequenceHash,
            timingHash: input.timingHash,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            mockOnly: true,
          },
          warnings: [mockWarning('Approved snapshot creation'), 'Workers must execute approved snapshots, not raw chat.'],
        }
      }

      const { data: canCreate, error: rpcError } = await context.clients.admin.rpc('can_create_approved_plan_snapshot', {
        target_edit_plan_id: input.editPlanId,
        target_credit_estimate_id: input.creditEstimateId,
        target_credit_reservation_id: input.creditReservationId,
      })
      throwOnSupabaseError(rpcError)
      if (!canCreate) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Approved plan, approved estimate, and reserved credits are required before snapshot creation.', 409)
      }

      // TODO: replace with transaction/RPC that verifies source sequence and immutable snapshot version.
      const { data, error } = await context.clients.admin
        .from('approved_plan_snapshots')
        .insert({
          workspace_id: input.workspaceId,
          project_id: input.projectId,
          chat_session_id: input.chatSessionId ?? null,
          edit_plan_id: input.editPlanId,
          credit_estimate_id: input.creditEstimateId,
          credit_approval_id: input.creditApprovalId,
          credit_reservation_id: input.creditReservationId,
          approved_by_user_id: approvedByUserId,
          snapshot_version: input.snapshotVersion,
          snapshot_status: 'approved',
          snapshot_json: sanitizeJson(input.snapshotJson),
          plan_hash: input.planHash,
          credit_hash: input.creditHash,
          source_sequence_hash: input.sourceSequenceHash,
          timing_hash: input.timingHash,
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return { approvedPlanSnapshot: data, warnings: [] }
    },

    async getApprovedSnapshot(snapshotId: string) {
      if (!context.clients.admin || context.env.mockOnly) {
        return {
          approvedPlanSnapshot: {
            id: snapshotId,
            snapshotStatus: 'approved',
            mockOnly: true,
          },
          warnings: [mockWarning('Approved snapshot read')],
        }
      }

      const { data, error } = await context.clients.admin
        .from('approved_plan_snapshots')
        .select('id, workspace_id, project_id, edit_plan_id, credit_estimate_id, credit_reservation_id, snapshot_version, snapshot_status, created_at, updated_at')
        .eq('id', snapshotId)
        .maybeSingle()

      throwOnSupabaseError(error, 'APPROVED_SNAPSHOT_REQUIRED')
      if (!data) throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot was not found.', 404)
      return { approvedPlanSnapshot: data, warnings: [] }
    },
  }
}

function assertSnapshotJsonIsSafe(snapshotJson: Record<string, unknown>): void {
  const serialized = JSON.stringify(snapshotJson).toLowerCase()
  const secretMarkers = ['api_key', 'service_role', 'signed_url', 'password', 'bearer', 'secret', 'token']
  const marker = secretMarkers.find((candidate) => serialized.includes(candidate))
  if (marker) {
    throw new ApiError('VALIDATION_FAILED', 'Approved snapshot JSON must not contain secrets, credentials, tokens, or signed URLs.', 400, {
      marker,
    })
  }
}
