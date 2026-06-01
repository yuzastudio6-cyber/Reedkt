import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import {
  VLM_SGLANG_RUNTIME_MATRIX_ID,
  getVlmSglangRuntimeCostSummary,
  getVlmSglangRuntimeIamPlan,
  getVlmSglangRuntimePlan,
  vlmSglangRuntimeCanaryFixtures,
  vlmSglangRuntimeCandidateExecutionOrder,
  vlmSglangRuntimeCandidateSelectionPriority,
  vlmSglangRuntimeStages,
} from '../activation/vlm-sglang-runtime'
import {
  VLM_L4_COMPATIBLE_REQUIRED_FIXTURES,
  vlmL4CompatibleCandidates,
} from '../activation/vlm-l4-compatible-candidate'

const plan = getVlmSglangRuntimePlan()
assert.equal(plan.defaultMode, 'non_mutating')
assert.equal(plan.candidatePolicy.newModelDownloadsAllowed, false)
assert.equal(plan.candidatePolicy.modelUploadsAllowed, false)
assert.equal(plan.candidatePolicy.communityQuantizationsAllowed, false)
assert.equal(plan.candidatePolicy.nonQwenCandidatesAllowed, false)
assert.equal(plan.candidatePolicy.modelIdRuntimePathAllowed, false)
assert.deepEqual(plan.candidatePolicy.executionOrder, vlmSglangRuntimeCandidateExecutionOrder)
assert.deepEqual(plan.candidatePolicy.selectionPriority, vlmSglangRuntimeCandidateSelectionPriority)
assert.deepEqual(plan.qaDesign.canaryFixtures, vlmSglangRuntimeCanaryFixtures)
assert.deepEqual(plan.qaDesign.requiredGeneratedFixturesAfterCanaryPass, VLM_L4_COMPATIBLE_REQUIRED_FIXTURES)
assert.equal(plan.qaDesign.thresholds.canaryLabelRecall, 0.8)
assert.equal(plan.qaDesign.thresholds.canaryCoarseRegionAccuracy, 0.8)
assert.equal(plan.qaDesign.thresholds.generatedFixtureLabelRecall, 0.6)
assert.equal(plan.qaDesign.thresholds.generatedFixtureCoarseRegionAccuracy, 0.6)
assert.equal(plan.qaDesign.thresholds.safeZoneDecisionUnknownAllowed, false)
assert.equal(plan.qaDesign.thresholds.ambiguousFixtureMustRequireManualReview, true)
assert.equal(plan.qaDesign.normalizedBoxesRequiredInFirstPass, false)
assert.equal(plan.qaDesign.aliasMatchingEnabled, true)
assert.equal(plan.strategyMatrix.freeformAloneCanPass, false)
assert.equal(plan.strategyMatrix.regexRepairCanPass, false)
assert.equal(plan.strategyMatrix.extractFirstJsonCanPass, false)
assert.equal(plan.execution.runtime, 'sglang')
assert.equal(plan.execution.generatedSyntheticFixturesOnly, true)
assert.equal(plan.execution.localVerifiedModelPathOnly, true)
assert.equal(plan.execution.runtimeAutoDownloadBlocked, true)
assert.equal(plan.execution.hfOfflineRequired, true)
assert.equal(plan.execution.transformersOfflineRequired, true)
assert.equal(plan.execution.providerCallsBlocked, true)
assert.equal(plan.execution.rawPromptsBlocked, true)
assert.equal(plan.execution.realMediaBlocked, true)
assert.equal(plan.execution.arbitraryMediaBlocked, true)
assert.equal(plan.execution.publicOutputBlocked, true)
assert.equal(plan.execution.phase39DBlocked, true)
assert.equal(plan.execution.phase39EBlocked, true)
assert.equal(plan.execution.betaProductionBlocked, true)
assert.equal(plan.execution.trackABlocked, true)
assert.equal(plan.confirmationsRequiredForExecution.includes('REEDITPRO_CONFIRM_VLM_SGLANG_APPROVAL'), true)
assert.equal(plan.confirmationsRequiredForExecution.includes('REEDITPRO_CONFIRM_VLM_SGLANG_RUNTIME_EXECUTE'), true)
assert.equal(plan.confirmationsRequiredForExecution.includes('REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD'), false)
assert.equal(plan.confirmationsRequiredForExecution.includes('REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD'), false)

const candidateIds = vlmL4CompatibleCandidates.map((candidate) => String(candidate.modelId))
assert.deepEqual(candidateIds, [
  'Qwen/Qwen3-VL-8B-Instruct-FP8',
  'Qwen/Qwen3-VL-4B-Instruct',
  'Qwen/Qwen3-VL-2B-Instruct',
])
assert.equal(candidateIds.includes('Qwen/Qwen3-VL-8B-Instruct'), false)
assert.equal(candidateIds.every((id) => id.startsWith('Qwen/Qwen3-VL-')), true)
assert.equal(candidateIds.some((id) => /TheBloke|AWQ|GPTQ|mlx|community/i.test(id)), false)

