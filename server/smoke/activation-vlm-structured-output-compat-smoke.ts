import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import {
  VLM_STRUCTURED_OUTPUT_COMPAT_MATRIX_ID,
  getVlmStructuredOutputCompatCostSummary,
  getVlmStructuredOutputCompatIamPlan,
  getVlmStructuredOutputCompatPlan,
  vlmStructuredOutputCompatCandidateExecutionOrder,
  vlmStructuredOutputCompatCandidateSelectionPriority,
  vlmStructuredOutputCompatSchemas,
  vlmStructuredOutputCompatStrategies,
} from '../activation/vlm-structured-output-compat'
import {
  VLM_L4_COMPATIBLE_REQUIRED_FIXTURES,
  vlmL4CompatibleCandidates,
} from '../activation/vlm-l4-compatible-candidate'

const plan = getVlmStructuredOutputCompatPlan()
assert.equal(plan.defaultMode, 'non_mutating')
assert.equal(plan.candidatePolicy.newModelDownloadsAllowed, false)
assert.equal(plan.candidatePolicy.modelUploadsAllowed, false)
assert.equal(plan.candidatePolicy.modelIdRuntimePathAllowed, false)
assert.equal(plan.candidatePolicy.communityQuantizationsAllowed, false)
assert.equal(plan.candidatePolicy.nonQwenCandidatesAllowed, false)
assert.deepEqual(plan.candidatePolicy.executionOrder, vlmStructuredOutputCompatCandidateExecutionOrder)
assert.deepEqual(plan.candidatePolicy.selectionPriority, vlmStructuredOutputCompatCandidateSelectionPriority)
assert.deepEqual(plan.escalationPolicy.requiredGeneratedFixtures, VLM_L4_COMPATIBLE_REQUIRED_FIXTURES)
assert.equal(plan.escalationPolicy.textOnlyHarnessFirst, true)
assert.equal(plan.escalationPolicy.imageSmokeRequiresTextOnlyPass, true)
assert.equal(plan.escalationPolicy.fullGeneratedFixtureQaRequiresAllFixtures, true)
assert.equal(plan.escalationPolicy.diagnosticRepairCountsAsPass, false)
assert.equal(plan.execution.generatedFixturesOnly, true)
assert.equal(plan.execution.localVerifiedModelPathOnly, true)
assert.equal(plan.execution.runtimeAutoDownloadBlocked, true)
assert.equal(plan.execution.providerCallsBlocked, true)
assert.equal(plan.execution.externalApiCallsBlocked, true)
assert.equal(plan.execution.localLoopbackOnlyInsideJob, true)
assert.equal(plan.execution.rawPromptsBlocked, true)
assert.equal(plan.execution.realMediaBlocked, true)
assert.equal(plan.execution.arbitraryMediaBlocked, true)
assert.equal(plan.execution.publicOutputBlocked, true)
assert.equal(plan.execution.phase39DBlocked, true)
assert.equal(plan.execution.phase39EBlocked, true)
assert.equal(plan.execution.betaProductionBlocked, true)
assert.equal(plan.execution.trackABlocked, true)
assert.equal(plan.confirmationsRequiredForExecution.includes('REEDITPRO_CONFIRM_VLM_STRUCTURED_OUTPUT_COMPAT_DEBUG'), true)
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

assert.equal(vlmStructuredOutputCompatSchemas.map((schema) => schema.id).join(','), 'T0,T1,T2')
assert.equal(vlmStructuredOutputCompatSchemas.find((schema) => schema.id === 'T2')?.passCounting, true)
assert.equal(vlmStructuredOutputCompatStrategies.some((strategy) => strategy.id === 'O1' && strategy.passCounting), true)
assert.equal(vlmStructuredOutputCompatStrategies.some((strategy) => strategy.id === 'O2' && strategy.passCounting), true)
assert.equal(vlmStructuredOutputCompatStrategies.some((strategy) => strategy.id === 'F1' && strategy.passCounting), true)
assert.equal(vlmStructuredOutputCompatStrategies.some((strategy) => strategy.id === 'D1' && !strategy.passCounting), true)
assert.equal(VLM_STRUCTURED_OUTPUT_COMPAT_MATRIX_ID, 'phase39c-qwen-so2-vllm-api-compat-v1')

