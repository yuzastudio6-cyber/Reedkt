import { spawnSync } from 'node:child_process'

import { AI_VIDEO_BROLL_WAN_GPU_GLOBAL_QUOTA_VERIFY } from '../../src/backend/mock/mock-ai-video-broll-wan-gpu-global-quota-verify'

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
  reason: 'gcloud_unavailable_before_quota_probe' | 'auth_refresh_failed_before_quota_probe'
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
  'project_gpu_quota_describe',
  'regional_l4_quota_describe',
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

function parseJson<T>(result: CommandResult | undefined): T | undefined {
  if (!result?.ok || !result.rawStdout) return undefined

  try {
    return JSON.parse(result.rawStdout) as T
  } catch {
    return undefined
  }
}

function findQuota(document: QuotaDocument | undefined, metric: string): QuotaEntry | undefined {
  return document?.quotas?.find((quota) => quota.metric === metric)
}

function main() {
  const spec = AI_VIDEO_BROLL_WAN_GPU_GLOBAL_QUOTA_VERIFY

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
            createsComputeVm: command.createsComputeVm,
            requestsQuota: command.requestsQuota,
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
  const accessTokenRefresh = gcloudPath.ok
    ? run('gcloud_access_token_refresh_suppressed', { suppressStdout: true })
    : undefined
  const quotaProbeReady = Boolean(gcloudPath.ok && accessTokenRefresh?.ok)
  const quotaSkipReason: SkippedCommandSummary['reason'] = gcloudPath.ok
    ? 'auth_refresh_failed_before_quota_probe'
    : 'gcloud_unavailable_before_quota_probe'

  if (!quotaProbeReady) {
    for (const id of DOWNSTREAM_AUTH_REQUIRED_COMMAND_IDS) {
      skippedCommandSummaries.push({
        id,
        ok: false,
        skipped: true,
        reason: quotaSkipReason,
      })
    }
  }

  const projectQuota = quotaProbeReady ? run('project_gpu_quota_describe', { captureStdout: true }) : undefined
  const regionQuota = quotaProbeReady ? run('regional_l4_quota_describe', { captureStdout: true }) : undefined
  const projectQuotaDoc = parseJson<QuotaDocument>(projectQuota)
  const regionQuotaDoc = parseJson<QuotaDocument>(regionQuota)
  const globalGpuQuota = findQuota(projectQuotaDoc, spec.globalQuotaMetric)
  const regionalL4Quota = findQuota(regionQuotaDoc, spec.regionalQuotaMetric)
  const preemptibleRegionalL4Quota = findQuota(regionQuotaDoc, spec.preemptibleRegionalQuotaMetric)
  const gcloudPathCandidates = uniqueStrings(outputLines(gcloudAllPaths?.rawStdout))
  const projectMatches = project?.stdout === spec.projectId
  const globalQuotaCleared = (globalGpuQuota?.limit ?? 0) >= spec.minimumGlobalGpusAllRegionsQuota
  const regionalQuotaCleared = (regionalL4Quota?.limit ?? 0) >= spec.minimumRegionalL4Quota
  const quotaSufficientForOneL4Vm = Boolean(globalQuotaCleared && regionalQuotaCleared)
  const runtimeGatesAllFalse = Object.values(spec.runtimeSideEffects).every((value) => value === false)
  const blocker = quotaSufficientForOneL4Vm
    ? 'cleared'
    : !quotaProbeReady
      ? spec.blockerIfAuthUnavailable
      : !globalQuotaCleared
        ? spec.blockerIfQuotaInsufficient
        : spec.blockerIfRegionalL4Insufficient
  const recommendedNextPrompt = quotaSufficientForOneL4Vm
    ? spec.nextActionIfQuotaCleared
    : !quotaProbeReady
      ? spec.nextActionIfAuthBlocked
      : spec.nextActionIfQuotaBlocked
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
        toolId: spec.toolId,
        projectIdExpected: spec.projectId,
        targetRegion: spec.targetRegion,
        targetZone: spec.targetZone,
        selectedGpu: spec.selectedGpu,
        machineType: spec.machineType,
        gcloud: {
          available: gcloudPath.ok,
          path: gcloudPath.stdout,
          pathCandidates: gcloudPathCandidates.map((candidate) => sanitize(candidate)).filter(Boolean),
          pathCandidateCount: gcloudPathCandidates.length,
          versionChecked: Boolean(gcloudVersion?.ok),
          configuredProject: project?.stdout,
          projectMatches,
          accessTokenRefreshPassed: Boolean(accessTokenRefresh?.ok),
        },
        quotaProbeSkipped: !quotaProbeReady,
        quotaProbeSkipReason: quotaProbeReady ? undefined : quotaSkipReason,
        projectQuotaReadPassed: Boolean(projectQuota?.ok),
        regionQuotaReadPassed: Boolean(regionQuota?.ok),
        globalQuotaMetric: spec.globalQuotaMetric,
        globalGpusAllRegionsQuotaLimit: globalGpuQuota?.limit,
        globalGpusAllRegionsQuotaUsage: globalGpuQuota?.usage,
        globalGpusAllRegionsQuotaCleared: globalQuotaCleared,
        regionalQuotaMetric: spec.regionalQuotaMetric,
        regionalL4GpuQuotaLimit: regionalL4Quota?.limit,
        regionalL4GpuQuotaUsage: regionalL4Quota?.usage,
        regionalL4GpuQuotaCleared: regionalQuotaCleared,
        preemptibleRegionalL4GpuQuotaLimit: preemptibleRegionalL4Quota?.limit,
        preemptibleRegionalL4GpuQuotaUsage: preemptibleRegionalL4Quota?.usage,
        quotaSufficientForOneL4Vm,
        blocker,
        readyForBrollNoIdleProofPrompt: false,
        readyForNonGpuIapSshCanaryPrompt: false,
        readyForBroll10rBoundedRunnerFixPrompt: false,
        readyForBroll10sFixedCanaryExecutePrompt: false,
        readyForBroll10tIapSshFlagFixPrompt: false,
        readyForBroll10uNoGpuIapSshCanaryRerunPrompt: false,
        readyForBroll10vNoIdleL4PayloadInstallRetryPrompt: false,
        readyForBroll10wIapLookupReadinessFixPrompt: quotaSufficientForOneL4Vm,
        readyForExternalAgentExecutionNow: false,
        noIdleLifecycleGate: spec.noIdleLifecycleGate,
        commandSummaries,
        skippedCommandSummaries,
        runtimeSideEffects: spec.runtimeSideEffects,
        runtimeGatesAllFalse,
        recommendedNextPrompt,
      },
      null,
      2,
    ),
  )
}

main()
