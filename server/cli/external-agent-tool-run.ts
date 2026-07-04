import { spawnSync } from 'node:child_process'

type JsonRecord = Record<string, unknown>
type ToolId =
  | 'qwen2_5_vl_7b_instruct'
  | 'ai_video_broll_generation_wan'
  | 'sound_music_audio'
  | 'supabase_local_fixture_harness'
type ToolSelection = ToolId | 'all'
type RequestedMode = 'safe' | 'preflight' | 'evidence' | 'runtime'
type RuntimeKind = 'preflight_only' | 'safe_evidence_only'

type ToolDefinition = {
  toolId: ToolId
  safeModes: RequestedMode[]
  runtimeKind: RuntimeKind
  command: string
  args: string[]
  expectedMode: string
  confirmationEnv?: string
  confirmationEnvRequiredValue?: 'true'
}

type AccountSelection = {
  requestedAccountIndex?: string
  accountIndex?: number
  accountArgs: string[]
  autoAccountSelectionRun: boolean
  autoAccountSelection?: JsonRecord
}

const ACCOUNT_INDEX_FLAGS = ['--account-index', '--gcloud-account-index'] as const
const SOUND_CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW'
const SUPABASE_CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW'

const runtimeSideEffectKeys = [
  'runtimeRunNow',
  'modelInferenceRun',
  'modelImportRun',
  'computeVmCreated',
  'cloudRunJobExecuted',
  'cloudRunServiceMutated',
  'providerCallsMade',
  'workersDispatched',
  'mediaProcessingRun',
  'ffmpegRun',
  'supabaseTouched',
  'supabaseCliExecuted',
  'dockerRun',
  'dockerStarted',
  'sqlExecuted',
  'databaseCreated',
  'migrationDeployed',
  'rowsCreated',
  'storageObjectsCreated',
  'signedUrlsCreated',
  'generatedAudioCreated',
  'generatedVideoCreated',
  'generatedAssetsCreated',
  'publicArtifactsCreated',
  'creditMutationCreated',
  'betaUnlocked',
  'productionUnlocked',
  'generatedLocalFixturePassedClaimed',
] as const

function main() {
  const toolSelection = readToolSelection()
  const requestedMode = readRequestedMode()

  if (!toolSelection) {
    print(blockedResult('missing_or_invalid_tool_id', requestedMode, selectedAccountIndex()))
    return
  }

  if (toolSelection === 'all') {
    print(runAllTools(requestedMode))
    return
  }

  const toolId = toolSelection
  const accountSelection = resolveAccountSelection(toolId)
  const definition = toolDefinitions(accountSelection.accountArgs).find((candidate) => candidate.toolId === toolId)
  if (!definition) {
    print(blockedResult('unsupported_tool_id', requestedMode, accountSelection.accountIndex, toolId))
    return
  }

  if (requestedMode === 'runtime') {
    print({
      ok: false,
      mode: 'external_agent_tool_run_runtime_blocked',
      status: 'blocked',
      toolId,
      requestedMode,
      accountIndex: accountSelection.accountIndex,
      ...accountSelectionOutput(accountSelection),
      agentCallableNow: true,
      runtimeExecutableNow: false,
      runtimeKind: definition.runtimeKind,
      blocker: 'runtime_execution_not_allowed_by_current_gate',
      runtimeSideEffects: allRuntimeSideEffectsFalse(),
      runtimeSideEffectsAllFalse: true,
      delegatedCommand: commandLabel(definition),
      childExecuted: false,
      recommendedNextCommand: 'npm run external-agent-tool-next-command',
      recommendedIndexedNextCommand: accountSelection.accountIndex
        ? `npm run external-agent-tool-next-command -- --account-index ${accountSelection.accountIndex}`
        : undefined,
    })
    return
  }

  if (!definition.safeModes.includes(requestedMode)) {
    print({
      ok: false,
      mode: 'external_agent_tool_run_mode_blocked',
      status: 'blocked',
      toolId,
      requestedMode,
      accountIndex: accountSelection.accountIndex,
      ...accountSelectionOutput(accountSelection),
      agentCallableNow: true,
      runtimeExecutableNow: false,
      runtimeKind: definition.runtimeKind,
      blocker: `requested_mode_not_allowed_for_tool:${requestedMode}`,
      allowedModes: definition.safeModes,
      runtimeSideEffects: allRuntimeSideEffectsFalse(),
      runtimeSideEffectsAllFalse: true,
      childExecuted: false,
      recommendedNextCommand: 'npm run external-agent-tool-run -- --tool <tool-id> --mode safe',
    })
    return
  }

  print(runSafeTool(toolId, requestedMode, definition, accountSelection))
}

