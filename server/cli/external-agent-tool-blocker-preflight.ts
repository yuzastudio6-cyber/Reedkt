import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_TOOL_BLOCKER_PREFLIGHT } from '../../src/backend/mock/mock-external-agent-tool-blocker-preflight'

type CommandResult = {
  id: string
  ok: boolean
  exitCode: number | null
  rawStdout?: string
  stdout?: string
  stderrSummary?: string
}

type SkippedCommandSummary = {
  id: string
  ok: false
  skipped: true
  reason: 'gcloud_unavailable_before_downstream_probe' | 'auth_refresh_failed_before_downstream_probe'
}

type QuotaEntry = {
  metric?: string
  limit?: number
  usage?: number
}

type QuotaDocument = {
  quotas?: QuotaEntry[]
}

const TOKEN_LIKE_PATTERNS: Array<[string, RegExp]> = [
  ['url', /\bhttps?:\/\/\S+/gi],
  ['access token', /\bya29\.[A-Za-z0-9._-]+/g],
  ['authorization header', /\bAuthorization\s*:\s*Bearer\s+\S+/gi],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
  ['email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi],
]

const DOWNSTREAM_AUTH_REQUIRED_COMMAND_IDS = [
  'qwen_cloud_run_service_describe',
  'qwen_cloud_run_job_describe',
  'broll_project_quota_describe',
  'broll_region_quota_describe',
] as const

function sanitize(value: string | undefined): string | undefined {
  if (!value) return undefined

  let output = value
  for (const [label, pattern] of TOKEN_LIKE_PATTERNS) {
    output = output.replace(pattern, `<redacted ${label}>`)
  }

  return output.trim().slice(0, 500) || undefined
}

function commandLabel(command: string, args: readonly string[]): string {
  return [command, ...args].join(' ')
}

function outputLines(value: string | undefined): string[] {
  if (!value) return []

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
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

function parseJson<T>(result: CommandResult): T | undefined {
  if (!result.ok || !result.stdout) return undefined

  try {
    return JSON.parse(result.stdout) as T
  } catch {
    return undefined
  }
}

function findQuota(document: QuotaDocument | undefined, metric: string): QuotaEntry | undefined {
  return document?.quotas?.find((quota) => quota.metric === metric)
}

function activeAccountDomain(account: string | undefined): string | undefined {
  const candidate = account
    ?.split(/\s+/)
    .map((part) => part.trim())
    .find((part) => part.includes('@'))
  if (!candidate) return undefined

  const [, domain] = candidate.split('@')
  return sanitize(domain?.toLowerCase())
}

function main() {
  const spec = EXTERNAL_AGENT_TOOL_BLOCKER_PREFLIGHT

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
            toolId: command.toolId,
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
  const skippedCommandSummaries: SkippedCommandSummary[] = []
  const commandById = new Map(spec.allowedReadOnlyCommands.map((command) => [command.id, command]))

  function run(id: string, options: { captureStdout?: boolean; suppressStdout?: boolean } = {}) {
    const command = commandById.get(id)
    if (!command) throw new Error(`Unknown allowed command: ${id}`)
    const result = runReadOnlyCommand(id, command.command, command.args, options)
    commandResults.set(id, result)
    return result
  }

  const gcloudPath = run('gcloud_path', { captureStdout: true })
  const gcloudAllPaths = gcloudPath.ok ? run('gcloud_all_paths', { captureStdout: true }) : undefined
  const gcloudVersion = gcloudPath.ok ? run('gcloud_version', { captureStdout: true }) : undefined
  const project = gcloudPath.ok ? run('gcloud_project', { captureStdout: true }) : undefined
  const activeAccount = gcloudPath.ok ? run('gcloud_active_account', { captureStdout: true }) : undefined
  const accessTokenRefresh = gcloudPath.ok
    ? run('gcloud_access_token_refresh_suppressed', { suppressStdout: true })
    : undefined
  const downstreamProbeReady = Boolean(gcloudPath.ok && accessTokenRefresh?.ok)
  const downstreamSkipReason: SkippedCommandSummary['reason'] = gcloudPath.ok
    ? 'auth_refresh_failed_before_downstream_probe'
    : 'gcloud_unavailable_before_downstream_probe'

  if (!downstreamProbeReady) {
    for (const id of DOWNSTREAM_AUTH_REQUIRED_COMMAND_IDS) {
      skippedCommandSummaries.push({
        id,
        ok: false,
        skipped: true,
        reason: downstreamSkipReason,
      })
    }
  }

  const qwenService = downstreamProbeReady ? run('qwen_cloud_run_service_describe', { captureStdout: true }) : undefined
  const qwenJob = downstreamProbeReady ? run('qwen_cloud_run_job_describe', { captureStdout: true }) : undefined
  const projectQuota = downstreamProbeReady ? run('broll_project_quota_describe', { captureStdout: true }) : undefined
  const regionQuota = downstreamProbeReady ? run('broll_region_quota_describe', { captureStdout: true }) : undefined

  const projectQuotaDoc = parseJson<QuotaDocument>(projectQuota ?? { id: '', ok: false, exitCode: null })
  const regionQuotaDoc = parseJson<QuotaDocument>(regionQuota ?? { id: '', ok: false, exitCode: null })
  const globalGpuQuota = findQuota(projectQuotaDoc, 'GPUS_ALL_REGIONS')
  const regionalL4Quota = findQuota(regionQuotaDoc, 'NVIDIA_L4_GPUS')
  const preemptibleRegionalL4Quota = findQuota(regionQuotaDoc, 'PREEMPTIBLE_NVIDIA_L4_GPUS')
  const gcloudPathCandidates = uniqueStrings(outputLines(gcloudAllPaths?.rawStdout))
  const expectedAppleSiliconHomebrewPath = '/opt/homebrew/bin/gcloud'
  const usrLocalGcloudPath = '/usr/local/bin/gcloud'
  const pathEntries = uniqueStrings(outputLines(process.env.PATH?.split(':').join('\n')))
  const pathToolSearchEntries = pathEntries
    .filter((entry) => !entry.endsWith('/node_modules/.bin'))
    .slice(0, 8)
  const appleSiliconHomebrewPathIndex = pathEntries.indexOf('/opt/homebrew/bin')
  const usrLocalPathIndex = pathEntries.indexOf('/usr/local/bin')
  const appleSiliconHomebrewPrecedesUsrLocal =
    appleSiliconHomebrewPathIndex >= 0 && usrLocalPathIndex >= 0
      ? appleSiliconHomebrewPathIndex < usrLocalPathIndex
      : false
  const expectedAppleSiliconHomebrewGcloudPresent = gcloudPathCandidates.includes(expectedAppleSiliconHomebrewPath)
  const usrLocalGcloudPresent = gcloudPathCandidates.includes(usrLocalGcloudPath)
  const gcloudPathDiagnosticHint =
    appleSiliconHomebrewPrecedesUsrLocal && !expectedAppleSiliconHomebrewGcloudPresent && usrLocalGcloudPresent
      ? 'PATH includes /opt/homebrew/bin before /usr/local/bin, but no /opt/homebrew/bin/gcloud is visible; this shell resolves gcloud from /usr/local/bin'
      : undefined

  const qwenAuthCleared = Boolean(
    accessTokenRefresh?.ok &&
      qwenService?.ok &&
      qwenJob?.ok &&
      qwenService.stdout === spec.qwen.serviceName &&
      qwenJob.stdout === spec.qwen.callerJobName,
  )
  const brollQuotaCleared = Boolean(
    (globalGpuQuota?.limit ?? 0) >= spec.broll.minimumGlobalGpusAllRegionsQuota &&
      (regionalL4Quota?.limit ?? 0) >= spec.broll.minimumRegionalL4Quota,
  )
  const runtimeGatesAllFalse = Object.values(spec.runtimeSideEffects).every((value) => value === false)

  const qwenNextAction = qwenAuthCleared ? spec.qwen.nextActionIfCleared : spec.qwen.nextActionIfBlocked
  const brollSkippedForAuth = !downstreamProbeReady && downstreamSkipReason === 'auth_refresh_failed_before_downstream_probe'
  const brollNextAction = brollQuotaCleared
    ? spec.broll.nextActionIfCleared
    : brollSkippedForAuth
      ? spec.broll.nextActionIfSkippedForAuth
      : spec.broll.nextActionIfBlocked
  const brollBlocker = brollQuotaCleared
    ? 'cleared'
    : brollSkippedForAuth
      ? spec.broll.blockerIfSkippedForAuth
      : spec.broll.blockerIfFailed
  const recommendedNextPrompt = accessTokenRefresh?.ok && qwenAuthCleared ? brollNextAction : qwenNextAction

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
          pathCandidates: gcloudPathCandidates.map((candidate) => sanitize(candidate)).filter(Boolean),
          pathCandidateCount: gcloudPathCandidates.length,
          pathToolSearchEntries,
          appleSiliconHomebrewPrecedesUsrLocal,
          expectedAppleSiliconHomebrewPath,
          expectedAppleSiliconHomebrewGcloudPresent,
          usrLocalGcloudPath,
          usrLocalGcloudPresent,
          pathDiagnosticHint: gcloudPathDiagnosticHint,
          versionChecked: Boolean(gcloudVersion?.ok),
          configuredProject: project?.stdout,
          projectMatches: project?.stdout === spec.projectId,
          activeAccountDomain: activeAccountDomain(activeAccount?.rawStdout),
        },
        qwen: {
          toolId: spec.qwen.toolId,
          accessTokenRefreshPassed: Boolean(accessTokenRefresh?.ok),
          serviceDescribePassed: Boolean(qwenService?.ok),
          jobDescribePassed: Boolean(qwenJob?.ok),
          downstreamProbeSkipped: !downstreamProbeReady,
          downstreamProbeSkipReason: downstreamProbeReady ? undefined : downstreamSkipReason,
          serviceNameMatched: qwenService?.stdout === spec.qwen.serviceName,
          jobNameMatched: qwenJob?.stdout === spec.qwen.callerJobName,
          blocker: qwenAuthCleared ? 'cleared' : spec.qwen.blockerIfFailed,
          readyForNextAuthRefreshVerify: qwenAuthCleared,
          readyForExternalAgentExecutionNow: false,
          nextAction: qwenNextAction,
        },
        broll: {
          toolId: spec.broll.toolId,
          selectedGpu: spec.broll.selectedGpu,
          targetRegion: spec.broll.targetRegion,
          targetZone: spec.broll.targetZone,
          projectQuotaReadPassed: Boolean(projectQuota?.ok),
          regionQuotaReadPassed: Boolean(regionQuota?.ok),
          quotaProbeSkipped: !downstreamProbeReady,
          quotaProbeSkipReason: downstreamProbeReady ? undefined : downstreamSkipReason,
          globalGpusAllRegionsQuotaLimit: globalGpuQuota?.limit,
          globalGpusAllRegionsQuotaUsage: globalGpuQuota?.usage,
          regionalL4GpuQuotaLimit: regionalL4Quota?.limit,
          regionalL4GpuQuotaUsage: regionalL4Quota?.usage,
          preemptibleRegionalL4GpuQuotaLimit: preemptibleRegionalL4Quota?.limit,
          preemptibleRegionalL4GpuQuotaUsage: preemptibleRegionalL4Quota?.usage,
          quotaSufficientForOneL4Vm: brollQuotaCleared,
          blocker: brollBlocker,
          readyForNextQuotaVerify: brollQuotaCleared,
          readyForExternalAgentExecutionNow: false,
          nextAction: brollNextAction,
        },
        commandSummaries,
        skippedCommandSummaries,
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
