import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import {
  VLM_L4_COMPATIBLE_REQUIRED_FIXTURES,
  buildVlmL4CompatibleCandidateStaticReport,
  getVlmL4CompatibleCandidateCostSummary,
  getVlmL4CompatibleCandidateIamPlan,
  getVlmL4CompatibleCandidatePlan,
  vlmL4CompatibleCandidates,
} from '../activation/vlm-l4-compatible-candidate'

const candidateIds = vlmL4CompatibleCandidates.map((candidate) => String(candidate.modelId))
assert.deepEqual(candidateIds, [
  'Qwen/Qwen3-VL-8B-Instruct-FP8',
  'Qwen/Qwen3-VL-4B-Instruct',
  'Qwen/Qwen3-VL-2B-Instruct',
])
assert.equal(candidateIds.includes('Qwen/Qwen3-VL-8B-Instruct'), false)
assert.equal(candidateIds.every((id) => id.startsWith('Qwen/Qwen3-VL-')), true)
assert.equal(candidateIds.some((id) => /TheBloke|AWQ|GPTQ|mlx|community/i.test(id)), false)
assert.equal(vlmL4CompatibleCandidates.every((candidate) => /^[0-9a-f]{40}$/.test(candidate.revision)), true)
assert.equal(vlmL4CompatibleCandidates.every((candidate) => candidate.licenseEvidence === 'Apache-2.0'), true)
assert.equal(vlmL4CompatibleCandidates.every((candidate) => candidate.selectedFiles.some((file) => file.relativePath.endsWith('.safetensors'))), true)

const plan = getVlmL4CompatibleCandidatePlan()
assert.equal(plan.defaultMode, 'non_mutating')
assert.equal(plan.execution.generatedFixturesOnly, true)
assert.equal(plan.execution.localVerifiedModelPathOnly, true)
assert.equal(plan.execution.runtimeAutoDownloadBlocked, true)
assert.equal(plan.execution.providerCallsBlocked, true)
assert.equal(plan.execution.rawPromptsBlocked, true)
assert.equal(plan.execution.realMediaBlocked, true)
assert.equal(plan.execution.publicOutputBlocked, true)
assert.equal(plan.execution.phase39DBlocked, true)
assert.equal(plan.execution.phase39EBlocked, true)
assert.equal(plan.execution.betaProductionBlocked, true)
assert.deepEqual(plan.execution.requiredFixtures, VLM_L4_COMPATIBLE_REQUIRED_FIXTURES)
assert.ok(plan.confirmationsRequiredForMutation.includes('REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD'))
assert.ok(plan.confirmationsRequiredForMutation.includes('REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD'))
assert.ok(plan.confirmationsRequiredForMutation.includes('REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE'))
assert.ok(plan.confirmationsRequiredForMutation.includes('REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE'))

const iamPlan = getVlmL4CompatibleCandidateIamPlan()
assert.equal(iamPlan.defaultMode, 'non_mutating')
assert.equal(iamPlan.broadIamRejected, true)
assert.equal(iamPlan.publicPrincipalsRejected, true)
assert.equal(iamPlan.plans.some((item) => item.role === 'roles/storage.objectViewer' && item.conditionExpression.includes('model-weights/qwen3-vl/qwen3-vl-8b-instruct-fp8/')), true)
assert.equal(iamPlan.plans.some((item) => item.role === 'roles/storage.objectCreator' && item.conditionExpression.includes('activation/phase39c/generated-vlm-runtime-l4-compatible/')), true)

const cost = getVlmL4CompatibleCandidateCostSummary()
assert.equal(cost.production, 'blocked')
assert.equal(cost.beta, 'blocked')
assert.equal(cost.broadMedia, 'blocked')

const report = buildVlmL4CompatibleCandidateStaticReport()
assert.equal(report.ok, false)
assert.equal(report.status, 'blocked')
assert.ok(report.blockers.includes('execution_not_run'))
assert.equal(report.vlmToolFamilyBetaStatus, 'blocked')
assert.ok(report.blockedScopes.includes('Phase 39D controlled real-frame VLM'))
assert.ok(report.blockedScopes.includes('Track A'))

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:vlm-l4-compatible-candidate:plan'], 'tsx server/cli/activation-vlm-l4-compatible-candidate-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-l4-compatible-candidate'], 'tsx server/cli/activation-vlm-l4-compatible-candidate.ts')
assert.equal(packageJson.scripts['activation:vlm-l4-compatible-candidate:report'], 'tsx server/cli/activation-vlm-l4-compatible-candidate-report.ts')
assert.equal(packageJson.scripts['activation:vlm-l4-compatible-candidate:iam-plan'], 'tsx server/cli/activation-vlm-l4-compatible-candidate-iam-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-l4-compatible-candidate:cost-summary'], 'tsx server/cli/activation-vlm-l4-compatible-candidate-cost-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-vlm-l4-compatible-candidate'], 'tsx server/smoke/activation-vlm-l4-compatible-candidate-smoke.ts')

assert.equal(existsSync(new URL('../activation/vlm-l4-compatible-candidate/index.ts', import.meta.url)), true)
const moduleDir = new URL('../activation/vlm-l4-compatible-candidate/', import.meta.url)
const moduleSource = readdirSync(moduleDir)
  .filter((fileName) => fileName.endsWith('.ts'))
  .map((fileName) => readFileSync(new URL(fileName, moduleDir), 'utf8'))
  .join('\n')
assert.equal(/from\s+['"].*sam2|from\s+['"].*mask|from\s+['"].*render|Track A runtime/i.test(moduleSource), false)
assert.equal(/dashscope\.|openai\.|InferenceClient|provider endpoint/i.test(moduleSource), false)
assert.equal(/storage\s+objects\s+list|storage\s+ls|gsutil\s+ls|list_blobs/i.test(moduleSource), false)
assert.equal(/getSignedUrl|makePublic|allUsers|allAuthenticatedUsers/i.test(moduleSource), false)
assert.match(moduleSource, /REEDITPRO_VLM_MODEL_ID/)
assert.match(moduleSource, /REEDITPRO_VLM_EXPECTED_ASSETS_JSON/)
assert.match(moduleSource, /HF_HUB_OFFLINE/)
assert.match(moduleSource, /TRANSFORMERS_OFFLINE/)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'official_qwen_candidate_registry_only',
    'community_quantizations_blocked',
    'unquantized_8b_bf16_not_retried',
    'pinned_revision_required',
    'download_upload_runtime_confirmation_gates',
    'local_model_path_only_runtime_handoff',
    'runtime_auto_download_provider_raw_prompt_real_media_public_output_blocked',
    'generated_fixture_registry_required',
    'phase39d_phase39e_beta_production_track_a_blocked',
  ],
}))
