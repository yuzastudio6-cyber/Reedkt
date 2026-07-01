import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

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
assert.equal(plan.readyForAnyExternalAgentExecutionNow, true)
assert.deepEqual(plan.readyToolIds, ['qwen2_5_vl_7b_instruct'])
assert.equal(plan.blockedToolCount, rollup.tools.length - 1)
assert.equal(plan.runtimeGatesAllFalse, true)
assert.deepEqual(plan.safeCommandQueue, rollup.safeNextCommands)
assert.equal(plan.preferredNextSafeCommand.command, 'npm run external-agent-tool-next-command')
assert.equal(plan.toolActions.length, rollup.tools.length)
assert.equal(plan.manualBlockers.length, rollup.tools.length - 1)
assert.equal(plan.sourceRules.approvedSnapshotRequired, true)
assert.equal(plan.sourceRules.rawChatExecutionAllowed, false)
assert.equal(plan.sourceRules.remotionOwnsFinalComposition, true)

const toolActions = new Map(plan.toolActions.map((tool: { toolId: string }) => [tool.toolId, tool]))
const qwen = toolActions.get('qwen2_5_vl_7b_instruct') as {
  immediateSafeActions: string[]
  externalManualBlocker: string
  forbiddenRuntimeActions: string[]
}
assert.equal(qwen.immediateSafeActions[0], 'npm run external-agent-tool-next-command')
assert.equal(qwen.immediateSafeActions[1], 'npm run external-agent-tool-execution-gate -- --require-go')
assert.equal(qwen.immediateSafeActions.includes('npm run external-agent-tool-blockers:preflight'), true)
assert.equal(qwen.externalManualBlocker.includes('tool-specific bounded 58DW execution prompt'), true)
assert.equal(qwen.externalManualBlocker.includes('no direct or unbounded inference'), true)
assert.equal(
  qwen.forbiddenRuntimeActions.some((action) =>
    action.includes('do not run inference outside the approved 58DW bounded Qwen retry prompt'),
  ),
  true,
)

const broll = toolActions.get('ai_video_broll_generation_wan') as {
  immediateSafeActions: string[]
  externalManualBlocker: string
  forbiddenRuntimeActions: string[]
}
assert.equal(broll.immediateSafeActions[0], 'npm run external-agent-tool-next-command')
assert.equal(broll.immediateSafeActions[1], 'npm run external-agent-tool-execution-gate -- --require-go')
assert.equal(broll.immediateSafeActions.includes('npm run ai-video-broll-wan-fast-cache-readiness:check'), true)
assert.equal(broll.immediateSafeActions.includes('npm run external-agent-tool-blockers:preflight'), true)
assert.equal(broll.externalManualBlocker.includes('GPUS_ALL_REGIONS'), true)
assert.equal(broll.externalManualBlocker.includes('Google Cloud Console'), true)
assert.equal(broll.externalManualBlocker.includes('do not create VMs'), true)
assert.equal(broll.forbiddenRuntimeActions.includes('do not create Compute Engine VMs'), true)

for (const toolAction of plan.toolActions as Array<{ toolId: string; immediateSafeActions: string[] }>) {
  assert.equal(
    toolAction.immediateSafeActions[0],
    'npm run external-agent-tool-next-command',
    `Tool action must start with live next-command decision: ${toolAction.toolId}`,
  )
  assert.equal(
    toolAction.immediateSafeActions[1],
    'npm run external-agent-tool-execution-gate -- --require-go',
    `Tool action must require fail-closed execution gate before execution: ${toolAction.toolId}`,
  )
}

for (const command of plan.safeCommandQueue as Array<{ mutatesRuntime: boolean; runsModel: boolean; createsAssets: boolean }>) {
  assert.equal(command.mutatesRuntime, false)
  assert.equal(command.runsModel, false)
  assert.equal(command.createsAssets, false)
}
for (const [flag, value] of Object.entries(plan.runtimeSideEffects as Record<string, boolean>)) {
  assert.equal(value, false, `Runtime flag must remain false: ${flag}`)
}

const forbiddenFindings = scanForbiddenValues(plan)
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
