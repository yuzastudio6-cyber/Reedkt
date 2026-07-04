import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN } from '../../src/backend/mock/mock-external-agent-gcp-access-repair-plan'
import { EXTERNAL_AGENT_TOOL_EXECUTION_GATE } from '../../src/backend/mock/mock-external-agent-tool-execution-gate'

const ROOT = process.cwd()
const QWEN_READY_PROMPT =
  'EXTERNAL-AGENT-TOOL-EXECUTION-READY-QWEN: Qwen controlled approved-fixture private inference is ready for the explicit external-agent gate; keep beta/production blocked'
const SPEC_PATH = 'src/backend/mock/mock-external-agent-tool-execution-gate.ts'
const CLI_PATH = 'server/cli/external-agent-tool-execution-gate.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-execution-gate-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-execution-gate'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-execution-gate'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'executionGate'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['email value', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
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

for (const file of [SPEC_PATH, CLI_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-execution-gate.ts',
  'package execution gate script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-execution-gate-smoke.ts',
  'package execution gate smoke script mismatch',
)

const gate = EXTERNAL_AGENT_TOOL_EXECUTION_GATE
assert.equal(gate.decision, 'external_agent_execution_no_go_live_preflight_required')
assert.equal(gate.mode, 'fail_closed_external_agent_tool_execution_gate')
assert.equal(gate.readyForAnyExternalAgentExecutionNow, false)
assert.equal(gate.staticExplicitToolGateReady, true)
assert.equal(gate.requiresLivePreflightBeforeRuntime, true)
assert.equal(gate.requiresApprovedSnapshotBeforeExecution, true)
assert.equal(gate.requiresStructuredToolEnvelopeBeforeExecution, true)
assert.equal(gate.rawChatExecutionAllowed, false)
assert.equal(gate.toolRows.length, 4)
assert.equal(gate.safeCommandsBeforeExecution.includes('npm run external-agent-tool-next-command'), true)
assert.equal(
  (gate.safeCommandsBeforeExecution as readonly string[]).includes(
    'npm run external-agent-tool-execution-gate -- --require-go',
  ),
  false,
)
assert.equal(
  gate.safeCommandsBeforeExecution.includes('npm run external-agent-tool-execution-gate -- --live'),
  true,
)
assert.equal(gate.safeCommandsBeforeExecution.includes('npm run external-agent-gcp-access:verify'), true)
assert.equal(gate.safeCommandsBeforeExecution.includes('npm run external-agent-tool-blockers:preflight'), true)
assert.equal(gate.safeCommandsBeforeExecution.includes('npm run ai-video-broll-wan-gpu-global-quota:verify'), true)
assert.equal(gate.safeCommandsBeforeExecution.includes('npm run external-agent-gcloud-session:diagnostic'), true)
assert.equal(gate.safeCommandsBeforeExecution.includes('npm run external-agent-gcloud-account-access:diagnostic'), true)
assert.equal(gate.safeCommandsBeforeExecution.includes('npm run external-agent-tool-execute-broll-wan'), true)
assert.equal(gate.safeCommandsBeforeExecution.includes('npm run external-agent-tool-execute-sound'), true)
assert.equal(
  gate.safeCommandsBeforeExecution.includes('npm run external-agent-tool-execute-supabase-harness'),
  true,
)

for (const row of gate.toolRows) {
  if (row.toolId === 'qwen2_5_vl_7b_instruct') {
    assert.equal(row.staticExplicitToolGateReady, true, `${row.toolId} must have the explicit gate prepared`)
    assert.equal(row.executionAllowedNow, false, `${row.toolId} still requires live preflight`)
  } else {
    assert.equal(row.executionAllowedNow, false, `${row.toolId} must be blocked`)
  }
  assert.equal(row.requiredBeforeExecution.length > 0, true, `${row.toolId} needs required-before-execution rows`)
}
const qwenGateRow = gate.toolRows.find((row) => row.toolId === 'qwen2_5_vl_7b_instruct')
assert.equal(
  qwenGateRow?.currentBlocker,
  'live_preflight_required_before_runtime',
)
assert.equal(
  qwenGateRow?.safeNextCommand,
  'npm run external-agent-tool-next-command',
)
const soundGateRow = gate.toolRows.find((row) => row.toolId === 'sound_music_audio')
assert.equal(
  soundGateRow?.currentBlocker,
  'real_provider_worker_storage_track_qa_billing_export_handoffs_required',
)
assert.equal(soundGateRow?.safeNextCommand, 'npm run external-agent-tool-execute-sound')
const supabaseHarnessGateRow = gate.toolRows.find((row) => row.toolId === 'supabase_local_fixture_harness')
assert.equal(supabaseHarnessGateRow?.currentBlocker, 'not_a_model_or_media_execution_lane_on_this_branch')
assert.equal(
  supabaseHarnessGateRow?.safeNextCommand,
  'npm run external-agent-tool-execute-supabase-harness',
)
assert.equal(
  qwenGateRow?.requiredBeforeExecution.some((requirement) =>
    requirement.includes('58DW bounded retry result'),
  ),
  true,
)
assert.equal(
  qwenGateRow?.requiredBeforeExecution.some((requirement) =>
    requirement.includes('private inference retry plan'),
  ),
  true,
)
assert.equal(
  qwenGateRow?.requiredBeforeExecution.some((requirement) =>
    requirement.includes('retry gate must remain recorded and passed'),
  ),
  true,
)
assert.equal(
  qwenGateRow?.requiredBeforeExecution.some((requirement) =>
    requirement.includes('retry attempt approval must remain recorded'),
  ),
  true,
)
assert.equal(
  qwenGateRow?.requiredBeforeExecution.some((requirement) =>
    requirement.includes('retry attempt result must remain recorded as historical blocked evidence'),
  ),
  true,
)
assert.equal(
  qwenGateRow?.requiredBeforeExecution.some((requirement) =>
    requirement.includes('58DX result review'),
  ),
  true,
)
assert.equal(
  qwenGateRow?.requiredBeforeExecution.some((requirement) =>
    requirement.includes('passed evidence'),
  ),
  true,
)
const brollGateRow = gate.toolRows.find((row) => row.toolId === 'ai_video_broll_generation_wan')
assert.equal(
  brollGateRow?.requiredBeforeExecution.some((requirement) =>
    requirement.includes('auth-readable live preflight must verify GPUS_ALL_REGIONS'),
  ),
  true,
)
assert.equal(
  brollGateRow?.requiredBeforeExecution.some((requirement) =>
    requirement.includes('auth-readable live preflight must verify regional NVIDIA_L4'),
  ),
  true,
)
assert.equal(
  brollGateRow?.requiredBeforeExecution.some((requirement) => requirement.includes('no-idle')),
  true,
)
assert.equal(
  brollGateRow?.requiredBeforeExecution.some((requirement) => requirement.includes('verify cleanup')),
  true,
)
assert.equal(brollGateRow?.noIdleLifecycleGate?.proofVmName, 'reeditpro-ai-broll-wan-l4-proof')
assert.equal(brollGateRow?.noIdleLifecycleGate?.selectedGpu, 'nvidia_l4')
assert.equal(brollGateRow?.noIdleLifecycleGate?.machineType, 'g2-standard-8')
assert.equal(brollGateRow?.noIdleLifecycleGate?.targetRegion, 'northamerica-northeast2')
assert.equal(brollGateRow?.noIdleLifecycleGate?.targetZone, 'northamerica-northeast2-a')
assert.equal(brollGateRow?.noIdleLifecycleGate?.noPublicIpRequired, true)
assert.equal(brollGateRow?.noIdleLifecycleGate?.externalIpAllowed, false)
assert.equal(brollGateRow?.noIdleLifecycleGate?.cleanupVerificationRequired, true)
assert.equal(brollGateRow?.noIdleLifecycleGate?.idleGpuAllowed, false)
assert.equal(brollGateRow?.noIdleLifecycleGate?.vmCreateAllowedNow, false)
assert.equal(brollGateRow?.noIdleLifecycleGate?.modelInferenceAllowedNow, false)
for (const [flag, value] of Object.entries(gate.runtimeSideEffects)) {
  assert.equal(value, false, `Runtime side-effect flag must be false: ${flag}`)
}
assert.equal(gate.recommendedNextPrompt, QWEN_READY_PROMPT)

const cliSource = read(CLI_PATH)
for (const required of [
  '--live',
  '--account-index',
  'cliAccountIndexMapsToChildEnv',
  'runLiveVerifier',
  'external-agent-gcp-access-verify.ts',
  'EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN',
  'gcpAccessRepairGuidance',
]) {
  assert.equal(cliSource.includes(required), true, `Execution gate CLI missing live verifier marker: ${required}`)
}
for (const forbidden of ['execSync', 'execFileSync', 'gcloud ', 'docker ', 'psql', 'from_pretrained', 'torch.']) {
  assert.equal(cliSource.includes(forbidden), false, `Execution gate CLI must remain static-only: ${forbidden}`)
}

const output = execFileSync('npx', ['tsx', CLI_PATH], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024,
})
const report = JSON.parse(output)
assert.equal(report.ok, true)
assert.equal(report.mode, gate.mode)
assert.equal(report.decision, gate.decision)
assert.equal(report.liveMode, false)
assert.equal(report.accountSelectionGuidance.cliAccountIndexProvided, false)
assert.equal(report.accountSelectionGuidance.cliAccountIndexValid, false)
assert.equal(report.accountSelectionGuidance.mutatesLocalGcloudConfig, false)
assert.equal(report.accountSelectionGuidance.printsAccountValue, false)
assert.equal(report.liveVerifierRun, false)
assert.equal(report.liveVerifier, undefined)
assert.equal(report.liveVerifierAvailableCommand, 'npm run external-agent-gcp-access:verify')
assert.equal(typeof report.gcpAccessRepair, 'object')
assert.equal(report.gcpAccessRepair.decision, EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.decision)
assert.equal(report.gcpAccessRepair.mode, EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.mode)
assert.equal(report.gcpAccessRepair.projectId, 'reeditpro')
assert.deepEqual(report.gcpAccessRepair.currentLiveBlockers, [
  'gcloud_account_lacks_qwen_cloud_run_read_access_or_resources_missing',
  'gcloud_account_lacks_compute_quota_read_access',
])
assert.equal(report.gcpAccessRepair.repairScope.doesNotMutateGcp, true)
assert.equal(report.gcpAccessRepair.repairScope.doesNotAuthorizeRuntimeExecution, true)
assert.equal(report.gcpAccessRepair.tools.length, 2)
assert.equal(
  report.gcpAccessRepair.tools.some(
    (tool: { toolId: string; failureMeaning: string; safeRepairChecklist: string[]; unsafeBypasses: string[] }) =>
      tool.toolId === 'qwen2_5_vl_7b_instruct' &&
      tool.failureMeaning.includes('Cloud Run') &&
      tool.safeRepairChecklist.length > 0 &&
      tool.unsafeBypasses.includes('do not skip Cloud Run service/job describe checks'),
  ),
  true,
)
assert.equal(
  report.gcpAccessRepair.tools.some(
    (tool: { toolId: string; failureMeaning: string; safeRepairChecklist: string[]; unsafeBypasses: string[] }) =>
      tool.toolId === 'ai_video_broll_generation_wan' &&
      tool.failureMeaning.includes('Compute quota') &&
      tool.safeRepairChecklist.length > 0 &&
      tool.unsafeBypasses.includes('do not create a VM before quota read checks pass'),
  ),
  true,
)
assert.equal(typeof report.gcpAccessRepair.failureResponsePolicy.ifReadAccessFails, 'string')
assert.equal(report.gcpAccessRepair.runtimeGatesAllFalse, true)
for (const [flag, value] of Object.entries(report.gcpAccessRepair.runtimeSideEffects as Record<string, boolean>)) {
  assert.equal(value, false, `GCP repair side-effect flag must remain false: ${flag}`)
}
assert.equal(report.staticExplicitToolGateReady, true)
assert.deepEqual(report.staticExplicitToolGateReadyToolIds, [
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
])
assert.equal(report.staticReadyForAnyExternalAgentExecutionGateNow, true)
assert.deepEqual(report.staticReadyToolIds, ['qwen2_5_vl_7b_instruct'])
assert.equal(report.requiresLivePreflightBeforeRuntime, true)
assert.equal(report.executionNowBlockedByLivePreflight, true)
assert.equal(report.executionAllowedNow, false)
assert.equal(report.readyForAnyExternalAgentExecutionNow, false)
assert.equal(report.readyForAnyExternalAgentRuntimeExecutionNow, false)
assert.equal(report.runtimeGatesAllFalse, true)
assert.equal(report.rawChatExecutionAllowed, false)
assert.deepEqual(report.readyToolIds, [])
assert.equal(report.blockedToolIds.length, gate.toolRows.length)
const reportBrollGateRow = report.toolRows.find(
  (row: { toolId: string }) => row.toolId === 'ai_video_broll_generation_wan',
)
const reportQwenGateRow = report.toolRows.find(
  (row: { toolId: string }) => row.toolId === 'qwen2_5_vl_7b_instruct',
)
assert.equal(reportQwenGateRow.manualBlockerActions.length, 0)
assert.equal(
  reportBrollGateRow.currentBlocker,
  'bounded_wan_inference_proof_retry_required_after_11h_fix',
)
assert.equal(
  reportBrollGateRow.safeNextCommand,
  'npm run smoke:ai-video-broll-gen-11h-fix-inference-proof',
)
assert.equal(reportBrollGateRow.manualBlockerActions.length, 0)
assert.equal(reportBrollGateRow.noIdleLifecycleGate.proofVmName, 'reeditpro-ai-broll-wan-l4-proof')
assert.equal(reportBrollGateRow.noIdleLifecycleGate.externalIpAllowed, false)
assert.equal(reportBrollGateRow.noIdleLifecycleGate.vmCreateAllowedNow, false)

