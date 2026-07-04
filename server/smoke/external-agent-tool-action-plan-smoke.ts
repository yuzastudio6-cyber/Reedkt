import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN } from '../../src/backend/mock/mock-external-agent-gcp-access-repair-plan'
import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

const ROOT = process.cwd()
const CLI_PATH = 'server/cli/external-agent-tool-action-plan.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-action-plan-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-action-plan'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-action-plan'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'actionPlan'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
    ]

    for (const [name, pattern] of patterns) {
      if (pattern.test(value)) findings.push(`${prefix}: ${name}`)
    }

    return findings
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...scanForbiddenValues(item, `${prefix}[${index}]`)))
    return findings
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      findings.push(...scanForbiddenValues(nestedValue, `${prefix}.${key}`))
    }
  }

  return findings
}

for (const file of [CLI_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-action-plan.ts',
  'package action plan script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-action-plan-smoke.ts',
  'package action plan smoke script mismatch',
)

const cliSource = read(CLI_PATH)
for (const forbidden of [
  'spawnSync',
  'execSync',
  'execFileSync',
  'node:child_process',
  'from_pretrained',
  'torch.',
]) {
  assert.equal(cliSource.includes(forbidden), false, `Action plan CLI must remain static-only: ${forbidden}`)
}

const output = execFileSync('npx', ['tsx', CLI_PATH], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024,
})
const plan = JSON.parse(output)
const rollup = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP

assert.equal(plan.ok, true)
assert.equal(plan.mode, 'static_external_agent_tool_action_plan')
assert.equal(plan.decision, rollup.decision)
assert.equal(plan.paidProductionInScope, false)
assert.equal(plan.dryRunPassedClaimed, false)
assert.equal(plan.generatedLocalFixturePassedClaimed, false)
assert.equal(plan.readyForAnyExternalAgentExecutionNow, false)
assert.equal(plan.readyForAnyExternalAgentRuntimeExecutionNow, false)
assert.equal(plan.staticReadyForAnyExternalAgentExecutionGateNow, true)
assert.deepEqual(plan.readyToolIds, [])
assert.deepEqual(plan.staticReadyToolIds, ['qwen2_5_vl_7b_instruct'])
assert.deepEqual(plan.staticExplicitToolGateReadyToolIds, [
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
])
assert.deepEqual(plan.safeEvidenceReviewToolIds, [
  'sound_music_audio',
  'supabase_local_fixture_harness',
])
assert.equal(plan.safeEvidenceReviewToolCount, 2)
assert.equal(plan.readyForAnyExternalAgentSafeEvidenceReviewNow, true)
assert.equal(plan.livePreflightRequiredBeforeRuntime, true)
assert.equal(plan.executionNowBlockedByLivePreflight, true)
assert.equal(plan.blockedToolCount, rollup.tools.length - 1)
assert.equal(plan.runtimeGatesAllFalse, true)
assert.equal(plan.gcpAccessRepair.decision, EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.decision)
assert.equal(plan.gcpAccessRepair.mode, 'external_agent_gcp_access_repair_plan_only')
assert.equal(plan.gcpAccessRepair.projectId, 'reeditpro')
assert.equal(plan.gcpAccessRepair.repairScope.doesNotMutateGcp, true)
assert.equal(plan.gcpAccessRepair.repairScope.doesNotAuthorizeRuntimeExecution, true)
assert.deepEqual(plan.gcpAccessRepair.currentLiveBlockers, [
  'gcloud_account_lacks_qwen_cloud_run_read_access_or_resources_missing',
  'gcloud_account_lacks_compute_quota_read_access',
])
assert.equal(
  plan.gcpAccessRepair.failureResponsePolicy.ifReadAccessFails,
  'treat it as external GCP access or resource visibility work; do not weaken wrapper gates or mark runtime executable',
)
assert.equal(
  plan.gcpAccessRepair.safeRetryChecklist.includes(
    'run npm run external-agent-tool-next-command -- --account-index <redacted-index>',
  ),
  true,
)
assert.equal(plan.gcpAccessRepair.accountSelection.cliAccountIndexProvided, false)
assert.equal(plan.gcpAccessRepair.accountSelection.cliAccountIndex, undefined)
assert.equal(plan.gcpAccessRepair.accountSelection.cliAccountIndexValid, false)
assert.equal(plan.gcpAccessRepair.tools.length, 2)
assert.equal(
  plan.gcpAccessRepair.tools.some(
    (tool: {
      toolId: string
      failureMeaning: string
      unsafeBypasses: string[]
    }) =>
      tool.toolId === 'qwen2_5_vl_7b_instruct' &&
      tool.failureMeaning.includes('Token refresh can pass') &&
      tool.unsafeBypasses.includes('do not skip Cloud Run service/job describe checks'),
  ),
  true,
)
assert.equal(
  plan.gcpAccessRepair.tools.some(
    (tool: {
      toolId: string
      failureMeaning: string
      unsafeBypasses: string[]
    }) =>
      tool.toolId === 'ai_video_broll_generation_wan' &&
      tool.failureMeaning.includes('cannot read project or regional Compute quota') &&
      tool.unsafeBypasses.includes('do not switch to an always-on GPU instance to bypass no-idle gating'),
  ),
  true,
)
assert.equal(plan.gcpAccessRepair.runtimeGatesAllFalse, true)
for (const [flag, value] of Object.entries(plan.gcpAccessRepair.runtimeSideEffects)) {
  assert.equal(value, false, `GCP repair side-effect flag must remain false: ${flag}`)
}
assert.equal('accountIndexedSafeCommandQueue' in plan, false)
assert.equal('accountIndexedPreferredNextSafeCommand' in plan, false)

