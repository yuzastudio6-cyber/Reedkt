import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import {
  VLM_PERCEPTION_CANARY_MATRIX_ID,
  getVlmPerceptionCanaryCostSummary,
  getVlmPerceptionCanaryIamPlan,
  getVlmPerceptionCanaryPlan,
  vlmPerceptionCanaryCandidateExecutionOrder,
  vlmPerceptionCanaryCandidateSelectionPriority,
  vlmPerceptionCanaryFixtures,
  vlmPerceptionCanaryStages,
} from '../activation/vlm-perception-canary'
import {
  VLM_L4_COMPATIBLE_REQUIRED_FIXTURES,
  vlmL4CompatibleCandidates,
} from '../activation/vlm-l4-compatible-candidate'

const plan = getVlmPerceptionCanaryPlan()
assert.equal(plan.defaultMode, 'non_mutating')
assert.equal(plan.candidatePolicy.newModelDownloadsAllowed, false)
assert.equal(plan.candidatePolicy.modelUploadsAllowed, false)
assert.equal(plan.candidatePolicy.communityQuantizationsAllowed, false)
assert.equal(plan.candidatePolicy.modelIdRuntimePathAllowed, false)
assert.deepEqual(plan.candidatePolicy.executionOrder, vlmPerceptionCanaryCandidateExecutionOrder)
assert.deepEqual(plan.candidatePolicy.selectionPriority, vlmPerceptionCanaryCandidateSelectionPriority)
assert.deepEqual(plan.qaDesign.canaryFixtures, vlmPerceptionCanaryFixtures)
assert.deepEqual(plan.qaDesign.requiredGeneratedFixturesAfterCanaryPass, VLM_L4_COMPATIBLE_REQUIRED_FIXTURES)
assert.equal(plan.qaDesign.thresholds.canaryLabelRecall, 0.8)
assert.equal(plan.qaDesign.thresholds.canaryCoarseRegionAccuracy, 0.8)
assert.equal(plan.qaDesign.thresholds.generatedFixtureLabelRecall, 0.6)
assert.equal(plan.qaDesign.thresholds.generatedFixtureCoarseRegionAccuracy, 0.6)
assert.equal(plan.qaDesign.thresholds.safeZoneDecisionUnknownAllowed, false)
assert.equal(plan.qaDesign.thresholds.ambiguousFixtureMustRequireManualReview, true)
assert.equal(plan.qaDesign.diagnosticTraceCanPassPhase, false)
assert.equal(plan.qaDesign.normalizedBoxesRequiredInFirstPass, false)
assert.equal(plan.qaDesign.aliasMatchingEnabled, true)
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
assert.equal(plan.confirmationsRequiredForExecution.includes('REEDITPRO_CONFIRM_VLM_PERCEPTION_CANARY_RERUN'), true)
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

assert.equal(VLM_PERCEPTION_CANARY_MATRIX_ID, 'phase39c-qwen-so3-perception-canary-v1')
assert.equal(vlmPerceptionCanaryFixtures.length, 5)
for (const fixtureId of [
  'canary-basic-shapes',
  'canary-colored-layout',
  'canary-text-and-shape',
  'canary-ui-simplified',
  'canary-caption-safe-zone-simple',
]) {
  assert.equal(vlmPerceptionCanaryFixtures.includes(fixtureId as typeof vlmPerceptionCanaryFixtures[number]), true)
}
assert.equal(vlmPerceptionCanaryStages.length, 6)
const p1 = vlmPerceptionCanaryStages.find((stage) => stage.id === 'P1')
assert.equal(p1?.passCounting, false)
assert.deepEqual(vlmPerceptionCanaryStages.filter((stage) => stage.passCounting).map((stage) => stage.id), ['P0', 'P2', 'P3', 'P4', 'P5'])

const iamPlan = getVlmPerceptionCanaryIamPlan()
assert.equal(iamPlan.defaultMode, 'non_mutating')
assert.equal(iamPlan.broadIamRejected, true)
assert.equal(iamPlan.publicPrincipalsRejected, true)
assert.equal(iamPlan.plans.some((item) => item.role === 'roles/storage.objectViewer' && item.conditionExpression.includes('qwen3-vl-2b-instruct')), true)
assert.equal(iamPlan.plans.some((item) => item.role === 'roles/storage.objectCreator' && item.conditionExpression.includes('generated-vlm-perception-canary')), true)

const cost = getVlmPerceptionCanaryCostSummary()
assert.equal(cost.production, 'blocked')
assert.equal(cost.beta, 'blocked')
assert.equal(cost.broadMedia, 'blocked')

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:vlm-perception-canary:plan'], 'tsx server/cli/activation-vlm-perception-canary-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-perception-canary'], 'tsx server/cli/activation-vlm-perception-canary.ts')
assert.equal(packageJson.scripts['activation:vlm-perception-canary:report'], 'tsx server/cli/activation-vlm-perception-canary-report.ts')
assert.equal(packageJson.scripts['activation:vlm-perception-canary:iam-plan'], 'tsx server/cli/activation-vlm-perception-canary-iam-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-perception-canary:cost-summary'], 'tsx server/cli/activation-vlm-perception-canary-cost-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-vlm-perception-canary'], 'tsx server/smoke/activation-vlm-perception-canary-smoke.ts')

assert.equal(existsSync(new URL('../activation/vlm-perception-canary/index.ts', import.meta.url)), true)
const moduleDir = new URL('../activation/vlm-perception-canary/', import.meta.url)
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

const workerDir = new URL('../workers/vlm-runtime/', import.meta.url)
for (const fileName of [
  'perception_canary_fixtures.py',
  'perception_alias_map.py',
  'perception_decomposed_qa.py',
  'perception_trace_capture.py',
  'run_perception_canary.py',
  'run_phase39cq_so3_perception_canary_cloud_job.py',
]) {
  assert.equal(existsSync(new URL(fileName, workerDir)), true)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'pr87_candidates_only',
    'new_model_download_upload_blocked',
    'model_id_runtime_path_blocked',
    'runtime_auto_download_provider_raw_prompt_real_media_public_output_blocked',
    'perception_canaries_and_required_generated_fixtures_present',
    'diagnostic_traces_not_pass_counting',
    'decomposed_qa_thresholds_present',
    'phase39d_phase39e_beta_production_track_a_blocked',
  ],
}))
