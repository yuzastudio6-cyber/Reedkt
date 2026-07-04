import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CLI_PATH = 'server/cli/external-agent-tool-callability-proof.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-callability-proof-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-callability-proof'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-callability-proof'

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

function rowByTool(rows: unknown, toolId: string): JsonRecord {
  const row = asArray(rows, 'wrapperCalls').find((candidate) => asRecord(candidate, 'wrapperCalls row').toolId === toolId)
  assert.notEqual(row, undefined, `Missing wrapper call row for ${toolId}`)
  return asRecord(row, `wrapperCalls.${toolId}`)
}

function assertRuntimeFlagsFalse(value: unknown, label: string): void {
  const flags = asRecord(value, label)
  for (const [key, flagValue] of Object.entries(flags)) {
    assert.equal(flagValue, false, `${label}.${key} must remain false`)
  }
}

function scanForbiddenValues(value: unknown, prefix = 'callabilityProof'): string[] {
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

for (const file of [CLI_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-callability-proof.ts',
  'package callability proof script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-callability-proof-smoke.ts',
  'package callability proof smoke script mismatch',
)

const cliSource = read(CLI_PATH)
assert.equal(cliSource.includes('--preflight-only'), true)
assert.equal(cliSource.includes('REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW'), true)
assert.equal(cliSource.includes('REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW'), true)
for (const forbidden of [
  'instances create',
  'jobs execute',
  'supabase start',
  'docker run',
  'psql ',
  'from_pretrained',
  'WanPipeline',
  'torch.',
]) {
  assert.equal(cliSource.includes(forbidden), false, `callability proof must not include runtime marker: ${forbidden}`)
}

const output = execFileSync('npx', ['tsx', CLI_PATH, '--account-index', '2'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 64,
})
const proof = JSON.parse(output) as JsonRecord

assert.equal(proof.ok, true)
assert.equal(proof.mode, 'external_agent_tool_callability_proof_result')
assert.equal(proof.decision, 'external_agent_tool_callability_proof_completed_runtime_still_blocked')
assert.equal(proof.accountIndex, 2)
assert.equal(proof.paidProductionInScope, false)
assert.equal(proof.dryRunPassedClaimed, false)
assert.equal(proof.generatedLocalFixturePassedClaimed, false)
assert.equal(proof.externalAgentCallableToolCount, 4)
assert.deepEqual(proof.externalAgentCallableToolIds, [
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
  'sound_music_audio',
  'supabase_local_fixture_harness',
])
assert.deepEqual(proof.preflightCallableToolIds, [
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
])
assert.deepEqual(proof.safeEvidenceExecutableToolIds, [
  'sound_music_audio',
  'supabase_local_fixture_harness',
])
assert.equal(proof.safeEvidenceExecutableToolCount, 2)
assert.equal(proof.runtimeExecutableToolCount, 0)
assert.deepEqual(proof.runtimeExecutableToolIds, [])
assert.equal(proof.readyForAnyExternalAgentRuntimeExecutionNow, false)
assert.equal(proof.allStructuredCallsReturned, true)
assert.equal(proof.allExpectedModesReturned, true)
assert.equal(proof.runtimeSideEffectsAllFalse, true)
assertRuntimeFlagsFalse(proof.runtimeSideEffects, 'proof.runtimeSideEffects')

const qwen = rowByTool(proof.wrapperCalls, 'qwen2_5_vl_7b_instruct')
assert.equal(qwen.runtimeKind, 'preflight_only')
assert.equal(qwen.expectedModeReturned, true)
assert.equal(qwen.processExitedCleanly, true)
assert.equal(qwen.structuredResultReturned, true)
assert.equal(qwen.runtimeSideEffectsAllFalse, true)
assertRuntimeFlagsFalse(qwen.runtimeSideEffects, 'qwen.runtimeSideEffects')

const broll = rowByTool(proof.wrapperCalls, 'ai_video_broll_generation_wan')
assert.equal(broll.runtimeKind, 'preflight_only')
assert.equal(broll.expectedModeReturned, true)
assert.equal(broll.processExitedCleanly, true)
assert.equal(broll.structuredResultReturned, true)
assert.equal(broll.runtimeSideEffectsAllFalse, true)
assertRuntimeFlagsFalse(broll.runtimeSideEffects, 'broll.runtimeSideEffects')

const sound = rowByTool(proof.wrapperCalls, 'sound_music_audio')
assert.equal(sound.runtimeKind, 'safe_evidence_only')
assert.equal(sound.expectedModeReturned, true)
assert.equal(sound.processExitedCleanly, true)
assert.equal(sound.structuredResultReturned, true)
assert.equal(sound.confirmationEnvInjected, true)
assert.equal(sound.safeEvidenceReviewRun, true)
assert.equal(sound.safeEvidenceReviewCompleted, true)
assert.equal(sound.runtimeSideEffectsAllFalse, true)
assertRuntimeFlagsFalse(sound.runtimeSideEffects, 'sound.runtimeSideEffects')

const supabaseHarness = rowByTool(proof.wrapperCalls, 'supabase_local_fixture_harness')
assert.equal(supabaseHarness.runtimeKind, 'safe_evidence_only')
assert.equal(supabaseHarness.expectedModeReturned, true)
assert.equal(supabaseHarness.processExitedCleanly, true)
assert.equal(supabaseHarness.structuredResultReturned, true)
assert.equal(supabaseHarness.confirmationEnvInjected, true)
assert.equal(supabaseHarness.safeEvidenceReviewRun, true)
assert.equal(supabaseHarness.safeEvidenceReviewCompleted, true)
assert.equal(supabaseHarness.runtimeSideEffectsAllFalse, true)
assertRuntimeFlagsFalse(supabaseHarness.runtimeSideEffects, 'supabaseHarness.runtimeSideEffects')

const forbiddenFindings = scanForbiddenValues(proof)
assert.deepEqual(forbiddenFindings, [])

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: proof.mode,
      externalAgentCallableToolCount: proof.externalAgentCallableToolCount,
      runtimeExecutableToolCount: proof.runtimeExecutableToolCount,
      preflightCallableToolIds: proof.preflightCallableToolIds,
      safeEvidenceExecutableToolIds: proof.safeEvidenceExecutableToolIds,
      runtimeSideEffectsAllFalse: proof.runtimeSideEffectsAllFalse,
      recommendedNextCommand: proof.recommendedIndexedNextCommand,
    },
    null,
    2,
  ),
)
