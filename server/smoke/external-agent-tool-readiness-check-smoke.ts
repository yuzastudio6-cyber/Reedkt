import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN } from '../../src/backend/mock/mock-external-agent-gcp-access-repair-plan'
import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

const ROOT = process.cwd()
const CLI_PATH = 'server/cli/external-agent-tool-readiness-check.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-readiness-check-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-readiness:check'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-readiness-check'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

for (const file of [
  CLI_PATH,
  SMOKE_PATH,
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'src/backend/mock/mock-external-agent-tool-execution-readiness-rollup.ts',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-readiness-check.ts',
  'package readiness check script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-readiness-check-smoke.ts',
  'package smoke script mismatch',
)

const cliSource = read(CLI_PATH)
for (const forbidden of [
  'gcloud ',
  'supabase ',
  'docker ',
  'psql',
  'createdb',
  'dropdb',
  'from_pretrained',
  'WanPipeline',
  'torch.',
  'execFileSync(',
  'spawnSync(',
]) {
  assert.equal(cliSource.includes(forbidden), false, `CLI must not include runtime command/import marker: ${forbidden}`)
}
assert.equal(cliSource.includes('Live checks are intentionally not implemented'), true)
assert.equal(cliSource.includes('EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN'), true)

const output = execFileSync('npx', ['tsx', CLI_PATH], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024,
})
const summary = JSON.parse(output)
assert.equal(summary.ok, true)
assert.equal(summary.mode, 'fast_static_external_agent_tool_readiness_check')
assert.equal(summary.decision, EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.decision)
assert.equal(summary.paidProductionInScope, false)
assert.equal(summary.dryRunPassedClaimed, false)
assert.equal(summary.generatedLocalFixturePassedClaimed, false)
assert.equal(summary.runtimeGatesAllFalse, true)
assert.equal(summary.liveChecksRun, false)
assert.equal(summary.cloudRunTouched, false)
assert.equal(summary.computeTouched, false)
assert.equal(summary.dockerRun, false)
assert.equal(summary.providerCallsMade, false)
assert.equal(summary.workersDispatched, false)
assert.equal(summary.supabaseTouched, false)
assert.equal(summary.sqlExecuted, false)
assert.equal(summary.modelInferenceRun, false)
assert.equal(summary.generatedAssetsCreated, false)
assert.equal(summary.readyForAnyExternalAgentExecutionNow, false)
assert.equal(summary.readyForAnyExternalAgentRuntimeExecutionNow, false)
assert.equal(summary.staticReadyForAnyExternalAgentExecutionGateNow, true)
assert.deepEqual(summary.readyToolIds, [])
assert.deepEqual(summary.staticReadyToolIds, ['qwen2_5_vl_7b_instruct'])
assert.deepEqual(summary.staticExplicitToolGateReadyToolIds, [
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
])
assert.equal(summary.livePreflightRequiredBeforeRuntime, true)
assert.equal(summary.executionNowBlockedByLivePreflight, true)
assert.equal(summary.blockedToolCount, EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.tools.length - 1)
assert.deepEqual(summary.missingEvidence, [])
assert.deepEqual(summary.safeNextCommands, EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.safeNextCommands)
assert.equal(summary.preferredNextSafeCommand.command, 'npm run external-agent-tool-next-command')
assert.equal(summary.preferredNextSafeCommand.mutatesRuntime, false)
assert.equal(summary.preferredNextSafeCommand.runsModel, false)
assert.equal(summary.preferredNextSafeCommand.createsAssets, false)
assert.equal(
  summary.recommendedNextPrompt,
  EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.recommendedNextPrompt,
)
assert.equal(
  summary.retryReadyAfterBlockerClearsToolIds.includes('qwen2_5_vl_7b_instruct'),
  true,
)
assert.equal(
  summary.retryReadyAfterBlockerClearsToolIds.includes('ai_video_broll_generation_wan'),
  true,
)
assert.deepEqual(summary.noIdleLifecycleGateToolIds, ['ai_video_broll_generation_wan'])
assert.equal(summary.noIdleLifecycleGates.length, 1)
assert.equal(summary.noIdleLifecycleGates[0].toolId, 'ai_video_broll_generation_wan')
assert.equal(summary.noIdleLifecycleGates[0].gate.proofVmName, 'reeditpro-ai-broll-wan-l4-proof')
assert.equal(summary.noIdleLifecycleGates[0].gate.machineType, 'g2-standard-8')
assert.equal(summary.noIdleLifecycleGates[0].gate.targetRegion, 'northamerica-northeast2')
assert.equal(summary.noIdleLifecycleGates[0].gate.targetZone, 'northamerica-northeast2-a')
assert.equal(summary.noIdleLifecycleGates[0].gate.noPublicIpRequired, true)
assert.equal(summary.noIdleLifecycleGates[0].gate.externalIpAllowed, false)
assert.equal(summary.noIdleLifecycleGates[0].gate.cleanupVerificationRequired, true)
assert.equal(summary.noIdleLifecycleGates[0].gate.idleGpuAllowed, false)
assert.equal(summary.noIdleLifecycleGates[0].gate.vmCreateAllowedNow, false)
assert.equal(summary.noIdleLifecycleGates[0].gate.modelInferenceAllowedNow, false)
assert.equal(typeof summary.gcpAccessRepair, 'object')
assert.equal(summary.gcpAccessRepair.decision, EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.decision)
assert.equal(summary.gcpAccessRepair.mode, EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.mode)
assert.equal(summary.gcpAccessRepair.projectId, 'reeditpro')
assert.deepEqual(summary.gcpAccessRepair.currentLiveBlockers, [
  'gcloud_account_lacks_qwen_cloud_run_read_access_or_resources_missing',
  'gcloud_account_lacks_compute_quota_read_access',
])
assert.equal(summary.gcpAccessRepair.repairScope.doesNotMutateGcp, true)
assert.equal(summary.gcpAccessRepair.repairScope.doesNotAuthorizeRuntimeExecution, true)
assert.equal(summary.gcpAccessRepair.tools.length, 2)
assert.equal(
  summary.gcpAccessRepair.tools.some(
    (tool: { toolId: string; failureMeaning: string; safeRepairChecklist: string[]; unsafeBypasses: string[] }) =>
      tool.toolId === 'qwen2_5_vl_7b_instruct' &&
      tool.failureMeaning.includes('Cloud Run') &&
      tool.safeRepairChecklist.length > 0 &&
      tool.unsafeBypasses.includes('do not skip Cloud Run service/job describe checks'),
  ),
  true,
)
assert.equal(
  summary.gcpAccessRepair.tools.some(
    (tool: { toolId: string; failureMeaning: string; safeRepairChecklist: string[]; unsafeBypasses: string[] }) =>
      tool.toolId === 'ai_video_broll_generation_wan' &&
      tool.failureMeaning.includes('Compute quota') &&
      tool.safeRepairChecklist.length > 0 &&
      tool.unsafeBypasses.includes('do not create a VM before quota read checks pass'),
  ),
  true,
)
assert.equal(typeof summary.gcpAccessRepair.failureResponsePolicy.ifReadAccessFails, 'string')
assert.equal(
  summary.gcpAccessRepair.safeRetryChecklist.includes(
    'run npm run external-agent-tool-next-command -- --account-index <redacted-index>',
  ),
  true,
)
assert.equal(summary.gcpAccessRepair.runtimeGatesAllFalse, true)
for (const [flag, value] of Object.entries(summary.gcpAccessRepair.runtimeSideEffects as Record<string, boolean>)) {
  assert.equal(value, false, `GCP repair side-effect flag must remain false: ${flag}`)
}
assert.deepEqual(summary.manualBlockerActionToolIds, [])