function runAllTools(requestedMode: RequestedMode): JsonRecord {
  const toolIds: ToolId[] = [
    'qwen2_5_vl_7b_instruct',
    'ai_video_broll_generation_wan',
    'sound_music_audio',
    'supabase_local_fixture_harness',
  ]
  const sharedDiagnostic = requestedAccountIndex() === 'auto' ? runAccountDiagnostic() : undefined

  if (requestedMode === 'runtime') {
    const blockedTools = toolIds.map((toolId) => {
      const accountSelection = resolveAccountSelection(toolId, sharedDiagnostic)
      const definition = toolDefinitions(accountSelection.accountArgs).find((candidate) => candidate.toolId === toolId)
      return {
        toolId,
        accountIndex: accountSelection.accountIndex,
        ...accountSelectionOutput(accountSelection),
        agentCallableNow: true,
        runtimeExecutableNow: false,
        runtimeKind: definition?.runtimeKind,
        blocker: 'runtime_execution_not_allowed_by_current_gate',
        delegatedCommand: definition ? commandLabel(definition) : undefined,
        childExecuted: false,
        runtimeSideEffects: allRuntimeSideEffectsFalse(),
        runtimeSideEffectsAllFalse: true,
      }
    })

    return {
      ok: false,
      mode: 'external_agent_tool_run_batch_runtime_blocked',
      status: 'blocked',
      toolId: 'all',
      requestedMode,
      agentCallableNow: true,
      runtimeExecutableNow: false,
      externalAgentCallableToolCount: toolIds.length,
      runtimeExecutableToolCount: 0,
      childExecuted: false,
      tools: blockedTools,
      runtimeSideEffects: allRuntimeSideEffectsFalse(),
      runtimeSideEffectsAllFalse: true,
      generatedLocalFixturePassedClaimed: false,
      recommendedNextCommand: 'npm run external-agent-tool-next-command',
    }
  }

  if (requestedMode !== 'safe') {
    return {
      ok: false,
      mode: 'external_agent_tool_run_batch_mode_blocked',
      status: 'blocked',
      toolId: 'all',
      requestedMode,
      agentCallableNow: true,
      runtimeExecutableNow: false,
      blocker: `requested_mode_not_allowed_for_batch:${requestedMode}`,
      allowedModes: ['safe', 'runtime'],
      childExecuted: false,
      runtimeSideEffects: allRuntimeSideEffectsFalse(),
      runtimeSideEffectsAllFalse: true,
      generatedLocalFixturePassedClaimed: false,
    }
  }

  const tools = toolIds.map((toolId) => {
    const accountSelection = resolveAccountSelection(toolId, sharedDiagnostic)
    const definition = toolDefinitions(accountSelection.accountArgs).find((candidate) => candidate.toolId === toolId)
    if (!definition) return blockedResult('unsupported_tool_id', requestedMode, accountSelection.accountIndex, toolId)
    return runSafeTool(toolId, requestedMode, definition, accountSelection)
  })
  const runtimeSideEffectsAllFalse = tools.every((tool) => tool.runtimeSideEffectsAllFalse === true)
  const allExpectedModesReturned = tools.every((tool) => tool.expectedModeReturned === true)
  const allStructuredResultsReturned = tools.every((tool) => tool.structuredResultReturned === true)
  const preflightCallableToolIds = tools
    .filter((tool) => tool.runtimeKind === 'preflight_only')
    .map((tool) => tool.toolId)
  const safeEvidenceExecutableToolIds = tools
    .filter((tool) => tool.runtimeKind === 'safe_evidence_only')
    .map((tool) => tool.toolId)

  return {
    ok: allStructuredResultsReturned && allExpectedModesReturned && runtimeSideEffectsAllFalse,
    decision: 'external_agent_tool_run_batch_completed_runtime_still_blocked',
    mode: 'external_agent_tool_run_batch_result',
    status: 'safe_wrappers_completed',
    toolId: 'all',
    requestedMode,
    agentCallableNow: true,
    runtimeExecutableNow: false,
    externalAgentCallableToolCount: tools.length,
    runtimeExecutableToolCount: 0,
    preflightCallableToolIds,
    safeEvidenceExecutableToolIds,
    allStructuredResultsReturned,
    allExpectedModesReturned,
    runtimeSideEffectsAllFalse,
    tools,
    runtimeSideEffects: allRuntimeSideEffectsFalse(),
    generatedLocalFixturePassedClaimed: false,
    recommendedNextCommand: 'npm run external-agent-tool-next-command',
  }
}

