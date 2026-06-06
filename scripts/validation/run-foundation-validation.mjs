import { spawnSync } from 'node:child_process'

const root = process.cwd()
const startedAt = new Date()
const npmExecPath = process.env.npm_execpath
const useNpmExecPath = Boolean(npmExecPath)
const includeFullBuild = process.env.REEDITPRO_INCLUDE_FULL_BUILD === 'true'
const skipFullBuild = process.env.REEDITPRO_SKIP_FULL_BUILD === 'true'

const nativeBindingPatterns = [
  /Cannot find native binding/i,
  /ERR_DLOPEN_FAILED/i,
  /@rolldown\/binding/i,
  /rolldown-binding/i,
  /code signature/i,
  /different Team IDs/i,
  /mapping process and mapped file/i,
]

const requiredChecks = [
  {
    id: 'lint',
    command: 'npm run lint',
    npmArgs: ['run', 'lint'],
    required: true,
  },
  {
    id: 'typecheck_server',
    command: 'npm run typecheck:server',
    npmArgs: ['run', 'typecheck:server'],
    required: true,
  },
  {
    id: 'schema_static_audit',
    command: 'npm run --silent schema:static-audit',
    npmArgs: ['run', '--silent', 'schema:static-audit'],
    required: true,
  },
  {
    id: 'auth_rls_diagnostics',
    command: 'npm run --silent auth:rls:diagnostics',
    npmArgs: ['run', '--silent', 'auth:rls:diagnostics'],
    required: true,
  },
  {
    id: 'storage_scope_diagnostics',
    command: 'npm run --silent storage:scope:diagnostics',
    npmArgs: ['run', '--silent', 'storage:scope:diagnostics'],
    required: true,
  },
  {
    id: 'snapshot_scope_diagnostics',
    command: 'npm run --silent snapshot:scope:diagnostics',
    npmArgs: ['run', '--silent', 'snapshot:scope:diagnostics'],
    required: true,
  },
  {
    id: 'credit_scope_diagnostics',
    command: 'npm run --silent credit:scope:diagnostics',
    npmArgs: ['run', '--silent', 'credit:scope:diagnostics'],
    required: true,
  },
  {
    id: 'backend_api_diagnostics',
    command: 'npm run --silent backend:api:diagnostics',
    npmArgs: ['run', '--silent', 'backend:api:diagnostics'],
    required: true,
  },
  {
    id: 'job_worker_diagnostics',
    command: 'npm run --silent job:worker:diagnostics',
    npmArgs: ['run', '--silent', 'job:worker:diagnostics'],
    required: true,
  },
  {
    id: 'media_readiness_diagnostics',
    command: 'npm run --silent media:readiness:diagnostics',
    npmArgs: ['run', '--silent', 'media:readiness:diagnostics'],
    required: true,
  },
  {
    id: 'render_export_diagnostics',
    command: 'npm run --silent render:export:diagnostics',
    npmArgs: ['run', '--silent', 'render:export:diagnostics'],
    required: true,
  },
  {
    id: 'qa_revision_diagnostics',
    command: 'npm run --silent qa:revision:diagnostics',
    npmArgs: ['run', '--silent', 'qa:revision:diagnostics'],
    required: true,
  },
  {
    id: 'tool_call_diagnostics',
    command: 'npm run --silent tool:call:diagnostics',
    npmArgs: ['run', '--silent', 'tool:call:diagnostics'],
    required: true,
  },
  {
    id: 'tool_readiness_diagnostics',
    command: 'npm run --silent tool:readiness:diagnostics',
    npmArgs: ['run', '--silent', 'tool:readiness:diagnostics'],
    required: true,
  },
  {
    id: 'worker_execution_diagnostics',
    command: 'npm run --silent worker:execution:diagnostics',
    npmArgs: ['run', '--silent', 'worker:execution:diagnostics'],
    required: true,
  },
  {
    id: 'provider_gateway_diagnostics',
    command: 'npm run --silent provider:gateway:diagnostics',
    npmArgs: ['run', '--silent', 'provider:gateway:diagnostics'],
    required: true,
  },
  {
    id: 'compliance_diagnostics',
    command: 'npm run --silent compliance:diagnostics',
    npmArgs: ['run', '--silent', 'compliance:diagnostics'],
    required: true,
  },
  {
    id: 'observability_diagnostics',
    command: 'npm run --silent observability:diagnostics',
    npmArgs: ['run', '--silent', 'observability:diagnostics'],
    required: true,
  },
  {
    id: 'e2e_staging_diagnostics',
    command: 'npm run --silent e2e:staging:diagnostics',
    npmArgs: ['run', '--silent', 'e2e:staging:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_rls_prep_diagnostics',
    command: 'npm run --silent supabase:rls:prep:diagnostics',
    npmArgs: ['run', '--silent', 'supabase:rls:prep:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_local_preflight',
    command: 'npm run --silent supabase:local:preflight',
    npmArgs: ['run', '--silent', 'supabase:local:preflight'],
    required: true,
  },
  {
    id: 'staging_supabase_approval_diagnostics',
    command: 'npm run --silent staging:supabase:approval:diagnostics',
    npmArgs: ['run', '--silent', 'staging:supabase:approval:diagnostics'],
    required: true,
  },
  {
    id: 'staging_supabase_approval_review_diagnostics',
    command: 'npm run --silent staging:supabase:approval-review:diagnostics',
    npmArgs: ['run', '--silent', 'staging:supabase:approval-review:diagnostics'],
    required: true,
  },
  {
    id: 'staging_supabase_approval_decision_diagnostics',
    command: 'npm run --silent staging:supabase:approval-decision:diagnostics',
    npmArgs: ['run', '--silent', 'staging:supabase:approval-decision:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_milestone_sync_diagnostics',
    command: 'npm run --silent supabase:milestone:sync:diagnostics',
    npmArgs: ['run', '--silent', 'supabase:milestone:sync:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_project_readonly_audit_diagnostics',
    command: 'npm run --silent supabase:project:readonly-audit:diagnostics',
    npmArgs: ['run', '--silent', 'supabase:project:readonly-audit:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_project_readonly_evidence_intake_diagnostics',
    command: 'npm run --silent supabase:project:evidence-intake:diagnostics',
    npmArgs: ['run', '--silent', 'supabase:project:evidence-intake:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_redacted_evidence_review_diagnostics',
    command: 'npm run --silent supabase:redacted-evidence:review:diagnostics',
    npmArgs: ['run', '--silent', 'supabase:redacted-evidence:review:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_evidence_collection_follow_up_diagnostics',
    command: 'npm run --silent supabase:evidence:collection:diagnostics',
    npmArgs: ['run', '--silent', 'supabase:evidence:collection:diagnostics'],
    required: true,
  },
  {
    id: 'staging_supabase_dry_run_packet_diagnostics',
    command: 'npm run --silent staging:supabase:dry-run-packet:diagnostics',
    npmArgs: ['run', '--silent', 'staging:supabase:dry-run-packet:diagnostics'],
    required: true,
  },
  {
    id: 'gcp_supabase_secret_refs_diagnostics',
    command: 'npm run --silent gcp:supabase:secret-refs:diagnostics',
    npmArgs: ['run', '--silent', 'gcp:supabase:secret-refs:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_connected_readonly_audit_diagnostics',
    command: 'npm run --silent supabase:connected-readonly-audit:diagnostics',
    npmArgs: ['run', '--silent', 'supabase:connected-readonly-audit:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_advisor_hardening_plan_diagnostics',
    command: 'npm run --silent supabase:advisor:hardening-plan:diagnostics',
    npmArgs: ['run', '--silent', 'supabase:advisor:hardening-plan:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_advisor_draft_remediation_diagnostics',
    command: 'npm run --silent supabase:advisor:draft-remediation:diagnostics',
    npmArgs: ['run', '--silent', 'supabase:advisor:draft-remediation:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_rls_no_policy_classification_diagnostics',
    command: 'npm run --silent supabase:rls-no-policy:classification:diagnostics',
    npmArgs: ['run', '--silent', 'supabase:rls-no-policy:classification:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_rls_no_policy_draft_migration_diagnostics',
    command: 'npm run --silent supabase:rls-no-policy:draft-migration:diagnostics',
    npmArgs: ['run', '--silent', 'supabase:rls-no-policy:draft-migration:diagnostics'],
    required: true,
  },
  {
    id: 'supabase_rls_no_policy_local_candidate_diagnostics',
    command: 'npm run --silent supabase:rls-no-policy:local-candidate:diagnostics',
    npmArgs: ['run', '--silent', 'supabase:rls-no-policy:local-candidate:diagnostics'],
    required: true,
  },
]

function npmCommand(npmArgs) {
  if (useNpmExecPath) {
    return {
      command: process.execPath,
      args: [npmExecPath, ...npmArgs],
    }
  }

  return {
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: npmArgs,
  }
}

function compact(value, maxLength = 1600) {
  const trimmed = String(value ?? '').trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength)}...`
}

function combinedOutput(result) {
  return [result.stdout, result.stderr]
    .filter(Boolean)
    .join('\n')
}

function isNativeBindingBlocker(output) {
  return nativeBindingPatterns.some((pattern) => pattern.test(output))
}

function recommendationFor(result) {
  if (result.status === 'passed') return 'No action required.'
  if (result.status === 'skipped') return 'Run with REEDITPRO_INCLUDE_FULL_BUILD=true when full build validation is required.'
  if (result.status === 'environment_blocked') {
    return 'Validate full build in Linux CI or repair the local native binding/toolchain before treating full build as passing.'
  }
  if (result.status === 'code_failed') {
    return 'Fix the reported code or TypeScript error before proceeding.'
  }
  return 'Inspect the command output and repair the validation environment or code path.'
}

function runCheck(check) {
  const started = Date.now()
  const command = npmCommand(check.npmArgs)
  const result = spawnSync(command.command, command.args, {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const output = combinedOutput(result)
  const exitCode = typeof result.status === 'number' ? result.status : null
  const errorSummary = compact(result.error ? result.error.message : output)
  let status = exitCode === 0 ? 'passed' : 'failed'

  if (check.id === 'build' && exitCode !== 0) {
    status = isNativeBindingBlocker(output) ? 'environment_blocked' : 'code_failed'
  }

  return {
    id: check.id,
    command: check.command,
    required: check.required,
    status,
    exitCode,
    signal: result.signal ?? null,
    durationMs: Date.now() - started,
    errorSummary: status === 'passed' ? '' : errorSummary,
    recommendation: recommendationFor({ status }),
  }
}

const checks = [...requiredChecks]
if (includeFullBuild && !skipFullBuild) {
  checks.push({
    id: 'build',
    command: 'npm run build',
    npmArgs: ['run', 'build'],
    required: false,
  })
}

const results = checks.map(runCheck)

if (!includeFullBuild || skipFullBuild) {
  results.push({
    id: 'build',
    command: 'npm run build',
    required: false,
    status: 'skipped',
    exitCode: null,
    signal: null,
    durationMs: 0,
    errorSummary: skipFullBuild
      ? 'REEDITPRO_SKIP_FULL_BUILD=true'
      : 'Full build is optional by default. Set REEDITPRO_INCLUDE_FULL_BUILD=true to attempt it.',
    recommendation: recommendationFor({ status: 'skipped' }),
  })
}

const requiredFailed = results.some((result) => result.required && result.status !== 'passed')
const codeFailed = results.some((result) => result.status === 'code_failed')
const environmentBlocked = results.some((result) => result.status === 'environment_blocked')

const summary = {
  generatedAt: startedAt.toISOString(),
  completedAt: new Date().toISOString(),
  platform: process.platform,
  arch: process.arch,
  nodeVersion: process.version,
  safety: {
    connectsToSupabase: false,
    readsEnvironmentSecrets: false,
    executesSql: false,
    callsProviders: false,
    rendersMedia: false,
    executesReeditProTools: false,
    deploys: false,
    mutatesSourceFiles: false,
    usesNodeBuiltInsOnly: true,
  },
  config: {
    includeFullBuild,
    skipFullBuild,
    npmExecPath: npmExecPath ?? null,
  },
  results,
  overallStatus: requiredFailed || codeFailed
    ? 'failed'
    : environmentBlocked
      ? 'environment_blocked'
      : 'passed',
  recommendation: requiredFailed || codeFailed
    ? 'Do not proceed until required checks and code-failure checks pass.'
    : environmentBlocked
      ? 'Default foundation checks pass, but full build remains environment-blocked locally. Use Linux CI or repair the local native binding path before marking full build as passing.'
      : 'Foundation validation passed for the selected checks.',
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (requiredFailed || codeFailed) {
  process.exitCode = 1
}
