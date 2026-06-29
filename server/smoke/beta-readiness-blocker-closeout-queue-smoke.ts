import assert from 'node:assert/strict'
import { buildBetaReadinessBlockerCloseoutQueue } from '../beta-readiness'

const report = buildBetaReadinessBlockerCloseoutQueue({
  createdAt: '2026-06-29T00:00:00.000Z',
  currentCentralSha: '582301ab43ff073a5ba9dd7f96fb3e3ca81a1614',
})
const liveSourceReport = buildBetaReadinessBlockerCloseoutQueue({
  createdAt: '2026-06-29T00:00:00.000Z',
})

assert.equal(report.decision, 'beta_readiness_blocker_closeout_queue_passed_ready_for_operator_evidence_collection')
assert.match(liveSourceReport.sourceTruth.currentCentralSha, /^[0-9a-f]{40}$|^unknown_current_source_sha$/)
assert.notEqual(liveSourceReport.sourceTruth.currentCentralSha, '582301ab43ff073a5ba9dd7f96fb3e3ca81a1614')
assert.equal(report.sourceTruth.blockerLedgerRows, 197)
assert.equal(report.sourceTruth.duplicateBlockerRows, 0)
assert.equal(report.sourceTruth.toolRows, 184)
assert.equal(report.sourceTruth.platformRows, 1)
assert.equal(report.sourceTruth.checklistRows, 2)
assert.equal(report.sourceTruth.goNoGoRows, 10)
assert.equal(report.sourceTruth.locallyAcceptedToolCount, 16)
assert.equal(report.sourceTruth.locallyAcceptedToolIds.includes('libass'), true)
assert.equal(report.sourceTruth.readyToRecordDeployedEvidence, true)
assert.equal(
  report.sourceTruth.operatorTemplatePath,
  'docs/beta-readiness/external-beta-operator-input-template/2026-06-29-184f-external-beta-operator-input-template.json',
)
assert.equal(report.sourceTruth.requiredOperatorInputs, 60)
assert.equal(report.sourceTruth.pendingOperatorInputsInBlankEnv, 57)
assert.equal(report.sourceTruth.humanActionablePendingOperatorInputs, 45)
assert.equal(report.sourceTruth.autoFillablePendingOperatorInputs, 12)
assert.equal(report.sourceTruth.productReadyLocalOssCount, 0)
assert.equal(report.sourceTruth.externalBetaAllowed, false)
assert.equal(report.sourceTruth.realUserMediaBetaAllowed, false)
assert.equal(report.sourceTruth.paidProductionAllowed, false)
assert.equal(report.blockerCounts.byBlockerId.readiness_not_passed, 49)
assert.equal(report.blockerCounts.byBlockerId.real_execution_not_verified, 49)
assert.equal(report.blockerCounts.byBlockerId.product_ready_acceptance_missing, 49)
assert.equal(report.blockerCounts.byClearanceType.owner_approval, 44)
assert.equal(report.blockerCounts.byClearanceType.deployed_platform_evidence, 5)
assert.equal(report.batches.length, 7)
assert.deepEqual(report.batches.map((batch) => batch.order), [1, 2, 3, 4, 5, 6, 7])
assert.equal(report.batches[0]?.batchId, 'operator_value_collection')
assert.equal(report.batches[0]?.nextCommands[0], 'npm run beta:readiness:external-beta-operator-input-template -- --status')
assert.equal(report.batches[0]?.nextCommands[1], 'npm run beta:readiness:external-beta-operator-autofill-env')
assert.equal(report.batches[0]?.nextCommands[2], 'npm run beta:readiness:external-beta-operator-human-input-checklist')
assert.equal(report.batches[0]?.nextCommands[3], 'npm run beta:readiness:external-beta-operator-input-template')
assert.equal(report.batches[0]?.nextCommands[4], 'npm run beta:readiness:owner-approval-intake-status')
assert.equal(report.batches[0]?.nextCommands[5], 'npm run beta:readiness:owner-approval-intake-preflight')
assert.equal(
  report.batches[0]?.blockedUntil[0]?.includes('value-free pending-input status'),
  true,
)
assert.equal(
  report.batches[0]?.blockedUntil[0]?.includes('45 human-actionable values'),
  true,
)
assert.equal(
  report.batches[0]?.sourceEvidence.some((evidence) => evidence.includes('45 human-actionable, 12 auto-fillable')),
  true,
)
assert.equal(report.batches[1]?.batchId, 'trackb_deployed_tool_evidence_recording')
assert.equal(report.batches[1]?.rowCount, 16)
assert.equal(report.batches[2]?.batchId, 'registry_bounded_runtime_evidence')
assert.equal(report.batches[2]?.nextCommands[0], 'npm run beta:tools:core-real-check-preview -- --env-template')
assert.equal(report.batches[2]?.nextCommands[1], 'npm run beta:tools:core-real-check-preview')
assert.equal(report.batches.every((batch) => batch.canEnableBetaOrProduction === false), true)
assert.equal(report.batches.some((batch) => batch.nextCommands.some((command) => command.includes('external-beta-evidence-collector'))), true)
assert.equal(report.blockedScopeConfirmations.deployedBackendCalled, false)
assert.equal(report.blockedScopeConfirmations.toolExecutionRan, false)
assert.equal(report.blockedScopeConfirmations.supabaseWritesRan, false)
assert.equal(report.blockedScopeConfirmations.externalBetaEnabled, false)
assert.equal(report.blockedScopeConfirmations.paidProductionEnabled, false)
assert.deepEqual(report.supabaseClassification, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})

console.log(JSON.stringify({
  ok: true,
  decision: report.decision,
  blockerRows: report.sourceTruth.blockerLedgerRows,
  closeoutBatches: report.batches.length,
  locallyAcceptedTools: report.sourceTruth.locallyAcceptedToolCount,
  pendingOperatorInputsInBlankEnv: report.sourceTruth.pendingOperatorInputsInBlankEnv,
  humanActionablePendingOperatorInputs: report.sourceTruth.humanActionablePendingOperatorInputs,
  autoFillablePendingOperatorInputs: report.sourceTruth.autoFillablePendingOperatorInputs,
  productReadyLocalOssCount: report.sourceTruth.productReadyLocalOssCount,
}, null, 2))
