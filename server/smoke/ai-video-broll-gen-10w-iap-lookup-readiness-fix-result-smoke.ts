import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10W_IAP_LOOKUP_READINESS_FIX_RESULT,
  AI_VIDEO_BROLL_GEN_10X_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_WITH_IAP_LOOKUP_READINESS_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10w-iap-lookup-readiness-fix-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.md'
const PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-10w-iap-lookup-readiness-fix.md'
const NEXT_PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10w-iap-lookup-readiness-fix-result'
const DECISION = 'ai_video_broll_gen_10w_iap_lookup_readiness_fix_applied_no_execution'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10wIapLookupReadinessFix'): string[] {
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
  'docs/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.md',
  'src/backend/mock/mock-ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.ts',
  'server/smoke/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result-smoke.ts',
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
const nextPrompt = read(NEXT_PROMPT_PATH)
const rollupDoc = read('docs/external-agent-tool-execution-readiness-rollup.md')

for (const required of [
  DECISION,
  'Failed to lookup instance',
  'Wait for `status=RUNNING`',
  'Maximum IAP lookup attempts | `8`',
  'Delay between attempts | `10s`',
  'Payload transfer allowed before readiness | `false`',
  'Dependency install allowed before readiness | `false`',
  'modelImportRun=false',
  'modelInferenceRun=false',
  'generatedAssetsCreated=false',
  'generatedLocalFixturePassedClaimed=false',
  AI_VIDEO_BROLL_GEN_10X_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_WITH_IAP_LOOKUP_READINESS_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10W result doc missing ${required}`)
}

for (const required of [
  'Do not create a VM.',
  'Add a bounded post-create readiness phase before the first IAP SSH command.',
  'Record each wait attempt in durable summary output.',
]) {
  assert.equal(prompt.includes(required), true, `10W source prompt missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10X_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_WITH_IAP_LOOKUP_READINESS_PROMPT,
  'Run `npm run smoke:ai-video-broll-gen-10w-iap-lookup-readiness-fix-result`.',
  'Poll until the instance reports `RUNNING`.',
  'verify no public NAT IP exists',
  'verify `autoDelete=true`',
  'Stop before payload transfer if lookup readiness fails',
  'Do not run model import.',
  'Do not run inference.',
]) {
  assert.equal(nextPrompt.includes(required), true, `10X prompt missing ${required}`)
}

assert.equal(rollupDoc.includes('10W no-execution post-create IAP lookup readiness fix'), true)
assert.equal(rollupDoc.includes('broll_10x_l4_payload_install_retry_with_iap_lookup_readiness_required'), true)
assert.equal(rollupDoc.includes(AI_VIDEO_BROLL_GEN_10X_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_WITH_IAP_LOOKUP_READINESS_PROMPT), true)

const result = AI_VIDEO_BROLL_GEN_10W_IAP_LOOKUP_READINESS_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10w_iap_lookup_readiness_fix_result')
assert.equal(result.workstream, 'AI_VIDEO_BROLL_GENERATION')
assert.equal(result.toolId, 'ai_video_broll_generation_wan')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.failureAddressedFrom10V.failureClass, 'post_create_iap_instance_lookup_readiness_gap')
assert.equal(result.failureAddressedFrom10V.immediateSshAfterCreateRejected, true)
assert.equal(result.failureAddressedFrom10V.payloadTransferBeforeLookupReadinessAllowed, false)
assert.equal(result.postCreateReadinessContract.requiredBeforeFirstIapSshCommand, true)
assert.equal(result.postCreateReadinessContract.instanceDescribeVisibilityWaitRequired, true)
assert.equal(result.postCreateReadinessContract.instanceRunningWaitRequired, true)
assert.equal(result.postCreateReadinessContract.privateOnlyNetworkRecheckRequired, true)
assert.equal(result.postCreateReadinessContract.publicNatIpMustRemainAbsent, true)
assert.equal(result.postCreateReadinessContract.bootDiskAutoDeleteRecheckRequired, true)
assert.equal(result.postCreateReadinessContract.boundedIapLookupReadinessLoopRequired, true)
assert.equal(result.postCreateReadinessContract.maxIapLookupAttempts, 8)
assert.equal(result.postCreateReadinessContract.delayBetweenIapLookupAttemptsSeconds, 10)
assert.equal(result.postCreateReadinessContract.maxPostCreateReadinessWindowSeconds, 120)
assert.equal(result.postCreateReadinessContract.durableAttemptSummaryRequired, true)
assert.equal(result.postCreateReadinessContract.stopBeforePayloadTransferIfLookupFails, true)
assert.equal(result.nextRuntimeRetryRequirements.modelImportAllowed, false)
assert.equal(result.nextRuntimeRetryRequirements.modelInferenceAllowed, false)
assert.equal(result.nextRuntimeRetryRequirements.generatedAssetCreationAllowed, false)
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10X_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_WITH_IAP_LOOKUP_READINESS_PROMPT)

for (const [flag, value] of Object.entries(result.runtimeSideEffects)) {
  if (
    [
      'resultDocCreated',
      'resultSpecCreated',
      'resultSmokeCreated',
      'nextPromptCreated',
      'rollupRouteUpdated',
      'wrapperRouteUpdated',
    ].includes(flag)
  ) {
    assert.equal(value, true, `${flag} should record this no-execution fix`)
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
      immediateSshAfterCreateRejected: result.failureAddressedFrom10V.immediateSshAfterCreateRejected,
      maxIapLookupAttempts: result.postCreateReadinessContract.maxIapLookupAttempts,
      maxPostCreateReadinessWindowSeconds: result.postCreateReadinessContract.maxPostCreateReadinessWindowSeconds,
      modelImportRun: result.runtimeSideEffects.modelImportRun,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
