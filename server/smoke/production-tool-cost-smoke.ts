import assert from 'node:assert/strict'

import {
  AUDIO_PROVIDER_ROUTES,
  GENERATED_ASSET_PROVIDER_ROUTES,
  MODEL_ROLE_PROVIDER_ROUTES,
  PROVIDER_ROUTES,
  isAudioProviderRoute,
  isGeneratedAssetProviderRoute,
  isModelRoleProviderRoute,
  validateProviderGatewayRequest,
  type ProviderGatewayRequest,
} from '../../src/backend/cloud/provider-gateway-contracts'
import { createMockProviderGatewayClient } from '../../src/backend/providers/gateway/mock-provider-clients'
import { dispatchProviderGatewayRequest } from '../../src/backend/providers/gateway/provider-gateway-service'
import {
  getProviderSecretReference,
  isKnownProviderSecretName,
} from '../../src/backend/providers/gateway/provider-secret-boundary'
import { loadRuntimeEnv } from '../config/env'
import { createMockCreditDataStore, previewCreditSettlement } from '../services/mock-credit-data-store'
import { createProviderGatewayService } from '../services/provider-gateway-service'
import { createRenderService } from '../services/render-service'
import type { ServiceContext } from '../types'
import {
  buildToolCostEventIdempotencyKey,
  createMockToolCostStore,
  emitProductionToolCostEvent,
  emitToolCostEvent,
  estimateProductionToolCost,
  estimateToolCost,
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
  mockToolCostEventSchema,
  productionToolCostEstimateSchema,
  productionToolCostEventEmissionSchema,
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
assert.ok(registrySummary.totalTools >= 49, 'Production registry must include the original 49-tool baseline or more.')
assert.equal(registrySummary.totalTools, PRODUCTION_TOOL_IDS.length, 'Production registry summary must match tool IDs.')
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
productionToolCostEstimateSchema.parse(readyEstimate)

const canonicalEstimate = unwrap(estimateToolCost({
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  toolComputeLevel: 'standard',
  qualityLevel: 'economy',
  approvedReservationRemainingCredits: 100,
  idempotencyKey: 'toolcost-canonical-estimate-ready',
}))
assert.equal(canonicalEstimate.creditPrerequisiteStatus, 'ready')
assert.equal(canonicalEstimate.rateCardVersion, readyEstimate.rateCardVersion)
assert.equal(canonicalEstimate.serviceFeeIncluded, false)
assert.equal(canonicalEstimate.pricingSnapshot.serviceFeeIncluded, false)
productionToolCostEstimateSchema.parse(canonicalEstimate)

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

expectError(estimateProductionToolCost({
  toolId: 'revideo',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: 'toolcost-blocked-estimate',
}), 'unknown_tool', 'Non-E2E capability estimates must be rejected.')

const blockedEstimate = unwrap(estimateProductionToolCost({
  toolId: 'rembg',
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
const insertedEventIdempotencyKey = buildToolCostEventIdempotencyKey({
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  toolId: 'opentimelineio',
  jobId: 'toolcost-job-smoke',
  retryAttempt: 0,
})
assert.equal(
  insertedEventIdempotencyKey,
  'tool-cost-event:workspace-toolcost-smoke:project-toolcost-smoke:job:toolcost-job-smoke:opentimelineio:retry-0',
)
assert.equal(
  buildToolCostEventIdempotencyKey({
    workspaceId: 'workspace-toolcost-smoke',
    projectId: 'project-toolcost-smoke',
    toolId: 'opentimelineio',
    jobId: 'toolcost-job-smoke',
    retryAttempt: 1,
  }),
  'tool-cost-event:workspace-toolcost-smoke:project-toolcost-smoke:job:toolcost-job-smoke:opentimelineio:retry-1',
)
const inserted = unwrap(emitProductionToolCostEvent({
  store,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  jobId: 'toolcost-job-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: insertedEventIdempotencyKey,
  billableToUser: true,
}))
assert.equal(inserted.idempotencyStatus, 'inserted')
assert.equal(inserted.event.billableToUser, true)
assert.equal(inserted.event.serviceFeeIncluded, false)
assert.equal(inserted.event.metadata.serviceFeeIncluded, false)
assert.equal(inserted.event.metadata.costEventKeyShape, 'workspace_project_work_tool_retry')
assert.equal(inserted.event.metadata.costEventWorkKind, 'job')
assert.equal(inserted.event.metadata.costEventWorkId, 'toolcost-job-smoke')
assert.equal(inserted.event.metadata.costEventRetryAttempt, 0)
assert.equal(inserted.event.toolCostCredits, inserted.event.credits)
productionToolCostEventEmissionSchema.parse(inserted)
mockToolCostEventSchema.parse(inserted.event)

const duplicate = unwrap(emitProductionToolCostEvent({
  store,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  jobId: 'toolcost-job-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: insertedEventIdempotencyKey,
  billableToUser: true,
}))
assert.equal(duplicate.idempotencyStatus, 'duplicate_returned')
assert.equal(duplicate.event.id, inserted.event.id)
assert.equal(store.toolCostEvents.length, 1)

const canonicalStore = createMockToolCostStore()
const canonicalEventIdempotencyKey = buildToolCostEventIdempotencyKey({
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  toolId: 'opentimelineio',
  generationRequestId: 'toolcost-generation-smoke',
  retryAttempt: 0,
})
const canonicalInserted = unwrap(emitToolCostEvent({
  store: canonicalStore,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  generationRequestId: 'toolcost-generation-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: canonicalEventIdempotencyKey,
  billableToUser: true,
}))
const canonicalDuplicate = unwrap(emitToolCostEvent({
  store: canonicalStore,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  generationRequestId: 'toolcost-generation-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: canonicalEventIdempotencyKey,
  billableToUser: true,
}))
assert.equal(canonicalInserted.idempotencyStatus, 'inserted')
assert.equal(canonicalDuplicate.idempotencyStatus, 'duplicate_returned')
assert.equal(canonicalDuplicate.event.id, canonicalInserted.event.id)
assert.equal(canonicalStore.toolCostEvents.length, 1)
assert.equal(canonicalInserted.serviceFeeIncluded, false)
assert.equal(canonicalInserted.event.serviceFeeIncluded, false)
productionToolCostEventEmissionSchema.parse(canonicalInserted)

const failureRuleStore = createMockToolCostStore()
const providerFailure = unwrap(emitProductionToolCostEvent({
  store: failureRuleStore,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  jobId: 'toolcost-provider-failure-job',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: buildToolCostEventIdempotencyKey({
    workspaceId: 'workspace-toolcost-smoke',
    projectId: 'project-toolcost-smoke',
    toolId: 'opentimelineio',
    jobId: 'toolcost-provider-failure-job',
    retryAttempt: 0,
  }),
  failureCategory: 'provider_error',
}))
assert.equal(providerFailure.event.billableToUser, false)
assert.equal(providerFailure.event.failureCategory, 'provider_error')
assert.equal(providerFailure.event.nonBillableReason, 'provider_error')
assert.equal(providerFailure.event.serviceFeeIncluded, false)

expectError(emitProductionToolCostEvent({
  store: failureRuleStore,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  jobId: 'toolcost-forced-provider-failure-job',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: buildToolCostEventIdempotencyKey({
    workspaceId: 'workspace-toolcost-smoke',
    projectId: 'project-toolcost-smoke',
    toolId: 'opentimelineio',
    jobId: 'toolcost-forced-provider-failure-job',
    retryAttempt: 0,
  }),
  failureCategory: 'provider_error',
  billableToUser: true,
}), 'invalid_context', 'Provider/runtime failures must not be force-billable.')

const approvedUserRetry = unwrap(emitProductionToolCostEvent({
  store: failureRuleStore,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  jobId: 'toolcost-user-retry-job',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: buildToolCostEventIdempotencyKey({
    workspaceId: 'workspace-toolcost-smoke',
    projectId: 'project-toolcost-smoke',
    toolId: 'opentimelineio',
    jobId: 'toolcost-user-retry-job',
    retryAttempt: 1,
  }),
  failureCategory: 'user_requested_retry',
  retryAttempt: 1,
}))
assert.equal(approvedUserRetry.event.billableToUser, true)
assert.equal(approvedUserRetry.event.failureCategory, 'user_requested_retry')
assert.equal(approvedUserRetry.event.retryAttempt, 1)

const nonBillable = unwrap(emitProductionToolCostEvent({
  store,
  toolId: 'rembg',
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
  idempotencyKey: 'toolcost-raw-prompt-provider-result',
  billableToUser: true,
  providerResult: { rawPrompt: 'do not store raw chat prompts in tool-cost events' },
}), 'secret_like_metadata', 'Raw prompt provider results must be rejected.')

expectError(emitProductionToolCostEvent({
  store,
  toolId: 'opentimelineio',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  productEditLevel: 'normal',
  idempotencyKey: 'toolcost-runtime-signed-url-value',
  billableToUser: true,
  runtime: { privateObjectReference: 'https://storage.googleapis.com/bucket/object?X-Goog-Signature=abc' },
}), 'secret_like_metadata', 'Signed URL runtime values must be rejected.')

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
  providerUsage: {
    requestCount: 1,
    outputVideoSeconds: 12,
    outputAudioSeconds: 6,
    imageCount: 2,
  },
  mockOnly: true,
})
assert.equal(providerResult.providerRequestAttempt.mockOnly, true)
assert.equal(providerResult.toolCostEstimate?.serviceFeeIncluded, false)
assert.equal(providerResult.toolCostEstimate?.sourceKind, 'external_provider')
assert.equal(providerResult.toolCostEstimate?.actualUsagePricingSnapshot.provider, 'mock-provider-route')
assert.equal(providerResult.toolCostEstimate?.actualUsagePricingSnapshot.model, 'mock-provider-model')
assert.equal(
  readNested(providerResult.toolCostEstimate?.actualUsagePricingSnapshot, ['pricingUnits', 'units', 'outputVideoSeconds']),
  12,
)
productionToolCostEstimateSchema.parse(providerResult.toolCostEstimate)
assert.ok(providerResult.warnings.some((warning) => warning.includes('No OpenAI')))

const qwenPlanningProviderResult = await createProviderGatewayService(context).createProviderRequestAttempt({
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  providerRoute: 'qwen_3_7_provider_boundary',
  providerModel: 'qwen3.7-max-2026-06-08',
  requestedModelUse: 'edit_planning',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  creditEstimateId: 'estimate-toolcost-smoke',
  creditReservationId: 'reservation-toolcost-smoke',
  requestPayloadHash: 'hash-qwen-planning-smoke',
  mockOnly: true,
})
assert.equal(qwenPlanningProviderResult.providerRequestAttempt.modelRoleId, 'qwen_3_7_main_edit_agent')
assert.equal(qwenPlanningProviderResult.providerRequestAttempt.canonicalProviderModel, 'qwen3.7-max-2026-06-08')
assert.equal(qwenPlanningProviderResult.providerRequestAttempt.modelRoleProviderBoundary, 'qwen_3_7_provider_boundary')
assert.equal(qwenPlanningProviderResult.providerRequestAttempt.requestedModelUse, 'edit_planning')
assert.equal(qwenPlanningProviderResult.warnings.some((warning) => warning.includes('No OpenAI, Kimi, Qwen, DeepSeek')), true)

await assert.rejects(
  () => createProviderGatewayService(context).createProviderRequestAttempt({
    workspaceId: 'workspace-toolcost-smoke',
    projectId: 'project-toolcost-smoke',
    providerRoute: 'qwen_3_7_provider_boundary',
    providerModel: 'DeepSeek V4 Pro',
    requestedModelUse: 'edit_planning',
    approvedPlanSnapshotId: 'approved-toolcost-smoke',
    creditEstimateId: 'estimate-toolcost-smoke',
    creditReservationId: 'reservation-toolcost-smoke',
    requestPayloadHash: 'hash-provider-model-mismatch-smoke',
    mockOnly: true,
  }),
  (error) => error instanceof Error &&
    'code' in error &&
    error.code === 'PROVIDER_MODEL_ROLE_FORBIDDEN',
  'Provider gateway must reject mismatched provider route/model role metadata.',
)

await assert.rejects(
  () => createProviderGatewayService(context).createProviderRequestAttempt({
    workspaceId: 'workspace-toolcost-smoke',
    projectId: 'project-toolcost-smoke',
    providerRoute: 'gpt_image_2',
    providerModel: 'Qwen 3.7 Max',
    requestedModelUse: 'edit_planning',
    approvedPlanSnapshotId: 'approved-toolcost-smoke',
    creditEstimateId: 'estimate-toolcost-smoke',
    creditReservationId: 'reservation-toolcost-smoke',
    requestPayloadHash: 'hash-provider-concrete-route-mismatch-smoke',
    mockOnly: true,
  }),
  (error) => error instanceof Error &&
    'code' in error &&
    error.code === 'PROVIDER_MODEL_ROLE_FORBIDDEN',
  'Provider gateway must reject Qwen/DeepSeek model roles on concrete asset-generation routes.',
)

await assert.rejects(
  () => createProviderGatewayService(context).createProviderRequestAttempt({
    workspaceId: 'workspace-toolcost-smoke',
    projectId: 'project-toolcost-smoke',
    providerRoute: 'deepseek_v4_pro_tool_code_boundary',
    providerModel: 'DeepSeek V4 Pro',
    requestedModelUse: 'visual_understanding',
    approvedPlanSnapshotId: 'approved-toolcost-smoke',
    creditEstimateId: 'estimate-toolcost-smoke',
    creditReservationId: 'reservation-toolcost-smoke',
    requestPayloadHash: 'hash-deepseek-user-reasoning-smoke',
    mockOnly: true,
  }),
  (error) => error instanceof Error &&
    'code' in error &&
    error.code === 'PROVIDER_MODEL_ROLE_FORBIDDEN',
  'Provider gateway must reject DeepSeek for visual understanding while allowing it only in the ordered reasoning fallback chain.',
)

const providerGatewayRoleRequestBase: ProviderGatewayRequest = {
  generationRequestId: 'generation-role-gate-smoke',
  jobId: 'job-role-gate-smoke',
  workspaceId: 'workspace-toolcost-smoke',
  projectId: 'project-toolcost-smoke',
  approvedPlanSnapshotId: 'approved-toolcost-smoke',
  editPlanId: 'edit-plan-toolcost-smoke',
  creditReservationId: 'reservation-toolcost-smoke',
  providerRoute: 'none',
  signatureSystem: 'none',
  generationType: 'none',
  qualityLevel: 'draft',
  modelTier: 'premium',
  inputAssetIds: [],
  outputRequirements: {
    outputAssetType: 'none',
  },
  safetyConstraints: {
    routeRole: 'fallback',
  },
  idempotencyKey: 'provider-gateway-role-gate-smoke',
  metadata: {
    mockOnly: true,
  },
}
assert.equal(validateProviderGatewayRequest({
  ...providerGatewayRoleRequestBase,
  modelRoleId: 'qwen_3_7_main_edit_agent',
  requestedModelUse: 'edit_planning',
}).ok, true)
assert.equal(validateProviderGatewayRequest({
  ...providerGatewayRoleRequestBase,
  modelRoleId: 'deepseek_v4_tool_code_agent',
  requestedModelUse: 'user_reasoning',
}).ok, true)
assert.equal(validateProviderGatewayRequest({
  ...providerGatewayRoleRequestBase,
  modelRoleId: 'kimi_k3_main_edit_agent',
  requestedModelUse: 'edit_planning',
  safetyConstraints: { routeRole: 'primary' },
}).ok, true)

const qwenCloudGatewayRequest: ProviderGatewayRequest = {
  ...providerGatewayRoleRequestBase,
  providerRoute: 'qwen_3_7_provider_boundary',
  providerModel: 'qwen3.7-max-2026-06-08',
  modelRoleId: 'qwen_3_7_main_edit_agent',
  requestedModelUse: 'edit_planning',
}
assert.equal(validateProviderGatewayRequest(qwenCloudGatewayRequest).ok, true)
const missingQwenUseResult = validateProviderGatewayRequest({
  ...providerGatewayRoleRequestBase,
  providerRoute: 'qwen_3_7_provider_boundary',
  modelRoleId: 'qwen_3_7_main_edit_agent',
})
assert.equal(missingQwenUseResult.ok, false)
assert.equal(
  missingQwenUseResult.errors.some((error) => error.includes('requires an explicit requested model use')),
  true,
)
const mismatchedQwenRouteResult = validateProviderGatewayRequest({
  ...providerGatewayRoleRequestBase,
  providerRoute: 'deepseek_v4_pro_tool_code_boundary',
  modelRoleId: 'qwen_3_7_main_edit_agent',
  requestedModelUse: 'edit_planning',
})
assert.equal(mismatchedQwenRouteResult.ok, false)
assert.equal(
  mismatchedQwenRouteResult.errors.some((error) => error.includes('model role metadata mismatch')),
  true,
)
const mismatchedQwenModelResult = validateProviderGatewayRequest({
  ...providerGatewayRoleRequestBase,
  providerRoute: 'qwen_3_7_provider_boundary',
  providerModel: 'DeepSeek V4 Pro',
  requestedModelUse: 'edit_planning',
})
assert.equal(mismatchedQwenModelResult.ok, false)
assert.equal(
  mismatchedQwenModelResult.errors.some((error) => error.includes('model role metadata mismatch')),
  true,
)
const unknownQwenModelResult = validateProviderGatewayRequest({
  ...providerGatewayRoleRequestBase,
  providerRoute: 'qwen_3_7_provider_boundary',
  providerModel: 'unknown-planner-model',
  modelRoleId: 'qwen_3_7_main_edit_agent',
  requestedModelUse: 'edit_planning',
})
assert.equal(unknownQwenModelResult.ok, false)
assert.equal(
  unknownQwenModelResult.errors.some((error) => error.includes('canonical provider model qwen3.7-max-2026-06-08')),
  true,
)
const concreteRouteWithModelRoleResult = validateProviderGatewayRequest({
  ...providerGatewayRoleRequestBase,
  providerRoute: 'gpt_image_2',
  modelRoleId: 'qwen_3_7_main_edit_agent',
  requestedModelUse: 'edit_planning',
})
assert.equal(concreteRouteWithModelRoleResult.ok, false)
assert.equal(
  concreteRouteWithModelRoleResult.errors.some((error) => error.includes('concrete provider route gpt_image_2')),
  true,
)
assert.equal(PROVIDER_ROUTES.includes('qwen_3_7_provider_boundary'), true)
assert.equal(PROVIDER_ROUTES.includes('kimi_k3_provider_boundary'), true)
assert.equal(PROVIDER_ROUTES.includes('qwen2_5_vl_7b_instruct_provider_boundary'), true)
assert.equal(PROVIDER_ROUTES.includes('deepseek_v4_pro_tool_code_boundary'), true)
assert.deepEqual([...MODEL_ROLE_PROVIDER_ROUTES], [
  'kimi_k3_provider_boundary',
  'qwen_3_7_provider_boundary',
  'qwen2_5_vl_7b_instruct_provider_boundary',
  'deepseek_v4_pro_tool_code_boundary',
])
assert.equal(isModelRoleProviderRoute('qwen_3_7_provider_boundary'), true)
assert.equal(isModelRoleProviderRoute('gpt_image_2'), false)
assert.equal(GENERATED_ASSET_PROVIDER_ROUTES.includes('gpt_image_2'), true)
assert.equal(isGeneratedAssetProviderRoute('gpt_image_2'), true)
assert.equal(isGeneratedAssetProviderRoute('qwen_3_7_provider_boundary'), false)
assert.deepEqual([...AUDIO_PROVIDER_ROUTES], [
  'mirelo_sfx_v1_5',
  'mmaudio_v2',
])
assert.equal(isAudioProviderRoute('mirelo_sfx_v1_5'), true)
assert.equal(isAudioProviderRoute('mmaudio_v2'), true)
assert.equal(isAudioProviderRoute('gpt_image_2'), false)
assert.equal(isModelRoleProviderRoute('mirelo_sfx_v1_5'), false)
assert.equal(isGeneratedAssetProviderRoute('mirelo_sfx_v1_5'), true)
assert.equal(isGeneratedAssetProviderRoute('mmaudio_v2'), true)
const mireloAudioGatewayRequest: ProviderGatewayRequest = {
  ...providerGatewayRoleRequestBase,
  providerRoute: 'mirelo_sfx_v1_5',
  generationRequestId: 'generation-mirelo-audio-smoke',
  jobId: 'job-mirelo-audio-smoke',
  signatureSystem: 'soundsync_sfx_director',
  generationType: 'sfx_asset',
  qualityLevel: 'premium',
  outputRequirements: {
    durationSeconds: 1.6,
    outputAssetType: 'generated_audio',
  },
  idempotencyKey: 'provider-gateway-mirelo-audio-smoke',
}
assert.equal(validateProviderGatewayRequest(mireloAudioGatewayRequest).ok, true)
const mireloMockGatewayResponse = createMockProviderGatewayClient('mirelo_sfx_v1_5')
  .prepareRequest(mireloAudioGatewayRequest)
assert.equal(mireloMockGatewayResponse.status, 'accepted_mock')
assert.equal(mireloMockGatewayResponse.secretReferenceName, 'reeditpro-prod-mirelo-api-key')
assert.equal(mireloMockGatewayResponse.usageEstimate.generationType, 'sfx_asset')
assert.equal(mireloMockGatewayResponse.usageEstimate.estimatedUserCredits, 10)
assert.equal(mireloMockGatewayResponse.generatedAssetDraft?.assetType, 'generated_sfx_audio')
assert.equal(mireloMockGatewayResponse.generatedAssetDraft?.storageLocation?.contentType, 'audio/wav')
assert.equal(
  mireloMockGatewayResponse.generatedAssetDraft?.storageLocation?.objectPath,
  'workspaces/workspace-toolcost-smoke/projects/project-toolcost-smoke/generated-assets/audio/generation-mirelo-audio-smoke.wav',
)
assert.equal(mireloMockGatewayResponse.providerEventPayload.providerRoute, 'mirelo_sfx_v1_5')
assert.equal(mireloMockGatewayResponse.providerEventPayload.outputAssetType, 'generated_audio')
const mmaudioGatewayRequest: ProviderGatewayRequest = {
  ...mireloAudioGatewayRequest,
  providerRoute: 'mmaudio_v2',
  generationRequestId: 'generation-mmaudio-audio-smoke',
  jobId: 'job-mmaudio-audio-smoke',
  idempotencyKey: 'provider-gateway-mmaudio-audio-smoke',
}
assert.equal(validateProviderGatewayRequest(mmaudioGatewayRequest).ok, true)
const mmaudioMockGatewayResponse = createMockProviderGatewayClient('mmaudio_v2')
  .prepareRequest(mmaudioGatewayRequest)
assert.equal(mmaudioMockGatewayResponse.secretReferenceName, 'reeditpro-prod-mmaudio-api-key')
assert.equal(mmaudioMockGatewayResponse.usageEstimate.estimatedUserCredits, 8)
assert.equal(mmaudioMockGatewayResponse.generatedAssetDraft?.assetType, 'generated_audio')
assert.equal(mmaudioMockGatewayResponse.generatedAssetDraft?.storageLocation?.contentType, 'audio/wav')
assert.equal(
  mmaudioMockGatewayResponse.generatedAssetDraft?.storageLocation?.objectPath,
  'workspaces/workspace-toolcost-smoke/projects/project-toolcost-smoke/generated-assets/audio/generation-mmaudio-audio-smoke.wav',
)
const mireloVideoShapeResult = validateProviderGatewayRequest({
  ...mireloAudioGatewayRequest,
  generationType: 'ai_video_clip',
})
assert.equal(mireloVideoShapeResult.ok, false)
assert.equal(
  mireloVideoShapeResult.errors.some((error) => error.includes('generated audio/SFX generation types')),
  true,
)
const gptImageAudioShapeResult = validateProviderGatewayRequest({
  ...providerGatewayRoleRequestBase,
  providerRoute: 'gpt_image_2',
  generationType: 'sfx_asset',
  outputRequirements: {
    outputAssetType: 'generated_audio',
  },
})
assert.equal(gptImageAudioShapeResult.ok, false)
assert.equal(
  gptImageAudioShapeResult.errors.some((error) => error.includes('Generated audio/SFX generation types must use an audio provider route')),
  true,
)
const mireloNonAudioOutputResult = validateProviderGatewayRequest({
  ...mireloAudioGatewayRequest,
  outputRequirements: {
    outputAssetType: 'generated_ai_video_clip',
  },
})
assert.equal(mireloNonAudioOutputResult.ok, false)
assert.equal(
  mireloNonAudioOutputResult.errors.some((error) => error.includes('audio output asset type')),
  true,
)
const qwenMockGatewayResponse = createMockProviderGatewayClient('qwen_3_7_provider_boundary')
  .prepareRequest(qwenCloudGatewayRequest)
assert.equal(qwenMockGatewayResponse.status, 'accepted_mock')
assert.equal(qwenMockGatewayResponse.generatedAssetDraft, undefined)
assert.equal(qwenMockGatewayResponse.secretReferenceName, 'reeditpro-prod-qwen-api-key')
assert.equal(qwenMockGatewayResponse.providerModel, 'qwen3.7-max-2026-06-08')
assert.equal(qwenMockGatewayResponse.modelRoleId, 'qwen_3_7_main_edit_agent')
assert.equal(qwenMockGatewayResponse.canonicalProviderModel, 'qwen3.7-max-2026-06-08')
assert.equal(qwenMockGatewayResponse.modelRoleProviderBoundary, 'qwen_3_7_provider_boundary')
assert.equal(qwenMockGatewayResponse.requestedModelUse, 'edit_planning')
assert.equal(qwenMockGatewayResponse.usageEstimate.providerModel, 'qwen3.7-max-2026-06-08')
assert.equal(qwenMockGatewayResponse.usageEstimate.modelRoleId, 'qwen_3_7_main_edit_agent')
assert.equal(qwenMockGatewayResponse.usageEstimate.canonicalProviderModel, 'qwen3.7-max-2026-06-08')
assert.equal(qwenMockGatewayResponse.usageEstimate.modelRoleProviderBoundary, 'qwen_3_7_provider_boundary')
assert.equal(qwenMockGatewayResponse.usageEstimate.requestedModelUse, 'edit_planning')
assert.equal(qwenMockGatewayResponse.providerEventPayload.providerRoute, 'qwen_3_7_provider_boundary')
assert.equal(qwenMockGatewayResponse.providerEventPayload.providerModel, 'qwen3.7-max-2026-06-08')
assert.equal(qwenMockGatewayResponse.providerEventPayload.modelRoleId, 'qwen_3_7_main_edit_agent')
assert.equal(qwenMockGatewayResponse.providerEventPayload.canonicalProviderModel, 'qwen3.7-max-2026-06-08')
assert.equal(qwenMockGatewayResponse.providerEventPayload.modelRoleProviderBoundary, 'qwen_3_7_provider_boundary')
assert.equal(qwenMockGatewayResponse.providerEventPayload.requestedModelUse, 'edit_planning')
assert.equal(getProviderSecretReference('qwen2_5_vl_7b_instruct_provider_boundary')?.secretName, 'reeditpro-prod-qwen-api-key')
assert.equal(getProviderSecretReference('kimi_k3_provider_boundary')?.secretName, 'reeditpro-prod-kimi-api-key')
assert.equal(getProviderSecretReference('deepseek_v4_pro_tool_code_boundary')?.secretName, 'reeditpro-prod-deepseek-api-key')
assert.equal(isKnownProviderSecretName('reeditpro-prod-qwen-api-key'), true)
assert.equal(isKnownProviderSecretName('reeditpro-prod-deepseek-api-key'), true)
const qwenDispatchResult = dispatchProviderGatewayRequest(qwenCloudGatewayRequest)
assert.equal(qwenDispatchResult.ok, true)
assert.equal(qwenDispatchResult.response?.generatedAssetDraft, undefined)
assert.equal(qwenDispatchResult.response?.secretReferenceName, 'reeditpro-prod-qwen-api-key')
assert.equal(qwenDispatchResult.response?.modelRoleId, 'qwen_3_7_main_edit_agent')
assert.equal(qwenDispatchResult.response?.requestedModelUse, 'edit_planning')
const qwenRouteOnlyGatewayRequest: ProviderGatewayRequest = {
  ...providerGatewayRoleRequestBase,
  providerRoute: 'qwen_3_7_provider_boundary',
  requestedModelUse: 'edit_planning',
}
assert.equal(validateProviderGatewayRequest(qwenRouteOnlyGatewayRequest).ok, true)
const qwenRouteOnlyResponse = createMockProviderGatewayClient('qwen_3_7_provider_boundary')
  .prepareRequest(qwenRouteOnlyGatewayRequest)
assert.equal(qwenRouteOnlyResponse.modelRoleId, 'qwen_3_7_main_edit_agent')
assert.equal(qwenRouteOnlyResponse.usageEstimate.modelRoleId, 'qwen_3_7_main_edit_agent')
assert.equal(qwenRouteOnlyResponse.providerEventPayload.modelRoleId, 'qwen_3_7_main_edit_agent')
const qwenRouteOnlyDispatch = dispatchProviderGatewayRequest(qwenRouteOnlyGatewayRequest)
assert.equal(qwenRouteOnlyDispatch.ok, true)
assert.equal(qwenRouteOnlyDispatch.response?.modelRoleId, 'qwen_3_7_main_edit_agent')
const deepseekDispatchResult = dispatchProviderGatewayRequest({
  ...providerGatewayRoleRequestBase,
  providerRoute: 'deepseek_v4_pro_tool_code_boundary',
  modelRoleId: 'deepseek_v4_tool_code_agent',
  requestedModelUse: 'user_reasoning',
})
assert.equal(deepseekDispatchResult.ok, true)
const blockedRealProviderDispatch = dispatchProviderGatewayRequest(qwenCloudGatewayRequest, {
  executionMode: 'real_provider_blocked',
  allowRealProviderCalls: false,
})
assert.equal(blockedRealProviderDispatch.ok, false)
assert.equal(blockedRealProviderDispatch.errors.some((error) => error.includes('Real provider calls are blocked')), true)

await assert.rejects(
  () => createRenderService(context).createRenderJob({
    workspaceId: 'workspace-toolcost-smoke',
    projectId: 'project-toolcost-smoke',
    approvedPlanSnapshotId: 'approved-toolcost-smoke',
    creditEstimateId: '',
    creditReservationId: 'reservation-toolcost-smoke',
    renderType: 'preview',
  }),
  (error) => error instanceof Error &&
    'code' in error &&
    error.code === 'TOOL_NOT_READY' &&
    'details' in error &&
    readNested(error.details, ['requiredGate']) === 'canonical_render_job_derivation',
  'Caller-authored render jobs must fail before caller-supplied credit fields can create authority.',
)

await assert.rejects(
  () => createRenderService(context).createRenderJob({
    workspaceId: 'workspace-toolcost-smoke',
    projectId: 'project-toolcost-smoke',
    approvedPlanSnapshotId: 'approved-toolcost-smoke',
    creditEstimateId: 'estimate-toolcost-smoke',
    creditReservationId: 'reservation-toolcost-smoke',
    renderType: 'preview',
    renderQualityLevel: 'draft',
    renderUsage: {
      renderDurationSeconds: 30,
      outputSeconds: 8,
      width: 1920,
      height: 1080,
      fps: 30,
    },
  }),
  (error) => error instanceof Error &&
    'code' in error &&
    error.code === 'TOOL_NOT_READY' &&
    'details' in error &&
    readNested(error.details, ['requiredGate']) === 'canonical_render_job_derivation',
  'Even a valid-looking caller render payload must not bypass canonical render-job derivation.',
)

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
assert.equal(
  workerResult.toolCostMetadata?.emittedEvents[0]?.idempotencyKey,
  'tool-cost-event:workspace-toolcost-smoke:project-toolcost-smoke:job:toolcost-worker-job:ffprobe:retry-1',
)
assert.equal(workerResult.toolCostMetadata?.emittedEvents[0]?.retryAttempt, 1)
assert.equal(workerResult.toolCostMetadata?.emittedEvents[0]?.metadata.costEventKeyShape, 'workspace_project_work_tool_retry')
assert.equal(workerResult.toolCostMetadata?.emittedEvents[0]?.metadata.costEventWorkKind, 'job')
assert.equal(workerResult.toolCostMetadata?.emittedEvents[0]?.metadata.costEventWorkId, 'toolcost-worker-job')
assert.equal(workerResult.toolCostMetadata?.billableToUserByToolId.ffprobe, false)
assert.equal(workerResult.toolCostMetadata?.failureCategoryByToolId.ffprobe, 'none')

const missingWorkerEstimatePayloadBase: Omit<ProductionWorkerJobPayload, 'idempotencyKey'> = {
  ...workerPayloadBase,
  jobId: 'toolcost-worker-missing-estimate',
  executionMode: 'production_ready',
  creditReservationId: 'reservation-toolcost-smoke',
  metadata: {
    productEditLevel: 'normal',
    approvedReservationRemainingCredits: 200,
  },
}
const missingWorkerEstimatePayloadCandidate: ProductionWorkerJobPayload = {
  ...missingWorkerEstimatePayloadBase,
  idempotencyKey: '',
}
const missingWorkerEstimatePayload: ProductionWorkerJobPayload = {
  ...missingWorkerEstimatePayloadBase,
  idempotencyKey: buildWorkerIdempotencyKey(missingWorkerEstimatePayloadCandidate),
}
const missingWorkerEstimateResult = await runProductionWorkerRuntime({ payload: missingWorkerEstimatePayload })
assert.equal(missingWorkerEstimateResult.status, 'blocked')
assert.equal(missingWorkerEstimateResult.error?.code, 'PRODUCTION_WORKER_TOOL_COST_PREREQUISITES_FAILED')
assert.equal(missingWorkerEstimateResult.toolCostMetadata?.blockedEventStatuses.ffprobe, 'missing_approved_credit_estimate')
assert.equal(missingWorkerEstimateResult.toolCostMetadata?.emittedEvents.length, 0)
assert.equal(
  missingWorkerEstimateResult.events.some((event) => event.eventName === 'job_started'),
  false,
  'Missing credit estimate must block before any worker start event.',
)

const missingWorkerReservationPayloadBase: Omit<ProductionWorkerJobPayload, 'idempotencyKey'> = {
  ...workerPayloadBase,
  jobId: 'toolcost-worker-missing-reservation',
  executionMode: 'production_ready',
  metadata: {
    creditEstimateId: 'estimate-toolcost-smoke',
    productEditLevel: 'normal',
    approvedReservationRemainingCredits: 200,
  },
}
const missingWorkerReservationPayloadCandidate: ProductionWorkerJobPayload = {
  ...missingWorkerReservationPayloadBase,
  idempotencyKey: '',
}
const missingWorkerReservationPayload: ProductionWorkerJobPayload = {
  ...missingWorkerReservationPayloadBase,
  idempotencyKey: buildWorkerIdempotencyKey(missingWorkerReservationPayloadCandidate),
}
const missingWorkerReservationResult = await runProductionWorkerRuntime({ payload: missingWorkerReservationPayload })
assert.equal(missingWorkerReservationResult.status, 'blocked')
assert.equal(missingWorkerReservationResult.error?.code, 'PRODUCTION_WORKER_TOOL_COST_PREREQUISITES_FAILED')
assert.equal(missingWorkerReservationResult.toolCostMetadata?.blockedEventStatuses.ffprobe, 'missing_active_credit_reservation')
assert.equal(missingWorkerReservationResult.toolCostMetadata?.emittedEvents.length, 0)
assert.equal(
  missingWorkerReservationResult.events.some((event) => event.eventName === 'job_started'),
  false,
  'Missing credit reservation must block before any worker start event.',
)

const userRetryWorkerPayloadBase: Omit<ProductionWorkerJobPayload, 'idempotencyKey'> = {
  ...workerPayloadBase,
  jobId: 'toolcost-worker-user-retry',
  executionMode: 'production_ready',
  creditReservationId: 'reservation-toolcost-smoke',
  metadata: {
    ...workerPayloadBase.metadata,
    approvedReservationRemainingCredits: 200,
    toolCostFailureCategory: 'user_requested_retry',
  },
}
const userRetryWorkerPayloadCandidate: ProductionWorkerJobPayload = {
  ...userRetryWorkerPayloadBase,
  idempotencyKey: '',
}
const userRetryWorkerPayload: ProductionWorkerJobPayload = {
  ...userRetryWorkerPayloadBase,
  idempotencyKey: buildWorkerIdempotencyKey(userRetryWorkerPayloadCandidate),
}
const userRetryWorkerResult = await runProductionWorkerRuntime({ payload: userRetryWorkerPayload })
assert.equal(userRetryWorkerResult.status, 'completed')
assert.equal(userRetryWorkerResult.toolCostMetadata?.billableToUserByToolId.ffprobe, true)
assert.equal(userRetryWorkerResult.toolCostMetadata?.failureCategoryByToolId.ffprobe, 'user_requested_retry')
assert.equal(userRetryWorkerResult.toolCostMetadata?.emittedEvents[0]?.billableToUser, true)
assert.equal(userRetryWorkerResult.toolCostMetadata?.emittedEvents[0]?.failureCategory, 'user_requested_retry')

const timeoutWorkerPayloadBase: Omit<ProductionWorkerJobPayload, 'idempotencyKey'> = {
  ...workerPayloadBase,
  jobId: 'toolcost-worker-timeout',
  executionMode: 'production_ready',
  creditReservationId: 'reservation-toolcost-smoke',
  metadata: {
    ...workerPayloadBase.metadata,
    approvedReservationRemainingCredits: 200,
    toolCostFailureCategory: 'timeout',
  },
}
const timeoutWorkerPayloadCandidate: ProductionWorkerJobPayload = {
  ...timeoutWorkerPayloadBase,
  idempotencyKey: '',
}
const timeoutWorkerPayload: ProductionWorkerJobPayload = {
  ...timeoutWorkerPayloadBase,
  idempotencyKey: buildWorkerIdempotencyKey(timeoutWorkerPayloadCandidate),
}
const timeoutWorkerResult = await runProductionWorkerRuntime({ payload: timeoutWorkerPayload })
assert.equal(timeoutWorkerResult.status, 'completed')
assert.equal(timeoutWorkerResult.toolCostMetadata?.billableToUserByToolId.ffprobe, false)
assert.equal(timeoutWorkerResult.toolCostMetadata?.failureCategoryByToolId.ffprobe, 'timeout')
assert.equal(timeoutWorkerResult.toolCostMetadata?.emittedEvents[0]?.billableToUser, false)
assert.equal(timeoutWorkerResult.toolCostMetadata?.emittedEvents[0]?.failureCategory, 'timeout')
assert.equal(timeoutWorkerResult.toolCostMetadata?.emittedEvents[0]?.nonBillableReason, 'timeout')

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
  renderBoundaryGate: 'canonical_render_job_derivation',
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

function readNested(value: unknown, path: readonly string[]): unknown {
  return path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[key]
  }, value)
}
