import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_RESULT,
  AI_VIDEO_BROLL_GEN_10T_IAP_SSH_FLAG_FIX_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.md'
const PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-10t-iap-ssh-flag-fix.md'
const SPEC_PATH =
  'src/backend/mock/mock-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.ts'
const SMOKE_PATH =
  'server/smoke/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result'
const DECISION =
  'ai_video_broll_gen_10s_no_gpu_iap_ssh_canary_blocked_by_gcloud_ssh_flag_conflict_cleanup_verified'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10sResult'): string[] {
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
  SMOKE_PATH,
  'docs/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-result.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-execute.md',
  'server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
for (const required of [
  DECISION,
  'no-GPU no-public-IP canary VM was created and deleted successfully',
  'mutually exclusive `gcloud compute ssh` flags',
  'argument --internal-ip: At most one of --internal-ip | --tunnel-through-iap can be specified',
  'This result does not prove an OS Login, SSH key, IAP firewall, or service account access failure',
  'Canary created',
  'SSH attempt count',
  'Cleanup verified',
  'gpuVmCreated=false',
  'sshSessionOpened=false',
  'modelInferenceRun=false',
  'generatedAssetsCreated=false',
  'generatedLocalFixturePassedClaimed=false',
  AI_VIDEO_BROLL_GEN_10T_IAP_SSH_FLAG_FIX_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10S result doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10T_IAP_SSH_FLAG_FIX_PROMPT,
  'Remove `--internal-ip`',
  'Keep `--tunnel-through-iap`',
  'Do not create a VM',
  'Do not run inference',
  'Do not run the canary again in this fix prompt',
]) {
  assert.equal(prompt.includes(required), true, `10T prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10s_no_gpu_iap_ssh_canary_bounded_runner_result')
assert.equal(result.workstream, 'AI_VIDEO_BROLL_GENERATION')
assert.equal(result.toolId, 'ai_video_broll_generation_wan')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.canaryShape.machineType, 'e2-standard-2')
assert.equal(result.canaryShape.acceleratorRequested, false)
assert.equal(result.canaryShape.publicIpRequested, false)
assert.equal(result.canaryShape.proofServiceAccountValueStored, false)
assert.equal(result.preflight.localRunnerSmokePassed, true)
assert.equal(result.preflight.cacheReadinessPassed, true)
assert.equal(result.preflight.quotaVerifyPassed, true)
assert.equal(result.preflight.blockerPreflightPassed, true)
assert.equal(result.preflight.proofServiceAccountPresent, true)
assert.equal(result.preflight.proofServiceAccountDisabled, false)
assert.equal(result.preflight.proofServiceAccountValueStored, false)
assert.deepEqual(result.preflight.preExistingResources, {
  instance: false,
  disk: false,
  address: false,
  reservation: false,
})
assert.equal(result.runtimeAttempt.runnerCommandExecuted, true)
assert.equal(result.runtimeAttempt.runnerSummaryPathStoredInRepo, false)
assert.equal(result.runtimeAttempt.canaryCreateAttempted, true)
assert.equal(result.runtimeAttempt.canaryCreated, true)
assert.equal(result.runtimeAttempt.bootDiskCreated, true)
assert.equal(result.runtimeAttempt.sshAttempted, true)
assert.equal(result.runtimeAttempt.sshAttemptCount, 3)
assert.equal(result.runtimeAttempt.sshSuccessEvidenceCaptured, false)
assert.equal(result.runtimeAttempt.sshFailureEvidenceCaptured, true)
assert.equal(result.runtimeAttempt.iapSshOpenedClaimed, false)
assert.equal(result.runtimeAttempt.sshFailureClass, 'gcloud_ssh_flag_conflict_internal_ip_with_tunnel_through_iap')
assert.equal(result.runtimeAttempt.cleanupAttempted, true)
assert.equal(result.runtimeAttempt.cleanupVerified, true)
assert.deepEqual(result.runtimeAttempt.finalResourceState, {
  instancePresent: false,
  diskPresent: false,
  addressPresent: false,
  reservationPresent: false,
  cleanupVerified: true,
})
assert.equal(result.failureAnalysis.rootCauseConfirmed, true)
assert.equal(
  result.failureAnalysis.rootCause,
  'runner_used_mutually_exclusive_gcloud_compute_ssh_flags_internal_ip_and_tunnel_through_iap',
)
assert.equal(result.failureAnalysis.publicKeyFailureClaimed, false)
assert.equal(result.failureAnalysis.osLoginFailureClaimed, false)
assert.equal(result.failureAnalysis.iapFirewallFailureClaimed, false)
assert.equal(result.failureAnalysis.vmCreateFailureClaimed, false)
assert.equal(result.failureAnalysis.cleanupFailureClaimed, false)
assert.equal(
  result.failureAnalysis.preventionBeforeNextRuntimeAttempt.includes(
    'remove_internal_ip_flag_when_tunnel_through_iap_is_used',
  ),
  true,
)
assert.equal(
  result.failureAnalysis.whatSucceeded.includes('instance_disk_address_and_reservation_absence_verified'),
  true,
)

for (const [flag, value] of Object.entries(result.runtimeSideEffects)) {
  if (
    [
      'gcpReadOnlyCommandsExecuted',
      'gcpMutatingCommandsExecuted',
      'computeVmCreateAttempted',
      'computeVmCreated',
      'nonGpuCanaryCreated',
      'diskCreated',
      'cleanupRun',
      'cleanupVerified',
    ].includes(flag)
  ) {
    assert.equal(value, true, `${flag} should record the bounded canary attempt and cleanup`)
  } else {
    assert.equal(value, false, `${flag} must remain false`)
  }
}

assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10T_IAP_SSH_FLAG_FIX_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, prompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      canaryCreated: result.runtimeAttempt.canaryCreated,
      sshFailureClass: result.runtimeAttempt.sshFailureClass,
      cleanupVerified: result.runtimeAttempt.cleanupVerified,
      gpuVmCreated: result.runtimeSideEffects.gpuVmCreated,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
