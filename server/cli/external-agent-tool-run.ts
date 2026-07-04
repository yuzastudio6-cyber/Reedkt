import { spawnSync } from 'node:child_process'

type JsonRecord = Record<string, unknown>
type ToolId =
  | 'qwen2_5_vl_7b_instruct'
  | 'ai_video_broll_generation_wan'
  | 'sound_music_audio'
  | 'supabase_local_fixture_harness'
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
  const toolId = readToolId()
  const requestedMode = readRequestedMode()
  const accountIndex = selectedAccountIndex()

  if (!toolId) {
    print(blockedResult('missing_or_invalid_tool_id', requestedMode, accountIndex))
    return
  }

  const definition = toolDefinitions(accountArgs()).find((candidate) => candidate.toolId === toolId)
  if (!definition) {
    print(blockedResult('unsupported_tool_id', requestedMode, accountIndex, toolId))
    return
  }

  if (requestedMode === 'runtime') {
    print({
      ok: false,
      mode: 'external_agent_tool_run_runtime_blocked',
      status: 'blocked',
      toolId,
      requestedMode,
      accountIndex,
      agentCallableNow: true,
      runtimeExecutableNow: false,
      runtimeKind: definition.runtimeKind,
      blocker: 'runtime_execution_not_allowed_by_current_gate',
      runtimeSideEffects: allRuntimeSideEffectsFalse(),
      runtimeSideEffectsAllFalse: true,
      delegatedCommand: commandLabel(definition),
      childExecuted: false,
      recommendedNextCommand: 'npm run external-agent-tool-next-command',
      recommendedIndexedNextCommand: accountIndex
        ? `npm run external-agent-tool-next-command -- --account-index ${accountIndex}`
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
      accountIndex,
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

  const child = runChild(definition)
  const expectedModeReturned = child.actualMode === definition.expectedMode
  const runtimeSideEffectsAllFalse = Object.values(child.runtimeSideEffects).every((value) => value === false)
  const structuredResultReturned = Boolean(child.json)

  print({
    ok: structuredResultReturned && expectedModeReturned && runtimeSideEffectsAllFalse,
    decision: 'external_agent_tool_run_completed_runtime_still_blocked',
    mode: 'external_agent_tool_run_result',
    status: 'safe_wrapper_completed',
    toolId,
    requestedMode,
    accountIndex,
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
    primaryBlocker: primaryBlocker(child.json),
    selectedAccountRepairRequest:
      nestedRecord(child.json, ['selectedAccountRepairRequest']) ??
      nestedRecord(child.json, [
        'liveGate',
        'liveVerifier',
        'accountAccessDiagnostic',
        'selectedAccountRepairRequest',
      ]),
    runtimeSideEffects: child.runtimeSideEffects,
    runtimeSideEffectsAllFalse,
    runtimeSideEffectsAllFalseRequired: true,
    generatedLocalFixturePassedClaimed: false,
    stderrSummary: child.stderrSummary,
    recommendedNextCommand: 'npm run external-agent-tool-next-command',
    recommendedIndexedNextCommand: accountIndex
      ? `npm run external-agent-tool-next-command -- --account-index ${accountIndex}`
      : undefined,
  })
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

function readToolId(): ToolId | undefined {
  const raw = readArgValue(['--tool', '--tool-id'])
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
  const parsed = rawIndex ? Number(rawIndex) : undefined
  return Number.isInteger(parsed) && Number(parsed) > 0 ? Number(parsed) : undefined
}

function accountArgs(): string[] {
  const index = selectedAccountIndex()
  return index ? ['--account-index', String(index)] : []
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
