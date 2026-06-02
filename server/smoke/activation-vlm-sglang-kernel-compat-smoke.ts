import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  VLM_SGLANG_KERNEL_COMPAT_MATRIX_ID,
  buildVlmSglangKernelImportFailureAudit,
  buildVlmSglangKernelProfileMatrixReport,
  getVlmSglangKernelCompatCostSummary,
  getVlmSglangKernelCompatPlan,
  vlmSglangKernelCompatProfiles,
} from '../activation/vlm-sglang-runtime'
import { vlmL4CompatibleCandidates } from '../activation/vlm-l4-compatible-candidate'

const plan = getVlmSglangKernelCompatPlan()
assert.equal(plan.phase, '39C-SG-KERNEL')
assert.equal(plan.defaultMode, 'non_mutating')
assert.equal(plan.matrixId, 'phase39c-sglang-kernel-compat-l4-v1')
assert.equal(VLM_SGLANG_KERNEL_COMPAT_MATRIX_ID, 'phase39c-sglang-kernel-compat-l4-v1')
assert.equal(plan.cloudBuild.configPath, 'cloudbuild/vlm-sglang-runtime-phase39c-kernel.yaml')
assert.equal(plan.cloudBuild.dockerfile, 'docker/prod/vlm-sglang-runtime/Dockerfile.kernel')
assert.equal(plan.cloudBuild.noModelFilesBaked, true)
assert.equal(plan.cloudBuild.noSecretsBaked, true)
assert.equal(plan.importSmokeJob.copiesModelPayload, false)
assert.equal(plan.importSmokeJob.runsInference, false)
assert.equal(plan.importSmokeJob.processesImages, false)
assert.equal(plan.importSmokeJob.providerCalls, false)
assert.equal(plan.generatedRuntimeJob.modelPayload, 'copy_exact_pr87_private_objects_after_import_smoke_only')
assert.equal(plan.candidatePolicy.newModelDownloadsAllowed, false)
assert.equal(plan.candidatePolicy.modelUploadsAllowed, false)
assert.equal(plan.candidatePolicy.modelIdRuntimePathAllowed, false)
assert.equal(plan.candidatePolicy.nonQwenCandidatesAllowed, false)
assert.equal(plan.safety.generatedSyntheticFixturesOnly, true)
assert.equal(plan.safety.realMediaBlocked, true)
assert.equal(plan.safety.arbitraryMediaBlocked, true)
assert.equal(plan.safety.providerCallsBlocked, true)
assert.equal(plan.safety.publicOutputBlocked, true)
assert.equal(plan.safety.modelDownloadsBlocked, true)
assert.equal(plan.safety.newModelStagingBlocked, true)
assert.equal(plan.safety.localVerifiedModelPathOnly, true)
assert.equal(plan.safety.modelIdRuntimePathBlocked, true)
assert.equal(plan.safety.phase39DBlocked, true)
assert.equal(plan.safety.phase39EBlocked, true)
assert.equal(plan.safety.betaProductionBlocked, true)
assert.equal(plan.safety.trackABlocked, true)
assert.equal(plan.confirmationsRequiredForCloudBuild.includes('REEDITPRO_CONFIRM_VLM_SGLANG_KERNEL_COMPAT'), true)
assert.equal(plan.confirmationsRequiredForCloudBuild.includes('REEDITPRO_CONFIRM_VLM_SGLANG_CLOUD_BUILD'), true)
assert.equal(plan.confirmationsRequiredForImportSmoke.includes('REEDITPRO_CONFIRM_VLM_SGLANG_IMPORT_SMOKE_JOB'), true)
assert.equal(plan.confirmationsRequiredForGeneratedRuntime.includes('REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ'), true)
assert.equal(plan.confirmationsRequiredForGeneratedRuntime.includes('REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE'), true)

const profileMatrix = buildVlmSglangKernelProfileMatrixReport()
assert.equal(profileMatrix.matrixId, VLM_SGLANG_KERNEL_COMPAT_MATRIX_ID)
assert.deepEqual(profileMatrix.profileOrder, [
  'k0-current-pr104-baseline',
  'k1-latest-compatible-sglang-stable',
  'k2-issue-compatible-pinned-pair',
  'k3-no-sgl-kernel-or-disable-kernel-path',
  'k4-source-build-sgl-kernel',
  'k5-official-sglang-runtime-image-overlay',
])
assert.equal(profileMatrix.generatedRuntimeBlockedUntilImportSmokePasses, true)
assert.equal(profileMatrix.stopAfterFirstImportSmokePass, true)
assert.equal(vlmSglangKernelCompatProfiles.filter((profile) => profile.buildAllowed).length, 3)
assert.equal(vlmSglangKernelCompatProfiles.some((profile) => profile.id === 'k2-issue-compatible-pinned-pair' && profile.sglKernelPackageSpec === 'sgl-kernel==0.2.6.post1'), true)
assert.equal(vlmSglangKernelCompatProfiles.some((profile) => profile.id === 'k3-no-sgl-kernel-or-disable-kernel-path' && profile.buildAllowed), false)
assert.equal(vlmSglangKernelCompatProfiles.some((profile) => profile.id === 'k4-source-build-sgl-kernel' && profile.buildAllowed), false)
assert.equal(vlmSglangKernelCompatProfiles.some((profile) => profile.id === 'k5-official-sglang-runtime-image-overlay' && profile.buildAllowed), false)

