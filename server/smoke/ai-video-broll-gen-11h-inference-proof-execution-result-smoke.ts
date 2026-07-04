import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_GEN_11H_INFERENCE_PROOF_EXECUTION_RESULT } from '../../src/backend/mock/mock-ai-video-broll-gen-11h-inference-proof-execution-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-11h-inference-proof-execution-result.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-11h-inference-proof-execution-result.ts'
const RUNNER_PATH = 'server/cli/ai-video-broll-gen-11h-bounded-inference-proof-runner.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11h-inference-proof-execution-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-11h-inference-proof-execution-result'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll11hResult'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
      ['run.app URL', /\brun\.app\b/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['raw provider prompt field', /\braw[_-]?provider[_-]?prompt\b/i],
      ['private key value', /\bprivate[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['ssh public key material', /\bssh-(rsa|ed25519)\s+[A-Za-z0-9+/=]{40,}/i],
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

for (const file of [DOC_PATH, SPEC_PATH, RUNNER_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11h-inference-proof-execution-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  'ai_video_broll_gen_11h_inference_proof_failed_pipeline_load_timeout_cleanup_verified',
  'The proof failed at `wan_pipeline_local_files_only_latent_inference_canary`.',
  'timed out: `true`',
  'cleanup verified: `true`',
  '`modelLoadRun=false`',
  '`modelInferenceRun=false`',
  '`promptEncodingRun=false`',
  '`denoisingRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`creditMutationCreated=false`',
  'AI-VIDEO-BROLL-GEN-11H-FIX-INFERENCE-PROOF: fix blocked bounded Wan inference proof, no generated video',
]) {
  assert.equal(doc.includes(required), true, `11H result doc missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_11H_INFERENCE_PROOF_EXECUTION_RESULT
assert.equal(result.status, 'failed')
assert.equal(result.decision, 'ai_video_broll_gen_11h_inference_proof_failed_pipeline_load_timeout_cleanup_verified')
assert.equal(result.phaseEvidence.preflightPassed, true)
assert.equal(result.phaseEvidence.computeVmCreated, true)
assert.equal(result.phaseEvidence.wheelhousePayloadTransferred, true)
assert.equal(result.phaseEvidence.modelCachePayloadTransferred, true)
assert.equal(result.phaseEvidence.remoteModelCacheValidated, true)
assert.equal(result.phaseEvidence.offlineDependencyInstallPassed, true)
assert.equal(result.phaseEvidence.dependencyImportReadinessPassed, true)
assert.equal(result.phaseEvidence.wanPipelineClassImportPassed, true)
assert.equal(result.phaseEvidence.wanPipelineLocalLoadPassed, false)
assert.equal(result.phaseEvidence.wanLatentInferenceCanaryPassed, false)
assert.equal(result.failureEvidence.failedPhase, 'wan_pipeline_local_files_only_latent_inference_canary')
assert.equal(result.failureEvidence.failureKind, 'timeout_while_loading_pipeline_weights')
assert.equal(result.failureEvidence.timedOut, true)
assert.equal(result.cleanupVerification.cleanupVerified, true)
assert.equal(result.cleanupVerification.followUpReadOnlyInstanceDescribeNotFound, true)
assert.equal(result.cleanupVerification.followUpReadOnlyDiskDescribeNotFound, true)
assert.equal(result.runtimeSideEffects.computeVmCreated, true)
assert.equal(result.runtimeSideEffects.computeVmDeleted, true)
assert.equal(result.runtimeSideEffects.cleanupVerified, true)
assert.equal(result.runtimeSideEffects.publicIpCreated, false)
assert.equal(result.runtimeSideEffects.modelImportRun, true)
assert.equal(result.runtimeSideEffects.modelLoadRun, false)
assert.equal(result.runtimeSideEffects.modelInferenceRun, false)
assert.equal(result.runtimeSideEffects.promptEncodingRun, false)
assert.equal(result.runtimeSideEffects.denoisingRun, false)
assert.equal(result.runtimeSideEffects.inferenceOutputPersisted, false)
assert.equal(result.runtimeSideEffects.vaeDecodeRun, false)
assert.equal(result.runtimeSideEffects.frameCreationRun, false)
assert.equal(result.runtimeSideEffects.videoEncodingRun, false)
assert.equal(result.runtimeSideEffects.ffmpegRun, false)
assert.equal(result.runtimeSideEffects.generatedVideoCreated, false)
assert.equal(result.runtimeSideEffects.generatedAssetsCreated, false)
assert.equal(result.runtimeSideEffects.supabaseTouched, false)
assert.equal(result.runtimeSideEffects.sqlExecuted, false)
assert.equal(result.runtimeSideEffects.signedUrlsCreated, false)
assert.equal(result.runtimeSideEffects.publicArtifactsCreated, false)
assert.equal(result.runtimeSideEffects.creditMutationCreated, false)
assert.equal(result.runtimeSideEffects.generatedLocalFixturePassedClaimed, false)
assert.equal(result.blockedEvidence.wanInferenceReady, false)
assert.equal(result.nextPrompt, 'AI-VIDEO-BROLL-GEN-11H-FIX-INFERENCE-PROOF: fix blocked bounded Wan inference proof, no generated video')

const forbiddenFindings = scanForbiddenValues({ doc, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      script: PACKAGE_SCRIPT,
      status: result.status,
      failedPhase: result.failureEvidence.failedPhase,
      timedOut: result.failureEvidence.timedOut,
      cleanupVerified: result.cleanupVerification.cleanupVerified,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedVideoCreated: result.runtimeSideEffects.generatedVideoCreated,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