const requireGo = spawnSync('npx', ['tsx', CLI_PATH, '--require-go'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024,
})
const requireGoReport = JSON.parse(String(requireGo.stdout))
assert.equal(requireGoReport.requireGoMode, true)
assert.equal(requireGoReport.liveMode, false)
assert.equal(requireGoReport.staticExplicitToolGateReady, true)
assert.equal(requireGoReport.executionAllowedNow, false)
assert.equal(requireGo.status, 2)

const live = spawnSync('npx', ['tsx', CLI_PATH, '--live'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 24,
})
const liveReport = JSON.parse(String(live.stdout))
assert.equal(live.status, 0)
assert.equal(liveReport.liveMode, true)
assert.equal(liveReport.liveVerifierRun, true)
assert.equal(typeof liveReport.liveVerifier.ok, 'boolean')
assert.equal(typeof liveReport.liveVerifier.allRequiredReadAccessVerified, 'boolean')
assert.equal(typeof liveReport.liveVerifier.qwenReadAccessPassed, 'boolean')
assert.equal(typeof liveReport.liveVerifier.brollQuotaReadAccessPassed, 'boolean')
assert.equal(typeof liveReport.liveVerifier.brollQuotaSufficientForOneL4Vm, 'boolean')
assert.equal(typeof liveReport.liveVerifier.nextCommandExecutionAllowedNow, 'boolean')
if (!liveReport.liveVerifier.allRequiredReadAccessVerified) {
  assert.equal(typeof liveReport.liveVerifier.accountAccessDiagnostic.ok, 'boolean')
  assert.equal(typeof liveReport.liveVerifier.accountAccessDiagnostic.accountCount, 'number')
  assert.equal(typeof liveReport.liveVerifier.accountAccessDiagnostic.qwenReadyAccountCount, 'number')
  assert.equal(typeof liveReport.liveVerifier.accountAccessDiagnostic.brollQuotaReadAccountCount, 'number')
  assert.equal(typeof liveReport.liveVerifier.accountAccessDiagnostic.brollQuotaReadyAccountCount, 'number')
  assert.equal(typeof liveReport.liveVerifier.accountAccessDiagnostic.anyAccountReadyForBoth, 'boolean')
  assert.equal(typeof liveReport.liveVerifier.accountAccessDiagnostic.recommendedNextPrompt, 'string')
}
assert.equal(
  liveReport.executionAllowedNow,
  liveReport.staticExplicitToolGateReady &&
    liveReport.liveVerifier.ok &&
    liveReport.liveVerifier.readyForAnyExternalAgentExecutionNow,
)
assert.equal(liveReport.readyForAnyExternalAgentExecutionNow, liveReport.executionAllowedNow)
assert.equal(liveReport.readyForAnyExternalAgentRuntimeExecutionNow, liveReport.executionAllowedNow)
assert.equal(liveReport.executionNowBlockedByLivePreflight, !liveReport.executionAllowedNow)
if (!liveReport.executionAllowedNow) {
  assert.equal(liveReport.decision, 'external_agent_execution_no_go_live_preflight_blocked')
  assert.deepEqual(liveReport.readyToolIds, [])
  assert.equal(liveReport.blockedToolIds.length, gate.toolRows.length)
}

