import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_GEN_11B_MODEL_IMPORT_PROOF_EXECUTION_RESULT } from '../../src/backend/mock/mock-ai-video-broll-gen-11b-model-import-proof-execution-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-11b-model-import-proof-execution-result.md'
const SPEC_PATH =
  'src/backend/mock/mock-ai-video-broll-gen-11b-model-import-proof-execution-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11b-model-import-proof-execution-result-smoke.ts'
const RUNNER_PATH = 'server/cli/ai-video-broll-gen-11b-l4-model-import-runner.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-11b-model-import-proof-execution-result'
const DECISION = 'ai_video_broll_gen_11b_l4_model_import_proof_passed_cleanup_verified_no_inference'
const NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-11C-MODEL-IMPORT-RESULT-REVIEW: review bounded Wan model import proof result, no inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll11bExecutionResult'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
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

function assertTrueFlags(flags: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    assert.equal(flags[key], true, `${key} must be true`)
  }
}

for (const file of [DOC_PATH, SPEC_PATH, SMOKE_PATH, RUNNER_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11b-model-import-proof-execution-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  '`REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF=true npm run external-agent-tool-execute-broll-wan -- --execute --json`',
  '`REEDITPRO_CONFIRM_BROLL_11B_MODEL_IMPORT_PROOF=true npm run ai-video-broll-gen-11b:l4-model-import-runner -- --execute --summary-path .tmp/external-agent-broll-wan-11b-l4-model-import-runner.json`',
  'status: `passed`',
  'selected GPU: `nvidia_l4`',
  'machine type: `g2-standard-4`',
  'zone: `northamerica-northeast2-a`',
  'no public IP verified: `true`',
  'boot disk auto-delete verified: `true`',
  'remote model cache validated: `true`',
  'offline wheelhouse install/extract passed: `true`',
  '`WanPipeline` class import passed: `true`',
  '`WanPipeline.from_pretrained(... local_files_only=True, low_cpu_mem_usage=True)` passed: `true`',
  'cleanup verified: `true`',
  '`computeVmCreated=true`',
  '`computeVmDeleted=true`',
  '`modelImportRun=true`',
  '`modelLoadRun=true`',
  '`modelInferenceRun=false`',
  '`promptEncodingRun=false`',
  '`denoisingRun=false`',
  '`vaeDecodeRun=false`',
  '`frameCreationRun=false`',
  '`videoEncodingRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`signedUrlsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `11B execution result doc missing ${required}`)
}

const runnerSource = read(RUNNER_PATH)
for (const required of [
  'markerClassMatches',
  'fallbackSourcePrefix',
  'source_prefixes',
  'exec(${JSON.stringify(scriptBody)})',
  'waitForPython312Readiness',
  'isTransientSshTransportFailure',
  'WanPipeline.from_pretrained',
  'local_files_only=True',
  'low_cpu_mem_usage=True',
]) {
  assert.equal(runnerSource.includes(required), true, `runner missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_11B_MODEL_IMPORT_PROOF_EXECUTION_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_11b_l4_model_import_runner_execute_result')
assert.equal(result.status, 'passed')
assert.equal(result.executedCommand.confirmationEnv, 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF')
assert.equal(result.executedCommand.delegatedConfirmationEnv, 'REEDITPRO_CONFIRM_BROLL_11B_MODEL_IMPORT_PROOF')
assert.equal(result.reviewedRun.selectedStrategy, 'bounded_no_idle_l4_model_import_load_proof')
assert.equal(result.reviewedRun.selectedGpu, 'nvidia_l4')
assert.equal(result.reviewedRun.machineType, 'g2-standard-4')
assert.equal(result.reviewedRun.zone, 'northamerica-northeast2-a')
assert.equal(result.reviewedRun.runtimeEssentialFileCount, 19)
assert.equal(result.reviewedRun.aggregateBytes, 28928887859)
assert.equal(result.reviewedRun.expectedModelIndexClassName, 'WanPipeline')
assertTrueFlags(result.phaseEvidence, [
  'localModelCacheValidated',
  'privateGcsWheelhouseReady',
  'privateGcsModelCacheReady',
  'iapLookupReadinessPassed',
  'python312ReadinessPassed',
  'wheelhousePayloadTransferred',
  'modelCachePayloadTransferred',
  'remoteModelCacheValidated',
  'offlineDependencyInstallPassed',
  'dependencyImportReadinessPassed',
  'wanPipelineClassImportPassed',
  'wanPipelineLocalLoadPassed',
])
assert.equal(result.cleanupVerification.promptScopedVmDeleted, true)
assert.equal(result.cleanupVerification.cleanupVerified, true)
assertTrueFlags(result.runtimeSideEffects, [
  'computeVmCreateAttempted',
  'computeVmCreated',
  'computeVmDeleted',
  'bootDiskAutoDeleted',
  'cleanupRun',
  'cleanupVerified',
  'privateGcsPayloadDownloaded',
  'fullWheelhousePayloadTransferred',
  'modelCachePayloadTransferred',
  'remoteModelCacheValidationRun',
  'dependencyInstalledOnVm',
  'dependencyImportReadinessRun',
  'modelImportRun',
  'modelLoadRun',
])
assertFalseFlags(result.runtimeSideEffects, [
  'publicIpCreated',
  'staticAddressCreated',
  'reservationCreated',
  'dockerRun',
  'modelDownloaded',
  'modelInferenceRun',
  'promptEncodingRun',
  'denoisingRun',
  'vaeDecodeRun',
  'frameCreationRun',
  'videoEncodingRun',
  'ffmpegRun',
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
  'paidProductionUnlocked',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
])
assertFalseFlags(result.blockedEvidence, [
  'wanInferenceReady',
  'promptEncodingReady',
  'denoisingReady',
  'vaeDecodeReady',
  'frameCreationReady',
  'videoEncodingReady',
  'ffmpegReady',
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
  'alwaysOnGpuReady',
])
assert.equal(result.nextPrompt, NEXT_PROMPT)

const forbiddenDataFindings = scanForbiddenValues(result)
assert.deepEqual(forbiddenDataFindings, [], `Forbidden values in 11B execution result: ${forbiddenDataFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      mode: result.mode,
      selectedGpu: result.reviewedRun.selectedGpu,
      modelImportRun: result.runtimeSideEffects.modelImportRun,
      modelLoadRun: result.runtimeSideEffects.modelLoadRun,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      cleanupVerified: result.runtimeSideEffects.cleanupVerified,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
