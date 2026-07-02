import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10M_PAYLOAD_INSTALL_CONFIG_AVAILABILITY_FIX_RESULT,
  AI_VIDEO_BROLL_GEN_10N_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST1_C_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10m-payload-install-config-availability-fix-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10m-payload-install-config-availability-fix-result.md'
const NEXT_PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-10m-payload-install-config-availability-fix-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10m-payload-install-config-availability-fix-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10m-payload-install-config-availability-fix-result'
const DECISION =
  'ai_video_broll_gen_10m_config_availability_fix_ready_for_northamerica_northeast1_c_payload_install_proof_no_vm_no_inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10mConfigAvailabilityFix'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
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
  NEXT_PROMPT_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10m-payload-install-config-availability-fix.md',
  'docs/ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b-result.md',
  'docs/ai-video-broll-gen-10k-payload-install-stockout-fix-result.md',
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10m-payload-install-config-availability-fix-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(NEXT_PROMPT_PATH)
for (const required of [
  DECISION,
  '`northamerica-northeast1-b` 10L payload/install-readiness failure',
  '`configuration_availability`',
  'The 10L failure was not a quota failure.',
  'The next strategy must not blindly retry `northamerica-northeast1-b`.',
  'Select `northamerica-northeast1-c` as the next bounded no-idle payload/install-readiness proof target.',
  '| `northamerica-northeast1-b` | `UP`, `g2-standard-4` visible, `nvidia-l4` visible, rejected because 10L failed there |',
  '| `northamerica-northeast1-c` | `UP`, `g2-standard-4` visible, `nvidia-l4` visible, selected |',
  '| Quota was sufficient |',
  '| Metadata was visible |',
  '| Exact shape failed |',
  'Do not request more quota for this specific failure',
  'Do not rerun the same zone as the next step',
  '`sameFailedZoneRetrySelected=false`',
  '`sameRegionBackupZoneSelected=true`',
  '`selectedRetryRegion=northamerica-northeast1`',
  '`selectedRetryZone=northamerica-northeast1-c`',
  '`capacityReservationSelected=false`',
  '`alwaysOnGpuSelected=false`',
  '`cloudRunScaleToZeroSelected=false`',
  '`vmCreated=false`',
  '`dependencyInstalledOnVm=false`',
  '`modelImportRun=false`',
  '`modelInferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`dryRunPassedClaimed=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  AI_VIDEO_BROLL_GEN_10N_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST1_C_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10M result doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10N_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST1_C_PROMPT,
  '`northamerica-northeast1-c`',
  'attempt exactly one prompt-scoped no-public-IP `g2-standard-4` VM',
  'Transfer only the private wheelhouse payload.',
  'Do not import Wan, instantiate a pipeline, run inference, or generate media.',
  'If GCP returns resource pool exhaustion or configuration availability failure, do not retry another zone inside the same prompt.',
  '`generated_local_fixture_passed`',
]) {
  assert.equal(prompt.includes(required), true, `10N prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_10M_PAYLOAD_INSTALL_CONFIG_AVAILABILITY_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10m_payload_install_config_availability_fix_result')
assert.deepEqual(result.priorPayloadInstallProofZones, ['us-west4-c', 'northamerica-northeast1-b'])
assert.deepEqual(result.priorPayloadInstallProofBlockers, [
  'zone_resource_pool_exhausted_with_details_before_vm_created',
  'configuration_availability_before_vm_created',
])
assert.equal(result.failedConfigurationAvailabilityZone, 'northamerica-northeast1-b')
assert.equal(result.failedConfigurationAvailabilityReason, 'configuration_availability')
assert.equal(result.selectedCapacityStrategy, 'bounded_same_region_backup_zone_no_idle_payload_install_proof')
assert.equal(result.selectedRetryRegion, 'northamerica-northeast1')
assert.equal(result.selectedRetryZone, 'northamerica-northeast1-c')
assert.equal(result.sameFailedZoneRetrySelected, false)
assert.equal(result.sameRegionBackupZoneSelected, true)
assert.equal(result.crossRegionBackupZoneSelected, false)
assert.equal(result.delayedRetrySelected, false)
assert.equal(result.capacityReservationSelected, false)
assert.equal(result.alwaysOnGpuSelected, false)
assert.equal(result.cloudRunScaleToZeroSelected, false)
assert.equal(result.queuedJobScaleToZeroSelected, false)
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
assert.equal(result.readOnlyChecks.projectCpuQuotaLimit, 32)
assert.equal(result.readOnlyChecks.projectCpuQuotaUsage, 0)
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
      candidate.disposition === 'rejected_known_configuration_availability_failure' &&
      candidate.selected === false,
  ),
  true,
)
assert.equal(
  result.readOnlyChecks.candidates.some(
    (candidate) =>
      candidate.zone === 'northamerica-northeast1-c' &&
      candidate.selected &&
      candidate.disposition === 'selected_same_region_backup_zone_no_idle_payload_install_proof' &&
      candidate.zoneStatus === 'UP' &&
      candidate.machineTypeVisible &&
      candidate.acceleratorVisible &&
      candidate.l4QuotaLimit === 1 &&
      candidate.l4QuotaUsage === 0 &&
      candidate.cpuQuotaLimit === 200 &&
      candidate.ssdTotalGbQuotaLimit === 500,
  ),
  true,
)
assert.equal(
  result.readOnlyChecks.candidates.some(
    (candidate) =>
      candidate.zone === 'northamerica-northeast2-a' &&
      candidate.disposition === 'backup_cross_region_unattempted_zone_if_same_region_backup_fails' &&
      candidate.selected === false,
  ),
  true,
)
assert.equal(result.failureAnalysis.quotaWasSufficientIn10L, true)
assert.equal(result.failureAnalysis.metadataVisibilityWasInsufficientIn10L, true)
assert.equal(result.failureAnalysis.configurationAvailabilityIsSeparateRisk, true)
assert.equal(result.failureAnalysis.sameFailedZoneBlindRetryRejected, true)
assert.equal(result.failureAnalysis.capacityReservationRejectedByNoIdlePosture, true)
assert.equal(result.failureAnalysis.alwaysOnGpuRejectedByNoIdlePosture, true)
assert.equal(
  result.strategyRationale.includes(
    'northamerica_northeast1_b_rejected_because_10l_failed_exact_g2_standard_4_l4_shape_with_configuration_availability',
  ),
  true,
)
assert.equal(
  result.strategyRationale.includes(
    'configuration_availability_cannot_be_fully_proven_until_create_time',
  ),
  true,
)
assert.equal(result.strategyRationale.includes('always_on_gpu_rejected_by_no_idle_requirement'), true)
assert.equal(result.futureRetryPreflightRequired.includes('northamerica_northeast1_c_zone_status'), true)
assert.equal(
  result.futureRetryPreflightRequired.includes('g2_standard_4_visibility_in_northamerica_northeast1_c'),
  true,
)
assert.equal(result.futureRetryPreflightRequired.includes('nvidia_l4_visibility_in_northamerica_northeast1_c'), true)
for (const [key, value] of Object.entries(result.runtimeSideEffects)) {
  if (key === 'gcpReadOnlyCommandsExecuted') {
    assert.equal(value, true, `${key} must be true`)
  } else {
    assert.equal(value, false, `${key} must remain false`)
  }
}
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10N_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST1_C_PROMPT)

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
      sameFailedZoneRetrySelected: result.sameFailedZoneRetrySelected,
      sameRegionBackupZoneSelected: result.sameRegionBackupZoneSelected,
      capacityReservationSelected: result.capacityReservationSelected,
      alwaysOnGpuSelected: result.alwaysOnGpuSelected,
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
