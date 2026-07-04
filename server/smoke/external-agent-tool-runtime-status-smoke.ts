import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CLI_PATH = 'server/cli/external-agent-tool-runtime-status.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-runtime-status-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-runtime-status'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-runtime-status'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'externalAgentRuntimeStatus'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['email value', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['iam mutation command', /\bgcloud\s+projects\s+add-iam-policy-binding\b/i],
      ['runtime deploy command', /\bgcloud\s+run\s+deploy\b/i],
      ['cloud run job execute command', /\bgcloud\s+run\s+jobs\s+execute\b/i],
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

for (const file of [
  CLI_PATH,
  SMOKE_PATH,
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'src/backend/mock/mock-external-agent-tool-execution-readiness-rollup.ts',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-runtime-status.ts',
  'package runtime status script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-runtime-status-smoke.ts',
  'package runtime status smoke script mismatch',
)

const cliSource = read(CLI_PATH)
for (const required of [
  'external_agent_tool_runtime_status_report',
  'agentCallable',
  'runtimeExecutableNow',
  'safePreflightCommand',
  'external-agent-tool-execute-qwen -- --preflight-only',
  'external-agent-tool-execute-broll-wan -- --preflight-only',
  'external-agent-tool-execute-broll-wan -- --inference-proof --preflight-only',
  'runtimeSideEffects',
]) {
  assert.equal(cliSource.includes(required), true, `Runtime status CLI missing ${required}`)
}

for (const forbidden of [
  'gcloud projects add-iam-policy-binding',
  'gcloud run deploy',
  'gcloud run jobs execute',
  'compute instances create',
  'supabase ',
  'psql',
  'createdb',
  'dropdb',
  'from_pretrained',
  'WanPipeline',
  'torch.',
]) {
  assert.equal(cliSource.includes(forbidden), false, `Runtime status CLI must not include ${forbidden}`)
}

function runStatus(args: string[] = []) {
  const output = execFileSync('npx', ['tsx', CLI_PATH, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 24,
  })

  return JSON.parse(output)
}

const staticStatus = runStatus(['--static-only'])
assert.equal(staticStatus.ok, true)
assert.equal(staticStatus.mode, 'external_agent_tool_runtime_status_report')
assert.equal(staticStatus.decision, 'external_agent_tools_callable_static_status_only')
assert.equal(staticStatus.liveChecksRun, false)
assert.equal(staticStatus.paidProductionInScope, false)
assert.equal(staticStatus.dryRunPassedClaimed, false)
assert.equal(staticStatus.generatedLocalFixturePassedClaimed, false)
assert.equal(staticStatus.agentCallableToolCount, 4)
assert.deepEqual(staticStatus.agentCallableToolIds, [
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
  'sound_music_audio',
  'supabase_local_fixture_harness',
])
assert.equal(staticStatus.readyForAnyExternalAgentRuntimeExecutionNow, false)
assert.deepEqual(staticStatus.runtimeExecutableToolIds, [])
assert.equal(staticStatus.runtimeGatesAllFalse, true)
assert.equal(staticStatus.safeAgentCommands.liveStatus, 'npm run external-agent-tool-runtime-status')
assert.equal(
  staticStatus.safeAgentCommands.brollInferencePreflight,
  'npm run external-agent-tool-execute-broll-wan -- --inference-proof --preflight-only --json',
)
assert.equal(staticStatus.gcpAccessRepair.ok, true)
assert.equal(staticStatus.gcpAccessRepair.mode, 'external_agent_gcp_access_repair_plan_only')
assert.equal(staticStatus.gcpAccessRepair.projectId, 'reeditpro')
assert.equal(staticStatus.gcpAccessRepair.repairScope.doesNotGrantIam, true)
assert.equal(staticStatus.gcpAccessRepair.repairScope.doesNotMutateGcp, true)
assert.equal(staticStatus.gcpAccessRepair.repairScope.doesNotAuthorizeRuntimeExecution, true)
assert.equal(staticStatus.gcpAccessRepair.tools.length, 2)
assert.equal(
  staticStatus.gcpAccessRepair.tools.some(
    (tool: { toolId: string; likelyMinimalRole: string }) =>
      tool.toolId === 'qwen2_5_vl_7b_instruct' && tool.likelyMinimalRole === 'roles/run.viewer',
  ),
  true,
)
assert.equal(
  staticStatus.gcpAccessRepair.tools.some(
    (tool: { toolId: string; likelyMinimalRole: string }) =>
      tool.toolId === 'ai_video_broll_generation_wan' && tool.likelyMinimalRole === 'roles/compute.viewer',
  ),
  true,
)
for (const [flag, value] of Object.entries(staticStatus.gcpAccessRepair.runtimeSideEffects)) {
  assert.equal(value, false, `GCP repair side-effect flag must remain false: ${flag}`)
}
assert.equal(staticStatus.tools.length, 4)

const staticToolsById = new Map(staticStatus.tools.map((tool: { toolId: string }) => [tool.toolId, tool]))
for (const tool of staticStatus.tools as Array<{
  toolId: string
  agentCallable: boolean
  runtimeExecutableNow: boolean
  executionAllowedNow: boolean
  wrapperStaticGuardCommand: string
  executionCommand: string
  confirmationEnv: string
}>) {
  assert.equal(tool.agentCallable, true, `${tool.toolId} should be agent-callable`)
  assert.equal(tool.runtimeExecutableNow, false, `${tool.toolId} should not be runtime-executable in static mode`)
  assert.equal(tool.executionAllowedNow, false, `${tool.toolId} should not execute from static mode`)
  assert.equal(typeof tool.wrapperStaticGuardCommand, 'string')
  assert.equal(typeof tool.executionCommand, 'string')
  assert.equal(typeof tool.confirmationEnv, 'string')
}

assert.equal(
  (staticToolsById.get('qwen2_5_vl_7b_instruct') as { safePreflightCommand: string }).safePreflightCommand,
  'npm run external-agent-tool-execute-qwen -- --preflight-only --json',
)
assert.equal(
  (staticToolsById.get('ai_video_broll_generation_wan') as { safePreflightCommand: string }).safePreflightCommand,
  'npm run external-agent-tool-execute-broll-wan -- --preflight-only --json',
)
assert.equal(
  (staticToolsById.get('sound_music_audio') as { supportingEvidenceOnly: boolean }).supportingEvidenceOnly,
  true,
)
assert.equal(
  (staticToolsById.get('supabase_local_fixture_harness') as { supportingEvidenceOnly: boolean })
    .supportingEvidenceOnly,
  true,
)

const liveStatus = runStatus()
assert.equal(liveStatus.ok, true)
assert.equal(liveStatus.mode, 'external_agent_tool_runtime_status_report')
assert.equal(liveStatus.liveChecksRun, true)
assert.equal(typeof liveStatus.decision, 'string')
assert.equal(typeof liveStatus.readyForAnyExternalAgentRuntimeExecutionNow, 'boolean')
assert.equal(Array.isArray(liveStatus.runtimeExecutableToolIds), true)
assert.equal(liveStatus.agentCallableToolCount, 4)
assert.equal(liveStatus.runtimeGatesAllFalse, true)
assert.equal(typeof liveStatus.liveGate.ok, 'boolean')
assert.equal(typeof liveStatus.liveGate.executionAllowedNow, 'boolean')
assert.equal(liveStatus.gcpAccessRepair.ok, true)
assert.equal(Array.isArray(liveStatus.gcpAccessRepair.postRepairVerificationCommands), true)
assert.equal(
  liveStatus.gcpAccessRepair.postRepairVerificationCommands.includes(
    'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=<redacted-index> npm run external-agent-gcp-access:verify',
  ),
  true,
)
for (const [flag, value] of Object.entries(liveStatus.gcpAccessRepair.runtimeSideEffects)) {
  assert.equal(value, false, `Live GCP repair side-effect flag must remain false: ${flag}`)
}
assert.equal(typeof liveStatus.nextCommand.ok, 'boolean')
assert.equal(typeof liveStatus.nextCommand.chosenNextCommand === 'string' || liveStatus.nextCommand.chosenNextCommand === null, true)
assert.equal(typeof liveStatus.recommendedNextPrompt, 'string')

for (const [flag, value] of Object.entries(liveStatus.runtimeSideEffects)) {
  assert.equal(value, false, `Runtime side-effect flag must remain false: ${flag}`)
}

const forbiddenFindings = scanForbiddenValues({ staticStatus, liveStatus })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: liveStatus.mode,
      staticDecision: staticStatus.decision,
      liveDecision: liveStatus.decision,
      agentCallableToolIds: liveStatus.agentCallableToolIds,
      runtimeExecutableToolIds: liveStatus.runtimeExecutableToolIds,
      readyForAnyExternalAgentRuntimeExecutionNow:
        liveStatus.readyForAnyExternalAgentRuntimeExecutionNow,
      liveChecksRun: liveStatus.liveChecksRun,
      runtimeGatesAllFalse: liveStatus.runtimeGatesAllFalse,
      recommendedNextPrompt: liveStatus.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
