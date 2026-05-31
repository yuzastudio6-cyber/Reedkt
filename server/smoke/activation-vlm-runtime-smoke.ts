import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import {
  buildVlmGeneratedFixtureManifest,
  buildVlmPromptTemplateManifest,
  buildVlmRuntimeCommandPlan,
  buildVlmRuntimeIamPlan,
  buildVlmRuntimePlan,
  buildVlmRuntimeReadiness,
  getApprovedVlmRuntimeEvidence,
  getPhase39CVlmRuntimeAssets,
  phase39CVlmOutputSchema,
  validateVlmRuntimeExecutionEnv,
  validateVlmRuntimeStaticPlan,
  vlmRuntimeBlockedScopes,
  vlmRuntimeConfig,
} from '../activation/vlm-runtime'
import { getApprovedVlmModelDownloadEvidence } from '../activation/vlm-model-download'

const phase39B = getApprovedVlmModelDownloadEvidence()
assert.equal(phase39B.status, 'verified')
assert.equal(phase39B.modelId, 'Qwen/Qwen3-VL-8B-Instruct')
assert.equal(phase39B.revision, '0c351dd01ed87e9c1b53cbc748cba10e6187ff3b')
assert.equal(phase39B.targetGcsPath, vlmRuntimeConfig.modelGcsPath)
assert.equal(phase39B.fileCount, 15)
assert.equal(phase39B.aggregateSha256, vlmRuntimeConfig.aggregateSha256)

assert.equal(vlmRuntimeConfig.modelId, 'Qwen/Qwen3-VL-8B-Instruct')
assert.equal(vlmRuntimeConfig.modelRevision, '0c351dd01ed87e9c1b53cbc748cba10e6187ff3b')
assert.equal(vlmRuntimeConfig.modelGcsPath.startsWith('gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/'), true)
assert.equal(vlmRuntimeConfig.modelGcsPath.includes('http'), false)
assert.equal(getPhase39CVlmRuntimeAssets().length, 15)

const staticValidation = validateVlmRuntimeStaticPlan()
assert.equal(staticValidation.allowed, true)
assert.equal(validateVlmRuntimeStaticPlan({ modelIdRuntimePath: 'Qwen/Qwen3-VL-8B-Instruct' }).allowed, false)

assert.equal(validateVlmRuntimeExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  modelGcsPath: vlmRuntimeConfig.modelGcsPath,
  aggregateSha256: vlmRuntimeConfig.aggregateSha256,
  generatedFixturesOnly: 'true',
  rawPromptEnabled: 'false',
  providerExecutionEnabled: 'false',
  mediaProcessingEnabled: 'false',
  realMediaInputEnabled: 'false',
  arbitraryMediaInputEnabled: 'false',
  productionReady: 'false',
  internalBetaReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
  publicOutputEnabled: 'false',
  trackAExecutionEnabled: 'false',
}).allowed, false)

assert.equal(validateVlmRuntimeExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  privateGcsReadConfirmation: 'true',
  runtimeExecuteConfirmation: 'true',
  artifactUploadConfirmation: 'true',
  modelGcsPath: vlmRuntimeConfig.modelGcsPath,
  aggregateSha256: vlmRuntimeConfig.aggregateSha256,
  generatedFixturesOnly: 'true',
  rawPromptEnabled: 'false',
  providerExecutionEnabled: 'false',
  mediaProcessingEnabled: 'false',
  realMediaInputEnabled: 'false',
  arbitraryMediaInputEnabled: 'false',
  productionReady: 'false',
  internalBetaReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
  publicOutputEnabled: 'false',
  trackAExecutionEnabled: 'false',
}).allowed, true)

const fixtures = buildVlmGeneratedFixtureManifest('phase39c-test').specs
assert.deepEqual(fixtures.map((fixture) => fixture.fixtureId), [
  'generated-object-layout',
  'generated-ui-safe-zone',
  'generated-ocr-vlm-comparison',
  'generated-ambiguous-scene',
  'generated-spatial-reasoning',
])

const prompts = buildVlmPromptTemplateManifest('phase39c-test').templates
assert.equal(prompts.length, fixtures.length)
assert.equal(prompts.every((prompt) => prompt.rawPromptAllowed === false && prompt.providerCallAllowed === false && prompt.toolCallAllowed === false), true)
assert.ok(Array.isArray(phase39CVlmOutputSchema.required))
assert.ok(phase39CVlmOutputSchema.required.includes('objects'))
assert.ok(phase39CVlmOutputSchema.required.includes('safe_zone_suggestions'))

