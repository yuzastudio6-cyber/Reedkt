import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildBetaReadinessOwnerApprovalCollectionHandoff,
  renderBetaReadinessOwnerApprovalCollectionHandoffMarkdown,
} from '../cli/beta-readiness-owner-approval-collection-handoff.mjs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const jsonPath = 'docs/beta-readiness/owner-approval-collection-handoff/2026-06-29-184f-owner-approval-collection-handoff.json'
const markdownPath = 'docs/beta-readiness/owner-approval-collection-handoff/2026-06-29-184f-owner-approval-collection-handoff.md'
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
assert.equal(handoff.sourceTruth.sourceSha, '184f8b225d01d5bb38c7d3a09d8461bcf8e325dc')
assert.equal(handoff.sourceTruth.deployedEvidenceSourceSha, '184f8b225d01d5bb38c7d3a09d8461bcf8e325dc')
assert.equal(handoff.sourceTruth.apiRevision, 'reeditpro-api-staging-00014-xdj')
assert.equal(handoff.sourceTruth.sourceFreshnessDecision, 'beta_readiness_source_freshness_preflight_passed_current_source_matches_deploy_evidence')
assert.equal(handoff.sourceTruth.currentDeployedEvidenceManifestDecision, 'beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs')
assert.equal(handoff.sourceTruth.detailedOwnerGapDecision, 'beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs')
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
assert.ok(handoff.commands.includes('npm run beta:readiness:external-beta-operator-input-template -- --status'))
assert.ok(handoff.commands.includes('npm run beta:readiness:external-beta-operator-autofill-env'))
assert.ok(handoff.commands.includes('npm run beta:readiness:external-beta-operator-human-input-checklist'))
assert.ok(handoff.commands.includes('npm run beta:readiness:external-beta-operator-input-template'))
assert.ok(handoff.commands.includes('npm run beta:readiness:owner-approval-intake-status'))
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
assert.deepEqual(staticJson.commands, handoff.commands)
assert.equal(staticJson.ownerApprovalState.pendingRequiredInputCount, handoff.ownerApprovalState.pendingRequiredInputCount)
assert.equal(staticJson.scopedBlockerForwardProgressPolicy.intentionalBlanketBlocksAllowed, false)

assert.ok(staticMarkdown.includes(handoff.decision))
assert.ok(staticMarkdown.includes('184f8b225d01d5bb38c7d3a09d8461bcf8e325dc'))
assert.ok(staticMarkdown.includes('Pending owner inputs: `29`'))
assert.ok(staticMarkdown.includes('npm run beta:readiness:external-beta-operator-autofill-env'))
assert.ok(staticMarkdown.includes('npm run beta:readiness:external-beta-operator-human-input-checklist'))
assert.ok(staticMarkdown.includes('npm run beta:readiness:external-beta-operator-input-template'))
assert.ok(staticMarkdown.includes('Intentional blanket blockers allowed: `false`'))
assert.ok(markdown.includes('Beta Readiness Owner Approval Collection Handoff - 184f'))

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
