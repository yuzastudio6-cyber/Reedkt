import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT,
  buildNoExecutionRunnerContractSummary,
  parseRawGcloudJson,
  sanitizeGcloudOutputForSummary,
  shouldAttemptExactNameCleanup,
} from '../cli/ai-video-broll-gen-10y-l4-payload-install-runner-contract'
import { AI_VIDEO_BROLL_GEN_10Y_RUNNER_RAW_JSON_CLEANUP_FIX_RESULT } from '../../src/backend/mock/mock-ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result'
import { AI_VIDEO_BROLL_GEN_10Z_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_AFTER_RUNNER_FIX_PROMPT } from '../../src/backend/mock/mock-ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result'
import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'
import { EXTERNAL_AGENT_TOOL_EXECUTION_GATE } from '../../src/backend/mock/mock-external-agent-tool-execution-gate'
import { AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC } from '../../src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness'
import { AI_VIDEO_BROLL_WAN_GPU_GLOBAL_QUOTA_VERIFY_RESULT } from '../../src/backend/mock/mock-ai-video-broll-wan-gpu-global-quota-verify-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result.md'
const PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10y-runner-raw-json-cleanup-fix.md'
const NEXT_PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix.md'
const SPEC_PATH =
  'src/backend/mock/mock-ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result.ts'
const RUNNER_CONTRACT_PATH =
  'server/cli/ai-video-broll-gen-10y-l4-payload-install-runner-contract.ts'
const SMOKE_PATH =
  'server/smoke/ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result'
const DECISION =
  'ai_video_broll_gen_10y_runner_raw_json_cleanup_fix_applied_no_execution_10z_retry_ready'
const HISTORICAL_10Y_BLOCKER = 'broll_10z_no_idle_l4_payload_install_retry_after_runner_fix_required'
const CURRENT_ROLLUP_BLOCKER =
  'broll_private_gcs_model_cache_staging_blocked_local_upload_stalled_private_url_list_403'
