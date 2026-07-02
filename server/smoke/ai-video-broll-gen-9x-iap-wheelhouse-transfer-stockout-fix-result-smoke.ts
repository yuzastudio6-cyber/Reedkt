import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_9X_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_RESULT,
  AI_VIDEO_BROLL_GEN_9Y_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST4_C_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.md'
const PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result'
const DECISION =
  'ai_video_broll_gen_9x_iap_wheelhouse_transfer_stockout_fix_ready_for_us_east4_c_transfer_proof_no_vm_no_inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll9xStockoutFix'): string[] {
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
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix.md',
  'docs/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.md',
  'docs/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
for (const required of [
  DECISION,
  '`us-east4-a`',
  '`us-east4-c`',
  '| `us-east4-c` | `us-east4` | `UP` | true | true | limit `1`, usage `0` | limit `200`, usage `0` | limit `500`, usage `0` | selected |',
  'Select `us-east4-c` as the next bounded no-idle IAP wheelhouse transfer proof target.',
  'Capacity reservation is not selected because it is mutating, potentially billable',
  'Always-on GPU is rejected',
  'Cloud Run or queued-job scale-to-zero may be a future architecture track',
  '`gcpReadOnlyCommandsExecuted=true`',
  '`localWheelhouseReadOnlyChecksExecuted=true`',
  '`crossZoneRetrySelected=true`',
  '`sameRegionRetrySelected=true`',
  '`crossRegionRetrySelected=false`',
  '`selectedRetryZone=us-east4-c`',
  '`selectedRetryRegion=us-east4`',
  '`capacityReservationSelected=false`',
  '`alwaysOnGpuSelected=false`',
  '`cloudRunScaleToZeroSelected=false`',
  '`queuedJobScaleToZeroSelected=false`',
  '`delayedRetrySelected=false`',
  '`vmCreated=false`',
  '`iapTransferExecuted=false`',
  '`modelInferenceRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  AI_VIDEO_BROLL_GEN_9Y_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST4_C_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `9X stockout fix doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_9Y_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST4_C_PROMPT,
  'attempt exactly one prompt-scoped no-public-IP `g2-standard-4` VM',
  'Stop before VM create if any preflight check fails',
  '`us-east4-c`',
  'model inference',
  '`generated_local_fixture_passed`',
]) {
  assert.equal(prompt.includes(required), true, `9Y prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_9X_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_9x_iap_wheelhouse_transfer_stockout_fix_result')
assert.deepEqual(result.priorTransferProofZones, [
  'us-central1-c',
  'us-central1-c',
  'us-west1-a',
  'us-west1-b',
  'us-west1-c',
  'us-east4-a',
])
assert.equal(result.selectedCapacityStrategy, 'bounded_same_region_no_idle_transfer_proof_retry')
assert.equal(result.selectedRetryZone, 'us-east4-c')
assert.equal(result.selectedRetryRegion, 'us-east4')
assert.equal(result.crossZoneRetrySelected, true)
assert.equal(result.sameRegionRetrySelected, true)
assert.equal(result.crossRegionRetrySelected, false)
assert.equal(result.capacityReservationSelected, false)
assert.equal(result.alwaysOnGpuSelected, false)
assert.equal(result.cloudRunScaleToZeroSelected, false)
assert.equal(result.queuedJobScaleToZeroSelected, false)
assert.equal(result.delayedRetrySelected, false)
assert.equal(result.blockedNoSafeTargetSelected, false)
assert.equal(result.machineType, 'g2-standard-4')
assert.equal(result.selectedGpu, 'nvidia_l4')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.readOnlyChecks.gcpReadOnlyCommandsExecuted, true)
assert.equal(result.readOnlyChecks.localWheelhouseReadOnlyChecksExecuted, true)
assert.equal(result.readOnlyChecks.projectMatches, true)
assert.equal(result.readOnlyChecks.accessTokenRefreshPassed, true)
assert.equal(result.readOnlyChecks.latestGpuImageFamilyReady, true)
assert.equal(result.readOnlyChecks.globalGpusAllRegionsQuotaLimit, 1)
assert.equal(result.readOnlyChecks.globalGpusAllRegionsQuotaUsage, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.instances, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.disks, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.addresses, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.reservations, 0)
assert.equal(result.readOnlyChecks.proofServiceAccountPresent, true)
assert.equal(result.readOnlyChecks.proofServiceAccountEnabled, true)
assert.equal(result.readOnlyChecks.proofServiceAccountValueStored, false)
assert.equal(result.readOnlyChecks.iapFirewallRulePresent, true)
assert.equal(result.readOnlyChecks.iapFirewallTargetTagPresent, true)
assert.equal(result.readOnlyChecks.iapFirewallDisabled, false)
assert.equal(result.readOnlyChecks.privateModelCacheReadinessPassed, true)
assert.equal(result.readOnlyChecks.privateModelCacheRuntimeEssentialFileCount, 19)
assert.equal(result.readOnlyChecks.privateModelCacheAggregateBytes, 28928887859)
assert.equal(result.readOnlyChecks.privateWheelhouseComplete, true)
assert.equal(result.readOnlyChecks.privateWheelhouseRealWheelCount, 66)
assert.equal(result.readOnlyChecks.privateWheelhouseAggregateBytes, 2802483442)
assert.equal(
  result.readOnlyChecks.candidates.some(
    (candidate) =>
      candidate.zone === 'us-east4-c' &&
      candidate.selected &&
      candidate.disposition === 'selected_same_region_cross_zone_retry' &&
      candidate.zoneStatus === 'UP' &&
      candidate.machineTypeVisible &&
      candidate.acceleratorVisible &&
      candidate.l4QuotaLimit === 1 &&
      candidate.l4QuotaUsage === 0,
  ),
  true,
)
assert.equal(result.strategyRationale.includes('us_east4_a_transfer_proof_stocked_out_before_vm_creation'), true)
assert.equal(
  result.strategyRationale.includes(
    'us_east4_c_is_first_untried_candidate_after_us_east4_a_with_visible_shape_and_unused_l4_quota',
  ),
  true,
)
assert.equal(result.strategyRationale.includes('capacity_reservation_rejected_as_mutating_potentially_billable_idle_capacity'), true)
assert.equal(result.strategyRationale.includes('always_on_gpu_rejected_by_no_idle_requirement'), true)
assert.equal(result.futureRetryPreflightRequired.includes('us_east4_c_zone_status'), true)
assert.equal(result.futureRetryPreflightRequired.includes('us_east4_regional_nvidia_l4_quota'), true)
assert.equal(result.futureRetryPreflightRequired.includes('proof_vm_disk_address_reservation_absent'), true)
for (const [key, value] of Object.entries(result.runtimeSideEffects)) {
  assert.equal(value, false, `${key} must remain false`)
}
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_9Y_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST4_C_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, prompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      selectedCapacityStrategy: result.selectedCapacityStrategy,
      selectedRetryZone: result.selectedRetryZone,
      selectedRetryRegion: result.selectedRetryRegion,
      crossZoneRetrySelected: result.crossZoneRetrySelected,
      capacityReservationSelected: result.capacityReservationSelected,
      cloudRunScaleToZeroSelected: result.cloudRunScaleToZeroSelected,
      computeVmCreated: result.runtimeSideEffects.computeVmCreated,
      iapTransferExecuted: result.runtimeSideEffects.iapTransferExecuted,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
