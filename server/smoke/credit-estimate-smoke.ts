import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type { PreviewEditCreditEstimateRequest } from '../../src/types/credits'
import {
  EDIT_CREDIT_ESTIMATE_READINESS_STATUSES,
  EDIT_CREDIT_ESTIMATE_TOOL_COMPUTE_LEVELS,
} from '../../src/types/credits'
import {
  REEDITPRO_EDIT_LEVELS,
} from '../../src/types/credit-policy'
import { previewCreditSettlement, createMockCreditDataStore } from '../services/mock-credit-data-store'
import {
  buildEditCreditEstimatePreview,
  createMockCreditEstimateStore,
  getLatestEditCreditEstimatePreviewForEditPlan,
  listEditCreditEstimatePreviewsForProject,
  upsertEditCreditEstimatePreviewByIdempotencyKey,
} from '../services/mock-credit-estimate-store'
import { createMockToolCostEvent, insertMockToolCostEvent } from '../tool-cost-metering/mock-tool-cost-store'
import {
  estimateProductionToolCost,
  listProductionToolMeteringProfiles,
} from '../tool-cost-metering'
import { TOOL_COST_RATE_CARD_VERSION } from '../tool-cost-metering/rate-card'
import {
  editCreditEstimateProductEditLevelSchema,
  editCreditEstimateProductionToolIdSchema,
  editCreditEstimateToolComputeLevelSchema,
  previewEditCreditEstimateSchema,
} from '../validation/credit-estimate-schemas'

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

function parsePreviewRequest(value: unknown): PreviewEditCreditEstimateRequest {
  return previewEditCreditEstimateSchema.parse(value) as PreviewEditCreditEstimateRequest
}

const workspaceId = 'workspace-credit-estimate-smoke'
const projectId = 'project-credit-estimate-smoke'
const editPlanId = 'edit-plan-credit-estimate-smoke'

assert.deepEqual(REEDITPRO_EDIT_LEVELS, ['normal', 'premium', 'ultra_premium'])
assert.deepEqual(EDIT_CREDIT_ESTIMATE_TOOL_COMPUTE_LEVELS, ['economy', 'standard', 'premium'])
assert.ok(EDIT_CREDIT_ESTIMATE_READINESS_STATUSES.includes('ready_for_reservation'))
assert.equal(editCreditEstimateProductEditLevelSchema.safeParse('normal').success, true)
assert.equal(editCreditEstimateProductEditLevelSchema.safeParse('premium').success, true)
assert.equal(editCreditEstimateProductEditLevelSchema.safeParse('ultra_premium').success, true)
assert.equal(editCreditEstimateProductEditLevelSchema.safeParse('basic').success, false)
assert.equal(editCreditEstimateProductEditLevelSchema.safeParse('pro').success, false)
assert.equal(editCreditEstimateProductEditLevelSchema.safeParse('economy').success, false)
assert.equal(editCreditEstimateToolComputeLevelSchema.safeParse('economy').success, true)
assert.equal(editCreditEstimateToolComputeLevelSchema.safeParse('normal').success, false)
assert.equal(editCreditEstimateProductionToolIdSchema.safeParse('opentimelineio').success, true)
assert.equal(editCreditEstimateProductionToolIdSchema.safeParse('not_a_tool').success, false)

const baseRequest = {
  workspaceId,
  projectId,
  editPlanId,
  productEditLevel: 'premium',
  finalVideoDurationSeconds: 240,
  plannedToolIds: ['opentimelineio'],
  toolUsageInputs: {
    opentimelineio: {
      toolId: 'opentimelineio',
      toolComputeLevel: 'standard',
      qualityLevel: 'economy',
      actualInternalCostCents: 120,
      metadata: { scenario: 'smoke' },
    },
  },
  availableCreditsSnapshot: 10_000,
  reservedCreditsSnapshot: 0,
  purchasedCreditsSnapshot: 10_000,
  weeklyBonusCreditsSnapshot: 100,
  idempotencyKey: 'credit-estimate-smoke-base',
  metadata: { scenario: 'credit-estimate-smoke' },
} as const

const parsedRequest = parsePreviewRequest(baseRequest)
const store = createMockCreditEstimateStore()
const preview = upsertEditCreditEstimatePreviewByIdempotencyKey(store, parsedRequest)

