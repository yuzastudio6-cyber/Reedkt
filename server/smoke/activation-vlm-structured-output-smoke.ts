import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import {
  VLM_STRUCTURED_OUTPUT_MATRIX_ID,
  getVlmStructuredOutputCostSummary,
  getVlmStructuredOutputIamPlan,
  getVlmStructuredOutputPlan,
  vlmStructuredOutputCandidateExecutionOrder,
  vlmStructuredOutputCandidateSelectionPriority,
  vlmStructuredOutputStrategies,
} from '../activation/vlm-structured-output'
import {
  VLM_L4_COMPATIBLE_REQUIRED_FIXTURES,
  vlmL4CompatibleCandidates,
} from '../activation/vlm-l4-compatible-candidate'

const plan = getVlmStructuredOutputPlan()
assert.equal(plan.defaultMode, 'non_mutating')
assert.equal(plan.candidatePolicy.newModelDownloadsAllowed, false)
assert.equal(plan.candidatePolicy.modelUploadsAllowed, false)
assert.equal(plan.candidatePolicy.communityQuantizationsAllowed, false)
assert.deepEqual(plan.candidatePolicy.executionOrder, vlmStructuredOutputCandidateExecutionOrder)
assert.deepEqual(plan.candidatePolicy.selectionPriority, vlmStructuredOutputCandidateSelectionPriority)
assert.deepEqual(plan.execution.requiredFixtures, VLM_L4_COMPATIBLE_REQUIRED_FIXTURES)
assert.equal(plan.execution.generatedFixturesOnly, true)
assert.equal(plan.execution.localVerifiedModelPathOnly, true)
assert.equal(plan.execution.runtimeAutoDownloadBlocked, true)
assert.equal(plan.execution.providerCallsBlocked, true)
assert.equal(plan.execution.rawPromptsBlocked, true)
assert.equal(plan.execution.realMediaBlocked, true)
assert.equal(plan.execution.arbitraryMediaBlocked, true)
assert.equal(plan.execution.publicOutputBlocked, true)
assert.equal(plan.execution.phase39DBlocked, true)
assert.equal(plan.execution.phase39EBlocked, true)
assert.equal(plan.execution.betaProductionBlocked, true)
assert.equal(plan.execution.trackABlocked, true)
assert.equal(plan.confirmationsRequiredForExecution.includes('REEDITPRO_CONFIRM_VLM_STRUCTURED_OUTPUT_RERUN'), true)
assert.equal(plan.confirmationsRequiredForExecution.includes('REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD'), false)
assert.equal(plan.confirmationsRequiredForExecution.includes('REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD'), false)
assert.equal(plan.compactSchema.title, 'phase39c_qwen_vlm_v1')
assert.equal(plan.compactSchema.additionalProperties, false)

const candidateIds = vlmL4CompatibleCandidates.map((candidate) => String(candidate.modelId))
assert.deepEqual(candidateIds, [
  'Qwen/Qwen3-VL-8B-Instruct-FP8',
  'Qwen/Qwen3-VL-4B-Instruct',
  'Qwen/Qwen3-VL-2B-Instruct',
])
assert.equal(candidateIds.includes('Qwen/Qwen3-VL-8B-Instruct'), false)
assert.equal(candidateIds.every((id) => id.startsWith('Qwen/Qwen3-VL-')), true)
assert.equal(candidateIds.some((id) => /TheBloke|AWQ|GPTQ|mlx|community/i.test(id)), false)

assert.equal(vlmStructuredOutputStrategies.length, 7)
const s6 = vlmStructuredOutputStrategies.find((strategy) => strategy.id === 'S6')
assert.equal(s6?.passCounting, false)
assert.equal(vlmStructuredOutputStrategies.filter((strategy) => strategy.passCounting).map((strategy) => strategy.id).join(','), 'S1,S2,S3,S4,S5')
assert.equal(VLM_STRUCTURED_OUTPUT_MATRIX_ID, 'phase39c-qwen-structured-output-v1')

const iamPlan = getVlmStructuredOutputIamPlan()
assert.equal(iamPlan.defaultMode, 'non_mutating')
assert.equal(iamPlan.broadIamRejected, true)
assert.equal(iamPlan.publicPrincipalsRejected, true)
assert.equal(iamPlan.plans.some((item) => item.role === 'roles/storage.objectViewer' && item.conditionExpression.includes('qwen3-vl-2b-instruct')), true)
assert.equal(iamPlan.plans.some((item) => item.role === 'roles/storage.objectCreator' && item.conditionExpression.includes('generated-vlm-structured-output')), true)

const cost = getVlmStructuredOutputCostSummary()
assert.equal(cost.production, 'blocked')
assert.equal(cost.beta, 'blocked')
assert.equal(cost.broadMedia, 'blocked')

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:vlm-structured-output:plan'], 'tsx server/cli/activation-vlm-structured-output-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-structured-output'], 'tsx server/cli/activation-vlm-structured-output.ts')
assert.equal(packageJson.scripts['activation:vlm-structured-output:report'], 'tsx server/cli/activation-vlm-structured-output-report.ts')
assert.equal(packageJson.scripts['activation:vlm-structured-output:iam-plan'], 'tsx server/cli/activation-vlm-structured-output-iam-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-structured-output:cost-summary'], 'tsx server/cli/activation-vlm-structured-output-cost-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-vlm-structured-output'], 'tsx server/smoke/activation-vlm-structured-output-smoke.ts')

assert.equal(existsSync(new URL('../activation/vlm-structured-output/index.ts', import.meta.url)), true)
const moduleDir = new URL('../activation/vlm-structured-output/', import.meta.url)
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

console.log(JSON.stringify({
  ok: true,
  checks: [
    'pr87_candidates_only',
    'new_model_download_upload_blocked',
    'local_model_path_only_runtime_handoff',
    'runtime_auto_download_provider_raw_prompt_real_media_public_output_blocked',
    'structured_output_strategy_matrix_and_schema_present',
    's6_diagnostic_not_pass_counting',
    'phase39d_phase39e_beta_production_track_a_blocked',
  ],
}))
