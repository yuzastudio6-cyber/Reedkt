import assert from 'node:assert/strict'

import { loadRuntimeEnv } from '../config/env'
import { createMockCreditDataStore, previewCreditSettlement } from '../services/mock-credit-data-store'
import { createProviderGatewayService } from '../services/provider-gateway-service'
import { createRenderService } from '../services/render-service'
import type { ServiceContext } from '../types'
import {
  createMockToolCostStore,
  emitProductionToolCostEvent,
  estimateProductionToolCost,
  listProductionToolMeteringProfiles,
  summarizeMockToolCostEvents,
  type ProductionToolCostResult,
} from '../tool-cost-metering'
import {
  PRODUCTION_TOOL_IDS,
  summarizeProductionToolRegistry,
  type ProductionToolId,
} from '../tool-registry'
import {
  productionToolIdSchema,
  toolCostProductEditLevelSchema,
  toolCreditPrerequisiteStatusSchema,
  toolRuntimeComputeLevelSchema,
} from '../validation/tool-cost-schemas'
import { buildWorkerIdempotencyKey, runProductionWorkerRuntime, type ProductionWorkerJobPayload } from '../workers/production'

function unwrap<T>(result: ProductionToolCostResult<T>): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

function expectError<T>(
  result: ProductionToolCostResult<T>,
  code: string,
  message: string,
) {
  assert.equal(result.ok, false, message)
  if (!result.ok) assert.equal(result.error.code, code, message)
}

const registrySummary = summarizeProductionToolRegistry()
const profiles = listProductionToolMeteringProfiles()
assert.equal(registrySummary.totalTools, 49, 'Production registry baseline must remain 49 tools.')
assert.equal(PRODUCTION_TOOL_IDS.length, 49, 'Required production tool ID count must remain 49.')
assert.equal(profiles.length, PRODUCTION_TOOL_IDS.length, 'Every production tool needs one metering profile.')

const profileIds = new Set(profiles.map((profile) => profile.toolId))
for (const toolId of PRODUCTION_TOOL_IDS) {
  assert.equal(profileIds.has(toolId), true, `Missing metering profile for ${toolId}.`)
}

for (const profile of profiles) {
  assert.ok(profile.toolName, `${profile.toolId} needs a tool name.`)
  assert.ok(profile.owner, `${profile.toolId} needs an owner.`)
  assert.ok(profile.usageCategory, `${profile.toolId} needs a usage category.`)
  assert.ok(profile.providerBoundary, `${profile.toolId} needs a provider boundary.`)
  assert.ok(profile.providerType, `${profile.toolId} needs a provider type.`)
  assert.ok(profile.defaultToolComputeLevel, `${profile.toolId} needs a default compute level.`)
  assert.ok(profile.defaultQualityLevel, `${profile.toolId} needs a default quality level.`)
  assert.ok(profile.defaultRiskLevel, `${profile.toolId} needs a default risk level.`)
  assert.equal(typeof profile.requiresApprovedPlan, 'boolean', `${profile.toolId} needs an approved-plan flag.`)
  assert.equal(typeof profile.requiresApprovedCreditEstimate, 'boolean', `${profile.toolId} needs an approved-estimate flag.`)
  assert.equal(typeof profile.requiresActiveCreditReservation, 'boolean', `${profile.toolId} needs a reservation flag.`)
  assert.equal(typeof profile.requiresIdempotencyKey, 'boolean', `${profile.toolId} needs an idempotency flag.`)
  assert.equal(profile.serviceFeeIncluded, false, `${profile.toolId} must exclude ReEditPro service fee.`)
  assert.notEqual(profile.owner, 'provider_gateway' as never, `${profile.toolId} must not claim a live provider owner.`)
}

const readyEstimate = unwrap(estimateProductionToolCost({
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  toolComputeLevel: 'standard',
  qualityLevel: 'economy',
  approvedReservationRemainingCredits: 100,
  idempotencyKey: 'toolcost-estimate-ready',
}))
assert.equal(readyEstimate.creditPrerequisiteStatus, 'ready')
assert.equal(readyEstimate.serviceFeeIncluded, false)
assert.equal(readyEstimate.pricingSnapshot.serviceFeeIncluded, false)
assert.ok(readyEstimate.range.lowInternalCostCents <= readyEstimate.range.expectedInternalCostCents)
assert.ok(readyEstimate.range.expectedInternalCostCents <= readyEstimate.range.highInternalCostCents)
assert.ok(readyEstimate.lowInternalCostMicros <= readyEstimate.expectedInternalCostMicros)
assert.ok(readyEstimate.expectedInternalCostMicros <= readyEstimate.highInternalCostMicros)
assert.equal(readyEstimate.productEditLevel, 'normal')
assert.equal(readyEstimate.toolComputeLevel, 'standard')

