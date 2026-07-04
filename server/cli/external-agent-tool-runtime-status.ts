import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

type JsonRecord = Record<string, unknown>

const GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV = 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX'
const GCLOUD_ACCOUNT_OVERRIDE_ENV = 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT'
const GCP_READ_ACCESS_REPAIR_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: grant or select a local gcloud account with Cloud Run and Compute quota read access for project reeditpro, then rerun npm run external-agent-tool-blockers:preflight -- --account-index <account-index>'

const TOOL_COMMANDS: Record<
  string,
  {
    staticGuardCommand: string
    safePreflightCommand?: string
    executionCommand: string
    confirmationEnv: string
    runtimeKind: 'bounded_model_runtime' | 'metadata_evidence_only' | 'local_harness_evidence_only'
  }
> = {
  qwen2_5_vl_7b_instruct: {
    staticGuardCommand: 'npm run external-agent-tool-execute-qwen -- --json',
    safePreflightCommand: 'npm run external-agent-tool-execute-qwen -- --preflight-only --json',
    executionCommand: 'npm run external-agent-tool-execute-qwen -- --execute --json',
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION',
    runtimeKind: 'bounded_model_runtime',
  },
  ai_video_broll_generation_wan: {
    staticGuardCommand: 'npm run external-agent-tool-execute-broll-wan -- --json',
    safePreflightCommand: 'npm run external-agent-tool-execute-broll-wan -- --preflight-only --json',
    executionCommand: 'npm run external-agent-tool-execute-broll-wan -- --execute --json',
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF',
    runtimeKind: 'bounded_model_runtime',
  },
  sound_music_audio: {
    staticGuardCommand: 'npm run external-agent-tool-execute-sound -- --json',
    executionCommand: 'npm run external-agent-tool-execute-sound -- --execute --json',
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW',
    runtimeKind: 'metadata_evidence_only',
  },
  supabase_local_fixture_harness: {
    staticGuardCommand: 'npm run external-agent-tool-execute-supabase-harness -- --json',
    executionCommand: 'npm run external-agent-tool-execute-supabase-harness -- --execute --json',
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW',
    runtimeKind: 'local_harness_evidence_only',
  },
}

function readArgValue(names: string[]): string | undefined {
  for (const name of names) {
    const equalsPrefix = `${name}=`
    const equalsMatch = process.argv.find((arg) => arg.startsWith(equalsPrefix))
    if (equalsMatch) return equalsMatch.slice(equalsPrefix.length).trim()

    const index = process.argv.indexOf(name)
    if (index >= 0) {
      const next = process.argv[index + 1]?.trim()
      if (next && !next.startsWith('--')) return next
    }
  }

  return undefined
}

function resolveAccountIndexOverride(): {
  cliAccountIndexProvided: boolean
  cliAccountIndex?: number
  cliAccountIndexValid: boolean
  childEnv: NodeJS.ProcessEnv
} {
  const rawIndex = readArgValue(['--account-index', '--gcloud-account-index'])
  if (!rawIndex) {
    return {
      cliAccountIndexProvided: false,
      cliAccountIndexValid: false,
      childEnv: process.env,
    }
  }

  const parsedIndex = Number(rawIndex)
  const cliAccountIndexValid = Number.isInteger(parsedIndex) && parsedIndex > 0
  return {
    cliAccountIndexProvided: true,
    cliAccountIndex: Number.isFinite(parsedIndex) ? parsedIndex : undefined,
    cliAccountIndexValid,
    childEnv: cliAccountIndexValid
      ? {
          ...process.env,
          [GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV]: String(parsedIndex),
        }
      : process.env,
  }
}

function resolveSelectedAccountIndexArg(
  accountIndexOverride: ReturnType<typeof resolveAccountIndexOverride>,
): string | undefined {
  if (
    !accountIndexOverride.cliAccountIndexProvided ||
    !accountIndexOverride.cliAccountIndexValid ||
    typeof accountIndexOverride.cliAccountIndex !== 'number'
  ) {
    return undefined
  }

  return `--account-index ${accountIndexOverride.cliAccountIndex}`
}

function appendSelectedAccountIndex(command: string | undefined, accountIndexArg: string | undefined) {
  if (!command || !accountIndexArg) return undefined
  if (command.includes('--account-index') || command.includes('--gcloud-account-index')) return command

  return `${command} ${accountIndexArg}`
}

function compactRecord<T extends Record<string, string | undefined>>(record: T) {
  return Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
}

