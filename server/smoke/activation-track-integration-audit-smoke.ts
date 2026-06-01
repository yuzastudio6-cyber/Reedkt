import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import {
  buildTrackIntegrationAuditCommandPlans,
  buildTrackIntegrationAuditIamPlan,
  buildTrackIntegrationAuditReport,
  buildTrackIntegrationDocsReconciliation,
  buildTrackIntegrationOwnershipMatrix,
  buildTrackIntegrationRegistryReconciliation,
  buildTrackIntegrationTrackASummary,
  buildTrackIntegrationTrackBSummary,
  trackIntegrationAuditConfig,
  trackIntegrationAuditGateIds,
  trackIntegrationAuditRequiredDocs,
  trackIntegrationAuditRequiredScripts,
  validateTrackIntegrationAuditExecutionEnv,
} from '../activation/track-integration-audit'

const report = buildTrackIntegrationAuditReport()
const trackA = buildTrackIntegrationTrackASummary()
const trackB = buildTrackIntegrationTrackBSummary()
const ownership = buildTrackIntegrationOwnershipMatrix()
const registry = buildTrackIntegrationRegistryReconciliation()
const docs = buildTrackIntegrationDocsReconciliation()
const iam = buildTrackIntegrationAuditIamPlan()
const commands = buildTrackIntegrationAuditCommandPlans()

assert.equal(trackIntegrationAuditConfig.phase, '47A')
assert.equal(trackIntegrationAuditConfig.projectId, 'reeditpro')
assert.equal(trackIntegrationAuditConfig.region, 'us-central1')
assert.equal(trackIntegrationAuditConfig.env, 'staging')
assert.equal(trackIntegrationAuditConfig.runtimeMode, 'track_integration_audit')
assert.equal(trackIntegrationAuditConfig.trackAClosureRunId, 'phase45f-20260601T01103')
assert.equal(trackIntegrationAuditConfig.trackBVlmRunId, 'phase39c-20260531T214216')

assert.equal(trackA.status, 'ready')
assert.ok(trackA.evidence.some((item) => item.phase === '45F' && item.artifactUris.every((uri) => uri.startsWith('gs://reeditpro-staging-reeditpro-'))))
assert.equal(trackB.status, 'partial')
assert.ok(trackB.evidence.some((item) => item.phase === '36F' && item.status === 'ready'))
assert.ok(trackB.evidence.some((item) => item.phase === '36G' && item.status === 'blocked' && /Demucs/i.test(item.summary)))
assert.ok(trackB.evidence.some((item) => item.phase === '37E' && item.status === 'ready'))
assert.ok(trackB.evidence.some((item) => item.phase === '39C' && item.status === 'blocked' && /OOM|CUDA|vLLM/i.test(`${item.summary} ${item.blockers.join(' ')} ${item.warnings.join(' ')}`)))

assert.ok(ownership.trackATools.some((tool) => tool.toolId === 'sam2' && tool.owner === 'Track A'))
assert.ok(ownership.trackATools.some((tool) => tool.toolId === 'ffmpeg' && tool.owner === 'Track A'))
assert.ok(ownership.trackBTools.some((tool) => tool.toolId === 'deepfilternet' && tool.owner === 'Track B'))
assert.ok(ownership.trackBTools.some((tool) => tool.toolId === 'demucs' && tool.status === 'blocked'))
assert.ok(ownership.trackBTools.some((tool) => tool.toolId === 'vllm' && tool.status === 'blocked'))
assert.ok(ownership.inactiveTools.some((tool) => tool.toolId === 'rnnoise' && tool.status === 'inactive_removed'))
assert.ok(ownership.inactiveTools.some((tool) => tool.toolId === 'revideo' && tool.status === 'evaluation_only'))
assert.deepEqual(ownership.conflicts, [])

assert.equal(registry.packageScripts.status, 'passed')
assert.notEqual(registry.toolRegistry.status, 'blocked')
assert.equal(docs.docs.status, 'passed')
assert.equal(docs.readinessState.status, 'passed')
assert.equal(docs.staleContradictions.status, 'passed')

assert.equal(report.trackA.status, 'ready')
assert.equal(report.trackB.status, 'partial')
assert.equal(report.readinessDecision.status, 'blocked')
assert.ok(report.readinessDecision.reason.includes('VLM'))
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.finalDeliveryAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)

assert.equal(validateTrackIntegrationAuditExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'false',
}).allowed, false)
assert.equal(validateTrackIntegrationAuditExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  providerExecutionEnabled: 'false',
  revideoEnabled: 'false',
  publicAccessEnabled: 'false',
  finalDeliveryEnabled: 'false',
  mediaProcessingEnabled: 'false',
  dockerExecutionEnabled: 'false',
  cloudRunExecutionEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadRealMediaReady: 'false',
}).allowed, true)

assert.ok(iam.every((binding) => binding.reportOnly))
assert.ok(iam.every((binding) => binding.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iam.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/.test(binding.commandString)))
assert.ok(commands.every((plan) => plan.textOnlyByDefault))
assert.ok(JSON.stringify(commands).includes('REEDITPRO_CONFIRM_TRACK_INTEGRATION_AUDIT=true'))
assert.ok(!JSON.stringify(commands).includes('PROVIDER_EXECUTION_ENABLED=true'))
assert.ok(!JSON.stringify(commands).includes('REVIDEO_ENABLED=true'))
assert.ok(!JSON.stringify(commands).includes('DOCKER_EXECUTION_ENABLED=true'))
assert.ok(!JSON.stringify(commands).includes('CLOUD_RUN_EXECUTION_ENABLED=true'))

assert.deepEqual(trackIntegrationAuditGateIds, [
  'track_a_evidence_valid',
  'track_b_evidence_valid_or_blocked_with_reason',
  'ownership_boundaries_clear',
  'tool_registry_consistent',
  'package_scripts_consistent',
  'docs_consistent',
  'readiness_state_consistent',
  'no_stale_contradictory_status',
  'no_public_access',
  'production_beta_gates_blocked',
  'integration_readiness_decision',
])

for (const doc of trackIntegrationAuditRequiredDocs) assert.ok(existsSync(doc), `missing doc ${doc}`)
const scripts = JSON.parse(await readFile('package.json', 'utf8')).scripts as Record<string, string>
for (const script of trackIntegrationAuditRequiredScripts) assert.ok(scripts[script], `missing package script ${script}`)
assert.equal(scripts['activation:track-integration-audit'], 'tsx server/cli/activation-track-integration-audit.ts')
assert.equal(scripts['activation:track-integration-audit:report'], 'tsx server/cli/activation-track-integration-audit-report.ts')
assert.equal(scripts['activation:track-integration-audit:iam-plan'], 'tsx server/cli/activation-track-integration-audit-iam-plan.ts')
assert.equal(scripts['smoke:activation-track-integration-audit'], 'tsx server/smoke/activation-track-integration-audit-smoke.ts')

if (report.executionReport) {
  const gateIds = new Set(report.executionReport.qa.gates.map((gate) => gate.gateId))
  for (const gate of trackIntegrationAuditGateIds) assert.ok(gateIds.has(gate), `missing QA gate ${gate}`)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase47a_policy',
    'track_a_phase45f_ready',
    'track_b_partial_with_explicit_demucs_and_vlm_blockers',
    'ownership_boundaries',
    'package_scripts',
    'docs_consistency',
    'confirmation_gate',
    'report_only_iam',
    'blocked_features',
  ],
}))
