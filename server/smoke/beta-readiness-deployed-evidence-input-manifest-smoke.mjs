import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildBetaReadinessDeployedEvidenceInputManifest } from '../cli/beta-readiness-deployed-evidence-input-manifest.mjs'

const expectedLocalEvidenceSourceSha = 'd47015e88943dd4760dd9eb6ee45ad0f8ead15ca'
const staleLocalEvidenceSourceShas = [
  '94c37bb492a584c087247625dcb1fb53398c17f4',
  'e8821759a10a43a60795accb596b3b83c15f9dfb',
]
const expectedDeployedSourceSha = '184f8b225d01d5bb38c7d3a09d8461bcf8e325dc'
const expectedCoreToolIds = [
  'ffmpeg',
  'ffprobe',
  'pyav',
  'opentimelineio',
  'hyperframe',
  'remotion',
  'sharp',
  'duckdb',
  'polars',
  'pyscenedetect',
  'opencv',
  'opencolorio',
  'openimageio',
  'audioflux',
  'signalsmith_stretch',
]
const expectedLibassImage = 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation:staging-libass-burnin-validation-001'
const committedManifestJson = readFileSync(
  'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-29-184f-deployed-evidence-input-manifest.json',
  'utf8',
)
const committedManifestMarkdown = readFileSync(
  'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-29-184f-deployed-evidence-input-manifest.md',
  'utf8',
)

assert.equal(committedManifestJson.includes(expectedLocalEvidenceSourceSha), true)
assert.equal(committedManifestMarkdown.includes(expectedLocalEvidenceSourceSha), true)
for (const staleSourceSha of staleLocalEvidenceSourceShas) {
  assert.equal(committedManifestJson.includes(staleSourceSha), false)
  assert.equal(committedManifestMarkdown.includes(staleSourceSha), false)
}

const emptyManifest = buildBetaReadinessDeployedEvidenceInputManifest({})
assert.equal(emptyManifest.ok, true)
assert.equal(emptyManifest.readyToRunExternalBetaEvidenceCollector, false, 'empty env should not be ready to run deployed evidence')
assert.equal(emptyManifest.decision, 'beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs')
assert.equal(emptyManifest.sourceTruth.locallyAcceptedToolCount, 16)
assert.equal(emptyManifest.sourceTruth.currentSourceSha, expectedDeployedSourceSha)
assert.equal(emptyManifest.sourceTruth.localAcceptedEvidenceSourceSha, expectedLocalEvidenceSourceSha)
assert.deepEqual(emptyManifest.sourceTruth.trackBToolTotals, {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 0,
})
assert.deepEqual([...emptyManifest.sourceTruth.coreToolIds].sort(), [...expectedCoreToolIds].sort())
assert.deepEqual(emptyManifest.sourceTruth.libassToolIds, ['libass'])
assert.equal(emptyManifest.fixedInputs.libassMode, 'docker')
assert.equal(emptyManifest.fixedInputs.libassContainerImage, expectedLibassImage)
assert.equal(emptyManifest.fixedInputs.requiredBoundedAcceptedToolCount, 16)
assert.equal(emptyManifest.fixedInputs.requiredProductReadyLocalOssCount, 0)
assert.equal(emptyManifest.fixedInputs.platformEnvironment, 'staging')
assert.equal(emptyManifest.fixedInputs.externalBetaReadyRequired, true)
assert.equal(emptyManifest.pendingRequiredInputs.includes('REEDITPRO_BETA_EXTERNAL_API_BASE_URL'), false)
assert.ok(emptyManifest.pendingRequiredInputs.includes('REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN'))
assert.equal(emptyManifest.pendingRequiredInputs.includes('REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA'), false)
assert.equal(emptyManifest.pendingRequiredInputs.includes('REEDITPRO_BETA_EXTERNAL_SOURCE_SHA'), false)
assert.ok(emptyManifest.pendingRequiredInputs.includes('REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY'))
assert.ok(emptyManifest.pendingRequiredInputs.includes('REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID'))
assert.ok(emptyManifest.pendingRequiredInputs.includes('REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE'))
assert.equal(emptyManifest.secretLikeInputPaths.length, 0)
assert.ok(emptyManifest.recommendedCommands.includes('npm run beta:readiness:owner-approval-env-template'))
assert.ok(emptyManifest.recommendedCommands.includes('npm run beta:readiness:external-beta-operator-input-template -- --status'))
assert.ok(emptyManifest.recommendedCommands.includes('npm run beta:readiness:external-beta-operator-local-env-bootstrap'))
assert.ok(emptyManifest.recommendedCommands.includes('npm run beta:readiness:external-beta-operator-autofill-env'))
assert.ok(emptyManifest.recommendedCommands.includes('npm run beta:readiness:external-beta-operator-human-input-checklist'))
assert.ok(emptyManifest.recommendedCommands.includes('npm run beta:readiness:external-beta-operator-local-env-preflight'))
assert.ok(emptyManifest.recommendedCommands.includes('npm run beta:readiness:external-beta-operator-input-template'))
assert.ok(emptyManifest.recommendedCommands.includes('npm run beta:readiness:source-freshness-preflight'))
assert.ok(emptyManifest.recommendedCommands.includes('npm run beta:readiness:owner-approval-intake-status'))
assert.ok(emptyManifest.recommendedCommands.includes('REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight'))
assert.ok(emptyManifest.recommendedCommands.includes('npm run beta:readiness:external-beta-evidence-collector'))
assert.ok(emptyManifest.remainingBlockedScopes.includes('paid_production_until_separate_paid_production_evidence_collector_passes'))

