import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

const ROOT = process.cwd()
const CLI_PATH = 'server/cli/external-agent-tool-execute-supabase-harness.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-execute-supabase-harness-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-execute-supabase-harness'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-execute-supabase-harness'
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function runCli(args: string[] = [], confirm = false) {
  const output = execFileSync('npx', ['tsx', CLI_PATH, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 24,
    env: {
      ...process.env,
      [CONFIRM_ENV]: confirm ? 'true' : '',
    },
  })

  return JSON.parse(output) as Record<string, unknown>
}

function scanForbiddenValues(value: unknown, prefix = 'externalAgentSupabaseHarnessExecute'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['supabase cloud host', /\bsupabase\.co\b/i],
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

for (const file of [CLI_PATH, SMOKE_PATH, 'package.json', 'src/backend/mock/mock-external-agent-tool-next-command.ts']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-execute-supabase-harness.ts',
  'package external-agent Supabase harness execute script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-execute-supabase-harness-smoke.ts',
  'package external-agent Supabase harness execute smoke script mismatch',
)

const source = read(CLI_PATH)
for (const required of [
  CONFIRM_ENV,
  'smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify',
  'smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result',
  'supabase_local_harness_supporting_evidence_only',
  'not_a_model_or_media_execution_lane_on_this_branch',
  'active_migration_plan_required_before_real_dispatch',
  'safeEvidenceReviewCompleted',
  'runtimeExecutionBlockedAsExpected',
  'parseJsonOutput',
  'runtimeRunNow: false',
  'supabaseCliExecuted: false',
  'dockerStarted: false',
  'sqlExecuted: false',
  'migrationDeployed: false',
  'generatedLocalFixturePassedClaimed: false',
]) {
  assert.equal(source.includes(required), true, `Supabase harness wrapper missing ${required}`)
}
for (const forbidden of [
  'supabase start',
  'supabase db',
  'supabase link',
  'docker ',
  'psql',
  'createdb',
  'dropdb',
]) {
  assert.equal(source.includes(forbidden), false, `Supabase harness wrapper must not include runtime marker: ${forbidden}`)
}

const staticReport = runCli(['--json'])
assert.equal(staticReport.ok, false)
assert.equal(staticReport.mode, 'external_agent_supabase_harness_execution_static_guard')
assert.equal(staticReport.executeRequired, true)
assert.equal(staticReport.confirmationEnv, CONFIRM_ENV)
assert.equal(staticReport.confirmationEnvRequiredValue, 'true')
assert.deepEqual(
  staticReport.canonicalCommand,
  EXTERNAL_AGENT_TOOL_NEXT_COMMAND.supabaseLocalHarnessEvidenceCommand,
)
assert.equal(staticReport.runtimeRunNow, false)
assert.equal(staticReport.supabaseCliExecuted, false)
assert.equal(staticReport.dockerStarted, false)
assert.equal(staticReport.sqlExecuted, false)
assert.equal(staticReport.databaseCreated, false)
assert.equal(staticReport.migrationDeployed, false)
assert.equal(staticReport.rowsCreated, false)
assert.equal(staticReport.storageObjectsCreated, false)
assert.equal(staticReport.signedUrlsCreated, false)
assert.equal(staticReport.generatedAssetsCreated, false)
assert.equal(staticReport.creditMutationCreated, false)
assert.equal(staticReport.betaUnlocked, false)
assert.equal(staticReport.productionUnlocked, false)
assert.equal(staticReport.generatedLocalFixturePassedClaimed, false)

const confirmationBlocked = runCli(['--execute', '--json'])
assert.equal(confirmationBlocked.ok, false)
assert.equal(confirmationBlocked.mode, 'external_agent_supabase_harness_execution_confirmation_blocked')
assert.equal(confirmationBlocked.status, 'blocked')
assert.deepEqual(confirmationBlocked.blockers, [`confirmation_env_required:${CONFIRM_ENV}=true`])

const evidenceReview = runCli(['--execute', '--json'], true)
assert.equal(evidenceReview.ok, false)
assert.equal(evidenceReview.mode, 'external_agent_supabase_harness_execution_evidence_review_result')
assert.equal(evidenceReview.status, 'blocked')
assert.equal(
  (evidenceReview.blockers as string[]).includes('supabase_local_harness_supporting_evidence_only'),
  true,
)
assert.equal(
  (evidenceReview.blockers as string[]).includes('not_a_model_or_media_execution_lane_on_this_branch'),
  true,
)
assert.equal(
  (evidenceReview.blockers as string[]).includes('active_migration_plan_required_before_real_dispatch'),
  true,
)
assert.equal(evidenceReview.safeEvidenceReviewRun, true)
assert.equal(evidenceReview.safeEvidenceReviewCompleted, true)
assert.equal(evidenceReview.safeEvidenceReviewExecutableNow, true)
assert.equal(evidenceReview.supportingEvidenceOnly, true)
assert.equal(evidenceReview.runtimeExecutionBlockedAsExpected, true)
assert.equal((evidenceReview.configVerify as Record<string, unknown>).ok, true)
assert.equal((evidenceReview.retry15Result as Record<string, unknown>).ok, true)
assert.equal(evidenceReview.runtimeRunNow, false)
assert.equal(evidenceReview.supabaseCliExecuted, false)
assert.equal(evidenceReview.dockerStarted, false)
assert.equal(evidenceReview.sqlExecuted, false)
assert.equal(evidenceReview.databaseCreated, false)
assert.equal(evidenceReview.migrationDeployed, false)
assert.equal(evidenceReview.rowsCreated, false)
assert.equal(evidenceReview.storageObjectsCreated, false)
assert.equal(evidenceReview.signedUrlsCreated, false)
assert.equal(evidenceReview.generatedAssetsCreated, false)
assert.equal(evidenceReview.creditMutationCreated, false)
assert.equal(evidenceReview.betaUnlocked, false)
assert.equal(evidenceReview.productionUnlocked, false)
assert.equal(evidenceReview.generatedLocalFixturePassedClaimed, false)

const forbiddenFindings = scanForbiddenValues({ staticReport, confirmationBlocked, evidenceReview })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'external_agent_supabase_harness_execution_wrapper_smoke',
      staticGuardMode: staticReport.mode,
      confirmationBlockedMode: confirmationBlocked.mode,
      evidenceReviewMode: evidenceReview.mode,
      confirmationEnv: CONFIRM_ENV,
      runtimeRunNow: false,
      sqlExecuted: false,
      generatedLocalFixturePassedClaimed: false,
    },
    null,
    2,
  ),
)
