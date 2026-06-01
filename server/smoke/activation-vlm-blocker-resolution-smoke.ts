import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import {
  buildVlmBlockerResolutionCommandPlans,
  buildVlmBlockerResolutionIamPlan,
  buildVlmBlockerResolutionReport,
  buildVlmExclusionPolicy,
  buildVlmRuntimeDecision,
  buildVlmSystemReadinessImpact,
  resolvePhase47AEvidence,
  resolveVlmBlockerEvidence,
  validateVlmBlockerResolutionExecutionEnv,
  vlmBlockerResolutionConfig,
  vlmBlockerResolutionGateIds,
  vlmBlockerResolutionRequiredDocs,
  vlmBlockerResolutionRequiredScripts,
} from '../activation/vlm-blocker-resolution'

const phase47a = resolvePhase47AEvidence()
const blocker = resolveVlmBlockerEvidence()
const decision = buildVlmRuntimeDecision()
const exclusion = buildVlmExclusionPolicy(blocker)
const impact = buildVlmSystemReadinessImpact(exclusion)
const report = buildVlmBlockerResolutionReport()
const iam = buildVlmBlockerResolutionIamPlan()
const commands = buildVlmBlockerResolutionCommandPlans()

assert.equal(vlmBlockerResolutionConfig.phase, '47B')
assert.equal(vlmBlockerResolutionConfig.projectId, 'reeditpro')
assert.equal(vlmBlockerResolutionConfig.region, 'us-central1')
assert.equal(vlmBlockerResolutionConfig.env, 'staging')
assert.equal(vlmBlockerResolutionConfig.runtimeMode, 'vlm_blocker_resolution_exclusion_gate')
assert.equal(vlmBlockerResolutionConfig.phase47aRunId, 'phase47a-20260601T02252')
assert.equal(vlmBlockerResolutionConfig.phase39cRunId, 'phase39c-20260531T214216')

assert.deepEqual(phase47a.blockers, [])
assert.equal(phase47a.evidence.trackAReadiness.status, 'ready')
assert.equal(phase47a.evidence.trackBReadiness.status, 'partial')
assert.equal(blocker.modelId, 'Qwen/Qwen3-VL-8B-Instruct')
assert.equal(blocker.revision, '0c351dd01ed87e9c1b53cbc748cba10e6187ff3b')
assert.equal(blocker.runtime, 'vllm')
assert.equal(blocker.vllmVersion, '0.11.0')
assert.equal(blocker.gpuType, 'L4')
assert.equal(blocker.oomStage, 'vllm_engine_initialization_before_generated_fixture_inference')
assert.match(`${blocker.exactBlocker} ${blocker.blockers.join(' ')} ${blocker.warnings.join(' ')}`, /CUDA out of memory|Engine core initialization|L4|vLLM/i)

assert.equal(decision.decision, 'vlm_excluded_from_initial_internal_testing')
assert.equal(decision.runtimeFixAttempted, false)
assert.equal(decision.runtimeFixResult, 'not_attempted_out_of_scope')
assert.ok(decision.forbiddenRequiredChanges.some((item) => item.includes('smaller or quantized')))
assert.equal(exclusion.vlmIncludedInInitialInternalTesting, false)
assert.equal(exclusion.vlmUserFacingEnabled, false)
assert.equal(exclusion.vlmRuntimeEnabled, false)
assert.equal(exclusion.vlmFutureScoped, true)
assert.equal(exclusion.providerFallbackAllowed, false)
assert.equal(impact.phase47CReadiness, 'ready_for_system_level_internal_testing_gate_preparation_without_vlm')
assert.equal(impact.systemLevelInternalTestingMayProceedWithoutVlm, true)

assert.equal(report.decision, 'vlm_excluded_from_initial_internal_testing')
assert.equal(report.exclusionPolicy.vlmRuntimeEnabled, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.deepEqual(report.qa.gates.map((gate) => gate.gateId), vlmBlockerResolutionGateIds)
assert.equal(report.qa.gates.every((gate) => gate.passed), true)

assert.equal(validateVlmBlockerResolutionExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'false',
}).allowed, false)
assert.equal(validateVlmBlockerResolutionExecutionEnv({
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
  modelDownloadEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadRealMediaReady: 'false',
}).allowed, true)

assert.ok(iam.every((binding) => binding.reportOnly))
assert.ok(iam.every((binding) => binding.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iam.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/.test(binding.commandString)))
assert.ok(commands.every((plan) => plan.textOnlyByDefault))
assert.ok(JSON.stringify(commands).includes('REEDITPRO_CONFIRM_VLM_BLOCKER_RESOLUTION=true'))
assert.ok(!JSON.stringify(commands).includes('PROVIDER_EXECUTION_ENABLED=true'))
assert.ok(!JSON.stringify(commands).includes('REVIDEO_ENABLED=true'))
assert.ok(!JSON.stringify(commands).includes('DOCKER_EXECUTION_ENABLED=true'))
assert.ok(!JSON.stringify(commands).includes('CLOUD_RUN_EXECUTION_ENABLED=true'))
assert.ok(!JSON.stringify(commands).includes('MODEL_DOWNLOAD_ENABLED=true'))

for (const doc of vlmBlockerResolutionRequiredDocs) assert.ok(existsSync(doc), `missing doc ${doc}`)
const scripts = JSON.parse(await readFile('package.json', 'utf8')).scripts as Record<string, string>
for (const script of vlmBlockerResolutionRequiredScripts) assert.ok(scripts[script], `missing package script ${script}`)
assert.equal(scripts['activation:vlm-blocker-resolution'], 'tsx server/cli/activation-vlm-blocker-resolution.ts')
assert.equal(scripts['activation:vlm-blocker-resolution:report'], 'tsx server/cli/activation-vlm-blocker-resolution-report.ts')
assert.equal(scripts['activation:vlm-blocker-resolution:iam-plan'], 'tsx server/cli/activation-vlm-blocker-resolution-iam-plan.ts')
assert.equal(scripts['smoke:activation-vlm-blocker-resolution'], 'tsx server/smoke/activation-vlm-blocker-resolution-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase47b_policy',
    'phase47a_evidence',
    'phase39c_vlm_oom_blocker',
    'runtime_fix_not_attempted',
    'vlm_formally_excluded',
    'phase47c_without_vlm_ready',
    'confirmation_gate',
    'report_only_iam',
    'blocked_features',
  ],
}))
