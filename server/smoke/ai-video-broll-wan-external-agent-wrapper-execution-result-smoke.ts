import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_WAN_EXTERNAL_AGENT_WRAPPER_EXECUTION_RESULT } from '../../src/backend/mock/mock-ai-video-broll-wan-external-agent-wrapper-execution-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-wan-external-agent-wrapper-execution-result.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-wan-external-agent-wrapper-execution-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-wan-external-agent-wrapper-execution-result-smoke.ts'
const WRAPPER_PATH = 'server/cli/external-agent-tool-execute-broll-wan.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-wan-external-agent-wrapper-execution-result'
const DECISION =
  'ai_video_broll_wan_external_agent_wrapper_execution_passed_dependency_install_result_review_required'
const NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-11A-MODEL-IMPORT-PLAN: plan Wan model import proof after payload/install readiness, no inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'brollWanWrapperExecutionResult'): string[] {
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
      ['raw provider prompt field', /\braw[_-]?provider[_-]?prompt\b/i],
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

function assertFalseFlags(flags: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  DOC_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  WRAPPER_PATH,
  'server/cli/ai-video-broll-gen-10zb-l4-payload-install-runner.ts',
  'docs/ai-video-broll-wan-external-agent-wrapper-blocked-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-wan-external-agent-wrapper-execution-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  'external-agent B-roll wrapper -> live quota preflight -> stat-only private cache readiness -> guarded 10ZB runner',
  '`REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF=true npm run external-agent-tool-execute-broll-wan -- --execute --json`',
  '`REEDITPRO_CONFIRM_BROLL_10ZB_L4_PAYLOAD_INSTALL_RETRY=true npm run ai-video-broll-gen-10zb:l4-payload-install-runner -- --execute --summary-path .tmp/external-agent-broll-wan-10zb-l4-payload-install-runner.json`',
  'wrapper status: `passed`',
  'delegated status: `passed`',
  'delegated decision: `ai_video_broll_gen_10zb_l4_payload_install_retry_passed_cleanup_verified`',
  'selected GPU: `nvidia_l4`',
  'machine type: `g2-standard-4`',
  'target region: `northamerica-northeast2`',
  'target zone: `northamerica-northeast2-a`',
  'quota sufficient for one L4 VM: `true`',
  'private cache readiness ok: `true`',
  '`computeVmCreated=true`',
  '`cleanupVerified=true`',
  '`dependencyImportReadinessPassed=true`',
  '`modelImportRun=false`',
  '`modelInferenceRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`signedUrlsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  'instance `reeditpro-ai-broll-wan-l4-proof`: absent',
  'disk `reeditpro-ai-broll-wan-l4-proof`: absent',
  'reservation `reeditpro-ai-broll-wan-l4-proof`: absent',
  NEXT_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `B-roll wrapper execution result doc missing ${required}`)
}

