import type { SupabaseClient } from '@supabase/supabase-js'
import { ApiError } from '../errors/api-error'
import { buildToolCostSummaryFromEvents } from './tool-cost-summary'
import type { ToolCostEvent, ToolCostSummary } from './types'

export interface ToolCostEventRow {
  id: string
  idempotency_key: string
  workspace_id: string
  project_id: string
  edit_plan_id: string | null
  job_id: string | null
  job_batch_id: string | null
  generation_request_id: string | null
  render_job_id: string | null
  credit_estimate_id: string | null
  credit_reservation_id: string | null
  tool_id: string
  tool_name: string
  usage_category: string
  provider_type: string
  provider_name: string | null
  model_name: string | null
  quality_level: string
  started_at: string
  completed_at: string
  wall_clock_ms: number
  billable_ms: number
  vcpu_count: number
  memory_gib: number
  gpu_type: string | null
  gpu_count: number
  input_tokens: number
  output_tokens: number
  input_video_seconds: number
  output_video_seconds: number
  input_audio_seconds: number
  output_audio_seconds: number
  image_count: number
  render_duration_seconds: number
  output_resolution: string | null
  output_frame_rate: number
  rate_card_version: string
  pricing_snapshot: Record<string, unknown>
  estimated_internal_cost_cents: number
  actual_internal_cost_cents: number
  actual_internal_cost_micros: number
  tool_cost_credits: number
  retry_attempt: number
  retry_reason: string | null
  failure_category: string
  billable_to_user: boolean
  metadata: Record<string, unknown>
  created_at?: string
}

export async function recordPersistentToolCostEvent(
  admin: SupabaseClient,
  idempotencyKey: string,
  event: ToolCostEvent,
): Promise<{ event: ToolCostEvent; replayed: boolean }> {
  const existing = await admin
    .from('tool_cost_events')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  throwPersistentStoreError(existing.error)
  if (existing.data) {
    return { event: rowToToolCostEvent(existing.data as ToolCostEventRow), replayed: true }
  }

  const inserted = await admin
    .from('tool_cost_events')
    .insert(toolCostEventToRow(idempotencyKey, event))
    .select('*')
    .single()

  if (inserted.error?.code === '23505') {
    const replay = await admin
      .from('tool_cost_events')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    throwPersistentStoreError(replay.error)
    if (replay.data) {
      return { event: rowToToolCostEvent(replay.data as ToolCostEventRow), replayed: true }
    }
  }

  throwPersistentStoreError(inserted.error)
  if (!inserted.data) {
    throw new ApiError('TOOL_COST_BACKEND_REQUIRED', 'Tool cost event insert did not return a row.', 409)
  }

  return { event: rowToToolCostEvent(inserted.data as ToolCostEventRow), replayed: false }
}

