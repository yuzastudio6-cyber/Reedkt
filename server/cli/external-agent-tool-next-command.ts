import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN } from '../../src/backend/mock/mock-external-agent-gcp-access-repair-plan'
import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'
import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

type ProbeResult = {
  id: string
  ok: boolean
  exitCode: number | null
  json?: Record<string, unknown>
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

function sanitize(value: string | undefined): string | undefined {
  if (!value) return undefined

  let output = value
  for (const [label, pattern] of TOKEN_LIKE_PATTERNS) {
    output = output.replace(pattern, `<redacted ${label}>`)
  }

  return output.trim().slice(0, 700) || undefined
}

function runProbe(id: string, script: string): ProbeResult {
  const result = spawnSync('npx', ['tsx', script], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 6,
    env: childEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const stdout = String(result.stdout ?? '')

  let json: Record<string, unknown> | undefined
  try {
    json = JSON.parse(stdout) as Record<string, unknown>
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
    [EXTERNAL_AGENT_TOOL_NEXT_COMMAND.accountSelection.overrideIndexEnv]: rawIndex,
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

function nestedBoolean(document: Record<string, unknown> | undefined, keys: string[]): boolean {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return false
    value = (value as Record<string, unknown>)[key]
  }
  return value === true
}

function nestedString(document: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return undefined
    value = (value as Record<string, unknown>)[key]
  }
  return typeof value === 'string' ? value : undefined
}

function nestedUnknown(document: Record<string, unknown> | undefined, keys: string[]): unknown {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return undefined
    value = (value as Record<string, unknown>)[key]
  }
  return value
}

function nestedArray(document: Record<string, unknown> | undefined, keys: string[]): unknown[] | undefined {
  const value = nestedUnknown(document, keys)
  return Array.isArray(value) ? value : undefined
}

function objectString(row: Record<string, unknown>, key: string): string | undefined {
  const value = row[key]
  return typeof value === 'string' ? value : undefined
}

function executionGateToolSummaries(document: Record<string, unknown> | undefined) {
  const rows = nestedArray(document, ['toolRows']) ?? []
  const toolsById = new Map(EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.tools.map((tool) => [tool.toolId, tool]))

  return rows
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object' && !Array.isArray(row))
    .map((row) => {
      const toolId = objectString(row, 'toolId')
      const rollupTool = toolId ? toolsById.get(toolId) : undefined

      return {
        toolId,
        executionAllowedNow: row.executionAllowedNow === true,
        staticExplicitToolGateReady: row.staticExplicitToolGateReady === true,
        currentBlocker: objectString(row, 'currentBlocker'),
        safeNextCommand: objectString(row, 'safeNextCommand'),
        manualBlockerActions: rollupTool?.manualBlockerActions ?? [],
        noIdleLifecycleGate:
          row.noIdleLifecycleGate && typeof row.noIdleLifecycleGate === 'object' && !Array.isArray(row.noIdleLifecycleGate)
            ? row.noIdleLifecycleGate
            : undefined,
      }
    })
}

function gcloudDiagnosticSummary(document: Record<string, unknown> | undefined) {
  if (!document) return undefined

  return {
    path: nestedString(document, ['gcloud', 'path']),
    pathCandidates: nestedArray(document, ['gcloud', 'pathCandidates']),
    pathCandidateCount: nestedUnknown(document, ['gcloud', 'pathCandidateCount']),
    pathToolSearchEntries: nestedArray(document, ['gcloud', 'pathToolSearchEntries']),
    pathPrefersAppleSiliconHomebrew: nestedUnknown(document, ['gcloud', 'pathPrefersAppleSiliconHomebrew']),
    appleSiliconHomebrewPrecedesUsrLocal: nestedUnknown(document, [
      'gcloud',
      'appleSiliconHomebrewPrecedesUsrLocal',
    ]),
    expectedAppleSiliconHomebrewPath: nestedString(document, ['gcloud', 'expectedAppleSiliconHomebrewPath']),
    expectedAppleSiliconHomebrewGcloudPresent: nestedUnknown(document, [
      'gcloud',
      'expectedAppleSiliconHomebrewGcloudPresent',
    ]),
    usrLocalGcloudPath: nestedString(document, ['gcloud', 'usrLocalGcloudPath']),
    usrLocalGcloudPresent: nestedUnknown(document, ['gcloud', 'usrLocalGcloudPresent']),
    pathDiagnosticHint: nestedString(document, ['gcloud', 'pathDiagnosticHint']),
    installationSdkRoot: nestedString(document, ['gcloud', 'installationSdkRoot']),
    installationOnPath: nestedUnknown(document, ['gcloud', 'installationOnPath']),
    releaseChannel: nestedString(document, ['gcloud', 'releaseChannel']),
    activeConfigurationName: nestedString(document, ['gcloud', 'activeConfigurationName']),
    globalConfigDir: nestedString(document, ['gcloud', 'globalConfigDir']),
    activeConfigPath: nestedString(document, ['gcloud', 'activeConfigPath']),
    configSdkRoot: nestedString(document, ['gcloud', 'configSdkRoot']),
    universeDomain: nestedString(document, ['gcloud', 'universeDomain']),
    configuredProject: nestedString(document, ['gcloud', 'configuredProject']),
    projectMatches: nestedUnknown(document, ['gcloud', 'projectMatches']),
    activeAccountDomain: nestedString(document, ['gcloud', 'activeAccountDomain']),
    accessTokenRefreshPassed: nestedUnknown(document, ['gcloud', 'accessTokenRefreshPassed']),
    authFailure: nestedUnknown(document, ['gcloud', 'authFailure']),
    likelyMismatch: nestedString(document, ['gcloud', 'likelyMismatch']),
    manualOnlyRepairActions: nestedArray(document, ['manualOnlyRepairActions']),
    postRepairCodexVerificationCommand: nestedString(document, ['postRepairCodexVerificationCommand']),
  }
}

function liveBlockerSummary(document: Record<string, unknown> | undefined) {
  if (!document) return undefined

  return {
    qwen: {
      blocker: nestedString(document, ['qwen', 'blocker']),
      nextAction: nestedString(document, ['qwen', 'nextAction']),
      accessTokenRefreshPassed: nestedUnknown(document, ['qwen', 'accessTokenRefreshPassed']),
      downstreamProbeSkipped: nestedUnknown(document, ['qwen', 'downstreamProbeSkipped']),
      downstreamProbeSkipReason: nestedString(document, ['qwen', 'downstreamProbeSkipReason']),
      readyForExternalAgentExecutionNow: nestedUnknown(document, ['qwen', 'readyForExternalAgentExecutionNow']),
    },
    broll: {
      blocker: nestedString(document, ['broll', 'blocker']),
      nextAction: nestedString(document, ['broll', 'nextAction']),
      quotaProbeSkipped: nestedUnknown(document, ['broll', 'quotaProbeSkipped']),
      quotaProbeSkipReason: nestedString(document, ['broll', 'quotaProbeSkipReason']),
      quotaSufficientForOneL4Vm: nestedUnknown(document, ['broll', 'quotaSufficientForOneL4Vm']),
      readyForExternalAgentExecutionNow: nestedUnknown(document, ['broll', 'readyForExternalAgentExecutionNow']),
    },
  }
}

function accountAccessSummary(document: Record<string, unknown> | undefined) {
  if (!document) return undefined

  return {
    accountCount: nestedUnknown(document, ['accountCount']),
    qwenReadyAccountCount: nestedUnknown(document, ['qwenReadyAccountCount']),
    brollQuotaReadAccountCount: nestedUnknown(document, ['brollQuotaReadAccountCount']),
    brollQuotaReadyAccountCount: nestedUnknown(document, ['brollQuotaReadyAccountCount']),
    anyAccountReadyForBoth: nestedUnknown(document, ['anyAccountReadyForBoth']),
    recommendedNextPrompt: nestedString(document, ['recommendedNextPrompt']),
  }
}

function accountSelectionSummary(spec: typeof EXTERNAL_AGENT_TOOL_NEXT_COMMAND, liveBlockerJson: Record<string, unknown> | undefined) {
  const liveSelection = nestedUnknown(liveBlockerJson, ['gcloud', 'accountSelection'])
  if (liveSelection && typeof liveSelection === 'object' && !Array.isArray(liveSelection)) {
    return liveSelection
  }

  const cliIndex = cliFlagValue(GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG, GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG_ALIAS)
  const envIndex = process.env[spec.accountSelection.overrideIndexEnv]?.trim()
  const rawIndex = cliIndex ?? envIndex
  const parsedIndex = rawIndex ? Number(rawIndex) : undefined

  return {
    ...spec.accountSelection,
    overrideIndexCliFlag: GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG,
    overrideIndexCliFlagAlias: GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG_ALIAS,
    overrideProvided: Boolean(process.env[spec.accountSelection.overrideEnv]?.trim()),
    overrideIndexProvided: Boolean(rawIndex),
    overrideIndexSource: cliIndex ? 'cli' : envIndex ? 'env' : undefined,
    overrideIndex: Number.isInteger(parsedIndex) ? parsedIndex : undefined,
    overrideResolved: Boolean(process.env[spec.accountSelection.overrideEnv]?.trim()),
    cloudSdkCoreAccountEnvProvided: Boolean(process.env.CLOUDSDK_CORE_ACCOUNT?.trim()),
  }
}

function selectedAccountIndex(accountSelection: unknown): number | undefined {
  if (!accountSelection || typeof accountSelection !== 'object' || Array.isArray(accountSelection)) {
    return undefined
  }

  const record = accountSelection as Record<string, unknown>
  const index = record.overrideIndex
  return typeof index === 'number' && Number.isInteger(index) && index > 0 ? index : undefined
}

function applySelectedAccountIndex(value: string | undefined, accountSelection: unknown): string | undefined {
  const index = selectedAccountIndex(accountSelection)
  if (!value || !index) return value

  return value
    .replace(/<account-index>/g, String(index))
    .replace(/<redacted-index>/g, String(index))
}

function withSelectedAccountIndex(command: string | undefined, accountSelection: unknown): string | undefined {
  const index = selectedAccountIndex(accountSelection)
  if (!command || !index || command.includes('--account-index') || command.includes('--gcloud-account-index')) {
    return command
  }

  return `${command} -- --account-index ${index}`
}

function withSelectedAccountIndexArgs(args: readonly string[], accountSelection: unknown): string[] {
  const index = selectedAccountIndex(accountSelection)
  if (!index || args.includes('--account-index') || args.includes('--gcloud-account-index')) {
    return [...args]
  }

  return args.includes('--') ? [...args, '--account-index', String(index)] : [...args, '--', '--account-index', String(index)]
}

function shellExampleFor(
  command: {
    command: string
    args: readonly string[]
    confirmationEnv: string
    confirmationEnvRequiredValue: string
  },
  accountSelection: unknown,
): string {
  return `${command.confirmationEnv}=${command.confirmationEnvRequiredValue} ${[
    command.command,
    ...withSelectedAccountIndexArgs(command.args, accountSelection),
  ].join(' ')}`
}

function gcpAccessRepairGuidance(accountSelection: unknown) {
  const repairPlan = EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN

  return {
    ok: true,
    decision: repairPlan.decision,
    mode: repairPlan.mode,
    projectId: repairPlan.projectId,
    currentLiveBlockers: repairPlan.currentLiveBlockers,
    repairScope: repairPlan.repairScope,
    tools: repairPlan.tools.map((tool) => ({
      ...tool,
      verificationCommand: applySelectedAccountIndex(tool.verificationCommand, accountSelection),
    })),
    failureResponsePolicy: repairPlan.failureResponsePolicy,
    safeRetryChecklist: repairPlan.safeRetryChecklist.map((step) =>
      applySelectedAccountIndex(step, accountSelection) ?? step,
    ),
    postRepairVerificationCommands: repairPlan.postRepairVerificationCommands.map((command) =>
      applySelectedAccountIndex(command, accountSelection) ?? command,
    ),
    runtimeGatesAllFalse: Object.values(repairPlan.runtimeSideEffects).every((value) => value === false),
    runtimeSideEffects: repairPlan.runtimeSideEffects,
  }
}

function main() {
  const spec = EXTERNAL_AGENT_TOOL_NEXT_COMMAND
  const probeById = new Map(spec.allowedProbeScripts.map((probe) => [probe.id, probe]))
  const executionGateProbe = probeById.get('execution_gate')
  const liveBlockerProbe = probeById.get('live_blocker_preflight')
  const gcloudDiagnosticProbe = probeById.get('gcloud_session_diagnostic')
  const accountAccessDiagnosticProbe = probeById.get('gcloud_account_access_diagnostic')

  if (!executionGateProbe || !liveBlockerProbe || !gcloudDiagnosticProbe || !accountAccessDiagnosticProbe) {
    throw new Error('Missing required external-agent next-command probe')
  }

  const executionGate = runProbe(executionGateProbe.id, executionGateProbe.script)
  const liveBlocker = runProbe(liveBlockerProbe.id, liveBlockerProbe.script)
  const qwenAuthRefreshPassed = nestedBoolean(liveBlocker.json, ['qwen', 'accessTokenRefreshPassed'])
  const qwenServiceDescribePassed = nestedBoolean(liveBlocker.json, ['qwen', 'serviceDescribePassed'])
  const qwenJobDescribePassed = nestedBoolean(liveBlocker.json, ['qwen', 'jobDescribePassed'])
  const qwenDownstreamProbeSkipped = nestedUnknown(liveBlocker.json, ['qwen', 'downstreamProbeSkipped']) === true
  const qwenLivePreflightPassed =
    qwenAuthRefreshPassed &&
    qwenServiceDescribePassed &&
    qwenJobDescribePassed &&
    !qwenDownstreamProbeSkipped &&
    nestedString(liveBlocker.json, ['qwen', 'blocker']) === 'cleared'
  const qwenPermissionOrResourceReadBlocked =
    qwenAuthRefreshPassed && !qwenLivePreflightPassed && !qwenDownstreamProbeSkipped
  const brollQuotaSufficient = nestedBoolean(liveBlocker.json, ['broll', 'quotaSufficientForOneL4Vm'])
  const executionGateAllowsRuntime = nestedBoolean(executionGate.json, ['executionAllowedNow'])
  const staticExplicitToolGateReady = nestedBoolean(executionGate.json, ['staticExplicitToolGateReady'])
  const staticExplicitToolGatePrepared = staticExplicitToolGateReady
  const staticExecutionGateAllowed = executionGateAllowsRuntime
  const staticGatePlanningOnly = staticExplicitToolGatePrepared && !executionGateAllowsRuntime
  const staticGateDoesNotAuthorizeRuntime = !executionGateAllowsRuntime
  const gateToolSummaries = executionGateToolSummaries(executionGate.json)
  const executionAllowedNow =
    (executionGateAllowsRuntime || staticExplicitToolGateReady) && qwenLivePreflightPassed
  const qwenLivePreflightVerificationRequired =
    staticExplicitToolGateReady && !qwenLivePreflightPassed
  const shouldRunGcloudDiagnostic = !qwenAuthRefreshPassed
  const gcloudDiagnostic = shouldRunGcloudDiagnostic
    ? runProbe(gcloudDiagnosticProbe.id, gcloudDiagnosticProbe.script)
    : undefined
  const diagnosticSummary = shouldRunGcloudDiagnostic ? gcloudDiagnosticSummary(gcloudDiagnostic?.json) : undefined
  const shouldRunAccountAccessDiagnostic = !qwenLivePreflightPassed
  const accountAccessDiagnostic = shouldRunAccountAccessDiagnostic
    ? runProbe(accountAccessDiagnosticProbe.id, accountAccessDiagnosticProbe.script)
    : undefined
  const accountAccessDiagnosticSummary = shouldRunAccountAccessDiagnostic
    ? accountAccessSummary(accountAccessDiagnostic?.json)
    : undefined
  const blockerSummary = liveBlockerSummary(liveBlocker.json)
  const accountSelection = accountSelectionSummary(spec, liveBlocker.json)
  const diagnosticRecommendedNextPrompt = shouldRunGcloudDiagnostic
    ? nestedString(gcloudDiagnostic?.json, ['recommendedNextPrompt'])
    : undefined

  const chosenNextCommand = executionAllowedNow
    ? undefined
    : !qwenAuthRefreshPassed
      ? spec.nextCommandRules.whenQwenAuthRefreshFails
      : qwenPermissionOrResourceReadBlocked
        ? spec.nextCommandRules.whenGcpReadAccessRepairRequired
      : !qwenLivePreflightPassed || qwenLivePreflightVerificationRequired
        ? spec.nextCommandRules.whenStaticGateAllowsButQwenLivePreflightFails
        : !brollQuotaSufficient
          ? spec.nextCommandRules.whenBrollQuotaNeedsVerification
          : spec.nextCommandRules.whenQwenAuthClearsAndBrollQuotaBlocked
  const rawChosenManualAction = executionAllowedNow
    ? spec.nextCommandRules.whenExecutionGateAllowsRuntime
    : !qwenAuthRefreshPassed
      ? diagnosticRecommendedNextPrompt ??
        nestedString(liveBlocker.json, ['recommendedNextPrompt']) ??
        spec.nextCommandRules.whenQwenAuthRefreshFails
      : qwenPermissionOrResourceReadBlocked
        ? nestedString(liveBlocker.json, ['qwen', 'nextAction']) ??
          nestedString(liveBlocker.json, ['recommendedNextPrompt']) ??
          spec.nextCommandRules.whenStaticGateAllowsButQwenLivePreflightFails
      : qwenLivePreflightVerificationRequired
        ? spec.nextCommandRules.whenQwenLivePreflightPassesButExecutionGateBlocked
        : nestedString(liveBlocker.json, ['recommendedNextPrompt']) ?? spec.defaultDecision
  const chosenManualAction = applySelectedAccountIndex(rawChosenManualAction, accountSelection)
  const authManualActionRule = spec.manualActionRules.whenQwenAuthRefreshFails
  const readAccessManualActionRule = spec.manualActionRules.whenQwenPermissionOrResourceReadFails
  const manualActionRequired =
    (!qwenAuthRefreshPassed && authManualActionRule.required) ||
    (qwenPermissionOrResourceReadBlocked && readAccessManualActionRule.required)
  const manualActionReason = !qwenAuthRefreshPassed
    ? authManualActionRule.reason
    : qwenPermissionOrResourceReadBlocked
      ? readAccessManualActionRule.reason
      : undefined
  const manualActionBlocksRuntime = !qwenAuthRefreshPassed
    ? authManualActionRule.blocksRuntime
    : qwenPermissionOrResourceReadBlocked
      ? readAccessManualActionRule.blocksRuntime
      : undefined
  const rawRerunAfterManualAction = !qwenAuthRefreshPassed
    ? authManualActionRule.rerunAfterManualAction
    : qwenPermissionOrResourceReadBlocked
      ? readAccessManualActionRule.rerunAfterManualAction
      : undefined
  const rerunAfterManualAction = withSelectedAccountIndex(rawRerunAfterManualAction, accountSelection)
  const chosenNextCommandAlreadyExecutedInThisRun =
    chosenNextCommand === spec.nextCommandRules.whenQwenAuthRefreshFails && shouldRunGcloudDiagnostic
  const codexRunnableNextCommandNow =
    manualActionRequired || chosenNextCommandAlreadyExecutedInThisRun ? undefined : chosenNextCommand
  const qwenBoundedExecutionCommand = executionAllowedNow
    ? {
        ...spec.qwenBoundedExecutionCommand,
        args: withSelectedAccountIndexArgs(spec.qwenBoundedExecutionCommand.args, accountSelection),
        shellExample: shellExampleFor(spec.qwenBoundedExecutionCommand, accountSelection),
      }
    : null
  const qwenExternalAgentExecutionCommand = executionAllowedNow
    ? {
        ...spec.qwenExternalAgentExecutionCommand,
        args: withSelectedAccountIndexArgs(spec.qwenExternalAgentExecutionCommand.args, accountSelection),
        shellExample: shellExampleFor(spec.qwenExternalAgentExecutionCommand, accountSelection),
      }
    : null
  const brollWanExternalAgentProofCommand = {
    ...spec.brollWanExternalAgentProofCommand,
    args: withSelectedAccountIndexArgs(spec.brollWanExternalAgentProofCommand.args, accountSelection),
    executionAllowedNow: false,
    blocker: nestedString(liveBlocker.json, ['broll', 'blocker']) ?? 'broll_preflight_not_cleared',
    shellExample: shellExampleFor(spec.brollWanExternalAgentProofCommand, accountSelection),
  }
  const brollWanPrivateCachePrepareCommand = {
    ...spec.brollWanPrivateCachePrepareCommand,
    args: withSelectedAccountIndexArgs(spec.brollWanPrivateCachePrepareCommand.args, accountSelection),
    executionAllowedNow: false,
    blocker: 'private_gcs_model_cache_marker_missing_or_unverified',
    shellExample: shellExampleFor(spec.brollWanPrivateCachePrepareCommand, accountSelection),
  }
  const soundMusicAudioEvidenceCommand = {
    ...spec.soundMusicAudioEvidenceCommand,
    args: withSelectedAccountIndexArgs(spec.soundMusicAudioEvidenceCommand.args, accountSelection),
    executionAllowedNow: false,
    blocker: 'real_provider_worker_storage_track_qa_billing_export_handoffs_required',
    shellExample: shellExampleFor(spec.soundMusicAudioEvidenceCommand, accountSelection),
  }
  const supabaseLocalHarnessEvidenceCommand = {
    ...spec.supabaseLocalHarnessEvidenceCommand,
    args: withSelectedAccountIndexArgs(spec.supabaseLocalHarnessEvidenceCommand.args, accountSelection),
    executionAllowedNow: false,
    blocker: 'not_a_model_or_media_execution_lane_on_this_branch',
    shellExample: shellExampleFor(spec.supabaseLocalHarnessEvidenceCommand, accountSelection),
  }
  const nextCodexCommandAfterManualAction = manualActionRequired ? rerunAfterManualAction : undefined
  const runtimeGatesAllFalse = Object.values(spec.runtimeSideEffects).every((value) => value === false)
  const probeSummaries = [executionGate, liveBlocker, gcloudDiagnostic, accountAccessDiagnostic]
    .filter((probe): probe is ProbeResult => Boolean(probe))
    .map((probe) => ({
      id: probe.id,
      ok: probe.ok,
      exitCode: probe.exitCode,
      decision: nestedString(probe.json, ['decision']),
      mode: nestedString(probe.json, ['mode']),
      stderrSummary: probe.stderrSummary,
    }))

  console.log(
    JSON.stringify(
      {
        ok:
          executionGate.ok &&
          liveBlocker.ok &&
          (!gcloudDiagnostic || gcloudDiagnostic.ok) &&
          (!accountAccessDiagnostic || accountAccessDiagnostic.ok) &&
          runtimeGatesAllFalse,
        decision: spec.decision,
        mode: spec.mode,
        liveReadOnlyChecksRun: true,
        paidProductionInScope: spec.paidProductionInScope,
        dryRunPassedClaimed: spec.dryRunPassedClaimed,
        generatedLocalFixturePassedClaimed: spec.generatedLocalFixturePassedClaimed,
        accountSelection,
        staticExecutionGateAllowed,
        staticExplicitToolGateReady,
        staticExplicitToolGatePrepared,
        staticGatePlanningOnly,
        staticGateDoesNotAuthorizeRuntime,
        executionGateAllowsRuntime,
        executionGateToolSummaries: gateToolSummaries,
        qwenLivePreflightPassed,
        qwenLivePreflightVerificationRequired,
        qwenServiceDescribePassed,
        qwenJobDescribePassed,
        qwenDownstreamProbeSkipped,
        executionAllowedNow,
        readyForAnyExternalAgentExecutionNow: executionAllowedNow,
        qwenAuthRefreshPassed,
        brollQuotaSufficientForOneL4Vm: brollQuotaSufficient,
        liveBlockerSummary: blockerSummary,
        gcpAccessRepair: gcpAccessRepairGuidance(accountSelection),
        gcloudDiagnosticRun: shouldRunGcloudDiagnostic,
        gcloudDiagnosticSummary: diagnosticSummary,
        gcloudAccountAccessDiagnosticRun: shouldRunAccountAccessDiagnostic,
        gcloudAccountAccessSummary: accountAccessDiagnosticSummary,
        chosenNextCommand,
        chosenNextCommandAlreadyExecutedInThisRun,
        codexRunnableNextCommandNow: codexRunnableNextCommandNow ?? null,
        qwenExternalAgentExecutionCommand,
        qwenBoundedExecutionCommand,
        brollWanExternalAgentProofCommand,
        brollWanPrivateCachePrepareCommand,
        soundMusicAudioEvidenceCommand,
        supabaseLocalHarnessEvidenceCommand,
        chosenManualAction,
        manualActionRequired,
        manualActionReason,
        manualActionBlocksRuntime,
        rerunAfterManualAction,
        nextCodexCommandAfterManualAction,
        probeSummaries,
        forbiddenRuntimeActions: spec.forbiddenRuntimeActions,
        runtimeSideEffects: spec.runtimeSideEffects,
        runtimeGatesAllFalse,
      },
      null,
      2,
    ),
  )
}

main()
