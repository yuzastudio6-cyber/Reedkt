import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_GCP_ACCESS_VERIFY } from '../../src/backend/mock/mock-external-agent-gcp-access-verify'

type JsonRecord = Record<string, unknown>

type CommandResult = {
  id: string
  ok: boolean
  exitCode: number | null
  json?: JsonRecord
  stderrSummary?: string
}

const TOKEN_LIKE_PATTERNS: Array<[string, RegExp]> = [
  ['url', /\bhttps?:\/\/\S+/gi],
  ['access token', /\bya29\.[A-Za-z0-9._-]+/g],
  ['authorization header', /\bAuthorization\s*:\s*Bearer\s+\S+/gi],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
  ['email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi],
]
const GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG = '--account-index'
const GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG_ALIAS = '--gcloud-account-index'
const BROLL_CACHE_READINESS_SCRIPT = 'server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts'

function sanitize(value: string | undefined): string | undefined {
  if (!value) return undefined

  let output = value
  for (const [label, pattern] of TOKEN_LIKE_PATTERNS) {
    output = output.replace(pattern, `<redacted ${label}>`)
  }

  return output.trim().slice(0, 700) || undefined
}

function nested(document: JsonRecord | undefined, keys: string[]): unknown {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return undefined
    value = (value as JsonRecord)[key]
  }
  return value
}

function nestedBoolean(document: JsonRecord | undefined, keys: string[]): boolean {
  return nested(document, keys) === true
}

function nestedString(document: JsonRecord | undefined, keys: string[]): string | undefined {
  const value = nested(document, keys)
  return typeof value === 'string' ? value : undefined
}

function nestedNumber(document: JsonRecord | undefined, keys: string[]): number | undefined {
  const value = nested(document, keys)
  return typeof value === 'number' ? value : undefined
}

function selectedAccountIndex(accountSelection: unknown): number | undefined {
  if (!accountSelection || typeof accountSelection !== 'object' || Array.isArray(accountSelection)) return undefined

  const value = (accountSelection as JsonRecord).overrideIndex
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined
}

function withSelectedAccountIndex(command: string, accountSelection: unknown): string {
  const index = selectedAccountIndex(accountSelection)
  if (!index || command.includes('--account-index') || command.includes('--gcloud-account-index')) return command

  return command.includes(' -- ')
    ? `${command} --account-index ${index}`
    : `${command} -- --account-index ${index}`
}

