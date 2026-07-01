import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

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
assert.deepEqual(summary.readyToolIds, [])
assert.equal(summary.blockedToolCount, EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.tools.length)
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