const indexedOutput = execFileSync('npx', ['tsx', CLI_PATH, '--account-index', '2'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024,
})
const indexedPlan = JSON.parse(indexedOutput)
assert.equal(indexedPlan.ok, true)
assert.equal(indexedPlan.gcpAccessRepair.accountSelection.cliAccountIndexProvided, true)
assert.equal(indexedPlan.gcpAccessRepair.accountSelection.cliAccountIndex, 2)
assert.equal(indexedPlan.gcpAccessRepair.accountSelection.cliAccountIndexValid, true)
assert.equal(indexedPlan.gcpAccessRepair.accountSelection.cliAccountIndexMapsToChildEnv, true)
assert.equal(
  indexedPlan.gcpAccessRepair.safeRetryChecklist.includes(
    'run npm run external-agent-tool-next-command -- --account-index 2',
  ),
  true,
)
assert.equal(
  indexedPlan.gcpAccessRepair.postRepairVerificationCommands.includes(
    'npm run external-agent-gcp-access:verify -- --account-index 2',
  ),
  true,
)
assert.equal(
  indexedPlan.gcpAccessRepair.tools.every((tool: { verificationCommand: string }) =>
    tool.verificationCommand.endsWith('--account-index 2'),
  ),
  true,
)
assert.deepEqual(plan.safeCommandQueue, rollup.safeNextCommands)
assert.deepEqual(indexedPlan.safeCommandQueue, rollup.safeNextCommands)
assert.equal(
  indexedPlan.accountIndexedPreferredNextSafeCommand.command,
  'npm run external-agent-tool-next-command -- --account-index 2',
)
const indexedSafeCommandQueueById = new Map(
  indexedPlan.accountIndexedSafeCommandQueue.map((command: { id: string }) => [command.id, command]),
)
assert.equal(
  (indexedSafeCommandQueueById.get('static_action_plan') as { command: string }).command,
  'npm run external-agent-tool-action-plan -- --account-index 2',
)
assert.equal(
  (indexedSafeCommandQueueById.get('static_readiness_check') as { command: string }).command,
  'npm run external-agent-tool-readiness:check -- --account-index 2',
)
assert.equal(
  (indexedSafeCommandQueueById.get('fail_closed_execution_gate') as { command: string }).command,
  'npm run external-agent-tool-execution-gate -- --account-index 2',
)
assert.equal(
  (indexedSafeCommandQueueById.get('live_next_command_decision') as { command: string }).command,
  'npm run external-agent-tool-next-command -- --account-index 2',
)
assert.equal(
  (indexedSafeCommandQueueById.get('live_blocker_preflight') as { command: string }).command,
  'npm run external-agent-tool-blockers:preflight -- --account-index 2',
)
assert.equal(
  (indexedSafeCommandQueueById.get('broll_gpu_global_quota_verify') as { command: string }).command,
  'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=2 npm run ai-video-broll-wan-gpu-global-quota:verify',
)
assert.equal(
  (indexedSafeCommandQueueById.get('broll_wan_external_agent_wrapper_static_guard') as { command: string }).command,
  'npm run external-agent-tool-execute-broll-wan -- --account-index 2',
)
assert.equal(plan.preferredNextSafeCommand.command, 'npm run external-agent-tool-next-command')
assert.equal(plan.toolActions.length, rollup.tools.length)
assert.equal(plan.manualBlockers.length, rollup.tools.length - 1)
assert.equal(plan.sourceRules.approvedSnapshotRequired, true)
assert.equal(plan.sourceRules.rawChatExecutionAllowed, false)
assert.equal(plan.sourceRules.remotionOwnsFinalComposition, true)

