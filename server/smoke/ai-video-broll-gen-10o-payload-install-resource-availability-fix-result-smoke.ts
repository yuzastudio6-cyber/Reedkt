import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10O_PAYLOAD_INSTALL_RESOURCE_AVAILABILITY_FIX_RESULT,
  AI_VIDEO_BROLL_GEN_10P_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST2_A_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10o-payload-install-resource-availability-fix-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.md'
const NEXT_PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10o-payload-install-resource-availability-fix-result'
const DECISION =
  'ai_video_broll_gen_10o_resource_availability_fix_ready_for_northamerica_northeast2_a_payload_install_proof_no_vm_no_inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10oResourceAvailabilityFix'): string[] {
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
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10o-payload-install-resource-availability-fix.md',
  'docs/ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result.md',
  'docs/ai-video-broll-gen-10m-payload-install-config-availability-fix-result.md',
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(NEXT_PROMPT_PATH)
for (const required of [
  DECISION,
  '`northamerica-northeast1-c` resource-availability failure',
  '`northamerica-northeast1-b` configuration-availability failure',
  'The next strategy must not blindly retry `northamerica-northeast1-b` or `northamerica-northeast1-c`.',
  '10O selects one future bounded no-idle payload/install-readiness proof in `northamerica-northeast2-a`',
  '| `northamerica-northeast2-a` | `UP`, `g2-standard-4` visible, `nvidia-l4` visible, selected |',
  '| `northamerica-northeast2-b` | `UP`, `g2-standard-4` visible, `nvidia-l4` visible, backup only |',
  '| `northamerica-northeast2-c` | `UP`, `g2-standard-4` not visible, `nvidia-l4` not visible, rejected |',
  'First 10N preflight had an invalid filter expression',
  'Use sanitized JSON reads and local filtering',
  'If the future `northamerica-northeast2-a` proof fails',
  '`crossRegionBackupZoneSelected=true`',
  '`selectedRetryRegion=northamerica-northeast2`',
  '`selectedRetryZone=northamerica-northeast2-a`',
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
  AI_VIDEO_BROLL_GEN_10P_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST2_A_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10O result doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10P_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST2_A_PROMPT,
  '`northamerica-northeast2-a`',
  'at most one prompt-scoped no-public-IP proof VM',
  'Confirm IAP firewall or approved equivalent no-public-IP SSH path is present using sanitized JSON reads plus local filtering',
  'If GCP returns `ZONE_RESOURCE_POOL_EXHAUSTED`, `resource_availability`, `configuration_availability`, or equivalent create-time capacity refusal before a VM exists, do not retry another zone inside the same prompt.',
  '`generated_local_fixture_passed`',
]) {
  assert.equal(prompt.includes(required), true, `10P prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_10O_PAYLOAD_INSTALL_RESOURCE_AVAILABILITY_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10o_payload_install_resource_availability_fix_result')
assert.deepEqual(result.priorPayloadInstallProofZones, [
  'us-west4-c',
  'northamerica-northeast1-b',
  'northamerica-northeast1-c',
])
assert.deepEqual(result.priorPayloadInstallProofBlockers, [
  'zone_resource_pool_exhausted_with_details_before_vm_created',
  'configuration_availability_before_vm_created',
  'resource_availability_before_vm_created',
])
assert.equal(result.failedResourceAvailabilityRegion, 'northamerica-northeast1')
assert.deepEqual(result.failedResourceAvailabilityZones, ['northamerica-northeast1-b', 'northamerica-northeast1-c'])
assert.equal(result.selectedCapacityStrategy, 'bounded_cross_region_backup_zone_no_idle_payload_install_proof')
assert.equal(result.selectedRetryRegion, 'northamerica-northeast2')
assert.equal(result.selectedRetryZone, 'northamerica-northeast2-a')
assert.equal(result.sameFailedZoneRetrySelected, false)
assert.equal(result.sameFailedRegionRetrySelected, false)
assert.equal(result.crossRegionBackupZoneSelected, true)
assert.equal(result.delayedRetrySelected, false)
assert.equal(result.capacityReservationSelected, false)
assert.equal(result.alwaysOnGpuSelected, false)
assert.equal(result.cloudRunScaleToZeroSelected, false)
assert.equal(result.queuedJobScaleToZeroSelected, false)
assert.equal(result.stopZoneChurnAfterNextResourceAvailabilityFailure, true)
assert.equal(result.machineType, 'g2-standard-4')
assert.equal(result.selectedGpu, 'nvidia_l4')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.readOnlyChecks.gcpReadOnlyCommandsExecuted, true)
assert.equal(result.readOnlyChecks.localCacheReadOnlyChecksExecuted, true)
assert.equal(result.readOnlyChecks.localWheelhouseReadOnlyChecksExecuted, true)
assert.equal(result.readOnlyChecks.projectMatches, true)
assert.equal(result.readOnlyChecks.accessTokenRefreshPassed, true)
assert.equal(result.readOnlyChecks.complexGcloudFilterAvoided, true)
assert.equal(result.readOnlyChecks.firewallAndResourceChecksUseJsonLocalFiltering, true)
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
      candidate.disposition === 'rejected_known_resource_availability_failure' &&
      candidate.selected === false,
  ),
  true,
)
assert.equal(
  result.readOnlyChecks.candidates.some(
    (candidate) =>
      candidate.zone === 'northamerica-northeast2-a' &&
      candidate.selected &&
      candidate.disposition === 'selected_cross_region_backup_zone_no_idle_payload_install_proof' &&
      candidate.zoneStatus === 'UP' &&
      candidate.machineTypeVisible &&
      candidate.acceleratorVisible &&
      candidate.l4QuotaLimit === 1 &&
      candidate.l4QuotaUsage === 0 &&
      candidate.cpuQuotaLimit === 100 &&
      candidate.ssdTotalGbQuotaLimit === 500,
  ),
  true,
)
assert.equal(
  result.readOnlyChecks.candidates.some(
    (candidate) =>
      candidate.zone === 'northamerica-northeast2-b' &&
      candidate.disposition === 'backup_same_cross_region_if_selected_zone_fails_but_no_retry_inside_10p' &&
      candidate.selected === false,
  ),
  true,
)
assert.equal(
  result.readOnlyChecks.candidates.some(
    (candidate) =>
      candidate.zone === 'northamerica-northeast2-c' &&
      candidate.disposition === 'rejected_required_g2_l4_shape_not_visible' &&
      candidate.machineTypeVisible === false &&
      candidate.acceleratorVisible === false,
  ),
  true,
)
assert.equal(result.failureAnalysis.quotaWasSufficientIn10LAnd10N, true)
assert.equal(result.failureAnalysis.metadataVisibilityWasInsufficientToGuaranteeCapacity, true)
assert.equal(result.failureAnalysis.resourceAvailabilityIsSeparateRisk, true)
assert.equal(result.failureAnalysis.northamericaNortheast1PayloadInstallZoneChurnRejected, true)
assert.equal(result.failureAnalysis.complexGcloudFilterFailureRecorded, true)
assert.equal(result.failureAnalysis.jsonLocalFilteringRequiredNextTime, true)
assert.equal(result.failureAnalysis.capacityReservationRejectedByNoIdlePosture, true)
assert.equal(result.failureAnalysis.alwaysOnGpuRejectedByNoIdlePosture, true)
assert.equal(result.failureAnalysis.scaleToZeroArchitectureNextIfCrossRegionProofStocksOut, true)
assert.equal(
  result.strategyRationale.includes(
    'northamerica_northeast2_a_selected_to_change_region_and_zonal_resource_pool_without_changing_no_public_ip_iap_payload_install_strategy',
  ),
  true,
)
assert.equal(
  result.strategyRationale.includes(
    'invalid_gcloud_filter_failure_avoided_by_json_local_filtering_next_time',
  ),
  true,
)
assert.equal(result.futureRetryPreflightRequired.includes('northamerica_northeast2_a_zone_status'), true)
assert.equal(
  result.futureRetryPreflightRequired.includes('g2_standard_4_visibility_in_northamerica_northeast2_a'),
  true,
)
assert.equal(result.futureRetryPreflightRequired.includes('nvidia_l4_visibility_in_northamerica_northeast2_a'), true)
assert.equal(
  result.futureRetryPreflightRequired.includes(
    'iap_firewall_or_approved_equivalent_no_public_ip_path_present_json_local_filtering_only',
  ),
  true,
)
assert.equal(result.ifNextProofFails.doNotRetryAnotherZoneInsideSamePrompt, true)
assert.equal(result.ifNextProofFails.recommendScaleToZeroArchitecturePrompt, true)
for (const [key, value] of Object.entries(result.runtimeSideEffects)) {
  if (key === 'gcpReadOnlyCommandsExecuted') {
    assert.equal(value, true, `${key} must be true`)
  } else {
    assert.equal(value, false, `${key} must remain false`)
  }
}
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10P_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST2_A_PROMPT)

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
      sameFailedRegionRetrySelected: result.sameFailedRegionRetrySelected,
      crossRegionBackupZoneSelected: result.crossRegionBackupZoneSelected,
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
