import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type { CreditReservationRecord, PreviewEditCreditEstimateRequest } from '../../src/types'
import { loadRuntimeEnv } from '../config/env'
import { createProviderGatewayService } from '../services/provider-gateway-service'
import { createRenderService } from '../services/render-service'
import {
  evaluatePaidToolRuntimeGuard,
  type RuntimeCreditGuardResult,
} from '../services/runtime-credit-guard-service'
import {
  buildEditCreditEstimatePreview,
  createMockCreditEstimateStore,
  insertEditCreditEstimatePreview,
  type MockCreditEstimateStore,
} from '../services/mock-credit-estimate-store'
import {
  createMockCreditReservationStore,
  getOrCreateMockCreditWallet,
  grantMockCredits,
  reserveMaxEstimateCredits,
  type MockCreditReservationStore,
} from '../services/mock-credit-reservation-store'
import {
  approveCreditRevisionAction,
  cancelCreditRevisionAction,
  chooseLowerCostCreditRevisionOption,
  createMockCreditDataStore,
  type MockCreditDataStore,
} from '../services/mock-credit-data-store'
import {
  sharedMockCreditDataStore,
  sharedMockCreditEstimateStore,
  sharedMockCreditReservationStore,
} from '../services/mock-credit-foundation-stores'
import { createMockToolCostEvent, insertMockToolCostEvent } from '../tool-cost-metering'
import type { ProductionToolId } from '../tool-registry'
import type { ServiceContext } from '../types'
import {
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
  type ProductionWorkerJobPayload,
} from '../workers/production'

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

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
  requestId: 'runtime-credit-guard-smoke',
  auth: { userId: 'runtime-credit-guard-smoke-user', isMockUser: true },
}

const readyScenario = createScenario('ready', 'opentimelineio')
const ready = evaluatePaidToolRuntimeGuard(guardInput(readyScenario, {
  idempotencyKey: 'runtime-guard-ready',
}))
assert.equal(ready.canStart, true)
assert.equal(ready.status, 'ready')
assert.equal(ready.safetyFlags.serviceFeeIncludedInToolCosts, false)
assert.ok((ready.projection?.projectedHighFinalCredits ?? 0) <= readyScenario.reservation.reservedCredits)

const missingPlan = evaluatePaidToolRuntimeGuard(guardInput(readyScenario, {
  idempotencyKey: 'runtime-guard-missing-plan',
  approvedPlanSnapshotId: null,
  approvedPlanStatus: null,
}))
assertBlockedWithoutRevision(missingPlan, 'blocked_missing_approved_plan', readyScenario.creditDataStore)

const missingEstimate = evaluatePaidToolRuntimeGuard({
  ...guardInput(readyScenario, { idempotencyKey: 'runtime-guard-missing-estimate' }),
  creditEstimateId: null,
})
assertBlockedWithoutRevision(missingEstimate, 'blocked_missing_approved_credit_estimate', readyScenario.creditDataStore)

const missingReservation = evaluatePaidToolRuntimeGuard({
  ...guardInput(readyScenario, { idempotencyKey: 'runtime-guard-missing-reservation' }),
  creditReservationId: null,
})
assertBlockedWithoutRevision(missingReservation, 'blocked_missing_active_credit_reservation', readyScenario.creditDataStore)

const missingIdempotency = evaluatePaidToolRuntimeGuard(guardInput(readyScenario, {
  idempotencyKey: null,
}))
assertBlockedWithoutRevision(missingIdempotency, 'blocked_missing_idempotency_key', readyScenario.creditDataStore)

const blockedToolScenario = createScenario('blocked-tool', 'opentimelineio')
const blockedTool = evaluatePaidToolRuntimeGuard({
  ...guardInput(blockedToolScenario, { idempotencyKey: 'runtime-guard-blocked-tool' }),
  toolId: 'revideo',
})
assertBlockedWithoutRevision(blockedTool, 'blocked_tool_prerequisite', blockedToolScenario.creditDataStore)

const expiredScenario = createScenario('expired', 'opentimelineio')
expiredScenario.reservation.expiresAt = '2020-01-01T00:00:00.000Z'
const expired = evaluatePaidToolRuntimeGuard(guardInput(expiredScenario, {
  idempotencyKey: 'runtime-guard-expired',
}))
assertBlockedWithoutRevision(expired, 'blocked_missing_active_credit_reservation', expiredScenario.creditDataStore)

