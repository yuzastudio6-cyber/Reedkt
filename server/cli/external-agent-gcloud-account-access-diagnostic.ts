import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_GCLOUD_ACCOUNT_ACCESS_DIAGNOSTIC } from '../../src/backend/mock/mock-external-agent-gcloud-account-access-diagnostic'

type CommandResult = {
  id: string
  ok: boolean
  exitCode: number | null
  rawStdout?: string
  stdout?: string
  stderrSummary?: string
}

type AuthAccount = {
  account?: string
  status?: string
}

type QuotaEntry = {
  metric?: string
  limit?: number
  usage?: number
}

type QuotaDocument = {
  quotas?: QuotaEntry[]
}

type MissingReadPermission = {
  toolId: string
  permission: string
  likelyMinimalRole: string
  resourceScope: string
  reason: string
}

const TOKEN_LIKE_PATTERNS: Array<[string, RegExp]> = [
  ['url', /\bhttps?:\/\/\S+/gi],
  ['access token', /\bya29\.[A-Za-z0-9._-]+/g],
  ['authorization header', /\bAuthorization\s*:\s*Bearer\s+\S+/gi],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
  ['email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi],
]
const GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV = 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX'
const GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG = '--account-index'
const GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG_ALIAS = '--gcloud-account-index'

function sanitize(value: string | undefined): string | undefined {
  if (!value) return undefined

  let output = value
  for (const [label, pattern] of TOKEN_LIKE_PATTERNS) {
    output = output.replace(pattern, `<redacted ${label}>`)
  }

  return output.trim().slice(0, 700) || undefined
}

function accountDomain(value: string | undefined): string | undefined {
  if (!value?.includes('@')) return undefined
  const [, domain] = value.trim().split('@')
  return domain || undefined
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

function commandLabel(command: string, args: readonly string[]): string {
  return [command, ...args].join(' ')
}

function cliFlagValue(...flags: string[]): string | undefined {
  for (const flag of flags) {
    const equalsArg = process.argv.find((arg) => arg.startsWith(`${flag}=`))
    if (equalsArg) return equalsArg.slice(flag.length + 1).trim()

    const index = process.argv.indexOf(flag)
    if (index >= 0) return process.argv[index + 1]?.trim()
  }

  return undefined
}

function selectedAccountIndex(): number | undefined {
  const rawIndex =
    cliFlagValue(GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG, GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG_ALIAS) ??
    process.env[GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV]?.trim()
  const parsedIndex = rawIndex ? Number(rawIndex) : undefined
  return Number.isInteger(parsedIndex) && Number(parsedIndex) > 0 ? Number(parsedIndex) : undefined
}

function applySelectedAccountIndex(value: string): string {
  const index = selectedAccountIndex()
  if (!index) return value

  return value.replace(/<account-index>/g, String(index)).replace(/<redacted-index>/g, String(index))
}

function perAccountGcloudArgs(account: string, args: string[]): string[] {
  return ['--account', account, ...args]
}

function main() {
  const spec = EXTERNAL_AGENT_GCLOUD_ACCOUNT_ACCESS_DIAGNOSTIC

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
          perAccountReadOnlyProbeTemplates: spec.perAccountReadOnlyProbeTemplates,
          runtimeSideEffects: spec.runtimeSideEffects,
        },
        null,
        2,
      ),
    )
    return
  }

  const gcloudPath = runReadOnlyCommand('gcloud_path', 'which', ['gcloud'], { captureStdout: true })
  const authList = gcloudPath.ok
    ? runReadOnlyCommand('gcloud_auth_list', 'gcloud', ['auth', 'list', '--format=json'], {
        captureStdout: true,
      })
    : undefined
  const project = gcloudPath.ok
    ? runReadOnlyCommand('gcloud_project', 'gcloud', ['config', 'get-value', 'project'], {
        captureStdout: true,
      })
    : undefined
  const accounts = parseJson<AuthAccount[]>(authList) ?? []
  const projectMatches = project?.stdout === spec.projectId

  const accountDiagnostics = accounts
    .filter((account) => Boolean(account.account))
    .map((authAccount, index) => {
      const account = authAccount.account ?? ''
      const token = runReadOnlyCommand(
        `account_${index + 1}_token_refresh_suppressed`,
        'gcloud',
        perAccountGcloudArgs(account, ['auth', 'print-access-token', '--quiet']),
        { suppressStdout: true },
      )
      const service = token.ok
        ? runReadOnlyCommand(
            `account_${index + 1}_qwen_service_describe`,
            'gcloud',
            perAccountGcloudArgs(account, [
              'run',
              'services',
              'describe',
              spec.qwen.serviceName,
              '--project',
              spec.projectId,
              '--region',
              spec.qwen.region,
              '--format=value(metadata.name)',
            ]),
            { captureStdout: true },
          )
        : undefined
      const job = token.ok
        ? runReadOnlyCommand(
            `account_${index + 1}_qwen_job_describe`,
            'gcloud',
            perAccountGcloudArgs(account, [
              'run',
              'jobs',
              'describe',
              spec.qwen.callerJobName,
              '--project',
              spec.projectId,
              '--region',
              spec.qwen.region,
              '--format=value(metadata.name)',
            ]),
            { captureStdout: true },
          )
        : undefined
      const projectQuota = token.ok
        ? runReadOnlyCommand(
            `account_${index + 1}_broll_project_quota_describe`,
            'gcloud',
            perAccountGcloudArgs(account, [
              'compute',
              'project-info',
              'describe',
              '--project',
              spec.projectId,
              '--format=json',
            ]),
            { captureStdout: true },
          )
        : undefined
      const regionQuota = token.ok
        ? runReadOnlyCommand(
            `account_${index + 1}_broll_region_quota_describe`,
            'gcloud',
            perAccountGcloudArgs(account, [
              'compute',
              'regions',
              'describe',
              spec.broll.targetRegion,
              '--project',
              spec.projectId,
              '--format=json',
            ]),
            { captureStdout: true },
          )
        : undefined
      const projectQuotaDoc = parseJson<QuotaDocument>(projectQuota)
      const regionQuotaDoc = parseJson<QuotaDocument>(regionQuota)
      const globalGpuQuota = findQuota(projectQuotaDoc, 'GPUS_ALL_REGIONS')
      const regionalL4Quota = findQuota(regionQuotaDoc, 'NVIDIA_L4_GPUS')
      const qwenReadAccessPassed =
        Boolean(service?.ok && job?.ok) &&
        service?.stdout === spec.qwen.serviceName &&
        job?.stdout === spec.qwen.callerJobName
      const brollQuotaReadAccessPassed = Boolean(projectQuota?.ok && regionQuota?.ok)
      const brollQuotaSufficient =
        brollQuotaReadAccessPassed &&
        (globalGpuQuota?.limit ?? 0) >= spec.broll.minimumGlobalGpusAllRegionsQuota &&
        (regionalL4Quota?.limit ?? 0) >= spec.broll.minimumRegionalL4Quota

      return {
        accountIndex: index + 1,
        accountRedacted: '<redacted email>',
        accountDomain: accountDomain(account),
        active: authAccount.status === 'ACTIVE',
        tokenRefreshPassed: token.ok,
        qwenServiceReadPassed: Boolean(service?.ok),
        qwenJobReadPassed: Boolean(job?.ok),
        qwenReadAccessPassed,
        brollProjectQuotaReadPassed: Boolean(projectQuota?.ok),
        brollRegionQuotaReadPassed: Boolean(regionQuota?.ok),
        brollQuotaReadAccessPassed,
        brollQuotaSufficient,
        globalGpusAllRegionsQuotaLimit: globalGpuQuota?.limit,
        globalGpusAllRegionsQuotaUsage: globalGpuQuota?.usage,
        regionalL4GpuQuotaLimit: regionalL4Quota?.limit,
        regionalL4GpuQuotaUsage: regionalL4Quota?.usage,
        blockers: {
          token: token.ok ? 'cleared' : 'token_refresh_failed',
          qwen: qwenReadAccessPassed
            ? 'cleared'
            : token.ok
              ? 'gcloud_account_lacks_qwen_cloud_run_read_access_or_resources_missing'
              : 'token_refresh_failed_before_qwen_read_probe',
          broll: brollQuotaReadAccessPassed
            ? brollQuotaSufficient
              ? 'cleared'
              : 'quota_insufficient_for_one_l4'
            : token.ok
              ? 'gcloud_account_lacks_compute_quota_read_access'
              : 'token_refresh_failed_before_broll_quota_probe',
        },
        stderrSummaries: {
          token: token.stderrSummary,
          qwenService: service?.stderrSummary,
          qwenJob: job?.stderrSummary,
          brollProjectQuota: projectQuota?.stderrSummary,
          brollRegionQuota: regionQuota?.stderrSummary,
        },
      }
    })

  const qwenReadyAccountCount = accountDiagnostics.filter((account) => account.qwenReadAccessPassed).length
  const brollQuotaReadAccountCount = accountDiagnostics.filter((account) => account.brollQuotaReadAccessPassed).length
  const brollQuotaReadyAccountCount = accountDiagnostics.filter((account) => account.brollQuotaSufficient).length
  const anyAccountReadyForBoth = accountDiagnostics.some(
    (account) => account.qwenReadAccessPassed && account.brollQuotaSufficient,
  )
  const requestedAccountIndex = selectedAccountIndex()
  const selectedAccount = requestedAccountIndex
    ? accountDiagnostics.find((account) => account.accountIndex === requestedAccountIndex)
    : undefined
  const selectedAccountMissingReadPermissions: MissingReadPermission[] = []
  if (selectedAccount?.tokenRefreshPassed) {
    if (!selectedAccount.qwenServiceReadPassed) {
      selectedAccountMissingReadPermissions.push({
        toolId: spec.qwen.toolId,
        permission: 'run.services.get',
        likelyMinimalRole: spec.qwen.likelyMinimalRole,
        resourceScope: spec.qwen.requiredResourceScope,
        reason: 'Qwen Cloud Run service describe failed for the selected account index',
      })
    }
    if (!selectedAccount.qwenJobReadPassed) {
      selectedAccountMissingReadPermissions.push({
        toolId: spec.qwen.toolId,
        permission: 'run.jobs.get',
        likelyMinimalRole: spec.qwen.likelyMinimalRole,
        resourceScope: spec.qwen.requiredResourceScope,
        reason: 'Qwen Cloud Run private caller job describe failed for the selected account index',
      })
    }
    if (!selectedAccount.brollProjectQuotaReadPassed) {
      selectedAccountMissingReadPermissions.push({
        toolId: spec.broll.toolId,
        permission: 'compute.projects.get',
        likelyMinimalRole: spec.broll.likelyMinimalRole,
        resourceScope: spec.broll.requiredResourceScope,
        reason: 'B-roll project quota describe failed for the selected account index',
      })
    }
    if (!selectedAccount.brollRegionQuotaReadPassed) {
      selectedAccountMissingReadPermissions.push({
        toolId: spec.broll.toolId,
        permission: 'compute.regions.get',
        likelyMinimalRole: spec.broll.likelyMinimalRole,
        resourceScope: spec.broll.requiredResourceScope,
        reason: 'B-roll regional L4 quota describe failed for the selected account index',
      })
    }
  }
  const selectedAccountRepairRequest = requestedAccountIndex
    ? {
        accountIndex: requestedAccountIndex,
        accountFound: Boolean(selectedAccount),
        accountRedacted: selectedAccount ? '<redacted email>' : undefined,
        accountDomain: selectedAccount?.accountDomain,
        tokenRefreshPassed: selectedAccount?.tokenRefreshPassed ?? false,
        qwenReadAccessPassed: selectedAccount?.qwenReadAccessPassed ?? false,
        brollQuotaReadAccessPassed: selectedAccount?.brollQuotaReadAccessPassed ?? false,
        brollQuotaSufficient: selectedAccount?.brollQuotaSufficient ?? false,
        missingReadPermissions: selectedAccountMissingReadPermissions,
        likelyMinimalRoles: Array.from(
          new Set(selectedAccountMissingReadPermissions.map((permission) => permission.likelyMinimalRole)),
        ),
        tokenRepairRequired: selectedAccount ? !selectedAccount.tokenRefreshPassed : true,
        gcpOwnerRepairRequired:
          Boolean(selectedAccount?.tokenRefreshPassed) && selectedAccountMissingReadPermissions.length > 0,
        safeRepairChecklist: selectedAccount?.tokenRefreshPassed
          ? [
              'ask the GCP owner to grant or confirm only the listed read permissions for the selected account',
              'do not create replacement Cloud Run resources or Compute VMs from this diagnostic',
              'rerun the selected account preflight after the read permissions are fixed',
            ]
          : [
              'refresh or select a local gcloud account whose token can refresh in this shell',
              'rerun the selected account diagnostic before asking for IAM changes',
            ],
        postRepairVerificationCommands: [
          `npm run external-agent-gcp-access:verify -- --account-index ${requestedAccountIndex}`,
          `npm run external-agent-tool-blockers:preflight -- --account-index ${requestedAccountIndex}`,
          `npm run external-agent-tool-next-command -- --account-index ${requestedAccountIndex}`,
        ],
        mutatesGcp: false,
        mutatesLocalGcloudConfig: false,
        runsRuntime: false,
        runtimeExecutionStillRequiresWrapperGate: true,
      }
    : undefined
  const runtimeGatesAllFalse = Object.values(spec.runtimeSideEffects).every((value) => value === false)
  const recommendedNextPrompt = applySelectedAccountIndex(
    anyAccountReadyForBoth ? spec.nextActionIfAnyAccountReady : spec.nextActionIfNoAccountReady,
  )

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
          configuredProject: project?.stdout,
          projectMatches,
        },
        accountCount: accountDiagnostics.length,
        qwenReadyAccountCount,
        brollQuotaReadAccountCount,
        brollQuotaReadyAccountCount,
        anyAccountReadyForBoth,
        accountDiagnostics,
        selectedAccountRepairRequest,
        postRepairCodexVerificationCommand: applySelectedAccountIndex(spec.postRepairCodexVerificationCommand),
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
