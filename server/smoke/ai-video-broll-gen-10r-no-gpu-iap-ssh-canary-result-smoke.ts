import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER_PROMPT,
  AI_VIDEO_BROLL_GEN_10R_NO_GPU_IAP_SSH_CANARY_RESULT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result.md'
const NEXT_PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result'
const DECISION =
  'ai_video_broll_gen_10r_no_gpu_iap_ssh_canary_interrupted_cleanup_repaired_runner_fix_required'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10rResult'): string[] {
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
  SMOKE_PATH,
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10r-no-gpu-iap-ssh-canary.md',
  'docs/ai-video-broll-gen-10q-iap-oslogin-access-fix-result.md',
  'docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(NEXT_PROMPT_PATH)
for (const required of [
  DECISION,
  'preflight passed',
  'one prompt-scoped non-GPU canary VM was created',
  'did not produce a durable pass/fail summary',
  'Follow-up cleanup repaired',
  'cleanupVerified=true',
  'sshSuccessEvidenceCaptured=false',
  'sshFailureEvidenceCaptured=false',
  'gpuVmCreated=false',
  'modelInferenceRun=false',
  'generatedAssetsCreated=false',
  'generatedLocalFixturePassedClaimed=false',
  AI_VIDEO_BROLL_GEN_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10R result doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER_PROMPT,
  'hard timeout around each IAP SSH attempt',
  'sanitized JSON summary',
  'cleanup runs and records instance, disk, address, and reservation absence',
  'Do not create GPU VMs.',
  'Do not transfer wheelhouse payloads.',
  'Do not run inference.',
  'generatedLocalFixturePassedClaimed=false',
]) {
  assert.equal(prompt.includes(required), true, `10R fix prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_10R_NO_GPU_IAP_SSH_CANARY_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10r_no_gpu_iap_ssh_canary_result')
assert.equal(result.workstream, 'AI_VIDEO_BROLL_GENERATION')
assert.equal(result.toolId, 'ai_video_broll_generation_wan')
assert.equal(result.checkedAtUtc, '2026-07-02T23:29:23Z')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.canaryShape.machineType, 'e2-standard-2')
assert.equal(result.canaryShape.acceleratorRequested, false)
assert.equal(result.canaryShape.publicIpRequested, false)
assert.equal(result.canaryShape.proofServiceAccountValueStored, false)
assert.equal(result.preflight.preflightPassed, true)
assert.equal(result.preflight.projectMatches, true)
assert.equal(result.preflight.iapFirewallPresent, true)
assert.equal(result.preflight.iapFirewallTcp22Allowed, true)
assert.equal(result.preflight.localGcloudSshPublicKeyExists, true)
assert.equal(result.preflight.localGcloudSshPublicKeyStored, false)
assert.equal(result.preflight.projectMetadataContainsLocalGcloudPublicKey, false)
assert.deepEqual(result.preflight.preExistingResources, {
  instance: false,
  disk: false,
  address: false,
  reservation: false,
})
assert.equal(result.runtimeAttempt.canaryCreateAttempted, true)
assert.equal(result.runtimeAttempt.canaryObservedAfterInterrupt, true)
assert.equal(result.runtimeAttempt.bootDiskObservedAfterInterrupt, true)
assert.equal(result.runtimeAttempt.sshAttempted, true)
assert.equal(result.runtimeAttempt.sshSuccessEvidenceCaptured, false)
assert.equal(result.runtimeAttempt.sshFailureEvidenceCaptured, false)
assert.equal(result.runtimeAttempt.iapSshOpenedClaimed, false)
assert.equal(result.runtimeAttempt.runnerInterrupted, true)
assert.equal(result.runtimeAttempt.durableCanarySummaryCaptured, false)
assert.equal(result.runtimeAttempt.initialCleanupTrapCompleted, false)
assert.equal(result.runtimeAttempt.followUpCleanupRepairExecuted, true)
assert.equal(result.runtimeAttempt.cleanupVerifiedAfterRepair, true)
assert.deepEqual(result.runtimeAttempt.finalResourceState, {
  instancePresent: false,
  diskPresent: false,
  addressPresent: false,
  reservationPresent: false,
  cleanupVerified: true,
})
assert.equal(result.failureAnalysis.rootCauseConfirmed, false)
assert.equal(result.failureAnalysis.iapSshAccessResultKnown, false)
assert.equal(result.failureAnalysis.iapSshPassClaimed, false)
assert.equal(result.failureAnalysis.iapSshPublicKeyFailureClaimed, false)
assert.equal(result.failureAnalysis.cleanupInitiallyIncomplete, true)
assert.equal(result.failureAnalysis.cleanupRepairSucceeded, true)
assert.equal(
  result.failureAnalysis.preventionBeforeNextRuntimeAttempt.includes(
    'wrap_each_iap_ssh_attempt_in_hard_timeout',
  ),
  true,
)
assert.equal(
  result.failureAnalysis.preventionBeforeNextRuntimeAttempt.includes(
    'always_emit_final_cleanup_summary_even_after_timeout_or_interrupt',
  ),
  true,
)
assert.equal(result.runtimeSideEffects.gcpMutatingCommandsExecuted, true)
assert.equal(result.runtimeSideEffects.computeVmCreateAttempted, true)
assert.equal(result.runtimeSideEffects.computeVmCreated, true)
assert.equal(result.runtimeSideEffects.nonGpuCanaryCreated, true)
assert.equal(result.runtimeSideEffects.diskCreated, true)
assert.equal(result.runtimeSideEffects.cleanupRepairExecuted, true)
assert.equal(result.runtimeSideEffects.cleanupVerified, true)

for (const [flag, value] of Object.entries(result.runtimeSideEffects)) {
  if (
    [
      'gcpReadOnlyCommandsExecuted',
      'gcpMutatingCommandsExecuted',
      'computeVmCreateAttempted',
      'computeVmCreated',
      'nonGpuCanaryCreated',
      'diskCreated',
      'cleanupRepairExecuted',
      'cleanupVerified',
    ].includes(flag)
  ) {
    assert.equal(value, true, `${flag} should record the bounded canary attempt and cleanup repair`)
  } else {
    assert.equal(value, false, `${flag} must remain false`)
  }
}

assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, prompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      preflightPassed: result.preflight.preflightPassed,
      canaryCreateAttempted: result.runtimeAttempt.canaryCreateAttempted,
      sshSuccessEvidenceCaptured: result.runtimeAttempt.sshSuccessEvidenceCaptured,
      sshFailureEvidenceCaptured: result.runtimeAttempt.sshFailureEvidenceCaptured,
      cleanupVerified: result.runtimeAttempt.finalResourceState.cleanupVerified,
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
