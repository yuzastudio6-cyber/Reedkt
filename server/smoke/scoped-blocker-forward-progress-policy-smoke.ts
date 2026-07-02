import assert from 'node:assert/strict'
import {
  assertScopedBlockerLedgerRows,
  assertScopedBlockerPolicyCarrier,
  buildBetaReadinessBlockerLedger,
  buildBetaReadinessReport,
  buildBetaReadinessBackendOperatorStatus,
  buildToolBetaExecutionReadinessReport,
} from '../beta-readiness'
import { buildProductionHardeningReport } from '../production-hardening'

const toolReport = buildToolBetaExecutionReadinessReport()
assertScopedBlockerPolicyCarrier(toolReport, 'tool beta execution readiness report')
assert.equal(
  toolReport.allowedForwardProgressScopes.includes('safe_blocker_reduction_preview'),
  true,
  'tool report must expose safe no-write blocker-reduction preview scope',
)
assert.equal(
  toolReport.allowedForwardProgressScopes.includes('owner_approval_packet_collection'),
  true,
  'tool report must expose owner approval collection scope',
)
assert.equal(
  toolReport.blockedActionScope.includes('external_beta_tool_execution'),
  true,
  'tool report must name the unsafe external beta execution action',
)
assert.equal(
  toolReport.notes.some((note) => note.includes('Intentional blanket blocking is not allowed')),
  true,
  'tool report notes must preserve the anti-blanket-blocker rule',
)

const ledger = buildBetaReadinessBlockerLedger()
assertScopedBlockerPolicyCarrier({
  blockerForwardProgressPolicy: ledger.blockerPolicy,
  safeBlockerReductionAllowed: true,
  blockedActionScope: ledger.blockedActionScope,
  allowedForwardProgressScopes: ledger.allowedForwardProgressScopes,
}, 'beta readiness blocker ledger')
assertScopedBlockerLedgerRows(ledger.rows, 'beta readiness blocker ledger rows')
assert.equal(
  ledger.rows.every((row) => row.blocksSafeForwardProgress === false),
  true,
  'ledger rows must never block safe forward progress',
)

const betaReport = buildBetaReadinessReport()
const backendOperatorStatus = buildBetaReadinessBackendOperatorStatus(betaReport)
assertScopedBlockerPolicyCarrier({
  blockerForwardProgressPolicy: backendOperatorStatus.currentGate.blockerForwardProgressPolicy,
  safeBlockerReductionAllowed: backendOperatorStatus.currentGate.safeBlockerReductionAllowed,
  blockedActionScope: backendOperatorStatus.currentGate.blockedActionScope,
  allowedForwardProgressScopes: backendOperatorStatus.currentGate.allowedForwardProgressScopes,
}, 'backend operator status')
assert.equal(
  backendOperatorStatus.warnings.some((warning) => warning.includes('bounded blocker-reduction work remains allowed')),
  true,
  'backend operator status must remind operators that safe blocker reduction remains allowed',
)

const hardening = buildProductionHardeningReport()
assertScopedBlockerPolicyCarrier(hardening, 'production hardening report')
assert.equal(
  hardening.allowedForwardProgressScopes.includes('security_privacy_review'),
  true,
  'production hardening keeps security/privacy review as a safe forward lane',
)
assert.equal(
  hardening.nextActions.some((action) => action.includes('Continue safe blocker-reduction lanes')),
  true,
  'production hardening must direct operators to continue safe blocker-reduction work',
)

console.log(JSON.stringify({
  ok: true,
  toolBlockedActions: toolReport.blockedActionScope,
  toolAllowedForwardProgressScopes: toolReport.allowedForwardProgressScopes,
  ledgerRows: ledger.totalRows,
  backendOperatorBlockedActions: backendOperatorStatus.currentGate.blockedActionScope,
  productionBlockedActions: hardening.blockedActionScope,
  blanketBlockersAllowed: hardening.blockerForwardProgressPolicy.intentionalBlanketBlocksAllowed,
}, null, 2))
