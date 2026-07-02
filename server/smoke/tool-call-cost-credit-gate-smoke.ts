import assert from 'node:assert/strict'

import { createToolCallIntentPlan } from '../../src/lib/tool-call-intent-planner'
import {
  applyToolCostMeteringToToolCallIntentPlan,
  assertToolCallIntentExecutionCreditGate,
  assertToolExecutionCostCreditGate,
  emitToolCostEvent,
  toolCostRateCard,
} from '../tool-cost-metering'

const basePlan = createToolCallIntentPlan({ includeBaselineIntents: true })

assert.equal(basePlan.creditGateSummary.executionAllowed, false, 'planning-only intent plan must not be executable by default')
assert.ok(
  basePlan.creditGateSummary.blockers.some((blocker) => blocker.includes('approved plan snapshot')),
  'planning-only summary should require an approved snapshot',
)
assert.ok(
  basePlan.creditGateSummary.blockers.some((blocker) => blocker.includes('credit estimate')),
  'planning-only summary should require an approved credit estimate',
)
assert.ok(
  basePlan.creditGateSummary.blockers.some((blocker) => blocker.includes('credit reservation')),
  'planning-only summary should require an active credit reservation',
)

const blockedWithoutIds = applyToolCostMeteringToToolCallIntentPlan({
  plan: basePlan,
  gateContext: {},
})

assert.equal(blockedWithoutIds.creditGateSummary.executionAllowed, false, 'metered plan without IDs should remain blocked')
assert.throws(
  () => assertToolCallIntentExecutionCreditGate(blockedWithoutIds),
  /approved plan snapshot/i,
  'execution assertion should fail without snapshot/estimate/reservation IDs',
)

const meteredPlan = applyToolCostMeteringToToolCallIntentPlan({
  plan: basePlan,
  gateContext: {
    approvedPlanSnapshotId: 'approved-snapshot-123',
    creditEstimateId: 'credit-estimate-123',
    creditReservationId: 'credit-reservation-123',
    approvedReservationRemainingCredits: 500,
  },
})

assert.equal(meteredPlan.creditGateSummary.executionAllowed, true, 'sufficient reservation context should allow backend execution')
assert.equal(meteredPlan.creditGateSummary.revisedEstimateRequired, false, 'sufficient reservation should not require revised estimate')
assert.ok(meteredPlan.creditGateSummary.totalLowCredits <= meteredPlan.creditGateSummary.totalExpectedCredits)
assert.ok(meteredPlan.creditGateSummary.totalExpectedCredits <= meteredPlan.creditGateSummary.totalHighCredits)

for (const intent of meteredPlan.intents) {
  assert.equal(intent.costEstimate.rateCardVersion, toolCostRateCard.version, `${intent.id} should use the static v1 rate card`)
  assert.equal(intent.costEstimate.canRunWithinApprovedReservation, true, `${intent.id} should fit the supplied reservation`)
  assert.equal(intent.creditGate.executionBlocked, false, `${intent.id} should be unblocked with complete gate context`)
  assert.equal(intent.approvalRequiredBeforeExecution, true, `${intent.id} must still require approval before execution`)
  assert.equal(intent.frontendExecutionAllowed, false, `${intent.id} must still forbid frontend execution`)
}

assert.doesNotThrow(
  () => assertToolCallIntentExecutionCreditGate(meteredPlan),
  'complete gate context should pass the tool-call execution assertion',
)
assert.doesNotThrow(
  () => assertToolExecutionCostCreditGate({
    approvedPlanSnapshotId: 'approved-snapshot-123',
    creditEstimateId: 'credit-estimate-123',
    creditReservationId: 'credit-reservation-123',
    idempotencyKey: 'workspace:project:job:tool:0',
    estimatedHighCredits: meteredPlan.creditGateSummary.totalHighCredits,
    approvedReservationRemainingCredits: 500,
  }),
  'worker/provider/render boundary should pass with snapshot, estimate, reservation, idempotency, and enough reservation',
)

