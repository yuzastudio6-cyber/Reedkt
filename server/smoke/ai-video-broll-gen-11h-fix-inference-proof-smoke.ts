import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_GEN_11H_FIX_INFERENCE_PROOF } from '../../src/backend/mock/mock-ai-video-broll-gen-11h-fix-inference-proof'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-11h-fix-inference-proof.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-11h-fix-inference-proof.ts'
const RUNNER_PATH = 'server/cli/ai-video-broll-gen-11h-bounded-inference-proof-runner.ts'
const EXECUTE_SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-11h-inference-proof-execute.ts'
const EXECUTE_SMOKE_PATH = 'server/smoke/ai-video-broll-gen-11h-inference-proof-execute-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-11h-fix-inference-proof'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll11hFix'): string[] {
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

for (const file of [DOC_PATH, SPEC_PATH, RUNNER_PATH, EXECUTE_SPEC_PATH, EXECUTE_SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-11h-fix-inference-proof-smoke.ts',
  'package 11H-FIX smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  'ai_video_broll_gen_11h_fix_inference_proof_static_fix_ready_no_execution',
  'does not create a VM',
  'Change the future proof VM from `g2-standard-4` to `g2-standard-8`',
  'Route the immediate retry to `northamerica-northeast2-b`',
  '`ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS`',
  'REEDITPRO_BROLL_11H_WAN_PIPELINE_LOAD_START',
  'REEDITPRO_BROLL_11H_WAN_PIPELINE_LOAD_OK',
  'REEDITPRO_BROLL_11H_WAN_PIPELINE_CPU_OFFLOAD_OK',
  'REEDITPRO_BROLL_11H_LATENT_INFERENCE_CANARY_START',
  'HF_ENABLE_PARALLEL_LOADING=true',
  'HF_PARALLEL_LOADING_WORKERS=4',
  'PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True',
  'Extend the bounded latent canary timeout to 90 minutes',
  'No generated B-roll video is ready.',
  'No always-on GPU runtime is allowed.',
  'generated_local_fixture_passed` is not claimed',
  'AI-VIDEO-BROLL-GEN-11H-RETRY-INFERENCE-PROOF: rerun bounded Wan latent inference proof with 11H fix, no generated video',
]) {
  assert.equal(doc.includes(required), true, `11H-FIX doc missing ${required}`)
}

const runner = read(RUNNER_PATH)
for (const required of [
  "const SOURCE_PAYLOAD_INSTALL_MACHINE_TYPE = CONTRACT.machineType",
  "const MACHINE_TYPE = 'g2-standard-8'",
  'const WAN_LATENT_CANARY_TIMEOUT_MS = 90 * 60_000',
  "os.environ['HF_ENABLE_PARALLEL_LOADING'] = 'true'",
  "os.environ['HF_PARALLEL_LOADING_WORKERS'] = '4'",
  "os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'",
  'REEDITPRO_BROLL_11H_WAN_PIPELINE_LOAD_START',
  'REEDITPRO_BROLL_11H_WAN_PIPELINE_LOAD_OK',
  'REEDITPRO_BROLL_11H_WAN_PIPELINE_CPU_OFFLOAD_OK',
  'REEDITPRO_BROLL_11H_LATENT_INFERENCE_CANARY_START',
  'WAN_LATENT_CANARY_TIMEOUT_MS',
  "const TARGET_ZONE = 'northamerica-northeast2-b'",
  'sourceContractTargetZone: SOURCE_CONTRACT_TARGET_ZONE',
  'GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV',
  "const GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG = '--account-index'",
  "const GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG_ALIAS = '--gcloud-account-index'",
  'accountSelectionOutput()',
  'gcloudAccountEnv()',
  'CLOUDSDK_CORE_ACCOUNT',
  'mutatesLocalGcloudConfig: false',
  "wanPipelineLocalLoadPassed = Boolean(canary.stdoutSummary?.includes('REEDITPRO_BROLL_11H_WAN_PIPELINE_LOAD_OK'))",
]) {
  assert.equal(runner.includes(required), true, `11H runner missing fixed marker: ${required}`)
}

