import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_TOOL_LIVE_NEXT_COMMAND_RESULT } from '../../src/backend/mock/mock-external-agent-tool-live-next-command-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/external-agent-tool-live-next-command-result.md'
const SPEC_PATH = 'src/backend/mock/mock-external-agent-tool-live-next-command-result.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-live-next-command-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:external-agent-tool-live-next-command-result'
const DECISION = 'external_agent_tool_live_next_command_result_qwen_ready_broll_quota_blocked_recorded'
const QWEN_COMMAND =
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION=true npm run external-agent-tool-execute-qwen -- --execute --json'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'liveNextCommandResult'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['run.app URL', /\brun\.app\b/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service account email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.gserviceaccount\.com/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
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

function assertFalseFlags(flags: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  DOC_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'server/cli/external-agent-tool-next-command.ts',
  'server/cli/external-agent-tool-execute-qwen.ts',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/external-agent-tool-live-next-command-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  '`npm run external-agent-tool-next-command`',
  'command mode: `read_only_external_agent_tool_next_command_decision`',
  'live read-only checks run: `true`',
  'static explicit tool gate ready: `true`',
  'static execution gate allowed: `false`',
  'execution gate allows runtime: `false`',
  'Qwen live preflight passed: `true`',
  'Qwen service describe passed: `true`',
  'Qwen job describe passed: `true`',
  'execution allowed now: `true`',
  'B-roll quota sufficient for one L4 VM: `false`',
  'Codex runnable next command now: `null`',
  QWEN_COMMAND,
  '`qwen2_5_vl_7b_instruct`',
  '`ai_video_broll_generation_wan`',
  '`sound_music_audio`',
  '`supabase_local_fixture_harness`',
  '`cloudRunServiceMutated=false`',
  '`modelInferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  'This does not run Qwen inference.',
]) {
  assert.equal(doc.includes(required), true, `Live next-command doc missing ${required}`)
}

const result = EXTERNAL_AGENT_TOOL_LIVE_NEXT_COMMAND_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.executedCommand, 'npm run external-agent-tool-next-command')
assert.equal(result.readOnlyResult.commandMode, 'read_only_external_agent_tool_next_command_decision')
assert.equal(result.readOnlyResult.commandDecision, 'external_agent_live_next_command_read_only_decision_defined')
assert.equal(result.readOnlyResult.liveReadOnlyChecksRun, true)
assert.equal(result.readOnlyResult.staticExplicitToolGateReady, true)
assert.equal(result.readOnlyResult.staticExplicitToolGatePrepared, true)
assert.equal(result.readOnlyResult.staticExecutionGateAllowed, false)
assert.equal(result.readOnlyResult.executionGateAllowsRuntime, false)
assert.equal(result.readOnlyResult.staticGatePlanningOnly, true)
assert.equal(result.readOnlyResult.staticGateDoesNotAuthorizeRuntime, true)
assert.equal(result.readOnlyResult.qwenLivePreflightPassed, true)
assert.equal(result.readOnlyResult.qwenServiceDescribePassed, true)
assert.equal(result.readOnlyResult.qwenJobDescribePassed, true)
assert.equal(result.readOnlyResult.qwenAuthRefreshPassed, true)
assert.equal(result.readOnlyResult.executionAllowedNow, true)
assert.equal(result.readOnlyResult.readyForAnyExternalAgentExecutionNow, true)
assert.equal(result.readOnlyResult.brollQuotaSufficientForOneL4Vm, false)
assert.equal(result.readOnlyResult.manualActionRequired, false)
assert.equal(result.readOnlyResult.chosenNextCommandAlreadyExecutedInThisRun, false)
assert.equal(result.readOnlyResult.codexRunnableNextCommandNow, null)
assert.equal(result.qwenExternalAgentExecutionCommand.shellExample, QWEN_COMMAND)
assert.equal(result.qwenExternalAgentExecutionCommand.verifiesLiveNextCommandBeforeDelegating, true)
assert.equal(result.qwenExternalAgentExecutionCommand.delegatesToBoundedCommand, true)
assert.equal(result.qwenExternalAgentExecutionCommand.createsGeneratedAssets, false)
assert.equal(result.qwenExternalAgentExecutionCommand.touchesSupabase, false)
assert.equal(result.qwenExternalAgentExecutionCommand.touchesSql, false)
assert.equal(result.qwenExternalAgentExecutionCommand.unlocksBetaOrProduction, false)
assert.equal(result.toolDecisions.length, 4)
assert.equal(
  result.toolDecisions.some(
    (tool) =>
      tool.toolId === 'qwen2_5_vl_7b_instruct' &&
      tool.externalAgentExecutionStatus === 'ready_for_explicit_external_agent_gate' &&
      tool.executionAllowedNow,
  ),
  true,
)
assert.equal(
  result.toolDecisions.some(
    (tool) =>
      tool.toolId === 'ai_video_broll_generation_wan' &&
      tool.externalAgentExecutionStatus === 'blocked_by_external_quota' &&
      !tool.executionAllowedNow,
  ),
  true,
)
assert.equal(
  result.toolDecisions.some(
    (tool) =>
      tool.toolId === 'sound_music_audio' &&
      tool.externalAgentExecutionStatus === 'metadata_only_blocked' &&
      !tool.executionAllowedNow,
  ),
  true,
)
assert.equal(
  result.toolDecisions.some(
    (tool) =>
      tool.toolId === 'supabase_local_fixture_harness' &&
      tool.externalAgentExecutionStatus === 'not_a_model_or_media_execution_lane' &&
      !tool.executionAllowedNow,
  ),
  true,
)
assertFalseFlags(result.runtimeSideEffects, [
  'cloudRunServiceMutated',
  'cloudRunJobExecuted',
  'computeVmCreated',
  'quotaRequestCreated',
  'dockerRun',
  'modelImportRun',
  'modelInferenceRun',
  'generatedVideoCreated',
  'generatedAssetsCreated',
  'providerCallsMade',
  'workersDispatched',
  'supabaseTouched',
  'sqlExecuted',
  'storageObjectsCreated',
  'signedUrlsCreated',
  'publicArtifactsCreated',
  'creditMutationCreated',
  'betaUnlocked',
  'productionUnlocked',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
])
assert.equal(result.nextExternalAgentAction, QWEN_COMMAND)
assert.equal(
  result.brollNextManualAction,
  'AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-USER: request GPUS_ALL_REGIONS quota increase to 1 in Google Cloud Console, no repo changes',
)

const forbiddenFindings = scanForbiddenValues({ doc, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      qwenLivePreflightPassed: result.readOnlyResult.qwenLivePreflightPassed,
      executionAllowedNow: result.readOnlyResult.executionAllowedNow,
      brollQuotaSufficientForOneL4Vm: result.readOnlyResult.brollQuotaSufficientForOneL4Vm,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextExternalAgentAction: result.nextExternalAgentAction,
    },
    null,
    2,
  ),
)
