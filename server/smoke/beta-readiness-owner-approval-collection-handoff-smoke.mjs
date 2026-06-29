import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildBetaReadinessOwnerApprovalCollectionHandoff,
  renderBetaReadinessOwnerApprovalCollectionHandoffMarkdown,
} from '../cli/beta-readiness-owner-approval-collection-handoff.mjs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const jsonPath = 'docs/beta-readiness/owner-approval-collection-handoff/2026-06-29-769f-owner-approval-collection-handoff.json'
const markdownPath = 'docs/beta-readiness/owner-approval-collection-handoff/2026-06-29-769f-owner-approval-collection-handoff.md'
const staticJson = JSON.parse(readFileSync(jsonPath, 'utf8'))
const staticMarkdown = readFileSync(markdownPath, 'utf8')
const handoff = buildBetaReadinessOwnerApprovalCollectionHandoff()
const markdown = renderBetaReadinessOwnerApprovalCollectionHandoffMarkdown(handoff)
const serialized = JSON.stringify(handoff)

assert.equal(
  packageJson.scripts['beta:readiness:owner-approval-collection-handoff'],
  'node server/cli/beta-readiness-owner-approval-collection-handoff.mjs',
)
assert.equal(
  packageJson.scripts['smoke:beta-readiness-owner-approval-collection-handoff'],
  'node server/smoke/beta-readiness-owner-approval-collection-handoff-smoke.mjs',
)

assert.equal(handoff.ok, true)
assert.equal(handoff.decision, 'beta_readiness_owner_approval_collection_handoff_passed_ready_for_owner_input_collection')
assert.equal(handoff.sourceTruth.sourceSha, 'ba5bc11778db7c3e2efd6b56941949f64b2c9684')
assert.equal(handoff.sourceTruth.deployedEvidenceSourceSha, '769fc2d922b37a9eebb8b0ca29fa2447a6f8f127')
assert.equal(handoff.sourceTruth.apiRevision, 'reeditpro-api-staging-00012-ncd')
assert.equal(handoff.sourceTruth.sourceFreshnessDecision, 'beta_readiness_source_freshness_preflight_passed_metadata_only_source_drift')
assert.equal(handoff.sourceTruth.currentDeployedEvidenceManifestDecision, 'beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs')
assert.equal(handoff.sourceTruth.detailedOwnerGapDecision, 'beta_deployed_evidence_input_manifest_blocked_only_by_owner_approvals_and_attestations')
assert.deepEqual(handoff.sourceTruth.trackBToolTotals, {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 0,
})
assert.equal(handoff.ownerApprovalState.approvalsGrantedByThisHandoff, false)
assert.equal(handoff.ownerApprovalState.readyForDeployedEvidenceInputManifest, false)
assert.equal(handoff.ownerApprovalState.pendingRequiredInputCount, 29)
assert.equal(handoff.ownerApprovalState.valueGapsInTechnicalInputs, 0)
assert.equal(handoff.ownerApprovalState.secretLikeInputPathsInTechnicalInputs, 0)
assert.deepEqual(handoff.requiredInputGroups, {
  platformApprovalBooleans: 7,
  platformAttestationsAndEvidenceNotes: 8,
  launchApprovalBooleans: 7,
  launchEvidenceNotes: 7,
})
assert.equal(handoff.requiredInputs.length, 29)
assert.ok(handoff.requiredInputs.some((input) => input.name === 'REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY'))
assert.ok(handoff.requiredInputs.some((input) => input.name === 'REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE'))
assert.equal(handoff.redactedTemplate.storesCompletedValuesInSourceControl, false)
assert.ok(handoff.commands.includes('npm run beta:readiness:owner-approval-intake-preflight'))
assert.equal(handoff.scopedBlockerForwardProgressPolicy.intentionalBlanketBlocksAllowed, false)
assert.equal(handoff.scopedBlockerForwardProgressPolicy.safeBlockerReductionAllowed, true)
assert.ok(handoff.scopedBlockerForwardProgressPolicy.blockedActionScope.includes('external_beta_launch'))
assert.ok(handoff.scopedBlockerForwardProgressPolicy.allowedForwardProgressScopes.includes('owner_approval_packet_collection'))
assert.equal(handoff.blockedScopeConfirmations.approvalsForgedOrGranted, false)
assert.equal(handoff.blockedScopeConfirmations.externalBetaEnabled, false)
assert.deepEqual(handoff.supabaseClassification, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})

assert.equal(staticJson.decision, handoff.decision)
assert.equal(staticJson.sourceTruth.sourceSha, handoff.sourceTruth.sourceSha)
assert.equal(staticJson.sourceTruth.deployedEvidenceSourceSha, handoff.sourceTruth.deployedEvidenceSourceSha)
assert.deepEqual(staticJson.requiredInputGroups, handoff.requiredInputGroups)
assert.equal(staticJson.ownerApprovalState.pendingRequiredInputCount, handoff.ownerApprovalState.pendingRequiredInputCount)
assert.equal(staticJson.scopedBlockerForwardProgressPolicy.intentionalBlanketBlocksAllowed, false)

assert.ok(staticMarkdown.includes(handoff.decision))
assert.ok(staticMarkdown.includes('ba5bc11778db7c3e2efd6b56941949f64b2c9684'))
assert.ok(staticMarkdown.includes('769fc2d922b37a9eebb8b0ca29fa2447a6f8f127'))
assert.ok(staticMarkdown.includes('Pending owner inputs: `29`'))
assert.ok(staticMarkdown.includes('Intentional blanket blockers allowed: `false`'))
assert.ok(markdown.includes('Beta Readiness Owner Approval Collection Handoff - 769f'))

assert.equal(serialized.includes('SERVICE_ROLE_KEY'), false)
assert.equal(serialized.includes('Bearer '), false)
assert.equal(serialized.includes('sk-'), false)
assert.equal(serialized.includes('x-goog-signature='), false)
assert.equal(serialized.includes('externalBetaEnabled":true'), false)
assert.equal(serialized.includes('paidProductionEnabled":true'), false)

console.log(JSON.stringify({
  ok: true,
  decision: handoff.decision,
  pendingRequiredInputCount: handoff.ownerApprovalState.pendingRequiredInputCount,
  requiredInputGroups: handoff.requiredInputGroups,
  blockedActionScope: handoff.scopedBlockerForwardProgressPolicy.blockedActionScope,
}, null, 2))