const commandPlan = buildVlmRuntimeCommandPlan()
assert.equal(commandPlan.some((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ'), true)
assert.equal(commandPlan.some((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE'), true)
assert.equal(commandPlan.some((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD'), true)
assert.equal(commandPlan.some((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD'), true)
assert.equal(commandPlan.some((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_VLM_STAGING_CLOUD_RUN_JOB'), true)
assert.equal(commandPlan.some((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE'), true)
assert.match(commandPlan.map((plan) => plan.commandString).join('\n'), /--cpu=8 --memory=32Gi/)
assert.equal(commandPlan.every((plan) => plan.textOnlyByDefault), true)
assert.doesNotMatch(commandPlan.map((plan) => plan.commandString).join('\n'), /Qwen\/Qwen3-VL-8B-Instruct\s*$|provider|dashscope|openai/i)
assert.equal(buildVlmRuntimeIamPlan().iamMutationAllowed, false)
const iamPlan = buildVlmRuntimeIamPlan()
assert.equal(iamPlan.plans.some((plan) => plan.bindingId === 'phase39c-vlm-model-read' && plan.required), true)
assert.equal(iamPlan.plans.some((plan) => plan.bindingId === 'phase39c-vlm-qa-create' && plan.required), true)
assert.equal(iamPlan.plans.some((plan) => plan.bindingId === 'phase39c-vlm-qa-readback'), false)
assert.match(JSON.stringify(iamPlan), /phase39c-vlm-model-read-qwen3vl-8b/)
assert.match(JSON.stringify(iamPlan), /phase39c-vlm-qa-create/)

assert.ok(vlmRuntimeBlockedScopes.some((scope) => scope.includes('Phase 39D')))
assert.ok(vlmRuntimeBlockedScopes.some((scope) => scope.includes('Track A')))
const evidence = getApprovedVlmRuntimeEvidence()
const readiness = buildVlmRuntimeReadiness(evidence)
assert.notEqual(readiness.vlmToolFamilyBetaStatus, 'external beta still blocked')
assert.notEqual(readiness.vlmToolFamilyBetaStatus, 'internally beta-ready candidate')

const plan = buildVlmRuntimePlan('2026-05-31T00:00:00.000Z', 'phase39c-test')
assert.equal(plan.providerCallsAllowed, false)
assert.equal(plan.rawPromptsAllowed, false)
assert.equal(plan.realMediaAllowed, false)
assert.equal(plan.publicOutputAllowed, false)
assert.equal(plan.productionReadyAllowed, false)
assert.equal(plan.trackAAllowed, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:vlm-runtime:plan'], 'tsx server/cli/activation-vlm-runtime-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-runtime'], 'tsx server/cli/activation-vlm-runtime.ts')
assert.equal(packageJson.scripts['activation:vlm-runtime:report'], 'tsx server/cli/activation-vlm-runtime-report.ts')
assert.equal(packageJson.scripts['activation:vlm-runtime:iam-plan'], 'tsx server/cli/activation-vlm-runtime-iam-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-runtime:cost-summary'], 'tsx server/cli/activation-vlm-runtime-cost-summary.ts')
assert.equal(packageJson.scripts['activation:vlm-runtime:cloud-run-job'], 'REEDITPRO_VLM_RUNTIME_MODE=staging_cloud_run_job tsx server/cli/activation-vlm-runtime.ts')
assert.equal(packageJson.scripts['build:staging-vlm-runtime-worker'], 'tsx server/cli/build-staging-vlm-runtime-worker.ts')
assert.equal(packageJson.scripts['smoke:activation-vlm-runtime'], 'tsx server/smoke/activation-vlm-runtime-smoke.ts')
assert.equal(vlmRuntimeConfig.requiredVllmVersion, '0.11.0')
assert.equal(existsSync(new URL('../../docker/prod/vlm-runtime/Dockerfile', import.meta.url)), true)

assert.equal(existsSync(new URL('../activation/vlm-runtime/index.ts', import.meta.url)), true)
const moduleDir = new URL('../activation/vlm-runtime/', import.meta.url)
const moduleSource = readdirSync(moduleDir)
  .filter((fileName) => fileName.endsWith('.ts'))
  .map((fileName) => readFileSync(new URL(fileName, moduleDir), 'utf8'))
  .join('\n')
assert.equal(/from\s+['"].*masks|from\s+['"].*render|from\s+['"].*sam2|Track A runtime/i.test(moduleSource), false)
assert.equal(/fetch\(|axios|dashscope\.|openai\.|InferenceClient/.test(moduleSource), false)
assert.equal(/storage\s+objects\s+list|storage\s+ls|list_blobs|gsutil\s+ls/.test(moduleSource), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase39a_phase39b_evidence_reference',
    'exact_qwen3_vl_revision_private_prefix',
    'confirmation_gates',
    'local_model_path_only',
    'no_auto_download_provider_raw_prompt_media_public_output',
    'generated_fixture_and_prompt_registry',
    'qa_gate_schema',
    'phase39d_phase39e_beta_production_track_a_blocked',
  ],
}))