const partialScenario = createScenario('partial', 'opentimelineio')
partialScenario.reservation.status = 'partially_spent'
const partiallySpent = evaluatePaidToolRuntimeGuard(guardInput(partialScenario, {
  idempotencyKey: 'runtime-guard-partially-spent',
}))
assertBlockedWithoutRevision(partiallySpent, 'blocked_missing_active_credit_reservation', partialScenario.creditDataStore)

const overageScenario = createScenario('overage', 'opentimelineio')
const mutationBaseline = {
  walletMutations: overageScenario.reservationStore.walletMutationRecords.length,
  reservationMutations: overageScenario.reservationStore.reservationMutationRecords.length,
}
insertExistingBillableEvent(overageScenario, overageScenario.reservation.reservedCredits)
insertExistingNonBillableEvent(overageScenario, overageScenario.reservation.reservedCredits * 5)
const overage = evaluatePaidToolRuntimeGuard(guardInput(overageScenario, {
  idempotencyKey: 'runtime-guard-overage',
  committedPendingHighCredits: 2,
}))
assert.equal(overage.canStart, false)
assert.equal(overage.status, 'paused_projected_overage')
assert.equal(overage.revisionAction?.status, 'action_required')
assert.equal(overage.revisionAction?.pauseReason, 'projected_overage')
assert.equal(overage.revisionAction?.actionRequiredTitle, 'Action required: revised credit estimate needed')
assert.ok(overage.revisionAction?.actionRequiredMessage.includes('No extra paid work will continue'))
assert.deepEqual(overage.revisionAction?.userOptions.map((option) => option.label), [
  'Approve & Continue',
  'Choose Lower-Cost Option',
  'Cancel Extra Work',
])
assert.equal(overage.projection?.currentBillableToolCredits, overageScenario.reservation.reservedCredits)
assert.equal(overage.projection?.nonBillableToolEventCount, 1)
assert.ok((overage.projection?.projectedHighServiceFeeCredits ?? 0) > 0)
assert.ok((overage.projection?.additionalHighCredits ?? 0) > 0)
assert.equal(overage.safetyFlags.revisionActionCreated, true)
assert.equal(overage.safetyFlags.walletMutated, false)
assert.equal(overage.safetyFlags.reservationMutated, false)
assert.equal(overage.safetyFlags.ledgerWritten, false)
assert.equal(overage.safetyFlags.providerCalled, false)
assert.equal(overage.safetyFlags.workerRun, false)
assert.equal(overage.safetyFlags.renderOrExportStarted, false)
assert.equal(overageScenario.reservationStore.walletMutationRecords.length, mutationBaseline.walletMutations)
assert.equal(overageScenario.reservationStore.reservationMutationRecords.length, mutationBaseline.reservationMutations)
assert.deepEqual(nonGuardSideEffects(overageScenario.creditDataStore), {
  ledgers: 0,
  settlements: 0,
  exports: 0,
  jobs: 0,
})

const overageReplay = evaluatePaidToolRuntimeGuard(guardInput(overageScenario, {
  idempotencyKey: 'runtime-guard-overage',
  committedPendingHighCredits: 2,
}))
assert.equal(overageReplay.revisionAction?.id, overage.revisionAction?.id)
assert.equal(overageScenario.creditDataStore.creditRevisionActions.length, 1)

const approvedRevisionScenario = createScenario('approved-revision', 'opentimelineio', 1_000)
insertExistingBillableEvent(approvedRevisionScenario, approvedRevisionScenario.reservation.reservedCredits)
const approvedRevisionOverage = evaluatePaidToolRuntimeGuard(guardInput(approvedRevisionScenario, {
  idempotencyKey: 'runtime-guard-approved-revision',
}))
assert.equal(approvedRevisionOverage.status, 'paused_projected_overage')
const approvedRevision = approveCreditRevisionAction(
  approvedRevisionScenario.creditDataStore,
  approvedRevisionScenario.reservationStore,
  {
    workspaceId: approvedRevisionScenario.workspaceId,
    projectId: approvedRevisionScenario.projectId,
    creditRevisionActionId: approvedRevisionOverage.revisionAction?.id ?? '',
    creditReservationId: approvedRevisionScenario.reservation.id,
    approvedByUserId: 'runtime-guard-user',
    idempotencyKey: 'runtime-guard-approved-revision-resolution',
  },
)
assert.equal(approvedRevision.status, 'approved')
const approvedRevisionReady = evaluatePaidToolRuntimeGuard(guardInput(approvedRevisionScenario, {
  idempotencyKey: 'runtime-guard-approved-revision',
}))
assert.equal(approvedRevisionReady.canStart, true)
assert.equal(approvedRevisionReady.status, 'ready')

