import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10U_NO_GPU_IAP_SSH_CANARY_RERUN_RESULT,
  AI_VIDEO_BROLL_GEN_10V_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result'
import {
  AI_VIDEO_BROLL_GEN_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER,
  AI_VIDEO_BROLL_GEN_10W_IAP_LOOKUP_READINESS_FIX_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner'
import { AI_VIDEO_BROLL_GEN_10X_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_WITH_IAP_LOOKUP_READINESS_PROMPT } from '../../src/backend/mock/mock-ai-video-broll-gen-10w-iap-lookup-readiness-fix-result'
import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.md'
const PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun.md'
const NEXT_PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-10v-no-idle-l4-payload-install-retry.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.ts'
const RUNNER_SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner.ts'
const RUNNER_PATH = 'server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts'
const RUNNER_SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-smoke.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result'
const DECISION = 'ai_video_broll_gen_10u_no_gpu_iap_ssh_canary_rerun_passed_cleanup_verified'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10uCanaryRerun'): string[] {
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
  RUNNER_SPEC_PATH,
  RUNNER_PATH,
  RUNNER_SMOKE_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-10t-iap-ssh-flag-fix-result.md',
  'src/backend/mock/mock-ai-video-broll-gen-10t-iap-ssh-flag-fix-result.ts',
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
const nextPrompt = read(NEXT_PROMPT_PATH)
const runner = read(RUNNER_PATH)
const runnerSpecSource = read(RUNNER_SPEC_PATH)
const rollupDoc = read('docs/external-agent-tool-execution-readiness-rollup.md')

for (const required of [
  DECISION,
  'the IAP SSH command captured the canary success marker',
  'Cleanup was verified by the runner and by independent post-run absence probes',
  'SSH success evidence captured | `true`',
  'Cleanup verified | `true`',
  'Canary instance | `false`',
  'gpuVmCreated=false',
  'modelImportRun=false',
  'modelInferenceRun=false',
  'generatedAssetsCreated=false',
  'generatedLocalFixturePassedClaimed=false',
  'Route Normalization',
  AI_VIDEO_BROLL_GEN_10V_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10U result doc missing ${required}`)
}

for (const required of [
  'Exact next prompt',
  AI_VIDEO_BROLL_GEN_10V_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_PROMPT,
  'Do not run model import.',
  'Do not run inference.',
  'Use `g2-standard-4` plus one NVIDIA L4.',
  'Use no public IP.',
  'Verify 10U result smoke passes',
  'generatedLocalFixturePassedClaimed=false',
]) {
  assert.equal(nextPrompt.includes(required), true, `10V prompt missing ${required}`)
}

assert.equal(prompt.includes('Do not create a GPU VM.'), true, '10U prompt must keep GPU blocked')
assert.equal(runner.includes("'--tunnel-through-iap'"), true, 'runner must keep IAP tunneling')
assert.equal(runner.includes("'--internal-ip'"), false, 'runner must not pass --internal-ip with IAP tunneling')
assert.equal(runnerSpecSource.includes(AI_VIDEO_BROLL_GEN_10W_IAP_LOOKUP_READINESS_FIX_PROMPT), true)

const result = AI_VIDEO_BROLL_GEN_10U_NO_GPU_IAP_SSH_CANARY_RERUN_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10u_no_gpu_iap_ssh_canary_rerun_result')
assert.equal(result.workstream, 'AI_VIDEO_BROLL_GENERATION')
assert.equal(result.toolId, 'ai_video_broll_generation_wan')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.preflight.preflightPassed, true)
assert.equal(result.runtimeAttempt.canaryCreated, true)
assert.equal(result.runtimeAttempt.sshSuccessEvidenceCaptured, true)
assert.equal(result.runtimeAttempt.sshFailureEvidenceCaptured, false)
assert.equal(result.runtimeAttempt.remoteCanaryMarkerCaptured, true)
assert.equal(result.runtimeAttempt.cleanupVerifiedByRunner, true)
assert.equal(result.runtimeAttempt.cleanupVerifiedByIndependentAbsenceProbes, true)
assert.equal(result.runtimeAttempt.finalResourceState.instancePresent, false)
assert.equal(result.runtimeAttempt.finalResourceState.diskPresent, false)
assert.equal(result.runtimeAttempt.finalResourceState.addressPresent, false)
assert.equal(result.runtimeAttempt.finalResourceState.reservationPresent, false)
assert.equal(result.failureAnalysisAndPrevention.iapSshAccessNowProvenForNoGpuCanary, true)
assert.equal(result.failureAnalysisAndPrevention.publicKeyFailureStillClaimed, false)
assert.equal(result.failureAnalysisAndPrevention.cleanupFailureClaimed, false)
assert.equal(result.routeNormalization.normalizedNextPrompt, AI_VIDEO_BROLL_GEN_10V_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_PROMPT)
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10V_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_PROMPT)

assert.equal(
  AI_VIDEO_BROLL_GEN_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER.failureRouting.success,
  AI_VIDEO_BROLL_GEN_10W_IAP_LOOKUP_READINESS_FIX_PROMPT,
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
      'sshCanaryCommandExecuted',
      'cleanupRun',
      'cleanupVerified',
    ].includes(flag)
  ) {
    assert.equal(value, true, `${flag} should record the prompt-scoped no-GPU canary side effect`)
  } else {
    assert.equal(value, false, `${flag} must remain false`)
  }
}

const brollTool = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.tools.find(
  (tool) => tool.toolId === 'ai_video_broll_generation_wan',
)
assert.ok(brollTool, 'B-roll tool missing from rollup')
assert.equal(brollTool.primaryBlocker, 'broll_10x_l4_payload_install_retry_with_iap_lookup_readiness_required')
assert.equal(brollTool.nextAction, AI_VIDEO_BROLL_GEN_10X_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_WITH_IAP_LOOKUP_READINESS_PROMPT)
assert.equal(
  brollTool.noIdleLifecycleGate?.nextActionAfterQuotaClears,
  AI_VIDEO_BROLL_GEN_10X_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_WITH_IAP_LOOKUP_READINESS_PROMPT,
)
assert.equal(rollupDoc.includes('docs/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.md'), true)
assert.equal(rollupDoc.includes(AI_VIDEO_BROLL_GEN_10X_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_WITH_IAP_LOOKUP_READINESS_PROMPT), true)
assert.equal(rollupDoc.includes('broll_10x_l4_payload_install_retry_with_iap_lookup_readiness_required'), true)

const forbiddenFindings = scanForbiddenValues({ doc, prompt, nextPrompt, result, rollupDoc })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      canaryCreated: result.runtimeAttempt.canaryCreated,
      sshSuccessEvidenceCaptured: result.runtimeAttempt.sshSuccessEvidenceCaptured,
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