const result = AI_VIDEO_BROLL_WAN_EXTERNAL_AGENT_WRAPPER_EXECUTION_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_wan_external_agent_wrapper_execution_result')
assert.equal(result.wrapperCommand.confirmationEnv, 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF')
assert.equal(result.wrapperCommand.verifiesLiveQuotaBeforeAnyVmAction, true)
assert.equal(result.wrapperCommand.verifiesPrivateCacheBeforeAnyVmAction, true)
assert.equal(result.wrapperCommand.delegatesToFixedDeliveryRunnerOnly, true)
assert.equal(result.delegatedRunner.confirmationEnv, 'REEDITPRO_CONFIRM_BROLL_10ZB_L4_PAYLOAD_INSTALL_RETRY')
assert.equal(result.delegatedRunner.mode, 'ai_video_broll_gen_10zb_l4_payload_install_runner_execute_result')
assert.equal(result.delegatedRunner.decision, 'ai_video_broll_gen_10zb_l4_payload_install_retry_passed_cleanup_verified')
assert.equal(result.reviewedRun.wrapperStatus, 'passed')
assert.equal(result.reviewedRun.delegatedStatus, 'passed')
assert.equal(result.reviewedRun.selectedGpu, 'nvidia_l4')
assert.equal(result.reviewedRun.machineType, 'g2-standard-4')
assert.equal(result.reviewedRun.targetRegion, 'northamerica-northeast2')
assert.equal(result.reviewedRun.targetZone, 'northamerica-northeast2-a')
assert.equal(result.reviewedRun.proofVmName, 'reeditpro-ai-broll-wan-l4-proof')
assert.equal(result.reviewedRun.projectQuotaReadPassed, true)
assert.equal(result.reviewedRun.regionQuotaReadPassed, true)
assert.equal(result.reviewedRun.quotaSufficientForOneL4Vm, true)
assert.equal(result.cacheReadiness.ok, true)
assert.equal(result.cacheReadiness.statOnly, true)
assert.equal(result.cacheReadiness.cachePathExists, true)
assert.equal(result.cacheReadiness.runtimeEssentialFileCount, 19)
assert.equal(result.cacheReadiness.expectedFileCount, 19)
assert.equal(result.cacheReadiness.aggregateBytesMatches, true)
assert.deepEqual(result.cacheReadiness.missingFiles, [])
assert.deepEqual(result.cacheReadiness.byteMismatches, [])
assert.equal(result.cacheReadiness.modelIndexClassNameMatches, true)
assert.equal(result.cacheReadiness.indexRefsLocal, true)
assert.equal(result.dependencyInstallProof.preflightPassed, true)
assert.equal(result.dependencyInstallProof.computeVmCreated, true)
assert.equal(result.dependencyInstallProof.postCreatePrivateOnlyVerified, true)
assert.equal(result.dependencyInstallProof.bootDiskAutoDeleteVerified, true)
assert.equal(result.dependencyInstallProof.iapLookupReadinessPassed, true)
assert.equal(result.dependencyInstallProof.python312ReadinessPassed, true)
assert.equal(result.dependencyInstallProof.privateGcsPayloadDownloaded, true)
assert.equal(result.dependencyInstallProof.remoteManifestValidationPassed, true)
assert.equal(result.dependencyInstallProof.offlineDependencyInstallPassed, true)
assert.equal(result.dependencyInstallProof.dependencyImportReadinessPassed, true)
assert.equal(result.dependencyInstallProof.cleanupVerified, true)
assert.equal(result.independentCleanupVerification.promptInstanceAbsent, true)
assert.equal(result.independentCleanupVerification.promptDiskAbsent, true)
assert.equal(result.independentCleanupVerification.promptAddressAbsent, true)
assert.equal(result.independentCleanupVerification.promptReservationAbsent, true)
assert.equal(result.runtimeResult.runtimeRunNow, true)
assert.equal(result.runtimeResult.computeVmCreated, true)
assert.equal(result.runtimeResult.computeVmDeleted, true)
assert.equal(result.runtimeResult.bootDiskAutoDeleted, true)
assert.equal(result.runtimeResult.cleanupVerified, true)
assert.equal(result.runtimeResult.privateDependencyPayloadCacheUsed, true)
assert.equal(result.runtimeResult.privateDependencyPayloadCacheIsGeneratedAsset, false)
assert.equal(result.runtimeResult.privateDependencyPayloadCacheIsPublicArtifact, false)
assert.equal(result.runtimeResult.privateDependencyPayloadCacheIsSupabaseStorage, false)
assert.equal(result.runtimeResult.dependencyInstalledOnVm, true)
assert.equal(result.runtimeResult.dependencyImportReadinessRun, true)
assertFalseFlags(result.runtimeResult, [
  'publicIpCreated',
  'staticAddressCreated',
  'reservationCreated',
  'dockerRun',
  'modelDownloaded',
  'modelImportRun',
  'modelLoadRun',
  'modelInferenceRun',
  'generatedVideoCreated',
  'generatedAssetsCreated',
  'providerCallsMade',
  'workersDispatched',
  'supabaseTouched',
  'sqlExecuted',
  'signedUrlsCreated',
  'publicArtifactsCreated',
  'creditMutationCreated',
  'betaUnlocked',
  'productionUnlocked',
  'paidProductionUnlocked',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
])
assertFalseFlags(result.blockedEvidence, [
  'wanModelImportReady',
  'wanModelLoadReady',
  'wanInferenceReady',
  'generatedBrollVideoReady',
  'generatedAssetCreationReady',
  'publicArtifactReady',
  'signedUrlDeliveryReady',
  'supabaseMutationReady',
  'sqlReady',
  'providerCallsReady',
  'workerDispatchReady',
  'creditMutationReady',
  'betaReady',
  'productionReady',
  'paidProductionReady',
])
assert.equal(result.nextPrompt, NEXT_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      wrapperStatus: result.reviewedRun.wrapperStatus,
      delegatedStatus: result.reviewedRun.delegatedStatus,
      computeVmCreated: result.runtimeResult.computeVmCreated,
      computeVmDeleted: result.runtimeResult.computeVmDeleted,
      cleanupVerified: result.runtimeResult.cleanupVerified,
      dependencyImportReadinessRun: result.runtimeResult.dependencyImportReadinessRun,
      modelImportRun: result.runtimeResult.modelImportRun,
      modelInferenceRun: result.runtimeResult.modelInferenceRun,
      generatedVideoCreated: result.runtimeResult.generatedVideoCreated,
      generatedAssetsCreated: result.runtimeResult.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeResult.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
