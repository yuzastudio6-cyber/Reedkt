import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_GCLOUD_SESSION_DIAGNOSTIC } from '../../src/backend/mock/mock-external-agent-gcloud-session-diagnostic'

type CommandResult = {
  id: string
  ok: boolean
  exitCode: number | null
  rawStdout?: string
  stdout?: string
  stderrSummary?: string
}

type GcloudConfiguration = {
  name?: string
  is_active?: boolean
  properties?: Record<string, Record<string, string | undefined> | undefined>
}

type GcloudConfigList = {
  core?: {
    account?: string
    project?: string
  }
}

type GcloudAuthAccount = {
  account?: string
  status?: string
}

const TOKEN_LIKE_PATTERNS: Array<[string, RegExp]> = [
  ['url', /\bhttps?:\/\/\S+/gi],
  ['access token', /\bya29\.[A-Za-z0-9._-]+/g],
  ['authorization header', /\bAuthorization\s*:\s*Bearer\s+\S+/gi],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
  ['email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi],
]

function sanitize(value: string | undefined): string | undefined {
  if (!value) return undefined

  let output = value
  for (const [label, pattern] of TOKEN_LIKE_PATTERNS) {
    output = output.replace(pattern, `<redacted ${label}>`)
  }

  return output.trim().slice(0, 800) || undefined
}

function accountDomain(value: string | undefined): string | undefined {
  if (!value || !value.includes('@')) return undefined
  const [, domain] = value.trim().split('@')
  return domain || undefined
}

function accountPresent(value: string | undefined): boolean {
  return Boolean(value && value.trim() && value.trim() !== '(unset)')
}

function commandLabel(command: string, args: readonly string[]): string {
  return [command, ...args].join(' ')
}

function runReadOnlyCommand(
  id: string,
  command: string,
  args: readonly string[],
  options: { captureStdout?: boolean; suppressStdout?: boolean } = {},
): CommandResult {
  const result = spawnSync(command, [...args], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 4,
    stdio: ['ignore', options.suppressStdout ? 'ignore' : 'pipe', 'pipe'],
  })

  const rawStdout = options.captureStdout && !options.suppressStdout ? String(result.stdout ?? '') : undefined

  return {
    id,
    ok: result.status === 0,
    exitCode: result.status,
    rawStdout,
    stdout: sanitize(rawStdout),
    stderrSummary: sanitize(String(result.stderr ?? '')),
  }
}

function parseJson<T>(result: CommandResult | undefined): T | undefined {
  if (!result?.ok || !result.rawStdout) return undefined

  try {
    return JSON.parse(result.rawStdout) as T
  } catch {
    return undefined
  }
}

