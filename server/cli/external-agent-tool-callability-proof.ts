import { spawnSync } from 'node:child_process'

type JsonRecord = Record<string, unknown>

type ChildCall = {
  id: string
  toolId: string
  command: string
  args: string[]
  expectedMode: string
  confirmationEnv?: string
  confirmationEnvRequiredValue?: 'true'
  runtimeKind: 'preflight_only' | 'safe_evidence_only'
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

function readArgValue(names: readonly string[]): string | undefined {
  for (const name of names) {
    const equalsPrefix = `${name}=`
    const equalsMatch = process.argv.find((arg) => arg.startsWith(equalsPrefix))
    if (equalsMatch) return equalsMatch.slice(equalsPrefix.length + 0).trim()

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

function childCalls(): ChildCall[] {
  const indexedArgs = accountArgs()

  return [
    {
      id: 'qwen_preflight_wrapper',
      toolId: 'qwen2_5_vl_7b_instruct',
      command: 'npm',
      args: ['run', 'external-agent-tool-execute-qwen', '--', '--preflight-only', '--json', ...indexedArgs],
      expectedMode: 'external_agent_qwen_execution_preflight_only_result',
      runtimeKind: 'preflight_only',
    },
    {
      id: 'broll_wan_preflight_wrapper',
      toolId: 'ai_video_broll_generation_wan',
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
      runtimeKind: 'preflight_only',
    },
    {
      id: 'sound_safe_evidence_wrapper',
      toolId: 'sound_music_audio',
      command: 'npm',
      args: ['run', 'external-agent-tool-execute-sound', '--', '--execute', '--json', ...indexedArgs],
      expectedMode: 'external_agent_sound_execution_evidence_review_result',
      confirmationEnv: SOUND_CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
      runtimeKind: 'safe_evidence_only',
    },
    {
      id: 'supabase_harness_safe_evidence_wrapper',
      toolId: 'supabase_local_fixture_harness',
      command: 'npm',
      args: ['run', 'external-agent-tool-execute-supabase-harness', '--', '--execute', '--json', ...indexedArgs],
      expectedMode: 'external_agent_supabase_harness_execution_evidence_review_result',
      confirmationEnv: SUPABASE_CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
      runtimeKind: 'safe_evidence_only',
    },
  ]
}

function main() {
  const calls = childCalls().map(runChildCall)
  const runtimeExecutableToolIds: string[] = []
  const externalAgentCallableToolIds = calls.map((call) => call.toolId)
  const safeEvidenceExecutableToolIds = calls
    .filter((call) => call.runtimeKind === 'safe_evidence_only')
    .map((call) => call.toolId)
  const preflightCallableToolIds = calls
    .filter((call) => call.runtimeKind === 'preflight_only')
    .map((call) => call.toolId)
  const allStructuredCallsReturned = calls.every((call) => call.structuredResultReturned)
  const allExpectedModesReturned = calls.every((call) => call.expectedModeReturned)
  const runtimeSideEffectsAllFalse = calls.every((call) => call.runtimeSideEffectsAllFalse)

  print({
    ok: allStructuredCallsReturned && allExpectedModesReturned && runtimeSideEffectsAllFalse,
    decision: 'external_agent_tool_callability_proof_completed_runtime_still_blocked',
    mode: 'external_agent_tool_callability_proof_result',
    accountIndex: selectedAccountIndex(),
    paidProductionInScope: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
    externalAgentCallableToolCount: externalAgentCallableToolIds.length,
    externalAgentCallableToolIds,
    preflightCallableToolIds,
    safeEvidenceExecutableToolIds,
    safeEvidenceExecutableToolCount: safeEvidenceExecutableToolIds.length,
    runtimeExecutableToolCount: runtimeExecutableToolIds.length,
    runtimeExecutableToolIds,
    readyForAnyExternalAgentRuntimeExecutionNow: false,
    allStructuredCallsReturned,
    allExpectedModesReturned,
    runtimeSideEffectsAllFalse,
    wrapperCalls: calls,
    runtimeSideEffects: Object.fromEntries(runtimeSideEffectKeys.map((key) => [key, false])),
    forbiddenRuntimeActions: [
      'do not run Qwen execution without the explicit runtime gate and live preflight',
      'do not run Wan GPU VM or inference from this callability proof',
      'do not run Supabase CLI, Docker, SQL, storage, signed URLs, or cloud mutation',
      'do not call providers or dispatch workers',
      'do not create generated assets or unlock beta/production',
    ],
    recommendedNextCommand: 'npm run external-agent-tool-next-command',
    recommendedIndexedNextCommand: selectedAccountIndex()
      ? `npm run external-agent-tool-next-command -- --account-index ${selectedAccountIndex()}`
      : undefined,
  })
}

function runChildCall(call: ChildCall) {
  const childEnv = {
    ...process.env,
    ...(call.confirmationEnv ? { [call.confirmationEnv]: call.confirmationEnvRequiredValue } : {}),
  }
  const result = spawnSync(call.command, call.args, {
    cwd: process.cwd(),
    env: childEnv,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 32,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const json = parseJsonOutput(String(result.stdout ?? ''))
  const mode = stringField(json, 'mode')
  const runtimeFlags = runtimeSideEffectSnapshot(json)

  return {
    id: call.id,
    toolId: call.toolId,
    runtimeKind: call.runtimeKind,
    command: [call.command, ...call.args].join(' '),
    confirmationEnv: call.confirmationEnv,
    confirmationEnvInjected: Boolean(call.confirmationEnv),
    processExitedCleanly: result.status === 0,
    exitCode: result.status,
    structuredResultReturned: Boolean(json),
    expectedMode: call.expectedMode,
    actualMode: mode,
    expectedModeReturned: mode === call.expectedMode,
    wrapperReportedOk: json?.ok === true,
    wrapperReportedBlocked: json?.ok === false || stringField(json, 'status') === 'blocked',
    safeEvidenceReviewRun: json?.safeEvidenceReviewRun === true,
    safeEvidenceReviewCompleted: json?.safeEvidenceReviewCompleted === true,
    runtimeSideEffectsAllFalse: Object.values(runtimeFlags).every((value) => value === false),
    runtimeSideEffects: runtimeFlags,
    primaryBlocker: primaryBlocker(json),
    selectedAccountRepairRequest: nestedRecord(json, ['selectedAccountRepairRequest']) ??
      nestedRecord(json, ['liveGate', 'liveVerifier', 'accountAccessDiagnostic', 'selectedAccountRepairRequest']),
    stderrSummary: sanitize(String(result.stderr ?? '')),
  }
}

function runtimeSideEffectSnapshot(json: JsonRecord | undefined): Record<string, boolean> {
  return Object.fromEntries(runtimeSideEffectKeys.map((key) => [key, json?.[key] === true]))
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
