import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_11F_INFERENCE_BOUNDARY_PLAN,
  AI_VIDEO_BROLL_GEN_11G_INFERENCE_PROOF_RUNNER_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-11f-inference-boundary-plan'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-11f-inference-boundary-plan.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-11f-inference-boundary-plan.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11f-inference-boundary-plan-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-11f-inference-boundary-plan'
const DECISION =
  'ai_video_broll_gen_11f_inference_boundary_plan_ready_for_runner_implementation_no_execution'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll11fBoundaryPlan'): string[] {
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

function assertAllFalse(flags: Record<string, unknown>) {
  for (const [key, value] of Object.entries(flags)) {
    assert.equal(value, false, `${key} must be false`)
  }
}

function assertAllTrue(flags: Record<string, unknown>) {
  for (const [key, value] of Object.entries(flags)) {
    assert.equal(value, true, `${key} must be true`)
  }
}

for (const file of [
  DOC_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-11c-model-import-result-review.md',
  'src/backend/mock/mock-ai-video-broll-gen-11c-model-import-result-review.ts',
  'docs/ai-video-broll-gen-11b-model-import-proof-execution-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11f-inference-boundary-plan-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  'This is plan/spec/smoke only.',
  'does not create a VM',
  'does not run Wan inference',
  'External agents must use structured tool envelopes and approved fixture inputs, not raw chat.',
  '11F accepts that the next B-roll implementation may be a bounded inference-proof runner',
  'The future execution prompt is not part of 11F.',
  'command name: `ai-video-broll-gen-11g:bounded-inference-proof-runner`',
  'confirmation env: `REEDITPRO_CONFIRM_BROLL_11G_INFERENCE_PROOF=true`',
  'wrapper confirmation env: `REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF=true`',
  'selected GPU: `nvidia_l4`',
  'machine type: `g2-standard-4`',
  'target zone: `northamerica-northeast2-a`',
  '`modelInferenceRun=false`',
  '`promptEncodingRun=false`',
  '`denoisingRun=false`',
  '`vaeDecodeRun=false`',
  '`frameCreationRun=false`',
  '`videoEncodingRun=false`',
  '`ffmpegRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`signedUrlsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  'must stop and record a fix prompt',
  AI_VIDEO_BROLL_GEN_11G_INFERENCE_PROOF_RUNNER_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `11F boundary doc missing ${required}`)
}

const plan = AI_VIDEO_BROLL_GEN_11F_INFERENCE_BOUNDARY_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.mode, 'ai_video_broll_gen_11f_inference_boundary_plan_only')
assert.equal(plan.currentStage, 'bounded_import_load_reviewed_no_inference')
assert.equal(plan.targetFutureStage, 'bounded_wan_inference_proof_runner_required')
assert.equal(plan.claimsDryRunPassed, false)
assert.equal(plan.claimsGeneratedLocalFixturePassed, false)
assert.equal(plan.sourceEvidence.sourceReviewAcceptedImportLoad, true)
assert.equal(plan.sourceEvidence.sourceReviewReadyForWanInference, false)
assert.equal(plan.sourceEvidence.sourceReviewGeneratedVideoReady, false)
assert.equal(plan.selectedRuntimeBoundary.selectedGpu, 'nvidia_l4')
assert.equal(plan.selectedRuntimeBoundary.machineType, 'g2-standard-4')
assert.equal(plan.selectedRuntimeBoundary.targetRegion, 'northamerica-northeast2')
assert.equal(plan.selectedRuntimeBoundary.targetZone, 'northamerica-northeast2-a')
assert.equal(plan.selectedRuntimeBoundary.noPublicIpRequired, true)
assert.equal(plan.selectedRuntimeBoundary.externalIpAllowed, false)
assert.equal(plan.selectedRuntimeBoundary.idleGpuAllowed, false)
assert.equal(plan.selectedRuntimeBoundary.alwaysOnGpuAllowed, false)
assert.equal(plan.futureRunnerContract.commandScript, 'ai-video-broll-gen-11g:bounded-inference-proof-runner')
assert.equal(plan.futureRunnerContract.runnerConfirmationEnv, 'REEDITPRO_CONFIRM_BROLL_11G_INFERENCE_PROOF')
assert.equal(
  plan.futureRunnerContract.wrapperConfirmationEnv,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF',
)
assert.equal(plan.futureRunnerContract.staticGuardDefault, true)
assert.equal(plan.futureRunnerContract.executeModeRequiresLaterPrompt, true)
assert.equal(plan.futureRunnerContract.rawChatPromptAllowed, false)
assertAllTrue(plan.futureAllowedOnlyAfterSeparateExecutionApproval)
assertAllTrue(plan.blockedInThisPrompt)
assertAllFalse(plan.runtimeSideEffects)
assert.equal(plan.failurePlanning.largerGpuRequiresSeparateReview, true)
assert.equal(plan.failurePlanning.publicIpFallbackAllowed, false)
assert.equal(plan.failurePlanning.dockerFallbackAllowed, false)
assert.equal(plan.failurePlanning.modelDownloadFallbackAllowed, false)
assert.equal(plan.nextPrompt, AI_VIDEO_BROLL_GEN_11G_INFERENCE_PROOF_RUNNER_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, plan })
assert.deepEqual(forbiddenFindings, [], `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: plan.decision,
      mode: plan.mode,
      targetFutureStage: plan.targetFutureStage,
      selectedGpu: plan.selectedRuntimeBoundary.selectedGpu,
      modelInferenceRun: plan.runtimeSideEffects.modelInferenceRun,
      generatedVideoCreated: plan.runtimeSideEffects.generatedVideoCreated,
      generatedAssetsCreated: plan.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: plan.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: plan.nextPrompt,
    },
    null,
    2,
  ),
)
