import assert from 'node:assert/strict'
import {
  assertScopedBlockerLedgerRows,
  assertScopedBlockerPolicyCarrier,
  buildBetaReadinessBlockerLedger,
  buildToolBetaExecutionReadinessReport,
  type ToolBetaAcceptedExecutionEvidence,
  type ToolBetaPlatformReadinessEvidence,
} from '../beta-readiness'
import { PRODUCTION_TOOL_IDS } from '../tool-registry'

const defaultLedger = buildBetaReadinessBlockerLedger()
const defaultReadiness = buildToolBetaExecutionReadinessReport()
assertScopedBlockerPolicyCarrier({
  blockerForwardProgressPolicy: defaultLedger.blockerPolicy,
  safeBlockerReductionAllowed: true,
  blockedActionScope: defaultLedger.blockedActionScope,
  allowedForwardProgressScopes: defaultLedger.allowedForwardProgressScopes,
}, 'default beta readiness blocker ledger')
assertScopedBlockerLedgerRows(defaultLedger.rows, 'default beta readiness blocker ledger rows')

assert.ok(defaultLedger.reportId.startsWith('beta-readiness-blocker-ledger-'), 'ledger report should build')
assert.equal(defaultLedger.duplicateRowKeys.length, 0, 'default blocker ledger must not contain duplicate row keys')
assert.equal(defaultLedger.productReadyLocalOssCount, 0, 'default ledger must not claim product-ready local OSS')
assert.equal(defaultLedger.externalBetaAllowed, false, 'default ledger must keep external beta closed')
assert.equal(defaultLedger.realUserMediaBetaAllowed, false, 'default ledger must keep real-user-media beta closed')
assert.equal(defaultLedger.paidProductionAllowed, false, 'default ledger must keep paid production closed')
assert.equal(defaultLedger.blockerPolicy.intentionalBlanketBlocksAllowed, false, 'blanket blockers must remain disallowed')
assert.equal(defaultLedger.blockerPolicy.safeForwardProgressRequired, true, 'safe forward progress must be required')
assert.equal(defaultLedger.blockerPolicy.nextSafeActionRequiredForBlockers, true, 'blockers must require next safe actions')
assert.ok(defaultLedger.totalRows >= defaultReadiness.blockers.length, 'ledger should cover tool blockers plus platform/checklist/go/no-go blockers')
assert.equal(defaultLedger.toolRows, defaultReadiness.blockers.length, 'ledger must include one row per current tool blocker')
assert.equal(defaultLedger.platformRows, defaultReadiness.platformBlockers.length, 'ledger must include one row per current platform blocker')
assert.ok(defaultLedger.checklistRows > 0, 'ledger must include blocked checklist rows')
assert.ok(defaultLedger.goNoGoRows > 0, 'ledger must include go/no-go blocker rows')
assert.ok(defaultLedger.rows.every((row) => row.key.trim()), 'every ledger row needs a stable key')
assert.ok(defaultLedger.rows.every((row) => row.missingEvidence.trim()), 'every ledger row needs missing-evidence text')
assert.ok(defaultLedger.rows.every((row) => row.nextSafeAction.trim()), 'every ledger row needs a next safe action')
assert.ok(defaultLedger.rows.every((row) => row.safeForwardProgressScope.trim()), 'every ledger row needs a safe forward-progress scope')
assert.ok(defaultLedger.rows.every((row) => row.blockedActionScope.length > 0), 'every ledger row needs a blocked action scope')
assert.ok(
  defaultLedger.rows.every((row) => row.blockerMode === 'scoped_unsafe_action_only'),
  'every blocker row must be scoped to named unsafe actions only',
)
assert.ok(
  defaultLedger.rows.every((row) => row.blocksSafeForwardProgress === false),
  'no blocker row may freeze safe blocker-reduction progress',
)
assert.ok(
  defaultLedger.rows.every((row) => row.clearanceType.trim()),
  'every blocker row needs a clearance type',
)
assert.ok(
  defaultLedger.rows.some((row) => row.clearanceType === 'bounded_local_proof'),
  'ledger should classify bounded local proof blockers',
)
assert.ok(
  defaultLedger.rows.some((row) => row.clearanceType === 'owner_approval'),
  'ledger should classify owner approval blockers',
)
assert.ok(
  defaultLedger.rows.some((row) => row.clearanceType === 'deployed_platform_evidence'),
  'ledger should classify deployed platform evidence blockers',
)
assert.ok(
  defaultLedger.rows.some((row) => row.safeForwardProgressScope === 'bounded_command_import_container_proof'),
  'ledger should point tool execution blockers at bounded proof lanes',
)
assert.ok(
  defaultLedger.rows.some((row) => row.safeForwardProgressScope === 'deployment_preflight_and_platform_evidence_collection'),
  'ledger should point platform blockers at deployed evidence lanes',
)
assert.ok(
  defaultLedger.rows.some((row) => row.safeForwardProgressScope === 'owner_approval_packet_collection'),
  'ledger should point approval blockers at owner approval lanes',
)
assert.ok(
  defaultLedger.rows.some((row) => row.blockerId === 'model_weight_approval_missing'),
  'ledger must expose model/checkpoint approval blockers',
)
assert.ok(
  defaultLedger.rows.some((row) => row.blockerId === 'product_ready_acceptance_missing'),
  'ledger must expose product-ready acceptance blockers',
)
assert.ok(
  defaultLedger.rows.some((row) => row.blockerId === 'production_billing_deployment_unverified'),
  'ledger must expose platform billing deployment blocker',
)
assert.ok(
  defaultLedger.allowedForwardProgressScopes.includes('safe_blocker_reduction_preview'),
  'ledger should preserve safe blocker-reduction preview as allowed forward progress',
)