const iamPlan = getVlmStructuredOutputCompatIamPlan()
assert.equal(iamPlan.defaultMode, 'non_mutating')
assert.equal(iamPlan.broadIamRejected, true)
assert.equal(iamPlan.publicPrincipalsRejected, true)
assert.equal(iamPlan.modelReadBindings.some((item) => item.role === 'roles/storage.objectViewer' && item.conditionExpression.includes('qwen3-vl-2b-instruct')), true)
assert.equal(iamPlan.qaBindings.some((item) => item.role === 'roles/storage.objectCreator' && item.conditionExpression.includes('generated-vlm-structured-output-compat')), true)

const cost = getVlmStructuredOutputCompatCostSummary()
assert.equal(cost.production, 'blocked')
assert.equal(cost.beta, 'blocked')
assert.equal(cost.broadMedia, 'blocked')

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:vlm-structured-output-compat:plan'], 'tsx server/cli/activation-vlm-structured-output-compat-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-structured-output-compat'], 'tsx server/cli/activation-vlm-structured-output-compat.ts')
assert.equal(packageJson.scripts['activation:vlm-structured-output-compat:report'], 'tsx server/cli/activation-vlm-structured-output-compat-report.ts')
assert.equal(packageJson.scripts['activation:vlm-structured-output-compat:iam-plan'], 'tsx server/cli/activation-vlm-structured-output-compat-iam-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-structured-output-compat:cost-summary'], 'tsx server/cli/activation-vlm-structured-output-compat-cost-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-vlm-structured-output-compat'], 'tsx server/smoke/activation-vlm-structured-output-compat-smoke.ts')

assert.equal(existsSync(new URL('../activation/vlm-structured-output-compat/index.ts', import.meta.url)), true)
const moduleDir = new URL('../activation/vlm-structured-output-compat/', import.meta.url)
const moduleSource = readdirSync(moduleDir)
  .filter((fileName) => fileName.endsWith('.ts'))
  .map((fileName) => readFileSync(new URL(fileName, moduleDir), 'utf8'))
  .join('\n')
assert.equal(/from\s+['"].*sam2|from\s+['"].*mask|from\s+['"].*render|Track A runtime/i.test(moduleSource), false)
assert.equal(/dashscope\.|openai\.|InferenceClient|provider endpoint/i.test(moduleSource), false)
assert.equal(/REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD/.test(moduleSource), true)
assert.equal(/REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD:\s*'true'/.test(moduleSource), false)
assert.equal(/storage\s+objects\s+list|storage\s+ls|gsutil\s+ls|list_blobs/i.test(moduleSource), false)
assert.equal(/getSignedUrl|makePublic|allUsers|allAuthenticatedUsers/i.test(moduleSource), false)

const workerFiles = [
  '../workers/vlm-runtime/run_phase39cq_so2_compat_cloud_job.py',
  '../workers/vlm-runtime/run_structured_output_compat.py',
  '../workers/vlm-runtime/structured_output_compat_capabilities.py',
  '../workers/vlm-runtime/structured_output_compat_harness.py',
]
for (const file of workerFiles) assert.equal(existsSync(new URL(file, import.meta.url)), true)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'pr87_candidates_only',
    'new_model_download_upload_blocked',
    'model_id_runtime_path_blocked',
    'runtime_auto_download_provider_raw_prompt_real_media_public_output_blocked',
    'local_openai_loopback_limited_to_job',
    'text_only_harness_and_openai_loopback_and_offline_structured_outputs_defined',
    'diagnostic_repair_not_pass_counting',
    'phase39d_phase39e_beta_production_track_a_blocked',
  ],
}))
