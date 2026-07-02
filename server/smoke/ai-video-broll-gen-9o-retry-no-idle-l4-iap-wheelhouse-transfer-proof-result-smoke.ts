import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_9O_RETRY_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_RESULT,
  AI_VIDEO_BROLL_GEN_9P_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md'
const PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix.md'
const SPEC_PATH =
  'src/backend/mock/mock-ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result'
const DECISION =
  'ai_video_broll_gen_9o_retry_no_idle_l4_iap_wheelhouse_transfer_blocked_resource_pool_exhausted_cleanup_verified'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll9oRetryResult'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['run.app URL', /\brun\.app\b/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service account email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.gserviceaccount\.com/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
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
  'docs/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.md',
  'docs/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
for (const required of [
  DECISION,
  '`us-central1-c`',
  '`g2-standard-4`',
  '`nvidia_l4`',
  '`ZONE_RESOURCE_POOL_EXHAUSTED`',
  '`computeVmCreateAttempted=true`',
  '`computeVmCreated=false`',
  '`externalIpCreated=false`',
  '`iapTransferExecuted=false`',
  '`remoteWheelhouseValidationRun=false`',
  '`cleanupVerified=true`',
  '`modelImportRun=false`',
  '`modelInferenceRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  AI_VIDEO_BROLL_GEN_9P_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `9O retry result doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_9P_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT,
  'no VM/no inference',
  'Inspect available zones, machine types, and L4 accelerator visibility',
  'no VM creation',
  'no dependency install',
  'no model load',
  'no model inference',
  '`generated_local_fixture_passed` claim',
]) {
  assert.equal(prompt.includes(required), true, `9P stockout fix prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_9O_RETRY_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_9o_retry_no_idle_l4_iap_wheelhouse_transfer_proof_result')
assert.equal(result.transferProofStatus, 'blocked')
assert.equal(result.transferProofBlocker, 'zone_resource_pool_exhausted_before_vm_created')
assert.equal(result.repeatedStockoutInSameZone, true)
assert.equal(result.targetZone, 'us-central1-c')
assert.equal(result.selectedGpu, 'nvidia_l4')
assert.equal(result.machineType, 'g2-standard-4')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.freshPreflight.projectMatches, true)
assert.equal(result.freshPreflight.accessTokenRefreshPassed, true)
assert.equal(result.freshPreflight.imageFamilyReady, true)
assert.equal(result.freshPreflight.globalGpusAllRegionsQuotaLimit, 1)
assert.equal(result.freshPreflight.globalGpusAllRegionsQuotaUsage, 0)
assert.equal(result.freshPreflight.regionalL4QuotaLimit, 1)
assert.equal(result.freshPreflight.regionalL4QuotaUsage, 0)
assert.equal(result.freshPreflight.privateWheelhouseComplete, true)
assert.equal(result.freshPreflight.privateWheelhouseRealWheelCount, 66)
assert.equal(result.freshPreflight.privateWheelhouseAggregateBytes, 2802483442)
assert.equal(result.freshPreflight.proofServiceAccountValueStored, false)
assert.equal(result.lifecycleAttempt.computeVmCreateAttempted, true)
assert.equal(result.lifecycleAttempt.createSucceeded, false)
assert.equal(result.lifecycleAttempt.createBlockedByResourcePoolExhaustion, true)
assert.equal(result.lifecycleAttempt.externalNatIpPresent, false)
assert.equal(result.lifecycleAttempt.iapTransferAttempted, false)
assert.equal(result.lifecycleAttempt.remoteWheelhouseValidationAttempted, false)
assert.equal(result.lifecycleAttempt.deleteAttempted, false)
assert.equal(result.lifecycleAttempt.cleanupVerified, true)
assert.equal(result.cleanupState.instanceAbsentAfterCleanup, true)
assert.equal(result.cleanupState.diskAbsentAfterCleanup, true)
assert.equal(result.cleanupState.addressAbsentAfterCleanup, true)
assert.equal(result.cleanupState.reservationAbsentAfterCleanup, true)
assert.equal(result.runtimeSideEffects.computeVmCreateAttempted, true)
assert.equal(result.runtimeSideEffects.computeVmCreated, false)
assert.equal(result.runtimeSideEffects.computeVmDeleted, false)
assert.equal(result.runtimeSideEffects.externalIpCreated, false)
assert.equal(result.runtimeSideEffects.iapTransferExecuted, false)
assert.equal(result.runtimeSideEffects.remoteWheelhouseValidationRun, false)
assert.equal(result.runtimeSideEffects.cleanupVerified, true)
for (const [key, value] of Object.entries(result.runtimeSideEffects)) {
  if (key === 'computeVmCreateAttempted' || key === 'cleanupVerified') continue
  assert.equal(value, false, `${key} must remain false`)
}
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_9P_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, prompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      transferProofStatus: result.transferProofStatus,
      transferProofBlocker: result.transferProofBlocker,
      repeatedStockoutInSameZone: result.repeatedStockoutInSameZone,
      createSucceeded: result.lifecycleAttempt.createSucceeded,
      iapTransferAttempted: result.lifecycleAttempt.iapTransferAttempted,
      cleanupVerified: result.lifecycleAttempt.cleanupVerified,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
