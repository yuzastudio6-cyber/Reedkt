import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10P_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST2_A_RESULT,
  AI_VIDEO_BROLL_GEN_10Q_IAP_OSLOGIN_ACCESS_FIX_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result'

const ROOT = process.cwd()
const DOC_PATH =
  'docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md'
const NEXT_PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-10q-iap-oslogin-access-fix.md'
const SPEC_PATH =
  'src/backend/mock/mock-ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.ts'
const SMOKE_PATH =
  'server/smoke/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result-smoke.ts'
const PACKAGE_SCRIPT =
  'smoke:ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result'
const DECISION =
  'ai_video_broll_gen_10p_northamerica_northeast2_a_payload_install_proof_blocked_iap_oslogin_publickey_cleanup_verified'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10pResult'): string[] {
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
  'docs/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.md',
  'docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(NEXT_PROMPT_PATH)
for (const required of [
  DECISION,
  '`northamerica-northeast2-a`',
  '`Permission denied (publickey)`',
  'capacity and no-public-IP VM creation passed',
  'The next prompt should not chase another GPU zone.',
  'IAP/OS Login access readiness',
  'create succeeded: `true`',
  'no public IP verified after create: `true`',
  'IAP SSH blocker: `permission_denied_publickey`',
  'full wheelhouse payload transfer attempted: `false`',
  'offline dependency install attempted: `false`',
  'model import attempted: `false`',
  'model inference attempted: `false`',
  'computeVmDeleted=true',
  'generatedLocalFixturePassedClaimed=false',
  AI_VIDEO_BROLL_GEN_10Q_IAP_OSLOGIN_ACCESS_FIX_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10P result doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10Q_IAP_OSLOGIN_ACCESS_FIX_PROMPT,
  'This is a no-GPU-VM/no-inference fix prompt.',
  'Read-only OS Login profile and SSH-key listing checks that do not add keys.',
  'Do not create Compute Engine VMs.',
  'Do not mutate IAM, OS Login keys, firewall, VPC, or metadata.',
]) {
  assert.equal(prompt.includes(required), true, `10Q prompt missing ${required}`)
}

const result =
  AI_VIDEO_BROLL_GEN_10P_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST2_A_RESULT
