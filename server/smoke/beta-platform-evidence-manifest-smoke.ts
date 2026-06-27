import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildBetaPlatformEvidenceManifest,
  buildToolBetaExecutionReadinessReport,
  type ToolBetaPlatformReadinessEvidence,
} from '../beta-readiness'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

const manifest = buildBetaPlatformEvidenceManifest()
const defaultReadiness = buildToolBetaExecutionReadinessReport()

assert.ok(manifest.manifestId.startsWith('beta-platform-evidence-manifest-'), 'manifest id should be stable')
assert.equal(manifest.policy.blockersAreEvidenceGaps, true, 'blockers must be modeled as evidence gaps')
assert.equal(manifest.policy.blockersOnlyProtectUnsafeActions, true, 'blockers must protect only unsafe actions')
assert.equal(manifest.policy.localProofDoesNotEnableExternalBeta, true, 'local proof must not enable external beta')
assert.equal(manifest.policy.deployedEvidenceCanClearPlatformBlocker, true, 'complete deployed evidence must be able to clear platform blocker')
assert.equal(
  manifest.policy.supabaseClassification,
  'no write / environment none / SQL none / migration no',
  'manifest smoke must not write Supabase or run migrations',
)
assert.equal(manifest.sourceTruth.toolCount, defaultReadiness.totalTools, 'manifest must reflect current tool count')
assert.equal(manifest.sourceTruth.ownerCoverageToolCount, defaultReadiness.ownerCoverageToolCount, 'manifest must reflect owner coverage count')
assert.equal(manifest.sourceTruth.readinessSpecToolCount, defaultReadiness.readinessSpecToolCount, 'manifest must reflect readiness spec count')
assert.equal(manifest.sourceTruth.productReadyLocalOssCount, 0, 'manifest must not claim product-ready local OSS')
assert.equal(manifest.sourceTruth.externalBetaToolExecutionAllowed, false, 'manifest default must keep external beta closed')
assert.equal(manifest.sourceTruth.productionToolExecutionAllowed, false, 'manifest default must keep production closed')
assert.equal(defaultReadiness.externalBetaToolExecutionAllowed, false, 'default tool gate must keep external beta closed')
assert.equal(defaultReadiness.productionToolExecutionAllowed, false, 'default tool gate must keep production closed')
assert.ok(defaultReadiness.platformBlockers.length > 0, 'default tool gate must keep platform blockers explicit')

const requiredRequirementIds = [
  'platform_deployed_evidence_verifier_ready',
  'tool_cost_events_migration_deployment',
  'beta_readiness_evidence_backend_only_deployment',
  'wallet_settlement_rpc_deployment',
  'authenticated_rls_member_readback',
  'stripe_boundary_owner_approval',
  'monitoring_dashboard_alert_deployment',
  'staging_billing_qa',
  'named_launch_owner_approvals',
]

const requirementIds = new Set(manifest.requirements.map((requirement) => requirement.id))
for (const id of requiredRequirementIds) {
  assert.ok(requirementIds.has(id), `manifest missing required platform evidence item: ${id}`)
}

assert.ok(manifest.requirements.some((requirement) => requirement.requiresDeployedEvidence), 'manifest must require deployed evidence')
assert.ok(manifest.requirements.some((requirement) => requirement.requiresOwnerApproval), 'manifest must require owner approvals')
assert.ok(manifest.remainingRequiredEvidence.length >= manifest.requirements.length, 'manifest must name remaining evidence')
assert.ok(manifest.localProofCommands.includes('smoke:beta-platform-rls-readback:sql'), 'manifest should include RLS readback local proof')
assert.ok(manifest.localProofCommands.includes('smoke:tool-cost-wallet-settlement:sql'), 'manifest should include wallet settlement SQL proof')
assert.ok(manifest.localProofCommands.includes('smoke:beta-platform-stripe-boundary'), 'manifest should include Stripe boundary source proof')
assert.ok(manifest.localProofCommands.includes('smoke:beta-platform-deployed-evidence-verifier'), 'manifest should include deployed evidence verifier proof')
assert.ok(manifest.localProofCommands.includes('smoke:beta-platform-deployed-evidence-probes'), 'manifest should include deployed evidence probe transport proof')
assert.ok(manifest.localProofCommands.includes('smoke:beta-platform-staging-evidence-preflight'), 'manifest should include staging evidence operator preflight proof')
assert.ok(manifest.localProofCommands.includes('smoke:beta-readiness-api'), 'manifest should include deployed evidence API route proof')

for (const command of manifest.localProofCommands) {
  assert.ok(packageJson.scripts?.[command], `local proof command must exist in package scripts: ${command}`)
}

for (const requirement of manifest.requirements) {
  assert.equal(requirement.clearsPlatformGate, false, `${requirement.id} must not clear platform gate alone`)
  assert.ok(requirement.label.trim(), `${requirement.id} must include a label`)
  assert.ok(requirement.localProofCommands.length > 0, `${requirement.id} must include local proof commands`)
  assert.ok(requirement.sourceFiles.length > 0, `${requirement.id} must include source files`)
  assert.ok(requirement.localEvidence.length > 0, `${requirement.id} must include local evidence`)
  assert.ok(requirement.remainingEvidence.length > 0, `${requirement.id} must include remaining evidence`)
  assert.ok(requirement.nextSafeAction.trim(), `${requirement.id} must include a next safe action`)
  for (const sourceFile of requirement.sourceFiles) {
    assert.ok(existsSync(sourceFile), `${requirement.id} source file is missing: ${sourceFile}`)
  }
}

const completePlatformEvidence: ToolBetaPlatformReadinessEvidence = {
  sourceId: 'tool-beta-platform-evidence:complete-staging-owner-packet',
  sourceSha: '3333333333333333333333333333333333333333',
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
  notes: ['Synthetic smoke evidence proves the platform blocker is evidence-driven, not hardcoded permanent.'],
}

const platformEvidenceReport = buildToolBetaExecutionReadinessReport({ platformEvidence: completePlatformEvidence })
assert.equal(platformEvidenceReport.platformBlockers.length, 0, 'complete platform evidence should clear platform blocker')
assert.equal(
  platformEvidenceReport.externalBetaToolExecutionAllowed,
  false,
  'complete platform evidence alone must not bypass remaining per-tool beta blockers',
)
assert.equal(
  platformEvidenceReport.productionToolExecutionAllowed,
  false,
  'complete platform evidence alone must not mark production ready',
)

const manifestText = JSON.stringify(manifest)
assert.equal(/40\+\s+tools\s+proven\s+end-to-end/i.test(manifestText), false, 'manifest must not claim 40+ tools proven end-to-end')
assert.equal(/externalBetaToolExecutionAllowed":true/.test(manifestText), false, 'manifest must not claim external beta is enabled')
assert.equal(/productionToolExecutionAllowed":true/.test(manifestText), false, 'manifest must not claim production is enabled')

console.log(JSON.stringify({
  ok: true,
  requirements: manifest.requirements.length,
  localProofCommands: manifest.localProofCommands,
  remainingRequiredEvidence: manifest.remainingRequiredEvidence.length,
  blockersAreEvidenceGaps: manifest.policy.blockersAreEvidenceGaps,
  externalBetaToolExecutionAllowed: defaultReadiness.externalBetaToolExecutionAllowed,
  productionToolExecutionAllowed: defaultReadiness.productionToolExecutionAllowed,
  completePlatformEvidenceClearsPlatformBlocker: platformEvidenceReport.platformBlockers.length === 0,
}, null, 2))