const toolActions = new Map(plan.toolActions.map((tool: { toolId: string }) => [tool.toolId, tool]))
const qwen = toolActions.get('qwen2_5_vl_7b_instruct') as {
  readyForExternalAgentExecutionNow: boolean
  readyForExternalAgentRuntimeExecutionNow: boolean
  staticExplicitToolGateReady: boolean
  staticReadyForExternalAgentExecutionGateNow: boolean
  executionNowBlockedByLivePreflight: boolean
  safeEvidenceReviewExecutableNow: boolean
  immediateSafeActions: string[]
  externalManualBlocker: string
  forbiddenRuntimeActions: string[]
  accountIndexedImmediateSafeActions: string[]
  manualBlockerActions: Array<{
    id: string
    runInsideCodex: boolean
    mutatesRuntime: boolean
    runsModel: boolean
    createsAssets: boolean
    mutatesCloud: boolean
    mutatesLocalGcloudAuth: boolean
    mutatesLocalGcloudConfig: boolean
    changesQuotaRequest: boolean
    afterCompletionCommand: string
  }>
}
assert.equal(qwen.readyForExternalAgentExecutionNow, false)
assert.equal(qwen.readyForExternalAgentRuntimeExecutionNow, false)
assert.equal(qwen.staticExplicitToolGateReady, true)
assert.equal(qwen.staticReadyForExternalAgentExecutionGateNow, true)
assert.equal(qwen.executionNowBlockedByLivePreflight, true)
assert.equal(qwen.safeEvidenceReviewExecutableNow, false)
assert.equal(qwen.immediateSafeActions[0], 'npm run external-agent-tool-next-command')
assert.equal(qwen.immediateSafeActions[1], 'npm run external-agent-tool-execution-gate')
assert.equal(qwen.immediateSafeActions.includes('npm run external-agent-tool-blockers:preflight'), true)
assert.equal(qwen.immediateSafeActions.includes('npm run external-agent-gcp-access:repair-plan'), true)
assert.equal(qwen.immediateSafeActions.includes('npm run external-agent-gcp-access:verify'), true)
const indexedToolActions = new Map(indexedPlan.toolActions.map((tool: { toolId: string }) => [tool.toolId, tool]))
const indexedQwen = indexedToolActions.get('qwen2_5_vl_7b_instruct') as {
  accountIndexedImmediateSafeActions: string[]
}
assert.deepEqual(indexedQwen.accountIndexedImmediateSafeActions, [
  'npm run external-agent-tool-next-command -- --account-index 2',
  'npm run external-agent-tool-execution-gate -- --account-index 2',
  'npm run external-agent-tool-blockers:preflight -- --account-index 2',
  'npm run external-agent-gcp-access:repair-plan -- --account-index 2',
  'npm run external-agent-gcp-access:verify -- --account-index 2',
])
assert.equal(qwen.externalManualBlocker.includes('58DX result review accepted'), true)
assert.equal(qwen.externalManualBlocker.includes('live preflight is still required'), true)
assert.equal(
  qwen.forbiddenRuntimeActions.some((action) =>
    action.includes('do not run inference outside the bounded approved-fixture Qwen gate'),
  ),
  true,
)
assert.equal(qwen.manualBlockerActions.length, 0)

