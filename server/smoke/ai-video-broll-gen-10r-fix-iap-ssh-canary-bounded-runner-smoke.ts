import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER,
  AI_VIDEO_BROLL_GEN_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_EXECUTE_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-result.md'
const NEXT_PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-execute.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner.ts'
const CLI_PATH = 'server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-smoke.ts'
const PACKAGE_SCRIPT = 'ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner'
const SMOKE_SCRIPT = 'smoke:ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner'
const DECISION =
  'ai_video_broll_gen_10r_fix_iap_ssh_canary_bounded_runner_packet_ready_no_execution'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10rFixRunner'): string[] {
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
  NEXT_PROMPT_PATH,
  SPEC_PATH,
  CLI_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts',
  'package runner script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-smoke.ts',
  'package runner smoke script mismatch',
)

const doc = read(DOC_PATH)
const nextPrompt = read(NEXT_PROMPT_PATH)
const cli = read(CLI_PATH)
for (const required of [
  DECISION,
  'Runner CLI: `server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts`',
  'Default mode creates resources | `false`',
  'Future execute mode requires confirmation | `true`',
  'SSH attempt hard timeout | `45000` ms',
  'Durable summary after each SSH attempt | `true`',
  'runnerExecutedByThisPrompt=false',
  'computeVmCreatedByThisPrompt=false',
  'sshSessionOpenedByThisPrompt=false',
  'generatedLocalFixturePassedClaimed=false',
  AI_VIDEO_BROLL_GEN_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_EXECUTE_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10R fix result doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_EXECUTE_PROMPT,
  'Run only `npm run ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner -- --execute --json`',
  'Use no GPU accelerator.',
  'Use no public IP.',
  'Persist the sanitized summary after each phase.',
  'Verify instance, disk, address, and reservation absence before completion.',
  'generatedLocalFixturePassedClaimed=false',
]) {
  assert.equal(nextPrompt.includes(required), true, `10S prompt missing ${required}`)
}

for (const required of [
  'spawnSync',
  'timeout: timeoutMs',
  'writeDurableSummary',
  'REEDITPRO_CONFIRM_BROLL_10R_IAP_SSH_CANARY',
  'REEDITPRO_BROLL_PROOF_SERVICE_ACCOUNT_EMAIL',
  'compute',
  'instances',
  'create',
  'no-address',
  '--tunnel-through-iap',
  'ConnectTimeout=15',
  'cleanupCanary',
  'verify_instance_absent',
  'verify_disk_absent',
  'verify_address_absent',
  'verify_reservation_absent',
]) {
  assert.equal(cli.includes(required), true, `Runner CLI missing ${required}`)
}
for (const forbidden of [
  '--accelerator',
  'nvidia-l4',
  'g2-standard',
  'docker ',
  'from_pretrained',
  'import torch',
  'torch.',
  'supabase ',
  'psql',
  'createdb',
  'dropdb',
]) {
  assert.equal(cli.includes(forbidden), false, `Runner CLI must not include forbidden marker: ${forbidden}`)
}

const spec = AI_VIDEO_BROLL_GEN_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER
assert.equal(spec.decision, DECISION)
assert.equal(spec.mode, 'ai_video_broll_gen_10r_fix_iap_ssh_canary_bounded_runner')
assert.equal(spec.runnerImplemented, true)
assert.equal(spec.runnerExecutedByThisPrompt, false)
assert.equal(spec.claimsDryRunPassed, false)
assert.equal(spec.claimsGeneratedLocalFixturePassed, false)
assert.equal(spec.runnerCli.defaultModeCreatesResources, false)
assert.equal(spec.runnerCli.executeModeRequiresConfirmation, true)
assert.equal(spec.runnerCli.executeModeRequiresServiceAccountEnv, true)
assert.equal(spec.boundedRunnerRequirements.machineType, 'e2-standard-2')
assert.equal(spec.boundedRunnerRequirements.noGpuAcceleratorRequired, true)
assert.equal(spec.boundedRunnerRequirements.noPublicIpRequired, true)
assert.equal(spec.timeoutPolicy.sshAttemptTimeoutMs, 45000)
assert.equal(spec.timeoutPolicy.sshAttemptCount, 3)
assert.equal(spec.timeoutPolicy.hardTimeoutsRequired, true)
assert.equal(spec.durableSummaryPolicy.writesSummaryAfterEachSshAttempt, true)
assert.equal(spec.durableSummaryPolicy.writesSummaryOnInterruptOrError, true)
assert.equal(spec.durableSummaryPolicy.summaryContainsCredentialValues, false)
assert.equal(spec.durableSummaryPolicy.summaryContainsServiceAccountValue, false)
assert.equal(spec.durableSummaryPolicy.summaryContainsSshKeyMaterial, false)
assert.equal(spec.durableSummaryPolicy.summaryContainsAccessTokens, false)
assert.equal(spec.nextPrompt, AI_VIDEO_BROLL_GEN_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_EXECUTE_PROMPT)

