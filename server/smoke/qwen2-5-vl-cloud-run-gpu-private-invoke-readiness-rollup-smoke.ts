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
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_PORT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-port-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_MIGRATION_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-migration-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_2_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-2-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CURRENT_EDIT_SESSION_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-current-edit-session-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_3_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-3-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_MEDIA_ASSETS_STATUS_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-media-assets-status-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_4_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-4-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_EDIT_PLAN_SEGMENTS_VERSION_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-edit-plan-segments-version-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_5_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-5-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CREDIT_APPROVAL_SNAPSHOTS_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-credit-approval-snapshots-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_6_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-6-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CREDIT_ESTIMATES_PLAN_VERSION_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-credit-estimates-plan-version-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_7_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_GENERATION_REQUESTS_APPROVED_SNAPSHOT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_8_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-8-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_GENERATED_ASSET_VERSIONS_VERSION_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-generated-asset-versions-version-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_9_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-9-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_QA_CHECK_RESULTS_CHECK_COLUMN_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-qa-check-results-check-column-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_10_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-10-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_QA_REPORTS_APPROVED_SNAPSHOT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_11_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-11-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_RLS_FUNCTION_PARAMETER_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_12_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_BUCKETS_COMMENT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-buckets-comment-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_13_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-13-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_OBJECTS_POLICY_COMMENT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-objects-policy-comment-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_14_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-14-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_UPLOAD_PIPELINE_POLICY_COMMENT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-upload-pipeline-policy-comment-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-plan'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_CREATE } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-create'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_VALIDATION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-validation-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-plan'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-approval'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_EXECUTE_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-execute-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_RECONCILIATION } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_ADOPTION } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-adoption'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_ADOPTED_LOCAL_VALIDATION } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-adopted-local-validation'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_REMOTE_SATISFACTION_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_EXECUTION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-result-review'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_IMPLEMENTATION } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_EXECUTION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-result-review'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_APPROVAL_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_APPROVAL_DECISION } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-decision'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_DECISION } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-preflight'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-plan'
import { QWEN2_5_VL_RUNTIME_PERSISTENCE_TO_WORKER_DISPATCH_READINESS_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-runtime-persistence-to-worker-dispatch-readiness-review'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_FRONTEND_CLIENT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-frontend-client'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_ROUTE } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run-route'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_READINESS_ROLLUP } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup'
import { getQwen25VlPrivateInvokeFrontendClientStatus } from '../../src/backend/api/qwen2-5-vl-private-invoke-frontend-client'
import { getQwenVlPlannerRoutingUiData } from '../../src/lib/qwen-vl-planner-routing-ui'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_cloud_run_gpu_private_invoke_readiness_rollup_controlled_persisted_dispatch_runtime_real_dispatch_transport_dependency_enablement_approval_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CH-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-APPROVAL: approve controlled Qwen real-dispatch lease adapter and private invoke transport dependency enablement, no generated assets/no beta'

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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-2-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-current-edit-session-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-3-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-edit-plan-segments-version-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-media-assets-status-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-4-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-edit-plan-segments-version-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-5-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-credit-approval-snapshots-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-credit-estimates-plan-version-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-6-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-credit-estimates-plan-version-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-7-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-8-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-generated-asset-versions-version-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-9-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-qa-check-results-check-column-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-10-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-rls-function-parameter-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-12-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-11-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-rls-function-parameter-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-12-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-storage-buckets-comment-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-8-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-generated-asset-versions-version-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-9-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-qa-check-results-check-column-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-10-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-4-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-media-assets-status-fix.md',
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
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-2-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-current-edit-session-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-3-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-media-assets-status-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-4-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-edit-plan-segments-version-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-5-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-credit-approval-snapshots-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-6-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-credit-estimates-plan-version-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-8-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-generated-asset-versions-version-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-9-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-qa-check-results-check-column-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-10-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-11-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-buckets-comment-fix.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-8-result-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-generated-asset-versions-version-fix-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-9-result-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-qa-check-results-check-column-fix-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-10-result-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-11-result-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-storage-buckets-comment-fix-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-credit-estimates-plan-version-fix-smoke.ts',
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
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-2-result-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-current-edit-session-fix-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-3-result-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-media-assets-status-fix-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-4-result-smoke.ts',
  'server/smoke/qwen2-5-vl-approved-fixture-inference-service-deploy-result-smoke.ts',
  'server/smoke/qwen2-5-vl-approved-fixture-inference-smoke-execute-result-smoke.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-6-result-smoke.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result-smoke.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review-smoke.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-plan.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-plan-smoke.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-create.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-create.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-create-smoke.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-validation-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-validation-result.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-validation-result-smoke.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-reconciliation.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation-smoke.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-adoption.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-adoption.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-history-adoption-smoke.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-adopted-local-validation.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-adopted-local-validation.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-adopted-local-validation-smoke.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-remote-satisfaction-review.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review-smoke.ts',
  'docs/qwen2-5-vl-7b-runtime-persistence-to-worker-dispatch-readiness-review.md',
  'src/backend/mock/mock-qwen2-5-vl-runtime-persistence-to-worker-dispatch-readiness-review.ts',
  'server/smoke/qwen2-5-vl-runtime-persistence-to-worker-dispatch-readiness-review-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-smoke-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-smoke-execution-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-smoke-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-result-review.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-result-review-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-implementation.md',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-execution-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-result-review.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-result-review-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-approval-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-approval-decision.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-decision.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-decision-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-plan-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-approval.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-approval-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-attempt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-preflight.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-preflight-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review-smoke.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-plan.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-plan-smoke.ts',
  'supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}