assert.equal(preview.idempotencyStatus, 'created')
assert.equal(store.previews.length, 1)
assert.equal(preview.estimate.status, 'ready')
assert.equal(preview.safetyFlags.estimateOnly, true)
assert.equal(preview.safetyFlags.creditsReservedOrSpent, false)
assert.equal(preview.safetyFlags.walletMutated, false)
assert.equal(preview.safetyFlags.reservationMutated, false)
assert.equal(preview.safetyFlags.ledgerWritten, false)
assert.equal(preview.safetyFlags.providerCalled, false)
assert.equal(preview.safetyFlags.workerRun, false)
assert.equal(preview.safetyFlags.renderOrExportStarted, false)
assert.equal(preview.safetyFlags.supabaseWritten, false)
assert.equal(preview.safetyFlags.serviceFeeIncludedInToolCosts, false)
assert.equal(preview.toolEstimates.length, 1)
assert.equal(preview.toolEstimates[0]?.toolId, 'opentimelineio')
assert.equal(preview.toolEstimates[0]?.serviceFeeIncluded, false)
assert.equal(preview.toolEstimates[0]?.pricingSnapshot.serviceFeeIncluded, false)
assert.equal(preview.toolEstimates[0]?.rateCardVersion, TOOL_COST_RATE_CARD_VERSION)
assert.equal(preview.serviceFeeEstimate.customEstimateRequired, false)
assert.ok(preview.serviceFeeEstimate.expectedServiceFeeCredits > 0)
assert.equal(
  preview.summary.totalEstimatedCredits,
  preview.summary.expectedToolCostCredits + preview.summary.expectedServiceFeeCredits,
)
assert.equal(
  preview.summary.maximumEstimatedCredits,
  preview.summary.highToolCostCredits + preview.summary.highServiceFeeCredits,
)
assert.equal(preview.summary.requiredHoldCredits, preview.summary.maximumEstimatedCredits)
assert.equal(preview.summary.requiredTopUpCredits, 0)
assert.equal(preview.summary.canProceedToReservation, true)
assert.equal(preview.summary.readinessStatus, 'ready_for_reservation')
assert.ok(preview.summary.minimumEstimatedCredits <= preview.summary.totalEstimatedCredits)
assert.ok(preview.summary.totalEstimatedCredits <= preview.summary.maximumEstimatedCredits)

const lineItems = preview.estimate.lineItems ?? []
assert.equal(lineItems.length, 2)
const toolLine = lineItems.find((line) => line.linePayload?.lineItemRole === 'production_tool_estimate')
assert.ok(toolLine, 'Tool line item must be present.')
assert.equal(toolLine.linePayload?.serviceFeeIncluded, false)
assert.equal(toolLine.linePayload?.toolId, 'opentimelineio')
assert.equal(toolLine.linePayload?.rateCardVersion, TOOL_COST_RATE_CARD_VERSION)
assert.equal(toolLine.linePayload?.prerequisiteStatus, 'ready')
const serviceFeeLine = lineItems.find((line) => line.linePayload?.lineItemRole === 'reeditpro_service_fee')
assert.ok(serviceFeeLine, 'Service fee line item must be present.')
assert.equal(serviceFeeLine.usageCategory, 'admin')
assert.equal(serviceFeeLine.lineItemType, 'other')
assert.equal(serviceFeeLine.linePayload?.serviceFeeIncluded, true)
assert.equal(serviceFeeLine.linePayload?.toolCostsIncludeServiceFee, false)
assert.equal(preview.estimate.estimatePayload?.idempotencyKey, baseRequest.idempotencyKey)
assert.equal(preview.estimate.estimatePayload?.estimateOnly, true)

const duplicate = upsertEditCreditEstimatePreviewByIdempotencyKey(store, parsedRequest)
assert.equal(duplicate.idempotencyStatus, 'duplicate_returned')
assert.equal(duplicate.estimate.id, preview.estimate.id)
assert.equal(store.previews.length, 1)
assert.ok(duplicate.warnings.some((warning) => warning.includes('no double-counting')))
assert.equal(listEditCreditEstimatePreviewsForProject(store, projectId).length, 1)
assert.equal(getLatestEditCreditEstimatePreviewForEditPlan(store, editPlanId)?.estimate.id, preview.estimate.id)

