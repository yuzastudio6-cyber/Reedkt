import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_9R_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_RESULT,
  AI_VIDEO_BROLL_GEN_9S_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST1_B_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.md'
const PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result'
const DECISION =
  'ai_video_broll_gen_9r_iap_wheelhouse_transfer_stockout_fix_ready_for_us_west1_b_transfer_proof_no_vm_no_inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll9rStockoutFix'): string[] {
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
  'docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md',
  'docs/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.md',
  'docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
for (const required of [
  DECISION,
  '`us-west1-a`',
  '`us-west1-b`',
  '| `us-west1-b` | `us-west1` | `UP` | true | true | limit `1`, usage `0` | limit `100`, usage `0` | limit `500`, usage `0` |',
  'Select `us-west1-b` as the next bounded no-idle IAP wheelhouse transfer proof target.',
  '`gcpReadOnlyCommandsExecuted=true`',
  '`localWheelhouseReadOnlyChecksExecuted=true`',
  '`alternateZoneSelected=true`',
  '`selectedRetryZone=us-west1-b`',
  '`capacityReservationSelected=false`',
  '`delayedRetrySelected=false`',
  '`vmCreated=false`',
  '`iapTransferExecuted=false`',
  '`modelInferenceRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  AI_VIDEO_BROLL_GEN_9S_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST1_B_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `9R stockout fix doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_9S_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST1_B_PROMPT,
  'create at most one prompt-scoped no-public-IP `g2-standard-4` VM',
  'Stop before VM create if any preflight check fails',
  'model inference',
  '`generated_local_fixture_passed` claim',
]) {
  assert.equal(prompt.includes(required), true, `9S prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_9R_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_9r_iap_wheelhouse_transfer_stockout_fix_result')
assert.deepEqual(result.priorTransferProofZones, ['us-central1-c', 'us-central1-c', 'us-west1-a'])
assert.equal(result.selectedRetryZone, 'us-west1-b')
assert.equal(result.selectedRetryRegion, 'us-west1')
assert.equal(result.sameRegionAlternateSelected, true)
assert.equal(result.capacityReservationSelected, false)
assert.equal(result.delayedRetrySelected, false)
assert.equal(result.machineType, 'g2-standard-4')
assert.equal(result.selectedGpu, 'nvidia_l4')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.readOnlyChecks.gcpReadOnlyCommandsExecuted, true)
assert.equal(result.readOnlyChecks.localWheelhouseReadOnlyChecksExecuted, true)
assert.equal(result.readOnlyChecks.projectMatches, true)
assert.equal(result.readOnlyChecks.accessTokenRefreshPassed, true)
assert.equal(result.readOnlyChecks.globalGpusAllRegionsQuotaLimit, 1)
assert.equal(result.readOnlyChecks.globalGpusAllRegionsQuotaUsage, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.instances, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.disks, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.addresses, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.reservations, 0)
assert.equal(result.readOnlyChecks.proofServiceAccountValueStored, false)
assert.equal(result.readOnlyChecks.privateWheelhouseComplete, true)
assert.equal(result.readOnlyChecks.privateWheelhouseRealWheelCount, 66)
assert.equal(result.readOnlyChecks.privateWheelhouseAggregateBytes, 2802483442)
assert.equal(
  result.readOnlyChecks.candidates.some(
    (candidate) =>
      candidate.zone === 'us-west1-b' &&
      candidate.selected &&
      candidate.zoneStatus === 'UP' &&
      candidate.machineTypeVisible &&
      candidate.acceleratorVisible &&
      candidate.l4QuotaLimit === 1 &&
      candidate.l4QuotaUsage === 0,
  ),
  true,
)
assert.equal(result.selectionRationale.includes('us_west1_a_transfer_proof_stocked_out_before_vm_creation'), true)
assert.equal(result.selectionRationale.includes('avoids_capacity_reservation_mutation_now'), true)
assert.equal(result.selectionRationale.includes('avoids_always_on_gpu_or_idle_capacity'), true)
assert.equal(result.futureRetryPreflightRequired.includes('us_west1_b_zone_status'), true)
assert.equal(result.futureRetryPreflightRequired.includes('proof_vm_disk_address_reservation_absent'), true)
for (const [key, value] of Object.entries(result.runtimeSideEffects)) {
  assert.equal(value, false, `${key} must remain false`)
}
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_9S_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST1_B_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, prompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      selectedRetryZone: result.selectedRetryZone,
      selectedRetryRegion: result.selectedRetryRegion,
      sameRegionAlternateSelected: result.sameRegionAlternateSelected,
      capacityReservationSelected: result.capacityReservationSelected,
      delayedRetrySelected: result.delayedRetrySelected,
      gcpReadOnlyCommandsExecuted: result.readOnlyChecks.gcpReadOnlyCommandsExecuted,
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
