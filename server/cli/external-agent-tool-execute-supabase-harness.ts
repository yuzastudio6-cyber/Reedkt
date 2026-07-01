import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'
import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

type JsonRecord = Record<string, unknown>

const CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW'
const CONFIG_VERIFY_SMOKE = [
  'run',
  'smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify',
] as const
const RETRY_15_RESULT_SMOKE = [
  'run',
  'smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result',
] as const

function main() {
  const execute = process.argv.includes('--execute')
  const supabaseTool = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.tools.find(
    (tool) => tool.toolId === 'supabase_local_fixture_harness',
  )

  if (!execute) {
    print({
      ok: false,
      mode: 'external_agent_supabase_harness_execution_static_guard',
      executeRequired: true,
      confirmationEnv: CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
      canonicalCommand: EXTERNAL_AGENT_TOOL_NEXT_COMMAND.supabaseLocalHarnessEvidenceCommand,
      supabaseToolStatus: supabaseTool?.status,
      currentStage: supabaseTool?.currentStage,
      primaryBlocker: supabaseTool?.primaryBlocker,
      runtimeRunNow: false,
      supabaseCliExecuted: false,
      dockerStarted: false,
      sqlExecuted: false,
      databaseCreated: false,
      migrationDeployed: false,
      rowsCreated: false,
      storageObjectsCreated: false,
      signedUrlsCreated: false,
      generatedAssetsCreated: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
      generatedLocalFixturePassedClaimed: false,
    })
    return
  }

  if (process.env[CONFIRM_ENV] !== 'true') {
    print({
      ok: false,
      mode: 'external_agent_supabase_harness_execution_confirmation_blocked',
      status: 'blocked',
      blockers: [`confirmation_env_required:${CONFIRM_ENV}=true`],
      confirmationEnv: CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
      runtimeRunNow: false,
      supabaseCliExecuted: false,
      dockerStarted: false,
      sqlExecuted: false,
      databaseCreated: false,
      migrationDeployed: false,
      rowsCreated: false,
      storageObjectsCreated: false,
      signedUrlsCreated: false,
      generatedAssetsCreated: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
      generatedLocalFixturePassedClaimed: false,
    })
    return
  }

  const configVerify = runJson('supabase_local_harness_config_verify_smoke', 'npm', [
    ...CONFIG_VERIFY_SMOKE,
  ])
  const retry15 = runJson('supabase_local_harness_retry_15_result_smoke', 'npm', [
    ...RETRY_15_RESULT_SMOKE,
  ])
  const blockers = validateEvidence(configVerify, retry15)

  print({
    ok: false,
    mode: 'external_agent_supabase_harness_execution_evidence_review_result',
    status: 'blocked',
    blockers,
    configVerify: summarizeProbe(configVerify),
    retry15Result: summarizeProbe(retry15),
    nextPrompt:
      'QWEN2_5_VL_STACK_TOOL_58AZ-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-PLAN: promote validated Qwen persistence draft to active migration plan, no deploy/no cloud/no assets/no beta',
    runtimeRunNow: false,
    supabaseCliExecuted: false,
    dockerStarted: false,
    sqlExecuted: false,
    databaseCreated: false,
    migrationDeployed: false,
    rowsCreated: false,
    storageObjectsCreated: false,
    signedUrlsCreated: false,
    generatedAssetsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    generatedLocalFixturePassedClaimed: false,
  })
}

function validateEvidence(
  configVerify: ReturnType<typeof runJson>,
  retry15: ReturnType<typeof runJson>,
): string[] {
  const blockers = [
    'supabase_local_harness_supporting_evidence_only',
    'not_a_model_or_media_execution_lane_on_this_branch',
    'active_migration_plan_required_before_real_dispatch',
  ]

  if (!configVerify.ok) blockers.push('supabase_local_harness_config_verify_failed')
  if (!retry15.ok) blockers.push('supabase_local_harness_retry_15_result_failed')

  return blockers
}

function summarizeProbe(probe: ReturnType<typeof runJson>) {
  return {
    id: probe.id,
    ok: probe.ok,
    exitCode: probe.exitCode,
    decision: probe.json?.decision,
    mode: probe.json?.mode,
    configVerificationPassed: probe.json?.configVerificationPassed,
    localToolchainVerificationPassed: probe.json?.localToolchainVerificationPassed,
    readyForLocalHarnessValidation: probe.json?.readyForLocalHarnessValidation,
    localHarnessValidationRetry15Passed: probe.json?.localHarnessValidationRetry15Passed,
    qwenDraftSqlApplied: probe.json?.qwenDraftSqlApplied,
    qwenLocalSqlTestsPassed: probe.json?.qwenLocalSqlTestsPassed,
    cleanupVerified: probe.json?.cleanupVerified,
    sqlExecuted: probe.json?.sqlExecuted,
    generatedLocalFixturePassedClaimed: probe.json?.generatedLocalFixturePassedClaimed,
    stderrSummary: probe.stderrSummary,
  }
}

function runJson(
  id: string,
  command: string,
  args: string[],
): {
  id: string
  ok: boolean
  exitCode: number | null
  json?: JsonRecord
  stderrSummary?: string
} {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const json = parseJsonOutput(String(result.stdout ?? ''))

  return {
    id,
    ok: result.status === 0 && Boolean(json),
    exitCode: result.status,
    json,
    stderrSummary: sanitize(String(result.stderr ?? '')),
  }
}

function parseJsonOutput(output: string): JsonRecord | undefined {
  const trimmed = output.trim()
  if (!trimmed) return undefined

  try {
    return JSON.parse(trimmed) as JsonRecord
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start < 0 || end <= start) return undefined

    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as JsonRecord
    } catch {
      return undefined
    }
  }
}

function sanitize(value: string): string | undefined {
  const sanitized = value
    .replace(/\bhttps?:\/\/\S+/gi, 'redacted_url')
    .replace(/\bya29\.[A-Za-z0-9._-]+/g, 'redacted_access_token')
    .replace(/\bBearer\s+\S+/gi, 'Bearer redacted')
    .trim()

  return sanitized ? sanitized.slice(0, 1000) : undefined
}

function print(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

main()
