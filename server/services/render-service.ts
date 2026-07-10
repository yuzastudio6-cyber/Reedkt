import { ApiError } from '../errors/api-error'
import { estimateToolCost } from '../tool-cost-metering'
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
    }) {
      if (!input.approvedPlanSnapshotId || !input.creditReservationId) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Render jobs require approved snapshot and credit reservation IDs.', 409)
      }
      const toolCostEstimate = estimateToolCost({
        toolId: `render:${input.renderType}`,
        toolName: `${input.renderType} deterministic render`,
        usageCategory: input.renderType === 'export' ? 'export' : 'rendering',
        computeLevel: input.renderQualityLevel === 'premium' ? 'premium' : 'standard',
        providerType: 'deterministic_renderer',
        providerName: 'reeditpro-render-worker',
        modelName: null,
        qualityLevel: renderQualityLevel(input.renderQualityLevel),
        estimatedRuntimeSeconds: 120,
        outputVideoSeconds: 30,
        renderDurationSeconds: 30,
        resolution: input.renderQualityLevel === 'premium' ? '3840x2160' : '1920x1080',
        frameRate: 30,
        assumptions: ['Render job estimate is generated before deterministic renderer dispatch.'],
      })

      if (!context.clients.admin || context.env.mockOnly) {
        return {
          renderJob: {
            id: createMockId('render_job'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            approvedPlanSnapshotId: input.approvedPlanSnapshotId,
            creditReservationId: input.creditReservationId,
            renderType: input.renderType,
            renderQualityLevel: input.renderQualityLevel ?? 'draft',
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
          credit_estimate_id: input.creditEstimateId ?? null,
          credit_reservation_id: input.creditReservationId,
          render_type: input.renderType,
          render_quality_level: input.renderQualityLevel ?? 'draft',
          status: 'queued',
        })
        .select('*')
        .single()

      throwOnSupabaseError(error, 'RENDER_NOT_READY')
      return { renderJob: data, toolCostEstimate, warnings: [] }
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

function renderQualityLevel(value: string | undefined): 'draft' | 'preview' | 'production' | 'premium' {
  if (value === 'draft' || value === 'preview' || value === 'production' || value === 'premium') return value
  return 'preview'
}
