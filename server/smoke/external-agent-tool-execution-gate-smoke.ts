import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_TOOL_EXECUTION_GATE } from '../../src/backend/mock/mock-external-agent-tool-execution-gate'

const ROOT = process.cwd()
const QWEN_AUTH_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh the active local gcloud account/configuration used by this shell, then rerun npm run external-agent-tool-blockers:preflight'
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
assert.equal(gate.safeCommandsBeforeExecution.includes('npm run external-agent-tool-blockers:preflight'), true)
assert.equal(gate.safeCommandsBeforeExecution.includes('npm run external-agent-gcloud-session:diagnostic'), true)

for (const row of gate.toolRows) {
  if (row.toolId === 'qwen2_5_vl_7b_instruct') {
    assert.equal(row.staticExplicitToolGateReady, true, `${row.toolId} must be ready for explicit static gate`)
    assert.equal(row.executionAllowedNow, false, `${row.toolId} must still require live preflight`)
  } else {
    assert.equal(row.executionAllowedNow, false, `${row.toolId} must be blocked`)
  }
  assert.equal(row.requiredBeforeExecution.length > 0, true, `${row.toolId} needs required-before-execution rows`)
}
const qwenGateRow = gate.toolRows.find((row) => row.toolId === 'qwen2_5_vl_7b_instruct')
assert.equal(
  qwenGateRow?.currentBlocker,
  'local_gcloud_reauthentication_required_before_58dw_runtime',
)
assert.equal(
  qwenGateRow?.safeNextCommand,
  QWEN_AUTH_PROMPT,
)
assert.equal(
  qwenGateRow?.requiredBeforeExecution.some((requirement) =>
    requirement.includes('token refresh must pass'),
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
    requirement.includes('58DW bounded retry prompt'),
  ),
  true,
)
assert.equal(
  qwenGateRow?.requiredBeforeExecution.some((requirement) =>
    requirement.includes('rerun live auth/service/job checks'),
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
assert.equal(brollGateRow?.noIdleLifecycleGate?.machineType, 'g2-standard-4')
assert.equal(brollGateRow?.noIdleLifecycleGate?.targetRegion, 'us-central1')
assert.equal(brollGateRow?.noIdleLifecycleGate?.targetZone, 'us-central1-b')
assert.equal(brollGateRow?.noIdleLifecycleGate?.noPublicIpRequired, true)
assert.equal(brollGateRow?.noIdleLifecycleGate?.externalIpAllowed, false)
assert.equal(brollGateRow?.noIdleLifecycleGate?.cleanupVerificationRequired, true)
assert.equal(brollGateRow?.noIdleLifecycleGate?.idleGpuAllowed, false)
assert.equal(brollGateRow?.noIdleLifecycleGate?.vmCreateAllowedNow, false)
assert.equal(brollGateRow?.noIdleLifecycleGate?.modelInferenceAllowedNow, false)
for (const [flag, value] of Object.entries(gate.runtimeSideEffects)) {
  assert.equal(value, false, `Runtime side-effect flag must be false: ${flag}`)
}

const cliSource = read(CLI_PATH)
for (const forbidden of ['spawnSync', 'execSync', 'execFileSync', 'gcloud ', 'docker ', 'psql', 'from_pretrained', 'torch.']) {
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
assert.equal(report.staticExplicitToolGateReady, true)
assert.deepEqual(report.staticExplicitToolGateReadyToolIds, ['qwen2_5_vl_7b_instruct'])
assert.equal(report.requiresLivePreflightBeforeRuntime, true)
assert.equal(report.executionAllowedNow, false)
assert.equal(report.readyForAnyExternalAgentExecutionNow, false)
assert.equal(report.runtimeGatesAllFalse, true)
assert.equal(report.rawChatExecutionAllowed, false)
assert.deepEqual(report.readyToolIds, [])
assert.equal(report.blockedToolIds.length, 4)
const reportBrollGateRow = report.toolRows.find(
  (row: { toolId: string }) => row.toolId === 'ai_video_broll_generation_wan',
)
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
assert.equal(requireGoReport.staticExplicitToolGateReady, true)
assert.equal(requireGoReport.executionAllowedNow, false)
assert.equal(requireGo.status, gate.requireGoExitCodeWhenBlocked)

const forbiddenFindings = scanForbiddenValues({ gate, report, requireGoReport })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: report.decision,
      mode: report.mode,
      executionAllowedNow: report.executionAllowedNow,
      staticExplicitToolGateReady: report.staticExplicitToolGateReady,
      requireGoExitCode: requireGo.status,
      blockedToolIds: report.blockedToolIds,
      runtimeGatesAllFalse: report.runtimeGatesAllFalse,
      recommendedNextPrompt: report.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
