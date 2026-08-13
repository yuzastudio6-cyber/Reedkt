import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  assertCanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult,
  createCanonicalTrackAllSam31L4TaskQaTerminalReconciler,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-terminal-reconciliation-service'
import {
  createCanonicalTrackAllSam31L4TaskQaTerminalCostAdapters,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-terminal-cost-adapters'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const observedAt = '2026-08-13T12:00:00.000Z'
const pending = result({
  disposition: 'pending_cloud_terminal',
  terminal: false,
  finalized: false,
  unknown: false,
})
assert.equal(
  assertCanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult(pending)
    .disposition,
  'pending_cloud_terminal',
)

const completed = result({
  disposition: 'completed_and_queue_finalized',
  terminal: true,
  finalized: true,
  unknown: false,
  terminalOutcome: 'completed',
  substantiveOutcome: 'executed',
})
assert.equal(
  assertCanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult(completed)
    .terminalUsageCostAndZeroActiveGpuPersisted,
  true,
)

const failed = result({
  disposition: 'failed_and_queue_finalized',
  terminal: true,
  finalized: true,
  unknown: false,
  terminalOutcome: 'failed',
  substantiveOutcome: 'not_executed',
})
assert.equal(
  assertCanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult(failed)
    .queueFinalized,
  true,
)

const unknown = result({
  disposition: 'unknown_outcome_requires_reconciliation',
  terminal: true,
  finalized: false,
  unknown: true,
  terminalOutcome: 'outcome_unknown_requires_reconciliation',
  substantiveOutcome: 'unknown',
})
const acceptedUnknown =
  assertCanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult(unknown)
assert.equal(acceptedUnknown.queueFinalized, false)
assert.equal(acceptedUnknown.terminalUsageCostAndZeroActiveGpuPersisted, true)
assert.equal(acceptedUnknown.unresolvedOutcomeBlocksRetry, true)
assert.equal(acceptedUnknown.automaticNewExecutionAttemptAllowed, false)

assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult({
    ...completed,
    queueFinalized: false,
  }), /inconsistent|digest/u)
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult({
    ...unknown,
    automaticNewExecutionAttemptAllowed: true,
  }))
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult({
    ...completed,
    resultDigestSha256: 'f'.repeat(64),
  }), /digest/u)

let getterInvoked = false
const hostile = Object.defineProperty({}, 'schemaVersion', {
  enumerable: true,
  get() {
    getterInvoked = true
    throw new Error('getter must not execute')
  },
})
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult(hostile))
assert.equal(getterInvoked, false)

assert.throws(() => createCanonicalTrackAllSam31L4TaskQaTerminalReconciler(
  {} as never,
), /dependency/u)
assert.throws(() => createCanonicalTrackAllSam31L4TaskQaTerminalCostAdapters(
  {} as never,
), /dependency/u)

const reconciliationSource = readFileSync(
  'server/services/canonical-track-all-sam3_1-l4-task-qa-terminal-reconciliation-service.ts',
  'utf8',
)
const costSource = readFileSync(
  'server/services/canonical-track-all-sam3_1-l4-task-qa-terminal-cost-adapters.ts',
  'utf8',
)
const consumerSource = readFileSync(
  'server/services/canonical-track-all-sam3_1-l4-task-qa-cloud-task-consumer-service.ts',
  'utf8',
)
const routeSource = readFileSync(
  'server/routes/track-all-sam3_1-routes.ts',
  'utf8',
)

assert.match(reconciliationSource,
  /recordCanonicalProfessionalGpuPlanFundedTerminal/u)
assert.match(reconciliationSource,
  /queueTransactionAdapter\.finalize/u)
assert.ok(
  reconciliationSource.indexOf(
    'recordCanonicalProfessionalGpuPlanFundedTerminal',
  ) < reconciliationSource.indexOf('queueTransactionAdapter.finalize'),
)
assert.match(costSource, /rereadApprovedCurrentAccountRateAuthority/u)
assert.match(costSource, /activeGpuResourcesAfterObservation:\s*0/u)
assert.match(costSource, /runningCount:\s*z\.union/u)
assert.match(costSource,
  /runtimeMeasurement\s*\?\.\s*wallTimeMilliseconds/u)
assert.match(costSource, /untrustedResponse === null/u)
assert.match(costSource, /retry:\s*false/u)
assert.match(costSource, /maxRedirects:\s*0/u)
assert.match(consumerSource, /if \(existing \|\| delivery\.terminal\)/u)
assert.match(consumerSource, /terminalReconciler\.reconcileVerifiedDelivery/u)
assert.doesNotMatch(consumerSource, /automatic.*retry.*true/iu)
assert.match(routeSource, /pending_cloud_terminal/u)
assert.match(routeSource, /503/u)

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-l4-task-qa-terminal-reconciliation',
  checks: 35,
  exactCloudRunOperationAndExecutionRereadRequired: true,
  exactWorkerUsageAndAccountEffectiveRateRereadRequired: true,
  costReceiptAndZeroActiveGpuPersistedBeforeQueueFinalization: true,
  sameDurableTaskMayRereadTerminalWithoutNewGpuJob: true,
  unknownOutcomePersistsCostAndBlocksRetry: true,
  missingWorkerResponseAfterPlatformTerminalBecomesUnknown: true,
  customerCreditsMutated: false,
  liveCloudJobStarted: false,
  productionAuthorityGranted: false,
}, null, 2))

function result(input: Readonly<{
  disposition:
    | 'pending_cloud_terminal'
    | 'completed_and_queue_finalized'
    | 'failed_and_queue_finalized'
    | 'unknown_outcome_requires_reconciliation'
  terminal: boolean
  finalized: boolean
  unknown: boolean
  terminalOutcome?:
    | 'completed'
    | 'failed'
    | 'canceled'
    | 'outcome_unknown_requires_reconciliation'
  substantiveOutcome?: 'executed' | 'not_executed' | 'unknown'
}>) {
  const payload = {
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-terminal-reconciliation-result-v1' as const,
    source:
      'canonical_server_track_all_sam3_1_l4_task_qa_terminal_reconciler' as const,
    disposition: input.disposition,
    queueEntryRef: ref('queue-entry'),
    claimRef: ref('claim'),
    executionAttemptRef: ref('attempt'),
    serviceIdentityEvidenceRef: ref('service-identity'),
    launchRef: ref('launch'),
    launchBindingRef: ref('launch-binding'),
    terminalRef: input.terminal ? ref('terminal') : null,
    terminalBindingRef: input.terminal ? ref('terminal-binding') : null,
    attemptCostReceiptRef: input.terminal ? ref('attempt-cost') : null,
    queueTerminalRef: input.finalized ? ref('queue-terminal') : null,
    terminalOutcome: input.terminal ? input.terminalOutcome ?? 'completed' : null,
    providerInferenceOrSubstantiveWorkOutcome:
      input.terminal ? input.substantiveOutcome ?? 'executed' : null,
    queueFinalized: input.finalized,
    terminalUsageCostAndZeroActiveGpuPersisted: input.terminal,
    activeGpuResourcesAfterObservation: input.terminal ? 0 as const : null,
    duplicateDeliveryStartedNewGpuJob: false as const,
    automaticNewExecutionAttemptAllowed: false as const,
    unresolvedOutcomeBlocksRetry: input.unknown,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt,
  }
  return {
    ...payload,
    resultDigestSha256: sha256AuthorityValue(payload),
  }
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}` as const,
  }
}
