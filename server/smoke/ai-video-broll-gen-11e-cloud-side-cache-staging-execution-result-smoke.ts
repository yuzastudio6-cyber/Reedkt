import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_GEN_11E_CLOUD_SIDE_CACHE_STAGING_EXECUTION_RESULT } from '../../src/backend/mock/mock-ai-video-broll-gen-11e-cloud-side-cache-staging-execution-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-11e-cloud-side-cache-staging-execution-result.md'
const SPEC_PATH =
  'src/backend/mock/mock-ai-video-broll-gen-11e-cloud-side-cache-staging-execution-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11e-cloud-side-cache-staging-execution-result-smoke.ts'
const RUNNER_PATH = 'server/cli/ai-video-broll-gen-11e-cloud-side-cache-staging-runner.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-11e-cloud-side-cache-staging-execution-result'
const DECISION = 'ai_video_broll_gen_11e_cloud_side_cache_staging_passed_no_gpu_no_inference'
const NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-11B-MODEL-IMPORT-PROOF: run bounded no-idle L4 Wan model import proof, no inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll11eExecutionResult'): string[] {
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

for (const file of [DOC_PATH, SPEC_PATH, SMOKE_PATH, RUNNER_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11e-cloud-side-cache-staging-execution-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  '`REEDITPRO_CONFIRM_BROLL_11E_CLOUD_SIDE_CACHE_STAGING=true npm run ai-video-broll-gen-11e:cloud-side-cache-staging-runner -- --execute --summary-path .tmp/ai-video-broll-gen-11e-execute-cloud-side-cache-staging-retry3-result.json`',
  'status: `passed`',
  'selected strategy: `cloud_side_no_gpu_transfer_harness`',
  'selected GPU: `none`',
  'prompt-scoped job: `reeditpro-ai-broll-wan-cache-stage-11e`',
  'runtime-essential file count: `19`',
  'aggregate bytes: `28928887859`',
  'private ready marker created: `true`',
  'prompt-scoped Cloud Run Job deleted: `true`',
  'private runner support files cleaned: `true`',
  '`cloudRunJobCreated=true`',
  '`cloudRunJobExecuted=true`',
  '`cloudRunJobDeleted=true`',
  '`readyMarkerCreated=true`',
  '`privateGcsModelCacheStaged=true`',
  '`computeVmCreated=false`',
  '`gpuUsed=false`',
  '`modelImportRun=false`',
  '`modelLoadRun=false`',
  '`modelInferenceRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`signedUrlsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  'curl --upload-file -',
  NEXT_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `11E execution result doc missing ${required}`)
}

const runnerSource = read(RUNNER_PATH)
assert.equal(runnerSource.includes('--upload-file -'), true, 'runner must keep streaming upload fix')
assert.equal(runnerSource.includes('--data-binary @-'), false, 'runner must not use buffered upload')

const result = AI_VIDEO_BROLL_GEN_11E_CLOUD_SIDE_CACHE_STAGING_EXECUTION_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_11e_cloud_side_cache_staging_runner_execute_result')
assert.equal(result.status, 'passed')
assert.equal(result.executedCommand.confirmationEnv, 'REEDITPRO_CONFIRM_BROLL_11E_CLOUD_SIDE_CACHE_STAGING')
assert.equal(result.reviewedRun.selectedStrategy, 'cloud_side_no_gpu_transfer_harness')
assert.equal(result.reviewedRun.selectedGpu, 'none')
assert.equal(result.reviewedRun.promptScopedJobName, 'reeditpro-ai-broll-wan-cache-stage-11e')
assert.equal(result.reviewedRun.runtimeEssentialFileCount, 19)
assert.equal(result.reviewedRun.aggregateBytes, 28928887859)
assert.equal(result.markerValidation.readyMarkerCreated, true)
assert.equal(result.markerValidation.modelImportRun, false)
assert.equal(result.markerValidation.modelLoadRun, false)
assert.equal(result.markerValidation.modelInferenceRun, false)
assert.equal(result.markerValidation.generatedVideoCreated, false)
assert.equal(result.markerValidation.generatedAssetsCreated, false)
assert.equal(result.cleanupVerification.promptScopedCloudRunJobDeleted, true)
assert.equal(result.cleanupVerification.promptScopedCloudRunJobAbsentAfterRun, true)
assert.equal(result.cleanupVerification.privateRunnerSupportFilesAbsentAfterRun, true)
assert.equal(result.runtimeSideEffects.cloudRunJobCreated, true)
assert.equal(result.runtimeSideEffects.cloudRunJobExecuted, true)
assert.equal(result.runtimeSideEffects.cloudRunJobDeleted, true)
assert.equal(result.runtimeSideEffects.supportFilesCleanupVerified, true)
assert.equal(result.runtimeSideEffects.storageObjectsCreated, true)
assert.equal(result.runtimeSideEffects.readyMarkerCreated, true)
assert.equal(result.runtimeSideEffects.privateGcsModelCacheStaged, true)
assertFalseFlags(result.runtimeSideEffects, [
  'computeVmCreated',
  'gpuUsed',
  'dockerRun',
  'modelImportRun',
  'modelLoadRun',
  'modelInferenceRun',
  'generatedVideoCreated',
  'generatedAssetsCreated',
  'supabaseTouched',
  'sqlExecuted',
  'signedUrlsCreated',
  'publicArtifactsCreated',
  'providerCallsMade',
  'workersDispatched',
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

const forbiddenDataFindings = scanForbiddenValues(result)
assert.deepEqual(forbiddenDataFindings, [], `Forbidden values in 11E execution result: ${forbiddenDataFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      mode: result.mode,
      privateGcsModelCacheStaged: result.runtimeSideEffects.privateGcsModelCacheStaged,
      readyMarkerCreated: result.runtimeSideEffects.readyMarkerCreated,
      cloudRunJobDeleted: result.runtimeSideEffects.cloudRunJobDeleted,
      supportFilesCleanupVerified: result.runtimeSideEffects.supportFilesCleanupVerified,
      gpuUsed: result.runtimeSideEffects.gpuUsed,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
