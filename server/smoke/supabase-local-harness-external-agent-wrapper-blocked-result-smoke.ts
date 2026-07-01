import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { SUPABASE_LOCAL_HARNESS_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT } from '../../src/backend/mock/mock-supabase-local-harness-external-agent-wrapper-blocked-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/supabase-local-harness-external-agent-wrapper-blocked-result.md'
const SPEC_PATH = 'src/backend/mock/mock-supabase-local-harness-external-agent-wrapper-blocked-result.ts'
const SMOKE_PATH = 'server/smoke/supabase-local-harness-external-agent-wrapper-blocked-result-smoke.ts'
const WRAPPER_PATH = 'server/cli/external-agent-tool-execute-supabase-harness.ts'
const PACKAGE_SCRIPT = 'smoke:supabase-local-harness-external-agent-wrapper-blocked-result'
const DECISION = 'supabase_local_harness_external_agent_wrapper_blocked_evidence_review_result_recorded'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AZ-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-PLAN: promote validated Qwen persistence draft to active migration plan, no deploy/no cloud/no assets/no beta'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'supabaseHarnessWrapperBlockedResult'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
      ['Supabase cloud host', /\bsupabase\.co\b/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
    ]

    for (const [name, pattern] of patterns) {
      if (pattern.test(value)) findings.push(`${prefix}: ${name}`)
    }

    return findings
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...scanForbiddenValues(item, `${prefix}[${index}]`)))
    return findings
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      findings.push(...scanForbiddenValues(nestedValue, `${prefix}.${key}`))
    }
  }

  return findings
}

function assertFalseFlags(flags: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  DOC_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  WRAPPER_PATH,
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-verify-report.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/supabase-local-harness-external-agent-wrapper-blocked-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  'external-agent Supabase harness wrapper -> no-execution config verification smoke -> no-execution retry-result smoke -> supporting-evidence blocker',
  '`REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW=true npm run external-agent-tool-execute-supabase-harness -- --execute --json`',
  'wrapper status: `blocked`',
  'config verification smoke passed: `true`',
  'config verification passed: `true`',
  'local toolchain verification passed: `true`',
  'retry 15 result smoke passed: `true`',
  'referenced retry 15 local validation passed: `true`',
  'referenced Qwen draft SQL applied in prior evidence: `true`',
  'referenced cleanup verified in prior evidence: `true`',
  '`supabase_local_harness_supporting_evidence_only`',
  '`not_a_model_or_media_execution_lane_on_this_branch`',
  '`active_migration_plan_required_before_real_dispatch`',
  '`runtimeRunNow=false`',
  '`supabaseCliExecuted=false`',
  '`dockerStarted=false`',
  '`sqlExecuted=false`',
  '`databaseCreated=false`',
  '`migrationDeployed=false`',
  '`rowsCreated=false`',
  '`storageObjectsCreated=false`',
  '`signedUrlsCreated=false`',
  '`generatedAssetsCreated=false`',
  '`creditMutationCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `Supabase harness blocked result doc missing ${required}`)
}

const result = SUPABASE_LOCAL_HARNESS_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'supabase_local_harness_external_agent_wrapper_blocked_result')
assert.equal(result.wrapperCommand.confirmationEnv, 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW')
assert.equal(result.wrapperCommand.verifiesConfigEvidenceSmokeBeforeAnyRuntime, true)
assert.equal(result.wrapperCommand.verifiesRetry15EvidenceSmokeBeforeAnyRuntime, true)
assert.equal(result.wrapperCommand.blocksBeforeSupabaseCliDockerSqlMigrationOrStorage, true)
assert.equal(result.reviewedResult.wrapperStatus, 'blocked')
assert.equal(result.reviewedResult.wrapperMode, 'external_agent_supabase_harness_execution_evidence_review_result')
assert.equal(result.reviewedResult.configVerifySmokePassed, true)
assert.equal(
  result.reviewedResult.configVerifyDecision,
  'qwen2_5_vl_backend_runtime_persistence_local_harness_config_verified_harness_validation_required',
)
assert.equal(result.reviewedResult.configVerificationPassed, true)
assert.equal(result.reviewedResult.localToolchainVerificationPassed, true)
assert.equal(result.reviewedResult.readyForLocalHarnessValidationEvidence, true)
assert.equal(result.reviewedResult.retry15ResultSmokePassed, true)
assert.equal(
  result.reviewedResult.retry15Decision,
  'qwen2_5_vl_backend_runtime_persistence_local_harness_validation_retry_15_passed_qwen_draft_sql_and_tests',
)
assert.equal(result.reviewedResult.referencedRetry15LocalHarnessValidationPassed, true)
assert.equal(result.reviewedResult.referencedQwenDraftSqlAppliedInPriorEvidence, true)
assert.equal(result.reviewedResult.referencedQwenLocalSqlTestsPassedInPriorEvidence, true)
assert.equal(result.reviewedResult.referencedCleanupVerifiedInPriorEvidence, true)
assert.deepEqual(result.blockers, [
  'supabase_local_harness_supporting_evidence_only',
  'not_a_model_or_media_execution_lane_on_this_branch',
  'active_migration_plan_required_before_real_dispatch',
])
assertFalseFlags(result.runtimeResult, [
  'runtimeRunNow',
  'supabaseCliExecuted',
  'dockerStarted',
  'sqlExecuted',
  'databaseCreated',
  'migrationDeployed',
  'rowsCreated',
  'storageObjectsCreated',
  'signedUrlsCreated',
  'generatedAssetsCreated',
  'publicArtifactsCreated',
  'creditMutationCreated',
  'betaUnlocked',
  'productionUnlocked',
  'paidProductionUnlocked',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
])
assert.equal(result.nextPrompt, NEXT_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      wrapperStatus: result.reviewedResult.wrapperStatus,
      configVerifySmokePassed: result.reviewedResult.configVerifySmokePassed,
      retry15ResultSmokePassed: result.reviewedResult.retry15ResultSmokePassed,
      supabaseCliExecuted: result.runtimeResult.supabaseCliExecuted,
      sqlExecuted: result.runtimeResult.sqlExecuted,
      migrationDeployed: result.runtimeResult.migrationDeployed,
      generatedLocalFixturePassedClaimed: result.runtimeResult.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
