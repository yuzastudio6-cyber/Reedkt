import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10N_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST1_C_RESULT,
  AI_VIDEO_BROLL_GEN_10O_PAYLOAD_INSTALL_RESOURCE_AVAILABILITY_FIX_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result'

const ROOT = process.cwd()
const DOC_PATH =
  'docs/ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result.md'
const NEXT_PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10o-payload-install-resource-availability-fix.md'
const SPEC_PATH =
  'src/backend/mock/mock-ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result.ts'
const SMOKE_PATH =
  'server/smoke/ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result-smoke.ts'
const PACKAGE_SCRIPT =
  'smoke:ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10nResult'): string[] {
  const findings: string[] = []
  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['Supabase project URL', /https:\/\/[a-z0-9]{20}\.supabase\.co/i],
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

for (const file of [DOC_PATH, NEXT_PROMPT_PATH, SPEC_PATH, SMOKE_PATH]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result-smoke.ts',
)

const doc = read(DOC_PATH)
for (const required of [
  'ai_video_broll_gen_10n_northamerica_northeast1_c_payload_install_proof_blocked_resource_availability_cleanup_verified',
  '`northamerica-northeast1-c`',
  '`ZONE_RESOURCE_POOL_EXHAUSTED`',
  '`resource_availability`',
  'No replacement zone was returned.',
  'cleanup verified',
  'full wheelhouse payload transfer attempted: `false`',
  'offline dependency install attempted: `false`',
  'model import attempted: `false`',
  'model inference attempted: `false`',
  'generatedLocalFixturePassedClaimed=false',
  AI_VIDEO_BROLL_GEN_10O_PAYLOAD_INSTALL_RESOURCE_AVAILABILITY_FIX_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10N result doc missing ${required}`)
}

const nextPrompt = read(NEXT_PROMPT_PATH)
for (const required of [
  AI_VIDEO_BROLL_GEN_10O_PAYLOAD_INSTALL_RESOURCE_AVAILABILITY_FIX_PROMPT,
  'This is a no-VM strategy prompt.',
  '`northamerica-northeast1-b` and `northamerica-northeast1-c` both failed',
  '`northamerica-northeast2-a` and `northamerica-northeast2-b`',
  'run only when used, stop/delete when idle',
  'Reject capacity reservation',
]) {
  assert.equal(nextPrompt.includes(required), true, `10O prompt missing ${required}`)
}

const result =
  AI_VIDEO_BROLL_GEN_10N_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST1_C_RESULT
assert.equal(
  result.decision,
  'ai_video_broll_gen_10n_northamerica_northeast1_c_payload_install_proof_blocked_resource_availability_cleanup_verified',
)
assert.equal(result.mode, 'ai_video_broll_gen_10n_no_idle_l4_iap_wheelhouse_payload_install_proof_northamerica_northeast1_c_result')
assert.equal(result.attemptedRegion, 'northamerica-northeast1')
assert.equal(result.attemptedZone, 'northamerica-northeast1-c')
assert.equal(result.machineType, 'g2-standard-4')
assert.equal(result.selectedGpu, 'nvidia_l4')
assert.equal(result.freshPreflight.projectMatches, true)
assert.equal(result.freshPreflight.accessTokenRefreshPassed, true)
assert.equal(result.freshPreflight.zoneStatus, 'UP')
assert.equal(result.freshPreflight.machineTypeVisible, true)
assert.equal(result.freshPreflight.acceleratorVisible, true)
assert.equal(result.freshPreflight.regionalL4QuotaLimit, 1)
assert.equal(result.freshPreflight.regionalL4QuotaUsage, 0)
assert.equal(result.freshPreflight.privateWheelhouseRealWheelCount, 66)
assert.equal(result.freshPreflight.privateWheelhouseAggregateBytes, 2802483442)
assert.equal(result.freshPreflight.privateWheelhouseAggregateSha256, '55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64')
assert.equal(result.lifecycleAttempt.computeVmCreateAttempted, true)
assert.equal(result.lifecycleAttempt.computeVmCreated, false)
assert.equal(result.lifecycleAttempt.createBlocker, 'zone_resource_pool_exhausted')
assert.equal(result.lifecycleAttempt.createReason, 'resource_availability')
assert.deepEqual(result.lifecycleAttempt.createSuggestedAvailableZones, [])
assert.equal(result.lifecycleAttempt.createCompletedWithNoVmResource, true)
assert.equal(result.lifecycleAttempt.iapSshReadinessAttempted, false)
assert.equal(result.lifecycleAttempt.fullWheelhousePayloadTransferAttempted, false)
assert.equal(result.lifecycleAttempt.offlineDependencyInstallAttempted, false)
assert.equal(result.lifecycleAttempt.modelImportAttempted, false)
assert.equal(result.lifecycleAttempt.modelInferenceAttempted, false)
assert.equal(result.lifecycleAttempt.cleanupVerified, true)
assert.equal(result.cleanupVerification.proofInstancePresent, false)
assert.equal(result.cleanupVerification.proofDiskPresent, false)
assert.equal(result.cleanupVerification.proofStaticAddressPresent, false)
assert.equal(result.cleanupVerification.proofReservationPresent, false)
assert.equal(result.cleanupVerification.regionalL4QuotaUsageAfterAttempt, 0)
assert.equal(result.runtimeSideEffects.gcpMutatingCommandsExecuted, true)
assert.equal(result.runtimeSideEffects.computeVmCreateAttempted, true)
assert.equal(result.runtimeSideEffects.computeVmCreated, false)
assert.equal(result.runtimeSideEffects.sshSessionOpened, false)
assert.equal(result.runtimeSideEffects.iapTransferExecuted, false)
assert.equal(result.runtimeSideEffects.dependencyInstalledOnVm, false)
assert.equal(result.runtimeSideEffects.modelImportRun, false)
assert.equal(result.runtimeSideEffects.modelInferenceRun, false)
assert.equal(result.runtimeSideEffects.generatedAssetsCreated, false)
assert.equal(result.runtimeSideEffects.supabaseTouched, false)
assert.equal(result.runtimeSideEffects.sqlExecuted, false)
assert.equal(result.runtimeSideEffects.creditMutationCreated, false)
assert.equal(result.runtimeSideEffects.betaUnlocked, false)
assert.equal(result.runtimeSideEffects.productionUnlocked, false)
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10O_PAYLOAD_INSTALL_RESOURCE_AVAILABILITY_FIX_PROMPT)

const forbidden = scanForbiddenValues(result)
assert.deepEqual(forbidden, [])

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      attemptedZone: result.attemptedZone,
      createAttempted: result.lifecycleAttempt.computeVmCreateAttempted,
      computeVmCreated: result.lifecycleAttempt.computeVmCreated,
      createBlocker: result.lifecycleAttempt.createBlocker,
      createReason: result.lifecycleAttempt.createReason,
      cleanupVerified: result.lifecycleAttempt.cleanupVerified,
      fullWheelhousePayloadTransferred: result.lifecycleAttempt.fullWheelhousePayloadTransferred,
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
