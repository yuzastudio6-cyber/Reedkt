import assert from 'node:assert/strict'
import {
  createBetaPlatformDeployedEvidenceProbeRunners,
  runBetaPlatformDeployedEvidenceVerifier,
  type BetaPlatformDeployedEvidenceObservation,
  type BetaPlatformDeployedEvidenceProbeTransport,
} from '../beta-readiness'

const callOrder: string[] = []
const transport = passingTransport(callOrder)
const probes = createBetaPlatformDeployedEvidenceProbeRunners(transport)

const report = await runBetaPlatformDeployedEvidenceVerifier({
  workspaceId: 'workspace-beta-platform-probe-transport-smoke',
  projectId: 'project-beta-platform-probe-transport-smoke',
  sourceId: 'tool-beta-platform-evidence:deployed-probe-transport-smoke',
  sourceSha: '5555555555555555555555555555555555555555',
  environment: 'staging',
  ownerApprovals: {
    billingOwnerStripeBoundaryApproved: true,
    deploymentApproved: true,
    securityApproved: true,
    storageApproved: true,
    legalApproved: true,
    monitoringApproved: true,
    supportApproved: true,
  },
  notes: ['Smoke fixture proves deployed probe transport can feed the platform evidence verifier.'],
}, probes)

assert.equal(report.evidencePacketReady, true, 'passing deployed probe transport should produce a platform evidence packet')
assert.equal(report.checks.length, 9, 'all deployed platform probes should run')
assert.deepEqual(callOrder, [
  'verifyToolCostEventsMigration',
  'verifyBetaReadinessEvidenceMigration',
  'verifyServiceRoleWritePath',
  'verifyAuthenticatedRlsMemberReadback',
  'verifyIdempotentReplay',
  'verifyWalletSettlement',
  'verifyStripeBoundaryOwnerApproval',
  'verifyMonitoringDeployment',
  'verifyStagingBillingQa',
], 'transport should call every deployed evidence probe in verifier order')
assert.equal(report.evaluatedReadiness.toolExecutionReadiness.platformBlockers.length, 0, 'passing probe transport should clear shared platform blocker')
assert.equal(report.evaluatedReadiness.toolExecutionReadiness.externalBetaToolExecutionAllowed, false, 'platform probes alone must not allow beta tool execution')
assert.equal(report.externalBetaAllowed, false, 'probe transport smoke must not enable external beta')
assert.equal(report.productionAllowed, false, 'probe transport smoke must not enable production')

const failedCallOrder: string[] = []
const failedTransport = {
  ...passingTransport(failedCallOrder),
  verifyServiceRoleWritePath: async () => {
    failedCallOrder.push('verifyServiceRoleWritePath')
    return {
      ok: false,
      evidence: ['Service-role write path was not verified by deployed backend runtime.'],
      nextAction: 'Verify backend service-role event/evidence writes in staging before recording platform evidence.',
    }
  },
}
const failedReport = await runBetaPlatformDeployedEvidenceVerifier({
  workspaceId: 'workspace-beta-platform-probe-transport-smoke',
  sourceId: 'tool-beta-platform-evidence:deployed-probe-transport-smoke-failed',
  environment: 'staging',
  ownerApprovals: {
    billingOwnerStripeBoundaryApproved: true,
    deploymentApproved: true,
    securityApproved: true,
    storageApproved: true,
    legalApproved: true,
    monitoringApproved: true,
    supportApproved: true,
  },
  notes: ['Smoke fixture proves failed deployed probe transport fails closed.'],
}, createBetaPlatformDeployedEvidenceProbeRunners(failedTransport))

assert.equal(failedReport.evidencePacketReady, false, 'failed deployed probe transport must fail closed')
assert.equal(failedReport.evidencePacket, undefined, 'failed deployed probe transport must not produce a platform evidence packet')
assert.ok(
  failedReport.missingEvidence.some((item) => item.includes('service role write path verified')),
  'failed deployed probe transport should name the service-role blocker',
)
assert.ok(failedReport.evaluatedReadiness.toolExecutionReadiness.platformBlockers.length > 0, 'failed deployed probe transport should keep platform blocker')

console.log(JSON.stringify({
  ok: true,
  passingChecks: report.checks.length,
  evidencePacketReady: report.evidencePacketReady,
  failedEvidencePacketReady: failedReport.evidencePacketReady,
  externalBetaAllowed: report.externalBetaAllowed,
  productionAllowed: report.productionAllowed,
}, null, 2))

function passingTransport(callLog: string[]): BetaPlatformDeployedEvidenceProbeTransport {
  return {
    verifyToolCostEventsMigration: () => observation(callLog, 'verifyToolCostEventsMigration'),
    verifyBetaReadinessEvidenceMigration: () => observation(callLog, 'verifyBetaReadinessEvidenceMigration'),
    verifyServiceRoleWritePath: () => observation(callLog, 'verifyServiceRoleWritePath'),
    verifyAuthenticatedRlsMemberReadback: () => observation(callLog, 'verifyAuthenticatedRlsMemberReadback'),
    verifyIdempotentReplay: () => observation(callLog, 'verifyIdempotentReplay'),
    verifyWalletSettlement: () => observation(callLog, 'verifyWalletSettlement'),
    verifyStripeBoundaryOwnerApproval: () => observation(callLog, 'verifyStripeBoundaryOwnerApproval'),
    verifyMonitoringDeployment: () => observation(callLog, 'verifyMonitoringDeployment'),
    verifyStagingBillingQa: () => observation(callLog, 'verifyStagingBillingQa'),
  }
}

async function observation(
  callLog: string[],
  methodName: string,
): Promise<BetaPlatformDeployedEvidenceObservation> {
  callLog.push(methodName)
  return {
    ok: true,
    evidence: [`${methodName} passed in smoke fixture.`],
    nextAction: 'No action for smoke fixture.',
  }
}