function runSafeTool(
  toolId: ToolId,
  requestedMode: RequestedMode,
  definition: ToolDefinition,
  accountSelection: AccountSelection,
): JsonRecord {
  const child = runChild(definition)
  const expectedModeReturned = child.actualMode === definition.expectedMode
  const runtimeSideEffectsAllFalse = Object.values(child.runtimeSideEffects).every((value) => value === false)
  const structuredResultReturned = Boolean(child.json)
  const selectedAccountRepairRequest =
    nestedRecord(child.json, ['selectedAccountRepairRequest']) ??
    nestedRecord(child.json, [
      'liveGate',
      'liveVerifier',
      'accountAccessDiagnostic',
      'selectedAccountRepairRequest',
    ])
  const repairSummary = repairSummaryFrom(toolId, selectedAccountRepairRequest)

  return {
    ok: structuredResultReturned && expectedModeReturned && runtimeSideEffectsAllFalse,
    decision: 'external_agent_tool_run_completed_runtime_still_blocked',
    mode: 'external_agent_tool_run_result',
    status: 'safe_wrapper_completed',
    toolId,
    requestedMode,
    accountIndex: accountSelection.accountIndex,
    ...accountSelectionOutput(accountSelection),
    agentCallableNow: true,
    runtimeExecutableNow: false,
    runtimeKind: definition.runtimeKind,
    safeModeExecuted: requestedMode === 'safe',
    preflightOnly: definition.runtimeKind === 'preflight_only',
    safeEvidenceReviewRun: definition.runtimeKind === 'safe_evidence_only',
    confirmationEnvInjected: Boolean(definition.confirmationEnv),
    delegatedCommand: commandLabel(definition),
    childExecuted: true,
    childProcessExitedCleanly: child.exitCode === 0,
    childExitCode: child.exitCode,
    structuredResultReturned,
    expectedMode: definition.expectedMode,
    actualMode: child.actualMode,
    expectedModeReturned,
    childReportedOk: child.json?.ok === true,
    childReportedBlocked: child.json?.ok === false || stringField(child.json, 'status') === 'blocked',
    primaryBlocker: effectivePrimaryBlocker(toolId, child.json, selectedAccountRepairRequest),
    selectedAccountRepairRequest,
    ...repairSummary,
    runtimeSideEffects: child.runtimeSideEffects,
    runtimeSideEffectsAllFalse,
    runtimeSideEffectsAllFalseRequired: true,
    generatedLocalFixturePassedClaimed: false,
    stderrSummary: child.stderrSummary,
    recommendedNextCommand: 'npm run external-agent-tool-next-command',
    recommendedIndexedNextCommand: accountSelection.accountIndex
      ? `npm run external-agent-tool-next-command -- --account-index ${accountSelection.accountIndex}`
      : undefined,
  }
}