function main() {
  const spec = EXTERNAL_AGENT_GCLOUD_SESSION_DIAGNOSTIC

  if (process.argv.includes('--plan')) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          decision: spec.decision,
          mode: `${spec.mode}_plan_only`,
          liveReadOnlyChecksRun: false,
          allowedReadOnlyCommands: spec.allowedReadOnlyCommands.map((command) => ({
            id: command.id,
            command: commandLabel(command.command, command.args),
            purpose: command.purpose,
            capturesTokenValue: command.capturesTokenValue,
            mutatesCloud: command.mutatesCloud,
            runsInference: command.runsInference,
          })),
          runtimeSideEffects: spec.runtimeSideEffects,
        },
        null,
        2,
      ),
    )
    return
  }

  const commandResults = new Map<string, CommandResult>()
  const commandById = new Map(spec.allowedReadOnlyCommands.map((command) => [command.id, command]))

  function run(id: string, options: { captureStdout?: boolean; suppressStdout?: boolean } = {}) {
    const command = commandById.get(id)
    if (!command) throw new Error(`Unknown allowed command: ${id}`)
    const result = runReadOnlyCommand(id, command.command, command.args, options)
    commandResults.set(id, result)
    return result
  }

  const gcloudPath = run('gcloud_path', { captureStdout: true })
  const gcloudVersion = gcloudPath.ok ? run('gcloud_version', { captureStdout: true }) : undefined
  const configurations = gcloudPath.ok ? run('gcloud_configurations_list', { captureStdout: true }) : undefined
  const configList = gcloudPath.ok ? run('gcloud_config_list', { captureStdout: true }) : undefined
  const project = gcloudPath.ok ? run('gcloud_project', { captureStdout: true }) : undefined
  const account = gcloudPath.ok ? run('gcloud_account', { captureStdout: true }) : undefined
  const activeAuth = gcloudPath.ok ? run('gcloud_auth_active_account', { captureStdout: true }) : undefined
  const accessTokenRefresh = gcloudPath.ok
    ? run('gcloud_access_token_refresh_suppressed', { suppressStdout: true })
    : undefined

  const configurationDocs = parseJson<GcloudConfiguration[]>(configurations)
  const activeConfig = configurationDocs?.find((configuration) => configuration.is_active)
  const activeConfigName = activeConfig?.name
  const config = parseJson<GcloudConfigList>(configList)
  const authAccounts = parseJson<GcloudAuthAccount[]>(activeAuth)
  const activeAuthAccount = authAccounts?.find((authAccount) => authAccount.status === 'ACTIVE')
  const accountValue = account?.rawStdout?.trim() || config?.core?.account || activeAuthAccount?.account
  const tokenRefreshPassed = Boolean(accessTokenRefresh?.ok)
  const projectMatches = project?.stdout === spec.projectId || config?.core?.project === spec.projectId
  const accountIsPresent = accountPresent(accountValue)
  const runtimeGatesAllFalse = Object.values(spec.runtimeSideEffects).every((value) => value === false)
  const likelyMismatch = tokenRefreshPassed
    ? 'none_detected_by_token_refresh_probe'
    : accountIsPresent
      ? spec.qwen.likelyMismatchIfFailed
      : 'no active account is visible to this Codex shell'
  const recommendedNextPrompt = tokenRefreshPassed ? spec.qwen.nextActionIfCleared : spec.qwen.nextActionIfBlocked

  const commandSummaries = [...commandResults.values()].map((result) => ({
    id: result.id,
    ok: result.ok,
    exitCode: result.exitCode,
    stderrSummary: result.stderrSummary,
  }))

  console.log(
    JSON.stringify(
      {
        ok: true,
        decision: spec.decision,
        mode: spec.mode,
        liveReadOnlyChecksRun: true,
        projectIdExpected: spec.projectId,
        gcloud: {
          available: gcloudPath.ok,
          path: gcloudPath.stdout,
          versionChecked: Boolean(gcloudVersion?.ok),
          activeConfigurationName: sanitize(activeConfigName),
          availableConfigurationCount: configurationDocs?.length,
          configuredProject: project?.stdout ?? sanitize(config?.core?.project),
          projectMatches,
          activeAccountPresent: accountIsPresent,
          activeAccountRedacted: accountIsPresent ? '<redacted email>' : undefined,
          activeAccountDomain: accountDomain(accountValue),
          authListActiveAccountPresent: accountPresent(activeAuthAccount?.account),
          accessTokenRefreshPassed: tokenRefreshPassed,
          likelyMismatch,
        },
        qwen: {
          toolId: spec.qwen.toolId,
          serviceName: spec.qwen.serviceName,
          callerJobName: spec.qwen.callerJobName,
          region: spec.qwen.region,
          authBlocker: tokenRefreshPassed ? 'cleared' : spec.qwen.blockerIfFailed,
          readyForServiceJobReadOnlyPreflight: tokenRefreshPassed && projectMatches,
          readyForExternalAgentExecutionNow: false,
        },
        commandSummaries,
        nextManualChecks: [
          'compare the gcloud path and active configuration in the terminal where auth was refreshed',
          'refresh the active account/configuration that this Codex shell reports, outside Codex',
          'rerun npm run external-agent-tool-blockers:preflight after auth refresh succeeds',
        ],
        runtimeSideEffects: spec.runtimeSideEffects,
        runtimeGatesAllFalse,
        readyForAnyExternalAgentExecutionNow: false,
        recommendedNextPrompt,
      },
      null,
      2,
    ),
  )
}

main()