for (const tool of plan.toolActions as Array<{
  toolId: string
  readyForExternalAgentExecutionNow: boolean
  readyForExternalAgentRuntimeExecutionNow: boolean
}>) {
  assert.equal(tool.readyForExternalAgentExecutionNow, false, `${tool.toolId} must not claim static execution-now`)
  assert.equal(
    tool.readyForExternalAgentRuntimeExecutionNow,
    false,
    `${tool.toolId} must not claim runtime execution-now from the static action plan`,
  )
}

const broll = toolActions.get('ai_video_broll_generation_wan') as {
  staticExplicitToolGateReady: boolean
  staticReadyForExternalAgentExecutionGateNow: boolean
  executionNowBlockedByLivePreflight: boolean
  safeEvidenceReviewExecutableNow: boolean
  immediateSafeActions: string[]
  accountIndexedImmediateSafeActions: string[]
  externalManualBlocker: string
  forbiddenRuntimeActions: string[]
  manualBlockerActions: Array<{
    id: string
    runInsideCodex: boolean
    mutatesRuntime: boolean
    runsModel: boolean
    createsAssets: boolean
    mutatesCloud: boolean
    mutatesLocalGcloudAuth: boolean
    mutatesLocalGcloudConfig: boolean
    changesQuotaRequest: boolean
    afterCompletionCommand: string
  }>
  noIdleLifecycleGate: {
    proofVmName: string
    machineType: string
    targetRegion: string
    targetZone: string
    minimumGlobalGpusAllRegionsQuota: number
    minimumRegionalL4Quota: number
    noPublicIpRequired: boolean
    externalIpAllowed: boolean
    cleanupVerificationRequired: boolean
    idleGpuAllowed: boolean
    vmCreateAllowedNow: boolean
    modelInferenceAllowedNow: boolean
  }
}
assert.equal(broll.staticExplicitToolGateReady, true)
assert.equal(broll.staticReadyForExternalAgentExecutionGateNow, true)
assert.equal(broll.executionNowBlockedByLivePreflight, true)
assert.equal(broll.safeEvidenceReviewExecutableNow, false)
assert.equal(broll.immediateSafeActions[0], 'npm run external-agent-tool-next-command')
assert.equal(broll.immediateSafeActions[1], 'npm run external-agent-tool-execution-gate')
assert.equal(broll.immediateSafeActions.includes('npm run ai-video-broll-wan-fast-cache-readiness:check'), true)
assert.equal(broll.immediateSafeActions.includes('npm run ai-video-broll-wan-gpu-global-quota:verify'), true)
assert.equal(broll.immediateSafeActions.includes('npm run external-agent-tool-execute-broll-wan'), true)
assert.equal(broll.immediateSafeActions.includes('npm run external-agent-tool-blockers:preflight'), true)
assert.equal(broll.immediateSafeActions.includes('npm run external-agent-gcp-access:repair-plan'), true)
assert.equal(broll.immediateSafeActions.includes('npm run external-agent-gcp-access:verify'), true)
const indexedBroll = indexedToolActions.get('ai_video_broll_generation_wan') as {
  accountIndexedImmediateSafeActions: string[]
}
assert.deepEqual(indexedBroll.accountIndexedImmediateSafeActions, [
  'npm run external-agent-tool-next-command -- --account-index 2',
  'npm run external-agent-tool-execution-gate -- --account-index 2',
  'npm run ai-video-broll-wan-fast-cache-readiness:check',
  'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=2 npm run ai-video-broll-wan-gpu-global-quota:verify',
  'npm run external-agent-tool-blockers:preflight -- --account-index 2',
  'npm run external-agent-gcp-access:repair-plan -- --account-index 2',
  'npm run external-agent-gcp-access:verify -- --account-index 2',
  'npm run external-agent-tool-execute-broll-wan -- --account-index 2',
])
assert.equal(broll.externalManualBlocker.includes('10ZB proved the no-idle L4 payload/install path'), true)
assert.equal(broll.externalManualBlocker.includes('11A selected the Wan-AI/Wan2.1-T2V-1.3B-Diffusers'), true)
assert.equal(broll.externalManualBlocker.includes('11B executed the bounded no-idle L4 model import/load proof'), true)
assert.equal(broll.externalManualBlocker.includes('11C accepts that passed proof as external-agent evidence'), true)
assert.equal(broll.externalManualBlocker.includes('11E staged the private GCS Wan model cache with the ready marker'), true)
assert.equal(broll.externalManualBlocker.includes('11F records the bounded Wan inference boundary plan'), true)
assert.equal(broll.externalManualBlocker.includes('11G implements the fail-closed inference-proof runner shell'), true)
assert.equal(broll.externalManualBlocker.includes('11H attempted the bounded latent inference proof'), true)
assert.equal(broll.externalManualBlocker.includes('11H-FIX updates the retry shape to g2-standard-8'), true)
assert.equal(
  broll.afterBlockerClears,
  'run AI-VIDEO-BROLL-GEN-11H-RETRY-INFERENCE-PROOF as a separate explicit bounded retry; the current fix only prepares the runner and does not create video',
)
assert.equal(broll.forbiddenRuntimeActions.includes('do not create Compute Engine VMs'), true)
assert.equal(broll.manualBlockerActions.length, 0)
assert.equal(broll.noIdleLifecycleGate.proofVmName, 'reeditpro-ai-broll-wan-l4-proof')
assert.equal(broll.noIdleLifecycleGate.machineType, 'g2-standard-8')
assert.equal(broll.noIdleLifecycleGate.targetRegion, 'northamerica-northeast2')
assert.equal(broll.noIdleLifecycleGate.targetZone, 'northamerica-northeast2-a')
assert.equal(broll.noIdleLifecycleGate.minimumGlobalGpusAllRegionsQuota, 1)
assert.equal(broll.noIdleLifecycleGate.minimumRegionalL4Quota, 1)
assert.equal(broll.noIdleLifecycleGate.noPublicIpRequired, true)
assert.equal(broll.noIdleLifecycleGate.externalIpAllowed, false)
assert.equal(broll.noIdleLifecycleGate.postCreateInstanceRunningWaitRequired, true)
assert.equal(broll.noIdleLifecycleGate.postCreatePrivateOnlyRecheckRequired, true)
assert.equal(broll.noIdleLifecycleGate.postCreateBootDiskAutoDeleteRecheckRequired, true)
assert.equal(broll.noIdleLifecycleGate.postCreateIapLookupReadinessBackoffRequired, true)
assert.equal(broll.noIdleLifecycleGate.postCreateIapLookupMaxAttempts, 8)
assert.equal(broll.noIdleLifecycleGate.postCreateIapLookupDelaySeconds, 10)
assert.equal(broll.noIdleLifecycleGate.durableReadinessSummaryRequired, true)
assert.equal(broll.noIdleLifecycleGate.cleanupVerificationRequired, true)
assert.equal(broll.noIdleLifecycleGate.idleGpuAllowed, false)
assert.equal(broll.noIdleLifecycleGate.vmCreateAllowedNow, false)
assert.equal(broll.noIdleLifecycleGate.modelInferenceAllowedNow, false)

