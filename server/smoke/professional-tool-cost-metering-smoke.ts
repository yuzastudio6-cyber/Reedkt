import assert from 'node:assert/strict'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { PRODUCTION_TOOL_IDS } from '../tool-registry/production-tool-types'
import { createToolCostMeteringService } from '../tool-cost-metering/tool-cost-metering-service'
import {
  assertToolCostOwnerCoverageComplete,
  buildToolCostOwnerCoverageSummary,
  centsToCredits,
  emitToolCostEvent,
  estimateToolCost,
  getToolCostOwnerCoverage,
  resetMockToolCostStore,
  roundBillableMs,
  toolCostRateCard,
} from '../tool-cost-metering'
import type { ServiceContext } from '../types'

resetMockToolCostStore()

const workspaceId = '00000000-0000-4000-8000-000000000101'
const projectId = '00000000-0000-4000-8000-000000000102'
const creditEstimateId = '00000000-0000-4000-8000-000000000103'
const creditReservationId = '00000000-0000-4000-8000-000000000104'
const startedAt = '2026-06-26T12:00:00.000Z'
const completedAt = '2026-06-26T12:00:12.345Z'

assert.equal(centsToCredits(0), 0, '0 cents should convert to 0 credits')
assert.equal(centsToCredits(43), 5, '$0.43 should convert to 5 credits')
assert.equal(centsToCredits(120), 12, '$1.20 should convert to 12 credits')
assert.equal(centsToCredits(721), 73, '$7.21 should convert to 73 credits')
assert.equal(roundBillableMs(12_345), 60_000, 'Minimum billing should round short jobs to 60 seconds')

const economy = estimateToolCost({
  toolId: 'cpu-analysis',
  toolName: 'CPU analysis',
  usageCategory: 'media_analysis',
  computeLevel: 'economy',
  providerType: 'cloud_run_job',
  providerName: 'cloud-run',
  modelName: null,
  qualityLevel: 'preview',
  inputVideoSeconds: 60,
  estimatedRuntimeSeconds: 30,
  resolution: '1920x1080',
  frameRate: 30,
})
const standard = estimateToolCost({
  ...economy,
  computeLevel: 'standard',
})
const premium = estimateToolCost({
  ...economy,
  computeLevel: 'premium',
  providerType: 'gpu_worker',
  gpuType: 'nvidia_l4',
  gpuCount: 1,
  qualityLevel: 'premium',
})
assert.ok(economy.expectedCredits > 0, 'Economy estimates should be nonzero for billable jobs')
assert.ok(standard.expectedInternalCostCents > economy.expectedInternalCostCents, 'Standard compute should estimate above economy')
assert.ok(premium.expectedInternalCostCents > standard.expectedInternalCostCents, 'Premium compute should estimate above standard')
assert.ok(premium.riskLevel === 'high', 'GPU/premium estimate should be high risk')
assert.equal(premium.canRunWithinApprovedReservation, true, 'Estimate without reservation context should be runnable')

const blockedReservationEstimate = estimateToolCost({
  ...premium,
  approvedReservationRemainingCredits: 1,
})
assert.equal(blockedReservationEstimate.canRunWithinApprovedReservation, false, 'High estimate above reservation should block paid execution')

const providerEstimate = estimateToolCost({
  toolId: 'video-provider',
  toolName: 'Video provider',
  usageCategory: 'real_motion',
  computeLevel: 'premium',
  providerType: 'external_api',
  providerName: 'example-video-provider',
  modelName: 'example-video-model',
  qualityLevel: 'premium',
  outputVideoSeconds: 8,
  outputAudioSeconds: 8,
  imageCount: 2,
  inputTokens: 200,
  outputTokens: 600,
  estimatedRuntimeSeconds: 90,
  providerOptions: ['example-video-provider'],
})
assert.ok(providerEstimate.requiresExternalProvider, 'External provider estimate should flag provider use')
assert.ok(providerEstimate.expectedInternalCostCents > 0, 'External provider estimate should price provider billing units')
assert.equal(providerEstimate.pricingSnapshot.serviceFeeIncluded, false, 'Tool estimate must exclude ReEditPro service fee')

const rendererEvent = emitToolCostEvent({
  workspaceId,
  projectId,
  editPlanId: '00000000-0000-4000-8000-000000000105',
  jobId: '00000000-0000-4000-8000-000000000106',
  creditEstimateId,
  creditReservationId,
  toolId: 'remotion-render',
  toolName: 'Remotion render',
  usageCategory: 'rendering',
  providerType: 'deterministic_renderer',
  providerName: 'remotion',
  modelName: null,
  qualityLevel: 'production',
  startedAt,
  completedAt,
  wallClockMs: 12_345,
  renderDurationSeconds: 30,
  outputResolution: '1920x1080',
  outputFrameRate: 30,
  vcpuCount: 2,
  memoryGiB: 4,
  billableToUser: true,
})
assert.equal(rendererEvent.billableMs, 60_000, 'Renderer event should use minimum billable runtime')
assert.ok(rendererEvent.actualInternalCostCents > 0, 'Renderer event should calculate internal cost')
assert.equal(rendererEvent.toolCostCredits, centsToCredits(rendererEvent.actualInternalCostCents), 'Renderer event credits should match cent conversion')

