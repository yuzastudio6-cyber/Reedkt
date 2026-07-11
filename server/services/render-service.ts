import { ApiError } from '../errors/api-error'
import { estimateProductionToolCost, type ProductionToolCostEstimate } from '../tool-cost-metering'
import type { DeterministicRendererCostInput } from '../tool-cost-metering/types'
import type { ProductionToolId } from '../tool-registry'
import type { ServiceContext } from '../types'
import { createMockId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'
import { createProjectService } from './project-service'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const USER_RENDER_COLUMNS = 'id, workspace_id, project_id, status, render_type, quality_level, output_format, display_name, file_size_bytes, duration_seconds, width, height, frame_rate, created_at, updated_at, archived_at'

export function createRenderService(context: ServiceContext) {
  return {
    async createRenderJob(input: {
      workspaceId: string
      projectId: string
      approvedPlanSnapshotId: string
      creditEstimateId: string
      creditReservationId: string
      renderType: string
      renderQualityLevel?: string
      approvedReservationRemainingCredits?: number
      renderUsage?: RenderMeteringUsageInput
    }) {
      blockCallerAuthoredRenderJobCreation()
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      if (!input.approvedPlanSnapshotId) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Render jobs require an approved snapshot ID.', 409)
      }

      if (!input.creditEstimateId) {
        throw new ApiError('CREDIT_ESTIMATE_NOT_APPROVED', 'Render jobs require an approved credit estimate ID.', 409)
      }

      if (!input.creditReservationId) {
        throw new ApiError('CREDITS_NOT_RESERVED', 'Render jobs require an active credit reservation ID.', 409)
      }

      if (!context.clients.admin || context.env.mockOnly) {
        const toolCostEstimate = buildRenderToolCostEstimate(input)
        return {
          renderJob: {
            id: createMockId('render_job'),
            workspaceId: access.workspaceId,
            projectId: input.projectId,
            approvedPlanSnapshotId: input.approvedPlanSnapshotId,
            creditEstimateId: input.creditEstimateId,
            creditReservationId: input.creditReservationId,
            renderType: input.renderType,
            renderQualityLevel: input.renderQualityLevel ?? 'draft',
            renderUsage: input.renderUsage,
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

      await createProjectService(context).getProject(input.projectId, access.workspaceId)
      throw new ApiError(
        'MOCK_ONLY',
        'Render-job creation is blocked until the canonical transactional snapshot, timing-QA, and credit-reservation gate is deployed.',
        503,
        { requiredGate: 'canonical_render_job_creation_rpc' },
      )
    },

    async getRender(renderId: string, workspaceId: string) {
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      if (!context.clients.admin || context.env.mockOnly) {
        return { render: { id: renderId, workspaceId: access.workspaceId, status: 'mock_metadata_only', mockOnly: true }, warnings: [mockWarning('Render read')] }
      }

      const { data, error } = await context.clients.admin
        .from('renders')
        .select(USER_RENDER_COLUMNS)
        .eq('id', renderId)
        .eq('workspace_id', access.workspaceId)
        .maybeSingle()
      throwOnSupabaseError(error, 'RENDER_NOT_READY')
      if (!data) throw new ApiError('RENDER_NOT_READY', 'Render was not found.', 404)
      if (typeof data.project_id !== 'string') throw new ApiError('RENDER_NOT_READY', 'Render project scope is invalid.', 404)
      await createProjectService(context).getProject(data.project_id, access.workspaceId)
      return { render: data, warnings: [] }
    },

    async createPreviewReview(input: { renderId: string; workspaceId: string; reviewStatus: string; notes?: string }) {
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      if (!context.clients.admin || context.env.mockOnly) {
        return {
          previewReview: {
            id: createMockId('preview_review'),
            ...input,
            workspaceId: access.workspaceId,
            createdAt: nowIso(),
            mockOnly: true,
          },
          warnings: ['Preview review recorded as mock metadata only; final export is not started.'],
        }
      }

      const { data: render, error: renderError } = await context.clients.admin
        .from('renders')
        .select('id, project_id, workspace_id')
        .eq('id', input.renderId)
        .eq('workspace_id', access.workspaceId)
        .maybeSingle()
      throwOnSupabaseError(renderError, 'RENDER_NOT_READY')
      if (!render || typeof render.project_id !== 'string') {
        throw new ApiError('RENDER_NOT_READY', 'Render was not found.', 404)
      }
      await createProjectService(context).getProject(render.project_id, access.workspaceId)

      const { data, error } = await context.clients.admin
        .from('preview_reviews')
        .insert({
          workspace_id: access.workspaceId,
          project_id: render.project_id,
          render_id: input.renderId,
          status: input.reviewStatus,
          review_note: input.notes ?? null,
          reviewed_by: access.userId,
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return { previewReview: data, warnings: ['Preview review does not trigger final export.'] }
    },
  }
}

function blockCallerAuthoredRenderJobCreation(): void {
  throw new ApiError(
    'TOOL_NOT_READY',
    'Render jobs must be derived from canonical approved work items, source assets, timing, QA, and funded reservation authority; caller IDs cannot queue rendering.',
    503,
    { requiredGate: 'canonical_render_job_derivation' },
  )
}

function buildRenderToolCostEstimate(input: {
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditEstimateId: string
  creditReservationId: string
  renderType: string
  renderQualityLevel?: string
  approvedReservationRemainingCredits?: number
  renderUsage?: RenderMeteringUsageInput
}): ProductionToolCostEstimate | undefined {
  const toolId = mapRenderTypeToToolId(input.renderType)
  const deterministicRendererUsage = buildDeterministicRendererUsage(input)
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
    usage: deterministicRendererUsage
      ? {
          sourceKind: 'deterministic_renderer',
          deterministicRenderer: deterministicRendererUsage,
        }
      : undefined,
    approvedReservationRemainingCredits: input.approvedReservationRemainingCredits,
    idempotencyKey: `render-job:${toolId}:${input.approvedPlanSnapshotId}`,
    estimateOnlyWhenBlocked: true,
  })

  return estimate.ok ? estimate.data : undefined
}

type RenderMeteringUsageInput = {
  requestCount?: number
  renderDurationSeconds?: number
  outputSeconds?: number
  width?: number
  height?: number
  fps?: number
}

function buildDeterministicRendererUsage(input: {
  renderQualityLevel?: string
  renderUsage?: RenderMeteringUsageInput
}): DeterministicRendererCostInput | undefined {
  const usage = input.renderUsage
  if (!usage) return undefined
  const outputSeconds = usage.outputSeconds ?? usage.renderDurationSeconds
  const megapixelFrames = usage.width && usage.height && usage.fps && outputSeconds !== undefined
    ? (usage.width * usage.height / 1_000_000) * usage.fps * outputSeconds
    : undefined

  return {
    requestCount: usage.requestCount ?? 1,
    outputSeconds,
    megapixelFrames,
    computeLevel: input.renderQualityLevel === 'high' || input.renderQualityLevel === 'premium' ? 'premium' : 'standard',
  }
}

function mapRenderTypeToToolId(renderType: string): ProductionToolId {
  return renderType === 'export' ? 'ffmpeg' : 'remotion'
}
