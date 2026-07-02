import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10I_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST4_C_RESULT,
  AI_VIDEO_BROLL_GEN_10J_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_US_WEST4_C_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md'
const NEXT_PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c.md'
const SPEC_PATH =
  'src/backend/mock/mock-ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.ts'
const SMOKE_PATH =
  'server/smoke/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result'
const DECISION = 'ai_video_broll_gen_10i_us_west4_c_iap_manifest_transfer_proof_passed_cleanup_verified'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10iResult'): string[] {
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
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c.md',
  'docs/ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result.md',
  'docs/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const nextPrompt = read(NEXT_PROMPT_PATH)
for (const required of [
  DECISION,
  '`us-west4-c`',
  'no-public-IP `g2-standard-4` VM',
  'IAP manifest transfer succeeded: `true`',
  'remote manifest readability passed: `true`',
  'remote manifest wheel count: `66`',
  'full wheelhouse payload transferred: `false`',
  'dependency install attempted: `false`',
  'model import attempted: `false`',
  'model inference attempted: `false`',
  'cleanup verified: `true`',
  'regional L4 quota usage after cleanup: `0`',
  '`gcpMutatingCommandsExecuted=true`',
  '`computeVmCreated=true`',
  '`computeVmDeleted=true`',
  '`externalIpCreated=false`',
  '`sshSessionOpened=true`',
  '`iapTransferExecuted=true`',
  '`remoteWheelhouseValidationRun=true`',
  '`remoteWheelhouseValidationPassed=true`',
  '`dependencyInstalledOnVm=false`',
  '`modelImportRun=false`',
  '`modelInferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`dryRunPassedClaimed=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  AI_VIDEO_BROLL_GEN_10J_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_US_WEST4_C_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10I result doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10J_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_US_WEST4_C_PROMPT,
  'attempt exactly one prompt-scoped no-public-IP `g2-standard-4` VM',
  'offline dependency install readiness',
  'Do not import Wan/Wan2.1',
  'Do not create public IPs',
  '`generated_local_fixture_passed`',
]) {
  assert.equal(nextPrompt.includes(required), true, `10J prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_10I_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST4_C_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10i_no_idle_l4_iap_wheelhouse_transfer_proof_us_west4_c_result')
assert.equal(result.targetRegion, 'us-west4')
assert.equal(result.targetZone, 'us-west4-c')
assert.equal(result.machineType, 'g2-standard-4')
assert.equal(result.selectedGpu, 'nvidia_l4')
assert.equal(result.lifecycleStatus, 'passed')
assert.equal(result.lifecycleBlocker, 'none')
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
assert.equal(result.freshPreflight.proofServiceAccountPresent, true)
assert.equal(result.freshPreflight.proofServiceAccountValueStored, false)
assert.equal(result.freshPreflight.iapFirewallRulePresent, true)
assert.equal(result.freshPreflight.resourcesMatchingProofNameBeforeCreate.instances, 0)
assert.equal(result.freshPreflight.privateModelCacheReadinessPassed, true)
assert.equal(result.freshPreflight.privateWheelhouseComplete, true)
assert.equal(result.freshPreflight.privateWheelhouseRealWheelCount, 66)
assert.equal(result.lifecycleAttempt.computeVmCreateAttempted, true)
assert.equal(result.lifecycleAttempt.computeVmCreated, true)
assert.equal(result.lifecycleAttempt.createSucceeded, true)
assert.equal(result.lifecycleAttempt.externalNatIpPresentAfterCreate, false)
assert.equal(result.lifecycleAttempt.iapSshReady, true)
assert.equal(result.lifecycleAttempt.iapManifestTransferSucceeded, true)
assert.equal(result.lifecycleAttempt.remoteManifestValidationSucceeded, true)
assert.equal(result.lifecycleAttempt.remoteManifestWheelCount, 66)
assert.equal(result.lifecycleAttempt.remoteManifestAggregateBytes, 2802483442)
assert.equal(
  result.lifecycleAttempt.remoteManifestAggregateSha256,
  '55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64',
)
assert.equal(result.lifecycleAttempt.fullWheelhousePayloadTransferred, false)
assert.equal(result.lifecycleAttempt.dependencyInstallAttempted, false)
assert.equal(result.lifecycleAttempt.modelImportAttempted, false)
assert.equal(result.lifecycleAttempt.modelInferenceAttempted, false)
assert.equal(result.lifecycleAttempt.deleteAttempted, true)
assert.equal(result.lifecycleAttempt.deleteSucceeded, true)
assert.equal(result.lifecycleAttempt.cleanupVerified, true)
assert.equal(result.cleanupVerification.proofInstancePresent, false)
assert.equal(result.cleanupVerification.proofDiskPresent, false)
assert.equal(result.cleanupVerification.proofStaticAddressPresent, false)
assert.equal(result.cleanupVerification.proofReservationPresent, false)
assert.equal(result.cleanupVerification.regionalL4QuotaUsageAfterCleanup, 0)
assert.equal(result.runtimeSideEffects.gcpMutatingCommandsExecuted, true)
assert.equal(result.runtimeSideEffects.computeVmCreateAttempted, true)
assert.equal(result.runtimeSideEffects.computeVmCreated, true)
assert.equal(result.runtimeSideEffects.computeVmDeleted, true)
assert.equal(result.runtimeSideEffects.bootDiskCreatedWithVm, true)
assert.equal(result.runtimeSideEffects.bootDiskAutoDeleted, true)
assert.equal(result.runtimeSideEffects.sshSessionOpened, true)
assert.equal(result.runtimeSideEffects.iapTransferExecuted, true)
assert.equal(result.runtimeSideEffects.iapTransferSucceeded, true)
assert.equal(result.runtimeSideEffects.remoteWheelhouseValidationRun, true)
assert.equal(result.runtimeSideEffects.remoteWheelhouseValidationPassed, true)
for (const key of [
  'quotaRequestCreated',
  'standaloneDiskCreated',
  'externalIpCreated',
  'publicIpCreated',
  'reservationCreated',
  'networkChanged',
  'serviceAccountCreated',
  'serviceAccountKeyCreated',
  'firewallRuleCreated',
  'bucketCreated',
  'cloudRunJobCreated',
  'dockerRun',
  'fullWheelhousePayloadTransferred',
  'dependencyInstalledOnVm',
  'modelDownloaded',
  'modelImportRun',
  'modelInferenceRun',
  'generatedVideoCreated',
  'generatedAssetsCreated',
  'providerCallsMade',
  'workersDispatched',
  'supabaseTouched',
  'sqlExecuted',
  'storageObjectsCreated',
  'signedUrlsCreated',
  'publicArtifactsCreated',
  'creditMutationCreated',
  'betaUnlocked',
  'productionUnlocked',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
] as const) {
  assert.equal(result.runtimeSideEffects[key], false, `${key} must remain false`)
}
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10J_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_US_WEST4_C_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, nextPrompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      targetZone: result.targetZone,
      createSucceeded: result.lifecycleAttempt.createSucceeded,
      noPublicIp: !result.lifecycleAttempt.externalNatIpPresentAfterCreate,
      iapManifestTransferSucceeded: result.lifecycleAttempt.iapManifestTransferSucceeded,
      remoteManifestValidationSucceeded: result.lifecycleAttempt.remoteManifestValidationSucceeded,
      cleanupVerified: result.lifecycleAttempt.cleanupVerified,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