function runJson(id: string, command: string, args: string[], childEnv: NodeJS.ProcessEnv) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: childEnv,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 24,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let json: JsonRecord | undefined
  try {
    json = JSON.parse(String(result.stdout ?? '')) as JsonRecord
  } catch {
    json = undefined
  }

  return {
    id,
    ok: result.status === 0 && Boolean(json),
    exitCode: result.status,
    json,
    stderrSummary: String(result.stderr ?? '').trim().slice(0, 1200) || undefined,
  }
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function nestedBoolean(document: JsonRecord | undefined, keys: string[]): boolean {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return false
    value = (value as JsonRecord)[key]
  }
  return value === true
}

function nestedString(document: JsonRecord | undefined, keys: string[]): string | undefined {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return undefined
    value = (value as JsonRecord)[key]
  }
  return typeof value === 'string' ? value : undefined
}

function nestedNumber(document: JsonRecord | undefined, keys: string[]): number | undefined {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return undefined
    value = (value as JsonRecord)[key]
  }
  return typeof value === 'number' ? value : undefined
}

function resolveRecommendedNextPrompt({
  liveChecksRun,
  cliAccountIndexProvided,
  tokenRefreshPassedAccountIndexes,
  readyAccountIndexes,
  nextCommandJson,
  liveGateJson,
}: {
  liveChecksRun: boolean
  cliAccountIndexProvided: boolean
  tokenRefreshPassedAccountIndexes: unknown[]
  readyAccountIndexes: unknown[]
  nextCommandJson: JsonRecord | undefined
  liveGateJson: JsonRecord | undefined
}): string {
  const nextCommandPrompt = liveChecksRun ? nestedString(nextCommandJson, ['chosenManualAction']) : undefined
  const liveGatePrompt = liveChecksRun ? nestedString(liveGateJson, ['recommendedNextPrompt']) : undefined

  if (
    liveChecksRun &&
    !cliAccountIndexProvided &&
    tokenRefreshPassedAccountIndexes.length > 0 &&
    readyAccountIndexes.length === 0
  ) {
    return GCP_READ_ACCESS_REPAIR_PROMPT
  }

  return (
    nextCommandPrompt ??
    liveGatePrompt ??
    EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.recommendedNextPrompt
  )
}