expectError(estimateProductionToolCost({
  toolId: 'not_a_tool',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  productEditLevel: 'normal',
}), 'unknown_tool', 'Unknown tool estimates must fail safely.')

expectError(estimateProductionToolCost({
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  productEditLevel: 'economy' as never,
}), 'invalid_context', 'Runtime compute levels must not be accepted as product edit levels.')

expectError(estimateProductionToolCost({
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  productEditLevel: 'normal',
  toolComputeLevel: 'normal',
}), 'invalid_context', 'Product edit levels must not be accepted as runtime compute levels.')

const blockedEstimate = unwrap(estimateProductionToolCost({
  toolId: 'revideo',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: 'toolcost-blocked-estimate',
}))
assert.equal(blockedEstimate.creditPrerequisiteStatus, 'estimate_only')

const reservationRequiredProfile = profiles.find((profile) =>
  profile.requiresActiveCreditReservation && !profile.estimateOnlyWhenBlocked
)
assert.ok(reservationRequiredProfile, 'At least one currently executable profile should require reservation.')
const missingReservation = unwrap(estimateProductionToolCost({
  toolId: reservationRequiredProfile.toolId,
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: 'toolcost-missing-reservation',
}))
assert.equal(missingReservation.creditPrerequisiteStatus, 'missing_active_credit_reservation')

const missingIdempotency = unwrap(estimateProductionToolCost({
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
}))
assert.equal(missingIdempotency.creditPrerequisiteStatus, 'missing_idempotency_key')

const revisedEstimate = unwrap(estimateProductionToolCost({
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  approvedReservationRemainingCredits: 0,
  idempotencyKey: 'toolcost-revised-estimate',
}))
assert.equal(revisedEstimate.creditPrerequisiteStatus, 'requires_revised_estimate')
assert.equal(revisedEstimate.canRunWithinApprovedReservation, false)

const store = createMockToolCostStore()
const inserted = unwrap(emitProductionToolCostEvent({
  store,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: 'toolcost-event-idempotent',
  billableToUser: true,
}))
assert.equal(inserted.idempotencyStatus, 'inserted')
assert.equal(inserted.event.billableToUser, true)
assert.equal(inserted.event.serviceFeeIncluded, false)
assert.equal(inserted.event.metadata.serviceFeeIncluded, false)
assert.equal(inserted.event.toolCostCredits, inserted.event.credits)

const duplicate = unwrap(emitProductionToolCostEvent({
  store,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: 'toolcost-event-idempotent',
  billableToUser: true,
}))
assert.equal(duplicate.idempotencyStatus, 'duplicate_returned')
assert.equal(duplicate.event.id, inserted.event.id)
assert.equal(store.toolCostEvents.length, 1)

const nonBillable = unwrap(emitProductionToolCostEvent({
  store,
  toolId: 'revideo',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: 'toolcost-event-nonbillable',
  billableToUser: false,
  nonBillableReason: 'production_blocked_absorbed',
}))
assert.equal(nonBillable.event.billableToUser, false)
assert.equal(nonBillable.event.nonBillableReason, 'production_blocked_absorbed')

const missingCreditEstimateEvent = emitProductionToolCostEvent({
  store,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: 'toolcost-missing-credit-estimate',
  billableToUser: true,
})
assert.equal(missingCreditEstimateEvent.ok, false)
if (!missingCreditEstimateEvent.ok) {
  assert.equal(missingCreditEstimateEvent.error.status, 'missing_approved_credit_estimate')
}

expectError(emitProductionToolCostEvent({
  store,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: 'toolcost-secret-metadata',
  billableToUser: true,
  metadata: { apiKey: 'secret' },
}), 'secret_like_metadata', 'Secret-like metadata must be rejected.')

expectError(emitProductionToolCostEvent({
  store,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: 'toolcost-service-fee-metadata',
  billableToUser: true,
  metadata: { serviceFeeIncluded: true },
}), 'forbidden_tool_cost_metadata', 'Service-fee metadata must be rejected.')

const aggregation = summarizeMockToolCostEvents(store.toolCostEvents)
assert.equal(aggregation.billableEventCount, 1)
assert.equal(aggregation.nonBillableEventCount, 1)
assert.equal(aggregation.actualBillableCostCredits, inserted.event.toolCostCredits)

const creditDataStore = createMockCreditDataStore(store.toolCostEvents)
const preview = previewCreditSettlement(creditDataStore, {
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  creditReservationId: 'reservation-toolcost-smoke',
  editComputeLevel: 'normal',
  finalVideoDurationSeconds: 240,
  reservedCredits: 200,
  toolCostEventIds: store.toolCostEvents.map((event) => event.id),
  idempotencyKey: 'toolcost-preview',
})
assert.equal(preview.settlement.actualToolCostCredits, aggregation.actualBillableCostCredits)
assert.ok(preview.settlement.reeditproServiceFeeCredits > 0)
assert.equal(
  preview.settlement.finalChargeCredits,
  preview.settlement.actualToolCostCredits + preview.settlement.reeditproServiceFeeCredits,
)

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  STRICT_TOOL_READINESS: 'false',
  TOOL_CHECK_TIMEOUT_MS: '10000',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})