const lowerCostScenario = createScenario('lower-cost-resolution', 'opentimelineio', 1_000)
insertExistingBillableEvent(lowerCostScenario, lowerCostScenario.reservation.reservedCredits)
const lowerCostOverage = evaluatePaidToolRuntimeGuard(guardInput(lowerCostScenario, {
  idempotencyKey: 'runtime-guard-lower-cost-resolution',
}))
assert.equal(lowerCostOverage.status, 'paused_projected_overage')
const lowerCostResolution = chooseLowerCostCreditRevisionOption(lowerCostScenario.creditDataStore, {
  workspaceId: lowerCostScenario.workspaceId,
  projectId: lowerCostScenario.projectId,
  creditRevisionActionId: lowerCostOverage.revisionAction?.id ?? '',
  selectedOptionId: 'choose-lower-cost-option',
  selectedByUserId: 'runtime-guard-user',
  idempotencyKey: 'runtime-guard-lower-cost-resolution-action',
})
assert.equal(lowerCostResolution.status, 'lower_cost_selected')
const lowerCostBlocked = evaluatePaidToolRuntimeGuard(guardInput(lowerCostScenario, {
  idempotencyKey: 'runtime-guard-lower-cost-resolution',
}))
assert.equal(lowerCostBlocked.canStart, false)
assert.equal(lowerCostBlocked.status, 'blocked_credit_revision_resolved')

const cancelResolutionScenario = createScenario('cancel-resolution', 'opentimelineio', 1_000)
insertExistingBillableEvent(cancelResolutionScenario, cancelResolutionScenario.reservation.reservedCredits)
const cancelOverage = evaluatePaidToolRuntimeGuard(guardInput(cancelResolutionScenario, {
  idempotencyKey: 'runtime-guard-cancel-resolution',
}))
assert.equal(cancelOverage.status, 'paused_projected_overage')
const cancelResolution = cancelCreditRevisionAction(cancelResolutionScenario.creditDataStore, {
  workspaceId: cancelResolutionScenario.workspaceId,
  projectId: cancelResolutionScenario.projectId,
  creditRevisionActionId: cancelOverage.revisionAction?.id ?? '',
  cancelledByUserId: 'runtime-guard-user',
  cancellationReason: 'Runtime guard smoke cancellation.',
  idempotencyKey: 'runtime-guard-cancel-resolution-action',
})
assert.equal(cancelResolution.status, 'cancelled')
const cancelBlocked = evaluatePaidToolRuntimeGuard(guardInput(cancelResolutionScenario, {
  idempotencyKey: 'runtime-guard-cancel-resolution',
}))
assert.equal(cancelBlocked.canStart, false)
assert.equal(cancelBlocked.status, 'blocked_credit_revision_resolved')

