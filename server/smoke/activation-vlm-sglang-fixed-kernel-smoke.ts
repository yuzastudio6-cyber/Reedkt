import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  VLM_SGLANG_FIXED_KERNEL_MATRIX_ID,
  buildVlmSglangFixedKernelImportFailureAudit,
  buildVlmSglangFixedKernelProfileMatrixReport,
  getVlmSglangFixedKernelCostSummary,
  getVlmSglangFixedKernelIamPlan,
  getVlmSglangFixedKernelPlan,
  getVlmSglangFixedKernelWebResearchReport,
  vlmSglangFixedKernelProfiles,
} from '../activation/vlm-sglang-runtime'
import { vlmL4CompatibleCandidates } from '../activation/vlm-l4-compatible-candidate'

const plan = getVlmSglangFixedKernelPlan()
assert.equal(plan.phase, '39C-SG-FIXED')
assert.equal(plan.defaultMode, 'non_mutating')
assert.equal(plan.matrixId, 'phase39c-sglang-fixed-kernel-l4-v1')
assert.equal(VLM_SGLANG_FIXED_KERNEL_MATRIX_ID, 'phase39c-sglang-fixed-kernel-l4-v1')
assert.equal(plan.cloudBuild.configPath, 'cloudbuild/vlm-sglang-fixed-kernel-phase39c.yaml')
assert.equal(plan.cloudBuild.dockerfile, 'docker/prod/vlm-sglang-runtime/Dockerfile.fixed-kernel')
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
assert.equal(plan.confirmationsRequiredForCloudBuild.includes('REEDITPRO_CONFIRM_VLM_SGLANG_FIXED_KERNEL'), true)
assert.equal(plan.confirmationsRequiredForCloudBuild.includes('REEDITPRO_CONFIRM_VLM_SGLANG_CLOUD_BUILD'), true)
assert.equal(plan.confirmationsRequiredForImportSmoke.includes('REEDITPRO_CONFIRM_VLM_SGLANG_IMPORT_SMOKE_JOB'), true)
assert.equal(plan.confirmationsRequiredForGeneratedRuntime.includes('REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ'), true)
assert.equal(plan.confirmationsRequiredForGeneratedRuntime.includes('REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE'), true)

const profileMatrix = buildVlmSglangFixedKernelProfileMatrixReport()
assert.equal(profileMatrix.matrixId, VLM_SGLANG_FIXED_KERNEL_MATRIX_ID)
assert.deepEqual(profileMatrix.profileOrder, [
  'f0-pr107-baseline',
  'f1-minimal-fixed-sgl-kernel',
  'f2-current-stable-sglang',
  'f3-latest-kernel-overlay',
  'f4-forward-compat-base',
  'f5-official-sglang-image-overlay',
  'f6-source-build-after-9021-9231',
])
assert.equal(profileMatrix.generatedRuntimeBlockedUntilImportSmokePasses, true)
assert.equal(profileMatrix.stopAfterFirstImportSmokePass, true)
assert.equal(vlmSglangFixedKernelProfiles.filter((profile) => profile.buildAllowed).length, 3)
assert.equal(vlmSglangFixedKernelProfiles.some((profile) => profile.id === 'f1-minimal-fixed-sgl-kernel' && profile.sglKernelPackageSpec === 'sgl-kernel==0.3.6.post1'), true)
assert.equal(vlmSglangFixedKernelProfiles.some((profile) => profile.id === 'f2-current-stable-sglang' && profile.sglangPackageSpec === 'sglang[all]==0.5.12.post1'), true)
assert.equal(vlmSglangFixedKernelProfiles.some((profile) => profile.id === 'f3-latest-kernel-overlay' && profile.sglangKernelPackageSpec === 'sglang-kernel==0.4.3'), true)
assert.equal(vlmSglangFixedKernelProfiles.some((profile) => profile.id === 'f4-forward-compat-base' && profile.buildAllowed), false)
assert.equal(vlmSglangFixedKernelProfiles.some((profile) => profile.id === 'f6-source-build-after-9021-9231' && profile.buildAllowed), false)

const research = getVlmSglangFixedKernelWebResearchReport()
assert.equal(research.status, 'passed')
assert.equal(research.sources.some((source) => source.url.includes('/issues/8432')), true)
assert.equal(research.sources.some((source) => source.url.includes('/issues/8566')), true)
assert.equal(research.sources.some((source) => source.url.includes('/pull/9021')), true)
assert.equal(research.sources.some((source) => source.url.includes('/pull/9231')), true)
assert.equal(research.packageAvailability.sglangCurrentStable, '0.5.12.post1')
assert.equal(research.packageAvailability.sglKernelIssueLinkedFixed, '0.3.6.post1')
assert.equal(research.packageAvailability.sglangKernelCurrent, '0.4.3')

const iam = getVlmSglangFixedKernelIamPlan()
assert.equal(iam.broadIamRejected, true)
assert.equal(iam.publicPrincipalsRejected, true)
assert.equal(iam.requiredBindings[0].role, 'roles/storage.objectCreator')
assert.equal(iam.requiredBindings[0].conditionTitle, 'phase39c-vlm-sglang-fixed-qa-create')
assert.equal(iam.requiredBindings[0].conditionExpression.includes('generated-vlm-sglang-fixed-kernel'), true)