const readyEnv = {
  REEDITPRO_BETA_EXTERNAL_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN: 'secret-token-not-reported',
  REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID: 'workspace-deployed-evidence-input-manifest-smoke',
  REEDITPRO_BETA_EXTERNAL_PROJECT_ID: 'project-deployed-evidence-input-manifest-smoke',
  REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA: expectedDeployedSourceSha,
  REEDITPRO_BETA_EXTERNAL_SOURCE_SHA: expectedDeployedSourceSha,
  REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE: 'true',
  REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY: 'tool-core-idempotency-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY: 'tool-libass-idempotency-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID: 'beta-tools-current-source-16-tool-local-accepted-evidence-bundle',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA: expectedLocalEvidenceSourceSha,
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS: expectedCoreToolIds.join(','),
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_BOUNDED_ACCEPTED_TOOL_COUNT: '16',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT: '0',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE: 'docker',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE: expectedLibassImage,
  REEDITPRO_BETA_PLATFORM_SOURCE_SHA: expectedDeployedSourceSha,
  REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY: 'platform-idempotency-smoke',
  REEDITPRO_BETA_PLATFORM_ENVIRONMENT: 'staging',
  REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES: 'true',
  REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID: 'tool-cost-event-staging-fixture-smoke',
  REEDITPRO_BETA_PLATFORM_RECORD_EVIDENCE: 'true',
  REEDITPRO_BETA_PLATFORM_CONFIRM_RECORD_EVIDENCE: 'true',
  REEDITPRO_BETA_PLATFORM_REQUIRE_READY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT: 'true',
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE: 'RLS member and non-member deployed staging readback passed.',
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE: 'Billing owner approved Stripe boundary and no live charging.',
  REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE: 'Monitoring dashboard and alert routing verified for staging.',
  REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE: 'Billing QA verified staged evidence only.',
  REEDITPRO_BETA_LAUNCH_SOURCE_SHA: expectedDeployedSourceSha,
  REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY: 'launch-idempotency-smoke',
  REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT: 'true',
  REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE: 'Model and tool license owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE: 'Deployment owner approved staging deployment evidence.',
  REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE: 'Security owner approved external beta readiness.',
  REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE: 'Storage and privacy owner approved external beta storage scope.',
  REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE: 'Legal owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE: 'Monitoring owner approved alerting coverage.',
  REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE: 'Support owner approved incident response coverage.',
}

const readyManifest = buildBetaReadinessDeployedEvidenceInputManifest(readyEnv)
assert.equal(readyManifest.readyToRunExternalBetaEvidenceCollector, true, 'complete env should be ready to run collector')
assert.equal(readyManifest.decision, 'beta_deployed_evidence_input_manifest_passed_ready_to_run_external_beta_evidence_collector')
assert.equal(readyManifest.sourceTruth.currentSourceSha, expectedDeployedSourceSha)
assert.equal(readyManifest.sourceTruth.localAcceptedEvidenceSourceSha, expectedLocalEvidenceSourceSha)
assert.equal(readyManifest.sourceTruth.currentSourceDerivedFromSnapshot, true)
assert.deepEqual(readyManifest.pendingRequiredInputs, [])
assert.deepEqual(readyManifest.valueGaps, [])
assert.deepEqual(readyManifest.secretLikeInputPaths, [])
assert.equal(JSON.stringify(readyManifest).includes('secret-token-not-reported'), false, 'manifest must not print secret values')

const wrongScopeManifest = buildBetaReadinessDeployedEvidenceInputManifest({
  ...readyEnv,
  REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION: 'true',
})
assert.equal(wrongScopeManifest.readyToRunExternalBetaEvidenceCollector, false)
assert.ok(
  wrongScopeManifest.valueGaps.some((gap) => gap.includes('REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION')),
  'manifest must reject paid-production launch approval in external beta lane',
)

const wrongToolsManifest = buildBetaReadinessDeployedEvidenceInputManifest({
  ...readyEnv,
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS: 'ffmpeg,ffprobe',
})
assert.equal(wrongToolsManifest.readyToRunExternalBetaEvidenceCollector, false)
assert.ok(
  wrongToolsManifest.valueGaps.some((gap) => gap.includes('CORE_TOOL_IDS')),
  'manifest must require exact accepted core tool set',
)

const wrongProductReadyManifest = buildBetaReadinessDeployedEvidenceInputManifest({
  ...readyEnv,
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT: '16',
})
assert.equal(wrongProductReadyManifest.readyToRunExternalBetaEvidenceCollector, false)
assert.ok(
  wrongProductReadyManifest.valueGaps.some((gap) => gap.includes('ACCEPT_PRODUCT_READY_LOCAL_OSS')),
  'manifest must reject product-ready tool acceptance in the bounded external-beta evidence lane',
)
assert.ok(
  wrongProductReadyManifest.valueGaps.some((gap) => gap.includes('REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT')),
  'manifest must keep product-ready local OSS count at 0',
)

console.log(JSON.stringify({
  ok: true,
  emptyReady: emptyManifest.readyToRunExternalBetaEvidenceCollector,
  readyDecision: readyManifest.decision,
  boundedAcceptedToolCount: readyManifest.sourceTruth.trackBToolTotals.boundedAcceptedProven,
  productReadyLocalOssCount: readyManifest.sourceTruth.trackBToolTotals.productReady,
  pendingRequiredInputs: emptyManifest.pendingRequiredInputs.length,
  remainingBlockedScopes: readyManifest.remainingBlockedScopes,
}, null, 2))
