import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10Z_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_AFTER_RUNNER_FIX_RESULT,
  AI_VIDEO_BROLL_GEN_10ZA_PAYLOAD_DELIVERY_TIMEOUT_FIX_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result.md'
const PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix.md'
const NEXT_PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-10za-payload-delivery-timeout-fix.md'
const SPEC_PATH =
  'src/backend/mock/mock-ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result.ts'
const SMOKE_PATH =
  'server/smoke/ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result-smoke.ts'
const RUNNER_PATH = 'server/cli/ai-video-broll-gen-10z-l4-payload-install-runner.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result'
const DECISION =
  'ai_video_broll_gen_10z_no_idle_l4_payload_install_retry_blocked_iap_wheelhouse_transfer_timeout_cleanup_verified'
const ACTIVE_BLOCKER = 'broll_10zb_no_idle_l4_payload_install_retry_with_fixed_delivery_required'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10zResult'): string[] {
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

for (const file of [
  DOC_PATH,
  PROMPT_PATH,
  NEXT_PROMPT_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  RUNNER_PATH,
  'docs/ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result.md',
  'docs/ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result.md',
  'docs/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.md',
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result-smoke.ts',
  'package smoke script mismatch',
)
assert.equal(
  packageJson.scripts?.['ai-video-broll-gen-10z:l4-payload-install-runner'],
  'tsx server/cli/ai-video-broll-gen-10z-l4-payload-install-runner.ts',
  '10Z runner package script mismatch',
)

const doc = read(DOC_PATH)
const runner = read(RUNNER_PATH)
const nextPrompt = read(NEXT_PROMPT_PATH)
const rollupDoc = read('docs/external-agent-tool-execution-readiness-rollup.md')

for (const required of [
  DECISION,
  'full private wheelhouse transfer step',
  '2.8 GB Python 3.12 wheelhouse',
  'did not complete before the bounded 30-minute phase timeout',
  'This is not a quota failure',
  'not an IAP auth failure',
  'not a Python readiness failure',
  'not a runner raw-JSON parsing failure',
  'Post-create no-public-IP recheck completed | `true`',
  'IAP lookup readiness passed | `true`',
  'Python 3.12 readiness passed | `true`',
  'Requirements manifest transferred | `true`',
  'Full wheelhouse payload transferred | `false`',
  'Cleanup verified | `true`',
  'Proof instance | `false`',
  'Proof disk | `false`',
  'Proof address | `false`',
  'Proof reservation | `false`',
  'Do not retry the same recursive 2.8 GB IAP transfer',
  AI_VIDEO_BROLL_GEN_10ZA_PAYLOAD_DELIVERY_TIMEOUT_FIX_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10Z result doc missing ${required}`)
}

for (const required of [
  'avoid blindly retrying recursive `gcloud compute scp --recurse`',
  'single-archive packaging with checksum',
  'resumable/chunked transfer',
  'approved private cache/image strategy',
  'no VM/no model/no inference',
]) {
  assert.equal(nextPrompt.includes(required), true, `10ZA prompt missing ${required}`)
}

for (const required of [
  'ai_video_broll_gen_10z_l4_payload_install_runner_payload_transfer_checkpoint',
  'sanitizeSummaryForOutput',
  'stripRawStdout',
  'AI-VIDEO-BROLL-GEN-10ZA-PAYLOAD-DELIVERY-TIMEOUT-FIX',
]) {
  assert.equal(runner.includes(required), true, `10Z runner missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_10Z_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_AFTER_RUNNER_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10z_no_idle_l4_payload_install_retry_after_runner_fix_result')
assert.equal(result.workstream, 'AI_VIDEO_BROLL_GENERATION')
assert.equal(result.toolId, 'ai_video_broll_generation_wan')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.preflight.sourceSmokesPassed, true)
assert.equal(result.preflight.privateCacheReadinessPassed, true)
assert.equal(result.preflight.liveQuotaVerificationPassed, true)
assert.equal(result.runtimeAttempt.computeVmCreateAttempted, true)
assert.equal(result.runtimeAttempt.computeVmCreated, true)
assert.equal(result.runtimeAttempt.publicIpRequested, false)
assert.equal(result.runtimeAttempt.postCreateRunningVerifiedByRunner, true)
assert.equal(result.runtimeAttempt.postCreatePrivateOnlyRecheckCompleted, true)
assert.equal(result.runtimeAttempt.postCreateBootDiskAutoDeleteRecheckCompleted, true)
assert.equal(result.runtimeAttempt.iapLookupReadinessAttempted, true)
assert.equal(result.runtimeAttempt.iapLookupReadinessPassed, true)
assert.equal(result.runtimeAttempt.python312ReadinessPassed, true)
assert.equal(result.runtimeAttempt.requirementsManifestTransferred, true)
assert.equal(result.runtimeAttempt.wheelhousePayloadTransferAttempted, true)
assert.equal(result.runtimeAttempt.wheelhousePayloadTransferred, false)
assert.equal(result.runtimeAttempt.wheelhousePayloadTransferTimedOut, true)
assert.equal(result.runtimeAttempt.remotePayloadValidationAttempted, false)
assert.equal(result.runtimeAttempt.offlineDependencyInstallAttempted, false)
assert.equal(result.runtimeAttempt.modelImportAttempted, false)
assert.equal(result.runtimeAttempt.modelInferenceAttempted, false)
assert.equal(result.failure.failureClass, 'iap_recursive_wheelhouse_transfer_timeout')
assert.equal(result.failure.quotaFailure, false)
assert.equal(result.failure.iapAuthFailure, false)
assert.equal(result.failure.pythonReadinessFailure, false)
assert.equal(result.failure.runnerRawJsonParsingFailure, false)
assert.equal(result.cleanup.cleanupVerifiedByRunner, true)
assert.equal(result.cleanup.cleanupVerifiedByIndependentAbsenceChecks, true)
assert.equal(result.cleanup.proofInstancePresentAfterCleanup, false)
assert.equal(result.cleanup.proofDiskPresentAfterCleanup, false)
assert.equal(result.cleanup.proofAddressPresentAfterCleanup, false)
assert.equal(result.cleanup.proofReservationPresentAfterCleanup, false)
assert.equal(result.preventionRequiredBeforeNextRuntimeRetry.noVmFixPromptRequiredFirst, true)
assert.equal(result.preventionRequiredBeforeNextRuntimeRetry.doNotRetrySameRecursiveIapWheelhouseTransfer, true)
assert.equal(result.preventionRequiredBeforeNextRuntimeRetry.payloadDeliveryStrategyMustChange, true)
assert.equal(result.runtimeSideEffects.computeVmCreated, true)
assert.equal(result.runtimeSideEffects.computeVmDeleted, true)
assert.equal(result.runtimeSideEffects.iapTransferExecuted, true)
assert.equal(result.runtimeSideEffects.fullWheelhousePayloadTransferred, false)
assert.equal(result.runtimeSideEffects.dependencyInstalledOnVm, false)
assert.equal(result.runtimeSideEffects.modelImportRun, false)
assert.equal(result.runtimeSideEffects.modelInferenceRun, false)
assert.equal(result.runtimeSideEffects.generatedAssetsCreated, false)
assert.equal(result.runtimeSideEffects.supabaseTouched, false)
assert.equal(result.runtimeSideEffects.sqlExecuted, false)
assert.equal(result.runtimeSideEffects.dryRunPassedClaimed, false)
assert.equal(result.runtimeSideEffects.generatedLocalFixturePassedClaimed, false)
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10ZA_PAYLOAD_DELIVERY_TIMEOUT_FIX_PROMPT)

assert.equal(rollupDoc.includes(ACTIVE_BLOCKER), true)
assert.equal(rollupDoc.includes(AI_VIDEO_BROLL_GEN_10ZA_PAYLOAD_DELIVERY_TIMEOUT_FIX_PROMPT), true)

const forbiddenFindings = scanForbiddenValues({ doc, nextPrompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      failureClass: result.failure.failureClass,
      computeVmCreated: result.runtimeSideEffects.computeVmCreated,
      computeVmDeleted: result.runtimeSideEffects.computeVmDeleted,
      iapLookupReadinessPassed: result.runtimeAttempt.iapLookupReadinessPassed,
      requirementsManifestTransferred: result.runtimeAttempt.requirementsManifestTransferred,
      wheelhousePayloadTransferred: result.runtimeAttempt.wheelhousePayloadTransferred,
      cleanupVerified: result.cleanup.cleanupVerifiedByIndependentAbsenceChecks,
      modelImportRun: result.runtimeSideEffects.modelImportRun,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