const failedProviderEvent = emitToolCostEvent({
  workspaceId,
  projectId,
  jobId: '00000000-0000-4000-8000-000000000107',
  creditEstimateId,
  creditReservationId,
  toolId: 'provider-failure',
  toolName: 'Provider failure',
  usageCategory: 'graphic_design',
  providerType: 'external_api',
  providerName: 'example-image-provider',
  modelName: 'image-model',
  qualityLevel: 'preview',
  startedAt,
  completedAt,
  wallClockMs: 2_000,
  imageCount: 1,
  failureCategory: 'provider_error',
  billableToUser: true,
})
assert.equal(failedProviderEvent.billableToUser, false, 'Provider failures should not be billable to the user')

const retryEvent = emitToolCostEvent({
  workspaceId,
  projectId,
  jobId: '00000000-0000-4000-8000-000000000108',
  creditEstimateId,
  creditReservationId,
  toolId: 'user-retry',
  toolName: 'User retry',
  usageCategory: 'revision',
  providerType: 'cloud_run_job',
  providerName: 'cloud-run',
  modelName: null,
  qualityLevel: 'preview',
  startedAt,
  completedAt,
  wallClockMs: 2_000,
  failureCategory: 'user_requested_retry',
  retryAttempt: 1,
  retryReason: 'user requested a revised result after approval',
  billableToUser: true,
})
assert.equal(retryEvent.billableToUser, true, 'User-requested approved retries may be billable')

assert.throws(() => emitToolCostEvent({
  workspaceId,
  projectId,
  jobId: '00000000-0000-4000-8000-000000000109',
  toolId: 'missing-reservation',
  toolName: 'Missing reservation',
  usageCategory: 'other',
  providerType: 'cloud_run_job',
  providerName: 'cloud-run',
  modelName: null,
  qualityLevel: 'preview',
  startedAt,
  completedAt,
  wallClockMs: 1_000,
  billableToUser: true,
}), /creditEstimateId/, 'Billable events should require approved estimate and reservation')

assert.throws(() => emitToolCostEvent({
  workspaceId,
  projectId,
  jobId: '00000000-0000-4000-8000-000000000110',
  creditEstimateId,
  creditReservationId,
  toolId: 'secret-event',
  toolName: 'Secret event',
  usageCategory: 'other',
  providerType: 'cloud_run_job',
  providerName: 'cloud-run',
  modelName: null,
  qualityLevel: 'preview',
  startedAt,
  completedAt,
  wallClockMs: 1_000,
  billableToUser: true,
  metadata: { apiKey: 'do-not-store' },
}), /secret-like/, 'Cost events should reject secret-like metadata')

const context = createMockContext()
const service = createToolCostMeteringService(context)
const first = service.emitToolCostEvent({
  workspaceId,
  projectId,
  jobId: '00000000-0000-4000-8000-000000000111',
  creditEstimateId,
  creditReservationId,
  toolId: 'transcription-worker',
  toolName: 'Transcription worker',
  usageCategory: 'transcription',
  providerType: 'cloud_run_job',
  providerName: 'cloud-run',
  modelName: null,
  qualityLevel: 'preview',
  startedAt,
  completedAt,
  wallClockMs: 3_000,
  inputAudioSeconds: 90,
  billableToUser: true,
}, 'tool-cost-idempotency-key')
const replay = service.emitToolCostEvent({
  ...first.event,
  metadata: { changedOnReplay: true },
}, 'tool-cost-idempotency-key')
assert.equal(first.replayed, false, 'First event write should not be replayed')
assert.equal(replay.replayed, true, 'Duplicate idempotency key should replay the original event')
assert.deepEqual(replay.event, first.event, 'Duplicate idempotency replay must not double-charge or mutate the event')

const summary = service.getToolCostSummary({ workspaceId, projectId }).summary
assert.equal(summary.billableEventCount, 1, 'Summary should count one stored billable event after idempotent replay')
assert.equal(summary.actualToolCostCredits, first.event.toolCostCredits, 'Summary credits should aggregate stored billable events')
assert.equal(summary.byUsageCategory.transcription.eventCount, 1, 'Summary should group by usage category')
assert.equal(summary.byUsageCategory.rendering.eventCount, 0, 'Summary should not include unpersisted direct helper events')

const backendRequiredService = createToolCostMeteringService({
  ...context,
  env: { ...context.env, mockOnly: false, hasSupabaseAdmin: true },
  clients: { admin: {} as ServiceContext['clients']['admin'], public: null },
})
assert.throws(() => backendRequiredService.emitToolCostEvent({
  workspaceId,
  projectId,
  jobId: '00000000-0000-4000-8000-000000000112',
  creditEstimateId,
  creditReservationId,
  toolId: 'backend-required',
  toolName: 'Backend required',
  usageCategory: 'other',
  providerType: 'cloud_run_job',
  providerName: 'cloud-run',
  modelName: null,
  qualityLevel: 'preview',
  startedAt,
  completedAt,
  wallClockMs: 1_000,
  billableToUser: true,
}, 'backend-required-key'), (error: unknown) => error instanceof ApiError && error.code === 'TOOL_COST_BACKEND_REQUIRED')