function toolDefinitions(indexedArgs: string[]): ToolDefinition[] {
  return [
    {
      toolId: 'qwen2_5_vl_7b_instruct',
      safeModes: ['safe', 'preflight'],
      runtimeKind: 'preflight_only',
      command: 'npm',
      args: ['run', 'external-agent-tool-execute-qwen', '--', '--preflight-only', '--json', ...indexedArgs],
      expectedMode: 'external_agent_qwen_execution_preflight_only_result',
    },
    {
      toolId: 'ai_video_broll_generation_wan',
      safeModes: ['safe', 'preflight'],
      runtimeKind: 'preflight_only',
      command: 'npm',
      args: [
        'run',
        'external-agent-tool-execute-broll-wan',
        '--',
        '--preflight-only',
        '--json',
        ...indexedArgs,
      ],
      expectedMode: 'external_agent_broll_wan_execution_preflight_only_result',
    },
    {
      toolId: 'sound_music_audio',
      safeModes: ['safe', 'evidence'],
      runtimeKind: 'safe_evidence_only',
      command: 'npm',
      args: ['run', 'external-agent-tool-execute-sound', '--', '--execute', '--json', ...indexedArgs],
      expectedMode: 'external_agent_sound_execution_evidence_review_result',
      confirmationEnv: SOUND_CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
    },
    {
      toolId: 'supabase_local_fixture_harness',
      safeModes: ['safe', 'evidence'],
      runtimeKind: 'safe_evidence_only',
      command: 'npm',
      args: ['run', 'external-agent-tool-execute-supabase-harness', '--', '--execute', '--json', ...indexedArgs],
      expectedMode: 'external_agent_supabase_harness_execution_evidence_review_result',
      confirmationEnv: SUPABASE_CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
    },
  ]
}