const acceptedEvidenceForAllTools: ToolBetaAcceptedExecutionEvidence[] = PRODUCTION_TOOL_IDS.map((toolId) => ({
  toolId,
  sourceId: `ledger-smoke:${toolId}:accepted-runtime-evidence`,
  sourceSha: '3333333333333333333333333333333333333333',
  readinessStatus: 'passed',
  realExecutionVerified: true,
  productionReadinessAccepted: true,
  productReadyLocalOss: true,
  modelWeightsApproved: true,
  notes: [`Smoke fixture proves ${toolId} ledger rows clear when complete accepted evidence is supplied.`],
}))

const platformEvidence: ToolBetaPlatformReadinessEvidence = {
  sourceId: 'ledger-smoke:complete-platform-evidence',
  sourceSha: '4444444444444444444444444444444444444444',
  environment: 'staging',
  toolCostEventsMigrationDeployed: true,
  serviceRoleWritePathVerified: true,
  rlsMemberReadPathVerified: true,
  idempotentReplayVerified: true,
  walletSettlementVerified: true,
  stripeBoundaryVerified: true,
  monitoringVerified: true,
  billingQaVerified: true,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  legalApproved: true,
  supportApproved: true,
  notes: ['Smoke fixture proves platform rows clear when complete deployed evidence is supplied.'],
}

const completeLedger = buildBetaReadinessBlockerLedger({
  acceptedToolEvidence: acceptedEvidenceForAllTools,
  platformEvidence,
  checklistEvidence: [
    {
      itemId: 'model_weights_not_approved',
      sourceId: 'ledger-smoke:model-weights',
      status: 'passed',
      notes: ['Model/checkpoint approvals supplied for smoke evidence.'],
    },
    {
      itemId: 'gcp_deployment_not_done',
      sourceId: 'ledger-smoke:gcp-deployment',
      status: 'passed',
      notes: ['Deployment evidence supplied for smoke evidence.'],
    },
  ],
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  legalApproved: true,
  monitoringApproved: true,
  supportApproved: true,
  realUserMediaBetaApproved: true,
  paidProductionApproved: true,
})

assert.equal(completeLedger.duplicateRowKeys.length, 0, 'complete ledger must not contain duplicate row keys')
assert.equal(completeLedger.toolRows, 0, 'complete evidence should clear tool ledger rows')
assert.equal(completeLedger.platformRows, 0, 'complete evidence should clear platform ledger rows')
assert.equal(completeLedger.checklistRows, 0, 'complete evidence should clear checklist ledger rows')
assert.equal(completeLedger.goNoGoRows, 0, 'complete evidence should clear go/no-go ledger rows')
assert.equal(completeLedger.externalBetaAllowed, true, 'complete evidence should allow external beta in the ledger')
assert.equal(completeLedger.realUserMediaBetaAllowed, true, 'complete evidence should allow real-user-media beta in the ledger')
assert.equal(completeLedger.paidProductionAllowed, true, 'complete evidence should allow paid production in the ledger')
assert.equal(completeLedger.productReadyLocalOssCount, PRODUCTION_TOOL_IDS.length, 'complete evidence should count all tools as product-ready local OSS')

assert.throws(() => buildBetaReadinessBlockerLedger({
  acceptedToolEvidence: [
    {
      toolId: 'ffmpeg',
      sourceId: 'duplicate-a',
      readinessStatus: 'passed',
      realExecutionVerified: true,
      productionReadinessAccepted: true,
      productReadyLocalOss: true,
      notes: ['duplicate evidence guard'],
    },
    {
      toolId: 'ffmpeg',
      sourceId: 'duplicate-b',
      readinessStatus: 'passed',
      realExecutionVerified: true,
      productionReadinessAccepted: true,
      productReadyLocalOss: true,
      notes: ['duplicate evidence guard'],
    },
  ],
}), /Duplicate accepted tool beta evidence/, 'ledger builder must fail closed on duplicate accepted evidence')

console.log(JSON.stringify({
  ok: true,
  defaultRows: defaultLedger.totalRows,
  defaultToolRows: defaultLedger.toolRows,
  defaultPlatformRows: defaultLedger.platformRows,
  defaultChecklistRows: defaultLedger.checklistRows,
  defaultGoNoGoRows: defaultLedger.goNoGoRows,
  completeRows: completeLedger.totalRows,
  duplicateRows: defaultLedger.duplicateRowKeys.length,
  productReadyLocalOssCount: defaultLedger.productReadyLocalOssCount,
  allowedForwardProgressScopes: defaultLedger.allowedForwardProgressScopes,
  scopedUnsafeActionOnlyRows: defaultLedger.rows.filter((row) => row.blockerMode === 'scoped_unsafe_action_only').length,
  safeForwardProgressBlockedRows: defaultLedger.rows.filter((row) => row.blocksSafeForwardProgress).length,
}, null, 2))