assert.ok(toolCostRateCard.version.startsWith('tool-metering-v1-2026-06-26'), 'Rate card version should be stable')

const ownerCoverage = assertToolCostOwnerCoverageComplete()
const ownerCoverageSummary = buildToolCostOwnerCoverageSummary(ownerCoverage)
assert.equal(ownerCoverage.length, PRODUCTION_TOOL_IDS.length, 'Every production registry tool should have metering owner coverage')
assert.equal(ownerCoverageSummary.productionToolCount, PRODUCTION_TOOL_IDS.length, 'Coverage summary should track the production registry count')
assert.equal(ownerCoverageSummary.coveredToolCount, PRODUCTION_TOOL_IDS.length, 'Coverage summary should cover every production tool')
assert.equal(ownerCoverageSummary.missingToolIds.length, 0, 'Coverage summary should not miss registered tools')
assert.equal(ownerCoverageSummary.duplicateToolIds.length, 0, 'Coverage summary should not duplicate tool records')
assert.equal(ownerCoverageSummary.productReadyLocalOssCount, 0, 'Metering coverage must not claim product-ready local OSS tools')
assert.equal(ownerCoverageSummary.serviceFeeIncluded, false, 'Owner coverage must preserve service-fee exclusion')
assert.equal(ownerCoverageSummary.productionBillingPersistence, 'backend_required', 'Owner coverage must not imply real production billing persistence')
assert.equal(ownerCoverage.every((record) => record.requiresApprovedPlanSnapshot), true, 'Every tool case should require an approved plan snapshot')
assert.equal(ownerCoverage.every((record) => record.requiresCreditEstimate), true, 'Every tool case should require a credit estimate')
assert.equal(ownerCoverage.every((record) => record.requiresCreditReservation), true, 'Every tool case should require a credit reservation')
assert.equal(ownerCoverage.every((record) => record.requiresIdempotentEvent), true, 'Every tool case should require idempotent cost events')
assert.equal(ownerCoverage.every((record) => record.productReadyLocalOss === false), true, 'No tool case should become product-ready from metering coverage')
assert.equal(getToolCostOwnerCoverage('remotion').usageCategory, 'rendering', 'Remotion should map to rendering metering')
assert.equal(getToolCostOwnerCoverage('ffmpeg').usageCategory, 'export', 'FFmpeg should map to export metering')
assert.equal(getToolCostOwnerCoverage('faster_whisper').usageCategory, 'transcription', 'Whisper-class tools should map to transcription metering')
assert.equal(getToolCostOwnerCoverage('real_esrgan').computeLevel, 'premium', 'GPU AI tools should default to premium metering')
assert.equal(getToolCostOwnerCoverage('remotion').providerType, 'deterministic_renderer', 'Render worker tools should use deterministic renderer metering')

console.log(JSON.stringify({
  ok: true,
  rateCardVersion: toolCostRateCard.version,
  checks: [
    'credit_conversion',
    'minimum_billing_rounding',
    'compute_level_ordering',
    'external_provider_pricing',
    'deterministic_renderer_pricing',
    'reservation_high_estimate_blocking',
    'billable_event_requires_estimate_and_reservation',
    'provider_failure_non_billable',
    'approved_user_retry_billable',
    'idempotent_event_replay',
    'secret_rejection',
    'summary_grouping',
    'backend_persistence_required_blocker',
    'production_tool_owner_coverage',
    'owner_case_requirements',
  ],
  productionToolOwnerCoverage: {
    productionToolCount: ownerCoverageSummary.productionToolCount,
    coveredToolCount: ownerCoverageSummary.coveredToolCount,
    productReadyLocalOssCount: ownerCoverageSummary.productReadyLocalOssCount,
    blockedOrReviewToolCount: ownerCoverageSummary.blockedOrReviewToolIds.length,
  },
  exampleEstimate: {
    toolId: providerEstimate.toolId,
    lowCredits: providerEstimate.lowCredits,
    expectedCredits: providerEstimate.expectedCredits,
    highCredits: providerEstimate.highCredits,
    riskLevel: providerEstimate.riskLevel,
  },
  exampleEvent: {
    id: rendererEvent.id,
    actualInternalCostCents: rendererEvent.actualInternalCostCents,
    toolCostCredits: rendererEvent.toolCostCredits,
    billableToUser: rendererEvent.billableToUser,
  },
}, null, 2))

function createMockContext(): ServiceContext {
  return {
    env: {
      ...loadRuntimeEnv({
        API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
        E2E_RUNTIME_MODE: 'mock',
      }),
      mockOnly: true,
    },
    clients: { admin: null, public: null },
    requestId: 'tool-cost-metering-smoke',
    auth: {
      userId: 'mock-user-runtime',
      email: 'mock-user@reeditpro.local',
      isMockUser: true,
    },
  }
}
