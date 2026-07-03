import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10T_IAP_SSH_FLAG_FIX_RESULT,
  AI_VIDEO_BROLL_GEN_10U_NO_GPU_IAP_SSH_CANARY_RERUN_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10t-iap-ssh-flag-fix-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10t-iap-ssh-flag-fix-result.md'
const PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-10t-iap-ssh-flag-fix-result.ts'
const RUNNER_PATH = 'server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts'
const RUNNER_SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-smoke.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10t-iap-ssh-flag-fix-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10t-iap-ssh-flag-fix-result'
const DECISION = 'ai_video_broll_gen_10t_iap_ssh_flag_fix_applied_no_execution'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10tFlagFix'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
      ['run.app URL', /\brun\.app\b/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service account email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.gserviceaccount\.com/i],
      ['plain email value', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
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

for (const file of [
  DOC_PATH,
  PROMPT_PATH,
  SPEC_PATH,
  RUNNER_PATH,
  RUNNER_SMOKE_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.md',
  'src/backend/mock/mock-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.ts',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10t-iap-ssh-flag-fix.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10t-iap-ssh-flag-fix-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
const runner = read(RUNNER_PATH)
const runnerSmoke = read(RUNNER_SMOKE_PATH)

for (const required of [
  DECISION,
  'The runner now keeps `--tunnel-through-iap` and removes `--internal-ip`',
  'argument --internal-ip: At most one of --internal-ip | --tunnel-through-iap can be specified',
  'not a proven OS Login, SSH-key, IAP firewall, or service-account access failure',
  'Runner combines mutually exclusive flags | `false`',
  'gcpMutatingCommandsExecutedByThisPrompt=false',
  'computeVmCreatedByThisPrompt=false',
  'sshSessionOpenedByThisPrompt=false',
  'modelInferenceRun=false',
  'generatedAssetsCreated=false',
  'generatedLocalFixturePassedClaimed=false',
  AI_VIDEO_BROLL_GEN_10U_NO_GPU_IAP_SSH_CANARY_RERUN_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10T result doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10U_NO_GPU_IAP_SSH_CANARY_RERUN_PROMPT,
  'Use the bounded runner only',
  'Use no GPU accelerator.',
  'Use no public IP.',
  'Delete only the prompt-scoped canary.',
  'Do not create a GPU VM.',
  'generatedLocalFixturePassedClaimed=false',
]) {
  assert.equal(prompt.includes(required), true, `10U prompt missing ${required}`)
}

assert.equal(runner.includes("'--tunnel-through-iap'"), true, 'runner must keep IAP tunneling')
assert.equal(runner.includes("'--internal-ip'"), false, 'runner must not pass --internal-ip with IAP tunneling')
assert.equal(runnerSmoke.includes("cli.includes(\"'--internal-ip'\")"), true, 'runner smoke must guard --internal-ip')

const result = AI_VIDEO_BROLL_GEN_10T_IAP_SSH_FLAG_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10t_iap_ssh_flag_fix_result')
assert.equal(result.workstream, 'AI_VIDEO_BROLL_GENERATION')
assert.equal(result.toolId, 'ai_video_broll_generation_wan')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.failureAnalysisFrom10S.rootCauseConfirmed, true)
assert.equal(
  result.failureAnalysisFrom10S.rootCause,
  'runner_used_mutually_exclusive_gcloud_compute_ssh_flags_internal_ip_and_tunnel_through_iap',
)
assert.equal(result.failureAnalysisFrom10S.notProvenFailures.includes('os_login_failure'), true)
assert.equal(result.failureAnalysisFrom10S.notProvenFailures.includes('iap_firewall_failure'), true)
assert.equal(result.runnerSshCommandContract.usesTunnelThroughIap, true)
assert.equal(result.runnerSshCommandContract.usesInternalIp, false)
assert.equal(result.runnerSshCommandContract.combinesTunnelThroughIapWithInternalIp, false)
assert.equal(result.runnerSshCommandContract.sshConnectTimeoutSeconds, 15)
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10U_NO_GPU_IAP_SSH_CANARY_RERUN_PROMPT)

for (const [flag, value] of Object.entries(result.runtimeSideEffects)) {
  if (
    [
      'runnerCliChanged',
      'runnerSmokeChanged',
      'resultDocCreated',
      'resultSpecCreated',
      'resultSmokeCreated',
    ].includes(flag)
  ) {
    assert.equal(value, true, `${flag} should record this no-execution code/doc fix`)
  } else {
    assert.equal(value, false, `${flag} must remain false`)
  }
}

const forbiddenFindings = scanForbiddenValues({ doc, prompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      runnerSshUsesTunnelThroughIap: result.runnerSshCommandContract.usesTunnelThroughIap,
      runnerSshUsesInternalIp: result.runnerSshCommandContract.usesInternalIp,
      combinesMutuallyExclusiveFlags: result.runnerSshCommandContract.combinesTunnelThroughIapWithInternalIp,
      computeVmCreatedByThisPrompt: result.runtimeSideEffects.computeVmCreatedByThisPrompt,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
