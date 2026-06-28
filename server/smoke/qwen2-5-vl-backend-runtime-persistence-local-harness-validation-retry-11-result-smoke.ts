import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_QA_REPORTS_APPROVED_SNAPSHOT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_11_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-11-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_local_harness_validation_retry_11_blocked_rls_function_parameter_mismatch'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AQ-BACKEND-RUNTIME-PERSISTENCE-BASELINE-RLS-FUNCTION-PARAMETER-FIX: fix ReEditPro local baseline is_workspace_member parameter compatibility for Qwen harness validation, no deploy/no cloud/no assets/no beta'

type JsonRecord = Record<string, unknown>

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
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
  ['unsafe runtime true claim', /\b(privateInvokeReady|betaReady|productionReady|inferenceRun|workersDispatched|supabaseCloudTouched|stagingTouched|productionTouched)\b\s*[:=]\s*(true|"true")/i],
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

function assertFalseFlags(flags: JsonRecord) {
  for (const key of [
    'backendRuntimePersistenceLocalHarnessValidationRetry11Passed',
    'backendRuntimePersistenceLocalHarnessStarted',
    'backendRuntimePersistenceLocalHarnessPortConflictDetected',
    'backendRuntimePersistenceLocalHarnessBaselineMigrationPassed',
    'qwenDraftSqlApplied',
    'qwenLocalSqlTestsExecuted',
    'qwenLocalContainersLeftBehind',
    'unrelatedLocalSupabaseProjectStopped',
    'activeMigrationCreated',
    'qwenActiveMigrationCreated',
    'migrationDeployed',
    'readyForRealWorkerDispatch',
    'privateInvokeReady',
    'realJobCreated',
    'realLeaseClaimed',
    'idempotencyRowCreated',
    'jobEventCreated',
    'backendRuntimeMessageCreated',
    'workerClaimCreated',
    'storageObjectRecordCreated',
    'signedUrlEventCreated',
    'qaReportCreated',
    'auditEventCreated',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'serviceUrlResolvedNow',
    'audienceResolvedNow',
    'identityTokenFetched',
    'authHeaderCreated',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
    'promptProcessed',
    'forwardPassRun',
    'inferenceRun',
    'providerCallsMade',
    'workersDispatched',
    'supabaseCloudTouched',
    'stagingTouched',
    'productionTouched',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'mediaProcessingRun',
    'renderExportRun',
    'creditMutationCreated',
    'betaReady',
    'productionReady',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-11-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-11-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix.ts',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'supabase/config.toml',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(
  !fs.existsSync(path.join(ROOT, 'supabase/migrations/024_qwen2_5_vl_backend_runtime_persistence.sql')),
  'Qwen active migration must not exist.',
)
check(
  !fs.existsSync(path.join(ROOT, 'supabase/migrations/999_qwen2_5_vl_backend_runtime_persistence.sql')),
  'Qwen active migration must not exist.',
)
check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be left behind.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-11-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-11-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-11-result.md')
for (const phrase of [
  DECISION,
  '`55430`',
  '`55431`',
  '`55432`',
  '`55433`',
  '`55434`',
  '`202605180006_reeditpro_qa_exports_audit.sql`',
  '`202605180007_reeditpro_rls_policies.sql`',
  '`idx_qa_reports_project_snapshot`',
  '`qa_reports.approved_plan_snapshot_id`',
  '`qa_reports_approved_plan_snapshot_id_fkey`',
  '`rls_is_workspace_member_parameter_name_mismatch`',
  '`cannot change name of input parameter "target_workspace_id" (SQLSTATE 42P13)`',
  '`target_workspace_id`',
  '`workspace_uuid`',
  '`supabase stop --project-id reeditpro_qwen_local_harness --no-backup`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry11ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry11Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry11Passed=false`',
  '`backendRuntimePersistenceQaReportsApprovedSnapshotFixVerified=true`',
  '`backendRuntimePersistenceRlsFunctionParameterFixRequired=true`',
  '`qwenDraftSqlApplied=false`',
  '`qwenLocalSqlTestsExecuted=false`',
  '`qwenLocalContainersLeftBehind=false`',
  '`supabaseCloudTouched=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-11-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-11-result.ts',
]) {
  assertNoForbiddenText(file)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_11_RESULT
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamBackendRuntimePersistenceBaselineQaReportsApprovedSnapshotFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_QA_REPORTS_APPROVED_SNAPSHOT_FIX.decision,
)
assert.equal(result.validationTarget.fixedLocalPorts.db, 55432)
assert.equal(result.preflight.fixedPortsFreeBeforeRetry, true)
assert.equal(result.attempt.localSupabaseHarnessStartAttempted, true)
assert.equal(result.attempt.localBaselineMigrationsAttempted, true)
assert.equal(result.attempt.previouslyFailedBaselineColumnPassed, 'qa_reports.approved_plan_snapshot_id')
assert.equal(result.attempt.previouslyFailedBaselineIndexPassed, 'idx_qa_reports_project_snapshot')
assert.equal(result.attempt.previouslyFailedBaselineConstraintPassed, 'qa_reports_approved_plan_snapshot_id_fkey')
assert.equal(
  result.attempt.lastSuccessfulBaselineMigration,
  '202605180006_reeditpro_qa_exports_audit.sql',
)
assert.equal(
  result.attempt.failedBaselineMigration,
  '202605180007_reeditpro_rls_policies.sql',
)
assert.equal(result.attempt.failedStatementCategory, 'rls_is_workspace_member_parameter_name_mismatch')
assert.equal(result.attempt.failedFunction, 'public.is_workspace_member(uuid)')
assert.equal(result.attempt.existingBaselineParameterObserved, 'target_workspace_id')
assert.equal(result.attempt.attemptedReplacementParameter, 'workspace_uuid')
assert.equal(
  result.attempt.sanitizedFailureReason,
  'cannot_change_name_of_input_parameter_target_workspace_id_sqlstate_42p13',
)
assert.equal(result.attempt.qwenDraftSqlApplied, false)
assert.equal(result.attempt.qwenLocalSqlTestsExecuted, false)
assert.equal(result.cleanup.cleanupObservedStopped, true)
assert.equal(result.cleanup.cleanupVerified, true)
assert.equal(result.cleanup.fixedPortsFreeAfterCleanup, true)
assert.equal(result.cleanup.qwenLocalContainersLeftBehind, false)
assert.equal(result.validationOutcome.status, 'blocked_rls_function_parameter_mismatch')
assert.equal(result.validationOutcome.qaReportsApprovedSnapshotFixVerified, true)
assert.equal(result.validationOutcome.rlsFunctionParameterFixRequired, true)
assert.equal(result.validationOutcome.generatedLocalFixturePassedClaimed, false)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assertFalseFlags(result.runtimeFlags)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry11ResultRecorded, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry11Attempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessStartAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessBaselineMigrationAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceQaReportsApprovedSnapshotFixVerified, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceRlsFunctionParameterFixRequired, true)

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen validation retry 11 data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  localHarnessValidationRetry11Attempted: result.validationOutcome.localHarnessValidationRetry11Attempted,
  localHarnessValidationRetry11Passed: result.validationOutcome.localHarnessValidationRetry11Passed,
  qaReportsApprovedSnapshotFixVerified:
    result.validationOutcome.qaReportsApprovedSnapshotFixVerified,
  failedBaselineMigration: result.attempt.failedBaselineMigration,
  failedStatementCategory: result.attempt.failedStatementCategory,
  failedFunction: result.attempt.failedFunction,
  existingBaselineParameterObserved: result.attempt.existingBaselineParameterObserved,
  attemptedReplacementParameter: result.attempt.attemptedReplacementParameter,
  qwenDraftSqlApplied: result.attempt.qwenDraftSqlApplied,
  qwenLocalSqlTestsExecuted: result.attempt.qwenLocalSqlTestsExecuted,
  cleanupVerified: result.cleanup.cleanupVerified,
  generatedLocalFixturePassedClaimed: result.validationOutcome.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
