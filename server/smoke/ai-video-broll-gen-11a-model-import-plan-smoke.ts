import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_11A_MODEL_IMPORT_PLAN,
  AI_VIDEO_BROLL_GEN_11B_MODEL_IMPORT_PROOF_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-11a-model-import-plan'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-11a-model-import-plan.md'
const PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-11b-model-import-proof.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-11a-model-import-plan.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11a-model-import-plan-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-11a-model-import-plan'
const DECISION = 'ai_video_broll_gen_11a_model_import_plan_ready_for_bounded_no_inference_proof'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll11aModelImportPlan'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
      ['run.app URL', /\brun\.app\b/i],
      ['cloud storage URI', /\bgs:\/\/\S+/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service account email value', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.gserviceaccount\.com/i],
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

for (const file of [
  DOC_PATH,
  PROMPT_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-wan-external-agent-wrapper-execution-result.md',
  'src/backend/mock/mock-ai-video-broll-wan-external-agent-wrapper-execution-result.ts',
  'server/cli/ai-video-broll-gen-10zb-l4-payload-install-runner.ts',
  'server/cli/external-agent-tool-execute-broll-wan.ts',
  'src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts',
  'server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts',
  'server/workers/ai-video-broll-controlled-install/validate_wan_model_mount.py',
  'server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py',
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11a-model-import-plan-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
const tabletopRunner = read('server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py')

for (const required of [
  DECISION,
  'AI-VIDEO-BROLL-GEN-11A plans the next B-roll/Wan execution step',
  'This is plan/spec/smoke only.',
  'The historical tabletop runner has a future execution path that imports `WanPipeline` and then calls the pipeline to create frames.',
  'Future 11B must use a narrower no-inference import/load proof',
  '`Wan-AI/Wan2.1-T2V-1.3B-Diffusers`',
  '`nvidia_l4`',
  '`g2-standard-4`',
  '`northamerica-northeast2-a`',
  '`WanPipeline`',
  '`modelImportRun=false`',
  '`modelLoadRun=false`',
  '`modelInferenceRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`signedUrlsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  AI_VIDEO_BROLL_GEN_11B_MODEL_IMPORT_PROOF_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `11A model import plan doc missing ${required}`)
}

for (const required of [
  'Run one bounded no-idle L4 Wan model import/load proof',
  'stop after model import/load evidence',
  'Repeat live B-roll quota and private cache readiness checks.',
  'Load the approved local Diffusers cache with local-files-only behavior.',
  'Stop before prompt encoding, denoising, frame creation, or video generation.',
  'AI-VIDEO-BROLL-GEN-11C-MODEL-IMPORT-RESULT-REVIEW',
]) {
  assert.equal(prompt.includes(required), true, `11B prompt doc missing ${required}`)
}

assert.equal(tabletopRunner.includes('frames = pipe('), true, 'historical runner frame-generation risk must remain detectable')

const plan = AI_VIDEO_BROLL_GEN_11A_MODEL_IMPORT_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.mode, 'ai_video_broll_gen_11a_model_import_plan_only')
assert.equal(plan.workstream, 'AI_VIDEO_BROLL_GENERATION')
assert.equal(plan.toolId, 'ai_video_broll_generation_wan')
assert.equal(plan.currentStage, 'dependency_install_wrapper_passed')
assert.equal(plan.targetFutureStage, 'bounded_wan_model_import_load_proof_no_inference')
assert.equal(plan.modelRepository, 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers')
assert.equal(plan.sourceCommit, '0fad780a534b6463e45facd96134c9f345acfa5b')
assert.equal(plan.selectedGpu, 'nvidia_l4')
assert.equal(plan.machineType, 'g2-standard-4')
assert.equal(plan.targetRegion, 'northamerica-northeast2')
assert.equal(plan.targetZone, 'northamerica-northeast2-a')
assert.equal(plan.proofVmName, 'reeditpro-ai-broll-wan-l4-proof')
assert.equal(plan.privateCache.layout, 'diffusers_cache_layout')
assert.equal(plan.privateCache.runtimeEssentialFileCount, 19)
assert.equal(plan.privateCache.aggregateBytes, 28928887859)
assert.equal(plan.privateCache.expectedModelIndexClassName, 'WanPipeline')
assert.equal(plan.gpuSelection.alwaysOnGpuRejected, true)
assert.equal(plan.gpuSelection.publicIpGpuRejected, true)
assert.equal(plan.gpuSelection.idleGpuAllowed, false)
assert.equal(plan.future11bAllowedOperations.importWanPipelineClass, true)
assert.equal(plan.future11bAllowedOperations.loadApprovedLocalDiffusersCache, true)
assert.equal(plan.future11bAllowedOperations.verifyCleanup, true)

for (const [flag, value] of Object.entries(plan.future11bBlockedOperations)) {
  assert.equal(value, true, `Future 11B blocked-operation marker must be true: ${flag}`)
}

for (const [flag, value] of Object.entries(plan.runtimeSideEffects)) {
  assert.equal(value, false, `Runtime side-effect flag must remain false: ${flag}`)
}

assert.equal(plan.externalAgentStateAfterPlan.brollPrimaryBlocker, 'broll_11b_model_import_proof_runner_required')
assert.equal(plan.externalAgentStateAfterPlan.brollReadyForModelImportExecutionNow, false)
assert.equal(plan.externalAgentStateAfterPlan.brollDependencyInstallWrapperStillCallable, true)
assert.equal(plan.claimsDryRunPassed, false)
assert.equal(plan.claimsGeneratedLocalFixturePassed, false)
assert.equal(plan.nextPrompt, AI_VIDEO_BROLL_GEN_11B_MODEL_IMPORT_PROOF_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, prompt, plan })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: plan.decision,
      selectedGpu: plan.selectedGpu,
      modelRepository: plan.modelRepository,
      modelImportRun: plan.runtimeSideEffects.modelImportRun,
      modelLoadRun: plan.runtimeSideEffects.modelLoadRun,
      modelInferenceRun: plan.runtimeSideEffects.modelInferenceRun,
      generatedVideoCreated: plan.runtimeSideEffects.generatedVideoCreated,
      generatedLocalFixturePassedClaimed: plan.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: plan.nextPrompt,
    },
    null,
    2,
  ),
)
