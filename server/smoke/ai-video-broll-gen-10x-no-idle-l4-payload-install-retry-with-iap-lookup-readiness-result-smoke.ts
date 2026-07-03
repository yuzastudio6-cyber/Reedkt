import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10X_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_WITH_IAP_LOOKUP_READINESS_RESULT,
  AI_VIDEO_BROLL_GEN_10Y_RUNNER_RAW_JSON_CLEANUP_FIX_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result'

const ROOT = process.cwd()
const DOC_PATH =
  'docs/ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result.md'
const PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness.md'
const NEXT_PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10y-runner-raw-json-cleanup-fix.md'
const SPEC_PATH =
  'src/backend/mock/mock-ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result.ts'
const SMOKE_PATH =
  'server/smoke/ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result'
const DECISION =
  'ai_video_broll_gen_10x_no_idle_l4_payload_install_retry_blocked_runner_parse_cleanup_bug_manual_cleanup_verified'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10xResult'): string[] {
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
  'docs/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.md',
  'docs/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.md',
  'docs/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.md',
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
const nextPrompt = read(NEXT_PROMPT_PATH)
const rollupDoc = read('docs/external-agent-tool-execution-readiness-rollup.md')

for (const required of [
  DECISION,
  'parsed sanitized/truncated `describe` output instead of the raw machine JSON',
  'Post-create instance visibility verified by runner | `false`',
  'IAP lookup readiness attempted | `false`',
  'Full wheelhouse payload transfer attempted | `false`',
  'Offline dependency install attempted | `false`',
  'Independent cleanup verified | `true`',
  'Proof instance | `false`',
  'Proof disk | `false`',
  'Parse raw command stdout before sanitizing or truncating log summaries.',
  'cleanup must call exact-name delete',
  'modelImportRun=false',
  'modelInferenceRun=false',
  'generatedLocalFixturePassedClaimed=false',
  AI_VIDEO_BROLL_GEN_10Y_RUNNER_RAW_JSON_CLEANUP_FIX_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10X result doc missing ${required}`)
}

for (const required of [
  'This prompt may create at most one prompt-scoped no-public-IP',
  'Run `npm run smoke:ai-video-broll-gen-10w-iap-lookup-readiness-fix-result`.',
  'Persist every readiness attempt with attempt number',
  'Always cleanup the prompt-scoped VM',
]) {
  assert.equal(prompt.includes(required), true, `10X source prompt missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10Y_RUNNER_RAW_JSON_CLEANUP_FIX_PROMPT,
  'This prompt must not create a VM',
  'Parse raw command stdout before sanitizing or truncating summaries.',
  'Never make machine-state decisions from `stdoutSummary`',
  'cleanup must attempt exact-name delete',
  'AI-VIDEO-BROLL-GEN-10Z-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-AFTER-RUNNER-FIX',
]) {
  assert.equal(nextPrompt.includes(required), true, `10Y prompt missing ${required}`)
}

assert.equal(rollupDoc.includes('10X'), true)
assert.equal(rollupDoc.includes('broll_10z_no_idle_l4_payload_install_retry_after_runner_fix_required'), true)
assert.equal(rollupDoc.includes(AI_VIDEO_BROLL_GEN_10Y_RUNNER_RAW_JSON_CLEANUP_FIX_PROMPT), true)

const result = AI_VIDEO_BROLL_GEN_10X_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_WITH_IAP_LOOKUP_READINESS_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10x_no_idle_l4_payload_install_retry_with_iap_lookup_readiness_result')
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
assert.equal(result.runtimeAttempt.iapLookupReadinessAttempted, false)
assert.equal(result.runtimeAttempt.wheelhousePayloadTransferAttempted, false)
assert.equal(result.runtimeAttempt.offlineDependencyInstallAttempted, false)
assert.equal(result.runtimeAttempt.modelImportAttempted, false)
assert.equal(result.runtimeAttempt.modelInferenceAttempted, false)
assert.equal(result.failure.failureClass, 'local_runner_sanitized_describe_parse_cleanup_bug')
assert.equal(result.failure.runnerParsedSanitizedStdoutSummaryInsteadOfRawStdout, true)
assert.equal(result.failure.sanitizedDescribeOutputWasTruncatedBeforeParsing, true)
assert.equal(result.failure.machineStateDecisionsFromSanitizedSummariesRejected, true)
assert.equal(result.independentCleanup.cleanupVerifiedByIndependentAbsenceChecks, true)
assert.equal(result.independentCleanup.proofInstancePresentAfterCleanup, false)
assert.equal(result.independentCleanup.proofDiskPresentAfterCleanup, false)
assert.equal(result.independentCleanup.proofAddressPresentAfterCleanup, false)
assert.equal(result.independentCleanup.proofReservationPresentAfterCleanup, false)
assert.equal(result.preventionRequiredBeforeNextRuntimeRetry.noVmFixPromptRequiredFirst, true)
assert.equal(result.preventionRequiredBeforeNextRuntimeRetry.parseRawStdoutBeforeSanitizing, true)
assert.equal(result.preventionRequiredBeforeNextRuntimeRetry.cleanupDeleteMustRunAfterSuccessfulCreateEvenIfDescribeParseFails, true)
assert.equal(result.runtimeSideEffects.computeVmCreated, true)
assert.equal(result.runtimeSideEffects.computeVmDeleted, true)
assert.equal(result.runtimeSideEffects.fullWheelhousePayloadTransferred, false)
assert.equal(result.runtimeSideEffects.dependencyInstalledOnVm, false)
assert.equal(result.runtimeSideEffects.modelImportRun, false)
assert.equal(result.runtimeSideEffects.modelInferenceRun, false)
assert.equal(result.runtimeSideEffects.generatedAssetsCreated, false)
assert.equal(result.runtimeSideEffects.supabaseTouched, false)
assert.equal(result.runtimeSideEffects.sqlExecuted, false)
assert.equal(result.runtimeSideEffects.dryRunPassedClaimed, false)
assert.equal(result.runtimeSideEffects.generatedLocalFixturePassedClaimed, false)
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10Y_RUNNER_RAW_JSON_CLEANUP_FIX_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, prompt, nextPrompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      failureClass: result.failure.failureClass,
      computeVmCreated: result.runtimeSideEffects.computeVmCreated,
      computeVmDeleted: result.runtimeSideEffects.computeVmDeleted,
      iapLookupReadinessAttempted: result.runtimeAttempt.iapLookupReadinessAttempted,
      wheelhousePayloadTransferred: result.runtimeAttempt.wheelhousePayloadTransferred,
      offlineDependencyInstallPassed: result.runtimeAttempt.offlineDependencyInstallPassed,
      modelImportRun: result.runtimeSideEffects.modelImportRun,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