const staticOutput = execFileSync('npx', ['tsx', RUNNER_PATH, '--json'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 8,
  env: {
    ...process.env,
    REEDITPRO_CONFIRM_BROLL_11H_INFERENCE_PROOF_EXECUTE: '',
  },
})
const staticReport = JSON.parse(staticOutput) as Record<string, unknown>
assert.equal(staticReport.ok, false)
assert.equal(staticReport.mode, 'ai_video_broll_gen_11h_l4_inference_proof_runner_static_plan')
assert.equal(staticReport.computeVmCreated, false)
assert.equal(staticReport.generatedVideoCreated, false)
assert.equal(staticReport.generatedAssetsCreated, false)
assert.equal(staticReport.targetRegion, 'northamerica-northeast2')
assert.equal(staticReport.targetZone, 'northamerica-northeast2-b')
assert.equal(staticReport.sourceContractTargetZone, 'northamerica-northeast2-a')
assertAllFalse(staticReport.runtimeSideEffects as Record<string, unknown>)
const staticAccountSelection = staticReport.accountSelection as Record<string, unknown>
assert.equal(staticAccountSelection.overrideIndexEnv, 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX')
assert.equal(staticAccountSelection.overrideIndexCliFlag, '--account-index')
assert.equal(staticAccountSelection.overrideIndexCliFlagAlias, '--gcloud-account-index')
assert.equal(staticAccountSelection.overrideIndexProvided, false)
assert.equal(staticAccountSelection.overrideResolved, false)
assert.equal(staticAccountSelection.mutatesLocalGcloudConfig, false)

const indexedStaticOutput = execFileSync('npx', ['tsx', RUNNER_PATH, '--json', '--account-index=2'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 8,
  env: {
    ...process.env,
    REEDITPRO_CONFIRM_BROLL_11H_INFERENCE_PROOF_EXECUTE: '',
  },
})
const indexedStaticReport = JSON.parse(indexedStaticOutput) as Record<string, unknown>
const indexedAccountSelection = indexedStaticReport.accountSelection as Record<string, unknown>
assert.equal(indexedAccountSelection.overrideIndexProvided, true)
assert.equal(indexedAccountSelection.overrideIndexSource, 'cli')
assert.equal(indexedAccountSelection.overrideIndex, 2)
assert.equal(indexedAccountSelection.mutatesLocalGcloudConfig, false)

const spec = AI_VIDEO_BROLL_GEN_11H_FIX_INFERENCE_PROOF
assert.equal(spec.decision, 'ai_video_broll_gen_11h_fix_inference_proof_static_fix_ready_no_execution')
assert.equal(spec.selectedGpu, 'nvidia_l4')
assert.equal(spec.sourcePayloadInstallMachineType, 'g2-standard-4')
assert.equal(spec.retryMachineType, 'g2-standard-8')
assert.equal(spec.targetZone, 'northamerica-northeast2-b')
assert.equal(
  spec.targetZoneRationale.includes('ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS'),
  true,
)
assert.equal(spec.fixActions.increaseHostMemorySameGpu, true)
assert.equal(spec.fixActions.addPipelineLoadMarkersBeforeInference, true)
assert.equal(spec.fixActions.parsePipelineLoadMarkerWithoutRequiringCanarySuccess, true)
assert.equal(spec.fixActions.enableParallelOfflineLoadingHints, true)
assert.equal(spec.fixActions.canaryTimeoutMinutes, 90)
assert.equal(spec.noIdleLifecycle.noPublicIpRequired, true)
assert.equal(spec.noIdleLifecycle.idleGpuAllowed, false)
assert.equal(spec.noIdleLifecycle.alwaysOnGpuAllowed, false)
assertAllFalse(spec.runtimeSideEffectsNow)
assert.equal(spec.futureRetryRequirements.generatedVideoAllowed, false)
assert.equal(spec.futureRetryRequirements.persistedLatentsAllowed, false)
assert.equal(spec.futureRetryRequirements.supabaseMutationAllowed, false)
assert.equal(spec.futureRetryRequirements.creditMutationAllowed, false)

const forbiddenFindings = scanForbiddenValues({ doc, spec, staticReport, indexedStaticReport })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: spec.decision,
      selectedGpu: spec.selectedGpu,
      sourcePayloadInstallMachineType: spec.sourcePayloadInstallMachineType,
      retryMachineType: spec.retryMachineType,
      canaryTimeoutMinutes: spec.fixActions.canaryTimeoutMinutes,
      staticRuntimeGatesAllFalse: true,
      nextPrompt: spec.nextPrompt,
    },
    null,
    2,
  ),
)