const audit = buildVlmSglangFixedKernelImportFailureAudit()
assert.equal(audit.failedSymbol, 'cuGreenCtxDestroy')
assert.equal(audit.failureStage, 'SGLang import path before model payload copy/inference')
assert.equal(audit.publicIssueEvidence.some((issue) => issue.url.includes('/issues/8432')), true)
assert.equal(audit.publicIssueEvidence.some((issue) => issue.url.includes('/issues/8566')), true)
assert.equal(audit.fullRawLogsCommitted, false)

const cost = getVlmSglangFixedKernelCostSummary()
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
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:fixed-kernel:plan'], 'tsx server/cli/activation-vlm-sglang-runtime-fixed-kernel-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:fixed-kernel'], 'tsx server/cli/activation-vlm-sglang-runtime-fixed-kernel.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:fixed-kernel:report'], 'tsx server/cli/activation-vlm-sglang-runtime-fixed-kernel-report.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:fixed-kernel:web-research'], 'tsx server/cli/activation-vlm-sglang-runtime-fixed-kernel-web-research.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:fixed-kernel:cloud-build'], 'tsx server/cli/activation-vlm-sglang-runtime-fixed-kernel-cloud-build.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:fixed-kernel:import-smoke'], 'tsx server/cli/activation-vlm-sglang-runtime-fixed-kernel-import-smoke.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:fixed-kernel:cost-summary'], 'tsx server/cli/activation-vlm-sglang-runtime-fixed-kernel-cost-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-vlm-sglang-fixed-kernel'], 'tsx server/smoke/activation-vlm-sglang-fixed-kernel-smoke.ts')

for (const filePath of [
  '../../cloudbuild/vlm-sglang-fixed-kernel-phase39c.yaml',
  '../../cloudbuild/vlm-sglang-fixed-kernel-phase39c.gcloudignore',
  '../../docker/prod/vlm-sglang-runtime/Dockerfile.fixed-kernel',
  '../workers/vlm-sglang-runtime/kernel_import_smoke.py',
  '../activation/vlm-sglang-runtime/fixed-kernel.ts',
]) {
  assert.equal(existsSync(new URL(filePath, import.meta.url)), true, `${filePath} must exist`)
}

const dockerfile = readFileSync(new URL('../../docker/prod/vlm-sglang-runtime/Dockerfile.fixed-kernel', import.meta.url), 'utf8')
assert.equal(/safetensors|model-weights|HF_TOKEN|MODEL_ID/.test(dockerfile), false)
assert.equal(dockerfile.includes('SGLANG_KERNEL_PACKAGE_SPEC'), true)
assert.equal(dockerfile.includes('MODEL_DOWNLOADS_ENABLED=false'), true)
assert.equal(dockerfile.includes('PROVIDER_EXECUTION_ENABLED=false'), true)

const smokeWorker = readFileSync(new URL('../workers/vlm-sglang-runtime/kernel_import_smoke.py', import.meta.url), 'utf8')
assert.equal(smokeWorker.includes('import_smoke_must_not_receive_model_gcs_path'), true)
assert.equal(smokeWorker.includes('sglang.srt.layers.rotary_embedding'), true)
assert.equal(smokeWorker.includes('cuGreenCtxDestroy'), true)
assert.equal(smokeWorker.includes('cuGreenCtxStreamCreate'), true)
assert.equal(smokeWorker.includes('sglang-kernel'), true)
assert.equal(smokeWorker.includes('LD_LIBRARY_PATH'), true)
assert.equal(smokeWorker.includes('inferenceRan'), true)
assert.equal(smokeWorker.includes('processedImages'), true)
assert.equal(smokeWorker.includes('providerCalls'), true)
assert.equal(/openai\.Client|dashscope|InferenceClient|getSignedUrl|makePublic|allUsers|allAuthenticatedUsers/.test(smokeWorker), false)

const cloudBuildIgnore = readFileSync(new URL('../../cloudbuild/vlm-sglang-fixed-kernel-phase39c.gcloudignore', import.meta.url), 'utf8')
for (const pattern of ['*', '!server/workers/vlm-sglang-runtime/**', '!docker/prod/vlm-sglang-runtime/Dockerfile.fixed-kernel', '**/*.safetensors', '**/node_modules', '**/*credential*']) {
  assert.equal(cloudBuildIgnore.includes(pattern), true, `Cloud Build ignore file must include ${pattern}`)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'fixed_kernel_profile_matrix_present',
    'upstream_9021_9231_research_recorded',
    'cuGreenCtxDestroy_failure_recorded',
    'cloud_run_l4_cuda_evidence_recorded',
    'cloud_build_fixed_kernel_plan_present',
    'import_smoke_job_plan_present',
    'generated_runtime_blocked_until_import_smoke',
    'pr87_candidates_only_no_new_downloads',
    'provider_real_media_public_output_raw_prompt_blocked',
    'phase39d_phase39e_beta_production_track_a_blocked',
  ],
}))