const sound = toolActions.get('sound_music_audio') as {
  staticExplicitToolGateReady: boolean
  staticReadyForExternalAgentExecutionGateNow: boolean
  executionNowBlockedByLivePreflight: boolean
  safeEvidenceReviewExecutableNow: boolean
  immediateSafeActions: string[]
  accountIndexedImmediateSafeActions: string[]
  externalManualBlocker: string
  manualBlockerActions: unknown[]
}
assert.equal(sound.staticExplicitToolGateReady, false)
assert.equal(sound.staticReadyForExternalAgentExecutionGateNow, false)
assert.equal(sound.executionNowBlockedByLivePreflight, false)
assert.equal(sound.safeEvidenceReviewExecutableNow, true)
assert.equal(sound.immediateSafeActions[0], 'npm run external-agent-tool-next-command')
assert.equal(sound.immediateSafeActions[1], 'npm run external-agent-tool-execution-gate')
assert.equal(sound.immediateSafeActions.includes('npm run external-agent-tool-execute-sound'), true)
const indexedSound = indexedToolActions.get('sound_music_audio') as {
  accountIndexedImmediateSafeActions: string[]
}
assert.deepEqual(indexedSound.accountIndexedImmediateSafeActions, [
  'npm run external-agent-tool-next-command -- --account-index 2',
  'npm run external-agent-tool-execution-gate -- --account-index 2',
  'npm run external-agent-tool-execute-sound',
])
assert.equal(sound.externalManualBlocker.includes('runtime owner handoffs still required'), true)
assert.equal(sound.manualBlockerActions.length, 0)