const blockersByTool = new Map(
  summary.blockers.map((blocker: { toolId: string }) => [blocker.toolId, blocker]),
)
assert.equal(blockersByTool.has('qwen2_5_vl_7b_instruct'), false)
assert.equal(blockersByTool.has('ai_video_broll_generation_wan'), true)
assert.equal(
  (blockersByTool.get('ai_video_broll_generation_wan') as { blocker: string }).blocker,
  'bounded_wan_inference_proof_retry_required_after_11h_fix',
)

for (const blocker of summary.blockers as Array<{
  toolId: string
  manualBlockerActions: Array<{
    runInsideCodex: boolean
    mutatesRuntime: boolean
    runsModel: boolean
    createsAssets: boolean
  }>
}>) {
  for (const action of blocker.manualBlockerActions) {
    assert.equal(action.runInsideCodex, false, `${blocker.toolId} manual action must stay outside Codex`)
    assert.equal(action.mutatesRuntime, false, `${blocker.toolId} manual action must not run runtime`)
    assert.equal(action.runsModel, false, `${blocker.toolId} manual action must not run models`)
    assert.equal(action.createsAssets, false, `${blocker.toolId} manual action must not create assets`)
  }
}

let liveModeFailed = false
try {
  execFileSync('npx', ['tsx', CLI_PATH, '--live'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
} catch (error) {
  liveModeFailed = true
  const stderr = error instanceof Error && 'stderr' in error ? String(error.stderr) : ''
  assert.equal(stderr.includes('Live checks are intentionally not implemented'), true)
}

assert.equal(liveModeFailed, true, 'live mode must fail closed')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: summary.decision,
      mode: summary.mode,
      evidenceChecked: summary.evidenceChecked,
      blockedToolCount: summary.blockedToolCount,
      preferredNextSafeCommand: summary.preferredNextSafeCommand.command,
      liveChecksRun: summary.liveChecksRun,
      runtimeGatesAllFalse: summary.runtimeGatesAllFalse,
      recommendedNextPrompt: summary.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
