import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_GEN_11C_STORAGE_TRANSFER_NAMING_TEST_RESULT } from '../../src/backend/mock/mock-ai-video-broll-gen-11c-storage-transfer-naming-test-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-11c-storage-transfer-naming-test-result.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-11c-storage-transfer-naming-test-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11c-storage-transfer-naming-test-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-11c-storage-transfer-naming-test-result'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll11c'): string[] {
  const findings: string[] = []
  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['service role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
    ]
    for (const [label, pattern] of patterns) {
      if (pattern.test(value)) findings.push(`${prefix}: ${label}`)
    }
    return findings
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...scanForbiddenValues(item, `${prefix}[${index}]`)))
    return findings
  }

  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      findings.push(...scanForbiddenValues(nested, `${prefix}.${key}`))
    }
  }

  return findings
}

for (const file of [DOC_PATH, SPEC_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11c-storage-transfer-naming-test-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  '# AI-VIDEO-BROLL-GEN-11C Storage Transfer Naming Test Result',
  'ai_video_broll_gen_11c_storage_transfer_naming_test_blocked_private_url_list_403_no_gpu_no_inference',
  'Received HTTP error code 403',
  'Temporary service-agent IAM removed after test',
  'Storage Transfer accepted the job shape',
  'modelImportRun=false',
  'modelInferenceRun=false',
  'generatedAssetsCreated=false',
  'generatedLocalFixturePassedClaimed=false',
  'AI-VIDEO-BROLL-GEN-11D-CACHE-STAGING-STRATEGY-FIX',
]) {
  assert.equal(doc.includes(required), true, `Doc missing ${required}`)
}

const spec = AI_VIDEO_BROLL_GEN_11C_STORAGE_TRANSFER_NAMING_TEST_RESULT
assert.equal(
  spec.decision,
  'ai_video_broll_gen_11c_storage_transfer_naming_test_blocked_private_url_list_403_no_gpu_no_inference',
)
assert.equal(spec.modelRepository, 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers')
assert.equal(spec.sourceCommit, '0fad780a534b6463e45facd96134c9f345acfa5b')
assert.equal(spec.testFile.relativePath, 'model_index.json')
assert.equal(spec.testFile.expectedBytes, 400)
assert.equal(spec.result.storageTransferApiEnabled, true)
assert.equal(spec.result.urlListObjectUploadedToPrivateBucket, true)
assert.equal(spec.result.temporaryServiceAgentIamAdded, true)
assert.equal(spec.result.transferJobCreated, true)
assert.equal(spec.result.transferOperationStatus, 'FAILED')
assert.equal(spec.result.errorClass, 'PERMISSION_DENIED')
assert.equal(spec.result.stagingObjectCreated, false)
assert.equal(spec.result.transferJobDeleted, true)
assert.equal(spec.result.urlListObjectDeleted, true)
assert.equal(spec.result.temporaryServiceAgentIamRemoved, true)
assert.equal(spec.runtimeSideEffects.computeVmCreated, false)
assert.equal(spec.runtimeSideEffects.modelImportRun, false)
assert.equal(spec.runtimeSideEffects.modelLoadRun, false)
assert.equal(spec.runtimeSideEffects.modelInferenceRun, false)
assert.equal(spec.runtimeSideEffects.generatedVideoCreated, false)
assert.equal(spec.runtimeSideEffects.generatedAssetsCreated, false)
assert.equal(spec.runtimeSideEffects.supabaseTouched, false)
assert.equal(spec.runtimeSideEffects.sqlExecuted, false)
assert.equal(spec.runtimeSideEffects.signedUrlsCreated, false)
assert.equal(spec.runtimeSideEffects.publicArtifactsCreated, false)
assert.equal(spec.runtimeSideEffects.generatedLocalFixturePassedClaimed, false)
assert.equal(spec.nextPrompt.includes('AI-VIDEO-BROLL-GEN-11D-CACHE-STAGING-STRATEGY-FIX'), true)

const forbiddenFindings = scanForbiddenValues({ doc, spec })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: spec.decision,
      transferOperationStatus: spec.result.transferOperationStatus,
      privateUrlListReadableByStorageTransfer: spec.runtimeSideEffects.privateUrlListReadableByStorageTransfer,
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
