import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildBetaReadinessOwnerApprovalEnvTemplate,
  buildBetaReadinessOwnerApprovalIntakePreflight,
} from '../cli/beta-readiness-owner-approval-intake-preflight.mjs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))

assert.equal(
  packageJson.scripts['beta:readiness:owner-approval-intake-preflight'],
  'node server/cli/beta-readiness-owner-approval-intake-preflight.mjs',
)
assert.equal(
  packageJson.scripts['beta:readiness:owner-approval-env-template'],
  'node server/cli/beta-readiness-owner-approval-intake-preflight.mjs --env-template',
)
assert.equal(
  packageJson.scripts['smoke:beta-readiness-owner-approval-intake-preflight'],
  'node server/smoke/beta-readiness-owner-approval-intake-preflight-smoke.mjs',
)

const empty = buildBetaReadinessOwnerApprovalIntakePreflight({})
assert.equal(empty.readyForDeployedEvidenceInputManifest, false)
assert.equal(empty.decision, 'beta_readiness_owner_approval_intake_preflight_blocked_missing_or_unsafe_owner_inputs')
assert.equal(empty.sourceTruth.sourceSha, 'ba5bc11778db7c3e2efd6b56941949f64b2c9684')
assert.equal(empty.sourceTruth.deployedEvidenceSourceSha, '769fc2d922b37a9eebb8b0ca29fa2447a6f8f127')
assert.equal(empty.sourceTruth.manifestOwnerGapPacket, 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-29-17a9-technical-inputs-owner-approval-gap.json')
assert.equal(empty.sourceTruth.deployedEvidenceInputManifest, 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-29-769f-deployed-evidence-input-manifest.json')
assert.equal(empty.sourceTruth.sourceFreshnessDecision, 'beta_readiness_source_freshness_preflight_passed_metadata_only_source_drift')
assert.equal(empty.sourceTruth.normalApiRevision, 'reeditpro-api-staging-00012-ncd')
assert.equal(empty.sourceTruth.productReadyLocalOssCount, 0)
assert.deepEqual(empty.sourceTruth.trackBToolTotals, {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 0,
})
assert.equal(empty.requiredInputCount, 29)
assert.ok(empty.pendingInputs.includes('REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY'))
assert.ok(empty.pendingInputs.includes('REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE'))

const completeEnv = {
  REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT: 'true',
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE: 'RLS readback approved for staging metadata evidence.',
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE: 'Billing owner approved no live Stripe charging in staging evidence.',
  REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE: 'Monitoring owner approved staging alerts and dashboard coverage.',
  REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE: 'Billing QA owner approved staged metadata-only QA evidence.',
  REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT: 'true',
  REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE: 'Model and tool license owner approved external beta scope only.',
  REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE: 'Deployment owner approved authenticated staging endpoints.',
  REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE: 'Security owner approved external beta evidence scope only.',
  REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE: 'Storage owner approved metadata-only evidence and no real user media.',
  REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE: 'Legal owner approved limited external beta evidence scope only.',
  REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE: 'Monitoring owner approved alerting coverage.',
  REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE: 'Support owner approved incident intake and rollback contact path.',
}

const ready = buildBetaReadinessOwnerApprovalIntakePreflight(completeEnv)
assert.equal(ready.readyForDeployedEvidenceInputManifest, true)
assert.equal(ready.decision, 'beta_readiness_owner_approval_intake_preflight_passed_ready_for_deployed_evidence_input_manifest')
assert.deepEqual(ready.pendingInputs, [])
assert.deepEqual(ready.invalidBooleanInputs, [])
assert.deepEqual(ready.rejectedScopeInputs, [])
assert.deepEqual(ready.secretLikeInputPaths, [])
assert.equal(JSON.stringify(ready).includes('Support owner approved incident intake'), false, 'report must not echo owner evidence note values')

const falseApproval = buildBetaReadinessOwnerApprovalIntakePreflight({
  ...completeEnv,
  REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY: 'false',
})
assert.equal(falseApproval.readyForDeployedEvidenceInputManifest, false)
assert.ok(falseApproval.invalidBooleanInputs.includes('REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY'))

const secretLike = buildBetaReadinessOwnerApprovalIntakePreflight({
  ...completeEnv,
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE: 'Bearer secret-token-value',
})
assert.equal(secretLike.readyForDeployedEvidenceInputManifest, false)
assert.ok(secretLike.secretLikeInputPaths.includes('ownerApprovalEvidence.REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE'))

const widerScope = buildBetaReadinessOwnerApprovalIntakePreflight({
  ...completeEnv,
  REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION: 'true',
})
assert.equal(widerScope.readyForDeployedEvidenceInputManifest, false)
assert.ok(widerScope.rejectedScopeInputs.includes('REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION'))

const template = buildBetaReadinessOwnerApprovalEnvTemplate()
assert.ok(template.includes('REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY=true'))
assert.ok(template.includes('REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE="<non-secret owner evidence summary>"'))
assert.ok(template.includes('REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE="<non-secret owner evidence summary>"'))
assert.ok(template.includes('REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION=false'))
assert.ok(template.includes('npm run beta:readiness:source-freshness-preflight'))
assert.equal((template.match(/^REEDITPRO_BETA_/gm) ?? []).length, 34)
assert.equal(template.includes('Bearer '), false)
assert.equal(template.includes('SERVICE_ROLE_KEY'), false)
assert.equal(template.includes('x-goog-signature='), false)

console.log(JSON.stringify({
  ok: true,
  emptyPendingInputs: empty.pendingInputs.length,
  readyDecision: ready.decision,
  blockedDecision: empty.decision,
  blockedScopes: ready.blockedScopes,
}, null, 2))
