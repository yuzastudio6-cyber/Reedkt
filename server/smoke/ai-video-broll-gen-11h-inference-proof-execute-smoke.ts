import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_GEN_11H_INFERENCE_PROOF_EXECUTE } from '../../src/backend/mock/mock-ai-video-broll-gen-11h-inference-proof-execute'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-11h-inference-proof-execute.md'
const CLI_PATH = 'server/cli/ai-video-broll-gen-11h-bounded-inference-proof-runner.ts'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-11h-inference-proof-execute.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11h-inference-proof-execute-smoke.ts'
const PACKAGE_RUNNER_SCRIPT = 'ai-video-broll-gen-11h:bounded-inference-proof-runner'
const PACKAGE_SMOKE_SCRIPT = 'smoke:ai-video-broll-gen-11h-inference-proof-execute'
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_11H_INFERENCE_PROOF_EXECUTE'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function runCli(args: string[] = []) {
  const output = execFileSync('npx', ['tsx', CLI_PATH, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8,
    env: {
      ...process.env,
      [CONFIRM_ENV]: '',
    },
  })

  return JSON.parse(output) as Record<string, unknown>
}

function scanForbiddenValues(value: unknown, prefix = 'broll11hInferenceProof'): string[] {
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

function assertAllFalse(flags: Record<string, unknown>) {
  for (const [key, value] of Object.entries(flags)) {
    assert.equal(value, false, `${key} must be false`)
  }
}

for (const file of [
  DOC_PATH,
  CLI_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-11g-bounded-inference-proof-runner.md',
  'src/backend/mock/mock-ai-video-broll-gen-11g-bounded-inference-proof-runner.ts',
  'docs/ai-video-broll-gen-11f-inference-boundary-plan.md',
  'docs/ai-video-broll-gen-11b-model-import-proof-execution-result.md',
  'server/cli/external-agent-tool-execute-broll-wan.ts',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_RUNNER_SCRIPT],
  'tsx server/cli/ai-video-broll-gen-11h-bounded-inference-proof-runner.ts',
  'package runner script mismatch',
)
assert.equal(
  packageJson.scripts?.[PACKAGE_SMOKE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11h-inference-proof-execute-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  'ai_video_broll_gen_11h_bounded_latent_inference_proof_runner_ready_prompt_scoped_execution',
  'does not create generated B-roll video',
  'External agents must use structured tool envelopes and approved fixture inputs, not raw chat.',
  'command name: `ai-video-broll-gen-11h:bounded-inference-proof-runner`',
  'runner confirmation env: `REEDITPRO_CONFIRM_BROLL_11H_INFERENCE_PROOF_EXECUTE=true`',
  'wrapper confirmation env: `REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF=true`',
  '`output_type="latent"`',
  '`num_inference_steps=1`',
  '`transientLatentsCreated=true`',
  '`inferenceOutputPersisted=false`',
  '`vaeDecodeRun=false`',
  '`frameCreationRun=false`',
  '`videoEncodingRun=false`',
  '`ffmpegRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  'AI-VIDEO-BROLL-GEN-11I-INFERENCE-PROOF-RESULT-REVIEW: review bounded Wan inference proof result, no generated video',
]) {
  assert.equal(doc.includes(required), true, `11H doc missing ${required}`)
}

const cliSource = read(CLI_PATH)
for (const required of [
  CONFIRM_ENV,
  'ai_video_broll_gen_11h_l4_inference_proof_runner_static_plan',
  'ai_video_broll_gen_11h_l4_inference_proof_runner_confirmation_blocked',
  'ai_video_broll_gen_11h_l4_inference_proof_runner_read_only_preflight_only',
  'ai_video_broll_gen_11h_l4_inference_proof_runner_execute_result',
  'WanPipeline.from_pretrained',
  'local_files_only=True',
  "output_type='latent'",
  'num_inference_steps=1',
  'num_frames=1',
  'REEDITPRO_BROLL_11H_LATENT_INFERENCE_CANARY_OK',
  'inferenceOutputPersisted: false',
  'vaeDecodeRun: false',
  'frameCreationRun: false',
  'videoEncodingRun: false',
  'ffmpegRun: false',
  'generatedVideoCreated: false',
  'generatedAssetsCreated: false',
  'generatedLocalFixturePassedClaimed: false',
]) {
  assert.equal(cliSource.includes(required), true, `11H CLI missing ${required}`)
}
for (const forbidden of [
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
  assert.equal(cliSource.includes(forbidden), false, `11H runner must not include marker: ${forbidden}`)
}

const staticReport = runCli(['--json'])
assert.equal(staticReport.ok, false)
assert.equal(staticReport.mode, 'ai_video_broll_gen_11h_l4_inference_proof_runner_static_plan')
assert.equal(staticReport.status, 'planned')
assert.equal(staticReport.computeVmCreated, false)
assert.equal(staticReport.wanLatentInferenceCanaryPassed, false)
assert.equal(staticReport.promptEncodingRun, false)
assert.equal(staticReport.denoisingRun, false)
assert.equal(staticReport.transientLatentsCreated, false)
assert.equal(staticReport.inferenceOutputPersisted, false)
assert.equal((staticReport.runtimeSideEffects as Record<string, unknown>).modelInferenceRun, false)
assert.equal((staticReport.runtimeSideEffects as Record<string, unknown>).generatedVideoCreated, false)
assert.equal((staticReport.runtimeSideEffects as Record<string, unknown>).generatedAssetsCreated, false)
assertAllFalse(staticReport.runtimeSideEffects as Record<string, unknown>)

const confirmationBlocked = runCli(['--execute', '--json'])
assert.equal(confirmationBlocked.ok, false)
assert.equal(confirmationBlocked.mode, 'ai_video_broll_gen_11h_l4_inference_proof_runner_confirmation_blocked')
assert.equal(confirmationBlocked.status, 'blocked')
assert.deepEqual(confirmationBlocked.blockers, [`confirmation_env_required:${CONFIRM_ENV}=true`])
assert.equal(confirmationBlocked.computeVmCreated, false)
assert.equal(confirmationBlocked.wanLatentInferenceCanaryPassed, false)
assert.equal(confirmationBlocked.generatedVideoCreated, false)
assert.equal(confirmationBlocked.generatedAssetsCreated, false)
assert.equal(confirmationBlocked.generatedLocalFixturePassedClaimed, false)
assertAllFalse(confirmationBlocked.runtimeSideEffects as Record<string, unknown>)

const spec = AI_VIDEO_BROLL_GEN_11H_INFERENCE_PROOF_EXECUTE
assert.equal(spec.decision, 'ai_video_broll_gen_11h_bounded_latent_inference_proof_runner_ready_prompt_scoped_execution')
assert.equal(spec.runnerScript, CLI_PATH)
assert.equal(spec.packageScript, PACKAGE_RUNNER_SCRIPT)
assert.equal(spec.confirmationEnv, CONFIRM_ENV)
assert.equal(spec.wrapperConfirmationEnv, 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF')
assert.equal(spec.liveExecutionContract.outputType, 'latent')
assert.equal(spec.liveExecutionContract.numInferenceSteps, 1)
assert.equal(spec.liveExecutionContract.numFrames, 1)
assert.equal(spec.liveExecutionContract.vaeDecodeAllowed, false)
assert.equal(spec.liveExecutionContract.frameCreationAllowed, false)
assert.equal(spec.liveExecutionContract.videoEncodingAllowed, false)
assert.equal(spec.liveExecutionContract.persistedOutputAllowed, false)
assert.equal(spec.approvedFixture.rawChatPromptAllowed, false)
assert.equal(spec.approvedFixture.persistedOutputAllowed, false)
assertAllFalse(spec.runtimeSideEffectsWhenStatic)
assert.equal(spec.allowedExecutionSideEffectsWhenConfirmed.modelInferenceRun, true)
assert.equal(spec.allowedExecutionSideEffectsWhenConfirmed.promptEncodingRun, true)
assert.equal(spec.allowedExecutionSideEffectsWhenConfirmed.denoisingRun, true)
assert.equal(spec.allowedExecutionSideEffectsWhenConfirmed.transientLatentsCreated, true)
assert.equal(spec.allowedExecutionSideEffectsWhenConfirmed.inferenceOutputPersisted, false)
assert.equal(spec.allowedExecutionSideEffectsWhenConfirmed.generatedVideoCreated, false)
assert.equal(spec.allowedExecutionSideEffectsWhenConfirmed.generatedAssetsCreated, false)
assert.equal(spec.nextPromptOnPass, 'AI-VIDEO-BROLL-GEN-11I-INFERENCE-PROOF-RESULT-REVIEW: review bounded Wan inference proof result, no generated video')

const forbiddenFindings = scanForbiddenValues({ doc, staticReport, confirmationBlocked, spec })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      script: PACKAGE_SMOKE_SCRIPT,
      runnerScript: PACKAGE_RUNNER_SCRIPT,
      staticModeChecked: true,
      confirmationBlockedModeChecked: true,
      outputType: spec.liveExecutionContract.outputType,
      numInferenceSteps: spec.liveExecutionContract.numInferenceSteps,
      generatedVideoCreated: false,
      generatedAssetsCreated: false,
      generatedLocalFixturePassedClaimed: false,
      nextPrompt: spec.nextPromptOnPass,
    },
    null,
    2,
  ),
)