function runScript(id: string, script: string): CommandResult {
  const result = spawnSync('npx', ['tsx', script], {
    cwd: process.cwd(),
    env: childEnv(),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 12,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const stdout = String(result.stdout ?? '')

  let json: JsonRecord | undefined
  try {
    json = JSON.parse(stdout) as JsonRecord
  } catch {
    json = undefined
  }

  return {
    id,
    ok: result.status === 0 && Boolean(json),
    exitCode: result.status,
    json,
    stderrSummary: sanitize(String(result.stderr ?? '')),
  }
}

function childEnv(): NodeJS.ProcessEnv {
  const rawIndex = cliFlagValue(GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG, GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG_ALIAS)
  if (!rawIndex) return process.env

  return {
    ...process.env,
    REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX: rawIndex,
  }
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

function main() {
  const spec = EXTERNAL_AGENT_GCP_ACCESS_VERIFY
  const preflight = runScript('external_agent_tool_blocker_preflight', 'server/cli/external-agent-tool-blocker-preflight.ts')
  const nextCommand = runScript('external_agent_tool_next_command', 'server/cli/external-agent-tool-next-command.ts')
  const brollCacheReadiness = runScript('broll_private_cache_readiness', BROLL_CACHE_READINESS_SCRIPT)
  const runtimeGatesAllFalse = Object.values(spec.runtimeSideEffects).every((value) => value === false)

  const qwenReadAccessPassed =
    nestedBoolean(preflight.json, ['qwen', 'accessTokenRefreshPassed']) &&
    nestedBoolean(preflight.json, ['qwen', 'serviceDescribePassed']) &&
    nestedBoolean(preflight.json, ['qwen', 'jobDescribePassed'])
  const brollQuotaReadAccessPassed =
    nestedBoolean(preflight.json, ['broll', 'projectQuotaReadPassed']) &&
    nestedBoolean(preflight.json, ['broll', 'regionQuotaReadPassed'])
  const brollQuotaSufficientForOneL4Vm = nestedBoolean(preflight.json, ['broll', 'quotaSufficientForOneL4Vm'])
  const brollCacheReady =
    brollCacheReadiness.ok &&
    nestedBoolean(brollCacheReadiness.json, ['ok']) &&
    nestedBoolean(brollCacheReadiness.json, ['cachePathExists']) &&
    nestedBoolean(brollCacheReadiness.json, ['aggregateBytesMatches']) &&
    nestedBoolean(brollCacheReadiness.json, ['modelIndexClassNameMatches']) &&
    nestedBoolean(brollCacheReadiness.json, ['indexRefsLocal']) &&
    nestedBoolean(brollCacheReadiness.json, ['runtimeGatesAllFalse'])
  const allRequiredReadAccessVerified = qwenReadAccessPassed && brollQuotaReadAccessPassed
  const qwenWrapperMayBeCalledAfterConfirmation = qwenReadAccessPassed
  const brollWrapperMayBeCalledAfterConfirmation = brollQuotaReadAccessPassed && brollQuotaSufficientForOneL4Vm
  const brollInferenceWrapperMayBeCalledAfterConfirmation =
    brollWrapperMayBeCalledAfterConfirmation && brollCacheReady
  const externalAgentExecutionAllowedNow = nestedBoolean(nextCommand.json, ['executionAllowedNow'])
  const accountAccessDiagnostic = !allRequiredReadAccessVerified
    ? runScript(
        'external_agent_gcloud_account_access_diagnostic',
        'server/cli/external-agent-gcloud-account-access-diagnostic.ts',
      )
    : undefined
  const accountSelection = nested(preflight.json, ['gcloud', 'accountSelection'])
  const qwenWrapperCommand = withSelectedAccountIndex(spec.qwen.wrapperCommand, accountSelection)
  const brollWrapperCommand = withSelectedAccountIndex(spec.broll.wrapperCommand, accountSelection)
  const brollInferenceWrapperCommand = withSelectedAccountIndex(
    spec.broll.inferenceWrapperCommand,
    accountSelection,
  )

  console.log(
    JSON.stringify(
      {
        ok: preflight.ok && nextCommand.ok && brollCacheReadiness.ok && runtimeGatesAllFalse,
        decision: spec.decision,
        mode: spec.mode,
        liveReadOnlyChecksRun: true,
        projectId: spec.projectId,
        accountSelection,
        preflight: {
          ok: preflight.ok,
          qwenBlocker: nestedString(preflight.json, ['qwen', 'blocker']),
          brollBlocker: nestedString(preflight.json, ['broll', 'blocker']),
          runtimeGatesAllFalse: nestedBoolean(preflight.json, ['runtimeGatesAllFalse']),
        },
        qwen: {
          toolId: spec.qwen.toolId,
          requiredReadPermissions: spec.qwen.requiredReadPermissions,
          readAccessPassed: qwenReadAccessPassed,
          accessTokenRefreshPassed: nestedBoolean(preflight.json, ['qwen', 'accessTokenRefreshPassed']),
          serviceDescribePassed: nestedBoolean(preflight.json, ['qwen', 'serviceDescribePassed']),
          jobDescribePassed: nestedBoolean(preflight.json, ['qwen', 'jobDescribePassed']),
          wrapperMayBeCalledAfterConfirmation: qwenWrapperMayBeCalledAfterConfirmation,
          wrapperCommand: qwenWrapperCommand,
          wrapperShellExample: `${spec.qwen.confirmationEnv}=true ${qwenWrapperCommand}`,
          confirmationEnv: spec.qwen.confirmationEnv,
        },
        broll: {
          toolId: spec.broll.toolId,
          requiredReadPermissions: spec.broll.requiredReadPermissions,
          quotaReadAccessPassed: brollQuotaReadAccessPassed,
          projectQuotaReadPassed: nestedBoolean(preflight.json, ['broll', 'projectQuotaReadPassed']),
          regionQuotaReadPassed: nestedBoolean(preflight.json, ['broll', 'regionQuotaReadPassed']),
          quotaSufficientForOneL4Vm: brollQuotaSufficientForOneL4Vm,
          cacheReady: brollCacheReady,
          cacheReadiness: {
            ok: brollCacheReadiness.ok,
            exitCode: brollCacheReadiness.exitCode,
            cachePathExists: nestedBoolean(brollCacheReadiness.json, ['cachePathExists']),
            aggregateBytesMatches: nestedBoolean(brollCacheReadiness.json, ['aggregateBytesMatches']),
            modelIndexClassNameMatches: nestedBoolean(brollCacheReadiness.json, [
              'modelIndexClassNameMatches',
            ]),
            indexRefsLocal: nestedBoolean(brollCacheReadiness.json, ['indexRefsLocal']),
            runtimeGatesAllFalse: nestedBoolean(brollCacheReadiness.json, ['runtimeGatesAllFalse']),
            stderrSummary: brollCacheReadiness.stderrSummary,
          },
          wrapperMayBeCalledAfterConfirmation: brollWrapperMayBeCalledAfterConfirmation,
          wrapperCommand: brollWrapperCommand,
          wrapperShellExample: `${spec.broll.confirmationEnv}=true ${brollWrapperCommand}`,
          confirmationEnv: spec.broll.confirmationEnv,
          inferenceWrapperMayBeCalledAfterConfirmation:
            brollInferenceWrapperMayBeCalledAfterConfirmation,
          inferenceWrapperCommand: brollInferenceWrapperCommand,
          inferenceWrapperShellExample: `${spec.broll.inferenceConfirmationEnv}=true ${brollInferenceWrapperCommand}`,
          inferenceConfirmationEnv: spec.broll.inferenceConfirmationEnv,
        },
        nextCommand: {
          ok: nextCommand.ok,
          executionAllowedNow: externalAgentExecutionAllowedNow,
          readyForAnyExternalAgentExecutionNow: nestedBoolean(nextCommand.json, ['readyForAnyExternalAgentExecutionNow']),
          chosenNextCommand: nestedString(nextCommand.json, ['chosenNextCommand']),
          manualActionReason: nestedString(nextCommand.json, ['manualActionReason']),
        },
        accountAccessDiagnostic: accountAccessDiagnostic
          ? {
              ok: accountAccessDiagnostic.ok,
              exitCode: accountAccessDiagnostic.exitCode,
              accountCount: nestedNumber(accountAccessDiagnostic.json, ['accountCount']) ?? 0,
              qwenReadyAccountCount:
                nestedNumber(accountAccessDiagnostic.json, ['qwenReadyAccountCount']) ?? 0,
              brollQuotaReadAccountCount:
                nestedNumber(accountAccessDiagnostic.json, ['brollQuotaReadAccountCount']) ?? 0,
              brollQuotaReadyAccountCount:
                nestedNumber(accountAccessDiagnostic.json, ['brollQuotaReadyAccountCount']) ?? 0,
              anyAccountReadyForBoth: nestedBoolean(accountAccessDiagnostic.json, ['anyAccountReadyForBoth']),
              selectedAccountRepairRequest: nested(accountAccessDiagnostic.json, [
                'selectedAccountRepairRequest',
              ]),
              recommendedNextPrompt: nestedString(accountAccessDiagnostic.json, ['recommendedNextPrompt']),
            }
          : undefined,
        allRequiredReadAccessVerified,
        readyForAnyExternalAgentExecutionNow: externalAgentExecutionAllowedNow,
        runtimeGatesAllFalse,
        runtimeSideEffects: spec.runtimeSideEffects,
        recommendedNextPrompt: allRequiredReadAccessVerified
          ? spec.recommendedNextPromptIfVerified
          : nestedString(accountAccessDiagnostic?.json, ['recommendedNextPrompt']) ??
            spec.recommendedNextPromptIfAccessBlocked,
      },
      null,
      2,
    ),
  )
}

main()