resetSharedStores()
const workerScenario = createSharedScenario('worker-overage', 'opentimelineio')
insertExistingBillableEvent(workerScenario, workerScenario.reservation.reservedCredits)
const workerPayload = withIdempotency({
  jobId: 'runtime-guard-worker-job',
  workspaceId: workerScenario.workspaceId,
  projectId: workerScenario.projectId,
  mediaAssetId: 'runtime-guard-media',
  approvedSnapshotId: 'approved-runtime-guard-worker',
  editPlanId: workerScenario.editPlanId,
  toolExecutionPlanId: 'runtime-guard-tool-plan',
  mediaAnalysisReportId: 'runtime-guard-media-analysis',
  workerType: 'cpu_analysis_worker',
  executionMode: 'production_ready',
  attempt: 1,
  maxAttempts: 1,
  requestedToolIds: ['opentimelineio'],
  requestedRecipeIds: ['runtime-guard-recipe'],
  storageReferenceIds: ['source_media/workspaces/runtime-guard/source.mov'],
  creditReservationId: workerScenario.reservation.id,
  createdAt: new Date().toISOString(),
  metadata: {
    creditEstimateId: workerScenario.preview.estimate.id,
    productEditLevel: workerScenario.productEditLevel,
    estimateStatus: 'approved',
    estimatedFinalVideoDurationSeconds: workerScenario.durationSeconds,
  },
})
const workerBlocked = await runProductionWorkerRuntime({ payload: workerPayload })
assert.equal(workerBlocked.status, 'blocked')
assert.equal(workerBlocked.events.some((event) => event.eventName === 'job_claimed'), false)
assert.equal(workerBlocked.gateChecks.some((gate) => gate.gateName === 'runtime_credit_guard' && gate.hardBlock), true)
assert.equal(workerBlocked.toolCostMetadata?.emittedEvents.length, 0)
assert.equal(workerBlocked.toolCostMetadata?.runtimeCreditGuard?.status, 'paused_projected_overage')

const providerScenario = createSharedScenario('provider-overage', 'opencv')
insertExistingBillableEvent(providerScenario, providerScenario.reservation.reservedCredits)
const providerBlocked = await createProviderGatewayService(context).createProviderRequestAttempt({
  workspaceId: providerScenario.workspaceId,
  projectId: providerScenario.projectId,
  providerRoute: 'mock-provider-route',
  providerModel: 'mock-provider-model',
  approvedPlanSnapshotId: 'approved-runtime-guard-provider',
  creditEstimateId: providerScenario.preview.estimate.id,
  creditReservationId: providerScenario.reservation.id,
  toolId: 'opencv',
  requestPayloadHash: 'runtime-guard-provider-hash',
  mockOnly: true,
  runtimeGuardRequired: true,
  productEditLevel: providerScenario.productEditLevel,
  estimatedFinalVideoDurationSeconds: providerScenario.durationSeconds,
  estimateStatus: 'approved',
})
assert.equal(providerBlocked.providerRequestAttempt.attemptStatus, 'blocked')
assert.equal(
  (providerBlocked.providerRequestAttempt as { runtimeCreditGuard: RuntimeCreditGuardResult }).runtimeCreditGuard.status,
  'paused_projected_overage',
)
assert.ok(providerBlocked.warnings.some((warning) => warning.includes('stopped before provider transport')))

const renderScenario = createSharedScenario('render-overage', 'remotion')
insertExistingBillableEvent(renderScenario, renderScenario.reservation.reservedCredits)
const renderBlocked = await createRenderService(context).createRenderJob({
  workspaceId: renderScenario.workspaceId,
  projectId: renderScenario.projectId,
  approvedPlanSnapshotId: 'approved-runtime-guard-render',
  creditEstimateId: renderScenario.preview.estimate.id,
  creditReservationId: renderScenario.reservation.id,
  renderType: 'preview',
  renderQualityLevel: 'draft',
  runtimeGuardRequired: true,
  productEditLevel: renderScenario.productEditLevel,
  estimatedFinalVideoDurationSeconds: renderScenario.durationSeconds,
  estimateStatus: 'approved',
})
assert.equal(renderBlocked.renderJob.status, 'blocked')
assert.equal(
  (renderBlocked.renderJob as { runtimeCreditGuard: RuntimeCreditGuardResult }).runtimeCreditGuard.status,
  'paused_projected_overage',
)
assert.ok(renderBlocked.warnings.some((warning) => warning.includes('stopped before render/export')))

const docsText = [
  'docs/runtime-credit-guard.md',
  'docs/credit-revision-action-resolution.md',
  'docs/credit-policy.md',
  'docs/credit-reservation-max-estimate.md',
  'credit-ledger-architecture.md',
  'package.json',
].map((path) => readFileSync(repoFile(path), 'utf8')).join('\n')

