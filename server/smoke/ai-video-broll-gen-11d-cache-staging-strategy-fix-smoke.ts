import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_GEN_11D_CACHE_STAGING_STRATEGY_FIX } from '../../src/backend/mock/mock-ai-video-broll-gen-11d-cache-staging-strategy-fix'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-11d-cache-staging-strategy-fix.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-11d-cache-staging-strategy-fix.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11d-cache-staging-strategy-fix-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-11d-cache-staging-strategy-fix'
const DECISION = 'ai_video_broll_gen_11d_cache_staging_strategy_selected_cloud_side_no_gpu_transfer_harness'
const NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-11E-CLOUD-SIDE-CACHE-STAGING-RUNNER: implement no-GPU Wan private cache staging runner, no inference/no generated video'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll11d'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Goog-Signature|X-Goog-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['service account key field', /\bprivate[_-]?key_id\b|\bclient_email\b/i],
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

function assertFalseRuntimeFlags(flags: Record<string, boolean>) {
  for (const [key, value] of Object.entries(flags)) {
    if (key === 'cloudSideNoGpuTransferHarnessSelected') {
      assert.equal(value, true, `${key} must be selected`)
    } else {
      assert.equal(value, false, `${key} must remain false`)
    }
  }
}

for (const file of [
  DOC_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-11c-storage-transfer-naming-test-result.md',
  'docs/ai-video-broll-generation-gcp-l4-private-cache-transfer-policy.md',
  'docs/ai-video-broll-generation-weight-download-storage-policy.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11d-cache-staging-strategy-fix-smoke.ts',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  'direct local upload stalled',
  'private Storage Transfer URL-list naming test failed with HTTP 403',
  'public access prevention enforced',
  'Signed URL-list',
  'no-GPU cloud-side transfer harness',
  'runtime auto-download',
  'stable pinned Hugging Face `resolve/<commit>/...` URLs',
  'ready marker after object count and byte totals match',
  NEXT_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `Doc missing ${required}`)
}

for (const forbidden of [
  'generated_local_fixture_passed=true',
  'modelInferenceRun=true',
  'generatedVideoCreated=true',
  'generatedAssetsCreated=true',
  'cloudRunJobCreated=true',
  'computeVmCreated=true',
  'sqlExecuted=true',
]) {
  assert.equal(doc.includes(forbidden), false, `Doc must not claim ${forbidden}`)
}

const spec = AI_VIDEO_BROLL_GEN_11D_CACHE_STAGING_STRATEGY_FIX
assert.equal(spec.decision, DECISION)
assert.equal(spec.mode, 'cache_staging_strategy_fix_only')
assert.equal(spec.selectedStrategy.id, 'cloud_side_no_gpu_transfer_harness')
assert.equal(spec.selectedStrategy.selected, true)
assert.equal(spec.selectedStrategy.futureRunnerRequired, true)
assert.equal(spec.selectedStrategy.gpuRequired, false)
assert.equal(spec.selectedStrategy.modelInferenceAllowed, false)
assert.equal(spec.blockers.directLocalUpload, 'stalled_on_large_shard_no_ready_marker')
assert.equal(spec.blockers.privateGcsUrlList, 'storage_transfer_http_403_reading_private_tsv')
assert.equal(spec.rejectedStrategies.includes('temporary_public_url_list_object'), true)
assert.equal(spec.rejectedStrategies.includes('signed_url_list_object'), true)
assert.equal(spec.rejectedStrategies.includes('runtime_auto_download'), true)
assert.equal(spec.futureHarnessRequirements.includes('short_lived_no_gpu_cloud_task'), true)
assert.equal(spec.futureHarnessRequirements.includes('no_signed_url_or_secret_log_output'), true)
assert.equal(spec.nextPrompt, NEXT_PROMPT)
assertFalseRuntimeFlags(spec.runtimeSideEffects)

const forbiddenFindings = [
  ...scanForbiddenValues(spec),
  ...scanForbiddenValues(doc, 'broll11dDoc'),
]
assert.deepEqual(forbiddenFindings, [])

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: spec.decision,
      selectedStrategy: spec.selectedStrategy.id,
      cloudRunJobCreated: spec.runtimeSideEffects.cloudRunJobCreated,
      computeVmCreated: spec.runtimeSideEffects.computeVmCreated,
      modelInferenceRun: spec.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: spec.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: spec.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: spec.nextPrompt,
    },
    null,
    2,
  ),
)