assert.deepEqual({
  wallets: store.walletMutationRecords.length,
  reservations: store.reservationMutationRecords.length,
  ledgers: store.ledgerMutationRecords.length,
  exports: store.exportUnlockRecords.length,
  jobs: store.jobEnqueueRecords.length,
  providers: store.providerCallRecords.length,
  workers: store.workerRunRecords.length,
  renders: store.renderExportRecords.length,
}, {
  wallets: 0,
  reservations: 0,
  ledgers: 0,
  exports: 0,
  jobs: 0,
  providers: 0,
  workers: 0,
  renders: 0,
})

const topUpPreview = buildEditCreditEstimatePreview(parsePreviewRequest({
  ...baseRequest,
  availableCreditsSnapshot: 0,
  idempotencyKey: 'credit-estimate-smoke-top-up',
}))
assert.equal(topUpPreview.summary.readinessStatus, 'needs_top_up')
assert.equal(topUpPreview.summary.canProceedToReservation, false)
assert.ok(topUpPreview.summary.requiredTopUpCredits > 0)
assert.ok(topUpPreview.warnings.some((warning) => warning.includes('top-up')))

const customPreview = buildEditCreditEstimatePreview(parsePreviewRequest({
  ...baseRequest,
  finalVideoDurationSeconds: 3_600,
  idempotencyKey: 'credit-estimate-smoke-custom',
}))
assert.equal(customPreview.summary.customEstimateRequired, true)
assert.equal(customPreview.summary.readinessStatus, 'custom_estimate_required')
assert.equal(customPreview.summary.canProceedToReservation, false)
assert.equal(customPreview.serviceFeeEstimate.expectedServiceFeeCredits, 0)
assert.ok(customPreview.lowerCostOptions.some((option) => option.action === 'custom_estimate_review'))

const blockedPreview = buildEditCreditEstimatePreview(parsePreviewRequest({
  ...baseRequest,
  productEditLevel: 'normal',
  plannedToolIds: ['revideo'],
  toolUsageInputs: {
    revideo: {
      toolId: 'revideo',
      actualInternalCostCents: 40,
    },
  },
  idempotencyKey: 'credit-estimate-smoke-blocked',
}))
assert.equal(blockedPreview.summary.readinessStatus, 'estimate_only_blocked')
assert.equal(blockedPreview.summary.canProceedToReservation, false)
assert.equal(blockedPreview.toolEstimates[0]?.prerequisiteStatus, 'estimate_only')

const profiles = listProductionToolMeteringProfiles()
const renderProfile = profiles.find((profile) => profile.usageCategory === 'rendering')
const audioProfile = profiles.find((profile) => profile.usageCategory === 'soundsync')
assert.ok(renderProfile, 'Smoke needs at least one render profile.')
assert.ok(audioProfile, 'Smoke needs at least one audio/SoundSync profile.')
const optionPreview = buildEditCreditEstimatePreview(parsePreviewRequest({
  ...baseRequest,
  productEditLevel: 'ultra_premium',
  plannedToolIds: [renderProfile.toolId, audioProfile.toolId],
  toolUsageInputs: {
    [renderProfile.toolId]: {
      toolId: renderProfile.toolId,
      renderDurationSeconds: 30,
      outputDurationSeconds: 30,
      megapixelFrames: 720,
      toolComputeLevel: 'standard',
    },
    [audioProfile.toolId]: {
      toolId: audioProfile.toolId,
      estimatedRuntimeSeconds: 12,
      toolComputeLevel: 'standard',
    },
  },
  idempotencyKey: 'credit-estimate-smoke-options',
}))
const optionActions = new Set(optionPreview.lowerCostOptions.map((option) => option.action))
assert.equal(optionActions.has('downgrade_product_edit_level'), true)
assert.equal(optionActions.has('lower_render_quality'), true)
assert.equal(optionActions.has('reduce_audio_scope'), true)

