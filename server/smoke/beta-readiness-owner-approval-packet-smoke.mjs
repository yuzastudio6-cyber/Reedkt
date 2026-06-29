import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildBetaReadinessOwnerApprovalPacket,
  renderBetaReadinessOwnerApprovalPacketMarkdown,
} from '../cli/beta-readiness-owner-approval-packet.mjs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const packetPath = 'docs/beta-readiness/owner-approval-packet-current-gates/2026-06-28-owner-approval-packet-current-gates.json'
const markdownPath = 'docs/beta-readiness/owner-approval-packet-current-gates/2026-06-28-owner-approval-packet-current-gates.md'
const packetDoc = JSON.parse(readFileSync(packetPath, 'utf8'))
const markdownDoc = readFileSync(markdownPath, 'utf8')
const report = buildBetaReadinessOwnerApprovalPacket()
const renderedMarkdown = renderBetaReadinessOwnerApprovalPacketMarkdown(report)
const serialized = JSON.stringify(report)

assert.equal(
  packageJson.scripts['beta:readiness:owner-approval-packet'],
  'node server/cli/beta-readiness-owner-approval-packet.mjs',
  'package script should expose the owner approval packet CLI without dependency hydration',
)
assert.equal(
  packageJson.scripts['smoke:beta-readiness-owner-approval-packet'],
  'node server/smoke/beta-readiness-owner-approval-packet-smoke.mjs',
  'package script should expose the owner approval packet smoke without dependency hydration',
)

assert.equal(report.ok, true)
assert.equal(report.decision, 'beta_readiness_owner_approval_packet_passed_ready_for_owner_review')
assert.equal(report.approvalState.approvalsGrantedByThisPacket, false)
assert.equal(report.approvalState.currentStatus, 'owner_review_requested')
assert.equal(report.sourceTruth.sourceSha, '8f5946c12d983abb6fb6e9eca020b9b260848706')
assert.equal(report.sourceTruth.deployedEvidenceSourceSha, 'aa49cef9ed6dad971f0163ea80ebb34de0e65d67')
assert.equal(report.sourceTruth.sourceFreshnessDecision, 'beta_readiness_source_freshness_preflight_passed_metadata_only_source_drift')
assert.equal(report.sourceTruth.currentSourceApiDeployPacket, 'docs/beta-readiness/api-staging-deploy-current-source/2026-06-29-aa49-api-staging-deploy.json')
assert.equal(report.sourceTruth.deployedEvidenceInputManifest, 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-29-aa49-deployed-evidence-input-manifest.json')
assert.equal(report.sourceTruth.normalApiRevision, 'reeditpro-api-staging-00013-jv9')
assert.equal(report.sourceTruth.normalApiRegion, 'us-east1')
assert.equal(report.sourceTruth.normalApiPublicUnauthenticatedHealthStatus, 403)
assert.equal(report.sourceTruth.normalApiDeployRunId, '28373860720')
assert.deepEqual(report.sourceTruth.trackBToolTotals, {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 0,
})
assert.equal(report.sourceTruth.productReadyLocalOssCount, 0)
assert.equal(report.sourceTruth.storedPlatformProbeProductReadyLocalOssCount, 14)
assert.equal(report.sourceTruth.platformProbePassedChecks, 8)
assert.equal(report.sourceTruth.platformProbeTotalChecks, 9)
assert.equal(report.platformApprovalItems.length, 7)
assert.equal(report.launchApprovalItems.length, 7)
assert.ok(report.platformApprovalItems.some((item) => item.id === 'platform_billing_stripe_boundary'))
assert.ok(report.launchApprovalItems.some((item) => item.id === 'launch_model_license_owner'))
assert.ok(report.postApprovalCommands.includes('npm run beta:readiness:source-freshness-preflight'))
assert.ok(report.postApprovalCommands.includes('npm run beta:readiness:owner-approval-intake-preflight'))
assert.ok(report.postApprovalCommands.includes('npm run beta:platform:staging-evidence-preflight'))
assert.ok(report.postApprovalCommands.includes('npm run beta:readiness:external-beta-operator-input-template'))
assert.ok(report.postApprovalCommands.includes('npm run beta:readiness:external-beta-evidence-collector'))
assert.ok(report.completionCriteria.some((criterion) => criterion.includes('readyForExternalBeta=true')))
assert.ok(report.forbiddenOwnerEvidence.includes('service-role keys'))
assert.ok(report.blockedScopes.includes('paid_production_until_paid_production_evidence_collector_passes'))
assert.deepEqual(report.supabaseClassification, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})
assert.equal(report.externalBetaEnabled, false)
assert.equal(report.realUserMediaBetaEnabled, false)
assert.equal(report.paidProductionEnabled, false)

assert.equal(packetDoc.decision, report.decision)
assert.equal(packetDoc.sourceTruth.sourceSha, report.sourceTruth.sourceSha)
assert.equal(packetDoc.sourceTruth.deployedEvidenceSourceSha, report.sourceTruth.deployedEvidenceSourceSha)
assert.equal(packetDoc.sourceTruth.productReadyLocalOssCount, report.sourceTruth.productReadyLocalOssCount)
assert.deepEqual(packetDoc.sourceTruth.trackBToolTotals, report.sourceTruth.trackBToolTotals)
assert.equal(packetDoc.approvalState.approvalsGrantedByThisPacket, false)
assert.deepEqual(packetDoc.platformApprovalItems.map((item) => item.id), report.platformApprovalItems.map((item) => item.id))
assert.deepEqual(packetDoc.launchApprovalItems.map((item) => item.id), report.launchApprovalItems.map((item) => item.id))
assert.deepEqual(packetDoc.supabaseClassification, report.supabaseClassification)

assert.ok(markdownDoc.includes('This packet does not approve anything.'))
assert.ok(markdownDoc.includes('reeditpro-api-staging-00013-jv9'))
assert.ok(markdownDoc.includes('api-staging-aa49cef9ed6d-20260629T1300Z'))
assert.ok(markdownDoc.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready'))
assert.ok(markdownDoc.includes('platform_billing_stripe_boundary'))
assert.ok(markdownDoc.includes('launch_model_license_owner'))
assert.ok(markdownDoc.includes('External beta, real-user-media beta, paid production'))
assert.ok(renderedMarkdown.includes('Beta Readiness Owner Approval Packet - Current Gates'))

assert.equal(serialized.includes('externalBetaEnabled":true'), false)
assert.equal(serialized.includes('realUserMediaBetaEnabled":true'), false)
assert.equal(serialized.includes('paidProductionEnabled":true'), false)
assert.equal(serialized.includes('SERVICE_ROLE_KEY'), false)
assert.equal(serialized.includes('SUPABASE_SERVICE_ROLE_KEY'), false)
assert.equal(serialized.includes('Bearer '), false)
assert.equal(serialized.includes('sk-'), false)
assert.equal(serialized.includes('x-goog-signature='), false)
assert.equal(serialized.includes('gcloud '), false)
assert.equal(serialized.includes('docker '), false)
assert.equal(serialized.includes('apt-get'), false)

console.log(JSON.stringify({
  ok: true,
  decision: report.decision,
  platformApprovalItemCount: report.platformApprovalItems.length,
  launchApprovalItemCount: report.launchApprovalItems.length,
  productReadyLocalOssCount: report.productReadyLocalOssCount,
  blockedScopes: report.blockedScopes,
}, null, 2))