const overBudgetPlan = applyToolCostMeteringToToolCallIntentPlan({
  plan: basePlan,
  gateContext: {
    approvedPlanSnapshotId: 'approved-snapshot-123',
    creditEstimateId: 'credit-estimate-123',
    creditReservationId: 'credit-reservation-123',
    approvedReservationRemainingCredits: 1,
  },
})

assert.equal(overBudgetPlan.creditGateSummary.executionAllowed, false, 'over-budget plan should be blocked')
assert.equal(overBudgetPlan.creditGateSummary.revisedEstimateRequired, true, 'over-budget plan should require a revised estimate')
assert.throws(
  () => assertToolExecutionCostCreditGate({
    approvedPlanSnapshotId: 'approved-snapshot-123',
    creditEstimateId: 'credit-estimate-123',
    creditReservationId: 'credit-reservation-123',
    idempotencyKey: 'workspace:project:job:tool:0',
    estimatedHighCredits: overBudgetPlan.creditGateSummary.totalHighCredits,
    approvedReservationRemainingCredits: 1,
  }),
  /revised estimate approval is required/i,
  'execution boundary should block over-budget work until a revised estimate/reservation is approved',
)

assert.throws(
  () => emitToolCostEvent({
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editPlanId: 'edit-plan-1',
    jobId: 'job-1',
    toolId: 'ffmpeg',
    toolName: 'FFmpeg',
    usageCategory: 'media_analysis',
    providerType: 'cloud_run_job',
    qualityLevel: 'preview',
    startedAt: '2026-06-26T00:00:00.000Z',
    completedAt: '2026-06-26T00:01:00.000Z',
    wallClockMs: 60_000,
    billableToUser: true,
  }),
  /creditEstimateId and active creditReservationId/i,
  'billable events must fail closed without estimate and reservation IDs',
)

assert.throws(
  () => emitToolCostEvent({
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editPlanId: 'edit-plan-1',
    jobId: 'job-1',
    creditEstimateId: 'credit-estimate-123',
    creditReservationId: 'credit-reservation-123',
    toolId: 'remotion',
    toolName: 'Remotion',
    usageCategory: 'rendering',
    providerType: 'deterministic_renderer',
    qualityLevel: 'production',
    startedAt: '2026-06-26T00:00:00.000Z',
    completedAt: '2026-06-26T00:05:00.000Z',
    wallClockMs: 300_000,
    renderDurationSeconds: 180,
    outputVideoSeconds: 120,
    outputResolution: '1920x1080',
    outputFrameRate: 30,
    approvedReservationRemainingCredits: 1,
    billableToUser: true,
  }),
  /revised estimate approval is required/i,
  'billable events must fail closed when the actual event exceeds the approved reservation',
)

const nonBillableFailureEvent = emitToolCostEvent({
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editPlanId: 'edit-plan-1',
  jobId: 'job-1',
  toolId: 'ffmpeg',
  toolName: 'FFmpeg',
  usageCategory: 'media_analysis',
  providerType: 'cloud_run_job',
  qualityLevel: 'preview',
  startedAt: '2026-06-26T00:00:00.000Z',
  completedAt: '2026-06-26T00:01:00.000Z',
  wallClockMs: 60_000,
  failureCategory: 'worker_error',
  billableToUser: false,
})

assert.equal(nonBillableFailureEvent.billableToUser, false, 'worker/provider failures can be recorded as non-billable')
assert.equal(nonBillableFailureEvent.creditEstimateId, null, 'non-billable failures do not require a credit estimate ID')
assert.equal(nonBillableFailureEvent.creditReservationId, null, 'non-billable failures do not require a reservation ID')

console.log(JSON.stringify({
  ok: true,
  intents: meteredPlan.intents.length,
  rateCardVersion: toolCostRateCard.version,
  expectedCredits: meteredPlan.creditGateSummary.totalExpectedCredits,
  highCredits: meteredPlan.creditGateSummary.totalHighCredits,
  overBudgetBlockers: overBudgetPlan.creditGateSummary.blockers,
}, null, 2))
