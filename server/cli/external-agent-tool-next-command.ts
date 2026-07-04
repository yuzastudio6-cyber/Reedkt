import { spawnSync } from 'node:child_process'

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

  const rawIndex = process.env[spec.accountSelection.overrideIndexEnv]?.trim()
  const parsedIndex = rawIndex ? Number(rawIndex) : undefined

  return {
    ...spec.accountSelection,
    overrideProvided: Boolean(process.env[spec.accountSelection.overrideEnv]?.trim()),
    overrideIndexProvided: Boolean(rawIndex),
    overrideIndex: Number.isInteger(parsedIndex) ? parsedIndex : undefined,
    overrideResolved: Boolean(process.env[spec.accountSelection.overrideEnv]?.trim()),
    cloudSdkCoreAccountEnvProvided: Boolean(process.env.CLOUDSDK_CORE_ACCOUNT?.trim()),
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
  const chosenManualAction = executionAllowedNow
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
  const rerunAfterManualAction = !qwenAuthRefreshPassed
    ? authManualActionRule.rerunAfterManualAction
    : qwenPermissionOrResourceReadBlocked
      ? readAccessManualActionRule.rerunAfterManualAction
      : undefined
  const chosenNextCommandAlreadyExecutedInThisRun =
    chosenNextCommand === spec.nextCommandRules.whenQwenAuthRefreshFails && shouldRunGcloudDiagnostic
  const codexRunnableNextCommandNow =
    manualActionRequired || chosenNextCommandAlreadyExecutedInThisRun ? undefined : chosenNextCommand
  const qwenBoundedExecutionCommand = executionAllowedNow
    ? {
        ...spec.qwenBoundedExecutionCommand,
        shellExample: `${spec.qwenBoundedExecutionCommand.confirmationEnv}=${spec.qwenBoundedExecutionCommand.confirmationEnvRequiredValue} ${[
          spec.qwenBoundedExecutionCommand.command,
          ...spec.qwenBoundedExecutionCommand.args,
        ].join(' ')}`,
      }
    : null
  const qwenExternalAgentExecutionCommand = executionAllowedNow
    ? {
        ...spec.qwenExternalAgentExecutionCommand,
        shellExample: `${spec.qwenExternalAgentExecutionCommand.confirmationEnv}=${spec.qwenExternalAgentExecutionCommand.confirmationEnvRequiredValue} ${[
          spec.qwenExternalAgentExecutionCommand.command,
          ...spec.qwenExternalAgentExecutionCommand.args,
        ].join(' ')}`,
      }
    : null
  const brollWanExternalAgentProofCommand = {
    ...spec.brollWanExternalAgentProofCommand,
    executionAllowedNow: false,
    blocker: nestedString(liveBlocker.json, ['broll', 'blocker']) ?? 'broll_preflight_not_cleared',
    shellExample: `${spec.brollWanExternalAgentProofCommand.confirmationEnv}=${spec.brollWanExternalAgentProofCommand.confirmationEnvRequiredValue} ${[
      spec.brollWanExternalAgentProofCommand.command,
      ...spec.brollWanExternalAgentProofCommand.args,
    ].join(' ')}`,
  }
  const brollWanPrivateCachePrepareCommand = {
    ...spec.brollWanPrivateCachePrepareCommand,
    executionAllowedNow: false,
    blocker: 'private_gcs_model_cache_marker_missing_or_unverified',
    shellExample: `${spec.brollWanPrivateCachePrepareCommand.confirmationEnv}=${spec.brollWanPrivateCachePrepareCommand.confirmationEnvRequiredValue} ${[
      spec.brollWanPrivateCachePrepareCommand.command,
      ...spec.brollWanPrivateCachePrepareCommand.args,
    ].join(' ')}`,
  }
  const soundMusicAudioEvidenceCommand = {
    ...spec.soundMusicAudioEvidenceCommand,
    executionAllowedNow: false,
    blocker: 'real_provider_worker_storage_track_qa_billing_export_handoffs_required',
    shellExample: `${spec.soundMusicAudioEvidenceCommand.confirmationEnv}=${spec.soundMusicAudioEvidenceCommand.confirmationEnvRequiredValue} ${[
      spec.soundMusicAudioEvidenceCommand.command,
      ...spec.soundMusicAudioEvidenceCommand.args,
    ].join(' ')}`,
  }
  const supabaseLocalHarnessEvidenceCommand = {
    ...spec.supabaseLocalHarnessEvidenceCommand,
    executionAllowedNow: false,
    blocker: 'not_a_model_or_media_execution_lane_on_this_branch',
    shellExample: `${spec.supabaseLocalHarnessEvidenceCommand.confirmationEnv}=${spec.supabaseLocalHarnessEvidenceCommand.confirmationEnvRequiredValue} ${[
      spec.supabaseLocalHarnessEvidenceCommand.command,
      ...spec.supabaseLocalHarnessEvidenceCommand.args,
    ].join(' ')}`,
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
        accountSelection: accountSelectionSummary(spec, liveBlocker.json),
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