for (const phrase of [
  'RP-RUNTIME-GUARD-01',
  'Action required: revised credit estimate needed',
  'projected_overage',
  'reserved is the only active reservation status',
  'serviceFeeIncluded = false',
  'no live billing',
  'no provider',
  'no render/export',
  'smoke:runtime-credit-guard',
  'RP-CREDITREVISION-01',
]) {
  assert.ok(docsText.includes(phrase), `Missing runtime guard docs/package phrase: ${phrase}`)
}

console.log('runtime-credit-guard smoke passed')

interface RuntimeGuardScenario {
  workspaceId: string
  projectId: string
  editPlanId: string
  productEditLevel: 'normal'
  durationSeconds: number
  preview: ReturnType<typeof buildEditCreditEstimatePreview>
  reservation: CreditReservationRecord
  estimateStore: MockCreditEstimateStore
  reservationStore: MockCreditReservationStore
  creditDataStore: MockCreditDataStore
}

function createScenario(label: string, toolId: ProductionToolId, extraAvailableCredits = 100): RuntimeGuardScenario {
  const estimateStore = createMockCreditEstimateStore()
  const reservationStore = createMockCreditReservationStore()
  const creditDataStore = createMockCreditDataStore()
  return populateScenario(label, toolId, estimateStore, reservationStore, creditDataStore, extraAvailableCredits)
}

function createSharedScenario(label: string, toolId: ProductionToolId): RuntimeGuardScenario {
  return populateScenario(label, toolId, sharedMockCreditEstimateStore, sharedMockCreditReservationStore, sharedMockCreditDataStore)
}

function populateScenario(
  label: string,
  toolId: ProductionToolId,
  estimateStore: MockCreditEstimateStore,
  reservationStore: MockCreditReservationStore,
  creditDataStore: MockCreditDataStore,
  extraAvailableCredits = 100,
): RuntimeGuardScenario {
  const workspaceId = `workspace-runtime-guard-${label}`
  const projectId = `project-runtime-guard-${label}`
  const editPlanId = `edit-plan-runtime-guard-${label}`
  const productEditLevel = 'normal' as const
  const durationSeconds = 30
  const request: PreviewEditCreditEstimateRequest = {
    workspaceId,
    projectId,
    editPlanId,
    productEditLevel,
    finalVideoDurationSeconds: durationSeconds,
    plannedToolIds: [toolId],
    idempotencyKey: `estimate-runtime-guard-${label}`,
    metadata: { smoke: 'runtime-credit-guard' },
  }
  const preview = insertEditCreditEstimatePreview(estimateStore, buildEditCreditEstimatePreview(request))
  preview.estimate.status = 'approved'
  const wallet = getOrCreateMockCreditWallet(reservationStore, {
    workspaceId,
    userId: 'runtime-guard-user',
  })
  assert.ok(wallet)
  grantMockCredits(reservationStore, {
    creditWalletId: wallet.id,
    amount: preview.summary.requiredHoldCredits + extraAvailableCredits,
    sourceType: 'admin',
  })
  const reserved = reserveMaxEstimateCredits(reservationStore, estimateStore, {
    workspaceId,
    projectId,
    editPlanId,
    creditWalletId: wallet.id,
    creditEstimateId: preview.estimate.id,
    creditApprovalId: `credit-approval-runtime-guard-${label}`,
    approvedByUserId: 'runtime-guard-user',
    idempotencyKey: `reservation-runtime-guard-${label}`,
  })
  assert.equal(reserved.status, 'reserved')
  assert.ok(reserved.reservation)
  return {
    workspaceId,
    projectId,
    editPlanId,
    productEditLevel,
    durationSeconds,
    preview,
    reservation: reserved.reservation,
    estimateStore,
    reservationStore,
    creditDataStore,
  }
}

function guardInput(
  scenario: RuntimeGuardScenario,
  overrides: Partial<Parameters<typeof evaluatePaidToolRuntimeGuard>[0]>,
): Parameters<typeof evaluatePaidToolRuntimeGuard>[0] {
  return {
    workspaceId: scenario.workspaceId,
    projectId: scenario.projectId,
    editPlanId: scenario.editPlanId,
    approvedPlanSnapshotId: `approved-runtime-guard-${scenario.projectId}`,
    toolId: scenario.preview.toolEstimates[0]?.toolId ?? 'opentimelineio',
    productEditLevel: scenario.productEditLevel,
    estimatedFinalVideoDurationSeconds: scenario.durationSeconds,
    creditEstimateId: scenario.preview.estimate.id,
    creditReservationId: scenario.reservation.id,
    idempotencyKey: 'runtime-guard-default',
    estimateStatus: 'approved',
    estimateStore: scenario.estimateStore,
    reservationStore: scenario.reservationStore,
    creditDataStore: scenario.creditDataStore,
    ...overrides,
  }
}

