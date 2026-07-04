import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_GEN_11B_MODEL_IMPORT_PROOF_EXECUTION_RESULT } from '../../src/backend/mock/mock-ai-video-broll-gen-11b-model-import-proof-execution-result'
import {
  AI_VIDEO_BROLL_GEN_11C_MODEL_IMPORT_RESULT_REVIEW,
  AI_VIDEO_BROLL_GEN_11F_INFERENCE_BOUNDARY_PLAN_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-11c-model-import-result-review'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-11c-model-import-result-review.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-11c-model-import-result-review.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11c-model-import-result-review-smoke.ts'
const SOURCE_RESULT_DOC = 'docs/ai-video-broll-gen-11b-model-import-proof-execution-result.md'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-11c-model-import-result-review'
const DECISION =
  'ai_video_broll_gen_11c_model_import_result_review_accepts_11b_import_load_proof_no_inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll11cResultReview'): string[] {
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

function assertFalseFlags(flags: Record<string, unknown>) {
  for (const [key, value] of Object.entries(flags)) {
    assert.equal(value, false, `${key} must be false`)
  }
}

for (const file of [DOC_PATH, SPEC_PATH, SMOKE_PATH, SOURCE_RESULT_DOC, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11c-model-import-result-review-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  '11B bounded no-idle L4 Wan/Wan2.1 model import/load proof',
  '`status=passed`',
  '`selectedGpu=nvidia_l4`',
  '`machineType=g2-standard-4`',
  '`targetZone=northamerica-northeast2-a`',
  '`modelImportRun=true`',
  '`modelLoadRun=true`',
  '`cleanupVerified=true`',
  '`modelInferenceRun=false`',
  '`generatedAssetsCreated=false`',
  'The B-roll Wan lane remains callable',
  'bounded_model_import_load_proof_reviewed_no_inference',
  'wan_inference_boundary_plan_required_before_generated_video',
  'Always-on GPU runtime remains rejected',
  AI_VIDEO_BROLL_GEN_11F_INFERENCE_BOUNDARY_PLAN_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `11C review doc missing ${required}`)
}

const sourceResult = AI_VIDEO_BROLL_GEN_11B_MODEL_IMPORT_PROOF_EXECUTION_RESULT
assert.equal(sourceResult.status, 'passed')
assert.equal(sourceResult.runtimeSideEffects.modelImportRun, true)
assert.equal(sourceResult.runtimeSideEffects.modelLoadRun, true)
assert.equal(sourceResult.runtimeSideEffects.modelInferenceRun, false)
assert.equal(sourceResult.runtimeSideEffects.generatedAssetsCreated, false)
assert.equal(sourceResult.runtimeSideEffects.generatedLocalFixturePassedClaimed, false)

const review = AI_VIDEO_BROLL_GEN_11C_MODEL_IMPORT_RESULT_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(review.mode, 'ai_video_broll_gen_11c_model_import_result_review_only')
assert.equal(
  review.currentStage,
  'bounded_l4_no_idle_wan_model_import_load_proof_passed_reviewed_no_inference',
)
assert.equal(review.acceptedEvidence.sourceResultDecision, sourceResult.decision)
assert.equal(review.acceptedEvidence.sourceResultStatus, 'passed')
assert.equal(review.acceptedEvidence.modelImportRun, true)
assert.equal(review.acceptedEvidence.modelLoadRun, true)
assert.equal(review.acceptedEvidence.modelInferenceRun, false)
assert.equal(review.acceptedEvidence.cleanupVerified, true)
assert.equal(review.acceptedEvidence.generatedAssetsCreated, false)
assert.equal(review.acceptedEvidence.generatedVideoCreated, false)
assert.equal(review.acceptedEvidence.generatedLocalFixturePassedClaimed, false)
assert.equal(review.externalAgentReadinessAfterReview.wrapperCallable, true)
assert.equal(review.externalAgentReadinessAfterReview.boundedImportLoadProofExecutableWithConfirmation, true)
assert.equal(review.externalAgentReadinessAfterReview.readyForWanInference, false)
assert.equal(review.externalAgentReadinessAfterReview.readyForGeneratedBrollVideo, false)
assert.equal(review.externalAgentReadinessAfterReview.readyForGeneratedAssets, false)
assert.equal(
  review.externalAgentReadinessAfterReview.primaryBlocker,
  'wan_inference_boundary_plan_required_before_generated_video',
)
assert.equal(review.selectedRuntimeBoundary.selectedGpu, 'nvidia_l4')
assert.equal(review.selectedRuntimeBoundary.machineType, 'g2-standard-4')
assert.equal(review.selectedRuntimeBoundary.targetZone, 'northamerica-northeast2-a')
assert.equal(review.selectedRuntimeBoundary.noPublicIpRequired, true)
assert.equal(review.selectedRuntimeBoundary.idleGpuAllowed, false)
assert.equal(review.selectedRuntimeBoundary.alwaysOnGpuAllowed, false)
assert.equal(review.selectedRuntimeBoundary.cleanupVerificationRequired, true)

for (const [flag, value] of Object.entries(review.acceptedCapabilities)) {
  assert.equal(value, true, `accepted capability must be true: ${flag}`)
}
for (const [flag, value] of Object.entries(review.blockedCapabilities)) {
  assert.equal(value, true, `blocked capability marker must be true: ${flag}`)
}
assertFalseFlags(review.runtimeSideEffects)
assert.equal(review.nextPrompt, AI_VIDEO_BROLL_GEN_11F_INFERENCE_BOUNDARY_PLAN_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, review })
assert.deepEqual(forbiddenFindings, [], `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: review.decision,
      mode: review.mode,
      currentStage: review.currentStage,
      wrapperCallable: review.externalAgentReadinessAfterReview.wrapperCallable,
      boundedImportLoadProofExecutableWithConfirmation:
        review.externalAgentReadinessAfterReview.boundedImportLoadProofExecutableWithConfirmation,
      readyForWanInference: review.externalAgentReadinessAfterReview.readyForWanInference,
      generatedVideoCreated: review.runtimeSideEffects.generatedVideoCreated,
      generatedAssetsCreated: review.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: review.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: review.nextPrompt,
    },
    null,
    2,
  ),
)
