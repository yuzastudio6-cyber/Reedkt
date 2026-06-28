import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_RLS_FUNCTION_PARAMETER_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_11_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-11-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_baseline_rls_function_parameter_fix_recorded'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AR-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-12: retry Qwen local harness validation after RLS function parameter fix, no deploy/no cloud/no assets/no beta'

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
    'newMigrationCreated',
    'qwenDraftSqlApplied',
    'qwenLocalSqlTestsExecuted',
    'qwenLocalContainersStarted',
    'qwenLocalContainersLeftBehind',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-rls-function-parameter-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-11-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-11-result.ts',
  'supabase/migrations/202605180007_reeditpro_rls_policies.sql',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-rls-function-parameter-fix.md')
for (const phrase of [
  DECISION,
  '`202605180007_reeditpro_rls_policies.sql`',
  '`public.is_workspace_member(uuid)`',
  '`public.is_workspace_member(target_workspace_id uuid)`',
  '`public.is_workspace_owner_or_admin(target_workspace_id uuid)`',
  '`target_workspace_id`',
  '`workspace_uuid`',
  '`cannot change name of input parameter "target_workspace_id" (SQLSTATE 42P13)`',
  '`backendRuntimePersistenceBaselineRlsFunctionParameterFixRecorded=true`',
  '`activeBaselineRlsPoliciesMigrationEdited=true`',
  '`isWorkspaceMemberParameterNamePreserved=true`',
  '`isWorkspaceOwnerOrAdminParameterNamePreserved=true`',
  '`workspaceUuidParameterRenameSkipped=true`',
  '`qwenDraftSqlApplied=false`',
  '`qwenLocalSqlTestsExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const migration = read('supabase/migrations/202605180007_reeditpro_rls_policies.sql')
assert.ok(
  migration.includes('create or replace function public.is_workspace_member(target_workspace_id uuid)'),
  'is_workspace_member must preserve target_workspace_id parameter name.',
)
assert.ok(
  migration.includes('where wm.workspace_id = target_workspace_id'),
  'is_workspace_member body must reference target_workspace_id.',
)
assert.ok(
  migration.includes('create or replace function public.is_workspace_owner_or_admin(target_workspace_id uuid)'),
  'is_workspace_owner_or_admin must preserve target_workspace_id parameter name.',
)
assert.ok(
  migration.includes('where w.id = target_workspace_id'),
  'is_workspace_owner_or_admin body must reference target_workspace_id.',
)
assert.equal(
  /create or replace function public\.is_workspace_member\(workspace_uuid uuid\)/.test(migration),
  false,
  'is_workspace_member must not use workspace_uuid parameter rename.',
)
assert.equal(
  /create or replace function public\.is_workspace_owner_or_admin\(workspace_uuid uuid\)/.test(migration),
  false,
  'is_workspace_owner_or_admin must not use workspace_uuid parameter rename.',
)

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-rls-function-parameter-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix.ts',
]) {
  assertNoForbiddenText(file)
}

const fix = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_RLS_FUNCTION_PARAMETER_FIX
assert.equal(fix.decision, DECISION)
assert.equal(
  fix.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry11ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_11_RESULT.decision,
)
assert.equal(fix.repairedMigration, 'supabase/migrations/202605180007_reeditpro_rls_policies.sql')
assert.equal(fix.failureContext.existingBaselineParameterObserved, 'target_workspace_id')
assert.equal(fix.failureContext.attemptedReplacementParameter, 'workspace_uuid')
assert.equal(fix.functionCompatibilityFixes.length, 2)
assert.equal(fix.functionCompatibilityFixes.every((entry) => entry.preservedParameterName === 'target_workspace_id'), true)
assert.equal(fix.functionCompatibilityFixes.every((entry) => entry.bodyReferencesPreservedParameter), true)
assert.equal(fix.nextPrompt, NEXT_PROMPT)
assertFalseFlags(fix.runtimeFlags)
assert.equal(fix.runtimeFlags.backendRuntimePersistenceBaselineRlsFunctionParameterFixRecorded, true)
assert.equal(fix.runtimeFlags.activeBaselineRlsPoliciesMigrationEdited, true)
assert.equal(fix.runtimeFlags.isWorkspaceMemberParameterNamePreserved, true)
assert.equal(fix.runtimeFlags.isWorkspaceOwnerOrAdminParameterNamePreserved, true)
assert.equal(fix.runtimeFlags.workspaceUuidParameterRenameSkipped, true)

const forbiddenDataFindings = scanValues({ fix })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen RLS function parameter fix data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  repairedMigration: fix.repairedMigration,
  preservedParameterName: 'target_workspace_id',
  skippedParameterName: 'workspace_uuid',
  qwenDraftSqlApplied: fix.runtimeFlags.qwenDraftSqlApplied,
  qwenLocalSqlTestsExecuted: fix.runtimeFlags.qwenLocalSqlTestsExecuted,
  generatedLocalFixturePassedClaimed: fix.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: fix.nextPrompt,
}, null, 2))
