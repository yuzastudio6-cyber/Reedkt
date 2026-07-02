import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10K_PAYLOAD_INSTALL_STOCKOUT_FIX_RESULT,
  AI_VIDEO_BROLL_GEN_10L_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST1_B_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10k-payload-install-stockout-fix-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10k-payload-install-stockout-fix-result.md'
const PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-10k-payload-install-stockout-fix-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10k-payload-install-stockout-fix-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10k-payload-install-stockout-fix-result'
const DECISION =
  'ai_video_broll_gen_10k_payload_install_stockout_fix_ready_for_northamerica_northeast1_b_payload_install_proof_no_vm_no_inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10kStockoutFix'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
      ['run.app URL', /\brun\.app\b/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['service account key marker', /\bprivate[_-]?key\b/i],
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
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10k-payload-install-stockout-fix.md',
  'docs/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.md',
  'docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md',
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10k-payload-install-stockout-fix-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
for (const required of [
  DECISION,
  '`us-west4-c` 10J payload/install-readiness stockout',
  '`northamerica-northeast1-b`',
  'run-when-used and stop-when-idle',
  '| `northamerica-northeast1-b` | unattempted, `UP`, `g2-standard-4` visible, `nvidia-l4` visible, L4 quota `1/0`, CPU quota `200/0`, SSD quota `500/0` | selected |',
  'Capacity reservation, always-on GPU, public IP, immediate Docker/Cloud Run execution',
  'Select `northamerica-northeast1-b` as the next bounded no-idle payload/install-readiness proof target.',
  '`gcpReadOnlyCommandsExecuted=true`',
  '`crossRegionRetrySelected=true`',
  '`unattemptedRegionSelected=true`',
  '`selectedRetryRegion=northamerica-northeast1`',
  '`selectedRetryZone=northamerica-northeast1-b`',
  '`capacityReservationSelected=false`',
  '`alwaysOnGpuSelected=false`',
  '`cloudRunScaleToZeroSelected=false`',
  '`vmCreated=false`',
  '`dependencyInstalledOnVm=false`',
  '`modelImportRun=false`',
  '`modelInferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  AI_VIDEO_BROLL_GEN_10L_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST1_B_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10K stockout fix doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10L_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST1_B_PROMPT,
  'attempt exactly one prompt-scoped no-public-IP `g2-standard-4` VM',
  '`northamerica-northeast1-b`',
  'Stop and record a blocked result',
  'Do not retry another zone inside the same prompt',
  '`generated_local_fixture_passed`',
]) {
  assert.equal(prompt.includes(required), true, `10L prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_10K_PAYLOAD_INSTALL_STOCKOUT_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10k_payload_install_stockout_fix_result')
assert.deepEqual(result.priorPayloadInstallProofZones, ['us-west4-c'])
assert.deepEqual(result.priorPayloadInstallProofBlockers, ['zone_resource_pool_exhausted_with_details_before_vm_created'])
assert.equal(result.selectedCapacityStrategy, 'bounded_cross_region_unattempted_no_idle_payload_install_proof')
assert.equal(result.selectedRetryRegion, 'northamerica-northeast1')
assert.equal(result.selectedRetryZone, 'northamerica-northeast1-b')
assert.equal(result.sameZoneRetrySelected, false)
assert.equal(result.sameRegionRetrySelected, false)
assert.equal(result.crossRegionRetrySelected, true)
assert.equal(result.unattemptedRegionSelected, true)
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
assert.equal(result.readOnlyChecks.localCacheReadOnlyChecksExecuted, true)
assert.equal(result.readOnlyChecks.localWheelhouseReadOnlyChecksExecuted, true)
assert.equal(result.readOnlyChecks.projectMatches, true)
assert.equal(result.readOnlyChecks.accessTokenRefreshPassed, true)
assert.equal(result.readOnlyChecks.globalGpusAllRegionsQuotaLimit, 1)
assert.equal(result.readOnlyChecks.globalGpusAllRegionsQuotaUsage, 0)
assert.equal(result.readOnlyChecks.proofServiceAccountPresent, true)
assert.equal(result.readOnlyChecks.proofServiceAccountDisabled, false)
assert.equal(result.readOnlyChecks.proofServiceAccountValueStored, false)
assert.equal(result.readOnlyChecks.iapFirewallRulePresent, true)
assert.equal(result.readOnlyChecks.iapFirewallSourceRange, '35.235.240.0/20')
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.instances, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.disks, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.addresses, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.reservations, 0)
assert.equal(result.readOnlyChecks.privateModelCacheReadinessPassed, true)
assert.equal(result.readOnlyChecks.privateModelCacheRuntimeEssentialFileCount, 19)
assert.equal(result.readOnlyChecks.privateModelCacheAggregateBytes, 28928887859)
assert.equal(result.readOnlyChecks.privateWheelhouseComplete, true)
assert.equal(result.readOnlyChecks.privateWheelhouseRealWheelCount, 66)
assert.equal(result.readOnlyChecks.privateWheelhouseAggregateBytes, 2802483442)
assert.equal(result.readOnlyChecks.privateWheelhouseAggregateSha256, '55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64')
assert.equal(
  result.readOnlyChecks.candidates.some(
    (candidate) =>
      candidate.zone === 'northamerica-northeast1-b' &&
      candidate.selected &&
      candidate.disposition === 'selected_unattempted_cross_region_no_idle_payload_install_proof' &&
      candidate.zoneStatus === 'UP' &&
      candidate.machineTypeVisible &&
      candidate.acceleratorVisible &&
      candidate.l4QuotaLimit === 1 &&
      candidate.l4QuotaUsage === 0 &&
      candidate.cpuQuotaLimit === 200,
  ),
  true,
)
assert.equal(
  result.readOnlyChecks.candidates.some(
    (candidate) =>
      candidate.zone === 'us-west4-c' &&
      candidate.disposition === 'rejected_recent_payload_install_stockout' &&
      candidate.selected === false,
  ),
  true,
)
assert.equal(
  result.strategyRationale.includes(
    'same_zone_retry_rejected_because_us_west4_c_just_stocked_out_during_payload_install_proof',
  ),
  true,
)
assert.equal(result.strategyRationale.includes('always_on_gpu_rejected_by_no_idle_requirement'), true)
assert.equal(
  result.strategyRationale.includes(
    'cloud_run_scale_to_zero_deferred_to_separate_runtime_architecture_after_payload_install_proof_strategy',
  ),
  true,
)
assert.equal(result.futureRetryPreflightRequired.includes('northamerica_northeast1_b_zone_status'), true)
assert.equal(result.futureRetryPreflightRequired.includes('northamerica_northeast1_regional_nvidia_l4_quota'), true)
assert.equal(result.futureRetryPreflightRequired.includes('proof_vm_disk_address_reservation_absent'), true)
for (const [key, value] of Object.entries(result.runtimeSideEffects)) {
  if (key === 'gcpReadOnlyCommandsExecuted') {
    assert.equal(value, true, `${key} must be true`)
  } else {
    assert.equal(value, false, `${key} must remain false`)
  }
}
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10L_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST1_B_PROMPT)

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
      crossRegionRetrySelected: result.crossRegionRetrySelected,
      capacityReservationSelected: result.capacityReservationSelected,
      alwaysOnGpuSelected: result.alwaysOnGpuSelected,
      cloudRunScaleToZeroSelected: result.cloudRunScaleToZeroSelected,
      computeVmCreated: result.runtimeSideEffects.computeVmCreated,
      iapTransferExecuted: result.runtimeSideEffects.iapTransferExecuted,
      dependencyInstalledOnVm: result.runtimeSideEffects.dependencyInstalledOnVm,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
