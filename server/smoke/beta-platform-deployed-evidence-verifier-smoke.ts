import assert from 'node:assert/strict'
import {
  runBetaPlatformDeployedEvidenceVerifier,
  type BetaPlatformDeployedEvidenceOwnerApprovals,
  type BetaPlatformDeployedEvidenceProbeRunners,
  type BetaPlatformDeployedProbeId,
  type BetaPlatformDeployedProbeResult,
} from '../beta-readiness'

const allProbeIds: BetaPlatformDeployedProbeId[] = [
  'tool_cost_events_migration_deployed',
  'beta_readiness_evidence_migration_deployed',
  'service_role_write_path_verified',
  'authenticated_rls_member_readback_verified',
  'idempotent_replay_verified',
  'wallet_settlement_verified',
  'stripe_boundary_owner_verified',
  'monitoring_deployment_verified',
  'staging_billing_qa_verified',
]

const approvals: BetaPlatformDeployedEvidenceOwnerApprovals = {
  billingOwnerStripeBoundaryApproved: true,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  legalApproved: true,
  monitoringApproved: true,
  supportApproved: true,
}

const input = {
  workspaceId: 'workspace-beta-platform-deployed-evidence-smoke',
  projectId: 'project-beta-platform-deployed-evidence-smoke',
  sourceId: 'tool-beta-platform-evidence:staging-deployed-verifier-smoke',
  sourceSha: '4444444444444444444444444444444444444444',
  environment: 'staging' as const,
  ownerApprovals: approvals,
  notes: ['Smoke fixture proves the deployed platform evidence verifier can build a complete packet without writing it.'],
}

const passingReport = await runBetaPlatformDeployedEvidenceVerifier(input, passingProbes())
assert.equal(passingReport.evidencePacketReady, true, 'complete deployed probes should produce a platform evidence packet')
assert.ok(passingReport.evidencePacket, 'complete deployed probes should expose evidence packet')
assert.equal(passingReport.missingEvidence.length, 0, 'complete probes should have no missing evidence')
assert.equal(passingReport.ownerApprovalGaps.length, 0, 'complete approvals should have no owner approval gaps')
assert.equal(passingReport.evidencePacket?.workspaceId, input.workspaceId, 'evidence packet should keep workspace id')
assert.equal(passingReport.evidencePacket?.platformEvidence?.environment, 'staging', 'evidence packet should target staging')
assert.equal(passingReport.evidencePacket?.platformEvidence?.toolCostEventsMigrationDeployed, true, 'migration deployment should be true')
assert.equal(passingReport.evidencePacket?.platformEvidence?.serviceRoleWritePathVerified, true, 'service-role write should be true')
assert.equal(passingReport.evidencePacket?.platformEvidence?.rlsMemberReadPathVerified, true, 'RLS readback should be true')
assert.equal(passingReport.evidencePacket?.platformEvidence?.idempotentReplayVerified, true, 'idempotency should be true')
assert.equal(passingReport.evidencePacket?.platformEvidence?.walletSettlementVerified, true, 'wallet settlement should be true')
assert.equal(passingReport.evidencePacket?.platformEvidence?.stripeBoundaryVerified, true, 'Stripe boundary should be true')
assert.equal(passingReport.evidencePacket?.platformEvidence?.monitoringVerified, true, 'monitoring should be true')
assert.equal(passingReport.evidencePacket?.platformEvidence?.billingQaVerified, true, 'billing QA should be true')
assert.equal(passingReport.evaluatedReadiness.toolExecutionReadiness.platformBlockers.length, 0, 'complete platform packet should clear shared platform blocker')
assert.equal(passingReport.evaluatedReadiness.toolExecutionReadiness.externalBetaToolExecutionAllowed, false, 'platform packet alone must not allow tool beta execution')
assert.equal(passingReport.evaluatedReadiness.goNoGo.externalBetaAllowed, false, 'platform packet alone must not allow external beta')
assert.equal(passingReport.externalBetaAllowed, false, 'verifier must not claim external beta allowed')
assert.equal(passingReport.productionAllowed, false, 'verifier must not claim production allowed')

const partialReport = await runBetaPlatformDeployedEvidenceVerifier(input, {
  ...passingProbes(),
  wallet_settlement_verified: () => ({
    id: 'wallet_settlement_verified',
    status: 'failed',
    evidence: ['Wallet settlement RPC was not observed in deployed runtime.'],
    nextAction: 'Deploy and verify wallet settlement RPC before recording platform evidence.',
  }),
})
assert.equal(partialReport.evidencePacketReady, false, 'partial deployed probes must fail closed')
assert.equal(partialReport.evidencePacket, undefined, 'partial deployed probes must not produce evidence packet')
assert.ok(partialReport.missingEvidence.some((item) => item.includes('wallet settlement verified')), 'partial report should name wallet settlement gap')
assert.ok(partialReport.evaluatedReadiness.toolExecutionReadiness.platformBlockers.length > 0, 'partial report should keep platform blocker')

const missingApprovalsReport = await runBetaPlatformDeployedEvidenceVerifier({
  ...input,
  ownerApprovals: {
    ...approvals,
    legalApproved: false,
    supportApproved: false,
  },
}, passingProbes())
assert.equal(missingApprovalsReport.evidencePacketReady, false, 'missing owner approvals must fail closed')
assert.equal(missingApprovalsReport.evidencePacket, undefined, 'missing owner approvals must not produce evidence packet')
assert.ok(missingApprovalsReport.ownerApprovalGaps.some((gap) => gap.includes('Legal')), 'legal approval gap should be named')
assert.ok(missingApprovalsReport.ownerApprovalGaps.some((gap) => gap.includes('Support')), 'support approval gap should be named')

await assert.rejects(
  () => runBetaPlatformDeployedEvidenceVerifier({
    ...input,
    notes: ['service_role_key must never be included in evidence notes'],
  }, passingProbes()),
  /secret-like/,
  'secret-like verifier notes should be rejected',
)

console.log(JSON.stringify({
  ok: true,
  passingChecks: passingReport.checks.length,
  evidencePacketReady: passingReport.evidencePacketReady,
  partialEvidencePacketReady: partialReport.evidencePacketReady,
  ownerApprovalGapsFailClosed: missingApprovalsReport.ownerApprovalGaps.length,
  platformBlockerClearedByCompletePacket: passingReport.evaluatedReadiness.toolExecutionReadiness.platformBlockers.length === 0,
  externalBetaAllowed: passingReport.externalBetaAllowed,
  productionAllowed: passingReport.productionAllowed,
}, null, 2))

function passingProbes(): BetaPlatformDeployedEvidenceProbeRunners {
  return Object.fromEntries(allProbeIds.map((id) => [id, () => passingProbe(id)]))
}

function passingProbe(id: BetaPlatformDeployedProbeId): BetaPlatformDeployedProbeResult {
  return {
    id,
    status: 'passed',
    evidence: [`${id} passed in smoke fixture.`],
    nextAction: 'No action for smoke fixture.',
  }
}