const supabaseHarness = toolActions.get('supabase_local_fixture_harness') as {
  staticExplicitToolGateReady: boolean
  staticReadyForExternalAgentExecutionGateNow: boolean
  executionNowBlockedByLivePreflight: boolean
  safeEvidenceReviewExecutableNow: boolean
  immediateSafeActions: string[]
  accountIndexedImmediateSafeActions: string[]
  externalManualBlocker: string
  manualBlockerActions: unknown[]
}
assert.equal(supabaseHarness.staticExplicitToolGateReady, false)
assert.equal(supabaseHarness.staticReadyForExternalAgentExecutionGateNow, false)
assert.equal(supabaseHarness.executionNowBlockedByLivePreflight, false)
assert.equal(supabaseHarness.safeEvidenceReviewExecutableNow, true)
assert.equal(supabaseHarness.immediateSafeActions[0], 'npm run external-agent-tool-next-command')
assert.equal(supabaseHarness.immediateSafeActions[1], 'npm run external-agent-tool-execution-gate')
assert.equal(
  supabaseHarness.immediateSafeActions.includes('npm run external-agent-tool-execute-supabase-harness'),
  true,
)
const indexedSupabaseHarness = indexedToolActions.get('supabase_local_fixture_harness') as {
  accountIndexedImmediateSafeActions: string[]
}
assert.deepEqual(indexedSupabaseHarness.accountIndexedImmediateSafeActions, [
  'npm run external-agent-tool-next-command -- --account-index 2',
  'npm run external-agent-tool-execution-gate -- --account-index 2',
  'npm run external-agent-tool-execute-supabase-harness',
])
assert.equal(supabaseHarness.externalManualBlocker.includes('not a model or media execution lane'), true)
assert.equal(supabaseHarness.manualBlockerActions.length, 0)

for (const toolAction of plan.toolActions as Array<{ toolId: string; immediateSafeActions: string[] }>) {
  assert.equal(
    toolAction.immediateSafeActions[0],
    'npm run external-agent-tool-next-command',
    `Tool action must start with live next-command decision: ${toolAction.toolId}`,
  )
  assert.equal(
    toolAction.immediateSafeActions[1],
    'npm run external-agent-tool-execution-gate',
    `Tool action must require fail-closed execution gate before execution: ${toolAction.toolId}`,
  )
}

for (const command of plan.safeCommandQueue as Array<{ mutatesRuntime: boolean; runsModel: boolean; createsAssets: boolean }>) {
  assert.equal(command.mutatesRuntime, false)
  assert.equal(command.runsModel, false)
  assert.equal(command.createsAssets, false)
}
for (const manualBlocker of plan.manualBlockers as Array<{
  toolId: string
  manualBlockerActions: Array<{
    runInsideCodex: boolean
    mutatesRuntime: boolean
    runsModel: boolean
    createsAssets: boolean
  }>
}>) {
  for (const action of manualBlocker.manualBlockerActions) {
    assert.equal(action.runInsideCodex, false, `${manualBlocker.toolId} manual action must stay outside Codex`)
    assert.equal(action.mutatesRuntime, false, `${manualBlocker.toolId} manual action must not run runtime`)
    assert.equal(action.runsModel, false, `${manualBlocker.toolId} manual action must not run models`)
    assert.equal(action.createsAssets, false, `${manualBlocker.toolId} manual action must not create assets`)
  }
}
for (const [flag, value] of Object.entries(plan.runtimeSideEffects as Record<string, boolean>)) {
  assert.equal(value, false, `Runtime flag must remain false: ${flag}`)
}

const forbiddenFindings = scanForbiddenValues({ plan, indexedPlan })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: plan.decision,
      mode: plan.mode,
      blockedToolCount: plan.blockedToolCount,
      preferredNextSafeCommand: plan.preferredNextSafeCommand.command,
      qwenImmediateSafeActions: qwen.immediateSafeActions,
      brollImmediateSafeActions: broll.immediateSafeActions,
      runtimeGatesAllFalse: plan.runtimeGatesAllFalse,
      recommendedNextPrompt: plan.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