const CURRENT_ROLLUP_NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-11E-CLOUD-SIDE-CACHE-STAGING-RUNNER: implement no-GPU Wan private cache staging runner, no inference/no generated video'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10yResult'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
      ['run.app URL', /\brun\.app\b/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service account email value', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.gserviceaccount\.com/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['private key value', /\bprivate[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['ssh public key material', /\bssh-(rsa|ed25519)\s+[A-Za-z0-9+/=]{40,}/i],
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

function assertFalseRuntimeFlags(flags: Record<string, boolean>, label: string) {
  for (const [key, value] of Object.entries(flags)) {
    assert.equal(value, false, `${label}.${key} must remain false`)
  }
}

for (const file of [
  DOC_PATH,
  PROMPT_PATH,
  NEXT_PROMPT_PATH,
  SPEC_PATH,
  RUNNER_CONTRACT_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result.md',
  'docs/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.md',
  'docs/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.md',
  'docs/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.md',
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'docs/ai-video-broll-wan-gpu-global-quota-verify-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
const nextPrompt = read(NEXT_PROMPT_PATH)
const runnerContractSource = read(RUNNER_CONTRACT_PATH)
const rollupDoc = read('docs/external-agent-tool-execution-readiness-rollup.md')
const quotaDoc = read('docs/ai-video-broll-wan-gpu-global-quota-verify-result.md')

for (const required of [
  DECISION,
  'runner_fix_applied_no_execution',
  'The failure was not a GPU capacity failure and not a model failure.',
  'parsed sanitized/truncated `describe` output instead of raw command stdout',
  'Parse raw command stdout before sanitizing or truncating summaries.',
  'Never make machine-state decisions from sanitized summaries.',
  '`json(status,networkInterfaces,disks)`',
  'Represent `value(name,status)` as argv',
  'Delete exact prompt VM after any create attempt',
  'Verify exact-name absence for instance, disk, address, and reservation.',
  'This is how we prevent the same failure from repeating.',
  'computeVmCreated=false',
  'modelInferenceRun=false',
  'generatedLocalFixturePassedClaimed=false',
  HISTORICAL_10Y_BLOCKER,
  AI_VIDEO_BROLL_GEN_10Z_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_AFTER_RUNNER_FIX_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10Y result doc missing ${required}`)
}

for (const required of [
  'This prompt must not create a VM',
  'Parse raw command stdout before sanitizing or truncating summaries.',
  'Never make machine-state decisions from `stdoutSummary`',
  'cleanup must attempt exact-name delete',
  AI_VIDEO_BROLL_GEN_10Z_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_AFTER_RUNNER_FIX_PROMPT,
]) {
  assert.equal(prompt.includes(required), true, `10Y prompt missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10Z_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_AFTER_RUNNER_FIX_PROMPT,
  'Use the source-controlled 10Y runner contract.',
  'Parse raw `gcloud` JSON stdout before sanitizing or truncating log summaries.',
  'Never parse `stdoutSummary` or `stderrSummary` for machine state.',
  'If create is attempted, cleanup must attempt exact-name delete even if describe parsing fails.',
  'model import',
  'model inference',
  'AI-VIDEO-BROLL-GEN-11A-MODEL-IMPORT-PLAN',
]) {
  assert.equal(nextPrompt.includes(required), true, `10Z prompt missing ${required}`)
}

for (const required of [
  'parseRawGcloudJson',
  'sanitizeGcloudOutputForSummary',
  'shouldAttemptExactNameCleanup',
  '--format=json(status,networkInterfaces,disks)',
  '--format=value(name,status)',
  'delete_prompt_scoped_vm_exact_name',
  'verify_prompt_vm_absent_exact_name',
  'verify_prompt_disk_absent_exact_name',
  'verify_prompt_address_absent_exact_name',
  'verify_prompt_reservation_absent_exact_name',
  'executedByThisPrompt: false',
  "machineStateDecisionInput: 'rawStdout'",
  "machineStateDecisionInput: 'exitCodeOnly'",
]) {
  assert.equal(runnerContractSource.includes(required), true, `runner contract missing ${required}`)
}

for (const forbidden of ['spawnSync(', 'execSync(', "from 'node:child_process'", 'gcloud compute']) {
  assert.equal(
    runnerContractSource.includes(forbidden),
    false,
    `runner contract must not execute shell commands in 10Y: ${forbidden}`,
  )
}

const parsed = parseRawGcloudJson<{ status: string; disks: Array<{ boot: boolean }> }>(
  '{"status":"RUNNING","disks":[{"boot":true}]}',
)
assert.equal(parsed.status, 'RUNNING')
assert.deepEqual(parsed.disks, [{ boot: true }])
assert.equal(sanitizeGcloudOutputForSummary('hello'), 'hello')
assert.equal(shouldAttemptExactNameCleanup({
  computeVmCreateAttempted: true,
  computeVmCreated: false,
  createCommandExitCode: null,
}), true)
assert.equal(shouldAttemptExactNameCleanup({
  computeVmCreateAttempted: false,
  computeVmCreated: true,
  createCommandExitCode: null,
}), true)
assert.equal(shouldAttemptExactNameCleanup({
  computeVmCreateAttempted: false,
  computeVmCreated: false,
  createCommandExitCode: 0,
}), true)
assert.equal(shouldAttemptExactNameCleanup({
  computeVmCreateAttempted: false,
  computeVmCreated: false,
  createCommandExitCode: 1,
}), false)

const runnerContract = AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT
assert.equal(runnerContract.runnerFix.rawStdoutIsOnlyJsonParseInput, true)
assert.equal(runnerContract.runnerFix.stdoutSummaryIsLogOnly, true)
assert.equal(runnerContract.runnerFix.machineStateFromSanitizedSummaryAllowed, false)
assert.equal(runnerContract.runnerFix.cleanupIndependentOfDescribeParse, true)
assert.equal(runnerContract.runnerFix.exactAbsenceChecksRequired, true)
assert.equal(
  runnerContract.postCreateProbeCommands.some((command) =>
    command.args.includes('--format=json(status,networkInterfaces,disks)'),
  ),
  true,
)
assert.equal(
  runnerContract.postCreateProbeCommands.some((command) =>
    command.args.includes('--format=value(name,status)'),
  ),
  true,
)
assert.equal(
  runnerContract.cleanupCommands.filter((command) => command.id.startsWith('verify_')).length,
  4,
)
assertFalseRuntimeFlags(runnerContract.runtimeSideEffects, 'runnerContract.runtimeSideEffects')

const contractSummary = buildNoExecutionRunnerContractSummary()
assert.equal(contractSummary.ok, true)
assert.equal(contractSummary.machineStateFromSanitizedSummaryAllowed, false)
assert.equal(contractSummary.exactAbsenceCheckCount, 4)

const result = AI_VIDEO_BROLL_GEN_10Y_RUNNER_RAW_JSON_CLEANUP_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.failureRepaired.previousFailureClass, 'local_runner_sanitized_describe_parse_cleanup_bug')
assert.equal(result.runnerFix.rawStdoutIsOnlyJsonParseInput, true)
assert.equal(result.runnerFix.stdoutSummaryIsLogOnly, true)
assert.equal(result.runnerFix.stderrSummaryIsLogOnly, true)
assert.equal(result.runnerFix.machineStateFromSanitizedSummaryAllowed, false)
assert.equal(result.runnerFix.cleanupIndependentOfDescribeParse, true)
assert.equal(result.runnerFix.shellFormatQuotingBugAvoidedByArgArrays, true)
assert.equal(result.runtimeAttempt.vmCreateAttemptedBy10y, false)
assert.equal(result.readyForBroll10zNoIdleL4PayloadInstallRetryAfterRunnerFixPrompt, true)
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10Z_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_AFTER_RUNNER_FIX_PROMPT)
assertFalseRuntimeFlags(result.runtimeSideEffects, 'result.runtimeSideEffects')

const brollRollup = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.tools.find(
  (tool) => tool.toolId === 'ai_video_broll_generation_wan',
)
assert.equal(EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.recommendedNextPrompt, CURRENT_ROLLUP_NEXT_PROMPT)
assert.equal(brollRollup?.primaryBlocker, CURRENT_ROLLUP_BLOCKER)
assert.equal(brollRollup?.nextAction, CURRENT_ROLLUP_NEXT_PROMPT)
assert.equal(
  brollRollup?.noIdleLifecycleGate?.nextActionAfterQuotaClears,
  CURRENT_ROLLUP_NEXT_PROMPT,
)
assert.equal(
  EXTERNAL_AGENT_TOOL_EXECUTION_GATE.brollRecommendedNextPrompt,
  CURRENT_ROLLUP_NEXT_PROMPT,
)
assert.equal(AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC.readyForBroll10yRunnerRawJsonCleanupFixPrompt, false)
assert.equal(
  AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC.readyForBroll10zNoIdleL4PayloadInstallRetryAfterRunnerFixPrompt,
  true,
)
assert.equal(
  AI_VIDEO_BROLL_WAN_GPU_GLOBAL_QUOTA_VERIFY_RESULT.readyForBroll10yRunnerRawJsonCleanupFixPrompt,
  false,
)
assert.equal(
  AI_VIDEO_BROLL_WAN_GPU_GLOBAL_QUOTA_VERIFY_RESULT.readyForBroll10zNoIdleL4PayloadInstallRetryAfterRunnerFixPrompt,
  true,
)

for (const required of [
  'docs/ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result.md',
  CURRENT_ROLLUP_BLOCKER,
  CURRENT_ROLLUP_NEXT_PROMPT,
]) {
  assert.equal(rollupDoc.includes(required), true, `rollup doc missing ${required}`)
}

const forbiddenFindings = scanForbiddenValues({
  doc,
  prompt,
  nextPrompt,
  runnerContract,
  result,
  rollupDoc,
  quotaDoc,
})
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      previousFailureClass: result.failureRepaired.previousFailureClass,
      rawStdoutIsOnlyJsonParseInput: result.runnerFix.rawStdoutIsOnlyJsonParseInput,
      machineStateFromSanitizedSummaryAllowed:
        result.runnerFix.machineStateFromSanitizedSummaryAllowed,
      exactAbsenceChecksRequired: result.runnerFix.exactAbsenceChecksRequired,
      runtimeSideEffects: result.runtimeSideEffects,
      activeBlocker: CURRENT_ROLLUP_BLOCKER,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