function runChild(definition: ToolDefinition) {
  const childEnv = {
    ...process.env,
    ...(definition.confirmationEnv
      ? { [definition.confirmationEnv]: definition.confirmationEnvRequiredValue }
      : {}),
  }
  const result = spawnSync(definition.command, definition.args, {
    cwd: process.cwd(),
    env: childEnv,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const json = parseJsonOutput(String(result.stdout ?? ''))

  return {
    exitCode: result.status,
    json,
    actualMode: stringField(json, 'mode'),
    runtimeSideEffects: runtimeSideEffectSnapshot(json),
    stderrSummary: sanitize(String(result.stderr ?? '')),
  }
}

function readToolSelection(): ToolSelection | undefined {
  const raw = readArgValue(['--tool', '--tool-id'])
  if (raw === 'all') return raw

  if (
    raw === 'qwen2_5_vl_7b_instruct' ||
    raw === 'ai_video_broll_generation_wan' ||
    raw === 'sound_music_audio' ||
    raw === 'supabase_local_fixture_harness'
  ) {
    return raw
  }

  return undefined
}

function readRequestedMode(): RequestedMode {
  const raw = readArgValue(['--mode']) ?? 'safe'
  if (raw === 'safe' || raw === 'preflight' || raw === 'evidence' || raw === 'runtime') return raw
  return 'safe'
}

function readArgValue(names: readonly string[]): string | undefined {
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

function selectedAccountIndex(): number | undefined {
  const rawIndex = readArgValue(ACCOUNT_INDEX_FLAGS)
  if (rawIndex === 'auto') return undefined
  const parsed = rawIndex ? Number(rawIndex) : undefined
  return Number.isInteger(parsed) && Number(parsed) > 0 ? Number(parsed) : undefined
}

function requestedAccountIndex(): string | undefined {
  return readArgValue(ACCOUNT_INDEX_FLAGS)
}

function resolveAccountSelection(
  toolId: ToolId,
  diagnosticOverride?: ReturnType<typeof runAccountDiagnostic>,
): AccountSelection {
  const requested = requestedAccountIndex()
  if (requested !== 'auto') {
    const accountIndex = selectedAccountIndex()
    return {
      requestedAccountIndex: requested,
      accountIndex,
      accountArgs: accountIndex ? ['--account-index', String(accountIndex)] : [],
      autoAccountSelectionRun: false,
    }
  }

  if (toolId === 'sound_music_audio' || toolId === 'supabase_local_fixture_harness') {
    return {
      requestedAccountIndex: requested,
      accountArgs: [],
      autoAccountSelectionRun: false,
      autoAccountSelection: {
        requested: 'auto',
        skipped: true,
        reason: 'selected_tool_does_not_use_gcloud_account_index',
      },
    }
  }

  const diagnostic = diagnosticOverride ?? runAccountDiagnostic()
  const accountIndex = chooseAccountIndex(toolId, diagnostic.json)
  return {
    requestedAccountIndex: requested,
    accountIndex,
    accountArgs: accountIndex ? ['--account-index', String(accountIndex)] : [],
    autoAccountSelectionRun: true,
    autoAccountSelection: {
      requested: 'auto',
      diagnosticOk: diagnostic.ok,
      accountCount: diagnostic.json?.accountCount,
      selectedAccountIndex: accountIndex,
      selectedAccountCandidateKind: accountIndexCandidateKind(toolId, diagnostic.json, accountIndex),
      anyAccountReadyForBoth: diagnostic.json?.anyAccountReadyForBoth === true,
      qwenReadyAccountCount: diagnostic.json?.qwenReadyAccountCount,
      brollQuotaReadAccountCount: diagnostic.json?.brollQuotaReadAccountCount,
      brollQuotaReadyAccountCount: diagnostic.json?.brollQuotaReadyAccountCount,
      runtimeSideEffectsAllFalse: Object.values(runtimeSideEffectSnapshot(diagnostic.json)).every(
        (value) => value === false,
      ),
      stderrSummary: diagnostic.stderrSummary,
    },
  }
}

function runAccountDiagnostic(): {
  ok: boolean
  json?: JsonRecord
  stderrSummary?: string
} {
  const result = spawnSync('npx', ['tsx', 'server/cli/external-agent-gcloud-account-access-diagnostic.ts', '--json'], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 32,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const json = parseJsonOutput(String(result.stdout ?? ''))

  return {
    ok: result.status === 0 && Boolean(json),
    json,
    stderrSummary: sanitize(String(result.stderr ?? '')),
  }
}

function chooseAccountIndex(toolId: ToolId, diagnostic: JsonRecord | undefined): number | undefined {
  const accounts = accountDiagnosticRows(diagnostic)
  const readyAccount = accounts.find((account) => accountReadyForTool(toolId, account))
  const fallbackAccount = accounts.find((account) => account.tokenRefreshPassed === true)
  const selected = readyAccount ?? fallbackAccount
  const index = selected?.accountIndex
  return typeof index === 'number' && Number.isInteger(index) && index > 0 ? index : undefined
}

function accountIndexCandidateKind(
  toolId: ToolId,
  diagnostic: JsonRecord | undefined,
  accountIndex: number | undefined,
): string | undefined {
  if (!accountIndex) return 'none'
  const account = accountDiagnosticRows(diagnostic).find((candidate) => candidate.accountIndex === accountIndex)
  if (!account) return 'none'
  if (accountReadyForTool(toolId, account)) return 'tool_ready'
  if (account.tokenRefreshPassed === true) return 'token_refresh_only_fallback'
  return 'not_ready'
}

function accountDiagnosticRows(diagnostic: JsonRecord | undefined): JsonRecord[] {
  const rows = diagnostic?.accountDiagnostics
  return Array.isArray(rows)
    ? rows.filter((row): row is JsonRecord => Boolean(row) && typeof row === 'object' && !Array.isArray(row))
    : []
}

function accountReadyForTool(toolId: ToolId, account: JsonRecord): boolean {
  if (toolId === 'qwen2_5_vl_7b_instruct') return account.qwenReadAccessPassed === true
  if (toolId === 'ai_video_broll_generation_wan') return account.brollQuotaSufficient === true
  return false
}

function accountSelectionOutput(selection: AccountSelection): JsonRecord {
  return {
    requestedAccountIndex: selection.requestedAccountIndex,
    accountIndexAutoRequested: selection.requestedAccountIndex === 'auto',
    autoAccountSelectionRun: selection.autoAccountSelectionRun,
    autoAccountSelection: selection.autoAccountSelection,
  }
}

function blockedResult(
  reason: string,
  requestedMode: RequestedMode,
  accountIndex: number | undefined,
  rawToolId?: string,
) {
  return {
    ok: false,
    mode: 'external_agent_tool_run_blocked',
    status: 'blocked',
    toolId: rawToolId,
    requestedMode,
    accountIndex,
    agentCallableNow: false,
    runtimeExecutableNow: false,
    blocker: reason,
    supportedToolIds: [
      'all',
      'qwen2_5_vl_7b_instruct',
      'ai_video_broll_generation_wan',
      'sound_music_audio',
      'supabase_local_fixture_harness',
    ],
    runtimeSideEffects: allRuntimeSideEffectsFalse(),
    runtimeSideEffectsAllFalse: true,
    childExecuted: false,
    generatedLocalFixturePassedClaimed: false,
  }
}

function runtimeSideEffectSnapshot(json: JsonRecord | undefined): Record<string, boolean> {
  return Object.fromEntries(runtimeSideEffectKeys.map((key) => [key, json?.[key] === true]))
}

function allRuntimeSideEffectsFalse(): Record<string, boolean> {
  return Object.fromEntries(runtimeSideEffectKeys.map((key) => [key, false]))
}

function commandLabel(definition: ToolDefinition): string {
  return [definition.command, ...definition.args].join(' ')
}

function primaryBlocker(json: JsonRecord | undefined): string | undefined {
  const blockers = json?.blockers
  if (Array.isArray(blockers)) return blockers.find((blocker): blocker is string => typeof blocker === 'string')

  return (
    stringField(json, 'blocker') ??
    nestedString(json, ['liveGate', 'liveVerifier', 'preflight', 'qwenBlocker']) ??
    nestedString(json, ['liveGate', 'liveVerifier', 'preflight', 'brollBlocker'])
  )
}

function effectivePrimaryBlocker(
  toolId: ToolId,
  json: JsonRecord | undefined,
  selectedAccountRepairRequest: JsonRecord | undefined,
): string | undefined {
  if (selectedAccountRepairRequest?.gcpOwnerRepairRequired === true) {
    if (toolId === 'qwen2_5_vl_7b_instruct') {
      return 'gcloud_account_lacks_qwen_cloud_run_read_access_or_resources_missing'
    }

    if (toolId === 'ai_video_broll_generation_wan') {
      return 'gcloud_account_lacks_compute_quota_read_access'
    }
  }

  return primaryBlocker(json)
}

function repairSummaryFrom(toolId: ToolId, selectedAccountRepairRequest: JsonRecord | undefined): JsonRecord {
  if (!selectedAccountRepairRequest) {
    return {
      gcpOwnerRepairRequired: false,
      tokenRepairRequired: false,
      missingReadPermissions: [],
      likelyMinimalRoles: [],
      postRepairVerificationCommands: [],
    }
  }

  const missingReadPermissions = missingPermissionsForTool(
    toolId,
    selectedAccountRepairRequest.missingReadPermissions,
  )

  return {
    gcpOwnerRepairRequired: selectedAccountRepairRequest.gcpOwnerRepairRequired === true,
    tokenRepairRequired: selectedAccountRepairRequest.tokenRepairRequired === true,
    missingReadPermissions,
    likelyMinimalRoles: selectedAccountRepairRequest.likelyMinimalRoles,
    postRepairVerificationCommands: selectedAccountRepairRequest.postRepairVerificationCommands,
  }
}

function missingPermissionsForTool(toolId: ToolId, value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) return []

  return value.filter((item): item is JsonRecord => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false
    return (item as JsonRecord).toolId === toolId
  })
}

function nestedRecord(document: JsonRecord | undefined, keys: string[]): JsonRecord | undefined {
  const value = nestedUnknown(document, keys)
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : undefined
}

function nestedString(document: JsonRecord | undefined, keys: string[]): string | undefined {
  const value = nestedUnknown(document, keys)
  return typeof value === 'string' ? value : undefined
}

function nestedUnknown(document: JsonRecord | undefined, keys: string[]): unknown {
  let value: unknown = document
  for (const key of keys) {
    if (!value || typeof value !== 'object' || !(key in value)) return undefined
    value = (value as JsonRecord)[key]
  }

  return value
}

function stringField(json: JsonRecord | undefined, key: string): string | undefined {
  const value = json?.[key]
  return typeof value === 'string' ? value : undefined
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
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, 'redacted_email')
    .trim()

  return sanitized ? sanitized.slice(0, 1200) : undefined
}

function print(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

main()
