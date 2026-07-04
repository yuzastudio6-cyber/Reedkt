import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_GEN_11E_CLOUD_SIDE_CACHE_STAGING_RUNNER } from '../../src/backend/mock/mock-ai-video-broll-gen-11e-cloud-side-cache-staging-runner'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-11e-cloud-side-cache-staging-runner.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-11e-cloud-side-cache-staging-runner.ts'
const CLI_PATH = 'server/cli/ai-video-broll-gen-11e-cloud-side-cache-staging-runner.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11e-cloud-side-cache-staging-runner-smoke.ts'
const PACKAGE_SCRIPT = 'ai-video-broll-gen-11e:cloud-side-cache-staging-runner'
const SMOKE_SCRIPT = 'smoke:ai-video-broll-gen-11e-cloud-side-cache-staging-runner'
const DECISION = 'ai_video_broll_gen_11e_cloud_side_cache_staging_runner_implemented_no_execution'
const NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-11E-EXECUTE-CLOUD-SIDE-CACHE-STAGING: run no-GPU Wan private cache staging runner with explicit confirmation, no inference/no generated video'
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_11E_CLOUD_SIDE_CACHE_STAGING'

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

function scanForbiddenValues(value: unknown, prefix = 'broll11e'): string[] {
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
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
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

function assertRuntimeFalse(report: Record<string, unknown>) {
  const runtime = report.runtimeSideEffects as Record<string, boolean>
  for (const [key, value] of Object.entries(runtime)) {
    assert.equal(value, false, `Runtime side-effect must be false in non-execute smoke: ${key}`)
  }
}

for (const file of [
  DOC_PATH,
  SPEC_PATH,
  CLI_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-11d-cache-staging-strategy-fix.md',
  'src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/ai-video-broll-gen-11e-cloud-side-cache-staging-runner.ts',
  'package 11E runner script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11e-cloud-side-cache-staging-runner-smoke.ts',
  'package 11E runner smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  'no-GPU Wan / Wan2.1 private model-cache staging runner',
  'REEDITPRO_CONFIRM_BROLL_11E_CLOUD_SIDE_CACHE_STAGING=true',
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_CACHE_FILL=true',
  'gcr.io/google.com/cloudsdktool/google-cloud-cli:slim',
  'ready marker only after the expected 19 files and `28928887859` aggregate bytes match',
  'does not run the runner',
  'modelInferenceRun=false',
  'generatedVideoCreated=false',
  'generatedAssetsCreated=false',
  'generatedLocalFixturePassedClaimed=false',
  NEXT_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `Doc missing ${required}`)
}

const spec = AI_VIDEO_BROLL_GEN_11E_CLOUD_SIDE_CACHE_STAGING_RUNNER
assert.equal(spec.decision, DECISION)
assert.equal(spec.mode, 'cloud_side_cache_staging_runner_implementation_only')
assert.equal(spec.cloudSideRunnerReady, true)
assert.equal(spec.explicitConfirmationRequired, true)
assert.equal(spec.gpuRequired, false)
assert.equal(spec.stagesPrivateGcsModelCacheOnly, true)
assert.equal(spec.manifest.runtimeEssentialFileCount, 19)
assert.equal(spec.manifest.aggregateBytes, 28928887859)
assert.equal(spec.executionGates.noGpu, true)
assert.equal(spec.executionGates.noModelImport, true)
assert.equal(spec.executionGates.noInference, true)
assert.equal(spec.executionGates.noGeneratedVideo, true)
assert.equal(spec.executionGates.noGeneratedAssets, true)
assert.equal(spec.nextPrompt, NEXT_PROMPT)
for (const [key, value] of Object.entries(spec.runtimeSideEffectsInThisPrompt)) {
  assert.equal(value, false, `Spec runtime side-effect must remain false: ${key}`)
}

const source = read(CLI_PATH)
for (const required of [
  CONFIRM_ENV,
  'gcloud storage cp',
  'run',
  'jobs',
  'create',
  'execute_prompt_scoped_no_gpu_cloud_run_job',
  'delete_prompt_scoped_no_gpu_cloud_run_job',
  'Wan-AI/Wan2.1-T2V-1.3B-Diffusers',
  'wan-model-cache-ready.json',
  'modelInferenceRun: false',
  'generatedVideoCreated: false',
  'generatedAssetsCreated: false',
  'signedUrlsCreated: false',
]) {
  assert.equal(source.includes(required), true, `Runner source missing ${required}`)
}
for (const forbidden of ['compute instances create', 'docker ', 'psql', 'createdb', 'dropdb', 'supabase ', 'from_pretrained', 'WanPipeline']) {
  assert.equal(source.includes(forbidden), false, `Runner source must not include forbidden runtime marker: ${forbidden}`)
}

const staticReport = runCli(['--json'])
assert.equal(staticReport.ok, false)
assert.equal(staticReport.mode, 'ai_video_broll_gen_11e_cloud_side_cache_staging_runner_static_guard')
assert.equal(staticReport.status, 'planned')
assert.equal(staticReport.confirmationEnv, CONFIRM_ENV)
assert.equal(staticReport.confirmationEnvRequiredValue, 'true')
assert.equal(staticReport.selectedGpu, 'none')
assert.equal(staticReport.nextPrompt, NEXT_PROMPT)
assertRuntimeFalse(staticReport)

const confirmationBlocked = runCli(['--execute', '--json'])
assert.equal(confirmationBlocked.ok, false)
assert.equal(confirmationBlocked.mode, 'ai_video_broll_gen_11e_cloud_side_cache_staging_runner_confirmation_blocked')
assert.equal(confirmationBlocked.status, 'blocked')
assert.deepEqual(confirmationBlocked.blockers, [`confirmation_env_required:${CONFIRM_ENV}=true`])
assert.equal(confirmationBlocked.nextPrompt, NEXT_PROMPT)
assertRuntimeFalse(confirmationBlocked)

const forbiddenFindings = [
  ...scanForbiddenValues(spec),
  ...scanForbiddenValues(staticReport, 'broll11eStatic'),
  ...scanForbiddenValues(confirmationBlocked, 'broll11eBlocked'),
]
assert.deepEqual(forbiddenFindings, [])

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: spec.decision,
      runnerScript: spec.runnerScript,
      staticMode: staticReport.mode,
      confirmationBlockedMode: confirmationBlocked.mode,
      cloudSideRunnerReady: spec.cloudSideRunnerReady,
      gpuRequired: spec.gpuRequired,
      runtimeGatesFalseInSmoke: true,
      nextPrompt: spec.nextPrompt,
    },
    null,
    2,
  ),
)