for (const [flag, value] of Object.entries(spec.runtimeSideEffects)) {
  if (['runnerCliCreated', 'runnerSmokeCreated'].includes(flag)) {
    assert.equal(value, true, `${flag} should be true`)
  } else {
    assert.equal(value, false, `${flag} must remain false`)
  }
}

const planOutput = execFileSync('npx', ['tsx', CLI_PATH, '--json'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024,
})
const plan = JSON.parse(planOutput)
assert.equal(plan.ok, true)
assert.equal(plan.mode, 'ai_video_broll_gen_10r_iap_ssh_canary_bounded_runner_plan')
assert.equal(plan.runtimeRunNow, false)
assert.equal(plan.canaryCreateAttempted, false)
assert.equal(plan.canaryCreated, false)
assert.equal(plan.sshAttempted, false)
assert.equal(plan.cleanupAttempted, false)
assert.equal(plan.cleanupVerified, false)
assert.equal(plan.runtimeSideEffects.computeVmCreated, false)
assert.equal(plan.runtimeSideEffects.gpuVmCreated, false)
assert.equal(plan.runtimeSideEffects.modelInferenceRun, false)
assert.equal(plan.runtimeSideEffects.generatedAssetsCreated, false)
assert.equal(plan.runtimeSideEffects.generatedLocalFixturePassedClaimed, false)

const blockedOutput = execFileSync('npx', ['tsx', CLI_PATH, '--execute', '--json'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024,
  env: {
    ...process.env,
    REEDITPRO_CONFIRM_BROLL_10R_IAP_SSH_CANARY: '',
    REEDITPRO_BROLL_PROOF_SERVICE_ACCOUNT_EMAIL: '',
  },
})
const blocked = JSON.parse(blockedOutput)
assert.equal(blocked.ok, false)
assert.equal(blocked.mode, 'ai_video_broll_gen_10r_iap_ssh_canary_bounded_runner_confirmation_blocked')
assert.equal(blocked.runtimeRunNow, false)
assert.equal(blocked.canaryCreateAttempted, false)
assert.equal(blocked.canaryCreated, false)
assert.equal(blocked.sshAttempted, false)
assert.equal(blocked.cleanupAttempted, false)
assert.equal(blocked.runtimeSideEffects.computeVmCreated, false)
assert.equal(blocked.runtimeSideEffects.gcpMutatingCommandsExecuted, false)
assert.equal(blocked.runtimeSideEffects.generatedLocalFixturePassedClaimed, false)

const forbiddenFindings = scanForbiddenValues({ doc, nextPrompt, spec, plan, blocked })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: spec.decision,
      runnerImplemented: spec.runnerImplemented,
      runnerExecutedByThisPrompt: spec.runnerExecutedByThisPrompt,
      defaultModeCreatesResources: spec.runnerCli.defaultModeCreatesResources,
      executeModeRequiresConfirmation: spec.runnerCli.executeModeRequiresConfirmation,
      sshAttemptTimeoutMs: spec.timeoutPolicy.sshAttemptTimeoutMs,
      writesSummaryAfterEachSshAttempt: spec.durableSummaryPolicy.writesSummaryAfterEachSshAttempt,
      computeVmCreatedByThisPrompt: spec.runtimeSideEffects.computeVmCreatedByThisPrompt,
      modelInferenceRun: spec.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: spec.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: spec.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: spec.nextPrompt,
    },
    null,
    2,
  ),
)