const indexedLive = spawnSync('npx', ['tsx', CLI_PATH, '--live', '--account-index', '2'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 24,
})
const indexedLiveReport = JSON.parse(String(indexedLive.stdout))
assert.equal(indexedLive.status, 0)
assert.equal(indexedLiveReport.liveMode, true)
assert.equal(indexedLiveReport.accountSelectionGuidance.cliAccountIndexProvided, true)
assert.equal(indexedLiveReport.accountSelectionGuidance.cliAccountIndex, 2)
assert.equal(indexedLiveReport.accountSelectionGuidance.cliAccountIndexValid, true)
assert.equal(indexedLiveReport.accountSelectionGuidance.cliAccountIndexMapsToChildEnv, true)
assert.equal(indexedLiveReport.accountSelectionGuidance.mutatesLocalGcloudConfig, false)
assert.equal(indexedLiveReport.accountSelectionGuidance.printsAccountValue, false)
assert.equal(
  indexedLiveReport.gcpAccessRepair.safeRetryChecklist.includes(
    'run npm run external-agent-tool-next-command -- --account-index 2',
  ),
  true,
)
assert.equal(
  indexedLiveReport.gcpAccessRepair.postRepairVerificationCommands.includes(
    'npm run external-agent-tool-blockers:preflight -- --account-index 2',
  ),
  true,
)
assert.equal(
  indexedLiveReport.gcpAccessRepair.tools.every((tool: { verificationCommand: string }) =>
    tool.verificationCommand.endsWith('--account-index 2'),
  ),
  true,
)
assert.equal(typeof indexedLiveReport.liveVerifier.ok, 'boolean')
assert.equal(typeof indexedLiveReport.liveVerifier.qwenReadAccessPassed, 'boolean')
assert.equal(typeof indexedLiveReport.liveVerifier.brollQuotaReadAccessPassed, 'boolean')

const requireGoLive = spawnSync('npx', ['tsx', CLI_PATH, '--require-go', '--live'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 24,
})
const requireGoLiveReport = JSON.parse(String(requireGoLive.stdout))
assert.equal(requireGoLiveReport.requireGoMode, true)
assert.equal(requireGoLiveReport.liveMode, true)
assert.equal(requireGoLive.status, requireGoLiveReport.executionAllowedNow ? 0 : 2)

const forbiddenFindings = scanForbiddenValues({
  gate,
  report,
  requireGoReport,
  liveReport,
  indexedLiveReport,
  requireGoLiveReport,
})
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: report.decision,
      mode: report.mode,
      executionAllowedNow: report.executionAllowedNow,
      liveExecutionAllowedNow: liveReport.executionAllowedNow,
      staticExplicitToolGateReady: report.staticExplicitToolGateReady,
      requireGoExitCode: requireGo.status,
      requireGoLiveExitCode: requireGoLive.status,
      blockedToolIds: report.blockedToolIds,
      runtimeGatesAllFalse: report.runtimeGatesAllFalse,
      recommendedNextPrompt: report.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
