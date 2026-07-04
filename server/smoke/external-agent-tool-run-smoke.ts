import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CLI_PATH = 'server/cli/external-agent-tool-run.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-run-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-run'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-run'

type JsonRecord = Record<string, unknown>

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function asRecord(value: unknown, label: string): JsonRecord {
  assert.equal(typeof value, 'object', `${label} must be an object`)
  assert.notEqual(value, null, `${label} must not be null`)
  assert.equal(Array.isArray(value), false, `${label} must not be an array`)
  return value as JsonRecord
}

function asArray(value: unknown, label: string): unknown[] {
  assert.equal(Array.isArray(value), true, `${label} must be an array`)
  return value as unknown[]
}

function assertRuntimeFlagsFalse(value: unknown, label: string): void {
  const flags = asRecord(value, label)
  for (const [key, flagValue] of Object.entries(flags)) {
    assert.equal(flagValue, false, `${label}.${key} must remain false`)
  }
}

function scanForbiddenValues(value: unknown, prefix = 'externalAgentToolRun'): string[] {
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
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['raw provider prompt field', /\braw[_-]?provider[_-]?prompt\b/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['Supabase project URL', /https:\/\/[a-z0-9]{20}\.supabase\.co/i],
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

function runTool(args: string[]): JsonRecord {
  const output = execFileSync('npx', ['tsx', CLI_PATH, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 80,
  })

  return JSON.parse(output) as JsonRecord
}

function assertSafeResult(result: JsonRecord, toolId: string, runtimeKind: string, expectedMode: string): void {
  assert.equal(result.ok, true, `${toolId} safe runner result must be structurally ok`)
  assert.equal(result.mode, 'external_agent_tool_run_result')
  assert.equal(result.decision, 'external_agent_tool_run_completed_runtime_still_blocked')
  assert.equal(result.toolId, toolId)
  assert.equal(result.requestedMode, 'safe')
  assert.equal(result.agentCallableNow, true)
  assert.equal(result.runtimeExecutableNow, false)
  assert.equal(result.runtimeKind, runtimeKind)
  assert.equal(result.safeModeExecuted, true)
  assert.equal(result.childExecuted, true)
  assert.equal(result.childProcessExitedCleanly, true)
  assert.equal(result.structuredResultReturned, true)
  assert.equal(result.expectedMode, expectedMode)
  assert.equal(result.actualMode, expectedMode)
  assert.equal(result.expectedModeReturned, true)
  assert.equal(result.runtimeSideEffectsAllFalse, true)
  assert.equal(result.runtimeSideEffectsAllFalseRequired, true)
  assert.equal(result.generatedLocalFixturePassedClaimed, false)
  assertRuntimeFlagsFalse(result.runtimeSideEffects, `${toolId}.runtimeSideEffects`)
}

function rowByTool(rows: unknown, toolId: string): JsonRecord {
  const row = asArray(rows, 'tools').find((candidate) => asRecord(candidate, 'tools row').toolId === toolId)
  assert.notEqual(row, undefined, `Missing batch row for ${toolId}`)
  return asRecord(row, `tools.${toolId}`)
}

for (const file of [CLI_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-run.ts',
  'package external-agent-tool-run script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-run-smoke.ts',
  'package external-agent-tool-run smoke script mismatch',
)

const cliSource = read(CLI_PATH)
for (const required of [
  'external_agent_tool_run_result',
  'external_agent_tool_run_manifest',
  'external_agent_tool_run_batch_result',
  'external_agent_tool_run_batch_runtime_blocked',
  'external_agent_tool_run_runtime_blocked',
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
  'sound_music_audio',
  'supabase_local_fixture_harness',
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW',
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW',
  '--preflight-only',
  'runtimeExecutableNow: false',
  'external-agent-gcloud-account-access-diagnostic.ts',
  'manifestAliases',
  'runtimeSideEffectAliases',
  'booleanAtAnyDepth',
  'booleanInRuntimeSideEffectsAtAnyDepth',
  'cpuCallerJobExecuted',
  'temporaryFixtureInferenceServiceRevisionDeployed',
  'gcpMutatingCommandsExecuted',
  'computeVmCreateAttempted',
  'cleanupRun',
  'cleanupVerified',
  'inferenceRun',
  'runtimeGateChecked',
  'runRuntimeTool',
  "requested !== 'auto'",
  "raw === 'all'",
]) {
  assert.equal(cliSource.includes(required), true, `runner source missing ${required}`)
}

for (const forbidden of [
  'instances create',
  'jobs execute',
  'supabase start',
  'docker run',
  'psql ',
  'createdb',
  'dropdb',
  'from_pretrained',
  'WanPipeline',
  'torch.',
]) {
  assert.equal(cliSource.includes(forbidden), false, `runner must not include runtime marker: ${forbidden}`)
}

const manifest = runTool(['--manifest'])
assert.equal(manifest.ok, true)
assert.equal(manifest.mode, 'external_agent_tool_run_manifest')
assert.equal(manifest.status, 'manifest_only')
assert.equal(manifest.childExecuted, false)
assert.equal(manifest.liveDiagnosticsRun, false)
assert.equal(manifest.agentCallableNow, true)
assert.equal(manifest.runtimeExecutableNow, false)
assert.equal(manifest.externalAgentCallableToolCount, 4)
assert.equal(manifest.runtimeExecutableToolCount, 0)
assert.deepEqual(manifest.supportedToolIds, [
  'all',
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
  'sound_music_audio',
  'supabase_local_fixture_harness',
])
assert.deepEqual(manifest.supportedModes, ['safe', 'preflight', 'evidence', 'runtime'])
assert.deepEqual(manifest.manifestAliases, ['--manifest', '--list', '--list-tools'])
const manifestBatchCommands = asRecord(manifest.batchCommands, 'manifest.batchCommands')
assert.equal(
  manifestBatchCommands.safe,
  'npm run external-agent-tool-run -- --tool all --mode safe --account-index auto',
)
assert.equal(
  manifestBatchCommands.runtimeGuard,
  'npm run external-agent-tool-run -- --tool all --mode runtime',
)
assert.equal(manifest.runtimeSideEffectsAllFalse, true)
assertRuntimeFlagsFalse(manifest.runtimeSideEffects, 'manifest.runtimeSideEffects')
for (const toolId of [
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
  'sound_music_audio',
  'supabase_local_fixture_harness',
]) {
  const tool = rowByTool(manifest.tools, toolId)
  assert.equal(tool.agentCallableNow, true)
  assert.equal(tool.runtimeExecutableNow, false)
  assert.equal(tool.runtimeExecutionRequiresLiveGate, true)
  assert.equal(tool.runtimeSideEffectsAllFalseRequired, true)
  assert.equal(
    tool.safeCommand,
    `npm run external-agent-tool-run -- --tool ${toolId} --mode safe`,
  )
  assert.equal(
    tool.runtimeGuardCommand,
    `npm run external-agent-tool-run -- --tool ${toolId} --mode runtime`,
  )
}
assert.equal(
  rowByTool(manifest.tools, 'qwen2_5_vl_7b_instruct').runtimeDelegationCommand,
  'npm run external-agent-tool-execute-qwen -- --execute --json',
)
assert.equal(
  rowByTool(manifest.tools, 'qwen2_5_vl_7b_instruct').runtimeConfirmationEnv,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION',
)
assert.equal(
  rowByTool(manifest.tools, 'ai_video_broll_generation_wan').runtimeDelegationCommand,
  'npm run external-agent-tool-execute-broll-wan -- --inference-proof --execute --json',
)
assert.equal(
  rowByTool(manifest.tools, 'ai_video_broll_generation_wan').runtimeConfirmationEnv,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF',
)
assert.deepEqual(
  asArray(
    rowByTool(manifest.tools, 'qwen2_5_vl_7b_instruct').missingReadPermissionsWhenBlocked,
    'manifest qwen permissions',
  ).map((permission) => asRecord(permission, 'manifest qwen permission').permission),
  ['run.services.get', 'run.jobs.get'],
)
assert.deepEqual(
  asArray(
    rowByTool(manifest.tools, 'ai_video_broll_generation_wan').missingReadPermissionsWhenBlocked,
    'manifest broll permissions',
  ).map((permission) => asRecord(permission, 'manifest broll permission').permission),
  ['compute.projects.get', 'compute.regions.get'],
)

const qwen = runTool([
  '--tool',
  'qwen2_5_vl_7b_instruct',
  '--mode',
  'safe',
  '--account-index',
  '2',
])
assertSafeResult(qwen, 'qwen2_5_vl_7b_instruct', 'preflight_only', 'external_agent_qwen_execution_preflight_only_result')
assert.equal(qwen.preflightOnly, true)
assert.equal(qwen.safeEvidenceReviewRun, false)

const qwenAuto = runTool([
  '--tool',
  'qwen2_5_vl_7b_instruct',
  '--mode',
  'safe',
  '--account-index',
  'auto',
])
assertSafeResult(
  qwenAuto,
  'qwen2_5_vl_7b_instruct',
  'preflight_only',
  'external_agent_qwen_execution_preflight_only_result',
)
assert.equal(qwenAuto.accountIndexAutoRequested, true)
assert.equal(qwenAuto.autoAccountSelectionRun, true)
assert.equal(asRecord(qwenAuto.autoAccountSelection, 'qwenAuto.autoAccountSelection').requested, 'auto')
assert.equal(
  ['tool_ready', 'token_refresh_only_fallback'].includes(
    String(asRecord(qwenAuto.autoAccountSelection, 'qwenAuto.autoAccountSelection').selectedAccountCandidateKind),
  ),
  true,
)
assert.equal(qwenAuto.preflightOnly, true)
assert.equal(qwenAuto.safeEvidenceReviewRun, false)
assert.equal(
  ['gcloud_account_lacks_qwen_cloud_run_read_access_or_resources_missing', undefined].includes(
    qwenAuto.primaryBlocker as string | undefined,
  ),
  true,
)
if (qwenAuto.gcpOwnerRepairRequired === true) {
  assert.equal(qwenAuto.primaryBlocker, 'gcloud_account_lacks_qwen_cloud_run_read_access_or_resources_missing')
  assert.deepEqual(
    asArray(qwenAuto.missingReadPermissions, 'qwenAuto.missingReadPermissions').map(
      (permission) => asRecord(permission, 'qwenAuto permission').permission,
    ),
    ['run.services.get', 'run.jobs.get'],
  )
  assert.equal(asArray(qwenAuto.likelyMinimalRoles, 'qwenAuto.likelyMinimalRoles').includes('roles/run.viewer'), true)
}

const broll = runTool([
  '--tool',
  'ai_video_broll_generation_wan',
  '--mode',
  'safe',
  '--account-index',
  '2',
])
assertSafeResult(
  broll,
  'ai_video_broll_generation_wan',
  'preflight_only',
  'external_agent_broll_wan_execution_preflight_only_result',
)
assert.equal(broll.preflightOnly, true)
assert.equal(broll.safeEvidenceReviewRun, false)
if (broll.gcpOwnerRepairRequired === true) {
  assert.equal(broll.primaryBlocker, 'gcloud_account_lacks_compute_quota_read_access')
  assert.deepEqual(
    asArray(broll.missingReadPermissions, 'broll.missingReadPermissions').map(
      (permission) => asRecord(permission, 'broll permission').permission,
    ),
    ['compute.projects.get', 'compute.regions.get'],
  )
  assert.equal(asArray(broll.likelyMinimalRoles, 'broll.likelyMinimalRoles').includes('roles/compute.viewer'), true)
}

const sound = runTool([
  '--tool',
  'sound_music_audio',
  '--mode',
  'safe',
  '--account-index',
  '2',
])
assertSafeResult(
  sound,
  'sound_music_audio',
  'safe_evidence_only',
  'external_agent_sound_execution_evidence_review_result',
)
assert.equal(sound.preflightOnly, false)
assert.equal(sound.safeEvidenceReviewRun, true)
assert.equal(sound.confirmationEnvInjected, true)

const supabaseHarness = runTool([
  '--tool',
  'supabase_local_fixture_harness',
  '--mode',
  'safe',
  '--account-index',
  '2',
])
assertSafeResult(
  supabaseHarness,
  'supabase_local_fixture_harness',
  'safe_evidence_only',
  'external_agent_supabase_harness_execution_evidence_review_result',
)
assert.equal(supabaseHarness.preflightOnly, false)
assert.equal(supabaseHarness.safeEvidenceReviewRun, true)
assert.equal(supabaseHarness.confirmationEnvInjected, true)

const batch = runTool([
  '--tool',
  'all',
  '--mode',
  'safe',
  '--account-index',
  'auto',
])
assert.equal(batch.ok, true)
assert.equal(batch.mode, 'external_agent_tool_run_batch_result')
assert.equal(batch.decision, 'external_agent_tool_run_batch_completed_runtime_still_blocked')
assert.equal(batch.toolId, 'all')
assert.equal(batch.requestedMode, 'safe')
assert.equal(batch.agentCallableNow, true)
assert.equal(batch.runtimeExecutableNow, false)
assert.equal(batch.externalAgentCallableToolCount, 4)
assert.equal(batch.runtimeExecutableToolCount, 0)
assert.deepEqual(batch.preflightCallableToolIds, [
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
])
assert.deepEqual(batch.safeEvidenceExecutableToolIds, [
  'sound_music_audio',
  'supabase_local_fixture_harness',
])
assert.equal(batch.allStructuredResultsReturned, true)
assert.equal(batch.allExpectedModesReturned, true)
assert.equal(batch.runtimeSideEffectsAllFalse, true)
assertRuntimeFlagsFalse(batch.runtimeSideEffects, 'batch.runtimeSideEffects')
assertSafeResult(
  rowByTool(batch.tools, 'qwen2_5_vl_7b_instruct'),
  'qwen2_5_vl_7b_instruct',
  'preflight_only',
  'external_agent_qwen_execution_preflight_only_result',
)
assertSafeResult(
  rowByTool(batch.tools, 'ai_video_broll_generation_wan'),
  'ai_video_broll_generation_wan',
  'preflight_only',
  'external_agent_broll_wan_execution_preflight_only_result',
)
assertSafeResult(
  rowByTool(batch.tools, 'sound_music_audio'),
  'sound_music_audio',
  'safe_evidence_only',
  'external_agent_sound_execution_evidence_review_result',
)
assertSafeResult(
  rowByTool(batch.tools, 'supabase_local_fixture_harness'),
  'supabase_local_fixture_harness',
  'safe_evidence_only',
  'external_agent_supabase_harness_execution_evidence_review_result',
)

const runtimeBlocked = runTool([
  '--tool',
  'qwen2_5_vl_7b_instruct',
  '--mode',
  'runtime',
  '--account-index',
  '2',
])
assert.equal(runtimeBlocked.ok, false)
assert.equal(runtimeBlocked.mode, 'external_agent_tool_run_runtime_blocked')
assert.equal(runtimeBlocked.status, 'blocked')
assert.equal(runtimeBlocked.toolId, 'qwen2_5_vl_7b_instruct')
assert.equal(runtimeBlocked.requestedMode, 'runtime')
assert.equal(runtimeBlocked.agentCallableNow, true)
assert.equal(runtimeBlocked.runtimeExecutableNow, false)
assert.equal(runtimeBlocked.blocker, 'runtime_execution_not_allowed_by_current_gate')
assert.equal(runtimeBlocked.runtimeGateChecked, true)
assert.equal(runtimeBlocked.childExecuted, false)
assert.equal(asRecord(runtimeBlocked.liveGate, 'runtimeBlocked.liveGate').executionAllowedNow, false)
assert.equal(asRecord(runtimeBlocked.nextCommand, 'runtimeBlocked.nextCommand').executionAllowedNow, false)
assert.equal(runtimeBlocked.runtimeDelegatedCommand, 'npm run external-agent-tool-execute-qwen -- --execute --json --account-index 2')
assert.equal(
  asArray(runtimeBlocked.blockers, 'runtimeBlocked.blockers').includes(
    'live_execution_gate_execution_allowed_now_false',
  ),
  true,
)
assertRuntimeFlagsFalse(runtimeBlocked.runtimeSideEffects, 'runtimeBlocked.runtimeSideEffects')

const brollRuntimeBlocked = runTool([
  '--tool',
  'ai_video_broll_generation_wan',
  '--mode',
  'runtime',
  '--account-index',
  '2',
])
assert.equal(brollRuntimeBlocked.ok, false)
assert.equal(brollRuntimeBlocked.mode, 'external_agent_tool_run_runtime_blocked')
assert.equal(brollRuntimeBlocked.status, 'blocked')
assert.equal(brollRuntimeBlocked.toolId, 'ai_video_broll_generation_wan')
assert.equal(brollRuntimeBlocked.requestedMode, 'runtime')
assert.equal(brollRuntimeBlocked.agentCallableNow, true)
assert.equal(brollRuntimeBlocked.runtimeExecutableNow, false)
assert.equal(brollRuntimeBlocked.runtimeGateChecked, true)
assert.equal(brollRuntimeBlocked.childExecuted, false)
assert.equal(
  brollRuntimeBlocked.runtimeDelegatedCommand,
  'npm run external-agent-tool-execute-broll-wan -- --inference-proof --execute --json --account-index 2',
)
assert.equal(
  asRecord(brollRuntimeBlocked.nextCommand, 'brollRuntimeBlocked.nextCommand')
    .brollWanInferenceProofExecutionAllowedNow,
  false,
)
assert.equal(
  asArray(brollRuntimeBlocked.blockers, 'brollRuntimeBlocked.blockers').includes(
    'broll_inference_runtime_command_not_allowed_now',
  ),
  true,
)
assertRuntimeFlagsFalse(brollRuntimeBlocked.runtimeSideEffects, 'brollRuntimeBlocked.runtimeSideEffects')

const batchRuntimeBlocked = runTool([
  '--tool',
  'all',
  '--mode',
  'runtime',
  '--account-index',
  '2',
])
assert.equal(batchRuntimeBlocked.ok, false)
assert.equal(batchRuntimeBlocked.mode, 'external_agent_tool_run_batch_runtime_blocked')
assert.equal(batchRuntimeBlocked.status, 'blocked')
assert.equal(batchRuntimeBlocked.toolId, 'all')
assert.equal(batchRuntimeBlocked.requestedMode, 'runtime')
assert.equal(batchRuntimeBlocked.agentCallableNow, true)
assert.equal(batchRuntimeBlocked.runtimeExecutableNow, false)
assert.equal(batchRuntimeBlocked.externalAgentCallableToolCount, 4)
assert.equal(batchRuntimeBlocked.runtimeExecutableToolCount, 0)
assert.equal(batchRuntimeBlocked.childExecuted, false)
assertRuntimeFlagsFalse(batchRuntimeBlocked.runtimeSideEffects, 'batchRuntimeBlocked.runtimeSideEffects')
for (const row of asArray(batchRuntimeBlocked.tools, 'batchRuntimeBlocked.tools')) {
  const tool = asRecord(row, 'batchRuntimeBlocked row')
  assert.equal(tool.agentCallableNow, true)
  assert.equal(tool.runtimeExecutableNow, false)
  assert.equal(tool.blocker, 'runtime_execution_not_allowed_by_current_gate')
  assert.equal(tool.childExecuted, false)
  assertRuntimeFlagsFalse(tool.runtimeSideEffects, `batchRuntimeBlocked.${tool.toolId}.runtimeSideEffects`)
}

const invalidTool = runTool(['--tool', 'unknown_tool', '--mode', 'safe'])
assert.equal(invalidTool.ok, false)
assert.equal(invalidTool.mode, 'external_agent_tool_run_blocked')
assert.equal(invalidTool.status, 'blocked')
assert.equal(invalidTool.agentCallableNow, false)
assert.equal(invalidTool.runtimeExecutableNow, false)
assert.equal(invalidTool.blocker, 'missing_or_invalid_tool_id')
assert.equal(invalidTool.childExecuted, false)
assertRuntimeFlagsFalse(invalidTool.runtimeSideEffects, 'invalidTool.runtimeSideEffects')

const forbiddenFindings = scanForbiddenValues([
  qwen,
  qwenAuto,
  broll,
  sound,
  supabaseHarness,
  manifest,
  batch,
  runtimeBlocked,
  brollRuntimeBlocked,
  batchRuntimeBlocked,
  invalidTool,
])
assert.deepEqual(forbiddenFindings, [])

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'external_agent_tool_run_smoke',
      checkedToolIds: [
        qwen.toolId,
        broll.toolId,
        sound.toolId,
        supabaseHarness.toolId,
      ],
      batchToolCount: batch.externalAgentCallableToolCount,
      autoAccountSelectionRun: qwenAuto.autoAccountSelectionRun,
      externalAgentCallableToolCount: 4,
      runtimeExecutableToolCount: 0,
      manifestMode: manifest.mode,
      runtimeModeBlocked: runtimeBlocked.blocker,
      invalidToolBlocked: invalidTool.blocker,
      runtimeSideEffectsAllFalse: true,
    },
    null,
    2,
  ),
)
