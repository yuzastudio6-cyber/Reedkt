import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10G_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST4_A_RESULT,
  AI_VIDEO_BROLL_GEN_10H_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.md'
const NEXT_PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix.md'
const SPEC_PATH =
  'src/backend/mock/mock-ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.ts'
const SMOKE_PATH =
  'server/smoke/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result'
const DECISION =
  'ai_video_broll_gen_10g_us_west4_a_iap_wheelhouse_transfer_blocked_resource_pool_exhausted_cleanup_verified'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10gResult'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
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
  NEXT_PROMPT_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a.md',
  'docs/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.md',
  'docs/ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(NEXT_PROMPT_PATH)
for (const required of [
  DECISION,
  '`us-west4-a`',
  '`us-west4-c`',
  '`ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS`',
  '`resource_availability`',
  '| Regional L4 quota | limit `1`, usage `0` |',
  '| Private wheelhouse real wheel count | `66` |',
  '- create attempted: `true`',
  '- create succeeded: `false`',
  '- create blocker: `zone_resource_pool_exhausted_with_details`',
  '- suggested available zone: `us-west4-c`',
  '- cleanup verified: `true`',
  '- proof instance present: `false`',
  '- proof disk present: `false`',
  '`gcpMutatingCommandsExecuted=true`',
  '`computeVmCreateAttempted=true`',
  '`computeVmCreated=false`',
  '`iapTransferExecuted=false`',
  '`remoteWheelhouseValidationRun=false`',
  '`modelInferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`dryRunPassedClaimed=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  AI_VIDEO_BROLL_GEN_10H_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10G result doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10H_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT,
  'read-only and no-VM',
  '`us-west4-a` stockout',
  '`us-west4-c` suggested available zone',
  'Do not create a VM',
  'run-when-used and stop-when-idle',
  '`generated_local_fixture_passed`',
]) {
  assert.equal(prompt.includes(required), true, `10H prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_10G_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST4_A_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10g_no_idle_l4_iap_wheelhouse_transfer_proof_us_west4_a_result')
assert.equal(result.attemptedZone, 'us-west4-a')
assert.equal(result.attemptedRegion, 'us-west4')
assert.deepEqual(result.suggestedAvailableZones, ['us-west4-c'])
assert.equal(result.machineType, 'g2-standard-4')
assert.equal(result.selectedGpu, 'nvidia_l4')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.freshPreflight.projectMatches, true)
assert.equal(result.freshPreflight.accessTokenRefreshPassed, true)
assert.equal(result.freshPreflight.zoneStatus, 'UP')
assert.equal(result.freshPreflight.machineTypeVisible, true)
assert.equal(result.freshPreflight.acceleratorVisible, true)
assert.equal(result.freshPreflight.globalGpusAllRegionsQuotaLimit, 1)
assert.equal(result.freshPreflight.globalGpusAllRegionsQuotaUsage, 0)
assert.equal(result.freshPreflight.regionalL4QuotaLimit, 1)
assert.equal(result.freshPreflight.regionalL4QuotaUsage, 0)
assert.equal(result.freshPreflight.privateModelCacheReadinessPassed, true)
assert.equal(result.freshPreflight.privateWheelhouseComplete, true)
assert.equal(result.freshPreflight.privateWheelhouseRealWheelCount, 66)
assert.equal(result.lifecycleAttempt.computeVmCreateAttempted, true)
assert.equal(result.lifecycleAttempt.computeVmCreated, false)
assert.equal(result.lifecycleAttempt.createSucceeded, false)
assert.equal(result.lifecycleAttempt.createBlocker, 'zone_resource_pool_exhausted_with_details')
assert.equal(result.lifecycleAttempt.createReason, 'resource_availability')
assert.deepEqual(result.lifecycleAttempt.createSuggestedAvailableZones, ['us-west4-c'])
assert.equal(result.lifecycleAttempt.createCompletedWithNoVmResource, true)
assert.equal(result.lifecycleAttempt.cleanupVerified, true)
assert.equal(result.cleanupVerification.proofInstancePresent, false)
assert.equal(result.cleanupVerification.proofDiskPresent, false)
assert.equal(result.cleanupVerification.proofStaticAddressPresent, false)
assert.equal(result.cleanupVerification.proofReservationPresent, false)
assert.equal(result.cleanupVerification.regionalL4QuotaUsageAfterAttempt, 0)
assert.equal(result.cleanupVerification.projectGpusAllRegionsQuotaUsageAfterAttempt, 0)
assert.equal(result.runtimeSideEffects.gcpMutatingCommandsExecuted, true)
assert.equal(result.runtimeSideEffects.computeVmCreateAttempted, true)
for (const [key, value] of Object.entries(result.runtimeSideEffects)) {
  if (key === 'gcpMutatingCommandsExecuted' || key === 'computeVmCreateAttempted') {
    assert.equal(value, true, `${key} must be true for the bounded create attempt`)
  } else {
    assert.equal(value, false, `${key} must remain false`)
  }
}
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10H_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, prompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      attemptedZone: result.attemptedZone,
      suggestedAvailableZones: result.suggestedAvailableZones,
      createAttempted: result.lifecycleAttempt.computeVmCreateAttempted,
      createSucceeded: result.lifecycleAttempt.createSucceeded,
      createBlocker: result.lifecycleAttempt.createBlocker,
      cleanupVerified: result.lifecycleAttempt.cleanupVerified,
      iapTransferExecuted: result.runtimeSideEffects.iapTransferExecuted,
      remoteWheelhouseValidationRun: result.runtimeSideEffects.remoteWheelhouseValidationRun,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
