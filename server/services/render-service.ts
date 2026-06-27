import { ApiError } from '../errors/api-error'
import { estimateProductionToolCost, type ProductionToolCostEstimate } from '../tool-cost-metering'
import type { ProductionToolId } from '../tool-registry'
import type { ServiceContext } from '../types'
import { createMockId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'

export function createRenderService(context: ServiceContext) {
  return {
    async createRenderJob(input: {
      workspaceId: string
      projectId: string
      approvedPlanSnapshotId: string
      creditEstimateId?: string
      creditReservationId: string
      renderType: string
      renderQualityLevel?: string
      approvedReservationRemainingCredits?: number
    }) {
      if (!input.approvedPlanSnapshotId || !input.creditReservationId) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Render jobs require approved snapshot and credit reservation IDs.', 409)
      }

      if (!context.clients.admin || context.env.mockOnly) {
        const toolCostEstimate = buildRenderToolCostEstimate(input)
        return {
          renderJob: {
            id: createMockId('render_job'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            approvedPlanSnapshotId: input.approvedPlanSnapshotId,
            creditEstimateId: input.creditEstimateId,
            creditReservationId: input.creditReservationId,
            renderType: input.renderType,
            renderQualityLevel: input.renderQualityLevel ?? 'draft',
            toolId: mapRenderTypeToToolId(input.renderType),
            toolCostEstimate,
            status: 'queued',
            createdAt: nowIso(),
            mockOnly: true,
          },
          toolCostEstimate,
          warnings: [mockWarning('Render job creation'), 'No Remotion, FFmpeg, media download, or upload was executed.'],
        }
      }

      // TODO: use transaction/RPC to validate snapshot, timing QA, credit reservation, and render manifest.
      const { data, error } = await context.clients.admin
        .from('render_jobs')
        .insert({
          workspace_id: input.workspaceId,
          project_id: input.projectId,
          approved_plan_snapshot_id: input.approvedPlanSnapshotId,
          credit_reservation_id: input.creditReservationId,
          render_type: input.renderType,
          render_quality_level: input.renderQualityLevel ?? 'draft',
          status: 'queued',
        })
        .select('*')
        .single()

      throwOnSupabaseError(error, 'RENDER_NOT_READY')
      return { renderJob: data, warnings: [] }
    },

    async getRender(renderId: string) {
      if (!context.clients.admin || context.env.mockOnly) {
        return { render: { id: renderId, status: 'mock_metadata_only', mockOnly: true }, warnings: [mockWarning('Render read')] }
      }

      const { data, error } = await context.clients.admin.from('renders').select('*').eq('id', renderId).maybeSingle()
      throwOnSupabaseError(error, 'RENDER_NOT_READY')
      if (!data) throw new ApiError('RENDER_NOT_READY', 'Render was not found.', 404)
      return { render: data, warnings: [] }
    },

    async createPreviewReview(input: { renderId: string; workspaceId: string; reviewStatus: string; notes?: string }) {
      if (!context.clients.admin || context.env.mockOnly) {
        return {
          previewReview: {
            id: createMockId('preview_review'),
            ...input,
            createdAt: nowIso(),
            mockOnly: true,
          },
          warnings: ['Preview review recorded as mock metadata only; final export is not started.'],
        }
      }

      const { data, error } = await context.clients.admin
        .from('preview_reviews')
        .insert({
          workspace_id: input.workspaceId,
          render_id: input.renderId,
          review_status: input.reviewStatus,
          notes: input.notes ?? null,
          created_by: context.auth?.userId ?? null,
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return { previewReview: data, warnings: ['Preview review does not trigger final export.'] }
    },
  }
}

function buildRenderToolCostEstimate(input: {
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditEstimateId?: string
  creditReservationId: string
  renderType: string
  renderQualityLevel?: string
  approvedReservationRemainingCredits?: number
}): ProductionToolCostEstimate | undefined {
  const toolId = mapRenderTypeToToolId(input.renderType)
  const estimate = estimateProductionToolCost({
    toolId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    productEditLevel: 'normal',
    toolComputeLevel: input.renderQualityLevel === 'high' || input.renderQualityLevel === 'premium' ? 'premium' : 'standard',
    qualityLevel: input.renderQualityLevel === 'high' || input.renderQualityLevel === 'premium' ? 'premium' : 'standard',
    approvedReservationRemainingCredits: input.approvedReservationRemainingCredits,
    idempotencyKey: `render-job:${toolId}:${input.approvedPlanSnapshotId}`,
    estimateOnlyWhenBlocked: true,
  })

  return estimate.ok ? estimate.data : undefined
}

function mapRenderTypeToToolId(renderType: string): ProductionToolId {
  return renderType === 'export' ? 'ffmpeg' : 'remotion'
}
