import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  buildBetaReadinessOwnerApprovalEnvTemplate,
  buildBetaReadinessOwnerApprovalIntakePreflight,
  buildBetaReadinessOwnerApprovalIntakeStatus,
  renderBetaReadinessOwnerApprovalIntakeStatusMarkdown,
} from '../cli/beta-readiness-owner-approval-intake-preflight.mjs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const staticIntakePacket = JSON.parse(readFileSync(
  'docs/beta-readiness/owner-approval-packet-current-gates/2026-06-28-owner-approval-intake-preflight.json',
  'utf8',
))
const staticIntakeMarkdown = readFileSync(
  'docs/beta-readiness/owner-approval-packet-current-gates/2026-06-28-owner-approval-intake-preflight.md',
  'utf8',
)

assert.equal(
  packageJson.scripts['beta:readiness:owner-approval-intake-preflight'],
  'node server/cli/beta-readiness-owner-approval-intake-preflight.mjs',
)
assert.equal(
  packageJson.scripts['beta:readiness:owner-approval-intake-status'],
  'node server/cli/beta-readiness-owner-approval-intake-preflight.mjs --status',
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
assert.equal(empty.sourceTruth.sourceSha, 'ee177046bfb07868c4eb0ebd04f4eaff42c811ce')
assert.equal(empty.sourceTruth.deployedEvidenceSourceSha, 'ee177046bfb07868c4eb0ebd04f4eaff42c811ce')
assert.equal(empty.sourceTruth.manifestOwnerGapPacket, 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-30-ee177-deployed-evidence-input-manifest.json')
assert.equal(empty.sourceTruth.deployedEvidenceInputManifest, 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-30-ee177-deployed-evidence-input-manifest.json')
assert.equal(empty.sourceTruth.sourceFreshnessDecision, 'beta_readiness_source_freshness_preflight_passed_current_source_matches_deploy_evidence')
assert.equal(empty.sourceTruth.normalApiRevision, 'reeditpro-api-staging-00015-skq')
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

const emptyStatus = buildBetaReadinessOwnerApprovalIntakeStatus(empty)
const emptyStatusMarkdown = renderBetaReadinessOwnerApprovalIntakeStatusMarkdown(emptyStatus)
const serializedEmptyStatus = JSON.stringify(emptyStatus)
assert.equal(emptyStatus.ok, true)
assert.equal(emptyStatus.decision, 'beta_readiness_owner_approval_intake_status_passed_ready_for_owner_input_collection')
assert.equal(emptyStatus.preflightDecision, empty.decision)
assert.equal(emptyStatus.readyForDeployedEvidenceInputManifest, false)
assert.deepEqual(emptyStatus.inputCounts, {
  required: 29,
  present: 0,
  pending: 29,
  pendingOwnerApprovalConfirmations: 14,
  pendingTechnicalVerificationConfirmations: 4,
  pendingOwnerEvidenceNotes: 11,
  invalidBooleanInputs: 0,
  rejectedScopeInputs: 0,
  secretLikeEvidenceInputs: 0,
  safetyGaps: 0,
})
assert.ok(emptyStatus.pendingInputs.some((input) => (
  input.name === 'REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY' &&
  input.inputClass === 'owner_approval_confirmation' &&
  input.operatorAction === 'confirm_named_owner_approval'
)))
assert.ok(emptyStatus.pendingInputs.some((input) => (
  input.name === 'REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED' &&
  input.inputClass === 'technical_verification_confirmation' &&
  input.operatorAction === 'confirm_technical_verification'
)))
assert.ok(emptyStatus.pendingInputs.some((input) => (
  input.name === 'REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE' &&
  input.inputClass === 'owner_evidence_note' &&
  input.operatorAction === 'supply_non_secret_owner_evidence_note'
)))
assert.ok(emptyStatus.validationCommands.includes('npm run beta:readiness:owner-approval-intake-status'))
assert.ok(emptyStatus.validationCommands.includes('REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight'))
assert.equal(serializedEmptyStatus.includes('Support owner approved incident intake'), false)
assert.equal(serializedEmptyStatus.includes('Bearer '), false)
assert.equal(serializedEmptyStatus.includes('service_role_key'), false)
assert.equal(serializedEmptyStatus.includes('x-goog-signature='), false)
assert.ok(emptyStatusMarkdown.includes('Pending owner approval confirmations: `14`'))
assert.ok(emptyStatusMarkdown.includes('Pending technical verification confirmations: `4`'))
assert.ok(emptyStatusMarkdown.includes('Pending owner evidence notes: `11`'))
assert.ok(emptyStatusMarkdown.includes('Supabase classification: no write / environment none / SQL none / migration no.'))

assert.equal(staticIntakePacket.decision, 'beta_readiness_owner_approval_intake_preflight_passed_ready_for_owner_input_collection')
assert.equal(staticIntakePacket.currentNoInputPreflightDecision, empty.decision)
assert.equal(staticIntakePacket.deployedEvidenceSourceSha, empty.sourceTruth.deployedEvidenceSourceSha)
assert.equal(staticIntakePacket.deployedEvidenceInputManifest, empty.sourceTruth.deployedEvidenceInputManifest)
assert.equal(staticIntakePacket.ownerApprovalCollectionHandoff, 'docs/beta-readiness/owner-approval-collection-handoff/2026-06-30-ee177-owner-approval-collection-handoff.json')
assert.equal(staticIntakePacket.currentNoInputPendingCount, 29)
assert.deepEqual(staticIntakePacket.trackBToolTotals, empty.sourceTruth.trackBToolTotals)
assert.equal(staticIntakePacket.productReadyLocalOssCount, 0)
assert.ok(staticIntakeMarkdown.includes('Current no-input preflight decision'))
assert.ok(staticIntakeMarkdown.includes('ee177046bfb07868c4eb0ebd04f4eaff42c811ce'))
assert.ok(staticIntakeMarkdown.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready'))
assert.ok(staticIntakeMarkdown.includes('Product-ready local OSS count: `0`'))

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
const readyStatus = buildBetaReadinessOwnerApprovalIntakeStatus(ready)
assert.equal(readyStatus.readyForDeployedEvidenceInputManifest, true)
assert.equal(readyStatus.inputCounts.present, 29)
assert.equal(readyStatus.inputCounts.pending, 0)
assert.deepEqual(readyStatus.pendingInputs, [])

const tempRoot = mkdtempSync(join(tmpdir(), 'reeditpro-owner-approval-preflight-smoke-'))
process.on('exit', () => {
  rmSync(tempRoot, { recursive: true, force: true })
})
const completeEnvText = Object.entries(completeEnv)
  .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
  .join('\n')
const secureEnvPath = join(tempRoot, 'secure.env')
writeFileSync(secureEnvPath, completeEnvText)
chmodSync(secureEnvPath, 0o600)
const secureFile = buildBetaReadinessOwnerApprovalIntakePreflight({}, { envFilePath: secureEnvPath })
assert.equal(secureFile.readyForDeployedEvidenceInputManifest, true)
assert.equal(secureFile.envFile.permissionMode, '0600')
assert.equal(secureFile.envFile.ownerOnlyPermissions, true)
assert.equal(secureFile.envFile.symlink, false)
assert.equal(secureFile.envFile.safetyGaps.length, 0)
assert.equal(JSON.stringify(secureFile).includes('Support owner approved incident intake'), false)

const openEnvPath = join(tempRoot, 'open.env')
writeFileSync(openEnvPath, completeEnvText)
chmodSync(openEnvPath, 0o644)
const openFile = buildBetaReadinessOwnerApprovalIntakePreflight({}, { envFilePath: openEnvPath })
assert.equal(openFile.readyForDeployedEvidenceInputManifest, false)
assert.equal(openFile.envFile.permissionMode, '0644')
assert.equal(openFile.envFile.ownerOnlyPermissions, false)
assert.equal(openFile.envFile.safetyGaps.includes('owner_approval_env_file_permissions_not_owner_only'), true)
assert.equal(openFile.safetyGaps.includes('owner_approval_env_file_permissions_not_owner_only'), true)
assert.equal(JSON.stringify(openFile).includes('Support owner approved incident intake'), false)

const symlinkPath = join(tempRoot, 'linked.env')
symlinkSync(secureEnvPath, symlinkPath)
const symlinkFile = buildBetaReadinessOwnerApprovalIntakePreflight({}, { envFilePath: symlinkPath })
assert.equal(symlinkFile.readyForDeployedEvidenceInputManifest, false)
assert.equal(symlinkFile.envFile.symlink, true)
assert.equal(symlinkFile.envFile.safetyGaps.includes('owner_approval_env_file_is_symlink'), true)
assert.equal(symlinkFile.safetyGaps.includes('owner_approval_env_file_is_symlink'), true)
assert.equal(JSON.stringify(symlinkFile).includes('Support owner approved incident intake'), false)

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
assert.ok(template.includes('chmod 600 .env.reeditpro-beta-operator.local'))
assert.ok(template.includes('REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight'))
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