export async function buildPersistentToolCostSummary(
  admin: SupabaseClient,
  workspaceId: string,
  projectId: string,
): Promise<ToolCostSummary> {
  const result = await admin
    .from('tool_cost_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('project_id', projectId)
    .order('started_at', { ascending: true })

  throwPersistentStoreError(result.error)
  const events = ((result.data ?? []) as ToolCostEventRow[]).map(rowToToolCostEvent)
  return buildToolCostSummaryFromEvents(workspaceId, projectId, events, [
    'Persistent Supabase-backed tool cost summary.',
    'ReEditPro service/edit fee is intentionally excluded.',
  ])
}

function toolCostEventToRow(idempotencyKey: string, event: ToolCostEvent): ToolCostEventRow {
  return {
    id: event.id,
    idempotency_key: idempotencyKey,
    workspace_id: event.workspaceId,
    project_id: event.projectId,
    edit_plan_id: event.editPlanId,
    job_id: event.jobId,
    job_batch_id: event.jobBatchId,
    generation_request_id: event.generationRequestId,
    render_job_id: event.renderJobId,
    credit_estimate_id: event.creditEstimateId,
    credit_reservation_id: event.creditReservationId,
    tool_id: event.toolId,
    tool_name: event.toolName,
    usage_category: event.usageCategory,
    provider_type: event.providerType,
    provider_name: event.providerName,
    model_name: event.modelName,
    quality_level: event.qualityLevel,
    started_at: event.startedAt,
    completed_at: event.completedAt,
    wall_clock_ms: event.wallClockMs,
    billable_ms: event.billableMs,
    vcpu_count: event.vcpuCount,
    memory_gib: event.memoryGiB,
    gpu_type: event.gpuType,
    gpu_count: event.gpuCount,
    input_tokens: event.inputTokens,
    output_tokens: event.outputTokens,
    input_video_seconds: event.inputVideoSeconds,
    output_video_seconds: event.outputVideoSeconds,
    input_audio_seconds: event.inputAudioSeconds,
    output_audio_seconds: event.outputAudioSeconds,
    image_count: event.imageCount,
    render_duration_seconds: event.renderDurationSeconds,
    output_resolution: event.outputResolution,
    output_frame_rate: event.outputFrameRate,
    rate_card_version: event.rateCardVersion,
    pricing_snapshot: event.pricingSnapshot,
    estimated_internal_cost_cents: integerValue(event.estimatedInternalCostCents),
    actual_internal_cost_cents: integerValue(event.actualInternalCostCents),
    actual_internal_cost_micros: integerValue(event.actualInternalCostMicros),
    tool_cost_credits: integerValue(event.toolCostCredits),
    retry_attempt: event.retryAttempt,
    retry_reason: event.retryReason,
    failure_category: event.failureCategory,
    billable_to_user: event.billableToUser,
    metadata: event.metadata,
  }
}

function rowToToolCostEvent(row: ToolCostEventRow): ToolCostEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    editPlanId: row.edit_plan_id,
    jobId: row.job_id,
    jobBatchId: row.job_batch_id,
    generationRequestId: row.generation_request_id,
    renderJobId: row.render_job_id,
    creditEstimateId: row.credit_estimate_id,
    creditReservationId: row.credit_reservation_id,
    toolId: row.tool_id,
    toolName: row.tool_name,
    usageCategory: row.usage_category as ToolCostEvent['usageCategory'],
    providerType: row.provider_type as ToolCostEvent['providerType'],
    providerName: row.provider_name,
    modelName: row.model_name,
    qualityLevel: row.quality_level as ToolCostEvent['qualityLevel'],
    startedAt: row.started_at,
    completedAt: row.completed_at,
    wallClockMs: numericValue(row.wall_clock_ms),
    billableMs: numericValue(row.billable_ms),
    vcpuCount: numericValue(row.vcpu_count),
    memoryGiB: numericValue(row.memory_gib),
    gpuType: row.gpu_type,
    gpuCount: numericValue(row.gpu_count),
    inputTokens: numericValue(row.input_tokens),
    outputTokens: numericValue(row.output_tokens),
    inputVideoSeconds: numericValue(row.input_video_seconds),
    outputVideoSeconds: numericValue(row.output_video_seconds),
    inputAudioSeconds: numericValue(row.input_audio_seconds),
    outputAudioSeconds: numericValue(row.output_audio_seconds),
    imageCount: numericValue(row.image_count),
    renderDurationSeconds: numericValue(row.render_duration_seconds),
    outputResolution: row.output_resolution,
    outputFrameRate: numericValue(row.output_frame_rate),
    rateCardVersion: row.rate_card_version,
    pricingSnapshot: recordValue(row.pricing_snapshot),
    estimatedInternalCostCents: numericValue(row.estimated_internal_cost_cents),
    actualInternalCostCents: numericValue(row.actual_internal_cost_cents),
    actualInternalCostMicros: numericValue(row.actual_internal_cost_micros),
    toolCostCredits: numericValue(row.tool_cost_credits),
    retryAttempt: numericValue(row.retry_attempt),
    retryReason: row.retry_reason,
    failureCategory: row.failure_category as ToolCostEvent['failureCategory'],
    billableToUser: row.billable_to_user,
    metadata: recordValue(row.metadata),
  }
}

function integerValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed))
  }
  return 0
}

function numericValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function recordValue(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function throwPersistentStoreError(error: { code?: string; message?: string; hint?: string } | null): void {
  if (!error) return
  if (error.code === '42P01' || /tool_cost_events|does not exist|schema cache/i.test(error.message ?? '')) {
    throw new ApiError(
      'TOOL_COST_BACKEND_REQUIRED',
      'Tool cost event persistence requires the tool_cost_events migration before live billing can be enabled.',
      409,
      { code: error.code, hint: error.hint },
    )
  }
  throw new ApiError('INTERNAL_ERROR', error.message ?? 'Tool cost persistence failed.', 500, {
    code: error.code,
    hint: error.hint,
  })
}