function assertBlockedWithoutRevision(
  result: RuntimeCreditGuardResult,
  status: RuntimeCreditGuardResult['status'],
  store: MockCreditDataStore,
): void {
  assert.equal(result.canStart, false)
  assert.equal(result.status, status)
  assert.equal(result.safetyFlags.revisionActionCreated, false)
  assert.equal(store.creditRevisionActions.length, 0)
}

function insertExistingBillableEvent(scenario: RuntimeGuardScenario, credits: number): void {
  insertMockToolCostEvent(scenario.creditDataStore.toolCostStore, createMockToolCostEvent({
    id: `toolcost-runtime-guard-billable-${scenario.projectId}`,
    workspaceId: scenario.workspaceId,
    projectId: scenario.projectId,
    creditEstimateId: scenario.preview.estimate.id,
    creditReservationId: scenario.reservation.id,
    label: 'Existing billable runtime guard smoke cost',
    usageCategory: 'media_analysis',
    actualInternalCostCents: credits * 10,
    billableToUser: true,
    idempotencyKey: `runtime-guard-billable-${scenario.projectId}`,
  }))
}

function insertExistingNonBillableEvent(scenario: RuntimeGuardScenario, credits: number): void {
  insertMockToolCostEvent(scenario.creditDataStore.toolCostStore, createMockToolCostEvent({
    id: `toolcost-runtime-guard-nonbillable-${scenario.projectId}`,
    workspaceId: scenario.workspaceId,
    projectId: scenario.projectId,
    creditEstimateId: scenario.preview.estimate.id,
    creditReservationId: scenario.reservation.id,
    label: 'Existing non-billable runtime guard smoke cost',
    usageCategory: 'media_analysis',
    actualInternalCostCents: credits * 10,
    billableToUser: false,
    nonBillableReason: 'absorbed_test_cost',
    idempotencyKey: `runtime-guard-nonbillable-${scenario.projectId}`,
  }))
}

function resetSharedStores(): void {
  sharedMockCreditEstimateStore.previews.length = 0
  sharedMockCreditReservationStore.creditWallets.length = 0
  sharedMockCreditReservationStore.creditGrants.length = 0
  sharedMockCreditReservationStore.creditReservations.length = 0
  sharedMockCreditReservationStore.creditReservationLineItems.length = 0
  sharedMockCreditReservationStore.walletMutationRecords.length = 0
  sharedMockCreditReservationStore.reservationMutationRecords.length = 0
  sharedMockCreditReservationStore.ledgerMutationRecords.length = 0
  sharedMockCreditDataStore.creditSettlements.length = 0
  sharedMockCreditDataStore.creditRevisionActions.length = 0
  sharedMockCreditDataStore.toolCostStore.toolCostEvents.length = 0
  sharedMockCreditDataStore.walletMutationRecords.length = 0
  sharedMockCreditDataStore.reservationMutationRecords.length = 0
  sharedMockCreditDataStore.ledgerMutationRecords.length = 0
  sharedMockCreditDataStore.exportUnlockRecords.length = 0
  sharedMockCreditDataStore.jobEnqueueRecords.length = 0
}

function nonGuardSideEffects(store: MockCreditDataStore): Record<string, number> {
  return {
    ledgers: store.ledgerMutationRecords.length,
    settlements: store.creditSettlements.length,
    exports: store.exportUnlockRecords.length,
    jobs: store.jobEnqueueRecords.length,
  }
}

function withIdempotency(payload: Omit<ProductionWorkerJobPayload, 'idempotencyKey'>): ProductionWorkerJobPayload {
  const candidate = { ...payload, idempotencyKey: '' }
  return { ...candidate, idempotencyKey: buildWorkerIdempotencyKey(candidate) }
}