const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'production-tool-cost-smoke',
  auth: { userId: 'toolcost-smoke-user', isMockUser: true },
}

const providerResult = await createProviderGatewayService(context).createProviderRequestAttempt({
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  providerRoute: 'mock-provider-route',
  providerModel: 'mock-provider-model',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  creditReservationId: 'reservation-toolcost-smoke',
  toolId: 'opencv',
  requestPayloadHash: 'hash-toolcost-smoke',
  mockOnly: true,
})
assert.equal(providerResult.providerRequestAttempt.mockOnly, true)
assert.equal(providerResult.toolCostEstimate?.serviceFeeIncluded, false)
assert.ok(providerResult.warnings.some((warning) => warning.includes('No OpenAI')))

const renderResult = await createRenderService(context).createRenderJob({
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  creditReservationId: 'reservation-toolcost-smoke',
  renderType: 'preview',
  renderQualityLevel: 'draft',
})
assert.equal(renderResult.renderJob.mockOnly, true)
assert.equal(renderResult.renderJob.toolId, 'remotion')
assert.equal(renderResult.toolCostEstimate?.serviceFeeIncluded, false)

const workerPayloadBase: Omit<ProductionWorkerJobPayload, 'idempotencyKey'> = {
  jobId: 'toolcost-worker-job',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  mediaAssetId: 'media-toolcost-smoke',
  approvedSnapshotId: 'approved-toolcost-smoke',
  editPlanId: 'edit-plan-toolcost-smoke',
  toolExecutionPlanId: 'tool-exec-toolcost-smoke',
  mediaAnalysisReportId: 'media-analysis-toolcost-smoke',
  workerType: 'cpu_analysis_worker',
  executionMode: 'dry_run',
  attempt: 1,
  maxAttempts: 2,
  requestedToolIds: ['ffprobe' satisfies ProductionToolId],
  requestedRecipeIds: ['toolcost-smoke-recipe'],
  storageReferenceIds: ['source_media/workspaces/workspace-toolcost-smoke/projects/project-toolcost-smoke/source.mov'],
  createdAt: new Date().toISOString(),
  metadata: {
    creditEstimateId: 'estimate-toolcost-smoke',
    productEditLevel: 'normal',
  },
}
const workerPayloadCandidate: ProductionWorkerJobPayload = { ...workerPayloadBase, idempotencyKey: '' }
const workerPayload: ProductionWorkerJobPayload = {
  ...workerPayloadBase,
  idempotencyKey: buildWorkerIdempotencyKey(workerPayloadCandidate),
}
const workerResult = await runProductionWorkerRuntime({ payload: workerPayload })
assert.equal(workerResult.status, 'completed')
assert.equal(workerResult.toolCostMetadata?.mockOnly, true)
assert.equal(workerResult.toolCostMetadata?.serviceFeeIncluded, false)
assert.equal(workerResult.toolCostMetadata?.requestedToolCount, 1)
assert.equal(workerResult.toolCostMetadata?.emittedEvents.length, 1)
assert.equal(workerResult.toolCostMetadata?.emittedEvents[0]?.billableToUser, false)

assert.equal(productionToolIdSchema.safeParse('ffmpeg').success, true)
assert.equal(productionToolIdSchema.safeParse('not_a_tool').success, false)
assert.equal(toolCreditPrerequisiteStatusSchema.safeParse('ready').success, true)
assert.equal(toolCreditPrerequisiteStatusSchema.safeParse('charged').success, false)
assert.equal(toolCostProductEditLevelSchema.safeParse('normal').success, true)
assert.equal(toolCostProductEditLevelSchema.safeParse('economy').success, false)
assert.equal(toolRuntimeComputeLevelSchema.safeParse('economy').success, true)
assert.equal(toolRuntimeComputeLevelSchema.safeParse('ultra_premium').success, false)

console.log(JSON.stringify({
  ok: true,
  productionRegistryToolCount: registrySummary.totalTools,
  meteringProfileCount: profiles.length,
  billableEventIds: aggregation.billableEventIds,
  nonBillableEventIds: aggregation.nonBillableEventIds,
  providerBoundaryStatus: providerResult.toolCostEstimate?.creditPrerequisiteStatus,
  renderBoundaryToolId: renderResult.renderJob.toolId,
  workerCostEventCount: workerResult.toolCostMetadata?.emittedEvents.length ?? 0,
  serviceFeeIncluded: false,
  forbiddenSideEffects: [
    'no_wallet_mutation',
    'no_reservation_mutation',
    'no_ledger_write',
    'no_settlement_execution',
    'no_provider_call',
    'no_render_execution',
  ],
}, null, 2))
