import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_11G_BOUNDED_INFERENCE_PROOF_RUNNER,
  AI_VIDEO_BROLL_GEN_11H_INFERENCE_PROOF_EXECUTE_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-11g-bounded-inference-proof-runner'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-11g-bounded-inference-proof-runner.md'
const CLI_PATH = 'server/cli/ai-video-broll-gen-11g-bounded-inference-proof-runner.ts'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-11g-bounded-inference-proof-runner.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11g-bounded-inference-proof-runner-smoke.ts'
const PACKAGE_RUNNER_SCRIPT = 'ai-video-broll-gen-11g:bounded-inference-proof-runner'
const PACKAGE_SMOKE_SCRIPT = 'smoke:ai-video-broll-gen-11g-bounded-inference-proof-runner'
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_11G_INFERENCE_PROOF'

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

function scanForbiddenValues(value: unknown, prefix = 'broll11gRunner'): string[] {
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

function assertAllTrue(flags: Record<string, unknown>) {
  for (const [key, value] of Object.entries(flags)) {
    assert.equal(value, true, `${key} must be true`)
  }
}

for (const file of [
  DOC_PATH,
  CLI_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-11f-inference-boundary-plan.md',
  'src/backend/mock/mock-ai-video-broll-gen-11f-inference-boundary-plan.ts',
  'docs/ai-video-broll-gen-11c-model-import-result-review.md',
  'server/cli/external-agent-tool-execute-broll-wan.ts',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_RUNNER_SCRIPT],
  'tsx server/cli/ai-video-broll-gen-11g-bounded-inference-proof-runner.ts',
  'package runner script mismatch',
)
assert.equal(
  packageJson.scripts?.[PACKAGE_SMOKE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11g-bounded-inference-proof-runner-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  'ai_video_broll_gen_11g_bounded_inference_proof_runner_static_guard_ready_no_execution',
  'This is runner/spec/smoke only.',
  'does not create a VM',
  'does not run Wan inference',
  'External agents must use structured tool envelopes and approved fixture inputs, not raw chat.',
  'command name: `ai-video-broll-gen-11g:bounded-inference-proof-runner`',
  'runner confirmation env: `REEDITPRO_CONFIRM_BROLL_11G_INFERENCE_PROOF=true`',
  'wrapper confirmation env: `REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF=true`',
  'execution mode in 11G: blocked until a later execute prompt',
  'static guard: `npm run ai-video-broll-gen-11g:bounded-inference-proof-runner -- --json`',
  'wrapper static guard: `npm run external-agent-tool-execute-broll-wan -- --inference-proof --json`',
  '`modelInferenceRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  AI_VIDEO_BROLL_GEN_11H_INFERENCE_PROOF_EXECUTE_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `11G runner doc missing ${required}`)
}

const cliSource = read(CLI_PATH)
for (const required of [
  'ai_video_broll_gen_11g_bounded_inference_proof_runner_static_guard',
  'ai_video_broll_gen_11g_bounded_inference_proof_runner_execution_prompt_required',
  CONFIRM_ENV,
  'separate_execution_prompt_required',
  'generatedVideoCreated: false',
  'generatedAssetsCreated: false',
  'generatedLocalFixturePassedClaimed: false',
]) {
  assert.equal(cliSource.includes(required), true, `11G runner CLI missing ${required}`)
}
for (const forbidden of [
  'spawnSync',
  'execSync',
  'execFileSync',
  'gcloud ',
  'docker ',
  'psql',
  'createdb',
  'dropdb',
  'supabase ',
  'from_pretrained',
  'torch.',
  'pipe(',
  'num_inference_steps',
  'num_frames',
  'export_to_video',
  'imageio',
  'cv2',
  'ffmpeg ',
]) {
  assert.equal(cliSource.includes(forbidden), false, `11G runner must not include runtime marker: ${forbidden}`)
}

const staticReport = runCli(['--json'])
assert.equal(staticReport.ok, false)
assert.equal(staticReport.mode, 'ai_video_broll_gen_11g_bounded_inference_proof_runner_static_guard')
assert.equal(staticReport.status, 'planned')
assert.equal(staticReport.confirmationEnv, CONFIRM_ENV)
assert.equal(staticReport.executionRequiresSeparatePrompt, true)
assert.equal(staticReport.rawChatPromptAllowed, false)
assert.equal(staticReport.generatedVideoCreated, false)
assert.equal(staticReport.generatedAssetsCreated, false)
assert.equal(staticReport.generatedLocalFixturePassedClaimed, false)
assertAllFalse(staticReport.runtimeSideEffects as Record<string, unknown>)

const executionBlocked = runCli(['--execute', '--json'])
assert.equal(executionBlocked.ok, false)
assert.equal(executionBlocked.mode, 'ai_video_broll_gen_11g_bounded_inference_proof_runner_execution_prompt_required')
assert.equal(executionBlocked.status, 'blocked')
assert.equal((executionBlocked.blockers as string[]).length, 2)
assert.equal((executionBlocked.blockers as string[])[0].includes('separate_execution_prompt_required'), true)
assert.equal(executionBlocked.generatedVideoCreated, false)
assert.equal(executionBlocked.generatedAssetsCreated, false)
assert.equal(executionBlocked.generatedLocalFixturePassedClaimed, false)
assertAllFalse(executionBlocked.runtimeSideEffects as Record<string, unknown>)

const spec = AI_VIDEO_BROLL_GEN_11G_BOUNDED_INFERENCE_PROOF_RUNNER
assert.equal(spec.decision, 'ai_video_broll_gen_11g_bounded_inference_proof_runner_static_guard_ready_no_execution')
assert.equal(spec.mode, 'ai_video_broll_gen_11g_bounded_inference_proof_runner_contract')
assert.equal(spec.runnerScript, CLI_PATH)
assert.equal(spec.packageScript, PACKAGE_RUNNER_SCRIPT)
assert.equal(spec.confirmationEnv, CONFIRM_ENV)
assert.equal(spec.wrapperConfirmationEnv, 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF')
assert.equal(spec.allowedRunnerModes.staticGuard, true)
assert.equal(spec.allowedRunnerModes.confirmationBlocked, true)
assert.equal(spec.allowedRunnerModes.executionModeImplementedNow, false)
assert.equal(spec.allowedRunnerModes.executionRequiresSeparatePrompt, true)
assert.equal(spec.approvedFixture.rawChatPromptAllowed, false)
assert.equal(spec.approvedFixture.persistedOutputAllowed, false)
assert.equal(spec.futureExecutionContract.runMinimalInferenceCanary, true)
assert.equal(spec.futureExecutionContract.keepInferenceOutputTransient, true)
assertAllTrue(spec.blockedRuntimeOperations)
assertAllFalse(spec.runtimeSideEffectsWhenStatic)
assert.equal(spec.nextPromptOnRunnerReady, AI_VIDEO_BROLL_GEN_11H_INFERENCE_PROOF_EXECUTE_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, staticReport, executionBlocked, spec })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: spec.decision,
      runnerScript: spec.runnerScript,
      selectedGpu: spec.selectedGpu,
      staticMode: staticReport.mode,
      executionBlockedMode: executionBlocked.mode,
      modelInferenceRun: false,
      generatedVideoCreated: false,
      generatedAssetsCreated: false,
      generatedLocalFixturePassedClaimed: false,
      nextPrompt: spec.nextPromptOnRunnerReady,
    },
    null,
    2,
  ),
)