check(
  !fs.existsSync(path.join(ROOT, 'supabase/migrations/20260629011700_qwen2_5_vl_backend_runtime_persistence.sql')),
  'Superseded duplicate local Qwen active migration must be removed.',
)

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
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation-smoke.ts',
  'runtime implementation package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation-smoke.ts',
  'active migration history reconciliation package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-history-adoption'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-history-adoption-smoke.ts',
  'active migration history adoption package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-adopted-local-validation'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-adopted-local-validation-smoke.ts',
  'active migration adopted local validation package script mismatch',
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
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-port-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-port-fix-smoke.ts',
  'local harness port fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-result-smoke.ts',
  'local harness validation retry result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-migration-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-migration-fix-smoke.ts',
  'baseline migration fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-2-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-2-result-smoke.ts',
  'local harness validation retry 2 result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-current-edit-session-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-current-edit-session-fix-smoke.ts',
  'current edit session baseline fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-3-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-3-result-smoke.ts',
  'local harness validation retry 3 result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-media-assets-status-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-media-assets-status-fix-smoke.ts',
  'media-assets status baseline fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-4-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-4-result-smoke.ts',
  'local harness validation retry 4 result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-edit-plan-segments-version-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-edit-plan-segments-version-fix-smoke.ts',
  'edit plan segments version baseline fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-5-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-5-result-smoke.ts',
  'local harness validation retry 5 result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-credit-approval-snapshots-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-credit-approval-snapshots-fix-smoke.ts',
  'credit approval snapshots baseline fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-6-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-6-result-smoke.ts',
  'local harness validation retry 6 result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-credit-estimates-plan-version-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-credit-estimates-plan-version-fix-smoke.ts',
  'credit estimates plan-version baseline fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result-smoke.ts',
  'local harness validation retry 7 result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix-smoke.ts',
  'generation requests approved-snapshot baseline fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-8-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-8-result-smoke.ts',
  'local harness validation retry 8 result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-generated-asset-versions-version-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-generated-asset-versions-version-fix-smoke.ts',
  'generated asset versions version baseline fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-9-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-9-result-smoke.ts',
  'local harness validation retry 9 package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-qa-check-results-check-column-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-qa-check-results-check-column-fix-smoke.ts',
  'QA check results check column fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-10-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-10-result-smoke.ts',
  'local harness validation retry 10 package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix-smoke.ts',
  'QA reports approved snapshot baseline fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-11-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-11-result-smoke.ts',
  'local harness validation retry 11 package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix-smoke.ts',
  'RLS function parameter baseline fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result-smoke.ts',
  'local harness validation retry 12 package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-storage-buckets-comment-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-storage-buckets-comment-fix-smoke.ts',
  'storage buckets comment baseline fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-13-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-13-result-smoke.ts',
  'local harness validation retry 13 package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-14-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-14-result-smoke.ts',
  'local harness validation retry 14 package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-storage-upload-pipeline-policy-comment-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-storage-upload-pipeline-policy-comment-fix-smoke.ts',
  'storage upload pipeline policy comment baseline fix package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result-smoke.ts',
  'local harness validation retry 15 package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review-smoke.ts',
  'local harness validation result review package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-plan'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-plan-smoke.ts',
  'active migration plan package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-create'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-create-smoke.ts',
  'active migration create package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-validation-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-validation-result-smoke.ts',
  'active migration validation package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review-smoke.ts',
  'active migration remote satisfaction review package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-runtime-persistence-to-worker-dispatch-readiness-review'],
  'tsx server/smoke/qwen2-5-vl-runtime-persistence-to-worker-dispatch-readiness-review-smoke.ts',
  'runtime persistence to worker dispatch readiness review package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan-smoke.ts',
  'controlled persisted worker dispatch smoke plan package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result-smoke.ts',
  'controlled persisted worker dispatch smoke execution result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-result-review'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-result-review-smoke.ts',
  'controlled persisted worker dispatch smoke result review package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan-smoke.ts',
  'controlled persisted worker dispatch runtime plan package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan-smoke.ts',
  'controlled persisted worker dispatch runtime smoke plan package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result-smoke.ts',
  'controlled persisted worker dispatch runtime smoke execution result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-result-review'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-result-review-smoke.ts',
  'controlled persisted worker dispatch runtime smoke result review package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan-smoke.ts',
  'controlled persisted worker dispatch runtime approval plan package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-decision'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-decision-smoke.ts',
  'controlled persisted worker dispatch runtime approval decision package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-plan-smoke.ts',
  'controlled persisted worker dispatch runtime execution plan package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-approval'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-approval-smoke.ts',
  'controlled persisted worker dispatch runtime execution approval package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight-smoke.ts',
  'controlled persisted worker dispatch runtime execution preflight package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-smoke.ts',
  'controlled persisted worker dispatch runtime execution attempt result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review-smoke.ts',
  'controlled persisted worker dispatch runtime execution attempt result review package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan-smoke.ts',
  'controlled persisted worker dispatch runtime real-dispatch approval plan package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision-smoke.ts',
  'controlled persisted worker dispatch runtime real-dispatch approval decision package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan-smoke.ts',
  'controlled persisted worker dispatch runtime real-dispatch execution plan package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval-smoke.ts',
  'controlled persisted worker dispatch runtime real-dispatch execution approval package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-preflight'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-preflight-smoke.ts',
  'controlled persisted worker dispatch runtime real-dispatch execution preflight package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-smoke.ts',
  'controlled persisted worker dispatch runtime real-dispatch execution attempt result package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review-smoke.ts',
  'controlled persisted worker dispatch runtime real-dispatch execution attempt result review package script mismatch',
)
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-plan-smoke.ts',
  'controlled persisted worker dispatch runtime real-dispatch transport dependency enablement plan package script mismatch',
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
  'backend runtime persistence local harness port fix: ready, non-conflicting ports configured',
  'backend runtime persistence local harness validation retry: ready, blocked baseline result recorded',
  'backend runtime persistence local harness baseline migration fix: ready, ambiguity fixed in source',
  'backend runtime persistence local harness validation retry after baseline fix: ready, blocked result recorded',
  'backend runtime persistence current edit session baseline fix: ready, compatibility columns guarded',
  'backend runtime persistence local harness validation retry after current edit session fix: ready, blocked media-assets result recorded',
  '| Backend runtime persistence media assets status baseline fix | ready |',
  '| Backend runtime persistence local harness validation retry after media assets status fix | ready |',
  'Backend runtime persistence edit plan segments version baseline fix',
  'port `54322` is already allocated',
  '`55430`',
  '`55431`',
  '`55432`',
  '`55433`',
  '`55434`',
  '`202605130007_generation_providers_generated_assets.sql`',
  '`column reference "description" is ambiguous (SQLSTATE 42702)`',
  '`backendRuntimePersistenceLocalHarnessValidationResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationAttempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRequired=false`',
  '`backendRuntimePersistenceLocalHarnessStartAttempted=true`',
  '`backendRuntimePersistenceLocalHarnessPortConflictDetected=true`',
  '`backendRuntimePersistenceLocalHarnessPortFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessPortFixRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessNonConflictingPortsConfigured=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAttempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryPassed=false`',
  '`backendRuntimePersistenceLocalHarnessBaselineMigrationAttempted=true`',
  '`backendRuntimePersistenceLocalHarnessBaselineMigrationPassed=false`',
  '`backendRuntimePersistenceLocalHarnessBaselineMigrationFixRequired=false`',
  '`backendRuntimePersistenceBaselineMigrationFixRecorded=true`',
  '`activeBaselineMigrationEdited=true`',
  '`ambiguousDescriptionReferenceFixed=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterBaselineFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry2ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry2Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry2Passed=false`',
  '`backendRuntimePersistenceBaselineAmbiguousDescriptionFixVerified=true`',
  '`backendRuntimePersistenceCurrentEditSessionBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineCurrentEditSessionFixRecorded=true`',
  '`activeBaselineCurrentEditSessionMigrationEdited=true`',
  '`projectsCurrentEditSessionColumnGuarded=true`',
  '`workspaceCompatibilityColumnsGuarded=true`',
  '`projectCompatibilityColumnsGuarded=true`',
  '`chatMessageCompatibilityColumnsGuarded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterCurrentEditSessionFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry3ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry3Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry3Passed=false`',
  '`backendRuntimePersistenceCurrentEditSessionBaselineFixVerified=true`',
  '`backendRuntimePersistenceMediaAssetsStatusBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineMediaAssetsStatusFixRecorded=true`',
  '`activeBaselineMediaAssetsStatusMigrationEdited=true`',
  '`mediaAssetsStatusColumnGuarded=true`',
  '`mediaAssetsProcessingStatusBackfillGuarded=true`',
  '`mediaAssetsProjectStatusIndexUnblocked=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterMediaAssetsStatusFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry4ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry4Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry4Passed=false`',
  '`backendRuntimePersistenceMediaAssetsStatusBaselineFixVerified=true`',
  '`backendRuntimePersistenceEditPlanSegmentsVersionBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineEditPlanSegmentsVersionFixRecorded=true`',
  '`activeBaselineEditPlanSegmentsVersionMigrationEdited=true`',
  '`editPlanSegmentsVersionColumnGuarded=true`',
  '`editPlanSegmentsVersionBackfillSkipped=true`',
  '`editPlanSegmentsPlanOrderIndexUnblocked=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterEditPlanSegmentsVersionFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry5ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry5Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry5Passed=false`',
  '`backendRuntimePersistenceEditPlanSegmentsVersionBaselineFixVerified=true`',
  '`backendRuntimePersistenceCreditApprovalSnapshotsBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineCreditApprovalSnapshotsFixRecorded=true`',
  '`activeBaselineCreditApprovalSnapshotsMigrationEdited=true`',
  '`creditReservationsApprovedPlanSnapshotColumnGuarded=true`',
  '`creditLedgerEntriesApprovedPlanSnapshotColumnGuarded=true`',
  '`approvalRecordsApprovedSnapshotColumnGuarded=true`',
  '`approvedSnapshotReferenceBackfillSkipped=true`',
  '`creditApprovalSnapshotForeignKeysUnblocked=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterCreditApprovalSnapshotsFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry6ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry6Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry6Passed=false`',
  '`backendRuntimePersistenceCreditApprovalSnapshotsBaselineFixVerified=true`',
  '`backendRuntimePersistenceCreditEstimatesPlanVersionBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineCreditEstimatesPlanVersionFixRecorded=true`',
  '`activeBaselineCreditEstimatesPlanVersionMigrationEdited=true`',
  '`creditEstimatesEditPlanVersionColumnGuarded=true`',
  '`creditEstimatesEditPlanVersionForeignKeyGuarded=true`',
  '`creditEstimatesProjectPlanIndexUnblocked=true`',
  '`creditEstimatesPlanVersionBackfillSkipped=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterCreditEstimatesPlanVersionFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry7ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry7Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry7Passed=false`',
  '`backendRuntimePersistenceCreditEstimatesPlanVersionBaselineFixVerified=true`',
  '`backendRuntimePersistenceGenerationRequestsApprovedSnapshotBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineGenerationRequestsApprovedSnapshotFixRecorded=true`',
  '`activeBaselineGenerationAssetsJobsMigrationEdited=true`',
  '`generationRequestsApprovedPlanSnapshotColumnGuarded=true`',
  '`generationRequestsApprovedPlanSnapshotForeignKeyGuarded=true`',
  '`generationRequestsProjectSnapshotIndexUnblocked=true`',
  '`generationRequestsApprovedSnapshotBackfillSkipped=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterGenerationRequestsApprovedSnapshotFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry8ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry8Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry8Passed=false`',
  '`backendRuntimePersistenceGenerationRequestsApprovedSnapshotBaselineFixVerified=true`',
  '`backendRuntimePersistenceGeneratedAssetVersionsVersionBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineGeneratedAssetVersionsVersionFixRecorded=true`',
  '`generatedAssetVersionsVersionColumnGuarded=true`',
  '`generatedAssetVersionsVersionBackfillSkipped=true`',
  '`generatedAssetVersionsAssetVersionIndexUnblocked=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterGeneratedAssetVersionsVersionFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry9ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry9Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry9Passed=false`',
  '`backendRuntimePersistenceGeneratedAssetVersionsVersionBaselineFixVerified=true`',
  '`backendRuntimePersistenceQaCheckResultsCheckReservedColumnFixRequired=false`',
  '`backendRuntimePersistenceBaselineQaCheckResultsCheckColumnFixRecorded=true`',
  '`activeBaselineQaExportsAuditMigrationEdited=true`',
  '`qaCheckResultsCheckColumnQuoted=true`',
  '`qaCheckResultsCheckColumnRenameSkipped=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterQaCheckResultsCheckColumnFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry10ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry10Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry10Passed=false`',
  '`backendRuntimePersistenceQaCheckResultsCheckReservedColumnFixVerified=true`',
  '`backendRuntimePersistenceQaReportsApprovedPlanSnapshotFixRequired=false`',
  '`backendRuntimePersistenceBaselineQaReportsApprovedSnapshotFixRecorded=true`',
  '`qaReportsApprovedPlanSnapshotColumnGuarded=true`',
  '`qaReportsApprovedPlanSnapshotForeignKeyGuarded=true`',
  '`qaReportsProjectSnapshotIndexUnblocked=true`',
  '`qaReportsApprovedSnapshotBackfillSkipped=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterQaReportsApprovedSnapshotFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry11ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry11Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry11Passed=false`',
  '`backendRuntimePersistenceQaReportsApprovedSnapshotFixVerified=true`',
  '`backendRuntimePersistenceRlsFunctionParameterFixRequired=false`',
  '`backendRuntimePersistenceBaselineRlsFunctionParameterFixRecorded=true`',
  '`activeBaselineRlsPoliciesMigrationEdited=true`',
  '`isWorkspaceMemberParameterNamePreserved=true`',
  '`isWorkspaceOwnerOrAdminParameterNamePreserved=true`',
  '`workspaceUuidParameterRenameSkipped=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterRlsFunctionParameterFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry12ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry12Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry12Passed=false`',
  '`backendRuntimePersistenceRlsFunctionParameterFixVerified=true`',
  '`backendRuntimePersistenceStorageBucketsCommentBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineStorageBucketsCommentFixRecorded=true`',
  '`activeBaselineStorageBucketsPoliciesMigrationEdited=true`',
  '`storageBucketsTableCommentInsufficientPrivilegeGuarded=true`',
  '`storageBucketsTableCommentSkippedWhenNotOwner=true`',
  '`storageBucketPolicySemanticsChanged=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterStorageBucketsCommentFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry13ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry13Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry13Passed=false`',
  '`backendRuntimePersistenceStorageBucketsCommentFixVerified=true`',
  '`backendRuntimePersistenceStorageObjectsPolicyCommentBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineStorageObjectsPolicyCommentFixRecorded=true`',
  '`storageObjectsPolicyCommentInsufficientPrivilegeGuarded=true`',
  '`storageObjectsPolicyCommentsSkippedWhenNotOwner=true`',
  '`storageObjectPolicySemanticsChanged=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterStorageObjectsPolicyCommentFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry14ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry14Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry14Passed=false`',
  '`backendRuntimePersistenceStorageObjectsPolicyCommentFixVerified=true`',
  '`backendRuntimePersistenceStorageUploadPipelinePolicyCommentBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineStorageUploadPipelinePolicyCommentFixRecorded=true`',
  '`activeBaselineStorageUploadPipelineReadinessMigrationEdited=true`',
  '`storageUploadPipelinePolicyCommentInsufficientPrivilegeGuarded=true`',
  '`storageUploadPipelinePolicyCommentsSkippedWhenNotOwner=true`',
  '`storageUploadPipelinePolicySemanticsChanged=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterStorageUploadPipelinePolicyCommentFixRequired=false`',
  '`insufficient_privilege`',
  'retry 13',
  'retry 14',
  '`202605200001_storage_upload_pipeline_readiness.sql`',
  '`202605180006_reeditpro_qa_exports_audit.sql`',
  '`202605180007_reeditpro_rls_policies.sql`',
  '`202605180008_reeditpro_storage_buckets_policies.sql`',
  '`public.is_workspace_member(uuid)`',
  '`target_workspace_id`',
  '`workspace_uuid`',
  '`storage.buckets`',
  '`storage.objects`',
  '`must be owner of table buckets (SQLSTATE 42501)`',
  '`comment on policy "reeditpro_project_members_read_workspace_project_objects" on storage.objects`',
  '`must be owner of relation objects (SQLSTATE 42501)`',
  '`comment on policy "reeditpro_project_members_read_project_objects" on storage.objects`',
  '`qa_check_results.check`',
  '`"check" text`',
  '`syntax error at or near "text" (SQLSTATE 42601)`',
  '`qwenDraftSqlApplied=true`',
  '`qwenLocalSqlTestsExecuted=true`',
  '`qwenLocalSqlTestsPassed=true`',
  '`localHarnessSqlExecuted=true`',
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
  '`backendRuntimePersistenceLocalHarnessPortFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessPortFixRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessNonConflictingPortsConfigured=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessBaselineMigrationFixRequired=false`',
  '`backendRuntimePersistenceBaselineMigrationFixRecorded=true`',
  '`ambiguousDescriptionReferenceFixed=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterBaselineFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry2ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry2Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry2Passed=false`',
  '`backendRuntimePersistenceBaselineAmbiguousDescriptionFixVerified=true`',
  '`backendRuntimePersistenceCurrentEditSessionBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineCurrentEditSessionFixRecorded=true`',
  '`activeBaselineCurrentEditSessionMigrationEdited=true`',
  '`projectsCurrentEditSessionColumnGuarded=true`',
  '`workspaceCompatibilityColumnsGuarded=true`',
  '`projectCompatibilityColumnsGuarded=true`',
  '`chatMessageCompatibilityColumnsGuarded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterCurrentEditSessionFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry3ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry3Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry3Passed=false`',
  '`backendRuntimePersistenceCurrentEditSessionBaselineFixVerified=true`',
  '`backendRuntimePersistenceMediaAssetsStatusBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineMediaAssetsStatusFixRecorded=true`',
  '`activeBaselineMediaAssetsStatusMigrationEdited=true`',
  '`mediaAssetsStatusColumnGuarded=true`',
  '`mediaAssetsProcessingStatusBackfillGuarded=true`',
  '`mediaAssetsProjectStatusIndexUnblocked=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterMediaAssetsStatusFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry4ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry4Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry4Passed=false`',
  '`backendRuntimePersistenceMediaAssetsStatusBaselineFixVerified=true`',
  '`backendRuntimePersistenceEditPlanSegmentsVersionBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineEditPlanSegmentsVersionFixRecorded=true`',
  '`editPlanSegmentsVersionColumnGuarded=true`',
  '`editPlanSegmentsVersionBackfillSkipped=true`',
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
  '`backendRuntimePersistenceLocalHarnessValidationRetry2ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry2Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry2Passed=false`',
  '`backendRuntimePersistenceBaselineAmbiguousDescriptionFixVerified=true`',
  '`backendRuntimePersistenceCurrentEditSessionBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineCurrentEditSessionFixRecorded=true`',
  '`activeBaselineCurrentEditSessionMigrationEdited=true`',
  '`projectsCurrentEditSessionColumnGuarded=true`',
  '`workspaceCompatibilityColumnsGuarded=true`',
  '`projectCompatibilityColumnsGuarded=true`',
  '`chatMessageCompatibilityColumnsGuarded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterCurrentEditSessionFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry3ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry3Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry3Passed=false`',
  '`backendRuntimePersistenceCurrentEditSessionBaselineFixVerified=true`',
  '`backendRuntimePersistenceMediaAssetsStatusBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineMediaAssetsStatusFixRecorded=true`',
  '`activeBaselineMediaAssetsStatusMigrationEdited=true`',
  '`mediaAssetsStatusColumnGuarded=true`',
  '`mediaAssetsProcessingStatusBackfillGuarded=true`',
  '`mediaAssetsProjectStatusIndexUnblocked=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterMediaAssetsStatusFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry4ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry4Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry4Passed=false`',
  '`backendRuntimePersistenceMediaAssetsStatusBaselineFixVerified=true`',
  '`backendRuntimePersistenceEditPlanSegmentsVersionBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineEditPlanSegmentsVersionFixRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterEditPlanSegmentsVersionFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry5ResultRecorded=true`',
  '`backendRuntimePersistenceCreditApprovalSnapshotsBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineCreditApprovalSnapshotsFixRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterCreditApprovalSnapshotsFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry6ResultRecorded=true`',
  '`backendRuntimePersistenceCreditEstimatesPlanVersionBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineCreditEstimatesPlanVersionFixRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterCreditEstimatesPlanVersionFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry7ResultRecorded=true`',
  '`backendRuntimePersistenceGenerationRequestsApprovedSnapshotBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineGenerationRequestsApprovedSnapshotFixRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterGenerationRequestsApprovedSnapshotFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry8ResultRecorded=true`',
  '`backendRuntimePersistenceGeneratedAssetVersionsVersionBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineGeneratedAssetVersionsVersionFixRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterGeneratedAssetVersionsVersionFixRequired=false`',
  '`backendRuntimePersistenceQaCheckResultsCheckReservedColumnFixRequired=false`',
  '`backendRuntimePersistenceBaselineQaCheckResultsCheckColumnFixRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterQaCheckResultsCheckColumnFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry10ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry10Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry10Passed=false`',
  '`backendRuntimePersistenceQaCheckResultsCheckReservedColumnFixVerified=true`',
  '`backendRuntimePersistenceQaReportsApprovedPlanSnapshotFixRequired=false`',
  '`backendRuntimePersistenceBaselineQaReportsApprovedSnapshotFixRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterQaReportsApprovedSnapshotFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry11ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry11Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry11Passed=false`',
  '`backendRuntimePersistenceQaReportsApprovedSnapshotFixVerified=true`',
  '`backendRuntimePersistenceRlsFunctionParameterFixRequired=false`',
  '`backendRuntimePersistenceBaselineRlsFunctionParameterFixRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterRlsFunctionParameterFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry12ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry12Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry12Passed=false`',
  '`backendRuntimePersistenceRlsFunctionParameterFixVerified=true`',
  '`backendRuntimePersistenceStorageBucketsCommentBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineStorageBucketsCommentFixRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterStorageBucketsCommentFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry13ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry13Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry13Passed=false`',
  '`backendRuntimePersistenceStorageBucketsCommentFixVerified=true`',
  '`backendRuntimePersistenceStorageObjectsPolicyCommentBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineStorageObjectsPolicyCommentFixRecorded=true`',
  '`storageObjectsPolicyCommentInsufficientPrivilegeGuarded=true`',
  '`storageObjectsPolicyCommentsSkippedWhenNotOwner=true`',
  '`storageObjectPolicySemanticsChanged=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterStorageObjectsPolicyCommentFixRequired=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry14ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry14Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry14Passed=false`',
  '`backendRuntimePersistenceStorageObjectsPolicyCommentFixVerified=true`',
  '`backendRuntimePersistenceStorageUploadPipelinePolicyCommentBaselineFixRequired=false`',
  '`backendRuntimePersistenceBaselineStorageUploadPipelinePolicyCommentFixRecorded=true`',
  '`activeBaselineStorageUploadPipelineReadinessMigrationEdited=true`',
  '`storageUploadPipelinePolicyCommentInsufficientPrivilegeGuarded=true`',
  '`storageUploadPipelinePolicyCommentsSkippedWhenNotOwner=true`',
  '`storageUploadPipelinePolicySemanticsChanged=false`',
  '`backendRuntimePersistenceLocalHarnessValidationRetryAfterStorageUploadPipelinePolicyCommentFixRequired=false`',
  '`structuredFixtureOutputSchemaValid=true`',
  '`structuredFixtureOutputParsedJson=true`',
  '`structuredFixtureOutputRawOutputStoredInRepo=false`',
  '`202605180001_reeditpro_core_workspace_projects.sql`',
  '`projects.current_edit_session_id`',
  '`202605180002_reeditpro_media_source_sequence.sql`',
  '`media_assets.status`',
  '`202605180003_reeditpro_intent_plan_versions.sql`',
  '`edit_plan_segments.edit_plan_version_id`',
  '`idx_edit_plan_segments_plan_order`',
  '`edit_plan_versions`',
  '`202605180004_reeditpro_credits_approval_snapshots.sql`',
  '`credit_reservations.approved_plan_snapshot_id`',
  '`credit_ledger_entries.approved_plan_snapshot_id`',
  '`approval_records.approved_snapshot_id`',
  '`idx_credit_estimates_project_plan`',
  '`credit_estimates.edit_plan_version_id`',
  '`202605180005_reeditpro_generation_assets_jobs.sql`',
  '`idx_generation_requests_project_snapshot`',
  '`generation_requests.approved_plan_snapshot_id`',
  '`idx_generated_asset_versions_asset_version`',
  '`generated_asset_versions.version`',
  '`generated_asset_versions.version_number`',
  '`qa_check_results.check`',
  '`"check" text`',
  '`idx_qa_reports_project_snapshot`',
  '`qa_reports.approved_plan_snapshot_id`',
  '`202605180007_reeditpro_rls_policies.sql`',
  '`public.is_workspace_member(uuid)`',
  '`target_workspace_id`',
  '`workspace_uuid`',
  '`cannot change name of input parameter "target_workspace_id" (SQLSTATE 42P13)`',
  '`202605180008_reeditpro_storage_buckets_policies.sql`',
  '`storage.buckets`',
  '`must be owner of table buckets (SQLSTATE 42501)`',
  'credit approval snapshots baseline fix is recorded',
  'credit estimates plan version baseline fix is recorded',
  'generated asset versions version baseline fix is recorded',
  'Backend runtime persistence local harness validation retry 6 verifies',
  'Backend runtime persistence local harness validation retry 7 verifies',
  'Backend runtime persistence local harness validation retry 8 verifies',
  'backend runtime persistence active migration plan: ready, plan recorded',
  'backend runtime persistence active migration creation: ready, active migration file created',
  'backend runtime persistence active migration validation: ready, active migration applies locally and Qwen SQL tests pass',
  'backend runtime persistence active migration deploy plan: ready, plan recorded',
  'backend runtime persistence active migration deploy approval: ready, target-class approval recorded',
  'backend runtime persistence active migration deploy execution: ready, remote satisfaction/no-deploy review accepted',
  'persisted worker dispatch readiness review: ready, contract accepted for controlled smoke planning',
  'controlled persisted worker dispatch smoke plan: ready, smoke plan recorded',
  'controlled persisted worker dispatch smoke execution: ready, mock-only smoke executed',
  'controlled persisted worker dispatch smoke result review: ready, result review accepted',
  'controlled persisted worker dispatch runtime plan: ready, runtime plan recorded',
  'controlled persisted worker dispatch runtime implementation: ready, fail-closed runtime implemented',
  'controlled persisted worker dispatch runtime smoke plan: ready, smoke plan recorded',
  'controlled persisted worker dispatch runtime smoke execution: ready, mock-only runtime smoke executed',
  '`backendRuntimePersistenceActiveMigrationPlanRequired=false`',
  '`backendRuntimePersistenceActiveMigrationPlanRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationCreateRequired=false`',
  '`qwenActiveMigrationCreated=true`',
  '`backendRuntimePersistenceActiveMigrationValidationRequired=false`',
  '`backendRuntimePersistenceActiveMigrationValidationResultRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationValidationAttempted=true`',
  '`backendRuntimePersistenceActiveMigrationValidated=true`',
  '`backendRuntimePersistenceActiveMigrationApplied=true`',
  '`backendRuntimePersistenceActiveMigrationHistoryObserved=true`',
  '`backendRuntimePersistenceActiveMigrationDeployPlanRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationDeployApprovalRequired=false`',
  '`backendRuntimePersistenceActiveMigrationDeployApprovalRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationDeploymentTargetApproved=true`',
  '`backendRuntimePersistenceActiveMigrationDeployExecutionRequired=false`',
  '`backendRuntimePersistenceActiveMigrationDeployExecutionPreflightRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationDeployCommandRun=false`',
  '`backendRuntimePersistenceActiveMigrationHistoryReconciliationRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationReadOnlySqlMetadataQueryExecuted=true`',
  '`backendRuntimePersistenceActiveMigrationRemoteSchemaEquivalentForRequiredGuards=true`',
  '`backendRuntimePersistenceActiveMigrationHistoryAdoptionRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationAdoptedRemoteVersion=20260628000100`',
  '`backendRuntimePersistenceActiveMigrationAdoptedFilePresent=true`',
  '`backendRuntimePersistenceActiveMigrationSupersededLocalVersionRemoved=true`',
  '`backendRuntimePersistenceActiveMigrationAdoptedLocalValidationRequired=false`',
  '`backendRuntimePersistenceActiveMigrationAdoptedLocalValidationResultRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationAdoptedLocalValidationAttempted=true`',
  '`backendRuntimePersistenceActiveMigrationAdoptedLocalValidationPassed=true`',
  '`backendRuntimePersistenceActiveMigrationAdoptedHistoryObserved=true`',
  '`backendRuntimePersistenceActiveMigrationAdoptedHistoryVersion=20260628000100`',
  '`backendRuntimePersistenceActiveMigrationSupersededHistoryObserved=false`',
  '`backendRuntimePersistenceActiveMigrationRemoteSatisfactionReviewRequired=false`',
  '`backendRuntimePersistenceActiveMigrationRemoteSatisfactionReviewRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationRemoteSatisfied=true`',
  '`backendRuntimePersistenceActiveMigrationNoDeployAccepted=true`',
  '`backendRuntimePersistenceActiveMigrationDeployCommandRequiredNow=false`',
  '`persistedWorkerDispatchReadinessReviewRequired=false`',
  '`runtimePersistenceToWorkerDispatchReadinessReviewRecorded=true`',
  '`persistedWorkerDispatchReadinessAcceptedForControlledSmokePlanning=true`',
  '`controlledPersistedWorkerDispatchSmokePlanRequired=false`',
  '`controlledPersistedWorkerDispatchSmokePlanRecorded=true`',
  '`controlledPersistedWorkerDispatchSmokeExecutionRequired=false`',
  '`controlledPersistedWorkerDispatchSmokeExecuted=true`',
  '`controlledPersistedWorkerDispatchSmokePassed=true`',
  '`controlledPersistedWorkerDispatchSmokeResultReviewRequired=false`',
  '`controlledPersistedWorkerDispatchSmokeResultReviewRecorded=true`',
  '`controlledPersistedWorkerDispatchSmokeResultReviewAccepted=true`',
  '`controlledPersistedWorkerDispatchRuntimePlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimePlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeImplementationRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeImplemented=true`',
  '`controlledPersistedWorkerDispatchRuntimeSmokePlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeSmokePlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeSmokeExecutionRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeSmokeExecuted=true`',
  '`controlledPersistedWorkerDispatchRuntimeSmokePassed=true`',
  'controlled persisted worker dispatch runtime smoke result review: ready, result review accepted',
  'controlled persisted worker dispatch runtime approval plan: ready, approval plan recorded',
  'controlled persisted worker dispatch runtime approval decision: ready, decision accepted for future execution planning',
  'controlled persisted worker dispatch runtime execution plan: ready, execution plan recorded',
  'controlled persisted worker dispatch runtime execution approval: ready, execution approval recorded',
  'controlled persisted worker dispatch runtime execution preflight: ready, preflight passed',
  'controlled persisted worker dispatch runtime execution attempt result',
  'controlled persisted worker dispatch runtime execution attempt result review: ready, result review accepted',
  '`controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeSmokeResultReviewAccepted=true`',
  '`controlledPersistedWorkerDispatchRuntimeApprovalPlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeApprovalPlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeApprovalDecisionRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeApprovalDecisionRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeApprovalDecisionAcceptedForExecutionPlanning=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionPlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionPlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionApprovalRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionApprovalRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionApprovalAcceptedForPreflight=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionPreflightRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionPreflightRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionPreflightPassed=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionAttemptRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionAttemptRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionAttemptPassedFailClosed=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewAccepted=true`',
  'controlled persisted worker dispatch runtime real-dispatch approval plan: ready, approval plan recorded',
  'controlled persisted worker dispatch runtime real-dispatch approval decision: ready, decision accepted for execution planning',
  'controlled persisted worker dispatch runtime real-dispatch execution plan: ready, execution plan recorded',
  'controlled persisted worker dispatch runtime real-dispatch execution approval: ready, execution approval recorded',
  'controlled persisted worker dispatch runtime real-dispatch execution preflight: ready, preflight passed',
  'controlled persisted worker dispatch runtime real-dispatch execution attempt: ready, attempt recorded',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionAcceptedForExecutionPlanning=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalAcceptedForPreflight=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightPassed=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptPassedFailClosed=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewAccepted=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalRequired=true`',
  'controlled persisted worker dispatch runtime real-dispatch execution attempt: ready, attempt recorded',
  'controlled persisted worker dispatch runtime real-dispatch execution attempt result review: ready, result review accepted',
  'controlled persisted worker dispatch runtime real-dispatch transport dependency enablement plan: ready, plan recorded',
  'controlled persisted worker dispatch runtime real-dispatch transport dependency enablement approval: blocked, approval required',
  '`approvedSnapshotFixtureScopePlanned=true`',
  '`creditReservationNoSpendPreconditionPlanned=true`',
  '`serviceRoleJobLeaseClaimScopePlanned=true`',
  '`idempotencyDuplicateSourceGuardPlanned=true`',
  '`privateInvokeTransportExecutionConditionsPlanned=true`',
  '`qwenRequestResponseSchemaPlanned=true`',
  '`resultPersistenceWithoutGeneratedAssetsPlanned=true`',
  '`qaAuditCostObservabilityPlanned=true`',
  '`rollbackCleanupCreditReleasePlanned=true`',
  '`betaProductionPublicArtifactLockPlanned=true`',
  '`controlledPersistedWorkerDispatchRuntimeApprovedFixtureDefaultAttemptBlocked=true`',
  '`controlledPersistedWorkerDispatchRuntimeApprovedFixtureAdapterPreviewBlocked=true`',
  '`controlledPersistedWorkerDispatchRuntimeApprovedFixtureTransportPreviewBlocked=true`',
  '`approvedSnapshotApprovalPlanned=true`',
  '`creditReservationApprovalPlanned=true`',
  '`privateSourceOfTruthRefsApprovalPlanned=true`',
  '`serviceRoleLeaseClaimApprovalPlanned=true`',
  '`idempotencyApprovalPlanned=true`',
  '`privateInvokeTransportApprovalPlanned=true`',
  '`qaAuditCostCreditApprovalPlanned=true`',
  '`rollbackFailClosedApprovalPlanned=true`',
  '`mockQueueFixtureValidated=true`',
  '`mockCoordinatorDefaultPathExecuted=true`',
  '`mockCoordinatorAdapterPreviewPathExecuted=true`',
  '`mockCoordinatorTransportPreviewPathExecuted=true`',
  '`mockJobRecordCreated=true`',
  '`mockIdempotencyRecordCreated=true`',
  '`mockWorkerLeaseClaimed=true`',
  '`mockWorkerClaimAttemptCreated=true`',
  '`mockJobEventCreated=true`',
  '`mockBackendRuntimeMessageCreated=true`',
  '`mockRecordsStoredInMemoryOnly=true`',
  '`backendRuntimePersistenceActiveMigrationDeployShouldBeSkippedNow=true`',
  '`backendRuntimePersistenceActiveMigrationRemoteQwenMigrationObserved=true`',
  '`backendRuntimePersistenceActiveMigrationRemoteQwenVersion=20260628000100`',
  '`backendRuntimePersistenceActiveMigrationLocalValidatedVersion=20260628000100`',
  '`backendRuntimePersistenceActiveMigrationDeployed=false`',
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
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessPortFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_PORT_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetryResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineMigrationFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_MIGRATION_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry2ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_2_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineCurrentEditSessionFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CURRENT_EDIT_SESSION_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry3ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_3_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineMediaAssetsStatusFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_MEDIA_ASSETS_STATUS_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry4ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_4_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineEditPlanSegmentsVersionFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_EDIT_PLAN_SEGMENTS_VERSION_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry5ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_5_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineCreditApprovalSnapshotsFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CREDIT_APPROVAL_SNAPSHOTS_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry6ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_6_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineCreditEstimatesPlanVersionFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CREDIT_ESTIMATES_PLAN_VERSION_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry7ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_7_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineGenerationRequestsApprovedSnapshotFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_GENERATION_REQUESTS_APPROVED_SNAPSHOT_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry8ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_8_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineGeneratedAssetVersionsVersionFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_GENERATED_ASSET_VERSIONS_VERSION_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry9ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_9_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineQaCheckResultsCheckColumnFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_QA_CHECK_RESULTS_CHECK_COLUMN_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry10ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_10_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineQaReportsApprovedSnapshotFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_QA_REPORTS_APPROVED_SNAPSHOT_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry11ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_11_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineRlsFunctionParameterFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_RLS_FUNCTION_PARAMETER_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry12ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_12_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineStorageBucketsCommentFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_BUCKETS_COMMENT_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry13ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_13_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineStorageObjectsPolicyCommentFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_OBJECTS_POLICY_COMMENT_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry14ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_14_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceBaselineStorageUploadPipelinePolicyCommentFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_UPLOAD_PIPELINE_POLICY_COMMENT_FIX.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry15Decision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceLocalHarnessValidationResultReviewDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT_REVIEW.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceActiveMigrationPlanDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_PLAN.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceActiveMigrationCreateDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_CREATE.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceActiveMigrationValidationResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_VALIDATION_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceActiveMigrationDeployPlanDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_PLAN.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceActiveMigrationDeployApprovalDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_APPROVAL.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceActiveMigrationDeployExecuteResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_EXECUTE_RESULT.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceActiveMigrationHistoryReconciliationDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_RECONCILIATION.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceActiveMigrationHistoryAdoptionDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_ADOPTION.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceActiveMigrationAdoptedLocalValidationDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_ADOPTED_LOCAL_VALIDATION.decision,
)
assert.equal(
  rollup.upstreamBackendRuntimePersistenceActiveMigrationRemoteSatisfactionReviewDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_REMOTE_SATISFACTION_REVIEW.decision,
)
assert.equal(
  rollup.upstreamRuntimePersistenceToWorkerDispatchReadinessReviewDecision,
  QWEN2_5_VL_RUNTIME_PERSISTENCE_TO_WORKER_DISPATCH_READINESS_REVIEW.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchSmokePlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_PLAN.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchSmokeExecutionDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_EXECUTION_RESULT.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchSmokeResultReviewDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_RESULT_REVIEW.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimePlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_PLAN.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeImplementationDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_IMPLEMENTATION.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeSmokePlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeSmokeExecutionDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_EXECUTION_RESULT.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeSmokeResultReviewDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_RESULT_REVIEW.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeApprovalPlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_APPROVAL_PLAN.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeApprovalDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_APPROVAL_DECISION.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeExecutionPlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PLAN.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeExecutionApprovalDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_APPROVAL.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeExecutionPreflightDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PREFLIGHT.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeExecutionAttemptResultDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT_REVIEW.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_PLAN.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_DECISION.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_PLAN.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_APPROVAL.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_PREFLIGHT.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT_REVIEW.decision,
)
assert.equal(
  rollup.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_PLAN.decision,
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
assert.equal(
  ui.privateInvokeClient.currentStatus,
  'controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_approval_required',
)
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
  'backend_runtime_persistence_local_harness_validation_retry',
  'backend_runtime_persistence_local_harness_baseline_migration_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_baseline_fix',
  'backend_runtime_persistence_current_edit_session_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_current_edit_session_fix',
  'backend_runtime_persistence_media_assets_status_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_media_assets_status_fix',
  'backend_runtime_persistence_edit_plan_segments_version_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_edit_plan_segments_version_fix',
  'backend_runtime_persistence_credit_approval_snapshots_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_credit_approval_snapshots_fix',
  'backend_runtime_persistence_credit_estimates_plan_version_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_credit_estimates_plan_version_fix',
  'backend_runtime_persistence_generation_requests_approved_snapshot_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_generation_requests_approved_snapshot_fix',
  'backend_runtime_persistence_generated_asset_versions_version_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_generated_asset_versions_version_fix',
  'backend_runtime_persistence_qa_check_results_check_reserved_column_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_qa_check_results_check_column_fix',
  'backend_runtime_persistence_qa_reports_approved_plan_snapshot_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_qa_reports_approved_snapshot_fix',
  'backend_runtime_persistence_rls_function_parameter_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_rls_function_parameter_fix',
  'backend_runtime_persistence_storage_buckets_comment_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_storage_buckets_comment_fix',
  'backend_runtime_persistence_storage_objects_policy_comment_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_storage_objects_policy_comment_fix',
  'backend_runtime_persistence_storage_upload_pipeline_policy_comment_baseline_fix',
  'backend_runtime_persistence_local_harness_validation_retry_after_storage_upload_pipeline_policy_comment_fix',
  'backend_runtime_persistence_local_harness_validation_result_review',
  'backend_runtime_persistence_active_migration_plan',
  'backend_runtime_persistence_active_migration_create',
  'backend_runtime_persistence_active_migration_validation',
  'backend_runtime_persistence_active_migration_deploy_plan',
  'backend_runtime_persistence_active_migration_deploy_approval',
  'backend_runtime_persistence_active_migration_deploy_execution',
  'persisted_worker_dispatch_readiness_review',
  'controlled_persisted_worker_dispatch_smoke_plan',
  'controlled_persisted_worker_dispatch_smoke_execution',
  'controlled_persisted_worker_dispatch_smoke_result_review',
  'controlled_persisted_worker_dispatch_runtime_plan',
  'controlled_persisted_worker_dispatch_runtime_implementation',
  'controlled_persisted_worker_dispatch_runtime_smoke_plan',
  'controlled_persisted_worker_dispatch_runtime_smoke_execution',
  'controlled_persisted_worker_dispatch_runtime_smoke_result_review',
  'controlled_persisted_worker_dispatch_runtime_approval_plan',
  'controlled_persisted_worker_dispatch_runtime_approval_decision',
  'controlled_persisted_worker_dispatch_runtime_execution_plan',
  'controlled_persisted_worker_dispatch_runtime_execution_approval',
  'controlled_persisted_worker_dispatch_runtime_execution_preflight',
  'controlled_persisted_worker_dispatch_runtime_execution_attempt',
  'controlled_persisted_worker_dispatch_runtime_execution_attempt_result_review',
  'controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_plan',
  'controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_decision',
  'controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_plan',
  'controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_approval',
  'controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_preflight',
  'controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_attempt',
  'controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_attempt_result_review',
  'controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_plan',
  'controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_approval',
])
assert.equal(rollup.readinessGates.filter((gate) => gate.status === 'ready').length, 92)
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
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_baseline_migration_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_current_edit_session_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_current_edit_session_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_media_assets_status_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_media_assets_status_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_edit_plan_segments_version_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_edit_plan_segments_version_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_credit_approval_snapshots_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_credit_approval_snapshots_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_credit_estimates_plan_version_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_credit_estimates_plan_version_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_generation_requests_approved_snapshot_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_generation_requests_approved_snapshot_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_generated_asset_versions_version_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_generated_asset_versions_version_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_qa_check_results_check_reserved_column_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_qa_check_results_check_column_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_qa_reports_approved_plan_snapshot_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_qa_reports_approved_snapshot_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_rls_function_parameter_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_rls_function_parameter_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_storage_buckets_comment_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_storage_buckets_comment_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_storage_objects_policy_comment_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_storage_objects_policy_comment_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_storage_upload_pipeline_policy_comment_baseline_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_retry_after_storage_upload_pipeline_policy_comment_fix_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_local_harness_validation_result_review_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_active_migration_plan_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_active_migration_create_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_active_migration_validation_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_active_migration_deploy_plan_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_active_migration_deploy_approval_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter((gate) => String(gate.status) === 'blocked_backend_runtime_persistence_active_migration_deploy_execution_required').length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) =>
      String(gate.status) ===
      'blocked_backend_runtime_persistence_active_migration_remote_satisfaction_review_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_persisted_worker_dispatch_readiness_review_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_smoke_plan_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_smoke_execution_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_smoke_result_review_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_runtime_plan_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_runtime_implementation_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_runtime_smoke_plan_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_runtime_smoke_execution_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_runtime_smoke_result_review_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_runtime_approval_plan_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_runtime_approval_decision_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_runtime_execution_plan_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_runtime_execution_approval_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_runtime_execution_preflight_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) === 'blocked_controlled_persisted_worker_dispatch_runtime_execution_attempt_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) ===
      'blocked_controlled_persisted_worker_dispatch_runtime_execution_attempt_result_review_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) ===
      'blocked_controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_plan_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) ===
      'blocked_controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_decision_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) ===
      'blocked_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_plan_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) ===
      'blocked_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_approval_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) ===
      'blocked_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_preflight_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) ===
      'blocked_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_attempt_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) ===
      'blocked_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_attempt_result_review_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) ===
      'blocked_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_plan_required',
  ).length,
  0,
)
assert.equal(
  rollup.readinessGates.filter(
    (gate) => String(gate.status) ===
      'blocked_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_approval_required',
  ).length,
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
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessPortFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessPortFixRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessNonConflictingPortsConfigured, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAttempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryPassed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessBaselineMigrationAttempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessBaselineMigrationPassed, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessBaselineMigrationFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineMigrationFixRecorded, true)
assert.equal(rollup.runtimeFlags.activeBaselineMigrationEdited, true)
assert.equal(rollup.runtimeFlags.ambiguousDescriptionReferenceFixed, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterBaselineFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry2ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry2Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry2Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineAmbiguousDescriptionFixVerified, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceCurrentEditSessionBaselineFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineCurrentEditSessionFixRecorded, true)
assert.equal(rollup.runtimeFlags.activeBaselineCurrentEditSessionMigrationEdited, true)
assert.equal(rollup.runtimeFlags.projectsCurrentEditSessionColumnGuarded, true)
assert.equal(rollup.runtimeFlags.workspaceCompatibilityColumnsGuarded, true)
assert.equal(rollup.runtimeFlags.projectCompatibilityColumnsGuarded, true)
assert.equal(rollup.runtimeFlags.chatMessageCompatibilityColumnsGuarded, true)
assert.equal(
  rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterCurrentEditSessionFixRequired,
  false,
)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry3ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry3Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry3Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceCurrentEditSessionBaselineFixVerified, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceMediaAssetsStatusBaselineFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineMediaAssetsStatusFixRecorded, true)
assert.equal(rollup.runtimeFlags.activeBaselineMediaAssetsStatusMigrationEdited, true)
assert.equal(rollup.runtimeFlags.mediaAssetsStatusColumnGuarded, true)
assert.equal(rollup.runtimeFlags.mediaAssetsProcessingStatusBackfillGuarded, true)
assert.equal(rollup.runtimeFlags.mediaAssetsProjectStatusIndexUnblocked, true)
assert.equal(
  rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterMediaAssetsStatusFixRequired,
  false,
)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry4ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry4Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry4Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceMediaAssetsStatusBaselineFixVerified, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceEditPlanSegmentsVersionBaselineFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineEditPlanSegmentsVersionFixRecorded, true)
assert.equal(rollup.runtimeFlags.activeBaselineEditPlanSegmentsVersionMigrationEdited, true)
assert.equal(rollup.runtimeFlags.editPlanSegmentsVersionColumnGuarded, true)
assert.equal(rollup.runtimeFlags.editPlanSegmentsVersionBackfillSkipped, true)
assert.equal(rollup.runtimeFlags.editPlanSegmentsPlanOrderIndexUnblocked, true)
assert.equal(
  rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterEditPlanSegmentsVersionFixRequired,
  false,
)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry5ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry5Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry5Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceEditPlanSegmentsVersionBaselineFixVerified, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceCreditApprovalSnapshotsBaselineFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineCreditApprovalSnapshotsFixRecorded, true)
assert.equal(rollup.runtimeFlags.activeBaselineCreditApprovalSnapshotsMigrationEdited, true)
assert.equal(rollup.runtimeFlags.creditReservationsApprovedPlanSnapshotColumnGuarded, true)
assert.equal(rollup.runtimeFlags.creditLedgerEntriesApprovedPlanSnapshotColumnGuarded, true)
assert.equal(rollup.runtimeFlags.approvalRecordsApprovedSnapshotColumnGuarded, true)
assert.equal(rollup.runtimeFlags.approvedSnapshotReferenceBackfillSkipped, true)
assert.equal(rollup.runtimeFlags.creditApprovalSnapshotForeignKeysUnblocked, true)
assert.equal(
  rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterCreditApprovalSnapshotsFixRequired,
  false,
)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry6ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry6Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry6Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceCreditApprovalSnapshotsBaselineFixVerified, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceCreditEstimatesPlanVersionBaselineFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineCreditEstimatesPlanVersionFixRecorded, true)
assert.equal(rollup.runtimeFlags.activeBaselineCreditEstimatesPlanVersionMigrationEdited, true)
assert.equal(rollup.runtimeFlags.creditEstimatesEditPlanVersionColumnGuarded, true)
assert.equal(rollup.runtimeFlags.creditEstimatesEditPlanVersionForeignKeyGuarded, true)
assert.equal(rollup.runtimeFlags.creditEstimatesProjectPlanIndexUnblocked, true)
assert.equal(rollup.runtimeFlags.creditEstimatesPlanVersionBackfillSkipped, true)
assert.equal(
  rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterCreditEstimatesPlanVersionFixRequired,
  false,
)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry7ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry7Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry7Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceCreditEstimatesPlanVersionBaselineFixVerified, true)
assert.equal(
  rollup.runtimeFlags.backendRuntimePersistenceGenerationRequestsApprovedSnapshotBaselineFixRequired,
  false,
)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineGenerationRequestsApprovedSnapshotFixRecorded, true)
assert.equal(rollup.runtimeFlags.activeBaselineGenerationAssetsJobsMigrationEdited, true)
assert.equal(rollup.runtimeFlags.generationRequestsApprovedPlanSnapshotColumnGuarded, true)
assert.equal(rollup.runtimeFlags.generationRequestsApprovedPlanSnapshotForeignKeyGuarded, true)
assert.equal(rollup.runtimeFlags.generationRequestsProjectSnapshotIndexUnblocked, true)
assert.equal(rollup.runtimeFlags.generationRequestsApprovedSnapshotBackfillSkipped, true)
assert.equal(
  rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterGenerationRequestsApprovedSnapshotFixRequired,
  false,
)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry8ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry8Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry8Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceGenerationRequestsApprovedSnapshotBaselineFixVerified, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceGeneratedAssetVersionsVersionBaselineFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineGeneratedAssetVersionsVersionFixRecorded, true)
assert.equal(rollup.runtimeFlags.generatedAssetVersionsVersionColumnGuarded, true)
assert.equal(rollup.runtimeFlags.generatedAssetVersionsVersionBackfillSkipped, true)
assert.equal(rollup.runtimeFlags.generatedAssetVersionsAssetVersionIndexUnblocked, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterGeneratedAssetVersionsVersionFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry9ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry9Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry9Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceGeneratedAssetVersionsVersionBaselineFixVerified, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceQaCheckResultsCheckReservedColumnFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineQaCheckResultsCheckColumnFixRecorded, true)
assert.equal(rollup.runtimeFlags.activeBaselineQaExportsAuditMigrationEdited, true)
assert.equal(rollup.runtimeFlags.qaCheckResultsCheckColumnQuoted, true)
assert.equal(rollup.runtimeFlags.qaCheckResultsCheckColumnRenameSkipped, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterQaCheckResultsCheckColumnFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry10ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry10Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry10Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceQaCheckResultsCheckReservedColumnFixVerified, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceQaReportsApprovedPlanSnapshotFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineQaReportsApprovedSnapshotFixRecorded, true)
assert.equal(rollup.runtimeFlags.qaReportsApprovedPlanSnapshotColumnGuarded, true)
assert.equal(rollup.runtimeFlags.qaReportsApprovedPlanSnapshotForeignKeyGuarded, true)
assert.equal(rollup.runtimeFlags.qaReportsProjectSnapshotIndexUnblocked, true)
assert.equal(rollup.runtimeFlags.qaReportsApprovedSnapshotBackfillSkipped, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterQaReportsApprovedSnapshotFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry11ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry11Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry11Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceQaReportsApprovedSnapshotFixVerified, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceRlsFunctionParameterFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineRlsFunctionParameterFixRecorded, true)
assert.equal(rollup.runtimeFlags.activeBaselineRlsPoliciesMigrationEdited, true)
assert.equal(rollup.runtimeFlags.isWorkspaceMemberParameterNamePreserved, true)
assert.equal(rollup.runtimeFlags.isWorkspaceOwnerOrAdminParameterNamePreserved, true)
assert.equal(rollup.runtimeFlags.workspaceUuidParameterRenameSkipped, true)
assert.equal(
  rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterRlsFunctionParameterFixRequired,
  false,
)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry12ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry12Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry12Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceRlsFunctionParameterFixVerified, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceStorageBucketsCommentBaselineFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineStorageBucketsCommentFixRecorded, true)
assert.equal(rollup.runtimeFlags.activeBaselineStorageBucketsPoliciesMigrationEdited, true)
assert.equal(rollup.runtimeFlags.storageBucketsTableCommentInsufficientPrivilegeGuarded, true)
assert.equal(rollup.runtimeFlags.storageBucketsTableCommentSkippedWhenNotOwner, true)
assert.equal(rollup.runtimeFlags.storageBucketPolicySemanticsChanged, false)
assert.equal(
  rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterStorageBucketsCommentFixRequired,
  false,
)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry13ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry13Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry13Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceStorageBucketsCommentFixVerified, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceStorageObjectsPolicyCommentBaselineFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineStorageObjectsPolicyCommentFixRecorded, true)
assert.equal(rollup.runtimeFlags.storageObjectsPolicyCommentInsufficientPrivilegeGuarded, true)
assert.equal(rollup.runtimeFlags.storageObjectsPolicyCommentsSkippedWhenNotOwner, true)
assert.equal(rollup.runtimeFlags.storageObjectPolicySemanticsChanged, false)
assert.equal(
  rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterStorageObjectsPolicyCommentFixRequired,
  false,
)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry14ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry14Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry14Passed, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceStorageObjectsPolicyCommentFixVerified, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceStorageUploadPipelinePolicyCommentBaselineFixRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceBaselineStorageUploadPipelinePolicyCommentFixRecorded, true)
assert.equal(rollup.runtimeFlags.activeBaselineStorageUploadPipelineReadinessMigrationEdited, true)
assert.equal(rollup.runtimeFlags.storageUploadPipelinePolicyCommentInsufficientPrivilegeGuarded, true)
assert.equal(rollup.runtimeFlags.storageUploadPipelinePolicyCommentsSkippedWhenNotOwner, true)
assert.equal(rollup.runtimeFlags.storageUploadPipelinePolicySemanticsChanged, false)
assert.equal(
  rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetryAfterStorageUploadPipelinePolicyCommentFixRequired,
  false,
)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry15ResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry15Attempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry15Passed, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessBaselineMigrationPassed, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationResultReviewRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationResultReviewRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationResultReviewAccepted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationPlanRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationPlanRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationCreateRequired, false)
assert.equal(rollup.runtimeFlags.qwenActiveMigrationCreated, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationValidationRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationValidationResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationValidationAttempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationValidated, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationApplied, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationHistoryObserved, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployPlanRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployPlanRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployApprovalRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployApprovalRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeploymentTargetApproved, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployExecutionRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployExecutionPreflightRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployExecutionAttempted, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployCommandRun, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployHistoryReconciliationRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationHistoryReconciliationRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationReadOnlySqlMetadataQueryExecuted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationRemoteSchemaEquivalentForRequiredGuards, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationHistoryAdoptionRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationAdoptedRemoteVersion, '20260628000100')
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationAdoptedFilePresent, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationSupersededLocalVersionRemoved, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDuplicateSemanticHistoryAvoided, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationRemoteMigrationFilePresentLocally, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationLocalHistoryAlignmentRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationAdoptedLocalValidationRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationAdoptedLocalValidationResultRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationAdoptedLocalValidationAttempted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationAdoptedLocalValidationPassed, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationAdoptedHistoryObserved, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationAdoptedHistoryVersion, '20260628000100')
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationSupersededHistoryObserved, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationRemoteSatisfactionReviewRequired, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationRemoteSatisfactionReviewRecorded, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationRemoteSatisfied, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationNoDeployAccepted, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployCommandRequiredNow, false)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployShouldBeSkippedNow, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationRemoteQwenMigrationObserved, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationRemoteQwenVersion, '20260628000100')
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationLocalValidatedVersion, '20260628000100')
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployed, false)
assert.equal(rollup.runtimeFlags.persistedWorkerDispatchReadinessReviewRequired, false)
assert.equal(rollup.runtimeFlags.runtimePersistenceToWorkerDispatchReadinessReviewRecorded, true)
assert.equal(rollup.runtimeFlags.persistedWorkerDispatchReadinessAcceptedForControlledSmokePlanning, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchSmokePlanRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchSmokePlanRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchSmokeExecutionRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchSmokeExecuted, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchSmokePassed, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchSmokeResultReviewRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchSmokeResultReviewRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchSmokeResultReviewAccepted, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimePlanRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimePlanRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeImplementationRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeImplemented, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokePlanRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokePlanRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeExecutionRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeExecuted, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokePassed, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeResultReviewAccepted, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeApprovalPlanRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeApprovalPlanRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeApprovalDecisionRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeApprovalDecisionRecorded, true)
assert.equal(
  rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeApprovalDecisionAcceptedForExecutionPlanning,
  true,
)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionPlanRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionPlanRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionApprovalRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionApprovalRecorded, true)
assert.equal(
  rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionApprovalAcceptedForPreflight,
  true,
)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionPreflightRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionPreflightRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionPreflightPassed, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionAttemptRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionAttemptRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionAttemptPassedFailClosed, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewAccepted, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRecorded, true)
assert.equal(
  rollup.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionAcceptedForExecutionPlanning,
  true,
)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalRecorded, true)
assert.equal(
  rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalAcceptedForPreflight,
  true,
)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightPassed, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptPassedFailClosed, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewRequired, false)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewRecorded, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewAccepted, true)
assert.equal(
  rollup.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRequired,
  false,
)
assert.equal(
  rollup.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRecorded,
  true,
)
assert.equal(
  rollup.runtimeFlags
    .controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalRequired,
  true,
)
assert.equal(rollup.runtimeFlags.approvedSnapshotFixtureScopePlanned, true)
assert.equal(rollup.runtimeFlags.creditReservationNoSpendPreconditionPlanned, true)
assert.equal(rollup.runtimeFlags.serviceRoleJobLeaseClaimScopePlanned, true)
assert.equal(rollup.runtimeFlags.idempotencyDuplicateSourceGuardPlanned, true)
assert.equal(rollup.runtimeFlags.privateInvokeTransportExecutionConditionsPlanned, true)
assert.equal(rollup.runtimeFlags.qwenRequestResponseSchemaPlanned, true)
assert.equal(rollup.runtimeFlags.resultPersistenceWithoutGeneratedAssetsPlanned, true)
assert.equal(rollup.runtimeFlags.qaAuditCostObservabilityPlanned, true)
assert.equal(rollup.runtimeFlags.rollbackCleanupCreditReleasePlanned, true)
assert.equal(rollup.runtimeFlags.betaProductionPublicArtifactLockPlanned, true)
assert.equal(rollup.runtimeFlags.approvedSnapshotApprovalPlanned, true)
assert.equal(rollup.runtimeFlags.creditReservationApprovalPlanned, true)
assert.equal(rollup.runtimeFlags.privateSourceOfTruthRefsApprovalPlanned, true)
assert.equal(rollup.runtimeFlags.serviceRoleLeaseClaimApprovalPlanned, true)
assert.equal(rollup.runtimeFlags.idempotencyApprovalPlanned, true)
assert.equal(rollup.runtimeFlags.privateInvokeTransportApprovalPlanned, true)
assert.equal(rollup.runtimeFlags.qaAuditCostCreditApprovalPlanned, true)
assert.equal(rollup.runtimeFlags.rollbackFailClosedApprovalPlanned, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeDefaultLeaseBoundaryBlocked, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeAdapterPreviewBlocked, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeTransportPreviewBlocked, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeIdempotencyConflictBlocked, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeMissingApprovedSnapshotBlocked, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeMissingCreditReservationBlocked, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeMissingSourceOfTruthRefsBlocked, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeInvalidWorkerJobSchemaBlocked, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeAllRequiredStatusesObserved, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeTransportPreviewReachedAllBoundaries, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeApprovedFixtureDefaultAttemptBlocked, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeApprovedFixtureAdapterPreviewBlocked, true)
assert.equal(rollup.runtimeFlags.controlledPersistedWorkerDispatchRuntimeApprovedFixtureTransportPreviewBlocked, true)
assert.equal(rollup.runtimeFlags.mockQueueFixtureValidated, true)
assert.equal(rollup.runtimeFlags.mockCoordinatorDefaultPathExecuted, true)
assert.equal(rollup.runtimeFlags.mockCoordinatorAdapterPreviewPathExecuted, true)
assert.equal(rollup.runtimeFlags.mockCoordinatorTransportPreviewPathExecuted, true)
assert.equal(rollup.runtimeFlags.mockJobRecordCreated, true)
assert.equal(rollup.runtimeFlags.mockIdempotencyRecordCreated, true)
assert.equal(rollup.runtimeFlags.mockWorkerLeaseClaimed, true)
assert.equal(rollup.runtimeFlags.mockWorkerClaimAttemptCreated, true)
assert.equal(rollup.runtimeFlags.mockJobEventCreated, true)
assert.equal(rollup.runtimeFlags.mockBackendRuntimeMessageCreated, true)
assert.equal(rollup.runtimeFlags.mockRecordsStoredInMemoryOnly, true)
assert.equal(rollup.runtimeFlags.backendRuntimePersistenceStorageUploadPipelinePolicyCommentFixVerified, true)
assert.equal(rollup.runtimeFlags.qwenDraftSqlApplyAttempted, true)
assert.equal(rollup.runtimeFlags.qwenDraftSqlApplied, true)
assert.equal(rollup.runtimeFlags.qwenLocalSqlTestsAttempted, true)
assert.equal(rollup.runtimeFlags.qwenLocalSqlTestsExecuted, true)
assert.equal(rollup.runtimeFlags.qwenLocalSqlTestsPassed, true)
assert.equal(rollup.runtimeFlags.localHarnessSqlExecuted, true)
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-port-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-migration-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-current-edit-session-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-3-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-5-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-credit-approval-snapshots-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-credit-estimates-plan-version-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-7-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-13-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-storage-objects-policy-comment-fix.md',
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
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-port-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-migration-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-2-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-current-edit-session-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-3-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-media-assets-status-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-4-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-edit-plan-segments-version-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-5-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-credit-approval-snapshots-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-6-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-credit-estimates-plan-version-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-8-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-generated-asset-versions-version-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-9-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-qa-check-results-check-column-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-10-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-13-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-objects-policy-comment-fix.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-14-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-14-result.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-storage-upload-pipeline-policy-comment-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-upload-pipeline-policy-comment-fix.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review.ts',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-plan.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-result-review.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-approval-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-approval-decision.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-decision.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-plan.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-approval.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-preflight.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result.ts',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-plan.ts',
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
  backendRuntimePersistenceLocalHarnessPortFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_PORT_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetryResult: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_RESULT,
  backendRuntimePersistenceBaselineMigrationFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_MIGRATION_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry2Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_2_RESULT,
  backendRuntimePersistenceBaselineCurrentEditSessionFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CURRENT_EDIT_SESSION_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry3Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_3_RESULT,
  backendRuntimePersistenceBaselineMediaAssetsStatusFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_MEDIA_ASSETS_STATUS_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry4Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_4_RESULT,
  backendRuntimePersistenceBaselineEditPlanSegmentsVersionFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_EDIT_PLAN_SEGMENTS_VERSION_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry5Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_5_RESULT,
  backendRuntimePersistenceBaselineCreditApprovalSnapshotsFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CREDIT_APPROVAL_SNAPSHOTS_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry6Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_6_RESULT,
  backendRuntimePersistenceBaselineCreditEstimatesPlanVersionFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CREDIT_ESTIMATES_PLAN_VERSION_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry7Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_7_RESULT,
  backendRuntimePersistenceBaselineGenerationRequestsApprovedSnapshotFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_GENERATION_REQUESTS_APPROVED_SNAPSHOT_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry8Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_8_RESULT,
  backendRuntimePersistenceBaselineGeneratedAssetVersionsVersionFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_GENERATED_ASSET_VERSIONS_VERSION_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry9Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_9_RESULT,
  backendRuntimePersistenceBaselineQaCheckResultsCheckColumnFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_QA_CHECK_RESULTS_CHECK_COLUMN_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry10Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_10_RESULT,
  backendRuntimePersistenceBaselineQaReportsApprovedSnapshotFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_QA_REPORTS_APPROVED_SNAPSHOT_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry11Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_11_RESULT,
  backendRuntimePersistenceBaselineRlsFunctionParameterFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_RLS_FUNCTION_PARAMETER_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry12Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_12_RESULT,
  backendRuntimePersistenceBaselineStorageBucketsCommentFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_BUCKETS_COMMENT_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry13Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_13_RESULT,
  backendRuntimePersistenceBaselineStorageObjectsPolicyCommentFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_OBJECTS_POLICY_COMMENT_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry14Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_14_RESULT,
  backendRuntimePersistenceBaselineStorageUploadPipelinePolicyCommentFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_UPLOAD_PIPELINE_POLICY_COMMENT_FIX,
  backendRuntimePersistenceLocalHarnessValidationRetry15Result: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT,
  backendRuntimePersistenceLocalHarnessValidationResultReview: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT_REVIEW,
  backendRuntimePersistenceActiveMigrationPlan: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_PLAN,
  backendRuntimePersistenceActiveMigrationCreate: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_CREATE,
  backendRuntimePersistenceActiveMigrationValidationResult: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_VALIDATION_RESULT,
  backendRuntimePersistenceActiveMigrationDeployPlan: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_PLAN,
  backendRuntimePersistenceActiveMigrationDeployApproval: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_APPROVAL,
  backendRuntimePersistenceActiveMigrationDeployExecuteResult: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_EXECUTE_RESULT,
  backendRuntimePersistenceActiveMigrationHistoryReconciliation: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_RECONCILIATION,
  backendRuntimePersistenceActiveMigrationHistoryAdoption: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_ADOPTION,
  backendRuntimePersistenceActiveMigrationAdoptedLocalValidation: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_ADOPTED_LOCAL_VALIDATION,
  backendRuntimePersistenceActiveMigrationRemoteSatisfactionReview:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_REMOTE_SATISFACTION_REVIEW,
  runtimePersistenceToWorkerDispatchReadinessReview:
    QWEN2_5_VL_RUNTIME_PERSISTENCE_TO_WORKER_DISPATCH_READINESS_REVIEW,
  controlledPersistedWorkerDispatchSmokePlan:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_PLAN,
  controlledPersistedWorkerDispatchSmokeExecution:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_EXECUTION_RESULT,
  controlledPersistedWorkerDispatchSmokeResultReview:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_RESULT_REVIEW,
  controlledPersistedWorkerDispatchRuntimePlan:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_PLAN,
  controlledPersistedWorkerDispatchRuntimeImplementation:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_IMPLEMENTATION,
  controlledPersistedWorkerDispatchRuntimeSmokePlan:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN,
  controlledPersistedWorkerDispatchRuntimeSmokeExecution:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_EXECUTION_RESULT,
  controlledPersistedWorkerDispatchRuntimeSmokeResultReview:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_RESULT_REVIEW,
  controlledPersistedWorkerDispatchRuntimeApprovalPlan:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_APPROVAL_PLAN,
  controlledPersistedWorkerDispatchRuntimeApprovalDecision:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_APPROVAL_DECISION,
  controlledPersistedWorkerDispatchRuntimeExecutionPlan:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PLAN,
  controlledPersistedWorkerDispatchRuntimeExecutionApproval:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_APPROVAL,
  controlledPersistedWorkerDispatchRuntimeExecutionPreflight:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PREFLIGHT,
  controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlan:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_PLAN,
  controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecision:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_DECISION,
  controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlan:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_PLAN,
  controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApproval:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_APPROVAL,
  controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflight:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_PREFLIGHT,
  controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResult:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT,
  controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReview:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT_REVIEW,
  controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlan:
    QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_PLAN,
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
