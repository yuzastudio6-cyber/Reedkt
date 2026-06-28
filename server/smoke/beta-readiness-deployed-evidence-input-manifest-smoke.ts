import assert from 'node:assert/strict'
import {
  buildBetaReadinessDeployedEvidenceInputManifest,
  type BetaReadinessDeployedEvidenceInputManifestEnv,
} from '../cli/beta-readiness-deployed-evidence-input-manifest'

const expectedCurrentSourceSha = 'ffb1dc81325f24d37a0753783264052fe69ca0ee'
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
]
const expectedLibassImage = 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation:staging-libass-burnin-validation-001'

const emptyManifest = buildBetaReadinessDeployedEvidenceInputManifest({})
assert.equal(emptyManifest.ok, true)
assert.equal(emptyManifest.readyToRunExternalBetaEvidenceCollector, false, 'empty env should not be ready to run deployed evidence')
assert.equal(emptyManifest.decision, 'beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs')
assert.equal(emptyManifest.sourceTruth.locallyAcceptedToolCount, 14)
assert.equal(emptyManifest.sourceTruth.currentSourceSha, expectedCurrentSourceSha)
assert.equal(emptyManifest.sourceTruth.localAcceptedEvidenceSourceSha, '5bc6abf0ef238d8038ea0b95877ca06dd73738fc')
assert.deepEqual([...emptyManifest.sourceTruth.coreToolIds].sort(), [...expectedCoreToolIds].sort())
assert.deepEqual(emptyManifest.sourceTruth.libassToolIds, ['libass'])
assert.equal(emptyManifest.fixedInputs.libassMode, 'docker')
assert.equal(emptyManifest.fixedInputs.libassContainerImage, expectedLibassImage)
assert.equal(emptyManifest.fixedInputs.requiredProductReadyLocalOssCount, 14)
assert.equal(emptyManifest.fixedInputs.platformEnvironment, 'staging')
assert.equal(emptyManifest.fixedInputs.externalBetaReadyRequired, true)
assert.ok(emptyManifest.pendingRequiredInputs.includes('REEDITPRO_BETA_EXTERNAL_API_BASE_URL'))
assert.ok(emptyManifest.pendingRequiredInputs.includes('REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN'))
assert.ok(emptyManifest.pendingRequiredInputs.includes('REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY'))
assert.ok(emptyManifest.pendingRequiredInputs.includes('REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID'))
assert.ok(emptyManifest.pendingRequiredInputs.includes('REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE'))
assert.equal(emptyManifest.secretLikeInputPaths.length, 0)
assert.ok(emptyManifest.recommendedCommands.includes('npm run beta:readiness:external-beta-evidence-collector'))
assert.ok(emptyManifest.remainingBlockedScopes.includes('paid_production_until_separate_paid_production_evidence_collector_passes'))

const readyEnv: BetaReadinessDeployedEvidenceInputManifestEnv = {
  REEDITPRO_BETA_EXTERNAL_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN: 'secret-token-not-reported',
  REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID: 'workspace-deployed-evidence-input-manifest-smoke',
  REEDITPRO_BETA_EXTERNAL_PROJECT_ID: 'project-deployed-evidence-input-manifest-smoke',
  REEDITPRO_BETA_EXTERNAL_SOURCE_SHA: expectedCurrentSourceSha,
  REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE: 'true',
  REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY: 'tool-core-idempotency-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY: 'tool-libass-idempotency-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID: 'beta-tools-local-accepted-evidence-after-libass-snapshot',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA: expectedCurrentSourceSha,
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS: expectedCoreToolIds.join(','),
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT: '14',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE: 'docker',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE: expectedLibassImage,
  REEDITPRO_BETA_PLATFORM_SOURCE_SHA: expectedCurrentSourceSha,
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
  REEDITPRO_BETA_LAUNCH_SOURCE_SHA: expectedCurrentSourceSha,
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

console.log(JSON.stringify({
  ok: true,
  emptyReady: emptyManifest.readyToRunExternalBetaEvidenceCollector,
  readyDecision: readyManifest.decision,
  locallyAcceptedToolCount: readyManifest.sourceTruth.locallyAcceptedToolCount,
  pendingRequiredInputs: emptyManifest.pendingRequiredInputs.length,
  remainingBlockedScopes: readyManifest.remainingBlockedScopes,
}, null, 2))
