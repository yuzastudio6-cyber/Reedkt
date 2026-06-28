import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  assertToolAllowedForWorker,
  assertToolModelWeightsAllowed,
  getProductionToolProfile,
} from '../tool-registry'
import { QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-reverify-result'
import { QWEN25_PRIVATE_INVOKE_AUTHZ_FIX_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-authz-fix-result'
import { QWEN25_PRIVATE_INVOKE_ROUTING_FIX_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-routing-fix-result'
import { QWEN25_PRIVATE_INVOKE_TOKEN_PATH_FIX_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-token-path-fix-result'
import { QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_DEPLOY_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-deploy-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_SOURCE } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-source'
import { QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-private-invoke-runtime-readiness-review'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-plan'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_SOURCE } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-source'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_DEPLOY_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-deploy-result'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_EXECUTE_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-execute-result'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-fix-result'
import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-result-review'
import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-fix'
import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_SMOKE_RETRY_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-smoke-retry-result'
import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-result-review'
import { QWEN2_5_VL_PRIVATE_RUNTIME_READINESS_REVIEW_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-private-runtime-readiness-review-result'
import { QWEN2_5_VL_APPROVED_WORKER_INTEGRATION_READINESS_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-approved-worker-integration-readiness-review'
import { QWEN2_5_VL_BACKEND_RUNTIME_DISPATCH_IMPLEMENTATION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-dispatch-implementation-plan'
import { QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR } from '../../src/backend/mock/mock-qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator'
import { QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-plan'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_MIGRATION_DRAFT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-migration-draft'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_VALIDATION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-validation-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-plan'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_CREATE } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-create'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_VERIFY } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_FRONTEND_CLIENT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-frontend-client'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_ROUTE } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run-route'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_READINESS_ROLLUP } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup'
import { getQwen25VlPrivateInvokeFrontendClientStatus } from '../../src/backend/api/qwen2-5-vl-private-invoke-frontend-client'
import { getQwenVlPlannerRoutingUiData } from '../../src/lib/qwen-vl-planner-routing-ui'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_cloud_run_gpu_private_invoke_readiness_rollup_persistence_local_harness_validation_blocked_port_fix_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58U-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-PORT-FIX: adjust Qwen local Supabase harness ports and retry validation, no deploy/no cloud/no assets/no beta'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe runtime true claim', /\b(privateInvokeReady|betaReady|productionReady|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['bearer token value', /\bBearer\s+[A-Za-z0-9._~+/-]+/i],
  ['credential-looking value', /\b(sk-[A-Za-z0-9]{12,}|hf_[A-Za-z0-9]{12,}|ya29\.[A-Za-z0-9._-]+)/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
]

function assertNoForbiddenText(relativePath: string) {
  const text = read(relativePath)
  const findings = forbiddenTextPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name)
  assert.deepEqual(findings, [], `Forbidden value in ${relativePath}: ${findings.join('; ')}`)
}

function scanValues(value: unknown, pathParts: string[] = []): string[] {
  if (typeof value === 'string') {
    return forbiddenValuePatterns
      .filter(([, pattern]) => pattern.test(value))
      .map(([name]) => `${pathParts.join('.')}: ${name}`)
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => scanValues(item, [...pathParts, String(index)]))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as JsonRecord)
      .flatMap(([key, nested]) => scanValues(nested, [...pathParts, key]))
  }
  return []
}

function assertRollupFalseFlags(flags: JsonRecord) {
  for (const key of [
    'privateInvokeReady',
    'defaultSubnetPrivateGoogleAccess',
    'privateGoogleAccessChanged',
    'betaReady',
    'productionReady',
    'vllmEngineInitialized',
    'inferenceRun',
    'workersDispatched',
    'supabaseTouched',
    'sqlExecuted',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'creditMutationCreated',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

function assertClientFalseFlags(flags: JsonRecord) {
  for (const key of [
    'serviceUrlResolvedNow',
    'authHeaderCreated',
    'identityTokenFetched',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
    'inferenceRun',
    'workersDispatched',
    'supabaseTouched',
    'sqlExecuted',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'creditMutationCreated',
    'betaUnlocked',
    'productionUnlocked',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

function expectThrows(action: () => unknown, message: string) {
  let thrown = false
  try {
    action()
  } catch {
    thrown = true
  }
  assert.equal(thrown, true, message)
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-frontend-client.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-deploy-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-source.md',
  'docs/qwen2-5-vl-7b-private-invoke-auth-reverify-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-authz-fix-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-routing-fix-result.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-service-deploy-result.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-execute-result.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-fix-result.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-result-review.md',
  'docs/qwen2-5-vl-7b-structured-fixture-output-fix.md',
  'docs/qwen2-5-vl-7b-structured-fixture-output-smoke-retry-result.md',
  'docs/qwen2-5-vl-7b-structured-fixture-output-result-review.md',
  'docs/qwen2-5-vl-7b-private-runtime-readiness-review-result.md',
  'docs/qwen2-5-vl-7b-approved-worker-integration-readiness-review.md',
  'docs/qwen2-5-vl-7b-backend-runtime-dispatch-implementation-plan.md',
  'docs/qwen2-5-vl-7b-fail-closed-backend-runtime-dispatch-coordinator.md',
  'docs/qwen2-5-vl-7b-controlled-backend-dispatch-dry-run.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-plan.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-schema-draft-review.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-migration-draft.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-validation-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-plan.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-create-report.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-verify-report.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result.md',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'supabase/config.toml',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup.ts',
  'src/backend/mock/mock-qwen2-5-vl-private-invoke-runtime-readiness-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-source.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-deploy-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-execute-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-fix-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-result-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-smoke-retry-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-result-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-private-runtime-readiness-review-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-worker-integration-readiness-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-dispatch-implementation-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-migration-draft.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-validation-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-create.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result.ts',
  'src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-frontend-client.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-deploy-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-source.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-migration-draft-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-validation-result-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-plan-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-config-create-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify-smoke.ts',
  'server/smoke/qwen2-5-vl-approved-fixture-inference-service-deploy-result-smoke.ts',
  'server/smoke/qwen2-5-vl-approved-fixture-inference-smoke-execute-result-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup-smoke.ts',
  'package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-migration-draft'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-migration-draft-smoke.ts',
  'migration draft package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-validation-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-validation-result-smoke.ts',
  'local validation result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-plan'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-plan-smoke.ts',
  'local harness plan package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-config-create'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-config-create-smoke.ts',
  'local harness config create package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify-smoke.ts',
  'local harness config verify package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-smoke.ts',
  'local harness validation result package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md')
for (const phrase of [
  DECISION,
  '`qwen_vl`',
  '`Qwen2.5-VL 7B Instruct`',
  '`jobs.qwen2_5_vl.privateInvoke.dryRun`',
  '`/api/jobs/qwen2-5-vl/private-invoke/dry-run/mock`',
  'NVIDIA L4',
  'scale to zero required',
  'run-on-use and stop-when-idle',
  '`qwen_inference_disabled_after_contract_check`',
  'vLLM could not allocate KV cache memory',
  '`qwen_fixture_inference_smoke_completed`',
  '`qwen25-structured-fixture-output-retry-20260627t204453z`',
  '`reeditpro-qwen2-5-vl-private-caller-hn9sw`',
  '`reeditpro-qwen2-5-vl-l4-worker-00013-kms`',
  'parsedJson=false',
  'schemaKeys=[]',
  '`parsedJson=true`',
  '`schemaValid=true`',
  '`objectCount=3`',
  '`textLikeRegionCount=1`',
  '`spatialRelationCount=2`',
  '`blockedActionCount=4`',
  '`qwen_fixture_visual_metadata_v1`',
  'structured fixture output result review: ready, metadata-only review accepted',
  'private runtime readiness result review: ready, controlled fixture runtime evidence accepted',
  'approved worker integration review: ready',
  'backend runtime dispatch implementation plan: ready',
  'fail-closed backend runtime dispatch coordinator: ready',
  'controlled backend dispatch dry-run review: ready',
  'backend runtime persistence plan: ready',
  'backend runtime persistence schema draft: ready, schema review recorded',
  'backend runtime persistence migration draft: ready, draft recorded',
  'backend runtime persistence local validation result: ready, blocked result recorded',
  'backend runtime persistence local harness plan: ready, plan recorded',
  'backend runtime persistence local harness config: ready, config created',
  'backend runtime persistence local harness config verification: ready, verification passed',
  'backend runtime persistence local harness validation: ready, blocked port-conflict result recorded',
  'backend runtime persistence local harness port fix: blocked, port fix required',
  'port `54322` is already allocated',
  '`backendRuntimePersistenceLocalHarnessValidationResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationAttempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRequired=false`',
  '`backendRuntimePersistenceLocalHarnessStartAttempted=true`',
  '`backendRuntimePersistenceLocalHarnessPortConflictDetected=true`',
  '`backendRuntimePersistenceLocalHarnessPortFixRequired=true`',
  '`privateInvokeReady=false`',
  '`betaReady=false`',
  '`productionReady=false`',
  '`inferenceRun=false`',
  '`workersDispatched=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  '`structuredFixtureOutputSourceFixDefined=true`',
  '`structuredFixturePromptSchemaTargetDefined=true`',
  '`structuredFixtureJsonExtractionDefined=true`',
  '`structuredFixtureMetadataNormalizationDefined=true`',
  '`structuredFixtureCpuCallerPassConditionTightened=true`',
  '`structuredFixtureOutputLocalParserValidationPassed=true`',
  '`structuredFixtureOutputSmokeRetryRequired=false`',
  '`structuredFixtureOutputSmokeRetryAttempted=true`',
  '`structuredFixtureOutputSmokeRetryPassed=true`',
  '`structuredFixtureOutputAcceptedForReview=true`',
  '`structuredFixtureOutputResultReviewRequired=false`',
  '`structuredFixtureOutputResultReviewRecorded=true`',
  '`structuredFixtureMetadataAccepted=true`',
  '`privateRuntimeReadinessReviewRequired=false`',
  '`privateRuntimeReadinessReviewRecorded=true`',
  '`controlledPrivateFixtureRuntimeEvidenceAccepted=true`',
  '`privateFixtureStructuredMetadataAccepted=true`',
  '`privateInvokeReadyForControlledFixtureMetadata=true`',
  '`approvedWorkerIntegrationReviewRequired=false`',
  '`approvedWorkerIntegrationReadinessReviewRecorded=true`',
  '`approvedWorkerIntegrationEvidenceAccepted=true`',
  '`localQueueContractAcceptedForWorkerIntegration=true`',
  '`failClosedDispatchAdapterAcceptedForWorkerIntegration=true`',
  '`privateInvokePlanAndConfigAcceptedForWorkerIntegration=true`',
  '`backendRuntimeDispatchImplementationRequired=false`',
  '`backendRuntimeDispatchImplementationPlanRecorded=true`',
  '`failClosedBackendRuntimeDispatchCoordinatorRequired=false`',
  '`backendRuntimeDispatchCoordinatorImplemented=true`',
  '`controlledBackendDispatchDryRunRequired=false`',
  '`controlledBackendDispatchDryRunReviewed=true`',
  '`backendRuntimePersistencePlanRequired=false`',
  '`backendRuntimePersistencePlanRecorded=true`',
  '`backendRuntimePersistenceSchemaDraftRequired=false`',
  '`backendRuntimePersistenceSchemaDraftReviewRecorded=true`',
  '`backendRuntimePersistenceMigrationDraftRequired=false`',
  '`backendRuntimePersistenceMigrationDraftRecorded=true`',
  '`backendRuntimePersistenceLocalValidationRequired=false`',
  '`backendRuntimePersistenceLocalValidationResultRecorded=true`',
  '`backendRuntimePersistenceLocalValidationAttempted=false`',
  '`backendRuntimePersistenceLocalValidationPassed=false`',
  '`backendRuntimePersistenceLocalHarnessRequired=false`',
  '`backendRuntimePersistenceLocalHarnessPlanRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessConfigRequired=false`',
  '`backendRuntimePersistenceLocalHarnessConfigCreated=true`',
  '`backendRuntimePersistenceLocalHarnessConfigVerificationRequired=false`',
  '`backendRuntimePersistenceLocalHarnessConfigVerificationPassed=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationAttempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationPassed=false`',
  '`backendRuntimePersistenceLocalHarnessStartAttempted=true`',
  '`backendRuntimePersistenceLocalHarnessStarted=false`',
  '`backendRuntimePersistenceLocalHarnessPortConflictDetected=true`',
  '`backendRuntimePersistenceLocalHarnessPortFixRequired=true`',
  '`qwenLocalContainersLeftBehind=false`',
  '`configTomlCreated=true`',
  '`configTomlExistsAfter=true`',
  '`configVerificationRequired=false`',
  '`configVerificationPassed=true`',
  '`localToolchainVerificationPassed=true`',
  '`supabaseCliCompatible=true`',
  '`dockerCliAvailable=true`',
  '`readyForLocalHarnessValidation=true`',
  '`approvedLocalHarnessExists=false`',
  '`readyForRealWorkerDispatch=false`',
  '`structuredFixtureOutputSchemaValid=true`',
  '`structuredFixtureOutputParsedJson=true`',
  '`structuredFixtureOutputRawOutputStoredInRepo=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const rollup = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_READINESS_ROLLUP
assert.equal(rollup.decision, DECISION)
assert.equal(
  rollup.upstreamCpuCallerSourceDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_SOURCE.decision,
)
assert.equal(
  rollup.upstreamCpuCallerDeployDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_DEPLOY_RESULT.decision,
)
assert.equal(
  rollup.upstreamCpuCallerContractSmokeDecision,
  QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT.decision,
)
assert.equal(
  rollup.upstreamRuntimeReadinessReviewDecision,
  QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW.decision,
)
assert.equal(
  rollup.upstreamApprovedFixtureInferenceSmokePlanDecision,
  QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_PLAN.decision,
)
assert.equal(
  rollup.upstreamApprovedFixtureInferenceServiceSourceDecision,
  QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_SOURCE.decision,
)
assert.equal(
  rollup.upstreamApprovedFixtureInferenceServiceDeployDecision,
  QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_DEPLOY_RESULT.decision,
)
assert.equal(
  rollup.upstreamApprovedFixtureInferenceSmokeExecuteDecision,
  QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_EXECUTE_RESULT.decision,
)
assert.equal(
  rollup.upstreamApprovedFixtureInferenceSmokeFixDecision,
  QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT.decision,
)
assert.equal(
  rollup.upstreamApprovedFixtureInferenceResultReviewDecision,
  QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_RESULT_REVIEW.decision,
)
assert.equal(
  rollup.upstreamStructuredFixtureOutputFixDecision,
  QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_FIX.decision,
)
assert.equal(
  rollup.upstreamStructuredFixtureOutputSmokeRetryDecision,
  QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_SMOKE_RETRY_RESULT.decision,
)
assert.equal(
  rollup.upstreamStructuredFixtureOutputResultReviewDecision,
  QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW.decision,
)
assert.equal(
  rollup.upstreamPrivateRuntimeReadinessReviewResultDecision,
  QWEN2_5_VL_PRIVATE_RUNTIME_READINESS_REVIEW_RESULT.decision,
)
assert.equal(
  rollup.upstreamApprovedWorkerIntegrationReadinessReviewDecision,
  QWEN2_5_VL_APPROVED_WORKER_INTEGRATION_READINESS_REVIEW.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimeDispatchImplementationPlanDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_DISPATCH_IMPLEMENTATION_PLAN.decision,
)
assert.equal(
  rollup.upstreamFailClosedBackendRuntimeDispatchCoordinatorDecision,
  QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR.decision,
)
assert.equal(
  rollup.upstreamControlledBackendDispatchDryRunDecision,
  QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistencePlanDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceSchemaDraftReviewDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceMigrationDraftDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_MIGRATION_DRAFT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalValidationResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_VALIDATION_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessPlanDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_PLAN.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessConfigCreateDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_CREATE.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessConfigVerifyDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_VERIFY.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT.decision,
)
assert.equal(rollup.registryToolId, 'qwen_vl')
assert.equal(rollup.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(rollup.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(rollup.selectedRuntime.minInstancesRequired, 0)
assert.equal(rollup.selectedRuntime.maxInstancesForInitialPrivateInvoke, 1)
assert.equal(rollup.selectedRuntime.cpuFallbackAllowed, false)
assert.equal(rollup.nextPrompt, NEXT_PROMPT)
assert.equal(QWEN25_PRIVATE_INVOKE_TOKEN_PATH_FIX_RESULT.status, 'blocked')
assert.deepEqual(QWEN25_PRIVATE_INVOKE_TOKEN_PATH_FIX_RESULT.blockers, ['token_creator_permission_required'])
assert.equal(QWEN25_PRIVATE_INVOKE_AUTHZ_FIX_RESULT.status, 'blocked')
assert.deepEqual(QWEN25_PRIVATE_INVOKE_AUTHZ_FIX_RESULT.blockers, ['private_invoke_response_unexpected'])
assert.equal(QWEN25_PRIVATE_INVOKE_AUTHZ_FIX_RESULT.runtimeFlags.identityTokenFetched, true)
assert.equal(QWEN25_PRIVATE_INVOKE_AUTHZ_FIX_RESULT.runtimeFlags.cloudRunInvocationAttempted, true)
assert.equal(QWEN25_PRIVATE_INVOKE_AUTHZ_FIX_RESULT.runtimeFlags.serviceRuntimeRequestSent, true)
assert.equal(QWEN25_PRIVATE_INVOKE_ROUTING_FIX_RESULT.status, 'blocked')
assert.deepEqual(QWEN25_PRIVATE_INVOKE_ROUTING_FIX_RESULT.blockers, [
  'private_ingress_internal_caller_required',
])
assert.equal(QWEN25_PRIVATE_INVOKE_ROUTING_FIX_RESULT.runtimeFlags.restrictedIngressObserved, true)
assert.equal(
  QWEN25_PRIVATE_INVOKE_ROUTING_FIX_RESULT.runtimeFlags.restrictedIngressDirectLocalRequestBlocked,
  true,
)
assert.equal(QWEN25_PRIVATE_INVOKE_ROUTING_FIX_RESULT.runtimeFlags.cloudRunInvocationAttempted, false)
assert.equal(
  QWEN25_PRIVATE_INVOKE_ROUTING_FIX_RESULT.nextPrompt,
  'QWEN2_5_VL_STACK_TOOL_54-PRIVATE-INVOKE-INTERNAL-CALLER-HARNESS: create controlled internal caller or internal LB/PSC path for contract smoke, no inference',
)

const qwenProfile = getProductionToolProfile('qwen_vl')
check(qwenProfile, 'Qwen production tool profile must exist.')
assert.equal(qwenProfile.displayName, 'Qwen2.5-VL 7B Instruct')
assert.equal(qwenProfile.category, 'visual_analysis')
assert.equal(qwenProfile.workerType, 'gpu_ai_worker')
assert.equal(qwenProfile.gpuRequired, true)
assert.equal(qwenProfile.cpuAllowed, false)
assert.equal(qwenProfile.modelWeightPolicy.required, true)
assert.ok(qwenProfile.bestFor.includes('Generated fixture visual understanding'))
assert.ok(qwenProfile.notBestFor.includes('AI video generation'))
assert.ok(qwenProfile.notBestFor.includes('Final render/export'))
expectThrows(() => assertToolModelWeightsAllowed('qwen_vl'), 'Qwen model weights must remain unapproved.')
expectThrows(() => assertToolAllowedForWorker('qwen_vl', 'cpu_analysis_worker'), 'Qwen must not be CPU-worker ready.')

const route = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_ROUTE
assert.equal(route.routeId, 'jobs.qwen2_5_vl.privateInvoke.dryRun')
assert.equal(route.routeBoundaries.status, 'mock_ready')
assert.equal(route.routeBoundaries.runtimeMode, 'mock')
assert.equal(route.routeBoundaries.rawPromptBodyRejectedByMockHandler, true)

const client = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_FRONTEND_CLIENT
assert.equal(client.runtimeFlags.frontendClientDefined, true)
assert.equal(client.runtimeFlags.routeMockReady, true)
assert.equal(client.clientBoundaries.usesCentralReeditProApiClient, true)
assert.equal(client.clientBoundaries.browserMayCallCloudRun, false)
assertClientFalseFlags(client.runtimeFlags)

const status = getQwen25VlPrivateInvokeFrontendClientStatus()
assert.equal(status.mode, 'qwen2_5_vl_private_invoke_frontend_client_mock_only')
assert.equal(status.mayInvokeCloudRun, false)
assert.equal(status.mayRunInference, false)
assert.equal(status.mayDispatchWorker, false)

const ui = getQwenVlPlannerRoutingUiData()
assert.equal(ui.privateInvokeClient.currentStatus, 'backend_runtime_persistence_local_harness_port_fix_required')
assert.equal(ui.privateInvokeClient.routeId, 'jobs.qwen2_5_vl.privateInvoke.dryRun')
assert.equal(ui.executionGates.plannerMayInvokeCloudRun, false)
assert.equal(ui.summary.dryRunPassedClaimed, false)

const auth = QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT
assert.equal(auth.status, 'passed')
assert.equal(auth.remainingBlocker, 'private_invoke_smoke_execution_required_no_inference')
assert.equal(auth.qwenRuntimeReadiness.privateInvocationAuthVerified, true)
assert.equal(auth.qwenRuntimeReadiness.cloudRunServiceDescribeVerified, true)
assert.equal(auth.qwenRuntimeReadiness.cloudRunIamPolicyVerified, true)
assert.equal(auth.qwenRuntimeReadiness.runtimeServiceAccountVerified, true)
assert.equal(auth.qwenRuntimeReadiness.projectInvokerPolicyVerified, true)
assert.equal(auth.qwenRuntimeReadiness.readyForPrivateInvocationSmoke, false)
assert.equal(auth.observedCloudRunCostPosture.gpuType, 'nvidia_l4')
assert.equal(auth.observedCloudRunCostPosture.serviceMaxScale, '3')
assert.equal(auth.observedCloudRunCostPosture.costGuardReviewRequiredBeforeInvoke, true)

const gateIds = rollup.readinessGates.map((gate) => gate.id)
assert.deepEqual(gateIds, [
  'production_registry_profile',
  'production_readiness_spec',
  'private_invoke_route',
  'frontend_client',
  'chat_ui_surface',
  'cloud_run_auth_reverify',
  'private_invoke_smoke_plan',
  'private_invoke_smoke_execution',
  'private_invoke_runtime_readiness_review',
  'first_approved_fixture_inference_smoke_plan',
  'approved_fixture_inference_service_source',
  'approved_fixture_inference_service_deploy',
  'first_approved_fixture_inference_smoke_execution',
  'approved_fixture_inference_smoke_fix_retry',
  'approved_fixture_inference_result_review',
  'approved_fixture_structured_output_source_fix',
  'approved_fixture_structured_output_smoke_retry',
  'approved_fixture_structured_output_result_review',
  'private_runtime_readiness_result_review',
  'approved_worker_integration_review',
  'backend_runtime_dispatch_implementation',
  'fail_closed_backend_runtime_dispatch_coordinator',
  'controlled_backend_dispatch_dry_run',
  'backend_runtime_persistence_plan',
  'backend_runtime_persistence_schema_draft',
  'backend_runtime_persistence_migration_draft',
  'backend_runtime_persistence_local_validation_result',
  'backend_runtime_persistence_local_harness_plan',
  'backend_runtime_persistence_local_harness_config',
  'backend_runtime_persistence_local_harness_config_verify',
  'backend_runtime_persistence_local_harness_validation',
  'backend_runtime_persistence_local_harness_port_fix',
])
assert.equal(rollup.readinessGates.filter((gate) => gate.status === 'ready').length, 31)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_approved_fixture_inference_service_deploy_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_approved_fixture_inference_smoke_execution_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_approved_fixture_inference_smoke_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_approved_fixture_inference_result_review_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_approved_fixture_structured_output_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_approved_fixture_structured_output_smoke_retry_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_approved_fixture_structured_output_result_review_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_private_runtime_readiness_review_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_approved_worker_integration_review_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_dispatch_implementation_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_fail_closed_backend_runtime_dispatch_coordinator_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_controlled_backend_dispatch_dry_run_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_plan_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_schema_draft_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_migration_draft_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_validation_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_config_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_config_verify_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_port_fix_required').length,
  1,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_cpu_only_internal_caller_contract_smoke_required').length,
  0,
)
assertRollupFalseFlags(rollup.runtimeFlags)
assert.equal(rollup.runtimeFlags.registryProfileReady, true)
assert.equal(rollup.runtimeFlags.productionReadinessSpecRegistered, true)
assert.equal(rollup.runtimeFlags.routeMockReady, true)
assert.equal(rollup.runtimeFlags.frontendClientReady, true)
assert.equal(rollup.runtimeFlags.uiSurfacingReady, true)
assert.equal(rollup.runtimeFlags.privateInvocationAuthVerified, true)
assert.equal(rollup.runtimeFlags.cloudRunServiceDescribeVerified, true)
assert.equal(rollup.runtimeFlags.cloudRunIamPolicyVerified, true)
assert.equal(rollup.runtimeFlags.runtimeServiceAccountVerified, true)
assert.equal(rollup.runtimeFlags.projectInvokerPolicyVerified, true)
assert.equal(rollup.runtimeFlags.privateInvokeSmokePlanDefined, true)
assert.equal(rollup.runtimeFlags.internalCallerHarnessPlanDefined, true)
assert.equal(rollup.runtimeFlags.internalCallerDeployPreflightRecorded, true)
assert.equal(rollup.runtimeFlags.internalRouteApprovalRecorded, true)
assert.equal(rollup.runtimeFlags.futureDirectVpcRouteConfigApproved, true)
assert.equal(rollup.runtimeFlags.directVpcRouteConfigResultRecorded, true)
assert.equal(rollup.runtimeFlags.gcpNetworkMutationOccurred, true)
assert.equal(rollup.runtimeFlags.dedicatedCallerSubnetCreated, true)
assert.equal(rollup.runtimeFlags.dedicatedCallerSubnetPrivateGoogleAccess, true)
assert.equal(rollup.runtimeFlags.defaultSubnetPrivateGoogleAccess, false)
assert.equal(rollup.runtimeFlags.defaultSubnetChanged, false)
assert.equal(rollup.runtimeFlags.approvedPrivateRouteReady, true)
assert.equal(rollup.runtimeFlags.directVpcPrivateRoutePrerequisiteReady, true)
assert.equal(rollup.runtimeFlags.cpuOnlyCallerSourceDefined, true)
assert.equal(rollup.runtimeFlags.cpuOnlyCallerImageSourceDefined, true)
assert.equal(rollup.runtimeFlags.cpuOnlyCallerImageDefined, true)
assert.equal(rollup.runtimeFlags.cpuOnlyCallerImageBuilt, true)
assert.equal(rollup.runtimeFlags.cpuOnlyCallerImagePushed, true)
assert.equal(rollup.runtimeFlags.cpuOnlyCallerImageDeployed, true)
assert.equal(rollup.runtimeFlags.cpuOnlyCallerJobDeployed, true)
assert.equal(rollup.runtimeFlags.callerHarnessReady, true)
assert.equal(rollup.runtimeFlags.jobExecutionCount, 1)
assert.equal(rollup.runtimeFlags.serviceAccountCreated, true)
assert.equal(rollup.runtimeFlags.targetServiceInvokerIamChanged, true)
assert.equal(rollup.runtimeFlags.directVpcEgressConfigured, true)
assert.equal(rollup.runtimeFlags.privateGoogleAccessChanged, false)
assert.equal(rollup.runtimeFlags.internalCallerHarnessDeployed, true)
assert.equal(rollup.runtimeFlags.privateInvokeSmokeAttempted, true)
assert.equal(rollup.runtimeFlags.privateInvokeSmokeBlockedBeforeRequest, false)
assert.equal(rollup.runtimeFlags.privateInvokeSmokeExecuted, true)
assert.equal(rollup.runtimeFlags.privateInvokeSmokePassed, true)
assert.equal(rollup.runtimeFlags.failClosedResponseObserved, true)
assert.equal(rollup.runtimeFlags.contractSatisfiedForFutureRuntime, true)
assert.equal(rollup.runtimeFlags.runtimeContractExecutesNow, false)
assert.equal(rollup.runtimeFlags.runtimeReadinessReviewRecorded, true)
assert.equal(rollup.runtimeFlags.firstApprovedFixtureInferenceSmokePlanDefined, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceServiceSourceDefined, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceServiceDeployed, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceServiceDeployVerified, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceGpuImageBuilt, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceGpuImagePushed, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceGpuServiceReady, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceGpuServiceRevisionReady, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceCpuCallerImageBuilt, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceCpuCallerImagePushed, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceCpuCallerJobUpdated, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceCpuCallerJobReady, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceCpuCallerJobExecuted, true)
assert.equal(rollup.runtimeFlags.firstApprovedFixtureInferenceSmokeAttempted, true)
assert.equal(rollup.runtimeFlags.firstApprovedFixtureInferenceSmokeExecuted, true)
assert.equal(rollup.runtimeFlags.firstApprovedFixtureInferenceSmokePassed, false)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceSmokeFixRequired, false)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceSmokeFixAttempted, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceSmokeFixPassed, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceSmokeResultReviewRequired, false)
assert.equal(rollup.runtimeFlags.temporaryFixtureInferenceServiceRevisionDeployed, true)
assert.equal(rollup.runtimeFlags.temporaryFixtureInferenceServiceRestored, true)
assert.equal(rollup.runtimeFlags.serviceRestoredFailClosedAfterFixtureAttempt, true)
assert.equal(rollup.runtimeFlags.serviceUrlResolvedNow, true)
assert.equal(rollup.runtimeFlags.audienceResolvedNow, true)
assert.equal(rollup.runtimeFlags.authHeaderCreated, true)
assert.equal(rollup.runtimeFlags.identityTokenFetched, true)
assert.equal(rollup.runtimeFlags.cloudRunInvocationAttempted, true)
assert.equal(rollup.runtimeFlags.restrictedIngressDirectLocalRequestBlocked, true)
assert.equal(rollup.runtimeFlags.serviceRuntimeRequestSent, true)
assert.equal(rollup.runtimeFlags.responseClassifiedLocally, true)
assert.equal(rollup.runtimeFlags.modelImportRun, true)
assert.equal(rollup.runtimeFlags.modelLoadRun, true)
assert.equal(rollup.runtimeFlags.modelLoadCompleted, true)
assert.equal(rollup.runtimeFlags.vllmKvCacheMemoryFailureObserved, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceVllmEngineInitialized, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceMetadataOutputCreated, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceMetadataOutputAcceptedForRuntime, false)
assert.equal(rollup.runtimeFlags.controlledApprovedFixtureInferenceCompleted, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceResultReviewRecorded, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceInvocationEvidenceAccepted, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceStructuredOutputAccepted, true)
assert.equal(rollup.runtimeFlags.approvedFixtureInferenceStructuredOutputFixRequired, false)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputSourceFixDefined, true)
assert.equal(rollup.runtimeFlags.structuredFixturePromptSchemaTargetDefined, true)
assert.equal(rollup.runtimeFlags.structuredFixtureJsonExtractionDefined, true)
assert.equal(rollup.runtimeFlags.structuredFixtureMetadataNormalizationDefined, true)
assert.equal(rollup.runtimeFlags.structuredFixtureCpuCallerPassConditionTightened, true)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputLocalParserValidationPassed, true)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputSmokeRetryRequired, false)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputSmokeRetryAttempted, true)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputSmokeRetryPassed, true)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputAcceptedForReview, true)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputResultReviewRequired, false)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputResultReviewRecorded, true)
assert.equal(rollup.runtimeFlags.structuredFixtureMetadataAccepted, true)
assert.equal(rollup.runtimeFlags.privateRuntimeReadinessReviewRequired, false)
assert.equal(rollup.runtimeFlags.privateRuntimeReadinessReviewRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPrivateFixtureRuntimeEvidenceAccepted, true)
assert.equal(rollup.runtimeFlags.privateFixtureStructuredMetadataAccepted, true)
assert.equal(rollup.runtimeFlags.privateInvokeReadyForControlledFixtureMetadata, true)
assert.equal(rollup.runtimeFlags.approvedWorkerIntegrationReviewRequired, false)
assert.equal(rollup.runtimeFlags.approvedWorkerIntegrationReadinessReviewRecorded, true)
assert.equal(rollup.runtimeFlags.approvedWorkerIntegrationEvidenceAccepted, true)
assert.equal(rollup.runtimeFlags.localQueueContractAcceptedForWorkerIntegration, true)
assert.equal(rollup.runtimeFlags.failClosedDispatchAdapterAcceptedForWorkerIntegration, true)
assert.equal(rollup.runtimeFlags.privateInvokePlanAndConfigAcceptedForWorkerIntegration, true)
assert.equal(rollup.runtimeFlags.structuredFixtureMetadataAcceptedForWorkerIntegration, true)
assert.equal(rollup.runtimeFlags.privateRuntimeEvidenceAcceptedForWorkerIntegration, true)
assert.equal(rollup.runtimeFlags.backendRuntimeDispatchImplementationRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimeDispatchImplementationPlanRecorded, true)
assert.equal(rollup.runtimeFlags.failClosedBackendRuntimeDispatchCoordinatorRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimeDispatchCoordinatorImplemented, true)
assert.equal(rollup.runtimeFlags.controlledBackendDispatchDryRunRequired, false)
assert.equal(rollup.runtimeFlags.controlledBackendDispatchDryRunReviewed, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistencePlanRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistencePlanRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceSchemaDraftRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceSchemaDraftReviewRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceMigrationDraftRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceMigrationDraftRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalValidationRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalValidationResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalValidationAttempted, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalValidationPassed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessPlanRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessConfigRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessConfigCreated, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessConfigVerificationRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessConfigVerificationPassed, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationAttempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationPassed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessStartAttempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessStarted, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessPortConflictDetected, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessPortFixRequired, true)
assert.equal(rollup.runtimeFlags.existingLocalSupabaseProjectDetected, true)
assert.equal(rollup.runtimeFlags.qwenLocalContainersLeftBehind, false)
assert.equal(rollup.runtimeFlags.configTomlCreated, true)
assert.equal(rollup.runtimeFlags.configTomlExistsAfter, true)
assert.equal(rollup.runtimeFlags.configVerificationRequired, false)
assert.equal(rollup.runtimeFlags.configVerificationPassed, true)
assert.equal(rollup.runtimeFlags.localToolchainVerificationPassed, true)
assert.equal(rollup.runtimeFlags.supabaseCliCompatible, true)
assert.equal(rollup.runtimeFlags.dockerCliAvailable, true)
assert.equal(rollup.runtimeFlags.readyForLocalHarnessValidation, true)
assert.equal(rollup.runtimeFlags.approvedLocalHarnessExists, false)
assert.equal(rollup.runtimeFlags.readyForRealWorkerDispatch, false)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputSchemaValid, true)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputParsedJson, true)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputObjectCount, 3)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputTextLikeRegionCount, 1)
assert.equal(rollup.runtimeFlags.structuredFixtureOutputRawOutputStoredInRepo, false)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-routing-fix-result.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-execute-result.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-fix-result.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-result-review.md',
  'docs/qwen2-5-vl-7b-structured-fixture-output-fix.md',
  'docs/qwen2-5-vl-7b-structured-fixture-output-smoke-retry-result.md',
  'docs/qwen2-5-vl-7b-structured-fixture-output-result-review.md',
  'docs/qwen2-5-vl-7b-private-runtime-readiness-review-result.md',
  'docs/qwen2-5-vl-7b-approved-worker-integration-readiness-review.md',
  'docs/qwen2-5-vl-7b-backend-runtime-dispatch-implementation-plan.md',
  'docs/qwen2-5-vl-7b-fail-closed-backend-runtime-dispatch-coordinator.md',
  'docs/qwen2-5-vl-7b-controlled-backend-dispatch-dry-run.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-plan.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-schema-draft-review.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-migration-draft.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-validation-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-create-report.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-verify-report.md',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'supabase/config.toml',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-execute-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-fix-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-result-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-smoke-retry-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-result-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-private-runtime-readiness-review-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-approved-worker-integration-readiness-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-dispatch-implementation-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-migration-draft.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-validation-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-create.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({
  rollup,
  client,
  route,
  status,
  ui,
  fixtureSmokeExecuteResult: QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_EXECUTE_RESULT,
  fixtureSmokeFixResult: QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_FIX_RESULT,
  fixtureResultReview: QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_RESULT_REVIEW,
  structuredFixtureOutputFix: QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_FIX,
  structuredFixtureOutputSmokeRetryResult: QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_SMOKE_RETRY_RESULT,
  structuredFixtureOutputResultReview: QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW,
  privateRuntimeReadinessReviewResult: QWEN2_5_VL_PRIVATE_RUNTIME_READINESS_REVIEW_RESULT,
  approvedWorkerIntegrationReadinessReview: QWEN2_5_VL_APPROVED_WORKER_INTEGRATION_READINESS_REVIEW,
  backendRuntimeDispatchImplementationPlan: QWEN2_5_VL_BACKEND_RUNTIME_DISPATCH_IMPLEMENTATION_PLAN,
  failClosedBackendRuntimeDispatchCoordinator: QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR,
  controlledBackendDispatchDryRunResult: QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT,
  backendRuntimePersistencePlan: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN,
  backendRuntimePersistenceSchemaDraftReview: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW,
  backendRuntimePersistenceMigrationDraft: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_MIGRATION_DRAFT,
  backendRuntimePersistenceLocalValidationResult: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_VALIDATION_RESULT,
  backendRuntimePersistenceLocalHarnessPlan: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_PLAN,
  backendRuntimePersistenceLocalHarnessConfigCreate: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_CREATE,
  backendRuntimePersistenceLocalHarnessConfigVerify: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_VERIFY,
  backendRuntimePersistenceLocalHarnessValidationResult: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT,
  contractSmokeResult: QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT,
})
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen readiness rollup data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  readyGateCount: rollup.readinessGates.filter((gate) => gate.status === 'ready').length,
  blockedGateCount: rollup.readinessGates.filter((gate) => gate.status !== 'ready').length,
  selectedGpu: rollup.selectedRuntime.gpu,
  costPosture: rollup.selectedRuntime.costPosture,
  privateInvokeReady: rollup.runtimeFlags.privateInvokeReady,
  betaReady: rollup.runtimeFlags.betaReady,
  productionReady: rollup.runtimeFlags.productionReady,
  remainingBlocker: rollup.blockedUntil[0],
  nextPrompt: rollup.nextPrompt,
}, null, 2))
