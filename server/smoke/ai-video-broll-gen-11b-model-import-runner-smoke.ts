import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_GEN_11B_MODEL_IMPORT_RUNNER } from '../../src/backend/mock/mock-ai-video-broll-gen-11b-model-import-runner'

const ROOT = process.cwd()
const CLI_PATH = 'server/cli/ai-video-broll-gen-11b-l4-model-import-runner.ts'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-11b-model-import-runner.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11b-model-import-runner-smoke.ts'
const PACKAGE_RUNNER_SCRIPT = 'ai-video-broll-gen-11b:l4-model-import-runner'
const PACKAGE_SMOKE_SCRIPT = 'smoke:ai-video-broll-gen-11b-model-import-runner'
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_11B_MODEL_IMPORT_PROOF'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function runCli(args: string[] = []) {
  const output = execFileSync('npx', ['tsx', CLI_PATH, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 4,
    env: {
      ...process.env,
      [CONFIRM_ENV]: '',
    },
  })

  return JSON.parse(output) as Record<string, unknown>
}

function scanForbiddenValues(value: unknown, prefix = 'broll11bModelImportRunner'): string[] {
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

for (const file of [
  CLI_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-11a-model-import-plan.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-11b-model-import-proof.md',
  'src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts',
  'server/cli/ai-video-broll-gen-10zb-l4-payload-install-runner.ts',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_RUNNER_SCRIPT],
  'tsx server/cli/ai-video-broll-gen-11b-l4-model-import-runner.ts',
  'package runner script mismatch',
)
assert.equal(
  packageJson.scripts?.[PACKAGE_SMOKE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11b-model-import-runner-smoke.ts',
  'package smoke script mismatch',
)

const source = read(CLI_PATH)
for (const required of [
  CONFIRM_ENV,
  '--read-only-preflight',
  'ai_video_broll_gen_11b_l4_model_import_runner_static_plan',
  'ai_video_broll_gen_11b_l4_model_import_runner_confirmation_blocked',
  'ai_video_broll_gen_11b_l4_model_import_runner_read_only_preflight_only',
  'ai_video_broll_gen_11b_l4_model_import_runner_private_gcs_model_cache_fill_only',
  'ai_video_broll_gen_11b_l4_model_import_runner_execute_result',
  'markerClassMatches',
  'buildRemoteExactGcsDownloadScript',
  'waitForPython312Readiness',
  'isTransientSshTransportFailure',
  'fallbackSourcePrefix',
  'source_prefixes',
  'exec(${JSON.stringify(scriptBody)})',
  'urllib.request.urlopen',
  'urllib.error.HTTPError',
  'privateGcsObjectPrefix',
  'WanPipeline.from_pretrained',
  'local_files_only=True',
  'low_cpu_mem_usage=True',
  'HF_HUB_OFFLINE',
  'TRANSFORMERS_OFFLINE',
  'DIFFUSERS_OFFLINE',
  'promptEncodingRun: false',
  'denoisingRun: false',
  'vaeDecodeRun: false',
  'frameCreationRun: false',
  'videoEncodingRun: false',
  'modelInferenceRun: false',
  'generatedVideoCreated: false',
  'generatedAssetsCreated: false',
  'generatedLocalFixturePassedClaimed: false',
  'REEDITPRO_BROLL_11B_WAN_PIPELINE_LOAD_OK',
]) {
  assert.equal(source.includes(required), true, `11B runner source missing ${required}`)
}

for (const forbidden of [
  'pipe(',
  'num_inference_steps',
  'num_frames',
  'export_to_video',
  'imageio',
  'cv2',
  'ffmpeg ',
  'supabase ',
  'psql',
  'createdb',
  'dropdb',
  'docker ',
]) {
  assert.equal(source.includes(forbidden), false, `11B runner must not include runtime marker: ${forbidden}`)
}

const staticReport = runCli(['--json'])
assert.equal(staticReport.ok, false)
assert.equal(staticReport.mode, 'ai_video_broll_gen_11b_l4_model_import_runner_static_plan')
assert.equal(staticReport.status, 'planned')
assert.equal(staticReport.computeVmCreated, false)
assert.equal(staticReport.wanPipelineClassImportPassed, false)
assert.equal(staticReport.wanPipelineLocalLoadPassed, false)
assert.equal((staticReport.runtimeSideEffects as Record<string, unknown>).modelImportRun, false)
assert.equal((staticReport.runtimeSideEffects as Record<string, unknown>).modelLoadRun, false)
assert.equal((staticReport.runtimeSideEffects as Record<string, unknown>).modelInferenceRun, false)
assert.equal((staticReport.runtimeSideEffects as Record<string, unknown>).generatedVideoCreated, false)
assert.equal((staticReport.runtimeSideEffects as Record<string, unknown>).generatedAssetsCreated, false)
assert.equal((staticReport.runtimeSideEffects as Record<string, unknown>).generatedLocalFixturePassedClaimed, false)

const confirmationBlocked = runCli(['--execute', '--json'])
assert.equal(confirmationBlocked.ok, false)
assert.equal(confirmationBlocked.mode, 'ai_video_broll_gen_11b_l4_model_import_runner_confirmation_blocked')
assert.equal(confirmationBlocked.status, 'blocked')
assert.deepEqual(confirmationBlocked.blockers, [`confirmation_env_required:${CONFIRM_ENV}=true`])
assert.equal(confirmationBlocked.computeVmCreated, false)
assert.equal(confirmationBlocked.wanPipelineClassImportPassed, false)
assert.equal(confirmationBlocked.wanPipelineLocalLoadPassed, false)
assert.equal((confirmationBlocked.runtimeSideEffects as Record<string, unknown>).modelImportRun, false)
assert.equal((confirmationBlocked.runtimeSideEffects as Record<string, unknown>).modelLoadRun, false)
assert.equal((confirmationBlocked.runtimeSideEffects as Record<string, unknown>).modelInferenceRun, false)
assert.equal((confirmationBlocked.runtimeSideEffects as Record<string, unknown>).generatedVideoCreated, false)
assert.equal((confirmationBlocked.runtimeSideEffects as Record<string, unknown>).generatedAssetsCreated, false)
assert.equal((confirmationBlocked.runtimeSideEffects as Record<string, unknown>).generatedLocalFixturePassedClaimed, false)

const spec = AI_VIDEO_BROLL_GEN_11B_MODEL_IMPORT_RUNNER
assert.equal(spec.decision, 'ai_video_broll_gen_11b_model_import_runner_ready_for_explicit_no_inference_execution')
assert.equal(spec.mode, 'ai_video_broll_gen_11b_model_import_runner_contract')
assert.equal(spec.runnerScript, CLI_PATH)
assert.equal(spec.confirmationEnv, CONFIRM_ENV)
assert.equal(spec.selectedGpu, 'nvidia_l4')
assert.equal(spec.machineType, 'g2-standard-4')
assert.equal(spec.modelCache.modelRepository, 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers')
assert.equal(spec.modelCache.expectedModelIndexClassName, 'WanPipeline')
assert.equal(spec.modelCache.runtimeEssentialFileCount, 19)
assert.equal(spec.modelCache.aggregateBytes, 28928887859)
assert.equal(spec.allowedRunnerModes.confirmedPrivateGcsModelCacheFill, true)
assert.equal(spec.allowedRunnerModes.confirmedNoInferenceModelImportLoadProof, true)
assert.equal(spec.allowedRuntimeOperations.loadApprovedLocalDiffusersCache, true)
assert.equal(spec.allowedRuntimeOperations.importWanPipelineClass, true)

for (const [flag, value] of Object.entries(spec.blockedRuntimeOperations)) {
  assert.equal(value, true, `Blocked runtime operation marker must be true: ${flag}`)
}

for (const [flag, value] of Object.entries(spec.runtimeSideEffectsWhenStatic)) {
  assert.equal(value, false, `Static side-effect flag must remain false: ${flag}`)
}

const forbiddenFindings = scanForbiddenValues({ staticReport, confirmationBlocked, spec })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: spec.decision,
      runnerScript: spec.runnerScript,
      selectedGpu: spec.selectedGpu,
      modelRepository: spec.modelCache.modelRepository,
      staticMode: staticReport.mode,
      confirmationBlockedMode: confirmationBlocked.mode,
      modelImportRun: false,
      modelLoadRun: false,
      modelInferenceRun: false,
      generatedVideoCreated: false,
      generatedLocalFixturePassedClaimed: false,
      nextPromptOnPass: spec.nextPromptOnPass,
    },
    null,
    2,
  ),
)