function main() {
  const staticOnly = process.argv.includes('--static-only')
  const accountIndexOverride = resolveAccountIndexOverride()
  const selectedAccountIndexArg = resolveSelectedAccountIndexArg(accountIndexOverride)
  const liveChecksRun = !staticOnly
  const readiness = runJson(
    'static_readiness',
    'npx',
    ['tsx', 'server/cli/external-agent-tool-readiness-check.ts'],
    accountIndexOverride.childEnv,
  )
  const gcpRepairPlan = runJson(
    'gcp_access_repair_plan',
    'npx',
    ['tsx', 'server/cli/external-agent-gcp-access-repair-plan.ts'],
    accountIndexOverride.childEnv,
  )
  const accountAccessDiagnostic = liveChecksRun
    ? runJson(
        'gcloud_account_access_diagnostic',
        'npx',
        ['tsx', 'server/cli/external-agent-gcloud-account-access-diagnostic.ts'],
        accountIndexOverride.childEnv,
      )
    : undefined
  const liveGate = liveChecksRun
    ? runJson(
        'live_execution_gate',
        'npx',
        ['tsx', 'server/cli/external-agent-tool-execution-gate.ts', '--live'],
        accountIndexOverride.childEnv,
      )
    : undefined
  const nextCommand = liveChecksRun
    ? runJson(
        'live_next_command',
        'npx',
        ['tsx', 'server/cli/external-agent-tool-next-command.ts'],
        accountIndexOverride.childEnv,
      )
    : undefined

  const liveGateJson = liveGate?.json
  const nextCommandJson = nextCommand?.json
  const accountAccessDiagnosticJson = accountAccessDiagnostic?.json
  const visibleAccounts = Array.isArray(accountAccessDiagnosticJson?.accountDiagnostics)
    ? accountAccessDiagnosticJson.accountDiagnostics.map((account) => {
        const row = account as JsonRecord
        const blockers = row.blockers && typeof row.blockers === 'object' ? (row.blockers as JsonRecord) : {}
        return {
          accountIndex: row.accountIndex,
          active: row.active,
          tokenRefreshPassed: row.tokenRefreshPassed,
          qwenReadAccessPassed: row.qwenReadAccessPassed,
          brollQuotaReadAccessPassed: row.brollQuotaReadAccessPassed,
          brollQuotaSufficient: row.brollQuotaSufficient,
          blockers,
        }
      })
    : []
  const tokenRefreshPassedAccountIndexes = visibleAccounts
    .filter((account) => account.tokenRefreshPassed === true)
    .map((account) => account.accountIndex)
  const readyAccountIndexes = visibleAccounts
    .filter(
      (account) =>
        account.tokenRefreshPassed === true &&
        account.qwenReadAccessPassed === true &&
        account.brollQuotaReadAccessPassed === true &&
        account.brollQuotaSufficient === true,
    )
    .map((account) => account.accountIndex)
  const liveReadyToolIds = asStringArray(liveGateJson?.readyToolIds)
  const staticExplicitToolGateReadyToolIds = asStringArray(
    liveChecksRun
      ? liveGateJson?.staticExplicitToolGateReadyToolIds
      : readiness.json?.staticExplicitToolGateReadyToolIds,
  )
  const runtimeGatesAllFalse = liveChecksRun
    ? nestedBoolean(liveGateJson, ['runtimeGatesAllFalse'])
    : nestedBoolean(readiness.json, ['runtimeGatesAllFalse'])
  const liveExecutionAllowedNow = liveChecksRun
    ? nestedBoolean(liveGateJson, ['executionAllowedNow']) &&
      nestedBoolean(nextCommandJson, ['executionAllowedNow'])
    : false

  const toolRows = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.tools.map((tool) => {
    const commands = TOOL_COMMANDS[tool.toolId]
    const agentCallable = Boolean(commands)
    const staticExplicitToolGateReady = staticExplicitToolGateReadyToolIds.includes(tool.toolId)
    const executionAllowedNow =
      liveChecksRun && liveExecutionAllowedNow && liveReadyToolIds.includes(tool.toolId)
    const runtimeExecutableNow =
      executionAllowedNow && commands?.runtimeKind === 'bounded_model_runtime'
    const supportingEvidenceOnly =
      commands?.runtimeKind === 'metadata_evidence_only' ||
      commands?.runtimeKind === 'local_harness_evidence_only'
    const safeEvidenceReviewExecutableNow = agentCallable && supportingEvidenceOnly && runtimeGatesAllFalse

    return {
      toolId: tool.toolId,
      lane: tool.lane,
      selectedModelOrTool: tool.selectedModelOrTool,
      agentCallable,
      wrapperStaticGuardCommand: commands?.staticGuardCommand,
      safePreflightCommand: commands?.safePreflightCommand,
      executionCommand: commands?.executionCommand,
      accountIndexedCommands:
        selectedAccountIndexArg && commands
          ? compactRecord({
              wrapperStaticGuardCommand: appendSelectedAccountIndex(
                commands.staticGuardCommand,
                selectedAccountIndexArg,
              ),
              safePreflightCommand: appendSelectedAccountIndex(
                commands.safePreflightCommand,
                selectedAccountIndexArg,
              ),
              executionCommand: appendSelectedAccountIndex(commands.executionCommand, selectedAccountIndexArg),
            })
          : undefined,
      confirmationEnv: commands?.confirmationEnv,
      runtimeKind: commands?.runtimeKind,
      staticStatus: tool.status,
      staticExplicitToolGateReady,
      liveChecksRun,
      executionAllowedNow,
      runtimeExecutableNow,
      supportingEvidenceOnly,
      safeEvidenceReviewExecutableNow,
      selectedGpu: tool.selectedGpu,
      scaleToZeroRequired: tool.scaleToZeroRequired,
      currentBlocker:
        liveChecksRun && tool.toolId === 'qwen2_5_vl_7b_instruct'
          ? nestedString(nextCommandJson, ['liveBlockerSummary', 'qwen', 'blocker']) ?? tool.primaryBlocker
          : liveChecksRun && tool.toolId === 'ai_video_broll_generation_wan'
            ? nestedString(nextCommandJson, ['liveBlockerSummary', 'broll', 'blocker']) ??
              tool.primaryBlocker
            : tool.primaryBlocker,
      nextAction:
        liveChecksRun && tool.toolId === 'qwen2_5_vl_7b_instruct'
          ? nestedString(nextCommandJson, ['liveBlockerSummary', 'qwen', 'nextAction']) ??
            tool.nextAction
          : liveChecksRun && tool.toolId === 'ai_video_broll_generation_wan'
            ? nestedString(nextCommandJson, ['liveBlockerSummary', 'broll', 'nextAction']) ??
              tool.nextAction
            : tool.nextAction,
      noIdleLifecycleGate: tool.noIdleLifecycleGate,
    }
  })

  const runtimeExecutableToolIds = toolRows
    .filter((tool) => tool.runtimeExecutableNow)
    .map((tool) => tool.toolId)
  const safeEvidenceReviewToolIds = toolRows
    .filter((tool) => tool.safeEvidenceReviewExecutableNow)
    .map((tool) => tool.toolId)
  const agentCallableToolIds = toolRows.filter((tool) => tool.agentCallable).map((tool) => tool.toolId)

  const report = {
    ok: readiness.ok && (!liveChecksRun || liveGate?.ok === true) && runtimeGatesAllFalse,
    mode: 'external_agent_tool_runtime_status_report',
    decision: runtimeExecutableToolIds.length
      ? 'external_agent_runtime_execution_ready_for_some_tools'
      : liveChecksRun
        ? 'external_agent_tools_callable_runtime_execution_blocked'
        : 'external_agent_tools_callable_static_status_only',
    liveChecksRun,
    paidProductionInScope: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
    agentCallableToolCount: agentCallableToolIds.length,
    agentCallableToolIds,
    runtimeExecutableToolCount: runtimeExecutableToolIds.length,
    runtimeExecutableToolIds,
    readyForAnyExternalAgentRuntimeExecutionNow: runtimeExecutableToolIds.length > 0,
    safeEvidenceReviewToolCount: safeEvidenceReviewToolIds.length,
    safeEvidenceReviewToolIds,
    readyForAnyExternalAgentSafeEvidenceReviewNow: safeEvidenceReviewToolIds.length > 0,
    staticExplicitToolGateReadyToolIds,
    runtimeGatesAllFalse,
    liveGate: liveChecksRun
      ? {
          ok: liveGate?.ok === true,
          decision: liveGateJson?.decision,
          executionAllowedNow: liveGateJson?.executionAllowedNow,
          readyForAnyExternalAgentExecutionNow: liveGateJson?.readyForAnyExternalAgentExecutionNow,
          blockedToolIds: liveGateJson?.blockedToolIds,
          liveVerifier: {
            allRequiredReadAccessVerified: nestedBoolean(liveGateJson, [
              'liveVerifier',
              'allRequiredReadAccessVerified',
            ]),
            qwenReadAccessPassed: nestedBoolean(liveGateJson, [
              'liveVerifier',
              'qwenReadAccessPassed',
            ]),
            brollQuotaReadAccessPassed: nestedBoolean(liveGateJson, [
              'liveVerifier',
              'brollQuotaReadAccessPassed',
            ]),
            brollQuotaSufficientForOneL4Vm: nestedBoolean(liveGateJson, [
              'liveVerifier',
              'brollQuotaSufficientForOneL4Vm',
            ]),
            accountAccessDiagnostic: {
              accountCount: nestedNumber(liveGateJson, [
                'liveVerifier',
                'accountAccessDiagnostic',
                'accountCount',
              ]),
              qwenReadyAccountCount: nestedNumber(liveGateJson, [
                'liveVerifier',
                'accountAccessDiagnostic',
                'qwenReadyAccountCount',
              ]),
              brollQuotaReadAccountCount: nestedNumber(liveGateJson, [
                'liveVerifier',
                'accountAccessDiagnostic',
                'brollQuotaReadAccountCount',
              ]),
              brollQuotaReadyAccountCount: nestedNumber(liveGateJson, [
                'liveVerifier',
                'accountAccessDiagnostic',
                'brollQuotaReadyAccountCount',
              ]),
              anyAccountReadyForBoth: nestedBoolean(liveGateJson, [
                'liveVerifier',
                'accountAccessDiagnostic',
                'anyAccountReadyForBoth',
              ]),
            },
          },
        }
      : undefined,
    gcpAccessRepair: {
      ok: gcpRepairPlan.ok,
      decision: gcpRepairPlan.json?.decision,
      mode: gcpRepairPlan.json?.mode,
      projectId: gcpRepairPlan.json?.projectId,
      currentLiveBlockers: gcpRepairPlan.json?.currentLiveBlockers,
      repairScope: gcpRepairPlan.json?.repairScope,
      tools: Array.isArray(gcpRepairPlan.json?.tools)
        ? gcpRepairPlan.json.tools.map((tool) => {
            const row = tool as JsonRecord
            return {
              toolId: row.toolId,
              blocker: row.blocker,
              likelyMinimalRole: row.likelyMinimalRole,
              requiredResourceScope: row.requiredResourceScope,
              requiredReadPermissions: row.requiredReadPermissions,
              verificationCommand: row.verificationCommand,
              failureMeaning: row.failureMeaning,
              safeRepairChecklist: row.safeRepairChecklist,
              unsafeBypasses: row.unsafeBypasses,
              runtimeExecutionStillRequiresWrapperGate: row.runtimeExecutionStillRequiresWrapperGate,
            }
          })
        : [],
      failureResponsePolicy: gcpRepairPlan.json?.failureResponsePolicy,
      safeRetryChecklist: gcpRepairPlan.json?.safeRetryChecklist,
      postRepairVerificationCommands: gcpRepairPlan.json?.postRepairVerificationCommands,
      runtimeGatesAllFalse: gcpRepairPlan.json?.runtimeGatesAllFalse,
      runtimeSideEffects: gcpRepairPlan.json?.runtimeSideEffects,
    },
    accountSelectionGuidance: {
      diagnosticCommand: 'npm run external-agent-gcloud-account-access:diagnostic',
      overrideIndexEnv: GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV,
      overrideEnv: GCLOUD_ACCOUNT_OVERRIDE_ENV,
      cliAccountIndexFlag: '--account-index <account-index>',
      cliGcloudAccountIndexFlagAlias: '--gcloud-account-index <account-index>',
      cliAccountIndexProvided: accountIndexOverride.cliAccountIndexProvided,
      cliAccountIndex: accountIndexOverride.cliAccountIndex,
      cliAccountIndexValid: accountIndexOverride.cliAccountIndexValid,
      cliAccountIndexMapsToChildEnv:
        accountIndexOverride.cliAccountIndexProvided && accountIndexOverride.cliAccountIndexValid,
      indexedRuntimeStatusCommand:
        'npm run external-agent-tool-runtime-status -- --account-index <account-index>',
      indexedPreflightCommand:
        'npm run external-agent-tool-blockers:preflight -- --account-index <account-index>',
      indexedAccessVerifyCommand:
        'npm run external-agent-gcp-access:verify -- --account-index <account-index>',
      mutatesLocalGcloudConfig: false,
      printsAccountValue: false,
      tokenStdoutSuppressed: true,
      liveAccountDiagnosticsRun: liveChecksRun,
      visibleAccountCount: liveChecksRun
        ? nestedNumber(accountAccessDiagnosticJson, ['accountCount'])
        : undefined,
      tokenRefreshPassedAccountIndexes: liveChecksRun ? tokenRefreshPassedAccountIndexes : undefined,
      readyAccountIndexes: liveChecksRun ? readyAccountIndexes : undefined,
      visibleAccounts: liveChecksRun ? visibleAccounts : undefined,
      noReadyAccountInterpretation:
        liveChecksRun && readyAccountIndexes.length === 0
          ? 'no visible local account can currently satisfy both Qwen Cloud Run read access and B-roll quota read/quota sufficiency'
          : undefined,
      nextAfterAccountRepair:
        'npm run external-agent-tool-runtime-status -- --account-index <account-index>',
    },
    nextCommand: liveChecksRun
      ? {
          ok: nextCommand?.ok === true,
          chosenNextCommand: nextCommandJson?.chosenNextCommand,
          chosenNextCommandAlreadyExecutedInThisRun:
            nextCommandJson?.chosenNextCommandAlreadyExecutedInThisRun,
          manualActionRequired: nextCommandJson?.manualActionRequired,
          manualActionReason: nextCommandJson?.manualActionReason,
          rerunAfterManualAction: nextCommandJson?.rerunAfterManualAction,
        }
      : undefined,
    tools: toolRows,
    safeAgentCommands: {
      staticReadiness: 'npm run external-agent-tool-readiness:check',
      liveStatus: 'npm run external-agent-tool-runtime-status',
      liveGate: 'npm run external-agent-tool-execution-gate -- --live',
      nextCommand: 'npm run external-agent-tool-next-command',
      qwenPreflight: TOOL_COMMANDS.qwen2_5_vl_7b_instruct.safePreflightCommand,
      brollPreflight: TOOL_COMMANDS.ai_video_broll_generation_wan.safePreflightCommand,
      brollInferencePreflight:
        'npm run external-agent-tool-execute-broll-wan -- --inference-proof --preflight-only --json',
      soundEvidenceReview: TOOL_COMMANDS.sound_music_audio.executionCommand,
      supabaseHarnessEvidenceReview: TOOL_COMMANDS.supabase_local_fixture_harness.executionCommand,
      accountIndexed:
        selectedAccountIndexArg
          ? compactRecord({
              liveStatus: `npm run external-agent-tool-runtime-status -- ${selectedAccountIndexArg}`,
              liveGate: `npm run external-agent-tool-execution-gate -- --live ${selectedAccountIndexArg}`,
              nextCommand: `npm run external-agent-tool-next-command -- ${selectedAccountIndexArg}`,
              blockerPreflight: `npm run external-agent-tool-blockers:preflight -- ${selectedAccountIndexArg}`,
              gcpAccessVerify: `npm run external-agent-gcp-access:verify -- ${selectedAccountIndexArg}`,
              qwenPreflight: appendSelectedAccountIndex(
                TOOL_COMMANDS.qwen2_5_vl_7b_instruct.safePreflightCommand,
                selectedAccountIndexArg,
              ),
              brollPreflight: appendSelectedAccountIndex(
                TOOL_COMMANDS.ai_video_broll_generation_wan.safePreflightCommand,
                selectedAccountIndexArg,
              ),
              brollInferencePreflight: appendSelectedAccountIndex(
                'npm run external-agent-tool-execute-broll-wan -- --inference-proof --preflight-only --json',
                selectedAccountIndexArg,
              ),
              soundEvidenceReview: appendSelectedAccountIndex(
                TOOL_COMMANDS.sound_music_audio.executionCommand,
                selectedAccountIndexArg,
              ),
              supabaseHarnessEvidenceReview: appendSelectedAccountIndex(
                TOOL_COMMANDS.supabase_local_fixture_harness.executionCommand,
                selectedAccountIndexArg,
              ),
            })
          : undefined,
    },
    forbiddenRuntimeActions: [
      'do not execute wrappers without explicit confirmation envs',
      'do not execute model runtime unless this report shows runtimeExecutableNow=true for that tool',
      'do not bypass live GCP read/quota preflight',
      'do not run raw chat as worker input',
      'do not touch Supabase, SQL, storage, signed URLs, credits, beta, or production from this status command',
    ],
    runtimeSideEffects: {
      cloudRunServiceMutated: false,
      cloudRunJobExecuted: false,
      computeVmCreated: false,
      quotaRequestCreated: false,
      dockerRun: false,
      modelImportRun: false,
      modelInferenceRun: false,
      generatedVideoCreated: false,
      generatedAssetsCreated: false,
      providerCallsMade: false,
      workersDispatched: false,
      supabaseTouched: false,
      sqlExecuted: false,
      storageObjectsCreated: false,
      signedUrlsCreated: false,
      publicArtifactsCreated: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
    },
    recommendedNextPrompt: resolveRecommendedNextPrompt({
      liveChecksRun,
      cliAccountIndexProvided: accountIndexOverride.cliAccountIndexProvided,
      tokenRefreshPassedAccountIndexes,
      readyAccountIndexes,
      nextCommandJson,
      liveGateJson,
    }),
    probeSummaries: [
      {
        id: gcpRepairPlan.id,
        ok: gcpRepairPlan.ok,
        exitCode: gcpRepairPlan.exitCode,
        mode: gcpRepairPlan.json?.mode,
        decision: gcpRepairPlan.json?.decision,
      },
      accountAccessDiagnostic
        ? {
            id: accountAccessDiagnostic.id,
            ok: accountAccessDiagnostic.ok,
            exitCode: accountAccessDiagnostic.exitCode,
            mode: accountAccessDiagnostic.json?.mode,
            decision: accountAccessDiagnostic.json?.decision,
          }
        : undefined,
      {
        id: readiness.id,
        ok: readiness.ok,
        exitCode: readiness.exitCode,
        mode: readiness.json?.mode,
        decision: readiness.json?.decision,
      },
      liveGate
        ? {
            id: liveGate.id,
            ok: liveGate.ok,
            exitCode: liveGate.exitCode,
            mode: liveGate.json?.mode,
            decision: liveGate.json?.decision,
          }
        : undefined,
      nextCommand
        ? {
            id: nextCommand.id,
            ok: nextCommand.ok,
            exitCode: nextCommand.exitCode,
            mode: nextCommand.json?.mode,
            decision: nextCommand.json?.decision,
          }
        : undefined,
    ].filter(Boolean),
  }

  console.log(JSON.stringify(report, null, 2))
}

main()