assert.equal(previewEditCreditEstimateSchema.safeParse({
  ...baseRequest,
  productEditLevel: 'basic',
}).success, false)
assert.equal(previewEditCreditEstimateSchema.safeParse({
  ...baseRequest,
  productEditLevel: 'economy',
}).success, false)
assert.equal(previewEditCreditEstimateSchema.safeParse({
  ...baseRequest,
  plannedToolIds: [],
}).success, false)
assert.equal(previewEditCreditEstimateSchema.safeParse({
  ...baseRequest,
  plannedToolIds: ['not_a_tool'],
}).success, false)
assert.equal(previewEditCreditEstimateSchema.safeParse({
  ...baseRequest,
  plannedToolIds: ['opentimelineio', 'opentimelineio'],
}).success, false)
assert.equal(previewEditCreditEstimateSchema.safeParse({
  ...baseRequest,
  finalVideoDurationSeconds: -1,
}).success, false)
assert.equal(previewEditCreditEstimateSchema.safeParse({
  ...baseRequest,
  availableCreditsSnapshot: 1.5,
}).success, false)
assert.equal(previewEditCreditEstimateSchema.safeParse({
  ...baseRequest,
  metadata: { apiKey: 'secret' },
}).success, false)
assert.throws(() => buildEditCreditEstimatePreview(parsePreviewRequest({
  ...baseRequest,
  toolUsageInputs: {
    opentimelineio: {
      toolId: 'opentimelineio',
      actualInternalCostCents: 10,
      metadata: { serviceRoleToken: 'secret' },
    },
  },
  idempotencyKey: 'credit-estimate-smoke-secret',
})))

const adapterEstimate = estimateProductionToolCost({
  toolId: 'opentimelineio',
  workspaceId,
  projectId,
  editPlanId,
  creditEstimateId: preview.estimate.id,
  productEditLevel: 'normal',
  toolComputeLevel: 'economy',
  idempotencyKey: 'credit-estimate-adapter-separation',
})
assert.equal(adapterEstimate.ok, true)
if (adapterEstimate.ok) {
  assert.equal(adapterEstimate.data.productEditLevel, 'normal')
  assert.equal(adapterEstimate.data.toolComputeLevel, 'economy')
  assert.equal(adapterEstimate.data.serviceFeeIncluded, false)
}

const creditDataStore = createMockCreditDataStore()
const billableEvent = createMockToolCostEvent({
  id: 'credit-estimate-settlement-event',
  workspaceId,
  projectId,
  creditEstimateId: preview.estimate.id,
  creditReservationId: 'reservation-credit-estimate-smoke',
  label: 'Billable tool cost',
  usageCategory: 'media_analysis',
  actualInternalCostCents: 210,
})
insertMockToolCostEvent(creditDataStore.toolCostStore, billableEvent)
const settlementPreview = previewCreditSettlement(creditDataStore, {
  workspaceId,
  projectId,
  editPlanId,
  creditEstimateId: preview.estimate.id,
  creditReservationId: 'reservation-credit-estimate-smoke',
  editComputeLevel: 'normal',
  finalVideoDurationSeconds: 240,
  reservedCredits: 1_000,
  toolCostEventIds: [billableEvent.id],
  idempotencyKey: 'credit-estimate-settlement-preview',
})
assert.equal(settlementPreview.settlement.actualToolCostCredits, billableEvent.toolCostCredits)
assert.ok(settlementPreview.settlement.reeditproServiceFeeCredits > 0)
assert.equal(
  settlementPreview.settlement.finalChargeCredits,
  settlementPreview.settlement.actualToolCostCredits + settlementPreview.settlement.reeditproServiceFeeCredits,
)

for (const file of [
  'server/services/mock-credit-estimate-store.ts',
  'server/routes/credit-estimate-routes.ts',
  'server/validation/credit-estimate-schemas.ts',
  'src/types/credits.ts',
]) {
  const text = readRepoFile(file)
  assert.ok(text.includes('RP-ESTIMATE-01') || file.endsWith('credits.ts'), `${file} should carry RP-ESTIMATE-01 contract text or types.`)
}
assert.ok(readRepoFile('server/app.ts').includes('createCreditEstimateRoutes'))
assert.ok(readRepoFile('package.json').includes('"smoke:credit-estimate"'))

console.log('credit-estimate smoke passed')