assert.equal(VLM_SGLANG_RUNTIME_MATRIX_ID, 'phase39c-sglang-generated-vlm-v1')
assert.equal(vlmSglangRuntimeCanaryFixtures.length, 5)
assert.deepEqual(vlmSglangRuntimeStages.map((stage) => stage.id), ['SG0', 'SG1', 'SG2', 'SG3', 'SG4', 'SG5', 'SG6', 'SG7'])
assert.deepEqual(vlmSglangRuntimeStages.filter((stage) => stage.passCounting).map((stage) => stage.id), ['SG3', 'SG4', 'SG5', 'SG6'])
assert.deepEqual(vlmSglangRuntimeStages.filter((stage) => !stage.passCounting).map((stage) => stage.id), ['SG0', 'SG1', 'SG2', 'SG7'])

const iamPlan = getVlmSglangRuntimeIamPlan()
assert.equal(iamPlan.defaultMode, 'non_mutating')
assert.equal(iamPlan.broadIamRejected, true)
assert.equal(iamPlan.publicPrincipalsRejected, true)
assert.equal(iamPlan.plans.some((item) => item.role === 'roles/storage.objectViewer' && item.conditionExpression.includes('qwen3-vl-2b-instruct')), true)
assert.equal(iamPlan.plans.some((item) => item.role === 'roles/storage.objectCreator' && item.conditionExpression.includes('generated-vlm-sglang-runtime')), true)

const cost = getVlmSglangRuntimeCostSummary()
assert.equal(cost.production, 'blocked')
assert.equal(cost.beta, 'blocked')
assert.equal(cost.broadMedia, 'blocked')
assert.equal(cost.runtimePackage, 'sglang==0.4.10.post2')

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:plan'], 'tsx server/cli/activation-vlm-sglang-runtime-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime'], 'tsx server/cli/activation-vlm-sglang-runtime.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:report'], 'tsx server/cli/activation-vlm-sglang-runtime-report.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:iam-plan'], 'tsx server/cli/activation-vlm-sglang-runtime-iam-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:cost-summary'], 'tsx server/cli/activation-vlm-sglang-runtime-cost-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-vlm-sglang-runtime'], 'tsx server/smoke/activation-vlm-sglang-runtime-smoke.ts')

assert.equal(existsSync(new URL('../activation/vlm-sglang-runtime/index.ts', import.meta.url)), true)
assert.equal(existsSync(new URL('../../docker/prod/vlm-sglang-runtime/Dockerfile', import.meta.url)), true)
const moduleDir = new URL('../activation/vlm-sglang-runtime/', import.meta.url)
const moduleSource = readdirSync(moduleDir)
  .filter((fileName) => fileName.endsWith('.ts'))
  .map((fileName) => readFileSync(new URL(fileName, moduleDir), 'utf8'))
  .join('\n')
assert.equal(/from\s+['"].*sam2|from\s+['"].*mask|from\s+['"].*render/i.test(moduleSource), false)
assert.equal(/dashscope\.|openai\.|InferenceClient|provider endpoint/i.test(moduleSource), false)
assert.equal(/REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD:\s*'true'/.test(moduleSource), false)
assert.equal(/storage\s+objects\s+list|storage\s+ls|gsutil\s+ls|list_blobs/i.test(moduleSource), false)
assert.equal(/getSignedUrl|makePublic|allUsers|allAuthenticatedUsers/i.test(moduleSource), false)

const workerDir = new URL('../workers/vlm-sglang-runtime/', import.meta.url)
for (const fileName of [
  'README.md',
  'requirements.sglang.txt',
  'perception_canary_fixtures.py',
  'perception_alias_map.py',
  'perception_decomposed_qa.py',
  'perception_trace_capture.py',
  'run_sglang_generated_fixture.py',
  'run-phase39c-sglang-cloud-job.py',
]) {
  assert.equal(existsSync(new URL(fileName, workerDir)), true)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'pr87_candidates_only',
    'new_model_download_upload_blocked',
    'model_id_runtime_path_blocked',
    'sglang_runtime_auto_download_provider_raw_prompt_real_media_public_output_blocked',
    'sglang_source_license_strategy_matrix_present',
    'canary_and_original_generated_fixture_registries_present',
    'freeform_and_repair_not_pass_counting',
    'decomposed_sg3_sg4_sg5_sg6_qa_present',
    'phase39d_phase39e_beta_production_track_a_blocked',
  ],
}))