assert.equal(result.decision, DECISION)
assert.equal(
  result.mode,
  'ai_video_broll_gen_10p_no_idle_l4_iap_wheelhouse_payload_install_proof_northamerica_northeast2_a_result',
)
assert.equal(result.attemptedRegion, 'northamerica-northeast2')
assert.equal(result.attemptedZone, 'northamerica-northeast2-a')
assert.equal(result.machineType, 'g2-standard-4')
assert.equal(result.selectedGpu, 'nvidia_l4')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.freshPreflight.projectMatches, true)
assert.equal(result.freshPreflight.accessTokenRefreshPassed, true)
assert.equal(result.freshPreflight.zoneStatus, 'UP')
assert.equal(result.freshPreflight.machineTypeVisible, true)
assert.equal(result.freshPreflight.acceleratorVisible, true)
assert.equal(result.freshPreflight.acceleratorDescribeCommandShapeFixed, true)
assert.equal(result.freshPreflight.invalidAcceleratorZonesFlagEncounteredBeforeCreate, true)
assert.equal(result.freshPreflight.globalGpusAllRegionsQuotaLimit, 1)
assert.equal(result.freshPreflight.globalGpusAllRegionsQuotaUsage, 0)
assert.equal(result.freshPreflight.regionalL4QuotaLimit, 1)
assert.equal(result.freshPreflight.regionalL4QuotaUsage, 0)
assert.equal(result.freshPreflight.regionalCpuQuotaLimit, 100)
assert.equal(result.freshPreflight.regionalSsdTotalGbQuotaLimit, 500)
assert.equal(result.freshPreflight.privateModelCachePathCorrectedBeforeCreate, true)
assert.equal(result.freshPreflight.privateModelCacheRuntimeEssentialFileCount, 19)
assert.equal(result.freshPreflight.privateModelCacheAggregateBytes, 28928887859)
assert.equal(result.freshPreflight.privateWheelhouseComplete, true)
assert.equal(result.freshPreflight.privateWheelhouseRealWheelCount, 66)
assert.equal(result.freshPreflight.privateWheelhouseAggregateBytes, 2802483442)
assert.equal(result.freshPreflight.privateWheelhouseAggregateSha256, '55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64')
assert.equal(result.lifecycleAttempt.computeVmCreateAttempted, true)
assert.equal(result.lifecycleAttempt.computeVmCreated, true)
assert.equal(result.lifecycleAttempt.createSucceeded, true)
assert.equal(result.lifecycleAttempt.noPublicIpRequired, true)
assert.equal(result.lifecycleAttempt.externalNatIpPresentAfterCreate, false)
assert.equal(result.lifecycleAttempt.iapSshReadinessAttempted, true)
assert.equal(result.lifecycleAttempt.iapSshOpened, false)
assert.equal(result.lifecycleAttempt.iapSshBlocker, 'permission_denied_publickey')
assert.equal(result.lifecycleAttempt.localSshKeyGeneratedByGcloud, true)
assert.equal(result.lifecycleAttempt.fullWheelhousePayloadTransferAttempted, false)
assert.equal(result.lifecycleAttempt.offlineDependencyInstallAttempted, false)
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
assert.equal(result.cleanupVerification.projectGpusAllRegionsQuotaUsageAfterCleanup, 0)
assert.equal(result.failureAnalysis.capacityAndNoPublicIpCreatePathPassed, true)
assert.equal(result.failureAnalysis.failureClass, 'iap_oslogin_publickey_access_blocker')
assert.equal(result.failureAnalysis.rootCauseConfirmed, false)
assert.equal(
  result.failureAnalysis.preventionBeforeNextGpuCreate.includes(
    'run_no_gpu_iap_oslogin_access_fix_prompt_before_any_l4_retry',
  ),
  true,
)
assert.equal(result.runtimeSideEffects.gcpMutatingCommandsExecuted, true)
assert.equal(result.runtimeSideEffects.computeVmCreateAttempted, true)
assert.equal(result.runtimeSideEffects.computeVmCreated, true)
assert.equal(result.runtimeSideEffects.computeVmDeleted, true)
assert.equal(result.runtimeSideEffects.diskCreated, true)
assert.equal(result.runtimeSideEffects.bootDiskCreatedWithVm, true)
assert.equal(result.runtimeSideEffects.bootDiskAutoDeleted, true)
assert.equal(result.runtimeSideEffects.externalIpCreated, false)
assert.equal(result.runtimeSideEffects.publicIpCreated, false)
assert.equal(result.runtimeSideEffects.sshSessionOpened, false)
assert.equal(result.runtimeSideEffects.iapSshAttempted, true)
assert.equal(result.runtimeSideEffects.iapSshSucceeded, false)
assert.equal(result.runtimeSideEffects.iapTransferExecuted, false)
assert.equal(result.runtimeSideEffects.fullWheelhousePayloadTransferred, false)
assert.equal(result.runtimeSideEffects.dependencyInstalledOnVm, false)
assert.equal(result.runtimeSideEffects.modelImportRun, false)
assert.equal(result.runtimeSideEffects.modelInferenceRun, false)
assert.equal(result.runtimeSideEffects.generatedAssetsCreated, false)
assert.equal(result.runtimeSideEffects.supabaseTouched, false)
assert.equal(result.runtimeSideEffects.sqlExecuted, false)
assert.equal(result.runtimeSideEffects.creditMutationCreated, false)
assert.equal(result.runtimeSideEffects.betaUnlocked, false)
assert.equal(result.runtimeSideEffects.productionUnlocked, false)
assert.equal(result.runtimeSideEffects.generatedLocalFixturePassedClaimed, false)
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10Q_IAP_OSLOGIN_ACCESS_FIX_PROMPT)

const forbidden = scanForbiddenValues({ doc, prompt, result })
assert.deepEqual(forbidden, [])

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      attemptedZone: result.attemptedZone,
      createAttempted: result.lifecycleAttempt.computeVmCreateAttempted,
      computeVmCreated: result.lifecycleAttempt.computeVmCreated,
      noPublicIpVerified: result.lifecycleAttempt.externalNatIpPresentAfterCreate === false,
      iapSshBlocker: result.lifecycleAttempt.iapSshBlocker,
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