const audit = buildVlmSglangKernelImportFailureAudit()
assert.equal(audit.failedSymbol, 'cuGreenCtxDestroy')
assert.equal(audit.failureStage, 'SGLang import path before model payload copy/inference')
assert.equal(audit.publicIssueEvidence.some((issue) => issue.url.includes('/issues/8432')), true)
assert.equal(audit.publicIssueEvidence.some((issue) => issue.url.includes('/issues/8566')), true)
assert.equal(audit.fullRawLogsCommitted, false)

const cost = getVlmSglangKernelCompatCostSummary()
assert.equal(cost.production, 'blocked')
assert.equal(cost.beta, 'blocked')
assert.equal(cost.broadMedia, 'blocked')
assert.equal(cost.stopPolicy, 'run generated fixture runtime only after a profile passes import smoke')

const candidateIds = vlmL4CompatibleCandidates.map((candidate) => candidate.modelId)
const candidateIdStrings = candidateIds as readonly string[]
assert.deepEqual(candidateIds, [
  'Qwen/Qwen3-VL-8B-Instruct-FP8',
  'Qwen/Qwen3-VL-4B-Instruct',
  'Qwen/Qwen3-VL-2B-Instruct',
])
assert.equal(candidateIdStrings.includes('Qwen/Qwen3-VL-8B-Instruct'), false)
assert.equal(candidateIdStrings.every((id) => id.startsWith('Qwen/Qwen3-VL-')), true)
assert.equal(candidateIdStrings.some((id) => /TheBloke|AWQ|GPTQ|community|mlx/i.test(id)), false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:kernel-compat:plan'], 'tsx server/cli/activation-vlm-sglang-runtime-kernel-compat-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:kernel-compat'], 'tsx server/cli/activation-vlm-sglang-runtime-kernel-compat.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:kernel-compat:report'], 'tsx server/cli/activation-vlm-sglang-runtime-kernel-compat-report.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:kernel-compat:import-smoke'], 'tsx server/cli/activation-vlm-sglang-runtime-kernel-compat-import-smoke.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:kernel-compat:cloud-build'], 'tsx server/cli/activation-vlm-sglang-runtime-kernel-compat-cloud-build.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:kernel-compat:cost-summary'], 'tsx server/cli/activation-vlm-sglang-runtime-kernel-compat-cost-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-vlm-sglang-kernel-compat'], 'tsx server/smoke/activation-vlm-sglang-kernel-compat-smoke.ts')

for (const filePath of [
  '../../cloudbuild/vlm-sglang-runtime-phase39c-kernel.yaml',
  '../../cloudbuild/vlm-sglang-runtime-phase39c-kernel.gcloudignore',
  '../../docker/prod/vlm-sglang-runtime/Dockerfile.kernel',
  '../workers/vlm-sglang-runtime/kernel_import_smoke.py',
  '../activation/vlm-sglang-runtime/kernel-compat.ts',
]) {
  assert.equal(existsSync(new URL(filePath, import.meta.url)), true, `${filePath} must exist`)
}

const dockerfile = readFileSync(new URL('../../docker/prod/vlm-sglang-runtime/Dockerfile.kernel', import.meta.url), 'utf8')
assert.equal(/safetensors|model-weights|HF_TOKEN|MODEL_ID/.test(dockerfile), false)
assert.equal(dockerfile.includes('kernel_import_smoke.py'), false)
assert.equal(dockerfile.includes('run-phase39c-sglang-cloud-job.py'), true)
assert.equal(dockerfile.includes('MODEL_DOWNLOADS_ENABLED=false'), true)
assert.equal(dockerfile.includes('PROVIDER_EXECUTION_ENABLED=false'), true)

const smokeWorker = readFileSync(new URL('../workers/vlm-sglang-runtime/kernel_import_smoke.py', import.meta.url), 'utf8')
assert.equal(smokeWorker.includes('import_smoke_must_not_receive_model_gcs_path'), true)
assert.equal(smokeWorker.includes('sglang.srt.layers.rotary_embedding'), true)
assert.equal(smokeWorker.includes('cuGreenCtxDestroy'), true)
assert.equal(smokeWorker.includes('inferenceRan'), true)
assert.equal(smokeWorker.includes('processedImages'), true)
assert.equal(smokeWorker.includes('providerCalls'), true)
assert.equal(/openai\.Client|dashscope|InferenceClient|getSignedUrl|makePublic|allUsers|allAuthenticatedUsers/.test(smokeWorker), false)

const rootDockerignore = readFileSync(new URL('../../.dockerignore', import.meta.url), 'utf8')
for (const pattern of ['**/*.safetensors', '**/model-weights', '**/.env', '**/*secret*', '**/generated-vlm-*']) {
  assert.equal(rootDockerignore.includes(pattern), true, `.dockerignore must exclude ${pattern}`)
}

const cloudBuildIgnore = readFileSync(new URL('../../cloudbuild/vlm-sglang-runtime-phase39c-kernel.gcloudignore', import.meta.url), 'utf8')
for (const pattern of ['*', '!server/workers/vlm-sglang-runtime/**', '**/*.safetensors', '**/node_modules', '**/*credential*']) {
  assert.equal(cloudBuildIgnore.includes(pattern), true, `Cloud Build ignore file must include ${pattern}`)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'kernel_profile_matrix_present',
    'cuGreenCtxDestroy_failure_recorded',
    'cloud_build_kernel_plan_present',
    'import_smoke_job_plan_present',
    'generated_runtime_blocked_until_import_smoke',
    'pr87_candidates_only_no_new_downloads',
    'provider_real_media_public_output_raw_prompt_blocked',
    'phase39d_phase39e_beta_production_track_a_blocked',
  ],
}))
