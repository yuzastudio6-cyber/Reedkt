import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10V_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_RESULT,
  AI_VIDEO_BROLL_GEN_10W_IAP_LOOKUP_READINESS_FIX_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.md'
const PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-10v-no-idle-l4-payload-install-retry.md'
const NEXT_PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-10w-iap-lookup-readiness-fix.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result'
const DECISION =
  'ai_video_broll_gen_10v_no_idle_l4_payload_install_retry_blocked_iap_instance_lookup_cleanup_verified'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10vPayloadInstallRetry'): string[] {
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
  NEXT_PROMPT_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.md',
  'src/backend/mock/mock-ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.ts',
  'docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md',
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
const nextPrompt = read(NEXT_PROMPT_PATH)

for (const required of [
  DECISION,
  'the VM had no public IP',
  'the first IAP SSH precheck failed with `Failed to lookup instance`',
  'Full wheelhouse payload transfer attempted | `false`',
  'Offline dependency install attempted | `false`',
  'Cleanup verified | `true`',
  'Proof instance | `false`',
  'modelImportRun=false',
  'modelInferenceRun=false',
  'generatedAssetsCreated=false',
  'generatedLocalFixturePassedClaimed=false',
  AI_VIDEO_BROLL_GEN_10W_IAP_LOOKUP_READINESS_FIX_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10V result doc missing ${required}`)
}

for (const required of [
  'Exact next prompt',
  AI_VIDEO_BROLL_GEN_10W_IAP_LOOKUP_READINESS_FIX_PROMPT,
  'Do not create a VM.',
  'Do not open SSH.',
  'Do not transfer payloads.',
  'Do not install dependencies.',
  'Add a bounded post-create readiness phase before the first IAP SSH command.',
  'Keep cleanup mandatory',
]) {
  assert.equal(nextPrompt.includes(required), true, `10W prompt missing ${required}`)
}

assert.equal(prompt.includes('Use `g2-standard-4` plus one NVIDIA L4.'), true, '10V prompt source missing L4 shape')

const result = AI_VIDEO_BROLL_GEN_10V_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10v_no_idle_l4_payload_install_retry_result')
assert.equal(result.workstream, 'AI_VIDEO_BROLL_GENERATION')
assert.equal(result.toolId, 'ai_video_broll_generation_wan')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.preflight.preflightPassed, true)
assert.equal(result.runtimeAttempt.computeVmCreated, true)
assert.equal(result.runtimeAttempt.noPublicIpVerifiedAfterCreate, true)
assert.equal(result.runtimeAttempt.iapSshPrecheckAttempted, true)
assert.equal(result.runtimeAttempt.iapSshPrecheckPassed, false)
assert.equal(result.runtimeAttempt.iapSshFailureClass, 'iap_instance_lookup_failed_before_payload_transfer')
assert.equal(result.runtimeAttempt.iapSshFailureMarker, 'Failed to lookup instance')
assert.equal(result.runtimeAttempt.fullWheelhousePayloadTransferAttempted, false)
assert.equal(result.runtimeAttempt.offlineDependencyInstallAttempted, false)
assert.equal(result.runtimeAttempt.dependencySpecReadinessAttempted, false)
assert.equal(result.runtimeAttempt.modelImportAttempted, false)
assert.equal(result.runtimeAttempt.modelInferenceAttempted, false)
assert.equal(result.runtimeAttempt.cleanupVerifiedByRunner, true)
assert.equal(result.runtimeAttempt.cleanupVerifiedByIndependentAbsenceProbes, true)
assert.equal(result.runtimeAttempt.finalResourceState.instancePresent, false)
assert.equal(result.runtimeAttempt.finalResourceState.diskPresent, false)
assert.equal(result.runtimeAttempt.finalResourceState.addressPresent, false)
assert.equal(result.runtimeAttempt.finalResourceState.reservationPresent, false)
assert.equal(result.failureAnalysisAndPrevention.previousPublicKeyFailureRepeated, false)
assert.equal(result.failureAnalysisAndPrevention.capacityFailureRepeated, false)
assert.equal(result.failureAnalysisAndPrevention.failureClass, 'post_create_iap_instance_lookup_readiness_gap')
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10W_IAP_LOOKUP_READINESS_FIX_PROMPT)

for (const [flag, value] of Object.entries(result.runtimeSideEffects)) {
  if (
    [
      'gcpReadOnlyCommandsExecuted',
      'gcpMutatingCommandsExecuted',
      'computeVmCreateAttempted',
      'computeVmCreated',
      'gpuVmCreated',
      'gpuAttached',
      'diskCreated',
      'bootDiskCreatedWithVm',
      'bootDiskAutoDeleted',
      'cleanupRun',
      'cleanupVerified',
      'iapSshAttempted',
    ].includes(flag)
  ) {
    assert.equal(value, true, `${flag} should record the prompt-scoped L4 attempt side effect`)
  } else {
    assert.equal(value, false, `${flag} must remain false`)
  }
}

const forbiddenFindings = scanForbiddenValues({ doc, prompt, nextPrompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      computeVmCreated: result.runtimeAttempt.computeVmCreated,
      noPublicIpVerifiedAfterCreate: result.runtimeAttempt.noPublicIpVerifiedAfterCreate,
      failureClass: result.runtimeAttempt.iapSshFailureClass,
      cleanupVerified: result.runtimeAttempt.finalResourceState.cleanupVerified,
      payloadTransferred: result.runtimeSideEffects.fullWheelhousePayloadTransferred,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
